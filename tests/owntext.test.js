import { describe, it, expect } from 'vitest';
import { newProfile, today } from '../src/engine/core.js';
import { addDays } from '../src/engine/util.js';
import { buildExport, parseImport, migrate, validateProfile } from '../src/store.js';
import { betaReport, problemReport } from '../src/engine/beta.js';
import {
  CAPS, sanitize, chunk, joinSections, splitSection, tokens, checkLine, missingNote, firstLetters, lineStart, stagesFor, newText, recordCheck,
  dueSections, sitting, validateOwn, buildTextsExport, importTexts, importWarning, speakers, rolesOf, hiddenMask, askedPart, isNoSpace, blankOwn, OWN_INTERVALS,
} from '../src/engine/owntext.js';

const fresh = () => newProfile('t', 'key');
// Written with code points so this file stays plain ASCII.
const A = (...cp) => String.fromCodePoint(...cp);
const ARABIC = A(0x628, 0x633, 0x645, 0x20, 0x627, 0x644, 0x644, 0x647) + ' ' + A(0x627, 0x644, 0x631, 0x62D, 0x645, 0x646);
const HEBREW = A(0x5E9, 0x5DC, 0x5D5, 0x5DD, 0x20, 0x5E2, 0x5D5, 0x5DC, 0x5DD);
const HINDI = A(0x92E, 0x938, 0x94D, 0x924, 0x947, 0x20, 0x938, 0x924, 0x94D, 0x92F, 0x92E, 0x94D);
const CHINESE = A(0x5E8A, 0x524D, 0x660E, 0x6708, 0x5149, 0x3002, 0x7591, 0x662F, 0x5730, 0x4E0A, 0x971C, 0x3002);
const POEM = ['The lamp is lit above the stair,', 'a slow moth circles in the light,', 'the clock says nothing, being old,', 'and all the house is warm tonight.', '', 'The river hums beyond the wall,', 'the kettle answers, low and kind,', 'and every word we meant to say', 'is folded safely in the mind.'].join('\n');

function withText(raw = POEM, opts = {}) {
  const p = fresh();
  p.own.texts.push(newText({ title: 'A poem', sections: chunk(raw), ...opts }, today(p)));
  return p;
}
const lines = (p) => p.own.texts[0].sections[0].lines;
const learn = (p, text = p.own.texts[0], sec = text.sections[0]) => recordCheck(p, text.id, sec.id, lines(p).map(() => true), { date: today(p), typed: true });

