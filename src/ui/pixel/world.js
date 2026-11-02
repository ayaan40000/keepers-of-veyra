// Veyra world art: pure procedural pixel drawing (no JSX, no DOM at module load).
// Everything is original art drawn in code. Buffers are plain RGBA Uint8ClampedArrays so the
// static layers can be built (and tested) in Node, then uploaded once to a canvas in the browser.

// ---------------------------------------------------------------------------------------------
// Palette (ints 0xRRGGBB). Night blues, lamplight amber, sea-glass teal, Tide silver.
export const K = {
  sky0: 0x080b15, sky1: 0x0c1120, sky2: 0x11192d, sky3: 0x18233c, sky4: 0x20304c, skyRim: 0x2b3f5e,
  mtn0: 0x141c31, mtn1: 0x1a2440, mtn2: 0x24315a,
  rock0: 0x0c1019, rock1: 0x161c2a, rock2: 0x1f2738, rock3: 0x2c364c, rock4: 0x434f6a,
  heath0: 0x111a1c, heath1: 0x182624, heath2: 0x22352f, heath3: 0x31493c,
  gnd0: 0x121725, gnd1: 0x191f30, gnd2: 0x20283b, cob0: 0x262f44, cob1: 0x323c54, cob2: 0x435069,
  moss0: 0x13211d, moss1: 0x1b2f28, moss2: 0x264034, moss3: 0x355a45, moss4: 0x4f7a5a,
  st0: 0x232a3c, st1: 0x343d54, st2: 0x4d5770, st3: 0x737e98, st4: 0xa3adc2, st5: 0xcfd6e3, white: 0xeef1f6,
  sl0: 0x151b2b, sl1: 0x1f2840, sl2: 0x2b3756, sl3: 0x3d4c72, sl4: 0x56688f,
  cu0: 0x14302d, cu1: 0x1f4a44, cu2: 0x2f6b5f, cu3: 0x4f9483, cu4: 0x8cc7b4, cu5: 0xc2ecdf,
  pl0: 0x22192a, pl1: 0x35253c, pl2: 0x4d3653, pl3: 0x6b4d6c,
  tb0: 0x0d0a0e, tb1: 0x1c1519, tb2: 0x2c2127, pla0: 0x6e6858, pla1: 0x8f8771, pla2: 0xb3a98c,
  wd0: 0x24170f, wd1: 0x3a2618, wd2: 0x573a22, wd3: 0x7a5432,
  w0: 0x0c1828, w1: 0x12233a, w2: 0x1b3350, w3: 0x2b4b6c, w4: 0x4f7896, w5: 0x8fb5c8, foam: 0xd3e0ea,
  sea0: 0x08111f, sea1: 0x0c1a2e, sea2: 0x11243e, sea3: 0x183152, sea4: 0x26476b,
  am0: 0x5a2a12, am1: 0xa4531f, am2: 0xd98a35, am3: 0xf2bd5c, am4: 0xffdf96, am5: 0xfff4cf,
  win: 0x0a0e18, win2: 0x161c2c, iron0: 0x111319, iron1: 0x232733, iron2: 0x3a404f,
  tide: 0xb8c2d6, tide2: 0x8090ad, tide3: 0xdfe5ef, glass0: 0x2e5a63, glass1: 0x5f9ea0, glass2: 0x9fd4d0, glass3: 0xdaf3f0,
  cream: 0xefe6d2, gold: 0xf0c75e, red0: 0x5a1e22, red1: 0x8a3030, teal: 0x7fb3a6, ink: 0x07090f,
};

// ---------------------------------------------------------------------------------------------
// Deterministic helpers
export function hash(x, y, s = 0) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 982451653)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
export const bayer = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];
export const mix = (a, b, t) => {
  const r = ((a >> 16) & 255) + (((b >> 16) & 255) - ((a >> 16) & 255)) * t;
  const g = ((a >> 8) & 255) + (((b >> 8) & 255) - ((a >> 8) & 255)) * t;
  const bl = (a & 255) + ((b & 255) - (a & 255)) * t;
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(bl);
};
export const css = (c, a = 1) => a >= 1 ? '#' + c.toString(16).padStart(6, '0') : `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`;

// ---------------------------------------------------------------------------------------------
// Painter: a tiny RGBA raster with alpha blending.
export function painter(w, h) {
  const d = new Uint8ClampedArray(w * h * 4);
  const p = { w, h, d };
  p.px = (x, y, c, a = 1) => {
    x = Math.floor(x); y = Math.floor(y);
    if (c == null || x < 0 || y < 0 || x >= w || y >= h || a <= 0) return;
    const i = (y * w + x) << 2;
    const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
    if (a >= 1 || d[i + 3] === 0) { d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = a >= 1 ? 255 : a * 255; return; }
    d[i] += (r - d[i]) * a; d[i + 1] += (g - d[i + 1]) * a; d[i + 2] += (b - d[i + 2]) * a;
    d[i + 3] = Math.max(d[i + 3], a * 255);
  };
  p.get = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return -1;
    const i = (y * w + x) << 2; return d[i + 3] ? (d[i] << 16) | (d[i + 1] << 8) | d[i + 2] : -1;
  };
  p.rect = (x, y, rw, rh, c, a = 1) => { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) p.px(x + i, y + j, c, a); };
  p.hl = (x, y, len, c, a = 1) => { for (let i = 0; i < len; i++) p.px(x + i, y, c, a); };
  p.vl = (x, y, len, c, a = 1) => { for (let j = 0; j < len; j++) p.px(x, y + j, c, a); };
  p.ell = (cx, cy, rx, ry, c, a = 1) => {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) p.px(x, y, typeof c === 'function' ? c(x, y, dx, dy) : c, a);
    }
  };
  p.line = (x0, y0, x1, y1, c, a = 1) => {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) { p.px(x0, y0, c, a); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
  };
  // dithered fill: colour c2 where bayer < t
  p.dith = (x, y, rw, rh, c1, c2, t) => { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) p.px(x + i, y + j, bayer(x + i, y + j) < t ? c2 : c1); };
  p.blit = (s, x, y, fn) => {
    for (let j = 0; j < s.h; j++) for (let i = 0; i < s.w; i++) {
      const k = (j * s.w + i) << 2; const a = s.d[k + 3]; if (!a) continue;
      let c = (s.d[k] << 16) | (s.d[k + 1] << 8) | s.d[k + 2];
      if (fn) c = fn(c, i, j);
      p.px(x + i, y + j, c, a / 255);
    }
  };
  // 1px outline around opaque pixels
  p.outline = (c) => {
    const copy = new Uint8ClampedArray(d);
    const op = (x, y) => x >= 0 && y >= 0 && x < w && y < h && copy[((y * w + x) << 2) + 3] > 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!op(x, y) && (op(x - 1, y) || op(x + 1, y) || op(x, y - 1) || op(x, y + 1))) p.px(x, y, c);
  };
  return p;
}

