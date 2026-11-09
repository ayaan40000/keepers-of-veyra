// 1.3 The Keeper's Ledger: the player's own cards in books, asked again for years.
// The review screen is a study and recall screen: still and quiet (no animation, no sound).
import React, { useMemo, useRef, useState } from 'react';
import { PxIcon } from './game/PxIcon.jsx';
import { DialogueBox } from './game/DialogueBox.jsx';
import { Portrait } from '../pixel/Faces.jsx';
import { today } from '../engine/core.js';
import { gateDone } from '../engine/guide.js';
import { KINDS, STARTERS, CAPS, DAILY, sitting, openingQueue, resetDaily, OPENING_WEEK, dueCount, bookStats, addBook, addCard, addStarter, parseBulk, matchCard, selfMarked, recordReview, cardCount, newList } from '../engine/ledger.js';
import { LEDGER_TEXT as T } from '../data/ledger.js';

export const ledgerOpen = (p) => gateDone(p, 'M1') || !!p?.progress?.reviewerUnlock;
// 1.9: should today's session open with the Ledger? Week 5 on, due reviews only, once a day, player can turn it off.
export const ledgerOpens = (p, week) => ledgerOpen(p) && week >= OPENING_WEEK && p.user?.prefs?.ledgerFirst !== false && p.ledger?.daily?.opened !== today(p) && openingQueue(p.ledger, today(p)).length > 0;

// The Ledger as the first step of the day. Skipping is always fine and costs nothing.
export function LedgerOpening({ profile, update, onDone }) {
  const [go, setGo] = useState(false);
  const mark = () => update((p) => { resetDaily(p.ledger, today(p)).opened = today(p); });
  const n = openingQueue(profile.ledger, today(profile)).length;
  if (go) return <Review profile={profile} update={update} opening onDone={() => { mark(); onDone(); }} />;
  return (
    <div className="page ledger">
      <section className="card" data-testid="ledger-opening">
        <h2 className="panel-title"><PxIcon name="scroll" size={28} />The Ledger first</h2>
        <p className="small">{n === 1 ? 'One of your own cards is due.' : `${n} of your own cards are due.`} Calder keeps them at the start of the day, while your mind is fresh.</p>
        <p className="muted small">Skipping is fine. They wait for you on the Ledger page.</p>
        <div className="row wrap">
          <button className="btn primary" autoFocus onClick={() => setGo(true)}>Answer them</button>
          <button className="btn ghost" onClick={() => { mark(); onDone(); }}>Skip to today's session</button>
        </div>
      </section>
    </div>
  );
}

export function LedgerCard({ profile, onOpen }) {
  if (!ledgerOpen(profile) || !profile.ledger?.books?.length) return null;
  const n = dueCount(profile.ledger, today(profile));
  if (!n) return null;
  return (
    <section className="card glass" data-testid="ledger-card">
      <h3 className="panel-title"><PxIcon name="scroll" size={28} />The Keeper's Ledger</h3>
      <p className="small">{n === 1 ? 'One card is due today.' : `${n} cards are due today.`} About {Math.max(1, Math.round(Math.min(n, DAILY.reviews) / 6))} minute{n > 6 ? 's' : ''}.</p>
      <p className="muted small">Optional. It never blocks the day and never counts against your streak.</p>
      <button className="btn" onClick={onOpen}>Open the Ledger</button>
    </section>
  );
}

export function LedgerEntry({ profile, onOpen }) {
  const open = ledgerOpen(profile);
  const n = profile.ledger?.books?.length || 0;
  return (
    <section className="card" data-testid="ledger-entry">
      <h3 className="panel-title"><PxIcon name="scroll" size={28} />The Keeper's Ledger</h3>
      <p className="small">{T.entry}</p>
      {open ? <button className="btn" onClick={onOpen}>{n ? `Open the Ledger (${n} book${n > 1 ? 's' : ''})` : 'Open the Ledger'}</button> : <p className="small muted">{T.gate}</p>}
    </section>
  );
}

