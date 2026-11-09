import { describe, it, expect } from 'vitest';
import { genItems, scoreDrill, recallMode, storeSet, newProfile, VOCAB_PROBE_INTERVALS, PROBE_INTERVALS } from '../src/engine/core.js';
import { LANGS, alikePairs, isLangSpec, langItems } from '../src/engine/lang.js';
import { variantOf } from '../src/engine/additions.js';
import { normalize, matches, rng } from '../src/engine/util.js';
import V from '../src/data/add/vocab.json';
import { WEEKS } from '../src/data/curriculum.js';

const ids = (list) => list.map((x) => x.id);

describe('new-language word pools', () => {
  it('every pool entry has a unique, permanent-style id and a meaning', () => {
    const all = [];
    for (const code of ['es', 'tr', 'old']) {
      const L = V.langs[code];
      for (const w of L.words) { expect(w.id).toMatch(new RegExp(`^${code}-\\d{4}$`)); expect(w.word).toBeTruthy(); expect(w.meaning).toBeTruthy(); }
      all.push(...ids(L.words), ...ids(L.phrases || []));
    }
    expect(new Set(all).size).toBe(all.length);
  });

  it('Spanish nouns carry a gender, Turkish nouns do not', () => {
    expect(V.langs.es.words.every((w) => w.gender === 'm' || w.gender === 'f')).toBe(true);
    expect(V.langs.tr.words.some((w) => w.gender)).toBe(false);
  });

  it('invented words are not words the game already uses', () => {
    const real = new Set([...LANGS.sw.words, ...LANGS.es.words, ...LANGS.tr.words].map((w) => normalize(w.word)));
    for (const w of V.langs.old.words) expect(real.has(normalize(w.word))).toBe(false);
  });

  it('no em dashes in any shown text', () => {
    expect(JSON.stringify(V)).not.toMatch(/—/);
  });
});

describe('answer matching across alphabets', () => {
  it('folds accents and special letters, so typing without them still counts', () => {
    expect(normalize('Anlamıyorum')).toBe('anlamiyorum');
    expect(normalize('ÇİÇEK')).toBe('cicek');
    expect(normalize('Straße')).toBe('strasse');
    expect(matches('nino', 'niño')).toBe(true);
    expect(matches('kopru', 'köprü')).toBe(true);
  });
  it('a look-alike foreign word is not forgiven as a typo', () => {
    expect(matches('perro', 'pero')).toBe(false);
    expect(matches('kapak', 'kapı')).toBe(false);
  });
});

describe('vocab drill options', () => {
  it('a plain vocab spec keeps the original Swahili generator (old seeds unchanged)', () => {
    expect(isLangSpec({ t: 'vocab', n: 6 })).toBe(false);
    const a = genItems({ t: 'vocab', n: 6 }, 42);
    expect(a.items.every((it) => LANGS.sw.words.some((w) => w.word === it.cue))).toBe(true);
  });

  it('produce shows the meaning and asks for the foreign word', () => {
    const { items } = genItems({ t: 'vocab', n: 6, lang: 'tr', dir: 'produce' }, 7);
    expect(items).toHaveLength(6);
    for (const it of items) expect(LANGS.tr.words.find((w) => w.word === it.answer)?.meaning).toBe(it.cue);
    const res = scoreDrill('vocab', items, items.map((it) => normalize(it.answer)), { spec: { t: 'vocab', lang: 'tr', dir: 'produce' } });
    expect(res.acc).toBe(1);
  });

  it('gender: article and word score one point each', () => {
    const spec = { t: 'vocab', n: 4, lang: 'es', dir: 'produce', gender: true };
    const { items } = genItems(spec, 3);
    expect(items.every((it) => ['el', 'la'].includes(it.first))).toBe(true);
    const wrongArticle = items.map((it) => `${it.first === 'el' ? 'la' : 'el'} ${it.last}`);
    const res = scoreDrill('vocab', items, wrongArticle, { spec });
    expect(res.n).toBe(8); expect(res.correct).toBe(4);
  });

  it('phrases are scored with the forgiving line check', () => {
    const spec = { t: 'vocab', n: 3, lang: 'es', src: 'phrases', dir: 'produce' };
    const { items } = genItems(spec, 11);
    expect(items.every((it) => it.phrase)).toBe(true);
    const res = scoreDrill('vocab', items, items.map((it) => it.answer.toUpperCase()), { spec });
    expect(res.acc).toBe(1);
  });

  it('look-alike sets really contain near-identical words', () => {
    expect(alikePairs(LANGS.tr.words).length).toBeGreaterThan(3);
    const { items } = langItems({ t: 'vocab', lang: 'tr', alike: true }, 8, rng(5));
    const words = items.map((it) => normalize(it.cue));
    const close = words.some((a, i) => words.some((b, j) => i !== j && Math.abs(a.length - b.length) <= 2 && a.slice(0, 3) === b.slice(0, 3)));
    expect(close).toBe(true);
  });

  it('sounds only: invented words written back in any order', () => {
    const spec = { t: 'vocab', n: 5, lang: 'old', sounds: true };
    expect(recallMode('vocab', spec)).toBe('free');
    const { items } = genItems(spec, 9);
    const res = scoreDrill('vocab', items, items.map((it) => it.answer).reverse(), { spec });
    expect(res.acc).toBe(1);
  });

  it('variants are labelled so Then and Now keeps them apart', () => {
    expect(variantOf({ t: 'vocab', lang: 'es', dir: 'produce', gender: true })).toBe('vocab-es-produce-gender');
    expect(variantOf({ t: 'vocab', n: 6 })).toBeUndefined();
  });

  it('every curriculum vocab drill builds a full set of items', () => {
    for (const w of WEEKS) for (const d of w.drills.filter((x) => x.t === 'vocab')) {
      expect(genItems(d, w.w).items.length).toBe(d.n);
    }
  });
});

describe('vocabulary review schedule', () => {
  it('new vocab sets come back at 1, 3, 7, 14, 30 and 60 days; other sets keep 1, 7, 30', () => {
    const p = newProfile('t', 0);
    const v = storeSet(p, { role: 'practice', skill: 'vocab', spec: { t: 'vocab', n: 4 }, items: [] }, { acc: 1 });
    const c = storeSet(p, { role: 'practice', skill: 'linking', spec: { t: 'chain', n: 4 }, items: [] }, { acc: 1 });
    expect(v.intervals).toEqual(VOCAB_PROBE_INTERVALS);
    expect(VOCAB_PROBE_INTERVALS).toEqual([1, 3, 7, 14, 30, 60]);
    expect(c.intervals).toEqual(PROBE_INTERVALS);
  });
});

describe('article scoring', () => {
  it('the word alone still earns its point', () => {
    const items = [{ cue: 'dog', answer: 'el perro', first: 'el', last: 'perro' }];
    const spec = { t: 'vocab', lang: 'es', dir: 'produce', gender: true };
    expect(scoreDrill('vocab', items, ['perro'], { spec }).correct).toBe(1);
    expect(scoreDrill('vocab', items, ['la perro'], { spec }).correct).toBe(1);
    expect(scoreDrill('vocab', items, ['el perro'], { spec }).correct).toBe(2);
  });
});
