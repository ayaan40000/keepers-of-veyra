# Workstream E: Real-world applications (draft, Nov 2, 2026)

Written for the 1.1 release. Nothing here touches `src/`, no local model was used, nothing is committed. All files are UTF-8, plain, warm language, no em dashes and no en dashes. Everything was written from memory with no web access, so every real fact is marked `"verified": false` (or `true` only where `docs/CHAMPIONS.md` already records the fact-check). A person with web access must check each one before it reaches players.

## Files

| File | What it holds |
| --- | --- |
| `speedmath.json` | The honest verdict, the Mental Reckoning drill (`calc`), the Counting House Reckoning trial, 9 strategies, tables (squares 1 to 30, cubes, powers of two, primes, fractions), 20 constants and conversions, 16 formulas, generated samples |
| `speedmath-gen.mjs` | Reference generator and scorer for the drill. A self-check recomputes 14,400 generated sums with no problems |
| `dates.json` | 63 real dates in 9 themed sets of 7, Year Pictures method, drill variant, the Hall of Years trial, Year Round for the Event Hall, and the sets in the exact shape of `TIMELINES` |
| `trivia.json` | 101 trivia items: science 20, geography 21, history 14, art 24, language 22, with the Fact Round for the Event Hall |
| `pools.json` | Six study pools: elements 45, word roots 40, atlas capitals 53, music theory 42, chess opening first moves 21, anatomy terms 20 |
| `own-text.json` | The Your Own Text tool: recommendation, screens, chunking, cue ladder, checker, scheduling, saved data, migration, tests, safety, UI copy |
| `fieldguide-e.json` | 10 Field Guide playbooks in the existing shape |

Poems are Workstream C's (33 poems, `m-stanza` is A's). E adds only the method page `longverse` and the Your Own Text path. D's pages (`lists`, `digits`, `senses`, `rhythm`, `interview`, `maps`, `reading`, `recall`, `talk`, `toolbox`) and the existing ids are not touched or duplicated.

## Coverage table

| Application | Field Guide | Drill | Trial | Event Hall | Your Own Text | Unlocks at | Scoring | Saved data and migration |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Speed math | `reckoning` (M8), alongside existing `speedmath` | New `calc` drill, Mental Reckoning (M5): see mode and hold mode, levels 1 to 6 | New trial `reckoning`, Counting House (M8) | None (optional Sum Run later) | No | Drill M5, page and trial M8 | Final answer exact, accuracy first, steps are feedback only, time shown as a personal best only at 90 percent or higher, no skill or Lumen change | None. New recall mode `numeric`. Whitelist `calc` in `store.js` |
| Dates and events | `dates` (M4) | `facts` variant `src: 'dates'` with ask event, year or order (M5) | 9 real sets appended to `TIMELINES`, plus new trial `year_hall` (M7) | Year Round (M10) | No | M4, M5, M7, M10 | Year right only with every digit, no off-by-one credit. Trial 6 of 7 at once, 5 of 7 after 7 days | None for drill and trial. Event Hall adds key `dates` to `p.events.best` |
| Trivia | `facts` (M7) | `facts` variant `src: 'trivia'`, level 2 first (M7) | None | Fact Round (M10) | No | M7, M10 | Cued matcher plus accepted variants, exact digits for numbers, facts skill credit | None. Event Hall adds key `facts` to `p.events.best` |
| Poems | `longverse` (M2) | C's Poem drill | None | C's Poem Page | Yes, your own poem | M2 for the page, tool at M1 | Tool scoring below | `p.own` |
| Treasured and sacred texts | `treasured` (M1) | None | None | None, texts are private | Yes, the whole point | M1 | Gist, Close or Exact checker, or Said aloud with player marks. No reward | `p.own`, SCHEMA stays 2 |
| Countries and capitals | `atlas` (M7) | `facts` variant `src: 'atlas'`, one palace room per region | None | Can feed Fact Round | No | M7 | Cued matcher | None |
| Periodic table | `exams` (M7) | `facts` variant `src: 'elements'` | None | None | No | M7 | Cued matcher | None |
| Vocabulary roots for exams | `exams` (M7) | pairs variant `src: 'roots'` | None | None | No | M6 or M7 | Cued matcher | None |
| Anatomy terms | `exams` (M7) | ordered palace variant `src: 'body'` | None | None | No | M7 | Ordered recall | None |
| Music theory lists | `music` (M7) | `facts` and ordered chain variant `src: 'music'` | None | None | Yes, lyrics or markings | M7 | Cued and ordered | None |
| Chess openings | `chess` (M7) | `facts` variant `src: 'chess'` with a move normaliser | None | None | Yes, repertoire lines | M7 | Cued with a move normaliser | None |
| A speech or a role in a play | D's `talk` and the existing `lines`, `toast` | None | None | None | Yes (role mode later) | M1 for the tool | Close checker | `p.own` |

### Why these were picked from the owner's list

- **Picked for the methods.** Countries and capitals, the periodic table and word roots are cue-and-answer sets, which pictures and rooms handle well and the game already teaches (Week 27). Music theory and chess are short fixed lists and move orders, a good fit for chains. Anatomy terms are ordered lists and names students are really asked to learn.
- **Not made new drills.** A speech or a role in a play needs word-for-word learning, which is exactly what Your Own Text does, so it is a use of the tool and not a separate feature. "Vocabulary for exams" overlaps the existing vocab drill, so only the genuinely new piece (word roots) is added, with no test names and no promises.
- **Left out.** Sports rules and statistics (they change, and checking is heavy), dates of private events, and any person's private details.

## Scoring rules in one place

