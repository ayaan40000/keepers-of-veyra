// 1.2 Real-life scenes: the same memory techniques, used on material shaped like everyday life.
// Each template builds fresh material from a seed, so a scene is never the same twice:
//   build(r, n) -> { frame, present, body, questions, probe, keys }
//   present: 'prose' (things hidden in what someone says), 'spoken' (a message or directions),
//            'table' (a timetable), 'list' (a recipe), 'cards' (people you meet), 'menu'
//   questions: asked straight after study. probe: asked the next day, in a different form.
//   A question: { q, answer, kind: 'text' | 'number' | 'digits' | 'time' | 'choice', options?, alt?, face? }
// The places are in Veyra; the shopping, recipes and phone numbers are ordinary and made up.
// Text is plain and warm, with no em dashes. Ids are permanent once released (they key saved sets).
import GROCERY from './add/grocery.json';
import V from './add/vocab.json';
import { NAMES, NAME_PRES } from './content.js';
import { faceParams } from '../pixel/faces.js';
import { JOKES, FORMULAS } from './abstract.js';
import { wholeFormulaForms } from '../engine/abstract.js';
import DATE_SETS from './add/dates.json';

const pick = (arr, r) => arr[Math.floor(r() * arr.length)];
const shuffleR = (arr, r) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sampleR = (arr, n, r) => shuffleR(arr, r).slice(0, Math.min(n, arr.length));
const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
const clampN = (n, lo, hi) => Math.max(lo, Math.min(hi, Math.round(n || lo)));
const choice = (q, answer, others, r) => ({ q, answer, kind: 'choice', options: shuffleR([answer, ...others.filter((o) => o !== answer).slice(0, 3)], r) });

// The techniques a scene can be held with. The player learns them in the weeks named here.
export const TECH = {
  palace: { name: 'Memory palace', how: 'Put each thing at a stop on your route and make it do something to the place.', week: 5 },
  chain: { name: 'Story chain', how: 'Link each thing to the next in one running story.', week: 3 },
  peg: { name: 'Number pegs', how: 'Hang each thing on a number peg: 1 candle, 2 swan, 3 handcuffs, and so on.', week: 24 },
  major: { name: 'Major System', how: 'Turn each pair of digits into a picture with the sound code, then link the pictures.', week: 14 },
  chunk: { name: 'Chunking', how: 'Cut it into groups of 2 to 4 and say each group in a steady beat.', week: 17 },
  faces: { name: 'Face and name', how: 'Pick a feature that will not change, turn the name into a picture and press it onto that feature.', week: 9 },
  keyword: { name: 'Keyword', how: 'Find an English sound-alike for the foreign word and make it act on the meaning.', week: 22 },
};
export const TECH_IDS = Object.keys(TECH);

const GROC_ALL = GROCERY.map((g) => g[0]);
const JOBS = ['fixes bicycles', 'keeps bees', 'teaches piano', 'bakes bread', 'drives the ferry', 'mends clocks', 'grows roses', 'builds boats',
  'paints houses', 'writes crosswords', 'trains guide dogs', 'runs a bookshop', 'plays the cello', 'sells maps', 'makes cheese', 'repairs roofs'];
const LANDMARKS = ['the bakery', 'the fountain', 'the red post box', 'the library', 'the old chapel', 'the tram stop', 'the flower stall', 'the park gate',
  'the stone bridge', 'the clock tower', 'the school', 'the well', 'the apothecary', 'the statue of the lamplighter', 'the café with blue chairs', 'the market hall'];
const STOPS = ["Lamplighters' Quay", 'the Long Gallery', 'the Hall of Faces', 'the Counting House', 'the Clockwork Market', 'the Tongues Bridge',
  'the Scriptorium', 'the Tidal Stair', 'the Mirror Wards', 'the Open Roads', 'Ammerhold', 'Barrowmere'];
