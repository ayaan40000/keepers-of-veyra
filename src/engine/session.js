import { WEEKS, MODULES, GATES, BASELINE, TEMPLATE_SKILL, SKILLS, moduleForWeek, weekForDay, moduleGateDay } from '../data/curriculum.js';
import { scaledSpec, genItems, dueSets, probeItems, today } from './core.js';
import { daysBetween, uid, hashStr } from './util.js';

const COACH = {
  omission: { title: 'Empty slots', text: 'Most misses were blanks: the image probably never formed. During study, say the image to yourself in one sentence and use the optional "your image" box.' },
  substitution: { title: 'Wrong items', text: 'You recalled something, but not the right thing. Make each image more specific: one colour, one size, one action that belongs only to it.' },
  order: { title: 'Order slips', text: 'The items were there but out of place. Before recall, walk the route or story once from the start. Make each image touch the next one or its stop.' },
  timeout: { title: 'Out of time', text: 'Time ran out before you finished. Speed comes from familiar images. Accuracy first: the app will give back study time if needed.' },
};

export function sessionStatus(p) {
  const t = today(p);
  const pr = p.progress;
  const doneToday = pr.fullDates.includes(t);
  const away = pr.lastSessionDate ? daysBetween(pr.lastSessionDate, t) : 0;
  const day = Math.min(365, pr.day);
  const week = weekForDay(day);
  const mod = moduleForWeek(week.w);
  const isWeekEnd = day % 7 === 0;
  const gateDay = moduleGateDay(mod);
  const pendingGate = MODULES.find((m) => pr.day > moduleGateDay(m) && !pr.gates.includes(m.id) && GATES[m.id].threshold > 0 && (!pr.gateRetry[m.id] || pr.gateRetry[m.id] <= t));
  let type = 'full';
  if (!pr.baselineDone) type = 'baseline';
  else if (day === gateDay && !pr.gates.includes(mod.id) && !(pr.gateRetry[mod.id] > t)) type = 'gate';
  else if (isWeekEnd) type = 'assessment';
  return { t, doneToday, away, day, week, mod, type, pendingGate, due: dueSets(p, 50).length };
}

function drillStep(p, spec, role, seedKey, mode) {
  const skill = TEMPLATE_SKILL[spec.t];
  const level = p.skills[skill]?.level || 1;
  const measure = role === 'baseline' || role === 'gate' || role === 'check';
  const s = scaledSpec(spec, role === 'baseline' || role === 'gate' ? 1 : level, mode || (role === 'guided' ? 'guided' : role === 'remedial' ? 'remedial' : role === 'warmup' ? 'warmup' : measure ? 'measure' : 'practice'), p.user.prefs.timerMult || 1);
  const { items, extra } = genItems(s, hashStr(seedKey), p);
  return { kind: 'drill', role, spec: s, skill, level, items, extra: extra || null };
}

function probeSteps(p, max) {
  return dueSets(p, max).map((set) => {
    const { items, loci } = probeItems(set);
    return { kind: 'probe', setId: set.id, skill: set.skill, spec: set.spec, items, loci, created: set.created };
  });
}

function lessonStep(p, week, firstDayOfWeek, skillsInWeek) {
  const cards = firstDayOfWeek ? week.lesson.slice() : [week.lesson[(p.progress.day - 1) % week.lesson.length]];
  const coach = [];
  for (const sk of skillsInWeek) {
    const s = p.skills[sk];
    if (s?.altExplain && COACH[s.altExplain]) coach.push(`${COACH[s.altExplain].title} (${SKILLS[sk].short}): ${COACH[s.altExplain].text}`);
    if (s?.remediate) coach.push(`Rebuilding ${SKILLS[sk].short}: today's practice uses fewer items and more study time. Write each image in the box before moving on.`);
  }
  return { kind: 'lesson', title: week.title, objective: week.obj, cards, coach, refresher: !firstDayOfWeek };
}

// Earlier skill for interleaving (R8), weakest first.
function interleaveSpec(p, week) {
  const earlier = WEEKS.filter((w) => w.w < week.w).flatMap((w) => w.drills);
  const curSkills = new Set(week.drills.map((d) => TEMPLATE_SKILL[d.t]));
  const cands = earlier.filter((d) => !curSkills.has(TEMPLATE_SKILL[d.t]));
  if (!cands.length) return null;
  cands.sort((a, b) => (p.skills[TEMPLATE_SKILL[a.t]].avg ?? 1) - (p.skills[TEMPLATE_SKILL[b.t]].avg ?? 1));
  const d = cands[0];
  return { ...d, n: Math.min(d.n, 8) };
}

// Rough duration: study time + about 7 s per recalled item + fixed costs.
export function estimateMinutes(session) {
  let sec = 0;
  for (const s of session.steps) {
    if (s.kind === 'drill') sec += (s.role === 'guided' ? s.items.length * 12 : s.spec.s || 0) + s.items.length * 7 + 25;
    else if (s.kind === 'probe') sec += s.items.length * 8 + 15;
    else if (s.kind === 'lesson') sec += s.refresher ? 60 : 150;
    else if (s.kind === 'reflect') sec += 90;
    else if (s.kind === 'story') sec += 90;
    else sec += 20;
  }
  return Math.round(sec / 60);
}