// Desaturate a colour toward Tide silver (amt 0..1).
export function tideTint(c, amt) {
  const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
  const L = 0.3 * r + 0.55 * g + 0.15 * b;
  const tr = L * 0.82 + 8, tg = L * 0.86 + 11, tb = L * 0.96 + 20;
  return (Math.round(r + (tr - r) * amt) << 16) | (Math.round(g + (tg - g) * amt) << 8) | Math.round(b + (tb - b) * amt);
}
export function desaturated(src, amt) {
  const out = painter(src.w, src.h); out.d.set(src.d);
  const d = out.d;
  for (let i = 0; i < d.length; i += 4) if (d[i + 3]) {
    const c = tideTint((d[i] << 16) | (d[i + 1] << 8) | d[i + 2], amt);
    d[i] = (c >> 16) & 255; d[i + 1] = (c >> 8) & 255; d[i + 2] = c & 255;
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Small reusable primitives (draw into any painter)

// Block with moonlight from the upper left: light left column/top row, dark right column.
export function block(p, x, y, w, h, mid, light, dark) {
  p.rect(x, y, w, h, mid);
  p.vl(x, y, h, light); p.hl(x, y, w, light);
  p.vl(x + w - 1, y, h, dark);
}
// Lamp-post: iron pole, lantern head. Returns head position.
export function lampPost(p, x, base, h, lit) {
  p.vl(x, base - h + 2, h - 2, K.iron1);
  p.px(x, base - 1, K.iron2);
  p.px(x - 1, base - h + 1, K.iron0); p.px(x + 1, base - h + 1, K.iron0);
  p.px(x, base - h + 1, lit ? K.am4 : K.win2);
  p.px(x, base - h, K.iron0);
  return { x, y: base - h + 1 };
}
export function tree(p, x, base, r, kind = 'round') {
  if (kind === 'cypress') {
    p.vl(x, base - 1, 2, K.wd1);
    p.ell(x + 0.5, base - r - 1, r * 0.45 + 0.6, r, (px, py, dx, dy) => dx < -0.2 && dy < 0.2 ? K.moss3 : dx > 0.3 ? K.moss0 : K.moss1);
    return;
  }
  p.vl(x, base - 2, 3, K.wd1);
  p.ell(x + 0.5, base - r - 1, r, r * 0.9, (px, py, dx, dy) => {
    const l = -dx * 0.6 - dy * 0.8 + (hash(px, py, 7) - 0.5) * 0.5;
    return l > 0.55 ? K.moss4 : l > 0.1 ? K.moss3 : l > -0.45 ? K.moss2 : K.moss1;
  });
}
// Simple townhouse. kind: 0 gable-side, 1 gable-front, 2 copper hip. Returns window list.
export function house(p, x, base, w, h, rnd, opts = {}) {
  const wins = [];
  const roofH = Math.max(3, Math.round(h * 0.42));
  const wallH = h - roofH;
  const kind = opts.kind ?? Math.floor(rnd() * 3);
  const wallRamp = rnd() < 0.7 ? [K.st2, K.st3, K.st1] : rnd() < 0.5 ? [K.pla0, K.pla1, K.st1] : [K.st1, K.st2, K.st0];
  const roofRamp = kind === 2 ? [K.cu1, K.cu3, K.cu0, K.cu2] : rnd() < 0.72 ? [K.sl2, K.sl4, K.sl0, K.sl3] : [K.pl1, K.pl3, K.pl0, K.pl2];
  const wy = base - wallH + 1;
  // outline silhouette
  p.rect(x - 1, wy, w + 2, wallH, K.ink);
  // shadow to lower right
  p.vl(x + w + 1, wy + 1, wallH, K.gnd0, 0.7);
  block(p, x, wy, w, wallH, wallRamp[0], wallRamp[1], wallRamp[2]);
  p.hl(x, base, w, K.st0);
  // windows
  const step = w >= 9 ? 3 : 2;
  const rows = wallH >= 6 ? 2 : 1;
  for (let r = 0; r < rows; r++) {
    const yy = wy + 1 + r * 3;
    for (let xx = x + 1 + ((w - 1) % step === 0 ? 1 : 0); xx < x + w - 1; xx += step) {
      if (r === rows - 1 && Math.abs(xx - (x + (w >> 1))) < 1 && rows > 1) continue;
      p.px(xx, yy, K.win); if (wallH >= 5 && r === 0) p.px(xx, yy + 1, K.win2);
      wins.push({ x: xx, y: yy });
    }
  }
  // door
  const dx = x + (w >> 1);
  p.vl(dx, base - 1, 2, K.wd0);
  // roof
  const ry = wy - roofH;
  if (kind === 1) {
    // front gable: triangle
    for (let j = 0; j < roofH + 1; j++) {
      const half = Math.round(((j + 1) / (roofH + 1)) * (w / 2 + 1));
      const cx = x + w / 2;
      for (let i = Math.floor(cx - half); i < Math.ceil(cx + half); i++) {
        const edge = i === Math.floor(cx - half) || i === Math.ceil(cx + half) - 1;
        p.px(i, ry + j, edge ? K.ink : i < cx ? roofRamp[1] : roofRamp[3]);
      }
    }
    p.px(Math.floor(x + w / 2), ry - 1, K.ink);
    // gable window
    if (roofH >= 4) { p.px(Math.floor(x + w / 2), ry + roofH - 1, K.win); wins.push({ x: Math.floor(x + w / 2), y: ry + roofH - 1 }); }
  } else {
    // side roof, slight overhang, tile rows
    const inset = kind === 2 ? 1 : 0;
    for (let j = 0; j < roofH; j++) {
      const l = x - 1 + (kind === 2 ? Math.max(0, roofH - 1 - j) * inset : 0), r = x + w + (kind === 2 ? -Math.max(0, roofH - 1 - j) * inset : 0);
      for (let i = l; i <= r; i++) {
        let c = j === 0 ? roofRamp[1] : (j % 2 === 0 ? roofRamp[3] : roofRamp[0]);
        if (i === l || i === r) c = K.ink;
        if (j === roofH - 1) c = i === l || i === r ? K.ink : roofRamp[2];
        p.px(i, ry + j, c);
      }
    }
    p.hl(x - 1 + (kind === 2 ? (roofH - 1) * inset : 0), ry - 1, w + 2 - (kind === 2 ? 2 * (roofH - 1) * inset : 0), K.ink);
    if (rnd() < 0.45) { const cx = x + 1 + Math.floor(rnd() * (w - 3)); p.rect(cx, ry - 2, 2, 2, K.st1); p.px(cx, ry - 2, K.st2); p.hl(cx, ry - 3, 2, K.ink); }
  }
  return wins;
}

// ---------------------------------------------------------------------------------------------
// MAP GEOMETRY
export const MAP_W = 240, MAP_H = 320;
export const WALLS = [60, 92, 126, 160, 194, 228, 262];
export const SEA_Y = 290;
export const riverX = (y) => 112 + 9 * Math.sin((y - 30) / 34);
export const riverW = (y) => 6 + Math.max(0, y - 30) * 0.05 + (y > 262 ? (y - 262) * 0.75 : 0);
export const wallLine = (k, x) => WALLS[k] + Math.round(1.6 * Math.sin(x / 29 + k * 1.9) + 0.6 * Math.sin(x / 7 + k));
export const ridgeY = (x) => {
  const g = Math.abs(x - 119);
  const notch = g < 22 ? (22 - g) * 0.75 : 0;
  return Math.round(29 + 3 * Math.sin(x / 13) + 2 * Math.sin(x / 5.3 + 1) - (x > 150 ? (x - 150) * 0.05 : 0) + notch);
};

// Landmark specs: w, h, anchor (ax, ay) inside the sprite, map anchor (mx, my).
const R = (y) => Math.round(riverX(y));
export const LANDMARKS = {
  M1: { w: 52, h: 28, mx: 166, my: 284 },
  M2: { w: 52, h: 24, mx: 60, my: 256 },
  M3: { w: 38, h: 32, mx: 178, my: 256 },
  M4: { w: 34, h: 38, mx: 54, my: 222 },
  M5: { w: 50, h: 46, mx: 182, my: 222 },
  M6: { w: 62, h: 30, mx: R(189), my: 189, ay: 10 },
  M7: { w: 40, h: 34, mx: 186, my: 154 },
  M8: { w: 46, h: 48, mx: 40, my: 154 },
  M9: { w: 42, h: 38, mx: 172, my: 120 },
  M10: { w: 42, h: 36, mx: 214, my: 86 },
  M11: { w: 54, h: 30, mx: 50, my: 86 },
  M12: { w: 66, h: 40, mx: R(58), my: 58 },
  archive: { w: 46, h: 50, mx: 176, my: 55 },
};
for (const s of Object.values(LANDMARKS)) { s.ax = s.ax ?? s.w >> 1; s.ay = s.ay ?? s.h - 1; s.x0 = s.mx - s.ax; s.y0 = s.my - s.ay; }
export const DISTRICT_IDS = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];
const centre = (id) => { const s = LANDMARKS[id]; return { x: s.x0 + (s.w >> 1), y: s.y0 + (s.h >> 1) }; };
export const DISTRICT_POS = Object.fromEntries(DISTRICT_IDS.map((id) => [id, centre(id)]));
export const ARCHIVE_POS = centre('archive');

const ROUTE = [
  [[150, 281], [150, 258], [60, 258]],
  [[60, 258], [178, 258]],
  [[140, 258], [140, 224], [54, 224]],
  [[54, 224], [182, 224]],
  [[150, 224], [150, 189], [134, 189]],
  [[134, 189], [150, 189], [150, 156], [186, 156]],
  [[186, 156], [40, 156]],
  [[54, 122], [172, 122]],
  [[140, 122], [140, 88], [214, 88]],
  [[214, 88], [50, 88]],
  [[50, 88], [80, 88], [80, 56], [89, 56]],
  [[150, 56], [176, 56]],
];

// ---------------------------------------------------------------------------------------------
// LANDMARK SPRITES (map scale). Each returns { p, lights:[{x,y,r}] } in sprite coordinates.
function lmQuay(lit) {
  const s = LANDMARKS.M1, p = painter(s.w, s.h), L = [];
  // warehouse (crooked, gable front) left
  const wx = 2, base = 22;
  p.rect(wx - 1, 8, 18, 15, K.ink);
  block(p, wx, 9, 16, 14, K.wd1, K.wd2, K.wd0);
  for (let j = 10; j < 22; j += 2) p.hl(wx + 1, j, 14, K.wd0, 0.5);
  for (let j = 0; j < 7; j++) { const half = j + 2; for (let i = 10 - half; i < 10 + half; i++) p.px(wx + i - 2, 2 + j, i === 10 - half || i === 9 + half ? K.ink : i < 9 ? K.sl3 : K.sl2); }
  p.rect(wx + 6, 15, 4, 7, K.wd0); p.vl(wx + 8, 15, 7, K.iron1);
  [[wx + 2, 11], [wx + 13, 11], [wx + 7, 5]].forEach(([x, y]) => { p.px(x, y, lit ? K.am3 : K.win); if (lit) L.push({ x, y, r: 2 }); });
  // crane
  p.vl(wx + 17, 4, 18, K.wd2); p.hl(wx + 17, 4, 8, K.wd2); p.vl(wx + 24, 5, 6, K.iron2); p.rect(wx + 23, 11, 3, 2, K.wd1);
  // crates and barrels
  p.rect(20, 18, 4, 4, K.wd2); p.hl(20, 18, 4, K.wd3); p.rect(24, 19, 3, 3, K.wd1); p.ell(29, 20.5, 1.6, 2, K.wd2);
  // guild sign: big lantern on a bracket
  p.hl(30, 6, 5, K.iron1); p.vl(30, 6, 10, K.iron1);
  p.rect(33, 7, 3, 4, K.iron0); p.rect(34, 8, 1, 2, lit ? K.am4 : K.win2); if (lit) L.push({ x: 34, y: 8, r: 4 });
  // two rows of lamp-posts
  for (let i = 0; i < 5; i++) { const h = lampPost(p, 31 + i * 4, 20, 8, lit); if (lit) L.push({ ...h, r: 3 }); }
  for (let i = 0; i < 6; i++) { const h = lampPost(p, 28 + i * 4, 27, 9, lit); if (lit) L.push({ ...h, r: 3 }); }
  return { p, lights: L };
}
function lmGallery(lit) {
  const s = LANDMARKS.M2, p = painter(s.w, s.h), L = [];
  // plinth and steps
  p.rect(1, 20, 50, 4, K.st1); p.hl(1, 20, 50, K.st3); p.hl(3, 22, 46, K.st2);
  // inner wall (dark), columns
  p.rect(2, 9, 48, 11, K.st0);
  for (let i = 0; i < 11; i++) {
    const cx = 3 + i * 4.5 | 0;
    p.vl(cx, 9, 11, K.st4); p.vl(cx + 1, 9, 11, K.st2); p.hl(cx - 1, 9, 4, K.st3); p.hl(cx - 1, 19, 4, K.st3);
    if (i < 10) { const lx = cx + 3; p.px(lx, 13, lit ? K.am3 : K.win2); p.px(lx, 14, lit ? K.am1 : K.win); if (lit) L.push({ x: lx, y: 13, r: 2 }); }
  }
  // entablature
  p.rect(1, 6, 50, 3, K.st3); p.hl(1, 6, 50, K.st5); p.hl(1, 8, 50, K.st1);
  // long roof
  for (let j = 0; j < 4; j++) p.hl(2 + j, 2 + j, 48 - 2 * j, j === 0 ? K.ink : j === 1 ? K.sl4 : K.sl2);
  for (let j = 2; j < 6; j++) { p.px(2 + j - 1, j, K.ink); p.px(50 - j + 1, j, K.ink); }
  // central pediment
  for (let j = 0; j < 6; j++) for (let i = -j - 1; i <= j + 1; i++) p.px(26 + i, j + 1, Math.abs(i) === j + 1 ? K.ink : j > 3 ? K.st3 : K.st5);
  p.px(26, 4, lit ? K.am4 : K.st2); if (lit) L.push({ x: 26, y: 4, r: 2 });
  p.hl(0, 23, 52, K.ink);
  return { p, lights: L };
}
function lmHallFaces(lit) {
  const s = LANDMARKS.M3, p = painter(s.w, s.h), L = [];
  const cx = 19;
  // drum (cylinder): shaded bands
  for (let x = 3; x <= 35; x++) {
    const t = (x - 3) / 32;
    const c = t < 0.15 ? K.st4 : t < 0.4 ? K.st3 : t < 0.75 ? K.st2 : t < 0.9 ? K.st1 : K.st0;
    const top = 13 + Math.round(2 * (1 - Math.sin(Math.PI * t)));
    p.vl(x, top, 31 - top, c);
  }
  p.vl(2, 15, 16, K.ink); p.vl(36, 15, 16, K.ink);
  // frieze of carved faces (masks)
  for (let i = 0; i < 8; i++) { const x = 5 + i * 4; p.px(x, 20, K.st5); p.px(x + 1, 20, K.st5); p.px(x, 21, K.st1); p.px(x + 1, 21, K.st1); p.px(x, 22, K.st3); }
  p.hl(3, 18, 33, K.st5, 0.6); p.hl(3, 24, 33, K.st1);
  // shallow cone roof
  for (let j = 0; j < 12; j++) {
    const half = 3 + j * 1.45;
    for (let x = Math.floor(cx - half); x <= Math.ceil(cx + half); x++) {
      const t = (x - (cx - half)) / (2 * half);
      const edge = x === Math.floor(cx - half) || x === Math.ceil(cx + half);
      p.px(x, 2 + j, edge ? K.ink : t < 0.3 ? K.pl3 : t < 0.65 ? K.pl2 : K.pl1);
    }
  }
  p.hl(1, 14, 37, K.ink); p.hl(2, 13, 35, K.pl0);
  p.rect(cx - 1, 0, 3, 2, K.st4); p.px(cx, 0, lit ? K.am4 : K.st3);
  // door
  p.rect(cx - 2, 25, 5, 6, K.ink); p.rect(cx - 1, 26, 3, 5, lit ? K.am2 : K.wd0); p.px(cx, 26, lit ? K.am4 : K.wd1);
  if (lit) L.push({ x: cx, y: 28, r: 4 });
  // braziers
  for (const bx of [cx - 7, cx + 7]) { p.vl(bx, 27, 4, K.iron1); p.hl(bx - 1, 27, 3, K.iron2); p.px(bx, 26, lit ? K.am4 : K.iron0); if (lit) L.push({ x: bx, y: 26, r: 3 }); }
  p.hl(1, 31, 36, K.ink);
  return { p, lights: L };
}
function lmCounting(lit) {
  const s = LANDMARKS.M4, p = painter(s.w, s.h), L = [];
  // steep black roof
  for (let j = 0; j < 14; j++) {
    const half = 2 + j * 0.95;
    for (let x = Math.floor(17 - half); x <= Math.ceil(16 + half); x++) {
      const edge = x === Math.floor(17 - half) || x === Math.ceil(16 + half);
      p.px(x, j, edge ? K.ink : x < 16 ? (j % 3 === 0 ? K.sl1 : K.sl2) : (j % 3 === 0 ? K.sl0 : K.sl1));
    }
  }
  // dormer
  p.rect(14, 7, 6, 5, K.tb1); p.rect(15, 9, 4, 3, K.pla1); p.rect(16, 9, 2, 2, lit ? K.am3 : K.win); if (lit) L.push({ x: 16, y: 10, r: 2 });
  p.hl(13, 6, 8, K.ink);
  // three jettied floors, widening upward
  const floors = [[3, 14, 28, 8], [4, 22, 26, 7], [5, 29, 24, 8]];
  floors.forEach(([x, y, w, h], f) => {
    p.rect(x - 1, y, w + 2, h, K.ink);
    p.rect(x, y, w, h, K.pla1); p.vl(x, y, h, K.pla2);
    p.hl(x, y, w, K.tb0); p.hl(x, y + h - 1, w, K.tb0);
    for (let i = 0; i < w; i += 4) p.vl(x + i, y, h, K.tb0);
    for (let i = 0; i < w - 4; i += 4) { p.line(x + i, y + h - 1, x + i + 3, y + 1, K.tb1); }
    // windows (leaded)
    for (let i = 2; i < w - 1; i += 4) {
      if (f === 2 && i > 9 && i < 15) continue;
      const on = lit && (i + f) % 3 !== 1;
      p.rect(x + i, y + 2, 2, h - 4, K.win); p.px(x + i, y + 2, on ? K.am4 : K.win2); p.px(x + i + 1, y + 2, on ? K.am2 : K.win);
      if (on) { p.px(x + i, y + 3, K.am2); L.push({ x: x + i, y: y + 2, r: 2 }); }
    }
  });
  // door and coin sign
  p.rect(14, 31, 5, 6, K.tb0); p.rect(15, 32, 3, 5, K.wd1);
  p.hl(28, 30, 4, K.iron1); p.ell(31, 33, 2, 2, lit ? K.gold : K.st2); p.px(31, 33, lit ? K.am1 : K.st1);
  p.hl(2, 37, 30, K.ink);
  return { p, lights: L };
}
function lmMarket(lit) {
  const s = LANDMARKS.M5, p = painter(s.w, s.h), L = [];
  const tx = 20;
  // Mother Clock tower
  p.rect(tx - 1, 9, 12, 32, K.ink);
  block(p, tx, 10, 10, 31, K.st2, K.st4, K.st1);
  for (let j = 14; j < 40; j += 3) p.hl(tx + 1, j, 8, K.st1, 0.5);
  // copper spire
  for (let j = 0; j < 10; j++) { const half = 1 + j * 0.55; for (let x = Math.floor(tx + 5 - half); x <= Math.ceil(tx + 4 + half); x++) p.px(x, j, x === Math.floor(tx + 5 - half) || x === Math.ceil(tx + 4 + half) ? K.ink : x < tx + 5 ? K.cu3 : K.cu1); }
  p.px(tx + 4, 0, K.gold);
  // clock face
  p.ell(tx + 5, 16, 3.6, 3.6, K.ink); p.ell(tx + 5, 16, 2.8, 2.8, lit ? K.cream : K.st3);
  p.vl(tx + 4, 14, 2, K.tb0); p.hl(tx + 4, 16, 2, K.tb0);
  if (lit) { p.px(tx + 5, 12, K.am3); L.push({ x: tx + 5, y: 16, r: 5 }); }
  // belfry
  p.rect(tx + 2, 22, 2, 4, K.ink); p.rect(tx + 6, 22, 2, 4, K.ink); p.px(tx + 2, 22, lit ? K.am2 : K.win2); p.px(tx + 6, 22, lit ? K.am2 : K.win2);
  p.rect(tx + 3, 34, 4, 7, K.wd0);
  // gear
  p.ell(tx + 5, 29, 2, 2, K.st4); p.px(tx + 5, 29, K.st1); p.px(tx + 5, 26, K.st4); p.px(tx + 5, 32, K.st4); p.px(tx + 2, 29, K.st4); p.px(tx + 8, 29, K.st4);
  // stalls with striped awnings
  const stalls = [[1, 34, K.am1], [10, 37, K.cu2], [32, 35, K.red1], [41, 38, K.pl3]];
  stalls.forEach(([x, y, c]) => {
    p.rect(x, y + 3, 8, 5, K.wd1); p.hl(x, y + 3, 8, K.wd3);
    p.hl(x - 1, y - 1, 10, K.ink);
    for (let i = 0; i < 10; i++) { p.px(x - 1 + i, y, i % 2 ? c : K.cream); p.px(x - 1 + i, y + 1, i % 2 ? c : K.cream); p.px(x - 1 + i, y + 2, i % 2 ? mix(c, K.ink, 0.4) : K.pla1); }
    p.px(x + 1, y + 5, K.am2); p.px(x + 4, y + 5, K.cu3); p.px(x + 6, y + 5, K.red1);
    if (lit) { p.px(x + 7, y + 3, K.am4); L.push({ x: x + 7, y: y + 3, r: 2 }); }
  });
  p.hl(0, 45, 50, K.ink);
  return { p, lights: L };
}
function lmBridge(lit) {
  const s = LANDMARKS.M6, p = painter(s.w, s.h), L = [];
  const deck = 10;
  // arch ring (ellipse upper half) from x 8..53, crown at deck+1, feet at bottom
  const cx = 30.5, rx = 23, ry = 19, cy = deck + 20;
  for (let x = 6; x <= 55; x++) {
    const dx = (x - cx) / rx; if (Math.abs(dx) > 1) continue;
    const y = Math.round(cy - ry * Math.sqrt(1 - dx * dx));
    p.px(x, y, K.white); p.px(x, y + 1, K.st4); p.px(x, y + 2, K.st2);
    if (x % 4 === 2 && y > deck + 2) p.vl(x, deck + 2, y - deck - 2, K.st4);
  }
  // abutments
  p.rect(0, deck, 7, s.h - deck, K.st3); p.vl(0, deck, s.h - deck, K.st5); p.vl(6, deck, s.h - deck, K.st1);
  p.rect(55, deck, 7, s.h - deck, K.st3); p.vl(55, deck, s.h - deck, K.st5); p.vl(61, deck, s.h - deck, K.st1);
  // deck
  p.hl(0, deck - 1, 62, K.ink); p.hl(0, deck, 62, K.white); p.hl(0, deck + 1, 62, K.st4); p.hl(0, deck + 2, 62, K.st2);
  // railing
  p.hl(0, deck - 4, 62, K.st5);
  for (let x = 0; x < 62; x += 3) p.vl(x, deck - 3, 3, K.st4);
  // lamp posts with pennants of many tongues
  const flags = [K.am2, K.cu3, K.red1, K.pl3, K.gold];
  [4, 19, 31, 43, 57].forEach((x, i) => {
    p.vl(x, deck - 9, 9, K.iron1); p.px(x, deck - 10, lit ? K.am4 : K.win2);
    if (lit) L.push({ x, y: deck - 10, r: 3 });
    p.rect(x + 1, deck - 9, 2, 2, flags[i]);
  });
  return { p, lights: L };
}
function lmScriptorium(lit) {
  const s = LANDMARKS.M7, p = painter(s.w, s.h), L = [];
  // main hall
  p.rect(2, 14, 36, 20, K.ink);
  block(p, 3, 15, 34, 18, K.st2, K.st3, K.st1);
  for (let j = 18; j < 33; j += 3) p.hl(4, j, 32, K.st1, 0.35);
  // steep plum roof
  for (let j = 0; j < 9; j++) p.hl(3 + Math.max(0, 8 - j) * 0, 6 + j, 34, j === 0 ? K.ink : j % 2 ? K.pl2 : K.pl1);
  p.vl(2, 6, 9, K.ink); p.vl(37, 6, 9, K.ink); p.hl(3, 6, 34, K.pl3);
  // bell-cote
  p.rect(17, 0, 6, 7, K.ink); p.rect(18, 1, 4, 5, K.st3); p.rect(19, 2, 2, 3, K.ink); p.px(19, 4, K.gold);
  // three tall pointed windows
  [8, 18, 28].forEach((x) => {
    p.rect(x, 19, 4, 10, K.ink);
    p.rect(x + 1, 19, 2, 10, lit ? K.am2 : K.win); p.px(x + 1, 19, lit ? K.am4 : K.win2); p.px(x + 2, 19, lit ? K.am3 : K.win2);
    p.px(x, 18, K.ink); p.px(x + 3, 18, K.ink); p.hl(x + 1, 17, 2, K.ink);
    p.hl(x + 1, 24, 2, lit ? K.am1 : K.win2);
    if (lit) L.push({ x: x + 1, y: 23, r: 3 });
  });
  // hanging scroll banner
  p.rect(14, 15, 3, 6, K.cream); p.hl(13, 15, 5, K.wd1); p.hl(14, 18, 3, K.am1);
  p.rect(22, 29, 4, 5, K.wd0);
  p.hl(1, 33, 38, K.ink);
  return { p, lights: L };
}
function lmStair(lit) {
  const s = LANDMARKS.M8, p = painter(s.w, s.h), L = [];
  // cliff face with a lit rim
  for (let y = 0; y < s.h; y++) {
    const l = 2 + Math.round(2 * Math.sin(y / 6) + 2 * hash(0, y >> 1, 3)), r = s.w - 2 - Math.round(2 * Math.sin(y / 5 + 2) + 2 * hash(1, y >> 1, 3));
    for (let x = l; x <= r; x++) {
      const n = hash(x >> 1, y >> 1, 11);
      let c = n > 0.8 ? K.rock4 : n > 0.45 ? K.rock3 : K.rock2;
      if (x === l) c = K.ink; else if (x === l + 1) c = K.rock4; else if (x === r) c = K.ink;
      p.px(x, y, c);
    }
  }
  for (let x = 4; x < s.w - 4; x++) p.px(x, 0, K.ink);
  // tide-line bands of weed near the foot
  for (let y = 38; y < 47; y += 3) for (let x = 3; x < 44; x++) if (hash(x, y, 5) > 0.4) p.px(x, y, y > 42 ? K.cu1 : K.cu0);
  // flights of steps cut into the face: [x0, y0, dir, steps]
  const flights = [[6, 45, 1, 11], [39, 33, -1, 11], [6, 21, 1, 11], [39, 9, -1, 5]];
  flights.forEach(([x0, y0, dir, n]) => {
    for (let i = 0; i < n; i++) {
      const x = x0 + dir * i * 3, y = y0 - i;
      for (let k = 0; k < 3; k++) { p.px(x + dir * k, y, K.st5); p.px(x + dir * k, y + 1, K.st3); p.px(x + dir * k, y + 2, K.st1); p.px(x + dir * k, y + 3, K.ink, 0.6); }
      p.px(x + dir * 3, y + 1, K.st2);
    }
    // balustrade dots on the outer edge
    for (let i = 0; i < n; i += 2) p.px(x0 + dir * i * 3 + 1, y0 - i - 2, K.st4);
  });
  // landings with lamps
  [[39, 34], [6, 22], [39, 10], [24, 4]].forEach(([x, y]) => {
    p.rect(x - 3, y, 7, 3, K.st3); p.hl(x - 3, y, 7, K.st5); p.hl(x - 3, y + 3, 7, K.ink);
    p.vl(x + 3, y - 4, 4, K.iron1); p.px(x + 3, y - 5, lit ? K.am4 : K.win2);
    if (lit) L.push({ x: x + 3, y: y - 5, r: 3 });
  });
  return { p, lights: L };
}
function lmMirror(lit) {
  const s = LANDMARKS.M9, p = painter(s.w, s.h), L = [];
  const towers = [[2, 16, 9, 21], [10, 9, 8, 28], [27, 12, 8, 25], [34, 18, 7, 19]];
  const glassFace = (x, y, w, h, seed) => {
    p.rect(x - 1, y - 1, w + 2, h + 1, K.ink);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const diag = (i + j + seed) % 7;
      let c = diag === 0 ? K.glass3 : diag === 1 ? K.glass2 : i < w / 2 ? K.glass1 : K.glass0;
      if (j % 4 === 3) c = K.st1;
      if (!lit) c = mix(c, K.st1, 0.35);
      p.px(x + i, y + j, c);
    }
    p.vl(x, y, h, K.st4);
  };
  towers.forEach(([x, y, w, h], i) => { glassFace(x, y, w, h, i * 3); p.hl(x - 1, y - 1, w + 2, K.st3); });
  // central spire
  const sx = 22;
  for (let j = 0; j < 36; j++) {
    const half = j < 14 ? j * 0.3 : 4.2;
    for (let x = Math.floor(sx - half); x <= Math.ceil(sx + half); x++) {
      const edge = x === Math.floor(sx - half) || x === Math.ceil(sx + half);
      let c = edge ? K.ink : x < sx ? ((x + j) % 5 === 0 ? K.glass3 : K.glass2) : ((x + j) % 5 === 0 ? K.glass2 : K.glass1);
      if (!lit && !edge) c = mix(c, K.st1, 0.35);
      p.px(x, j + 1, c);
    }
  }
  p.px(sx, 0, lit ? K.glass3 : K.st3);
  if (lit) { L.push({ x: sx, y: 3, r: 4, c: 'glass' }); [[5, 24], [13, 18], [30, 20], [37, 26]].forEach(([x, y]) => { p.px(x, y, K.am3); L.push({ x, y, r: 2 }); }); }
  p.rect(sx - 2, 31, 4, 6, K.ink); p.rect(sx - 1, 32, 2, 5, lit ? K.am2 : K.wd0);
  p.hl(0, 37, 42, K.ink);
  return { p, lights: L };
}
function lmRoads(lit) {
  const s = LANDMARKS.M10, p = painter(s.w, s.h), L = [];
  // curtain wall
  p.rect(0, 14, 42, 18, K.ink);
  block(p, 1, 15, 40, 17, K.st2, K.st3, K.st1);
  for (let j = 18; j < 32; j += 3) for (let i = 1 + ((j / 3) % 2) * 2; i < 41; i += 4) p.px(i, j, K.st1);
  for (let i = 1; i < 41; i += 3) p.rect(i, 12, 2, 2, K.st3);
  // twin towers
  for (const tx of [6, 28]) {
    p.rect(tx - 1, 5, 10, 28, K.ink);
    for (let x = tx; x < tx + 8; x++) p.vl(x, 6, 27, x < tx + 2 ? K.st4 : x < tx + 5 ? K.st3 : K.st1);
    for (let j = 0; j < 6; j++) for (let x = tx - 1 + Math.floor(j * 0.0); x < tx + 9; x++) { const half = 1 + j * 0.85; if (Math.abs(x + 0.5 - (tx + 4)) <= half) p.px(x, j, Math.abs(x + 0.5 - (tx + 4)) > half - 1 ? K.ink : x < tx + 4 ? K.sl4 : K.sl2); }
    p.rect(tx + 3, 12, 2, 3, lit ? K.am3 : K.win); if (lit) L.push({ x: tx + 3, y: 13, r: 2 });
  }
  // arch with portcullis (open) and road
  p.rect(16, 18, 10, 15, K.ink);
  p.ell(21, 19, 5, 4, K.ink);
  p.rect(17, 19, 8, 14, lit ? K.am0 : K.win);
  for (let x = 17; x < 25; x += 2) p.vl(x, 16, 4, K.iron2);
  // road beyond (lit by lanterns)
  p.rect(19, 25, 4, 8, lit ? K.am1 : K.gnd2); p.rect(20, 22, 2, 3, lit ? K.am2 : K.gnd2);
  [[15, 20], [26, 20]].forEach(([x, y]) => { p.px(x, y, lit ? K.am4 : K.win2); if (lit) L.push({ x, y, r: 3 }); });
  // banner
  p.rect(2, 16, 3, 7, K.red1); p.px(3, 18, K.gold); p.px(2, 22, K.ink); p.px(4, 22, K.ink);
  // signpost
  p.vl(38, 26, 9, K.wd2); p.rect(35, 26, 6, 2, K.wd3); p.rect(37, 29, 5, 2, K.wd3); p.px(40, 26, K.wd1);
  p.hl(0, 35, 42, K.ink);
  return { p, lights: L };
}
function lmAmphi(lit) {
  const s = LANDMARKS.M11, p = painter(s.w, s.h), L = [];
  const cx = 26.5, cy = 18;
  // seat tiers: concentric ellipse arcs (upper half), outer to inner
  for (let r = 0; r < 7; r++) {
    const rx = 26 - r * 2.6, ry = 16 - r * 1.8;
    p.ell(cx, cy, rx, ry, (x, y, dx, dy) => {
      if (dy > 0.15) return K.st1;
      const l = r % 2 === 0 ? (dx < -0.3 ? K.st4 : dx > 0.4 ? K.st2 : K.st3) : (dx < -0.3 ? K.st2 : K.st1);
      return l;
    });
  }
  // rim colonnade
  for (let x = 2; x < 52; x += 3) { const dx = (x - cx) / 26; const y = Math.round(cy - 16 * Math.sqrt(Math.max(0, 1 - dx * dx))); p.vl(x, y - 2, 3, K.st4); p.px(x, y - 3, K.st5); }
  // stage
  p.ell(cx, cy + 1, 9, 4, K.wd2); p.hl(cx - 7, cy, 15, K.wd3);
  // scaenae front wall with arches
  p.rect(5, 21, 44, 8, K.ink); block(p, 6, 22, 42, 7, K.st2, K.st4, K.st1);
  for (let x = 9; x < 46; x += 5) { p.rect(x, 24, 3, 5, K.ink); p.px(x + 1, 23, K.ink); if (lit) p.px(x + 1, 27, K.am1); }
  // braziers on the rim
  [[3, 16], [50, 16], [26, 1]].forEach(([x, y]) => { p.vl(x, y + 1, 3, K.iron1); p.px(x, y, lit ? K.am4 : K.iron2); if (lit) L.push({ x, y, r: 3 }); });
  if (lit) L.push({ x: 26, y: 18, r: 6 });
  p.hl(4, 29, 46, K.ink);
  return { p, lights: L };
}
function lmLetheGate(lit) {
  const s = LANDMARKS.M12, p = painter(s.w, s.h), L = [];
  // reservoir behind
  p.rect(8, 6, 50, 6, K.w2); p.hl(8, 6, 50, K.w4); for (let i = 10; i < 56; i += 5) p.hl(i, 8, 2, K.w3);
  // dam body
  p.rect(5, 11, 56, 29, K.ink);
  for (let y = 12; y < 39; y++) for (let x = 6; x < 60; x++) {
    const brick = ((y - 12) % 4 === 0) || ((x + ((y - 12) >> 2) * 3) % 7 === 0);
    p.px(x, y, brick ? K.st1 : x < 10 ? K.st3 : K.st2);
  }
  // walkway + parapet
  p.rect(5, 11, 56, 3, K.st3); p.hl(5, 11, 56, K.st5); p.hl(5, 13, 56, K.st1);
  for (let x = 6; x < 60; x += 3) p.rect(x, 9, 2, 2, K.st4);
  // 12 iron sluices
  for (let i = 0; i < 12; i++) {
    const x = 9 + i * 4;
    p.rect(x - 1, 16, 4, 18, K.ink);
    p.rect(x, 17, 2, 16, K.iron1); p.vl(x, 17, 16, K.iron2);
    p.hl(x, 21, 2, K.iron0); p.hl(x, 27, 2, K.iron0);
    p.px(x, 19, K.st3); p.px(x + 1, 30, K.st3);
    // spill
    p.px(x, 35, K.w4); p.px(x + 1, 36, K.foam); p.px(x, 37, K.w5);
  }
  // end towers
  for (const tx of [0, 57]) {
    p.rect(tx, 4, 9, 36, K.ink);
    for (let x = tx + 1; x < tx + 8; x++) p.vl(x, 5, 35, x < tx + 3 ? K.st4 : x < tx + 6 ? K.st3 : K.st1);
    for (let j = 0; j < 5; j++) { const half = 0.8 + j * 0.95; for (let x = tx; x < tx + 9; x++) if (Math.abs(x + 0.5 - (tx + 4.5)) <= half) p.px(x, j, Math.abs(x + 0.5 - (tx + 4.5)) > half - 1 ? K.ink : x < tx + 4 ? K.sl4 : K.sl2); }
    p.rect(tx + 3, 10, 2, 3, lit ? K.am3 : K.win); if (lit) L.push({ x: tx + 3, y: 11, r: 3 });
    p.rect(tx + 3, 22, 2, 3, lit ? K.am2 : K.win);
  }
  // walkway lanterns
  for (let i = 0; i < 4; i++) { const x = 17 + i * 11; p.px(x, 8, lit ? K.am4 : K.win2); p.px(x, 9, K.iron1); if (lit) L.push({ x, y: 8, r: 3 }); }
  return { p, lights: L };
}
function lmArchive(lit) {
  const s = LANDMARKS.archive, p = painter(s.w, s.h), L = [];
  const cx = 23;
  // terrace steps
  p.rect(3, 45, 40, 5, K.st2); p.hl(3, 45, 40, K.st4); p.hl(5, 47, 36, K.st3); p.hl(7, 49, 32, K.st1);
  // drum with pilasters
  p.rect(5, 27, 36, 19, K.ink);
  for (let x = 6; x < 40; x++) {
    const t = (x - 6) / 34;
    const c = t < 0.2 ? K.st5 : t < 0.5 ? K.st4 : t < 0.8 ? K.st3 : K.st2;
    p.vl(x, 28, 18, c);
  }
  for (let x = 8; x < 40; x += 5) { p.vl(x, 28, 18, K.st5); p.vl(x + 1, 28, 18, K.st2); }
  // tall arched windows (always warm in the Archive)
  for (let x = 11; x < 36; x += 5) { if (x === 21) continue; p.rect(x - 1, 31, 2, 7, K.ink); p.vl(x - 1, 32, 6, lit ? K.am2 : K.win); p.vl(x, 32, 6, lit ? K.am1 : K.win2); p.px(x - 1, 32, lit ? K.am4 : K.win2); if (lit) L.push({ x: x - 1, y: 34, r: 2 }); }
  // cornice
  p.hl(4, 26, 38, K.ink); p.hl(4, 27, 38, K.st5); p.hl(5, 28, 36, K.st2);
  // the green copper dome
  p.ell(cx, 27, 17.5, 18.5, (x, y, dx, dy) => (dy > 0 ? null : K.ink));
  p.ell(cx, 27, 16.5, 17.5, (x, y, dx, dy) => {
    if (dy > 0) return null;
    const l = -dx * 0.75 - dy * 0.45 + (hash(x, y, 4) - 0.5) * 0.18;
    let c = l > 0.75 ? K.cu5 : l > 0.45 ? K.cu4 : l > 0.15 ? K.cu3 : l > -0.25 ? K.cu2 : l > -0.55 ? K.cu1 : K.cu0;
    // ribs
    const ang = Math.round(dx * 6);
    if (Math.abs(dx * 6 - ang) < 0.12 && dy < -0.15) c = mix(c, K.cu0, 0.55);
    return c;
  });
  p.rect(5, 27, 36, 1, K.ink);
  // lantern cupola
  p.rect(cx - 3, 5, 7, 6, K.ink); p.rect(cx - 2, 6, 5, 4, K.st4); p.rect(cx - 1, 7, 3, 3, lit ? K.am3 : K.win); p.px(cx, 7, lit ? K.am5 : K.win2);
  p.hl(cx - 3, 4, 7, K.cu3); p.hl(cx - 2, 3, 5, K.cu2); p.px(cx, 2, K.cu3); p.vl(cx, 0, 2, K.gold);
  if (lit) L.push({ x: cx, y: 8, r: 5 });
  // bronze doors
  p.rect(cx - 4, 36, 9, 10, K.ink); p.rect(cx - 3, 37, 7, 9, lit ? K.am1 : K.wd1); p.vl(cx, 37, 9, K.am0); p.hl(cx - 3, 37, 7, lit ? K.am3 : K.wd2);
  p.px(cx - 1, 41, K.gold); p.px(cx + 1, 41, K.gold);
  if (lit) L.push({ x: cx, y: 43, r: 6 });
  return { p, lights: L };
}
const LM_DRAW = { M1: lmQuay, M2: lmGallery, M3: lmHallFaces, M4: lmCounting, M5: lmMarket, M6: lmBridge, M7: lmScriptorium, M8: lmStair, M9: lmMirror, M10: lmRoads, M11: lmAmphi, M12: lmLetheGate, archive: lmArchive };
const lmCache = new Map();
export function landmark(id, state) {
  const key = id + ':' + state;
  if (lmCache.has(key)) return lmCache.get(key);
  let out;
  if (state === 'restored') out = LM_DRAW[id](true);
  else { const raw = LM_DRAW[id](false); out = { p: desaturated(raw.p, state === 'current' ? 0.45 : 0.8), lights: [] }; }
  lmCache.set(key, out);
  return out;
}

