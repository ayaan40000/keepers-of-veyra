// Collection ownership is derived from profile state, never stored separately.
import { ITEMS, KINDS, ITEM_BY_ID } from '../data/items.js';
import { MODULES } from '../data/curriculum.js';
import { CONCRETE } from '../data/content.js';
import { hashStr, matches } from './util.js';

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
                : false;
    if (own) out.push(it.id);
  }
  return out;
}

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
// It brightens again when a later delayed recall passes. Only real recall changes it.
export const FADE_BELOW = 0.6;
export function fadedRelics(p) {
  const out = [];
  for (const it of ITEMS) {
    if (it.kind !== 'artifact' || it.source?.type !== 'gate' || !(p?.progress?.gates || []).includes(it.source.id)) continue;
    const mod = MODULES.find((m) => m.id === it.source.id);
    const probes = p?.skills?.[mod?.skill]?.probes || [];
    const last = probes[probes.length - 1];
    if (last && last.score < FADE_BELOW) out.push(it.id);
  }
  return out;
}

// A recall card asks for one word from a relic's story, which the player read when they earned it.
// Polishing is cosmetic and never changes skill estimates.
export function recallCard(id) {
  const item = ITEM_BY_ID[id];
  const lore = item?.lore || '';
  const words = lore.match(/[A-Za-z']+/g) || [];
  const concrete = new Set(CONCRETE);
  let pool = [...new Set(words.filter((w) => concrete.has(w.toLowerCase()) && w.length >= 4))];
  if (!pool.length) pool = [...new Set(words.filter((w) => w.length >= 6 && /^[a-z]/.test(w)))];
  if (!pool.length) return null;
  const answer = pool[hashStr(id) % pool.length];
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

// Most recently earned first (collectionSeen keeps the order items were first shown).
export function recentlyEarned(p, n = 6) {
  const own = new Set(earnedItems(p));
  return [...(p?.collectionSeen || [])].filter((id) => own.has(id)).reverse().slice(0, n);
}
