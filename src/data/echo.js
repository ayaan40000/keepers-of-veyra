import { VIGIL_SCENE } from './vigil.js';
// v0.10 Echo battles: story, coaches (the Keepers' Circle) and scene material.
// First drafts by the local Qwen model, then rewritten and edited by hand. No em dashes. {name} is the player's alias.

export const ECHO_HONEST = 'Battles practise the methods on made-up material. They are not a test of real-life memory, and they do not make memory better in general.';

// What a Forgetting looks like in each skill. Names are plain and a little fond.
export const FORGETTINGS = {
  imagery: { name: 'Smudge', kind: 'a blurred picture' },
  linking: { name: 'Tangle', kind: 'a loose thread of a story' },
  palace: { name: 'Hollow', kind: 'a room with the furniture gone' },
  faces: { name: 'Blank', kind: 'a face without a name' },
  numbers: { name: 'Static', kind: 'a drift of numbers' },
  vocab: { name: 'Murmur', kind: 'a word on the tip of the tongue' },
  structure: { name: 'Dustleaf', kind: 'a page of loose facts' },
};

export const ECHO_BEAT = {
  id: 'echo_first',
  title: 'A Forgetting on the Quay',
  text: [
    'The Tide was thin that evening, a few silver threads curling around the lamp-posts of Lamplighters\' Quay. Under the fourth lamp sat a small grey shape, round and soft at the edges, like a heap of lint swept up by the wind. It was holding something carefully in front of itself.',
    '"Do not stare," Wren whispered. "It is only shy." She explained that this was a Forgetting, what the Tide leaves behind when it loosens a memory. It does not bite. It simply waits to be remembered.',
    'The thing it held was a picture you had learned some weeks ago, a little blurred. You found you could still say what it was. You said it aloud. The grey shape gave a sigh like a kettle going off the boil, grew lighter, and drifted home along the water. Wren laughed. "See? Not a monster. Just a lost thing."',
  ],
};

// Keepers' Circle coaches. They speak before a battle and after it, never during a question.
// gate: the module gate that brings them into the Circle (Wren is there from the start).
export const COACHES = {
  wren: { name: 'Wren', gate: null, before: [
    'Hold the first picture steady before the mist reaches it. I will be right behind you with my cards, though I promise not to peek.',
    'Remember, it is only the Tide\'s leftovers. Be clear with it, and be kind.',
  ], win: 'That went in clean. Look at it go home! I may write this one down, just for the pleasure of it.', rest: 'Setting it down for today is perfectly fine. Every answer you saw is still waiting, and we will meet it again soon.' },
  tansy: { name: 'Tansy', gate: 'M1', before: [
    'Take a breath of rosemary and hold the first picture, dear. The mist only takes what slips loose, so keep your grip gentle and steady.',
    'There is no hurry. Let each picture come up warm, like bread from the oven.',
  ], win: 'Well done, love. It looked so glad to go home. Come by the stall and I will pour you a cup.', rest: 'Sit by my stall and have some tea. We saw what slipped today, and that is how it gets held next time.' },
  fennick: { name: 'Fennick', gate: 'M2', before: [
    'Fix each one to its spot, nice and firm, before you answer. That\'ll hold.',
    'Walk it slowly. A good route does not mind being walked twice.',
  ], win: 'That held, all of it. The Gallery feels quieter already.', rest: 'The fog took a few today. It happens to the best corridors. We will walk those stretches again.' },
  hask: { name: 'Hask', gate: 'M3', before: [
    'Plain hands, clear eyes. One item at a time.',
    'Walk slow. Make it real. Stay steady.',
  ], win: 'Good work. That\'ll do.', rest: 'No harm done. We go again when you are rested.' },
  isolde: { name: 'Isolde', gate: 'M4', before: [
    'Anchor your images tight, darling. The Tide only takes what slips loose.',
    'I have a small wager on you. Do not feel the weight of it. Feel the odds.',
  ], win: 'Splendid. That is exactly the sort of bet I like to have made.', rest: 'A fair try, and I never mind losing a bet on you. We shall wager again after a good night\'s sleep.' },
  mosk: { name: 'Mosk', gate: 'M5', before: [
    'Pin the memory down, lad. The Tide eats what you let slip. Keep your feet planted.',
    'Do not chase the mist. Stand firm and let the thing come to you.',
  ], win: 'Hmph. Held fast. I have seen worse boatmen manage worse currents. Well done, Keeper.', rest: 'Put the load down, friend. A tired mind is the same as a tired leg. Another day.' },
  ennick: { name: 'Ennick', gate: 'M7', before: [
    'Breathe. I have slipped on exactly this kind of thing before, so I know it happens. Steady, and look straight at it.',
    'If you do not know, say what you think and then look at the answer. That is all a miss is.',
  ], win: 'You held it! I wrote that down. I will write down more of these than I ever wrote down my mistakes.', rest: 'A miss only tells us where to look next. I keep a notebook for that and it is not as bad as it sounds.' },
};
// Which friend coaches which kind of Forgetting. Wren steps in until that friend has joined the Circle.
export const COACH_FOR = { imagery: 'tansy', linking: 'mosk', palace: 'fennick', faces: 'wren', numbers: 'isolde', vocab: 'ennick', structure: 'hask' };

