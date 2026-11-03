// 1.1 Wren's Story Memory (v0.13): small story beats about Wren's family, and delayed questions about details the player has met.
// Story and cosmetic only. Nothing here touches skill estimates, Lumen, review sets or results, and a miss locks nothing.
// Saved in p.wren = { seen: { beatId: date }, asked: { questionId: { n, ok, last, held } }, lastBeat, lastQ }.
import { today } from './core.js';
import { daysBetween, normalize, matches, hashStr } from './util.js';
import { yearComplete, keepingDay } from './session.js';
import { WF_BEATS, WF_QUESTIONS, BEAT_BY_ID, Q_BY_ID, WREN_ASK } from '../data/wren.js';

export const MAX_ASKS = 3, RETIRE_AFTER = 2;
export const ASK_GAPS = [0, 10, 30];     // days since the last ask before asks 1, 2 and 3
export const MIN_AFTER_BEAT = 3;          // never asked sooner than this many calendar days after the beat was read

export function ensureWren(p) {
  const w = p.wren && typeof p.wren === 'object' && !Array.isArray(p.wren) ? p.wren : (p.wren = { seen: {}, asked: {}, lastBeat: null, lastQ: null });
  if (!w.seen || typeof w.seen !== 'object') w.seen = {};
  if (!w.asked || typeof w.asked !== 'object') w.asked = {};
  return w;
}
export const wrenOn = (p) => p?.user?.prefs?.wrenMemory !== false;

// The player's place in the story clock: the curriculum day, and after the year, 365 plus the keeping day.
export const wrenDay = (p) => (yearComplete(p) ? 365 + keepingDay(p) : Math.min(365, p?.progress?.day || 1));

// The oldest beat that is due and unread. One a day at most, so a long absence never buries the player in cards.
export function nextBeat(p, date = today(p)) {
  const w = p.wren || {};
  if (w.lastBeat === date) return null;
  const d = wrenDay(p);
  return WF_BEATS.find((b) => !b.epilogue && b.day <= d && !(w.seen || {})[b.id]) || null;
}
export function readBeat(p, id, date = today(p)) {
  const w = ensureWren(p);
  if (!BEAT_BY_ID[id] || w.seen[id]) return false;
  w.seen[id] = date; w.lastBeat = date;
  return true;
}
// Beat 11 is the second epilogue: reading that marks it.
export function markPortraitSeen(p, date = today(p)) { const w = ensureWren(p); if (!w.seen.wf_b11_portrait) w.seen.wf_b11_portrait = date; }
export const seenBeats = (p) => WF_BEATS.filter((b) => (p.wren?.seen || {})[b.id]);

// ---------- delayed questions ----------
export function retired(a) { return !!a && (a.ok >= RETIRE_AFTER || a.n >= MAX_ASKS); }
export function isDue(p, q, date = today(p)) {
  const w = p.wren || {};
  const seen = (w.seen || {})[q.beat];
  if (!seen || daysBetween(seen, date) < MIN_AFTER_BEAT || wrenDay(p) < q.earliest) return false;
  const a = (w.asked || {})[q.id];
  if (!a || !a.n) return true;
  if (retired(a)) return false;
  return daysBetween(a.last, date) >= ASK_GAPS[Math.min(a.n, ASK_GAPS.length - 1)];
}
// One question after a session, never on a day she already asked, and never when the switch is off.
export function dueQuestion(p, date = today(p)) {
  if (!wrenOn(p) || (p.wren || {}).lastQ === date) return null;
  const list = WF_QUESTIONS.filter((q) => isDue(p, q, date));
  if (!list.length) return null;
  // questions already asked once come first (they are the delayed ones), then the earliest in the story
  list.sort((x, y) => ((p.wren?.asked?.[y.id]?.n || 0) > 0) - ((p.wren?.asked?.[x.id]?.n || 0) > 0) || x.earliest - y.earliest);
  return list[0];
}

const strip = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(' ').filter((w) => w && !['a', 'an', 'the'].includes(w)).join(' ');
// Forgiving: ignores case, punctuation and the words a, an and the; accepts a listed answer inside a short reply; one typo on long words.
export function accepts(q, text) {
  const r = strip(text);
  if (!r) return false;
  const words = r.split(' ');
  for (const raw of q.ok) {
    const t = strip(raw);
    if (!t) continue;
    if (r === t || matches(r, t) || normalize(r) === normalize(t)) return true;
    if (words.length <= 7 && t.length >= 3 && (` ${r} `).includes(` ${t} `)) return true;
  }
  return false;
}

// Records the answer. `text` null means "I do not remember". Returns { ok, q, line }.
export function answerQuestion(p, id, text, date = today(p)) {
  const q = Q_BY_ID[id];
  if (!q) return null;
  const w = ensureWren(p);
  const ok = text != null && accepts(q, text);
  const a = w.asked[id] || (w.asked[id] = { n: 0, ok: 0, last: null, held: null });
  a.n++; a.last = date;
  if (ok) { a.ok++; if (!a.held) a.held = date; }
  w.lastQ = date;
  const h = hashStr(id + date);
  return { ok, q, lead: WREN_ASK.lead[h % WREN_ASK.lead.length], line: ok ? q.held : null, closing: ok ? WREN_ASK.held[h % WREN_ASK.held.length] : (text == null ? WREN_ASK.skip : WREN_ASK.miss[h % WREN_ASK.miss.length]) };
}

// ---------- what was held (for the Chronolog and the ending) ----------
export const heldIds = (p) => Object.entries(p.wren?.asked || {}).filter(([, a]) => a && a.held).map(([k]) => k);
export const isHeld = (p, id) => !!p.wren?.asked?.[id]?.held;
export const heldCount = (p) => heldIds(p).length;
export const FACE_IDS = ['wf_scar', 'wf_pin', 'wf_laugh', 'wf_scarf'];
export const faceKept = (p) => FACE_IDS.every((id) => isHeld(p, id));
export const lampKept = (p) => isHeld(p, 'wf_tune') && isHeld(p, 'wf_hum');
// Text for the dynamic "Wren's Keepsakes" Chronolog entry: the warm line for every detail held, in story order.
export function keepsakeText(p) {
  const lines = WF_QUESTIONS.filter((q) => isHeld(p, q.id)).map((q) => q.held);
  return lines.length ? [`Small things Wren asked about, and you kept. She says the keeping is the thing, and the asking is only her way of saying thank you.`, ...lines] : [];
}
