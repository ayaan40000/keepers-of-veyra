import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import WorldMap from '../../src/ui/pixel/WorldMap.jsx';
import * as Scenes from '../../src/ui/pixel/Scenes.jsx';

const ALL = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];
const BANNERS = [...ALL, 'archive', 'crypt'];
const q = new URLSearchParams(location.search);

function MapCard({ gates, current, title }) {
  const [sel, setSel] = useState(current);
  return <div><h2>{title}</h2><WorldMap gates={gates} current={current} selected={sel} onSelect={setSel} /></div>;
}
function App() {
  const only = q.get('only');
  if (q.get('map')) { const i = +q.get('map'); const cfg = [[[], 'M1'], [ALL.slice(0, 5), 'M6'], [ALL, 'M12']][i]; return <div style={{ maxWidth: 720, margin: '0 auto' }}><MapCard title={'map ' + i} gates={cfg[0]} current={cfg[1]} /></div>; }
  return (
    <>
      {(!only || only === 'maps') && <div className="maps">
        <MapCard title="No gates (M1 current)" gates={[]} current="M1" />
        <MapCard title="M1-M5 passed, M6 current" gates={ALL.slice(0, 5)} current="M6" />
        <MapCard title="All passed" gates={ALL} current="M12" />
      </div>}
      {(!only || only === 'title') && Scenes.TitleScene && <><h2>Title scene</h2><Scenes.TitleScene /></>}
      {(!only || only === 'banners') && Scenes.DistrictBanner && <><h2>District banners (restored / lost)</h2>
        <div className="banners">{BANNERS.map((id) => (
          <figure key={id}><Scenes.DistrictBanner id={id} restored /><Scenes.DistrictBanner id={id} restored={false} /><figcaption>{id}</figcaption></figure>
        ))}</div></>}
    </>
  );
}
createRoot(document.getElementById('root')).render(<App />);
