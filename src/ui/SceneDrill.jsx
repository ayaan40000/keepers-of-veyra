// 1.2 Real-life Scene: a memory technique used on material shaped like everyday life.
// Brief (with a worked example, a how-to, a named technique, or a choice), study, questions, feedback, and an
// optional "Carry it" plan. Study and recall stay still: no animation, and only the one soft submit sound.
import React, { useEffect, useRef, useState } from 'react';
import { TECH, TECH_IDS, CARRY_CUES, SCENE_HONEST } from '../data/scenarios.js';
import { scoreScene, workedExample, SELECTION_COACH, addCarry, mainTech } from '../engine/scene.js';
import { today } from '../engine/core.js';
import { PixelFace, Portrait } from '../pixel/Faces.jsx';
import { ArtImg } from './artLookup.jsx';

const ROLE = { practice: 'Practice', remedial: 'Rebuild practice', check: 'Check', gate: 'Gate challenge', review: 'Mixed review', free: 'Free practice', guided: 'Guided practice' };

function useSecondsLeft(active, total, onEnd) {
  const [left, setLeft] = useState(total);
  const end = useRef(onEnd); end.current = onEnd;
  useEffect(() => {
    if (!active) return undefined;
    setLeft(total);
    const t0 = Date.now();
    const id = setInterval(() => {
      const l = Math.max(0, total - Math.floor((Date.now() - t0) / 1000));
      setLeft(l);
      if (l <= 0) { clearInterval(id); end.current(); }
    }, 250);
    return () => clearInterval(id);
  }, [active, total]);
  return left;
}

function Body({ scene }) {
  const { present, body } = scene;
  if (present === 'cards') {
    return <div className="face-grid scene-people">{body.map((x, i) => <figure key={i}><PixelFace seed={x.face} size={48} scale={3} /><figcaption><b>{x.name}</b><br /><span className="small">{x.line}</span></figcaption></figure>)}</div>;
  }
  if (present === 'table' || present === 'menu') {
    return (
      <table className="scene-table">
        <tbody>{body.map((row, i) => <tr key={i}>{row.map((c, k) => <td key={k} className={k === 0 ? 'strong' : ''}>{c}</td>)}</tr>)}</tbody>
      </table>
    );
  }
  if (present === 'list') return <ol className="step-list">{body.map((l, i) => <li key={i}>{l}</li>)}</ol>;
  return <div className="scene-prose">{body.map((l, i) => <p key={i}>{l}</p>)}</div>;
}

