// Story glue: Wren's arc, everyday dialogue, achievements, ranks. Narrative lives in chapters.js, quests.js, lore.js.
export { CHAPTERS } from './chapters.js';
export { BEATS, GATE_INTROS, SIDE_QUESTS } from './quests.js';
export { CODEX, CHARACTERS } from './lore.js';
import { CHAPTERS } from './chapters.js';

export const WREN_STAGES = [
  { min: 0, name: 'Apprentice', glow: 0.25 },
  { min: 2, name: 'Scribe', glow: 0.4 },
  { min: 4, name: 'Keeper', glow: 0.55 },
  { min: 7, name: 'Cartographer', glow: 0.7 },
  { min: 10, name: 'Archivist', glow: 0.85 },
  { min: 12, name: 'Guide', glow: 1 },
];

export function wrenStage(gates) {
  let s = WREN_STAGES[0];
  for (const st of WREN_STAGES) if (gates >= st.min) s = st;
  return s;
}

// Lines by context, then by Wren's stage (falls back to the last row available).
export const WREN = {
  welcome: [
    ['Morning! I\'ve brought the cards, the tea and the bad attitude. You bring the brain. Shall we see what stuck from yesterday?',
      'There you are. I saved you the good chair, which is the one that only wobbles a little. Ready when you are.',
      'I tried to remember what we did yesterday without looking at my notes. I got about half. Let\'s see if you can beat me.'],
    ['I only brought four pockets of cards today. Four! I feel completely naked. Let\'s start before I lose my nerve.',
      'I walked the Gallery route on the way in this morning, without a single card. Every stop was still there. I may have done a small dance. Nobody saw. Probably.'],
    ['I found another of Calder\'s little number tricks in the margins last night. Remind me to show you after we\'ve done today\'s work, it\'s lovely.',
      'Hask says good morning. Well, he nodded. I\'m translating.'],
    ['I mapped two new routes through the fifth tier last night. You\'re going to need them soon. Your palaces are getting crowded, in the best possible way.'],
    ['I tested my own memories this morning, one by one, the way you taught me. Most of them were real. That\'s a strange sentence to say out loud. Let\'s do yours.'],
    ['You know the way now. Better than I do, some days. I\'ll walk it with you anyway, if that\'s all right.'],
  ],
  returnAfter: [
    ['There you are! The Quay kept while you were gone, and so did I. Don\'t worry about the gap. We\'ll start gently and see what\'s still there. Usually it\'s more than you think.',
      'Welcome back. The lamps are still lit. I checked every night, which I\'m slightly embarrassed to admit. A short session is a perfectly good way back in.'],
    ['Nothing is really lost until you stop looking for it. That\'s what Tansy says, anyway, and she\'s annoyingly right about most things. Let\'s find out what stayed.'],
    ['The routes are exactly where you left them. That\'s the whole point of routes. Come on, I\'ll walk the first one with you.'],
    ['Welcome back. The map didn\'t move, the river didn\'t win, and I didn\'t eat your share of the biscuits. Well. Most of them.'],
    ['Some things fade when you leave them. That\'s all right. We check, we rebuild, we carry on. That\'s the work.'],
    ['Come in, come in. The Archive is as much yours as mine now. Sit down, get warm, and then let\'s see what the river took and what it didn\'t.'],
  ],
  success: [
    ['That held! Every bit of it. The quay lamps will be brighter tonight because of that, I swear they will.',
      'That was so clean. I would have needed three cards and a lie-down to do that.'],
    ['No gaps at all. Calder would have nodded at that, and she almost never nodded at anything.'],
    ['Good. Really good. Now, before you forget the feeling: what did you do differently? Notice it, so you can do it again on purpose.'],
    ['That was strong. Your pictures are getting faster without getting blurrier, which is the hardest trick there is.'],
    ['That one is going to last. I can tell by how little you hesitated. It\'s yours now.'],
    ['You didn\'t need me for that at all. I\'m going to pretend I helped.'],
  ],
  struggle: [
    ['The Tide takes the first try from everybody. Honestly, everybody. Tomorrow we test what stayed, and I bet it\'s more than you think.',
      'A miss isn\'t a failure. It\'s a little flag that says "aim here next time". That\'s all it is.'],
    ['Empty stops usually mean the picture never really touched the place. Next time, make it crash into the stop, or soak it, or set it on fire. Make it messy.'],
    ['Half of it held. That\'s the half to be proud of. Let\'s look at the other half together, without being cross about it.'],
    ['Harder material, honest score. That\'s the trade we made, and it\'s a good one. You\'re training on the hard stuff now.'],
    ['I got three things wrong this week that I was absolutely certain about. So. We check, we fix, we keep going.'],
    ['One rough walk doesn\'t undo a year of good ones. Breathe. Tomorrow\'s another lamp.'],
  ],
  levelup: [['They\'re making it harder for you now. That means it\'s working. I\'m a bit proud, if I\'m allowed to be.'], ['More items, same calm. You\'re ready for it. I watched you get ready.']],
  gate: [['Every lamp is lit. Every single one. I think I heard someone cheering from the harbour. I think it might have been me.'], ['Another district back from the fog. I\'d write it down, but I don\'t need to anymore. Isn\'t that something?']],
};

