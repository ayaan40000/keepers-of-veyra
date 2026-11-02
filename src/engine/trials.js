// v0.11 District Trials and vaults: pure logic. A trial NEVER changes skill estimates, review sets or results
// (like the Undercroft and Echo battles). It writes only p.trials, a small capped amount of Lumen for vault lines held
// without a hint, and the prize is derived from p.trials[id].passed (see collect.js).
import { TRIALS, TIMELINES, DESKS, OLD_TONGUE, STALLS, CLOCK_PARTS, TABLETS_V } from '../data/trials.js';
import { rng, sample, shuffle, matches, normalize, lev, addDays, daysBetween } from './util.js';
import { today, genItems } from './core.js';
import { FREE_XP_CAP } from './progress.js';

export const TRIAL_IDS = Object.keys(TRIALS);
export const LUMEN_PER_LINE = 2;

export function ensureTrials(p) {
  if (!p.trials || typeof p.trials !== 'object' || Array.isArray(p.trials)) p.trials = {};
  return p.trials;
}
const rec = (p, id) => p.trials?.[id] || null;

export const trialOpen = (p, id) => (p.progress?.gates || []).includes(TRIALS[id].gate);

// locked | ready | rest | waiting | due | done
export function trialState(p, id, date = today(p)) {
  const t = TRIALS[id], r = rec(p, id);
  if (!t || !trialOpen(p, id)) return 'locked';
  if (r?.passed) return 'done';
  if (r?.start) return r.due && r.due <= date ? 'due' : 'waiting';
  if (r?.retryOn && r.retryOn > date) return 'rest';
  return 'ready';
}
// Trials with a check waiting today (shown on Today after the session).
export const dueTrials = (p, date = today(p)) => TRIAL_IDS.filter((id) => trialState(p, id, date) === 'due');

// ---------- material ----------
// Deterministic for a seed. study: rows to read; items: questions in the order they are asked.
export function material(id, seed, p) {
  const t = TRIALS[id], r = rng(seed);
  if (t.material === 'faces') {
    const { items } = genItems({ t: 'faces', n: t.n }, seed, p);
    const real = items.filter((x) => !x.lure);
    return {
      study: real.map((x, i) => ({ label: `Statue ${i + 1}`, face: x.face, text: x.answer })),
      items: shuffle(real.map((x, i) => ({ key: i, prompt: 'Who is this statue?', face: x.face, answer: x.answer })), r),
    };
  }
  if (t.material === 'timeline') {
    const tl = TIMELINES[Math.floor(r() * TIMELINES.length)];
    const ev = tl.events.slice(0, t.n);
    return {
      title: tl.title, real: tl.real,
      study: ev.map(([y, text, ans], i) => ({ label: `${DESKS[i]} · ${y}`, text, key: ans })),
      items: ev.map(([y, , ans, alts], i) => ({ key: i, prompt: `${y}: what happened? (it was on ${DESKS[i]})`, answer: ans, alts })),
    };
  }
  if (t.material === 'code') {
    const digits = Array.from({ length: t.n }, () => String(Math.floor(r() * 10))).join('');
    const pairs = digits.match(/../g);
    const a = 11 + Math.floor(r() * 30), b = 12 + Math.floor(r() * 30);
    return {
      study: pairs.map((d, i) => ({ label: `Dial ${i + 1}`, text: d })),
      items: [{ key: 0, prompt: `Set all ${t.n} digits, in order.`, answer: digits, code: true }],
      distraction: { q: `A clerk calls down the stairs: what is ${a} + ${b}?`, a: String(a + b) },
    };
  }
  if (t.material === 'words') {
    const words = sample(OLD_TONGUE, t.n, r);
    return {
      study: words.map(([w, m]) => ({ label: w, text: m })),
      items: shuffle(words.map(([w, m], i) => ({ key: i, prompt: `A gargoyle asks: what does "${w}" mean?`, answer: m, word: w })), r),
    };
  }
  if (t.material === 'gears') {
    const parts = sample(CLOCK_PARTS, t.n, r);
    const a = 21 + Math.floor(r() * 40), b = 9 + Math.floor(r() * 30);
    return {
      study: STALLS.slice(0, t.n).map((s, i) => ({ label: `${i + 1}. ${s}`, text: parts[i] })),
      // assembled in reverse: the last stall first
      items: STALLS.slice(0, t.n).map((s, i) => ({ key: i, prompt: `Stall ${i + 1}, ${s}: which part was here?`, answer: parts[i] })).reverse(),
      distraction: { q: `A stallholder asks you to check her change: what is ${a} - ${b}?`, a: String(a - b) },
    };
  }
  // tablet
  const tab = TABLETS_V[Math.floor(r() * TABLETS_V.length)];
  return {
    title: tab.title,
    study: tab.lines.map((l, i) => ({ label: `Line ${i + 1}`, text: l })),
    items: tab.lines.map((l, i) => ({ key: i, prompt: `Line ${i + 1}`, answer: l, line: true })),
  };
}

