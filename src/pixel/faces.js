// Procedural human pixel portraits for Mnemos (Names-and-Faces drill + named story portraits).
// All art is original and drawn pixel by pixel in code. No image files.
//
// Pipeline: a face "spec" (plain object of chosen features) is rendered into a labelled pixel
// canvas (colour + material label + skin tone index per pixel), then outlined and copied into a
// makeBuffer() raw sprite. Geometry is designed on a 48px grid and scaled by k = size / 48.
//
// Exports:
//   faceParams(seed)            -> plain object of features (deterministic)
//   faceSprite(seed, {size})    -> raw sprite { w, h, rgba }
//   describeFace(seed)          -> short plain-English description of the most distinctive features
//   renderFaceSpec(spec, size)  -> raw sprite (used by portraits.js)
//   SKIN_TONES, HAIR_COLORS, HAIR_STYLES, ... (catalogues, read-only)
import { makeBuffer } from './core.js';

// ------------------------------------------------------------------ RNG (local, deterministic)
function rng(seed) {
  let a = (Math.imul((seed | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ 0x2545f491) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// A separate stream per feature, so features vary independently from one another.
function fmix(h) { h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return h >>> 0; }
function stream(seed, salt) { return rng(fmix(fmix((seed | 0) ^ 0x5bd1e995) + Math.imul(salt + 1, 0x27d4eb2d))); }
const pickW = (r, items) => { // items: [[value, weight], ...]
  let tot = 0; for (const it of items) tot += it[1];
  let x = r() * tot; for (const it of items) { x -= it[1]; if (x < 0) return it[0]; }
  return items[items.length - 1][0];
};
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const between = (r, a, b) => a + r() * (b - a);

// ------------------------------------------------------------------ colour helpers (ints 0xRRGGBB)
const H = (s) => parseInt(s.slice(1, 7), 16);
function mix(a, b, t) {
  const r = ((a >> 16) & 255) * (1 - t) + ((b >> 16) & 255) * t;
  const g = ((a >> 8) & 255) * (1 - t) + ((b >> 8) & 255) * t;
  const bl = (a & 255) * (1 - t) + (b & 255) * t;
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(bl);
}
const DARK = H('#1b1222');
const WARM_LIGHT = H('#fff4dc');
function rampFrom(base, n = 5) { // generic cloth ramp: deep, shadow, mid, light, highlight
  const b = H(base);
  const r = [mix(b, DARK, 0.56), mix(b, DARK, 0.3), b, mix(b, WARM_LIGHT, 0.2), mix(b, WARM_LIGHT, 0.42)];
  return n === 5 ? r : r.slice(0, n);
}

// ------------------------------------------------------------------ catalogues
// Skin ramps: [deep, shadow, mid, light, highlight], lip colour, blush colour. Hand-tuned, hue-shifted
// (shadows warmer/redder, highlights yellower) so every tone reads as living skin.
export const SKIN_TONES = [
  { name: 'porcelain', ramp: ['#a8706c', '#d49a8e', '#f0c2ae', '#f9d6c2', '#fff0e2'], lip: '#c77a78', brow: 0 },
  { name: 'fair', ramp: ['#a46c56', '#d29878', '#eebd98', '#f8d1b0', '#ffe7cf'], lip: '#c27a6c', brow: 0 },
  { name: 'light olive', ramp: ['#8c6a4a', '#bc9068', '#dab088', '#eac59c', '#f6dcb8'], lip: '#b47a62', brow: 0 },
  { name: 'light golden', ramp: ['#9a6e4e', '#c6966e', '#e2b88e', '#f0cba4', '#fae0c2'], lip: '#c08068', brow: 0 },
  { name: 'tan', ramp: ['#7e4e32', '#ab7048', '#cc9264', '#dfaa7c', '#efc79a'], lip: '#a8644c', brow: 1 },
  { name: 'olive brown', ramp: ['#684a32', '#916a48', '#b5895e', '#c9a074', '#dcbc92'], lip: '#9a6650', brow: 1 },
  { name: 'warm brown', ramp: ['#56331f', '#7d4f33', '#a06a48', '#b8825c', '#d09f78'], lip: '#865040', brow: 1 },
  { name: 'deep brown', ramp: ['#43261a', '#643a28', '#84523a', '#9c674c', '#b78466'], lip: '#6e3c32', brow: 1 },
  { name: 'dark brown', ramp: ['#311b14', '#4c2d21', '#6a4230', '#875a42', '#a87a60'], lip: '#58302a', brow: 1 },
  { name: 'ebony', ramp: ['#1f1318', '#342026', '#4c3134', '#6a4842', '#8e6a5e'], lip: '#3e2428', brow: 1 },
];
// Hair ramps: [deep, dark, mid, light, highlight]
export const HAIR_COLORS = [
  { name: 'black', ramp: ['#0f0d14', '#1c1922', '#2c2834', '#423c4c', '#625a70'] },
  { name: 'dark brown', ramp: ['#1a110c', '#2c1d14', '#422c1f', '#5c3f2c', '#7c5a40'] },
  { name: 'brown', ramp: ['#2a1810', '#45291a', '#653f26', '#875834', '#ab7a4e'] },
  { name: 'light brown', ramp: ['#3e2818', '#644228', '#8a6038', '#ab7e4e', '#c9a070'] },
  { name: 'auburn', ramp: ['#33140c', '#5a2414', '#80361e', '#a64e2c', '#c8724a'] },
  { name: 'red', ramp: ['#4c1c0a', '#7e3412', '#ac5020', '#d0702e', '#ec9a54'] },
  { name: 'blond', ramp: ['#6a4c24', '#9a7438', '#c49c54', '#dcbc74', '#f0dca0'] },
  { name: 'ash blond', ramp: ['#5a5040', '#857a5e', '#ab9f7c', '#c8bd9a', '#e2d8bc'] },
  { name: 'grey', ramp: ['#3c3c44', '#5e5e68', '#868690', '#acacb4', '#d0d0d6'] },
  { name: 'white', ramp: ['#6e6c78', '#9a98a4', '#c2c0ca', '#e0dee4', '#fbfaf8'] },
  { name: 'salt-and-pepper', ramp: ['#1e1c22', '#3a3840', '#626068', '#8c8a92', '#b8b6bc'] },
];
const HAIR_IDX = Object.fromEntries(HAIR_COLORS.map((h, i) => [h.name, i]));
export const EYE_COLORS = [
  { name: 'dark brown', c: ['#1a0f0c', '#3a2218', '#5a3624'] },
  { name: 'brown', c: ['#26140c', '#5a361e', '#86562e'] },
  { name: 'hazel', c: ['#2a2010', '#6a5a2a', '#94803e'] },
  { name: 'green', c: ['#14261a', '#3a6a40', '#62965a'] },
  { name: 'blue', c: ['#142238', '#3a6094', '#6c98c8'] },
  { name: 'grey', c: ['#1e2228', '#5a6672', '#8c98a2'] },
  { name: 'amber', c: ['#2e1a08', '#8a5a1a', '#c08a34'] },
];
export const FACE_SHAPES = {
  oval: { temple: 10.9, cheek: 11.4, jaw: 9.4, chin: 3.0, p: 2.0, len: 0, jawAt: 0.72 },
  round: { temple: 11.6, cheek: 12.2, jaw: 10.6, chin: 4.0, p: 2.0, len: -2, jawAt: 0.7 },
  square: { temple: 11.4, cheek: 11.7, jaw: 11.0, chin: 5.4, p: 3.2, len: 0, jawAt: 0.76 },
  heart: { temple: 12.0, cheek: 11.8, jaw: 8.6, chin: 2.2, p: 1.6, len: -0.5, jawAt: 0.68 },
  long: { temple: 10.4, cheek: 10.8, jaw: 9.3, chin: 3.5, p: 2.2, len: 2.5, jawAt: 0.76 },
  diamond: { temple: 10.0, cheek: 12.1, jaw: 8.8, chin: 2.6, p: 1.7, len: 0.5, jawAt: 0.7 },
  pear: { temple: 10.4, cheek: 11.2, jaw: 11.2, chin: 4.6, p: 2.6, len: 0, jawAt: 0.74 },
};
export const EYE_SHAPES = ['almond', 'round', 'upturned', 'downturned', 'hooded', 'monolid', 'deepset', 'large'];
export const BROW_SHAPES = ['straight', 'arched', 'angled', 'soft', 'bushy', 'thin', 'unibrow'];
export const NOSE_TYPES = ['button', 'straight', 'wide', 'hooked', 'long', 'snub', 'broad', 'roman'];
export const MOUTH_TYPES = ['neutral', 'smile', 'thin', 'full', 'wide', 'small', 'down', 'grin', 'smirk'];
export const HAIR_STYLES = ['bald', 'horseshoe', 'buzz', 'crop', 'sidepart', 'receding', 'spiky', 'curly', 'afro', 'braids', 'locs', 'bun', 'ponytail', 'long', 'wavy', 'bob', 'hijab', 'headwrap', 'flatcap', 'widebrim', 'beanie'];
export const FACIAL_HAIR = ['none', 'stubble', 'moustache', 'goatee', 'beard', 'fullbeard', 'chinstrap'];
const CLOTH_COLORS = ['#3f5a7a', '#6b3f4e', '#4f6d3a', '#7a5a3a', '#2f4a4a', '#5a4a7a', '#8a6a3a', '#3a3a48', '#7a3a2e', '#2e5a5a', '#5e6e7a', '#6e5a48', '#4a3a5a', '#8a7a5a'];
const SCARF_COLORS = ['#3e6e8a', '#8a3e52', '#4e7a4a', '#c08a3a', '#6a4a8a', '#2e3e5a', '#a85a3a', '#d8c8a8', '#5a2e3a', '#3a5e5a', '#7a6aa0', '#b07a8a'];
const BG_COLORS = ['#3c4a5e', '#4a3e56', '#3e5650', '#5a4a3c', '#3c4656', '#56404a', '#424e3a', '#4c4c5c'];
const OUTFITS = ['crew', 'collar', 'vneck', 'jacket', 'turtle', 'tunic', 'scarf'];

// ------------------------------------------------------------------ features from seed
export function faceParams(seed) {
  seed = Number.isFinite(+seed) ? Math.trunc(+seed) : 0;
  const S = (n) => stream(seed, n);
  const r0 = S(0);
  const pres = pickW(r0, [['f', 0.46], ['m', 0.46], ['n', 0.08]]);
  const age = pickW(r0, [[0, 0.3], [1, 0.32], [2, 0.22], [3, 0.16]]);
  const skin = Math.floor(S(1)() * SKIN_TONES.length);
  const dark = skin >= 6, mid = skin >= 4;

  // Hair style: texture-aware weights so the population looks natural.
  const rs = S(2);
  const W = {
    bald: pres === 'm' ? (age >= 2 ? 6 : 2.5) : 0.3, horseshoe: pres === 'm' && age >= 2 ? 6 : 0,
    buzz: pres === 'm' ? 5 : 1.5, crop: pres === 'm' ? 7 : 3, sidepart: pres === 'm' ? 6 : 2.5,
    receding: pres === 'm' && age >= 1 ? 4 : 0, spiky: age <= 1 ? 2.5 : 0.5,
    curly: mid ? 5 : 2.5, afro: dark ? 5 : mid ? 1 : 0.2, braids: dark ? (pres === 'm' ? 2 : 5) : 0.4,
    locs: dark ? 3 : 0.4, bun: pres === 'm' ? 0.6 : 5, ponytail: pres === 'm' ? 0.6 : 4,
    long: pres === 'm' ? 1 : 6, wavy: pres === 'm' ? 0.7 : 5, bob: pres === 'm' ? 0.2 : 5,
    hijab: pres === 'f' ? 3 : 0, headwrap: pres === 'f' && mid ? 2.5 : 0.2,
    flatcap: pres === 'm' ? 2.5 : 0.5, widebrim: 1.4, beanie: 1.6,
  };
  const hairStyle = pickW(rs, Object.entries(W));

  // Hair colour: natural spread, greys with age.
  const rc = S(3);
  let hairColor;
  if (age === 3 && rc() < 0.75) hairColor = pickW(rc, [['white', 1], ['grey', 1.3], ['salt-and-pepper', 0.8]]);
  else if (age === 2 && rc() < 0.35) hairColor = pickW(rc, [['grey', 1], ['salt-and-pepper', 1.4]]);
  else if (skin >= 5) hairColor = pickW(rc, [['black', 6], ['dark brown', 3], ['brown', 0.8], ['auburn', 0.3]]);
  else hairColor = pickW(rc, [['black', 2.5], ['dark brown', 3], ['brown', 3], ['light brown', 2], ['auburn', 1.2], ['red', 1], ['blond', 1.6], ['ash blond', 1]]);

  const rf = S(4);
  const faceShape = pickW(rf, [['oval', 3], ['round', 2], ['square', pres === 'm' ? 3 : 1.4], ['heart', pres === 'f' ? 2.2 : 0.8], ['long', 1.6], ['diamond', 1.2], ['pear', 1.1]]);
  const faceWidth = +between(rf, 0.93, 1.07).toFixed(3);
  const faceLen = +between(rf, 27.5, 30.5).toFixed(2);

  const re = S(5);
  const eyeShape = pickW(re, [['almond', 3], ['round', 2], ['upturned', 1.4], ['downturned', 1.4], ['hooded', 1.6 + age * 0.6], ['monolid', skin <= 3 ? 1.6 : 0.6], ['deepset', 1.2], ['large', 1.4]]);
  const eyeColor = pickW(re, skin >= 4 ? [['dark brown', 6], ['brown', 4], ['hazel', 1.2], ['amber', 0.8], ['green', 0.3], ['grey', 0.2]] : [['dark brown', 2], ['brown', 3], ['hazel', 2], ['green', 1.6], ['blue', 2.6], ['grey', 1.4], ['amber', 0.6]]);
  const eyeSep = +between(re, 4.4, 6.1).toFixed(2);
  const gaze = pick(re, [-1, 0, 0, 1]);
  const lashes = pres === 'f' ? re() < 0.75 : re() < 0.12;

  const rb = S(6);
  const browShape = pickW(rb, [['straight', 3], ['arched', pres === 'f' ? 4 : 1.5], ['angled', 2.4], ['soft', 2], ['bushy', pres === 'm' ? 3 : 0.8], ['thin', pres === 'f' ? 2 : 0.6], ['unibrow', 0.35]]);
  const browGap = pick(rb, [2, 3, 3, 4]);
  const browThick = browShape === 'bushy' ? 2 : browShape === 'thin' ? 1 : pickW(rb, [[1, pres === 'f' ? 3 : 1], [2, pres === 'f' ? 1 : 3]]);

  const rn = S(7);
  const nose = pickW(rn, [['button', 2], ['straight', 3], ['wide', mid ? 3 : 1.2], ['hooked', 1.5], ['long', 1.5], ['snub', 1.5], ['broad', dark ? 2.5 : 0.8], ['roman', 1.4]]);
  const noseLen = nose === 'long' || nose === 'hooked' || nose === 'roman' ? pick(rn, [6, 6, 7]) : nose === 'snub' || nose === 'button' ? pick(rn, [4, 5]) : pick(rn, [5, 5, 6]);

  const rm = S(8);
  const mouth = pickW(rm, [['neutral', 4], ['smile', 3], ['thin', age >= 2 ? 3 : 1.4], ['full', mid ? 3 : 1.6], ['wide', 1.4], ['small', 1.4], ['down', 1 + age * 0.4], ['grin', 1.2], ['smirk', 1.2]]);
  const mouthW = mouth === 'wide' || mouth === 'grin' ? 8 : mouth === 'small' ? 4 : pick(rm, [6, 6, 6, 8]);
  const mouthGap = pick(rm, [3, 3, 4]);

  const ra = S(9);
  const ears = pickW(ra, [['small', 2], ['medium', 4], ['large', 1.8]]);
  const earsOut = ears === 'large' ? 2 : ears === 'small' ? 1 : pick(ra, [1, 2]);

  // Facial hair
  const rh = S(10);
  let facialHair = 'none';
  if (pres === 'm' && age >= 1) facialHair = pickW(rh, [['none', 3], ['stubble', 2], ['moustache', 1.2], ['goatee', 1.1], ['beard', 1.6], ['fullbeard', 1.2], ['chinstrap', 0.6]]);
  else if (pres === 'm') facialHair = pickW(rh, [['none', 4], ['stubble', 2], ['moustache', 0.5], ['goatee', 0.8], ['beard', 0.8], ['chinstrap', 0.4]]);
  let beardColor = hairColor;
  if (facialHair !== 'none' && age >= 2 && rh() < 0.5) beardColor = pick(rh, ['grey', 'salt-and-pepper', 'white']);

  // Marks and accessories (stable, memorable)
  const rx = S(11);
  const glasses = rx() < 0.14 + age * 0.06 ? pick(rx, ['round', 'rect', 'half', 'wire', 'thick']) : null;
  const freckles = skin <= 4 && age <= 2 && rx() < (hairColor === 'red' || hairColor === 'auburn' ? 0.6 : 0.16);
  const mole = rx() < 0.2 ? pick(rx, ['cheekL', 'cheekR', 'lip', 'chin', 'jaw', 'eye', 'temple']) : null;
  const scar = rx() < 0.08 ? pick(rx, ['brow', 'cheek', 'lip', 'chin']) : null;
  const earring = pres !== 'm' ? (rx() < 0.4 ? pick(rx, ['stud', 'hoop', 'drop']) : null) : (rx() < 0.07 ? 'stud' : null);
  const earringColor = pick(rx, ['gold', 'gold', 'silver']);

  const rk = S(12);
  const outfit = pick(rk, OUTFITS);
  const cloth = pick(rk, CLOTH_COLORS);
  const cloth2 = pick(rk, SCARF_COLORS);
  const bg = pick(rk, BG_COLORS);
  const hatColor = pick(rk, SCARF_COLORS);
  const build = pres === 'm' ? pick(rk, [1, 1, 1.08, 1.14]) : pick(rk, [0.92, 0.96, 1]);
  const blush = pres === 'f' ? rk() < 0.5 : rk() < 0.12;

  return {
    seed, presentation: pres, age, skin, skinName: SKIN_TONES[skin].name,
    faceShape, faceWidth, faceLen, eyeShape, eyeColor, eyeSep, gaze, lashes,
    browShape, browGap, browThick, nose, noseLen, mouth, mouthW, mouthGap,
    ears, earsOut, hairStyle, hairColor, facialHair, beardColor,
    glasses, freckles, mole, scar, earring, earringColor,
    outfit, cloth, cloth2, hatColor, bg, build, blush, mood: 'neutral',
  };
}

// ------------------------------------------------------------------ description (a11y label)
export function describeFace(seed) {
  const p = typeof seed === 'object' && seed ? seed : faceParams(seed);
  const items = [];
  const add = (score, text) => items.push([score, text]);
  const hc = p.hairColor === 'salt-and-pepper' ? 'greying' : p.hairColor;
  if (p.scar) add(0.98, { brow: 'a scar through one eyebrow', cheek: 'a scar on the cheek', lip: 'a scar on the lip', chin: 'a scar on the chin' }[p.scar]);
  if (p.glasses) add(0.92, { round: 'round glasses', rect: 'square glasses', half: 'half-rim glasses', wire: 'thin wire glasses', thick: 'thick black glasses' }[p.glasses]);
  const fh = { stubble: [0.5, 'stubble'], moustache: [0.85, 'a moustache'], goatee: [0.82, 'a goatee'], beard: [0.84, 'a short beard'], fullbeard: [0.9, 'a full beard'], chinstrap: [0.8, 'a chinstrap beard'] }[p.facialHair];
  if (fh) add(fh[0], p.beardColor !== p.hairColor && p.facialHair !== 'stubble' ? `a grey ${fh[1].replace(/^an? /, '')}` : fh[1]);
  const hs = {
    bald: [0.88, 'a bald head'], horseshoe: [0.8, 'a balding crown'], buzz: [0.45, `buzzed ${hc} hair`], crop: [0.3, `short ${hc} hair`],
    sidepart: [0.35, `side-parted ${hc} hair`], receding: [0.55, 'a receding hairline'], spiky: [0.55, `spiky ${hc} hair`], curly: [0.5, `curly ${hc} hair`],
    afro: [0.75, `a ${hc} afro`], braids: [0.72, 'long braids'], locs: [0.72, 'locs'], bun: [0.5, `${hc} hair in a bun`], ponytail: [0.45, `a ${hc} ponytail`],
    long: [0.42, `long ${hc} hair`], wavy: [0.45, `wavy ${hc} hair`], bob: [0.48, `a ${hc} bob`], hijab: [0.86, 'a headscarf'], headwrap: [0.8, 'a patterned head wrap'],
    flatcap: [0.7, 'a flat cap'], widebrim: [0.74, 'a wide-brimmed hat'], beanie: [0.66, 'a knit cap'],
  }[p.hairStyle];
  if (hs) add(hs[0] + ((p.hairColor === 'red' || p.hairColor === 'white') && !['hijab', 'headwrap', 'bald'].includes(p.hairStyle) ? 0.2 : 0), hs[1]);
  if (p.mole) add(0.7, { cheekL: 'a mole on the cheek', cheekR: 'a mole on the cheek', lip: 'a mole above the lip', chin: 'a mole on the chin', jaw: 'a mole on the jaw', eye: 'a mole by the eye', temple: 'a mole on the temple' }[p.mole]);
  if (p.freckles) add(0.68, 'freckles');
  if (p.browShape === 'unibrow') add(0.78, 'a unibrow');
  else if (p.browShape === 'bushy') add(0.6, 'heavy brows');
  else if (p.browShape === 'thin') add(0.36, 'thin brows');
  else if (p.browShape === 'arched') add(0.3, 'arched brows');
  if (p.ears === 'large') add(0.58, 'prominent ears');
  const nz = { hooked: [0.64, 'a hooked nose'], roman: [0.56, 'a strong nose'], long: [0.5, 'a long nose'], snub: [0.48, 'an upturned nose'], wide: [0.42, 'a wide nose'], broad: [0.44, 'a broad nose'], button: [0.36, 'a button nose'], straight: [0.2, 'a straight nose'] }[p.nose];
  add(nz[0], nz[1]);
  const fs = { square: [0.42, 'a square jaw'], long: [0.4, 'a long face'], round: [0.38, 'a round face'], heart: [0.36, 'a pointed chin'], diamond: [0.36, 'high cheekbones'], pear: [0.38, 'a wide jaw'], oval: [0.1, 'an oval face'] }[p.faceShape];
  add(fs[0], fs[1]);
  if (p.age === 3) add(0.62, 'a deeply lined face'); else if (p.age === 2) add(0.3, 'smile lines');
  const mo = { full: [0.4, 'full lips'], thin: [0.34, 'thin lips'], grin: [0.46, 'a toothy grin'], smirk: [0.44, 'a lopsided smile'], wide: [0.36, 'a wide mouth'], down: [0.32, 'a downturned mouth'], smile: [0.2, 'a gentle smile'], small: [0.3, 'a small mouth'], neutral: [0.05, 'a straight mouth'] }[p.mouth];
  add(mo[0], mo[1]);
  if (p.earring && !['hijab', 'headwrap'].includes(p.hairStyle)) add(0.4, p.earring === 'hoop' ? `${p.earringColor} hoop earrings` : `${p.earringColor} earrings`);
  if (['blue', 'green', 'grey'].includes(p.eyeColor)) add(0.34, `${p.eyeColor} eyes`);
  if (p.eyeShape === 'large') add(0.3, 'large eyes'); else if (p.eyeShape === 'deepset') add(0.3, 'deep-set eyes'); else if (p.eyeShape === 'hooded') add(0.24, 'hooded eyes');
  items.sort((a, b) => b[0] - a[0]);
  const out = [];
  for (const [, t] of items) { if (!out.includes(t)) out.push(t); if (out.length === 3) break; }
  return out.join(', ');
}

// ------------------------------------------------------------------ canvas
const BG = 0, SKIN = 1, HAIR = 2, CLOTH = 3, EYE = 4, FEAT = 5, ACC = 6, HAT = 7, BEARD = 8;
export const LABELS = { BG, SKIN, HAIR, CLOTH, EYE, FEAT, ACC, HAT, BEARD };
export { mix as mixColor, H as hexInt, rampFrom };
const HEADWEAR = ['hijab', 'headwrap', 'flatcap', 'widebrim', 'beanie'];

function makeCanvas(S) {
  return { S, col: new Int32Array(S * S), lab: new Uint8Array(S * S), tone: new Int8Array(S * S).fill(-1), op: new Uint8Array(S * S) };
}

// ------------------------------------------------------------------ the renderer
export function renderFaceSpec(sp, size = 48) {
  const S = Math.max(32, Math.round(size));
  const k = S / 48;
  const C = makeCanvas(S);
  const { col, lab, tone, op } = C;
  const cx = S / 2;
  const R = (v) => Math.round(v * k);
  const inB = (x, y) => x >= 0 && y >= 0 && x < S && y < S;
  const idx = (x, y) => y * S + x;
  const skinT = SKIN_TONES[sp.skin] || SKIN_TONES[3];
  const SK = skinT.ramp.map(H);
  const hairT = HAIR_COLORS[HAIR_IDX[sp.hairColor] ?? 1];
  const HR = hairT.ramp.map(H);
  const BR = (HAIR_COLORS[HAIR_IDX[sp.beardColor] ?? HAIR_IDX[sp.hairColor] ?? 1]).ramp.map(H);
  const mood = sp.mood || 'neutral';

  const put = (x, y, c, l) => { if (!inB(x, y)) return; const i = idx(x, y); col[i] = c; lab[i] = l; op[i] = 1; if (l !== SKIN) tone[i] = -1; };
  const skinPut = (x, y, t) => { if (!inB(x, y)) return; t = t < 0 ? 0 : t > 4 ? 4 : t; const i = idx(x, y); col[i] = SK[t]; lab[i] = SKIN; tone[i] = t; op[i] = 1; };
  const isSkin = (x, y) => inB(x, y) && lab[idx(x, y)] === SKIN;
  const shade = (x, y, d) => { if (isSkin(x, y)) skinPut(x, y, tone[idx(x, y)] + d); };
  const skinTo = (x, y, t) => { if (isSkin(x, y)) skinPut(x, y, Math.min(t, tone[idx(x, y)])); };
  const tint = (x, y, c, t) => { if (!inB(x, y)) return; const i = idx(x, y); if (op[i]) col[i] = mix(col[i], c, t); };

  // ---------------- geometry
  const sh = FACE_SHAPES[sp.faceShape] || FACE_SHAPES.oval;
  const L = (sp.faceLen + sh.len) * k;
  const crownY = (sp.crownY ?? 7.6) * k;
  const chinY = crownY + L;
  const wf = sp.faceWidth || 1;
  const temple = sh.temple * wf * k, cheek = sh.cheek * wf * k, jaw = sh.jaw * wf * k * (sp.jawMul || 1), chinW = sh.chin * k * (sp.jawMul || 1);
  const eyeY = Math.round(crownY + L * 0.5 + (sp.eyeOff || 0) * k); // first visible eye row (white)
  const lidY = eyeY - 1;
  const browY = crownY + L * 0.37;
  const cheekY = eyeY + 2.5 * k;
  const jawY = crownY + L * sh.jawAt;
  const noseY = lidY + R(sp.noseLen || 5) + 1; // bottom row of nose
  const mouthY = noseY + R(sp.mouthGap || 3);
  const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
  function hw(y) { // face half-width at float y
    if (y < crownY || y > chinY) return 0;
    if (y < browY) { const t = (browY - y) / (browY - crownY); return temple * Math.sqrt(Math.max(0, 1 - t * t)); }
    if (y < cheekY) return temple + (cheek - temple) * smooth((y - browY) / (cheekY - browY));
    if (y < jawY) return cheek + (jaw - cheek) * smooth((y - cheekY) / (jawY - cheekY));
    const t = Math.min(1, (y - jawY) / (chinY - jawY));
    return chinW + (jaw - chinW) * Math.pow(Math.max(0, 1 - Math.pow(t, sh.p)), 1 / sh.p);
  }
  const HW = new Float32Array(S); for (let y = 0; y < S; y++) HW[y] = hw(y + 0.5);
  const inFace = (x, y) => y >= 0 && y < S && Math.abs(x + 0.5 - cx) < HW[y];
  const faceTop = Math.floor(crownY), faceBot = Math.ceil(chinY) - 1;
  const mirror = (x) => S - 1 - x;
  // Expose the geometry to custom extras (portraits).
  const G = { S, k, cx, crownY, chinY, L, temple, cheek, jaw, eyeY, lidY, browY, noseY, mouthY, HW, R, mirror };

  const build = sp.build || 1;
  const neckHW = (sp.neckHW || (sp.presentation === 'm' ? 4.7 : 4.0) * build) * k;
  const shoulderTop = chinY + 3.2 * k;
  const SW = Math.min(S / 2 - 1, (sp.shoulderW || 20.5 * build) * k);
  function hwc(y) { // clothing/torso half width
    if (y < shoulderTop) return 0;
    const t = Math.min(1, (y + 0.5 - shoulderTop) / (6.5 * k));
    return neckHW + 1.2 * k + (SW - neckHW - 1.2 * k) * Math.pow(Math.sin(t * Math.PI / 2), 0.55);
  }

  // ---------------- background tile
  const bgBase = H(sp.bg || '#3c4a5e');
  const bgDark = mix(bgBase, DARK, 0.42), bgMid = bgBase, bgLight = mix(bgBase, H('#e8dcc0'), 0.12), bgPat = mix(bgBase, DARK, 0.14);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = (x + 0.5 - cx * 0.86) / (S * 0.46), dy = (y + 0.5 - S * 0.4) / (S * 0.5);
    const d = dx * dx + dy * dy;
    let c = d < 0.55 ? bgLight : bgMid;
    if (d >= 0.55 && ((x + y * 3) % 8 === 0) && (y % 4 === 1)) c = bgPat;
    if (y >= S - Math.max(2, R(2))) c = mix(c, DARK, 0.18);
    col[idx(x, y)] = c; op[idx(x, y)] = 1;
  }
  for (let i = 0; i < S; i++) { col[idx(i, 0)] = bgDark; col[idx(i, S - 1)] = bgDark; col[idx(0, i)] = bgDark; col[idx(S - 1, i)] = bgDark; }
  for (const [x, y] of [[0, 0], [S - 1, 0], [0, S - 1], [S - 1, S - 1]]) op[idx(x, y)] = 0;

  // ---------------- hair masks (computed up-front; drawn in two layers)
  const style = sp.hairStyle || 'crop';
  const headwear = sp.headwear || (HEADWEAR.includes(style) ? style : null);
  const hairInfo = hairMasks(style, sp, G, inFace);
  const back = hairInfo.back, front = hairInfo.front;
  const hairShade = hairInfo.shade;

  // back hair layer (behind neck & shoulders)
  const drawHairPx = (x, y, layer) => {
    const t = hairShade(x, y, layer);
    put(x, y, style === 'buzz' ? mix(HR[Math.min(4, t + 1)], SK[Math.max(1, t)], sp.hairColor === 'black' || sp.hairColor === 'dark brown' ? 0.3 : 0.42) : HR[t], HAIR);
  };
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (back[idx(x, y)]) drawHairPx(x, y, 'back');
  if (sp.drawBack) sp.drawBack(C, G, { put, skinPut, mix, H, HR, SK , hwc, neckHW, shoulderTop, LAB: LABELS, rampFrom, tint });

  // ---------------- neck
  const neckTop = Math.floor(jawY - 2 * k), neckBot = Math.ceil(shoulderTop + 6 * k);
  for (let y = neckTop; y < Math.min(S, neckBot); y++) for (let x = 0; x < S; x++) {
    const dx = x + 0.5 - cx;
    if (Math.abs(dx) < neckHW + (y > shoulderTop ? (y - shoulderTop) * 0.4 : 0)) {
      let t = dx < -neckHW * 0.35 ? 2 : 1;
      if (y < chinY + 2.2 * k) t = 0; // chin cast shadow
      else if (dx > neckHW * 0.5) t = 0;
      skinPut(x, y, t);
    }
  }

  // ---------------- clothing
  drawClothes(C, sp, G, { put, skinPut, isSkin, hwc, neckHW, shoulderTop, inB, idx });
  if (sp.drawOutfit) sp.drawOutfit(C, G, { put, skinPut, isSkin, hwc, neckHW, shoulderTop, mix, H, inB, idx, SK, HR , hwc, neckHW, shoulderTop, LAB: LABELS, rampFrom, tint });

  // ---------------- ears (behind face edge)
  const earTop = lidY - R(1), earBot = noseY + (sp.ears === 'large' ? R(1) : 0) - (sp.ears === 'small' ? R(1) : 0);
  const earOut = Math.max(1, Math.round((sp.earsOut || 1) * k));
  const earPos = [];
  for (const side of [-1, 1]) {
    for (let y = earTop; y <= earBot; y++) {
      const edge = HW[y];
      const t = (y - earTop) / Math.max(1, earBot - earTop);
      const bulge = earOut * (t < 0.2 ? 0.75 : t > 0.82 ? 0.55 : 1);
      const w = Math.max(1, Math.round(bulge + 0.2));
      for (let j = 0; j < w + 2; j++) {
        const x = side < 0 ? Math.floor(cx - edge) - w + j : Math.ceil(cx + edge) - 1 + w - j;
        let tt = side < 0 ? 2 : 1;
        if (j === 1 && t > 0.2 && t < 0.75) tt = side < 0 ? 1 : 0; // inner ear fold
        if (side > 0 && j === 0) tt = 0;
        if (side < 0 && j === 0 && t < 0.3) tt = 3;
        if (t > 0.85) tt = side < 0 ? 1 : 0;
        skinPut(x, y, tt);
      }
    }
    earPos.push({ side, x: side < 0 ? Math.floor(cx - HW[earBot]) - Math.max(1, Math.round(earOut * 0.55)) : Math.ceil(cx + HW[earBot]) - 1 + Math.max(1, Math.round(earOut * 0.55)), y: earBot + 1 });
  }

  // ---------------- face (skin with light from top-left)
  const lx = -0.56, ly = -0.48, lz = 0.676;
  for (let y = faceTop; y <= faceBot; y++) {
    const h = HW[y]; if (h <= 0) continue;
    const v = (y + 0.5 - crownY) / L;
    let ny = 0;
    if (v < 0.36) ny = -Math.pow((0.36 - v) / 0.36, 1.3) * 0.95;
    else if (v > 0.8) ny = Math.min(0.85, Math.pow((v - 0.8) / 0.2, 1.4) * 0.8);
    for (let x = Math.floor(cx - h - 1); x <= Math.ceil(cx + h); x++) {
      if (!inFace(x, y)) continue;
      const u = (x + 0.5 - cx) / (h + 0.6);
      const nx = Math.sign(u) * Math.pow(Math.abs(u), 1.7) * 0.98;
      const nz = Math.sqrt(Math.max(0.02, 1 - nx * nx - ny * ny));
      let I = nx * lx + ny * ly + nz * lz;
      let t = I > 0.94 ? 4 : I > 0.835 ? 3 : I > 0.36 ? 2 : I > 0.02 ? 1 : 0;
      if (t === 4 && !(v < 0.33 || (v > 0.45 && v < 0.62))) t = 3; // highlight only on forehead / cheekbone
      skinPut(x, y, t);
    }
  }
  // jaw edge shadow over neck/ears (form the chin)
  for (let x = 0; x < S; x++) {
    let lastY = -1; for (let y = faceBot; y >= faceTop; y--) if (inFace(x, y)) { lastY = y; break; }
    if (lastY > 0 && lastY > mouthY) { if (x + 0.5 > cx - chinW) skinTo(x, lastY, 1); }
  }

  // ---------------- facial features
  const featCtx = { G, sp, skinPut, shade, skinTo, put, isSkin, inB, idx, tint, SK, HR, BR, col, lab, tone, mood };
  // age: under-eye, nasolabial, forehead, crow's feet
  drawAge(featCtx);
  drawNose(featCtx);
  drawEyes(featCtx);
  drawBrows(featCtx);
  drawMouth(featCtx);
  drawMarks(featCtx);
  if (sp.blush) {
    const blushC = H(skinT.lip);
    for (const s of [-1, 1]) for (let j = 0; j < R(3); j++) for (let i = 0; i < R(3); i++) {
      const x = Math.round(cx + s * (sp.eyeSep * k + 0.5) - 1 + i) - (s > 0 ? 1 : 0), y = noseY - R(2) + j;
      if (isSkin(x, y) && (i + j) % 2 === 0) tint(x, y, blushC, 0.22);
    }
  }
  drawFacialHair(featCtx);

  // ---------------- front hair, with cast shadow onto skin
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (front[idx(x, y)]) drawHairPx(x, y, 'front');
  for (let y = 1; y < S; y++) for (let x = 0; x < S; x++) {
    const i = idx(x, y);
    if (lab[i] === SKIN && inFace(x, y) && (lab[idx(x, y - 1)] === HAIR)) {
      shade(x, y, -1);
      if (style !== 'buzz' && y + 1 < S && lab[idx(x, y + 1)] === SKIN && (x + 0.5 > cx)) shade(x, y + 1, -1);
    }
  }
  // dark line where hair meets skin
  for (let y = 0; y < S - 1; y++) for (let x = 0; x < S; x++) {
    const i = idx(x, y);
    if (lab[i] === HAIR && lab[idx(x, y + 1)] === SKIN && inFace(x, y + 1)) col[i] = HR[0];
  }

  // ---------------- headwear
  if (headwear) drawHeadwear(featCtx, headwear, inFace);
  if (sp.drawHead) sp.drawHead(C, G, { put, skinPut, shade, isSkin, mix, H, HR, SK, inB, idx, inFace , hwc, neckHW, shoulderTop, LAB: LABELS, rampFrom, tint });

  // ---------------- glasses, earrings
  drawGlasses(featCtx);
  if (sp.earring && !['hijab', 'headwrap', 'hood'].includes(headwear) && !sp.hideEarrings) {
    const gc = sp.earringColor === 'silver' ? ['#6a7480', '#b8c4cc', '#f0f4f6'] : ['#7a5214', '#d4a03a', '#ffe08a'];
    for (const e of earPos) {
      if (e.side > 0 && sp.earringOneSide === 'left') continue;
      if (lab[idx(e.x, e.y - 1)] !== SKIN) continue; // ear hidden by hair
      if (sp.earring === 'stud') { put(e.x, e.y - 1, H(gc[2]), ACC); }
      else if (sp.earring === 'hoop') { put(e.x - e.side, e.y, H(gc[1]), ACC); put(e.x, e.y + 1, H(gc[1]), ACC); put(e.x - e.side, e.y + 2, H(gc[0]), ACC); put(e.x - 2 * e.side, e.y + 1, H(gc[0]), ACC); }
      else { put(e.x, e.y, H(gc[1]), ACC); put(e.x, e.y + 1, H(gc[2]), ACC); put(e.x, e.y + 2, H(gc[0]), ACC); }
    }
  }
  if (sp.drawTop) sp.drawTop(C, G, { put, skinPut, shade, isSkin, mix, H, HR, SK, inB, idx, inFace , hwc, neckHW, shoulderTop, LAB: LABELS, rampFrom, tint });

  // ---------------- selective outline (figure edge against background), lit side lighter
  const fig = (x, y) => inB(x, y) && op[idx(x, y)] && lab[idx(x, y)] !== BG;
  const edge = [];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    if (!fig(x, y)) continue;
    const lt = !fig(x - 1, y), up = !fig(x, y - 1), rt = !fig(x + 1, y), dn = !fig(x, y + 1) && y < S - 1;
    if (lt || up || rt || dn) edge.push([x, y, (rt || dn) && !lt ? 0.55 : 0.38]);
  }
  for (const [x, y, a] of edge) { const i = idx(x, y); col[i] = mix(col[i], DARK, a); }

  // ---------------- to raw sprite
  const buf = makeBuffer(S, S);
  const out = buf.rgba;
  for (let i = 0; i < S * S; i++) {
    if (!op[i]) continue;
    const c = col[i]; out[i * 4] = (c >> 16) & 255; out[i * 4 + 1] = (c >> 8) & 255; out[i * 4 + 2] = c & 255; out[i * 4 + 3] = 255;
  }
  return buf.toSprite();
}

// ------------------------------------------------------------------ hair masks per style
function hairMasks(style, sp, G, inFace) {
  const { S, k, cx, crownY, chinY, L, temple, eyeY, lidY, browY, HW, R } = G;
  const front = new Uint8Array(S * S), back = new Uint8Array(S * S);
  const idx = (x, y) => y * S + x;
  const none = { front, back, shade: () => 2 };
  if (['bald', 'hijab'].includes(style)) return none;

  const P = { // per-style volume and shape
    horseshoe: { vt: -9, vs: 1.4, side: lidY + 0.5 * k, hl: 'none' },
    buzz: { vt: 0.7, vs: 0.6, side: lidY - 1 * k, hl: 'round', hlC: 0.17, burn: 1 },
    crop: { vt: 2.0, vs: 1.4, side: lidY + 0.5 * k, hl: 'round', hlC: 0.18, burn: 2 },
    sidepart: { vt: 3.0, vs: 1.8, side: lidY + 0.5 * k, hl: 'side', hlC: 0.16, burn: 2 },
    receding: { vt: 1.4, vs: 1.4, side: lidY, hl: 'receding', hlC: 0.2, burn: 2 },
    spiky: { vt: 4.2, vs: 1.6, side: lidY, hl: 'bangs', hlC: 0.24, burn: 1, spikes: true },
    curly: { vt: 3.4, vs: 2.6, side: lidY + 1 * k, hl: 'round', hlC: 0.2, curl: true, curlDrop: 0.5, burn: 1 },
    afro: { vt: 6.8, vs: 6.4, side: G.noseY + 1 * k, hl: 'round', hlC: 0.19, curl: true, curlDrop: 4, burn: 1 },
    braids: { vt: 1.4, vs: 1.6, side: chinY + 9 * k, hl: 'pulled', hlC: 0.15, braid: true, long: true },
    locs: { vt: 2.6, vs: 2.6, side: chinY + 9 * k, hl: 'middle', hlC: 0.16, locs: true, long: true },
    bun: { vt: 1.0, vs: 0.8, side: lidY - 1 * k, hl: 'pulled', hlC: 0.15, bun: true },
    ponytail: { vt: 1.2, vs: 0.9, side: lidY - 1 * k, hl: 'pulled', hlC: 0.15, tail: true },
    long: { vt: 2.0, vs: 1.8, side: chinY + 10 * k, hl: 'middle', hlC: 0.15, long: true, strands: true },
    wavy: { vt: 2.6, vs: 2.6, side: chinY + 8 * k, hl: 'side', hlC: 0.15, long: true, wavy: true },
    bob: { vt: 2.4, vs: 2.2, side: chinY - 1 * k, hl: 'bangs', hlC: 0.27, strands: true },
    headwrap: { vt: 0, vs: 0, side: 0, hl: 'none', skip: true },
    flatcap: { vt: 1, vs: 1.2, side: lidY + 0.5 * k, hl: 'round', hlC: 0.2, burn: 1 },
    widebrim: { vt: 1, vs: 1.5, side: sp.presentation === 'f' ? chinY + 4 * k : lidY + 1 * k, hl: 'round', hlC: 0.22, long: sp.presentation === 'f', burn: 1 },
    beanie: { vt: 1, vs: 1.4, side: sp.presentation === 'f' ? chinY + 2 * k : lidY + 1 * k, hl: 'bangs', hlC: 0.27, long: sp.presentation === 'f', burn: 1 },
  }[style] || { vt: 2, vs: 1.4, side: lidY, hl: 'round', hlC: 0.18, burn: 2 };
  if (P.skip) return none;
  if (sp.hairOverride) Object.assign(P, sp.hairOverride);

  const vt = P.vt * k, vs = P.vs * k;
  const domeCy = browY + 1 * k, domeRy = domeCy - crownY + vt, domeRx = temple + vs;
  const partX = sp.partSide === 'right' ? cx + temple * 0.35 : cx - temple * 0.35;
  const hlC = crownY + L * (P.hlC || 0.18);
  const hlT = lidY - 1.5 * k; // temple hairline
  function hairline(x) { // y from which skin shows inside the face
    const dx = Math.abs(x + 0.5 - cx), t = Math.min(1, dx / temple);
    switch (P.hl) {
      case 'none': return -1;
      case 'pulled': return hlC + (hlT - hlC) * Math.pow(t, 3.2);
      case 'bangs': return t < 0.8 ? hlC + t * 1.2 * k : hlC + (hlT + 2 * k - hlC) * smoothstep((t - 0.8) / 0.2);
      case 'middle': return hlC + (Math.min(hlT, hlC + 7 * k) - hlC) * Math.pow(t, 0.9);
      case 'side': {
        const s = sp.partSide === 'right' ? -1 : 1; const rel = s * (x + 0.5 - partX) / (temple * 1.35);
        const sweep = rel > 0 ? hlC + 0.5 * k + 4.2 * k * Math.sin(Math.min(1, rel) * Math.PI * 0.6) : hlC - 0.5 * k + (hlT - hlC) * Math.pow(Math.min(1, -rel * 1.8), 2.4);
        return Math.min(hlT + 2 * k, sweep + (t > 0.85 ? (hlT - sweep) * smoothstep((t - 0.85) / 0.15) : 0));
      }
      case 'receding': return hlC + (t > 0.18 && t < 0.8 ? 2.6 * k * Math.sin((t - 0.18) / 0.62 * Math.PI) : 0) + (t >= 0.8 ? (hlT - hlC) * smoothstep((t - 0.8) / 0.2) : 0);
      default: return hlC + (hlT - hlC) * Math.pow(t, 2.4);
    }
  }
  const sideBot = P.side;
  const longOuter = (y) => { // outer x half-width of long hair
    let w = temple + vs + (P.long ? Math.min(2 * k, Math.max(0, (y - eyeY) * 0.12)) : 0);
    if (P.wavy) w += Math.sin((y / k) * 0.7) * 0.9 * k;
    if (P.long && y > sideBot - 3 * k) w -= (y - (sideBot - 3 * k)) * 0.9;
    return w;
  };
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const px = x + 0.5, py = y + 0.5, dx = px - cx, adx = Math.abs(dx);
    let inside = false;
    // dome
    if (P.vt > -5) {
      let rx = domeRx, ry = domeRy;
      const ang = Math.atan2(py - domeCy, dx);
      let cyy = domeCy;
      if (P.curl) { cyy = domeCy + P.curlDrop * k; ry = cyy - crownY + vt; rx = domeRx; const ang2 = Math.atan2((py - cyy) / ry, dx / rx); const b = Math.cos(ang2 * 11) * 0.55 * k; rx += b; ry += b; }
      if (P.spikes) { const tri = Math.abs(((ang * 7 / Math.PI) % 1 + 1) % 1 - 0.5) * 2; ry += (tri - 0.5) * 2.6 * k; }
      const e = (dx / rx) ** 2 + ((py - cyy) / ry) ** 2;
      if (e <= 1 && (P.curl ? py <= sideBot : py <= domeCy + 1 * k)) inside = true;
    }
    // sides
    if (!inside && !P.curl && py > domeCy - 0.5 * k && py <= sideBot) {
      const fh = HW[y] || 0;
      const outer = P.long || P.curl ? longOuter(py) * (P.curl && style === 'afro' ? 1 - Math.max(0, (py - eyeY) / (sideBot - eyeY)) * 0.35 : 1) : Math.max(fh, temple * 0.9) + vs * (py < lidY ? 1 : 0.6);
      const inner = py > G.chinY - 1 ? (P.long ? (G.k * 4.4) : 999) : fh - (P.burn || 0) * k;
      if (adx <= outer && (adx >= Math.min(inner, fh - 0.01) || py < hairline(x))) inside = true;
      if (P.long && py > chinY - 1 && adx < 4.4 * k) inside = 'backonly';
    }
    // horseshoe band around the back
    if (P.vt <= -5) {
      const fh = HW[y] || 0;
      if (py > browY - 2 * k && py <= sideBot && adx >= fh - 1.2 * k && adx <= fh + vs + 0.2 * k && py < lidY + 1 * k) inside = true;
    }
    if (!inside) continue;
    // carve the face below the hairline
    if (inside !== 'backonly' && inFace(x, y) && P.hl !== 'none') {
      const fh = HW[y];
      const sideCover = py <= sideBot && adx > fh - (P.burn ?? (P.long ? 1.6 : 0)) * k && py > hairline(x);
      if (py >= hairline(x) && !sideCover) continue;
    } else if (inside !== 'backonly' && inFace(x, y) && P.vt <= -5) {
      if (adx < (HW[y] || 0) - 1.2 * k) continue;
    }
    if (inside === 'backonly' || (P.long && py > chinY + 1 * k && adx < G.k * 5.5)) back[idx(x, y)] = 1;
    else if (P.long && py > chinY - 1 * k) { front[idx(x, y)] = 1; }
    else front[idx(x, y)] = 1;
  }
  // Long hair behind the neck: fill the gap region between strands as back layer
  if (P.long) {
    for (let y = Math.floor(lidY); y < Math.min(S, sideBot); y++) for (let x = 0; x < S; x++) {
      const adx = Math.abs(x + 0.5 - cx);
      if (adx < longOuter(y + 0.5) - 0.5 && !front[idx(x, y)] && !inFace(x, y)) back[idx(x, y)] = 1;
    }
  }
  // bun / ponytail extras
  if (P.bun) {
    const by = crownY - 2.6 * k, br = 4.2 * k;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const d = ((x + 0.5 - cx) / br) ** 2 + ((y + 0.5 - by) / (br * 0.85)) ** 2; if (d <= 1) front[idx(x, y)] = 2; }
  }
  if (P.tail) {
    const s = sp.partSide === 'right' ? -1 : 1;
    for (let y = Math.floor(eyeY); y < Math.min(S, chinY + 9 * k); y++) {
      const w = 2.4 * k - Math.max(0, (y - chinY) * 0.2);
      const xc = cx + s * (temple + 1.6 * k + Math.sin((y - eyeY) / (6 * k)) * 0.6 * k);
      for (let x = Math.floor(xc - w); x <= Math.ceil(xc + w); x++) if (x >= 0 && x < S && Math.abs(x + 0.5 - xc) < w && !inFace(x, y)) { if (y > chinY) front[idx(x, y)] = 3; else back[idx(x, y)] = 1; }
    }
  }

  // ---- shader
  const shade = (x, y, layer) => {
    const px = x + 0.5, py = y + 0.5, dx = px - cx;
    const isBun = front[idx(x, y)] === 2;
    let nx, ny;
    if (isBun) { const br = 4.2 * k; nx = dx / br; ny = (py - (crownY - 2.6 * k)) / br; }
    else if (py < domeCy) { nx = dx / domeRx; ny = (py - domeCy) / domeRy; }
    else { const w = Math.max(temple + vs, 1); nx = Math.max(-1, Math.min(1, dx / w)); ny = 0.18 + Math.min(0.5, (py - domeCy) / (S * 0.6)); }
    const nn = Math.min(0.98, nx * nx + ny * ny);
    const nz = Math.sqrt(1 - nn);
    let I = nx * -0.56 + ny * -0.48 + nz * 0.676;
    let t = I > 0.86 ? 3 : I > 0.5 ? 2 : I > 0.12 ? 1 : 0;
    if (layer === 'back') t = t >= 2 ? t - 1 : t;
    const rr = Math.sqrt(nn);
    if (P.curl || style === 'buzz') {
      // tight curl clusters: small 3px cells with a lit top-left pixel and shaded bottom-right
      if (style !== 'buzz') {
        const cs = style === 'afro' ? 4 * k : 3.4 * k;
        const row = Math.floor(py / cs), off = (row % 2) * cs * 0.5;
        const cc = Math.floor((px + off) / cs);
        const h = fmix(row * 7919 + cc * 104729 + (sp.seed | 0) + 17);
        const ccx = (cc + 0.5) * cs - off + ((h & 3) - 1.5) * 0.25 * k, ccy = (row + 0.5) * cs + (((h >> 2) & 3) - 1.5) * 0.25 * k;
        const ux = (px - ccx) / (cs * 0.5), uy = (py - ccy) / (cs * 0.5);
        const lit = -0.7 * ux - 0.7 * uy;
        if (lit > 0.45 && ux * ux + uy * uy < 0.7 && t >= 1) t = Math.min(4, t + 1);
        else if (lit < -0.75) t = Math.max(0, t - 1);
      }
    } else if (P.braid || P.locs) {
      const bw = Math.max(3, Math.round(3 * k));
      const c = ((Math.floor(px - cx + 1000 * bw)) % bw + bw) % bw;
      const yy = Math.floor(py / Math.max(2, Math.round(2 * k)));
      if (c === 0) t = Math.max(0, t - 1);
      else if (P.braid && (c + yy) % 2 === 0 && py > domeCy) t = Math.min(4, t + 1);
      else if (P.locs && c === 1 && py > domeCy) t = Math.min(4, t + 1);
      if (P.braid && py < domeCy && c === 0) t = 0;
    } else if (layer !== 'back') {
      // smooth hair: one clean sheen arc in the lit upper-left
      if (py < domeCy && rr > 0.5 && rr < 0.74 && nx < -0.08 && ny < -0.2 && !isBun) t = 4;
      if (isBun && rr > 0.35 && rr < 0.62 && nx < 0 && ny < 0) t = 4;
      if (P.strands && py > domeCy + 1 * k) {
        const fh = HW[Math.min(S - 1, y)] || temple;
        const off = Math.abs(dx) - fh;
        if (Math.abs(off - 2 * k) < 0.5) t = Math.max(0, t - 1);
      }
      if (P.hl === 'side' && py < domeCy - 1 * k && Math.abs(px - partX) < 0.6 && py > crownY - vt + 1) t = 0;
      if (P.hl === 'middle' && py < hlC + 1 && Math.abs(dx) < 0.6 * k && py > crownY - vt + 1) t = 0;
    }
    if (P.wavy && layer !== 'back' && py > domeCy) { const w = Math.sin(py / k * 0.85 + Math.abs(dx) / k * 0.35); if (w > 0.82 && t >= 1) t = Math.min(4, t + 1); else if (w < -0.9 && t >= 2) t = t - 1; }
    if (style === 'horseshoe' || style === 'receding') t = Math.min(t, 3);
    return t;
  };
  return { front, back, shade, hairline, P };
}
function smoothstep(t) { return t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t); }

