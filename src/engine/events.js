// 1.1 The Event Hall and the Say-Back Games: pure logic. Rounds are built from a seed, scored strictly, and recorded as
// best results only. An event NEVER changes skill estimates, review sets or Lumen (like the Undercroft and trials).
// The rival is scripted story: her marks are the player's own earlier best times a falling factor, never a timer.
import { EVENTS, EVENT_IDS, SEASON_EVENTS, TIERS, FINAL, RIVAL, HISTORY_CAP, blankEvents } from '../data/events.js';
import DATES from '../data/add/dates.json';
import TRIVIA from '../data/add/trivia.json';
import NUMBERED from '../data/add/numbered.json';
import STRIKES from '../data/add/strikes.json';
import { rng, shuffle, sample, matches, normalize } from './util.js';
import { genItems, today } from './core.js';
import { POEM_LIST, rowScore, scorePoemPage, DIGIT_ROW } from './additions.js';

export { EVENT_IDS, SEASON_EVENTS };
export const PACE_SECONDS = 15; // "Contest pace": seconds an answer in the elimination events (off unless chosen)
export const STRIKE_LIMIT = 3;
export const ELIMINATION = ['words', 'strikes', 'decks'];

// ---------- access ----------
const unlocked = (p) => !!p?.progress?.reviewerUnlock;
export const hallOpen = (p) => (p?.progress?.gates || []).includes('M10') || unlocked(p);
export const seasonOpen = (p) => (p?.progress?.gates || []).includes('M12') || unlocked(p);

export function ensureEvents(p) {
  if (!p.events || typeof p.events !== 'object' || Array.isArray(p.events)) p.events = blankEvents();
  const e = p.events, b = blankEvents();
  if (!e.best || typeof e.best !== 'object') e.best = b.best;
  for (const id of EVENT_IDS) if (e.best[id] === undefined) e.best[id] = null;
  if (!Array.isArray(e.history)) e.history = [];
  if (typeof e.pace !== 'boolean') e.pace = false;
  if (!e.season || typeof e.season !== 'object') e.season = b.season;
  for (const k of ['snap', 'posted', 'marks']) if (!e.season[k] || typeof e.season[k] !== 'object') e.season[k] = {};
  return e;
}

// ---------- sizes and maxima ----------
export const sizeOf = (id, lv) => EVENTS[id].sizes[Math.max(1, Math.min(EVENTS[id].sizes.length, lv)) - 1];
export const levelsOf = (id) => EVENTS[id].sizes.length;
export function maxOf(id, lv) {
  const n = sizeOf(id, lv);
  if (id === 'names') return n * 2;
  if (id === 'numbers') return n * DIGIT_ROW;
  if (id === 'poem') return n + 2;
  if (id === 'strikes') return n * n;
  return n;
}
export function sizeLabel(id, lv) {
  const n = sizeOf(id, lv);
  if (id === 'numbers') return `${n} row${n === 1 ? '' : 's'} (${n * DIGIT_ROW} digits)`;
  if (id === 'strikes') return `${n} people, ${n} details each`;
  return `${n} ${EVENTS[id].unit}`;
}
// Seconds to study. Longer at the lower levels of the faces event, as the draft asks; the timer multiplier is applied by the screen.
export function studySeconds(id, lv) {
  const n = sizeOf(id, lv);
  switch (id) {
    case 'names': return n * [12, 10, 8, 7][lv - 1];
    case 'numbers': return n * 60;
    case 'poem': return n * 12;
    case 'words': return n * 6;
    case 'strikes': return n * n * 8;
    case 'dates': return n * 12;
    case 'facts': return n * 15;
    default: return n * 6; // cards, decks (the Cards screen sets its own)
  }
}

// ---------- strict answers ----------
// Years: every digit must be right. A year before the common era needs BC or BCE. 1066 and "AD 1066" both read as 1066.
export function yearOk(resp, year) {
  const target = String(year ?? '');
  const bce = /bc/i.test(target);
  const tdig = target.replace(/\D/g, '');
  const r = String(resp ?? '');
  const rdig = r.replace(/\D/g, '');
  if (!rdig || rdig !== tdig) return false;
  return /b\.?\s?c/i.test(r) === bce;
}
const exactNum = (s) => /^\d[\d,.\s]*$/.test(String(s));
// A fact: numbers need exact digits, words are forgiven small typos.
export function answerOk(q, resp) {
  if (!String(resp ?? '').trim()) return false;
  if (exactNum(q.answer)) return String(resp).replace(/[\s,]/g, '') === String(q.answer).replace(/[\s,]/g, '');
  return matches(resp, q.answer) || (q.alts || []).some((a) => matches(resp, a));
}
const strictName = (a, b) => !!normalize(a) && normalize(a) === normalize(b);

