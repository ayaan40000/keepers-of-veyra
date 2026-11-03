// 1.1 Your Own Text. The player pastes their own text; Mnemos cuts it into sections, hides it a little at a time
// and asks again after 1, 7, 30, 90 and 180 days. The text never leaves the browser.
// Pure logic only. It has its own Unicode-aware checker: the old normalize() in util.js keeps only a to z and 0 to 9,
// so it would call every answer in Arabic, Hebrew, Hindi or Chinese wrong. Do not use it here.
import { addDays, daysBetween, uid } from './util.js';

export const OWN_INTERVALS = [1, 7, 30, 90, 180];
export const CAPS = { texts: 20, charsPerText: 30000, totalChars: 300000, sections: 120, linesPerSection: 40, charsPerLine: 400, history: 200, sectionHistory: 12, record: 1500000, title: 80, label: 80, note: 200, role: 30 };
export const PASS_LEVEL = { gist: 0.7, close: 0.85, exact: 0.95 };
export const START_LEVEL = 0.8;               // the Blank step must reach this before a section enters the schedule
export const SITTING_MAX = 3;                 // checks asked in one sitting
export const NEW_PER_DAY = 2;                 // soft suggestion only
// Lumen (owner decision, Nov 2, 2026): a small amount, only for a TYPED delayed check of 7 days or more that held,
// on a section of real size, once per interval per section, inside the shared daily free-practice cap.
export const OWN_LUMEN = { 7: 8, 30: 12 };
export const MIN_REWARD_LINES = 3;
export const MIN_REWARD_WORDS = 15;

export const blankOwn = () => ({ v: 1, texts: [], history: [] });

// ---------- paste safety ----------
// NFC, tabs to spaces, control characters and bidirectional override or isolate characters removed.
// The direction marks U+200E and U+200F stay, because right-to-left text uses them.
export function sanitize(raw) {
  return String(raw ?? '')
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/g, '');
}

// ---------- script helpers ----------
const NOSPACE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}\p{Script=Lao}\p{Script=Khmer}\p{Script=Myanmar}]/gu;
// True when most letters belong to a script written without spaces between words.
export function isNoSpace(s) {
  const letters = (String(s).match(/\p{L}/gu) || []).length;
  if (!letters) return false;
  return (String(s).match(NOSPACE) || []).length / letters > 0.5;
}

export function graphemes(s) {
  const str = String(s);
  if (typeof Intl !== 'undefined' && Intl.Segmenter) return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(str), (x) => x.segment);
  return str.match(/\P{M}\p{M}*/gu) || []; // fallback: one code point plus any combining marks
}
export const firstGrapheme = (w) => graphemes(w)[0] || '';

// ---------- chunking ----------
const SENTENCE_END = /(?<=[.!?\u3002\uFF01\uFF1F\u061F\u0964\u0965\u06D4])\s*/u;

// Cut a very long line at the nearest comma or space at or before the cap.
function capLine(line, max = CAPS.charsPerLine) {
  const out = [];
  let rest = line;
  while (rest.length > max) {
    const at = Math.max(rest.lastIndexOf(',', max - 1), rest.lastIndexOf('\u060C', max - 1), rest.lastIndexOf(' ', max - 1));
    const cut = at < max / 2 ? max : at + 1;
    out.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) out.push(rest);
  return out.filter(Boolean);
}

function evenPieces(lines, max) {
  if (lines.length <= max) return [lines];
  const n = Math.ceil(lines.length / max), size = Math.ceil(lines.length / n), out = [];
  for (let i = 0; i < lines.length; i += size) out.push(lines.slice(i, i + size));
  return out;
}

