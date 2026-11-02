import { describe, it, expect } from 'vitest';
import { newProfile } from '../src/engine/core.js';
import {
  ensureCrypt, grantKeys, canEnter, startRun, floorSpec, applyFloorResult, climbOut, unlockedTemplates, floorPool,
  depthShape, floorVariants, ALL_TEMPLATES, TEMPLATE_FIRST_WEEK, enterFloor, settleAbandonedFloor,
} from '../src/engine/crypt.js';
import { CRYPT_TUNING, TREASURES, TABLETS, BANDS, bandFor } from '../src/data/crypt.js';

const fresh = (opts = {}) => {
  const p = newProfile('t', 'key');
  if (opts.all) p.progress.reviewerUnlock = true;
  if (opts.palace) p.palaces.push({ id: 'h', name: 'Home', loci: Array.from({ length: opts.palace }, (_, i) => `stop ${i + 1}`) });
  return p;
};
const descendTo = (p, floor) => { while (p.crypt.run.floor < floor) applyFloorResult(p, 1); };

describe('crypt data', () => {
  it('has the 12 original treasures at the specified depths, then deeper v0.9.1 ones', () => {
    expect(TREASURES.length).toBe(19);
    expect(TREASURES.slice(12).every((t, i, a) => t.depth > 40 && (i === 0 || t.depth > a[i - 1].depth))).toBe(true);
    expect(TREASURES.slice(0, 12).map((t) => [t.id, t.depth])).toEqual([
      ['ct_bone_dice', 3], ['ct_silver_mirror', 5], ['ct_wardens_compass', 7], ['ct_nameless_crown', 9], ['ct_ysolde_wick', 11], ['ct_tide_pearl', 13],
      ['ct_hollow_mask', 15], ['ct_iron_key', 18], ['ct_star_chart', 21], ['ct_grey_phial', 25], ['ct_heart_stone', 30], ['ct_lamp_of_ages', 40],
    ]);
  });
  it('has 19 tablets of 60 to 120 words with no dashes', () => {
    expect(TABLETS.map((t) => t.depth)).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 19, 22, 26, 29, 33, 37, 45, 50, 55, 60, 70]);
    expect(new Set(TABLETS.map((t) => t.id)).size).toBe(19);
    for (const t of TABLETS) {
      const words = t.text.split(/\s+/).length;
      expect(words).toBeGreaterThanOrEqual(60);
      expect(words).toBeLessThanOrEqual(120);
      expect(t.text).not.toMatch(/[–—]/);
    }
  });
  it('maps every depth to a band', () => {
    expect(bandFor(1).name).toBe(BANDS[0].name);
    expect(bandFor(500).name).toBe(BANDS[BANDS.length - 1].name);
  });
});

describe('keys', () => {
  it('starts with one key and is created null-safely', () => {
    const p = fresh();
    expect(p.crypt).toBeUndefined();
    const c = ensureCrypt(p);
    expect(c).toMatchObject({ keys: 1, deepest: 0, runs: 0, treasures: {}, tablets: {}, run: null });
    ensureCrypt(p); // idempotent
    expect(p.crypt.keys).toBe(1);
    expect(ensureCrypt(null).keys).toBe(1);
  });
  it('caps held keys at 5', () => {
    const p = fresh();
    expect(grantKeys(p, 1)).toBe(1); // grantKeys creates the record (1) and adds one
    expect(p.crypt.keys).toBe(2);
    expect(grantKeys(p, 10)).toBe(3);
    expect(p.crypt.keys).toBe(CRYPT_TUNING.maxKeys);
    expect(grantKeys(p, 1)).toBe(0);
    expect(p.crypt.keys).toBe(5);
  });
  it('costs one key to enter and blocks entry without keys or during a run', () => {
    const p = fresh(); ensureCrypt(p);
    expect(canEnter(p)).toBe(true);
    expect(startRun(p, 7)).toBeTruthy();
    expect(p.crypt.keys).toBe(0);
    expect(p.crypt.runs).toBe(1);
    expect(canEnter(p)).toBe(false);
    expect(startRun(p, 8)).toBeNull(); // already in a run
    climbOut(p);
    expect(canEnter(p)).toBe(false);
    expect(startRun(p, 9)).toBeNull(); // no keys
    grantKeys(p, 1);
    expect(canEnter(p)).toBe(true);
  });
});

