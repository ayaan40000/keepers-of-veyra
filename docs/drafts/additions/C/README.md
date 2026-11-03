# Workstream C: Poems, cards and people (draft, Nov 2, 2026)

Written for `docs/CURRICULUM_ADDITIONS.md` section 9 (Workstream C) with the section 11 owner decisions applied: the drill is called Mind Map, everything ships in 1.1, no real championship is named. Nothing here touches `src/`. All files are UTF-8 JSON, each with a top-level `notes` string.

## Files and what the matrix assigns to C

| File | Matrix line | What is in it | Count |
| --- | --- | --- | --- |
| `poems.json` | Poetry event | `poems[]` (id, title, author, lines, lineCount, origin, year, edition, difficulty, checked, sourceUrls, variants, plus pdStatus and authorDied for public domain), and `learnExamples` (one worked stanza method per difficulty 1 to 5, palace and chain) | 15 original, 14 public domain, 29 in all |
| `card-images.json` | Speed Cards and Double Deck O'Cards (card images) | the "World and Count" rule in three sentences, 52 cards `{card, suit, rank, image, rule}`, a learning plan, a make-your-own note, a Deck Run route guide with a worked example, the honest note on cards | 52 images |
| `deck-formats.json` | Speed Cards and Double Deck practice formats | ladder (10 to 52 cards, suggested study and recall seconds, stops at two cards a stop), Deck Run and Double Deck in our words with scoring and advice, a four-week way in, plain text for the Event Hall | 2 formats |
| `strikes-people.json` | Three Strikes You're Out (guest sheets) | 8 sheets of 6 invented people (name, birthday, town, pet, hobby, car, food, four-digit extension), `keys` for the answer matcher, five difficulty `levels`, the Mind Map people-kind shape | 8 sheets, 48 people |

Speed Numbers, Names and Faces and Words to Remember are not assigned to C. The event copy for cards and poetry belongs to Workstream D, which should read `deck-formats.json` and `poems.json`.

## Poem counts by line length

| Lines | Original | Public domain |
| --- | --- | --- |
| 4 | 3 | 1 |
| 6 | 3 | 1 |
| 8 | 4 | 3 |
| 12 | 3 | 3 |
| 14 (practice only) | 0 | 2 |
| 16 | 2 | 4 |

The plan asks for roughly equal numbers at 4, 6, 8, 12 and 16 lines. Public-domain 6-line poems are few (one), and two 14-line poems (Remember and Sonnet 18) are practice only. Originals sit under invented poets (Ilsabet Corrow, Fennimore Dray, Tavish Lorn, Odile Harrowmere, Marit Ashvane, Brannoc Pell, Sorrel Wick, Isaure Fenn). Public-domain poets all died before 1900 (Dickinson 1886, Stevenson 1894, Rossetti 1894, Longfellow 1882, Hunt 1859, Herrick 1674, Jonson 1637, Tennyson 1892, Shakespeare 1616), and every poem was first printed before 1930. None is a translation.

## Fact-check status (Nov 2, 2026)

All public-domain texts were compared by script against at least two editions (Project Gutenberg, Wikisource transcriptions of named editions) and corrected. Four poems were dropped because editions disagree on the words or are unstable (Blake "Eternity" and "The Sick Rose", Landor, Carroll's crocodile). Fixes to the draft texts: Dickinson dates (1896, not 1891 or 1894), Stevenson ("Rivers", "countryside", a comma in "In summer,"), Rossetti "Who has seen the wind?" (1872 wording), Herrick (colon, line 2), Jonson (three small changes), Shakespeare 18 (one edition followed throughout). Where editions differ the entry lists the alternative in `variants`. Public-domain status: all authors died before 1900 and every text was published before 1930. Invented poet names and the 48 names and 48 towns were searched; one poet surname (Ellowen) and two towns were replaced. Details are in `docs/drafts/additions/FACTCHECK.md`.

## Wiring notes for the builder

- Poems go into a pool for the `poem` template; difficulty maps to length (1: 4, 2: 6 to 8, 3: 8 to 12, 4: 12 to 16, 5: 14 and 16). Strict mode needs the exact lines, so do not trim or retype them. The two em dashes in "The Swing" are the poet's own.
- `lineCount` is stored so probes can use the first 10 lines.
- Cards: the code is rank then suit letter (`10H`). The image list is a help screen in 1.1 only (players keep their own pictures on paper, no saved record).
- Echo scenes for Double Deck use `resolve` 3, as the plan sets, and the plain drill ends at the first miss.