export default function Ledger({ profile, update, onExit }) {
  const date = today(profile);
  const l = profile.ledger;
  const [view, setView] = useState(l.books.length ? 'shelf' : 'intro');
  const [bookId, setBookId] = useState(null);
  const book = l.books.find((b) => b.id === bookId);

  if (view === 'intro') return (
    <div className="page ledger">
      <h1 className="page-title"><PxIcon name="scroll" size={36} />The Keeper's Ledger</h1>
      <DialogueBox speaker="Calder" portrait={<Portrait id="calder" scale={2} />} lines={T.calder} />
      <section className="card">
        <p className="small">{T.how}</p>
        <p className="muted small">{T.honest}</p>
        <div className="row wrap">
          <button className="btn primary" onClick={() => setView('shelf')}>Take the Ledger</button>
          <button className="btn ghost" onClick={onExit}>Not now</button>
        </div>
      </section>
    </div>
  );

  if (view === 'review') return <Review profile={profile} update={update} onDone={() => setView('shelf')} />;
  if (view === 'book' && book) return <BookView profile={profile} update={update} book={book} onBack={() => setView('shelf')} />;

  const due = sitting(l, date).length;
  return (
    <div className="page ledger">
      <h1 className="page-title"><PxIcon name="scroll" size={36} />The Keeper's Ledger</h1>
      <section className="card">
        <p className="small">{due ? `${due} card${due > 1 ? 's' : ''} to ask today (reviews first, then up to ${DAILY.newCards} new).` : 'Nothing is due today. Write new cards, or come back tomorrow.'}</p>
        <div className="row wrap">
          <button className="btn primary" disabled={!due} onClick={() => setView('review')}>Ask me</button>
          <button className="btn ghost" onClick={onExit}>Back</button>
        </div>
      </section>
      <section className="card">
        <h3>Your shelf</h3>
        {!l.books.length && <p className="small muted">The shelf is empty. Start a book below, or take a starter book.</p>}
        <div className="ledger-shelf">{l.books.map((b) => {
          const st = bookStats(b, date);
          return (
            <button key={b.id} className="ledger-spine" style={{ '--glow': st.glow.toFixed(2) }} onClick={() => { setBookId(b.id); setView('book'); }} aria-label={`${b.title}: ${st.total} cards, ${st.kept} kept, ${st.due} due`}>
              <b>{b.title}</b><small>{KINDS[b.kind].label} · {st.total} card{st.total === 1 ? '' : 's'} · {st.kept} kept{st.due ? ` · ${st.due} due` : ''}</small>
            </button>
          );
        })}</div>
        <p className="muted small">{T.glow}</p>
        {l.books.some((b) => b.kind === 'project') && <p className="small">Projects with a kept card: {Math.min(3, l.books.filter((b) => b.kind === 'project' && bookStats(b, date).kept > 0).length)} of 3 (the Month 10 roads).</p>}
      </section>
      <NewBook profile={profile} update={update} onMade={(id) => { setBookId(id); setView('book'); }} />
      <section className="card">
        <h3>Starter books</h3>
        <p className="small muted">{T.starters}</p>
        <div className="row wrap">{STARTERS.map((s) => {
          const have = l.books.some((b) => b.starter === s.id);
          return <button key={s.id} className="btn" disabled={have} onClick={() => update((p) => { addStarter(p.ledger, s.id, today(p)); })}>{have ? `${s.title} (on your shelf)` : s.title}</button>;
        })}</div>
      </section>
      <p className="muted small ledger-foot">{cardCount(l)} of {CAPS.cards} cards. {T.local}</p>
    </div>
  );
}