const CALLERS = ['the plumber', 'the dentist', 'the vet', 'the garage', 'the piano teacher', 'the optician', 'the bike shop'];
const HOUR_WORD = ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven'];
// 14:15 -> "quarter past two in the afternoon": the way a person says it on the phone.
function sayTime(t) {
  const [h, m] = t.split(':').map(Number);
  const part = h < 12 ? 'in the morning' : 'in the afternoon';
  const hw = (x) => HOUR_WORD[x % 12];
  if (m === 0) return `${hw(h)} o'clock ${part}`;
  if (m === 15) return `quarter past ${hw(h)} ${part}`;
  if (m === 30) return `half past ${hw(h)} ${part}`;
  if (m === 45) return `quarter to ${hw(h + 1)} ${part}`;
  if (m < 30) return `${m} minutes past ${hw(h)} ${part}`;
  return `${60 - m} minutes to ${hw(h + 1)} ${part}`;
}
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const INGREDIENTS = [['flour', 'g', [150, 450, 50]], ['sugar', 'g', [50, 200, 25]], ['butter', 'g', [50, 250, 25]], ['eggs', '', [1, 4, 1]],
  ['milk', 'ml', [100, 400, 50]], ['oats', 'g', [50, 200, 25]], ['raisins', 'g', [25, 150, 25]], ['honey', 'spoons', [1, 4, 1]],
  ['yoghurt', 'g', [100, 300, 50]], ['cocoa', 'spoons', [1, 5, 1]], ['grated apple', 'g', [100, 300, 50]], ['chopped nuts', 'g', [25, 150, 25]]];
