// 1.3 The Keeper's Ledger. The player's own cue-and-answer cards in named books, asked again for years:
// 1, 3, 7, 14, 30, 60, 120, 240 days, then once a year forever. Pure logic only; the cards never leave the browser.
// Rewards: a held TYPED review after a gap of 7 days or more earns a little Lumen inside the shared daily
// free-practice cap, once per step per card. Ledger results never change skill estimates.
import { addDays, daysBetween, uid } from './util.js';
import POOLS from '../data/add/pools.json';
import DATES from '../data/add/dates.json';
import { FORMULAS } from '../data/abstract.js';
import { FINANCE, MARKS } from '../data/finance.js';
import { VERBS, PERSONS, TENSE } from '../data/verbs.js';

export const LEDGER_INTERVALS = [1, 3, 7, 14, 30, 60, 120, 240, 365];
export const CAPS = { books: 50, cards: 5000, side: 400, note: 200, title: 80, history: 300, cardHistory: 8, record: 3000000 };
export const DAILY = { newCards: 10, reviews: 40 };
export const LEDGER_LUMEN = { 7: 3, 30: 5 };
export const KEPT_DAYS = 30;            // a card is "kept" at its first held review after a gap of 30 days or more
export const FREE_CAP = 50;              // the shared daily free-practice cap (FREE_XP_CAP in progress.js)

// Book kinds only change labels and the default way of answering. Ids are permanent (saved data).
export const KINDS = {
  cards: { label: 'Cards', front: 'Question or cue', back: 'Answer', hint: 'Anything you want to keep: a fact, a word, a formula, a name.' },
  words: { label: 'Words', front: 'Word', back: 'Meaning', hint: 'A word and its meaning. Turn on "both ways" to be asked the word from the meaning too.' },
  timeline: { label: 'Timeline', front: 'Event', back: 'Year', hint: 'Events and their years. Both ways asks the event from the year as well.' },
  jokes: { label: 'Joke Box', front: 'Topic (the room)', back: 'Key word (the punchline)', hint: 'Keep the key word and the joke comes back. After each card, tell the joke aloud.' },
  satchel: { label: "Travellers' Satchel", front: 'Book and chapter', back: 'The idea you kept', hint: 'One idea per card from a book you read. Long answers are said aloud and marked by you.' },
  project: { label: 'Project', front: 'Cue', back: 'What to recall', hint: 'Material for one of your own projects: a talk, an exam, a recipe, a role.' },
};

export const blankLedger = () => ({ v: 1, books: [], history: [], daily: { date: null, newCards: 0, reviews: 0 } });

