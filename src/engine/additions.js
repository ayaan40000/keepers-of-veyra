// 1.1 curriculum additions: practice material for the drill variants (pegs, sources, numbered lists, skim texts, study sets),
// the Mind Map and Poem drills, the Unit Checks, and the scorers they need. Pure logic, no saved data of its own.
// Everything here is deterministic for a seed so stored sets and probes keep working.
import PEGS from '../data/add/pegs.json';
import GROCERY from '../data/add/grocery.json';
import STEPS from '../data/add/steps.json';
import POINTS from '../data/add/points.json';
import NUMBERED from '../data/add/numbered.json';
import SKIM from '../data/add/skim.json';
import MAPS from '../data/add/maps.json';
import STRIKES from '../data/add/strikes.json';
import POEMS from '../data/add/poems.json';
import POOLS from '../data/add/pools.json';
import UNITS from '../data/add/unitchecks.json';
import SOUND from '../data/add/soundalikes.json';
import SURN from '../data/add/surnames.json';
import { CONCRETE } from '../data/content.js';
import { sample, shuffle, lev, normalize, matches } from './util.js';

export const PEG_WORDS = { shape: PEGS.shape, rhyme: PEGS.rhyme };
export const SKIM_TEXTS = SKIM.texts;
export const MIND_MAPS = MAPS.maps;
export const POEM_LIST = POEMS.poems;
export const UNIT_CHECKS = UNITS;
export const SOUNDALIKE = SOUND.entries; // word -> [sound-alike, picture]; shown after an abstract-word drill
export const SOUND_HONEST = SOUND.honest;
export const PEG_HONEST = PEGS.honest;
export const MAP_HONEST = MAPS.honest;
export const SKIM_HONEST = SKIM.honest;
export const MAP_LIMIT = 12; // a delayed review asks about up to 12 leaves

// Names of the small variants, stored on result records as `v` so Then and Now can tell them apart.
export function variantOf(spec) {
  if (!spec) return undefined;
  if (spec.unit) return `unit-${spec.unit}-${spec.form}`;
  if (spec.skim) return 'skim';
  if (spec.t === 'map') return 'map';
  if (spec.t === 'poem') return 'poem';
  if (spec.t === 'calc') return 'calc';
  if (spec.peg) return 'peg';
  if (spec.rows) return 'rows';
  if (spec.group) return 'group';
  if (spec.numbered) return 'numbered';
  if (spec.surname) return 'surname';
  if (spec.src) return spec.src;
  return undefined;
}

// ---------- digit groups ----------
// group: a size (2, 3, 4) or a list of sizes ([3, 3, 4]) that repeats. Display only.
export function groupDigits(str, group) {
  const s = String(str);
  const sizes = Array.isArray(group) ? group : [group || 2];
  const out = [];
  for (let i = 0, k = 0; i < s.length; k++) { const g = Math.max(1, sizes[k % sizes.length]); out.push(s.slice(i, i + g)); i += g; }
  return out;
}
export const DIGIT_ROW = 20;

// ---------- sources ----------
const GROCERY_OPEN = GROCERY.filter((g) => !g[1]).map((g) => g[0]);
export const GROCERY_ALL = GROCERY.map((g) => g[0]);

function pickLong(list, n, r) {
  const fit = list.filter((x) => (x.steps || x.points).length >= n);
  const pool = fit.length ? fit : list.slice().sort((a, b) => (b.steps || b.points).length - (a.steps || a.points).length).slice(0, 4);
  return shuffle(pool, r)[0];
}

function textItems(pairs, n) { return pairs.slice(0, n).map(([text, answer]) => ({ text, answer })); }

function bodyItems(n, r) {
  const nerves = r() < 0.5 || n > 8;
  if (nerves) return { items: POOLS.body.nerves.slice(0, n).map(([roman, name]) => ({ text: `Cranial nerve ${roman}`, answer: name })), extra: { title: 'The cranial nerves' } };
  return { items: POOLS.body.carpals.slice(0, n).map((name, i) => ({ text: `Carpal bone ${i + 1}`, answer: name })), extra: { title: 'The carpal bones' } };
}

