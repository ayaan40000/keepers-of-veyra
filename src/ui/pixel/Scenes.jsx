// Animated pixel-art scenes: the title backdrop and the district banners.
// Static art is built once per scene (memoised in world.js); each frame composites it and draws
// small overlays (stars, lamp glow, water shimmer, Tide fog). Static when reduced motion is on.
import React, { useEffect, useRef, useState } from 'react';
import { paintedScene, loadPlates } from '../../pixel/painted.js';
import { drawLanterns } from './mapLife.js';
import {
  TITLE_W, TITLE_H, BANNER_W, BANNER_H, K, buildTitle, buildBanner, travellerFrame, toCanvas, reducedMotion, subscribeFrame,
  drawStars, drawWaves, drawLights, drawFog, drawFalls, drawReflections, drawGlints, drawClock, drawTorches, glowSprite,
} from './world.js';
import { MODULES } from '../../data/curriculum.js';

export { drawStars, drawFog, drawLights, drawWaves } from './world.js';

const canvasCache = new WeakMap();
const layerCanvas = (p) => { let c = canvasCache.get(p); if (!c) { c = toCanvas(p); canvasCache.set(p, c); } return c; };

// Runs frameFn on the shared ticker while the canvas is on screen; draws once if motion is reduced.
function useScene(ref, w, h, makeFrame, deps) {
  useEffect(() => {
    const c = ref.current; if (!c) return undefined;
    c.width = w; c.height = h;
    const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
    const frameFn = makeFrame(ctx);
    if (reducedMotion()) { frameFn(0, 0); return undefined; }
    frameFn(0, 0);
    let unsub = null;
    const start = () => { if (!unsub) unsub = subscribeFrame(frameFn); };
    const stop = () => { if (unsub) { unsub(); unsub = null; } };
    let io = null;
    if (typeof IntersectionObserver !== 'undefined') { io = new IntersectionObserver((es) => (es[0].isIntersecting ? start() : stop())); io.observe(c); } else start();
    return () => { stop(); io?.disconnect(); };
  }, deps);
}

const INK = '#07090f', IRON = '#3a404f', AM = '#f2bd5c', AM5 = '#fff4cf';
const CANVAS_STYLE = { display: 'block', width: '100%', height: 'auto', imageRendering: 'pixelated' };

// Painted title (Nov 8, 2026): one picture from the local image model (src/data/scenes.js 'title'), its windows
// flickering in code, with the code fog and the traveller drawn on top at the painting's scale. Without a
// painted title, the code-drawn backdrop is used as before.
const PAINTED_TITLE = paintedScene('title');
function useTitlePlates() {
  const [plates, setPlates] = useState(() => { if (!PAINTED_TITLE) return null; const r = loadPlates(PAINTED_TITLE); return r.ready ? r : null; });
  useEffect(() => { if (PAINTED_TITLE && !plates) loadPlates(PAINTED_TITLE, setPlates); }, []);
  return PAINTED_TITLE && plates ? plates : null;
}

export function TitleScene({ className = '' }) {
  const ref = useRef(null);
  const plates = useTitlePlates();
  const P = plates ? PAINTED_TITLE : null;
  useScene(ref, P ? P.w : TITLE_W, P ? P.h : TITLE_H, (ctx) => {
    const sc = buildTitle();
    const bg = layerCanvas(sc.p);
    const trav = [layerCanvas(travellerFrame(0)), layerCanvas(travellerFrame(1))];
    const tx = 84, ty = sc.roadY(92) - 23;
    const k = P ? P.w / TITLE_W : 1;
    const on = () => true;
    return (t, frame) => {
      if (P) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(plates.lit, 0, 0, P.w, P.h);
        drawLanterns(ctx, P.lamps || [], t, on);
        ctx.setTransform(k, 0, 0, k, 0, 0); // the code layers below are drawn at the painting's scale
      } else {
        ctx.drawImage(bg, 0, 0);
        drawStars(ctx, sc.stars, t);
        drawWaves(ctx, sc.waves, t);
        drawReflections(ctx, sc.reflections, frame, 6);
        drawLights(ctx, sc.lights, t, frame);
      }
      drawFog(ctx, sc.fog, t);
      // the traveller, cloak stirring, lantern swinging gently
      ctx.drawImage(trav[Math.floor(Math.abs(t) * 1.4) % 2], tx, ty);
      // the lantern, swinging a little from the traveller's hand
      const sw = Math.round(Math.sin(t * 2.2) * 0.8);
      const lx = tx + 14 + sw, ly = ty + 15;
      ctx.globalAlpha = 0.55 + Math.sin(t * 7) * 0.06; ctx.drawImage(glowSprite(12), lx - 12, ly - 11); ctx.globalAlpha = 1;
      ctx.fillStyle = INK; ctx.fillRect(lx - 1, ly - 2, 3, 6); ctx.fillRect(tx + 13, ty + 13, 1, 1);
      ctx.fillStyle = IRON; ctx.fillRect(lx - 1, ly - 2, 3, 1); ctx.fillRect(lx - 1, ly + 3, 3, 1);
      ctx.fillStyle = AM; ctx.fillRect(lx, ly - 1, 1, 3);
      ctx.fillStyle = AM5; ctx.fillRect(lx, ly, 1, 1);
    };
  }, [P]);
  return <canvas ref={ref} className={`px title-scene ${className}`} style={CANVAS_STYLE} role="img" aria-label="Veyra at night on its cliff above the Grey Sea, a traveller with a lantern on the coast road" />;
}

const NAMES = { archive: 'The Archive', crypt: 'The Undercroft' };
export function DistrictBanner({ id, restored = true, className = '' }) {
  const ref = useRef(null);
  useScene(ref, BANNER_W, BANNER_H, (ctx) => {
    const b = buildBanner(id, restored);
    const bg = layerCanvas(b.p);
    return (t, frame) => {
      ctx.drawImage(bg, 0, 0);
      drawStars(ctx, b.stars, t);
      drawWaves(ctx, b.waves, t);
      drawFalls(ctx, b.falls, frame);
      drawReflections(ctx, b.reflections, frame, 10);
      if (restored) drawGlints(ctx, b.glints, t);
      drawClock(ctx, b.clock, new Date());
      drawLights(ctx, b.lights, t, frame);
      drawTorches(ctx, b.lights, frame);
      drawFog(ctx, b.fog, t);
    };
  }, [id, restored]);
  const name = NAMES[id] || MODULES.find((m) => m.id === id)?.district || id;
  return <canvas ref={ref} className={`px district-banner ${className}`} style={CANVAS_STYLE} role="img" aria-label={`${name}${restored ? '' : ', lost in the Tide'}`} />;
}
