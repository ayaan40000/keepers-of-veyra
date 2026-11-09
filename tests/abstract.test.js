import { describe, it, expect } from 'vitest';
import { FORMULAS, CHEM, WONDERS, JOKES, DIAGRAMS, ABSTRACT_HONEST } from '../src/data/abstract.js';
import { abstractItems, formulaOk, yearOk, jokeOk, normFormula, ABSTRACT_SRC } from '../src/engine/abstract.js';
import { genItems, scoreDrill, newProfile, storeSet, probeItems } from '../src/engine/core.js';
import { variantOf } from '../src/engine/additions.js';
import { methodLabel } from '../src/engine/methods.js';
import { TEMPLATE_FIRST_WEEK } from '../src/engine/crypt.js';
import { rng } from '../src/engine/util.js';

describe('hard-material data', () => {
  it('ids are unique and nothing shown has an em dash', () => {
    const ids = [...FORMULAS.map((f) => f.id), ...CHEM.map((c) => c[0]), ...WONDERS.map((w) => w.id), ...JOKES.map((j) => j.id), ...DIAGRAMS.map((d) => d.id)];
    expect(new Set(ids).size).toBe(ids.length);
    expect(JSON.stringify({ FORMULAS, CHEM, WONDERS, JOKES, DIAGRAMS, ABSTRACT_HONEST })).not.toMatch(/—/);
  });
  it('every formula can be asked: blanks point at real tokens', () => {
    for (const f of FORMULAS) {
      expect(f.blank.length).toBeGreaterThan(0);
      for (const b of f.blank) { expect(f.show[b]).toBeTruthy(); expect(['=', '+', '/', '×', '→']).not.toContain(f.show[b]); }
      expect(f.legend).toBeTruthy();
    }
  });
  it('every joke has a key word that appears in its punchline', () => {
    for (const j of JOKES) expect(j.key.some((k) => j.a.toLowerCase().replace(/-/g, '').includes(k.toLowerCase()))).toBe(true);
  });
  it('diagram marks sit inside the drawing and have different labels', () => {
    for (const d of DIAGRAMS) {
      for (const m of d.marks) { expect(m.x).toBeGreaterThanOrEqual(0); expect(m.x).toBeLessThanOrEqual(d.w); expect(m.y).toBeGreaterThanOrEqual(0); expect(m.y).toBeLessThanOrEqual(d.h); }
      expect(new Set(d.marks.map((m) => m.label)).size).toBe(d.marks.length);
    }
  });
});

describe('checking hard answers', () => {
  it('formula parts fold superscripts, fractions and Greek letters', () => {
    expect(normFormula('r²')).toBe(normFormula('r^2'));
    expect(formulaOk('r2', { answer: 'r²' })).toBe(true);
    expect(formulaOk('pi', { answer: 'π' })).toBe(true);
    expect(formulaOk('1/2', { answer: '½' })).toBe(true);
    expect(formulaOk('0.5', { answer: '½', alt: ['1/2', '0.5', 'half'] })).toBe(true);
    expect(formulaOk('C6H12O6', { answer: 'C₆H₁₂O₆' })).toBe(true);
    expect(formulaOk('r3', { answer: 'r²' })).toBe(false);
  });
  it('years: BCE must be said, CE must not', () => {
    expect(yearOk('44 BC', { answer: '44 BCE', bce: true })).toBe(true);
    expect(yearOk('-44', { answer: '44 BCE', bce: true })).toBe(true);
    expect(yearOk('44', { answer: '44 BCE', bce: true })).toBe(false);
    expect(yearOk('1066', { answer: '1066', bce: false })).toBe(true);
    expect(yearOk('1066 BC', { answer: '1066', bce: false })).toBe(false);
    expect(yearOk('1067', { answer: '1066', bce: false })).toBe(false);
  });
  it('a punchline counts when its key word is there', () => {
    const j = JOKES.find((x) => x.id === 'jk-bicycle');
    expect(jokeOk('because it is too tired', j)).toBe(true);
    expect(jokeOk('it has no legs', j)).toBe(false);
  });
});

