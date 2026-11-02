# Project Mnemos — Product Dossier

Nov 1, 2026 · @Ayaan

## Executive summary

Mnemos: Keepers of Veyra is now a working, local-first memory training RPG prototype with a complete 365-day curriculum, an adaptive engine that only counts delayed recall as mastery, and an original story whose progress is locked to demonstrated skill. It is ready for your review; nothing has been published.

- **Curriculum:** 12 modules, 52 weeks, 9 exercise templates, monthly gates and a day-1 baseline repeated every quarter (Section 4).
- **Learning engine:** every session opens with delayed recall; 10 documented adaptive rules; mastery requires recall after 1 and 7 days (Sections 5 and 6).
- **World:** Veyra's 12 districts are real memory-palace routes; Wren grows from apprentice to guide only when gates are passed (Section 7).
- **Prototype:** one offline HTML file, 28 unit tests and a full end-to-end test passing (Sections 12 and 13).
- **Independent audit:** 3 rounds, 29 defects found, 26 fixed, no release blockers; final overall score 7 of 10, engineering 8 (Section 12).
- **Decision needed:** approve the prototype for GitHub publication, or send changes. The largest remaining gap is story text for Chapters 4 to 12.

## 1. Research report

The strongest evidence says that 30 minutes a day of Method of Loci training can more than double word-list recall within six weeks, and that spaced retrieval is what keeps it. General "brain training" does not transfer, so Mnemos trains specific, named skills and never claims IQ gains.

**Source note.** Web search was disabled for this account during this session. Every source below is cited from established literature known before June 2026 and was not re-opened today. Figures are approximate and should be verified before public release.

### 1.1 What memory champions actually do

| Source | Core method | What Mnemos takes from it |
| --- | --- | --- |
| Dominic O'Brien, *How to Develop a Brilliant Memory Week by Week* (2005) | Journey method, Dominic System (digit pairs to person initials), 52-week structure | Journeys as the backbone; a person-based number system as an optional advanced track |
| Joshua Foer, *Moonwalking with Einstein* (2011) | Memory Palace, deliberate practice, the "OK plateau" | Plateau detection and deliberate difficulty increases |
| Nelson Dellis, *Remember It!* (2018) | Practical names, numbers, lists, PAO | Real-world transfer modules and the names protocol |
| Ed Cooke (co-founder of Memrise) | Playful, vivid, emotional imagery; "mems" | Tone: creativity over rote; user-generated images |
| Maguire et al., *Nature Neuroscience* (2003) | Superior memorizers had normal IQ and brain structure; most used Method of Loci | Evidence that the skill is learnable, not innate |
| Chase and Ericsson (1980s), subject "SF" | Digit span from about 7 to about 80 after roughly 230 hours | Skilled memory theory: chunking plus retrieval structures |

### 1.2 Learning science that shapes the engine

| Finding | Key source | Design consequence |
| --- | --- | --- |
| Mnemonic training in novices: about 26 to 62 of 72 words after 40 days of 30 minutes; about 48 still recalled 4 months later | Dresler et al., *Neuron* (2017) | The 30-minute daily format is validated; Month 2 delivers the biggest jump |
| Method of Loci has large effects for ordered recall | Twomey and Kroneisen, *QJEP* (2021) meta-analysis | Palace is the backbone skill |
| Retrieval practice beats re-study | Roediger and Karpicke (2006) | Every session opens with recall, not re-reading |
| Optimal gap grows with the retention goal | Cepeda et al. (2006, 2008) | Probes at 1, 7, 30, 90 and 180 days |
| Interleaving improves discrimination and transfer | Rohrer and Taylor (2007) | Mixed review from Month 3 onward |
| Desirable difficulties | Bjork and Bjork (2011) | Difficulty rises only after stable accuracy |
| Interactive imagery beats separate images; bizarreness helps only in mixed lists | Bower (1970); McDaniel and Einstein (1986) | Teach "interaction first, oddness second" |
| Self-generated cues are remembered better | Slamecka and Graf (1978) | Users write their own images |
| Practice testing and spacing: high utility. Keyword mnemonic: low utility for durable learning | Dunlosky et al., *PSPI* (2013) | Keyword method always paired with spaced retrieval |
| Working-memory training does not transfer to general ability | Melby-Lervåg and Hulme (2013); Simons et al., *PSPI* (2016) | No IQ or clinical claims |
| Habits form over a median of about 66 days; one missed day does not break them | Lally et al. (2010) | Forgiving streaks, no punishment |
| Expected tangible rewards can undermine intrinsic motivation; informational feedback does not | Deci, Koestner and Ryan (1999) | Rewards describe progress, not bribes |
| Autonomy, competence, relatedness drive lasting motivation | Ryan and Deci (2000) | Choice of path, visible mastery, a companion who learns too |
| Teaching a learner agent improves the teacher | Chase et al. (2009); Fiorella and Mayer (2013) | "Teach Wren" reflection step |

### 1.3 Technique evaluation by the curriculum committee

| Technique | Evidence | Everyday transfer | Difficulty | Verdict |
| --- | --- | --- | --- | --- |
| Visualization and interactive imagery | Strong | High | Low | Foundation, Month 1 |
| Link and story method | Moderate | Medium | Low | Foundation, Month 1 |
| Method of Loci (Memory Palace) | Strong | High | Medium | Backbone, Month 2 onward |
| Name and face association | Moderate | Very high | Medium | Core, Month 3 |
| Major System (phonetic numbers) | Moderate | High | High | Core, Months 4 and 5 |
| Peg systems (number-shape, rhyme) | Moderate | Medium | Low | Supporting, Month 6 |
| Keyword method (vocabulary) | Strong short term, weak long term alone | High | Medium | Core, only with spaced retrieval |
| Dominic System | Practitioner evidence | Medium | High | Optional advanced track |
| PAO (person-action-object) | Practitioner evidence | Low | Very high | Optional, competition track, Month 9 |
| Playing-card memorization | Practitioner evidence | Very low | Very high | Excluded from core, optional challenge |
| Working-memory n-back drills | Weak transfer | Very low | Low | Excluded |

### 1.4 Learning apps reviewed (principles only, no assets copied)

| App | Principle that works | Mnemos version |
| --- | --- | --- |
| Duolingo | Tiny daily unit, clear path, streak habit | 30-minute session with 10-minute recovery mode; forgiving streak |
| Brilliant | Learn by doing, explanation after attempt | Try first, then explain |
| Elevate | Clean per-skill scores | Skill radar from real data |
| Khan Academy | Mastery levels per skill | Five-state mastery model with delayed checks |
| Habitica | RPG identity around habits | World restoration tied to mastery, not clicks |

## 2. Committee positions and resolved disagreements

Each expert drafted a position on its own before seeing the others. Seven real conflicts came up. Six were resolved and one stays open for your decision.

### 2.1 Independent positions

