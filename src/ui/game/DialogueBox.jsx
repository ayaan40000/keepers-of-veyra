import React, { useEffect, useRef, useState } from 'react';
import { sfx } from '../../audio/sfx.js';

const reducedMotion = () => document.documentElement.dataset.motion === 'reduced' || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Lines already fully shown this app session appear instantly when seen again (no replaying on every tab visit).
const SEEN = new Set();

// Framed dialogue box with typewriter text.
// lines: string | string[]; speaker: name shown on the nameplate; portrait: any React node (or null);
// onDone: called when the last line is advanced past; speed: ms per character; blips: per-character sound.
// Click / tap / Enter / Space: completes the current line, then advances. Instant when reduced motion is on.
export function DialogueBox({ lines, speaker, portrait = null, onDone, speed = 26, blips = true, className = '', compact = false }) {
  const list = (Array.isArray(lines) ? lines : [lines]).filter((l) => l != null && l !== '').map(String);
  const [idx, setIdx] = useState(0);
  const text = list[Math.min(idx, list.length - 1)] || '';
  const reduced = reducedMotion();
  const [n, setN] = useState(reduced || SEEN.has(text) ? text.length : 0);
  const shownText = useRef(text);

  useEffect(() => { if (shownText.current !== text) { shownText.current = text; setN(reducedMotion() || SEEN.has(text) ? text.length : 0); } }, [text]);
  useEffect(() => { setIdx(0); }, [list.join('\u0001')]);

  const done = reduced || n >= text.length;
  useEffect(() => { if (done && text) SEEN.add(text); }, [done, text]);
  useEffect(() => {
    if (done) return undefined;
    const ch = text[n];
    const pause = /[.!?]/.test(text[n - 1] || '') && ch === ' ' ? speed * 7 : /[,;:]/.test(text[n - 1] || '') && ch === ' ' ? speed * 3 : speed;
    const id = setTimeout(() => {
      setN((v) => Math.min(text.length, v + 1));
      if (blips && /[A-Za-z0-9]/.test(ch) && n % 2 === 0) sfx.blip();
    }, pause);
    return () => clearTimeout(id);
  }, [n, done, text]);

  const more = idx + 1 < list.length;
  const advance = () => {
    if (!done) { setN(text.length); return; }
    if (more) { setIdx(idx + 1); sfx.select(); return; }
    onDone?.();
  };
  const onKey = (e) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); advance(); }
  };
  const shown = done ? text : text.slice(0, n);

  return (
    <div className={`dlg ${portrait ? 'has-portrait' : ''} ${compact ? 'compact' : ''} ${className}`} tabIndex={0} onClick={advance} onKeyDown={onKey}
      role="group" aria-roledescription="dialogue" aria-label={speaker ? `${speaker} says` : 'Dialogue'}>
      {speaker && <div className="dlg-name">{speaker}</div>}
      {portrait && <div className="dlg-portrait">{portrait}</div>}
      <p className="dlg-text">
        <span aria-hidden="true">{shown}</span>
        <span className="dlg-ghost" aria-hidden="true">{text.slice(shown.length)}</span>
        <span className="sr-only">{text}</span>
      </p>
      {done && (more || onDone) && <span className="dlg-next" aria-hidden="true" />}
    </div>
  );
}

export default DialogueBox;
