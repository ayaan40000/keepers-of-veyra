# Mnemos Roadmap to Public Release

Nov 1, 2026 · Ayaan. Source: the Claude Doc "Mnemos Roadmap to Public Release" (ROADMAP.pdf in this folder includes the roadmap diagram).

## v0.11: District Trials (accepted Nov 2, 2026, not built)

Five optional memory trials, one in each of five districts, proposed by the idea agents and accepted by the owner. Each one sits on top of a technique the player has already been taught, so nothing new is taught here: a trial is a story scene that asks the player to use a method on fresh material and rewards only what they can recall. Build them on the existing pieces (drill templates, delayed probes, side quests, boss trials, Echo scenes); they need new content and one small trial screen, not new engines.

Rules every trial follows (same as the rest of the game): rewards only from recall that held; trials never change skill estimates (like the Crypt and Echo battles); a failed attempt costs nothing and can be retried the next day with fresh material; the story is never blocked by a trial; study and recall screens stay still and quiet; real-world people, places, brands and facts MAY be used as trial material (owner decision of Nov 2, 2026, see CLAUDE.md for the rules: true and checked, public information only, no endorsement) while the story itself stays invented; plain warm language, no em dashes.

| Trial | District (module) | Setup | Technique and drill | Pass and reward |
| --- | --- | --- | --- | --- |
| **The Catacombs of the Unnamed** | Hall of Faces (M3) | A crypt of marble statues, faces half blanked by the Tide, plaques smooth. A Warden's logbook lists descriptions and names ("Sarah of the Silver Spectacles"). | Names and Faces: feature, then name picture, then join. Study the logbook, then type the name of each statue when an echo asks. Uses the lure and changed-look faces from v0.5. | 8 of 10 names opens the iron gate and gives a ledger fragment (new lore item). Under 8: the echo lets you try again tomorrow with different statues. |
| **The Sunken Scriptorium** | Scriptorium (M7) | The lower floor is drowning in grey Lethewater and the scrolls are dissolving. Wren can save only snippets. | Facts and outlines: a 7-point timeline (for example the Night of No Moon) compressed to pictures and placed on desks and shelves. | Study and place now; a **delayed 1-day probe** tests it without the scrolls. Passing drains the water and opens the high-tier chest. The probe uses the existing delayed-recall system. |
| **The Broken Vault of the Salt Guild** | Counting House (M4) and Clockwork Market (M5) | A vault door with a grid of brass dials that reset every few minutes. Brother Ennick's leaked ledger gives a string of numbers. | Major System (the method the game teaches, not the Dominic System): turn the digits into a scene along a route, then enter the code from memory. The code is invented and changes each attempt. | Correct code opens the vault and gives a relic. A wrong code is a miss with the answer shown, never a punishment on the map. A failed run may add the Thick mist modifier to the next Crypt floor only if the player picks "make it harder". |
| **The Bridge of Tongues** | Tongues Bridge (M6) | A chasm bridge guarded by stone gargoyles who speak the dead tongue of Veyra (invented words). | Keyword method on invented old-tongue words, tied to pictures. Cross halfway at once; the gargoyles ask again **7 days later**. | Retention of 80% or more at 7 days lets you cross fully and earns a lore entry. Below 80%: a short, gentle "Recovery Descent" review of just the slipped words, then try again. The bridge never closes the story. |
| **The Clockwork Market's Disordered Gears** | Clockwork Market (M5) | The clock tower has stopped and its gear train is scattered over 15 stalls. | Memory palace: the market square is a fresh route with one picture per gear. The market view is hidden, then you **assemble the gears in reverse**, slot 15 down to 1 (Palace Walk, reverse). | A perfect or near-perfect reverse walk restarts the clocks, lifts the fog on that part of the map and gives a relic. |

Changes made to the agents' versions, with the reason:
- **Dominic System replaced by the Major System.** The game teaches the Major System (M4); the Dominic System is a different code. Examples in the Field Guide already use Major only.
- **Real names allowed in trials (owner decision, Nov 2, 2026).** The agent's example used a real politician and a fictional wizard. Trials may use real famous people, places and facts as material, as long as they are accurate and checked, public information only, and never imply endorsement. Characters from other works (the wizard) are fine as a factual name in a trial prompt but never as art or copied text. The Salt Guild, Wren, Brother Ennick and Veyra stay invented because they are the story.
- **No map-blinding penalty.** Thick mist stays an optional Crypt modifier the player can choose; a miss never degrades the map view.
- **Every gate is a soft gate.** "Progression lock" becomes "this trial unlocks a reward". The curriculum and the story never wait on a trial, matching how gate retries already work.
- **Retention threshold:** "below 80%" triggers a lighter review, not a loss, consistent with the Month 6 seven-day target of 80%.
- **Delayed components use the existing probe schedule** (1 day for the Scriptorium, 7 days for the Bridge) so a held recall is what pays out.

