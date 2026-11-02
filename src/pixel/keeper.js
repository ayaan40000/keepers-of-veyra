// v0.10 paper doll and Forgetting sprites, drawn in code (raw sprites from makeBuffer). Pure: no DOM.
import { makeBuffer, PAL } from './raster.js';
import { SKILLS, MODULES } from '../data/curriculum.js';

const shade = (hex, k) => {
  const h = hex.replace('#', '');
  const c = [0, 2, 4].map((i) => Math.max(0, Math.min(255, Math.round(parseInt(h.slice(i, i + 2), 16) * k))));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};
const RARE = { common: '#b8c2d6', rare: '#7fb3a6', epic: '#b48ad6', legendary: '#f0c75e' };
export const DOLL_W = 32, DOLL_H = 44;

// spec: { gates: ['M1', ...], lantern: '#flame', cloak: '#color', tool: look|null, charm: rarity|null }
// Each passed gate stitches a patch of trim onto the hem, in that district's skill colour.
// Gates 3, 6, 9 and 12 add a clasp, a shoulder pin, a lantern halo and a gold lining.
export function keeperSprite(spec = {}) {
  const gates = spec.gates || [];
  const n = gates.length;
  const cloak = spec.cloak || '#3e4e6a', dark = shade(cloak, 0.6), light = shade(cloak, 1.3);
  const b = makeBuffer(DOLL_W, DOLL_H);
  // boots
  b.rect(11, 40, 4, 3, '#2a2030'); b.rect(17, 40, 4, 3, '#2a2030');
  // cloak body, widening toward the hem
  for (let y = 15; y <= 40; y++) {
    const half = 5 + Math.round((y - 15) * 0.32);
    for (let x = 16 - half; x < 16 + half; x++) b.set(x, y, x < 16 - half + 2 ? light : x >= 16 + half - 3 ? dark : cloak);
  }
  // front opening shows a dark tunic
  b.rect(15, 20, 2, 20, '#241c2c');
  // hood and face shadow
  b.ellipse(16, 10, 8, 9, cloak);
  b.ellipse(16, 11, 5.5, 6, '#150f1c');
  b.set(14, 11, '#ffe9a8'); b.set(18, 11, '#ffe9a8'); // two soft eyes
  b.rect(12, 6, 8, 1, light);
  // gold lining at gate 12
  if (n >= 12) { for (let y = 15; y <= 40; y++) { b.set(14, y, '#f0c75e'); b.set(17, y, '#f0c75e'); } }
  // hem trim: one 2px patch per gate
  gates.slice(0, 12).forEach((g, i) => {
    const mod = MODULES.find((m) => m.id === g);
    const col = mod ? SKILLS[mod.skill].color : '#e8b04b';
    const x0 = 6 + i * 2 + (i >= 6 ? 0 : 0);
    b.rect(x0, 38, 2, 2, col);
  });
  if (n >= 3) { b.rect(15, 15, 2, 2, '#f0c75e'); }                     // clasp
  if (n >= 6) { b.rect(9, 17, 2, 2, '#e8dcc0'); b.set(9, 17, '#fff'); }  // shoulder pin
  // lantern in the left hand (viewer's left)
  const fl = spec.lantern || '#ffd98a';
  b.line(6, 24, 6, 28, '#6a5a3a');
  b.rect(4, 28, 5, 6, '#4a3a2a'); b.rect(5, 29, 3, 4, fl); b.set(6, 30, '#ffffff');
  b.rect(5, 27, 3, 1, '#8a6a2a');
  // sleeve reaching the lantern
  b.rect(7, 22, 3, 3, dark);
  // charm at the chest
  if (spec.charm) { const c = RARE[spec.charm] || RARE.common; b.set(13, 21, c); b.set(12, 22, c); b.set(14, 22, c); b.set(13, 23, c); b.set(13, 22, '#fff8e0'); }
  // tool at the belt (viewer's right)
  const T = spec.tool;
  if (T === 'scroll') { b.rect(22, 27, 3, 8, '#efe6d2'); b.rect(22, 27, 3, 1, '#c8b88a'); b.rect(22, 34, 3, 1, '#c8b88a'); }
  else if (T === 'map') { b.rect(21, 28, 5, 6, '#7fb3a6'); b.line(22, 29, 24, 33, '#23423d'); b.set(24, 29, '#e8b04b'); }
  else if (T === 'card') { b.rect(22, 28, 4, 5, '#fbf4e2'); b.rect(22, 28, 4, 1, '#d8c9a6'); }
  else if (T === 'chalk') { b.rect(22, 29, 2, 5, '#e8eef0'); b.rect(24, 30, 2, 4, '#dfe6ea'); }
  else if (T === 'trimmer') { b.line(22, 28, 25, 33, '#9aa3b8'); b.rect(24, 32, 2, 3, '#6a3522'); }
  else if (T === 'pouch') { b.ellipse(23, 31, 3, 3.5, '#9a5636'); b.rect(21, 28, 5, 1, '#6a3522'); }
  b.outline('#0f0a14');
  // lantern halo from gate 9 (dithered glow on empty pixels)
  if (n >= 9) for (let y = 20; y < 40; y++) for (let x = 0; x < 14; x++) if (!b.get(x, y)) { const d = Math.hypot(x - 6.5, y - 31); if (d < 7 && (x + y) % 2 === 0) b.set(x, y, `${fl}44`); }
  return b.toSprite();
}