// ---------------------------------------------------------------------------------------------
// MAP BASE LAYER (state independent). Returns { p, mask, windows, lamps, stars, waves, falls, flow }
let baseCache = null;
export function buildMapBase(fresh = false) {
  if (baseCache && !fresh) return baseCache;
  const W = MAP_W, H = MAP_H, p = painter(W, H);
  const rnd = rng(9001);
  const exempt = new Uint8Array(W * H); // 1 = sky, 2 = sea (not affected by restoration tint)
  const occ = new Uint8Array(W * H); // blocked for houses
  const block2 = (x, y, w, h) => { for (let j = Math.max(0, y); j < Math.min(H, y + h); j++) for (let i = Math.max(0, x); i < Math.min(W, x + w); i++) occ[j * W + i] = 1; };
  const free = (x, y, w, h) => { if (x < 0 || y < 0 || x + w > W || y + h > H) return false; for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (occ[j * W + i]) return false; return true; };

  // --- sky
  const ridge = []; for (let x = 0; x < W; x++) ridge[x] = ridgeY(x);
  for (let y = 0; y < 48; y++) for (let x = 0; x < W; x++) {
    const t = y / 46;
    const c = t < 0.25 ? K.sky0 : t < 0.5 ? (bayer(x, y) < (t - 0.25) * 4 ? K.sky1 : K.sky0) : t < 0.75 ? (bayer(x, y) < (t - 0.5) * 4 ? K.sky2 : K.sky1) : (bayer(x, y) < (t - 0.75) * 4 ? K.sky3 : K.sky2);
    p.px(x, y, c); exempt[y * W + x] = 1;
  }
  const stars = [];
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(rnd() * W), y = Math.floor(rnd() * 26);
    const b = rnd();
    p.px(x, y, b > 0.85 ? K.tide : b > 0.5 ? K.st2 : K.sl3);
    if (b > 0.8 && stars.length < 16) stars.push({ x, y, ph: rnd() * 6.28, big: b > 0.93 });
  }
  // far mountains
  for (let x = 0; x < W; x++) {
    const m = Math.round(20 + 4 * Math.sin(x / 21 + 2) + 3 * Math.sin(x / 8.7) + 1.5 * Math.sin(x / 3.1));
    for (let y = m; y < 48; y++) p.px(x, y, y === m ? K.mtn2 : y < m + 3 && hash(x, y, 2) > 0.6 ? K.mtn1 : K.mtn0);
  }
  // --- ridge & upper slopes
  for (let x = 0; x < W; x++) {
    for (let y = ridge[x]; y < 70; y++) {
      exempt[y * W + x] = 0;
      const n = hash(x >> 1, y >> 1, 21), n2 = hash(x, y, 22);
      let c = y === ridge[x] ? K.rock4 : y < ridge[x] + 2 ? K.rock3 : n > 0.62 ? K.heath2 : n > 0.3 ? K.heath1 : K.rock2;
      if (n2 > 0.93) c = K.heath3;
      if (n2 < 0.05) c = K.rock3;
      p.px(x, y, c);
    }
  }
  // --- terraces (bands)
  const bandTop = (k, x) => (k === 0 ? 44 : wallLine(k - 1, x) + 5);
  for (let k = 0; k <= WALLS.length; k++) {
    for (let x = 0; x < W; x++) {
      const t = bandTop(k, x), b = k < WALLS.length ? wallLine(k, x) : SEA_Y;
      for (let y = t; y < b; y++) {
        const n = hash(x, y, 31 + k);
        let c = n > 0.88 ? K.gnd2 : n > 0.4 ? K.gnd1 : K.gnd0;
        if (k === WALLS.length) c = (x + (y % 2) * 2) % 4 === 0 || y % 3 === 0 ? K.cob0 : K.cob1; // quay paving
        else if (k > 0 && (y - t === 10 || y - t === 11 || y - t === 12 || b - y <= 3)) c = ((x + (y % 2) * 2) % 4 === 0 || (y - t) % 3 === 0) ? K.gnd2 : n > 0.5 ? K.cob0 : K.gnd2; // lanes
        p.px(x, y, c);
      }
    }
  }
  // retaining walls
  for (let k = 0; k < WALLS.length; k++) {
    for (let x = 0; x < W; x++) {
      const y0 = wallLine(k, x);
      const seg = hash(x >> 3, k, 77);
      p.px(x, y0 - 1, seg > 0.5 ? K.st2 : K.st1); p.px(x, y0, seg > 0.3 ? K.st3 : K.st4);
      for (let j = 1; j < 5; j++) {
        const brick = j === 2 || (j === 4) || ((x + (j > 2 ? 3 : 0)) % 6 === 0);
        p.px(x, y0 + j, brick ? K.st0 : j === 1 ? K.st2 : K.st1);
      }
      p.px(x, y0 + 5, K.gnd0); p.px(x, y0 + 6, K.gnd0, 0.6);
      // ivy and hanging gardens spilling over the lip
      const iv = hash(x >> 2, k, 78);
      if (iv > 0.62) { const len = 1 + Math.floor(hash(x, k, 79) * (iv > 0.85 ? 5 : 3)); for (let j = 0; j < len; j++) p.px(x, y0 + j, j === 0 ? K.moss3 : hash(x, j, 80) > 0.4 ? K.moss2 : K.moss1); p.px(x, y0 - 1, K.moss3); }
    }
  }
  // --- outer slopes beyond city walls (left/right)
  const outer = (x, y) => x < 7 + Math.round(2 * Math.sin(y / 9)) || x > 232 + Math.round(2 * Math.sin(y / 11 + 1));
  for (let y = 44; y < SEA_Y + 6; y++) for (let x = 0; x < W; x++) if (outer(x, y)) {
    const n = hash(x >> 1, y >> 1, 41);
    p.px(x, y, n > 0.6 ? K.heath2 : n > 0.25 ? K.rock2 : K.rock1);
    if (hash(x, y, 42) > 0.9) p.px(x, y, K.rock3);
  }
  // --- the road over the Ammerhold (to the right of the Archive)
  const road = [[226, 62], [236, 54], [214, 46], [230, 36], [222, 28], [234, 20]];
  for (let i = 0; i < road.length - 1; i++) {
    const [x0, y0] = road[i], [x1, y1] = road[i + 1];
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let s = 0; s <= n; s++) { const x = Math.round(x0 + (x1 - x0) * s / n), y = Math.round(y0 + (y1 - y0) * s / n); if (y >= ridge[x] - 1) { p.px(x, y, K.cob1); p.px(x + 1, y, K.gnd2); p.px(x, y + 1, K.rock1); } }
  }
  // --- river & gorge
  const falls = [], flow = [];
  for (let y = ridge[R(30)] - 1; y < SEA_Y; y++) {
    const cx = riverX(y), hw = riverW(y) / 2;
    const l = Math.round(cx - hw), r = Math.round(cx + hw);
    for (let x = l - 2; x <= r + 2; x++) {
      exempt[y * W + x] = 0;
      if (x < l) { p.px(x, y, x === l - 2 ? K.rock3 : K.rock1); continue; }
      if (x > r) { p.px(x, y, x === r + 2 ? K.rock2 : K.rock0); continue; }
      const n = hash(x, y, 51);
      let c = x === l ? K.w0 : n > 0.9 ? K.w3 : n > 0.55 ? K.w2 : K.w1;
      if ((y + Math.round(x / 3)) % 5 === 0 && hash(x, y, 52) > 0.5) c = K.w3;
      p.px(x, y, c);
    }
    if (y % 3 === 0) flow.push({ x: Math.round(cx + (hash(y, 1, 53) - 0.5) * hw), y });
  }
  // waterfalls where the river drops over each terrace wall
  for (let k = 0; k < WALLS.length; k++) {
    const y0 = WALLS[k] - 1, cx = riverX(y0), hw = riverW(y0) / 2;
    const l = Math.round(cx - hw), r = Math.round(cx + hw);
    for (let x = l; x <= r; x++) for (let j = 0; j < 7; j++) p.px(x, y0 + j, (x + j) % 3 === 0 ? K.foam : j < 2 ? K.w5 : K.w4);
    for (let x = l - 1; x <= r + 1; x++) if (hash(x, k, 55) > 0.4) p.px(x, y0 + 7, K.w5);
    falls.push({ l, r, y: y0 });
  }
  // gorge cliffs at the top flanking the river
  for (let y = 30; y < 60; y++) {
    const cx = riverX(y), hw = riverW(y) / 2;
    for (let s of [-1, 1]) for (let j = 3; j < 7; j++) { const x = Math.round(cx + s * (hw + j)); if (y > ridge[x]) p.px(x, y, j === 3 ? K.rock0 : hash(x, y, 56) > 0.6 ? K.rock3 : K.rock2); }
  }
  // river corridor blocks houses
  for (let y = 30; y < H; y++) { const cx = riverX(y), hw = riverW(y) / 2 + 4; block2(Math.round(cx - hw), y, Math.round(hw * 2) + 1, 1); }

  // --- sea
  const waves = [];
  for (let y = SEA_Y; y < H; y++) {
    for (let x = 0; x < W; x++) {
      exempt[y * W + x] = 2;
      const t = (y - SEA_Y) / (H - SEA_Y);
      let c = t < 0.15 ? K.sea3 : t < 0.35 ? (bayer(x, y) < (t - 0.15) * 5 ? K.sea2 : K.sea3) : t < 0.7 ? (bayer(x, y) < (t - 0.35) * 2.8 ? K.sea1 : K.sea2) : K.sea1;
      p.px(x, y, c);
    }
  }
  for (let i = 0; i < 90; i++) {
    const y = SEA_Y + 2 + Math.floor(rnd() * (H - SEA_Y - 3)), x = Math.floor(rnd() * W), len = 2 + Math.floor(rnd() * 4);
    p.hl(x, y, len, y < SEA_Y + 10 ? K.sea4 : K.sea3);
    if (i < 60) waves.push({ x, y, len, ph: rnd() * 6.28 });
  }
  // river mouth fan
  for (let y = SEA_Y; y < SEA_Y + 10; y++) { const cx = riverX(SEA_Y), hw = riverW(SEA_Y) / 2 + (y - SEA_Y) * 1.5; for (let x = Math.round(cx - hw); x <= cx + hw; x++) if (bayer(x, y) < 0.55 - (y - SEA_Y) * 0.05) p.px(x, y, K.w3); }
  // seawall
  for (let x = 0; x < W; x++) {
    const cx = riverX(284), hw = riverW(284) / 2;
    if (x > cx - hw - 1 && x < cx + hw + 1) continue;
    p.px(x, 284, K.st4); p.px(x, 285, K.st2); p.px(x, 286, (x % 5) ? K.st1 : K.st0); p.px(x, 287, K.st1); p.px(x, 288, K.st0);
    p.px(x, 289, hash(x, 0, 61) > 0.4 ? K.foam : K.w5); if (hash(x, 1, 61) > 0.6) p.px(x, 290, K.w5);
  }
  // breakwater and harbour light (right)
  for (let y = SEA_Y - 2; y < 312; y++) { const x0 = 196 + Math.round((y - SEA_Y) * 0.3); p.rect(x0, y, 5, 1, y % 3 ? K.st2 : K.st1); p.px(x0, y, K.st3); p.px(x0 + 5, y, hash(x0, y, 62) > 0.5 ? K.foam : K.w4); p.px(x0 - 1, y, K.w4); }
  p.rect(201, 304, 4, 7, K.ink); p.rect(202, 305, 2, 6, K.st4); p.vl(203, 305, 6, K.st2); p.hl(201, 303, 4, K.red1);
  const lamps = [{ x: 202, y: 304, d: -1, r: 5 }];
  // rocks at the corners
  for (const [cx, cy, rr] of [[8, 300, 9], [22, 310, 5], [232, 298, 9], [222, 314, 4]]) {
    p.ell(cx, cy, rr, rr * 0.6, (x, y, dx, dy) => (dx < -0.2 && dy < 0 ? K.rock4 : dy < 0.2 ? K.rock3 : K.rock1));
    for (let x = cx - rr - 1; x <= cx + rr + 1; x++) if (hash(x, cy, 63) > 0.3) p.px(x, Math.round(cy + rr * 0.6), K.foam);
  }
  // boats
  const boat = (x, y, flip) => {
    p.hl(x + 1, y + 2, 9, K.w4, 0.7);
    p.hl(x, y, 10, K.wd2); p.hl(x + 1, y + 1, 8, K.wd1); p.px(x, y - 1, K.wd3); p.px(x + 9, y - 1, K.wd3);
    p.vl(x + 5, y - 9, 9, K.wd2); p.line(x + 5, y - 9, flip ? x + 1 : x + 9, y - 1, K.st2);
    p.px(x + 5, y - 10, K.am3); lamps.push({ x: x + 5, y: y - 10, d: 0, r: 3 });
  };
  boat(36, 301, false); boat(150, 306, true); boat(70, 312, true);

  // --- quay: lamp-posts along the seawall (part of district M1)
  for (let x = 12; x < 228; x += 5) {
    const cx = riverX(283), hw = riverW(283) / 2;
    if (Math.abs(x - cx) < hw + 3) continue;
    const s = LANDMARKS.M1; if (x > s.x0 + 24 && x < s.x0 + s.w) continue;
    const h = lampPost(p, x, 283, 7, false);
    lamps.push({ x: h.x, y: h.y, d: 0, r: 3, post: true });
  }
  // lamps along the river banks in the quay band
  for (let y = 266; y < 282; y += 5) { const cx = riverX(y), hw = riverW(y) / 2; for (const s of [-1, 1]) { const x = Math.round(cx + s * (hw + 3)); const h = lampPost(p, x, y, 5, false); lamps.push({ x: h.x, y: h.y, d: 0, r: 2, post: true }); } }

  // --- landmark footprints & routes block houses
  for (const id of Object.keys(LANDMARKS)) { const s = LANDMARKS[id]; block2(s.x0 - 2, s.y0 - 1, s.w + 4, s.h + 3); }
  // outer city walls and towers
  for (let y = 60; y < 284; y++) for (const side of [0, 1]) {
    const x0 = side ? 228 + Math.round(2 * Math.sin(y / 11 + 1)) : 7 + Math.round(2 * Math.sin(y / 9));
    p.px(x0, y, side ? K.st1 : K.st4); p.px(x0 + 1, y, K.st3); p.px(x0 + 2, y, K.st2); p.px(x0 + 3, y, side ? K.st0 : K.st1);
    if (y % 3 === 0) p.px(x0 + 1, y, K.st1);
    block2(x0 - 2, y, 7, 1);
  }
  for (let k = 0; k < WALLS.length; k++) for (const side of [0, 1]) {
    const y = WALLS[k] + 2, x0 = side ? 229 + Math.round(2 * Math.sin(y / 11 + 1)) : 8 + Math.round(2 * Math.sin(y / 9));
    p.ell(x0 + 0.5, y, 4, 3, K.ink); p.rect(x0 - 3, y - 3, 7, 7, K.ink);
    for (let x = x0 - 2; x <= x0 + 2; x++) p.vl(x, y - 3, 7, x < x0 ? K.st4 : x === x0 ? K.st3 : K.st1);
    for (let j = 0; j < 5; j++) { const half = 0.5 + j * 0.8; for (let x = x0 - 4; x <= x0 + 4; x++) if (Math.abs(x - x0) <= half) p.px(x, y - 8 + j, Math.abs(x - x0) > half - 1 ? K.ink : x <= x0 ? K.sl4 : K.sl2); }
    p.px(x0, y - 1, K.win); lamps.push({ x: x0, y: y - 1, d: -2, r: 2, win: true });
  }

  // routes (streets, stairs, bridges)
  const drawPath = (x, y) => { p.px(x - 1, y, K.cob1); p.px(x, y, K.cob2); p.px(x + 1, y, K.cob1); };
  for (const seg of ROUTE) {
    for (let i = 0; i < seg.length - 1; i++) {
      const [x0, y0] = seg[i], [x1, y1] = seg[i + 1];
      if (y0 === y1) {
        const a = Math.min(x0, x1), b = Math.max(x0, x1);
        block2(a - 1, y0 - 2, b - a + 3, 5);
        for (let x = a; x <= b; x++) {
          const cx = riverX(y0), hw = riverW(y0) / 2;
          if (Math.abs(x - cx) <= hw + 3) {
            // little bridge
            p.px(x, y0 - 2, K.st4); p.px(x, y0 - 1, K.st2); p.px(x, y0, K.cob2); p.px(x, y0 + 1, K.st3); p.px(x, y0 + 2, K.st1); p.px(x, y0 + 3, K.w0);
            if (Math.abs(x - cx) < hw - 1) p.px(x, y0 + 4, K.w0, 0.6);
          } else { p.px(x, y0 - 1, K.cob1); p.px(x, y0, K.cob2); p.px(x, y0 + 1, K.cob0); }
        }
      } else {
        const a = Math.min(y0, y1), b = Math.max(y0, y1);
        block2(x0 - 3, a - 1, 7, b - a + 2);
        for (let y = a; y <= b; y++) { p.px(x0 - 1, y, K.cob0); p.px(x0, y, y % 2 ? K.cob1 : K.cob2); p.px(x0 + 1, y, K.cob0); }
        // stairs over walls
        for (let k = 0; k < WALLS.length; k++) {
          const wy = wallLine(k, x0);
          if (wy > a && wy < b) for (let j = -1; j < 6; j++) { const c = j % 2 ? K.st1 : K.st4; p.hl(x0 - 2, wy + j, 5, c); p.px(x0 - 3, wy + j, K.ink); p.px(x0 + 3, wy + j, K.ink); }
        }
      }
    }
  }

  // --- gardens and courtyards (ground variety)
  for (let i = 0; i < 70; i++) {
    const x = 14 + Math.floor(rnd() * 212), y = 50 + Math.floor(rnd() * 225), rx = 3 + rnd() * 6, ry = 2 + rnd() * 2;
    if (!free(Math.floor(x - rx), Math.floor(y - ry), Math.ceil(rx * 2), Math.ceil(ry * 2))) continue;
    const c0 = p.get(x, y); if (c0 !== K.gnd0 && c0 !== K.gnd1 && c0 !== K.gnd2) continue;
    const plaza = rnd() < 0.3;
    p.ell(x, y, rx, ry, (px, py) => { const g = p.get(px, py); if (g !== K.gnd0 && g !== K.gnd1 && g !== K.gnd2) return null; return plaza ? ((px + py) % 3 ? K.cob0 : K.cob1) : hash(px, py, 81) > 0.7 ? K.moss2 : hash(px, py, 82) > 0.3 ? K.moss1 : K.moss0; });
    if (!plaza && rnd() < 0.6) { p.px(x, y, K.pl3); p.px(x + 2, y - 1, K.am2); }
    if (plaza && rnd() < 0.6) { p.ell(x, y, 1.5, 1, K.st3); p.px(x, y, K.w4); }
  }
  // --- houses
  const windows = [];
  const houses = [];
  const bands = [[44, 60]]; for (let k = 0; k < WALLS.length - 1; k++) bands.push([WALLS[k] + 5, WALLS[k + 1]]);
  bands.push([267, 283]);
  bands.forEach(([t, b], bi) => {
    const rows = bi === 0 ? [b - 2] : bi === bands.length - 1 ? [t + 9] : [t + 9, b - 5];
    rows.forEach((base, ri) => {
      let x = 12 + Math.floor(rnd() * 4);
      while (x < 226) {
        const w = 7 + Math.floor(rnd() * 7), h = (bi === bands.length - 1 ? 10 : 9) + Math.floor(rnd() * 5);
        const bb = base - Math.floor(rnd() * 2);
        if (free(x - 1, bb - h - 2, w + 3, h + 3) && rnd() > 0.1) {
          houses.push({ x, base: bb, w, h, seed: Math.floor(rnd() * 1e9) });
          block2(x - 1, bb - h - 1, w + 2, h + 2);
          x += w + 1 + Math.floor(rnd() * 3);
        } else x += 2;
      }
    });
    // infill: smaller houses wherever there is still room in the band
    if (bi > 0 && bi < bands.length - 1) for (let i = 0; i < 260; i++) {
      const w = 5 + Math.floor(rnd() * 6), h = 8 + Math.floor(rnd() * 3);
      const x = 12 + Math.floor(rnd() * (214 - w)), bb = t + 9 + Math.floor(rnd() * (b - t - 13));
      if (!free(x - 1, bb - h - 1, w + 2, h + 2)) continue;
      houses.push({ x, base: bb, w, h, seed: Math.floor(rnd() * 1e9) });
      block2(x - 1, bb - h - 1, w + 2, h + 2);
    }
  });
  houses.sort((a, b) => a.base - b.base);
  for (const hs of houses) {
    const r2 = rng(hs.seed);
    const ws = house(p, hs.x, hs.base, hs.w, hs.h, r2);
    for (const wnd of ws) windows.push(wnd);
  }
  // trees and gardens in leftover gaps
  const GROUND = new Set([K.gnd0, K.gnd1, K.gnd2, K.moss0, K.moss1, K.moss2]);
  for (let i = 0; i < 1600; i++) {
    const x = 12 + Math.floor(rnd() * 216), y = 52 + Math.floor(rnd() * 230);
    const r = 2 + Math.floor(rnd() * 2);
    if (!free(x - r, y - 2 * r - 1, 2 * r + 1, 2 * r + 2)) continue;
    if (!GROUND.has(p.get(x, y)) || !GROUND.has(p.get(x, y - 2 * r))) continue;
    if (rnd() < 0.35) {
      // small street furniture instead of a tree: crates, a well, a bench, a cart
      const kind = Math.floor(rnd() * 4);
      if (kind === 0) { p.rect(x - 1, y - 2, 3, 3, K.wd2); p.hl(x - 1, y - 2, 3, K.wd3); p.px(x + 2, y, K.wd1); }
      else if (kind === 1) { p.ell(x + 0.5, y - 1, 2, 1.5, K.st3); p.px(x, y - 1, K.w1); p.px(x + 1, y - 1, K.w1); p.vl(x - 1, y - 4, 3, K.wd2); p.vl(x + 2, y - 4, 3, K.wd2); p.hl(x - 1, y - 4, 4, K.wd3); }
      else if (kind === 2) { p.hl(x - 1, y - 1, 4, K.wd3); p.px(x - 1, y, K.wd1); p.px(x + 2, y, K.wd1); }
      else { p.rect(x - 2, y - 2, 5, 2, K.wd2); p.hl(x - 2, y - 2, 5, K.wd3); p.px(x - 1, y, K.iron2); p.px(x + 2, y, K.iron2); }
      block2(x - 2, y - 4, 5, 5); continue;
    }
    tree(p, x, y, r, rnd() < 0.3 ? 'cypress' : 'round');
    block2(x - r, y - 2 * r - 1, 2 * r + 1, 2 * r + 2);
  }
  // street lamps along routes (lit when the nearest district is restored)
  for (const seg of ROUTE) for (let i = 0; i < seg.length - 1; i++) {
    const [x0, y0] = seg[i], [x1, y1] = seg[i + 1];
    if (y0 !== y1) continue;
    for (let x = Math.min(x0, x1) + 6; x < Math.max(x0, x1) - 3; x += 14) {
      if (Math.abs(x - riverX(y0)) < riverW(y0) / 2 + 5) continue;
      if (p.get(x, y0 - 2) === K.ink) continue;
      const h = lampPost(p, x, y0 - 1, 5, false); lamps.push({ x: h.x, y: h.y, d: -2, r: 2, post: true });
    }
  }
  // assign every window and lamp to its nearest district (for lighting)
  const nodes = [...DISTRICT_IDS.map((id) => LANDMARKS[id]), LANDMARKS.archive];
  const nearest = (x, y) => { let bi = 0, bd = 1e9; nodes.forEach((s, i) => { const dx = s.mx - x, dy = (s.my - (s.h >> 1)) - y; const d = dx * dx + dy * dy * 1.6; if (d < bd) { bd = d; bi = i; } }); return bi; };
  for (const w of windows) w.d = nearest(w.x, w.y);
  for (const l of lamps) if (l.d === -2 || l.d === undefined) l.d = nearest(l.x, l.y);

  baseCache = { p, exempt, windows, lamps, stars, waves, falls, flow, nodes };
  return baseCache;
}

