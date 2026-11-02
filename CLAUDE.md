# Mnemos: Keepers of Veyra

Free, open-source, local-first memory-training RPG. 365-day curriculum, about 30 minutes a day, wrapped in an original pixel-art story. Owner: Ayaan (does not code; explain changes in plain language). Current version: 0.8.0 (see CHANGELOG.md).

Read first: `docs/ROADMAP.md` (what to build next and release requirements) and `docs/PRODUCT_DOSSIER.md` (research, curriculum, adaptive rules, scoring, story bible, UX spec, architecture, IP register).

## Commands
```
npm install
npm run dev              # Vite dev server
npm test                 # Vitest: all unit tests must pass (155 at v0.8)
npm run build:single     # one offline HTML file -> dist-single/index.html (the review build)
npm run build            # static site for GitHub Pages -> dist/
node tests/e2e.mjs       # Playwright journey at 390px + desktop; must print "errors: none" (run build:single first; playwright 1.63 matches the cached Chromium)
npx vite-node scripts/crypt-sim.mjs   # Undercroft difficulty simulation
node scripts/licenses.mjs             # regenerate licence list after dependency changes
```

## Hard rules
- Never publish, push to GitHub or deploy without the owner's explicit approval. Repo: github.com/ayaan40000/keepers-of-veyra; every push to main runs the tests and redeploys https://ayaan40000.github.io/keepers-of-veyra/ (bump `version` in package.json for each release so the offline cache refreshes).
- No runtime network calls, no trackers, no accounts. All data lives in the browser (IndexedDB + localStorage) with JSON export/import.
- All art is original and drawn in code. No image files from other games; no copying of Undertale, Stardew Valley or other assets, fonts or characters. Only OFL fonts via @fontsource (Pixelify Sans, Silkscreen, VT323).
- Study and recall screens: no animation and no sound except one soft submit sound.
- Rewards come only from demonstrated learning (accuracy, delayed recall, gates). Never reward time spent or repetition of easy drills. Crypt results never change skill estimates.
- Honest claims only: scores measure performance on Mnemos tasks; not an IQ or clinical test.
- Item ids, side-quest ids, achievement ids and profile field names are permanent once released (they key saved data). Add migrations in `src/store.js` for any schema change.
- Keep accessible names and CSS classes that `tests/e2e.mjs` relies on, or update the test in the same change.
- Story and UI text: plain, warm language; no em dashes.

## Architecture
- React 18 + Vite, plain JS/JSX, ES modules. `vite-plugin-singlefile` for the review build.
- `src/data/` curriculum (12 modules, 52 weeks, gates, lessons), content pools, story (chapters, quests, lore, story glue), items, crypt data.
- `src/engine/` pure logic: `core.js` (items, scoring, adaptive rules R1-R6, probes), `session.js` (session builder), `progress.js` (Lumen, gates, streaks, scores, finalize), `quests.js` (side quests, codex), `collect.js` (relics), `crypt.js` (Undercroft), `util.js`.
- `src/pixel/` engine: `raster.js` (pure buffers/sprites), `components.jsx` (Sprite, PixelCanvas), `core.js` re-exports both; `faces.js`, `portraits.js`, `Faces.jsx`, `icons.js`.
- `src/ui/` screens (Today, Session, Drill, Veyra, Relics, Crypt, Palaces, Progress, Keeper, Onboarding); `src/ui/game/` design-system components (Panel, PxButton, Hud, DialogueBox, UnlockToast, PxIcon); `src/ui/pixel/` world map and scenes; `src/audio/sfx.js` WebAudio chiptune.
- `src/store.js` persistence, full validation (schema 2), 5 MB import cap, migrations. `src/engine/beta.js` beta report, problem report, local error log. `src/engine/moods.js` portrait moods. `src/ui/Notices.jsx` backup reminder, Safari notice, update prompt. `src/ui/Tips.jsx` first-time tips.
- Service worker is generated at build time in `vite.config.js` (cache name carries the version). `src/styles.css` design system; `src/ui/crypt.css`.
- `previews/` dev-only preview pages for art; not part of the app.

## Next work
v0.4 to v0.8 are built; the owner chose to skip the closed beta. Next: v1.0 release requirements in `docs/ROADMAP.md` (trademark, accessibility audit, device testing need people). `scripts/icons.mjs` renders the app icons; `src/pixel/furniture.js` holds palace-room furniture. Local Qwen (LM Studio at http://127.0.0.1:1234) can draft content pools; filter and review its output. Re-run unit + e2e tests after every change and look at screenshots for visual changes.
