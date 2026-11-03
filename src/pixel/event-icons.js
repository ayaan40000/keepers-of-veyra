// 1.1 icons for the Hall of Years and Reckoning trial prizes, drawn in code (the painted versions, art ids prizex_year_tablet and
// prizex_tally_stick, may replace them later). 24 by 24, same palette idea as the other prize icons.
const grid = () => Array.from({ length: 24 }, () => Array(24).fill('.'));
const rect = (g, x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = c; };

// A small brass tablet with a notched top edge and three lines of "digits".
const t = grid();
rect(t, 4, 3, 19, 21, 'o');
rect(t, 5, 4, 18, 20, 'b');
rect(t, 5, 4, 18, 5, 'h');          // top highlight
rect(t, 5, 19, 18, 20, 'd');        // bottom shade
rect(t, 7, 8, 16, 9, 'o'); rect(t, 7, 12, 16, 13, 'o'); rect(t, 7, 16, 12, 17, 'o'); // carved lines
for (const x of [8, 11, 14]) { t[8][x] = 'b'; t[12][x] = 'b'; }                        // gaps that read as numerals
rect(t, 3, 2, 5, 3, 'o'); rect(t, 18, 2, 20, 3, 'o');                                  // corner lugs
export const YEAR_TABLET_ICON = { w: 24, h: 24, pal: { o: '#140f1a', b: '#c9962f', h: '#e8c670', d: '#8a6320' }, px: t.map((r) => r.join('')) };

// A pale wooden tally stick, upright, with notches cut in one edge and a leather loop at the top.
const s = grid();
rect(s, 8, 2, 15, 22, 'o');
rect(s, 9, 3, 14, 21, 'w');
rect(s, 13, 3, 14, 21, 'W');          // shaded edge
for (const y of [7, 10, 13, 16, 19]) { rect(s, 9, y, 11, y, 'o'); }  // notches
rect(s, 11, 4, 12, 5, 'o');           // hole for the loop
rect(s, 10, 0, 13, 1, 'l');           // leather loop
export const TALLY_STICK_ICON = { w: 24, h: 24, pal: { o: '#140f1a', w: '#ecd9a8', W: '#c9a96e', l: '#8a5a3a' }, px: s.map((r) => r.join('')) };
