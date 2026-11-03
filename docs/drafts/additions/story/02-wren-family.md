# 2. Wren's family arc, and the story questions built on it

Draft for the owner, Nov 2, 2026. This is the story half of the v0.13 "Wren's story memory" feature in `docs/ROADMAP.md`. Nothing is wired.

## What the arc is for

Wren tells the player small, true-feeling things about her family over the year. Weeks later, she asks about one of them as an ordinary delayed question. If the player held it, a short extra scene or Chronolog line follows. If not, Wren repeats it warmly and nothing is locked, ever. The details are things the player has actually met in the story, so the questions test real delayed recall, spaced over days and weeks, and practise the Field Guide's "details about people" habit.

The arc also pays off the biggest sad fact about Wren: she lost her mother's face to a Tide as a girl and has never forgiven herself. The arc does not take that loss away. It gives her something better to do with it.

## The family (all new, all invented)

- **Marit Halloway**, Wren's mother, a lamplighter of the Quay. Died in the winter of the long cough, when Wren was eight. The Tide took her face from Wren's memory that same week, an ordinary Tide, nobody's fault. Hummed "The Last Lamp" while she lit lamps 1 to 22.
- **Edrin Halloway**, Wren's father, the other lamplighter, who lit lamps 23 to 44. Quiet, bad knee. Alive and living at number 31, Quay Row, in the house with the flaking blue door he has been promising to repaint for twenty years.
- **Granny Orla**, who grew white roses in a garden by the river (died when Wren was a teenager).
- **Bram**, a tall cousin who smells of sawdust and built Wren's first shelf.
- **Pip**, Wren's grey cat with a white patch on her left ear shaped like a tiny moon.
- The small things: Wren stirs her tea exactly three times, takes wild honey in her oats, drinks Tansy's Mist and Mint, dislikes dark attics, and carries a red button from the first little coat her mother sewed, the one with eleven pockets. (The long brown coat she wears now was cut to the same pattern by her father when she turned sixteen. This explains the eleven pockets already in canon.)

Consistency with shipped canon: Wren is 27 and from the Quay (shipped). "Daughter of a lamplighter" (shipped) is now both parents. She lost her mother's face (shipped). Calder gave her the first notebook (new, and it fits her being Calder's apprentice). Tansy's tea blend "Mist and Mint" turns out to be one Calder made for a grieving nine-year-old and Tansy still makes by habit, a sad little link, revealed in beat 7.

The Qwen draft about a sister named Elowen is dropped. The mother-and-lamp version replaced it in `docs/drafts/v11-reviewed.json`.

## The face (the quiet heart of the arc)

Wren cannot remember her mother's face. Across the year the player is given five details about it, mostly by Edrin, and asked to keep them. In the new ending (document 1, beat 5) Wren paints her mother from those details. The painting is "near enough to say good night to". The face does not return. What the story says is: a face is not a thing you keep, it is a thing you can rebuild from what people kept for you. That is exactly what the game teaches, and it is kind to anyone who has lost something.

Recommendation: do not restore the original face. It would undo the shipped canon (ordinary forgetting is forgivable, not reversed) and the emotional point.

## The beats

Each beat is a short story card, shown at the start of the first session of its week (the same pattern as `BEATS` in `src/data/quests.js`; since each week already has one beat, these appear as an extra "Wren" card on the Today screen, so nothing shipped is edited). Day numbers: week W starts on day 7(W-1)+1.

