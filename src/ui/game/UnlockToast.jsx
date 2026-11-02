import React, { useEffect, useState } from 'react';
import { sfx } from '../../audio/sfx.js';

// Celebratory pop-up shown at the top of the screen, one item at a time.
// items: [{ key, icon: ReactNode, kicker: 'Achievement unlocked', title, text, sound: 'chest' | 'levelUp' | 'success' | 'none' }]
// duration: ms each item stays; delay: ms before the first; onDone: after the last one hides.
export function UnlockToast({ items = [], duration = 3400, delay = 500, onDone }) {
  const [i, setI] = useState(-1);
  const key = items.map((x) => x.key || x.title).join('|');
  useEffect(() => {
    if (!items.length) return undefined;
    setI(-1);
    const id = setTimeout(() => setI(0), delay);
    return () => clearTimeout(id);
  }, [key]);
  useEffect(() => {
    if (i < 0) return undefined;
    if (i >= items.length) { onDone?.(); return undefined; }
    const s = items[i].sound || 'chest';
    if (s !== 'none') sfx[s]?.();
    const id = setTimeout(() => setI(i + 1), duration);
    return () => clearTimeout(id);
  }, [i, key]);
  const it = i >= 0 && i < items.length ? items[i] : null;
  return (
    <div className="toast-zone" role="status" aria-live="polite">
      {it && (
        <div className="toast" key={i}>
          {it.icon && <div className="toast-icon">{it.icon}</div>}
          <div className="toast-body">
            <span className="toast-kicker">{it.kicker || 'Unlocked'}</span>
            <b className="toast-title">{it.title}</b>
            {it.text && <span className="toast-text">{it.text}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export default UnlockToast;
