// v0.10 Echo battles. The stage may animate between questions and on the result screen; study and question screens are still and quiet
// (data-quiet silences the delegated button sounds; the one soft submit sound is played by Check).
import React, { useEffect, useReducer, useRef, useState } from 'react';
import { PxIcon } from './game/PxIcon.jsx';
import { PixelBar } from './game/PixelBar.jsx';
import { DialogueBox } from './game/DialogueBox.jsx';
import { Portrait, PixelFace } from '../pixel/Faces.jsx';
import { Sprite } from '../pixel/core.js';
import { keeperSprite, forgettingSprite } from '../pixel/keeper.js';
import { ArtImg, artFind, SCENE_TOKENS, SKILL_TOKENS } from './artLookup.jsx';
import { sfx } from '../audio/sfx.js';
import { today } from '../engine/core.js';
import { dollSpec, effects } from '../engine/character.js';
import { pullEntries, newBattle, enemyFor, coachFor, current, isRetry, answer, skip, useHint, aids, leave, settle, buildScene, techniqueResult, echoOffer, canFight, sceneOpen, RESOLVE, MIN_ITEMS } from '../engine/battle.js';
import { ensureVigil, newVigil, pullVigilEntries, settleVigil, lanternState, endText, endBand, vigilOffer, canKeepVigil, vigilOpen } from '../engine/vigil.js';
import { VIGIL_HONEST, VIGIL_COACH, PHANTOM_LINES, LANTERN_LIT, LANTERN_DIM, VIGIL_SKIP, VIGIL_END, LEDGER_TEXT } from '../data/vigil.js';
import { COACHES, ECHO_BEAT, ECHO_HONEST, ECHO_HOOK, SCENES, SCENE_ORDER, TECHNIQUES, COACH_ASK } from '../data/echo.js';
import { MODULES } from '../data/curriculum.js';
import { BattleVoice } from './Voices.jsx';
import { auditOpen } from '../engine/audit.js';

const districtOf = (id) => MODULES.find((m) => m.id === id)?.district || id;

// ---------- the stage ----------
function Resolve({ n }) {
  return <div className="resolve" role="img" aria-label={`Resolve ${n} of ${RESOLVE}`}>{Array.from({ length: RESOLVE }, (_, i) => <i key={i} className={i < n ? 'on' : ''} />)}</div>;
}

function Stage({ profile, enemy, hp, hpMax, resolve, mood = 'idle', fx = '', scene }) {
  const doll = React.useMemo(() => keeperSprite(dollSpec(profile)), [profile]);
  const sprite = React.useMemo(() => forgettingSprite(enemy.skill, mood), [enemy.skill, mood]);
  const bgId = artFind(['battle', 'backdrop', 'bg'], SCENE_TOKENS[scene || 'shore']);
  const enemyId = artFind(['enemy', 'forgetting'], SKILL_TOKENS[enemy.skill] || []);
  const hasBg = !!bgId, hasEnemy = !!enemyId;
  return (
    <div className={`battle-stage ${fx} ${hasBg ? 'has-art' : ''}`}>
      {hasBg && <ArtImg id={bgId} className="stage-bg" alt="" />}
      <div className="stage-enemy">
        <p className="stage-name"><b>{enemy.name}</b> <span className="muted small">holds {enemy.kind}</span></p>
        <PixelBar value={hp} max={hpMax} tone="tide" size="md" label={`${enemy.name} holds ${Math.ceil(hp * 2) / 2} of ${hpMax} memories' weight`} />
        <div className={`enemy-sprite ${mood}`}>
          {hasEnemy ? <ArtImg id={enemyId} className="enemy-art" alt={`${enemy.name}, a Forgetting`} /> : <Sprite sprite={sprite} scale={4} label={`${enemy.name}, a Forgetting`} />}
        </div>
      </div>
      <div className="stage-keeper">
        <Sprite sprite={doll} scale={3} label="Your Keeper" className="keeper-sprite" />
        <Resolve n={resolve} />
        <span className="small muted">Resolve</span>
      </div>
    </div>
  );
}

