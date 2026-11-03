// 1.1 Lethe Brambles panel for the map. Thorns show items that slipped in a delayed review. Typing a stronger picture is kept
// as a note and earns nothing; a thorn burns away only when the item is recalled correctly on a later day (see engine/brambles.js).
// Never shown on a study or recall screen. Brambles never block the map, the story or any feature.
import React, { useState } from 'react';
import { PxIcon } from './game/PxIcon.jsx';
import { ArtImg, artFor } from './artLookup.jsx';
import { MODULES } from '../data/curriculum.js';
import { BRAMBLES_HONEST, MAP_LINES, THORN, COME_BACK, BURN_AWAY, BURN_ALL, CHEST } from '../data/brambles.js';
import { activeThorns, burnedThorns, bandOf, bramblesOn, keepNote, chestState, openChest } from '../engine/brambles.js';
import { hashStr } from '../engine/util.js';

const fill = (t, o) => t.replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '');
const showItem = (th) => (th.cue && th.cue !== th.target ? `${th.cue}: ${th.target}` : th.target);

function Thorn({ th, update, onClose }) {
  const [val, setVal] = useState(th.note || '');
  const [saved, setSaved] = useState(false);
  const tip = THORN.tips[hashStr(th.key) % THORN.tips.length];
  return (
    <form className="card parchment thorn-sheet" onSubmit={(e) => { e.preventDefault(); update((p) => { keepNote(p, th.key, val); }); setSaved(true); }}>
      <h4 className="set-sub">{THORN.title}</h4>
      <p className="small">{fill(THORN.shows, { item: showItem(th) })}</p>
      <p className="small">{THORN.ask}</p>
      <p className="muted small">{tip}</p>
      <label className="field">{THORN.placeholder}<textarea rows={3} maxLength={300} value={val} onChange={(e) => { setVal(e.target.value); setSaved(false); }} /></label>
      <div className="row wrap">
        <button className="btn primary small" disabled={!val.trim()}>{THORN.save}</button>
        <button type="button" className="btn ghost small" onClick={onClose}>{THORN.skip}</button>
      </div>
      {saved && <p className="small" role="status">{THORN.saved} {COME_BACK[hashStr(th.key + 'c') % COME_BACK.length]}</p>}
      <p className="muted small">{THORN.noReward}</p>
    </form>
  );
}

export function BramblePanel({ profile, update, district }) {
  const [open, setOpen] = useState(null);
  const [chest, setChest] = useState(false);
  const name = MODULES.find((m) => m.id === district)?.district || district;
  const g = (profile.progress.gates || []);
  if (!bramblesOn(profile)) return <p className="muted small">{MAP_LINES.off}</p>;
  if (!g.length && !activeThorns(profile).length) return null;
  const mine = activeThorns(profile).filter((th) => th.district === district);
  const burned = burnedThorns(profile).filter((th) => th.district === district);
  const band = bandOf(mine.length);
  const line = band === 'none' ? (burned.length ? fill(BURN_ALL, { district: name }) : fill(MAP_LINES.none, { district: name })) : band === 'one' ? fill(MAP_LINES.one, { district: name }) : band === 'few' ? fill(MAP_LINES.few, { district: name }) : fill(MAP_LINES.many, { district: name });
  const cs = chestState(profile, district);
  const th = open && mine.find((x) => x.key === open);
  return (
    <section className="card bramble-panel" data-testid="bramble-panel">
      <h4 className="set-sub"><PxIcon name="scroll" size={20} />Lethe Brambles</h4>
      {artFor('overlay_bramble_clump') && mine.length > 0 && <ArtImg id="overlay_bramble_clump" className="bramble-art" alt="" />}
      <p className="small">{line}</p>
      {mine.length > 0 && <p className="muted small">{MAP_LINES.tapHint}</p>}
      <div className="row wrap">{mine.map((x, i) => <button key={x.key} className="btn small" aria-pressed={open === x.key} onClick={() => setOpen(open === x.key ? null : x.key)}>Thorn {i + 1}</button>)}</div>
      {th && <Thorn key={th.key} th={th} update={update} onClose={() => setOpen(null)} />}
      {mine.some((x) => x.note) && !th && <p className="muted small">Your pictures are kept with their thorns. They burn away when you remember the items for real, on a later day.</p>}
      {cs !== 'none' && (
        <div className="bramble-chest">
          <p className="small">{cs === 'guarded' ? CHEST.guarded : cs === 'free' ? CHEST.open : CHEST.empty}</p>
          {cs === 'free' && !chest && <button className="btn small" onClick={() => { update((p) => { openChest(p, district); }); setChest(true); }}>Open the chest</button>}
          {cs === 'free' && <p className="muted small">{CHEST.later}</p>}
          {cs === 'opened' && <p className="muted small">{CHEST.note}</p>}
        </div>
      )}
      <p className="muted small">{BRAMBLES_HONEST}</p>
    </section>
  );
}
export const burnLine = (key) => BURN_AWAY[hashStr(key) % BURN_AWAY.length];
