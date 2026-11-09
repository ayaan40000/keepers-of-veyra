# Mnemos syllabus audit: two learners, one year

Date: Nov 8, 2026. Status: report only. No code or data was changed. Written for Ayaan in plain language.

Reviewer stance: a memory-sport coach (the ten championship disciplines, Memory League, number, card and binary systems, journey management) and a learning scientist (retrieval practice, spacing, interleaving, Dunlosky and colleagues 2013, elaboration, generation, the limits of the keyword method, understanding versus rote).

What I read: `CLAUDE.md`; `docs/SYLLABUS.md`; `src/data/curriculum.js`; `src/data/lessons.js` plus `src/data/add/lessons.json` and `lessons-lang.json`; `docs/CURRICULUM_ADDITIONS.md`; `docs/CHAMPIONS.md`; `docs/BEYOND.md`; `docs/ROADMAP.md`; the curriculum and evidence tables of `docs/PRODUCT_DOSSIER.md`; `CHANGELOG.md`; `src/engine/core.js`, `progress.js`, `session.js`, `additions.js`, `abstract.js`, `lang.js`, `scene.js`, `owntext.js`; `src/data/abstract.js`, `scenarios.js`, `events.js`, `owntext.js`, `fieldguide.js`, `masters.js`; and the pools in `src/data/add/` (cards, dates, poems, maps, skim, steps, numbered, vocab, trivia, speedmath, fieldguide). Pool sizes were counted from the files.

Status words used throughout:
- **Shipped**: in a released or committed version (1.0.0 or 1.1.0, see `CHANGELOG.md`).
- **In progress**: in the working tree, not committed (the 1.2 "Unreleased" section of `CHANGELOG.md`: `abstract.js`, `scenarios.js`, `lang.js`, `vocab.json`, `lessons-lang.json`, and the 1.2 edits to `curriculum.js`).
- **Planned**: written down in a doc but not built.
- **Absent**: not in code and not in any plan I found.

---

## 1. Verdict in ten lines

1. **Learner A (aspiring champion): not suitable as a path to competition, and the dossier says so on purpose** (`PRODUCT_DOSSIER.md` lines 64 to 65 and 102: PAO "optional", cards "excluded from core", speed weighted 10%). It is a good first three months for a future competitor and then stops growing.
2. Four of the ten championship disciplines are absent (binary, spoken numbers, abstract images, the fictional-dates format), and there is no hour-long ("marathon") training of any kind.
3. The number system stops at a 2-digit Major list (`p.major`, 00 to 99). There is no 3-digit system, no PAO data or drill (Week 38 is a lesson card over ordinary drills) and no card-image list the game can store (`cards.json` "own": "keep them on paper").
4. Gate volumes top out at 40 digits in 5 minutes (M5), 30 words (M8, Week 52), 10 faces with first names only (M3, M11). Gates are always taken at level 1 (`session.js` line 45), so they never get harder.
5. **Realistic ceiling for Learner A after the year as built:** roughly club level in words and names, below club level in numbers and cards. **With the Champion Track proposed below and 30 minutes a day,** a dedicated adult could reach the lower end of national level in 2 or 3 disciplines (unverified estimate). World level takes years of 1 to 3 hours a day, and no 30-minute game can promise it.
6. **Learner B (practical learner): a good method course with a weak "keep it for years" loop.** Methods for lists, names, numbers, vocabulary, outlines, poems, formulae and dates are taught and drilled, and the 1.2 work (Real-life Scenes, next-day questions asked another way) is a real step up for transfer.
7. The critical hole: **there is no place to put your own cue-and-answer material** (your vocabulary, your formulae, your dates, your jokes, your book notes) **and have it reviewed for months.** Your Own Text (`src/engine/owntext.js`) handles word-for-word text only and stops at 180 days; Carry it (`scene.js` line 123) asks only at 1 and 7 days and keeps 30 entries.
8. Understanding is taught in words (Week 29 self-explanation, Field Guide caveats) but never tested: no drill asks the learner to explain, apply a formula, or summarise a book's argument.
9. **Realistic ceiling for Learner B after the year:** can reliably memorise a 10 to 20 item list, a phone number, 10 new names, a 7-point talk, a 16-line poem and a set of 20 words, and keep them for about a month. Keeping their own material for a year needs the Keeper's Deck proposed in section 4.
10. Fixing the top five gaps (own deck, long spacing, 3-digit or PAO plus card storage, real competition scoring in an optional track, an understanding check) keeps the 30-minute day and the honest framing.

---

## 2. Coverage matrix

Severity is for the learner named in the row (A or B). Where both learners care, the higher one is given.

### 2a. The ten championship disciplines (Learner A)

