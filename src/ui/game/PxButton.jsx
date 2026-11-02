import React from 'react';
import { PxIcon } from './PxIcon.jsx';

// Chunky pixel button with a press-down state (styles: .btn, .btn.primary, .btn.ghost, .btn.danger, .btn.big, .btn.small).
// variant: 'default' | 'primary' | 'ghost' | 'danger'; size: undefined | 'big' | 'small';
// icon: a UI icon name (decorative); sfx: a sound name from src/audio/sfx.js or 'none' (default: automatic).
export function PxButton({ variant = 'default', size, icon, sfx, className = '', children, type = 'button', ...rest }) {
  const cls = ['btn', variant !== 'default' && variant, size, icon && 'has-icon', className].filter(Boolean).join(' ');
  return (
    <button type={type} className={cls} data-sfx={sfx} {...rest}>
      {icon && <PxIcon name={icon} size={size === 'small' ? 20 : 24} />}
      {children}
    </button>
  );
}

export default PxButton;