// Auto rules: a blank line starts a section; with no blank lines, 4 lines a section; with no line breaks at all,
// cut at sentence ends and group 3 sentences. A section is never longer than 40 lines.
export function chunk(raw) {
  const text = sanitize(raw).trim();
  if (!text) return [];
  const paras = text.split(/\n\s*\n/).map((p) => p.split('\n').map((l) => l.trim()).filter(Boolean).flatMap((l) => capLine(l))).filter((p) => p.length);
  let sections;
  if (paras.length > 1) {
    sections = paras.flatMap((p) => evenPieces(p, CAPS.linesPerSection));
  } else {
    let lines = paras[0] || [];
    if (lines.length === 1) {
      const sentences = lines[0].split(SENTENCE_END).map((s) => s.trim()).filter(Boolean).flatMap((s) => capLine(s));
      lines = sentences.length ? sentences : lines;
      sections = [];
      const per = lines.length > 3 ? 3 : lines.length;
      for (let i = 0; i < lines.length; i += per) sections.push(lines.slice(i, i + per));
    } else {
      sections = [];
      for (let i = 0; i < lines.length; i += 4) sections.push(lines.slice(i, i + 4));
      // a last piece of one line joins the one before it, unless that would pass the line cap
      const n = sections.length;
      if (n > 1 && sections[n - 1].length === 1 && sections[n - 2].length < CAPS.linesPerSection) sections[n - 2].push(...sections.pop());
    }
  }
  return sections.map((lines, i) => ({ id: 's' + (i + 1), lines }));
}

export const joinSections = (secs, i) => (i < 0 || i >= secs.length - 1 ? secs : [...secs.slice(0, i), { ...secs[i], lines: [...secs[i].lines, ...secs[i + 1].lines].slice(0, CAPS.linesPerSection) }, ...secs.slice(i + 2)]);
// Start a new section before line j of section i.
export const splitSection = (secs, i, j) => (j <= 0 || j >= secs[i].lines.length ? secs : [...secs.slice(0, i), { ...secs[i], lines: secs[i].lines.slice(0, j) }, { id: 'x', lines: secs[i].lines.slice(j) }, ...secs.slice(i + 1)]);
export const renumber = (secs) => secs.map((s, i) => ({ ...s, id: 's' + (i + 1) }));

// ---------- roles (lines of a play) ----------
const SPEAKER = /^([^:\n]{1,30}):\s*(.*)$/u;
// Speaker of each line in a section: a line that begins "NAME:" names the speaker; a line without a label
// continues the speaker above it in the same section. Returns [{who, body}] (who is '' when unknown).
export function speakers(lines) {
  let who = '';
  return lines.map((l) => {
    const m = SPEAKER.exec(l);
    if (m && m[1].trim() && m[1].trim().split(/\s+/).length <= 4) { who = m[1].trim(); return { who, body: m[2], label: m[1].trim() + ':' }; }
    return { who, body: l, label: '' };
  });
}
export function rolesOf(sections) {
  const set = new Set();
  for (const s of sections) for (const x of speakers(s.lines)) if (x.who) set.add(x.who);
  return [...set].slice(0, 12);
}
// Does a line need to be remembered by the player? Without role mode, every line. With it, only the chosen role's lines.
export function hiddenMask(text, section) {
  if (!text.roleMode || !text.role) return section.lines.map(() => true);
  return speakers(section.lines).map((x) => x.who === text.role);
}
// The part of a line the player is asked for (the label is shown as a cue, not asked).
export const askedPart = (text, line) => (text.roleMode ? (speakers([line])[0].body ?? line) : line);

// ---------- cues ----------
export const words = (line) => String(line).trim().split(/\s+/).filter(Boolean);
// First letters: each word shows its first grapheme and a mark. For scripts without spaces: the first character of the line.
export function firstLetters(line) {
  if (isNoSpace(line)) return firstGrapheme(line) + '\u2026';
  return words(line).map((w) => firstGrapheme(w) + '\u2026').join(' ');
}
export function lineStart(line) {
  if (isNoSpace(line)) return graphemes(line).slice(0, 2).join('') + '\u2026';
  return (words(line)[0] || '') + ' \u2026';
}
export const STAGES = ['read', 'letters', 'starts', 'blank'];
// Stages for a text. Without spaces between words, the Line starts step is dropped.
export function stagesFor(section) {
  return section.lines.some((l) => isNoSpace(l)) ? ['read', 'letters', 'blank'] : STAGES;
}

