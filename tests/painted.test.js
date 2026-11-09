import { describe, it, expect } from 'vitest';
import { paintedScene, lightAt, lightMask, flicker, sceneLights, bayer, regionMask } from '../src/pixel/painted.js';

describe('painted scenes', () => {
  it('returns null for a missing or incomplete scene, so screens keep their code art', () => {
    expect(paintedScene('nope', {})).toBe(null);
    expect(paintedScene('a', { a: { w: 10, h: 10, dark: 'd.png' } })).toBe(null);
    expect(paintedScene('a', { a: { w: 0, h: 10, dark: 'd', lit: 'l' } })).toBe(null);
    const s = { w: 10, h: 10, dark: 'd', lit: 'l' };
    expect(paintedScene('a', { a: s })).toBe(s);
  });

  it('light falls off from the centre to nothing at the radius', () => {
    const l = [{ x: 50, y: 50, r: 20, i: 1 }];
    expect(lightAt(50, 50, l)).toBeCloseTo(1);
    expect(lightAt(60, 50, l)).toBeCloseTo(0.25);
    expect(lightAt(70, 50, l)).toBe(0);
    expect(lightAt(90, 90, l, 0.1)).toBeCloseTo(0.1);
  });

  it('mask shows the lit picture near a light and the dark picture far away', () => {
    const m = lightMask(100, 60, [{ x: 20, y: 30, r: 25, i: 1.5 }], { cell: 2 });
    expect(m.w).toBe(50); expect(m.h).toBe(30);
    expect(m.data[15 * 50 + 10]).toBe(1);   // at the light
    expect(m.data[15 * 50 + 45]).toBe(0);   // far side
    const on = m.data.reduce((a, b) => a + b, 0);
    expect(on).toBeGreaterThan(0); expect(on).toBeLessThan(m.data.length / 2);
  });

  it('mask edge is dithered (whole pixels only, no blending)', () => {
    const m = lightMask(64, 64, [{ x: 32, y: 32, r: 30, i: 1 }], { cell: 1 });
    expect([...new Set(m.data)].sort()).toEqual([0, 1]);
    // a ring halfway out has both lit and dark pixels
    let lit = 0, dark = 0;
    for (let x = 44; x < 50; x++) for (let y = 30; y < 34; y++) (m.data[y * 64 + x] ? lit++ : dark++);
    expect(lit).toBeGreaterThan(0); expect(dark).toBeGreaterThan(0);
  });

  it('bayer thresholds stay inside 0..1', () => {
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const b = bayer(x, y); expect(b).toBeGreaterThan(0); expect(b).toBeLessThan(1); }
  });

  it('flicker moves only flickering lights, and only a little', () => {
    const steady = { x: 5, y: 5, r: 40, i: 1, flicker: 0 };
    expect(flicker(steady, 3.2, 0)).toBe(steady);
    const torch = { x: 5, y: 5, r: 40, i: 1, flicker: 1 };
    const rs = [0, 0.3, 0.7, 1.1, 2.5].map((t) => flicker(torch, t, 0).r);
    rs.forEach((r) => { expect(r).toBeGreaterThan(40 * 0.85); expect(r).toBeLessThan(40 * 1.15); });
    expect(new Set(rs.map((r) => r.toFixed(3))).size).toBeGreaterThan(1);
  });

  it('scene lights include extra lights the screen adds', () => {
    const s = { lights: [{ x: 1, y: 1, r: 5, i: 1, flicker: 0 }] };
    expect(sceneLights(s, 0, [{ x: 2, y: 2, r: 3, i: 1 }])).toHaveLength(2);
    expect(sceneLights({}, 0)).toEqual([]);
  });

  it('region mask reveals the restored picture around restored districts only', () => {
    const nodes = [{ x: 30, y: 30, v: 1 }, { x: 170, y: 30, v: 0 }];
    const m = regionMask(200, 60, nodes, { cell: 2, soft: 90 });
    expect(m.w).toBe(100); expect(m.h).toBe(30);
    expect(m.data[15 * 100 + 15]).toBe(1);   // at the restored district
    expect(m.data[15 * 100 + 85]).toBe(0);   // at the lost one
    const none = regionMask(200, 60, nodes.map((n) => ({ ...n, v: 0 })), { cell: 2 });
    expect(none.data.reduce((a, b) => a + b, 0)).toBe(0);
    const all = regionMask(200, 60, nodes.map((n) => ({ ...n, v: 1 })), { cell: 2 });
    expect(all.data.reduce((a, b) => a + b, 0)).toBe(all.data.length);
  });
});
