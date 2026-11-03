#!/usr/bin/env node
// Mnemos sound studio: turns a small JSON score into a 16-bit mono WAV using NES-style
// pulse, triangle and noise voices. No dependencies, no network. Draft listening tool only.
// Score format: see tools/sound-studio/README.md ("mnemos-score/1").
//
// Usage:
//   node tools/sound-studio/render.mjs                      render every score in scores/ into out/
//   node tools/sound-studio/render.mjs scores/x.json        render one score into out/x.wav
//   node tools/sound-studio/render.mjs scores/x.json a.wav  choose the output file
//   options: --rate 44100 (sample rate)  --loops 2 (repeat a looping score)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// ---------- score parsing (kept pure so a WebAudio player can reuse the same logic) ----------

const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export const midiOf = (name) => {
  const m = /^([A-Ga-g])([#b]?)(-?\d)$/.exec(name);
  if (!m) return null;
  return (Number(m[3]) + 1) * 12 + SEMI[m[1].toUpperCase()] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
};
export const hzOf = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

// "A4:6 r:2 | k:4" -> events [{ step, len, midi? drum? }], plus bar-length warnings.
export function parseNotes(text, stepsPerBar, label = 'channel') {
  const events = [];
  const warnings = [];
  let step = 0;
  const bars = String(text).split('|');
  bars.forEach((bar, bi) => {
    let barSteps = 0;
    for (const tok of bar.trim().split(/\s+/).filter(Boolean)) {
      const [name, lenText] = tok.split(':');
      const len = lenText === undefined ? 1 : Number(lenText);
      if (!Number.isInteger(len) || len < 1) throw new Error(`${label}: bad length in "${tok}"`);
      if (name === 'r' || name === '-') { /* rest */ } else if (/^[khs]$/.test(name)) {
        events.push({ step, len, drum: name });
      } else {
        const midi = midiOf(name);
        if (midi === null) throw new Error(`${label}: bad note "${tok}"`);
        events.push({ step, len, midi });
      }
      step += len;
      barSteps += len;
    }
    if (stepsPerBar && barSteps !== stepsPerBar) warnings.push(`${label}: bar ${bi + 1} has ${barSteps} steps, expected ${stepsPerBar}`);
  });
  return { events, steps: step, warnings };
}

export function parseScore(score) {
  if (score.format !== 'mnemos-score/1') throw new Error('Unknown score format (expected "mnemos-score/1").');
  const bpm = Number(score.bpm);
  const spb = Number(score.stepsPerBeat || 4);
  const spBar = Number(score.stepsPerBar || spb * 4);
  if (!(bpm > 20 && bpm < 300)) throw new Error('bpm must be between 20 and 300.');
  const stepSec = 60 / (bpm * spb);
  const channels = {};
  const warnings = [];
  let steps = 0;
  for (const [name, ch] of Object.entries(score.channels || {})) {
    const p = parseNotes(ch.notes, spBar, name);
    warnings.push(...p.warnings);
    steps = Math.max(steps, p.steps);
    channels[name] = { ...ch, events: p.events };
  }
  return { title: score.title, bpm, stepSec, steps, loop: !!score.loop, channels, warnings };
}

// ---------- synthesis ----------

const polyblep = (t, dt) => {
  if (t < dt) { const x = t / dt; return x + x - x * x - 1; }
  if (t > 1 - dt) { const x = (t - 1) / dt; return x * x + x + x + 1; }
  return 0;
};

// ADSR over a note that is held for `hold` seconds. Returns gain at time t (seconds from note start).
function adsr(t, hold, env) {
  const a = env.a ?? 0.005, d = env.d ?? 0, s = env.s ?? 1, r = env.r ?? 0.03;
  let g;
  if (t < a) g = t / a;
  else if (d > 0 && t < a + d) g = 1 - (1 - s) * ((t - a) / d);
  else g = d > 0 ? s : 1;
  if (t > hold) g *= Math.max(0, 1 - (t - hold) / r);
  return g;
}

const DRUMS = {
  // clock: noise clock in Hz (to: clock at the end, a downward sweep), decay in seconds, short: metallic 93-step mode
  k: { clock: 2400, to: 300, decay: 0.16, short: false, gain: 1.0 },
  s: { clock: 9000, to: 6000, decay: 0.13, short: false, gain: 0.8 },
  h: { clock: 26000, to: 26000, decay: 0.04, short: true, gain: 0.6 },
};

function renderChannel(ch, parsed, rate, total) {
  const out = new Float32Array(total);
  const env = ch.env || {};
  const vol = ch.vol ?? 0.5;
  const gate = ch.gate ?? 0.9;
  const duty = ch.duty ?? 0.5;
  const vib = ch.vibrato;
  for (const ev of ch.events) {
    const start = Math.round(ev.step * parsed.stepSec * rate);
    const dur = ev.len * parsed.stepSec;
    const hold = dur * gate;
    const n = Math.min(total - start, Math.round((dur + (env.r ?? 0.03) + 0.02) * rate));
    if (ch.wave === 'noise') {
      const d = { ...DRUMS[ev.drum], ...(ch.drums && ch.drums[ev.drum]) };
      let lfsr = 1, phase = 0, bit = 1;
      const len = Math.min(n, Math.round(d.decay * rate));
      for (let i = 0; i < len; i++) {
        const t = i / rate;
        const clock = d.clock + (d.to - d.clock) * Math.min(1, t / d.decay);
        phase += clock / rate;
        while (phase >= 1) {
          phase -= 1;
          const x = (lfsr ^ (lfsr >> (d.short ? 6 : 1))) & 1;
          lfsr = (lfsr >> 1) | (x << 14);
          bit = lfsr & 1 ? 1 : -1;
        }
        const e = Math.pow(1 - t / d.decay, 2);
        out[start + i] += bit * e * d.gain * vol;
      }
      continue;
    }
    const f0 = hzOf(ev.midi);
    let phase = 0;
    for (let i = 0; i < n; i++) {
      const t = i / rate;
      let f = f0;
      if (vib && t > (vib.delay ?? 0)) f *= Math.pow(2, ((vib.cents ?? 10) / 1200) * Math.sin(2 * Math.PI * (vib.rate ?? 5) * (t - (vib.delay ?? 0))));
      const dt = f / rate;
      phase += dt;
      if (phase >= 1) phase -= 1;
      let v;
      if (ch.wave === 'triangle') {
        v = 4 * Math.abs(phase - 0.5) - 1;
        const q = ch.steps ?? 16; // the NES triangle is coarse (4 bit), which gives it its character
        v = Math.round(((v + 1) / 2) * (q - 1)) / (q - 1) * 2 - 1;
        out[start + i] += v * vol * adsr(t, hold, { a: 0.002, r: 0.02, ...env });
      } else {
        v = phase < duty ? 1 : -1;
        v += polyblep(phase, dt);
        v -= polyblep((phase - duty + 1) % 1, dt);
        out[start + i] += v * vol * adsr(t, hold, env);
      }
    }
  }
  return out;
}

export function render(score, rate = 44100, loops = 1) {
  const parsed = parseScore(score);
  const reps = parsed.loop ? Math.max(1, loops) : 1;
  const bodySec = parsed.steps * parsed.stepSec;
  const tailSec = parsed.loop ? 0 : 0.5;
  const total = Math.round((bodySec * reps + tailSec) * rate);
  const mix = new Float32Array(total);
  for (const ch of Object.values(parsed.channels)) {
    const one = renderChannel(ch, parsed, rate, Math.round((bodySec + 0.5) * rate));
    for (let r = 0; r < reps; r++) {
      const off = Math.round(bodySec * r * rate);
      for (let i = 0; i < one.length && off + i < total; i++) mix[off + i] += one[i];
    }
  }
  let peak = 0;
  for (let i = 0; i < total; i++) peak = Math.max(peak, Math.abs(mix[i]));
  const k = peak > 0.9 ? 0.9 / peak : 1;
  const master = (score.master ?? 0.5) * k;
  const pcm = new Int16Array(total);
  for (let i = 0; i < total; i++) pcm[i] = Math.max(-32768, Math.min(32767, Math.round(mix[i] * master * 32767)));
  return { pcm, rate, seconds: total / rate, parsed };
}

export function wavBuffer(pcm, rate) {
  const bytes = pcm.length * 2;
  const b = Buffer.alloc(44 + bytes);
  b.write('RIFF', 0); b.writeUInt32LE(36 + bytes, 4); b.write('WAVE', 8);
  b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(bytes, 40);
  for (let i = 0; i < pcm.length; i++) b.writeInt16LE(pcm[i], 44 + i * 2);
  return b;
}

// ---------- command line ----------

function main() {
  const args = process.argv.slice(2);
  const opt = { rate: 44100, loops: 1 };
  const files = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--rate') opt.rate = Number(args[++i]);
    else if (args[i] === '--loops') opt.loops = Number(args[++i]);
    else files.push(args[i]);
  }
  const outDir = path.join(HERE, 'out');
  let jobs;
  if (files.length === 0) {
    const dir = path.join(HERE, 'scores');
    jobs = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => [path.join(dir, f), path.join(outDir, f.replace(/\.json$/, '.wav'))]);
  } else {
    const src = path.resolve(files[0]);
    jobs = [[src, files[1] ? path.resolve(files[1]) : path.join(outDir, path.basename(src).replace(/\.json$/, '.wav'))]];
  }
  for (const [src, dest] of jobs) {
    const score = JSON.parse(fs.readFileSync(src, 'utf8'));
    const r = render(score, opt.rate, opt.loops);
    r.parsed.warnings.forEach((w) => console.warn('warning:', w));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const buf = wavBuffer(r.pcm, r.rate);
    fs.writeFileSync(dest, buf);
    console.log(`${path.basename(dest)}: ${r.seconds.toFixed(2)} s, ${(buf.length / 1024).toFixed(0)} KB, ${r.rate} Hz mono 16-bit  (${r.parsed.title})`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
