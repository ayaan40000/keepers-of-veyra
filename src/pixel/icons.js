// Item icons for the collection: one original 24x24 string sprite per item id, drawn in code.
// Conventions: light from the top-left, 4-tone ramps (0 = lightest), 1px dark outline added last.
// Self-contained on purpose: pixel/core.js contains JSX in a .js file, which plain JS modules and tests cannot import.
import { TRACED_ICONS } from './traced.js';
import { TRIAL_ICONS } from './trial-icons.js';

// Seeded RNG (same algorithm as pixel/core.js prng) for deterministic texture.
function prng(seed) {
  let a = (typeof seed === 'number' ? seed : [...String(seed)].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261)) >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ---------- shared palette ----------
const RAMPS = {
  gold: ['#fff2c0', '#f0c75e', '#c48a2c', '#7a4a18'],
  brass: ['#f6dc96', '#d9a441', '#a06a24', '#5e3b16'],
  silver: ['#f4f7fc', '#b8c2d6', '#8090ad', '#4d5670'],
  iron: ['#9aa3b8', '#646d86', '#40485e', '#262c3c'],
  wood: ['#d8a066', '#a8683a', '#74442a', '#45281a'],
  leather: ['#c98458', '#9a5636', '#6a3522', '#3e1e16'],
  parch: ['#fbf4e2', '#efe6d2', '#d8c9a6', '#a8946a'],
  cloth: ['#c9ccd4', '#9a9eaa', '#6d717e', '#45485a'],
  red: ['#f28a74', '#cc4a3e', '#8f2c2c', '#561a20'],
  green: ['#c0dc80', '#79a84a', '#4f6d3a', '#2c4224'],
  teal: ['#bfe6da', '#7fb3a6', '#3f6f66', '#23423d'],
  blue: ['#a8cbe8', '#6690bc', '#3a5a78', '#22364c'],
  violet: ['#d0b0ec', '#9a74c4', '#6b4a8a', '#3e2852'],
  bone: ['#fffaf0', '#e8dcc0', '#bfae8c', '#857358'],
  flame: ['#fffbe0', '#ffd98a', '#e8a040', '#c4602a'],
  ink: ['#7a6656', '#4e3c34', '#33262a', '#1e1618'],
  black: ['#5a5470', '#38334a', '#241f32', '#15111e'],
  rose: ['#f6bccb', '#da7a94', '#a84a68', '#6a2a44'],
  stone: ['#f0ece2', '#cac4b6', '#9a9486', '#625d54'],
  grey: ['#dfe1e8', '#a7acb8', '#727888', '#454a58'],
  clay: ['#e0a07a', '#b86a48', '#844430', '#4e2620'],
  navy: ['#5a6a9a', '#34416e', '#222a4c', '#141a32'],
  amber: ['#ffe2a0', '#eba84c', '#b86a24', '#6e3a14'],
  pearl: ['#ffffff', '#e6e2ee', '#b4b0c4', '#7a7690'],
};
const EXTRA = {
  out: '#1a1320', white: '#ffffff', glow: '#ffd98a55', glow2: '#ffd98a26', redglow: '#ff6a5040', mist: '#c4c8d460', chalk: '#e8eef0', smudge: '#8a9498',
};
// Every colour by name ('gold0'..'gold3', 'out', ...). Each icon gets its own compact palette of single-char keys.
export const COLORS = { ...EXTRA };
for (const [r, tones] of Object.entries(RAMPS)) tones.forEach((hex, i) => { COLORS[r + i] = hex; });
const POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnpqrstuvwxyz0123456789#$%&*+=?@^~<>!:;,-_/|[]{}()';

// ---------- tiny drawing kit ----------
const lit = (dx, dy, b = 0) => { const nz = Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy)); return -0.5 * dx - 0.6 * dy + 0.6 * nz + b; };
const tone = (ramp, v) => `${ramp}${v > 0.85 ? 0 : v > 0.35 ? 1 : v > -0.15 ? 2 : 3}`;

function cv(W = 24, H = 24) {
  const g = Array.from({ length: H }, () => Array(W).fill('.'));
  const k = (col) => { if (col == null) return '.'; if (!COLORS[col]) throw new Error(`icon colour ${col}`); return col; };
  const c = {
    g,
    p(x, y, col) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H || col === undefined) return; g[y][x] = k(col); },
    has: (x, y) => x >= 0 && y >= 0 && x < W && y < H && g[y][x] !== '.',
    is: (x, y, col) => x >= 0 && y >= 0 && x < W && y < H && g[y][x] === col,
    pts(list, col) { for (const [x, y] of list) c.p(x, y, col); },
    rect(x, y, w, h, col) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) c.p(x + i, y + j, typeof col === 'function' ? col(x + i, y + j, i, j) : col); },
    line(x0, y0, x1, y1, col) {
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
      for (;;) { c.p(x0, y0, typeof col === 'function' ? col(x0, y0) : col); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
    },
    ell(cx, cy, rx, ry, col) {
      for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) c.p(x, y, typeof col === 'function' ? col(x, y, dx, dy) : col);
      }
    },
    ball(cx, cy, rx, ry, ramp, b = 0) { c.ell(cx, cy, rx, ry, (x, y, dx, dy) => tone(ramp, lit(dx, dy, b))); },
    ring(cx, cy, ro, ri, ramp, b = 0) {
      c.ell(cx, cy, ro, ro, (x, y, dx, dy) => { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); return d < ri ? undefined : tone(ramp, lit(dx * 0.9, dy * 0.9, b)); });
    },
    box(x, y, w, h, ramp, o = {}) {
      const t = { top: 0, left: 0, mid: 1, right: 2, bottom: 2, corner: 3, ...o };
      c.rect(x, y, w, h, (px, py, i, j) => `${ramp}${i === w - 1 && j === h - 1 ? t.corner : j === 0 ? t.top : i === 0 ? t.left : i === w - 1 ? t.right : j === h - 1 ? t.bottom : t.mid}`);
    },
    cyl(x, y, w, h, ramp) { // vertical cylinder shading
      c.rect(x, y, w, h, (px, py, i) => { const f = w === 1 ? 0.3 : i / (w - 1); return `${ramp}${f < 0.12 ? 1 : f < 0.4 ? 0 : f < 0.72 ? 1 : f < 0.9 ? 2 : 3}`; });
    },
    poly(pts, col) {
      const ys = pts.map((p) => p[1]); const y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
      for (let y = y0; y <= y1; y++) {
        const sy = y + 0.5, xs = [];
        for (let i = 0; i < pts.length; i++) {
          const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
          if ((ay <= sy && by > sy) || (by <= sy && ay > sy)) xs.push(ax + ((sy - ay) / (by - ay)) * (bx - ax));
        }
        xs.sort((a, b) => a - b);
        for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.ceil(xs[i] - 0.5); x <= Math.floor(xs[i + 1] - 0.5); x++) c.p(x, y, typeof col === 'function' ? col(x, y) : col);
      }
    },
    stamp(x, y, rows, map) { rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const ch = r[i]; if (ch !== '.' && ch !== ' ' && map[ch] !== undefined) c.p(x + i, y + j, map[ch]); } }); },
    clear(x, y) { if (x >= 0 && y >= 0 && x < W && y < H) g[y][x] = '.'; },
    outline(col = 'out') {
      const o = g.map((r) => r.slice()); const op = (x, y) => x >= 0 && y >= 0 && x < W && y < H && o[y][x] !== '.';
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!op(x, y) && (op(x - 1, y) || op(x + 1, y) || op(x, y - 1) || op(x, y + 1))) g[y][x] = k(col);
    },
    halo(cx, cy, r1, r2) { // dithered glow on empty pixels only (call after outline)
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g[y][x] === '.') {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (d < r1 && (x + y) % 2 === 0) g[y][x] = k('glow');
        else if (d < r2 && x % 2 === 0 && y % 2 === 0) g[y][x] = k('glow2');
      }
    },
    done() {
      const keyOf = { out: 'o' }; const pal = {}; let n = 0;
      const px = g.map((r) => r.map((col) => {
        if (col === '.') return '.';
        if (!keyOf[col]) keyOf[col] = POOL[n++];
        pal[keyOf[col]] = COLORS[col];
        return keyOf[col];
      }).join(''));
      return { w: W, h: H, pal, px };
    },
  };
  return c;
}

// Map a stamp of digit tones '1'..'4' to a ramp (and optional extra letters).
const rampMap = (ramp, extra = {}) => ({ 1: `${ramp}0`, 2: `${ramp}1`, 3: `${ramp}2`, 4: `${ramp}3`, ...extra });

// ---------- artifacts ----------
const D = {};

D.brass_lantern = () => {
  const c = cv();
  // handle ring
  c.pts([[10, 1], [11, 1], [12, 1], [13, 1]], 'brass1'); c.pts([[9, 2], [9, 3]], 'brass0'); c.pts([[14, 2], [14, 3]], 'brass2');
  // cap
  c.rect(10, 4, 4, 1, 'brass1'); c.p(10, 4, 'brass0');
  c.rect(8, 5, 8, 1, (x) => (x < 10 ? 'brass0' : x > 13 ? 'brass2' : 'brass1'));
  c.rect(7, 6, 10, 1, (x) => (x < 9 ? 'brass1' : x > 14 ? 'brass3' : 'brass2'));
  c.p(12, 5, 'brass3'); // the dent
  // glass body with warm glow
  c.rect(8, 7, 8, 10, (x, y) => { const d = Math.hypot(x + 0.5 - 11.5, (y + 0.5 - 12.5) * 0.8); return d < 1.6 ? 'flame0' : d < 3 ? 'flame1' : d < 4.3 ? 'flame2' : 'flame3'; });
  // smoked-glass door on the right
  c.rect(13, 9, 3, 6, (x, y) => (y === 9 ? 'amber2' : x === 13 ? 'amber2' : 'amber3'));
  c.p(13, 9, 'brass1'); c.p(14, 12, 'brass0');
  // frame posts and bars
  c.rect(7, 7, 1, 10, 'brass1'); c.rect(16, 7, 1, 10, 'brass3'); c.rect(12, 7, 1, 10, 'brass2');
  c.rect(7, 7, 10, 1, (x) => (x < 12 ? 'brass0' : 'brass2'));
  c.rect(7, 16, 10, 1, (x) => (x < 12 ? 'brass1' : 'brass3'));
  // flame inside
  c.pts([[10, 10], [10, 11], [9, 12], [10, 12], [11, 12], [10, 13], [11, 13], [9, 13]], 'flame0'); c.p(10, 9, 'flame1');
  // base
  c.rect(7, 17, 10, 1, (x) => (x < 10 ? 'brass0' : x > 14 ? 'brass2' : 'brass1'));
  c.rect(8, 18, 8, 2, (x, y) => (y === 19 ? 'brass3' : x < 10 ? 'brass1' : 'brass2'));
  c.outline();
  c.halo(11.5, 12, 8, 10.5);
  return c.done();
};

