import React, { useRef, useState } from 'react';
import { VOICES_SETTING } from '../data/voices.js';
import { BRAMBLES_SETTING } from '../data/brambles.js';
import { WREN_SETTING } from '../data/wren.js';
import { PxIcon } from './game/PxIcon.jsx';
import { ACHIEVEMENTS, wrenStage } from '../data/story.js';
import { rankOf } from '../engine/progress.js';
import { buildExport, parseImport, backend, MAX_IMPORT_BYTES } from '../store.js';
import { downloadBackup, useStorageStatus, STORAGE_TEXT } from './Notices.jsx';
import { LICENSES } from '../data/licenses.js';
import { sfx } from '../audio/sfx.js';
import { betaReport, problemReport, envInfo } from '../engine/beta.js';
import { today } from '../engine/core.js';
import { importWarning } from '../engine/owntext.js';
import { OWN } from '../data/owntext.js';
import { Sigil, AVATARS } from './art.jsx';

function saveText(name, text, type = 'text/plain') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// Feedback (closed beta in v0.7, open to everyone from v1.0): an anonymous report the player saves and shares by hand, and a problem report.
function BetaTools({ profile }) {
  const [what, setWhat] = useState('');
  const [copied, setCopied] = useState('');
  const report = betaReport(profile, __APP_VERSION__, envInfo());
  const problem = problemReport({ version: __APP_VERSION__, page: 'Keeper', what, env: envInfo() });
  return (
    <section className="card">
      <h3 className="panel-title"><PxIcon name="scroll" size={28} />Help improve Mnemos</h3>
      <p className="small">Mnemos grows with its players. If you want to help tune it, save this anonymous report now and then and attach it to a GitHub issue. It holds no name, no palace names and nothing you typed: only numbers about your training, session lengths and Undercroft depths. Look inside before you share it.</p>
      <details className="about-more"><summary>What is in the report</summary><pre className="licence-text-pre">{JSON.stringify(report, null, 1)}</pre></details>
      <button className="btn" onClick={() => saveText(`mnemos-beta-report-${today(profile)}.json`, JSON.stringify(report, null, 1), 'application/json')}>Save anonymous report</button>
      <h4 className="set-sub">Report a problem</h4>
      <label className="field">What happened?<textarea rows={3} maxLength={2000} value={what} onChange={(e) => setWhat(e.target.value)} placeholder="What you did, what you expected, what happened instead" /></label>
      <div className="row wrap">
        <button className="btn small" onClick={() => { navigator.clipboard?.writeText(problem).then(() => setCopied('Copied. Paste it into an email or a GitHub issue.'), () => setCopied('Copy did not work here. Use Save instead.')); }}>Copy problem report</button>
        <button className="btn small" onClick={() => saveText(`mnemos-problem-${today(profile)}.txt`, problem)}>Save as a text file</button>
      </div>
      {copied && <p className="small note" role="status">{copied}</p>}
    </section>
  );
}

