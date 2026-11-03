// 1.1 icon for the Watch Ledger (the Long Vigil prize), drawn in code: a slim brown book with a brass clasp and a page edge.
const g = Array.from({ length: 24 }, () => Array(24).fill('.'));
const rect = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = c; };
rect(4, 3, 19, 21, 'o');
rect(5, 4, 18, 19, 'b');
rect(5, 4, 7, 19, 'B');          // spine
rect(5, 20, 18, 20, 'p');        // page edge
rect(9, 7, 16, 7, 'l'); rect(9, 9, 16, 9, 'l'); rect(9, 11, 14, 11, 'l'); // title lines
rect(17, 12, 19, 15, 'o'); rect(18, 13, 19, 14, 'g');                      // clasp
rect(9, 15, 12, 17, 'o'); rect(10, 16, 11, 16, 'g');                       // small brass lamp mark
export const VIGIL_ICON = { w: 24, h: 24, pal: { o: '#140f1a', b: '#6b4a3a', B: '#8a6048', p: '#efe0b8', l: '#c9a97a', g: '#e8b04b' }, px: g.map((r) => r.join('')) };
