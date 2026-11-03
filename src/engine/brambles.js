// 1.1 Lethe Brambles: pure logic. A thorn is recorded when an item was missed in a delayed review (applyProbeStep calls noteProbe).
// It burns away only when the same item is recalled correctly in a LATER review, the next day at the earliest.
// Typing a stronger picture is kept as a note and earns nothing. Brambles never block anything and never change skill
// estimates. They are a picture of the player's own answers; switching them off (prefs.brambles) only hides them.
import { MODULES } from '../data/curriculum.js';
import { today } from './core.js';

export const THORN_CAP = 40, MAX_PER_PROBE = 3, NOTE_MAX = 300;

export function ensureBrambles(p) {
  if (!p.brambles || typeof p.brambles !== 'object' || Array.isArray(p.brambles)) p.brambles = { thorns: {}, chests: {} };
  if (!p.brambles.thorns || typeof p.brambles.thorns !== 'object' || Array.isArray(p.brambles.thorns)) p.brambles.thorns = {};
  if (!p.brambles.chests || typeof p.brambles.chests !== 'object' || Array.isArray(p.brambles.chests)) p.brambles.chests = {};
  return p.brambles;
}
export const bramblesOn = (p) => p?.user?.prefs?.brambles !== false;

// The district a skill belongs to: the latest restored one that trains it, else the first one that does.
export function districtOfSkill(p, skill) {
  const mods = MODULES.filter((m) => m.skill === skill);
  const done = mods.filter((m) => (p?.progress?.gates || []).includes(m.id));
  return (done[done.length - 1] || mods[0] || MODULES[0]).id;
}

// Called after a delayed review of one set. `result.perItem` lists what was asked and what was right.
export function noteProbe(p, set, result) {
  const t = today(p), b = ensureBrambles(p);
  const real = (target) => set.items.find((it) => !it.lure && String(it.answer) === String(target));
  const per = (result?.perItem || []).filter((x) => x && typeof x.target === 'string' && x.target.length <= 100 && real(x.target));
  let added = 0;
  for (const x of per) {
    const key = `${set.id}|${x.target}`;
    const cur = b.thorns[key];
    if (!x.ok) {
      if (added >= MAX_PER_PROBE || (cur && !cur.burned)) continue;
      const it = real(x.target);
      b.thorns[key] = { set: set.id, target: x.target, cue: it?.cue != null ? String(it.cue).slice(0, 100) : null, skill: set.skill, born: t, note: cur?.note || null, burned: null, seen: false };
      added++;
    } else if (cur && !cur.burned && cur.born < t) {
      cur.burned = t; cur.seen = false; // a later review, a different day: the vine burns away
    }
  }
  const keys = Object.keys(b.thorns);
  if (keys.length > THORN_CAP) {
    const order = keys.sort((a, c) => (b.thorns[a].burned ? 0 : 1) - (b.thorns[c].burned ? 0 : 1) || (b.thorns[a].born < b.thorns[c].born ? -1 : 1));
    for (const k of order.slice(0, keys.length - THORN_CAP)) delete b.thorns[k];
  }
}

const withDistrict = (p, key, th) => ({ key, ...th, district: districtOfSkill(p, th.skill) });
export const activeThorns = (p) => Object.entries(p?.brambles?.thorns || {}).filter(([, th]) => !th.burned).map(([k, th]) => withDistrict(p, k, th));
export const burnedThorns = (p) => Object.entries(p?.brambles?.thorns || {}).filter(([, th]) => th.burned).map(([k, th]) => withDistrict(p, k, th));
export function thornCounts(p) {
  const out = {};
  for (const th of activeThorns(p)) out[th.district] = (out[th.district] || 0) + 1;
  return out;
}
// Burned since the map was last shown (the map plays the burn once).
export const unseenBurns = (p) => burnedThorns(p).filter((th) => !th.seen);
export function markBurnsSeen(p) {
  for (const th of Object.values(p?.brambles?.thorns || {})) if (th.burned) th.seen = true;
}

export function keepNote(p, key, text) {
  const th = ensureBrambles(p).thorns[key];
  const note = String(text || '').trim().slice(0, NOTE_MAX);
  if (!th || th.burned || !note) return false;
  th.note = note;
  return true;
}

// none | guarded | free | opened. A chest is optional; opening it gives a note, never progress.
export function chestState(p, district) {
  const b = p?.brambles || {};
  if (b.chests?.[district]) return 'opened';
  if (activeThorns(p).some((th) => th.district === district)) return 'guarded';
  return burnedThorns(p).some((th) => th.district === district) ? 'free' : 'none';
}
export function openChest(p, district) {
  if (chestState(p, district) !== 'free') return false;
  ensureBrambles(p).chests[district] = today(p);
  return true;
}
export const bandOf = (n) => (n <= 0 ? 'none' : n === 1 ? 'one' : n <= 3 ? 'few' : 'many');
