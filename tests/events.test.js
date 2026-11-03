import { describe, it, expect } from 'vitest';
import { newProfile, today } from '../src/engine/core.js';
import { addDays, rng } from '../src/engine/util.js';
import { migrate, buildExport, parseImport, validateProfile } from '../src/store.js';
import {
  EVENT_IDS, SEASON_EVENTS, hallOpen, seasonOpen, ensureEvents, levelsOf, maxOf, buildRound, scoreRound, strikeRun, yearOk, answerOk, digitRows,
  postResult, bestRatio, topBest, startSeason, canClose, closeTier, tierMarks, rivalRatio, finalLamps, finalWon, playFinal, tierDef, levelFor, tierEvents, verdict, eventLoreOpen,
} from '../src/engine/events.js';
import { EVENTS, TIERS, FINAL, RIVAL, RIVAL_LINES, EVENT_LORE, blankEvents, HISTORY_CAP } from '../src/data/events.js';
import COPY from '../src/data/add/eventcopy.json';
import { material, trialState, startTrial, submitCheck, isRightTrial, TRIAL_IDS } from '../src/engine/trials.js';
import { TRIALS, YEAR_POOL } from '../src/data/trials.js';
import { ITEM_BY_ID } from '../src/data/items.js';
import { ICONS } from '../src/pixel/icons.js';
import { codexFor } from '../src/engine/quests.js';
import { MODULES } from '../src/data/curriculum.js';

const ALL = MODULES.map((m) => m.id);
const fresh = (gates = ALL) => { const p = newProfile('t', 'key'); p.progress.gates = [...gates]; return p; };
// Answers that score full marks.
function perfect(round) {
  const a = {};
  if (round.id === 'names') round.items.forEach((it, i) => { a[i] = { first: it.first, last: it.last }; });
  if (round.id === 'numbers') for (let r = 0; r < round.n; r++) a[r] = round.digits.slice(r * 20, r * 20 + 20).join('');
  if (round.id === 'poem') { round.lines.forEach((l, i) => { a[i] = l.answer; }); a.title = round.title; a.author = round.author; }
  if (round.id === 'dates') round.items.forEach((it, i) => { a[i] = it.year; });
  if (round.id === 'facts') round.items.forEach((it, i) => { a[i] = it.answer; });
  if (round.id === 'words' || round.id === 'strikes') return round.questions.map((q) => q.answer);
  return a;
}
const post = (p, id, lv, ratio, tier = null) => { const max = maxOf(id, lv); return postResult(p, id, lv, Math.round(ratio * max), max, today(p), tier); };

describe('event data', () => {
  it('has nine events with copy, ladders and no dashes', () => {
    expect(EVENT_IDS.length).toBe(9);
    for (const id of EVENT_IDS) {
      const e = EVENTS[id];
      const c = e.copy ? COPY.events[e.copy] : null;
      expect(e.sizes.length).toBeGreaterThan(1);
      if (e.copy) expect(c.rules.length).toBeGreaterThan(2);
      expect(JSON.stringify(c || {})).not.toMatch(/[—–]/);
    }
    expect(JSON.stringify([EVENTS, TIERS, FINAL, RIVAL_LINES, EVENT_LORE])).not.toMatch(/[—–]/);
  });
  it('tiers only use events at levels that exist', () => {
    for (const t of [...TIERS, FINAL]) for (const [id, lv] of Object.entries(t.at)) { expect(SEASON_EVENTS).toContain(id); expect(lv).toBeGreaterThanOrEqual(1); expect(lv).toBeLessThanOrEqual(levelsOf(id)); }
    expect(TIERS.map((t) => t.need)).toEqual([3, 3, 4, 5]);
  });
  it('the Hall opens at M10 and the Season at M12', () => {
    expect(hallOpen(fresh(['M9']))).toBe(false);
    expect(hallOpen(fresh(['M10']))).toBe(true);
    expect(seasonOpen(fresh(['M10']))).toBe(false);
    expect(seasonOpen(fresh(ALL))).toBe(true);
  });
});

