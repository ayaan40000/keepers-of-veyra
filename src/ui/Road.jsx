// 1.6 The Wardens' Road: an optional Champion Track. Study and recall screens stay still and quiet; the only sound is the
// Spoken Numbers event, which reads digits with the device's own voice, is off by default and is labelled as audio.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PxIcon } from './game/PxIcon.jsx';
import { DialogueBox } from './game/DialogueBox.jsx';
import { Portrait } from '../pixel/Faces.jsx';
import { today } from '../engine/core.js';
import {
  ROAD_HONEST, DISCIPLINES, DISC, TIMES, tabletOpen, makeMaterial, scoreRows, scoreColumns, scoreDates, scoreImages, scoreSpoken,
  recordEvent, ottolineMark, journeyStats, STOP_TARGETS, systemCount, pad2, pad3, DECK, cardLabel, convPrompts, SLOW_MS, addSlip,
  weakest, systemImage, SUNDAY_EVENTS, recordSunday, ensureRoad, WEEKDAYS,
} from '../engine/road.js';
import { majorDecode, shuffle, rng } from '../engine/util.js';

const back = (fn) => <button className="btn ghost" onClick={fn}>Back to the road</button>;
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;

function useTimer(secs, onEnd, running = true) {
  const [left, setLeft] = useState(secs);
  const end = useRef(onEnd); end.current = onEnd;
  useEffect(() => {
    if (!running) return undefined;
    const t0 = Date.now();
    const id = setInterval(() => { const l = secs - Math.floor((Date.now() - t0) / 1000); setLeft(l); if (l <= 0) { clearInterval(id); end.current(); } }, 250);
    return () => clearInterval(id);
  }, [secs, running]);
  return left;
}

export function RoadEntry({ profile, onOpen }) {
  if (!tabletOpen(profile, 'journeys')) return null;
  return (
    <section className="card" data-testid="road-entry">
      <h3 className="panel-title"><PxIcon name="crypt" size={28} />The Wardens' Road</h3>
      <p className="small">An optional Champion Track: every memory-sport discipline, your own number and card systems, a journey manager and strict scoring. It never changes your skill estimates.</p>
      <button className="btn" onClick={onOpen}>Walk the Wardens' Road</button>
    </section>
  );
}

