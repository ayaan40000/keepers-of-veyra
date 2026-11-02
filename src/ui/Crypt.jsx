// The Undercroft: an endless memory crypt beneath the Archive.
// All art is original and drawn in code. Scenes animate only outside the drill's study and recall phases.
import { Tip } from './Tips.jsx';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Drill from './Drill.jsx';
import { PixelCanvas, Sprite, makeBuffer, prng, reducedMotion } from '../pixel/core.js';
import { TEMPLATE_NAME } from '../data/curriculum.js';
import { CRYPT_TUNING, BANDS, TREASURES, TABLETS, bandFor } from '../data/crypt.js';
import { ensureCrypt, newCrypt, canEnter, startRun, floorSpec, applyFloorResult, climbOut, treasureById, tabletById, enterFloor, settleAbandonedFloor, isEchoFloor, isBossFloor, weekKey } from '../engine/crypt.js';
import { CRYPT_MODIFIERS, bossFor } from '../data/crypt.js';

// ======================================================================
// Pixel toolkit
// ======================================================================
const SW = 176, SH = 112;
const K = {
  void: '#06070c', iron0: '#14161d', iron1: '#22262f', iron2: '#353a46', iron3: '#565e70', iron4: '#7b8496',
  amber: '#e8b04b', amber2: '#ffd98a', white: '#fff3d1', ember: '#c46a2a', ember2: '#7e2f17',
  bone: '#d9cba8', bone2: '#a9997a', bone3: '#6b604c', wood: '#6b4423', wood2: '#8a5a30', wood3: '#432914', wood4: '#2c1a0d',
  tide: '#b8c2d6', tide2: '#8090ad', tide3: '#56648a', tide4: '#3a4566', foam: '#eef3fb', gold: '#f0c75e', gold2: '#b98a2e',
  rust: '#5a3424', water: '#0b1622', water2: '#13263a', water3: '#1d3a52', moss: '#3e5a2e', moss2: '#62803f', root: '#9a8e74', root2: '#6e6552', root3: '#c4b896',
};
const STONES = {
  stone: ['#0a0b12', '#131622', '#1c2030', '#272c40', '#353c55', '#4a536e', '#636d8a'],
  river: ['#071017', '#0d1924', '#142434', '#1c3245', '#28435a', '#3b5c75', '#557a94'],
  violet: ['#0c0912', '#15101f', '#1f182d', '#2a213e', '#382c52', '#4f406e', '#6a5890'],
  moss: ['#090d0a', '#111912', '#19241a', '#223225', '#2f4431', '#435c41', '#5d7a55'],
  tide: ['#0a0d14', '#121722', '#1b2232', '#252e44', '#333f5a', '#4a5978', '#6a7b9c'],
  void: ['#040408', '#08080f', '#0d0d17', '#141422', '#1d1d30', '#2a2a44', '#3d3d5e'],
};
const R = (x, c, X, Y, w = 1, h = 1) => { x.fillStyle = c; x.fillRect(X, Y, w, h); };
const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bay = (x, y) => (B4[((y & 3) << 2) | (x & 3)] + 0.5) / 16;
const hash2 = (x, y) => { let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const ease = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));
const hasDOM = typeof document !== 'undefined';
function offscreen(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); fn(x); return c; }
const layerCache = new Map();
function cached(key, w, h, fn) { if (!layerCache.has(key)) layerCache.set(key, offscreen(w, h, fn)); return layerCache.get(key); }

// Brick wall with shading, speckle and the odd crack.
function bricks(x, X0, Y0, W, H, st, r, bw = 10, bh = 5, base = 2) {
  R(x, st[0], X0, Y0, W, H);
  for (let row = 0, y = Y0; y < Y0 + H; row++, y += bh) {
    const off = row % 2 ? bw >> 1 : 0;
    for (let bx = X0 - off; bx < X0 + W; bx += bw) {
      const v = r();
      const sh = Math.max(1, Math.min(st.length - 2, base + (v < 0.18 ? -1 : v > 0.82 ? 1 : 0)));
      const x0 = Math.max(bx, X0), x1 = Math.min(bx + bw - 1, X0 + W), y1 = Math.min(y + bh - 1, Y0 + H);
      if (x1 <= x0) continue;
      R(x, st[sh], x0, y, x1 - x0, y1 - y);
      R(x, st[sh + 1], x0, y, x1 - x0, 1);
      R(x, st[sh - 1], x0, y1 - 1, x1 - x0, 1);
      for (let k = 0; k < 2; k++) if (r() < 0.55) R(x, st[sh - 1], x0 + Math.floor(r() * (x1 - x0)), y + 1 + Math.floor(r() * Math.max(1, bh - 2)));
      if (r() < 0.06) { let cx = x0 + 2 + Math.floor(r() * (x1 - x0 - 3)); for (let j = y; j < y1; j++) { R(x, st[0], cx, j); cx += r() < 0.5 ? 0 : r() < 0.5 ? 1 : -1; } }
    }
  }
}

// Lighting: a warm tint pass then a dithered darkness pass, both quantised with a Bayer matrix.
const lightBufs = new Map();
function lightPass(ctx, W, H, lights, ambient = 0.1, maxDark = 0.92) {
  const key = `${W}x${H}`;
  let e = lightBufs.get(key);
  if (!e) {
    const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); return { c, x, img: x.createImageData(W, H) }; };
    e = { tint: mk(), dark: mk() }; lightBufs.set(key, e);
  }
  const td = e.tint.img.data, dd = e.dark.img.data;
  const n = lights.length;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let L = ambient, warm = 0, cool = 0;
    for (let k = 0; k < n; k++) {
      const l = lights[k];
      const dx = (x - l.x) * (l.sx || 1), dy = (y - l.y) * (l.sy || 1), d2 = dx * dx + dy * dy;
      if (d2 >= l.r * l.r) continue;
      const f = 1 - Math.sqrt(d2) / l.r, v = f * f * l.i;
      L += v; if (l.cool) cool += v; else warm += v;
    }
    const b = bay(x, y), i = (y * W + x) * 4;
    const dark = Math.min(maxDark, Math.max(0, 1 - L));
    const q = Math.min(maxDark, Math.floor(dark * 5 + b) / 5);
    dd[i] = 6; dd[i + 1] = 7; dd[i + 2] = 12; dd[i + 3] = q * 255;
    const tw = Math.min(1, warm), tc = Math.min(1, cool);
    const lv = Math.floor(Math.max(tw, tc) * 3 + b) / 3;
    if (lv > 0) { if (tc > tw) { td[i] = 190; td[i + 1] = 205; td[i + 2] = 230; } else { td[i] = 255; td[i + 1] = 178; td[i + 2] = 80; } td[i + 3] = lv * 0.2 * 255; } else td[i + 3] = 0;
  }
  e.tint.x.putImageData(e.tint.img, 0, 0); e.dark.x.putImageData(e.dark.img, 0, 0);
  ctx.drawImage(e.tint.c, 0, 0); ctx.drawImage(e.dark.c, 0, 0);
}

function flame(x, cx, by, t, ph = 0, s = 1) {
  const h = Math.max(3, Math.round((8 + Math.sin(t * 9 + ph) * 1.3 + Math.sin(t * 23 + ph * 2) * 0.8) * s));
  for (let j = 0; j < h; j++) {
    const k = j / h;
    const w = Math.max(0, Math.round(Math.pow(1 - k, 0.75) * 2.6 * s));
    const sway = Math.round(Math.sin(t * 7 + j * 0.5 + ph) * k * 1.7);
    for (let i = -w; i <= w; i++) {
      const e = w ? Math.abs(i) / (w + 0.5) : 0;
      const heat = (1 - k) * (1 - e * 0.9);
      const c = heat > 0.62 ? K.white : heat > 0.42 ? K.amber2 : heat > 0.24 ? K.amber : heat > 0.1 ? K.ember : K.ember2;
      R(x, c, cx + i + sway, by - j);
    }
  }
  for (let i = 0; i < 3; i++) { // embers
    const p = (t * 0.7 + i * 0.37 + ph * 0.13) % 1;
    if (p > 0.85) continue;
    R(x, p < 0.4 ? K.amber2 : K.ember, Math.round(cx + Math.sin(i * 3.1 + t * 2 + ph) * 3), Math.round(by - h - 2 - p * 14));
  }
}

function torchSconce(x, cx, y) {
  R(x, K.iron1, cx - 1, y + 3, 3, 6); R(x, K.iron2, cx, y + 3, 1, 6); // bracket
  R(x, K.iron2, cx - 4, y + 1, 9, 2); R(x, K.iron3, cx - 4, y + 1, 9, 1); R(x, K.iron1, cx - 3, y + 3, 7, 1);
  R(x, K.wood3, cx - 1, y - 3, 3, 4); R(x, K.wood, cx, y - 3, 1, 4);
}

function mist(x, t, y0, h, dens = 0.55, col = '184,194,214', speed = 1) {
  for (let y = y0; y < y0 + h; y++) {
    const fall = (y - y0) / h;
    for (let X = 0; X < SW; X++) {
      const n = vnoise(X * 0.06 + t * 0.35 * speed, y * 0.22 - t * 0.06) * 0.7 + vnoise(X * 0.16 - t * 0.55 * speed, y * 0.4 + 9) * 0.3;
      const v = n * dens * (0.25 + fall * 1.1);
      if (v > 0.32 + bay(X, y) * 0.5) { x.fillStyle = `rgba(${col},${v > 0.62 ? 0.42 : 0.24})`; x.fillRect(X, y, 1, 1); }
    }
  }
}

function skull(x, X, Y, lit = 0) {
  const b = lit ? K.bone : K.bone2, s = lit ? K.bone2 : K.bone3;
  R(x, b, X + 1, Y, 4, 1); R(x, b, X, Y + 1, 6, 2); R(x, s, X, Y + 3, 6, 1); R(x, b, X + 1, Y + 4, 4, 1);
  R(x, K.void, X + 1, Y + 2, 1, 2); R(x, K.void, X + 4, Y + 2, 1, 2); R(x, K.bone3, X + 2, Y + 4); R(x, K.bone3, X + 3, Y + 4);
  R(x, '#ffffff22', X + 1, Y + 1, 2, 1);
}

