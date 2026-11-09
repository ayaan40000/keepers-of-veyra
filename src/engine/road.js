// 1.6 to 1.8 The Wardens' Road: an optional Champion Track that opens at the Month 5 gate.
// Strict competition-style formats, a journey manager, number and card systems, Ennick's Book of Slips and Long Sunday.
// Results NEVER change skill estimates and earn no Lumen; the road keeps its own personal bests. Pure logic only.
// Scoring is simplified from common memory-sport rules (rows, columns, penalties) and says so on screen.
import { rng, shuffle, sample, addDays, daysBetween } from './util.js';
import { CONCRETE, ABSTRACT } from '../data/content.js';
import { majorWord } from './core.js';
import { weekForDay } from '../data/curriculum.js';

export const ROAD_HONEST = "The Wardens' Road is a hobby path for people who want to try memory sport. Competitive levels usually take years of practice. Scores here are measured on Mnemos tasks with simplified competition rules; they are not official results, and the road never changes your skill estimates.";
export const roadOpen = (p) => (p?.progress?.gates || []).includes('M5') || !!p?.progress?.reviewerUnlock;

// Disciplines. Each is a lost Warden's tablet; ids are permanent (saved data). week = the calendar week the tablet is found.
export const DISCIPLINES = [
  { id: 'journeys', block: 'C1', week: 22, title: 'The Warden of Ways', kind: 'tool', what: 'Journeys: build and look after many routes' },
  { id: 'numbers', block: 'C2', week: 26, title: 'The Warden of Counts', kind: 'event', what: 'Numbers, scored in rows of 40' },
  { id: 'words', block: 'C2', week: 26, title: 'The Warden of Names of Things', kind: 'event', what: 'Words, scored in columns of 20, exact spelling' },
  { id: 'system', block: 'C3', week: 30, title: 'The Players', kind: 'tool', what: 'Your number system: 100 Players (PAO) or 1,000 images' },
  { id: 'cards', block: 'C4', week: 36, title: 'The Warden of Wagers', kind: 'tool', what: 'Your card images and the one-card flash' },
  { id: 'binary', block: 'C5', week: 40, title: 'The Warden of Lamps', kind: 'event', what: 'Binary, rows of 30 lit or dark lamps' },
  { id: 'fdates', block: 'C5', week: 40, title: 'The Warden of Years', kind: 'event', what: 'Invented dates from Veyra\'s brass labels' },
  { id: 'images', block: 'C6', week: 44, title: 'The Warden of Mirrors', kind: 'event', what: 'Abstract images, rows of 5 put back in order' },
  { id: 'spoken', block: 'C6', week: 44, title: 'The Warden of the Clock', kind: 'event', what: 'Spoken numbers, one a second (audio, off by default)' },
  { id: 'sunday', block: 'C7', week: 48, title: 'Long Sunday', kind: 'tool', what: 'A mock championship of four events' },
];
export const DISC = Object.fromEntries(DISCIPLINES.map((d) => [d.id, d]));
export const EVENT_IDS = ['numbers', 'words', 'binary', 'fdates', 'images', 'spoken'];
export const TIMES = [60, 300, 900]; // study seconds: one-minute sprint, five-minute, fifteen-minute Long Sunday format
export const STOP_TARGETS = [50, 100, 300, 600, 1000];

export function blankRoad() {
  return { v: 1, audio: false, strict: true, system: { kind: null, pao: {}, d3: {} }, cards: {}, pb: {}, history: [], slips: {}, sundays: [], title: null, days: [] };
}
export function ensureRoad(p) {
  const b = blankRoad();
  if (!p.road || typeof p.road !== 'object') p.road = b;
  for (const k of Object.keys(b)) if (p.road[k] === undefined) p.road[k] = b[k];
  return p.road;
}

// The calendar week a player has reached (the reviewer unlock opens every tablet).
// 1.9 Road days: weekdays (0 Sunday to 6 Saturday) on which a full session drops its scene and extra rounds for the Road.
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const weekdayOf = (date) => new Date(date + 'T12:00:00').getDay();
export const roadDay = (p, date) => roadOpen(p) && Array.isArray(p?.road?.days) && p.road.days.includes(weekdayOf(date));

export function weekOf(p) { return p?.progress?.reviewerUnlock ? 99 : weekForDay(p?.progress?.day || 1).w; }
export const tabletOpen = (p, id) => roadOpen(p) && weekOf(p) >= DISC[id].week;

