// Renders the app icons (public/icon-192.png, icon-512.png) from the Brass Lantern relic sprite.
// Usage: npx vite-node scripts/icons.mjs   (needs Playwright's Chromium to rasterise)
import fs from 'fs';
import { createRequire } from 'module';
import { ICONS } from '../src/pixel/icons.js';
import { toRaw } from '../src/pixel/raster.js';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const s = toRaw(ICONS.brass_lantern);
const rgba = Array.from(s.rgba);
const b = await chromium.launch();
const pg = await b.newPage();
for (const size of [192, 512]) {
  const png = await pg.evaluate(({ w, h, rgba, size }) => {
    const c = document.createElement('canvas'); c.width = size; c.height = size;
    const x = c.getContext('2d'); x.fillStyle = '#0F1420'; x.fillRect(0, 0, size, size);
    const t = document.createElement('canvas'); t.width = w; t.height = h; t.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(rgba), w, h), 0, 0);
    x.imageSmoothingEnabled = false; const k = Math.floor((size * 0.72) / Math.max(w, h));
    x.drawImage(t, Math.round((size - w * k) / 2), Math.round((size - h * k) / 2), w * k, h * k);
    return c.toDataURL('image/png').split(',')[1];
  }, { w: s.w, h: s.h, rgba, size });
  fs.writeFileSync(`public/icon-${size}.png`, Buffer.from(png, 'base64'));
}
await b.close();
console.log('icons written', s.w, s.h);