// The carved mark of Ysolde: a lamp inside a closed hand.
function handMark(x, X, Y, c = '#7a5a26', c2 = '#3a2a12') {
  const px = ['..c..', '.ccc.', 'c.c.c', 'ccccc', '.ccc.'];
  px.forEach((row, j) => { for (let i = 0; i < 5; i++) if (row[i] === 'c') { R(x, c2, X + i, Y + j + 1); R(x, c, X + i, Y + j); } });
}

// ======================================================================
// Scenes
// ======================================================================
const CX = 88;

function entranceBase() {
  return cached('entrance', SW, SH, (x) => {
    const r = prng('undercroft-entrance');
    const st = STONES.stone;
    bricks(x, 0, 0, SW, SH, st, r);
    // the Archive's floor above: great pale slabs
    R(x, '#2e3549', 0, 0, SW, 9);
    for (let sx = 0; sx < SW; sx += 22) { R(x, '#454f68', sx, 0, 21, 1); R(x, '#1a1e2b', sx + 21, 0, 1, 9); R(x, '#232838', sx, 7, 21, 1); }
    R(x, '#07080d', 0, 9, SW, 1); R(x, '#0f111a', 0, 10, SW, 1);
    let cx = 104; for (let y = 0; y < 10; y++) { R(x, '#07080d', cx, y); R(x, '#8e9ab8', cx + 1, y); cx += r() < 0.5 ? 1 : 0; } // the crack
    // hanging chains
    for (const chx of [56, 120]) for (let y = 11, k = 0; y < 34 + (chx % 7); y += 3, k++) {
      if (k % 2) { R(x, K.iron3, chx, y, 1, 3); } else { R(x, K.iron2, chx - 1, y, 3, 3); R(x, K.void, chx, y + 1); R(x, K.iron3, chx - 1, y, 1, 1); }
    }
    // arch ring and jambs
    const rin = 22, rout = 29, spring = 46, bottom = 96;
    for (let y = 10; y < bottom; y++) for (let X = CX - rout - 1; X <= CX + rout + 1; X++) {
      const dx = X - CX + 0.5, dy = y - spring + 0.5, d = Math.hypot(dx, dy);
      const inDoor = y >= spring ? Math.abs(dx) <= rin : d <= rin;
      const inRing = y < spring ? d > rin && d <= rout : Math.abs(dx) > rin && Math.abs(dx) <= rout;
      if (inRing) {
        let seam, edge;
        if (y < spring) { const a = Math.atan2(-dy, dx); seam = Math.abs(((a / Math.PI) * 9) % 1) < 0.07; edge = d > rout - 1 ? 'o' : d < rin + 1.2 ? 'i' : ''; }
        else { seam = (y - spring) % 8 === 7; edge = Math.abs(dx) > rout - 1 ? 'o' : Math.abs(dx) < rin + 1.2 ? 'i' : ''; }
        R(x, seam ? st[1] : edge === 'o' ? st[6] : edge === 'i' ? st[2] : (hash2(X, y) < 0.15 ? st[4] : st[5]), X, y);
      } else if (inDoor) {
        const col = Math.floor((X - (CX - rin)) / 6);
        const lx = (X - (CX - rin)) % 6;
        const plank = Math.abs(X - CX) < 1 ? K.void : lx === 0 ? '#0e1016' : lx === 1 ? (col % 2 ? '#3a404e' : '#333845') : col % 2 ? '#2b303c' : '#252a35';
        R(x, plank, X, y);
        if (hash2(X * 3, y) < 0.06) R(x, '#3f4554', X, y);
        if (hash2(X, y * 5) < 0.02) R(x, K.rust || '#5a3424', X, y);
      }
    }
    // door bands with rivets
    for (const by of [56, 72, 88]) {
      const half = rin; R(x, K.iron3, CX - half, by, half * 2 + 1, 3); R(x, K.iron4, CX - half, by, half * 2 + 1, 1); R(x, K.iron0, CX - half, by + 3, half * 2 + 1, 1);
      for (let rx = CX - half + 3; rx < CX + half; rx += 6) { R(x, '#a3abbc', rx, by + 1); R(x, K.iron1, rx, by + 2); }
    }
    for (let a = 0; a <= 180; a += 2) { const ra = (a * Math.PI) / 180; R(x, K.iron2, Math.round(CX + Math.cos(ra) * (rin - 3)), Math.round(spring - Math.sin(ra) * (rin - 3))); }
    for (let a = 15; a < 180; a += 30) { const ra = (a * Math.PI) / 180; R(x, K.iron4, Math.round(CX + Math.cos(ra) * (rin - 3)), Math.round(spring - Math.sin(ra) * (rin - 3))); }
    // knockers
    for (const kx of [CX - 8, CX + 8]) { R(x, K.iron3, kx - 1, 62, 3, 3); R(x, K.iron0, kx, 63); for (let a = 0; a < 360; a += 20) { const ra = (a * Math.PI) / 180; R(x, a > 180 ? K.iron4 : K.iron3, Math.round(kx + Math.cos(ra) * 3), Math.round(68 + Math.sin(ra) * 3)); } }
    // keyhole plate
    R(x, K.iron3, CX - 3, 76, 7, 9); R(x, K.iron4, CX - 3, 76, 7, 1); R(x, K.iron1, CX - 3, 84, 7, 1);
    R(x, K.void, CX - 1, 78, 3, 2); R(x, K.void, CX, 80, 1, 3);
    // keystone with the hand mark
    R(x, st[5], CX - 5, 14, 11, 9); R(x, st[6], CX - 5, 14, 11, 1); R(x, st[2], CX - 5, 22, 11, 1);
    handMark(x, CX - 2, 16, '#9a7434', '#2a1e0c');
    // niches with skulls
    for (const nx of [26, 140]) {
      R(x, st[5], nx - 1, 74, 13, 1); R(x, '#05060a', nx, 75, 11, 12); R(x, st[2], nx - 1, 87, 13, 2); R(x, st[6], nx - 1, 87, 13, 1);
      for (let a = 0; a <= 180; a += 6) { const ra = (a * Math.PI) / 180; R(x, '#05060a', Math.round(nx + 5 + Math.cos(ra) * 5.5), Math.round(75 - Math.sin(ra) * 4)); }
      skull(x, nx + 2, 81, 0); R(x, K.bone3, nx + 1, 86, 3, 1); R(x, K.bone2, nx + 7, 85, 3, 1);
    }
    // sconces
    torchSconce(x, 34, 49); torchSconce(x, 142, 49);
    // steps up to the door
    const steps = [[96, 100, 36], [100, 105, 20], [105, 112, 0]];
    for (const [y0, y1, inset] of steps) {
      R(x, st[3], inset, y0, SW - inset * 2, y1 - y0); R(x, st[5], inset, y0, SW - inset * 2, 1); R(x, st[4], inset, y0 + 1, SW - inset * 2, 1);
      for (let sx = inset + ((y0 * 7) % 13); sx < SW - inset; sx += 13 + (sx % 5)) R(x, st[1], sx, y0 + 2, 1, y1 - y0 - 2);
      R(x, st[1], inset, y1 - 1, SW - inset * 2, 1);
    }
    // bones and rubble on the steps
    for (let i = 0; i < 9; i++) { const bx = Math.floor(r() * 150) + 12, byy = 106 + Math.floor(r() * 5); if (Math.abs(bx - CX) < 18) continue; R(x, i % 3 ? st[5] : K.bone2, bx, byy, i % 3 ? 2 : 3, 1); }
    skull(x, 10, 105, 0);
    // moss creeping near the floor
    for (let i = 0; i < 70; i++) { const mx = Math.floor(r() * SW), my = 86 + Math.floor(r() * 10); if (Math.abs(mx - CX) < 30) continue; R(x, r() < 0.5 ? K.moss : '#2a3d22', mx, my); }
  });
}

function drawEntrance(x, t, o = {}) {
  x.drawImage(entranceBase(), 0, 0);
  // dust in the beam from the crack
  for (let i = 0; i < 7; i++) { const p = (t * 0.06 + i * 0.143) % 1; R(x, '#c9d2e6', Math.round(106 + p * 12 + Math.sin(t + i) * 2), Math.round(12 + p * 82)); }
  mist(x, t, 86, 26, 0.85);
  const f1 = Math.sin(t * 11) * 2 + Math.sin(t * 5.3) * 1.5, f2 = Math.sin(t * 9.4 + 1) * 2 + Math.sin(t * 6.1) * 1.5;
  const lights = [
    { x: 34, y: 42, r: 60 + f1, i: 1.45 }, { x: 142, y: 42, r: 60 + f2, i: 1.45 },
    { x: CX, y: 136, r: 104, i: 0.55 },
    { x: 109, y: 34, r: 16, i: 0.45, cool: true, sx: 1.5 }, { x: 114, y: 64, r: 18, i: 0.42, cool: true, sx: 1.5 }, { x: 119, y: 96, r: 22, i: 0.5, cool: true, sy: 1.5 },
  ];
  if (o.lit) lights.push({ x: CX, y: 80, r: 18 + Math.sin(t * 3) * 2, i: 0.9 });
  lightPass(x, SW, SH, lights, 0.13);
  // the shaft of pale light from the crack (drawn after lighting, softly)
  x.fillStyle = 'rgba(190,204,232,0.10)';
  for (let y = 10; y < 97; y++) { const cx = 103 + (y - 10) * 0.18; const w = 3 + (y - 10) * 0.06; x.fillRect(Math.round(cx), y, Math.round(w), 1); }
  for (let y = 10; y < 97; y++) { const cx = 103 + (y - 10) * 0.18; const w = 3 + (y - 10) * 0.06; for (let i = -1; i <= w; i++) if (bay(Math.round(cx + i), y) < 0.12) { x.fillStyle = 'rgba(214,224,244,0.22)'; x.fillRect(Math.round(cx + i), y, 1, 1); } }
  flame(x, 34, 45, t, 0); flame(x, 142, 45, t, 1.9);
  if (o.lit) { const g = 0.5 + Math.sin(t * 3) * 0.5; R(x, g > 0.5 ? K.amber2 : K.amber, CX - 1, 78, 3, 2); R(x, K.amber, CX, 80, 1, 3); }
}