// ---------- matching (Unicode-aware, forgiving: accents folded, one slip allowed in longer answers) ----------
export function fold(s) {
  return String(s ?? '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/ı/g, 'i').replace(/ß/g, 'ss').replace(/[^\p{L}\p{N}%.+\-*/=^<>]+/gu, ' ').replace(/\s+/g, ' ').trim();
}
function lev(a, b) {
  if (Math.abs(a.length - b.length) > 1) return 2;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
// The answer side may list alternatives separated by ";" (for example "Brasilia; Brasília").
export const answersOf = (back) => String(back).split(';').map((x) => x.trim()).filter(Boolean);
export function matchCard(answer, back, strict = false) {
  const a = fold(answer);
  if (!a) return false;
  return answersOf(back).some((t) => { const f = fold(t); return a === f || (!strict && f.length >= 5 && lev(a, f) <= 1); });
}
// Long answers are said aloud and self-marked (they cannot be checked fairly by typing).
export const selfMarked = (book, card, dir = 'f') => book.kind === 'satchel' || book.self === true || (dir === 'f' ? card.back : card.front).length > 60;

// ---------- schedule ----------
const blankSched = () => ({ idx: 0, due: null, last: null, history: [], paid: [], kept: false, misses: 0 });
export function gapAt(idx) { return LEDGER_INTERVALS[Math.min(idx, LEDGER_INTERVALS.length - 1)]; }

// Directions a card is asked in: forward always, reverse when the book asks both ways.
export const dirsOf = (book) => (book.reverse ? ['f', 'r'] : ['f']);
const schedKey = (dir) => (dir === 'r' ? 'rs' : 's');

export function resetDaily(l, date) { if (!l.daily || l.daily.date !== date) l.daily = { date, newCards: 0, reviews: 0 }; return l.daily; }

// Every due review, oldest first, across all books. A card never retires: after 240 days it comes back yearly.
export function dueList(l, date) {
  const out = [];
  for (const b of l.books) for (const c of b.cards) for (const d of dirsOf(b)) {
    const s = c[schedKey(d)];
    if (s && s.due && s.due <= date) out.push({ bookId: b.id, cardId: c.id, dir: d, due: s.due });
  }
  return out.sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0));
}
// Cards never introduced yet, in the order they were written.
export function newList(l) {
  const out = [];
  for (const b of l.books) for (const c of b.cards) if (!c.s) out.push({ bookId: b.id, cardId: c.id, dir: 'f', fresh: true });
  return out;
}
// One sitting: due reviews first, then a few new cards, both inside the daily caps.
export function sitting(l, date, { reviews = DAILY.reviews, newCards = DAILY.newCards, max = 25 } = {}) {
  const day = l.daily && l.daily.date === date ? l.daily : { reviews: 0, newCards: 0 };
  const due = dueList(l, date).slice(0, Math.max(0, reviews - day.reviews));
  const fresh = newList(l).slice(0, Math.max(0, newCards - day.newCards));
  return [...due, ...fresh].slice(0, max);
}
export const dueCount = (l, date) => (l ? dueList(l, date).length : 0);

// Record one answer. Mutates the profile. Returns {held, lumen, kept, due, gap}.
export function recordReview(p, { bookId, cardId, dir = 'f', fresh = false }, held, { date, typed = false } = {}) {
  const l = p.ledger, book = l.books.find((b) => b.id === bookId), card = book?.cards.find((c) => c.id === cardId);
  if (!card) return null;
  const day = resetDaily(l, date);
  const key = schedKey(dir);
  let lumen = 0, keptNow = false;
  if (fresh || !card[key]) {
    // First meeting: the card was shown, then asked once. Either way it is due tomorrow.
    card[key] = { ...blankSched(), due: addDays(date, 1), last: date };
    if (key === 's' && book.reverse && !card.rs) card.rs = { ...blankSched(), due: addDays(date, 1), last: date };
    day.newCards++;
  } else {
    const s = card[key];
    const gap = s.last ? daysBetween(s.last, date) : 0;
    s.history = [...s.history, { date, held: !!held, gap }].slice(-CAPS.cardHistory);
    if (held) {
      if (typed && gap >= 7 && !s.paid.includes(s.idx)) {
        s.paid = [...s.paid, s.idx].slice(-LEDGER_INTERVALS.length);
        const want = gap >= 30 ? LEDGER_LUMEN[30] : LEDGER_LUMEN[7];
        const fx = p.progress.freeXp && p.progress.freeXp.date === date && Number.isFinite(p.progress.freeXp.xp) ? p.progress.freeXp : { date, xp: 0 };
        lumen = Math.max(0, Math.min(want, FREE_CAP - fx.xp));
        p.progress.freeXp = { date, xp: fx.xp + lumen };
        p.progress.lumen += lumen;
      }
      if (!s.kept && gap >= KEPT_DAYS) { s.kept = true; keptNow = true; }
      s.idx = Math.min(LEDGER_INTERVALS.length - 1, s.idx + 1);
      s.due = addDays(date, gapAt(s.idx));
    } else {
      // A slipped card drifts back to the start, gently: it is asked again tomorrow.
      s.misses = Math.min(999, s.misses + 1);
      s.idx = 0;
      s.due = addDays(date, 1);
    }
    s.last = date;
    day.reviews++;
  }
  l.history = [...l.history, { date, book: bookId, held: !!held }].slice(-CAPS.history);
  return { held: !!held, lumen, kept: keptNow, due: card[key].due, gap: card[key].history.at(-1)?.gap ?? 0 };
}