// Study sets for facts and chains: { cue, answer } pairs from the checked pools.
function poolFacts(src, n, r) {
  if (src === 'elements') {
    return sample(POOLS.elements.items, n, r).map(([num, name, sym]) => (r() < 0.5 ? { cue: `Element ${num}`, answer: name } : { cue: `Symbol for ${name.toLowerCase()}`, answer: sym }));
  }
  if (src === 'roots') return sample(POOLS.roots.items, n, r).map(([cue, answer]) => ({ cue, answer }));
  if (src === 'atlas') return sample(POOLS.atlas.items, n, r).map(([c, cap, alt]) => ({ cue: `Capital of ${c}`, answer: cap, ...(alt.length ? { alt } : {}) }));
  if (src === 'music') return sample(POOLS.music.items, n, r).map(([cue, answer]) => ({ cue, answer }));
  if (src === 'chess') return sample(POOLS.chess.items, n, r).map(([cue, answer]) => ({ cue, answer }));
  return null;
}
export const POOL_NOTES = { elements: POOLS.elements.honest, roots: POOLS.roots.honest, atlas: POOLS.atlas.honest, music: POOLS.music.honest, chess: POOLS.chess.honest, body: POOLS.body.honest };
export const STUDY_SETS = [
  { src: 'atlas', label: 'Capitals', w: 27 }, { src: 'elements', label: 'Elements', w: 27 }, { src: 'roots', label: 'Word roots', w: 27 },
  { src: 'music', label: 'Music theory', w: 27 }, { src: 'chess', label: 'Chess openings', w: 27 },
];

// Chess lines: ignore move numbers, dots, spaces and case.
export const normMoves = (s) => String(s ?? '').toLowerCase().replace(/\d+\s*\.(\.\.)?/g, ' ').replace(/[^a-z0-9=]/g, '');

// ---------- Mind Map ----------
function mapItems(spec, n, r) {
  if (spec.kind === 'people') {
    const sheet = shuffle(STRIKES.sheets, r)[0];
    const f = n <= 12 ? 3 : n <= 20 ? 4 : 5;
    const fieldOrder = ['birthday', 'town', 'pet', 'hobby', 'car', 'food', 'extension'];
    const fields = shuffle(fieldOrder, r).slice(0, f);
    const people = Math.max(3, Math.min(6, Math.round(n / f)));
    const picked = sample(sheet.people, people, r);
    const items = [];
    for (const person of picked) for (const fld of fields) items.push({ branch: person.name, answer: String(person[sheet.keys[fld] || fld]), show: String(person[fld]), center: sheet.title });
    return { items, extra: { map: { center: sheet.title, branches: picked.map((pp) => ({ label: pp.name, leaves: fields.map((fl) => String(pp[fl])) })) } } };
  }
  // topic maps: the one whose leaf count is closest to n
  const withCount = MIND_MAPS.map((m) => ({ m, c: m.branches.reduce((a, b) => a + b.leaves.length, 0) }));
  const best = Math.min(...withCount.map((x) => Math.abs(x.c - n)));
  const m = shuffle(withCount.filter((x) => Math.abs(x.c - n) <= best + 1), r)[0].m;
  return {
    items: m.branches.flatMap((b) => b.leaves.map((leaf) => ({ branch: b.label, answer: leaf, center: m.center }))),
    extra: { map: { center: m.center, branches: m.branches.map((b) => ({ label: b.label, leaves: b.leaves.slice() })) } },
  };
}

// The branches of a stored or fresh map set, in order, with their leaf slots.
export function mapBranches(items) {
  const out = [];
  items.forEach((it, i) => {
    let b = out.find((x) => x.label === it.branch);
    if (!b) { b = { label: it.branch, idx: [] }; out.push(b); }
    b.idx.push(i);
  });
  return out;
}

// A delayed review: whole branches, up to MAP_LIMIT leaves, in order.
export function mapProbe(items) {
  const keep = [];
  for (const b of mapBranches(items)) {
    if (keep.length >= MAP_LIMIT) break;
    keep.push(...b.idx.slice(0, MAP_LIMIT - keep.length));
  }
  return keep.map((i) => items[i]);
}

