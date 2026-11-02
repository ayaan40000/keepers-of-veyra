// Undercroft difficulty simulation (v0.7). Plays many descents with simple player models and prints where they end.
// The models are assumptions, not data: real tuning waits for the closed beta's local "where descents end" tallies.
// Usage: npx vite-node scripts/crypt-sim.mjs [runs per model]   (vite-node, because the engine imports JSX art)
import { newProfile } from '../src/engine/core.js';
import { startRun, floorSpec, applyFloorResult, grantKeys } from '../src/engine/crypt.js';
import { CRYPT_BASE } from '../src/data/crypt.js';
import { rng } from '../src/engine/util.js';

const RUNS = +(process.argv.find((a) => /^\d+$/.test(a)) || 400);
// cap: the load at which a player recalls half the items; slope: how fast recall falls with load.
// Calibrated so a beginner recalls about 85 to 90% of a 6-word list at full study time.
const MODELS = [
  { name: 'new player (month 1)', cap: 11, slope: 0.35, week: 4 },
  { name: 'mid-year player', cap: 16, slope: 0.3, week: 26 },
  { name: 'year-end player', cap: 22, slope: 0.25, week: 52 },
];

function itemProb(m, step) {
  const t = step.spec.t, b = CRYPT_BASE[t];
  const n = step.items.length;
  const timeRatio = b.s && step.spec.s ? Math.min(1.3, (step.spec.s / n) / (b.s / b.n)) : 1;
  const load = n / Math.sqrt(timeRatio) * (step.echo ? 1.15 : 1) * (step.variants?.length ? 1.1 : 1);
  return 1 / (1 + Math.exp(m.slope * (load - m.cap)));
}

export function simulate(m, runs = RUNS) {
  const ends = [];
  const r = rng(12345 + Math.round(m.cap * 100));
  for (let i = 0; i < runs; i++) {
    const p = newProfile('sim', 'key');
    p.progress.day = (m.week - 1) * 7 + 1;
    p.palaces.push({ id: 'h', name: 'Home', loci: Array.from({ length: 40 }, (_, k) => `stop ${k}`) });
    grantKeys(p, 5); startRun(p, Math.floor(r() * 1e9));
    for (let guard = 0; guard < 200 && p.crypt.run; guard++) {
      const run = p.crypt.run;
      const step = floorSpec(p, run.floor, run.seed, run.attempt);
      const pr = itemProb(m, step);
      const n = step.items.length;
      let ok = 0; for (let k = 0; k < n; k++) if (r() < pr) ok++;
      const out = applyFloorResult(p, ok / n, step);
      if (out.outcome === 'dead') { ends.push(out.floor); break; }
    }
  }
  ends.sort((a, b) => a - b);
  return { median: ends[Math.floor(ends.length / 2)], p25: ends[Math.floor(ends.length / 4)], p75: ends[Math.floor((ends.length * 3) / 4)] };
}

for (const m of MODELS) {
  const s = simulate(m);
  console.log(`${m.name.padEnd(22)} descents end: median floor ${s.median} (middle half ${s.p25} to ${s.p75})`);
}