D.wrens_notecard = () => {
  const c = cv();
  c.rect(7, 4, 13, 10, (x, y) => (y === 4 || x === 7 ? 'parch1' : 'parch2'));
  c.outline();
  c.rect(3, 8, 15, 11, (x, y) => (y === 8 || x === 3 ? 'parch0' : x === 17 || y === 18 ? 'parch2' : 'parch0'));
  c.rect(4, 10, 13, 1, 'red0');
  c.rect(4, 13, 13, 1, 'blue0'); c.rect(4, 16, 13, 1, 'blue0');
  // dog-ear
  c.clear(17, 18); c.clear(16, 18); c.clear(17, 17); c.p(16, 17, 'parch2'); c.p(15, 18, 'parch2'); c.p(16, 18, undefined);
  c.p(16, 17, 'parch3');
  c.outline();
  return c.done();
};

D.art_grey_glove = () => {
  const c = cv();
  const F = [[7, 4], [10, 2], [13, 3], [16, 6]];
  for (const [x, t] of F) for (let y = t; y <= 11; y++) { c.p(x, y, y === t ? 'cloth0' : 'cloth1'); c.p(x + 1, y, y === t ? 'cloth1' : 'cloth2'); }
  c.pts([[4, 8], [4, 9], [5, 9], [4, 10], [5, 10], [5, 11], [6, 11], [5, 12], [6, 12], [6, 13]], 'cloth1'); c.p(4, 8, 'cloth0'); c.pts([[6, 12], [6, 13]], 'cloth2');
  c.rect(7, 11, 11, 6, (x, y) => (x <= 8 ? 'cloth1' : x >= 16 || y >= 15 ? 'cloth2' : 'cloth1'));
  c.pts([[17, 14], [17, 15], [17, 16], [16, 16]], 'cloth3');
  c.pts([[9, 11], [12, 11], [15, 11]], 'cloth2');
  // stitching on the back of the hand
  c.pts([[10, 13], [13, 13], [10, 15], [13, 15]], 'cloth0');
  // cuff
  c.rect(7, 17, 11, 1, (x) => (x < 10 ? 'silver0' : 'silver1'));
  c.rect(6, 18, 13, 4, (x, y) => (x === 6 ? 'cloth2' : x >= 17 || y === 21 ? 'cloth3' : 'cloth2'));
  c.pts([[10, 19], [14, 19]], 'silver1'); c.pts([[11, 20], [12, 20], [13, 20]], 'silver0'); c.pts([[11, 21], [12, 21], [13, 21]], 'silver2');
  c.outline();
  return c.done();
};

D.art_side_door_key = () => {
  const c = cv();
  c.ring(7, 7, 5.2, 2.4, 'iron');
  c.line(10, 10, 19, 19, 'iron1'); c.line(11, 10, 20, 19, 'iron2'); c.line(10, 11, 19, 20, 'iron1');
  c.line(11, 10, 19, 18, 'iron0');
  // brass collar
  c.pts([[11, 11], [12, 11], [11, 12], [12, 12], [13, 12], [12, 13]], 'brass1'); c.p(11, 11, 'brass0'); c.p(13, 12, 'brass2');
  // bit
  c.pts([[17, 19], [16, 20], [15, 21], [16, 21], [17, 20], [18, 20], [19, 21], [18, 21], [20, 20]], 'iron2');
  c.pts([[15, 21], [18, 21]], 'iron3'); c.p(16, 20, 'iron1');
  c.outline();
  return c.done();
};

D.art_hall_chisel = () => {
  const c = cv();
  // handle
  c.poly([[15, 3], [20, 3], [21, 4], [21, 8], [15, 13], [12, 10]], (x, y) => (x + y < 21 ? 'wood0' : x + y < 25 ? 'wood1' : x + y < 28 ? 'wood2' : 'wood3'));
  c.pts([[18, 4], [17, 5]], 'wood0');
  // ferrule
  c.line(11, 11, 14, 14, 'brass1'); c.line(10, 11, 13, 14, 'brass0'); c.p(12, 11, 'brass0'); c.p(14, 13, 'brass2');
  // blade
  c.poly([[11, 13], [13, 15], [6, 22], [3, 21], [3, 20]], (x, y) => (y - x > 8 ? 'silver2' : y - x > 5 ? 'silver1' : 'silver2'));
  c.line(10, 14, 5, 19, 'silver0'); c.line(4, 21, 6, 21, 'white'); c.p(3, 20, 'white');
  c.outline();
  // stone chips
  c.pts([[2, 16], [8, 22]], 'stone1'); c.p(1, 18, 'stone2');
  return c.done();
};

D.art_cipher_wheel = () => {
  const c = cv();
  c.ball(12, 12, 10, 10, 'brass');
  c.ring(12, 12, 7.2, 6.2, 'brass', -0.6);
  c.ell(12, 12, 6.2, 6.2, (x, y, dx, dy) => tone('teal', lit(dx, dy)));
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2; c.p(12 + Math.cos(a) * 8.5 - 0.5, 12 + Math.sin(a) * 8.5 - 0.5, 'brass3'); }
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 - Math.PI / 2 + 0.3; c.p(12 + Math.cos(a) * 4.4 - 0.5, 12 + Math.sin(a) * 4.4 - 0.5, i % 2 ? 'teal0' : 'teal3'); }
  c.ball(12, 12, 1.6, 1.6, 'silver', 0.3);
  // pointer notch
  c.pts([[11, 0], [12, 0], [11, 1], [12, 1]], 'red1'); c.p(11, 0, 'red0'); c.pts([[11, 2], [12, 2]], 'red2');
  c.outline();
  return c.done();
};

D.art_silver_bolt = () => {
  const c = cv();
  c.line(6, 17, 17, 6, 'silver1'); c.line(7, 17, 18, 6, 'silver2'); c.line(6, 16, 16, 6, 'silver0');
  // head
  c.poly([[1, 22], [3, 15], [5, 16], [7, 18], [8, 20]], (x, y) => (x + 2 < y - 15 + 4 ? 'silver0' : 'silver1'));
  c.line(2, 21, 4, 17, 'white'); c.pts([[6, 19], [7, 19]], 'silver2'); c.p(5, 18, 'silver1');
  // fletching
  c.poly([[15, 5], [18, 0], [22, 0], [19, 5], [17, 7]], (x, y) => (y < 2 ? 'green0' : 'green1'));
  c.poly([[18, 8], [23, 5], [23, 9], [19, 10], [17, 9]], (x, y) => (y > 8 ? 'green3' : 'green2'));
  c.pts([[18, 6], [19, 5], [20, 4], [21, 3]], 'brass1');
  c.outline();
  return c.done();
};

D.art_seal_ring = () => {
  const c = cv();
  c.ell(12, 15, 8.5, 6.5, (x, y, dx, dy) => tone('gold', lit(dx, dy)));
  c.ell(12, 15.6, 5.5, 3.8, () => null);
  for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) { const dx = (x + 0.5 - 12) / 5.5, dy = (y + 0.5 - 15.6) / 3.8; if (dx * dx + dy * dy <= 1) c.clear(x, y); }
  // bezel
  c.ell(12, 7, 6, 4.6, (x, y, dx, dy) => tone('gold', lit(dx, dy, -0.2)));
  c.ell(12, 6.6, 4.4, 3.4, (x, y, dx, dy) => (Math.hypot(dx + 0.3, dy + 0.3) < 0.5 ? 'teal1' : dy > 0.4 ? 'teal3' : 'teal2'));
  // lamp above an open eye
  c.pts([[12, 4], [11, 5], [12, 5], [13, 5]], 'gold1'); c.p(12, 4, 'flame0');
  c.pts([[10, 7], [11, 6], [13, 6], [14, 7], [11, 8], [12, 8], [13, 8]], 'teal0'); c.p(12, 7, 'black3'); c.p(11, 7, 'teal3'); c.p(13, 7, 'teal3');
  c.pts([[5, 12], [6, 11]], 'gold0');
  // verdigris
  c.pts([[17, 18], [18, 17], [6, 19]], 'teal1');
  c.outline();
  return c.done();
};

D.art_stolen_record = () => {
  const c = cv();
  // sheet
  c.rect(5, 5, 14, 14, (x, y) => (x === 5 ? 'parch0' : x === 18 ? 'parch2' : 'parch1'));
  for (const y of [7, 9, 11, 15]) c.rect(7, y, y === 15 ? 6 : 10, 1, (x) => ((x * 7 + y) % 5 === 0 ? 'parch2' : 'ink0'));
  c.rect(7, 13, 9, 1, 'ink1'); c.rect(7, 14, 9, 1, 'red1'); c.rect(8, 16, 7, 1, 'red1');
  // rods
  c.rect(3, 2, 18, 3, (x, y) => (y === 2 ? 'parch1' : y === 3 ? 'parch2' : 'parch3')); c.pts([[3, 2], [3, 3]], 'parch0');
  c.rect(2, 3, 1, 1, 'wood1'); c.rect(21, 3, 1, 1, 'wood2');
  c.rect(3, 18, 18, 3, (x, y) => (y === 18 ? 'parch1' : y === 19 ? 'parch2' : 'parch3'));
  c.rect(2, 19, 1, 1, 'wood1'); c.rect(21, 19, 1, 1, 'wood2');
  // grey Order seal with a closed eye
  c.ball(17, 17, 3, 3, 'grey');
  c.pts([[15, 17], [16, 18], [17, 18], [18, 18], [19, 17]], 'grey3');
  c.outline();
  return c.done();
};

