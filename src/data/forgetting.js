// 1.1 Chapter 13, the Seam and the Great Forgetting (supersedes the earlier unused draft of this file).
// The giant is the days snagged on the Seam, a tear in time under the Undercroft, gathered into one body. A man holds the
// pale glow up like a lantern: Ambrose Tallow, "the Winder", the last Warden of the Hours. Four phases: the Hem of the Cloak,
// the Body of Mist, the Pale Glow, then the Stitch (a delayed ordered recall of nine made-up days; six in place closes the Seam).
// Same battle rules as every Echo battle: made-up material, no Lumen, no relics, no skill changes, answers shown after a miss,
// rest allowed any time. Nothing here is locked by a miss: the Stitch is simply "not tied off yet" and can be tried again.
// {name} is the player's alias. No em dashes. Texts use template strings so apostrophes need no escapes.
// Ids kept from the older draft: great_forgetting, lore_great_forgetting, M12, wren, forgetting_great.

export const FORGETTING_HONEST = `This battle practises the methods on made-up material. It is a story scene, not a test of real-life memory, and nothing in it changes your scores.`;

// CHANGED: the unlock line. Same unlock rule as before (the Year of Keeping is complete).
export const GREAT_FORGETTING = {
  id: 'great_forgetting', title: 'The Great Forgetting', name: 'The Great Forgetting',
  look: `A towering hooded giant of grey mist, with a pale glow where its face should be.`,
  gate: 'M12', coach: 'wren', art: 'forgetting_great',
  chapter: { id: 'chapter_13_seam', title: 'Chapter Thirteen: The Seam', quest: 'Stitch the Seam with nine days' },
  unlock: `The Tide has climbed a finger higher every night this week, and the last lamp on the Quay has begun, very faintly, to tick. Tonight, out on the water, something is waiting.`,
};

// ADDED: the rules of the Seam, as player-facing Chronolog text. Gentle, no horror.
export const SEAM_RULES = {
  id: 'lore_p_seam', title: 'The Seam', unlock: 'seam:met',
  text: [
    `Under the Undercroft, below the Last Stone, is the place where the Lethe truly rises. The Wardens never named it. Wren calls it the Seam, because it is where two edges of time were sewn badly and have been pulling at each other ever since.`,
    `The Seam takes nothing away. It only tangles. A thing that is forgotten is gone, and the person is calm about it. A thing that is tangled is known but in the wrong place: loaves baked for the wrong day, one dog with three names, two brothers who each remember the other in a different year.`,
    `The Seam cannot be closed by force, or by wishing, or by forgetting more. It can only be stitched, by remembering things in their true order. It gives back the days it snagged. It does not undo what the river takes in the ordinary way, and it does not undo what anyone chose to let go. The Tide still rises every evening. That is the river being the river.`,
  ],
};

// ADDED: the Winder. Appears only inside the battle and the epilogue. Never frightening.
export const WINDER = {
  id: 'winder', name: 'Ambrose Tallow', epithet: 'the Winder',
  look: `A thin, tidy man in an old Warden's coat, the brass badge worn smooth as a river stone, a pocket watch on a long chain, and kind, tired eyes. His mark is a ring with a single hand, like a clock's.`,
  art: 'portrait_ambrose_tallow', // art manifest id; missing art falls back to text
};

export const BOSS_INTRO = [
  `The Tide was high that evening, higher than it had been in a year, and it did not come up the streets the way it usually did. It gathered. Out on the water, a grey shape stood up out of the mist, taller than the lamp-posts, taller than the Archive dome, wearing a hood of cloud and holding a pale glow where a face should be.`,
  `"Do not run," Wren said, very quietly, and she took your sleeve. "Look at what it is carrying."`,
  `In the folds of its hood, in its great grey hands, trailing from its cloak like loose threads, were the small shy shapes you had met all year: Smudges and Tangles, Hollows, Blanks, Static, Murmurs and Dustleaves. And among them, many more, that you had not met: ordinary days, thousands of them, a breakfast, a quarrel, a Tuesday, a name, each one tied to the cloak by a thread, and none of them in the order it belonged.`,
  `"Oh," Wren said, and her voice went thin. "The baker's loaves. The woman's dog. That was never forgetting, was it? That was this." She let go of your sleeve and took your hand instead. "It is not angry. It is only very large, and everything in it is out of place. Let us put some of it back."`,
];