// ------------------------------------------------------------------ clothes
function drawClothes(C, sp, G, X) {
  const { S, k, cx } = G;
  const { put, skinPut, hwc, neckHW, shoulderTop } = X;
  if (sp.outfit === 'none') return;
  const CR = rampFrom(sp.cloth || '#3f5a7a');
  const C2 = rampFrom(sp.cloth2 || '#d8c8a8');
  const white = rampFrom('#d8d2c4');
  const outfit = sp.outfit || 'crew';
  const top = Math.floor(shoulderTop);
  for (let y = top; y < S; y++) {
    const w = hwc(y + 0.5);
    for (let x = 0; x < S; x++) {
      const dx = x + 0.5 - cx, adx = Math.abs(dx);
      if (adx > w) continue;
      const nx = dx / w;
      const yy = y - shoulderTop;
      // neckline: skin shows in the opening
      let open = 0;
      if (outfit === 'crew' || outfit === 'tunic') open = adx < neckHW + 0.6 * k && yy < 1.6 * k + (1 - (adx / (neckHW + 0.6 * k)) ** 2) * 1.6 * k;
      else if (outfit === 'vneck' || outfit === 'jacket' || outfit === 'collar') open = adx < neckHW + 0.3 * k && yy < (neckHW + 0.3 * k - adx) * (outfit === 'vneck' ? 1.3 : 1.1) + 0.8 * k;
      else if (outfit === 'turtle') open = 0;
      else if (outfit === 'scarf') open = adx < neckHW && yy < 1 * k;
      if (open) continue;
      let t = nx < -0.55 ? 3 : nx < 0.25 ? 2 : nx < 0.75 ? 1 : 0;
      if (yy < 1.2 * k && adx > neckHW + 2 * k && nx < 0) t = Math.min(3, t + 1); // lit shoulder top
      if (adx < neckHW + 2.2 * k && yy < 2.6 * k) t = Math.max(0, t - 1); // shadow under chin
      let c = CR[t];
      if (outfit === 'jacket') { // lapels over an inner shirt
        const lap = adx < neckHW + 2.6 * k - yy * 0.1 && yy < 9 * k;
        if (adx < (neckHW + 0.3 * k - yy * 0.38) + 2.4 * k && yy < 10 * k && adx < neckHW + 1 * k) c = white[Math.max(1, t)];
        else if (lap) c = CR[Math.max(0, t - 1)];
        if (Math.abs(adx - (neckHW + 2.6 * k - yy * 0.1)) < 0.5) c = CR[0];
      }
      if (outfit === 'tunic' && adx < 0.6 && yy > 1.4 * k && yy < 7 * k) c = (y % 2) ? C2[1] : CR[0];
      if (outfit === 'collar') {
        const cl = yy < 3.2 * k && adx >= neckHW - 0.5 * k && adx < neckHW + 3.2 * k - yy * 0.6;
        if (cl) c = white[dx < 0 ? 3 : 2];
        if (adx < 0.6 && yy > 3 * k) c = CR[0];
        if (adx < 0.6 && Math.round(yy) === Math.round(5 * k)) c = white[3];
      }
      if (outfit === 'scarf' && yy < 3.2 * k && adx < neckHW + 4.5 * k) c = C2[Math.max(0, Math.min(4, t + (yy < 1 ? 1 : 0)))];
      if (outfit === 'scarf' && yy >= 3.2 * k && yy < 8 * k && dx > neckHW * 0.2 && dx < neckHW + 1.5 * k) c = C2[Math.max(0, t - 1)];
      put(x, y, c, CLOTH);
    }
  }
  if (outfit === 'turtle') {
    for (let y = Math.floor(G.chinY + 1.2 * k); y < top + 1; y++) for (let x = 0; x < S; x++) {
      const dx = x + 0.5 - cx;
      if (Math.abs(dx) < neckHW + 0.6 * k) {
        let t = dx < -neckHW * 0.3 ? 2 : dx > neckHW * 0.5 ? 0 : 1;
        if ((y - Math.floor(G.chinY)) % Math.max(2, Math.round(2 * k)) === 0) t = Math.max(0, t - 1);
        put(x, y, CR[t], CLOTH);
      }
    }
  }
}