describe('rounds and scoring', () => {
  it('every event and level builds a deterministic round that scores full marks', () => {
    const p = fresh();
    for (const id of EVENT_IDS.filter((x) => x !== 'cards' && x !== 'decks')) {
      for (let lv = 1; lv <= levelsOf(id); lv++) {
        const a = buildRound(id, lv, 7, p), b = buildRound(id, lv, 7, p);
        expect(JSON.stringify(a)).toBe(JSON.stringify(b));
        const res = scoreRound(a, perfect(a));
        expect(res.score, `${id} ${lv}`).toBe(res.max);
        expect(res.max, `${id} ${lv} max`).toBe(maxOf(id, lv));
        expect(scoreRound(a, {}).score).toBe(0);
      }
    }
  });
  it('rounds change with the seed and have the sizes the ladder says', () => {
    const p = fresh();
    expect(buildRound('names', 3, 1, p).items.length).toBe(20);
    expect(buildRound('numbers', 2, 1, p).digits.length).toBe(40);
    expect(buildRound('words', 3, 1, p).words.length).toBe(100);
    expect(buildRound('strikes', 3, 1, p).questions.length).toBe(36);
    expect(new Set(buildRound('dates', 4, 1, p).items.map((x) => x.year)).size).toBe(28);
    expect(JSON.stringify(buildRound('facts', 2, 1, p).items)).not.toBe(JSON.stringify(buildRound('facts', 2, 2, p).items));
    const d = digitRows(4, rng(5));
    for (let i = 2; i < d.length; i++) expect(d[i] === d[i - 1] && d[i] === d[i - 2]).toBe(false);
  });
  it('faces are strict: exact spelling, one point for each name part', () => {
    const r = buildRound('names', 1, 3, fresh());
    const a = perfect(r);
    a[0] = { first: r.items[0].first, last: 'Wrongname' };
    a[1] = { first: r.items[1].first.toUpperCase(), last: ` ${r.items[1].last} ` };
    expect(scoreRound(r, a).score).toBe(r.max - 1);
    a[2] = { first: r.items[2].first + 'x', last: r.items[2].last };
    expect(scoreRound(r, a).score).toBe(r.max - 2);
  });
  it('number rows score all or nothing, and a blank row ends scoring', () => {
    const r = buildRound('numbers', 3, 4, fresh());
    const a = perfect(r);
    expect(scoreRound(r, a).score).toBe(60);
    a[0] = a[0].slice(0, 19) + ((+a[0][19] + 1) % 10);
    expect(scoreRound(r, a).score).toBe(40);
    const b = perfect(r); b[1] = '';
    expect(scoreRound(r, b).score).toBe(20); // row 2 does not count after a blank row
  });
  it('poems are strict, with a point each for title and author', () => {
    const r = buildRound('poem', 1, 2, fresh());
    const a = perfect(r);
    expect(scoreRound(r, a)).toMatchObject({ score: 6, max: 6 });
    a[0] = a[0].toLowerCase() + '!';
    expect(scoreRound(r, a).score).toBe(5);
    a.title = ''; a.author = 'nobody';
    expect(scoreRound(r, a).score).toBe(3);
  });
  it('years need every digit, and BCE years need BCE', () => {
    expect(yearOk('1066', '1066')).toBe(true);
    expect(yearOk(' 1066 ', '1066')).toBe(true);
    expect(yearOk('1067', '1066')).toBe(false);
    expect(yearOk('106', '1066')).toBe(false);
    expect(yearOk('44 BC', '44 BCE')).toBe(true);
    expect(yearOk('44 bce', '44 BCE')).toBe(true);
    expect(yearOk('44', '44 BCE')).toBe(false);
    expect(yearOk('', '1066')).toBe(false);
    expect(answerOk({ answer: '206' }, '206')).toBe(true);
    expect(answerOk({ answer: '206' }, '207')).toBe(false);
    expect(answerOk({ answer: 'Mitochondria', alts: ['mitochondrion'] }, 'mitochondrion')).toBe(true);
  });
  it('three wrong or blank answers end an elimination round', () => {
    const r = buildRound('words', 1, 5, fresh());
    const right = r.questions.map((q) => q.answer);
    const a = [right[0], '', right[2], 'zzz', right[4], 'qqq', right[6]];
    const run = strikeRun(r, a);
    expect(run).toMatchObject({ score: 3, strikes: 3, ended: true, asked: 6 });
    expect(scoreRound(r, a).score).toBe(3);
    expect(strikeRun(r, right).score).toBe(20);
  });
});