| Expert | Position in one line | Deliverable in this dossier |
| --- | --- | --- |
| 1. Curriculum Committee | Palace first, numbers second, competition formats last and optional | Section 4 curriculum |
| 2. Learning Scientist | Retrieval before instruction; mastery only counts after a delayed check | Sections 5 and 6 |
| 3. Creative Director | The world itself is a memory palace; the companion learns alongside the user | Sections 3, 7, 8 |
| 4. UI/UX Designer | One primary action per screen; zero motion during encoding | Section 9 |
| 5. Frontend Engineer | React + Vite static build, IndexedDB with fallback, single-file prototype | Section 10 |
| 6. Auditor | Not involved in design; tested the built prototype cold | Section 12 |

### 2.2 Disagreements and how they were settled

| # | Conflict | Side A | Side B | Resolution |
| --- | --- | --- | --- | --- |
| 1 | Numbers system | Committee: Dominic System, champion-proven | Learning Scientist: Major System, makes real words and transfers to dates and phone numbers | Major is core. Dominic and PAO become an optional advanced track in Month 9 |
| 2 | Session order | Creative: open with story | Learning Scientist: open with retrieval of yesterday's material | Retrieval first. A two-line story beat frames it, under 20 seconds |
| 3 | Streaks | Creative: daily streak drives return | Learning Scientist and UX: streak loss punishes; Lally (2010) shows one miss does not matter | Streak kept, with one automatic rest day per week; headline metric is 14-day consistency |
| 4 | Story gating | Creative: unlock by days to keep pacing | Learning Scientist: unlock by mastery | Calendar advances lessons. Story chapters and companion growth unlock only by passing gate assessments |
| 5 | Adaptivity range | Engineer: full adaptive reordering | Committee: fixed syllabus order | Module order fixed. Adaptation changes difficulty, review mix and remediation, capped at 40% of a session |
| 6 | Speed scoring | Committee: speed is central in competition | Learning Scientist: speed before accuracy builds sloppy encoding | Speed weighted 10%, only timed after accuracy reaches 80% |
| 7 | Face images | UX: photo-realistic faces | Engineer and IP: licensing and privacy risk | Original procedural illustrated faces in v1. **Open:** licensed photo set in v2? |

### 2.3 Cut as unnecessary complexity

- Accounts, logins and cloud sync in v1 (local-first; export file transfers devices).
- Leaderboards (social comparison hurts beginners; may return as opt-in).
- 3D game engine (cost and battery; CSS depth and SVG give the world its depth).
- Playing-card drills in core (low transfer).

## 3. Product strategy and creative direction

The product is **Mnemos: Keepers of Veyra**, a free, open-source, local-first memory training RPG for adults. The chosen concept scored 37 of 40 because the world is itself a memory palace: every district the user restores is a set of loci they actually use.

### 3.1 Strategy

| Item | Decision |
| --- | --- |
| Target user | Adult beginner, no prior technique knowledge, 30 minutes a day |
| Promise | Measurable gains in specific memory skills, tracked honestly; never IQ or medical claims |
| Distribution | Free, open source, static web app (GitHub Pages after your approval) |
| Business model | None; donations optional later |
| North-star metric | Delayed (7-day) recall accuracy across trained skills |
| Guardrail metrics | Session length stays at or under 30 minutes; no guilt messaging; no data leaves the device by default |
| Non-goals v1 | Accounts, social feeds, leaderboards, ads, clinical assessment |

### 3.2 Concept evaluation (1 to 5 per criterion)

| Concept | Emotion | Narrative length | Fit with exercises | Originality | Feasibility | Adult tone | 365-day support | Non-manipulative attachment | Total |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **E. Keepers of Veyra (Archive city + mystery hybrid)** | 5 | 5 | 5 | 4 | 4 | 5 | 5 | 4 | **37** |
| A. Archive of Forgotten Worlds (brief) | 4 | 4 | 4 | 3 | 4 | 4 | 4 | 4 | 31 |
| C. Detective reconstructing forgotten events | 4 | 3 | 4 | 4 | 3 | 5 | 3 | 4 | 30 |
| B. Memory Academy | 3 | 3 | 4 | 2 | 5 | 4 | 4 | 4 | 29 |
| D. Sci-fi neural exploration | 3 | 4 | 3 | 3 | 3 | 4 | 3 | 3 | 26 |

### 3.3 Why E won

- **Mechanic and story are the same thing.** Districts of Veyra are loci. Restoring a district means building and using a real palace route.
- **A mystery carries a year.** Archivist Calder vanished the night the Lethe Tide rose. Each mastery gate returns a fragment of what happened.
- **The ending teaches maintenance.** The final twist reframes forgetting as necessary; the climax asks the user to choose what to keep. That mirrors spaced retention after the course.
- **Adult tone.** Literary, melancholy and wry rather than cute. No mascots that cheer every tap.

The name "Mnemos" and the river Lethe come from Greek myth, which is public domain. Veyra, Wren, Calder and all story text are original.

## 4. The 12-month curriculum

The year runs as 12 modules, 52 weeks and 365 training days, built from 9 reusable exercise templates with data-driven parameters. The curriculum advances by completed training days, not calendar days, so a missed day never skips content.

### 4.1 Annual objectives

1. Ordered recall of 30 or more unrelated items via a palace, with at least 85% accuracy.
2. 7-day retention of at least 70% on every trained skill.
3. Names for 10 new faces at 70% or better.
4. 40 digits in 5 minutes at 85% or better via the Major System.
5. 20 vocabulary items per week retained at 80% after 7 days.
6. A personal maintenance plan in active use at day 365.

These are targets for a typical adult, informed by Dresler et al. (2017). They are not guarantees. Results are always reported against the user's own day-1 baseline.

### 4.2 Module matrix, part A: what is taught

