import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TEMPLATE_NAME, SKILLS } from '../data/curriculum.js';
import { MAJOR_CODE } from '../data/content.js';
import { recallMode, scoreDrill, LURE_ANSWER } from '../engine/core.js';
import { describeFace, faceParams } from '../pixel/faces.js';
import { shuffle, rng } from '../engine/util.js';
import { PixelFace, Portrait } from '../pixel/Faces.jsx';
import { PalaceEditor } from './Palaces.jsx';
import { sfx } from '../audio/sfx.js';

const BRIEF = {
  wordlist: 'You will see a list of words. For each one, make a clear, vivid picture in your mind: something you could almost touch. When the time is up, write down as many as you can remember, in any order. Don\'t worry about spelling.',
  chain: 'You will see a list of words in order. Link them into a little story: the first picture does something to the second, the second to the third, and so on. Afterwards, you will write them back in the same order.',
  pairs: 'You will see pairs of words. For each pair, make the first picture do something to the second, so they are touching or crashing together. Later you will see only the first word and need to remember its partner.',
  palace: 'Each item will be shown next to a stop on your palace route. Put the picture at that stop and make it do something to the place: break it, soak it, sit on it. Then you will walk the route in your mind and say what you find at each stop.',
  digits: 'You will see a long number. From Month 4 you will turn each pair of digits into a picture with the Major System. Until then, use any method you like: rhythm, patterns, dates, anything that helps.',
  major: 'Each number has a sound code. For each number shown, type the picture word you use for it, as quickly as you can, then press Enter. Any word whose consonant sounds spell out the number counts as correct.',
  faces: 'You will meet some people. For each one, pick a feature that won\'t change, turn their name into a picture, and stick the picture onto that feature. Later the faces come back in a different order, and you write each name.',
  facesLures: 'Careful: when the faces come back, one or two will be strangers who look like someone you met. Check the feature you chose. If you have not met them, press "Not met".',
  facesRestyle: 'People change their hair, glasses and clothes. At recall they may look different, so anchor each name on the face itself: the nose, the eyes, the shape of the jaw.',
  vocab: 'You will see words in Swahili with their meanings. For each one, find something it sounds like in English and make that picture act on the meaning. Later you will see the Swahili word and type what it means.',
  facts: 'You will see questions with their answers. Make a picture for the question and a picture for the answer, and make them interact. Later you will see each question and type the answer.',
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
  const guided = step.role === 'guided' && !isProbe;
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
    if (isProbe || t === 'major') { startRecall(); return; }
    marks.current.study = Date.now();
    setPhase('study');
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

  const label = (i) => (t === 'palace' && loci ? loci[i] : `${i + 1}`);
  const header = (
    <div className="drill-head">
      <span className="tag">{ROLE_LABEL[isProbe ? 'probe' : step.role]}</span>
      <h2>{TEMPLATE_NAME[t]}{spec.reverse ? ' (reverse)' : ''}</h2>
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
          <p>No studying this time. You learned this set on {step.created}. Just write down whatever you can still remember. Don't worry about the gaps: they show us exactly what to review next.</p>
        ) : <p>{BRIEF[t]}</p>}
        {t === 'faces' && spec.lures > 0 && !isProbe && <p className="note">{BRIEF.facesLures}</p>}
        {t === 'faces' && spec.restyle && !isProbe && <p className="note">{BRIEF.facesRestyle}</p>}
        {spec.interference && !isProbe && <p className="note">Tricky one: after the first list, you will see a second list too. But you will only be asked for the first one. Try to keep them in separate places in your mind.</p>}
        {!isProbe && studySecs > 0 && t !== 'major' && !guided && <p className="muted small">You have {studySecs} seconds to study. If you are ready sooner, you can finish early.</p>}
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
        <button className="btn primary" autoFocus disabled={t === 'palace' && !loci && !palaceId} onClick={begin}>{isProbe || t === 'major' ? 'Begin recall' : 'Begin study'}</button>
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
              <div className="big">{it.cue ? <>{it.cue} <span className="arrow">→</span> {it.answer}</> : <>{t === 'palace' && loci ? <span className="locus">{loci[gIdx]}: </span> : null}{it.answer}</>}</div>}
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
        {t === 'digits' ? (
          <div className="digits mono">{showItems.map((x) => x.answer).join('').match(/.{1,2}/g).map((g, i) => <span key={i}>{g}</span>)}</div>
        ) : t === 'faces' ? (
          <div className="face-grid">{showItems.map((it, i) => <figure key={i}><PixelFace seed={it.face} size={48} scale={3} /><figcaption>{it.answer}</figcaption></figure>)}</div>
        ) : mode === 'cued' ? (
          <ul className="pair-list">{showItems.map((it, i) => <li key={i}><span>{it.cue}</span><span className="arrow">→</span><b>{it.answer}</b></li>)}</ul>
        ) : (
          <ol className={`word-grid ${t === 'palace' ? 'palace' : ''} ${mode === 'free' ? 'unordered' : ''}`}>
            {showItems.map((it, i) => <li key={i}>{t === 'palace' && loci && !listB ? <><span className="locus">{loci[i]}</span><b>{it.answer}</b></> : <b>{it.answer}</b>}</li>)}
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
    const set = (i, v) => { const next = resp.slice(); next[i] = v; setResp(next); };
    return (
      <section className="card drill recall" data-quiet>
        {header}
        <div aria-live="polite" className="sr-only" ref={live} />
        {spec.timed && <TimerBar left={recallLeft} total={recallLimit} />}
        {spec.interference && <p className="note">Recall list A, the first list.</p>}
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
                <PixelFace seed={it.face} look={look} size={48} scale={3} label={`Face ${k + 1}`} />
                <input data-slot {...inputProps} aria-label={`Name for face ${k + 1}`} value={resp[i]} onChange={(e) => set(i, e.target.value)} onKeyDown={focusNext} />
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
      {isProbe && result.acc < 0.7 && <p className="note">Some of this has faded, which is completely normal. Read the correct answers below slowly and rebuild each picture, a bit stronger this time. This set will come back tomorrow for another try.</p>}
      <ul className="feedback">
        {(t === 'digits' ? [{ target: items.map((x) => x.answer).join(''), response: String(resp), ok: result.acc === 1, summary: true }] : result.perItem).map((x, i) => (
          <li key={i} className={x.ok ? 'ok' : 'miss'}>
            <span className="mark" aria-hidden="true">{x.ok ? '✓' : '–'}</span>
            <span className="locus">{t === 'palace' && loci ? loci[i] : items[i]?.cue || (t === 'faces' ? '' : '')}</span>
            {t === 'faces' && <PixelFace seed={items[i].face} look={items[i].alter || items[i].look ? { ...(items[i].look || {}), ...(items[i].alter || {}) } : null} size={48} scale={1} />}
            <b>{t === 'faces' && items[i].lure ? 'A stranger (not met)' : x.target}</b>
            {t === 'faces' && <span className="muted small face-keys">{items[i].lure ? `Looked like someone you met, but with ${describeAlter(items[i].alter)}.` : `Key features: ${describeFace(faceParams(items[i].face))}`}</span>}
            {!x.ok && <span className="muted small">{x.response ? `you wrote “${x.response}”` : 'blank'}{x.err && x.err !== 'omission' ? ` · ${x.err}` : ''}</span>}
            <span className="sr-only">{x.ok ? 'correct' : 'missed'}</span>
          </li>
        ))}
      </ul>
      {t === 'digits' && <p className="muted small">{result.correct} of {n} digits in the right position.</p>}
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