// ---------- matching ----------
// A whole line: case, punctuation and small typos are forgiven, but numbers and names (capitalised words after the first) must be exact.
export function lineMatches(response, target) {
  const r = String(response ?? ''), t = String(target ?? '');
  if (!normalize(r)) return false;
  const words = t.split(/\s+/);
  const strict = words.filter((w, i) => /\d/.test(w) || (i > 0 && /^[A-Z]/.test(w))).map(normalize);
  const got = new Set(r.split(/\s+/).map(normalize));
  if (!strict.every((w) => got.has(w))) return false;
  const a = normalize(r), b = normalize(t);
  return lev(a, b) <= Math.max(2, Math.floor(b.length * 0.15));
}
export function isRightTrial(item, response) {
  if (!String(response ?? '').trim()) return false;
  if (item.code) return String(response).replace(/\D/g, '') === item.answer;
  if (item.line) return lineMatches(response, item.answer);
  return matches(response, item.answer) || (item.alts || []).some((a) => matches(response, a));
}
// Vault hint ladder: first the first letter, then the first word. A hinted line can still open the vault, but earns nothing.
export const hintFor = (item, level) => (level <= 1 ? `Starts with "${item.answer[0].toUpperCase()}"` : `Starts with "${item.answer.split(/\s+/)[0]}"`);

// ---------- the record ----------
// Start a fresh attempt (new material). Returns the seed.
export function startTrial(p, id, seed = Math.floor(Math.random() * 1e9), date = today(p)) {
  const all = ensureTrials(p);
  const old = all[id] || {};
  all[id] = { ...old, seed, start: date, step: 0, due: addDays(date, TRIALS[id].checks[0].after), recovering: false };
  return seed;
}
export const currentCheck = (p, id) => { const r = rec(p, id); return r?.start ? TRIALS[id].checks[r.step] || null : null; };

// Score one check. hints: { [key]: level } for vault lines. Returns what the result screen shows.
export function submitCheck(p, id, responses, hints = {}, date = today(p)) {
  const t = TRIALS[id], all = ensureTrials(p), r = all[id];
  if (!r?.start) return null;
  const check = t.checks[r.step];
  const mat = material(id, r.seed, p);
  const right = mat.items.map((it) => isRightTrial(it, responses[it.key]));
  const n = right.filter(Boolean).length, total = mat.items.length;
  const missed = mat.items.filter((_, i) => !right[i]);
  const out = { id, step: r.step, practice: !!check.practice, quiet: !!check.quiet, n, total, right, missed, lumen: 0, passed: false, final: false };
  r.last = date;
  r.best = Math.max(r.best || 0, n);
  if (check.practice) {
    r.step++;
    r.due = addDays(r.start, t.checks[r.step].after);
    if (r.due <= date) r.due = addDays(date, 1);
    return out;
  }
  const need = Math.ceil(check.pass * total - 1e-9);
  out.need = need;
  if (n >= need) {
    r.passed = date; r.start = null; r.due = null; r.recovering = false;
    out.passed = true; out.final = true;
    // Vault lines held without a hint earn a little Lumen, inside the daily free-practice cap.
    if (t.kind === 'vault') {
      const clean = mat.items.filter((it, i) => right[i] && !hints[it.key]).length;
      const fx = p.progress.freeXp && p.progress.freeXp.date === date && Number.isFinite(p.progress.freeXp.xp) ? p.progress.freeXp : { date, xp: 0 };
      out.lumen = Math.max(0, Math.min(clean * LUMEN_PER_LINE, FREE_XP_CAP - fx.xp));
      p.progress.freeXp = { date, xp: fx.xp + out.lumen };
      p.progress.lumen += out.lumen;
    }
    return out;
  }
  r.tries = (r.tries || 0) + 1;
  out.final = true;
  if (t.recover && !r.recovering) {
    // A gentle second chance on the same material after a short review of what slipped.
    r.recovering = true;
    r.due = addDays(date, t.recover);
    out.recover = t.recover;
    out.final = false;
    return out;
  }
  r.start = null; r.due = null; r.recovering = false;
  r.retryOn = addDays(date, t.retry || 1);
  out.retryOn = r.retryOn;
  return out;
}

// Plain-language status for the trial list.
export function statusLine(p, id, date = today(p)) {
  const st = trialState(p, id, date), r = rec(p, id), t = TRIALS[id];
  if (st === 'locked') return `Opens when the ${t.district} is restored.`;
  if (st === 'done') return `Passed on ${r.passed}.`;
  if (st === 'rest') return `Fresh material from ${r.retryOn}. A miss costs nothing.`;
  if (st === 'due') return r.recovering ? 'Asked again today, after your review.' : t.checks[r.step]?.quiet ? 'A quiet check-in is ready.' : 'A check is ready today.';
  if (st === 'waiting') { const d = daysBetween(date, r.due); return `Next check in ${d} day${d === 1 ? '' : 's'} (${r.due}).`; }
  return 'Ready to try.';
}