// Closing hook for the Year of Keeping: shown when the side quest "The Keepers' Circle" is done.
export const ECHO_HOOK = [
  'The Year of Keeping settled over Veyra like soft wool. The twelve districts stood whole, and you walked the old routes a little each day, with a light step, the way a person walks a street they love.',
  'Wren was waiting at the water\'s edge as dusk turned the sky violet and gold. "The Tide still leaves a few Forgettings every night," she said. "That is only the river being the river." Along the Quay the Keepers\' Circle was gathering: Tansy with her teapot, Fennick with his keys, Isolde, Mosk, Ennick and Hask. Each evening one of them coached and one was coached, and nobody kept score.',
  'Wren put a small brass lamp in your hands, its glass warm against your palm. "The Circle will always have a place for you," she said. "Come when you like. Go when you must. The lamps will be lit either way."',
];

// ---------- technique choice ----------
export const TECHNIQUES = [
  { id: 'link', name: 'Link', blurb: 'Make each thing act on the next in one small story.' },
  { id: 'palace', name: 'Palace', blurb: 'Leave each thing at its own stop along a route you know.' },
  { id: 'major', name: 'Major', blurb: 'Turn digits into sounds, then into a picture.' },
  { id: 'keyword', name: 'Keyword', blurb: 'Turn the name or word into a picture, and stick it to a feature.' },
];
export const COACH_ASK = 'What is this material made of? Pick the move you would use.';

// ---------- scenes (made-up material, practice only: no Lumen, no relics, no skill changes) ----------
export const SCENES = {
  packing: {
    id: 'packing', title: 'Packing Bay', gate: 'M1', coach: 'tansy', study: 50, fit: ['link', 'palace'],
    intro: 'A cart waits at the Packing Bay with a list of things to load. Halfway through, the foreman will call out a question. Keep your pictures steady.',
    tips: { major: 'Major turns numbers into pictures, and this list has no numbers. A story or a route fits a list better.', keyword: 'Keyword helps with names and foreign words. For a plain list, a short story works better.' },
  },
  speech: {
    id: 'speech', title: 'Speech Hall', gate: 'M2', coach: 'fennick', study: 50, fit: ['palace'],
    intro: 'You are to give a short talk with no notes. Five points, five places along the hall. Leave one point at each place.',
    tips: { link: 'A story can work, but a talk must come back in order and on time. A route gives each point its own place, so a palace fits better.', major: 'There are no numbers here. Try a route along the hall.', keyword: 'Keyword is for names and words. Points along a route want a palace.' },
  },
  crossroads: {
    id: 'crossroads', title: 'Crossroads', gate: 'M2', coach: 'hask', study: 55, fit: ['palace', 'link'],
    intro: 'Six turns on a road you have never walked, each at a landmark. A route in your head, a place for every turn.',
    tips: { major: 'Turns are not numbers. A route and a short story suit them better.', keyword: 'Keyword is for names and words. A turn at a landmark wants a place in a route.' },
  },
  gala: {
    id: 'gala', title: 'Networking Gala', gate: 'M3', coach: 'wren', study: 55, fit: ['keyword', 'link'],
    intro: 'Five guests, five names. Pick one feature that will not change, turn the name into a picture, and stick the picture to it.',
    tips: { palace: 'A palace stores things in order, and guests do not come in an order. Turn each name into a picture and fix it to a face.', major: 'There are no numbers here. A picture for each name does the work.' },
  },
  market: {
    id: 'market', title: 'Night Market', gate: 'M4', coach: 'isolde', study: 50, fit: ['major', 'link'],
    intro: 'Five stalls, five prices. The prices are numbers, and you already have a way of turning numbers into pictures.',
    tips: { palace: 'A palace helps with order. Here the hard part is the numbers, and Major turns them into pictures.', keyword: 'Keyword is for names and words. The prices are numbers, so Major fits.' },
  },
};
// 1.1: the Long Vigil is a sixth scene, but it uses the player's own old items, so it has its own button and is not in SCENE_ORDER.
SCENES.vigil = VIGIL_SCENE;
export const SCENE_ORDER = ['packing', 'speech', 'crossroads', 'gala', 'market'];

// Invented, harmless material.
// Pools widened Nov 2, 2026 with Qwen drafts (filtered and hand-picked) so battles repeat less.
export const MARKET_GOODS = ['pears', 'lamp oil', 'thread', 'tea', 'honey', 'soap', 'candles', 'rope', 'apples', 'salt',
  'fresh bread', 'cheese', 'strawberry jam', 'smoked fish', 'linen', 'needles', 'nails', 'hammer', 'wooden spoon', 'clay pot', 'wool blanket', 'iron kettle', 'woven basket', 'ceramic bowl', 'chocolate', 'carrots', 'sweet corn', 'green beans', 'lemonade'];
export const LANDMARKS = ['bakery', 'fountain', 'mill', 'bridge', 'chapel', 'well', 'barn', 'orchard', 'clocktower', 'smithy', 'dovecote', 'ferry',
  'ancient oak', 'bell tower', 'mossy wall', 'willow tree', 'water tower', 'stone steps', 'iron fence', 'cobble lane', 'rock arch', 'market stall'];
export const SPEECH_STOPS = ['the doorway', 'the first window', 'the fountain', 'the bench', 'the stage steps'];
export const SPEECH_POINTS = ['welcome', 'budget', 'schedule', 'volunteers', 'roof', 'lunch', 'parking', 'garden', 'safety', 'thanks', 'training', 'maps',
  'harvest festival', 'beekeeping', 'tool library', 'block party', 'food bank', 'recycling', 'tutoring', 'class schedule', 'cash flow', 'marketing', 'customer service', 'hiring', 'inventory', 'tax basics'];
export const TURNS = ['left', 'right', 'straight on'];
