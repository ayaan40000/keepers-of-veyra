// Chiptune sound effects synthesized with the Web Audio API (no audio files, no network).
// The AudioContext is created lazily on the first user gesture (call unlockAudio from a pointer/key handler).
// Global mute follows p.user.prefs.sound (default false since v0.4); dialogue blips have their own switch (prefs.blips)
// and prefs.volume (0..1) scales everything. The App calls setSoundEnabled / setBlipsEnabled / setVolume when they change.
//
// API: sfx.select() sfx.confirm() sfx.back() sfx.blip() sfx.success() sfx.fail() sfx.chest()
//      sfx.levelUp() sfx.door() sfx.page() sfx.soft()   |  setSoundEnabled(bool) isSoundEnabled() unlockAudio()

let ctx = null;
let master = null;
let noiseBuf = null;
let enabled = false;
let blips = true;
let volume = 0.6;
let unlocked = false;
const VOLUME = 0.2; // master volume at 100%

export function setSoundEnabled(v) { enabled = v === true; }
export function isSoundEnabled() { return enabled; }
export function setBlipsEnabled(v) { blips = v !== false; }
export function setVolume(v) {
  volume = Math.max(0, Math.min(1, Number(v) || 0));
  if (master) master.gain.value = VOLUME * volume;
}

function audio() {
  if (ctx) return ctx;
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!AC) return null;
  try {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = VOLUME * volume;
    master.connect(ctx.destination);
  } catch { ctx = null; }
  return ctx;
}

// Must be called from inside a user gesture handler the first time.
export function unlockAudio() {
  if (!enabled && unlocked) return;
  const c = audio();
  if (!c) return;
  unlocked = true;
  if (c.state === 'suspended') c.resume().catch(() => {});
}

const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

function ready() {
  if (!enabled || !unlocked) return null;
  const c = audio();
  if (!c) return null;
  if (c.state === 'suspended') c.resume().catch(() => {});
  return c;
}

// One enveloped oscillator note. t: start offset (s), d: duration (s).
function note(c, { m, f, to, t = 0, d = 0.08, type = 'square', vol = 0.5, attack = 0.005 }) {
  const o = c.createOscillator();
  const g = c.createGain();
  const s = c.currentTime + t + 0.005;
  o.type = type;
  o.frequency.setValueAtTime(f || hz(m), s);
  if (to) o.frequency.exponentialRampToValueAtTime(to, s + d);
  g.gain.setValueAtTime(0.0001, s);
  g.gain.exponentialRampToValueAtTime(vol, s + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, s + d);
  o.connect(g); g.connect(master);
  o.start(s); o.stop(s + d + 0.03);
}

function noise(c, { t = 0, d = 0.12, vol = 0.3, type = 'bandpass', freq = 1800, to, q = 0.8 }) {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, Math.floor(c.sampleRate * 0.6), c.sampleRate);
    const ch = noiseBuf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
  }
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  const fl = c.createBiquadFilter();
  fl.type = type; fl.Q.value = q;
  const g = c.createGain();
  const s = c.currentTime + t + 0.005;
  fl.frequency.setValueAtTime(freq, s);
  if (to) fl.frequency.exponentialRampToValueAtTime(to, s + d);
  g.gain.setValueAtTime(0.0001, s);
  g.gain.exponentialRampToValueAtTime(vol, s + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, s + d);
  src.connect(fl); fl.connect(g); g.connect(master);
  src.start(s); src.stop(s + d + 0.03);
}

const play = (fn) => () => { const c = ready(); if (c) { try { fn(c); } catch { /* ignore audio errors */ } } };

let lastBlip = 0;
export const sfx = {
  select: play((c) => note(c, { m: 84, d: 0.05, vol: 0.22 })),
  confirm: play((c) => { note(c, { m: 76, d: 0.06, vol: 0.28 }); note(c, { m: 83, t: 0.06, d: 0.1, vol: 0.28 }); }),
  back: play((c) => { note(c, { m: 79, d: 0.06, vol: 0.22 }); note(c, { m: 72, t: 0.06, d: 0.09, vol: 0.22 }); }),
  soft: play((c) => note(c, { m: 81, d: 0.09, type: 'triangle', vol: 0.32 })),
  blip: play((c) => {
    if (!blips) return;
    const now = c.currentTime;
    if (now - lastBlip < 0.045) return; // never machine-gun
    lastBlip = now;
    note(c, { f: 620 + Math.random() * 60, d: 0.035, type: 'square', vol: 0.11, attack: 0.002 });
  }),
  success: play((c) => {
    [72, 76, 79, 84].forEach((m, i) => note(c, { m, t: i * 0.075, d: i === 3 ? 0.28 : 0.09, vol: 0.26 }));
    note(c, { m: 48, d: 0.4, type: 'triangle', vol: 0.35 });
  }),
  fail: play((c) => {
    [67, 63, 60].forEach((m, i) => note(c, { m, t: i * 0.12, d: i === 2 ? 0.3 : 0.12, type: 'triangle', vol: 0.32 }));
  }),
  chest: play((c) => {
    noise(c, { d: 0.14, vol: 0.18, freq: 500, to: 1400, q: 2 });
    [84, 88, 91, 96].forEach((m, i) => note(c, { m, t: 0.12 + i * 0.05, d: i === 3 ? 0.22 : 0.06, vol: 0.18 }));
  }),
  levelUp: play((c) => {
    [72, 76, 79, 84, 79, 84, 88].forEach((m, i) => note(c, { m, t: i * 0.07, d: i === 6 ? 0.35 : 0.08, vol: 0.22 }));
    [60, 64, 67].forEach((m, i) => note(c, { m, t: 0.28 + i * 0.07, d: 0.25, type: 'triangle', vol: 0.3 }));
  }),
  door: play((c) => {
    note(c, { f: 130, to: 62, d: 0.38, type: 'triangle', vol: 0.45 });
    noise(c, { d: 0.3, vol: 0.16, type: 'lowpass', freq: 600, to: 120, q: 0.5 });
  }),
  page: play((c) => noise(c, { d: 0.13, vol: 0.14, type: 'highpass', freq: 2600, to: 900, q: 0.4 })),
};

// Delegated UI sounds: any <button>, role=tab or <summary> click plays a sound.
// data-sfx="name" picks a specific sound ("none" for silence); [data-quiet] silences a subtree.
export function installUiSounds(root = document) {
  if (typeof document === 'undefined' || root.__mnemosSfx) return;
  root.__mnemosSfx = true;
  const unlock = () => unlockAudio();
  root.addEventListener('pointerdown', unlock, true);
  root.addEventListener('keydown', unlock, true);
  root.addEventListener('click', (e) => {
    const el = e.target?.closest?.('button, [role="tab"], summary');
    if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true') return;
    let s = el.getAttribute('data-sfx');
    if (!s) {
      if (el.closest('[data-quiet]')) return;
      if (el.matches('summary')) s = 'page';
      else if (el.classList.contains('primary')) s = 'confirm';
      else if (/^(Leave|Back|Cancel|Hide)\b/.test((el.textContent || '').trim()) || (el.getAttribute('aria-label') || '').startsWith('Leave')) s = 'back';
      else s = 'select';
    }
    if (s !== 'none' && sfx[s]) sfx[s]();
  }, true);
}