// ------------------------------------------------------------------ eyes
function drawEyes(F) {
  const { G, sp, put, skinPut, shade, skinTo, isSkin, mood } = F;
  const { k, cx, eyeY, lidY, R, mirror } = G;
  let shape = sp.eyeShape || 'almond';
  const EC = (EYE_COLORS.find((e) => e.name === sp.eyeColor) || EYE_COLORS[0]).c.map(H);
  const skinT = SKIN_TONES[sp.skin] || SKIN_TONES[3];
  const dark = sp.skin >= 6;
  const WHITE = H(dark ? '#e8dcd2' : '#f6f0ea'), WHITE2 = H(dark ? '#b8a8a0' : '#d6cac4');
  const LASH = mix(H('#160e12'), H(skinT.ramp[0]), 0.15);
  let ew = R(shape === 'large' ? 6 : shape === 'monolid' ? 5.4 : 5);
  if (k > 1.2) ew = Math.max(ew, 6);
  const iw = k > 1.2 ? 3 : 2;
  let open = shape === 'monolid' || shape === 'hooded' ? (k > 1.2 ? 2 : 1) : k > 1.2 && (shape === 'large' || shape === 'round') ? 3 : 2;
  if (mood === 'smile' || mood === 'sly') open = Math.max(1, open - 1);
  if (mood === 'worried' && open < 3 && k > 1.2) open += 0;
  const sep = sp.eyeSep * k;
  const x0 = Math.round(cx - sep - ew / 2);
  // profile: top row offset per column (0 = lid at lidY), bottom = last white row offset (relative to eyeY)
  const prof = [];
  for (let c = 0; c < ew; c++) {
    const outer = c === 0, inner = c === ew - 1, nearOuter = c === 1;
    let top = 0, bot = open - 1;
    if (outer || inner) { top = 1; bot = Math.min(open - 1, 0); }
    if (shape === 'round' && (outer || inner)) { top = 1; bot = open - 1 - (open > 2 ? 1 : 0); }
    if (shape === 'upturned' && outer) { top = 0; bot = -1; }
    if (shape === 'upturned' && inner) { top = 1; bot = 0; }
    if (shape === 'downturned' && outer) { top = 1; bot = open - 1; }
    if (shape === 'downturned' && inner) { top = 0; bot = -1; }
    if (shape === 'monolid') { top = 0; bot = outer || inner ? 0 : open - 1; if (outer) { top = 0; bot = -1; } }
    if ((shape === 'almond' || shape === 'large' || shape === 'deepset') && nearOuter && open >= 2) bot = open - 1;
    prof.push([top, bot]);
  }
  // iris position (same absolute offset for both eyes => consistent gaze)
  let ic = Math.floor((ew - iw) / 2);
  if ((ew - iw) % 2 === 1) ic += sp.gaze > 0 ? 1 : 0;
  ic += (sp.gaze || 0) * (k > 1.2 ? 1 : 0) * 0;
  for (const side of [-1, 1]) {
    const X = (c) => (side < 0 ? x0 + c : mirror(x0 + c));
    // socket / crease
    for (let c = 0; c < ew; c++) {
      const x = X(c);
      if (shape === 'deepset') { shade(x, lidY - 1, -1); if (c > 0 && c < ew - 1) shade(x, lidY - 2, -1); }
      else if (shape === 'hooded') { shade(x, lidY - 1, -1); }
      else if (shape !== 'monolid' && c > 0 && c < ew - 1) skinTo(x, lidY - 1, Math.max(1, (F.tone[F.idx(x, lidY - 1)] ?? 2) - 1 + (c === 1 ? 1 : 0)));
    }
    if (shape === 'deepset' || sp.age >= 3) for (let c = 1; c < ew - 1; c++) shade(X(c), eyeY + open + (shape === 'deepset' ? 0 : 0), -1);
    for (let c = 0; c < ew; c++) {
      const x = X(c); const [top, bot] = prof[c];
      // lid line
      const ly = lidY + top;
      put(x, ly, shape === 'monolid' ? mix(LASH, H(skinT.ramp[1]), 0.35) : LASH, FEAT);
      if (shape === 'hooded') { put(x, ly, mix(LASH, H(skinT.ramp[0]), 0.2), FEAT); }
      for (let r = top; r <= bot; r++) {
        const y = eyeY + r;
        const ci = c - ic, inIris = ci >= 0 && ci < iw;
        let color;
        if (inIris) {
          const rr = r - Math.max(0, top);
          if (rr === 0) color = (ci === 0 && side < 0) || (ci === 0 && side > 0) ? (open >= 2 || iw > 2 ? H('#f8f6f0') : EC[0]) : EC[0];
          else if (iw === 3 && ci === 1 && rr === 1) color = EC[0];
          else color = rr >= open - 1 ? EC[2] : EC[1];
          if (iw === 3 && rr === 0 && ci === 1) color = EC[0];
          if (iw === 3 && rr === 0 && ci === 2) color = EC[0];
          if (iw === 2 && rr === 0 && ci === 1) color = EC[0];
        } else color = r === top ? WHITE2 : WHITE;
        put(x, y, color, EYE);
      }
    }
    // outer corner flick / lashes
    const xo = X(0) + (side < 0 ? -1 : 1);
    if (sp.lashes) put(xo, lidY + (shape === 'downturned' ? 1 : 0), LASH, FEAT);
    // lower lid hint
    for (let c = 1; c < ew - 1; c++) { const x = X(c); const yb = eyeY + prof[c][1] + 1; if (isSkin(x, yb) && prof[c][1] >= 0) skinTo(x, yb, shape === 'large' || shape === 'round' ? 1 : 2); }
  }
  F.eye = { x0, ew, open };
}

