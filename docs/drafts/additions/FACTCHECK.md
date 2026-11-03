# Fact-check of the new course material (A to E)

Date: Nov 2, 2026. Editor: fact-check pass with web access. Scope: `docs/drafts/additions/A`, `B`, `C`, `D`, `E`. The `story/` folder, `src/` and the plan file `docs/CURRICULUM_ADDITIONS.md` were not edited. Nothing was committed.

## How "verified" was decided

`verified: true` means the editor checked the entry on Nov 2, 2026 and the entry now has a source (`sourceUrls` or a named source). The methods differ by material, and the limits matter:

- Citations (A and D): searched on the web and compared with DOI, PubMed, publisher or archive records for authors, year, journal, volume and pages, and for what the study found.
- Dates (E): every one of the 63 years was looked up by script in the English Wikipedia article for the event (62 found at once, the 63rd, Columbus 1492, after fixing the article title). Day-level details are standard history.
- Elements and capitals (E): compared by script with the Wikipedia lists (elements 8 to 92 matched; elements 1 to 7 could not be parsed and were read by eye; all 53 capitals found).
- Speed math (E): tables recomputed (squares, cubes, powers of two, primes); constants compared with the SI Brochure and NIST and with Python's math library; strategy sums recomputed.
- Poems (C): compared line by line, by script, with at least two editions (Project Gutenberg and Wikisource transcriptions of named editions).
- Topic maps and real skim texts (B), trivia, word roots, music theory, chess openings and anatomy terms (E): read entry by entry against the named source families and reference knowledge. Many publisher sites (Britannica, USGS, NOAA, UNESCO) block automated fetching, so these were not opened line by line. No error was found in the trivia, roots, music, chess or anatomy lists, but they rest on editor review, not on a lookup of every line.
- Names and towns: looked up as English Wikipedia titles. That finds well-known people and real places with articles, not every private person or hamlet.

## Citations (task 2): all checked

All confirmed as real, with these corrections and notes:

| Citation | Result |
| --- | --- |
| Pashler, McDaniel, Rohrer, Bjork 2008, Psychological Science in the Public Interest 9(3), 105-119 | Correct. Found no adequate evidence base for using learning-style assessments, and almost no studies that tested the matching idea. Wording tightened. |
| Tulving and Thomson 1973, Psychological Review 80(5), 352-373 | Correct. It supports "a cue works when it was part of the original memory", not "more senses help". The sensory-detail claim was downgraded from moderate to weak. |
| Bower and Clark 1969, Psychonomic Science 14(4), 181-182 | Correct. Stories linking a list of ten words improved ordered recall. |
| Slamecka and Graf 1978, J Exp Psychol: Human Learning and Memory 4(6), 592-604 | Correct, but it is about items people generate themselves, not personal pictures. Now cited as a related finding only; evidence weak. |
| Miller 1956, Psychological Review 63(2), 81-97; Cowan 2001, Behavioral and Brain Sciences 24(1), 87-114 | Correct. |
| MacLeod, Gopie, Hourihan, Neary, Ozubko 2010, JEP:LMC 36(3), 671-685 | Correct (confirmed in citing literature; the journal page itself was not retrieved). Supports saying aloud only, not rhythm. |
| Dunlosky et al. 2013, Psychological Science in the Public Interest 14(1), 4-58 | Correct. Practice testing and distributed practice rated high; keyword mnemonic rated low. |
| Karpicke and Blunt 2011, Science 331, 772-775 | Correct. 200 students; retrieval practice beat concept mapping at a one-week test. |
| Nesbit and Adesope 2006, Review of Educational Research 76(3), 413-448 | Correct, but the draft said maps give "modest, mixed" benefits. The meta-analysis (55 studies) found maps helped on average with large differences between studies. Text and evidence lines changed. |
| Roediger and Karpicke 2006, Psychological Science 17(3), 249-255 | Correct. Restudy won at 5 minutes; testing won at 2 days and 1 week. |
| Rayner et al. 2016, Psychological Science in the Public Interest 17(1), 4-34 | Correct. Faster reading costs comprehension. |
| Bellezza 1981, Review of Educational Research 51(2), 247-275 | Correct. A review of mnemonic devices, so it describes peg systems rather than proving a size of effect. |
| Underwood 1957, Psychological Review 64(1), 49-60 | Correct. It is about interference between learned lists; applying it to peg reuse is an inference, now stated. |
| Cepeda et al. 2006, Psychological Bulletin 132(3), 354-380 | Correct (839 assessments, 317 experiments). |
| Melby-Lervag and Hulme 2013, Developmental Psychology 49(2), 270-291; Simons et al. 2016, Psychological Science in the Public Interest 17(3), 103-186 | Correct. |
| Dresler et al. 2017, Neuron 93(5), 1227-1235 | Correct: 51 men, 40 sessions of 30 minutes over six weeks. Already limited to "one kind of list" in the texts; the clause was added to the lists and talk playbooks. |
| Farrand, Hussain, Hennessy 2002, Medical Education 36(5), 426-431 | Correct. 50 medical students, a 600-word passage, a mind-map advantage at one week; motivation was lower in the mind-map group. Now cited with that scale. |
| Rhetorica ad Herennium, Cicero De Oratore, Quintilian | Real. Dates are approximate (Ad Herennium given as 86 to 90 BCE in different sources), so the text says "first century BCE". Cicero 55 BCE and Quintilian about 95 CE kept. Nothing claims the name "Roman Room" comes from Rome. |

## Task 1: the D claims audit (36 findings) plus a second pass

Every finding now has a status in `D/claims-audit.json` (fixed, closed, open, deferred). Highlights:

- Bicycle brake procedure replaced by repotting a houseplant.
- Rhythm, image-library timing, "ten minutes is enough", "good test of calm", Roman Room name origin, "rhythm and rhyme as much as pictures", "even a few wrong guesses help": removed or softened as the audit asked.
- Real-contest facts (rows of 20, answer times, strike counts, point rules, five-minute study, coloured backs) were removed from player text in A, C and D. A web search could not confirm them and showed that real formats change from year to year. All rules shown are Mnemos rules.
- Peg lists unified: A, B and D now share the shipped shape list and one rhyme list (B's old shape list and the loose "oven" rhyme are gone).
- "Memory Map" appears nowhere in A to D. The plan file still has it in sections 1 to 10 (outside this pass).
- 11 findings stay open for the owner, the story workstream or the builder (listed in the audit file): rival lines (story), the plan's section 11 note, the 15 original poems (owner decision), builder display rules, duplicate dates across sets, the partial surname scan.

## B (task 3, task 5)

- Pegs: see above.
- Maps (24): all facts hold. Changed: Steam to Nitrogen; inner-core leaves no longer repeat the outer core; chloroplasts labelled plant cells; Vinson Massif (a peak) to Ellsworth Mountains; orchestra centre renamed Instruments; Shakespeare grouping note (modern labels; Cymbeline is a tragedy in the First Folio; Pericles is not in it).
- Real skim texts (6): corrected the neap-tide section and the paper-machine length. Fresnel dates (1820s, Cordouan 1823) agree with standard histories.
- Grocery: "popsicle" (a trademark) replaced by "ice pop".
- Towns: Heronsgate, Nettlecombe, Tarnaby were real; renamed Heronsfold, Nettlebrook, Tarnwick (also in the skim text id and title).
- Surname avoid list: a Wikipedia title scan of first name plus surname pairs was rate-limited after about 180 of 11,880 pairs. The 132 hits found were added to the avoid list. The scan is incomplete; the builder rule (never join a listed name, one person per surname per set) still matters.

## C (tasks 4, 5)

Public-domain poems were compared by script with at least two editions. Errors found in the draft texts, all fixed:

- Stevenson: "River" should be "Rivers", "country-side" should be "countryside", "In summer quite" needs a comma.
- Rossetti, Who Has Seen the Wind: 1872 text has "thro'." and no comma after "trembling" or "heads"; "through" is listed as a variant.
- Dickinson: first printed in Poems, Third Series (1896), not 1894 (or 1891). Both poems match that edition.
- Herrick: colon, not semicolon, at the end of line 2. Jonson: three small changes (title To Celia). Rossetti, A Birthday: matches the 1901 Poems; the 1862 text differs in four places (listed). Shakespeare 18: punctuation differs between editions; now follows Project Gutenberg 1041 exactly, marked practice only, as is Remember (14 lines).
- Dropped (editions disagree on the words or are unstable): Blake "Eternity" and "The Sick Rose", Landor "Dying Speech" (also "On His Seventy-fifth Birthday"), Carroll "How Doth the Little Crocodile". 14 public-domain poems remain.
- Public domain: every author died before 1900 and every text was published before 1930; none is a translation. The strict scorer can use the new `variants` field.
- Originals: seven of the eight invented poet names found no match in a web search. "Marit Ellowen" matched a living Irish writer and was renamed Marit Ashvane.
- Guest sheets: no name has a Wikipedia article. Two towns were real (Marlcombe, Wickstead) and were renamed Marldale and Wickfold. The 52 card images contain no brand or real person.

## E (scope update)

- Dates: 63 of 63 years confirmed. Three years appear in two sets (1869, 1914, 1991): noted for the builder. Hooks and Major words were rechecked against the shipped MAJOR_PAIRS.
- Trivia (101): no wrong item found. Elements: all 45 correct. Capitals (53): correct. Word roots (40), music theory (42), chess first moves (21), cranial nerves and carpal bones: correct. One note fixed (interval pegs: rhyme pegs stop at 10).
- Speed math: tables, constants and strategies correct. Constants link to the SI Brochure and NIST.
- Faith traditions: the six sentences about how particular traditions learn texts were removed (they could not be sourced or checked by a member of each tradition). The `treasured` page is now minimal and neutral, with an empty `traditions` array.

## What was dropped

Four poems (above); six tradition sentences; every real-contest figure in A, C and D; the unsupported claims listed in the audit.

## Not done or not possible

- Dresler, Maguire and the other CHAMPIONS.md facts were not rechecked beyond the Dresler details above.
- Several publisher pages (Britannica, USGS, NOAA, UNESCO) blocked automated fetching; those entries rest on editor review.
- The surname scan is partial. Tiny hamlets and private people who share a name cannot be ruled out by a title lookup.
- `docs/CURRICULUM_ADDITIONS.md` and `src/data/fieldguide.js` (GUIDE_CLAIM) still need the edits named in the audit; they are outside this pass.
- Story files were not read or edited.

## Main sources

DOI and PubMed records for each citation (listed in `sourceUrls`); Project Gutenberg 25609 (A Child's Garden of Verses), 76703 (Sing-Song), 1041 (Shakespeare's Sonnets); Wikisource transcriptions of Demeter and Other Poems (1889), The Belfry of Bruges (1845), Goblin Market and Other Poems (1862), Rossetti Poems (1901), Poems Third Series (1896), the Oxford Book of English Verse; English Wikipedia articles and lists for dates, elements and capitals; SI Brochure (bipm.org) and NIST SP 811; NASA planetary fact sheets; NOAA, OpenStax, Folger and the US National Archives for the maps.