// ---------------------------------------------------------------------------------------------
// MAP STATE LAYER: tints the city by restoration, lights windows/lamps, places landmarks.
export function districtState(id, gates, current) {
  if (id === 'archive') return 'restored';
  if (gates.includes(id)) return 'restored';
  if (id === current) return 'current';
  return 'lost';
}
export function buildMapState(gates = [], current = 'M1') {
  const base = buildMapBase();
  const W = MAP_W, H = MAP_H;
  const out = painter(W, H); out.d.set(base.p.d);
  const states = base.nodes.map((s, i) => districtState(i < 12 ? DISTRICT_IDS[i] : 'archive', gates, current));
  const sval = states.map((s) => (s === 'restored' ? 1 : s === 'current' ? 0.45 : 0));
  const nx = base.nodes.map((s) => s.mx), ny = base.nodes.map((s) => s.my - (s.h >> 1));
  const d = out.d;
  // per-pixel restoration (inverse-distance weighting), quantised to 5 steps
  for (let y = 40; y < H; y++) for (let x = 0; x < W; x++) {
    const idx = y * W + x;
    if (base.exempt[idx]) continue;
    let sw = 0, sv = 0;
    for (let i = 0; i < nx.length; i++) { const dx = nx[i] - x, dy = (ny[i] - y) * 1.25; const q = dx * dx + dy * dy + 90; const wgt = 1 / (q * q); sw += wgt; sv += wgt * sval[i]; }
    const rr = sv / sw;
    let amt = 1 - rr;
    amt = Math.round(amt * 4 + (bayer(x, y) - 0.5) * 0.9) / 4;
    if (amt <= 0) continue;
    const i = idx << 2;
    const c = tideTint((d[i] << 16) | (d[i + 1] << 8) | d[i + 2], Math.min(1, amt) * 0.85);
    d[i] = (c >> 16) & 255; d[i + 1] = (c >> 8) & 255; d[i + 2] = c & 255;
  }
  // windows
  const lit = [];
  for (const w of base.windows) {
    const st = states[w.d];
    const on = st === 'restored' ? hash(w.x, w.y, 71) < 0.82 : st === 'current' ? hash(w.x, w.y, 71) < 0.25 : false;
    if (on) { out.px(w.x, w.y, hash(w.x, w.y, 72) > 0.7 ? K.am4 : K.am3); out.px(w.x, w.y + 1, K.am1, 0.8); lit.push({ x: w.x, y: w.y, r: 1, win: true }); }
  }
  for (const l of base.lamps) {
    const st = l.d < 0 ? 'restored' : states[l.d];
    if (st === 'restored') {
      if (l.post) { const gy = l.y + (l.r === 3 ? 7 : 5); out.ell(l.x + 0.5, gy, l.r + 2, 1.3, (x, y) => (bayer(x, y) < 0.5 ? K.am2 : null), 0.18); }
      out.px(l.x, l.y, K.am4); lit.push(l);
    }
  }
  // landmarks, back to front
  const order = Object.keys(LANDMARKS).sort((a, b) => LANDMARKS[a].my - LANDMARKS[b].my);
  for (const id of order) {
    const s = LANDMARKS[id];
    const st = districtState(id, gates, current);
    const lm = landmark(id, st);
    out.blit(lm.p, s.x0, s.y0);
    for (const l of lm.lights) lit.push({ x: s.x0 + l.x, y: s.y0 + l.y, r: l.r, c: l.c });
  }
  return { p: out, lights: lit, states: Object.fromEntries(DISTRICT_IDS.map((id, i) => [id, states[i]])) };
}

// ---------------------------------------------------------------------------------------------
// SHARED ANIMATED OVERLAYS (canvas 2D, called per frame; no allocations beyond cached strings)
const STR = {};
const col = (c, a = 1) => { const k = c * 10 + Math.round(a * 9); return STR[k] || (STR[k] = css(c, Math.round(a * 9) / 9)); };