// ------------------------------------------------------------------ brows
function drawBrows(F) {
  const { G, sp, put, mood, HR } = F;
  const { k, cx, lidY, R, mirror } = G;
  const eye = F.eye;
  const shape = sp.browShape || 'straight';
  const gap = R(sp.browGap || 3);
  const by = lidY - gap; // base row of brow (inner end)
  const x0 = eye.x0 - R(1), x1 = eye.x0 + eye.ew - 1 + (shape === 'unibrow' ? 0 : 0); // outer..inner(left brow)
  const len = x1 - x0 + 1;
  const browCol = sp.browColor ? H(sp.browColor) : HR[sp.hairColor === 'white' || sp.hairColor === 'grey' ? 2 : 1];
  const browDark = sp.browColor ? mix(H(sp.browColor), DARK, 0.3) : HR[sp.hairColor === 'white' || sp.hairColor === 'grey' ? 1 : 0];
  let thick = Math.max(1, Math.round((sp.browThick || 1) * (k > 1.2 ? 1.5 : 1)));
  for (const side of [-1, 1]) {
    for (let i = 0; i < len; i++) {
      const t = i / Math.max(1, len - 1); // 0 = outer, 1 = inner
      let off = 0; // negative = higher
      if (shape === 'arched') off = -Math.round(Math.sin(Math.min(1, (1 - t) * 1.25) * Math.PI) * 1.2 * k) + (t < 0.15 ? 1 : 0);
      if (shape === 'angled') off = -Math.round((1 - t) * 1.6 * k) + (t < 0.12 ? 1 : 0);
      if (shape === 'soft') off = Math.round((1 - t) * 1.0 * k);
      if (shape === 'straight' || shape === 'bushy' || shape === 'unibrow') off = t < 0.12 ? 1 : 0;
      if (shape === 'thin') off = -Math.round(Math.sin((1 - t) * Math.PI * 0.9) * 1 * k);
      if (mood === 'worried') off += Math.round(t * 1.6 * k) * -1 + Math.round(1 * k) - 1;
      if (mood === 'stern') off += Math.round(t * 1.5 * k);
      if (mood === 'sly' && side > 0) off -= 1;
      let th = thick;
      if (t < 0.3 && shape !== 'bushy') th = Math.max(1, thick - 1);
      if (shape === 'thin' && t > 0.85) continue;
      const x = side < 0 ? x0 + i : mirror(x0 + i);
      for (let j = 0; j < th; j++) {
        const y = by + off - j;
        put(x, y, j === 0 && th > 1 ? browDark : (t > 0.5 ? browDark : browCol), FEAT);
      }
      if (shape === 'bushy' && i % 2 === 0 && t > 0.2) put(x, by + off - th, browCol, FEAT);
      if (sp.scar === 'brow' && side < 0 && i === Math.floor(len * 0.55)) for (let j = -1; j <= th; j++) F.skinPut(x, by + off - j, 3);
    }
    if (shape === 'unibrow') {
      const xi = x0 + len; const xm = mirror(xi);
      for (let x = Math.min(xi, xm); x <= Math.max(xi, xm); x++) put(x, by, browCol, FEAT);
    }
  }
}