D.art_widows_hood = () => {
  const c = cv();
  // shoulders and drape
  c.poly([[1, 22], [3, 17], [7, 15], [17, 15], [21, 17], [23, 22]], (x, y) => { const f = (x - 1) / 22; return f < 0.2 ? 'cloth1' : f < 0.6 ? 'cloth2' : 'cloth3'; });
  // the cowl, peak bending back
  c.poly([[13, 1], [16, 2], [18, 5], [19, 10], [19, 16], [16, 19], [8, 19], [5, 16], [5, 9], [7, 4], [10, 2]], (x, y) => { const v = lit((x - 12) / 8, (y - 10) / 9, 0.05); return tone('cloth', v); });
  c.pts([[13, 0], [14, 0], [14, 1]], 'cloth1');
  // opening in deep shadow
  c.poly([[12, 6], [15, 8], [16, 12], [15, 17], [9, 17], [8, 12], [9, 8]], (x, y) => (y < 9 ? 'black1' : 'black3'));
  c.pts([[10, 8], [11, 7]], 'black0');
  // folds
  c.line(6, 11, 7, 17, 'cloth2'); c.line(18, 10, 17, 17, 'cloth3'); c.line(9, 18, 15, 18, 'cloth3');
  c.pts([[7, 5], [8, 4], [6, 8]], 'cloth0');
  c.line(4, 20, 6, 22, 'cloth3'); c.line(19, 20, 18, 22, 'cloth3');
  // rosemary sprig tucked at the side
  c.line(19, 16, 22, 9, 'green3');
  c.pts([[21, 10], [22, 11], [20, 12], [21, 13], [19, 14], [20, 15], [23, 9], [22, 8]], 'green1'); c.pts([[23, 10], [21, 12]], 'green0');
  c.outline();
  return c.done();
};

D.art_mirror_shard = () => {
  const c = cv();
  c.poly([[10, 0], [17, 4], [20, 12], [13, 23], [6, 18], [4, 8]], (x, y) => { const v = (-x - y + 30) / 30; return v > 0.62 ? 'pearl1' : v > 0.42 ? 'silver1' : v > 0.25 ? 'silver2' : 'blue2'; });
  // reflections
  c.line(6, 9, 11, 3, 'white'); c.line(7, 11, 13, 4, 'pearl0'); c.line(10, 19, 18, 10, 'silver1');
  // warm kitchen window glimpse
  c.rect(13, 13, 4, 3, 'amber1'); c.p(13, 13, 'amber0'); c.p(15, 13, 'amber2'); c.p(14, 14, 'amber2');
  // crack
  c.pts([[9, 1], [9, 2], [10, 3], [10, 4], [9, 5], [10, 6], [11, 7], [11, 8], [10, 9], [11, 10], [12, 11], [12, 12], [13, 13]], 'iron3');
  c.pts([[13, 16], [12, 17], [12, 18], [11, 19], [11, 20], [12, 21], [12, 22]], 'iron3');
  c.pts([[9, 10], [8, 11], [7, 12], [6, 13]], 'iron2');
  c.outline();
  return c.done();
};

D.art_waystation_register = () => {
  const c = cv();
  // page block (right and bottom)
  c.rect(7, 18, 14, 2, (x, y) => (x % 2 ? 'parch1' : 'parch2'));
  c.rect(19, 5, 2, 14, (x, y) => (y % 2 ? 'parch1' : 'parch2'));
  // cover
  c.box(4, 3, 16, 16, 'leather');
  c.rect(4, 3, 2, 16, (x) => (x === 4 ? 'leather1' : 'leather3'));
  c.rect(7, 5, 11, 12, (x, y) => (x === 7 || y === 5 ? 'leather2' : x === 17 || y === 16 ? 'leather0' : 'leather1'));
  // courier mark: a signpost
  c.pts([[12, 7], [12, 8], [12, 9], [12, 10], [12, 11], [12, 12], [12, 13], [12, 14]], 'gold2');
  c.pts([[10, 8], [11, 8], [13, 8], [14, 8], [15, 9], [13, 11], [11, 11], [10, 11], [9, 10]], 'gold1'); c.pts([[10, 8], [13, 8]], 'gold0');
  // strap and clasp
  c.rect(18, 9, 4, 3, 'leather3'); c.box(20, 9, 2, 3, 'brass');
  c.p(5, 4, 'leather0');
  c.outline();
  return c.done();
};

D.art_rite_cup = () => {
  const c = cv();
  // bowl
  c.poly([[4, 4], [20, 4], [19, 8], [16, 11], [13, 12], [11, 12], [8, 11], [5, 8]], (x, y) => { const f = (x - 4) / 16; return f < 0.18 ? 'silver1' : f < 0.36 ? 'silver0' : f < 0.7 ? 'silver1' : f < 0.88 ? 'silver2' : 'silver3'; });
  // rim with grey liquid
  c.ell(12, 4, 8, 2.2, (x, y, dx, dy) => (Math.abs(dx) > 0.82 || dy < -0.5 ? 'silver0' : dy > 0.3 ? 'grey1' : 'grey2'));
  c.pts([[9, 4], [10, 4]], 'grey0');
  // stem and knop
  c.cyl(11, 12, 3, 6, 'silver'); c.ball(12.5, 14.5, 2.4, 1.4, 'silver');
  // foot
  c.ell(12.5, 19.5, 6.5, 2, (x, y, dx, dy) => tone('silver', lit(dx, dy * 0.6)));
  c.rect(7, 19, 12, 1, (x) => (x < 10 ? 'silver0' : x > 15 ? 'silver2' : 'silver1'));
  // engraved band
  c.pts([[7, 7], [9, 8], [11, 8], [13, 8], [15, 8], [17, 7]], 'silver3');
  c.outline();
  // a curl of grey mist
  c.pts([[11, 1], [12, 0], [14, 1], [15, 0]], 'mist');
  return c.done();
};

D.art_ysolde_ember = () => {
  const c = cv();
  const r = prng('ember');
  c.poly([[6, 13], [9, 9], [14, 8], [18, 11], [19, 16], [16, 20], [9, 20], [5, 17]], (x, y) => {
    const d = Math.hypot(x + 0.5 - 12, y + 0.5 - 15); const n = r();
    return d < 2.2 ? 'flame0' : d < 4 ? (n < 0.3 ? 'flame0' : 'flame1') : d < 5.5 ? (n < 0.35 ? 'flame1' : 'flame2') : n < 0.4 ? 'flame3' : 'clay2';
  });
  // dark cracks of crust
  c.pts([[8, 11], [9, 12], [16, 10], [17, 12], [7, 18], [8, 19], [17, 18], [15, 19]], 'clay3');
  // tongues of flame
  c.pts([[11, 7], [12, 6], [12, 5], [12, 7], [13, 7], [14, 6]], 'flame1'); c.pts([[12, 4], [9, 7]], 'flame0');
  c.outline();
  c.halo(12, 14, 9, 11);
  // sparks
  c.pts([[17, 4], [6, 5], [19, 7]], 'flame1');
  return c.done();
};

// ---------- ledger pages ----------
const NUM = {
  I: ['x', 'x', 'x', 'x', 'x'],
  V: ['x...x', 'x...x', '.x.x.', '.x.x.', '..x..'],
  X: ['x.x', 'x.x', '.x.', 'x.x', 'x.x'],
};
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const DOODLE = [
  ['...aa...', '..xaax..', '...xx...', '...xx...', '...xx...', '..xxxx..'], // 1 lamp post
  ['xxxxxxxx', 'x..xx..x', 'x.xxxx.x', 'x.x..x.x', 'x.x..x.x', 'xxxxxxxx'], // 2 a palace in a frame
  ['..xxxx..', '.x....x.', '.x.xrxrx', '.x..r..x', '.x.r...x', '..xxxx..'], // 3 scratched face
  ['..xxxx..', '.x..x..x', 'x...x..x', 'x...xxxx', '.x.....x', '..xxxx..'], // 4 a clock
  ['........', '..xxxx..', '.x.rr.x.', 'x..rr..x', '.x....x.', '..xxxx..'], // 5 an open eye
  ['..xxxx..', '.x.xx.x.', 'x.x..x.x', 'x.x..x.x', 'x.x..x.x', 'xxxxxxxx'], // 6 the gate
  ['...r....', '..rar...', '..rar.r.', '.raaarr.', '.raaar..', '.xxxxxx.'], // 7 a burning house
  ['...xx...', 'xxxxxxxx', 'x..x...x', 'x..x..xx', 'xx.x....', '..xxx...'], // 8 scales
  ['.x....x.', 'xxx..xxx', '.x....x.', '.x.rr.x.', 'x.x..x.x', 'x.x..x.x'], // 9 two figures
  ['...x....', '.xxxxx..', '.xxxxxx.', '...x....', '...x....', '..xxx...'], // 10 signpost
  ['...x....', '.x.x.x..', '..xxx...', '.x.x.x..', '..xxx...', '...x....'], // 11 rosemary
  ['.a...a..', 'a...a...', 'xxx.xxx.', 'xxxxxxxx', 'xxx.xxx.', '.x...x..'], // 12 two cups of tea
];
function page(n) {
  const c = cv();
  const r = prng(`page${n}`);
  c.rect(4, 2, 16, 20, (x, y) => {
    if ((x === 4 || x === 19) && r() < 0.18) return undefined;
    if (y === 21 && r() < 0.3) return undefined;
    if (x === 4 || y === 2) return n === 12 ? 'gold1' : 'parch0';
    if (x === 19 || y === 21) return 'parch2';
    return r() < 0.05 ? 'parch2' : 'parch1';
  });
  // folded corner
  for (const [x, y] of [[17, 2], [18, 2], [19, 2], [18, 3], [19, 3], [19, 4]]) c.clear(x, y);
  c.pts([[17, 3], [17, 4], [18, 4]], 'parch3'); c.p(16, 2, 'parch0');
  // numeral
  const word = ROMAN[n - 1].split('');
  const width = word.reduce((s, ch) => s + NUM[ch][0].length, 0) + word.length - 1;
  let x = 11 - Math.floor((width - 1) / 2);
  for (const ch of word) { c.stamp(x, 5, NUM[ch], { x: n === 12 ? 'gold3' : 'ink1' }); x += NUM[ch][0].length + 1; }
  c.rect(7, 11, 10, 1, 'parch2');
  c.stamp(8, 12, DOODLE[n - 1], { x: 'ink1', r: 'red1', a: 'amber1' });
  // lines of handwriting
  for (const y of [19]) for (let i = 6; i <= 17; i++) if (r() > 0.22) c.p(i, y, 'parch3');
  c.outline();
  return c.done();
}
for (let n = 1; n <= 12; n++) D[`page_${n}`] = () => page(n);

// ---------- trinkets ----------
D.trinket_m1_ferry = () => {
  const c = cv();
  c.line(12, 0, 12, 3, 'wood1'); c.p(13, 1, 'wood2');
  c.ball(12, 13, 9, 9, 'brass');
  c.ring(12, 13, 7.2, 6.3, 'brass', -0.7);
  c.ell(12, 6.6, 1.2, 1.2, () => null); for (const [x, y] of [[11, 6], [12, 6], [11, 5], [12, 5]]) c.clear(x, y);
  // a little ferry boat, struck in relief
  c.poly([[7, 14], [17, 14], [15, 17], [9, 17]], () => 'brass3');
  c.line(8, 14, 16, 14, 'brass0');
  c.line(12, 8, 12, 13, 'brass3');
  c.poly([[13, 8], [16, 13], [13, 13]], () => 'brass0'); c.p(13, 13, 'brass1');
  c.poly([[11, 9], [11, 13], [9, 13]], () => 'brass1');
  c.pts([[7, 19], [8, 18], [9, 19], [10, 18], [11, 19], [13, 19], [14, 18], [15, 19], [16, 18], [17, 19]], 'brass2');
  c.outline();
  return c.done();
};

