// Detailed facial features for larger portraits (review samples, Nov 2 2026). Same face spec as faces.js; only the eyes,
// brows, nose and lips are drawn at their true size instead of as 1 to 3 pixel marks, so the features that tell
// people apart (eye shape, nose type, lip shape, brow shape) can be seen. Used by renderFaceSpec(sp, size, { hd: true }).
import { SKIN_TONES, EYE_COLORS, hexInt as H, mixColor as mix } from './faces.js';

const DARK = 0x1b1222;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// ------------------------------------------------------------------ eyes
const EYE_SHAPE = { // w: width in face units, up/down: lid heights as a share of width, tilt: outer corner lift (units)
  almond: { w: 5.0, up: 0.34, dn: 0.17, tilt: 0.2 },
  round: { w: 4.8, up: 0.42, dn: 0.3, tilt: 0 },
  upturned: { w: 5.0, up: 0.3, dn: 0.16, tilt: 0.9 },
  downturned: { w: 5.0, up: 0.32, dn: 0.18, tilt: -0.8 },
  hooded: { w: 5.0, up: 0.24, dn: 0.17, tilt: 0, hood: true },
  monolid: { w: 5.4, up: 0.2, dn: 0.13, tilt: 0.35, mono: true },
  deepset: { w: 4.8, up: 0.3, dn: 0.18, tilt: 0, deep: true },
  large: { w: 5.6, up: 0.42, dn: 0.26, tilt: 0.1 },
};
export function drawEyesHD(F) {
  const { G, sp, put, skinTo, shade, isSkin, mood, LAB } = F;
  const { k, cx, eyeY } = G;
  const shape = EYE_SHAPE[sp.eyeShape] || EYE_SHAPE.almond;
  const EC = (EYE_COLORS.find((e) => e.name === sp.eyeColor) || EYE_COLORS[0]).c.map(H);
  const skinT = SKIN_TONES[sp.skin] || SKIN_TONES[3];
  const darkSkin = sp.skin >= 6;
  const WHITE = H(darkSkin ? '#ece2d8' : '#f8f2ec'), WHITE_SH = H(darkSkin ? '#b8a8a0' : '#d4c8c2');
  const LASH = mix(H('#140c10'), H(skinT.ramp[0]), 0.12);
  const ew = Math.round(shape.w * k);
  let up = shape.up * ew, dn = shape.dn * ew;
  if (mood === 'smile' || mood === 'sly') { up *= 0.7; dn *= 0.75; }
  const ecy = eyeY + 0.6 * k; // the line between the lids
  const sep = sp.eyeSep * k;
  const tilt = shape.tilt * k;
  const ir = Math.max(2.2, ew * 0.25); // iris radius: the upper lid covers its top, so eyes do not stare
  const gaze = (sp.gaze || 0) * 0.6 * k;
  let x0Left = 0;
  for (const side of [-1, 1]) {
    const ecx = cx + side * sep; // eye centre
    const xl = Math.round(ecx - ew / 2);
    if (side < 0) x0Left = xl;
    const icx = ecx + gaze * 1 + side * 0.15 * k; // irises sit a touch toward the nose... mirrored
    const icy = ecy - (up - dn) / 2 - 0.3 * k; // centred in the opening, tucked a little under the upper lid
    const topAt = [], botAt = [];
    for (let c = 0; c < ew; c++) {
      const t = (c + 0.5) / ew; // 0..1 across the eye, left to right on screen
      const outer = side < 0 ? 1 - t : t; // 1 at the outer corner
      const lift = tilt * (outer - 0.5) * 2 * 0.5;
      const s = Math.sin(Math.PI * t);
      topAt[c] = ecy - up * Math.pow(s, 0.75) - lift;
      botAt[c] = ecy + dn * Math.pow(s, 0.9) - lift * 0.6;
    }
    // socket, crease and lid shading
    for (let c = 0; c < ew; c++) {
      const x = xl + c, top = Math.floor(topAt[c]);
      if (shape.deep) for (let j = 1; j <= Math.round(1.2 * k); j++) shade(x, top - j, -1);
      if (shape.hood) { for (let j = 1; j <= Math.round(0.7 * k); j++) skinTo(x, top - j, 1); }
      else if (!shape.mono && c > 0 && c < ew - 1) skinTo(x, top - Math.round(0.9 * k), 1); // crease
    }
    // white, iris, pupil
    for (let c = 0; c < ew; c++) {
      const x = xl + c;
      const yt = Math.ceil(topAt[c]), yb = Math.floor(botAt[c]);
      for (let y = yt; y <= yb; y++) {
        const dx = x + 0.5 - icx, dy = y + 0.5 - icy;
        const d = Math.hypot(dx, dy);
        let color;
        if (d <= ir) {
          const pupil = d <= ir * 0.42;
          color = pupil ? H('#0c0a10') : y - yt < Math.max(1, k * 0.4) ? EC[0] : d > ir - 0.9 ? EC[0] : dy > ir * 0.3 ? EC[2] : EC[1];
        } else color = y === yt || (x + 0.5 - icx) * side > ir + 1.5 ? WHITE_SH : WHITE;
        put(x, y, color, LAB.EYE);
      }
    }
    // catchlight
    const hx = Math.round(icx - ir * 0.4), hy = Math.round(icy - ir * 0.45);
    put(hx, hy, H('#fffaf2'), LAB.EYE);
    if (k > 2.4) put(hx + 1, hy, H('#fffaf2'), LAB.EYE);
    // upper lid line (lashes), thicker toward the outer corner; lower lid soft
    for (let c = 0; c < ew; c++) {
      const x = xl + c, t = (c + 0.5) / ew, outer = side < 0 ? 1 - t : t;
      const y = Math.ceil(topAt[c]) - 1;
      put(x, y, LASH, LAB.FEAT);
      if (outer > 0.45 && k > 2) put(x, y - 1, mix(LASH, H(skinT.ramp[1]), 0.45), LAB.FEAT);
      const yb = Math.floor(botAt[c]) + 1;
      if (isSkin(x, yb)) skinTo(x, yb, outer > 0.2 && outer < 0.9 ? 1 : 2);
    }
    // outer lash flick
    const ox = side < 0 ? xl - 1 : xl + ew;
    const oy = Math.round(side < 0 ? topAt[0] : topAt[ew - 1]);
    put(ox, oy, LASH, LAB.FEAT);
    if (sp.lashes) { put(ox + (side < 0 ? -1 : 1), oy - 1, LASH, LAB.FEAT); put(ox, oy - 1, LASH, LAB.FEAT); }
    // inner corner (tear duct)
    const ix = side < 0 ? xl + ew - 1 : xl;
    put(ix, Math.round(ecy), mix(H(skinT.lip), WHITE, 0.4), LAB.EYE);
  }
  F.eye = { x0: x0Left, ew, open: Math.max(2, Math.round(up + dn)) };
}

