import { describe, it, expect } from 'vitest';
import { newProfile, today } from '../src/engine/core.js';
import { addDays } from '../src/engine/util.js';
import { migrate, buildExport, parseImport, validateProfile } from '../src/store.js';
import { material, trialState, startTrial, submitCheck, lineMatches, isRightTrial, dueTrials, statusLine, TRIAL_IDS, hintFor } from '../src/engine/trials.js';
import { TRIALS, TIMELINES, OLD_TONGUE, CLOCK_PARTS, STALLS, TABLETS_V, TRIAL_LORE } from '../src/data/trials.js';
import { earnedItems, fadedRelics, repairState, answerRepair, repairCard, recallCard } from '../src/engine/collect.js';
import { codexFor } from '../src/engine/quests.js';
import { ITEMS, ITEM_BY_ID } from '../src/data/items.js';
import { ICONS } from '../src/pixel/icons.js';
import { MODULES } from '../src/data/curriculum.js';

const ALL = MODULES.map((m) => m.id);
const fresh = (gates = ALL) => { const p = newProfile('t', 'key'); p.progress.gates = [...gates]; return p; };
const answersFor = (id, seed, p, fn = (it) => it.answer) => Object.fromEntries(material(id, seed, p).items.map((it) => [it.key, fn(it)]));
const snap = (p) => JSON.stringify({ skills: p.skills, results: p.results, sets: p.sets });

describe('trial data', () => {
  it('every trial has a gate, a prize item, art, story and checks', () => {
    for (const t of Object.values(TRIALS)) {
      expect(ALL).toContain(t.gate);
      expect(ITEM_BY_ID[t.prize]?.source).toEqual({ type: 'trial', id: t.id });
      expect(ICONS[t.prize], `icon for ${t.prize}`).toBeTruthy();
      expect(t.checks.length).toBeGreaterThan(0);
      expect(t.checks[t.checks.length - 1].practice).toBeFalsy();
      for (const s of [t.setup, t.intro, t.pass, t.miss, t.title]) { expect(s.length).toBeGreaterThan(5); expect(s).not.toMatch(/[—–]/); }
    }
    expect(ITEMS.filter((i) => i.kind === 'prize').length).toBe(Object.keys(TRIALS).length);
  });
  it('material pools are unique, sized and free of dashes', () => {
    expect(new Set(OLD_TONGUE.map((w) => w[0])).size).toBe(OLD_TONGUE.length);
    expect(new Set(OLD_TONGUE.map((w) => w[1])).size).toBe(OLD_TONGUE.length);
    expect(new Set(CLOCK_PARTS).size).toBe(CLOCK_PARTS.length);
    expect(CLOCK_PARTS.length).toBeGreaterThanOrEqual(15);
    expect(STALLS.length).toBe(15);
    for (const tl of TIMELINES) { expect(tl.events.length).toBe(7); for (const e of tl.events) expect(e[1]).not.toMatch(/[—–]/); }
    for (const tb of TABLETS_V) { expect(tb.lines.length).toBe(5); for (const l of tb.lines) expect(l).not.toMatch(/[—–]/); }
    for (const l of TRIAL_LORE) expect(l.unlock).toMatch(/^trial:/);
  });
  it('material is deterministic for a seed and changes with the seed', () => {
    const p = fresh();
    for (const id of TRIAL_IDS) {
      const a = material(id, 11, p), b = material(id, 11, p);
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
      expect(a.items.length).toBeGreaterThan(0);
    }
    expect(JSON.stringify(material('bridge', 1, p))).not.toBe(JSON.stringify(material('bridge', 2, p)));
  });
  it('gears are asked in reverse, the code is twelve digits', () => {
    const p = fresh();
    const g = material('gears', 5, p);
    expect(g.items[0].prompt).toMatch(/^Stall 15/);
    expect(g.items[14].prompt).toMatch(/^Stall 1,/);
    const c = material('salt_vault', 5, p);
    expect(c.items[0].answer).toMatch(/^\d{12}$/);
    expect(c.distraction).toBeTruthy();
  });
});

