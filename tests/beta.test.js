// v0.7 closed beta: session length is measured, and the beta report never carries personal text.
import { describe, it, expect } from 'vitest';
import { newProfile } from '../src/engine/core.js';
import { sessionLengths } from '../src/engine/progress.js';
import { betaReport, problemReport } from '../src/engine/beta.js';
import fs from 'fs';
import path from 'path';

describe('session length', () => {
  it('reports the median of one-sitting daily sessions', () => {
    const p = newProfile('t', 'key');
    p.stats.sessions = [18, 22, 31, 25].map((minutes) => ({ date: '2026-10-01', type: 'full', minutes })).concat([{ date: '2026-10-02', type: 'full', minutes: 300, gap: true }, { date: '2026-10-02', type: 'free', minutes: 5 }]);
    expect(sessionLengths(p)).toEqual({ count: 4, median: 24, min: 18, max: 31 });
  });
});

describe('beta report', () => {
  it('holds no alias, palace names or typed text', () => {
    const p = newProfile('Secret Alias', 'key');
    p.palaces = [{ id: 'x', name: 'Grandma House', loci: ['Blue door'] }];
    p.results = [{ date: '2026-10-01', acc: 0.8, t: 'wordlist' }];
    const text = JSON.stringify(betaReport(p, '0.7.0', { width: 390 }));
    for (const bad of ['Secret Alias', 'Grandma', 'Blue door']) expect(text).not.toContain(bad);
    expect(JSON.parse(text).training.accuracyByTask.wordlist).toEqual({ n: 1, acc: 0.8 });
  });
  it('problem report names the version', () => {
    expect(problemReport({ version: '0.7.0', what: 'x' })).toContain('Version: 0.7.0');
  });
});

// Privacy: the app source never talks to a network (CLAUDE.md hard rule).
describe('no network', () => {
  it('src has no fetch, XHR, WebSocket, beacon or remote URLs in code', () => {
    const files = [];
    const walk = (d) => { for (const f of fs.readdirSync(d)) { const q = path.join(d, f); if (fs.statSync(q).isDirectory()) walk(q); else if (/\.(js|jsx)$/.test(f)) files.push(q); } };
    walk('src');
    const bad = [];
    for (const f of files) {
      if (f.endsWith('licenses.js')) continue; // licence texts mention URLs
      const s = fs.readFileSync(f, 'utf8');
      if (/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|EventSource|https?:\/\/(?!www\.w3\.org)/.test(s)) bad.push(f);
    }
    expect(bad).toEqual([]);
  });
});

describe('v0.8 install offer', async () => {
  const { installOffer } = await import('../src/ui/Notices.jsx');
  it('waits for 3 training days and respects installed and dismissed', () => {
    const p = newProfile('t', 'key');
    p.progress.trainingDates = ['2026-10-01', '2026-10-02'];
    expect(installOffer(p, { canPrompt: true })).toBe(null);
    p.progress.trainingDates.push('2026-10-03');
    expect(installOffer(p, { canPrompt: true })).toBe('prompt');
    expect(installOffer(p, { safari: true })).toBe('safari');
    expect(installOffer(p, { canPrompt: true, standalone: true })).toBe(null);
    p.tips.seen.push('install');
    expect(installOffer(p, { canPrompt: true })).toBe(null);
  });
});