// ADDED: the Stitch. Nine made-up days of the city, studied once at the start of the battle (calm study screen,
// no animation), recalled after the three phases. Builder note: an ordered recall of 9 items, by order, with the existing
// chain/palace scorer; 6 of 9 in place closes the Seam. Fewer is not a failure: the answers are shown, the Stitch is "not
// yet tied off", and the player may rest and try the whole battle again with a new thread (the pool should hold several).
export const BOSS_STITCH = {
  id: 'stitch', count: 9, closesAt: 6,
  study: `Before the first answer, the giant lays a thread across the water, with nine bright beads on it. "Each bead is one day of Veyra," Wren says. "I do not know whose. Put them in order, once, and keep them. We shall need them at the end."`,
  // Threads of nine made-up days, each one picturable thing. `ans` is the short answer; `alts` are other words that count.
  // A new thread is used on each try, so a retry is never the same list.
  threads: [
    {
      id: 'thread_1',
      beads: [
        { n: 1, day: `the day of the copper kettle`, thing: `a copper kettle rolling down Lantern Street`, ans: 'copper kettle', alts: ['kettle'] },
        { n: 2, day: `the day of the heron`, thing: `a heron standing on the ferry rope`, ans: 'heron', alts: [] },
        { n: 3, day: `the day of the umbrellas`, thing: `a wedding with nine green umbrellas`, ans: 'green umbrellas', alts: ['umbrellas', 'umbrella'] },
        { n: 4, day: `the day of the double lamp`, thing: `a lamp that was lit twice`, ans: 'double lamp', alts: ['lamp lit twice', 'lit twice'] },
        { n: 5, day: `the day of the goat`, thing: `a goat on the Counting House steps`, ans: 'goat', alts: [] },
        { n: 6, day: `the day of the pears`, thing: `a little boat of pears in the harbour`, ans: 'pears', alts: ['pear'] },
        { n: 7, day: `the day of the bell`, thing: `a bell rung seven times by a child`, ans: 'bell', alts: [] },
        { n: 8, day: `the day of the paper snow`, thing: `a snow of paper over the Market`, ans: 'paper snow', alts: ['snow'] },
        { n: 9, day: `the day of the red scarf`, thing: `a red scarf left on the Tidal Stair`, ans: 'red scarf', alts: ['scarf'] },
      ],
    },
    {
      id: 'thread_2',
      beads: [
        { n: 1, day: `the day of the blue kite`, thing: `a blue kite caught on the Archive dome`, ans: 'blue kite', alts: ['kite'] },
        { n: 2, day: `the day of the sleeping cat`, thing: `a cat asleep on the Mother Clock`, ans: 'sleeping cat', alts: ['cat'] },
        { n: 3, day: `the day of the soap bubbles`, thing: `soap bubbles drifting along the Quay`, ans: 'soap bubbles', alts: ['bubbles', 'bubble'] },
        { n: 4, day: `the day of the wooden spoon`, thing: `a giant wooden spoon in the Market square`, ans: 'wooden spoon', alts: ['spoon'] },
        { n: 5, day: `the day of the ladder`, thing: `a ladder that stood alone in the harbour`, ans: 'ladder', alts: [] },
        { n: 6, day: `the day of the lemon cart`, thing: `a cart of lemons that lost a wheel`, ans: 'lemon cart', alts: ['lemons', 'lemon'] },
        { n: 7, day: `the day of the brass band`, thing: `a brass band of three very small children`, ans: 'brass band', alts: ['band'] },
        { n: 8, day: `the day of the moth`, thing: `a white moth on the last lamp`, ans: 'white moth', alts: ['moth'] },
        { n: 9, day: `the day of the teapot`, thing: `a teapot left on the bridge rail`, ans: 'teapot', alts: ['tea pot'] },
      ],
    },
    {
      id: 'thread_3',
      beads: [
        { n: 1, day: `the day of the paper boat`, thing: `a paper boat sailing under the Tongues Bridge`, ans: 'paper boat', alts: ['boat'] },
        { n: 2, day: `the day of the hat`, thing: `a top hat floating down the Lethe`, ans: 'top hat', alts: ['hat'] },
        { n: 3, day: `the day of the nine candles`, thing: `nine candles on one very small cake`, ans: 'nine candles', alts: ['candles', 'cake'] },
        { n: 4, day: `the day of the rooster`, thing: `a rooster crowing at noon in the Gallery`, ans: 'rooster', alts: ['crowing', 'cockerel'] },
        { n: 5, day: `the day of the key`, thing: `a brass key found in a loaf of bread`, ans: 'brass key', alts: ['key'] },
        { n: 6, day: `the day of the sheep`, thing: `a flock of sheep crossing the Market`, ans: 'sheep', alts: ['flock'] },
        { n: 7, day: `the day of the violin`, thing: `a violin played on the ferry`, ans: 'violin', alts: ['fiddle'] },
        { n: 8, day: `the day of the rain of petals`, thing: `a rain of white petals on the Tidal Stair`, ans: 'petals', alts: ['petal'] },
        { n: 9, day: `the day of the lantern fish`, thing: `a fish that glowed like a lantern`, ans: 'lantern fish', alts: ['glowing fish', 'fish'] },
      ],
    },
    {
      id: 'thread_4',
      beads: [
        { n: 1, day: `the day of the clock that ran backwards`, thing: `a small clock that ran backwards in a shop window`, ans: 'backwards clock', alts: ['clock'] },
        { n: 2, day: `the day of the drum`, thing: `a drum carried by a very tall man`, ans: 'drum', alts: [] },
        { n: 3, day: `the day of the orange door`, thing: `a door painted orange overnight`, ans: 'orange door', alts: ['door'] },
        { n: 4, day: `the day of the stray dog`, thing: `a stray dog carrying a shoe`, ans: 'dog with a shoe', alts: ['dog', 'shoe'] },
        { n: 5, day: `the day of the hot air balloon`, thing: `a balloon the colour of a plum drifting over the Quay`, ans: 'plum balloon', alts: ['balloon'] },
        { n: 6, day: `the day of the chess board`, thing: `a chess board set out on the harbour wall`, ans: 'chess board', alts: ['chess'] },
        { n: 7, day: `the day of the bucket of stars`, thing: `a bucket someone said was full of stars`, ans: 'bucket', alts: ['stars'] },
        { n: 8, day: `the day of the long loaf`, thing: `a loaf of bread as long as a boat`, ans: 'long loaf', alts: ['loaf'] },
        { n: 9, day: `the day of the swan`, thing: `a swan that waited at the Gate`, ans: 'swan', alts: [] },
      ],
    },
  ],
  ask: `Say the beads back in order, from the first to the ninth.`,
  hit: [
    `The bead settles onto the thread in its place, with a small clear note.`,
    `A day goes home, and the person it belonged to turns, somewhere in the city, and smiles without knowing why.`,
    `The thread tightens a little, and the pale glow steadies.`,
  ],
  miss: [
    `The bead hangs loose. The answer is shown, and it will go home all the same.`,
    `A day swings out of its place. Read it, say it once, and let it hang there. It is only waiting.`,
    `Wren whispers the bead to you. It does not count against anything. It is only the thread being kind.`,
  ],
  // Shown if fewer than 6 of 9 were in place. Not a failure, not a penalty: the battle can be taken up again.
  notYet: `The thread holds, but it is not tied off. "That is all right," the Winder says, almost gently. "It is a great many days. Come back when you like. I am not going anywhere." Wren squeezes your hand. "Tomorrow, then. With a new thread."`,
  closes: `The last bead slides home. The thread draws tight, the way a seam does when someone finally pulls the right end.`,
};

