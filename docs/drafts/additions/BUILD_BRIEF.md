# 1.1 build brief (shared by every build agent)

You are one of several agents building Mnemos 1.1, one part at a time. Agents run one after another, so the code you find may already contain earlier parts. Do your part fully, then stop.

## Read first
- `CLAUDE.md` (hard rules, commands, architecture) and `CONTRIBUTING.md` (house rules).
- `docs/drafts/additions/DECISIONS.md`: the owner's decisions. They override any draft.
- The drafts named in your part. Drafts were written and fact-checked by other agents (`docs/drafts/additions/FACTCHECK.md`); use the checked versions and drop anything FACTCHECK says to drop.

## Rules that every part must keep
- Owner does not code. Keep changes in the style of the surrounding code (plain JS/JSX, React 18, same comment density).
- Ids are permanent: never rename an existing item, quest, achievement, trial, lore or profile field id. New saved data needs a schema migration in `src/store.js` plus validation and an import test (see how `trials` was added in v0.11).
- Study and recall screens: no animation, no sound except the one soft submit sound.
- Rewards only from demonstrated learning (accuracy, delayed recall that held, gates). Nothing new changes skill estimates unless the design says so.
- No network calls, no trackers. No em dashes in any player-facing text. Honest claims only.
- Real-world facts only where `DECISIONS.md` and the drafts allow, and only the checked ones.
- Keep the accessible names and CSS classes that `tests/e2e.mjs` relies on, or update the test in the same change.
- Pictures: new art is not shipped yet (the owner is picking). Wire art through `artFor(id)` / `ART[id]` in `src/data/art.js` so a missing picture falls back gracefully (code-drawn sprite, icon or nothing). Do not run `ship.py` and do not add image files.
- Do NOT commit, push or change `package.json` version. Do not touch `tools/`, `docs/review/` or the art pipeline.

## Before you finish
1. `npm test`: all tests pass. Add unit tests for new engine logic and for any store migration.
2. `npm run build:single`, then `node tests/e2e.mjs`: must print "errors: none". If e2e cannot run, say why.
3. Append a short section to `docs/drafts/additions/BUILD_NOTES.md`: what you built (files), what you left out and why, anything the owner must decide. Plain language.
4. Reply with a short summary: files changed, tests count, e2e result, anything skipped.
