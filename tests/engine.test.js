import { describe, it, expect } from 'vitest';
import { newProfile, scoreDrill, updateSkill, computeMastery, storeSet, applyProbe, dueSets, scaledSpec, genItems, applySessionLevel } from '../src/engine/core.js';
import { buildSession, sessionStatus, estimateMinutes } from '../src/engine/session.js';
import { applyDrill, finalizeSession, componentScores, mts, streaks, rankOf } from '../src/engine/progress.js';
import { matches, majorDecode, addDays, daysBetween } from '../src/engine/util.js';
import { MAJOR_PAIRS, MAJOR_SINGLE } from '../src/data/content.js';
import { WEEKS, MODULES } from '../src/data/curriculum.js';
import { buildExport, parseImport } from '../src/store.js';

const res = (acc, n = 10) => ({ n, correct: Math.round(acc * n), acc, errs: { omission: n - Math.round(acc * n), substitution: 0, order: 0, timeout: 0 } });

describe('curriculum', () => {
  it('has 52 weeks and 12 contiguous modules', () => {
    expect(WEEKS.length).toBe(52);
    expect(WEEKS.map((w) => w.w)).toEqual(Array.from({ length: 52 }, (_, i) => i + 1));
    let next = 1; for (const m of MODULES) { expect(m.weeks[0]).toBe(next); next = m.weeks[1] + 1; } expect(next).toBe(53);
  });
  it('every drill spec generates the right number of items', () => {
    const p = newProfile('t', 'key');
    for (const w of WEEKS) for (const d of [...w.drills, w.check]) {
      const s = scaledSpec(d, 3);
      const got = genItems(s, 42, p).items.length;
      // 1.1: some specs size themselves (a Mind Map or poem is a whole piece, pegs stop at 10, a text has so many steps or points)
      // 1.2: a scene asks its own set of questions, whatever n is
      if (d.t === 'map' || d.t === 'poem' || d.skim || d.t === 'scene' || d.src === 'diagram') expect(got).toBeGreaterThan(0);
      else if (d.peg || d.src === 'steps' || d.src === 'points') expect(got).toBeLessThanOrEqual(s.n);
      else expect(got).toBe(s.n);
    }
  });
});

describe('matching and Major System', () => {
  it('forgives case, plurals and one typo', () => {
    expect(matches('Anchor', 'anchor')).toBe(true);
    expect(matches('anchors', 'anchor')).toBe(true);
    expect(matches('ancor', 'anchor')).toBe(true);
    expect(matches('cat', 'car')).toBe(false);
    expect(matches('parrot', 'carrot')).toBe(false); expect(matches('chair', 'chain')).toBe(false);
  });
  it('decodes nearly every default Major word', () => {
    const bad = MAJOR_PAIRS.filter((w, i) => majorDecode(w) !== String(i).padStart(2, '0'));
    expect(bad.length).toBeLessThanOrEqual(3);
    expect(majorDecode('dog')).toBe('17'); expect(majorDecode('bug')).toBe('97'); expect(majorDecode('disc')).toBe('107');
    MAJOR_SINGLE.forEach((w, i) => expect(majorDecode(w)).toBe(String(i)));
  });
});

describe('scoring', () => {
  it('scores free recall in any order and counts intrusions', () => {
    const items = ['apple', 'rope', 'owl'].map((a) => ({ answer: a }));
    const r = scoreDrill('wordlist', items, ['owl', 'apple', 'tree']);
    expect(r.correct).toBe(2); expect(r.errs.omission).toBe(1); expect(r.errs.substitution).toBe(1);
  });
  it('detects order errors in ordered recall', () => {
    const items = ['apple', 'rope', 'owl'].map((a) => ({ answer: a }));
    const r = scoreDrill('chain', items, ['apple', 'owl', '']);
    expect(r.correct).toBe(1); expect(r.errs.order).toBe(1); expect(r.errs.omission).toBe(1);
  });
  it('accepts any phonetically valid Major word', () => {
    const r = scoreDrill('major', [{ cue: '74', answer: 'car' }], ['crow']);
    expect(r.acc).toBe(1);
  });
});

