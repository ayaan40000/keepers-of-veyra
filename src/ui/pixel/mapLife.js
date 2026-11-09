// Life on the painted world map (Part B, Nov 8, 2026): small code-drawn movers on top of the painted city.
// Everything is drawn in the painting's own pixels (k = painting pixels per code-map pixel, 3 for 720x960),
// so the movers are as fine as the paint. Townsfolk, smoke and lanterns appear only in restored districts:
// restoring a district visibly brings its people back. Pure drawing; no state is kept between frames.
import { ROUTE, LANDMARKS, DISTRICT_IDS, SEA_Y, MAP_W } from './world.js';

const FOLK = [['#e8b04b', '#5a3a2a'], ['#7fb3a6', '#2a3045'], ['#c45a4a', '#3b2a22'], ['#b8c2d6', '#41324a'], ['#d9c27a', '#2f3b2a']];
const SKIN = ['#f0c9a0', '#c98e62', '#8a5a3c', '#e3b48a'];

// A point a fraction u (0..1) of the way along a street polyline.
export function along(path, u) {
  let total = 0;
  const lens = [];
  for (let i = 0; i < path.length - 1; i++) { const l = Math.hypot(path[i + 1][0] - path[i][0], path[i + 1][1] - path[i][1]); lens.push(l); total += l; }
  let d = Math.max(0, Math.min(1, u)) * total;
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) { const f = lens[i] ? Math.min(1, d / lens[i]) : 0; return [path[i][0] + (path[i + 1][0] - path[i][0]) * f, path[i][1] + (path[i + 1][1] - path[i][1]) * f, path[i + 1][0] >= path[i][0] ? 1 : -1]; }
    d -= lens[i];
  }
  return [path[0][0], path[0][1], 1];
}

function person(ctx, x, y, k, t, n, dir) {
  const [coat, legs] = FOLK[n % FOLK.length];
  const s = Math.max(1, Math.round(k / 2));                // one person pixel; 2 at 720 wide
  const step = Math.floor(t * 6 + n) % 2;
  const X = Math.round(x), Y = Math.round(y);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(X - s, Y, 4 * s, s);                       // shadow
  ctx.fillStyle = legs; ctx.fillRect(X, Y - 2 * s, s, 2 * s - (step ? s : 0)); ctx.fillRect(X + 2 * s, Y - 2 * s, s, 2 * s - (step ? 0 : s));
  ctx.fillStyle = coat; ctx.fillRect(X, Y - 5 * s, 3 * s, 3 * s);
  ctx.fillStyle = SKIN[n % SKIN.length]; ctx.fillRect(X + (dir < 0 ? 0 : s), Y - 7 * s, 2 * s, 2 * s); // head, turned the way they walk
  if (n % 3 === 0) { ctx.fillStyle = '#ffd98a'; ctx.fillRect(X + (dir > 0 ? 3 : -1) * s, Y - 4 * s, s, s); } // a hand lantern
}

// Townsfolk walking their district's street, back and forth, only where the district is restored.
// routes: one street polyline per district in map units (the code map's ROUTE by default); L: district boxes, used
// for a short stroll along the foot of the district when a district has no route (the painted map).
export function drawFolk(ctx, states, t, k, L = LANDMARKS, routes = ROUTE) {
  DISTRICT_IDS.forEach((id, i) => {
    const s = L[id];
    const path = routes ? routes[i] : s && [[s.x0 - 3, s.y0 + s.h + 1], [s.x0 + s.w + 3, s.y0 + s.h + 1]];
    if (states[id] !== 'restored' || !path) return;
    for (let n = 0; n < 3; n++) {
      const speed = 0.018 + ((i * 7 + n * 3) % 5) * 0.004;
      const ph = (t * speed + n * 0.37 + i * 0.13) % 2;
      const u = ph < 1 ? ph : 2 - ph;
      const [x, y, d] = along(path, u);
      person(ctx, x * k - k, y * k + Math.round(k * 0.6), k, t, i * 3 + n, ph < 1 ? d : -d);
    }
  });
}

