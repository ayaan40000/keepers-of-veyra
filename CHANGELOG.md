# Changelog

All notable changes to Mnemos: Keepers of Veyra. Saved data from every earlier version loads in this one.

## 0.9.1: New art from local models (2026-11-01)

All new art in this release was made on the owner's computer: the image model painted pixel-art pictures, which were traced into the game's own code sprites (the pictures themselves are not shipped). Names and texts were drafted by a local model. Weak pieces can be replaced later by re-running `tools/asset-studio/`.

- 37 new collectibles in four new groups, all earned by learning: Keepsakes (delayed recalls that held), Old Documents with readable texts (gates 1 to 8), Lost and Found (relics polished with recall cards) and Keeper's Gear (skill levels gained).
- 7 new Undercroft treasures between floors 47 and 66, and art for three bosses.
- 10 new objects to choose for palace stops.
- Story panels for every page of the Epilogue, two pages of Chapter 12 and the last Undercroft tablet.
- Character sketches on the People page.

## 0.9.0: The Year of Keeping (2026-11-01)

- The Year of Keeping: after the last gate, the app no longer repeats day 365. Each day revisits one week of the year in turn, at your current level, with a check-up every 7th day. The first keeping day opens with a new five-page Epilogue (also readable under Veyra > Chapters).
- Friends speak after each gate: restored districts on the map show a few words from Tansy, Fennick, Wren, Isolde, Mosk, Ennick or Hask.
- Four late-year seals (Whole City, Half Year, Long Road, Keeper's Year), earned only by delayed recall that held, so months 7 to 12 have rewards of their own.
- Palace rooms: choose the furniture for any stop while you walk it (Palaces > Walk this palace). Your choices are saved in backups.
- Undercroft: every boss now brings a trial (a fixed twist such as reversed order or turned heads), a new boss from floor 50 (Ysolde's Shadow), a new depth band (The Warm Water) and four new tablets below floor 45, in Ysolde's own words. Two new optional modifiers: Thick mist (a twist on every floor) and Loud echoes (an echo every 3rd floor). Modifiers still add no rewards.
- Undercroft run card: a picture of your deepest descent to save, or share with your device's share button. It is made on the device and never uploaded.
- Story drafts in this release were written first by a local model and edited by hand.

## 0.8.0: Palace and polish (2026-11-01)

The closed beta was skipped at the owner's request; its tools stay in the app for anyone who wants to send a report.

- Walk your memory palaces: Palaces > Walk this palace turns any palace into pixel rooms, eight stops to a room, with furniture picked from each stop's name (a mirror for "Hallway mirror", a sofa for "Sofa"). Walk with the arrow keys, WASD, a game controller or the on-screen pad. "Route check" asks which stop comes next; it is practice only and changes no scores. Furniture sprites were first drafted by a local model and checked by eye.
- Keyboard play: keys 1 to 7 open each page, ? lists every key. Game controllers work everywhere: the d-pad moves between buttons, A presses, B closes menus.
- Install prompt: after 3 training days, Today offers to install Mnemos (Chrome, Edge, Android), or explains Add to Home Screen on Safari. New app icons drawn from the Brass Lantern.
- Three-quarter view faces: from level 7, Names and Faces shows people face-on when you meet them and turned to one side at recall. Deep Undercroft face floors can roll "turned heads".
- The map has a layered depth effect (it shifts gently with the pointer; off with reduced motion), and Settings > Display can open the app on the map instead of Today.

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
