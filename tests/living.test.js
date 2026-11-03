// 1.1 The Living World: Long Vigil, Brambles, Cabinet of Voices, Mirror Room, Wren's Audit and pedestals.
import { describe, it, expect } from 'vitest';
import { newProfile, today, applyProbe } from '../src/engine/core.js';
import { addDays } from '../src/engine/util.js';
import { migrate, buildExport, parseImport, validateProfile } from '../src/store.js';
import { pullVigilEntries, newVigil, vigilOffer, settleVigil, endBand, lanternState, bucketOf, canKeepVigil, VIGIL_GAP } from '../src/engine/vigil.js';
import { answer, current, skip, skip as skipTurn } from '../src/engine/battle.js';
import { noteProbe, activeThorns, burnedThorns, keepNote, chestState, openChest, thornCounts, districtOfSkill } from '../src/engine/brambles.js';
import { voiceFor, cabinet, afterLine, topError, voicesMode } from '../src/engine/voices.js';
import { mistState, relight, litSkills } from '../src/engine/mirror.js';
import { beatsFor, falseUnlocked, errorTypes, isFixed, finishAudit, habitOf, introFor } from '../src/engine/audit.js';
import { AUDIT_ROUTES, AUDIT_LORE } from '../src/data/audit.js';
import { VIGIL_SCENE, PHANTOM_LINES, LANTERN_LIT } from '../src/data/vigil.js';
import { VOICES, VOICE_ORDER } from '../src/data/voices.js';
import { MIRROR_ATTRS } from '../src/data/mirror.js';
import { codexFor } from '../src/engine/quests.js';
import { earnedItems, fadedRelics } from '../src/engine/collect.js';
import { majorDecode } from '../src/engine/util.js';
import { ITEM_BY_ID } from '../src/data/items.js';
import { SKILLS } from '../src/data/curriculum.js';

const WORDS = ['anchor', 'apple', 'arrow', 'basket', 'candle', 'drum', 'eagle', 'fork', 'glove', 'hammer'];
function prof() {
  const p = newProfile('t', 'key');
  const t = today(p);
  p.progress.gates = ['M1', 'M2'];
  const mk = (id, skill, tpl, items, age, extra = {}) => ({ id, skill, t: tpl, spec: { t: tpl }, items, loci: null, created: addDays(t, -age), immediate: 0.9, idx: 0, intervals: [1, 7, 30], history: [], retired: false, due: addDays(t, 1), ...extra });
  p.sets.push(mk('a1', 'imagery', 'pairs', WORDS.slice(0, 5).map((w, i) => ({ cue: WORDS[i + 5], answer: w })), 1));
  p.sets.push(mk('a7', 'linking', 'chain', WORDS.map((w) => ({ answer: w })), 7));
  p.sets.push(mk('a30', 'vocab', 'vocab', [{ cue: 'maji', answer: 'water' }, { cue: 'moto', answer: 'fire' }, { cue: 'jua', answer: 'sun' }, { cue: 'mwezi', answer: 'moon' }], 30));
  p.sets.push(mk('a8', 'palace', 'palace', WORDS.slice(0, 5).map((w) => ({ answer: w })), 8, { loci: ['door', 'hall', 'stairs', 'attic', 'cellar'] }));
  return p;
}
const snap = (p) => JSON.stringify({ skills: p.skills, results: p.results, sets: p.sets });

