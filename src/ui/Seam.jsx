// 1.1 Chapter 13: the Seam and the Great Forgetting. Reuses the Echo battle engine (src/engine/battle.js) on made-up material,
// one battle per phase, then the Stitch. Study and question screens are still and quiet (data-quiet); only the one soft submit sound.
// Never changes skill estimates, earns no Lumen, and a miss locks nothing. Pictures come through artFor with a text fallback.
import React, { useEffect, useReducer, useRef, useState } from 'react';
import { PxIcon } from './game/PxIcon.jsx';
import { PixelBar } from './game/PixelBar.jsx';
import { DialogueBox } from './game/DialogueBox.jsx';
import { Portrait, PixelFace } from '../pixel/Faces.jsx';
import { Sprite } from '../pixel/core.js';
import { keeperSprite, forgettingSprite } from '../pixel/keeper.js';
import { ArtImg, artFor } from './artLookup.jsx';
import { sfx } from '../audio/sfx.js';
import { dollSpec, effects } from '../engine/character.js';
import { current, isRetry, answer, skip, useHint, aids, leave, RESOLVE } from '../engine/battle.js';
import { sittingPlan, pickThread, buildPhase, newPhaseBattle, scoreStitch, startSitting, clearPhase, restSitting, settleStitch, finishEnding, endingPending, seamClosed, seamOpen, STITCH_COUNT } from '../engine/seam.js';
import { isHeld, accepts } from '../engine/wren.js';
import { tell } from '../data/story.js';
import { FORGETTING_HONEST, GREAT_FORGETTING, SEAM_UI, BOSS_INTRO, BOSS_STITCH, BOSS_WINDER, BOSS_ENDING, BOSS_LINES, SECOND_EPILOGUE, BOSS_EPILOGUE, FACE_DETAILS, PORTRAIT_NOTE } from '../data/forgetting.js';
import { Q_BY_ID } from '../data/wren.js';

const pick = (list, n) => list[Math.abs(n) % list.length];

function Resolve({ n }) {
  return <div className="resolve" role="img" aria-label={`Resolve ${n} of ${RESOLVE}`}>{Array.from({ length: RESOLVE }, (_, i) => <i key={i} className={i < n ? 'on' : ''} />)}</div>;
}

// The giant on the water, still. hp is the weight of what the phase still holds.
function BossStage({ profile, hp, hpMax, resolve, label }) {
  const doll = React.useMemo(() => keeperSprite(dollSpec(profile)), [profile]);
  const sprite = React.useMemo(() => forgettingSprite('imagery', 'idle'), []);
  const hasArt = !!artFor('boss_great_forgetting');
  return (
    <div className="battle-stage seam-stage">
      <div className="stage-enemy">
        <p className="stage-name"><b>The Great Forgetting</b> <span className="muted small">{label}</span></p>
        {hpMax > 0 && <PixelBar value={hp} max={hpMax} tone="tide" size="md" label={`The Great Forgetting holds ${Math.ceil(hp * 2) / 2} of ${hpMax} days' weight in this part`} />}
        <div className="enemy-sprite idle">
          {hasArt ? <ArtImg id="boss_great_forgetting" className="enemy-art" alt="The Great Forgetting, a towering hooded giant of grey mist with a pale glow for a face" /> : <Sprite sprite={sprite} scale={6} label="The Great Forgetting" />}
        </div>
      </div>
      <div className="stage-keeper">
        <Sprite sprite={doll} scale={3} label="Your Keeper" className="keeper-sprite" />
        {resolve != null && <><Resolve n={resolve} /><span className="small muted">Resolve</span></>}
      </div>
    </div>
  );
}

// A page of story: parchment card, optional picture (a missing picture is simply not shown), one button.
function Page({ tag, title, paras, art, onDone, label = 'Continue', profile, children }) {
  return (
    <section className="card parchment story seam-page">
      {tag && <span className="tag">{tag}</span>}
      <h2>{title}</h2>
      {art && artFor(art) && <ArtImg id={art} className="seam-art" />}
      {paras.map((t, i) => <p key={i} className="story-text">{tell(t, profile)}</p>)}
      {children}
      <button className="btn primary" autoFocus data-sfx="page" onClick={onDone}>{label}</button>
    </section>
  );
}

