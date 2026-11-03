// 1.1 content, drafted by Claude and reviewed. Wired into src/engine/brambles.js, src/ui/Brambles.jsx and the world map.
// Lethe Brambles: thorny vines that grow in a district where the player's own error log shows items slipping.
// Rules (from docs/ROADMAP.md): brambles never block the story, the map or any core feature and only guard optional
// chests. Typing a stronger image earns nothing by itself (typing is not learning). A vine burns away only after the
// item is recalled correctly on a later review, the next day at the earliest. A setting turns brambles off.
// The animation plays on the map, never on a study or recall screen. {district} and {item} are filled in by the UI.
// No em dashes.

export const BRAMBLES_HONEST = 'Brambles are only a picture of what your own answers showed. They never block the story, and they do not change your scores.';

// Settings toggle (Display or Training group).
export const BRAMBLES_SETTING = {
  label: 'Lethe Brambles on the map',
  on: 'On',
  off: 'Off',
  explain: 'Thorny vines grow in a district where some of your items have been slipping. They show where a stronger picture may help. They never block the map or the story, and they only guard optional chests. Turn them off if you would rather keep the map clear.',
};

// Map lines when brambles appear in a district.
export const MAP_LINES = {
  appear: [
    'Thorny vines have crept over the {district}. They grow where your answers slipped, and they are easy to untangle.',
    'The Lethe has left a few brambles in the {district}. Each thorn marks one item that wants a stronger picture.',
  ],
  one: 'One small bramble clings to a lamp-post in the {district}.',
  few: 'A few brambles twist along the walls of the {district}.',
  many: 'Brambles hang thickly over the {district}. It looks wilder than it is: every thorn is just one item.',
  none: 'The {district} is clear. Not a thorn in sight.',
  off: 'Brambles are turned off. The map stays clear.',
  tapHint: 'Tap a thorn to see what it is holding.',
};

// The thorn prompt: shown on the map, never on a study or recall screen.
export const THORN = {
  title: 'A thorn from the Lethe',
  shows: 'This item slipped: {item}',
  ask: 'Make the picture stronger. Add one colour, one size, one sound or one smell that belongs only to this item, and put it in a place you know.',
  placeholder: 'Describe your new picture in a sentence',
  tips: [
    'Make it big, odd or messy. A plain picture slides off its stop; a strange one sticks.',
    'Use more than the eyes: a smell, a sound, something cold or sticky.',
    'Make the picture do something to its place, not just sit there.',
    'If the old picture was a bit pale, change one thing about it. One thing is enough.',
  ],
  save: 'Keep this picture',
  saved: 'Picture kept. The thorn stays until you remember the item for real.',
  skip: 'Leave it for now',
  // Typing is not rewarded. Said once, plainly, in the sheet.
  noReward: 'Writing a picture gives no reward by itself. The thorn only goes when you remember the item later.',
};

// Shown after the picture is kept: come back tomorrow.
export const COME_BACK = [
  'Come back tomorrow. When the item comes up again and you remember it, the thorn will burn away.',
  'Sleep on it. A fresh day is the fairest time to see whether the new picture held.',
  'The vine will wait. Meet the item again tomorrow, and if it comes easily, the bramble goes.',
];

// Burn away: only after a later, correct recall (the next day at the earliest). Map animation only.
export const BURN_AWAY = [
  'You remembered it, and the thorn caught fire without any smoke. It burned down to a silver thread and floated off along the river.',
  'The bramble curled up and let go of the wall. Where it hung, the stone is warm.',
  'That one held, and the vine knows it. It is gone, leaving only a little green on the cobbles.',
  'The thorn gave a tiny crackle, like a log settling in a grate, and then it was only light.',
];
export const BURN_ALL = 'The {district} is clear of brambles. The walls look very pleased about it.';

// Optional chests guarded by brambles. The reward is a small keepsake or a Chronolog note, never progress.
export const CHEST = {
  guarded: 'A small chest sits under the brambles. It is optional. The vines let go once the thorns around it have burned away.',
  open: 'The last thorn is gone and the chest is free. You lift the lid slowly.',
  empty: 'The chest was mostly a joke. Someone left a note inside that says "Well done for looking", signed with a drawing of a bramble.',
  later: 'You can leave the chest for another day. It does not go anywhere, and nothing is lost by waiting.',
  note: 'Chests hold keepsakes and notes for the Chronolog. The story and the curriculum never wait on them.',
};
