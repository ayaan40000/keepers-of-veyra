// Walk a memory palace (v0.8): each palace becomes pixel rooms with one piece of furniture per stop,
// in walking order. Arrow keys, WASD, a game controller or the on-screen buttons move the Keeper.
// This is a rehearsal space for the route itself; drills still happen on the plain, still study screens.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ROOM_W, ROOM_H, TILE, PER_ROOM, layoutPalace, FURNITURE_KINDS, furnitureFor, step, stopAt, standAt, nextStopQuestion, DOOR_IN, DOOR_OUT } from '../engine/room.js';
import { FURNITURE } from '../pixel/furniture.js';
import { drawSprite, reducedMotion, PAL } from '../pixel/raster.js';
import { onPad } from './gamepad.js';

const W = ROOM_W * TILE, H = ROOM_H * TILE;

// The Keeper, 12x16, facing right. Hood, cloak and a small lamp. Original art.
const KEEPER = {
  w: 12, h: 16,
  pal: { o: '#140f1a', h: '#4a3a6a', H: '#6b5a8a', s: '#e8c4a0', c: '#3a5a78', C: '#5a7a98', b: '#2a1e14', l: '#ffd98a', L: '#e8b04b' },
  px: [
    '....oooo....', '...oHHHHo...', '..oHhhhhHo..', '..ohhssshho.', '..ohsssssho.', '..ohhsosshho', '...ohhhhho..', '..oCCCCCCo..',
    '.oCccccccCo.', '.oCcccccccoL', '.oCccccccolL', '.oCcccccccoL', '..oCccccCo..', '..occccco...', '..obb.obbo..', '..oo...oo...',
  ],
};

