import React from 'react';
import { PxIcon } from './game/PxIcon.jsx';
import { thenAndNow, unitComparison, methodStats } from '../engine/methods.js';
import YM from '../data/add/yourmethods.json';

const pct = (x) => `${Math.round(x * 100)}%`;
const CAPTION = 'Both scores are on Mnemos tasks. Some of the change is simply learning the task. Neither is evidence that a method works.';

// Then and now: the first time you tried a task beside how you do now. Never a claim that the game works.
export function ThenNow({ profile }) {
  const rows = thenAndNow(profile);
  const units = unitComparison(profile);
  if (!rows.length && !units.length) return null;
  return (
    <section className="card" data-testid="then-now">
      <h3 className="panel-title"><PxIcon name="chart" size={24} />Then and now</h3>
      {units.length > 0 && (
        <table className="results then-now">
          <thead><tr><th>Unit Check</th><th>Before (Form A)</th><th>After (Form B)</th></tr></thead>
          <tbody>{units.map((u) => <tr key={u.unit}><td>{u.name.replace('Unit Check: ', '')}</td><td>{u.a ? pct(u.a.acc) : 'not yet'}</td><td>{u.b ? pct(u.b.acc) : 'not yet'}</td></tr>)}</tbody>
        </table>
      )}
      {rows.length > 0 && (
        <table className="results then-now">
          <thead><tr><th>Task</th><th>First try</th><th>Latest</th><th>Best</th><th className="hide-sm">Tries</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.key}><td>{r.name}</td><td>{pct(r.first)}</td><td>{pct(r.latest)}</td><td>{pct(r.best)}</td><td className="hide-sm">{r.tries}</td></tr>)}</tbody>
        </table>
      )}
      <p className="muted small">{CAPTION}</p>
    </section>
  );
}

// Your Methods: the honest replacement for learning styles. Your own numbers, no types, no ranking, no advice.
export function YourMethods({ profile }) {
  const stats = methodStats(profile, YM.methods);
  const tried = stats.filter((s) => s.n > 0);
  return (
    <section className="card" data-testid="your-methods">
      <h3 className="panel-title"><PxIcon name="scroll" size={24} />{YM.title}</h3>
      <p className="small">{YM.intro}</p>
      {tried.length === 0 && <p className="muted small">{YM.notTried}</p>}
      <ul className="small">{tried.map((s) => (
        <li key={s.id}><b>{s.name}</b> <span className="muted">{s.line}</span><br />
          {s.n < 4 ? `${s.name}: ${s.n} ${s.n === 1 ? 'try' : 'tries'} so far.` : (s.hold7 == null ? YM.perMethodTemplateNoHold : YM.perMethodTemplate).replace('{name}', s.name).replace('{n}', s.n).replace('{acc}', s.acc).replace('{hold7}', s.hold7)}</li>
      ))}</ul>
      {tried.length > 0 && tried.some((s) => s.n < 4) && <p className="muted small">{YM.lowDataLine}</p>}
      {tried.length > 0 && <p className="muted small">{YM.caption}</p>}
      <details className="about-more"><summary>{YM.fewAttempts.heading}</summary><p className="small">{YM.fewAttempts.text}</p></details>
      <p className="small">{YM.keepWhatWorks}</p>
      <p className="muted small">{YM.alsoSay} {YM.evidence}</p>
    </section>
  );
}
