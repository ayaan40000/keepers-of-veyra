// 1.9 The Amphitheatre of Echoes: rehearse a talk from memory, out loud, against a time you choose.
// Self-marked and never rewarded. A study and recall screen: no animation, no sound, no ticking clock.
// Outlines come from a Ledger book (card fronts in order) or are typed for this sitting only (not saved).
import React, { useRef, useState } from 'react';
import { PxIcon } from './game/PxIcon.jsx';
import { DialogueBox } from './game/DialogueBox.jsx';
import { Portrait } from '../pixel/Faces.jsx';
import { weekOf } from '../engine/road.js';

export const REHEARSE_WEEK = 28;
export const rehearseOpen = (p) => weekOf(p) >= REHEARSE_WEEK;
const MINUTES = [3, 5, 10];
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function RehearseEntry({ profile, onOpen }) {
  return (
    <section className="card" data-testid="rehearse-entry">
      <h3 className="panel-title"><PxIcon name="scroll" size={28} />The Amphitheatre of Echoes</h3>
      <p className="small">Give a talk from memory, out loud, walking your palace outline. Self-marked; it earns nothing and is only for you.</p>
      {rehearseOpen(profile) ? <button className="btn" onClick={onOpen}>Rehearse a talk</button> : <p className="small muted">Opens in week {REHEARSE_WEEK}, with the talk outline lesson.</p>}
    </section>
  );
}

export default function Rehearse({ profile, onExit }) {
  const books = (profile.ledger?.books || []).filter((b) => b.cards.length >= 2);
  const [phase, setPhase] = useState('set'); // set, run, done
  const [src, setSrc] = useState(books[0]?.id || 'typed');
  const [typed, setTyped] = useState('');
  const [mins, setMins] = useState(5);
  const [k, setK] = useState(0);
  const [peek, setPeek] = useState(false);
  const marks = useRef([]);
  const t0 = useRef(0);
  const [secs, setSecs] = useState(0);

  const points = src === 'typed'
    ? typed.split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 12)
    : (books.find((b) => b.id === src)?.cards || []).slice(0, 12).map((c) => c.front);

  if (phase === 'set') return (
    <div className="page rehearse">
      <h1 className="page-title"><PxIcon name="scroll" size={36} />The Amphitheatre of Echoes</h1>
      <DialogueBox speaker="Isolde" portrait={<Portrait id="isolde" scale={2} />} lines={[
        'Before the Tide, Veyrans gave their speeches here with no notes at all. The stone still answers anyone who speaks from memory.',
        'Stand up if you can. Walk your route in your head and say each point aloud. A talk is kept when you can give it, not when you can list it.',
      ]} />
      <section className="card">
        <h3>Your outline</h3>
        <div className="row wrap">
          {books.map((b) => <button key={b.id} className={'btn small' + (src === b.id ? ' primary' : '')} aria-pressed={src === b.id} onClick={() => setSrc(b.id)}>{b.title} ({Math.min(b.cards.length, 12)} points)</button>)}
          <button className={'btn small' + (src === 'typed' ? ' primary' : '')} aria-pressed={src === 'typed'} onClick={() => setSrc('typed')}>Type points for this sitting</button>
        </div>
        {src === 'typed' && <textarea aria-label="Talk points, one per line" rows={7} maxLength={2000} value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="One key point per line, five to nine is best" />}
        <p className="muted small">{src === 'typed' ? 'Typed points are not saved. To keep an outline, put it in a Ledger book.' : 'Each card front in the book is one stop, in order.'}</p>
        <h3>Target length</h3>
        <div className="row wrap">{MINUTES.map((m) => <button key={m} className={'btn small' + (mins === m ? ' primary' : '')} aria-pressed={mins === m} onClick={() => setMins(m)}>{m} minutes</button>)}</div>
        <div className="row wrap">
          <button className="btn primary" disabled={points.length < 2} onClick={() => { marks.current = []; setK(0); setPeek(false); t0.current = Date.now(); setPhase('run'); }}>Begin the talk</button>
          <button className="btn ghost" onClick={onExit}>Back</button>
        </div>
      </section>
    </div>
  );

  if (phase === 'run') {
    const mark = (ok) => {
      marks.current.push(ok && !peek);
      setPeek(false);
      if (k + 1 >= points.length) { setSecs(Math.round((Date.now() - t0.current) / 1000)); setPhase('done'); } else setK(k + 1);
    };
    return (
      <div className="page rehearse">
        <section className="card" data-testid="rehearse-run">
          <span className="tag">Stop {k + 1} of {points.length}</span>
          <p className="small">Say this stop's point aloud from memory, then mark it honestly.</p>
          {peek ? <p className="story-text"><b>{points[k]}</b></p> : <button className="btn ghost small" onClick={() => setPeek(true)}>Peek at this point</button>}
          <div className="row wrap">
            <button className="btn primary" onClick={() => mark(true)}>{peek ? 'Said it after a peek' : 'Said it'}</button>
            <button className="btn" onClick={() => mark(false)}>Lost this one</button>
          </div>
          <p className="muted small">Target: about {mins} minutes for the whole talk. The time is shown at the end, not while you speak.</p>
        </section>
      </div>
    );
  }

  const held = marks.current.filter(Boolean).length;
  const target = mins * 60;
  const pace = secs < target * 0.6 ? 'Well under your target: you may be listing, not telling. Try adding one sentence of detail at each stop.' : secs > target * 1.3 ? 'Over your target. Try one picture and one sentence per stop, and move on.' : 'Close to your target length.';
  return (
    <div className="page rehearse">
      <section className="card gold" role="status" data-testid="rehearse-done">
        <span className="tag">The stone answers</span>
        <h2>{held} of {points.length} points from memory</h2>
        <p className="small">Time: {fmt(secs)} against a target of {mins}:00. {pace}</p>
        {held < points.length && <p className="small">Missed or peeked: {points.filter((_, i) => !marks.current[i]).join('; ')}. Look at those stops' pictures again before the next run.</p>}
        <p className="muted small">Self-marked, and only for you. It changes no score and earns nothing.</p>
        <div className="row wrap">
          <button className="btn primary" autoFocus onClick={() => setPhase('set')}>Rehearse again</button>
          <button className="btn ghost" onClick={onExit}>Done</button>
        </div>
      </section>
    </div>
  );
}
