// v0.10 Field Guide logic. Real-life use is self-reported, so it never gives Lumen, streaks or relics.
import { MODULES } from '../data/curriculum.js';
import { REAL_TRIES } from '../data/fieldguide.js';

export const NUDGE_SNOOZE_DAYS = 30;
const dayNum = (iso) => Math.floor(Date.parse(iso + 'T00:00:00Z') / 86400000);

export const gateDone = (p, mod) => (p?.progress?.gates || []).includes(mod);

// The most recent module whose gate has been passed (by curriculum order), or null.
export function latestGate(p) {
  const ids = MODULES.map((m) => m.id).filter((id) => gateDone(p, id));
  return ids.length ? ids[ids.length - 1] : null;
}

// At most one nudge: the real-life task for the latest gate, if it was not tried and not put off in the last 30 days.
// date = today's ISO date. Callers show it only after the day's session is finished, never inside study or recall.
export function pendingNudge(p, date) {
  const gate = latestGate(p);
  if (!gate) return null;
  const t = REAL_TRIES.find((x) => x.unlock === gate);
  if (!t) return null;
  const g = p.guide || {};
  if (g.tried?.[t.id]) return null;
  const later = g.later?.[t.id];
  if (later && dayNum(date) - dayNum(later) < NUDGE_SNOOZE_DAYS) return null;
  return t;
}