// ---------- building a round ----------
export function digitRows(rows, r) {
  const out = [];
  while (out.length < rows * DIGIT_ROW) {
    const d = Math.floor(r() * 10);
    const n = out.length;
    if (n >= 2 && out[n - 1] === out[n - 2] && out[n - 1] === d) continue; // no run of three
    if (n >= 2 && out[n - 1] === out[n - 2] + 1 && d === out[n - 1] + 1) continue; // no ascending run of three
    out.push(d);
  }
  return out;
}

const QUESTION = {
  birthday: (n) => `When is ${n}'s birthday? (day, then month)`,
  town: (n) => `Which town is ${n} from?`,
  pet: (n) => `What is the name of ${n}'s pet?`,
  hobby: (n) => `What is ${n}'s hobby?`,
  car: (n) => `What car does ${n} drive?`,
  food: (n) => `What is ${n}'s favourite food?`,
};
const FIELDS = { 1: ['town', 'pet', 'hobby', 'food'], 2: ['birthday', 'town', 'pet', 'hobby', 'food'], 3: ['birthday', 'town', 'pet', 'hobby', 'car', 'food'] };

// Returns a plain object: everything the study and recall screens and the scorer need. Deterministic for a seed.
export function buildRound(id, lv, seed, p) {
  const r = rng(seed), n = sizeOf(id, lv), max = maxOf(id, lv);
  const base = { id, lv, seed, n, max, kind: EVENTS[id].kind, studySeconds: studySeconds(id, lv) };
  switch (id) {
    case 'names': {
      const { items } = genItems({ t: 'faces', n, surname: true }, seed, p);
      return { ...base, items: items.map((x) => ({ face: x.face, first: x.first, last: x.last })), order: shuffle(items.map((_, i) => i), r) };
    }
    case 'numbers': return { ...base, digits: digitRows(n, r) };
    case 'poem': {
      const pool = POEM_LIST.filter((x) => x.lines.length === n);
      const poem = shuffle(pool.length ? pool : POEM_LIST, r)[0];
      return { ...base, max: poem.lines.length + 2, title: poem.title, author: poem.author, lines: poem.lines.map((line, i) => ({ answer: line, ...(poem.variants?.[`line ${i + 1}`] ? { alt: poem.variants[`line ${i + 1}`] } : {}) })) };
    }
    case 'words': {
      const list = n > 40 ? NUMBERED.find((l) => l.id === 'wl-100') : shuffle(NUMBERED.filter((l) => l.id !== 'wl-100'), r)[0];
      const words = list.words.slice(0, n);
      return { ...base, words, questions: shuffle(words.map((w, i) => ({ key: i, prompt: `Which word was number ${i + 1}?`, answer: w })), r) };
    }
    case 'strikes': {
      const sheet = shuffle(STRIKES.sheets, r)[0];
      const fields = FIELDS[Math.min(3, n - 3)] || FIELDS[1];
      const people = sample(sheet.people, n, r);
      const use = fields.slice(0, n);
      const questions = [];
      people.forEach((pp, pi) => use.forEach((f) => questions.push({ key: `${pi}-${f}`, prompt: QUESTION[f](pp.first), answer: String(pp[sheet.keys[f] || f]), person: pp.name })));
      return { ...base, max: questions.length, title: sheet.title, people: people.map((pp) => ({ name: pp.name, lines: use.map((f) => [f, String(pp[f])]) })), questions: shuffle(questions, r) };
    }
    case 'dates': {
      const seen = new Set();
      const pool = DATES.flatMap((s) => s.events).filter((e) => (seen.has(e.year) ? false : (seen.add(e.year), true)));
      const items = sample(pool, n, r);
      return { ...base, items, order: shuffle(items.map((_, i) => i), r) };
    }
    case 'facts': {
      const items = sample(TRIVIA, n, r).map((x) => ({ q: x.q, answer: x.a, alts: x.accepts }));
      return { ...base, items, order: shuffle(items.map((_, i) => i), r) };
    }
    default: return base; // cards and decks are played on the Cards screen
  }
}

