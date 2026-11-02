// Named story portraits for Mnemos, drawn with the same engine as the procedural faces
// (renderFaceSpec) so the cast and the drill faces read as one world. Each character has a fixed
// spec (stable identity) plus hand-placed costume details drawn in code. All art is original.
import { renderFaceSpec } from './faces.js';

const T = (t) => Math.max(0, Math.min(4, t));

// ---------------------------------------------------------------- costume helpers
// Generic torso garment: fn(x, y, ctx) returns a colour int (or null to leave the pixel alone).
function garment(G, A, fn) {
  const { S, cx } = G;
  for (let y = Math.floor(A.shoulderTop); y < S; y++) {
    const w = A.hwc(y + 0.5);
    for (let x = 0; x < S; x++) {
      const dx = x + 0.5 - cx;
      if (Math.abs(dx) > w) continue;
      const nx = dx / w;
      const lit = nx < -0.55 ? 3 : nx < 0.25 ? 2 : nx < 0.75 ? 1 : 0;
      const c = fn(x, y, { dx, adx: Math.abs(dx), nx, lit, yy: y - A.shoulderTop, w });
      if (c != null) A.put(x, y, c, A.LAB.CLOTH);
    }
  }
}
function vOpen(adx, yy, A, k, depth = 1.2) { return adx < A.neckHW + 0.4 * k && yy < (A.neckHW + 0.4 * k - adx) * depth + 0.6 * k; }

// High upturned coat collar rising either side of the neck.
function collarUp(G, A, ramp, { h = 7, out = 3.2 } = {}) {
  const { k, cx, S } = G;
  const top = A.shoulderTop - h * k;
  for (let y = Math.floor(top); y < A.shoulderTop + 4 * k && y < S; y++) for (let x = 0; x < S; x++) {
    const dx = x + 0.5 - cx, adx = Math.abs(dx);
    const t = (y + 0.5 - top) / (h * k);
    const inner = A.neckHW - 0.2 * k + t * 0.8 * k, outer = A.neckHW + out * k + t * 1.6 * k;
    if (adx < inner || adx > outer) continue;
    if (y + 0.5 < top + (adx - inner) * 0.35) continue; // slanted top edge
    let tone = dx < 0 ? 3 : 1;
    if (adx - inner < 1) tone = dx < 0 ? 2 : 0; // inner face of the collar in shadow
    if (y + 0.5 < top + (adx - inner) * 0.35 + 1) tone = Math.min(4, tone + 1); // lit rim
    A.put(x, y, ramp[T(tone)], A.LAB.CLOTH);
  }
}
function pin(G, A, x, y, c = ['#6a4410', '#c8902c', '#ffe08a']) {
  const P = (dx, dy, i) => A.put(x + dx, y + dy, A.H(c[i]), A.LAB.ACC);
  P(0, 0, 1); P(1, 0, 1); P(0, 1, 1); P(1, 1, 0); P(0, 0, 2);
  if (G.k > 1.2) { P(-1, 0, 1); P(-1, 1, 1); P(0, 2, 0); P(-1, 2, 0); P(-1, -1, 2); P(0, -1, 1); }
}

