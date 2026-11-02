// The Undercroft: an endless memory crypt beneath the Archive.
// Data only: tuning constants, depth bands, treasures and the crypt-only Lore Tablets.

// ---------- tuning ----------
export const CRYPT_TUNING = {
  maxKeys: 5, // keys held are capped
  startKeys: 1, // a brand-new crypt record starts with one key
  entryCost: 1, // keys spent to start a run
  lamps: 3, // lamp-oil flasks per run; a failed floor costs one
  passAcc: 0.8, // accuracy needed to descend
  chestEvery: 4, // a sealed chest on every 4th floor cleared
  historyMax: 20, // runs kept in p.crypt.history
  logMax: 80, // attempts kept in run.log
  variantFrom: 6, // first floor that can roll interference / reverse / timed / abstract
  doubleVariantFrom: 15, // first floor that can roll a second variant
  minStudy: 12, // seconds, floor for study time
  echoEvery: 5, // v0.5: every 5th floor is an echo of the floor two above (no study)
  echoBack: 2,
  bossEvery: 10, // v0.6: every 10th floor is a boss floor (more to hold, a full refill of oil when beaten)
  bossGrowth: 1.2,
};

// v0.6 optional modifiers chosen at the door. They make a descent harder and are shown in its record; they never add rewards.
export const CRYPT_MODIFIERS = [
  { id: 'dim', name: 'Dim lamps', desc: 'Two flasks of oil instead of three.' },
  { id: 'swift', name: 'Swift water', desc: 'A quarter less study time on every floor.' },
  { id: 'mist', name: 'Thick mist', desc: 'Every floor has a twist from the first floor down (reversed order, look-alikes, a timer and so on).' },
  { id: 'echoes', name: 'Loud echoes', desc: 'Echo floors come every 3rd floor instead of every 5th.' },
];

// Boss of each depth band: the thing that waits on every 10th floor.
export const BOSSES = [
  { from: 10, name: 'The Crowned Echo', line: 'A king with no name rises from his throne and repeats everything you say, a moment too late.' },
  { from: 20, name: 'The Cistern Choir', line: 'The whispering in the water gathers into one voice, and it wants to sing you its forgetting.' },
  { from: 30, name: 'The Root Warden', line: 'The pale roots knot into the shape of a mason, and it will not let you pass unless you hold what it holds.' },
  { from: 40, name: 'The Listening Spring', line: 'The warm silver water stands up like a person. It has every face it ever took.' },
  { from: 50, name: "Ysolde's Shadow", line: 'Your own lamp throws a shadow on the wall, and the shadow is holding a clay lamp of its own. It walks your route a step ahead of you.' },
];
// v0.9 boss trials: each boss always brings one twist (if the floor's task has one), shown before the floor starts.
export const BOSS_TRIALS = {
  'The Crowned Echo': ['reverse', 'interference'],
  'The Cistern Choir': ['timed'],
  'The Root Warden': ['abstract', 'reverse'],
  'The Listening Spring': ['lures', 'restyle', 'turn'],
  "Ysolde's Shadow": ['reverse', 'timed', 'turn'],
};
export function bossFor(floor) {
  let b = BOSSES[0];
  for (const x of BOSSES) if (floor >= x.from) b = x;
  return b;
}

// Floor-1 shape of each template (n items, s study seconds). Depth scaling lives in engine/crypt.js:
//   n(f) = min(cap, round(n1 * (1 + 0.1 * (f - 1))))          more items each floor
//   secondsPerItem(f) = (s1 / n1) * max(0.4, 1 - 0.03 * (f - 1)) less time per item each floor
//   s(f) = max(minStudy, round(n(f) * secondsPerItem(f)))
export const CRYPT_BASE = {
  wordlist: { n: 6, s: 45, cap: 30 },
  pairs: { n: 5, s: 45, cap: 20 },
  chain: { n: 6, s: 55, cap: 25 },
  palace: { n: 6, s: 55, cap: 30 },
  faces: { n: 4, s: 40, cap: 14 },
  major: { n: 8, s: 0, cap: 30 },
  digits: { n: 8, s: 40, cap: 40 },
  vocab: { n: 4, s: 50, cap: 16 },
  facts: { n: 4, s: 50, cap: 16 },
};
export const CRYPT_GROWTH = 0.1; // v0.7: was 0.15; simulated mid-year players now end near floors 8 to 12 (see scripts/crypt-sim.mjs)
export const CRYPT_SQUEEZE = 0.03;
export const CRYPT_SQUEEZE_FLOOR = 0.4;