export default function Road({ profile, update, onExit }) {
  const [view, setView] = useState({ name: 'home' });
  const go = (name, extra = {}) => { setView({ name, ...extra }); window.scrollTo(0, 0); };
  const road = profile.road || {};
  if (view.name === 'event') return <EventRun profile={profile} update={update} id={view.id} sunday={view.sunday} onDone={(score) => (view.sunday ? view.sunday(score) : go('home'))} />;
  if (view.name === 'journeys') return <Journeys profile={profile} onBack={() => go('home')} />;
  if (view.name === 'system') return <SystemBuilder profile={profile} update={update} onBack={() => go('home')} />;
  if (view.name === 'cards') return <CardBuilder profile={profile} update={update} onBack={() => go('home')} />;
  if (view.name === 'drill') return <ConvDrill profile={profile} update={update} kind={view.kind} onBack={() => go('home')} />;
  if (view.name === 'slips') return <Slips profile={profile} onDrill={() => go('drill', { kind: 'weak' })} onBack={() => go('home')} />;
  if (view.name === 'sunday') return <Sunday profile={profile} update={update} onBack={() => go('home')} />;

  const open = (d) => {
    if (d.kind === 'event') go('event', { id: d.id });
    else go(d.id === 'system' ? 'system' : d.id);
  };
  return (
    <div className="page road">
      <h1 className="page-title"><PxIcon name="crypt" size={36} />The Wardens' Road</h1>
      <DialogueBox speaker="Isolde" portrait={<Portrait id="isolde" scale={2} />} lines={[
        'Veyra had thirteen Lamp-Wardens, and they did not stop at twelve routes. Each kept a discipline and wrote it on a tablet. The Tide scattered the tablets through the Undercroft.',
        road.title ? 'You have walked the whole road. Warden of the Road: it is only a title, and you earned it. Ottoline Gilt sends a stiff note of congratulation. She is already training again.' : 'Ottoline Gilt is on this road too. Her marks will follow yours, always a step ahead of your own best. Do not chase her. Chase yourself.',
      ]} />
      <section className="card"><p className="small muted">{ROAD_HONEST}</p></section>
      <section className="card" data-testid="road-days">
        <h3>Road days</h3>
        <p className="small">On the days you tick, a full session skips its real-life scene and extra rounds and points you here for one event instead. The day stays about 30 minutes.</p>
        <div className="row wrap">{WEEKDAYS.map((w, i) => (
          <label key={w} className="check"><input type="checkbox" checked={(road.days || []).includes(i)} onChange={(e) => update((p) => { const r = ensureRoad(p); r.days = e.target.checked ? [...new Set([...(r.days || []), i])].sort() : (r.days || []).filter((x) => x !== i); })} /> <span>{w.slice(0, 3)}</span></label>
        ))}</div>
      </section>
      <section className="card">
        <h3>The tablets</h3>
        <div className="grounds">{DISCIPLINES.map((d) => {
          const ok = tabletOpen(profile, d.id);
          const best = Object.entries(road.pb || {}).filter(([k]) => k.startsWith(d.id + ':')).map(([k, v]) => `${v.score} in ${+k.split(':')[1] / 60} min`);
          return (
            <button key={d.id} className="ground" disabled={!ok} onClick={() => open(d)}>
              <PxIcon name={ok ? 'scroll' : 'lock'} size={28} /><b>{d.title}</b>
              <span className="small">{ok ? d.what : `Found in week ${d.week}`}{best.length ? ` · best ${best.join(', ')}` : ''}</span>
            </button>
          );
        })}</div>
      </section>
      <section className="card">
        <h3>Practice tools</h3>
        <div className="row wrap">
          <button className="btn" disabled={!tabletOpen(profile, 'system')} onClick={() => go('drill', { kind: 'conv' })}>Number flash</button>
          <button className="btn" disabled={!tabletOpen(profile, 'cards') || !Object.keys(road.cards || {}).length} onClick={() => go('drill', { kind: 'cards' })}>Card flash</button>
          <button className="btn" onClick={() => go('slips')}>Ennick's Book of Slips</button>
        </div>
        <label className="check"><input type="checkbox" checked={!!road.audio} onChange={(e) => update((p) => { ensureRoad(p).audio = e.target.checked; })} /> Allow the audio event (Spoken Numbers reads digits aloud with this device's own voice)</label>
      </section>
      <button className="btn ghost" onClick={onExit}>Leave the road</button>
    </div>
  );
}

// ---------- the event runner: choose a time, study, recall, strict score ----------
function EventRun({ profile, update, id, sunday, onDone: done }) {
  const onDone = (s) => (sunday ? sunday(s) : done(s));
  const [secs, setSecs] = useState(sunday ? 300 : null);
  const [seed] = useState(() => Date.now() % 1e9);
  const [phase, setPhase] = useState(sunday ? 'study' : 'setup');
  const mat = useMemo(() => (secs ? makeMaterial(id, secs, seed) : null), [secs]);
  const [res, setRes] = useState(null);
  const d = DISC[id];
  const pbKey = `${id}:${secs}`;
  const prev = profile.road?.pb?.[pbKey]?.score;

  if (id === 'spoken' && !profile.road?.audio) return (
    <div className="page road"><section className="card"><h2>{d.title}</h2><p className="small">Spoken Numbers reads digits aloud, one a second. Audio is off. Turn on "Allow the audio event" on the road's first page to try it.</p>{back(() => onDone(null))}</section></div>
  );
  if (phase === 'setup') return (
    <div className="page road">
      <section className="card">
        <span className="tag">{d.title}</span><h2>{d.what}</h2>
        <p className="small">{RULES[id]}</p>
        <p className="small">Choose the format. Recall time is twice the study time.</p>
        <div className="row wrap">{(id === 'spoken' ? [60, 180, 300] : TIMES).map((t) => {
          const pb = profile.road?.pb?.[`${id}:${t}`]?.score;
          return <button key={t} className="btn" onClick={() => { setSecs(t); setPhase('study'); }}>{t / 60} minute{t > 60 ? 's' : ''}{pb != null ? ` (best ${pb}, Ottoline's mark ${ottolineMark(pb)})` : ''}</button>;
        })}</div>
        {back(() => onDone(null))}
      </section>
    </div>
  );
  if (phase === 'study') return <Study id={id} secs={secs} mat={mat} onDone={() => setPhase('recall')} />;
  if (phase === 'recall') return <Recall id={id} seed={seed} secs={secs * 2} mat={mat} onDone={(answers) => {
    const s = scoreOf(id, mat, answers);
    let out = null;
    update((p) => { out = recordEvent(p, id, secs, s.score, { date: today(p), misses: s.misses || [], truth: mat.digits || '' }); });
    setTimeout(() => setRes({ ...s, ...(out || {}) }), 0);
    setPhase('result');
  }} />;
  return (
    <div className="page road">
      <section className="card gold" role="status">
        <span className="tag">{d.title} · {secs / 60} min</span>
        <h2>{res ? `${res.score} points` : 'Scoring.'}</h2>
        {res && <p className="small">{res.pb ? (res.prev != null ? `A new personal best (was ${res.prev}).` : 'Your first mark on this tablet.') : `Your best here is ${res.prev}.`}{res.beatOttoline ? ' You passed Ottoline\'s mark. She will not mention it.' : res.mark != null ? ` Ottoline's mark was ${res.mark}.` : ''}</p>}
        <p className="small muted">Scored with simplified competition rules. {RULES[id]}</p>
        <button className="btn primary" autoFocus onClick={() => onDone(res?.score ?? 0)}>{sunday ? 'Next event' : 'Back to the road'}</button>
      </section>
    </div>
  );
}

const RULES = {
  numbers: 'Rows of 40 digits. A row with no slip scores its digits; one slip scores half; two or more score nothing. In the last row only the digits you wrote count.',
  binary: 'Rows of 30 lamps, 0 dark and 1 lit. A clean row scores 30; one slip, 15; more, nothing. Tip: three lamps make one digit from 0 to 7.',
  words: 'Columns of 20 words, spelled exactly. A clean column scores 20; one slip, half; more, nothing. A blank at the end of your last column is not a slip.',
  fdates: 'Each correct year scores 1, each wrong year loses half a point, a blank scores nothing. The events are invented, from Veyra.',
  images: 'Rows of 5 shapes. In recall each row is shuffled: give the original order. A right row scores 5; a wrong row loses 1; a blank row scores nothing.',
  spoken: 'One digit a second, read once. You score every digit up to your first slip.',
};

function scoreOf(id, mat, a) {
  if (id === 'numbers' || id === 'binary') return scoreRows(mat.digits, a, mat.row);
  if (id === 'words') return scoreColumns(mat.words, a, mat.col);
  if (id === 'fdates') return scoreDates(mat.dates, a);
  if (id === 'images') return scoreImages(mat.orders, a);
  if (id === 'spoken') { const s = scoreSpoken(mat.digits, a[0]); return { ...s, misses: s.score < mat.digits.length ? [s.score] : [] }; }
  return { score: 0 };
}

function Blob({ g, label }) {
  const rows = g.split('/');
  return (
    <svg className="road-blob" viewBox="0 0 8 8" shapeRendering="crispEdges" role="img" aria-label={label}>
      {rows.flatMap((r, y) => [...r].map((c, x) => (c === '1' ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" /> : null)))}
    </svg>
  );
}

function Study({ id, secs, mat, onDone }) {
  const left = useTimer(secs, onDone, id !== 'spoken');
  if (id === 'spoken') return <Spoken digits={mat.digits} onDone={onDone} />;
  const chunk = (s, n) => s.match(new RegExp(`.{1,${n}}`, 'g')) || [];
  return (
    <div className="page road study">
      <section className="card">
        <div className="row between"><span className="tag">Study · {mmss(left)} left</span><button className="btn small" onClick={onDone}>I am ready</button></div>
        {(id === 'numbers' || id === 'binary') && <div className="road-digits">{chunk(mat.digits, mat.row).map((r, i) => <p key={i}><small className="muted">Row {i + 1}</small> {chunk(r, id === 'binary' ? 3 : 2).join(' ')}</p>)}</div>}
        {id === 'words' && <div className="road-cols">{Array.from({ length: Math.ceil(mat.words.length / 20) }, (_, c) => <ol key={c} start={c * 20 + 1}>{mat.words.slice(c * 20, c * 20 + 20).map((w, i) => <li key={i}>{w}</li>)}</ol>)}</div>}
        {id === 'fdates' && <ol className="road-dates">{mat.dates.map((d, i) => <li key={i}><b>{d.year}</b> {d.text}</li>)}</ol>}
        {id === 'images' && mat.rows.map((row, i) => <div key={i} className="road-imgrow"><small className="muted">Row {i + 1}</small>{row.map((g, k) => <Blob key={k} g={g} label={`Row ${i + 1}, shape ${k + 1}`} />)}</div>)}
      </section>
    </div>
  );
}

function Spoken({ digits, onDone }) {
  const [i, setI] = useState(0);
  const [err, setErr] = useState('');
  useEffect(() => {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    let id = null, k = 0, voice = null, tries = 0;
    const start = () => {
      voice = synth?.getVoices().find((v) => v.localService);
      if (!voice && synth && tries++ < 8) { setTimeout(start, 250); return; }
      if (!synth || !voice) { setErr('This device has no built-in voice that works offline, so Spoken Numbers cannot run here. Mnemos never uses an online voice.'); return; }
      id = setInterval(tick, 1000);
    };
    const tick = () => {
      if (k >= digits.length) { clearInterval(id); setTimeout(onDone, 800); return; }
      const u = new SpeechSynthesisUtterance(digits[k]); u.voice = voice; u.rate = 1.1; synth.speak(u);
      k++; setI(k);
    };
    start();
    return () => { clearInterval(id); tries = 99; synth?.cancel(); };
  }, []);
  return (
    <div className="page road study">
      <section className="card">
        <span className="tag">Audio event · listening</span>
        {err ? <><p className="small" role="alert">{err}</p><button className="btn" onClick={onDone}>Go on</button></> : <p className="small">Digit {i} of {digits.length}. Listen; nothing is shown.</p>}
      </section>
    </div>
  );
}

function Recall({ id, seed, secs, mat, onDone }) {
  const init = () => {
    if (id === 'numbers' || id === 'binary') return Array(Math.ceil(mat.digits.length / mat.row)).fill('');
    if (id === 'words') return Array(Math.ceil(mat.words.length / mat.col)).fill('');
    if (id === 'fdates') return Array(mat.dates.length).fill('');
    if (id === 'images') return mat.rows.map(() => Array(5).fill(''));
    return [''];
  };
  const [a, setA] = useState(init);
  // Dates are asked in a new order; image rows are shown shuffled (the right answer is each shape's original place).
  const order = useMemo(() => (id === 'fdates' ? shuffle(mat.dates.map((_, i) => i), rng(seed + 7)) : null), []);
  const shuffled = useMemo(() => {
    if (id !== 'images') return null;
    const r = rng(seed + 11);
    mat.orders = [];
    return mat.rows.map((row) => { const p = shuffle([0, 1, 2, 3, 4], r); mat.orders.push(p.map((orig) => orig + 1)); return p.map((k) => row[k]); });
  }, []);
  const done = useRef(false);
  const submit = () => {
    if (done.current) return; done.current = true;
    if (id === 'fdates') { const out = Array(mat.dates.length).fill(''); order.forEach((orig, j) => { out[orig] = a[j]; }); onDone(out); }
    else onDone(a);
  };
  const left = useTimer(secs, submit);
  const set = (i, v) => setA((x) => x.map((y, k) => (k === i ? v : y)));
  return (
    <div className="page road recall">
      <section className="card">
        <div className="row between"><span className="tag">Recall · {mmss(left)} left</span><button className="btn primary small" data-sfx="submit" onClick={submit}>Hand in</button></div>
        {(id === 'numbers' || id === 'binary') && a.map((v, i) => <label key={i} className="field">Row {i + 1}<input inputMode="numeric" value={v} maxLength={mat.row} autoComplete="off" onChange={(e) => set(i, e.target.value.replace(/[^0-9]/g, '').slice(0, mat.row))} /></label>)}
        {id === 'spoken' && <label className="field">The digits you heard, in order<textarea rows={4} inputMode="numeric" value={a[0]} onChange={(e) => set(0, e.target.value.replace(/[^0-9]/g, ''))} /></label>}
        {id === 'words' && a.map((v, i) => <label key={i} className="field">Column {i + 1} (one word a line)<textarea rows={8} value={v} autoComplete="off" spellCheck={false} onChange={(e) => set(i, e.target.value)} /></label>)}
        {id === 'fdates' && order.map((orig, j) => <label key={j} className="field">{mat.dates[orig].text}<input inputMode="numeric" maxLength={4} value={a[j]} onChange={(e) => set(j, e.target.value.replace(/[^0-9]/g, ''))} /></label>)}
        {id === 'images' && shuffled.map((row, i) => (
          <div key={i} className="road-imgrow">
            <small className="muted">Row {i + 1}</small>
            {row.map((g, k) => (
              <label key={k} className="road-imgpick"><Blob g={g} label={`Row ${i + 1}, shuffled shape ${k + 1}`} />
                <input inputMode="numeric" maxLength={1} aria-label={`Original place of row ${i + 1} shape ${k + 1}`} value={a[i][k]} onChange={(e) => { const v = e.target.value.replace(/[^1-5]/g, ''); setA((x) => x.map((r, ri) => (ri === i ? r.map((c, ci) => (ci === k ? v : c)) : r))); }} />
              </label>
            ))}
          </div>
        ))}
      </section>
    </div>
  );
}

// ---------- C1 journeys ----------
function Journeys({ profile, onBack }) {
  const j = journeyStats(profile);
  return (
    <div className="page road">
      <h1 className="page-title"><PxIcon name="palace" size={36} />The Warden of Ways</h1>
      <section className="card">
        <p className="small">The Wardens laid the twelve districts out as routes so anyone could store their life along the way. Competitors keep many journeys, so one can rest while another is used.</p>
        <p><b>{j.total}</b> stops across <b>{j.journeys}</b> journeys. {j.next ? `Next mark: ${j.next} stops.` : 'Every mark reached.'}</p>
        <p className="small muted">Marks: {STOP_TARGETS.map((t) => (j.reached.includes(t) ? `${t} (reached)` : t)).join(', ')}. Add stops on the Palaces page.</p>
      </section>
      <section className="card">
        <h3>Your journeys</h3>
        {!j.list.length && <p className="small muted">No journeys yet. Build one on the Palaces page.</p>}
        <ul className="road-list">{j.list.map((x) => <li key={x.id}><b>{x.name}</b> · {x.stops} stops{x.lastUsed ? ` · last used ${x.lastUsed.slice(0, 10)}` : ' · never used'}{x.hot ? <span className="tag">hot: used in the last 24 hours, let it rest</span> : null}</li>)}</ul>
        {j.dupes.length > 0 && <p className="small">Stop check: these stops appear more than once, which invites mix-ups: {j.dupes.slice(0, 12).join(', ')}.</p>}
      </section>
      {back(onBack)}
    </div>
  );
}

// ---------- C3 number system ----------
function SystemBuilder({ profile, update, onBack }) {
  const s = profile.road?.system || { kind: null, pao: {}, d3: {} };
  const [page, setPage] = useState(0);
  const setKind = (k) => update((p) => { ensureRoad(p).system.kind = k; });
  const per = s.kind === 'd3' ? 25 : 10;
  const total = s.kind === 'd3' ? 1000 : 100;
  const keys = Array.from({ length: per }, (_, i) => page * per + i).filter((n) => n < total).map((n) => (s.kind === 'd3' ? pad3(n) : pad2(n)));
  const setPao = (k, f, v) => update((p) => { const sy = ensureRoad(p).system; sy.pao[k] = { ...(sy.pao[k] || { p: '', a: '', o: '' }), [f]: v.slice(0, 60) }; });
  const setD3 = (k, v) => update((p) => { const sy = ensureRoad(p).system; if (v) sy.d3[k] = v.slice(0, 60); else delete sy.d3[k]; });
  return (
    <div className="page road">
      <h1 className="page-title"><PxIcon name="scroll" size={36} />The Players</h1>
      <section className="card">
        <p className="small">Once a year the Clockwork Market performed the Tide schedule with a hundred Players, one for each number from 00 to 99. Three numbers in a row became one scene: this Player, doing that Player's deed, with the third Player's prop. Cast your own hundred (PAO), or build 1,000 single images (000 to 999, about 100 a week).</p>
        <div className="row wrap">
          <button className={`btn ${s.kind === 'pao' ? 'primary' : ''}`} onClick={() => setKind('pao')}>100 Players (PAO)</button>
          <button className={`btn ${s.kind === 'd3' ? 'primary' : ''}`} onClick={() => setKind('d3')}>1,000 images</button>
        </div>
        {s.kind && <p className="small">{systemCount(profile)} of {total} done. A suggestion from your Major list is shown; a Major word for the number passes the decoder check.</p>}
      </section>
      {s.kind && (
        <section className="card">
          <div className="row between wrap"><button className="btn small" disabled={!page} onClick={() => setPage(page - 1)}>Earlier</button><span className="small">{keys[0]} to {keys[keys.length - 1]}</span><button className="btn small" disabled={(page + 1) * per >= total} onClick={() => setPage(page + 1)}>Later</button></div>
          {keys.map((k) => {
            const sug = k.length === 2 ? systemImage({ ...profile, road: { system: {} } }, k) : null;
            if (s.kind === 'pao') {
              const v = s.pao[k] || {};
              return (
                <fieldset key={k} className="road-pao"><legend><b>{k}</b>{sug ? <small className="muted"> Major: {sug}</small> : null}</legend>
                  <input aria-label={`${k} person`} placeholder="Person" value={v.p || ''} onChange={(e) => setPao(k, 'p', e.target.value)} />
                  <input aria-label={`${k} action`} placeholder="Action" value={v.a || ''} onChange={(e) => setPao(k, 'a', e.target.value)} />
                  <input aria-label={`${k} object`} placeholder="Object" value={v.o || ''} onChange={(e) => setPao(k, 'o', e.target.value)} />
                </fieldset>
              );
            }
            const v = s.d3[k] || '';
            const ok = v && majorDecode(v) === k;
            return <label key={k} className="field small"><span><b>{k}</b>{v ? <small className="muted"> {ok ? 'passes the Major check' : 'not a Major word (fine if it is yours)'}</small> : null}</span><input value={v} onChange={(e) => setD3(k, e.target.value)} /></label>;
          })}
        </section>
      )}
      {back(onBack)}
    </div>
  );
}

// ---------- C4 cards ----------
function CardBuilder({ profile, update, onBack }) {
  const cards = profile.road?.cards || {};
  const set = (c, v) => update((p) => { const r = ensureRoad(p); if (v) r.cards[c] = v.slice(0, 60); else delete r.cards[c]; });
  return (
    <div className="page road">
      <h1 className="page-title"><PxIcon name="chest" size={36} />The Warden of Wagers</h1>
      <section className="card">
        <p className="small">The Salt Guild bets on everything, including you. Give each card one image of its own: a person or a thing with a clear action, so 52 cards never blur together. ({Object.keys(cards).length} of 52.) Then use the card flash until each image comes in under a second.</p>
      </section>
      <section className="card road-cards">{DECK.map((c) => <label key={c} className="field small">{cardLabel(c)}<input value={cards[c] || ''} onChange={(e) => set(c, e.target.value)} /></label>)}</section>
      {back(onBack)}
    </div>
  );
}

// ---------- flash and conversion drills ----------
function ConvDrill({ profile, update, kind, onBack }) {
  const prompts = useMemo(() => {
    const weak = weakest(profile, today(profile));
    const k = kind === 'conv' && profile.road?.system?.kind === 'd3' ? 'd3' : kind;
    return convPrompts(profile, k, 20, Date.now() % 1e9, weak);
  }, []);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const t0 = useRef(Date.now());
  const times = useRef([]);
  const q = prompts[i];
  const slow = kind === 'cards' ? SLOW_MS.cards : SLOW_MS.conv;
  if (!prompts.length) return <div className="page road"><section className="card"><p className="small">Nothing to drill yet. {kind === 'weak' ? 'Ennick\'s book is empty: no slips in the last 30 days.' : 'Fill in some images first.'}</p>{back(onBack)}</section></div>;
  if (!q) {
    const ms = times.current;
    const avg = ms.length ? Math.round(ms.reduce((a, b) => a + b, 0) / ms.length) : 0;
    return <div className="page road"><section className="card gold" role="status"><h2>Average {(avg / 1000).toFixed(2)} s an image</h2><p className="small">{ms.filter((x) => x > slow).length} of {ms.length} were slower than {slow / 1000} s and went into Ennick's Book of Slips. The aim is under {slow / 1000} s, but accuracy first.</p>{back(onBack)}</section></div>;
  }
  const isCard = DECK.includes(q);
  const image = isCard ? profile.road?.cards?.[q] : systemImage(profile, q);
  const see = () => { const ms = Date.now() - t0.current; times.current.push(ms); if (ms > slow) update((p) => addSlip(ensureRoad(p), (isCard ? 'c:' : 'n:') + q, 'slow', today(p))); setShown(true); };
  const next = (missed) => { if (missed) update((p) => addSlip(ensureRoad(p), (isCard ? 'c:' : 'n:') + q, 'miss', today(p))); setShown(false); setI(i + 1); t0.current = Date.now(); };
  return (
    <div className="page road study">
      <section className="card">
        <span className="tag">{i + 1} of {prompts.length}</span>
        <h2 className="ledger-cue">{isCard ? cardLabel(q) : q}</h2>
        {!shown ? <button className="btn primary" autoFocus onClick={see}>I see my image</button> : (
          <>
            <p className="ledger-answer">{image || 'No image saved yet'}</p>
            <div className="row wrap"><button className="btn primary" autoFocus onClick={() => next(false)}>That was it</button><button className="btn" onClick={() => next(true)}>I had a different one, or none</button></div>
          </>
        )}
      </section>
    </div>
  );
}

function Slips({ profile, onDrill, onBack }) {
  const w = weakest(profile, today(profile));
  return (
    <div className="page road">
      <h1 className="page-title"><PxIcon name="quill" size={36} />Ennick's Book of Slips</h1>
      <DialogueBox speaker="Brother Ennick" portrait={<Portrait id="ennick" scale={2} />} lines={['I write down every mistake I make, with the date. It is the most useful book in the Scriptorium: it tells me exactly what to practise next.']} />
      <section className="card">
        <h3>Your ten weakest images (last 30 days)</h3>
        {!w.length ? <p className="small muted">No slips yet. Number events and the flash drills write here.</p> : <ol>{w.map((x) => <li key={x.key}>{x.key.startsWith('c:') ? cardLabel(x.key.slice(2)) : x.key.slice(2)}: {x.misses} missed, {x.slow} slow</li>)}</ol>}
        <button className="btn primary" disabled={!w.length} onClick={onDrill}>Drill these</button>
      </section>
      {back(onBack)}
    </div>
  );
}

// ---------- C7 Long Sunday ----------
function Sunday({ profile, update, onBack }) {
  const [k, setK] = useState(-1);
  const [scores, setScores] = useState({});
  const [out, setOut] = useState(null);
  const ev = SUNDAY_EVENTS[k];
  if (k >= 0 && ev) return <EventRun key={ev} profile={profile} update={update} id={ev} sunday={(s) => { const n = { ...scores, [ev]: s ?? 0 }; setScores(n); if (k + 1 >= SUNDAY_EVENTS.length) { let r = null; update((p) => { r = recordSunday(p, n, today(p)); }); setTimeout(() => setOut(r), 0); } setK(k + 1); }} />;
  if (k >= SUNDAY_EVENTS.length) return (
    <div className="page road"><section className="card gold" role="status"><h2>Long Sunday: {out?.total ?? '...'} points</h2>
      <p className="small">{SUNDAY_EVENTS.map((e) => `${DISC[e].title}: ${scores[e] ?? 0}`).join(' · ')}</p>
      {out && <p className="small">Your best Long Sunday: {out.best}.{out.titled ? ' You have walked every tablet and kept four Long Sundays: Warden of the Road. It is a title in Veyra, not a claim about the world.' : ''}</p>}
      <p className="small muted">Real championships run hour-long events. Those are Tallow's Hours: explained here, and best scheduled by hand when you are ready.</p>
      {back(onBack)}</section></div>
  );
  return (
    <div className="page road">
      <h1 className="page-title"><PxIcon name="sun" size={36} />Long Sunday</h1>
      <section className="card">
        <p className="small">A mock championship: four events of five minutes each (numbers, words, binary, invented dates), with recall after each. About 45 minutes. Breathe, walk your route once, then begin.</p>
        <button className="btn primary" onClick={() => setK(0)}>Begin Long Sunday</button>
        {back(onBack)}
      </section>
    </div>
  );
}