describe('matching', () => {
  it('lines forgive case, punctuation and small typos but not numbers or names', () => {
    expect(lineMatches('count 12 coins into the tin.', 'Count 12 coins into the tin')).toBe(true);
    expect(lineMatches('Count 12 coins in to the tim', 'Count 12 coins into the tin')).toBe(true);
    expect(lineMatches('Count 13 coins into the tin', 'Count 12 coins into the tin')).toBe(false);
    expect(lineMatches('Leave a loaf for Tamsy', 'Leave a loaf for Tansy')).toBe(false);
    expect(lineMatches('Leave a loaf for tansy', 'Leave a loaf for Tansy')).toBe(true);
    expect(lineMatches('something else entirely', 'Trim the wick before dawn breaks')).toBe(false);
    expect(lineMatches('', 'Trim the wick')).toBe(false);
  });
  it('codes must be exact; words use the forgiving matcher and variants', () => {
    expect(isRightTrial({ code: true, answer: '123456789012' }, '12 34 56 78 90 12')).toBe(true);
    expect(isRightTrial({ code: true, answer: '123456789012' }, '123456789013')).toBe(false);
    expect(isRightTrial({ answer: 'Apollo 11', alts: ['Moon landing'] }, 'moon landing')).toBe(true);
    expect(isRightTrial({ answer: 'kettle' }, 'kettles')).toBe(true);
    expect(hintFor({ answer: 'Trim the wick' }, 1)).toMatch(/"T"/);
    expect(hintFor({ answer: 'Trim the wick' }, 2)).toMatch(/"Trim"/);
  });
});

describe('trial flow', () => {
  it('locked until the district gate; open after it', () => {
    const p = fresh([]);
    for (const id of TRIAL_IDS) expect(trialState(p, id)).toBe('locked');
    p.progress.gates = ['M3'];
    expect(trialState(p, 'catacombs')).toBe('ready');
    expect(statusLine(p, 'bridge')).toMatch(/Opens when/);
  });
  it('a same-day trial passes at the threshold, gives the prize and lore, never touches skills', () => {
    const p = fresh();
    const before = snap(p);
    startTrial(p, 'catacombs', 9);
    const all = answersFor('catacombs', 9, p);
    const keys = Object.keys(all);
    keys.slice(0, 3).forEach((k) => { all[k] = 'nobody'; }); // 7 of 10: below 8
    const miss = submitCheck(p, 'catacombs', all);
    expect(miss.passed).toBe(false);
    expect(miss.missed.length).toBe(3);
    expect(trialState(p, 'catacombs')).toBe('rest');
    expect(earnedItems(p)).not.toContain('tr_ledger_fragment');
    // the next day, fresh material
    const t1 = addDays(today(p), 1);
    expect(trialState(p, 'catacombs', t1)).toBe('ready');
    startTrial(p, 'catacombs', 10, t1);
    const ok = answersFor('catacombs', 10, p);
    ok[Object.keys(ok)[0]] = 'nobody'; // 9 of 10 passes
    const res = submitCheck(p, 'catacombs', ok, {}, t1);
    expect(res.passed).toBe(true);
    expect(trialState(p, 'catacombs', t1)).toBe('done');
    expect(earnedItems(p)).toContain('tr_ledger_fragment');
    expect(codexFor(p).find((e) => e.id === 'lore_catacombs').open).toBe(true);
    expect(snap(p)).toBe(before);
    expect(p.progress.lumen).toBe(0);
  });
  it('the Scriptorium needs a held recall one day later', () => {
    const p = fresh(), t0 = today(p);
    startTrial(p, 'scriptorium', 3, t0);
    const first = submitCheck(p, 'scriptorium', answersFor('scriptorium', 3, p), {}, t0);
    expect(first.practice).toBe(true);
    expect(first.passed).toBe(false);
    expect(trialState(p, 'scriptorium', t0)).toBe('waiting');
    const t1 = addDays(t0, 1);
    expect(trialState(p, 'scriptorium', t1)).toBe('due');
    expect(dueTrials(p, t1)).toContain('scriptorium');
    const r = submitCheck(p, 'scriptorium', answersFor('scriptorium', 3, p), {}, t1);
    expect(r.passed).toBe(true);
    expect(earnedItems(p)).toContain('tr_dry_scroll');
  });
  it('the Bridge asks again after 7 days and gives one gentle recovery before fresh words', () => {
    const p = fresh(), t0 = today(p);
    startTrial(p, 'bridge', 4, t0);
    submitCheck(p, 'bridge', answersFor('bridge', 4, p), {}, t0);
    expect(trialState(p, 'bridge', addDays(t0, 6))).toBe('waiting');
    const t7 = addDays(t0, 7);
    const weak = answersFor('bridge', 4, p, () => 'no idea');
    const r = submitCheck(p, 'bridge', weak, {}, t7);
    expect(r.recover).toBe(3);
    expect(r.missed.length).toBe(10);
    expect(trialState(p, 'bridge', addDays(t7, 3))).toBe('due');
    const r2 = submitCheck(p, 'bridge', weak, {}, addDays(t7, 3));
    expect(r2.retryOn).toBeTruthy();
    expect(trialState(p, 'bridge', addDays(t7, 3))).toBe('rest');
    expect(trialState(p, 'bridge', addDays(t7, 4))).toBe('ready');
  });
  it('a vault opens on the 7-day recall; hinted lines open it but earn no Lumen', () => {
    const p = fresh(), t0 = today(p);
    startTrial(p, 'vault_quay', 8, t0);
    expect(trialState(p, 'vault_quay', t0)).toBe('waiting');
    const t1 = addDays(t0, 1);
    const ci = submitCheck(p, 'vault_quay', {}, {}, t1);
    expect(ci.quiet).toBe(true);
    expect(trialState(p, 'vault_quay', t1)).toBe('waiting');
    const t7 = addDays(t0, 7);
    expect(trialState(p, 'vault_quay', t7)).toBe('due');
    const r = submitCheck(p, 'vault_quay', answersFor('vault_quay', 8, p), { 0: 1, 1: 2 }, t7);
    expect(r.passed).toBe(true);
    expect(r.lumen).toBe(3 * 2);
    expect(p.progress.lumen).toBe(6);
    expect(earnedItems(p)).toContain('vt_lamp_hook');
  });
  it('a missed vault waits two days for a fresh tablet', () => {
    const p = fresh(), t0 = today(p);
    startTrial(p, 'vault_quay', 8, t0);
    submitCheck(p, 'vault_quay', {}, {}, addDays(t0, 1));
    const t7 = addDays(t0, 7);
    const r = submitCheck(p, 'vault_quay', { 0: 'wrong' }, {}, t7);
    expect(r.passed).toBe(false);
    expect(trialState(p, 'vault_quay', addDays(t7, 1))).toBe('rest');
    expect(trialState(p, 'vault_quay', addDays(t7, 2))).toBe('ready');
  });
});