// ---- Stairwell: endless descent, scrolling diagonally. Period: 80px across, 40px down.
const STEP_W = 20, STEP_H = 10, PER = 80;
const stairTop = (xw) => 30 + Math.floor(xw / STEP_W) * STEP_H;
function stairWorld(hue) {
  const W = SW + PER, H = SH + PER / 2;
  return cached(`stair-${hue}`, W, H, (x) => {
    const r = prng(`stair-${hue}`), st = STONES[hue] || STONES.stone;
    bricks(x, 0, 0, W, H, st, r, 10, 5, 2);
    // stair mass
    for (let X = 0; X < W; X++) {
      const top = stairTop(X), local = X % STEP_W;
      for (let y = top; y < Math.min(H, top + 30); y++) {
        const dy = y - top;
        let c = dy === 0 ? st[6] : dy === 1 ? st[5] : dy < STEP_H ? st[4] : st[3];
        if (local === 0 && dy < STEP_H) c = st[2]; // riser edge
        if (dy >= STEP_H && ((y - 30) % 6 === 0 || (X + Math.floor((y - 30) / 6) * 7) % 16 === 0)) c = st[1];
        if (dy > 22) c = dy > 26 ? st[0] : st[1];
        R(x, c, X, y);
      }
      for (let y = top + 30; y < H; y++) R(x, hash2(X, y) < 0.03 ? st[1] : K.void, X, y); // the shaft below
    }
    // a carved rail along the wall
    for (let X = 0; X < W; X++) { const y = Math.round(30 + (X / STEP_W) * STEP_H - 22); R(x, st[5], X, y); R(x, st[1], X, y + 1); }
    // sconces every 40px of descent (two per period)
    for (const tx of [30, 70, 110, 150, 190, 230]) if (tx < W) torchSconce(x, tx, stairTop(tx) - 30);
    for (const sx of [12, 52, 92, 132, 172, 212]) if (sx < W - 6) skull(x, sx, stairTop(sx) - 6, 0);
  });
}
const KEEPER = {
  w: 9, h: 15,
  pal: { a: '#07080d', b: '#2a2f42', c: '#3c4460', d: '#b88a3e', e: '#1a1d2a', f: '#d9b98a' },
  px: [
    '...aaa...', '..abbba..', '.abcccba.', '.abaaaba.', '.abcfcda.', '.abbbbda.', 'abbbbbbda', 'abcbbbbda',
    'abcbbbbda', 'abcbbbbda', 'abcbbbdda', '.abbbbda.', '.abebbda.', '.aa.aaa..', '.aa..aa..',
  ],
};
function drawStair(x, t, o = {}) {
  const hue = o.hue || 'stone';
  const speed = o.static ? 0 : 14;
  const off = (t * speed) % PER;
  const ox = Math.floor(off), oy = Math.floor(off / 2);
  x.drawImage(stairWorld(hue), -ox, -oy);
  const fx = 70;
  const footY = stairTop(fx + 4 + ox) - oy;
  const bob = Math.round(Math.abs(Math.sin(t * 5)) * (o.static ? 0 : 1));
  const ky = footY - 15 - bob;
  const tmp = cached('keeper', KEEPER.w, KEEPER.h, (c) => { const b = makeBuffer(KEEPER.w, KEEPER.h); b.blit(KEEPER); c.putImageData(new ImageData(new Uint8ClampedArray(b.rgba), KEEPER.w, KEEPER.h), 0, 0); });
  x.drawImage(tmp, fx, ky);
  // lantern
  const lx = fx + 10, ly = ky + 7;
  R(x, K.iron2, lx, ly - 2, 1, 2); R(x, K.iron3, lx - 1, ly, 3, 1); R(x, K.amber2, lx - 1, ly + 1, 3, 2); R(x, K.iron3, lx - 1, ly + 3, 3, 1);
  // falling grit
  for (let i = 0; i < 6; i++) { const p = (t * 0.5 + i * 0.29) % 1; R(x, '#5a6280', Math.round(((i * 37 + 11) % SW)), Math.round(p * SH)); }
  const lights = [{ x: lx, y: ly, r: 60 + Math.sin(t * 6) * 1.5, i: 1.4 }];
  for (const tx of [30, 70, 110, 150, 190, 230]) { const sx = tx - ox, sy = stairTop(tx) - 30 - oy; if (sx > -40 && sx < SW + 40) lights.push({ x: sx, y: sy - 4, r: 42 + Math.sin(t * 9 + tx) * 2, i: 1.1, _f: [sx, sy] }); }
  lightPass(x, SW, SH, lights, 0.13, 0.88);
  R(x, K.white, lx, ly + 1, 1, 1);
  for (const l of lights) if (l._f) flame(x, l._f[0], l._f[1] - 3, t, l._f[0] * 0.1, 0.8);
}

// ---- Chamber (per depth band)
function chamberBase(band) {
  const st = STONES[band.hue] || STONES.stone;
  return cached(`chamber-${band.name}`, SW, SH, (x) => {
    const r = prng(`chamber-${band.name}`);
    bricks(x, 0, 0, SW, SH, st, r, 10, 5, 2);
    // vault rib
    for (let y = 0; y < 44; y++) for (let X = 0; X < SW; X++) {
      const d = Math.hypot((X - CX) / 1.25, (y - 46) * 1.0);
      if (d > 62 && d <= 67) R(x, d > 66 ? st[6] : d < 63 ? st[2] : ((Math.atan2(46 - y, X - CX) * 7) % 1 < 0.08 ? st[1] : st[5]), X, y);
      else if (d > 67) R(x, hash2(X, y) < 0.5 ? st[1] : st[0], X, y);
    }
    // the way down: a dark arch behind the altar
    for (let y = 36; y < 84; y++) for (let X = CX - 13; X <= CX + 13; X++) {
      const d = Math.hypot(X - CX + 0.5, Math.max(0, 50 - y)); if (d > 13) continue;
      R(x, d > 11.5 ? st[5] : '#030306', X, y);
    }
    for (let i = 0; i < 4; i++) R(x, st[2 + (i % 2)], CX - 10 + i * 2, 72 + i * 3, 20 - i * 4, 1); // steps going down inside
    // decor
    const dec = band.decor;
    if (dec === 'bones') {
      for (const sx of [34, 108]) for (let row = 0; row < 3; row++) {
        const sy = 46 + row * 12; R(x, '#05060a', sx, sy, 34, 9); R(x, st[5], sx - 1, sy + 9, 36, 1); R(x, st[2], sx - 1, sy + 10, 36, 1);
        for (let k = 0; k < 5; k++) skull(x, sx + 1 + k * 7, sy + 3, hash2(k, row + sx) < 0.3 ? 1 : 0);
      }
    } else if (dec === 'shelves') {
      for (const sx of [33, 109]) {
        R(x, K.wood4, sx, 42, 34, 44); R(x, K.wood3, sx, 42, 2, 44); R(x, K.wood3, sx + 32, 42, 2, 44);
        for (let row = 0; row < 4; row++) {
          const sy = 44 + row * 10; R(x, K.wood, sx, sy + 8, 34, 2); R(x, K.wood2, sx, sy + 8, 34, 1);
          let bx = sx + 2; while (bx < sx + 31) { const w = 2 + Math.floor(r() * 2), h = 5 + Math.floor(r() * 3); if (r() < 0.12) { bx += 3; continue; } const col = ['#4a2e24', '#3a4232', '#3d3150', '#5c4a2e', '#2e3a4a'][Math.floor(r() * 5)]; R(x, col, bx, sy + 8 - h, w, h); R(x, '#00000044', bx + w - 1, sy + 8 - h, 1, h); R(x, '#ffffff18', bx, sy + 8 - h + 1, w, 1); bx += w; }
        }
        for (let i = 0; i < 6; i++) { R(x, '#9aa3b844', sx + 2 + i, 43 + i); R(x, '#9aa3b844', sx + 31 - i, 43 + i); }
      }
    } else if (dec === 'thrones') {
      for (const tx of [34, 116]) {
        R(x, st[0], tx - 1, 38, 28, 50);
        R(x, st[3], tx, 39, 26, 48); R(x, st[5], tx, 39, 26, 1); R(x, st[4], tx, 40, 2, 46);
        for (let i = 0; i < 4; i++) R(x, st[2], tx + 5 + i * 5, 44, 2, 22);
        R(x, st[5], tx + 9, 35, 8, 4); R(x, st[6], tx + 9, 35, 8, 1); // finial
        R(x, st[5], tx - 3, 68, 32, 5); R(x, st[6], tx - 3, 68, 32, 1); R(x, st[1], tx - 3, 72, 32, 1);
        R(x, st[2], tx, 73, 26, 14); R(x, st[4], tx - 3, 60, 4, 8); R(x, st[4], tx + 25, 60, 4, 8); // arms
        const cx = tx + 8; // a crown on the seat, its name-plate blank
        R(x, K.gold2, cx, 63, 10, 5); R(x, K.gold, cx, 63, 10, 1); R(x, K.gold, cx, 59, 2, 4); R(x, K.gold, cx + 4, 58, 2, 5); R(x, K.gold, cx + 8, 59, 2, 4);
        R(x, '#fff3d1', cx + 4, 58); R(x, K.bone, cx + 3, 64, 4, 3); R(x, '#9a2e2e', cx + 1, 65); R(x, '#9a2e2e', cx + 8, 65);
      }
    } else if (dec === 'roots') {
      for (let k = 0; k < 9; k++) {
        let X = 10 + r() * 156, y = 0, w = 3; const len = 40 + r() * 50;
        for (let s = 0; s < len; s++) { const c = s % 9 < 2 ? K.root3 : K.root; R(x, K.root2, Math.round(X) + 1, Math.round(y), w, 1); R(x, c, Math.round(X), Math.round(y), Math.max(1, w - 1), 1); y += 1; X += (r() - 0.5) * 1.4; if (s > len * 0.5) w = 2; if (s > len * 0.85) w = 1; if (r() < 0.04) { let bx = X, byy = y; for (let b = 0; b < 8; b++) { R(x, K.root2, Math.round(bx), Math.round(byy)); bx += r() < 0.5 ? 1 : -1; byy += 1; } } }
      }
    } else if (dec === 'water' || dec === 'springs') {
      for (let i = 0; i < 40; i++) { const X = Math.floor(r() * SW), y = 40 + Math.floor(r() * 46); R(x, dec === 'water' ? '#2b4a60' : '#4a5978', X, y, 1, 2 + Math.floor(r() * 3)); }
    }
    // pillars
    for (const px0 of [10, 150]) {
      R(x, st[1], px0 - 1, 0, 18, 92);
      for (let X = 0; X < 16; X++) { const c = X < 2 ? st[6] : X < 5 ? st[5] : X < 11 ? st[4] : X < 14 ? st[3] : st[2]; R(x, c, px0 + X, 0, 1, 88); }
      for (let y = 6; y < 88; y += 11) R(x, st[2], px0, y, 16, 1);
      R(x, st[5], px0 - 3, 32, 22, 4); R(x, st[6], px0 - 3, 32, 22, 1); R(x, st[2], px0 - 3, 35, 22, 1);
      R(x, st[5], px0 - 3, 82, 22, 6); R(x, st[6], px0 - 3, 82, 22, 1);
      torchSconce(x, px0 + 8, 50);
    }
    // floor: perspective flagstones
    for (let y = 88; y < SH; y++) for (let X = 0; X < SW; X++) {
      const depth = (y - 84) / (SH - 84);
      const u = (X - CX) / (y - 70) * 6;
      const row = [88, 91, 95, 100, 106].filter((v) => y >= v).length;
      const seam = [88, 91, 95, 100, 106].includes(y) || Math.abs(u - Math.round(u)) < 0.06 / Math.max(0.3, depth);
      const alt = (Math.floor(u + 0.5) + row) % 2;
      R(x, seam ? st[1] : alt ? st[3] : st[4], X, y);
      if (!seam && hash2(X, y) < 0.04) R(x, st[2], X, y);
    }
    if (dec === 'water' || dec === 'springs') for (let y = 89; y < SH; y++) for (let X = 0; X < SW; X++) {
      const pool = dec === 'water' ? true : [[48, 101, 18, 4], [128, 99, 16, 3.5], [CX, 107, 26, 4]].some(([px, py, rx, ry]) => ((X - px) / rx) ** 2 + ((y - py) / ry) ** 2 <= 1);
      if (pool) R(x, dec === 'water' ? (hash2(X >> 2, y) < 0.3 ? K.water3 : (y + (X >> 3)) % 3 === 0 ? K.water2 : '#102236') : '#2c3a58', X, y);
    }
    // altar
    R(x, st[3], CX - 18, 84, 36, 6); R(x, st[5], CX - 18, 84, 36, 1); R(x, st[1], CX - 18, 89, 36, 1);
    R(x, st[3], CX - 13, 75, 26, 9); R(x, st[4], CX - 13, 75, 26, 1); R(x, st[2], CX + 9, 75, 4, 9);
    R(x, st[5], CX - 15, 72, 30, 3); R(x, st[6], CX - 15, 72, 30, 1); R(x, st[2], CX - 15, 74, 30, 1);
    handMark(x, CX - 3, 77, '#8a6a30', '#1c140a');
  });
}

