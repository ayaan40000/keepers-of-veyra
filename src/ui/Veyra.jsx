import { EPILOGUE, GATE_TALK } from '../data/afteryear.js';
import React, { useState } from 'react';
import { PxIcon } from './game/PxIcon.jsx';
import { MODULES } from '../data/curriculum.js';
import { CHAPTERS, BEATS, SIDE_QUESTS, wrenStage, WREN_STAGES, tell } from '../data/story.js';
import { sessionStatus } from '../engine/session.js';
import { sideQuestState, codexFor, charactersFor, mainQuests } from '../engine/quests.js';
import { Portrait } from '../pixel/Faces.jsx';
import WorldMap from './pixel/WorldMap.jsx';

// District positions along the river, isometric map (original art).
const POS = [[70, 330], [150, 300], [235, 320], [300, 260], [220, 230], [130, 210], [70, 150], [160, 120], [250, 140], [320, 90], [230, 60], [130, 40]];
const VIEWS = [['map', 'Map'], ['journal', 'Quests'], ['chapters', 'Chapters'], ['people', 'People'], ['codex', 'Lore']];

function Journal({ profile }) {
  const mq = mainQuests(profile);
  return (
    <>
      <section className="card">
        <h3 className="panel-title"><PxIcon name="scroll" size={28} />Main quest</h3>
        <ol className="quest-list">{mq.map((q) => (
          <li key={q.id} className={q.state}>
            <span className="qstate">{{ done: 'Complete', open: 'Active', pending: 'Unfinished', locked: 'Locked' }[q.state]}</span>
            <b>{q.state === 'locked' ? `${q.district}` : q.quest}</b>
            <span className="muted small">Month {q.month} · {q.district}</span>
          </li>
        ))}</ol>
      </section>
      <section className="card">
        <h3 className="panel-title"><PxIcon name="quill" size={28} />Side quests</h3>
        <p className="muted small">Side quests finish themselves when you genuinely show the skill they ask for. You can't complete them by clicking, only by getting better.</p>
        {SIDE_QUESTS.map((q) => {
          const state = sideQuestState(profile, q);
          if (state === 'locked') return null;
          return (
            <details key={q.id} className={`side ${state}`}>
              <summary><span className="qstate">{state === 'done' ? 'Complete' : 'Open'}</span> <b>{q.title}</b> <span className="muted small">· {q.giver}</span></summary>
              <p className="story-text">{tell(q.hook, profile)}</p>
              <p className="goal"><b>To complete:</b> {q.goal}</p>
              {state === 'done' && <p className="story-text done-text">{tell(q.done, profile)}</p>}
            </details>
          );
        })}
        <p className="muted small">{SIDE_QUESTS.filter((q) => sideQuestState(profile, q) === 'locked').length} more side quests appear in later months.</p>
      </section>
    </>
  );
}

function Chapters({ profile }) {
  const seenBeats = Object.keys(BEATS).map(Number).filter((w) => (profile.story.seen || []).includes('w' + w));
  const list = ['prologue', ...MODULES.map((m) => m.id), 'epilogue'].filter((k) => k === 'prologue' || k === 'epilogue' ? profile.story.seen.includes(k) : profile.progress.gates.includes(k));
  return (
    <>
      {list.map((k) => (
        <details key={k} className="card parchment chapter-read">
          <summary><h3>{(k === 'epilogue' ? EPILOGUE : CHAPTERS[k]).title}</h3></summary>
          {(k === 'epilogue' ? EPILOGUE : CHAPTERS[k]).text.map((t, i) => <p key={i} className={`story-text ${i === 0 ? 'drop' : ''}`}>{tell(t, profile)}</p>)}
        </details>
      ))}
      {list.filter((k) => k !== 'epilogue').length < 13 && <section className="card"><p className="muted">{13 - list.filter((k) => k !== 'epilogue').length} chapters are still hidden in the fog. Each one opens when you pass the gate of its district.</p></section>}
      {seenBeats.length > 0 && (
        <details className="card chapter-read">
          <summary><h3>Weekly tales ({seenBeats.length})</h3></summary>
          {seenBeats.map((w) => <div key={w} className="beat-entry"><b>Week {w}: {BEATS[w].title}</b><p className="story-text">{tell(BEATS[w].text, profile)}</p></div>)}
        </details>
      )}
    </>
  );
}

function People({ profile }) {
  const g = profile.progress.gates.length;
  const stage = wrenStage(g);
  return (
    <>
      <section className="card">
        <div className="wren-row"><Portrait id="wren" mood="smile" scale={2} /><div><h3>Wren is {stage.name === 'Apprentice' ? 'an' : 'a'} {stage.name}</h3><p className="muted small">Wren grows when you pass gates, not when you simply log in.</p></div></div>
        <ol className="arc">{WREN_STAGES.map((s) => <li key={s.name} className={g >= s.min ? 'on' : ''}>{s.name}<span className="small muted"> · {s.min} gates</span></li>)}</ol>
      </section>
      {charactersFor(profile).map((c) => (
        <section key={c.id} className="card person">
          <div className="person-head">
            <Portrait id={c.id === 'you' ? `you-${profile.user.avatar || 'lantern'}` : c.id} scale={2} label={c.name} />
            <div><span className="tag">{c.role}</span><h3>{c.name}</h3></div>
          </div>
          {c.visible.map((t, i) => <p key={i} className="story-text">{tell(t, profile)}</p>)}
        </section>
      ))}
      <p className="muted small center">More people, and more about these ones, are revealed as the story unfolds.</p>
    </>
  );
}

