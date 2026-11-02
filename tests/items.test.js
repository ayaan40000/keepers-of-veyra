import { describe, it, expect } from 'vitest';
import { ITEMS, ITEM_BY_ID, KINDS, RARITY } from '../src/data/items.js';
import { ICONS, rarityFrame } from '../src/pixel/icons.js';
import { earnedItems, newlyEarned, collectionStats } from '../src/engine/collect.js';
import { newProfile } from '../src/engine/core.js';
import { SIDE_QUESTS } from '../src/data/quests.js';
import { ACHIEVEMENTS } from '../src/data/story.js';
import { MODULES } from '../src/data/curriculum.js';

const CRYPT = [['ct_bone_dice', 3], ['ct_silver_mirror', 5], ['ct_wardens_compass', 7], ['ct_nameless_crown', 9], ['ct_ysolde_wick', 11], ['ct_tide_pearl', 13],
  ['ct_hollow_mask', 15], ['ct_iron_key', 18], ['ct_star_chart', 21], ['ct_grey_phial', 25], ['ct_heart_stone', 30], ['ct_lamp_of_ages', 40]];

function checkSprite(s, w, h) {
  expect(s.w).toBe(w); expect(s.h).toBe(h);
  expect(s.px.length).toBe(h);
  for (const row of s.px) {
    expect(row.length).toBe(w);
    for (const ch of row) if (ch !== '.' && ch !== ' ') expect(s.pal[ch], `palette key ${ch}`).toMatch(/^#[0-9a-f]{6}([0-9a-f]{2})?$/i);
  }
}

describe('item data', () => {
  it('has unique ids and valid kinds, rarities and lore', () => {
    const ids = ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    const kinds = new Set(KINDS.map((k) => k.id));
    for (const it of ITEMS) {
      expect(kinds.has(it.kind)).toBe(true);
      expect(RARITY[it.rarity]).toBeTruthy();
      expect(it.name.length).toBeGreaterThan(2);
      expect(it.lore.length).toBeGreaterThan(20);
      expect(it.lore).not.toMatch(/—/); // no em dashes
    }
  });
  it('maps every gate, side quest and achievement to an item', () => {
    for (const m of MODULES) {
      expect(ITEMS.some((i) => i.kind === 'artifact' && i.source.type === 'gate' && i.source.id === m.id), `artifact for ${m.id}`).toBe(true);
      expect(ITEM_BY_ID[`page_${m.id.slice(1)}`]?.source).toEqual({ type: 'gate', id: m.id });
    }
    for (const q of SIDE_QUESTS) expect(ITEM_BY_ID[`trinket_${q.id}`]?.source).toEqual({ type: 'side', id: q.id });
    for (const a of ACHIEVEMENTS) expect(ITEM_BY_ID[`seal_${a.id}`]?.source).toEqual({ type: 'ach', id: a.id });
  });
  it('has the twelve Crypt treasures at their fixed depths', () => {
    for (const [id, depth] of CRYPT) expect(ITEM_BY_ID[id]?.source).toEqual({ type: 'crypt', depth });
    expect(ITEMS.filter((i) => i.kind === 'treasure').length).toBe(12);
  });
  it('has the expected counts by kind', () => {
    const n = (k) => ITEMS.filter((i) => i.kind === k).length;
    expect(n('artifact')).toBe(14);
    expect(n('page')).toBe(12);
    expect(n('trinket')).toBe(SIDE_QUESTS.length);
    expect(n('seal')).toBe(ACHIEVEMENTS.length + 7); // + three v0.6 mid-year and four v0.9 late-year milestone seals
  });
});

describe('icons', () => {
  it('every item has a valid 24x24 icon and no stray icons exist', () => {
    for (const it of ITEMS) { expect(ICONS[it.id], `icon for ${it.id}`).toBeTruthy(); checkSprite(ICONS[it.id], 24, 24); }
    for (const id of Object.keys(ICONS)) expect(ITEM_BY_ID[id], `item for icon ${id}`).toBeTruthy();
  });
  it('every icon has a dark outline and is not blank', () => {
    for (const it of ITEMS) {
      const s = ICONS[it.id]; const flat = s.px.join('');
      expect(flat).toMatch(/o/);
      expect(flat.replace(/[.o]/g, '').length).toBeGreaterThan(40);
    }
  });
  it('icons are distinct drawings', () => {
    const seen = new Set(ITEMS.map((it) => ICONS[it.id].px.join('|')));
    expect(seen.size).toBe(ITEMS.length);
  });
  it('rarity frames are valid 28x28 sprites', () => {
    for (const r of Object.keys(RARITY)) checkSprite(rarityFrame(r), 28, 28);
  });
});

describe('earned items', () => {
  it('a fresh profile owns only the starting items', () => {
    const p = newProfile('t', 'key');
    expect(earnedItems(p).sort()).toEqual(['brass_lantern', 'wrens_notecard']);
    const st = collectionStats(p);
    expect(st.owned).toBe(2); expect(st.total).toBe(ITEMS.length);
    expect(st.byKind.artifact).toEqual({ owned: 2, total: 14 });
    expect(st.byKind.treasure.owned).toBe(0);
  });
  it('is null-safe on partial profiles', () => {
    expect(earnedItems({}).length).toBe(2);
    expect(earnedItems(null).length).toBe(2);
    const p = newProfile('t', 'key'); delete p.story; delete p.crypt;
    expect(earnedItems(p).length).toBe(2);
  });
  it('derives items from gates, side quests, achievements and crypt treasures', () => {
    const p = newProfile('t', 'key');
    p.progress.gates = ['M1', 'M2'];
    p.story = { seen: [], sideDone: { m1_ferry: '2026-01-02', m6_grief: '2026-03-01' } };
    p.achievements = { first_light: '2026-01-01', clean_sweep: '2026-01-02' };
    p.crypt = { keys: 0, deepest: 9, runs: 3, treasures: { ct_bone_dice: '2026-02-01', ct_nameless_crown: '2026-02-03' }, tablets: {}, run: null };
    const before = earnedItems(newProfile('t', 'key'));
    const after = earnedItems(p);
    for (const id of ['art_grey_glove', 'art_side_door_key', 'page_1', 'page_2', 'trinket_m1_ferry', 'trinket_m6_grief', 'seal_first_light', 'seal_clean_sweep', 'ct_bone_dice', 'ct_nameless_crown']) expect(after).toContain(id);
    expect(after).not.toContain('page_3');
    expect(after).not.toContain('ct_tide_pearl');
    expect(newlyEarned(before, after).length).toBe(after.length - 2);
    expect(newlyEarned(after, after)).toEqual([]);
    const st = collectionStats(p);
    expect(st.owned).toBe(after.length);
    expect(st.byKind.page).toEqual({ owned: 2, total: 12 });
    expect(st.byKind.treasure).toEqual({ owned: 2, total: 12 });
    expect(st.byKind.seal.owned).toBe(2);
    expect(st.byKind.trinket.owned).toBe(2);
  });
});

describe('v0.5 fading relics and recall cards', async () => {
  const { fadedRelics, recallCard, answerCard, canPolish, earnedItems } = await import('../src/engine/collect.js');
  const { newProfile } = await import('../src/engine/core.js');
  it('a district relic fades while its latest delayed recall is under 60% and returns when one passes', () => {
    const p = newProfile('t', 'key'); p.progress.gates = ['M1'];
    p.skills.imagery.probes = [{ delay: 7, score: 0.9 }, { delay: 30, score: 0.4 }];
    expect(fadedRelics(p)).toEqual(['art_grey_glove']);
    p.skills.imagery.probes.push({ delay: 1, score: 0.8 });
    expect(fadedRelics(p)).toEqual([]);
  });
  it('a recall card polishes on the right word and waits a day after a wrong one', () => {
    const p = newProfile('t', 'key');
    const id = earnedItems(p)[0];
    const card = recallCard(id);
    expect(card.text).toContain('_____');
    expect(canPolish(p, id, '2026-11-01')).toBe(true);
    expect(answerCard(p, id, 'wrongword', '2026-11-01')).toBe(false);
    expect(canPolish(p, id, '2026-11-01')).toBe(false);
    expect(answerCard(p, id, card.answer, '2026-11-02')).toBe(true);
    expect(p.relics.polish[id]).toBe('2026-11-02');
    expect(p.skills).toEqual(newProfile('t', 'key').skills);
  });
});

describe('v0.6 mid-year seals', async () => {
  const { earnedItems } = await import('../src/engine/collect.js');
  const { newProfile } = await import('../src/engine/core.js');
  it('come only from delayed recall that held', () => {
    const p = newProfile('t', 'key');
    expect(earnedItems(p)).not.toContain('seal_month_holder');
    p.skills.imagery.probes = [30, 30, 30].map((delay) => ({ delay, score: 0.8 }));
    expect(earnedItems(p)).toContain('seal_month_holder');
    expect(earnedItems(p)).not.toContain('seal_long_memory');
    p.skills.palace.probes = [{ delay: 90, score: 0.75 }];
    expect(earnedItems(p)).toContain('seal_long_memory');
  });
});