function drawChamber(x, t, o = {}) {
  const band = o.band || BANDS[0];
  x.drawImage(chamberBase(band), 0, 0);
  const water = band.decor === 'water', springs = band.decor === 'springs';
  if (water) for (let y = 90; y < SH; y += 2) { for (const tx of [18, 158]) { const s2 = Math.round(Math.sin(y * 0.9 + t * 3) * 2); x.fillStyle = 'rgba(255,190,90,0.35)'; x.fillRect(tx - 2 + s2, y, 4, 1); } }
  if (water) for (let y = 90; y < SH; y += 2) { const s = Math.round(Math.sin(y * 0.7 + t * 2.4) * 2); for (const px0 of [10, 150]) { x.fillStyle = 'rgba(120,140,170,0.45)'; x.fillRect(px0 + s, y, 14, 1); x.fillStyle = 'rgba(200,215,235,0.5)'; x.fillRect(px0 + s, y, 2, 1); } x.fillStyle = 'rgba(255,200,110,0.35)'; x.fillRect(CX - 4 + s, y, 8, 1); }
  if (water) for (let i = 0; i < 3; i++) { const ph = (t * 0.5 + i * 0.33) % 1; const rr = Math.round(4 + ph * 16); x.fillStyle = `rgba(200,215,240,${0.45 * (1 - ph)})`; x.fillRect([40, 130, 96][i] - rr, 96 + i * 5, rr * 2, 1); }
  if (springs) for (const [px, py, rx] of [[48, 101, 18], [128, 99, 16], [CX, 107, 26]]) for (let i = 0; i < 4; i++) { const ph = (t * 0.6 + i * 0.25) % 1; const rr = Math.round(rx * ph); x.fillStyle = `rgba(220,230,248,${0.5 * (1 - ph)})`; x.fillRect(px - rr, py, rr * 2, 1); }
  if (!o.noOrb) {
    const oy = Math.round(60 + Math.sin(t * 2.2) * 2);
    R(x, '#3a2a12', CX - 3, 70, 7, 1);
    R(x, K.ember, CX, oy - 5, 1, 1); R(x, K.amber, CX - 1, oy - 4, 3, 1); R(x, K.amber, CX - 2, oy - 3, 5, 3); R(x, K.amber2, CX - 1, oy - 3, 2, 2); R(x, K.amber, CX - 1, oy, 3, 1); R(x, K.ember, CX, oy + 1, 1, 1); R(x, K.white, CX - 1, oy - 3, 1, 1);
  }
  if (springs || band.hue === 'river') mist(x, t, 80, 32, springs ? 0.8 : 0.5, '184,194,214', 0.7);
  const f1 = Math.sin(t * 10) * 2, f2 = Math.sin(t * 8.7 + 2) * 2;
  const lights = [{ x: 18, y: 44, r: 62 + f1, i: 1.3 }, { x: 158, y: 44, r: 62 + f2, i: 1.3 }];
  if (!o.noOrb) lights.push({ x: CX, y: 62, r: 58 + Math.sin(t * 2.2) * 2, i: 1.05 });
  if (springs) lights.push({ x: 48, y: 100, r: 26, i: 0.7, cool: true, sy: 2 }, { x: 128, y: 98, r: 24, i: 0.7, cool: true, sy: 2 }, { x: CX, y: 106, r: 32, i: 0.8, cool: true, sy: 2 });
  for (const l of o.extraLights || []) lights.push(l);
  lightPass(x, SW, SH, lights, o.ambient ?? 0.17, 0.86);
  flame(x, 18, 47, t, 0); flame(x, 158, 47, t, 2.1);
}

// ---- Chest opening (small celebration)
function drawChest(x, t, o = {}) {
  drawChamber(x, t, { band: o.band, noOrb: true, ambient: 0.08, extraLights: [{ x: CX, y: 86, r: 18 + ease((t - 0.6) / 0.6) * 40, i: 0.4 + ease((t - 0.6) / 0.6) * 1.1 }] });
  const by = 102;
  const shake = t < 0.6 ? Math.round(Math.sin(t * 60) * (t > 0.15 ? 1 : 0)) : 0;
  const open = ease((t - 0.6) / 0.35);
  const cx = CX + shake;
  // rays
  if (open > 0) {
    for (let k = 0; k < 9; k++) {
      const a = -Math.PI / 2 + (k - 4) * 0.28 + Math.sin(t * 0.8 + k) * 0.05;
      const len = 30 + open * 50;
      for (let s = 6; s < len; s++) { const X = Math.round(cx + Math.cos(a) * s), Y = Math.round(by - 14 + Math.sin(a) * s); if (bay(X, Y) < 0.55 * (1 - s / len)) { x.fillStyle = 'rgba(255,217,138,0.55)'; x.fillRect(X, Y, 1, 1); } }
    }
  }
  // body
  R(x, '#00000066', cx - 17, by, 34, 2);
  R(x, K.wood, cx - 15, by - 13, 30, 13); R(x, K.wood2, cx - 15, by - 13, 30, 1); R(x, K.wood3, cx - 15, by - 1, 30, 1);
  for (let y = by - 9; y < by; y += 4) R(x, K.wood3, cx - 15, y, 30, 1);
  for (const bx of [cx - 12, cx + 10]) { R(x, K.iron2, bx, by - 13, 2, 13); R(x, K.iron3, bx, by - 13, 1, 13); }
  R(x, K.gold2, cx - 2, by - 12, 5, 6); R(x, K.gold, cx - 2, by - 12, 5, 1); R(x, K.void, cx, by - 10, 1, 2);
  if (open <= 0) {
    const lift = t > 0.4 ? 1 : 0;
    R(x, K.wood, cx - 16, by - 20 - lift, 32, 7); R(x, K.wood2, cx - 15, by - 21 - lift, 30, 1); R(x, K.wood3, cx - 16, by - 14 - lift, 32, 1);
    for (const bx of [cx - 12, cx + 10]) { R(x, K.iron2, bx, by - 21 - lift, 2, 8); R(x, K.iron3, bx, by - 21 - lift, 1, 8); }
    if (lift) R(x, K.amber2, cx - 14, by - 13, 28, 1);
  } else {
    const lh = Math.round(4 + open * 8);
    R(x, K.wood4, cx - 15, by - 13 - lh, 30, lh); R(x, K.wood3, cx - 15, by - 13 - lh, 30, 1);
    for (const bx of [cx - 12, cx + 10]) R(x, K.iron1, bx, by - 13 - lh, 2, lh);
    R(x, K.amber2, cx - 14, by - 14, 28, 2); R(x, K.white, cx - 10, by - 14, 20, 1);
    // treasure glints
    for (let i = 0; i < 10; i++) { const p = ((t - 0.9) * 0.5 + i * 0.1) % 1; if (t < 0.9) break; const X = Math.round(cx + Math.sin(i * 2.3) * (6 + p * 14)), Y = Math.round(by - 16 - p * 40); R(x, p < 0.5 ? K.white : K.amber2, X, Y); if (p < 0.3) { R(x, K.amber, X - 1, Y); R(x, K.amber, X + 1, Y); } }
    if (o.oil) { const p = ease((t - 1.0) / 0.8); const fy = Math.round(by - 18 - p * 26); drawFlaskAt(x, cx - 4, fy, true); }
  }
}

