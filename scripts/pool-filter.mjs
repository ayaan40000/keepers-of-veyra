// Reports words in src/data/pools15.js that duplicate, or are one letter away from, a word already in the pools.
// Run: npx vite-node scripts/pool-filter.mjs   (then remove the words it lists)
import { CONCRETE, ABSTRACT, NAMES } from '../src/data/content.js';
import { lev } from '../src/engine/util.js';
import { CONCRETE_15, NAMES_15, SURNAMES_15 } from '../src/data/pools15.js';
import SUR from '../src/data/add/surnames.json';
const check = (label, fresh, old) => {
  const seen = old.map((w) => w.toLowerCase());
  const bad = [];
  for (const w of fresh) {
    const x = w.toLowerCase();
    const hit = seen.find((o) => o === x || (x.length >= 5 && Math.abs(o.length - x.length) <= 1 && lev(o, x) <= 1));
    if (hit) bad.push(`${w}~${hit}`); else seen.push(x);
  }
  console.log(label, fresh.length, 'bad', bad.length, bad.join(' '));
};
check('words', CONCRETE_15, [...CONCRETE, ...ABSTRACT]);
check('names', NAMES_15.map((n) => n[0]), NAMES);
check('surnames', SURNAMES_15, [...SUR.surnames, ...(SUR.avoid || [])]);

// --write: rewrite src/data/pools15.js with the clashing and excluded words removed.
if (process.argv.includes('--write')) {
  const fs = await import('node:fs');
  const EXCLUDE = new Set(['eskimo', 'grenade', 'rifle', 'handcuffs', 'cigar', 'ashtray', 'pajari', 'vampire', 'coffin', 'gravestone']);
  const keep = (fresh, old) => { const seen = old.map((w) => w.toLowerCase()); const out = []; for (const w of fresh) { const x = w.toLowerCase(); if (EXCLUDE.has(x) || seen.some((o) => o === x || (x.length >= 5 && Math.abs(o.length - x.length) <= 1 && lev(o, x) <= 1))) continue; seen.push(x); out.push(w); } return out; };
  const words = keep(CONCRETE_15, [...CONCRETE, ...ABSTRACT]);
  const nm = new Set(keep(NAMES_15.map((n) => n[0]), NAMES));
  const sur = keep(SURNAMES_15, [...SUR.surnames, ...(SUR.avoid || [])]);
  const f = 'src/data/pools15.js';
  let s = fs.readFileSync(f, 'utf8');
  const head = s.slice(0, s.indexOf('export const CONCRETE_15'));
  s = head + `export const CONCRETE_15 = ${JSON.stringify(words)};\n\n// [name, presentation] f, m or n.\nexport const NAMES_15 = ${JSON.stringify(NAMES_15.filter((n) => nm.has(n[0])))};\n\nexport const SURNAMES_15 = ${JSON.stringify(sur)};\n`;
  fs.writeFileSync(f, s);
  console.log('wrote', words.length, nm.size, sur.length);
}
