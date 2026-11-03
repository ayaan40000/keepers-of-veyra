// 1.1 Your Own Text. The player's own text, cut into sections, learned in four still steps, and checked again after
// 1, 7, 30, 90 and 180 days. Still screens: no animation, no sound except the one soft submit sound.
// Text is only ever rendered as plain text nodes (never HTML, never a link).
import React, { useRef, useState } from 'react';
import { PxIcon } from './game/PxIcon.jsx';
import { sfx } from '../audio/sfx.js';
import { today } from '../engine/core.js';
import { gateDone } from '../engine/guide.js';
import { OWN, ownCheckLine } from '../data/owntext.js';
import {
  CAPS, SITTING_MAX, NEW_PER_DAY, chunk, joinSections, splitSection, renumber, draftError, newText, rolesOf, speakers, hiddenMask,
  askedPart, firstLetters, lineStart, stagesFor, checkLine, missingNote, isNoSpace, recordCheck, sitting, dueSections, minutesFor,
  sectionCounts, startedToday, buildTextsExport, importTexts,
} from '../engine/owntext.js';

function saveText(name, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

const lineProps = (text) => ({ dir: text.dir === 'auto' ? 'auto' : text.dir, lang: text.lang || undefined });

// ---------- Today and Field Guide entry points ----------
export function OwnTextCard({ profile, onOpen }) {
  const n = dueSections(profile.own || { texts: [] }, today(profile)).length;
  if (!n) return null;
  return (
    <section className="card glass" data-testid="own-text-card">
      <h3 className="panel-title"><PxIcon name="quill" size={28} />Your Own Text</h3>
      <p className="small">{ownCheckLine(Math.min(n, SITTING_MAX), minutesFor(n))}</p>
      <p className="muted small">Optional. It never blocks the day and never counts against your streak.</p>
      <button className="btn" onClick={onOpen}>Open Your Shelf</button>
    </section>
  );
}

export function OwnTextEntry({ profile, onOpen }) {
  const open = gateDone(profile, 'M1') || !!profile.progress.reviewerUnlock;
  const n = profile.own?.texts?.length || 0;
  return (
    <section className="card" data-testid="own-text-entry">
      <h3 className="panel-title"><PxIcon name="quill" size={28} />{OWN.shelf}</h3>
      <p className="small">{OWN.intro}</p>
      {open ? <button className="btn" onClick={onOpen}>{n ? `Open Your Shelf (${n} text${n > 1 ? 's' : ''})` : 'Open Your Shelf'}</button> : <p className="small muted">{OWN.gate}</p>}
    </section>
  );
}

// ---------- one section, checked ----------
function CheckOne({ profile, update, text, sec, learning, onDone }) {
  const date = today(profile);
  const mask = hiddenMask(text, sec);
  const sp = text.roleMode ? speakers(sec.lines) : sec.lines.map((l) => ({ body: l, label: '' }));
  const said = text.mode === 'said';
  const [ans, setAns] = useState({});
  const [left, setLeft] = useState({});
  const [peeked, setPeeked] = useState({});
  const [ask, setAsk] = useState(null);
  const [shown, setShown] = useState(false);
  const [marks, setMarks] = useState({});
  const [res, setRes] = useState(null);
  const asked = sec.lines.map((_, i) => i).filter((i) => mask[i]);
  const noSpace = sec.lines.some((l) => isNoSpace(l));

  const finish = (lineOk, notes) => {
    const results = asked.map((i) => !!lineOk[i]);
    sfx.soft();
    let out = null;
    update((p) => { out = recordCheck(p, text.id, sec.id, results, { date, typed: !said }); });
    setRes({ ...out, lineOk, notes });
  };
  const submitTyped = () => {
    const lineOk = {}, notes = {};
    for (const i of asked) {
      if (peeked[i]) { lineOk[i] = false; notes[i] = 'You peeked at this one, so it counts as slipped.'; continue; }
      const r = checkLine(ans[i] || '', sp[i].body, text.exact, text.marks);
      lineOk[i] = r.ok;
      if (!r.ok) notes[i] = missingNote(r.missing, noSpace);
    }
    finish(lineOk, notes);
  };
  const submitSaid = () => finish(Object.fromEntries(asked.map((i) => [i, marks[i] === 'had'])), {});

  if (res) {
    const slipped = asked.filter((i) => !res.lineOk[i]);
    return (
      <div>
        <section className="card" role="status">
          <h3>{res.held} of {res.of} lines held.</h3>
          {learning && !res.started && <p className="small">Not quite yet. Go back to the Line starts or First letters step and try the Blank step again. Nothing is lost.</p>}
          {learning && res.started && <p className="small">This section is on your schedule. First check: {res.due}.</p>}
          {!learning && <p className="small">{res.retired ? 'This section is kept. It will not be asked again.' : `Next check: ${res.due}.`}</p>}
          {res.lumen > 0 && <p className="small note good">A small reward of {res.lumen} Lumen, because this typed check held after a week or more.</p>}
          {slipped.length > 0 && <p className="small">{OWN.slipped}</p>}
          <ol className="own-results">{asked.map((i) => (
            <li key={i} className={res.lineOk[i] ? 'ok' : 'slip'}>
              <b>{res.lineOk[i] ? 'Held' : 'Slipped'}</b>
              <span className="own-line" {...lineProps(text)}> {sp[i].label} {sp[i].body}</span>
              {res.notes[i] && <span className="small muted"> {res.notes[i]}</span>}
            </li>
          ))}</ol>
        </section>
        <button className="btn primary" autoFocus onClick={() => onDone(res)}>{learning && !res.started ? 'Back' : 'Next'}</button>
      </div>
    );
  }

  const rows = sec.lines.map((line, i) => {
    if (!mask[i]) return <p key={i} className="own-line own-cue" {...lineProps(text)}><span className="muted">{sp[i].label}</span> {sp[i].body}</p>;
    if (said) {
      return (
        <div key={i} className="own-ask">
          <p className="own-line" {...lineProps(text)}>{sp[i].label} {shown ? sp[i].body : '...'}</p>
          {shown && (
            <div className="row wrap">
              <button className={`btn small${marks[i] === 'had' ? ' on' : ''}`} aria-pressed={marks[i] === 'had'} onClick={() => setMarks({ ...marks, [i]: 'had' })}>Had it</button>
              <button className={`btn small${marks[i] === 'slip' ? ' on' : ''}`} aria-pressed={marks[i] === 'slip'} onClick={() => setMarks({ ...marks, [i]: 'slip' })}>Slipped</button>
            </div>
          )}
        </div>
      );
    }
    return (
      <div key={i} className="own-ask">
        {i > 0 && left[i - 1] && mask[i - 1] && <p className="own-line own-cue small muted" {...lineProps(text)}>Before this: {sp[i - 1].body}</p>}
        <label className="field">{sp[i].label ? `${sp[i].label} (line ${i + 1})` : `Line ${i + 1}`}
          <input type="text" {...lineProps(text)} dir="auto" className="own-input" autoComplete="off" autoCapitalize="off" spellCheck="false" value={ans[i] || ''} maxLength={CAPS.charsPerLine}
            onChange={(e) => setAns({ ...ans, [i]: e.target.value })} onBlur={() => setLeft({ ...left, [i]: true })} />
        </label>
        {peeked[i] ? <p className="own-line small" {...lineProps(text)}>{sp[i].body}</p> : ask === i ? (
          <p className="small note">{OWN.peek} <button className="btn small" onClick={() => { setPeeked({ ...peeked, [i]: true }); setAsk(null); }}>Show it anyway</button> <button className="btn small ghost" onClick={() => setAsk(null)}>Keep trying</button></p>
        ) : <button className="btn small ghost" onClick={() => setAsk(i)}>Peek</button>}
      </div>
    );
  });

  return (
    <div>
      <section className="card own-card" data-quiet>
        {learning && <p className="small muted">{OWN.steps.blank}</p>}
        {said && !shown && <p className="small">Say this section aloud, from memory. Then tap Show me and mark each line.</p>}
        {rows}
        <div className="row wrap">
          {said ? (shown ? <button className="btn primary" disabled={asked.some((i) => !marks[i])} onClick={submitSaid}>Done</button> : <button className="btn primary" onClick={() => setShown(true)}>Show me</button>)
            : <button className="btn primary" onClick={submitTyped}>Check</button>}
        </div>
      </section>
    </div>
  );
}

// ---------- a sitting of due checks ----------
function Sitting({ profile, update, tired, onExit }) {
  const [items] = useState(() => sitting(profile.own, today(profile), tired));
  const [i, setI] = useState(0);
  const [tally, setTally] = useState({ held: 0, of: 0 });
  const item = items[i];
  const text = item && profile.own.texts.find((t) => t.id === item.textId);
  const sec = text?.sections.find((s) => s.id === item.sectionId);
  if (!item || !sec) {
    return (
      <section className="card gold" role="status">
        <h3>{items.length ? 'Done for now' : 'Nothing is due'}</h3>
        {items.length > 0 && <p>{tally.held} of {tally.of} lines held across {items.length} check{items.length > 1 ? 's' : ''}.</p>}
        {dueSections(profile.own, today(profile)).length > 0 && <p className="small">{tired ? 'The rest can wait.' : 'Three checks a sitting is plenty. The rest can wait.'}</p>}
        <button className="btn primary" autoFocus onClick={onExit}>Back to your shelf</button>
      </section>
    );
  }
  return (
    <div>
      <h2 className="page-title">{text.title}</h2>
      <p className="muted small">Check {i + 1} of {items.length}. Section {sec.id.slice(1)} of {text.sections.length}.</p>
      <CheckOne key={sec.id + text.id} profile={profile} update={update} text={text} sec={sec} learning={false} onDone={(r) => { setTally((t) => ({ held: t.held + r.held, of: t.of + r.of })); setI(i + 1); window.scrollTo(0, 0); }} />
    </div>
  );
}

// ---------- learning one section ----------
function Learn({ profile, update, text, sec, onExit }) {
  const stages = stagesFor(sec);
  const [k, setK] = useState(0);
  const stage = stages[k];
  const mask = hiddenMask(text, sec);
  const sp = text.roleMode ? speakers(sec.lines) : sec.lines.map((l) => ({ body: l, label: '' }));
  const cue = (line, i) => {
    if (stage === 'read' || !mask[i]) return sp[i].body;
    return stage === 'letters' ? firstLetters(sp[i].body) : lineStart(sp[i].body);
  };
  return (
    <div>
      <h2 className="page-title">{text.title}</h2>
      <p className="muted small">Section {sec.id.slice(1)} of {text.sections.length}. Step {k + 1} of {stages.length}: <b>{OWN.stepNames[stage]}</b></p>
      {stage !== 'blank' ? (
        <section className="card own-card" data-quiet>
          <p className="small">{OWN.steps[stage]}</p>
          <div className="own-text">{sec.lines.map((l, i) => <p key={i} className="own-line" {...lineProps(text)}><span className="muted">{sp[i].label}</span> {cue(l, i)}</p>)}</div>
          <div className="row wrap">
            {k > 0 && <button className="btn" onClick={() => setK(k - 1)}>Back a step</button>}
            <button className="btn primary" autoFocus onClick={() => { setK(k + 1); window.scrollTo(0, 0); }}>{k === stages.length - 2 ? 'Try it from nothing' : 'Next step'}</button>
          </div>
        </section>
      ) : <CheckOne key={'b' + k} profile={profile} update={update} text={text} sec={sec} learning onDone={(r) => { if (r.started) onExit(); else setK(Math.max(0, stages.length - 2)); window.scrollTo(0, 0); }} />}
      <button className="btn ghost small" onClick={onExit}>Stop for now</button>
    </div>
  );
}

// ---------- add a text ----------
function Add({ profile, update, onDone, onCancel }) {
  const own = profile.own, date = today(profile);
  const [d, setD] = useState({ title: '', label: '', note: '', raw: '', dir: 'auto', lang: '', exact: 'close', marks: false, mode: 'typed', roleMode: false });
  const [secs, setSecs] = useState(null);
  const [role, setRole] = useState('');
  const [err, setErr] = useState('');
  const set = (k, v) => setD((x) => ({ ...x, [k]: v }));
  const roles = secs ? rolesOf(secs) : [];
  const draft = { ...d, sections: secs || [], role };

  if (secs) {
    const lines = secs.reduce((n, s) => n + s.lines.length, 0);
    return (
      <div>
        <h2 className="page-title">Cut it into pieces</h2>
        <p className="small">{secs.length} section{secs.length > 1 ? 's' : ''}, {lines} lines. Only you know where your text really breaks. Join two sections, or start a new one before any line.</p>
        {d.roleMode && (
          <label className="field">Your role
            <select value={role} onChange={(e) => setRole(e.target.value)}><option value="">Choose a role</option>{roles.map((r) => <option key={r} value={r}>{r}</option>)}</select>
            {!roles.length && <span className="small muted">No speakers found. Start lines with NAME: and go back to edit the text.</span>}
          </label>
        )}
        {secs.map((s, i) => (
          <section key={i} className="card own-card">
            <h4>Section {i + 1}</h4>
            {s.lines.map((l, j) => (
              <div key={j} className="own-split">
                {j > 0 && <button className="btn small ghost" onClick={() => setSecs(renumber(splitSection(secs, i, j)))}>Start a new section here</button>}
                <p className="own-line" {...lineProps(d)}>{l}</p>
              </div>
            ))}
            {i < secs.length - 1 && <button className="btn small" onClick={() => setSecs(renumber(joinSections(secs, i)))}>Join with the next section</button>}
          </section>
        ))}
        {err && <p className="warn" role="alert">{err}</p>}
        <div className="row wrap">
          <button className="btn" onClick={() => { setSecs(null); setErr(''); }}>Back to the text</button>
          <button className="btn primary" onClick={() => {
            const e = draftError(own, draft) || (d.roleMode && !role ? 'Choose your role first.' : '');
            if (e) { setErr(e); return; }
            const t = newText({ ...d, role, sections: secs }, date);
            update((p) => { p.own.texts.push(t); });
            onDone(t.id);
          }}>Save to my shelf</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="page-title">Add a text</h2>
      <p className="small">{OWN.noPersonal}</p>
      <p className="small">{OWN.accuracy}</p>
      <label className="field">Title<input type="text" value={d.title} maxLength={CAPS.title} onChange={(e) => set('title', e.target.value)} /></label>
      <label className="field">Label (optional, for example where it comes from, in your own words)<input type="text" value={d.label} maxLength={CAPS.label} onChange={(e) => set('label', e.target.value)} /></label>
      <label className="field">A note to yourself (optional)<input type="text" value={d.note} maxLength={CAPS.note} onChange={(e) => set('note', e.target.value)} /></label>
      <label className="field">The text<textarea rows={10} dir="auto" value={d.raw} onChange={(e) => set('raw', e.target.value)} aria-describedby="own-add-help" />
        <span id="own-add-help" className="small muted">{OWN.addHelp} Up to {CAPS.charsPerText.toLocaleString('en')} characters.</span>
      </label>
      <label className="check"><input type="checkbox" checked={d.roleMode} onChange={(e) => set('roleMode', e.target.checked)} /> <span>Role mode (lines of a play)</span></label>
      {d.roleMode && <p className="small muted">{OWN.roleHelp}</p>}
      <label className="field">Direction
        <select value={d.dir} onChange={(e) => set('dir', e.target.value)}><option value="auto">Automatic</option><option value="ltr">Left to right</option><option value="rtl">Right to left</option></select>
      </label>
      <label className="field">Language code (optional, such as ar, he, hi, zh, ja)<input type="text" value={d.lang} maxLength={12} onChange={(e) => set('lang', e.target.value.replace(/[^A-Za-z-]/g, ''))} /></label>
      <label className="field">How exact
        <select value={d.exact} onChange={(e) => set('exact', e.target.value)}><option value="gist">Gist (most of the words, in order)</option><option value="close">Close (small slips allowed)</option><option value="exact">Exact (every word)</option></select>
      </label>
      <label className="field">Checks
        <select value={d.mode} onChange={(e) => set('mode', e.target.value)}><option value="typed">Typed</option><option value="said">Said aloud (you mark each line)</option></select>
      </label>
      <label className="check"><input type="checkbox" checked={d.marks} onChange={(e) => set('marks', e.target.checked)} /> <span>Ignore vowel marks and accents when I check</span></label>
      {err && <p className="warn" role="alert">{err}</p>}
      <div className="row wrap">
        <button className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn primary" onClick={() => {
          if (!d.title.trim()) { setErr('Give the text a title.'); return; }
          const s = chunk(d.raw);
          if (!s.length) { setErr('Paste some text first.'); return; }
          setErr(''); setSecs(s);
          if (d.roleMode) { const r = rolesOf(s); if (r.length === 1) setRole(r[0]); }
        }}>Cut it into pieces</button>
      </div>
    </div>
  );
}

