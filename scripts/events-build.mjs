// Builds the Event Hall and trial data files in src/data/add/ from the checked drafts in docs/drafts/additions/.
// Run: node scripts/events-build.mjs   (only needed when a draft changes; the output is committed with the app)
// Like additions-build.mjs it keeps just the fields the game uses and refuses any em or en dash.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dr = (f) => JSON.parse(fs.readFileSync(path.join(root, 'docs/drafts/additions', f), 'utf8'));
const out = path.join(root, 'src/data/add');
const write = (name, data) => {
  const s = JSON.stringify(data);
  if (/[\u2014\u2013]/.test(s)) throw new Error(`dash in ${name}`);
  fs.writeFileSync(path.join(out, name + '.json'), s + '\n');
  console.log(name, (s.length / 1024).toFixed(1) + ' KB');
};

// E: dates (Hall of Years trial, Year Round) and trivia (Fact Round)
const da = dr('E/dates.json');
write('dates', da.sets.map((s) => ({ id: s.id, title: s.title, intro: s.intro, events: s.events.map((e) => ({ year: e.year, bce: !!e.bce, text: e.text, label: e.label, accepts: e.accepts || [] })) })));
const tv = dr('E/trivia.json');
write('trivia', tv.items.map((i) => ({ id: i.id, cat: i.cat, level: i.level, q: i.q, a: i.a, accepts: i.accepts || [] })));

// E: Mental Reckoning trial material (number facts to hold)
const sm = dr('E/speedmath.json');
const exact = new Set(['k-inch', 'k-foot', 'k-mile', 'k-g', 'k-zero', 'k-impgal']);
write('reckon', {
  squares: sm.tables.squares.filter((x) => x.n >= 21).map((x) => [x.n, x.square]),
  constants: sm.constants.filter((c) => exact.has(c.id)).map((c) => ({ cue: c.cue, answer: c.answer })),
  honest: sm.honest,
});

// D: Event Hall copy, one entry per event (the D draft calls the face event "faces")
const ev = dr('D/events.json');
const pick = (e) => ({ name: e.ourName, trains: e.trains, how: e.howItWorks, ours: e.ourVersion, rules: e.rules, study: e.instructions.study, recall: e.instructions.recall, scoring: e.scoring, advice: e.advice, honest: e.honest, ladder: e.ladder.map((l) => l.size) });
write('eventcopy', {
  hall: { practiceOnly: ev.hall.practiceOnly, ladderOnly: ev.hall.ladderOnly, paceText: ev.hall.paceMode.text, eliminationEnd: ev.hall.eliminationEnd, honest: ev.hall.honest, advice: ev.hall.generalAdvice, ladderHonest: ev.hall.ladderWording.honestPersonalBest },
  events: Object.fromEntries(ev.events.map((e) => [e.id, pick(e)])),
});
