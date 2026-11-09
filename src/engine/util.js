export function rng(seed) {
  let a = typeof seed === 'number' ? seed >>> 0 : hashStr(String(seed));
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

export function shuffle(arr, r) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export const sample = (arr, n, r) => shuffle(arr, r).slice(0, Math.min(n, arr.length));
export const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
export const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

// Local calendar dates as YYYY-MM-DD. offsetDays supports the reviewer clock.
export function isoDate(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
export function todayISO(offsetDays = 0) {
  const d = new Date(); d.setDate(d.getDate() + offsetDays); return isoDate(d);
}
export function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number); const dt = new Date(y, m - 1, d + n); return isoDate(dt);
}
export function daysBetween(a, b) {
  const [y1, m1, d1] = a.split('-').map(Number), [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

// Letters that do not split into a base letter plus an accent (Turkish dotless i, German sharp s, and a few more).
const FOLD = { 'ı': 'i', 'ß': 'ss', 'ø': 'o', 'æ': 'ae', 'œ': 'oe', 'ł': 'l', 'đ': 'd', 'þ': 'th', 'ð': 'd' };
export function normalize(s) {
  return String(s ?? '').toLowerCase().replace(/[ıßøæœłđþð]/g, (c) => FOLD[c]).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
}

let KNOWN = new Set();
export function setKnownWords(words) { KNOWN = new Set(words.map(normalize)); }

export function lev(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

// Forgiving answer match: case, accents, punctuation, plurals, one typo on 5+ letter words.
export function matches(response, target) {
  const r = normalize(response), t = normalize(target);
  if (!r || !t) return false;
  if (r === t) return true;
  if (r === t + 's' || r === t + 'es' || t === r + 's' || t === r + 'es') return true;
  if (t.length >= 5 && r[0] === t[0] && lev(r, t) <= 1 && !KNOWN.has(r)) return true;
  return false;
}

// Approximate Major System decoder: word -> digit string by consonant sounds.
export function majorDecode(word) {
  let w = String(word).toLowerCase().replace(/[^a-z]/g, '');
  w = w.replace(/^kn/, 'n').replace(/^gn/, 'n').replace(/^wr/, 'r').replace(/^ps/, 's').replace(/mb$/, 'm').replace(/gh/g, '');
  let out = '', prev = '';
  for (let i = 0; i < w.length; i++) {
    const c = w[i], n2 = w[i + 1] || '';
    let d = '';
    if ((c === 't' && n2 === 'c' && w[i + 2] === 'h')) { d = '6'; i += 2; }
    else if (c === 'c' && n2 === 'h') { d = '6'; i++; }
    else if (c === 's' && n2 === 'h') { d = '6'; i++; }
    else if (c === 'p' && n2 === 'h') { d = '8'; i++; }
    else if (c === 'd' && n2 === 'g') { continue; }
    else if (c === 't' && n2 === 'h') { d = '1'; i++; }
    else if (c === 'c' && n2 === 'k') { d = '7'; i++; }
    else if (c === 'c') d = n2 && 'eiy'.includes(n2) ? '0' : '7';
    else if (c === 'g') d = n2 && 'eiy'.includes(n2) && i > 0 ? '6' : '7';
    else if ('sz'.includes(c)) d = '0';
    else if ('td'.includes(c)) d = '1';
    else if (c === 'n') d = '2';
    else if (c === 'm') d = '3';
    else if (c === 'r') d = '4';
    else if (c === 'l') d = '5';
    else if (c === 'j') d = '6';
    else if ('kq'.includes(c)) d = '7';
    else if ('fv'.includes(c)) d = '8';
    else if ('pb'.includes(c)) d = '9';
    else if (c === 'x') d = '70';
    if (d && d === prev && w[i - 1] === c) continue; // doubled letter = one sound
    if (d) { out += d; prev = d; } else prev = '';
  }
  return out;
}