// One point per leaf, matched inside its own branch only. A right answer under the wrong branch is a substitution.
export function scoreMap(items, responses) {
  const errs = { omission: 0, substitution: 0, order: 0, timeout: 0 };
  const perItem = new Array(items.length);
  for (const b of mapBranches(items)) {
    const resp = b.idx.map((i) => String((responses || [])[i] || '').trim()).filter(Boolean);
    const used = new Set();
    for (const i of b.idx) {
      const at = resp.findIndex((x, k) => !used.has(k) && matches(x, items[i].answer));
      if (at >= 0) { used.add(at); perItem[i] = { target: items[i].answer, response: resp[at], ok: true }; }
      else { errs.omission++; perItem[i] = { target: items[i].answer, response: '', ok: false, err: 'omission' }; }
    }
    errs.substitution += resp.length - used.size;
  }
  const correct = perItem.filter((x) => x.ok).length;
  return { n: items.length, correct, acc: items.length ? correct / items.length : 0, errs, perItem };
}

// ---------- Poem ----------
const POEM_SIZES = [4, 6, 8, 12, 14, 16];
function poemItems(n, r) {
  const want = POEM_SIZES.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a), POEM_SIZES[0]);
  const pool = POEM_LIST.filter((p) => p.lines.length === want);
  const poem = shuffle(pool.length ? pool : POEM_LIST, r)[0];
  const alt = (i) => poem.variants?.[`line ${i + 1}`];
  return { items: poem.lines.map((line, i) => ({ answer: line, ...(alt(i) ? { alt: alt(i) } : {}) })), extra: { poem: { title: poem.title, author: poem.author, learn: POEMS.learn[String(poem.difficulty)] || null } } };
}
export const POEM_LEARN = POEMS.learn;

const squash = (s) => String(s ?? '').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
// Practice: capitals, punctuation and spacing do not matter, and a small typo is forgiven (about 90 percent alike).
export function poemLineOk(resp, target, alt) {
  const r = normalize(resp);
  if (!r) return false;
  return [target, ...(alt || [])].some((t) => { const x = normalize(t); const d = lev(r, x); return d === 0 || 1 - d / Math.max(r.length, x.length) >= 0.9; });
}
// Event page (strict): every word, capital and punctuation mark must match. Spacing is tidied first.
export function poemLineStrict(resp, target, alt) {
  const r = squash(resp);
  return !!r && [target, ...(alt || [])].some((t) => squash(t) === r);
}
// A page of lines scored all or nothing per line. Scoring stops after more than two skipped lines in a row.
// Title and author are one point each. Returns { points, total, lines: [bool] }.
export function scorePoemPage(lines, responses, { title, author, gotTitle, gotAuthor } = {}) {
  let skipRun = 0, stopped = false, points = 0;
  const marks = lines.map((it, i) => {
    const resp = (responses || [])[i];
    if (stopped) return false;
    if (!squash(resp)) { skipRun++; if (skipRun > 2) { stopped = true; } return false; }
    skipRun = 0;
    const ok = poemLineStrict(resp, it.answer, it.alt);
    if (ok) points++;
    return ok;
  });
  const extra = (gotTitle != null && title ? (poemLineStrict(gotTitle, title) ? 1 : 0) : 0) + (gotAuthor != null && author ? (poemLineStrict(gotAuthor, author) ? 1 : 0) : 0);
  return { points: points + extra, total: lines.length + (title ? 1 : 0) + (author ? 1 : 0), lines: marks };
}

// ---------- digits in rows (event mode) ----------
// A row of 20 scores all or nothing; a blank row ends scoring. Display and scoring only.
export function rowScore(items, responses) {
  const per = [];
  let stopped = false;
  for (let s = 0; s < items.length; s += DIGIT_ROW) {
    const idx = items.slice(s, s + DIGIT_ROW).map((_, k) => s + k);
    const blank = idx.every((i) => !String(responses[i] ?? '').trim());
    if (blank) stopped = true;
    const full = !stopped && idx.every((i) => String(responses[i] ?? '').trim() === items[i].answer);
    for (const i of idx) per[i] = full;
  }
  return per;
}

