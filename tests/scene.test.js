import { describe, it, expect } from 'vitest';
import { SCENARIOS, TECH, CARRY_CUES } from '../src/data/scenarios.js';
import { sceneItems, scoreScene, sceneAnswerOk, updateLadder, rungOf, sceneMode, pickFits, addCarry, dueCarry, checkCarry, carryHeld, transferResults, transferScore, workedExample, sceneFor } from '../src/engine/scene.js';
import { newProfile, genItems, storeSet, probeItems, SCHEMA } from '../src/engine/core.js';
import { migrate, validateProfile } from '../src/store.js';
import { buildSession } from '../src/engine/session.js';
import { componentScores } from '../src/engine/progress.js';
import { rng, addDays } from '../src/engine/util.js';

describe('real-life scene templates', () => {
  for (const sc of SCENARIOS) {
    it(`${sc.id}: fresh material, every answer checkable, correct answers score full marks`, () => {
      const seen = new Set();
      for (let seed = 1; seed <= 40; seed++) {
        const { items, extra } = sceneItems({ t: 'scene', sc: sc.id, n: 10 }, rng(seed));
        expect(items.length).toBeGreaterThanOrEqual(4);
        for (const q of [...items, ...extra.probe]) {
          expect(String(q.answer).trim()).not.toBe('');
          expect(q.q).not.toMatch(/—/);
          if (q.kind === 'choice') { expect(q.options).toContain(q.answer); expect(new Set(q.options).size).toBe(q.options.length); }
        }
        expect(scoreScene(items, items.map((q) => q.answer)).acc).toBe(1);
        expect(scoreScene(extra.probe, extra.probe.map((q) => q.answer)).acc).toBe(1);
        expect(scoreScene(items, items.map(() => '')).acc).toBe(0);
        expect(JSON.stringify(extra.scene.body)).not.toMatch(/—/);
        seen.add(JSON.stringify(extra.scene.body));
      }
      expect(seen.size).toBeGreaterThan(30); // the same scene is (almost) never repeated
      expect(sc.fit.every((t) => TECH[t])).toBe(true);
    });
  }

  it('answer kinds: times, numbers and digits are forgiving about format only', () => {
    expect(sceneAnswerOk('9.45', { answer: '9:45', kind: 'time' })).toBe(true);
    expect(sceneAnswerOk('0945', { answer: '9:45', kind: 'time' })).toBe(true);
    expect(sceneAnswerOk('9:54', { answer: '9:45', kind: 'time' })).toBe(false);
    expect(sceneAnswerOk('079 441 2068', { answer: '0794412068', kind: 'digits' })).toBe(true);
    expect(sceneAnswerOk('794412068', { answer: '0794412068', kind: 'digits' })).toBe(false);
    expect(sceneAnswerOk('three', { answer: '3', kind: 'number' })).toBe(false);
    expect(sceneAnswerOk('the fountain', { answer: 'the fountain', kind: 'choice' })).toBe(true);
    expect(sceneAnswerOk('4:45', { answer: '16:45', kind: 'time' })).toBe(true);
    expect(sceneAnswerOk('bakery', { answer: 'the bakery' })).toBe(true);
    expect(sceneAnswerOk('the bakers', { answer: 'the library' })).toBe(false);
  });
});

describe('the technique ladder', () => {
  it('climbs from worked example to choose-it-yourself on good answers, and steps down on weak ones', () => {
    const p = newProfile('t', 'key');
    expect(rungOf(p, 'chain')).toBe(1);
    expect(sceneMode(p, 'sc-shop', 5)).toBe('worked');
    updateLadder(p, 'chain', 0.4); expect(rungOf(p, 'chain')).toBe(2);
    expect(sceneMode(p, 'sc-shop', 5)).toBe('guided');
    updateLadder(p, 'chain', 0.6); expect(rungOf(p, 'chain')).toBe(2);
    updateLadder(p, 'chain', 0.75); expect(rungOf(p, 'chain')).toBe(3);
    updateLadder(p, 'chain', 0.85); expect(rungOf(p, 'chain')).toBe(3); // needs two good scenes in a row
    updateLadder(p, 'chain', 0.9); expect(rungOf(p, 'chain')).toBe(4);
    expect(sceneMode(p, 'sc-shop', 5)).toBe('choose');
    updateLadder(p, 'chain', 0.3); updateLadder(p, 'chain', 0.2); expect(rungOf(p, 'chain')).toBe(3);
  });
  it('from week 40 every scene is choose-it-yourself', () => {
    expect(sceneMode(newProfile('t', 'key'), 'sc-way', 40)).toBe('choose');
  });
  it('a pick is coached, never scored', () => {
    expect(pickFits('sc-voicemail', 'major').ok).toBe(true);
    expect(pickFits('sc-voicemail', 'faces').ok).toBe(false);
  });
  it('worked examples use the scene material', () => {
    expect(workedExample('palace', ['eggs', 'leek', 'tea'])).toMatch(/eggs/);
  });
});

describe('Carry it', () => {
  it('counts as held only when the real things are recalled correctly', () => {
    const p = newProfile('t', 'key');
    const c = addCarry(p, CARRY_CUES[0].when, 'palace', ['stamps', 'batteries', 'birthday card', 'milk', 'bin bags'], '2026-11-08');
    expect(dueCarry(p, '2026-11-08')).toHaveLength(0);
    expect(dueCarry(p, '2026-11-09')).toHaveLength(1);
    const r1 = checkCarry(p, c.id, ['stamps', 'milk'], '2026-11-09');
    expect(r1.held).toBe(false);
    expect(dueCarry(p, '2026-11-10')).toHaveLength(0);
    const r2 = checkCarry(p, c.id, ['bin bags', 'stamps', 'battery', 'milk', 'birthday card'], addDays('2026-11-08', 7));
    expect(r2.held).toBe(true);
    expect(carryHeld(p)).toEqual({ day1: 0, day7: 1, tries: 2 });
    expect(dueCarry(p, '2026-12-30')).toHaveLength(0);
    expect(p.progress.lumen).toBe(0); // it never earns Lumen
  });
  it('a plan with no things still records the if-then plan', () => {
    const p = newProfile('t', 'key');
    expect(addCarry(p, CARRY_CUES[1].when, 'faces', [], '2026-11-08')).toBe(null);
    expect(p.habits.plans).toHaveLength(1);
  });
});