describe('Your Own Text: saved data', () => {
  it('a new profile has an empty shelf', () => { expect(fresh().own).toEqual({ v: 1, texts: [], history: [] }); });
  it('migrate adds and repairs the record', () => {
    for (const bad of [undefined, null, [], 'x', { texts: 'no' }]) { const p = fresh(); p.own = bad; expect(migrate(p).own).toEqual(blankOwn()); }
    const p = fresh(); p.own = { texts: [] }; const m = migrate(p); expect(m.own.history).toEqual([]); expect(m.own.v).toBe(1);
  });
  it('accepts valid texts in Latin, Arabic, Hebrew, Devanagari and Chinese', () => {
    const p = fresh();
    for (const raw of [POEM, ARABIC, HEBREW, HINDI, CHINESE]) p.own.texts.push(newText({ title: 't', sections: chunk(raw), dir: raw === ARABIC || raw === HEBREW ? 'rtl' : 'auto', lang: 'xx' }, today(p)));
    expect(validateOwn(p.own)).toBeNull();
    expect(validateProfile(p)).toBeNull();
  });
  it('rejects bad records', () => {
    const mk = () => withText();
    const bad = [
      (p) => { p.own.texts[0].sections[0].lines = ['x'.repeat(CAPS.charsPerLine + 1)]; },
      (p) => { p.own.texts[0].exact = 'strict'; },
      (p) => { p.own.texts[0].created = 'yesterday'; },
      (p) => { p.own.texts[0].sections[0].lines = [5]; },
      (p) => { p.own.texts[0].sections[0].lines = []; },
      (p) => { p.own.texts.push({ ...p.own.texts[0] }); },
      (p) => { p.own.history.push({ date: '2026-01-01', text: 'a', held: 5, of: 3 }); },
      (p) => { p.own.texts[0].sections[0].stage = 9; },
      (p) => { p.own.texts[0].sections = Array.from({ length: CAPS.sections + 1 }, (_, i) => ({ id: 's' + i, lines: ['a'], stage: 0, sched: null })); },
      (p) => { p.own.texts[0].sections[0].sched = { created: '2026-01-01', due: 'x', idx: 0, immediate: 1, misses: 0, history: [], retired: false }; },
      (p) => { p.own.texts = Array.from({ length: CAPS.texts + 1 }, (_, i) => ({ ...p.own.texts[0], id: 't' + i })); },
      (p) => { p.own = []; },
    ];
    for (const f of bad) { const p = mk(); f(p); expect(validateOwn(p.own), f.toString()).toBeTruthy(); expect(parseImport(buildExport(p)).ok).toBe(false); }
  });
  it('rejects a text over the character cap', () => {
    const p = fresh();
    const big = Array.from({ length: 80 }, (_, i) => ({ id: 's' + i, lines: Array.from({ length: 40 }, () => 'y'.repeat(400)), stage: 0, sched: null }));
    p.own.texts.push({ ...newText({ title: 'big', sections: [{ lines: ['a'] }] }, today(p)), sections: big });
    expect(validateOwn(p.own)).toBeTruthy();
  });
  it('round-trips through a backup byte for byte', () => {
    const p = withText(ARABIC + '\n' + HEBREW);
    learn(p);
    const r = parseImport(buildExport(p));
    expect(r.ok).toBe(true);
    expect(JSON.stringify(r.profile.own)).toBe(JSON.stringify(p.own));
  });
  it('loads a 1.0 backup that has no own field', () => {
    const p = fresh(); delete p.own;
    const r = parseImport(buildExport(p));
    expect(r.ok).toBe(true);
    expect(r.profile.own).toEqual(blankOwn());
  });
  it('refuses an oversized file', () => { expect(parseImport('x'.repeat(5 * 1024 * 1024 + 10)).ok).toBe(false); });
  it('never reaches the beta or problem report', () => {
    const p = withText(); learn(p);
    const rep = JSON.stringify(betaReport(p, '1.1.0', {})) + problemReport({ version: '1.1.0', page: 'Keeper', what: '', env: {} });
    expect(rep).not.toMatch(/moth circles/);
    expect(rep).not.toMatch(/"own"/);
  });
});

describe('Your Own Text: paste safety and cutting', () => {
  it('strips control and bidirectional override characters, keeps direction marks', () => {
    const dirty = 'a' + A(0x202E) + 'b' + A(0x7) + 'c\td' + A(0x200F) + A(0x2066) + 'e';
    expect(sanitize(dirty)).toBe('abc d' + A(0x200F) + 'e');
  });
  it('cuts at blank lines', () => { const s = chunk(POEM); expect(s).toHaveLength(2); expect(s[0].lines).toHaveLength(4); });
  it('cuts every 4 lines when there are no blank lines', () => {
    const s = chunk(Array.from({ length: 10 }, (_, i) => 'line number ' + i).join('\n'));
    expect(s.map((x) => x.lines.length)).toEqual([4, 4, 2]);
  });
  it('cuts one long paragraph at sentence ends, three to a section', () => {
    const s = chunk('One. Two! Three? Four. Five. Six. Seven.');
    expect(s.map((x) => x.lines.length)).toEqual([3, 3, 1]);
    expect(chunk(CHINESE)[0].lines.length).toBeGreaterThan(1);
  });
  it('never makes a line over 400 or a section over 40 lines', () => {
    const s = chunk('word '.repeat(300));
    expect(s.every((x) => x.lines.every((l) => l.length <= CAPS.charsPerLine))).toBe(true);
    const t = chunk(Array.from({ length: 95 }, (_, i) => 'l' + i).join('\n') + '\n\nlast');
    expect(t.every((x) => x.lines.length <= CAPS.linesPerSection)).toBe(true);
  });
  it('lets the player join and split', () => {
    const s = chunk(POEM);
    expect(joinSections(s, 0)).toHaveLength(1);
    expect(splitSection(s, 0, 2)).toHaveLength(3);
  });
});

