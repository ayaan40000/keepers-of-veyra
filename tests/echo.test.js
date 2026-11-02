import { describe, it, expect } from 'vitest';
import { newProfile, today } from '../src/engine/core.js';
import { addDays } from '../src/engine/util.js';
import { migrate, buildExport, parseImport, validateProfile } from '../src/store.js';
import { pullEntries, newBattle, answer, current, skip, useHint, aids, settle, summarize, echoOffer, buildScene, techniqueResult, leave, RESOLVE, BATTLE_LUMEN_CAP, MAX_RETRIES, isRight } from '../src/engine/battle.js';
import { attributes, classOf, options, equip, equipOf, effects, dollSpec } from '../src/engine/character.js';
import { keeperSprite, forgettingSprite } from '../src/pixel/keeper.js';
import { SCENES, SCENE_ORDER, COACHES, ECHO_BEAT, ECHO_HOOK, ECHO_HONEST } from '../src/data/echo.js';
import { CODEX } from '../src/data/lore.js';
import { SKILLS } from '../src/data/curriculum.js';

const WORDS = ['anchor', 'apple', 'arrow', 'basket', 'candle', 'drum', 'eagle', 'fork'];
function withSets() {
  const p = newProfile('t', 'key');
  const t = today(p);
  p.progress.gates = ['M1'];
  const mk = (id, skill, tpl, items, extra = {}) => ({ id, skill, t: tpl, spec: { t: tpl }, items, loci: null, created: addDays(t, -10), immediate: 0.9, idx: 0, intervals: [1, 7, 30], history: [{ date: addDays(t, -3), acc: 1, ratio: 1, delay: 7, pass: true }], retired: false, due: addDays(t, -1), ...extra });
  p.sets.push(mk('s1', 'imagery', 'pairs', WORDS.slice(0, 4).map((w, i) => ({ cue: WORDS[i + 4], answer: w }))));
  p.sets.push(mk('s2', 'linking', 'chain', WORDS.map((w) => ({ answer: w }))));
  p.sets.push(mk('s3', 'palace', 'palace', WORDS.slice(0, 5).map((w) => ({ answer: w })), { loci: ['door', 'hall', 'stairs', 'attic', 'cellar'], created: addDays(t, -40) }));
  p.sets.push(mk('s4', 'vocab', 'vocab', [{ cue: 'maji', answer: 'water' }, { cue: 'moto', answer: 'fire' }, { cue: 'jua', answer: 'sun' }]));
  return p;
}
const snap = (p) => JSON.stringify({ skills: p.skills, results: p.results, sets: p.sets });

describe('echo battles: pulling items', () => {
  it('uses only the stored sets, at least a day old, mixing skills', () => {
    const p = withSets();
    const e = pullEntries(p, 7);
    expect(e.length).toBeGreaterThanOrEqual(5);
    expect(new Set(e.map((x) => x.skill)).size).toBeGreaterThanOrEqual(3);
    for (const x of e) { expect(x.age).toBeGreaterThanOrEqual(1); expect(x.reason).toMatch(/learned \d+ days? ago/i); expect(p.sets.some((s) => s.id === x.setId)).toBe(true); }
    expect(pullEntries(p, 7).map((x) => x.key)).toEqual(e.map((x) => x.key)); // deterministic for a seed
  });
  it('never offers brand-new material', () => {
    const p = withSets();
    for (const s of p.sets) s.created = today(p);
    expect(pullEntries(p, 3)).toEqual([]);
    expect(echoOffer(p)).toBeNull();
  });
  it('weights older items higher and old items hit twice as hard', () => {
    const e = pullEntries(withSets(), 5, 20);
    expect(e.find((x) => x.setId === 's3').d).toBe(2);
    expect(e.find((x) => x.setId === 's1').d).toBe(1);
  });
  it('is offered only after the first gate, once a day, and can be put off', () => {
    const p = withSets(); const t = today(p);
    p.progress.gates = [];
    expect(echoOffer(p)).toBeNull();
    p.progress.gates = ['M1'];
    expect(echoOffer(p)).toBeTruthy();
    p.battles.skipped = t;
    expect(echoOffer(p)).toBeNull();
    p.battles.skipped = null; p.battles.last = addDays(t, -1);
    expect(echoOffer(p)).toBeNull(); // early players: every third day
  });
});

