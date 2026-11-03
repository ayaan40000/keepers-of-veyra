// 1.1 The Event Hall and the Say-Back Games. Study and recall screens are still and quiet (data-quiet; the one soft submit sound
// is played on Check). Nothing here changes skill estimates or earns Lumen: only best results are kept. The rival is story.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PxIcon } from './game/PxIcon.jsx';
import { PixelFace } from '../pixel/Faces.jsx';
import { ArtImg, artFor } from './artLookup.jsx';
import Cards from './Cards.jsx';
import { sfx } from '../audio/sfx.js';
import { groupDigits } from '../engine/additions.js';
import {
  EVENT_IDS, SEASON_EVENTS, ELIMINATION, PACE_SECONDS, STRIKE_LIMIT, hallOpen, seasonOpen, ensureEvents, sizeOf, levelsOf, sizeLabel, maxOf,
  buildRound, scoreRound, strikeRun, topBest, bestAt, postResult, tierDef, levelFor, tierEvents, startSeason, postedCount, canClose, tierMarks, closeTier, finalLamps, finalWon, playFinal,
} from '../engine/events.js';
import {
  EVENTS, EXTRA_COPY, GAMES_TITLE, GAMES_STORY, GAMES_RULES, TIERS, FINAL, RIVAL, RIVAL_INTRO, RIVAL_LINES, RIVAL_SCENES, RIVAL_CLOSING, HALL_HONEST,
} from '../data/events.js';
import COPY from '../data/add/eventcopy.json';

const copyOf = (id) => (EVENTS[id].copy ? COPY.events[EVENTS[id].copy] : EXTRA_COPY[id]);
const pct = (x) => `${Math.round(x * 100)}%`;
const say = (text, profile) => String(text).replace(/\{name\}/g, profile.user.alias || 'friend');

// ---------- small pieces ----------
function Rival({ children, profile, mood }) {
  return (
    <figure className="rival-line">
      {artFor(RIVAL.art) && <ArtImg id={RIVAL.art} className="rival-art" alt="Ottoline Gilt" />}
      <blockquote><p>{say(children, profile)}</p><cite>{RIVAL.name}</cite></blockquote>
    </figure>
  );
}

