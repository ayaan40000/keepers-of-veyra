import { SCHEMA, newProfile, DEFAULT_PREFS } from './engine/core.js';
import { SKILLS, MODULES } from './data/curriculum.js';
import { TREASURES, TABLETS, CRYPT_MODIFIERS } from './data/crypt.js';
import { SIDE_QUESTS } from './data/quests.js';
import { hashStr } from './engine/util.js';
import { FURNITURE_KINDS } from './engine/room.js';
import { GEAR, SLOTS } from './data/gear.js';
import { ITEM_BY_ID } from './data/items.js';
import { TRIALS } from './data/trials.js';
import { EVENT_IDS, EVENTS, HISTORY_CAP, blankEvents } from './data/events.js';
import { WF_BEATS, WF_QUESTIONS } from './data/wren.js';
import { blankOwn, validateOwn } from './engine/owntext.js';
import { blankLedger, validateLedger } from './engine/ledger.js';
import { blankGloss, validateGloss } from './engine/gloss.js';
import { ensureRoad, validateRoad } from './engine/road.js';


export const MAX_IMPORT_BYTES = 10 * 1024 * 1024; // 1.8: raised from 5 MB so a full Keeper's Ledger and Own Text shelf fit in one backup

const DB = 'mnemos', STORE = 'kv', KEY = 'profile';
export const LS_KEY = 'mnemos.profile';

export function peekSaved() {
  try { const v = localStorage.getItem(LS_KEY); return v ? JSON.parse(v) : null; } catch { return null; }
}
let dbp = null;
export let backend = 'none';

function openDB() {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    try {
      if (typeof indexedDB === 'undefined') return reject(new Error('no idb'));
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (e) { reject(e); }
  });
  return dbp;
}

async function idbGet() {
  const db = await openDB();
  return new Promise((res, rej) => { const r = db.transaction(STORE).objectStore(STORE).get(KEY); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
}
async function idbPut(v) {
  const db = await openDB();
  return new Promise((res, rej) => { const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).put(v, KEY); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); });
}
async function idbDel() {
  const db = await openDB();
  return new Promise((res) => { const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).delete(KEY); tx.oncomplete = () => res(); tx.onerror = () => res(); });
}

export async function loadProfile() {
  let fromIdb = null, fromLs = null;
  try { const v = await idbGet(); backend = 'IndexedDB'; if (v) fromIdb = JSON.parse(v); } catch { backend = 'localStorage'; }
  try { const v = localStorage.getItem(LS_KEY); if (v) fromLs = JSON.parse(v); } catch { if (backend !== 'IndexedDB') backend = 'memory'; }
  let tomb = 0; try { tomb = +localStorage.getItem(LS_KEY + '.deleted') || 0; } catch { /* ignore */ }
  if (fromIdb && (fromIdb.meta?.savedAt || 0) <= tomb) fromIdb = null; // deleted, IndexedDB delete may not have finished
  const pick = [fromIdb, fromLs].filter(Boolean).sort((x, y) => (y.meta?.savedAt || 0) - (x.meta?.savedAt || 0))[0];
  return pick ? migrate(pick) : null;
}

// localStorage is written synchronously (survives an immediate reload); IndexedDB writes are
// serialized and coalesced so only the newest state is written and a delete is never overtaken.
let queue = Promise.resolve();
let pending = null;
export function saveProfile(p) {
  p.meta.savedAt = Date.now();
  const json = JSON.stringify(p);
  try { localStorage.setItem(LS_KEY, json); } catch { /* quota or private mode: IndexedDB copy remains */ }
  const first = pending === null;
  pending = json;
  if (first) {
    queue = queue.then(async () => {
      const latest = pending; pending = null;
      try { if (latest) await idbPut(latest); backend = 'IndexedDB'; } catch { backend = 'localStorage'; }
    });
  }
  return queue;
}

export function deleteProfile() {
  try { localStorage.removeItem(LS_KEY); localStorage.setItem(LS_KEY + '.deleted', String(Date.now())); } catch { /* ignore */ }
  pending = null;
  queue = queue.then(async () => { try { await idbDel(); } catch { /* ignore */ } });
  return queue;
}

export async function requestPersistence() {
  try { if (navigator.storage?.persist) return await navigator.storage.persist(); } catch { /* ignore */ }
  return false;
}

