// Painted scenes: still pictures from the local image model, animated in code.
// Each scene ships two pictures painted from the same layout and reduced to one shared palette:
//   dark = the place with its lamps out, lit = the same place with every light burning.
// Every frame draws `dark`, then reveals `lit` through a dithered light mask, so flickering lights
// relight the painted stone itself. Only whole pixels from the two pictures are shown (no blending),
// so the result never contains a colour the palette does not have. Code-drawn effects (flames, mist,
// dust) are drawn on top by the screen that owns the scene.
import { SCENES } from '../data/scenes.js';

const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const bayer = (x, y) => (B4[((y & 3) << 2) | (x & 3)] + 0.5) / 16;

// The manifest entry for a painted scene, or null (callers keep their code-drawn art).
export function paintedScene(id, table = SCENES) {
  const s = table && table[id];
  return s && s.dark && s.lit && s.w > 0 && s.h > 0 ? s : null;
}

// Light level at (x, y): ambient plus each light's soft falloff. Lights: { x, y, r, i, sx?, sy? }.
export function lightAt(x, y, lights, ambient = 0) {
  let L = ambient;
  for (const l of lights) {
    const dx = (x - l.x) * (l.sx || 1), dy = (y - l.y) * (l.sy || 1), d2 = dx * dx + dy * dy;
    if (d2 >= l.r * l.r) continue;
    const f = 1 - Math.sqrt(d2) / l.r;
    L += f * f * l.i;
  }
  return L;
}

// Dithered on/off mask on a coarse grid (one cell = `cell` scene pixels). A cell shows the lit picture
// when its light level beats the Bayer threshold for that cell. Pure, so it is unit-tested.
export function lightMask(W, H, lights, { ambient = 0, cell = 2 } = {}) {
  const mw = Math.ceil(W / cell), mh = Math.ceil(H / cell);
  const m = new Uint8Array(mw * mh);
  for (let cy = 0; cy < mh; cy++) {
    for (let cx = 0; cx < mw; cx++) {
      const L = lightAt((cx + 0.5) * cell, (cy + 0.5) * cell, lights, ambient);
      m[cy * mw + cx] = L > bayer(cx, cy) ? 1 : 0;
    }
  }
  return { w: mw, h: mh, cell, data: m };
}

// Torch-like flicker for a light found in the picture: radius and strength wobble a little, each light
// on its own phase so neighbouring lamps never pulse together.
export function flicker(l, t, k) {
  if (!l.flicker) return l;
  const ph = k * 1.7 + (l.x % 7);
  const f = Math.sin(t * 11 + ph) * 0.045 + Math.sin(t * 5.3 + ph * 2) * 0.035 + Math.sin(t * 23 + ph) * 0.02;
  return { ...l, r: l.r * (1 + f * l.flicker), i: l.i * (1 + f * 0.6 * l.flicker) };
}

// ---- Browser side ------------------------------------------------------------------------------
const plateCache = new Map();

// Starts loading a scene's two pictures; calls onReady once both have decoded. Returns the cache record.
export function loadPlates(scene, onReady) {
  let rec = plateCache.get(scene);
  if (!rec) {
    rec = { ready: false, failed: false, dark: null, lit: null, waiters: [] };
    plateCache.set(scene, rec);
    const load = (src) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
    Promise.all([load(scene.dark), load(scene.lit)]).then(([dark, lit]) => {
      Object.assign(rec, { dark, lit, ready: true });
      rec.waiters.splice(0).forEach((fn) => fn(rec));
    }).catch(() => { rec.failed = true; rec.waiters.length = 0; });
  }
  if (onReady) { if (rec.ready) onReady(rec); else if (!rec.failed) rec.waiters.push(onReady); }
  return rec;
}

const work = new Map();
function buffers(W, H, mw, mh) {
  const key = `${W}x${H}:${mw}x${mh}`;
  let b = work.get(key);
  if (!b) {
    const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return { c, x }; };
    const mask = mk(mw, mh);
    b = { lit: mk(W, H), mask, img: mask.x.createImageData(mw, mh) };
    work.set(key, b);
  }
  return b;
}

// Region mask for the painted world map: how restored each spot is, from the districts around it (inverse-distance
// weighting, as buildMapState in src/ui/pixel/world.js tints the code map), dithered to on/off cells.
// nodes: [{ x, y, v }] in scene pixels, v = 0 lost .. 1 restored. Pure, so it is unit-tested.
export function regionMask(W, H, nodes, { cell = 2, yScale = 1.25, soft = 90 * 9 } = {}) {
  const mw = Math.ceil(W / cell), mh = Math.ceil(H / cell);
  const m = new Uint8Array(mw * mh);
  for (let cy = 0; cy < mh; cy++) {
    const y = (cy + 0.5) * cell;
    for (let cx = 0; cx < mw; cx++) {
      const x = (cx + 0.5) * cell;
      let sw = 0, sv = 0;
      for (const n of nodes) { const dx = n.x - x, dy = (n.y - y) * yScale, q = dx * dx + dy * dy + soft, w = 1 / (q * q); sw += w; sv += w * n.v; }
      m[cy * mw + cx] = sv / sw > bayer(cx, cy) ? 1 : 0;
    }
  }
  return { w: mw, h: mh, cell, data: m };
}

// Draws the dark (or lost) picture, then the lit (or restored) picture wherever the mask is on.
export function maskBlend(ctx, scene, plates, m) {
  const W = scene.w, H = scene.h;
  ctx.drawImage(plates.dark, 0, 0, W, H);
  const b = buffers(W, H, m.w, m.h);
  const d = b.img.data;
  for (let i = 0; i < m.data.length; i++) d[i * 4 + 3] = m.data[i] ? 255 : 0;
  b.mask.x.putImageData(b.img, 0, 0);
  const lx = b.lit.x;
  lx.globalCompositeOperation = 'source-over';
  lx.clearRect(0, 0, W, H);
  lx.drawImage(plates.lit, 0, 0, W, H);
  lx.globalCompositeOperation = 'destination-in';
  lx.drawImage(b.mask.c, 0, 0, m.w * m.cell, m.h * m.cell);
  lx.globalCompositeOperation = 'source-over';
  ctx.drawImage(b.lit.c, 0, 0);
}

// Draws one frame of a painted scene's light: dark picture, then the lit picture where the light mask is on.
export function lightBlend(ctx, scene, plates, lights, opts = {}) {
  const m = lightMask(scene.w, scene.h, lights, { ambient: opts.ambient ?? scene.ambient ?? 0, cell: opts.cell ?? scene.cell ?? 1 });
  maskBlend(ctx, scene, plates, m);
}

// The scene's lights for time t (found in the picture by motion.py, plus any the screen adds).
export function sceneLights(scene, t, extra = []) {
  return (scene.lights || []).map((l, k) => flicker(l, t, k)).concat(extra);
}
