// Shipped art lookup. The art manifest (src/data/art.js, ART[id] = { src, w, h, alt, category }) may not exist yet,
// so it is loaded with a glob: no file means no pictures, and the code-drawn sprites are used instead.
import React from 'react';
import { DistrictBanner } from './pixel/Scenes.jsx';

const mods = import.meta.glob('../data/art.js', { eager: true });
const ART = Object.values(mods)[0]?.ART || {};
export const artFor = (id) => (id && ART[id]) || null;

// Finds an id whose key starts with one of the prefixes and contains one of the tokens (the art manifest names may vary).
const KEYS = Object.keys(ART);
// Same cut-offs as the world map: dawn 5 to 8, day 8 to 17, dusk 17 to 20, night otherwise. Day and dawn use the '-day' picture when one exists.
export const isBright = (h = new Date().getHours()) => h >= 5 && h < 17;
export const timed = (id) => (id && isBright() && ART[id + '-day'] ? id + '-day' : id);
export const artFind = (prefixes, tokens) => {
  const k = KEYS.find((x) => !x.endsWith('-day') && prefixes.some((pre) => x.startsWith(pre)) && tokens.some((t) => x.includes(t))) || null;
  return timed(k);
};
export const SCENE_TOKENS = { packing: ['packing'], speech: ['speech'], crossroads: ['crossroads'], gala: ['gala', 'networking'], market: ['market'], shore: ['shore', 'tide'] };
export const SKILL_TOKENS = { imagery: ['imagery'], linking: ['linking'], palace: ['palace'], faces: ['faces'], numbers: ['numbers'], vocab: ['vocab'], structure: ['structure'] };

// A shipped picture with crisp pixels and a text alternative, or null when the id is not in the manifest.
export function ArtImg({ id, className = '', alt, style }) {
  const a = artFor(id);
  if (!a) return null;
  return <img className={`art-img ${className}`} src={a.src} width={a.w} height={a.h} alt={alt ?? a.alt ?? ''} style={{ imageRendering: 'pixelated', ...style }} draggable={false} />;
}

// A district's picture (day or night, by the clock) when shipped, else the code-drawn banner.
export function DistrictScene({ id, restored = true, className = '' }) {
  const a = timed('district_' + id);
  return artFor(a) ? <ArtImg id={a} className={className} /> : <DistrictBanner id={id} restored={restored} className={className} />;
}