export function wrenLine(kind, gates, seed = 0) {
  const stageIdx = WREN_STAGES.indexOf(wrenStage(gates));
  const table = WREN[kind] || WREN.welcome;
  const row = table[Math.min(stageIdx, table.length - 1)];
  return row[Math.abs(seed) % row.length];
}

export function tell(text, profile) {
  return String(text).replaceAll('{name}', profile?.user?.alias || 'Keeper');
}

// Short teaser for a district's main quest, before its chapter is unlocked.
export const CHAPTER_SUMMARY = Object.fromEntries(Object.entries(CHAPTERS).map(([k, v]) => [k, v.quest]));

export const ACHIEVEMENTS = [
  { id: 'first_light', name: 'First Light', desc: 'Finish your very first session.' },
  { id: 'cornerstone', name: 'Cornerstone', desc: 'Build your first memory palace, with 10 or more stops.' },
  { id: 'clean_sweep', name: 'Clean Sweep', desc: 'Get every item right on a drill of 8 or more items.' },
  { id: 'walking_backward', name: 'Walking Backward', desc: 'Walk a palace route backwards without a single slip.' },
  { id: 'it_stayed', name: 'It Stayed', desc: 'Remember 90% or more of something the next day, without looking.' },
  { id: 'week_later', name: 'A Week Later', desc: 'Remember 80% or more of something a whole week later.' },
  { id: 'rekindled', name: 'Rekindled', desc: 'Come back after 3 or more days away and finish a session.' },
  { id: 'steady_flame', name: 'Steady Flame', desc: 'Train on 7 different days within two weeks.' },
  { id: 'honest_ledger', name: 'Honest Ledger', desc: 'Look honestly at your mistakes in 3 reflections.' },
  { id: 'sharper', name: 'Sharper', desc: 'Earn your first skill level up.' },
  { id: 'quay_restored', name: 'Quay Restored', desc: 'Pass the gate of Lamplighters\' Quay.' },
  { id: 'face_reader', name: 'Face Reader', desc: 'Name 8 or more faces correctly in one drill.' },
  { id: 'number_smith', name: 'Number Smith', desc: 'Turn 10 or more numbers into pictures, all correct, each in under 3 seconds.' },
  { id: 'safe_keeping', name: 'Safe Keeping', desc: 'Save a backup of your progress.' },
];

export const RANK_TITLES = [[1, 'Lampbearer'], [3, 'Wayfinder'], [5, 'Route Warden'], [8, 'Ledger Keeper'], [12, "Archivist's Hand"], [16, 'Keeper of Veyra']];