describe('templates and scaling', () => {
  it('unlocks templates with the curriculum week, or all with the reviewer unlock', () => {
    const p = fresh();
    expect(unlockedTemplates(p)).toEqual(['wordlist']);
    p.progress.day = 7 * 4 + 1; // week 5
    expect(unlockedTemplates(p).sort()).toEqual(['chain', 'pairs', 'palace', 'wordlist']);
    expect(floorPool(p)).not.toContain('palace'); // no palace built yet
    p.palaces.push({ id: 'x', name: 'x', loci: ['a', 'b', 'c', 'd', 'e', 'f'] });
    expect(floorPool(p)).toContain('palace');
    p.progress.reviewerUnlock = true;
    expect(unlockedTemplates(p).sort()).toEqual(ALL_TEMPLATES.slice().sort());
    expect(TEMPLATE_FIRST_WEEK).toMatchObject({ wordlist: 1, pairs: 2, chain: 3, palace: 5, faces: 9, major: 14, vocab: 22, facts: 27 });
  });
  it('gets harder monotonically with depth: more items, less time per item', () => {
    for (const t of ALL_TEMPLATES) {
      let prev = depthShape(t, 1);
      for (let f = 2; f <= 60; f++) {
        const cur = depthShape(t, f);
        expect(cur.n).toBeGreaterThanOrEqual(prev.n);
        expect(cur.perItem).toBeLessThanOrEqual(prev.perItem + 1e-9);
        prev = cur;
      }
      expect(depthShape(t, 20).n).toBeGreaterThan(depthShape(t, 1).n);
    }
  });
  it('rolls variants only from floor 6, and they become common deeper', () => {
    for (let seed = 0; seed < 50; seed++) for (let f = 1; f < 6; f++) for (const t of ALL_TEMPLATES) expect(floorVariants(t, f, seed)).toEqual([]);
    let deep = 0;
    for (let seed = 0; seed < 50; seed++) if (floorVariants('wordlist', 20, seed).length) deep++;
    expect(deep).toBe(50);
    expect(floorVariants('major', 30, 1)).toEqual([]);
  });
  it('builds valid drill steps for every floor and template', () => {
    const p = fresh({ all: true, palace: 30 });
    for (let seed = 1; seed < 6; seed++) for (let f = 1; f <= 45; f += 2) {
      const s = floorSpec(p, f, seed * 1000);
      expect(s.kind).toBe('drill');
      expect(s.role).toBe('crypt');
      expect(s.items.length).toBe(s.spec.n);
      expect(s.items.length).toBeGreaterThan(0);
      if (s.spec.interference) expect(s.extra.listB.length).toBe(s.spec.n);
      if (s.spec.t === 'digits') expect(s.spec.n % 2).toBe(0);
      if (s.spec.t === 'palace') expect(s.spec.n).toBeLessThanOrEqual(30);
    }
  });
  it('keeps the template on retry but draws fresh material', () => {
    const p = fresh({ all: true, palace: 30 });
    const a = floorSpec(p, 7, 4242, 0), b = floorSpec(p, 7, 4242, 1);
    expect(b.spec.t).toBe(a.spec.t);
    expect(JSON.stringify(b.items)).not.toBe(JSON.stringify(a.items));
  });
  it('mixes templates and avoids repeating the floor above', () => {
    const p = fresh({ all: true, palace: 30 });
    const ts = Array.from({ length: 30 }, (_, i) => floorSpec(p, i + 1, 99).spec.t);
    expect(new Set(ts).size).toBeGreaterThan(4);
    let repeats = 0; for (let i = 1; i < ts.length; i++) if (ts[i] === ts[i - 1]) repeats++;
    expect(repeats).toBeLessThanOrEqual(2);
  });
});

