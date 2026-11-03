# Changelog

All notable changes to Mnemos: Keepers of Veyra. Saved data from every earlier version loads in this one.

## 1.1.0: The Living World, the Say-Back Games and Chapter 13 (2026-11-02)

Built and tested on the owner's computer; not pushed or deployed. Everything the owner chose for 1.1 ships together. New pictures are painted and waiting for the owner's picks, so the new screens show code-drawn art or no picture until they are shipped.

- **The Living World**: the Long Vigil (a weekly Echo scene on the Quay battlements with your own items from 1, 7 and 30 days ago; opens at the Month 2 gate; it cannot be failed), relics on pedestals that dim when a delayed review slips (calm repair as before), the Cabinet of Voices (seven coach voices, one per skill; Light by default, never on study or recall screens), Lethe Brambles on the map (a thorn grows where a delayed review slipped and burns away when the item is right on a later day; can be switched off), the Mirror Room (the Character sheet is shrouded while the mist is thick; relight it with the Major System) and Wren's Audit (spot the kind of mistake Wren made on a route). Daytime lines for every district.
- **Curriculum additions** from the memory-course and championship review: 25 lesson cards and four Masters' Notes; new drills Mind Map (topic and people), Poem, Mental Reckoning and Card Run (optional, no skill credit); variants for pegs, digit groups, grocery lists, steps, talk points, numbered lists, surnames and Skim, Pick, Keep; three Unit Checks with "Then and now"; "Your Methods"; printable worksheets; new study sets (capitals, elements, word roots, music theory, chess openings, anatomy terms).
- **The Event Hall and the Say-Back Games**: Veyra's own memory contests, nine scaled-down events (names and faces, numbers, cards, poetry, words, three strikes, double deck, years and facts) with best-result ladders only. The Games climb five tiers against Ottoline Gilt, a rival whose marks follow your own earlier best. Losing locks nothing. New District Trials: the Hall of Years and the Reckoning.
- **Chapter 13 and Wren's family**: after the Year of Keeping, the Great Forgetting and the Stitch (six of nine days closes the rift; a miss means another day), Ambrose Tallow, and a second epilogue. Wren's father Edrin, eleven story beats and 29 delayed questions about details she shares (a held answer adds a keepsake; a miss is repeated warmly; can be switched off). Earlier shipped story text is unchanged; the new canon is added around it. The lore guide is rebuilt.
- **Your Own Text**: paste a text you want to learn (any language and script), learn it in sections with first letters and blanks, and check it after 1, 7, 30, 90 and 180 days. Role mode for lines in a play. A small Lumen reward only for a typed check that held after 7 days or more, inside the daily practice cap. "Export my texts only". No scripture or treasured text ships with the game.
- **Field Guide**: 19 new pages on using the methods in real life (lists, numbers, dates, facts, exams, speeches, poems and passages, names, music, chess and more). Honest-claims wording pass.
- **Art pipeline**: Claude-reviewed face cast for people 0 to 149 (people 150 to 299 next), new scene, voice, pedestal, bramble, story and trial art, day versions of the trial pictures, a local picture review and corrected picture descriptions.
- Saved data: new `brambles`, `mirror`, `audit`, `events`, `seam`, `wren` and `own` records and new settings, with migrations, checks and import tests. Older saves load unchanged.

## 1.0.0: Public release (2026-11-02)

The first public release, free and open source, played in the browser at https://ayaan40000.github.io/keepers-of-veyra/. It holds everything from 0.4 to 0.11. The owner confirmed the trademark search is clear and chose to release now and invite the community to help with what is still planned.

- **The Lore of Veyra** (`docs/lore/`): a guide to the world for players and contributors. A hand-written front page with the canon and a style guide, then pages generated from the game's own story files (the world, the twelve districts, the people, the full story, fifty-two weekly tales and twenty-five side quests, relics, the Undercroft, the trials), with spoilers marked. Rebuild it with `npx vite-node scripts/lore-doc.mjs`.
- **Community**: a new README, `CONTRIBUTING.md` with the house rules, and the Keeper page's beta panel is now "Help improve Mnemos" (anonymous report and problem report, for everyone).
- **Not done yet, and open for help**: a full WCAG 2.2 AA audit with screen readers, testing on more real phones, the painted face cast in the Names-and-Faces drills, v0.12 The Living World and v0.13 Wren's story memory. See `docs/ROADMAP.md`.