describe('echo battles: the fight', () => {
  const fight = (p) => newBattle(pullEntries(p, 3, 6));
  it('right answers deal fixed damage and a hint halves it', () => {
    const b = fight(withSets());
    const e = current(b);
    const hp = b.hp;
    useHint(b);
    const r = answer(b, e.answer);
    expect(r.ok).toBe(true);
    expect(r.damage).toBe(e.d / 2);
    expect(b.hp).toBe(hp - e.d / 2);
    const e2 = current(b);
    expect(answer(b, e2.answer).damage).toBe(e2.d);
  });
  it('a miss costs 1 Resolve, shows the answer, and the item is asked again later (two retries at most)', () => {
    const b = fight(withSets());
    const e = current(b);
    const r = answer(b, 'zzzzzz');
    expect(r.ok).toBe(false); expect(r.answer).toBe(e.answer); expect(b.resolve).toBe(RESOLVE - 1);
    expect(b.line).toContain(e.key);
    let guard = 0;
    while (!b.over && guard++ < 50) { const c = current(b); answer(b, c.key === e.key ? 'zzzzzz' : c.answer); }
    expect(b.state[e.key].tries).toBe(MAX_RETRIES + 1);
    expect(b.state[e.key].status).toBe('queued');
    expect(b.resolve).toBe(RESOLVE - 1); // retries cost nothing
    expect(b.outcome).toBe('won');
  });
  it('running out of Resolve ends gently and queues what is left', () => {
    const p = withSets(); const b = fight(p);
    let guard = 0;
    while (!b.over && guard++ < 30) answer(b, 'zzzzzz');
    expect(b.outcome).toBe('rest'); expect(b.resolve).toBe(0);
    const s = summarize(b);
    expect(s.queued.length).toBeGreaterThan(0);
    const out = settle(p, b);
    expect(out.lumen).toBe(0);
    expect(p.battles.queue.length).toBe(s.queued.length);
    expect(p.battles.rests).toBe(1);
  });
  it('allows one skip, with no penalty, and leaving costs nothing', () => {
    const b = fight(withSets());
    expect(skip(b)).toBe(true); expect(b.resolve).toBe(RESOLVE);
    expect(skip(b)).toBe(false);
    leave(b);
    expect(b.outcome).toBe('left');
  });
  it('the Lantern gives a letter and one more try at half damage, no Resolve lost', () => {
    const b = newBattle(pullEntries(withSets(), 3, 6), { letters: true });
    const e = current(b);
    const r = answer(b, 'zzzzzz');
    expect(r.lantern).toBe(true); expect(r.letter).toContain(e.answer[0].toUpperCase()); expect(b.resolve).toBe(RESOLVE);
    const r2 = answer(b, e.answer);
    expect(r2.ok).toBe(true); expect(r2.damage).toBe(e.d / 2); expect(r2.status).toBe('eased');
  });
  it('gear never shows an answer: Scroll shows a count, Map shows stop names only', () => {
    const p = withSets();
    const b = newBattle(pullEntries(p, 3, 20), { count: true, stops: true });
    let sawCount = false, sawStops = false;
    for (let g = 0; g < 40 && !b.over; g++) {
      const e = current(b); const a = aids(b);
      expect(JSON.stringify(a)).not.toContain(`"${e.answer}"`);
      if (a.count) sawCount = true;
      if (a.emptyStops) { sawStops = true; expect(a.emptyStops).not.toContain(e.answer); }
      answer(b, e.answer);
    }
    expect(sawCount || sawStops).toBe(true);
  });
  it('rewards only old items that held on the first try; capped; inside the daily free cap', () => {
    const p = withSets();
    const b = newBattle(pullEntries(p, 3, 7));
    while (!b.over) answer(b, current(b).answer);
    const s = summarize(b);
    expect(s.held).toBe(b.entries.length);
    expect(s.lumenRaw).toBeLessThanOrEqual(BATTLE_LUMEN_CAP);
    const before = p.progress.lumen;
    const out = settle(p, b);
    expect(out.lumen).toBe(s.lumenRaw);
    expect(p.progress.lumen).toBe(before + out.lumen);
    expect(p.battles.held).toBe(s.held);
    // the daily free practice cap is shared
    const q = withSets(); q.progress.freeXp = { date: today(q), xp: 49 };
    const b2 = newBattle(pullEntries(q, 3, 7)); while (!b2.over) answer(b2, current(b2).answer);
    expect(settle(q, b2).lumen).toBe(1);
  });
  it('hinted and relearned items earn nothing', () => {
    const p = withSets(); const b = newBattle(pullEntries(p, 3, 4));
    while (!b.over) { useHint(b); answer(b, current(b).answer); }
    expect(summarize(b).held).toBe(0);
    expect(settle(p, b).lumen).toBe(0);
  });
  it('NEVER changes skill estimates, results or review sets', () => {
    const p = withSets(); const before = snap(p);
    const b = fight(p);
    let n = 0;
    while (!b.over) answer(b, n++ % 2 ? 'zzz' : current(b).answer);
    settle(p, b);
    expect(snap(p)).toBe(before);
  });
  it('accepts forgiving answers and Major images', () => {
    expect(isRight({ answer: 'elephant', t: 'vocab', kind: 'recall' }, 'Elephants')).toBe(true);
    expect(isRight({ answer: 'bear', t: 'major', kind: 'recall', major: '94' }, 'bear')).toBe(true);
    expect(isRight({ answer: '43', numeric: true, kind: 'recall' }, ' 43 ')).toBe(true);
    expect(isRight({ answer: 'x', kind: 'recall' }, '')).toBe(false);
  });
});

