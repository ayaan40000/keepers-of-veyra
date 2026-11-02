import React from 'react';

// Segmented pixel progress bar. value/max are numbers; tone: 'gold' | 'teal' | 'danger' | 'tide'.
// With `label` it is announced as a progressbar; without, it is decorative (aria-hidden).
export function PixelBar({ value = 0, max = 1, label, tone = 'gold', size = 'md', showValue = false, className = '' }) {
  const frac = Math.max(0, Math.min(1, max ? value / max : 0));
  const a11y = label
    ? { role: 'progressbar', 'aria-label': label, 'aria-valuemin': 0, 'aria-valuemax': max, 'aria-valuenow': Math.round(value * 100) / 100 }
    : { 'aria-hidden': true };
  return (
    <div className={`pxbar ${tone} ${size} ${className}`} {...a11y}>
      <i style={{ width: `${frac * 100}%` }} />
      {showValue && <span className="pxbar-val">{Math.round(frac * 100)}%</span>}
    </div>
  );
}

export default PixelBar;