// ---- The Tide (run over)
function drawTide(x, t, o = {}) {
  const k = ease(t / 3.2);
  drawChamber(x, t, { band: o.band, noOrb: true, ambient: 0.14 - k * 0.1, extraLights: [{ x: CX, y: 60, r: Math.max(1, 30 - k * 30), i: 0.9 * (1 - k) }] });
  const level = SH - 6 - k * 70;
  for (let X = 0; X < SW; X++) {
    const ys = level + Math.sin(X * 0.12 + t * 2.6) * 1.8 + Math.sin(X * 0.33 - t * 1.7) * 0.9;
    for (let y = Math.max(0, Math.floor(ys)); y < SH; y++) {
      const d = y - ys, b = bay(X, y);
      let c;
      if (d < 1.2) c = K.foam; else if (d < 3) c = b < 0.6 ? K.tide : K.foam; else if (d < 7) c = b < 0.5 ? K.tide2 : K.tide; else if (d < 16) c = b < 0.5 ? K.tide3 : K.tide2; else c = b < 0.5 ? K.tide4 : K.tide3;
      R(x, c, X, y);
    }
    for (let y = Math.max(0, Math.floor(ys) - 18); y < ys; y++) { const v = 1 - (ys - y) / 18; if (bay(X, y) < v * 0.6) { x.fillStyle = 'rgba(214,222,240,0.35)'; x.fillRect(X, y, 1, 1); } }
  }
  mist(x, t, 0, SH, k * 1.1, '210,218,236', 1.4);
  if (t > 3.4 || o.final) { const v = ease((t - 3.4) / 1.5); for (let y = 0; y < SH; y++) for (let X = 0; X < SW; X++) if (bay(X, y) < (o.final ? 0.35 : v * 0.35)) { x.fillStyle = 'rgba(184,194,214,0.5)'; x.fillRect(X, y, 1, 1); } }
}

// ---- Tablet alcove
const TH = 72;
function tabletBase(hue) {
  return cached(`tablet-${hue}`, SW, TH, (x) => {
    const r = prng('tablet'), st = STONES[hue] || STONES.stone;
    bricks(x, 0, 0, SW, TH, st, r);
    for (let y = 4; y < TH; y++) for (let X = CX - 30; X <= CX + 30; X++) { const d = Math.hypot(X - CX, Math.max(0, 30 - y)); if (d <= 30) R(x, d > 28 ? st[5] : '#05060a', X, y); }
    // the tablet
    for (let y = 10; y < TH - 4; y++) for (let X = CX - 20; X <= CX + 20; X++) { const d = Math.hypot(X - CX, Math.max(0, 28 - y)); if (d > 20) continue; const edge = d > 18.5 || X === CX - 20 || X === CX + 20; R(x, edge ? '#5c584b' : hash2(X, y) < 0.08 ? '#7a7566' : '#8f8a78', X, y); }
    handMark(x, CX - 2, 16, '#c89a44', '#3a2c12');
    for (let row = 0; row < 7; row++) { const y = 26 + row * 5; let X = CX - 15; while (X < CX + 14) { const w = 2 + Math.floor(r() * 4); R(x, '#4e4a3e', X, y, Math.min(w, CX + 15 - X), 2); R(x, '#a39e8a', X, y + 2, Math.min(w, CX + 15 - X), 1); X += w + 1 + Math.floor(r() * 2); } }
    R(x, st[4], CX - 34, TH - 4, 68, 4); R(x, st[6], CX - 34, TH - 4, 68, 1);
    for (const cx of [CX - 44, CX + 44]) { R(x, K.bone, cx - 1, TH - 14, 3, 10); R(x, K.bone2, cx + 1, TH - 14, 1, 10); R(x, K.bone, cx - 2, TH - 4, 5, 1); }
  });
}
function drawTablet(x, t, o = {}) {
  x.drawImage(tabletBase(o.hue || 'stone'), 0, 0);
  const lights = [{ x: CX - 44, y: TH - 20, r: 52 + Math.sin(t * 9) * 2, i: 1.2 }, { x: CX + 44, y: TH - 20, r: 52 + Math.sin(t * 8 + 1) * 2, i: 1.2 }, { x: CX, y: 36, r: 34, i: 0.8 }];
  lightPass(x, SW, TH, lights, 0.2, 0.85);
  flame(x, CX - 44, TH - 16, t, 0, 0.6); flame(x, CX + 44, TH - 16, t, 1, 0.6);
}

// ---- Treasure reveal
const RH = 84;
function drawTreasure(x, t, o = {}) {
  x.drawImage(cached('treasure-bg', SW, RH, (c) => { const r = prng('tr'); bricks(c, 0, 0, SW, RH, STONES.void, r, 10, 5, 3); const st = STONES.stone; R(c, st[4], CX - 14, 66, 28, 5); R(c, st[6], CX - 14, 66, 28, 1); R(c, st[3], CX - 10, 71, 20, 13); R(c, st[2], CX + 6, 71, 4, 13); R(c, st[5], CX - 18, 80, 36, 4); R(c, st[6], CX - 18, 80, 36, 1); }), 0, 0);
  const rot = t * 0.3;
  for (let k = 0; k < 12; k++) {
    const a = rot + (k * Math.PI * 2) / 12;
    for (let s = 12; s < 46; s++) { const X = Math.round(CX + Math.cos(a) * s), Y = Math.round(44 + Math.sin(a) * s * 0.8); if (Y < 0 || Y >= RH || bay(X, Y) > 0.5 * (1 - s / 46)) continue; x.fillStyle = 'rgba(255,217,138,0.4)'; x.fillRect(X, Y, 1, 1); }
  }
  lightPass(x, SW, RH, [{ x: CX, y: 44, r: 56, i: 1.4 }], 0.04);
  const ic = relicCanvas(o.id, o.hue);
  const by = Math.round(Math.sin(t * 2) * 2);
  x.drawImage(ic, CX - 16, 30 + by - 6, 32, 32);
  for (let i = 0; i < 8; i++) { const p = (t * 0.4 + i * 0.125) % 1; const X = Math.round(CX + Math.cos(i * 2.4) * (10 + p * 22)), Y = Math.round(46 - p * 40 + Math.sin(i) * 6); R(x, p < 0.4 ? K.white : K.amber2, X, Y); }
}

// ======================================================================
// Icons
// ======================================================================
function flaskSprite(full) {
  const b = makeBuffer(9, 12);
  b.rect(3, 0, 3, 2, '#7a4a26'); b.rect(3, 0, 3, 1, '#9a6a3a');
  b.rect(3, 2, 3, 2, full ? '#5b6a88' : '#3c4458');
  b.ellipse(4.5, 7.5, 4.3, 4.3, full ? '#5b6a88' : '#2e3446');
  if (full) b.ellipse(4.5, 7.5, 3.4, 3.4, (X, Y) => (Y >= 6 ? (Y >= 9 ? '#c46a2a' : '#e8b04b') : null));
  else b.rect(2, 10, 5, 1, '#5a3a1e');
  b.set(2, 5, '#ffffffaa'); b.set(2, 6, full ? '#ffffff88' : '#ffffff44');
  if (full) b.set(4, 7, '#ffd98a');
  b.outline('#07080d');
  return b.toSprite();
}
const FLASK_FULL = hasDOM ? flaskSprite(true) : null;
const FLASK_EMPTY = hasDOM ? flaskSprite(false) : null;
function drawFlaskAt(x, X, Y) { x.drawImage(cached('flask-c', 9, 12, (c) => c.putImageData(new ImageData(new Uint8ClampedArray(FLASK_FULL.rgba), 9, 12), 0, 0)), X, Y); }

function keySprite(on) {
  const b = makeBuffer(15, 8);
  const g = on ? '#f0c75e' : '#3a4156', d = on ? '#b98a2e' : '#272c3c';
  b.ellipse(3.5, 3.5, 3.4, 3.4, (X, Y, dx, dy) => (dx * dx + dy * dy < 0.2 ? null : dy > 0.3 ? d : g));
  b.rect(7, 3, 7, 2, g); b.rect(7, 4, 7, 1, d); b.rect(10, 5, 1, 2, g); b.rect(12, 5, 2, 2, g);
  if (on) b.set(2, 1, '#fff3d1');
  b.outline('#07080d');
  return b.toSprite();
}
const KEY_ON = hasDOM ? keySprite(true) : null;
const KEY_OFF = hasDOM ? keySprite(false) : null;