export default function Keeper({ profile, update, replaceProfile, wipe, openCharacter }) {
  const [imp, setImp] = useState(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [msg, setMsg] = useState('');
  const fileRef = useRef(null);
  const rank = rankOf(profile.progress.lumen);
  const prefs = profile.user.prefs;
  const setPref = (k, v) => update((p) => { p.user.prefs[k] = v; });

  const storage = useStorageStatus();

  function doExport() {
    downloadBackup(profile, update, buildExport);
    setMsg('Backup downloaded. Keep it somewhere safe; it is your only copy outside this browser.');
  }

  function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    e.target.value = '';
    if (f.size > MAX_IMPORT_BYTES) { setImp({ ok: false, error: 'This file is larger than 10 MB, so it cannot be a Mnemos backup.' }); return; }
    f.text().then((txt) => setImp(parseImport(txt)), () => setImp({ ok: false, error: 'This file could not be read.' }));
  }

  return (
    <div className="page">
      <h1 className="page-title"><PxIcon name="keeper" size={36} />Keeper</h1>
      <section className="card profile-card">
        <div className="avatar"><Sigil kind={profile.user.avatar} size={56} /></div>
        <div>
          <h2>{profile.user.alias}</h2>
          <p className="muted">{rank.title} · rank {rank.rank} · {profile.progress.lumen} Lumen · Wren is {wrenStage(profile.progress.gates.length).name}</p>
          {openCharacter && <button className="btn small" onClick={openCharacter}>Open the character sheet</button>}
          <p className="muted small">Training since {profile.progress.startDate} · curriculum day {profile.progress.day} of 365 · {profile.meta.curriculum}</p>
        </div>
      </section>

      <section className="card">
        <h3 className="panel-title"><PxIcon name="chest" size={28} />Achievements</h3>
        <div className="ach-grid">{ACHIEVEMENTS.map((a) => (
          <div key={a.id} className={`seal ${profile.achievements[a.id] ? 'on' : ''}`}>
            <PxIcon name={profile.achievements[a.id] ? 'star' : 'lock'} size={32} />
            <b>{a.name}</b><span className="small">{a.desc}</span>
            <span className="small muted">{profile.achievements[a.id] ? `Earned ${profile.achievements[a.id]}` : 'Not yet'}</span>
          </div>
        ))}</div>
      </section>

      <section className="card settings">
        <h3 className="panel-title"><PxIcon name="gear" size={28} />Settings</h3>
        <fieldset className="set-group">
          <legend>Audio</legend>
          <label className="check"><input type="checkbox" checked={prefs.sound === true} onChange={(e) => setPref('sound', e.target.checked)} /> <span>Sound effects <span className="muted small">(off until you turn them on)</span></span></label>
          <label className="check"><input type="checkbox" disabled={prefs.sound !== true} checked={prefs.blips !== false} onChange={(e) => setPref('blips', e.target.checked)} /> <span>Dialogue blips <span className="muted small">(little ticks while characters talk)</span></span></label>
          <label className="field">Volume {Math.round((prefs.volume ?? 0.6) * 100)}%
            <input type="range" min="0" max="1" step="0.1" disabled={prefs.sound !== true} value={prefs.volume ?? 0.6} onChange={(e) => setPref('volume', +e.target.value)} onPointerUp={() => sfx.confirm()} />
          </label>
          <p className="muted small">Study and recall screens stay silent apart from one soft sound when you check your answers.</p>
        </fieldset>
        <fieldset className="set-group">
          <legend>Display</legend>
          <label className="field">Theme
            <select value={prefs.theme} onChange={(e) => setPref('theme', e.target.value)}><option value="dark">Night (dark)</option><option value="light">Parchment (light)</option><option value="system">Follow device</option></select>
          </label>
          <label className="field">Open the app on
            <select value={prefs.home || 'today'} onChange={(e) => setPref('home', e.target.value)}><option value="today">Today (quest board)</option><option value="veyra">The map of Veyra</option></select>
          </label>
          <label className="field">Text size
            <select value={prefs.textSize || 1} onChange={(e) => setPref('textSize', +e.target.value)}><option value={1}>100%</option><option value={1.15}>115%</option><option value={1.3}>130%</option><option value={1.5}>150%</option></select>
          </label>
          <label className="check"><input type="checkbox" checked={!!prefs.readableFont} onChange={(e) => setPref('readableFont', e.target.checked)} /> <span>Readable text <span className="muted small">(clean serif for reading, instead of pixel type)</span></span></label>
          <label className="check"><input type="checkbox" checked={!!prefs.reducedMotion} onChange={(e) => setPref('reducedMotion', e.target.checked)} /> Reduce motion</label>
          <label className="field">{VOICES_SETTING.label}
            <select value={prefs.voices || VOICES_SETTING.default} onChange={(e) => setPref('voices', e.target.value)}>{VOICES_SETTING.options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</select>
          </label>
          <p className="muted small">{VOICES_SETTING.options.find((o) => o.id === (prefs.voices || VOICES_SETTING.default))?.text} Voices never speak during study or recall.</p>
          <label className="check"><input type="checkbox" checked={prefs.brambles !== false} onChange={(e) => setPref('brambles', e.target.checked)} /> <span>{BRAMBLES_SETTING.label} <span className="muted small">({prefs.brambles !== false ? BRAMBLES_SETTING.on : BRAMBLES_SETTING.off})</span></span></label>
          <p className="muted small">{BRAMBLES_SETTING.explain}</p>
          <label className="check"><input type="checkbox" checked={prefs.ledgerFirst !== false} onChange={(e) => setPref('ledgerFirst', e.target.checked)} /> <span>Open the day with the Ledger <span className="muted small">(from week 5, your due cards come first; you can always skip)</span></span></label>
          <label className="check"><input type="checkbox" checked={prefs.wrenMemory !== false} onChange={(e) => setPref('wrenMemory', e.target.checked)} /> <span>{WREN_SETTING.label} <span className="muted small">({prefs.wrenMemory !== false ? WREN_SETTING.on : WREN_SETTING.off})</span></span></label>
        </fieldset>
        <fieldset className="set-group">
          <legend>Training</legend>
          <label className="field">Study timer
            <select value={prefs.timerMult} onChange={(e) => setPref('timerMult', +e.target.value)}><option value={1}>Standard</option><option value={1.5}>Extended (1.5x)</option><option value={2}>Extended (2x)</option></select>
          </label>
          <p className="muted small">Extended timers apply to new sessions and Undercroft floors, and are recorded with your results.</p>
          <button className="btn small" onClick={() => { update((p) => { p.tips.seen = (p.tips.seen || []).filter((x) => x === 'safari'); }); setMsg('Tips will show again as you go.'); }}>Replay tips</button>
        </fieldset>
      </section>

      <section className="card">
        <h3 className="panel-title"><PxIcon name="flask" size={28} />Your data</h3>
        <p className="small">Stored only in this browser ({backend}). Nothing is sent anywhere. Clearing this site's browser data deletes your progress, so export a backup regularly. {profile.progress.lastExport ? `Last export: ${profile.progress.lastExport}.` : 'No backup yet.'}</p>
        <p className="small muted" data-testid="storage-status">{STORAGE_TEXT[storage]}</p>
        <div className="row wrap">
          <button className="btn primary" onClick={doExport}>Export backup</button>
          <button className="btn" onClick={() => fileRef.current.click()}>Import backup</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onFile} data-testid="import-file" />
        </div>
        {msg && <p className="note">{msg}</p>}
        {imp && (imp.ok ? (
          <div className="note">
            <p><b>Backup for {imp.profile.user.alias}</b>: day {imp.profile.progress.day}, {imp.profile.progress.lumen} Lumen, {imp.profile.results.length} results, {imp.profile.palaces.length} palaces.</p>
            {imp.warning && <p className="warn">{imp.warning}</p>}
            {importWarning(profile.own, imp.profile.own) && <p className="warn" role="alert">{importWarning(profile.own, imp.profile.own)} Use Export my texts only on Your Shelf first if you want to keep them.</p>}
            <p>Importing replaces the profile in this browser.</p>
            <div className="row"><button className="btn primary" onClick={() => { replaceProfile(imp.profile); setImp(null); setMsg('Profile restored from backup.'); }}>Replace with this backup</button><button className="btn" onClick={() => setImp(null)}>Cancel</button></div>
          </div>
        ) : <p className="warn">{imp.error}</p>)}
        {profile.own?.texts?.length > 0 && <p className="small muted">{OWN.backupLine}</p>}
        <p className="small muted">To continue on another device: export here, move the file, then import on the other device.</p>
        {!confirmDel ? <button className="btn ghost danger" onClick={() => setConfirmDel(true)}>Delete all data</button> : (
          <div className="note"><p>This permanently deletes your profile from this browser. Export first if you might want it back.</p>
            <div className="row"><button className="btn danger" onClick={wipe}>Delete everything</button><button className="btn" onClick={() => setConfirmDel(false)}>Cancel</button></div></div>
        )}
      </section>

      <BetaTools profile={profile} />

      <section className="card reviewer">
        <h3 className="panel-title"><PxIcon name="gear" size={28} />Prototype review tools</h3>
        <p className="muted small">For reviewing the prototype only; not part of the product. The simulated clock lets you test next-day recall and streak logic without waiting.</p>
        <p className="small">Simulated date: <b>{today(profile)}</b> ({profile.progress.dayOffset >= 0 ? '+' : ''}{profile.progress.dayOffset} days)</p>
        <div className="row wrap">
          <button className="btn small" onClick={() => update((p) => { p.progress.dayOffset += 1; })}>Advance 1 day</button>
          <button className="btn small" onClick={() => update((p) => { p.progress.dayOffset += 7; })}>Advance 7 days</button>
          <button className="btn small" onClick={() => update((p) => { p.progress.dayOffset = 0; })}>Real date</button>
          <label className="check small"><input type="checkbox" checked={!!profile.progress.reviewerUnlock} onChange={(e) => update((p) => { p.progress.reviewerUnlock = e.target.checked; })} /> Unlock all Training Grounds drills</label>
        </div>
        <label className="field small">Jump curriculum to week
          <select value="" onChange={(e) => { const w = +e.target.value; if (w) update((p) => { p.progress.day = (w - 1) * 7 + 1; p.progress.baselineDone = true; p.inProgress = null; }); }}>
            <option value="">Choose…</option>{Array.from({ length: 52 }, (_, i) => <option key={i} value={i + 1}>Week {i + 1}</option>)}
          </select>
        </label>
      </section>

      <section className="card">
        <h3 className="panel-title"><PxIcon name="quill" size={28} />About</h3>
        <p className="small">Mnemos: Keepers of Veyra, version {__APP_VERSION__}. A free, open-source memory training game. Scores measure performance on Mnemos tasks only and are not an intelligence test, a clinical memory assessment or medical advice. If you are worried about changes in your memory, talk to a doctor.</p>
        <details className="about-more">
          <summary>Privacy</summary>
          <p className="small">Mnemos has no accounts, no analytics, no adverts and no trackers. It makes no network requests while you play. Everything you do is saved only in this browser, and only you can export it. Deleting your data here removes it completely.</p>
        </details>
        <details className="about-more">
          <summary>Licences and credits</summary>
          <p className="small">Code: MIT licence. All art, characters and story are original to Mnemos and drawn in code. Bundled software:</p>
          <ul className="small">{LICENSES.map((l) => <li key={l.name}>{l.label} {l.version} ({l.license})</li>)}</ul>
          {LICENSES.filter((l, i, a) => a.findIndex((x) => x.license === l.license) === i).map((l) => (
            <details key={l.license} className="licence-text"><summary>{l.license === 'OFL-1.1' ? 'SIL Open Font License 1.1 (full text)' : `${l.license} licence (full text)`}</summary><pre>{l.text}</pre></details>
          ))}
        </details>
      </section>
    </div>
  );
}
