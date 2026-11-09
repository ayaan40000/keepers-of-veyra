// 1.4 The Gloss: explain an idea in your own words, compare with a model, mark yourself; asked again a day and a week later.
// Self-marks earn nothing and never change skill estimates (self-report cannot be checked). Pure logic only.
import { addDays } from './util.js';
import { GLOSSES } from '../data/gloss.js';
import { WONDERS } from '../data/abstract.js';

export const GLOSS_STEPS = [1, 7];          // days after the first gloss
export const NEW_PER_DAY = 2;
export const SITTING_MAX = 4;
export const MARKS = ['kept', 'partly', 'missed'];
export const blankGloss = () => ({ v: 1, items: {}, history: [] });

export const ALL_GLOSSES = [
  ...GLOSSES,
  ...WONDERS.filter((w) => w.why).map((w) => ({ id: 'g-w-' + w.id, src: 'wonders', prompt: `Why is this true? ${w.q} ${w.a}.`, model: w.why })),
];
export const GLOSS_BY_ID = Object.fromEntries(ALL_GLOSSES.map((g) => [g.id, g]));

// Sources the player has met: the course ideas always; formulae, finance and facts once a drill or a Ledger book used them.
export function metSources(p) {
  const met = new Set(['course']);
  for (const s of p.sets || []) if (s.spec?.src) met.add(s.spec.src);
  for (const r of p.results || []) if (r.spec?.src) met.add(r.spec.src);
  for (const b of p.ledger?.books || []) if (b.starter === 'formulae') met.add('formulas');
  return met;
}

export function ensureGloss(p) { if (!p.gloss || typeof p.gloss !== 'object' || !p.gloss.items) p.gloss = blankGloss(); return p.gloss; }

// Today's prompts: delayed ones first (they matter most), then up to two new ones from material the player has met.
export function todayGlosses(p, date) {
  const g = p.gloss || blankGloss();
  const due = Object.entries(g.items).filter(([id, it]) => it.due && it.due <= date && GLOSS_BY_ID[id]).sort((a, b) => (a[1].due < b[1].due ? -1 : 1)).map(([id]) => ({ id, delayed: true }));
  const startedToday = Object.values(g.items).filter((it) => it.first === date).length;
  const met = metSources(p);
  const order = ['course', 'formulas', 'finance', 'wonders'];
  const fresh = ALL_GLOSSES.filter((x) => met.has(x.src) && !g.items[x.id]).sort((a, b) => order.indexOf(a.src) - order.indexOf(b.src))
    .slice(0, Math.max(0, NEW_PER_DAY - startedToday)).map((x) => ({ id: x.id, delayed: false }));
  return [...due, ...fresh].slice(0, SITTING_MAX);
}
export const glossDueCount = (p, date) => todayGlosses(p, date).length;

// Record a self-mark. A first gloss comes back tomorrow; a delayed one marked Kept or Partly moves on (tomorrow, then a week);
// Missed comes back tomorrow. After the week it is done, and stays in the history.
export function recordGloss(p, id, mark, date) {
  if (!GLOSS_BY_ID[id] || !MARKS.includes(mark)) return null;
  const g = ensureGloss(p);
  const it = g.items[id] || { first: date, step: 0, due: null, marks: [] };
  it.marks = [...it.marks, { date, mark }].slice(-6);
  if (!g.items[id]) it.due = addDays(date, GLOSS_STEPS[0]);
  else if (mark === 'missed') it.due = addDays(date, 1);
  else { it.step++; it.due = it.step < GLOSS_STEPS.length ? addDays(it.first, GLOSS_STEPS[it.step]) : null; if (it.due && it.due <= date) it.due = addDays(date, 1); }
  g.items[id] = it;
  g.history = [...g.history, { date, id, mark }].slice(-200);
  return it;
}

const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
const isDate = (x) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);
export function validateGloss(g) {
  const BAD = 'Gloss record is invalid.';
  if (!isObj(g) || !isObj(g.items) || !Array.isArray(g.history) || g.history.length > 200) return BAD;
  if (Object.keys(g.items).length > 1000) return BAD;
  for (const [id, it] of Object.entries(g.items)) {
    if (id.length > 60 || !isObj(it) || !isDate(it.first) || (it.due != null && !isDate(it.due)) || !Number.isInteger(it.step) || it.step < 0 || it.step > 9) return BAD;
    if (!Array.isArray(it.marks) || it.marks.length > 6 || !it.marks.every((m) => isObj(m) && isDate(m.date) && MARKS.includes(m.mark))) return BAD;
  }
  if (!g.history.every((h) => isObj(h) && isDate(h.date) && typeof h.id === 'string' && MARKS.includes(h.mark))) return BAD;
  return null;
}
