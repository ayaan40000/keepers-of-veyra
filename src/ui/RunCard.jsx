// Undercroft run card (v0.9): a small picture of your deepest descent to save or share by hand.
// Drawn on the device; nothing is uploaded. Sharing uses the device's own share sheet when it has one.
import React, { useEffect, useRef, useState } from 'react';
import { bandFor, TREASURES, TABLETS } from '../data/crypt.js';
import { prng } from '../pixel/core.js';

export const CARD_W = 480, CARD_H = 270;

// What the card shows. Pure, so it can be tested.
export function runCardData(profile) {
  const c = profile?.crypt || {};
  const deepest = c.deepest || 0;
  return {
    alias: String(profile?.user?.alias || 'Keeper').slice(0, 24),
    deepest,
    band: bandFor(Math.max(1, deepest)).name,
    runs: c.runs || 0,
    relics: Object.keys(c.treasures || {}).length, relicsTotal: TREASURES.length,
    tablets: Object.keys(c.tablets || {}).length, tabletsTotal: TABLETS.length,
    weekly: Object.values(c.weekly || {}).reduce((a, b) => Math.max(a, b || 0), 0),
  };
}

export function drawRunCard(ctx, d) {
  const r = prng(d.deepest * 7919 + d.runs);
  ctx.imageSmoothingEnabled = false;
  const g = ctx.createLinearGradient(0, 0, 0, CARD_H);
  g.addColorStop(0, '#1a1626'); g.addColorStop(1, '#07060c');
  ctx.fillStyle = g; ctx.fillRect(0, 0, CARD_W, CARD_H);
  // stair of stone blocks going down to the right, one step per 5 floors (at most 12)
  const steps = Math.min(12, Math.max(1, Math.ceil(d.deepest / 5)));
  for (let i = 0; i < steps; i++) {
    const x = 250 + i * 18, y = 40 + i * 16;
    ctx.fillStyle = i % 2 ? '#3a3048' : '#2e2640'; ctx.fillRect(x, y, 212 - i * 18, 16);
    ctx.fillStyle = '#4a3e5a'; ctx.fillRect(x, y, 212 - i * 18, 2);
  }
  // dust motes
  for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(255,217,138,${0.1 + r() * 0.3})`; ctx.fillRect(Math.floor(r() * CARD_W), Math.floor(r() * CARD_H), 2, 2); }
  // lamp glow at the deepest step
  const lx = 250 + (steps - 1) * 18 + 10, ly = 40 + (steps - 1) * 16 - 6;
  const glow = ctx.createRadialGradient(lx, ly, 2, lx, ly, 60);
  glow.addColorStop(0, 'rgba(255,217,138,0.75)'); glow.addColorStop(1, 'rgba(255,217,138,0)');
  ctx.fillStyle = glow; ctx.fillRect(lx - 60, ly - 60, 120, 120);
  ctx.fillStyle = '#ffd98a'; ctx.fillRect(lx - 3, ly - 4, 6, 8); ctx.fillStyle = '#e8b04b'; ctx.fillRect(lx - 4, ly + 4, 8, 2);
  // frame
  ctx.strokeStyle = '#e8b04b'; ctx.lineWidth = 4; ctx.strokeRect(6, 6, CARD_W - 12, CARD_H - 12);
  ctx.strokeStyle = '#6b5a3a'; ctx.lineWidth = 2; ctx.strokeRect(13, 13, CARD_W - 26, CARD_H - 26);
  // words
  const font = (px) => `${px}px "Pixelify Sans", "Silkscreen", monospace`;
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#b8a888'; ctx.font = font(14); ctx.fillText('THE UNDERCROFT', 28, 28);
  ctx.fillStyle = '#ffe39a'; ctx.font = font(44); ctx.fillText(`Floor ${d.deepest}`, 28, 50);
  ctx.fillStyle = '#efe6d2'; ctx.font = font(16); ctx.fillText(d.band, 28, 104);
  ctx.fillStyle = '#b8c2d6'; ctx.font = font(14);
  ctx.fillText(`${d.runs} descent${d.runs === 1 ? '' : 's'}`, 28, 140);
  ctx.fillText(`${d.relics} of ${d.relicsTotal} relics`, 28, 160);
  ctx.fillText(`${d.tablets} of ${d.tabletsTotal} tablets`, 28, 180);
  if (d.weekly) ctx.fillText(`Best weekly descent: floor ${d.weekly}`, 28, 200);
  ctx.fillStyle = '#e8b04b'; ctx.font = font(14); ctx.fillText(d.alias, 28, CARD_H - 44);
  ctx.fillStyle = '#8a8098'; ctx.font = font(12); ctx.fillText('Mnemos: Keepers of Veyra', CARD_W - 200, CARD_H - 42);
}

export default function RunCard({ profile, onClose }) {
  const ref = useRef(null);
  const [msg, setMsg] = useState('');
  const d = runCardData(profile);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    c.width = CARD_W; c.height = CARD_H;
    const draw = () => drawRunCard(c.getContext('2d'), d);
    draw();
    document.fonts?.ready?.then(draw).catch(() => {});
  }, [d.deepest, d.runs, d.relics, d.tablets, d.alias]);
  const blob = () => new Promise((res) => ref.current.toBlob(res, 'image/png'));
  const name = `mnemos-undercroft-floor-${d.deepest}.png`;
  async function save() {
    const b = await blob(); if (!b) return;
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    setMsg('Saved to your downloads.');
  }
  async function share() {
    const b = await blob(); if (!b) return;
    const file = new File([b], name, { type: 'image/png' });
    try { await navigator.share({ files: [file], title: 'My Undercroft descent' }); } catch { /* cancelled */ }
  }
  const canShare = typeof navigator !== 'undefined' && !!navigator.canShare && (() => { try { return navigator.canShare({ files: [new File([''], 'x.png', { type: 'image/png' })] }); } catch { return false; } })();
  return (
    <div className="run-card" role="region" aria-label="Run card">
      <canvas ref={ref} className="px run-card-canvas" role="img" aria-label={`Run card: deepest floor ${d.deepest}, ${d.band}. ${d.relics} relics and ${d.tablets} tablets found.`} />
      <div className="row wrap">
        <button className="btn primary" onClick={save}>Save picture</button>
        {canShare && <button className="btn" onClick={share}>Share</button>}
        <button className="btn ghost" onClick={onClose}>Close</button>
      </div>
      {msg && <p className="small" role="status">{msg}</p>}
      <p className="muted small">The picture is made on this device. It only leaves it if you send it yourself.</p>
    </div>
  );
}