// ------------------------------------------------------------------ brows
export function drawBrowsHD(F) {
  const { G, sp, put, mood, HR, LAB } = F;
  const { k, cx, eyeY } = G;
  const shape = sp.browShape || 'straight';
  const eye = F.eye;
  const sep = sp.eyeSep * k;
  const browCol = sp.browColor ? H(sp.browColor) : HR[sp.hairColor === 'white' || sp.hairColor === 'grey' ? 2 : 1];
  const browDark = sp.browColor ? mix(H(sp.browColor), DARK, 0.35) : HR[sp.hairColor === 'white' || sp.hairColor === 'grey' ? 1 : 0];
  const baseThick = (sp.browThick || 1) * 0.9 * k * (shape === 'bushy' ? 1.45 : shape === 'thin' ? 0.55 : 1);
  const len = Math.round(eye.ew + 1.4 * k);
  const by = eyeY - (sp.browGap || 3) * k * 0.85 - 0.6 * k; // inner end, bottom edge
  for (const side of [-1, 1]) {
    const xin = Math.round(cx + side * (sep - eye.ew / 2 + 0.3 * k)); // inner end
    for (let i = 0; i < len; i++) {
      const t = i / Math.max(1, len - 1); // 0 inner, 1 outer
      let off = 0;
      if (shape === 'arched') off = -Math.sin(Math.min(1, t * 1.35) * Math.PI * 0.85) * 1.4 * k + (t > 0.85 ? 0.8 * k : 0);
      if (shape === 'angled') off = t < 0.65 ? -t * 2.2 * k : -1.43 * k + (t - 0.65) * 3 * k;
      if (shape === 'soft') off = t * 0.9 * k;
      if (shape === 'thin') off = -Math.sin(t * Math.PI) * 1.1 * k;
      if (shape === 'straight' || shape === 'bushy' || shape === 'unibrow') off = t > 0.85 ? 0.5 * k : 0;
      if (mood === 'worried') off += -(1 - t) * 1.4 * k + 0.4 * k;
      if (mood === 'stern') off += (1 - t) * 1.3 * k;
      if (mood === 'sly' && side > 0) off -= 0.8 * k;
      const taper = shape === 'bushy' ? 1 - t * 0.25 : t < 0.15 ? 0.85 : 1 - (t - 0.15) * 0.6;
      const th = Math.max(1, Math.round(baseThick * taper));
      const x = xin + side * -1 * -i; // walk outward from the inner end
      const xx = side < 0 ? xin - i : xin + i;
      for (let j = 0; j < th; j++) {
        const y = Math.round(by + off) - j;
        const hairy = (xx + j) % 3 === 0;
        put(xx, y, j === th - 1 && th > 2 ? browCol : hairy ? browCol : browDark, LAB.FEAT);
      }
      if (shape === 'bushy' && i % 2 === 1 && t > 0.1) put(xx, Math.round(by + off) - th, browCol, LAB.FEAT);
      void x;
    }
    if (sp.scar === 'brow' && side < 0) { const sx = xin - Math.round(len * 0.55); for (let j = -1; j <= Math.round(baseThick) + 1; j++) F.skinPut(sx, Math.round(by) - j, 3); }
  }
  if (shape === 'unibrow') {
    const yl = Math.round(by) - 1;
    for (let x = Math.round(cx - sep + eye.ew / 2); x <= Math.round(cx + sep - eye.ew / 2); x++) put(x, yl, browCol, LAB.FEAT);
  }
}

