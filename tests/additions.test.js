// 1.1 curriculum additions (part 2): lessons, pools, variants, Mind Map, Poem, Unit Checks, Cards, Then and Now.
import { describe, it, expect } from 'vitest';
import { newProfile, genItems, scoreDrill, scaledSpec, storeSet, probeItems, recallMode, dueSets, applyProbe, today } from '../src/engine/core.js';
import { WEEKS, GATES, TEMPLATE_SKILL } from '../src/data/curriculum.js';
import { LESSONS } from '../src/data/lessons.js';
import { MASTERS } from '../src/data/masters.js';
import { buildSession } from '../src/engine/session.js';
import { applyDrill } from '../src/engine/progress.js';
import { buildExport, parseImport } from '../src/store.js';
import {
  groupDigits, unitSpecs, unitDue, UNIT_WEEKS, scoreMap, mapBranches, mapProbe, poemLineOk, poemLineStrict, scorePoemPage, rowScore, scoreSurnames,
  normMoves, variantOf, POEM_LIST, MIND_MAPS, SKIM_TEXTS, PEG_WORDS, MAP_LIMIT,
} from '../src/engine/additions.js';
import { thenAndNow, unitComparison, methodStats } from '../src/engine/methods.js';
import { parseCard, deckOrder, runScore, positionOrder, positionStreak, fullDeck, cardName } from '../src/engine/cards.js';
import YM from '../src/data/add/yourmethods.json';
import SURN from '../src/data/add/surnames.json';
import STEPS from '../src/data/add/steps.json';
import POINTS from '../src/data/add/points.json';
import GROCERY from '../src/data/add/grocery.json';
import NUMBERED from '../src/data/add/numbered.json';
import UNITS from '../src/data/add/unitchecks.json';
import SHEETS from '../src/data/add/worksheets.json';
import TOOLBOX from '../src/data/add/toolbox.json';
import POOLS from '../src/data/add/pools.json';
import CARDS from '../src/data/add/cards.json';
import LESS from '../src/data/add/lessons.json';

const fresh = () => newProfile('t', 'key');
const items = (spec, seed = 5) => genItems(spec, seed, fresh());
const DASH = /[—–]/;
const noErrs = { omission: 0, substitution: 0, order: 0, timeout: 0 };

describe('1.1 lessons and Masters Notes', () => {
  it('adds every checked card to its week, week 24 is the four-card rewrite', () => {
    for (const c of LESS.cards) expect(LESSONS[c.week]).toContain(c.text);
    expect(LESSONS[24]).toHaveLength(4);
    expect(LESSONS[24][2]).toMatch(/rhyme/i);
    expect(WEEKS.find((w) => w.w === 24).lesson).toBe(LESSONS[24]);
  });
  it('has the four new notes with permanent ids and real templates', () => {
    for (const id of ['m-chunks', 'm-pegs', 'm-stanza', 'm-check']) expect(MASTERS.find((m) => m.id === id)).toBeTruthy();
    for (const m of MASTERS.filter((x) => x.spec)) expect(TEMPLATE_SKILL[m.spec.t]).toBeTruthy();
    expect(new Set(MASTERS.map((m) => m.id)).size).toBe(MASTERS.length);
  });
  it('uses no em or en dashes and no learning-style claims in player text', () => {
    const text = JSON.stringify([LESS, MASTERS, YM, SHEETS, TOOLBOX, POOLS, CARDS]);
    expect(text).not.toMatch(DASH);
    expect(JSON.stringify([LESS.cards.map((c) => c.text), MASTERS])).not.toMatch(/visual learner|auditory learner/i);
  });
});