describe('echo scenes', () => {
  it('has at least three working scenes with made-up material, technique choice and no rewards', () => {
    expect(SCENE_ORDER.length).toBeGreaterThanOrEqual(3);
    const p = withSets();
    for (const id of SCENE_ORDER) {
      const sc = buildScene(id, 11, p);
      expect(sc.study.length).toBeGreaterThanOrEqual(5);
      expect(sc.entries.length).toBeGreaterThanOrEqual(5);
      expect(buildScene(id, 11, p).entries.map((e) => e.answer)).toEqual(sc.entries.map((e) => e.answer));
      const b = newBattle(sc.entries, { scene: id });
      while (!b.over) answer(b, current(b).answer);
      const before = p.progress.lumen;
      const out = settle(p, b);
      expect(out.lumen).toBe(0); expect(p.progress.lumen).toBe(before);
    }
  });
  it('a poor technique gives a tip and no penalty; a good one gives more study time', () => {
    const bad = techniqueResult('speech', 'major'), good = techniqueResult('speech', 'palace');
    expect(bad.good).toBe(false); expect(bad.studyMult).toBe(1); expect(bad.tip.length).toBeGreaterThan(20);
    expect(good.studyMult).toBeGreaterThan(1);
  });
  it('has a packing distraction and no sensitive material', () => {
    const sc = buildScene('packing', 3, withSets());
    expect(sc.distraction.q).toMatch(/\d+ \+ \d+/);
    expect(JSON.stringify(SCENES)).not.toMatch(/password|pin code|bank|medicine/i);
  });
});

