import { describe, it, expect } from 'vitest';
import { newProfile, today } from '../src/engine/core.js';
import { buildExport, parseImport, migrate } from '../src/store.js';
import { MODULES } from '../src/data/curriculum.js';
import { REAL_TRIES, PLAYBOOKS, RECIPE, CALDER_LETTER, GUIDE_CLAIM, GUIDE_SAFETY } from '../src/data/fieldguide.js';
import { MASTERS } from '../src/data/masters.js';
import { pendingNudge, latestGate, NUDGE_SNOOZE_DAYS } from '../src/engine/guide.js';
import { TEMPLATE_SKILL } from '../src/data/curriculum.js';

const fresh = () => newProfile('t', 'key');
const MOD_IDS = MODULES.map((m) => m.id);
const allText = JSON.stringify([REAL_TRIES, PLAYBOOKS, RECIPE, CALDER_LETTER, GUIDE_CLAIM, GUIDE_SAFETY, MASTERS]);

describe('v0.10 Field Guide content', () => {
  it('has unique ids and valid unlock gates', () => {
    for (const list of [REAL_TRIES, PLAYBOOKS, MASTERS]) {
      expect(new Set(list.map((x) => x.id)).size).toBe(list.length);
      for (const x of list) expect(MOD_IDS).toContain(x.unlock);
    }
  });
  it('has one real-life try per module', () => {
    expect(REAL_TRIES.map((t) => t.unlock)).toEqual(MOD_IDS);
  });
  it('uses only drill templates the game has', () => {
    for (const m of MASTERS.filter((x) => x.spec)) expect(TEMPLATE_SKILL[m.spec.t]).toBeTruthy();
  });
  it('keeps to the writing rules', () => {
    expect(allText).not.toMatch(/[—–]/); // no em or en dashes
    expect(allText).not.toMatch(/\b(boost|improve) (your )?(iq|intelligence)/i);
    expect(allText).not.toMatch(/guarantee/i);
  });
  it('every playbook states honest limits', () => {
    for (const b of PLAYBOOKS) { expect(b.caveat.length).toBeGreaterThan(30); expect(b.steps.length).toBeGreaterThanOrEqual(3); expect(b.steps.length).toBeLessThanOrEqual(7); }
  });
  it('never teaches memorising secrets', () => {
    expect(GUIDE_SAFETY.join(' ')).toMatch(/password manager/);
    expect(JSON.stringify(PLAYBOOKS)).not.toMatch(/memori[sz]e (your |a )?(pin|password)/i);
  });
});

describe('v0.10 real-life nudge', () => {
  it('stays quiet until a gate is passed', () => {
    const p = fresh();
    expect(latestGate(p)).toBeNull();
    expect(pendingNudge(p, today(p))).toBeNull();
  });
  it('offers the latest gate task once, then not after it is tried', () => {
    const p = fresh(); p.progress.gates = ['M1', 'M2'];
    expect(pendingNudge(p, today(p)).id).toBe('try-m2');
    p.guide.tried['try-m2'] = today(p);
    expect(pendingNudge(p, today(p))).toBeNull();
  });
  it('"not now" silences it for 30 days', () => {
    const p = fresh(); p.progress.gates = ['M1'];
    p.guide.later['try-m1'] = '2026-11-01';
    expect(pendingNudge(p, '2026-11-20')).toBeNull();
    expect(pendingNudge(p, '2026-12-02').id).toBe('try-m1');
    expect(NUDGE_SNOOZE_DAYS).toBe(30);
  });
  it('gives no Lumen or progress for trying', () => {
    const p = fresh(); const before = JSON.stringify([p.progress, p.skills, p.achievements]);
    p.guide.tried['try-m1'] = today(p);
    expect(JSON.stringify([p.progress, p.skills, p.achievements])).toBe(before);
  });
});

describe('v0.10 Field Guide save data', () => {
  it('migrates older profiles', () => {
    const p = fresh(); delete p.guide;
    expect(migrate(p).guide).toEqual({ tried: {}, later: {} });
  });
  it('round-trips through a backup', () => {
    const p = fresh(); p.guide.tried['try-m1'] = '2026-11-01'; p.guide.later['try-m2'] = '2026-11-02';
    const r = parseImport(buildExport(p));
    expect(r.ok).toBe(true);
    expect(r.profile.guide.tried['try-m1']).toBe('2026-11-01');
  });
  it('refuses a damaged record', () => {
    const p = fresh(); p.guide.tried['x'] = 'not a date';
    expect(parseImport(buildExport(p)).ok).toBe(false);
  });
  it('accepts backups made before the Field Guide existed', () => {
    const p = fresh(); delete p.guide;
    const r = parseImport(buildExport(p));
    expect(r.ok).toBe(true);
    expect(r.profile.guide).toEqual({ tried: {}, later: {} });
  });
});
