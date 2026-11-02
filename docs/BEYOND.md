# Beyond Mnemos: the Keeper's Field Guide (design note, not built yet)

Status: planned, owner request of Nov 1, 2026. Do not build until the owner says so.

## Why this matters

The year of drills is the practice. The real reward is being able to remember things in your own life that Mnemos never trained: a new language, a wedding speech, a poem, the names at a new job, a talk without notes. The conclusion of the year should say this plainly and show the player how to do it.

This fits the story. Calder's last lesson is "Not how to keep everything. How to choose." The Field Guide is how the player keeps the things they choose.

## Honesty rules (same as the rest of the app)

- Memory techniques help with real material only when you use them on purpose. Research on memory training shows the drills themselves do not make everything easier to remember. The guide must say this in plain words and must not claim a general improvement in memory, intelligence or health.
- The guide teaches methods. It does not promise results for exams, careers or medical conditions.
- No advice on memorising passwords, bank details or other secrets. Point people to a password manager instead.
- Plain, warm language, no em dashes.

## Where it appears

1. **The conclusion.** After the Epilogue, on the first Year of Keeping day, Wren hands the player "The Keeper's Field Guide" (a short story beat, then the guide opens). Her line, roughly: "The city was only practice. Everything you learned here works on anything you want to keep. Here is how."
2. **Always available afterwards** under Keeper (or Palaces) as "Field Guide". It should also be readable earlier, unlocked chapter by chapter as each method's gate is passed, so players see the point of each month while they train. The full guide and its closing letter open at the end of the year.
3. Optionally, a relic: "The Keeper's Field Guide", a book in Calder's hand, earned by passing the last gate (learning-based, so it follows the reward rule).

## The core recipe (taught first, applies to everything)

Every real-world use follows the same five steps the year taught:

1. **Choose.** Decide what is worth keeping and how exact it must be (word for word, or the gist).
2. **Cut it into pieces.** Seven to ten pieces at a time, the way the drills were sized.
3. **Turn each piece into a picture** (Month 1), and **put it in a place** (Month 2) or **link it to the next one** (story or chain).
4. **Check yourself without looking**, then fix the weak pictures (Month 9: catch the false ones).
5. **Come back later**: the next day, a week later, a month later (Month 8). This step is the one people skip, and it is the one that makes it last.

## Playbooks (one page each, written in the guide's voice)

Each playbook names the months it draws on, gives a worked example, a "first 15 minutes" plan and a review schedule.

| Goal | Methods from the year | Short version |
|---|---|---|
| **A new language** | Keyword method and Tongues Bridge (M6), palace (M2), spaced review (M8) | Turn each new word into a picture of a sound-alike word in your own language plus its meaning. Group words by theme in rooms of a palace. 10 to 20 new words a day, review on day 1, 7 and 30. Grammar rules and genders get their own colours or places. Say words out loud. |
| **A speech or talk** | Palace (M2), text and facts (M7), contest nerves (M11) | One palace stop per main point, in order. A single strong picture per point, not the words. Rehearse by walking the route aloud. Learn only the opening and closing lines word for word. |
| **A poem, lyrics or a script** | Chain and story (M1), palace (M2), text (M7) | One stanza per palace room, one picture per line. Learn the gist first, then the exact words. First-letter prompts for checking yourself. Review stanza by stanza, then the whole thing. |
| **Names and faces** (new job, events, class) | Hall of Faces (M3) | Pick the most noticeable feature, turn the name into a picture, join the two. Use the name once in conversation. Write the list down that evening and review it the next morning. |
| **Numbers** (dates, phone numbers, prices, figures for a talk) | Major System (M4), long strings (M5) | Turn numbers into words with the sound code, then into pictures in a place. Dates for history become a scene. |
| **Study and exams** | Facts (M7), spaced review (M8), catching false memories (M9) | Pictures for key terms, a palace per topic, self-testing instead of rereading, spaced reviews before the exam. |
| **Everyday life** (lists, errands, where you parked, instructions) | Open Roads (M10) | A fixed short "everyday palace" at home, reused daily. Shopping lists, to-do lists, directions told to you once. |
| **Cards and memory sport** (optional, for fun) | Clockwork Market (M5), contest (M11) | Card-to-picture system, long palaces, timed practice. |

Further playbooks to consider: recipes, chess openings, music theory, scripture or long passages, directions and maps, medical or legal terminology for students, and remembering a book you have read.

## A planner the player can use (later feature, needs owner approval)

The strongest version is a "Keep your own" tool: the player types their own material (a word list, a speech outline, a poem), picks a palace, and Mnemos schedules the delayed reviews (1, 7, 30 and 90 days) using the same probe system as the curriculum. Notes for when it is built:

- Everything stays on the device, like all other data. It is included in backups (schema change and migration needed in `src/store.js`).
- Study and recall screens stay still and quiet.
- No rewards for typing material in. Rewards, if any, only from reviews that held, and they never change curriculum skill estimates.
- Self-checking of free text needs a forgiving matcher (the existing `matches` helper), with "I was right" and "I was wrong" buttons for anything word for word.

## The closing letter

The guide ends with a short letter from Calder, in her voice, about choosing what to keep: a few things kept well beat many things kept badly; the river takes some things and that is all right; come back to what you love. It should be drafted with the local model and edited by hand, like the rest of the story.

## Open questions for the owner

1. Should the guide unlock month by month during the year, or only at the end?
2. Should the "Keep your own" planner be built, and if so, before or after v1.0?
3. Which playbooks matter most to you to ship first? Suggested order: language, speech, poem, names, study.
