import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import '@fontsource/pixelify-sans/latin-400.css';
import '@fontsource/pixelify-sans/latin-600.css';
import '@fontsource/pixelify-sans/latin-700.css';
import '@fontsource/silkscreen/latin-400.css';
import '@fontsource/vt323/latin-400.css';
import './styles.css';
import './ui/crypt.css';
import { installFrames } from './ui/game/frames.js';
import { installUiSounds } from './audio/sfx.js';

installFrames();
installUiSounds();

import { LS_KEY, deleteProfile } from './store.js';
import { logError } from './engine/beta.js';

window.addEventListener('error', (e) => logError(e.error || e.message, 'window'));
window.addEventListener('unhandledrejection', (e) => logError(e.reason, 'promise'));

class Boundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error) { logError(error, 'render'); }
  render() {
    if (!this.state.error) return this.props.children;
    const download = () => {
      let raw = ''; try { raw = localStorage.getItem(LS_KEY) || ''; } catch { /* ignore */ }
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([raw], { type: 'application/json' })); a.download = 'mnemos-raw-data.json'; a.click();
    };
    return (
      <div className="crash card" role="alert">
        <h1>Something went wrong</h1>
        <p>Mnemos hit an error it could not recover from. Your data has not been deleted.</p>
        <p className="muted small">{String(this.state.error?.message || this.state.error)}</p>
        <button className="btn primary" onClick={download}>Download raw data</button>
        <button className="btn" onClick={() => location.reload()}>Reload</button>
        <button className="btn danger" onClick={async () => { if (confirm('Delete all Mnemos data in this browser?')) { await deleteProfile(); location.reload(); } }}>Reset app</button>
      </div>
    );
  }
}

createRoot(document.getElementById('root')).render(<React.StrictMode><Boundary><App /></Boundary></React.StrictMode>);

if (location.protocol.startsWith('http')) { const l = document.createElement('link'); l.rel = 'manifest'; l.href = './manifest.webmanifest'; document.head.appendChild(l); }
// Hosted build only: offline cache with an "update available" prompt (see vite.config.js and ui/Notices.jsx).
if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !import.meta.env.DEV && !__SINGLE__) {
  navigator.serviceWorker.register('./sw.js').then((reg) => {
    const offer = (w) => { if (w && navigator.serviceWorker.controller) window.dispatchEvent(new CustomEvent('mnemos-update', { detail: w })); };
    offer(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w?.addEventListener('statechange', () => { if (w.state === 'installed') offer(w); });
    });
  }).catch(() => {});
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloaded) { reloaded = true; location.reload(); } });
}
