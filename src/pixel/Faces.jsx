// React wrappers for procedural faces and named story portraits.
import React, { useMemo } from 'react';
import { Sprite } from './core.js';
import { faceSprite, describeFace, faceParams, renderFaceSpec, turnSprite } from './faces.js';
import { portraitSprite, portraitLabel } from './portraits.js';
import { castFaceUrl } from '../data/castFaces.js';

// A procedural face for the Names-and-Faces drill. Sprites are cached by seed+size inside faceSprite,
// and memoised here so re-renders are cheap.
// look: optional feature overrides (changed hair, a look-alike's nose, ...), drawn over the seed's own features.
// turn: -1 or 1 shows the face at three-quarter view, turned left or right (v0.8).
export function PixelFace({ seed, look, turn = 0, size = 48, scale = 3, label, className = '' }) {
  const lk = look && Object.keys(look).length ? JSON.stringify(look) : '';
  const spec = useMemo(() => (lk ? { ...faceParams(seed), ...look } : null), [seed, lk]);
  const sprite = useMemo(() => { const s = spec ? renderFaceSpec(spec, size) : faceSprite(seed, { size }); return turn ? turnSprite(s, 0.38 * Math.sign(turn)) : s; }, [seed, size, spec, turn]);
  const aria = useMemo(() => label || `Portrait: ${describeFace(spec || seed)}`, [seed, spec, label]);
  return <Sprite sprite={sprite} scale={scale} label={aria} className={`pixel-face ${className}`} />;
}

// A named story portrait (wren, sevrin, hask, isolde, tansy, calder, ennick, mosk, fennick, you-<avatar>).
export function Portrait({ id, mood = 'neutral', scale = 3, label, className = '' }) {
  const sprite = useMemo(() => portraitSprite(id, mood), [id, mood]);
  // A painted portrait (src/data/castFaces.js, painted 192 px wide, shown at 64 x scale) replaces the code face when one ships.
  const url = useMemo(() => castFaceUrl(typeof id === 'string' && id.startsWith('you:') ? `you-${id.slice(4)}` : id === 'you' || id === 'player' || id === 'keeper' ? 'you-lantern' : id, mood), [id, mood]);
  const text = label || portraitLabel(id, mood);
  if (url) {
    const px = 64 * scale;
    return <img src={url} width={px} height={px} alt={text} role="img" aria-label={text} className={`px pixel-portrait pixel-portrait-painted ${className}`} style={{ imageRendering: scale >= 3 ? 'pixelated' : 'auto' }} draggable={false} />;
  }
  return <Sprite sprite={sprite} scale={scale} label={text} className={`pixel-portrait ${className}`} />;
}
