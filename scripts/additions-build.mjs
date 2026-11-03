// Builds the compact data files in src/data/add/ from the checked drafts in docs/drafts/additions/.
// Run: node scripts/additions-build.mjs   (only needed when a draft changes; the output is committed with the app)
// It keeps just the fields the game uses, so the offline build stays small, and refuses any em or en dash.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dr = (f) => JSON.parse(fs.readFileSync(path.join(root, 'docs/drafts/additions', f), 'utf8'));
const out = path.join(root, 'src/data/add');
fs.mkdirSync(out, { recursive: true });
const write = (name, data) => {
  const s = JSON.stringify(data);
  if (/[\u2014\u2013]/.test(s) && name !== 'poems') throw new Error(`dash in ${name}`);
  fs.writeFileSync(path.join(out, name + '.json'), s + '\n');
  console.log(name, (s.length / 1024).toFixed(1) + ' KB');
};

// A: lesson cards and Masters' Notes
const la = dr('A/lessons-add.json');
write('lessons', { cards: la.lessons.map((l) => ({ id: l.id, week: l.week, at: l.at, text: l.text })), week24: la.week24.cards.map((c) => c.text) });
write('masters', dr('A/masters-add.json').masters.map((m) => ({ id: m.id, unlock: m.unlock, title: m.title, idea: m.idea, tryIt: m.tryIt, why: m.why, spec: m.spec, drill: m.drill })));

// B: practice material
const pegs = dr('B/pegs.json');
write('pegs', { shape: pegs.shape.map((x) => x.word), rhyme: pegs.rhyme.map((x) => x.word), honest: pegs.honestLimit });
const sa = dr('B/soundalikes.json');
write('soundalikes', { entries: Object.fromEntries(sa.entries.map((e) => [e.word, [e.soundalike, e.picture]])), homophones: sa.homophones.map((h) => [h.a, h.b]), honest: sa.honestLimit });
write('grocery', dr('B/grocery.json').items.map((i) => (i.reservedFor ? [i.item, 1] : [i.item])));
write('steps', dr('B/steps.json').procedures.map((p) => ({ id: p.id, title: p.title, steps: p.steps.map((s) => [s.text, s.key]) })));
write('points', dr('B/points.json').talks.map((p) => ({ id: p.id, title: p.title, points: p.points.map((s) => [s.text, s.key]) })));
const sn = dr('B/surnames.json');
write('surnames', { surnames: sn.surnames.map((s) => s.name), avoid: sn.avoid });
const mt = dr('B/maps-topic.json');
write('maps', { honest: mt.honestLimit, maps: mt.maps.map((m) => ({ id: m.id, title: m.title, center: m.center, branches: m.branches })) });
const sk = dr('B/skim-texts.json');
write('skim', { honest: sk.honestLimit, texts: sk.texts.map((t) => ({ id: t.id, title: t.title, headings: t.headings, text: t.text, keyPoints: t.keyPoints, candidates: t.candidates, keywords: t.keywords })) });
const uc = dr('B/unit-checks.json');
write('unitchecks', uc.checks.map((c) => ({ unit: c.unit, title: c.title, instructions: c.instructions, forms: c.forms })));
write('numbered', dr('B/wordlists-numbered.json').lists.map((l) => ({ id: l.id, words: l.words.map((w) => w.word) })));

// C: poems, cards, guest sheets
const po = dr('C/poems.json');
write('poems', { poems: po.poems.map((p) => ({ id: p.id, title: p.title, author: p.author, lines: p.lines, difficulty: p.difficulty, origin: p.origin, ...(p.variants && Object.keys(p.variants).length ? { variants: p.variants } : {}) })), learn: Object.fromEntries(Object.entries(po.learnExamples).map(([k, v]) => [k, v.text])) });
const ci = dr('C/card-images.json');
const df = dr('C/deck-formats.json');
write('cards', { rule: { name: ci.rule.name, text: ci.rule.threeSentences, plan: ci.rule.learningPlan }, images: Object.fromEntries(ci.cards.map((c) => [c.card, c.image])), own: ci.makeYourOwn, codes: ci.cardCodes, guide: ci.deckRunGuide, ladder: df.ladder, deckRun: df.deckRun, doubleDeck: df.doubleDeck, dayPlan: df.dayPlan, plain: df.plainText });
const sp = dr('C/strikes-people.json');
write('strikes', { levels: sp.levels, sheets: sp.sheets.map((s) => ({ id: s.id, title: s.title, keys: s.keys, people: s.people })) });

// D: worksheets, Your Methods, toolbox
write('worksheets', dr('D/worksheets.json').worksheets.map((w) => ({ id: w.id, title: w.title, intro: w.intro, howTo: w.howTo, lines: w.lines, examples: w.examples, honest: w.honest })));
const ym = dr('D/your-methods.json');
const { notes, ...ymKeep } = ym; delete ymKeep.sourceUrls; delete ymKeep.verified;
write('yourmethods', ymKeep);
write('toolbox', dr('D/fieldguide-add.json').toolbox);

// E: study pools and the Mental Reckoning drill
const ep = dr('E/pools.json');
write('pools', {
  elements: { items: ep.elements.items.map((x) => [x.number, x.name, x.symbol]), honest: ep.elements.honest },
  roots: { items: ep.roots.items.map((x) => [x.root, x.meaning]), honest: ep.roots.honest },
  atlas: { items: ep.atlas.items.map((x) => [x.country, x.capital, x.accepts || []]), honest: ep.atlas.honest },
  music: { items: ep.music.items.map((x) => [x.cue, x.answer]), honest: ep.music.honest },
  chess: { items: ep.chess.items.map((x) => [x.name, x.moves]), honest: ep.chess.honest, notation: ep.chess.notation },
  body: { nerves: ep.body.cranialNerves.map((x) => [x.roman, x.name]), carpals: ep.body.carpalBones.map((x) => x.name), honest: ep.body.honest, edge: ep.body.edge },
});
const sm = dr('E/speedmath.json');
write('speedmath', { verdict: sm.honestVerdict, honest: sm.honest, levels: sm.drill.levels });

// D and E: Field Guide playbooks (no sources or builder keys). 'talk' replaces the text of the existing page of that id.
const keepPb = (p) => ({ id: p.id, ...(p.replaces ? { replaces: p.replaces } : {}), unlock: p.unlock, title: p.title, months: p.months, intro: p.intro, example: p.example, steps: p.steps, review: p.review, caveat: p.caveat });
const pbs = [...dr('D/fieldguide-add.json').playbooks, ...dr('E/fieldguide-e.json').playbooks].map(keepPb);
// Part 5 wording fixes: the draft said Your Own Text never earns Lumen; the owner allowed one small capped exception (DECISIONS.md).
const own = pbs.find((p) => p.id === 'ownText');
own.intro = own.intro.replace('a verse, a poem, a speech, lines in a play.', 'a verse, a poem, a speech, lines in a play (with Role mode, you learn your own part and the other parts are shown as cues).');
own.caveat = 'Your text stays on this device and is in your backup. Checks here never change your skills. Only a typed check that holds after a week or more earns a little Lumen, once for each check and inside the daily practice limit, because only you can tell whether your text was right. Pictures are optional. If you learn better by sound and repetition, skip them.';
write('fieldguide', pbs);
