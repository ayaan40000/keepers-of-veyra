// Captures the Undercroft entrance canvas from the real game code (no image model involved).
//   node tools/asset-studio/scene_capture.mjs guide <out.png>          the code-drawn entrance, still (layout guide for motion.py)
//   node tools/asset-studio/scene_capture.mjs frames <dir> [count]     animation frames of whatever entrance ships (review GIF)
//   node tools/asset-studio/scene_capture.mjs title <out.png>          the code-drawn title backdrop (320x180 layout guide)
//   node tools/asset-studio/scene_capture.mjs chamber <dir>            the six code-drawn Undercroft chambers (176x112 layout guides)
//   node tools/asset-studio/scene_capture.mjs map <dir>                the code-drawn world map, all lost and all restored (240x320 layout guides)
//   node tools/asset-studio/scene_capture.mjs mapframes <dir> [count] [n]   frames of the world map from previews/world (n: 0 none restored, 1 M1-M5, 2 all)
// Starts its own Vite dev server on the preview page previews/crypt and stops it afterwards.
import { createServer } from 'vite';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const [mode, out, count = '24'] = process.argv.slice(2);
if (!['guide', 'frames', 'map', 'mapframes', 'title', 'chamber'].includes(mode) || !out) {
  console.error('usage: scene_capture.mjs guide <out.png> | frames <dir> [count] | map <dir> | mapframes <dir> [count] [n]');
  process.exit(2);
}

const server = await createServer({ root: ROOT, logLevel: 'error', server: { port: 5287, strictPort: false } });
await server.listen();
const port = server.config.server.port;
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
  const save = (data, file) => {
    if (!data) throw new Error('canvas not found');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, Buffer.from(data.split(',')[1], 'base64'));
  };
  if (mode === 'chamber') {
    // one guide per chamber decor: <dir>/crypt_chamber_<decor>.png
    await page.goto(`http://localhost:${port}/previews/crypt/index.html?reduced=1`);
    const shots = await page.evaluate(async () => {
      const m = await import('/src/ui/Crypt.jsx');
      const out = {};
      for (const d of ['bones', 'shelves', 'water', 'thrones', 'roots', 'springs']) out[d] = m.chamberGuideCanvas(d).toDataURL('image/png');
      return out;
    });
    for (const [d, data] of Object.entries(shots)) save(data, path.join(out, `crypt_chamber_${d}.png`));
    console.log('chamber guides', out);
  } else if (mode === 'title') {
    await page.goto(`http://localhost:${port}/previews/crypt/index.html?reduced=1`);
    save(await page.evaluate(async () => { const w = await import('/src/ui/pixel/world.js'); return w.toCanvas(w.buildTitle().p).toDataURL('image/png'); }), out);
    console.log('title guide', out);
  } else if (mode === 'map') {
    // The map's static layers straight from src/ui/pixel/world.js (served by Vite), no screen needed.
    await page.goto(`http://localhost:${port}/previews/crypt/index.html?reduced=1`);
    const shots = await page.evaluate(async () => {
      const w = await import('/src/ui/pixel/world.js');
      const all = w.DISTRICT_IDS;
      const grab = (gates, cur) => w.toCanvas(w.buildMapState(gates, cur).p).toDataURL('image/png');
      return { lost: grab([], ''), restored: grab(all, '') };
    });
    save(shots.lost, path.join(out, 'world_map_lost.png'));
    save(shots.restored, path.join(out, 'world_map_restored.png'));
    console.log('map guides', out);
    process.exitCode = 0;
  } else if (mode === 'mapframes') {
    await page.goto(`http://localhost:${port}/previews/world/index.html?map=${process.argv[5] || '1'}`);
    await page.waitForSelector('.worldmap canvas');
    await page.waitForTimeout(1500);
    for (let i = 0; i < Number(count); i++) {
      save(await page.evaluate(() => document.querySelector('.worldmap canvas').toDataURL('image/png')), path.join(out, `f${String(i).padStart(3, '0')}.png`));
      await page.waitForTimeout(83);
    }
    console.log('map frames', out, count);
  }
  if (['map', 'mapframes', 'title', 'chamber'].includes(mode)) { await browser.close(); await server.close(); process.exit(0); }
  const q = mode === 'guide' ? '?reduced=1' : '';
  await page.goto(`http://localhost:${port}/previews/crypt/index.html${q}`);
  await page.waitForSelector('.crypt-scene canvas');
  await page.waitForTimeout(1200);
  const grab = () => page.evaluate((m) => {
    const cs = [...document.querySelectorAll('.crypt-scene canvas')];
    const c = m === 'guide' ? cs.find((k) => k.width === 176 && k.height === 112) : cs[0];
    return c ? c.toDataURL('image/png') : null;
  }, mode);
  if (mode === 'guide') { save(await grab(), out); console.log('guide', out); }
  else {
    for (let i = 0; i < Number(count); i++) { save(await grab(), path.join(out, `f${String(i).padStart(3, '0')}.png`)); await page.waitForTimeout(83); }
    console.log('frames', out, count);
  }
} finally {
  await browser.close();
  await server.close();
}