describe('best results', () => {
  it('keeps the best per level, never touches skills, and caps the history', () => {
    const p = fresh();
    const snap = JSON.stringify({ skills: p.skills, results: p.results, sets: p.sets, lumen: p.progress.lumen });
    expect(postResult(p, 'names', 1, 10, 24, today(p))).toMatchObject({ first: true, newBest: true });
    expect(postResult(p, 'names', 1, 8, 24, today(p))).toMatchObject({ first: false, newBest: false, matched: false });
    expect(postResult(p, 'names', 1, 10, 24, today(p)).matched).toBe(true);
    expect(postResult(p, 'names', 1, 20, 24, today(p)).newBest).toBe(true);
    postResult(p, 'names', 2, 5, 32, today(p));
    expect(p.events.best.names[1].score).toBe(20);
    expect(topBest(p, 'names')).toMatchObject({ lv: 2, score: 5 });
    for (let i = 0; i < 80; i++) postResult(p, 'facts', 1, 1, 12, today(p));
    expect(p.events.history.length).toBe(HISTORY_CAP);
    expect(JSON.stringify({ skills: p.skills, results: p.results, sets: p.sets, lumen: p.progress.lumen })).toBe(snap);
  });
});

describe('the Say-Back Games', () => {
  const season = () => { const p = fresh(); startSeason(p); return p; };
  it('starts at tier 1 with a snapshot and cannot start twice', () => {
    const p = fresh();
    post(p, 'names', 1, 0.5);
    expect(startSeason(p)).toBe(true);
    expect(p.events.season.tier).toBe(1);
    expect(p.events.season.snap.names).toBeCloseTo(0.5, 2);
    expect(p.events.season.snap.poem).toBe(null);
    expect(startSeason(p)).toBe(false);
  });
  it('rival marks follow the snapshot times a factor, are capped, and use a default with no best', () => {
    expect(rivalRatio({ names: 0.5 }, 1, 'names')).toBeCloseTo(0.55, 3);
    expect(rivalRatio({ names: 0.99 }, 1, 'names')).toBe(RIVAL.cap);
    expect(rivalRatio({}, 1, 'names')).toBeCloseTo(RIVAL.defaultRatio * 1.1, 3);
    expect(rivalRatio({ strikes: 0.6 }, 3, 'strikes')).toBeCloseTo(0.51, 3); // the scripted stumble
    expect(rivalRatio({ names: 0.6 }, 3, 'names')).toBeCloseTo(0.624, 3);
    expect(rivalRatio({ words: 0.6 }, 5, 'words')).toBeCloseTo(0.582, 3);
  });
  it('a tier counts only results played at its scale, closes when enough are posted, and then opens the next', () => {
    const p = season();
    post(p, 'names', 1, 0.7, 1);
    post(p, 'poem', 2, 0.7, 1); // wrong scale for tier 1: kept as a best, not posted
    post(p, 'cards', 1, 0.7, 2); // wrong tier: not posted
    expect(Object.keys(p.events.season.posted)).toEqual(['names']);
    expect(canClose(p)).toBe(false);
    post(p, 'poem', 1, 0.6, 1); post(p, 'cards', 1, 0.8, 1);
    expect(canClose(p)).toBe(true);
    const res = closeTier(p);
    expect(res.tier).toBe(1);
    expect(res.marks.length).toBe(3);
    expect(['beat', 'hers', 'close']).toContain(res.verdict);
    expect(p.events.season.tier).toBe(2);
    expect(p.events.season.posted).toEqual({});
    expect(Object.keys(p.events.season.marks['1']).length).toBe(3);
    expect(closeTier(p)).toBe(null);
  });
  it('the rival mark is only shown for events the player has posted', () => {
    const p = season();
    expect(tierMarks(p)).toEqual([]);
    post(p, 'names', 1, 0.2, 1);
    expect(tierMarks(p).map((m) => m.id)).toEqual(['names']);
    expect(tierMarks(p)[0].win).toBe(false);
  });
  it('walks all four tiers and reaches the Final', () => {
    const p = season();
    for (let t = 1; t <= 4; t++) {
      for (const id of tierEvents(t).slice(0, tierDef(t).need)) post(p, id, levelFor(t, id), 0.5, t);
      expect(closeTier(p).tier).toBe(t);
    }
    expect(p.events.season.tier).toBe(5);
    expect(Object.keys(p.events.season.snap).length).toBe(7);
  });
  it('verdict reads the gap between your marks and hers', () => {
    expect(verdict([{ me: 0.9, her: 0.8 }])).toBe('beat');
    expect(verdict([{ me: 0.5, her: 0.8 }])).toBe('hers');
    expect(verdict([{ me: 0.8, her: 0.81 }])).toBe('close');
  });
  const finalFor = (ratios) => {
    const p = season();
    p.events.season.tier = 5;
    for (const id of SEASON_EVENTS) { const lv = FINAL.at[id]; if (ratios[id] != null) post(p, id, lv, ratios[id]); }
    p.events.season.snap = Object.fromEntries(SEASON_EVENTS.map((id) => [id, bestRatio(p, id, FINAL.at[id])]));
    return p;
  };
  const base = { names: 0.7, numbers: 0.6, cards: 0.6, poem: 0.7, words: 0.6, strikes: 0.6, decks: 0.6 };
  it('the Final: without improving you hold the three she should lose, and one improvement wins it', () => {
    const p = finalFor(base);
    let lamps = finalLamps(p);
    expect(lamps.filter((l) => l.lit).map((l) => l.id).sort()).toEqual(['decks', 'strikes', 'words']);
    expect(finalWon(lamps)).toBe(false);
    post(p, 'names', FINAL.at.names, 0.85);
    lamps = finalLamps(p);
    expect(finalWon(lamps)).toBe(true);
    expect(playFinal(p)).toMatchObject({ won: true, count: 4 });
    expect(p.events.season.won).toBe(today(p));
    expect(finalLamps(p).map((l) => l.her)).toEqual(lamps.map((l) => l.her)); // the same marks for her on a replay
  });
  it('losing the Final locks nothing: any replay is allowed and it can be won later', () => {
    const p = finalFor(base);
    expect(playFinal(p)).toMatchObject({ won: false, count: 3 });
    expect(p.events.season.won).toBe(null);
    expect(p.events.season.tier).toBe(5);
    post(p, 'poem', FINAL.at.poem, 0.9);
    expect(playFinal(p).won).toBe(true);
  });
  it('a small improvement on one of her four events always wins when the player holds the other three lamps', () => {
    const r = rng(11);
    for (let i = 0; i < 200; i++) {
      const ratios = Object.fromEntries(SEASON_EVENTS.map((id) => [id, 0.3 + r() * 0.6]));
      const p = finalFor(ratios);
      const pick = ['names', 'numbers', 'cards', 'poem'].sort((a, b) => ratios[a] - ratios[b])[0];
      const lv = FINAL.at[pick], max = maxOf(pick, lv);
      postResult(p, pick, lv, Math.min(max, Math.ceil((bestRatio(p, pick, lv) * 1.04 + 0.01) * max)), max, today(p));
      const lamps = finalLamps(p);
      expect(lamps.find((l) => l.id === pick).lit, `improved ${pick} ${ratios[pick].toFixed(2)}`).toBe(true);
      for (const id of ['words', 'strikes', 'decks']) expect(lamps.find((l) => l.id === id).lit).toBe(true);
      expect(finalWon(lamps)).toBe(true);
    }
  });
  it('Chronolog entries open with the Season', () => {
    const p = fresh();
    expect(eventLoreOpen(p, '1')).toBe(false);
    expect(codexFor(p).filter((e) => e.unlock.startsWith('events:') && e.open).length).toBe(0);
    startSeason(p); p.events.season.tier = 2;
    expect(eventLoreOpen(p, '1')).toBe(true);
    expect(eventLoreOpen(p, 'cup')).toBe(false);
    p.events.season.won = today(p);
    expect(codexFor(p).filter((e) => e.unlock.startsWith('events:') && e.open).length).toBe(EVENT_LORE.length);
  });
});