// ---------- the checker ----------
const MARKS = /[\u0300-\u036F\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0591-\u05C7]/g;

// Unicode-aware normal form of one line. Returns the tokens that are compared.
export function tokens(line, marks = false) {
  let s = String(line ?? '').normalize('NFKC');
  if (marks) s = s.normalize('NFD').replace(MARKS, '').normalize('NFC');
  s = s.toLowerCase();
  s = s.replace(/^[\s\p{P}]*\p{Nd}+[\s\p{P}]*/u, ' ');            // a leading verse number is not asked for
  s = s.replace(/[\u0027\u2019\u02BC]/g, '');                    // don't = dont
  s = s.replace(/[\u200E\u200F\u200B\uFEFF\u2060]/g, '');         // direction marks and zero-width spaces
  s = s.replace(/\s\u200D\s/g, ' ');
  s = s.replace(/[\p{P}\p{S}]/gu, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  if (!s) return [];
  return isNoSpace(s) ? Array.from(s.replace(/\s/g, '')) : s.split(' ');
}

function lcsPairs(a, b) {
  const n = a.length, m = b.length;
  const t = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) t[i][j] = a[i] === b[j] ? t[i + 1][j + 1] + 1 : Math.max(t[i + 1][j], t[i][j + 1]);
  const hit = new Set();
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { hit.add(i); i++; j++; } else if (t[i + 1][j] >= t[i][j + 1]) i++; else j++;
  }
  return hit;
}

function editDistance(a, b) {
  const x = Array.from(a), y = Array.from(b);
  let prev = Array.from({ length: y.length + 1 }, (_, j) => j);
  for (let i = 1; i <= x.length; i++) {
    const cur = [i];
    for (let j = 1; j <= y.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[y.length];
}

// Is the answer right for this stored line? Returns {ok, missing} where missing lists the 1-based positions of
// stored words that were left out or different (words, or characters for scripts without spaces).
export function checkLine(answer, stored, exact = 'close', marks = false) {
  const s = tokens(stored, marks), a = tokens(answer, marks);
  if (!s.length) return { ok: true, missing: [] };
  const hit = lcsPairs(s, a);
  const missing = s.map((_, i) => i + 1).filter((i) => !hit.has(i - 1));
  let ok;
  if (exact === 'exact') ok = s.length === a.length && s.every((w, i) => w === a[i]);
  else if (exact === 'gist') ok = hit.size >= 0.7 * s.length;
  else {
    const sj = s.join(' '), aj = a.join(' ');
    ok = !!a.length && editDistance(sj, aj) <= 0.1 * Math.max(Array.from(sj).length, Array.from(aj).length);
  }
  return { ok, missing };
}

// Plain-words note for a wrong line.
const nth = (n) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th')}`;
export function missingNote(missing, noSpace = false) {
  if (!missing.length) return 'Every word is there, but it is a little different.';
  const unit = noSpace ? 'character' : 'word';
  return `The ${missing.slice(0, 6).map(nth).join(', ')} ${unit}${missing.length > 1 ? 's were' : ' was'} missing or different${missing.length > 6 ? ', and more' : ''}.`;
}

// ---------- schedule ----------
const next = (iso, n) => addDays(iso, n);

export function startSched(date, immediate) {
  return { created: date, due: next(date, 1), idx: 0, immediate, misses: 0, history: [], retired: false, paid: [] };
}

// A check is one pass over a section. Gentle: a miss keeps the place; a second miss in a row drops one step (never to zero).
export function advanceSched(sch, passed, acc, date) {
  const delay = daysBetween(sch.created, date);
  const prevMissed = sch.history.length > 0 && !sch.history[sch.history.length - 1].pass;
  sch.history = [...sch.history, { date, acc: Math.round(acc * 1000) / 1000, pass: passed }].slice(-CAPS.sectionHistory);
  if (passed) {
    sch.idx = Math.min(OWN_INTERVALS.length, sch.idx + 1);
    if (sch.idx >= OWN_INTERVALS.length) sch.retired = true;
    else sch.due = [next(sch.created, OWN_INTERVALS[sch.idx]), next(date, 1)].sort().pop();
  } else {
    sch.misses = Math.min(99, sch.misses + 1);
    if (prevMissed && sch.idx > 0) sch.idx = Math.max(1, sch.idx - 1);
    sch.due = next(date, 1);
  }
  return { delay };
}

export function dueSections(own, date) {
  const out = [];
  for (const t of own.texts) for (const s of t.sections) if (s.sched && !s.sched.retired && s.sched.due <= date) out.push({ textId: t.id, sectionId: s.id, due: s.sched.due });
  return out.sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0));
}
export const sitting = (own, date, tired = false) => dueSections(own, date).slice(0, tired ? 1 : SITTING_MAX);
export const minutesFor = (n) => Math.max(1, Math.min(n, SITTING_MAX) * 2);
export const startedToday = (own, date) => own.texts.reduce((n, t) => n + t.sections.filter((s) => s.sched && s.sched.created === date).length, 0);

