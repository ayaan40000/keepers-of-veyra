import { SKILLS, TEMPLATE_SKILL, SKILL_GATE } from '../data/curriculum.js';
import { CONCRETE, ABSTRACT, NAMES, VOCAB, FACTS, MAJOR_SINGLE, MAJOR_PAIRS, NAME_PRES } from '../data/content.js';
import { faceParams, HAIR_STYLES, NOSE_TYPES, EYE_SHAPES, MOUTH_TYPES, BROW_SHAPES, FACE_SHAPES } from '../pixel/faces.js';

// A face seed whose generated presentation suits the name.
function faceFor(name, r) {
  const want = NAME_PRES[name] || 'n';
  for (let i = 0; i < 40; i++) { const s = Math.floor(r() * 1e9); if (want === 'n' || faceParams(s).presentation === want) return s; }
  return Math.floor(r() * 1e9);
}
import { rng, sample, shuffle, clamp, mean, matches, majorDecode, todayISO, addDays, daysBetween, uid, setKnownWords } from './util.js';
import { blankEvents } from '../data/events.js';
import { blankOwn } from './owntext.js';
import { genAdded, scoreMap, scoreSurnames, poemLineOk, numericOk, normMoves, rowScore, mapProbe, surnameFor } from './additions.js';

setKnownWords([...CONCRETE, ...ABSTRACT, ...NAMES, ...VOCAB.map((v) => v[1])]);

export const SCHEMA = 2;
export const CURRICULUM_VERSION = '2026.11-v0.8';
export const PROBE_INTERVALS = [1, 7, 30];
export const GATE_PROBE_INTERVALS = [1, 7, 30, 90, 180];
export const EWMA_ALPHA = 0.35;

export function newSkill() {
  return { level: 1, avg: null, attempts: 0, highs: 0, lows: 0, errs: { omission: 0, substitution: 0, order: 0, timeout: 0 }, recentErrs: [], probes: [], mastery: 0, best: 0, remediate: false, altExplain: null };
}

// Sound starts off (v0.4): players opt in. Dialogue blips have their own switch.
export const DEFAULT_PREFS = { theme: 'dark', reducedMotion: false, timerMult: 1, sound: false, blips: true, volume: 0.6, textSize: 1, home: 'today', brambles: true, voices: 'light', wrenMemory: true };

export function newProfile(alias, avatar, prefs = {}) {
  const now = new Date().toISOString();
  return {
    meta: { schema: SCHEMA, curriculum: CURRICULUM_VERSION, created: now, lastOpened: now },
    user: { alias, avatar, prefs: { ...DEFAULT_PREFS, ...prefs } },
    progress: { day: 1, startDate: todayISO(0), trainingDates: [], fullDates: [], minutes: 0, lumen: 0, gates: [], gateRetry: {}, longest: 0, lastSessionDate: null, freeXp: { date: null, xp: 0 }, dayOffset: 0, baselineDone: false, reviewerUnlock: false },
    skills: Object.fromEntries(Object.keys(SKILLS).map((k) => [k, newSkill()])),
    results: [], sets: [], palaces: [], major: {}, achievements: {}, story: { seen: [] }, reflections: 0, baseline: null, inProgress: null,
    tips: { seen: [] }, relics: { polish: {} }, stats: { sessions: [] }, trials: {}, brambles: { thorns: {}, chests: {} }, mirror: { episode: null, lit: {} }, audit: { done: 0, last: null }, events: blankEvents(),
    seam: { met: null, cleared: [], tries: 0, best: 0, rests: 0, last: null, used: [], closed: null, held: null, epilogue: null }, wren: { seen: {}, asked: {}, lastBeat: null, lastQ: null },
    guide: { tried: {}, later: {} }, own: blankOwn(),
    keeper: { equip: { lantern: null, cloak: null, charm: null, tool: null } },
    battles: { done: 0, held: 0, rests: 0, last: null, skipped: null, queue: [], history: [] },
  };
}

export const today = (p) => todayISO(p?.progress?.dayOffset || 0);

