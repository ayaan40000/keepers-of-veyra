// Workstream E reference generator for the "calc" drill (Mental Reckoning). DRAFT: not wired into src/.
// The builder ports this into src/engine (genItems 'calc' branch) using the game's own rng(seed) from util.js.
// Pure and deterministic for a seed. Every item carries its own check: answer is recomputed and compared.
// Run: node speedmath-gen.mjs   (prints a few samples and checks a few thousand items)

// small seeded generator for this standalone file only; the game uses rng() from src/engine/util.js
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));

// Levels of left-to-right work. Each returns { cue, steps, answer } where steps are the partial results to say aloud.
export const LEVELS = {
  1: { name: 'Add two numbers, two digits', make(r) {
    let a, b;
    do { a = int(r, 21, 89); b = int(r, 21, 79); } while ((a % 10) + (b % 10) < 10 || a + b > 199);
    const t = b - (b % 10), u = b % 10;
    return { cue: `${a} + ${b}`, steps: [a + t, a + t + u], answer: a + b };
  } },
  2: { name: 'Add a two-digit number to a three-digit number', make(r) {
    let a, b;
    do { a = int(r, 120, 899); b = int(r, 21, 89); } while ((a % 10) + (b % 10) < 10);
    const t = b - (b % 10), u = b % 10;
    return { cue: `${a} + ${b}`, steps: [a + t, a + t + u], answer: a + b };
  } },
  3: { name: 'Add two three-digit numbers', make(r) {
    let a, b;
    do { a = int(r, 120, 799); b = int(r, 120, 799); } while ((a % 10) + (b % 10) < 10 || (Math.floor(a / 10) % 10) + (Math.floor(b / 10) % 10) < 9);
    const h = b - (b % 100), te = (b % 100) - (b % 10), u = b % 10;
    return { cue: `${a} + ${b}`, steps: [a + h, a + h + te, a + h + te + u], answer: a + b };
  } },
  4: { name: 'Subtract two three-digit numbers', make(r) {
    let a, b;
    do { a = int(r, 400, 999); b = int(r, 120, a - 100); } while ((a % 10) >= (b % 10));
    const h = b - (b % 100), te = (b % 100) - (b % 10), u = b % 10;
    return { cue: `${a} − ${b}`.replace('−', 'minus'), steps: [a - h, a - h - te, a - h - te - u], answer: a - b };
  } },
  5: { name: 'Multiply a two-digit number by one digit', make(r) {
    const a = int(r, 12, 98), d = int(r, 3, 9), t = a - (a % 10);
    return { cue: `${a} × ${d}`, steps: [t * d, a * d], answer: a * d };
  } },
  6: { name: 'Multiply two two-digit numbers', make(r) {
    const a = int(r, 12, 49), b = int(r, 12, 79), t = a - (a % 10), u = a % 10;
    return { cue: `${a} × ${b}`, steps: [t * b, u * b, a * b], answer: a * b };
  } },
};

// Number facts worth knowing by heart (see speedmath.json for the checked tables).
export function squareItem(r) { const n = int(r, 11, 30); return { cue: `${n} squared`, steps: [], answer: n * n }; }
export function tableItem(r) { const a = int(r, 6, 15), b = int(r, 6, 15); return { cue: `${a} × ${b}`, steps: [], answer: a * b }; }

// spec: { t: 'calc', n, s, level (1..6), mode: 'see' | 'hold', kinds: ['ltr','sq','tbl'] }
export function genCalc(spec, seed) {
  const r = rng(seed);
  const kinds = spec.kinds || ['ltr'];
  const items = [];
  for (let i = 0; i < spec.n; i++) {
    const kind = kinds[i % kinds.length];
    const base = kind === 'sq' ? squareItem(r) : kind === 'tbl' ? tableItem(r) : LEVELS[spec.level || 1].make(r);
    items.push({ kind, level: kind === 'ltr' ? spec.level || 1 : null, mode: spec.mode || 'see', ...base, answer: String(base.answer) });
  }
  return items;
}

// Scoring: accuracy first. The final answer is exact (digits only; commas and spaces ignored). Partials are feedback only.
export function scoreCalc(items, responses) {
  const clean = (x) => String(x ?? '').replace(/[\s,]/g, '');
  let right = 0;
  const detail = items.map((it, i) => {
    const ok = clean(responses[i]?.final) === it.answer;
    if (ok) right++;
    return { ok, partialsOk: (responses[i]?.partials || []).map((p, j) => clean(p) === String(it.steps[j] ?? '')) };
  });
  return { acc: items.length ? right / items.length : 0, detail };
}

// ---- self check, only when run directly ----
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('speedmath-gen.mjs')) {
  let bad = 0, total = 0;
  for (let level = 1; level <= 6; level++) {
    for (let seed = 1; seed <= 400; seed++) {
      const items = genCalc({ n: 6, level, kinds: ['ltr'] }, seed);
      for (const it of items) {
        total++;
        const m = it.cue.match(/^(\d+) (\+|minus|×) (\d+)$/);
        const [a, op, b] = [Number(m[1]), m[2], Number(m[3])];
        const want = op === '+' ? a + b : op === 'minus' ? a - b : a * b;
        const last = it.steps[it.steps.length - 1];
        if (String(want) !== it.answer || last !== want || want < 0) bad++;
      }
    }
  }
  console.log(`checked ${total} generated items, problems: ${bad}`);
  for (let level = 1; level <= 6; level++) console.log(level, LEVELS[level].name, JSON.stringify(genCalc({ n: 2, level }, 7)));
}
