// v0.10 Echo battles: pure logic. A battle NEVER changes skill estimates, review sets or results (like the Undercroft).
// It reads profile.sets for old memories, and settle() writes only p.battles, a capped amount of Lumen and side-quest checks.
import { TEMPLATE_SKILL } from '../data/curriculum.js';
import { CONCRETE } from '../data/content.js';
import { SCENES, MARKET_GOODS, LANDMARKS, SPEECH_STOPS, SPEECH_POINTS, TURNS, TECHNIQUES, COACHES, COACH_FOR, FORGETTINGS } from '../data/echo.js';
import { matches, majorDecode, rng, shuffle, sample, daysBetween } from './util.js';
import { abstractOk } from './abstract.js';
import { today, genItems } from './core.js';
import { FREE_XP_CAP } from './progress.js';
import { evaluateSideQuests } from './quests.js';

export const RESOLVE = 5;
export const TURNS_PER_BATTLE = 7;
export const MIN_ITEMS = 3;
export const MAX_RETRIES = 2;
export const OLD_AGE = 30;          // items this old hit twice as hard
export const HELD_MIN_AGE = 7;      // only items at least this old can earn anything
export const LUMEN_HELD = 2, LUMEN_HELD_OLD = 3, BATTLE_LUMEN_CAP = 20;
export const HISTORY_CAP = 60, QUEUE_CAP = 40;

export function newBattles() { return { done: 0, held: 0, rests: 0, last: null, skipped: null, queue: [], history: [] }; }
export function ensureBattles(p) {
  const b = p.battles && typeof p.battles === 'object' ? p.battles : (p.battles = newBattles());
  for (const k of ['done', 'held', 'rests']) if (typeof b[k] !== 'number') b[k] = 0;
  if (!Array.isArray(b.queue)) b.queue = [];
  if (!Array.isArray(b.history)) b.history = [];
  return b;
}

// ---------- pulling old items ----------
export const lastHeld = (set, t) => { const h = [...(set.history || [])].reverse().find((x) => x.pass); return h ? daysBetween(h.date, t) : null; };
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
export function reasonFor(age, held, queued) {
  if (queued) return `You missed this one last time. It was learned ${plural(age, 'day')} ago.`;
  return `Learned ${plural(age, 'day')} ago, ${held == null ? 'not tested again yet' : held === 0 ? 'last held today' : `last held ${plural(held, 'day')} ago`}.`;
}

// Which question formats a stored set can support.
export function kindsFor(set) {
  const t = set.t, n = set.items.length;
  if (t === 'pairs') return ['recall', 'reverse'];
  if (t === 'major') return ['recall', 'reverse'];
  if (t === 'vocab') return ['recall', 'reverse'];
  if (t === 'facts') return set.items.some((it) => it.dg) ? [] : ['recall']; // 1.2: a diagram needs its drawing
  if (t === 'faces') return ['face'];
  if (t === 'palace') return set.loci?.length === n ? ['locate', 'order'] : (n >= 3 ? ['order'] : []);
  if (t === 'wordlist' || t === 'chain') return n >= 3 ? ['order'] : [];
  return [];
}
const FMT = { recall: 'Recall', reverse: 'Reverse', order: 'Order', locate: 'Locate', face: 'Recall' };

// 1.2: how a stored item is checked (formulae, years, punchlines, numbers and accepted spellings).
const CHECK_KEYS = ['verb', 'formula', 'year', 'bce', 'joke', 'keyed', 'key', 'alt', 'kind', 'range', 'text'];
const pickCheck = (it) => Object.fromEntries(CHECK_KEYS.filter((k) => it[k] != null).map((k) => [k === 'key' ? 'keys' : k, it[k]]));

