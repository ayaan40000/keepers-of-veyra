// End-to-end: onboarding -> day 1 -> reload persistence -> day 2 with delayed recall -> progress -> export -> delete -> import.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const FILE = 'file://' + path.resolve('dist-single/index.html');
const OUT = process.env.SHOTS || '/tmp/claude-0/shots';
fs.mkdirSync(OUT, { recursive: true });
const MAJOR = { single: ['zoo','tea','knee','home','ray','law','shoe','cow','ivy','bee'] };
const log = (...a) => console.log('[e2e]', ...a);
const errors = [];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('dialog', (d) => d.accept());
// Grouped relic unlocks (v0.6) appear as a modal; accept them whenever they show up.
await page.addLocatorHandler(page.getByRole('dialog', { name: 'New relics' }), async () => { await page.getByRole('button', { name: 'Wonderful', exact: true }).click(); });

const btn = (name) => page.getByRole('button', { name, exact: true });
const visible = async (name) => (await btn(name).count()) > 0 && (await btn(name).first().isVisible());
// Main navigation: phones keep Relics, Palaces and Keeper inside the Menu sheet.
async function nav(name) {
  const b = page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name, exact: true });
  if (await b.count() && await b.first().isVisible()) { await b.first().click(); return; }
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.getByRole('dialog', { name: 'Menu' }).getByRole('button', { name, exact: true }).click();
}
let shot = 0;
const snap = async (n) => page.screenshot({ path: `${OUT}/${String(++shot).padStart(2, '0')}-${n}.png`, fullPage: true });

async function overflowCheck(label) {
  const w = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (w > 1) errors.push(`horizontal overflow ${w}px on ${label}`);
}

// Drill memory captured at study time.
let mem = null;
async function captureStudy() {
  return page.evaluate(() => {
    const d = {};
    const pal = [...document.querySelectorAll('.word-grid.palace li')];
    if (pal.length) d.palace = Object.fromEntries(pal.map((li) => [li.querySelector('.locus').textContent, li.querySelector('b').textContent]));
    const words = [...document.querySelectorAll('.word-grid li b')].map((b) => b.textContent);
    if (words.length) d.words = words;
    const pairs = [...document.querySelectorAll('.stimulus .pair-list li')].map((li) => [li.children[0].textContent, li.children[2].textContent]);
    if (pairs.length) d.pairs = Object.fromEntries(pairs);
    const dig = [...document.querySelectorAll('.digits span')].map((s) => s.textContent).join('');
    if (dig) d.digits = dig;
    const faces = [...document.querySelectorAll('.stimulus .face-grid figure')].map((f) => [f.querySelector('canvas').toDataURL(), f.querySelector('figcaption').textContent]);
    if (faces.length) d.faces = Object.fromEntries(faces);
    return d;
  });
}
async function captureGuided(acc) {
  const g = await page.evaluate(() => {
    const big = document.querySelector('.guided-item .big');
    const svg = document.querySelector('.guided-item canvas');
    return { text: big?.innerText || '', svg: svg ? svg.toDataURL() : null, locus: document.querySelector('.guided-item .locus')?.textContent };
  });
  acc.items.push(g);
}

