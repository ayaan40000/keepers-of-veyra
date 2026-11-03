// v0.10 Character sheet: a paper doll that grows with the gates, seven attributes from the seven skills, and gear.
import React, { useMemo } from 'react';
import { PxIcon } from './game/PxIcon.jsx';
import { PixelBar } from './game/PixelBar.jsx';
import { Sprite } from '../pixel/core.js';
import { keeperSprite } from '../pixel/keeper.js';
import { ItemIcon } from './ItemIcon.jsx';
import { ArtImg, artFind } from './artLookup.jsx';
import { SLOTS, GEAR_BY_ID } from '../data/gear.js';
import { ITEM_BY_ID } from '../data/items.js';
import { attributes, classOf, options, equipOf, equip, dollSpec, gatesPassed, ATTR_MAX } from '../engine/character.js';
import { rankOf } from '../engine/progress.js';
import { ECHO_HONEST } from '../data/echo.js';
import { CabinetCard } from './Voices.jsx';
import { MirrorRoom, MistNote } from './MirrorRoom.jsx';
import { mistState, litSkills } from '../engine/mirror.js';
import { GREYED } from '../data/mirror.js';

export default function Character({ profile, update, onReview }) {
  const at = attributes(profile);
  const mist = mistState(profile);
  const relit = new Set(litSkills(profile, mist.episode));
  const cls = classOf(profile);
  const rank = rankOf(profile.progress.lumen);
  const spec = dollSpec(profile);
  const doll = useMemo(() => keeperSprite(spec), [JSON.stringify(spec)]);
  const gates = gatesPassed(profile).length;
  const b = profile.battles || {};
  const bgArt = artFind(['character'], ['bg', 'room', 'portrait']);
  return (
    <div className="page character">
      <h1 className="page-title"><PxIcon name="keeper" size={36} />Character</h1>

      <section className="card profile-card char-head">
        <div className={`doll-frame${bgArt ? ' has-art' : ''}`}>
          {bgArt && <ArtImg id={bgArt} className="doll-bg" alt="" />}
          <Sprite sprite={doll} scale={6} label={`Paper doll of ${profile.user.alias}, showing ${gates} gate stitches`} />
        </div>
        <div>
          <h2>{profile.user.alias}</h2>
          <p><span className="tag">{cls.title}</span></p>
          <p className="muted small">{rank.title} · rank {rank.rank} · {profile.progress.lumen} Lumen</p>
          <p className="muted small">Your cloak gains a stitch of trim for every district gate you pass ({gates} of 12). A clasp, pin, lantern glow and gold lining come at gates 3, 6, 9 and 12.</p>
        </div>
      </section>

      <section className="card">
        <h3 className="panel-title"><PxIcon name="chart" size={28} />Attributes</h3>
        <p className="muted small">Each one is a skill you have trained: its level plus its mastery step. They only grow when you learn.</p>
        <MistNote mist={mist} />
        <ul className="attrs">{at.map((a) => {
          const hidden = mist.up && !relit.has(a.skill);
          return (
            <li key={a.skill} className={hidden ? 'shrouded' : ''} title={hidden ? GREYED.tooltip : undefined}>
              <span className="attr-name"><b>{a.name}</b> <span className="muted small">{a.short}</span></span>
              <PixelBar value={hidden ? 0 : a.value} max={ATTR_MAX} size="xs" label={hidden ? `${a.name} hidden by the mist. ${GREYED.tooltip}` : `${a.name} ${a.value} of ${ATTR_MAX}`} />
              <span className="num attr-val">{hidden ? '?' : a.value}</span>
              <span className="muted small attr-why">{hidden ? GREYED.tooltip : `Level ${a.level}, mastery ${a.mastery}`}</span>
            </li>
          );
        })}</ul>
        <p className="muted small">Class: {cls.top ? `your strongest attribute makes you a ${cls.klass}.` : cls.klass === 'Wayfarer' ? 'your skills are evenly grown, so you are a Wayfarer.' : 'you are still an Apprentice. Train a skill to find your class.'}</p>
      </section>

      <CabinetCard profile={profile} onReview={onReview} />
      <MirrorRoom profile={profile} update={update} />

      <section className="card">
        <h3 className="panel-title"><PxIcon name="chest" size={28} />Gear</h3>
        <p className="muted small">Only relics you have earned can be worn. Gear is cosmetic or a small study aid used after you commit an answer. Nothing shows an answer before you recall it.</p>
        <div className="gear-grid">{SLOTS.map((s) => {
          const opts = options(profile, s.id);
          const cur = equipOf(profile, s.id);
          const g = cur ? (GEAR_BY_ID[cur] || { title: ITEM_BY_ID[cur]?.name, note: 'Cosmetic.' }) : null;
          return (
            <div key={s.id} className="gear-slot">
              <label className="field">{s.name}
                <select value={cur || ''} onChange={(e) => update((p) => { equip(p, s.id, e.target.value || null); })}>
                  <option value="">Nothing</option>
                  {opts.map((o) => <option key={o.id} value={o.id}>{o.title || ITEM_BY_ID[o.id]?.name || o.id}</option>)}
                </select>
              </label>
              <div className="gear-note">
                {cur && ITEM_BY_ID[g?.item === undefined ? cur : g.item] && <ItemIcon id={g?.item === undefined ? cur : g.item} scale={2} />}
                <span className="small muted">{g ? g.note : s.blurb}</span>
              </div>
            </div>
          );
        })}</div>
      </section>

      <section className="card">
        <h3 className="panel-title"><PxIcon name="crypt" size={28} />Echo record</h3>
        <p className="small">{b.done || 0} Echoes met · {b.held || 0} old memories held · {b.rests || 0} rests</p>
        <p className="muted small">{ECHO_HONEST}</p>
      </section>
    </div>
  );
}