| Topic | Status | Where | What is good | What is wrong or missing | Severity |
| --- | --- | --- | --- | --- | --- |
| Speed Numbers (5 min) | Shipped (scaled down) | M4 W14 to 17, M5 W18 to 21, W33, W44, M5 gate (40 digits, 300 s), Event Hall "The Counting Rows" (`events.js`: 1 to 4 rows of 20) | Major code taught correctly (W14 lesson); pairs to images to loci (W18, W19); row scoring exists (`additions.js` `rowScore`, `core.js` line 211) | Ceiling is 80 digits in the Event Hall and 40 at the gate. Curriculum drills score digit by digit (`core.js` line 186), so a wrong digit costs one point, not the row. Rows are 20 wide (USA format); WMSC rows are 40 (search result, see section 6). No grouping of 3 digits per image. | Critical |
| Hour Numbers (marathon) | Absent | none | none | No long-format training at all; the longest digit task is 46 digits (W52 check 30 digits at level 10 scaling, `scaledSpec`). No endurance, no recall-sheet strategy for 1,000+ digits. | Critical |
| Binary (30 min) | Absent | grep finds "binary" only in `licenses.js` | none | No binary-to-decimal (3-bit to 1 digit) system, no binary drill, no rows of 30. | Critical |
| Spoken Numbers (1 digit a second) | Absent | `scenarios.js` `present: 'spoken'` is text on screen, not audio | Voicemail scene shows numbers in spoken grouping | Needs audio. **`CLAUDE.md` forbids sound on study and recall screens** except one submit sound, so this needs an owner decision (section 7). No one-pass, no-replay encoding practice. | Critical |
| Abstract Images | Absent | none | none | No image set, no row-reordering recall. The game already draws pixel art in code, so generated abstract shapes are feasible. | Major |
| Historic / Future Dates (5 min) | Partly shipped, wrong format | W20 and W38 `facts src: 'dates'` (1.2, in progress); Event Hall "Year Round" (`events.js`); Hall of Years trial | Year to Major pictures taught well (`lessons-lang.json` W20 card); BCE handled (`abstract.js` `yearOk`) | Uses 63 real events (`dates.json`, 9 sets of 7). The championship uses invented events with years 1000 to 2099 and asks year from event (search result: "fictional events and historic years"). 63 events are learned by heart within weeks, so the drill becomes a quiz. | Major |
| Playing Cards (hour) | Absent | none | none | No multi-deck training, no 2-card-per-image (1,352 or 2,704 image) systems. | Critical |
| Speed Cards | Shipped (optional, no credit) | Event Hall "The Rook Run", `cards.json` (rule "World and Count", ladder 10 to 52, 4-week day plan) | Honest "no skill credit" framing; longest-correct-run scoring; two trials | 1 card = 1 image only. The "World and Count" rule makes number cards counts of objects (2S oars, 5S starfish), which collide in a crowded journey (many "several small things" images). Card pictures cannot be saved in the game (`cards.json` "own"). Not in the 52 weeks at all. | Major |
| Random Words (15 min) | Shipped (scaled down) | M1, M2, M8 (gate 30 words, 180 s), W45 wordlist 20 timed; Event Hall "Bridge Tally" (20, 40, 100 numbered) | Palace placement, reverse, numbered random access (V4) | Only concrete nouns from a 420-word pool (`content.js` CONCRETE 314 + 106); competitions mix in abstract nouns and verbs (unverified ratio). Spelling is forgiven (`util.js` `matches`, 1 edit), competitions score exact spelling and columns. Pool repeats within weeks. | Major |
| Names and Faces (15 min) | Shipped (scaled down) | M3 W9 to 13, gates M3, M10, M11; surnames only in Event Hall (V5) | Feature selection, name to image, look-alikes and restyles at level 3, 5, 7 (`core.js` `scaledSpec`) are better than most courses | Curriculum uses first names only. Pool is 110 first names (`NAMES` 90 + 20), so names repeat within two weeks and recall becomes recognition. Spelling forgiven. Max 10 faces at a gate, 24 in the Event Hall. | Major |

### 2b. Competition craft (Learner A)

| Topic | Status | Where | What is good | What is wrong or missing | Severity |
| --- | --- | --- | --- | --- | --- |
| 2-digit Major | Shipped | M4, `p.major` editable, `MAJOR_PAIRS` 100 | Correct code, hooks, personal list, 3 s target with per-item timing (`progress.js` `speedScore`) | Timing includes typing the word, which measures typing, not image speed. | Minor |
| 3-digit system (1,000 images) | Absent | none | none | Standard for international level (CHAMPIONS.md names a champion known for 3-digit Major images). No storage beyond 00 to 99. | Critical (A) |
| PAO / PA | Lesson only | W38 lesson card; drills are `major` and `digits` as in M4 and M5 (`curriculum.js` W38) | Honest "optional" framing | No person, action or object fields; no drill builds or uses PAO; the week title promises something the drills do not train. | Major |
| Card system | Partial | `cards.json` 52 single images | Clear rule, quick to learn | No storage, no 2-card system, no drill to automate card-to-image under 1 s. | Major |
| Binary system | Absent | none | none | 3 bits to a digit to the Major image is the usual route. | Critical (A) |
| Palace count and loci | Partial | W5 (10 stops), W32 (50 stops), Palace editor (max 200 loci per palace, `store.js` line 231) | Walkable palace rooms, rotation by "least recently used" (`Drill.jsx` line 134) | Competitors need hundreds to thousands of loci (an hour of numbers at 2 images a locus needs several hundred). No target, no inventory view, no total loci count, no journey quality check. | Critical (A) |
| Journey reuse and rest | Partial | W8, W36 lessons ("rest a day"), M9 interference drills | Correct advice | Not enforced or tracked: the app records `lastUsed` but never warns that a journey is "hot". No ghost-image error tracking per journey. | Major |
| Recall-sheet discipline | Absent | none | none | No practice of writing recall in competition layout, marking blanks, or when to guess (guessing is free in most events, costly in row-scored ones). | Major |
| Competition scoring | Event Hall only | `rowScore`, Deck Run longest run, poem strict mode | The rules are modelled honestly where implemented | The 52 weeks never use them; curriculum scoring is per item and forgiving everywhere. | Major |
| Speed targets | Partial | M8, "timed" spec | Accuracy first (dossier) is the right coaching | `speedScore` gives 0.67 when the study timer simply runs out, which always passes the 0.6 bar (`progress.js` lines 36 and 43, study auto-ends in `Drill.jsx`). So "timed" gates cannot fail on speed. No self-paced "finish early" event except cards. | Major |
| Marathon vs sprint | Sprint only | Memory League style is close to the 1 to 3 minute drills | Short formats fit 30 minutes | No 15, 30 or 60 minute events. | Critical (A) |
| Mental routine | Lessons only | W44 to W46 lessons (breathe, plan time split) | Sensible | No pre-event routine practice, no review-pass strategy drills (one pass vs two). | Minor |
| Mistakes analysis | Partial | Error types per skill (`core.js` R4), Error Ledger Masters' Note, Lethe Brambles | Error types are tracked | No per-image error ledger: the game cannot say "your 47 and 74 swap" or "your loci 12 and 13 blur". | Major |
| Plateau breaking | Absent | Personal Best Ladder note only | none | No deliberate-practice prescriptions (image upgrades, locus redesign, overload days). | Minor |
| Memory League formats | Absent as such | none | 1-minute formats fit the 30-minute day | No 1-minute Numbers, Cards, Words, Images, Names formats. | Minor |