export function drawStars(ctx, stars, t) {
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    const v = Math.sin(t * 1.7 + s.ph);
    ctx.fillStyle = v > 0.6 ? col(K.white) : v > -0.2 ? col(K.tide) : col(K.st2);
    ctx.fillRect(s.x, s.y, 1, 1);
    if (s.big && v > 0.75) { ctx.fillStyle = col(K.tide, 0.55); ctx.fillRect(s.x - 1, s.y, 1, 1); ctx.fillRect(s.x + 1, s.y, 1, 1); ctx.fillRect(s.x, s.y - 1, 1, 1); ctx.fillRect(s.x, s.y + 1, 1, 1); }
  }
}
export function drawWaves(ctx, waves, t) {
  for (let i = 0; i < waves.length; i++) {
    const w = waves[i];
    const v = Math.sin(t * 1.3 + w.ph);
    if (v > 0.55) { ctx.fillStyle = v > 0.85 ? col(K.w5) : col(K.w4); ctx.fillRect(w.x + Math.round(v * 2), w.y, w.len, 1); }
  }
}
// Warm glow halos around lights. Glow sprites are cached canvases.
const glowCache = new Map();
export function glowSprite(r, c = K.am3) {
  const key = r * 1e7 + c;
  if (glowCache.has(key)) return glowCache.get(key);
  const s = r * 2 + 1, gp = painter(s, s);
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    const d = Math.hypot(x - r, y - r) / (r + 0.5);
    if (d >= 1) continue;
    const a = (1 - d) * (1 - d) * 0.9;
    const q = Math.round(a * 4) / 4;
    if (q > 0) gp.px(x, y, c, q * 0.55);
  }
  const cv = toCanvas(gp);
  glowCache.set(key, cv);
  return cv;
}
export function drawLights(ctx, lights, t, frame) {
  for (let i = 0; i < lights.length; i++) {
    const l = lights[i];
    if (l.win) { if (((frame + i * 7) % 53) === 0) { ctx.fillStyle = col(K.am2); ctx.fillRect(l.x, l.y, 1, 1); } continue; }
    const flick = Math.sin(t * 9 + i * 1.7) * 0.5 + Math.sin(t * 23 + i) * 0.5;
    const r = l.r + (flick > 0.6 ? 1 : 0);
    const g = glowSprite(r, l.c === 'glass' ? K.glass3 : K.am3);
    ctx.globalAlpha = 0.75 + flick * 0.2;
    ctx.drawImage(g, l.x - r, l.y - r);
    ctx.globalAlpha = 1;
    ctx.fillStyle = flick > -0.3 ? col(l.c === 'glass' ? K.glass3 : K.am5) : col(K.am3);
    ctx.fillRect(l.x, l.y, 1, 1);
  }
}
// Pixel fog puff sprite (Tide silver, banded alpha).
const fogCache = new Map();
export function fogSprite(w = 34, h = 12, seed = 1) {
  const key = w * 1e6 + h * 1e3 + seed;
  if (fogCache.has(key)) return fogCache.get(key);
  const fp = painter(w, h);
  const blobs = [[w * 0.5, h * 0.55, w * 0.48, h * 0.42], [w * 0.32, h * 0.45, w * 0.24, h * 0.45], [w * 0.66, h * 0.4, w * 0.22, h * 0.4]];
  const r = rng(seed);
  blobs.forEach((b) => { b[0] += (r() - 0.5) * w * 0.1; });
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let m = 0;
    for (const [cx, cy, rx, ry] of blobs) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; m = Math.max(m, 1 - (dx * dx + dy * dy)); }
    if (m <= 0) continue;
    const a = m > 0.55 ? 0.62 : m > 0.25 ? 0.42 : (bayer(x, y) < 0.5 ? 0.28 : 0);
    if (!a) continue;
    const top = y < h * 0.4 && m > 0.3;
    fp.px(x, y, top ? K.tide3 : y > h * 0.7 ? K.tide2 : K.tide, a);
  }
  const cv = toCanvas(fp);
  fogCache.set(key, cv);
  return cv;
}
export function drawFog(ctx, puffs, t) {
  for (let i = 0; i < puffs.length; i++) {
    const f = puffs[i];
    const dx = Math.round(Math.sin(t * f.sp + f.ph) * f.amp);
    const dy = Math.round(Math.sin(t * f.sp * 0.7 + f.ph * 2) * 1.2);
    ctx.globalAlpha = f.a;
    ctx.drawImage(fogSprite(f.w, f.h, f.seed), f.x + dx, f.y + dy);
  }
  ctx.globalAlpha = 1;
}
export function drawFalls(ctx, falls, frame) {
  for (let i = 0; i < falls.length; i++) {
    const f = falls[i];
    const h = f.h || 6;
    for (let x = f.l; x <= f.r; x++) {
      const j = (x * 5 + frame) % h;
      ctx.fillStyle = col(K.foam); ctx.fillRect(x, f.y + j, 1, 1);
      if (h > 3) { ctx.fillStyle = col(K.w5, 0.8); ctx.fillRect(x, f.y + ((j + (h >> 1)) % h), 1, 1); }
    }
  }
}
export function drawFlow(ctx, flow, frame) {
  ctx.fillStyle = col(K.w4);
  for (let i = (frame % 4); i < flow.length; i += 4) { const f = flow[(i + frame) % flow.length]; ctx.fillRect(f.x, f.y, 2, 1); }
}

// Same contract as pixel/core.js reducedMotion (kept local so this module has no JSX dependency).
export const reducedMotion = () => typeof document !== 'undefined' && (document.documentElement.dataset.motion === 'reduced' || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

// Browser helper: painter -> canvas (call only in the browser)
export function toCanvas(p) {
  const c = typeof OffscreenCanvas !== 'undefined' && typeof document === 'undefined' ? new OffscreenCanvas(p.w, p.h) : document.createElement('canvas');
  c.width = p.w; c.height = p.h;
  c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(p.d), p.w, p.h), 0, 0);
  return c;
}

// Fog puffs over lost districts (+ ambient river mist).
export function mapFog(states) {
  const puffs = [];
  DISTRICT_IDS.forEach((id, i) => {
    const st = states[id];
    if (st === 'restored') return;
    const s = LANDMARKS[id];
    const cx = s.x0 + s.w / 2, cy = s.y0 + s.h / 2;
    const n = st === 'current' ? 1 : 4;
    for (let j = 0; j < n; j++) {
      const r = rng(i * 31 + j);
      const w = 30 + Math.floor(r() * 16), h = 10 + Math.floor(r() * 5);
      puffs.push({ x: Math.round(cx - w / 2 + (r() - 0.5) * s.w * 0.7), y: Math.round(cy - h / 2 + (j - n / 2) * 7 + (r() - 0.5) * 4), w, h, seed: i * 7 + j, amp: 4 + r() * 5, sp: 0.25 + r() * 0.25, ph: r() * 6.28, a: st === 'current' ? 0.35 : 0.8 });
    }
  });
  for (let y = 60; y < 290; y += 34) { const r = rng(y); puffs.push({ x: Math.round(riverX(y) - 18), y: y - 4, w: 36, h: 9, seed: 500 + y, amp: 6, sp: 0.2 + r() * 0.2, ph: r() * 6, a: 0.3 }); }
  return puffs;
}

// =============================================================================================
// SCENES: title backdrop (320x180) and district banners (192x64)
// =============================================================================================
function skyGrad(p, y0, y1, seed, stops = [K.sky0, K.sky1, K.sky2, K.sky3, K.sky4]) {
  const n = stops.length - 1;
  for (let y = y0; y < y1; y++) {
    const t = ((y - y0) / Math.max(1, y1 - y0)) * n;
    const i = Math.min(n - 1, Math.floor(t)), f = t - i;
    for (let x = 0; x < p.w; x++) p.px(x, y, bayer(x, y) < f ? stops[i + 1] : stops[i]);
  }
}
function starField(p, out, x0, y0, w, h, count, seed) {
  const r = rng(seed);
  for (let i = 0; i < count; i++) {
    const x = x0 + Math.floor(r() * w), y = y0 + Math.floor(r() * h), b = r();
    p.px(x, y, b > 0.9 ? K.tide3 : b > 0.6 ? K.tide2 : K.sl3);
    if (b > 0.82) out.stars.push({ x, y, ph: r() * 6.28, big: b > 0.95 });
  }
}
// Distant rooftops silhouette with a few windows.
function skyline(p, base, seed, lit, out, h0 = 6, h1 = 14, c = K.mtn0, edge = K.mtn1) {
  const r = rng(seed);
  let x = -2;
  while (x < p.w) {
    const w = 6 + Math.floor(r() * 10), h = h0 + Math.floor(r() * (h1 - h0)), gable = r() < 0.5;
    for (let i = 0; i < w; i++) {
      const roof = gable ? Math.round(Math.min(i, w - 1 - i) * 0.7) : 0;
      const top = base - h - roof;
      for (let y = top; y < base; y++) p.px(x + i, y, y === top ? edge : c);
    }
    if (r() < 0.35) { p.rect(x + 2, base - h - 3, 2, 3, c); }
    for (let k = 0; k < 2; k++) if (r() < 0.6) { const wx = x + 2 + Math.floor(r() * (w - 4)), wy = base - 2 - Math.floor(r() * (h - 3)); const on = lit && r() < 0.75; p.px(wx, wy, on ? K.am2 : K.win2); if (on && r() < 0.25) out.lights.push({ x: wx, y: wy, r: 1 }); }
    x += w + (r() < 0.3 ? 1 : 0);
  }
}
function cobbles(p, x0, y0, w, h, seed) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const row = y - y0, off = (row % 2) * 3;
    const joint = row % 3 === 2 || (x + off) % 6 === 0;
    const n = hash(x, y, seed);
    p.px(x, y, joint ? K.gnd0 : n > 0.7 ? K.cob2 : n > 0.3 ? K.cob1 : K.cob0);
  }
}
function brick(p, x0, y0, w, h, ramp, seed = 1) {
  const [c0, c1, c2] = ramp;
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const row = (y - y0) % 4, course = Math.floor((y - y0) / 4);
    const joint = row === 3 || (x - x0 + (course % 2) * 4) % 8 === 0;
    p.px(x, y, joint ? c0 : hash(x >> 2, y >> 2, seed) > 0.75 ? c2 : c1);
  }
}
function waterBand(p, out, y0, y1, seed, deep = false) {
  for (let y = y0; y < y1; y++) for (let x = 0; x < p.w; x++) {
    const t = (y - y0) / Math.max(1, y1 - y0);
    p.px(x, y, deep ? (bayer(x, y) < t ? K.sea1 : K.sea2) : (bayer(x, y) < t ? K.w1 : K.w2));
  }
  const r = rng(seed);
  for (let i = 0; i < (y1 - y0) * p.w / 40; i++) {
    const x = Math.floor(r() * p.w), y = y0 + 1 + Math.floor(r() * (y1 - y0 - 1)), len = 2 + Math.floor(r() * 5);
    p.hl(x, y, len, deep ? K.sea3 : K.w3);
    if (r() < 0.6) out.waves.push({ x, y, len, ph: r() * 6.28 });
  }
}
function lantern(p, out, x, y, lit, big = false) {
  // hanging/post lantern head centred on x, top at y
  const w = big ? 5 : 3, h = big ? 6 : 4;
  p.rect(x - (w >> 1) - 1, y, w + 2, h + 1, K.ink);
  p.hl(x - (w >> 1), y - 1, w, K.iron1);
  p.rect(x - (w >> 1), y + 1, w, h - 1, lit ? K.am3 : K.win2);
  if (lit) { p.px(x, y + 1 + (h >> 1) - 1, K.am5); if (big) p.vl(x - 1, y + 2, h - 3, K.am4); out.lights.push({ x, y: y + (h >> 1), r: big ? 7 : 5 }); }
  else p.px(x - (w >> 1), y + 1, K.st2);
}
function postLamp(p, out, x, base, h, lit, big) {
  p.rect(x - 2, base - 3, 5, 3, K.ink); p.rect(x - 1, base - 3, 3, 3, K.iron1); p.px(x - 1, base - 3, K.iron2);
  p.vl(x - 1, base - h, h - 3, K.ink); p.vl(x + 1, base - h, h - 3, K.ink);
  p.vl(x, base - h, h, K.iron2); p.px(x, base - h + 2, K.st3);
  if (big) { p.hl(x - 2, base - h, 5, K.iron1); p.px(x - 2, base - h + 1, K.iron1); p.px(x + 2, base - h + 1, K.iron1); }
  p.hl(x - 1, base - h - 1, 3, K.iron0);
  lantern(p, out, x, base - h - (big ? 7 : 5), lit, big);
}
function column(p, x, y, w, h) {
  for (let i = 0; i < w; i++) { const t = i / (w - 1); p.vl(x + i, y, h, t < 0.25 ? K.st5 : t < 0.55 ? K.st4 : t < 0.85 ? K.st3 : K.st1); }
  for (let i = 1; i < w - 1; i += 2) p.vl(x + i, y + 2, h - 4, K.st2, 0.35);
  p.rect(x - 1, y, w + 2, 2, K.st4); p.hl(x - 1, y, w + 2, K.st5);
  p.rect(x - 1, y + h - 2, w + 2, 2, K.st3); p.hl(x - 1, y + h - 1, w + 2, K.st1);
}
function roofTiles(p, x, y, w, h, ramp, slope = 0) {
  for (let j = 0; j < h; j++) {
    const l = x + Math.round((h - 1 - j) * slope), r = x + w - 1 - Math.round((h - 1 - j) * slope);
    for (let i = l; i <= r; i++) {
      let c = j % 3 === 2 ? ramp[0] : ((i + (Math.floor(j / 3) % 2) * 2) % 4 === 0 ? ramp[0] : ramp[1]);
      if (j === 0) c = ramp[2];
      if (i === l || i === r) c = K.ink;
      p.px(i, y + j, c);
    }
  }
  p.hl(x + Math.round((h - 1) * slope), y - 1, w - 2 * Math.round((h - 1) * slope), K.ink);
}
function gableHouse(p, out, x, base, w, h, lit, seed, ramp = [K.sl1, K.sl2, K.sl4]) {
  const r = rng(seed);
  const wallH = Math.round(h * 0.55), roofH = h - wallH;
  p.rect(x - 1, base - wallH, w + 2, wallH, K.ink);
  block(p, x, base - wallH, w, wallH, K.st2, K.st3, K.st1);
  for (let j = 0; j <= roofH; j++) { const half = (j / roofH) * (w / 2 + 1); for (let i = Math.floor(x + w / 2 - half); i <= Math.ceil(x + w / 2 + half - 1); i++) p.px(i, base - wallH - roofH + j, (i === Math.floor(x + w / 2 - half) || i === Math.ceil(x + w / 2 + half - 1)) ? K.ink : i < x + w / 2 ? ramp[2] : ramp[1]); }
  for (let wy = base - wallH + 2; wy < base - 3; wy += 4) for (let wx = x + 2; wx < x + w - 2; wx += 4) { const on = lit && r() < 0.8; p.rect(wx, wy, 2, 2, on ? K.am3 : K.win); if (on) { p.px(wx, wy, K.am4); if (r() < 0.3) out.lights.push({ x: wx, y: wy, r: 2 }); } }
  p.rect(x + (w >> 1) - 1, base - 4, 3, 4, K.wd0);
}