// ------------------------------------------------------------------ nose
function drawNose(F) {
  const { G, sp, shade, skinPut, skinTo } = F;
  const { k, cx, lidY, eyeY, noseY, R } = G;
  const n = sp.nose || 'straight';
  const L = Math.floor(cx) - 1, Rr = Math.floor(cx); // the two centre columns
  const top = eyeY + 1;
  const wing = n === 'wide' || n === 'broad' ? 2 : n === 'button' || n === 'snub' || n === 'long' ? 1 : 1;
  const big = k > 1.2;
  // bridge shadow (right side of the nose, light from top-left)
  const bridge = { straight: 1, long: 1, hooked: 1, roman: 1, wide: 0.6, broad: 0.4, button: 0.25, snub: 0.25 }[n];
  const bTop = Math.round(noseY - (noseY - top) * bridge);
  for (let y = bTop; y < noseY - 1; y++) {
    let x = Rr + 1;
    if (n === 'hooked' && y > bTop + (noseY - bTop) * 0.3 && y < noseY - 2) x = Rr + 2;
    if (n === 'roman' && y > bTop + (noseY - bTop) * 0.45) x = Rr + 2;
    skinTo(x, y, 1);
    if (big && (n === 'broad' || n === 'wide' || n === 'roman')) skinTo(x + 1, y, 2);
  }
  // highlight down the left of the bridge
  if (bridge >= 0.6) for (let y = bTop + 1; y < noseY - 1; y++) skinPut(L, y, Math.max(3, F.tone[F.idx(L, y)]));
  // tip
  const tipY = noseY - 1;
  if (n === 'hooked') { skinTo(Rr, noseY, 1); skinTo(L, noseY, 1); skinTo(Rr + 1, tipY, 1); skinPut(L, tipY - 1, 3); }
  skinPut(L, tipY, n === 'button' || n === 'snub' || n === 'broad' || n === 'wide' ? 4 : 3);
  if (n === 'broad' || n === 'wide' || big) skinPut(Rr, tipY, 3);
  // nostrils / wings
  for (let w = 0; w <= wing; w++) {
    skinTo(L - 1 - w + (w ? 0 : 0), noseY, w === wing ? 1 : 2);
    skinTo(Rr + 1 + w, noseY, w === wing ? 0 : 1);
  }
  if (n === 'snub' || n === 'button') { skinTo(L, noseY, 1); skinTo(Rr, noseY, 1); }
  else { skinTo(L, noseY, 2); skinTo(Rr, noseY, 1); }
  if (n === 'snub') { skinTo(L - 1, noseY, 0); skinTo(Rr + 1, noseY, 0); }
  if (n === 'wide' || n === 'broad') { skinTo(L - wing, noseY - 1, 2); skinTo(Rr + wing, noseY - 1, 1); }
  if (n === 'long') { skinTo(Rr, noseY + 0, 1); }
  // cast shadow under the nose, to the lower right
  skinTo(Rr, noseY + 1, 1); skinTo(Rr + 1, noseY + 1, 1);
  if (n === 'roman' || n === 'hooked' || n === 'broad') skinTo(Rr + 2, noseY + 1, 1);
}