describe('week plan wiring', () => {
  it('puts the variants in the weeks section 6 names', () => {
    const wk = (n) => WEEKS.find((w) => w.w === n);
    expect(wk(4).drills[0].src).toBe('grocery');
    expect(wk(6).drills[0].src).toBe('grocery');
    expect(wk(18).drills[0].group).toBe(2);
    expect(wk(19).drills[0].group).toBe(4);
    expect(wk(20).drills[0].group).toEqual([3, 3, 4]);
    expect(wk(24).drills.map((d) => d.peg)).toEqual(['shape', 'rhyme']);
    expect(wk(28).drills[0].src).toBe('points');
    expect(wk(29).drills[1]).toMatchObject({ t: 'map', kind: 'topic' });
    expect(wk(41).drills[0].skim).toBe(true);
    expect(wk(41).drills[1].t).toBe('poem');
    expect(wk(42).drills[1].src).toBe('steps');
    expect(GATES.M10.drills.some((d) => d.t === 'map' && d.kind === 'people')).toBe(true);
    expect(wk(48).drills.some((d) => d.t === 'poem')).toBe(true);
  });
  it('builds a full and an assessment session for every week without error', () => {
    for (const w of WEEKS) {
      const p = fresh(); p.progress.baselineDone = true; p.progress.day = (w.w - 1) * 7 + 3;
      for (const type of ['full', 'assessment']) {
        const s = buildSession(p, type);
        for (const st of s.steps.filter((x) => x.kind === 'drill')) { expect(st.items.length).toBeGreaterThan(0); expect(TEMPLATE_SKILL[st.spec.t]).toBeTruthy(); }
      }
    }
  });
  it('never makes Skim, Pick, Keep the guided or the repeated round', () => {
    const p = fresh(); p.progress.baselineDone = true; p.progress.day = 40 * 7 + 3;
    const drills = buildSession(p, 'full').steps.filter((x) => x.kind === 'drill');
    expect(drills.find((d) => d.role === 'guided').spec.skim).toBeFalsy();
    expect(drills.filter((d) => d.spec.skim)).toHaveLength(1);
  });
});

describe('V1 pegs', () => {
  it('cues are "number peg" with items in peg order and ten at most', () => {
    const a = items({ t: 'pairs', n: 12, peg: 'rhyme' }).items;
    expect(a).toHaveLength(10);
    expect(a[3].cue).toBe(`4 ${PEG_WORDS.rhyme[3]}`);
    expect(new Set(a.map((x) => x.answer)).size).toBe(10);
    expect(items({ t: 'pairs', n: 6, peg: 'shape' }, 9).items).toEqual(items({ t: 'pairs', n: 6, peg: 'shape' }, 9).items);
  });
  it('scores like linked pairs', () => {
    const it = items({ t: 'pairs', n: 4, peg: 'shape' }).items;
    expect(scoreDrill('pairs', it, it.map((x) => x.answer)).acc).toBe(1);
  });
});

describe('V2 digit groups and rows', () => {
  it('groups by a size or a repeating pattern', () => {
    expect(groupDigits('123456', 2)).toEqual(['12', '34', '56']);
    expect(groupDigits('1234567890', [3, 3, 4])).toEqual(['123', '456', '7890']);
    expect(groupDigits('12345678', 3)).toEqual(['123', '456', '78']);
  });
  it('row scoring is all or nothing per row of 20 and a blank row ends scoring', () => {
    const it = Array.from({ length: 60 }, (_, i) => ({ answer: String(i % 10) }));
    const resp = it.map((x) => x.answer);
    resp[25] = '9';
    const marks = rowScore(it, resp);
    expect(marks.slice(0, 20).every(Boolean)).toBe(true);
    expect(marks.slice(20, 40).some(Boolean)).toBe(false);
    expect(marks.slice(40).every(Boolean)).toBe(true);
    const blankMid = resp.map((x, i) => (i >= 20 && i < 40 ? '' : x));
    expect(rowScore(it, blankMid).slice(40).some(Boolean)).toBe(false);
    expect(scoreDrill('digits', it, resp, { spec: { rows: true } }).correct).toBe(40);
  });
});