async function fillRecall(missOne) {
  const m = mem || {};
  const inputs = page.locator('.recall input[data-slot]');
  const n = await inputs.count();
  // Faces
  if (await page.locator('.recall .face-grid').count()) {
    const figs = page.locator('.recall .face-grid figure');
    for (let i = 0; i < await figs.count(); i++) {
      const svg = await figs.nth(i).locator('canvas').evaluate((c) => c.toDataURL());
      const name = m.faces?.[svg] || m.guidedFaces?.[svg] || '';
      await figs.nth(i).locator('input').fill(missOne && i === 0 ? '' : name);
    }
    return;
  }
  // Major (one at a time)
  if (await page.locator('.recall .big.mono').count() && n === 1 && !(await page.locator('.digits-in').count())) {
    for (let k = 0; k < 40; k++) {
      const cue = (await page.locator('.recall .big.mono').textContent()).trim();
      const word = cue.length === 1 ? MAJOR.single[+cue] : 'x';
      await page.locator('.recall input[data-slot]').fill(cue.length === 1 ? word : '');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(30);
      if (!(await page.locator('.recall').count())) return;
    }
    return;
  }
  if (await page.locator('.digits-in').count()) { await page.locator('.digits-in').fill(m.digits || ''); return; }
  const lis = page.locator('.recall .slot-list li, .recall .pair-list li');
  if (await lis.count()) {
    for (let i = 0; i < await lis.count(); i++) {
      const label = (await lis.nth(i).locator('span').first().textContent()).trim();
      let v = '';
      if (m.palace && m.palace[label]) v = m.palace[label];
      else if (m.pairs && m.pairs[label]) v = m.pairs[label];
      else if (m.words && /^\d+$/.test(label)) v = m.words[+label - 1];
      await lis.nth(i).locator('input').fill(missOne && i === 1 ? '' : v);
    }
    return;
  }
  const words = m.words || [];
  for (let i = 0; i < n; i++) await inputs.nth(i).fill(missOne && i === 0 ? '' : words[i] || '');
}

let scenesSeen = 0; // 1.2: full sessions from week 3 include a Real-life Scene
async function runSession(label, { missOne = true } = {}) {
  let guided = null, steps = 0;
  for (let i = 0; i < 400; i++) {
    await page.waitForTimeout(40);
    if (await page.locator('.recall .scene-questions').count()) scenesSeen++;
    if (await visible('Back to Today')) { await snap(`${label}-summary`); await overflowCheck(label + ' summary'); await btn('Back to Today').click(); return steps; }
    if (await page.locator('.stimulus').count()) {
      if (await page.locator('.guided-item').count()) {
        guided = guided || { items: [] };
        await captureGuided(guided);
        if (await visible('Next')) { await btn('Next').click(); continue; }
        if (await visible('Done studying')) {
          // Convert guided capture into memory.
          mem = { pairs: {}, palace: {}, words: [], faces: {}, guidedFaces: {} };
          for (const g of guided.items) {
            if (g.svg) { const name = g.text.trim(); mem.faces[g.svg] = name; continue; }
            if (g.text.includes('→')) { const [a, b] = g.text.split('→').map((s) => s.trim()); mem.pairs[a] = b; continue; }
            if (g.locus) { const loc = g.locus.replace(/:\s*$/, ''); mem.palace[loc] = g.text.replace(g.locus, '').trim(); continue; }
            if (/^\d+$/.test(g.text.trim())) { mem.digits = (mem.digits || '') + g.text.trim(); continue; }
            mem.words.push(g.text.trim());
          }
          guided = null; await btn('Done studying').click(); continue;
        }
      }
      const listB = await page.locator('text=List B').count();
      if (!listB) mem = await captureStudy();
      if (shot < 8) await snap(`${label}-study`);
      await btn("I'm ready").click(); continue;
    }
    if (await page.locator('.recall').count()) { await fillRecall(missOne); if (shot < 10) await snap(`${label}-recall`); if (await visible('Check answers')) await btn('Check answers').click(); steps++; continue; }
    if (await page.locator('.palace-editor').count() && await visible('Start from a suggested home route')) { await btn('Start from a suggested home route').click(); await btn('Save palace').click(); continue; }
    if (await page.locator('.reflect').count()) {
      await page.locator('.chip').first().click();
      await page.locator('.choice').first().click();
      await btn('Finish').click(); continue;
    }
    for (const b of ['Begin study', 'Begin recall', 'Begin', 'Start practice', 'Continue']) {
      if (await visible(b)) { if (b === 'Begin recall') mem = mem; await btn(b).click(); break; }
    }
  }
  throw new Error('session did not finish: ' + label);
}

// 1. Onboarding
await page.goto(FILE);
await btn('Start').click();
await page.getByLabel('Alias').fill('Tester');
await btn('Continue').click();
await snap('onboard-checklist');
await btn('Create my profile').click();
await page.waitForSelector('text=Day 1');
await snap('today-day1'); await overflowCheck('today');
log('profile created');