export function sectionCounts(text) {
  const learned = text.sections.filter((s) => s.sched).length;
  const kept = text.sections.filter((s) => s.sched?.retired).length;
  const due = text.sections.filter((s) => s.sched && !s.sched.retired).map((s) => s.sched.due).sort()[0] || null;
  return { total: text.sections.length, learned, kept, nextDue: due };
}

// Lines of the section that count (all of them, or the chosen role's).
export function askedLines(text, section) {
  const m = hiddenMask(text, section);
  return section.lines.map((l, i) => ({ i, line: l, asked: m[i] })).filter((x) => x.asked);
}

// Record one finished check. results = array of booleans, one per asked line. Mutates the profile.
// Returns {held, of, acc, passed, started, lumen, due, retired}.
export function recordCheck(p, textId, sectionId, results, { date, typed = false } = {}) {
  const own = p.own, text = own.texts.find((t) => t.id === textId), sec = text?.sections.find((s) => s.id === sectionId);
  if (!sec) return null;
  const held = results.filter(Boolean).length, of = results.length;
  const acc = of ? held / of : 0;
  const level = PASS_LEVEL[text.exact] || PASS_LEVEL.close;
  const passed = of > 0 && (text.exact === 'exact' ? held === of : acc >= level);
  let started = false, lumen = 0;
  if (!sec.sched) {
    // the Blank step of learning: enters the schedule at 80 percent
    if (acc >= START_LEVEL) { sec.sched = startSched(date, acc); sec.stage = 4; started = true; } else sec.stage = Math.max(sec.stage || 0, 3);
  } else {
    const idxBefore = sec.sched.idx;
    const { delay } = advanceSched(sec.sched, passed, acc, date);
    const size = words(sec.lines.join(' ')).length;
    if (passed && typed && delay >= 7 && sec.lines.length >= MIN_REWARD_LINES && size >= MIN_REWARD_WORDS && !sec.sched.paid.includes(idxBefore)) {
      sec.sched.paid = [...sec.sched.paid, idxBefore];
      const want = delay >= 30 ? OWN_LUMEN[30] : OWN_LUMEN[7];
      const fx = p.progress.freeXp && p.progress.freeXp.date === date && Number.isFinite(p.progress.freeXp.xp) ? p.progress.freeXp : { date, xp: 0 };
      lumen = Math.max(0, Math.min(want, 50 - fx.xp));      // the shared daily free-practice cap (FREE_XP_CAP)
      p.progress.freeXp = { date, xp: fx.xp + lumen };
      p.progress.lumen += lumen;
    }
  }
  own.history = [...own.history, { date, text: textId, held, of }].slice(-CAPS.history);
  return { held, of, acc, passed, started, lumen, due: sec.sched?.due ?? null, retired: !!sec.sched?.retired };
}