function useRoomCanvas(ref, rooms, pos, lit) {
  useEffect(() => {
    const c = ref.current; if (!c) return undefined;
    c.width = W; c.height = H;
    const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
    const room = rooms[pos.room];
    const draw = (t) => {
      // floor boards and wall
      for (let y = 0; y < ROOM_H; y++) for (let x = 0; x < ROOM_W; x++) {
        const wall = y < 2 || x === 0 || x === ROOM_W - 1 || y === ROOM_H - 1;
        ctx.fillStyle = wall ? (y < 2 ? (y === 0 ? '#2a2236' : '#3a3048') : '#241c30') : (x + y) % 2 ? '#7a5a3a' : '#6e5034';
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
        if (!wall) { ctx.fillStyle = '#5a3e26'; ctx.fillRect(x * TILE, y * TILE + 15, TILE, 1); }
      }
      ctx.fillStyle = '#4a3e5a'; ctx.fillRect(0, 2 * TILE - 3, W, 3); // skirting
      // doors to the previous and next rooms
      const doorway = (d, label) => { ctx.fillStyle = '#1a1424'; ctx.fillRect(d.x * TILE + 2, (d.y + 1) * TILE - 3, TILE - 4, 3); ctx.fillStyle = PAL.amber; ctx.fillRect(d.x * TILE + 6, (d.y + 1) * TILE - 2, 4, 1); ctx.fillStyle = '#ffd98a99'; ctx.font = '6px monospace'; ctx.fillText(label, d.x * TILE + 1, (d.y + 1) * TILE - 5); };
      if (pos.room > 0) doorway(DOOR_IN, '<');
      if (pos.room < rooms.length - 1) doorway(DOOR_OUT, '>');
      // furniture with a numbered plaque
      for (const s of room.stops) {
        drawSprite(ctx, FURNITURE[s.kind] || FURNITURE.chest, s.x * TILE, s.y * TILE - 2);
        const here = s.sx === pos.x && s.sy === pos.y;
        ctx.fillStyle = here ? PAL.gold : '#0f1420cc'; ctx.fillRect(s.x * TILE + 11, s.y * TILE - 3, 7, 7);
        ctx.fillStyle = here ? '#0f1420' : '#ffe39a'; ctx.font = '6px monospace'; ctx.fillText(String((s.n + 1) % 100), s.x * TILE + (s.n + 1 > 9 ? 11 : 13), s.y * TILE + 3);
      }
      // lamp light around the Keeper
      const px = pos.x * TILE + 8, py = pos.y * TILE + 6;
      const flick = lit ? 0.04 * Math.sin(t * 9) : 0;
      const g = ctx.createRadialGradient(px, py, 6, px, py, 70);
      g.addColorStop(0, `rgba(255,217,138,${0.18 + flick})`); g.addColorStop(1, 'rgba(10,8,20,0.35)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // the Keeper
      const tmp = document.createElement('canvas'); tmp.width = 12; tmp.height = 16; drawSprite(tmp.getContext('2d'), KEEPER, 0, 0);
      ctx.save();
      if (pos.face < 0) { ctx.translate(pos.x * TILE + 14, 0); ctx.scale(-1, 1); ctx.drawImage(tmp, 0, pos.y * TILE - 2); } else ctx.drawImage(tmp, pos.x * TILE + 2, pos.y * TILE - 2);
      ctx.restore();
    };
    if (!lit || reducedMotion()) { draw(0); return undefined; }
    let raf = 0, last = 0; const start = performance.now();
    const tick = (now) => { if (now - last > 90) { last = now; draw((now - start) / 1000); } raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [rooms, pos.room, pos.x, pos.y, pos.face, lit]);
}

export default function PalaceRoom({ palace, onClose, onFurniture }) {
  const rooms = useMemo(() => layoutPalace(palace.loci, palace.furniture), [palace.loci.join('\n'), (palace.furniture || []).join()]);
  const [pos, setPos] = useState(() => standAt(rooms, 0));
  const [quiz, setQuiz] = useState(false);
  const [score, setScore] = useState({ right: 0, asked: 0 });
  const [answer, setAnswer] = useState(null);
  const ref = useRef(null);
  const wrap = useRef(null);
  useRoomCanvas(ref, rooms, pos, true);
  const here = stopAt(rooms[pos.room], pos.x, pos.y);
  const move = (dx, dy) => { setAnswer(null); setPos((p) => step(rooms, p, dx, dy)); };
  const goStop = (n) => { setAnswer(null); setPos(standAt(rooms, Math.max(0, Math.min(palace.loci.length - 1, n)))); };

  useEffect(() => {
    const el = wrap.current; if (!el) return undefined;
    const key = (e) => {
      const k = e.key;
      const d = { ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0], ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1] }[k];
      if (d && e.target === el) { e.preventDefault(); move(...d); }
      else if ((k === ']' || k === 'n') && e.target === el) goStop((here?.n ?? -1) + 1);
      else if ((k === '[' || k === 'p') && e.target === el) goStop((here?.n ?? 1) - 1);
    };
    el.addEventListener('keydown', key);
    return () => el.removeEventListener('keydown', key);
  }, [here?.n, rooms]);
  useEffect(() => onPad((b) => {
    if (b === 'left') move(-1, 0); else if (b === 'right') move(1, 0); else if (b === 'up') move(0, -1); else if (b === 'down') move(0, 1);
    else if (b === 'r1') goStop((here?.n ?? -1) + 1); else if (b === 'l1') goStop((here?.n ?? 1) - 1);
  }), [here?.n, rooms]);

  const q = quiz && here ? nextStopQuestion(palace.loci, here.n, palace.loci.length) : null;
  function choose(opt) {
    if (!q || answer) return;
    const ok = opt === q.answer;
    setAnswer({ ok, opt });
    setScore((s) => ({ right: s.right + (ok ? 1 : 0), asked: s.asked + 1 }));
  }

  return (
    <section className="card palace-room">
      <div className="row between wrap">
        <h3 className="panel-title">Walk: {palace.name}</h3>
        <span className="muted small">Room {pos.room + 1} of {rooms.length}</span>
      </div>
      <div ref={wrap} className="room-stage" tabIndex={0} role="application" aria-label={`Palace room. Use the arrow keys to walk. ${here ? `You are at stop ${here.n + 1}: ${here.name}.` : 'Walk to a stop.'}`}>
        <canvas ref={ref} className="px room-canvas" aria-hidden="true" />
      </div>
      <p className="room-here" role="status" aria-live="polite">{here ? <><b>Stop {here.n + 1}:</b> {here.name}</> : <span className="muted">Walk up to a piece of furniture to see its stop.</span>}</p>
      {here && onFurniture && (
        <label className="field small room-pick">Furniture at this stop
          <select value={here.kind} onChange={(e) => onFurniture(here.n, e.target.value === furnitureFor(here.name) ? null : e.target.value)}>
            {FURNITURE_KINDS.map((k) => <option key={k} value={k}>{k === furnitureFor(here.name) ? `${k} (guessed)` : k}</option>)}
          </select>
        </label>
      )}
      <div className="room-pad" aria-label="Movement">
        <button className="btn small" aria-label="Walk up" onClick={() => move(0, -1)}>▲</button>
        <div className="row">
          <button className="btn small" aria-label="Walk left" onClick={() => move(-1, 0)}>◀</button>
          <button className="btn small" aria-label="Walk down" onClick={() => move(0, 1)}>▼</button>
          <button className="btn small" aria-label="Walk right" onClick={() => move(1, 0)}>▶</button>
        </div>
      </div>
      <div className="row wrap">
        <button className="btn small" onClick={() => goStop((here?.n ?? 1) - 1)}>Previous stop</button>
        <button className="btn small" onClick={() => goStop((here?.n ?? -1) + 1)}>Next stop</button>
        <label className="check small"><input type="checkbox" checked={quiz} onChange={(e) => { setQuiz(e.target.checked); setAnswer(null); }} /> Route check</label>
      </div>
      {quiz && (
        <div className="note room-quiz">
          {q ? (
            <>
              <p className="small">Which stop comes after <b>{here.name}</b>?</p>
              <div className="row wrap">{q.options.map((o) => <button key={o} className={`btn small${answer?.opt === o ? (answer.ok ? ' good' : ' bad') : ''}`} aria-pressed={answer?.opt === o} onClick={() => choose(o)}>{o}</button>)}</div>
              {answer && <p className="small" role="status">{answer.ok ? 'Right. Walk on to it.' : `Not quite: it is ${q.answer}.`} <button className="btn tiny" onClick={() => goStop(here.n + 1)}>Go there</button></p>}
            </>
          ) : <p className="small">{here ? 'This is the last stop.' : 'Stand at a stop to be asked what comes next.'}</p>}
          <p className="muted small">Route check: {score.right} of {score.asked} right. Practice only; it does not change your scores.</p>
        </div>
      )}
      <p className="muted small">Arrow keys or WASD to walk, [ and ] for previous and next stop. A game controller works too. Up to {PER_ROOM} stops per room; walk through the door on the right into the next room.</p>
      <button className="btn" onClick={onClose}>Leave the palace</button>
    </section>
  );
}