// ---------- surnames ----------
const AVOID = new Set(SURN.avoid.map((x) => x.toLowerCase()));
export function surnameFor(first, taken, r) {
  const opts = shuffle(SURN.surnames, r).filter((s) => !taken.has(s) && !AVOID.has(`${first} ${s}`.toLowerCase()));
  const s = opts[0] || SURN.surnames[0];
  taken.add(s);
  return s;
}
// Two parts per face: the first name and the surname, one point each.
export function scoreSurnames(items, responses) {
  const errs = { omission: 0, substitution: 0, order: 0, timeout: 0 };
  let correct = 0;
  const perItem = items.map((it, i) => {
    const resp = String(responses[i] ?? '').trim();
    const words = resp.split(/\s+/).filter(Boolean);
    const first = words[0] || '';
    const last = words.slice(1).join(' ');
    const a = matches(first, it.first), b = matches(last, it.last);
    correct += (a ? 1 : 0) + (b ? 1 : 0);
    if (!a) errs[first ? 'substitution' : 'omission']++;
    if (!b) errs[last ? 'substitution' : 'omission']++;
    return { target: it.answer, response: resp, ok: a && b, ...(a && b ? {} : { err: resp ? 'substitution' : 'omission' }), parts: [a, b] };
  });
  return { n: items.length * 2, correct, acc: items.length ? correct / (items.length * 2) : 0, errs, perItem };
}

// ---------- numbers (Mental Reckoning) ----------
const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
export const CALC_LEVELS = {
  1: (r) => { let a, b; do { a = int(r, 21, 89); b = int(r, 21, 79); } while ((a % 10) + (b % 10) < 10 || a + b > 199); const t = b - (b % 10); return { cue: `${a} + ${b}`, steps: [a + t, a + b], answer: a + b }; },
  2: (r) => { let a, b; do { a = int(r, 120, 899); b = int(r, 21, 89); } while ((a % 10) + (b % 10) < 10); const t = b - (b % 10); return { cue: `${a} + ${b}`, steps: [a + t, a + b], answer: a + b }; },
  3: (r) => { let a, b; do { a = int(r, 120, 799); b = int(r, 120, 799); } while ((a % 10) + (b % 10) < 10 || (Math.floor(a / 10) % 10) + (Math.floor(b / 10) % 10) < 9); const h = b - (b % 100), te = (b % 100) - (b % 10); return { cue: `${a} + ${b}`, steps: [a + h, a + h + te, a + b], answer: a + b }; },
  4: (r) => { let a, b; do { a = int(r, 400, 999); b = int(r, 120, a - 100); } while ((a % 10) >= (b % 10)); const h = b - (b % 100), te = (b % 100) - (b % 10); return { cue: `${a} minus ${b}`, steps: [a - h, a - h - te, a - b], answer: a - b }; },
  5: (r) => { const a = int(r, 12, 98), d = int(r, 3, 9), t = a - (a % 10); return { cue: `${a} × ${d}`, steps: [t * d, a * d], answer: a * d }; },
  6: (r) => { const a = int(r, 12, 49), b = int(r, 12, 79), t = a - (a % 10), u = a % 10; return { cue: `${a} × ${b}`, steps: [t * b, u * b, a * b], answer: a * b }; },
};
function calcItems(spec, n, r) {
  const level = Math.max(1, Math.min(6, spec.level || 1));
  return { items: Array.from({ length: n }, () => { const x = CALC_LEVELS[level](r); return { cue: x.cue, answer: String(x.answer), steps: x.steps.map(String), mode: spec.mode || 'see' }; }) };
}
const numClean = (x) => String(x ?? '').replace(/[\s,]/g, '');
export const numericOk = (resp, target) => !!numClean(resp) && numClean(resp) === numClean(target);

// ---------- Unit Checks ----------
export const UNIT_WEEKS = { lists: { A: 3, B: 6 }, numbers: { A: 14, B: 21 }, talk: { A: 28, B: 30 } };
export const UNIT_NAMES = Object.fromEntries(UNITS.map((u) => [u.unit, u.title]));
const unitData = (unit, form) => UNITS.find((u) => u.unit === unit)?.forms[form];