// ---------- material ----------
const VEYRA_WHO = ['The lamplighters', 'The Salt Guild', 'Brother Ennick', 'The Harbour Mistress', 'A travelling choir', 'The clockmakers', 'The Archive scribes', 'The ferry crews', 'A girl from the Quay', 'The Tongues Bridge masons', 'The tea sellers', 'The night watch', 'The glassblowers', 'A retired Warden', 'The market Players', 'The beekeepers of the Heights'];
const VEYRA_DID = ['paint every door blue', 'find a staircase that goes nowhere', 'race snails along the sea wall', 'lose the key to the Mother Clock', 'build a boat out of old ledgers', 'teach a gull to count to three', 'sing for nine days without stopping', 'bury a time capsule under the fountain', 'invent a soup that glows', 'swap all the street names for a joke', 'carve a lantern the size of a house', 'hold a wedding on the ferry', 'plant a lemon tree on the roof of the Archive', 'catch a fish wearing a ring', 'outlaw whistling for one afternoon', 'open a library for cats', 'draw a map of the clouds', 'win a bet against the tide'];

export function makeMaterial(id, secs, seed) {
  const r = rng(seed);
  const per = secs / 60;
  if (id === 'numbers') return { digits: Array.from({ length: Math.round(160 * per) }, () => String(Math.floor(r() * 10))).join(''), row: 40 };
  if (id === 'binary') return { digits: Array.from({ length: Math.round(450 * per / 30) * 30 }, () => (r() < 0.5 ? '0' : '1')).join(''), row: 30 };
  if (id === 'spoken') return { digits: Array.from({ length: Math.max(10, Math.round(secs / 3)) }, () => String(Math.floor(r() * 10))).join(''), row: 1000 };
  if (id === 'words') {
    const pool = [...new Set([...CONCRETE, ...ABSTRACT].map((w) => w.toLowerCase()))];
    return { words: sample(pool, Math.round(30 * per), r), col: 20 };
  }
  if (id === 'fdates') {
    const n = Math.round(20 * per), used = new Set(), out = [];
    while (out.length < n && used.size < VEYRA_WHO.length * VEYRA_DID.length) {
      const t = `${VEYRA_WHO[Math.floor(r() * VEYRA_WHO.length)]} ${VEYRA_DID[Math.floor(r() * VEYRA_DID.length)]}`;
      if (used.has(t)) continue;
      used.add(t); out.push({ text: t, year: String(1000 + Math.floor(r() * 1100)) });
    }
    return { dates: out };
  }
  if (id === 'images') {
    const rows = Math.max(2, Math.round(8 * per));
    return { rows: Array.from({ length: rows }, () => Array.from({ length: 5 }, () => blob(r))) };
  }
  return null;
}

// An abstract image: a black and white 8 by 8 pixel shape, mirrored left to right, drawn in code (never a picture file).
export function blob(r) {
  const g = [];
  for (let y = 0; y < 8; y++) { const half = Array.from({ length: 4 }, () => (r() < 0.5 ? 1 : 0)); g.push([...half, ...half.slice().reverse()]); }
  return g.map((row) => row.join('')).join('/');
}

// ---------- strict scoring ----------
const clean = (s) => String(s ?? '').replace(/\s+/g, '');
// One row: all right = the digits given (a full row, or the attempted part of the last row); one slip = half; more = nothing.
export function scoreRows(truth, rows, rowLen) {
  let score = 0, lastRow = -1;
  const misses = [];
  rows.forEach((x, i) => { if (clean(x)) lastRow = i; });
  for (let i = 0; i <= lastRow; i++) {
    const want = truth.slice(i * rowLen, (i + 1) * rowLen);
    const got = clean(rows[i]).slice(0, rowLen);
    if (!want) break;
    const len = i === lastRow ? Math.max(got.length, 1) : rowLen;
    let err = 0;
    for (let k = 0; k < len; k++) if (got[k] !== want[k]) { err++; misses.push(i * rowLen + k); }
    const val = Math.min(len, want.length);
    score += err === 0 ? val : err === 1 ? Math.floor(val / 2) : 0;
  }
  return { score, misses };
}
// Words in columns of 20: exact spelling (case ignored). A blank at the end of the last column is not a slip.
export function scoreColumns(truth, cols, colLen = 20) {
  let score = 0, lastCol = -1;
  const misses = [];
  const lines = cols.map((c) => String(c ?? '').split('\n').map((w) => w.trim().toLowerCase()));
  lines.forEach((c, i) => { if (c.some(Boolean)) lastCol = i; });
  for (let i = 0; i <= lastCol; i++) {
    const want = truth.slice(i * colLen, (i + 1) * colLen);
    let got = lines[i].slice(0, colLen);
    if (i === lastCol) { while (got.length && !got[got.length - 1]) got.pop(); }
    const len = i === lastCol ? got.length : want.length;
    let err = 0;
    for (let k = 0; k < len; k++) if ((got[k] || '') !== want[k]) { err++; misses.push(want[k]); }
    score += err === 0 ? len : err === 1 ? Math.floor(len / 2) : 0;
  }
  return { score, misses };
}
export function scoreDates(dates, answers) {
  let s = 0;
  dates.forEach((d, i) => { const a = clean(answers[i]); if (!a) return; s += a === d.year ? 1 : -0.5; });
  return { score: Math.max(0, Math.ceil(s)) };
}
// Images: each row asks the original order as positions. All five right = 5, any slip = minus 1, blank = 0.
export function scoreImages(orders, answers) {
  let s = 0;
  orders.forEach((o, i) => { const a = (answers[i] || []).map(String); if (!a.some(Boolean)) return; s += a.join() === o.map(String).join() ? 5 : -1; });
  return { score: Math.max(0, s) };
}
export function scoreSpoken(truth, given) {
  const g = clean(given);
  let k = 0;
  while (k < g.length && g[k] === truth[k]) k++;
  return { score: k };
}