export function migrate(p) {
  if (!p || !p.meta) return p;
  p.progress.gateRetry = p.progress.gateRetry || {};
  p.progress.fullDates = p.progress.fullDates || [];
  const from = p.meta.schema || 1;
  if (from < 2) {
    // v0.4: sound is off unless the player chose it; new optional records for tips, relic polish and session stats.
    const prefs = p.user.prefs || (p.user.prefs = {});
    if (prefs.sound !== true) prefs.sound = false;
    for (const [k, v] of Object.entries(DEFAULT_PREFS)) if (prefs[k] === undefined) prefs[k] = v;
  }
  if (!isObj(p.tips) || !Array.isArray(p.tips.seen)) p.tips = { seen: [] };
  if (!isObj(p.relics) || !isObj(p.relics.polish)) p.relics = { polish: {} };
  if (!isObj(p.stats) || !Array.isArray(p.stats.sessions)) p.stats = { sessions: [] };
  // v0.10 Field Guide: dates the player said they tried a real-life task, and dates they chose "not now"
  if (!isObj(p.guide)) p.guide = { tried: {}, later: {} };
  if (!isObj(p.guide.tried)) p.guide.tried = {};
  if (!isObj(p.guide.later)) p.guide.later = {};
  // v0.10 Keeper gear and Echo battle record
  if (!isObj(p.keeper)) p.keeper = {};
  if (!isObj(p.keeper.equip)) p.keeper.equip = {};
  for (const sl of SLOTS) if (p.keeper.equip[sl.id] === undefined) p.keeper.equip[sl.id] = null;
  if (!isObj(p.battles)) p.battles = { done: 0, held: 0, rests: 0, last: null, skipped: null, queue: [], history: [] };
  for (const k of ['done', 'held', 'rests']) if (typeof p.battles[k] !== 'number') p.battles[k] = 0;
  if (!Array.isArray(p.battles.queue)) p.battles.queue = [];
  if (!Array.isArray(p.battles.history)) p.battles.history = [];
  // v0.11 District Trials and vaults
  if (!isObj(p.trials)) p.trials = {};
  // 1.1 Brambles, Mirror Room, Wren's Audit, the Long Vigil and the Voices / Brambles settings
  if (!isObj(p.brambles)) p.brambles = { thorns: {}, chests: {} };
  if (!isObj(p.brambles.thorns)) p.brambles.thorns = {};
  if (!isObj(p.brambles.chests)) p.brambles.chests = {};
  if (!isObj(p.mirror)) p.mirror = { episode: null, lit: {} };
  if (!isObj(p.mirror.lit)) p.mirror.lit = {};
  if (!isObj(p.audit)) p.audit = { done: 0, last: null };
  if (typeof p.audit.done !== 'number') p.audit.done = 0;
  // 1.1 Event Hall: best results, the Say-Back Games season and the rival's marks
  if (!isObj(p.events)) p.events = blankEvents();
  if (!isObj(p.events.best)) p.events.best = blankEvents().best;
  for (const id of EVENT_IDS) if (p.events.best[id] === undefined) p.events.best[id] = null;
  if (!Array.isArray(p.events.history)) p.events.history = [];
  if (typeof p.events.pace !== 'boolean') p.events.pace = false;
  if (!isObj(p.events.season)) p.events.season = blankEvents().season;
  for (const k of ['snap', 'posted', 'marks']) if (!isObj(p.events.season[k])) p.events.season[k] = {};
  // 1.1 Chapter 13 (the Seam) and Wren's Story Memory
  if (!isObj(p.seam)) p.seam = { met: null, cleared: [], tries: 0, best: 0, rests: 0, last: null, used: [], closed: null, held: null, epilogue: null };
  if (!Array.isArray(p.seam.cleared)) p.seam.cleared = [];
  if (!Array.isArray(p.seam.used)) p.seam.used = [];
  for (const k of ['tries', 'best', 'rests']) if (typeof p.seam[k] !== 'number') p.seam[k] = 0;
  if (!isObj(p.wren)) p.wren = { seen: {}, asked: {}, lastBeat: null, lastQ: null };
  if (!isObj(p.wren.seen)) p.wren.seen = {};
  if (!isObj(p.wren.asked)) p.wren.asked = {};
  if (isObj(p.user?.prefs)) {
    if (typeof p.user.prefs.wrenMemory !== 'boolean') p.user.prefs.wrenMemory = true;
    if (typeof p.user.prefs.ledgerFirst !== 'boolean') p.user.prefs.ledgerFirst = true;
    if (typeof p.user.prefs.brambles !== 'boolean') p.user.prefs.brambles = true;
    if (!['off', 'light', 'full'].includes(p.user.prefs.voices)) p.user.prefs.voices = 'light';
  }
  // 1.1 Your Own Text: the player's own texts and their checks (stays in this browser)
  if (!isObj(p.own) || !Array.isArray(p.own.texts)) p.own = blankOwn();
  if (!Array.isArray(p.own.history)) p.own.history = [];
  if (!Number.isInteger(p.own.v)) p.own.v = 1;
  // 1.3 The Keeper's Ledger: the player's own cards in books (stays in this browser)
  if (!isObj(p.ledger) || !Array.isArray(p.ledger.books)) p.ledger = blankLedger();
  if (!Array.isArray(p.ledger.history)) p.ledger.history = [];
  if (!isObj(p.ledger.daily)) p.ledger.daily = { date: null, newCards: 0, reviews: 0 };
  // 1.6 The Wardens' Road (Champion Track): fills any missing field with its default
  if (p.road != null && !isObj(p.road)) p.road = null;
  if (p.road) ensureRoad(p);
  // 1.4 The Gloss (self-marked explanations)
  if (!isObj(p.gloss) || !isObj(p.gloss.items)) p.gloss = blankGloss();
  if (!Array.isArray(p.gloss.history)) p.gloss.history = [];
  // Schema 3 (1.2): Carry it (if-then plans and real-life lists to recall later) and the technique ladder
  if (!isObj(p.habits)) p.habits = { plans: [], carry: [] };
  if (!Array.isArray(p.habits.plans)) p.habits.plans = [];
  if (!Array.isArray(p.habits.carry)) p.habits.carry = [];
  if (!isObj(p.ladder)) p.ladder = {};
  p.meta.schema = SCHEMA;
  return p;
}