| Module | Weeks | Skill | Objective | Prerequisite | Technique | Lesson | Exercise | Difficulty |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| M1 Lamplighters' Quay | 1 to 4 | Imagery | 15 words in order after 2 min, 80% | None; day-1 baseline | Attention, interactive imagery, link, story chain | Images that interact stick | Word Recall, Linked Pairs, Story Chain | 1 to 3 |
| M2 The Long Gallery | 5 to 8 | Palace | 20 items forward and reverse at 90%; 7-day 70% | M1 Practiced | Method of Loci: route, loci, placement, reverse | A palace is a fixed route; recall is a walk | Palace builder, Palace Walk | 2 to 5 |
| M3 Hall of Faces | 9 to 13 | Faces | 10 names in 2 min at 70%; 1-day 60% | M2 Practiced | Feature selection, name-to-image, spaced rehearsal | Feature, image, interaction | Names and Faces | 1 to 5 |
| M4 Counting House | 14 to 17 | Numbers | 00 to 99 at under 3 s each, 90% | M1 Practiced | Major System | Digits become consonant sounds | Major Conversion, Digit Recall | 1 to 6 |
| M5 Clockwork Market | 18 to 21 | Numbers | 40 digits in 5 min at 85% | M4 Proficient | Number palace, dates, phone numbers | Two digits per image, two images per stop | Digit Recall | 3 to 7 |
| M6 Tongues Bridge | 22 to 26 | Vocab | 20 words, 80% at 7 days | M1, M2 Practiced | Keyword, abstract substitution, pegs | Keywords need spaced retrieval | Vocabulary, abstract Linked Pairs | 2 to 6 |
| M7 Scriptorium | 27 to 30 | Structure | 10 facts or a 7-point outline, 80% at 1 day | M2 Proficient | Outline to palace, cue-answer, self-explanation | Reduce, place, explain | Fact Recall, Story Chain | 2 to 6 |
| M8 Tidal Stair | 31 to 34 | Palace (speed) | 30 words in 3 min at 85% | Timed accuracy 80% | Faster encoding, 50-stop route | Accept the first good image | Timed Palace Walk, timed Digits | 4 to 8 |
| M9 Mirror Wards | 35 to 39 | Palace (robustness) | 80% after a competing list | M8 Practiced | Palace reuse, separate palaces, mixed recall, optional PAO | Interference is the enemy of reuse | Interference Word Recall, mixed review | 4 to 8 |
| M10 Open Roads | 40 to 43 | Structure (transfer) | 75% on unfamiliar formats | Q3 done | Technique selection, book and exam study | Choosing is a skill | Transfer tasks | 3 to 7 |
| M11 Amphitheatre | 44 to 47 | All | 5 events each at 75% | All Practiced | Pacing, recall under pressure | Keep the routine | Mini-decathlon | 5 to 9 |
| M12 Lethe Gate | 48 to 52 | All | Annual battery and maintenance plan | M11 attempted | Retention maintenance, curation | Forgetting is the filter | Annual battery | Mixed |

Every module runs in the 30-minute daily format (Section 5).

### 4.3 Module matrix, part B: how it is measured and what it unlocks

| Module | Assessment | Mastery threshold | Retention test | Remediation | Transfer | Narrative | Unlock |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M1 | 15-word chain plus 10 pairs | Gate 80%; 1-day 70% | 1, 7, 30 days | Imagery coaching, smaller lists, written images | Errand list | Prologue, Ch. 1: relight the quay | Long Gallery |
| M2 | 20 items forward then reverse | 90% fwd, 85% rev; 7-day 70% | 1, 7, 30, 90 days | Route review, 5 loci, locus check | Tomorrow's to-do list | Ch. 2: Calder walked this route nightly | Hall of Faces |
| M3 | Gate plus Q1 battery | Gate 70%; Q1 word recall 1.5x baseline | 1, 7 days | Feature-only, then name-image drills | 3 names at your next meeting | Ch. 3: one face missing from every wall | Counting House; Q1 report |
| M4 | 20 random pairs, timed | 90% under 3 s; 7-day 85% | Expanding to 180 days | Decade blocks; rewrite weak images | A code you already know | Ch. 4: ledgers stop mid-sum | Clockwork Market |
| M5 | 40 digits, 5 min | 85%; 7-day 70% | 1, 7, 30 days | Back to conversion; 20 digits | Work phone numbers | Ch. 5: the Tide runs on a schedule | Tongues Bridge |
| M6 | Gate plus Q2; 6-month palace probe | 7-day 80% | 1, 3, 7, 14, 30, 60 days | User rewrites keywords | Your own vocabulary | Ch. 6 twist: Calder opened the gate | Scriptorium; Q2 report |
| M7 | 12 facts plus outline | 80% at 1 day | 1, 7, 30 days | Fewer facts; make-your-own-question | 5-min talk from memory | Ch. 7: the copies disagree | Tidal Stair |
| M8 | 30 words, 3 min | 85% at target time | 1, 7 days | Study time restored if accuracy under 75% | Agenda in 2 min | Ch. 8: race the tide | Mirror Wards; PAO |
| M9 | Gate plus Q3 | 80% under interference | All gates at 90 days | Fresh palace; 2-day rest | Two clients kept apart | Ch. 9: false memories | Open Roads; Q3 report |
| M10 | Unfamiliar mixed task | Transfer 75% | 7, 30 days | Technique-selection coaching | Is the module | Ch. 10: memories from outside | Amphitheatre |
| M11 | Decathlon | Each event 75% | 1, 7 days | Targeted week on weakest event | Exams, interviews | Ch. 11: the Echo of Calder | Lethe Gate |
| M12 | Annual vs day-1 baseline | Reported, not pass or fail | Weekly maintenance | Plan targets weakest skill | Maintenance plan | Ch. 12: what Veyra keeps | Keeper mode |

### 4.4 The 52-week plan

Drill notation: template, item count, study seconds. Counts are shown at difficulty 1; the adaptive engine raises them up to 60% as the user improves. Day 7 of every week is the weekly check; the last day of each module is its gate.

