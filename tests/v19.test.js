import { describe, it, expect } from 'vitest';
import { newProfile } from '../src/engine/core.js';
import { buildSession } from '../src/engine/session.js';
import { blankLedger, addBook, addCard, recordReview, openingQueue, OPENING_MAX } from '../src/engine/ledger.js';
import { blankRoad, roadDay, weekdayOf, validateRoad } from '../src/engine/road.js';
import { parseImport, buildExport } from '../src/store.js';

const D = '2026-11-09';
function withDue(n) {
  const p = newProfile('t', 'key');
  p.ledger = blankLedger();
  const b = addBook(p.ledger, { title: 'Words' }, '2026-11-01');
  const bid = b.id || p.ledger.books[0].id;
  for (let i = 0; i < n; i++) addCard(p.ledger, bid, { front: 'f' + i, back: 'b' + i }, '2026-11-01');
  for (const c of p.ledger.books[0].cards) recordReview(p, { bookId: bid, cardId: c.id, fresh: true }, true, { date: '2026-11-01' });
  return p;
}

describe('1.9 Ledger opening', () => {
  it('takes due reviews only, capped', () => {
    const p = withDue(30);
    const q = openingQueue(p.ledger, D);
    expect(q.length).toBe(OPENING_MAX);
    expect(q.every((x) => !x.fresh)).toBe(true);
  });
  it('is empty with no books', () => { expect(openingQueue(blankLedger(), D)).toEqual([]); });
  it('the ledgerFirst preference survives a backup round trip', () => {
    const p = withDue(2); p.user.prefs.ledgerFirst = false;
    const r = parseImport(buildExport(p));
    expect(r.ok).toBe(true);
    expect(r.profile.user.prefs.ledgerFirst).toBe(false);
  });
});

describe('1.9 Road days', () => {
  it('weekday and road day', () => {
    const p = newProfile('t', 'key');
    p.progress.reviewerUnlock = true;
    p.road = { ...blankRoad(), days: [weekdayOf(D)] };
    expect(roadDay(p, D)).toBe(true);
    p.road.days = [];
    expect(roadDay(p, D)).toBe(false);
  });
  it('validation rejects bad days', () => {
    expect(validateRoad({ ...blankRoad(), days: [7] })).toBeTruthy();
    expect(validateRoad({ ...blankRoad(), days: [0, 6] })).toBeNull();
  });
  it('a Road day drops the scene and top-up rounds and flags the session', () => {
    const p = newProfile('t', 'key');
    p.progress.baselineDone = true; p.progress.day = 30; p.progress.reviewerUnlock = true;
    const s0 = buildSession(p, 'full');
    p.road = { ...blankRoad(), days: [0, 1, 2, 3, 4, 5, 6] };
    const s1 = buildSession(p, 'full');
    expect(s1.roadDay).toBe(true);
    expect(s0.roadDay).toBeUndefined();
    expect(s1.steps.some((x) => x.topup)).toBe(false);
    expect(s1.steps.length).toBeLessThanOrEqual(s0.steps.length);
  });
});