D.trinket_m1_tea = () => {
  const c = cv();
  c.ell(12, 19, 10, 2.6, (x, y, dx, dy) => (dy > 0.3 ? 'bone2' : dx < -0.4 ? 'bone0' : 'bone1'));
  c.poly([[4, 9], [19, 9], [18, 15], [15, 18], [8, 18], [5, 15]], (x) => { const f = (x - 4) / 15; return f < 0.15 ? 'bone1' : f < 0.4 ? 'bone0' : f < 0.75 ? 'bone1' : 'bone2'; });
  c.rect(5, 12, 14, 1, (x) => (x < 10 ? 'blue1' : 'blue2'));
  c.ell(11.5, 9, 7.5, 1.6, (x, y, dx, dy) => (Math.abs(dx) > 0.75 ? 'bone0' : 'clay1'));
  c.pts([[8, 9], [9, 9]], 'clay0');
  c.ring(20, 13, 2.8, 1.4, 'bone', -0.3);
  c.outline();
  // steam
  c.pts([[9, 6], [10, 5], [9, 4], [10, 3], [13, 6], [14, 5], [13, 4], [14, 2]], 'mist');
  // rosemary sprig on the saucer
  c.line(3, 21, 8, 20, 'green3'); c.pts([[4, 20], [5, 21], [6, 19], [7, 21], [3, 22]], 'green1');
  return c.done();
};

D.trinket_m2_walls = () => {
  const c = cv();
  c.pts([[12, 1], [11, 2], [13, 2], [10, 3], [14, 3], [10, 4], [14, 4], [10, 5], [14, 5], [11, 6], [13, 6]], 'parch3');
  c.pts([[12, 1], [11, 2]], 'parch1');
  c.poly([[8, 7], [16, 7], [19, 10], [19, 21], [5, 21], [5, 10]], (x, y) => (x <= 6 ? 'wood0' : x >= 18 || y >= 20 ? 'wood2' : (x * 5 + y * 3) % 11 === 0 ? 'wood2' : 'wood1'));
  for (const [x, y] of [[11, 9], [12, 9], [11, 10], [12, 10]]) c.clear(x, y);
  // SIDE in carved capitals, with a lit lower edge
  const SIDE = ['xxx.x.xx..xx', 'x...x.x.x.x.', 'xxx.x.x.x.xx', '..x.x.x.x.x.', 'xxx.x.xx..xx'];
  c.stamp(6, 13, SIDE, { x: 'wood3' });
  c.pts([[6, 18], [7, 18], [8, 18], [10, 18], [12, 18], [13, 18], [16, 18], [17, 18]], 'wood0');
  c.outline();
  return c.done();
};

D.trinket_m2_back = () => {
  const c = cv();
  const panel = (x) => Math.floor((x - 2) / 5);
  c.rect(2, 4, 20, 16, (x, y) => { const p = panel(x); const f = (x - 2) % 5; const base = p % 2 ? 'parch2' : 'parch1'; return f === 0 && p % 2 === 0 ? 'parch0' : f === 4 && p % 2 ? 'parch3' : base; });
  for (const [dx, dy] of [[0, 1], [0, 0]]) { c.p(2 + 5 * 1 + dx, 4 + dy, 'parch3'); }
  // dotted route
  const path = [[18, 17], [16, 17], [14, 16], [13, 14], [11, 13], [9, 12], [8, 10], [9, 8]];
  path.forEach(([x, y], i) => c.p(x, y, i % 2 ? 'red2' : 'red1'));
  // arrowhead pointing back to the start
  c.pts([[7, 7], [8, 7], [9, 7], [8, 6], [10, 6], [7, 8]], 'red1'); c.p(8, 6, 'red0');
  c.ball(18.5, 17.5, 1.4, 1.4, 'red');
  // a little house marker
  c.pts([[5, 15], [4, 16], [5, 16], [6, 16], [4, 17], [6, 17]], 'ink1');
  c.outline();
  return c.done();
};

D.trinket_m3_names = () => {
  const c = cv();
  // wedge: top face (icing)
  c.poly([[3, 10], [18, 6], [21, 10], [8, 15]], (x, y) => ((x + y) % 6 === 0 ? 'bone1' : y < 9 ? 'bone0' : 'bone1'));
  // front face layers
  c.poly([[3, 10], [8, 15], [8, 21], [3, 16]], (x, y) => (y - x > 9 ? 'clay2' : 'clay1'));
  c.poly([[8, 15], [21, 10], [21, 16], [8, 21]], (x, y) => { const l = (y - 15 + (x - 8) * 0.38); return l < 1 ? 'amber1' : l < 2.6 ? 'amber0' : l < 3.6 ? 'clay1' : 'amber2'; });
  // seeds
  c.pts([[12, 16], [15, 15], [18, 15], [10, 18], [14, 17], [17, 17], [5, 14], [5, 16]], 'ink2');
  // cherry
  c.ball(15, 7.5, 2, 2, 'red'); c.pts([[16, 5], [17, 4]], 'green2'); c.p(14, 6, 'white');
  c.outline();
  return c.done();
};

D.trinket_m3_drifter = () => {
  const c = cv();
  c.poly([[4, 3], [20, 3], [20, 12], [12, 21], [4, 12]], (x, y) => { const v = lit((x - 12) / 9, (y - 11) / 10); return tone('silver', v - 0.15); });
  c.poly([[6, 5], [18, 5], [18, 11.5], [12, 18.5], [6, 11.5]], (x, y) => tone('iron', lit((x - 12) / 7, (y - 11) / 8, 0.3)));
  // crossed staves in brass
  c.line(7, 7, 16, 16, 'brass1'); c.line(17, 7, 8, 16, 'brass2'); c.pts([[7, 7], [17, 7]], 'brass0');
  // milestone
  c.rect(10, 9, 4, 6, (x, y) => (x === 10 ? 'stone0' : x === 13 ? 'stone2' : 'stone1')); c.rect(11, 8, 2, 1, 'stone0');
  c.pts([[11, 11], [12, 11]], 'stone3');
  c.outline();
  return c.done();
};

D.trinket_m4_smuggler = () => {
  const c = cv();
  c.box(2, 6, 20, 14, 'parch');
  c.line(2, 6, 12, 14, 'parch2'); c.line(21, 6, 12, 14, 'parch3');
  c.line(2, 19, 9, 13, 'parch2'); c.line(21, 19, 15, 13, 'parch2');
  c.ball(12, 13.5, 3.2, 3, 'green');
  c.pts([[11, 13], [12, 12], [13, 13], [12, 14]], 'green3');
  c.outline();
  // scent wisps
  c.pts([[17, 4], [18, 3], [19, 2], [20, 3], [5, 3], [6, 2], [7, 3], [8, 2]], 'rose1');
  return c.done();
};

D.trinket_m4_books = () => {
  const c = cv();
  c.rect(8, 17, 11, 2, (x) => (x % 2 ? 'parch1' : 'parch2'));
  c.rect(17, 7, 2, 11, (x, y) => (y % 2 ? 'parch1' : 'parch2'));
  c.box(5, 5, 13, 13, 'black');
  c.rect(5, 5, 2, 13, (x) => (x === 5 ? 'black1' : 'black3'));
  c.rect(9, 8, 6, 4, (x, y) => (x === 9 || y === 8 ? 'black2' : 'black0'));
  // brass clasp
  c.rect(16, 10, 4, 3, 'brass2'); c.box(18, 9, 3, 5, 'brass'); c.p(19, 11, 'brass3');
  // salt crust
  c.pts([[6, 16], [8, 17], [7, 15], [15, 16], [12, 6], [16, 7], [10, 16]], 'white');
  c.pts([[11, 15], [14, 6]], 'silver1');
  c.outline();
  return c.done();
};

D.trinket_m5_clock = () => {
  const c = cv();
  // butterfly bow
  c.ell(7, 6.5, 5, 4.5, (x, y, dx, dy) => tone('brass', lit(dx, dy)));
  c.ell(17, 6.5, 5, 4.5, (x, y, dx, dy) => tone('brass', lit(dx, dy, -0.1)));
  for (const [cx] of [[7], [17]]) for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) { const dx = (x + 0.5 - cx) / 2.2, dy = (y + 0.5 - 6.5) / 1.8; if (dx * dx + dy * dy <= 1) c.clear(x, y); }
  c.rect(10, 4, 4, 6, (x) => (x === 10 ? 'brass0' : x === 13 ? 'brass2' : 'brass1'));
  // shaft and socket
  c.cyl(11, 10, 3, 9, 'brass');
  c.rect(11, 12, 3, 1, 'brass3');
  c.box(10, 18, 5, 4, 'brass'); c.rect(11, 19, 3, 2, 'brass3'); c.p(12, 21, 'brass3');
  c.outline();
  return c.done();
};

D.trinket_m5_invite = () => {
  const c = cv();
  // card behind, fanned
  c.poly([[11, 1], [21, 4], [17, 21], [7, 18]], (x, y) => 'parch2');
  c.outline();
  c.box(3, 3, 13, 19, 'parch');
  c.rect(5, 5, 9, 15, (x, y) => (x === 5 || y === 5 ? 'green1' : 'green2'));
  // rook (the bird)
  c.stamp(6, 8, [
    '...xx..',
    '..xxxa.',
    '..xxx..',
    '.xxxx..',
    'xxxxx..',
    '.xxxxx.',
    '..xxxx.',
    '...x.x.',
  ], { x: 'black2', a: 'brass1' });
  c.p(8, 9, 'white');
  c.pts([[4, 4], [14, 20]], 'red1');
  c.outline();
  return c.done();
};

D.trinket_m6_riddle = () => {
  const c = cv();
  // top face
  c.poly([[3, 7], [12, 3], [21, 7], [12, 11]], (x, y) => ((x * 7 + y * 3) % 23 === 0 ? 'stone1' : 'stone0'));
  // left face
  c.poly([[3, 7], [12, 11], [12, 21], [3, 17]], (x, y) => 'stone1');
  // right face
  c.poly([[12, 11], [21, 7], [21, 17], [12, 21]], (x, y) => ((x * 3 + y * 5) % 17 === 0 ? 'stone3' : 'stone2'));
  // carved lines of text in the old tongue, following the slope of the face
  for (const row of [0, 3, 6]) for (let x = 5; x <= 10 - (row === 6 ? 2 : 0); x++) { const y = 9 + row + Math.floor((x - 3) / 2); c.p(x, y, 'ink1'); c.p(x, y + 1, 'stone0'); }
  c.line(4, 7, 11, 10, 'white');
  // moss
  c.pts([[4, 17], [5, 18], [3, 16], [20, 16]], 'green2'); c.p(6, 18, 'green1');
  c.outline();
  return c.done();
};

