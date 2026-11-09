import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TEMPLATE_NAME, SKILLS } from '../data/curriculum.js';
import { MAJOR_CODE } from '../data/content.js';
import { recallMode, scoreDrill, LURE_ANSWER } from '../engine/core.js';
import { describeFace, faceParams } from '../pixel/faces.js';
import { shuffle, rng } from '../engine/util.js';
import { PixelFace, Portrait } from '../pixel/Faces.jsx';
import { PalaceEditor } from './Palaces.jsx';
import { sfx } from '../audio/sfx.js';
import { langName, isLangSpec, VOCAB_HONEST } from '../engine/lang.js';
import { HearIt } from './HearIt.jsx';
import { Diagram } from './Diagram.jsx';
import { ArtImg, artFor } from './artLookup.jsx';

// 1.2 the formula symbol alphabet: a fixed picture for each symbol (shown on the formulae brief when painted).
const SYMBOL_PICS = [['symbol_pi', 'π'], ['symbol_squared', '²'], ['symbol_cubed', '³'], ['symbol_equals', '='], ['symbol_divide', '/'], ['symbol_plus', '+'], ['symbol_root', '√'], ['symbol_half', '½'], ['symbol_lambda', 'λ'], ['symbol_rho', 'ρ']];
import { ABSTRACT_HONEST } from '../data/abstract.js';

// 1.2 how to hold each kind of hard material (shown on the brief, before studying).
const ABSTRACT_BRIEF = {
  formulas: 'Each formula is shown with what its letters mean. First make sure you know what each letter stands for. Then give each symbol a fixed picture (π is a pie, a small 2 is a swan, a fraction bar is a table) and act the formula out as one small scene. Later one part of each formula is missing, and you fill it in. You can type r2 for r², 1/2 for ½, and pi for π.',
  dates: 'Each event comes with its year. Turn the year into Major System pictures (1066 is 10 toes and 66 a judge: a judge stamping on toes) and make those pictures act inside the event. Later you see the event and type the year. For years before the common era, add BC or BCE.',
  trivia: 'Each question comes with its answer. Make a picture for the question and one for the answer, and make them touch. Later you see the question and type the answer.',
  wonders: 'Each surprising fact comes with a short reason. Picture the surprise itself, as big and strange as you can, and tie the answer to it. The reason helps: a fact that makes sense is easier to keep. Later you see the question and type the answer.',
  jokes: 'Most people forget a joke because they keep the punchline as words. Find the one key word that makes it funny, picture it, and stick it onto the main picture of the setup. Later you see the setup and type the punchline. The key word is what counts.',
  diagram: 'Walk the drawing like a tiny palace, in the order of the numbers, and give each label a picture that sits on its spot. Later the labels go and you write each one by its number.',
};
import { groupDigits, DIGIT_ROW, mapBranches, SOUNDALIKE, SOUND_HONEST, PEG_HONEST, MAP_HONEST, SKIM_HONEST, POEM_LEARN, POOL_NOTES, numericOk } from '../engine/additions.js';

const BRIEF = {
  wordlist: 'You will see a list of words. For each one, make a clear, vivid picture in your mind: something you could almost touch. When the time is up, write down as many as you can remember, in any order. Don\'t worry about spelling.',
  chain: 'You will see a list of words in order. Link them into a little story: the first picture does something to the second, the second to the third, and so on. Afterwards, you will write them back in the same order.',
  pairs: 'You will see pairs of words. For each pair, make the first picture do something to the second, so they are touching or crashing together. Later you will see only the first word and need to remember its partner.',
  palace: 'Each item will be shown next to a stop on your palace route. Put the picture at that stop and make it do something to the place: break it, soak it, sit on it. Then you will walk the route in your mind and say what you find at each stop.',
  digits: 'You will see a long number. From Month 4 you will turn each pair of digits into a picture with the Major System. Until then, use any method you like: rhythm, patterns, dates, anything that helps.',
  major: 'Each number has a sound code. For each number shown, type the picture word you use for it, as quickly as you can, then press Enter. Any word whose consonant sounds spell out the number counts as correct.',
  faces: 'You will meet some people. For each one, pick a feature that won\'t change, turn their name into a picture, and stick the picture onto that feature. Later the faces come back in a different order, and you write each name.',
  facesLures: 'Careful: when the faces come back, one or two will be strangers who look like someone you met. Check the feature you chose. If you have not met them, press "Not met".',
  facesTurn: 'You meet everyone face-on, but at recall they will be turned a little to one side, the way you see people across a room. Anchor names on features that still show from an angle.',
  facesRestyle: 'People change their hair, glasses and clothes. At recall they may look different, so anchor each name on the face itself: the nose, the eyes, the shape of the jaw.',
  vocab: 'You will see words in Swahili with their meanings. For each one, find something it sounds like in English and make that picture act on the meaning. Later you will see the Swahili word and type what it means.',
  facts: 'You will see questions with their answers. Make a picture for the question and a picture for the answer, and make them interact. Later you will see each question and type the answer.',
  map: 'You will see a map of a topic: a centre, a few branches, and short leaves on each branch. Study how it fits together, and give each leaf a picture. Then the leaves disappear. You will see the centre and the branches with empty boxes, and rebuild the map from memory. Order inside a branch does not matter, but a leaf must go under the right branch.',
  poem: 'You will see a poem, line by line. Give each line one picture at one stop, and say it aloud. Then you will write it back one line at a time, in order. Capitals and punctuation do not matter in practice, and a small typo is forgiven.',
  calc: 'You will see short sums. Work left to right, say each partial result aloud, and type the final answer. Only the final answer is scored. The boxes for partial results are for you.',
  skim: 'Three steps on one short text. Skim: look at the headings and the first lines for a short time. Pick: choose up to five sentences you think are the key points. Keep: study the key points with a picture each, then write one key word for each heading. Skimming finds points. It does not store them. Keeping them is the separate job.',
  peg: 'Each number has a fixed picture. For each peg, hang the item on it: make the picture and the item touch. Later you will see a peg and its number in a different order, and write what was hung on it.',
  numbered: 'You will see numbered words. Picture each one and hang it on its number. Later you will be asked for words by number, in a different order.',
  surname: 'You will meet some people with a first name and a surname. Picture the first name on one feature and the surname on another. Later you write both names. Each name is one point.',
};
// 1.2: the brief for each kind of language practice.
function vocabBrief(spec) {
  const name = langName(spec);
  const produce = spec.dir === 'produce';
  if (spec.sounds) return `These are words in ${name}. They mean nothing to you yet, so the sound is all you have. Say each word aloud twice, cut it into pieces, and give each piece a sound-alike picture, then join the pictures in one small scene. Later you write the words back in any order. One wrong letter is forgiven on longer words.`;
  if (spec.src === 'phrases') return produce
    ? `You will see short ${name} phrases with their meanings. Picture one small scene for each phrase, with a picture for each word if you can. Later you will see the meaning and type the ${name} phrase. Accents are not needed, and a small typo is forgiven.`
    : `You will see short ${name} phrases with their meanings. Picture one small scene for each phrase. Later you will see the ${name} phrase and type what it means. A small typo is forgiven.`;
  if (produce && spec.gender) return `You will see ${name} words with el or la in front. Give each word a sound-alike picture, then mark it by its article: el words are on fire, la words are made of ice. Later you see the meaning and type the article and the word. Each is one point.`;
  if (produce) return `You will see ${name} words with their meanings. Say each word aloud twice, then make a sound-alike picture that acts on the meaning. Later you will see the meaning and type the ${name} word. This way round is harder, and it is how words stick. Accents are not needed.`;
  return `You will see words in ${name} with their meanings. Say each one aloud twice, then find something it sounds like in English and make that picture act on the meaning. Later you will see the ${name} word and type what it means.`;
}

