// 1.1 "Then and now" and "Your Methods": read-only views over results the game already stores (p.results).
// Nothing here is saved, ranked or turned into advice. Both views say plainly that these are scores on Mnemos tasks.
import { TEMPLATE_NAME } from '../data/curriculum.js';
import { UNIT_NAMES } from './additions.js';
import { mean } from './util.js';

const SCORED = ['practice', 'check', 'remedial'];
const VARIANT_NAME = {
  peg: 'Pegs', group: 'Digits in groups', rows: 'Digit rows', grocery: 'Shopping lists', steps: 'Steps', points: 'Talk points', body: 'Study terms',
  numbered: 'Numbered words', surname: 'Names and surnames', skim: 'Skim, Pick, Keep', map: 'Mind Map', poem: 'Poem', calc: 'Mental Reckoning',
  atlas: 'Capitals', elements: 'Elements', roots: 'Word roots', music: 'Music theory', chess: 'Chess openings',
  formulas: 'Formulae', finance: 'Finance formulae', dates: 'Historical dates', trivia: 'General knowledge', wonders: 'Surprising facts', jokes: 'Jokes', diagram: 'Labelled diagrams',
};
// 1.2 new-language and scene variants have compound keys (vocab-es-produce, scene-sc-shop-choose).
const LANG_WORD = { sw: 'Swahili', es: 'Spanish', tr: 'Turkish', old: 'Old tongue' };
const PART_WORD = { produce: 'meaning to word', gender: 'with el or la', alike: 'look-alikes', sounds: 'sounds only', phrases: 'phrases' };
const SCENE_WORD = { 'sc-shop': 'Shopping list', 'sc-way': 'Directions', 'sc-party': 'Names at a party', 'sc-voicemail': 'Voicemails', 'sc-tram': 'Tram board', 'sc-recipe': 'Recipe', 'sc-menu': 'Spanish menu', 'sc-dinner': 'Jokes at dinner', 'sc-board': 'Teacher\'s board', any: 'Mixed' };
function compoundLabel(key) {
  const parts = key.split('-');
  if (parts[0] === 'vocab') {
    const [, ...rest] = parts;
    const lang = LANG_WORD[rest[0]] ? LANG_WORD[rest.shift()] : 'Swahili';
    const extra = rest.map((x) => PART_WORD[x]).filter(Boolean);
    return `Vocabulary: ${lang}${extra.length ? ` (${extra.join(', ')})` : ''}`;
  }
  if (parts[0] === 'scene') {
    const choose = key.endsWith('-choose');
    const id = key.replace(/^scene-/, '').replace(/-choose$/, '');
    return `Real-life Scene: ${SCENE_WORD[id] || id}${choose ? ' (you chose the technique)' : ''}`;
  }
  return null;
}
export const methodLabel = (key) => VARIANT_NAME[key] || TEMPLATE_NAME[key] || compoundLabel(key) || key;

// First scored attempt (never guided practice), the latest and the best, for each task or variant tried at least twice.
export function thenAndNow(p) {
  const by = {};
  for (const r of p.results || []) {
    if (!SCORED.includes(r.role) || (r.v && r.v.startsWith('unit-'))) continue;
    (by[r.v || r.t] = by[r.v || r.t] || []).push(r);
  }
  return Object.entries(by).filter(([, rs]) => rs.length >= 2).map(([key, rs]) => ({
    key, name: methodLabel(key), tries: rs.length, first: rs[0].acc, firstDate: rs[0].date, latest: rs[rs.length - 1].acc, latestDate: rs[rs.length - 1].date, best: Math.max(...rs.map((r) => r.acc)),
  }));
}

// Unit Checks: Form A (before) beside Form B (after), as a share of the whole check.
export function unitComparison(p) {
  const out = [];
  for (const unit of Object.keys(UNIT_NAMES)) {
    const side = (form) => {
      const rs = (p.results || []).filter((r) => r.v === `unit-${unit}-${form}`);
      if (!rs.length) return null;
      const n = rs.reduce((a, r) => a + r.n, 0);
      return { acc: n ? rs.reduce((a, r) => a + r.correct, 0) / n : 0, date: rs[0].date };
    };
    const a = side('A'), b = side('B');
    if (a || b) out.push({ unit, name: UNIT_NAMES[unit], a, b });
  }
  return out;
}

const METHOD_TESTS = {
  chain: (r) => r.t === 'chain' && !r.v, palace: (r) => r.t === 'palace', peg: (r) => r.v === 'peg', major: (r) => r.t === 'major',
  keyword: (r) => r.t === 'vocab', map: (r) => r.v === 'map', poem: (r) => r.v === 'poem', skim: (r) => r.v === 'skim',
};
// Per method: how many tries, mean accuracy, and what was still held after seven days or more. Roman Room and Journey are
// palaces in the game's records, so they are not told apart here.
export function methodStats(p, methods) {
  return methods.filter((m) => METHOD_TESTS[m.id]).map((m) => {
    const test = METHOD_TESTS[m.id];
    const tries = (p.results || []).filter((r) => r.role !== 'probe' && ['practice', 'check', 'remedial', 'free'].includes(r.role) && test(r));
    const held = (p.results || []).filter((r) => r.role === 'probe' && (r.delay || 0) >= 7 && test(r));
    return { id: m.id, name: m.name, line: m.line, n: tries.length, acc: tries.length ? Math.round(mean(tries.map((r) => r.acc)) * 100) : null, hold7: held.length ? Math.round(mean(held.map((r) => r.acc)) * 100) : null };
  });
}