// 2. Day 1 baseline session
await btn('Begin').click();
const d1 = await runSession('day1');
log('day 1 complete, drills:', d1);
const doneText = await page.locator('h2').first().textContent();
log('today after day1:', doneText);

// 3. Reload persistence
await page.reload();
await page.waitForSelector("text=Today's training is done");
log('persistence after reload: OK');

// 4. Advance clock one day, run day 2 (with delayed recall probe)
await nav('Keeper');
await btn('Advance 1 day').click();
await nav('Today');
await page.waitForSelector('text=Begin day 2');
const dueTxt = await page.locator('text=delayed recall').count();
log('day 2 shows delayed recall due:', dueTxt > 0);
await btn('Begin day 2').click();
await runSession('day2', { missOne: false });
log('day 2 complete');

// 5. Jump to week 5 (palace) and week 9 (faces) and week 14 (major) to exercise templates
for (const w of [5, 9, 14]) {
  await nav('Keeper');
  await btn('Advance 1 day').click();
  await page.getByLabel('Jump curriculum to week').selectOption(String(w));
  await nav('Today');
  await btn(`Begin day ${(w - 1) * 7 + 1}`).click();
  await runSession('week' + w, { missOne: w !== 5 });
  log(`week ${w} session complete`);
}
log('real-life scenes walked:', scenesSeen);
if (scenesSeen < 2) throw new Error('expected a Real-life Scene in the week 5 and week 9 sessions');

// 6. Progress, Veyra, Palaces render
for (const t of ['Progress', 'Veyra', 'Palaces', 'Relics', 'Keeper']) {
  await nav(t);
  await page.waitForTimeout(150);
  await snap('tab-' + t.toLowerCase()); await overflowCheck(t);
}
await nav('Veyra');
for (const v of ['Quests', 'Trials', 'Chapters', 'People', 'Lore']) {
  await page.getByRole('tab', { name: v }).click();
  await page.waitForTimeout(100);
  if (v === 'Chapters') { await page.locator('details.chapter-read summary').first().click(); }
  if (v === 'Trials' && !(await page.getByTestId('trial-hall').count())) throw new Error('trial hall missing');
  await snap('veyra-' + v.toLowerCase()); await overflowCheck('veyra ' + v);
}
log('veyra journal tabs: OK', await page.locator('.card').count());
// Reliquary and the Undercroft
await nav('Relics');
log('relics owned:', (await page.locator('.relic-slot.have').count()));
const enter = page.getByRole('button', { name: /enter|descend/i }).first();
if (await enter.count()) { await enter.click(); await page.waitForTimeout(600); await snap('crypt-enter'); await overflowCheck('crypt'); log('crypt opened'); }
await page.reload(); await page.waitForSelector('nav');
await nav('Progress');
const score = await page.locator('.mts .score-big').textContent();
log('MTS shown:', score);

// 7. Export -> delete -> import
await nav('Keeper');
const [dl] = await Promise.all([page.waitForEvent('download'), btn('Export backup').click()]);
const backup = path.join(OUT, 'backup.json');
await dl.saveAs(backup);
const exported = JSON.parse(fs.readFileSync(backup, 'utf8'));
log('exported results:', exported.profile.results.length, 'day', exported.profile.progress.day);
await btn('Delete all data').click();
await btn('Delete everything').click();
await page.waitForSelector('text=I have a backup file');
await page.reload();
await page.waitForSelector('text=I have a backup file');
log('delete: OK (onboarding shown after reload)');
await page.setInputFiles('[data-testid="onboard-import"]', backup);
await page.waitForSelector('text=Training Grounds');
await nav('Progress');
const days = await page.locator('.mts .right').textContent();
log('after import:', days.replace(/\s+/g, ' '));

