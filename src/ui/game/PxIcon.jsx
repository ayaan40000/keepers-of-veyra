import React from 'react';
import { UI_ICONS } from './uiIcons.js';

// Renders a string sprite (default: a named UI icon) as a crisp SVG made of pixel runs.
// <PxIcon name="lumen" size={32} />  or  <PxIcon sprite={mySprite} size={48} label="Lumen" />
const cache = new WeakMap();
function runs(s) {
  if (cache.has(s)) return cache.get(s);
  const out = [];
  s.px.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      let e = x + 1;
      while (e < row.length && row[e] === c) e++;
      if (c !== '.' && c !== ' ' && s.pal[c]) out.push([x, y, e - x, s.pal[c]]);
      x = e;
    }
  });
  cache.set(s, out);
  return out;
}

export function PxIcon({ name, sprite, size = 32, label, className = '', style }) {
  const s = sprite || UI_ICONS[name];
  if (!s) return null;
  return (
    <svg className={`px-icon ${className}`} width={size} height={size * (s.h / s.w)} viewBox={`0 0 ${s.w} ${s.h}`}
      shapeRendering="crispEdges" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false" style={style}>
      {runs(s).map(([x, y, w, c], i) => <rect key={i} x={x} y={y} width={w} height="1" fill={c} />)}
    </svg>
  );
}

export default PxIcon;
