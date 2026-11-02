# Mnemos: Keepers of Veyra

Free, open-source, local-first memory-training RPG. 365-day curriculum, about 30 minutes a day, wrapped in an original pixel-art story. Owner: Ayaan (does not code; explain changes in plain language). Current version: 0.10.0 (see CHANGELOG.md).

Read first: `docs/ROADMAP.md`, `docs/BEYOND.md` (planned Field Guide: using the methods on real-life material) (what to build next and release requirements) and `docs/PRODUCT_DOSSIER.md` (research, curriculum, adaptive rules, scoring, story bible, UX spec, architecture, IP register).

## Commands
```
npm install
npm run dev              # Vite dev server
npm test                 # Vitest: all unit tests must pass (206 at v0.10.0)
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
- Owner decision, Nov 1, 2026 (later that day, replaces the earlier "never ship pictures" rule): pictures from the local image model (ComfyUI, Qwen-Image workflow from the studio project) MAY ship as image files, as long as they fit the pixel-art style (palette in `tools/asset-studio/studio.py`), are reduced to a small pixel grid and a limited palette, kept small (the whole app must stay light on phones), shown with `image-rendering: pixelated`, and contain no copied characters, logos or text from other games. Sprites may still be traced into the code sprite format ({w, h, pal, px}) by `tools/asset-studio/studio.py`. Drafts live in `tools/asset-studio/out/` (not committed); shipped images go in `src/assets/art/` with a manifest in `src/data/art.js`. Check the image model's licence terms and list them in `src/data/licenses.js` before release. LICENCE HOLD RESOLVED (Nov 1, 2026): the installed model is Qwen-Image 2.1, which is under the Qwen Research License ("non-commercial" there means research or evaluation only, sections 1(i) and 2(a)). The owner stated in chat that they have approval from Qwen (Alibaba) to use the images, and approved publishing. Keep a copy of that written approval with the project records (not in the repo if it holds private details), and keep `model: 'qwen-image-2.1'` on every art manifest entry so the set can be re-rendered if the terms ever change.
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
v0.4 to v0.9 are built; the owner chose to skip the closed beta. v0.9 added the Year of Keeping (`yearComplete` in `src/engine/session.js`), the epilogue and gate talk (`src/data/afteryear.js`), late-year seals, palace furniture picks (`palace.furniture`), boss trials, two modifiers and the run card (`src/ui/RunCard.jsx`). Next: v1.0 release requirements in `docs/ROADMAP.md` (trademark, accessibility audit, device testing need people). `scripts/icons.mjs` renders the app icons; `src/pixel/furniture.js` holds palace-room furniture. Local Qwen (LM Studio at http://127.0.0.1:1234) can draft content pools; filter and review its output. Re-run unit + e2e tests after every change and look at screenshots for visual changes.