// Each phase asks about material from the skills named. Material is made up (see the scene pools in echo.js).
// Phases 1 to 3 keep their first-draft text. Lines marked ADDED are the rift lines.
export const BOSS_PHASES = [
  {
    id: 'fringe', title: `The Hem of the Cloak`, skills: ['imagery', 'linking', 'palace'],
    intro: `The first of the small shapes drift down from the hem of the cloak: a Smudge with a blurred picture, a Tangle with a loose story, a Hollow with a room and no furniture. They only want to be remembered.`,
    // ADDED
    seam: `Wren frowns at the hem. "These are not lost. They are just in the wrong order, all tied together like laundry. Take them one at a time and they will come loose."`,
    hit: [
      `The Smudge sharpens as you speak, and floats up out of the cloak like a bubble.`,
      `The Tangle straightens into a neat thread and slips away across the water.`,
      `The Hollow fills with furniture, one piece at a time, and goes home.`,
      `A gap opens in the grey hem, and light shows through.`,
    ],
    miss: [
      `The shape waits. It does not mind. The answer is shown, and it will ask again soon.`,
      `A thread slips and the cloak ripples. Nothing is lost. Read the answer and try the next.`,
      `The Hollow stays hollow for now. It is patient. So is Wren.`,
    ],
    end: `The hem of the cloak is thinner now. The giant tilts its hood, as if it had never expected anyone to answer.`,
  },
  {
    id: 'body', title: `The Body of Mist`, skills: ['faces', 'numbers'],
    intro: `The great grey body of the giant is full of faces without names and numbers without pictures: a crowd of Blanks, and Static drifting like snow. They press softly against the Quay.`,
    // ADDED
    seam: `"Names and dates," Wren says. "The two things that go wrong first when days get tangled. A person in the right year with the wrong face. A day with no number."`,
    hit: [
      `A Blank hears its name and turns, and for a moment it has a face.`,
      `The Static settles into a row of numbers, tidy as a line of lamps.`,
      `A whole row of faces lifts out of the mist, each with a name, and walks home along the quay.`,
      `The mist in the giant's chest brightens, just a little.`,
    ],
    miss: [
      `The faces stay blurred for now. Their names are shown, and they will come round again.`,
      `A number scatters like sparrows. Read it, say it once, and the next one will be easier.`,
      `A Blank turns its head. It has no hard feelings about it.`,
    ],
    end: `The chest of the giant is clear and bright, and the crowd inside it is a great deal smaller. The giant seems lighter, as if it had put something heavy down.`,
  },
  {
    id: 'face', title: `The Pale Glow`, skills: ['vocab', 'structure', 'imagery', 'linking', 'palace', 'faces', 'numbers'],
    intro: `The giant lowers its hood to look at you. Where its face should be there is only a pale glow, and in the glow, one after another, the last of the lost things are waiting: a Murmur, a word on the tip of the tongue, and a Dustleaf, a page of loose facts. Behind them, all seven kinds at once.`,
    hit: [
      `The Murmur says its word aloud, delighted, and drifts toward the light.`,
      `The Dustleaf gathers itself into a tidy page, and the page goes home with a little bow.`,
      `Something in the glow gives a long sigh, like a kettle going off the boil.`,
      `The pale glow grows warmer. The giant holds very still.`,
    ],
    miss: [
      `The glow flickers but does not go out. The answer is shown, and the next one is already coming.`,
      `A page slips from the Dustleaf. It will come round again, and so will you.`,
      `The giant waits with enormous patience. It has had a great deal of practice.`,
    ],
    // CHANGED: the old end line ("The giant is standing alone on the water") becomes the Winder's entrance.
    end: `The last of the small shapes goes home. The giant stands very still on the water, and the pale glow turns, and you see that it is not a face at all.`,
  },
  // ADDED: the Stitch, the fourth phase. All seven skills are drawn on by the study and the order recall.
  {
    id: 'stitch', title: `The Stitch`, skills: ['imagery', 'linking', 'palace', 'faces', 'numbers', 'vocab', 'structure'],
    intro: `The thread is still lying across the water, with its nine beads. "Now," the Winder says. "Show me."`,
    seam: `Wren stands very straight. "Nine days, in order. Not perfectly. Just in their places. That is all a stitch ever is."`,
    hit: BOSS_STITCH.hit,
    miss: BOSS_STITCH.miss,
    end: `The thread lies tight and still across the water, and the giant is a great deal smaller than it was.`,
  },
];