| Wk | Mod | Focus | Objective | Practice drills | Day-7 check |
| --- | --- | --- | --- | --- | --- |
| 1 | M1 | Attention and vivid images | Specific image per word in under 6 s | Word Recall 8 / 60s | Word Recall 8 / 50s |
| 2 | M1 | Linking pairs | One cue brings back the other | Linked Pairs 8 / 70s | Linked Pairs 8 / 60s |
| 3 | M1 | Story chains | 12 items in order | Story Chain 10 / 90s | Story Chain 10 / 80s |
| 4 | M1 | Consolidation and gate | Choose imagery vs chain | Chain 12 / 90s; Pairs 10 / 70s | Word Recall 12 / 70s |
| 5 | M2 | Building your first palace | 10-stop route | Palace 5 / 60s | Palace 5 / 50s |
| 6 | M2 | Placing and walking | 10 items by walking | Palace 10 / 90s | Palace 8 / 70s |
| 7 | M2 | Reverse and random access | Backward recall | Palace 12 / 100s reverse | Palace 10 / 80s |
| 8 | M2 | Expanding the gallery | 20 items both ways | Palace 15 / 120s; Palace 10 / 80s reverse | Palace 15 / 110s |
| 9 | M3 | Seeing a face | Stable feature in 3 s | Faces 4 / 50s | Faces 4 / 45s |
| 10 | M3 | Names as images | Names become pictures | Faces 6 / 60s | Faces 5 / 55s |
| 11 | M3 | Faces at volume | 8 names in 2 min | Faces 8 / 90s | Faces 6 / 70s |
| 12 | M3 | Mixed review | Interleave skills | Faces 8 / 80s; Palace 15 / 100s | Chain 12 / 80s |
| 13 | M3 | Quarter 1 assessment | Growth vs baseline | Word Recall 15 / 90s; Faces 8 / 80s | Palace 20 / 150s |
| 14 | M4 | Major System 0 to 9 | Ten sound codes | Major 10 | Major 10 |
| 15 | M4 | Major 00 to 49 | Fixed images | Major 15 | Major 12 |
| 16 | M4 | Major 50 to 99 | Fixed images | Major 15 | Major 15 |
| 17 | M4 | Conversion speed | Under 3 s per pair | Major 20 timed; Digits 8 / 60s | Major 20 timed |
| 18 | M5 | Digits in the palace | 16 digits | Digits 12 / 90s | Digits 12 / 80s |
| 19 | M5 | Longer numbers | 24 digits in 3 min | Digits 20 / 150s | Digits 16 / 120s |
| 20 | M5 | Dates and phone numbers | Real formats | Digits 10 / 70s; Pairs 8 / 70s | Digits 10 / 60s |
| 21 | M5 | Number gate | 40 digits in 5 min | Digits 24 / 180s | Digits 24 / 160s |
| 22 | M6 | Keyword method | Sound-alike links | Vocab 6 / 90s | Vocab 6 / 80s |
| 23 | M6 | Abstract to concrete | Substitutes | Pairs 8 / 80s abstract; Vocab 8 / 90s | Pairs 8 / 70s abstract |
| 24 | M6 | Peg systems | Number-shape pegs | Chain 10 / 80s; Vocab 10 / 100s | Vocab 10 / 90s |
| 25 | M6 | Vocabulary volume | 12 words at 7 days | Vocab 12 / 120s | Vocab 10 / 100s |
| 26 | M6 | Quarter 2 assessment | Half-year check | Word Recall 15 / 90s; Digits 16 / 120s | Vocab 10 / 90s |
| 27 | M7 | Facts as cue and answer | Capitals, element symbols | Facts 6 / 90s | Facts 6 / 80s |
| 28 | M7 | Outlines in the palace | 7-point outline | Chain 7 / 70s; Facts 8 / 100s | Facts 8 / 90s |
| 29 | M7 | Self-explanation | Explain in own words | Facts 10 / 110s | Facts 8 / 90s |
| 30 | M7 | Structure gate | 12 facts at 1 day | Facts 12 / 120s | Facts 12 / 110s |
| 31 | M8 | Encoding faster | First usable image | Palace 15 / 90s timed | Palace 15 / 80s timed |
| 32 | M8 | A 50-stop route | Extend palace | Palace 20 / 120s timed | Palace 18 / 100s timed |
| 33 | M8 | Timed numbers | 24 digits in 2 min | Digits 20 / 100s timed | Digits 20 / 100s timed |
| 34 | M8 | Speed gate | 30 words in 3 min | Palace 25 / 150s timed | Palace 25 / 150s timed |
| 35 | M9 | Interference | List A after list B | Word Recall 10 / 70s interference | Word Recall 10 / 60s interference |
| 36 | M9 | Separate palaces | Palaces by subject | Palace 15 / 100s; Word Recall 12 / 70s interference | Palace 15 / 90s |
| 37 | M9 | Mixed category recall | Interleave all | Faces 6; Digits 12; Vocab 6 | Facts 8 / 80s |
| 38 | M9 | PAO (optional) | Person-action-object | Major 20 timed; Digits 18 / 100s | Digits 18 / 90s |
| 39 | M9 | Quarter 3 assessment | Cumulative probes | Word Recall 15 interference; Faces 8 | Palace 20 / 120s |
| 40 | M10 | Choosing the technique | Right tool per material | Facts 8; Chain 10 | Pairs 10 / 80s |
| 41 | M10 | Learning from books | Chapter to outline | Facts 10 / 100s | Facts 10 / 90s |
| 42 | M10 | Exam and technical material | Terms, procedures | Vocab 10; Chain 8 | Vocab 10 / 90s |
| 43 | M10 | Transfer gate | Unfamiliar tasks | Facts 10; Faces 8 | Pairs 12 / 90s abstract |
| 44 | M11 | Event pacing | Time plan per event | Palace 20 timed; Digits 20 timed | Faces 10 / 90s |
| 45 | M11 | Recall under pressure | Accuracy with a clock | Word Recall 20 timed; Vocab 10 | Facts 12 / 100s |
| 46 | M11 | Decathlon practice | All events | Palace 20; Faces 8; Digits 16 | Vocab 10 / 80s |
| 47 | M11 | Arena gate | Each event 75% | Palace 25; Faces 10 | Digits 24 / 120s |
| 48 | M12 | What to keep | Permanent set | Facts 10; Palace 15 | Facts 10 / 90s |
| 49 | M12 | Maintenance scheduling | Weekly 10-min review | Vocab 10; Digits 16 | Faces 8 / 80s |
| 50 | M12 | Annual battery I | Words, numbers, faces | Word Recall 15; Digits 24 | Faces 10 / 90s |
| 51 | M12 | Annual battery II | Vocab, facts, palace | Vocab 12; Facts 12 | Palace 30 / 180s |
| 52 | M12 | The Lethe Gate | Final assessment | Palace 30 / 180s; Faces 10 | Digits 30 / 150s |

Day 365 is the closing ceremony: annual report and the switch to Keeper mode.

## 5. Daily session and adaptive learning engine

Every session opens with retrieval of earlier material, because a delayed test is both the best practice and the only honest measure of retention. The engine adapts difficulty, review mix and remediation, but never the order of modules.

### 5.1 The 30-minute session (optimized)

| Step | Minutes | What happens | Why |
| --- | --- | --- | --- |
| 1. Recall warm-up | 5 | Recall sets from 1, 7, 30, 90 or 180 days ago with no re-study | Testing effect; measures real retention |
| 2. Lesson | 4 | 2 to 3 short cards; day 1 of a week teaches, other days refresh | Short instruction limits cognitive load |
| 3. Guided practice | 6 | Smaller drill; user may type the image they formed | Scaffolding and generation effect |
| 4. Independent practice | 9 | Full drill at the current difficulty | Deliberate practice at the edge of ability |
| 5. Check | 4 | New material in the week's check format | Near transfer; feeds the Transfer score |
| 6. Reflect and teach Wren | 2 | Diagnose missed items; pick the right explanation for Wren | Metacognition; protege effect |

This differs from the brief's draft (warm-up 3, assessment 4) in one way: retrieval moved to the start and doubled. Feedback is shown after each drill, not saved for the end, because immediate item-level feedback corrects errors before they consolidate.

### 5.2 Session types

| Type | Length | When | Advances curriculum |
| --- | --- | --- | --- |
| Full | 30 min | Default | Yes, one training day per calendar day at most |
| Recovery | 10 to 12 min | Offered after 2 or more days away | No; counts for consistency |
| Review only | 10 to 15 min | Any time; due probes plus mixed review | No |
| Assessment | 20 to 30 min | Day 7 of each week; gate on the module's last day | Yes |
| Free practice | Any | Training Grounds, any unlocked drill | No; XP capped at 50 a day |

### 5.3 Per-skill state

