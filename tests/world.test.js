import { describe, it, expect } from 'vitest';
import {
  DISTRICT_POS, DISTRICT_IDS, LANDMARKS, MAP_W, MAP_H, buildMapBase, buildMapState, buildBanner, buildTitle, BANNER_IDS, BANNER_W, BANNER_H, TITLE_W, TITLE_H, districtState,
} from '../src/ui/pixel/world.js';
import { MODULES } from '../src/data/curriculum.js';

const digest = (d) => { let h = 2166136261; for (let i = 0; i < d.length; i += 3) h = Math.imul(h ^ d[i], 16777619); return h >>> 0; };

describe('world map', () => {
  it('has a position for each of the 12 districts, inside the map', () => {
    expect(Object.keys(DISTRICT_POS)).toHaveLength(12);
    expect(Object.keys(DISTRICT_POS)).toEqual(MODULES.map((m) => m.id));
    for (const id of DISTRICT_IDS) {
      const { x, y } = DISTRICT_POS[id];
      expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThan(MAP_W);
      expect(y).toBeGreaterThanOrEqual(0); expect(y).toBeLessThan(MAP_H);
      const s = LANDMARKS[id];
      expect(s.x0).toBeGreaterThanOrEqual(0); expect(s.x0 + s.w).toBeLessThanOrEqual(MAP_W);
      expect(s.y0).toBeGreaterThanOrEqual(0); expect(s.y0 + s.h).toBeLessThanOrEqual(MAP_H);
    }
  });
  it('builds the static map deterministically and fast', () => {
    const t0 = performance.now();
    const a = buildMapBase(true);
    const t1 = performance.now();
    const b = buildMapBase(true);
    expect(a.p.w).toBe(MAP_W); expect(a.p.h).toBe(MAP_H);
    expect(digest(a.p.d)).toBe(digest(b.p.d));
    expect(a.windows.length).toBeGreaterThan(100);
    expect(t1 - t0).toBeLessThan(1500);
  });
  it('state layer reflects gates, is deterministic and fast', () => {
    const t0 = performance.now();
    const lost = buildMapState([], 'M1');
    const dt = performance.now() - t0;
    const lost2 = buildMapState([], 'M1');
    const all = buildMapState(DISTRICT_IDS, 'M12');
    expect(digest(lost.p.d)).toBe(digest(lost2.p.d));
    expect(digest(lost.p.d)).not.toBe(digest(all.p.d));
    expect(all.lights.length).toBeGreaterThan(lost.lights.length);
    expect(lost.states.M1).toBe('current'); expect(lost.states.M5).toBe('lost'); expect(all.states.M5).toBe('restored');
    expect(districtState('archive', [], 'M1')).toBe('restored');
    expect(dt).toBeLessThan(1500);
  });
});

describe('scenes', () => {
  it('builds every banner (restored and lost) and the title backdrop', () => {
    expect(BANNER_IDS).toHaveLength(14);
    for (const id of BANNER_IDS) for (const r of [true, false]) {
      const b = buildBanner(id, r);
      expect(b.p.w).toBe(BANNER_W); expect(b.p.h).toBe(BANNER_H);
      let opaque = 0; for (let i = 3; i < b.p.d.length; i += 4) if (b.p.d[i]) opaque++;
      expect(opaque).toBe(BANNER_W * BANNER_H);
      if (!r) { expect(b.lights).toHaveLength(0); expect(b.fog.length).toBeGreaterThan(0); }
    }
    const t = buildTitle();
    expect(t.p.w).toBe(TITLE_W); expect(t.p.h).toBe(TITLE_H);
  });
});
