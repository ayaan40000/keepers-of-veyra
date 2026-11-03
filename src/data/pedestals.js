// 1.1 content, drafted by Claude and reviewed. Wired into src/ui/Pedestals.jsx.
// Relics on pedestals in the walkable palace room. A lit pedestal means the relic is held. A dim pedestal only means
// a review is due (the existing fading-relic rule, driven by a slipped delayed probe). No creatures, no shadow, no
// horror, no timer, nothing "high stress". Repair is the existing Recall card, then a re-test 1 to 3 days later with a
// different cue. Rewards come only from recall that held. {relic} is the relic's name. No em dashes.
// DIM_LINES and RESTORED_LINES include reviewed lines from the Qwen drafts (the "dim" list); see docs/drafts/v11-reviewed.json.

export const PEDESTAL_HONEST = 'A dim relic means a review is due, not that you did something wrong. Forgetting a little is normal.';

// Approaching a lit pedestal.
export const LIT_LINES = [
  '{relic} sits in its pool of light, steady and warm.',
  'The pedestal glows softly. {relic} looks content, like a cat in the sun.',
  '{relic} is bright today. It seems to know you are looking at it.',
  'A small, even light holds {relic} in place. All is well here.',
  'You pause at the pedestal. {relic} gives back a little of the lamplight, as if saying hello.',
];

// Approaching a dim pedestal. Calm and quiet. The relic is not damaged, only resting.
export const DIM_LINES = [
  'A quiet pause before we remember.',
  'The mist waits gently here, and so does {relic}.',
  '{relic} rests in soft light. It is not gone, only dim.',
  'The light on this pedestal is low, like a lamp turned down for the night.',
  '{relic} is having a gentle nap. A review would wake it.',
  'It rests until you come back to it.',
];
export const DIM_HINT = 'A review is due. A Recall card now, and a quick check in a day or two, will light it again.';

// The repair invitation.
export const REPAIR = {
  title: 'Light {relic} again',
  invite: 'Would you like to light this relic again? It is quick: one Recall card now, and a short check in a day or two with a different cue.',
  step1: 'Step 1: a Recall card for {relic}, now.',
  step2: 'Step 2: in 1 to 3 days, a short check with a different cue.',
  why: 'A different cue shows whether you can find the memory from another side, not only the one you practised.',
  button: 'Start the Recall card',
  later: 'Not now',
  laterLine: 'Of course. The pedestal will wait. It is only dim, and dim does not hurt.',
  waiting: '{relic} is half lit. Its check is due in a day or two, with a different cue. Come back then.',
  nothing: 'This relic does not need repair. It is lit and well.',
};

// The restored line, after the delayed re-test is held.
export const RESTORED_LINES = [
  'Bright again, warm as a morning sun.',
  'Your care has cleared the haze. {relic} is shining again.',
  '{relic} glows with a quiet, happy light.',
  'The pedestal hums softly. {relic} is back to its old self.',
  'This place feels safe and known again.',
];
export const RESTORED_NOTE = 'Restored. It stayed dim for a little while, and now it is bright. That is all it ever was.';