// ---- Title scene -----------------------------------------------------------------------------
export const TITLE_W = 320, TITLE_H = 180;
let titleCache = null;
export function buildTitle() {
  if (titleCache) return titleCache;
  const W = TITLE_W, H = TITLE_H, p = painter(W, H);
  const out = { lights: [], stars: [], waves: [], fog: [], reflections: [] };
  skyGrad(p, 0, 118, 1, [K.sky0, K.sky0, K.sky1, K.sky2, K.sky3, K.sky4, K.skyRim]);
  starField(p, out, 0, 0, W, 90, 170, 77);
  // crescent moon (upper left, away from the logo)
  p.ell(36, 26, 8, 8, (x, y, dx, dy) => { const ex = (x + 0.5 - 39.5) / 7.5, ey = (y + 0.5 - 24) / 7.5; return ex * ex + ey * ey < 1 ? null : dx < -0.4 ? K.cream : K.tide3; });
  for (let a = 0; a < 40; a++) { const ang = a / 40 * 6.28; const x = Math.round(36 + Math.cos(ang) * 11), y = Math.round(26 + Math.sin(ang) * 11); if (bayer(x, y) < 0.3) p.px(x, y, K.sky4); }
  // far mountains
  for (let x = 0; x < W; x++) {
    const m = Math.round(98 + 6 * Math.sin(x / 31 + 1) + 3 * Math.sin(x / 11) + 1.5 * Math.sin(x / 4.3));
    for (let y = m; y < 118; y++) p.px(x, y, y === m ? K.mtn2 : y < m + 2 ? K.mtn1 : K.mtn0);
  }
  // sea
  for (let y = 112; y < 168; y++) for (let x = 0; x < W; x++) { const t = Math.min(1, (y - 112) / 38); p.px(x, y, t < 0.08 ? K.sea4 : bayer(x, y) < t ? K.sea1 : K.sea2); }
  for (let i = 0; i < 160; i++) { const r = hash(i, 1, 90), x = Math.floor(hash(i, 2, 90) * W), y = 113 + Math.floor(r * 36); const len = 2 + Math.floor(hash(i, 3, 90) * (2 + r * 6)); p.hl(x, y, len, y < 120 ? K.sea4 : K.sea3); if (i < 90) out.waves.push({ x, y, len, ph: hash(i, 4, 90) * 6.28 }); }
  // moon path on the water
  for (let y = 113; y < 148; y += 2) { const w = 2 + Math.floor((y - 113) / 6), x = 36 - (w >> 1) + Math.round((hash(y, 0, 91) - 0.5) * 6); p.hl(x, y, w, K.tide2); out.waves.push({ x, y, len: w, ph: y * 0.7, moon: true }); }
  // the Ammerhold cliff (right) and city
  const cliffTop = (x) => (x < 150 ? 200 : Math.round(118 - (x - 150) * 0.42 + 3 * Math.sin(x / 9)));
  for (let x = 140; x < W; x++) {
    const top = Math.max(52, cliffTop(x));
    for (let y = top; y < 150; y++) { const n = hash(x >> 1, y >> 1, 92); p.px(x, y, y === top ? K.rock4 : n > 0.72 ? K.rock3 : n > 0.3 ? K.rock2 : K.rock1); }
  }
  // gorge where the Lethe comes down
  const gx = (y) => 214 + Math.round(6 * Math.sin(y / 14));
  for (let y = 60; y < 142; y++) { const c = gx(y), hw = 2 + Math.round((y - 60) / 18); for (let x = c - hw - 2; x <= c + hw + 2; x++) p.px(x, y, x < c - hw ? K.rock0 : x > c + hw ? K.rock1 : ((y * 3 + x) % 11 === 0 ? K.w4 : (y + x) % 4 === 0 ? K.w3 : K.w2)); }
  // tiers of houses up the cliff
  const r = rng(321);
  for (let tier = 0; tier < 7; tier++) {
    const base = 140 - tier * 11;
    const x0 = 150 + tier * 18, x1 = W;
    // terrace wall
    for (let x = x0 - 4; x < x1; x++) { if (Math.abs(x - gx(base)) < 4) continue; const g = hash(x >> 2, tier, 99); p.px(x, base, g > 0.75 ? K.moss2 : K.st2); p.px(x, base + 1, g > 0.85 ? K.moss1 : K.st1); p.px(x, base + 2, K.st0); }
    let x = x0;
    while (x < x1 - 4) {
      const w = 6 + Math.floor(r() * 7), h = 8 + Math.floor(r() * 6);
      if (Math.abs(x + w / 2 - gx(base)) < w / 2 + 4) { x += 4; continue; }
      const tower = r() < 0.09 && tier > 0;
      const wall = tower ? h + 6 : h - 4 - (tier === 6 ? 0 : 0);
      const fade = tier * 0.035; // upper tiers sit further back
      const wc = [mix(K.sl2, K.sky2, fade), mix(K.sl3, K.sky2, fade), mix(K.sl1, K.sky1, fade)];
      p.rect(x - 1, base - wall, w + 2, wall, K.ink);
      block(p, x, base - wall, w, wall, wc[0], wc[1], wc[2]);
      const kind = tower ? 3 : Math.floor(r() * 3);
      const roof = r() < 0.28 ? [K.cu1, K.cu3, K.cu0] : r() < 0.3 ? [K.pl1, K.pl3, K.pl0] : [K.sl1, K.sl3, K.sl0];
      const top = base - wall;
      if (kind === 0) { for (let j = 0; j < 4; j++) p.hl(x - 1 + (j < 1 ? 1 : 0), top - 4 + j, w + 2 - (j < 1 ? 2 : 0), j === 0 ? K.ink : j === 1 ? roof[1] : roof[0]); }
      else if (kind === 1 || kind === 3) {
        const rh = kind === 3 ? Math.round(w * 1.1) : Math.ceil(w / 2) + 1;
        for (let j = 0; j < rh; j++) { const half = ((j + 1) / rh) * (w / 2 + 1); for (let i = Math.floor(x + w / 2 - half); i <= Math.ceil(x + w / 2 + half - 1); i++) p.px(i, top - rh + j, i === Math.floor(x + w / 2 - half) || i === Math.ceil(x + w / 2 + half - 1) ? K.ink : i < x + w / 2 ? roof[1] : roof[0]); }
        if (kind === 3) { p.vl(Math.floor(x + w / 2), top - rh - 3, 3, K.gold); }
      } else { p.hl(x - 1, top - 1, w + 2, K.ink); for (let i = 0; i < w; i += 2) p.px(x + i, top - 2, wc[1]); }
      if (r() < 0.3 && kind !== 3) { const cx = x + 1 + Math.floor(r() * (w - 2)); p.rect(cx, top - 6, 2, 3, K.sl1); p.hl(cx, top - 7, 2, K.ink); }
      for (let wy = top + 1; wy < base - 2; wy += 3) for (let k = 0; k < w - 2; k += 3) if (r() < (tower ? 0.5 : 0.62)) { const wx = x + 1 + k; p.px(wx, wy, r() < 0.2 ? K.am4 : K.am3); if (r() < 0.15) out.lights.push({ x: wx, y: wy, r: 1 }); }
      x += w + 1 + Math.floor(r() * 2);
    }
  }
  // the Archive near the top with its copper dome
  const ax = 276, ay = 62;
  p.rect(ax - 12, ay - 2, 25, 10, K.ink); block(p, ax - 11, ay - 1, 23, 9, K.st3, K.st4, K.st2);
  for (let i = -8; i <= 8; i += 4) { p.vl(ax + i, ay, 7, K.am3); out.lights.push({ x: ax + i, y: ay + 2, r: 1 }); }
  p.ell(ax + 0.5, ay - 2, 10.5, 11.5, (x, y, dx, dy) => (dy > 0 ? null : dx < -0.35 && dy < -0.2 ? K.cu4 : dx < 0.1 ? K.cu3 : dx < 0.55 ? K.cu2 : K.cu1));
  p.hl(ax - 11, ay - 2, 23, K.st4);
  p.rect(ax - 1, ay - 17, 3, 4, K.st4); p.px(ax, ay - 16, K.am4); p.vl(ax, ay - 20, 3, K.gold);
  out.lights.push({ x: ax, y: ay - 16, r: 6 });
  const hill = (x) => Math.round(150 + 6 * Math.sin(x / 40 + 0.5) + 3 * Math.sin(x / 13) + Math.max(0, x - 170) * 0.09);
  // the quay at the foot: lamps reflected in the sea
  for (let x = 150; x < W; x++) { p.px(x, 141, K.st4); p.px(x, 142, K.st2); p.px(x, 143, K.st1); p.px(x, 144, K.st0); }
  for (let x = 156; x < W; x += 7) {
    if (Math.abs(x - gx(141)) < 5) continue;
    p.vl(x, 135, 6, K.iron1); p.px(x, 134, K.am4); out.lights.push({ x, y: 134, r: 3 });
    out.reflections.push({ x, y: 146, len: Math.max(0, hill(x) - 147) });
  }
  // Lethe mouth
  for (let y = 141; y < 150; y++) { const c = gx(141); for (let x = c - 4 - (y - 141); x <= c + 4 + (y - 141); x++) if (bayer(x, y) < 0.5) p.px(x, y, K.w3); }
  // silver mist rising off the river (animated puffs)
  for (let i = 0; i < 7; i++) out.fog.push({ x: 196 + (i % 3) * 8 - 10, y: 126 - i * 10, w: 30 + (i % 2) * 8, h: 9, seed: 900 + i, amp: 5 + i, sp: 0.18 + i * 0.03, ph: i * 1.3, a: 0.42 - i * 0.04 });
  out.fog.push({ x: 120, y: 132, w: 60, h: 12, seed: 950, amp: 10, sp: 0.12, ph: 0, a: 0.25 });
  // foreground: the coast road over heather and gorse
  for (let x = 0; x < W; x++) {
    const top = hill(x);
    for (let y = top; y < H; y++) {
      const n = hash(x >> 1, y >> 1, 95), n2 = hash(x, y, 96);
      let c = y === top ? K.heath3 : n > 0.6 ? K.heath2 : n > 0.25 ? K.heath1 : K.heath0;
      if (n2 > 0.994 && y > top + 2) c = n2 > 0.998 ? K.am2 : K.am1; // gorse flowers
      else if (n2 > 0.982 && y > top + 2) c = K.pl2; // heather
      p.px(x, y, c);
    }
    if (hash(x, 0, 97) > 0.6) p.px(x, top - 1, K.heath2);
  }
  const roadY = (x) => Math.round(166 - x * 0.02 + 3 * Math.sin(x / 50) + Math.max(0, x - 170) * 0.05);
  for (let x = 0; x < W; x++) { const y = roadY(x); for (let j = -3; j <= 3; j++) { const c = j === -3 ? K.heath0 : j === 3 ? K.rock1 : hash(x, j, 98) > 0.75 ? K.cob2 : K.cob1; p.px(x, y + j, c); } }
  // milestone and a wind-bent tree
  p.rect(140, roadY(140) - 9, 4, 6, K.ink); p.rect(141, roadY(140) - 8, 2, 5, K.st3); p.px(141, roadY(140) - 8, K.st4);
  for (let j = 0; j < 16; j++) { p.px(24 + Math.round(j * 0.45), 160 - j, K.wd1); p.px(25 + Math.round(j * 0.45), 160 - j, K.wd0); }
  p.line(30, 147, 22, 142, K.wd1); p.line(32, 146, 40, 141, K.wd1);
  p.ell(22, 140, 7, 3, (x, y, dx, dy) => (dy < -0.2 ? K.heath3 : K.heath2)); p.ell(39, 139, 9, 3.5, (x, y, dx, dy) => (dy < -0.2 && dx < 0.3 ? K.heath3 : K.heath2)); p.ell(31, 143, 5, 2.5, K.heath1);
  titleCache = { p, ...out, roadY };
  return titleCache;
}
// Traveller sprite frames (cloaked, hood, staff, lantern). 12 x 20.
const travCache = [];
export function travellerFrame(f) {
  if (travCache[f]) return travCache[f];
  const tp = painter(16, 25);
  const step = f % 2;
  // boots
  tp.rect(5, 21, 2, 3, K.tb1); tp.rect(8, 21, 2, 3, K.tb2); tp.hl(5, 23, 3, K.ink); tp.hl(8, 23, 3, K.ink);
  // cloak: moonlit left edge, lantern rim-light on the right, hem stirred by the wind
  for (let j = 0; j < 14; j++) {
    const half = 2 + Math.floor(j / 2.6);
    const sway = j > 9 ? (step ? -1 : 0) * (j - 9) : 0;
    for (let i = -half; i <= half; i++) {
      let c = i <= -half + 1 ? K.pl3 : i >= half ? K.am1 : i >= half - 1 && j > 3 ? K.pl2 : K.pl1;
      if (j === 13) c = K.pl0;
      tp.px(7 + i + sway, 8 + j, c);
    }
  }
  // fold lines
  tp.vl(6, 12, 8, K.pl0); tp.vl(9, 14, 6, K.pl0);
  // pack and bedroll on the back
  tp.rect(1, 9, 3, 6, K.wd1); tp.vl(1, 9, 6, K.wd2); tp.hl(1, 8, 3, K.pla0);
  // hood with the face in shadow, lit warm on one cheek
  tp.ell(7.5, 5, 3.6, 4.2, (x, y, dx, dy) => (dx < -0.35 ? K.pl3 : dx > 0.55 ? K.am1 : K.pl2));
  tp.rect(8, 4, 3, 3, K.ink); tp.px(10, 5, K.am2); tp.px(10, 6, K.pla1);
  tp.px(6, 1, K.pl3);
  // staff in the far hand
  tp.vl(3, 3, 21, K.wd2); tp.vl(2, 3, 2, K.wd3); tp.px(3, 2, K.wd3);
  // near arm reaching forward to the lantern
  tp.hl(10, 12, 3, K.pl1); tp.px(13, 12, K.pla1); tp.px(13, 13, K.iron1);
  tp.outline(K.ink);
  travCache[f] = tp;
  return tp;
}

