# Story proposal for 1.1: the Seam, Wren's family, and the Say-Back Games

For Ayaan to read and approve. Written Nov 2, 2026. Nothing here is in the game yet, and nothing in `src/` was touched.

## The three ideas in plain words

**1. The Great Forgetting, reworked** (`01-the-seam.md`, `forgetting.js`).
Under the Undercroft there is a tear in time, which Wren calls the Seam. Three hundred years ago the last Warden of the Hours, Ambrose Tallow, called "the Winder", stepped into it to keep one perfect evening from ending, and he has been holding it ever since. He is not cruel. He is lonely: nobody has said his name in three hundred years, and he is quietly taking the city's days to build a world in which he is remembered. The Great Forgetting is the days he has tangled, gathered into the hooded mist giant. The player beats it by remembering things in their true order. The last step is the Stitch: nine made-up days studied once and recalled in order. When the Seam is stitched, the tangled days go home in time, he is remembered, and he lets go.

It fits what is already shipped. The baker, the dog with three names and the brothers in the Prologue were always tangled days. The clocks stopped at nine minutes past eleven because time snagged. The Tide rose higher than in 300 years because the Seam was pulled wide, the same as 300 years ago when he first stepped in. The Tide is still the river being the river, and ordinary forgetting is still normal and forgivable.

**2. Wren's family arc** (`02-wren-family.md`).
Eleven small story beats across the year give Wren a father (Edrin, a lamplighter), a mother (Marit, who hummed "The Last Lamp"), a blue door, a cat named Pip and a red button. There are 29 delayed questions on details the player has already met, each with the line it came from and the earliest day it can be asked. Her mother's face is not restored. Instead the player keeps five details, and Wren paints her mother from them in the ending. The song's third verse hides the antagonist's name, so the final question calls back to the arc.

**3. The Say-Back Games** (`03-say-back-games.md`).
Veyra's own memory contests began in the Long Vigil, when neighbours kept each other awake by saying things back. The Wardens made it a ladder for finding Wardens. The Long Quiet turned it into a rich family's hobby. There are five tiers (Quay Heat, Gallery Heat, City Cup, Compact Round, Lamp Final) and seven events with Veyran names (Hall Round, Counting Rows, Rook Run, Vigil Verse, Bridge Tally, Three Lamps Out, Double Rook). The rival is Ottoline Gilt, nineteen, rich, tutored, smug and funny, who becomes more human tier by tier. Her marks are scripted against the player's own best results, never a timer, never a pressure, and never touch skills.

**How they connect.** Recommended: the Lamp Cup's blank founder plate. The Games were Tallow's invention and his name wore off the plate. Ottoline is not a hidden villain.

## What would change in shipped canon (listed plainly)

Nothing shipped is edited or renamed. Everything is added. The additions are:

1. **New Chronolog entries** (4): the winding mark under the last lamp (M1), the Hour Nobody Wrote (M5), the Oldest Stone (M6), the Order's Patron (M9). Plus one Gate line for M12.
2. **Four new Undercroft tablets** at depths 75, 80, 90, 100.
3. **A third verse for the Lamplighter's Song** (new text, same tune Tansy hums in the Epilogue).
4. **Chapter 13: The Seam** after the Year of Keeping. The Great Forgetting battle gets a fourth phase, the Stitch, and a new ending. The old draft's idea that the giant is "every lost thing gathered" changes to "every tangled day gathered".
5. **A second epilogue**, "Days in Their Places".
6. **Wren's family**: eleven extra cards on Today, 29 delayed questions (new save record, planned already for v0.13).
7. **The Say-Back Games**: a Season of five tiers on top of the Event Hall, plus a new Chronolog entry or two. The Rite of Echoes stays as it is, and is now described as the harsh old cousin of the Games.
8. **Reinterpretations that need no edit:** the Prologue's baker, dog and brothers; the 11:09 clocks; the Tide of 300 years; the blank ledgers; Calder's hand's-width gate (she did it for the nine agents and to keep the Gate standing).

What stays exactly as it is: the Tide is the river being the river, ordinary forgetting is forgivable, Forgettings are never driven off, Tomas Hask's grey, Sevrin's grief, Wren's mother's face.

All new ids are marked proposed, and ids become permanent once released.

## Questions for you

1. **The antagonist.** Is a lonely last Warden who wants his name back the right kind of villain? (Recommended yes. He is the Sevrin mirror: Sevrin wanted everyone to forget, he wants no one to.)
2. **Where the Great Forgetting sits.** As the true Chapter 13 after the Year of Keeping (recommended), or inside the year before the Night of No Moon?
3. **Wren's mother's face.** Stay lost, with Wren painting a portrait from details (recommended)? Or restored?
4. **Wren's father.** Alive and living on Quay Row (recommended, he appears at the Rite), or gone?
5. **Mosk's wife's name.** OK to give it back in the ending? Tomas Hask stays as he is.
6. **The song's third verse.** OK that "Tallow keeps the lamp for me" is the secret?
7. **The Games' start.** Practice grounds open after the M10 gate, and the Season (tiers and rival) after the M12 gate (recommended). Or the Season earlier?
8. **The rival.** Is Ottoline Gilt, "Lantern" for a nickname, the right character? Any change of gender or name?
9. **The rival's marks.** Is it right that her marks are the player's own earlier best, times a falling factor, with a few scripted stumbles? (The exact factors would be checked by a simulation.)
10. **Losing the Final.** Nothing locks and the player may replay forever (recommended). OK?
11. **The Stitch.** Six of nine closes the Seam, and a miss only means "try again tomorrow with a new thread". OK?
12. **Calder's reveal.** In the second epilogue, Tansy admits the river was already at the sluice. Too much, or just right?

## Art this would need (not drawn)

Portraits: the Winder (Ambrose Tallow), Ottoline Gilt, Edrin Halloway. Scenes: the green door on Quay Row, Wren's painting of her mother, the Lamp Cup with its plate. A ring-with-one-hand mark for the lamp base, clock and stone. All in the same pixel style and art budget, with `model: 'qwen-image-2.1'` on each entry.

## Files in this folder

- `01-the-seam.md`: the rift's rules, the antagonist, the year's foreshadowing, the battle, the ending.
- `forgetting.js`: a revised code-shaped draft of `src/data/forgetting.js`, with proposed Chronolog entries and Undercroft tablets.
- `02-wren-family.md`: the family, the eleven beats, the 29 questions.
- `03-say-back-games.md`: the Games, the tiers, the rival and her lines.
