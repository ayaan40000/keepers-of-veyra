# Handoff: the syllabus plan, built (Nov 8, 2026)

Start a new Claude session with: "Read docs/HANDOFF_SYLLABUS_PLAN.md and continue."

## What happened
The owner asked for the syllabus plan (`docs/SYLLABUS_PLAN.md`, from the audit in `docs/SYLLABUS_AUDIT.md`) to be built through 1.8 and pushed live, with full agency on the six open decisions. Each release is its own commit with a CHANGELOG entry. Unit tests (481) and the e2e journey ("errors: none") pass at 1.8.0.

## Owner decisions taken (with the plan's recommendations)
1. Wardens' Road: built (1.6), opens at the Month 5 gate, tablets by calendar week.
2. Spoken Numbers audio: allowed only inside the Road, off by default, device offline voice only. Recorded in `CLAUDE.md`.
3. Pronunciation: "Hear it" on the review screen after recall only, offline voice only.
4. Ledger limits: 50 books, 5,000 cards, 400 characters a side; Own Text limits unchanged (no phone check done yet).
5. Names: all kept as proposed.
6. New canon: added to the codex (`src/data/lore13.js`) and the lore guide.

## Built
| Release | What |
| --- | --- |
| 1.2.0 | The earlier 1.2 work, committed as it was. |
| 1.2.1 | Fixes F1 to F9 (honest lesson wording, objectives match drills, probe sampling across the set, top-up Lumen, joke skill, photosynthesis answer). |
| 1.3.0 | Keeper's Ledger (6 book kinds incl. Joke Box, Travellers' Satchel, Project; starter books), 90-day gaps and the 70% bar from 30 days, Old Echoes in the Long Vigil, new canon. |
| 1.4.0 | The Gloss (54 prompts), finance set (15 formulae, 13 worked numbers, unit-checked), Merchants' Marks, Evening Round, "which came first" date reviews, talk and project lessons. |
| 1.5.0 | Turning stones (15 Spanish, 10 Turkish verbs) as a drill and starter books; +421 words, +197 first names, +88 surnames (filtered). |
| 1.6.0 | Wardens' Road: strict events (numbers, words, binary, invented dates, abstract images, spoken), journey manager, PAO / 3-digit builder, card images, flash drills, Book of Slips, Long Sunday, Warden of the Road title. |
| 1.7.0 | "Hear it" pronunciation; Road named in M5, weeks 22, 44, 46. |
| 1.8.0 | Review fixes, docs, release. |

## Not built yet (honest list)
- Pools: the targets (2,000 words, 1,000 first names, 1,000 surnames) are not reached; about 1,000 words, 307 first names and the old plus 88 surnames exist. The local Qwen can draft more once ComfyUI is idle; always run `scripts/pool-filter.mjs`.
- French and German gender, more verb tenses: need native-speaker review first.
- The Ledger does not yet open the session itself from week 5 (the due cards show on Today instead); the Long Gallery shelf is drawn on the Ledger page, not in the palace room.
- The Road is its own screen; it does not yet replace the scene and top-up rounds on chosen days.
- Talk rehearsal is a lesson, not a timer screen. Recipes rely on the existing recipe scene.
- Native-speaker check of the Spanish and Turkish verb tables; a second human checker for the finance set (a unit test checks the arithmetic, not the definitions).
- A phone performance check before raising Own Text limits.