export function buildExport(p) {
  const profile = { ...p, inProgress: null };
  const body = JSON.stringify(profile);
  return JSON.stringify({ app: 'mnemos', schema: SCHEMA, exportedAt: new Date().toISOString(), checksum: hashStr(body).toString(16), profile }, null, 1);
}

// Returns {ok, profile, warning} or {ok:false, error}
const isDate = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
const isNum = (x, lo = -Infinity, hi = Infinity) => typeof x === 'number' && Number.isFinite(x) && x >= lo && x <= hi;
const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);

// Full structural validation. Returns an error message or null.
export function validateProfile(p) {
  if (!isObj(p)) return 'Profile is not an object.';
  if (!isObj(p.meta) || !isObj(p.user) || typeof p.user.alias !== 'string' || !isObj(p.progress)) return 'Profile header is damaged.';
  const g = p.progress;
  if (!isNum(g.day, 1, 365) || !Number.isInteger(g.day)) return 'Curriculum day is invalid.';
  if (!isNum(g.lumen, 0)) return 'Lumen total is invalid.';
  if (!Array.isArray(g.trainingDates) || !g.trainingDates.every(isDate)) return 'Training dates are invalid.';
  if (g.fullDates && (!Array.isArray(g.fullDates) || !g.fullDates.every(isDate))) return 'Session dates are invalid.';
  if (!Array.isArray(g.gates) || !g.gates.every((x) => MODULES.some((m) => m.id === x))) return 'Gate list is invalid.';
  for (const k of ['freeXp', 'gateRetry']) if (g[k] != null && !isObj(g[k])) return `Progress field "${k}" is invalid.`;
  if (g.dayOffset != null && !isNum(g.dayOffset, -3650, 3650)) return 'Clock offset is invalid.';
  if (!isObj(p.skills)) return 'Skills are missing.';
  for (const k of Object.keys(SKILLS)) {
    const s = p.skills[k];
    if (!isObj(s) || !isNum(s.level, 1, 10) || !isNum(s.attempts, 0) || !isNum(s.mastery, 0, 4) || !Array.isArray(s.probes) || !isObj(s.errs)) return `Skill "${k}" is invalid.`;
    if (s.avg != null && !isNum(s.avg, 0, 1)) return `Skill "${k}" average is invalid.`;
    if (!s.probes.every((x) => isObj(x) && isNum(x.delay) && isNum(x.score, 0, 1))) return `Skill "${k}" probe history is invalid.`;
    if (s.recentErrs != null && (!Array.isArray(s.recentErrs) || !s.recentErrs.every(isObj))) return `Skill "${k}" error history is invalid.`;
    if (!Object.values(s.errs).every((v) => isNum(v, 0))) return `Skill "${k}" error counts are invalid.`;
  }
  if (!Array.isArray(p.results) || !p.results.every((r) => isObj(r) && isDate(r.date) && isNum(r.acc, 0, 1) && typeof r.t === 'string' && (r.v == null || (typeof r.v === 'string' && r.v.length <= 40)))) return 'Results are invalid.';
  if (!Array.isArray(p.sets) || !p.sets.every((s) => isObj(s) && Array.isArray(s.items) && s.items.every(isObj) && Array.isArray(s.history) && Array.isArray(s.intervals) && isDate(s.due) && isDate(s.created) && isObj(s.spec) && (s.probe == null || (Array.isArray(s.probe) && s.probe.length <= 20 && s.probe.every(isObj))))) return 'Review sets are invalid.';
  if (!Array.isArray(p.palaces) || !p.palaces.every((x) => isObj(x) && typeof x.name === 'string' && typeof x.id === 'string' && Array.isArray(x.loci) && x.loci.every((l) => typeof l === 'string'))) return 'Palaces are invalid.';
  if (p.crypt != null && (!isObj(p.crypt) || !isNum(p.crypt.keys ?? 0, 0, 99) || !isNum(p.crypt.deepest ?? 0, 0) || (p.crypt.treasures != null && !isObj(p.crypt.treasures)))) return 'Crypt record is invalid.';
  if (p.collectionSeen != null && !Array.isArray(p.collectionSeen)) return 'Collection record is invalid.';
  if (p.major != null && (!isObj(p.major) || !Object.values(p.major).every((v) => isStr(v, 40)))) return 'Number images are invalid.';
  return validateExtras(p);
}

