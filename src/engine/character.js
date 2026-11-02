// v0.10 character sheet. Everything here is derived from skills the player already trained: no new reward source.
import { SKILLS, MODULES } from '../data/curriculum.js';
import { GEAR, GEAR_BY_ID, CHARM_KINDS, itemOf, SLOTS } from '../data/gear.js';
import { ITEM_BY_ID } from '../data/items.js';
import { earnedItems } from './collect.js';

export const ATTR_MAX = 14;
export const ATTRIBUTES = [
  { skill: 'imagery', name: 'Vision', klass: 'Lamplighter' },
  { skill: 'linking', name: 'Weave', klass: 'Weaver' },
  { skill: 'palace', name: 'Place', klass: 'Cartographer' },
  { skill: 'faces', name: 'Faces', klass: 'Face-Reader' },
  { skill: 'numbers', name: 'Cipher', klass: 'Cipher-Smith' },
  { skill: 'vocab', name: 'Tongue', klass: 'Tongue-Warden' },
  { skill: 'structure', name: 'Lore', klass: 'Archivist' },
];

// Level (1 to 10) plus mastery step (0 to 4). A fresh skill is 1.
export function attributes(p) {
  return ATTRIBUTES.map((a) => {
    const s = p?.skills?.[a.skill] || { level: 1, mastery: 0 };
    const level = s.level || 1, mastery = s.mastery || 0;
    return { ...a, level, mastery, value: level + mastery, short: SKILLS[a.skill].short, color: SKILLS[a.skill].color };
  });
}

export function classOf(p) {
  const at = attributes(p);
  const max = Math.max(...at.map((a) => a.value)), min = Math.min(...at.map((a) => a.value));
  if (max < 3) return { title: 'Apprentice Keeper', klass: 'Apprentice', top: null };
  if (max >= 6 && max - min <= 2) return { title: 'Wayfarer', klass: 'Wayfarer', top: null };
  const top = at.find((a) => a.value === max);
  return { title: top.klass, klass: top.klass, top: top.skill };
}

export const gatesPassed = (p) => MODULES.filter((m) => (p?.progress?.gates || []).includes(m.id)).map((m) => m.id);

// Options the player may wear in a slot (owned only).
export function options(p, slot) {
  const own = new Set(earnedItems(p));
  if (slot === 'charm') {
    return [...own].filter((id) => CHARM_KINDS.includes(ITEM_BY_ID[id]?.kind)).map((id) => ({ id, slot: 'charm', effect: 'cosmetic', title: ITEM_BY_ID[id].name, note: 'Cosmetic.' }));
  }
  return GEAR.filter((g) => g.slot === slot && (itemOf(g) === null || own.has(itemOf(g))));
}

export const equipOf = (p, slot) => {
  const id = p?.keeper?.equip?.[slot];
  return id && options(p, slot).some((o) => o.id === id) ? id : null;
};
export function effects(p) {
  const out = { letters: false, count: false, stops: false };
  for (const slot of ['lantern', 'tool']) { const g = GEAR_BY_ID[equipOf(p, slot)]; if (g?.effect && g.effect !== 'cosmetic') out[g.effect] = true; }
  return out;
}
export function equip(p, slot, id) {
  if (!SLOTS.some((s) => s.id === slot)) return false;
  p.keeper = p.keeper || { equip: {} };
  p.keeper.equip = p.keeper.equip || {};
  if (id == null) { p.keeper.equip[slot] = null; return true; }
  if (!options(p, slot).some((o) => o.id === id)) return false;
  p.keeper.equip[slot] = id;
  return true;
}
// What the paper doll draws.
export function dollSpec(p) {
  const g = (slot) => GEAR_BY_ID[equipOf(p, slot)];
  const charmId = equipOf(p, 'charm');
  return {
    gates: gatesPassed(p),
    lantern: g('lantern')?.flame || '#ffd98a',
    cloak: g('cloak')?.color || '#3e4e6a',
    tool: g('tool')?.look || null,
    charm: charmId ? ITEM_BY_ID[charmId]?.rarity || 'common' : null,
  };
}
export const gearName = (id) => GEAR_BY_ID[id]?.title || ITEM_BY_ID[id]?.name || id;