describe('scenes in sessions and saves', () => {
  it('a full session from week 3 includes one real-life scene', () => {
    const p = newProfile('t', 'key');
    p.progress.baselineDone = true;
    p.progress.day = 20; // week 3, after the Unit Check days
    const s = buildSession(p, 'full');
    const scenes = s.steps.filter((x) => x.spec?.t === 'scene');
    expect(scenes).toHaveLength(1);
    expect(scenes[0].skill).toBe(SCENARIOS.find((x) => x.id === scenes[0].extra.scene.id).skill);
    expect(scenes[0].sceneMode).toBe('worked');
  });
  it('weeks 1 and 2 have no scene yet', () => {
    const p = newProfile('t', 'key'); p.progress.baselineDone = true; p.progress.day = 10;
    expect(buildSession(p, 'full').steps.some((x) => x.spec?.t === 'scene')).toBe(false);
  });
  it('rotates through the scenes the player has the tools for', () => {
    expect(['sc-shop', 'sc-way']).toContain(sceneFor(newProfile('t', 'key'), 3, 9));
    const ids = new Set(Array.from({ length: 30 }, (_, d) => sceneFor(null, 30, d)));
    expect(ids.size).toBe(SCENARIOS.filter((s) => s.from <= 30).length);
  });
  it('a stored scene comes back the next day with different questions', () => {
    const p = newProfile('t', 'key');
    const spec = { t: 'scene', sc: 'sc-shop', n: 10, s: 90, skill: 'palace' };
    const { items, extra } = genItems(spec, 77);
    const set = storeSet(p, { role: 'practice', skill: 'palace', spec, items, extra }, { acc: 0.8 });
    const pr = probeItems(set);
    expect(pr.flip).toBe(true);
    expect(pr.items.map((q) => q.q)).not.toEqual(items.map((q) => q.q));
    expect(validateProfile(p)).toBe(null);
  });
  it('honest transfer: only scenes and reversed next-day questions count', () => {
    const rs = [{ t: 'chain', role: 'check', acc: 1 }, { t: 'scene', role: 'practice', acc: 0.5 }, { t: 'vocab', role: 'probe', flip: true, acc: 0.7 }];
    expect(transferResults(rs)).toHaveLength(2);
    expect(transferScore(transferResults(rs))).toBeCloseTo(60);
    const p = newProfile('t', 'key');
    p.results.push({ date: p.progress.startDate, t: 'chain', role: 'check', acc: 1 });
    expect(componentScores(p).transfer).toBe(null);
  });
  it('schema 2 saves move to schema 3 and load unchanged', () => {
    const old = newProfile('t', 'key');
    delete old.habits; delete old.ladder; old.meta.schema = 2;
    old.results.push({ date: old.progress.startDate, t: 'chain', role: 'practice', acc: 0.9 });
    const m = migrate(structuredClone(old));
    expect(m.meta.schema).toBe(SCHEMA);
    expect(SCHEMA).toBe(3);
    expect(m.habits).toEqual({ plans: [], carry: [] });
    expect(m.ladder).toEqual({});
    expect(m.results).toEqual(old.results);
    expect(validateProfile(m)).toBe(null);
  });
  it('the validator refuses a damaged ladder or carry list', () => {
    const p = newProfile('t', 'key');
    p.ladder = { palace: { rung: 9, hist: [] } };
    expect(validateProfile(p)).toMatch(/ladder/);
    const q = newProfile('t', 'key');
    q.habits.carry = [{ id: 'x', things: Array(11).fill('a'), made: '2026-11-08', due: '2026-11-09', idx: 0, checks: [] }];
    expect(validateProfile(q)).toMatch(/Carry/);
  });
});

describe('review fixes', () => {
  it('a backup with a Carry it plan and long lines restores', async () => {
    const { buildExport, parseImport } = await import('../src/store.js');
    const p = newProfile('t', 'key');
    addCarry(p, CARRY_CUES[0].when, 'palace', ['x'.repeat(150), 'milk'], '2026-11-08');
    const r = parseImport(buildExport(p));
    expect(r.ok).toBe(true);
  });
  it('a scaffolded scene (worked example or how-to) leaves skill estimates alone', async () => {
    const { applyDrill } = await import('../src/engine/progress.js');
    const p = newProfile('t', 'key');
    const spec = { t: 'scene', sc: 'sc-shop', n: 10, s: 90, skill: 'linking' };
    const { items, extra } = genItems(spec, 3);
    const step = { kind: 'drill', role: 'practice', spec, skill: 'linking', level: 1, items, extra, sceneMode: 'worked' };
    const session = { id: 's', day: 20, type: 'full', steps: [step] };
    applyDrill(p, session, step, scoreScene(items, items.map((q) => q.answer)), {});
    expect(p.skills.linking.attempts).toBe(0);
    const named = { ...step, sceneMode: 'named' };
    applyDrill(p, { ...session, steps: [named] }, named, scoreScene(items, items.map((q) => q.answer)), {});
    expect(p.skills.linking.attempts).toBe(1);
  });
});
