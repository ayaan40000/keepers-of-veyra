// The Undercroft: pure run logic. Never touches p.skills, p.progress or p.results.
import { WEEKS, TEMPLATE_SKILL } from '../data/curriculum.js';
import { CRYPT_MODIFIERS, bossFor, CRYPT_TUNING as T, CRYPT_BASE, CRYPT_GROWTH, CRYPT_SQUEEZE, CRYPT_SQUEEZE_FLOOR, CRYPT_VARIANTS, TREASURES, TABLETS, CHEST_LINES, bandFor } from '../data/crypt.js';
import { genItems } from './core.js';
import { rng } from './util.js';

export const ALL_TEMPLATES = Object.keys(CRYPT_BASE);

// First curriculum week each template is used (wordlist 1, pairs 2, chain 3, palace 5, faces 9, major 14, digits 17, vocab 22, facts 27).
export const TEMPLATE_FIRST_WEEK = (() => {
  const out = {};
  for (const w of WEEKS) for (const d of [...w.drills, w.check]) if (out[d.t] == null) out[d.t] = w.w;
  return out;
})();

export function newCrypt() {
  return { keys: T.startKeys, deepest: 0, runs: 0, treasures: {}, tablets: {}, run: null, history: [] };
}

// Null-safe: creates or repairs p.crypt and returns it.
export function ensureCrypt(p) {
  if (!p) return newCrypt();
  if (!p.crypt || typeof p.crypt !== 'object') p.crypt = newCrypt();
  const c = p.crypt;
  if (typeof c.keys !== 'number' || Number.isNaN(c.keys)) c.keys = T.startKeys;
  if (typeof c.deepest !== 'number') c.deepest = 0;
  if (typeof c.runs !== 'number') c.runs = 0;
  if (!c.treasures || typeof c.treasures !== 'object') c.treasures = {};
  if (!c.tablets || typeof c.tablets !== 'object') c.tablets = {};
  if (c.run === undefined) c.run = null;
  if (!Array.isArray(c.history)) c.history = [];
  return c;
}

// Adds keys (cap 5 held). Returns how many were actually added.
export function grantKeys(p, n = 1) {
  const c = ensureCrypt(p);
  const before = c.keys;
  c.keys = Math.max(0, Math.min(T.maxKeys, before + Math.max(0, Math.floor(n))));
  return c.keys - before;
}

export const canEnter = (p) => { const c = p?.crypt; return !!c && !c.run && (c.keys ?? 0) >= T.entryCost; };
export const hasRun = (p) => !!p?.crypt?.run;

const nowISO = () => new Date().toISOString();
const dateISO = () => nowISO().slice(0, 10);