**Also in v0.11 (from the second idea set, adapted):**
- **Tablet-gated optional vaults** (from "The Heartledger Echo"). Same screen and save record as the trials above. A short invented tablet (5 to 7 lines, or one short phrase) is shown once and the player encodes it with a method. At a sealed vault on the map they type it from memory after a delay: first a quiet 1-day check-in with no lock, then the vault opens on a 7-day recall (30 days for later vaults). Free typing forgives case, punctuation and small typos; names and numbers must be exact. A miss shows the tablet again, marks only the missed lines, asks for a stronger picture for each, and offers a new try in 1 to 2 days with a fresh invented tablet. A hint ladder (first letter, then first word) costs only the reward for that line. The reward is lore or a relic, never progress, and an alternate route always exists. The 90 and 180 day probes are optional "long echo" bonuses for lore.
- **Calm relic repair** (from "The Altered Reliquary"). Earned relics stand on pedestals in the walkable palace room. A slipped delayed probe only dims the pedestal (the existing fading-relic rule, which today covers the 14 district artifacts). Repair is the existing Recall card plus a re-test 1 to 3 days later with a different cue, never a timed or "high-stress" challenge. No creatures, no shadow, no horror: a dim pedestal means a review is due.

Estimated size: M for the shared trial screen and save data (a `trials` record with migration and tests; the trial screen is built generically, taking an item pool and a delay, so the five trials, the vaults, the Long Vigil and Wren's delayed questions all reuse it), S per trial for content, plus one illustration each (the art pipeline in `docs/ART.md`; license note applies).

## v0.12: The Living World (accepted Nov 2, 2026, not built)

Four concepts from the idea agents (a memory architect and a systems RPG designer), accepted by the owner. They turn what the game already measures (error types, due reviews, the companion) into things the player sees in the world. Same rules as v0.11: rewards only from recall that held; none of these change skill estimates; nothing blocks the story or the curriculum; a miss costs nothing; study and recall screens stay still and quiet; invented names only; no em dashes.

| Concept | What the player sees | Built from |
| --- | --- | --- |
| **1. Phantom Limb** (shrouded character sheet) | Entering a Thick Mist district or a boss trial greys the attributes on the Character sheet to question marks. A "mirror room" of objects from earlier weeks lets the player re-light each attribute by recalling the picture attached to it. | Character sheet (v0.10), Major System images, Echo battle formats |
| **2. Lethe Brambles** (living loci) | A district sprouts thorny vines where the player's own error log shows items slipping. Clicking a thorn shows an item that was missed; the player writes a stronger, more vivid image for it. | Error diagnosis (omission counts), Recall cards, "Make It Yours" note, the generation effect |
| **3. The Long Vigil** (weekly siege) | At the end of each week, on the Quay battlements, faceless phantoms carry items learned 1, 7 or 30 days ago. Typing the right answer lights a lantern and sends a phantom away. | Echo battles (v0.10), delayed probe sets |
| **4. Wren's Audit** (protege synthesis) | Wren walks a palace route for the player and makes mistakes that match the player's own error habits. The player says what kind of mistake she made and fixes it. | Error types (omission, substitution, order), Month 9 false-memory skill, Wren and the Chronolog |

Changes made to the agents' versions, with the reason:
- **Phantom Limb:** the amnesia is story and display only, never lost data and never a lowered score. Re-lighting an attribute restores its glow and its study aid inside the next battle (Scroll of Order and similar); it never adds damage or "spells", because battle damage stays deterministic. Uses Major System images, not PAO (PAO is an optional Month 9 extra). No claim that this "deepens retrieval through state-dependent learning": that is unproven and is not said to the player.
- **Lethe Brambles:** brambles never block the story, the map or any core feature, and only guard optional chests. Typing a stronger image is not rewarded by itself (typing is not learning). The vines burn away only after the item is recalled correctly on a later review (the next day at the earliest). The player can switch brambles off. The animation plays on the map, never on a study or recall screen.
- **The Long Vigil:** built as a sixth Echo scene, so it reuses the battle engine and its rules: free-entry answers, answer shown after a miss and the item asked again later, no random loot, one skip. No hard real-time failure: phantoms approach at a pace that respects the study timer setting, and a miss dims a lantern only on screen. The "Loud Echo scrambles the audio to simulate panic" idea is dropped: sound is off by default and is not used to scare. The rare Ledger item is earned only for items that held at 7 or 30 days.
- **Wren's Audit:** Wren and the route are story, so they stay invented; the items she walks past can be real names and facts (the agents' example used a real physicist and a fictional wizard). The player picks the error type from the game's own list instead of typing a free diagnosis. The protege effect is described as "may help", not "radically reinforces". New lore comes as new Chronolog entries; the existing Undercroft tablets and their ids are not locked behind it (item and tablet ids are permanent).