// ---------------------------------------------------------------- outfits
const OUT = {
  // Wren: long brown coat with a turned-up collar over a cream shirt; a notecard in the breast pocket.
  wrenCoat(C, G, A) {
    const coat = A.rampFrom('#6e4a2e'), shirt = A.rampFrom('#d8ccb0');
    const { k } = G;
    garment(G, A, (x, y, g) => {
      if (vOpen(g.adx, g.yy, A, k, 1.6)) return null;
      if (g.adx < A.neckHW + 1.4 * k && g.yy < 9 * k) return shirt[T(g.lit + (g.yy < 2 * k ? -1 : 0))];
      if (Math.abs(g.adx - (A.neckHW + 1.4 * k)) < 0.6) return coat[0];
      return coat[T(g.lit)];
    });
    collarUp(G, A, coat, { h: 6.5, out: 3.6 });
    // notecard in breast pocket (viewer's right)
    const px = Math.round(G.cx + 8 * k), py = Math.round(A.shoulderTop + 5 * k);
    const cw = Math.round(4 * k), ch = Math.round(4 * k);
    for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) A.put(px + i, py + j, A.H(j === 0 ? '#fff6e0' : i === cw - 1 ? '#b8ae98' : '#ece2c8'), A.LAB.ACC);
    for (let i = 1; i < cw - 1; i++) A.put(px + i, py + 2, A.H('#3a4a78'), A.LAB.ACC);
    for (let i = -1; i <= cw; i++) A.put(px + i, py + ch, coat[0], A.LAB.CLOTH); // pocket lip
  },
  // Sevrin: soft grey robe; the hood itself is head-wear.
  greyRobe(C, G, A) {
    const robe = A.rampFrom('#6c7280');
    garment(G, A, (x, y, g) => {
      if (Math.abs(g.adx - g.yy * 0.25 - 1.5 * G.k) < 0.5 && g.yy > 4 * G.k) return robe[T(g.lit - 1)];
      return robe[T(g.lit)];
    });
  },
  // Hask: road-warden's leather jerkin over a rough shirt, a diagonal strap with a buckle.
  jerkin(C, G, A) {
    const lea = A.rampFrom('#5a3c26'), shirt = A.rampFrom('#7a7262'), strap = A.rampFrom('#2e2018');
    const { k, cx } = G;
    garment(G, A, (x, y, g) => {
      if (vOpen(g.adx, g.yy, A, k, 1.0)) return null;
      if (g.adx < A.neckHW + 1.6 * k && g.yy < 6 * k) return shirt[T(g.lit)];
      const s = (x + 0.5 - cx) + (y - A.shoulderTop) * 1.1;
      if (Math.abs(s - 2 * k) < 1.6 * k) return strap[T(g.lit + (Math.abs(s - 2 * k) < 0.6 ? 1 : 0))];
      if ((x * 7 + y * 3) % 11 === 0 && g.lit > 0) return lea[g.lit - 1]; // worn leather
      return lea[T(g.lit)];
    });
    const bx = Math.round(cx + 4 * k), by = Math.round(A.shoulderTop + 5 * k);
    for (const [i, j] of [[0, 0], [1, 0], [2, 0], [0, 1], [2, 1], [0, 2], [1, 2], [2, 2]]) A.put(bx + i, by + j, A.H(i + j === 0 ? '#ffe08a' : '#b08a3a'), A.LAB.ACC);
  },
  // Isolde: green velvet with a square neckline and gold trim.
  velvet(C, G, A) {
    const vel = A.rampFrom('#2a5a3c'), gold = ['#7a5214', '#c8902c', '#ffd870'];
    const { k } = G;
    const half = A.neckHW + 5 * k, depth = 4.6 * k;
    const scoop = (adx) => depth * Math.sqrt(Math.max(0, 1 - (adx / half) ** 2));
    garment(G, A, (x, y, g) => {
      const sc = scoop(g.adx);
      if (g.adx < half && g.yy < sc) return null;
      if (g.adx < half + 0.8 * k && g.yy < sc + 1.1 * k) return A.H(gold[g.lit >= 2 ? 2 : g.lit >= 1 ? 1 : 0]);
      let t = g.lit;
      if (Math.abs(g.nx + 0.35) < 0.08 && g.yy > 6 * k) t = 4; // velvet sheen
      if (Math.abs(g.nx - 0.4) < 0.06 && g.yy > 5 * k) t = Math.max(0, t - 1);
      return vel[T(t)];
    });
    // skin of the decolletage
    for (let y = Math.floor(A.shoulderTop); y < A.shoulderTop + depth; y++) for (let x = 0; x < G.S; x++) {
      const dx = x + 0.5 - G.cx, adx = Math.abs(dx), yy = y + 0.5 - A.shoulderTop;
      if (adx < half && yy < scoop(adx) && adx < A.hwc(y + 0.5) && adx >= A.neckHW - 0.5) A.skinPut(x, y, dx < -A.neckHW ? 3 : dx > A.neckHW ? 1 : 2);
    }
    // a fine gold chain
    for (let x = Math.round(G.cx - 3 * k); x <= Math.round(G.cx + 2 * k); x++) { const y = Math.round(A.shoulderTop + 1 * k + ((x + 0.5 - G.cx) / k) ** 2 * 0.12 * k); A.put(x, y, A.H(gold[1]), A.LAB.ACC); }
  },
  // Tansy: a heavy knitted shawl crossed at the front, with a sprig of rosemary pinned in it.
  shawl(C, G, A) {
    const sh = A.rampFrom('#7a4e5e'), dress = A.rampFrom('#4a4038');
    const { k, cx } = G;
    garment(G, A, (x, y, g) => {
      if (vOpen(g.adx, g.yy, A, k, 1.3)) return null;
      const cross = (g.dx < 0 ? -g.dx : g.dx) - (A.neckHW + 1.2 * k) + g.yy * (g.dx < 0 ? 0.55 : 0.9);
      const onShawl = cross > 0 || g.yy < 2 * k;
      if (!onShawl) return dress[T(g.lit - 1)];
      let t = g.lit;
      if (((x + y) % 3 === 0) && t > 0) t -= 1; // knit texture
      if (Math.abs(cross) < 0.8) t = 0;
      return sh[T(t)];
    });
    collarUp(G, A, sh, { h: 2.5, out: 4.2 });
    // rosemary sprig on the shawl, viewer's left
    const sx = Math.round(cx - 9 * k), sy = Math.round(A.shoulderTop + 1 * k);
    const stem = A.H('#5a4a2a'), leaf = A.H('#4e7a4a'), leafHi = A.H('#8ab878'), flower = A.H('#9a8ad0');
    for (let i = 0; i < Math.round(8 * k); i++) {
      const x = sx + Math.floor(i * 0.5), y = sy + i;
      A.put(x, y, stem, A.LAB.ACC);
      if (i % 2 === 0 && i > 0) { A.put(x - 1, y, leaf, A.LAB.ACC); A.put(x + 1, y - 1, leafHi, A.LAB.ACC); }
    }
    A.put(sx - 1, sy - 1, leafHi, A.LAB.ACC); A.put(sx, sy - 1, flower, A.LAB.ACC);
  },
  // Calder: dark archivist's robe with a high standing collar and a brass pin.
  archivist(C, G, A) {
    const robe = A.rampFrom('#2c2c3e'), trim = A.rampFrom('#6a5a3a');
    const { k, cx } = G;
    garment(G, A, (x, y, g) => {
      if (Math.abs(g.dx) < 0.6 && g.yy > 2 * k) return robe[0];
      if (Math.abs(g.adx - 0.8 * k) < 0.5 && g.yy > 2 * k) return trim[T(g.lit)];
      return robe[T(g.lit)];
    });
    collarUp(G, A, robe, { h: 4.5, out: 2.4 });
    pin(G, A, Math.round(cx - 6 * k), Math.round(A.shoulderTop + 3 * k));
  },
  // Ennick: plain grey acolyte robe, hood down in folds behind the neck, rope cord.
  acolyte(C, G, A) {
    const robe = A.rampFrom('#7e7c78'), cord = A.rampFrom('#b8a070');
    const { k } = G;
    garment(G, A, (x, y, g) => {
      if (vOpen(g.adx, g.yy, A, k, 0.9)) return null;
      if (g.adx < A.neckHW + 3 * k && g.yy < 2.4 * k) return robe[T(g.lit + 1)]; // hood folds
      if (Math.abs(g.adx - (A.neckHW + 3 * k)) < 0.6 && g.yy < 3 * k) return robe[0];
      if (Math.abs(g.dx - 2 * k) < 0.6 && g.yy > 3 * k) return cord[T(g.lit + 1)];
      return robe[T(g.lit)];
    });
  },
  // Mosk: oilskin jacket and a knotted neckerchief.
  ferry(C, G, A) {
    const coat = A.rampFrom('#3e4a4e'), scarf = A.rampFrom('#8a3a2e');
    const { k } = G;
    garment(G, A, (x, y, g) => {
      if (g.adx < A.neckHW + 3.2 * k && g.yy < 3 * k) return scarf[T(g.lit + (g.yy < 1 ? 1 : 0))];
      if (g.dx > 0 && g.dx < A.neckHW && g.yy >= 3 * k && g.yy < 7 * k) return scarf[T(g.lit - 1)];
      if (Math.abs(g.adx - (A.neckHW + 3.6 * k)) < 0.5) return coat[0];
      return coat[T(g.lit)];
    });
  },
  // Fennick: shirt collar, brown waistcoat, a watch chain.
  waistcoat(C, G, A) {
    const vest = A.rampFrom('#5e4a32'), shirt = A.rampFrom('#d4ccbc'), coat = A.rampFrom('#3a3a44');
    const { k, cx } = G;
    garment(G, A, (x, y, g) => {
      if (vOpen(g.adx, g.yy, A, k, 1.1)) return null;
      if (g.yy < 3 * k && g.adx >= A.neckHW - 0.5 * k && g.adx < A.neckHW + 3 * k - g.yy * 0.6) return shirt[g.dx < 0 ? 3 : 2];
      if (g.adx < A.neckHW + 0.5 * k - g.yy * 0.0 && g.yy < 8 * k && g.adx < (g.yy * 0.5)) return shirt[T(g.lit)];
      if (g.adx > A.neckHW + 6 * k) return coat[T(g.lit)];
      if (Math.abs(g.dx) < 0.6) return vest[0];
      return vest[T(g.lit)];
    });
    for (let i = 0; i < Math.round(5 * k); i++) A.put(Math.round(cx - 1 * k - i), Math.round(A.shoulderTop + 7 * k + Math.sin(i / k * 0.6) * 1), A.H(i % 2 ? '#c8902c' : '#ffd870'), A.LAB.ACC);
  },
  // The Keeper: road cloak with the hood down behind the neck, fastened by a brass clasp.
  cloak(color) {
    return (C, G, A) => {
      const cl = A.rampFrom(color), tunic = A.rampFrom('#6a5e4c');
      const { k, cx } = G;
      garment(G, A, (x, y, g) => {
        if (vOpen(g.adx, g.yy, A, k, 1.1)) return null;
        const edge = A.neckHW + 2.2 * k + g.yy * 0.35;
        if (g.adx < edge && g.yy > 1.5 * k) return tunic[T(g.lit - 1)];
        if (Math.abs(g.adx - edge) < 0.6) return cl[0];
        let t = g.lit;
        if (g.yy < 2 * k && g.adx < A.neckHW + 5 * k) t = Math.min(4, t + 1); // hood folds on the shoulders
        if (Math.abs(g.adx - (A.neckHW + 6.5 * k) - g.yy * 0.2) < 0.5 && g.yy > 3 * k) t = Math.max(0, t - 1);
        return cl[T(t)];
      });
      collarUp(G, A, cl, { h: 2, out: 6 });
      pin(G, A, Math.round(cx - 4 * k), Math.round(A.shoulderTop + 2 * k));
    };
  },
};