describe('the Long Vigil', () => {
  it('is a sixth scene that opens at gate M2 and is not in the made-up scene list', () => {
    expect(VIGIL_SCENE.gate).toBe('M2'); expect(VIGIL_SCENE.study).toBe(0);
    expect(bucketOf(1)).toBe(1); expect(bucketOf(7)).toBe(7); expect(bucketOf(30)).toBe(30);
    const p = prof(); p.progress.gates = ['M1'];
    expect(canKeepVigil(p)).toBe(false);
    p.progress.gates = ['M1', 'M2'];
    expect(canKeepVigil(p)).toBe(true);
  });
  it('pulls the player own old items, mixing 1, 7 and 30 day groups, deterministically', () => {
    const p = prof();
    const e = pullVigilEntries(p, 3);
    expect(e.length).toBeGreaterThanOrEqual(5);
    expect(new Set(e.map((x) => x.bucket))).toEqual(new Set([1, 7, 30]));
    for (const x of e) { expect(x.age).toBeGreaterThanOrEqual(1); expect(p.sets.some((s) => s.id === x.setId)).toBe(true); }
    expect(pullVigilEntries(p, 3).map((x) => x.key)).toEqual(e.map((x) => x.key));
    for (const s of p.sets) s.created = today(p);
    expect(pullVigilEntries(p, 3)).toEqual([]);
  });
  it('is offered about once a week and can be put off', () => {
    const p = prof(); const t = today(p);
    expect(vigilOffer(p)).toBeTruthy();
    p.battles.vigil = { done: 1, last: addDays(t, -(VIGIL_GAP - 1)), skipped: null, ledger: null, ledgers: 0 };
    expect(vigilOffer(p)).toBeNull();
    p.battles.vigil.last = addDays(t, -VIGIL_GAP);
    expect(vigilOffer(p)).toBeTruthy();
    p.battles.vigil.skipped = t;
    expect(vigilOffer(p)).toBeNull();
  });
  it('never fails: a miss dims a lantern and the vigil still ends', () => {
    const p = prof();
    const b = newVigil(pullVigilEntries(p, 2));
    let guard = 0;
    while (!b.over && guard++ < 200) answer(b, 'zzz nothing');
    expect(b.over).toBe(true);
    expect(b.outcome).toBe('won');
    expect(b.entries.every((e) => lanternState(b, e) === 'dim')).toBe(true);
    expect(endBand(b).band).toBe('few');
  });
  it('lights lanterns for right answers and gives the Ledger only for items held at 7 or 30 days', () => {
    const p = prof();
    const before = snap(p);
    const b = newVigil(pullVigilEntries(p, 2));
    let guard = 0;
    while (!b.over && guard++ < 200) { const e = current(b); answer(b, e.kind === 'face' ? e.answer : e.answer); }
    expect(endBand(b).band).toBe('all');
    const r = settleVigil(p, b);
    expect(r.ledger).toBe(true);
    expect(p.battles.vigil.ledger).toBe(today(p));
    expect(earnedItems(p)).toContain('vg_watch_ledger');
    expect(ITEM_BY_ID.vg_watch_ledger.name).toBe('The Watch Ledger');
    expect(p.progress.lumen).toBe(0);
    expect(snap(p)).toBe(before); // skill estimates, results and review sets untouched
    expect(p.battles.history.at(-1).mode).toBe('vigil');
    expect(settleVigil(p, newVigil(pullVigilEntries(p, 2))).ledger).toBe(false); // one Ledger only
  });
  it('gives no Ledger when only new items held, and queues misses for a later Echo', () => {
    const p = prof();
    const e = pullVigilEntries(p, 2).filter((x) => x.age < 7);
    expect(e.length).toBeGreaterThan(0);
    const b = newVigil(e);
    let guard = 0;
    while (!b.over && guard++ < 200) answer(b, current(b).answer);
    expect(settleVigil(p, b).ledger).toBe(false);
    const q = prof();
    const b2 = newVigil(pullVigilEntries(q, 2));
    skipTurn(b2);
    answer(b2, 'no'); answer(b2, 'no'); answer(b2, 'no');
    let g2 = 0; while (!b2.over && g2++ < 200) answer(b2, 'no');
    settleVigil(q, b2);
    expect(q.battles.queue.length).toBeGreaterThan(0);
  });
  it('lines are plain and have no dashes', () => {
    for (const s of [...PHANTOM_LINES.arrive, ...LANTERN_LIT, VIGIL_SCENE.intro]) expect(s).not.toMatch(/[—–]/);
  });
});