export function buildSession(p, kind, opts = {}) {
  const st = sessionStatus(p);
  const id = uid();
  const seed = (k) => `${id}:${k}`;
  const week = st.week;
  const skillsInWeek = [...new Set(week.drills.map((d) => TEMPLATE_SKILL[d.t]))];
  const steps = [];
  const type = kind || st.type;

  if (type === 'baseline') {
    steps.push({ kind: 'story', chapter: 'prologue' });
    steps.push({ kind: 'lesson', title: 'Your starting point', objective: 'Measure today, before any technique.', cards: ['Before teaching anything, we measure where you start. Use whatever you normally do to remember. There is no wrong way and no passing score.', 'Three short tasks: words, digits, and names for faces. These same tasks return at months 3, 6, 9 and 12 with new material, so you can see real change.'], coach: [] });
    BASELINE.forEach((b, i) => steps.push({ ...drillStep(p, b, 'baseline', seed('b' + i)), battery: true }));
    steps.push(lessonStep(p, WEEKS[0], true, ['imagery']));
    steps.push(drillStep(p, WEEKS[0].drills[0], 'guided', seed('g')));
  } else if (type === 'recovery') {
    steps.push({ kind: 'intro', variant: 'return' });
    steps.push(...probeSteps(p, 2));
    steps.push(drillStep(p, week.drills[0], 'practice', seed('r'), 'guided'));
  } else if (type === 'review') {
    steps.push({ kind: 'intro', variant: 'review' });
    steps.push(...probeSteps(p, 4));
    const intro = Object.entries(p.skills).filter(([, s]) => s.attempts > 0).sort((a, b) => (a[1].avg ?? 1) - (b[1].avg ?? 1)).slice(0, 2);
    intro.forEach(([sk], i) => {
      const spec = WEEKS.filter((w) => w.w <= week.w).flatMap((w) => w.drills).find((d) => TEMPLATE_SKILL[d.t] === sk);
      if (spec) steps.push(drillStep(p, { ...spec, n: Math.min(spec.n, 8) }, 'review', seed('v' + i)));
    });
  } else if (type === 'free') {
    steps.push(drillStep(p, opts.spec, 'free', seed('f')));
  } else if (type === 'gate' || type === 'gateRetry') {
    const mod = type === 'gate' ? st.mod : opts.mod;
    steps.push({ kind: 'intro', variant: 'gate', module: mod.id });
    steps.push(...probeSteps(p, 2));
    if (type === 'gate' && [13, 26, 39, 52].includes(week.w)) BASELINE.forEach((b, i) => steps.push({ ...drillStep(p, b, 'baseline', seed('q' + i)), role: 'check', battery: true }));
    GATES[mod.id].drills.forEach((d, i) => steps.push({ ...drillStep(p, d, 'gate', seed('gate' + i)), module: mod.id }));
  } else if (type === 'assessment') {
    steps.push({ kind: 'intro', variant: 'assessment' });
    steps.push(...probeSteps(p, 3));
    if ([13, 26, 39, 52].includes(week.w)) {
      // Quarterly battery: exact repeat of the day-1 tasks with new material.
      BASELINE.forEach((b, i) => steps.push({ ...drillStep(p, b, 'baseline', seed('q' + i)), role: 'check', battery: true }));
    }
    const specs = [week.check, ...week.drills.filter((d) => d.t !== week.check.t)];
    specs.forEach((d, i) => steps.push(drillStep(p, d, 'check', seed('a' + i))));
    const il = interleaveSpec(p, week);
    if (il) steps.push(drillStep(p, il, 'review', seed('ai')));
  } else {
    // Full 30-minute session.
    steps.push({ kind: 'intro', variant: st.away >= 3 ? 'return' : 'welcome' });
    const probes = probeSteps(p, 3);
    steps.push(...probes);
    if (!probes.length) steps.push(drillStep(p, { t: 'wordlist', n: 5, s: 25 }, 'warmup', seed('w'), 'warmup'));
    const firstDay = (p.progress.day - 1) % 7 === 0;
    steps.push(lessonStep(p, week, firstDay, skillsInWeek));
    steps.push(drillStep(p, week.drills[0], 'guided', seed('g')));
    week.drills.forEach((d, i) => {
      const sk = TEMPLATE_SKILL[d.t];
      steps.push(drillStep(p, d, p.skills[sk].remediate ? 'remedial' : 'practice', seed('p' + i)));
    });
    if (week.w >= 9) { const il = interleaveSpec(p, week); if (il) steps.push(drillStep(p, il, 'review', seed('i'))); }
    // Use the 30 minutes: add extra practice rounds with new material while the session is short.
    for (let k = 0; k < 3 && estimateMinutes({ steps }) < 22; k++) {
      const d = week.drills[k % week.drills.length];
      const sk = TEMPLATE_SKILL[d.t];
      steps.push(drillStep(p, d, p.skills[sk].remediate ? 'remedial' : 'practice', seed('x' + k)));
    }
    steps.push(drillStep(p, week.check, 'check', seed('c')));
  }
  // Weekly story beat, once per week, at the start of the first scored session that week.
  const beatKey = 'w' + week.w;
  if (['full', 'assessment', 'gate'].includes(type) && !(p.story.seen || []).includes(beatKey)) steps.unshift({ kind: 'story', beat: week.w });
  if (type !== 'free') steps.push({ kind: 'reflect' });
  steps.push({ kind: 'summary' });
  const repeatToday = p.progress.abandoned === st.t && type !== 'free';
  return { id, type, repeatToday, day: st.day, week: week.w, module: (type === 'gateRetry' ? opts.mod : st.mod).id, steps, startedAt: Date.now() };
}

export { COACH };
