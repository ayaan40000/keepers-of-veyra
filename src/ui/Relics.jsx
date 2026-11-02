import React, { useState } from 'react';
import { today } from '../engine/core.js';
import { Tip } from './Tips.jsx';
import { ITEMS, KINDS, RARITY } from '../data/items.js';
import { earnedItems, collectionStats, fadedRelics, recentlyEarned, recallCard, canPolish, answerCard } from '../engine/collect.js';
import { ItemIcon, ItemCard } from './ItemIcon.jsx';
import { CryptCard } from './Crypt.jsx';
import { PixelBar } from './game/PixelBar.jsx';
import { PxIcon } from './game/PxIcon.jsx';

function RecallCard({ profile, update, id }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState('');
  const [res, setRes] = useState(null);
  const day = today(profile);
  const card = recallCard(id);
  const polished = profile.relics?.polish?.[id];
  if (!card) return null;
  if (polished && res !== true) return <p className="small relic-shine">Polished on {polished}. It catches the lamplight.</p>;
  if (res === true) return <p className="small relic-shine" role="status">Right: "{card.answer}". The relic is polished and shines.</p>;
  if (res === false) return <p className="small" role="status">Not quite. The word was "{card.answer}". Read its story again; you can try another card tomorrow.</p>;
  if (!canPolish(profile, id, day)) return profile.relics?.tried?.[id] === day ? <p className="small muted">You can try this card again tomorrow.</p> : null;
  if (!open) return <button className="btn small" onClick={() => setOpen(true)}>Recall card: polish this relic</button>;
  return (
    <form className="recall-card" onSubmit={(e) => { e.preventDefault(); let ok = false; update((p) => { ok = answerCard(p, id, val, day); }); setRes(ok); }}>
      <p className="small">Fill the gap from this relic's story. ({card.hint})</p>
      <p className="small story-text">{card.text}</p>
      <label className="field">Missing word<input autoFocus autoComplete="off" value={val} onChange={(e) => setVal(e.target.value)} /></label>
      <button className="btn primary small" disabled={!val.trim()}>Check</button>
    </form>
  );
}

// Calder's Ledger as a book (v0.6): her pages in order, blank until found.
function LedgerBook({ owned }) {
  const pages = ITEMS.filter((i) => i.kind === 'page');
  const [i, setI] = useState(() => Math.max(0, pages.findIndex((p) => owned.has(p.id))));
  const pg = pages[i];
  const have = owned.has(pg.id);
  return (
    <section className="card ledger-book" aria-label="Calder's Ledger">
      <h3 className="panel-title"><PxIcon name="scroll" size={24} />Calder's Ledger</h3>
      <article className={`ledger-page${have ? '' : ' blank'}`}>
        <h4>Page {i + 1}</h4>
        <p className="small">{have ? pg.lore : 'This page is still missing. It waits behind a district gate.'}</p>
      </article>
      <div className="ledger-nav">
        <button className="btn small" disabled={i === 0} onClick={() => setI(i - 1)}>Previous page</button>
        <span className="small muted">{i + 1} of {pages.length}</span>
        <button className="btn small" disabled={i === pages.length - 1} onClick={() => setI(i + 1)}>Next page</button>
      </div>
    </section>
  );
}

export default function Relics({ profile, onEnterCrypt, update }) {
  const owned = new Set(earnedItems(profile));
  const faded = new Set(fadedRelics(profile));
  const recent = recentlyEarned(profile);
  const stats = collectionStats(profile);
  const [kind, setKind] = useState('artifact');
  const [sel, setSel] = useState(null);
  const list = ITEMS.filter((i) => i.kind === kind);
  const k = KINDS.find((x) => x.id === kind);
  return (
    <div className="page relics">
      <h1 className="page-title">Reliquary</h1>
      <section className="card gold">
        <div className="row between">
          <h3 className="panel-title"><PxIcon name="chest" size={28} />Your collection</h3>
          <b className="num">{stats.owned} / {stats.total}</b>
        </div>
        <PixelBar value={stats.owned / stats.total} size="md" tone="gold" />
        <p className="muted small">Every relic is earned by real progress: restoring districts, finishing side quests, earning seals, and descending into the Undercroft.</p>
      </section>

      <Tip profile={profile} update={update} id="relics">Relics come only from real progress. Open one to read its story, then try its recall card to polish it. If a delayed recall slips, that district's relic fades until you recall it well again.</Tip>

      {recent.length > 0 && (
        <section className="card">
          <h3 className="panel-title"><PxIcon name="star" size={24} />Recently earned</h3>
          <div className="recent-row">{recent.map((id) => (
            <button key={id} className="relic-slot have" aria-label={`${ITEMS.find((x) => x.id === id)?.name}, recently earned`} onClick={() => { setKind(ITEMS.find((x) => x.id === id)?.kind || kind); setSel(id); }}>
              <ItemIcon id={id} scale={2} owned />
            </button>
          ))}</div>
        </section>
      )}

      {faded.size > 0 && (
        <section className="card notice warn-card">
          <h3 className="panel-title"><PxIcon name="lumen" size={24} />{faded.size === 1 ? 'A relic is fading' : `${faded.size} relics are fading`}</h3>
          <p className="small">A recent delayed recall slipped below 60%, so {faded.size === 1 ? 'its relic has' : 'their relics have'} dimmed. Pass the next delayed recall for that skill in your daily session and the light comes back.</p>
        </section>
      )}

      <CryptCard profile={profile} onEnter={onEnterCrypt} />

      <div className="subtabs" role="tablist" aria-label="Relic kinds">
        {KINDS.map((x) => (
          <button key={x.id} role="tab" aria-selected={kind === x.id} className={kind === x.id ? 'on' : ''} onClick={() => { setKind(x.id); setSel(null); }}>
            {x.name} {stats.byKind[x.id]?.owned ?? 0}/{stats.byKind[x.id]?.total ?? 0}
          </button>
        ))}
      </div>
      <p className="muted small">{k?.blurb}</p>

      {kind === 'page' && <LedgerBook owned={owned} />}

      <section className="card relic-grid-card">
        <div className="relic-grid">
          {list.map((it) => {
            const have = owned.has(it.id);
            return (
              <button key={it.id} className={`relic-slot ${have ? 'have' : 'missing'} ${sel === it.id ? 'sel' : ''} ${faded.has(it.id) ? 'faded' : ''} ${profile.relics?.polish?.[it.id] ? 'polished' : ''}`} style={{ '--rar': RARITY[it.rarity]?.color }}
                aria-label={have ? `${it.name}, ${RARITY[it.rarity]?.label}${faded.has(it.id) ? ', fading' : ''}${profile.relics?.polish?.[it.id] ? ', polished' : ''}` : 'Undiscovered relic'} aria-pressed={sel === it.id} onClick={() => setSel(it.id)}>
                <ItemIcon id={it.id} scale={2} owned={have} />
              </button>
            );
          })}
        </div>
      </section>
      {sel && (
        <section className="card parchment relic-detail">
          <ItemCard id={sel} owned={owned.has(sel)} />
          {faded.has(sel) && <p className="small warn">Fading: the delayed recall for this district's skill slipped. Recall it well again to restore the light.</p>}
          {owned.has(sel) && <RecallCard key={sel} profile={profile} update={update} id={sel} />}
        </section>
      )}
    </div>
  );
}