const SPEC_NOTE = {
  group: 'The digits are shown in groups. Treat each group as one unit, and say it aloud in a beat if you like.',
  src: 'Some items come with a sentence. The key word is marked. Picture the key word and keep the order, then write the key words back.',
  body: 'This is study vocabulary for a course. It is not health information and does not help anyone judge a symptom. See a health professional for any health question.',
  poolHonest: 'Pictures help you hold a list. They do not teach the subject.',
};

const ROLE_LABEL = { guided: 'Guided practice', practice: 'Practice', remedial: 'Rebuild practice', check: 'Check', gate: 'Gate challenge', baseline: 'Baseline', warmup: 'Warm-up', review: 'Mixed review', free: 'Free practice', probe: 'Delayed recall', crypt: 'Undercroft trial' };

function useCountdown(active, seconds, onEnd) {
  const [left, setLeft] = useState(seconds);
  const endRef = useRef(onEnd); endRef.current = onEnd;
  useEffect(() => {
    if (!active) return undefined;
    setLeft(seconds);
    const start = Date.now();
    const id = setInterval(() => {
      const l = seconds - (Date.now() - start) / 1000;
      if (l <= 0) { clearInterval(id); setLeft(0); endRef.current(); } else setLeft(l);
    }, 250);
    return () => clearInterval(id);
  }, [active, seconds]);
  return left;
}

function TimerBar({ left, total }) {
  return (
    <div className="timer" role="timer" aria-label={`${Math.ceil(left)} seconds left`}>
      <div className="timer-fill" style={{ width: `${Math.max(0, (left / total) * 100)}%` }} />
      <span className="timer-num">{Math.ceil(left)}s</span>
    </div>
  );
}

function focusNext(e) {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const inputs = [...e.currentTarget.closest('.recall').querySelectorAll('input[data-slot]')];
  const i = inputs.indexOf(e.currentTarget);
  if (inputs[i + 1]) inputs[i + 1].focus();
  else e.currentTarget.closest('.recall').querySelector('[data-submit]')?.focus();
}

const inputProps = { autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'off', spellCheck: false };