// ---------- difficulty scaling ----------
export function scaledSpec(spec, level, mode = 'practice', timerMult = 1) {
  if (spec.fixed) return { ...spec, s: Math.round((spec.s || 0) * timerMult) }; // a Unit Check keeps its exact length
  let n = Math.round(spec.n * (1 + 0.06 * (level - 1)));
  let s = spec.s ? spec.s * (1 - 0.03 * (level - 1)) : 0;
  if (mode === 'guided') n = Math.max(4, Math.round(n * 0.6));
  if (mode === 'remedial') { n = Math.max(4, Math.round(n * 0.6)); s *= 1.5; }
  if (mode === 'warmup') { n = 5; s = 25; }
  if (spec.t === 'digits' && n % 2) n += 1;
  // v0.5 harder faces in practice only (checks and gates keep the plain task they were calibrated on):
  // look-alike strangers from level 3, and the same people with a changed look at recall from level 5.
  if (spec.t === 'faces' && mode === 'practice' && !spec.surname) {
    if (level >= 3 && spec.lures == null) spec = { ...spec, lures: level >= 6 ? 2 : 1 };
    if (level >= 5 && spec.restyle == null) spec = { ...spec, restyle: true };
    if (level >= 7 && spec.turn == null) spec = { ...spec, turn: true }; // v0.8: met face-on, recalled at three-quarter view
  }
  if (spec.s && (mode === 'guided' || mode === 'remedial')) s = Math.max(s, spec.s);
  return { ...spec, n, s: Math.round(s * timerMult) };
}

// ---------- item generation ----------
export function majorWord(p, num) {
  const key = String(num);
  if (p?.major?.[key]) return p.major[key];
  return key.length === 1 ? MAJOR_SINGLE[+key] : MAJOR_PAIRS[+key];
}

export function genItems(spec, seed, p) {
  const r = rng(seed);
  const n = spec.n;
  const added = genAdded(spec, r); // 1.1 variants, sources, Mind Map, Poem, Mental Reckoning, Unit Checks
  if (added) return added;
  switch (spec.t) {
    case 'wordlist': {
      const words = sample(CONCRETE, n * (spec.interference ? 2 : 1), r);
      return { items: words.slice(0, n).map((w) => ({ answer: w })), extra: spec.interference ? { listB: words.slice(n) } : null };
    }
    case 'chain': case 'palace':
      return { items: sample(CONCRETE, n, r).map((w) => ({ answer: w })) };
    case 'pairs': {
      const cues = sample(CONCRETE, n, r);
      const pool = spec.abstract ? ABSTRACT : CONCRETE.filter((w) => !cues.includes(w));
      const ans = sample(pool, n, r);
      return { items: cues.map((c, i) => ({ cue: c, answer: ans[i] })) };
    }
    case 'digits':
      return { items: Array.from({ length: n }, () => ({ answer: String(Math.floor(r() * 10)) })) };
    case 'major': {
      const range = spec.range || 10;
      const nums = shuffle(Array.from({ length: range }, (_, i) => i), r);
      const pick = Array.from({ length: n }, (_, i) => nums[i % range]);
      return { items: pick.map((x) => { const cue = range > 10 ? String(x).padStart(2, '0') : String(x); return { cue, answer: majorWord(p, cue) }; }) };
    }
    case 'faces': {
      if (spec.surname) { // 1.1: first name and surname, one point each
        const taken = new Set();
        return { items: sample(NAMES, n, r).map((name) => { const last = surnameFor(name, taken, r); return { face: faceFor(name, r), answer: `${name} ${last}`, first: name, last }; }) };
      }
      const lures = Math.min(spec.lures || 0, Math.max(0, n - 3));
      const real = sample(NAMES, n - lures, r).map((name) => ({ face: faceFor(name, r), answer: name }));
      if (spec.restyle) for (const it of real) it.look = restyle(it.face, r);
      if (spec.turn) for (const it of real) it.turn = r() < 0.5 ? -1 : 1;
      const fakes = Array.from({ length: lures }, (_, i) => {
        const base = real[Math.floor(r() * real.length)];
        return { face: base.face, alter: lookAlike(base.face, r), answer: LURE_ANSWER, lure: true, ...(base.look ? { look: base.look } : {}), ...(base.turn ? { turn: -base.turn } : {}) };
      });
      return { items: [...real, ...fakes] };
    }
    case 'vocab':
      return { items: sample(VOCAB, n, r).map(([cue, answer, hint]) => ({ cue, answer, hint })) };
    case 'facts':
      return { items: sample(FACTS, n, r).map(([cue, answer]) => ({ cue, answer })) };
    default:
      return { items: [] };
  }
}