// ---------- books and cards ----------
const clip = (s, n) => String(s ?? '').normalize('NFC').replace(/[\u0000-\u001F\u007F‪-‮⁦-⁩]/g, ' ').trim().slice(0, n);
export function newBook({ title, kind = 'cards', reverse = false, palace = null, self = false, starter = null }, date) {
  return { id: 'b' + uid(), title: clip(title, CAPS.title) || 'Untitled book', kind: KINDS[kind] ? kind : 'cards', reverse: !!reverse, palace: palace || null, self: !!self, starter, created: date, cards: [] };
}
export function newCard({ front, back, note = '' }, date) {
  return { id: 'c' + uid(), front: clip(front, CAPS.side), back: clip(back, CAPS.side), note: clip(note, CAPS.note), created: date, s: null };
}
export const cardCount = (l) => l.books.reduce((n, b) => n + b.cards.length, 0);
export function addCard(l, bookId, fields, date) {
  const b = l.books.find((x) => x.id === bookId);
  if (!b) return 'No such book.';
  if (cardCount(l) >= CAPS.cards) return `The Ledger holds ${CAPS.cards} cards. Retire a book to make room.`;
  const c = newCard(fields, date);
  if (!c.front || !c.back) return 'A card needs a front and a back.';
  b.cards.push(c);
  return null;
}
export function addBook(l, fields, date) {
  if (l.books.length >= CAPS.books) return { error: `The Ledger holds ${CAPS.books} books.` };
  const b = newBook(fields, date);
  l.books.push(b);
  return { book: b };
}
// Paste many cards at once: one per line, front and back split by a tab, " = " or " - ".
export function parseBulk(text) {
  return String(text ?? '').split(/\r?\n/).map((ln) => ln.trim()).filter(Boolean).map((ln) => {
    const m = ln.split(/\t| = | - | – /);
    return m.length >= 2 ? { front: m[0], back: m.slice(1).join(' - ') } : null;
  }).filter(Boolean);
}

export function bookStats(b, date) {
  let due = 0, kept = 0, learned = 0;
  for (const c of b.cards) {
    if (c.s) learned++;
    if (c.s?.kept) kept++;
    for (const d of dirsOf(b)) { const s = c[schedKey(d)]; if (s && s.due && s.due <= date) due++; }
  }
  return { total: b.cards.length, learned, kept, due, glow: b.cards.length ? kept / b.cards.length : 0 };
}

