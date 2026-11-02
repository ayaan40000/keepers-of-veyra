# Contributing to Mnemos: Keepers of Veyra

Thank you for wanting to help. Mnemos is a free, open-source game, and it grows with the people who play it. You do not need to code to make a difference.

## Ways to help

| You like... | You could... |
| --- | --- |
| Playing | Report bugs and confusing moments with the in-app problem report (Keeper > Report a problem) or a [GitHub issue](https://github.com/ayaan40000/keepers-of-veyra/issues). Say which device and browser. |
| Accessibility | Test with NVDA, VoiceOver or TalkBack, keyboard only, 200% text, or reduced motion. A full WCAG 2.2 AA audit has not been done yet, so every finding helps. |
| Phones | Try it on your phone, especially low-end Android and older iPhones, and tell us what breaks. |
| Writing | Add weekly tales, side quests, Undercroft tablets or relic stories. Read [the lore guide](docs/lore/README.md) first. |
| Art | Propose pictures or sprites in the house style (see [docs/ART.md](docs/ART.md)). |
| Languages | Translations are planned; tell us which language you could help with. |
| Memory methods | Coaches and memory athletes: review the curriculum and the Field Guide for accuracy. |
| Code | Pick an item from [docs/ROADMAP.md](docs/ROADMAP.md) or an open issue. |

## House rules

These keep the game kind, honest and safe. Pull requests that break them will be asked to change.

1. **Honest claims only.** Scores measure performance on Mnemos tasks. Never claim the game raises IQ, improves memory in general, or protects against decline.
2. **Rewards only from real learning.** Accuracy, delayed recall that held, passed gates. Never reward time spent, logging in, or repeating easy drills. No loot boxes, energy timers, streak pressure or limited-time events.
3. **Study and recall screens stay still and quiet**: no animation and no sound there except one soft submit sound.
4. **No network, no accounts, no trackers.** All data stays in the browser. A test fails if the source adds a network call.
5. **Original work only.** No characters, art, fonts or long passages from other works. Only OFL fonts.
6. **The story is invented; trial material may be real.** Veyra and its people are invented. Trials, Echo battles and the Undercroft may use real people, places and facts as memory material if they are true, public and checked, and never imply that a real person or company endorses Mnemos.
7. **Plain, warm language, no em dashes.**
8. **Saved data is forever.** Item, quest, achievement, trial and lore ids and profile fields are permanent once released. Add a migration in `src/store.js` for any change to saved data.

## Working on the code

```
npm install
npm test               # all unit tests must pass
npm run build:single
node tests/e2e.mjs     # must end with "errors: none"
```

- Keep the accessible names and CSS classes that `tests/e2e.mjs` uses, or update the test in the same change.
- Look at a screenshot at phone width (390px) for any visual change.
- Story text lives in `src/data/`. After changing it, rebuild the lore guide: `npx vite-node scripts/lore-doc.mjs`.
- Pictures from local image models go through `tools/asset-studio/` (see `docs/ART.md`) and must stay inside the art budget.

## Pull requests

Small and focused is best. Describe what changed and why, how you tested it, and include a screenshot for anything visible. Every push to `main` is tested and deployed, so `main` must always be playable.

By contributing you agree that your code is released under the MIT licence and your story text and art under CC BY 4.0.
