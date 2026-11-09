// 1.4 The Gloss at Brother Ennick's desk. A study screen: still and quiet.
import React, { useMemo, useState } from 'react';
import { PxIcon } from './game/PxIcon.jsx';
import { DialogueBox } from './game/DialogueBox.jsx';
import { Portrait } from '../pixel/Faces.jsx';
import { today } from '../engine/core.js';
import { gateDone } from '../engine/guide.js';
import { todayGlosses, recordGloss, GLOSS_BY_ID } from '../engine/gloss.js';
import { GLOSS_HONEST } from '../data/gloss.js';

export const glossOpen = (p) => gateDone(p, 'M6') || !!p?.progress?.reviewerUnlock;

export function GlossCard({ profile, onOpen }) {
  if (!glossOpen(profile)) return null;
  const list = todayGlosses(profile, today(profile));
  if (!list.length) return null;
  const d = list.filter((x) => x.delayed).length;
  return (
    <section className="card glass" data-testid="gloss-card">
      <h3 className="panel-title"><PxIcon name="quill" size={28} />The Gloss</h3>
      <p className="small">{d ? `${d} gloss${d > 1 ? 'es' : ''} from before to write again` : 'An idea to explain in your own words'}{list.length > d ? `, and ${list.length - d} new` : ''}. About {list.length * 2} minutes.</p>
      <p className="muted small">Optional. Self-marked; it earns nothing and changes no score.</p>
      <button className="btn" onClick={onOpen}>Go to Ennick's desk</button>
    </section>
  );
}

export default function Gloss({ profile, update, onExit }) {
  const list = useMemo(() => todayGlosses(profile, today(profile)), []);
  const [i, setI] = useState(-1);
  const [shown, setShown] = useState(false);
  const [val, setVal] = useState('');
  const [marks, setMarks] = useState([]);
  const q = list[i];
  const g = q && GLOSS_BY_ID[q.id];

  if (i < 0) return (
    <div className="page gloss">
      <h1 className="page-title"><PxIcon name="quill" size={36} />The Gloss</h1>
      <DialogueBox speaker="Brother Ennick" portrait={<Portrait id="ennick" scale={2} />} lines={['A scribe who truly knows a passage can write its meaning in the margin, in plain words. That is a gloss. The false chronicle was the one whose glosses did not match its text.', 'Explain it to me as you would to a friend. Then look at mine. Then be honest with yourself; I will not check.']} />
      <section className="card">
        <p className="small">{list.length ? `${list.length} to write today.` : 'Nothing to gloss today.'} {GLOSS_HONEST}</p>
        <div className="row wrap">
          <button className="btn primary" disabled={!list.length} onClick={() => setI(0)}>Begin</button>
          <button className="btn ghost" onClick={onExit}>Not now</button>
        </div>
      </section>
    </div>
  );

  if (!q) {
    const kept = marks.filter((m) => m === 'kept').length;
    return (
      <div className="page gloss">
        <section className="card gold" role="status">
          <span className="tag">Ennick's desk</span>
          <h2>{kept} of {marks.length} glossed well.</h2>
          <p className="small">Ennick adds your glosses to the row on his desk. "Fewer mistakes than last month. I am writing that down too."</p>
          <p className="small muted">Each gloss comes back tomorrow and again in a week. Explaining it later, from memory, is the part that builds understanding.</p>
          <button className="btn primary" autoFocus onClick={onExit}>Back</button>
        </section>
      </div>
    );
  }

  const mark = (m) => { update((p) => { recordGloss(p, q.id, m, today(p)); }); setMarks([...marks, m]); setShown(false); setVal(''); setI(i + 1); };
  return (
    <div className="page gloss">
      <section className="card">
        <span className="tag">Gloss {i + 1} of {list.length}{q.delayed ? ' · from before, without looking' : ''}</span>
        <h2 className="ledger-cue">{g.prompt}</h2>
        <label className="field">Your gloss (one or two sentences; or say it aloud)<textarea rows={3} value={val} onChange={(e) => setVal(e.target.value)} disabled={shown} /></label>
        {!shown ? <button className="btn primary" autoFocus onClick={() => setShown(true)}>Show Ennick's gloss</button> : (
          <>
            <p className="small"><b>Ennick's gloss:</b> {g.model}</p>
            <p className="small">Did yours carry the same meaning?</p>
            <div className="row wrap">
              <button className="btn primary" onClick={() => mark('kept')}>Kept</button>
              <button className="btn" onClick={() => mark('partly')}>Partly</button>
              <button className="btn" onClick={() => mark('missed')}>Missed</button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
