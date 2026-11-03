// Collection ownership is derived from profile state, never stored separately.
import { ITEMS, KINDS, ITEM_BY_ID } from '../data/items.js';
import { MODULES } from '../data/curriculum.js';
import { CONCRETE } from '../data/content.js';
import { hashStr, matches, daysBetween } from './util.js';

export function earnedItems(p) {
  const gates = new Set(p?.progress?.gates || []);
  const side = p?.story?.sideDone || {};
  const ach = p?.achievements || {};
  const treasures = p?.crypt?.treasures || {};
  const out = [];
  for (const it of ITEMS) {
    const s = it.source;
    const own = s.type === 'start' ? true
      : s.type === 'gate' ? gates.has(s.id)
        : s.type === 'side' ? !!side[s.id]
          : s.type === 'ach' ? !!ach[s.id]
            : s.type === 'crypt' ? !!treasures[it.id]
              : s.type === 'milestone' ? milestoneMet(p, s.id)
                : s.type === 'held' ? heldCount(p) >= s.n
                  : s.type === 'polish' ? Object.keys(p?.relics?.polish || {}).length >= s.n
                    : s.type === 'levels' ? levelsGained(p) >= s.n
                      : s.type === 'trial' ? !!p?.trials?.[s.id]?.passed
                        : s.type === 'vigil' ? !!p?.battles?.vigil?.ledger
                : false;
    if (own) out.push(it.id);
  }
  return out;
}

// v0.9.1 learning counters: delayed recalls that held, and skill levels gained.
export const heldCount = (p) => Object.values(p?.skills || {}).reduce((a, s) => a + (s?.probes || []).filter((x) => x.score >= 0.7).length, 0);
export const levelsGained = (p) => Object.values(p?.skills || {}).reduce((a, s) => a + Math.max(0, (s?.level || 1) - 1), 0);

// Mid-year milestones (v0.6), all from delayed recall that held at 70% or better.
export function milestoneMet(p, id) {
  const probes = Object.values(p?.skills || {}).flatMap((s) => s?.probes || []);
  const held = probes.filter((x) => x.score >= 0.7);
  if (id === 'month_holder') return held.filter((x) => x.delay >= 30).length >= 3;
  if (id === 'long_memory') return held.some((x) => x.delay >= 90);
  if (id === 'midsummer') return (p?.progress?.gates || []).length >= 6 && held.length >= 20;
  // v0.9 late-year milestones
  if (id === 'whole_city') return Object.values(p?.skills || {}).filter((s) => (s?.probes || []).some((x) => x.score >= 0.7 && x.delay >= 30)).length >= 6;
  if (id === 'half_year') return held.some((x) => x.delay >= 180);
  if (id === 'long_road') return (p?.progress?.gates || []).length >= 9 && held.length >= 40;
  if (id === 'keepers_year') return (p?.progress?.gates || []).length >= 12 && held.length >= 60;
  return false;
}

export function newlyEarned(beforeIds, afterIds) {
  const before = new Set(beforeIds || []);
  return (afterIds || []).filter((id) => !before.has(id));
}

export function collectionStats(p) {
  const owned = new Set(earnedItems(p));
  const byKind = Object.fromEntries(KINDS.map((k) => [k.id, { owned: 0, total: 0 }]));
  for (const it of ITEMS) {
    const b = byKind[it.kind] || (byKind[it.kind] = { owned: 0, total: 0 });
    b.total++;
    if (owned.has(it.id)) b.owned++;
  }
  return { owned: owned.size, total: ITEMS.length, byKind };
}

// ---------- v0.5: fading relics and recall cards ----------
// A district's artifact fades while the latest delayed recall for that district's skill is below 60%.
// It brightens again when a later delayed recall passes, or (v0.11) after a calm repair finished after that recall.
// Only real recall changes it. A dim relic means a review is due, not that something was done wrong.
export const FADE_BELOW = 0.6;
export function fadedRelics(p) {
  const out = [];
  for (const it of ITEMS) {
    if (it.kind !== 'artifact' || it.source?.type !== 'gate' || !(p?.progress?.gates || []).includes(it.source.id)) continue;
    const mod = MODULES.find((m) => m.id === it.source.id);
    const probes = p?.skills?.[mod?.skill]?.probes || [];
    const last = probes[probes.length - 1];
    const fixed = p?.relics?.repair?.[it.id]?.done;
    if (last && last.score < FADE_BELOW && !(fixed && (!last.date || fixed >= last.date))) out.push(it.id);
  }
  return out;
}