export default function SceneDrill({ step, isProbe, profile, update, onResult, onContinue, onStart, coach }) {
  const items = step.items;
  const scene = step.extra?.scene || null;
  const mode = isProbe ? 'probe' : step.sceneMode || (step.spec.choose ? 'choose' : 'named');
  const tech = scene ? mainTech(scene.id) : null;
  const [phase, setPhase] = useState('brief');
  const [pick, setPick] = useState(null);
  const [resp, setResp] = useState(() => items.map(() => ''));
  const [result, setResult] = useState(null);
  const [cue, setCue] = useState(() => (CARRY_CUES.find((c) => scene?.fit?.includes(c.tech)) || CARRY_CUES[0]).id);
  const [things, setThings] = useState('');
  const [saved, setSaved] = useState(false);
  const marks = useRef({});
  const studySecs = step.spec.s || 90;
  const left = useSecondsLeft(phase === 'study', studySecs, () => toRecall());

  useEffect(() => {
    if (phase === 'recall') setTimeout(() => { window.scrollTo(0, 0); document.querySelector('.recall input, .recall button.choice')?.focus({ preventScroll: true }); }, 30);
  }, [phase]);

  function begin() {
    onStart?.();
    if (isProbe || !scene) { toRecall(); return; }
    marks.current.study = Date.now();
    setPhase('study');
  }
  function toRecall() { marks.current.recall = Date.now(); setPhase('recall'); }
  function submit() {
    if (phase !== 'recall') return;
    const res = scoreScene(items, resp);
    if (pick) res.pick = pick;
    setResult(res);
    setPhase('feedback');
    onResult(res, { studyMs: marks.current.study ? marks.current.recall - marks.current.study : 0, recallMs: Date.now() - marks.current.recall, perItemMs: [] }, {});
  }
  const set = (i, v) => setResp((r) => { const n = r.slice(); n[i] = v; return n; });

  const header = (
    <div className="drill-head">
      <span className="tag">{isProbe ? 'Delayed recall' : ROLE[step.role] || 'Practice'}</span>
      <h2>Real-life Scene{scene && (mode !== 'choose' || phase === 'feedback') ? `: ${scene.title}` : ''}</h2>
      <span className="muted small">{items.length} questions{mode === 'choose' ? ' · you choose the technique' : ''}</span>
    </div>
  );

  // ---------- BRIEF ----------
  if (phase === 'brief') {
    const worked = mode === 'worked' && scene ? workedExample(tech, scene.keys) : null;
    return (
      <section className="card drill brief scene-brief">
        {header}
        {coach && <p className="note coach-wren"><Portrait id="wren" mood="smile" scale={1} /><span><b>Wren:</b> {coach}</span></p>}
        {isProbe ? (
          <p>No studying this time. On {step.created} you held a scene from everyday life. Some questions may be asked in a different way from last time, so think back to the scene itself, not to the old questions.</p>
        ) : (
          <>
            <ArtImg id={`scene_${scene.id}`} className="scene-pic" />
            <p>{scene.frame}</p>
            <p className="muted small">You will have {studySecs} seconds with it. Then it goes away and you answer questions about it, the way real life asks: not always in order, and not always the way you stored it.</p>
            {mode === 'choose' ? (
              <fieldset className="tech-pick">
                <legend>Which technique will you use? Pick before you see it.</legend>
                <div className="chip-row">{TECH_IDS.map((id) => (
                  <button key={id} type="button" className={`btn tiny${pick === id ? ' on' : ''}`} aria-pressed={pick === id} onClick={() => setPick(id)}>{TECH[id].name}</button>
                ))}</div>
              </fieldset>
            ) : (
              <p className="note">Technique: <b>{TECH[tech].name}</b>. {mode !== 'named' ? TECH[tech].how : ''}</p>
            )}
            {worked && <p className="note worked">{worked}</p>}
          </>
        )}
        <button className="btn primary" disabled={mode === 'choose' && !pick} onClick={begin}>{isProbe ? 'Begin recall' : 'Begin study'}</button>
        {mode === 'choose' && !pick && <p className="muted small">Choose one to start. There is no wrong answer here that costs points: only the answers to the questions are scored.</p>}
      </section>
    );
  }

  // ---------- STUDY ----------
  if (phase === 'study') {
    return (
      <section className="card drill stimulus" data-quiet>
        {header}
        <p className="muted small">{left} seconds left. {mode === 'guided' ? TECH[tech].how : ''}</p>
        <Body scene={scene} />
        <button className="btn" onClick={toRecall}>I'm ready</button>
      </section>
    );
  }

  // ---------- RECALL ----------
  if (phase === 'recall') {
    return (
      <section className="card drill recall" data-quiet>
        {header}
        <ol className="scene-questions">{items.map((it, i) => (
          <li key={i}>
            {it.face != null && <PixelFace seed={it.face} size={48} scale={2} label={`Face for question ${i + 1}`} />}
            <span className="q">{it.q}</span>
            {it.kind === 'choice' ? (
              <div className="chip-row" role="group" aria-label={it.q}>{it.options.map((o) => (
                <button key={o} type="button" className={`btn tiny choice${resp[i] === o ? ' on' : ''}`} aria-pressed={resp[i] === o} onClick={() => set(i, o)}>{o}</button>
              ))}</div>
            ) : (
              <input data-slot type="text" autoComplete="off" autoCapitalize="off" spellCheck={false} inputMode={['number', 'digits'].includes(it.kind) ? 'numeric' : 'text'}
                aria-label={`Answer to question ${i + 1}`} value={resp[i]} onChange={(e) => set(i, e.target.value)} placeholder={it.kind === 'time' ? 'e.g. 9:45' : undefined} />
            )}
          </li>
        ))}</ol>
        <button data-submit data-sfx="soft" className="btn primary" onClick={submit}>Check answers</button>
      </section>
    );
  }

  // ---------- FEEDBACK ----------
  const pct = Math.round(result.acc * 100);
  const sel = pick && scene ? SELECTION_COACH(scene.id, pick) : null;
  const saveCarry = () => {
    const c = CARRY_CUES.find((x) => x.id === cue);
    const list = things.split('\n').map((x) => x.trim()).filter(Boolean);
    update((p) => { addCarry(p, c?.when || null, c?.tech || null, list, today(p)); });
    setSaved(list.length ? 'list' : 'plan');
  };
  return (
    <section className={`card drill ${result.acc >= 0.9 ? 'gold' : ''}`}>
      {header}
      <div className="score-row"><span className="score-big">{result.correct}<small>/{result.n}</small></span><span className="muted">{pct}% correct</span></div>
      <ul className="feedback">{result.perItem.map((x, i) => (
        <li key={i} className={x.ok ? 'ok' : 'miss'}>
          <span className="mark" aria-hidden="true">{x.ok ? '✓' : '–'}</span>
          <span className="locus">{items[i].q}</span>
          <b>{x.target}</b>
          {!x.ok && <span className="muted small">{x.response ? `you wrote “${x.response}”` : 'blank'}</span>}
          <span className="sr-only">{x.ok ? 'correct' : 'missed'}</span>
        </li>
      ))}</ul>
      {sel && <p className="note">{sel}</p>}
      <p className="muted small">{SCENE_HONEST}</p>
      {!isProbe && (
        <details className="about-more carry-it">
          <summary>Carry it into real life (optional)</summary>
          {saved ? <p className="small">{saved === 'list' ? 'Saved. Tomorrow, and again in a week, Mnemos will ask you for these things. Only a correct answer counts.' : 'Your plan is saved. Next time, add a few real things to keep and Mnemos will check them with you.'}</p> : (
            <>
              <p className="small">Pick a moment when you will use this, and if you like, type a few real things you want to keep this week: errands, names, a number. You will be asked for them tomorrow and in a week.</p>
              <label className="field">When
                <select value={cue} onChange={(e) => setCue(e.target.value)}>{CARRY_CUES.map((c) => <option key={c.id} value={c.id}>{c.when}, I will use {TECH[c.tech].name.toLowerCase()}.</option>)}</select>
              </label>
              <label className="field">Real things to keep (one per line, up to 10)
                <textarea rows={4} value={things} onChange={(e) => setThings(e.target.value)} />
              </label>
              <button type="button" className="btn" onClick={saveCarry}>Save my plan</button>
            </>
          )}
        </details>
      )}
      <ContinueBtn onClick={onContinue} />
    </section>
  );
}

function ContinueBtn({ onClick }) {
  const ref = useRef(null);
  useEffect(() => { const id = setTimeout(() => ref.current?.focus(), 350); return () => clearTimeout(id); }, []);
  return <button ref={ref} className="btn primary" onClick={onClick}>Continue</button>;
}
