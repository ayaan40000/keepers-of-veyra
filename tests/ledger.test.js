import { describe, it, expect } from 'vitest';
import { newProfile } from '../src/engine/core.js';
import { buildExport, parseImport } from '../src/store.js';
import { addBook, addCard, addStarter, sitting, recordReview, matchCard, dueList, validateLedger, parseBulk, LEDGER_INTERVALS, CAPS, STARTERS } from '../src/engine/ledger.js';
import { addDays } from '../src/engine/util.js';

const d0 = '2026-11-08';
function setup() {
  const p = newProfile('t', 'key');
  const { book } = addBook(p.ledger, { title: 'Spanish', kind: 'words', reverse: true }, d0);
  addCard(p.ledger, book.id, { front: 'casa', back: 'house; home' }, d0);
  return { p, book };
}

describe("the Keeper's Ledger", () => {
  it('matches forgivingly, with accents folded and alternatives', () => {
    expect(matchCard('Brasilia', 'Brasília')).toBe(true);
    expect(matchCard('home', 'house; home')).toBe(true);
    expect(matchCard('housse', 'house')).toBe(true);
    expect(matchCard('mouse', 'house', true)).toBe(false);
    expect(matchCard('', 'house')).toBe(false);
  });
  it('introduces a card, then walks the gaps and comes back yearly', () => {
    const { p } = setup();
    const s1 = sitting(p.ledger, d0);
    expect(s1).toHaveLength(1);
    expect(s1[0].fresh).toBe(true);
    recordReview(p, s1[0], true, { date: d0 });
    let date = addDays(d0, 1);
    expect(dueList(p.ledger, date)).toHaveLength(2); // forward and reverse
    for (let k = 1; k < LEDGER_INTERVALS.length + 2; k++) {
      for (const q of dueList(p.ledger, date)) recordReview(p, q, true, { date, typed: true });
      const c = p.ledger.books[0].cards[0];
      date = c.s.due;
    }
    const c = p.ledger.books[0].cards[0];
    expect(c.s.kept).toBe(true);
    expect(c.s.idx).toBe(LEDGER_INTERVALS.length - 1);
    expect(p.progress.lumen).toBeGreaterThan(0);
  });
  it('a miss sends the card back to tomorrow', () => {
    const { p } = setup();
    recordReview(p, sitting(p.ledger, d0)[0], true, { date: d0 });
    const date = addDays(d0, 1);
    const q = dueList(p.ledger, date)[0];
    recordReview(p, q, false, { date, typed: true });
    expect(p.ledger.books[0].cards[0].s.due).toBe(addDays(date, 1));
    expect(p.ledger.books[0].cards[0].s.idx).toBe(0);
  });
  it('keeps to the daily cap for new cards', () => {
    const p = newProfile('t', 'key');
    const { book } = addBook(p.ledger, { title: 'Many' }, d0);
    for (let i = 0; i < 30; i++) addCard(p.ledger, book.id, { front: 'f' + i, back: 'b' + i }, d0);
    expect(sitting(p.ledger, d0)).toHaveLength(10);
  });
  it('starter books load from checked pools, once each', () => {
    const p = newProfile('t', 'key');
    for (const s of STARTERS) expect(addStarter(p.ledger, s.id, d0).error).toBeUndefined();
    expect(addStarter(p.ledger, 'capitals', d0).error).toBeTruthy();
    expect(validateLedger(p.ledger)).toBeNull();
    expect(p.ledger.books.every((b) => b.cards.length > 5)).toBe(true);
  });
  it('parses pasted cards', () => {
    expect(parseBulk('casa = house\nperro\tdog\nnothing here')).toEqual([{ front: 'casa', back: 'house' }, { front: 'perro', back: 'dog' }]);
  });
  it('validation rejects damaged or oversized ledgers and accepts good ones', () => {
    const { p } = setup();
    const r = parseImport(buildExport(p)); expect(r.error).toBeFalsy(); expect(r.profile.ledger.books[0].cards[0].front).toBe('casa');
    expect(validateLedger({ books: 'x', history: [] })).toBeTruthy();
    const bad = JSON.parse(JSON.stringify(p.ledger)); bad.books[0].cards[0].front = 'x'.repeat(CAPS.side + 1);
    expect(validateLedger(bad)).toBeTruthy();
    const bad2 = JSON.parse(JSON.stringify(p.ledger)); bad2.books[0].kind = 'evil';
    expect(validateLedger(bad2)).toBeTruthy();
  });
});
