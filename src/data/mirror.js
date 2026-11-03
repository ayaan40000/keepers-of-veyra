// 1.1 content, drafted by Claude and reviewed. Wired into src/engine/mirror.js and src/ui/MirrorRoom.jsx.
// Phantom Limb: when the player enters a Thick Mist district or a boss trial, the attributes on the Character
// sheet grey to "?". A mirror room of objects from earlier weeks lets the player relight each attribute by
// recalling the picture attached to it. STORY AND DISPLAY ONLY: no data is lost, no score is lowered, relighting
// adds no damage and no spells (battle damage stays deterministic). A relit attribute may restore its glow and its
// study aid inside the next battle (Scroll of Order and similar), nothing more. No claim about state-dependent memory.
// The prompts use the Major System on harmless numbers (house, shelf and page numbers). No em dashes.

export const MIRROR_HONEST = 'The mist only hides the numbers on the sheet. Nothing is lost, no score is lowered, and relighting adds no damage. It is a small story scene that practises the Major System.';

// Shown on the Character sheet when the attributes grey out.
export const GREYED = {
  title: 'The mist has settled on the sheet',
  line: 'The Thick Mist is up, and the numbers on your sheet have gone soft and grey. They show "?" for now. They are still yours.',
  boss: 'Something large is nearby, and the sheet has gone quiet. The numbers show "?" until the mist lifts.',
  tooltip: 'Hidden by the mist. Nothing is lost.',
  hint: 'There is a mirror room in the Mirror Wards. Visit it to bring the numbers back.',
  lifted: 'The mist has thinned, and your sheet is clear again.',
};

// The mirror room.
export const MIRROR_ROOM = {
  title: 'The Mirror Room',
  describe: [
    'A narrow room at the back of the Mirror Wards, lined with old silver glass. Each mirror holds a small object from an earlier week: a door with a number, a shelf, a page.',
    'The glass is fogged. When you remember the picture that belongs to an object, the fog draws back from its mirror, and the attribute it belongs to glows again on your sheet.',
  ],
  enter: 'You step into the Mirror Room. Seven mirrors wait, each one dull.',
  how: 'Look at the object and the number, turn the number into a picture with the Major System, and say what you see.',
  accepts: 'Any picture whose consonant sounds match the number works. Your picture does not have to match ours.',
  allLit: 'All seven mirrors are clear. The room is bright, and the glass looks almost pleased with itself.',
};

// One relighting prompt per attribute. Major System: 0 s/z, 1 t/d, 2 n, 3 m, 4 r, 5 l, 6 j/sh/ch/soft g, 7 k/hard g, 8 f/v, 9 p/b.
// code = the digits; example = one valid answer (the checker should accept any word whose consonant sounds give
// the code, such as net, knot or night for 21); sounds = the sound explanation to show after the answer.
export const MIRROR_ATTRS = {
  imagery: {
    name: 'Imagery', mirror: 'the mirror with the blue door',
    prompt: 'A blue door in the glass carries the house number 21. What picture does 21 give you?',
    code: '21', example: 'net', sounds: '2 is n, 1 is t: n and t. A net, a knot or a night all fit.',
    relit: 'The blue door steadies in the glass, and the fog clears from your Imagery. The picture is bright again.',
  },
  linking: {
    name: 'Linking', mirror: 'the mirror with the lamp chain',
    prompt: 'A chain of small lamps ends at a plate with the number 15. What picture does 15 give you?',
    code: '15', example: 'towel', sounds: '1 is t, 5 is l: t and l. A towel, a tile or a doll all fit.',
    relit: 'The lamp chain hangs straight and the last link catches the light. Your Linking glows again.',
  },
  palace: {
    name: 'Palace', mirror: 'the mirror with the cellar shelf',
    prompt: 'A cellar shelf in the glass is marked 32. What picture does 32 give you?',
    code: '32', example: 'moon', sounds: '3 is m, 2 is n: m and n. The moon, a man or money all fit.',
    relit: 'The shelf stands in its cellar again, with every stop in its place. Your Palace glows.',
  },
  faces: {
    name: 'Faces', mirror: 'the mirror with the portrait frame',
    prompt: 'A portrait frame in the glass has the number 76 on its brass plate. What picture does 76 give you?',
    code: '76', example: 'cage', sounds: '7 is k, 6 is j: k and a soft g sound. A cage, a coach or a catch all fit.',
    relit: 'The portrait comes clear, and the face in it looks back at you kindly. Your Faces glow again.',
  },
  numbers: {
    name: 'Numbers', mirror: 'the mirror with the clock face',
    prompt: 'A small clock in the glass has a house number, 98, on its case. What picture does 98 give you?',
    code: '98', example: 'beef', sounds: '9 is p or b, 8 is f or v: b and f. Beef, a puff or a pave all fit.',
    relit: 'The little clock ticks once, then keeps time. Your Numbers glow again.',
  },
  vocab: {
    name: 'Vocabulary', mirror: 'the mirror with the open book',
    prompt: 'An open book in the glass shows page 83. What picture does 83 give you?',
    code: '83', example: 'foam', sounds: '8 is f, 3 is m: f and m. Foam, fame or a fume all fit.',
    relit: 'The page turns by itself, very gently, and the words stay put. Your Vocabulary glows again.',
  },
  structure: {
    name: 'Structure', mirror: 'the mirror with the shelf of boxes',
    prompt: 'A shelf of tidy boxes in the glass is labelled 55. What picture does 55 give you?',
    code: '55', example: 'lily', sounds: '5 is l, so 55 is l and l. A lily, a lull or a lolly all fit.',
    relit: 'The boxes slide into their rows with a soft click. Your Structure glows again.',
  },
};
export const MIRROR_ORDER = ['imagery', 'linking', 'palace', 'faces', 'numbers', 'vocab', 'structure'];

// Miss: the answer is shown, the mirror stays foggy for now, nothing is lost.
export const MIRROR_MISS = {
  line: 'The glass stays foggy for now. Here is one picture that fits: {example}. {sounds} Try again whenever you like.',
  skip: 'Leave this mirror foggy. Your sheet stays hidden only while the mist is up, and nothing is lost.',
};

// Where the story says it happens.
export const MIRROR_WREN = 'Wren says the mist does this to everybody\'s sheet, and it always lifts. She also says the Mirror Room is a good place to practise your number pictures when you want a quiet minute. Mostly she says she likes the mirrors.';
