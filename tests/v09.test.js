import { describe, it, expect } from 'vitest';
import { newProfile } from '../src/engine/core.js';
import { layoutPalace, FURNITURE_KINDS, furnitureFor } from '../src/engine/room.js';
import { buildExport, parseImport } from '../src/store.js';
import { ensureCrypt, grantKeys, startRun, floorSpec, isEchoFloor } from '../src/engine/crypt.js';
import { BOSS_TRIALS, BOSSES, CRYPT_VARIANTS } from '../src/data/crypt.js';
import { sessionStatus, buildSession, yearComplete } from '../src/engine/session.js';
import { MODULES, WEEKS } from '../src/data/curriculum.js';
import { milestoneMet, earnedItems } from '../src/engine/collect.js';
import { EPILOGUE, GATE_TALK, KEEPING_LINES } from '../src/data/afteryear.js';
import { runCardData } from '../src/ui/RunCard.jsx';

const fresh = () => newProfile('t', 'key');
const reimport = (p) => parseImport(buildExport(p));

describe('v0.9 palace furniture', () => {
  it('uses the player pick, else the guess from the name', () => {
    const rooms = layoutPalace(['Front door', 'Sofa', 'Old thing'], [null, 'plant', 'not-a-kind']);
    expect(rooms[0].stops.map((s) => s.kind)).toEqual(['door', 'plant', 'chest']);
    expect(FURNITURE_KINDS).toContain(furnitureFor('anything at all'));
  });
  it('saves picks in backups and refuses unknown furniture', () => {
    const p = fresh();
    p.palaces.push({ id: 'h', name: 'Home', loci: ['a', 'b'], furniture: [null, 'lamp'] });
    expect(reimport(p).ok).toBe(true);
    p.palaces[0].furniture = ['spaceship'];
    expect(reimport(p).ok).toBe(false);
  });
});

describe('v0.9 Undercroft', () => {
  const run = (mods) => { const p = fresh(); ensureCrypt(p); grantKeys(p, 2); startRun(p, 7, { mods }); return p; };
  it('Loud echoes bring an echo every 3rd floor', () => {
    expect([3, 5, 6, 9].map((f) => isEchoFloor(f, ['echoes']))).toEqual([true, false, true, true]);
    expect([3, 5].map((f) => isEchoFloor(f))).toEqual([false, true]);
  });
  it('Thick mist gives early floors a twist when the task has one', () => {
    const p = run(['mist']);
    for (let f = 1; f <= 4; f++) {
      const s = floorSpec(p, f, p.crypt.run.seed);
      if ((CRYPT_VARIANTS[s.spec.t] || []).length) expect(s.variants.length).toBeGreaterThan(0);
    }
    const plain = run([]);
    expect(floorSpec(plain, 1, plain.crypt.run.seed).variants).toEqual([]);
  });
  it('every boss has a trial and brings it when it can', () => {
    for (const b of BOSSES) expect(BOSS_TRIALS[b.name]?.length).toBeGreaterThan(0);
    const p = run([]);
    for (const f of [10, 20, 30, 40, 50]) {
      const s = floorSpec(p, f, p.crypt.run.seed);
      if (s.trial) expect(s.variants).toContain(s.trial);
    }
  });
  it('refuses unknown modifiers in a backup', () => {
    const p = run(['mist', 'echoes']);
    expect(reimport(p).ok).toBe(true);
    p.crypt.run.mods = ['lava'];
    expect(reimport(p).ok).toBe(false);
  });
  it('run card shows the deepest floor and counts', () => {
    const p = fresh(); ensureCrypt(p); p.crypt.deepest = 23; p.crypt.runs = 4; p.crypt.treasures = { ct_bone_dice: '2026-01-01' };
    expect(runCardData(p)).toMatchObject({ deepest: 23, runs: 4, relics: 1, alias: 't' });
  });
});