D.trinket_m6_grief = () => {
  const c = cv();
  // dish
  c.ell(12, 19, 9, 3, (x, y, dx, dy) => (dy < -0.2 ? (dx < 0 ? 'silver1' : 'silver2') : dy > 0.5 ? 'silver3' : 'silver2'));
  c.ell(12, 18.6, 7, 1.8, (x, y, dx, dy) => (dx < -0.3 ? 'silver2' : 'silver3'));
  c.ring(21.5, 17.5, 2, 1, 'silver');
  // candle stub
  c.cyl(9, 11, 6, 8, 'bone');
  c.pts([[9, 11], [10, 11], [13, 11], [14, 11], [9, 12], [14, 13], [14, 14]], 'bone1');
  c.pts([[10, 10], [11, 10], [12, 10], [13, 10]], 'bone0');
  c.pts([[8, 15], [8, 16], [15, 13], [15, 14], [15, 15]], 'bone1');
  // wick and flame
  c.p(12, 9, 'black3');
  c.pts([[12, 4], [11, 5], [12, 5], [11, 6], [12, 6], [13, 6], [11, 7], [12, 7], [13, 7], [12, 8]], 'flame1');
  c.pts([[12, 6], [12, 7]], 'flame0'); c.pts([[13, 6], [13, 7]], 'flame2');
  c.outline();
  c.halo(12, 6.5, 4.5, 6.5);
  return c.done();
};

D.trinket_m7_forger = () => {
  const c = cv();
  // ink pot
  c.ball(7, 18, 5.5, 4.4, 'black', 0.15);
  c.rect(4, 12, 6, 3, (x) => (x === 4 ? 'black0' : x === 9 ? 'black3' : 'black1'));
  c.rect(3, 12, 8, 1, (x) => (x < 6 ? 'black0' : 'black2'));
  c.pts([[4, 16], [4, 17], [5, 15]], 'black0'); c.pts([[5, 17], [6, 16]], 'white');
  // feather vane, a long leaf along the diagonal; lit side up-left, shade down-right
  c.poly([[10, 11], [12, 7], [15, 3], [19, 0], [22, 0], [22, 3], [20, 7], [16, 11], [12, 13]], (x, y) => {
    const side = (x - 10) - (11 - y); // >0 below-right of the shaft
    return side < -3 ? 'bone0' : side < 0 ? 'bone1' : side < 3 ? 'bone2' : 'bone3';
  });
  // barb notches
  for (const [x, y] of [[13, 6], [16, 2], [19, 8], [15, 11]]) c.clear(x, y);
  c.pts([[14, 6], [17, 2]], 'bone1');
  // shaft and nib
  c.line(9, 13, 21, 1, 'bone0'); c.line(10, 13, 21, 2, 'bone2');
  c.pts([[8, 13], [9, 12]], 'black3'); c.p(9, 13, 'grey2');
  c.outline();
  return c.done();
};

D.trinket_m7_doubt = () => {
  const c = cv();
  c.rect(6, 19, 13, 1, 'parch2'); c.rect(18, 5, 1, 14, 'parch2');
  c.box(4, 3, 14, 16, 'blue');
  c.rect(4, 3, 1, 16, 'blue3');
  c.rect(7, 6, 8, 3, (x, y) => (y === 6 ? 'parch0' : 'parch1'));
  c.rect(8, 7, 6, 1, 'ink0');
  // string tie
  c.rect(4, 12, 15, 1, 'bone2'); c.pts([[18, 12], [19, 13], [20, 14], [19, 11], [20, 10]], 'bone2');
  // pencil
  c.line(7, 21, 21, 15, 'amber1'); c.line(8, 22, 22, 16, 'amber2');
  c.pts([[6, 22], [5, 22]], 'clay0'); c.p(4, 23, 'black2');
  c.pts([[21, 15], [22, 15], [22, 16]], 'rose1');
  c.outline();
  return c.done();
};

D.trinket_m8_stair = () => {
  const c = cv();
  // tails
  c.poly([[10, 11], [12, 12], [7, 22], [4, 20]], (x, y) => (x < 7 ? 'red1' : 'red2'));
  c.poly([[12, 12], [14, 11], [20, 20], [17, 22]], (x, y) => (x < 17 ? 'red2' : 'red3'));
  c.pts([[5, 21], [6, 22], [19, 21], [18, 22]], undefined); c.clear(5, 22); c.clear(19, 22);
  // loops
  c.poly([[11, 10], [4, 4], [2, 7], [3, 12], [11, 12]], (x, y) => (y < 7 ? 'red0' : x < 5 ? 'red1' : 'red2'));
  c.poly([[13, 10], [20, 4], [22, 7], [21, 12], [13, 12]], (x, y) => (y < 7 ? 'red1' : 'red2'));
  c.pts([[5, 8], [6, 9], [18, 8], [19, 9]], 'red3');
  // knot
  c.box(10, 9, 5, 4, 'red');
  c.outline();
  return c.done();
};

D.trinket_m8_masque = () => {
  const c = cv();
  // stick
  c.line(15, 13, 21, 22, 'black1'); c.line(16, 13, 22, 22, 'black2');
  // mask
  c.poly([[2, 7], [7, 5], [12, 7], [17, 5], [22, 7], [21, 12], [16, 14], [13, 12], [11, 12], [8, 14], [3, 12]], (x, y) => { const v = lit((x - 12) / 11, (y - 9) / 6); return tone('green', v); });
  // gold trim and eye holes
  c.pts([[3, 7], [6, 6], [7, 6], [8, 6], [16, 6], [17, 6], [18, 6], [21, 7]], 'gold1');
  c.ell(7.5, 9.5, 2.4, 1.3, () => 'black3'); c.ell(16.5, 9.5, 2.4, 1.3, () => 'black3');
  c.pts([[5, 12], [7, 13], [17, 13], [19, 12], [12, 8]], 'gold2');
  // feathers
  c.poly([[19, 6], [21, 0], [23, 1], [22, 6]], (x) => (x < 22 ? 'gold0' : 'gold2'));
  c.poly([[16, 6], [16, 0], [18, 0], [19, 6]], (x) => (x < 17 ? 'green0' : 'green1'));
  c.outline();
  return c.done();
};

D.trinket_m9_mirror = () => {
  const c = cv();
  c.box(2, 3, 20, 18, 'wood');
  c.rect(4, 5, 16, 14, (x, y) => (y === 5 || x === 4 ? 'black1' : 'black2'));
  // the first list, clear
  for (const y of [7, 9, 11, 13, 15, 17]) c.rect(6, y, 2 + ((y * 7) % 4), 1, 'chalk');
  // the second list, smudged
  for (const y of [7, 9, 11, 13, 15, 17]) for (let x = 13; x < 13 + 2 + ((y * 5) % 5); x++) c.p(x, y, (x + y) % 3 ? 'smudge' : 'black1');
  c.pts([[14, 8], [15, 10], [13, 12], [16, 14]], 'smudge');
  c.rect(11, 6, 1, 12, 'black3');
  c.outline();
  return c.done();
};

D.trinket_m9_face = () => {
  const c = cv();
  // handle
  c.line(10, 12, 20, 22, 'wood1'); c.line(11, 12, 21, 22, 'wood2'); c.line(10, 13, 19, 22, 'wood1');
  c.line(11, 12, 20, 21, 'wood0');
  // head block (rotated)
  c.poly([[2, 7], [9, 0], [16, 7], [9, 14]], (x, y) => { const u = x - y; return u < -3 ? 'wood0' : u < 2 ? 'wood1' : u < 6 ? 'wood2' : 'wood3'; });
  c.line(3, 7, 9, 1, 'wood0');
  c.pts([[5, 9], [7, 11], [11, 5], [13, 7]], 'wood3');
  c.outline();
  c.pts([[18, 5], [20, 7], [21, 4]], 'stone1');
  return c.done();
};

D.trinket_m10_hollow = () => {
  const c = cv();
  c.ball(8, 16, 6, 4.6, 'stone');
  c.ball(17, 17, 5, 4, 'grey');
  c.ball(12, 8, 5, 4, 'clay');
  // painted marks
  c.pts([[6, 15], [7, 16], [8, 15], [9, 16], [10, 15]], 'red1');
  c.pts([[16, 16], [17, 15], [18, 16], [17, 17], [17, 18]], 'blue0');
  c.pts([[11, 7], [12, 7], [13, 7], [12, 8], [12, 9]], 'bone0');
  c.outline();
  return c.done();
};

D.trinket_m10_road = () => {
  const c = cv();
  // the road running past
  c.poly([[0, 20], [24, 17], [24, 22], [0, 23]], (x, y) => ((x * 3 + y) % 5 === 0 ? 'clay2' : 'clay1'));
  // squat milestone
  c.poly([[6, 19], [6, 10], [8, 7], [12, 6], [16, 7], [18, 10], [18, 19]], (x, y) => { const v = lit((x - 12) / 7, (y - 11) / 9, 0.1); return tone('stone', v - 0.15); });
  c.rect(5, 18, 15, 2, (x) => (x < 8 ? 'stone2' : 'stone3'));
  // carved V for Veyra and an arrow
  c.pts([[10, 9], [11, 10], [12, 11], [13, 10], [14, 9]], 'stone3'); c.pts([[11, 11], [13, 11], [12, 12]], 'stone0');
  c.line(8, 14, 15, 14, 'stone3'); c.pts([[14, 13], [13, 12], [14, 15], [13, 16]], 'stone3'); c.line(9, 15, 14, 15, 'stone0');
  // heather and moss
  c.pts([[5, 17], [6, 16], [19, 17], [18, 16], [4, 18]], 'green1'); c.pts([[19, 16], [20, 17], [4, 17]], 'violet1'); c.p(5, 16, 'violet0');
  c.pts([[8, 8], [9, 7]], 'stone0');
  c.outline();
  return c.done();
};

