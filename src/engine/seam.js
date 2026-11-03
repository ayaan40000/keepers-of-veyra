// 1.1 Chapter 13: the Seam and the Great Forgetting. It reuses the Echo battle engine (free-entry answers, an answer shown after a
// miss and asked again, one skip, rest at any time) on MADE-UP material, one battle per phase, then ends with the Stitch:
// a delayed ordered recall of nine made-up days. This never changes skill estimates, review sets or results, and earns no Lumen.
// It writes only p.seam (and the story-seen list when the ending is read). Nothing is locked by a miss: a Stitch under six
// simply means "not tied off yet", and the player tries again another day with a new thread.
import { today, genItems } from './core.js';
import { yearComplete, keepingDay } from './session.js';
import { rng, sample, shuffle, matches } from './util.js';
import { newBattle, interleave } from './battle.js';
import { markPortraitSeen } from './wren.js';
import { CONCRETE, VOCAB, FACTS } from '../data/content.js';
import { SPEECH_STOPS, SPEECH_POINTS, MARKET_GOODS } from '../data/echo.js';
import { BOSS_STITCH, BOSS_PHASES } from '../data/forgetting.js';

export const PHASE_IDS = ['fringe', 'body', 'face'];       // the three question phases; the Stitch always comes last
export const SEAM_OPEN_DAY = 3;                              // keeping days of "the Tide climbs" lines before the water is reachable
export const STITCH_COUNT = BOSS_STITCH.count, STITCH_CLOSES = BOSS_STITCH.closesAt;
export const STUDY_SECONDS = { fringe: 60, body: 60, face: 60, thread: 90 };
export const USED_CAP = 12;

export function ensureSeam(p) {
  const s = p.seam && typeof p.seam === 'object' && !Array.isArray(p.seam) ? p.seam : (p.seam = { met: null, cleared: [], tries: 0, best: 0, rests: 0, last: null, used: [], closed: null, held: null, epilogue: null });
  if (!Array.isArray(s.cleared)) s.cleared = [];
  if (!Array.isArray(s.used)) s.used = [];
  for (const k of ['tries', 'best', 'rests']) if (typeof s[k] !== 'number') s[k] = 0;
  return s;
}
// Open once the Year of Keeping is complete and the Tide has been "climbing" for a few keeping days.
export const seamOpen = (p) => yearComplete(p) && keepingDay(p) >= SEAM_OPEN_DAY;
export const seamClosed = (p) => !!p.seam?.closed;
export const endingPending = (p) => seamClosed(p) && !p.seam?.epilogue;

// Which phases a sitting plays. Finished phases stay finished. After a Stitch that was not tied off, the last phase is played again
// as the stretch of questions between studying the thread and recalling it.
export function sittingPlan(p) {
  const done = new Set(p.seam?.cleared || []);
  const todo = PHASE_IDS.filter((id) => !done.has(id));
  return todo.length ? todo : ['face'];
}

// The thread used least so far; a retry is never the same list as the try before.
export function pickThread(p, seed) {
  const r = rng(seed), used = p.seam?.used || [];
  const threads = BOSS_STITCH.threads;
  const uses = (t) => used.filter((x) => x === t.id).length;
  const least = Math.min(...threads.map(uses));
  const pool = threads.filter((t) => uses(t) === least);
  return pool[Math.floor(r() * pool.length)];
}

// ---------- the three question phases ----------
const PRICES = [15, 20, 25, 30, 35, 40, 45, 55, 60, 65, 75, 85, 90, 95];
export function phaseDef(id) { return BOSS_PHASES.find((x) => x.id === id); }