function NewBook({ profile, update, onMade }) {
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('cards');
  const [reverse, setReverse] = useState(false);
  const [palace, setPalace] = useState('');
  const [err, setErr] = useState('');
  const make = () => {
    let id = null;
    update((p) => { const r = addBook(p.ledger, { title, kind, reverse, palace: palace || null }, today(p)); if (r.error) setErr(r.error); else id = r.book.id; });
    setTimeout(() => { if (id) { setTitle(''); onMade(id); } }, 0);
  };
  return (
    <section className="card">
      <h3>Start a book</h3>
      <label className="field">Name<input value={title} maxLength={CAPS.title} onChange={(e) => setTitle(e.target.value)} placeholder="Spanish verbs, Finance formulae, My jokes" /></label>
      <label className="field">Kind<select value={kind} onChange={(e) => setKind(e.target.value)}>{Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></label>
      <p className="small muted">{KINDS[kind].hint}</p>
      <label className="check"><input type="checkbox" checked={reverse} onChange={(e) => setReverse(e.target.checked)} /> Ask both ways</label>
      {(profile.palaces || []).length > 0 && (
        <label className="field">Tie to a palace (optional: card 1 sits on stop 1)<select value={palace} onChange={(e) => setPalace(e.target.value)}><option value="">No palace</option>{profile.palaces.map((pl) => <option key={pl.id} value={pl.id}>{pl.name}</option>)}</select></label>
      )}
      {err && <p className="small" role="alert">{err}</p>}
      <button className="btn primary" disabled={!title.trim()} onClick={make}>Start the book</button>
    </section>
  );
}

function BookView({ profile, update, book, onBack }) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [note, setNote] = useState('');
  const [bulk, setBulk] = useState('');
  const [msg, setMsg] = useState('');
  const k = KINDS[book.kind];
  const date = today(profile);
  const st = bookStats(book, date);
  const palace = (profile.palaces || []).find((pl) => pl.id === book.palace);
  const add = () => update((p) => {
    const e = addCard(p.ledger, book.id, { front, back, note }, today(p));
    if (e) setMsg(e); else { setMsg('Card written.'); setFront(''); setBack(''); setNote(''); }
  });
  const addBulk = () => update((p) => {
    const rows = parseBulk(bulk); let n = 0, e = null;
    for (const r of rows) { e = addCard(p.ledger, book.id, r, today(p)); if (e) break; n++; }
    setMsg(e ? `${n} cards written. ${e}` : `${n} cards written.`); if (!e) setBulk('');
  });
  const removeCard = (id) => update((p) => { const b = p.ledger.books.find((x) => x.id === book.id); b.cards = b.cards.filter((c) => c.id !== id); });
  const removeBook = () => { if (window.confirm(`Remove the book "${book.title}" and its ${book.cards.length} cards from this browser? This cannot be undone. Export a backup first if you might want it again.`)) { update((p) => { p.ledger.books = p.ledger.books.filter((b) => b.id !== book.id); }); onBack(); } };
  return (
    <div className="page ledger">
      <h1 className="page-title"><PxIcon name="scroll" size={36} />{book.title}</h1>
      <section className="card">
        <p className="small">{k.label} · {st.total} cards · {st.learned} started · {st.kept} kept (held after a month or more){book.reverse ? ' · asked both ways' : ''}{palace ? ` · on the route "${palace.name}"` : ''}</p>
        <p className="small muted">{k.hint}</p>
        <button className="btn ghost" onClick={onBack}>Back to the shelf</button>
      </section>
      <section className="card">
        <h3>Write a card</h3>
        <label className="field">{k.front}<input value={front} maxLength={CAPS.side} onChange={(e) => setFront(e.target.value)} /></label>
        <label className="field">{k.back}<input value={back} maxLength={CAPS.side} onChange={(e) => setBack(e.target.value)} /></label>
        <label className="field">Picture note (optional: your image, never required)<input value={note} maxLength={CAPS.note} onChange={(e) => setNote(e.target.value)} /></label>
        <p className="small muted">Several right answers? Separate them with a semicolon: Brasilia; Brasília.</p>
        <button className="btn primary" disabled={!front.trim() || !back.trim()} onClick={add}>Write it</button>
        <details><summary className="small">Paste many at once</summary>
          <p className="small muted">One card per line, front and back split by a tab or " = " (for example: casa = house).</p>
          <textarea rows={5} value={bulk} onChange={(e) => setBulk(e.target.value)} aria-label="Cards to paste" />
          <button className="btn" disabled={!bulk.trim()} onClick={addBulk}>Write these cards</button>
        </details>
        {msg && <p className="small" role="status">{msg}</p>}
      </section>
      <section className="card">
        <h3>Cards</h3>
        {!book.cards.length && <p className="small muted">No cards yet.</p>}
        <ol className="ledger-cards">{book.cards.slice(0, 300).map((c, i) => (
          <li key={c.id}><span><b>{c.front}</b> · {c.back}{palace?.loci?.[i] ? <small className="muted"> · stop: {palace.loci[i]}</small> : null}{c.s?.kept ? <small> · kept</small> : c.s ? <small className="muted"> · next {c.s.due}</small> : <small className="muted"> · new</small>}</span>
            <button className="btn ghost small" onClick={() => removeCard(c.id)} aria-label={`Remove card ${c.front}`}>Remove</button></li>
        ))}</ol>
        {book.cards.length > 300 && <p className="small muted">Showing the first 300 cards.</p>}
        <button className="btn ghost" onClick={removeBook}>Remove this book</button>
      </section>
    </div>
  );
}

