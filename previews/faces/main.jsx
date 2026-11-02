import React from 'react';
import { createRoot } from 'react-dom/client';
import { PixelFace, Portrait } from '../../src/pixel/Faces.jsx';
import { describeFace, faceParams, renderFace } from '../../src/pixel/faces.js';
import { PORTRAIT_IDS, PORTRAIT_MOODS } from '../../src/pixel/portraits.js';

const q = new URLSearchParams(location.search);
const start = +(q.get('start') || 1), n = +(q.get('n') || 40), size = +(q.get('size') || 48), scale = +(q.get('scale') || 3);
const only = q.get('only');
const t0 = performance.now(); for (let i = 0; i < 200; i++) renderFace(5000 + i, 48); const per = (performance.now() - t0) / 200;
function App() {
  const seeds = Array.from({ length: n }, (_, i) => start + i * 7919);
  return <div>
    <div id="perf">avg render {per.toFixed(2)} ms/face @48</div>
    {only !== 'portraits' && <><h2>Random faces</h2>
    <div className="grid">{seeds.map((s) => { const p = faceParams(s); return <div className="cell" key={s}><PixelFace seed={s} size={size} scale={scale} /><span>{s} {p.hairStyle} {p.faceShape}<br />{describeFace(s)}</span></div>; })}</div></>}
    {only !== 'faces' && <><h2>Portraits</h2>
    <div className="grid">{PORTRAIT_IDS.flatMap((id) => (PORTRAIT_MOODS[id] || ['neutral']).map((m) => <div className="cell" style={{ width: 200 }} key={id + m}><Portrait id={id} mood={m} scale={3} /><span>{id} / {m}</span></div>))}</div></>}
  </div>;
}
createRoot(document.getElementById('root')).render(<App />);
