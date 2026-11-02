# Mnemos: Keepers of Veyra

**A free, open-source pixel-art RPG about a city that is forgetting itself, and the memory methods that bring it back.**

**Play it now:** https://ayaan40000.github.io/keepers-of-veyra/ (works in any modern browser, on phones too, and offline after the first visit)

Every evening a silver mist called the Tide climbs the streets of Veyra and takes whatever people are not holding in mind. You are a new Keeper with an old brass lamp and an archivist called Wren. One district a month for a year, you relight the lamps, recover the lost ledgers, descend into the Undercroft beneath the Archive, and learn what really happened on the night every ledger came back blank.

Along the way you practise the real methods memory athletes use: turning things into pictures, leaving them along a route you know (the memory palace), fixing names to faces, turning numbers into images. About 20 to 30 minutes a day. Some people will play for the story and the relics and find the methods have quietly come along with them. That is the idea.

*Scores measure performance on Mnemos tasks only. Mnemos is not an IQ test or a clinical test, and it does not claim to improve memory in general.*

## What is in it

- **A year-long story**: a prologue, twelve chapters, an epilogue, fifty-two weekly tales and twenty-five side quests, with a cast who change as the city does. Read the world in [the lore guide](docs/lore/README.md).
- **A 365-day curriculum** in twelve modules, with lessons, adaptive difficulty, spaced delayed recall and a monthly gate.
- **The Undercroft**: an optional descent below the Archive with tablets of deep history, guardians and lost treasures.
- **Echo battles**: gentle Forgettings that hold things you learned weeks ago.
- **District Trials and sealed vaults**: optional challenges that open only for what you can still recall days later.
- **A walkable memory palace**, relics with stories, a character sheet and gear, a Keeper's Field Guide for using the methods in real life.
- **No accounts, no adverts, no trackers, no network.** Everything stays in your browser, with backup and restore. See [PRIVACY.md](PRIVACY.md).

## Help build it

Mnemos is made by a small team and local AI tools, and it grows with its community. You do not need to code to help:

- **Play and report**: bugs, confusing moments, devices it fails on.
- **Accessibility**: screen-reader and keyboard testing (we have not yet had a full WCAG audit).
- **Writing**: tales, side quests, Undercroft tablets, relics, within [the canon](docs/lore/README.md).
- **Art, translation, memory coaching, code.**

Start with [CONTRIBUTING.md](CONTRIBUTING.md). What is planned next is in [docs/ROADMAP.md](docs/ROADMAP.md).

## Develop

```
npm install
npm run dev            # local dev server
npm test               # unit tests (Vitest)
npm run build:single   # one self-contained HTML file in dist-single/
npm run build          # static site in dist/ for GitHub Pages (with service worker)
node tests/e2e.mjs     # end-to-end journey at 390px and desktop (Playwright; run build:single first)
npx vite-node scripts/lore-doc.mjs    # rebuild the lore guide from the story data
npx vite-node scripts/crypt-sim.mjs   # Undercroft difficulty simulation
node scripts/licenses.mjs             # regenerate THIRD_PARTY_LICENSES.md after dependency changes
```

Layout: `src/data` (curriculum, story, content), `src/engine` (pure game logic), `src/store.js` (saving and import checks), `src/ui` (screens), `src/pixel` (code-drawn art), `tools/asset-studio` (local image-model pipeline), `docs/` (design, research and lore).

## Licences

Code: MIT ([LICENSE](LICENSE)). Story text and art: CC BY 4.0. Fonts: SIL Open Font License 1.1 (Pixelify Sans, Silkscreen, VT323), full texts in [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md) and in the app (Keeper > About).

Art: much of the pixel art is drawn in code. The painted pictures were made on the project's own computer with the Qwen-Image 2.1 model; the project owner holds the licensor's permission to publish them and to allow open reuse, so they are shared under CC BY 4.0 like the rest of the art (credit "Mnemos: Keepers of Veyra"; see [docs/ART.md](docs/ART.md)). All characters and art are original; nothing is copied from other games.