// 7b. v0.4-v0.7 phone checks: Crypt slot, Menu sheet, 150% text, beta tools
await nav('Crypt');
await page.waitForSelector('.crypt');
await overflowCheck('crypt tab');
await page.getByRole('button', { name: 'Back to Veyra', exact: true }).click();
await page.getByRole('button', { name: 'Menu', exact: true }).click();
if (!(await page.getByRole('dialog', { name: 'Menu' }).isVisible())) errors.push('menu sheet did not open');
await page.keyboard.press('Escape');
await nav('Keeper');
await page.getByLabel('Text size').selectOption('1.5');
for (const t of ['Today', 'Veyra', 'Progress', 'Relics', 'Keeper']) { await nav(t); await page.waitForTimeout(100); await overflowCheck(`${t} at 150% text`); }
await snap('keeper-150');
if (!(await page.getByRole('button', { name: 'Save anonymous report' }).count())) errors.push('anonymous report button missing');
await page.getByLabel('Text size').selectOption('1');
log('phone menu, crypt slot, 150% text: OK');

// 7c. v0.8: walk a palace, route check, keyboard shortcuts
await nav('Palaces');
const walk = page.getByRole('button', { name: 'Walk this palace' }).first();
if (await walk.count()) {
  await walk.click();
  const stage = page.locator('.room-stage');
  await stage.focus();
  const first = (await page.locator('.room-here').textContent()).trim();
  await page.getByRole('button', { name: 'Next stop', exact: true }).click();
  const second = (await page.locator('.room-here').textContent()).trim();
  if (first === second) errors.push('next stop did not move the keeper');
  await stage.focus(); await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowUp');
  await page.getByLabel('Route check').check();
  await page.locator('.room-quiz .btn').first().click();
  if (!(await page.locator('.room-quiz [role=status]').count())) errors.push('route check gave no answer');
  await snap('palace-room'); await overflowCheck('palace room');
  await page.getByRole('button', { name: 'Leave the palace', exact: true }).click();
  log('palace walk:', first, '->', second);
} else errors.push('no palace to walk');
await page.locator('body').click({ position: { x: 5, y: 300 } });
await page.keyboard.press('?');
if (!(await page.getByRole('dialog', { name: 'Keyboard keys' }).count())) errors.push('keyboard help did not open');
await page.getByRole('button', { name: 'Close', exact: true }).click();
await page.keyboard.press('5');
if (!(await page.locator('h1', { hasText: 'Reliquary' }).count())) errors.push('key 5 did not open Relics');
log('keyboard shortcuts: OK');


// 7d. 1.1 Your Own Text: add a Latin text and an Arabic text, learn a section, check it, and look for overflow
await nav('Keeper');
await page.getByLabel('Unlock all Training Grounds drills').check();
await nav('Field Guide');
await page.getByRole('button', { name: /^Open Your Shelf/ }).click();
if (!(await page.locator('h1', { hasText: 'Your Shelf' }).count())) errors.push('Your Shelf did not open');
const ownAdd = async (title, text) => {
  await btn('Add a text').click();
  await page.getByLabel('Title', { exact: true }).fill(title);
  await page.getByLabel('The text').fill(text);
  await btn('Cut it into pieces').click();
  await overflowCheck('own text split');
  await btn('Save to my shelf').click();
};
await ownAdd('Lamp verse', ['The lamp is lit above the stair,', 'a slow moth circles in the light,', 'the clock says nothing, being old,', 'and all the house is warm tonight.'].join('\n'));
await overflowCheck('own text page');
await page.getByRole('button', { name: 'Learn this section' }).first().click();
for (const s of ['Next step', 'Next step', 'Try it from nothing']) await btn(s).click();
for (const [i, l] of ['The lamp is lit above the stair,', 'a slow moth circles in the light,', 'the clock says nothing, being old,', 'and all the house is warm tonight.'].entries()) await page.getByLabel('Line ' + (i + 1), { exact: true }).fill(l);
await btn('Check').click();
if (!(await page.getByText('4 of 4 lines held.').count())) errors.push('own text check did not hold');
await overflowCheck('own text result');
await btn('Next').click();
await page.getByRole('button', { name: 'Back to your shelf' }).click();
const ar = String.fromCodePoint(0x628, 0x633, 0x645, 0x20, 0x627, 0x644, 0x644, 0x647, 0x20, 0x627, 0x644, 0x631, 0x62D, 0x645, 0x646);
await ownAdd('Arabic line', ar + '\n' + ar);
await page.getByRole('button', { name: 'Back to your shelf' }).click();
await snap('own-shelf'); await overflowCheck('own shelf');
const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('mnemos.profile')).own.texts.length);
if (stored !== 2) errors.push('own texts not saved: ' + stored);
await btn('Close Your Shelf').click();
log('your own text: OK');

