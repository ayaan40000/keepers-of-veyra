import React from 'react';
import { rng } from '../engine/util.js';

const SKIN = ['#F2D0B5', '#E3B48F', '#C98E66', '#A86B45', '#7A4A2E', '#5A3520'];
const HAIR = ['#1E1A17', '#3B2A1E', '#6B4A2B', '#A9773F', '#D8B26A', '#8C8C8C', '#B5452F'];
const SHIRT = ['#3E5C76', '#7FB3A6', '#B9A27C', '#8E6C8A', '#C46A4A', '#4F6D3A', '#2F3A56'];

// Original procedural illustrated face. Deterministic per seed.
export function Face({ seed, size = 140, label }) {
  const r = rng(seed);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const skin = pick(SKIN), hair = pick(HAIR), shirt = pick(SHIRT);
  const fw = 52 + r() * 14, fh = 62 + r() * 12;
  const eyeY = 98 + r() * 6, eyeDX = 17 + r() * 6, eyeR = 3 + r() * 2.2;
  const browTilt = (r() - 0.5) * 8, browW = 2 + r() * 3;
  const noseType = Math.floor(r() * 3), mouthType = Math.floor(r() * 3), hairType = Math.floor(r() * 6);
  const glasses = r() < 0.22, beard = r() < 0.25, freckles = r() < 0.18, earring = r() < 0.2, mole = r() < 0.15;
  const earR = 7 + r() * 5;
  const cx = 100, cy = 105;
  const top = cy - fh;
  return (
    <svg viewBox="0 0 200 220" width={size} height={size * 1.1} role="img" aria-label={label || 'Illustrated face'}>
      <rect width="200" height="220" rx="16" fill="var(--face-bg)" />
      <path d={`M40 220 Q50 168 100 166 Q150 168 160 220Z`} fill={shirt} />
      <rect x={cx - 12} y={cy + fh - 14} width="24" height="22" fill={skin} />
      {hairType === 4 && <path d={`M${cx - fw - 6} ${cy} Q${cx - fw - 10} ${cy + 60} ${cx - fw + 10} ${cy + 72} L${cx + fw - 10} ${cy + 72} Q${cx + fw + 10} ${cy + 60} ${cx + fw + 6} ${cy}Z`} fill={hair} />}
      <ellipse cx={cx - fw + 2} cy={cy + 2} rx={earR * 0.7} ry={earR} fill={skin} />
      <ellipse cx={cx + fw - 2} cy={cy + 2} rx={earR * 0.7} ry={earR} fill={skin} />
      {earring && <circle cx={cx + fw - 2} cy={cy + earR + 4} r="3.5" fill="#E8B04B" />}
      <ellipse cx={cx} cy={cy} rx={fw} ry={fh} fill={skin} />
      {beard && <path d={`M${cx - fw + 6} ${cy + 8} Q${cx} ${cy + fh + 18} ${cx + fw - 6} ${cy + 8} Q${cx} ${cy + fh - 4} ${cx - fw + 6} ${cy + 8}Z`} fill={hair} opacity="0.92" />}
      {hairType === 0 && <path d={`M${cx - fw} ${cy - 6} Q${cx - fw} ${top - 8} ${cx} ${top - 10} Q${cx + fw} ${top - 8} ${cx + fw} ${cy - 6} Q${cx + fw - 8} ${top + 22} ${cx} ${top + 18} Q${cx - fw + 8} ${top + 22} ${cx - fw} ${cy - 6}Z`} fill={hair} />}
      {hairType === 1 && <path d={`M${cx - fw - 2} ${cy - 2} Q${cx - fw - 6} ${top - 14} ${cx + 10} ${top - 12} Q${cx + fw + 8} ${top} ${cx + fw + 2} ${cy - 10} L${cx + fw - 12} ${top + 26} Q${cx - 10} ${top + 10} ${cx - fw + 4} ${top + 34}Z`} fill={hair} />}
      {hairType === 2 && <ellipse cx={cx} cy={top + 6} rx={fw + 4} ry={22} fill={hair} />}
      {hairType === 3 && <g fill={hair}>{Array.from({ length: 9 }, (_, i) => <circle key={i} cx={cx - fw + 8 + i * ((fw * 2 - 16) / 8)} cy={top + 6 + (i % 2) * 6} r={13} />)}</g>}
      {hairType === 4 && <path d={`M${cx - fw - 4} ${cy + 4} Q${cx - fw} ${top - 10} ${cx} ${top - 10} Q${cx + fw} ${top - 10} ${cx + fw + 4} ${cy + 4} L${cx + fw - 6} ${top + 24} Q${cx} ${top + 6} ${cx - fw + 6} ${top + 24}Z`} fill={hair} />}
      {hairType === 5 && <path d={`M${cx - fw + 6} ${top + 22} Q${cx} ${top - 2} ${cx + fw - 6} ${top + 22} Q${cx} ${top + 12} ${cx - fw + 6} ${top + 22}Z`} fill={hair} opacity="0.85" />}
      <g stroke={hair} strokeWidth={browW} strokeLinecap="round">
        <line x1={cx - eyeDX - 9} y1={eyeY - 12 + browTilt} x2={cx - eyeDX + 8} y2={eyeY - 13 - browTilt / 2} />
        <line x1={cx + eyeDX - 8} y1={eyeY - 13 - browTilt / 2} x2={cx + eyeDX + 9} y2={eyeY - 12 + browTilt} />
      </g>
      <circle cx={cx - eyeDX} cy={eyeY} r={eyeR} fill="#1d1d24" />
      <circle cx={cx + eyeDX} cy={eyeY} r={eyeR} fill="#1d1d24" />
      {glasses && <g fill="none" stroke="#2a2a33" strokeWidth="2.5"><circle cx={cx - eyeDX} cy={eyeY} r={11} /><circle cx={cx + eyeDX} cy={eyeY} r={11} /><line x1={cx - eyeDX + 11} y1={eyeY} x2={cx + eyeDX - 11} y2={eyeY} /></g>}
      {noseType === 0 && <path d={`M${cx} ${eyeY + 6} L${cx - 6} ${eyeY + 24} L${cx + 4} ${eyeY + 25}`} fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="2.2" strokeLinecap="round" />}
      {noseType === 1 && <ellipse cx={cx} cy={eyeY + 22} rx={8} ry={5} fill="rgba(0,0,0,.18)" />}
      {noseType === 2 && <path d={`M${cx - 2} ${eyeY + 4} Q${cx + 8} ${eyeY + 18} ${cx - 2} ${eyeY + 26}`} fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="2.4" strokeLinecap="round" />}
      {mouthType === 0 && <path d={`M${cx - 14} ${eyeY + 38} Q${cx} ${eyeY + 48} ${cx + 14} ${eyeY + 38}`} fill="none" stroke="#7a2e2e" strokeWidth="3" strokeLinecap="round" />}
      {mouthType === 1 && <line x1={cx - 12} y1={eyeY + 41} x2={cx + 12} y2={eyeY + 41} stroke="#7a2e2e" strokeWidth="3" strokeLinecap="round" />}
      {mouthType === 2 && <ellipse cx={cx} cy={eyeY + 41} rx={10} ry={5} fill="#7a2e2e" />}
      {freckles && <g fill="rgba(90,50,30,.45)">{[-24, -18, -21, 18, 24, 21].map((dx, i) => <circle key={i} cx={cx + dx} cy={eyeY + 16 + (i % 3) * 4} r="1.6" />)}</g>}
      {mole && <circle cx={cx + 18} cy={eyeY + 32} r="2.4" fill="rgba(60,30,20,.7)" />}
    </svg>
  );
}