const isStr = (x, max = 200) => typeof x === 'string' && x.length <= max;
const isInt = (x, lo, hi) => isNum(x, lo, hi) && Number.isInteger(x);
const datedMap = (m, ids) => isObj(m) && Object.entries(m).every(([k, v]) => (!ids || ids.has(k)) && (isDate(v) || (typeof v === 'string' && isDate(v.slice(0, 10)))));
const TREASURE_IDS = new Set(TREASURES.map((x) => x.id));
const TABLET_IDS = new Set(TABLETS.map((x) => x.id));
const QUEST_IDS = new Set(SIDE_QUESTS.map((x) => x.id));
const THEMES = ['dark', 'light', 'system'];

// Everything beyond the training record: names, settings, story, Crypt, relics and stats.
function validateExtras(p) {
  if (!isStr(p.user.alias, 64)) return 'Alias is too long.';
  if (p.user.avatar != null && !isStr(p.user.avatar, 40)) return 'Avatar is invalid.';
  const pr = p.user.prefs;
  if (pr != null) {
    if (!isObj(pr)) return 'Settings are invalid.';
    if (pr.theme != null && !THEMES.includes(pr.theme)) return 'Theme setting is invalid.';
    if (pr.timerMult != null && ![1, 1.5, 2].includes(pr.timerMult)) return 'Study timer setting is invalid.';
    for (const k of ['sound', 'blips', 'reducedMotion', 'readableFont']) if (pr[k] != null && typeof pr[k] !== 'boolean') return `Setting "${k}" is invalid.`;
    if (pr.volume != null && !isNum(pr.volume, 0, 1)) return 'Volume setting is invalid.';
    if (pr.textSize != null && !isNum(pr.textSize, 1, 1.5)) return 'Text size setting is invalid.';
    if (pr.home != null && !['today', 'veyra'].includes(pr.home)) return 'Home page setting is invalid.';
    if (pr.brambles != null && typeof pr.brambles !== 'boolean') return 'Brambles setting is invalid.';
    if (pr.voices != null && !['off', 'light', 'full'].includes(pr.voices)) return 'Voices setting is invalid.';
    if (pr.wrenMemory != null && typeof pr.wrenMemory !== 'boolean') return 'Wren question setting is invalid.';
    if (pr.ledgerFirst != null && typeof pr.ledgerFirst !== 'boolean') return 'Ledger setting is invalid.';
  }
  if (!p.palaces.every((x) => x.furniture == null || (Array.isArray(x.furniture) && x.furniture.length <= 200 && x.furniture.every((k) => k == null || FURNITURE_KINDS.includes(k))))) return 'Palace furniture is invalid.';
  if (!p.palaces.every((x) => isStr(x.name, 100) && isStr(x.id, 64) && x.loci.length <= 200 && x.loci.every((l) => isStr(l, 120)))) return 'A palace name or stop is too long.';
  if (p.results.length > 20000 || p.sets.length > 5000) return 'The training record is too large.';
  if (p.achievements != null && !datedMap(p.achievements)) return 'Achievements are invalid.';
  if (p.story != null) {
    if (!isObj(p.story)) return 'Story record is invalid.';
    if (p.story.seen != null && (!Array.isArray(p.story.seen) || !p.story.seen.every((x) => isStr(x, 80)))) return 'Story record is invalid.';
    if (p.story.sideDone != null && !datedMap(p.story.sideDone, QUEST_IDS)) return 'Side quest record is invalid.';
  }
  if (p.collectionSeen != null && !p.collectionSeen.every((x) => isStr(x, 80))) return 'Collection record is invalid.';
  const c = p.crypt;
  if (c != null) {
    if (!isInt(c.keys ?? 0, 0, 5) || !isInt(c.deepest ?? 0, 0, 9999) || !isInt(c.runs ?? 0, 0, 1e6)) return 'Crypt record is invalid.';
    if (c.treasures != null && !datedMap(c.treasures, TREASURE_IDS)) return 'Crypt relics are invalid.';
    if (c.tablets != null && !datedMap(c.tablets, TABLET_IDS)) return 'Crypt tablets are invalid.';
    if (c.history != null && (!Array.isArray(c.history) || c.history.length > 100 || !c.history.every((h) => isObj(h) && isInt(h.cleared ?? 0, 0, 9999)))) return 'Crypt history is invalid.';
    if (c.weekly != null && (!isObj(c.weekly) || !Object.entries(c.weekly).every(([k, v]) => /^\d{4}-W\d{2}$/.test(k) && isInt(v, 0, 9999)))) return 'Crypt weekly record is invalid.';
    if (c.ends != null && (!isObj(c.ends) || !Object.entries(c.ends).every(([k, v]) => isInt(+k, 1, 9999) && isInt(v, 0, 1e6)))) return 'Crypt tally is invalid.';
    if (c.bosses != null && !isInt(c.bosses, 0, 1e6)) return 'Crypt record is invalid.';
    const r = c.run;
    if (r != null) {
      if (!isObj(r) || !isInt(r.floor, 1, 9999) || !isInt(r.lamps, 0, 9) || !isNum(r.seed, 0) || !isInt(r.attempt ?? 0, 0, 999)) return 'Crypt descent is invalid.';
      if (r.mods != null && (!Array.isArray(r.mods) || !r.mods.every((m) => CRYPT_MODIFIERS.some((x) => x.id === m)))) return 'Crypt modifiers are invalid.';
      if (r.mem != null && !isObj(r.mem)) return 'Crypt descent memory is invalid.';
      if (r.log != null && (!Array.isArray(r.log) || !r.log.every((x) => isObj(x) && isNum(x.acc, 0, 1)))) return 'Crypt descent log is invalid.';
      if (r.found != null && (!isObj(r.found) || !(r.found.treasures || []).every((x) => TREASURE_IDS.has(x)) || !(r.found.tablets || []).every((x) => TABLET_IDS.has(x)))) return 'Crypt finds are invalid.';
    }
  }
  if (p.tips != null && (!isObj(p.tips) || !Array.isArray(p.tips.seen) || !p.tips.seen.every((x) => isStr(x, 60)))) return 'Tips record is invalid.';
  if (p.relics != null && (!isObj(p.relics) || (p.relics.polish != null && !datedMap(p.relics.polish)) || (p.relics.tried != null && !datedMap(p.relics.tried)))) return 'Relic record is invalid.';
  if (p.relics?.repair != null) {
    const rp = p.relics.repair;
    if (!isObj(rp) || !Object.entries(rp).every(([k, v]) => !!ITEM_BY_ID[k] && isObj(v) && ['first', 'done', 'tried'].every((f) => v[f] == null || isDate(v[f])))) return 'Relic repair record is invalid.';
  }
  if (p.trials != null) {
    if (!isObj(p.trials)) return 'Trial record is invalid.';
    for (const [k, r] of Object.entries(p.trials)) {
      if (!TRIALS[k] || !isObj(r)) return 'Trial record is invalid.';
      if (['start', 'due', 'last', 'passed', 'retryOn'].some((f) => r[f] != null && !isDate(r[f]))) return 'Trial dates are invalid.';
      if ((r.seed != null && !isInt(r.seed, 0, 1e10)) || (r.step != null && !isInt(r.step, 0, TRIALS[k].checks.length - 1)) || (r.tries != null && !isInt(r.tries, 0, 1e6)) || (r.best != null && !isInt(r.best, 0, 99))) return 'Trial record is invalid.';
      if (r.recovering != null && typeof r.recovering !== 'boolean') return 'Trial record is invalid.';
    }
  }
  if (p.brambles != null) {
    const br = p.brambles;
    if (!isObj(br) || (br.thorns != null && !isObj(br.thorns)) || (br.chests != null && !datedMap(br.chests))) return 'Bramble record is invalid.';
    const ths = Object.entries(br.thorns || {});
    if (ths.length > 80 || !ths.every(([k, t]) => isStr(k, 200) && isObj(t) && isStr(t.set, 40) && isStr(t.target, 100) && (t.cue == null || isStr(t.cue, 100)) && isStr(t.skill, 20) && !!SKILLS[t.skill] && isDate(t.born) && (t.burned == null || isDate(t.burned)) && (t.note == null || isStr(t.note, 300)) && (t.seen == null || typeof t.seen === 'boolean'))) return 'Bramble record is invalid.';
  }
  if (p.mirror != null) {
    const m = p.mirror;
    if (!isObj(m) || (m.episode != null && !isStr(m.episode, 80)) || (m.lit != null && (!datedMap(m.lit) || !Object.keys(m.lit).every((k) => !!SKILLS[k])))) return 'Mirror Room record is invalid.';
  }
  if (p.audit != null) {
    const a = p.audit;
    if (!isObj(a) || !isInt(a.done ?? 0, 0, 1e6) || (a.last != null && !isDate(a.last))) return 'Audit record is invalid.';
  }
  if (p.events != null) {
    const ev = p.events, share = (x) => isNum(x, 0, 1);
    if (!isObj(ev)) return 'Event record is invalid.';
    if (ev.pace != null && typeof ev.pace !== 'boolean') return 'Event record is invalid.';
    if (ev.best != null) {
      if (!isObj(ev.best)) return 'Event record is invalid.';
      for (const [id, b] of Object.entries(ev.best)) {
        if (!EVENT_IDS.includes(id)) return 'Event record is invalid.';
        if (b == null) continue;
        if (!isObj(b) || Object.keys(b).length > 12) return 'Event record is invalid.';
        for (const [lv, r] of Object.entries(b)) if (!isInt(+lv, 1, EVENTS[id].sizes.length) || !isObj(r) || !isInt(r.max, 1, 999) || !isInt(r.score, 0, r.max) || !isDate(r.date)) return 'Event record is invalid.';
      }
    }
    if (ev.history != null && (!Array.isArray(ev.history) || ev.history.length > HISTORY_CAP || !ev.history.every((h) => isObj(h) && isDate(h.date) && EVENT_IDS.includes(h.ev) && isInt(h.lv, 1, 9) && isInt(h.max, 1, 999) && isInt(h.score, 0, h.max)))) return 'Event history is invalid.';
    if (ev.season != null) {
      const s = ev.season;
      if (!isObj(s) || !isInt(s.tier ?? 0, 0, 5) || (s.started != null && !isDate(s.started)) || (s.won != null && !isDate(s.won)) || (s.lamps != null && !isInt(s.lamps, 0, 7))) return 'Season record is invalid.';
      if (s.snap != null && (!isObj(s.snap) || !Object.entries(s.snap).every(([k, v]) => EVENT_IDS.includes(k) && (v == null || share(v))))) return 'Season record is invalid.';
      if (s.posted != null && (!isObj(s.posted) || !Object.entries(s.posted).every(([k, v]) => EVENT_IDS.includes(k) && isObj(v) && isInt(v.max, 1, 999) && isInt(v.score, 0, v.max)))) return 'Season record is invalid.';
      if (s.marks != null && (!isObj(s.marks) || Object.keys(s.marks).length > 5 || !Object.entries(s.marks).every(([t, m]) => isInt(+t, 1, 5) && isObj(m) && Object.entries(m).every(([k, v]) => EVENT_IDS.includes(k) && Array.isArray(v) && v.length === 2 && share(v[0]) && share(v[1]))))) return 'Season record is invalid.';
    }
  }
  if (p.seam != null) {
    const s = p.seam, ph = ['fringe', 'body', 'face'];
    if (!isObj(s) || ['met', 'last', 'closed', 'epilogue'].some((f) => s[f] != null && !isDate(s[f]))) return 'Seam record is invalid.';
    if (!isInt(s.tries ?? 0, 0, 1e6) || !isInt(s.best ?? 0, 0, 9) || !isInt(s.rests ?? 0, 0, 1e6) || (s.held != null && !['held', 'told'].includes(s.held))) return 'Seam record is invalid.';
    if (s.cleared != null && (!Array.isArray(s.cleared) || s.cleared.length > 3 || !s.cleared.every((x) => ph.includes(x)))) return 'Seam record is invalid.';
    if (s.used != null && (!Array.isArray(s.used) || s.used.length > 12 || !s.used.every((x) => isStr(x, 30)))) return 'Seam record is invalid.';
  }
  if (p.wren != null) {
    const w = p.wren, beats = new Set(WF_BEATS.map((b) => b.id)), qs = new Set(WF_QUESTIONS.map((q) => q.id));
    if (!isObj(w) || (w.lastBeat != null && !isDate(w.lastBeat)) || (w.lastQ != null && !isDate(w.lastQ))) return 'Wren record is invalid.';
    if (w.seen != null && (!isObj(w.seen) || !Object.entries(w.seen).every(([k, v]) => beats.has(k) && isDate(v)))) return 'Wren record is invalid.';
    if (w.asked != null && (!isObj(w.asked) || !Object.entries(w.asked).every(([k, a]) => qs.has(k) && isObj(a) && isInt(a.n ?? 0, 0, 99) && isInt(a.ok ?? 0, 0, 99) && (a.last == null || isDate(a.last)) && (a.held == null || isDate(a.held))))) return 'Wren record is invalid.';
  }
  if (p.own != null) { const e = validateOwn(p.own); if (e) return e; }
  if (p.ledger != null) { const e = validateLedger(p.ledger); if (e) return e; }
  if (p.gloss != null) { const e = validateGloss(p.gloss); if (e) return e; }
  if (p.road != null) { const e = validateRoad(p.road); if (e) return e; }
  if (p.habits != null) {
    const h = p.habits;
    if (!isObj(h) || !Array.isArray(h.plans) || !Array.isArray(h.carry) || h.plans.length > 50 || h.carry.length > 60) return 'Carry it record is invalid.';
    if (!h.plans.every((x) => isObj(x) && isStr(x.cue, 80) && (x.tech == null || isStr(x.tech, 20)) && isDate(x.made))) return 'Carry it plans are invalid.';
    if (!h.carry.every((c) => isObj(c) && isStr(c.id, 40) && Array.isArray(c.things) && c.things.length <= 10 && c.things.every((x) => isStr(x, 120)) && isDate(c.made) && isDate(c.due) && isInt(c.idx, 0, 9) && Array.isArray(c.checks) && c.checks.every((k) => isObj(k) && isDate(k.date) && isNum(k.acc, 0, 1))))
      return 'Carry it lists are invalid.';
  }
  if (p.ladder != null) {
    if (!isObj(p.ladder) || Object.keys(p.ladder).length > 20) return 'Technique ladder is invalid.';
    if (!Object.entries(p.ladder).every(([k, v]) => isStr(k, 20) && isObj(v) && isInt(v.rung, 1, 5) && Array.isArray(v.hist) && v.hist.length <= 12 && v.hist.every((a) => isNum(a, 0, 1)))) return 'Technique ladder is invalid.';
  }
  if (p.guide != null) {
    const okMap = (m) => m == null || (datedMap(m) && Object.keys(m).length <= 200 && Object.keys(m).every((k) => isStr(k, 40)));
    if (!isObj(p.guide) || !okMap(p.guide.tried) || !okMap(p.guide.later)) return 'Field Guide record is invalid.';
  }
  if (p.keeper != null) {
    const eq = isObj(p.keeper) ? p.keeper.equip : null;
    if (!isObj(eq)) return 'Keeper gear is invalid.';
    for (const [slot, id] of Object.entries(eq)) {
      if (!SLOTS.some((x) => x.id === slot)) return 'Keeper gear is invalid.';
      if (id == null) continue;
      const ok = slot === 'charm' ? typeof id === 'string' && !!ITEM_BY_ID[id] : GEAR.some((g) => g.id === id && g.slot === slot);
      if (!ok) return 'Keeper gear is invalid.';
    }
  }
  if (p.battles != null) {
    const b = p.battles;
    if (!isObj(b) || !isInt(b.done ?? 0, 0, 1e6) || !isInt(b.held ?? 0, 0, 1e6) || !isInt(b.rests ?? 0, 0, 1e6)) return 'Battle record is invalid.';
    if ((b.last != null && !isDate(b.last)) || (b.skipped != null && !isDate(b.skipped))) return 'Battle record is invalid.';
    if (b.vigil != null && (!isObj(b.vigil) || !isInt(b.vigil.done ?? 0, 0, 1e6) || !isInt(b.vigil.ledgers ?? 0, 0, 1e6) || ['last', 'skipped', 'ledger'].some((f) => b.vigil[f] != null && !isDate(b.vigil[f])))) return 'Vigil record is invalid.';
    if (b.queue != null && (!Array.isArray(b.queue) || b.queue.length > 60 || !b.queue.every((q) => isObj(q) && isStr(q.set, 40) && isInt(q.i, 0, 999) && isDate(q.date)))) return 'Battle queue is invalid.';
    if (b.history != null && (!Array.isArray(b.history) || b.history.length > 100 || !b.history.every((h) => isObj(h) && isDate(h.date) && isStr(h.mode, 20) && isStr(h.outcome, 12) && isInt(h.items, 0, 99) && isInt(h.held, 0, 99) && isInt(h.relearned ?? 0, 0, 99) && isInt(h.queued ?? 0, 0, 99) && isInt(h.lumen ?? 0, 0, 999)))) return 'Battle history is invalid.';
  }
  if (p.stats != null && (!isObj(p.stats) || (p.stats.sessions != null && (!Array.isArray(p.stats.sessions) || p.stats.sessions.length > 2000 || !p.stats.sessions.every((x) => isObj(x) && isDate(x.date) && isNum(x.minutes, 0, 600)))))) return 'Session statistics are invalid.';
  return null;
}

