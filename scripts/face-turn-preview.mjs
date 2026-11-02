// Dev preview: front and three-quarter faces side by side. npx vite-node scripts/face-turn-preview.mjs <out.html>
import fs from 'fs';
import { renderFace, turnSprite } from '../src/pixel/faces.js';
const cells = [];
for (const seed of [11, 202, 3003, 40004, 5005, 66, 777, 8888]) {
  for (const spr of [renderFace(seed, 48), turnSprite(renderFace(seed, 48), 0.38), turnSprite(renderFace(seed, 48), -0.38)]) {
    const px = []; for (let i = 0; i < spr.rgba.length; i += 4) px.push(spr.rgba[i + 3] ? `rgb(${spr.rgba[i]},${spr.rgba[i + 1]},${spr.rgba[i + 2]})` : 'transparent');
    cells.push(`<div class="g">${px.map((c) => `<i style="background:${c}"></i>`).join('')}</div>`);
  }
}
fs.writeFileSync(process.argv[2], `<!doctype html><style>body{background:#222;display:grid;grid-template-columns:repeat(6,auto);gap:10px;padding:10px;margin:0}.g{display:grid;grid-template-columns:repeat(48,3px)}.g i{width:3px;height:3px}</style>${cells.join('')}`);