// ------------------------------------------------------------------ mouth
function drawMouth(F) {
  const { G, sp, put, shade, skinTo, skinPut, isSkin, mood, tint } = F;
  const { k, cx, mouthY, noseY, R, mirror } = G;
  let m = sp.mouth || 'neutral';
  if (mood === 'smile') m = sp.moodMouth?.smile || (m === 'grin' ? 'grin' : 'smile');
  if (mood === 'worried') m = 'worried';
  if (mood === 'stern') m = 'thin';
  if (mood === 'sly') m = 'smirk';
  const skinT = SKIN_TONES[sp.skin] || SKIN_TONES[3];
  const lip = sp.lipColor ? H(sp.lipColor) : H(skinT.lip);
  const lipLight = mix(lip, H(skinT.ramp[3]), 0.4);
  const line = mix(lip, H('#1e0e10'), 0.55);
  let w = R(sp.mouthW || 6);
  if (m === 'wide' || m === 'grin') w = Math.max(w, R(8));
  if (m === 'small') w = Math.min(w, R(4));
  if (w % 2) w += 1;
  const xl = Math.round(cx - w / 2), xr = xl + w - 1;
  const y = mouthY;
  const lipW = Math.max(2, w - R(2));
  const lx = Math.round(cx - lipW / 2);
  const P = (x, yy, c) => put(x, yy, c, FEAT);
  const lowerLip = (rows, hl = true) => {
    for (let r = 1; r <= rows; r++) for (let x = lx + (r === rows && rows > 1 ? 1 : 0); x < lx + lipW - (r === rows && rows > 1 ? 1 : 0); x++) {
      if (!isSkin(x, y + r)) continue;
      const left = x < cx;
      P(x, y + r, hl && r === 1 && x === lx + 1 ? lipLight : mix(lip, left ? H(skinT.ramp[3]) : H(skinT.ramp[1]), 0.25));
    }
    for (let x = lx; x < lx + lipW; x++) skinTo(x, y + rows + 1, 1);
  };
  switch (m) {
    case 'smile': {
      for (let x = xl + 1; x <= xr - 1; x++) P(x, y, line);
      P(xl, y - 1, line); P(xr, y - 1, line);
      lowerLip(1);
      skinTo(xl - 1, y - 2, 1); skinTo(xr + 1, y - 2, 1); // cheek creases
      break;
    }
    case 'grin': {
      for (let x = xl + 1; x <= xr - 1; x++) { P(x, y - 1, line); P(x, y, H('#f2ece2')); P(x, y + 1, line); }
      P(xl, y - 1, line); P(xr, y - 1, line);
      P(xr - 1, y, H('#c8beb2')); P(xl + 1, y, H('#e0d8cc'));
      for (let x = lx + 1; x < lx + lipW - 1; x++) P(x, y + 2, mix(lip, H(skinT.ramp[2]), 0.3));
      skinTo(xl - 1, y - 2, 1); skinTo(xr + 1, y - 2, 1);
      break;
    }
    case 'thin': {
      for (let x = xl; x <= xr; x++) P(x, y, mix(line, H(skinT.ramp[1]), 0.3));
      for (let x = lx; x < lx + lipW; x++) skinTo(x, y + 2, 1);
      break;
    }
    case 'full': {
      for (let x = lx + 1; x < lx + lipW - 1; x++) P(x, y - 1, mix(lip, H(skinT.ramp[1]), 0.2));
      for (let x = xl; x <= xr; x++) P(x, y, line);
      lowerLip(k > 1.2 ? 3 : 2);
      break;
    }
    case 'down': {
      for (let x = xl + 1; x <= xr - 1; x++) P(x, y, line);
      P(xl, y + 1, line); P(xr, y + 1, line);
      lowerLip(1, false);
      break;
    }
    case 'worried': {
      for (let x = xl + 1; x <= xr - 1; x++) P(x, y + ((x === xl + 1 || x === xr - 1) ? 0 : 0), line);
      P(xl + 1, y + 1, line); P(xr - 1, y + 1, line);
      for (let x = xl + 2; x <= xr - 2; x++) P(x, y, line);
      lowerLip(1, false);
      break;
    }
    case 'smirk': {
      for (let x = xl + 1; x <= xr; x++) P(x, y, line);
      P(xr + 1, y - 1, line); P(xl, y, mix(line, H(skinT.ramp[1]), 0.4));
      lowerLip(1);
      skinTo(xr + 2, y - 2, 1);
      break;
    }
    default: { // neutral, wide, small
      for (let x = xl; x <= xr; x++) P(x, y, x === xl || x === xr ? mix(line, H(skinT.ramp[1]), 0.4) : line);
      lowerLip(m === 'small' ? 2 : 1);
    }
  }
  // philtrum / upper lip shading
  if (m !== 'full' && mouthY - noseY >= 3) { skinTo(Math.floor(cx), y - 1, 1); }
  F.mouth = { xl, xr, y };
}