// ---------- face variations (v0.5) ----------
export const LURE_ANSWER = 'new';
const swap = (arr, cur, r) => { const o = arr.filter((x) => x !== cur); return o[Math.floor(r() * o.length)]; };
// Same person, different look: hair and accessories change, the face itself does not.
export function restyle(seed, r) {
  const f = faceParams(seed);
  const look = {};
  if (!['hijab', 'headwrap'].includes(f.hairStyle)) look.hairStyle = swap(HAIR_STYLES.filter((h) => !['hijab', 'headwrap', 'bald', 'horseshoe'].includes(h)), f.hairStyle, r);
  look.glasses = f.glasses ? null : ['round', 'rect', 'wire'][Math.floor(r() * 3)];
  look.outfit = swap(['crew', 'collar', 'vneck', 'jacket', 'turtle', 'tunic', 'scarf'], f.outfit, r);
  return look;
}
// A stranger who looks like someone you met: two stable features differ.
export function lookAlike(seed, r) {
  const f = faceParams(seed);
  const opts = [
    () => ({ nose: swap(NOSE_TYPES, f.nose, r) }),
    () => ({ eyeShape: swap(EYE_SHAPES, f.eyeShape, r) }),
    () => ({ faceShape: swap(Object.keys(FACE_SHAPES), f.faceShape, r) }),
    () => ({ mouth: swap(MOUTH_TYPES, f.mouth, r) }),
    () => ({ browShape: swap(BROW_SHAPES.filter((b) => b !== 'unibrow'), f.browShape, r) }),
    () => (f.mole ? { mole: null } : { mole: 'cheekL' }),
  ];
  const picks = shuffle(opts.map((_, i) => i), r).slice(0, 2);
  return Object.assign({}, ...picks.map((i) => opts[i]()));
}
export const isLureReply = (s) => /^\s*(|new|none|no|not met|stranger|-|\?|x)\s*$/i.test(String(s ?? ''));

export const recallMode = (t, spec = {}) => (t === 'map' ? 'branch' : t === 'calc' ? 'numeric' : t === 'poem' ? 'ordered' : t === 'wordlist' && spec.numbered ? 'cued' : t === 'wordlist' && !spec.ordered ? 'free' : ['chain', 'palace', 'digits'].includes(t) ? 'ordered' : 'cued');

