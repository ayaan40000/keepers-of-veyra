import { SKILLS, GATES, MODULES, SKILL_GATE } from '../data/curriculum.js';
import { RANK_TITLES } from '../data/story.js';
import { noteProbe } from './brambles.js';
import { updateSkill, storeSet, applyProbe, today, computeMastery, applySessionLevel } from './core.js';
import { wrenStage } from '../data/story.js';
import { evaluateSideQuests } from './quests.js';
import { grantKeys, ensureCrypt } from './crypt.js';
import { mean, daysBetween, addDays, clamp } from './util.js';
import { variantOf } from './additions.js';

// Practice drills that never change skill estimates or earn Lumen (1.1: Mental Reckoning).
const NO_CREDIT = ['calc'];

export const FREE_XP_CAP = 50;

export function rankOf(lumen) {
  const rank = Math.floor(Math.sqrt(lumen / 50)) + 1;
  let title = RANK_TITLES[0][1];
  for (const [min, t] of RANK_TITLES) if (rank >= min) title = t;
  const next = 50 * rank * rank;
  const prev = 50 * (rank - 1) * (rank - 1);
  return { rank, title, next, prev, frac: (lumen - prev) / (next - prev) };
}

// Speed score for timed drills: target study time / used study time, capped at 1.5, scaled to 0..1.
export function speedScore(step, timing) {
  if (!step.spec.timed) return null;
  if (step.spec.t === 'major') {
    const per = timing.perItemMs || [];
    if (!per.length) return null;
    return mean(per.map((ms) => clamp(3000 / Math.max(ms, 1), 0, 1.5) / 1.5));
  }
  if (!timing.studyMs) return null;
  return clamp((step.spec.s * 1000) / timing.studyMs, 0, 1.5) / 1.5;
}

// Called when a drill (not a probe) finishes. Mutates profile, returns {lumen, events, record}.
export function applyDrill(p, session, step, result, timing) {
  const t = today(p);
  const events = [];
  const spd = speedScore(step, timing);
  const speedOk = spd == null || spd >= 0.6;
  const record = {
    date: t, day: session.day, session: session.id, type: session.type, role: step.role, t: step.spec.t, skill: step.skill,
    level: step.level, n: result.n, correct: result.correct, acc: result.acc, errs: result.errs,
    battery: !!step.battery, interference: !!step.spec.interference, studyMs: timing.studyMs || 0, recallMs: timing.recallMs || 0, speed: result.acc >= 0.8 ? spd : null, timed: !!step.spec.timed,
    ...(variantOf(step.spec) ? { v: variantOf(step.spec) } : {}), // 1.1: which variant, so Then and Now can tell them apart
  };
  p.results.push(record);
  // Only independent, unscaffolded drills update skill estimates (guided, warm-up, review, free and baseline do not).
  if (['practice', 'check', 'gate', 'remedial'].includes(step.role) && !NO_CREDIT.includes(step.spec.t)) events.push(...updateSkill(p, step.skill, result, step.role, speedOk));
  if (step.role === 'baseline') {
    p.baseline = p.baseline || { date: t, results: {} };
    p.baseline.results[step.spec.t] = result.acc;
  }
  const hasPractice = session.steps.some((s) => s.role === 'practice' || s.role === 'remedial');
  const storable = step.role === 'practice' || step.role === 'remedial' || (step.role === 'guided' && !hasPractice);
  const isFirstPractice = storable && !session.steps.some((s) => s._stored);
  if (isFirstPractice || step.role === 'gate') { storeSet(p, step, result); step._stored = true; }

  let lumen = Math.round(10 * result.acc * (1 + 0.1 * ((step.level || 1) - 1)));
  if (step.role === 'warmup') lumen = Math.round(lumen / 2);
  if (NO_CREDIT.includes(step.spec.t)) lumen = 0;
  if (step.role === 'free' || session.repeatToday) {
    const fx = p.progress.freeXp && p.progress.freeXp.date === t && Number.isFinite(p.progress.freeXp.xp) ? p.progress.freeXp : { date: t, xp: 0 };
    lumen = Math.max(0, Math.min(lumen, FREE_XP_CAP - fx.xp));
    p.progress.freeXp = { date: t, xp: fx.xp + lumen };
  }
  if (step.role !== 'free' && !session.repeatToday) for (const e of events) if (e.type === 'pb') lumen += 20; // bonuses never bypass the cap
  p.progress.lumen += lumen;
  record.lumen = lumen;
  checkDrillAchievements(p, step, result, timing);
  return { lumen, events, record, speedRaw: spd, speedOk };
}