### 2c. Learner B topics

| Topic | Status | Where | What is good | What is wrong or missing | Severity |
| --- | --- | --- | --- | --- | --- |
| Abstract subjects and concepts | Partly shipped | W23 abstract-to-concrete pairs (`ABSTRACT` 80 + 30), W27 to 29 facts and Mind Map (24 topic maps), W29 self-explanation lesson | Substitution and map-then-rebuild (Karpicke and Blunt honest card, W27) | Concepts are reduced to single words or leaves. No drill tests explanation, relations, examples or application. Self-explanation week drills only cue-answer recall. | Major |
| Numbers (real) | Shipped | M4, M5, W20, voicemail and tram scenes (in progress), Field Guide "digits" | Good; scenes ask the way life asks | Fine for B. PIN wording risk (section 3, G13). | Minor |
| Dates, events, historical facts | Shipped / in progress | W20, W38 dates; Year Round; Scriptorium trial timelines; Field Guide "dates" | Year to Major, timeline palace | Year only: no day and month, no ordering of events, no "what happened in 1848" reverse questions except some 1.2 probes. No own-timeline tool. | Major |
| Speeches and presentations | Shipped | W28 talk points, Field Guide "talk", "toast", "interview", Own Text for verbatim | Gist outline plus verbatim opening and closing is the correct split (BEYOND.md) | No drill rehearses delivering from the outline (recall of points is tested, not the spoken bridge between them). Fine for a game; flag for Field Guide wording only. | Minor |
| Vocabulary, English | Partial | W27 word roots study set (`pools.json`), abstract words | Roots are a strong choice | No English vocabulary drill (word to definition, definition to word, usage). | Major |
| New language: words | Shipped / in progress | M6 W22 to 25, W35, W37, W42, W45, W49; es 106, tr 101, sw 70, old 134 | Keyword honesty card (W22), produce direction, look-alikes, accent folding, 1-3-7-14-30-60 days (`core.js` `VOCAB_PROBE_INTERVALS`) | 100 words a language is a taster. No user word list (M6 "transfer" promises "your own vocabulary list", not built). | Critical (B, own list) |
| Gender | In progress | W42 `gender: true` (Spanish el/la), fire/ice card | Correct method (colour or element per gender) | Spanish only, one week. | Minor |
| Conjugation and grammar | Absent | none | none | No verb tables, no pattern drills. Mnemonics help with irregular forms; grammar needs comprehensible input and production. | Major |
| Phrases | In progress | W45 `src: 'phrases'` (es 20, tr 16) | Chains of words plus a place to say it | Small; scored as near-exact lines, fine. | Minor |
| Pronunciation | Text only | say-it spellings (`vocab.json`), W22 "say it aloud" card | Production effect is used (say aloud) | No audio because of the no-sound rule. A say-it spelling is an honest rough guide (`vocab.json` honest line). Needs owner decision for optional audio outside study screens. | Major |
| Religious or treasured verses (verbatim long text) | Shipped (tool only) | Your Own Text (`owntext.js`), Field Guide "treasured", "longverse" | First letters, line starts, blanks; gist/close/exact pass levels; no scripture ships (owner decision); accuracy disclaimer | Reviews stop at 180 days (`OWN_INTERVALS`). No perpetual rotation (the way people keep a long memorised text: a fixed cycle, for example a part a day forever). Caps of 30,000 characters per text and 300,000 total (`CAPS`) force long scriptures into many texts. | Major |
| Jokes and a personal joke encyclopedia | In progress (pool only) | W12 `src: 'jokes'` (21 jokes), dinner scene | Keyword scoring of punchlines (`jokeOk`) is right | No place to save your own jokes and review them; no "joke palace" by theme (a joke encyclopedia is a set of themed rooms). | Major |
| Formulae (maths, physics) | In progress | W29, W42 `src: 'formulas'` (24 formulae, 12 chemical), symbol-picture card (W29) | Legend shown while studying; next-day question asks another part | Fill one token only. No whole-formula production in practice, no symbol image list to learn and drill, no structure check (units, which side, what happens if r doubles), no use of the formula on a number. | Major |
| Financial formulae (NPV, CAGR, compound interest, ratios) | Partly absent | Only `fx-interest` (yearly compound) | Correct | NPV, CAGR, continuous compounding, annuity, ROI, margins, P/E, current ratio, debt to equity: absent. | Major |
| Recipes | In progress | `sc-recipe` scene (W43), Field Guide "recipes" | Chain for steps | One scene. Quantities and oven temperatures are numbers and should be tied to the step image. Fine for scope. | Minor |
| Book summaries (non-fiction, self-improvement) | Partly shipped | W41 Skim, Pick, Keep (12 texts), Field Guide "books" and "reading" | Honest "a picture is a label, not the argument" caveat (`fieldguide.js` books) | The drill scores one keyword per heading, which tests labels, not ideas. No free-recall summary, no "explain the idea and an example", no spaced review of book notes. | Major |
| Long-term retention of own material | Partial | Own Text (to 180 days), Carry it (1 and 7 days, 30 entries) | Delayed checks only reward held items | No own cue-answer deck. Nothing is reviewed past 180 days. | Critical |
| Transfer to own material | Partial | Field Guide "try-m" tasks, Carry it, Scenes (1.2) | Scenes are fresh every time and asked in a new form the next day | M10 objective "Apply chosen techniques to 3 personal projects" has no project record. | Major |

