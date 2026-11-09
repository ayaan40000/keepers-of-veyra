import React, { useEffect, useRef } from 'react';
import { toRaw, drawSprite, reducedMotion } from './raster.js';


// Static sprite as a crisp, scaled canvas.
export function Sprite({ sprite, scale = 4, className = '', label, style }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c || !sprite) return;
    const r = toRaw(sprite);
    c.width = r.w * scale; c.height = r.h * scale;
    const ctx = c.getContext('2d'); ctx.clearRect(0, 0, c.width, c.height);
    drawSprite(ctx, r, 0, 0, scale);
  }, [sprite, scale]);
  return <canvas ref={ref} className={`px ${className}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} style={style} />;
}

// Animated (or static) pixel canvas: draw(ctx, t, frame) is called per frame at logical resolution w x h,
// then the canvas is scaled up by CSS with crisp pixels. Animation stops when reduced motion is on.
export function PixelCanvas({ w, h, draw, animate = true, fps = 12, className = '', label, style, deps = [] }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return undefined;
    c.width = w; c.height = h;
    const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
    let raf = 0, last = 0, frame = 0, seen = true;
    const start = performance.now();
    const tick = (now) => {
      raf = 0;
      if (!seen || (typeof document !== 'undefined' && document.hidden)) return; // paused off screen or in a hidden tab
      if (now - last >= 1000 / fps) { last = now; draw(ctx, (now - start) / 1000, frame++); }
      raf = requestAnimationFrame(tick);
    };
    const wake = () => { if (!raf && seen && !document.hidden) raf = requestAnimationFrame(tick); };
    if (!(animate && !reducedMotion())) { draw(ctx, 0, 0); return undefined; }
    draw(ctx, 0, frame++);
    raf = requestAnimationFrame(tick);
    const io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(([e]) => { seen = e.isIntersecting; wake(); }) : null;
    io?.observe(c);
    document.addEventListener('visibilitychange', wake);
    return () => { cancelAnimationFrame(raf); io?.disconnect(); document.removeEventListener('visibilitychange', wake); };
  }, [w, h, animate, ...deps]);
  return <canvas ref={ref} className={`px ${className}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} style={style} />;
}