describe('adaptive rules', () => {
  it('R1 levels up after 3 sessions at 90%+, R2 levels down after 2 below 50%, per session not per drill', () => {
    const p = newProfile('t', 'key');
    for (let i = 0; i < 6; i++) updateSkill(p, 'imagery', res(0.95), 'practice');
    expect(p.skills.imagery.level).toBe(1); // drills alone never change level
    for (let i = 0; i < 3; i++) applySessionLevel(p, 'imagery', 0.95, true);
    expect(p.skills.imagery.level).toBe(2);
    applySessionLevel(p, 'imagery', 0.95, false); // too slow on a timed drill: no credit
    expect(p.skills.imagery.highs).toBe(0);
    applySessionLevel(p, 'imagery', 0.3, true); applySessionLevel(p, 'imagery', 0.3, true);
    expect(p.skills.imagery.level).toBe(1);
  });
  it('R3 flags remediation when average stays below 60%', () => {
    const p = newProfile('t', 'key');
    for (let i = 0; i < 3; i++) updateSkill(p, 'faces', res(0.4), 'practice');
    expect(p.skills.faces.remediate).toBe(true);
  });
  it('R4 switches explanation only after the same error type repeats across 2 drills', () => {
    const p = newProfile('t', 'key');
    updateSkill(p, 'palace', res(0.6), 'practice');
    expect(p.skills.palace.altExplain).toBe(null);
    updateSkill(p, 'palace', res(0.8), 'practice');
    expect(p.skills.palace.altExplain).toBe('omission');
  });
  it('guided drills never change skill estimates', () => {
    const p = newProfile('t', 'key');
    const s = buildSession(p, 'free', { spec: { t: 'wordlist', n: 10, s: 60 } });
    applyDrill(p, s, { ...s.steps[0], role: 'guided' }, res(1), {});
    expect(p.skills.imagery.attempts).toBe(0);
  });
  it('mastery needs delayed recall: high practice alone stops at Practiced', () => {
    const s = { attempts: 5, level: 2, avg: 0.95, probes: [] };
    expect(computeMastery(s, true)).toBe(2);
    s.probes = [{ delay: 1, score: 0.9, acc: 0.9 }];
    expect(computeMastery(s, false)).toBe(3);
    expect(computeMastery({ ...s, level: 1 }, false)).toBe(2); // must have earned a level up first
    s.probes.push({ delay: 7, score: 0.85, acc: 0.85 });
    expect(computeMastery(s, false)).toBe(3);
    expect(computeMastery(s, true)).toBe(4);
  });
  it('R6 demotes mastery when recent probes fail', () => {
    const s = { attempts: 5, level: 2, avg: 0.95, probes: [{ delay: 1, score: 0.9 }, { delay: 7, score: 0.3 }, { delay: 7, score: 0.4 }, { delay: 30, score: 0.5 }] };
    expect(computeMastery(s, true)).toBe(2);
  });
});

describe('spaced probes (R5)', () => {
  it('schedules at 1, 7, 30 days and resets on failure', () => {
    const p = newProfile('t', 'key');
    const step = { role: 'practice', skill: 'imagery', spec: { t: 'wordlist', n: 5 }, items: [{ answer: 'a' }] };
    const set = storeSet(p, step, res(0.8));
    expect(dueSets(p).length).toBe(0);
    p.progress.dayOffset = 1;
    expect(dueSets(p).length).toBe(1);
    applyProbe(p, set, res(0.8));
    expect(daysBetween(set.created, set.due)).toBe(7);
    p.progress.dayOffset = 7;
    applyProbe(p, set, res(0.2));
    expect(set.idx).toBe(0); expect(daysBetween(set.created, set.due)).toBe(1);
  });
  it('a weak first score cannot make a weak probe pass (audit H4)', () => {
    const p = newProfile('t', 'key');
    const set = storeSet(p, { role: 'practice', skill: 'imagery', spec: { t: 'wordlist', n: 10 }, items: [] }, res(0.1));
    p.progress.dayOffset = 1;
    const out = applyProbe(p, set, res(0.1));
    expect(out.pass).toBe(false); expect(out.ratio).toBeCloseTo(0.2);
  });
});

