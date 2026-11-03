import { Tip } from './Tips.jsx';
import React from 'react';
import { PxIcon } from './game/PxIcon.jsx';
import { TEMPLATE_NAME, BASELINE } from '../data/curriculum.js';
import { componentScores, mtsFor, WEIGHTS, dailySeries, skillSummary, streaks, sessionLengths } from '../engine/progress.js';
import { addDays } from '../engine/util.js';
import { today } from '../engine/core.js';
import { ThenNow, YourMethods } from './Methods.jsx';

const MASTERY = ['Untrained', 'Learning', 'Practiced', 'Proficient', 'Mastered'];
const COMP = { retention: 'Retention', accuracy: 'Accuracy', transfer: 'Transfer', mastery: 'Mastery', speed: 'Speed' };

function LineChart({ data }) {
  const W = 340, H = 150, pad = 28;
  const x = (i) => pad + (i / Math.max(1, data.length - 1)) * (W - pad - 8);
  const y = (v) => H - 20 - v * (H - 40);
  const path = (k) => {
    let d = '', pen = false;
    data.forEach((p, i) => { if (p[k] == null) { pen = false; return; } d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p[k]).toFixed(1)} `; pen = true; });
    return d;
  };
  const dots = (k, cls) => data.map((p, i) => p[k] == null ? null : <rect key={k + i} x={Math.round(x(i)) - 3} y={Math.round(y(p[k])) - 3} width="6" height="6" className={cls} />);
  return (
    <div className="chart-frame"><svg viewBox={`0 0 ${W} ${H}`} className="chart" shapeRendering="crispEdges" role="img" aria-label="Accuracy and retention over the last 60 days">
      {[0, 0.5, 1].map((v) => <g key={v}><line x1={pad} x2={W - 8} y1={y(v)} y2={y(v)} className="grid" /><text x={pad - 6} y={y(v) + 4} textAnchor="end" className="axis">{v * 100}</text></g>)}
      <text x={pad} y={H - 4} className="axis">{data[0].date.slice(5)}</text>
      <text x={W - 8} y={H - 4} textAnchor="end" className="axis">{data[data.length - 1].date.slice(5)}</text>
      <path d={path('acc')} className="l-acc" /><path d={path('ret')} className="l-ret" />
      {dots('acc', 'd-acc')}{dots('ret', 'd-ret')}
    </svg></div>
  );
}

function Radar({ skills }) {
  const R = 70, cx = 110, cy = 95, n = skills.length;
  const pt = (i, v) => { const a = -Math.PI / 2 + (i / n) * Math.PI * 2; return [cx + Math.cos(a) * R * v, cy + Math.sin(a) * R * v]; };
  const poly = skills.map((s, i) => pt(i, (s.mastery / 4) * 0.85 + (s.attempts ? 0.15 : 0)).join(',')).join(' ');
  return (
    <svg viewBox="0 0 220 190" className="chart radar" shapeRendering="crispEdges" role="img" aria-label="Skill mastery radar">
      {[0.33, 0.66, 1].map((r) => <polygon key={r} points={skills.map((_, i) => pt(i, r).join(',')).join(' ')} className="grid" fill="none" />)}
      {skills.map((s, i) => { const [x, y] = pt(i, 1.18); return <text key={s.id} x={x} y={y + 3} textAnchor="middle" className="axis">{s.short}</text>; })}
      <polygon points={poly} className="r-area" />
    </svg>
  );
}

function Heatmap({ profile }) {
  const t = today(profile);
  const days = Array.from({ length: 84 }, (_, i) => addDays(t, i - 83));
  const set = new Set(profile.progress.trainingDates);
  return (
    <div className="heat" role="img" aria-label={`Training days in the last 12 weeks: ${days.filter((d) => set.has(d)).length}`}>
      {days.map((d) => <i key={d} className={set.has(d) ? 'on' : ''} title={d} />)}
    </div>
  );
}

function SessionLength({ profile }) {
  const s = sessionLengths(profile);
  if (!s.count) return null;
  return <p className="small">Your daily sessions: about <b>{s.median} minutes</b> in the middle, from {s.min} to {s.max}, over {s.count} session{s.count > 1 ? 's' : ''}. Sessions left open for more than 90 minutes are not counted.</p>;
}

export default function Progress({ profile, update }) {
  const c = componentScores(profile);
  const m = mtsFor(profile);
  const score = m.score;
  const skills = skillSummary(profile);
  const series = dailySeries(profile, 60);
  const sk = streaks(profile);
  const introduced = skills.filter((s) => s.attempts > 0);
  const weak = introduced.filter((s) => s.avg != null).sort((a, b) => a.avg - b.avg).slice(0, 3);
  const checks = profile.results.filter((r) => ['check', 'gate', 'baseline'].includes(r.role)).slice(-10).reverse();
  const latestBy = (t) => [...profile.results].reverse().find((r) => r.t === t && r.battery);
  return (
    <div className="page">
      <h1 className="page-title"><PxIcon name="chart" size={36} />Progress</h1>
      <Tip profile={profile} update={update} id="progress">These numbers show how you do on Mnemos tasks, nothing more. The most honest one is delayed recall: what you still remember days later.</Tip>
      <section className="card gold mts">
        <div className="row between">
          <div><span className="tag"><PxIcon name="star" size={14} />Training score</span><div className="score-big">{score ?? '–'}<small>/1000</small></div></div>
          <div className="muted small right">{profile.progress.trainingDates.length} days trained<br />{profile.progress.minutes} minutes<br />longest run {Math.max(sk.longest, sk.current)} days</div>
        </div>
        {score == null && <p className="muted small">Not enough evidence yet. The score appears after 3 training days, once delayed recall or several other components have data.</p>}
        {score != null && m.provisional && <p className="muted small">Provisional until 14 training days: early scores come from short, easy lists and will move.</p>}
        <ul className="bars">{Object.entries(WEIGHTS).map(([k, w]) => (
          <li key={k}><span>{COMP[k]} <span className="muted small">{Math.round(w * 100)}%</span></span>
            <div className="meter"><i style={{ width: `${c[k] ?? 0}%` }} /></div><b>{c[k] == null ? 'no data' : Math.round(c[k])}</b></li>
        ))}</ul>
        <SessionLength profile={profile} />
        <p className="muted small">Weights: retention 30, accuracy 25, transfer 20, mastery 15, speed 10. Components without data are left out and the rest re-weighted. These scores measure performance on Mnemos tasks only. They are not an IQ test or a clinical test.</p>
      </section>

      <section className="card">
        <h3 className="panel-title"><PxIcon name="chart" size={24} />Accuracy and retention, last 60 days</h3>
        <LineChart data={series} />
        <p className="legend"><span className="k acc" /> practice accuracy <span className="k ret" /> delayed recall kept (vs. first score)</p>
      </section>

      <section className="card two">
        <div><h3 className="panel-title"><PxIcon name="star" size={24} />Skill mastery</h3><Radar skills={skills} /></div>
        <div>
          <h3 className="panel-title"><PxIcon name="sun" size={24} />Training days, 12 weeks</h3><Heatmap profile={profile} />
          {weak.length > 0 && <><h3>Needs reinforcement</h3><ul className="plain">{weak.map((s) => <li key={s.id}>{s.name}: {Math.round(s.avg * 100)}% average{s.remediate ? ' · rebuild drills active' : ''}</li>)}</ul></>}
        </div>
      </section>

      <section className="card">
        <h3 className="panel-title"><PxIcon name="scroll" size={24} />Skills</h3>
        <table className="results">
          <thead><tr><th>Skill</th><th>State</th><th>Lvl</th><th>Avg</th><th>Kept</th><th className="hide-sm">Trend</th></tr></thead>
          <tbody>{skills.map((s) => (
            <tr key={s.id}><td><span className="dot" style={{ background: s.color }} />{s.name}</td><td>{MASTERY[s.mastery]}</td><td>{s.attempts ? s.level : '–'}</td>
              <td>{s.avg == null ? '–' : `${Math.round(s.avg * 100)}%`}</td><td>{s.retention == null ? '–' : `${Math.round(s.retention * 100)}%`}</td>
              <td className="hide-sm">{s.trend == null ? '–' : `${s.trend >= 0 ? '+' : ''}${Math.round(s.trend * 100)}`}</td></tr>
          ))}</tbody>
        </table>
        <p className="muted small">Avg is a moving average of drill accuracy. Kept is delayed recall relative to the first score. Proficient and Mastered require delayed recall, not just good practice.</p>
      </section>

      {profile.baseline && (
        <section className="card">
          <h3 className="panel-title"><PxIcon name="quill" size={24} />Against your day-1 baseline</h3>
          <table className="results"><thead><tr><th>Task</th><th>Day 1</th><th>Latest</th></tr></thead>
            <tbody>{BASELINE.map((b) => { const l = latestBy(b.t); return <tr key={b.t}><td>{b.label}</td><td>{Math.round((profile.baseline.results[b.t] ?? 0) * 100)}%</td><td>{l ? `${Math.round(l.acc * 100)}% (day ${l.day})` : 'week 13'}</td></tr>; })}</tbody>
          </table>
          <p className="muted small">The same three tasks, same length, new material, repeated in the assessments of weeks 13, 26, 39 and 52.</p>
        </section>
      )}

      <ThenNow profile={profile} />
      <YourMethods profile={profile} />

      <section className="card">
        <h3 className="panel-title"><PxIcon name="crypt" size={24} />Assessment history</h3>
        {checks.length ? <table className="results"><thead><tr><th>Date</th><th>Type</th><th>Drill</th><th>Score</th></tr></thead>
          <tbody>{checks.map((r, i) => <tr key={i}><td>{r.date.slice(5)}</td><td>{r.role}</td><td>{TEMPLATE_NAME[r.t]}</td><td>{r.correct}/{r.n}</td></tr>)}</tbody></table> : <p className="muted">No assessments yet.</p>}
      </section>
    </div>
  );
}
