// 1.2 new-language practice: Swahili, Spanish, Turkish and the invented old tongue of Veyra.
// Options on the vocab drill (all optional; a plain vocab spec still uses the original Swahili generator):
//   lang: 'sw' | 'es' | 'tr' | 'old'   which pool
//   dir: 'produce'                      show the meaning, type the foreign word (harder, and it is how words stick)
//   gender: true                        produce the article with the noun (Spanish el / la), one point each
//   src: 'phrases'                      short phrases instead of single words
//   alike: true                         look-alike words studied together (perro and pero, kapı and kapak)
//   sounds: true                        invented words with no meaning at all: write the sounds back in any order
// Pure and deterministic for a seed, so stored sets and probes keep working.
import V from '../data/add/vocab.json';
import { VOCAB } from '../data/content.js';
import { OLD_TONGUE } from '../data/trials.js';
import { sample, shuffle, lev, normalize, matches } from './util.js';

export const VOCAB_HONEST = V.honest;
export const LANGS = {
  sw: { name: 'Swahili', words: VOCAB.map(([word, meaning, hint]) => ({ id: `sw-${word}`, word, meaning, ...(hint ? { hint } : {}) })), phrases: [] },
  es: { name: V.langs.es.name, words: V.langs.es.words, phrases: V.langs.es.phrases },
  tr: { name: V.langs.tr.name, words: V.langs.tr.words, phrases: V.langs.tr.phrases },
  old: { name: V.langs.old.name, words: [...OLD_TONGUE.map(([word, meaning], i) => ({ id: `old-t${i + 1}`, word, meaning })), ...V.langs.old.words], phrases: [] },
};
export const ARTICLE = { es: { m: 'el', f: 'la' } };

// Article and word, one point each. "perro" alone earns the word point; "la perro" earns the word point only.
export function scoreArticle(items, responses) {
  const errs = { omission: 0, substitution: 0, order: 0, timeout: 0 };
  let correct = 0;
  const perItem = items.map((it, i) => {
    const resp = String((responses || [])[i] ?? '').trim();
    const words = resp.split(/\s+/).filter(Boolean);
    const hasArt = words.length > 1;
    const art = hasArt ? words[0] : '';
    const word = hasArt ? words.slice(1).join(' ') : words[0] || '';
    const a = matches(art, it.first) || normalize(art) === normalize(it.first);
    const b = matches(word, it.last);
    correct += (a ? 1 : 0) + (b ? 1 : 0);
    if (!a) errs[art ? 'substitution' : 'omission']++;
    if (!b) errs[word ? 'substitution' : 'omission']++;
    return { target: it.answer, response: resp, ok: a && b, ...(a && b ? {} : { err: resp ? 'substitution' : 'omission' }), parts: [a, b] };
  });
  return { n: items.length * 2, correct, acc: items.length ? correct / (items.length * 2) : 0, errs, perItem };
}
export const langName = (spec) => (LANGS[spec?.lang || 'sw'] || LANGS.sw).name;

// Every foreign word the game knows, so a look-alike typed by mistake is never forgiven as a typo.
export const ALL_FOREIGN = Object.values(LANGS).flatMap((l) => [...l.words.map((w) => w.word), ...l.phrases.map((p) => p.phrase)]);

export const isLangSpec = (spec) => spec?.t === 'vocab' && !!(spec.lang || spec.dir || spec.alike || spec.sounds || spec.gender || spec.src === 'phrases');

// Pairs of words in one pool that look or sound nearly the same (at most 2 letters apart, or one is the other plus a letter).
export function alikePairs(words) {
  const f = words.map((w) => normalize(w.word));
  const out = [];
  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j < words.length; j++) {
      const a = f[i], b = f[j];
      if (a.length < 3 || b.length < 3 || a === b) continue;
      const d = lev(a, b);
      if (d <= 1 || (d === 2 && Math.min(a.length, b.length) >= 4)) out.push([i, j]);
    }
  }
  return out;
}

function pickAlike(words, n, r) {
  const pairs = shuffle(alikePairs(words), r);
  const used = new Set();
  const picked = [];
  for (const [i, j] of pairs) {
    if (picked.length + 2 > n) break;
    if (used.has(i) || used.has(j)) continue;
    used.add(i); used.add(j); picked.push(words[i], words[j]);
  }
  const rest = sample(words.filter((_, k) => !used.has(k)), n - picked.length, r);
  return shuffle([...picked, ...rest], r);
}

const sayOf = (w) => (w.say ? { say: w.say } : {});
const hintOf = (w) => (w.hint ? { hint: w.hint } : {});

// Returns { items, extra } for a new-language vocab spec, or null so the original generator runs.
export function langItems(spec, n, r) {
  if (!isLangSpec(spec)) return null;
  const code = LANGS[spec.lang] ? spec.lang : 'sw';
  const L = LANGS[code];
  const produce = spec.dir === 'produce';
  const extra = { lang: L.name, code };
  if (spec.src === 'phrases' && L.phrases.length) {
    const items = sample(L.phrases, n, r).map((p) => (produce
      ? { cue: p.meaning, answer: p.phrase, phrase: true, id: p.id }
      : { cue: p.phrase, answer: p.meaning, phrase: true, id: p.id, ...(p.alt ? { alt: p.alt } : {}) }));
    return { items, extra };
  }
  if (spec.sounds) return { items: sample(L.words, n, r).map((w) => ({ answer: w.word, id: w.id, ...sayOf(w) })), extra: { ...extra, sounds: true } };
  const art = ARTICLE[code];
  const pool = spec.gender && art ? L.words.filter((w) => art[w.gender]) : L.words;
  const words = spec.alike ? pickAlike(pool, n, r) : sample(pool, n, r);
  const items = words.map((w) => {
    if (produce && spec.gender && art) {
      const a = art[w.gender];
      return { cue: w.meaning, answer: `${a} ${w.word}`, first: a, last: w.word, id: w.id, ...sayOf(w), ...hintOf(w) };
    }
    if (produce) return { cue: w.meaning, answer: w.word, id: w.id, ...(w.alt ? { malt: w.alt } : {}), ...sayOf(w), ...hintOf(w) };
    return { cue: w.word, answer: w.meaning, id: w.id, ...(w.alt ? { alt: w.alt } : {}), ...sayOf(w), ...hintOf(w) };
  });
  return { items, extra };
}

// Short label for result records (Then and Now keeps each kind apart).
export function langVariant(spec) {
  return ['vocab', spec.lang, spec.dir, spec.gender && 'gender', spec.alike && 'alike', spec.sounds && 'sounds', spec.src].filter(Boolean).join('-');
}
