# Curriculum additions: design review and plan (Nov 2, 2026)

Status: plan only. No game code was changed. Nothing is built, committed or pushed. Written for Ayaan in plain language. The memory-champion reviewers will write the study material from section 9.

Sources used: the owner's pasted list of topic names from a commercial memory course (names only: none of its wording, structure, worksheets or claims is used, and none may be used), the public events page of the USA Memory Championship, and the game's own docs (`CLAUDE.md`, `docs/CHAMPIONS.md`, `docs/PRODUCT_DOSSIER.md`, `docs/ROADMAP.md`, `docs/BEYOND.md`) and code (`src/data/curriculum.js`, `lessons.js`, `masters.js`, `fieldguide.js`, `echo.js`, `src/engine/core.js`, `session.js`, `battle.js`, `src/ui/Drill.jsx`, `src/store.js`).

## 1. The short version

- **Most of the course is already in the game under other names.** Image method (M1), Roman Room and Journey (M2, a palace is both), Major System (M4 and M5), pegs (M6), sound-alike words (M6, keyword method), lists in order (M1, M2, M7), numbers (M4 and M5), presentations (M2, M7, Field Guide "A talk without notes"). For these the work is small: a few lesson cards, a better peg lesson, new practice material, and a plain "what is it called" page so people who know the other names can find their way.
- **Three things are genuinely new and need a new kind of practice screen:** memory maps (a topic drawn as a tree, then rebuilt from memory), poems (word for word, line by line), and playing cards (the order of a shuffled deck).
- **Chunking** becomes lesson cards plus a small display option on the existing digit drill (digits shown in groups).
- **Skimming is taught as a reading step before memorising.** It is not a memory method, and the game says so. It gets a lesson card, a small "Skim, Pick, Keep" drill (skim a short text, choose its key points, then keep them with pictures) and a Field Guide playbook. No speed claims.
- **"Learning styles" become "try each method and keep what works for you".** A "Your Methods" view compares your own scores across methods. The game never says there are visual or auditory types.
- **The seven championship events become an Event Hall in the Amphitheatre of Echoes (M11 district), practice only.** Four are scored formats (Names and Faces, Speed Numbers, Speed Cards, Poetry) and three are elimination formats (Words to Remember, Three Strikes You're Out, Double Deck O'Cards) that fit the existing Echo battle engine.
- **Pre and post tests are not added as separate tests.** The game already has the day-1 baseline and the Quarter batteries. New methods get a "Then and now" view built from results the game already stores, plus a place in the Week 43 transfer gate. Section 7.
- **The 52-week structure and every existing id stay exactly as they are.** All additions are lesson cards, drill variants, Masters' Notes, Field Guide pages and Event Hall formats.

Proposed release grouping: 1.1 (with The Living World) ships the words and the small drill variants; 1.2 adds Mind Map and Poem drills; 1.3 adds cards and the Event Hall. Section 8.

## 2. What the championship page says (and what I could not confirm)

I fetched https://www.usamemorychampionship.com/events/ with a fetch tool that returns a summary produced by a small model, not the raw page. Treat every figure below as "as reported", and have a human open the page and check each one before any number appears in the game. Describe the events in our own words, never copy the page. Real event names may be named as facts. Nothing in the game may suggest the championship endorses Mnemos.

| Event | Format as reported (our words) | Could not confirm or inconsistent |
| --- | --- | --- |
| Names and Faces | 135 colour head-and-shoulders photos, each with a first and last name. 15 minutes to memorise, 20 to recall from the same photos shown in a new order. One point per correctly spelled first or last name, 270 at most. Phonetic spellings earn nothing. Wrong guesses are not penalised. | Tie-breaks. |
| Speed Numbers | Computer-made digits in rows of 20, 25 rows to a page. 5 minutes to memorise, 10 to recall, two trials with new numbers, best trial counts. 20 points per fully correct row (500 at most); a last partial row scores one point per digit if all are right. One mistake zeroes that row. Skipping a row stops scoring. | Tie-breaks. |
| Speed Cards | One shuffled 52-card deck. Up to 5 minutes to memorise (finishing early is timed), 5 minutes to recall by laying out a second deck in order, two trials, best counts. A partial recall scores one point per card in a row from the start, and the first mistake ends scoring. A time bonus applies only to a complete recall. | The exact bonus formula as printed; do not quote it. Tie-breaks. |
| Poetry | A previously unpublished poem. 15 minutes to memorise, 20 to write it out, with title and author, marking line breaks and any skipped lines. Points for correctly spelled words, capitals and punctuation. Each line has its own point value, and a line scores in full only with no mistake. More than two skipped lines in a row ends scoring. | Total points, number of lines, how line values are set. |
| Words to Remember | A championship-round event. Numbered word list memorised for 15 minutes, then oral recall of words by number, finalists in random order, 15 seconds per answer. One error or omission eliminates a finalist. No points. Also run as a team format (two athletes per school). | **The page says 300 words in five columns of 20 across three pages, but the sample list it shows has 100 words.** Word count is unconfirmed. |
| Three Strikes You're Out | A championship-round event. Facts about six people (name, birth date, address, phone, pet, hobbies, car, foods) given aloud and as a mind map, 15 minutes to memorise. Recall in a new order, 15 seconds per answer, each wrong or incomplete answer is a strike, three strikes eliminate. Team version allows 3 strikes per athlete, 6 in all. | Recall time beyond the 15 seconds per answer. |
| Double Deck O'Cards | A championship-round event. Two identically ordered decks with different-coloured backs, 5 minutes to memorise, a 2-minute break, then cards asked in random order, 15 seconds each, one wrong card eliminates. A tie-break uses 104 shuffled cards, 60 seconds to memorise. | **The menu says "Double Deck O'Cards" but the section heading reads "Double Deck Or Bust".** Use whichever name a human confirms. Also confirm which events are scored events and which are championship rounds, because the summary tagged the last three as championship-only. |

Rules this page does not give and we must not invent: tie-breaks, the full point value of the Poetry event, exact recall time for Three Strikes.

## 3. Topic by topic: what the game already teaches and what to do