// ------------------------------------------------------------------ age lines
function drawAge(F) {
  const { G, sp, shade, skinTo } = F;
  const { k, cx, eyeY, lidY, noseY, mouthY, browY, R, mirror } = G;
  const age = sp.age || 0;
  const smileLike = sp.mouth === 'smile' || sp.mouth === 'grin' || sp.mood === 'smile';
  // nasolabial folds
  if (age >= 2 || (smileLike && age >= 1)) {
    const x = Math.floor(cx) - R(3) - 1;
    for (let j = 0; j < R(age >= 3 ? 4 : 3); j++) { const xx = x - Math.floor(j / 2); shade(xx, noseY + 1 + j, -1); shade(mirror(xx), noseY + 1 + j, -1); }
  }
  if (age >= 2) {
    // crow's feet + under-eye
    const ex = Math.round(cx - sp.eyeSep * k - R(5) / 2) - 2;
    for (const s of [-1, 1]) { const x = s < 0 ? ex : mirror(ex); shade(x, eyeY, -1); if (age >= 3 && k > 1.2) shade(x - s, eyeY + 1, -1); }
  }
  if (age >= 3) {
    // forehead lines
    const yy = Math.round(browY - R(2.5));
    for (let x = Math.floor(cx - R(4)); x < Math.ceil(cx + R(3)); x++) shade(x, yy + (Math.abs(x + 0.5 - cx) > R(2.5) ? 1 : 0), -1);
    // jowls (only where there is room for them)
    if (k > 1.2) for (const s of [-1, 1]) { const x = Math.round(cx + s * (G.HW[mouthY + 2] - R(1.5))); shade(x, mouthY + 2, -1); shade(x, mouthY + 3, -1); }
  }
}

// ------------------------------------------------------------------ freckles, moles, scars
function drawMarks(F) {
  const { G, sp, tint, isSkin, skinPut, put, shade } = F;
  const { k, cx, eyeY, noseY, mouthY, chinY, browY, R, mirror } = G;
  const skinT = SKIN_TONES[sp.skin] || SKIN_TONES[3];
  if (sp.freckles) {
    const fc = mix(mix(H(skinT.ramp[1]), H('#9a5428'), 0.3), H(skinT.ramp[2]), 0.25);
    const r = stream(sp.seed || 7, 99);
    const pts = [[-5, 2], [-3, 3], [-6, 3.5], [-2, 2], [-4, 4.5], [-7, 2]];
    for (const [ox, oy] of pts) {
      if (r() < 0.25) continue;
      for (const s of [-1, 1]) {
        const x = s < 0 ? Math.floor(cx) + R(ox) - 1 : mirror(Math.floor(cx) + R(ox) - 1 + (r() < 0.3 ? 1 : 0)), y = eyeY + R(oy);
        if (isSkin(x, y)) put(x, y, fc, SKIN);
      }
    }
  }
  if (sp.mole) {
    const mc = sp.skin >= 6 ? H('#24120e') : H('#4a2a1c');
    const pos = { cheekL: [-6, noseY - eyeY], cheekR: [6, noseY - eyeY + 1], lip: [3, mouthY - eyeY - 1.5], chin: [-2, chinY - eyeY - 2.5], jaw: [8, mouthY - eyeY], eye: [-9, 2], temple: [8, -4] }[sp.mole];
    const x = Math.floor(cx + R(pos[0])), y = Math.round(eyeY + pos[1] * k);
    put(x, y, mc, FEAT);
    if (k > 1.2) put(x + 1, y, mix(mc, H(skinT.ramp[2]), 0.5), FEAT);
  }
  if (sp.scar && sp.scar !== 'brow') {
    const sc = mix(H(skinT.ramp[4]), H('#d08080'), 0.25), sd = H(skinT.ramp[1]);
    const seg = { cheek: [[6, 1], [8, 4]], lip: [[2, mouthY - eyeY - 2], [2, mouthY - eyeY + 1]], chin: [[-3, chinY - eyeY - 3], [0, chinY - eyeY - 2]] }[sp.scar];
    const [[ax, ay], [bx, by]] = seg;
    const n = Math.max(2, Math.round(Math.hypot(bx - ax, by - ay) * k));
    for (let i = 0; i <= n; i++) {
      const x = Math.round(cx + (ax + (bx - ax) * i / n) * k), y = Math.round(eyeY + (ay + (by - ay) * i / n) * k);
      if (isSkin(x, y) || F.lab[F.idx(x, y)] === FEAT) { put(x, y, sc, SKIN); if (isSkin(x + 1, y)) put(x + 1, y, sd, SKIN); }
    }
  }
  if (sp.inkSmudge) {
    const ic = H('#1e2a44');
    for (const [ox, oy, a] of sp.inkSmudge) tint(Math.round(cx + ox * k), Math.round(eyeY + oy * k), ic, a);
  }
}

// ------------------------------------------------------------------ facial hair
function drawFacialHair(F) {
  const { G, sp, put, isSkin, tint, BR, lab, idx, col, tone } = F;
  const { k, cx, S, eyeY, noseY, mouthY, chinY, HW, R } = G;
  const fh = sp.facialHair || 'none';
  if (fh === 'none') return;
  const m = F.mouth;
  const isMouth = (x, y) => lab[idx(x, y)] === FEAT && y >= m.y - 1 && y <= m.y + 3 && x >= m.xl - 1 && x <= m.xr + 1;
  const bc = (t) => BR[Math.max(0, Math.min(4, t))];
  const lightT = (x, y) => { const u = (x + 0.5 - cx) / Math.max(1, HW[y] || 6); return u < -0.45 ? 3 : u < 0.35 ? 2 : u < 0.75 ? 1 : 0; };
  if (fh === 'stubble') {
    const lightBeard = ['white', 'grey', 'ash blond', 'blond'].includes(sp.beardColor);
    const stubC = lightBeard ? BR[3] : BR[0], stubA = lightBeard ? 0.3 : sp.skin >= 6 ? 0.2 : 0.26;
    for (let y = noseY + 1; y < S; y++) for (let x = 0; x < S; x++) {
      if (!isSkin(x, y)) continue;
      const fhw = HW[y], adx = Math.abs(x + 0.5 - cx); if (!(adx < fhw)) continue;
      const rel = adx / fhw;
      const ok = (y >= m.y - 1 && (y > m.y + 1 || adx > (m.xr - m.xl) / 2 + 1 || y === m.y - 1)) || (rel > 0.66 && y > noseY + 1) || (y >= mouthY - 2 && rel > 0.45);
      const fade = Math.min(1, Math.max(0.35, (y - (rel > 0.66 ? noseY + 1 : mouthY - 2)) / (2.5 * k)));
      if (ok) tint(x, y, stubC, stubA * fade);
    }
    return;
  }
  const full = fh === 'beard' || fh === 'fullbeard';
  const ext = fh === 'fullbeard' ? R(4.5) : fh === 'beard' ? R(1.5) : fh === 'goatee' ? R(1.5) : 0;
  const refW = Math.max(1, HW[noseY]);
  const cheekLine = (adx) => {
    const rel = Math.min(1, adx / refW);
    const lo = m.y - 1.4 * k, hi = fh === 'fullbeard' ? eyeY + 2.2 * k : noseY - 0.2 * k;
    return lo + (hi - lo) * Math.pow(rel, 1.3);
  };
  const chinRow = Math.floor(chinY) - 1;
  const pts = [];
  for (let y = eyeY + 1; y < Math.min(S, Math.ceil(chinY) + ext + 1); y++) for (let x = 0; x < S; x++) {
    const adx = Math.abs(x + 0.5 - cx), py = y + 0.5;
    const fhw = py < chinY ? HW[y] : 0;
    let inB = false, top = false;
    if (full) {
      const cl = cheekLine(adx);
      if (py < chinY && adx < fhw && py >= cl) { inB = true; top = py < cl + 1; }
    }
    if (fh === 'chinstrap') {
      if (py < chinY && adx < fhw && (adx > fhw - 1.6 * k || py > chinY - 1.6 * k) && py > noseY - 0.5 * k) inB = true;
    }
    if (fh === 'goatee') {
      if (adx < (m.xr - m.xl) / 2 + 0.5 && py > m.y + 1 && py < chinY && adx < fhw) inB = true;
    }
    if ((full || fh === 'goatee' || fh === 'chinstrap') && py >= chinY - 0.5 && ext > 0 && py < chinY + ext) {
      const t = (py - chinY) / ext;
      const base = fh === 'goatee' ? (m.xr - m.xl) / 2 : (HW[chinRow] || 3) + (fh === 'fullbeard' ? 2 * k : 0.5 * k);
      const wB = base * (1 - Math.pow(Math.max(0, t), 1.6) * 0.75);
      if (adx < wB && !(y === Math.ceil(chinY + ext) - 1 && (x % 2))) inB = true;
    }
    if (inB && !isMouth(x, y) && (py >= chinY - 0.5 || isSkin(x, y) || lab[idx(x, y)] === FEAT)) pts.push([x, y, top]);
  }
  const strand = (fmix(sp.seed | 0) & 3);
  for (const [x, y, top] of pts) {
    let t = Math.min(4, lightT(x, y) + (sp.beardColor === 'white' ? 0 : 1));
    if (y >= chinY) t = Math.max(0, t - 1);
    if (((x + strand) % 4 === 0) && t > 1 && !top && y > m.y) t -= 1; // vertical strands
    if (top) { const i = idx(x, y); col[i] = mix(col[i], bc(t), 0.55); lab[i] = BEARD; continue; }
    put(x, y, bc(t), BEARD);
  }
  // keep lower lip visible inside beards: redraw a darker cut
  for (let x = m.xl; x <= m.xr; x++) if (lab[idx(x, m.y + 1)] === BEARD && full) col[idx(x, m.y + 1)] = mix(col[idx(x, m.y + 1)], DARK, 0.2);
  // moustache
  if (fh !== 'chinstrap') {
    const my = m.y - 1;
    for (let x = m.xl - 1; x <= m.xr + 1; x++) {
      const edge = x === m.xl - 1 || x === m.xr + 1;
      put(x, my, bc(lightT(x, my)), BEARD);
      if (!edge) put(x, my - 1, bc(Math.min(3, lightT(x, my) + 1)), BEARD);
      if (edge && fh !== 'moustache') put(x, my + 1, bc(lightT(x, my) - 1), BEARD);
    }
    if (fh === 'moustache') { put(m.xl - 1, m.y, bc(1), BEARD); put(m.xr + 1, m.y, bc(0), BEARD); }
    // philtrum gap keeps it from looking like a single block
    if (k <= 1.2) put(Math.floor(cx) - 1, my - 1, bc(1), BEARD);
  }
}