---

## 3. Gaps done incorrectly

Each item: what is wrong, the evidence, and the fix.

**G1. Practice sets retire after 30 days and pass at 50%.** Practice sets use `PROBE_INTERVALS = [1, 7, 30]` (`core.js` line 23) and are retired after the 30-day probe. A probe passes when accuracy is at least 70%, *or* at least 50% when the first score was low (`applyProbe`, `ratio >= 0.8 && acc >= 0.5`). Only the first practice drill of a session is stored for probes (`progress.js` `isFirstPractice`), plus one scene. Effect: most of what is practised is never checked after a day, and nothing outside gates is checked after a month. Fix: keep the first-drill rule (it keeps sessions short), but extend practice intervals to [1, 7, 30, 90] for sets with an immediate score of at least 80%, and require 70% for a pass at 30 days and later. This changes stored sets only going forward, because each set keeps its own `intervals`.

**G2. Gates never scale and the "speed" check cannot fail.** Gates and baseline run at level 1 (`session.js` line 45). `speedScore` divides target time by time used; the study countdown always ends study at the target (`Drill.jsx` `useCountdown(... studySecs, endStudy)`), so the score is at least 1/1.5 = 0.67, above the 0.6 bar (`progress.js` lines 36 and 43). The M8 "Speed Gate" message "timed drills must also meet the target pace" (`Session.jsx` line 270) can therefore never be the reason for a fail. Fix: either say plainly that timed gates are fixed-time formats (which is how most competition events work) and remove the pace message, or add a self-paced "finish early" mode where speed counts. Keep the gate itself at level 1 for comparability.

**G3. A lesson promises a rule I could not find in the engine.** Week 33 lesson (`lessons.js` 33): "if your accuracy drops below 75% on timed drills, you get study time back automatically". M8 `remediation` says the same. A search of `src/engine` found no 0.75 rule; the nearest is R3 remediation at a 60% running average (`core.js` `updateSkill`), which gives 1.5 times study time. Fix: implement it, or change the card to describe R3 honestly.

**G4. Week objectives do not match their drills.** Week 18 objective "16 digits", drill 12. Week 19 "24 digits in 3 minutes", drill 20 in 150 s. Week 21 "40 digits in 5 minutes", drill 24 in 180 s (only the gate has 40). Week 33 "24 digits in 2 minutes", drill 20 in 100 s. Week 32 "Extend your palace to 50 stops", drill 20 items. M2 mastery "90% forward and 85% reverse", gate threshold a single 0.88 mean (`curriculum.js` GATES M2). Level scaling (`scaledSpec`: +6% items and -3% time a level) explains some of this, but at level 1 the stated objective is not what the player does. Fix: phrase objectives as "by the end of the week" and make the check drill equal to the objective.

**G5. Week 38 PAO trains no PAO.** Title "PAO (Optional Track)", lesson explains PAO, drills are `major` 20 timed, `digits` 18 and dates (`curriculum.js` W38). Nothing stores or asks for a person, action or object. Fix: either rename the week ("Faster numbers: three digits per scene, optional") or build the PAO builder in section 4 (P3) and give the week a PAO drill with credit only when the player has a PAO list.

**G6. The card system is likely to cause clashes at volume.** `cards.json` "World and Count": number cards are counts (two oars, five-armed starfish, six gulls, seven coins, eight-armed octopus, nine pearls, ten fish). At 26 or 52 cards on 13 to 26 stops, images that are "a group of small things" blur together, and suit worlds share settings so two Hearts cards on one stop look alike. Fine for a 10 to 20 card taster; a poor base for speed. Fix: keep it as the beginner rule, and offer a second, "person per card" style option (each card a distinct character or object with a unique action), saved in the game (P4).

**G7. Forgiving spelling everywhere teaches the wrong habit for competition.** `matches` accepts one edit for words of 5 or more letters and plural endings (`util.js` line 66). Names, words and poems in competitions need exact spelling. Fix: keep the forgiving matcher in the 52 weeks (it is right for Learner B), add a strict switch in the Champion Track and the Event Hall (Poem Page already has strict mode).

**G8. Small pools turn recall into recognition.** `CONCRETE` 314 + 106, `NAMES` 90 + 20, Swahili 70, 24 formulae, 63 dated events, 21 jokes, 12 skim texts, 24 maps. A player who does 30 to 40 words a day meets every word in about two weeks; names cycle faster. Familiar items inflate scores and the Quarter batteries become less comparable. Fix: grow the word pool to at least 2,000 (competition word lists draw from far larger sets) and names to 1,000 first names and 1,000 surnames (public, common names from many cultures); for dates use generated invented events (no accuracy risk). For Learner B content (formulae, dates, facts) small pools are fine, because learning them for good is the goal; say so.

**G9. Delayed review asks about part of a set.** Probes take the first 8 cued items, the first 10 ordered items, or 20 digits (`core.js` `probeItems`). For a 30-stop palace, stops 11 to 30 are never checked later. Fix: sample across the whole set (keep the order for ordered sets) so late stops are tested too.