// Variants a template may roll from floor 6 (see engine/crypt.js for the odds).
export const CRYPT_VARIANTS = {
  wordlist: ['interference', 'timed'],
  pairs: ['abstract', 'timed'],
  chain: ['timed'],
  palace: ['reverse', 'timed'],
  faces: ['timed', 'lures', 'restyle', 'turn'],
  major: [],
  digits: ['timed'],
  vocab: ['timed'],
  facts: ['timed'],
};

// ---------- depth bands ----------
// decor drives the chamber art; hue tints the stone.
export const BANDS = [
  { from: 1, name: 'The Ossuary Stair', decor: 'bones', hue: 'stone', line: 'Bones of the forgotten, stacked with great care by people who could not remember why.' },
  { from: 4, name: 'The Ledger Vaults', decor: 'shelves', hue: 'stone', line: 'Shelves of the first ledgers, swollen with damp, every page gone soft and grey.' },
  { from: 7, name: 'The Drowned Chapel', decor: 'water', hue: 'river', line: 'Black water lies across the floor, and your lamp shows another lamp beneath it.' },
  { from: 10, name: 'The Hall of Nameless Kings', decor: 'thrones', hue: 'violet', line: 'Thrones of black stone, and on each a crown with an empty space for a name.' },
  { from: 14, name: "The Mason's Rooms", decor: 'bones', hue: 'stone', line: 'Every niche holds something small and kept: a comb, a shoe, a carved bird.' },
  { from: 18, name: 'The Weeping Cisterns', decor: 'water', hue: 'river', line: 'Water runs down the walls in long threads, and the drops sound like whispering.' },
  { from: 22, name: 'The Sealed Oath', decor: 'thrones', hue: 'violet', line: 'A grave under a plain slab, and a lamp carved into the stone above it.' },
  { from: 26, name: 'The Root of the Ammerhold', decor: 'roots', hue: 'moss', line: 'Roots as thick as a man push through the vault, pale and cold and very old.' },
  { from: 33, name: 'The Hungry Springs', decor: 'springs', hue: 'tide', line: 'Silver water wells up from the floor. It is warm, and it is listening.' },
  { from: 40, name: 'The Unlit Deep', decor: 'springs', hue: 'void', line: 'Below every map. Your lamp is the only light that has ever been here.' },
  { from: 48, name: 'The Warm Water', decor: 'springs', hue: 'tide', line: 'No mason cut these walls. They are smooth, and warm, and very faintly someone is singing.' },
];
export function bandFor(floor) {
  let b = BANDS[0];
  for (const x of BANDS) if (floor >= x.from) b = x;
  return b;
}