// The drill specs of one Unit Check form. Fixed lengths: a check is a measure, so level and the player's settings do not reshape it.
export function unitSpecs(unit, form) {
  const base = { fixed: true, unit, form };
  if (unit === 'lists') return [{ ...base, t: 'chain', n: 12, s: 90, src: 'grocery', part: 'grocery' }, { ...base, t: 'chain', n: 9, s: 90, src: 'steps', part: 'procedure' }];
  if (unit === 'numbers') return [{ ...base, t: 'digits', n: 12, s: 60, part: 'digits12' }, { ...base, t: 'digits', n: 10, s: 45, group: [3, 3, 4], part: 'phoneShaped' }];
  return [{ ...base, t: 'chain', n: 7, s: 90, src: 'points', part: 'talk' }];
}
function unitItems(spec) {
  const f = unitData(spec.unit, spec.form);
  if (spec.part === 'grocery') return { items: f.grocery.items.map((answer) => ({ answer })) };
  if (spec.part === 'procedure') return { items: f.procedure.steps.map((x) => ({ text: x.text, answer: x.key })), extra: { title: f.procedure.title } };
  if (spec.part === 'talk') return { items: f.points.map((x) => ({ text: x.text, answer: x.key })), extra: { title: f.title } };
  return { items: f[spec.part].value.replace(/\D/g, '').split('').map((answer) => ({ answer })) };
}
export const unitDone = (p, unit, form) => (p.results || []).some((r) => r.v === `unit-${unit}-${form}`);
// Which Unit Check (if any) belongs in today's full session. A comes on any of the first five days of its week, B on the sixth
// (the seventh is an assessment or a gate day). B is only offered when A was taken.
export function unitDue(p, weekNo, day) {
  const weekday = ((day - 1) % 7) + 1;
  for (const unit of Object.keys(UNIT_WEEKS)) {
    const w = UNIT_WEEKS[unit];
    if (weekNo === w.A && weekday <= 5 && !unitDone(p, unit, 'A')) return { unit, form: 'A' };
    if (weekNo === w.B && weekday >= 6 && unitDone(p, unit, 'A') && !unitDone(p, unit, 'B')) return { unit, form: 'B' };
  }
  return null;
}

// ---------- the entry point used by genItems ----------
// Returns { items, extra } for a spec this file knows how to build, or null so the plain generator runs.
export function genAdded(spec, r) {
  const n = spec.n;
  if (spec.unit) return unitItems(spec);
  switch (spec.t) {
    case 'pairs': {
      if (!spec.peg) return null;
      const words = PEG_WORDS[spec.peg] || PEG_WORDS.shape;
      const k = Math.min(n, words.length);
      const ans = sample(CONCRETE, k, r);
      return { items: Array.from({ length: k }, (_, i) => ({ cue: `${i + 1} ${words[i]}`, answer: ans[i], peg: i + 1 })) };
    }
    case 'chain': case 'palace': {
      if (spec.src === 'grocery') return { items: sample(GROCERY_OPEN, n, r).map((answer) => ({ answer })) };
      if (spec.src === 'steps') { const x = pickLong(STEPS, n, r); return { items: textItems(x.steps, n), extra: { title: x.title } }; }
      if (spec.src === 'points') { const x = pickLong(POINTS, n, r); return { items: textItems(x.points, n), extra: { title: x.title } }; }
      if (spec.src === 'body') return bodyItems(n, r);
      return null;
    }
    case 'wordlist': {
      if (!spec.numbered) return null;
      const list = n > 40 ? NUMBERED.find((l) => l.id === 'wl-100') : shuffle(NUMBERED.filter((l) => l.id !== 'wl-100'), r)[0];
      return { items: list.words.slice(0, n).map((answer, i) => ({ cue: String(i + 1), answer })), extra: { title: 'Numbered words' } };
    }
    case 'facts': {
      if (spec.skim) {
        const t = shuffle(SKIM_TEXTS, r)[0];
        return { items: t.headings.map((h, i) => ({ cue: h, answer: t.keywords[h], text: t.keyPoints[i] })), extra: { skim: { id: t.id, title: t.title, text: t.text, headings: t.headings, candidates: t.candidates, keyPoints: t.keyPoints } } };
      }
      const items = spec.src && poolFacts(spec.src, n, r);
      return items ? { items } : null;
    }
    case 'map': return mapItems(spec, n, r);
    case 'poem': return poemItems(n, r);
    case 'calc': return calcItems(spec, n, r);
    default: return null;
  }
}