// Returns { id, study: [{ label, text, face? }], entries } for one phase. Deterministic for a seed.
export function buildPhase(id, seed, p) {
  const r = rng(seed);
  const mk = (arr) => arr.map((e, i) => ({ key: `seam:${id}:${i}`, setId: null, i, skill: 'linking', age: 0, d: 1, scene: 'seam', reason: 'Made-up material from the Great Forgetting.', ...e }));
  let study = [], entries = [];
  if (id === 'fringe') {
    const words = sample(CONCRETE, 5, r);
    study = words.map((w, i) => ({ label: `Cart ${i + 1}`, text: w }));
    const cart = [1, 2, 4].map((i) => ({ kind: 'order', fmt: 'Order', t: 'chain', skill: 'linking', prompt: `What was loaded right after "${words[i - 1]}"?`, answer: words[i], count: 5 }));
    const stops = sample(SPEECH_STOPS, 3, r), pts = sample(SPEECH_POINTS, 3, r);
    study.push(...stops.map((s, i) => ({ label: s, text: pts[i] })));
    const hall = [0, 2].map((i) => ({ kind: 'locate', fmt: 'Locate', t: 'palace', skill: 'palace', prompt: `At ${stops[i]}, which point did you leave?`, answer: pts[i], locus: stops[i], stops: stops.slice() }));
    entries = mk([...cart, ...hall]);
  } else if (id === 'body') {
    const { items } = genItems({ t: 'faces', n: 3 }, Math.floor(r() * 1e9), p);
    study = items.map((it) => ({ label: it.answer, face: it.face, text: it.answer }));
    const faces = items.map((it) => ({ kind: 'face', fmt: 'Recall', t: 'faces', skill: 'faces', prompt: 'Someone steps out of the mist. Who is this?', face: it.face, answer: it.answer }));
    const goods = sample(MARKET_GOODS, 3, r), prices = shuffle(PRICES, r).slice(0, 3).map(String);
    study.push(...goods.map((g, i) => ({ label: g, text: prices[i] })));
    const nums = goods.map((g, i) => ({ kind: 'recall', fmt: 'Recall', t: 'major', skill: 'numbers', prompt: `How much were the ${g}?`, answer: prices[i], numeric: true }));
    entries = mk([...faces, ...nums]);
  } else {
    const vocab = sample(VOCAB, 3, r), facts = sample(FACTS, 3, r);
    study = [...vocab.map((v) => ({ label: v[0], text: v[1] })), ...facts.map((f) => ({ label: f[0], text: f[1] }))];
    const vq = vocab.map((v) => ({ kind: 'recall', fmt: 'Recall', t: 'vocab', skill: 'vocab', prompt: `What does "${v[0]}" mean?`, answer: v[1] }));
    const fq = facts.map((f) => ({ kind: 'recall', fmt: 'Recall', t: 'facts', skill: 'structure', prompt: `${f[0]}?`, answer: f[1] }));
    entries = mk([...vq, ...fq]);
  }
  return { id, def: phaseDef(id), study, entries: interleave(shuffle(entries, r)), seconds: STUDY_SECONDS[id] };
}
export const newPhaseBattle = (phase, fx = {}) => newBattle(phase.entries, { ...fx, scene: 'seam' });

// ---------- the Stitch ----------
const strip = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(' ').filter((w) => w && !['a', 'an', 'the', 'of', 'with'].includes(w)).join(' ');
// A bead is right if the reply matches its short answer or one of its other words, exactly or inside a short reply.
export function beadOk(bead, text) {
  const rep = strip(text);
  if (!rep) return false;
  const words = rep.split(' ');
  return [bead.ans, ...(bead.alts || [])].some((c) => {
    const t = strip(c);
    return !!t && (rep === t || matches(rep, t) || (words.length <= 6 && ` ${rep} `.includes(` ${t} `)));
  });
}
export function scoreStitch(thread, responses) {
  const results = thread.beads.map((b, i) => ({ n: b.n, ok: beadOk(b, responses[i]), answer: b.ans, day: b.day, thing: b.thing }));
  const inPlace = results.filter((x) => x.ok).length;
  return { inPlace, results, closed: inPlace >= STITCH_CLOSES, total: thread.beads.length };
}

// ---------- the record ----------
export function startSitting(p) { const s = ensureSeam(p); if (!s.met) s.met = today(p); return s; }
export function clearPhase(p, id) { const s = ensureSeam(p); if (PHASE_IDS.includes(id) && !s.cleared.includes(id)) s.cleared.push(id); }
export function restSitting(p) { ensureSeam(p).rests++; }
export function settleStitch(p, threadId, inPlace) {
  const s = ensureSeam(p);
  s.tries++; s.best = Math.max(s.best, inPlace); s.last = today(p);
  s.used = [...s.used, threadId].slice(-USED_CAP);
  const closed = inPlace >= STITCH_CLOSES;
  if (closed && !s.closed) s.closed = today(p);
  return { closed, tries: s.tries, best: s.best };
}
// Called when the player reads to the end of the ending. held: whether they named Tallow themselves.
export function finishEnding(p, held) {
  const s = ensureSeam(p);
  s.held = held ? 'held' : 'told';
  if (!s.epilogue) s.epilogue = today(p);
  p.story = p.story || { seen: [] };
  p.story.seen = [...new Set([...(p.story.seen || []), 'seam', 'epilogue2'])];
  markPortraitSeen(p);
}