// Wren's notecard tucked behind her ear.
function notecard(C, G, A) {
  const { k, cx, temple, lidY } = G;
  const x0 = Math.round(cx - temple - 2.4 * k), y0 = Math.round(lidY - 7 * k);
  const w = Math.round(3.4 * k), h = Math.round(5 * k);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const x = x0 + i - Math.floor(j / 3), y = y0 + j;
    A.put(x, y, A.H(i === 0 ? '#fff8e8' : j === h - 1 || i === w - 1 ? '#b0a68e' : '#ece2c6'), A.LAB.ACC);
    if (j === 2 && i > 0 && i < w - 1) A.put(x, y, A.H('#34487a'), A.LAB.ACC);
  }
}
// Calder's grey streak running back from the temple.
function greyStreak(C, G, A) {
  const { S, cx, temple, lidY, k } = G;
  for (let y = 0; y < lidY; y++) for (let x = 0; x < S; x++) {
    const i = y * S + x; if (C.lab[i] !== A.LAB.HAIR) continue;
    const dx = x + 0.5 - (cx - temple * 0.45);
    if (Math.abs(dx - (y - lidY) * 0.15) < 1.1 * k) C.col[i] = A.mix(C.col[i], A.H('#e8e6ee'), 0.55);
  }
}

// ---------------------------------------------------------------- the cast
const BASE = {
  presentation: 'f', age: 1, skin: 3, faceShape: 'oval', faceWidth: 1, faceLen: 29, eyeShape: 'almond', eyeColor: 'brown', eyeSep: 5.1,
  gaze: 0, lashes: false, browShape: 'straight', browGap: 3, browThick: 1, nose: 'straight', noseLen: 5, mouth: 'neutral', mouthW: 6,
  mouthGap: 3, ears: 'medium', earsOut: 1, hairStyle: 'crop', hairColor: 'dark brown', facialHair: 'none', glasses: null,
  freckles: false, mole: null, scar: null, earring: null, earringColor: 'gold', outfit: 'crew', cloth: '#4a4a5a', cloth2: '#8a6a3a',
  hatColor: '#6a6a7a', bg: '#3c4656', build: 1, blush: false,
};