// ---------- Forgetting enemies: soft grey shapes, one silhouette per skill ----------
export const FORGET_W = 36, FORGET_H = 36;
export function forgettingSprite(skill = 'imagery', mood = 'idle') {
  const accent = SKILLS[skill]?.color || '#e8b04b';
  const b = makeBuffer(FORGET_W, FORGET_H);
  const hurt = mood === 'hurt', fade = mood === 'fade';
  const body = hurt ? '#e8eef6' : fade ? '#a9b4c6' : PAL.tide;
  const mid = hurt ? '#c4cee0' : PAL.tide2, low = hurt ? '#9aa8c4' : '#56648a';
  const eye = (x, y) => { b.rect(x, y, 2, 3, '#1a2036'); b.set(x, y, '#ffffff'); };
  const blob = (cx, cy, rx, ry) => b.ellipse(cx, cy, rx, ry, (x, y, dx, dy) => (dy > 0.45 ? low : dx < -0.4 || dy < -0.5 ? body : mid));
  const wisp = () => { for (let x = 6; x < 30; x += 4) b.rect(x, 31 + ((x >> 2) % 2), 3, 3, mid); };
  if (skill === 'imagery') {                     // Smudge: a blur holding a faded picture frame
    blob(18, 17, 12, 11); wisp(); eye(13, 14); eye(21, 14);
    b.rect(23, 20, 9, 8, accent); b.rect(24, 21, 7, 6, '#2a3350'); b.set(27, 24, accent); b.set(28, 23, accent);
  } else if (skill === 'linking') {              // Tangle: two linked loops of thread
    b.ellipse(12, 17, 9, 9, mid); b.ellipse(24, 17, 9, 9, body);
    blob(18, 20, 10, 9); wisp(); eye(13, 17); eye(21, 17);
    for (let i = 0; i < 18; i++) b.set(8 + i * 1.1, 8 + Math.sin(i / 2) * 2, accent);
  } else if (skill === 'palace') {               // Hollow: an arch-shaped body with a doorway
    b.rect(8, 8, 20, 24, mid); b.ellipse(18, 9, 10, 8, body); b.rect(8, 9, 2, 23, body); b.rect(26, 9, 2, 23, low);
    b.rect(14, 16, 8, 16, '#1a2036'); b.ellipse(18, 16, 4, 3, '#1a2036');
    eye(15, 20); eye(19, 20); wisp(); b.rect(14, 8, 8, 1, accent);
  } else if (skill === 'faces') {                // Blank: a smooth pale mask, no features
    blob(18, 16, 11, 13); wisp(); b.ellipse(18, 16, 8, 10, '#d9dfec');
    b.rect(14, 15, 2, 1, '#8a93b0'); b.rect(20, 15, 2, 1, '#8a93b0'); b.rect(15, 22, 6, 1, '#b4bcd0'); b.set(18, 8, accent);
  } else if (skill === 'numbers') {              // Static: a drift of tiny digits
    blob(18, 17, 12, 11); wisp(); eye(13, 14); eye(21, 14);
    for (let i = 0; i < 14; i++) { const x = 6 + ((i * 7) % 24), y = 4 + ((i * 11) % 26); if (b.get(x, y)) continue; b.rect(x, y, 1, 3, accent); if (i % 2) b.rect(x + 1, y, 1, 1, accent); }
  } else if (skill === 'vocab') {                // Murmur: a speech-bubble shape
    b.rect(5, 6, 26, 18, body); b.rect(5, 6, 26, 2, '#e8eef6'); b.rect(5, 22, 26, 2, low);
    for (let i = 0; i < 5; i++) b.rect(11 + i, 24 + i, 6 - i * 1, 1, mid);
    eye(12, 11); eye(21, 11); for (let i = 0; i < 3; i++) b.rect(12 + i * 4, 18, 2, 2, accent);
  } else {                                       // Dustleaf: a loose book with fluttering pages
    b.rect(7, 9, 22, 20, '#3a4566'); b.rect(9, 10, 18, 18, '#e8dcc0'); b.rect(9, 10, 18, 2, '#fffaf0'); b.rect(18, 10, 1, 18, '#bfae8c');
    eye(12, 17); eye(21, 17); for (let i = 0; i < 3; i++) b.rect(11 + i * 2, 24, 1 + (i % 2), 1, accent);
    b.rect(26, 5, 6, 4, '#e8dcc0'); b.rect(3, 29, 5, 3, '#d8c9a6');
  }
  b.outline('#0f1420');
  return b.toSprite();
}