// ---------- scoring ----------
// responses: free -> array of strings (any order); ordered/cued -> array aligned with items.
export function scoreDrill(t, items, responses, opts = {}) {
  const spec = opts.spec || {};
  if (t === 'map') return scoreMap(items, responses);
  if (t === 'faces' && spec.surname) return scoreSurnames(items, responses);
  const mode = recallMode(t, opts.spec);
  const errs = { omission: 0, substitution: 0, order: 0, timeout: 0 };
  const perItem = [];
  const ok = (resp, it) => {
    if (it.lure) return isLureReply(resp);
    if (t === 'digits') return String(resp ?? '').trim() === it.answer;
    if (t === 'calc') return numericOk(resp, it.answer);
    if (t === 'poem') return poemLineOk(resp, it.answer, it.alt);
    if (spec.src === 'chess') return !!normMoves(resp) && normMoves(resp) === normMoves(it.answer);
    if (it.alt && it.alt.some((a) => matches(resp, a))) return true;
    if (t === 'major') return matches(resp, it.answer) || majorDecode(resp) === it.cue;
    return matches(resp, it.answer);
  };
  if (mode === 'free') {
    const used = new Set();
    const resp = (responses || []).map((x) => String(x || '').trim()).filter(Boolean);
    for (const it of items) {
      const idx = resp.findIndex((x, i) => !used.has(i) && ok(x, it));
      if (idx >= 0) { used.add(idx); perItem.push({ target: it.answer, response: resp[idx], ok: true }); }
      else { errs.omission++; perItem.push({ target: it.answer, response: '', ok: false, err: 'omission' }); }
    }
    errs.substitution = resp.length - used.size;
  } else {
    items.forEach((it, i) => {
      const resp = (responses || [])[i] ?? '';
      if (ok(resp, it)) { perItem.push({ target: it.answer, response: resp, ok: true }); return; }
      let err = 'omission';
      if (String(resp).trim()) {
        err = mode === 'ordered' && items.some((o, j) => j !== i && ok(resp, o)) ? 'order' : 'substitution';
      } else if (opts.timedOut) err = 'timeout';
      errs[err]++;
      perItem.push({ target: it.answer, response: resp, ok: false, err });
    });
  }
  if (t === 'digits' && spec.rows) { // event mode: rows of 20, all or nothing, a blank row ends scoring
    const marks = rowScore(items, responses || []);
    perItem.forEach((x, i) => { x.ok = !!marks[i]; });
  }
  const correct = perItem.filter((x) => x.ok).length;
  return { n: items.length, correct, acc: items.length ? correct / items.length : 0, errs, perItem };
}

// ---------- adaptive engine ----------
export function computeMastery(s, gatePassed) {
  if (!s.attempts) return 0;
  let m = 1;
  if (s.attempts >= 3 && s.avg >= 0.7) m = 2;
  if (m === 2 && s.attempts >= 5 && s.level >= 2 && s.avg >= 0.85 && s.probes.some((p) => p.delay >= 1 && p.score >= 0.8 && (p.acc ?? 1) >= 0.7)) m = 3;
  if (m === 3 && gatePassed && s.probes.some((p) => p.delay >= 7 && p.score >= 0.8 && (p.acc ?? 1) >= 0.7)) m = 4;
  const last3 = s.probes.slice(-3);
  if (last3.length === 3 && mean(last3.map((p) => p.score)) < 0.6) m = Math.max(1, m - 1); // R6
  return m;
}

const SCORED_ROLES = ['practice', 'check', 'gate', 'remedial', 'baseline'];

// R1/R2 applied once per session per skill (mean accuracy of that session's scored drills).
export function applySessionLevel(p, skillId, acc, speedOk) {
  const s = p.skills[skillId];
  if (!s) return [];
  const events = [];
  if (acc >= 0.9 && speedOk) s.highs++; else s.highs = 0;
  if (acc < 0.5) s.lows++; else s.lows = 0;
  if (s.highs >= 3 && s.level < 10) { s.level++; s.highs = 0; events.push({ type: 'levelup', skill: skillId, level: s.level }); }
  if (s.lows >= 2 && s.level > 1) { s.level--; s.lows = 0; events.push({ type: 'leveldown', skill: skillId, level: s.level }); }
  s.mastery = computeMastery(s, p.progress.gates.includes(SKILL_GATE[skillId]));
  return events;
}