// Ottoline Gilt's mark follows the player's own earlier best (a little ahead of it), never a fixed bar.
export const ottolineMark = (pb) => (pb ? Math.max(pb + 1, Math.round(pb * 1.05)) : null);

// Record a finished event. Returns {pb, prev, beatOttoline}.
export function recordEvent(p, id, secs, score, { date, misses = [], truth = '' } = {}) {
  const r = ensureRoad(p);
  const key = `${id}:${secs}`;
  const prev = r.pb[key]?.score ?? null;
  const mark = ottolineMark(prev);
  const pb = prev == null || score > prev;
  if (pb) r.pb[key] = { score, date };
  r.history = [...r.history, { date, ev: id, secs, score }].slice(-300);
  // Ennick's Book of Slips: for number events, the two-digit pair holding each missed digit
  if ((id === 'numbers' || id === 'spoken') && truth) for (const i of misses) { const j = i - (i % 2); addSlip(r, 'n:' + truth.slice(j, j + 2), 'miss', date); }
  return { pb, prev, beatOttoline: mark != null && score >= mark, mark };
}
export function addSlip(r, key, kind, date) {
  if (!/^[a-z0-9]{1,3}:[0-9A-Za-z]{1,4}$/.test(key)) return;
  const s = r.slips[key] || { miss: 0, slow: 0, last: date };
  s[kind] = Math.min(9999, (s[kind] || 0) + 1); s.last = date;
  r.slips[key] = s;
  const keys = Object.keys(r.slips);
  if (keys.length > 1200) for (const k of keys.sort((a, b) => (r.slips[a].last < r.slips[b].last ? -1 : 1)).slice(0, keys.length - 1200)) delete r.slips[k];
}
// The ten weakest images from the last 30 days.
export function weakest(p, date, n = 10) {
  const r = p.road || blankRoad();
  return Object.entries(r.slips).filter(([, s]) => daysBetween(s.last, date) <= 30).map(([k, s]) => ({ key: k, misses: s.miss || 0, slow: s.slow || 0, w: (s.miss || 0) * 2 + (s.slow || 0) }))
    .sort((a, b) => b.w - a.w).slice(0, n);
}

// ---------- journeys (C1) ----------
export function journeyStats(p, now = new Date().toISOString()) {
  const pals = p.palaces || [];
  const total = pals.reduce((n, x) => n + (x.loci?.length || 0), 0);
  const all = pals.flatMap((x) => (x.loci || []).map((l) => String(l).trim().toLowerCase()));
  const dupes = [...new Set(all.filter((l, i) => l && all.indexOf(l) !== i))];
  const list = pals.map((x) => {
    const hours = x.lastUsed ? (Date.parse(now) - Date.parse(x.lastUsed)) / 3.6e6 : null;
    return { id: x.id, name: x.name, stops: x.loci?.length || 0, lastUsed: x.lastUsed || null, hot: hours != null && hours < 24 };
  }).sort((a, b) => b.stops - a.stops);
  const next = STOP_TARGETS.find((t) => t > total) || null;
  return { total, journeys: pals.length, list, dupes, next, reached: STOP_TARGETS.filter((t) => t <= total) };
}

