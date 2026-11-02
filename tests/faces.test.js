import { describe, it, expect, vi } from 'vitest';

// src/pixel/core.js contains JSX inside a .js file, which the plain vitest transform cannot parse.
// The face generator only needs makeBuffer from it, so provide an equivalent here.
vi.mock('../src/pixel/core.js', () => ({
  makeBuffer(w, h) {
    const rgba = new Uint8ClampedArray(w * h * 4);
    return { w, h, rgba, toSprite: () => ({ w, h, rgba }) };
  },
}));

const { faceParams, faceSprite, describeFace, renderFace, HAIR_STYLES, SKIN_TONES } = await import('../src/pixel/faces.js');
const { portraitSprite, PORTRAIT_IDS, PORTRAIT_MOODS } = await import('../src/pixel/portraits.js');

// Stable facial features (clothing, background and hat colour deliberately excluded).
const STABLE = ['skin', 'faceShape', 'eyeShape', 'eyeColor', 'browShape', 'nose', 'mouth', 'ears', 'hairStyle', 'hairColor', 'facialHair', 'glasses', 'freckles', 'mole', 'scar'];
const bucket = (p) => [...STABLE.map((k) => String(p[k])), String(Math.round(p.eyeSep)), String(Math.round(p.faceLen / 1.5))];

describe('procedural faces', () => {
  it('is deterministic per seed', () => {
    for (const s of [0, 1, 42, 99999, -7]) {
      expect(faceParams(s)).toEqual(faceParams(s));
      const a = renderFace(s, 48), b = renderFace(s, 48);
      expect(Buffer.from(a.rgba).equals(Buffer.from(b.rgba))).toBe(true);
    }
  });

  it('renders the requested sizes', () => {
    const a = faceSprite(3);
    expect([a.w, a.h, a.rgba.length]).toEqual([48, 48, 48 * 48 * 4]);
    const b = faceSprite(3, { size: 64 });
    expect([b.w, b.h, b.rgba.length]).toEqual([64, 64, 64 * 64 * 4]);
    expect(faceSprite(3)).toBe(a); // cached
    // mostly opaque bust portrait
    let opaque = 0; for (let i = 3; i < a.rgba.length; i += 4) if (a.rgba[i]) opaque++;
    expect(opaque).toBeGreaterThan(48 * 48 * 0.95);
  });

  it('varies several stable facial features between any two of 200 seeds', () => {
    const ps = Array.from({ length: 200 }, (_, i) => bucket(faceParams(1000 + i * 37)));
    let minDiff = Infinity;
    for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
      let d = 0; for (let f = 0; f < ps[i].length; f++) if (ps[i][f] !== ps[j][f]) d++;
      minDiff = Math.min(minDiff, d);
    }
    expect(minDiff).toBeGreaterThanOrEqual(4);
  });

  it('covers the catalogue (skin tones, hair styles)', () => {
    const skins = new Set(), styles = new Set();
    for (let s = 0; s < 3000; s++) { const p = faceParams(s); skins.add(p.skin); styles.add(p.hairStyle); }
    expect(skins.size).toBe(SKIN_TONES.length);
    expect(styles.size).toBe(HAIR_STYLES.length);
  });

  it('pixel output differs between seeds', () => {
    const a = renderFace(11, 48).rgba, b = renderFace(12, 48).rgba;
    let diff = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1]) diff++;
    expect(diff).toBeGreaterThan(400);
  });

  it('describes faces in short plain English', () => {
    for (let s = 0; s < 50; s++) {
      const d = describeFace(s);
      expect(d.length).toBeGreaterThan(5);
      expect(d.split(', ').length).toBeLessThanOrEqual(3);
    }
  });

  it('renders fast (< 5 ms per face)', () => {
    for (let i = 0; i < 20; i++) renderFace(i, 48); // warm up
    const t0 = performance.now();
    for (let i = 0; i < 200; i++) renderFace(10000 + i, 48);
    const per = (performance.now() - t0) / 200;
    expect(per).toBeLessThan(5);
  });
});

describe('named portraits', () => {
  it('renders every portrait and mood at 64x64, deterministically', () => {
    expect(PORTRAIT_IDS.length).toBeGreaterThanOrEqual(15);
    for (const id of PORTRAIT_IDS) {
      const moods = PORTRAIT_MOODS[id];
      expect(moods).toContain('neutral');
      expect(moods.length).toBeGreaterThanOrEqual(2);
      for (const m of moods) {
        const s = portraitSprite(id, m);
        expect([s.w, s.h]).toEqual([64, 64]);
      }
      const n = portraitSprite(id, 'neutral').rgba, o = portraitSprite(id, moods[1]).rgba;
      let diff = 0; for (let i = 0; i < n.length; i += 4) if (n[i] !== o[i]) diff++;
      expect(diff).toBeGreaterThan(3); // the mood actually changes the face
    }
  });

  it('falls back sensibly for unknown ids and moods', () => {
    const s = portraitSprite('nobody', 'ecstatic');
    expect([s.w, s.h]).toEqual([64, 64]);
    expect(portraitSprite('you', 'neutral', { avatar: 'wave' }).w).toBe(64);
  });
});

describe('v0.5 harder faces', async () => {
  const { scaledSpec, genItems, scoreDrill, newProfile, probeItems, LURE_ANSWER } = await import('../src/engine/core.js');
  const { faceParams } = await import('../src/pixel/faces.js');
  const base = { t: 'faces', n: 6, s: 60 };
  it('adds look-alike strangers from level 3 and changed looks from level 5, in practice only', () => {
    expect(scaledSpec(base, 2).lures).toBeUndefined();
    expect(scaledSpec(base, 3).lures).toBe(1);
    expect(scaledSpec(base, 6).lures).toBe(2);
    expect(scaledSpec(base, 5).restyle).toBe(true);
    expect(scaledSpec(base, 6, 'guided').lures).toBeUndefined();
  });
  it('keeps the item count, and each stranger differs from a studied face in exactly two features', () => {
    const spec = scaledSpec(base, 7);
    const { items } = genItems(spec, 1234, newProfile('t', 'key'));
    expect(items.length).toBe(spec.n);
    const lures = items.filter((x) => x.lure);
    expect(lures.length).toBe(2);
    for (const l of lures) {
      expect(items.some((x) => !x.lure && x.face === l.face)).toBe(true);
      const f = faceParams(l.face);
      expect(Object.keys(l.alter).filter((k) => l.alter[k] !== f[k]).length).toBe(2);
    }
    for (const it of items.filter((x) => !x.lure)) expect(it.look).toBeTruthy();
  });
  it('scores a stranger as correct only when it is not given a name', () => {
    const items = [{ face: 1, answer: 'Mia' }, { face: 1, answer: LURE_ANSWER, lure: true, alter: { nose: 'wide' } }];
    expect(scoreDrill('faces', items, ['Mia', 'Not met']).correct).toBe(2);
    expect(scoreDrill('faces', items, ['Mia', '']).correct).toBe(2);
    expect(scoreDrill('faces', items, ['Mia', 'Mia']).correct).toBe(1);
  });
  it('delayed recall never asks about strangers', () => {
    const set = { t: 'faces', spec: {}, items: [{ face: 1, answer: 'A' }, { face: 1, answer: 'new', lure: true }] };
    expect(probeItems(set).items.length).toBe(1);
  });
});
