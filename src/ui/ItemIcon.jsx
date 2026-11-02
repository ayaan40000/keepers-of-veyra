// Collection icons and cards. Unowned items render as a dark silhouette with "???" and a hint.
import React, { useEffect, useRef } from 'react';
import { ICONS, rarityFrame } from '../pixel/icons.js';
import { ITEM_BY_ID, RARITY } from '../data/items.js';
import { MODULES } from '../data/curriculum.js';
import { SIDE_QUESTS } from '../data/quests.js';
import { ACHIEVEMENTS } from '../data/story.js';

// Rendering is done here directly (pixel/core.js holds JSX in a .js file and cannot be imported by Vite).
const hexRgba = (hex) => { const h = hex.slice(1); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), h.length >= 8 ? parseInt(h.slice(6, 8), 16) : 255]; };
function put(buf, W, x, y, rgba) {
  const i = (y * W + x) * 4; const t = rgba[3] / 255;
  if (t >= 1 || !buf[i + 3]) { buf.set(rgba, i); if (t < 1 && !buf[i + 3]) buf[i + 3] = rgba[3]; return; }
  for (let k = 0; k < 3; k++) buf[i + k] = buf[i + k] * (1 - t) + rgba[k] * t;
  buf[i + 3] = Math.max(buf[i + 3], rgba[3]);
}
function blit(buf, W, s, ox, oy, map) {
  s.px.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const ch = row[x]; if (ch === '.' || ch === ' ' || !s.pal[ch]) continue; const c = map ? map(ch, s.pal[ch]) : s.pal[ch]; if (c) put(buf, W, x + ox, y + oy, hexRgba(c)); } });
}

const cache = new Map();
export function itemSprite(id, owned = true, showFrame = true) {
  const key = `${id}|${owned ? 1 : 0}|${showFrame ? 1 : 0}`;
  if (cache.has(key)) return cache.get(key);
  const item = ITEM_BY_ID[id];
  const icon = ICONS[id];
  const W = showFrame ? 28 : 24, off = showFrame ? 2 : 0;
  const rgba = new Uint8ClampedArray(W * W * 4);
  if (showFrame) blit(rgba, W, rarityFrame(owned ? item?.rarity || 'common' : 'common'), 0, 0);
  if (icon) {
    blit(rgba, W, icon, off, off, owned ? null : (ch, hex) => (hexRgba(hex)[3] < 200 ? null : ch === 'o' ? '#3a4560' : '#0a0e17'));
  }
  const s = { w: W, h: W, rgba };
  cache.set(key, s);
  return s;
}

function PxCanvas({ sprite, scale, label, className = '', style }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    c.width = sprite.w * scale; c.height = sprite.h * scale;
    const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, c.width, c.height);
    const tmp = document.createElement('canvas'); tmp.width = sprite.w; tmp.height = sprite.h;
    tmp.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(sprite.rgba), sprite.w, sprite.h), 0, 0);
    ctx.drawImage(tmp, 0, 0, c.width, c.height);
  }, [sprite, scale]);
  return <canvas ref={ref} className={`px ${className}`} role="img" aria-label={label} style={{ imageRendering: 'pixelated', width: sprite.w * scale, height: sprite.h * scale, ...style }} />;
}

export function ItemIcon({ id, scale = 3, owned = true, showFrame = true, className = '', style }) {
  const item = ITEM_BY_ID[id];
  const label = owned ? item?.name || id : 'Undiscovered item';
  return <PxCanvas sprite={itemSprite(id, owned, showFrame)} scale={scale} label={label} className={className} style={style} />;
}

const moduleOf = (id) => MODULES.find((m) => m.id === id);
export function itemHint(item) {
  const s = item?.source || {};
  if (s.type === 'start') return 'Yours from the very first morning.';
  if (s.type === 'gate') { const m = moduleOf(s.id); return `Found when the gate of ${m ? m.district : s.id} is passed.`; }
  if (s.type === 'side') { const q = SIDE_QUESTS.find((x) => x.id === s.id); return q ? `A gift for finishing "${q.title}", a favour for ${q.giver}.` : 'A gift for a favour done.'; }
  if (s.type === 'ach') { const a = ACHIEVEMENTS.find((x) => x.id === s.id); return a ? `Pressed for the deed "${a.name}": ${a.desc}` : 'Pressed for a deed worth remembering.'; }
  if (s.type === 'crypt') return `Lies ${s.depth} levels down in the Crypt.`;
  if (s.type === 'milestone') return 'Pressed for delayed recall that held for weeks and months.';
  if (s.type === 'held') return `Yours when ${s.n} delayed recalls have held.`;
  if (s.type === 'polish') return `Turns up once you have polished ${s.n} relic${s.n > 1 ? 's' : ''} with recall cards.`;
  if (s.type === 'levels') return `Earned when your skills have gained ${s.n} level${s.n > 1 ? 's' : ''} in all.`;
  return '';
}

export function ItemCard({ id, owned, scale = 3 }) {
  const item = ITEM_BY_ID[id];
  if (!item) return null;
  const rar = RARITY[item.rarity] || RARITY.common;
  return (
    <div className={`item-card ${owned ? 'owned' : 'unowned'}`} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: 12, borderRadius: 14, border: '1px solid var(--line)', background: 'var(--card)' }}>
      <ItemIcon id={id} owned={owned} scale={scale} style={{ flex: '0 0 auto' }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: '1.05rem', color: owned ? 'var(--ink)' : 'var(--muted)' }}>{owned ? item.name : '???'}</div>
        <div className="small" style={{ color: owned ? rar.color : 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', fontSize: '.7rem', margin: '2px 0 6px' }}>
          {owned ? rar.label : 'Undiscovered'}
        </div>
        <p className="small" style={{ margin: 0, color: owned ? 'var(--ink-2)' : 'var(--muted)', fontStyle: owned ? 'normal' : 'italic' }}>
          {owned ? item.lore : itemHint(item)}
        </p>
      </div>
    </div>
  );
}