Each of the 7 skills keeps: difficulty level 1 to 10, a moving accuracy average (EWMA, alpha 0.35), session count, consecutive high and low counts, error counts by type, its delayed-probe history, and a mastery state.

| State | Rule |
| --- | --- |
| 0 Untrained | No attempts |
| 1 Learning | Any attempt |
| 2 Practiced | Average accuracy at least 70% over 3 or more sessions |
| 3 Proficient | Average at least 85% and a 1-day-plus probe at least 80% |
| 4 Mastered | Proficient, plus a 7-day-plus probe at least 80%, plus the module gate passed |

Knowing a technique is never enough: states 3 and 4 require delayed recall. This is how the app separates explaining a palace from using one.

### 5.4 Adaptive rules

| Rule | Trigger | Action | Rationale |
| --- | --- | --- | --- |
| R1 Level up | Accuracy at least 90% in 3 consecutive sessions at this level (timed drills: also within target time) | Difficulty +1: about 6% more items, slightly less study time | Desirable difficulty once performance is stable |
| R2 Level down | Accuracy below 50% in 2 consecutive sessions | Difficulty -1 (minimum 1) | Avoid cognitive overload |
| R3 Remediation | Average below 60% after 3 or more sessions | Next independent drill becomes a remediation drill: 40% fewer items, 50% more study time, coaching card | Rebuild encoding before load |
| R4 Error-pattern switch | Same error type 3 or more times across the last 2 sessions | Alternate explanation card and format (table below) | A repeated error means the explanation did not land |
| R5 Spaced probes | Every practice set | Re-tested at 1, 7, 30, 90, 180 days. Pass (at least 80% of the immediate score, or 70% absolute) moves to the next interval; fail resets to 1 day with a re-learn pass | Gap grows with the retention goal (Cepeda et al.) |
| R6 Forgetting detection | Mean of the last 3 probes for a skill below 60% | Mastery drops one state; that skill's review frequency doubles for 7 days | Mastery must be maintained |
| R7 Less repetition | Skill at Mastered | Appears only in due probes and in mixed review at most once a week; easy drills earn 25% XP | Stop re-teaching what is known |
| R8 Interleaving | From week 9 | One review slot per session draws from a different earlier skill | Discrimination and transfer |
| R9 Time cap | Always | Remediation plus review never exceed 40% of a session | Protects curriculum pace |
| R10 Gate | Module's last day | Pass: chapter, district restored, Wren grows. Fail: calendar continues, retry at most every 3 days, story waits | Story tracks demonstrated mastery |

### 5.5 Error diagnosis

| Signal | Likely cause | Response |
| --- | --- | --- |
| Omission at immediate recall | Encoding: no image formed | "Write your image" scaffold; slower study |
| Wrong item in the right slot | Weak or ambiguous image | Distinctiveness card |
| Right items, wrong order | Sequence or route problem | Route rehearsal card |
| Correct untimed, fails timed | Speed | Return to untimed until 80% |
| Correct immediately, fails at 1 to 7 days | Retention | Earlier probe and a re-learn pass |
| User reports distraction | Attention | Short focus reset before study; no penalty |

The user confirms the cause on the Reflect step. Self-report combined with the error type is used, never error type alone.

## 6. Assessment and scoring

The Memory Training Score (MTS, 0 to 1000) weights retention highest at 30%, because durable recall is the product's goal. Each component is shown on its own, and any component without enough data is left out and the weights re-normalized rather than guessed.

### 6.1 Assessment calendar

| Level | When | Content |
| --- | --- | --- |
| Daily check | Every full session | New material in the week's check format |
| Delayed probes | 1, 7, 30, 90, 180 days | Earlier practice sets, no re-study |
| Weekly | Day 7 | Mixed check of the week plus one earlier skill |
| Monthly gate | Last day of each module | Module mastery test, framed as the district's Echo |
| Quarterly | Weeks 13, 26, 39 | Parallel form of the day-1 baseline battery |
| Annual | Weeks 50 to 52 | Full battery vs baseline plus cumulative probes |

### 6.2 Component scores (each 0 to 100)

| Score | Definition | Window |
| --- | --- | --- |
| Accuracy | Difficulty-weighted mean accuracy of practice and check drills | Last 14 days |
| Retention | Mean delayed-probe score relative to the immediate score, capped at 100% | Last 30 days |
| Speed | Target time divided by actual time on timed drills, only where accuracy is at least 80% | Last 14 days |
| Mastery | Mean mastery state across introduced skills (state 4 = 100) | Current |
| Transfer | Accuracy on check drills and unfamiliar formats | Last 14 days |
| Skill scores | Per-skill accuracy, retention and level | Per skill |

### 6.3 Composite weighting

```latex
\text{MTS} = 10 \times \frac{0.30R + 0.25A + 0.20T + 0.15M + 0.10S}{\sum w_{\text{available}}}
```

R is retention, A accuracy, T transfer, M mastery and S speed. Retention leads because it is the goal; accuracy before speed because speed without accuracy builds sloppy encoding; transfer is weighted above mastery because a technique that only works on app material has little value.

### 6.4 What the scores are not

The app states on the dashboard and in the About screen: scores measure performance on Mnemos tasks only. They are not an intelligence test, a clinical memory assessment or a diagnosis. Anyone concerned about memory changes should speak to a doctor.

## 7. Creative bible (v0.2)

Veyra is now a full world: a tiered city on a grey northern coast, nine centuries of history, a drug economy built on forgetting, and a year-long thriller in which the player turns out to be carrying the city's lost memory. About 24,000 words of original story, lore and lesson text ship in the app. The style takes its cue from epic fantasy: long, descriptive passages, landscapes and history, plain natural dialogue.

### 7.1 World and lore

| Element | What it is |
| --- | --- |
| The Lethe and the Tide | A river whose evening mist takes whatever no one is holding in mind |
| The Lamp-Wardens | Founders who built Veyra itself as twelve memory-palace routes and swore the Compact of Lamps |
| The Long Quiet | Three centuries of decline: the city trusted paper ledgers, and the Art faded |
| Lethewater, "the grey" | Distilled river water that erases chosen memories; sold to the grieving and the poor |
| The Salt Guild | Merchants who run the grey trade behind a salt business |
| The Quiet Order | Gentle, grey-hooded preachers who teach that forgetting is mercy, funded by the Guild |
| The Night of No Moon | Once in 19 years the Tide becomes a wall; the old Wardens held the Gate through the Long Vigil |
| The Heartledger | The city's one true record, kept only in an Archivist's memory palace |

The app holds 16 lore entries. They unlock through gates and side quests.

### 7.2 Hero, sidekick, villain

