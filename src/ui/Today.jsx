import { KEEPING_LINES } from '../data/afteryear.js';
import { SEAM_KEEPING_LINES } from '../data/forgetting.js';
import { WrenBeatCard, WrenAskCard } from './WrenStory.jsx';
import { SeamCard } from './Seam.jsx';
import { seamClosed } from '../engine/seam.js';
import React, { useState } from 'react';
import Cards from './Cards.jsx';
import { STUDY_SETS } from '../engine/additions.js';
import { Tip } from './Tips.jsx';
import { moodFor } from '../engine/moods.js';
import { WEEKS, TEMPLATE_NAME, TEMPLATE_SKILL, SKILLS } from '../data/curriculum.js';
import { wrenLine, wrenStage } from '../data/story.js';
import { sessionStatus, buildSession, estimateMinutes } from '../engine/session.js';
import { streaks, consistency, rankOf } from '../engine/progress.js';
import { DialogueBox } from './game/DialogueBox.jsx';
import { PxIcon } from './game/PxIcon.jsx';
import { PixelBar } from './game/PixelBar.jsx';
import { Portrait } from '../pixel/Faces.jsx';
import { CryptCard } from './Crypt.jsx';
import { DistrictScene } from './artLookup.jsx';
import { BackupReminder, SafariNotice, InstallCard, downloadBackup } from './Notices.jsx';
import { buildExport } from '../store.js';
import { RealLifeCard } from './FieldGuide.jsx';
import { CarryCard } from './CarryCard.jsx';
import { EchoCard, VigilCard } from './Battle.jsx';
import { TodayVoice } from './Voices.jsx';
import { TrialDueCard } from './Trials.jsx';
import { OwnTextCard } from './OwnText.jsx';
import { LedgerCard, LedgerEntry, ledgerOpen } from './Ledger.jsx';
import { GlossCard } from './Gloss.jsx';
import { pendingNudge } from '../engine/guide.js';
import { today } from '../engine/core.js';

const FREE = [
  { t: 'wordlist', n: 10, s: 60, w: 1 }, { t: 'pairs', n: 8, s: 70, w: 2 }, { t: 'chain', n: 10, s: 90, w: 3 },
  { t: 'palace', n: 10, s: 90, w: 5 }, { t: 'faces', n: 6, s: 60, w: 9 }, { t: 'major', n: 10, range: 10, w: 14 },
  { t: 'digits', n: 12, s: 80, w: 18 }, { t: 'vocab', n: 8, s: 90, w: 22 }, { t: 'facts', n: 8, s: 90, w: 27 },
  // 1.1 additions: still optional, opened by the week that teaches them. Mental Reckoning and Cards earn no Lumen and change no skill estimate.
  { t: 'pairs', n: 10, s: 80, peg: 'shape', label: 'Pegs: shapes', w: 24 }, { t: 'pairs', n: 10, s: 80, peg: 'rhyme', label: 'Pegs: rhymes', w: 24 },
  { t: 'faces', n: 6, s: 70, surname: true, label: 'Names and surnames', w: 13 },
  { t: 'map', kind: 'topic', n: 12, s: 110, label: 'Mind Map: topics', w: 29 }, { t: 'map', kind: 'people', n: 12, s: 100, label: 'Mind Map: people', w: 29 },
  { t: 'facts', n: 5, s: 60, skim: true, label: 'Skim, Pick, Keep', w: 41 }, { t: 'poem', n: 6, s: 120, label: 'Poem', w: 41 },
  { t: 'calc', n: 8, mode: 'see', label: 'Reckoning: see the sum', w: 22 }, { t: 'calc', n: 8, mode: 'hold', label: 'Reckoning: hold the sum', w: 22 },
  ...STUDY_SETS.map((x) => ({ t: 'facts', n: 8, s: 90, src: x.src, label: x.label, w: x.w })),
  { t: 'chain', n: 12, s: 100, src: 'body', label: 'Anatomy terms', w: 27 },
];