// Placeholder relic icons (16x16). The lead may pass treasureIcon to replace them.
const RELIC_DRAW = {
  ct_bone_dice: (b, h) => { b.rect(1, 6, 7, 7, h); b.rect(8, 3, 7, 7, '#c9b994'); [[3, 8], [5, 10], [4, 9]].forEach(([x, y]) => b.set(x, y, '#3a2a12')); [[10, 5], [12, 7], [10, 7], [12, 5]].forEach(([x, y]) => b.set(x, y, '#3a2a12')); },
  ct_silver_mirror: (b, h) => { b.ellipse(8, 6, 5.5, 5.5, '#8a93a8'); b.ellipse(8, 6, 4.2, 4.2, h); b.rect(7, 11, 2, 4, '#6b4423'); b.set(6, 4, '#ffffff'); b.set(7, 3, '#ffffff'); },
  ct_wardens_compass: (b, h) => { b.ellipse(8, 8, 6.5, 6.5, '#b98a2e'); b.ellipse(8, 8, 5, 5, '#efe6d2'); b.line(8, 4, 8, 8, '#9a2e2e'); b.line(8, 8, 8, 12, '#3a4156'); b.set(8, 1, h); },
  ct_nameless_crown: (b, h) => { b.rect(2, 8, 12, 5, h); b.rect(2, 4, 2, 4, h); b.rect(7, 3, 2, 5, h); b.rect(12, 4, 2, 4, h); b.rect(5, 9, 6, 3, '#d8c9a6'); },
  ct_ysolde_wick: (b, h) => { b.rect(6, 8, 4, 7, '#efe6d2'); b.rect(7, 6, 1, 2, '#3a2a12'); b.ellipse(7.5, 4, 2, 3, h); b.set(7, 4, '#ffffff'); },
  ct_tide_pearl: (b, h) => { b.ellipse(8, 8, 5.5, 5.5, '#8090ad'); b.ellipse(7.5, 7.5, 4.5, 4.5, h); b.set(6, 6, '#ffffff'); b.set(5, 6, '#ffffff'); },
  ct_hollow_mask: (b, h) => { b.ellipse(8, 8, 6, 7, h); b.rect(5, 6, 2, 2, '#07080d'); b.rect(9, 6, 2, 2, '#07080d'); b.rect(6, 11, 4, 1, '#8a8676'); },
  ct_iron_key: (b, h) => { b.ellipse(4, 4, 3.5, 3.5, h); b.ellipse(4, 4, 1.5, 1.5, '#07080d'); b.line(6, 6, 13, 13, h); b.line(7, 6, 14, 13, h); b.rect(11, 13, 2, 2, h); b.rect(13, 11, 2, 2, h); },
  ct_star_chart: (b, h) => { b.rect(2, 3, 12, 10, '#2a3550'); b.rect(1, 2, 2, 12, '#d8c9a6'); b.rect(13, 2, 2, 12, '#d8c9a6'); [[5, 5], [8, 7], [11, 5], [6, 10], [10, 10]].forEach(([x, y]) => b.set(x, y, h)); b.line(5, 5, 8, 7, '#7fb3a644'); b.line(8, 7, 11, 5, '#7fb3a644'); },
  ct_grey_phial: (b, h) => { b.rect(6, 1, 4, 2, '#5a3a1e'); b.rect(6, 3, 4, 3, '#59627a'); b.ellipse(8, 10, 5, 5, '#59627a'); b.ellipse(8, 10.5, 4, 4, h); b.set(6, 8, '#ffffff'); },
  ct_heart_stone: (b, h) => { b.ellipse(5.5, 6, 3.5, 3.5, h); b.ellipse(10.5, 6, 3.5, 3.5, h); for (let y = 6; y < 14; y++) b.rect(2 + (y - 6), y, 12 - 2 * (y - 6), 1, h); b.set(4, 4, '#ffd98a'); },
  ct_lamp_of_ages: (b, h) => { b.ellipse(8, 11, 6, 3, '#a8603a'); b.rect(12, 9, 3, 2, '#a8603a'); b.ellipse(14, 6, 1.5, 2.5, h); b.set(14, 6, '#ffffff'); b.rect(4, 13, 8, 1, '#6b3a24'); },
};
const relicCache = new Map();
function relicSprite(id, hue = '#e8b04b', locked = false) {
  const key = `${id}:${locked}`;
  if (relicCache.has(key)) return relicCache.get(key);
  const b = makeBuffer(16, 16);
  (RELIC_DRAW[id] || ((bb, h) => bb.ellipse(8, 8, 6, 6, h)))(b, hue);
  if (locked) { const s = b.toSprite(); for (let i = 0; i < s.rgba.length; i += 4) if (s.rgba[i + 3]) { s.rgba[i] = 26; s.rgba[i + 1] = 29; s.rgba[i + 2] = 42; s.rgba[i + 3] = 255; } }
  b.outline('#07080d');
  const s = b.toSprite(); relicCache.set(key, s); return s;
}
function relicCanvas(id, hue) { return cached(`relic-${id}`, 16, 16, (c) => { const s = relicSprite(id, hue); c.putImageData(new ImageData(new Uint8ClampedArray(s.rgba), 16, 16), 0, 0); }); }

// ======================================================================
// Layout pieces
// ======================================================================
function useIntScale(w) {
  const ref = useRef(null);
  const [scale, setScale] = useState(2);
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return undefined;
    const fit = () => setScale(Math.max(1, Math.min(4, Math.floor((el.clientWidth || w * 2) / w))));
    fit();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [w]);
  return [ref, scale];
}

function Scene({ w = SW, h = SH, draw, animate = true, deps = [], label, children, className = '' }) {
  const [ref, scale] = useIntScale(w);
  const style = { width: w * scale, height: h * scale };
  return (
    <div ref={ref} className={`crypt-scene ${className}`}>
      <div className="crypt-scene-inner" style={style}>
        <PixelCanvas w={w} h={h} draw={draw} animate={animate} fps={12} label={label} deps={deps} style={style} />
        {children && <div className="crypt-scene-over">{children}</div>}
      </div>
    </div>
  );
}

function Icon({ sprite, scale = 2, label, className = '' }) {
  return <Sprite sprite={sprite} scale={scale} label={label} className={`crypt-icon ${className}`} />;
}

function Lamps({ n }) {
  return (
    <span className="crypt-lamps" aria-label={`${n} of ${CRYPT_TUNING.lamps} lamp flasks left`} role="img">
      {Array.from({ length: CRYPT_TUNING.lamps }, (_, i) => <Icon key={i} sprite={i < n ? FLASK_FULL : FLASK_EMPTY} scale={2} />)}
    </span>
  );
}

function Keys({ n }) {
  return (
    <span className="crypt-keys" role="img" aria-label={`${n} of ${CRYPT_TUNING.maxKeys} keys`}>
      {Array.from({ length: CRYPT_TUNING.maxKeys }, (_, i) => <Icon key={i} sprite={i < n ? KEY_ON : KEY_OFF} scale={2} />)}
    </span>
  );
}

function Hud({ floor, lamps, deepest }) {
  return (
    <div className="crypt-hud">
      <div className="crypt-depth"><small>Floor</small><b>{floor}</b></div>
      <div className="crypt-hud-mid"><small>Lamp oil</small><Lamps n={lamps} /></div>
      <div className="crypt-hud-best"><small>Deepest</small><b>{deepest}</b></div>
    </div>
  );
}

const variantLabel = { interference: 'interference', reverse: 'reverse', timed: 'timed', abstract: 'abstract', lures: 'look-alike strangers', restyle: 'changed looks', turn: 'turned heads' };
function describeStep(step) {
  if (!step) return '';
  if (step.echo) return `Echo of floor ${step.echoFrom} · ${TEMPLATE_NAME[step.spec.t]} · ${step.items.length} items · no study`;
  const v = (step.variants || []).map((x) => variantLabel[x]).filter(Boolean);
  return `${TEMPLATE_NAME[step.spec.t]} · ${step.items.length} ${step.spec.t === 'digits' ? 'digits' : 'items'}${step.spec.s ? ` · ${step.spec.s}s study` : ''}${v.length ? ` · ${v.join(', ')}` : ''}`;
}

// Run map (v0.5): the floors around you, with words and shapes for cleared, current, echo and boss floors.
function RunMap({ run }) {
  const from = Math.max(1, run.floor - 5), to = run.floor + 5;
  const floors = Array.from({ length: to - from + 1 }, (_, i) => from + i);
  const kind = (f) => (f < run.floor ? 'cleared' : f === run.floor ? 'here' : isBossFloor(f) ? 'boss' : isEchoFloor(f) ? 'echo' : 'ahead');
  const mark = { cleared: '✓', here: '◆', boss: 'B', echo: 'E', ahead: '·' };
  const word = { cleared: 'cleared', here: 'you are here', boss: 'boss floor', echo: 'echo floor', ahead: 'below' };
  return (
    <ol className="crypt-runmap" aria-label="Run map">
      {floors.map((f) => { const k = kind(f); return <li key={f} className={`rm-${k}`}><span aria-hidden="true">{mark[k]}</span><small>{f}</small><span className="sr-only">Floor {f}, {word[k]}</span></li>; })}
    </ol>
  );
}

// Failure coaching (v0.5): one practical idea for the trial that was just missed.
const FAIL_TIP = {
  wordlist: 'Make every word move and touch the next one. A still picture slips away.',
  pairs: 'Crash the two pictures together. If they are only side by side, the first will not bring back the second.',
  chain: 'Tell it as one silly story. Each picture should cause the next.',
  palace: 'Walk your route slowly and make each picture break, soak or sit on its stop.',
  faces: 'Pick one feature that will not change, like the nose or the jaw, and put the name picture right on it.',
  digits: 'Split the number into pairs and turn each pair into a picture with your sound code.',
  vocab: 'Find an English sound-alike for the word and make it act on the meaning.',
  facts: 'Picture the question and the answer, and make them fight or embrace.',
  major: 'Say the sounds aloud in your head: each digit is a consonant, and you fill in the vowels.',
};

// Where descents end (v0.7): a local tally used to tune difficulty. Nothing leaves this device.
function EndsChart({ ends }) {
  const rows = Object.entries(ends || {}).map(([f, n]) => [+f, n]).sort((a, b) => a[0] - b[0]);
  const total = rows.reduce((a, r) => a + r[1], 0);
  if (total < 2) return null;
  const max = Math.max(...rows.map((r) => r[1]));
  const sorted = rows.flatMap(([f, n]) => Array(n).fill(f));
  const median = sorted[Math.floor((sorted.length - 1) / 2)];
  return (
    <div className="crypt-ends">
      <h3>Where your descents end</h3>
      <p className="crypt-note">Half of your {total} descents ended by floor {median}. This tally stays on this device.</p>
      <ul>{rows.map(([f, n]) => <li key={f}><small>Floor {f}</small><span className="bar" style={{ width: `${(n / max) * 100}%` }} /><b>{n}</b></li>)}</ul>
    </div>
  );
}

