// Echo battle length simulation (1.1). Plays many Echo battles, the five practice scenes and the Long Vigil with simple player
// models and prints how many questions they take and about how many minutes that is. The models are assumptions, not data:
// real tuning waits for people to play. The target for an Echo battle is 5 to 8 minutes (docs/ROADMAP.md).
// Usage: npx vite-node scripts/battle-sim.mjs [battles per model]   (vite-node, because the engine imports JSX art)
import { newProfile, today } from '../src/engine/core.js';
import { addDays, rng } from '../src/engine/util.js';
import { pullEntries, newBattle, buildScene, answer, current, settle } from '../src/engine/battle.js';
import { pullVigilEntries, newVigil, settleVigil } from '../src/engine/vigil.js';
import { SCENE_ORDER } from '../src/data/echo.js';

const RUNS = +(process.argv.find((a) => /^\d+$/.test(a)) || 300);
// recall: chance of a right first answer for a fresh item; it falls with age. A retry after seeing the answer is right 90% of the time.
const MODELS = [
  { name: 'steady player', recall: 0.85, decay: 0.004 },
  { name: 'forgetful player', recall: 0.6, decay: 0.006 },
  { name: 'strong player', recall: 0.95, decay: 0.002 },
];
const SECS = { read: 6, type: 9, feedback: 4, intro: 25, studyScene: 55, result: 20 };

const WORDS = ['anchor', 'apple', 'arrow', 'basket', 'candle', 'drum', 'eagle', 'fork', 'glove', 'hammer', 'ivy', 'jar', 'kite', 'lamp'];
function profile(r, gates) {
  const p = newProfile('sim', 'key'); const t = today(p);
  p.progress.gates = gates;
  const kinds = [['pairs', 'imagery'], ['chain', 'linking'], ['vocab', 'vocab'], ['palace', 'palace'], ['major', 'numbers']];
  for (let i = 0; i < 14; i++) {
    const [tpl, skill] = kinds[i % kinds.length];
    const n = 5 + Math.floor(r() * 4);
    const age = [1, 2, 3, 7, 8, 14, 30, 45][Math.floor(r() * 8)];
    const items = Array.from({ length: n }, (_, k) => tpl === 'vocab' ? { cue: 'w' + k + i, answer: WORDS[(k + i) % WORDS.length] } : tpl === 'pairs' ? { cue: WORDS[(k + 3) % WORDS.length] + i, answer: WORDS[k % WORDS.length] + i } : tpl === 'major' ? { cue: String(10 + k), answer: WORDS[k % WORDS.length] } : { answer: WORDS[(k + i) % WORDS.length] + i });
    p.sets.push({ id: 's' + i, skill, t: tpl, spec: { t: tpl }, items, loci: tpl === 'palace' ? items.map((_, k) => 'stop' + k) : null, created: addDays(t, -age), immediate: 0.9, idx: 0, intervals: [1, 7, 30], history: [], retired: false, due: addDays(t, r() < 0.5 ? -1 : 2) });
  }
  return p;
}

// Plays a battle to its end. Returns { turns, secs, outcome, lit }.
function play(b, m, r, study = 0, wrong = []) {
  let turns = 0, secs = SECS.intro + study + SECS.result;
  let guard = 0;
  while (!b.over && guard++ < 400) {
    const e = current(b);
    if (!e) break;
    const retry = b.state[e.key].tries > 0;
    const prob = retry ? 0.9 : Math.max(0.05, m.recall - m.decay * (e.age || 0));
    const ok = r() < prob;
    answer(b, ok ? String(e.answer) : 'zzz');
    turns++; secs += SECS.read + SECS.type + SECS.feedback;
  }
  return { turns, secs, outcome: b.outcome };
}
const stat = (xs) => ({ min: Math.min(...xs), avg: xs.reduce((a, c) => a + c, 0) / xs.length, max: Math.max(...xs) });
const mins = (s) => (s / 60).toFixed(1);

export function simulate(m, runs = RUNS) {
  const r = rng(777 + Math.round(m.recall * 1000));
  const out = { echo: [], vigil: [], scenes: Object.fromEntries(SCENE_ORDER.map((id) => [id, []])), rests: 0, vigilLit: [] };
  for (let i = 0; i < runs; i++) {
    const p = profile(r, ['M1', 'M2', 'M3', 'M4']);
    const e = pullEntries(p, 1000 + i);
    if (e.length >= 3) {
      const b = newBattle(e); const res = play(b, m, r);
      out.echo.push({ ...res, items: e.length }); if (res.outcome === 'rest') out.rests++;
      settle(p, b);
    }
    const v = pullVigilEntries(p, 5000 + i);
    if (v.length >= 3) {
      const b = newVigil(v); const res = play(b, m, r);
      out.vigil.push({ ...res, items: v.length });
      out.vigilLit.push(b.entries.filter((x) => ['held', 'eased'].includes(b.state[x.key].status)).length / b.entries.length);
      settleVigil(p, b);
    }
    for (const id of SCENE_ORDER) {
      const sc = buildScene(id, 9000 + i, p);
      const b = newBattle(sc.entries, { scene: id }); const res = play(b, { ...m, decay: 0, recall: Math.min(0.9, m.recall) }, r, sc.studySeconds + (sc.distraction ? 15 : 0));
      out.scenes[id].push(res);
    }
  }
  return out;
}

const line = (label, xs) => {
  const t = stat(xs.map((x) => x.turns)), s = stat(xs.map((x) => x.secs));
  return `  ${label.padEnd(22)} questions ${t.avg.toFixed(1)} (${t.min} to ${t.max}), about ${mins(s.avg)} min (${mins(s.min)} to ${mins(s.max)})`;
};
{
  console.log(`Echo battle length simulation, ${RUNS} battles per model (assumed pace: about ${SECS.read + SECS.type + SECS.feedback} seconds a question)`);
  for (const m of MODELS) {
    const o = simulate(m);
    console.log(`\n${m.name}`);
    console.log(line('Echo battle', o.echo) + `, rests ${(100 * o.rests / o.echo.length).toFixed(0)}%`);
    console.log(line('Long Vigil', o.vigil) + `, lanterns lit ${(100 * o.vigilLit.reduce((a, c) => a + c, 0) / o.vigilLit.length).toFixed(0)}%`);
    for (const id of SCENE_ORDER) console.log(line(`Scene: ${id}`, o.scenes[id]));
  }
}
