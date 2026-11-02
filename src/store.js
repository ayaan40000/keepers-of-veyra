import { SCHEMA, newProfile, DEFAULT_PREFS } from './engine/core.js';
import { SKILLS, MODULES } from './data/curriculum.js';
import { TREASURES, TABLETS, CRYPT_MODIFIERS } from './data/crypt.js';
import { SIDE_QUESTS } from './data/quests.js';
import { hashStr } from './engine/util.js';
import { FURNITURE_KINDS } from './engine/room.js';


export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

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
  if (!Array.isArray(p.results) || !p.results.every((r) => isObj(r) && isDate(r.date) && isNum(r.acc, 0, 1) && typeof r.t === 'string')) return 'Results are invalid.';
  if (!Array.isArray(p.sets) || !p.sets.every((s) => isObj(s) && Array.isArray(s.items) && s.items.every(isObj) && Array.isArray(s.history) && Array.isArray(s.intervals) && isDate(s.due) && isDate(s.created) && isObj(s.spec))) return 'Review sets are invalid.';
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
  if (text.length > MAX_IMPORT_BYTES) return { ok: false, error: 'This file is larger than 5 MB, so it cannot be a Mnemos backup.' };
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
