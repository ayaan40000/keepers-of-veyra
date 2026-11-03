// 1.1 Phantom Limb and the Mirror Room: pure logic. STORY AND DISPLAY ONLY. When the mist is up, the Character sheet shows "?"
// instead of the attribute numbers. Nothing is lost, no score is lowered, relighting adds no damage and changes nothing in a
// battle. The Mirror Room practises the Major System on harmless numbers. It never changes skill estimates.
import { MIRROR_ATTRS, MIRROR_ORDER } from '../data/mirror.js';
import { TRIALS } from '../data/trials.js';
import { trialState } from './trials.js';
import { sessionStatus } from './session.js';
import { majorDecode } from './util.js';
import { today } from './core.js';

// The Major System is taught in Month 4, so the mist (and the room that clears it) starts once that gate is passed.
export const MIRROR_GATE = 'M4';
export const mirrorOpen = (p) => (p?.progress?.gates || []).includes(MIRROR_GATE);

// Thick Mist: a District Trial is under way (started, waiting for its check), or the day's session is a gate (a boss moment).
// The episode names this stretch of mist, so relit mirrors reset when a new one comes.
export function mistState(p, date = today(p)) {
  if (!mirrorOpen(p)) return { up: false, why: null, episode: null };
  for (const id of Object.keys(TRIALS)) {
    if (TRIALS[id].kind !== 'trial') continue;
    const st = trialState(p, id, date);
    if (st === 'waiting' || st === 'due') return { up: true, why: 'trial', episode: `trial:${id}:${p.trials[id].start}` };
  }
  const ss = sessionStatus(p);
  if (!ss.doneToday && ss.type === 'gate') return { up: true, why: 'boss', episode: `gate:${ss.mod.id}:${date}` };
  return { up: false, why: null, episode: null };
}

export const litSkills = (p, episode) => (p?.mirror?.episode === episode && episode ? Object.keys(p.mirror.lit || {}) : []);

// Any word whose consonant sounds give the code is right. Returns { ok, ... } and relights the attribute when right.
export function relight(p, skill, response, episode) {
  const a = MIRROR_ATTRS[skill];
  if (!a || !String(response || '').trim()) return null;
  const ok = majorDecode(response) === a.code;
  if (ok && episode) {
    if (!p.mirror || typeof p.mirror !== 'object') p.mirror = { episode: null, lit: {} };
    if (p.mirror.episode !== episode) p.mirror = { episode, lit: {} };
    p.mirror.lit[skill] = today(p);
  }
  return { ok, example: a.example, sounds: a.sounds };
}
export { MIRROR_ORDER };