export function applyProbeStep(p, session, step, result) {
  const set = p.sets.find((s) => s.id === step.setId);
  if (!set) return { lumen: 0, events: [] };
  const { delay, ratio, pass } = applyProbe(p, set, result);
  noteProbe(p, set, result); // 1.1 brambles: a record of what slipped, and what held on a later day
  const factor = delay >= 30 ? 1.8 : delay >= 7 ? 1.4 : 1;
  const lumen = Math.round(25 * ratio * factor);
  p.progress.lumen += lumen;
  p.results.push({ date: today(p), day: session.day, session: session.id, type: session.type, role: 'probe', t: set.t, skill: set.skill, n: result.n, correct: result.correct, acc: result.acc, ratio, delay, pass, errs: result.errs, lumen, ...(variantOf(set.spec) ? { v: variantOf(set.spec) } : {}) });
  if (delay >= 1 && result.acc >= 0.9) unlock(p, 'it_stayed');
  if (delay >= 7 && result.acc >= 0.8) unlock(p, 'week_later');
  if (delay >= 7 && pass) { ensureCrypt(p); grantKeys(p, 1); }
  return { lumen, events: [{ type: pass ? 'probePass' : 'probeFail', skill: set.skill, delay }], delay, pass };
}

export function unlock(p, id) {
  if (!p.achievements[id]) { p.achievements[id] = today(p); (p._newAch = p._newAch || []).push(id); }
}

function checkDrillAchievements(p, step, result, timing) {
  if (result.n >= 8 && result.acc === 1) unlock(p, 'clean_sweep');
  if (step.spec.t === 'palace' && step.spec.reverse && result.acc === 1) unlock(p, 'walking_backward');
  if (step.spec.t === 'faces' && result.correct >= 8) unlock(p, 'face_reader');
  if (step.spec.t === 'major' && result.n >= 10 && result.acc === 1 && (timing.perItemMs || []).every((ms) => ms < 3000)) unlock(p, 'number_smith');
}

// Discarding a session keeps what was earned but applies the same rules as finishing it:
// gate attempts count, level changes apply, and later sessions that day earn Lumen at the free-practice cap.
export function abandonSession(p) {
  const ip = p.inProgress;
  if (!ip) return;
  const t = today(p);
  const res = ip.results || [];
  const bySkill = {};
  for (const r of res) if (['practice', 'check', 'gate', 'remedial'].includes(r.role)) (bySkill[r.skill] = bySkill[r.skill] || []).push(r);
  for (const [sk, rs] of Object.entries(bySkill)) applySessionLevel(p, sk, mean(rs.map((r) => r.acc)), rs.every((r) => r.speedOk !== false));
  const s = ip.session;
  if ((s.type === 'gate' || s.type === 'gateRetry') && ip.idx > 0) p.progress.gateRetry[s.module] = addDays(t, 3);
  if (res.length) p.progress.abandoned = t;
  p.inProgress = null;
}