// ADDED: the Winder's scenes. He speaks to Wren, not to the player (the player is silent, as everywhere else).
// He is never cruel and never threatens anyone. He wants one thing, and says it twice.
export const BOSS_WINDER = {
  // Shown between phase 3 and the Stitch.
  appears: [
    `Held up from inside the giant, like a lantern on a pole, was a thin man in an old Warden's coat. The brass badge on his breast was worn smooth as a river stone. He had a pocket watch on a long chain, and kind, tired eyes, and the look of someone who has not slept in a very long time, which was true.`,
    `"Good evening," he said. "I am sorry about the noise. I have been trying to be quiet for three hundred years."`,
  ],
  pitch: [
    `"I only meant to keep one evening," the Winder said, and he looked at Wren, not at you. "The last evening when every lamp on the Quay was lit and everyone knew everyone's name. I stepped into the Seam to hold it in place. It was meant to be one evening. It is surprising how much room one evening takes up."`,
    `"You will lose most of this year, you know. Nine days in ten. The river takes it, quite fairly. But I could keep it for you. Every day in its place, and not one of them ever lost. I should only need the Heartledger, to put the days in order." He turned the watch over in his fingers. "And I should like, if it is not too much to ask, for someone to know my name."`,
  ],
  wren: `Wren took a long breath. "Nine in ten goes," she said. "Yes. That is the river being the river, and it is all right. A day gets to be over. That is how it gets to be a good one." She squeezed your hand. "Calder taught me that the last lesson is not how to keep everything. It is how to choose. We do not need all of it. We need the part we chose, in its place."`,
  set: `The Winder looked at her for a long moment. Then he smiled, very slightly, the way a person does who has lost an argument he rather hoped to lose. "Then show me," he said. "Nine days, in order. If you can do that, I shall let go of the thread."`,
  // After the Stitch is closed (6 of 9 or more).
  name: [
    `The thread drew tight, and the Winder grew thin as glass, and for the first time he looked afraid. "I cannot remember what to be called," he said. "It was on the ledge. I could not read it. Nobody has said it in so long."`,
    `Wren did not answer. She began, quietly, to hum: the tune her mother had hummed on the Quay, the one with no words, the one Tansy hummed under the last lamp. You found that you knew where the words went.`,
  ],
  // The one story-memory question. UNGRADED. No reward, no penalty. The player may type it or pick it; if they do not know
  // (or skip), Wren says it. Source: Wren's family arc, beat 9 (day 337), item wf_tallow.
  nameAsk: {
    prompt: `In the third verse of the Last Lamp, who keeps the lamp?`,
    answer: `Tallow`,
    ifHeld: `"Tallow," you said, and Wren's hum broke into a laugh. "Tallow keeps the lamp for me. Of course. We all thought it was candle fat."`,
    ifNot: `"Tallow," Wren said, very softly. "Tallow keeps the lamp for me. We all thought it was candle fat. It never was." She was not cross with you for needing it. She looked as if she had needed it herself.`,
  },
  // Said by the player's Heartledger, shown as plain text.
  roll: `In the Heartledger, on the roll of the Wardens, the last line had always been a smudge. Now it cleared, letter by letter, like breath leaving a cold pane: AMBROSE TALLOW, WARDEN OF THE HOURS, WHO KEPT THE LAST LAMP.`,
  letGo: `"Ambrose," he said. "Ambrose Tallow." He said it three times, trying it, the way a person tries a coat they have not worn in years. "Oh. There it is." And he opened his hand, and the thread slid out of it.`,
};