**G10. Formula drill accepts a wrong answer.** `abstract.js` `fx-photo` has `alt: { 6: ['O₂', '6 O2'] }` for the blank `6O₂`. "O₂" without the 6 is accepted, which drops the coefficient that balances the equation. Fix: remove `'O₂'` from that alt list. (Content accuracy, section 7.)

**G11. The keyword method is framed honestly, but vocabulary depth is not.** W22 card says keywords fade without retrieval (good, matches Dunlosky 2013 and CHAMPIONS.md). But M6 objective "Learn 20 foreign words and retain at least 80% after 7 days" sits in a module that never touches grammar or listening, and the M6 transfer "your own vocabulary list" has no feature. Fix: build the own deck (P1) and add a one-line honest note to M6: "This month teaches you to keep words. Speaking a language takes listening, grammar and conversation as well."

**G12. "Understanding" weeks test recall only.** W29 "Self-Explanation: Explain encoded facts in your own words", drills `facts`, `map`, `formulas`. W41 "Learning from Books" tests one keyword per heading. Learner B needs schema, not labels; Dunlosky 2013 rates elaborative interrogation and self-explanation moderate, and imagery for text low. Fix: an "Explain it" step (P7) that is self-scored against a model answer, rewarded only when the delayed version holds, never auto-graded as if it were exact.

**G13. Honest-claim risks in lesson text.**
- W1 card 1 (`lessons.js` 1): "Here is something memory champions all agree on: most forgetting happens in the first two seconds". Not supported by any source in `CHAMPIONS.md`; reads as an attributed claim. Fix: "Much forgetting starts with never really noticing the thing."
- W5 card 1: "almost every memory champion alive uses it". CHAMPIONS.md supports only "9 of 10 competitors in one study (Maguire 2003) used the method of loci". Fix: "Most memory competitors studied in research used it."
- W38 card 2: "Memory competitors love it." Unverified generalisation. Fix: "Many competitors use a version of it."
- M4 `transfer` (`curriculum.js`): "Encode a PIN-length code you already know and check it." CHAMPIONS.md cut all PIN and code advice. Fix: "Encode a house number or a year you already know."
- M12 `unlock` and W52 card: "Keeper mode ... monthly expeditions". What ships is the Year of Keeping (daily weeks revisited, `session.js` `keepingDay`). Fix the words.

**G14. Lumen for top-up rounds.** `session.js` lines 164 to 165 add up to three extra practice rounds while the session is under 22 minutes, each earning `10 * acc` Lumen (`progress.js` line 72). The amount rises with accuracy, so it is tied to demonstrated performance, but at level 1 on an easy drill this edges toward "repetition of easy drills". Fix: top-up rounds earn Lumen only at or above the player's current level for that skill, or earn none.

**G15. Week 12 mixes jokes into "Mixed Review" as a linking drill** (`curriculum.js` W12, `skill: 'linking'`). A joke punchline drill crediting the Linking skill estimate muddies that estimate. Minor. Fix: count jokes toward Structure, or give no skill credit like `calc`.

---

## 4. Things left out entirely, with proposals

Sizes use the roadmap scale: S under a day, M one to three days, L a week or more. "Extends" means the existing template can carry it with a new spec key; "new" means a new screen.

### P1. The Keeper's Deck: your own cue-and-answer cards (Learner B, critical)

- **What:** the player types pairs (cue and answer) into named decks: "Spanish verbs", "Finance formulae", "My jokes", "Dates for history class", "Book: chapter ideas". Optional picture note per card (their image, never required). Optional deck palace (link a deck to a palace so card 7 sits on stop 7).
- **Tests:** cued recall, typed or "say it and mark yourself" (forgiving matcher for typed, honest self-mark for spoken). Optional reverse direction per deck.
- **Schedule:** expanding intervals with no end date: 1, 3, 7, 14, 30, 60, 120, 240, then every 365 days. A miss returns the card to day 1. Cap new cards a day (default 10) and reviews a day (default 40) to stay inside 30 minutes.
- **Pass bar:** a card is "kept" at its first held review after 30 days or more.
- **Rewards:** only a held review after 7 days or more earns a little Lumen, inside the existing daily cap (same rule as Own Text, `owntext.js` `OWN_LUMEN`). Never changes skill estimates.
- **Content:** none ships; optional starter decks from existing checked pools (capitals, elements, formulae, roots).
- **Template:** extends the `facts` drill for display and scoring; new record `p.deck` (decks, cards, history) with migration, validation, caps (for example 50 decks, 5,000 cards, 400 characters a side) and import tests, following the `own` record pattern. Size M to L.
- This one tool closes vocabulary (own list), formulae, dates, jokes encyclopedia, book notes and exam terms for Learner B.

### P2. Long-term rotation for Your Own Text (Learner B)

- **What:** after the 180-day check, a section moves to "rotation": the whole text is split into equal daily portions so every section is recited at least once every N days (player picks N: 7, 14, 30). This is how people keep long memorised texts.
- **Tests:** existing Blank step; pass levels gist, close, exact (`owntext.js` `PASS_LEVEL`).
- **Schedule:** fixed cycle forever; a slipped section returns to the 1, 7, 30 ladder.
- **Pass bar:** existing.
- **Template:** extends Own Text. Raise `charsPerText` for long works only after a phone performance check. Size M.

### P3. Number systems builder: 3-digit and PAO (Learner A)

