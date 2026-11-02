# Mnemos: Keepers of Veyra

A free, open-source, local-first memory training RPG. 365 days, about 20 to 30 minutes a day.
Version 0.9 (the Year of Keeping). Play it at https://ayaan40000.github.io/keepers-of-veyra/ (closed beta). See `CHANGELOG.md`, `docs/ROADMAP.md` and `docs/BETA.md`.

Scores measure performance on Mnemos tasks only. Mnemos is not an IQ test or a clinical test.

## Review the prototype
Open `PLAY-Mnemos.html` (or `builds/mnemos-v0.7.html`) in Chrome, Edge, Firefox or Safari. No install, no network.
Data is stored in that browser only. Use Keeper > Export backup to keep a copy.

## Develop
```
npm install
npm run dev            # local dev server
npm test               # 169 unit tests (Vitest)
npm run build:single   # one self-contained HTML file in dist-single/
npm run build          # static folder in dist/ for GitHub Pages (with service worker)
node tests/e2e.mjs     # end-to-end journey at 390px and desktop (Playwright)
npx vite-node scripts/crypt-sim.mjs   # Undercroft difficulty simulation
node scripts/licenses.mjs             # regenerate THIRD_PARTY_LICENSES.md after dependency changes
```

## Layout
- `src/data` curriculum (12 modules, 52 weeks, gates), content pools, story
- `src/engine` item generation, scoring, adaptive rules, spaced probes, rewards, analytics (pure functions)
- `src/store.js` IndexedDB + localStorage persistence, export/import validation
- `src/ui` screens

Code: MIT. Story and art: CC BY 4.0 (proposed). All art and characters are original.

## Third-party assets
Fonts (SIL Open Font License 1.1, bundled via @fontsource): Pixelify Sans, Silkscreen, VT323. Full licence texts in `THIRD_PARTY_LICENSES.md` and in the app (Keeper > About). All pixel art is original and generated in code. Privacy: see `PRIVACY.md`.