// ---------- scoring ----------
// One elimination pass: questions in order, wrong or blank answers are strikes, three strikes end the round.
export function strikeRun(round, answers) {
  let score = 0, strikes = 0, asked = 0, ended = false;
  const log = [];
  for (let k = 0; k < round.questions.length; k++) {
    if (answers[k] === undefined) break;
    const q = round.questions[k];
    const ok = answerOk(q, answers[k]);
    asked++;
    if (ok) score++; else strikes++;
    log.push({ q, resp: answers[k], ok });
    if (strikes >= STRIKE_LIMIT) { ended = true; break; }
  }
  return { score, strikes, asked, ended, log, max: round.questions.length };
}

// Answers: names { idx: {first,last} } · numbers { row: '20 digits' } · poem { line: text, title, author } · dates/facts { idx: text }.
// Returns { score, max, parts } where parts says what each answer earned.
export function scoreRound(round, answers) {
  const a = answers || {};
  switch (round.id) {
    case 'names': {
      const parts = round.items.map((it, i) => [strictName(a[i]?.first, it.first), strictName(a[i]?.last, it.last)]);
      return { score: parts.reduce((s, x) => s + (x[0] ? 1 : 0) + (x[1] ? 1 : 0), 0), max: round.max, parts };
    }
    case 'numbers': {
      const rows = round.digits.length / DIGIT_ROW;
      const resp = [];
      for (let k = 0; k < rows; k++) { const s = String(a[k] ?? '').replace(/\D/g, ''); for (let j = 0; j < DIGIT_ROW; j++) resp[k * DIGIT_ROW + j] = s[j] ?? ''; }
      const per = rowScore(round.digits.map((d) => ({ answer: String(d) })), resp);
      const parts = Array.from({ length: rows }, (_, k) => !!per[k * DIGIT_ROW]);
      return { score: parts.filter(Boolean).length * DIGIT_ROW, max: round.max, parts };
    }
    case 'poem': {
      const res = scorePoemPage(round.lines, round.lines.map((_, i) => a[i]), { title: round.title, author: round.author, gotTitle: a.title ?? '', gotAuthor: a.author ?? '' });
      return { score: res.points, max: res.total, parts: res.lines };
    }
    case 'dates': {
      const parts = round.items.map((it, i) => yearOk(a[i], it.year));
      return { score: parts.filter(Boolean).length, max: round.max, parts };
    }
    case 'facts': {
      const parts = round.items.map((it, i) => answerOk(it, a[i]));
      return { score: parts.filter(Boolean).length, max: round.max, parts };
    }
    case 'words': case 'strikes': { const s = strikeRun(round, a); return { score: s.score, max: round.max, parts: s.log.map((x) => x.ok) }; }
    default: return { score: 0, max: round.max, parts: [] };
  }
}

// ---------- the record: best results only ----------
export const ratioOf = (r) => (r && r.max ? r.score / r.max : 0);
export const bestAt = (p, id, lv) => p?.events?.best?.[id]?.[lv] || null;
export const bestRatio = (p, id, lv) => { const b = bestAt(p, id, lv); return b ? ratioOf(b) : null; };
// The highest level played so far (for the summary line).
export function topBest(p, id) {
  const b = p?.events?.best?.[id];
  const lvs = b ? Object.keys(b).map(Number).sort((x, y) => y - x) : [];
  return lvs.length ? { lv: lvs[0], ...b[lvs[0]] } : null;
}

// Post a finished round. A better score at the same level replaces the best. The tier argument is the Season tier the round
// was started for; it only counts when it is the open tier and the level is that tier's scale.
export function postResult(p, id, lv, score, max, date = today(p), tier = null) {
  const e = ensureEvents(p);
  const prev = e.best[id]?.[lv] || null;
  const better = !prev || score > prev.score || (score === prev.score && max > prev.max);
  if (better) e.best[id] = { ...(e.best[id] || {}), [lv]: { score, max, date } };
  e.history.push({ date, ev: id, lv, score, max });
  if (e.history.length > HISTORY_CAP) e.history.splice(0, e.history.length - HISTORY_CAP);
  const t = tierDef(e.season.tier);
  if (tier != null && tier === e.season.tier && t && t.at[id] === lv) {
    const old = e.season.posted[id];
    if (!old || score > old.score) e.season.posted[id] = { score, max };
  }
  return { prev, newBest: better && (!prev || score > prev.score), matched: !!prev && score === prev.score, first: !prev };
}