// Short lines used between questions in any phase, so a long battle does not repeat itself.
export const BOSS_LINES = {
  hit: [
    `That one went home.`,
    `A clear answer, and the mist thins a little more.`,
    `Wren makes a tiny note, and then crosses it out, because she does not need it.`,
    `A lamp along the Quay flares up, just for a moment.`,
    // ADDED
    `Somewhere in the city, someone finishes a sentence they started a week ago.`,
  ],
  miss: [
    `The answer is shown. The mist waits.`,
    `No harm done. The shape will come round again.`,
    `Take a breath of the evening air. The next one is a fresh one.`,
  ],
  wren: [
    `Steady. It is only the Tide, gathered into one place.`,
    `You are doing fine. I am going to pretend I am not nervous.`,
    `Listen to the water. It is not angry. It is only deep.`,
    // ADDED
    `Nothing here is lost. It is only out of order. That is a much easier thing to mend.`,
  ],
  rest: `Setting it down for tonight is fine. The giant will be on the water tomorrow, and so will you.`,
};

// CHANGED: the ending. The giant is remembered, not destroyed. No special loot, no random reward. A Chronolog entry only.
export const BOSS_ENDING = {
  title: `Remembered`,
  text: [
    `When the last bead slid home, nothing exploded and nothing fell. The giant simply stopped holding on. It lowered its great grey hands, and everything it had gathered rose from its cloak like a flock of tiny birds: Smudges and Tangles, Hollows, Blanks, Static, Murmurs and Dustleaves, and with them every tangled day, each one flying home along its own thread to the person it belonged to.`,
    `Out on the water the seam of the world closed, as quietly as a door in another house. The Tide, which had stood a finger high all week, sank back to its ordinary silver, and the lamps along the Quay burned steady.`,
    `"It was only ever lost things," Wren whispered. "And out-of-place ones. Waiting for someone to say them back."`,
  ],
  wren: `There was a tear in time the size of a mountain, and we sewed it. Not all of what was in it, and not ever all. But enough that it could rest, and so could he. Let me write that down, and then let me not write down anything else for the rest of tonight.`,
};

// ADDED: "Days in Their Places". Shown once after the first victory, as short scenes on the map.
// Everything in it follows the Seam's rules: only tangled days come home. Wren's mother's face does not.
export const SECOND_EPILOGUE = {
  id: 'epilogue_days_in_place', title: `Epilogue Two: Days in Their Places`,
  text: [
    `In the Clockwork Market, all one hundred and twelve clocks gave one small click together, and the hands that had stood at nine minutes past eleven for a year and a night moved on to ten past. The stall-keepers stopped and looked up. Then somebody laughed, and someone else began to wind the stall clocks by hand, though they did not need it.`,
    `On the Tidal Stair, a baker remembered that his loaves were for a christening, and ran. In Lantern Street a woman's dog trotted up, and she called it by three names, and it answered to all of them, because three children in three different years had each named it, and she had been right about every one. On a bench by the harbour two old men stopped arguing. They were brothers. Each of them had remembered the other in a different year, and each of them had been perfectly correct.`,
    `Mosk the ferryman sat in his boat, quite still, for a long time. Then he said a name aloud, and said it again, and said it a third time, in case it ran off. "Wenna," he said. "Her name was Wenna." Nobody heard him but the river, and the river, as ever, kept it.`,
    `In the Archive, Wren opened the oldest ledger and found that the old ink had come back under her own new lines, faint as a watermark. She read a line or two, then closed it. "I think I will leave them as they are," she said. "The city wrote them again in its own words. I like its words."`,
    `That evening she asked her father to describe her mother. Edrin Halloway sat on the stool in the Archive in his lamplighter's coat, with a hand on his bad knee, and said it all slowly, as if each piece were a lamp to be lit. A scar through the left eyebrow, from a lamp glass. A brass key in her hair, for a pin. A yellow scarf. A laugh that started before the joke was done. Wren listened, and painted. It was not exactly her mother. It was near enough to say good night to. She said good night to the last lamp, as she had done every night since she was eight, and it was a little brighter than it had been.`,
    `Under that lamp Old Tansy poured two cups of rosemary tea and passed one along the bench to a thin man in an old coat. "You smell of lamp oil," she said. "Drink your tea." She did not say who she thought he was. She hummed a few notes of something instead, and he hummed the next few, and neither of them said a word about how they knew it. Later, when she was sure he was listening, she told him what she had never told anyone: that the river had been at the sluice already that night, and that a hand's width had kept the Gate standing. "I did not do it only for the nine," she said. "I should have said so sooner."`,
    `At the end of the week the Winder wound the Mother Clock one last time, carefully, and gave the key to Wren. Then he went and sat by the water. The Quay folk took it in turns to leave a lamp lit for him, and he never once asked them to.`,
  ],
  // The shipped BOSS_EPILOGUE below stays as the last beat, so the story ends on the Tide being the river.
};