function RunSummary({ s, deepest }) {
  if (!s) return null;
  return (
    <div className="crypt-summary">
      {s.record && <div className="crypt-record">New personal best</div>}
      <dl>
        <div><dt>Floors cleared</dt><dd>{s.cleared}</dd></div>
        <div><dt>Deepest ever</dt><dd>{deepest}</dd></div>
        <div><dt>Attempts</dt><dd>{s.attempts}</dd></div>
        <div><dt>Mean accuracy</dt><dd>{Math.round((s.acc || 0) * 100)}%</dd></div>
      </dl>
      {(s.treasures.length > 0 || s.tablets.length > 0 || s.chests > 0) ? (
        <p className="crypt-finds">Brought back: {[
          ...s.treasures.map((id) => treasureById(id)?.name),
          ...(s.tablets.length ? [`${s.tablets.length} lore tablet${s.tablets.length > 1 ? 's' : ''}`] : []),
          ...(s.chests ? [`${s.chests} chest${s.chests > 1 ? 's' : ''} opened`] : []),
        ].filter(Boolean).join(', ')}.</p>
      ) : <p className="crypt-finds muted">Nothing new this time. The stair remembers you, though.</p>}
    </div>
  );
}

// ======================================================================
// Home-screen card
// ======================================================================
export function CryptCard({ profile, onEnter }) {
  const c = profile?.crypt || newCrypt();
  const run = c.run;
  const draw = (x, t) => {
    const full = cached('card-entr-buf', SW, SH, () => {});
    const fx = full.getContext('2d');
    drawEntrance(fx, t, { lit: c.keys > 0 });
    x.drawImage(full, 12, 14, 152, 62, 0, 0, 152, 62);
  };
  return (
    <section className="card crypt-card">
      <Scene w={152} h={62} draw={draw} deps={[c.keys > 0]} label="The iron door of the Undercroft, between two torches" />
      <div className="crypt-card-body">
        <div>
          <h3 className="crypt-title-sm">The Undercroft</h3>
          <p className="muted small">An endless crypt beneath the Archive. Each floor is one memory trial. How deep can you go?</p>
        </div>
        <div className="crypt-card-stats">
          <Keys n={c.keys} />
          <span className="small">Deepest <b>{c.deepest}</b></span>
        </div>
        <button className="btn primary crypt-btn" onClick={onEnter}>
          {run ? `Resume descent · floor ${run.floor}` : c.keys > 0 ? 'Descend (1 key)' : 'Visit the door'}
        </button>
      </div>
    </section>
  );
}

