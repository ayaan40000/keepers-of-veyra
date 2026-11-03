// 1.1 content, drafted by Claude and reviewed. Wired into src/engine/audit.js and src/ui/Audit.jsx.
// Wren's Audit: Wren walks a palace route aloud and makes mistakes that match the player's own error habits.
// The player says which kind of mistake she made (picked from the game's error types, never typed freely) and
// fixes it. Wren, the routes and the stops are invented story. The items may be real, checked, public facts and
// names (owner decision of Nov 2, 2026): each real item carries a `fact` line so it can be checked again.
// If a fact could not be checked it was not used. Nothing here is a claim that a real person or company
// endorses Mnemos. No rewards except Chronolog entries; no score or skill change; a wrong pick costs nothing.
// Wording is "may help", never a strong claim. No em dashes.

export const AUDIT_HONEST = 'Explaining a route to someone else may help you notice what you know and what you only think you know. The Audit is practice. It changes no score, and a wrong guess costs nothing.';

// The game's own error types (see COACH in src/engine/session.js). 'false' is the Month 9 false-memory slip
// and appears only once the Mirror Wards gate (M9) is passed. Timeouts are never used in an Audit.
export const AUDIT_ERROR_TYPES = [
  { id: 'omission', label: 'Empty slot', hint: 'She left something out, or went blank at a stop.' },
  { id: 'substitution', label: 'Wrong item', hint: 'She said a different thing from the one that belongs there.' },
  { id: 'order', label: 'Order slip', hint: 'The right things, in the wrong places.' },
  { id: 'false', label: 'Added item', hint: 'She added something that was never on the route.', unlock: 'M9' },
];
export const AUDIT_ASK = 'What kind of slip was that? Pick one.';

// Wren's opening, by the kind of slip the player makes most. She makes that kind on purpose, and kindly.
export const AUDIT_INTRO = {
  general: 'Right. Your turn to be the teacher. I will walk a route out loud, and somewhere along it I will slip. You tell me what kind of slip it was, and then help me put it right.',
  omission: 'I have noticed that blanks are the most common slip for both of us. So I will go blank once on purpose. Catch me if you can.',
  substitution: 'Funnily enough, my usual slip is saying the wrong thing with great confidence. I will do that once. Tell me when I have.',
  order: 'Right things, wrong places: that one is a classic, and I have made it more times than I would like to say. Watch where I put things.',
  false: 'The sneaky one is adding something that was never there. It feels exactly like remembering. Listen for the thing that does not belong.',
};

// Wren's side of the conversation after the player picks.
export const AUDIT_THANKS = {
  omission: 'Yes! A blank. I could feel the gap and I just stepped over it. Thank you for hearing it.',
  substitution: 'Exactly. A wrong item, said with total confidence. I was very sure, which is what makes it tricky.',
  order: 'Right again. All the pieces were there, and I put two of them in each other\'s places. Well heard.',
  false: 'Yes. That was never on the route. It seemed so natural that I did not notice I had added it. That is the sneaky part.',
};
export const AUDIT_REFRAME = {
  // Shown when the player picks a different type. The answer is shown and the walk goes on. No penalty.
  wrong_pick: 'Not quite, but a good guess. Look at it again: {truth} That is a {label}. Many people mix those up.',
};
export const AUDIT_FIX_ASK = {
  omission: 'What should have been at that stop?',
  substitution: 'What should I have said at that stop?',
  order: 'Where do those two belong? Put them back.',
  false: 'Which stop should I not have added, and what is on the route instead?',
};
export const AUDIT_FIXED = {
  omission: 'That is it. Now I can see it in the place. I will put a stronger picture there so it does not go blank again.',
  substitution: 'Of course. I had the right place and the wrong thing in it. I will make the picture stranger so the two stay apart.',
  order: 'Yes. I will walk it once more from the start, with each picture touching the next stop.',
  false: 'Yes, that is the route. I will take the extra thing out and keep to what I actually put there.',
  close: 'Thank you. It is easier to see my slips than my own, and the same may be true of yours. I may write that in my notebook.',
  miss: 'Not this time. Here is the answer: {truth} I will ask again another day, and we will see whether it sticks.',
};
export const AUDIT_END = 'That was a good walk. I made four slips and you caught most of them. If you are ever unsure about your own route, try walking it aloud to someone, even a lamp-post. It may help.';
export const AUDIT_END_NO_FALSE = 'That was a good walk. I made three slips and you caught most of them. Try walking your own routes aloud sometimes. It may help.';

