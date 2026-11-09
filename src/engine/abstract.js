// 1.2 Hard material for an untrained memory, as sources on the Fact Recall drill (spec.src):
//   'formulas'  a formula with one part missing (and whole chemical formulas)
//   'dates'     a historical event -> its year (the nine checked date sets the Hall of Years uses)
//   'trivia'    a general-knowledge question -> its answer (the checked Event Hall pool)
//   'wonders'   a surprising fact -> its answer, with a short "why"
//   'jokes'     a riddle or pun -> its punchline (the key word is what counts)
//   'diagram'   a labelled drawing -> each numbered label
// Pure and deterministic for a seed. Each source also builds next-day questions asked another way (extra.probe).
import { FORMULAS, CHEM, WONDERS, JOKES, DIAGRAMS, DIAGRAM_BY_ID } from '../data/abstract.js';
import DATE_SETS from '../data/add/dates.json';
import TRIVIA from '../data/add/trivia.json';
import { sample, shuffle, matches, normalize } from './util.js';

export const ABSTRACT_SRC = ['formulas', 'dates', 'trivia', 'wonders', 'jokes', 'diagram'];
const DATE_EVENTS = DATE_SETS.flatMap((s) => s.events.map((e) => ({ ...e, set: s.id })));

// ---------- checking ----------
// Formula parts: superscripts, subscripts and fractions are folded (r² = r2 = r^2, ½ = 1/2), Greek letters may be spelled.
const GREEK = { π: 'pi', λ: 'lambda', ρ: 'rho', θ: 'theta', Δ: 'delta', δ: 'delta', Ω: 'ohm', μ: 'mu' };
export const normFormula = (s) => String(s ?? '').replace(/[πλρθΔδΩμ]/g, (c) => GREEK[c]).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g, '');
export function formulaOk(resp, it) {
  const r = normFormula(resp);
  return !!r && [it.answer, ...(it.alt || [])].some((a) => normFormula(a) === r);
}
// Every accepted way to write a whole formula: each token may be written any accepted way.
export function wholeFormulaForms(f) {
  let forms = [''];
  f.show.forEach((tok, i) => { const opts = [tok, ...((f.alt && f.alt[i]) || [])]; forms = forms.flatMap((pre) => opts.map((o) => `${pre} ${o}`)).slice(0, 64); });
  const out = forms.map((s) => s.trim());
  const eq = f.show.indexOf('=');
  if (eq > 0) out.push(...out.map((s) => s.split(' = ').slice(1).join(' = ')).filter(Boolean)); // the right-hand side alone
  return out;
}
// Years: the digits must match; a BCE year must say so (BC, BCE or a minus sign), and a CE year must not.
export function yearOk(resp, it) {
  const s = String(resp ?? '').toLowerCase();
  const d = s.replace(/\D/g, '');
  const first = (s.match(/\d+/) || [''])[0];
  if (!d || +first !== +String(it.answer).replace(/\D/g, '')) return false;
  const saysBce = /b\.?\s*c|before|^\s*-/.test(s);
  return it.bce ? saysBce : !saysBce;
}
// Jokes: the punchline counts when its key word is there (any order, a small typo forgiven), or the line is nearly exact.
const wordsOf = (s) => String(s ?? '').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
export function jokeOk(resp, it) {
  const words = wordsOf(resp);
  if (!words.length) return false;
  if (normalize(resp) === normalize(it.answer)) return true;
  return (it.key || []).some((k) => {
    const kw = wordsOf(k);
    if (!kw.length) return false;
    if (kw.length === 1) return words.some((w) => matches(w, kw[0])); // one word: a whole word, small typo forgiven
    for (let i = 0; i + kw.length <= words.length; i++) if (kw.every((x, j) => words[i + j] === x)) return true; // a phrase: those words in a row
    return false;
  });
}
// The first number in the answer counts ("8 min 20 s" is 8); a range accepts any whole number inside it.
const firstNum = (s) => { const m = String(s ?? '').replace(/,(?=\d{3})/g, '').match(/\d+(\.\d+)?/); return m ? +m[0] : null; };
const bareText = (s) => String(s ?? '').trim().replace(/^(the|a|an)\s+/i, '');
export function abstractOk(resp, it) {
  if (it.formula) return formulaOk(resp, it);
  if (it.year) return yearOk(resp, it);
  if (it.joke || it.keyed) return jokeOk(resp, it);
  if (it.kind === 'number') { const v = firstNum(resp); if (v == null) return false; return it.range ? v >= it.range[0] && v <= it.range[1] : v === firstNum(it.answer); }
  if (it.text && String(resp ?? '').match(/^\s*(the|a|an)\s/i)) { const r2 = bareText(resp); if ([it.answer, ...(it.alt || [])].some((a) => matches(r2, bareText(a)))) return true; }
  return null; // not one of ours: the normal check runs
}