| Role | Character | Arc |
| --- | --- | --- |
| Hero | You, the Keeper | A stranger with no past discovers they are Calder's courier and carry the Heartledger; they chose this burden once and choose it again |
| Sidekick | Wren Halloway | A funny, anxious clerk who lives by notecards; learns she is Calder's hidden heir; ends as Archivist |
| Villain | Sevrin Ashgrave, the Grand Hush | A grieving father who drank away his loss and now wants to "free" the whole city; Calder's brother; redeemed at the Gate by a memory of his daughter |
| Mentor | Elsabet Calder | The vanished Archivist who opened the Gate on purpose; secretly living as Old Tansy, memory wiped |
| Drifter | Joss Hask | A huge, quiet road-warden hunting the men who hollowed out his brother |
| Intriguer | Isolde Varre | Harbour Mistress and card shark; apparent betrayer, actually Calder's spy in the Order |
| Doubter | Brother Ennick | A young acolyte who defects with the true record |

Character profiles reveal more as gates are passed, so the twists stay hidden until earned.

### 7.3 Story structure

| Ch. | District | Main quest | Turn |
| --- | --- | --- | --- |
| Prologue | The Archive | Find the Archive | The lantern lights for you alone |
| 1 | Lamplighters' Quay | Relight the lamps | The Hushed snuff them; first ledger page |
| 2 | Long Gallery | Walk Calder's route | Escape in the dark by walking it backwards |
| 3 | Hall of Faces | Restore the names | Hask arrives; the Grand Hush knows your name |
| 4 | Counting House | Crack the number code | Guild money funds the Order; a date: the Night of No Moon |
| 5 | Clockwork Market | Restart the clocks | Assassination attempt; Isolde saves you |
| 6 | Tongues Bridge | Read the inscriptions | **Twist:** Calder opened the Gate; the city turns on the Archive |
| 7 | Scriptorium | Find the true account | She did it to stop thieves; "find the courier" |
| 8 | Tidal Stair | Race the Tide | **Twist:** Isolde betrays you, then reveals she is Calder's spy |
| 9 | Mirror Wards | Escape with your memories | **Twist:** the scratched face is Wren's; she is the heir |
| 10 | Open Roads | Find out who you were | **Twist:** your own handwriting in a waystation register |
| 11 | Amphitheatre | Win the Rite of Echoes | **Twist:** Sevrin is Calder's brother; Old Tansy is Calder |
| 12 | Lethe Gate | Hold the Long Vigil | You walk every route as one road; Sevrin closes the Gate |

There are three layers. The **major arc** is the 12 chapters, unlocked only by gates. The **minor arcs** are 52 weekly tales, one at the start of each week, which build suspense between gates. The **side arcs** are 24 side quests (Hask's brother, Isolde's games, Ennick's courage, Mosk's lost wife and more). Each finishes only when the player shows a real skill: a 7-day recall, a level reached, a perfect reverse walk. Each gate opens with a short boss-style encounter.

### 7.4 Wren's voice

Wren's lines were rewritten to sound like a real person: contractions, jokes, small admissions of fear. She never guilts the player. On a return after absence: "The lamps are still lit. I checked every night, which I'm slightly embarrassed to admit. A short session is a perfectly good way back in."

### 7.5 Visual identity