describe('Your Own Text: the checker', () => {
  it('compares Latin text, ignoring case and punctuation', () => {
    expect(checkLine('The lamp is lit, above the stair', 'The lamp is lit above the stair,', 'exact').ok).toBe(true);
    expect(checkLine('the lamp is lit above the stairs', 'The lamp is lit above the stair', 'exact').ok).toBe(false);
    expect(checkLine('dont stop', "Don't stop", 'exact').ok).toBe(true);
  });
  it('close allows a small slip, gist allows missing words', () => {
    const line = 'a slow moth circles in the light';
    expect(checkLine('a slow moth circls in the light', line, 'close').ok).toBe(true);
    expect(checkLine('moth circles in the light', line, 'close').ok).toBe(false);
    expect(checkLine('slow moth circles in the light', line, 'gist').ok).toBe(true);
    expect(checkLine('completely different words here now', line, 'gist').ok).toBe(false);
  });
  it('works for Arabic, Hebrew, Devanagari and Chinese (the old normalizer would call all of them wrong)', () => {
    for (const s of [ARABIC, HEBREW, HINDI, CHINESE]) { expect(tokens(s).length).toBeGreaterThan(0); expect(checkLine(s, s, 'exact').ok).toBe(true); }
    expect(checkLine(ARABIC, HEBREW, 'close').ok).toBe(false);
    expect(isNoSpace(CHINESE)).toBe(true);
    expect(isNoSpace(ARABIC)).toBe(false);
  });
  it('ignores vowel marks and accents only when asked', () => {
    const arabicMarked = ARABIC.replace(A(0x628), A(0x628, 0x650));
    expect(checkLine(arabicMarked, ARABIC, 'exact', false).ok).toBe(false);
    expect(checkLine(arabicMarked, ARABIC, 'exact', true).ok).toBe(true);
    const hebPoints = HEBREW.replace(A(0x5E9), A(0x5E9, 0x5C1));
    expect(checkLine(HEBREW, hebPoints, 'exact', true).ok).toBe(true);
    expect(checkLine('cafe', 'caf' + A(0xE9), 'exact', true).ok).toBe(true);
    expect(checkLine('cafe', 'caf' + A(0xE9), 'exact', false).ok).toBe(false);
  });
  it('treats decomposed and precomposed accents as the same', () => {
    expect(checkLine('cafe' + A(0x301), 'caf' + A(0xE9), 'exact', false).ok).toBe(true);
  });
  it('never removes Devanagari vowel signs', () => {
    const noSign = HINDI.replace(A(0x947), '');
    expect(checkLine(noSign, HINDI, 'exact', true).ok).toBe(false);
  });
  it('ignores a leading verse number', () => { expect(checkLine('lamp is lit', '12. Lamp is lit', 'exact').ok).toBe(true); });
  it('reports which words were missing in plain words', () => {
    const r = checkLine('the lamp lit above the stair', 'the lamp is lit above the stair', 'exact');
    expect(r.missing).toEqual([3]);
    expect(missingNote(r.missing)).toMatch(/3rd word was missing/);
  });
  it('an empty answer is wrong, an empty stored line is fine', () => {
    expect(checkLine('', 'something', 'gist').ok).toBe(false);
    expect(checkLine('x', '...', 'exact').ok).toBe(true);
  });
  it('cues: first letters and line starts, with the fallback for scripts without spaces', () => {
    expect(firstLetters('The lamp is lit')).toMatch(/^T.* l.* i.* l.*$/);
    expect(lineStart('The lamp is lit')).toMatch(/^The/);
    expect(firstLetters(CHINESE)).toHaveLength(2);
    expect(stagesFor({ lines: [CHINESE] })).toEqual(['read', 'letters', 'blank']);
    expect(stagesFor({ lines: ['hello'] })).toHaveLength(4);
  });
});

