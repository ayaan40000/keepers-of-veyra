import { Sprite } from '../pixel/core.js';
import { PANELS } from '../pixel/traced.js';
import { EPILOGUE } from '../data/afteryear.js';
import React, { useEffect, useRef, useState } from 'react';
import { MODULES, SKILLS, TEMPLATE_NAME, GATES } from '../data/curriculum.js';
import { CHAPTERS, ACHIEVEMENTS, BEATS, GATE_INTROS, SIDE_QUESTS, wrenLine, wrenStage, tell } from '../data/story.js';
import { applyDrill, applyProbeStep, finalizeSession } from '../engine/progress.js';
import { today, genItems } from '../engine/core.js';
import Drill from './Drill.jsx';
import SceneDrill from './SceneDrill.jsx';
import { Portrait } from '../pixel/Faces.jsx';
import { DistrictBanner } from './pixel/Scenes.jsx';
import { DistrictScene } from './artLookup.jsx';
import { moduleForWeek } from '../data/curriculum.js';
import { DialogueBox } from './game/DialogueBox.jsx';
import { PxIcon } from './game/PxIcon.jsx';
import { UnlockToast } from './game/UnlockToast.jsx';
import { sfx } from '../audio/sfx.js';
import { moodFor, speakerOf } from '../engine/moods.js';
import { PORTRAIT_MOODS } from '../pixel/portraits.js';

const TEACH = {
  imagery: { q: 'Wren needs to remember the word "anchor" until tomorrow. Which picture should she use?', opts: ['The word ANCHOR, written in big bold letters', 'A huge rusty anchor crashing down through her desk, splinters flying everywhere', 'A vague idea of boats and the sea'], a: 1, why: 'A specific, vivid picture with movement gives memory far more to hold on to than a word or a vague idea.' },
  linking: { q: 'Wren has to remember "kettle, then rose", in that order. What should she picture?', opts: ['A kettle, and then, separately, a rose', 'The kettle pouring boiling water onto a rose, which bursts into bloom', 'The letters K and R'], a: 1, why: 'When the two pictures act on each other, one brings back the other.' },
  palace: { q: 'Wren keeps arriving at her palace stops and finding them empty. What should she change?', opts: ['Make each picture actually do something to the stop itself', 'Use more stops, closer together', 'Just read the list more times'], a: 0, why: 'An empty stop nearly always means the picture never touched the place.' },
  faces: { q: 'Wren meets a man called Omar with very heavy eyebrows. What is the best way to remember him?', opts: ['Repeat "Omar" to herself five times', 'Picture a bright orange oar balanced on his eyebrows', 'Remember the blue scarf he is wearing'], a: 1, why: 'Name becomes a picture, picture attaches to a feature that will not change. The scarf might be gone tomorrow.' },
  numbers: { q: 'Using the Major System, which word stands for 74?', opts: ['car', 'cat', 'tar'], a: 0, why: '7 is a k sound and 4 is an r sound: k-r, car.' },
  vocab: { q: 'Wren learned "kitabu means book" with a keyword. What will make it last for months?', opts: ['The keyword on its own', 'Testing herself again tomorrow, next week and next month', 'Writing it out ten times today'], a: 1, why: 'Keywords get a word in quickly, but spaced testing is what keeps it.' },
  structure: { q: 'Wren has to give a seven-point talk from memory. What should she do first?', opts: ['Memorise every sentence word for word', 'Boil it down to seven key points, one picture per stop', 'Read it aloud over and over'], a: 1, why: 'Key points in a palace give you the shape of the talk; the words come naturally when you walk it.' },
};

// Coached first day (v0.5): Wren explains each step before it starts. Shown on the brief only, never during study or recall.
const COACH = {
  wordlist: 'This one only measures where you start. Read the words, hold what you can, then type them in any order. Spelling slips are forgiven.',
  digits: 'Now digits. Use any trick you like today. Later in the year you will learn a much better way, and this same test will show the change.',
  faces: 'Last one: people and their names. Just do your best. Nobody is good at this on day one.',
  guided: 'Now your first real technique. No clock this time. Make each word into a picture you could almost touch, and make it move.',
};
export function coachLine(session, step) {
  if (session.type !== 'baseline' && session.day !== 1) return null;
  if (step.role === 'guided') return COACH.guided;
  return step.battery ? COACH[step.spec.t] || null : null;
}