// ---------- treasures (ids are fixed; another module may supply icons) ----------
export const TREASURES = [
  { id: 'ct_bone_dice', depth: 3, name: 'Bone Dice', hue: '#d8c9a6', desc: 'Two dice cut from knucklebone. Every face shows the same number, and nobody remembers which.' },
  { id: 'ct_silver_mirror', depth: 5, name: 'Silver Mirror', hue: '#b8c2d6', desc: 'A tarnished hand mirror. It shows the room as it was, not as it is.' },
  { id: 'ct_wardens_compass', depth: 7, name: "Warden's Compass", hue: '#e8b04b', desc: 'Its needle points to the last place you set a memory.' },
  { id: 'ct_nameless_crown', depth: 9, name: 'Nameless Crown', hue: '#8a93a8', desc: 'An iron crown with an empty space at the front where a name should have been cut.' },
  { id: 'ct_ysolde_wick', depth: 11, name: "Ysolde's Wick", hue: '#ffd98a', desc: 'A stub of wick from the first lamp. It is still warm.' },
  { id: 'ct_tide_pearl', depth: 13, name: 'Tide Pearl', hue: '#dfe6f2', desc: 'A grey pearl that formed around a single lost word.' },
  { id: 'ct_hollow_mask', depth: 15, name: 'Hollow Mask', hue: '#efe6d2', desc: "A plaster mask with no face, worn at the Sleepwalkers' Feast." },
  { id: 'ct_iron_key', depth: 18, name: 'Iron Key', hue: '#6b7286', desc: "Hesper's key. It fits a door you have not found yet." },
  { id: 'ct_star_chart', depth: 21, name: 'Star Chart', hue: '#7fb3a6', desc: 'The sky as the river-folk saw it before the Drowned Years, with every star named.' },
  { id: 'ct_grey_phial', depth: 25, name: 'Grey Phial', hue: '#8090ad', desc: 'Lethewater sealed on the first night of the Tide. Do not open it.' },
  { id: 'ct_heart_stone', depth: 30, name: 'Heart Stone', hue: '#c46a2a', desc: "A stone from the seventh step, where Hesper's mother waited for her every night." },
  { id: 'ct_lamp_of_ages', depth: 40, name: 'Lamp of Ages', hue: '#f0c75e', desc: 'The clay lamp of a cross, stubborn girl. It has never gone out.' },
];

