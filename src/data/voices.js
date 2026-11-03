// 1.1 content, drafted by Claude and reviewed. Wired into src/engine/voices.js and src/ui/Voices.jsx.
// The Cabinet of Voices: seven small lamp-spirits, one per skill, that coach in the story's voice.
// Where they may speak: the Character page, Today after a session, and before or after an Echo battle.
// Never during study or recall. They give TECHNIQUE hints, never contents (never "the answer is..."). Their lines
// come from the player's real error type. A skill that is due for review has a quiet voice that offers a Recall card
// or a lighter review. No rewards, no breakdowns, no Tide threats, no punishment. Derived from existing data, so no
// save-data change; the only stored value is the Voices setting.
// Five Qwen drafts (docs/drafts/v011-content-drafts.json, "voices") were reviewed: the good hints were kept for
// Vision, Thread, Place, Tongue and Frame, rewritten to the new names. Face and Count are written fresh.
// after = [strong session, steady session, rough session]. The lines are warm in all three; none shames. No em dashes.

export const VOICES_HONEST = 'Voices are lamp-spirits in the story. They suggest techniques based on how your answers went, and never give answers or rewards. A quiet voice means a review is due, not that you did something wrong.';

// The Voices setting. Default suggestion: light.
export const VOICES_SETTING = {
  label: 'Voices',
  options: [
    { id: 'off', label: 'Off', text: 'No voices. The Character page shows only the numbers.' },
    { id: 'light', label: 'Light', text: 'Voices speak on the Character page and offer a review when one is due.' },
    { id: 'full', label: 'Full', text: 'Voices also speak after a session and before and after a battle.' },
  ],
  default: 'light',
};