// ------------------------------------------------------------------ nose
const NOSE = { // tip half-width, nostril size, bridge strength, wing spread (all in face units)
  button: { tip: 1.1, nos: 0.55, bridge: 0.35, wing: 1.5, up: 0.4 },
  straight: { tip: 1.0, nos: 0.5, bridge: 1, wing: 1.6 },
  wide: { tip: 1.5, nos: 0.75, bridge: 0.7, wing: 2.3 },
  hooked: { tip: 1.0, nos: 0.5, bridge: 1, wing: 1.6, hook: true, down: 0.5 },
  long: { tip: 0.95, nos: 0.45, bridge: 1, wing: 1.5, down: 0.6 },
  snub: { tip: 1.1, nos: 0.7, bridge: 0.3, wing: 1.6, up: 0.9 },
  broad: { tip: 1.6, nos: 0.8, bridge: 0.55, wing: 2.5 },
  roman: { tip: 1.05, nos: 0.5, bridge: 1, wing: 1.7, bump: true },
};
export function drawNoseHD(F) {
  const { G, sp, skinTo, skinPut, put, LAB } = F;
  const { k, cx, eyeY, noseY } = G;
  const n = NOSE[sp.nose] || NOSE.straight;
  const skinT = SKIN_TONES[sp.skin] || SKIN_TONES[3];
  const tipY = noseY - 0.6 * k + (n.down || 0) * k - (n.up || 0) * 0.4 * k;
  const top = eyeY + 0.2 * k + (1 - n.bridge) * (noseY - eyeY) * 0.6;
  // bridge: shadow on the right, highlight on the left
  for (let y = Math.round(top); y < Math.round(tipY - n.tip * k * 0.6); y++) {
    const t = (y - top) / Math.max(1, tipY - top);
    let xs = cx + 0.6 * k + t * 0.4 * k;
    if (n.bump && t > 0.3 && t < 0.65) xs += 0.6 * k;
    if (n.hook && t > 0.45) xs += 0.5 * k;
    skinTo(Math.round(xs), y, 1);
    if (n.bridge > 0.6 && t > 0.15) skinTo(Math.round(xs) + 1, y, 2);
    if (n.bridge >= 0.7 && t > 0.1) skinPut(Math.round(cx - 0.9 * k), y, 3);
  }
  // tip: a lit ball
  const tr = n.tip * k;
  for (let y = Math.floor(tipY - tr); y <= Math.ceil(tipY + tr * 0.7); y++) for (let x = Math.floor(cx - tr - 1); x <= Math.ceil(cx + tr + 1); x++) {
    const dx = (x + 0.5 - cx) / tr, dy = (y + 0.5 - tipY) / tr;
    const d = dx * dx + dy * dy;
    if (d > 1) continue;
    const lit = -dx * 0.6 - dy * 0.7;
    skinPut(x, y, lit > 0.45 ? 4 : lit > -0.1 ? 3 : 2);
  }
  // under the tip and the nostrils
  const ny = Math.round(tipY + tr * 0.75);
  for (let x = Math.round(cx - tr); x <= Math.round(cx + tr); x++) skinTo(x, ny, 1);
  for (const side of [-1, 1]) {
    const nx = cx + side * (tr * 0.75 + n.nos * k * 0.6);
    const rx = n.nos * k, ry = Math.max(0.6, n.nos * k * (n.up ? 0.75 : 0.5));
    for (let y = Math.floor(ny - ry); y <= Math.ceil(ny + ry); y++) for (let x = Math.floor(nx - rx); x <= Math.ceil(nx + rx); x++) {
      const dx = (x + 0.5 - nx) / rx, dy = (y + 0.5 - ny) / ry;
      if (dx * dx + dy * dy <= 1) put(x, y, mix(H(skinT.ramp[0]), DARK, 0.35), LAB.FEAT);
    }
    // alar wing: a curved crease around the nostril
    const wx = cx + side * n.wing * k;
    for (let a = 0; a < 6; a++) {
      const ang = Math.PI * (0.15 + a * 0.13);
      const x = Math.round(wx - side * Math.cos(ang) * 0.9 * k * 0.6), y = Math.round(ny - Math.sin(ang) * 1.3 * k);
      skinTo(x, y, side < 0 ? 2 : 1);
    }
  }
  // cast shadow below, to the lower right
  for (let x = Math.round(cx - 0.3 * k); x <= Math.round(cx + tr + 0.6 * k); x++) skinTo(x, ny + 1, 1);
}