D.trinket_m11_pace = () => {
  const c = cv();
  // hanger
  c.pts([[12, 0], [13, 1], [12, 2]], 'brass1'); c.line(5, 4, 12, 2, 'wood1'); c.line(12, 2, 19, 4, 'wood2');
  // coat body
  c.poly([[4, 4], [9, 3], [12, 9], [15, 3], [20, 4], [21, 22], [3, 22]], (x, y) => { const f = (x - 3) / 18; return f < 0.2 ? 'black0' : f < 0.6 ? 'black1' : 'black2'; });
  // green silk lining at the lapels
  c.poly([[9, 3], [12, 9], [11, 13], [8, 6]], () => 'green1'); c.poly([[15, 3], [16, 6], [13, 13], [12, 9]], () => 'green2');
  c.line(12, 10, 12, 22, 'black3');
  c.pts([[13, 14], [13, 17], [13, 20]], 'gold1');
  // sleeves
  c.rect(3, 6, 2, 15, (x) => (x === 3 ? 'black0' : 'black1')); c.rect(20, 6, 2, 15, 'black2');
  c.pts([[4, 5], [5, 4], [6, 4]], 'black0');
  c.pts([[3, 20], [4, 20]], 'green1'); c.pts([[20, 20], [21, 20]], 'green2');
  c.pts([[6, 16], [7, 16], [8, 16], [16, 16], [17, 16], [18, 16]], 'black2');
  c.outline();
  return c.done();
};

D.trinket_m11_song = () => {
  const c = cv();
  // stems
  for (const [x0, x1] of [[10, 9], [12, 12], [14, 15]]) c.line(x0, 14, x1, 22, 'green3');
  // sprigs fanning out
  const sprig = (x0, y0, x1, y1) => {
    c.line(x0, y0, x1, y1, 'green3');
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i += 1) { const x = Math.round(x0 + ((x1 - x0) * i) / n), y = Math.round(y0 + ((y1 - y0) * i) / n); if (i % 2 === 0) { c.p(x - 1, y, 'green1'); c.p(x + 1, y, 'green2'); } else { c.p(x - 1, y - 1, 'green0'); } }
  };
  sprig(12, 14, 12, 1); sprig(11, 14, 5, 3); sprig(13, 14, 19, 3); sprig(10, 15, 3, 9); sprig(14, 15, 21, 9);
  // tiny blue flowers
  c.pts([[12, 1], [5, 3], [19, 3], [8, 6]], 'blue0');
  // twine
  c.rect(9, 15, 7, 2, (x, y) => ((x + y) % 2 ? 'bone2' : 'bone1')); c.pts([[16, 16], [17, 17], [17, 18]], 'bone2');
  c.outline();
  return c.done();
};

D.trinket_m12_kept = () => {
  const c = cv();
  c.poly([[12, 1], [15, 6], [20, 5], [18, 10], [22, 13], [16, 15], [15, 19], [12, 16], [9, 19], [8, 15], [2, 13], [6, 10], [4, 5], [9, 6]], (x, y) => {
    const v = lit((x - 12) / 10, (y - 10) / 10); return v > 0.85 ? 'amber0' : v > 0.4 ? 'amber1' : v > 0 ? 'clay1' : 'red2';
  });
  c.line(12, 4, 12, 22, 'clay2');
  c.line(12, 12, 7, 8, 'clay2'); c.line(12, 12, 17, 8, 'clay2'); c.line(12, 15, 6, 13, 'clay3'); c.line(12, 15, 18, 13, 'clay3');
  c.pts([[12, 21], [11, 22]], 'wood2');
  c.pts([[14, 9], [15, 11]], 'red1');
  c.outline();
  return c.done();
};

D.trinket_m12_echoes = () => {
  const c = cv();
  c.ball(12, 12, 10, 10, 'brass');
  c.ring(12, 12, 8.4, 7.4, 'brass', -0.7);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 - Math.PI / 2; c.p(12 + Math.cos(a) * 6.2, 12 + Math.sin(a) * 6.2, 'brass0'); }
  c.pts([[12, 8], [11, 9], [12, 9], [13, 9]], 'flame0');
  c.rect(10, 10, 5, 1, 'brass3'); c.rect(11, 11, 3, 3, 'brass3'); c.rect(10, 14, 5, 1, 'brass3');
  c.pts([[12, 12]], 'brass0');
  c.outline();
  return c.done();
};

D.trinket_m12_year = () => {
  const c = cv();
  // ribbon in a V
  c.poly([[5, 0], [10, 0], [13, 10], [10, 11]], (x) => (x < 8 ? 'blue1' : 'blue2'));
  c.poly([[14, 0], [19, 0], [14, 11], [11, 10]], (x) => (x < 16 ? 'gold1' : 'gold2'));
  c.outline();
  // medal
  c.ball(12, 15, 7.4, 7.4, 'brass');
  c.ring(12, 15, 5.8, 5.0, 'brass', -0.7);
  // the Lamp of Ysolde
  c.pts([[12, 11], [11, 12], [12, 12], [13, 12]], 'flame0');
  c.rect(10, 13, 5, 1, 'brass3'); c.rect(11, 14, 3, 3, 'brass3'); c.rect(10, 17, 5, 1, 'brass3');
  c.pts([[12, 15]], 'brass0');
  c.outline();
  return c.done();
};

// ---------- treasures ----------
const die = (c, x, y, s, pips) => { // isometric-ish cube: top face, left face, right face
  const h = Math.floor(s / 2);
  c.poly([[x, y + h], [x + s, y], [x + 2 * s, y + h], [x + s, y + 2 * h]], (px, py) => 'bone0');
  c.poly([[x, y + h], [x + s, y + 2 * h], [x + s, y + 2 * h + s], [x, y + h + s]], () => 'bone1');
  c.poly([[x + s, y + 2 * h], [x + 2 * s, y + h], [x + 2 * s, y + h + s], [x + s, y + 2 * h + s]], () => 'bone2');
  for (const [px, py, col] of pips) c.p(x + px, y + py, col || 'black3');
};

D.ct_bone_dice = () => {
  const c = cv();
  die(c, 11, 2, 5, [[5, 2, 'red2'], [4, 2, 'black3'], [2, 7], [3, 8], [7, 9], [8, 8]]);
  die(c, 2, 9, 6, [[5, 2, 'black3'], [6, 2, 'red1'], [6, 3], [2, 8], [3, 9], [3, 12], [4, 13], [9, 9], [10, 9], [9, 13], [10, 12]]);
  c.outline();
  return c.done();
};

D.ct_silver_mirror = () => {
  const c = cv();
  // ancient round mirror, broken across
  c.ball(12, 12, 10, 10, 'brass', -0.1);
  c.ell(12, 12, 7.6, 7.6, (x, y, dx, dy) => { const v = lit(dx, dy) - (dx + dy) * 0.2; return v > 0.95 ? 'pearl0' : v > 0.6 ? 'pearl1' : v > 0.2 ? 'silver1' : 'violet2'; });
  // a room glimpsed in the glass: a doorway
  c.rect(8, 9, 4, 7, 'violet3'); c.rect(9, 8, 2, 1, 'violet3'); c.pts([[9, 10], [9, 11], [10, 10]], 'amber1');
  c.rect(5, 16, 9, 1, 'violet2'); c.line(6, 6, 9, 3, 'white');
  // the broken edge
  const edge = [17, 17, 16, 16, 15, 16, 16, 15, 14, 15, 15, 14, 15, 16, 16, 17, 16, 17, 18, 18, 19, 19, 20, 20];
  for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) if (x > edge[y]) c.clear(x, y);
  // ornament dots on the frame
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; const x = 12 + Math.cos(a) * 8.8 - 0.5, y = 12 + Math.sin(a) * 8.8 - 0.5; if (c.has(Math.round(x), Math.round(y))) c.p(x, y, i % 2 ? 'gold0' : 'brass3'); }
  c.outline();
  c.pts([[20, 6], [22, 9], [19, 3], [21, 13]], 'pearl1'); c.p(20, 11, 'silver2');
  return c.done();
};

D.ct_wardens_compass = () => {
  const c = cv();
  c.ring(12, 2.5, 2.4, 1.2, 'brass');
  c.ball(12, 13.5, 9.5, 9.5, 'brass');
  c.ell(12, 13.5, 7.3, 7.3, (x, y, dx, dy) => (lit(dx, dy) > 0.7 ? 'parch0' : lit(dx, dy) > 0.1 ? 'parch1' : 'parch2'));
  // cardinal ticks
  c.pts([[12, 7], [12, 20], [5, 14], [18, 14], [11, 7], [5, 13], [18, 13], [11, 20]], 'ink1');
  // needle points toward something forgotten
  c.line(12, 13, 17, 8, 'red1'); c.line(12, 14, 17, 9, 'red2'); c.p(17, 8, 'red0'); c.p(16, 9, 'red1');
  c.line(11, 14, 7, 18, 'iron1'); c.line(12, 14, 8, 18, 'iron2');
  c.ball(12, 13.5, 1.2, 1.2, 'gold', 0.3);
  c.outline();
  return c.done();
};

D.ct_nameless_crown = () => {
  const c = cv();
  const BG = (x, y) => { const f = (x - 3) / 18; return f < 0.15 ? 'black0' : f < 0.5 ? 'black1' : f < 0.85 ? 'black2' : 'black3'; };
  // points
  c.poly([[3, 15], [3, 6], [7, 11], [8.5, 4], [12, 10], [15.5, 4], [17, 11], [21, 6], [21, 15]], BG);
  // gold edging
  c.pts([[3, 6], [4, 7], [5, 8], [6, 9], [8, 5], [8, 6], [9, 6], [16, 5], [15, 6], [16, 6], [21, 6], [20, 7], [19, 8]], 'gold1');
  // band
  c.poly([[2, 14], [12, 16], [22, 14], [22, 20], [12, 22], [2, 20]], (x, y) => { const f = (x - 2) / 20; return f < 0.12 ? 'gold0' : f < 0.5 ? 'gold1' : f < 0.85 ? 'gold2' : 'gold3'; });
  c.line(2, 14, 12, 16, 'gold0'); c.line(12, 16, 22, 14, 'gold1');
  c.line(2, 20, 12, 22, 'gold3'); c.line(12, 22, 22, 20, 'gold3');
  // river-stones
  c.ball(12, 19, 2, 2, 'teal', 0.2); c.ball(6.5, 17.8, 1.5, 1.6, 'blue', 0.2); c.ball(17.5, 17.8, 1.5, 1.6, 'blue', 0.2);
  // finials
  c.ball(3.5, 5, 1.3, 1.3, 'gold'); c.ball(8.5, 3, 1.3, 1.3, 'gold'); c.ball(15.5, 3, 1.3, 1.3, 'gold'); c.ball(20.5, 5, 1.3, 1.3, 'gold');
  c.ball(12, 9, 1.2, 1.2, 'teal');
  c.outline();
  return c.done();
};