// A short epilogue beat, shown once after the first victory. Honest about the Tide: it comes tomorrow. KEPT AS SHIPPED IN THE FIRST DRAFT.
export const BOSS_EPILOGUE = [
  `The Tide came back the next evening, as the Tide does. It was thin, and silver, and it left four or five small shapes on the Quay, no larger than a handful of lint.`,
  `You walked down with Wren, and the two of you said them back one at a time, without any hurry. Along the water, the lamps burned steady.`,
  `"Same as ever," Wren said, and smiled. "Come when you like. Go when you must."`,
];

// CHANGED: the lore entry for the giant, now the Seam's shape.
export const BOSS_LORE = {
  id: 'lore_great_forgetting', title: `The Great Forgetting`, unlock: 'seam:closed',
  text: [
    `The old songs say that every lost thing in Veyra went somewhere, and that for nine hundred years they all went to the same place. The Quay folk say that on the highest tide of the year you can see it: a giant of grey mist with a pale glow for a face, standing on the Lethe.`,
    `What the songs did not know is that the giant was not made of lost things alone. It was made of days that had been tangled out of order on a thread, and held there by one lonely man who could not bear to let an evening end.`,
    `The Wardens never fought it. They had a different idea. They said that the way to deal with a very large Forgetting is the way to deal with a very small one: say the thing back, kindly, one piece at a time, until it can rest. It turns out that the same is true of a Warden.`,
  ],
};

// ADDED: foreshadowing. All new Chronolog entries and one Gate line. No shipped text is edited.
// Each entry is two or three sentences. Nothing names the Winder. A reader sees the ring and hand mark and a worn key.
export const FORESHADOW = [
  { id: 'lore_p_winding_mark', title: `A Ring With One Hand`, unlock: 'gate:M1',
    text: [
      `Under the rust at the foot of the last lamp on the Quay, someone long ago worked a small mark into the iron: a ring with a single hand inside it, like a clock with nothing to say.`,
      `Tansy says the lamplighters call it the winding mark, and rub it for luck on their way past. She does not know who made it. She rubs it anyway.`,
    ] },
  { id: 'lore_p_hour_unwritten', title: `The Hour Nobody Wrote`, unlock: 'gate:M5',
    text: [
      `The Wardens' timetable for the Tide runs for nineteen years, every night of it, and there is no entry for nine minutes past eleven on the night of the great Tide. It simply is not there. The clocks stopped on a minute the Wardens never planned for.`,
      `On the back plate of the Mother Clock is the ring with one hand. The winding key was left in the lock, and when you put your palm on it, it was warm.`,
    ] },
  { id: 'lore_p_oldest_stone', title: `The Oldest Stone`, unlock: 'gate:M6',
    text: [
      `At the foot of the Tongues Bridge, below the waterline in a dry summer, is a block older than the rest. Beside it, cut small, is the ring with one hand, and one word of the old tongue. You can read it now. It says: Wait.`,
      `Wren says it might be a builder's note. She says it quickly, and does not look at the stone again.`,
    ] },
  { id: 'lore_p_patron', title: `Someone Is Very Fond of Us`, unlock: 'gate:M9',
    text: [
      `In the Order's record room there is a standing order that has never been cancelled: oil for the lamps and wicks for the lamps, paid every month for eleven years from a purse stamped with a ring and a single hand. Nobody in the Order has ever met the person who pays.`,
      `"Someone is very fond of us," Ennick said, and then, because he had been practising, he said what he actually thought: "I do not like it. A gift that never asks for anything is a kind of asking."`,
    ] },
  // GATE_TALK row for M12 (the existing object has M1 to M11). Wren speaks.
  { id: 'gate_talk_M12', key: 'M12', who: 'wren',
    text: `"The Tide stopped on the bridge, a yard from your feet. Did you hear a tick? Like a clock? No. Never mind. Probably it was only my own heart. I was very frightened. I did not write it down."` },
];

