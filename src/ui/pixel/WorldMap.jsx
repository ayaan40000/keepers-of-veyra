// WorldMap: the pixel-art map of Veyra. Static layers are built once (memoised) and uploaded to
// offscreen canvases; each frame only composites them and draws small animated overlays.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { paintedScene, loadPlates, regionMask, maskBlend } from '../../pixel/painted.js';
import { drawFolk, drawBoats, drawBirds, drawSmoke, drawLanterns } from './mapLife.js';
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

function drawBeacon(ctx, id, t, L = LANDMARKS) {
  const s = L[id];
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
function drawSelection(ctx, id, t, L = LANDMARKS) {
  const s = L[id];
  const x0 = s.x0 - 3, y0 = s.y0 - 3, x1 = s.x0 + s.w + 2, y1 = s.y0 + s.h + 2;
  const o = Math.round((Math.sin(t * 4) + 1) / 2);
  const CL = 5;
  const corner = (x, y, dx, dy) => {
    ctx.fillStyle = INK; ctx.fillRect(Math.min(x, x + dx * CL) - 1, y - 1, CL + 2, 3); ctx.fillRect(x - 1, Math.min(y, y + dy * CL) - 1, 3, CL + 2);
    ctx.fillStyle = AMBER; ctx.fillRect(Math.min(x, x + dx * (CL - 1)), y, CL, 1); ctx.fillRect(x, Math.min(y, y + dy * (CL - 1)), 1, CL);
  };
  corner(x0 - o, y0 - o, 1, 1); corner(x1 + o, y0 - o, -1, 1); corner(x0 - o, y1 + o, 1, -1); corner(x1 + o, y1 + o, -1, -1);
}

// Day and night (v0.6): the map takes the light of the player's own clock. A tint layer over the night art.
export function timeOfDay(h = new Date().getHours()) {
  return h >= 5 && h < 8 ? 'dawn' : h >= 8 && h < 17 ? 'day' : h >= 17 && h < 20 ? 'dusk' : 'night';
}

// Gate restoration (v0.6): light pours out of the district and pushes the fog back. About 3 seconds.
const RESTORE_SECS = 3.2;
function drawRestore(ctx, id, k, L = LANDMARKS) {
  const s = L[id];
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

// Lethe Brambles (1.1): small code-drawn thorny vines at the foot of a district, one clump per slipped item (up to four).
// They sway only when motion is allowed. They never cover the district's button, so the map stays fully usable.
function drawBrambles(ctx, id, n, t, L = LANDMARKS) {
  const s = L[id];
  if (!s || n <= 0) return;
  const clumps = Math.min(4, n);
  const y0 = s.y0 + s.h - 1;
  for (let c = 0; c < clumps; c++) {
    const x0 = s.x0 + 2 + Math.round(((c + 0.5) / clumps) * (s.w - 4));
    const sway = Math.round(Math.sin(t * 1.6 + c * 1.7));
    ctx.fillStyle = '#16231a';
    for (let k = 0; k < 9; k++) ctx.fillRect(x0 - 2 + (k % 2) * 2 + Math.round(Math.sin(k * 0.9) * 2) + (k > 5 ? sway : 0), y0 - k - 1, 3, 3);
    ctx.fillStyle = '#5b7f4e';
    for (let k = 0; k < 9; k++) ctx.fillRect(x0 - 1 + (k % 2) * 2 + Math.round(Math.sin(k * 0.9) * 2) + (k > 5 ? sway : 0), y0 - k, 1, 1);
    ctx.fillStyle = '#c9d8b0';
    ctx.fillRect(x0 - 3, y0 - 6, 1, 1); ctx.fillRect(x0 + 3, y0 - 3, 1, 1); ctx.fillRect(x0 + 2 + sway, y0 - 9, 1, 1);
  }
}
// A bramble burning away: amber sparks rising from the foot of the district for about 3 seconds.
const BURN_SECS = 3;
function drawBurn(ctx, id, k, L = LANDMARKS) {
  const s = L[id];
  if (!s) return;
  const y0 = s.y0 + s.h - 1;
  for (let i = 0; i < 18; i++) {
    const x = s.x0 + 2 + ((i * 37) % Math.max(4, s.w - 4));
    const y = y0 - Math.round(k * (10 + (i % 5) * 6)) - (i % 3);
    ctx.fillStyle = css(i % 2 ? K.am5 : K.am3, Math.max(0, 0.9 * (1 - k)));
    ctx.fillRect(x, y, 1, i % 4 === 0 ? 2 : 1);
  }
}

// Painted map (Part B, Nov 8, 2026): two pictures from the local image model, the city lost and restored
// (src/data/scenes.js 'world_map'). Each restored district shows the restored picture, blended into its
// neighbours with a dither; the code overlays (beacon, selection, brambles, bursts, fog) are drawn on top at
// the painting's scale, and code-drawn life moves through the restored streets (./mapLife.js). Without a
// painted map, the code-drawn map below is used as before.
const PAINTED = paintedScene('world_map');
const RESTORE_V = { restored: 1, current: 0.45, lost: 0 };
// The painted map's district boxes in map units (the picture's pixels / PK, so the code overlays keep their size).
// motion.py writes `anchors` ([x, y, w, h] in picture pixels, one per district and the Archive) for the painting's
// own buildings; a painting without anchors uses the code map's positions.
const PK = PAINTED ? PAINTED.w / MAP_W : 1;
const PAINTED_L = PAINTED && PAINTED.anchors ? Object.fromEntries(Object.entries(PAINTED.anchors).map(([id, [x, y, w, h]]) => {
  const s = { x0: x / PK, y0: y / PK, w: w / PK, h: h / PK };
  return [id, { ...s, mx: s.x0 + s.w / 2, my: s.y0 + s.h }];
})) : LANDMARKS;
const PAINTED_H = PAINTED ? PAINTED.h / PK : MAP_H;
function districtNodes(states, override) {
  return Object.keys(PAINTED_L).map((id) => {
    const s = PAINTED_L[id];
    const v = id === 'archive' ? 1 : override && override.id === id ? override.v : RESTORE_V[states[id] || 'lost'];
    return { x: (s.x0 + s.w / 2) * PK, y: (s.y0 + s.h / 2) * PK, v };
  });
}
function usePaintedPlates() {
  const [plates, setPlates] = useState(() => { if (!PAINTED) return null; const r = loadPlates(PAINTED); return r.ready ? r : null; });
  useEffect(() => { if (PAINTED && !plates) loadPlates(PAINTED, setPlates); }, []);
  return PAINTED && plates ? plates : null;
}

export default function WorldMap({ gates = [], current = 'M1', selected, onSelect, restoring, onRestored, brambles = null, burning = null, onBurned, className = '' }) {
  const ref = useRef(null);
  const gatesKey = gates.join(',');
  const layer = useMemo(() => (typeof document === 'undefined' ? null : stateLayer(gates, current)), [gatesKey, current]);
  const selRef = useRef(selected); selRef.current = selected;
  const base = useMemo(() => buildMapBase(), []);
  const restoreRef = useRef(null);
  const doneRef = useRef(onRestored); doneRef.current = onRestored;
  const bramRef = useRef(brambles); bramRef.current = brambles;
  const burnRef = useRef(null);
  const burnedDone = useRef(onBurned); burnedDone.current = onBurned;
  useEffect(() => {
    if (!burning) return undefined;
    if (reducedMotion()) { burnedDone.current?.(); return undefined; }
    burnRef.current = { id: burning, start: null };
    const id = setTimeout(() => { burnRef.current = null; ref.current?._redraw?.(); burnedDone.current?.(); }, BURN_SECS * 1000 + 200);
    return () => clearTimeout(id);
  }, [burning]);
  useEffect(() => {
    if (!restoring) return undefined;
    if (reducedMotion()) { doneRef.current?.(); return undefined; }
    restoreRef.current = { id: restoring, start: null };
    const id = setTimeout(() => { restoreRef.current = null; ref.current?._redraw?.(); doneRef.current?.(); }, RESTORE_SECS * 1000 + 200);
    return () => clearTimeout(id);
  }, [restoring]);

  const plates = usePaintedPlates();
  useEffect(() => {
    const c = ref.current; if (!c || !layer) return undefined;
    if (plates) return paintedLoop(c, plates);
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
      if (bramRef.current) for (const bid of Object.keys(bramRef.current)) drawBrambles(ctx, bid, bramRef.current[bid], t);
      const bs = burnRef.current;
      if (bs) { if (bs.start == null) bs.start = t; const kb = (t - bs.start) / BURN_SECS; if (kb < 1) drawBurn(ctx, bs.id, kb); }
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
  }, [layer, current, base, plates]);

  // The painted map's frame loop: lost picture, restored picture through the district mask, life, overlays.
  function paintedLoop(c, pl) {
    const P = PAINTED, k = PK, L = PAINTED_L;
    c.width = P.w; c.height = P.h;
    const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
    const still = reducedMotion();
    const opts = { cell: 2, soft: 90 * k * k };
    const fixed = regionMask(P.w, P.h, districtNodes(layer.states), opts);
    const fog = mapFog(layer.states, L, false);
    const lamps = P.lamps || [];
    const seaY = P.sea != null ? P.sea / k : undefined;
    const frameFn = (t) => {
      const rs = restoreRef.current;
      if (rs && rs.start == null) rs.start = t;
      const kr = rs ? Math.min(1, (t - rs.start) / RESTORE_SECS) : 1;
      // a district being restored fills in with the restored picture over the burst's few seconds
      const m = rs && kr < 1 ? regionMask(P.w, P.h, districtNodes(layer.states, { id: rs.id, v: kr * kr * (3 - 2 * kr) }), opts) : fixed;
      maskBlend(ctx, P, pl, m);
      const on = (x, y) => m.data[Math.min(m.h - 1, y >> 1) * m.w + Math.min(m.w - 1, x >> 1)] === 1;
      drawLanterns(ctx, lamps, t, on);
      drawSmoke(ctx, layer.states, t, k, L);
      drawBoats(ctx, layer.states, t, k, P.w, seaY);
      drawBirds(ctx, t, k, P.w);
      drawFolk(ctx, layer.states, t, k, L, P.anchors ? null : undefined);
      ctx.save(); ctx.setTransform(k, 0, 0, k, 0, 0);
      drawFog(ctx, fog, t);
      if (current && L[current] && layer.states[current] !== 'restored') drawBeacon(ctx, current, t, L);
      if (selRef.current && L[selRef.current]) drawSelection(ctx, selRef.current, t, L);
      if (bramRef.current) for (const bid of Object.keys(bramRef.current)) drawBrambles(ctx, bid, bramRef.current[bid], t, L);
      const bs = burnRef.current;
      if (bs) { if (bs.start == null) bs.start = t; const kb = (t - bs.start) / BURN_SECS; if (kb < 1) drawBurn(ctx, bs.id, kb, L); }
      if (rs && kr < 1) drawRestore(ctx, rs.id, kr, L);
      ctx.restore();
    };
    let lastT = 0;
    const fn = (t) => { lastT = t; frameFn(t); };
    fn(0);
    c._redraw = () => frameFn(lastT);
    if (still) return undefined;
    return subscribeFrame(fn);
  }
  useEffect(() => { ref.current?._redraw?.(); }, [selected, JSON.stringify(brambles)]);

  const states = layer?.states || {};
  // district boxes and map height in map units: the painting's own when a painted map is showing
  const L = plates ? PAINTED_L : LANDMARKS, MH = plates ? PAINTED_H : MAP_H;
  // Layered depth (v0.8): the city shifts a few pixels with the pointer while the mist layer drifts the other way.
  const depth = (e) => {
    if (reducedMotion()) return;
    const el = e.currentTarget, b = el.getBoundingClientRect();
    el.style.setProperty('--dx', (((e.clientX - b.left) / b.width) - 0.5).toFixed(3));
    el.style.setProperty('--dy', (((e.clientY - b.top) / b.height) - 0.5).toFixed(3));
  };
  const flat = (e) => { e.currentTarget.style.setProperty('--dx', '0'); e.currentTarget.style.setProperty('--dy', '0'); };
  return (
    <div className={`worldmap ${className}`} data-time={timeOfDay()} onPointerMove={depth} onPointerLeave={flat} style={{ position: 'relative', width: '100%', maxWidth: 720, margin: '0 auto', aspectRatio: `${MAP_W} / ${MH}`, background: css(K.sky0), overflow: 'hidden' }}>
      <style>{`.worldmap .wm-hit{position:absolute;background:transparent;border:0;padding:0;margin:0;cursor:pointer;border-radius:4px;outline:none;-webkit-tap-highlight-color:transparent}
.worldmap .wm-hit:focus-visible{box-shadow:0 0 0 2px ${css(K.ink)},0 0 0 4px ${css(K.am4)}}
.worldmap .wm-label{position:absolute;transform:translate(-50%,0);white-space:nowrap;pointer-events:none;font:12px/1.1 'Silkscreen','VT323',monospace;color:${css(K.am5)};background:${css(K.ink, 0.86)};border:1px solid ${css(K.am2)};padding:3px 6px 2px;letter-spacing:.02em;image-rendering:pixelated}
.worldmap canvas{display:block;width:100%;height:100%;image-rendering:pixelated;image-rendering:crisp-edges}`}</style>
      <div className="wm-mist" aria-hidden="true" />
      <canvas ref={ref} role="img" aria-label={`Map of Veyra. ${DISTRICT_IDS.filter((id) => states[id] === 'restored').length} of 12 districts restored.`} />
      <nav aria-label="Districts of Veyra" style={{ position: 'absolute', inset: 0 }}>
        {DISTRICT_IDS.map((id) => {
          const s = L[id];
          if (!s) return null;
          const mod = MODULES.find((m) => m.id === id);
          const st = states[id] || 'lost';
          const label = `${mod?.district || id}, month ${mod?.month ?? ''}: ${st === 'restored' ? 'restored' : st === 'current' ? 'current district' : 'lost in the Tide'}`;
          return (
            <button key={id} type="button" className="wm-hit" aria-label={label} aria-pressed={selected === id}
              onClick={() => onSelect?.(id)}
              style={{ left: `${((s.x0 - 2) / MAP_W) * 100}%`, top: `${((s.y0 - 2) / MH) * 100}%`, width: `${((s.w + 4) / MAP_W) * 100}%`, height: `${((s.h + 4) / MH) * 100}%` }} />
          );
        })}
      </nav>
      {selected && L[selected] && (() => {
        const s = L[selected]; const mod = MODULES.find((m) => m.id === selected);
        const below = s.y0 + s.h < MH * 0.82;
        const lx = Math.min(Math.max(s.x0 + s.w / 2, 40), MAP_W - 40);
        return <div className="wm-label" aria-hidden="true" style={{ left: `${(lx / MAP_W) * 100}%`, top: below ? `${((s.y0 + s.h + 5) / MH) * 100}%` : `calc(${((s.y0 - (selected === current ? 18 : 6)) / MH) * 100}% - 20px)` }}>{mod?.district}</div>;
      })()}
    </div>
  );
}
