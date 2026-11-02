// v0.8 walkable palace rooms: layout, movement and the route check.
import { describe, it, expect } from 'vitest';
import { layoutPalace, step, stopAt, standAt, walkable, furnitureFor, nextStopQuestion, PER_ROOM, DOOR_OUT } from '../src/engine/room.js';
import { FURNITURE } from '../src/pixel/furniture.js';

const loci = ['Front door', 'Doormat', 'Coat hook', 'Hallway mirror', 'Light switch', 'Sofa', 'Television', 'Bookshelf', 'Kitchen table', 'Fridge', 'Stove', 'Sink'];

describe('palace rooms', () => {
  it('lays stops out in walking order, 8 per room', () => {
    const rooms = layoutPalace(loci);
    expect(rooms.length).toBe(2);
    expect(rooms.flatMap((r) => r.stops.map((s) => s.name))).toEqual(loci);
    expect(rooms[1].stops[0].n).toBe(PER_ROOM);
  });
  it('picks furniture from stop names, with a chest for anything unknown, and every kind has art', () => {
    expect(furnitureFor('Hallway mirror')).toBe('mirror');
    expect(furnitureFor('Kitchen table')).toBe('table');
    expect(furnitureFor('Grandad')).toBe('chest');
    for (const l of [...loci, 'x']) expect(FURNITURE[furnitureFor(l)]).toBeTruthy();
    for (const s of Object.values(FURNITURE)) { expect(s.px.length).toBe(16); for (const r of s.px) expect(r.length).toBe(16); }
  });
  it('walls and furniture block; standing in front of a stop names it', () => {
    const rooms = layoutPalace(loci);
    const at0 = standAt(rooms, 0);
    expect(stopAt(rooms[0], at0.x, at0.y).name).toBe('Front door');
    expect(walkable(rooms[0], 0, 4)).toBe(false);
    expect(walkable(rooms[0], 2, 1)).toBe(false);
    const up = step(rooms, at0, 0, -1);
    expect([up.x, up.y]).toEqual([at0.x, at0.y]);
  });
  it('the door on the right leads to the next room and back', () => {
    const rooms = layoutPalace(loci);
    const next = step(rooms, { room: 0, ...DOOR_OUT, face: 1 }, 1, 0);
    expect(next.room).toBe(1);
    const back = step(rooms, next, -1, 0);
    expect(back.room).toBe(0);
  });
  it('route check offers the true next stop among three', () => {
    const q = nextStopQuestion(loci, 2, 5);
    expect(q.options).toContain('Hallway mirror');
    expect(new Set(q.options).size).toBe(3);
    expect(nextStopQuestion(loci, loci.length - 1)).toBe(null);
  });
});