describe('Your Own Text: schedule', () => {
  it('a section starts at 80 percent and is first due tomorrow', () => {
    const p = withText();
    const sec = p.own.texts[0].sections[0];
    const weak = recordCheck(p, p.own.texts[0].id, sec.id, [true, false, false, false], { date: today(p), typed: true });
    expect(weak.started).toBe(false); expect(sec.sched).toBeNull();
    const r = learn(p);
    expect(r.started).toBe(true);
    expect(sec.sched.due).toBe(addDays(today(p), 1)); expect(sec.sched.idx).toBe(0);
  });
  it('a pass moves along 1, 7, 30, 90, 180 and then the section is kept', () => {
    const p = withText(); learn(p);
    const t = p.own.texts[0], sec = t.sections[0];
    const start = today(p);
    const seen = [];
    for (let k = 0; k < OWN_INTERVALS.length; k++) {
      const day = sec.sched.due;
      seen.push(day);
      recordCheck(p, t.id, sec.id, [true, true, true, true], { date: day, typed: false });
    }
    expect(seen).toEqual(OWN_INTERVALS.map((n) => addDays(start, n)));
    expect(sec.sched.retired).toBe(true);
    expect(dueSections(p.own, addDays(start, 400))).toHaveLength(0);
  });
  it('a miss is gentle: same place, due tomorrow; a second miss drops one step but never to zero', () => {
    const p = withText(); learn(p);
    const t = p.own.texts[0], sec = t.sections[0], start = today(p);
    recordCheck(p, t.id, sec.id, [true, true, true, true], { date: addDays(start, 1) });
    recordCheck(p, t.id, sec.id, [true, true, true, true], { date: addDays(start, 7) });
    expect(sec.sched.idx).toBe(2);
    recordCheck(p, t.id, sec.id, [false, false, true, true], { date: addDays(start, 30) });
    expect(sec.sched.idx).toBe(2); expect(sec.sched.due).toBe(addDays(start, 31));
    recordCheck(p, t.id, sec.id, [false, false, false, true], { date: addDays(start, 31) });
    expect(sec.sched.idx).toBe(1);
    recordCheck(p, t.id, sec.id, [false, false, false, false], { date: addDays(start, 32) });
    expect(sec.sched.idx).toBe(1);
    expect(sec.sched.retired).toBe(false);
  });
  it('exact needs every line, gist is looser', () => {
    const p = withText(POEM, { exact: 'exact' }); learn(p);
    const t = p.own.texts[0], sec = t.sections[0];
    expect(recordCheck(p, t.id, sec.id, [true, true, true, false], { date: addDays(today(p), 1) }).passed).toBe(false);
    const g = withText(POEM, { exact: 'gist' }); learn(g);
    expect(recordCheck(g, g.own.texts[0].id, 's1', [true, true, true, false], { date: addDays(today(g), 1) }).passed).toBe(true);
  });
  it('asks the oldest three at most, or one on a tired day', () => {
    const p = fresh();
    p.own.texts.push(newText({ title: 'long', sections: Array.from({ length: 5 }, (_, i) => ({ lines: ['a b c d e', 'f g h i j', 'k l m n o', 'p q r s t'].map((l) => l + i) })) }, today(p)));
    for (const s of p.own.texts[0].sections) recordCheck(p, p.own.texts[0].id, s.id, [true, true, true, true], { date: today(p), typed: false });
    const day = addDays(today(p), 2);
    expect(dueSections(p.own, day)).toHaveLength(5);
    expect(sitting(p.own, day)).toHaveLength(3);
    expect(sitting(p.own, day, true)).toHaveLength(1);
    expect(dueSections(p.own, today(p))).toHaveLength(0);
  });
});