Verdict words: **Covered** (nothing new needed), **Lesson** (add a card inside an existing week), **Variant** (a small option on an existing drill), **New drill** (new practice screen), **Guide** (Field Guide page or playbook), **Notes** (Masters' Note), **Event** (Amphitheatre Event Hall or Echo scene). Owner decision, Nov 2, 2026: every topic and every event is included. There are no rejections. A weak or overclaimed idea is included with honest framing instead.

| Course topic | What exists today | Verdict and plan |
| --- | --- | --- |
| Fundamental memory techniques | M1 to M10 teach all of them. Week 40 "Choosing the Technique". | **Covered.** Add a Field Guide page "What things are called" (a toolbox glossary mapping common names to the weeks that teach them). |
| Roman Room | M2 teaches a palace; Week 5 says "choose your home". A Roman Room is a palace of one room. | **Lesson.** One card in Week 5: a single room, walls and furniture in a fixed order, 8 to 12 stops. Mention the method is ancient and was described in Roman writing on public speaking (champions verify). |
| Journey Method | M2 and Week 8 extend a palace into the street and a commute. | **Lesson.** One card in Week 8: a journey is a palace made of a walk or commute, with landmarks as stops. Spacing rule (one stop per landmark, not two doors side by side). |
| Image Method | Weeks 1 to 2, "Make It Yours" note. | **Covered.** Add a short card in Week 1 on giving the picture more to hold (see "five senses" below). |
| Major System | M4 and M5. | **Covered.** |
| Maximizing recall | Spaced probes at 1, 7, 30, 90, 180 days; "The Spaced Review" note; Week 30 "retrieval is the study". | **Lesson and Notes.** A Masters' Note "Check Before You Look" (retrieve first, then look) and a card in Week 49. Optional card on sleep after learning, only if the champions can verify wording. |
| Peg System with a word list | Week 24 lists number-shape pegs 1 to 10 in a lesson card only. Rhyme pegs are named in the M6 module plan but never taught. | **Lesson and Variant.** Add the rhyme list, two peg word lists (shape and rhyme, 1 to 10, optional 11 to 20 for rhyme) and a peg drill variant (section 5, V1). |
| Sound-alike words (homophones) | Weeks 22 and 23 teach sound-alike keywords and abstract-to-concrete substitution. | **Lesson.** Add a homophone and sound-alike card in Week 23 and a word pool. Present keyword honestly (section 4). |
| Chunking | Implicit: digit pairs (Week 18), phone numbers (Week 20), 5 to 9 key points (Week 28). Never named. | **Lesson and Variant.** Name it. Cards in Weeks 17 and 28; digits can be shown in groups (V2). |
| Skimming | Not taught. Week 41 "Learning from Books". | **Lesson, Variant V6 and Guide.** Taught as a reading step before memorising: skim to find the 5 to 9 key points, then keep them with a picture and a place. The Skim, Pick, Keep drill (V6) practises it. The game says plainly that skimming finds points and does not store them. |
| Intro to mind mapping | Not taught. | **Lesson plus New drill (Mind Map).** Intro card in Week 27, practice from Week 29. |
| Lists in order (Roman Room, Journey, grocery lists, procedures, talk key points), with pre and post tests and an anchor and keyword worksheet | Palace Walk, Story Chain, Fact Recall, Field Guide "Lists, errands and keys", "A talk without notes", "Recipes". The "your image" box already does the job of a keyword worksheet. | **Variant plus Guide.** Content pools for grocery lists, procedures and talk key points on the existing chain and palace drills (V3). Our own "Anchors and Keywords" worksheet, written fresh, in the Field Guide (section 7). Before and after checks: section 7. |
| Mind maps: your own, people, subject matter | Not taught. Field Guide "Details about people" exists. | **New drill (Mind Map)** with two kinds of content: subject maps (true, checked facts) and people maps (invented people). Building your own map is a Field Guide task on paper at first; a map builder is a later idea needing owner approval (section 5, D1). |
| Remembering numbers: image method for digits, Major, rhyming method, memory rhythms, own image library, with pre and post tests | Major (M4), editable personal 00 to 99 list (`p.major`), digit palace (M5), number-shape pegs (W24). Baseline and Quarter batteries already test digits. | **Lesson and Variant.** Digit image method = number-shape pegs for single digits (a card in Week 14 pointing to Week 24); rhyme pegs (Week 24); rhythm = say the groups aloud in a beat (a card in Week 20, digits group variant). Own image library is already the Major list: add a card in Week 15. No new tests. |
| Memorizing presentations: memory rhythms, skimming, chunking and keywords, five senses, mind map, Roman Room, job interview, with pre and post tests | Field Guide "A talk without notes", "A toast", "Meeting action items". Echo scene Speech Hall. | **Guide plus Lesson.** Extend the "talk" playbook and add "A job interview" and "Reading to find your key points" playbooks. Rhythm, five senses, chunking and keywords are lesson cards (see above). Mind map for a talk is a Mind Map content kind. Interview: no new Echo scene; Speech Hall covers it. |
| Five senses | Week 1 already says "add sound, smell, weight and movement". | **Lesson.** One card, worded as "give the picture more to hold", not as matching your learning style. |
| Memory rhythms | Not taught. | **Lesson.** Say the groups aloud in a beat. Modest claim only (section 4). Quiet rule: no sound is added to study screens; the rhythm is the player's own voice, off-screen. |

Championship events:

| Event | Closest existing piece | Verdict |
| --- | --- | --- |
| Names and Faces | M3 faces drill (first names only) | **Variant (V5):** first and last names, one point per name part. Event Hall scored format. |
| Speed Numbers | M5 digit gate (40 digits in 5 minutes is two real rows) | **Variant (V2):** rows of 20, row scoring. Event Hall scored format. |
| Speed Cards | None (dossier excluded cards from the core: very low everyday transfer) | **New drill (Cards).** Optional, Event Hall only, no skill credit. |
| Poetry | Field Guide "A poem" playbook; no drill | **New drill (Poem).** Practised from Week 41 and in the Event Hall. |
| Words to Remember | M8 palace words, Week 7 random access | **Variant (V4) plus Echo scene.** Numbered list, ask by number, elimination. |
| Three Strikes You're Out | Field Guide "Details about people" | **New drill (Mind Map, people kind) plus Echo scene** with three strikes. |
| Double Deck O'Cards | None | **Cards drill variant plus Echo scene.** Ask by position, one miss ends the round. |

**Included with honest framing, not dropped:** learning styles (as "try each method, keep what works", section 4), skimming, mind maps, keyword and sound-alike, rhythm and five senses (each with its evidence note), worksheets and pre and post tests (written fresh in our own words, section 7). **Still not allowed, because they are claims and not topics:** copying any course wording or structure; "memory improves everywhere" framing; matching people to a style; outcome promises. PAO stays optional (Week 38).

## 4. Honest claims: every topic stays, the wording changes

Everything below that cites science comes from memory, as `docs/CHAMPIONS.md` warns. Each citation must be checked by a champion with web access before it ships. Mark a card "verified" in the draft file only when it was.

| Claim type in the course | Verdict | What the game says instead |
| --- | --- | --- |
| Teach to your learning style (visual, auditory) | **Include, reframed.** Reviews of the evidence (Pashler and colleagues, 2008) found no good support for matching teaching to a style, so the game never says visual or auditory types exist. | A "Your Methods" card and view: "Try each method on your own material and keep the ones that work for you. Your own scores will tell you." Per item: "Use the sense that gives the richest picture for this item." |
| Boost your brainpower, unlimited potential | **Include the topic, drop the claim.** Training one task helps similar tasks; broad transfer is not supported (Melby-Lervag and Hulme 2013; Simons and colleagues 2016). | Existing honest line: the year trains specific methods, which help with lists, names, orders and exact words when you use them on purpose. |
| Brain health at any age | **Drop the claim** (medical-sounding); nothing to teach. | Existing About line: not a clinical test, not medical advice, see a doctor if worried. |
| Empathy and influence from remembering names | **Names stay (M3); the influence claim is dropped.** | "Many people like being remembered by name. We do not claim it changes how anyone treats you." |
| Never write a list again | **Lists stay; the claim is dropped.** Contradicts the safety rules. | "Write it down when it matters. Pictures are your second copy." (existing Field Guide wording) |
| Pre and post tests prove it works | **Rewrite.** Scores rise partly because you learn the task itself. No control group. | "Then and now: how you did the first time you tried this, and how you do now, on Mnemos tasks." Add the practice-effect caveat. |
| Mind maps work the way your brain works | **Rewrite.** Evidence is mixed. Some studies find maps help recall of structured facts (for example Farrand and colleagues 2002, small); a meta-analysis of concept maps found modest benefits (Nesbit and Adesope 2006); and a well-known experiment found that retrieval practice taught more than making a concept map (Karpicke and Blunt 2011). Dunlosky and colleagues 2013 did not rate maps. | "A map shows how a topic fits together. The part that helps memory is closing it and rebuilding it from memory." The drill is built exactly that way: study the map, then recall it blank. |
| Keyword and sound-alike method is the best way to learn words | **Rewrite.** Dunlosky and colleagues 2013 rate the keyword mnemonic low for lasting learning. | Existing wording stays: fast to start, fades without retrieval, so the app schedules spaced checks. Never call it the best long-term method. |
| Imagery for reading passages | **Do not claim.** Dunlosky rates imagery for text low. | Mnemos pictures are for lists, names, orders and exact wording, not for understanding a text (already in `GUIDE_CLAIM`). |
| Skimming makes you learn faster | **Include as a reading step, drop the speed claim.** Faster reading tends to cost understanding (Rayner and colleagues 2016, champions verify). | "Skimming helps you find the key points before you read closely. Keeping them is a separate job: a picture, a place, and a check later." |
| Rhythm and rhyme "unlock" memory | **Soften.** Saying things aloud helps (the production effect, MacLeod and colleagues 2010, champions verify); rhythm adds another cue for exact wording. | "Say it aloud in a beat. It gives you one more thing to hold on to." |
| Five senses deepen memory | **Soften.** | "Sound, touch and smell give a picture more to hold. It adds retrieval cues. It does not match you to a style." |
| Memorise anything quickly | **Drop the claim.** | Existing: pictures help with lists, names, orders and exact wording. |
| Job interview success | **Include the playbook, drop the outcome claim.** | "Preparation can help you keep your points in order. It does not decide how an interview goes." |

Skimming decision (owner: it must be included): it is taught as the first step of a three-step habit, **Skim, Pick, Keep**. Skim: look at headings, first lines and last lines for a short time. Pick: choose 5 to 9 key points. Keep: one picture each, one place each, check later. The lesson says plainly that skimming is a reading strategy, that it finds points and does not store them, and that it does not replace careful reading when understanding matters. No speed claim and no "learn faster" claim.

Real material rules still apply: subject maps and any real facts must be true and checked with a source; no passwords, PINs or private data; people maps use invented people only; poems are public domain or original; no endorsement implied.

Trademark note to check: "Mind Map" may be a registered trademark of the company founded by the author who popularised it, in some countries. I could not verify this. The safe in-game name is **Mind Map**. "Roman Room", "Journey method", "Peg system", "Major System" and "Image method" are generic names.

## 5. New drill types and variants

Existing drills: wordlist, pairs, chain, palace, digits, major, faces, vocab, facts (`TEMPLATE_SKILL` in `curriculum.js`). Scoring is done in `scoreDrill` (`core.js`) with three recall modes: free, ordered, cued. New templates need entries in `TEMPLATE_SKILL`, `TEMPLATE_NAME`, `BRIEF` in `Drill.jsx`, item generation in `genItems`, and a check that `store.js` accepts them when validating saved review sets. Study and recall screens stay still and quiet (one soft submit sound only). Every new drill gets a text equivalent for any picture or diagram.

### New drill D1: Mind Map (`map`, skill: Structured Knowledge)

- **What the player does.** Study: a still tree is shown, one centre topic, 3 to 6 branches, 2 to 4 short leaves on each, drawn with plain shapes and also available as a nested text list (screen readers). Recall: the centre and branch labels are shown, each branch has empty boxes (the count is shown), and the player types the leaves. Within a branch, order does not matter.
- **Two content kinds.** `topic` (true, checked facts from the pools) and `people` (invented people with a few details each: birthday, town, pet, hobby, car, food, a four-digit extension). The people kind is the practice for Three Strikes.
- **Scoring.** One point per leaf, matched with the existing forgiving matcher, inside the right branch only (a correct leaf under the wrong branch is a substitution). Errors use the existing four types. Add a recall mode `branch` to `recallMode` and `scoreDrill`. Accuracy feeds the skill estimate like any drill.
- **Where it unlocks and what it gates.** Taught in Weeks 27 to 29 (M7). It appears in weekly checks from Week 29. It joins the M10 "unfamiliar mixed task" gate (Week 43) in 1.2, where it is a true new-format test. It is not added to the M7 gate: players meet it in practice first.
- **Saved data.** Items are stored in `p.sets` for delayed probes like every other drill (leaf items carry `branch` and `answer`). `probeItems` needs a `map` case: ask by branch, up to 12 leaves. Echo battle `kindsFor` can ignore `map`. **No new record and no migration**, only whitelist the new template name wherever `store.js` validates sets (builder to check).
- **Size.** M.

### New drill D2: Poem (`poem`, skill: Structured Knowledge)

- **What the player does.** Study: the poem is shown in a still card with title, author and line numbers, for the study time. Recall: one text box per line (plus title and author boxes), in order. Guided practice shows the poem a few lines at a time.
- **Scoring.** Two numbers. Practice and skill estimate: a line is right when it matches after ignoring capitals, punctuation and spacing, allowing small typos (about 90 percent similar). Event Poem Page: strict mode, every word, capital and punctuation mark must match, a line is all or nothing, and scoring stops after more than two skipped lines in a row. The in-game point values are ours, one point per line plus one each for title and author, and are not the championship's values (unknown).
- **Where it unlocks.** Week 41 drill (swapped for one facts drill), Week 48 "keep one poem for years", a Masters' Note "A Stanza a Night" (unlock M7), the Field Guide poem playbook, and the Event Hall.
- **Saved data.** Poem sets go in `p.sets`, with up to 16 short lines (small). Probes use the first 10 lines. No migration.
- **Size.** M to L (the text-entry screen and the strict scorer).

### New drill D3: Cards (`cards`, no skill credit, optional)

- **What the player does.** Study: cards are drawn in code (rank and suit with both shape and letter, never colour alone; our own art, no copied deck design) shown a row of four at a time, self-paced inside the study time. Recall: tap a card from an ordered picker (4 suit rows, 13 ranks) into numbered slots, with undo, or type a code such as `10H`. Variant `byPosition`: the game asks "card number 17?" in random order (Double Deck format).
- **Scoring.** Accuracy is correct positions over cards, shown to the player. Event score is the longest correct run from card 1 (first mistake ends the run), and by-position uses a streak until the first miss. Ladder: 10, 15, 20, 26, 39, 52 cards.
- **Skill, Lumen and honesty.** Cards never change skill estimates or earn Lumen (the dossier rates cards "very low everyday transfer", and rewards come only from learning that transfers or holds). A personal best only counts when the deck is longer or the time shorter at the same accuracy (rule from the Masters' Note "The Personal Best Ladder"). The brief says plainly: this is a memory sport, it trains card-to-picture mapping, and it does not carry much into daily life.
- **Saved data.** A new record `events` (see D4). No `p.sets` entry, so no delayed probes and no Echo pulls.
- **Optional later:** a card-picture list (52 images with a clear rule) stored as `cardImages`, edited like the Major list. Not in 1.3.
- **Size.** L.

### D4: Event Hall and the `events` record

- **Where.** A panel in the Amphitheatre of Echoes, opened by the M10 gate (the district's existing unlock). All seven formats are listed with: how the real event works (our words, with what we could not confirm), our scaled-down version, a best result.
- **Rules.** Practice only. Results never change skill estimates (same rule as the Crypt, Echo battles and trials). No Lumen. Study and recall still and quiet. A "championship pace" switch (15 seconds an answer, as in the real elimination events) exists but is off by default, never forced, and respects the timer multiplier.
- **Saved data (migration).** New record `p.events = { best: { names: null, numbers: null, cards: null, poem: null, words: null, strikes: null, decks: null }, history: [] }`, `history` capped at 60 entries. Follow the v0.11 `trials` pattern: add to `newProfile`, make `migrate()` create it when missing, validate it in `store.js`, include it in export and import, and add an import test with the record missing, malformed and oversized. `SCHEMA` stays 2 (the last two releases did the same: additive records with a default in `migrate`).
- **Reward.** Personal-best entries on the ladder, with no currency. Optional small badges are an open question (section 10).
- **Size.** M for the panel and record; each format below is added to it.

### Scaled-down event formats in the Event Hall

| Event | Our version | Built from |
| --- | --- | --- |
| Face Round (Names and Faces) | 12 to 24 faces, first and last name, exact spelling, 1 point per name part. Pace about 7 seconds a face at the top level; novices start slower. | M3 faces drill plus V5 |
| Number Rows (Speed Numbers) | Rows of 20 digits, 1 to 4 rows (40 digits is your M5 gate), row-all-or-nothing, a blank row ends scoring, two trials, best counts. | Digits plus V2 |
| Deck Run (Speed Cards) | 10 to 52 cards, record the longest correct run, two trials. | D3 |
| Poem Page | A poem you have not seen, 4 to 16 lines, strict scoring. | D2 |
| Word Numbers (Words to Remember) | 40 numbered words, asked by number in random order, strikes. | V4, plus Echo scene |
| Three Strikes | 4 to 6 invented people, 4 to 6 details each, three wrong answers end the round. | D1 people kind, plus Echo scene |
| Double Deck | A deck order, asked by position, one miss ends the round. | D3 by-position, plus Echo scene |

The three elimination formats (Word Numbers, Three Strikes, Double Deck) use the Echo battle engine (`battle.js`) as scenes with `resolve` set to 3 instead of the standard 5, free entry, the answer shown after a miss, and no Lumen (scenes on made-up material give none today). Builder work: a `resolve` override per scene, a by-number prompt, and a study layout for each material. Elimination ends the round gently with the answers shown and no penalty anywhere.

### Small variants on existing drills (no new screen, no migration)

Each is a new optional key on a drill spec, as `interference`, `reverse` and `lures` already are. Stored specs travel with `p.sets`, so probes keep working.

| Id | Spec | Effect | Where |
| --- | --- | --- | --- |
| V1 Pegs | `pairs` with `peg: 'shape'` or `'rhyme'` | Cue is "4 sailboat", answer is the item. Items come in random order, which tests random access. | Week 24 (replaces the chain drill; note it moves this week's credit from Linking to Imagery) |
| V2 Digit groups and rows | `digits` with `group: 2, 3, 4 or [3,3,4]`, and `rows: true` | Digits are shown in groups, or in rows of 20 with row scoring (event mode). Display and scoring only. | Weeks 18, 19, 20, Event Hall |
| V3 Sources | `chain` or `palace` with `src: 'grocery'`, `'steps'` or `'points'` | Items carry a `text` (a step or a talk point) and an `answer` (one keyword). Study shows the sentence with the keyword marked; recall asks for the keyword in order. | Weeks 4, 6, 28, 42 |
| V4 Numbered list | `wordlist` or `palace` with `numbered: true` | Words are shown with numbers; recall asks "what was number 23?" in random order (a cued mode). | Event Hall and Week 45 |
| V5 Surnames | `faces` with `surname: true` | Answer is "First Last", scored as two parts. | Event Hall (and optional extra practice) |
| V6 Skim, Pick, Keep | `facts` with `skim: true` | Three steps on one short text with headings. Skim: the text is shown for a short time with headings and first lines marked. Pick: the player ticks up to 5 of 8 candidate sentences as the key points (a "key points found" score is shown, and does not feed the skill estimate). Keep: study the chosen points with pictures, then recall one keyword per heading (cued, the existing scorer). Items carry `cue` (heading), `answer` (keyword), `text` (the point). | Weeks 41 and 42, Field Guide |

A test for each: item generation is deterministic from the seed; scoring edge cases (blank, wrong branch or row, wrong part of a name); probes still work from stored specs; `interleaveSpec` (session.js) still picks safely when earlier weeks hold the new variants.

## 6. Where each addition goes in the 52 weeks

No weeks, ids, gates or thresholds change in 1.1. Lesson cards are appended to the existing arrays in `lessons.js` (week numbers are the keys). Existing drills are swapped, never added on top, so sessions stay near 30 minutes (the session builder tops up to about 22 minutes itself).

| Week | Existing title | Addition |
| --- | --- | --- |
| 1 | Attention and Vivid Images | Card: "More to hold" (sound, touch, smell, motion): the five senses as extra cues, never a learning style. Card: "Try each method, keep what works" (the reframed learning-styles topic). |
| 4 | Consolidation and Gate | Chain drill uses the grocery pool (V3). |
| 5 | Building Your First Palace | Card: the Roman Room, one room, 8 to 12 stops. |
| 6 | Placing and Walking | Palace drill uses the grocery pool (V3). |
| 8 | Expanding the Gallery | Card: the Journey, a walk or commute as a palace. |
| 14 | Major System: 0 to 9 | Card: the number-shape images are the "image method" for single digits; pegs come in Week 24. |
| 15 | Major System: 00 to 49 | Card: your personal image list is your own library. |
| 17 | Conversion Speed | Card: chunking has a name. Groups of 2 to 4 are what the system does for you. |
| 18, 19, 20 | Digits in the Palace, Longer Numbers, Dates and Phone Numbers | Digit group variant (V2): pairs, then 4s, then a phone shape. Card in Week 20: say the groups aloud in a beat. |
| 23 | Abstract to Concrete | Card: sound-alike and homophone pictures. Keyword honesty line. Soundalike pool shown after answers. |
| 24 | Peg Systems | Card: the rhyme peg list. Drills become shape pegs and rhyme pegs (V1); the vocab drill stays as the check. |
| 27 | Facts as Cue and Answer | Card: memory maps, how a topic fits together, and the honest evidence line. |
| 28 | Outlines in the Palace | Chain drill uses talk key points (V3). Card: chunk a talk into 5 to 9 points with one keyword each. |
| 29 | Self-Explanation | Second drill: Mind Map, topic kind (D1, 1.2). |
| 30 | Structure Gate | Card: "retrieval is the study" gets the maximize-recall wording. Gate unchanged. |
| 41 | Learning from Books | Card: Skim, Pick, Keep, with the honest line on skimming. Facts drill becomes Skim, Pick, Keep (V6). Second drill: Poem (D2, 1.2). |
| 42 | Exam and Technical Material | Chain drill uses procedure steps (V3). Facts drill uses a second Skim, Pick, Keep text. |
| 43 | Transfer Gate | Add a Mind Map (people kind) to the unfamiliar mixed task (1.2). This is the "post-test" for the new formats. |
| 44 to 47 | Event Pacing, Recall Under Pressure, Decathlon Practice, Arena Gate | Cards describing how real competitions are organised (our words) and a pointer to the Event Hall. Decathlon gate itself unchanged. |
| 48 | What to Keep | Poem as "keep one poem for years" (1.2). |
| 49 | Maintenance Scheduling | Card: "Check Before You Look". |

New Masters' Notes (ids new and permanent once released): `m-chunks` (unlock M5, "Groups You Can Say"), `m-pegs` (unlock M6, "Pegs on a Peg Board" or similar), `m-stanza` (unlock M7, "A Stanza a Night", Poem spec), `m-check` (unlock M8, "Check Before You Look"). All follow the existing shape (`id, unlock, title, idea, tryIt, why, spec, drill`).

Field Guide changes (ids new): a **toolbox page** "What things are called"; playbooks `interview` (unlock M7), `maps` (unlock M7), `reading` (unlock M7, covers skimming); extra text for `talk` (business presentation, Roman Room for work, rhythm). Existing playbook ids and the twelve `try-m` ids stay.

## 7. Pre and post tests, worksheets and "Your Methods"

Owner decision: the course's pre and post tests and worksheets are included, written fresh in our own words by the champions. They are built on the game's existing tests, not stacked beside them.

What already measures change: the day-1 baseline (words, digits, faces), parallel forms at weeks 13, 26, 39 and 50 to 52, weekly checks, gates and delayed probes. Do not change the baseline or the Quarter batteries: that would break comparability and move the Memory Training Score.

1. **Three unit checks with parallel forms.** The course has pre and post tests for lists, numbers and presentations. Ours are **Unit Check: Lists** (a grocery list and a procedure, in order), **Unit Check: Numbers** (a 12-digit and a phone-style number) and **Unit Check: Talk** (a seven-point talk outline). Each has a Form A and a Form B of equal difficulty, drawn from the pools by the champions (Workstream B). Form A is taken before the unit's lessons ("your own way first", no technique required, as the baseline does) and Form B after. They run as ordinary scored drills on the existing templates with the V2 and V3 variants, placed in the week plan as the check drill of the first and last week of the unit: Lists in Weeks 3 and 6, Numbers in Weeks 14 and 21 (the numbers gate already follows), Talk in Weeks 28 and 30. No new screens and no new records.
2. **"Then and now".** On Progress, each method shows the first scored attempt (a `practice` or `check`, never guided) beside the latest and best, from `p.results` (each record already has `t`, `acc`, `day`, `role`). Add one optional field `v` (the variant name, such as `peg`, `group`, `map`) to new result records so variants separate cleanly. No migration. Caption: "Both scores are on Mnemos tasks. Some of the change is simply learning the task."
3. **"Your Methods" (the honest replacement for learning styles).** A card on Progress listing each method the player has practised (story chain, palace, pegs, Major, keyword, maps, poem) with their own accuracy and 7-day hold for each, from existing results and probes. The words: "Try each method and keep what works for you. These are your scores on Mnemos tasks, and a few attempts is not much to go on." It never says "you are a visual person", never ranks the player as a type, and never recommends against a method on the strength of a few scores.
4. **Worksheets, in our words.** Our own **Anchors and Keywords** page in the Field Guide: a printable (browser print) sheet with blanks for stops, pictures and the first-letter keyword for each point, plus a worked example. Plain text and no saved data (a form that stores answers would be a new record and needs your approval). A second **Before and After** page for the player's real material: write your own score before using a method and after, with a note about practice effects. Both are written by the champions from scratch.
5. **Where post-tests also live:** the weekly check, the Week 43 transfer gate (new formats as "unfamiliar") and Event Hall personal bests.
6. **No proof claims.** The game never presents a before and after as evidence that Mnemos works. Only "your scores on Mnemos tasks".

## 8. Build order and size estimates

Size scale from the roadmap: S under a day, M one to three days, L a week or more. Content writing by the champions is separate and runs in parallel.

| Release | Contents | Size |
| --- | --- | --- |
| **1.1** (with The Living World) | All lesson cards, the four Masters' Notes, toolbox page, new playbook pages and worksheets, content pools, variants V1, V2, V3 (and V4, V5, which only the Event Hall uses and may slip to 1.3), the three Unit Checks, "Then and now" and "Your Methods", the `v` result field, tests | Variants S each, panel S to M, wiring cards and pools S to M, total about M to L |
| **1.2** (with v0.13) | D1 Mind Map (topic and people), D2 Poem, V6 Skim, Pick, Keep, Week 29, 41, 42, 43, 48 wiring, tests | D1 M, D2 M to L, V6 M |
| **1.3** | D3 Cards, D4 Event Hall and `events` record (migration, validation, import tests), three Echo scenes, seven event panels and best-result ladder, event copy | D3 L, D4 M, scenes M, total L |

Why this order: 1.1 is words and small options, so it is low risk and can be shipped by itself; 1.2 adds the two new learning screens that carry real learning value (maps and poems); 1.3 is the sport corner, with the least everyday value and the largest build. If you want the events first, the order can flip, but 1.3 needs D1, D2 and D3 done.

After each release: `npm test`, `node tests/e2e.mjs` (must print "errors: none" at 390px), a lore rebuild if story text changed, a version bump in `package.json`, and a CHANGELOG entry. No push without your approval.

## 9. Brief for the champion reviewers

The whole course is written by memory-champion agents from this plan: lessons, examples, peg and word lists, public-domain poems, pre and post tests, worksheets. Four workstreams run in parallel. Each writes only into its own folder, `docs/drafts/additions/<workstream>/`, so no two touch the same file, and none edits `src/`. The builder wires the drafts in afterwards.

Rules for everyone:

- Plain, warm language. No em dashes or en dashes as punctuation: use commas, colons and "to" for ranges.
- Our own words only. No wording, structure, worksheet layout, example or claim from any commercial course. The course gave us topic names and nothing else.
- Every topic below is included. Where the evidence is weak, write the honest framing from section 4 into the material itself, with a short "what the evidence says" line.
- No learning-style claims, no brainpower, brain-health, empathy, influence or outcome claims, no "never write a list again". Every card carries its honest limit.
- Real facts need a named source and `"checked": true`. Citations are pointers for the builder and must be verified by someone with web access before anything is shown to players: record `"verified": true` or `false`.
- No passwords, PINs, credentials, medical advice, safety-critical procedures or private data. People in examples are invented. Real people appear only as public-record facts, never as endorsers.
- Files are UTF-8 JSON. A top-level `"notes"` string says what you could not confirm. Never renumber or reuse an existing id. New ids are lowercase with hyphens.
- Check new words against the existing pools (`CONCRETE`, `ABSTRACT`, `NAMES`, `MAJOR_PAIRS`, `VOCAB`) to avoid duplicates and sound clashes.

### Coverage matrix: every topic and event, and who writes it

| Topic or event | Workstream |
| --- | --- |
| Fundamental memory techniques; toolbox glossary | A (cards), D (glossary page) |
| Roman Room, Journey Method, Image Method | A |
| Major System (extra cards, own image library) | A |
| Maximizing recall | A (cards and note), D (page) |
| Peg System with a word list | A (lessons), B (word lists) |
| Soundalike words and homophones | A (card), B (lists) |
| Chunking; memory rhythms; five senses | A |
| Learning styles reframed ("try each method, keep what works") | A (card), D (Your Methods text) |
| Skimming (Skim, Pick, Keep) | A (lesson), B (practice texts), D (playbook) |
| Intro to mind mapping; maps of your own, of people, of subject matter | A (lessons), B (topic maps, people pools), D (playbook, worksheets) |
| Lists in order: grocery, procedures, talk key points, with pre and post tests | A (lessons), B (pools, Unit Check Lists forms), D (worksheet) |
| Anchor and keyword worksheet | D |
| Remembering numbers: image, Major, rhyme, rhythm, own image library, pre and post tests | A, B (Unit Check Numbers forms) |
| Memorizing presentations: rhythm, skimming, chunking and keywords, five senses, map, Roman Room, job interview, pre and post tests | A, B (Unit Check Talk forms), D (interview and presentation playbooks) |
| Names and Faces event | B (surnames), D (event copy) |
| Speed Numbers event | A (event cards), D (event copy) |
| Speed Cards event | C (card images), D (event copy) |
| Poetry event | C (poems), D (event copy) |
| Words to Remember event | B (numbered word lists), D (event copy) |
| Three Strikes You're Out event | B (people pools), C (guest sheets), D (event copy) |
| Double Deck O'Cards event | C (card images), D (event copy) |

### Workstream A: Lessons and Masters' Notes
Folder: `A-lessons/`. Files: `lessons-add.json`, `masters-add.json`, `event-cards.json`.

1. **Lesson cards** for Weeks 1, 3, 4, 5, 6, 8, 14, 15, 17, 20, 23, 24, 27, 28, 29, 30, 41, 42 and 49, matching section 6. Each is 2 to 4 short sentences with one worked example and one honest limit. Topics to cover across them: five senses as extra cues; "try each method, keep what works"; Roman Room; Journey; the digit image method with number-shape pictures; your own image library; chunking; rhythm (say the groups aloud in a beat); sound-alike and homophone pictures; number-shape pegs and rhyme pegs; why maps help and the honest evidence (study the map, then rebuild it blank, which is the part that works); how to chunk a talk into key points with one keyword each; Skim, Pick, Keep; maximizing recall (retrieve first, then look). Shape: `{ "week": 5, "at": 2, "text": "…", "claim": "…", "evidence": "strong|moderate|mixed|weak|none", "source": "…", "verified": false }` (`at` is the card position, 0 to append).
2. **Week 24 rewrite**: both peg systems, one worked example each, and how to choose between a peg list and a palace.
3. **Memory-map teaching** for Weeks 27 and 29 (intro to mind mapping): how to draw a map on paper, five rules for good maps, the honest evidence line, and a map of people and a map of a subject as two worked examples.
4. **Four Masters' Notes** in the existing shape (`id, unlock, title, idea, tryIt, why, spec, drill`): `m-chunks` (unlock M5, spec digits n 16 with `group: 4`), `m-pegs` (unlock M6, pairs with `peg: 'shape'`), `m-stanza` (unlock M7, `poem` n 4), `m-check` (unlock M8, `spec: null`). Name no athlete.
5. **Event cards** (`event-cards.json`) for Weeks 44 to 47: how real memory competitions are organised, in our words, using only the facts in section 2, with a "not confirmed" line where needed. Include the Speed Numbers row format and what each of the seven formats trains.
6. **Interview and presentation cards** for Weeks 28 and 49 (a short card each): memory methods for a job interview (keep three stories, the interviewer's name and your questions in order) and a Roman Room for a work presentation. Honest limit: preparation helps order, not outcome.

### Workstream B: Practice material and tests
Folder: `B-material/`. Files: `pegs.json`, `soundalikes.json`, `grocery.json`, `steps.json`, `points.json`, `surnames.json`, `maps-topic.json`, `maps-people-pools.json`, `skim-texts.json`, `unit-checks.json`, `wordlists-numbered.json`.

1. **Pegs.** `{ "shape": [{ "n": 1, "word": "candle", "why": "…" }, …1 to 10], "rhyme": [{ "n": 1, "word": "bun" }, …1 to 10, optional 11 to 20] }`. Concrete, easy to see, distinct in sound, absent from `CONCRETE` and `MAJOR_PAIRS`.
2. **Sound-alikes.** At least 90 entries covering `ABSTRACT` and `ABSTRACT_MORE`: `{ "word", "soundalike", "picture", "note" }`, plus 30 true homophone pairs `{ "a", "b" }`.
3. **Grocery.** 120 generic items by aisle `{ "item", "aisle" }`. No brand names. Easy to picture.
4. **Procedures.** 24 harmless everyday procedures of 7 to 10 steps: `{ "id", "title", "steps": [{ "text", "key" }] }`, key a concrete word that appears in the text. Nothing medical, electrical, chemical, fire-safety or first aid.
5. **Talk outlines.** 16 invented talks of 5 to 9 points: `{ "id", "title", "points": [{ "text", "key" }] }`.
6. **Surnames.** 120 common varied surnames, plus an `"avoid"` list of full names that equal a famous person when joined with any first name in `NAMES` or `NAMES_MORE`.
7. **Topic maps.** 24 true, checked maps: `{ "id", "title", "center", "branches": [{ "label", "leaves": [] }], "source", "checked": true }`, 3 to 6 branches, 2 to 4 leaves of 1 to 3 words, each fact sourced to a named reference.
8. **People pools (invented).** Pets, hobbies, cars (colour and type), foods, invented town names (no real towns), birthdays as month and day, and four-digit "extension" numbers. No addresses, no real phone formats, no real people.
9. **Skim, Pick, Keep texts.** 12 short invented or public-domain texts of 150 to 250 words with headings: `{ "id", "title", "headings": [], "text": "…", "keyPoints": [5 sentences], "candidates": [8 sentences including the 5], "keywords": { "heading": "word" } }`. Real topics must be accurate and sourced.
10. **Unit Checks with parallel forms.** For **Lists** (a grocery list of 12 and a 9-step procedure), **Numbers** (a 12-digit number and a phone-shaped number) and **Talk** (a 7-point outline): Form A and Form B of equal difficulty, plus a one-line instruction for each ("use your own way first" for Form A). Shape: `{ "unit": "lists", "forms": { "A": {…}, "B": {…} }, "difficultyNote": "…" }`. Digits come from a fixed list the champions generate and check for repeats and patterns.
11. **Numbered word lists** for Words to Remember: 4 lists of 40 distinct concrete, spellable words each, with no two sounding alike, plus one 100-word list for the top level.

### Workstream C: Poems, cards and people
Folder: `C-poems-cards/`. Files: `poems.json`, `card-images.json`, `strikes-people.json`.

1. **Poems.** At least 12 original and 12 public-domain poems. `{ "id", "title", "author", "lines": [], "origin": "original|public-domain", "year", "edition", "difficulty": 1 to 5, "checked": true }`. Line counts of 4, 6, 8, 12 and 16 in roughly equal numbers. Originals are written fresh by you (copyright stays with the project) under invented poet names that match no real poet. Public domain: the author died before 1925 and the poem was first published before 1930, never a translation (translators hold their own copyright), text compared against two independent editions, the edition named. Prefer lesser-known poems. Capitals and punctuation exact, since strict mode scores them. Add one short "how to learn a stanza" worked example per difficulty level using the palace and chain methods taught in the game.
2. **Card pictures.** One clear rule for turning a playing card into a picture, learnable in minutes, and the 52 suggested images that follow it: `{ "card": "AS", "image", "rule" }`, with the rule explained in 3 sentences. Must not copy any published card system's table. Add a short guide to a Deck Run: how to lay a deck along a route, two cards a stop, and the honest note that cards are a sport with little everyday use.
3. **Three Strikes people.** 8 complete invented guest sheets of 6 people each (name, birthday, invented town, pet, hobby, car, food, four-digit extension) for the Three Strikes and Mind Map people kinds, built from the Workstream B pools, with no real person, address or phone number. Names may not match any famous person.

### Workstream D: Field Guide, worksheets, Event Hall copy and claims audit
Folder: `D-guide/`. Files: `fieldguide-add.json`, `worksheets.json`, `events.json`, `your-methods.json`, `claims-audit.json`.

1. **Playbooks** in the existing shape (`id, unlock, title, months, intro, example, steps, review, caveat`): `interview` (unlock M7), `maps` (unlock M7), `reading` (unlock M7: Skim, Pick, Keep, with the honest line on skimming and the evidence for retrieval practice over rereading), an extended `talk` playbook (a work presentation: five points on a route, rhythm when rehearsing aloud, a one-page memory map kept as a second copy), and a `recall` page for maximizing recall (retrieve first, spacing, the Check Before You Look habit; mention sleep only if the wording is verified).
2. **Toolbox page** `id: "toolbox"`: every common method name (Roman Room, Journey, Image method, Link, Peg, Major, sound-alike or keyword, chunking, memory map, rhythm, skimming) with a plain one-line meaning and the Mnemos week that teaches it.
3. **Worksheets** (plain text with blanks, printable, our own design): **Anchors and Keywords** (stops, pictures, keywords, with a worked grocery example and a worked talk example), **Map a Topic** (a blank memory map layout in words and a recall-it-blank checklist), **Map the People** (a profile grid, with a reminder to keep private details out), **Before and After** (the player's own scores before and after a method, with the practice-effect note).
4. **Your Methods** text (`your-methods.json`): the card shown on Progress, one line per method, and the explanation of why a few attempts are not much to go on. No styles, no types.
5. **Event Hall text** for all seven events: `{ "id", "ourName", "realName", "howItWorks", "ourVersion", "scoring", "notConfirmed", "honest" }`. `howItWorks` uses only section 2's facts, in your words, and a human re-checks them against the live page. Name no athlete. Give each event plain practice advice.
6. **Claims audit.** Read every draft file from A, B and C when ready and list each line that breaks section 4 or the hard rules: `{ "file", "id", "problem", "fix" }`. Start on your own files first; run the cross-read last.

## 10. Open questions for the owner

1. **Name the championship in the game?** A factual line such as "memory competitions, like the USA Memory Championship, have events such as these" is allowed. Or keep it generic. Either way the game must not suggest an endorsement.
2. **Cards.** Included as you asked, as an optional sport corner with no skill credit and no Lumen (the dossier rated cards low-transfer). Is that framing right?
3. **"Mind Map" instead of "Mind Map".** I could not verify the trademark status of "Mind Map". Is "Mind Map" fine?
4. **Event rewards.** Best-result ladders only, or small badges for a first full-format finish (achievement ids are permanent once released)?
5. **Poems.** Original poems with invented poets plus public-domain classics. Any poets you want included or excluded?
6. **Championship pace.** An optional 15-second-per-answer mode in the elimination events, off by default. OK?
7. **Release grouping.** 1.1 words, pools and small options; 1.2 maps, poems and Skim, Pick, Keep; 1.3 cards and the Event Hall. Or events earlier?
8. **Surnames in Names and Faces.** Adds a surname pool; the pixel faces stay invented. OK?
9. **Worksheets.** Plain printable pages with no saved data, as planned. A worksheet that saves answers would be a new record, and a map builder is a later idea that needs your approval.

## 11. Owner decisions (Nov 2, 2026)

- **Name:** the drill is called **Mind Map** (owner: not a trademark). Replace "Mind Map" everywhere.
- **Release:** everything ships together in **1.1** (no 1.2 / 1.3 split).
- **Event Hall rewards:** best-result ladders only, no badges.
- **The championships become part of the lore.** No real championship is named in the game. Veyra holds its own tiered memory contests with a backstory (why the people of Veyra compete), climbing tier by tier to harder formats, with the real championship event formats as the events. A **rival** character, smug and bratty, with money and private tutors that make it easy for them, climbs the tiers alongside the player; the game shows how the rival is doing; the goal of the Event Hall becomes beating the rival in the final. The rival's results are scripted story, never a pressure timer, and never affect skill estimates. Story and rival are written by the story workstream (`docs/drafts/additions/story/`), not workstreams A to D.
- **Defaults for the other open questions:** cards optional with no skill credit; poems public domain only, owner may veto poets; pace mode off by default; surname pool yes (common, public surnames only); worksheets printable, no saved data.
