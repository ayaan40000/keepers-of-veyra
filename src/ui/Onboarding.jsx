import React, { useState } from 'react';
import { Sigil, AVATARS } from './art.jsx';
import { PxIcon } from './game/PxIcon.jsx';
import { TitleScene } from './pixel/Scenes.jsx';

export default function Onboarding({ onCreate, onImport }) {
  const [step, setStep] = useState(0);
  const [alias, setAlias] = useState('');
  const [avatar, setAvatar] = useState('lantern');
  const [theme, setTheme] = useState('dark');
  return (
    <div className={`onboard ${step === 0 ? 'is-title' : ''}`}>
      {step === 0 && (
        <div className="title-screen intro">
          <div className="title-hero">
            <TitleScene />
            <h1 className="logo-big">MNEMOS</h1>
            <p className="subtitle">Keepers of Veyra</p>
          </div>
          <nav className="title-menu panel stone" aria-label="Title menu">
            <button className="menu-item sel" data-sfx="door" onClick={() => setStep(1)}>Start</button>
            <button className="menu-item" onClick={onImport}>I have a backup file</button>
          </nav>
          <section className="panel glass title-blurb">
            <p>A year of memory training, about 20 to 30 minutes a day. You will learn the same methods that memory champions use: memory palaces, turning numbers into pictures, remembering names and faces, learning words in another language. And the app will honestly measure what sticks.</p>
            <p className="muted">It is also a story. Far away, on a grey northern coast, there is a city called Veyra, where a silver tide rises off the river every night and takes whatever nobody is holding in mind. Its Archivist has vanished. Its records are blank. Every skill you truly master brings one of its twelve districts back out of the fog.</p>
          </section>
          <p className="title-foot">Offline · your data stays on this device</p>
        </div>
      )}
      {step === 1 && (
        <section className="card">
          <div className="step-dots" aria-hidden="true"><i className="on" /><i /></div>
          <h2 className="panel-title"><PxIcon name="keeper" size={32} />Your Keeper</h2>
          <label className="field">Alias (any name; stays on this device)<input autoFocus maxLength={32} value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="e.g. Ayaan" /></label>
          <div className="field">Sigil<div className="avatars">{AVATARS.map((a) => <button key={a} className={`avatar-btn ${avatar === a ? 'on' : ''}`} aria-label={a} aria-pressed={avatar === a} onClick={() => setAvatar(a)}><Sigil kind={a} size={36} /></button>)}</div></div>
          <label className="field">Theme<select value={theme} onChange={(e) => setTheme(e.target.value)}><option value="dark">Night (dark)</option><option value="light">Parchment (light)</option><option value="system">Follow device</option></select></label>
          <button className="btn primary" disabled={!alias.trim()} onClick={() => setStep(2)}>Continue</button>
        </section>
      )}
      {step === 2 && (
        <section className="card parchment">
          <div className="step-dots" aria-hidden="true"><i className="on" /><i className="on" /></div>
          <h2 className="panel-title"><PxIcon name="scroll" size={32} />Before you begin</h2>
          <ul className="plain checklist">
            <li><PxIcon name="sun" size={28} /><span><b>About 20 to 30 minutes a day.</b> If you miss a day, nothing is lost and nothing is skipped. The course simply waits for you, and a short 10-minute session is always there to ease back in.</span></li>
            <li><PxIcon name="chart" size={28} /><span><b>Day 1 measures where you are starting from.</b> The same three tasks come back every three months, so you can see real change with your own eyes.</span></li>
            <li><PxIcon name="chest" size={28} /><span><b>Your progress stays with you.</b> Everything is saved in this browser only. No account, no email address, nothing sent anywhere. You can save a backup file from the Keeper tab at any time.</span></li>
            <li><PxIcon name="quill" size={28} /><span><b>Honest scores.</b> They show how you are doing on Mnemos tasks. They are not an IQ test or a clinical test, and your Training Score stays provisional for your first 14 days.</span></li>
          </ul>
          <button className="btn primary big" onClick={() => onCreate(alias.trim(), avatar, { theme })}>Create my profile</button>
        </section>
      )}
    </div>
  );
}