- **What:** a "Systems" page next to the Major list: optional 000 to 999 list (built 100 at a time, Major suggestions only as a starting point), optional PAO table for 00 to 99 (person, action, object), optional PA. Drills: conversion (like `major`), then digits with the chosen grouping (3 digits per image, or 6 digits per PAO scene).
- **Tests:** per-item conversion time under 1.5 s for club targets; digits recall in rows.
- **Schedule:** conversion items reviewed like the Major list (until 180 days), plus an error ledger of slow or wrong numbers.
- **Pass bar:** 95% accuracy, median under 1.5 s on a 100-item run.
- **Content:** 900 suggested words would be a large, sound-checked list; better to ship none and let players build their own, with Major decoding check (`util.js` `majorDecode`) flagging mismatches.
- **Template:** extends `major` (range 1000) and `digits` (group 3 or 6). New fields `p.major3`, `p.pao`, migration. Size L.

### P4. Card and binary systems (Learner A)

- **What:** saved card images (52, or 52 PAO, or later 1,352 two-card images); a flash drill (one card, name the image, under 1 s); binary drill with rows of 30, converting 3 bits to one digit, then using the digit system.
- **Tests:** flash conversion speed; Deck Run; binary rows all-or-nothing.
- **Pass bar:** card flash 95% at under 1 s; binary 3-bit conversion 100% at under 0.7 s a triple (unverified coaching target).
- **Template:** extends Card Run (Event Hall) and `digits` (alphabet 0/1, display 3-bit groups). New `p.cardImages` record. Size M each.

### P5. Spoken numbers (Learner A, needs an owner decision)

- **What:** digits read at one a second by the device's own speech or pre-generated audio (no network). One pass, no replay. Recall typed after.
- **Conflict:** `CLAUDE.md` forbids sound on study screens. Proposed exception: only inside the optional Champion Track, off by default, clearly labelled as an audio event.
- **Pass bar:** ladder 10, 20, 30, 50, 100 digits; score up to the first mistake (unverified that this matches current WMSC rules; check before claiming).
- Size M. Speech-synthesis voices vary by device; pre-recorded digits would be more reliable and are tiny files.

### P6. Abstract Images and fictional dates (Learner A)

- **Abstract Images:** generate random black-and-white pixel blobs in code (`src/pixel/raster.js` can do it); rows of 5; recall by putting each row back in order. Ladder 2 to 20 rows. Template: new. Size M.
- **Fictional dates:** generate invented events from word pools ("Baker paints the lighthouse") with a year 1000 to 2099; recall year from event in a shuffled order; one point per exact year. Template: extends `facts`. Size S. Invented events remove fact-check risk and pool exhaustion.

### P7. "Explain it" step for concepts and books (Learner B)

- **What:** after a Fact Recall, Mind Map or Skim drill on real material, one prompt: "Explain why, in one or two sentences, without looking", then the model explanation is shown and the player marks Kept, Partly, Missed. Next day: same prompt, delayed.
- **Tests:** generation and elaborative interrogation (Dunlosky 2013: moderate utility).
- **Rewards:** self-marks earn nothing; the next-day self-mark is logged for the player only. No skill change (self-report is unverifiable, CHAMPIONS.md real-life rule).
- **Content:** a one-line "why" exists for the 26 wonders (`abstract.js` WONDERS `why`); add model explanations for maps, formulae and skim texts (about 100 short lines). Size M.

### P8. Formulae done properly (Learner B)

- **Symbol alphabet:** a fixed, learnable list of 30 to 40 symbol pictures (=, +, minus, ×, ÷, fraction bar, square, cube, root, power, Σ, Δ, π, e, ln, log, %, sub and superscripts, Greek letters), drilled like the Major list (symbol to picture).
- **Whole formula production:** study the formula and its legend; recall the whole right-hand side (the scorer already exists: `abstract.js` `wholeFormulaForms`).
- **Structure check:** one question per formula that needs understanding ("If r doubles, the area ...", "Which goes on top in CAGR?").
- **Use it once:** a small number problem per formula (feeds Mental Reckoning style checking with `numericOk`).
- **Finance set (new, needs checking):** simple interest, compound interest with n periods a year, continuous compounding, CAGR = (end / start)^(1/years) − 1, NPV = Σ CFt / (1 + r)^t − initial outlay, present value of an annuity, ROI, gross and net margin, P/E, current ratio, debt-to-equity, break-even units. About 15 entries, each with a legend and a worked number.
- Template: extends `facts src: 'formulas'`. Size M. Content S to M with a second checker.

### P9. Language beyond nouns (Learner B)

- **Conjugation tables:** for each language, 10 to 20 high-frequency irregular verbs; drill "person plus tense to form" (yo / tener / present to tengo). Mnemonic only for irregular stems; patterns taught as rules.
- **Pronunciation:** optional audio on the review screen after recall, not during study (owner decision). Otherwise keep say-it spellings.
- **Gender for more languages:** French, German (three genders: use three elements, for example fire, ice and stone).
- Template: extends `vocab` (`lang.js`). Content needs native-speaker review. Size M per language.

### P10. Competition scoring, journeys and the error ledger (Learner A)

- **Strict mode:** exact spelling, row or column all-or-nothing, blank-row stop (already coded for digits and poems).
- **Journey manager:** total loci, journeys by length, last used, a "hot" warning inside 24 hours, a loci quality check (spread, distinctness), target ladders: 50, 100, 300, 600, 1,000 loci.
- **Image error ledger:** per Major number, card and locus: misses and slow answers over the last 30 days; a "top 10 weak images" drill.
- Templates: extends palaces, `major`, Card Run. Size M each.

### P11. Long formats inside 30 minutes (Learner A)

