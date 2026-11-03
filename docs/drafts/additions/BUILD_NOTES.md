
## Part 1: The Living World (Vigil, Pedestals, Voices, Brambles, Mirror Room, Audit)

Built (all wired, all with tests in `tests/living.test.js`):
- **The Long Vigil** (`src/engine/vigil.js`, Battle.jsx, `SCENES.vigil` in echo.js): a sixth Echo scene at gate M2 using the player's own sets that are about 1, 7 and 30 days old. Lanterns replace Resolve, so it cannot fail; a miss dims a lantern and asks again; one skip ("Let this one wait"). No Lumen. Missed items join the Echo queue. The Watch Ledger (`vg_watch_ledger`, new item with a code-drawn icon in `src/pixel/vigil-icon.js`) is given the first time two or more items older than 7 days held on the first try without a hint. Offered on Today after the session about every 6 days, and always available in Echo Hall.
- **Pedestals** (`src/ui/Pedestals.jsx`): a "Hall of Pedestals" card on the Palaces page. Lit or dim follows the existing fading-relic rule; dim ones offer the existing calm repair.
- **Cabinet of Voices** (`src/engine/voices.js`, `src/ui/Voices.jsx`): Voices setting off/light/full (default Light) in Keeper. Character page card (light and full), Today after a session and before/after an Echo battle (full only). Never on study or recall screens.
- **Lethe Brambles** (`src/engine/brambles.js`, `src/ui/Brambles.jsx`, WorldMap overlay): thorns are recorded when a delayed review misses an item and burn only when the same item is right on a later day. Notes earn nothing. Optional chest per district. On by default, setting in Keeper. Burn plays on the map only.
- **Phantom Limb and Mirror Room** (`src/engine/mirror.js`, `src/ui/MirrorRoom.jsx`): the Character sheet shows "?" while the mist is up; the Mirror Room (Major System on house numbers) relights each attribute. Display only.
- **Wren's Audit** (`src/engine/audit.js`, `src/ui/Audit.jsx`): three routes, error type picked from a list, fix typed. "Added item" slips from Month 9. Only gift: three Chronolog entries (unlock `audit:N`, added in `codexFor`). Reached from Echo Hall.
- **Daytime district lines** (`src/data/daylife.js`) now show on the Veyra district card during daytime hours.
- New saved data with migration, validation and import tests: `p.brambles`, `p.mirror`, `p.audit`, `p.battles.vigil`, prefs `voices` and `brambles`.
- `scripts/battle-sim.mjs` (run with `npx vite-node scripts/battle-sim.mjs`): at an assumed 19 seconds a question, an Echo battle is about 8 to 10 questions, 3 to 4 minutes (forgetful player: 21% end in a rest); the Vigil is about 9 to 12 questions, 4 to 5 minutes; scenes 3 to 4.5 minutes. That is under the 5 to 8 minute target, so real players need to be timed before the Vigil or battle size is raised.

Choices the owner may want to change:
- "Thick Mist" did not exist in the game. I defined it as: a District Trial is under way, or today's session is a gate. It starts once the Major gate (M4) is passed.
- Brambles track slipped items from delayed reviews only (not Echo misses). Skills without a district (linking) show in the first district.
- Vigil offer timing is "every 6 days after a session", not tied to the curriculum week.

Left out or simplified:
- Pedestals are a page card, not drawn inside the walkable palace canvas.
- Art ids used with fallbacks (code-drawn or nothing if missing): `backdrop_long_vigil`, `event_mirror_room`, `event_wren_audit_route`, `overlay_bramble_clump`, `pedestal_lit`, `pedestal_dim`, `voice_vision/thread/place/face/count/tongue/frame`. Not used (belong to other parts): `event_wren_nook`, `trial_long_echo_vault`, `overlay_bramble_vine/bud/burning` (burn is code-drawn).
- `docs/lore` was not regenerated; the Audit entries live in `src/data/audit.js`, not `lore.js`.

## Part 2: Curriculum additions (lessons, pools, variants, Mind Map, Poem, Unit Checks, Cards, Reckoning)