// Fill optional fields from a fresh profile so older or partial backups load safely.
function withDefaults(p) {
  const base = newProfile(p.user.alias, p.user.avatar || 'lantern');
  return {
    ...base, ...p,
    meta: { ...base.meta, ...p.meta },
    user: { ...base.user, ...p.user, prefs: { ...base.user.prefs, ...(p.user.prefs || {}) } },
    progress: { ...base.progress, ...p.progress, freeXp: isObj(p.progress.freeXp) ? p.progress.freeXp : base.progress.freeXp, gateRetry: isObj(p.progress.gateRetry) ? p.progress.gateRetry : {}, fullDates: Array.isArray(p.progress.fullDates) ? p.progress.fullDates : [] },
    major: p.major || {}, achievements: isObj(p.achievements) ? p.achievements : {}, story: isObj(p.story) && Array.isArray(p.story.seen) ? p.story : { seen: [] },
    reflections: isNum(p.reflections, 0) ? p.reflections : 0, inProgress: null,
  };
}

export function parseImport(text) {
  if (typeof text !== 'string' || !text.trim()) return { ok: false, error: 'This file is empty.' };
  if (text.length > MAX_IMPORT_BYTES) return { ok: false, error: 'This file is larger than 10 MB, so it cannot be a Mnemos backup.' };
  let data;
  try { data = JSON.parse(text); } catch { return { ok: false, error: 'This file is not valid JSON.' }; }
  if (!isObj(data) || data.app !== 'mnemos' || !isObj(data.profile)) return { ok: false, error: 'This is not a Mnemos backup file.' };
  if (data.schema != null && !isNum(data.schema, 1)) return { ok: false, error: 'This backup has an invalid version number.' };
  if (data.schema > SCHEMA) return { ok: false, error: 'This backup was made by a newer version of Mnemos.' };
  const p = data.profile;
  const err = validateProfile(p);
  if (err) return { ok: false, error: `This backup cannot be used: ${err}` };
  const sum = hashStr(JSON.stringify(p)).toString(16);
  return { ok: true, profile: migrate(withDefaults(p)), warning: sum !== data.checksum ? 'The checksum does not match. The file may have been edited.' : null };
}
