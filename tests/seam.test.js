// 1.1 Chapter 13 (the Seam and the Great Forgetting) and Wren's Story Memory (v0.13).
import { describe, it, expect } from 'vitest';
import { newProfile, today } from '../src/engine/core.js';
import { addDays } from '../src/engine/util.js';
import { migrate, buildExport, parseImport, validateProfile } from '../src/store.js';
import { MODULES } from '../src/data/curriculum.js';
import { yearComplete, keepingDay } from '../src/engine/session.js';
import { answer, current } from '../src/engine/battle.js';
import { codexFor } from '../src/engine/quests.js';
import { CODEX } from '../src/data/lore.js';
import { TABLETS } from '../src/data/crypt.js';
import { GATE_TALK } from '../src/data/afteryear.js';
import * as F from '../src/data/forgetting.js';
import { WF_BEATS, WF_QUESTIONS, Q_BY_ID } from '../src/data/wren.js';
import { PHASE_IDS, seamOpen, seamClosed, endingPending, sittingPlan, pickThread, buildPhase, newPhaseBattle, beadOk, scoreStitch, startSitting, clearPhase, restSitting, settleStitch, finishEnding, STITCH_CLOSES } from '../src/engine/seam.js';
import { nextBeat, readBeat, dueQuestion, answerQuestion, accepts, wrenDay, isHeld, heldCount, keepsakeText, retired, markPortraitSeen } from '../src/engine/wren.js';

// A profile at the end of the year with k keeping days done.
function yearEnd(k = 3) {
  const p = newProfile('t', 'key');
  p.progress.gates = MODULES.map((m) => m.id);
  p.progress.day = 365;
  p.progress.fullDates = Array.from({ length: 364 + k }, (_, i) => addDays('2026-01-01', i));
  return p;
}
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
const snap = (p) => JSON.stringify({ skills: p.skills, results: p.results, sets: p.sets, lumen: p.progress.lumen });
const allStrings = (v, out = []) => { if (typeof v === 'string') out.push(v); else if (Array.isArray(v)) v.forEach((x) => allStrings(x, out)); else if (v && typeof v === 'object') Object.values(v).forEach((x) => allStrings(x, out)); return out; };