- **What:** "Long Sundays" in the Champion Track: once a week, one 15-minute memorisation plus recall (words 15 min, names 15 min, numbers 15 min in rotation). The session that day is only this.
- Hour events stay outside the game's daily rhythm: a player can schedule one manually; the game says honestly that hour events need dedicated sessions.
- Size M.

### P12. A personal joke encyclopedia and talk rehearsal (Learner B, small)

- Jokes: a P1 deck type "Jokes" with the theme as the room and the key word as the answer, plus a "tell it aloud" self-check. Size S on top of P1.
- Talks: a "walk your outline aloud" timer after the W28 outline drill, self-marked, no reward. Size S.

---

## 5. A corrected course of action

### 5a. Principles

- Keep the 52 weeks, every week number, gate id, item id and the 30-minute day. Change drill specs and add optional spec keys only (stored sets keep their own specs, so probes keep working).
- Split the audience: the core year stays a practical course for Learner B. Learner A gets an **optional Champion Track** that unlocks at the M5 gate and runs beside the core, taking the place of the scene and top-up rounds on the days the player chooses it (so the day stays about 30 minutes).
- The **Keeper's Deck** (P1) unlocks at the M1 gate and becomes the daily "own material" slot: 5 minutes of reviews first, before new drills, from Week 5 onward.

### 5b. Revised core year (changes only)

| Week | Today | Proposed change | Why |
| --- | --- | --- | --- |
| 1 to 4 | Imagery, pairs, chains | Fix W1 claim wording. Keyword deck intro card in W4 ("put your own list in a deck"). | G13; P1 |
| 5 to 8 | Palace | W8 objective becomes "two palaces of 20 stops each". Check drill equals objective. | G4; journey count matters for everyone |
| 9 to 13 | Names | Faces pool to at least 500 first names. W11 adds a "say it again a day later" check of the same people (probe from the M3 gate already exists, keep). | G8 |
| 14 to 17 | Major | W17 timing on a recognise-then-press-Enter screen (time to "I see it"), typing separately. | 2b Major |
| 18 to 21 | Number palace | W21 drill becomes the gate length (40 digits, 300 s) at least once in the week. | G4 |
| 22 to 26 | Vocabulary, pegs | W25 introduces the own deck for a language the player chooses (P1). M6 honest line on grammar and listening. | G11 |
| 27 to 30 | Structured knowledge | W29 adds the "Explain it" step (P7) and the symbol alphabet card plus a 10-symbol drill (P8). | G12; P8 |
| 31 to 34 | Speed | W32 objective "50 stops" gets a 40 to 50 item drill once in the week. Pace message fixed. | G2; G4 |
| 35 to 39 | Interference | W38 renamed "Faster numbers (optional)" in core; real PAO moves to the Champion Track. | G5 |
| 40 to 43 | Transfer | W41 Skim drill adds the "Explain it" step; W42 adds one finance formula set in place of one of its two `skim` drills. W43 transfer gate unchanged. | G12; P8 |
| 44 to 47 | Competition formats | Keep, but W44 and W46 lessons point to the Champion Track. One drill a week in strict scoring, practice only (no change to gates). | G7 |
| 48 to 52 | Keeping | W48 "What to Keep" builds the player's permanent deck and permanent palace inside the app (P1, P2). W49 sets the long rotation for Own Text. | P1; P2 |

What is cut to make room: one extra top-up round per session (`session.js` adds up to three; cap at two) and the duplicate `skim` drill in W42. The scene stays.

### 5c. Optional Champion Track (unlocks at the M5 gate, about 26 weeks)

Each block is a few days a week in place of the scene and top-up rounds, plus the "Long Sunday". Results never change core skill estimates (same rule as the Crypt and the Event Hall); its own ladders record bests.

| Block | Weeks (calendar) | Content |
| --- | --- | --- |
| C1 Journeys | 22 to 25 | Build to 300 loci across at least 10 journeys; journey manager (P10). |
| C2 Strict formats | 26 to 29 | Strict spelling, rows of 40, column scoring for words, first and last names. |
| C3 Number system choice | 30 to 35 | Pick 3-digit or PAO (P3); build 100 images a week (3-digit) or the PAO table; daily 5-minute conversion. |
| C4 Cards | 36 to 39 | Save a card system (P4); flash drill; Deck Run to 52. |
| C5 Binary and dates | 40 to 43 | Binary rows (P4); fictional dates (P6). |
| C6 Images and spoken | 44 to 47 | Abstract Images (P6); Spoken Numbers if the owner allows audio (P5). |
| C7 Simulation | 48 to 52 | A mock championship across four Long Sundays (15-minute versions), error ledger review, personal best ladder. |

Trade-off, said plainly in the game: the Champion Track is a hobby path. It does not make daily memory better, and national level usually needs more than 30 minutes a day (unverified, typical coaching advice).

### 5d. After the year (Year of Keeping and beyond)

- Keeper's Deck and Own Text rotation become the heart of each day (10 to 15 minutes), plus one revisited week.
- Champion Track players get a "season" mode: one discipline focus a month, Long Sundays, ladders.

---

## 6. Benchmark ladders

### 6a. Record figures found by web search (Nov 8, 2026)

Found through a web search that summarised Wikipedia's memory sport pages. Treat as **partly verified**: they come from secondary pages and were not checked against the official IAM or WMSC statistics sites. Never show them in the game without a direct check, and name no athlete.

- World Championship has ten disciplines; Spoken Numbers is read at one digit a second; WMSC images are "black and white randomly generated spots" (15 minutes), IAM images are concrete pictures (5 minutes); dates use "fictional events and historic years" (5 minutes).
- Reported records: Spoken Numbers 660 digits (WMSC, 2024); Binary 7,485 digits in 30 minutes (2019); Hour Cards 2,530 cards (2019); Speed Cards 12.74 seconds (2018); 5-minute Numbers about 630 to 642 digits (sources conflict).
- International Master of Memory (WMSC): compete in all ten disciplines and reach at least 3,000 championship points (one arbiter post); the card requirement was reported as 11 decks in an hour in another post. Unverified as current.

