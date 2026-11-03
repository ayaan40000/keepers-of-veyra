# Workstream B: practice material and tests (draft, Nov 2, 2026)

Written fresh by the memory-champion coach from `docs/CURRICULUM_ADDITIONS.md` section 9 and section 11. Nothing is copied from any course. Folder: `docs/drafts/additions/B/`. No file in `src/` was touched. The plan's folder name `B-material/` was replaced by this folder, as asked.

Each file is UTF-8 JSON with a top-level `"notes"` string (what could not be confirmed). The drill is called **Mind Map** (section 11), so the two map files are named in the plan's `maps-*` style but hold Mind Map material. No real championship is named anywhere.

## Coverage table

| Owner topic | File | Entry ids | Count |
| --- | --- | --- | --- |
| Peg system with a word list | `pegs.json` | `shape[n]` and `rhyme[n]`, n 1 to 10 (single source for A and D; shape list is the shipped one) | 10 shape, 10 rhyme |
| Sound-alike words and homophones | `soundalikes.json` | `entries[].id` as `sa-<word>`, `homophones[]` as `{a,b}` | 98 entries (all 80 words of ABSTRACT and ABSTRACT_MORE plus 18 more), 45 homophone pairs |
| Lists in order: grocery | `grocery.json` | `groc-<item>` | 120 items in 11 aisles, 24 flagged `reservedFor` the Unit Check |
| Lists in order: procedures | `steps.json` | `proc-<name>` | 24 procedures, 202 steps, each with a `key` |
| Memorizing presentations: talk key points | `points.json` | `talk-<name>` | 16 talks, 117 points, each with a `key` |
| Names and Faces event: surnames | `surnames.json` | `surnames[]`, `avoid[]` | 132 surnames in 11 regions, 37 avoid names |
| Mind maps of subject matter | `maps-topic.json` | `map-<name>` | 24 maps, 259 leaves |
| Mind maps of people, Three Strikes | `maps-people-pools.json` | `petKinds`, `petNames`, `hobbies`, `cars`, `foods`, `towns`, `birthdays`, `extensions` | 12 kinds, 39 pet names, 40 hobbies, 40 cars, 41 foods, 39 towns, 60 birthdays, 60 extensions |
| Skimming (Skim, Pick, Keep) | `skim-texts.json` | `skim-<name>` | 12 texts of 151 to 183 words, 5 key points and 8 candidates each |
| Pre and post tests: Lists, Numbers, Talk | `unit-checks.json` | `unit` = `lists`, `numbers`, `talk`; forms `A`, `B` | 3 units, 2 forms each, plus 6 reserve 12-digit numbers |
| Words to Remember event | `wordlists-numbered.json` | `wl-40-a` to `wl-40-d`, `wl-100` | 4 lists of 40, 1 list of 100, 260 distinct words |

Topics that Workstream B does not own (cards, poems, guest sheets, lessons, worksheets, event text) are not here.

## How the builder can use these

- `pegs.json`: V1 pairs drill, cue "4 sailboat", answer is the item. Shape and rhyme have the same 10 numbers.
- `soundalikes.json`: show `soundalike` and `picture` after the answer in Week 23. Notes carry the keyword honesty line.
- `grocery.json`, `steps.json`, `points.json`: V3 sources. Chain or palace items take `text` (or `item`) and `answer` = `key`. Skip any grocery item with `reservedFor` in practice draws.
- `maps-topic.json`: Mind Map `topic` kind. `branches[].label` is shown at recall, `leaves` are typed. Each map carries `"checked": true` and `"verified": false` (see gaps).
- `maps-people-pools.json`: draw first names from `NAMES` and `NAMES_MORE`, surnames from `surnames.json`, then details from here. Workstream C builds the guest sheets from it.
- `skim-texts.json`: `text` has `## heading` lines. `candidates` are the eight sentences to tick, `keyPoints` the five right ones, `keywords` one word per heading (each keyword appears in its key point).
- `unit-checks.json`: Form A before, Form B after. Keep both forms out of practice draws.
- `wordlists-numbered.json`: V4 numbered list.

## Checks run (script, not by hand)

- No peg, numbered-list word or surname equals a word in `CONCRETE`, `CONCRETE_MORE`, `ABSTRACT`, `MAJOR_SINGLE`, `MAJOR_PAIRS` or `NAMES`/`NAMES_MORE`. Pet names do not equal a first name.
- Grocery: 2 of 120 items also appear in `CONCRETE` or the Major pools. That is expected for food. Every Unit Check item is a real pool item.
- Every procedure step and talk point `key` appears in its own text and is unique inside its procedure or talk.
- Numbered lists: no two words in a list share a start or end of three letters, contain each other, or sit within two letter changes.
- Digits: no repeated neighbour, no run of three stepping the same way, no repeated digit pair, no emergency or year-like group. Form A and Form B match on distinct digits and on high digits, with mean step size within 0.35.
- Skim texts: 150 to 250 words, five headings, five key points, eight candidates, every candidate word for word in the text.
- No em or en dashes in any file.

## Gaps and anything unverified

1. **Fact-check done Nov 2, 2026.** The 24 maps and 6 real skim texts were checked against the named source families and corrected (see `docs/drafts/additions/FACTCHECK.md`); each now carries `sourceUrls` and `verified: true`. Soft spots are listed in the notes of `maps-topic.json`.
2. **Surname avoid list** is from memory, not exhaustive and not searched. 12 of its 37 names use a surname that is in the pool; keep each surname to one person per set as a second guard.
3. **Town names** were looked up as Wikipedia titles; three real ones were renamed. A map search for tiny hamlets is still wise.
4. **Rhyme pegs 11 to 20** were left out on purpose (the -teen numbers rhyme with each other).
5. **Parallel difficulty** of the Unit Check forms is by design and by length statistics. It has not been tested on players. Form A and B procedure step lengths differ slightly (6.7 against 7.6 words).
6. The plan asks for 120 surnames; 132 are supplied so the builder can drop clashes.
7. The 100-word list is a game format of our own, since the real event's word count is not confirmed in the plan.
8. Digits for the phone-shaped numbers start each of the first two groups with 0 or 1 so they cannot be valid North American numbers.
9. Homophone pairs depend slightly on accent (for example cereal and serial).
