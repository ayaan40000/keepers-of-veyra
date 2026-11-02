// Visual QA sheet: every collectible icon at scale 3 in its rarity frame, grouped by kind.
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/styles.css';
import { ITEMS, KINDS, RARITY } from '../../src/data/items.js';
import { ItemIcon, ItemCard } from '../../src/ui/ItemIcon.jsx';

const params = new URLSearchParams(location.search);
const scale = +(params.get('scale') || 3);
const only = params.get('kind');

function Sheet() {
  return (
    <div style={{ padding: 16, maxWidth: 1400 }}>
      <style>{'canvas.px{image-rendering:pixelated}'}</style>
      {KINDS.filter((k) => !only || k.id === only).map((k) => (
        <section key={k.id}>
          <h2 style={{ margin: '8px 0' }}>{k.name}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${28 * scale + 24}px, 1fr))`, gap: 10 }}>
            {ITEMS.filter((it) => it.kind === k.id).map((it) => (
              <div key={it.id} style={{ textAlign: 'center' }}>
                <ItemIcon id={it.id} scale={scale} />
                <div style={{ fontSize: 11, lineHeight: 1.2, color: RARITY[it.rarity].color }}>{it.name}</div>
              </div>
            ))}
          </div>
        </section>
      ))}
      {params.get('cards') && (
        <section style={{ maxWidth: 560 }}>
          <h2>Cards</h2>
          <ItemCard id="brass_lantern" owned />
          <ItemCard id="ct_lamp_of_ages" owned={false} />
          <ItemCard id="trinket_m6_grief" owned />
          <ItemCard id="seal_first_light" owned={false} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>{['art_grey_glove', 'ct_nameless_crown', 'trinket_m5_clock'].map((id) => <ItemIcon key={id} id={id} owned={false} />)}</div>
        </section>
      )}
    </div>
  );
}
createRoot(document.getElementById('root')).render(<Sheet />);
