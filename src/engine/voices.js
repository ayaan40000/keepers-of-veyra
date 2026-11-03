// 1.1 Cabinet of Voices: pure logic. Derived from data the game already keeps (error counts, due reviews), so nothing is saved
// except the Voices setting (prefs.voices: off, light, full; default light). Voices give technique hints, never contents,
// and no rewards. They speak on the Character page, on Today after a session and around an Echo battle, never during study or recall.
import { VOICES, VOICE_ORDER } from '../data/voices.js';
import { today } from './core.js';
import { hashStr } from './util.js';

export const voicesMode = (p) => { const v = p?.user?.prefs?.voices; return v === 'off' || v === 'full' ? v : 'light'; };
export const VOICE_ART = { imagery: 'voice_vision', linking: 'voice_thread', palace: 'voice_place', faces: 'voice_face', numbers: 'voice_count', vocab: 'voice_tongue', structure: 'voice_frame' };

// The slip this skill shows most (omission, substitution or order). Timeouts are not a technique problem, so they are ignored.
export function topError(p, skill) {
  const s = p?.skills?.[skill];
  if (!s) return null;
  const recent = (s.recentErrs || []).reduce((a, e) => { for (const k of ['omission', 'substitution', 'order']) a[k] += e?.[k] || 0; return a; }, { omission: 0, substitution: 0, order: 0 });
  const all = { omission: s.errs?.omission || 0, substitution: s.errs?.substitution || 0, order: s.errs?.order || 0 };
  for (const tot of [recent, all]) {
    const top = Object.entries(tot).sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] > 0) return top[0];
  }
  return null;
}

export function dueCount(p, skill) {
  const t = today(p);
  return (p?.sets || []).filter((s) => !s.retired && s.skill === skill && s.due <= t).length;
}

const pick = (list, seed) => list[hashStr(seed) % list.length];

// One voice's line for now. quiet = a review is due for this skill.
export function voiceFor(p, skill, date = today(p)) {
  const v = VOICES[skill];
  const due = dueCount(p, skill), err = topError(p, skill);
  if (due > 0) return { skill, voice: v, kind: 'quiet', due, line: pick(v.quiet, date + skill + 'q') };
  if (err && v.byError[err]) return { skill, voice: v, kind: 'error', due: 0, error: err, line: v.byError[err] };
  return { skill, voice: v, kind: 'hint', due: 0, line: pick(v.hints, date + skill + 'h') };
}
export const cabinet = (p, date) => VOICE_ORDER.map((s) => voiceFor(p, s, date));

// After a session or battle: strong, steady or rough, by accuracy. Warm in all three.
export function afterLine(skill, acc, date = '') {
  const v = VOICES[skill];
  if (!v) return null;
  const i = acc >= 0.85 ? 0 : acc >= 0.6 ? 1 : 2;
  return { skill, voice: v, line: v.after[i] };
}
// The most recent scored drill today, for the Today card.
export function lastScored(p) {
  const t = today(p);
  const r = [...(p?.results || [])].reverse().find((x) => x.date === t && x.role !== 'probe' && typeof x.acc === 'number' && VOICES[x.skill]);
  return r ? { skill: r.skill, acc: r.acc } : null;
}