const CAST = {
  wren: {
    name: 'Wren Halloway', moods: ['neutral', 'smile', 'worried'],
    spec: { seed: 101, age: 0, skin: 2, faceShape: 'heart', faceLen: 30, eyeShape: 'upturned', eyeColor: 'hazel', eyeSep: 5.0, lashes: true, browShape: 'angled', browThick: 1,
      nose: 'snub', noseLen: 5, mouth: 'smirk', mouthW: 6, hairStyle: 'crop', hairColor: 'dark brown', hairOverride: { vt: 2.4, hl: 'side', hlC: 0.17 }, partSide: 'left',
      outfit: 'none', drawOutfit: OUT.wrenCoat, drawTop: notecard, bg: '#5a4a3c', build: 0.98, inkSmudge: [[-7.5, 7.5, 0.45], [-6.5, 8.5, 0.3], [7, 9.5, 0.25]], mole: 'eye', moodMouth: { smile: 'grin' } },
  },
  sevrin: {
    name: 'Sevrin Ashgrave', moods: ['neutral', 'smile', 'stern'],
    spec: { seed: 102, presentation: 'm', age: 2, skin: 2, faceShape: 'long', faceLen: 30.5, eyeShape: 'downturned', eyeColor: 'grey', eyeSep: 5.2, browShape: 'soft', browThick: 1,
      nose: 'long', noseLen: 6, mouth: 'smile', mouthW: 6, hairStyle: 'sidepart', hairColor: 'salt-and-pepper', facialHair: 'beard', beardColor: 'salt-and-pepper',
      headwear: 'hood', hatColor: '#8a909c', outfit: 'none', drawOutfit: OUT.greyRobe, bg: '#3a4250', build: 1.04 },
  },
  hask: {
    name: 'Joss Hask', moods: ['neutral', 'stern', 'smile'],
    spec: { seed: 103, presentation: 'm', age: 2, skin: 5, faceShape: 'square', faceWidth: 1.08, jawMul: 1.06, faceLen: 29.5, eyeShape: 'deepset', eyeColor: 'grey', eyeSep: 5.3,
      browShape: 'bushy', browThick: 2, browGap: 2, scar: 'brow', nose: 'roman', noseLen: 6, mouth: 'thin', mouthW: 6, hairStyle: 'buzz', hairColor: 'dark brown',
      facialHair: 'stubble', ears: 'medium', earsOut: 2, outfit: 'none', drawOutfit: OUT.jerkin, bg: '#4a4436', build: 1.3, neckHW: 6.4, shoulderW: 23.8 },
  },
  isolde: {
    name: 'Isolde Varre', moods: ['neutral', 'sly', 'stern'],
    spec: { seed: 104, age: 1, skin: 6, faceShape: 'diamond', faceLen: 29, eyeShape: 'upturned', eyeColor: 'dark brown', eyeSep: 5.1, lashes: true, browShape: 'arched', browThick: 1,
      nose: 'straight', noseLen: 5, mouth: 'full', mouthW: 6, lipColor: '#7a2a36', hairStyle: 'bun', hairColor: 'black', earring: 'drop', earringOneSide: 'left', earringColor: 'gold',
      outfit: 'none', drawOutfit: OUT.velvet, bg: '#2e3e3a', build: 0.95, neckHW: 3.7 },
  },
  tansy: {
    name: 'Old Tansy', moods: ['neutral', 'smile', 'stern'],
    spec: { seed: 105, age: 3, skin: 1, faceShape: 'heart', faceWidth: 0.96, faceLen: 28.5, eyeShape: 'hooded', eyeColor: 'grey', eyeSep: 4.9, browShape: 'thin', browThick: 1,
      nose: 'long', noseLen: 6, mouth: 'thin', mouthW: 6, hairStyle: 'bun', hairColor: 'white', mole: 'cheekR', outfit: 'none', drawOutfit: OUT.shawl,
      bg: '#4a3e46', build: 0.84, shoulderW: 17.5, neckHW: 3.4, crownY: 8.4 },
  },
  calder: {
    name: 'Elsabet Calder', moods: ['neutral', 'stern', 'smile'],
    spec: { seed: 106, age: 2, skin: 1, faceShape: 'heart', faceWidth: 0.98, faceLen: 29.5, eyeShape: 'hooded', eyeColor: 'grey', eyeSep: 4.9, browShape: 'angled', browThick: 1,
      nose: 'long', noseLen: 6, mouth: 'thin', mouthW: 6, hairStyle: 'bun', hairOverride: { bun: false }, hairColor: 'salt-and-pepper', mole: 'cheekR',
      outfit: 'none', drawOutfit: OUT.archivist, drawTop: greyStreak, bg: '#2e3446', build: 0.96 },
  },
  ennick: {
    name: 'Brother Ennick', moods: ['neutral', 'worried', 'smile'],
    spec: { seed: 107, presentation: 'm', age: 0, skin: 1, faceShape: 'oval', faceWidth: 0.96, faceLen: 29, eyeShape: 'large', eyeColor: 'blue', eyeSep: 5.0, browShape: 'soft', browThick: 1,
      nose: 'button', noseLen: 5, mouth: 'small', mouthW: 4, hairStyle: 'crop', hairColor: 'red', freckles: true, ears: 'large', earsOut: 2,
      outfit: 'none', drawOutfit: OUT.acolyte, bg: '#3e4450', build: 0.94 },
  },
  mosk: {
    name: 'Mosk the ferryman', moods: ['neutral', 'smile'],
    spec: { seed: 108, presentation: 'm', age: 3, skin: 6, faceShape: 'pear', faceLen: 28.5, eyeShape: 'hooded', eyeColor: 'brown', eyeSep: 5.2, browShape: 'bushy', browThick: 2, hairColor: 'white',
      nose: 'broad', noseLen: 6, mouth: 'down', mouthW: 6, hairStyle: 'flatcap', hatColor: '#3a3e4a', facialHair: 'stubble', beardColor: 'white', ears: 'large', earsOut: 2,
      outfit: 'none', drawOutfit: OUT.ferry, bg: '#34464e', build: 1.06 },
  },
  fennick: {
    name: 'Fennick the caretaker', moods: ['neutral', 'smile'],
    spec: { seed: 109, presentation: 'm', age: 3, skin: 0, faceShape: 'long', faceWidth: 0.96, faceLen: 30, eyeShape: 'round', eyeColor: 'blue', eyeSep: 5.0, browShape: 'bushy', browThick: 2,
      nose: 'long', noseLen: 6, mouth: 'thin', mouthW: 6, hairStyle: 'horseshoe', hairColor: 'white', ears: 'large', earsOut: 2, glasses: 'wire',
      outfit: 'none', drawOutfit: OUT.waistcoat, bg: '#4a4038', build: 0.92 },
  },
};
const YOU = {
  lantern: { presentation: 'm', skin: 6, faceShape: 'oval', eyeShape: 'almond', eyeColor: 'dark brown', browShape: 'straight', browThick: 2, nose: 'wide', mouth: 'smile', hairStyle: 'curly', hairColor: 'black', facialHair: 'stubble', cloak: '#3e4e6a', bg: '#4a4030' },
  key: { presentation: 'f', skin: 1, faceShape: 'heart', eyeShape: 'round', eyeColor: 'green', lashes: true, browShape: 'arched', nose: 'button', mouth: 'smile', hairStyle: 'ponytail', hairColor: 'auburn', freckles: true, cloak: '#4a5e3a', bg: '#3e4a56' },
  compass: { presentation: 'm', skin: 4, faceShape: 'square', eyeShape: 'hooded', eyeColor: 'hazel', browShape: 'angled', browThick: 2, nose: 'straight', mouth: 'neutral', hairStyle: 'sidepart', hairColor: 'black', facialHair: 'stubble', mole: 'cheekL', cloak: '#6a4a30', bg: '#3c4a44' },
  quill: { presentation: 'f', skin: 8, faceShape: 'oval', eyeShape: 'large', eyeColor: 'dark brown', lashes: true, browShape: 'soft', nose: 'broad', mouth: 'full', hairStyle: 'locs', hairColor: 'black', earring: 'hoop', cloak: '#5a3e5e', bg: '#4a4036' },
  tower: { presentation: 'n', skin: 3, faceShape: 'round', eyeShape: 'monolid', eyeColor: 'dark brown', browShape: 'straight', nose: 'button', mouth: 'smile', hairStyle: 'bob', hairColor: 'black', cloak: '#3e4650', bg: '#4a3e48' },
  wave: { presentation: 'm', skin: 5, faceShape: 'long', eyeShape: 'almond', eyeColor: 'amber', browShape: 'soft', nose: 'long', mouth: 'smile', hairStyle: 'wavy', hairColor: 'light brown', cloak: '#2e5a5a', bg: '#4a4438' },
};
export const AVATAR_IDS = Object.keys(YOU);
for (const [av, v] of Object.entries(YOU)) {
  const { cloak, ...rest } = v;
  CAST[`you-${av}`] = { name: 'You, the Keeper', moods: ['neutral', 'smile', 'worried'], spec: { seed: 200 + AVATAR_IDS.indexOf(av), age: 0, eyeSep: 5.1, drawOutfit: OUT.cloak(cloak), outfit: 'none', ...rest } };
}