export default function Today({ profile, start, onEnterCrypt, update, onFight, onTrial }) {
  const [cards, setCards] = useState(false);
  const st = sessionStatus(profile);
  const g = profile.progress.gates.length;
  const stage = wrenStage(g);
  const sk = streaks(profile);
  const rank = rankOf(profile.progress.lumen);
  const cons = consistency(profile);
  const resume = profile.inProgress;
  const nudge = pendingNudge(profile, today(profile));
  const line = st.away >= 3 ? wrenLine('returnAfter', g, st.day) : wrenLine('welcome', g, st.day);
  const dayLabel = st.keeping ? `Year of Keeping, day ${st.keeping}` : `Day ${st.day}`;
  const typeLabel = st.keeping ? { full: `${dayLabel}: ${st.week.title}`, assessment: `${dayLabel}: check-up on week ${st.week.w}` }[st.type] || dayLabel : { baseline: 'Day 1: baseline and first lesson', full: `Day ${st.day}: ${st.week.title}`, assessment: `Day ${st.day}: week ${st.week.w} assessment`, gate: `Day ${st.day}: gate of ${st.mod.district}` }[st.type];
  return (
    <div className="page today">
      <DialogueBox speaker={`Wren · ${stage.name}`} portrait={<Portrait id="wren" mood={moodFor(line, ['neutral', 'smile', 'worried'])} scale={2} />} lines={[line]} />

      {profile.progress.baselineDone && <Tip profile={profile} update={update} id="today">Each day the quest board gives you one session. Finish it and rest: sleep does part of the work. The Undercroft below is optional, a test of how deep your memory goes.</Tip>}

      <div className="board-head"><PxIcon name="scroll" size={24} />Quest board</div>

      {resume ? (
        <section className="card parchment cta quest-card">
          <span className="pin" aria-hidden="true" />
          <span className="tag">Quest underway</span>
          <h2>Session in progress</h2>
          <p className="muted">Step {resume.idx + 1} of {resume.session.steps.length}. Every finished drill is saved. A drill you left part-way restarts with new material.</p>
          <button className="btn primary big" onClick={() => start('resume')}>Continue session</button>
          <button className="btn ghost small" onClick={() => start('discard')}>Discard this session</button>
          <p className="muted small">Discarding keeps finished drills. A gate attempt still counts, and further sessions today earn Lumen at the practice cap.</p>
        </section>
      ) : st.doneToday ? (
        <section className="card gold cta quest-card">
          <span className="tag"><PxIcon name="star" size={14} />Quest complete</span>
          <h2>Today's training is done</h2>
          <p className="muted">{st.keeping ? 'Kept for another day.' : `Day ${st.day - 1} complete.`} Rest is part of the method: sleep consolidates what you encoded. {st.due ? `${st.due} delayed recall set${st.due > 1 ? 's are' : ' is'} due if you want a short review.` : ''}</p>
          {st.due > 0 && <button className="btn" onClick={() => start('review')}>Review session (10 min)</button>}
        </section>
      ) : (
        <section className="card parchment cta quest-card">
          <span className="pin" aria-hidden="true" />
          <DistrictScene id={st.mod.id} restored={profile.progress.gates.includes(st.mod.id)} className="quest-banner" />
          <span className="tag">Module {st.mod.id.slice(1)} · {st.mod.district}</span>
          <h2>{typeLabel}</h2>
          <p className="muted">{st.type === 'baseline' ? 'About 20 minutes: three short measurements, then your first lesson.' : st.keeping ? `${KEEPING_LINES[st.keeping % KEEPING_LINES.length]} Today revisits week ${st.week.w}: ${st.week.obj}` : `Goal this week: ${st.week.obj}`}</p>
          {st.type !== 'baseline' && <p className="quest-meta"><span><PxIcon name="sun" size={20} />Estimated length: about {estimateMinutes(buildSession(profile, st.type))} minutes.</span></p>}
          <button className="btn primary big" onClick={() => start(st.type)}>{st.type === 'baseline' ? 'Begin' : st.keeping ? 'Begin' : `Begin day ${st.day}`}</button>
          {st.away >= 2 && st.type !== 'baseline' && <button className="btn" onClick={() => start('recovery')}>Short recovery session (10 min)</button>}
          {st.due > 0 && <p className="muted small">{st.due} delayed recall set{st.due > 1 ? 's' : ''} due; the session opens with them.</p>}
        </section>
      )}

      {st.doneToday && !resume && nudge && <RealLifeCard profile={profile} update={update} task={nudge} />}
      {!resume && <CarryCard profile={profile} update={update} />}

      {st.keeping > 0 && !seamClosed(profile) && !resume && <p className="muted small tide-line">{SEAM_KEEPING_LINES[(st.keeping - 1) % SEAM_KEEPING_LINES.length]}</p>}

      {!resume && onFight && <SeamCard profile={profile} onOpen={() => onFight('seam')} />}

      {!resume && <WrenBeatCard profile={profile} update={update} />}

      {st.doneToday && !resume && <WrenAskCard profile={profile} update={update} />}

      {st.doneToday && !resume && onFight && <EchoCard profile={profile} update={update} onFight={onFight} />}

      {st.doneToday && !resume && <TodayVoice profile={profile} />}

      {st.doneToday && !resume && onFight && <VigilCard profile={profile} update={update} onFight={onFight} />}

      {st.doneToday && !resume && onTrial && <TrialDueCard profile={profile} onTrial={onTrial} />}

      {!resume && onFight && <LedgerCard profile={profile} onOpen={() => onFight('ledger')} />}
      {!resume && onFight && ledgerOpen(profile) && !profile.ledger?.books?.length && <LedgerEntry profile={profile} onOpen={() => onFight('ledger')} />}
      {!resume && onFight && <GlossCard profile={profile} onOpen={() => onFight('gloss')} />}
      {!resume && onFight && <OwnTextCard profile={profile} onOpen={() => onFight('own')} />}

      {!resume && <BackupReminder profile={profile} update={update} onExport={() => downloadBackup(profile, update, buildExport)} />}
      {!resume && <SafariNotice profile={profile} update={update} />}
      {!resume && <InstallCard profile={profile} update={update} />}

      {!resume && profile.progress.baselineDone && <CryptCard profile={profile} onEnter={onEnterCrypt} />}

      {st.pendingGate && !resume && (
        <section className="card glass">
          <h3 className="panel-title"><PxIcon name="crypt" size={28} />Retry the gate of {st.pendingGate.district}</h3>
          <p className="muted small">Your curriculum continued. The story waits for this gate.</p>
          <button className="btn" onClick={() => start('gateRetry', { mod: st.pendingGate })}>Attempt gate</button>
        </section>
      )}

      <div className="stats">
        <div className="stat"><PxIcon name="chart" size={32} /><b>{cons}</b><span>days trained of last 14</span></div>
        <div className="stat"><PxIcon name="sun" size={32} /><b>{sk.current}</b><span>day streak (longest {Math.max(sk.longest, sk.current)})</span></div>
        <div className="stat"><PxIcon name="star" size={32} /><b>{rank.rank}</b><span>{rank.title}</span><PixelBar value={rank.frac} size="xs" /></div>
        <div className="stat"><PxIcon name="lumen" size={32} /><b>{profile.progress.lumen}</b><span>Lumen</span></div>
      </div>

      {!resume && profile.progress.baselineDone && (
        <section className="card">
          <h3 className="panel-title"><PxIcon name="map" size={28} />Training Grounds</h3>
          <p className="muted small">Optional free practice. Counts toward your skill estimates; Lumen is capped at 50 a day so practice stays about learning.</p>
          <div className="grounds">
            {FREE.map((f) => {
              const open = st.week.w >= f.w || profile.progress.reviewerUnlock;
              const spec = f.t === 'calc' ? { ...f, level: Math.max(1, Math.min(6, Math.ceil((profile.skills.numbers?.level || 1) / 2))) } : f;
              return (
                <button key={f.label || f.t} className="ground" disabled={!open} onClick={() => start('free', { spec })}>
                  <PxIcon name={open ? 'quill' : 'lock'} size={28} />
                  <b>{f.label || TEMPLATE_NAME[f.t]}</b>
                  <span className="small">{open ? (f.t === 'calc' ? 'No Lumen' : SKILLS[TEMPLATE_SKILL[f.t]].short) : `Opens week ${f.w}`}</span>
                </button>
              );
            })}
            <button className="ground" disabled={!(st.week.w >= 22 || profile.progress.reviewerUnlock)} onClick={() => setCards(true)}>
              <PxIcon name={st.week.w >= 22 || profile.progress.reviewerUnlock ? 'quill' : 'lock'} size={28} />
              <b>Card Run</b>
              <span className="small">{st.week.w >= 22 || profile.progress.reviewerUnlock ? 'Optional, no credit' : 'Opens week 22'}</span>
            </button>
          </div>
          {cards && <Cards onClose={() => setCards(false)} timerMult={profile.user.prefs.timerMult || 1} />}
        </section>
      )}
    </div>
  );
}

export { WEEKS };