// ---- District banners ------------------------------------------------------------------------
export const BANNER_W = 192, BANNER_H = 64;
export const BANNER_IDS = [...DISTRICT_IDS, 'archive', 'crypt'];
function bQuay(p, o, lit) {
  skyGrad(p, 0, 44, 0); starField(p, o, 0, 0, 192, 22, 30, 11);
  skyline(p, 36, 12, lit, o, 6, 16);
  // warehouse with hoist
  p.rect(5, 10, 40, 31, K.ink);
  for (let x = 6; x < 44; x++) p.vl(x, 18, 23, x < 9 ? K.wd3 : (x % 4 === 0 ? K.wd0 : K.wd2));
  for (let j = 0; j < 9; j++) { const half = 4 + j * 2.3; for (let x = Math.floor(25 - half); x <= Math.ceil(24 + half); x++) p.px(x, 9 + j, x <= Math.floor(25 - half) || x >= Math.ceil(24 + half) ? K.ink : x < 25 ? K.sl4 : K.sl2); }
  p.rect(20, 22, 10, 19, K.wd0); p.vl(25, 22, 19, K.wd1);
  [[10, 22], [36, 22], [23, 13]].forEach(([x, y]) => { p.rect(x, y, 3, 3, K.ink); p.px(x + 1, y + 1, lit ? K.am4 : K.win2); p.px(x, y + 1, lit ? K.am2 : K.win); if (lit) o.lights.push({ x: x + 1, y: y + 1, r: 3 }); });
  p.hl(30, 11, 16, K.wd2); p.vl(45, 11, 30, K.wd2); p.vl(41, 12, 8, K.iron2); p.rect(39, 20, 5, 3, K.wd1);
  // quay
  cobbles(p, 0, 41, 192, 6, 3);
  for (let x = 0; x < 192; x++) { p.px(x, 46, K.st4); p.px(x, 47, K.st2); p.px(x, 48, x % 7 ? K.st1 : K.st0); p.px(x, 49, K.st0); }
  waterBand(p, o, 50, 64, 4);
  // forty-four lamps... at this scale, a proud receding row of nine
  for (let i = 0; i < 9; i++) { const x = 58 + i * 16; postLamp(p, o, x, 44, 16, lit, true); if (lit) o.reflections.push({ x, y: 52 }); }
  // bollards, rope, barrels
  [64, 128].forEach((x) => { p.rect(x + 6, 42, 3, 3, K.iron1); p.px(x + 6, 42, K.iron2); });
  p.ell(50, 43, 2.5, 2.5, K.wd2); p.ell(50, 43, 1, 1, K.wd0);
  // a moored boat
  p.hl(96, 55, 26, K.wd2); p.hl(97, 56, 24, K.wd1); p.hl(99, 57, 20, K.wd0); p.vl(109, 40, 15, K.wd2); p.line(109, 41, 118, 54, K.st2);
}
function bGallery(p, o, lit) {
  skyGrad(p, 0, 10, 0);
  // roof
  roofTiles(p, 0, 2, 192, 6, [K.sl1, K.sl2, K.sl4]);
  p.rect(0, 8, 192, 5, K.st3); p.hl(0, 8, 192, K.st5); p.hl(0, 12, 192, K.st1);
  for (let x = 2; x < 192; x += 6) p.rect(x, 10, 3, 2, K.st4);
  // interior wall with paintings
  brick(p, 0, 13, 192, 38, [K.st0, K.pl0, K.pl1], 5);
  const r = rng(55);
  for (let i = 0; i < 12; i++) {
    const x0 = 2 + i * 16;
    column(p, x0, 13, 5, 38);
    const fx = x0 + 7, fy = 20 + (i % 2) * 2, fw = 8, fh = 12;
    p.rect(fx - 1, fy - 1, fw + 2, fh + 2, K.ink);
    p.rect(fx, fy, fw, fh, lit ? K.gold : K.st2); p.rect(fx + 1, fy + 1, fw - 2, fh - 2, lit ? K.am1 : K.st1);
    // the painting itself: a tiny landscape or portrait (blank when lost: the Tide takes pictures first)
    if (lit) {
      const kind = Math.floor(r() * 3);
      for (let y = 0; y < fh - 4; y++) for (let x = 0; x < fw - 4; x++) {
        let c = kind === 0 ? (y < 3 ? K.sky4 : y < 5 ? K.cu2 : K.moss3) : kind === 1 ? (y < 4 ? K.w3 : K.w2) : K.pl1;
        if (kind === 2 && Math.hypot(x - 1.5, y - 2.5) < 1.8) c = K.pla2;
        if (kind === 1 && y === 3 && x === 2) c = K.am4;
        p.px(fx + 2 + x, fy + 2 + y, c);
      }
    } else p.rect(fx + 2, fy + 2, fw - 4, fh - 4, K.tide2);
    if (i % 2 === 0) { p.vl(x0 + 11, 36, 4, K.iron1); p.px(x0 + 11, 35, lit ? K.am4 : K.iron2); if (lit) o.lights.push({ x: x0 + 11, y: 35, r: 5 }); }
  }
  column(p, 190, 13, 5, 38);
  // floor: checker tiles + steps
  for (let y = 51; y < 64; y++) for (let x = 0; x < 192; x++) {
    const s = Math.floor((x + (y - 51) * 2) / 6) + Math.floor((y - 51) / 3);
    p.px(x, y, y < 53 ? (y === 51 ? K.st4 : K.st2) : s % 2 ? K.st1 : K.st2);
  }
}
function bHallFaces(p, o, lit) {
  skyGrad(p, 0, 50, 0); starField(p, o, 0, 0, 192, 20, 35, 21);
  skyline(p, 58, 22, lit, o, 12, 24);
  const cx = 96;
  // drum
  for (let x = 46; x <= 146; x++) {
    const t = (x - 46) / 100;
    const c = t < 0.12 ? K.st4 : t < 0.35 ? K.st3 : t < 0.7 ? K.st2 : t < 0.88 ? K.st1 : K.st0;
    const top = 24 + Math.round(3 * (1 - Math.sin(Math.PI * t)));
    p.vl(x, top, 58 - top, c);
  }
  p.vl(45, 26, 32, K.ink); p.vl(147, 26, 32, K.ink);
  // frieze of carved faces
  p.hl(46, 30, 101, K.st5, 0.5); p.hl(46, 41, 101, K.st0);
  for (let i = 0; i < 12; i++) {
    const x = 50 + i * 8, t = (x - 46) / 100, shade = t > 0.7 ? 0.45 : 0;
    p.ell(x + 2.5, 35.5, 2.6, 3.6, mix(K.st4, K.st1, shade));
    p.px(x + 1, 35, K.ink); p.px(x + 4, 35, K.ink); p.hl(x + 2, 38, 2, mix(K.st1, K.ink, 0.5));
    if (i % 3 === 1) { p.px(x + 1, 36, K.st2); p.px(x + 4, 36, K.st2); } // a weeping one
  }
  // cone roof
  for (let j = 0; j < 22; j++) {
    const half = 6 + j * 2.35;
    for (let x = Math.floor(cx - half); x <= Math.ceil(cx + half); x++) {
      const t = (x - (cx - half)) / (2 * half);
      const edge = x === Math.floor(cx - half) || x === Math.ceil(cx + half);
      p.px(x, 3 + j, edge ? K.ink : (j % 4 === 3 ? K.pl0 : t < 0.25 ? K.pl3 : t < 0.6 ? K.pl2 : K.pl1));
    }
  }
  p.hl(43, 25, 107, K.ink); p.hl(44, 24, 105, K.pl0);
  p.rect(cx - 2, 0, 5, 4, K.st4); p.px(cx, 1, lit ? K.am4 : K.st2); if (lit) o.lights.push({ x: cx, y: 1, r: 4 });
  // the single door
  p.rect(cx - 6, 43, 13, 15, K.ink); p.ell(cx + 0.5, 44, 6, 4, K.ink);
  p.rect(cx - 5, 44, 11, 14, lit ? K.am1 : K.wd0); p.rect(cx - 3, 46, 7, 12, lit ? K.am2 : K.wd1); p.vl(cx, 46, 12, lit ? K.am3 : K.wd0);
  if (lit) o.lights.push({ x: cx, y: 50, r: 10 });
  cobbles(p, 0, 58, 192, 6, 7);
  for (const bx of [cx - 22, cx + 22]) { p.vl(bx, 48, 10, K.iron1); p.hl(bx - 2, 47, 5, K.iron2); p.hl(bx - 1, 46, 3, lit ? K.am3 : K.iron0); if (lit) { p.px(bx, 45, K.am4); o.lights.push({ x: bx, y: 45, r: 6 }); } }
}
function bCounting(p, o, lit) {
  skyGrad(p, 0, 58, 0); starField(p, o, 0, 0, 192, 24, 30, 31);
  skyline(p, 56, 32, lit, o, 10, 22);
  gableHouse(p, o, 18, 58, 26, 34, lit, 33);
  gableHouse(p, o, 150, 58, 28, 30, lit, 34, [K.pl0, K.pl1, K.pl3]);
  // the Counting House: steep black roof, jettied black-timber floors
  const x0 = 62, w = 68;
  for (let j = 0; j < 20; j++) { const half = 3 + j * 1.75; for (let x = Math.floor(96 - half); x <= Math.ceil(95 + half); x++) { const e = x === Math.floor(96 - half) || x === Math.ceil(95 + half); p.px(x, j, e ? K.ink : j % 3 === 2 ? K.sl0 : x < 96 ? K.sl2 : K.sl1); } }
  p.rect(89, 8, 14, 10, K.ink); p.rect(90, 9, 12, 9, K.pla1); p.rect(93, 11, 6, 5, lit ? K.am3 : K.win); p.vl(96, 11, 5, K.tb0); if (lit) o.lights.push({ x: 96, y: 13, r: 4 });
  const floors = [[x0, 20, w, 13], [x0 + 3, 33, w - 6, 12], [x0 + 6, 45, w - 12, 13]];
  floors.forEach(([x, y, fw, fh], f) => {
    p.rect(x - 1, y, fw + 2, fh, K.ink);
    p.rect(x, y, fw, fh, K.pla1); p.vl(x, y, fh, K.pla2); p.vl(x + 1, y, fh, K.pla2);
    p.hl(x, y, fw, K.tb0); p.hl(x, y + 1, fw, K.tb1); p.hl(x, y + fh - 1, fw, K.tb0);
    for (let i = 0; i < fw; i += 8) { p.vl(x + i, y, fh, K.tb0); p.vl(x + i + 1, y, fh, K.tb1); p.line(x + i + 2, y + fh - 2, x + i + 6, y + 2, K.tb1); }
    for (let i = 3; i < fw - 4; i += 8) {
      if (f === 2 && Math.abs(x + i - 96) < 8) continue;
      const on = lit && (i + f * 3) % 5 !== 1;
      p.rect(x + i + 1, y + 3, 4, fh - 6, K.tb0);
      p.rect(x + i + 2, y + 4, 2, fh - 8, on ? K.am3 : K.win); p.px(x + i + 2, y + 4, on ? K.am4 : K.win2);
      if (on) o.lights.push({ x: x + i + 2, y: y + 5, r: 3 });
    }
  });
  p.rect(91, 49, 10, 9, K.tb0); p.rect(92, 50, 8, 8, K.wd1); p.vl(96, 50, 8, K.tb1);
  // hanging coin sign
  p.hl(130, 30, 10, K.iron1); p.vl(139, 30, 3, K.iron1); p.ell(139.5, 37, 4, 4, K.ink); p.ell(139.5, 37, 3, 3, lit ? K.gold : K.st2); p.px(139, 36, lit ? K.am1 : K.st1); p.px(140, 37, lit ? K.am1 : K.st1);
  cobbles(p, 0, 58, 192, 6, 9);
  postLamp(p, o, 52, 60, 14, lit, false); postLamp(p, o, 142, 60, 14, lit, false);
}
function bMarket(p, o, lit) {
  skyGrad(p, 0, 54, 0); starField(p, o, 0, 0, 192, 20, 30, 41);
  skyline(p, 60, 42, lit, o, 16, 30);
  // bunting strings with little lanterns
  const flags = [K.am2, K.cu3, K.red1, K.pl3, K.gold, K.teal];
  for (const [xa, xb] of [[0, 84], [108, 192]]) for (let x = xa; x < xb; x++) {
    const t = (x - xa) / (xb - xa), y = Math.round(18 + Math.sin(t * Math.PI) * 9);
    p.px(x, y, K.tb2);
    if (x % 6 === 0) { p.px(x, y + 1, flags[(x / 6) % 6]); p.px(x + 1, y + 1, flags[(x / 6) % 6]); p.px(x, y + 2, flags[(x / 6) % 6]); }
    if (x % 18 === 9) { p.px(x, y + 1, K.iron1); p.rect(x - 1, y + 2, 3, 3, K.ink); p.px(x, y + 3, lit ? K.am4 : K.win2); if (lit) o.lights.push({ x, y: y + 3, r: 4 }); }
  }
  // Mother Clock tower
  const tx = 84, tw = 24;
  for (let j = 0; j < 12; j++) { const half = 1 + j * 1.1; for (let x = Math.floor(96 - half); x <= Math.ceil(95 + half); x++) p.px(x, j, x === Math.floor(96 - half) || x === Math.ceil(95 + half) ? K.ink : x < 96 ? K.cu3 : (j % 3 ? K.cu1 : K.cu0)); }
  p.rect(tx - 1, 12, tw + 2, 52, K.ink);
  brick(p, tx, 12, tw, 52, [K.st1, K.st2, K.st3], 4); p.vl(tx, 12, 52, K.st4);
  p.hl(tx - 2, 12, tw + 4, K.st4); p.hl(tx - 2, 13, tw + 4, K.st1);
  p.ell(96, 24, 8.5, 8.5, K.ink); p.ell(96, 24, 7.5, 7.5, lit ? K.cream : K.st3); p.ell(96, 24, 6, 6, (x, y, dx, dy) => (dx * dx + dy * dy > 0.7 ? (lit ? K.pla2 : K.st2) : null));
  for (let a = 0; a < 12; a++) { const ang = a / 12 * 6.28; p.px(Math.round(96 + Math.cos(ang) * 6.2 - 0.5), Math.round(24 + Math.sin(ang) * 6.2 - 0.5), K.tb1); }
  p.px(96, 24, K.tb0);
  o.clock = { x: 96, y: 24, r: 5 };
  if (lit) o.lights.push({ x: 96, y: 24, r: 11, soft: true });
  // belfry and big door
  p.rect(89, 36, 4, 7, K.ink); p.rect(99, 36, 4, 7, K.ink); p.px(90, 37, lit ? K.am2 : K.win2); p.px(100, 37, lit ? K.am2 : K.win2);
  p.rect(91, 50, 10, 14, K.ink); p.rect(92, 51, 8, 13, K.wd1); p.vl(96, 51, 13, K.wd0);
  // stalls with striped awnings
  const stalls = [[4, 38, K.am1], [42, 40, K.cu2], [118, 39, K.red1], [156, 38, K.pl3]];
  stalls.forEach(([x, y, c], i) => {
    p.rect(x, y + 6, 30, 18, K.wd1); p.hl(x, y + 6, 30, K.wd3); p.vl(x + 1, y + 2, 20, K.wd2); p.vl(x + 28, y + 2, 20, K.wd2);
    p.hl(x - 2, y - 1, 34, K.ink);
    for (let k = 0; k < 34; k++) { const cc = Math.floor(k / 3) % 2 ? c : K.cream; p.px(x - 2 + k, y, cc); p.px(x - 2 + k, y + 1, cc); p.px(x - 2 + k, y + 2, mix(cc, K.ink, 0.25)); if (k % 3 === 1) p.px(x - 2 + k, y + 3, mix(cc, K.ink, 0.4)); }
    const goods = [K.am2, K.red1, K.moss4, K.gold, K.cu3, K.pla2];
    for (let k = 0; k < 8; k++) p.ell(x + 4 + k * 3, y + 9, 1.4, 1.2, goods[(k + i) % 6]);
    p.rect(x + 3, y + 12, 24, 1, K.wd3);
    if (lit) { p.px(x + 26, y + 5, K.am4); o.lights.push({ x: x + 26, y: y + 5, r: 4 }); }
  });
  cobbles(p, 0, 60, 192, 4, 11);
}
function bBridge(p, o, lit) {
  skyGrad(p, 0, 64, 0); starField(p, o, 0, 0, 192, 40, 45, 51);
  // distant gorge cliffs
  for (let x = 0; x < 192; x++) { const l = Math.round(26 + Math.max(0, 40 - x) * 0.6 + 2 * Math.sin(x / 5)), r2 = Math.round(26 + Math.max(0, x - 152) * 0.6 + 2 * Math.sin(x / 6)); const top = Math.min(l, r2); for (let y = Math.min(64, top + 16); y < 64; y++) p.px(x, y, hash(x >> 1, y >> 1, 52) > 0.6 ? K.rock2 : K.rock1); }
  // near cliffs
  for (let y = 22; y < 64; y++) { const lw = 22 + Math.round(4 * Math.sin(y / 5)) + (y - 22) * 0.2, rw = 22 + Math.round(4 * Math.sin(y / 6 + 1)) + (y - 22) * 0.2; for (let x = 0; x < lw; x++) p.px(x, y, x > lw - 2 ? K.rock4 : hash(x >> 1, y >> 1, 53) > 0.6 ? K.rock3 : K.rock2); for (let x = 192 - rw; x < 192; x++) p.px(x, y, x < 194 - rw ? K.rock0 : hash(x >> 1, y >> 1, 54) > 0.6 ? K.rock2 : K.rock1); }
  // river far below
  waterBand(p, o, 58, 64, 55);
  o.falls.push({ l: 60, r: 132, y: 57, h: 2 });
  // arch
  const cx = 96, rx = 72, ry = 34, cy = 60;
  for (let x = 20; x <= 172; x++) {
    const dx = (x - cx) / rx; if (Math.abs(dx) > 1) continue;
    const y = Math.round(cy - ry * Math.sqrt(1 - dx * dx));
    p.px(x, y - 1, K.ink); p.px(x, y, K.white); p.px(x, y + 1, K.st5); p.px(x, y + 2, K.st3); p.px(x, y + 3, K.st1); p.px(x, y + 4, K.ink, 0.6);
    if (x % 6 === 0 && y > 30) { p.vl(x, 29, y - 30, K.st4); p.px(x + 1, 29, K.st2); p.vl(x + 1, 30, y - 31, K.st2); }
  }
  // deck and railing
  p.hl(0, 26, 192, K.ink); p.hl(0, 27, 192, K.white); p.hl(0, 28, 192, K.st4); p.hl(0, 29, 192, K.st2); p.hl(0, 30, 192, K.ink);
  p.hl(0, 21, 192, K.st5); p.hl(0, 22, 192, K.st3);
  for (let x = 1; x < 192; x += 4) p.vl(x, 23, 3, K.st4);
  // lamps and pennants of every tongue
  const flags = [K.am2, K.cu3, K.red1, K.pl3, K.gold, K.teal, K.am1];
  for (let i = 0; i < 7; i++) {
    const x = 12 + i * 28;
    postLamp(p, o, x, 26, 12, lit, false);
    p.rect(x + 1, 13, 5, 3, flags[i]); p.px(x + 5, 15, flags[i]); p.px(x + 1, 13, mix(flags[i], K.white, 0.3));
  }
}
function bScriptorium(p, o, lit) {
  skyGrad(p, 0, 58, 0); starField(p, o, 0, 0, 192, 18, 30, 61);
  skyline(p, 60, 62, lit, o, 14, 24);
  // hall
  p.rect(23, 22, 146, 38, K.ink);
  brick(p, 24, 23, 144, 37, [K.st1, K.st2, K.st3], 6); p.vl(24, 23, 37, K.st4);
  // roof
  roofTiles(p, 20, 12, 152, 11, [K.pl1, K.pl2, K.pl3], 0.6);
  // bell-cote with bell
  p.rect(88, 0, 16, 13, K.ink); p.rect(89, 1, 14, 11, K.st3); p.rect(92, 3, 8, 9, K.ink); p.ell(96, 8, 2.5, 3, K.gold); p.px(95, 7, K.am4); p.vl(96, 3, 2, K.iron1);
  // tall pointed windows with scribes' lamps
  for (let i = 0; i < 6; i++) {
    const x = 34 + i * 23 + (i >= 3 ? 8 : 0);
    if (i === 3) continue;
    p.rect(x - 1, 30, 10, 22, K.ink); for (let j = 0; j < 4; j++) p.hl(x + j, 29 - j, 8 - 2 * j, K.ink);
    p.rect(x, 31, 8, 21, lit ? K.am2 : K.win); for (let j = 0; j < 3; j++) p.hl(x + 1 + j, 30 - j, 6 - 2 * j, lit ? K.am3 : K.win2);
    p.vl(x + 4, 28, 24, K.tb0); p.hl(x, 40, 8, K.tb0);
    if (lit) { p.rect(x + 1, 44, 3, 3, K.am0); p.px(x + 2, 43, K.am1); p.rect(x + 5, 45, 2, 6, K.am0); o.lights.push({ x: x + 4, y: 36, r: 6 }); }
  }
  // door and a hanging scroll banner
  p.rect(88, 40, 16, 20, K.ink); p.ell(96, 41, 8, 5, K.ink); p.rect(89, 41, 14, 19, K.wd1); p.vl(96, 41, 19, K.wd0);
  p.rect(110, 26, 9, 16, K.cream); p.hl(108, 26, 13, K.wd2); p.hl(108, 42, 13, K.wd2); for (let j = 29; j < 40; j += 2) p.hl(111, j, 7, K.pla0);
  cobbles(p, 0, 60, 192, 4, 13);
}
function bStair(p, o, lit) {
  skyGrad(p, 0, 40, 0); starField(p, o, 0, 0, 192, 22, 30, 71);
  // sea on the right
  for (let x = 0; x < 192; x++) { const m = Math.round(28 + 2 * Math.sin(x / 15)); for (let y = m; y < 36; y++) p.px(x, y, y === m ? K.mtn2 : K.mtn0); }
  waterBand(p, o, 36, 64, 72, true);
  // cliff on the left, falling to the sea
  for (let y = 0; y < 64; y++) {
    const edge = Math.round(118 - y * 0.15 + 6 * Math.sin(y / 7) + 3 * hash(0, y >> 1, 73));
    for (let x = 0; x < edge; x++) {
      const n = hash(x >> 1, y >> 1, 74);
      p.px(x, y, x >= edge - 1 ? K.ink : x >= edge - 3 ? K.rock4 : n > 0.75 ? K.rock3 : n > 0.35 ? K.rock2 : K.rock1);
    }
    for (let x = edge; x < edge + 3; x++) if (y > 36 && hash(x, y, 75) > 0.4) p.px(x, y, K.foam);
  }
  // tide marks
  for (let y = 44; y < 64; y += 4) for (let x = 0; x < 118; x++) if (hash(x, y, 76) > 0.45) p.px(x, y, y > 52 ? K.cu1 : K.cu0);
  // the stair: zigzag flights cut into the face, landings with lamps
  const flights = [[30, 7, 1, 9], [70, 19, -1, 9], [30, 31, 1, 9], [70, 43, -1, 9], [30, 55, 1, 5]];
  flights.forEach(([x0, y0, dir, n]) => {
    // shadowed cut behind the flight
    for (let i = 0; i < n; i++) for (let k = -1; k < 6; k++) p.px(x0 + dir * (i * 4 + k), y0 + i * 1.33 - 2, K.rock0);
    for (let i = 0; i < n; i++) {
      const x = x0 + dir * i * 4, y = Math.round(y0 + i * 1.33);
      for (let k = 0; k < 5; k++) { p.px(x + dir * k, y, K.st5); p.px(x + dir * k, y + 1, K.st3); p.px(x + dir * k, y + 2, K.st1); p.px(x + dir * k, y + 3, K.ink, 0.7); }
    }
    for (let i = 0; i < n; i++) { const x = x0 + dir * i * 4 + 2, y = Math.round(y0 + i * 1.33); p.px(x, y - 2, K.st4); if (i % 2 === 0) p.px(x, y - 3, K.st4); }
  });
  [[74, 19], [26, 31], [74, 43], [26, 55], [26, 7]].forEach(([x, y], i) => {
    p.rect(x - 6, y - 1, 13, 4, K.st3); p.hl(x - 6, y - 1, 13, K.st5); p.hl(x - 6, y + 3, 13, K.ink);
    postLamp(p, o, x + (x > 50 ? 6 : -6), y - 1, 8, lit, false);
  });
}
function bMirror(p, o, lit) {
  skyGrad(p, 0, 64, 0); starField(p, o, 0, 0, 192, 30, 40, 81);
  skyline(p, 60, 82, lit, o, 14, 26);
  const towers = [[6, 28, 22], [30, 18, 20], [54, 34, 18], [124, 30, 18], [144, 20, 22], [168, 32, 22]];
  const face = (x, y, w, h, seed) => {
    p.rect(x - 1, y - 1, w + 2, h + 2, K.ink);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const diag = (i - j + seed + 200) % 13;
      let c = diag === 0 ? K.glass3 : diag === 1 ? K.glass2 : i < w * 0.4 ? K.glass1 : K.glass0;
      if (j % 6 === 5 || i % 7 === 6) c = K.st1;
      if (!lit) c = mix(c, K.st1, 0.4);
      p.px(x + i, y + j, c);
    }
    p.vl(x, y, h, K.st4); p.hl(x - 1, y - 2, w + 2, K.st3);
    for (let j = 2; j < h - 3; j += 6) for (let i = 2; i < w - 2; i += 7) if (hash(x + i, j, 82) > 0.55) { p.rect(x + i, y + j, 3, 3, lit ? K.am3 : K.win); if (lit && hash(i, j, 83) > 0.6) o.lights.push({ x: x + i + 1, y: y + j + 1, r: 3 }); }
    o.glints.push({ x, y, w, h, ph: seed });
  };
  towers.forEach(([x, y, w], i) => face(x, y, w, 64 - y, i * 5));
  // central glass spire
  for (let j = 0; j < 64; j++) {
    const half = j < 30 ? 1 + j * 0.55 : 17.5;
    for (let x = Math.floor(96 - half); x <= Math.ceil(95 + half); x++) {
      const e = x === Math.floor(96 - half) || x === Math.ceil(95 + half);
      let c = e ? K.ink : ((x - j + 300) % 9 === 0) ? K.glass3 : x < 96 ? K.glass2 : K.glass1;
      if (j > 30 && (j % 7 === 0)) c = K.st2;
      if (!lit && !e) c = mix(c, K.st1, 0.4);
      p.px(x, j, c);
    }
  }
  o.glints.push({ x: 80, y: 30, w: 32, h: 34, ph: 3 });
  if (lit) o.lights.push({ x: 96, y: 4, r: 8, c: 'glass' });
  p.rect(90, 50, 12, 14, K.ink); p.ell(96, 51, 6, 4, K.ink); p.rect(91, 51, 10, 13, lit ? K.am1 : K.wd0); p.vl(96, 51, 13, lit ? K.am3 : K.wd1);
}
function bRoads(p, o, lit) {
  skyGrad(p, 0, 40, 0); starField(p, o, 0, 0, 192, 24, 40, 91);
  // layered hills of the Ammerhold
  const layers = [[30, K.mtn1, K.mtn2, 0.06], [38, K.heath0, K.heath1, 0.1], [46, K.heath1, K.heath2, 0.13]];
  layers.forEach(([base, c, edge, f], li) => { for (let x = 0; x < 192; x++) { const top = Math.round(base + 5 * Math.sin(x * f + li * 2) + 2 * Math.sin(x * 0.31 + li)); for (let y = top; y < 64; y++) p.px(x, y, y === top ? edge : hash(x, y, 92 + li) > 0.9 ? edge : c); } });
  // the road winding away to the far ridge
  const pts = [[60, 64], [92, 54], [140, 48], [118, 42], [150, 37], [178, 33]];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    const wd = Math.max(1, Math.round(6 - i * 1.2));
    for (let s = 0; s <= n; s++) { const x = Math.round(x0 + (x1 - x0) * s / n), y = Math.round(y0 + (y1 - y0) * s / n); for (let k = -wd; k <= wd; k++) p.px(x + k, y, Math.abs(k) === wd ? K.heath0 : hash(x + k, y, 94) > 0.7 ? K.cob2 : K.cob1); }
  }
  // milestones with lamps along the road
  [[96, 52, 10], [138, 46, 7], [152, 36, 5]].forEach(([x, y, h], i) => { p.rect(x + 7, y - 4, 2, 4, K.st3); if (i < 2) postLamp(p, o, x + 12, y, h, lit, false); else { p.px(x + 4, y - 2, lit ? K.am4 : K.win2); if (lit) o.lights.push({ x: x + 4, y: y - 2, r: 3 }); } });
  // the gatehouse
  p.rect(0, 14, 66, 50, K.ink);
  brick(p, 0, 16, 64, 48, [K.st1, K.st2, K.st3], 9); p.hl(0, 16, 64, K.st4);
  for (let x = 0; x < 64; x += 6) p.rect(x, 12, 4, 4, K.st3);
  for (const tx of [2, 46]) {
    p.rect(tx - 1, 4, 18, 60, K.ink);
    for (let x = tx; x < tx + 16; x++) p.vl(x, 6, 58, x < tx + 3 ? K.st4 : x < tx + 9 ? K.st3 : K.st1);
    for (let j = 0; j < 8; j++) { const half = 1 + j * 1.2; for (let x = Math.floor(tx + 8 - half); x <= Math.ceil(tx + 7 + half); x++) p.px(x, j - 3, x === Math.floor(tx + 8 - half) || x === Math.ceil(tx + 7 + half) ? K.ink : x < tx + 8 ? K.sl4 : K.sl2); }
    p.rect(tx + 6, 20, 4, 6, K.ink); p.rect(tx + 7, 21, 2, 5, lit ? K.am3 : K.win); if (lit) o.lights.push({ x: tx + 8, y: 22, r: 4 });
  }
  p.rect(20, 30, 24, 34, K.ink); p.ell(32, 31, 12, 9, K.ink);
  p.ell(32, 32, 10.5, 8, (x, y, dx, dy) => (dy > 0 ? null : lit ? K.am0 : K.win)); p.rect(22, 32, 21, 32, lit ? K.am0 : K.win);
  for (let x = 22; x < 43; x += 3) p.vl(x, 24, 8, K.iron2);
  p.rect(26, 50, 12, 14, lit ? K.am1 : K.gnd1);
  postLamp(p, o, 18, 50, 10, lit, false);
  // signpost
  p.vl(80, 46, 18, K.wd2); p.rect(72, 46, 16, 4, K.wd3); p.px(88, 47, K.wd3); p.rect(76, 52, 14, 3, K.wd2); p.px(75, 53, K.wd2); p.hl(74, 47, 11, K.wd1);
}
function bAmphi(p, o, lit) {
  skyGrad(p, 0, 40, 0); starField(p, o, 0, 0, 192, 18, 30, 101);
  for (let y = 26; y < 64; y++) for (let x = 0; x < 192; x++) { const n = hash(x >> 1, y >> 1, 102); if (y > 36 - Math.abs(x - 96) * 0.05) p.px(x, y, n > 0.6 ? K.heath2 : n > 0.3 ? K.heath1 : K.heath0); }
  const cx = 96, cy = 58;
  for (let r = 0; r < 9; r++) {
    const rx = 96 - r * 8, ry = 48 - r * 4.4;
    p.ell(cx, cy, rx, ry, (x, y, dx, dy) => {
      if (dy > 0.05) return null;
      const sh = dx < -0.45 ? 2 : dx > 0.45 ? 0 : 1;
      const row = r % 2 === 0;
      return row ? [K.st2, K.st3, K.st4][sh] : [K.st0, K.st1, K.st2][sh];
    });
  }
  // aisles
  for (const a of [-0.6, -0.2, 0.2, 0.6]) for (let t = 0.32; t < 1; t += 0.01) { const x = Math.round(cx + Math.sin(a) * 96 * t), y = Math.round(cy - Math.cos(a) * 48 * t); p.px(x, y, K.st1); }
  // rim colonnade
  for (let x = 4; x < 190; x += 7) { const dx = (x - cx) / 96; const y = Math.round(cy - 48 * Math.sqrt(Math.max(0, 1 - dx * dx))); if (y < 60) { p.vl(x, y - 6, 6, K.st4); p.px(x, y - 7, K.st5); p.vl(x + 1, y - 6, 6, K.st2); } }
  // stage and scaenae frons
  p.ell(cx, 56, 30, 6, (x, y, dx, dy) => (dy < -0.5 ? K.wd3 : K.wd2));
  p.rect(48, 56, 96, 8, K.ink); brick(p, 49, 57, 94, 7, [K.st1, K.st3, K.st4], 12); p.hl(49, 57, 94, K.st5);
  for (let x = 54; x < 140; x += 12) { p.rect(x, 59, 5, 5, K.ink); p.px(x + 2, 58, K.ink); if (lit) p.px(x + 2, 62, K.am1); }
  // braziers
  [[18, 40], [174, 40], [62, 22], [130, 22]].forEach(([x, y]) => { p.vl(x, y + 1, 6, K.iron1); p.hl(x - 2, y, 5, K.iron2); p.hl(x - 1, y - 1, 3, lit ? K.am3 : K.iron0); if (lit) { p.px(x, y - 2, K.am4); o.lights.push({ x, y: y - 2, r: 6 }); } });
  if (lit) o.lights.push({ x: 96, y: 52, r: 14, soft: true });
}
function bLetheGate(p, o, lit) {
  skyGrad(p, 0, 12, 0); starField(p, o, 0, 0, 192, 8, 14, 111);
  // reservoir glimpsed over the parapet
  p.rect(0, 6, 192, 4, K.w2); p.hl(0, 6, 192, K.w4);
  // dam face
  for (let y = 10; y < 56; y++) for (let x = 0; x < 192; x++) {
    const row = (y - 10) % 5, course = Math.floor((y - 10) / 5);
    const joint = row === 4 || (x + (course % 2) * 6) % 12 === 0;
    p.px(x, y, joint ? K.st0 : hash(x >> 2, y >> 2, 112) > 0.8 ? K.st3 : K.st2);
  }
  // walkway and parapet
  p.rect(0, 10, 192, 5, K.st3); p.hl(0, 10, 192, K.st5); p.hl(0, 14, 192, K.ink);
  for (let x = 0; x < 192; x += 5) p.rect(x, 7, 3, 3, K.st4);
  // twelve iron sluices
  for (let i = 0; i < 12; i++) {
    const x = 18 + i * 13;
    p.rect(x - 2, 17, 12, 34, K.ink);
    p.rect(x - 1, 18, 10, 32, K.st4);
    p.rect(x, 19, 8, 31, K.iron1); p.vl(x, 19, 31, K.iron2);
    for (let j = 23; j < 50; j += 7) { p.hl(x, j, 8, K.iron0); p.px(x + 1, j + 1, K.st3); p.px(x + 6, j + 1, K.st3); }
    p.rect(x + 2, 15, 4, 3, K.iron2); p.px(x + 3, 15, K.iron0);
    // each sluice's lamp
    p.px(x + 4, 12, lit ? K.am4 : K.win2); if (lit) o.lights.push({ x: x + 4, y: 12, r: 4 });
  }
  // end towers
  for (const tx of [0, 180]) { p.rect(tx, 0, 12, 56, K.ink); for (let x = tx + 1; x < tx + 11; x++) p.vl(x, 1, 55, x < tx + 4 ? K.st4 : x < tx + 8 ? K.st3 : K.st1); p.rect(tx + 4, 18, 4, 6, lit ? K.am3 : K.win); if (lit) o.lights.push({ x: tx + 6, y: 20, r: 5 }); }
  // spillway and river below
  waterBand(p, o, 56, 64, 113);
  for (let i = 0; i < 12; i++) { const x = 18 + i * 13; p.rect(x, 50, 8, 6, K.w4); o.falls.push({ l: x, r: x + 7, y: 50, h: 6 }); }
}
function bArchive(p, o, lit) {
  skyGrad(p, 0, 54, 0); starField(p, o, 0, 0, 192, 40, 50, 121);
  skyline(p, 58, 122, lit, o, 6, 14);
  const cx = 96;
  // steps
  for (let j = 0; j < 6; j++) { p.hl(40 - j * 4, 58 + j, 112 + j * 8, j % 2 ? K.st2 : K.st4); }
  // drum
  p.rect(53, 34, 87, 24, K.ink);
  for (let x = 54; x < 139; x++) { const t = (x - 54) / 85; p.vl(x, 35, 23, t < 0.15 ? K.st5 : t < 0.45 ? K.st4 : t < 0.8 ? K.st3 : K.st2); }
  for (let x = 58; x < 138; x += 10) { p.vl(x, 35, 23, K.st5); p.vl(x + 1, 35, 23, K.st4); p.vl(x + 2, 35, 23, K.st2); }
  for (let x = 63; x < 136; x += 10) { if (Math.abs(x + 1 - cx) < 6) continue; p.rect(x - 1, 39, 5, 14, K.ink); p.rect(x, 40, 3, 13, lit ? K.am2 : K.win); p.vl(x, 40, 13, lit ? K.am3 : K.win2); p.px(x + 1, 39, K.ink); if (lit) o.lights.push({ x: x + 1, y: 44, r: 4 }); }
  p.hl(50, 33, 93, K.ink); p.hl(50, 34, 93, K.st5); p.hl(51, 35, 91, K.st2);
  // dome
  p.ell(cx, 34, 41.5, 28.5, (x, y, dx, dy) => (dy > 0 ? null : K.ink));
  p.ell(cx, 34, 40.5, 27.5, (x, y, dx, dy) => {
    if (dy > 0) return null;
    const l = -dx * 0.72 - dy * 0.5 + (hash(x, y, 123) - 0.5) * 0.14;
    let c = l > 0.78 ? K.cu5 : l > 0.5 ? K.cu4 : l > 0.2 ? K.cu3 : l > -0.2 ? K.cu2 : l > -0.5 ? K.cu1 : K.cu0;
    const ang = dx * 8, near = Math.abs(ang - Math.round(ang));
    if (near < 0.09 && dy < -0.1) c = mix(c, K.cu0, 0.5);
    if (Math.abs(dy + 0.5) < 0.025) c = mix(c, K.cu0, 0.4);
    return c;
  });
  // cupola
  p.rect(cx - 6, 1, 13, 7, K.ink); p.rect(cx - 5, 2, 11, 5, K.st4); p.rect(cx - 3, 3, 7, 4, lit ? K.am3 : K.win); p.px(cx, 3, lit ? K.am5 : K.win2);
  p.hl(cx - 6, 0, 13, K.cu3);
  if (lit) o.lights.push({ x: cx, y: 4, r: 9 });
  // bronze doors: WHAT IS PLACED IS KEPT
  p.rect(cx - 9, 38, 19, 20, K.ink); p.ell(cx + 0.5, 39, 9, 5, K.ink);
  p.rect(cx - 8, 39, 17, 19, lit ? K.am1 : K.wd1); p.vl(cx, 39, 19, K.am0); p.vl(cx - 8, 39, 19, lit ? K.am3 : K.wd2);
  for (let j = 42; j < 57; j += 5) { p.hl(cx - 7, j, 6, lit ? K.am2 : K.wd2); p.hl(cx + 2, j, 6, lit ? K.am2 : K.wd2); }
  p.px(cx - 2, 48, K.gold); p.px(cx + 2, 48, K.gold);
  p.hl(cx - 7, 36, 15, K.st1);
  if (lit) o.lights.push({ x: cx, y: 50, r: 12, soft: true });
  postLamp(p, o, 38, 58, 14, lit, true); postLamp(p, o, 154, 58, 14, lit, true);
}
function bCrypt(p, o, lit) {
  // the Undercroft beneath the Archive: vaulted stone, an iron door, torches
  for (let y = 0; y < 64; y++) for (let x = 0; x < 192; x++) {
    const row = y % 6, course = Math.floor(y / 6);
    const joint = row === 5 || (x + (course % 2) * 7) % 14 === 0;
    const n = hash(x >> 2, y >> 1, 131);
    p.px(x, y, joint ? K.ink : n > 0.8 ? K.st1 : n > 0.3 ? K.st0 : K.rock1);
  }
  // vault ribs
  for (const [cx, rx] of [[96, 70], [96, 92]]) for (let x = cx - rx; x <= cx + rx; x++) { const dx = (x - cx) / rx; const y = Math.round(58 - 56 * Math.sqrt(Math.max(0, 1 - dx * dx))); p.px(x, y, K.st2); p.px(x, y + 1, K.st1); p.px(x, y + 2, K.ink); }
  // floor and steps down
  for (let y = 56; y < 64; y++) for (let x = 0; x < 192; x++) p.px(x, y, (y - 56) % 3 === 0 ? K.st2 : K.st0);
  // the iron door in a stone arch
  p.ell(96, 22, 24, 16, (x, y, dx, dy) => (dy > 0.2 ? null : K.st2));
  p.rect(72, 22, 49, 36, K.st2);
  p.ell(96, 24, 21, 14, (x, y, dx, dy) => (dy > 0 ? null : K.ink)); p.rect(75, 24, 43, 32, K.ink);
  for (let x = 77; x < 116; x++) for (let y = 14; y < 56; y++) { const dx = (x + 0.5 - 96.5) / 19, dy = (y + 0.5 - 26) / 12; if (y < 26 && dx * dx + dy * dy > 1) continue; p.px(x, y, x < 80 ? K.iron2 : (x - 77) % 10 === 9 ? K.iron0 : K.iron1); }
  for (let y = 22; y < 56; y += 9) { p.hl(77, y, 39, K.iron0); for (let x = 79; x < 116; x += 5) p.px(x, y + 1, K.st3); }
  p.vl(96, 14, 42, K.ink);
  p.ell(103, 38, 3, 3, K.iron2); p.ell(103, 38, 1.6, 1.6, K.iron0);
  p.rect(92, 36, 2, 4, K.ink); p.px(92, 37, lit ? K.am3 : K.ink);
  // keystone sigil
  p.rect(93, 6, 7, 6, K.st3); p.px(96, 8, lit ? K.gold : K.st1); p.hl(95, 9, 3, lit ? K.gold : K.st1);
  // torches in brackets
  for (const tx of [44, 148]) {
    p.hl(tx - 3, 34, 7, K.iron1); p.vl(tx, 30, 8, K.wd1); p.rect(tx - 1, 28, 3, 3, K.iron2);
    if (lit) { p.px(tx, 27, K.am3); p.px(tx, 26, K.am4); o.lights.push({ x: tx, y: 25, r: 10, torch: true }); }
  }
  // chains and bones of old candles
  p.vl(66, 0, 12, K.iron2); p.vl(126, 0, 12, K.iron2);
  if (lit) { for (const x of [60, 132]) { p.rect(x, 51, 2, 5, K.cream); p.px(x, 50, K.am4); o.lights.push({ x, y: 50, r: 3 }); } }
}
const BANNER_DRAW = { M1: bQuay, M2: bGallery, M3: bHallFaces, M4: bCounting, M5: bMarket, M6: bBridge, M7: bScriptorium, M8: bStair, M9: bMirror, M10: bRoads, M11: bAmphi, M12: bLetheGate, archive: bArchive, crypt: bCrypt };
const bannerCache = new Map();
export function buildBanner(id, restored = true) {
  const key = id + ':' + (restored ? 1 : 0);
  if (bannerCache.has(key)) return bannerCache.get(key);
  const fn = BANNER_DRAW[id] || bArchive;
  let p = painter(BANNER_W, BANNER_H);
  skyGrad(p, 0, BANNER_H, 0, [K.sky0, K.sky1, K.sky2, K.gnd0]);
  const o = { lights: [], stars: [], waves: [], falls: [], glints: [], reflections: [], fog: [], clock: null };
  fn(p, o, restored);
  if (!restored) {
    p = desaturated(p, 0.78);
    o.lights = []; o.reflections = [];
    for (let i = 0; i < 9; i++) { const r = rng(i * 13 + id.length); o.fog.push({ x: -20 + i * 24 + Math.floor(r() * 10), y: 8 + Math.floor(r() * 44), w: 36 + Math.floor(r() * 20), h: 10 + Math.floor(r() * 6), seed: 300 + i, amp: 8 + r() * 8, sp: 0.18 + r() * 0.2, ph: r() * 6.28, a: 0.62 }); }
  } else if (id !== 'crypt' && id !== 'M2') {
    for (let i = 0; i < 2; i++) o.fog.push({ x: 20 + i * 90, y: 50 + i * 4, w: 50, h: 9, seed: 400 + i, amp: 10, sp: 0.15, ph: i * 2, a: 0.18 });
  }
  const res = { p, ...o };
  bannerCache.set(key, res);
  return res;
}