describe('character and gear', () => {
  it('maps seven attributes to the seven skills, from existing levels only', () => {
    const p = newProfile('t', 'key');
    const at = attributes(p);
    expect(at.map((a) => a.skill)).toEqual(Object.keys(SKILLS));
    expect(at.every((a) => a.value === 1)).toBe(true);
    expect(classOf(p).title).toBe('Apprentice Keeper');
    p.skills.palace.level = 5; p.skills.palace.mastery = 3;
    expect(classOf(p).klass).toBe('Cartographer');
  });
  it('only owned relics can be worn, and effects follow the equipped gear', () => {
    const p = newProfile('t', 'key');
    expect(equip(p, 'lantern', 'gear_river_glass_lamp')).toBe(false);
    expect(equip(p, 'lantern', 'brass_lantern')).toBe(true);
    expect(options(p, 'cloak').map((o) => o.id)).toEqual(['cloak_dusk']);
    p.progress.gates = ['M2'];
    expect(equip(p, 'cloak', 'art_side_door_key')).toBe(true);
    expect(dollSpec(p).cloak).toBe('#2e5a5a');
    p.skills.imagery.level = 2; // one level gained
    expect(equip(p, 'lantern', 'gear_river_glass_lamp')).toBe(true);
    expect(effects(p).letters).toBe(true);
    expect(equipOf(p, 'tool')).toBeNull();
    p.progress.gates = [];
    expect(equipOf(p, 'cloak')).toBeNull(); // no longer owned: not worn
  });
  it('the paper doll changes with each gate and draws every enemy', () => {
    const a = keeperSprite({ gates: [] }), b = keeperSprite({ gates: ['M1', 'M2', 'M3', 'M4'] }), c = keeperSprite({ gates: ['M1', 'M2', 'M3', 'M4'], tool: 'scroll', charm: 'epic' });
    expect(a.rgba.join()).not.toBe(b.rgba.join());
    expect(b.rgba.join()).not.toBe(c.rgba.join());
    for (const sk of Object.keys(SKILLS)) { const s = forgettingSprite(sk); expect(s.rgba.some((v, i) => i % 4 === 3 && v > 0)).toBe(true); }
  });
});

describe('profile records (migration, validation, import)', () => {
  it('migrates old profiles and validates the new records', () => {
    const p = newProfile('t', 'key');
    delete p.keeper; delete p.battles;
    migrate(p);
    expect(p.keeper.equip.lantern).toBeNull(); expect(p.battles.queue).toEqual([]);
    expect(validateProfile(p)).toBeNull();
    p.keeper.equip.lantern = 'not_a_thing';
    expect(validateProfile(p)).toMatch(/gear/);
    p.keeper.equip.lantern = 'cloak_dusk'; // wrong slot
    expect(validateProfile(p)).toMatch(/gear/);
    p.keeper.equip.lantern = null;
    p.battles.history = [{ date: '2026-11-01', mode: 'echo', outcome: 'won', items: 7, held: 3, relearned: 1, queued: 0, lumen: 6 }];
    expect(validateProfile(p)).toBeNull();
    p.battles.history[0].date = 'yesterday';
    expect(validateProfile(p)).toMatch(/Battle/);
    p.battles.history = []; p.battles.queue = [{ set: 'x'.repeat(80), i: 0, date: '2026-11-01' }];
    expect(validateProfile(p)).toMatch(/Battle/);
  });
  it('round-trips through export and import', () => {
    const p = withSets();
    equip(p, 'tool', 'wrens_notecard');
    const b = newBattle(pullEntries(p, 3, 6)); while (!b.over) answer(b, current(b).answer);
    settle(p, b);
    const r = parseImport(buildExport(p));
    expect(r.ok).toBe(true);
    expect(r.profile.battles.history.length).toBe(1);
    expect(r.profile.keeper.equip.tool).toBe('wrens_notecard');
  });
});

describe('echo story', () => {
  it('has the codex entry, coaches, beat and hook, with no dashes and the honest line', () => {
    const f = CODEX.find((e) => e.id === 'forgettings');
    expect(f.unlock).toBe('gate:M1');
    expect(f.text.join(' ')).toMatch(/not evil/i);
    expect(Object.keys(COACHES)).toHaveLength(7);
    for (const c of Object.values(COACHES)) { expect(c.before).toHaveLength(2); expect(c.win.length).toBeGreaterThan(20); expect(c.rest.length).toBeGreaterThan(20); }
    expect(JSON.stringify([COACHES, ECHO_BEAT, ECHO_HOOK, f, ECHO_HONEST])).not.toMatch(/[—–]/);
    expect(ECHO_HONEST).toMatch(/do not make memory better in general/);
  });
});