describe('Lethe Brambles', () => {
  const probeResult = (items, okIdx) => ({ n: items.length, correct: okIdx.length, acc: okIdx.length / items.length, errs: {}, perItem: items.map((it, i) => ({ target: it.answer, ok: okIdx.includes(i), response: '' })) });
  it('records a thorn for a slipped item and burns it only on a later day when recalled correctly', () => {
    const p = prof(); const t = today(p); const set = p.sets[0];
    noteProbe(p, set, probeResult(set.items, [0, 1, 2]));
    const th = activeThorns(p);
    expect(th.length).toBe(2);
    expect(th[0].district).toBe(districtOfSkill(p, 'imagery'));
    // the same day, even a correct answer does not burn it
    noteProbe(p, set, probeResult(set.items, [0, 1, 2, 3, 4]));
    expect(activeThorns(p).length).toBe(2);
    // a later day burns it
    for (const x of Object.values(p.brambles.thorns)) x.born = addDays(t, -1);
    noteProbe(p, set, probeResult(set.items, [0, 1, 2, 3]));
    expect(activeThorns(p).length).toBe(1);
    expect(burnedThorns(p).length).toBe(1);
  });
  it('a note earns nothing and does not remove the thorn', () => {
    const p = prof(); const set = p.sets[0];
    noteProbe(p, set, probeResult(set.items, [0, 1, 2, 3]));
    const [th] = activeThorns(p);
    const lumen = p.progress.lumen;
    expect(keepNote(p, th.key, 'a big blue anchor that sings')).toBe(true);
    expect(activeThorns(p).length).toBe(1);
    expect(p.progress.lumen).toBe(lumen);
    expect(keepNote(p, th.key, '   ')).toBe(false);
  });
  it('guards an optional chest that frees only once its thorns are gone', () => {
    const p = prof(); const t = today(p); const set = p.sets[0];
    noteProbe(p, set, probeResult(set.items, [0, 1, 2, 3]));
    const d = activeThorns(p)[0].district;
    expect(chestState(p, d)).toBe('guarded');
    for (const x of Object.values(p.brambles.thorns)) x.born = addDays(t, -1);
    noteProbe(p, set, probeResult(set.items, [0, 1, 2, 3, 4]));
    expect(chestState(p, d)).toBe('free');
    expect(openChest(p, d)).toBe(true);
    expect(chestState(p, d)).toBe('opened');
    expect(thornCounts(p)).toEqual({});
  });
  it('the real probe path records thorns and leaves skill estimates alone', () => {
    const p = prof(); const set = p.sets[0];
    const res = { n: 5, correct: 2, acc: 0.4, errs: { omission: 3, substitution: 0, order: 0, timeout: 0 }, perItem: set.items.map((it, i) => ({ target: it.answer, ok: i < 2, err: 'omission' })) };
    applyProbe(p, set, res);
    noteProbe(p, set, res);
    expect(activeThorns(p).length).toBe(3);
  });
});

describe('Cabinet of Voices', () => {
  it('has seven voices with lines for every case and no dashes', () => {
    expect(VOICE_ORDER.length).toBe(7);
    for (const s of VOICE_ORDER) {
      const v = VOICES[s];
      expect(v.hints.length).toBeGreaterThanOrEqual(3); expect(v.after.length).toBe(3); expect(v.quiet.length).toBeGreaterThanOrEqual(3);
      expect(Object.keys(v.byError).sort()).toEqual(['omission', 'order', 'substitution']);
      expect(JSON.stringify(v)).not.toMatch(/[—–]/);
    }
  });
  it('defaults to Light and follows the setting', () => {
    const p = prof();
    expect(voicesMode(p)).toBe('light');
    p.user.prefs.voices = 'off'; expect(voicesMode(p)).toBe('off');
    p.user.prefs.voices = 'full'; expect(voicesMode(p)).toBe('full');
  });
  it('speaks from the real error type and goes quiet when a review is due', () => {
    const p = prof();
    p.skills.imagery.errs = { omission: 1, substitution: 6, order: 0, timeout: 0 };
    p.skills.imagery.recentErrs = [{ substitution: 3 }];
    expect(topError(p, 'imagery')).toBe('substitution');
    const v = voiceFor(p, 'imagery');
    expect(v.kind).toBe('error'); expect(v.line).toBe(VOICES.imagery.byError.substitution);
    p.sets[0].due = today(p);
    const q = voiceFor(p, 'imagery');
    expect(q.kind).toBe('quiet'); expect(VOICES.imagery.quiet).toContain(q.line);
    expect(cabinet(p).length).toBe(7);
  });
  it('after lines are warm in all three bands and never contain an answer', () => {
    for (const acc of [1, 0.7, 0.2]) expect(afterLine('palace', acc).line.length).toBeGreaterThan(10);
    expect(afterLine('palace', 1).line).toBe(VOICES.palace.after[0]);
    expect(afterLine('palace', 0.2).line).toBe(VOICES.palace.after[2]);
  });
});

