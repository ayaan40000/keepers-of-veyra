import React, { useState } from 'react';
import { PxIcon } from './game/PxIcon.jsx';
import { gateDone } from '../engine/guide.js';
import SHEETS from '../data/add/worksheets.json';
import TOOLBOX from '../data/add/toolbox.json';

// "What things are called": common method names, in plain words, with the week that teaches each.
export function Toolbox({ profile }) {
  const open = gateDone(profile, TOOLBOX.unlock);
  return (
    <details className="about-more" data-testid="toolbox">
      <summary>{TOOLBOX.title}{open ? '' : ' (locked)'}</summary>
      {open ? (
        <div>
          <p className="small">{TOOLBOX.intro}</p>
          <dl className="small">{TOOLBOX.items.map((i) => <React.Fragment key={i.name}><dt><b>{i.name}</b> <span className="muted">({i.weeks})</span></dt><dd>{i.means}</dd></React.Fragment>)}</dl>
          <p className="small note">{TOOLBOX.honest}</p>
        </div>
      ) : <span className="small muted">Opens when you pass the first gate.</span>}
    </details>
  );
}

// Printable worksheets in plain text. Nothing typed here is saved: print the page and write on paper.
export function Worksheets() {
  const [id, setId] = useState(null);
  const sheet = SHEETS.find((s) => s.id === id);
  return (
    <section className="card" data-testid="worksheets">
      <h3 className="panel-title"><PxIcon name="quill" size={28} />Printable worksheets</h3>
      <p className="muted small">Plain pages to print and fill in by hand. The game does not save anything you write on them.</p>
      <div className="row wrap no-print">{SHEETS.map((s) => <button key={s.id} className={`btn small${id === s.id ? ' on' : ''}`} aria-pressed={id === s.id} onClick={() => setId(id === s.id ? null : s.id)}>{s.title}</button>)}</div>
      {sheet && (
        <div>
          <div className="printable" data-testid="worksheet-page">
            <h4>{sheet.title}</h4>
            <p className="small">{sheet.intro}</p>
            <ol className="small">{sheet.howTo.map((h) => <li key={h}>{h}</li>)}</ol>
            {sheet.id === 'map-people' && <p className="small note">{sheet.honest}</p>}
            <pre className="worksheet">{sheet.lines.join('\n')}</pre>
            {(sheet.examples || []).map((ex) => <div key={ex.title}><p className="small"><b>{ex.title}</b></p><pre className="worksheet">{ex.lines.join('\n')}</pre></div>)}
            {sheet.id !== 'map-people' && <p className="small note">{sheet.honest}</p>}
          </div>
          <button className="btn no-print" onClick={() => window.print()}>Print this page</button>
        </div>
      )}
    </section>
  );
}
