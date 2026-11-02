// Standalone preview of the Undercroft. Query params: ?keys=N (default 3), ?card=1 (show the home card),
// ?week=N (curriculum week instead of reviewer unlock), ?deep=N (pretend the run starts at floor N), ?reduced=1.
import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/styles.css';
import '../../src/ui/crypt.css';
import Crypt, { CryptCard } from '../../src/ui/Crypt.jsx';
import { newProfile } from '../../src/engine/core.js';
import { ensureCrypt } from '../../src/engine/crypt.js';

const q = new URLSearchParams(location.search);
if (q.get('reduced') === '1') document.documentElement.dataset.motion = 'reduced';

function makeProfile() {
  const p = newProfile('Preview', 'key');
  p.progress.baselineDone = true;
  if (q.get('week')) p.progress.day = (Number(q.get('week')) - 1) * 7 + 1;
  else p.progress.reviewerUnlock = true;
  const stops = ['front door', 'doormat', 'coat hook', 'hall mirror', 'shoe rack', 'stairs', 'kitchen door', 'fridge', 'sink', 'stove',
    'oven', 'kettle', 'toaster', 'table', 'window', 'sofa', 'television', 'bookshelf', 'lamp', 'fireplace',
    'rug', 'piano', 'bathroom door', 'bathtub', 'towel rail', 'bedroom door', 'bed', 'wardrobe', 'desk', 'balcony'];
  p.palaces.push({ id: 'pv1', name: 'Home', loci: stops, lastUsed: null, created: new Date().toISOString() });
  const c = ensureCrypt(p);
  c.keys = Number(q.get('keys') ?? 3);
  return p;
}

function Preview() {
  const ref = useRef(null);
  if (!ref.current) ref.current = makeProfile();
  const [profile, setProfile] = useState(ref.current);
  const [mode, setMode] = useState(q.get('card') === '1' ? 'card' : 'crypt');
  const update = (fn) => { const next = structuredClone(ref.current); fn(next); ref.current = next; setProfile(next); window.__profile = next; };
  window.__profile = profile;
  window.__update = update;
  return (
    <div className="shell" style={{ paddingBottom: 24 }}>
      <main>
        {mode === 'card'
          ? <CryptCard profile={profile} onEnter={() => setMode('crypt')} />
          : <Crypt profile={profile} update={update} onExit={() => setMode('card')} />}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<React.StrictMode><Preview /></React.StrictMode>);
