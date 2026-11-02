// v0.11 District Trials and vaults. Study and recall screens are still and quiet (data-quiet; the one soft submit sound is played on Check).
// Pictures and story appear only on the intro and the result screens.
import React, { useEffect, useRef, useState } from 'react';
import { PxIcon } from './game/PxIcon.jsx';
import { DialogueBox } from './game/DialogueBox.jsx';
import { Portrait, PixelFace } from '../pixel/Faces.jsx';
import { ArtImg } from './artLookup.jsx';
import { ItemIcon } from './ItemIcon.jsx';
import { sfx } from '../audio/sfx.js';
import { today } from '../engine/core.js';
import { material, trialState, startTrial, submitCheck, currentCheck, statusLine, dueTrials, hintFor, trialOpen } from '../engine/trials.js';
import { TRIALS, TRIAL_ORDER, VAULT_ORDER, TRIAL_HONEST } from '../data/trials.js';
import { COACHES } from '../data/echo.js';
import { ITEM_BY_ID } from '../data/items.js';

const coachOf = (p, t) => { const c = COACHES[t.coach]; return c && (!c.gate || p.progress.gates.includes(c.gate)) ? t.coach : 'wren'; };

function Study({ mat, seconds, onDone, vault }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => { const t = setInterval(() => setLeft((v) => v - 1), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { if (left <= 0) onDone(); }, [left]);
  return (
    <section className="card drill trial-study" data-quiet>
      <span className="tag">Study · {Math.max(0, left)}s</span>
      {mat.title && <h2>{mat.title}</h2>}
      {vault && <p className="small muted">You will see this tablet only once. Give every line its own picture.</p>}
      <ul className="study-rows">{mat.study.map((r, i) => (
        <li key={i}>{r.face != null ? <PixelFace seed={r.face} size={48} scale={2} /> : <b className="muted">{r.label}</b>}<span>{r.text}{r.key ? <> <b>({r.key})</b></> : null}</span></li>
      ))}</ul>
      <button className="btn primary" onClick={onDone}>Done studying</button>
    </section>
  );
}

function Distract({ q, onDone }) {
  const [v, setV] = useState('');
  return (
    <form className="card drill" data-quiet onSubmit={(e) => { e.preventDefault(); onDone(); }}>
      <span className="tag">A small interruption</span>
      <h2>{q.q}</h2>
      <p className="muted small">There is no penalty. This only takes your mind off the material for a moment.</p>
      <label className="field">Your answer<input autoFocus autoComplete="off" inputMode="numeric" value={v} onChange={(e) => setV(e.target.value)} /></label>
      <button className="btn primary">Go on</button>
    </form>
  );
}

function Check({ t, mat, check, onSubmit }) {
  const [vals, setVals] = useState({});
  const [hints, setHints] = useState({});
  const vault = t.kind === 'vault';
  const set = (k, v) => setVals((x) => ({ ...x, [k]: v }));
  const filled = mat.items.some((it) => String(vals[it.key] || '').trim());
  return (
    <form className="card drill trial-check" data-quiet onSubmit={(e) => { e.preventDefault(); if (!filled) return; sfx.soft(); onSubmit(vals, hints); }}>
      <span className="tag">{check.practice ? (check.quiet ? 'Quiet check-in' : 'First look') : 'The trial'}</span>
      <h2>{vault ? 'Say the tablet back, line by line' : t.material === 'gears' ? 'Put the parts back, from the last stall to the first' : t.material === 'code' ? 'Set the dials' : 'Answer from memory'}</h2>
      {check.practice && <p className="small muted">{check.quiet ? 'Nothing opens today and nothing is lost. This only shows you what is still there.' : 'This first look only shows you how it went. The real test comes later.'}</p>}
      {vault && !check.practice && <p className="small muted">Small typos are forgiven. Numbers and names must be exact. A hint costs only the Lumen for that line.</p>}
      <ol className="trial-items">{mat.items.map((it, i) => (
        <li key={it.key}>
          {it.face != null && <PixelFace seed={it.face} size={48} scale={3} />}
          <label className="field">{it.prompt}
            <input autoFocus={i === 0} autoComplete="off" autoCapitalize="off" spellCheck="false" inputMode={it.code ? 'numeric' : undefined}
              value={vals[it.key] || ''} onChange={(e) => set(it.key, e.target.value)} />
          </label>
          {vault && !check.practice && (hints[it.key] || 0) < 2 && (
            <button type="button" className="btn small" onClick={() => setHints((h) => ({ ...h, [it.key]: (h[it.key] || 0) + 1 }))}>{hints[it.key] ? 'Show the first word' : 'Hint: first letter'}</button>
          )}
          {hints[it.key] > 0 && <p className="note small">{hintFor(it, hints[it.key])}</p>}
        </li>
      ))}</ol>
      <button className="btn primary" disabled={!filled}>Check</button>
    </form>
  );
}

export default function TrialRun({ profile, update, id, onExit }) {
  const t = TRIALS[id];
  const day = today(profile);
  const entry = useRef(null);
  if (!entry.current) {
    const st = trialState(profile, id, day);
    const seed = st === 'due' ? profile.trials[id].seed : Math.floor(Math.random() * 1e9);
    entry.current = { st, seed, mat: material(id, seed, profile), check: st === 'due' ? currentCheck(profile, id) : t.checks[0] };
  }
  const { st, seed, mat, check } = entry.current;
  const coachId = coachOf(profile, t);
  const coach = COACHES[coachId];
  const [phase, setPhase] = useState('intro');
  const [res, setRes] = useState(null);
  const [better, setBetter] = useState({});
  const timer = profile.user.prefs.timerMult || 1;

  if (st === 'locked' || st === 'done' || st === 'rest' || st === 'waiting') {
    return <div className="page trial"><section className="card"><h2>{t.title}</h2><p className="muted">{statusLine(profile, id, day)}</p><button className="btn" onClick={onExit}>Back</button></section></div>;
  }

  const afterStudy = () => {
    if (t.checks[0].after > 0) { update((p) => { startTrial(p, id, seed, day); }); setPhase('stored'); return; }
    setPhase(mat.distraction ? 'distract' : 'check');
  };
  const submit = (vals, hints) => {
    let out = null;
    update((p) => { if (st !== 'due') startTrial(p, id, seed, day); out = submitCheck(p, id, vals, hints, day); });
    setRes(out);
    setPhase('result');
  };

  if (phase === 'intro') {
    return (
      <div className="page trial">
        <h1 className="page-title"><PxIcon name={t.kind === 'vault' ? 'lock' : 'crypt'} size={36} />{t.title}</h1>
        <ArtImg id={t.art} className="trial-art" />
        <section className="card parchment"><span className="tag">{t.district}</span><p className="story-text">{t.setup}</p></section>
        <DialogueBox speaker={coach.name} portrait={<Portrait id={coachId} mood="neutral" scale={2} />} lines={[st === 'due' ? (profile.trials[id].recovering ? 'The same material as before. You looked again at what slipped; let us see what holds now.' : 'The day has come round. No looking first; just say what you can.') : t.intro]} />
        <section className="card">
          {t.method && st !== 'due' && <p className="small"><b>Method:</b> {t.method}</p>}
          <p className="muted small">{TRIAL_HONEST} A trial is optional and the story never waits for it.</p>
          <div className="row wrap">
            <button className="btn primary" autoFocus onClick={() => setPhase(st === 'due' ? 'check' : 'study')}>{st === 'due' ? 'Begin the check' : 'Begin studying'}</button>
            <button className="btn ghost" onClick={onExit}>Not now</button>
          </div>
        </section>
      </div>
    );
  }
  if (phase === 'study') return <div className="page trial"><Study mat={mat} seconds={Math.round(t.study * timer)} onDone={afterStudy} vault={t.kind === 'vault'} /></div>;
  if (phase === 'distract') return <div className="page trial"><Distract q={mat.distraction} onDone={() => setPhase('check')} /></div>;
  if (phase === 'check') return <div className="page trial"><Check t={t} mat={mat} check={check} onSubmit={submit} /></div>;
  if (phase === 'stored') {
    return (
      <div className="page trial">
        <section className="card gold" role="status">
          <span className="tag">Read once</span>
          <h2>The tablet is yours to keep now</h2>
          <p className="small">Come back tomorrow for a quiet check-in. The door opens on a recall {t.checks[1].after} days from today. Walking your pictures once in a while in between is allowed, and it helps.</p>
          <button className="btn primary big" autoFocus onClick={onExit}>Done</button>
        </section>
      </div>
    );
  }

  // result
  const r = res || { n: 0, total: mat.items.length, missed: [] };
  const passed = r.passed;
  const prize = passed ? ITEM_BY_ID[t.prize] : null;
  const missedKeys = new Set(r.missed.map((x) => x.key));
  return (
    <div className="page trial">
      {(passed || r.final) && <ArtImg id={t.art} className="trial-art" />}
      <section className={`card ${passed ? 'gold' : ''}`} role="status">
        <span className="tag">{r.practice ? 'Noted' : passed ? 'Passed' : 'Not this time'}</span>
        <h2>{r.total === 1 ? (r.n ? 'The code is right' : 'Not the right code') : `${r.n} of ${r.total}${r.need && !passed ? ` (needed ${r.need})` : ''}`}</h2>
        {r.practice
          ? <p className="small">{r.quiet ? 'A quiet check-in, nothing more.' : 'A first look.'} The next check is on {profile.trials?.[id]?.due}. Nothing here changes your skill estimates.</p>
          : <p className="small story-text">{passed ? t.pass : t.miss}</p>}
        {r.lumen > 0 && <p className="small">Lumen for lines held without a hint: {r.lumen}.</p>}
        {r.recover && <p className="small">The same material comes back on {profile.trials?.[id]?.due}.</p>}
        {r.retryOn && <p className="small muted">Fresh material from {r.retryOn}.</p>}
      </section>
      {prize && (
        <section className="card parchment">
          <div className="row"><ItemIcon id={prize.id} scale={2} /><div><span className="tag">Trial prize</span><h3>{prize.name}</h3></div></div>
          <p className="small story-text">{prize.lore}</p>
          <p className="muted small">A new entry was added to the Lore pages of Veyra.</p>
        </section>
      )}
      {t.kind === 'vault' && r.missed.length > 0 && (
        <section className="card" data-quiet>
          <h3 className="panel-title"><PxIcon name="scroll" size={24} />The tablet, again</h3>
          <ol className="tablet-lines">{mat.items.map((it) => (
            <li key={it.key} className={missedKeys.has(it.key) ? 'slipped' : ''}>
              <span>{it.answer}</span>{missedKeys.has(it.key) && <b className="small"> (slipped)</b>}
              {missedKeys.has(it.key) && <label className="field small">A stronger picture for this line (just for you, not saved)<input autoComplete="off" value={better[it.key] || ''} onChange={(e) => setBetter((b) => ({ ...b, [it.key]: e.target.value }))} /></label>}
            </li>
          ))}</ol>
        </section>
      )}
      {t.kind !== 'vault' && r.missed.length > 0 && (
        <section className="card" data-quiet>
          <h3 className="panel-title"><PxIcon name="scroll" size={24} />{r.recover ? 'Look at these again now' : 'The answers'}</h3>
          <ul className="small">{r.missed.map((x) => <li key={x.key}>{x.face != null ? <PixelFace seed={x.face} size={48} scale={1} /> : x.word ? `"${x.word}"` : x.prompt} <b>{x.answer}</b></li>)}</ul>
          {r.recover && <p className="muted small">Make a fresh keyword picture for each. Forgetting a few words in a week is normal.</p>}
        </section>
      )}
      <DialogueBox speaker={coach.name} portrait={<Portrait id={coachId} mood={passed ? 'smile' : 'neutral'} scale={2} />} lines={[passed ? coach.win : r.practice ? 'Good. Now let it rest, and let sleep do its part.' : coach.rest]} />
      <p className="muted small">{TRIAL_HONEST}</p>
      <button className="btn primary big" autoFocus onClick={onExit}>Done</button>
    </div>
  );
}

// ---------- entry points ----------
const STATE_WORD = { ready: 'Open', due: 'Check due', waiting: 'Waiting', rest: 'Resting', done: 'Passed', locked: 'Locked' };
function Row({ profile, id, onTrial }) {
  const t = TRIALS[id];
  const st = trialState(profile, id);
  const can = st === 'ready' || st === 'due';
  return (
    <li className={`trial-row ${st}`}>
      <div className="trial-row-head">
        {st === 'done' ? <ItemIcon id={t.prize} scale={1} /> : <PxIcon name={st === 'locked' ? 'lock' : t.kind === 'vault' ? 'chest' : 'crypt'} size={28} />}
        <div><b>{st === 'locked' ? `A trial in the ${t.district}` : t.title}</b><span className="small muted"> · {STATE_WORD[st]}</span><p className="small muted">{statusLine(profile, id)}</p></div>
      </div>
      {can && <button className="btn small primary" onClick={() => onTrial(id)}>{st === 'due' ? 'Take the check' : 'Begin'}</button>}
    </li>
  );
}
export function TrialHall({ profile, onTrial }) {
  return (
    <>
      <section className="card" data-testid="trial-hall">
        <h3 className="panel-title"><PxIcon name="crypt" size={28} />District Trials</h3>
        <p className="small">Optional trials in the restored districts. Each one asks you to use a method you already know on fresh material. Only what you can still recall wins the prize.</p>
        <ul className="trial-list">{TRIAL_ORDER.map((id) => <Row key={id} profile={profile} id={id} onTrial={onTrial} />)}</ul>
      </section>
      <section className="card">
        <h3 className="panel-title"><PxIcon name="chest" size={28} />Sealed vaults</h3>
        <p className="small">Read a short tablet once. A vault opens when you can say it back days later. If it slips, look at the tablet again and try another day. Forgetting is normal.</p>
        <ul className="trial-list">{VAULT_ORDER.map((id) => <Row key={id} profile={profile} id={id} onTrial={onTrial} />)}</ul>
      </section>
      <p className="muted small">{TRIAL_HONEST}</p>
    </>
  );
}
// On Today, after the day's session: a check that is due. Optional; it waits without any cost.
export function TrialDueCard({ profile, onTrial }) {
  const due = dueTrials(profile);
  if (!due.length) return null;
  return (
    <section className="card glass" data-testid="trial-due">
      <h3 className="panel-title"><PxIcon name="crypt" size={28} />{due.length === 1 ? 'A trial check is ready' : `${due.length} trial checks are ready`}</h3>
      <ul className="small">{due.map((id) => <li key={id}><b>{TRIALS[id].title}</b>: {statusLine(profile, id)}</li>)}</ul>
      <p className="muted small">Optional. It waits for you, and it never changes your skill estimates.</p>
      <button className="btn primary" onClick={() => onTrial(due[0])}>Take the check</button>
    </section>
  );
}
export const anyTrialOpen = (p) => [...TRIAL_ORDER, ...VAULT_ORDER].some((id) => trialOpen(p, id));
