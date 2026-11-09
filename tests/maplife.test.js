import { describe, it, expect } from 'vitest';
import { along } from '../src/ui/pixel/mapLife.js';
import { ROUTE, DISTRICT_IDS } from '../src/ui/pixel/world.js';

describe('painted map life', () => {
  it('walks a street from its start to its end', () => {
    const path = [[0, 0], [10, 0], [10, 10]];
    expect(along(path, 0).slice(0, 2)).toEqual([0, 0]);
    expect(along(path, 0.5).slice(0, 2)).toEqual([10, 0]);
    expect(along(path, 1).slice(0, 2)).toEqual([10, 10]);
    expect(along(path, 2).slice(0, 2)).toEqual([10, 10]);
  });
  it('has one street per district for the townsfolk', () => {
    expect(ROUTE.length).toBe(DISTRICT_IDS.length);
  });
});