export function makeEntry(set, i, kind, age, reason, setId) {
  const it = set.items[i];
  const base = { key: `${setId}:${i}`, setId, i, skill: set.skill || TEMPLATE_SKILL[set.t], t: set.t, kind, fmt: set.t === 'pairs' && kind === 'recall' ? 'Pair' : FMT[kind], age, d: age >= OLD_AGE ? 2 : 1, reason };
  if (kind === 'recall') return { ...base, prompt: set.t === 'major' ? `Your picture for ${it.cue}` : set.t === 'pairs' ? `What went with "${it.cue}"?` : `${it.cue}`, answer: it.answer, cue: it.cue, major: set.t === 'major' ? it.cue : null, ...pickCheck(it) };
  if (kind === 'reverse') return { ...base, prompt: set.t === 'major' ? `Which number goes with "${it.answer}"?` : `What was the cue for "${it.answer}"?`, answer: it.cue, numeric: set.t === 'major' };
  if (kind === 'face') return { ...base, prompt: 'Who is this?', face: it.face, answer: it.answer };
  if (kind === 'locate') return { ...base, prompt: `At the stop "${set.loci[i]}", what did you place?`, answer: it.answer, locus: set.loci[i], stops: set.loci.slice() };
  // order: what came right after the previous item (or what came first)
  const prev = i === 0 ? null : set.items[i - 1].answer;
  return { ...base, prompt: prev == null ? 'What came first?' : `What came right after "${prev}"?`, answer: it.answer, count: set.items.filter((x) => !x.lure).length };
}

// Pick up to `max` entries from the player's own stored sets. Deterministic for a seed.
export function pullEntries(p, seed, max = TURNS_PER_BATTLE) {
  const t = today(p), r = rng(seed);
  const queue = (p.battles?.queue || []);
  const queued = new Set(queue.map((q) => `${q.set}:${q.i}`));
  const cands = [];
  for (const set of p.sets || []) {
    const age = daysBetween(set.created, t);
    if (age < 1 || !Array.isArray(set.items)) continue;
    const kinds = kindsFor(set);
    if (!kinds.length) continue;
    const idxs = set.items.map((it, i) => i).filter((i) => !set.items[i].lure && String(set.items[i].answer || '').trim());
    if (!idxs.length) continue;
    const due = !set.retired && set.due <= t;
    const q = idxs.some((i) => queued.has(`${set.id}:${i}`));
    const w = q ? 4 : due ? 3 : 1;
    cands.push({ set, age, idxs, w, q, key: -Math.log(Math.max(1e-9, r())) / w });
  }
  cands.sort((a, b) => a.key - b.key);
  // earlier misses first (at most 2), then one or two items per set in weighted order
  const entries = [], used = new Set();
  const add = (c, i, qd) => {
    const k = `${c.set.id}:${i}`;
    if (used.has(k) || entries.length >= max) return;
    const kinds = kindsFor(c.set);
    const kind = kinds[Math.floor(r() * kinds.length)];
    used.add(k);
    entries.push(makeEntry(c.set, i, kind, c.age, reasonFor(c.age, lastHeld(c.set, t), qd), c.set.id));
  };
  let nq = 0;
  for (const c of cands) for (const i of c.idxs) if (queued.has(`${c.set.id}:${i}`) && nq < 2) { add(c, i, true); nq++; }
  for (const c of cands) {
    const take = Math.min(c.idxs.length, entries.length < max - 2 ? 2 : 1);
    for (const i of sample(c.idxs, take, r)) add(c, i, false);
  }
  return interleave(entries);
}
// No two neighbours from the same skill when it can be avoided.
export function interleave(list) {
  const left = list.slice(), out = [];
  while (left.length) {
    const lastSkill = out[out.length - 1]?.skill;
    let k = left.findIndex((e) => e.skill !== lastSkill);
    if (k < 0) k = 0;
    out.push(left.splice(k, 1)[0]);
  }
  return out;
}

export function enemyFor(entries) {
  const count = {};
  for (const e of entries) count[e.skill] = (count[e.skill] || 0) + 1;
  const skill = Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] || 'imagery';
  const f = FORGETTINGS[skill];
  return { skill, name: f.name, kind: f.kind, skills: Object.keys(count), hp: entries.reduce((a, e) => a + e.d, 0) };
}
export function coachFor(p, entries) {
  const want = COACH_FOR[enemyFor(entries).skill];
  const c = COACHES[want];
  return c && (!c.gate || (p.progress?.gates || []).includes(c.gate)) ? want : 'wren';
}