// ======================================================================
// Full mode
// ======================================================================
export default function Crypt({ profile, update, onExit, treasureIcon }) {
  // A floor left part-way (reload, closed tab) costs a flask, so there is no free retry.
  const [leftFloor] = useState(() => (profile.crypt?.run?.inFloor ? profile.crypt.run.inFloor.floor : null));
  useEffect(() => {
    const c = profile.crypt;
    if (!c || !Array.isArray(c.history) || typeof c.keys !== 'number') update((p) => { ensureCrypt(p); });
    if (leftFloor != null) {
      let out = null;
      update((p) => { out = settleAbandonedFloor(p); });
      if (out?.outcome === 'dead') { setSummary(out.summary); setView('tide'); }
    }
  }, []);
  const crypt = profile.crypt || newCrypt();
  const run = crypt.run;
  const [view, setView] = useState(leftFloor != null ? 'lost' : run ? 'stair' : 'gate');
  const [step, setStep] = useState(null);
  const [live, setLive] = useState(false);
  const [result, setResult] = useState(null);
  const [queue, setQueue] = useState([]);
  const [summary, setSummary] = useState(null);
  const [reading, setReading] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [weekly, setWeekly] = useState(false);
  const [mods, setMods] = useState([]);

  const go = (v) => { setView(v); if (typeof window !== 'undefined') window.scrollTo(0, 0); };
  const preview = useMemo(() => (run ? floorSpec(profile, run.floor, run.seed, run.attempt) : null), [run?.floor, run?.attempt, run?.seed]);

  function enter() {
    if (run) { go('stair'); return; }
    let ok = false;
    update((p) => { ensureCrypt(p); ok = !!startRun(p, undefined, { weekly, mods }); });
    if (ok) go('stair');
  }
  function openChamber() {
    if (!preview) return;
    setStep(preview); setResult(null); setLive(false); setNonce((n) => n + 1); go('floor');
  }
  function onResult(res, timing, extra) {
    setLive(false);
    let out = null;
    update((p) => { out = applyFloorResult(p, res.acc, step, extra?.loci || step?.loci); });
    if (out) setResult({ ...out, acc: res.acc });
  }
  function onContinue() {
    const out = result;
    if (!out) { go(run ? 'stair' : 'gate'); return; }
    if (out.outcome === 'descend') {
      const r = out.rewards;
      const beats = [
        ...(r.chest ? [{ k: 'chest', line: r.chestLine, oil: r.oil, floor: out.floor }] : []),
        ...r.treasures.map((id) => ({ k: 'treasure', id })),
        ...r.tablets.map((id) => ({ k: 'tablet', id })),
      ];
      setQueue(beats);
      go(beats.length ? 'beat' : 'stair');
    } else if (out.outcome === 'retry') go('lost');
    else { setSummary(out.summary); go('tide'); }
  }
  function nextBeat() {
    const rest = queue.slice(1);
    setQueue(rest);
    if (!rest.length) go('stair'); else window.scrollTo?.(0, 0);
  }
  function leave() {
    let s = null;
    update((p) => { s = climbOut(p); });
    setSummary(s); go('out');
  }

  const deepest = crypt.deepest;
  const tCount = Object.keys(crypt.treasures || {}).length, lCount = Object.keys(crypt.tablets || {}).length;

  // ---------- views ----------
  let body;
  if (view === 'gate') {
    const ok = canEnter(profile) || (!profile.crypt && crypt.keys > 0);
    body = (
      <>
        <header className="crypt-head">
          <p className="crypt-kicker">Beneath the Archive</p>
          <h1 className="crypt-title">The Undercroft</h1>
        </header>
        <Scene draw={(x, t) => drawEntrance(x, t, { lit: crypt.keys > 0 || !!run })} deps={[crypt.keys > 0 || !!run]} label="An iron door under the Archive floor, lit by two torches" />
        <div className="crypt-panel">
          <div className="crypt-stats">
            <div><small>Keys</small><Keys n={crypt.keys} /></div>
            <div><small>Deepest</small><b>{deepest}</b></div>
            <div><small>Descents</small><b>{crypt.runs}</b></div>
          </div>
          {!run && ok && (
            <fieldset className="crypt-options">
              <legend>This descent</legend>
              <label className="check"><input type="checkbox" checked={weekly} onChange={(e) => setWeekly(e.target.checked)} /> <span>Weekly descent <small>(the same stair all week; your best this week: floor {crypt.weekly?.[weekKey()] ?? 0})</small></span></label>
              {CRYPT_MODIFIERS.map((m) => (
                <label key={m.id} className="check"><input type="checkbox" checked={mods.includes(m.id)} onChange={(e) => setMods(e.target.checked ? [...mods, m.id] : mods.filter((x) => x !== m.id))} /> <span>{m.name} <small>({m.desc})</small></span></label>
              ))}
              <p className="crypt-note">Modifiers make a descent harder for the challenge of it. They do not add rewards.</p>
            </fieldset>
          )}
          {run ? (
            <button className="btn primary big crypt-btn" onClick={enter}>Resume descent · floor {run.floor}</button>
          ) : (
            <button className="btn primary big crypt-btn" disabled={!ok} onClick={enter}>{ok ? 'Unlock the door · 1 key' : 'The door is locked'}</button>
          )}
          {!run && !ok && <p className="crypt-note">Keys are earned by training: one for each completed daily session and one for each delayed recall you pass at 7 days. You can carry {CRYPT_TUNING.maxKeys}.</p>}
          <Tip profile={profile} update={update} id="crypt">Down here nothing changes your training scores. It only shows how deep you can go. Climb out between floors to keep what you found.</Tip>
          <button className="crypt-link" aria-expanded={showRules} onClick={() => setShowRules(!showRules)}>{showRules ? 'Hide the rules' : 'How the Undercroft works'}</button>
          {showRules && (
            <ul className="crypt-rules">
              <li>Each floor is one memory trial, drawn from the skills you have opened. The deeper you go, the more there is to hold and the less time you get.</li>
              <li>Score {Math.round(CRYPT_TUNING.passAcc * 100)}% or better to descend. Fall short and a flask of lamp oil burns away, and the floor tries you again with new material.</li>
              <li>You carry {CRYPT_TUNING.lamps} flasks. When the last one is gone, the Tide rises and carries you back up.</li>
              <li>Between floors you may climb out. Everything you found is kept. Leaving in the middle of a trial costs a flask.</li>
              <li>A sealed chest waits on every {CRYPT_TUNING.chestEvery}th floor. Relics and carved tablets wait deeper still.</li>
              <li>The Undercroft is a test, not training. It never changes your skill levels or your place in the year.</li>
            </ul>
          )}
          <div className="crypt-row">
            <button className="btn crypt-btn-ghost" onClick={() => go('reliquary')}>Reliquary · {tCount}/{TREASURES.length} relics · {lCount}/{TABLETS.length} tablets</button>
            {onExit && <button className="btn crypt-btn-ghost" onClick={onExit}>Back to Veyra</button>}
          </div>
          {crypt.history?.length > 0 && (
            <div className="crypt-history">
              <h3>Recent descents</h3>
              <ol>
                {crypt.history.slice(-5).reverse().map((h, i) => (
                  <li key={i}><span>{h.endedAt?.slice(0, 10)}</span><span>{h.reason === 'climbed' ? 'Climbed out' : 'Taken by the Tide'}{h.weekly ? ' · weekly' : ''}{h.mods?.length ? ` · ${h.mods.map((m) => CRYPT_MODIFIERS.find((x) => x.id === m)?.name).join(', ')}` : ''}</span><b>Floor {h.cleared}</b>{h.record && <em>best</em>}</li>
                ))}
              </ol>
            </div>
          )}
          <EndsChart ends={crypt.ends} />
        </div>
      </>
    );
  } else if (view === 'stair' && run) {
    const b = bandFor(run.floor);
    const newBand = BANDS.some((x) => x.from === run.floor);
    body = (
      <>
        <Hud floor={run.floor} lamps={run.lamps} deepest={deepest} />
        <Scene draw={(x, t) => drawStair(x, t, { hue: b.hue })} deps={[b.hue]} label={`Descending the stair to floor ${run.floor}`}>
          <div className="crypt-floorplate">
            <small>{newBand ? 'New depth' : 'Descending'}</small>
            <b>Floor {run.floor}</b>
          </div>
        </Scene>
        <div className="crypt-panel">
          <RunMap run={run} />
          {preview?.boss ? (
            <>
              <h2 className="crypt-band">{preview.bossName}</h2>
              <p className="crypt-line">{bossFor(run.floor).line}</p>
              <p className="crypt-note">A boss floor: more to hold than usual. Beat it and every flask of oil is refilled.</p>
            </>
          ) : (
            <>
              <h2 className="crypt-band">{b.name}</h2>
              <p className="crypt-line">{b.line}</p>
            </>
          )}
          {run.weekly && <p className="crypt-note">Weekly descent ({run.weekly}).</p>}
          <p className="crypt-next"><small>The trial</small>{describeStep(preview)}</p>
          {run.attempt > 0 && <p className="crypt-note">Second try at this floor. The material is new.</p>}
          {preview?.echo && <p className="crypt-note">An echo floor. The walls ask again what you carried through floor {preview.echoFrom}, with no time to study. Hold on to what you learn on the way down.</p>}
          <button className="btn primary big crypt-btn" onClick={openChamber}>Enter the chamber</button>
          <button className="btn crypt-btn-ghost" onClick={leave}>{run.floor > 1 ? 'Climb out and keep what you found' : 'Turn back'}</button>
        </div>
      </>
    );
  } else if (view === 'floor' && step) {
    const b = bandFor(step.floor);
    const banner = result && (
      result.outcome === 'descend' ? <div className="crypt-banner good" role="status">{result.rewards?.boss ? `${step.bossName} is beaten. Your flasks are full again.` : `Floor ${result.floor} cleared. The way down opens.`}</div>
        : result.outcome === 'retry' ? <div className="crypt-banner bad" role="status">Not enough. A flask of oil burns away.</div>
          : <div className="crypt-banner dead" role="status">Your last lamp gutters out.</div>
    );
    body = (
      <>
        <Hud floor={step.floor} lamps={profile.crypt?.run?.lamps ?? result?.lamps ?? 0} deepest={deepest} />
        {!live && !result && (
          <Scene draw={(x, t) => drawChamber(x, t, { band: b })} deps={[b.name]} label={`The chamber of floor ${step.floor}: ${b.name}`}>
            <div className="crypt-floorplate small"><b>{b.name}</b></div>
          </Scene>
        )}
        {banner}
        <div className={`crypt-drill${live ? ' is-live' : ''}`}>
          <Drill key={nonce} step={step} isProbe={!!step.echo} profile={profile} update={update}
            onStart={() => { setLive(true); update((p) => { enterFloor(p); }); }} onResult={onResult} onContinue={onContinue} />
        </div>
      </>
    );
  } else if (view === 'lost' && run) {
    const b = bandFor(run.floor);
    body = (
      <>
        <Hud floor={run.floor} lamps={run.lamps} deepest={deepest} />
        <Scene draw={(x, t) => drawChamber(x, t, { band: b, noOrb: true, ambient: 0.08 })} deps={[b.name]} label="The chamber grows darker" />
        <div className="crypt-panel">
          <h2 className="crypt-band">The lamp gutters</h2>
          {leftFloor != null && run.floor === leftFloor && <p className="crypt-note">You left the chamber before the trial ended, so it counts as a miss.</p>}
          <p className="crypt-line">One flask of oil is spent. {run.lamps === 1 ? 'This is your last light.' : `${run.lamps} remain.`} The chamber shifts, and the floor offers a new trial.</p>
          {FAIL_TIP[preview?.spec?.t] && <p className="crypt-note"><b>Try this:</b> {FAIL_TIP[preview.spec.t]}</p>}
          <button className="btn primary big crypt-btn" onClick={() => go('stair')}>Face the floor again</button>
          <button className="btn crypt-btn-ghost" onClick={leave}>Climb out and keep what you found</button>
        </div>
      </>
    );
  } else if (view === 'beat' && queue[0]) {
    const beat = queue[0];
    if (beat.k === 'chest') {
      const anim = oneShot(2.4);
      body = (
        <>
          <Scene draw={anim((x, t) => drawChest(x, t, { band: bandFor(beat.floor), oil: beat.oil }))} deps={[beat.floor]} label="A sealed chest creaks open" />
          <div className="crypt-panel center">
            <p className="crypt-kicker">Floor {beat.floor}</p>
            <h2 className="crypt-band">A sealed chest</h2>
            <p className="crypt-line">{beat.line}</p>
            <p className="crypt-note">{beat.oil ? 'One flask of lamp oil restored.' : 'Your flasks are already full. You tuck it away for luck.'}</p>
            <button className="btn primary big crypt-btn" autoFocus onClick={nextBeat}>Take it</button>
          </div>
        </>
      );
    } else if (beat.k === 'treasure') {
      const tr = treasureById(beat.id);
      body = (
        <>
          <Scene h={RH} draw={(x, t) => drawTreasure(x, t, { id: tr.id, hue: tr.hue })} deps={[tr.id]} label={`Relic found: ${tr.name}`}>
            {treasureIcon && <div className="crypt-relic-over">{treasureIcon(tr.id, 64)}</div>}
          </Scene>
          <div className="crypt-panel center">
            <p className="crypt-kicker">Relic found · floor {tr.depth}</p>
            <h2 className="crypt-band">{tr.name}</h2>
            <p className="crypt-line">{tr.desc}</p>
            <button className="btn primary big crypt-btn" autoFocus onClick={nextBeat}>Keep it</button>
          </div>
        </>
      );
    } else {
      body = <TabletView id={beat.id} onDone={nextBeat} doneLabel="Continue the descent" />;
    }
  } else if (view === 'tide') {
    const anim = oneShot(6);
    body = (
      <>
        <Scene draw={anim((x, t) => drawTide(x, t, { band: bandFor(summary?.reached || 1) }))} deps={[]} label="The silver Tide floods the chamber" />
        <div className="crypt-panel">
          <p className="crypt-kicker">Floor {summary?.reached ?? ''}</p>
          <h2 className="crypt-band">The Tide rises</h2>
          <p className="crypt-line">Your last light goes out, and the silver comes up through the floor, cool and soft and patient. It carries you back up the stair. You wake on the Archive floor with the iron door shut behind you, and you remember every step.</p>
          <RunSummary s={summary} deepest={deepest} />
          <button className="btn primary big crypt-btn" autoFocus onClick={() => go('gate')}>Back to the door</button>
        </div>
      </>
    );
  } else if (view === 'out') {
    body = (
      <>
        <Scene draw={(x, t) => drawEntrance(x, t, { lit: crypt.keys > 0 })} deps={[crypt.keys > 0]} label="Back at the iron door" />
        <div className="crypt-panel">
          <h2 className="crypt-band">You climb back into the lamplight</h2>
          <p className="crypt-line">The door swings shut below you with a sound like a held breath let go. What you carried up is yours to keep.</p>
          <RunSummary s={summary} deepest={deepest} />
          <button className="btn primary big crypt-btn" autoFocus onClick={() => go('gate')}>Back to the door</button>
        </div>
      </>
    );
  } else if (view === 'reliquary') {
    body = reading ? <TabletView id={reading} onDone={() => setReading(null)} doneLabel="Back to the reliquary" /> : (
      <div className="crypt-panel">
        <p className="crypt-kicker">Kept from the deep</p>
        <h2 className="crypt-band">The Reliquary</h2>
        <h3 className="crypt-sub">Relics · {tCount} of {TREASURES.length}</h3>
        <ul className="crypt-relics">
          {TREASURES.map((tr) => {
            const got = crypt.treasures?.[tr.id];
            return (
              <li key={tr.id} className={got ? 'got' : ''}>
                {got && treasureIcon ? treasureIcon(tr.id, 48) : <Icon sprite={relicSprite(tr.id, tr.hue, !got)} scale={3} label={got ? tr.name : 'Unknown relic'} />}
                <b>{got ? tr.name : '???'}</b>
                <small>{got ? tr.desc : `Below floor ${tr.depth}`}</small>
              </li>
            );
          })}
        </ul>
        <h3 className="crypt-sub">Carved tablets · {lCount} of {TABLETS.length}</h3>
        <ol className="crypt-tablets">
          {TABLETS.map((tb) => {
            const got = crypt.tablets?.[tb.id];
            return (
              <li key={tb.id}>
                {got ? <button className="crypt-tablet-btn" onClick={() => setReading(tb.id)}><b>{tb.title}</b><small>Floor {tb.depth}</small></button>
                  : <span className="crypt-tablet-locked"><b>Uncarved</b><small>Below floor {tb.depth}</small></span>}
              </li>
            );
          })}
        </ol>
        <button className="btn primary crypt-btn" onClick={() => go('gate')}>Back to the door</button>
      </div>
    );
  } else {
    body = (
      <div className="crypt-panel">
        <p className="crypt-line">The stair is quiet.</p>
        <button className="btn primary crypt-btn" onClick={() => go('gate')}>Back to the door</button>
      </div>
    );
  }

  return <div className={`crypt crypt-view-${view}`}>{body}</div>;
}

// One-shot scenes (chest, tide) play from mount; with reduced motion they show their end state.
function oneShot(endT) {
  const rm = typeof window !== 'undefined' && reducedMotion();
  return (draw) => (ctx, t, f) => draw(ctx, rm ? endT : t, f);
}

function TabletView({ id, onDone, doneLabel }) {
  const tb = tabletById(id);
  if (!tb) return null;
  const idx = TABLETS.findIndex((x) => x.id === id) + 1;
  return (
    <>
      <Scene h={TH} draw={(x, t) => drawTablet(x, t, { hue: bandFor(tb.depth).hue })} deps={[id]} label="A carved stone tablet in an alcove, lit by two candles" />
      <article className="crypt-tablet">
        <p className="crypt-kicker">Tablet {idx} of {TABLETS.length} · floor {tb.depth}</p>
        <h2>{tb.title}</h2>
        <p>{tb.text}</p>
      </article>
      <div className="crypt-panel center">
        <button className="btn primary big crypt-btn" autoFocus onClick={onDone}>{doneLabel}</button>
      </div>
    </>
  );
}
