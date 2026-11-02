// WorldMap: the pixel-art map of Veyra. Static layers are built once (memoised) and uploaded to
// offscreen canvases; each frame only composites them and draws small animated overlays.
import React, { useEffect, useMemo, useRef } from 'react';
import { MODULES } from '../../data/curriculum.js';
import {
  MAP_W, MAP_H, LANDMARKS, DISTRICT_IDS, DISTRICT_POS as POS, K, css,
  buildMapBase, buildMapState, toCanvas, reducedMotion, subscribeFrame, mapFog, drawStars, drawWaves, drawLights, drawFog, drawFalls, drawFlow,
} from './world.js';

export const DISTRICT_POS = POS;
export { MAP_W, MAP_H };

const stateCanvasCache = new Map();
function stateLayer(gates, current) {
  const key = [...gates].sort().join(',') + '|' + current;
  if (stateCanvasCache.has(key)) return stateCanvasCache.get(key);
  const st = buildMapState(gates, current);
  const v = { canvas: toCanvas(st.p), lights: st.lights, states: st.states, fog: mapFog(st.states) };
  if (stateCanvasCache.size > 6) stateCanvasCache.delete(stateCanvasCache.keys().next().value);
  stateCanvasCache.set(key, v);
  return v;
}

const AMBER = css(K.am4), AMBER2 = css(K.am3), INK = css(K.ink), BEAM = css(K.am3, 0.22), BEAM2 = css(K.am4, 0.4);

function drawBeacon(ctx, id, t) {
  const s = LANDMARKS[id];
  const cx = s.x0 + (s.w >> 1), top = s.y0 - 2;
  const pulse = (Math.sin(t * 3) + 1) / 2;
  const bob = Math.round(Math.sin(t * 2.4) * 1.5);
  // light column
  ctx.fillStyle = BEAM; ctx.fillRect(cx - 1, Math.max(0, top - 22), 3, 22);
  if (pulse > 0.5) { ctx.fillStyle = BEAM2; ctx.fillRect(cx, Math.max(0, top - 22), 1, 22); }
  // diamond marker
  const y = top - 9 + bob;
  ctx.fillStyle = INK; ctx.fillRect(cx - 3, y - 1, 7, 5); ctx.fillRect(cx - 2, y - 3, 5, 9); ctx.fillRect(cx - 1, y - 4, 3, 11);
  ctx.fillStyle = pulse > 0.5 ? AMBER : AMBER2;
  ctx.fillRect(cx - 2, y, 5, 3); ctx.fillRect(cx - 1, y - 2, 3, 7); ctx.fillRect(cx, y - 3, 1, 9);
  ctx.fillStyle = css(K.am5); ctx.fillRect(cx - 1, y - 1, 1, 2);
  // ground ring
  const r = 6 + Math.round(pulse * 4);
  ctx.fillStyle = css(K.am3, 0.45 * (1 - pulse) + 0.15);
  for (let a = 0; a < 24; a++) { const ang = (a / 24) * Math.PI * 2; ctx.fillRect(Math.round(cx + Math.cos(ang) * (s.w / 2 + r - 6)), Math.round(s.y0 + s.h - 2 + Math.sin(ang) * (r * 0.45)), 1, 1); }
}
function drawSelection(ctx, id, t) {
  const s = LANDMARKS[id];
  const x0 = s.x0 - 3, y0 = s.y0 - 3, x1 = s.x0 + s.w + 2, y1 = s.y0 + s.h + 2;
  const o = Math.round((Math.sin(t * 4) + 1) / 2);
  const L = 5;
  const corner = (x, y, dx, dy) => {
    ctx.fillStyle = INK; ctx.fillRect(Math.min(x, x + dx * L) - 1, y - 1, L + 2, 3); ctx.fillRect(x - 1, Math.min(y, y + dy * L) - 1, 3, L + 2);
    ctx.fillStyle = AMBER; ctx.fillRect(Math.min(x, x + dx * (L - 1)), y, L, 1); ctx.fillRect(x, Math.min(y, y + dy * (L - 1)), 1, L);
  };
  corner(x0 - o, y0 - o, 1, 1); corner(x1 + o, y0 - o, -1, 1); corner(x0 - o, y1 + o, 1, -1); corner(x1 + o, y1 + o, -1, -1);
}

// Day and night (v0.6): the map takes the light of the player's own clock. A tint layer over the night art.
export function timeOfDay(h = new Date().getHours()) {
  return h >= 5 && h < 8 ? 'dawn' : h >= 8 && h < 17 ? 'day' : h >= 17 && h < 20 ? 'dusk' : 'night';
}

// Gate restoration (v0.6): light pours out of the district and pushes the fog back. About 3 seconds.
const RESTORE_SECS = 3.2;
function drawRestore(ctx, id, k) {
  const s = LANDMARKS[id];
  if (!s) return;
  const cx = s.x0 + (s.w >> 1), cy = s.y0 + (s.h >> 1);
  const r = 4 + k * 70;
  const fade = 1 - k;
  for (let ring = 0; ring < 3; ring++) {
    const rr = r - ring * 9;
    if (rr <= 0) continue;
    ctx.fillStyle = css(ring === 0 ? K.am5 : K.am3, 0.75 * fade);
    const n = Math.max(16, Math.round(rr * 2.2));
    for (let a = 0; a < n; a++) {
      const ang = (a / n) * Math.PI * 2;
      ctx.fillRect(Math.round(cx + Math.cos(ang) * rr), Math.round(cy + Math.sin(ang) * rr * 0.55), 2, 1);
    }
  }
  ctx.fillStyle = css(K.am4, 0.5 * fade);
  ctx.fillRect(cx - 1, Math.max(0, s.y0 - 40 * (1 - k * 0.3)), 3, 40);
  ctx.fillStyle = css(K.am5, 0.35 * fade * fade);
  ctx.fillRect(s.x0 - 2, s.y0 - 2, s.w + 4, s.h + 4);
}