**Also in v0.12 (from the second idea set, adapted): the Cabinet of Voices.** The seven attributes on the Character sheet become seven coach voices, one per skill (names to be chosen, for example Vision for Imagery and Place for the palace). They speak only on the Character page, on Today after the session and before or after a battle, never during study or recall. They give technique hints, never the contents ("a fireplace makes a good stop"), and their lines come from the player's real error type. A skill that is due for review has a "quiet" voice that calmly offers a Recall card or a lighter review. A Voices setting (off, light, full) lets players turn them down. Voices give no rewards. No "breakdown", no Tide, no punishment. The agents' example "code 4321 is an Army of Doves carrying a Big Clock" is replaced by a correct Major System example on a harmless number (a house number or a year). Derived from existing data, so no save-data change.

Estimated size: M for Concept 3 (new Echo scene and weekly entry), M for Concept 2 (map layer, Recall-card hook, save data), M for Concept 4 (route generator that copies error patterns), S for Concept 1 (display layer on the Character sheet). Each needs a short illustration; the art pipeline in `docs/ART.md` applies.

## v0.13: Wren's Story Memory and a calm pass (accepted Nov 2, 2026, not built)

From "The Social Link with Your Own Past", cut down to the part that fits. Wren shares small invented details in story beats (a name, a fear, something about her family). Weeks later she asks about one of them as an ordinary delayed question. If the player held it, they unlock a short extra scene or a Chronolog entry (story and cosmetic only). It practises the Field Guide's "details about people" playbook (Months 3 and 7). Size S to M for the logic and save data (`story.wren = { told, held }`, validated), L for the writing (drafted with the local model and edited by hand).

Refused from the original, on purpose:
- **The "Sales Manager in Texas" player.** The player is an unnamed Keeper in the invented city of Veyra. A stated job or place would exclude some players.
- **Limited daily "Mental Focus" slots.** That is an energy timer and a daily quota, both against the rules, and it pressures busy adults.
- **Bonus Focus XP and lower Crypt time pressure from a bond.** That rewards a relationship, not recall, and would change difficulty by something other than learning.
- **A "high-stakes social calendar".** Wren repeats a forgotten detail warmly. Nothing is ever locked behind it.

Also in v0.13: a rest and recovery pass (an "I am tired today" lighter session; catch-up is a lighter review of what is due, never a bonus for coming back) and an accessibility check of every new screen at 390px, 150% text and with a screen reader.

## Second idea set: verdicts (Nov 2, 2026)

Reviewed by the evidence, practical-coach, sport-champion and game-designer agents (notes in `docs/DESIGN_REVIEW_INPUT_2.md`). All four agreed on every verdict below.

| Idea | Verdict | What was kept | What was refused |
| --- | --- | --- | --- |
| The Cabinet of Voices (Disco Elysium) | Adapt, v0.12 | Technique coaches with a voice per method, tone that follows real performance, a "quiet" voice that offers a review | Interrupting during recall, "psychological breakdown", "choked out by the Tide", voices that show an answer |
| The Heartledger Echo (Outer Wilds) | Adapt narrowly, v0.11 | Delayed word-for-word recall at a vault after 7 days, free typing with a forgiving matcher, error-ledger retry | "No gates anywhere" and a forgotten code stranding the player. The curriculum and story keep their gates and never depend on a vault |
| The Altered Reliquary (Alan Wake) | Adapt strongly, v0.11 | Relics on pedestals that dim when a delayed probe slips, calm Recall-card repair | Survival horror, shadow creatures, "high-stress" challenges, a hostile palace room |
| The Social Link (Persona) | Mostly refuse, keep one piece, v0.13 | Wren's details recalled weeks later, with a story reward | Job and place for the player, time slots, bonus XP, difficulty changes from a bond |

