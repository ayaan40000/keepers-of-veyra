# Changelog

All notable changes to Mnemos: Keepers of Veyra. Saved data from every earlier version loads in this one.

## 0.7.0: Closed beta build (2026-11-01)

Ready for the closed beta. The beta itself (20 or more adults for 4 weeks, two usability rounds) is run by people, not code: see `docs/BETA.md`.

- Session length is measured on the device. Progress shows your median session length; sessions left open over 90 minutes are left out.
- Keeper > Closed beta: an anonymous beta report (numbers only, no name, palace names or typed answers) that testers save and send by hand, and a "Report a problem" form that copies or saves a plain-text report. Errors are logged locally (last 20) to help with reports.
- The Undercroft keeps a local tally of where descents end, shown as a small chart at the door.
- Undercroft retuned with a simulation (`npx vite-node scripts/crypt-sim.mjs`): growth per floor 0.15 to 0.10 and boss floors 1.3x to 1.2x. Simulated mid-year players now end around floor 8 and year-end players around floor 12. These are model numbers; the beta tallies will replace them.
- Tests: no-network check over all source, beta report privacy test.

## 0.6.0: World and story

- Gate restoration plays on the map the first time you open it after passing a gate (still with reduced motion).
- Chapters read as cutscene panels: a framed view of the district with the camera moving per page, and the person the page is about shown with a mood that matches the words.
- Wren's portrait mood follows what she is saying.
- Calder's Ledger has a book view. Two or more new relics at once arrive on one grouped screen instead of a run of pop-ups.
- Undercroft: boss floors every 10th floor (more to hold; beating one refills your oil), a weekly descent (same stair all week, best depth kept), and optional modifiers (Dim lamps, Swift water) that add challenge but never rewards.
- Mid-year rewards: three new seals earned only by delayed recall that held for 30 or 90 days.
- The map takes on dawn, day and dusk light from your own clock.

## 0.5.0: Learning depth

- Names and Faces: from level 3, practice adds look-alike strangers who differ from someone you met in two features ("Not met" button). From level 5, people return with changed hair, glasses and clothes. Checks and gates keep the plain task. After each answer you see the face's key features.
- Undercroft echo floors: every 5th floor asks again, with no study, what you held two floors up. A run map shows cleared, current, echo and boss floors. Missed floors give one practical tip.
- Relics: recall cards (fill one missing word from a relic's story) polish a relic. A district's artifact fades while its latest delayed recall is under 60% and returns when one passes.
- Coached first day: Wren explains each first-day task before it starts (never during study or recall). First-time tips on Today, Relics, Palaces, Progress and the Undercroft, with "Replay tips" in settings.
- Settings in four groups (Audio, Display, Training, Data), text size 100 to 150%, volume slider.
- Larger content pools: 314 picture words (was 208), 80 abstract words (was 50), 90 names (was 70). Drafted with a local model, filtered so no two words are one letter apart.

## 0.4.0: Release hardening

- Offline cache is versioned per release, with an "A new version is ready" prompt (hosted build).
- Sound is off by default, with a separate switch for dialogue blips. Existing players keep sound only if they had switched it on themselves.
- Bundled licences: SIL Open Font License text for the three fonts and a third-party licence list (`THIRD_PARTY_LICENSES.md`, also in Keeper > About).
- Full validation of every part of a backup (Crypt, relics, quests, settings, lengths of names), a 5 MB import cap, and 50 corrupted-backup tests. Schema 2 with a tested migration from v0.3 saves.
- The Undercroft honours extended study timers, and leaving in the middle of a floor costs a flask (no free retry).
- Backup reminder after 7 days, a Safari data-loss notice, and the browser's storage persistence status in Keeper.
- Phone navigation: Today, Veyra, Crypt, Progress and Menu (Relics, Palaces, Keeper). Desktop keeps the side list.
- Focus is never hidden behind the top or bottom bars; text scales with the browser up to 200%. Map districts are also listed as text with shapes, not colour alone.
- A test fails if any released item, treasure, tablet, quest or achievement id changes.
- Session length is described as "about 20 to 30 minutes" until the beta measures it. Privacy statement in Keeper > About.
- `npm run build:single` now works on Windows.

## 0.3.0

Pixel-art game edition: shared pixel engine, world map, Undercroft, relics. See `docs/PRODUCT_DOSSIER.md` section 13.4 for earlier history.