describe('sessions and progression', () => {
  it('day 1 is the baseline; curriculum advances once per calendar day', () => {
    const p = newProfile('t', 'key');
    expect(sessionStatus(p).type).toBe('baseline');
    const s = buildSession(p, 'baseline');
    expect(s.steps.filter((x) => x.role === 'baseline').length).toBe(3);
    p.inProgress = { session: s };
    for (const st of s.steps.filter((x) => x.kind === 'drill')) applyDrill(p, s, st, res(0.5, st.items.length), { studyMs: 1000 });
    finalizeSession(p, s, [], null);
    expect(p.progress.day).toBe(2);
    finalizeSession(p, buildSession(p, 'full'), [], null);
    expect(p.progress.day).toBe(2);
  });
  it('quarterly assessments repeat the day-1 battery at the same length', () => {
    const p = newProfile('t', 'key'); p.progress.baselineDone = true; p.progress.day = 91;
    const s = buildSession(p, 'assessment');
    const bat = s.steps.filter((x) => x.battery);
    expect(bat.map((x) => x.items.length)).toEqual([15, 12, 5]);
  });
  it('early full sessions are padded toward 30 minutes', () => {
    const p = newProfile('t', 'key'); p.progress.baselineDone = true; p.progress.day = 2;
    expect(estimateMinutes(buildSession(p, 'full'))).toBeGreaterThanOrEqual(15);
  });
  it('day 7 is an assessment, the module end is a gate', () => {
    const p = newProfile('t', 'key'); p.progress.baselineDone = true;
    p.progress.day = 7; expect(sessionStatus(p).type).toBe('assessment');
    p.progress.day = 28; expect(sessionStatus(p).type).toBe('gate');
  });
  it('gate pass records the module; fail schedules retry in 3 days', () => {
    const p = newProfile('t', 'key'); p.progress.baselineDone = true; p.progress.day = 28;
    const s = buildSession(p, 'gate');
    finalizeSession(p, s, [{ role: 'gate', acc: 0.5 }], null);
    expect(p.progress.gates).toEqual([]); expect(p.progress.gateRetry.M1).toBeTruthy();
    const s2 = buildSession(p, 'gateRetry', { mod: MODULES[0] });
    finalizeSession(p, s2, [{ role: 'gate', acc: 0.9 }], null);
    expect(p.progress.gates).toEqual(['M1']);
  });
  it('free practice Lumen is capped at 50 per day', () => {
    const p = newProfile('t', 'key');
    const s = buildSession(p, 'free', { spec: { t: 'wordlist', n: 10, s: 60 } });
    for (let i = 0; i < 10; i++) applyDrill(p, s, { ...s.steps[0] }, res(1), {});
    expect(p.progress.freeXp.xp).toBe(50);
  });
});

describe('scores, streaks, rank', () => {
  it('MTS is null without evidence and bounded 0..1000', () => {
    expect(mts({ accuracy: null, retention: null, speed: null, mastery: null, transfer: null })).toBe(null);
    expect(mts({ accuracy: 100, retention: 100, speed: 100, mastery: 100, transfer: 100 })).toBe(1000);
    expect(mts({ accuracy: 50, retention: null, speed: null, mastery: 50, transfer: 50 })).toBe(500);
  });
  it('streak tolerates one rest day per week', () => {
    const p = newProfile('t', 'key');
    const t0 = p.progress.startDate;
    p.progress.trainingDates = [0, 1, 2, 4, 5, 6].map((d) => addDays(t0, d));
    p.progress.dayOffset = 6;
    expect(streaks(p).current).toBe(6);
    p.progress.trainingDates = [0, 2, 4].map((d) => addDays(t0, d));
    p.progress.dayOffset = 4;
    expect(streaks(p).current).toBe(1); // second rest within 7 days breaks the run
  });
  it('rank grows with the square root of Lumen', () => {
    expect(rankOf(0).rank).toBe(1); expect(rankOf(50).rank).toBe(2); expect(rankOf(200).rank).toBe(3);
  });
});

describe('export and import', () => {
  it('round-trips and detects tampering', () => {
    const p = newProfile('Ayaan', 'key');
    const txt = buildExport(p);
    const r = parseImport(txt);
    expect(r.ok).toBe(true); expect(r.warning).toBe(null); expect(r.profile.user.alias).toBe('Ayaan');
    const tampered = JSON.parse(txt); tampered.profile.progress.lumen = 99999;
    expect(parseImport(JSON.stringify(tampered)).warning).toBeTruthy();
    expect(parseImport('{"app":"other"}').ok).toBe(false);
    expect(parseImport('not json').ok).toBe(false);
    const broken = JSON.parse(txt); broken.profile.progress = { day: 'x' };
    expect(parseImport(JSON.stringify(broken)).ok).toBe(false); // audit C1
    const badSkill = JSON.parse(txt); badSkill.profile.skills.palace.level = 99;
    expect(parseImport(JSON.stringify(badSkill)).ok).toBe(false);
  });
});

