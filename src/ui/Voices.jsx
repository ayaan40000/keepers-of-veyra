// 1.1 Cabinet of Voices. Seven lamp-spirits that coach in the story's voice. They appear only on the Character page, on Today
// after a session and around an Echo battle (never on a study or recall screen), give technique hints, never answers, and no rewards.
import React from 'react';
import { PxIcon } from './game/PxIcon.jsx';
import { ArtImg } from './artLookup.jsx';
import { artFor } from './artLookup.jsx';
import { VOICES_HONEST } from '../data/voices.js';
import { VOICE_ART, voicesMode, cabinet, voiceFor, afterLine, lastScored } from '../engine/voices.js';

function Spirit({ skill, size = 48 }) {
  const id = VOICE_ART[skill];
  return artFor(id) ? <ArtImg id={id} className="voice-art" alt="" style={{ width: size, height: size }} /> : <span className="voice-lamp" aria-hidden="true"><PxIcon name="lumen" size={size >= 48 ? 32 : 24} /></span>;
}

export function VoiceLine({ skill, line, kind, onReview }) {
  const v = VOICE_NAME[skill];
  return (
    <div className={`voice-line ${kind === 'quiet' ? 'quiet' : ''}`}>
      <Spirit skill={skill} />
      <div>
        <p className="small"><b>{v}</b>{kind === 'quiet' ? <span className="muted"> (quiet)</span> : null}</p>
        <p className="small voice-text">{line}</p>
        {kind === 'quiet' && onReview && <button className="btn small" onClick={onReview}>Show me a short review</button>}
      </div>
    </div>
  );
}
const VOICE_NAME = { imagery: 'Vision', linking: 'Thread', palace: 'Place', faces: 'Face', numbers: 'Count', vocab: 'Tongue', structure: 'Frame' };

// Character page: all seven. Light and Full both show this card.
export function CabinetCard({ profile, onReview }) {
  if (voicesMode(profile) === 'off') return null;
  const list = cabinet(profile);
  return (
    <section className="card" data-testid="voices-card">
      <h3 className="panel-title"><PxIcon name="lumen" size={28} />Cabinet of Voices</h3>
      <p className="muted small">Seven small lamp-spirits, one for each skill. They suggest techniques based on how your answers went, and never give answers. You can turn them down in Keeper settings.</p>
      <div className="voice-list">{list.map((x) => <VoiceLine key={x.skill} skill={x.skill} line={x.line} kind={x.kind} onReview={x.kind === 'quiet' && onReview ? onReview : null} />)}</div>
      <p className="muted small">{VOICES_HONEST}</p>
    </section>
  );
}

// Today, after the session (Full only): the voice of the skill you trained last.
export function TodayVoice({ profile }) {
  if (voicesMode(profile) !== 'full') return null;
  const last = lastScored(profile);
  const a = last && afterLine(last.skill, last.acc);
  if (!a) return null;
  return <section className="card" data-testid="today-voice"><VoiceLine skill={a.skill} line={a.line} /></section>;
}

// Before and after an Echo battle (Full only). `acc` is given for the after line.
export function BattleVoice({ profile, skill, acc }) {
  if (voicesMode(profile) !== 'full' || !VOICE_NAME[skill]) return null;
  const x = acc == null ? voiceFor(profile, skill) : afterLine(skill, acc);
  return <section className="card"><VoiceLine skill={skill} line={x.line} /></section>;
}