const CAUSES = [['encoding', 'No image formed'], ['vague', 'Image was vague'], ['order', 'Mixed up the order'], ['speed', 'Ran out of time'], ['attention', 'Got distracted'], ['none', 'Nothing missed']];

export default function Session({ profile, update, onExit }) {
  const ip = profile.inProgress;
  const session = ip.session;
  const step = session.steps[ip.idx];
  const gates = profile.progress.gates.length;
  const stage = wrenStage(gates);
  const liveDrills = useRef(new Set());

  const advance = (mut) => update((p) => { if (mut) mut(p); p.inProgress.idx = Math.min(p.inProgress.idx + 1, p.inProgress.session.steps.length - 1); });

  const progressBar = (
    <div className="step-bar" aria-label={`Step ${ip.idx + 1} of ${session.steps.length}`}>
      {session.steps.map((s, i) => <span key={i} className={i < ip.idx ? 'done' : i === ip.idx ? 'cur' : ''} />)}
    </div>
  );

  let body = null;
  if (step.kind === 'story') {
    const key = step.beat ? 'w' + step.beat : step.chapter;
    body = <Story profile={profile} chapterId={step.chapter} beat={step.beat} onDone={() => advance((p) => { if (!p.story.seen.includes(key)) p.story.seen.push(key); })} />;
  } else if (step.kind === 'intro') {
    const kinds = { welcome: 'welcome', return: 'returnAfter', review: 'welcome', assessment: 'welcome', gate: 'welcome' };
    const mod = MODULES.find((m) => m.id === (step.module || session.module));
    const headline = { welcome: `Day ${session.day} · Week ${session.week}`, return: 'Welcome back', review: 'Review session', assessment: `Week ${session.week} assessment`, gate: `Gate of ${mod.district}` }[step.variant];
    const drills = session.steps.filter((s) => s.kind === 'drill' || s.kind === 'probe');
    body = (
      <section className="intro">
        {step.variant === 'gate' && <DistrictScene id={mod.id} restored={false} className="story-banner" />}
        <DialogueBox speaker={`Wren · ${stage.name}`} portrait={<Portrait id="wren" mood={step.variant === 'gate' ? 'worried' : step.variant === 'return' ? 'smile' : 'neutral'} scale={2} />} lines={[wrenLine(kinds[step.variant], gates, session.day)]} />
        <div className={`card ${step.variant === 'gate' ? 'gold' : 'parchment'}`}>
        <span className="tag">{step.variant === 'gate' ? 'Gate challenge' : 'Quest briefing'}</span>
        <h2>{headline}</h2>
        {step.variant === 'gate' && <><p className="story-text">{GATE_INTROS[mod.id]}</p><p className="muted small">To pass: score at least {Math.round(GATES[mod.id].threshold * 100)}% across these drills. If you fall short, nothing is lost. Training carries on, and you can try again in 3 days.</p></>}
        {step.variant === 'assessment' && <p>Every seventh day is a check-up on your week. You will get brand new material in this week's formats, plus one skill from earlier, so you can see what is really sticking.</p>}
        <ul className="plan">{drills.map((s, i) => <li key={i}>{s.kind === 'probe' ? `Delayed recall: ${TEMPLATE_NAME[s.spec.t]} from ${s.created}` : `${TEMPLATE_NAME[s.spec.t]} · ${s.items.length} items`}</li>)}</ul>
        <button className="btn primary big" autoFocus data-sfx={step.variant === 'gate' ? 'door' : undefined} onClick={() => advance()}>Begin</button>
        </div>
      </section>
    );
  } else if (step.kind === 'lesson') {
    body = (
      <section className="card parchment lesson">
        <span className="tag">{step.refresher ? 'Refresher' : 'Lesson'}</span>
        <h2 className="panel-title"><PxIcon name="scroll" size={32} />{step.title}</h2>
        <p className="objective"><PxIcon name="star" size={20} /><span>Goal: {step.objective}</span></p>
        {step.cards.map((c, i) => <p key={i} className="lesson-card">{c}</p>)}
        {step.coach?.map((c, i) => <p key={'c' + i} className="note coach"><PxIcon name="quill" size={24} /><span>{c}</span></p>)}
        <button className="btn primary" autoFocus onClick={() => advance()}>Start practice</button>
      </section>
    );
  } else if (step.kind === 'drill' || step.kind === 'probe') {
    const isProbe = step.kind === 'probe';
    if (ip.committedIdx === ip.idx && !liveDrills.current.has(ip.idx)) {
      // Result already recorded before leaving; it cannot be retaken.
      const r = ip.results[ip.results.length - 1];
      body = (
        <section className="card">
          <span className="tag"><PxIcon name="lock" size={14} />Saved</span>
          <h2>{TEMPLATE_NAME[step.spec.t]}</h2>
          <p>This drill was already scored ({r?.correct}/{r?.n}) before you left. Results are recorded once, so it moves on.</p>
          <button className="btn primary" autoFocus onClick={() => advance()}>Continue</button>
        </section>
      );
    } else {
      if (ip.startedIdx === ip.idx && !liveDrills.current.has(ip.idx) && !isProbe && step.kind === 'drill') {
        // Resumed after leaving mid-study: fresh material so earlier study time gives no advantage.
        setTimeout(() => update((p) => {
          const s = p.inProgress.session.steps[p.inProgress.idx];
          const fresh = genItems(s.spec, Date.now() % 1e9, p);
          s.items = fresh.items; s.extra = fresh.extra || null; s.loci = null; s.regen = (s.regen || 0) + 1;
          p.inProgress.startedIdx = null;
        }), 0);
      }
      const DrillView = step.spec.t === 'scene' ? SceneDrill : Drill; // 1.2 Real-life Scene has its own screen
      body = (
        <DrillView key={`${session.id}-${ip.idx}-${step.regen || 0}`} step={step} isProbe={isProbe} profile={profile} update={update} coach={coachLine(session, step)}
          onStart={() => { liveDrills.current.add(ip.idx); update((p) => { p.inProgress.startedIdx = p.inProgress.idx; }); }}
          onResult={(result, timing, extra) => update((p) => {
            if (p.inProgress.committedIdx === p.inProgress.idx) return;
            const s = p.inProgress.session.steps[p.inProgress.idx];
            if (extra?.loci) s.loci = extra.loci;
            const out = isProbe ? applyProbeStep(p, p.inProgress.session, s, result) : applyDrill(p, p.inProgress.session, s, result, timing);
            p.inProgress.results.push({ role: isProbe ? 'probe' : s.role, t: s.spec.t, skill: s.skill, acc: result.acc, correct: result.correct, n: result.n, errs: result.errs, lumen: out.lumen, delay: out.delay, pass: out.pass, timed: !!s.spec.timed, speedRaw: out.speedRaw ?? null, speedOk: out.speedOk });
            p.inProgress.events.push(...out.events);
            p.inProgress.committedIdx = p.inProgress.idx;
          })}
          onContinue={() => advance()} />
      );
    }
  } else if (step.kind === 'reflect') {
    body = <Reflect results={ip.results} skill={session.steps.find((s) => s.kind === 'drill' && s.role !== 'warmup')?.skill || 'imagery'} gates={gates} onDone={(r) => advance((p) => { p.inProgress.reflection = r; })} />;
  } else if (step.kind === 'summary') {
    body = <Summary profile={profile} update={update} onExit={onExit} />;
  }

  return (
    <div className="session" role="main">
      <div className="session-top">
        <button className="btn ghost small has-icon" onClick={onExit} aria-label="Leave session, progress is saved"><PxIcon name="back" size={20} />Leave</button>
        {progressBar}
      </div>
      {body}
    </div>
  );
}

// v0.9.1 traced story panels: the epilogue, and two pages of chapter 12.
const STORY_PANELS = {
  epilogue: ['long_vigil_street_lamps', 'wren_archivist_copper_dome', 'hask_ammerhold_pass', 'sevrin_tansy_last_lamp', 'wren_quay_one_year_later'],
  M12: { 4: 'lamp_of_ysole_relit', 5: 'tide_stopping_bridge' },
};
const panelFor = (ch, i) => { const id = STORY_PANELS[ch]?.[i]; return id && PANELS[id] ? id : null; };

// [pan x, pan y, zoom] per panel.
const CAMERA = [['0%', '0%', 1], ['-12%', '4%', 1.35], ['10%', '-4%', 1.3], ['0%', '8%', 1.5], ['-8%', '-6%', 1.2], ['12%', '6%', 1.4]];

function Story({ profile, chapterId, beat, onDone }) {
  const [i, setI] = useState(0);
  if (beat) {
    const b = BEATS[beat];
    return (
      <section className="card parchment story beat book">
        <DistrictScene id={moduleForWeek(beat).id} restored={profile.progress.gates.includes(moduleForWeek(beat).id)} className="story-banner" />
        <span className="tag">This week in Veyra</span>
        <h2>{b.title}</h2>
        <span className="ornament" aria-hidden="true" />
        <p className="story-text">{tell(b.text, profile)}</p>
        <button className="btn primary" autoFocus data-sfx="page" onClick={onDone}>Continue</button>
      </section>
    );
  }
  const ch = chapterId === 'epilogue' ? EPILOGUE : CHAPTERS[chapterId];
  // Cutscene panels (v0.6): each page is a framed panel of the district, with the camera on a different part
  // of the scene, and the person the page is about shown with a mood that matches the words.
  const page = tell(ch.text[i], profile);
  const who = speakerOf(page);
  const cam = CAMERA[i % CAMERA.length];
  return (
    <section className="card parchment story book">
      <figure className="cutscene" aria-label={`Panel ${i + 1} of ${ch.text.length}`}>
        <div className="cut-art" style={{ '--cx': cam[0], '--cy': cam[1], '--cz': cam[2] }}>
          {panelFor(chapterId, i) ? <Sprite sprite={PANELS[panelFor(chapterId, i)]} scale={4} className="story-banner panel-art" label="" /> : <DistrictBanner id={chapterId === 'prologue' || chapterId === 'epilogue' ? 'archive' : chapterId} restored={chapterId === 'prologue' || chapterId === 'epilogue' || i >= ch.text.length - 2} className="story-banner" />}
        </div>
        {who && <Portrait id={who} mood={moodFor(page, PORTRAIT_MOODS[who])} scale={2} className="cut-face" />}
      </figure>
      <span className="tag">{chapterId === 'prologue' ? 'Prologue' : chapterId === 'epilogue' ? 'Epilogue' : 'Chapter'}</span>
      <h2>{ch.title}</h2>
      <span className="ornament" aria-hidden="true" />
      <p key={i} className="story-text drop page-turn">{page}</p>
      <div className="book-foot"><span className="page-num">{i + 1} of {ch.text.length}</span>
        <div className="row">
          {i > 0 && <button className="btn ghost small" data-sfx="page" onClick={() => setI(i - 1)}>Back</button>}
          <button className="btn primary" autoFocus data-sfx="page" onClick={() => (i + 1 < ch.text.length ? setI(i + 1) : onDone())}>{i + 1 < ch.text.length ? 'Continue' : 'Begin'}</button>
        </div></div>
    </section>
  );
}

function Reflect({ results, skill, gates, onDone }) {
  const missed = results.reduce((a, r) => a + (r.n - r.correct), 0);
  const errs = results.reduce((a, r) => { Object.entries(r.errs || {}).forEach(([k, v]) => (a[k] = (a[k] || 0) + v)); return a; }, {});
  const [causes, setCauses] = useState([]);
  const [ans, setAns] = useState(null);
  const tq = TEACH[skill] || TEACH.imagery;
  const toggle = (c) => setCauses(causes.includes(c) ? causes.filter((x) => x !== c) : [...causes, c]);
  return (
    <section className="card reflect">
      <span className="tag">Reflect</span>
      <h2 className="panel-title"><PxIcon name="quill" size={32} />Looking back at today</h2>
      <p className="muted">Take a moment to be honest with yourself. It is the quickest way to improve. {missed} items were missed today{missed ? `: ${Object.entries(errs).filter(([, v]) => v).map(([k, v]) => `${v} ${k}`).join(', ')}` : ''}.</p>
      <div className="chips" role="group" aria-label="Causes">
        {CAUSES.map(([k, l]) => <button key={k} className={`chip ${causes.includes(k) ? 'on' : ''}`} aria-pressed={causes.includes(k)} onClick={() => toggle(k)}>{l}</button>)}
      </div>
      <h3>Help Wren</h3>
      <DialogueBox speaker="Wren" portrait={<Portrait id="wren" mood="neutral" scale={2} />} lines={[tq.q]} compact />
      <div className="choices">
        {tq.opts.map((o, i) => <button key={i} className={`choice ${ans === i ? (i === tq.a ? 'right' : 'wrong') : ''}`} disabled={ans != null} data-sfx={i === tq.a ? 'success' : 'fail'} onClick={() => setAns(i)}>{o}</button>)}
      </div>
      {ans != null && <p className="note">{ans === tq.a ? `Wren grins, reaches for a notecard out of habit, then stops herself. "No, I'll remember that one." ${tq.why}` : `Wren tilts her head. "Hmm. I don't think that's it. Calder always said: ${tq.opts[tq.a].toLowerCase()}." ${tq.why}`}</p>}
      <button className="btn primary" disabled={ans == null} onClick={() => onDone({ causes, teach: ans === tq.a, diagnosed: causes.length > 0 })}>Finish</button>
    </section>
  );
}

function Summary({ profile, update, onExit }) {
  const ip = profile.inProgress;
  const fin = ip.final;
  useEffect(() => {
    if (ip.final) return;
    update((p) => {
      if (p.inProgress.final) return;
      const f = finalizeSession(p, p.inProgress.session, p.inProgress.results, p.inProgress.reflection);
      f.newAch = p._newAch || []; delete p._newAch;
      p.inProgress.final = f;
      if (f.gate?.passed) p.inProgress.chapter = f.gate.module;
    });
  }, []);
  useEffect(() => { if (fin) (fin.gate && !fin.gate.passed ? sfx.fail : fin.gate?.passed ? sfx.levelUp : sfx.success)(); }, [!!fin]);
  if (!fin) return <section className="card"><p>Saving…</p></section>;
  const res = ip.results;
  const total = res.reduce((a, r) => a + (r.lumen || 0), 0) + fin.lumen;
  const avg = res.filter((r) => r.role !== 'probe' && r.role !== 'warmup');
  const g = profile.progress.gates.length;
  const good = avg.length && avg.reduce((a, r) => a + r.acc, 0) / avg.length >= 0.75;
  const nextDue = profile.sets.filter((s) => !s.retired).map((s) => s.due).sort()[0];
  const ev = [...ip.events, ...(fin.events || [])];
  const chapter = ip.chapter;
  const toasts = [
    ...ev.filter((e) => e.type === 'levelup').map((e, i) => ({ key: 'lv' + i, kicker: 'Level up', title: `${SKILLS[e.skill].name} · level ${e.level}`, icon: <PxIcon name="star" size={40} />, sound: 'levelUp' })),
    ...fin.newAch.map((id) => { const a = ACHIEVEMENTS.find((x) => x.id === id); return a ? { key: id, kicker: 'Achievement unlocked', title: a.name, text: a.desc, icon: <PxIcon name="chest" size={40} />, sound: 'chest' } : null; }).filter(Boolean),
  ];
  return (
    <section className="card gold summary">
      <UnlockToast items={toasts} delay={900} />
      <div className="results-banner">
        <span className="tag"><PxIcon name="star" size={14} />Session complete</span>
        <h2>{fin.gate ? (fin.gate.passed ? 'Gate restored' : 'Quest results') : 'Quest complete'}</h2>
      </div>
      <div className="loot-total"><PxIcon name="lumen" size={48} /><span className="score-big">+{total}</span><span className="muted">Lumen gathered</span></div>
      <DialogueBox speaker="Wren" portrait={<Portrait id="wren" mood={fin.gate?.passed || good ? 'smile' : 'worried'} scale={2} />} lines={[fin.gate?.passed ? wrenLine('gate', g, 1) : wrenLine(good ? 'success' : 'struggle', g, res.length)]} />
      {fin.gate && (
        <div className={`gate-result ${fin.gate.passed ? 'pass' : ''}`}>
          <h3>{fin.gate.passed ? `${MODULES.find((m) => m.id === fin.gate.module).district} restored` : 'The gate holds for now'}</h3>
          <p>{Math.round(fin.gate.acc * 100)}% (needed {Math.round(fin.gate.threshold * 100)}%). {fin.gate.passed ? `A new chapter is open in Veyra.${fin.stageUp ? ` Wren is now ${fin.stageUp}.` : ''}` : `${fin.gate.speedOk === false ? 'Accuracy alone is not enough here: timed drills must also meet the target pace. ' : ''}Training continues. Retry in 3 days; your practice will target the gaps.`}</p>
        </div>
      )}
      <table className="results loot">
        <thead><tr><th>Drill</th><th>Score</th><th>Lumen</th></tr></thead>
        <tbody>{res.map((r, i) => <tr key={i}><td>{r.role === 'probe' ? `Delayed recall (${r.delay}d)` : TEMPLATE_NAME[r.t]} <span className="muted small">{r.role !== 'probe' ? r.role : r.pass ? 'kept' : 're-learn'}</span></td><td>{r.correct}/{r.n}</td><td>+{r.lumen}</td></tr>)}
          <tr><td>Session and bonuses</td><td /><td>+{fin.lumen}</td></tr></tbody>
        <tfoot><tr><th>Total</th><th /><th>+{total}</th></tr></tfoot>
      </table>
      {ev.filter((e) => e.type === 'levelup').map((e, i) => <p key={i} className="note good">{SKILLS[e.skill].name} rose to level {e.level}: three sessions in a row at 90% or better.</p>)}
      {ev.filter((e) => e.type === 'leveldown').map((e, i) => <p key={i} className="note">{SKILLS[e.skill].name} eased to level {e.level} to rebuild accuracy.</p>)}
      {ev.filter((e) => e.type === 'remediate').map((e, i) => <p key={i} className="note">{SKILLS[e.skill].name} will get a rebuild drill next session.</p>)}
      {fin.newAch.length > 0 && <div className="ach-new">{fin.newAch.map((id) => { const a = ACHIEVEMENTS.find((x) => x.id === id); return a ? <div key={id} className="seal"><PxIcon name="star" size={32} /><b>{a.name}</b><span className="small">{a.desc}</span></div> : null; })}</div>}
      {fin.advanced && <p className="muted small">Curriculum advanced to day {profile.progress.day}.</p>}
      {nextDue && <p className="muted small">Next delayed recall due {nextDue === today(profile) ? 'today (review session)' : nextDue}.</p>}
      {(fin.sideQuests || []).map((id) => { const q = SIDE_QUESTS.find((x) => x.id === id); return q ? <div key={id} className="quest-done"><span className="tag">Side quest complete · +40 Lumen</span><h3>{q.title}</h3><p className="story-text">{tell(q.done, profile)}</p></div> : null; })}
      {chapter && CHAPTERS[chapter] && <div className="chapter-open"><span className="tag"><PxIcon name="scroll" size={14} />New chapter unlocked</span><h3>{CHAPTERS[chapter].title}</h3><p className="muted small">Read it now in the Veyra tab, under Chapters.</p></div>}
      <button className="btn primary big" onClick={() => { update((p) => { p.inProgress = null; }); onExit(); }}>Back to Today</button>
    </section>
  );
}