describe('saved record', () => {
  it('migrates old saves, round-trips, and rejects bad or oversized records', () => {
    const p = fresh();
    delete p.events;
    migrate(p);
    expect(p.events).toEqual(blankEvents());
    startSeason(p);
    post(p, 'names', 1, 0.5, 1);
    const r = parseImport(buildExport(p));
    expect(r.ok).toBe(true);
    expect(r.profile.events.best.names[1].score).toBe(12);
    expect(r.profile.events.season.tier).toBe(1);
    // a backup with no record at all is given a blank one
    const old = JSON.parse(buildExport(p)); delete old.profile.events;
    const r2 = parseImport(JSON.stringify(old));
    expect(r2.ok).toBe(true);
    expect(r2.profile.events).toEqual(blankEvents());
    const v = (e) => validateProfile({ ...p, events: e });
    expect(v({ ...p.events, best: { nope: null } })).toMatch(/Event/);
    expect(v({ ...p.events, best: { names: { 9: { score: 1, max: 2, date: today(p) } } } })).toMatch(/Event/);
    expect(v({ ...p.events, best: { names: { 1: { score: 5, max: 2, date: today(p) } } } })).toMatch(/Event/);
    expect(v({ ...p.events, best: { names: { 1: { score: 1, max: 2, date: 'soon' } } } })).toMatch(/Event/);
    expect(v({ ...p.events, pace: 'yes' })).toMatch(/Event/);
    expect(v({ ...p.events, history: Array.from({ length: HISTORY_CAP + 1 }, () => ({ date: today(p), ev: 'names', lv: 1, score: 1, max: 2 })) })).toMatch(/history/);
    expect(v({ ...p.events, history: [{ date: today(p), ev: 'bogus', lv: 1, score: 1, max: 2 }] })).toMatch(/history/);
    expect(v({ ...p.events, season: { ...p.events.season, tier: 9 } })).toMatch(/Season/);
    expect(v({ ...p.events, season: { ...p.events.season, snap: { names: 2 } } })).toMatch(/Season/);
    expect(v({ ...p.events, season: { ...p.events.season, marks: { 1: { names: [0.5] } } } })).toMatch(/Season/);
    expect(v('nope')).toMatch(/Event/);
    expect(v(p.events)).toBe(null);
    // repair of a malformed record on load
    const bad = fresh(); bad.events = { best: 5, history: 'x', season: [] }; migrate(bad);
    expect(validateProfile(bad)).toBe(null);
    expect(bad.events.best.names).toBe(null);
    expect(ensureEvents(bad).season.posted).toEqual({});
  });
});

