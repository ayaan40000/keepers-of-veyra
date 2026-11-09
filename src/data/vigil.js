// 1.1 content, drafted by Claude and reviewed. Wired into src/engine/vigil.js and src/ui/Battle.jsx.
// The Long Vigil: a sixth Echo scene on the Lamplighters' Quay battlements at the end of each week.
// It reuses the Echo battle engine and its rules: free-entry answers, the answer shown after a miss and the item
// asked again later, no random loot, one skip. The items are the player's OWN items that were learned 1, 7 or 30
// days ago (delayed probe sets), so there is no study screen. Nothing here changes skill estimates.
// A dimmed lantern is on screen only. No timer fails the vigil: phantoms arrive at the pace of the study timer setting.
// {name} is the player's alias. No em dashes.

export const VIGIL_HONEST = 'The Vigil asks for things you learned some days ago. A dimmed lantern means a review is due, not that you did something wrong. It practises your own material and does not make memory better in general.';

// Same shape as an entry of SCENES in echo.js, so SCENE_ORDER can simply gain 'vigil'.
// study is 0 because nothing is studied: the first screen is the lantern count. fit lists every move
// because the material is the player's own mix; the technique-choice step can be skipped for this scene.
export const VIGIL_SCENE = {
  id: 'vigil', title: 'The Long Vigil', gate: 'M2', coach: 'tansy', study: 0, fit: ['link', 'palace', 'major', 'keyword'],
  intro: 'On the last evening of the week, lanterns are set along the Quay battlements. Soft, faceless phantoms come up the stair, each one carrying something you learned a while ago. Say what it carries and its lantern lights.',
  outro: 'The last phantom goes home along the water. The lanterns burn low and steady, and the Quay is quiet.',
  tips: {},
};

// Tansy keeps the watch. Wren steps in until Tansy has joined the Circle (see COACH_FOR in echo.js).
export const VIGIL_COACH = {
  before: [
    'Come up, dear, and mind the third step. Tonight the phantoms carry things from days gone by. They are not here to frighten anyone. They only want to put their bundles down.',
    'Take your time with each one. A lantern is lit by an answer, and no answer is ever late for the Tide.',
  ],
  win: 'Every lantern is burning. Sit by the wall and have some tea. The phantoms went home lighter, and so did I.',
  rest: 'Some lanterns are dim tonight, and that is all it means. We saw which ones. They will come round again, and you will meet them rested.',
};

// Phantoms are faceless, soft and sad, never scary. They carry items learned 1, 7 or 30 days ago.
export const PHANTOM_LINES = {
  arrive: [
    'A phantom comes up the stair, soft as breath on glass, with nothing where its face should be. It holds a small bundle out to you.',
    'A pale shape waits at the next lantern. It has no face, but it leans toward you the way a person leans toward good news.',
    'Another phantom drifts along the battlements, trailing a little mist, carrying something carefully in both hands.',
  ],
  carries: {
    90: [
      'This one is an Old Echo, older and fainter than the rest. It climbed all the way up from the Undercroft with something from about three months ago.',
      'An Old Echo, thin as a draught under a door. What it carries is a season old. If you know it, a lamp on the battlements will stay lit until spring.',
    ],
    1: [
      'This one carries something from yesterday. It is still warm.',
      'It holds something you met only a day ago. It has not had time to get lost yet.',
    ],
    7: [
      'This one carries something from a week ago. The edges are a little worn, the way a coin gets worn in a pocket.',
      'It holds something from seven days back. It has walked a long way to find you.',
    ],
    30: [
      'This one carries something from a month ago. It has been waiting a very long time, and it is very patient.',
      'It holds something thirty days old. Few phantoms travel that far, and they are gentle about it.',
    ],
  },
  ask: [
    'What does it carry?',
    'Can you say what is in the bundle?',
    'Say it, and the lantern will light.',
  ],
};

// A lit lantern: the answer was right.
export const LANTERN_LIT = [
  'The lantern catches, steady and gold. The phantom sets its bundle down, sighs like a kettle going off the boil, and drifts home along the water.',
  'A flame opens in the glass. The phantom nods, if a shape with no face can nod, and fades into the evening.',
  'The lantern lights. Somewhere down on the Quay a door closes softly, as if something had just come home.',
  'Gold light along the wall. The phantom is gone, and the bundle it carried is yours again.',
];

// A dimmed lantern: the answer was wrong or blank. On screen only. Nothing is lost, nothing is taken away.
export const LANTERN_DIM = [
  'The lantern glows low instead of bright. That is all. The answer is shown, and the phantom will come round again later.',
  'The flame stays small. The phantom waits without any hurry while you read what it carried.',
  'A dim lantern is only a flag that says "look here next time". The phantom is not cross. It has been patient for longer than this.',
  'The lantern flickers and settles low. Read the answer, say it once to yourself, and let the phantom go.',
];

// The one skip. Used once per vigil, and the phantom simply stays for another week.
export const VIGIL_SKIP = {
  button: 'Let this one wait',
  line: 'You let this phantom wait on the stair. It folds its hands and sits down quietly. It will find you again another week, and no lantern is dimmed.',
  none_left: 'The skip is already used tonight. This phantom needs an answer, or a look at what it carries.',
};

// The end of the vigil, by how many lanterns are lit. The engine picks the band; no band is a failure.
export const VIGIL_END = {
  all: 'Every lantern burns along the battlements. The Quay has never looked so calm. Tansy lifts her cup to you and says nothing, which from her is a speech.',
  most: 'Most of the lanterns are lit, and the few dim ones are marked so they can be met again. A good watch. The Quay sleeps easily.',
  some: 'Some lanterns shine and some are low. The low ones tell us exactly where to look this week, and that is a useful thing to know.',
  few: 'A quiet watch, with many low lanterns. The week was a hard one, and the phantoms understand. They will return, and a short review before then may help.',
  closing: [
    'The Tide rises, silver and thin. The lanterns hold. Wren, at the foot of the stair, writes something down and then, for once, puts the pencil away.',
    'The watch is over. Go and rest. The lamps will be lit either way.',
  ],
};

// The Ledger: earned only for items held at 7 or 30 days, one per vigil at most. Never random, never for time spent.
export const LEDGER_TEXT = {
  earned: 'On the stair, one phantom does not leave with the others. It sets down a slim ledger with a brass clasp and fades. Inside, a single line has been written for every phantom you sent home from seven days back or thirty.',
  none: 'No Ledger tonight. It is given only for things you held for a week or a month, and tonight\'s bundles were newer. That is how it should be.',
  already: 'The watch has already given you its Ledger this week. The phantoms are glad to be asked again anyway.',
};

// SUGGESTED new prize item (do not edit items.js yet). The id is permanent once released.
// Shape matches PZ(id, name, rarity, trial, lore) in src/data/items.js. The source type may need to be 'echo'
// instead of 'trial' when wired, so the Reliquary can say where it came from.
//
// PZ('vg_watch_ledger', 'The Watch Ledger', 'epic', 'vigil',
//   'A slim ledger with a brass clasp, kept by the night watch on the Quay battlements. It has one line for every phantom that was sent home after a week or a month, and no line for those that were not. The watch says that is how a ledger should be: it records what was held.'),