// ---------- when a Memory Echo is offered ----------
// After the first gate, at most one a day, and less often early on. "Not now" never costs anything.
export function echoOffer(p, date = today(p)) {
  const gates = (p.progress?.gates || []).length;
  if (gates < 1) return null;
  const b = p.battles || {};
  if (b.skipped === date || b.last === date) return null;
  const gap = gates < 3 ? 3 : gates < 6 ? 2 : 1;
  if (b.last && daysBetween(b.last, date) < gap) return null;
  const entries = pullEntries(p, 1, TURNS_PER_BATTLE);
  if (entries.length < MIN_ITEMS) return null;
  const e = entries[0];
  return { count: entries.length, reason: e.reason, skill: enemyFor(entries).skill };
}
export const canFight = (p) => pullEntries(p, 1).length >= MIN_ITEMS;

// ---------- scenes ----------
export const sceneOpen = (p, id) => (p.progress?.gates || []).includes(SCENES[id].gate);
export function buildScene(id, seed, p) {
  const sc = SCENES[id], r = rng(seed);
  const mk = (arr, over) => arr.map((e, i) => ({ key: `${id}:${i}`, setId: null, i, skill: TEMPLATE_SKILL.wordlist, age: 0, d: 1, scene: id, reason: `Made-up material from the ${sc.title}.`, ...e, ...(over || {}) }));
  let study = [], entries = [], distraction = null;
  if (id === 'packing') {
    const words = sample(CONCRETE, 7, r);
    study = words.map((w, i) => ({ label: `${i + 1}`, text: w }));
    entries = mk(words.map((w, i) => ({ kind: 'order', fmt: 'Order', t: 'chain', prompt: i === 0 ? 'What was loaded first?' : `What was loaded right after "${words[i - 1]}"?`, answer: w, count: 7 })).filter((e, i) => i > 0 && i !== 3).slice(0, 5));
    const a = 11 + Math.floor(r() * 20), b = 12 + Math.floor(r() * 20);
    distraction = { q: `The foreman calls out: what is ${a} + ${b}?`, a: String(a + b) };
  } else if (id === 'speech') {
    const pts = sample(SPEECH_POINTS, 5, r);
    study = SPEECH_STOPS.map((s, i) => ({ label: s, text: pts[i] }));
    entries = mk(SPEECH_STOPS.map((s, i) => ({ kind: 'locate', fmt: 'Locate', t: 'palace', prompt: `At ${s}, which point did you leave?`, answer: pts[i], locus: s, stops: SPEECH_STOPS.slice() })));
  } else if (id === 'crossroads') {
    const marks = sample(LANDMARKS, 6, r);
    const dirs = marks.map(() => TURNS[Math.floor(r() * TURNS.length)]);
    study = marks.map((m, i) => ({ label: `Turn ${i + 1}`, text: `${dirs[i]} at the ${m}` }));
    entries = mk(marks.map((m, i) => ({ kind: 'recall', fmt: 'Recall', t: 'chain', prompt: `Turn ${i + 1}: you went ${dirs[i]}. What stood there?`, answer: m })).slice(0, 6));
  } else if (id === 'gala') {
    const { items } = genItems({ t: 'faces', n: 5 }, Math.floor(r() * 1e9), p);
    study = items.map((it) => ({ label: it.answer, face: it.face, text: it.answer }));
    entries = mk(items.map((it) => ({ kind: 'face', fmt: 'Recall', t: 'faces', skill: 'faces', prompt: 'A guest greets you. Who is this?', face: it.face, answer: it.answer })));
  } else if (id === 'market') {
    const goods = sample(MARKET_GOODS, 5, r);
    const prices = shuffle([15, 20, 25, 30, 35, 40, 45, 55, 60, 65, 75, 85, 90, 95], r).slice(0, 5).map(String);
    study = goods.map((g, i) => ({ label: g, text: prices[i] }));
    entries = mk(goods.map((g, i) => ({ kind: 'recall', fmt: 'Recall', t: 'major', skill: 'numbers', prompt: `How much were the ${g}?`, answer: prices[i], numeric: true })));
    entries = entries.slice(0, 5);
  }
  return { id, scene: sc, study, entries: interleave(shuffle(entries, r)), distraction, studySeconds: sc.study };
}
export const TECH_NAME = Object.fromEntries(TECHNIQUES.map((t) => [t.id, t.name]));
// A good fit gives 25 percent more study time. A poor fit gives a tip and nothing worse.
export function techniqueResult(sceneId, choice) {
  const sc = SCENES[sceneId];
  const good = sc.fit.includes(choice);
  return { good, studyMult: good ? 1.25 : 1, tip: good ? 'Good fit. You get a little longer to study.' : (sc.tips[choice] || 'That can work, but another move fits this material better.') };
}

