// Review sheet of faces: npx vite-node scripts/face-samples.mjs <out.png> [rows...]  rows: 48 (current drawing at 48 px), hd96, hd128 (detailed, cropped), lure96 (a detailed look-alike: two features differ)
// Each face is drawn at its size and enlarged with whole-pixel scaling to the same display height.
import fs from 'node:fs';
import zlib from 'node:zlib';
import { faceSprite, faceSpriteHD, describeFace } from '../src/pixel/faces.js';
import { lookAlike } from '../src/engine/core.js';
import { rng } from '../src/engine/util.js';

const [out = 'face-samples.png', ...rest] = process.argv.slice(2);
const sizes = rest.length ? rest : ['48', 'hd96', 'hd128'];
const seeds = [101, 2024, 377, 9001, 4242, 77, 31337, 555];
const CELL = 384, PAD = 8;
const W = seeds.length * (CELL + PAD) + PAD, H = sizes.length * (CELL + PAD) + PAD;
const img = new Uint8Array(W * H * 4).fill(30);
for (let i = 3; i < img.length; i += 4) img[i] = 255;
sizes.forEach((sz, row) => seeds.forEach((seed, col) => {
  const s = sz.startsWith('lure') ? faceSpriteHD(seed, { size: +sz.slice(4), look: lookAlike(seed, rng(seed + 1)) }) : sz.startsWith('hd') ? faceSpriteHD(seed, { size: +sz.slice(2) }) : faceSprite(seed, { size: +sz });
  const sc = Math.floor(CELL / s.w);
  const ox = PAD + col * (CELL + PAD) + Math.floor((CELL - s.w * sc) / 2), oy = PAD + row * (CELL + PAD) + Math.floor((CELL - s.h * sc) / 2);
  for (let y = 0; y < s.h * sc; y++) for (let x = 0; x < s.w * sc; x++) {
    const si = (Math.floor(y / sc) * s.w + Math.floor(x / sc)) * 4, di = ((oy + y) * W + ox + x) * 4;
    if (s.rgba[si + 3]) { img[di] = s.rgba[si]; img[di + 1] = s.rgba[si + 1]; img[di + 2] = s.rgba[si + 2]; }
  }
}));
// minimal PNG writer
const crc = (b) => { let c = ~0; for (const x of b) { c ^= x; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); } return ~c >>> 0; };
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
const raw = Buffer.alloc((W * 4 + 1) * H);
for (let y = 0; y < H; y++) { raw[y * (W * 4 + 1)] = 0; Buffer.from(img.buffer, y * W * 4, W * 4).copy(raw, y * (W * 4 + 1) + 1); }
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6;
fs.writeFileSync(out, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
console.log(out, W, 'x', H);
for (const s of seeds) console.log(s, describeFace(s));
