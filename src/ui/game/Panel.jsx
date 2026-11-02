import React from 'react';
import { PxIcon } from './PxIcon.jsx';

// Framed pixel panel. variant: 'stone' (default) | 'parchment' | 'glass' | 'gold' | 'dialog'.
// <Panel variant="parchment" title="Quest" icon="scroll" as="section">…</Panel>
export function Panel({ variant = 'stone', as: Tag = 'section', title, icon, level = 2, className = '', children, ...rest }) {
  const H = `h${level}`;
  return (
    <Tag className={`panel ${variant} ${className}`.trim()} {...rest}>
      {title && <H className="panel-title">{icon && <PxIcon name={icon} size={24} />}<span>{title}</span></H>}
      {children}
    </Tag>
  );
}

export default Panel;