### 6b. Learner A ladder (all targets UNVERIFIED coaching estimates; check against current national results before use)

| Discipline | Novice (end of core year as built) | Club | National (competitive) | International |
| --- | --- | --- | --- | --- |
| 5-min Numbers | 40 digits | 80 to 120 | 200 to 350 | 450+ |
| Hour Numbers | none | 300 to 500 | 1,000 to 1,500 | 2,500+ |
| Binary (30 min) | none | 600 to 1,000 | 2,000 to 3,500 | 5,000+ |
| Spoken Numbers | none | 20 to 40 | 80 to 150 | 250+ |
| Speed Cards | 10 to 26 cards, no time | full deck under 5 min | under 60 s | under 30 s |
| Hour Cards | none | 2 to 4 decks | 8 to 15 decks | 20+ decks |
| 15-min Words | about 30 in 3 min | 50 to 70 | 100 to 150 | 200+ |
| 15-min Names and Faces | 10 first names | 40 to 60 points | 100 to 150 | 180+ |
| Abstract Images | none | 150 to 300 points (WMSC) | 500 to 700 | 800+ |
| 5-min Dates | about 10 real events | 30 to 50 | 80 to 120 | 140+ |
| Loci owned | 50 | 300 | 1,000 | 2,000 to 3,000+ |

### 6c. Learner B: what "able to do it" means

| Topic | Able to do it means |
| --- | --- |
| Lists | 20 items in order after one look of 2 minutes; still 80% the next day. |
| Numbers | A 10 to 12 digit number after 1 minute; 80% after a week. |
| Dates | 20 events of a period with year (and month where it matters), ordered and recalled both ways after 30 days. |
| Names | 10 new people at an event, first names, 70% that evening and 60% a week later. |
| Speech | A 5 to 9 point talk given from memory with no notes, the opening and closing word for word. |
| Vocabulary | 10 new words a day at a steady pace, 85% kept at 30 days, in both directions. |
| Grammar | Gender and the present tense of the 20 most common verbs produced correctly (outside Mnemos's claim: speaking needs more). |
| Verses / long text | A chosen text recited exactly; every section checked at least once a month, forever. |
| Jokes | 50 jokes in a themed deck; any one retold from its theme after 3 months. |
| Formulae | 20 formulae written in full with every symbol meaning, one structure question and one use each, after 30 days. |
| Recipes | A 10-step recipe with quantities after one read; steps in order the next day. |
| Books | For each finished book: 5 to 9 key ideas in your own words, with one example each, after 90 days. |
| Abstract concepts | Explain a concept, its parts and one example; rebuild its map from blank after 30 days. |

---

## 7. Risks

**Honest claims.**
- Do not suggest the year reaches competition level. Use: "The Champion Track is a hobby path for people who want to try memory sport. Competitive levels usually take years of practice."
- Fix the lesson lines in G13 before any new release.
- Records and IMM rules (section 6a) only in docs, never in the game, until checked against IAM and WMSC sites; name no athlete (CHAMPIONS.md).

**Data model.**
- New records (`deck`, `major3`, `pao`, `cardImages`, journey stats, Champion Track ladders) each need `newProfile`, `migrate`, validation in `store.js`, export and import, and import tests with missing, malformed and oversized data, following the `trials` and `own` patterns. `SCHEMA` is 3 now (`core.js` line 21); additive records with defaults have not needed a bump before.
- Item ids, side-quest ids, achievement ids and event ids are permanent once released (`events.js` header: "never rename them"). New Champion Track event ids must be chosen once (for example `binary`, `spoken`, `images`, `fdates`, `hournumbers`).
- Changing `PROBE_INTERVALS` affects new sets only (each set stores `intervals`); do not rewrite old sets.
- Raising Own Text caps affects backup size and the 5 MB import cap (`store.js`); test on a low-end phone.

**Content accuracy for real material.**
- Religious and treasured texts: keep the owner decision that none ships. If one ever does, name the translation and edition, confirm it is public domain or licensed (modern translations are usually under copyright), and compare against two independent printings.
- Formulae: every new formula, especially finance (NPV sign of the initial outlay, CAGR exponent, annuity timing), needs a second checker and one worked number. Fix the G10 photosynthesis alt.
- Language content: native-speaker review for conjugations and genders; dictionaries named (as `vocab.json` already does).
- Dates: invented events for the competition format remove the risk; real dates stay in the checked sets.

**Scope.**
- P1 (Keeper's Deck) and the G1 spacing fix carry most of the value for most players. Build those first.
- The Champion Track is large (P3 to P6, P10, P11: about four to six L-size pieces). Ship it in blocks, and only if the owner wants Learner A served.
- Spoken Numbers conflicts with the quiet-screen rule; decide before building.
- Every new screen must keep study and recall still and quiet, and keep the accessible names and classes `tests/e2e.mjs` relies on.

Sources used for section 6a: [Memory sport (Wikipedia)](https://en.wikipedia.org/wiki/Memory_sport), [World Memory Championships (Wikipedia)](https://en.wikipedia.org/wiki/World_Memory_Championships), [WMSC arbiter post on IMM](https://www.worldmemorychampionships.com/?p=8752), [WMSC arbiter post on card requirement](https://www.worldmemorychampionships.com/?p=6509), [WMSC Certification System](https://www.worldmemorychampionships.com/?p=5457).