function Review({ profile, update, onDone, opening = false }) {
  const date = today(profile);
  const queue = useMemo(() => (opening ? openingQueue(profile.ledger, date) : sitting(profile.ledger, date)), []); // fixed for this sitting
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState('ask'); // ask, shown (new card), result
  const [val, setVal] = useState('');
  const [res, setRes] = useState(null);
  const tally = useRef({ held: 0, of: 0, lumen: 0, kept: 0 });
  const q = queue[i];
  const book = q && profile.ledger.books.find((b) => b.id === q.bookId);
  const card = book?.cards.find((c) => c.id === q.cardId);
  const finish = () => setI(queue.length);

  if (!q || !card) {
    const t = tally.current;
    return (
      <div className="page ledger">
        <section className="card gold" role="status">
          <span className="tag">The Ledger is closed for today</span>
          <h2>{t.of ? `${t.held} of ${t.of} held.` : 'New cards written into memory.'}</h2>
          {t.kept > 0 && <p className="small">{t.kept === 1 ? 'One card is now kept: it held after a month or more.' : `${t.kept} cards are now kept: they held after a month or more.`}</p>}
          {t.lumen > 0 && <p className="small">+{t.lumen} Lumen for cards that held after a week or more.</p>}
          <p className="small muted">{T.after}</p>
          <button className="btn primary" autoFocus onClick={onDone}>{opening ? "On to today's session" : 'Back to the shelf'}</button>
        </section>
      </div>
    );
  }

  const dir = q.dir;
  const cue = dir === 'r' ? card.back : card.front;
  const answer = dir === 'r' ? card.front : card.back;
  const self = selfMarked(book, card, dir);
  const palace = (profile.palaces || []).find((pl) => pl.id === book.palace);
  const stop = palace?.loci?.[book.cards.indexOf(card)];
  const save = (held, typed) => {
    let r = null;
    update((p) => { r = recordReview(p, q, held, { date: today(p), typed }); });
    if (!q.fresh) { tally.current.of++; if (held) tally.current.held++; }
    setTimeout(() => { if (r) { tally.current.lumen += r.lumen; if (r.kept) tally.current.kept++; } }, 0);
    setRes({ held, typed });
    setPhase('result');
  };
  const next = () => { setVal(''); setRes(null); setPhase('ask'); setI(i + 1); };

  return (
    <div className="page ledger review">
      <section className="card">
        <span className="tag">{book.title} · card {i + 1} of {queue.length}{q.fresh ? ' · new' : ''}{dir === 'r' ? ' · the other way' : ''}</span>
        {stop && <p className="small muted">Stop: {stop}</p>}
        <h2 className="ledger-cue">{cue}</h2>
        {q.fresh && phase === 'ask' && (
          <>
            <p className="small">New card. The answer is:</p>
            <p className="ledger-answer"><b>{answer}</b></p>
            {card.note && <p className="small muted">Your picture: {card.note}</p>}
            <p className="small muted">Make a picture for it if you like, then go on. It will be asked tomorrow.</p>
            <button className="btn primary" autoFocus onClick={() => save(true, false)}>I have it</button>
          </>
        )}
        {!q.fresh && phase === 'ask' && (self ? (
          <>
            <p className="small">Say the answer aloud, or write it on paper, then look.</p>
            <button className="btn primary" autoFocus onClick={() => setPhase('shown')}>Show the answer</button>
          </>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); save(matchCard(val, answer), true); }}>
            <label className="field">{dir === 'r' ? KINDS[book.kind].front : KINDS[book.kind].back}<input autoFocus value={val} onChange={(e) => setVal(e.target.value)} autoComplete="off" spellCheck={false} /></label>
            <div className="row wrap"><button className="btn primary" type="submit" data-sfx="submit">Check</button><button className="btn ghost" type="button" onClick={() => save(false, true)}>I don't know</button></div>
          </form>
        ))}
        {phase === 'shown' && (
          <>
            <p className="ledger-answer"><b>{answer}</b></p>
            <p className="small">Did you have it?</p>
            <div className="row wrap"><button className="btn primary" autoFocus onClick={() => save(true, false)}>I had it</button><button className="btn" onClick={() => save(false, false)}>I missed it</button></div>
          </>
        )}
        {phase === 'result' && (
          <>
            {!q.fresh && <p className="small" role="status">{res.held ? 'Held.' : 'Not this time. It drifted, like a Dustleaf. It comes back tomorrow.'}</p>}
            {!q.fresh && <p className="ledger-answer">{answer}</p>}
            {!q.fresh && card.note && <p className="small muted">Your picture: {card.note}</p>}
            {book.kind === 'jokes' && !q.fresh && <p className="small muted">Now tell the whole joke aloud, as you would at the table.</p>}
            <div className="row wrap"><button className="btn primary" autoFocus onClick={next}>Next</button><button className="btn ghost" onClick={finish}>Stop for today</button></div>
          </>
        )}
      </section>
    </div>
  );
}