The reviewers disagreed on one point only, the build order. The practical coach would build voices first because they are cheap; the game designer would build the generic trial screen first because four features reuse it. The roadmap follows the designer: trial screen, trials, vaults and calm repair in v0.11; voices and the living-world items in v0.12; Wren's story memory in v0.13.

Shared honest wording for the player: "A dim relic or a quiet voice means a review is due, not that you did something wrong." "This door opens from what you can recall later. If it slips, look at the tablet again and try another day. Forgetting is normal." Never: "your head is the only save file", "decay shows your memory is weakening", or anything that says the game measures or improves real memory in general.

Build order across the accepted work: **v0.11** District Trials, tablet-gated vaults, calm relic repair (new record: `trials`); **v0.12** The Living World, Cabinet of Voices; **v0.13** Wren's story memory, rest pass, accessibility check; then the v1.0 release requirements below.

## v0.10.0: Field Guide, Masters' Notes, Character, Echo battles, shipped art (released Nov 2, 2026)

Built and live. The Keeper's Field Guide (18 playbooks, a real-life task after each gate, no rewards), eight Masters' Notes, the character sheet and gear, Echo battles with five practice scenes, the Forgettings story and Keepers' Circle, and 124 shipped pixel-art pictures with day and night versions. Design: `docs/RPG_DEPTH.md`, `docs/CHAMPIONS.md`, `docs/ART.md`, `docs/LOCAL_MODEL_PLAN.md`. Tests: `tests/echo.test.js`, `tests/fieldguide.test.js`.

Still to do: play-test the battle length (target 5 to 8 minutes) with real review sets; show the daytime district lines (`src/data/daylife.js`); Qwen picture alt-text pass; a monthly Field Guide nudge during the Year of Keeping; the Great Forgetting boss battle; a delayed self-test on the player's own material.

Deferred: guilds and shared raid HP (no network), ask-again-once-per-guest at the Gala, battle sounds.

## Summary

Four more builds before a public v1.0: harden for release, deepen the learning, polish the world, then a closed beta of at least 20 adults for 4 weeks. The independent auditor rates v0.3 at 7/10 provisionally and lists 8 must-fix items, none large.

- **v0.4 Release hardening:** the 8 auditor must-fixes plus accessibility blockers.
- **v0.5 Learning depth:** harder, more realistic face drills, review built into relics and the Crypt, a coached first day.
- **v0.6 World and story:** gate restoration animations, chapter cutscenes, Crypt boss floors and weekly challenges.
- **v0.7 Closed beta:** real players tune difficulty, session length and the Crypt curve.
- **v0.8 Palace and polish:** walkable palace room, keyboard and controller, install prompt.
- **v0.9 The Year of Keeping:** after-the-year mode and epilogue, words from friends after gates, late-year seals, furniture picks, boss trials, new modifiers, deeper tablets, run card.
- **v0.10 Field Guide and Echo battles (released):** the Keeper's Field Guide, Masters' Notes, character and gear, Echo battles, shipped pixel art. See `docs/BEYOND.md`, `docs/CHAMPIONS.md`.
- **v0.11 District Trials (accepted, not built):** five optional memory trials in the Hall of Faces, Scriptorium, Counting House, Tongues Bridge and Clockwork Market, plus tablet-gated optional vaults and calm relic repair.
- **v0.12 The Living World (accepted, not built):** Phantom Limb attributes, Lethe Brambles on the map, the weekly Long Vigil, Wren's Audit, and the Cabinet of Voices as coach hints.
- **v0.13 Wren's Story Memory (accepted, not built):** a delayed recall of Wren's details with a story reward, a rest pass and an accessibility check.
- **v1.0 Public release:** GitHub Pages, trademark cleared, licences shipped, after owner approval.

Already fixed: the shared pixel engine (`src/pixel/core.js`) was split into `raster.js` (plain JS) and `components.jsx` (React), so every module imports it normally.

