import React, { useEffect, useState } from 'react';
import { PxIcon } from './game/PxIcon.jsx';
import { today } from '../engine/core.js';
import { daysBetween } from '../engine/util.js';

// ---------- data safety rules (pure) ----------
export const BACKUP_EVERY_DAYS = 7;

// A backup is due when the player has trained and has no backup from the last 7 days (and has not snoozed it).
export function backupDue(p) {
  const pr = p?.progress;
  if (!pr || !pr.trainingDates?.length) return false;
  const now = today(p);
  if (pr.backupSnooze && daysBetween(pr.backupSnooze, now) < 3) return false;
  const since = pr.lastExport || pr.startDate;
  return daysBetween(since, now) >= BACKUP_EVERY_DAYS;
}

// Safari (not installed to the Home Screen) may clear site data after 7 days without a visit.
export function isSafariTab(nav = typeof navigator !== 'undefined' ? navigator : null) {
  if (!nav) return false;
  const ua = nav.userAgent || '';
  const safari = /safari/i.test(ua) && !/chrome|chromium|crios|fxios|edg|opr|android/i.test(ua);
  const standalone = nav.standalone === true || (typeof matchMedia !== 'undefined' && matchMedia('(display-mode: standalone)').matches);
  return safari && !standalone;
}

// 'persisted' | 'best-effort' | 'unknown'
export function useStorageStatus() {
  const [s, setS] = useState('unknown');
  useEffect(() => {
    let live = true;
    try { navigator.storage?.persisted?.().then((v) => { if (live) setS(v ? 'persisted' : 'best-effort'); }).catch(() => {}); } catch { /* ignore */ }
    return () => { live = false; };
  }, []);
  return s;
}

export const STORAGE_TEXT = {
  persisted: 'This browser has agreed to keep your data unless you clear it yourself.',
  'best-effort': 'This browser may clear your data if the device runs low on space. Keep a backup.',
  unknown: 'This browser does not say whether it will keep your data. Keep a backup.',
};

// ---------- components ----------
export function BackupReminder({ profile, update, onExport }) {
  if (!backupDue(profile)) return null;
  const last = profile.progress.lastExport;
  return (
    <section className="card notice" role="region" aria-label="Backup reminder">
      <h3 className="panel-title"><PxIcon name="flask" size={28} />Time for a backup</h3>
      <p className="small">{last ? `Your last backup was on ${last}.` : 'You have not saved a backup yet.'} Your progress lives only in this browser. A backup file keeps it safe if the browser data is cleared.</p>
      <div className="row wrap">
        <button className="btn primary" onClick={onExport}>Save a backup now</button>
        <button className="btn ghost" onClick={() => update((p) => { p.progress.backupSnooze = today(p); })}>Remind me later</button>
      </div>
    </section>
  );
}

export function SafariNotice({ profile, update }) {
  if (!isSafariTab() || profile.tips?.seen?.includes('safari')) return null;
  return (
    <section className="card notice warn-card" role="region" aria-label="Safari data warning">
      <h3 className="panel-title"><PxIcon name="lock" size={28} />A note for Safari</h3>
      <p className="small">Safari can delete a website's saved data if you do not visit it for 7 days. To be safe, save a backup from the Keeper page now and then, or add Mnemos to your Home Screen.</p>
      <button className="btn ghost" onClick={() => update((p) => { p.tips.seen = [...(p.tips.seen || []), 'safari']; })}>Got it</button>
    </section>
  );
}

// Install prompt (v0.8): offered once the player has trained on 3 or more days, never before.
export const INSTALL_AFTER_DAYS = 3;
export function installOffer(p, { standalone = false, canPrompt = false, safari = false } = {}) {
  if (standalone || p?.tips?.seen?.includes('install')) return null;
  if ((p?.progress?.trainingDates?.length || 0) < INSTALL_AFTER_DAYS) return null;
  return canPrompt ? 'prompt' : safari ? 'safari' : null;
}

export function InstallCard({ profile, update }) {
  const [canPrompt, setCanPrompt] = useState(() => typeof window !== 'undefined' && !!window.__mnemosInstall);
  useEffect(() => {
    const on = () => setCanPrompt(true);
    window.addEventListener('mnemos-installable', on);
    return () => window.removeEventListener('mnemos-installable', on);
  }, []);
  const standalone = typeof matchMedia !== 'undefined' && matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const kind = installOffer(profile, { standalone, canPrompt, safari: isSafariTab() });
  if (!kind) return null;
  const dismiss = () => update((p) => { p.tips.seen = [...new Set([...(p.tips.seen || []), 'install'])]; });
  return (
    <section className="card notice" role="region" aria-label="Install Mnemos">
      <h3 className="panel-title"><PxIcon name="lumen" size={28} />Keep Mnemos on your device</h3>
      <p className="small">Three days of training: you are making a habit. Install Mnemos so it opens like an app, works offline and keeps your progress safer from browser clean-ups.</p>
      {kind === 'safari' && <p className="small">In Safari, tap the Share button, then <b>Add to Home Screen</b>.</p>}
      <div className="row wrap">
        {kind === 'prompt' && <button className="btn primary" onClick={async () => { const ev = window.__mnemosInstall; window.__mnemosInstall = null; try { await ev.prompt(); await ev.userChoice; } catch { /* ignore */ } dismiss(); }}>Install</button>}
        <button className="btn ghost" onClick={dismiss}>{kind === 'safari' ? 'Got it' : 'Not now'}</button>
      </div>
    </section>
  );
}

// Shown when a newer version has been downloaded by the offline cache (hosted build only).
export function UpdatePrompt() {
  const [worker, setWorker] = useState(null);
  useEffect(() => {
    const on = (e) => setWorker(e.detail);
    window.addEventListener('mnemos-update', on);
    return () => window.removeEventListener('mnemos-update', on);
  }, []);
  if (!worker) return null;
  return (
    <div className="update-bar" role="status">
      <span>A new version of Mnemos is ready.</span>
      <button className="btn small primary" onClick={() => worker.postMessage({ type: 'SKIP_WAITING' })}>Update now</button>
      <button className="btn small ghost" onClick={() => setWorker(null)}>Later</button>
    </div>
  );
}

// Downloads a backup file and records the date. Shared by Keeper and the reminder.
export function downloadBackup(profile, update, buildExport) {
  const blob = new Blob([buildExport(profile)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `mnemos-${profile.user.alias.replace(/\W+/g, '-').toLowerCase()}-${today(profile)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  update((p) => { if (!p.achievements.safe_keeping) p.achievements.safe_keeping = today(p); p.progress.lastExport = today(p); p.progress.backupSnooze = null; });
}