// ---------- building ----------
const blanked = (f, b) => f.show.map((t, i) => (i === b ? '___' : t)).join(' ');
function formulaItem(f, b) {
  return { cue: `${f.name}: ${blanked(f, b)}`, answer: f.show[b], formula: true, text: `${f.name}: ${f.show.join(' ')}  (${f.legend})`, ...(f.alt?.[b] ? { alt: f.alt[b] } : {}) };
}
function formulas(n, r) {
  const kChem = Math.min(CHEM.length, Math.round(n / 3));
  const fs = sample(FORMULAS, n - kChem, r);
  const chem = sample(CHEM, kChem, r);
  const pick = fs.map((f) => { const bs = shuffle(f.blank, r); return { f, b: bs[0], b2: bs[1] ?? bs[0] }; });
  const differs = pick.some(({ b, b2 }) => b !== b2) || chem.length > 0;
  const items = [...pick.map(({ f, b }) => formulaItem(f, b)), ...chem.map(([, name, formula, alt]) => ({ cue: `Chemical formula of ${name.toLowerCase()}`, answer: formula, formula: true, text: `${name}: ${formula}`, ...(alt ? { alt } : {}) }))];
  const probe = [...pick.map(({ f, b2 }) => formulaItem(f, b2)), ...chem.map(([, name, formula]) => ({ cue: `Which substance has the formula ${formula}?`, answer: name.replace(/ \(.*\)$/, ''), alt: [name, (name.match(/\((.*)\)/) || [])[1]].filter(Boolean) }))];
  return { items, extra: differs ? { probe } : null };
}
function dates(n, r) {
  const ev = sample(DATE_EVENTS, n, r);
  const items = ev.map((e) => ({ cue: e.text, answer: e.year, year: true, bce: !!e.bce, text: `${e.year}: ${e.text}`, label: e.label }));
  // Next day: given the year, name the event (its short label, or any accepted name).
  const noYear = (e) => [e.label, ...(e.accepts || [])].filter((k) => !/\d/.test(k)); // the year is in the question, so it cannot be the answer
  const probe = ev.map((e) => ({ cue: `What happened in ${e.year}?`, answer: e.label, keyed: true, key: noYear(e) }));
  return { items, extra: { probe } };
}
function trivia(n, r) {
  const qs = sample(TRIVIA, n, r);
  return { items: qs.map((q) => ({ cue: q.q, answer: q.a, alt: q.accepts || [], text: `${q.q} ${q.a}.` })) };
}
function wonders(n, r) {
  const ws = sample(WONDERS, n, r);
  return { items: ws.map((w) => ({ cue: w.q, answer: w.a, ...(w.alt ? { alt: w.alt } : {}), ...(w.kind ? { kind: w.kind } : {}), ...(w.range ? { range: w.range } : {}), pic: `fact_${w.id}`, text: `${w.q} ${w.a}. ${w.why}` })) };
}
function jokes(n, r) {
  const js = sample(JOKES, n, r);
  return { items: js.map((j) => ({ cue: j.q, answer: j.a, key: j.key, joke: true, pic: `joke_${j.id}`, text: `${j.q} ${j.a}.` })) };
}
function diagram(spec, r) {
  // A diagram with fewer marks than asked for is chosen only when nothing bigger fits, so n still shapes the task.
  const want = spec.n || 6;
  const pool = spec.dg && DIAGRAM_BY_ID[spec.dg] ? [DIAGRAM_BY_ID[spec.dg]] : DIAGRAMS.filter((x) => x.marks.length >= Math.min(want, 8));
  const d = (pool.length ? pool : DIAGRAMS)[Math.floor(r() * (pool.length || DIAGRAMS.length))];
  const items = d.marks.map((m, i) => ({ cue: `Mark ${i + 1}`, answer: m.label, ...(m.accepts ? { alt: m.accepts } : {}), dg: d.id, mk: i + 1 }));
  return { items, extra: { diagram: d.id } };
}

export function abstractItems(spec, n, r) {
  switch (spec.src) {
    case 'formulas': return formulas(n, r);
    case 'dates': return dates(n, r);
    case 'trivia': return trivia(n, r);
    case 'wonders': return wonders(n, r);
    case 'jokes': return jokes(n, r);
    case 'diagram': return diagram(spec, r);
    default: return null;
  }
}