describe('runs', () => {
  it('descends on a pass, retries on a fail, and ends when the lamps run out', () => {
    const p = fresh(); ensureCrypt(p); startRun(p, 1);
    let r = applyFloorResult(p, 0.8);
    expect(r.outcome).toBe('descend');
    expect(p.crypt.run.floor).toBe(2);
    expect(p.crypt.deepest).toBe(1);
    r = applyFloorResult(p, 0.79);
    expect(r.outcome).toBe('retry');
    expect(p.crypt.run).toMatchObject({ floor: 2, lamps: 2, attempt: 1 });
    r = applyFloorResult(p, 0.5);
    expect(r.outcome).toBe('retry');
    expect(p.crypt.run.lamps).toBe(1);
    r = applyFloorResult(p, 0);
    expect(r.outcome).toBe('dead');
    expect(p.crypt.run).toBeNull();
    expect(r.summary).toMatchObject({ reason: 'tide', reached: 2, cleared: 1, attempts: 4, record: true });
    expect(p.crypt.history.length).toBe(1);
    expect(p.crypt.deepest).toBe(1);
  });
  it('climbing out banks the run', () => {
    const p = fresh(); ensureCrypt(p); startRun(p, 1);
    descendTo(p, 5);
    const s = climbOut(p);
    expect(s).toMatchObject({ reason: 'climbed', cleared: 4 });
    expect(p.crypt.run).toBeNull();
    expect(p.crypt.deepest).toBe(4);
    expect(Object.keys(p.crypt.treasures)).toEqual(['ct_bone_dice']);
    expect(climbOut(p)).toBeNull();
  });
  it('awards treasures and tablets once, at the right depths', () => {
    const p = fresh(); ensureCrypt(p); grantKeys(p, 4); startRun(p, 1);
    const got = {};
    for (let f = 1; f <= 71; f++) {
      const r = applyFloorResult(p, 1);
      for (const id of [...r.rewards.treasures, ...r.rewards.tablets]) got[id] = f;
      expect(r.rewards.chest).toBe(f % 4 === 0);
    }
    for (const t of TREASURES) expect(got[t.id]).toBe(t.depth);
    for (const t of TABLETS) expect(got[t.id]).toBe(t.depth);
    climbOut(p);
    startRun(p, 2);
    for (let f = 1; f <= 71; f++) { const r = applyFloorResult(p, 1); expect(r.rewards.treasures).toEqual([]); expect(r.rewards.tablets).toEqual([]); }
    expect(Object.keys(p.crypt.treasures).length).toBe(19);
    expect(Object.keys(p.crypt.tablets).length).toBe(19);
  });
  it('a chest refills one lamp flask when one is missing', () => {
    const p = fresh(); ensureCrypt(p); startRun(p, 1);
    descendTo(p, 4);
    applyFloorResult(p, 0);
    expect(p.crypt.run.lamps).toBe(2);
    const r = applyFloorResult(p, 1);
    expect(r.rewards).toMatchObject({ chest: true, oil: true });
    expect(p.crypt.run.lamps).toBe(3);
  });
  it('keeps run history to the last 20', () => {
    const p = fresh(); ensureCrypt(p);
    for (let i = 0; i < 25; i++) { grantKeys(p, 1); startRun(p, i); applyFloorResult(p, 1); climbOut(p); }
    expect(p.crypt.history.length).toBe(CRYPT_TUNING.historyMax);
    expect(p.crypt.runs).toBe(25);
  });
  it('never touches skills, curriculum progress or results', () => {
    const p = fresh({ all: true, palace: 30 });
    const before = JSON.stringify({ skills: p.skills, progress: p.progress, results: p.results, sets: p.sets });
    ensureCrypt(p); grantKeys(p, 3); startRun(p, 3);
    for (let f = 0; f < 20; f++) { floorSpec(p, p.crypt.run.floor, 3); applyFloorResult(p, f % 3 ? 1 : 0.2); if (!p.crypt.run) break; }
    climbOut(p);
    expect(JSON.stringify({ skills: p.skills, progress: p.progress, results: p.results, sets: p.sets })).toBe(before);
  });
});