D.ct_ysolde_wick = () => {
  const c = cv();
  // saucer
  c.ell(12, 18, 10, 4, (x, y, dx, dy) => (dy < -0.1 ? (dx < -0.4 ? 'clay0' : 'clay1') : dy > 0.55 ? 'clay3' : 'clay2'));
  c.ell(12, 17.2, 7.5, 2.2, (x, y, dx, dy) => (dx < -0.3 ? 'clay2' : 'clay3'));
  c.pts([[4, 20], [7, 21], [17, 21], [20, 20]], 'clay3');
  c.pts([[5, 18], [19, 18]], 'gold2');
  // spout
  c.poly([[19, 16], [23, 14], [23, 16], [20, 18]], (x) => (x < 21 ? 'clay1' : 'clay2'));
  // charred wick
  c.pts([[12, 14], [12, 15], [13, 16], [11, 16]], 'black3'); c.p(12, 13, 'black2');
  // a flame no wider than a grain of rice
  c.pts([[12, 10], [12, 11], [12, 12]], 'flame0'); c.p(12, 9, 'flame1'); c.p(11, 12, 'flame1'); c.p(13, 12, 'flame2');
  c.outline();
  c.halo(12.5, 11, 3.5, 5.5);
  return c.done();
};

D.ct_tide_pearl = () => {
  const c = cv();
  // upper shell, tilted open: a scallop fan with ridges running out from the hinge
  c.ell(12, 13, 10.5, 11, (x, y, dx, dy) => (y > 12 ? undefined : tone('stone', lit(dx, dy, 0.25))));
  for (let i = 1; i < 8; i++) { const a = Math.PI + i * (Math.PI / 8); c.line(12, 13, Math.round(12 + Math.cos(a) * 11), Math.round(13 + Math.sin(a) * 11.5), 'stone2'); }
  for (let i = 0; i <= 8; i++) { const a = Math.PI + i * (Math.PI / 8); c.clear(Math.round(12 + Math.cos(a) * 10.4 - 0.5), Math.round(13 + Math.sin(a) * 10.9 - 0.5)); }
  // lower shell
  c.ell(12, 13, 9.5, 8, (x, y, dx, dy) => (y < 14 ? undefined : tone('stone', lit(dx, dy * 0.5, -0.2))));
  for (let i = 1; i < 6; i++) { const a = i * (Math.PI / 6); c.line(12, 14, Math.round(12 + Math.cos(a) * 9), Math.round(14 + Math.sin(a) * 7), 'stone3'); }
  // nacre lip
  c.rect(3, 13, 18, 1, (x) => (x < 8 ? 'rose0' : 'rose1'));
  // the grey pearl
  c.ball(12, 11, 3.8, 3.8, 'grey', 0.2);
  c.pts([[10, 9], [11, 9]], 'white'); c.p(14, 13, 'rose0');
  c.outline();
  return c.done();
};

D.ct_hollow_mask = () => {
  const c = cv();
  c.ell(12, 11.5, 8, 10.5, (x, y, dx, dy) => tone('bone', lit(dx * 0.95, dy * 0.8, 0.12)));
  // eye holes
  c.ell(8.5, 9.5, 2.2, 1.4, () => 'black3'); c.ell(15.5, 9.5, 2.2, 1.4, () => 'black3');
  c.pts([[7, 11], [10, 11], [14, 11], [17, 11]], 'bone2');
  // brow and nose, no mouth at all
  c.pts([[6, 7], [7, 7], [8, 7], [16, 7], [17, 7], [18, 7]], 'bone2');
  c.pts([[12, 11], [12, 12], [12, 13], [13, 14]], 'bone2'); c.p(11, 12, 'bone0');
  c.pts([[10, 17], [11, 17], [12, 17], [13, 17], [14, 17]], 'bone1');
  // a hairline crack
  c.pts([[15, 2], [15, 3], [14, 4], [15, 5], [16, 6]], 'bone3');
  // ribbon ties
  c.outline();
  c.pts([[2, 10], [1, 11], [2, 12], [1, 13], [22, 10], [23, 11], [22, 12], [23, 13]], 'violet1');
  return c.done();
};

D.ct_iron_key = () => {
  const c = cv();
  // sluice-wheel bow
  c.ring(12, 6.5, 6, 4.4, 'iron', 0.2);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; c.p(12 + Math.cos(a) * 6.6 - 0.5, 6.5 + Math.sin(a) * 6.6 - 0.5, i % 2 ? 'iron2' : 'iron1'); }
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; c.line(12, 6, Math.round(12 + Math.cos(a) * 4 - 0.5), Math.round(6.5 + Math.sin(a) * 4 - 0.5), 'iron2'); }
  c.ball(12, 6.5, 1.4, 1.4, 'silver', 0.3);
  // shaft
  c.cyl(11, 12, 3, 10, 'iron'); c.rect(10, 13, 5, 1, 'iron0'); c.rect(10, 14, 5, 1, 'iron3');
  // bit with notches
  c.rect(14, 17, 5, 5, (x, y) => (y === 17 ? 'iron0' : x === 18 ? 'iron3' : 'iron2'));
  c.clear(16, 19); c.clear(17, 19); c.clear(18, 19); c.clear(18, 21);
  c.outline();
  c.pts([[4, 2], [20, 1]], 'iron0');
  return c.done();
};

D.ct_star_chart = () => {
  const c = cv();
  // unrolled fish-skin chart
  c.rect(6, 3, 16, 18, (x, y) => (x === 21 || y === 20 ? 'navy3' : y === 3 ? 'navy1' : (x + y) % 9 === 0 ? 'navy1' : 'navy2'));
  // scale texture
  for (let y = 5; y < 20; y += 3) for (let x = 7 + (y % 2) * 2; x < 21; x += 4) c.p(x, y, 'navy1');
  // stars and a constellation
  const S = [[9, 6], [13, 8], [17, 6], [19, 11], [15, 13], [11, 16], [18, 17]];
  for (let i = 0; i + 1 < S.length; i++) c.line(S[i][0], S[i][1], S[i + 1][0], S[i + 1][1], 'blue2');
  for (const [x, y] of S) c.p(x, y, 'white');
  c.pts([[8, 12], [20, 4], [14, 19], [10, 10]], 'blue0');
  c.pts([[17, 5], [16, 6], [18, 6], [17, 7]], 'gold0');
  // the roll
  c.cyl(2, 2, 5, 20, 'teal');
  c.rect(2, 2, 5, 1, 'teal0'); c.rect(2, 21, 5, 1, 'teal3');
  c.pts([[4, 1], [4, 22]], 'wood2');
  c.outline();
  return c.done();
};

D.ct_grey_phial = () => {
  const c = cv();
  // body (round flask)
  c.ball(12, 15, 7, 7, 'grey');
  c.ell(12, 15, 6, 6, (x, y, dx, dy) => (dy < -0.35 ? 'mist' : tone('grey', lit(dx, dy) - 0.2)));
  // swirl
  c.pts([[9, 15], [10, 14], [11, 14], [12, 15], [13, 16], [14, 16], [15, 15]], 'grey0'); c.pts([[10, 18], [11, 19], [13, 19]], 'grey3');
  // glass highlight
  c.pts([[8, 12], [8, 13], [9, 11]], 'white');
  // neck
  c.rect(10, 4, 4, 6, (x) => (x === 10 ? 'pearl1' : x === 13 ? 'grey2' : 'pearl2')); c.rect(9, 8, 6, 1, 'grey1');
  // black wax stopper
  c.rect(9, 1, 6, 3, (x, y) => (y === 1 ? 'black1' : x === 9 ? 'black1' : 'black2')); c.pts([[8, 3], [15, 3], [14, 4]], 'black2');
  c.pts([[10, 1]], 'black0');
  c.outline();
  return c.done();
};

D.ct_heart_stone = () => {
  const c = cv();
  c.poly([[12, 6], [15, 3], [19, 3], [22, 6], [22, 10], [12, 21], [2, 10], [2, 6], [5, 3], [9, 3]], (x, y) => {
    // facets
    if (y < 7) return x < 7 ? 'red0' : x < 12 ? 'red1' : x < 17 ? 'red0' : 'red1';
    if (y < 12) return x < 12 ? (x < 6 ? 'red1' : 'red2') : x < 18 ? 'red1' : 'red2';
    return x < 12 ? 'red2' : 'red3';
  });
  c.line(12, 6, 12, 20, 'red3'); c.line(2, 7, 22, 7, 'red2');
  c.pts([[5, 4], [6, 4], [4, 5]], 'rose0'); c.p(15, 4, 'white'); c.p(5, 5, 'white');
  c.outline();
  // pulse
  for (const [x, y] of [[1, 3], [0, 8], [23, 3], [23, 9], [12, 23], [6, 17], [18, 17]]) c.p(x, y, 'redglow');
  return c.done();
};

D.ct_lamp_of_ages = () => {
  const c = cv();
  // body of an ancient oil lamp
  c.poly([[3, 15], [6, 12], [14, 11], [17, 12], [21, 11], [20, 14], [16, 17], [7, 18]], (x, y) => { const v = lit((x - 12) / 10, (y - 14) / 4); return tone('gold', v); });
  c.ell(10, 12, 5, 1.3, (x, y, dx) => (dx < -0.3 ? 'gold2' : 'gold3'));
  // engraved band
  for (let x = 5; x <= 18; x += 2) c.p(x, 15 + (x % 4 ? 0 : 1), 'gold3');
  // foot
  c.rect(8, 18, 8, 2, (x, y) => (y === 19 ? 'gold3' : x < 10 ? 'gold1' : 'gold2'));
  // handle loop
  c.ring(3.5, 12, 3, 1.6, 'gold', -0.2);
  // flame at the spout
  c.pts([[20, 2], [19, 3], [20, 3], [19, 4], [20, 4], [21, 4], [18, 5], [19, 5], [20, 5], [21, 5], [18, 6], [19, 6], [20, 6], [21, 6], [19, 7], [20, 7], [21, 7], [20, 8], [20, 9], [20, 10]], 'flame1');
  c.pts([[20, 4], [19, 5], [20, 5], [19, 6], [20, 6], [20, 7]], 'flame0'); c.pts([[21, 6], [21, 7], [21, 5]], 'flame2');
  c.outline();
  c.halo(19.5, 6, 4.5, 6.5);
  return c.done();
};

