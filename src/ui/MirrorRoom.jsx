// 1.1 The Mirror Room: seven foggy mirrors, each with a harmless number to turn into a picture with the Major System.
// Practice and story only. It never changes a score and never affects battle damage. Shown on the Character page.
import React, { useState } from 'react';
import { PxIcon } from './game/PxIcon.jsx';
import { ArtImg, artFor } from './artLookup.jsx';
import { MIRROR_ATTRS, MIRROR_ORDER, MIRROR_ROOM, MIRROR_MISS, MIRROR_HONEST, MIRROR_WREN, GREYED } from '../data/mirror.js';
import { mistState, litSkills, relight, mirrorOpen } from '../engine/mirror.js';

export function MirrorRoom({ profile, update }) {
  const mist = mistState(profile);
  const lit = new Set(litSkills(profile, mist.episode));
  const [sel, setSel] = useState(null);
  const [val, setVal] = useState('');
  const [res, setRes] = useState(null);
  if (!mirrorOpen(profile)) return null;
  const a = sel && MIRROR_ATTRS[sel];
  const submit = (e) => {
    e.preventDefault();
    let r = null;
    update((p) => { r = relight(p, sel, val, mist.episode || `practice:${new Date().toISOString().slice(0, 10)}`); });
    setRes(r); if (r?.ok) setVal('');
  };
  const allLit = MIRROR_ORDER.every((s) => lit.has(s));
  return (
    <section className="card parchment mirror-room" data-testid="mirror-room">
      <h3 className="panel-title"><PxIcon name="lumen" size={28} />{MIRROR_ROOM.title}</h3>
      {artFor('event_mirror_room') && <ArtImg id="event_mirror_room" className="mirror-art" alt="" />}
      {MIRROR_ROOM.describe.map((t, i) => <p key={i} className="story-text small">{t}</p>)}
      {!mist.up && <p className="muted small">The mist is down and your sheet is clear. The room is open for practice whenever you want a quiet minute.</p>}
      <p className="small">{allLit ? MIRROR_ROOM.allLit : MIRROR_ROOM.enter}</p>
      <div className="row wrap mirror-list">{MIRROR_ORDER.map((s) => (
        <button key={s} className={`btn small${lit.has(s) ? ' good' : ''}`} aria-pressed={sel === s} onClick={() => { setSel(s); setVal(''); setRes(null); }}>
          {MIRROR_ATTRS[s].name}{lit.has(s) ? ' (clear)' : ''}
        </button>
      ))}</div>
      {a && (
        <form onSubmit={submit} className="mirror-form">
          <p className="small"><b>{a.mirror[0].toUpperCase() + a.mirror.slice(1)}.</b> {a.prompt}</p>
          <p className="muted small">{MIRROR_ROOM.how} {MIRROR_ROOM.accepts}</p>
          {lit.has(sel) && !res && <p className="small" role="status">{a.relit}</p>}
          {res?.ok && <p className="small" role="status">{a.relit}</p>}
          {res && !res.ok && <p className="small" role="status">{MIRROR_MISS.line.replace('{example}', res.example).replace('{sounds}', res.sounds)}</p>}
          <label className="field">Your picture<input autoComplete="off" autoCapitalize="off" spellCheck="false" value={val} onChange={(e) => setVal(e.target.value)} /></label>
          <div className="row wrap"><button className="btn primary small" disabled={!val.trim()}>Check</button><button type="button" className="btn ghost small" onClick={() => { setSel(null); setRes(null); }}>Leave this mirror</button></div>
        </form>
      )}
      <p className="muted small">{MIRROR_WREN}</p>
      <p className="muted small">{MIRROR_HONEST}</p>
    </section>
  );
}
export const MistNote = ({ mist }) => (mist.up ? <p className="note" role="status"><b>{GREYED.title}.</b> {mist.why === 'boss' ? GREYED.boss : GREYED.line} {GREYED.hint}</p> : null);