// ---------- texts ----------
export function newText({ title, label = '', note = '', dir = 'auto', lang = '', exact = 'close', marks = false, mode = 'typed', roleMode = false, role = '', sections }, date) {
  return { id: uid(), title: title.trim().slice(0, CAPS.title), label: label.trim().slice(0, CAPS.label), note: note.trim().slice(0, CAPS.note), created: date, dir, lang: lang.trim().slice(0, 12), exact, marks: !!marks, mode, roleMode: !!roleMode, role: role || '', sections: sections.map((s, i) => ({ id: 's' + (i + 1), lines: s.lines, stage: 0, sched: null })) };
}
export const textChars = (t) => t.sections.reduce((n, s) => n + s.lines.reduce((m, l) => m + l.length, 0), 0);
export const totalChars = (own) => own.texts.reduce((n, t) => n + textChars(t), 0);

// Can this draft be saved? Returns an error message or null.
export function draftError(own, draft) {
  if (!draft.title.trim()) return 'Give the text a title.';
  if (!draft.sections.length) return 'There is nothing to learn yet. Paste some text.';
  if (own.texts.length >= CAPS.texts) return `You can keep up to ${CAPS.texts} texts. Delete one to make room.`;
  if (draft.sections.length > CAPS.sections) return `That is more than ${CAPS.sections} sections. Keep it to ${CAPS.sections} or fewer, or split it into two texts.`;
  const chars = draft.sections.reduce((n, s) => n + s.lines.reduce((m, l) => m + l.length, 0), 0);
  if (chars > CAPS.charsPerText) return `That text is longer than ${CAPS.charsPerText.toLocaleString('en')} characters. Split it into two texts.`;
  if (totalChars(own) + chars > CAPS.totalChars) return 'Your shelf is full. Delete a text to make room.';
  return null;
}

// ---------- validation (used by store.js) ----------
const isDate = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
const isInt = (x, lo, hi) => typeof x === 'number' && Number.isInteger(x) && x >= lo && x <= hi;
const isStr = (x, max, min = 0) => typeof x === 'string' && x.length >= min && x.length <= max;
const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
const BAD = 'Your Own Text record is invalid.';

export function validateText(t) {
  if (!isObj(t) || !isStr(t.id, 40, 1) || !isStr(t.title, CAPS.title, 1) || !isStr(t.label ?? '', CAPS.label) || !isStr(t.note ?? '', CAPS.note) || !isDate(t.created)) return false;
  if (!['auto', 'ltr', 'rtl'].includes(t.dir) || !isStr(t.lang ?? '', 12) || !['gist', 'close', 'exact'].includes(t.exact) || typeof t.marks !== 'boolean' || !['typed', 'said'].includes(t.mode)) return false;
  if ((t.roleMode != null && typeof t.roleMode !== 'boolean') || !isStr(t.role ?? '', CAPS.role)) return false;
  if (!Array.isArray(t.sections) || !t.sections.length || t.sections.length > CAPS.sections) return false;
  const ids = new Set();
  let chars = 0;
  for (const s of t.sections) {
    if (!isObj(s) || !isStr(s.id, 20, 1) || ids.has(s.id) || !isInt(s.stage, 0, 4)) return false;
    ids.add(s.id);
    if (!Array.isArray(s.lines) || !s.lines.length || s.lines.length > CAPS.linesPerSection || !s.lines.every((l) => isStr(l, CAPS.charsPerLine, 1))) return false;
    chars += s.lines.reduce((n, l) => n + l.length, 0);
    if (s.sched != null) {
      const c = s.sched;
      if (!isObj(c) || !isDate(c.created) || !isDate(c.due) || !isInt(c.idx, 0, OWN_INTERVALS.length) || typeof c.immediate !== 'number' || !(c.immediate >= 0 && c.immediate <= 1) || !isInt(c.misses, 0, 99) || typeof c.retired !== 'boolean') return false;
      if (!Array.isArray(c.history) || c.history.length > CAPS.sectionHistory || !c.history.every((h) => isObj(h) && isDate(h.date) && typeof h.acc === 'number' && h.acc >= 0 && h.acc <= 1 && typeof h.pass === 'boolean')) return false;
      if (c.paid != null && (!Array.isArray(c.paid) || c.paid.length > OWN_INTERVALS.length || !c.paid.every((x) => isInt(x, 0, OWN_INTERVALS.length)))) return false;
    }
  }
  return chars <= CAPS.charsPerText;
}