Built:
- **Data**: `scripts/additions-build.mjs` trims the checked drafts (A, B, C, D, E) into small files in `src/data/add/` (about 180 KB). Re-run it only if a draft changes.
- **Lessons and notes**: 25 lesson cards inserted at their places, week 24 replaced by the four-card peg lesson (`src/data/lessons.js`); four new Masters' Notes `m-chunks`, `m-pegs`, `m-stanza`, `m-check` (`masters.js`).
- **Variants** (spec keys, no migration): V1 pegs, V2 digit groups and rows, V3 sources (grocery, steps, talk points, plus anatomy terms), V4 numbered word lists, V5 surnames (two points per face), V6 Skim, Pick, Keep. Logic in `src/engine/additions.js`, hooks in `core.js`, screens in `src/ui/Drill.jsx`.
- **New drills**: Mind Map (`map`, topic and people kinds, branch scoring, delayed review by whole branches up to 12 leaves), Poem (`poem`, forgiving practice scorer, plus a strict page scorer ready for the Event Hall), Mental Reckoning (`calc`, see and hold modes, no Lumen, no skill change), Card Run (`src/engine/cards.js`, `src/ui/Cards.jsx`, no credit, nothing saved).
- **Study sets** as free practice: capitals, elements, word roots, music theory, chess openings, anatomy terms (with the "not health information" line).
- **Week plan** (section 6): weeks 4, 6 grocery; 18, 19, 20 digit groups; 24 shape and rhyme pegs; 28 talk points; 29 Mind Map (second drill); 41 Skim, Pick, Keep and Poem; 42 steps and a second skim text; 48 poem replaces the palace round; Mind Map (people) joins the M10 gate drills. Skim is never the guided or repeated round.
- **Unit Checks** (Lists weeks 3 and 6, Numbers 14 and 21, Talk 28 and 30): fixed forms, not scaled by level, taken once each. Form A on any of the first five days of its week (before the lesson), Form B on day 6 and only if A was taken. They replace that day's weekly check. Grocery practice never draws the check items.
- **`v` result field** (variant name, also on delayed-review results), validated on import. **Then and now** and **Your Methods** cards on Progress (`src/engine/methods.js`, `src/ui/Methods.jsx`). **Printable worksheets** and the **toolbox page** in the Field Guide (`src/ui/Worksheets.jsx`; no saved answers).
- Tests: `tests/additions.test.js` (46). One older test relaxed for self-sizing specs. `npm test` and e2e pass.

Left out or simplified:
- Poem recall has line boxes only. The title and author boxes (strict Event Page) are not shown yet; the scorer supports them for part 3.
- `numbered` works on word lists only, not palaces. Rows mode (V2) has scoring and display but no screen picks it yet (Event Hall).
- Roman Room and Journey are palaces in the records, so Your Methods does not list them separately. Homophone pairs and the speed-math tables, constants and formulas are in the data but not shown anywhere yet.
- Card pictures are a help list only (as C advised); personal bests need the events record from part 3.
- The Reckoning trial, dates, trivia and Your Own Text were left for later parts as asked.
- The Field Guide toolbox page came from D/fieldguide-add.json; the playbooks in that file were not touched (part 5). The Field Guide only got two one-line insertions (toolbox, worksheets).

Owner may want to decide:
- Mind Map (people) now sits in the M10 gate: it makes the gate slightly harder and about a minute longer.
- Week 48 now swaps its palace round for a poem. Week 42 gains a third drill (Skim, Pick, Keep).
- Time per skim step reuses the drill's study seconds (60); no player timing yet.

## Part 3: The Event Hall, the Say-Back Games and the two new trials