// The Long Vigil stage: a row of lanterns on the battlements and one soft, faceless phantom. No Forgetting, no Resolve.
const pick = (list, n) => list[n % list.length];
function VigilStage({ b, fx = '' }) {
  const bgId = artFind(['backdrop', 'bg'], ['vigil']);
  const e = current(b);
  return (
    <div className={`battle-stage vigil-stage ${fx} ${bgId ? 'has-art' : ''}`}>
      {bgId && <ArtImg id={bgId} className="stage-bg" alt="" />}
      <div className="vigil-row" role="img" aria-label={`Lanterns: ${b.entries.filter((x) => lanternState(b, x) === 'lit').length} lit of ${b.entries.length}`}>
        {b.entries.map((x) => <i key={x.key} className={`lantern ${lanternState(b, x)}${e && e.key === x.key ? ' here' : ''}`} />)}
      </div>
      {e && <div className="phantom" aria-hidden="true"><i /></div>}
    </div>
  );
}

// ---------- study (scenes) ----------
function Study({ sc, seconds, onDone }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => { const id = setInterval(() => setLeft((v) => v - 1), 1000); return () => clearInterval(id); }, []);
  useEffect(() => { if (left <= 0) onDone(); }, [left]);
  return (
    <section className="card drill battle-study" data-quiet>
      <span className="tag">Study · {Math.max(0, left)}s</span>
      <h2>{sc.scene.title}</h2>
      <ul className="study-rows">{sc.study.map((r, i) => (
        <li key={i}>{r.face != null ? <PixelFace seed={r.face} size={48} scale={2} /> : <b className="muted">{r.label}</b>}<span>{r.text}</span></li>
      ))}</ul>
      <button className="btn primary" onClick={onDone}>Done studying</button>
    </section>
  );
}

function Distract({ q, onDone }) {
  const [v, setV] = useState('');
  return (
    <form className="card drill" data-quiet onSubmit={(e) => { e.preventDefault(); onDone(); }}>
      <span className="tag">A small interruption</span>
      <h2>{q.q}</h2>
      <p className="muted small">There is no penalty. This only gets your mind off the list for a moment.</p>
      <label className="field">Your answer<input autoFocus autoComplete="off" inputMode="numeric" value={v} onChange={(e) => setV(e.target.value)} /></label>
      <button className="btn primary">Go on</button>
    </form>
  );
}