// ---------- one text ----------
function TextPage({ profile, update, text, onLearn, onBack }) {
  const [del, setDel] = useState(false);
  const roles = text.roleMode ? rolesOf(text.sections) : [];
  const set = (k, v) => update((p) => { const t = p.own.texts.find((x) => x.id === text.id); if (t) t[k] = v; });
  return (
    <div>
      <h2 className="page-title">{text.title}</h2>
      {text.label && <p className="muted small">{text.label}</p>}
      {text.note && <p className="small note">{text.note}</p>}
      <section className="card">
        <label className="field">How exact
          <select value={text.exact} onChange={(e) => set('exact', e.target.value)}><option value="gist">Gist</option><option value="close">Close</option><option value="exact">Exact</option></select>
        </label>
        <label className="field">Checks
          <select value={text.mode} onChange={(e) => set('mode', e.target.value)}><option value="typed">Typed</option><option value="said">Said aloud</option></select>
        </label>
        <label className="check"><input type="checkbox" checked={text.marks} onChange={(e) => set('marks', e.target.checked)} /> <span>Ignore vowel marks and accents when I check</span></label>
        {text.roleMode && (
          <label className="field">Your role
            <select value={text.role} onChange={(e) => set('role', e.target.value)}><option value="">Choose a role</option>{roles.map((r) => <option key={r} value={r}>{r}</option>)}</select>
          </label>
        )}
      </section>
      <section className="card">
        <h3 className="panel-title"><PxIcon name="scroll" size={28} />Sections</h3>
        {text.roleMode && !text.role && <p className="small note">Choose your role above before you learn.</p>}
        <ul className="own-sections">{text.sections.map((s) => (
          <li key={s.id} className="note">
            <p className="small"><b>Section {s.id.slice(1)}</b> ({s.lines.length} lines): {s.sched ? (s.sched.retired ? 'kept' : `next check ${s.sched.due}`) : s.stage >= 3 ? 'nearly there' : 'not started'}</p>
            <p className="own-line small muted" {...lineProps(text)}>{s.lines[0]}</p>
            <button className="btn small" disabled={text.roleMode && !text.role} onClick={() => onLearn(s.id)}>{s.sched ? 'Learn it again' : 'Learn this section'}</button>
          </li>
        ))}</ul>
      </section>
      <div className="row wrap">
        <button className="btn" onClick={onBack}>Back to your shelf</button>
        {!del ? <button className="btn ghost danger" onClick={() => setDel(true)}>Delete this text</button> : (
          <span className="note"><span className="small">{OWN.deleteOne}</span> <button className="btn danger small" onClick={() => { update((p) => { p.own.texts = p.own.texts.filter((x) => x.id !== text.id); p.own.history = p.own.history.filter((h) => h.text !== text.id); }); onBack(); }}>Delete</button> <button className="btn small" onClick={() => setDel(false)}>Cancel</button></span>
        )}
      </div>
    </div>
  );
}