describe('round 2 audit regressions', () => {
  it('discarding a gate attempt still blocks retry for 3 days and caps later Lumen (N1, N2)', async () => {
    const { abandonSession } = await import('../src/engine/progress.js');
    const p = newProfile('t', 'key'); p.progress.baselineDone = true; p.progress.day = 28;
    p.inProgress = { session: buildSession(p, 'gate'), idx: 3, results: [{ role: 'gate', skill: 'linking', acc: 0, speedOk: true }], events: [] };
    abandonSession(p);
    expect(p.progress.gateRetry.M1).toBeTruthy();
    expect(sessionStatus(p).type).not.toBe('gate');
    const again = buildSession(p, 'full');
    expect(again.repeatToday).toBe(true);
  });
  it('the day-1 battery runs on quarterly gate days 91, 182, 273, 364 (N3)', () => {
    for (const d of [91, 182, 273, 364]) {
      const p = newProfile('t', 'key'); p.progress.baselineDone = true; p.progress.day = d;
      const s = buildSession(p);
      expect(s.steps.filter((x) => x.battery).length).toBe(3);
    }
  });
  it('rejects malformed probe history and freeXp (N5, N6)', () => {
    const txt = buildExport(newProfile('a', 'key'));
    const a = JSON.parse(txt); a.profile.skills.imagery.probes = [null];
    expect(parseImport(JSON.stringify(a)).ok).toBe(false);
    const b = JSON.parse(txt); b.profile.progress.freeXp = 5;
    expect(parseImport(JSON.stringify(b)).ok).toBe(false);
  });
});

describe('v0.2 story and quests', async () => {
  const { CHAPTERS, BEATS, SIDE_QUESTS, CODEX, CHARACTERS, GATE_INTROS, tell } = await import('../src/data/story.js');
  const { evaluateSideQuests, sideQuestState, codexFor, charactersFor } = await import('../src/engine/quests.js');
  it('has a full story: prologue + 12 chapters, 52 beats, 12 gate encounters, 24 side quests', () => {
    expect(Object.keys(CHAPTERS).length).toBe(13);
    for (const ch of Object.values(CHAPTERS)) { expect(ch.text.length).toBeGreaterThanOrEqual(6); expect(ch.quest).toBeTruthy(); }
    expect(Object.keys(BEATS).length).toBe(52);
    expect(Object.keys(GATE_INTROS).length).toBe(12);
    expect(new Set(SIDE_QUESTS.map((q) => q.id)).size).toBe(25);
    for (const e of CODEX) if (e.unlock.startsWith('side:')) expect(SIDE_QUESTS.some((q) => q.id === e.unlock.slice(5))).toBe(true);
    for (const w of WEEKS) expect(w.lesson.length).toBeGreaterThanOrEqual(1);
  });
  it('side quests open with their month and complete only on real performance', () => {
    const p = newProfile('Ayaan', 'key');
    const walls = SIDE_QUESTS.find((q) => q.id === 'm2_walls');
    p.palaces.push({ id: 'x', name: 'Home', loci: Array.from({ length: 12 }, (_, i) => 'stop ' + i) });
    expect(sideQuestState(p, walls)).toBe('locked');
    expect(evaluateSideQuests(p).length).toBe(0); // month 2 not reached yet
    p.progress.day = 29;
    expect(evaluateSideQuests(p).map((q) => q.id)).toContain('m2_walls');
    expect(sideQuestState(p, walls)).toBe('done');
  });
  it('lore and characters reveal progressively; twists stay hidden early', () => {
    const p = newProfile('Ayaan', 'key');
    expect(codexFor(p).filter((e) => e.open).length).toBe(4);
    const wren = charactersFor(p).find((c) => c.id === 'wren');
    expect(wren.visible.length).toBe(1);
    expect(charactersFor(p).some((c) => c.id === 'sevrin')).toBe(false);
    p.progress.gates = MODULES.map((m) => m.id);
    // 1.1: the Seam's four foreshadowing entries also open at gates (M1, M5, M6, M9)
    expect(codexFor(p).filter((e) => e.open).length).toBe(CODEX.filter((e) => !e.unlock.startsWith('side:') && !e.unlock.startsWith('trial:')).length + 4);
    expect(tell('Hello {name}', p)).toBe('Hello Ayaan');
  });
});