// ---------- the battle ----------
export default function Battle({ profile, update, mode, onExit }) {
  const [, force] = useReducer((x) => x + 1, 0);
  const seed = useRef(Math.floor(Math.random() * 1e9)).current;
  const setup = useRef(null);
  if (!setup.current) {
    const fx = effects(profile);
    if (mode === 'vigil') {
      const entries = pullVigilEntries(profile, seed);
      setup.current = { entries, scene: 'vigil', vigil: true, b: newVigil(entries, { ...fx }), enemy: { skill: entries[0]?.skill || 'imagery', name: 'The Long Vigil', kind: '', skills: [], hp: 0 }, coach: 'tansy' };
    } else if (mode === 'echo') {
      const entries = pullEntries(profile, seed);
      setup.current = { entries, scene: null, b: newBattle(entries, { ...fx }), enemy: entries.length ? enemyFor(entries) : null, coach: entries.length ? coachFor(profile, entries) : 'wren' };
    } else {
      const sc = buildScene(mode, seed, profile);
      setup.current = { entries: sc.entries, sc, scene: mode, b: newBattle(sc.entries, { ...fx, scene: mode }), enemy: { ...enemyFor(sc.entries), skill: sc.entries[0].skill }, coach: SCENES[mode].coach };
    }
  }
  const { b, enemy, sc, scene, vigil } = setup.current;
  const turnNo = useRef(0);
  const coachId = COACHES[setup.current.coach] && (!COACHES[setup.current.coach].gate || profile.progress.gates.includes(COACHES[setup.current.coach].gate)) ? setup.current.coach : 'wren';
  const coach = COACHES[coachId];
  const [phase, setPhase] = useState('intro');
  const [tech, setTech] = useState(null);
  const [val, setVal] = useState('');
  const [hint, setHint] = useState(null);
  const [lantern, setLantern] = useState(null);
  const [fb, setFb] = useState(null);
  const [mood, setMood] = useState('idle');
  const [out, setOut] = useState(null);
  const saved = useRef(false);

  if (!enemy || b.entries.length < MIN_ITEMS) {
    return (
      <div className="page battle"><section className="card"><h2>{vigil ? 'No phantoms tonight' : 'Nothing to echo yet'}</h2><p className="muted">{vigil ? 'The Vigil asks for things you learned at least a day ago. Finish a few more sessions and come back.' : 'Echoes gather around things you learned at least a day ago. Finish a few sessions and come back.'}</p><button className="btn" onClick={onExit}>Back</button></section></div>
    );
  }

  const e = current(b);
  const finish = () => {
    if (!saved.current) { saved.current = true; update((p) => { setOut(vigil ? settleVigil(p, b) : settle(p, b)); }); }
    setMood(b.outcome === 'won' ? 'fade' : 'idle');
    setPhase('result');
  };
  const begin = () => {
    if (mode === 'echo' && !profile.story.seen.includes(ECHO_BEAT.id)) update((p) => { p.story.seen = [...new Set([...p.story.seen, ECHO_BEAT.id])]; });
    setPhase(mode === 'echo' || vigil ? 'turn' : 'technique');
  };
  const afterStudy = () => setPhase(sc.distraction ? 'distract' : 'turn');

  function submit(ev) {
    ev.preventDefault();
    if (!val.trim() || !e) return;
    sfx.soft();
    const r = answer(b, val);
    if (r.lantern) { setLantern(r.letter); setVal(''); force(); return; }
    setFb(r); setLantern(null); setHint(null); setVal('');
    setMood(r.ok ? 'hurt' : 'idle');
    turnNo.current++;
    setPhase('feedback');
  }
  const next = () => { setMood('idle'); if (b.over) finish(); else setPhase('turn'); };
  const hintClick = () => { setHint(useHint(b)); force(); };
  const doSkip = () => { skip(b); setHint(null); setLantern(null); if (b.over) finish(); else force(); };
  const quit = () => { leave(b); onExit(); };

  const stage = (fx) => vigil ? <VigilStage b={b} fx={fx} /> : <Stage profile={profile} enemy={enemy} hp={b.hp} hpMax={b.hpMax} resolve={b.resolve} mood={mood} fx={fx} scene={scene} />;

  if (phase === 'intro') {
    const first = mode === 'echo' && !profile.story.seen.includes(ECHO_BEAT.id);
    return (
      <div className="page battle">
        <h1 className="page-title"><PxIcon name="crypt" size={36} />{vigil ? SCENES.vigil.title : scene ? sc.scene.title : 'A Memory Echo stirs'}</h1>
        {stage('fx')}
        {first && <section className="card parchment"><span className="tag">Story</span><h3>{ECHO_BEAT.title}</h3>{ECHO_BEAT.text.map((t, i) => <p key={i} className="story-text">{t}</p>)}</section>}
        <DialogueBox speaker={coach.name} portrait={<Portrait id={coachId} mood="neutral" scale={2} />} lines={vigil ? [SCENES.vigil.intro, VIGIL_COACH.before[0]] : scene ? [sc.scene.intro, ...coach.before.slice(0, 1)] : coach.before} />
        {!scene && <BattleVoice profile={profile} skill={enemy.skill} />}
        <section className="card">
          {vigil
            ? <p className="small">{b.entries.length} phantoms carry things you learned some days ago. Say what each one carries and its lantern lights. A miss only dims the lantern, shows you the answer, and the phantom comes round again. You can let one wait, or leave, with no penalty. Nothing here changes your skill estimates.</p>
            : scene
            ? <p className="small">Made-up material to practise the methods. A scene earns nothing; it is only practice.</p>
            : <p className="small">{enemy.name} holds {b.entries.length} things you learned earlier, from {enemy.skills.length === 1 ? 'one skill' : `${enemy.skills.length} skills`}. Each question tells you why it came up. You have {RESOLVE} Resolve. A miss shows you the answer and you will be asked again. You can skip one question or leave at any time, with no penalty.</p>}
          <p className="muted small">{vigil ? VIGIL_HONEST : ECHO_HONEST}</p>
          <div className="row wrap"><button className="btn primary" autoFocus onClick={begin}>{vigil ? 'Climb the stair' : scene ? 'Choose a move' : 'Face the Echo'}</button><button className="btn ghost" onClick={onExit}>Not now</button></div>
        </section>
      </div>
    );
  }

  if (phase === 'technique') {
    const res = tech ? techniqueResult(mode, tech) : null;
    return (
      <div className="page battle">
        <DialogueBox speaker={coach.name} portrait={<Portrait id={coachId} mood="neutral" scale={2} />} lines={[COACH_ASK]} />
        <section className="card" data-quiet>
          <h3 className="panel-title">Choose a move</h3>
          <div className="tech-grid">{TECHNIQUES.map((t) => (
            <button key={t.id} className={`btn tech${tech === t.id ? ' on' : ''}`} aria-pressed={tech === t.id} onClick={() => setTech(t.id)}><b>{t.name}</b><span className="small">{t.blurb}</span></button>
          ))}</div>
          {res && <p className={`note ${res.good ? 'good' : ''}`} role="status">{res.tip}</p>}
          <button className="btn primary" disabled={!tech} onClick={() => setPhase('study')}>Start studying</button>
        </section>
      </div>
    );
  }

  if (phase === 'study') return <div className="page battle"><Study sc={sc} seconds={Math.round(sc.studySeconds * (tech ? techniqueResult(mode, tech).studyMult : 1))} onDone={afterStudy} /></div>;
  if (phase === 'distract') return <div className="page battle"><Distract q={sc.distraction} onDone={() => setPhase('turn')} /></div>;

  if (phase === 'turn' && e) {
    const a = aids(b);
    const retry = isRetry(b);
    return (
      <div className="page battle">
        {stage('still')}
        <section className="card drill battle-turn" data-quiet>
          <span className="tag">{vigil ? `Phantom ${b.entries.findIndex((x) => x.key === e.key) + 1} of ${b.entries.length} · about ${e.bucket} day${e.bucket === 1 ? '' : 's'} old` : e.fmt}{retry ? ' · asked again' : ''}</span>
          {vigil && <p className="small vigil-line">{pick(PHANTOM_LINES.arrive, turnNo.current)} {pick(PHANTOM_LINES.carries[e.bucket], turnNo.current)}</p>}
          <p className="muted small reason">{e.reason}</p>
          {retry && <p className="note">You saw this answer a moment ago. It earns nothing, but it helps it stick.</p>}
          {e.face != null && <PixelFace seed={e.face} size={48} scale={4} />}
          <h2 className="battle-q">{e.prompt}</h2>
          {vigil && <p className="muted small">{pick(PHANTOM_LINES.ask, turnNo.current)}</p>}
          {a.count != null && <p className="small">Scroll of Order: the list had {a.count} items.</p>}
          {a.emptyStops && <p className="small">Palace Map: stops still empty: {a.emptyStops.join(', ')}.</p>}
          {hint && <p className="note">{hint}.{vigil ? '' : ' This answer deals half damage.'}</p>}
          {lantern && <p className="note" role="status">The lantern glows. {lantern}. Try once more.</p>}
          <form onSubmit={submit}>
            <label className="field">Your answer<input autoFocus autoComplete="off" autoCapitalize="off" spellCheck="false" value={val} onChange={(ev) => setVal(ev.target.value)} /></label>
            <div className="row wrap">
              <button className="btn primary" disabled={!val.trim()}>Check</button>
              {!hint && !retry && <button type="button" className="btn small" onClick={hintClick}>{vigil ? 'Use a hint' : 'Use a hint (half damage)'}</button>}
              {!b.skipUsed && !retry && <button type="button" className="btn small" onClick={doSkip}>{vigil ? VIGIL_SKIP.button : 'Skip this one'}</button>}
              <button type="button" className="btn ghost small" onClick={quit}>{vigil ? 'Leave the watch' : 'Leave the battle'}</button>
            </div>
          </form>
        </section>
      </div>
    );
  }

  if (phase === 'feedback' && fb) {
    return (
      <div className="page battle">
        {stage(fb.ok ? 'fx hit' : 'fx miss')}
        <section className="card battle-feedback" role="status">
          {vigil ? (fb.ok && !fb.retry
            ? <><span className="tag">Lantern lit</span><h2>Right.</h2><p className="small">{pick(LANTERN_LIT, turnNo.current)}</p></>
            : fb.ok
              ? <><span className="tag">Learned again</span><h2>Good. That is back in place.</h2></>
              : <><span className="tag">Lantern dim</span><h2>It carried: {fb.answer}</h2><p className="small">{pick(LANTERN_DIM, turnNo.current)}</p></>)
          : fb.ok
            ? <><span className="tag">{fb.retry ? 'Learned again' : fb.status === 'eased' ? 'Right, with help' : 'It held'}</span><h2>{fb.retry ? 'Good. That is back in place.' : fb.status === 'eased' ? 'Right. Half damage.' : 'Right.'}</h2></>
            : <><span className="tag">Not this time</span><h2>The answer was: {fb.answer}</h2><p className="muted small">{b.resolve > 0 && fb.status !== 'queued' ? 'You will be asked this one again in a moment. No Resolve is lost for asking again.' : 'It is saved for a quiet review next time.'}</p></>}
          <button className="btn primary" autoFocus onClick={next}>{b.over ? 'See the result' : 'Next question'}</button>
        </section>
      </div>
    );
  }

  // result
  const won = b.outcome === 'won';
  const queued = b.entries.filter((x) => b.state[x.key].status === 'queued');
  const missed = b.entries.filter((x) => ['relearned', 'queued'].includes(b.state[x.key].status));
  const closing = out?.quests?.includes('m12_echoes');
  if (vigil) {
    const band = endBand(b);
    return (
      <div className="page battle">
        {stage('fx')}
        <section className="card gold" role="status">
          <span className="tag">{b.outcome === 'left' ? 'The watch ends early' : `${band.lit} of ${band.total} lanterns lit`}</span>
          <h2>{b.outcome === 'left' ? 'The phantoms wait for another night.' : endText(b)}</h2>
          {b.outcome !== 'left' && VIGIL_END.closing.map((t, i) => <p key={i} className="small">{t}</p>)}
          <p className="small">{!out ? 'Saving.' : out.ledger ? LEDGER_TEXT.earned : b.outcome === 'left' ? '' : out.heldOld >= 2 ? LEDGER_TEXT.already : LEDGER_TEXT.none}</p>
          <p className="muted small">Nothing here changes your skill estimates, and the vigil earns no Lumen. {VIGIL_HONEST}</p>
        </section>
        {missed.length > 0 && (
          <section className="card">
            <h3 className="panel-title"><PxIcon name="scroll" size={24} />The dim lanterns</h3>
            <ul className="small">{missed.map((x) => <li key={x.key}>{x.face != null ? 'A face' : x.prompt} <b>{x.answer}</b></li>)}</ul>
            {queued.length > 0 && <p className="muted small">{queued.length} of these will come back first in a later Echo.</p>}
          </section>
        )}
        <DialogueBox speaker={coach.name} portrait={<Portrait id={coachId} mood={band.band === 'all' || band.band === 'most' ? 'smile' : 'neutral'} scale={2} />} lines={[band.band === 'all' || band.band === 'most' ? VIGIL_COACH.win : VIGIL_COACH.rest]} />
        <button className="btn primary big" autoFocus onClick={onExit}>Done</button>
      </div>
    );
  }
  return (
    <div className="page battle">
      {stage(won ? 'fx win' : 'fx')}
      <section className="card gold" role="status">
        <span className="tag">{won ? 'The Forgetting goes home' : 'The Echo fades for now'}</span>
        <h2>{won ? `${enemy.name} lets go and drifts away.` : 'A good try. Rest is part of the method.'}</h2>
        <p className="small">{scene ? 'Scenes are practice, so they earn nothing.' : out ? `Held on the first try: ${out.held}. Learned again: ${out.relearned}. ${out.lumen ? `Lumen earned: ${out.lumen}.` : 'No Lumen this time. Only old memories that held on the first try, without a hint, earn Lumen.'}` : 'Saving.'}</p>
        <p className="muted small">Nothing here changes your skill estimates. {ECHO_HONEST}</p>
      </section>
      {missed.length > 0 && (
        <section className="card">
          <h3 className="panel-title"><PxIcon name="scroll" size={24} />The answers</h3>
          <ul className="small">{missed.map((x) => <li key={x.key}>{x.face != null ? 'A face' : x.prompt} <b>{x.answer}</b></li>)}</ul>
          {queued.length > 0 && !scene && <p className="muted small">{queued.length} of these will come back first in a later Echo.</p>}
        </section>
      )}
      <DialogueBox speaker={coach.name} portrait={<Portrait id={coachId} mood={won ? 'smile' : 'worried'} scale={2} />} lines={[won ? coach.win : coach.rest]} />
      {!scene && <BattleVoice profile={profile} skill={enemy.skill} acc={b.entries.length ? b.entries.filter((x) => ['held', 'eased'].includes(b.state[x.key].status)).length / b.entries.length : 0} />}
      {closing && <section className="card parchment"><span className="tag">The Keepers' Circle</span>{ECHO_HOOK.map((t, i) => <p key={i} className="story-text">{t}</p>)}</section>}
      <button className="btn primary big" autoFocus onClick={onExit}>Done</button>
    </div>
  );
}

// ---------- entry points ----------
// Telegraphed on Today after the day's session. Always optional; "Not now" costs nothing.
export function EchoCard({ profile, update, onFight }) {
  const offer = echoOffer(profile);
  if (!offer) return null;
  return (
    <section className="card glass echo-card" data-testid="echo-card">
      <h3 className="panel-title"><PxIcon name="crypt" size={28} />A Memory Echo stirs</h3>
      <p className="small">{offer.reason} A Forgetting has gathered around it and waits to be remembered.</p>
      <p className="muted small">Optional, about 5 to 8 minutes, and you can leave at any time. It never changes your skill estimates.</p>
      <div className="row wrap">
        <button className="btn primary" onClick={() => onFight('echo')}>Face the Echo</button>
        <button className="btn ghost small" onClick={() => update((p) => { p.battles.skipped = today(p); })}>Not now</button>
      </div>
    </section>
  );
}

export function EchoHall({ profile, onFight }) {
  const b = profile.battles || {};
  const ready = canFight(profile);
  return (
    <section className="card" data-testid="echo-hall">
      <h3 className="panel-title"><PxIcon name="crypt" size={28} />Echo Hall</h3>
      <p className="small">Forgettings are what the Tide leaves behind. Meet one, and remember what it holds.</p>
      <p className="muted small">{b.done || 0} Echoes met · {b.held || 0} old memories held · {b.rests || 0} rests</p>
      <button className="btn primary" disabled={!ready} onClick={() => onFight('echo')}>Face an Echo</button>
      {!ready && <p className="muted small">Nothing is ready yet. Echoes gather around things you learned at least a day ago.</p>}
      <h4 className="set-sub">Practice scenes</h4>
      <p className="muted small">Made-up material to practise the methods in real-life settings. They earn nothing.</p>
      <div className="grounds">{SCENE_ORDER.map((id) => {
        const open = sceneOpen(profile, id);
        return <button key={id} className="ground" disabled={!open} onClick={() => onFight(id)}><PxIcon name={open ? 'quill' : 'lock'} size={28} /><b>{SCENES[id].title}</b><span className="small">{open ? 'Practice' : `Opens with ${districtOf(SCENES[id].gate)}`}</span></button>;
      })}</div>
      {auditOpen(profile) && (
        <>
          <h4 className="set-sub">Wren's Audit</h4>
          <p className="muted small">Wren walks a route aloud and slips. You name the kind of slip and fix it. It earns only lore and changes no score.</p>
          <button className="btn" onClick={() => onFight('audit')}>Walk a route with Wren</button>
        </>
      )}
      {vigilOpen(profile) && (
        <>
          <h4 className="set-sub">The Long Vigil</h4>
          <p className="muted small">On the Quay battlements, soft phantoms carry things you learned about a day, a week or a month ago. Lanterns light for answers that held. The Watch Ledger is given for items that held at a week or more. No Lumen, no pressure.</p>
          <button className="btn" disabled={!canKeepVigil(profile)} onClick={() => onFight('vigil')}>Keep the Long Vigil</button>
        </>
      )}
      <p className="muted small">{ECHO_HONEST}</p>
    </section>
  );
}

// Offered about once a week after the day's session. "Not now" costs nothing.
export function VigilCard({ profile, update, onFight }) {
  const offer = vigilOffer(profile);
  if (!offer) return null;
  return (
    <section className="card glass echo-card" data-testid="vigil-card">
      <h3 className="panel-title"><PxIcon name="crypt" size={28} />The Long Vigil</h3>
      <p className="small">It is the end of the week. Lanterns are set along the Quay battlements, and {offer.count} phantoms carry things you learned some days ago.</p>
      <p className="muted small">Optional, about 5 minutes, and you can leave at any time. It earns no Lumen and never changes your skill estimates.</p>
      <div className="row wrap">
        <button className="btn primary" onClick={() => onFight('vigil')}>Keep the vigil</button>
        <button className="btn ghost small" onClick={() => update((p) => { ensureVigil(p).skipped = today(p); })}>Not now</button>
      </div>
    </section>
  );
}