// Returns an error message or null.
export function validateOwn(o) {
  if (!isObj(o) || !Array.isArray(o.texts) || !Array.isArray(o.history) || !isInt(o.v ?? 1, 1, 99)) return BAD;
  if (o.texts.length > CAPS.texts || o.history.length > CAPS.history) return BAD;
  const ids = new Set();
  for (const t of o.texts) { if (!validateText(t) || ids.has(t.id)) return BAD; ids.add(t.id); }
  if (!o.history.every((h) => isObj(h) && isDate(h.date) && isStr(h.text, 40, 1) && isInt(h.of, 0, CAPS.linesPerSection) && isInt(h.held, 0, h.of))) return BAD;
  if (totalChars(o) > CAPS.totalChars || JSON.stringify(o).length > CAPS.record) return BAD;
  return null;
}

// ---------- texts-only file ----------
export function buildTextsExport(own, now = new Date().toISOString()) {
  return JSON.stringify({ app: 'mnemos-texts', schema: 1, exportedAt: now, texts: own.texts }, null, 1);
}

// Merge texts from a texts-only file. Never overwrites: a text whose id is already on the shelf is skipped, and a text
// that would not fit under the caps is skipped. Returns {ok, own, added, skipped} or {ok:false, error}.
export function importTexts(own, raw, maxBytes = 5 * 1024 * 1024) {
  if (typeof raw !== 'string' || !raw.trim()) return { ok: false, error: 'This file is empty.' };
  if (raw.length > maxBytes) return { ok: false, error: 'This file is larger than 5 MB, so it cannot be a Mnemos texts file.' };
  let data;
  try { data = JSON.parse(raw); } catch { return { ok: false, error: 'This file is not valid JSON.' }; }
  if (!isObj(data) || data.app !== 'mnemos-texts' || !Array.isArray(data.texts)) return { ok: false, error: 'This is not a Mnemos texts file.' };
  if (!data.texts.every(validateText)) return { ok: false, error: 'This texts file cannot be used: a text in it is invalid.' };
  const next = structuredClone(own);
  let added = 0, skipped = 0;
  for (const t of data.texts) {
    if (next.texts.some((x) => x.id === t.id) || next.texts.length >= CAPS.texts || totalChars(next) + textChars(t) > CAPS.totalChars) { skipped++; continue; }
    next.texts.push(t); added++;
  }
  return { ok: true, own: next, added, skipped };
}

// Warning shown before a backup import replaces the profile. Null when nothing on the shelf would be lost.
export function importWarning(current, incoming) {
  const have = current?.texts?.length || 0;
  if (!have) return null;
  const inc = incoming?.texts || [];
  if (!inc.length) return 'This backup has no texts. Importing it will remove the texts on this device.';
  const lost = current.texts.filter((t) => !inc.some((x) => x.id === t.id)).length;
  return lost ? `Importing this backup will replace the texts on this device. ${lost} of your ${have} text${have > 1 ? 's are' : ' is'} not in the backup and will be removed.` : null;
}