## Status (Nov 1, 2026: v0.7.0 built)

| Build | Status |
| --- | --- |
| v0.4 Release hardening | Built. All backlog items in. Audit re-run still to do. |
| v0.5 Learning depth | Built. All backlog items in; 147 unit tests pass. |
| v0.6 World and story | Built. Layered depth effect left for v0.8 (day, dusk and dawn light done). Map as optional home view not done. |
| v0.9 The Year of Keeping | Built (v0.9.0): Year of Keeping and epilogue, gate talk, four late-year seals, palace furniture picks, boss trials, Thick mist and Loud echoes, tablets to floor 70, run card. |
| v0.8 Palace and polish | Built (v0.8.0): walkable palace rooms, keyboard and controller, install prompt after day 3, three-quarter faces, map depth, map as home. Beta skipped by owner decision. |
| v0.7 Closed beta | Software built (session-length measurement, beta report, problem report, Crypt end tally, simulated retune). The beta itself needs 20+ testers for 4 weeks: see `docs/BETA.md`. |

Not done in code, needs people: WCAG 2.2 AA check with NVDA and VoiceOver, device testing on real phones, 500-face representation review, trademark search, beta recruitment.

## Roadmap gates

| Build | Scope | Gate to move on |
| --- | --- | --- |
| v0.4 Release hardening | Auditor must-fixes, accessibility blockers, phone menu | Audit re-run at 8/10 |
| v0.5 Learning depth | Lure faces, echo floors, recall cards, coached first day | All tests pass |
| v0.6 World and story | Restoration animation, cutscenes, Crypt boss floors, weekly seed | Feature freeze |
| v0.7 Closed beta | 20+ adults for 4+ weeks, two usability rounds, retune difficulty | Crash-free, session length measured |
| v0.8 Palace and polish | Walkable palace room, keyboard and controller, install prompt | Trademark and licences clear |
| v1.0 Public release | GitHub Pages, free and open source | Owner approval |

## What each agent recommended

| Agent | Top recommendation | Other priorities | Biggest release risk |
| --- | --- | --- | --- |
| Faces and portraits | Lure faces that differ in only 1 or 2 features (M) | Same person, changed look; show key features after each answer; better contrast on very dark skin | Representation review of 500 faces; text-hint mode for low vision |
| Relics | Recall cards: answer a question to polish an item (M) | Fading relics when a probe slips; Calder's Ledger as a book; grouped unlock screen | Item ids must never change; sparse mid-year rewards |
| Undercroft (Crypt) | Echo floors re-asking items from two floors up (S) | Boss floor every 10th; weekly seed; modifiers | Untested difficulty; timed floors ignore extended timers; free retry on mid-floor close |
| World and scenes | Gate restoration animation (S) | Walkable palace room; cutscene panels; day and night; layered depth | Battery on low-end Android; ~880 KB bundle; map needs text labels |
| Game UI | 5-slot phone navigation with a Menu (S) | Coached day 1; settings with text size; keyboard/controller; install prompt | Focus hidden behind sticky bars; canvas text equivalents; colour-only cues |
| Independent auditor | 8 must-fixes before v1.0 | Migration tests, changelog, issue template, privacy statement | Stale offline cache; sound on by default; font licence text missing |

## Feature backlog

Effort: S under a day, M 1 to 3 days, L a week or more.