describe('V3 sources', () => {
  it('grocery never draws the Unit Check items', () => {
    const reserved = GROCERY.filter((g) => g[1]).map((g) => g[0]);
    expect(reserved.length).toBeGreaterThan(0);
    for (let s = 1; s < 30; s++) for (const it of items({ t: 'chain', n: 12, src: 'grocery' }, s).items) expect(reserved).not.toContain(it.answer);
  });
  it('steps and points carry the sentence and one key word that is in it', () => {
    for (const src of ['steps', 'points']) {
      const g = items({ t: 'chain', n: 7, src }, 3);
      expect(g.extra.title).toBeTruthy();
      for (const it of g.items) expect(it.text.toLowerCase()).toContain(it.answer.toLowerCase());
    }
    for (const x of [...STEPS, ...POINTS]) for (const [text, key] of x.steps || x.points) expect(text.toLowerCase()).toContain(key.toLowerCase());
  });
  it('recall asks for the key words in order', () => {
    const g = items({ t: 'chain', n: 7, src: 'points' }, 4).items;
    expect(scoreDrill('chain', g, g.map((x) => x.answer)).acc).toBe(1);
    const swapped = g.map((x) => x.answer); [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
    expect(scoreDrill('chain', g, swapped).errs.order).toBe(2);
  });
});

describe('V4 numbered and V5 surnames', () => {
  it('numbered lists ask by number, in a cued mode', () => {
    const spec = { t: 'wordlist', n: 20, numbered: true };
    expect(recallMode('wordlist', spec)).toBe('cued');
    const g = items(spec).items;
    expect(g[19].cue).toBe('20'); expect(g).toHaveLength(20);
    expect(items({ t: 'wordlist', n: 80, numbered: true }).items).toHaveLength(80);
  });
  it('every numbered list has distinct words', () => {
    for (const l of NUMBERED) expect(new Set(l.words).size).toBe(l.words.length);
  });
  it('a set uses each surname once and avoids listed full names', () => {
    const avoid = new Set(SURN.avoid.map((x) => x.toLowerCase()));
    for (let s = 1; s < 40; s++) {
      const g = items({ t: 'faces', n: 8, surname: true }, s).items;
      expect(new Set(g.map((x) => x.last)).size).toBe(g.length);
      for (const x of g) expect(avoid.has(x.answer.toLowerCase())).toBe(false);
    }
  });
  it('scores two parts, one point each', () => {
    const it = [{ first: 'Mia', last: 'Baker', answer: 'Mia Baker' }, { first: 'Omar', last: 'Clay', answer: 'Omar Clay' }];
    const r = scoreSurnames(it, ['Mia Baker', 'Omar Wrong']);
    expect(r.n).toBe(4); expect(r.correct).toBe(3); expect(r.perItem[1].parts).toEqual([true, false]);
    expect(scoreSurnames(it, ['', '']).correct).toBe(0);
    expect(scoreDrill('faces', it, ['Mia Baker', 'Omar Clay'], { spec: { surname: true } }).acc).toBe(1);
    expect(scaledSpec({ t: 'faces', n: 6, s: 60, surname: true }, 6).lures).toBeUndefined();
  });
});

describe('V6 Skim, Pick, Keep', () => {
  it('has a keyword in its key point for every heading and candidates that include the key points', () => {
    for (const t of SKIM_TEXTS) {
      expect(t.headings).toHaveLength(5);
      t.headings.forEach((h, i) => expect(t.keyPoints[i].toLowerCase()).toContain(t.keywords[h].toLowerCase()));
      for (const k of t.keyPoints) expect(t.candidates).toContain(k);
    }
  });
  it('builds cued items by heading', () => {
    const g = items({ t: 'facts', n: 5, skim: true }, 8);
    expect(g.items).toHaveLength(5);
    expect(g.extra.skim.candidates).toHaveLength(8);
    expect(scoreDrill('facts', g.items, g.items.map((x) => x.answer)).acc).toBe(1);
  });
});

describe('Mind Map', () => {
  it('builds topic maps from checked maps and people maps from invented sheets', () => {
    const topic = items({ t: 'map', kind: 'topic', n: 12 }, 2);
    expect(topic.items.length).toBeGreaterThanOrEqual(6);
    expect(topic.extra.map.branches.length).toBeGreaterThanOrEqual(3);
    const people = items({ t: 'map', kind: 'people', n: 12 }, 2);
    expect(people.items[0].center).toBeTruthy();
    expect(mapBranches(people.items).length).toBe(4);
    expect(items({ t: 'map', n: 12 }, 2)).toEqual(items({ t: 'map', n: 12 }, 2));
  });
  it('scores a leaf inside its own branch only', () => {
    const it = [{ branch: 'A', answer: 'apple' }, { branch: 'A', answer: 'pear' }, { branch: 'B', answer: 'carrot' }, { branch: 'B', answer: 'leek' }];
    expect(scoreMap(it, ['pear', 'apple', 'leek', 'carrot']).acc).toBe(1);
    const wrong = scoreMap(it, ['carrot', '', 'apple', 'leek']);
    expect(wrong.correct).toBe(1);
    expect(wrong.errs.substitution).toBe(2);
    expect(scoreMap(it, ['', '', '', '']).acc).toBe(0);
    expect(scoreMap(it, []).errs.omission).toBe(4);
    expect(scoreDrill('map', it, ['apple', 'pear', 'carrot', 'leek']).acc).toBe(1);
    expect(recallMode('map')).toBe('branch');
  });
  it('a delayed review asks by whole branches, up to 12 leaves, from a stored set', () => {
    const p = fresh();
    const g = items({ t: 'map', kind: 'topic', n: 24 }, 11);
    const set = storeSet(p, { skill: 'structure', spec: { t: 'map', n: 24 }, items: g.items, role: 'practice' }, { acc: 0.9 });
    const probe = probeItems(set).items;
    expect(probe.length).toBeLessThanOrEqual(MAP_LIMIT);
    expect(probe.length).toBeGreaterThan(0);
    expect(mapProbe(g.items).length).toBe(probe.length);
    const res = scoreDrill('map', probe, probe.map((x) => x.answer));
    p.progress.dayOffset = 1;
    expect(dueSets(p).length).toBe(1);
    expect(applyProbe(p, set, res).pass).toBe(true);
  });
});

describe('Poem', () => {
  it('all poems are public domain or original with 4 to 16 lines', () => {
    expect(POEM_LIST.length).toBeGreaterThanOrEqual(25);
    for (const po of POEM_LIST) { expect(['original', 'public-domain']).toContain(po.origin); expect(po.lines.length).toBeGreaterThanOrEqual(4); expect(po.lines.length).toBeLessThanOrEqual(16); }
  });
  it('picks a poem near the asked length and stores up to 16 lines', () => {
    const g = items({ t: 'poem', n: 8 }, 3);
    expect(g.items).toHaveLength(8);
    expect(g.extra.poem.title).toBeTruthy();
    expect(items({ t: 'poem', n: 16 }, 3).items).toHaveLength(16);
  });
  it('practice forgives capitals, punctuation and a small typo; strict mode does not', () => {
    const line = 'Light one lamp and name one thing,';
    expect(poemLineOk('light one lamp and name one thing', line)).toBe(true);
    expect(poemLineOk('Light one lamp and name one thng,', line)).toBe(true);
    expect(poemLineOk('Light one lamp', line)).toBe(false);
    expect(poemLineOk('', line)).toBe(false);
    expect(poemLineStrict('Light one lamp and name one thing,', line)).toBe(true);
    expect(poemLineStrict('light one lamp and name one thing,', line)).toBe(false);
    expect(poemLineStrict('Light one lamp and name one thing', line)).toBe(false);
    expect(poemLineStrict(line, 'x', [line])).toBe(true);
  });
  it('scores a poem as ordered lines, probes use the first 10 lines', () => {
    const g = items({ t: 'poem', n: 12 }, 4).items;
    expect(scoreDrill('poem', g, g.map((x) => x.answer)).acc).toBe(1);
    const p = fresh();
    const set = storeSet(p, { skill: 'structure', spec: { t: 'poem', n: 12 }, items: g, role: 'practice' }, { acc: 1 });
    expect(probeItems(set).items).toHaveLength(10);
  });
  it('a strict page is all or nothing per line and stops after more than two skipped lines in a row', () => {
    const lines = [{ answer: 'a b' }, { answer: 'c d' }, { answer: 'e f' }, { answer: 'g h' }, { answer: 'i j' }];
    expect(scorePoemPage(lines, ['a b', 'c d', 'e f', 'g h', 'i j'], { title: 'T', author: 'A', gotTitle: 'T', gotAuthor: 'wrong' }).points).toBe(6);
    expect(scorePoemPage(lines, ['a b', '', '', '', 'i j']).points).toBe(1);
    expect(scorePoemPage(lines, ['a b', '', '', 'g h', 'i j']).points).toBe(3);
  });
});

describe('study sets and Mental Reckoning', () => {
  it('builds facts from each pool and accepts accented and alternative capitals', () => {
    for (const src of ['elements', 'roots', 'atlas', 'music', 'chess']) { const g = items({ t: 'facts', n: 6, src }).items; expect(g).toHaveLength(6); expect(g.every((x) => x.cue && x.answer)).toBe(true); }
    const atlas = items({ t: 'facts', n: 53, src: 'atlas' }).items.find((x) => x.alt);
    expect(atlas).toBeTruthy();
    expect(scoreDrill('facts', [atlas], [atlas.alt[0]]).acc).toBe(1);
  });
  it('anatomy terms come as ordered study vocabulary with the not-health-advice line', () => {
    expect(items({ t: 'chain', n: 12, src: 'body' }, 1).items).toHaveLength(12);
    expect(POOLS.body.honest).toMatch(/not health information/);
  });
  it('chess lines ignore move numbers, dots, spaces and case', () => {
    expect(normMoves('1.e4 e5 2.Nf3 Nc6 3.Bc4')).toBe(normMoves('1. E4 E5 2. nf3 nc6 3. bc4'));
    const it = [{ cue: 'Italian Game', answer: '1.e4 e5 2.Nf3 Nc6 3.Bc4' }];
    expect(scoreDrill('facts', it, ['e4 e5 Nf3 Nc6 Bc4'], { spec: { src: 'chess' } }).acc).toBe(1);
    expect(scoreDrill('facts', it, ['e4 e5 Nf3 Nc6 Bb5'], { spec: { src: 'chess' } }).acc).toBe(0);
  });
  it('sums are exact: commas and spaces are ignored, a slip is wrong', () => {
    const g = items({ t: 'calc', n: 6, level: 3, mode: 'see' }, 12).items;
    for (const it of g) { const [a, b] = it.cue.split(' + ').map(Number); expect(String(a + b)).toBe(it.answer); expect(it.steps[it.steps.length - 1]).toBe(it.answer); }
    const sample = [{ cue: '500 + 612', answer: '1112', steps: [] }];
    for (const ok of ['1112', '1,112', ' 1112 ']) expect(scoreDrill('calc', sample, [ok]).acc).toBe(1);
    for (const bad of ['1113', '111', '']) expect(scoreDrill('calc', sample, [bad]).acc).toBe(0);
    for (let level = 1; level <= 6; level++) for (const it of items({ t: 'calc', n: 20, level }, level).items) expect(+it.answer).toBeGreaterThan(0);
  });
  it('Mental Reckoning changes no skill estimate and earns no Lumen', () => {
    const p = fresh(); p.progress.baselineDone = true;
    const s = buildSession(p, 'free', { spec: { t: 'calc', n: 4, level: 1, mode: 'see' } });
    const before = JSON.stringify(p.skills);
    const out = applyDrill(p, s, { ...s.steps[0], role: 'practice' }, { n: 4, correct: 4, acc: 1, errs: noErrs, perItem: [] }, {});
    expect(out.lumen).toBe(0);
    expect(JSON.stringify(p.skills)).toBe(before);
    expect(p.results[p.results.length - 1].v).toBe('calc');
  });
});

describe('Unit Checks', () => {
  it('have two forms of equal length for lists, numbers and talk', () => {
    for (const u of UNITS) {
      const a = unitSpecs(u.unit, 'A'), b = unitSpecs(u.unit, 'B');
      expect(a.map((x) => x.n)).toEqual(b.map((x) => x.n));
      for (const sp of [...a, ...b]) expect(items(sp, 1).items).toHaveLength(sp.n);
    }
  });
  it('form items are fixed (same every time) and never scaled by level', () => {
    const sp = unitSpecs('numbers', 'A')[0];
    expect(scaledSpec(sp, 9, 'measure')).toMatchObject({ n: 12, s: 60 });
    expect(items(sp, 1).items).toEqual(items(sp, 99).items);
    expect(items(sp, 1).items.map((x) => x.answer).join('')).toBe('816137025972');
  });
  it('A comes in the first five days of its week, B on the sixth, once each, and B needs A', () => {
    const p = fresh();
    const day = (w, d) => (w - 1) * 7 + d;
    expect(unitDue(p, UNIT_WEEKS.lists.A, day(3, 1))).toEqual({ unit: 'lists', form: 'A' });
    expect(unitDue(p, UNIT_WEEKS.lists.A, day(3, 6))).toBeNull();
    expect(unitDue(p, UNIT_WEEKS.lists.B, day(6, 6))).toBeNull();
    p.results.push({ date: today(p), acc: 1, t: 'chain', v: 'unit-lists-A', role: 'check', n: 12, correct: 12 });
    expect(unitDue(p, UNIT_WEEKS.lists.A, day(3, 2))).toBeNull();
    expect(unitDue(p, UNIT_WEEKS.lists.B, day(6, 6))).toEqual({ unit: 'lists', form: 'B' });
    expect(unitDue(p, UNIT_WEEKS.lists.B, day(6, 3))).toBeNull();
  });
  it('are placed before the lesson, replace the weekly check, and record the form on the result', () => {
    const p = fresh(); p.progress.baselineDone = true; p.progress.day = 15;
    const s = buildSession(p, 'full');
    const units = s.steps.filter((x) => x.unitCheck);
    expect(units).toHaveLength(2);
    expect(units[0].role).toBe('check');
    expect(s.steps.indexOf(units[0])).toBeLessThan(s.steps.findIndex((x) => x.kind === 'lesson'));
    expect(s.steps.filter((x) => x.role === 'check' && !x.unitCheck)).toHaveLength(0);
    applyDrill(p, s, units[0], { n: 12, correct: 6, acc: 0.5, errs: noErrs, perItem: [] }, { studyMs: 1000 });
    expect(p.results[p.results.length - 1].v).toBe('unit-lists-A');
    expect(buildSession(p, 'full').steps.filter((x) => x.unitCheck)).toHaveLength(0);
  });
  it('are skipped on assessment days', () => {
    const p = fresh(); p.progress.baselineDone = true; p.progress.day = 21;
    expect(buildSession(p, 'assessment').steps.filter((x) => x.unitCheck)).toHaveLength(0);
  });
});

describe('Then and now, Your Methods', () => {
  const rec = (o) => ({ date: '2026-11-01', acc: 0.5, t: 'chain', role: 'practice', n: 10, correct: 5, ...o });
  it('compares the first scored attempt with the latest and the best, never guided', () => {
    const p = fresh();
    p.results.push(rec({ role: 'guided', acc: 0.1 }), rec({ acc: 0.4 }), rec({ acc: 0.9, date: '2026-11-02' }), rec({ acc: 0.7, date: '2026-11-03' }));
    expect(thenAndNow(p).find((r) => r.key === 'chain')).toMatchObject({ first: 0.4, latest: 0.7, best: 0.9, tries: 3 });
    expect(thenAndNow({ results: [rec({})] })).toHaveLength(0);
  });
  it('separates variants by the v field', () => {
    const p = fresh();
    p.results.push(rec({ t: 'pairs', v: 'peg', acc: 0.3 }), rec({ t: 'pairs', v: 'peg', acc: 0.6 }), rec({ t: 'pairs', acc: 1 }), rec({ t: 'pairs', acc: 1 }));
    expect(thenAndNow(p).map((r) => r.key).sort()).toEqual(['pairs', 'peg']);
  });
  it('shows Form A beside Form B', () => {
    const p = fresh();
    p.results.push(rec({ v: 'unit-numbers-A', n: 12, correct: 3 }), rec({ v: 'unit-numbers-A', n: 10, correct: 1 }), rec({ v: 'unit-numbers-B', n: 12, correct: 9 }));
    const u = unitComparison(p).find((x) => x.unit === 'numbers');
    expect(u.a.acc).toBeCloseTo(4 / 22); expect(u.b.acc).toBeCloseTo(0.75);
    expect(thenAndNow(p)).toHaveLength(0);
  });
  it('Your Methods counts tries and the seven-day hold, and never ranks or labels the player', () => {
    const p = fresh();
    p.results.push(rec({ acc: 0.8 }), rec({ acc: 0.6 }), rec({ role: 'probe', delay: 7, acc: 0.5 }), rec({ role: 'probe', delay: 1, acc: 1 }));
    expect(methodStats(p, YM.methods).find((m) => m.id === 'chain')).toMatchObject({ n: 2, acc: 70, hold7: 50 });
    expect(methodStats(p, YM.methods).find((m) => m.id === 'poem').n).toBe(0);
    expect(JSON.stringify([YM.intro, YM.caption, YM.keepWhatWorks, YM.alsoSay, YM.fewAttempts])).not.toMatch(/you are a (visual|auditory)|best method|worst method/i);
  });
});

describe('Cards', () => {
  it('has 52 unique cards, a seeded shuffle and forgiving card codes', () => {
    expect(new Set(fullDeck()).size).toBe(52);
    expect(deckOrder(7, 20)).toEqual(deckOrder(7, 20));
    expect(deckOrder(7, 20)).toHaveLength(20);
    for (const [x, y] of [['10h', '10H'], ['H10', '10H'], ['as', 'AS'], ['Ace of Spades', 'AS'], ['10 H', '10H'], ['kc', 'KC']]) expect(parseCard(x)).toBe(y);
    for (const bad of ['', '1H', '11H', 'ZZ', '10']) expect(parseCard(bad)).toBeNull();
    expect(cardName('10H')).toBe('10 of Hearts');
  });
  it('a run ends at the first mistake and a by-position streak ends at the first miss', () => {
    const deck = deckOrder(3, 10);
    const ans = deck.slice();
    expect(runScore(deck, ans).run).toBe(10);
    ans[4] = deck[5];
    expect(runScore(deck, ans)).toMatchObject({ run: 4, right: 9, total: 10 });
    expect(runScore(deck, []).run).toBe(0);
    const order = positionOrder(10, 3);
    expect(new Set(order).size).toBe(10);
    const asks = order.map((i) => deck[i]);
    expect(positionStreak(deck, order, asks)).toBe(10);
    asks[2] = asks[2] === 'KC' ? 'QC' : 'KC';
    expect(positionStreak(deck, order, asks)).toBe(2);
  });
  it('every card has a picture', () => {
    expect(Object.keys(CARDS.images)).toHaveLength(52);
  });
});

describe('saving and importing', () => {
  it('sets with the new specs and results with a v field survive export and import', () => {
    const p = fresh();
    for (const spec of [{ t: 'map', kind: 'topic', n: 12, s: 100 }, { t: 'poem', n: 6, s: 100 }, { t: 'pairs', n: 6, s: 60, peg: 'shape' }, { t: 'facts', n: 5, s: 60, skim: true }]) {
      const g = genItems(spec, 3, p);
      storeSet(p, { skill: TEMPLATE_SKILL[spec.t], spec, items: g.items, role: 'practice' }, { acc: 0.8 });
    }
    p.results.push({ date: today(p), acc: 0.5, t: 'map', v: 'map', role: 'practice', n: 4, correct: 2 });
    const back = parseImport(buildExport(p));
    expect(back.ok).toBe(true);
    expect(back.profile.sets).toHaveLength(4);
    expect(back.profile.results[0].v).toBe('map');
    p.results.push({ date: today(p), acc: 0.5, t: 'map', v: 7, role: 'practice', n: 4, correct: 2 });
    expect(parseImport(buildExport(p)).ok).toBe(false);
  });
  it('variantOf names each variant once', () => {
    expect(variantOf({ t: 'pairs', peg: 'shape' })).toBe('peg');
    expect(variantOf({ t: 'digits', group: 4 })).toBe('group');
    expect(variantOf({ t: 'chain', src: 'steps' })).toBe('steps');
    expect(variantOf({ t: 'chain' })).toBeUndefined();
    expect(MIND_MAPS).toHaveLength(24);
  });
});