describe('calm relic repair', () => {
  function dim() {
    const p = fresh(['M1']);
    const t = today(p);
    p.skills.imagery.probes = [{ date: addDays(t, -1), delay: 7, score: 0.4, acc: 0.4 }];
    return p;
  }
  it('two cards a day or more apart, with different words, bring the light back', () => {
    const p = dim(), t0 = today(p);
    expect(fadedRelics(p)).toContain('art_grey_glove');
    expect(repairState(p, 'art_grey_glove', t0)).toBe('first');
    const c0 = repairCard(p, 'art_grey_glove', t0);
    expect(answerRepair(p, 'art_grey_glove', 'nonsense', t0).ok).toBe(false);
    expect(repairState(p, 'art_grey_glove', t0)).toBe('rest');
    const t1 = addDays(t0, 1);
    expect(answerRepair(p, 'art_grey_glove', c0.answer, t1).ok).toBe(true);
    expect(repairState(p, 'art_grey_glove', t1)).toBe('wait');
    const t2 = addDays(t0, 2);
    const c1 = repairCard(p, 'art_grey_glove', t2);
    expect(c1.answer).not.toBe(c0.answer);
    expect(answerRepair(p, 'art_grey_glove', c1.answer, t2).ok).toBe(true);
    expect(fadedRelics(p)).not.toContain('art_grey_glove');
    expect(repairState(p, 'art_grey_glove', t2)).toBe('none');
  });
  it('a later slipped recall dims it again; every gate artifact has two cards', () => {
    const p = dim(), t0 = today(p);
    p.relics.repair = { art_grey_glove: { done: t0 } };
    expect(fadedRelics(p)).not.toContain('art_grey_glove');
    p.skills.imagery.probes.push({ date: addDays(t0, 3), delay: 30, score: 0.3, acc: 0.3 });
    expect(fadedRelics(p)).toContain('art_grey_glove');
    for (const it of ITEMS.filter((i) => i.kind === 'artifact' && i.source.type === 'gate')) {
      expect(recallCard(it.id, 0), it.id).toBeTruthy();
      expect(recallCard(it.id, 1), it.id).toBeTruthy();
      expect(recallCard(it.id, 1).answer).not.toBe(recallCard(it.id, 0).answer);
    }
  });
});

describe('save data', () => {
  it('migrates old saves, round-trips trials and repairs, and rejects bad records', () => {
    const p = fresh();
    delete p.trials;
    migrate(p);
    expect(p.trials).toEqual({});
    startTrial(p, 'bridge', 4);
    p.relics.repair = { art_grey_glove: { first: today(p) } };
    const r = parseImport(buildExport(p));
    expect(r.ok).toBe(true);
    expect(r.profile.trials.bridge.seed).toBe(4);
    expect(validateProfile({ ...p, trials: { nope: {} } })).toMatch(/Trial/);
    expect(validateProfile({ ...p, trials: { bridge: { start: 'yesterday' } } })).toMatch(/Trial/);
    expect(validateProfile({ ...p, trials: { bridge: { step: 9 } } })).toMatch(/Trial/);
    expect(validateProfile({ ...p, relics: { polish: {}, repair: { not_an_item: { done: today(p) } } } })).toMatch(/repair/);
  });
});