// ---------- the fight ----------
const norm = (s) => String(s ?? '').trim();
export function isRight(entry, response) {
  if (!norm(response)) return false;
  if (entry.numeric) return norm(response).replace(/\D/g, '') === norm(entry.answer).replace(/\D/g, '') || (entry.t === 'major' && majorDecode(response) === entry.answer);
  if (entry.t === 'major' && entry.kind === 'recall') return matches(response, entry.answer) || (entry.major != null && majorDecode(response) === String(entry.major));
  const ab = abstractOk(response, { ...entry, key: entry.keys });
  if (ab !== null) return ab;
  return matches(response, entry.answer) || (entry.alt || []).some((a) => matches(response, a));
}
export const hintOf = (entry) => `Starts with "${String(entry.answer)[0].toUpperCase()}"`;

export function newBattle(entries, opts = {}) {
  return {
    entries, line: entries.map((e) => e.key), by: Object.fromEntries(entries.map((e) => [e.key, e])),
    state: Object.fromEntries(entries.map((e) => [e.key, { status: 'open', tries: 0, hinted: false, eased: false, lantern: false }])),
    resolve: RESOLVE, hp: entries.reduce((a, e) => a + e.d, 0), hpMax: entries.reduce((a, e) => a + e.d, 0),
    skipUsed: false, over: false, outcome: null, effects: { letters: !!opts.letters, count: !!opts.count, stops: !!opts.stops }, scene: opts.scene || null, log: [],
  };
}
export const current = (b) => (b.over ? null : b.by[b.line[0]] || null);
export const isRetry = (b) => { const e = current(b); return !!e && b.state[e.key].tries > 0; };
export function useHint(b) { const e = current(b); if (!e) return null; b.state[e.key].hinted = true; return hintOf(e); }

// What the gear may show for this prompt, never an answer.
export function aids(b) {
  const e = current(b);
  if (!e) return {};
  const out = {};
  if (b.effects.count && e.kind === 'order' && e.count) out.count = e.count;
  if (b.effects.stops && e.kind === 'locate' && e.stops) {
    const done = new Set(b.entries.filter((x) => x.kind === 'locate' && x.stops === e.stops && ['held', 'eased', 'relearned'].includes(b.state[x.key].status)).map((x) => x.locus));
    out.emptyStops = e.stops.filter((s) => !done.has(s));
  }
  return out;
}

function settleEnd(b) {
  const open = b.entries.filter((e) => ['open', 'missed'].includes(b.state[e.key].status));
  if (b.resolve <= 0) { for (const e of open) b.state[e.key].status = 'queued'; b.line = []; }
  if (!b.line.length) {
    b.over = true;
    b.outcome = b.resolve > 0 ? 'won' : 'rest';
    for (const e of b.entries) if (b.state[e.key].status === 'open') b.state[e.key].status = 'queued';
  }
}