// Small sailing boats drifting across the harbour; more of them once the Quay (M1) is restored.
// seaY: where open water starts, in map units (SEA_Y on the code map; the painted map gives its own).
export function drawBoats(ctx, states, t, k, W, seaY = SEA_Y) {
  const n = states.M1 === 'restored' ? 4 : 2;
  for (let b = 0; b < n; b++) {
    const y = Math.round((seaY + 9 + b * 6) * k);
    const sp = 2.2 + b * 0.9;
    const x = Math.round(((t * sp * (b % 2 ? -1 : 1) + b * 211) % (W + 60) + (W + 60)) % (W + 60) - 30);
    const bob = Math.round(Math.sin(t * 1.4 + b) * 1);
    ctx.fillStyle = '#3b2a22'; ctx.fillRect(x - 6, y + bob, 13, 2); ctx.fillRect(x - 4, y + 2 + bob, 9, 1);
    ctx.fillStyle = '#efe6d2'; for (let r = 0; r < 8; r++) ctx.fillRect(x, y - 9 + r + bob, 1 + Math.floor(r * 0.7), 1);
    ctx.fillStyle = '#6b4a32'; ctx.fillRect(x - 1, y - 10 + bob, 1, 10);
    if (states.M1 === 'restored') { ctx.fillStyle = '#ffd98a'; ctx.fillRect(x + 5, y - 2 + bob, 1, 1); }
    ctx.fillStyle = 'rgba(184,194,214,0.35)'; ctx.fillRect(x - 9 + (Math.floor(t * 3 + b) % 3), y + 3, 4, 1); // wake
  }
}

// Birds flapping over the ridge.
export function drawBirds(ctx, t, k, W) {
  ctx.fillStyle = '#0a0c13';
  for (let b = 0; b < 5; b++) {
    const x = Math.round(((t * (9 + b * 2.5) + b * 157) % (W + 40)) - 20);
    const y = Math.round((14 + (b % 3) * 6) * k + Math.sin(t * 0.8 + b * 2) * 4);
    const up = Math.floor(t * 5 + b) % 2;
    ctx.fillRect(x, y, 1, 1);
    ctx.fillRect(x - 2, y - (up ? 1 : -1), 2, 1); ctx.fillRect(x + 1, y - (up ? 1 : -1), 2, 1);
    ctx.fillRect(x - 3, y - (up ? 2 : -1), 1, 1); ctx.fillRect(x + 3, y - (up ? 2 : -1), 1, 1);
  }
}

// Chimney smoke: two thin plumes per restored district, drifting up and to the right, fading.
export function drawSmoke(ctx, states, t, k, L = LANDMARKS) {
  DISTRICT_IDS.forEach((id, i) => {
    const s = L[id];
    if (states[id] !== 'restored' || !s) return;
    for (let c = 0; c < 2; c++) {
      const x0 = (c ? s.x0 - 8 : s.x0 + s.w + 6) * k, y0 = (s.y0 + s.h * 0.35) * k;
      if (x0 < 4 || x0 > MAP_W * k - 4) continue;
      for (let p = 0; p < 6; p++) {
        const a = ((t * 0.35 + p / 6 + i * 0.21 + c * 0.5) % 1);
        const x = Math.round(x0 + a * 10 + Math.sin(t * 1.3 + p + i) * 2), y = Math.round(y0 - a * 26);
        ctx.fillStyle = `rgba(200,206,220,${(0.42 * (1 - a)).toFixed(2)})`;
        const sz = 1 + Math.floor(a * 3);
        ctx.fillRect(x, y, sz, sz);
      }
    }
  });
}

// Lanterns found in the painting (bright warm spots, from motion.py) flicker where the city is restored.
// isOn(x, y) says whether that spot shows the restored picture.
export function drawLanterns(ctx, lamps, t, isOn) {
  for (let i = 0; i < lamps.length; i++) {
    const [x, y] = lamps[i];
    if (!isOn(x, y)) continue;
    const f = Math.sin(t * 9 + i * 1.7) + Math.sin(t * 4.1 + i * 0.6) * 0.6;
    if (f > 0.9) { ctx.fillStyle = 'rgba(255,240,190,0.85)'; ctx.fillRect(x, y, 1, 1); ctx.fillStyle = 'rgba(255,217,138,0.35)'; ctx.fillRect(x - 1, y - 1, 3, 3); }
    else if (f < -0.9) { ctx.fillStyle = 'rgba(40,24,10,0.45)'; ctx.fillRect(x, y, 1, 1); }
  }
}