// ---------- lore tablets (crypt-only story) ----------
export const TABLETS = [
  { id: 'tab_masons_mark', depth: 2, title: "The Mark of the Hand",
    text: 'Whoever reads this has come further down than the clerks of the Archive ever dared, past the cellars where they keep the broken shelves, into the old stone that was cut long before any ledger was bound. This stair was not built by the Wardens. It was here when they came, and it was old even then. I have cut my mark beside every stone I want you to read, a small lamp inside a closed hand, so that you will know which ones I have touched. Follow the hand. It will not lie to you.' },
  { id: 'tab_river_folk', depth: 4, title: 'The River-Folk',
    text: 'Before the forgetting, the people of the Lethe were fishers and reed-cutters and keepers of geese, and they lived in long houses of wattle on stilts above the water. They sang a great deal. They had a song for every bend of the river and a name for every eel trap, and the old women could recite their grandmothers back forty generations, sitting on the steps in the evening with their feet in the cool water. Remember that they were like you. Remember that they were not foolish people, and that what happened to them was not a punishment.' },
  { id: 'tab_first_tide', depth: 6, title: 'The First Tide',
    text: 'The first Tide came up on a still night in late summer, when the river was low and smelled of mud and mint. It came softly, as it always does, and it lay over the stilt-houses until morning. When the sun rose, a mother stood in her doorway and did not know the child who was calling to her from the reeds. By the end of that year the songs had gone, and the names of the bends, and the names of the grandmothers. By the end of the next year the people had forgotten that they had ever had them. So began the Drowned Years.' },
  { id: 'tab_nameless_kings', depth: 8, title: 'The Nameless Kings',
    text: 'In the Drowned Years there were still kings, because people will always find someone to obey, even when they cannot remember why. The kings sat in these halls on chairs of black stone, and every morning they woke without knowing their own names, and every morning their servants set a crown on their heads and told them that they were king. Each crown had a smooth space at the front where the name of the king was to be cut. If you look at the thrones in the hall below, you will see that every one of those spaces is empty.' },
  { id: 'tab_king_who_carved', depth: 10, title: 'The King Who Carved',
    text: 'One of the Nameless Kings was cleverer than the rest. He took a chisel and carved his own name into the wall beside his bed, so that he would read it each morning and know himself. For eleven days it worked. On the twelfth morning he woke and read the name, and it meant nothing to him at all, because he had forgotten the man it belonged to. He sat and looked at it until dark. A name is not a memory, the masons said afterwards. It is only the door to one, and he had let the room behind it fall in.' },
  { id: 'tab_sleepwalkers', depth: 12, title: "The Sleepwalkers' Feast",
    text: 'Every midwinter the river-folk still gathered for a feast, though no one could say what it was for. They laid long tables in the mud along the bank and cooked whatever they had, and they sat down together and looked at one another politely, like strangers at an inn. Sometimes one of them would begin to sing, a few notes only, and then stop and frown, as if a bird had flown past a window. Those few notes were all that was left of a thousand songs. They kept the feast for two hundred years without ever knowing why.' },
  { id: 'tab_girl_with_lamp', depth: 14, title: 'The Girl With the Lamp',
    text: 'Ysolde was born in the ninth generation of the Drowned Years, the daughter of an eel-catcher who could not remember her birthday. She was not a princess or a prophet. She was a thin, cross, stubborn girl who carried a clay lamp everywhere because she was afraid of the dark, and who noticed, when she was eleven years old, that the old woman who lived in the hill above the river never seemed to forget anything at all. So she followed her home. That is how the Art came back into the world: a child who would not mind her own business.' },
  { id: 'tab_hesper', depth: 16, title: 'Hesper of the Hill',
    text: 'The old woman was called Hesper, and she was a mason, the last of those who had cut the stone of these halls for the Nameless Kings. She lived alone in the dark beneath the hill, in the very rooms you are walking through now, and she had walked them every night for sixty years. She had set a memory in every niche, on every step and against every pillar. When Ysolde found her she was sitting at the foot of the stair with her eyes closed, visiting her mother, who had been dead for forty years and who was waiting for her, as always, on the seventh step.' },
  { id: 'tab_hesper_teaching', depth: 19, title: 'What Hesper Taught',
    text: 'Hesper did not explain the Art. She said that explaining was for people who meant to forget. Instead she walked Ysolde through the halls in silence, every night for a year, stopping at each place and pressing the girl\'s hand flat against the stone until her palm remembered it. Only then did she begin to set things there: a word, a face, a debt, a song. By the end of the second year Ysolde could walk through a thin Tide and come out whole. By the end of the third she could walk through a thick one. Hesper never once told her she had done well.' },
  { id: 'tab_hesper_price', depth: 22, title: "The Mason's Price",
    text: 'There was a reason Hesper never went up into the light. Everything she had kept was kept down here, in the stone, and the further she walked from it the thinner it grew. If she had climbed the hill to live among the river-folk, she would have forgotten as they did, within a single season. So she stayed. She told Ysolde that every art has a price, and that the price of hers was that she belonged to the places now, more than they belonged to her. Ysolde, who was young, decided that she would build a whole city, so that she would never have to choose.' },
  { id: 'tab_thirteenth_oath', depth: 26, title: 'The Thirteenth Oath',
    text: 'The songs say that twelve Wardens swore the Compact of Lamps. There were thirteen oaths. The thirteenth was sworn here, at the bottom of the stair, by Ysolde alone, with her hand on Hesper\'s grave. She promised that the Undercroft would be sealed under the floor of the Archive and that no Warden would ever come down again, and that if any did, they would read the stones and climb back up and keep their silence. You will notice that she did not promise to break the stones. She could not bring herself to do it. She was a keeper, after all.' },
  { id: 'tab_kings_request', depth: 29, title: 'What the First King Asked',
    text: 'Here is the thing Hesper never told Ysolde, which Ysolde learned only after Hesper died, from the wall of a room that Hesper had always kept locked. The Drowned Years did not begin by chance. The first of the Nameless Kings, when he still had a name, did something on the riverbank that he could not bear to remember. The wall does not say what it was. It says only that he walked down into the water at night, up to his chest, and asked the river to take it from him. And the river did.' },
  { id: 'tab_river_learned', depth: 33, title: 'The River Learned',
    text: 'A river is only water and stone, and it has no wishes of its own. But the Lethe had been given something it had never held before, and it did not give it back. The next night the mist rose a little higher on the bank, and took a little more. It took the grief of the king, and then the grief of the people who had watched him, and then their songs, and their names, and their grandmothers. The masons who cut this room did not believe the river had been cursed. They believed it had been taught, and that what it learned was hunger.' },
  { id: 'tab_where_it_goes', depth: 37, title: 'Where the Taken Things Go',
    text: 'Everything the Tide takes goes somewhere. Hesper believed it sinks, the way silt sinks, through the riverbed and the roots of the Ammerhold, down into the cold places under the world where water runs without light. She believed the springs at the bottom of these halls were where it settled, and she would not drink from them, nor let Ysolde drink from them, nor even let her look into them for long. If you have come this far, you have heard the springs. You may have heard voices in them. Do not answer the voices.' },
  { id: 'tab_last_stone', depth: 45, title: 'The Last Stone',
    text: 'This is the last stone I cut, and I broke the thirteenth oath to cut it. I have come as far down as a living body can come and still climb back, and I have seen the place where the Lethe truly rises, long before it ever reaches the Morrowfen. It is not cold. It is warm, like breath. The river does not forget, keeper. That is what the kings buried and the Wardens sealed. It remembers every name and song and face it has ever taken, and it keeps them here, and it is patient, and it is waiting for the Night of No Moon.' },
  // v0.9: below the last stone. Scratched by Ysolde herself, in old age (first drafts by a local model, edited).
  { id: 'tab_ysolde_came_down', depth: 50, title: 'Ysolde Came Down',
    text: 'I came down alone, with my clay lamp and a stick for my bad knee. Hesper\'s last stone stood at the bottom of her stair like a door left open, and I did not stop to read it again. I knew it by heart. Below it nobody ever cut the rock. It is smooth here, worn by water, and every step down it grows warmer. I am old enough now to go where she told me not to.' },
  { id: 'tab_warm_water', depth: 55, title: 'The Warm Water',
    text: 'It is silver and warm, like breath held too long in a closed room. I waded in to my waist, and I heard them: the river-folk, singing under the surface, all of them at once. Their geese songs, their reed songs, the names of their children. They are not angry with us for forgetting. They are only waiting, with a patience that frightened me more than anything Hesper ever said.' },
  { id: 'tab_what_is_kept', depth: 60, title: 'What Is Kept Here',
    text: 'I understand it now. The river can only keep what nobody up above is keeping. Every name a living person still carries is a name the water cannot have. That is why the Tide comes up at night, when we sleep and let go. That is why it rose in the Drowned Years, when people stopped trying. Whoever reads this: it is not a war. It is a weighing. Each thing you hold is one thing it cannot.' },
  { id: 'tab_lamp_left_burning', depth: 70, title: 'The Lamp Left Burning',
    text: 'I have set my lamp on this ledge with all the oil I could carry. Let it burn as long as it can, so that whoever comes after knows somebody remembered the way down. Now go back up. Do not stay here listening to the singing. Go up into the light and keep things: names, faces, songs, the way home. That is all that ever pushed the Tide back, and it is enough.' },
];

// Small celebration lines for sealed chests.
export const CHEST_LINES = [
  'A flask of lamp oil, still sealed with green wax.',
  'Oil wrapped in oilcloth, and a child\'s clay bead.',
  'A flask of oil and a single wooden spoon, carved with a name you cannot read.',
  'Lamp oil, packed in straw by careful hands.',
  'Oil, and a tin whistle that makes no sound at all.',
  'A flask of oil and a folded note. The ink has run away entirely.',
];
