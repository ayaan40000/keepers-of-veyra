import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SUITS, SUIT_MARK, SUIT_NAME, RANKS, LADDER, studySecondsFor, deckOrder, cardName, parseCard, runScore, positionOrder, positionStreak } from '../engine/cards.js';
import CARDS from '../data/add/cards.json';
import { PxIcon } from './game/PxIcon.jsx';
import { sfx } from '../audio/sfx.js';

// A card drawn in code: rank and suit as letters and a shape, so colour is never the only clue.
export function PlayingCard({ code, label }) {
  const rank = code.slice(0, -1), suit = code.slice(-1);
  return (
    <span className={`pcard${suit === 'H' || suit === 'D' ? ' red' : ''}`} role="img" aria-label={label || cardName(code)}>
      <span>{rank}</span><span className="suit" aria-hidden="true">{SUIT_MARK[suit]}</span><small aria-hidden="true">{suit}</small>
    </span>
  );
}

// Optional card practice. No skill credit, no Lumen, nothing is saved: it is a sport corner, and the screen says so.
// With `fixed` ({ n, mode }) it is one Event Hall round: no choosing, it starts at once, and onResult({ kind, run | streak, total }) is called once per finished round.
export default function Cards({ onClose, timerMult = 1, fixed = null, onResult = null, title = null }) {
  const [phase, setPhase] = useState(fixed ? 'study' : 'choose');
  const [n, setN] = useState(fixed?.n ?? 20);
  const [mode, setMode] = useState(fixed?.mode || 'run');
  const [seed, setSeed] = useState(() => (fixed ? Math.floor(Math.random() * 1e9) : 1));
  const posted = useRef(false);
  const deck = useMemo(() => deckOrder(seed, n), [seed, n]);
  const [page, setPage] = useState(0);
  const [left, setLeft] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState(null);
  const order = useMemo(() => positionOrder(n, seed), [seed, n]);
  const endRef = useRef(null);

  const total = Math.round(studySecondsFor(n) * timerMult);
  useEffect(() => {
    if (phase !== 'study') return undefined;
    const t0 = Date.now();
    setLeft(total);
    const id = setInterval(() => {
      const l = total - (Date.now() - t0) / 1000;
      if (l <= 0) { clearInterval(id); setPhase('recall'); } else setLeft(l);
    }, 500);
    return () => clearInterval(id);
  }, [phase, total]);
  useEffect(() => { if (phase === 'recall') endRef.current?.scrollIntoView?.({ block: 'nearest' }); }, [answers.length, phase]);

  const start = () => { posted.current = false; setSeed(Math.floor(Math.random() * 1e9)); setPage(0); setAnswers([]); setTyped(''); setResult(null); setPhase('study'); };
  const want = mode === 'run' ? deck.length : order.length;
  const add = (code) => { if (code && answers.length < want) setAnswers([...answers, code]); setTyped(''); };
  const finish = () => {
    sfx.soft();
    if (mode === 'run') setResult({ ...runScore(deck, answers), kind: 'run' });
    else setResult({ kind: 'pos', streak: positionStreak(deck, order, answers), total: n });
    setPhase('result');
  };
  // Position mode ends at the first miss.
  const addPos = (code) => {
    if (!code) return;
    const next = [...answers, code];
    setAnswers(next);
    setTyped('');
    const k = next.length - 1;
    if (parseCard(code) !== deck[order[k]] || next.length === order.length) {
      sfx.soft();
      setResult({ kind: 'pos', streak: positionStreak(deck, order, next), total: n, missed: parseCard(code) !== deck[order[k]] ? { pos: order[k] + 1, card: deck[order[k]] } : null });
      setPhase('result');
    }
  };

  useEffect(() => {
    if (phase === 'result' && result && onResult && !posted.current) { posted.current = true; onResult(result); }
  }, [phase, result]);

  const picker = (onPick, used) => (
    <div role="group" aria-label="Card picker">
      {SUITS.map((s) => (
        <div key={s} className="card-picker" role="group" aria-label={SUIT_NAME[s]}>
          {RANKS.map((r) => <button key={r + s} type="button" className="btn tiny" disabled={used.includes(r + s)} aria-label={cardName(r + s)} onClick={() => onPick(r + s)}>{r}{SUIT_MARK[s]}{s}</button>)}
        </div>
      ))}
      <label className="field">Or type a card code (such as 10H or AS)
        <input autoComplete="off" autoCapitalize="off" spellCheck={false} value={typed} onChange={(e) => setTyped(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onPick(parseCard(typed)); } }} />
      </label>
    </div>
  );

  return (
    <section className="card" data-quiet={phase === 'study' || phase === 'recall' ? true : undefined}>
      <h3 className="panel-title"><PxIcon name="quill" size={28} />{title || 'Card Run (optional)'}</h3>
      {phase === 'choose' && (
        <>
          <p className="small">{CARDS.plain.intro} {CARDS.plain.honest}</p>
          <p className="muted small">It earns no Lumen and changes no skill estimate, and nothing here is saved. It is practice for its own sake.</p>
          <label className="field">How many cards
            <select value={n} onChange={(e) => setN(+e.target.value)}>{LADDER.map((x) => <option key={x} value={x}>{x} cards ({studySecondsFor(x)} seconds to study)</option>)}</select>
          </label>
          <label className="field">Format
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="run">Deck Run: write the deck back in order</option>
              <option value="pos">Double Deck style: asked by position, ends at the first miss</option>
            </select>
          </label>
          <div className="row wrap"><button className="btn primary" onClick={start}>Start</button><button className="btn ghost small" onClick={onClose}>Close</button></div>
          <CardHelp />
        </>
      )}
      {phase === 'study' && (
        <>
          <p className="muted small" role="timer" aria-label={`${Math.ceil(left)} seconds left`}>{Math.ceil(left)} seconds left. Cards {page * 4 + 1} to {Math.min(n, page * 4 + 4)} of {n}.</p>
          <div className="card-row">{deck.slice(page * 4, page * 4 + 4).map((c) => <PlayingCard key={c} code={c} />)}</div>
          <p className="sr-only">{deck.slice(page * 4, page * 4 + 4).map(cardName).join(', ')}</p>
          <div className="row wrap">
            <button className="btn ghost small" disabled={page === 0} onClick={() => setPage(page - 1)}>Back</button>
            {(page + 1) * 4 < n ? <button className="btn" autoFocus onClick={() => setPage(page + 1)}>Next four</button> : <button className="btn" autoFocus onClick={() => setPhase('recall')}>I'm ready</button>}
          </div>
        </>
      )}
      {phase === 'recall' && mode === 'run' && (
        <>
          <p className="muted small">Write the deck back in order. Card {Math.min(answers.length + 1, n)} of {n}. The first mistake ends your run, but you can still fill the rest.</p>
          <div className="card-slots" aria-label="Your answers">{deck.map((_, i) => <span key={i} className="chip">{i + 1}: {answers[i] || '·'}</span>)}</div>
          {picker((c) => add(c), answers)}
          <div className="row wrap" ref={endRef}>
            <button className="btn ghost small" disabled={!answers.length} onClick={() => setAnswers(answers.slice(0, -1))}>Undo</button>
            <button className="btn primary" data-sfx="soft" onClick={finish}>Check my deck</button>
          </div>
        </>
      )}
      {phase === 'recall' && mode === 'pos' && (
        <>
          <p className="muted small">Question {answers.length + 1} of {order.length}. One miss ends the round, gently, with the answer shown.</p>
          <p className="big center">Which card was number {order[answers.length] + 1}?</p>
          {picker((c) => addPos(c), [])}
        </>
      )}
      {phase === 'result' && result && (
        <>
          {result.kind === 'run' ? (
            <>
              <p className="score-big">{result.run}<small>/{result.total}</small></p>
              <p>Longest correct run from card 1: {result.run} of {result.total}. {result.right} cards were in the right place.</p>
              {result.run < result.total && <p className="small muted">The deck was: <span className="card-row">{deck.map((c, i) => <span key={i} className="chip">{i + 1} {c}</span>)}</span></p>}
            </>
          ) : (
            <>
              <p className="score-big">{result.streak}<small>/{result.total}</small></p>
              <p>{result.missed ? `Round ended at position ${result.missed.pos}: the card was ${cardName(result.missed.card)}.` : 'You answered every position.'} Right in a row: {result.streak}.</p>
            </>
          )}
          <p className="muted small">{CARDS.plain.honest} A personal best only counts when the deck is longer or the time shorter at the same accuracy.</p>
          <div className="row wrap"><button className="btn primary" onClick={() => (fixed ? start() : setPhase('choose'))}>Again</button><button className="btn ghost small" onClick={onClose}>{fixed ? 'Back to the Hall' : 'Close'}</button></div>
        </>
      )}
    </section>
  );
}

function CardHelp() {
  return (
    <details className="about-more">
      <summary>Card pictures: a rule you can learn in minutes</summary>
      <p className="small"><b>{CARDS.rule.name}.</b> {CARDS.rule.text}</p>
      <p className="small muted">{CARDS.codes}</p>
      <ul className="small">{Object.entries(CARDS.images).map(([c, img]) => <li key={c}><b>{c}</b>: {img}</li>)}</ul>
      <p className="small">{CARDS.own}</p>
      <p className="small"><b>{CARDS.guide.title}.</b></p>
      <ol className="small">{CARDS.guide.steps.map((s) => <li key={s}>{s}</li>)}</ol>
      <p className="small note">{CARDS.guide.honestNote}</p>
    </details>
  );
}
