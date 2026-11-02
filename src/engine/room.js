// Walkable palace rooms (v0.8). Pure layout and movement rules; drawing lives in ui/PalaceRoom.jsx.
// A palace's stops are laid out in rooms of up to 8, clockwise around the walls, in walking order.

export const ROOM_W = 11, ROOM_H = 8, TILE = 16;
export const PER_ROOM = 8;

// Stop slots around the room (tile x, y) and the floor tile in front of each, where the Keeper stands.
const SLOTS = [
  { x: 2, y: 1, sx: 2, sy: 2 }, { x: 5, y: 1, sx: 5, sy: 2 }, { x: 8, y: 1, sx: 8, sy: 2 },
  { x: 9, y: 3, sx: 8, sy: 3 }, { x: 9, y: 5, sx: 8, sy: 5 },
  { x: 7, y: 6, sx: 7, sy: 5 }, { x: 4, y: 6, sx: 4, sy: 5 }, { x: 1, y: 4, sx: 2, sy: 4 },
];
export const DOOR_IN = { x: 1, y: 6 }, DOOR_OUT = { x: 9, y: 6 }; // floor tiles that lead to the previous / next room

// Furniture for a stop, guessed from its name. Anything unknown becomes a small chest.
const KINDS = [
  ['door', /door|gate|entrance|porch/], ['sofa', /sofa|couch|settee/], ['bed', /bed|pillow|duvet/], ['table', /table|counter|island/],
  ['chair', /chair|stool|seat|armchair/], ['lamp', /lamp|light|switch/], ['mirror', /mirror/], ['window', /window|curtain|blind/],
  ['shelf', /shelf|book|cabinet|cupboard|wardrobe|closet|drawer|dresser/], ['plant', /plant|flower|garden|tree|vase/],
  ['fridge', /fridge|freezer/], ['stove', /stove|oven|cooker|hob|kettle|microwave/], ['sink', /sink|tap|basin|dishwasher/],
  ['desk', /desk|computer|laptop|office/], ['tv', /tv|television|screen|radio|speaker/], ['rug', /rug|mat|carpet|floor/],
  ['bath', /bath|shower|toilet/], ['clock', /clock|calendar|picture|painting|photo|frame/], ['stairs', /stair|step|landing|hall/],
];
export function furnitureFor(name) {
  const n = String(name || '').toLowerCase();
  for (const [k, re] of KINDS) if (re.test(n)) return k;
  return 'chest';
}

export function layoutPalace(loci = []) {
  const rooms = [];
  for (let i = 0; i < loci.length; i += PER_ROOM) {
    rooms.push({
      index: rooms.length,
      stops: loci.slice(i, i + PER_ROOM).map((name, k) => ({ n: i + k, name, kind: furnitureFor(name), ...SLOTS[k] })),
    });
  }
  return rooms;
}

// Can the Keeper stand on this tile? Walls and furniture block; door tiles are open.
export function walkable(room, x, y) {
  if (x < 1 || y < 2 || x > ROOM_W - 2 || y > ROOM_H - 2) return false;
  return !room.stops.some((s) => s.x === x && s.y === y);
}

// The stop the Keeper is standing in front of, if any.
export function stopAt(room, x, y) {
  return room.stops.find((s) => s.sx === x && s.sy === y) || null;
}

// One step. Returns the new position; leaving through a door changes room.
export function step(rooms, pos, dx, dy) {
  const room = rooms[pos.room];
  if (!room) return pos;
  const nx = pos.x + dx, ny = pos.y + dy;
  if (pos.room < rooms.length - 1 && pos.x === DOOR_OUT.x && pos.y === DOOR_OUT.y && (dx > 0 || dy > 0)) return { room: pos.room + 1, x: DOOR_IN.x, y: DOOR_IN.y, face: dx > 0 ? 1 : pos.face };
  if (pos.room > 0 && pos.x === DOOR_IN.x && pos.y === DOOR_IN.y && (dx < 0 || dy > 0)) return { room: pos.room - 1, x: DOOR_OUT.x, y: DOOR_OUT.y, face: dx < 0 ? -1 : pos.face };
  if (!walkable(room, nx, ny)) return { ...pos, face: dx || pos.face };
  return { room: pos.room, x: nx, y: ny, face: dx || pos.face };
}

// Jump straight to stop n (for the Next / Previous stop buttons and screen readers).
export function standAt(rooms, n) {
  const r = Math.floor(n / PER_ROOM), room = rooms[r];
  const s = room?.stops[n % PER_ROOM];
  return s ? { room: r, x: s.sx, y: s.sy, face: s.sx >= s.x ? -1 : 1 } : { room: 0, x: 5, y: 4, face: 1 };
}

// Route check: three choices for "which stop comes after this one?", one of them right. Deterministic per palace and stop.
export function nextStopQuestion(loci, n, seed = 1) {
  if (n >= loci.length - 1) return null;
  const answer = loci[n + 1];
  const others = loci.filter((_, i) => i !== n && i !== n + 1);
  let h = (seed * 31 + n * 977) >>> 0;
  const pick = [];
  while (pick.length < Math.min(2, others.length)) { h = (Math.imul(h, 1103515245) + 12345) >>> 0; const o = others[h % others.length]; if (!pick.includes(o)) pick.push(o); }
  const opts = [answer, ...pick];
  const rot = h % opts.length;
  return { answer, options: [...opts.slice(rot), ...opts.slice(0, rot)] };
}