function StudyCard({ title, seconds, rows, tag = 'Study', onDone, children }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => { const id = setInterval(() => setLeft((v) => v - 1), 1000); return () => clearInterval(id); }, []);
  useEffect(() => { if (left <= 0) onDone(); }, [left]);
  return (
    <section className="card drill battle-study" data-quiet>
      <span className="tag">{tag} · {Math.max(0, left)}s</span>
      <h2>{title}</h2>
      {children}
      <ul className="study-rows">{rows.map((r, i) => (
        <li key={i}>{r.face != null ? <PixelFace seed={r.face} size={48} scale={2} /> : <b className="muted">{r.label}</b>}<span>{r.text}</span></li>
      ))}</ul>
      <button className="btn primary" onClick={onDone}>Done studying</button>
    </section>
  );
}

// Pages for each stretch of story. Nothing here is a question.
function storyPages(kind, first) {
  const W = BOSS_WINDER;
  if (kind === 'intro') return [{ tag: 'Chapter Thirteen', title: GREAT_FORGETTING.chapter.title, paras: first ? [GREAT_FORGETTING.unlock, ...BOSS_INTRO] : [GREAT_FORGETTING.unlock, BOSS_INTRO[0]] }];
  if (kind === 'winder') {
    const p = first ? [{ tag: 'The Pale Glow', title: 'A thin man in the light', art: 'story_ambrose', paras: [...W.appears, ...W.pitch] }, { tag: 'The Pale Glow', title: 'Wren answers', paras: [W.wren, W.set] }]
      : [{ tag: 'The Pale Glow', title: 'The Winder waits', art: 'story_ambrose', paras: [W.set] }];
    return p;
  }
  if (kind === 'name') return [{ tag: 'The thread draws tight', title: 'What to be called', art: 'story_ambrose', paras: W.name }];
  if (kind === 'ending') return [
    { tag: 'The Heartledger', title: 'Ambrose Tallow', art: 'story_ambrose', paras: [W.roll, W.letGo] },
    { tag: 'Chapter Thirteen', title: BOSS_ENDING.title, paras: [...BOSS_ENDING.text, BOSS_ENDING.wren] },
  ];
  if (kind === 'epilogue') {
    const t = SECOND_EPILOGUE.text;
    return [
      { tag: 'Epilogue Two', title: SECOND_EPILOGUE.title, paras: t.slice(0, 4) },
      { tag: 'Epilogue Two', title: 'The portrait', portrait: true, paras: t.slice(4) },
      { tag: 'Epilogue Two', title: 'The next evening', paras: BOSS_EPILOGUE },
    ];
  }
  return [];
}

// Wren's portrait: five details were kept for her mother's face. Marked, never scored.
export function PortraitCard({ profile }) {
  return (
    <div className="portrait-card">
      {artFor('story_mother_portrait') && <ArtImg id="story_mother_portrait" className="seam-art" />}
      <h3 className="panel-title">{PORTRAIT_NOTE.title}</h3>
      <p className="small">{PORTRAIT_NOTE.intro}</p>
      <ul className="small portrait-details">{FACE_DETAILS.map((d) => (
        <li key={d.id}><b>{d.text}</b> <span className="muted">{isHeld(profile, d.id) ? PORTRAIT_NOTE.kept : PORTRAIT_NOTE.told}</span></li>
      ))}</ul>
    </div>
  );
}

