import { describe, it, expect } from 'vitest';
import { spreadPick, probeItems } from '../src/engine/core.js';
import { FORMULAS } from '../src/data/abstract.js';

describe('1.2.1 fixes', () => {
  it('delayed checks sample across a whole palace, not just its start', () => {
    const items = Array.from({ length: 30 }, (_, i) => ({ id: 'w' + i, cue: 'c' + i, answer: 'a' + i }));
    const set = { t: 'palace', spec: { t: 'palace' }, items, loci: items.map((_, i) => 'stop' + i), idx: 0 };
    const pr = probeItems(set);
    expect(pr.items.length).toBe(8);
    expect(Math.max(...pr.items.map((x) => +x.id.slice(1)))).toBeGreaterThan(20);
    expect(spreadPick([1, 2, 3], 8)).toEqual([1, 2, 3]);
    const later = spreadPick(Array.from({ length: 30 }, (_, i) => i), 8, 1);
    expect(later).not.toEqual(spreadPick(Array.from({ length: 30 }, (_, i) => i), 8, 0));
  });
});

describe('formula answers', () => {
  it('photosynthesis needs the 6 in front of O2', () => {
    const f = FORMULAS.find((x) => x.id === 'fx-photo');
    expect(f.alt[6]).not.toContain('O₂');
  });
});
