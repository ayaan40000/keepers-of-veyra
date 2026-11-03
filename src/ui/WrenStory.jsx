// 1.1 Wren's Story Memory (v0.13): a small story card about Wren's family, and one delayed question after a session.
// Story only: no Lumen, no score, no skill change. A miss only means Wren says it again. Never on a study or recall screen.
import React, { useState } from 'react';
import { PxIcon } from './game/PxIcon.jsx';
import { Portrait } from '../pixel/Faces.jsx';
import { ArtImg, artFor } from './artLookup.jsx';
import { sfx } from '../audio/sfx.js';
import { tell } from '../data/story.js';
import { WREN_HONEST } from '../data/wren.js';
import { nextBeat, readBeat, dueQuestion, answerQuestion } from '../engine/wren.js';

// The next unread beat. One a day at most.
export function WrenBeatCard({ profile, update }) {
  const b = nextBeat(profile);
  if (!b) return null;
  return (
    <section className="card parchment story wren-beat" data-testid="wren-beat">
      <div className="wren-row"><Portrait id="wren" mood="smile" scale={2} /><div><span className="tag">Wren · {b.where}</span><h3>{b.title}</h3></div></div>
      {b.art && artFor(b.art) && <ArtImg id={b.art} className="seam-art" />}
      {b.text.map((t, i) => <p key={i} className="story-text">{tell(t, profile)}</p>)}
      <button className="btn primary" data-sfx="page" onClick={() => update((p) => { readBeat(p, b.id); })}>Keep this</button>
    </section>
  );
}

// One delayed question, typed. The player may say they do not remember. The answer and Wren's reply stay on the card.
export function WrenAskCard({ profile, update }) {
  const [q] = useState(() => dueQuestion(profile));
  const [val, setVal] = useState('');
  const [res, setRes] = useState(null);
  if (!q) return null;
  const go = (text) => { update((p) => { setRes(answerQuestion(p, q.id, text)); }); };
  return (
    <section className="card glass wren-ask" data-testid="wren-ask">
      <div className="wren-row"><Portrait id="wren" mood={res ? (res.ok ? 'smile' : 'neutral') : 'neutral'} scale={2} /><div><span className="tag">Wren asks</span><h3 className="panel-title"><PxIcon name="quill" size={24} />A small thing from her story</h3></div></div>
      {!res ? (
        <form onSubmit={(ev) => { ev.preventDefault(); if (!val.trim()) return; sfx.soft(); go(val); }}>
          <p className="story-text">{q.q}</p>
          <label className="field">Your answer<input autoComplete="off" autoCapitalize="off" spellCheck="false" value={val} onChange={(ev) => setVal(ev.target.value)} /></label>
          <div className="row wrap"><button className="btn primary" disabled={!val.trim()}>Tell Wren</button><button type="button" className="btn ghost small" onClick={() => go(null)}>I do not remember</button></div>
          <p className="muted small">{WREN_HONEST}</p>
        </form>
      ) : (
        <div role="status">
          <p className="story-text">{res.lead} {res.closing}</p>
          {res.ok ? <p className="story-text">{res.line}</p> : <p className="story-text">{res.q.who === 'edrin' ? 'Her father told you' : 'Wren told you'}: "{res.q.src}" The answer is: {res.q.say}</p>}
          <p className="muted small">{res.ok ? 'Kept in your Lore, under Wren\'s Keepsakes.' : 'Nothing is lost. She will ask again another day.'}</p>
        </div>
      )}
    </section>
  );
}
