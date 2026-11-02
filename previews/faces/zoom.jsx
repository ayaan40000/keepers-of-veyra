import React from 'react';
import { createRoot } from 'react-dom/client';
import { PixelFace, Portrait } from '../../src/pixel/Faces.jsx';
const q = new URLSearchParams(location.search);
const ids = (q.get('ids') || '').split(',').filter(Boolean), seeds = (q.get('seeds') || '').split(',').filter(Boolean).map(Number);
const mood = q.get('mood') || 'neutral', scale = +(q.get('scale') || 5), size = +(q.get('size') || 48);
createRoot(document.getElementById('root')).render(<div className="grid">
  {ids.map((id) => <Portrait key={id} id={id} mood={mood} scale={scale} />)}
  {seeds.map((s) => <PixelFace key={s} seed={s} size={size} scale={scale} />)}
</div>);
