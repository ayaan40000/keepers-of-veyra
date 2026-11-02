import { Tip } from './Tips.jsx';
import React, { useState } from 'react';
import { PxIcon } from './game/PxIcon.jsx';
import { SUGGESTED_LOCI, MAJOR_CODE, MAJOR_PAIRS, MAJOR_SINGLE } from '../data/content.js';
import { uid, majorDecode } from '../engine/util.js';

export function PalaceEditor({ initial, minLoci = 5, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || 'My home');
  const [text, setText] = useState((initial?.loci || []).join('\n'));
  const loci = text.split('\n').map((s) => s.trim()).filter(Boolean);
  const dupes = loci.filter((l, i) => loci.findIndex((x) => x.toLowerCase() === l.toLowerCase()) !== i);
  const ok = name.trim() && loci.length >= minLoci && !dupes.length;
  return (
    <div className="palace-editor">
      <label className="field">Palace name<input value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label className="field">Stops in walking order, one per line ({loci.length})
        <textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder={'Front door\nDoormat\nCoat hook\n…'} />
      </label>
      {!text && <button className="btn small" onClick={() => setText(SUGGESTED_LOCI.join('\n'))}>Start from a suggested home route</button>}
      <p className="muted small">Pick stops you can picture clearly, spread apart, in the order you would walk them. Edit the suggestions to match your real home. Minimum {minLoci}.</p>
      {dupes.length > 0 && <p className="warn">Each stop must be unique: {dupes.join(', ')}</p>}
      <div className="row">
        <button className="btn primary" disabled={!ok} onClick={() => onSave({ id: initial?.id || uid(), name: name.trim(), loci, lastUsed: initial?.lastUsed || null, created: initial?.created || new Date().toISOString() })}>Save palace</button>
        {onCancel && <button className="btn" onClick={onCancel}>Cancel</button>}
      </div>
    </div>
  );
}

export default function Palaces({ profile, update }) {
  const [editing, setEditing] = useState(null);
  const [showMajor, setShowMajor] = useState(false);
  const save = (pal) => update((p) => {
    const i = p.palaces.findIndex((x) => x.id === pal.id);
    if (i >= 0) p.palaces[i] = pal; else p.palaces.push(pal);
    if (pal.loci.length >= 10 && !p.achievements.cornerstone) { p.achievements.cornerstone = new Date().toISOString().slice(0, 10); (p._newAch = p._newAch || []).push('cornerstone'); }
  });
  return (
    <div className="page">
      <h1 className="page-title"><PxIcon name="palace" size={36} />Palaces</h1>
      <Tip profile={profile} update={update} id="palaces">A palace is a route through a place you know well, like your home. Pick stops in the order you would walk past them. Ten clear stops beat thirty vague ones.</Tip>
      <p className="lead">Your memory palaces are real routes through places you know. Rest a palace for a day before reusing it, so old images fade.</p>
      {editing ? (
        <section className="card parchment"><PalaceEditor initial={editing === 'new' ? null : editing} onSave={(pal) => { save(pal); setEditing(null); }} onCancel={() => setEditing(null)} /></section>
      ) : (
        <>
          {profile.palaces.length === 0 && <section className="card glass"><p>No palaces yet. Month 2 teaches you to build one; you can start now.</p></section>}
          {profile.palaces.map((pl) => (
            <section className="card" key={pl.id}>
              <div className="row between wrap"><h3 className="panel-title"><PxIcon name="palace" size={28} />{pl.name}</h3><span className="muted small">{pl.loci.length} stops{pl.lastUsed ? ` · used ${pl.lastUsed.slice(0, 10)}` : ''}</span></div>
              <ol className="loci-list">{pl.loci.map((l, i) => <li key={i}>{l}</li>)}</ol>
              <div className="row">
                <button className="btn small" onClick={() => setEditing(pl)}>Edit</button>
                <button className="btn small ghost" onClick={() => { if (confirm(`Delete palace "${pl.name}"?`)) update((p) => { p.palaces = p.palaces.filter((x) => x.id !== pl.id); }); }}>Delete</button>
              </div>
            </section>
          ))}
          <button className="btn primary has-icon" onClick={() => setEditing('new')}><PxIcon name="quill" size={24} />New palace</button>
        </>
      )}
      <section className="card">
        <div className="row between"><h3 className="panel-title"><PxIcon name="scroll" size={28} />Number images (Major System)</h3><button className="btn small" onClick={() => setShowMajor(!showMajor)}>{showMajor ? 'Hide' : 'Show'}</button></div>
        <p className="muted small">Taught in Month 4. Replace any suggested word that does not feel vivid. A word is valid if its consonant sounds encode the number.</p>
        {showMajor && <MajorEditor profile={profile} update={update} />}
      </section>
    </div>
  );
}

function MajorEditor({ profile, update }) {
  const keys = [...MAJOR_SINGLE.map((_, i) => String(i)), ...MAJOR_PAIRS.map((_, i) => String(i).padStart(2, '0'))];
  const def = (k) => (k.length === 1 ? MAJOR_SINGLE[+k] : MAJOR_PAIRS[+k]);
  return (
    <>
      <div className="code-grid small">{MAJOR_CODE.map(([d, s]) => <div key={d}><b>{d}</b> {s}</div>)}</div>
      <div className="major-grid">
        {keys.map((k) => {
          const v = profile.major[k] ?? def(k);
          const valid = majorDecode(v) === k;
          return (
            <label key={k} className={valid ? '' : 'invalid'}><span className="mono">{k}</span>
              <input value={v} {...{ autoComplete: 'off', spellCheck: false }} aria-label={`Image for ${k}`} onChange={(e) => update((p) => { p.major[k] = e.target.value; })} />
            </label>
          );
        })}
      </div>
      <p className="muted small">Words outlined in amber do not decode exactly by the simple sound rules (silent letters, for example). They still count if you remember them.</p>
    </>
  );
}
