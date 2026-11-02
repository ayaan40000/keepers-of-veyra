// React wrappers for procedural faces and named story portraits.
import React, { useMemo } from 'react';
import { Sprite } from './core.js';
import { faceSprite, describeFace, faceParams, renderFaceSpec } from './faces.js';
import { portraitSprite, portraitLabel } from './portraits.js';

// A procedural face for the Names-and-Faces drill. Sprites are cached by seed+size inside faceSprite,
// and memoised here so re-renders are cheap.
// look: optional feature overrides (changed hair, a look-alike's nose, ...), drawn over the seed's own features.
export function PixelFace({ seed, look, size = 48, scale = 3, label, className = '' }) {
  const lk = look && Object.keys(look).length ? JSON.stringify(look) : '';
  const spec = useMemo(() => (lk ? { ...faceParams(seed), ...look } : null), [seed, lk]);
  const sprite = useMemo(() => (spec ? renderFaceSpec(spec, size) : faceSprite(seed, { size })), [seed, size, spec]);
  const aria = useMemo(() => label || `Portrait: ${describeFace(spec || seed)}`, [seed, spec, label]);
  return <Sprite sprite={sprite} scale={scale} label={aria} className={`pixel-face ${className}`} />;
}

// A named story portrait (wren, sevrin, hask, isolde, tansy, calder, ennick, mosk, fennick, you-<avatar>).
export function Portrait({ id, mood = 'neutral', scale = 3, label, className = '' }) {
  const sprite = useMemo(() => portraitSprite(id, mood), [id, mood]);
  return <Sprite sprite={sprite} scale={scale} label={label || portraitLabel(id, mood)} className={`pixel-portrait ${className}`} />;
}