export default function Seam({ profile, update, onExit }) {
  const [, force] = useReducer((x) => x + 1, 0);
  const seed = useRef(Math.floor(Math.random() * 1e9)).current;
  const first = useRef(!profile.seam?.met).current;        // fixed at the start: the first sitting gets the whole scene
  const resume = useRef(endingPending(profile)).current;
  const plan = useRef(sittingPlan(profile)).current;
  const thread = useRef(pickThread(profile, seed)).current;
  const fx = useRef(effects(profile)).current;
  const [screen, setScreen] = useState('pages');
  const [kind, setKind] = useState(resume ? 'name' : 'intro');
  const [pg, setPg] = useState(0);
  const [pi, setPi] = useState(0);                 // index into plan
  const phase = useRef(null);
  const bt = useRef(null);
  const [val, setVal] = useState('');
  const [hint, setHint] = useState(null);
  const [lantern, setLantern] = useState(null);
  const [fb, setFb] = useState(null);
  const [beads, setBeads] = useState(() => Array(STITCH_COUNT).fill(''));
  const [stitch, setStitch] = useState(null);
  const [named, setNamed] = useState(null);        // result of the one ungraded question
  const turnNo = useRef(0);
  const wren = { speaker: 'Wren', portrait: <Portrait id="wren" mood="neutral" scale={2} /> };
  const stage = (label, over) => <BossStage profile={profile} hp={bt.current ? bt.current.hp : 0} hpMax={bt.current ? bt.current.hpMax : 0} resolve={bt.current ? bt.current.resolve : null} label={label} {...over} />;
  const leaveNow = () => { if (bt.current && !bt.current.over) leave(bt.current); update((p) => { restSitting(p); }); setScreen('rest'); };

  const pages = storyPages(kind, first);
  const goKind = (k) => { setKind(k); setPg(0); setScreen('pages'); };
  const startPhase = (i) => {
    const ph = buildPhase(plan[i], seed + i * 7919, profile);
    phase.current = ph; bt.current = newPhaseBattle(ph, fx);
    setPi(i); setScreen('pintro');
  };
  const afterPages = () => {
    if (pg + 1 < pages.length) { setPg(pg + 1); return; }
    if (kind === 'intro') { update((p) => { startSitting(p); }); setScreen('thread'); }
    else if (kind === 'winder') setScreen('stitch');
    else if (kind === 'name') setScreen('ask');
    else if (kind === 'ending') goKind('epilogue');
    else if (kind === 'epilogue') { update((p) => { finishEnding(p, named === 'held'); }); setScreen('done'); }
  };
  const afterPhase = () => {
    const i = pi + 1;
    if (i < plan.length) startPhase(i); else goKind('winder');
  };
  const finishPhase = () => {
    const b = bt.current;
    if (b.outcome === 'won') { update((p) => { clearPhase(p, plan[pi]); }); setScreen('pend'); }
    else { update((p) => { restSitting(p); }); setScreen('rest'); }
  };

  if (screen === 'pages') {
    const pgc = pages[pg];
    if (!pgc) return null;
    if (pgc.portrait) {
      return (
        <div className="page battle seam">
          <Page {...pgc} paras={pgc.paras} profile={profile} onDone={afterPages} label={pg + 1 < pages.length ? 'Continue' : 'Close the book'}><PortraitCard profile={profile} /></Page>
        </div>
      );
    }
    const intro = kind === 'intro';
    return (
      <div className="page battle seam">
        {intro && <h1 className="page-title"><PxIcon name="crypt" size={36} />{SEAM_UI.title}</h1>}
        {intro && stage('waits on the water', { hp: 0, hpMax: 0, resolve: null })}
        <Page {...pgc} profile={profile} onDone={afterPages} label={pg + 1 < pages.length ? 'Continue' : kind === 'intro' ? 'Step onto the water' : kind === 'epilogue' ? 'Close the book' : 'Continue'}>
          {intro && <><p className="small">{SEAM_UI.rules}</p><p className="small">{SEAM_UI.stitchRules}</p><p className="muted small">{FORGETTING_HONEST}</p></>}
        </Page>
        {intro && <button className="btn ghost" onClick={onExit}>Not now</button>}
      </div>
    );
  }

  if (screen === 'thread') {
    return (
      <div className="page battle seam">
        <DialogueBox {...wren} lines={[BOSS_STITCH.study]} />
        <StudyCard title="The thread of nine days" tag="Study the thread" seconds={Math.round(90 * (profile.user.prefs.timerMult || 1))}
          rows={thread.beads.map((b) => ({ label: `Bead ${b.n}`, text: b.thing }))} onDone={() => startPhase(0)}>
          <p className="muted small">Put them in order once, and keep them. A picture for each bead, a short story that links them, or a place along a route for each, whichever suits you. We shall need them at the end.</p>
        </StudyCard>
      </div>
    );
  }

  if (screen === 'pintro') {
    const d = phase.current.def, last = pi === plan.length - 1;
    return (
      <div className="page battle seam">
        {stage(d.title)}
        <section className="card parchment story"><span className="tag">Part {pi + 1} of {plan.length + 1} · {d.title}</span><h2>{d.title}</h2>
          <p className="story-text">{d.intro}</p>{d.seam && <p className="story-text">{d.seam}</p>}
          <p className="muted small">{last ? 'This part is made-up material. After it, the Stitch.' : 'Made-up material, a short study first.'} You have {RESOLVE} Resolve. A miss shows the answer and asks again.</p>
          <div className="row wrap"><button className="btn primary" autoFocus onClick={() => setScreen('study')}>Look at the material</button><button className="btn ghost" onClick={leaveNow}>Rest for now</button></div>
        </section>
      </div>
    );
  }

  if (screen === 'study') {
    const ph = phase.current;
    return (
      <div className="page battle seam">
        <StudyCard title={ph.def.title} seconds={Math.round(ph.seconds * (profile.user.prefs.timerMult || 1))} rows={ph.study} onDone={() => setScreen('turn')}>
          <p className="muted small">Made up for this scene. Use a picture, a link or a place, whichever fits.</p>
        </StudyCard>
      </div>
    );
  }

  if (screen === 'turn') {
    const b = bt.current, e = current(b);
    if (!e) return <div className="page battle seam"><button className="btn primary big" autoFocus onClick={finishPhase}>Go on</button></div>;
    const a = aids(b), retry = isRetry(b);
    const submit = (ev) => {
      ev.preventDefault();
      if (!val.trim()) return;
      sfx.soft();
      const r = answer(b, val);
      if (r.lantern) { setLantern(r.letter); setVal(''); force(); return; }
      setFb(r); setLantern(null); setHint(null); setVal(''); turnNo.current++;
      setScreen('feedback');
    };
    return (
      <div className="page battle seam">
        {stage(phase.current.def.title)}
        <section className="card drill battle-turn" data-quiet>
          <span className="tag">{e.fmt}{retry ? ' · asked again' : ''}</span>
          <p className="muted small reason">{e.reason}</p>
          {retry && <p className="note">You saw this answer a moment ago. It helps it stick.</p>}
          {e.face != null && <PixelFace seed={e.face} size={48} scale={4} />}
          <h2 className="battle-q">{e.prompt}</h2>
          {a.count != null && <p className="small">Scroll of Order: the list had {a.count} items.</p>}
          {a.emptyStops && <p className="small">Palace Map: stops still empty: {a.emptyStops.join(', ')}.</p>}
          {hint && <p className="note">{hint}. This answer deals half damage.</p>}
          {lantern && <p className="note" role="status">The lantern glows. {lantern}. Try once more.</p>}
          <form onSubmit={submit}>
            <label className="field">Your answer<input autoFocus autoComplete="off" autoCapitalize="off" spellCheck="false" value={val} onChange={(ev) => setVal(ev.target.value)} /></label>
            <div className="row wrap">
              <button className="btn primary" disabled={!val.trim()}>Check</button>
              {!hint && !retry && <button type="button" className="btn small" onClick={() => { setHint(useHint(b)); force(); }}>Use a hint (half damage)</button>}
              {!b.skipUsed && !retry && <button type="button" className="btn small" onClick={() => { skip(b); setHint(null); setLantern(null); if (b.over) finishPhase(); else force(); }}>Skip this one</button>}
              <button type="button" className="btn ghost small" onClick={leaveNow}>Rest for now</button>
            </div>
          </form>
        </section>
      </div>
    );
  }

  if (screen === 'feedback' && fb) {
    const b = bt.current, d = phase.current.def;
    return (
      <div className="page battle seam">
        {stage(d.title)}
        <section className="card battle-feedback" role="status">
          {fb.ok
            ? <><span className="tag">{fb.retry ? 'Learned again' : fb.status === 'eased' ? 'Right, with help' : 'It held'}</span><h2>{fb.retry ? 'Good. That is back in place.' : 'Right.'}</h2><p className="small">{pick(d.hit, turnNo.current)}</p></>
            : <><span className="tag">Not this time</span><h2>The answer was: {fb.answer}</h2><p className="small">{pick(d.miss, turnNo.current)}</p></>}
          <p className="muted small">{pick(fb.ok ? BOSS_LINES.hit : BOSS_LINES.miss, turnNo.current + 1)}</p>
          <button className="btn primary" autoFocus onClick={() => { if (b.over) finishPhase(); else setScreen('turn'); }}>{b.over ? 'Go on' : 'Next question'}</button>
        </section>
      </div>
    );
  }

  if (screen === 'pend') {
    const d = phase.current.def;
    return (
      <div className="page battle seam">
        {stage(d.title)}
        <section className="card parchment story"><span className="tag">{d.title} · done</span><p className="story-text">{d.end}</p>
          <p className="muted small">Finished parts stay finished, even if you rest before the end.</p>
          <button className="btn primary" autoFocus data-sfx="page" onClick={afterPhase}>Go on</button></section>
      </div>
    );
  }

  if (screen === 'rest') {
    return (
      <div className="page battle seam">
        {stage('rests')}
        <DialogueBox {...wren} lines={[SEAM_UI.restLine]} />
        <section className="card"><p className="small">What you finished stays finished. Nothing is locked and nothing was lost. The giant will be on the water tomorrow, and so will you.</p><button className="btn primary big" autoFocus onClick={onExit}>Done</button></section>
      </div>
    );
  }

  if (screen === 'stitch') {
    const submit = (ev) => {
      ev.preventDefault();
      sfx.soft();
      const r = scoreStitch(thread, beads);
      update((p) => { settleStitch(p, thread.id, r.inPlace); });
      setStitch(r); setScreen('stitchRes');
    };
    return (
      <div className="page battle seam">
        {stage('the Stitch', { hp: 0, hpMax: 0, resolve: null })}
        <section className="card drill" data-quiet>
          <span className="tag">The Stitch · the last part</span>
          <h2>{BOSS_STITCH.ask}</h2>
          <p className="muted small">Type a word or two for each day, in order. It does not have to be perfect: six of nine in their places ties it off. Leave a blank if you do not remember; nothing is lost.</p>
          <form onSubmit={submit}>
            <ol className="stitch-slots">{beads.map((v, i) => (
              <li key={i}><label className="field">Bead {i + 1}<input autoFocus={i === 0} autoComplete="off" autoCapitalize="off" spellCheck="false" value={v} onChange={(ev) => setBeads(beads.map((x, j) => (j === i ? ev.target.value : x)))} /></label></li>
            ))}</ol>
            <div className="row wrap"><button className="btn primary">Tie off the thread</button><button type="button" className="btn ghost small" onClick={leaveNow}>Rest for now</button></div>
          </form>
        </section>
      </div>
    );
  }

  if (screen === 'stitchRes' && stitch) {
    const st = stitch;
    return (
      <div className="page battle seam">
        {stage('the Stitch', { hp: 0, hpMax: 0, resolve: null })}
        <section className="card gold" role="status">
          <span className="tag">{st.inPlace} of {st.total} in their places</span>
          <h2>{st.closed ? 'The thread is tied off.' : 'The thread holds, but it is not tied off yet.'}</h2>
          <p className="story-text">{st.closed ? BOSS_STITCH.closes : SEAM_UI.retryCard}</p>
          {!st.closed && <p className="story-text">{BOSS_STITCH.notYet}</p>}
          <p className="muted small">Six in their places closes the Seam. Nothing here changes your skill estimates, and a miss locks nothing.</p>
        </section>
        <section className="card">
          <h3 className="panel-title"><PxIcon name="scroll" size={24} />The nine days</h3>
          <ol className="small stitch-review">{st.results.map((x, i) => (
            <li key={i} className={x.ok ? 'ok' : 'miss'}><b>{x.ok ? 'In place' : 'Out of place'}</b> {x.day}: {x.thing}. {x.ok ? '' : `You wrote: ${beads[i].trim() ? `"${beads[i].trim()}"` : 'nothing'}.`}</li>
          ))}</ol>
          <p className="muted small">{pick(st.closed ? BOSS_STITCH.hit : BOSS_STITCH.miss, st.inPlace)}</p>
        </section>
        <button className="btn primary big" autoFocus onClick={() => (st.closed ? goKind('name') : onExit())}>{st.closed ? 'Say his name' : 'Done'}</button>
      </div>
    );
  }

  if (screen === 'ask') {
    const q = BOSS_WINDER.nameAsk;
    const settle = (ok) => { setNamed(ok ? 'held' : 'told'); setScreen('answered'); };
    return (
      <div className="page battle seam">
        <section className="card" data-quiet>
          <span className="tag">One story question · no score</span>
          <h2>{q.prompt}</h2>
          <p className="muted small">Wren is humming. Say the word if you kept it. If not, she will say it for you, warmly, and nothing changes.</p>
          <form onSubmit={(ev) => { ev.preventDefault(); sfx.soft(); settle(accepts(Q_BY_ID.wf_tallow, val)); }}>
            <label className="field">Your answer<input autoFocus autoComplete="off" autoCapitalize="off" spellCheck="false" value={val} onChange={(ev) => setVal(ev.target.value)} /></label>
            <div className="row wrap"><button className="btn primary" disabled={!val.trim()}>Say it</button><button type="button" className="btn" onClick={() => settle(false)}>Wren, say it for me</button></div>
          </form>
        </section>
      </div>
    );
  }

  if (screen === 'answered') {
    const q = BOSS_WINDER.nameAsk;
    return (
      <div className="page battle seam">
        <Page tag="Said at last" title="Tallow" paras={[named === 'held' ? q.ifHeld : q.ifNot]} profile={profile} onDone={() => goKind('ending')} />
      </div>
    );
  }

  // done: the second epilogue has been read and saved
  return (
    <div className="page battle seam">
      <section className="card gold" role="status">
        <span className="tag">Remembered</span>
        <h2>The Seam is closed.</h2>
        <p className="small">{SEAM_UI.doneCard}</p>
        <button className="btn primary big" autoFocus onClick={onExit}>Done</button>
      </section>
    </div>
  );
}

