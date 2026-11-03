import React, { useEffect, useRef, useState } from 'react';
import { newProfile, today } from './engine/core.js';
import { buildSession } from './engine/session.js';
import { abandonSession } from './engine/progress.js';
import { loadProfile, saveProfile, deleteProfile, requestPersistence, parseImport, peekSaved, LS_KEY, MAX_IMPORT_BYTES } from './store.js';
import Onboarding from './ui/Onboarding.jsx';
import Today from './ui/Today.jsx';
import Session from './ui/Session.jsx';
import Veyra from './ui/Veyra.jsx';
import Palaces from './ui/Palaces.jsx';
import Progress from './ui/Progress.jsx';
import Keeper from './ui/Keeper.jsx';
import FieldGuide from './ui/FieldGuide.jsx';
import Relics from './ui/Relics.jsx';
import Crypt from './ui/Crypt.jsx';
import Character from './ui/Character.jsx';
import Battle from './ui/Battle.jsx';
import TrialRun from './ui/Trials.jsx';
import Audit from './ui/Audit.jsx';
import Seam from './ui/Seam.jsx';
import EventHall from './ui/EventHall.jsx';
import OwnText from './ui/OwnText.jsx';
import { ItemIcon } from './ui/ItemIcon.jsx';
import { UnlockToast } from './ui/game/UnlockToast.jsx';
import { earnedItems, collectionStats } from './engine/collect.js';
import { ITEM_BY_ID, RARITY } from './data/items.js';
import { rankOf } from './engine/progress.js';
import { Hud } from './ui/game/Hud.jsx';
import { PxIcon } from './ui/game/PxIcon.jsx';
import { setSoundEnabled, setBlipsEnabled, setVolume, sfx } from './audio/sfx.js';
import { UpdatePrompt } from './ui/Notices.jsx';

// [id, label, icon, onPhoneBar]. Phones show five slots (Today, Veyra, Crypt, Progress, Menu); the rest live in Menu.
const TABS = [
  ['today', 'Today', 'sun', true],
  ['veyra', 'Veyra', 'map', true],
  ['crypt', 'Crypt', 'crypt', true],
  ['palaces', 'Palaces', 'palace', false],
  ['relics', 'Relics', 'chest', false],
  ['progress', 'Progress', 'chart', true],
  ['guide', 'Field Guide', 'scroll', false],
  ['keeper', 'Keeper', 'keeper', false],
  ['character', 'Character', 'keeper', false],
];