// ---------- the Season ----------
export const tierDef = (n) => (n === 5 ? FINAL : TIERS.find((t) => t.n === n) || null);
export const factorFor = (tier, id) => (tier === 5 ? FINAL.factors[id] : (TIERS[tier - 1].stumble?.[id] ?? TIERS[tier - 1].factor));
export const levelFor = (tier, id) => tierDef(tier)?.at?.[id] || null;
export const tierEvents = (tier) => Object.keys(tierDef(tier)?.at || {});

// Best share of the maximum at each event's tier level, or null when never played at that scale.
export function takeSnap(p, tier) {
  const out = {};
  for (const id of tierEvents(tier)) out[id] = bestRatio(p, id, levelFor(tier, id));
  return out;
}
export const rivalRatio = (snap, tier, id) => {
  const base = snap?.[id] == null ? RIVAL.defaultRatio : snap[id];
  return Math.round(Math.min(RIVAL.cap, base * factorFor(tier, id)) * 1000) / 1000;
};

export function startSeason(p, date = today(p)) {
  const e = ensureEvents(p);
  if (e.season.tier) return false;
  e.season = { ...e.season, tier: 1, started: date, snap: takeSnap(p, 1), posted: {} };
  return true;
}

export const postedCount = (p) => Object.keys(p.events?.season?.posted || {}).length;
export const canClose = (p) => { const s = p.events?.season; return !!s && s.tier >= 1 && s.tier <= 4 && postedCount(p) >= tierDef(s.tier).need; };

// Marks for the events posted this tier: yours and hers as shares of the maximum.
export function tierMarks(p, tier = p.events.season.tier) {
  const s = p.events.season;
  return Object.entries(s.posted).map(([id, r]) => {
    const me = ratioOf(r), her = rivalRatio(s.snap, tier, id);
    return { id, lv: levelFor(tier, id), max: r.max, me, her, mePts: r.score, herPts: Math.round(her * r.max), win: me >= her };
  });
}
// beat / hers / close, from the average gap in shares of the maximum.
export function verdict(marks) {
  if (!marks.length) return 'close';
  const gap = marks.reduce((a, m) => a + (m.me - m.her), 0) / marks.length;
  return gap > RIVAL.close ? 'beat' : gap < -RIVAL.close ? 'hers' : 'close';
}

// Close the open tier (it must have enough posted results). Keeps the marks for the board, then opens the next tier.
export function closeTier(p, date = today(p)) {
  const e = ensureEvents(p), s = e.season;
  if (!canClose(p)) return null;
  const tier = s.tier, marks = tierMarks(p, tier);
  s.marks[tier] = Object.fromEntries(marks.map((m) => [m.id, [Math.round(m.me * 1000) / 1000, m.her]]));
  s.tier = tier + 1;
  s.posted = {};
  s.snap = takeSnap(p, s.tier);
  return { tier, marks, verdict: verdict(marks) };
}

// The Final: seven lamps. Yours is your best at the Final's scale now; hers comes from the snapshot taken when it opened.
export function finalLamps(p) {
  const s = p.events.season;
  return SEASON_EVENTS.map((id) => {
    const lv = FINAL.at[id], max = maxOf(id, lv);
    const me = bestRatio(p, id, lv) ?? 0, her = rivalRatio(s.snap, 5, id);
    return { id, lv, max, me, her, mePts: bestAt(p, id, lv)?.score ?? 0, herPts: Math.round(her * max), lit: me >= her && me > 0 };
  });
}
export const finalWon = (lamps) => lamps.filter((l) => l.lit).length >= FINAL.need;
// Light the lamps. Records the night; nothing is ever locked by a loss.
export function playFinal(p, date = today(p)) {
  const e = ensureEvents(p), s = e.season;
  if (s.tier !== 5) return null;
  const lamps = finalLamps(p), won = finalWon(lamps);
  s.lamps = lamps.filter((l) => l.lit).length;
  if (won && !s.won) s.won = date;
  return { lamps, won, count: s.lamps };
}

// Chronolog unlock test used by quests.js: 'events:N' (N tiers closed) or 'events:cup'.
export function eventLoreOpen(p, u) {
  const s = p?.events?.season;
  if (!s) return false;
  if (u === 'cup') return !!s.won;
  return Math.max(0, (s.tier || 0) - 1) >= +u;
}
