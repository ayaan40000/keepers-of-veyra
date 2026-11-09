// 1.1 The Long Vigil: pure logic for the sixth Echo scene. It reuses the Echo battle engine (free-entry answers, answer shown
// after a miss and asked again, one skip) on the player's OWN items that were learned about 1, 7 or 30 days ago.
// A vigil NEVER changes skill estimates, review sets or results. It writes only p.battles (record, history, queue)
// and p.battles.vigil. The only prize is the Watch Ledger, given for items that held at 7 or 30 days. No Lumen.
import { today } from './core.js';
import { rng, sample, daysBetween } from './util.js';
import { evaluateSideQuests } from './quests.js';
import { kindsFor, interleave, lastHeld, makeEntry, reasonFor, ensureBattles, newBattle, MIN_ITEMS, HELD_MIN_AGE, QUEUE_CAP, HISTORY_CAP } from './battle.js';
import { VIGIL_END } from '../data/vigil.js';

export const VIGIL_MAX = 8;        // phantoms in one vigil
export const VIGIL_GAP = 6;        // days between offered vigils (a week, with a day of give)
export const LEDGER_MIN = 2;       // old items held on the first try, without a hint, for the Ledger

// Which of the three "days ago" groups an age belongs to. The wording on screen says "about".
// 1.3: items from about 90 days back are Old Echoes, older and fainter Forgettings that climbed up from the Undercroft.
export const bucketOf = (age) => (age <= 5 ? 1 : age <= 20 ? 7 : age <= 60 ? 30 : 90);
export const vigilOpen = (p) => (p?.progress?.gates || []).includes('M2');

export function ensureVigil(p) {
  const b = ensureBattles(p);
  if (!b.vigil || typeof b.vigil !== 'object' || Array.isArray(b.vigil)) b.vigil = { done: 0, last: null, skipped: null, ledger: null, ledgers: 0 };
  const v = b.vigil;
  if (typeof v.done !== 'number') v.done = 0;
  if (typeof v.ledgers !== 'number') v.ledgers = 0;
  return v;
}

// Up to `max` entries from the player's own stored sets, mixed across the 7 day, 30 day and 1 day groups.
// Deterministic for a seed. At most two items from one set, so one topic does not fill the whole watch.
export function pullVigilEntries(p, seed, max = VIGIL_MAX) {
  const t = today(p), r = rng(seed);
  const groups = { 1: [], 7: [], 30: [], 90: [] };
  for (const set of p.sets || []) {
    const age = daysBetween(set.created, t);
    if (age < 1 || !Array.isArray(set.items) || !kindsFor(set).length) continue;
    const idxs = set.items.map((it, i) => i).filter((i) => !set.items[i].lure && String(set.items[i].answer || '').trim());
    if (!idxs.length) continue;
    groups[bucketOf(age)].push({ set, age, idxs });
  }
  const lists = [90, 7, 30, 1].map((k) => sample(groups[k], groups[k].length, r));
  const entries = [], used = new Set(), perSet = {};
  const add = (c) => {
    const free = c.idxs.filter((i) => !used.has(`${c.set.id}:${i}`));
    if (!free.length || (perSet[c.set.id] || 0) >= 2 || entries.length >= max) return false;
    const i = free[Math.floor(r() * free.length)];
    const kinds = kindsFor(c.set);
    const kind = kinds[Math.floor(r() * kinds.length)];
    used.add(`${c.set.id}:${i}`); perSet[c.set.id] = (perSet[c.set.id] || 0) + 1;
    const e = makeEntry(c.set, i, kind, c.age, reasonFor(c.age, lastHeld(c.set, t), false), c.set.id);
    entries.push({ ...e, bucket: bucketOf(c.age) });
    return true;
  };
  for (let round = 0; round < 2; round++) {
    for (let k = 0; entries.length < max && lists.some((l) => l[k]); k++) for (const l of lists) if (l[k]) add(l[k]);
  }
  return interleave(entries);
}

export const canKeepVigil = (p) => vigilOpen(p) && pullVigilEntries(p, 1).length >= MIN_ITEMS;

// Offered on Today after the day's session, about once a week. "Not now" costs nothing.
export function vigilOffer(p, date = today(p)) {
  if (!vigilOpen(p)) return null;
  const v = p.battles?.vigil || {};
  if (v.skipped === date || v.last === date) return null;
  if (v.last && daysBetween(v.last, date) < VIGIL_GAP) return null;
  const entries = pullVigilEntries(p, 1);
  return entries.length >= MIN_ITEMS ? { count: entries.length } : null;
}

export function newVigil(entries, opts = {}) {
  const b = newBattle(entries, { ...opts, scene: 'vigil' });
  b.resolve = 99; // no hard failure: the vigil ends when every phantom has been met, never because Resolve ran out
  return b;
}

// A lantern is lit when the answer was right on the first try (a hint is allowed). A dim one is only a flag on screen.
export const lanternState = (b, e) => ({ held: 'lit', eased: 'lit', relearned: 'dim', queued: 'dim', missed: 'dim', open: 'open' }[b.state[e.key].status] || 'open');
export function endBand(b) {
  const total = b.entries.length || 1;
  const lit = b.entries.filter((e) => lanternState(b, e) === 'lit').length;
  const f = lit / total;
  return { lit, total, band: lit === total ? 'all' : f >= 0.6 ? 'most' : f >= 0.3 ? 'some' : 'few' };
}
export const endText = (b) => VIGIL_END[endBand(b).band];

// Writes the record. Missed items go on the Echo queue so they come back first in a later Echo.
export function settleVigil(p, b) {
  const t = today(p), bt = ensureBattles(p), v = ensureVigil(p);
  const band = endBand(b);
  const by = (st) => b.entries.filter((e) => b.state[e.key].status === st);
  const heldOld = by('held').filter((e) => e.age >= HELD_MIN_AGE);
  const oldEchoes = by('held').filter((e) => e.bucket === 90).length;
  if (oldEchoes && b.outcome !== 'left') v.oldEchoes = (v.oldEchoes || 0) + oldEchoes; // a lamp on the battlements for each Old Echo held
  const queued = by('queued');
  let ledger = false;
  if (b.outcome !== 'left') {
    v.done++; v.last = t;
    if (heldOld.length >= LEDGER_MIN) { ledger = !v.ledger; v.ledgers++; if (!v.ledger) v.ledger = t; } // one Ledger, given the first time it is earned
  }
  const gone = new Set(b.entries.filter((e) => ['held', 'eased', 'relearned'].includes(b.state[e.key].status)).map((e) => e.key));
  const add = queued.filter((e) => e.setId).map((e) => ({ set: e.setId, i: e.i, date: t }));
  bt.queue = [...bt.queue.filter((q) => !gone.has(`${q.set}:${q.i}`) && !add.some((a) => a.set === q.set && a.i === q.i)), ...add].slice(-QUEUE_CAP);
  bt.history = [...bt.history, { date: t, mode: 'vigil', outcome: b.outcome === 'left' ? 'left' : 'won', items: b.entries.length, held: heldOld.length, relearned: by('relearned').length, queued: queued.length, lumen: 0 }].slice(-HISTORY_CAP);
  const quests = evaluateSideQuests(p).map((q) => q.id);
  return { ...band, oldEchoes, held: by('held').length, heldOld: heldOld.length, relearned: by('relearned').length, queued: queued.length, ledger, quests };
}