// Session completion: curriculum advance, dates, minutes, gates, achievements.
export function finalizeSession(p, session, drillResults, reflection) {
  const t = today(p);
  const pr = p.progress;
  const out = { lumen: 0, gate: null, advanced: false, rekindled: false };
  const away = pr.lastSessionDate ? daysBetween(pr.lastSessionDate, t) : 0;
  const advancing = ['full', 'baseline', 'assessment', 'gate'].includes(session.type);
  if (advancing && !pr.fullDates.includes(t)) {
    pr.fullDates.push(t);
    pr.day = Math.min(365, pr.day + 1);
    out.advanced = true;
  }
  if (session.type === 'baseline') pr.baselineDone = true;
  if (out.advanced) { ensureCrypt(p); out.keys = grantKeys(p, 1); }
  if (session.type !== 'free') {
    if (!pr.trainingDates.includes(t)) pr.trainingDates.push(t);
    if (away >= 3) { out.rekindled = true; unlock(p, 'rekindled'); pr.lumen += 20; out.lumen += 20; }
    pr.lastSessionDate = t;
    pr.lumen += 15; out.lumen += 15;
  }
  // R1/R2 once per skill per session.
  out.events = [];
  const bySkill = {};
  for (const r of drillResults) if (['practice', 'check', 'gate', 'remedial'].includes(r.role)) (bySkill[r.skill] = bySkill[r.skill] || []).push(r);
  for (const [sk, rs] of Object.entries(bySkill)) out.events.push(...applySessionLevel(p, sk, mean(rs.map((r) => r.acc)), rs.every((r) => r.speedOk !== false)));
  if (!session.repeatToday) for (const e of out.events) if (e.type === 'levelup') { pr.lumen += 30; out.lumen += 30; }
  const stageBefore = wrenStage(pr.gates.length).name;
  pr.minutes += Math.max(1, Math.min(45, Math.round((Date.now() - session.startedAt) / 60000)));
  // v0.7: measure real session length on this device (beta question: is it really 20 to 30 minutes?).
  const wall = Math.max(0, (Date.now() - session.startedAt) / 60000);
  p.stats = p.stats && Array.isArray(p.stats.sessions) ? p.stats : { sessions: [] };
  p.stats.sessions = [...p.stats.sessions, { date: t, type: session.type, minutes: Math.round(Math.min(600, wall) * 10) / 10, ...(wall > 90 ? { gap: true } : {}) }].slice(-500);
  if (session.type === 'gate' || session.type === 'gateRetry') {
    const gateRes = drillResults.filter((r) => r.role === 'gate');
    const acc = mean(gateRes.map((r) => r.acc)) ?? 0;
    const g = GATES[session.module];
    const speedOk = gateRes.filter((r) => r.timed).every((r) => (r.speedRaw ?? 0) >= 0.6);
    const passed = acc >= g.threshold && speedOk;
    out.gate = { module: session.module, acc, threshold: g.threshold, passed, speedOk };
    if (passed && !pr.gates.includes(session.module)) {
      pr.gates.push(session.module);
      pr.lumen += 100; out.lumen += 100;
      if (session.module === 'M1') unlock(p, 'quay_restored');
      Object.keys(p.skills).forEach((k) => updateMasteryOnly(p, k));
    } else if (!passed) pr.gateRetry[session.module] = addDays(t, 3);
  }
  if (reflection?.diagnosed) { p.reflections++; if (p.reflections >= 3) unlock(p, 'honest_ledger'); }
  unlock(p, 'first_light');
  if (consistency(p) >= 7) unlock(p, 'steady_flame');
  if (Object.values(p.skills).some((s) => s.level > 1)) unlock(p, 'sharper');
  out.sideQuests = evaluateSideQuests(p).map((q) => q.id);
  if (out.sideQuests.length) { pr.lumen += 40 * out.sideQuests.length; out.lumen += 40 * out.sideQuests.length; }
  out.stageUp = wrenStage(pr.gates.length).name !== stageBefore ? wrenStage(pr.gates.length).name : null;
  const st = streaks(p);
  pr.longest = Math.max(pr.longest, st.current);
  return out;
}

function updateMasteryOnly(p, k) { p.skills[k].mastery = computeMastery(p.skills[k], p.progress.gates.includes(SKILL_GATE[k])); }

// Streak with one automatic rest day allowed per 7 days.
// Median minutes of daily sessions that ran in one sitting (sessions left open over 90 minutes are left out).
export function sessionLengths(p, types = ['full', 'assessment', 'gate', 'baseline']) {
  const xs = (p?.stats?.sessions || []).filter((s) => !s.gap && types.includes(s.type)).map((s) => s.minutes).sort((a, b) => a - b);
  if (!xs.length) return { count: 0, median: null };
  const m = xs.length % 2 ? xs[(xs.length - 1) / 2] : (xs[xs.length / 2 - 1] + xs[xs.length / 2]) / 2;
  return { count: xs.length, median: Math.round(m), min: Math.round(xs[0]), max: Math.round(xs[xs.length - 1]) };
}