// Applies R3, R4 and R6 per scored drill (practice, check, gate, remedial). Returns list of events.
export function updateSkill(p, skillId, result, role, speedOk = true) {
  const s = p.skills[skillId];
  const events = [];
  if (!s) return events;
  s.attempts++;
  s.avg = s.avg == null ? result.acc : EWMA_ALPHA * result.acc + (1 - EWMA_ALPHA) * s.avg;
  for (const k of Object.keys(result.errs)) s.errs[k] = (s.errs[k] || 0) + result.errs[k];
  if (SCORED_ROLES.includes(role) && role !== 'baseline') {
    const perf = result.acc * (1 + 0.1 * (s.level - 1));
    if (s.attempts > 1 && perf > s.best + 0.001) events.push({ type: 'pb', skill: skillId });
    s.best = Math.max(s.best, perf);
  }
  // R3 remediation
  const wasRem = s.remediate;
  s.remediate = s.attempts >= 3 && s.avg < 0.6;
  if (s.remediate && !wasRem) events.push({ type: 'remediate', skill: skillId });
  // R4 error-pattern switch
  s.recentErrs = [...s.recentErrs, result.errs].slice(-2);
  const tot = { omission: 0, substitution: 0, order: 0, timeout: 0 };
  s.recentErrs.forEach((e) => Object.keys(tot).forEach((k) => (tot[k] += e[k] || 0)));
  const top = Object.entries(tot).sort((a, b) => b[1] - a[1])[0];
  s.altExplain = s.recentErrs.length >= 2 && top[1] >= 3 && s.recentErrs.every((e) => (e[top[0]] || 0) > 0) ? top[0] : null;
  s.mastery = computeMastery(s, p.progress.gates.includes(SKILL_GATE[skillId]));
  return events;
}

// R5: store a practice set for delayed probes.
export function storeSet(p, step, result) {
  const isGate = step.role === 'gate';
  const set = {
    id: uid(), skill: step.skill, t: step.spec.t, spec: step.spec, items: step.items, loci: step.loci || null,
    created: today(p), immediate: result.acc, idx: 0, intervals: isGate ? GATE_PROBE_INTERVALS : PROBE_INTERVALS, history: [], retired: false,
  };
  set.due = addDays(set.created, set.intervals[0]);
  p.sets.push(set);
  if (p.sets.length > 400) p.sets = p.sets.filter((s) => !s.retired).slice(-400);
  return set;
}

export function dueSets(p, max = 3) {
  const t = today(p);
  return p.sets
    .filter((s) => !s.retired && s.due <= t)
    .sort((a, b) => (a.due < b.due ? -1 : 1))
    .slice(0, max);
}

// A probe shows a sample (up to 8 items; ordered sets keep order).
export function probeItems(set) {
  if (set.t === 'map') return { items: mapProbe(set.items), loci: null };
  const mode = recallMode(set.t, set.spec);
  if (mode === 'ordered' && set.t !== 'palace') return { items: set.items.slice(0, set.t === 'digits' ? 20 : 10), loci: null };
  if (mode === 'free') return { items: set.items.slice(0, 20), loci: null };
  const idxs = set.items.map((_, i) => i).filter((i) => !set.items[i].lure).slice(0, 8);
  return { items: idxs.map((i) => set.items[i]), loci: set.loci ? idxs.map((i) => set.loci[i]) : null };
}

export function applyProbe(p, set, result) {
  const t = today(p);
  const delay = daysBetween(set.created, t);
  // "Kept" = delayed score relative to the first score, with a floor of 50% so a weak first score cannot inflate it.
  const ratio = Math.min(1, result.acc / Math.max(set.immediate, 0.5));
  const pass = result.acc >= 0.7 || (ratio >= 0.8 && result.acc >= 0.5);
  set.history.push({ date: t, acc: result.acc, ratio, delay, pass });
  const s = p.skills[set.skill];
  s.probes = [...s.probes, { date: t, delay, score: ratio, acc: result.acc }].slice(-12);
  if (pass) {
    set.idx++;
    if (set.idx >= set.intervals.length) set.retired = true;
    else set.due = [addDays(set.created, set.intervals[set.idx]), addDays(t, 1)].sort().pop();
  } else {
    set.idx = 0; set.created = t; set.immediate = Math.max(set.immediate, 0.01); set.due = addDays(t, 1); // re-learn shown in feedback
  }
  s.mastery = computeMastery(s, p.progress.gates.includes(SKILL_GATE[set.skill]));
  return { delay, ratio, pass };
}

export function skillOf(t) { return TEMPLATE_SKILL[t]; }
export { clamp };