// ADDED: new KEEPING_LINES for the Year of Keeping, the last weeks before the Great Forgetting is reachable.
export const SEAM_KEEPING_LINES = [
  `The Tide came up a finger higher last night. Wren measured it against the lamp-post. She would rather you did not mention it to Tansy.`,
  `If you stand very still beside the last lamp, you can almost hear it tick.`,
  `Some mornings feel as if they have happened before. Wren says that is only the habit of the year. She is not entirely sure.`,
];

// ADDED: four new Undercroft tablets, below Ysolde's lamp. Written by a later hand, never signed, with the ring and
// hand mark cut at the foot. For src/data/crypt.js TABLETS (ids are new, existing tablets are unchanged).
export const NEW_TABLETS = [
  { id: 'tab_p_winder_clocks', depth: 75, title: `The Winder of the Clocks`,
    text: `Not every Warden walked a route. One of us wound the clocks. I kept the timetable of the Tide for nineteen years at a time, and I never missed a night. I tell you so you will know it was not carelessness. When the lamps went out in the city above, I went down to see why, and I found a place where the river's warmth comes up through the stone, and the hours there were loose.` },
  { id: 'tab_p_warden_stayed', depth: 80, title: `A Warden Who Stayed`,
    text: `The others went up, or went home, or forgot. I stayed at the last lamp until the last of the oil was gone, and then I came down here, because a thread was loose and I have always been unable to leave a loose thread alone. I only meant to hold it until someone came who could hold it better. I have been holding it a long time. I am not complaining. It is only that my hands are tired.` },
  { id: 'tab_p_thread_warm', depth: 90, title: `The Thread Is Warm`,
    text: `I am not trapped. I want that understood. I can climb out whenever I choose. But the thread has the whole evening on it: the lamps, the singing, the old Wardens laughing on the Quay steps, every name said aloud. If I let go, it goes where everything goes. So I do not let go. I have written my name on the ledge above, so that I do not forget it. I cannot read it any more.` },
  { id: 'tab_p_one_evening', depth: 100, title: `One Evening`,
    text: `I have kept it. It is a good evening, perhaps the best there ever was. But the lamps will not go out, and nobody goes home, and the songs do not end. I used to think a day was something to keep. I begin to think it is something to finish. If you have come this far, and you are kind, and you remember things in order, I would be grateful if you said my name. I think it begins with a sound like a wick being trimmed.` },
];

// ---------- wiring helpers (added when the chapter was built) ----------
export const SEAM_UI = {
  title: `The Seam`,
  cardTitle: `Something waits on the water`,
  cardText: `The Tide has climbed a finger higher every night, and the last lamp on the Quay has begun, very faintly, to tick. Wren is waiting at the water's edge.`,
  rules: `Four parts: the Hem of the Cloak, the Body of Mist, the Pale Glow and the Stitch. Each part is made-up material and has its own Resolve. A miss shows you the answer and asks again. You can rest at any time, and what you finished stays finished. Nothing is locked, nothing is lost, and nothing here changes your skill estimates or earns Lumen.`,
  stitchRules: `The Stitch asks for the nine days in order. Six in their places ties it off. If it is fewer, nothing is lost: you try again another day with a new thread.`,
  doneCard: `The Seam is closed, and the days went home. You can read Chapter Thirteen and the second epilogue under Chapters in Veyra.`,
  retryCard: `The thread holds, but it is not tied off yet. Come back whenever you like, with a new thread.`,
  restLine: BOSS_LINES.rest,
};
// The Winder's coach lines use Wren, who stands beside the player in every phase.

// The five details of Wren's mother's face that the player has been asked to keep. The portrait is painted from them.
export const FACE_DETAILS = [
  { id: 'wf_scar', text: `a scar through the left eyebrow, from a lamp glass` },
  { id: 'wf_pin', text: `a brass lamp key pinned in her hair` },
  { id: 'wf_scarf', text: `a yellow scarf, winter and summer` },
  { id: 'wf_laugh', text: `a laugh that started before the joke was done` },
  { id: 'wf_tune', text: `the tune she hummed, The Last Lamp` },
];
export const PORTRAIT_NOTE = {
  title: `Wren's portrait`,
  intro: `Wren painted her mother from five things that were kept for her. A face is not a thing you keep. It is a thing you can rebuild from what people kept.`,
  kept: `You kept this one.`,
  told: `This one was told to you again, and Wren kept it for you.`,
};

