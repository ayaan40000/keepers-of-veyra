// Closed beta support (v0.7). Everything here stays on the device until the player chooses to save a file
// and send it themselves. No network, no identifiers: no alias, no palace names, no typed answers.
import { SKILLS } from '../data/curriculum.js';
import { sessionLengths, streaks } from './progress.js';

export const ERR_KEY = 'mnemos.errors';

export function logError(err, where = '') {
  try {
    const list = JSON.parse(localStorage.getItem(ERR_KEY) || '[]');
    list.push({ at: new Date().toISOString(), where, msg: String(err?.message || err).slice(0, 300) });
    localStorage.setItem(ERR_KEY, JSON.stringify(list.slice(-20)));
  } catch { /* storage unavailable */ }
}
export function readErrors() {
  try { return JSON.parse(localStorage.getItem(ERR_KEY) || '[]'); } catch { return []; }
}

// Anonymous summary for the beta team. The player sees exactly this before saving it.
export function betaReport(p, version, env = {}) {
  const c = p.crypt || {};
  const byTemplate = {};
  for (const r of p.results || []) {
    const b = byTemplate[r.t] || (byTemplate[r.t] = { n: 0, acc: 0 });
    b.n++; b.acc += r.acc;
  }
  for (const b of Object.values(byTemplate)) b.acc = Math.round((b.acc / b.n) * 100) / 100;
  const sk = streaks(p);
  return {
    kind: 'mnemos-beta-report', version, made: new Date().toISOString().slice(0, 10),
    device: { width: env.width ?? null, height: env.height ?? null, touch: env.touch ?? null, browser: env.browser ?? null },
    training: {
      curriculumDay: p.progress.day, daysTrained: p.progress.trainingDates.length, gates: p.progress.gates.length,
      longestStreak: Math.max(sk.longest, sk.current), extendedTimer: p.user.prefs.timerMult !== 1,
      sessionMinutes: sessionLengths(p), sessions: (p.stats?.sessions || []).slice(-120).map((s) => ({ type: s.type, minutes: s.minutes, ...(s.gap ? { gap: true } : {}) })),
      skillLevels: Object.fromEntries(Object.keys(SKILLS).map((k) => [k, p.skills[k]?.level ?? null])),
      accuracyByTask: byTemplate,
    },
    crypt: { descents: c.runs || 0, deepest: c.deepest || 0, ends: c.ends || {}, bosses: c.bosses || 0 },
    settings: { sound: p.user.prefs.sound === true, textSize: p.user.prefs.textSize || 1, readableFont: !!p.user.prefs.readableFont, reducedMotion: !!p.user.prefs.reducedMotion, theme: p.user.prefs.theme },
    errors: readErrors().map((e) => ({ at: e.at.slice(0, 10), where: e.where, msg: e.msg })),
  };
}

// Plain-text problem report the player can copy into an email or a GitHub issue.
export function problemReport({ version, page, what, env = {} }) {
  const errs = readErrors().slice(-5);
  return [
    `Mnemos problem report`,
    `Version: ${version}`,
    `Page: ${page || 'unknown'}`,
    `Browser: ${env.browser || 'unknown'}`,
    `Screen: ${env.width || '?'} x ${env.height || '?'}${env.touch ? ', touch' : ''}`,
    '',
    'What happened:',
    what || '(please describe what you did and what you expected)',
    '',
    errs.length ? 'Recent errors on this device:' : 'No errors were recorded on this device.',
    ...errs.map((e) => `- ${e.at.slice(0, 16)} ${e.where}: ${e.msg}`),
  ].join('\n');
}

export function envInfo() {
  if (typeof window === 'undefined') return {};
  return { width: window.innerWidth, height: window.innerHeight, touch: 'ontouchstart' in window, browser: (navigator.userAgent || '').slice(0, 160) };
}
