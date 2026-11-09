import { describe, it, expect } from 'vitest';
import { newProfile } from '../src/engine/core.js';
import { buildExport, parseImport } from '../src/store.js';
import { scoreRows, scoreColumns, scoreDates, scoreImages, scoreSpoken, makeMaterial, recordEvent, ensureRoad, validateRoad, weakest, journeyStats, ottolineMark, recordSunday, DISCIPLINES, blob } from '../src/engine/road.js';

const d0 = '2026-11-08';
describe("the Wardens' Road: strict scoring", () => {
  const t = '1234567890'.repeat(8); // 80 digits, rows of 40
  it('rows: clean row full, one slip half, two slips nothing, last row counts what was written', () => {
    expect(scoreRows(t, [t.slice(0, 40), t.slice(40, 60)], 40).score).toBe(60);
    const one = '9' + t.slice(1, 40);
    expect(scoreRows(t, [one], 40).score).toBe(20);
    expect(scoreRows(t, ['99' + t.slice(2, 40)], 40).score).toBe(0);
    expect(scoreRows(t, ['', ''], 40).score).toBe(0);
    expect(scoreRows(t, [one], 40).misses).toEqual([0]);
  });
  it('columns of words need exact spelling; trailing blanks in the last column are free', () => {
    const w = Array.from({ length: 25 }, (_, i) => 'w' + i);
    expect(scoreColumns(w, [w.slice(0, 20).join('\n'), w.slice(20, 23).join('\n')]).score).toBe(23);
    const bad = [...w.slice(0, 19), 'oops'];
    expect(scoreColumns(w, [bad.join('\n')]).score).toBe(10);
  });
  it('dates, images and spoken', () => {
    expect(scoreDates([{ year: '1200' }, { year: '1500' }, { year: '1999' }], ['1200', '1501', '']).score).toBe(1);
    expect(scoreImages([[1, 2, 3, 4, 5], [5, 4, 3, 2, 1]], [['1', '2', '3', '4', '5'], ['5', '4', '3', '1', '2']]).score).toBe(4);
    expect(scoreSpoken('31415', '3149').score).toBe(3);
  });
});

describe("the Wardens' Road: records", () => {
  it('material is deterministic and sized by time', () => {
    expect(makeMaterial('numbers', 60, 5).digits).toBe(makeMaterial('numbers', 60, 5).digits);
    expect(makeMaterial('numbers', 300, 5).digits.length).toBe(800);
    expect(makeMaterial('binary', 60, 1).digits.length % 30).toBe(0);
    expect(new Set(makeMaterial('fdates', 300, 1).dates.map((d) => d.text)).size).toBe(100);
    expect(blob(() => 0.3).split('/')).toHaveLength(8);
  });
  it('personal bests, Ottoline, slips, Long Sunday title, and a clean save', () => {
    const p = newProfile('t', 'key');
    ensureRoad(p);
    expect(recordEvent(p, 'numbers', 60, 40, { date: d0, misses: [3], truth: '1234' }).pb).toBe(true);
    expect(ottolineMark(40)).toBe(42);
    expect(recordEvent(p, 'numbers', 60, 42, { date: d0 }).beatOttoline).toBe(true);
    expect(weakest(p, d0)[0].key).toBe('n:34');
    for (const e of ['words', 'binary', 'fdates', 'images']) recordEvent(p, e, 60, 5, { date: d0 });
    for (let i = 0; i < 4; i++) recordSunday(p, { numbers: 1, words: 1, binary: 1, fdates: 1 }, d0);
    expect(p.road.title).toBe(d0);
    expect(validateRoad(p.road)).toBeNull();
    const r = parseImport(buildExport(p)); expect(r.error).toBeFalsy();
    expect(validateRoad({ ...p.road, pb: { 'x:y': 1 } })).toBeTruthy();
    expect(journeyStats({ palaces: [{ id: 'a', name: 'Home', loci: ['door', 'sofa'], lastUsed: new Date().toISOString() }, { id: 'b', name: 'Work', loci: ['Door'] }] }).dupes).toEqual(['door']);
    expect(new Set(DISCIPLINES.map((d) => d.id)).size).toBe(DISCIPLINES.length);
  });
});