// 7e. 1.3 The Keeper's Ledger: take it from Calder, start a book, write a card, meet it once
await nav('Field Guide');
await page.getByRole('button', { name: /^Open the Ledger/ }).click();
await btn('Take the Ledger').click();
await page.getByLabel('Name', { exact: true }).fill('Spanish words');
await btn('Start the book').click();
await page.getByLabel('Question or cue', { exact: true }).fill('casa');
await page.getByLabel('Answer', { exact: true }).fill('house');
await btn('Write it').click();
await overflowCheck('ledger book');
await btn('Back to the shelf').click();
await snap('ledger-shelf'); await overflowCheck('ledger shelf');
await btn('Ask me').click();
await btn('I have it').click();
await btn('Next').click();
if (!(await page.getByText('New cards written into memory.').count())) errors.push('ledger sitting did not finish');
await btn('Back to the shelf').click();
const lcards = await page.evaluate(() => JSON.parse(localStorage.getItem('mnemos.profile')).ledger.books[0].cards[0].s?.due);
if (!lcards) errors.push('ledger card not scheduled');
await btn('Back').click();
log('keeper\'s ledger: OK');

// 7f. 1.4 The Gloss at Ennick's desk
await nav('Today');
await page.getByRole('button', { name: "Go to Ennick's desk" }).click();
await btn('Begin').click();
await btn("Show Ennick's gloss").click();
await overflowCheck('gloss');
await btn('Kept').click();
await btn("Show Ennick's gloss").click();
await btn('Partly').click();
await snap('gloss-done');
if (!(await page.getByText('1 of 2 glossed well.').count())) errors.push('gloss sitting did not finish');
await btn('Back').click();
log('the gloss: OK');

// 7g. 1.6 The Wardens' Road: one-minute numbers, hand in a row, see a score
await nav('Field Guide');
await page.getByRole('button', { name: "Walk the Wardens' Road" }).click();
await snap('road'); await overflowCheck('road');
await page.getByRole('button', { name: /^The Warden of Counts/ }).click();
await page.getByRole('button', { name: /^1 minute/ }).click();
await overflowCheck('road study');
const firstRow = (await page.locator('.road-digits p').first().innerText()).replace(/[^0-9]/g, '').slice(1, 41);
await btn('I am ready').click();
await page.getByLabel('Row 1', { exact: true }).fill(firstRow);
await overflowCheck('road recall');
await btn('Hand in').click();
await page.getByText('40 points').waitFor({ timeout: 4000 }).catch(async () => errors.push('road numbers did not score 40: ' + (await page.locator('.card.gold h2').innerText())));
await btn('Back to the road').click();
await page.getByRole('button', { name: /^The Warden of Mirrors/ }).click();
await page.getByRole('button', { name: /^1 minute/ }).click();
await snap('road-images'); await overflowCheck('road images');
await btn('I am ready').click();
await overflowCheck('road images recall');
await btn('Hand in').click();
await btn('Back to the road').click();
await btn('Leave the road').click();
log('wardens road: OK');

// 8. Desktop layout
await page.setViewportSize({ width: 1280, height: 860 });
await nav('Today');
await snap('desktop-today'); await overflowCheck('desktop');

await browser.close();
log('errors:', errors.length ? errors : 'none');
process.exit(errors.length ? 1 : 0);
