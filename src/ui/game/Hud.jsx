import React from 'react';
import { PxIcon } from './PxIcon.jsx';
import { PixelBar } from './PixelBar.jsx';

// Top status bar. rank: result of rankOf(lumen) ({ rank, title, frac }); lumen: number;
// keys / relics: numbers (slot hidden when null/undefined); sound: bool; onToggleSound: () => void;
// children: extra chips rendered before the sound toggle.
export function Hud({ rank, lumen = 0, keys, relics, sound = true, onToggleSound, children }) {
  return (
    <header className="hud">
      <div className="hud-rank" title={`Rank ${rank?.rank}: ${rank?.title}`}>
        <span className="hud-badge"><PxIcon name="star" size={24} /><b>{rank?.rank}</b></span>
        <span className="hud-title">
          <span className="hud-name">{rank?.title}</span>
          <PixelBar value={rank?.frac || 0} size="xs" tone="gold" />
        </span>
      </div>
      <div className="hud-stats">
        <span className="hud-chip"><PxIcon name="lumen" size={22} /><b>{lumen}</b><span className="sr-only"> Lumen</span></span>
        {keys != null && <span className="hud-chip"><PxIcon name="key" size={22} /><b>{keys}</b><span className="sr-only"> Crypt keys</span></span>}
        {relics != null && <span className="hud-chip"><PxIcon name="chest" size={22} /><b>{relics}</b><span className="sr-only"> relics collected</span></span>}
        {children}
        {onToggleSound && (
          <button type="button" className="hud-sound" data-sfx="none" aria-label="Sound" aria-pressed={!!sound} onClick={onToggleSound} title={sound ? 'Sound is on' : 'Sound is off'}>
            <PxIcon name={sound ? 'soundOn' : 'soundOff'} size={28} />
          </button>
        )}
      </div>
    </header>
  );
}

export default Hud;
