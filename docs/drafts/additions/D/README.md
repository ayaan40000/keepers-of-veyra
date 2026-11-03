# Workstream D: Field Guide, worksheets, Event Hall copy and claims audit (draft)

All text is draft, for the builder to wire in. Nothing in `src/` was changed. Citations were checked by the fact-check editor on Nov 2, 2026 (`verified: true` with `sourceUrls`). Sleep after learning is deliberately left out everywhere (wording not verified). The drill is called Mind Map. No real championship, athlete or organisation is named. All people, talks and lists in examples are invented.

## Files

| File | What it holds |
| --- | --- |
| `fieldguide-add.json` | Nine playbooks in the existing shape (`lists`, `digits`, `senses`, `rhythm`, `interview`, `maps`, `reading`, `recall`, and an extended `talk` that replaces the text of the existing `talk` id) plus the `toolbox` page ("What things are called", 15 entries with the Mnemos weeks) |
| `worksheets.json` | Five printable sheets in our own layout, no saved data: Anchors and Keywords (two worked examples), My Image Library Builder, Map a Topic, Map the People, Before and After |
| `your-methods.json` | The Your Methods card for Progress: intro, caption, per-method lines for ten methods, "why a few attempts is not much to go on", low-data rule, a "never say" list |
| `events.json` | Event Hall rules and copy: hall intro, practice-only and rival rules, pace mode, results templates, ladder wording, and seven events (Face Round, Number Rows, Deck Run, Poem Page, Word Numbers, Three Strikes, Double Deck) each with rules, instructions, scoring, ladder, results text, advice, not-confirmed and honest lines |
| `claims-audit.json` | first-pass findings with a status each, plus second-pass findings for B, C and E, a scope list, and the recheck list with results |

## Coverage table (plan section 9, Workstream D, and the coverage matrix)

| Topic or event | Where in D |
| --- | --- |
| Toolbox glossary ("What things are called") | `fieldguide-add.json`: `toolbox` |
| Lists in order (grocery, procedures, talk points) | playbook `lists`; worksheet `anchors-keywords` (grocery and talk examples) |
| Anchor and keyword worksheet | `worksheets.json`: `anchors-keywords` |
| Remembering numbers (image, Major, rhyme, rhythm, own library, chunking) | playbook `digits`; worksheet `image-library`; playbook `rhythm` |
| Presentations, Roman Room for work talks, rhythm, one-page map as a second copy | extended playbook `talk` |
| Job interview | playbook `interview` |
| Mind maps (own, people, subject matter) | playbook `maps`; worksheets `map-topic` and `map-people` |
| Skimming (Skim, Pick, Keep), retrieval over rereading | playbook `reading` |
| Maximizing recall (Check Before You Look) | playbook `recall` (sleep left out on purpose) |
| Five senses | playbook `senses` |
| Memory rhythms | playbook `rhythm` |
| Learning styles reframed, "Your Methods" | `your-methods.json` |
| Before and after, with the practice-effect note | worksheet `before-after`; `your-methods.json` caption |
| Names and Faces event | `events.json`: `faces` (Face Round) |
| Speed Numbers event | `events.json`: `numbers` (Number Rows) |
| Speed Cards event | `events.json`: `cards` (Deck Run) |
| Poetry event | `events.json`: `poem` (Poem Page) |
| Words to Remember event | `events.json`: `words` (Word Numbers) |
| Three Strikes You're Out event | `events.json`: `strikes` (Three Strikes) |
| Double Deck O'Cards event | `events.json`: `decks` (Double Deck) |
| Claims audit | `claims-audit.json` |

## Placeholders the story workstream fills

`{HALL_NAME}`, `{TIER_NAME}`, `{TIER_NUMBER}`, `{RIVAL}`, `{RIVAL_RESULT}`, `{RIVAL_LINE_BEFORE}`, `{RIVAL_LINE_AFTER}`, `{CONTEST_NAME}`. Result tokens: `{score}`, `{total}`, `{best}`, `{level}`, `{time}`, `{rows}`, `{strikes}`. D writes only the practical rules, instructions, results and ladder wording. Rival lines must never shame, rush or taunt the player (see audit).

## Builder notes

- Extra keys `evidence`, `source`, `verified`, `formatInspiration` and `notConfirmed` (the figures) are for builders and reviewers. Do not show `formatInspiration`, any source naming a real organisation, or any figure from a real contest to players.
- The `talk` entry sets `"replaces": "talk"`: same id and unlock (M2), new text. Existing playbook ids and the twelve `try-m` ids are untouched.
- The playbooks use a few extra sentences in `steps`, but the shape is unchanged.
- Worksheets are plain `lines` for the browser print dialog. Do not add fields that store answers (that would be a new record and needs owner approval).
- Peg examples (2 is a swan, 1 is a bun) must match B's `pegs.json` and A's week 24 cards once B exists.
- The week numbers in `toolbox` follow the plan and have not been checked against `curriculum.js`.

## Audit status

The first-pass audit (36 findings) was applied by the fact-check editor on Nov 2, 2026 and extended to B, the rest of C and E. Each finding in `claims-audit.json` now carries a status. See `docs/drafts/additions/FACTCHECK.md` for the full record.