| # | Proposed id | Week (day told) | Where | What happens |
| --- | --- | --- | --- | --- |
| 1 | `wf_b1_three_stirs` | 2 (day 8) | Quay, Tansy's stall | Wren stirs her tea three times, "any other number and the afternoon feels off". She takes wild honey in her oats. Tansy hands her Mist and Mint, "not strictly a real blend". |
| 2 | `wf_b2_blue_door` | 4 (day 22) | Quay, the last lamp | Wren points out the blue door on Quay Row, paint flaking, "my father says he will repaint it". Her father Edrin lit lamps 23 to 44. Her cat Pip is grey with a moon on her ear. She hates dark attics, "the boxes look at me". |
| 3 | `wf_b3_the_tune` | 6 (day 36) | Gallery, when a face returns | Wren cannot remember her mother's face, but she remembers the tune her mother hummed while lighting the Quay lamps: "The Last Lamp". She hums it, without words. |
| 4 | `wf_b4_what_i_kept` | 10 (day 64) | Hall of Faces | Wren lists what she kept: Granny Orla's white roses by the river, her cousin Bram (tall, sawdust, built her first shelf), a red button from her first coat. Her mother sewed the eleven pockets. |
| 5 | `wf_b5_thirty_one` | 15 (day 99) | Counting House | Number practice: the house is number 31, Quay Row. Her mother lit lamps 1 to 22. |
| 6 | `wf_b6_good_night` | 26 (day 176) | Bridge, after the thrown stone | Wren tells how she lost the face: she was eight, the winter of the long cough, and she woke to find it gone. She says good night to the last lamp every night since. |
| 7 | `wf_b7_green_notebook` | 38 (day 260) | The drain after the file | Wren remembers her first notebook, green, given by a woman who smelled of rosemary and ink the spring she was nine. It was Calder. Calder made Mist and Mint for her that spring. |
| 8 | `wf_b8_edrin` | 44 (day 302) | Amphitheatre, before the Rite | Edrin comes to watch his daughter. He tells the player about her mother's face: the scar through her left eyebrow (a lamp glass), the brass key she pinned her hair with, the yellow scarf, the laugh that started before the joke ended. "Keep these. She would want her face to have someone." |
| 9 | `wf_b9_third_verse` | 49 (day 337) | Quay, the old songs | Tansy and Wren teach the Quay folk the old songs. Tansy gives the third verse, the part people only hum: "Trim the wick and turn the key, / Tallow keeps the lamp for me. / By river stones and light, go home: / the last lamp waits, and none walk alone." Wren recognises it as her mother's tune. |
| 10 | `wf_b10_green_door` | Year of Keeping (day 366) | Quay Row | Edrin has finally repainted the door. It is green. "Blue was only ever a mistake I never fixed." (Tests whether the player keeps the old door and the new door apart.) |
| 11 | `wf_b11_portrait` | After the Seam | The Archive | Wren paints her mother from the five details. The father stands behind her. (Same scene as the epilogue, document 1.) |

Beat 3 and beat 9 are the story's hidden clue: the Last Lamp is the old third verse, and the name in it is the antagonist's.

## The 29 questions

Rules for all of them, to match the shipped feeling of every other delayed probe:

- Asked as an ordinary delayed question by Wren on the Today screen, typed or picked, a single free answer. Accepted spellings are listed.
- Never earlier than the "earliest day" column, which is always at least 3 days after the beat. A good ask pattern: the first ask on or after the earliest day, a second 10 days later, a third 30 days later. At most three asks per item. An item retires after two correct answers.
- Never during study or recall screens. After a session, with no timer.
- If held: a short warm line (examples below) and a Chronolog "keepsake" note. If missed: Wren says the answer warmly, once. Nothing is locked and nothing changes any score.
- Story only. No Lumen, no skill changes.