## 0.11.0: District Trials, sealed vaults and calm relic repair (2026-11-02)

Built and tested on the owner's computer; not pushed or deployed.

- **District Trials** (Veyra > Trials): five optional trials, each in a restored district, each using a method you were already taught on fresh material. The Catacombs of the Unnamed (names and faces, 8 of 10), the Broken Vault of the Salt Guild (a 12-digit code with the Major System, after a short interruption), the Disordered Gears (15 clock parts on 15 market stalls, put back from the last stall to the first, 14 of 15), the Bridge of Tongues (10 old-tongue words, asked now and again after 7 days, 8 of 10) and the Sunken Scriptorium (a 7-date timeline, asked again the next day, 6 of 7).
- **Sealed vaults**: three vaults (Quay, Market Cellar, Mirror) with a short tablet you read once. A quiet check-in after a day, then the door opens on a recall after 7 days (30 for the Mirror Vault). Small typos are forgiven; numbers and names must be exact. A hint ladder (first letter, then first word) costs only that line's Lumen.
- **Rules**: trials never change skill estimates. Only a check that passed wins the prize. A miss costs nothing: fresh material the next day (two days for a vault), and the Bridge gives one gentle second ask after a review of the words that slipped. The story never waits for a trial. Study and recall screens stay still and quiet.
- **Prizes and lore**: 8 new prizes in a new Trial Prizes group and 6 new Lore entries. A check that is due shows on Today after the day's session.
- **Real material**: the Scriptorium includes three real timelines (the race to the Moon, the history of flight, medicine and discovery), checked before shipping. Clock parts are real names. Everything else is invented.
- **Calm relic repair**: a dim district relic can be repaired in the Reliquary with two recall cards, a day or more apart, each asking a different word from its story. No timer and nothing lost; a later slipped recall can dim it again.
- **Art**: six new pictures painted by the local image model (one per trial and the vault door), and eight prize icons traced from painted objects. The art folder is now 913 KB (budget raised from 1200 KB to 5 MB the same day, for image-model faces).
- Saved data: new `trials` record and `relics.repair`, with migration, checks and tests. Older saves load unchanged. 221 unit tests.
- Not built yet: relics on pedestals in the walkable palace room (repair lives in the Reliquary for now) and the optional 90 and 180 day "long echo" vault bonuses.

## 0.10.0 (was "Unreleased (v0.10 work)"): Character, gear and Echo battles

Built and tested, not yet released. The version number has not been bumped.

- **Character sheet** (Menu, or the Keeper page): seven attributes, one for each skill, worked out from your skill levels and mastery. Nothing new is earned: it is a new view of what you already learned. A class (such as Cartographer) comes from your strongest skill.
- **Paper doll**: a pixel Keeper drawn in code. Every district gate adds a stitch of coloured trim to the cloak, with a clasp, a pin, a lantern glow and a gold lining at gates 3, 6, 9 and 12.
- **Gear**: lantern, cloak, charm and tool slots. You can only wear relics you have earned. Lantern of Letters, Scroll of Order and Palace Map give small study aids used inside battles, and never show an answer before you recall it. The rest is cosmetic.
- **Echo battles**: a gentle Forgetting holds old things you learned at least a day ago, pulled from your own review sets. You have 5 Resolve. Answers are typed. A hint halves damage, a miss shows the answer and you are asked again later, and you can skip once or leave at any time. Results never change skill estimates. Only old memories that held on the first try earn a small amount of Lumen, inside the same 50 a day cap as free practice.
- **Practice scenes** with made-up material: Packing Bay, Speech Hall, Crossroads, Networking Gala and Night Market, each with a "which move fits" step. They earn nothing.
- **Story**: a Forgettings lore entry (opens after the first gate), a first-meeting scene, coach lines from the Keepers' Circle (spoken only before and after a battle), and a new side quest, "The Keepers' Circle", with a closing scene for the Year of Keeping and a new trinket.
- Saved data: new `keeper` and `battles` records, with migration, checks and tests. Older saves load unchanged.
- Not built: guilds and any shared boss, ask-again-once-per-guest at the Gala, battle sounds. Shipped battle and enemy pictures are used automatically when the art manifest holds ids that start with battle or enemy; until then the code-drawn sprites are shown.

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