export default function Drill({ step, isProbe, profile, update, onResult, onContinue, onStart, coach }) {
  const t = step.spec.t;
  const spec = step.spec;
  const items = step.items;
  const n = items.length;
  const mode = recallMode(t, spec);
  const guided = step.role === 'guided' && !isProbe && !['map', 'calc', 'poem'].includes(t) && !spec.skim;
  const [phase, setPhase] = useState('brief');
  const [loci, setLoci] = useState(step.loci || null);
  const [palaceId, setPalaceId] = useState(null);
  const [resp, setResp] = useState(() => (t === 'digits' ? '' : Array(n).fill('')));
  const [gIdx, setGIdx] = useState(0);
  const [note, setNote] = useState('');
  const [mIdx, setMIdx] = useState(0);
  const [result, setResult] = useState(null);
  const timing = useRef({ perItemMs: [] });
  const marks = useRef({});
  const live = useRef(null);

  const order = useMemo(() => {
    const idx = items.map((_, i) => i);
    if (t === 'faces' || (mode === 'cued' && t !== 'major')) return shuffle(idx, rng(step.items.length * 7919 + (items[0]?.face || 3)));
    if (t === 'palace' && spec.reverse) return idx.reverse();
    return idx;
  }, [items]);

  const eligible = (profile.palaces || []).filter((p) => p.loci.length >= n).sort((a, b) => (a.lastUsed || '') < (b.lastUsed || '') ? -1 : 1);
  useEffect(() => { if (t === 'palace' && !loci && eligible[0] && !palaceId) setPalaceId(eligible[0].id); }, [eligible.length]);

  const studySecs = spec.s || 0;
  const startRecall = () => { marks.current.recall = Date.now(); marks.current.item = Date.now(); setPhase('recall'); };
  const endStudy = () => {
    timing.current.studyMs = Date.now() - (marks.current.study || Date.now());
    if (spec.interference && phase === 'study') { setPhase('studyB'); return; }
    startRecall();
  };
  const studyLeft = useCountdown(phase === 'study' && !guided, studySecs, endStudy);
  const bLeft = useCountdown(phase === 'studyB', Math.max(20, Math.round(studySecs / 2)), startRecall);
  // Skim, Pick, Keep (1.1): three steps on one short text
  const skim = step.extra?.skim;
  const [picks, setPicks] = useState([]);
  const skimLeft = useCountdown(phase === 'skim', studySecs || 60, () => setPhase('pick'));
  const keepLeft = useCountdown(phase === 'keep', studySecs || 60, endStudy);
  // Mental Reckoning (1.1): one sum at a time; in hold mode the sum is hidden after a few seconds
  const [parts, setParts] = useState({});
  const [shown, setShown] = useState(true);
  const holdSecs = Math.round(6 + ((spec.level || 1) - 1) * 1.2);
  useEffect(() => {
    if (phase !== 'recall' || t !== 'calc' || items[mIdx]?.mode !== 'hold') return undefined;
    setShown(true);
    const id = setTimeout(() => setShown(false), holdSecs * 1000);
    return () => clearTimeout(id);
  }, [phase, mIdx]);
  const recallLimit = spec.timed ? Math.max(45, n * 5) : 0;
  const recallLeft = useCountdown(phase === 'recall' && !!spec.timed && t !== 'major', recallLimit, () => submit(true));

  useEffect(() => {
    const msg = { study: 'Study phase started', studyB: 'Now study list B', recall: 'Recall phase', feedback: result ? `Result: ${result.correct} of ${result.n}` : '' }[phase];
    if (live.current && msg) live.current.textContent = msg;
    if (phase === 'recall') setTimeout(() => { window.scrollTo(0, 0); document.querySelector('.recall input')?.focus({ preventScroll: true }); }, 30);
  }, [phase]);

  function begin() {
    if (t === 'palace' && !loci) {
      const pal = profile.palaces.find((p) => p.id === palaceId);
      if (!pal) return;
      setLoci(pal.loci.slice(0, n));
      update((p) => { const x = p.palaces.find((q) => q.id === pal.id); if (x) x.lastUsed = new Date().toISOString(); });
    }
    onStart?.();
    if (isProbe || t === 'major' || t === 'calc') { startRecall(); return; }
    marks.current.study = Date.now();
    setPhase(spec.skim ? 'skim' : 'study');
  }

  function submit(timedOut = false) {
    if (phase !== 'recall') return;
    timing.current.recallMs = Date.now() - (marks.current.recall || Date.now());
    const responses = t === 'digits' ? String(resp).replace(/\D/g, '').split('') : resp;
    const res = scoreDrill(t, items, responses, { spec, timedOut });
    setResult(res);
    setPhase('feedback');
    onResult(res, timing.current, { loci });
  }

  function majorNext(v) {
    const now = Date.now();
    timing.current.perItemMs.push(now - marks.current.item);
    marks.current.item = now;
    const next = resp.slice(); next[mIdx] = v; setResp(next);
    if (mIdx + 1 < n) setMIdx(mIdx + 1);
    else {
      sfx.soft();
      timing.current.recallMs = Date.now() - marks.current.recall;
      const res = scoreDrill(t, items, next, { spec });
      setResult(res); setPhase('feedback');
      onResult(res, timing.current, { loci });
    }
  }

  function calcNext(final, partial) {
    const now = Date.now();
    timing.current.perItemMs.push(now - marks.current.item);
    marks.current.item = now;
    const next = resp.slice(); next[mIdx] = final; setResp(next);
    setParts({ ...parts, [mIdx]: partial });
    if (mIdx + 1 < n) setMIdx(mIdx + 1);
    else {
      sfx.soft();
      timing.current.recallMs = Date.now() - marks.current.recall;
      const res = scoreDrill(t, items, next, { spec });
      setResult(res); setPhase('feedback');
      onResult(res, timing.current, { loci });
    }
  }

  const label = (i) => (t === 'palace' && loci ? loci[i] : `${i + 1}`);
  const header = (
    <div className="drill-head">
      <span className="tag">{ROLE_LABEL[isProbe ? 'probe' : step.role]}</span>
      <h2>{TEMPLATE_NAME[t]}{spec.reverse ? ' (reverse)' : ''}{variantLabel(spec)}</h2>
      <span className="muted small">{SKILLS[step.skill]?.name} · {n} items{!isProbe && step.level ? ` · level ${step.level}` : ''}{spec.timed ? ' · timed' : ''}</span>
    </div>
  );

  // ---------- BRIEF ----------
  if (phase === 'brief') {
    const needPalace = t === 'palace' && !loci && !eligible.length;
    return (
      <section className="card drill brief">
        {header}
        <div aria-live="polite" className="sr-only" ref={live} />
        {coach && <p className="note coach-wren"><Portrait id="wren" mood="smile" scale={1} /><span><b>Wren:</b> {coach}</span></p>}
        {isProbe && step.echo ? (
          <p>An echo of floor {step.echoFrom}. No studying this time: write what you still hold from that chamber.</p>
        ) : isProbe ? (
          <p>No studying this time. You learned this set on {step.created}. Just write down whatever you can still remember. Don't worry about the gaps: they show us exactly what to review next.{items[0]?.flipped ? ' Today the words are asked the other way round from how you studied them, which is a stronger test.' : ''}</p>
        ) : <p>{t === 'vocab' ? vocabBrief(spec) : BRIEF[t]}</p>}
        {!isProbe && spec.alike && <p className="note">Some of these words look nearly the same. Give each look-alike its own colour or its own room, so they do not blur together.</p>}
        {!isProbe && isLangSpec(spec) && <p className="muted small">{VOCAB_HONEST}</p>}
        {!isProbe && ABSTRACT_BRIEF[spec.src] && <p className="note">{ABSTRACT_BRIEF[spec.src]}</p>}
        {!isProbe && spec.src === 'formulas' && SYMBOL_PICS.some(([id]) => artFor(id)) && (
          <ul className="symbol-strip" aria-label="Symbol pictures">{SYMBOL_PICS.filter(([id]) => artFor(id)).map(([id, sym]) => <li key={id}><ArtImg id={id} /><b>{sym}</b></li>)}</ul>
        )}
        {!isProbe && ABSTRACT_HONEST[spec.src] && <p className="muted small">{ABSTRACT_HONEST[spec.src]}</p>}
        {t === 'faces' && spec.lures > 0 && !isProbe && <p className="note">{BRIEF.facesLures}</p>}
        {t === 'faces' && spec.restyle && !isProbe && <p className="note">{BRIEF.facesRestyle}</p>}
        {t === 'faces' && spec.turn && !isProbe && <p className="note">{BRIEF.facesTurn}</p>}
        {!isProbe && spec.skim && <p className="note">{BRIEF.skim}</p>}
        {!isProbe && spec.peg && <p className="note">{BRIEF.peg} {PEG_HONEST}</p>}
        {!isProbe && spec.numbered && <p className="note">{BRIEF.numbered}</p>}
        {!isProbe && spec.surname && <p className="note">{BRIEF.surname}</p>}
        {!isProbe && spec.group && <p className="note">{SPEC_NOTE.group}</p>}
        {!isProbe && step.extra?.title && items.some((x) => x.text) && <p className="note">{SPEC_NOTE.src}</p>}
        {!isProbe && spec.src === 'body' && <p className="note">{SPEC_NOTE.body}</p>}
        {!isProbe && POOL_NOTES[spec.src] && spec.src !== 'body' && <p className="note">{POOL_NOTES[spec.src]}</p>}
        {!isProbe && t === 'map' && <p className="note">{MAP_HONEST}</p>}
        {!isProbe && t === 'poem' && step.extra?.poem?.learn && <details className="about-more"><summary>How to learn a poem like this</summary><p className="small">{step.extra.poem.learn}</p></details>}
        {spec.interference && !isProbe && <p className="note">Tricky one: after the first list, you will see a second list too. But you will only be asked for the first one. Try to keep them in separate places in your mind.</p>}
        {!isProbe && studySecs > 0 && t !== 'major' && t !== 'calc' && !guided && <p className="muted small">You have {studySecs} seconds to study. If you are ready sooner, you can finish early.</p>}
        {guided && <p className="note">Guided practice: the items come one at a time, with no clock running. If you like, type a few words describing the picture you made. It is optional, but people who do it tend to remember more.</p>}
        {t === 'major' && (
          <details className="major-code" open={step.level <= 2 || guided}>
            <summary>Sound code</summary>
            <div className="code-grid">{MAJOR_CODE.map(([d, s]) => <div key={d}><b>{d}</b> {s}</div>)}</div>
            {(guided || step.level <= 2) && <div className="code-grid small">{items.map((it, i) => <div key={i}><b>{it.cue}</b> {it.answer}</div>)}</div>}
          </details>
        )}
        {t === 'palace' && !loci && (needPalace ? (
          <div className="note">
            <p>This drill needs a palace with at least {n} stops. Build one now from a place you know well.</p>
            <PalaceEditor minLoci={n} onSave={(pal) => { update((p) => { p.palaces.push(pal); if (pal.loci.length >= 10) p.achievements.cornerstone = p.achievements.cornerstone || new Date().toISOString().slice(0, 10); }); setPalaceId(pal.id); }} />
          </div>
        ) : (
          <label className="field">Palace
            <select value={palaceId || ''} onChange={(e) => setPalaceId(e.target.value)}>
              {eligible.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.loci.length} stops)</option>)}
            </select>
          </label>
        ))}
        {t === 'palace' && loci && isProbe && <p className="muted small">Walk the same stops: {loci.slice(0, 3).join(', ')}…</p>}
        <button className="btn primary" autoFocus disabled={t === 'palace' && !loci && !palaceId} onClick={begin}>{isProbe || t === 'major' || t === 'calc' ? 'Begin recall' : spec.skim ? 'Begin skimming' : 'Begin study'}</button>
      </section>
    );
  }

  // ---------- STUDY (guided: one at a time) ----------
  if (phase === 'study' && guided) {
    const it = items[gIdx];
    if (it?.lure) { setTimeout(() => (gIdx + 1 < n ? setGIdx(gIdx + 1) : endStudy()), 0); return null; }
    return (
      <section className="card drill stimulus" data-quiet>
        {header}
        <div className="guided-item">
          <span className="muted small num">{gIdx + 1} of {n}</span>
          {t === 'faces' ? <><PixelFace seed={it.face} size={48} scale={4} /><div className="big">{it.answer}</div></> :
            t === 'digits' ? <div className="big mono">{items.slice(gIdx, gIdx + 2).map((x) => x.answer).join('')}</div> :
              <div className="big">{it.text && ABSTRACT_BRIEF[spec.src] ? (it.formula ? it.text : markKey(it.text, it.joke ? it.key[0] : it.answer)) : it.cue ? <>{it.cue} <span className="arrow">→</span> {it.answer}</> : <>{t === 'palace' && loci ? <span className="locus">{loci[gIdx]}: </span> : null}{it.answer}</>}</div>}
          {it.pic && <ArtImg id={it.pic} className="card-pic big-pic" />}
          {t === 'vocab' && it.say && <p className="muted small">Say it: {it.say}</p>}
          {t === 'vocab' && it.hint && <p className="muted small">Keyword idea: {it.hint}</p>}
          <label className="field">Your image (optional)
            <input {...inputProps} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. the anchor smashes through the violin" onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.closest('section').querySelector('[data-next]').click(); }} />
          </label>
        </div>
        <button data-next className="btn primary" onClick={() => {
          setNote('');
          const stepN = t === 'digits' ? 2 : 1;
          if (gIdx + stepN < n) setGIdx(gIdx + stepN); else endStudy();
        }}>{gIdx + (t === 'digits' ? 2 : 1) < n ? 'Next' : 'Done studying'}</button>
      </section>
    );
  }

  // ---------- SKIM, PICK, KEEP ----------
  if (phase === 'skim' && skim) {
    return (
      <section className="card drill stimulus" data-quiet>
        {header}
        <p className="muted small">Step 1 of 3: Skim. Headings and first lines are marked.</p>
        <TimerBar left={skimLeft} total={studySecs || 60} />
        <h3>{skim.title}</h3>
        <div className="skim-text">{skim.text.split(/\n\n+/).map((blk, i) => {
          const [head, ...rest] = blk.replace(/^## /, '').split('\n');
          const body = rest.join(' ');
          const first = (body.match(/^.+?[.!?](\s|$)/) || [body])[0];
          return <div key={i}><h4>{head}</h4><p><b className="skim-first">{first}</b>{body.slice(first.length)}</p></div>;
        })}</div>
        <button className="btn" onClick={() => setPhase('pick')}>I have skimmed it</button>
      </section>
    );
  }
  if (phase === 'pick' && skim) {
    const toggle = (i) => setPicks(picks.includes(i) ? picks.filter((x) => x !== i) : picks.length < 5 ? [...picks, i] : picks);
    return (
      <section className="card drill recall" data-quiet>
        {header}
        <p className="muted small">Step 2 of 3: Pick. Choose up to five sentences that are the key points of the text. You picked {picks.length} of 5.</p>
        <ul className="pick-list">{skim.candidates.map((c, i) => (
          <li key={i}><label><input type="checkbox" checked={picks.includes(i)} onChange={() => toggle(i)} aria-label={c} /> <span>{c}</span></label></li>
        ))}</ul>
        <button className="btn primary" onClick={() => { marks.current.study = Date.now(); setPhase('keep'); }}>Check my picks</button>
      </section>
    );
  }
  if (phase === 'keep' && skim) {
    const found = skim.keyPoints.filter((k) => picks.some((i) => skim.candidates[i] === k)).length;
    return (
      <section className="card drill stimulus" data-quiet>
        {header}
        <p className="muted small">Step 3 of 3: Keep. You found {found} of {skim.keyPoints.length} key points. This is shown for interest and does not change any score. Give each key point one picture, then write one key word for each heading.</p>
        <TimerBar left={keepLeft} total={studySecs || 60} />
        <ul className="step-list">{skim.headings.map((h, i) => (
          <li key={i}><b>{h}</b>: {markKey(skim.keyPoints[i], items[i]?.answer)} {picks.some((x) => skim.candidates[x] === skim.keyPoints[i]) ? <span className="muted small">(you picked this)</span> : null}</li>
        ))}</ul>
        <p className="muted small">{SKIM_HONEST}</p>
        <button className="btn" onClick={endStudy}>I'm ready</button>
      </section>
    );
  }

  // ---------- STUDY ----------
  if (phase === 'study' || phase === 'studyB') {
    const listB = phase === 'studyB';
    const showItems = listB ? step.extra.listB.map((w) => ({ answer: w })) : items.filter((it) => !it.lure);
    return (
      <section className="card drill stimulus" data-quiet>
        {header}
        <div aria-live="polite" className="sr-only" ref={live} />
        <TimerBar left={listB ? bLeft : studyLeft} total={listB ? Math.max(20, Math.round(studySecs / 2)) : studySecs} />
        {listB && <p className="note">List B. Study these too. You will be asked for list A.</p>}
        {!listB && items[0]?.dg && <Diagram id={items[0].dg} labels />}
        {t === 'map' ? (
          <MapTree map={step.extra?.map || mapFromItems(items)} />
        ) : t === 'poem' ? (
          <div className="poem-card">
            {step.extra?.poem && <p><b>{step.extra.poem.title}</b> <span className="muted">by {step.extra.poem.author}</span></p>}
            <ol className="poem-lines">{showItems.map((it, i) => <li key={i}>{it.answer}</li>)}</ol>
          </div>
        ) : t === 'digits' ? (
          <DigitBlock digits={showItems.map((x) => x.answer).join('')} spec={spec} />
        ) : t === 'faces' ? (
          <div className="face-grid">{showItems.map((it, i) => <figure key={i}><PixelFace seed={it.face} size={48} scale={3} /><figcaption>{it.answer}</figcaption></figure>)}</div>
        ) : showItems.some((it) => it.text) ? (
          <>
            {step.extra?.title && <p className="muted">{step.extra.title}</p>}
            <ol className="step-list">{showItems.map((it, i) => <li key={i} className={it.pic && artFor(it.pic) ? 'with-pic' : undefined}>{it.pic && <ArtImg id={it.pic} className="card-pic" />}<span>{it.formula ? it.text : markKey(it.text, it.joke ? it.key[0] : it.answer)}</span></li>)}</ol>
          </>
        ) : mode === 'cued' ? (
          <ul className="pair-list">{showItems.map((it, i) => <li key={i}><span>{it.cue}</span><span className="arrow">→</span><b>{it.answer}</b>{it.say ? <span className="muted small"> ({it.say})</span> : null}</li>)}</ul>
        ) : (
          <ol className={`word-grid ${t === 'palace' ? 'palace' : ''} ${mode === 'free' ? 'unordered' : ''}`}>
            {showItems.map((it, i) => <li key={i}>{t === 'palace' && loci && !listB ? <><span className="locus">{loci[i]}</span><b>{it.answer}</b></> : <><b>{it.answer}</b>{it.say ? <span className="muted small"> ({it.say})</span> : null}</>}</li>)}
          </ol>
        )}
        <button className="btn" onClick={listB ? startRecall : endStudy}>I'm ready</button>
      </section>
    );
  }

  // ---------- RECALL ----------
  if (phase === 'recall') {
    if (t === 'major') {
      const it = items[mIdx];
      return (
        <section className="card drill recall" data-quiet>
          {header}
          <p className="muted small">{mIdx + 1} of {n}. Type your image word and press Enter.</p>
          <div className="big mono center">{it.cue}</div>
          <input key={mIdx} data-slot autoFocus {...inputProps} aria-label={`Image word for ${it.cue}`} onKeyDown={(e) => { if (e.key === 'Enter') majorNext(e.currentTarget.value); }} />
          <button data-submit className="btn primary" onClick={(e) => majorNext(e.currentTarget.parentElement.querySelector('input').value)}>Next</button>
        </section>
      );
    }
    if (t === 'calc') {
      const it = items[mIdx];
      const hold = it.mode === 'hold';
      const go = (e) => {
        const box = e.currentTarget.closest('section');
        calcNext(box.querySelector('input[data-slot]').value, [...box.querySelectorAll('input[data-part]')].map((x) => x.value));
      };
      return (
        <section className="card drill recall" data-quiet>
          {header}
          <p className="muted small">{mIdx + 1} of {n}. {hold ? `The sum is shown for ${holdSecs} seconds, then hidden. Hold it, work it out and type the final answer.` : 'Work left to right. Type the final answer and press Enter.'}</p>
          <div className="big mono center" aria-label={hold && !shown ? 'The sum is hidden' : `Sum: ${it.cue}`}>{hold && !shown ? '?' : it.cue}</div>
          {it.steps.length > 1 && <div className="calc-steps">{it.steps.slice(0, -1).map((_, k) => <input key={`${mIdx}-${k}`} data-part inputMode="numeric" {...inputProps} aria-label={`Partial result ${k + 1}, not scored`} placeholder={`step ${k + 1}`} />)}</div>}
          <input key={mIdx} data-slot autoFocus inputMode="numeric" {...inputProps} aria-label={`Final answer for sum ${mIdx + 1}`} placeholder="final answer" onKeyDown={(e) => { if (e.key === 'Enter') go(e); }} />
          <button data-submit className="btn primary" onClick={go}>Next</button>
        </section>
      );
    }
    const set = (i, v) => { const next = resp.slice(); next[i] = v; setResp(next); };
    if (t === 'map') {
      const branches = mapBranches(items);
      const centre = step.extra?.map?.center || items[0]?.center;
      return (
        <section className="card drill recall" data-quiet>
          {header}
          <div aria-live="polite" className="sr-only" ref={live} />
          <p className="muted small">Rebuild the map. Write the leaves under each branch, in any order. The number of boxes is the number of leaves.</p>
          {centre && <p className="mm-centre"><b>{centre}</b></p>}
          <div className="mm-recall">{branches.map((b) => (
            <fieldset key={b.label} className="mm-branch"><legend>{b.label} <span className="muted small">({b.idx.length} leaves)</span></legend>
              {b.idx.map((i, k) => <input key={i} data-slot {...inputProps} aria-label={`Leaf ${k + 1} of ${b.idx.length} under ${b.label}`} value={resp[i]} onChange={(e) => set(i, e.target.value)} onKeyDown={focusNext} />)}
            </fieldset>
          ))}</div>
          <button data-submit data-sfx="soft" className="btn primary" onClick={() => submit(false)}>Check answers</button>
        </section>
      );
    }
    return (
      <section className="card drill recall" data-quiet>
        {header}
        <div aria-live="polite" className="sr-only" ref={live} />
        {spec.timed && <TimerBar left={recallLeft} total={recallLimit} />}
        {spec.interference && <p className="note">Recall list A, the first list.</p>}
        {items[0]?.dg && <Diagram id={items[0].dg} />}
        {t === 'digits' ? (
          <label className="field">Type all {n} digits
            <input data-slot className="mono digits-in" inputMode="numeric" maxLength={n + 20} {...inputProps} value={resp} onChange={(e) => setResp(e.target.value)} onKeyDown={focusNext} />
          </label>
        ) : t === 'faces' ? (
          <div className="face-grid">{order.map((i, k) => {
            const it = items[i];
            const look = it.alter || it.look ? { ...(it.look || {}), ...(it.alter || {}) } : null;
            const anyLures = items.some((x) => x.lure);
            return (
              <figure key={i}>
                <PixelFace seed={it.face} look={look} turn={it.turn || 0} size={48} scale={3} label={`Face ${k + 1}`} />
                <input data-slot {...inputProps} placeholder={spec.surname ? 'First Last' : undefined} aria-label={`Name for face ${k + 1}`} value={resp[i]} onChange={(e) => set(i, e.target.value)} onKeyDown={focusNext} />
                {anyLures && <button type="button" className={`btn tiny${resp[i] === LURE_ANSWER ? ' on' : ''}`} aria-pressed={resp[i] === LURE_ANSWER} aria-label={`Not met face ${k + 1}`} onClick={() => set(i, resp[i] === LURE_ANSWER ? '' : LURE_ANSWER)}>Not met</button>}
              </figure>
            );
          })}</div>
        ) : mode === 'cued' ? (
          <ul className="pair-list">{order.map((i) => <li key={i}><span>{items[i].cue}</span><span className="arrow">→</span><input data-slot {...inputProps} aria-label={`Answer for ${items[i].cue}`} value={resp[i]} onChange={(e) => set(i, e.target.value)} onKeyDown={focusNext} /></li>)}</ul>
        ) : mode === 'free' ? (
          <>
            <p className="muted small">Any order. Leave blanks if you are stuck.</p>
            <div className="slot-grid">{resp.map((v, i) => <input key={i} data-slot {...inputProps} aria-label={`Word ${i + 1}`} value={v} onChange={(e) => set(i, e.target.value)} onKeyDown={focusNext} />)}</div>
          </>
        ) : (
          <ol className="slot-list">{order.map((i) => <li key={i}><span className="locus">{label(i)}</span><input data-slot {...inputProps} aria-label={`Item at ${label(i)}`} value={resp[i]} onChange={(e) => set(i, e.target.value)} onKeyDown={focusNext} /></li>)}</ol>
        )}
        <button data-submit data-sfx="soft" className="btn primary" onClick={() => submit(false)}>Check answers</button>
      </section>
    );
  }

  // ---------- FEEDBACK ----------
  const pct = Math.round(result.acc * 100);
  return (
    <section className={`card drill ${result.acc >= 0.9 ? 'gold' : ''}`}>
      {header}
      <div aria-live="polite" className="sr-only" ref={live} />
      <div className="score-row"><span className="score-big">{result.correct}<small>/{result.n}</small></span><span className="muted">{pct}% correct</span></div>
      {items[0]?.dg && <Diagram id={items[0].dg} labels />}
      {isProbe && result.acc < 0.7 && <p className="note">Some of this has faded, which is completely normal. Read the correct answers below slowly and rebuild each picture, a bit stronger this time. This set will come back tomorrow for another try.</p>}
      <ul className="feedback">
        {(t === 'digits' ? [{ target: items.map((x) => x.answer).join(''), response: String(resp), ok: result.acc === 1, summary: true }] : result.perItem).map((x, i) => (
          <li key={i} className={x.ok ? 'ok' : 'miss'}>
            <span className="mark" aria-hidden="true">{x.ok ? '✓' : '–'}</span>
            <span className="locus">{t === 'palace' && loci ? loci[i] : items[i]?.cue || items[i]?.branch || ''}</span>
            {t === 'faces' && <PixelFace seed={items[i].face} look={items[i].alter || items[i].look ? { ...(items[i].look || {}), ...(items[i].alter || {}) } : null} size={48} scale={1} />}
            {items[i]?.pic && <ArtImg id={items[i].pic} className="card-pic tiny-pic" />}
            <b>{t === 'faces' && items[i].lure ? 'A stranger (not met)' : x.target}</b>
            {t === 'faces' && <span className="muted small face-keys">{items[i].lure ? `Looked like someone you met, but with ${describeAlter(items[i].alter)}.` : `Key features: ${describeFace(faceParams(items[i].face))}`}</span>}
            {!x.ok && <span className="muted small">{x.response ? `you wrote “${x.response}”` : 'blank'}{x.err && x.err !== 'omission' ? ` · ${x.err}` : ''}</span>}
            {t === 'faces' && spec.surname && x.parts && <span className="muted small">{x.parts[0] ? 'first name right' : 'first name missed'}, {x.parts[1] ? 'surname right' : 'surname missed'}</span>}
            {t === 'calc' && items[i]?.steps?.length > 0 && <span className="muted small">steps: {items[i].steps.join(', then ')}</span>}
            {t === 'vocab' && isLangSpec(spec) && !spec.sounds && <HearIt code={spec.lang} word={String(spec.dir === 'produce' ? x.target : items[i]?.cue || '').replace(/^(el|la|los|las)\s+/i, (m) => m)} />}
            {spec.abstract && SOUNDALIKE[x.target] && <span className="muted small">Sound-alike idea: {SOUNDALIKE[x.target][0]}. {SOUNDALIKE[x.target][1]}.</span>}
            <span className="sr-only">{x.ok ? 'correct' : 'missed'}</span>
          </li>
        ))}
      </ul>
      {t === 'digits' && <p className="muted small">{result.correct} of {n} digits in the right position.</p>}
      {spec.abstract && <p className="muted small">{SOUND_HONEST}</p>}
      {t === 'calc' && result.acc >= 0.9 && timing.current.recallMs > 0 && <p className="muted small">Time for these {n} sums: {Math.round(timing.current.recallMs / 1000)} seconds. Shown for interest. Time never lowers the score.</p>}
      {t === 'calc' && <p className="muted small">Mental Reckoning trains these particular steps on these kinds of sums. It does not make you quick at mathematics in general. It earns no Lumen and changes no skill estimate.</p>}
      <ContinueBtn onClick={onContinue} />
    </section>
  );
}