// Returns { ok, damage, over, answer, lantern?, letter?, retry }.
export function answer(b, response) {
  const e = current(b);
  if (!e) return null;
  const s = b.state[e.key];
  const retry = s.tries > 0;
  const ok = isRight(e, response);
  const res = { ok, retry, answer: e.answer, damage: 0, key: e.key };
  if (ok) {
    b.line.shift();
    if (retry) { s.status = 'relearned'; }
    else { s.status = s.hinted || s.eased ? 'eased' : 'held'; res.damage = e.d * (s.hinted || s.eased ? 0.5 : 1); }
    b.hp = Math.max(0, b.hp - (retry ? 0 : res.damage));
    b.log.push({ key: e.key, status: s.status });
    settleEnd(b);
    res.status = s.status; res.over = b.over;
    return res;
  }
  // wrong: the lantern offers one more try, once, on a first attempt
  if (!retry && b.effects.letters && !s.lantern) {
    s.lantern = true; s.eased = true;
    res.lantern = true; res.letter = hintOf(e); res.over = false; res.status = 'open';
    return res;
  }
  if (!retry) {
    b.resolve = Math.max(0, b.resolve - 1);
    s.status = 'missed'; s.tries = 1;
    b.line.shift();
    if (b.resolve > 0) b.line.splice(Math.min(b.line.length, 2), 0, e.key); // asked again a couple of turns later
  } else {
    s.tries++;
    b.line.shift();
    if (s.tries > MAX_RETRIES) s.status = 'queued'; else b.line.splice(Math.min(b.line.length, 2), 0, e.key);
  }
  b.log.push({ key: e.key, status: s.status });
  settleEnd(b);
  res.status = b.state[e.key].status; res.over = b.over;
  return res;
}

// One skip per battle. The item is queued for a quiet review next time. No penalty.
export function skip(b) {
  const e = current(b);
  if (!e || b.skipUsed || b.state[e.key].tries > 0) return false;
  b.skipUsed = true;
  b.state[e.key].status = 'queued';
  b.line.shift();
  settleEnd(b);
  return true;
}

export function leave(b) {
  b.over = true; b.outcome = 'left'; b.line = [];
  for (const e of b.entries) if (['open', 'missed'].includes(b.state[e.key].status)) b.state[e.key].status = 'queued';
}

// ---------- results and rewards ----------
export function summarize(b) {
  const by = (st) => b.entries.filter((e) => b.state[e.key].status === st);
  const held = by('held').filter((e) => !e.scene && e.age >= HELD_MIN_AGE);
  const raw = held.reduce((a, e) => a + (e.age >= OLD_AGE ? LUMEN_HELD_OLD : LUMEN_HELD), 0);
  return { outcome: b.outcome, items: b.entries.length, held: held.length, heldAll: by('held').length, eased: by('eased').length, relearned: by('relearned').length, queued: by('queued'), lumenRaw: Math.min(BATTLE_LUMEN_CAP, raw), scene: b.scene };
}

// Writes the record. Touches only p.battles, p.progress.lumen / freeXp (inside the daily free-practice cap) and side quests.
export function settle(p, b) {
  const s = summarize(b);
  const bt = ensureBattles(p);
  const t = today(p);
  let lumen = 0;
  if (!s.scene && b.outcome !== 'left') {
    const fx = p.progress.freeXp && p.progress.freeXp.date === t && Number.isFinite(p.progress.freeXp.xp) ? p.progress.freeXp : { date: t, xp: 0 };
    lumen = Math.max(0, Math.min(s.lumenRaw, FREE_XP_CAP - fx.xp));
    p.progress.freeXp = { date: t, xp: fx.xp + lumen };
    p.progress.lumen += lumen;
    bt.held += s.held;
  }
  if (b.outcome !== 'left' && !s.scene) { bt.done++; bt.last = t; if (b.outcome === 'rest') bt.rests++; }
  if (!s.scene) {
    const gone = new Set(b.entries.filter((e) => ['held', 'eased', 'relearned'].includes(b.state[e.key].status)).map((e) => e.key));
    const add = s.queued.filter((e) => e.setId).map((e) => ({ set: e.setId, i: e.i, date: t }));
    bt.queue = [...bt.queue.filter((q) => !gone.has(`${q.set}:${q.i}`) && !add.some((a) => a.set === q.set && a.i === q.i)), ...add].slice(-QUEUE_CAP);
  }
  bt.history = [...bt.history, { date: t, mode: s.scene || 'echo', outcome: b.outcome, items: s.items, held: s.held, relearned: s.relearned, queued: s.queued.length, lumen }].slice(-HISTORY_CAP);
  const quests = evaluateSideQuests(p).map((q) => q.id);
  return { ...s, lumen, quests };
}