function Study({ round, seconds, onDone }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => { const t = setInterval(() => setLeft((v) => v - 1), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { if (left <= 0) onDone(); }, [left]);
  const k = round.kind;
  return (
    <section className="card drill ev-study" data-quiet>
      <span className="tag">Study · {Math.max(0, left)}s</span>
      <h2>{EVENTS[round.id].hall}</h2>
      {k === 'names' && <ul className="study-rows">{round.items.map((it, i) => <li key={i}><PixelFace seed={it.face} size={48} scale={2} /><span>{it.first} {it.last}</span></li>)}</ul>}
      {k === 'numbers' && <ol className="study-rows">{Array.from({ length: round.n }, (_, r) => <li key={r}><b className="muted">Row {r + 1}</b><span className="digits">{groupDigits(round.digits.slice(r * 20, r * 20 + 20).join(''), 4).join(' ')}</span></li>)}</ol>}
      {k === 'poem' && <><p className="small muted">{round.title}, by {round.author}</p><ol className="study-rows">{round.lines.map((l, i) => <li key={i}><b className="muted">{i + 1}</b><span>{l.answer}</span></li>)}</ol></>}
      {k === 'words' && <ul className="study-rows words-grid">{round.words.map((w, i) => <li key={i}><b className="muted">{i + 1}</b><span>{w}</span></li>)}</ul>}
      {k === 'strikes' && <ul className="study-rows">{round.people.map((pp) => <li key={pp.name}><b>{pp.name}</b><span>{pp.lines.map(([f, v]) => `${f}: ${v}`).join(' · ')}</span></li>)}</ul>}
      {k === 'dates' && <ul className="study-rows">{round.items.map((it, i) => <li key={i}><b>{it.year}</b><span>{it.text}</span></li>)}</ul>}
      {k === 'facts' && <ul className="study-rows">{round.items.map((it, i) => <li key={i}><span>{it.q} <b>{it.answer}</b></span></li>)}</ul>}
      <button className="btn primary" onClick={onDone}>I am ready</button>
    </section>
  );
}

// Fields for the form-style events. Answers are kept as vals[key][field] and turned into scoreRound's shape by toAnswers.
function formRows(round) {
  switch (round.id) {
    case 'names': return round.order.map((idx, pos) => ({ key: idx, label: `Face ${pos + 1}`, face: round.items[idx].face, fields: [{ id: 'first', label: 'First name' }, { id: 'last', label: 'Last name' }] }));
    case 'numbers': return Array.from({ length: round.n }, (_, r) => ({ key: r, label: `Row ${r + 1}`, fields: [{ id: 'd', label: 'The 20 digits', digits: true }] }));
    case 'poem': return [
      ...round.lines.map((_, i) => ({ key: i, label: `Line ${i + 1}`, fields: [{ id: 't', label: 'The line' }] })),
      { key: 'title', label: 'Title', fields: [{ id: 't', label: 'The title' }] },
      { key: 'author', label: 'Author', fields: [{ id: 't', label: 'The poet' }] },
    ];
    case 'dates': return round.order.map((idx, pos) => ({ key: idx, label: `${pos + 1}. ${round.items[idx].text}`, fields: [{ id: 'y', label: 'Year (add BCE if before the common era)' }] }));
    default: return round.order.map((idx, pos) => ({ key: idx, label: `${pos + 1}. ${round.items[idx].q}`, fields: [{ id: 'a', label: 'Answer' }] }));
  }
}
function toAnswers(round, vals) {
  const g = (k, f) => vals[k]?.[f] ?? '';
  const out = {};
  switch (round.id) {
    case 'names': round.items.forEach((_, i) => { out[i] = { first: g(i, 'first'), last: g(i, 'last') }; }); break;
    case 'numbers': for (let r = 0; r < round.n; r++) out[r] = g(r, 'd'); break;
    case 'poem': round.lines.forEach((_, i) => { out[i] = g(i, 't'); }); out.title = g('title', 't'); out.author = g('author', 't'); break;
    case 'dates': round.items.forEach((_, i) => { out[i] = g(i, 'y'); }); break;
    default: round.items.forEach((_, i) => { out[i] = g(i, 'a'); });
  }
  return out;
}

function FormRecall({ round, onSubmit }) {
  const rows = useMemo(() => formRows(round), [round]);
  const [vals, setVals] = useState({});
  const set = (k, f, v) => setVals((x) => ({ ...x, [k]: { ...(x[k] || {}), [f]: v } }));
  const hint = { names: 'Type the first name and the last name of each face. Spelling must be exact; capitals and spacing are ignored.', numbers: 'One row at a time, in order. A row counts only when all 20 digits are right. A blank row ends the scoring.', poem: 'Every word, capital and punctuation mark must match. Lines you skip cost nothing, but more than two skipped in a row ends the scoring.', dates: 'One point for each year with every digit right.', facts: 'Numbers must be exact. Small typos in words are forgiven.' }[round.id];
  return (
    <form className="card drill ev-recall" data-quiet onSubmit={(e) => { e.preventDefault(); sfx.soft(); onSubmit(toAnswers(round, vals)); }}>
      <span className="tag">Recall</span>
      <h2>{EVENTS[round.id].hall}</h2>
      <p className="small muted">{hint} A blank costs nothing.</p>
      <ol className="trial-items">{rows.map((r, i) => (
        <li key={r.key}>
          {r.face != null && <PixelFace seed={r.face} size={48} scale={3} />}
          {r.fields.map((f, j) => {
            const v = vals[r.key]?.[f.id] || '';
            return (
              <label key={f.id} className="field">{j === 0 ? `${r.label}: ` : ''}{f.label}
                <input autoFocus={i === 0 && j === 0} autoComplete="off" autoCapitalize="off" spellCheck="false" inputMode={f.digits ? 'numeric' : undefined} value={v} onChange={(e) => set(r.key, f.id, e.target.value)} />
                {f.digits && <small className="muted">{v.replace(/\D/g, '').length} of 20 digits</small>}
              </label>
            );
          })}
        </li>
      ))}</ol>
      <button className="btn primary">Check</button>
    </form>
  );
}

// Words and Three Strikes: one question at a time, three wrong or blank answers end the round gently.
function StrikeRecall({ round, pace, timer, onEnd }) {
  const [answers, setAnswers] = useState([]);
  const [val, setVal] = useState('');
  const [fb, setFb] = useState(null);
  const k = answers.length;
  const run = strikeRun(round, answers);
  const q = round.questions[k];
  const limit = Math.round(PACE_SECONDS * timer);
  const [left, setLeft] = useState(limit);
  const submit = (text) => {
    if (fb || !q) return;
    const next = [...answers, text];
    const res = strikeRun(round, next);
    const ok = res.log[res.log.length - 1].ok;
    if (!ok) sfx.soft();
    setAnswers(next); setVal('');
    if (ok && !res.ended && next.length < round.questions.length) return;
    setFb({ ok, answer: q.answer, ended: res.ended || next.length >= round.questions.length, next });
  };
  const ref = useRef(submit); ref.current = submit;
  useEffect(() => {
    if (!pace || fb || !q) return undefined;
    const t0 = Date.now();
    setLeft(limit);
    const id = setInterval(() => {
      const l = limit - Math.floor((Date.now() - t0) / 1000);
      setLeft(Math.max(0, l));
      if (l <= 0) { clearInterval(id); ref.current(''); }
    }, 500);
    return () => clearInterval(id);
  }, [k, !!fb, pace]);
  const lamps = Math.max(0, STRIKE_LIMIT - run.strikes);
  return (
    <section className="card drill ev-recall" data-quiet>
      <span className="tag">Recall</span>
      <h2>{EVENTS[round.id].hall}</h2>
      <p className="small" aria-label={`${lamps} of ${STRIKE_LIMIT} lamps still lit`}>Lamps: <span aria-hidden="true">{'●'.repeat(lamps)}{'○'.repeat(STRIKE_LIMIT - lamps)}</span> {lamps} of {STRIKE_LIMIT} lit · Question {Math.min(k + 1, round.questions.length)} of {round.questions.length} · Right so far: {run.score}</p>
      {pace && !fb && <p className="muted small" role="timer">{left} seconds for this answer (Contest pace).</p>}
      {!fb && q && (
        <form onSubmit={(e) => { e.preventDefault(); submit(val); }}>
          <label className="field">{q.prompt}
            <input autoFocus autoComplete="off" autoCapitalize="off" spellCheck="false" value={val} onChange={(e) => setVal(e.target.value)} />
          </label>
          <p className="muted small">A wrong or empty answer puts a lamp out. The right answer is shown after.</p>
          <button className="btn primary">Answer</button>
        </form>
      )}
      {fb && (
        <div role="status">
          {fb.ok ? <p><b>Right.</b></p> : <p><b>A lamp goes out.</b> The answer was <b>{fb.answer}</b>.</p>}
          {fb.ended && run.strikes >= STRIKE_LIMIT && <p className="small">That was the third lamp. The round ends here, gently, and nothing is lost.</p>}
          <button className="btn primary" autoFocus onClick={() => (fb.ended ? onEnd(fb.next) : setFb(null))}>{fb.ended ? 'See the result' : 'Next question'}</button>
        </div>
      )}
    </section>
  );
}

// What was missed, with the right answers, in plain words.
function Review({ round, res, answers }) {
  const miss = [];
  const parts = res.parts || [];
  if (round.id === 'names') round.items.forEach((it, i) => { if (!(parts[i]?.[0] && parts[i]?.[1])) miss.push(<li key={i}><PixelFace seed={it.face} size={48} scale={1} /> <b>{it.first} {it.last}</b> <span className="muted">(you wrote {[answers[i]?.first, answers[i]?.last].filter(Boolean).join(' ') || 'nothing'})</span></li>); });
  if (round.id === 'numbers') parts.forEach((ok, r) => { if (!ok) miss.push(<li key={r}>Row {r + 1}: <span className="digits">{groupDigits(round.digits.slice(r * 20, r * 20 + 20).join(''), 4).join(' ')}</span></li>); });
  if (round.id === 'poem') {
    round.lines.forEach((l, i) => { if (!parts[i]) miss.push(<li key={i}>Line {i + 1}: <b>{l.answer}</b></li>); });
    if (res.score < res.max) miss.push(<li key="t">Title and author: <b>{round.title}</b>, by <b>{round.author}</b></li>);
  }
  if (round.id === 'dates') round.items.forEach((it, i) => { if (!parts[i]) miss.push(<li key={i}>{it.text} <b>{it.year}</b></li>); });
  if (round.id === 'facts') round.items.forEach((it, i) => { if (!parts[i]) miss.push(<li key={i}>{it.q} <b>{it.answer}</b></li>); });
  if (round.id === 'words' || round.id === 'strikes') {
    const run = strikeRun(round, answers);
    run.log.forEach((x, i) => { if (!x.ok) miss.push(<li key={i}>{x.q.prompt} <b>{x.q.answer}</b></li>); });
    const rest = round.questions.slice(run.asked);
    return (
      <section className="card" data-quiet>
        <h3 className="panel-title"><PxIcon name="scroll" size={24} />The answers</h3>
        {miss.length > 0 && <ul className="small">{miss}</ul>}
        {rest.length > 0 && <details className="about-more"><summary>The ones not reached ({rest.length})</summary><ul className="small">{rest.map((x) => <li key={x.key}>{x.prompt} <b>{x.answer}</b></li>)}</ul></details>}
      </section>
    );
  }
  if (!miss.length) return null;
  return <section className="card" data-quiet><h3 className="panel-title"><PxIcon name="scroll" size={24} />The answers</h3><ul className="small">{miss}</ul></section>;
}

function Outcome({ id, lv, res, out, counted, tier }) {
  const name = EVENTS[id].hall;
  return (
    <section className="card gold" role="status">
      <span className="tag">{counted ? `Posted for ${tierDef(tier).name}` : 'Result'}</span>
      <p className="score-big">{res.score}<small>/{res.max}</small></p>
      <p className="small">{name}, {sizeLabel(id, lv)}.</p>
      {out.first && <p>A first result for this size. It is your best so far.</p>}
      {out.newBest && !out.first && <p>A new best for {name}: {res.score}. Your last best was {out.prev.score}.</p>}
      {out.matched && <p>You matched your best for {name}: {res.score}.</p>}
      {!out.first && !out.newBest && !out.matched && <p>{res.score} this time. Your best is still {out.prev.score}. That is fine. Every try is practice.</p>}
      <p className="muted small">It earns no Lumen and changes no skill estimate. Only your best is kept.</p>
    </section>
  );
}

// One round: study, recall, result. Cards and decks play on the Cards screen.
function Run({ profile, update, id, lv, tier, onExit, onAgain }) {
  const timer = profile.user.prefs.timerMult || 1;
  const [seed] = useState(() => Math.floor(Math.random() * 1e9));
  const round = useMemo(() => buildRound(id, lv, seed, profile), []);
  const pace = !!profile.events?.pace && ELIMINATION.includes(id);
  const [phase, setPhase] = useState(round.kind === 'cards' || round.kind === 'decks' ? 'cards' : 'intro');
  const [done, setDone] = useState(null);
  const finish = (score, max, answers) => {
    let out = null;
    update((p) => { out = postResult(p, id, lv, score, max, undefined, tier); });
    setDone({ res: { score, max, parts: [] }, out, answers });
  };
  const copy = copyOf(id);

  if (phase === 'cards') {
    return (
      <div className="page events">
        <Cards fixed={{ n: round.n, mode: id === 'cards' ? 'run' : 'pos' }} timerMult={timer} title={EVENTS[id].hall} onClose={onExit}
          onResult={(r) => finish(r.kind === 'run' ? r.run : r.streak, r.total)} />
        {done && <Outcome id={id} lv={lv} res={done.res} out={done.out} counted={tier != null && tierDef(tier)?.at?.[id] === lv} tier={tier} />}
      </div>
    );
  }
  if (phase === 'intro') {
    return (
      <div className="page events">
        <h1 className="page-title"><PxIcon name="crypt" size={36} />{EVENTS[id].hall}</h1>
        <section className="card">
          <span className="tag">{sizeLabel(id, lv)}</span>
          <p className="small">{copy.study}</p>
          <p className="muted small">Study time {Math.round(round.studySeconds * timer)} seconds. {pace ? `Contest pace is on: ${Math.round(PACE_SECONDS * timer)} seconds an answer.` : ''} Study and recall are still and quiet. Nothing here changes your skill estimates.</p>
          <div className="row wrap"><button className="btn primary" autoFocus onClick={() => setPhase('study')}>Begin studying</button><button className="btn ghost" onClick={onExit}>Not now</button></div>
        </section>
      </div>
    );
  }
  if (phase === 'study') return <div className="page events"><Study round={round} seconds={Math.round(round.studySeconds * timer)} onDone={() => setPhase('recall')} /></div>;
  if (phase === 'recall') {
    if (round.kind === 'words' || round.kind === 'strikes') {
      return <div className="page events"><StrikeRecall round={round} pace={pace} timer={timer} onEnd={(answers) => { const r = scoreRound(round, answers); finish(r.score, r.max, answers); setPhase('result'); }} /></div>;
    }
    return <div className="page events"><FormRecall round={round} onSubmit={(answers) => { const r = scoreRound(round, answers); finish(r.score, r.max, answers); setPhase('result'); }} /></div>;
  }
  // result
  const res = scoreRound(round, done?.answers || {});
  return (
    <div className="page events">
      {done && <Outcome id={id} lv={lv} res={res} out={done.out} counted={tier != null && tierDef(tier)?.at?.[id] === lv} tier={tier} />}
      <Review round={round} res={res} answers={done?.answers || {}} />
      <p className="muted small">{copy.honest}</p>
      <div className="row wrap"><button className="btn primary" autoFocus onClick={onAgain}>Another round</button><button className="btn" onClick={onExit}>Back to the Hall</button></div>
    </div>
  );
}

// ---------- the pages ----------
function EventPage({ profile, update, id, onStart, onBack }) {
  const copy = copyOf(id), ev = EVENTS[id];
  const [lv, setLv] = useState(1);
  const e = ensureEvents(profile);
  const pace = ELIMINATION.includes(id);
  return (
    <div className="page events">
      <button className="btn ghost small" onClick={onBack}>Back to the Hall</button>
      <h1 className="page-title"><PxIcon name="crypt" size={36} />{ev.hall}</h1>
      <section className="card">
        <span className="tag">{ev.plain}</span>
        <p className="story-text">{ev.why}</p>
        <p className="small"><b>How it works.</b> {copy.how}</p>
        <p className="small"><b>Our version.</b> {copy.ours}</p>
        <ul className="small">{copy.rules.map((r) => <li key={r}>{r}</li>)}</ul>
        <p className="small"><b>Scoring.</b> {copy.scoring}</p>
        <details className="about-more"><summary>Tips for this event</summary><ul className="small">{copy.advice.map((a) => <li key={a}>{a}</li>)}</ul><p className="small">{copy.study}</p><p className="small">{copy.recall}</p></details>
        <p className="muted small">{copy.honest}</p>
      </section>
      <section className="card">
        <h3 className="panel-title"><PxIcon name="chest" size={28} />Your best results</h3>
        <ul className="small ev-ladder">{Array.from({ length: levelsOf(id) }, (_, i) => i + 1).map((l) => { const b = bestAt(profile, id, l); return <li key={l}>Level {l}, {sizeLabel(id, l)}: {b ? <b>{b.score} of {b.max}</b> : <span className="muted">not tried yet</span>}</li>; })}</ul>
        <label className="field">Size
          <select value={lv} onChange={(ev2) => setLv(+ev2.target.value)}>{Array.from({ length: levelsOf(id) }, (_, i) => i + 1).map((l) => <option key={l} value={l}>Level {l}: {sizeLabel(id, l)}</option>)}</select>
        </label>
        {pace && <p className="muted small">Contest pace is {e.pace ? 'on' : 'off'}. You can change it on the Hall page.</p>}
        <button className="btn primary" onClick={() => onStart(id, lv, null)}>Practise this event</button>
      </section>
    </div>
  );
}

function MarkRow({ m, id }) {
  return <>You {m.mePts} of {m.max}, Ottoline {m.herPts} of {m.max}. {m.win ? 'Your lamp is lit.' : 'Hers was the higher mark.'}</>;
}

function SeasonPanel({ profile, update, onStart, onScene, onCup }) {
  const e = ensureEvents(profile), s = e.season;
  const [msg, setMsg] = useState('');
  if (!seasonOpen(profile)) {
    return (
      <section className="card">
        <h3 className="panel-title"><PxIcon name="chest" size={28} />{GAMES_TITLE}</h3>
        <p className="small">The Say-Back Games are a season of five tiers against a rival. They begin once the Lethe Gate is restored (Month 12). Until then, the Hall is open for practice.</p>
      </section>
    );
  }
  if (!s.tier) {
    return (
      <section className="card parchment">
        <span className="tag">{GAMES_TITLE}</span>
        <h3>Veyra's own memory contests</h3>
        {GAMES_STORY.map((t, i) => <p key={i} className="story-text">{t}</p>)}
        <h4 className="set-sub">How the Season works</h4>
        <ul className="small">{GAMES_RULES.map((r) => <li key={r}>{r}</li>)}</ul>
        <h4 className="set-sub">Your rival</h4>
        <p className="small">{RIVAL.name}. {RIVAL_INTRO}</p>
        <button className="btn primary" onClick={() => update((p) => { startSeason(p); })}>Enter the Quay Heat</button>
      </section>
    );
  }
  const t = tierDef(s.tier);
  const open = s.tier <= 4;
  const marks = open ? tierMarks(profile) : [];
  const markOf = (id) => marks.find((m) => m.id === id);
  if (open) {
    const posted = postedCount(profile);
    return (
      <section className="card parchment" data-testid="season">
        <span className="tag">{GAMES_TITLE} · Tier {t.n} of 5</span>
        <h3>{t.name}</h3>
        <p className="small muted">{t.where}. {t.blurb}</p>
        <Rival profile={profile}>{RIVAL_LINES[t.n].before}</Rival>
        <p className="small">Post a result in {t.need} of these events. Posted so far: <b>{posted}</b> of {t.need}. A result only has to be played, not passed. You see Ottoline's mark for an event once you have posted yours.</p>
        <ul className="ev-tier">{tierEvents(t.n).map((id) => {
          const lv = levelFor(t.n, id), m = markOf(id);
          return (
            <li key={id}>
              <b>{EVENTS[id].hall}</b> <span className="muted small">{sizeLabel(id, lv)}</span>
              <div className="small">{m ? <MarkRow m={m} id={id} /> : <span className="muted">Not posted yet.</span>}</div>
              <button className="btn small" onClick={() => onStart(id, lv, t.n)}>{m ? 'Play again at this size' : 'Play at this size'}</button>
            </li>
          );
        })}</ul>
        <button className="btn primary" disabled={!canClose(profile)} onClick={() => { let res = null; update((p) => { res = closeTier(p); }); if (res) onScene({ ...res }); }}>Hear how the evening went</button>
        {!canClose(profile) && <p className="muted small">Post {t.need - posted} more to close this tier.</p>}
        <p className="muted small">{msg}</p>
      </section>
    );
  }
  // the Final
  const lamps = finalLamps(profile);
  const won = !!s.won;
  return (
    <section className="card parchment" data-testid="season">
      <span className="tag">{GAMES_TITLE} · Tier 5 of 5</span>
      <h3>{FINAL.name}</h3>
      <p className="small muted">{FINAL.where}.</p>
      <Rival profile={profile}>{RIVAL_LINES[5].before}</Rival>
      <p className="small">Seven lamps, one for each event. Your best result in each is set beside hers, and you light a lamp when yours is at least as high. Light {FINAL.need} of the 7 and the Lamp Cup is yours. Ties go to you. Replay any event first to improve it. Losing locks nothing: you can light the lamps again whenever you like, with the same marks for her.</p>
      <ul className="ev-tier">{lamps.map((l) => (
        <li key={l.id}>
          <b>{EVENTS[l.id].hall}</b> <span className="muted small">{sizeLabel(l.id, l.lv)}</span>
          <div className="small">Your best: {l.mePts} of {l.max}. {l.me ? '' : 'Not tried at this size yet. '}</div>
          <button className="btn small" onClick={() => onStart(l.id, l.lv, null)}>Play to improve</button>
        </li>
      ))}</ul>
      <div className="row wrap">
        <button className="btn primary" onClick={() => { let res = null; update((p) => { res = playFinal(p); }); if (res) onCup(res); }}>{won ? 'See the Cup night again' : 'Light the lamps'}</button>
      </div>
      {won && <p className="note small">The Lamp Cup is yours.</p>}
    </section>
  );
}

function TierScene({ profile, res, onBack }) {
  const t = tierDef(res.tier);
  const line = RIVAL_LINES[res.tier][res.verdict];
  return (
    <div className="page events">
      <h1 className="page-title"><PxIcon name="crypt" size={36} />{t.name}</h1>
      <section className="card parchment" role="status">
        <span className="tag">How the evening went</span>
        <ul className="small ev-tier">{res.marks.map((m) => <li key={m.id}><b>{EVENTS[m.id].hall}</b>: <MarkRow m={m} id={m.id} /></li>)}</ul>
        <Rival profile={profile}>{line}</Rival>
        {RIVAL_SCENES[res.tier] && <p className="story-text">{RIVAL_SCENES[res.tier]}</p>}
        <p className="small">{res.tier < 4 ? `The next tier is open: ${TIERS[res.tier].name}.` : 'The Lamp Final is open.'}</p>
        <p className="muted small">Nothing was lost or won beyond your own best results. Scores measure performance on Mnemos tasks.</p>
      </section>
      <button className="btn primary big" autoFocus onClick={onBack}>Back to the Hall</button>
    </div>
  );
}

function CupNight({ profile, res, onBack }) {
  const [lit, setLit] = useState(0);
  const count = res.lamps.filter((l) => l.lit).length;
  const verdictKey = !res.won ? 'hers' : count >= 5 ? 'beat' : 'close';
  const all = lit >= res.lamps.length;
  return (
    <div className="page events">
      <h1 className="page-title"><PxIcon name="crypt" size={36} />The Lamp Final</h1>
      <section className="card parchment" role="status">
        <span className="tag">The Cup night</span>
        <p className="small">Seven lamps are lit one at a time, with your mark and hers side by side.</p>
        <ol className="ev-tier">{res.lamps.slice(0, lit).map((l) => (
          <li key={l.id}><b>{EVENTS[l.id].hall}</b><span>You {l.mePts} of {l.max}, Ottoline {l.herPts} of {l.max}. {l.lit ? 'Lamp lit.' : 'Lamp left dark.'}</span></li>
        ))}</ol>
        {!all && <button className="btn primary" autoFocus onClick={() => setLit(lit + 1)}>{lit === 0 ? 'Light the first lamp' : 'Light the next lamp'}</button>}
        {all && (
          <>
            <p><b>{count} of 7 lamps are lit.</b> {res.won ? 'The Lamp Cup is yours.' : 'The Cup stays with the Gilts tonight.'}</p>
            {res.won && artFor('event_lamp_cup') && <ArtImg id="event_lamp_cup" className="seam-art" />}
            <Rival profile={profile}>{RIVAL_LINES[5][verdictKey]}</Rival>
            <p className="story-text">{RIVAL_SCENES[5]}</p>
            {RIVAL_CLOSING.map((l, i) => i === 0 ? <Rival key={i} profile={profile}>{l.replace(/^"|"$/g, '')}</Rival> : <p key={i} className="story-text">{l}</p>)}
            <p className="muted small">{res.won ? 'A Chronolog entry about the Lamp Cup was added.' : 'Nothing is locked. Replay any event and light the lamps again whenever you like.'}</p>
          </>
        )}
      </section>
      <button className="btn primary big" onClick={onBack}>Back to the Hall</button>
    </div>
  );
}

function Board({ profile }) {
  const s = ensureEvents(profile).season;
  const done = Object.entries(s.marks).sort((a, b) => a[0] - b[0]);
  if (!done.length) return null;
  return (
    <section className="card" data-testid="rival-board">
      <h3 className="panel-title"><PxIcon name="scroll" size={28} />Ottoline's marks</h3>
      <p className="muted small">Her marks from tiers you have finished. They are story, set in advance, and never change what you earn.</p>
      {done.map(([tier, m]) => (
        <div key={tier} className="small">
          <b>{tierDef(+tier).name}</b>
          <ul>{Object.entries(m).map(([id, [me, her]]) => { const max = maxOf(id, levelFor(+tier, id)); return <li key={id}>{EVENTS[id].hall}: you {Math.round(me * max)} of {max}, Ottoline {Math.round(her * max)} of {max}</li>; })}</ul>
        </div>
      ))}
    </section>
  );
}

export default function EventHall({ profile, update, onExit }) {
  const [view, setView] = useState({ page: 'hall' });
  const [n, setN] = useState(0);
  const hall = () => { setView({ page: 'hall' }); window.scrollTo(0, 0); };
  const start = (id, lv, tier) => { setView({ page: 'run', id, lv, tier, n: Date.now() }); window.scrollTo(0, 0); };
  if (!hallOpen(profile)) {
    return <div className="page"><section className="card"><h2>The Event Hall</h2><p className="muted">The Event Hall opens when the Open Roads are restored (Month 10).</p><button className="btn" onClick={onExit}>Back</button></section></div>;
  }
  if (view.page === 'run') {
    return <Run key={view.n} profile={profile} update={update} id={view.id} lv={view.lv} tier={view.tier} onExit={hall} onAgain={() => start(view.id, view.lv, view.tier)} />;
  }
  if (view.page === 'event') return <EventPage profile={profile} update={update} id={view.id} onStart={start} onBack={hall} />;
  if (view.page === 'scene') return <TierScene profile={profile} res={view.res} onBack={hall} />;
  if (view.page === 'cup') return <CupNight key={n} profile={profile} res={view.res} onBack={hall} />;
  const e = ensureEvents(profile);
  return (
    <div className="page events" data-testid="event-hall">
      <button className="btn ghost small" onClick={onExit}>Back to Veyra</button>
      <h1 className="page-title"><PxIcon name="crypt" size={36} />The Event Hall</h1>
      <p className="lead">Practice for the Say-Back events. Your own best results are kept here, and only those.</p>
      <section className="card">
        <p className="small">{COPY.hall.practiceOnly} {COPY.hall.ladderOnly}</p>
        <p className="muted small">{COPY.hall.eliminationEnd}</p>
        <label className="check"><input type="checkbox" checked={!!e.pace} onChange={(ev) => update((p) => { ensureEvents(p).pace = ev.target.checked; })} /> <span>Contest pace <small>({PACE_SECONDS} seconds an answer in Bridge Tally and Three Lamps Out)</small></span></label>
        <p className="muted small">{COPY.hall.paceText}</p>
      </section>
      <SeasonPanel profile={profile} update={update} onStart={start} onScene={(res) => { setView({ page: 'scene', res }); window.scrollTo(0, 0); }} onCup={(res) => { setN((v) => v + 1); setView({ page: 'cup', res }); window.scrollTo(0, 0); }} />
      <Board profile={profile} />
      <section className="card">
        <h3 className="panel-title"><PxIcon name="chest" size={28} />The events</h3>
        <ul className="trial-list">{EVENT_IDS.map((id) => {
          const b = topBest(profile, id);
          return (
            <li key={id} className="trial-row ready">
              <div className="trial-row-head">
                <PxIcon name="quill" size={28} />
                <div><b>{EVENTS[id].hall}</b><span className="small muted"> · {EVENTS[id].plain}</span>
                  <p className="small muted">{b ? `Best: ${b.score} of ${b.max} (${sizeLabel(id, b.lv)})` : 'Not tried yet.'}</p></div>
              </div>
              <button className="btn small primary" onClick={() => { setView({ page: 'event', id }); window.scrollTo(0, 0); }}>Open</button>
            </li>
          );
        })}</ul>
      </section>
      <details className="card about-more"><summary>Tips for any event</summary><ul className="small">{COPY.hall.advice.map((a) => <li key={a}>{a}</li>)}</ul><p className="small muted">{COPY.hall.ladderHonest}</p></details>
      <p className="muted small">{HALL_HONEST} {COPY.hall.honest}</p>
    </div>
  );
}

// A card for the Echo Hall page: opens the Event Hall.
export function EventHallCard({ profile, onOpen }) {
  if (!hallOpen(profile)) return null;
  const s = ensureEvents(profile).season;
  return (
    <section className="card" data-testid="event-hall-card">
      <h3 className="panel-title"><PxIcon name="chest" size={28} />The Event Hall</h3>
      <p className="small">Seven memory contests from the Say-Back Games, plus Year Round and Fact Round. Practice only: they earn nothing and change no score. Only your own best results are kept.</p>
      {seasonOpen(profile) && !s.tier && <p className="small">The Say-Back Games season is ready to begin.</p>}
      <button className="btn" onClick={onOpen}>Enter the Event Hall</button>
    </section>
  );
}