describe('Your Own Text: Lumen and what it never changes', () => {
  const week = (p) => addDays(today(p), 7);
  const ready = () => { const p = withText(); learn(p); const t = p.own.texts[0], s = t.sections[0]; recordCheck(p, t.id, s.id, [true, true, true, true], { date: addDays(today(p), 1), typed: true }); return { p, t, s }; };
  it('a typed check that holds after 7 days or more earns a small amount, once for that step', () => {
    const { p, t, s } = ready();
    const before = p.progress.lumen;
    const r = recordCheck(p, t.id, s.id, [true, true, true, true], { date: week(p), typed: true });
    expect(r.lumen).toBe(8); expect(p.progress.lumen).toBe(before + 8);
    expect(s.sched.paid).toEqual([1]);
    // the same step passed again does not pay twice
    s.sched.idx = 1; s.sched.due = week(p);
    expect(recordCheck(p, t.id, s.id, [true, true, true, true], { date: week(p), typed: true }).lumen).toBe(0);
  });
  it('earns nothing for the first day, a said check, a missed check, or a tiny section', () => {
    const { p, t, s } = ready();
    expect(p.progress.lumen).toBe(0);
    expect(recordCheck(p, t.id, s.id, [true, true, true, true], { date: week(p), typed: false }).lumen).toBe(0);
    const q = withText('a\nb\nc\nd'); learn(q); const tt = q.own.texts[0], ss = tt.sections[0];
    recordCheck(q, tt.id, ss.id, [true, true, true, true], { date: addDays(today(q), 1), typed: true });
    expect(recordCheck(q, tt.id, ss.id, [true, true, true, true], { date: week(q), typed: true }).lumen).toBe(0);
    const m = ready();
    expect(recordCheck(m.p, m.t.id, m.s.id, [false, false, false, false], { date: week(m.p), typed: true }).lumen).toBe(0);
  });
  it('stays inside the shared daily practice cap', () => {
    const { p, t, s } = ready();
    p.progress.freeXp = { date: week(p), xp: 46 };
    const r = recordCheck(p, t.id, s.id, [true, true, true, true], { date: week(p), typed: true });
    expect(r.lumen).toBe(4); expect(p.progress.freeXp.xp).toBe(50);
  });
  it('never touches skills, results or sets', () => {
    const p = withText(); const before = JSON.stringify([p.skills, p.results, p.sets, p.achievements, p.battles]);
    learn(p); const t = p.own.texts[0], s = t.sections[0];
    recordCheck(p, t.id, s.id, [true, true, true, true], { date: addDays(today(p), 1), typed: true });
    recordCheck(p, t.id, s.id, [true, true, true, true], { date: week(p), typed: true });
    expect(JSON.stringify([p.skills, p.results, p.sets, p.achievements, p.battles])).toBe(before);
  });
});

describe('Your Own Text: texts-only file and import warning', () => {
  it('exports and merges without overwriting', () => {
    const a = withText(); learn(a);
    const file = buildTextsExport(a.own);
    const b = fresh();
    const r1 = importTexts(b.own, file);
    expect(r1.ok).toBe(true); expect(r1.added).toBe(1);
    b.own = r1.own;
    expect(JSON.stringify(b.own.texts)).toBe(JSON.stringify(a.own.texts));
    const r2 = importTexts(b.own, file);
    expect(r2.added).toBe(0); expect(r2.skipped).toBe(1); expect(r2.own.texts).toHaveLength(1);
  });
  it('refuses other files and bad texts', () => {
    expect(importTexts(blankOwn(), '{"app":"mnemos","texts":[]}').ok).toBe(false);
    expect(importTexts(blankOwn(), 'nope').ok).toBe(false);
    expect(importTexts(blankOwn(), JSON.stringify({ app: 'mnemos-texts', schema: 1, texts: [{ id: 'x' }] })).ok).toBe(false);
  });
  it('warns before an import would remove texts on the device', () => {
    const a = withText();
    expect(importWarning(a.own, blankOwn())).toMatch(/no texts/);
    expect(importWarning(blankOwn(), blankOwn())).toBeNull();
    expect(importWarning(a.own, a.own)).toBeNull();
    const b = withText(); expect(importWarning(a.own, b.own)).toMatch(/replace/);
  });
});

describe('Your Own Text: role mode', () => {
  const PLAY = 'ROSALIND: Well met.\nCELIA: And well parted.\nA second line of Celia.\nROSALIND: Shall we go?';
  it('finds speakers, carries a label down to unlabelled lines, and hides only the chosen role', () => {
    const sec = chunk(PLAY)[0];
    expect(speakers(sec.lines).map((x) => x.who)).toEqual(['ROSALIND', 'CELIA', 'CELIA', 'ROSALIND']);
    expect(rolesOf([sec])).toEqual(['ROSALIND', 'CELIA']);
    const text = { roleMode: true, role: 'ROSALIND' };
    expect(hiddenMask(text, sec)).toEqual([true, false, false, true]);
    expect(askedPart(text, sec.lines[0])).toBe('Well met.');
    expect(hiddenMask({ roleMode: false }, sec)).toEqual([true, true, true, true]);
  });
  it('scores only the player lines', () => {
    const p = fresh();
    p.own.texts.push(newText({ title: 'play', roleMode: true, role: 'ROSALIND', sections: chunk(PLAY) }, today(p)));
    const t = p.own.texts[0];
    const r = recordCheck(p, t.id, 's1', [true, true], { date: today(p), typed: true });
    expect(r.of).toBe(2); expect(r.started).toBe(true);
    expect(validateOwn(p.own)).toBeNull();
  });
});
