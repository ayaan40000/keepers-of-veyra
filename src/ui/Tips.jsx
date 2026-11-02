import React from 'react';
import { Portrait } from '../pixel/Faces.jsx';

// First-time tips from Wren. Each shows once until dismissed; Keeper > Settings > Replay tips brings them back.
export const tipSeen = (p, id) => !!p?.tips?.seen?.includes(id);

export function Tip({ profile, update, id, children }) {
  if (!update || tipSeen(profile, id)) return null;
  return (
    <aside className="card tip" aria-label="Tip from Wren">
      <Portrait id="wren" mood="smile" scale={1} className="tip-face" />
      <div className="tip-body">
        <p className="small"><b>Wren:</b> {children}</p>
        <button className="btn tiny" onClick={() => update((p) => { p.tips = p.tips || { seen: [] }; p.tips.seen = [...new Set([...(p.tips.seen || []), id])]; })}>Got it</button>
      </div>
    </aside>
  );
}