describe('v0.4 crypt fixes', () => {
  it('extended study timers apply to floors', () => {
    const p = fresh(); const q = fresh(); q.user.prefs.timerMult = 2;
    startRun(p, 5); startRun(q, 5);
    const a = floorSpec(p, 1, 5), b = floorSpec(q, 1, 5);
    expect(b.spec.s).toBe(Math.round(a.spec.s * 2));
  });
  it('leaving mid-floor costs a flask; finishing clears the mark', () => {
    const p = fresh(); startRun(p, 7);
    enterFloor(p);
    const out = settleAbandonedFloor(p);
    expect(out.left).toBe(true); expect(out.outcome).toBe('retry');
    expect(p.crypt.run.lamps).toBe(CRYPT_TUNING.lamps - 1);
    expect(settleAbandonedFloor(p)).toBe(null);
    enterFloor(p); applyFloorResult(p, 1);
    expect(p.crypt.run.inFloor).toBeUndefined();
  });
  it('leaving on the last flask ends the run', () => {
    const p = fresh(); startRun(p, 7); p.crypt.run.lamps = 1;
    enterFloor(p);
    const out = settleAbandonedFloor(p);
    expect(out.outcome).toBe('dead'); expect(p.crypt.run).toBe(null); expect(out.summary.reason).toBe('left');
  });
});

describe('v0.5 echo floors', async () => {
  const { isEchoFloor } = await import('../src/engine/crypt.js');
  it('every 5th floor echoes the floor two above, without study', () => {
    expect([1, 4, 5, 6, 10, 15].map(isEchoFloor)).toEqual([false, false, true, false, false, true]);
    const p = fresh({ all: true }); startRun(p, 11);
    while (p.crypt.run.floor < 5) { const st = floorSpec(p, p.crypt.run.floor, 11); applyFloorResult(p, 1, st); }
    const echo = floorSpec(p, 5, 11, 0);
    expect(echo.echo).toBe(true); expect(echo.echoFrom).toBe(3);
    expect(echo.items.map((x) => x.answer)).toEqual(p.crypt.run.mem[3].items.filter((x) => !x.lure).map((x) => x.answer));
    expect(floorSpec(p, 5, 11, 1).echo).toBeUndefined();
    expect(Object.keys(p.crypt.run.mem).every((k) => +k >= 2)).toBe(true);
  });
  it('without a remembered floor the echo floor is ordinary', () => {
    const p = fresh(); startRun(p, 3); p.crypt.run.floor = 5;
    expect(floorSpec(p, 5, 3).echo).toBeUndefined();
  });
});

describe('v0.6 boss floors, weekly descent and modifiers', async () => {
  const { isBossFloor, weekKey, weeklySeed } = await import('../src/engine/crypt.js');
  it('every 10th floor is a bigger boss floor that refills the oil when beaten', () => {
    expect([9, 10, 20, 25].map(isBossFloor)).toEqual([false, true, true, false]);
    const p = fresh({ all: true }); startRun(p, 21);
    descendTo(p, 10);
    p.crypt.run.lamps = 1;
    const boss = floorSpec(p, 10, 21);
    expect(boss.boss).toBe(true); expect(boss.bossName).toBeTruthy();
    const out = applyFloorResult(p, 1, boss);
    expect(out.rewards.boss).toBe(true); expect(p.crypt.run.lamps).toBe(CRYPT_TUNING.lamps); expect(p.crypt.bosses).toBe(1);
  });
  it('the weekly descent uses one seed per ISO week and keeps the best depth', () => {
    expect(weekKey(new Date(2026, 0, 1))).toBe('2026-W01');
    expect(weekKey(new Date(2026, 10, 1))).toBe('2026-W44');
    expect(weeklySeed('2026-W44')).toBe(weeklySeed('2026-W44'));
    expect(weeklySeed('2026-W44')).not.toBe(weeklySeed('2026-W45'));
    const p = fresh(); grantKeys(p, 2); startRun(p, 1, { weekly: true });
    expect(p.crypt.run.seed).toBe(weeklySeed(weekKey()));
    applyFloorResult(p, 1); applyFloorResult(p, 1); climbOut(p);
    expect(p.crypt.weekly[weekKey()]).toBe(2);
    expect(p.crypt.ends[3]).toBe(1);
  });
  it('dim lamps start with two flasks; swift water shortens study', () => {
    const p = fresh(); startRun(p, 4, { mods: ['dim', 'swift'] });
    expect(p.crypt.run.lamps).toBe(CRYPT_TUNING.lamps - 1);
    const q = fresh(); startRun(q, 4);
    expect(floorSpec(p, 3, 4).spec.s).toBeLessThan(floorSpec(q, 3, 4).spec.s);
  });
});
