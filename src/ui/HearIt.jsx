// 1.7 Pronunciation after recall: a button on the review screen only (never during study or recall) that says a foreign
// word with this device's own offline voice. Mnemos never uses an online voice; if the device has none, it says so.
import React, { useState } from 'react';

const BCP = { es: 'es', tr: 'tr', sw: 'sw' };
export const canHear = (code) => !!BCP[code] && typeof window !== 'undefined' && 'speechSynthesis' in window;

export function HearIt({ word, code }) {
  const [msg, setMsg] = useState('');
  if (!canHear(code) || !word) return null;
  const say = () => {
    const synth = window.speechSynthesis;
    const v = synth.getVoices().find((x) => x.localService && x.lang?.toLowerCase().startsWith(BCP[code]));
    if (!v) { setMsg('No offline voice for this language on this device.'); return; }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(word); u.voice = v; u.lang = v.lang; u.rate = 0.9;
    synth.speak(u);
  };
  return <span className="hear-it"><button type="button" className="btn ghost small" onClick={say} aria-label={`Hear ${word}`}>Hear it</button>{msg && <small className="muted"> {msg}</small>}</span>;
}