describe('the new sources', () => {
  for (const src of ABSTRACT_SRC) {
    it(`${src}: builds items, correct answers score full marks, blanks score zero`, () => {
      for (let seed = 1; seed <= 25; seed++) {
        const spec = { t: 'facts', n: 6, src };
        const { items } = genItems(spec, seed);
        expect(items.length).toBeGreaterThan(0);
        expect(scoreDrill('facts', items, items.map((i) => i.answer), { spec }).acc).toBe(1);
        expect(scoreDrill('facts', items, items.map(() => ''), { spec }).acc).toBe(0);
      }
      expect(variantOf({ t: 'facts', src })).toBe(src);
      expect(methodLabel(src)).not.toBe(src);
    });
  }
  it('formulae and dates come back the next day asked another way', () => {
    const p = newProfile('t', 'key');
    for (const src of ['formulas', 'dates']) {
      const spec = { t: 'facts', n: 6, src };
      const { items, extra } = genItems(spec, 9);
      const set = storeSet(p, { role: 'practice', skill: 'structure', spec, items, extra }, { acc: 1 });
      const pr = probeItems(set);
      expect(pr.flip).toBe(true);
      expect(scoreDrill('facts', pr.items, pr.items.map((i) => i.answer), { spec }).acc).toBe(1);
    }
  });
  it('a date asked from its year accepts the event name inside a longer answer', () => {
    const { extra } = abstractItems({ src: 'dates' }, 4, rng(3));
    const q = extra.probe[0];
    expect(scoreDrill('facts', [q], [`it was ${q.answer} I think`], { spec: { t: 'facts', src: 'dates' } }).acc).toBe(1);
  });
  it('the new sources do not open plain Crypt templates early', () => {
    expect(TEMPLATE_FIRST_WEEK.facts).toBe(27);
  });
});

describe('fact-check fixes', () => {
  const ok = (resp, it) => scoreDrill('facts', [it], [resp], { spec: { t: 'facts', src: 'wonders' } }).acc === 1;
  it('numbers: the first number counts, and a range accepts estimates inside it', () => {
    const sun = WONDERS.find((w) => w.id === 'wd-sunlight');
    expect(ok('8 min 20 s', { cue: sun.q, answer: sun.a, kind: 'number', text: 'x' })).toBe(true);
    const ei = WONDERS.find((w) => w.id === 'wd-eiffel');
    expect(ok('14', { cue: ei.q, answer: ei.a, kind: 'number', range: ei.range, text: 'x' })).toBe(true);
    expect(ok('30', { cue: ei.q, answer: ei.a, kind: 'number', range: ei.range, text: 'x' })).toBe(false);
  });
  it('answers may start with a or the', () => {
    expect(ok('a koala', { cue: 'q', answer: 'koala', text: 'x' })).toBe(true);
    expect(ok('the Dead Sea', { cue: 'q', answer: 'Dead Sea', text: 'x' })).toBe(true);
  });
  it('a whole formula accepts each part written any accepted way', async () => {
    const { wholeFormulaForms } = await import('../src/engine/abstract.js');
    const f = FORMULAS.find((x) => x.id === 'fx-fahrenheit');
    expect(formulaOk('F = 1.8 C + 32', { answer: f.show.join(' '), alt: wholeFormulaForms(f) })).toBe(true);
    const pg = FORMULAS.find((x) => x.id === 'fx-polygon');
    expect(formulaOk('(n-2) x 180', { answer: pg.show.join(' '), alt: wholeFormulaForms(pg) })).toBe(true); // x for times is fine
    expect(formulaOk('(n - 2) × 180°', { answer: pg.show.join(' '), alt: wholeFormulaForms(pg) })).toBe(true);
  });
  it('short joke keys no longer match inside other words', () => {
    const j = JOKES.find((x) => x.id === 'jk-stairs');
    expect(jokeOk('they were in a cup', j)).toBe(false);
    expect(jokeOk('always up to something', j)).toBe(true);
  });
});

describe('code review fixes', () => {
  it('Echo battles check formulae, accepted spellings, and skip diagrams', async () => {
    const { kindsFor, makeEntry, isRight } = await import('../src/engine/battle.js');
    const set = { t: 'facts', skill: 'structure', items: [{ cue: 'Area of a circle: A = ___ r²', answer: 'π', formula: true }, { cue: 'q', answer: 'Dead Sea', alt: ['the dead sea'] }] };
    const e0 = makeEntry(set, 0, 'recall', 3, 'test', 's1');
    expect(isRight(e0, 'pi')).toBe(true);
    expect(isRight(makeEntry(set, 1, 'recall', 3, 'test', 's1'), 'the dead sea')).toBe(true);
    expect(kindsFor({ t: 'facts', items: [{ cue: 'Mark 1', answer: 'crust', dg: 'dg-earth' }] })).toEqual([]);
  });
  it('event names match whole words, and the year itself is never the answer', () => {
    expect(jokeOk('WWII', { answer: 'First World War', key: ['First World War', 'WWI'] })).toBe(false);
    expect(jokeOk('the first world war began', { answer: 'First World War', key: ['First World War', 'WWI'] })).toBe(true);
    for (let s = 1; s < 30; s++) for (const q of abstractItems({ src: 'dates' }, 6, rng(s)).extra.probe) expect(q.key.some((k) => /\d/.test(k))).toBe(false);
  });
  it('a year range is not read as BCE', () => {
    expect(yearOk('1914-1918', { answer: '1914', bce: false })).toBe(true);
  });
});