| Element | Decision |
| --- | --- |
| Palette | Ink night (#0F1420), lamplight amber (#E8B04B), sea-glass teal (#7FB3A6), parchment (#EFE6D2), Tide silver (#B8C2D6) |
| Type | Serif for story and headings, set large with a drop cap; system sans for UI; no external fonts |
| Illustration | Original flat SVG: lantern, isometric districts, fog. Restored districts gain light and colour |
| Motion | Lantern glow and fog drift outside drills only; none during study or recall |

## 8. Gamification and rewards

Lumen (XP) is earned mainly by accurate recall at the right difficulty, and the single biggest payout is a successful delayed probe. Showing up alone earns little, and repeating easy drills earns a quarter of normal.

### 8.1 Lumen sources

| Event | Lumen | Rule |
| --- | --- | --- |
| Drill completed | 10 x accuracy x (1 + 0.1 x (level - 1)) | Accuracy-weighted, difficulty-scaled |
| Delayed probe | 25 x probe score x interval factor (1 day 1.0, 7 days 1.4, 30+ days 1.8) | Retention pays most |
| Personal best on a skill | +20 | Improvement, not volume |
| Skill level up (R1) | +30 | Demonstrated progression |
| Full session completed | +15 | Small consistency credit |
| Return after 3+ days, session done | +20 "Rekindled" | Rewards recovery, never punishes absence |
| Drill 2+ levels below the skill's level | 25% of normal | No farming |
| Free practice | Capped at 50 a day | No grinding |

### 8.2 Progression layers

| Layer | Driven by | Visible as |
| --- | --- | --- |
| Keeper rank | Total Lumen (rank = floor of the square root of Lumen/50, plus 1) | Rank number and title |
| Skill tree | Per-skill mastery states | Seven branches, nodes light by state |
| World map | Gates passed | Districts lose fog and gain colour |
| Wren | Gates passed | Six stages of her arc |
| Ledger fragments | Gates and mastery milestones | Calder's story, collectible |
| Achievements | Specific demonstrated feats | Seals in the Archive |

### 8.3 Consistency without punishment

- The headline habit metric is **consistency: sessions in the last 14 days**, not an all-or-nothing streak.
- The streak still exists and is shown, with one automatic rest day per week that preserves it.
- A broken streak is described as "your longest run so far was N days"; no flames go out, no warnings.
- A recovery session (10 minutes) is offered after any absence.

### 8.4 Achievements in the prototype

First Light (first session) · Cornerstone (first palace built) · Clean Sweep (100% on a drill of 8+ items) · Walking Backward (perfect reverse palace walk) · It Stayed (1-day probe at 90%+) · A Week Later (7-day probe at 80%+) · Rekindled (return after 3+ days and finish) · Steady Flame (7 sessions within 14 days) · Honest Ledger (3 reflections with diagnosis) · Sharper (first skill level up) · Quay Restored (Month 1 gate) · Face Reader (8+ names correct in one drill) · Number Smith (10 of 10 Major conversions at under 3 s) · Safe Keeping (first profile export).

## 9. UI/UX specification

Mobile-first, five destinations, one primary action per screen. During study and recall the screen goes still: no animation, no companion chatter, no score counters, only the stimulus and a quiet timer.

### 9.1 Information architecture

| Tab | Purpose | Key components |
| --- | --- | --- |
| Today | Start the right session in one tap | Session card (Full, Recovery, Review), due probes count, Wren's line, week objective |
| Veyra | World and story | District map with fog, chapter list, ledger fragments |
| Palaces | Memory palace inventory | Palace builder, loci list, usage count, rest status |
| Progress | Honest analytics | MTS with components, skill radar, accuracy and retention trends, calendar heatmap, assessment history, weakest skills |
| Keeper | Profile and data | Avatar, rank, achievements, settings, export, import, delete, privacy, about |

Mobile: bottom tab bar, 56 px targets. Desktop (900 px and up): left rail and a two-column Today screen.

### 9.2 Daily flow

1. Open app: Today shows one large "Begin day N" button and what is due.
2. Session runner: a thin step bar (6 segments) at the top; exit saves partial progress.
3. Each drill: Brief (what to do) → Study (stimulus only) → Recall (inputs) → Feedback (item-by-item, correct answers shown).
4. Reflect: tap a cause for missed items; choose the explanation Wren should hear.
5. Summary: scores, Lumen breakdown by source, any unlock, Wren's line, next due probe date.

### 9.3 Interaction patterns

| Pattern | Spec |
| --- | --- |
| Typed recall | One field per slot; Enter moves to next; forgiving match (case, accents, plurals, one-letter typos on words of 5+ letters) |
| Ordered recall | Numbered slots; free recall uses a single list field |
| Palace recall | Each slot labelled with its locus name |
| Faces | Face shown, name typed below; illustrated faces only |
| Timer | Countdown shown as a thin bar plus seconds; "I'm ready" ends study early |
| Feedback | Green check / amber dash per item with the correct answer; never red flashes |

### 9.4 Accessibility requirements

- WCAG 2.2 AA contrast in both themes; text at least 16 px; zoom to 200% without loss.
- Full keyboard path; visible focus rings; skip-to-content link.
- Screen reader: ARIA live region announces drill phase changes and results.
- prefers-reduced-motion removes all decorative motion; a manual toggle exists too.
- Colour is never the only signal: icons and text accompany every state.
- Timers can be extended 1.5x in settings for users who need more time; scores note the setting.

## 10. Technical architecture

React 18 with Vite, plain JavaScript, no backend. The build produces one self-contained HTML file for local review and a static folder for GitHub Pages later. All data stays in the browser in IndexedDB, with localStorage as fallback and a JSON file for backup and device transfer.

### 10.1 Framework decision

| Option | Reliability | Maintainability | Pages compatible | Speed to build | Verdict |
| --- | --- | --- | --- | --- | --- |
| **React + Vite** | High | High; large contributor pool | Yes, static build | High | **Chosen** |
| Vanilla JS | High | Low at this size (40+ screens and states) | Yes | Medium | Rejected |
| TypeScript | High | Highest | Yes | Medium | Planned for v2 once data shapes settle |
| Game engine (Phaser, three.js) | Medium | Medium | Yes | Low | Rejected for v1: battery, bundle size, accessibility |
| SVG + CSS for world art | High | High | Yes | High | Chosen for map, faces, lantern |

### 10.2 Code structure

| Layer | Files | Responsibility |
| --- | --- | --- |
| Data | curriculum, content pools, story | Modules, weeks, word pools, Major list, faces, story text |
| Engine | session builder, scoring, adaptive, scheduler, rewards | Pure functions, unit-tested, no UI |
| Storage | store | IndexedDB with fallback, export, import, schema migration |
| UI | screens and components | Today, Session runner, Drills, Veyra, Palaces, Progress, Keeper |

### 10.3 Data model (profile record)

| Field | Contents |
| --- | --- |
| meta | schema version, curriculum version, created, last opened |
| user | alias, avatar, preferences (theme, reduced motion, timer multiplier) |
| progress | curriculum day, training dates, minutes, streaks, Lumen, gates passed |
| skills | per skill: level, average, sessions, highs, lows, error counts, mastery |
| results | every drill result: date, day, skill, template, role, items, accuracy, timings, errors |
| sets | stored practice sets with probe schedule (next due, interval index, history) |
| palaces | name, ordered loci, last used |
| majorList | the user's personal 00 to 99 images |
| achievements, story | unlocked ids with dates; chapters seen |

### 10.4 Persistence, privacy and offline

| Topic | Behaviour |
| --- | --- |
| Save | After every drill and step, so closing mid-session loses at most one drill |
| Storage | IndexedDB; falls back to localStorage; asks the browser for persistent storage |
| Export | Downloads a .json file with schema version and a checksum |
| Import | Validates structure and version, previews the profile, then replaces only on confirmation |
| Device transfer | Export on device A, import on device B. No automatic sync |
| Cloud sync (later) | Supabase is the best fit (open source, row-level security, free tier). Needs accounts, so opt-in only and a v2 decision |
| Personal data | Only an alias. No email, phone, location or tracking. Nothing leaves the device |
| Clearing browser data | Deletes progress; the app says so on the Keeper screen and nudges a monthly export |
| Delete | Keeper → Delete all data, with confirmation |
| Offline | The single file needs no network at all. The hosted version adds a service worker and web manifest for install and offline caching |
| Needs internet | Nothing in v1, except the first load of the hosted version |

## 11. Intellectual property register

Every visual, character and story element is original. External items are open-source code libraries under permissive licences, public-domain myth and techniques, and uncopyrightable facts. No assets from Duolingo or any other app are used.

| Item | Source | Licence | Attribution | Commercial | Modify | Distribute | Restrictions |
| --- | --- | --- | --- | --- | --- | --- | --- |
| React, React DOM 18.3.1 | Meta, npm | MIT | Keep licence text | Yes | Yes | Yes | None |
| Vite 5, plugin-react | npm | MIT | Build tool only | Yes | Yes | Yes | None |
| vite-plugin-singlefile | npm | MIT | Build tool only | Yes | Yes | Yes | None |
| Vitest | npm | MIT | Dev only | Yes | Yes | Yes | None |
| Playwright | Microsoft, npm | Apache 2.0 | Dev only, not shipped | Yes | Yes | Yes | Notice file if redistributed |
| Fonts | System-installed only | n/a | None | Yes | n/a | Not bundled | None |
| "Mnemos", Lethe, Mnemosyne | Greek mythology | Public domain | None | Yes | Yes | Yes | Check trademark search before public launch |
| Method of Loci, peg systems, link method | Classical and traditional techniques | Public domain methods | Credit in research notes | Yes | Yes | Yes | None |
| Major System | 17th to 19th century (Winckelmann, Feinaigle, Paris) | Public domain method | None | Yes | Yes | Yes | None |
| Dominic System, PAO | Practitioner methods | Methods are not copyrightable | Name O'Brien as originator in docs | Yes | Yes | Yes | Described generically in-app; do not use "Dominic" as a brand |
| Veyra, Wren, Calder, all story text | Original | Project licence (proposed MIT for code, CC BY 4.0 for content) | Project credit | Yes | Yes | Yes | None |
| Illustrated faces, lantern, map art | Original procedural SVG | Same as above | None | Yes | Yes | Yes | None |
| Word pools, Major word list | Original selection of common English words | Same as above | None | Yes | Yes | Yes | None |
| Swahili vocabulary, capitals, element symbols | Facts | Not copyrightable | None | Yes | Yes | Yes | Verify spellings before launch |

Not used on purpose: the acronym SMASHIN' SCOPE (associated with a commercial program), photographs of real people, any third-party character or mascot.

## 12. Testing report and independent review

After three review rounds the independent auditor found no release blockers and scored the prototype 7 of 10 overall. Engineering reached the 8/10 target. The other four categories finished at 6 or 7, and the reasons are listed below rather than argued away.

### 12.1 Automated testing

| Suite | What it covers | Result |
| --- | --- | --- |
| Unit (Vitest, 28 tests) | Curriculum integrity, answer matching, Major decoder, scoring, rules R1 to R6, probe schedule, gates, Lumen cap, streak rest day, MTS bounds, export/import validation, quarterly battery, discard rules | 28 of 28 pass |
| End-to-end (Playwright, 390 px phone) | Onboarding, day 1 baseline, reload persistence, day 2 with delayed recall, palace, faces and Major weeks, all tabs, export, delete, import, desktop layout, horizontal overflow, console errors | Pass, zero errors |
| Auditor scripts | Edge cases: leave and resume, double clicks, timeouts, interference, gate fail and retry, tampered imports, two open tabs, keyboard path | Pass in round 3 |

### 12.2 Review scores by round (1 to 10, target 8)

| Category | Round 1 | Round 2 | Round 3 |
| --- | --- | --- | --- |
| Curriculum and learning | 5 | 6 | 7 |
| Creative and gamification | 6 | 6 | 6 |
| UI/UX and accessibility | 7 | 7 | 7 |
| Technical engineering | 5 | 7 | 8 |
| Overall product | 5 | 6 | 7 |

### 12.3 Defects found and fixed

| Severity | Found | Fixed | Examples |
| --- | --- | --- | --- |
| Critical | 1 | 1 | A malformed backup could brick the app; now fully validated, plus an error screen with a raw-data download |
| High | 5 | 5 | Probes could be retaken after seeing answers; two tabs overwrote each other; levels changed per drill not per session; weak first scores inflated retention; discarding a session bypassed the gate wait |
| Medium | 9 | 8 | Free-recall probes cut at 10 items; scaffolded drills inflated mastery; Major decoder misread words ending in g or c; speed ignored in timed gates; small content pools; quarterly re-test landed on gate days |
| Low | 14 | 12 | Contrast, focus, mobile overlap, delete race, false "Wren has grown" message |

### 12.4 Unresolved after three rounds

| Category | Why it is below 8 | What would raise it |
| --- | --- | --- |
| Curriculum | Early weeks repeat near-identical drills; sessions run about 16 to 28 minutes, not 30 | More drill variety in Months 1 to 3; tune extra rounds to reach 30 |
| Creative | Only Prologue and Chapters 1 to 3 are written in full; 9 chapters are one-line summaries | Write the remaining chapters and Calder ledger fragments |
| UI/UX | Faces can differ only by clothing; no 3D palace walk yet | Stronger face generator; optional 3D palace view |

## 13. Prototype status, how to test, and publication plan

The prototype is a single 295 KB HTML file that runs offline in any modern browser. All 9 exercise templates and all 52 weeks run from the curriculum data. Nothing has been published or pushed anywhere.

### 13.1 What is implemented

| Area | Status |
| --- | --- |
| Onboarding, local profile, alias and sigil, themes | Working |
| Day-1 baseline battery and quarterly repeats (days 91, 182, 273, 364) | Working |
| Full, recovery, review, assessment, gate and free-practice sessions | Working |
| 9 templates: word recall, linked pairs, story chain, palace walk (forward and reverse), digits, Major conversion, names and faces, vocabulary, facts | Working |
| Interference, timed and guided variants | Working |
| Adaptive rules R1 to R10, error diagnosis, coaching cards | Working |
| Spaced delayed-recall probes at 1, 7, 30 (gates to 180) days | Working |
| MTS and five component scores, skill radar, trends, heatmap, baseline comparison | Working |
| Lumen, ranks, 14 achievements, world map, Wren's six-stage arc | Working |
| Palace builder, personal Major System list | Working |
| Export, import with validation, delete, cross-tab safety, error screen | Working |
| Story text | Prologue and Chapters 1 to 3 in full; Chapters 4 to 12 as summaries |
| Service worker and install | In the GitHub Pages build only |
| 3D palace walk, cloud sync, notifications | Not built (later phases) |

### 13.2 How to test

1. Download **mnemos-prototype.html** and open it in Chrome, Edge or Firefox on a phone or computer.
2. Create a profile and complete day 1 (about 20 minutes).
3. Close and reopen the file: progress should still be there.
4. To test next-day recall without waiting, go to **Keeper → Prototype review tools → Advance 1 day**, then start day 2.
5. Use **Jump curriculum to week** to try the palace (week 5), faces (week 9), numbers (week 14) and vocabulary (week 22) weeks.
6. Try **Export backup**, then **Delete all data**, then import the file from the start screen.
7. Leave comments directly on this document, or reply in chat.

Data saved while using the downloaded file stays in that browser on that device.

### 13.3 GitHub publication plan (on hold until you approve)

1. Create a public repository with the source: MIT licence for code, CC BY 4.0 for story and art.
2. Add a GitHub Actions workflow: install, run the 28 unit tests and the end-to-end test, build the static site.
3. Deploy the `dist` folder to GitHub Pages; the service worker makes it installable and offline-capable.
4. Run a trademark check on the name "Mnemos" and verify the content facts flagged in Section 11.
5. Add a privacy page (no data collected), a contribution guide and an issue template for curriculum feedback.

None of these steps will run without your explicit approval.

### 13.4 Version history

| Version | Date | Changes |
| --- | --- | --- |
| 0.2 | 2026-11-01 | Full story: prologue and 12 chapters in long-form prose; 52 weekly tales; 12 gate encounters; 24 side quests tied to real skill; 16 lore entries; 9 characters with staged reveals; Veyra tab rebuilt as Map, Quests, Chapters, People and Lore; all 52 weeks of lessons, drill instructions, onboarding and Wren's dialogue rewritten in plain, warmer language. 31 unit tests and the end-to-end test pass. |
| 0.1 | 2026-11-01 | First prototype; three independent audit rounds. |

**Version 0.3 (2026-11-01), pixel-art game edition.** Built with 5 specialist agents:

- **Faces and portraits:** realistic generated pixel faces (10 skin tones, 21 hair styles, distinct features, matched to names) and 9 named character portraits with moods.
- **World art:** an animated pixel map, a title scene and 14 district banners.
- **Relics:** 76 collectibles across artifacts, ledger pages, trinkets, lost treasures and seals, each with its own icon.
- **The Undercroft:** an endless memory crypt. Keys are earned by real training, with lamp-oil lives, chests, 12 deep treasures and 15 lore tablets.
- **Game interface:** pixel fonts (Pixelify Sans, Silkscreen and VT323, all free for commercial use), dialogue boxes, a status bar, unlock pop-ups and generated retro game sound.

All 73 automated tests and the full end-to-end run pass.
