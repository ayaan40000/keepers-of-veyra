// Game controller support (v0.8) through the standard Gamepad API. No network, no libraries.
// onPad(fn) calls fn(button) on each new press: 'up' 'down' 'left' 'right' 'a' 'b' 'l1' 'r1' 'start'.
// When nothing else listens, the app-wide default moves keyboard focus (d-pad / stick) and clicks (A) or goes back (B).
const MAP = { 12: 'up', 13: 'down', 14: 'left', 15: 'right', 0: 'a', 1: 'b', 4: 'l1', 5: 'r1', 9: 'start' };
const listeners = new Set();
let running = false;
let held = new Set();

function poll() {
  const pads = navigator.getGamepads?.() || [];
  const now = new Set();
  for (const gp of pads) {
    if (!gp) continue;
    gp.buttons.forEach((b, i) => { if (b.pressed && MAP[i]) now.add(MAP[i]); });
    const [x = 0, y = 0] = gp.axes;
    if (x < -0.6) now.add('left'); if (x > 0.6) now.add('right'); if (y < -0.6) now.add('up'); if (y > 0.6) now.add('down');
  }
  for (const b of now) if (!held.has(b)) emit(b);
  held = now;
  if (running) requestAnimationFrame(poll);
}

function emit(b) {
  const top = [...listeners].pop();
  if (top) { top(b); return; }
  defaultAction(b);
}

// Spatial-free default: walk the tab order. Good enough for menus, forms and drills.
function defaultAction(b) {
  const focusables = [...document.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea, [tabindex="0"], summary, a[href]')]
    .filter((el) => el.offsetParent !== null);
  const i = focusables.indexOf(document.activeElement);
  if (b === 'down' || b === 'right') focusables[Math.min(focusables.length - 1, i + 1)]?.focus();
  else if (b === 'up' || b === 'left') focusables[Math.max(0, i - 1)]?.focus();
  else if (b === 'a') document.activeElement?.click?.();
  else if (b === 'b') document.querySelector('.menu-sheet-wrap')?.click();
}

export function startGamepads() {
  if (typeof window === 'undefined' || !('getGamepads' in navigator)) return;
  window.addEventListener('gamepadconnected', () => { if (!running) { running = true; requestAnimationFrame(poll); } });
  window.addEventListener('gamepaddisconnected', () => { if (!(navigator.getGamepads?.() || []).some(Boolean)) running = false; });
}

// A screen that wants the raw buttons (the palace room) takes them while it is mounted.
export function onPad(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