describe('Chapter 13 data', () => {
  it('has no dashes used as punctuation, in any shipped string', () => {
    for (const mod of [F, { WF_BEATS, WF_QUESTIONS }]) for (const s of allStrings(Object.values(mod))) expect(s).not.toMatch(/[–—]/);
  });
  it('keeps the shipped ids and adds only new ones', () => {
    expect(F.GREAT_FORGETTING.id).toBe('great_forgetting');
    expect(F.GREAT_FORGETTING.gate).toBe('M12');
    expect(F.BOSS_LORE.id).toBe('lore_great_forgetting');
    const ids = F.SEAM_LORE.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(CODEX.some((e) => e.id === id)).toBe(false);
    expect(F.SEAM_LORE.filter((e) => /^gate:M(1|5|6|9)$/.test(e.unlock)).map((e) => e.unlock).sort()).toEqual(['gate:M1', 'gate:M5', 'gate:M6', 'gate:M9']);
  });
  it('has four threads of nine picturable days, each with a short answer', () => {
    const th = F.BOSS_STITCH.threads;
    expect(th.length).toBe(4);
    expect(new Set(th.map((t) => t.id)).size).toBe(4);
    for (const t of th) {
      expect(t.beads.length).toBe(9);
      expect(t.beads.map((b) => b.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      for (const b of t.beads) { expect(b.ans.length).toBeGreaterThan(2); expect(b.thing.length).toBeGreaterThan(8); }
    }
    expect(F.BOSS_STITCH.closesAt).toBe(6);
  });
  it('adds four Undercroft tablets after the old ones, between 60 and 120 words', () => {
    const add = TABLETS.slice(-4);
    expect(add.map((t) => t.depth)).toEqual([75, 80, 90, 100]);
    expect(add.map((t) => t.id)).toEqual(['tab_p_winder_clocks', 'tab_p_warden_stayed', 'tab_p_thread_warm', 'tab_p_one_evening']);
    expect(TABLETS[0].id).toBe('tab_masons_mark');
  });
  it('gives Month 12 its Gate talk without touching the other rows', () => {
    expect(GATE_TALK.M12[0]).toBe('wren');
    expect(GATE_TALK.M11[0]).toBe('isolde');
    expect(GATE_TALK.M1[0]).toBe('tansy');
  });
  it('wires the chapter to an unlock after the Year of Keeping', () => {
    const p = yearEnd(1);
    expect(yearComplete(p)).toBe(true);
    expect(seamOpen(p)).toBe(false);
    expect(seamOpen(yearEnd(3))).toBe(true);
    const q = newProfile('t', 'key');
    expect(seamOpen(q)).toBe(false);
  });
});

describe('the battle, the Stitch and the record', () => {
  it('plays the unfinished phases, and the last one again as the interlude', () => {
    const p = yearEnd();
    expect(sittingPlan(p)).toEqual(PHASE_IDS);
    clearPhase(p, 'fringe');
    expect(sittingPlan(p)).toEqual(['body', 'face']);
    PHASE_IDS.forEach((id) => clearPhase(p, id));
    expect(sittingPlan(p)).toEqual(['face']);
    clearPhase(p, 'fringe'); clearPhase(p, 'nonsense');
    expect(p.seam.cleared).toEqual(PHASE_IDS);
  });
  it('builds made-up phases that are deterministic, answerable and never touch skills or Lumen', () => {
    const p = yearEnd();
    const before = snap(p);
    for (const id of PHASE_IDS) {
      const a = buildPhase(id, 42, p), b2 = buildPhase(id, 42, p);
      expect(a.entries.map((e) => e.prompt)).toEqual(b2.entries.map((e) => e.prompt));
      expect(a.entries.length).toBeGreaterThanOrEqual(5);
      expect(a.study.length).toBeGreaterThanOrEqual(5);
      const b = newPhaseBattle(a);
      let guard = 0;
      while (current(b) && guard++ < 40) answer(b, current(b).answer);
      expect(b.outcome).toBe('won');
      expect(b.entries.every((e) => b.state[e.key].status === 'held')).toBe(true);
    }
    expect(snap(p)).toBe(before);
  });
  it('rests (and queues nothing) when Resolve runs out, leaving finished phases alone', () => {
    const p = yearEnd();
    const b = newPhaseBattle(buildPhase('body', 7, p));
    let guard = 0;
    while (current(b) && guard++ < 80) answer(b, 'zzzzqq');
    expect(b.outcome).toBe('rest');
    restSitting(p);
    expect(p.seam.rests).toBe(1);
    expect(p.seam.cleared).toEqual([]);
  });
  it('accepts a bead by its short answer or another word, and rejects wrong ones', () => {
    const bead = F.BOSS_STITCH.threads[0].beads[0];
    expect(beadOk(bead, 'copper kettle')).toBe(true);
    expect(beadOk(bead, 'The kettle')).toBe(true);
    expect(beadOk(bead, 'a copper kettle rolling')).toBe(true);
    expect(beadOk(bead, 'heron')).toBe(false);
    expect(beadOk(bead, '   ')).toBe(false);
  });
  it('closes the Seam at 6 of 9 and not at 5, and a miss locks nothing', () => {
    const th = F.BOSS_STITCH.threads[0];
    const say = (n) => th.beads.map((b, i) => (i < n ? b.ans : 'nothing'));
    expect(scoreStitch(th, say(9))).toMatchObject({ inPlace: 9, closed: true });
    expect(scoreStitch(th, say(6))).toMatchObject({ inPlace: 6, closed: true });
    expect(scoreStitch(th, say(5))).toMatchObject({ inPlace: 5, closed: false });
    expect(scoreStitch(th, Array(9).fill(''))).toMatchObject({ inPlace: 0, closed: false });
    expect(STITCH_CLOSES).toBe(6);
    const p = yearEnd();
    startSitting(p);
    expect(settleStitch(p, th.id, 5)).toMatchObject({ closed: false, tries: 1, best: 5 });
    expect(seamClosed(p)).toBe(false);
    expect(settleStitch(p, 'thread_2', 7)).toMatchObject({ closed: true, tries: 2, best: 7 });
    expect(seamClosed(p)).toBe(true);
    expect(endingPending(p)).toBe(true);
    expect(settleStitch(p, 'thread_3', 2).closed).toBe(false);   // a later sitting never reopens it
    expect(seamClosed(p)).toBe(true);
  });
  it('uses a new thread for each try', () => {
    const p = yearEnd();
    const seen = [];
    for (let i = 0; i < 4; i++) { const t = pickThread(p, 100 + i); seen.push(t.id); settleStitch(p, t.id, 3); }
    expect(new Set(seen).size).toBe(4);
    expect(pickThread(p, 5)).toBeTruthy();
  });
  it('finishing the ending marks the chapter, the epilogue and Wren\'s portrait as seen', () => {
    const p = yearEnd();
    settleStitch(p, 'thread_1', 9);
    finishEnding(p, false);
    expect(p.seam.held).toBe('told');
    expect(p.seam.epilogue).toBe(today(p));
    expect(p.story.seen).toEqual(expect.arrayContaining(['seam', 'epilogue2']));
    expect(p.wren.seen.wf_b11_portrait).toBe(today(p));
    expect(endingPending(p)).toBe(false);
    finishEnding(p, true);
    expect(p.seam.held).toBe('held');
  });
  it('never changes skill estimates, results or Lumen through the whole record', () => {
    const p = yearEnd();
    const before = snap(p);
    startSitting(p); clearPhase(p, 'fringe'); restSitting(p); settleStitch(p, 'thread_1', 8); finishEnding(p, true);
    expect(snap(p)).toBe(before);
  });
});

describe("Wren's family and her Story Memory", () => {
  it('has 11 beats and 29 questions, each tied to a beat, and each source line is in the beat text', () => {
    expect(WF_BEATS.length).toBe(11);
    expect(WF_QUESTIONS.length).toBe(29);
    expect(new Set(WF_QUESTIONS.map((q) => q.id)).size).toBe(29);
    for (const q of WF_QUESTIONS) {
      const beat = WF_BEATS.find((b) => b.id === q.beat);
      expect(beat, q.id).toBeTruthy();
      expect(q.earliest, q.id).toBeGreaterThanOrEqual(beat.day + 3);
      expect(q.ok.length).toBeGreaterThan(0);
      expect(norm(beat.text.join(' ')), q.id).toContain(norm(q.src));
      expect(q.held.length).toBeGreaterThan(10);
    }
    expect(WF_BEATS.map((b) => b.day)).toEqual([8, 22, 36, 64, 99, 176, 260, 302, 337, 366, 0]);
  });
  it('shows one beat a day, in story order, only once the player reaches its day', () => {
    const p = newProfile('t', 'key');
    p.progress.day = 7;
    expect(nextBeat(p)).toBeNull();
    p.progress.day = 30;
    expect(nextBeat(p).id).toBe('wf_b1_three_stirs');
    expect(readBeat(p, 'wf_b1_three_stirs')).toBe(true);
    expect(readBeat(p, 'wf_b1_three_stirs')).toBe(false);
    expect(nextBeat(p)).toBeNull();                         // one a day
    p.wren.lastBeat = addDays(today(p), -1);
    expect(nextBeat(p).id).toBe('wf_b2_blue_door');
    p.progress.day = 365; p.wren.lastBeat = null;
    for (const b of WF_BEATS.filter((x) => !x.epilogue && x.day <= 365)) readBeat(p, b.id, addDays(today(p), -40));
    expect(nextBeat(p)).toBeNull();                         // the green door waits for the Year of Keeping
  });
  it('puts the Year of Keeping on the same clock', () => {
    const p = yearEnd(1);
    expect(keepingDay(p)).toBe(1);
    expect(wrenDay(p)).toBe(366);
    expect(wrenDay(yearEnd(10))).toBe(375);
    const q = newProfile('t', 'key'); q.progress.day = 40;
    expect(wrenDay(q)).toBe(40);
  });
  it('asks only after the beat is read, 3 days later, on its earliest day, once a day, and not when switched off', () => {
    const p = newProfile('t', 'key');
    p.progress.day = 20;
    expect(dueQuestion(p)).toBeNull();                       // no beat read yet
    readBeat(p, 'wf_b1_three_stirs', addDays(today(p), -1));
    expect(dueQuestion(p)).toBeNull();                       // only 1 day after the beat
    p.wren.seen.wf_b1_three_stirs = addDays(today(p), -5);
    const q = dueQuestion(p);
    expect(q.id).toBe('wf_stirs');
    p.progress.day = 9;
    expect(dueQuestion(p)).toBeNull();                       // before the earliest day
    p.progress.day = 20;
    p.user.prefs.wrenMemory = false;
    expect(dueQuestion(p)).toBeNull();
    p.user.prefs.wrenMemory = true;
    answerQuestion(p, 'wf_stirs', 'three');
    expect(dueQuestion(p)).toBeNull();                       // she asked today already
  });
  it('spaces asks at 10 and 30 days, retires after two held, and stops after three asks', () => {
    const p = newProfile('t', 'key');
    p.progress.day = 60;
    p.wren.seen.wf_b1_three_stirs = addDays(today(p), -90);
    const q = Q_BY_ID.wf_stirs;
    const ask = (date, text) => answerQuestion(p, q.id, text, date);
    const day = (n) => addDays(today(p), n);
    ask(day(-40), 'no idea');
    p.wren.lastQ = null;
    p.wren.asked.wf_stirs.last = day(-5);
    expect(dueQuestion(p, day(0))?.id).not.toBe('wf_stirs');  // only 5 days since the first ask
    p.wren.asked.wf_stirs.last = day(-12);
    expect(dueQuestion(p, day(0))?.id).toBe('wf_stirs');
    ask(day(0), 'three');
    p.wren.lastQ = null;
    expect(p.wren.asked.wf_stirs).toMatchObject({ n: 2, ok: 1, held: day(0) });
    p.wren.asked.wf_stirs.last = day(-20);
    expect(dueQuestion(p, day(0))?.id).not.toBe('wf_stirs');  // third ask needs 30 days
    p.wren.asked.wf_stirs.last = day(-31);
    expect(dueQuestion(p, day(0))?.id).toBe('wf_stirs');
    ask(day(0), 'three');
    expect(retired(p.wren.asked.wf_stirs)).toBe(true);
    expect(retired({ n: 3, ok: 0 })).toBe(true);
    expect(retired({ n: 2, ok: 1 })).toBe(false);
  });
  it('accepts a forgiving answer and a miss only repeats the line, never locking anything', () => {
    expect(accepts(Q_BY_ID.wf_door, 'It was blue')).toBe(true);
    expect(accepts(Q_BY_ID.wf_door, 'BLUE!')).toBe(true);
    expect(accepts(Q_BY_ID.wf_door, 'green')).toBe(false);
    expect(accepts(Q_BY_ID.wf_newdoor, 'Green')).toBe(true);
    expect(accepts(Q_BY_ID.wf_number, '31')).toBe(true);
    expect(accepts(Q_BY_ID.wf_number, 'number thirty one')).toBe(true);
    expect(accepts(Q_BY_ID.wf_lamps_mother, '1 to 22')).toBe(true);
    expect(accepts(Q_BY_ID.wf_tune, 'the last lamp')).toBe(true);
    expect(accepts(Q_BY_ID.wf_blend, 'Mist and Mint')).toBe(true);
    expect(accepts(Q_BY_ID.wf_scar, 'Through her left eyebrow')).toBe(true);
    expect(accepts(Q_BY_ID.wf_tallow, 'tallow')).toBe(true);
    expect(accepts(Q_BY_ID.wf_pip, 'pipp')).toBe(false);      // too short for a typo
    expect(accepts(Q_BY_ID.wf_stirs, '')).toBe(false);
    const p = newProfile('t', 'key');
    const before = snap(p);
    const miss = answerQuestion(p, 'wf_pip', 'Mittens');
    expect(miss.ok).toBe(false);
    expect(miss.line).toBeNull();
    expect(miss.closing.length).toBeGreaterThan(5);
    expect(isHeld(p, 'wf_pip')).toBe(false);
    const skipped = answerQuestion(p, 'wf_attic', null);
    expect(skipped.ok).toBe(false);
    const hit = answerQuestion(p, 'wf_honey', 'honey', addDays(today(p), 1));
    expect(hit.ok).toBe(true);
    expect(hit.line).toBe(Q_BY_ID.wf_honey.held);
    expect(heldCount(p)).toBe(1);
    expect(snap(p)).toBe(before);                             // story only
    expect(answerQuestion(p, 'nope', 'x')).toBeNull();
  });
});

describe('the Chronolog', () => {
  const open = (p) => codexFor(p).filter((e) => e.open).map((e) => e.id);
  it('opens the foreshadowing entries at their gates', () => {
    const p = newProfile('t', 'key');
    expect(open(p)).not.toContain('lore_p_winding_mark');
    p.progress.gates = ['M1'];
    expect(open(p)).toContain('lore_p_winding_mark');
    p.progress.gates = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9'];
    expect(open(p)).toEqual(expect.arrayContaining(['lore_p_hour_unwritten', 'lore_p_oldest_stone', 'lore_p_patron']));
  });
  it('opens the Seam rules on meeting the giant, and the giant\'s lore when it is remembered', () => {
    const p = yearEnd();
    expect(open(p)).not.toContain('lore_p_seam');
    startSitting(p);
    expect(open(p)).toContain('lore_p_seam');
    expect(open(p)).not.toContain('lore_great_forgetting');
    settleStitch(p, 'thread_1', 9);
    expect(open(p)).toContain('lore_great_forgetting');
  });
  it('opens the third verse after the beat, the keepsakes after a held answer, and the scenes when the clusters are held', () => {
    const p = newProfile('t', 'key');
    p.progress.day = 400;
    expect(open(p)).not.toContain('lore_p_third_verse');
    readBeat(p, 'wf_b9_third_verse');
    expect(open(p)).toContain('lore_p_third_verse');
    expect(open(p)).not.toContain('lore_wren_keepsakes');
    answerQuestion(p, 'wf_stirs', 'three');
    expect(open(p)).toContain('lore_wren_keepsakes');
    const keep = codexFor(p).find((e) => e.id === 'lore_wren_keepsakes');
    expect(keep.text.join(' ')).toContain(Q_BY_ID.wf_stirs.held);
    expect(keepsakeText(newProfile('t', 'key'))).toEqual([]);
    for (const id of ['wf_scar', 'wf_pin', 'wf_laugh']) answerQuestion(p, id, Q_BY_ID[id].ok[0]);
    expect(open(p)).not.toContain('lore_wren_face_kept');
    answerQuestion(p, 'wf_scarf', 'yellow');
    expect(open(p)).toContain('lore_wren_face_kept');
    answerQuestion(p, 'wf_tune', 'the last lamp');
    expect(open(p)).not.toContain('lore_wren_last_lamp');
    answerQuestion(p, 'wf_hum', 'lighting the lamps');
    expect(open(p)).toContain('lore_wren_last_lamp');
  });
});

describe('saved data: migration, validation and import', () => {
  const roundTrip = (p) => parseImport(buildExport(p));
  it('adds empty records and the setting to an older save', () => {
    const p = newProfile('t', 'key');
    delete p.seam; delete p.wren; delete p.user.prefs.wrenMemory;
    migrate(p);
    expect(p.seam).toMatchObject({ met: null, cleared: [], tries: 0, closed: null, epilogue: null });
    expect(p.wren).toEqual({ seen: {}, asked: {}, lastBeat: null, lastQ: null });
    expect(p.user.prefs.wrenMemory).toBe(true);
    expect(validateProfile(p)).toBeNull();
    p.seam = []; p.wren = 'x'; migrate(p);
    expect(p.seam.cleared).toEqual([]); expect(p.wren.seen).toEqual({});
  });
  it('round-trips a played record through export and import', () => {
    const p = yearEnd();
    startSitting(p); clearPhase(p, 'fringe'); clearPhase(p, 'body'); settleStitch(p, 'thread_1', 7); finishEnding(p, true);
    readBeat(p, 'wf_b1_three_stirs', '2026-03-01');
    answerQuestion(p, 'wf_stirs', 'three', '2026-03-05');
    markPortraitSeen(p);
    p.user.prefs.wrenMemory = false;
    const r = roundTrip(p);
    expect(r.ok).toBe(true);
    expect(r.profile.seam).toEqual(p.seam);
    expect(r.profile.wren).toEqual(p.wren);
    expect(r.profile.user.prefs.wrenMemory).toBe(false);
  });
  it('rejects damaged records', () => {
    const bad = (fn) => { const p = yearEnd(); fn(p); return validateProfile(p); };
    expect(bad((p) => { p.seam.cleared = ['nonsense']; })).toMatch(/Seam/);
    expect(bad((p) => { p.seam.best = 12; })).toMatch(/Seam/);
    expect(bad((p) => { p.seam.closed = 'soon'; })).toMatch(/Seam/);
    expect(bad((p) => { p.seam.held = 'maybe'; })).toMatch(/Seam/);
    expect(bad((p) => { p.seam.used = Array(20).fill('x'); })).toMatch(/Seam/);
    expect(bad((p) => { p.wren.seen = { not_a_beat: '2026-01-01' }; })).toMatch(/Wren/);
    expect(bad((p) => { p.wren.seen = { wf_b1_three_stirs: 'yesterday' }; })).toMatch(/Wren/);
    expect(bad((p) => { p.wren.asked = { wf_nope: { n: 1, ok: 0, last: null, held: null } }; })).toMatch(/Wren/);
    expect(bad((p) => { p.wren.asked = { wf_stirs: { n: 1000, ok: 0, last: null, held: null } }; })).toMatch(/Wren/);
    expect(bad((p) => { p.wren.lastQ = 'later'; })).toMatch(/Wren/);
    expect(bad((p) => { p.user.prefs.wrenMemory = 'yes'; })).toMatch(/Wren/);
    expect(bad(() => {})).toBeNull();
  });
  it('refuses a backup with a damaged Seam record on import', () => {
    const p = yearEnd();
    const text = JSON.stringify({ app: 'mnemos', schema: 2, profile: { ...p, seam: { ...p.seam, cleared: ['x'] } } });
    expect(parseImport(text).ok).toBe(false);
  });
});