// The chapter as one readable text (for Veyra, Chapters, and the lore guide). Spoken lines are plain paragraphs.
export const SEAM_CHAPTER = {
  id: 'chapter_13_seam', title: GREAT_FORGETTING.chapter.title, quest: GREAT_FORGETTING.chapter.quest,
  text: [
    GREAT_FORGETTING.unlock,
    ...BOSS_INTRO,
    ...BOSS_WINDER.appears, ...BOSS_WINDER.pitch, BOSS_WINDER.wren, BOSS_WINDER.set,
    ...BOSS_WINDER.name, BOSS_WINDER.nameAsk.ifNot, BOSS_WINDER.roll, BOSS_WINDER.letGo,
    ...BOSS_ENDING.text, BOSS_ENDING.wren,
  ],
};
export const EPILOGUE_TWO = { id: 'epilogue_days_in_place', title: SECOND_EPILOGUE.title, text: [...SECOND_EPILOGUE.text, ...BOSS_EPILOGUE] };

// All new Chronolog entries from this chapter (lore.js shape). Ids are permanent once released.
export const SEAM_LORE = [
  ...FORESHADOW.filter((x) => x.unlock),
  { ...SEAM_RULES, art: 'lore_winding_mark' },
  BOSS_LORE,
  { id: 'lore_p_third_verse', title: `The Part the Quay Folk Only Hum`, unlock: 'wren:beat:wf_b9_third_verse', text: [
    `The Lamplighter's Song has a third verse that people mostly hum. Tansy says it is the part for the very end of the evening.`,
    `Trim the wick and turn the key, / Tallow keeps the lamp for me. / By river stones and light, go home: / the last lamp waits, and none walk alone.`,
    `Everyone on the Quay took "Tallow" to mean candle fat. Wren says her mother never said otherwise.`,
  ] },
  { id: 'lore_wren_face_kept', title: `What Was Kept for Her Face`, unlock: 'wren:scene:face', text: [
    `You have kept four things about Marit Halloway's face for Wren: the scar through the left eyebrow, the brass key in her hair, the yellow scarf and the laugh that began before the joke was over.`,
    `Wren says she turns them over in the evenings like coins. "I still cannot see her. But I can see where she would be standing. That is something. That is a great deal."`,
  ] },
  { id: 'lore_wren_last_lamp', title: `The Last Lamp, Kept`, unlock: 'wren:scene:lamp', text: [
    `You kept the tune. You also kept what Marit was doing while she hummed it: lighting the lamps along the Quay, one to twenty-two.`,
    `Wren hummed it for you on the stairs of the Archive, once, all the way through. The lamp in the stairwell brightened a little, which Tansy says lamps do not do. Wren says they do for her.`,
  ] },
  { id: 'lore_wren_keepsakes', title: `Wren's Keepsakes`, unlock: 'wren:held:1', dynamic: 'wren_keepsakes', text: [] },
];
// Extra people shown in Veyra, People once their story has begun. unlock uses the same keys as lore entries.
export const SEAM_PEOPLE = [
  { id: 'edrin', name: `Edrin Halloway`, role: `Wren's father`, art: 'portrait_edrin_halloway', tiers: [
    { unlock: 'wren:beat:wf_b2_blue_door', text: `A lamplighter of the Quay, who lit lamps twenty-three to forty-four. Quiet, with a bad knee and a house at number thirty-one, Quay Row, whose blue door he has been promising to repaint for twenty years.` },
    { unlock: 'wren:beat:wf_b8_edrin', text: `He came to the Amphitheatre to watch his daughter and stayed to give you the things he remembers of his wife's face. He asked you to keep them. "She would want her face to have someone."` },
    { unlock: 'wren:beat:wf_b10_green_door', text: `He has finally repainted the door. It is green. He says blue was only ever a mistake he never fixed.` },
  ] },
  { id: 'marit', name: `Marit Halloway`, role: `Wren's mother`, art: null, tiers: [
    { unlock: 'wren:beat:wf_b3_the_tune', text: `A lamplighter of the Quay who lit lamps one to twenty-two and hummed a tune with no words while she did it. She died in the winter of the long cough, when Wren was eight. The Tide took her face from Wren's memory that same week, an ordinary Tide, and nobody's fault.` },
  ] },
  { id: 'tallow', name: `Ambrose Tallow, the Winder`, role: `The last Warden of the Hours`, art: 'portrait_ambrose_tallow', tiers: [
    { unlock: 'seam:closed', text: `The Warden who kept the Tide's timetable and wound the Mother Clock. Three hundred years ago he stepped into the Seam to hold one evening in place, and nobody has said his name since. He was not cruel. He was lonely. He paid for the Order's oil and wicks for eleven years without being asked for anything, and he is remembered now: Ambrose Tallow, Warden of the Hours, who kept the last lamp.` },
  ] },
];
// The Gate talk row for Month 12 (Wren). GATE_TALK in afteryear.js gets this key added.
export const GATE_TALK_M12 = FORESHADOW.find((x) => x.key === 'M12');