describe('Hall of Years and Reckoning trials', () => {
  it('are in the trial list with prizes, icons, art ids and gates', () => {
    expect(TRIALS.year_hall).toMatchObject({ gate: 'M7', prize: 'tr_year_tablet', art: 'trial_year_hall' });
    expect(TRIALS.reckoning).toMatchObject({ gate: 'M8', prize: 'tr_tally_stick', art: 'trial_reckoning' });
    for (const id of ['tr_year_tablet', 'tr_tally_stick']) { expect(ITEM_BY_ID[id].source.type).toBe('trial'); expect(ICONS[id]).toBeTruthy(); }
    expect(TRIAL_IDS).toContain('year_hall');
    expect(YEAR_POOL.length).toBe(12);
    for (const tl of YEAR_POOL) expect(tl.events.length).toBe(7);
  });
  it('year material asks the year, exact, and the Hall of Years needs 6 of 7 now and 5 of 7 after a week', () => {
    const p = fresh();
    const m = material('year_hall', 3, p);
    expect(m.items.length).toBe(7);
    expect(isRightTrial(m.items[0], m.items[0].answer)).toBe(true);
    expect(isRightTrial(m.items[0], String(parseInt(m.items[0].answer, 10) + 1))).toBe(false);
    const t0 = today(p);
    const ans = (n) => Object.fromEntries(m.items.map((it, i) => [it.key, i < n ? it.answer : 'x']));
    startTrial(p, 'year_hall', 3, t0);
    expect(submitCheck(p, 'year_hall', ans(5), {}, t0)).toMatchObject({ passed: false, final: true });
    expect(trialState(p, 'year_hall', t0)).toBe('rest');
    const t1 = addDays(t0, 1);
    startTrial(p, 'year_hall', 3, t1);
    const stage = submitCheck(p, 'year_hall', ans(6), {}, t1);
    expect(stage).toMatchObject({ passed: false, stage: true, practice: true });
    expect(p.trials.year_hall.passed).toBeUndefined();
    expect(trialState(p, 'year_hall', addDays(t1, 3))).toBe('waiting');
    const t8 = addDays(t1, 7);
    expect(trialState(p, 'year_hall', t8)).toBe('due');
    expect(submitCheck(p, 'year_hall', ans(5), {}, t8)).toMatchObject({ passed: true });
    expect(trialState(p, 'year_hall', t8)).toBe('done');
  });
  it('Reckoning has three facts to study, seven sums and the facts asked back; 9 of 10 passes', () => {
    const p = fresh();
    const m = material('reckoning', 5, p);
    expect(m.study.length).toBe(3);
    expect(m.items.length).toBe(10);
    expect(JSON.stringify(m)).toBe(JSON.stringify(material('reckoning', 5, p)));
    for (const it of m.items) { expect(isRightTrial(it, it.answer)).toBe(true); expect(isRightTrial(it, '0.123')).toBe(false); }
    const snap = JSON.stringify({ skills: p.skills, results: p.results, sets: p.sets });
    const t0 = today(p);
    startTrial(p, 'reckoning', 5, t0);
    const ok = Object.fromEntries(m.items.map((it, i) => [it.key, i === 0 ? '1' : it.answer]));
    expect(submitCheck(p, 'reckoning', ok, {}, t0)).toMatchObject({ passed: true, n: 9, total: 10 });
    expect(JSON.stringify({ skills: p.skills, results: p.results, sets: p.sets })).toBe(snap);
  });
});
