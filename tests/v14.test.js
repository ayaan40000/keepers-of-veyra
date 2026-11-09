import { describe, it, expect } from 'vitest';
import { newProfile } from '../src/engine/core.js';
import { buildExport, parseImport } from '../src/store.js';
import { todayGlosses, recordGloss, validateGloss, ALL_GLOSSES } from '../src/engine/gloss.js';
import { abstractItems, abstractOk } from '../src/engine/abstract.js';
import { FINANCE } from '../src/data/finance.js';
import { rng, addDays } from '../src/engine/util.js';
import { roundDue } from '../src/engine/owntext.js';

const d0 = '2026-11-08';
describe('1.4 the Gloss', () => {
  it('asks new glosses, then again the next day and a week later', () => {
    const p = newProfile('t', 'key');
    const first = todayGlosses(p, d0);
    expect(first.length).toBe(2);
    expect(first.every((x) => !x.delayed)).toBe(true);
    for (const q of first) recordGloss(p, q.id, 'kept', d0);
    expect(todayGlosses(p, d0)).toHaveLength(0);
    const d1 = addDays(d0, 1);
    expect(todayGlosses(p, d1).filter((x) => x.delayed)).toHaveLength(2);
    for (const q of todayGlosses(p, d1).filter((x) => x.delayed)) recordGloss(p, q.id, 'partly', d1);
    expect(p.gloss.items[first[0].id].due).toBe(addDays(d0, 7));
    recordGloss(p, first[0].id, 'kept', addDays(d0, 7));
    expect(p.gloss.items[first[0].id].due).toBeNull();
    expect(validateGloss(p.gloss)).toBeNull();
    const r = parseImport(buildExport(p)); expect(r.error).toBeFalsy();
    expect(validateGloss({ items: { x: { first: 'no' } }, history: [] })).toBeTruthy();
    expect(new Set(ALL_GLOSSES.map((g) => g.id)).size).toBe(ALL_GLOSSES.length);
  });
});

describe('1.4 finance and dates', () => {
  it('every worked number matches its formula', () => {
    const calc = { 'fin-simple': 1000 * 0.05 * 3, 'fin-compound': 1000 * 1.1 ** 2, 'fin-cagr': ((121 / 100) ** 0.5 - 1) * 100, 'fin-npv': 110 / 1.1 - 100, 'fin-fv-annuity': (100 * (1.1 ** 2 - 1)) / 0.1, 'fin-roi': ((250 - 200) / 200) * 100, 'fin-gross': ((500 - 300) / 500) * 100, 'fin-net': (50 / 500) * 100, 'fin-pe': 30 / 2, 'fin-current': 300 / 150, 'fin-de': 400 / 200, 'fin-breakeven': 1000 / (15 - 5), 'fin-72': 72 / 8 };
    for (const f of FINANCE.filter((x) => x.use)) expect(calc[f.id]).toBeCloseTo(Number(f.use.a), 6);
  });
  it('finance drill mixes formulae and worked numbers', () => {
    const { items, extra } = abstractItems({ src: 'finance' }, 8, rng(3));
    expect(items.some((x) => x.kind === 'number')).toBe(true);
    expect(items.every((x) => abstractOk(x.answer, x))).toBe(true);
    expect(extra.probe.length).toBeGreaterThan(0);
  });
  it('dates come back next day with a which-came-first question', () => {
    const { extra } = abstractItems({ src: 'dates' }, 8, rng(5));
    const q = extra.probe.find((x) => /came first/.test(x.cue));
    expect(q).toBeTruthy();
    expect(abstractOk(q.answer, q)).toBe(true);
  });
});

describe('1.4 the Evening Round', () => {
  it('a kept section comes back every N days', () => {
    expect(roundDue({ round: 7 }, { retired: true, created: d0, history: [{ date: d0 }] })).toBe(addDays(d0, 7));
    expect(roundDue({ round: 0 }, { retired: true, created: d0, history: [] })).toBeNull();
    expect(roundDue({}, { retired: false, created: d0, history: [] })).toBeNull();
  });
});

describe('1.5 turning stones and pools', () => {
  it('verb items check the exact form, with accents folded', () => {
    const { items, extra } = abstractItems({ src: 'verbs', lang: 'es' }, 6, rng(2));
    expect(items).toHaveLength(6);
    expect(items.every((x) => abstractOk(x.answer, x))).toBe(true);
    const tener = { verb: true, answer: 'tenéis' };
    expect(abstractOk('teneis', tener)).toBe(true);
    expect(abstractOk('tenemos', tener)).toBe(false);
    expect(extra.probe).toHaveLength(6);
    const tr = abstractItems({ src: 'verbs', lang: 'tr' }, 4, rng(1)).items;
    expect(tr.every((x) => abstractOk(x.answer, x))).toBe(true);
  });
});
