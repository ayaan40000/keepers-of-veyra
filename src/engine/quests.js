import { SIDE_QUESTS, CODEX, CHARACTERS, CHAPTERS } from '../data/story.js';
import { MODULES } from '../data/curriculum.js';
import { today } from './core.js';
import { AUDIT_LORE } from '../data/audit.js';
import { EVENT_LORE } from '../data/events.js';
import { eventLoreOpen } from './events.js';
import { SEAM_LORE } from '../data/forgetting.js';
import { heldCount, faceKept, lampKept, keepsakeText } from './wren.js';

const moduleReached = (p, modId) => {
  const m = MODULES.find((x) => x.id === modId);
  const week = Math.floor((p.progress.day - 1) / 7) + 1;
  return !!m && (week >= m.weeks[0] || p.progress.gates.includes(modId) || p.progress.reviewerUnlock);
};

// True when the condition is met by the player's real performance data.
export function condMet(p, c) {
  const skills = p.skills;
  switch (c.type) {
    case 'ach': return !!p.achievements[c.id];
    case 'level': return (skills[c.skill]?.level || 1) >= c.n;
    case 'palace': return p.palaces.some((x) => x.loci.length >= c.n);
    case 'consistency': return !!p.achievements.steady_flame;
    case 'reflections': return p.reflections >= c.n;
    case 'days': return p.progress.trainingDates.length >= c.n;
    case 'probe': {
      const list = c.skill === '*' ? Object.values(skills).flatMap((s) => s.probes) : skills[c.skill]?.probes || [];
      return list.some((x) => x.delay >= c.delay && x.score >= c.score && (x.acc ?? 1) >= 0.7);
    }
    case 'result':
      return p.results.some((r) => r.role !== 'probe' && (!c.t || r.t === c.t) && (!c.n || r.n >= c.n) && r.acc >= c.acc
        && (!c.flag || r[c.flag]) && (!c.timed || r.timed) && (c.speed == null || (r.speed ?? 0) >= c.speed));
    case 'skillsAtLevel': return Object.values(skills).filter((s) => s.level >= c.level).length >= c.count;
    case 'skillsAtMastery': return Object.values(skills).filter((s) => s.mastery >= c.state).length >= c.count;
    case 'echo': return (p.battles?.held || 0) >= c.n;
    case 'battery': {
      const base = p.baseline?.results?.wordlist;
      if (base == null) return false;
      return p.results.some((r) => r.battery && r.role === 'check' && r.t === 'wordlist' && r.acc >= Math.min(1, Math.max(base, 0.1) * c.factor));
    }
    default: return false;
  }
}

export function sideQuestState(p, q) {
  if (p.story.sideDone?.[q.id]) return 'done';
  return moduleReached(p, q.module) ? 'open' : 'locked';
}

// Marks newly completed side quests. Returns the list completed now.
export function evaluateSideQuests(p) {
  p.story.sideDone = p.story.sideDone || {};
  const now = [];
  for (const q of SIDE_QUESTS) {
    if (p.story.sideDone[q.id] || !moduleReached(p, q.module)) continue;
    if (condMet(p, q.cond)) { p.story.sideDone[q.id] = today(p); now.push(q); }
  }
  return now;
}

export function codexUnlocked(p, entry) {
  const u = entry.unlock;
  if (u === 'start') return true;
  if (u.startsWith('gate:')) return p.progress.gates.includes(u.slice(5));
  if (u.startsWith('side:')) return !!p.story.sideDone?.[u.slice(5)];
  if (u.startsWith('audit:')) return (p.audit?.done || 0) >= +u.slice(6);
  if (u.startsWith('events:')) return eventLoreOpen(p, u.slice(7));
  if (u.startsWith('trial:')) return !!p.trials?.[u.slice(6)]?.passed;
  // 1.1 the Seam and Wren's family
  if (u === 'seam:met') return !!p.seam?.met;
  if (u === 'seam:closed') return !!p.seam?.closed;
  if (u.startsWith('wren:beat:')) return !!p.wren?.seen?.[u.slice(10)];
  if (u.startsWith('wren:held:')) return heldCount(p) >= +u.slice(10);
  if (u === 'wren:scene:face') return faceKept(p);
  if (u === 'wren:scene:lamp') return lampKept(p);
  return false;
}

export function codexFor(p) {
  return [...CODEX, ...AUDIT_LORE, ...EVENT_LORE, ...SEAM_LORE].map((e) => ({ ...e, text: e.dynamic === 'wren_keepsakes' ? keepsakeText(p) : e.text, open: codexUnlocked(p, e) }));
}

export function charactersFor(p) {
  const g = p.progress.gates.length;
  return CHARACTERS.map((c) => ({ ...c, visible: c.tiers.filter((t) => g >= t.min).map((t) => t.text) })).filter((c) => c.visible.length);
}

export function mainQuests(p) {
  return MODULES.map((m) => ({ id: m.id, district: m.district, month: m.month, title: CHAPTERS[m.id].title, quest: CHAPTERS[m.id].quest,
    state: p.progress.gates.includes(m.id) ? 'done' : Math.floor((p.progress.day - 1) / 7) + 1 > m.weeks[1] ? 'pending' : moduleReached(p, m.id) ? 'open' : 'locked' }));
}