// ---------- the shelf ----------
export default function OwnText({ profile, update, onExit }) {
  const own = profile.own;
  const date = today(profile);
  const [view, setView] = useState({ name: 'shelf' });
  const [msg, setMsg] = useState('');
  const [delAll, setDelAll] = useState(false);
  const fileRef = useRef(null);
  const go = (v) => { setView(v); setMsg(''); window.scrollTo(0, 0); };
  const due = dueSections(own, date).length;
  const text = view.id && own.texts.find((t) => t.id === view.id);
  const sec = text && view.sec && text.sections.find((s) => s.id === view.sec);
  const startedNow = startedToday(own, date);

  let body;
  if (view.name === 'add') body = <Add profile={profile} update={update} onCancel={() => go({ name: 'shelf' })} onDone={(id) => go({ name: 'text', id })} />;
  else if (view.name === 'sitting') body = <Sitting profile={profile} update={update} tired={!!view.tired} onExit={() => go({ name: 'shelf' })} />;
  else if (view.name === 'learn' && text && sec) body = <Learn key={sec.id} profile={profile} update={update} text={text} sec={sec} onExit={() => go({ name: 'text', id: text.id })} />;
  else if (view.name === 'text' && text) body = <TextPage profile={profile} update={update} text={text} onBack={() => go({ name: 'shelf' })} onLearn={(s) => go({ name: 'learn', id: text.id, sec: s })} />;
  else {
    body = (
      <div>
        <section className="card parchment">
          <p className="small">{OWN.intro}</p>
          <p className="small">{OWN.privacy}</p>
          <p className="small">{OWN.accuracy}</p>
          <p className="small">{OWN.aid}</p>
          <p className="small muted">{OWN.reward}</p>
        </section>
        {due > 0 && (
          <section className="card glass">
            <h3 className="panel-title"><PxIcon name="sun" size={28} />Checks</h3>
            <p className="small">{ownCheckLine(Math.min(due, SITTING_MAX), minutesFor(due))}{due > SITTING_MAX ? ' The rest can wait.' : ''}</p>
            <div className="row wrap">
              <button className="btn primary" onClick={() => go({ name: 'sitting' })}>Check</button>
              <button className="btn" onClick={() => go({ name: 'sitting', tired: true })}>{OWN.lightDay}</button>
            </div>
          </section>
        )}
        <section className="card">
          <h3 className="panel-title"><PxIcon name="scroll" size={28} />{OWN.shelf}</h3>
          {!own.texts.length ? <p className="small muted">{OWN.empty}</p> : (
            <ul className="own-sections">{own.texts.map((t) => {
              const c = sectionCounts(t);
              return (
                <li key={t.id} className="note">
                  <p><b {...lineProps(t)}>{t.title}</b>{t.label ? <span className="muted small"> {t.label}</span> : null}</p>
                  <p className="small muted">{c.total} section{c.total > 1 ? 's' : ''}, {c.learned} learned{c.kept ? `, ${c.kept} kept` : ''}{c.nextDue ? `, next check ${c.nextDue}` : ''}</p>
                  <button className="btn small" onClick={() => go({ name: 'text', id: t.id })}>Open</button>
                </li>
              );
            })}</ul>
          )}
          {startedNow >= NEW_PER_DAY && <p className="small muted">{OWN.newMaterial}</p>}
          <div className="row wrap">
            <button className="btn primary" onClick={() => go({ name: 'add' })}>Add a text</button>
          </div>
        </section>
        <section className="card">
          <h3 className="panel-title"><PxIcon name="flask" size={28} />Your texts and your backup</h3>
          <p className="small muted">{OWN.backupLine}</p>
          <p className="small muted">{OWN.textsOnlyHelp}</p>
          <div className="row wrap">
            <button className="btn small" disabled={!own.texts.length} onClick={() => saveText(`mnemos-texts-${date}.json`, buildTextsExport(own))}>{OWN.textsOnly}</button>
            <button className="btn small" onClick={() => fileRef.current.click()}>Import texts</button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden data-testid="own-import-file" onChange={(e) => {
              const f = e.target.files?.[0]; e.target.value = '';
              if (!f) return;
              f.text().then((raw) => {
                const r = importTexts(own, raw);
                if (!r.ok) { setMsg(r.error); return; }
                update((p) => { p.own = r.own; });
                setMsg(`Added ${r.added} text${r.added === 1 ? '' : 's'}${r.skipped ? `. ${r.skipped} could not be added (already on your shelf, or no room).` : '.'}`);
              }, () => setMsg('This file could not be read.'));
            }} />
          </div>
          {msg && <p className="small note" role="status">{msg}</p>}
          {own.texts.length > 0 && (!delAll ? <button className="btn ghost danger small" onClick={() => setDelAll(true)}>Delete all my texts</button> : (
            <p className="note"><span className="small">{OWN.deleteAll}</span> <button className="btn danger small" onClick={() => { update((p) => { p.own.texts = []; p.own.history = []; }); setDelAll(false); }}>Delete them all</button> <button className="btn small" onClick={() => setDelAll(false)}>Cancel</button></p>
          ))}
        </section>
      </div>
    );
  }

  return (
    <div className="page own-page">
      <h1 className="page-title"><PxIcon name="quill" size={36} />{view.name === 'shelf' ? OWN.shelf : OWN.name}</h1>
      {body}
      {view.name === 'shelf' && <button className="btn ghost" onClick={onExit}>Close Your Shelf</button>}
    </div>
  );
}