// ---------- starter books (from the game's own checked pools) ----------
export const STARTERS = [
  { id: 'capitals', title: 'Capitals of the world', kind: 'words', reverse: true, front: 'Country', back: 'Capital',
    cards: () => POOLS.atlas.items.map(([c, cap, alt]) => ({ front: c, back: [cap, ...(alt || [])].join('; ') })) },
  { id: 'elements', title: 'Elements and symbols', kind: 'words', reverse: true,
    cards: () => POOLS.elements.items.map(([n, name, sym]) => ({ front: name, back: sym, note: 'Atomic number ' + n })) },
  { id: 'roots', title: 'Words of the Archive: word roots', kind: 'words', reverse: false,
    cards: () => POOLS.roots.items.map(([r, m]) => ({ front: r, back: m.split(',').map((x) => x.trim()).join('; ') })) },
  { id: 'dates', title: 'Hall of Years: real dates', kind: 'timeline', reverse: true,
    cards: () => DATES.flatMap((s) => s.events.map((e) => ({ front: e.text, back: e.year }))) },
  { id: 'formulae', title: 'Formulae', kind: 'cards', self: true,
    cards: () => FORMULAS.map((f) => ({ front: f.name, back: f.show.join(' '), note: f.legend || '' })) },
  { id: 'finance', title: 'Ledger of Debts: finance formulae', kind: 'cards', self: true,
    cards: () => FINANCE.map((f) => ({ front: f.name, back: f.show.join(' '), note: f.legend })) },
  { id: 'verbs-es', title: 'Turning stones: Spanish verbs', kind: 'words',
    cards: () => VERBS.es.flatMap(([v, m, f]) => f.map((x, k) => ({ front: `${v}, ${PERSONS.es[k]} (${TENSE.es})`, back: x, note: m }))) },
  { id: 'verbs-tr', title: 'Turning stones: Turkish verbs', kind: 'words',
    cards: () => VERBS.tr.flatMap(([v, m, f]) => f.map((x, k) => ({ front: `${v}, ${PERSONS.tr[k]} (${TENSE.tr})`, back: x, note: m }))) },
  { id: 'marks', title: "The Merchants' Marks", kind: 'words', self: true,
    cards: () => MARKS.map(([m, img]) => ({ front: m, back: img })) },
];
export function addStarter(l, id, date) {
  const st = STARTERS.find((s) => s.id === id);
  if (!st) return { error: 'No such starter book.' };
  if (l.books.some((b) => b.starter === id)) return { error: 'You already have this book.' };
  const items = st.cards();
  if (cardCount(l) + items.length > CAPS.cards) return { error: 'Not enough room in the Ledger.' };
  const r = addBook(l, { title: st.title, kind: st.kind, reverse: st.reverse, self: st.self, starter: id }, date);
  if (r.error) return r;
  for (const it of items) r.book.cards.push(newCard(it, date));
  return r;
}

// ---------- validation (import safety) ----------
const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
const isStr = (x, max, min = 0) => typeof x === 'string' && x.length <= max && x.length >= min;
const isDate = (x) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);
const isInt = (x, lo, hi) => Number.isInteger(x) && x >= lo && x <= hi;
const BAD = 'The Keeper\'s Ledger in this file is damaged.';
function okSched(s) {
  if (s == null) return true;
  return isObj(s) && isInt(s.idx, 0, LEDGER_INTERVALS.length - 1) && (s.due == null || isDate(s.due)) && (s.last == null || isDate(s.last))
    && Array.isArray(s.history) && s.history.length <= CAPS.cardHistory && s.history.every((h) => isObj(h) && isDate(h.date) && typeof h.held === 'boolean')
    && Array.isArray(s.paid) && s.paid.every((x) => isInt(x, 0, 20)) && typeof s.kept === 'boolean';
}
export function validateLedger(l) {
  if (!isObj(l) || !Array.isArray(l.books) || !Array.isArray(l.history)) return BAD;
  if (l.books.length > CAPS.books || l.history.length > CAPS.history) return BAD;
  let n = 0;
  const ids = new Set();
  for (const b of l.books) {
    if (!isObj(b) || !isStr(b.id, 40, 1) || ids.has(b.id) || !isStr(b.title, CAPS.title) || !KINDS[b.kind] || !Array.isArray(b.cards)) return BAD;
    ids.add(b.id);
    for (const c of b.cards) {
      if (!isObj(c) || !isStr(c.id, 40, 1) || !isStr(c.front, CAPS.side) || !isStr(c.back, CAPS.side) || !isStr(c.note ?? '', CAPS.note) || !okSched(c.s) || !okSched(c.rs)) return BAD;
      n++;
    }
  }
  if (n > CAPS.cards) return BAD;
  if (!l.history.every((h) => isObj(h) && isDate(h.date) && typeof h.held === 'boolean')) return BAD;
  if (JSON.stringify(l).length > CAPS.record) return BAD;
  return null;
}