const ALTER_WORDS = { nose: 'a different nose', eyeShape: 'different eyes', faceShape: 'a different face shape', mouth: 'a different mouth', browShape: 'different brows', mole: 'a mole added or gone' };
function describeAlter(a) { return Object.keys(a || {}).map((k) => ALTER_WORDS[k] || k).join(' and ') || 'small changes'; }

// Focus arrives a moment later so an Enter used to submit the last answer cannot also skip the results.
function ContinueBtn({ onClick }) {
  const ref = useRef(null);
  useEffect(() => { const id = setTimeout(() => ref.current?.focus(), 350); return () => clearTimeout(id); }, []);
  return <button ref={ref} className="btn primary" onClick={onClick}>Continue</button>;
}

// ---------- 1.1 helpers ----------
const VARIANT_WORD = { shape: 'shape pegs', rhyme: 'rhyme pegs' };
function variantLabel(spec) {
  if (spec.unit) return ' (Unit Check, Form ' + spec.form + ')';
  if (spec.peg) return ` (${VARIANT_WORD[spec.peg] || 'pegs'})`;
  if (spec.skim) return ' (Skim, Pick, Keep)';
  if (spec.numbered) return ' (numbered)';
  if (spec.surname) return ' (first names and surnames)';
  if (isLangSpec(spec)) {
    const bits = [langName(spec)];
    if (spec.sounds) bits.push('sounds only');
    else if (spec.src === 'phrases') bits.push('phrases');
    if (spec.dir === 'produce') bits.push('meaning to word');
    if (spec.gender) bits.push('with el or la');
    if (spec.alike) bits.push('look-alikes');
    return ` (${bits.join(', ')})`;
  }
  if (spec.kind === 'people') return ' (people)';
  if (spec.src === 'grocery') return ' (shopping list)';
  if (spec.src === 'steps') return ' (steps)';
  if (spec.src === 'points') return ' (talk points)';
  if (spec.src === 'body') return ' (study terms)';
  if (spec.src && { formulas: 1, dates: 1, trivia: 1, wonders: 1, jokes: 1, diagram: 1 }[spec.src]) return ` (${{ formulas: 'formulae', dates: 'historical dates', trivia: 'general knowledge', wonders: 'surprising facts', jokes: 'jokes', diagram: 'labelled diagram' }[spec.src]})`;
  if (['atlas', 'elements', 'roots', 'music', 'chess'].includes(spec.src)) return ` (${{ atlas: 'capitals', elements: 'elements', roots: 'word roots', music: 'music theory', chess: 'chess openings' }[spec.src]})`;
  return '';
}