- Accuracy comes first everywhere. Time is shown only as a personal best at a high accuracy, and never lowers a score.
- Drills that use the existing facts and ordered modes count toward the facts skill like any other, and go to `p.sets` for the 1, 7 and 30 day probes.
- Mental Reckoning, the new trials and the Event Hall rounds never change skill estimates (trial and Event Hall rule). Your Own Text never changes anything, gives no Lumen, and does not use battles.
- Study and recall screens stay still, with no sound except the one soft submit sound.

## Data and migration summary

| Change | Where | Migration |
| --- | --- | --- |
| `p.own` (Your Own Text) | `newProfile`, `migrate`, `validateProfile` in `store.js`, export and import tests | `migrate()` creates `{ v: 1, texts: [], history: [] }` when missing or malformed. SCHEMA stays 2 |
| `p.events.best.dates` and `.facts` | Only if the Event Hall record from the main plan is built | Add the two keys with `null` in `newProfile` and `migrate()` |
| New template `calc` | `TEMPLATE_SKILL`, `TEMPLATE_NAME`, `BRIEF`, genItems, store whitelist | None |
| New trial ids `year_hall`, `reckoning` | `TRIALS` in `trials.js` | None. `validateProfile` reads `TRIALS[k]` so they are whitelisted automatically. Ids are permanent once shipped |
| New prize items `tr_year_tablet`, `tr_tally_stick` | `items.js`, art in `tools/asset-studio/prizes.py` | None. Ids are permanent |
| `advanceSchedule()` helper | `core.js`, used by `applyProbe` and Own Text | None. Curriculum behaviour must be unchanged (add a test) |
| Own Text normaliser | New `src/engine/owntext.js` | None. The old `normalize()` returns an empty string for any non-Latin text, so it must not be reused |

## What I could not verify (no web access)

1. **Every date, trivia item, pool entry, constant and conversion.** All are standard and widely documented, but each carries `"verified": false` until a person with web access checks it against an encyclopaedia or the named source. The least certain: the wording for 1991 (the World Wide Web "announced to the public", since CERN also dates its public release to 1993); the conventional dates 476 and 1337; the NZ 1893 "first self-governing country" wording; Everest "about 8,849 metres"; "54 UN members in Africa"; the capitals of Tanzania (Dodoma) and the Netherlands (Amsterdam), which have a seat of government elsewhere.
2. **Unicode ranges** for Arabic marks and Hebrew points in the Own Text checker, and the behaviour of `Intl.Segmenter` on every script.
3. **Faith traditions:** the sentences naming particular traditions were removed in the fact-check (Nov 2, 2026). The `treasured` page now makes only neutral statements.
4. **Whether real memory competitions have a dates event** and in what form. Year Round is a Veyra invention and the game does not claim otherwise.
5. **Rounding rules** for the approximate constants (written into each entry). Compare each with a published reference.
6. Names and spelling variants of the chess openings (some have more than one name).

## Decisions for the owner

1. **Ship no scripture or other treasured text** and build only the Your Own Text tool (my strong recommendation). Yes or no.
2. **Your Own Text gate.** M1 (my pick), or later.
3. **Texts in the backup.** They go in the whole-profile backup by default. Do you also want a separate "Export my texts only" file, and a warning when an import would replace texts?
4. **No rewards from Your Own Text** (my pick), or a small capped Lumen later for a delayed check that held on a long text.
5. **Role mode** (lines of a play with other roles as cues): in 1.1 or later.
6. **Sacred-text page review.** Resolved: the tradition sentences were removed.
7. **Speed math.** Accept that it is a practice drill with no skill credit and no Event Hall slot, and that the Reckoning trial needs a new prize item and art. Or skip the trial.
8. **New trials and prizes.** `year_hall` and `reckoning` each need a prize item and art (permanent ids `tr_year_tablet`, `tr_tally_stick`, and art ids `trial_year_hall`, `trial_reckoning`). Approve, rename or drop.
9. **Event Hall rounds.** Year Round and Fact Round are invented Veyra contests. Keep them, or leave them out of the Hall.
10. **Real material rule.** All 63 dates and 101 trivia items name real public history and public works. They fit the owner's Nov 2 rule, and none names a private person. Please confirm that people appearing as makers of public works (painters, authors, composers, inventors, explorers) are fine.
11. **Anatomy terms.** Include as study vocabulary with the "not health advice" line, or leave out.
12. **Chess and music.** Include, or leave out as too niche.

## Size estimate (S under a day, M one to three days, L a week or more)

| Piece | Size |
| --- | --- |
| Wire the 9 date sets into `TIMELINES` and the `year_hall` trial (new `ask: 'year'` branch, prize item, art) | M |
| Dates drill variant (event, year, order) and Year Round | M |
| Trivia and the five study pools as facts and ordered variants, with the chess normaliser | M |
| Mental Reckoning drill, `numeric` recall mode, tests, the Reckoning trial | M to L |
| Field Guide pages (10) and wiring | S |
| Your Own Text: chunker, Unicode normaliser and checker, scheduler (shared `advanceSchedule`), shelf and learn and check screens, Today card, validation and migration, import tests, e2e journey in three scripts | L |
| Fact-check pass by a person with web access (63 dates, 101 trivia, pools, constants) | M |
| Total content, mostly done in this folder | content S, build about L |

Order I would build in: dates and trivia (content only, small risk), the Field Guide pages, Mental Reckoning, then Your Own Text last because it has the most new surface (a new record, a new checker and a new screen). Run `npm test` and `node tests/e2e.mjs` after each, bump `package.json` once for 1.1, and add a CHANGELOG entry. No push without approval.


## Fact-check status (Nov 2, 2026)

Dates, trivia, pools, constants, formulas and the Field Guide pages were checked and now carry `sourceUrls` and `verified: true`. See `docs/drafts/additions/FACTCHECK.md`.