describe('v0.9 the Year of Keeping', () => {
  const finished = (days = 365) => {
    const p = fresh();
    p.progress.baselineDone = true;
    p.progress.day = 365;
    p.progress.gates = MODULES.map((m) => m.id);
    p.progress.fullDates = Array.from({ length: days }, (_, i) => new Date(Date.UTC(2025, 0, 1 + i)).toISOString().slice(0, 10));
    return p;
  };
  it('starts only after the last gate', () => {
    const p = finished();
    expect(yearComplete(p)).toBe(true);
    p.progress.gates = p.progress.gates.filter((g) => g !== 'M12');
    expect(yearComplete(p)).toBe(false);
  });
  it('walks through the weeks of the year, one per day', () => {
    const a = sessionStatus(finished(365)), b = sessionStatus(finished(366));
    expect(a.keeping).toBe(1); expect(b.keeping).toBe(2);
    expect(a.week.w).toBe(WEEKS[0].w); expect(b.week.w).toBe(WEEKS[1].w);
    expect(a.type).not.toBe('gate');
  });
  it('opens with the epilogue once, then never again', () => {
    const p = finished();
    const s = buildSession(p);
    expect(s.steps[0]).toEqual({ kind: 'story', chapter: 'epilogue' });
    expect(s.keeping).toBeGreaterThan(0);
    p.story.seen.push('epilogue');
    expect(buildSession(p).steps.some((x) => x.chapter === 'epilogue')).toBe(false);
  });
});

describe('v0.9 late-year seals', () => {
  it('are earned only by delayed recall that held', () => {
    const p = fresh();
    p.progress.gates = MODULES.map((m) => m.id);
    expect(['whole_city', 'half_year', 'long_road', 'keepers_year'].some((id) => milestoneMet(p, id))).toBe(false);
    const sks = Object.keys(p.skills).slice(0, 6);
    for (const sk of sks) p.skills[sk].probes = Array.from({ length: 10 }, (_, i) => ({ score: 0.8, delay: i === 0 ? 180 : 30 }));
    for (const id of ['whole_city', 'half_year', 'long_road', 'keepers_year']) expect(milestoneMet(p, id)).toBe(true);
    expect(earnedItems(p)).toContain('seal_keepers_year');
  });
});

describe('v0.9 story text', () => {
  it('has no dashes and plain lengths', () => {
    const all = [...EPILOGUE.text, ...Object.values(GATE_TALK).map((x) => x[1]), ...KEEPING_LINES];
    for (const t of all) expect(t).not.toMatch(/[–—]/);
    expect(EPILOGUE.text.length).toBe(5);
    expect(Object.keys(GATE_TALK)).toEqual(MODULES.map((m) => m.id)); // 1.1 added the Month 12 row
  });
});

describe('v0.9.1 traced collectibles', () => {
  it('are earned only by learning: recalls that held, relics polished, levels gained', async () => {
    const { ITEMS } = await import('../src/data/items.js');
    const p = fresh();
    const kinds = ['keepsake', 'found', 'gear'];
    const own = () => new Set(earnedItems(p));
    expect(ITEMS.filter((i) => kinds.includes(i.kind)).some((i) => own().has(i.id))).toBe(false);
    const sk = Object.keys(p.skills)[0];
    p.skills[sk].probes = Array.from({ length: 40 }, () => ({ score: 0.9, delay: 7 }));
    p.skills[sk].level = 27;
    p.relics = { polish: Object.fromEntries(Array.from({ length: 15 }, (_, i) => [`x${i}`, '2026-01-01'])) };
    for (const i of ITEMS.filter((x) => kinds.includes(x.kind))) expect(own().has(i.id)).toBe(true);
  });
  it('documents come with readable text and no dashes', async () => {
    const { ITEMS } = await import('../src/data/items.js');
    const docs = ITEMS.filter((i) => i.kind === 'document');
    expect(docs.length).toBe(8);
    for (const d of docs) { expect(d.lore.split(/\s+/).length).toBeGreaterThan(40); expect(d.lore).not.toMatch(/[–—]/); }
  });
});