const DIGIT_WORD = ['oh', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const two = (x) => String(x).padStart(2, '0');

// A number read aloud in groups, the way people say phone numbers.
function spoken(num, groups) {
  const out = []; let i = 0;
  for (const g of groups) { out.push(num.slice(i, i + g).split('').map((d) => DIGIT_WORD[+d]).join(' ')); i += g; }
  return out.join(', ');
}

// Faces for the party: a seed whose drawn face suits the name (same rule as the Names-and-Faces drill).
function faceSeed(r, name) {
  const want = NAME_PRES[name] || 'n';
  for (let i = 0; i < 40; i++) { const s = Math.floor(r() * 1e9); if (want === 'n' || faceParams(s).presentation === want) return s; }
  return Math.floor(r() * 1e9);
}

export const SCENARIOS = [
  {
    id: 'sc-shop', title: 'A favour from next door', skill: 'linking', fit: ['chain', 'palace', 'peg'], from: 3,
    build(r, n) {
      const k = clampN(n, 6, 12);
      const items = sampleR(GROC_ALL, k, r);
      const who = pick(NAMES, r);
      const plural = items.map((_, i) => i).filter((i) => /s$/.test(items[i]) && !/ss$/.test(items[i]));
      const qi = sampleR(plural.length >= 2 ? plural : items.map((_, i) => i), 2, r);
      const qty = Object.fromEntries(qi.map((i) => [i, int(r, 2, 6)]));
      // Ordinary chatter between the things, so spotting what to keep is part of the job.
      const lead = ['oh, and ', 'then ', 'also ', 'some ', 'and maybe '];
      const said = items.map((it, i) => `${i === k - 1 ? 'and finally ' : i > 0 && r() < 0.3 ? pick(lead, r) : ''}${qty[i] ? `${qty[i]} ` : ''}${it}`).join(', ');
      // lures never share a word with something on the list (corn and frozen corn would both look right)
      const words = new Set(items.flatMap((x) => x.split(' ')));
      const outside = GROC_ALL.filter((g) => !items.includes(g) && !g.split(' ').some((w) => words.has(w)));
      const lure = pick(outside, r);
      const lures3 = sampleR(outside, 3, r);
      const [a, b] = sampleR(Array.from({ length: k - 1 }, (_, i) => i), 2, r);
      const qn = qi[0];
      return {
        frame: `${who} leans over the fence as you head out. "Since you are going to the market, could you pick up a few things for me?"`,
        present: 'prose', body: [`"I need ${said}. That is everything. Thank you so much!"`],
        keys: items,
        questions: [
          { q: 'What was the first thing on the list?', answer: items[0] },
          { q: `What came right after ${items[a]}?`, answer: items[a + 1] },
          { q: `What came right after ${items[b]}?`, answer: items[b + 1] },
          { q: `How many ${items[qn]} did ${who} want?`, answer: String(qty[qn]), kind: 'number' },
          { q: 'What was the last thing on the list?', answer: items[k - 1] },
          choice('Which of these was NOT on the list?', lure, sampleR(items, 3, r), r),
          { q: 'How many different things were on the list?', answer: String(k), kind: 'number' },
        ],
        probe: [
          { q: `What came just before ${items[k - 1]}?`, answer: items[k - 2] },
          { q: 'What was the second thing on the list?', answer: items[1] },
          { q: `How many ${items[qi[1]]} did ${who} want?`, answer: String(qty[qi[1]]), kind: 'number' },
          choice('Which of these WAS on the list?', items[int(r, 2, k - 2)], lures3, r),
        ],
      };
    },
  },
  {
    id: 'sc-way', title: 'Directions from a stranger', skill: 'linking', fit: ['chain', 'palace'], from: 3,
    build(r, n) {
      const legs = clampN(n / 2, 4, 7);
      const lm = sampleR(LANDMARKS, legs + 1, r);
      const turns = Array.from({ length: legs }, () => pick(['left', 'right', 'straight on'], r));
      const how = (t) => (t === 'straight on' ? 'go straight on' : `turn ${t}`);
      const lines = [`"Start at ${lm[0]}."`];
      for (let i = 0; i < legs; i++) lines.push(`"At ${lm[i]}, ${how(turns[i])}, and keep going until you reach ${lm[i + 1]}."`);
      lines.push(`"${lm[legs][0].toUpperCase()}${lm[legs].slice(1)} is where you will find the ferry office. You can't miss it."`);
      const i1 = int(r, 0, legs - 1), i2 = (i1 + 1 + int(r, 0, legs - 2)) % legs;
      const opts = ['left', 'right', 'straight on'];
      return {
        frame: 'You ask a woman sweeping her step how to find the ferry office. She points with her broom and talks quickly.',
        present: 'spoken', body: lines, keys: lm,
        questions: [
          choice(`At ${lm[i1]}, which way do you go?`, turns[i1], opts, r),
          choice(`At ${lm[i2]}, which way do you go?`, turns[i2], opts, r),
          { q: `Which place comes after ${lm[i1]}?`, answer: lm[i1 + 1] },
          { q: `Which place comes after ${lm[i2]}?`, answer: lm[i2 + 1] },
          { q: 'Where is the ferry office?', answer: lm[legs] },
          { q: 'How many places are named, counting the start and the ferry office?', answer: String(legs + 1), kind: 'number' },
        ],
        probe: [
          { q: 'Where do you start?', answer: lm[0] },
          { q: `Which place comes just before ${lm[legs]}?`, answer: lm[legs - 1] },
          choice(`At ${lm[0]}, which way do you go?`, turns[0], opts, r),
        ],
      };
    },
  },
  {
    id: 'sc-party', title: 'Names at a garden party', skill: 'faces', fit: ['faces'], from: 10,
    build(r, n) {
      const m = clampN(n / 2, 3, 6);
      const names = sampleR(NAMES, m, r);
      const jobs = sampleR(JOBS, m, r);
      const people = names.map((name, i) => ({ name, job: jobs[i], face: faceSeed(r, name) }));
      const shown = shuffleR(people, r);
      const j = shuffleR(people, r);
      const otherJobs = JOBS.filter((x) => !jobs.includes(x));
      return {
        frame: 'A friend takes you round a garden party. Everyone shakes your hand and tells you one thing about themselves.',
        present: 'cards', body: people.map((p) => ({ face: p.face, name: p.name, line: `"Hello, I'm ${p.name}. I ${p.job}."` })), keys: names,
        questions: [
          ...shown.slice(0, Math.min(3, m)).map((p) => ({ q: 'What is this person called?', answer: p.name, face: p.face })),
          choice(`What does ${j[0].name} do?`, j[0].job, [...jobs, ...otherJobs], r),
          choice(`Who ${j[1].job}?`, j[1].name, names, r),
        ],
        probe: [
          ...shuffleR(people, r).slice(0, Math.min(3, m)).map((p) => ({ q: 'You see this person again the next day. What is their name?', answer: p.name, face: p.face })),
          choice(`What does ${j[2 % m].name} do?`, j[2 % m].job, [...jobs, ...otherJobs], r),
        ],
      };
    },
  },
  {
    id: 'sc-voicemail', title: 'Two voicemails', skill: 'numbers', fit: ['major', 'chunk'], from: 18,
    build(r) {
      const [c1, c2] = sampleR(CALLERS, 2, r);
      // Number ranges set aside for drama and fiction, so no real person can be reached by mistake.
      const n1 = `07700900${String(int(r, 0, 999)).padStart(3, '0')}`, n2 = `01632960${String(int(r, 0, 999)).padStart(3, '0')}`;
      const d1 = pick(DAYS, r), d2 = pick(DAYS.filter((d) => d !== d1), r);
      const t1 = `${int(r, 9, 16)}:${two(pick([0, 10, 15, 20, 30, 40, 45, 50], r))}`;
      let t2 = t1;
      while (t2 === t1) t2 = `${int(r, 9, 16)}:${two(pick([0, 5, 15, 25, 30, 35, 45, 55], r))}`;
      return {
        frame: 'Your phone shows two voicemails. You have no pen. Listen once and keep what matters.',
        present: 'spoken',
        body: [
          `First message: "Hello, this is ${c1}. Your appointment is on ${d1} at ${sayTime(t1)}. If that does not suit you, call me on ${spoken(n1, [5, 3, 3])}."`,
          `Second message: "Hi, it's ${c2}. We can see you on ${d2} at ${sayTime(t2)}. My number is ${spoken(n2, [5, 3, 3])}. Thanks!"`,
        ],
        keys: [n1.slice(-3), n2.slice(-3)],
        questions: [
          { q: `What is the phone number for ${c1}?`, answer: n1, kind: 'digits' },
          { q: `What are the last four digits of the number for ${c2}?`, answer: n2.slice(-4), kind: 'digits' },
          choice(`Which day is the appointment with ${c1}?`, d1, DAYS, r),
          { q: `What time is the appointment with ${c2}?`, answer: t2, kind: 'time' },
          { q: `What time is the appointment with ${c1}?`, answer: t1, kind: 'time' },
        ],
        probe: [
          { q: `What is the phone number for ${c2}?`, answer: n2, kind: 'digits' },
          { q: `What are the first three digits of the number for ${c1}?`, answer: n1.slice(0, 3), kind: 'digits' },
          choice(`Which day is the appointment with ${c2}?`, d2, DAYS, r),
        ],
      };
    },
  },
  {
    id: 'sc-tram', title: 'The tram board', skill: 'numbers', fit: ['major', 'palace'], from: 20,
    build(r, n) {
      const rows = clampN(n / 2, 4, 6);
      const dest = sampleR(STOPS, rows, r);
      let mins = int(r, 7 * 60, 9 * 60);
      const board = dest.map((d) => { mins += int(r, 6, 23); return { d, time: `${Math.floor(mins / 60)}:${two(mins % 60)}`, plat: String(int(r, 1, 9)) }; });
      const [a, b, c] = sampleR(board, 3, r);
      return {
        frame: 'The tram board at the Archive flickers. Your friends will text you later asking when their trams leave.',
        present: 'table', body: board.map((x) => [x.d, x.time, `Platform ${x.plat}`]), keys: board.map((x) => x.time.replace(':', '')),
        questions: [
          { q: `When does the tram to ${a.d} leave?`, answer: a.time, kind: 'time' },
          { q: `Which platform for the tram to ${a.d}?`, answer: a.plat, kind: 'number' },
          { q: `When does the tram to ${b.d} leave?`, answer: b.time, kind: 'time' },
          { q: `Which platform for the tram to ${c.d}?`, answer: c.plat, kind: 'number' },
          choice(`Which tram leaves at ${c.time}?`, c.d, dest, r),
          choice('Which tram leaves last?', board[rows - 1].d, dest, r),
        ],
        probe: [
          { q: `When does the tram to ${c.d} leave?`, answer: c.time, kind: 'time' },
          { q: `Which platform for the tram to ${b.d}?`, answer: b.plat, kind: 'number' },
          choice('Which tram leaves first?', board[0].d, dest, r),
        ],
      };
    },
  },
  {
    id: 'sc-recipe', title: "Grandmother's oat cake", skill: 'linking', fit: ['chain', 'peg'], from: 5,
    build(r, n) {
      const k = clampN(n / 2, 4, 7);
      const oats = INGREDIENTS.find((x) => x[0] === 'oats');
      const ing = shuffleR([oats, ...sampleR(INGREDIENTS.filter((x) => x !== oats), k - 1, r)], r).map(([name, unit, [lo, hi, st]]) => ({ name, unit, qty: lo + st * int(r, 0, Math.round((hi - lo) / st)) }));
      const temp = pick([160, 170, 180, 190], r), mins = pick([20, 25, 30, 35, 40, 45], r);
      const one = (x) => x.qty === 1;
      const unitWord = (x) => (one(x) ? x.unit.replace(/s$/, '') : x.unit);
      const noun = (x) => (one(x) && x.name === 'eggs' ? 'egg' : x.name);
      const amt = (x) => (x.unit === 'g' || x.unit === 'ml' ? `${x.qty}${x.unit} of ${x.name}` : x.unit ? `${x.qty} ${unitWord(x)} of ${x.name}` : `${x.qty} ${noun(x)}`);
      const howMuch = (x) => (x.unit === 'g' ? `How many grams of ${x.name}?` : x.unit === 'ml' ? `How many millilitres of ${x.name}?` : x.unit ? `How many ${x.unit} of ${x.name}?` : `How many ${x.name}?`);
      const lines = ing.map((x, i) => `${i === 0 ? 'Start with' : pick(['Add', 'Stir in', 'Mix in', 'Fold in'], r)} ${amt(x)}.`);
      lines.push(`Bake for ${mins} minutes at ${temp} degrees.`);
      const [p1, p2] = sampleR(ing, 2, r);
      const a = int(r, 0, k - 2);
      const lure = pick(INGREDIENTS.map((x) => x[0]).filter((x) => x !== 'oats' && !ing.some((y) => y.name === x)), r);
      return {
        frame: 'Your grandmother tells you her oat cake recipe while you wash up. She never writes it down, and neither can you.',
        present: 'list', body: lines, keys: ing.map((x) => x.name),
        questions: [
          { q: howMuch(p1), answer: String(p1.qty), kind: 'number' },
          { q: `What goes in right after the ${ing[a].name}?`, answer: ing[a + 1].name },
          { q: 'What goes in first?', answer: ing[0].name },
          { q: 'How many minutes does it bake?', answer: String(mins), kind: 'number' },
          choice('Which of these is NOT in the recipe?', lure, ing.map((x) => x.name), r),
          { q: howMuch(p2), answer: String(p2.qty), kind: 'number' },
        ],
        probe: [
          { q: 'What goes in last?', answer: ing[k - 1].name },
          { q: 'At how many degrees does it bake?', answer: String(temp), kind: 'number' },
          { q: howMuch(ing[0]), answer: String(ing[0].qty), kind: 'number' },
        ],
      };
    },
  },
  {
    id: 'sc-menu', title: 'A menu in Spanish', skill: 'vocab', fit: ['keyword'], from: 25,
    build(r, n) {
      // Real, ordinary dishes made from words in the Spanish pool (meanings come from the pool itself).
      const MENU = [['pollo', 'arroz'], ['huevo', 'pan'], ['carne', 'cebolla'], ['queso', 'pan'], ['pollo', 'cebolla'], ['fresa', 'leche'], ['arroz', 'leche'], ['carne', 'zanahoria'], ['huevo', 'arroz']];
      const W = Object.fromEntries(V.langs.es.words.map((w) => [w.word, w]));
      const k = clampN(n / 3, 3, 4);
      const dishes = sampleR(MENU, k, r).map(([a, b]) => ({ es: `${a} con ${b}`, en: `${W[a].meaning} with ${W[b].meaning}`, price: String(int(r, 5, 14)), w: [W[a], W[b]] }));
      const words = [...new Map(dishes.flatMap((x) => x.w).map((w) => [w.word, w])).values()];
      const [w1, w2, w3] = sampleR(words, 3, r);
      const d = pick(dishes, r);
      return {
        frame: 'A small café on a holiday. The waiter tells you what the dishes are, then takes the menu away while you decide.',
        present: 'menu', body: dishes.map((x) => [x.es, x.en, `${x.price} euros`]), keys: words.map((w) => w.word),
        questions: [
          { q: `What is "${w1.word}" in English?`, answer: w1.meaning, ...(w1.alt ? { alt: w1.alt } : {}) },
          { q: `What is the Spanish word for ${w2.meaning}?`, answer: w2.word },
          { q: `How much was the ${d.en}?`, answer: d.price, kind: 'number' },
          choice(`Which dish has ${w3.meaning} in it?`, dishes.find((x) => x.w.includes(w3)).es, dishes.filter((x) => !x.w.includes(w3)).map((x) => x.es), r),
        ],
        probe: [
          { q: `What is the Spanish word for ${w1.meaning}?`, answer: w1.word },
          { q: `What is "${w3.word}" in English?`, answer: w3.meaning, ...(w3.alt ? { alt: w3.alt } : {}) },
        ],
      };
    },
  },
];

// 1.2 hard material in everyday shape: jokes worth retelling, and a board full of things you need for a test.
SCENARIOS.push(
  {
    id: 'sc-dinner', title: 'Jokes at dinner', skill: 'linking', fit: ['chain', 'palace'], from: 12,
    build(r, n) {
      const k = clampN(n / 3, 3, 4);
      const js = sampleR(JOKES, k, r);
      const teller = pick(NAMES, r);
      const lures = sampleR(JOKES.filter((j) => !js.includes(j)), 3, r).map((j) => j.a);
      return {
        frame: `${teller} tells jokes all through dinner. You want to retell the best ones tomorrow, in the same order.`,
        present: 'spoken', body: js.map((j, i) => `${i === 0 ? 'First' : i === k - 1 ? 'And the last one' : 'Then'}: "${j.q}" ... "${j.a}!"`), keys: js.map((j) => j.key[0]),
        questions: [
          ...js.map((j) => ({ q: `"${j.q}"`, answer: j.a, kind: 'joke', key: j.key })),
          choice('Which punchline did NOT come up?', lures[0], js.map((j) => j.a), r),
          { q: 'How many jokes were told?', answer: String(k), kind: 'number' },
        ],
        probe: [
          { q: 'What was the first joke? Write its punchline.', answer: js[0].a, kind: 'joke', key: js[0].key },
          { q: 'What was the last joke? Write its punchline.', answer: js[k - 1].a, kind: 'joke', key: js[k - 1].key },
          choice(`Which joke came right after "${js[0].q}"?`, js[1].q, [...js.slice(2).map((j) => j.q), ...sampleR(JOKES.filter((j) => !js.includes(j)), 2, r).map((j) => j.q)], r),
        ],
      };
    },
  },
  {
    id: 'sc-board', title: 'The teacher\'s board', skill: 'structure', fit: ['palace', 'chain', 'major'], from: 29,
    build(r, n) {
      const fs = sampleR(FORMULAS.filter((f) => f.show.length <= 6), clampN(n / 4, 2, 3), r);
      const ev = pick(DATE_SETS.flatMap((s) => s.events).filter((e) => !e.bce), r);
      const room = int(r, 2, 19), page = int(r, 12, 240);
      const body = [...fs.map((f) => `${f.name}: ${f.show.join(' ')}`), `Date to know: ${ev.year}, ${ev.label}.`, `Test on Friday in room ${room}. Revise from page ${page}.`];
      const [f1, f2] = fs;
      const b1 = pick(f1.blank, r), b2 = pick(f2.blank, r);
      const blank = (f, b) => f.show.map((t, i) => (i === b ? '___' : t)).join(' ');
      return {
        frame: 'The bell is about to ring. Your teacher fills the board and starts rubbing it out before you can copy it down.',
        present: 'list', body, keys: [f1.name, f2.name, ev.year],
        questions: [
          { q: `${f1.name}: ${blank(f1, b1)}`, answer: f1.show[b1], kind: 'formula', ...(f1.alt?.[b1] ? { alt: f1.alt[b1] } : {}) },
          { q: `${f2.name}: ${blank(f2, b2)}`, answer: f2.show[b2], kind: 'formula', ...(f2.alt?.[b2] ? { alt: f2.alt[b2] } : {}) },
          { q: `Which year was on the board (${ev.label})?`, answer: ev.year, kind: 'number' },
          { q: 'Which room is the test in?', answer: String(room), kind: 'number' },
          { q: 'Which page do you revise from?', answer: String(page), kind: 'number' },
        ],
        probe: [
          { q: `Write the whole formula for ${f1.name.toLowerCase()}.`, answer: f1.show.join(' '), alt: wholeFormulaForms(f1), kind: 'formula' },
          { q: 'Which room is the test in?', answer: String(room), kind: 'number' },
          { q: `What happened in ${ev.year}?`, answer: ev.label, kind: 'joke', key: [ev.label, ...(ev.accepts || [])] },
        ],
      };
    },
  },
);

export const SCENARIO_BY_ID = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));
export const SCENE_HONEST = 'These scenes are practice shaped like everyday life. Doing well here is a good sign, but it is still practice on Mnemos tasks, not proof of how you will do on any particular day.';

// If-then plans for carrying a technique into real life (Gollwitzer's implementation intentions).
export const CARRY_CUES = [
  { id: 'cue-shop', when: 'When I walk into a shop with a list in my head', tech: 'palace' },
  { id: 'cue-meet', when: 'When someone tells me their name', tech: 'faces' },
  { id: 'cue-way', when: 'When someone gives me directions', tech: 'chain' },
  { id: 'cue-number', when: 'When I hear a number I need later', tech: 'major' },
  { id: 'cue-word', when: 'When I meet a new word in another language', tech: 'keyword' },
  { id: 'cue-steps', when: 'When someone explains steps to me', tech: 'chain' },
];