// A sentence with its key word marked.
function markKey(text, key) {
  const i = key ? String(text).toLowerCase().indexOf(String(key).toLowerCase()) : -1;
  if (i < 0) return text;
  return <>{text.slice(0, i)}<mark className="key">{text.slice(i, i + key.length)}</mark>{text.slice(i + key.length)}</>;
}

// Digits in groups (or in rows of 20 for event mode). Display only.
function DigitBlock({ digits, spec }) {
  if (spec.rows) {
    const rows = digits.match(new RegExp(`.{1,${DIGIT_ROW}}`, 'g')) || [];
    return <div className="digits mono rows">{rows.map((r, i) => <div key={i} className="digit-row"><span className="muted small">Row {i + 1}</span>{groupDigits(r, 4).map((g, k) => <span key={k}>{g}</span>)}</div>)}</div>;
  }
  return <div className="digits mono">{groupDigits(digits, spec.group || 2).map((g, i) => <span key={i}>{g}</span>)}</div>;
}

function mapFromItems(items) {
  return { center: items[0]?.center || '', branches: mapBranches(items).map((b) => ({ label: b.label, leaves: b.idx.map((i) => items[i].show || items[i].answer) })) };
}

// A still tree drawn with plain boxes, and the same map as a nested list for screen readers.
function MapTree({ map }) {
  return (
    <div className="mm">
      <div className="mm-visual" aria-hidden="true">
        <div className="mm-centre"><b>{map.center}</b></div>
        <div className="mm-branches">{map.branches.map((b) => (
          <div key={b.label} className="mm-branch"><span className="mm-label">{b.label}</span>
            <ul>{b.leaves.map((l) => <li key={l}>{l}</li>)}</ul></div>
        ))}</div>
      </div>
      <ul className="sr-only"><li>{map.center}<ul>{map.branches.map((b) => <li key={b.label}>{b.label}<ul>{b.leaves.map((l) => <li key={l}>{l}</li>)}</ul></li>)}</ul></li></ul>
    </div>
  );
}