export function Wren({ glow = 0.3, size = 72 }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} aria-hidden="true" className="wren">
      <defs>
        <radialGradient id="wglow"><stop offset="0" stopColor="#FFD98A" stopOpacity={0.9 * glow + 0.1} /><stop offset="1" stopColor="#E8B04B" stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx="58" cy="52" r={12 + 14 * glow} fill="url(#wglow)" />
      <path d="M22 78 L26 44 Q32 36 40 36 Q48 36 52 44 L56 78Z" fill="#2F3A56" stroke="var(--ink-2)" strokeWidth="1" />
      <circle cx="39" cy="26" r="10" fill="#C98E66" />
      <path d="M29 25 Q30 13 40 14 Q50 14 49 24 Q44 19 34 22Z" fill="#1E1A17" />
      <rect x="31" y="48" width="6" height="8" rx="1" fill="#EFE6D2" transform="rotate(-8 34 52)" />
      <line x1="52" y1="44" x2="58" y2="44" stroke="#8a7a5a" strokeWidth="1.5" />
      <rect x="54" y="45" width="8" height="12" rx="2" fill="#B08A3E" />
      <rect x="56" y="47" width="4" height="8" fill="#FFE2A0" opacity={0.4 + 0.6 * glow} />
    </svg>
  );
}

export const AVATARS = ['lantern', 'key', 'compass', 'quill', 'tower', 'wave'];
export function Sigil({ kind, size = 48 }) {
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const shapes = {
    lantern: <g {...s}><path d="M18 14h12M20 14v-4h8v4M16 18h16l-2 18H18z" /><path d="M24 22v8" /></g>,
    key: <g {...s}><circle cx="16" cy="24" r="7" /><path d="M23 24h16M33 24v6M38 24v4" /></g>,
    compass: <g {...s}><circle cx="24" cy="24" r="15" /><path d="M24 12l4 12-4 12-4-12z" /></g>,
    quill: <g {...s}><path d="M36 8C22 12 14 24 12 40M36 8c-2 10-8 18-18 24M16 30h8" /></g>,
    tower: <g {...s}><path d="M16 40V18l8-8 8 8v22M12 40h24M21 40v-8h6v8M22 22h4" /></g>,
    wave: <g {...s}><path d="M6 30c6-8 12-8 18 0s12 8 18 0M6 22c6-8 12-8 18 0s12 8 18 0" /></g>,
  };
  return <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">{shapes[kind] || shapes.lantern}</svg>;
}