| # | Id (proposed) | Question | Answer (accepted) | Source line (what the player met) | Told | Earliest day |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `wf_stirs` | How many times does Wren stir her tea? | Three | "I always stir three times. Any other number and the afternoon feels off." | 8 | 11 |
| 2 | `wf_honey` | What does Wren stir into her morning oats? | Wild honey (honey) | "I cannot start the morning without a spoonful of wild honey in my oats." | 8 | 13 |
| 3 | `wf_blend` | What is the name of Wren's favourite tea blend? | Mist and Mint | "Tansy gives me Mist and Mint. She says it is not strictly a real blend." | 8 | 18 |
| 4 | `wf_door` | What colour was the door of the house Wren grew up in? | Blue | "That is my house, the one with the blue door. The paint is always flaking." | 22 | 25 |
| 5 | `wf_pip` | What is the name of Wren's grey cat? | Pip | "My cat is grey, with a white patch on her left ear like a tiny moon. Her name is Pip." | 22 | 29 |
| 6 | `wf_attic` | Which kind of room does Wren not like going into alone? | Dark attics (attic) | "I do not like dark attics. I always think the boxes are looking at me." | 22 | 34 |
| 7 | `wf_father` | What is the name of Wren's father? | Edrin | "My father, Edrin, lit lamps twenty-three to forty-four." | 22 | 40 |
| 8 | `wf_repaint` | What did Wren's father always say he would do about the door? | Repaint it | "He keeps saying he will repaint it." | 22 | 52 |
| 9 | `wf_tune` | What is the name of the tune Wren's mother hummed? | The Last Lamp | "I cannot remember her face. I remember the tune. She called it The Last Lamp." | 36 | 39 |
| 10 | `wf_hum` | What was Wren's mother doing while she hummed it? | Lighting the Quay lamps (lighting the lamps) | "She hummed it while she lit the lamps along the Quay." | 36 | 46 |
| 11 | `wf_roses` | What flowers did Wren's grandmother grow by the river? | White roses | "Granny Orla grew the sweetest white roses by the river. The scent followed me home." | 64 | 67 |
| 12 | `wf_bram` | What is the name of Wren's tall cousin? | Bram | "My cousin Bram is very tall." | 64 | 71 |
| 13 | `wf_shelf` | What did Bram build for Wren? | Her first shelf (a shelf) | "He built me my first shelf." | 64 | 78 |
| 14 | `wf_sawdust` | What does Bram always smell of? | Sawdust | "He always smells of sawdust." | 64 | 92 |
| 15 | `wf_button` | What small thing does Wren carry in her pocket for comfort? | A red button | "I keep one red button in my pocket. It came off the first coat my mother made me." | 64 | 75 |
| 16 | `wf_pockets` | Who sewed the eleven pockets of Wren's first coat? | Her mother | "She sewed eleven pockets into it, because I lost everything." | 64 | 85 |
| 17 | `wf_number` | What number is the house on Quay Row where Wren grew up? | Thirty-one (31) | "Number thirty-one, Quay Row. I could walk it blind." | 99 | 102 |
| 18 | `wf_lamps_mother` | Which lamps on the Quay did Wren's mother light? | One to twenty-two (1 to 22) | "My mother had the first twenty-two lamps. My father had the rest." | 99 | 109 |
| 19 | `wf_age` | How old was Wren when she lost her mother's face? | Eight | "I was eight. The winter of the long cough." | 176 | 179 |
| 20 | `wf_goodnight` | Who does Wren say good night to every evening? | The last lamp | "Every night since, I say good night to the last lamp on the Quay." | 176 | 186 |
| 21 | `wf_notebook` | What colour was Wren's first notebook? | Green | "It was a small green notebook, and I was nine." | 260 | 263 |
| 22 | `wf_rosemary` | What did the woman who gave Wren the notebook smell of? | Rosemary (and ink) | "She smelled of rosemary and ink." | 260 | 270 |
| 23 | `wf_scar` | Where was the scar on Wren's mother's face? | Through her left eyebrow | "A scar through the left eyebrow, from a lamp glass." (Edrin) | 302 | 305 |
| 24 | `wf_pin` | What did Wren's mother pin her hair with? | A brass key | "She pinned her hair with a brass lamp key." (Edrin) | 302 | 312 |
| 25 | `wf_laugh` | What was unusual about her laugh? | It began before the joke was finished | "Her laugh always started before the joke was done." (Edrin) | 302 | 319 |
| 26 | `wf_scarf` | What colour was her scarf? | Yellow | "She wore a yellow scarf, winter and summer." (Edrin) | 302 | 330 |
| 27 | `wf_tallow` | In the third verse of The Last Lamp, who keeps the lamp? | Tallow | "Trim the wick and turn the key, Tallow keeps the lamp for me." | 337 | 340 |
| 28 | `wf_stones` | Which words from the song get stuck in Wren's head? | River stones and light | "By river stones and light, go home." | 337 | 347 |
| 29 | `wf_newdoor` | What colour is the door on Quay Row now? | Green | "It is green now. Blue was only ever a mistake I never fixed." | 366 | 372 |

Notes:

- Items 4 and 29 are the same object at two times. Asked a week apart they are a small test of keeping old and new apart (the Month 9 skill). Never ask both on the same day.
- Items 23 to 26 plus 9 and 17 and 18 are the "face and family" cluster. Item 27 is the one the last battle calls back (ungraded, document 1).
- Several items are cued by a sensory detail (a smell, a colour, a pocket) on purpose. They give the player something picturable, which is the method the game teaches.
- Day numbers use the 365-day curriculum. After day 365 the Year of Keeping uses the same clock.

## Example "if held" lines (cosmetic, for a Chronolog keepsake note)

- Stirs: "Three. The afternoon is right again."
- Door: "Blue. I can almost see the flaking."
- Tune: "The Last Lamp. Yes. You kept it for me when I thought it might go."
- Scar: "Through the left eyebrow. Yes. Thank you for keeping her."
- Tallow: "Tallow keeps the lamp for me. Yes. Of course it does."

## Where the questions might surface

- The Today screen, after a session, as a small Wren card. This is the existing v0.13 plan.
- Never in the middle of a drill. Never on a day the player has not had a session.
- The player may turn them off in one settings switch. Quietly, no consequence.

## Not done here

- No new save-data fields are proposed beyond the v0.13 plan (a delayed-question record keyed by id). The ids above are proposed and will be permanent once shipped.
- No art is needed except Edrin's portrait, the green door on Quay Row, and Wren's painting of her mother. See the README art list.