// Three invented routes in Veyra. stops[i] = { stop, item, real, fact }. Items are short enough to type.
// walk = what Wren says, in order. at = index into stops (null for an added extra), type = the slip made (null for none).
// For order slips, two walk steps share type 'order' and `pair: true` on the second. Each route holds one slip of each type.
// The false-memory step is skipped until M9.
export const AUDIT_ROUTES = [
  {
    id: 'quay_round', title: 'The Quay Round', district: "Lamplighters' Quay", unlock: 'start',
    intro: 'The Quay Round: nine stops from the gate arch to the last lamp. I put a capital city or an everyday thing at each one, and I will say them in order.',
    stops: [
      { stop: 'the gate arch', item: 'Canberra', real: true, fact: 'Canberra is the capital of Australia.' },
      { stop: 'the first lamp', item: 'a brass kettle', real: false },
      { stop: "Tansy's stall", item: 'Ottawa', real: true, fact: 'Ottawa is the capital of Canada.' },
      { stop: 'the ferry steps', item: 'seven blue buoys', real: false },
      { stop: 'the rope store', item: 'Nairobi', real: true, fact: 'Nairobi is the capital of Kenya.' },
      { stop: 'the net loft', item: 'a tin whistle', real: false },
      { stop: 'the fish stairs', item: 'Lima', real: true, fact: 'Lima is the capital of Peru.' },
      { stop: 'the oil shed', item: 'Wellington', real: true, fact: 'Wellington is the capital of New Zealand.' },
      { stop: 'the last lamp', item: 'a green umbrella', real: false },
    ],
    walk: [
      { at: 0, say: 'At the gate arch: Sydney. A big picture, harbour and all.', type: 'substitution', truth: 'Canberra was at the gate arch.' },
      { at: 1, say: 'At the first lamp: a brass kettle, steaming.', type: null },
      { at: 2, say: 'At Tansy\'s stall: hmm. The stall is there, the awning is there, and then nothing. I will walk on.', type: 'omission', truth: 'Ottawa was at Tansy\'s stall.' },
      { at: 3, say: 'At the ferry steps: seven blue buoys, bobbing.', type: null },
      { at: 4, say: 'At the rope store: Nairobi, with a coil of rope around its neck.', type: null },
      { at: 5, say: 'At the net loft: a tin whistle, very shrill.', type: null },
      { at: 7, say: 'At the fish stairs: Wellington, dripping.', type: 'order', truth: 'Lima belongs at the fish stairs and Wellington at the oil shed.' },
      { at: 6, say: 'At the oil shed: Lima, slightly oily.', type: 'order', pair: true },
      { at: 8, say: 'At the last lamp: a green umbrella.', type: null },
      { at: null, say: 'And one more at the very end, under the umbrella: a yellow raincoat.', type: 'false', truth: 'There was no yellow raincoat on the route.', extra: 'a yellow raincoat' },
    ],
  },
  {
    id: 'gallery_walk', title: 'The Gallery Walk', district: 'The Long Gallery', unlock: 'gate:M2',
    intro: 'The Gallery Walk: nine stops from the big doors to the far wall. People, places and a few odd things, in order.',
    stops: [
      { stop: 'the big doors', item: 'Marie Curie', real: true, fact: 'Marie Curie won Nobel Prizes in both physics (1903) and chemistry (1911).' },
      { stop: 'the first window', item: 'a green glass owl', real: false },
      { stop: 'the cracked bell', item: 'Ada Lovelace', real: true, fact: 'Ada Lovelace wrote notes on Charles Babbage\'s Analytical Engine in 1843 that include an algorithm often called the first computer program.' },
      { stop: 'the marble bench', item: 'twelve brass keys', real: false },
      { stop: "the miller's portrait", item: 'Mount Kilimanjaro', real: true, fact: 'Mount Kilimanjaro, in Tanzania, is the highest mountain in Africa.' },
      { stop: 'the red rope', item: 'a clay teapot', real: false },
      { stop: 'the stair rail', item: 'Leonardo da Vinci', real: true, fact: 'Leonardo da Vinci painted the Mona Lisa.' },
      { stop: 'the skylight', item: 'a silver ladder', real: false },
      { stop: 'the far wall', item: 'the Pacific Ocean', real: true, fact: 'The Pacific is the largest and deepest ocean.' },
    ],
    walk: [
      { at: 0, say: 'At the big doors: Marie Curie, glowing faintly.', type: null },
      { at: 1, say: 'At the first window: a green glass frog.', type: 'substitution', truth: 'It was a green glass owl.' },
      { at: 2, say: 'At the cracked bell: Ada Lovelace, ringing it with a pencil.', type: null },
      { at: 3, say: 'At the marble bench: ... I can see the bench, and there is a gap. On to the next.', type: 'omission', truth: 'Twelve brass keys were at the marble bench.' },
      { at: 4, say: 'At the miller\'s portrait: Mount Kilimanjaro, dusted with flour.', type: null },
      { at: 5, say: 'At the red rope: a clay teapot, perched on the rope.', type: null },
      { at: 7, say: 'At the stair rail: a silver ladder, sliding down it.', type: 'order', truth: 'Leonardo da Vinci belongs at the stair rail and the silver ladder at the skylight.' },
      { at: 6, say: 'At the skylight: Leonardo da Vinci, peering at the sky.', type: 'order', pair: true },
      { at: 8, say: 'At the far wall: the Pacific Ocean, rolling right off the plaster. And, tucked beside it, the Mona Lisa.', type: 'false', truth: 'The Mona Lisa was never on the route.', extra: 'the Mona Lisa' },
    ],
  },
  {
    id: 'scriptorium_stair', title: 'The Scriptorium Stair', district: 'The Scriptorium', unlock: 'gate:M7',
    intro: 'The Scriptorium Stair: ten stops from the door desk up to the attic hatch. Books, an ancient stone and a few things from the ink room.',
    stops: [
      { stop: 'the door desk', item: 'the Gutenberg Bible', real: true, fact: 'The Gutenberg Bible was printed in Mainz, Germany, around 1455.' },
      { stop: 'the window desk', item: 'a blue ink bottle', real: false },
      { stop: 'the map table', item: 'the Rosetta Stone', real: true, fact: 'The Rosetta Stone is held at the British Museum in London.' },
      { stop: 'the ink stand', item: 'a jar of red sealing wax', real: false },
      { stop: 'the reading lamp', item: 'Pride and Prejudice', real: true, fact: 'Pride and Prejudice, by Jane Austen, was published in 1813.' },
      { stop: 'the spiral stair', item: 'a wooden compass', real: false },
      { stop: 'the high shelf', item: 'On the Origin of Species', real: true, fact: 'Charles Darwin published On the Origin of Species in 1859.' },
      { stop: 'the landing', item: 'a bundle of green ribbon', real: false },
      { stop: 'the turret window', item: 'Hamlet', real: true, fact: 'Hamlet is a play by William Shakespeare.' },
      { stop: 'the attic hatch', item: 'an amber lamp', real: false },
    ],
    walk: [
      { at: 0, say: 'At the door desk: the Gutenberg Bible, huge and heavy.', type: null },
      { at: 1, say: 'At the window desk: a blue ink bottle, glinting.', type: null },
      { at: 2, say: 'At the map table: ... there is a map, and I cannot see anything on it. Moving on.', type: 'omission', truth: 'The Rosetta Stone was at the map table.' },
      { at: 4, say: 'At the ink stand: Pride and Prejudice, with ink dripping from its spine.', type: 'order', truth: 'The red sealing wax belongs at the ink stand and Pride and Prejudice at the reading lamp.' },
      { at: 3, say: 'At the reading lamp: a jar of red sealing wax, melting in the light.', type: 'order', pair: true },
      { at: 5, say: 'At the spiral stair: a wooden compass, spinning on the step.', type: null },
      { at: 6, say: 'At the high shelf: Sense and Sensibility, wedged in tight.', type: 'substitution', truth: 'On the Origin of Species was on the high shelf.' },
      { at: 7, say: 'At the landing: a bundle of green ribbon, trailing.', type: null },
      { at: 8, say: 'At the turret window: Hamlet, and then Macbeth right behind it.', type: 'false', truth: 'Macbeth was never on the route.', extra: 'Macbeth' },
      { at: 9, say: 'At the attic hatch: an amber lamp, glowing through the cracks.', type: null },
    ],
  },
];