// A recall card asks for one word from a relic's story, which the player read when they earned it.
// Polishing is cosmetic and never changes skill estimates. n > 0 picks another word (the repair re-test uses a different cue).
function cardPool(lore) {
  const words = lore.match(/[A-Za-z']+/g) || [];
  const concrete = new Set(CONCRETE);
  const pool = [...new Set(words.filter((w) => concrete.has(w.toLowerCase()) && w.length >= 4))];
  return pool.length ? pool : [...new Set(words.filter((w) => w.length >= 6 && /^[a-z]/.test(w)))];
}
export function recallCard(id, n = 0) {
  const item = ITEM_BY_ID[id];
  const lore = item?.lore || '';
  const base = cardPool(lore);
  if (!base.length) return null;
  let answer = base[hashStr(id) % base.length];
  if (n > 0) {
    // another word from the same story: first the other concrete words, then longer plain words
    const rest = [...new Set([...base, ...(lore.match(/[A-Za-z']+/g) || []).filter((w) => w.length >= 6 && /^[a-z]/.test(w))])].filter((w) => w.toLowerCase() !== answer.toLowerCase());
    if (rest.length < n) return null;
    answer = rest[(hashStr(id) + n - 1) % rest.length];
  }
  const re = new RegExp(`\\b${answer}\\b`);
  return { id, answer, text: lore.replace(re, '_____'), hint: `${answer.length} letters, starts with "${answer[0].toUpperCase()}"` };
}

export function canPolish(p, id, day) {
  const r = p?.relics || {};
  return earnedItems(p).includes(id) && !r.polish?.[id] && !fadedRelics(p).includes(id) && r.tried?.[id] !== day && !!recallCard(id);
}

// Returns true when the answer is right. A wrong answer waits until tomorrow.
export function answerCard(p, id, answer, day) {
  const card = recallCard(id);
  if (!card) return false;
  p.relics = p.relics || { polish: {} };
  p.relics.polish = p.relics.polish || {};
  const ok = matches(answer, card.answer.toLowerCase());
  if (ok) p.relics.polish[id] = day;
  else p.relics.tried = { ...(p.relics.tried || {}), [id]: day };
  return ok;
}

// ---------- v0.11 calm relic repair ----------
// A faded relic is repaired by its recall card now, then a re-test with a different word 1 to 3 days later.
// No timer, no penalty: a wrong answer simply waits until the next day. Never changes skill estimates.
export function repairState(p, id, day) {
  if (!fadedRelics(p).includes(id)) return 'none';
  const r = p?.relics?.repair?.[id] || {};
  if (r.tried === day) return 'rest';
  if (!r.first) return 'first';
  const gap = daysBetween(r.first, day);
  if (gap < 1) return 'wait';
  if (gap > 3) return 'first'; // too long ago: begin the repair again
  return 'second';
}
export const repairCard = (p, id, day) => {
  const st = repairState(p, id, day);
  if (st !== 'first' && st !== 'second') return null;
  const c0 = recallCard(id, 0);
  const c1 = st === 'second' ? recallCard(id, 1) : null;
  return c1 && c1.answer !== c0?.answer ? c1 : c0;
};
export function answerRepair(p, id, answer, day) {
  const st = repairState(p, id, day);
  const card = repairCard(p, id, day);
  if (!card) return null;
  p.relics = p.relics || { polish: {} };
  const all = p.relics.repair = { ...(p.relics.repair || {}) };
  const cur = { ...(all[id] || {}) };
  const ok = matches(answer, card.answer.toLowerCase());
  if (!ok) cur.tried = day;
  else if (st === 'first') { cur.first = day; delete cur.done; }
  else { cur.done = day; delete cur.first; }
  all[id] = cur;
  return { ok, stage: st, answer: card.answer };
}

// Most recently earned first (collectionSeen keeps the order items were first shown).
export function recentlyEarned(p, n = 6) {
  const own = new Set(earnedItems(p));
  return [...(p?.collectionSeen || [])].filter((id) => own.has(id)).reverse().slice(0, n);
}
