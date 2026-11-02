// Shared pixel-art engine for Mnemos. All art is original and drawn in code.
//
// Two sprite formats are supported everywhere:
//  1. String sprite: { w, h, pal: { a: '#rrggbb', b: '#rrggbbaa', ... }, px: ['..aab..', ...] }
//     Each character in px is a palette key; '.' or ' ' is transparent. Rows must be exactly w chars, h rows.
//  2. Raw sprite:    { w, h, rgba: Uint8ClampedArray(w*h*4) }  (use makeBuffer() to build one imperatively)
//
// Render with drawSprite(ctx, sprite, x, y, scale) or the <Sprite> React component.

const hexCache = new Map();
export function hexToRgba(hex) {
  if (hexCache.has(hex)) return hexCache.get(hex);
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const v = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), h.length >= 8 ? parseInt(h.slice(6, 8), 16) : 255];
  hexCache.set(hex, v);
  return v;
}

// Imperative pixel buffer: set/get pixels, fill rects, then toSprite().
export function makeBuffer(w, h) {
  const rgba = new Uint8ClampedArray(w * h * 4);
  const api = {
    w, h, rgba,
    set(x, y, color) {
      x = Math.round(x); y = Math.round(y);
      if (x < 0 || y < 0 || x >= w || y >= h || !color) return;
      const [r, g, b, a] = hexToRgba(color);
      const i = (y * w + x) * 4;
      if (a === 255) { rgba[i] = r; rgba[i + 1] = g; rgba[i + 2] = b; rgba[i + 3] = 255; return; }
      const t = a / 255; // alpha blend over existing
      rgba[i] = rgba[i] * (1 - t) + r * t; rgba[i + 1] = rgba[i + 1] * (1 - t) + g * t; rgba[i + 2] = rgba[i + 2] * (1 - t) + b * t;
      rgba[i + 3] = Math.max(rgba[i + 3], a);
    },
    get(x, y) { const i = (y * w + x) * 4; return rgba[i + 3] ? [rgba[i], rgba[i + 1], rgba[i + 2], rgba[i + 3]] : null; },
    rect(x, y, rw, rh, color) { for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) api.set(x + i, y + j, color); },
    // Filled ellipse centred at (cx, cy) with radii rx, ry. fn(x, y, dx, dy) may return a colour per pixel.
    ellipse(cx, cy, rx, ry, color) {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) api.set(x, y, typeof color === 'function' ? color(x, y, dx, dy) : color);
      }
    },
    line(x0, y0, x1, y1, color) {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (;;) { api.set(x0, y0, color); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
    },
    // Draw a string or raw sprite into this buffer at (x, y).
    blit(s, x = 0, y = 0) {
      if (s.rgba) { for (let j = 0; j < s.h; j++) for (let i = 0; i < s.w; i++) { const k = (j * s.w + i) * 4; if (s.rgba[k + 3]) api.set(x + i, y + j, rgbaHex(s.rgba, k)); } return; }
      s.px.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const c = row[i]; if (c !== '.' && c !== ' ' && s.pal[c]) api.set(x + i, y + j, s.pal[c]); } });
    },
    // 1px dark outline around opaque pixels (classic sprite look).
    outline(color = '#140f1a') {
      const copy = new Uint8ClampedArray(rgba);
      const opaque = (x, y) => x >= 0 && y >= 0 && x < w && y < h && copy[(y * w + x) * 4 + 3] > 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!opaque(x, y) && (opaque(x - 1, y) || opaque(x + 1, y) || opaque(x, y - 1) || opaque(x, y + 1))) api.set(x, y, color);
    },
    toSprite() { return { w, h, rgba }; },
  };
  return api;
}

function rgbaHex(arr, k) {
  const h = (n) => n.toString(16).padStart(2, '0');
  return `#${h(arr[k])}${h(arr[k + 1])}${h(arr[k + 2])}${h(arr[k + 3])}`;
}

// Convert any sprite to a raw sprite (cached for string sprites).
const rawCache = new WeakMap();
export function toRaw(s) {
  if (s.rgba) return s;
  if (rawCache.has(s)) return rawCache.get(s);
  const b = makeBuffer(s.w, s.h); b.blit(s); const r = b.toSprite();
  rawCache.set(s, r);
  return r;
}

export function drawSprite(ctx, s, x = 0, y = 0, scale = 1) {
  const r = toRaw(s);
  const img = new ImageData(new Uint8ClampedArray(r.rgba), r.w, r.h);
  if (scale === 1) { ctx.putImageData(img, x, y); return; }
  const tmp = document.createElement('canvas'); tmp.width = r.w; tmp.height = r.h;
  tmp.getContext('2d').putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tmp, x, y, r.w * scale, r.h * scale);
}

const urlCache = new Map();
export function spriteDataURL(s, scale = 1, key) {
  const k = key ? `${key}@${scale}` : null;
  if (k && urlCache.has(k)) return urlCache.get(k);
  const r = toRaw(s);
  const c = document.createElement('canvas'); c.width = r.w * scale; c.height = r.h * scale;
  drawSprite(c.getContext('2d'), r, 0, 0, scale);
  const url = c.toDataURL('image/png');
  if (k) urlCache.set(k, url);
  return url;
}

// Shared game palette (use these where possible so all art reads as one world).
export const PAL = {
  ink: '#0f1420', night: '#161d2c', deep: '#0a0d16', stone: '#3a4256', stone2: '#59627a', stone3: '#8a93a8',
  parchment: '#efe6d2', parch2: '#d8c9a6', amber: '#e8b04b', amber2: '#ffd98a', ember: '#c46a2a', teal: '#7fb3a6', teal2: '#3f6f66',
  tide: '#b8c2d6', tide2: '#8090ad', river: '#3a5a78', river2: '#2a4560', moss: '#4f6d3a', moss2: '#7a9a4a', blood: '#9a2e2e', gold: '#f0c75e', violet: '#6b4a8a',
};

// Seeded RNG for deterministic procedural art.
export function prng(seed) {
  let a = (typeof seed === 'number' ? seed : [...String(seed)].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261)) >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export const reducedMotion = () => document.documentElement.dataset.motion === 'reduced' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
