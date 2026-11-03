// 1.1 Relics on pedestals. A lit pedestal means the relic is held; a dim one only means a review is due (the existing fading
// rule, driven by a delayed review that slipped). Repair is the existing calm repair: a Recall card now, another with a
// different word a day or two later. No creatures, no timer, no loss. Rewards come only from recall that held.
import React, { useState } from 'react';
import { ITEMS } from '../data/items.js';
import { ItemIcon } from './ItemIcon.jsx';
import { ArtImg, artFor } from './artLookup.jsx';
import { PxIcon } from './game/PxIcon.jsx';
import { RepairCard } from './Relics.jsx';
import { earnedItems, fadedRelics, repairState } from '../engine/collect.js';
import { today } from '../engine/core.js';
import { hashStr } from '../engine/util.js';
import { PEDESTAL_HONEST, LIT_LINES, DIM_LINES, DIM_HINT, REPAIR, RESTORED_LINES, RESTORED_NOTE } from '../data/pedestals.js';

const fill = (t, relic) => t.replace('{relic}', relic);
const pickLine = (list, id) => list[hashStr(id) % list.length];

export function PedestalHall({ profile, update }) {
  const owned = new Set(earnedItems(profile));
  const faded = new Set(fadedRelics(profile));
  const relics = ITEMS.filter((i) => i.kind === 'artifact' && i.source?.type === 'gate' && owned.has(i.id));
  const [sel, setSel] = useState(null);
  const [repair, setRepair] = useState(false);
  if (!relics.length) return null;
  const it = relics.find((x) => x.id === sel);
  const dim = it && faded.has(it.id);
  const day = today(profile);
  const st = it ? repairState(profile, it.id, day) : 'none';
  const restored = it && !dim && profile.relics?.repair?.[it.id]?.done;
  return (
    <section className="card pedestal-hall" data-testid="pedestal-hall">
      <h3 className="panel-title"><PxIcon name="chest" size={28} />Hall of Pedestals</h3>
      <p className="muted small">Each relic you earned from a district stands on its own pedestal. A lit pedestal is held. A dim one is only waiting for a review.</p>
      <div className="pedestal-row">{relics.map((r) => {
        const d = faded.has(r.id);
        const art = artFor(d ? 'pedestal_dim' : 'pedestal_lit');
        return (
          <button key={r.id} className={`pedestal ${d ? 'dim' : 'lit'}${sel === r.id ? ' sel' : ''}`} aria-pressed={sel === r.id} aria-label={`${r.name}, ${d ? 'dim, a review is due' : 'lit'}`} onClick={() => { setSel(sel === r.id ? null : r.id); setRepair(false); }}>
            <span className="pedestal-relic"><ItemIcon id={r.id} scale={2} owned /></span>
            {art ? <ArtImg id={d ? 'pedestal_dim' : 'pedestal_lit'} className="pedestal-art" alt="" /> : <span className="pedestal-base" aria-hidden="true" />}
          </button>
        );
      })}</div>
      {it && (
        <div className="pedestal-detail" role="status">
          <p className="small"><b>{it.name}</b></p>
          {!dim && <p className="small">{fill(pickLine(LIT_LINES, it.id), it.name)}{restored ? ` ${pickLine(RESTORED_LINES, it.id).replace('{relic}', it.name)}` : ''}</p>}
          {!dim && restored && <p className="muted small">{RESTORED_NOTE}</p>}
          {dim && <>
            <p className="small">{fill(pickLine(DIM_LINES, it.id), it.name)}</p>
            <p className="muted small">{DIM_HINT}</p>
            {st === 'wait' && <p className="small">{fill(REPAIR.waiting, it.name)}</p>}
            {st !== 'wait' && !repair && (
              <>
                <p className="small">{REPAIR.invite}</p>
                <p className="muted small">{REPAIR.step1} {REPAIR.step2} {REPAIR.why}</p>
                <div className="row wrap"><button className="btn small primary" onClick={() => setRepair(true)}>{REPAIR.button}</button><button className="btn small ghost" onClick={() => setSel(null)}>{REPAIR.later}</button></div>
              </>
            )}
            {st !== 'wait' && repair && <RepairCard key={'p' + it.id} profile={profile} update={update} id={it.id} />}
          </>}
        </div>
      )}
      <p className="muted small">{PEDESTAL_HONEST}</p>
    </section>
  );
}
