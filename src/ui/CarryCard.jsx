// 1.2 Carry it: the real things the player chose to keep come back a day and a week later.
// Only a correct recall counts as "held". It earns no Lumen and keeps no streak.
import React, { useState } from 'react';
import { dueCarry, checkCarry, carryHeld } from '../engine/scene.js';
import { today } from '../engine/core.js';
import { PxIcon } from './game/PxIcon.jsx';

export function CarryCard({ profile, update }) {
  const date = today(profile);
  const due = dueCarry(profile, date)[0];
  const [text, setText] = useState('');
  const [out, setOut] = useState(null);
  if (!due && !out) return null;
  const held = carryHeld(profile);
  if (out) {
    return (
      <section className="card glass" data-testid="carry-card">
        <h3 className="panel-title"><PxIcon name="sun" size={28} />Carry it</h3>
        <p>You kept {out.got} of {out.of}.{out.held ? ' The method held.' : ' Look at the list once more and rebuild the pictures.'}</p>
        <p className="muted small">Real-life lists you kept at 80 percent or better: {held.day1} after a day, {held.day7} after a week.</p>
        <button className="btn ghost small" onClick={() => setOut(null)}>Done</button>
      </section>
    );
  }
  const check = () => {
    const lines = text.split('\n').map((x) => x.trim()).filter(Boolean);
    let r = null;
    update((p) => { r = checkCarry(p, due.id, lines, today(p)); });
    setOut(r || { got: 0, of: due.things.length, held: false });
    setText('');
  };
  return (
    <section className="card glass" data-testid="carry-card">
      <h3 className="panel-title"><PxIcon name="sun" size={28} />Carry it</h3>
      <p className="small">On {due.made} you chose {due.things.length} real things to keep{due.cue ? ` (${due.cue.toLowerCase()})` : ''}. Write down as many as you still have, one per line, in any order, without looking.</p>
      <label className="field">What you kept
        <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <button className="btn" onClick={check}>Check</button>
      <p className="muted small">Optional, and it earns nothing. It shows you whether the method works in your own life.</p>
    </section>
  );
}