| Phase | Item | Area | Effort |
| --- | --- | --- | --- |
| v0.4 | Version the service-worker cache per release; "update available" prompt | Operations | S |
| v0.4 | Sound off by default; separate mute for dialogue blips | Accessibility | S |
| v0.4 | Ship OFL font licence text and a third-party licence list | Legal | S |
| v0.4 | Validate all save data (Crypt, relics, quests), 5 MB import cap, 50 corrupted-file tests | Security | M |
| v0.4 | Crypt honours `prefs.timerMult`; leaving mid-floor costs a flask | Crypt | S |
| v0.4 | Backup reminder after 7 days; Safari data-loss warning; storage persistence status | Data | S |
| v0.4 | Focus never hidden behind bars; 200% text; shapes as well as colour | Accessibility | M |
| v0.4 | Text equivalents for map, Crypt and portraits | Accessibility | M |
| v0.4 | Test that fails if any item id changes | Relics | S |
| v0.4 | Phone navigation: Today, Veyra, Crypt, Progress, Menu | UI | S |
| v0.4 | Session-length copy "about 20 to 30 minutes" until measured | Honesty | S |
| v0.5 | Lure faces and "same person, different look" drills | Faces | M |
| v0.5 | Show each face's key features after answering | Faces | S |
| v0.5 | Echo floors in the Crypt | Crypt | S |
| v0.5 | Recall cards and fading relics | Relics | M |
| v0.5 | Coached day 1 with Wren; first-time tips; replay tips | UI | M |
| v0.5 | Settings regrouped; text size 100 to 150%; volume controls | UI | M |
| v0.5 | Larger word and name pools | Content | M |
| v0.6 | Gate restoration animation on the map | World | S |
| v0.6 | Chapter cutscene panels | Story | M |
| v0.6 | Portrait moods match each dialogue line | Story | S |
| v0.6 | Calder's Ledger book view; grouped unlock screen after gates | Relics | S |
| v0.6 | Crypt boss floors, weekly seed, modifiers | Crypt | M |
| v0.6 | Day, night and weather palettes; layered depth effect | World | M |
| v0.6 | Mid-year rewards | Relics | S |
| v0.7 | Closed beta: 20+ adults, 4 weeks minimum | Testing | L |
| v0.7 | Two usability rounds of 6 to 8 people plus accessibility testers | Testing | M |
| v0.7 | Local stats on where Crypt runs end; retune toward floors 8 to 12 | Crypt | S |
| v0.8 | Walkable palace room | World | L |
| v0.8 | Keyboard and controller play; install prompt after day 3 | UI | M |
| v0.8 | Three-quarter view faces | Faces | L |
| Later | Shareable run card; opt-in leaderboard (needs a server) | Crypt | S / L |
| Later | Translations; anonymous opt-in research export | Platform | L |

## UI and UX changes

| Change | Phase |
| --- | --- |
| Five-slot phone menu (Relics, Palaces, Keeper inside Menu); desktop keeps side list | v0.4 |
| Crisp pixel scaling at whole multiples; empty states for Relics, Crypt, Palaces, Progress | v0.4 |
| Coached first day; settings in four groups (Audio, Display, Training, Data) | v0.5 |
| Reliquary "recently earned" row and skill-based hints; Crypt failure coaching, run map, "Resume descent" | v0.5 |
| Map as optional home view; one grouped unlock moment per session | v0.6 |
| Keyboard and controller; install flow | v0.8 |

Study and recall screens stay still and quiet in every phase.

## Public release requirements

### Must
- [ ] Honest claims: "performance on Mnemos tasks" only; no memory or IQ promises.
- [ ] Session length copy "about 20 to 30 minutes" until beta measures the median.
- [ ] Training Score provisional for 14 days; "not an IQ or clinical test" on onboarding, Progress and README.
- [ ] Data safety: local-only notice, 7-day backup reminder, Safari warning, export/import covers all state.
- [ ] Import security: full validation, 5 MB cap, no imported text as HTML, 50 corrupted files tested.
- [ ] Legal: trademark search for "Mnemos" (US, EU, Canada); OFL text shipped; third-party licence list; content attribution list.
- [ ] Accessibility: WCAG 2.2 AA with NVDA and VoiceOver; sound off by default; 200% text.
- [ ] Devices: desktop Chrome, Firefox, Safari, Edge; iPhone Safari; Android Chrome incl. one low-end phone.
- [ ] Closed beta: 20+ adults for 4+ weeks.
- [ ] Versioned offline cache with update prompt.

### Should
- [ ] Old-save migration tests; changelog; issue template and in-app problem report; privacy statement with a no-network CI check; performance budget; 500-face representation review.

### Could
- [ ] Opt-in research export; translations; small pilot study.

## Open decisions

1. Keep the name "Mnemos" if the trademark search finds conflicts (fallback: "Keepers of Veyra").
2. Sound off by default (recommended).
3. No leaderboards for v1.0.
4. Walkable palace in v0.8, after the beta.
5. Map as home screen: optional first.
6. Three story choices from the relics build (Gallery key, Warden ring, page 12 text). Approved by the owner on Nov 1, 2026.
7. Beta recruitment: owner recruits 20+ adults.
8. GitHub account and repository name. Decided Nov 1, 2026: ayaan40000/keepers-of-veyra, hosted on GitHub Pages for the closed beta.
