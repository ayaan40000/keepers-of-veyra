import React from 'react';
import { PxIcon } from './game/PxIcon.jsx';
import { MODULES } from '../data/curriculum.js';
import { GUIDE_CLAIM, GUIDE_SAFETY, RECIPE, REAL_TRIES, PLAYBOOKS, CALDER_LETTER } from '../data/fieldguide.js';
import { MASTERS, NOT_TO_COPY } from '../data/masters.js';
import { gateDone } from '../engine/guide.js';
import { today } from '../engine/core.js';

const districtOf = (id) => MODULES.find((m) => m.id === id)?.district || id;
const Locked = ({ mod }) => <span className="small muted">Opens when you pass the gate of {districtOf(mod)}.</span>;

// Real-life card shown on Today after the day's session. Self-reported: no rewards, easy to put off.
export function RealLifeCard({ profile, update, task }) {
  const date = today(profile);
  return (
    <section className="card glass" data-testid="real-life-card">
      <h3 className="panel-title"><PxIcon name="sun" size={28} />Try it for real</h3>
      <p><b>{task.title}</b> <span className="muted small">(about {task.minutes} minutes)</span></p>
      <p className="small">{task.text}</p>
      <p className="muted small">Optional, and it earns nothing: this one is just for you. All the pages are in the Field Guide.</p>
      <div className="row wrap">
        <button className="btn" onClick={() => update((p) => { p.guide.tried[task.id] = date; })}>I tried it</button>
        <button className="btn ghost small" onClick={() => update((p) => { p.guide.later[task.id] = date; })}>Not now</button>
      </div>
    </section>
  );
}

export default function FieldGuide({ profile, update, start }) {
  const date = today(profile);
  const done = gateDone(profile, 'M12');
  return (
    <div className="page">
      <h1 className="page-title"><PxIcon name="scroll" size={36} />Field Guide</h1>

      <section className="card parchment">
        <h3 className="panel-title"><PxIcon name="quill" size={28} />What this is</h3>
        <p className="small">The Keeper&apos;s Field Guide shows how to use the year&apos;s methods on your own life. A new page opens after each gate.</p>
        <p className="small">{GUIDE_CLAIM}</p>
      </section>

      <section className="card">
        <h3 className="panel-title"><PxIcon name="flask" size={28} />What not to put in your head</h3>
        <ul className="small">{GUIDE_SAFETY.map((s) => <li key={s}>{s}</li>)}</ul>
      </section>

      <section className="card">
        <h3 className="panel-title"><PxIcon name="map" size={28} />The five steps</h3>
        <p className="muted small">Every page below is this recipe on different material.</p>
        <ol className="small">{RECIPE.map((r) => <li key={r.n}><b>{r.title}.</b> {r.text}</li>)}</ol>
      </section>

      <section className="card">
        <h3 className="panel-title"><PxIcon name="sun" size={28} />Try it for real</h3>
        <p className="muted small">One small task after each gate, from 6 to 10 minutes. It earns no Lumen and counts toward nothing: it is for you. Tick it when you have tried it.</p>
        {REAL_TRIES.map((t) => {
          const open = gateDone(profile, t.unlock);
          const tried = profile.guide?.tried?.[t.id];
          return (
            <div key={t.id} className="note">
              <p><b>{t.title}</b> <span className="muted small">{open ? `about ${t.minutes} minutes` : ''}</span></p>
              {open ? (
                <>
                  <p className="small">{t.text}</p>
                  {tried ? <p className="small muted">You tried this on {tried}. Check yourself again in a few days: did it stick?</p> : <button className="btn small" onClick={() => update((p) => { p.guide.tried[t.id] = date; })}>I tried it</button>}
                </>
              ) : <Locked mod={t.unlock} />}
            </div>
          );
        })}
      </section>

      <section className="card">
        <h3 className="panel-title"><PxIcon name="scroll" size={28} />Playbooks</h3>
        {PLAYBOOKS.map((b) => (
          <details key={b.id} className="about-more" data-testid={`playbook-${b.id}`}>
            <summary>{b.title}{gateDone(profile, b.unlock) ? '' : ' (locked)'}</summary>
            {gateDone(profile, b.unlock) ? (
              <div>
                <p className="muted small">Draws on {b.months}.</p>
                <p className="small">{b.intro}</p>
                <p className="small"><b>An example.</b> {b.example}</p>
                <p className="small"><b>Your first 15 minutes.</b></p>
                <ol className="small">{b.steps.map((s) => <li key={s}>{s}</li>)}</ol>
                <p className="small"><b>Check yourself.</b> {b.review}</p>
                <p className="small note"><b>Honest limits.</b> {b.caveat}</p>
              </div>
            ) : <Locked mod={b.unlock} />}
          </details>
        ))}
      </section>

      <section className="card">
        <h3 className="panel-title"><PxIcon name="chest" size={28} />Masters&apos; Notes</h3>
        <p className="small">How memory athletes are said to train, as practices that fit a normal week. {NOT_TO_COPY}</p>
        {MASTERS.map((m) => {
          const open = gateDone(profile, m.unlock);
          return (
            <details key={m.id} className="about-more" data-testid={`master-${m.id}`}>
              <summary>{m.title}{open ? '' : ' (locked)'}</summary>
              {open ? (
                <div>
                  <p className="small">{m.idea}</p>
                  <p className="small"><b>Try it.</b> {m.tryIt}</p>
                  <p className="small muted">{m.why}</p>
                  {m.spec ? <button className="btn small" onClick={() => start('free', { spec: m.spec })}>Practise: {m.drill}</button> : <p className="small muted">Mnemos already runs this for you with its delayed checks.</p>}
                </div>
              ) : <Locked mod={m.unlock} />}
            </details>
          );
        })}
        <p className="muted small">Practice here counts toward your skill estimates, and Lumen is capped at 50 a day, like all free practice.</p>
      </section>

      <section className="card parchment">
        <h3 className="panel-title"><PxIcon name="quill" size={28} />A letter from Calder</h3>
        {done ? (
          <>{CALDER_LETTER.map((l) => <p key={l} className="small">{l}</p>)}<p className="small">Calder</p></>
        ) : <p className="small muted">Opens when you pass the last gate, at the end of the year.</p>}
      </section>
    </div>
  );
}