// ------------------------------------------------------------------ mouth
const LIPS = { neutral: [0.7, 1.0], smile: [0.6, 0.9], thin: [0.3, 0.45], full: [1.15, 1.5], wide: [0.65, 0.95], small: [0.7, 1.0], down: [0.6, 0.9], grin: [0.5, 0.7], smirk: [0.6, 0.9] };
export function drawMouthHD(F) {
  const { G, sp, put, skinTo, isSkin, mood, LAB } = F;
  const { k, cx, mouthY } = G;
  let m = sp.mouth || 'neutral';
  if (mood === 'smile') m = sp.moodMouth?.smile || (m === 'grin' ? 'grin' : 'smile');
  if (mood === 'worried') m = 'down';
  if (mood === 'stern') m = 'thin';
  if (mood === 'sly') m = 'smirk';
  const skinT = SKIN_TONES[sp.skin] || SKIN_TONES[3];
  const lip = sp.lipColor ? H(sp.lipColor) : H(skinT.lip);
  const lipDark = mix(lip, DARK, 0.3), lipLight = mix(lip, H(skinT.ramp[4]), 0.35);
  const line = mix(lip, H('#1e0e10'), 0.6);
  let w = (sp.mouthW || 6) * k * 1.05;
  if (m === 'wide' || m === 'grin') w = Math.max(w, 8 * k);
  if (m === 'small') w = Math.min(w, 4.4 * k);
  const hw = w / 2;
  const [uh, lh] = (LIPS[m] || LIPS.neutral).map((v) => v * k);
  const y0 = mouthY + 0.3 * k;
  const curve = (t) => { // corner lift for the mouth line, t from -1 (left) to 1 (right)
    const a = Math.abs(t);
    if (m === 'smile' || m === 'grin') return -Math.pow(a, 2.2) * 1.3 * k;
    if (m === 'down') return Math.pow(a, 2.2) * 1.0 * k;
    if (m === 'smirk') return t > 0 ? -Math.pow(a, 2) * 1.4 * k : Math.pow(a, 3) * 0.3 * k;
    return Math.pow(a, 3) * 0.3 * k;
  };
  for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw); x++) {
    const t = (x + 0.5 - cx) / hw;
    if (Math.abs(t) > 1) continue;
    const a = Math.abs(t);
    const yl = y0 + curve(t);
    // upper lip with a cupid's bow
    const bow = a < 0.22 ? 0.35 * k * (1 - a / 0.22) : 0;
    const upH = uh * Math.pow(Math.max(0, 1 - Math.pow(a, 2.5)), 0.6) - bow * 0.6;
    for (let y = Math.round(yl - upH); y < Math.round(yl); y++) put(x, y, x < cx ? lip : lipDark, LAB.FEAT);
    if (upH >= 1) skinTo(x, Math.round(yl - upH) - 1, 2);
    // lower lip, highlight on the left
    const loH = lh * Math.pow(Math.max(0, 1 - Math.pow(a, 2)), 0.7);
    for (let y = Math.round(yl) + 1; y <= Math.round(yl + loH); y++) {
      const hl = y === Math.round(yl) + 1 + Math.floor(loH * 0.3) && t < -0.05 && t > -0.6;
      put(x, y, hl ? lipLight : x < cx ? lip : lipDark, LAB.FEAT);
    }
    if (isSkin(x, Math.round(yl + loH) + 1) && a < 0.8) skinTo(x, Math.round(yl + loH) + 1, 1);
    // the mouth line, with teeth for a grin
    if (m === 'grin' && a < 0.8) { put(x, Math.round(yl), H('#f2ece2'), LAB.FEAT); put(x, Math.round(yl) - 1, line, LAB.FEAT); put(x, Math.round(yl) + 1, line, LAB.FEAT); }
    else put(x, Math.round(yl), a > 0.85 ? mix(line, H(skinT.ramp[1]), 0.4) : line, LAB.FEAT);
  }
  // corners and philtrum
  for (const s of [-1, 1]) { const x = Math.round(cx + s * (hw + 0.4)), y = Math.round(y0 + curve(s)); skinTo(x, y, 1); if (m === 'smile' || m === 'grin' || (m === 'smirk' && s > 0)) skinTo(x + s, y - Math.round(k), 1); }
  for (let y = Math.round(y0 - uh) - Math.round(1.6 * k); y < Math.round(y0 - uh) - 1; y++) skinTo(Math.round(cx + 0.5 * k), y, 2);
  F.mouth = { xl: Math.round(cx - hw), xr: Math.round(cx + hw), y: Math.round(y0) };
}
export { clamp };