// Chronolog entries, in the lore.js shape. New permanent ids. unlock 'audit:N' = after N Audits have been finished.
export const AUDIT_LORE = [
  { id: 'lore_audit_walk', title: 'Reading the Route Aloud', unlock: 'audit:1', text: [
    'Wren has a habit she picked up in the Archive: she reads a route out loud to the nearest lamp before she trusts it. Tansy says it is the oldest teaching trick in Veyra, and that the Wardens did it to each other on the Quay at dusk, one walking and one listening.',
    'The listener was not there to judge. The listener was there to hear the slip. The Wardens said it is much easier to hear a gap in someone else\'s walk than in your own.',
  ] },
  { id: 'lore_audit_slips', title: 'Four Kinds of Slip', unlock: 'audit:3', text: [
    'The old Wardens sorted slips into four kinds and gave each a short name: the Blank, when a stop holds nothing; the Wrong Thing, when a stop holds something else; the Swap, when the right things stand in the wrong places; and the Stray, when something that was never on the route walks in and sits down.',
    'The Wardens held that a slip with a name is half mended. It is hard to fix a mistake you can only describe as "something went wrong". They taught apprentices to name the slip before they touched it.',
  ] },
  { id: 'lore_audit_listener', title: 'The Patient Listener', unlock: 'audit:6', text: [
    'There is a small bench on the Quay battlements, worn pale in the middle. It is said to be the Listeners\' bench. A Warden in training would sit there while a friend recited a route, and would say only one thing: "Tell me again, slowly."',
    'Wren has asked whether it works. Tansy says it may. She says the lamps are fonder of a Keeper who can hear a slip in a friend than one who never slips at all, and that nobody has ever met the second kind.',
  ] },
];