export default function WorldMap({ gates = [], current = 'M1', selected, onSelect, restoring, onRestored, className = '' }) {
  const ref = useRef(null);
  const gatesKey = gates.join(',');
  const layer = useMemo(() => (typeof document === 'undefined' ? null : stateLayer(gates, current)), [gatesKey, current]);
  const selRef = useRef(selected); selRef.current = selected;
  const base = useMemo(() => buildMapBase(), []);
  const restoreRef = useRef(null);
  const doneRef = useRef(onRestored); doneRef.current = onRestored;
  useEffect(() => {
    if (!restoring) return undefined;
    if (reducedMotion()) { doneRef.current?.(); return undefined; }
    restoreRef.current = { id: restoring, start: null };
    const id = setTimeout(() => { restoreRef.current = null; ref.current?._redraw?.(); doneRef.current?.(); }, RESTORE_SECS * 1000 + 200);
    return () => clearTimeout(id);
  }, [restoring]);

  useEffect(() => {
    const c = ref.current; if (!c || !layer) return undefined;
    c.width = MAP_W; c.height = MAP_H;
    const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
    const frameFn = (t, frame) => {
      ctx.drawImage(layer.canvas, 0, 0);
      drawStars(ctx, base.stars, t);
      drawWaves(ctx, base.waves, t);
      drawFlow(ctx, base.flow, frame);
      drawFalls(ctx, base.falls, frame);
      drawLights(ctx, layer.lights, t, frame);
      drawFog(ctx, layer.fog, t);
      if (current && LANDMARKS[current] && layer.states[current] !== 'restored') drawBeacon(ctx, current, t);
      if (selRef.current && LANDMARKS[selRef.current]) drawSelection(ctx, selRef.current, t);
      const rs = restoreRef.current;
      if (rs) { if (rs.start == null) rs.start = t; const k = (t - rs.start) / RESTORE_SECS; if (k < 1) drawRestore(ctx, rs.id, k); }
    };
    const still = reducedMotion();
    let lastT = 0, lastF = 0;
    const fn = (t, frame) => { lastT = t; lastF = frame; frameFn(t, frame); };
    fn(0, 0);
    c._redraw = () => frameFn(lastT, lastF);
    if (still) return undefined;
    return subscribeFrame(fn);
  }, [layer, current, base]);
  useEffect(() => { ref.current?._redraw?.(); }, [selected]);

  const states = layer?.states || {};
  return (
    <div className={`worldmap ${className}`} data-time={timeOfDay()} style={{ position: 'relative', width: '100%', maxWidth: 720, margin: '0 auto', aspectRatio: `${MAP_W} / ${MAP_H}`, background: css(K.sky0), overflow: 'hidden' }}>
      <style>{`.worldmap .wm-hit{position:absolute;background:transparent;border:0;padding:0;margin:0;cursor:pointer;border-radius:4px;outline:none;-webkit-tap-highlight-color:transparent}
.worldmap .wm-hit:focus-visible{box-shadow:0 0 0 2px ${css(K.ink)},0 0 0 4px ${css(K.am4)}}
.worldmap .wm-label{position:absolute;transform:translate(-50%,0);white-space:nowrap;pointer-events:none;font:12px/1.1 'Silkscreen','VT323',monospace;color:${css(K.am5)};background:${css(K.ink, 0.86)};border:1px solid ${css(K.am2)};padding:3px 6px 2px;letter-spacing:.02em;image-rendering:pixelated}
.worldmap canvas{display:block;width:100%;height:100%;image-rendering:pixelated;image-rendering:crisp-edges}`}</style>
      <canvas ref={ref} role="img" aria-label={`Map of Veyra. ${DISTRICT_IDS.filter((id) => states[id] === 'restored').length} of 12 districts restored.`} />
      <nav aria-label="Districts of Veyra" style={{ position: 'absolute', inset: 0 }}>
        {DISTRICT_IDS.map((id) => {
          const s = LANDMARKS[id];
          const mod = MODULES.find((m) => m.id === id);
          const st = states[id] || 'lost';
          const label = `${mod?.district || id}, month ${mod?.month ?? ''}: ${st === 'restored' ? 'restored' : st === 'current' ? 'current district' : 'lost in the Tide'}`;
          return (
            <button key={id} type="button" className="wm-hit" aria-label={label} aria-pressed={selected === id}
              onClick={() => onSelect?.(id)}
              style={{ left: `${((s.x0 - 2) / MAP_W) * 100}%`, top: `${((s.y0 - 2) / MAP_H) * 100}%`, width: `${((s.w + 4) / MAP_W) * 100}%`, height: `${((s.h + 4) / MAP_H) * 100}%` }} />
          );
        })}
      </nav>
      {selected && LANDMARKS[selected] && (() => {
        const s = LANDMARKS[selected]; const mod = MODULES.find((m) => m.id === selected);
        const below = s.y0 + s.h < 262;
        const lx = Math.min(Math.max(s.x0 + s.w / 2, 40), MAP_W - 40);
        return <div className="wm-label" aria-hidden="true" style={{ left: `${(lx / MAP_W) * 100}%`, top: below ? `${((s.y0 + s.h + 5) / MAP_H) * 100}%` : `calc(${((s.y0 - (selected === current ? 18 : 6)) / MAP_H) * 100}% - 20px)` }}>{mod?.district}</div>;
      })()}
    </div>
  );
}