// The weekly descent (v0.6): one seed per ISO week, so the same stair all week long.
export function weekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const y = d.getUTCFullYear();
  const w = Math.ceil(((d - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7);
  return `${y}-W${String(w).padStart(2, '0')}`;
}
export function weeklySeed(key) {
  let h = 2166136261;
  for (const ch of `mnemos-undercroft-${key}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// Spend a key and begin at floor 1. Returns the run, or null if the player cannot enter.
// opts: { weekly: bool, mods: ['dim', 'swift'] }
export function startRun(p, seed, opts = {}) {
  const c = ensureCrypt(p);
  if (c.run || c.keys < T.entryCost) return null;
  const mods = (opts.mods || []).filter((m) => CRYPT_MODIFIERS.some((x) => x.id === m));
  const week = opts.weekly ? weekKey() : null;
  c.keys -= T.entryCost;
  c.runs += 1;
  c.run = {
    floor: 1, lamps: mods.includes('dim') ? T.lamps - 1 : T.lamps, seed: (week ? weeklySeed(week) : (seed ?? Math.floor(Math.random() * 1e9))) >>> 0, attempt: 0,
    startedAt: nowISO(), log: [], found: { treasures: [], tablets: [] }, chests: 0, bestBefore: c.deepest,
    ...(week ? { weekly: week } : {}), ...(mods.length ? { mods } : {}),
  };
  return c.run;
}
export const maxLamps = (run) => (run?.mods?.includes('dim') ? T.lamps - 1 : T.lamps);
export const isBossFloor = (floor) => floor >= T.bossEvery && floor % T.bossEvery === 0;

// ---------- templates and scaling ----------
const curWeek = (p) => Math.max(1, Math.min(52, Math.floor(((p?.progress?.day || 1) - 1) / 7) + 1));
const longestPalace = (p) => Math.max(0, ...(p?.palaces || []).map((x) => x.loci?.length || 0));

// Templates opened by the curriculum (or all, with the reviewer unlock).
export function unlockedTemplates(p) {
  if (p?.progress?.reviewerUnlock) return ALL_TEMPLATES.slice();
  const w = curWeek(p);
  return ALL_TEMPLATES.filter((t) => (TEMPLATE_FIRST_WEEK[t] ?? 99) <= w);
}

// Unlocked templates usable right now (palace needs a palace of at least 5 stops).
export function floorPool(p) {
  const pool = unlockedTemplates(p).filter((t) => t !== 'palace' || longestPalace(p) >= 5);
  return pool.length ? pool : ['wordlist'];
}

// Count and study seconds for a template at a depth (no variants, no palace cap).
export function depthShape(t, floor) {
  const b = CRYPT_BASE[t];
  const f = Math.max(1, floor);
  let n = Math.min(b.cap, Math.round(b.n * (1 + CRYPT_GROWTH * (f - 1))));
  if (t === 'digits' && n % 2) n += 1;
  const perItem = b.s ? (b.s / b.n) * Math.max(CRYPT_SQUEEZE_FLOOR, 1 - CRYPT_SQUEEZE * (f - 1)) : 0;
  const s = b.s ? Math.max(T.minStudy, Math.round(n * perItem)) : 0;
  return { n, s, perItem };
}

const majorRange = (floor) => (floor < 4 ? 10 : floor < 9 ? 50 : 100);

// Which variants a floor rolls (deterministic per seed and floor).
export function floorVariants(t, floor, seed) {
  const pool = CRYPT_VARIANTS[t] || [];
  if (floor < T.variantFrom || !pool.length) return [];
  const r = rng((seed ^ Math.imul(floor, 0x9e3779b1)) >>> 0);
  const out = [];
  const p1 = Math.min(1, 0.4 + 0.06 * (floor - T.variantFrom));
  if (r() < p1) out.push(pool[Math.floor(r() * pool.length)]);
  if (floor >= T.doubleVariantFrom && pool.length > 1) {
    const p2 = Math.min(1, 0.3 + 0.05 * (floor - T.doubleVariantFrom));
    const other = pool.find((v) => !out.includes(v));
    if (other && r() < p2) out.push(other);
  }
  return out;
}

function rawPick(pool, seed, floor) {
  const r = rng((seed + Math.imul(floor, 7919)) >>> 0);
  return Math.floor(r() * pool.length);
}

// The template for a floor: random from the pool, never the same as the floor above when there is a choice.
export function floorTemplate(p, floor, seed) {
  const pool = floorPool(p);
  let i = rawPick(pool, seed, floor);
  if (pool.length > 1 && floor > 1 && i === rawPick(pool, seed, floor - 1)) i = (i + 1) % pool.length;
  return pool[i];
}

// Echo floors (v0.5): every echoEvery-th floor re-asks, without study, what was held echoBack floors above.
// A retry on an echo floor is an ordinary floor (the same items twice would be a free answer).
export const isEchoFloor = (floor) => floor >= T.echoEvery && floor % T.echoEvery === 0 && floor % T.bossEvery !== 0;
function echoStep(p, floor, attempt) {
  if (!isEchoFloor(floor) || attempt > 0) return null;
  const mem = p?.crypt?.run?.mem?.[floor - T.echoBack];
  if (!mem || !Array.isArray(mem.items) || !mem.items.length) return null;
  const items = mem.items.filter((x) => !x.lure);
  return {
    kind: 'drill', role: 'crypt', echo: true, echoFrom: floor - T.echoBack, spec: { ...mem.spec, s: 0, timed: false, interference: false }, skill: TEMPLATE_SKILL[mem.spec.t],
    level: undefined, items, extra: null, loci: mem.loci || null, floor, attempt, variants: [],
  };
}

// Builds the Drill step for a floor. attempt > 0 keeps the template but draws fresh material.
export function floorSpec(p, floor, seed, attempt = 0) {
  const echo = echoStep(p, floor, attempt);
  if (echo) return echo;
  const t = floorTemplate(p, floor, seed);
  const shape = depthShape(t, floor);
  const variants = floorVariants(t, floor, seed);
  let n = shape.n;
  const boss = isBossFloor(floor);
  if (boss) n = Math.min(CRYPT_BASE[t].cap + 4, Math.round(n * T.bossGrowth));
  if (t === 'digits' && n % 2) n += 1;
  if (t === 'palace') n = Math.min(n, longestPalace(p));
  let s = n !== shape.n ? Math.max(T.minStudy, Math.round(n * shape.perItem)) : shape.s;
  const spec = { t, n, s };
  if (t === 'major') { spec.range = majorRange(floor); delete spec.s; }
  for (const v of variants) spec[v] = true;
  if (spec.lures === true) spec.lures = floor >= 15 ? 2 : 1;
  if (spec.turn && !variants.includes('turn')) delete spec.turn;
  if (spec.interference) spec.s = Math.round(s * 1.1); // a little extra for the second list's cost
  const mult = (p?.user?.prefs?.timerMult || 1) * (p?.crypt?.run?.mods?.includes('swift') ? 0.75 : 1); // extended timers apply here too
  if (spec.s && mult !== 1) spec.s = Math.max(T.minStudy, Math.round(spec.s * mult));
  const itemSeed = (seed + Math.imul(floor, 104729) + Math.imul(attempt, 15485863)) >>> 0;
  const g = genItems(spec, itemSeed, p);
  return {
    kind: 'drill', role: 'crypt', spec, skill: TEMPLATE_SKILL[t], level: undefined,
    items: g.items, extra: g.extra || null, floor, attempt, variants, ...(boss ? { boss: true, bossName: bossFor(floor).name } : {}),
  };
}

// ---------- results ----------
function finishRun(p, reason) {
  const c = ensureCrypt(p);
  const run = c.run;
  if (!run) return null;
  const cleared = run.floor - 1;
  const summary = {
    startedAt: run.startedAt, endedAt: nowISO(), reason, // 'climbed' | 'tide'
    reached: run.floor, cleared, lampsLeft: run.lamps, attempts: run.log.length, ...(run.weekly ? { weekly: run.weekly } : {}), ...(run.mods ? { mods: run.mods } : {}),
    acc: run.log.length ? Math.round((run.log.reduce((a, x) => a + x.acc, 0) / run.log.length) * 100) / 100 : 0,
    treasures: run.found.treasures.slice(), tablets: run.found.tablets.slice(), chests: run.chests,
    record: cleared > (run.bestBefore || 0),
  };
  c.history = [...c.history, summary].slice(-T.historyMax);
  if (run.weekly) { c.weekly = { ...(c.weekly || {}) }; c.weekly[run.weekly] = Math.max(c.weekly[run.weekly] || 0, cleared); }
  // Where descents end, kept for life as a small tally (v0.7 tuning): ends[floor reached] = count.
  c.ends = { ...(c.ends || {}) }; c.ends[run.floor] = (c.ends[run.floor] || 0) + 1;
  c.run = null;
  return summary;
}

// Remembers what a passed floor asked, for the echo floor below it. Majors are a reflex, not a memory, so they are skipped.
function remember(run, floor, step, loci) {
  if (!step || step.echo || !step.spec || step.spec.t === 'major') return;
  const mem = { ...(run.mem || {}) };
  mem[floor] = { spec: { t: step.spec.t, n: step.items.length, ...(step.spec.range ? { range: step.spec.range } : {}), ...(step.spec.reverse ? { reverse: true } : {}), ...(step.spec.ordered ? { ordered: true } : {}) }, items: step.items.slice(0, 16), ...(loci ? { loci: loci.slice(0, 16) } : {}) };
  for (const k of Object.keys(mem)) if (+k < floor - T.echoBack) delete mem[k];
  run.mem = mem;
}

// Applies one floor attempt. acc in 0..1. step (optional) is the floor that was played, kept for echo floors.
// Returns { outcome: 'descend'|'retry'|'dead', rewards: { treasures, tablets, chest, oil, chestLine }, floor, lamps, summary? }.
export function applyFloorResult(p, acc, step, loci) {
  const c = ensureCrypt(p);
  const run = c.run;
  const rewards = { treasures: [], tablets: [], chest: false, oil: false, chestLine: null, boss: false };
  if (!run) return { outcome: 'dead', rewards, floor: 0, lamps: 0, summary: null };
  const floor = run.floor;
  const a = Math.max(0, Math.min(1, Number(acc) || 0));
  const pass = a >= T.passAcc - 1e-9;
  delete run.inFloor;
  run.log = [...run.log, { floor, attempt: run.attempt, acc: Math.round(a * 100) / 100, pass }].slice(-T.logMax);
  if (pass) {
    const day = dateISO();
    for (const tr of TREASURES) if (floor >= tr.depth && !c.treasures[tr.id]) { c.treasures[tr.id] = day; rewards.treasures.push(tr.id); run.found.treasures.push(tr.id); }
    for (const tb of TABLETS) if (floor >= tb.depth && !c.tablets[tb.id]) { c.tablets[tb.id] = day; rewards.tablets.push(tb.id); run.found.tablets.push(tb.id); }
    if (floor % T.chestEvery === 0) {
      rewards.chest = true;
      run.chests += 1;
      rewards.chestLine = CHEST_LINES[(floor / T.chestEvery - 1) % CHEST_LINES.length];
      if (run.lamps < maxLamps(run)) { run.lamps += 1; rewards.oil = true; }
    }
    if (isBossFloor(floor)) {
      rewards.boss = true;
      c.bosses = (c.bosses || 0) + 1;
      if (run.lamps < maxLamps(run)) { run.lamps = maxLamps(run); rewards.oil = true; }
    }
    c.deepest = Math.max(c.deepest, floor);
    remember(run, floor, step, loci);
    run.floor = floor + 1;
    run.attempt = 0;
    return { outcome: 'descend', rewards, floor, lamps: run.lamps };
  }
  run.lamps -= 1;
  if (run.lamps <= 0) {
    run.lamps = 0;
    const summary = finishRun(p, 'tide');
    return { outcome: 'dead', rewards, floor, lamps: 0, summary };
  }
  run.attempt += 1;
  return { outcome: 'retry', rewards, floor, lamps: run.lamps };
}

// Marks the floor as begun (study has started). Closing the app before a result costs a flask.
export function enterFloor(p) {
  const run = p?.crypt?.run;
  if (run) run.inFloor = { floor: run.floor, attempt: run.attempt };
  return run;
}

// A floor that was begun but never finished counts as a failed attempt. Returns applyFloorResult's answer, or null.
export function settleAbandonedFloor(p) {
  const run = p?.crypt?.run;
  if (!run?.inFloor) return null;
  const out = applyFloorResult(p, 0);
  if (out.summary) out.summary.reason = 'left';
  return { ...out, left: true };
}

// Leave safely between floors. Everything found is already banked.
export function climbOut(p) {
  return finishRun(p, 'climbed');
}

export const treasureById = (id) => TREASURES.find((x) => x.id === id);
export const tabletById = (id) => TABLETS.find((x) => x.id === id);
export { bandFor, TREASURES, TABLETS };