export default function App() {
  const [profile, setProfile] = useState(undefined);
  const [tab, setTab] = useState('today');
  const [inSession, setInSession] = useState(false);
  const [inCrypt, setInCrypt] = useState(false);
  const [battle, setBattle] = useState(null);
  const [trial, setTrial] = useState(null);
  const [menu, setMenu] = useState(false);
  const ref = useRef(null);
  const importRef = useRef(null);

  useEffect(() => {
    loadProfile().then((p) => {
      if (p) { p.meta.lastOpened = new Date().toISOString(); if (!p.collectionSeen) p.collectionSeen = earnedItems(p); saveProfile(p); }
      ref.current = p || null; setProfile(p || null);
      if (p?.user?.prefs?.home === 'veyra') setTab('veyra');
    });
    requestPersistence();
    // Cross-tab safety: adopt newer saves (and deletions) made in another tab.
    const onStorage = (e) => {
      if (e.key !== LS_KEY) return;
      if (e.newValue == null) { ref.current = null; setProfile(null); setInSession(false); return; }
      try {
        const other = JSON.parse(e.newValue);
        if ((other.meta?.savedAt || 0) > (ref.current?.meta?.savedAt || 0)) { ref.current = other; setProfile(other); }
      } catch { /* ignore */ }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const theme = profile?.user.prefs.theme || 'dark';
  const reduced = profile?.user.prefs.reducedMotion;
  const readable = !!profile?.user.prefs.readableFont;
  const prefs = profile?.user.prefs || {};
  const sound = prefs.sound === true;
  const textSize = prefs.textSize || 1;
  useEffect(() => {
    const root = document.documentElement;
    const sys = window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    root.dataset.theme = theme === 'system' ? sys : theme;
    root.dataset.motion = reduced ? 'reduced' : 'full';
    root.dataset.font = readable ? 'readable' : 'pixel';
    root.style.setProperty('--ts', String(textSize));
  }, [theme, reduced, readable, textSize]);
  useEffect(() => { setSoundEnabled(sound); setBlipsEnabled(prefs.blips !== false); setVolume(prefs.volume ?? 0.6); }, [sound, prefs.blips, prefs.volume]);
  // Keyboard play (v0.8): 1 to 7 jump between pages and ? lists the keys, whenever you are not typing.
  const [keysHelp, setKeysHelp] = useState(false);
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName) || e.target?.isContentEditable) return;
      if (e.target?.closest?.('.room-stage')) return;
      if (e.key === '?') { setKeysHelp((v) => !v); return; }
      const i = +e.key;
      if (i >= 1 && i <= TABS.length && !inSession && ref.current) { e.preventDefault(); goRef.current?.(TABS[i - 1][0]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inSession]);
  const goRef = useRef(null);

  useEffect(() => {
    if (!menu) return undefined;
    const esc = (e) => { if (e.key === 'Escape') setMenu(false); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [menu]);

  const update = (fn) => {
    const saved = peekSaved();
    if (saved && ref.current && (saved.meta?.savedAt || 0) > (ref.current.meta?.savedAt || 0)) ref.current = saved; // another tab wrote later
    if (!ref.current) return;
    const next = structuredClone(ref.current);
    fn(next);
    ref.current = next;
    setProfile(next);
    saveProfile(next);
  };
  const replace = (p) => { if (!p.collectionSeen) p.collectionSeen = earnedItems(p); ref.current = p; setProfile(p); saveProfile(p); setInSession(false); setTab('today'); window.scrollTo(0, 0); };

  const fight = (mode) => { setBattle({ mode, n: Date.now() }); window.scrollTo(0, 0); };
  const openTrial = (id) => { setTrial({ id, n: Date.now() }); window.scrollTo(0, 0); };

  function start(type, opts) {
    if (type === 'discard') { update((p) => abandonSession(p)); return; }
    if (type !== 'resume') update((p) => { p.inProgress = { session: buildSession(p, type, opts), idx: 0, results: [], events: [] }; });
    setInSession(true);
    window.scrollTo(0, 0);
  }

  if (profile === undefined) return <div className="loading">Lighting the lamps…</div>;

  if (!profile) {
    return (
      <>
        <Onboarding onCreate={(alias, avatar, prefs) => replace(newProfile(alias, avatar, prefs))} onImport={() => importRef.current.click()} />
        <input ref={importRef} type="file" accept=".json,application/json" hidden data-testid="onboard-import" onChange={(e) => {
          const f = e.target.files?.[0]; if (!f) return;
          if (f.size > MAX_IMPORT_BYTES) { alert('This file is larger than 5 MB, so it cannot be a Mnemos backup.'); e.target.value = ''; return; }
          f.text().then((t) => { const r = parseImport(t); if (!r.ok) { alert(r.error); return; } if (r.warning && !confirm(`${r.warning} Import anyway?`)) return; replace(r.profile); });
          e.target.value = '';
        }} />
      </>
    );
  }

  const fresh = profile.inProgress || inCrypt || battle || trial ? [] : earnedItems(profile).filter((id) => !(profile.collectionSeen || []).includes(id));
  // One grouped unlock moment (v0.6): two or more new relics at once get a single screen instead of a stream of toasts.
  const seeAll = () => update((p) => { p.collectionSeen = [...new Set([...(p.collectionSeen || []), ...fresh])]; });
  const grouped = fresh.length >= 2 && (
    <div className="menu-sheet-wrap unlock-wrap">
      <section className="card gold unlock-group" role="dialog" aria-label="New relics">
        <span className="tag">Reliquary</span>
        <h2>{fresh.length} new relics</h2>
        <p className="muted small">Earned by what you have learned. Open the Relics page to read their stories.</p>
        <ul className="unlock-list">{fresh.map((id) => (
          <li key={id}><ItemIcon id={id} scale={2} /><span><b>{ITEM_BY_ID[id]?.name || id}</b><small>{RARITY[ITEM_BY_ID[id]?.rarity]?.label}</small></span></li>
        ))}</ul>
        <div className="row wrap">
          <button className="btn primary" autoFocus data-sfx="chest" onClick={seeAll}>Wonderful</button>
          <button className="btn" onClick={() => { seeAll(); setTab('relics'); window.scrollTo(0, 0); }}>Open the Relics page</button>
        </div>
      </section>
    </div>
  );
  const toast = fresh.length === 1 && (
    <UnlockToast items={[...fresh.slice(0, 3).map((id) => ({ key: id, icon: <ItemIcon id={id} scale={2} />, kicker: `${RARITY[ITEM_BY_ID[id]?.rarity]?.label || 'New'} relic found`, title: ITEM_BY_ID[id]?.name || id, text: 'Added to your Reliquary.', sound: 'chest' })), ...(fresh.length > 3 ? [{ key: 'more' + fresh.length, kicker: 'Reliquary', title: `And ${fresh.length - 3} more relics`, text: 'See them all in the Relics tab.', sound: 'none' }] : [])]}
      onDone={() => update((p) => { p.collectionSeen = [...new Set([...(p.collectionSeen || []), ...fresh])]; })} />
  );

  if (battle && battle.mode === 'events') {
    return <EventHall key={battle.n} profile={profile} update={update} onExit={() => { setBattle(null); window.scrollTo(0, 0); }} />;
  }

  if (battle && battle.mode === 'own') {
    return <OwnText key={battle.n} profile={profile} update={update} onExit={() => { setBattle(null); window.scrollTo(0, 0); }} />;
  }

  if (battle && battle.mode === 'seam') {
    return <Seam key={battle.n} profile={profile} update={update} onExit={() => { setBattle(null); window.scrollTo(0, 0); }} />;
  }

  if (battle && battle.mode === 'audit') {
    return <Audit key={battle.n} profile={profile} update={update} onExit={() => { setBattle(null); window.scrollTo(0, 0); }} />;
  }

  if (battle) {
    return <Battle key={battle.n} profile={profile} update={update} mode={battle.mode} onExit={() => { setBattle(null); window.scrollTo(0, 0); }} />;
  }

  if (trial) {
    return <TrialRun key={trial.n} profile={profile} update={update} id={trial.id} onExit={() => { setTrial(null); window.scrollTo(0, 0); }} />;
  }

  if (inCrypt) {
    return <Crypt profile={profile} update={update} onExit={() => { setInCrypt(false); window.scrollTo(0, 0); }} treasureIcon={(id, size) => <ItemIcon id={id} scale={Math.max(1, Math.round((size || 48) / 28))} />} />;
  }

  if (inSession && profile.inProgress) {
    return <Session profile={profile} update={update} onExit={() => { setInSession(false); setTab('today'); }} />;
  }

  const pages = {
    today: <Today profile={profile} start={start} update={update} onEnterCrypt={() => setInCrypt(true)} onFight={fight} onTrial={openTrial} />,
    relics: <Relics profile={profile} update={update} onEnterCrypt={() => setInCrypt(true)} />,
    veyra: <Veyra profile={profile} update={update} onFight={fight} onTrial={openTrial} />,
    character: <Character profile={profile} update={update} onReview={() => start('review')} />,
    palaces: <Palaces profile={profile} update={update} />,
    progress: <Progress profile={profile} update={update} />,
    guide: <FieldGuide profile={profile} update={update} start={start} onOwnText={() => fight('own')} />,
    keeper: <Keeper profile={profile} update={update} replaceProfile={replace} openCharacter={() => goRef.current?.('character')} wipe={async () => { await deleteProfile(); ref.current = null; setProfile(null); }} />,
  };
  const go = (id) => {
    setMenu(false);
    if (id === 'crypt') { setInCrypt(true); window.scrollTo(0, 0); return; }
    setTab(id); window.scrollTo(0, 0);
  };
  goRef.current = go;
  const inMenu = TABS.filter((t) => !t[3]).some((t) => t[0] === tab);

  const toggleSound = () => {
    const on = !sound;
    setSoundEnabled(on);
    if (on) sfx.confirm();
    update((p) => { p.user.prefs.sound = on; });
  };

  return (
    <div className="shell">
      <a href="#main" className="skip">Skip to content</a>
      <nav className="tabs" aria-label="Main">
        <div className="brand"><span className="logo-sm">MNEMOS</span><span className="brand-sub">Keepers of Veyra</span><span className="brand-date">{today(profile)}</span></div>
        {TABS.map(([id, label, icon, bar]) => (
          <button key={id} className={`${tab === id ? 'on' : ''}${bar ? '' : ' tab-extra'}`} aria-current={tab === id ? 'page' : undefined} onClick={() => go(id)}>
            <PxIcon name={icon} size={32} />
            <span>{label}</span>
          </button>
        ))}
        <button className={`tab-menu${inMenu || menu ? ' on' : ''}`} aria-expanded={menu} aria-controls="menu-sheet" onClick={() => setMenu(!menu)}>
          <PxIcon name="scroll" size={32} />
          <span>Menu</span>
        </button>
      </nav>
      <Hud rank={rankOf(profile.progress.lumen)} lumen={profile.progress.lumen} keys={profile.crypt?.keys ?? 1} relics={collectionStats(profile).owned} sound={sound} onToggleSound={toggleSound} />
      {menu && (
        <div className="menu-sheet-wrap" onClick={(e) => { if (e.target === e.currentTarget) setMenu(false); }}>
          <div id="menu-sheet" className="menu-sheet" role="dialog" aria-label="Menu">
            {TABS.filter((t) => !t[3]).map(([id, label, icon]) => (
              <button key={id} autoFocus={id === 'relics'} className={`menu-row${tab === id ? ' on' : ''}`} aria-current={tab === id ? 'page' : undefined} onClick={() => go(id)}>
                <PxIcon name={icon} size={32} /><span>{label}</span>
              </button>
            ))}
            <button className="menu-row" onClick={() => setMenu(false)}><PxIcon name="back" size={32} /><span>Close menu</span></button>
          </div>
        </div>
      )}
      {keysHelp && (
        <div className="menu-sheet-wrap unlock-wrap" onClick={(e) => { if (e.target === e.currentTarget) setKeysHelp(false); }}>
          <section className="card keys-help" role="dialog" aria-label="Keyboard keys">
            <h2>Keyboard and controller</h2>
            <ul className="small">
              {TABS.map(([id, label], i) => <li key={id}><kbd>{i + 1}</kbd> {label}</li>)}
              <li><kbd>Tab</kbd> next button or field, <kbd>Enter</kbd> press it, <kbd>Esc</kbd> close a menu</li>
              <li>In drills, <kbd>Enter</kbd> moves to the next answer box</li>
              <li>In a palace room: arrow keys or <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> to walk, <kbd>[</kbd> <kbd>]</kbd> previous and next stop</li>
              <li>Game controller: d-pad or stick moves between buttons, A presses, B closes menus; in a palace room it walks, and the shoulder buttons jump between stops</li>
              <li><kbd>?</kbd> shows or hides this list</li>
            </ul>
            <button className="btn primary" autoFocus onClick={() => setKeysHelp(false)}>Close</button>
          </section>
        </div>
      )}
      <UpdatePrompt />
      {grouped}
      {toast}
      <main id="main">{pages[tab]}</main>
    </div>
  );
}