export const VOICES = {
  imagery: {
    name: 'Vision', skill: 'imagery', lamp: 'an amber lamp',
    sketch: 'An excitable little amber lamp who is thrilled by colour and has never once said a picture was too big.',
    hints: [
      'Make the picture so big and bright that it fills the whole room in your mind.',
      'Add one colour that nothing else in the list has.',
      'Give the picture a sound or a smell, and it may stay longer.',
      'Let the picture do something odd. A kettle that sings sticks better than a kettle that sits.',
    ],
    after: [
      'Those pictures came out sharp today. I enjoyed every one of them.',
      'A good, steady set of pictures. A touch more colour next time and they will glow.',
      'Some pictures were pale today. That is only a sign to paint them a little louder tomorrow.',
    ],
    quiet: [
      'Those scenes are a little dim. Shall we look at one Recall card and brighten them?',
      'The pictures have been waiting quietly. A short peek would keep them fresh.',
      'I think my colours have faded a bit. A lighter review could bring them back.',
    ],
    byError: {
      omission: 'The picture may never have fully formed. Say it in one sentence before you move on.',
      substitution: 'The picture was close but not its own. Give it one detail that belongs to this item only.',
      order: 'The pictures were fine, but they drifted apart. Let each one touch the next.',
    },
  },
  linking: {
    name: 'Thread', skill: 'linking', lamp: 'a brass lamp with a ribbon tied round the handle',
    sketch: 'A patient, dry lamp who mends things while talking and always seems to have a spare end of string.',
    hints: [
      'Imagine a rope tying each picture to the one before it, and tug it once.',
      'Let the first picture do something to the second. Actions link better than labels.',
      'Keep the story short. Every link wants a verb and nothing extra.',
      'If a link feels loose, make it stranger. A loose thread tightens when you tie a bigger knot.',
    ],
    after: [
      'The whole chain held, link after link. I only had to hold the end.',
      'A solid chain with a couple of loose links. Easy to tighten, and no harm done.',
      'The chain slipped in a few places. That is the thread showing us where to tie the next knot.',
    ],
    quiet: [
      'A few of the links have gone slack. A Recall card or two will pull them tight again.',
      'The thread is loose in places. A short, lighter review might mend it.',
      'Shall we walk the chain once from the start, gently, just to check the knots?',
    ],
    byError: {
      omission: 'A link went missing. Check that each picture touches the next, not just the one before.',
      substitution: 'Two stories got tangled. Give each one its own action so they cannot swap.',
      order: 'All the links were there, but out of order. Walk the story from the first picture once before you answer.',
    },
  },
  palace: {
    name: 'Place', skill: 'palace', lamp: 'a squat stone lamp, mossy at the base',
    sketch: 'A slow, unhurried lamp who walks everywhere at the same gentle pace and is never late for anything.',
    hints: [
      'Walk your route slowly. Each stop should feel like its own small room.',
      'A fireplace makes a good stop. So does a window, a staircase or a wide doormat.',
      'Leave one picture at each stop, and let it do something to the place.',
      'Walk the route once in your head before you start. The stops will be waiting.',
    ],
    after: [
      'The whole route was bright today. Every stop was waiting where you left it.',
      'A good walk with one or two foggy corners. We can light those next time.',
      'A few of the stops were hard to find. A slower walk may help them stand out.',
    ],
    quiet: [
      'Shall we take a quick stroll along that familiar route? A lighter review would do.',
      'Some stops have been quiet for a while. A Recall card could wake them.',
      'The palace hums, but one room has gone dim. A short visit would do it good.',
    ],
    byError: {
      omission: 'A stop stayed empty. Pick a feature that cannot be missed, such as a door or a window, and put the picture right on it.',
      substitution: 'You were at the right stop with the wrong thing. Make the picture hit the stop harder.',
      order: 'The stops were right but the order slipped. Walk the route from the first door before you answer.',
    },
  },
  faces: {
    name: 'Face', skill: 'faces', lamp: 'a small round lamp with two freckles painted on the glass',
    sketch: 'A warm, nosy lamp who is shy about asking names and therefore asks them very quickly, before it loses its nerve.',
    hints: [
      'Choose one feature that will not change, such as a nose, a brow or a jaw. A hat or a haircut may.',
      'Turn the name into a picture, and put the picture on that feature.',
      'Say the name aloud when you meet the face. Say it again to yourself a minute later.',
      'Make the picture do something to the feature. A name that is only sitting there may slip.',
    ],
    after: [
      'Those names stuck to those faces. A good evening of introductions.',
      'Most of the names found their faces. The rest are only a little shy.',
      'Several names came loose today, and that is common with names. A stronger picture on a firm feature may help tomorrow.',
    ],
    quiet: [
      'Some of the faces have been waiting a while. A Recall card could say hello again.',
      'The names may be a little blurry by now. A short, lighter review could sharpen them.',
      'Shall we look at a few faces once more? Quietly, with no hurry.',
    ],
    byError: {
      omission: 'The name never joined the face. Pick one firm feature and stick a picture of the name right on it.',
      substitution: 'A different name came out. Make the picture more specific, so it cannot be mistaken for a similar one.',
      order: 'The names were right but on the wrong faces. Link each picture to a feature that belongs only to that face.',
    },
  },
  numbers: {
    name: 'Count', skill: 'numbers', lamp: 'a tall, narrow lamp with a tiny clock in its base',
    sketch: 'A brisk, cheerful lamp who counts under its breath and cannot resist a rhyme with a number in it.',
    hints: [
      'Say the sounds, not the letters. House number 21 is n and t, so it can be a net.',
      'Turn each pair of digits into one picture, then put the pictures along a route.',
      'Practise the pairs until the picture comes before you have finished thinking. Speed comes from familiar pictures.',
      'If a number is long, break it into pairs and leave one picture at each stop.',
    ],
    after: [
      'Clean numbers, and quickly too. The pictures came without a pause.',
      'Most of them were right. The ones that slipped are the ones to practise first.',
      'The numbers were slippery today. That is how numbers are, and it is why we make them into pictures.',
    ],
    quiet: [
      'Some digits have gone soft. One Recall card could firm them up.',
      'The number pictures are resting. A lighter review would remind them what they are for.',
      'Shall we run a few pairs? Two or three would do, and nobody needs to be quick.',
    ],
    byError: {
      omission: 'A digit went missing. Say the sounds in order, one pair at a time, before you answer.',
      substitution: 'A digit changed. Check the sounds: 2 is n, 3 is m, and so on. One wrong sound gives a different word.',
      order: 'The digits were right but the order slipped. Leave one picture at each stop of a short route.',
    },
  },
  vocab: {
    name: 'Tongue', skill: 'vocab', lamp: 'a lopsided lamp that wobbles when it laughs',
    sketch: 'A playful, punning lamp who will say a word three different ways just to hear which one rolls best.',
    hints: [
      'Find a word you know that sounds a bit like the new one, and build a small, silly picture.',
      'Join the sound-alike to the meaning in one picture. The sillier, the better.',
      'Say the word aloud once. Your mouth may remember it for you.',
      'If a word keeps slipping, change the sound-alike. A better one makes a better picture.',
    ],
    after: [
      'Those words rolled off the tongue today. Well done, and very nicely pronounced.',
      'A fair handful of words stayed. The ones that did not will come back with a better picture.',
      'A lot of words were slippery today. A fresh sound-alike for the stubborn ones may help.',
    ],
    quiet: [
      'Some of those words are on the tip of the tongue. A Recall card could bring them back.',
      'A short look back would keep these pictures clear. Nothing heavy.',
      'Shall we say a few of them again? Out loud, and very silly.',
    ],
    byError: {
      omission: 'The word never joined its meaning. Make a picture where the sound-alike and the meaning meet.',
      substitution: 'A similar word came out. Pick a sound-alike that is closer to the real word.',
      order: 'The words were right but swapped. Give each picture its own place, so the pairs stay apart.',
    },
  },
  structure: {
    name: 'Frame', skill: 'structure', lamp: 'a square lamp with a glass front like a tiny cabinet',
    sketch: 'A tidy, calm lamp who keeps everything in labelled boxes and will lend you a box without being asked.',
    hints: [
      'Give each fact its own small space to rest, one box per fact.',
      'Start with the shape: how many points, and what each one is called. Fill in the detail afterwards.',
      'Put the biggest group first, then the smaller ones inside it.',
      'If facts keep sliding together, give each a distinct picture so no two boxes look alike.',
    ],
    after: [
      'You held the whole shape today, and the details sat neatly inside it.',
      'A good frame, with a few boxes only half full. Easy to top up.',
      'Several facts slid out of their boxes today. A clearer shape first may help them stay.',
    ],
    quiet: [
      'The outline may be getting a little loose. A Recall card would tighten it.',
      'Shall we look at the frame again? Only the shape, nothing more.',
      'A lighter review of the headings would keep the boxes in their rows.',
    ],
    byError: {
      omission: 'A box was empty. Say the headings first, then fill each one with one picture.',
      substitution: 'A fact went into the wrong box. Make each heading distinct, so two cannot look alike.',
      order: 'The facts were all there but out of order. Learn the order of the headings before the details.',
    },
  },
};
export const VOICE_ORDER = ['imagery', 'linking', 'palace', 'faces', 'numbers', 'vocab', 'structure'];
