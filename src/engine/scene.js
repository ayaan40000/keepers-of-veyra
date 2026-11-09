// 1.2 Real-life scenes, the technique ladder and "Carry it". Pure logic; the screen is src/ui/SceneDrill.jsx.
//
// The ladder (per technique), stored as p.ladder[tech] = { rung, hist: [acc...] }:
//   1 worked example: the first scene for a technique shows one being built, step by step
//   2 guided: the technique is named and a short how-to is shown during study
//   3 on your own: the technique is named, no how-to
//   4 choose it yourself: the scene arrives without a label and you pick the technique before you study
// A scene result moves the ladder: up after good scores, down one rung after two weak ones (never below 2).
// Rewards and skill estimates come only from the answers being right, never from the pick or the plan.
import { SCENARIOS, SCENARIO_BY_ID, TECH } from '../data/scenarios.js';
import { matches, normalize, mean, addDays, daysBetween } from './util.js';
import { formulaOk, jokeOk } from './abstract.js';

export const SCENE_SPEC = (sc, extra = {}) => ({ t: 'scene', n: 10, s: 90, sc, skill: SCENARIO_BY_ID[sc]?.skill, ...extra });

// ---------- building ----------
export function sceneItems(spec, r) {
  const tpl = SCENARIO_BY_ID[spec.sc] || SCENARIOS[Math.floor(r() * SCENARIOS.length)];
  const b = tpl.build(r, spec.n || 10);
  return {
    items: b.questions,
    extra: { scene: { id: tpl.id, title: tpl.title, frame: b.frame, present: b.present, body: b.body, fit: tpl.fit, keys: b.keys || [] }, probe: b.probe },
  };
}

// ---------- checking ----------
const digitsOnly = (s) => String(s ?? '').replace(/\D/g, '');
// Times: 7:05, 7.05, 0705 and 705 are all the same time.
const toMins = (s) => { const d = digitsOnly(s); if (!d) return null; const v = +d; return d.length <= 2 ? v * 60 : Math.floor(v / 100) * 60 + (v % 100); };
// A time matches in 24-hour form or the same time on a 12-hour clock (4:45 for 16:45).
const sameTime = (a, b) => { const x = toMins(a), y = toMins(b); return x != null && y != null && (x === y || x + 720 === y || x === y + 720); };
const bare = (s) => String(s ?? '').trim().replace(/^(the|a|an)\s+/i, '');
export function sceneAnswerOk(resp, it) {
  const r = String(resp ?? '').trim();
  if (!r) return false;
  switch (it.kind) {
    case 'number': return digitsOnly(r) !== '' && +digitsOnly(r) === +digitsOnly(it.answer);
    case 'digits': return digitsOnly(r) === digitsOnly(it.answer);
    case 'time': return sameTime(r, it.answer);
    case 'choice': return normalize(r) === normalize(it.answer);
    case 'formula': return formulaOk(r, it);
    case 'joke': return jokeOk(r, it);
    default: return [it.answer, ...(it.alt || [])].some((a) => matches(r, a) || matches(bare(r), bare(a)));
  }
}

export function scoreScene(items, responses) {
  const errs = { omission: 0, substitution: 0, order: 0, timeout: 0 };
  const perItem = items.map((it, i) => {
    const resp = String((responses || [])[i] ?? '').trim();
    const ok = sceneAnswerOk(resp, it);
    if (!ok) errs[resp ? 'substitution' : 'omission']++;
    return { target: it.answer, response: resp, ok, ...(ok ? {} : { err: resp ? 'substitution' : 'omission' }) };
  });
  const correct = perItem.filter((x) => x.ok).length;
  return { n: items.length, correct, acc: items.length ? correct / items.length : 0, errs, perItem };
}

// ---------- the ladder ----------
export const rungOf = (p, tech) => p?.ladder?.[tech]?.rung || 1;
export const mainTech = (sc) => SCENARIO_BY_ID[sc]?.fit?.[0] || 'chain';

// How a scene is shown to this player: worked example, guided, named, or choose-it-yourself.
export function sceneMode(p, sc, weekNo, forceChoose = false) {
  const rung = rungOf(p, mainTech(sc));
  if (forceChoose || weekNo >= 40 || rung >= 4) return 'choose';
  return rung <= 1 ? 'worked' : rung === 2 ? 'guided' : 'named';
}

export function updateLadder(p, tech, acc) {
  if (!p.ladder || typeof p.ladder !== 'object') p.ladder = {};
  const L = p.ladder[tech] || { rung: 1, hist: [] };
  L.hist = [...(L.hist || []), Math.round(acc * 100) / 100].slice(-6);
  const last2 = L.hist.slice(-2);
  const before = L.rung;
  if (L.rung === 1) L.rung = 2;
  else if (L.rung === 2 && acc >= 0.7) L.rung = 3;
  else if (L.rung === 3 && last2.length === 2 && last2.every((a) => a >= 0.8)) L.rung = 4;
  else if (L.rung >= 3 && last2.length === 2 && last2.every((a) => a < 0.5)) L.rung = Math.max(2, L.rung - 1);
  p.ladder[tech] = L;
  return { from: before, to: L.rung };
}

