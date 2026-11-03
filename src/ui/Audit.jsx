// 1.1 Wren's Audit. Wren walks a route aloud and slips; the player names the kind of slip (from a short list) and fixes it.
// Practice only: no score, no skill change, a wrong pick costs nothing. The only gift is Chronolog entries.
import React, { useState } from 'react';
import { MODULES } from '../data/curriculum.js';
import { PxIcon } from './game/PxIcon.jsx';
import { DialogueBox } from './game/DialogueBox.jsx';
import { Portrait } from '../pixel/Faces.jsx';
import { ArtImg, artFor } from './artLookup.jsx';
import { AUDIT_HONEST, AUDIT_ASK, AUDIT_THANKS, AUDIT_REFRAME, AUDIT_FIXED } from '../data/audit.js';
import { auditRoutes, beatsFor, errorTypes, introFor, isFixed, typeLabel, factsFor, endTextFor, finishAudit } from '../engine/audit.js';

const fill = (t, o) => t.replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '');

export default function Audit({ profile, update, onExit }) {
  const [route, setRoute] = useState(null);
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState('say');    // say, pick, fix, done
  const [pickRes, setPickRes] = useState(null);
  const [fixRes, setFixRes] = useState(null);
  const [val, setVal] = useState('');
  const [caught, setCaught] = useState(0);
  const [saved, setSaved] = useState(false);
  const beats = route ? beatsFor(route, profile) : [];
  const beat = beats[i];
  const slips = beats.filter((b) => b.type).length;

  if (!route) {
    return (
      <div className="page battle audit">
        <h1 className="page-title"><PxIcon name="quill" size={36} />Wren's Audit</h1>
        {artFor('event_wren_audit_route') && <ArtImg id="event_wren_audit_route" className="audit-art" alt="" />}
        <DialogueBox speaker="Wren" portrait={<Portrait id="wren" mood="smile" scale={2} />} lines={[introFor(profile)]} />
        <section className="card">
          <p className="small">Wren walks a route aloud and somewhere along it she will slip. You say what kind of slip it was, then help her put it right. It takes about 5 minutes. It earns nothing but lore, changes no score, and a wrong guess costs nothing.</p>
          <div className="grounds">{auditRoutes(profile).map((r) => (
            <button key={r.id} className="ground" disabled={!r.open} onClick={() => setRoute(r)}><PxIcon name={r.open ? 'quill' : 'lock'} size={28} /><b>{r.title}</b><span className="small">{r.open ? r.district : `Opens with ${MODULES.find((m) => m.id === r.unlock.slice(5))?.district || r.unlock.slice(5)}`}</span></button>
          ))}</div>
          <p className="muted small">{AUDIT_HONEST}</p>
          <button className="btn ghost" onClick={onExit}>Not now</button>
        </section>
      </div>
    );
  }

  const next = () => {
    setPickRes(null); setFixRes(null); setVal('');
    if (i + 1 >= beats.length) {
      if (!saved) { setSaved(true); update((p) => { finishAudit(p); }); }
      setPhase('done');
    } else { setI(i + 1); setPhase('say'); }
  };

  if (phase === 'done') {
    const facts = factsFor(route);
    return (
      <div className="page battle audit">
        <section className="card gold" role="status">
          <span className="tag">The walk is over</span>
          <h2>{route.title}</h2>
          <p className="small">{endTextFor(profile)}</p>
          <p className="small">You named {caught} of {slips} slips. Nothing here changes your scores. Wren's Audit may help you notice what you know and what you only think you know.</p>
        </section>
        {facts.length > 0 && <section className="card"><h3 className="panel-title"><PxIcon name="scroll" size={24} />Facts from this route</h3><ul className="small">{facts.map((f) => <li key={f}>{f}</li>)}</ul></section>}
        <p className="muted small">New Chronolog entries about the Audit open in the Lore tab on the Veyra page as you finish more walks.</p>
        <button className="btn primary big" autoFocus onClick={onExit}>Done</button>
      </div>
    );
  }

  const slip = !!beat.type;
  return (
    <div className="page battle audit">
      <h1 className="page-title"><PxIcon name="quill" size={36} />{route.title}</h1>
      <p className="muted small">Step {i + 1} of {beats.length}{i === 0 ? `. ${route.intro}` : ''}</p>
      <DialogueBox speaker="Wren" portrait={<Portrait id="wren" mood="neutral" scale={2} />} lines={beat.lines} />
      {phase === 'say' && (
        <section className="card" data-quiet>
          {slip ? <p className="small">{AUDIT_ASK}</p> : <p className="small">That sounded fine.</p>}
          <div className="row wrap">
            {slip && <button className="btn primary" autoFocus onClick={() => setPhase('pick')}>Stop her</button>}
            {!slip && <button className="btn primary" autoFocus onClick={next}>{i + 1 >= beats.length ? 'Finish the walk' : 'Walk on'}</button>}
            <button className="btn ghost small" onClick={onExit}>Leave the walk</button>
          </div>
          {slip && <p className="muted small">Wren slipped in what she just said. Press "Stop her" and say what kind of slip it was.</p>}
        </section>
      )}
      {phase === 'pick' && (
        <section className="card" data-quiet>
          <p className="small">{AUDIT_ASK}</p>
          <div className="tech-grid">{errorTypes(profile).map((t) => (
            <button key={t.id} className={`btn tech${pickRes?.id === t.id ? (t.id === beat.type ? ' good' : ' bad') : ''}`} disabled={!!pickRes} onClick={() => { const ok = t.id === beat.type; setPickRes({ id: t.id, ok }); if (ok) setCaught((c) => c + 1); }}><b>{t.label}</b><span className="small">{t.hint}</span></button>
          ))}</div>
          {pickRes && <p className="note" role="status">{pickRes.ok ? AUDIT_THANKS[beat.type] : fill(AUDIT_REFRAME.wrong_pick, { truth: beat.truth, label: typeLabel(beat.type) })}</p>}
          {pickRes && <button className="btn primary" autoFocus onClick={() => setPhase('fix')}>Help her fix it</button>}
        </section>
      )}
      {phase === 'fix' && (
        <form className="card" data-quiet onSubmit={(e) => { e.preventDefault(); if (!val.trim()) return; setFixRes({ ok: isFixed(beat, val) }); }}>
          <p className="small">{beat.ask}</p>
          {!fixRes && <label className="field">Your answer<input autoFocus autoComplete="off" autoCapitalize="off" spellCheck="false" value={val} onChange={(e) => setVal(e.target.value)} /></label>}
          {fixRes && <p className="note" role="status">{fixRes.ok ? `${AUDIT_FIXED[beat.type]} ${AUDIT_FIXED.close}` : fill(AUDIT_FIXED.miss, { truth: beat.truth })}</p>}
          <div className="row wrap">
            {!fixRes && <button className="btn primary" disabled={!val.trim()}>Check</button>}
            {!fixRes && <button type="button" className="btn ghost small" onClick={() => setFixRes({ ok: false })}>Show me</button>}
            {fixRes && <button type="button" className="btn primary" autoFocus onClick={next}>{i + 1 >= beats.length ? 'Finish the walk' : 'Walk on'}</button>}
          </div>
        </form>
      )}
    </div>
  );
}
