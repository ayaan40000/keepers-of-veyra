// 1.1 Wren's Audit: pure logic. Wren walks one of three invented routes aloud and makes slips; the player names the kind of slip
// (picked from the game's own error types) and fixes it. It changes no score and no skill estimate, a wrong pick costs nothing,
// and the only thing it gives is Chronolog entries (unlocked by the number of finished Audits, see codexUnlocked in quests.js).
// Wren's false-memory slip ("Added item") starts from Month 9 (owner decision).
import { AUDIT_ROUTES, AUDIT_ERROR_TYPES, AUDIT_INTRO, AUDIT_END, AUDIT_END_NO_FALSE } from '../data/audit.js';
import { MODULES } from '../data/curriculum.js';
import { matches } from './util.js';
import { today } from './core.js';

export const routeUnlocked = (p, r) => r.unlock === 'start' || (r.unlock.startsWith('gate:') && (p?.progress?.gates || []).includes(r.unlock.slice(5)));
export const auditRoutes = (p) => AUDIT_ROUTES.map((r) => ({ ...r, open: routeUnlocked(p, r) }));
export const auditOpen = (p) => AUDIT_ROUTES.some((r) => routeUnlocked(p, r));

// Month 9 has begun (its first week reached) or its gate is passed.
export function falseUnlocked(p) {
  const m9 = MODULES.find((m) => m.id === 'M9');
  const week = Math.floor(((p?.progress?.day || 1) - 1) / 7) + 1;
  return week >= m9.weeks[0] || (p?.progress?.gates || []).includes('M9') || !!p?.progress?.reviewerUnlock;
}
export const errorTypes = (p) => AUDIT_ERROR_TYPES.filter((t) => !t.unlock || falseUnlocked(p));

// The slip kind this player makes most, across all skills. Wren makes that one on purpose.
export function habitOf(p) {
  const tot = { omission: 0, substitution: 0, order: 0 };
  for (const s of Object.values(p?.skills || {})) for (const k of Object.keys(tot)) tot[k] += s?.errs?.[k] || 0;
  const top = Object.entries(tot).sort((a, b) => b[1] - a[1])[0];
  return top && top[1] > 0 ? top[0] : 'general';
}
export const introFor = (p) => AUDIT_INTRO[habitOf(p)] || AUDIT_INTRO.general;

// Turns the walk into beats. A beat is one or two lines Wren says and (if it holds a slip) what kind it was and how to fix it.
// An order slip is two walk steps, shown together as one beat. The false-memory beat is dropped before Month 9.
export function beatsFor(route, p) {
  const out = [], walk = route.walk;
  for (let i = 0; i < walk.length; i++) {
    const w = walk[i];
    if (w.type === 'false' && !falseUnlocked(p)) continue;
    if (w.type === 'order' && !w.pair) {
      const pair = walk[i + 1];
      const stop = route.stops[pair.at];
      out.push({ lines: [w.say, pair.say], type: 'order', truth: w.truth, ask: `At ${stop.stop}, what should I have said?`, answer: stop.item });
      i++;
      continue;
    }
    if (!w.type) { out.push({ lines: [w.say], type: null }); continue; }
    const stop = w.at != null ? route.stops[w.at] : null;
    out.push({
      lines: [w.say], type: w.type, truth: w.truth,
      ask: w.type === 'false' ? 'What did I add that was never on the route?' : w.type === 'omission' ? `What should have been at ${stop.stop}?` : `What should I have said at ${stop.stop}?`,
      answer: w.type === 'false' ? w.extra : stop.item,
    });
  }
  return out;
}
export const isFixed = (beat, response) => !!String(response || '').trim() && matches(response, beat.answer);
export const typeLabel = (id) => AUDIT_ERROR_TYPES.find((t) => t.id === id)?.label || id;

// Facts for the real items on a route, so each can be checked again.
export const factsFor = (route) => route.stops.filter((s) => s.real && s.fact).map((s) => s.fact);

export const endTextFor = (p) => (falseUnlocked(p) ? AUDIT_END : AUDIT_END_NO_FALSE);
export function finishAudit(p) {
  if (!p.audit || typeof p.audit !== 'object') p.audit = { done: 0, last: null };
  p.audit.done = (p.audit.done || 0) + 1;
  p.audit.last = today(p);
  return p.audit.done;
}