export function streaks(p) {
  const dates = [...new Set(p.progress.trainingDates)].sort();
  const t = today(p);
  if (!dates.length) return { current: 0, longest: p.progress.longest || 0 };
  const runs = [];
  let run = 1, lastRest = null;
  for (let i = 1; i < dates.length; i++) {
    const gap = daysBetween(dates[i - 1], dates[i]);
    if (gap === 1) run++;
    else if (gap === 2 && (!lastRest || daysBetween(lastRest, dates[i]) >= 7)) { run++; lastRest = addDays(dates[i - 1], 1); }
    else { runs.push(run); run = 1; lastRest = null; }
  }
  const gapNow = daysBetween(dates[dates.length - 1], t);
  const alive = gapNow <= 1 || (gapNow === 2 && (!lastRest || daysBetween(lastRest, t) >= 7));
  runs.push(run);
  return { current: alive ? run : 0, longest: Math.max(...runs, p.progress.longest || 0) };
}

export function consistency(p, window = 14) {
  const t = today(p);
  return new Set(p.progress.trainingDates.filter((d) => daysBetween(d, t) < window && daysBetween(d, t) >= 0)).size;
}

// ---------- analytics ----------
const within = (p, r, days) => daysBetween(r.date, today(p)) < days;

export function componentScores(p) {
  const res = p.results;
  const prac = res.filter((r) => ['practice', 'check', 'gate', 'guided', 'remedial', 'review'].includes(r.role) && within(p, r, 14));
  const wsum = prac.reduce((a, r) => a + (1 + 0.1 * ((r.level || 1) - 1)), 0);
  const accuracy = prac.length >= 2 ? (100 * prac.reduce((a, r) => a + r.acc * (1 + 0.1 * ((r.level || 1) - 1)), 0)) / wsum : null;
  const probes = res.filter((r) => r.role === 'probe' && within(p, r, 30));
  const retention = probes.length ? 100 * mean(probes.map((r) => r.ratio)) : null;
  const timed = res.filter((r) => r.speed != null && within(p, r, 14));
  const speed = timed.length ? 100 * mean(timed.map((r) => r.speed)) : null;
  const intro = Object.values(p.skills).filter((s) => s.attempts > 0);
  const mastery = intro.length ? 100 * mean(intro.map((s) => s.mastery / 4)) : null;
  const checks = res.filter((r) => ['check', 'gate'].includes(r.role) && within(p, r, 14));
  const transfer = checks.length ? 100 * mean(checks.map((r) => r.acc)) : null;
  return { accuracy, retention, speed, mastery, transfer };
}

export const WEIGHTS = { retention: 0.3, accuracy: 0.25, transfer: 0.2, mastery: 0.15, speed: 0.1 };

export function mts(c) {
  let w = 0, s = 0;
  for (const [k, wt] of Object.entries(WEIGHTS)) if (c[k] != null) { w += wt; s += wt * c[k]; }
  if (w < 0.45) return null; // not enough evidence (also requires 3 training days; see mtsFor)
  return Math.round((10 * s) / w);
}

export function mtsFor(p) {
  const days = p.progress.trainingDates.length;
  if (days < 3) return { score: null, provisional: true, days };
  return { score: mts(componentScores(p)), provisional: days < 14, days };
}

export function dailySeries(p, days = 60) {
  const t = today(p);
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(t, -i);
    const rs = p.results.filter((r) => r.date === d);
    const prac = rs.filter((r) => ['practice', 'check', 'gate', 'guided', 'remedial'].includes(r.role));
    const pr = rs.filter((r) => r.role === 'probe');
    out.push({ date: d, acc: prac.length ? mean(prac.map((r) => r.acc)) : null, ret: pr.length ? mean(pr.map((r) => r.ratio)) : null, trained: p.progress.trainingDates.includes(d) });
  }
  return out;
}

export function skillSummary(p) {
  return Object.entries(SKILLS).map(([id, meta]) => {
    const s = p.skills[id];
    const probes = s.probes.slice(-5);
    const recent = p.results.filter((r) => r.skill === id && r.role !== 'probe');
    const first = recent.slice(0, 3), last = recent.slice(-3);
    const trend = first.length && last.length && recent.length >= 4 ? mean(last.map((r) => r.acc)) - mean(first.map((r) => r.acc)) : null;
    return { id, ...meta, level: s.level, avg: s.avg, mastery: s.mastery, attempts: s.attempts, retention: probes.length ? mean(probes.map((x) => x.score)) : null, trend, remediate: s.remediate, errs: s.errs };
  });
}

export function nextGate(p) {
  return MODULES.find((m) => !p.progress.gates.includes(m.id));
}