// ---------- number systems (C3) and cards (C4) ----------
export const pad2 = (n) => String(n).padStart(2, '0');
export const pad3 = (n) => String(n).padStart(3, '0');
export function systemImage(p, num) {
  const s = p.road?.system;
  if (s?.kind === 'd3' && num.length === 3) return s.d3[num] || null;
  if (s?.kind === 'pao' && num.length === 2) return s.pao[num]?.p || null;
  return majorWord(p, num);
}
export function systemCount(p) {
  const s = p.road?.system || {};
  if (s.kind === 'pao') return Object.values(s.pao || {}).filter((x) => x && x.p && x.a && x.o).length;
  if (s.kind === 'd3') return Object.values(s.d3 || {}).filter(Boolean).length;
  return 0;
}
// A Major-system suggestion for a number, checked by the decoder (the same rules the Major lessons use).
export const SUITS = ['S', 'H', 'D', 'C'];
export const SUIT_NAME = { S: 'Spades', H: 'Hearts', D: 'Diamonds', C: 'Clubs' };
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const DECK = SUITS.flatMap((s) => RANKS.map((r) => r + s));
export const cardLabel = (c) => `${c.slice(0, -1)} of ${SUIT_NAME[c.slice(-1)]}`;

// Conversion and flash drills: a list of prompts, each answered with the player's own image. Timed per item.
export function convPrompts(p, kind, n, seed, weak = []) {
  const r = rng(seed);
  if (kind === 'weak' && weak.length) return shuffle(weak.map((w) => w.key.split(':')[1]), r).slice(0, n);
  if (kind === 'cards') return sample(DECK.filter((c) => p.road?.cards?.[c]), n, r);
  if (kind === 'd3') return sample(Object.keys(p.road?.system?.d3 || {}).filter((k) => p.road.system.d3[k]), n, r);
  return Array.from({ length: n }, () => pad2(Math.floor(r() * 100)));
}
export const SLOW_MS = { conv: 1500, cards: 1000 };

// ---------- Long Sunday (C7) ----------
export const SUNDAY_EVENTS = ['numbers', 'words', 'binary', 'fdates'];
export function recordSunday(p, scores, date) {
  const r = ensureRoad(p);
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  r.sundays = [...r.sundays, { date, scores, total }].slice(-52);
  if (!r.title && r.sundays.length >= 4 && EVENT_IDS.filter((e) => e !== 'spoken').every((e) => Object.keys(r.pb).some((k) => k.startsWith(e + ':')))) r.title = date;
  return { total, best: Math.max(...r.sundays.map((s) => s.total)), titled: r.title === date };
}

// ---------- validation ----------
const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
const isDate = (x) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);
const sOk = (x, n) => typeof x === 'string' && x.length <= n;
export function validateRoad(r) {
  const BAD = "The Wardens' Road record is invalid.";
  if (!isObj(r) || typeof r.audio !== 'boolean' || !isObj(r.system) || !isObj(r.cards) || !isObj(r.pb) || !Array.isArray(r.history) || !isObj(r.slips) || !Array.isArray(r.sundays)) return BAD;
  if (r.title != null && !isDate(r.title)) return BAD;
  if (r.days != null && (!Array.isArray(r.days) || r.days.length > 7 || !r.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6))) return BAD;
  const s = r.system;
  if (s.kind != null && !['pao', 'd3'].includes(s.kind)) return BAD;
  if (!isObj(s.pao || {}) || Object.keys(s.pao || {}).length > 100 || !Object.entries(s.pao || {}).every(([k, v]) => /^\d\d$/.test(k) && isObj(v) && ['p', 'a', 'o'].every((f) => sOk(v[f] ?? '', 60)))) return BAD;
  if (!isObj(s.d3 || {}) || Object.keys(s.d3 || {}).length > 1000 || !Object.entries(s.d3 || {}).every(([k, v]) => /^\d{3}$/.test(k) && sOk(v, 60))) return BAD;
  if (Object.keys(r.cards).length > 52 || !Object.entries(r.cards).every(([k, v]) => DECK.includes(k) && sOk(v, 60))) return BAD;
  if (Object.keys(r.pb).length > 100 || !Object.entries(r.pb).every(([k, v]) => /^[a-z]+:\d+$/.test(k) && isObj(v) && Number.isFinite(v.score) && isDate(v.date))) return BAD;
  if (r.history.length > 300 || !r.history.every((h) => isObj(h) && isDate(h.date) && typeof h.ev === 'string' && Number.isFinite(h.score))) return BAD;
  if (Object.keys(r.slips).length > 1200 || !Object.values(r.slips).every((x) => isObj(x) && isDate(x.last))) return BAD;
  if (r.sundays.length > 52 || !r.sundays.every((x) => isObj(x) && isDate(x.date) && Number.isFinite(x.total))) return BAD;
  return null;
}