// ------------------------------------------------------------------ headwear (hijab, wraps, hats)
function drawHeadwear(F, style, inFace) {
  const { G, sp, put, shade, isSkin, lab, idx } = F;
  const { S, k, cx, crownY, chinY, L, temple, cheek, eyeY, lidY, browY, HW } = G;
  const HC = rampFrom(sp.hatColor || '#3e6e8a');
  if (style === 'hijab') {
    const top = crownY - 2.5 * k, rx = Math.max(cheek, temple) + 2.6 * k;
    const cy = eyeY - 1 * k, ry = cy - top;
    const openTop = browY - 2.8 * k;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const px = x + 0.5, py = y + 0.5, dx = px - cx, adx = Math.abs(dx);
      let inC = false;
      if (py < cy) inC = (dx / rx) ** 2 + ((py - cy) / ry) ** 2 <= 1;
      else if (py < chinY + 2 * k) inC = adx < rx - Math.max(0, (py - (chinY - 3 * k))) * 0.4;
      else inC = adx < rx - 1 * k + (py - chinY - 2 * k) * 1.6 && py < S;
      if (!inC) continue;
      if (inFace(x, y) && py > openTop && adx < (HW[y] || 0) - 0.6 * k && py < chinY - 0.2 * k) continue;
      // shading: light from top-left; fold lines around the face
      const nx = dx / rx, ny = py < cy ? (py - cy) / ry : 0.25;
      const I = -0.56 * nx - 0.48 * ny + 0.676 * Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny));
      let t = I > 0.82 ? 3 : I > 0.45 ? 2 : I > 0.1 ? 1 : 0;
      const dFace = adx - (HW[y] || 0);
      if (py > openTop && Math.abs(dFace - 2.2 * k) < 0.5 && py < chinY) t = Math.max(0, t - 1);
      if (py >= chinY - 1 * k && Math.abs(((dx * 0.8 + py) / k) % 4 - 2) < 0.5 && py > chinY + 1 * k) t = Math.max(0, t - 1);
      if (py > openTop && py < openTop + 1.2 * k && adx < (HW[y] || 0) + 1 * k) t = Math.min(4, t + 1);
      put(x, y, HC[t], HAT);
    }
    // shadow cast on forehead edge
    for (let x = 0; x < S; x++) for (let y = 1; y < S; y++) if (isSkin(x, y) && lab[idx(x, y - 1)] === HAT) shade(x, y, -1);
    return;
  }
  if (style === 'hood') {
    const openTop = crownY + L * 0.13, openBot = chinY + (sp.facialHair === 'fullbeard' ? 4 : sp.facialHair === 'beard' ? 1.6 : 0) * k;
    const ocy = (openTop + openBot) / 2, ory = (openBot - openTop) / 2 + 0.6 * k, orx = Math.max(cheek, temple) + 0.4 * k;
    const top = crownY - 3.4 * k, rx = Math.max(cheek, temple) + 3.6 * k, cy = eyeY + 1 * k, ry = cy - top;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const px = x + 0.5, py = y + 0.5, dx = px - cx, adx = Math.abs(dx);
      let inC;
      if (py < cy) inC = (dx / rx) ** 2 + ((py - cy) / ry) ** 2 <= 1 || (adx < 1.2 * k && py > top - 1.4 * k + adx);
      else inC = adx < rx + (py - cy) * 0.38;
      if (!inC) continue;
      const eo = (dx / orx) ** 2 + ((py - ocy) / ory) ** 2;
      if (eo < 1) continue;
      const l = lab[idx(x, y)];
      if (py > chinY && (l === 8 || l === SKIN) && adx < orx) continue;
      const nx = dx / (rx + 2 * k), ny = py < cy ? (py - cy) / ry : 0.3;
      const I = -0.56 * nx - 0.48 * ny + 0.676 * Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny));
      let t = I > 0.84 ? 3 : I > 0.45 ? 2 : I > 0.1 ? 1 : 0;
      if (eo < 1.28) t = eo < 1.13 ? 0 : Math.max(0, t - 1); // depth inside the opening
      if (py > cy && Math.abs(((adx - rx * 0.6) / k) - (py - cy) / k * 0.3) < 0.5) t = Math.max(0, t - 1); // fold
      put(x, y, HC[t], HAT);
    }
    for (let x = 0; x < S; x++) for (let y = 1; y < S; y++) if (isSkin(x, y) && lab[idx(x, y - 1)] === HAT) { shade(x, y, -1); }
    return;
  }
  if (style === 'headwrap') {
    const PAT = mix(HC[2], H('#f0d890'), 0.6);
    const top = crownY - 7 * k, rx = temple + 2.4 * k, cy = browY - 1 * k;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const px = x + 0.5, py = y + 0.5, dx = px - cx;
      const ry = cy - top;
      const w = rx * (py < cy - ry * 0.55 ? 0.82 + 0.18 * (py - top) / (ry * 0.45) : 1);
      if (py > cy + 0.5 * k || py < top) continue;
      const e = (dx / (w + 0.01)) ** 2 + ((py - cy) / ry) ** 2;
      if (e > 1) continue;
      const nx = dx / rx, ny = (py - cy) / ry;
      const I = -0.56 * nx - 0.48 * ny + 0.676 * Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny));
      let t = I > 0.82 ? 3 : I > 0.45 ? 2 : I > 0.1 ? 1 : 0;
      const band = ((dx * 0.9 + py * 1.3) / k);
      if (((band % 5) + 5) % 5 < 0.9) t = Math.max(0, t - 1);
      let c = HC[t];
      if ((x + y * 2) % 4 === 0 && y % 2 === 0 && t >= 1) c = mix(PAT, HC[t], 0.35);
      put(x, y, c, HAT);
    }
    for (let x = 0; x < S; x++) for (let y = 1; y < S; y++) if (isSkin(x, y) && lab[idx(x, y - 1)] === HAT) shade(x, y, -1);
    return;
  }
  if (style === 'flatcap' || style === 'widebrim' || style === 'beanie') {
    const bandY = browY - (style === 'beanie' ? 1.2 : 2.2) * k;
    const top = crownY - (style === 'widebrim' ? 4.5 : 2.2) * k;
    const rx = temple + (style === 'beanie' ? 1.8 : 1.6) * k;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const px = x + 0.5, py = y + 0.5, dx = px - cx, adx = Math.abs(dx);
      let inC = false, t = 2;
      if (style === 'widebrim') {
        const cw = temple * 0.92 - Math.max(0, (bandY - py) - 3 * k) * 0.25;
        if (py >= top && py < bandY && adx < cw) { inC = true; if (py > top + 0.5 * k && py < top + 1.5 * k && adx < 2 * k) t = 0; }
        const bry = bandY + 0.3 * k, brx = temple + 7.5 * k;
        if (((dx / brx) ** 2 + ((py - bry) / (1.9 * k)) ** 2) <= 1) { inC = true; t = py < bry ? 3 : 1; if (py >= bry + 0.8 * k) t = 0; }
        if (inC && py < bandY && py >= bandY - 1.6 * k && adx < cw) t = -1; // band
      } else {
        const ry = bandY - top;
        if (py <= bandY + (style === 'beanie' ? 1.2 * k : 0) && ((dx / rx) ** 2 + ((py - bandY) / ry) ** 2) <= 1) inC = true;
        if (style === 'flatcap') {
          if (py > bandY - 1.4 * k && py <= bandY + 1.2 * k && adx < rx + 0.5 * k) { inC = true; t = py > bandY ? 0 : 3; }
        }
        if (style === 'beanie' && py <= bandY + 1.2 * k && adx < rx + 0.3 * k && py > bandY - 2.2 * k) inC = true;
      }
      if (!inC) continue;
      if (t === 2) {
        const nx = dx / rx, ny = Math.min(0.9, (py - bandY) / (bandY - top));
        const I = -0.56 * nx - 0.48 * ny + 0.676 * Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny));
        t = I > 0.82 ? 3 : I > 0.45 ? 2 : I > 0.1 ? 1 : 0;
        if (style === 'beanie' && py > bandY - 2.2 * k) t = (x % 2 === 0) ? Math.max(0, t - 1) : t;
        if (style === 'flatcap' && Math.abs(dx + 1 * k) < 0.5 && py < bandY - 1.5 * k) t = Math.max(0, t - 1);
      }
      put(x, y, t === -1 ? mix(HC[0], DARK, 0.3) : HC[Math.max(0, Math.min(4, t))], HAT);
    }
    // shadow under the hat
    for (let x = 0; x < S; x++) for (let y = 1; y < S; y++) if (isSkin(x, y) && lab[idx(x, y - 1)] === HAT) { shade(x, y, -1); if (style === 'widebrim') { shade(x, y + 1, -1); } }
  }
}

// ------------------------------------------------------------------ glasses
function drawGlasses(F) {
  const { G, sp, put, tint, lab, idx } = F;
  if (!sp.glasses) return;
  const { k, cx, eyeY, lidY, mirror, HW } = G;
  const e = F.eye;
  const type = sp.glasses;
  const frame = H({ round: '#2a2026', rect: '#1e1a22', half: '#3a2a20', wire: '#b8903a', thick: '#141018' }[type] || '#2a2026');
  const frameHi = mix(frame, H('#ffffff'), 0.35);
  const x0 = e.x0 - 1, x1 = e.x0 + e.ew; // inclusive
  const y0 = lidY - 1, y1 = eyeY + Math.max(1, e.open) + (k > 1.2 ? 1 : 0);
  for (const side of [-1, 1]) {
    const X = (x) => (side < 0 ? x : mirror(x));
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
      const edgeX = x === x0 || x === x1, edgeY = y === y0 || y === y1;
      const corner = edgeX && edgeY;
      if (type === 'round' && corner) continue;
      if (edgeX || edgeY) {
        if (type === 'half' && y !== y0 && !(edgeX && y === y0 + 1)) continue;
        if (type === 'wire' && corner) continue;
        put(X(x), y, y === y0 && x < x0 + 2 ? frameHi : frame, ACC);
        if (type === 'thick' && y === y0) put(X(x), y - 1, frame, ACC);
      } else if (lab[idx(X(x), y)] !== 4) tint(X(x), y, H('#d8eef8'), 0.13);
    }
    // glint
    if (lab[idx(X(x0 + 1), y0 + 1)] !== 4) tint(X(x0 + 1), y0 + 1, H('#ffffff'), 0.45);
    // arm to the ear
    const ax = side < 0 ? x0 - 1 : mirror(x0 - 1);
    const end = side < 0 ? Math.floor(cx - HW[y0]) : Math.ceil(cx + HW[y0]) - 1;
    for (let x = Math.min(ax, end); x <= Math.max(ax, end); x++) if (lab[idx(x, y0)] !== HAIR) put(x, y0, frame, ACC);
  }
  // bridge
  for (let x = x1 + 1; x < mirror(x1); x++) put(x, y0 + (type === 'wire' ? 1 : 0), frame, ACC);
}

// ------------------------------------------------------------------ public sprite API (memoised)
const cache = new Map();
export function faceSprite(seed, { size = 48 } = {}) {
  const key = `${seed}@${size}`;
  if (cache.has(key)) return cache.get(key);
  const spr = renderFaceSpec(faceParams(seed), size);
  if (cache.size > 600) cache.delete(cache.keys().next().value);
  cache.set(key, spr);
  return spr;
}
// Uncached render (for benchmarks/tests).
export function renderFace(seed, size = 48) { return renderFaceSpec(faceParams(seed), size); }