export const PORTRAIT_IDS = Object.keys(CAST);
export const PORTRAIT_MOODS = Object.fromEntries(Object.entries(CAST).map(([id, c]) => [id, c.moods]));
PORTRAIT_MOODS.you = PORTRAIT_MOODS['you-lantern'];

function resolveId(id, avatar) {
  if (id === 'you' || id === 'player' || id === 'keeper') return `you-${YOU[avatar] ? avatar : 'lantern'}`;
  if (typeof id === 'string' && id.startsWith('you:')) return resolveId('you', id.slice(4));
  if (CAST[id]) return id;
  return null;
}

const cache = new Map();
// Named portrait as a raw sprite. Unknown ids fall back to a stable procedural face (seeded by the id),
// unknown moods fall back to 'neutral'. The player portrait accepts { avatar } or ids like 'you-wave'.
export function portraitSprite(id, mood = 'neutral', { size = 64, avatar } = {}) {
  const rid = resolveId(id, avatar);
  const key = `${rid || id}|${mood}|${size}`;
  if (cache.has(key)) return cache.get(key);
  let spr;
  if (rid) {
    const c = CAST[rid];
    const m = c.moods.includes(mood) ? mood : 'neutral';
    const eff = m === 'neutral' ? c.spec.baseMood || 'neutral' : m;
    spr = renderFaceSpec({ ...BASE, ...c.spec, mood: eff }, size);
  } else {
    let h = 2166136261; for (const ch of String(id)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    spr = renderFaceSpec({ ...BASE, seed: h >>> 0, mood: ['smile', 'worried', 'stern', 'sly'].includes(mood) ? mood : 'neutral', bg: '#3c4656' }, size);
  }
  cache.set(key, spr);
  return spr;
}

export function portraitLabel(id, mood = 'neutral') {
  const rid = resolveId(id);
  const name = rid ? CAST[rid].name : 'A stranger';
  return mood && mood !== 'neutral' ? `${name}, ${mood === 'sly' ? 'with a sly smile' : mood === 'smile' ? 'smiling' : mood}` : name;
}