// Was the technique the player picked one that fits this kind of material? (coaching only, never scored)
export function pickFits(sc, pick) {
  const fit = SCENARIO_BY_ID[sc]?.fit || [];
  return { ok: fit.includes(pick), best: fit[0], fit };
}
export const SELECTION_COACH = (sc, pick) => {
  const f = pickFits(sc, pick);
  if (!pick) return null;
  if (f.ok) return `${TECH[pick].name} suits this well.`;
  return `${TECH[pick].name} can work, but ${TECH[f.best].name.toLowerCase()} usually fits this kind of material better. Ask yourself first: is it in order, is it numbers, is it a person, is it a foreign word? That answer picks the tool.`;
};

// A worked example built from the scene's own material (rung 1).
export function workedExample(tech, keys) {
  const [a, b, c] = keys;
  if (!a) return null;
  switch (tech) {
    case 'palace': return `Watch one being built. Stop one, your front door: ${a}, jammed in the letterbox so the door will not shut. Stop two, the doormat: ${b || 'the next thing'}, squelching under your feet. Stop three, the coat hook: ${c || 'the next thing'}, swinging from it. Now you place the rest the same way.`;
    case 'chain': return `Watch one being built. Picture ${a} crashing down onto ${b || 'the next thing'}, bursting it open, and the whole mess rolling into ${c || 'the next thing'}. Each picture does something to the next one. Now you carry the story on.`;
    case 'peg': return `Watch one being built. Peg 1 is a candle: its flame sets ${a} smoking. Peg 2 is a swan: it swims off with ${b || 'the next thing'} in its beak. Now you hang the rest.`;
    case 'major': return `Watch one being built. Take the first digits, ${a}. Say them in the sound code and see your picture for them. Do the same with ${b || 'the next digits'}, then make the first picture act on the second. Now carry on the same way.`;
    case 'faces': return `Watch one being built. Look at the first face and pick one feature that will not change: the nose, the brows, the jaw. Turn ${a} into a picture, anything it sounds like, and press that picture onto the feature. Now you do the rest.`;
    case 'keyword': return `Watch one being built. Say ${a} out loud twice. Find an English word it sounds like, then make that picture act on the meaning. Now you do the rest.`;
    default: return null;
  }
}

// ---------- choosing today's scene ----------
// A full session from week 2 gets one scene, rotating through the ones the player has learned the tools for.
export const SCENE_FROM_WEEK = 3;
export function sceneFor(p, weekNo, day) {
  const open = SCENARIOS.filter((s) => s.from <= weekNo);
  if (!open.length) return null;
  return open[Math.abs(day) % open.length].id;
}

// ---------- Carry it ----------
// The player may set one if-then plan and type the real things they will keep (up to 10). The next day, and a
// week later, Mnemos asks for those things back. Only a correct recall counts as "held". No Lumen, no streak.
export const CARRY_DELAYS = [1, 7];
export function addCarry(p, cue, tech, things, date) {
  if (!p.habits || typeof p.habits !== 'object') p.habits = { plans: [], carry: [] };
  const list = things.map((x) => String(x).trim().slice(0, 120)).filter(Boolean).slice(0, 10);
  if (cue) p.habits.plans = [...(p.habits.plans || []), { cue: String(cue).slice(0, 80), tech, made: date }].slice(-20);
  if (!list.length) return null;
  const c = { id: `c${date}-${(p.habits.carry || []).length}`, cue: cue || null, tech: tech || null, things: list, made: date, due: addDays(date, CARRY_DELAYS[0]), idx: 0, checks: [] };
  p.habits.carry = [...(p.habits.carry || []), c].slice(-30);
  return c;
}
export const dueCarry = (p, today) => (p?.habits?.carry || []).filter((c) => c.idx < CARRY_DELAYS.length && c.due <= today);
export function checkCarry(p, id, responses, today) {
  const c = (p.habits?.carry || []).find((x) => x.id === id);
  if (!c) return null;
  const used = new Set();
  let got = 0;
  for (const thing of c.things) {
    const at = responses.findIndex((x, k) => !used.has(k) && matches(x, thing));
    if (at >= 0) { used.add(at); got++; }
  }
  const acc = got / c.things.length;
  const delay = daysBetween(c.made, today);
  c.checks.push({ date: today, delay, acc });
  c.idx++;
  if (c.idx < CARRY_DELAYS.length) c.due = [addDays(c.made, CARRY_DELAYS[c.idx]), addDays(today, 1)].sort().pop();
  return { got, of: c.things.length, acc, delay, held: acc >= 0.8 };
}
// "Situations where the method held": real-life lists recalled at 80 percent or better, by delay.
export function carryHeld(p) {
  const checks = (p?.habits?.carry || []).flatMap((c) => c.checks);
  return { day1: checks.filter((x) => x.delay >= 1 && x.delay < 7 && x.acc >= 0.8).length, day7: checks.filter((x) => x.delay >= 7 && x.acc >= 0.8).length, tries: checks.length };
}

// The honest transfer score: scenes (chosen and real-life shaped) and next-day questions asked in a new form.
export function transferResults(results) {
  return results.filter((r) => r.t === 'scene' || (r.role === 'probe' && r.flip));
}
export const transferScore = (rs) => (rs.length ? 100 * mean(rs.map((r) => r.acc)) : null);