describe('Mirror Room and Phantom Limb', () => {
  it('every attribute has a Major System code its own example decodes to', () => {
    for (const [k, a] of Object.entries(MIRROR_ATTRS)) { expect(SKILLS[k]).toBeTruthy(); expect(majorDecode(a.example)).toBe(a.code); }
  });
  it('the mist starts once the Major gate is passed, during a gate session or a started trial', () => {
    const p = prof();
    expect(mistState(p).up).toBe(false);
    p.progress.gates = ['M1', 'M2', 'M3', 'M4'];
    expect(mistState(p).up).toBe(false);
    p.trials.catacombs = { start: today(p), due: addDays(today(p), 1), step: 0, seed: 1 };
    const m = mistState(p);
    expect(m.up).toBe(true); expect(m.why).toBe('trial');
  });
  it('relights an attribute for any word with the right sounds and never changes skills', () => {
    const p = prof(); p.progress.gates = ['M1', 'M2', 'M3', 'M4'];
    p.trials.catacombs = { start: today(p), due: addDays(today(p), 1), step: 0, seed: 1 };
    const ep = mistState(p).episode;
    const before = JSON.stringify(p.skills);
    expect(relight(p, 'imagery', 'night', ep).ok).toBe(true);
    expect(relight(p, 'linking', 'banana', ep).ok).toBe(false);
    expect(litSkills(p, ep)).toEqual(['imagery']);
    expect(litSkills(p, 'other episode')).toEqual([]);
    expect(JSON.stringify(p.skills)).toBe(before);
  });
});

describe("Wren's Audit", () => {
  it('has three routes with one slip of each kind and facts on real items', () => {
    expect(AUDIT_ROUTES.length).toBe(3);
    for (const r of AUDIT_ROUTES) {
      const types = r.walk.map((w) => w.type).filter(Boolean);
      for (const t of ['omission', 'substitution', 'order', 'false']) expect(types).toContain(t);
      for (const s of r.stops) if (s.real) expect(s.fact.length).toBeGreaterThan(10);
      expect(JSON.stringify(r)).not.toMatch(/[—–]/);
    }
  });
  it('the false-memory slip starts from Month 9', () => {
    const p = prof();
    expect(falseUnlocked(p)).toBe(false);
    expect(errorTypes(p).map((t) => t.id)).not.toContain('false');
    const r = AUDIT_ROUTES[0];
    const before = beatsFor(r, p);
    expect(before.some((b) => b.type === 'false')).toBe(false);
    p.progress.day = 35 * 7 - 6;
    expect(falseUnlocked(p)).toBe(true);
    const after = beatsFor(r, p);
    expect(after.length).toBe(before.length + 1);
    expect(after.some((b) => b.type === 'false')).toBe(true);
  });
  it('order slips are one beat with the right fix, and answers are checked tolerantly', () => {
    const p = prof(); p.progress.day = 300;
    for (const r of AUDIT_ROUTES) {
      for (const b of beatsFor(r, p)) if (b.type) { expect(b.answer).toBeTruthy(); expect(isFixed(b, b.answer.toUpperCase())).toBe(true); expect(isFixed(b, '')).toBe(false); }
      expect(beatsFor(r, p).filter((b) => b.type === 'order').every((b) => b.lines.length === 2)).toBe(true);
    }
  });
  it('Wren makes the slip you make most, and finishing opens lore without changing scores', () => {
    const p = prof();
    expect(habitOf(p)).toBe('general');
    p.skills.palace.errs.order = 9;
    expect(habitOf(p)).toBe('order');
    expect(introFor(p)).toMatch(/Right things, wrong places/);
    const before = snap(p);
    expect(codexFor(p).filter((e) => e.id.startsWith('lore_audit') && e.open).length).toBe(0);
    finishAudit(p);
    expect(codexFor(p).filter((e) => e.id.startsWith('lore_audit') && e.open).length).toBe(1);
    finishAudit(p); finishAudit(p);
    expect(AUDIT_LORE.every((e) => codexFor(p).find((x) => x.id === e.id).open || e.unlock !== 'audit:3')).toBe(true);
    expect(snap(p)).toBe(before);
  });
});