Built:
- **Event Hall** (`src/ui/EventHall.jsx`, `src/engine/events.js`, `src/data/events.js`): opens at the M10 gate, reached from a card under Echo Hall on the Veyra map (it plays as a full screen, like Wren's Audit). Nine events: Hall Round (Names and Faces), Counting Rows (Speed Numbers), Rook Run (Speed Cards), Vigil Verse (Poetry, strict scorer from part 2 with title and author boxes), Bridge Tally (Words to Remember), Three Lamps Out (Three Strikes), Double Rook (Double Deck), plus Year Round and Fact Round (checked dates and trivia). Practice at any size from each event page. Results never touch skills, review sets or Lumen; only best results are kept.
- **Cards and Double Deck** reuse the Cards screen from part 2 (it gained an optional fixed-round mode). Words and Three Strikes use their own simple one-question-at-a-time screen with three lamps instead of the Echo battle engine (less risk, same rules: three misses end the round gently, answers shown).
- **Contest pace** (off by default, 15 seconds an answer, follows the timer multiplier) applies to Bridge Tally and Three Lamps Out only.
- **The Say-Back Games** (opens at the M12 gate): five tiers, Ottoline Gilt's scripted marks (the player's own best at that tier's scale times 1.10, 1.07, 1.04, 1.01, one stumble at 0.85, capped at 96 percent, a default when there is no best), her lines and scenes from the story draft, the "Ottoline's marks" board, the Final (seven lamps lit one at a time, four win, ties to the player, replayable forever, the same marks for her). Two Chronolog entries (`lore_say_back`, `lore_lamp_cup`). The portrait uses `story_ottoline` if shipped, otherwise nothing.
- **New saved record `p.events`** (migration, validation, import tests): best results by event and level, history capped at 60, pace, and the season (tier, snapshot, posted, marks, won).
- **Hall of Years** (`year_hall`, prize `tr_year_tablet`) and **Reckoning** (`reckoning`, prize `tr_tally_stick`), with code-drawn prize icons (`src/pixel/event-icons.js`), art ids `trial_year_hall` and `trial_reckoning`, and two Chronolog entries. Hall of Years needs 6 of 7 straight away and then 5 of 7 after a week (the trial engine gained "a pass mark on a non-final check opens the later check"). Dates are exact: every digit, and BCE where it applies.
- Data trimmed by `scripts/events-build.mjs` into `src/data/add/` (dates, trivia, reckon, eventcopy). Tests: `tests/events.test.js` (25), including a 200-case check that one small improvement always wins the Final when the other three lamps are held. Full suite 319 passing; e2e "errors: none".

Left out or simplified:
- "Two trials, best counts" is simply every round posting its result and the best being kept.
- Reckoning's optional 7-day recheck of the three facts is not built. Its sums are shown all at once with the check, not one at a time.
- Old Scriptorium timelines were not extended with the nine date sets (that would change which timeline an old saved check shows); Hall of Years draws from the nine plus the three real ones in `YEAR_POOL`.
- Dates and facts are Hall practice only (not Season events). Final scale equals the tier 4 scale.
- Docs not regenerated (`docs/lore`); art ids not shipped.

Owner may want to decide:
- Rival default mark when you have no best is 50 percent times the factor. The simulation asked for in the story draft (about two Finals in three won) was not run as a separate script: with the marks above a player who posts nothing new holds three lamps and needs one improvement on one of her four events.
- The Final asks for results at the tier 4 scale (24 faces, 3 rows, 12 lines, 40 words, 5 by 5 people, 20 cards in Double Rook). Say if you want it heavier.

## Part 4: The story additions (the Seam, Chapter 13, Wren's family)

Built:
- **Chapter 13: the Seam and the Great Forgetting** (`src/data/forgetting.js` replaces the old unused draft; `src/engine/seam.js`; `src/ui/Seam.jsx`). Opens after the Year of Keeping is complete plus 3 keeping days, so the "Tide climbs" lines can show first (card on Today and under Echo Hall on the Veyra map). Three question phases (Hem of the Cloak, Body of Mist, Pale Glow) on made-up material using the Echo battle engine, each with its own Resolve, then the Stitch: a thread of nine made-up days studied at the start and recalled in order. Six of nine closes the Seam. A miss shows what was in place and says try again another day with a new thread (four threads, least-used first). Finished phases stay finished; after a missed Stitch the Pale Glow is replayed as the stretch between studying and recalling. Nothing locks, no Lumen, no skill changes (tested). Then Tallow's name scene, one ungraded "who keeps the lamp" question, the ending and Epilogue Two with Wren's portrait card (the five kept details, marked as kept or told).
- **Foreshadowing, additions only:** four Chronolog entries at gates M1, M5, M6, M9, the Seam rules (when the giant is first met), the giant's lore (when closed), the third verse (after Wren's beat 9), a Month 12 Gate talk line, rising-Tide lines on Today, four Undercroft tablets at floors 75, 80, 90, 100 (crypt tests updated to 23 tablets), and Chapters, People (Edrin, Marit, Ambrose Tallow) and Lore in Veyra.
- **Wren's Story Memory (v0.13)** (`src/data/wren.js`, `src/engine/wren.js`, `src/ui/WrenStory.jsx`): 11 beats (Wren card on Today, one a day, in order, once the player's day reaches it; beat 11 is Epilogue Two), 29 typed delayed questions (3 days after the beat, first ask on its earliest day, then 10 and 30 days later, retired after two held or three asks, one a day, only after a session). Held: a keepsake line in the Chronolog plus two small scenes (face details, the Last Lamp). Missed: Wren repeats the line warmly. Settings switch in Keeper. Beat texts are written to contain each question's source line (tested).
- **New saved data**: `p.seam`, `p.wren`, pref `wrenMemory`, with migration, validation and import tests. Art ids via artFor with fallbacks (nothing shown if missing): story_ambrose, story_edrin, story_green_door, story_mother_portrait, story_winding_mark, boss_great_forgetting (already shipped). story_lamp_cup belongs to part 3.
- `docs/lore` regenerated (generator now covers Chapter 13, Epilogue Two, Wren's story, the new people and lore); lore README canon updated; ROADMAP note.
- Tests: `tests/seam.test.js` (27 new); 346 pass; e2e "errors: none". I also walked Chapter 13 end to end in a browser at phone width.

Owner may want to decide:
- Chapter 13 opens 3 keeping days after the year ends (not on day one). Easy to change (`SEAM_OPEN_DAY`).
- Beat 7 hints that Calder made Wren's first tea without naming Tansy, so the Month 11 reveal still lands.
- The Winder's gentle lines say "nine days in ten" are lost to the river in the pitch; this is his claim in the story, not an app claim.

Left out: replaying the Stitch after it is closed; a second picture-based check for Wren's questions.

## Part 5: Your Own Text, the Field Guide additions and the claims audit

Built:
- **Your Own Text** (`src/engine/owntext.js`, `src/ui/OwnText.jsx`, `src/data/owntext.js`): "Your Shelf" opens from a card in the Field Guide (after the first gate) and a quiet card on Today when checks are due. The player pastes text, Mnemos cuts it into sections (blank lines, else 4 lines, else sentences; the player can join or split), then four still steps: Read, First letters, Line starts, Blank (the Blank step is the first check; 80 percent starts the schedule). Checks come at 1, 7, 30, 90 and 180 days, at most three a sitting, with an "I am tired today: one section only" button. A miss is gentle (due tomorrow; a second miss in a row drops one step, never to zero). Typed or Said aloud (the player marks each line); Gist, Close or Exact; "ignore vowel marks and accents" switch. The checker is Unicode-aware (tested on Latin, Arabic, Hebrew, Devanagari and Chinese, with the old `normalize()` untouched). Paste is cleaned of control and bidirectional override characters; text is shown only as plain text.
- **Role mode** (lines of a play): lines that start "NAME:" name the speaker; the player picks a role; the other roles are shown as cues and only the player's own lines are hidden and scored.
- **Lumen (owner decision):** a small amount (8 Lumen at 7 to 29 days, 12 at 30 or more) only for a TYPED check that held after at least 7 days, on a section of at least 3 lines and 15 words, once per interval per section, and inside the shared 50 a day free-practice limit. Nothing for the first day check, said-aloud checks (the player marks them), misses, or repeats. Own Text never writes to results, skills, review sets or achievements (tested).
- **Saved data `p.own`**: migration in `migrate()`, validation in `validateProfile()` (limits: 20 texts, 30,000 characters per text, 300,000 in all, 120 sections, 40 lines a section, 400 characters a line, 1.5 MB for the whole record), export and import tests. The beta and problem reports never include it (tested).
- **Export my texts only** (shelf; file `mnemos-texts`) and **Import texts** (adds, never replaces; skips ids already there or texts that do not fit). **Warning before a backup import** in Keeper when the device holds texts and the backup lacks them or differs. A backup line near Export.
- No scripture or other treasured text ships. The neutral "A text you treasure" page ships (no tradition named).
- **Field Guide pages** (`src/data/add/fieldguide.json`, built by `scripts/additions-build.mjs`): from D: lists, digits, senses, rhythm, interview, maps, reading, recall, and the extended `talk` (replaces the text of the existing id, same gate). From E: ownText, treasured, longverse, reckoning, dates, facts, exams, atlas, music, chess. Sources and builder-only keys are not shipped. The ownText page was edited because the draft said "no Lumen at all". One older test now allows 3 to 7 steps (the talk page has 6).
- **Claims audit**: Field Guide intro now says "one of the best-supported things we know" (was "the surest thing we know"); the vocabulary lesson says "Research suggests ... often" instead of "Research shows"; Your Methods shows no figures for a method with fewer than four tries; the "Map the People" sheet shows its privacy paragraph above the grid. The other findings were already fixed in the drafts or are builder rules that part 2 kept (Before and After heading and line, no `formatInspiration` shipped).
- Tests: `tests/owntext.test.js` (39). Full suite 385 passing. `npm run build:single` and `node tests/e2e.mjs` print "errors: none"; the e2e now adds a Latin text and an Arabic text, learns and checks a section, and checks for overflow at 390px.

Left out or simplified:
- The follow-up check after a miss asks the whole section (the missed lines are listed in the result), not only the slipped lines, and the section is not sent back to Line starts automatically.
- The shared `advanceSchedule()` helper from the draft was not pulled out of `applyProbe()`: Own Text has its own small schedule function so the curriculum code is untouched.
- Said-aloud checks never earn Lumen because they cannot be verified.
- No text-size control beyond the app-wide Text size setting; no model-free speech or audio.
- The Today card and shelf use existing icons only; no new art.
- Calder's letter still says "What makes a memory last is not cleverness. It is checking yourself after a gap" (his voice; the audit left it to the owner).

Owner may want to decide:
- The Lumen amounts (8 and 12) and the 3 line, 15 word minimum for a rewarded section.
- Calder's letter wording (above).
- Whether "Export my texts only" should also appear in Keeper (it is on the shelf now).
