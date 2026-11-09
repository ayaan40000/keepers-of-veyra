// 1.2 Labelled diagrams for the Fact Recall drill, drawn in code (simple SVG shapes, crisp edges, no animation).
import React from 'react';
import { DIAGRAM_BY_ID } from '../data/abstract.js';

export function Diagram({ id, labels = false }) {
  const d = DIAGRAM_BY_ID[id];
  if (!d) return null;
  return (
    <figure className="diagram">
      <svg viewBox={`0 0 ${d.w} ${d.h}`} role="img" aria-label={`${d.title}${labels ? `: ${d.marks.map((m, i) => `${i + 1} ${m.label}`).join(', ')}` : ', with numbered marks'}`} shapeRendering="crispEdges">
        {d.shapes.map(([tag, attrs], i) => React.createElement(tag, { key: i, ...attrs }))}
        {d.marks.map((m, i) => (
          <g key={i}>
            <circle cx={m.x} cy={m.y} r="7" fill="#1b1830" stroke="#f0c75e" strokeWidth="1.5" />
            <text x={m.x} y={m.y + 3.5} textAnchor="middle" fontSize="9" fill="#ffe39a" fontFamily="monospace">{i + 1}</text>
          </g>
        ))}
      </svg>
      <figcaption className="small"><b>{d.title}</b>{d.note ? `. ${d.note}` : ''}</figcaption>
      {labels && <ol className="diagram-key small">{d.marks.map((m, i) => <li key={i}>{m.label}</li>)}</ol>}
    </figure>
  );
}
