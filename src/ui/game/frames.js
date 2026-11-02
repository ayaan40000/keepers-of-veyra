// Pixel-art 9-slice panel frames, drawn as 9x9 ASCII grids and turned into crisp SVG data URIs.
// installFrames() writes them into a <style> tag as CSS custom properties (--fr-*), per theme,
// which styles.css uses as border-image-source with `border-image-slice: 4 fill`.
// Each frame cell becomes one "art pixel"; at the default --u of 3px a frame border is 12px.

const FRAMES = {
  // Bevelled stone tablet with corner studs.
  stone: [
    '..ooooo..',
    '.ohhhhho.',
    'ohkmmmkso',
    'ohmiiimso',
    'ohmibimso',
    'ohmiiimso',
    'ohkmmmkso',
    '.ossssso.',
    '..ooooo..',
  ],
  // Gold trim reward frame with corner rivets.
  gold: [
    '..ooooo..',
    '.oGGGGGo.',
    'oGdddddgo',
    'oGdkbkdgo',
    'oGdbbbdgo',
    'oGdkbkdgo',
    'oGdddddgo',
    '.ogggggo.',
    '..ooooo..',
  ],
  // Parchment scroll: wooden rolls top and bottom, paper inset between.
  parchment: [
    '.ooooooo.',
    'oRRRRRRRo',
    'orrrrrrro',
    '.oeeeeeo.',
    '.opppppo.',
    '.opppppo.',
    'oRRRRRRRo',
    'orrrrrrro',
    '.ooooooo.',
  ],
  // Night glass: thin luminous edge, translucent body.
  glass: [
    '..ooooo..',
    '.ottttto.',
    'otwbbbbto',
    'otbbbbbto',
    'otbbbbbto',
    'otbbbbbto',
    'otbbbbbto',
    '.ottttto.',
    '..ooooo..',
  ],
  // Dialogue box: thick light band, dark gap, dark body.
  dialog: [
    '.ooooooo.',
    'owwwwwwwo',
    'owaaaaawo',
    'owabbbawo',
    'owabbbawo',
    'owabbbawo',
    'owaaaaawo',
    'owwwwwwwo',
    '.ooooooo.',
  ],
  // Small inner tile (notes, seals, rows): 1-art-pixel edge.
  tile: [
    '..ooooo..',
    '.obbbbbo.',
    'obbbbbbbo',
    'obbbbbbbo',
    'obbbbbbbo',
    'obbbbbbbo',
    'obbbbbbbo',
    '.obbbbbo.',
    '..ooooo..',
  ],
};

const PALETTES = {
  night: {
    stone: { o: '#04060c', h: '#6f80a8', m: '#3b4664', k: '#a3b0d0', s: '#242c43', i: '#0c1019', b: '#1d2538' },
    gold: { o: '#0d0803', G: '#ffe7a0', g: '#d9a441', d: '#6a4513', k: '#f0c75e', b: '#251c12' },
    parchment: { o: '#2a1a0e', R: '#c8935a', r: '#8a5a30', e: '#d9c69b', p: '#f1e6cb' },
    glass: { o: '#04060ccc', t: '#5f9fa8', w: '#bfe8ea', b: '#111a2ee6' },
    dialog: { o: '#000000', w: '#efe6d2', a: '#2a2f45', b: '#0c0f1a' },
    tile: { o: '#05070d', b: '#182035' },
  },
  day: {
    stone: { o: '#3b2a1c', h: '#e9b878', m: '#b9824a', k: '#ffe2a8', s: '#7d5130', i: '#5e3c22', b: '#f8f0dd' },
    gold: { o: '#2a1a08', G: '#fff0b8', g: '#d39a32', d: '#7a4e14', k: '#f0c75e', b: '#2e2216' },
    parchment: { o: '#3b2414', R: '#c8935a', r: '#8a5a30', e: '#e6d6b0', p: '#fbf3df' },
    glass: { o: '#3b2a1c99', t: '#8a6a3c', w: '#ffffff', b: '#fffaf0d9' },
    dialog: { o: '#2a1f14', w: '#fbf3df', a: '#5a4630', b: '#1c1712' },
    tile: { o: '#8c7048', b: '#efe3c6' },
  },
};

function frameSVG(rows, pal) {
  let rects = '';
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      let e = x + 1;
      while (e < row.length && row[e] === c) e++;
      const col = pal[c];
      if (c !== '.' && col) {
        const hex = col.slice(0, 7), a = col.length > 7 ? parseInt(col.slice(7, 9), 16) / 255 : 1;
        rects += `<rect x="${x}" y="${y}" width="${e - x}" height="1" fill="${hex}"${a < 1 ? ` fill-opacity="${a.toFixed(2)}"` : ''}/>`;
      }
      x = e;
    }
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 9 9" shape-rendering="crispEdges">${rects}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function frameCSS() {
  const block = (theme) => Object.keys(FRAMES).map((k) => `--fr-${k}: ${frameSVG(FRAMES[k], PALETTES[theme][k])};`).join('\n  ');
  return `:root, :root[data-theme="dark"] {\n  ${block('night')}\n}\n:root[data-theme="light"] {\n  ${block('day')}\n}\n`;
}

export function installFrames() {
  if (typeof document === 'undefined' || document.getElementById('px-frames')) return;
  const s = document.createElement('style');
  s.id = 'px-frames';
  s.textContent = frameCSS();
  document.head.appendChild(s);
}