// ---------- seals ----------
const EMB = {
  first_light: ['....x....', '...xx....', '...xxx...', '..xxxx...', '..xx.xx..', '..x...x..', '...xxx...', '.........', '.........'],
  cornerstone: ['.........', '.xxxxxxx.', '.x..x..x.', '.xxxxxxx.', '.x.x..xx.', '.xxxxxxx.', '.........', '.........', '.........'],
  clean_sweep: ['.......x.', '......x..', '.....x...', '....x....', '..xxx....', '.xxxx....', 'xxxx.....', 'x.x......', '.........'],
  walking_backward: ['...xxxx..', '..x....x.', '.x......x', 'xxx.....x', '.x......x', '.......x.', '....xxx..', '.........', '.........'],
  it_stayed: ['...xxx...', '...x.x...', '....x....', '.xxxxxxx.', '....x....', 'x...x...x', '.x..x..x.', '..xxxxx..', '.........'],
  week_later: ['.xxxxxxx.', '.xxxxxxx.', '......xx.', '.....xx..', '....xx...', '....xx...', '....xx...', '.........', '.........'],
  rekindled: ['....x....', '...xx....', '...x.....', '.xxxxxx..', '.x.xx.x..', '.x....x..', '..xxxx...', '...xx....', '..xxxx...'],
  steady_flame: ['....x....', '...xxx...', '...xxx...', '....x....', '.........', '...xxx...', '...xxx...', '...xxx...', '..xxxxx..'],
  honest_ledger: ['xxxxxxx..', 'x.....xx.', 'x....x.x.', 'xx..x..x.', 'x.xx...x.', 'x......x.', 'xxxxxxxx.', '.........', '.........'],
  sharper: ['....x....', '...xxx...', 'xxxxxxxx.', '.xxxxxx..', '..x..x...', '.x....x..', '.........', '.........', '.........'],
  quay_restored: ['...xxx...', '..x.x.x..', '...xxx...', '....x....', '....x....', '....x....', '....x....', '...xxx...', '..xxxxx..'],
  face_reader: ['..xxxxx..', '.x.....x.', 'x..x.x..x', 'x.......x', 'x.x...x.x', '.x.xxx.x.', '..xxxxx..', '.........', '.........'],
  number_smith: ['......x..', '.x...x.x.', '.........', 'xxxxxxxx.', '..xxxxxx.', '....xx...', '...xxxx..', '..xxxxxx.', '.........'],
  safe_keeping: ['...xxx...', '..x...x..', '..x...x..', '.xxxxxxx.', '.xxx.xxx.', '.xxx.xxx.', '.xxxxxxx.', '.........', '.........'],
};
const SEAL_STYLE = {
  first_light: ['amber', 'red'], cornerstone: ['green', 'parch'], clean_sweep: ['blue', 'parch'], walking_backward: ['violet', 'gold'],
  it_stayed: ['blue', 'gold'], week_later: ['green', 'red'], rekindled: ['red', 'parch'], steady_flame: ['amber', 'blue'],
  honest_ledger: ['leather', 'parch'], sharper: ['cloth', 'blue'], quay_restored: ['gold', 'blue'], face_reader: ['rose', 'parch'],
  number_smith: ['iron', 'red'], safe_keeping: ['teal', 'parch'],
};
function seal(id) {
  const [wax, rib] = SEAL_STYLE[id];
  const c = cv();
  const r = prng(`seal${id}`); const ph = r() * 6;
  // ribbon tails
  c.poly([[8, 14], [11, 14], [6, 24], [3, 24]], (x, y) => `${rib}${x * 2 + y < 31 ? 1 : 2}`);
  c.poly([[13, 14], [16, 14], [21, 24], [18, 24]], (x, y) => `${rib}${x * 2 - y < 18 ? 2 : 3}`);
  c.clear(4, 23); c.clear(19, 23);
  // irregular wax blob
  for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) {
    const dx = x + 0.5 - 12, dy = y + 0.5 - 10.5; const a = Math.atan2(dy, dx); const R = 8.8 + 0.7 * Math.sin(5 * a + ph) + 0.35 * Math.sin(9 * a + ph * 2);
    const d = Math.hypot(dx, dy);
    if (d <= R) c.p(x, y, tone(wax, lit(dx / R, dy / R, -0.05)));
  }
  // pressed rim
  for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) {
    const dx = x + 0.5 - 12, dy = y + 0.5 - 10.5; const d = Math.hypot(dx, dy);
    if (d > 5.9 && d < 6.9) c.p(x, y, dx + dy < 0 ? `${wax}3` : `${wax}0`);
    else if (d <= 5.9) c.p(x, y, `${wax}1`);
  }
  // emblem, pressed in: dark with a lit lower-right edge
  const E = EMB[id];
  const rows = E.filter((row) => row.includes('x')).length;
  const ox = 8, oy = 6 + Math.floor((8 - rows) / 2) - (rows >= 8 ? 0 : 0);
  E.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === 'x') c.p(ox + i, oy + j, `${wax}3`); });
  E.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === 'x' && !(E[j + 1]?.[i + 1] === 'x')) { if (!c.is(ox + i + 1, oy + j + 1, `${wax}3`)) c.p(ox + i + 1, oy + j + 1, `${wax}0`); } });
  c.outline();
  return c.done();
}
// v0.6 mid-year seals
EMB.month_holder = ['.xxxxxxx.', '.x.....x.', '.xxxxxxx.', '.x.x.x.x.', '.xxxxxxx.', '.x.x.x.x.', '.xxxxxxx.', '.........', '.........'];
EMB.long_memory = ['...xxx...', '..x...x..', '.x..x..x.', '.x..xx.x.', '.x.....x.', '..x...x..', '...xxx...', '.........', '.........'];
EMB.midsummer = ['....x....', '.x..x..x.', '..xxxxx..', '.xxx.xxx.', '..xxxxx..', '.x..x..x.', '....x....', '.........', '.........'];
SEAL_STYLE.month_holder = ['blue', 'parch'];
SEAL_STYLE.long_memory = ['iron', 'gold'];
SEAL_STYLE.midsummer = ['amber', 'gold'];
// v0.9 late-year seals
EMB.whole_city = ['....x....', '...xxx...', '.x.x.x.x.', 'xxxxxxxxx', 'x.xx.xx.x', 'xxxxxxxxx', '.........', '.........', '.........'];
EMB.half_year = ['...xxx...', '..xxx.x..', '.xxxx..x.', '.xxxx..x.', '.xxxx..x.', '..xxx.x..', '...xxx...', '.........', '.........'];
EMB.long_road = ['.......xx', '......xx.', '....xxx..', '...xx....', '..xxx....', '.xx......', 'xx.......', '.........', '.........'];
EMB.keepers_year = ['....x....', '...xxx...', '..x...x..', '..x.x.x..', '..x...x..', '...xxx...', '..xxxxx..', '.........', '.........'];
SEAL_STYLE.whole_city = ['teal', 'gold'];
SEAL_STYLE.half_year = ['violet', 'parch'];
SEAL_STYLE.long_road = ['green', 'gold'];
SEAL_STYLE.keepers_year = ['gold', 'red'];
for (const id of Object.keys(EMB)) D[`seal_${id}`] = () => seal(id);

// v0.9.1 icons traced from local image-model pictures (owner decision, Nov 1 2026)
for (const [id, s] of Object.entries(TRACED_ICONS)) if (!id.startsWith('boss_')) D[id] = () => s;
for (const [id, s] of Object.entries(TRIAL_ICONS)) D[id] = () => s;

// ---------- build ----------
export const ICONS = Object.fromEntries(Object.entries(D).map(([id, fn]) => [id, fn()]));

// ---------- rarity frames (28x28) ----------
const FRAME = {
  common: { edge: ['#8a93a8', '#59627a', '#3a4256'], bg: ['#1c2434', '#161d2b'] },
  rare: { edge: ['#bfe6da', '#7fb3a6', '#3f6f66'], bg: ['#17282a', '#132022'] },
  epic: { edge: ['#d0b0ec', '#9a74c4', '#5a3a7a'], bg: ['#221a33', '#1a1428'] },
  legendary: { edge: ['#fff2c0', '#f0c75e', '#a06a24'], bg: ['#2c2414', '#211a0f'] },
};
const frameCache = {};
export function rarityFrame(rarity = 'common') {
  if (frameCache[rarity]) return frameCache[rarity];
  const f = FRAME[rarity] || FRAME.common;
  const pal = { o: '#0b0e16', a: f.edge[0], b: f.edge[1], c: f.edge[2], d: f.bg[0], e: f.bg[1], g: '#ffffff' };
  const W = 28;
  const g = Array.from({ length: W }, () => Array(W).fill('.'));
  const corner = (x, y) => { const cx = x < 2 ? 2 - x : x > W - 3 ? x - (W - 3) : 0; const cy = y < 2 ? 2 - y : y > W - 3 ? y - (W - 3) : 0; return cx + cy; };
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const k = corner(x, y);
    if (k > 2) continue;
    const edge = x === 0 || y === 0 || x === W - 1 || y === W - 1 || k === 2;
    const inner = !edge && (x === 1 || y === 1 || x === W - 2 || y === W - 2 || k === 1);
    if (edge) g[y][x] = 'o';
    else if (inner) g[y][x] = x === 1 || y === 1 ? 'b' : 'c';
    else {
      const d = Math.hypot(x - 13.5, y - 12) / 15;
      g[y][x] = d < 0.62 || ((x + y) % 2 === 0 && d < 0.8) ? 'd' : 'e';
    }
  }
  // bevel highlight
  for (let i = 3; i < W - 3; i++) { g[1][i] = 'a'; }
  for (let i = 3; i < W - 3; i++) g[i][1] = i < 10 ? 'a' : 'b';
  if (rarity === 'rare' || rarity === 'epic' || rarity === 'legendary') {
    for (const [x, y] of [[1, 1], [W - 2, 1], [1, W - 2], [W - 2, W - 2]]) g[y][x] = 'b';
  }
  if (rarity === 'epic' || rarity === 'legendary') {
    for (const [x, y] of [[2, 2], [W - 3, 2], [2, W - 3], [W - 3, W - 3]]) g[y][x] = 'a';
  }
  if (rarity === 'legendary') {
    // corner flourishes and a midpoint stud on each side
    for (const [x, y] of [[3, 2], [2, 3], [W - 4, 2], [W - 3, 3], [3, W - 3], [2, W - 4], [W - 4, W - 3], [W - 3, W - 4]]) g[y][x] = 'b';
    for (const [x, y] of [[13, 0], [14, 0], [13, W - 1], [14, W - 1], [0, 13], [0, 14], [W - 1, 13], [W - 1, 14]]) g[y][x] = 'b';
    g[2][2] = 'g';
  }
  const s = { w: W, h: W, pal, px: g.map((r) => r.join('')) };
  frameCache[rarity] = s;
  return s;
}