// ---------------------------------------------------------------------------------------------
// One shared 12 fps ticker for every pixel canvas on the page (browser only).
const subs = new Set();
let rafId = 0, lastTick = 0, frameNo = 0, t0 = 0;
function loop(now) {
  rafId = requestAnimationFrame(loop);
  if (now - lastTick < 1000 / 12 - 2) return;
  lastTick = now; frameNo++;
  const t = Math.max(0, now - t0) / 1000;
  for (const fn of subs) fn(t, frameNo);
}
export function subscribeFrame(fn) {
  subs.add(fn);
  if (!rafId) { t0 = t0 || performance.now(); rafId = requestAnimationFrame(loop); }
  return () => { subs.delete(fn); if (!subs.size && rafId) { cancelAnimationFrame(rafId); rafId = 0; } };
}
// Overlays used by scenes
export function drawReflections(ctx, refl, frame, len = 8) {
  for (let i = 0; i < refl.length; i++) {
    const r = refl[i];
    const n = r.len ?? len;
    for (let j = 0; j < n; j += 2) {
      const on = ((j >> 1) + frame + i) % 3 !== 0;
      if (!on) continue;
      ctx.fillStyle = col(j < 3 ? K.am3 : K.am1, j < 3 ? 1 : 0.7);
      ctx.fillRect(r.x + (((frame >> 1) + j + i) % 2), r.y + j, 1, 1);
    }
  }
}
export function drawGlints(ctx, glints, t) {
  ctx.fillStyle = col(K.glass3, 0.75);
  for (let g = 0; g < glints.length; g++) {
    const q = glints[g], span = q.w + q.h + 60;
    const pos = Math.floor(((t * 14 + q.ph * 37) % span)) - 30;
    for (let j = 0; j < q.h; j++) { const i = pos - j; if (i >= 0 && i < q.w) { ctx.fillRect(q.x + i, q.y + j, 1, 1); if (i + 1 < q.w) ctx.fillRect(q.x + i + 1, q.y + j, 1, 1); } }
  }
}
export function drawClock(ctx, c, date) {
  if (!c) return;
  const h = (date.getHours() % 12) + date.getMinutes() / 60, m = date.getMinutes() + date.getSeconds() / 60;
  ctx.fillStyle = col(K.tb0);
  const hand = (ang, len) => { for (let k = 1; k <= len; k++) ctx.fillRect(Math.round(c.x + Math.sin(ang) * k - 0.5), Math.round(c.y - Math.cos(ang) * k - 0.5), 1, 1); };
  hand((h / 12) * Math.PI * 2, c.r - 2); hand((m / 60) * Math.PI * 2, c.r);
}
export function drawTorches(ctx, lights, frame) {
  for (let i = 0; i < lights.length; i++) {
    const l = lights[i]; if (!l.torch) continue;
    const f = (frame + i * 2) % 3;
    ctx.fillStyle = col(K.am1); ctx.fillRect(l.x - 1, l.y + 1, 3, 2);
    ctx.fillStyle = col(K.am3); ctx.fillRect(l.x - (f === 1 ? 1 : 0), l.y - 1, 2, 3);
    ctx.fillStyle = col(K.am5); ctx.fillRect(l.x, l.y, 1, 2);
    ctx.fillStyle = col(K.am2); ctx.fillRect(l.x + (f === 2 ? 1 : 0), l.y - 3 + (f === 0 ? 1 : 0), 1, 2);
  }
}
