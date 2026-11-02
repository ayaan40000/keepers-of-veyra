# What the local Qwen is for (plan, Nov 1, 2026)

Qwen 3.8 27B (LM Studio, vision-capable) runs on the owner's PC, free, one model at a time (ComfyUI and Qwen do not fit in RAM together). It writes first drafts. Claude edits every line. Nothing it writes goes in unreviewed.

| # | Job | Why | Output goes to |
| --- | --- | --- | --- |
| 1 | **Look at every shipped picture** (it reads images) and write alt text, flag any with text, gore or a lookalike character | Accessibility needs a text equivalent for each picture; a second pair of eyes for the art rules | `src/data/art.js` alt fields |
| 2 | **Bigger battle pools**: market goods and prices, landmarks, speech points, packing lists, gala guests (invented names, jobs), recipe steps, route directions | The battle scenes draw from lists of 5 to 10 things, so they repeat fast | `src/data/echo.js` |
| 3 | **More Field Guide playbooks** the reviewers asked for: recipes, directions, speeches and toasts, details about people, packing and travel, meeting action items, lines for actors and singers | Honest, short, same shape as the existing eleven | `src/data/fieldguide.js` |
| 4 | **Day-life flavour**: a short line per district for daytime on the map, more Year of Keeping lines (only 4 now), Circle banter | The new day scenes need words; the Year of Keeping repeats a lot | `src/data/story.js`, `afteryear.js` |
| 5 | **Proofreading pass** on all new text: no em dashes, plain words, no promises | Cheap second check before the code checks | report only |

Used for v0.11 (Nov 2, 2026): vault tablets, trial intro and closing lines, and old-tongue words (it degraded into broken JSON on long lists, so it was asked for 8 words at a time and the results were filtered and finished by hand). Real facts (Scriptorium timelines) were written and checked by Claude, not by Qwen.

Rules for its output: short category-sized prompts (about 10 to 35 items), temperature 0.7, frequency penalty 0.8, presence 0.5, `reasoning_effort: none`, JSON replies, then filtered in code (dedupe, length, no dashes) and edited by hand. It makes factual and format mistakes (it once wrote a nonsense Major System example), so facts about memory science or people are always checked against `docs/CHAMPIONS.md`.

Run it with `node scripts/draft-local.mjs jobs.json out.json` after loading the model: `lms load qwen3.8-27b-uncensored-hauhaucs-aggressive-mtp@iq3_xs --context-length 32768 --gpu max -y`, and unload with `lms unload --all` when finished.