// The card on Echo Hall and Today. Opens the Seam when the water is reachable.
export function SeamCard({ profile, onOpen, where = 'hall' }) {
  const s = profile.seam || {};
  if (!seamOpen(profile) && !seamClosed(profile)) return null;
  const closed = seamClosed(profile);
  const pending = endingPending(profile);
  return (
    <section className={`card ${closed && !pending ? '' : 'glass'} seam-card`} data-testid="seam-card">
      <h3 className="panel-title"><PxIcon name="crypt" size={28} />{closed && !pending ? 'The Seam, closed' : SEAM_UI.cardTitle}</h3>
      {pending ? <p className="small">The thread is tied off, and the last of the story is waiting for you.</p>
        : closed ? <p className="small">{SEAM_UI.doneCard}</p>
        : <p className="small">{s.tries ? SEAM_UI.retryCard : SEAM_UI.cardText}</p>}
      {!closed && <p className="muted small">Optional. About 10 to 15 minutes, in four parts, and you can rest at any time. {s.cleared?.length ? `${s.cleared.length} of 3 parts are already finished. ` : ''}Nothing is locked, nothing changes your skill estimates, and it earns no Lumen.</p>}
      {(!closed || pending) && <button className="btn primary" onClick={onOpen}>{pending ? 'Read the ending' : s.tries || s.cleared?.length ? 'Go back to the water' : 'Go to the water'}</button>}
    </section>
  );
}