describe('pedestals', () => {
  it('a slipped delayed recall dims the district relic, and the existing calm repair lights it again', () => {
    const p = prof(); p.progress.gates = ['M1'];
    expect(fadedRelics(p)).toEqual([]);
    p.skills.imagery.probes = [{ date: today(p), delay: 7, score: 0.3, acc: 0.3 }];
    expect(fadedRelics(p).length).toBe(1);
  });
});

describe('saving and importing the new records', () => {
  it('a fresh profile has the new records and settings defaults', () => {
    const p = newProfile('t', 'key');
    expect(p.user.prefs.brambles).toBe(true); expect(p.user.prefs.voices).toBe('light');
    expect(p.brambles).toEqual({ thorns: {}, chests: {} }); expect(p.mirror.lit).toEqual({}); expect(p.audit.done).toBe(0);
    expect(validateProfile(p)).toBeNull();
  });
  it('an old save gains them on migration', () => {
    const p = newProfile('t', 'key');
    delete p.brambles; delete p.mirror; delete p.audit; delete p.user.prefs.brambles; delete p.user.prefs.voices;
    migrate(p);
    expect(p.brambles.thorns).toEqual({}); expect(p.audit.done).toBe(0); expect(p.user.prefs.voices).toBe('light'); expect(p.user.prefs.brambles).toBe(true);
  });
  it('round-trips real records through export and import', () => {
    const p = prof(); const set = p.sets[0];
    noteProbe(p, set, { perItem: set.items.map((it, i) => ({ target: it.answer, ok: i > 1 })) });
    keepNote(p, activeThorns(p)[0].key, 'a loud green anchor');
    p.mirror = { episode: 'trial:catacombs:2026-11-02', lit: { imagery: today(p) } };
    p.audit = { done: 2, last: today(p) };
    p.battles.vigil = { done: 1, last: today(p), skipped: null, ledger: today(p), ledgers: 1 };
    p.user.prefs.voices = 'full'; p.user.prefs.brambles = false;
    const r = parseImport(buildExport(p));
    expect(r.ok).toBe(true);
    expect(r.profile.brambles.thorns).toEqual(p.brambles.thorns);
    expect(r.profile.audit.done).toBe(2); expect(r.profile.battles.vigil.ledger).toBe(today(p)); expect(r.profile.user.prefs.voices).toBe('full');
  });
  it('rejects damaged records', () => {
    const bad = (fn) => { const p = prof(); fn(p); return validateProfile(p); };
    expect(bad((p) => { p.user.prefs.voices = 'loud'; })).toMatch(/Voices/);
    expect(bad((p) => { p.brambles = { thorns: { k: { set: 'a', target: 'x', skill: 'nope', born: '2026-01-01' } } }; })).toMatch(/Bramble/);
    expect(bad((p) => { p.mirror = { lit: { imagery: 'yesterday' } }; })).toMatch(/Mirror/);
    expect(bad((p) => { p.audit = { done: -1 }; })).toMatch(/Audit/);
    expect(bad((p) => { p.battles.vigil = { done: 'x' }; })).toMatch(/Vigil/);
  });
});