function Codex({ profile }) {
  const entries = codexFor(profile);
  return (
    <>
      <p className="muted small">The lore of Veyra. New entries are found by passing gates and finishing side quests.</p>
      {entries.map((e) => e.open ? (
        <details key={e.id} className="card chapter-read">
          <summary><h3>{e.title}</h3></summary>
          {e.text.map((t, i) => <p key={i} className="story-text">{t.includes(' / ') ? t.split(' / ').map((l, j) => <span key={j} className="verse">{l}</span>) : t}</p>)}
        </details>
      ) : (
        <section key={e.id} className="card locked-entry"><h3 className="panel-title"><PxIcon name="lock" size={24} />Undiscovered</h3><p className="muted small">An entry not yet found.</p></section>
      ))}
    </>
  );
}

// Text version of the map: every district with its state, shown as a word and a shape, not colour alone.
const TALK_NAME = { tansy: 'Old Tansy', fennick: 'Fennick', wren: 'Wren', isolde: 'Isolde Varre', mosk: 'Mosk the ferryman', ennick: 'Brother Ennick', hask: 'Joss Hask' };
const STATE_MARK = { restored: ['✓', 'Restored'], current: ['◆', 'Current quest'], lost: ['○', 'In the fog'] };
function DistrictList({ profile, current, onSelect }) {
  return (
    <details className="card district-list">
      <summary>Districts as a list</summary>
      <ol>{MODULES.map((m) => {
        const st = profile.progress.gates.includes(m.id) ? 'restored' : m.id === current ? 'current' : 'lost';
        const [mark, word] = STATE_MARK[st];
        return (
          <li key={m.id} className={`dl-${st}`}>
            <button className="linkish" onClick={() => onSelect(m.id)}><span className="dl-mark" aria-hidden="true">{mark}</span><b>{m.district}</b></button>
            <span className="muted small">Month {m.month} · {word}</span>
          </li>
        );
      })}</ol>
    </details>
  );
}

export default function Veyra({ profile, update }) {
  const st = sessionStatus(profile);
  const gates = profile.progress.gates;
  const [view, setView] = useState('map');
  const [sel, setSel] = useState(st.mod.id);
  const m = MODULES.find((x) => x.id === sel);
  const restored = gates.includes(sel);
  const beat = BEATS[st.week.w];
  // A gate restored since the map was last opened plays its restoration once.
  const mapSeen = profile.story.mapSeen || [];
  const restoring = view === 'map' ? gates.find((g) => !mapSeen.includes(g)) : null;
  const markSeen = () => update?.((p) => { p.story.mapSeen = [...new Set([...(p.story.mapSeen || []), ...p.progress.gates])]; });
  return (
    <div className="page">
      <h1 className="page-title"><PxIcon name="map" size={36} />Veyra</h1>
      <p className="lead">{gates.length} of 12 districts restored from the fog.</p>
      <div className="subtabs" role="tablist">{VIEWS.map(([id, label]) => <button key={id} role="tab" aria-selected={view === id} className={view === id ? 'on' : ''} onClick={() => setView(id)}>{label}</button>)}</div>
      {view === 'map' && (
        <>
          <WorldMap gates={profile.progress.gates} current={st.mod.id} selected={restoring || sel} onSelect={setSel} restoring={restoring} onRestored={markSeen} className="veyra-map" />
          {restoring && <p className="note" role="status">{MODULES.find((x) => x.id === restoring)?.district} comes back out of the fog.</p>}
          <DistrictList profile={profile} current={st.mod.id} onSelect={setSel} />
          <section className={`card ${restored ? 'gold' : ''}`}>
            <span className="tag">Month {m.month} · {restored ? 'Restored' : m.id === st.mod.id ? 'Your current quest' : 'In the fog'}</span>
            <h2>{m.district}</h2>
            <p className="objective">{restored || m.id === st.mod.id ? CHAPTERS[m.id].quest : 'Not yet reached'}</p>
            <p className="muted">{m.title}. {m.objective}</p>
            {restored && GATE_TALK[m.id] && (
              <figure className="gate-talk">
                <Portrait id={GATE_TALK[m.id][0]} mood="smile" scale={2} />
                <blockquote><p>{tell(GATE_TALK[m.id][1], profile)}</p><cite>{TALK_NAME[GATE_TALK[m.id][0]]}</cite></blockquote>
              </figure>
            )}
            {restored ? <p className="muted small">This district's chapter is open. Read it under Chapters.</p> : <p className="muted small">The story of this district opens when you pass its gate.</p>}
          </section>
          {profile.story.seen.includes('w' + st.week.w) && beat && (
            <section className="card parchment"><span className="tag">This week in Veyra</span><h3>{beat.title}</h3><p className="story-text">{tell(beat.text, profile)}</p></section>
          )}
        </>
      )}
      {view === 'journal' && <Journal profile={profile} />}
      {view === 'chapters' && <Chapters profile={profile} />}
      {view === 'people' && <People profile={profile} />}
      {view === 'codex' && <Codex profile={profile} />}
    </div>
  );
}
