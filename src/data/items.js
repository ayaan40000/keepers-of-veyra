// Collectibles of Veyra: artifacts, Calder's ledger pages, side-quest trinkets, Crypt treasures and achievement seals.
// Ownership is never stored; it is derived from profile state in engine/collect.js.
// Icons for every id live in pixel/icons.js.
import { TRACED_ITEMS, DEEP_TREASURES } from './traced-items.js';

export const KINDS = [
  { id: 'artifact', name: 'Artifacts', blurb: 'Things the city gave back to you, one for every district restored.' },
  { id: 'page', name: 'Ledger Pages', blurb: 'Calder\'s twelve pages, in her small, fierce hand.' },
  { id: 'trinket', name: 'Trinkets', blurb: 'Keepsakes from the people of Veyra, for favours done.' },
  { id: 'treasure', name: 'Lost Treasures', blurb: 'Relics of the Drowned Years, brought up from the Crypt.' },
  { id: 'seal', name: 'Seals', blurb: 'Wax seals pressed for deeds worth remembering.' },
  // v0.9.1
  { id: 'keepsake', name: 'Keepsakes', blurb: 'Small precious things, one for each stretch of memories that held.' },
  { id: 'document', name: 'Old Documents', blurb: "Papers from Veyra's past, found as each district comes back. Each one can be read." },
  { id: 'found', name: 'Lost and Found', blurb: 'Odd things people lost, turned up while you polished your relics.' },
  { id: 'gear', name: "Keeper's Gear", blurb: 'What a Keeper carries, earned as your skills grow.' },
];

export const RARITY = {
  common: { label: 'Common', color: '#b8c2d6', order: 0 },
  rare: { label: 'Rare', color: '#7fb3a6', order: 1 },
  epic: { label: 'Epic', color: '#b48ad6', order: 2 },
  legendary: { label: 'Legendary', color: '#f0c75e', order: 3 },
};

const A = (id, name, rarity, source, lore) => ({ id, name, kind: 'artifact', rarity, source, lore });
const gate = (id) => ({ type: 'gate', id });

const ARTIFACTS = [
  A('brass_lantern', 'The Brass Lantern', 'legendary', { type: 'start' },
    'Old and dented, with a little door of smoked glass. Wren handed it to you on your first morning, cold as a stone from a stream. A Warden\'s lamp lights for whoever truly remembers.'),
  A('wrens_notecard', 'Wren\'s Notecard', 'common', { type: 'start' },
    'One small white card from the snowdrift on the Archive floor, picked up by a clerk who said she had better learn with you. It is blank on both sides. That was rather the point.'),
  A('art_grey_glove', 'The Grey Glove', 'rare', gate('M1'),
    'Finely made, left on the wet stones of the Quay when the Hushed fled your lantern. A closed eye is stitched in silver thread on the cuff. You will see that eye again.'),
  A('art_side_door_key', 'Gallery Side-Door Key', 'rare', gate('M2'),
    'The iron key to the little side door Fennick showed you on your first night in the Long Gallery. You walked your route backwards in the dark to reach it, and took Wren out while the Hushed searched an empty hall.'),
  A('art_hall_chisel', 'Chisel from the Hall of Faces', 'rare', gate('M3'),
    'A mason\'s chisel, its edge still bright, found at the foot of the eastern wall. With it you cut three hundred and twelve names back beneath their faces. Someone else once used one just like it to ruin a thirteenth.'),
  A('art_cipher_wheel', 'Calder\'s Cipher Wheel', 'rare', gate('M4'),
    'Two brass discs on one pin, the outer ring stamped with digits and the inner with sounds. Ninety-four is a bear. Seventy-four is a car. Turn it slowly and the Counting House ledgers start telling their ugly little story.'),
  A('art_silver_bolt', 'Isolde\'s Silver Bolt', 'rare', gate('M5'),
    'A short crossbow bolt fletched in green, from the little silver crossbow Isolde Varre carries in her velvet. It went into the man who was aiming at you. She sent it back afterwards, polished, with a dinner invitation.'),
  A('art_seal_ring', 'Warden\'s Seal Ring', 'rare', gate('M6'),
    'One of the thirteen rings of the Compact, cut with a lamp above an open eye. The old words on the Tongues Bridge kept it for five hundred years in a crack of white stone. Wren wears its twin on her thumb.'),
  A('art_stolen_record', 'Ennick\'s Stolen Record', 'epic', gate('M7'),
    'The Order\'s own account of the night of the Tide, copied out in the Grand Hush\'s study and carried through the rain against Ennick\'s skin. One line is underlined twice: Find the courier.'),
  A('art_widows_hood', 'The Widow\'s Rest Hood', 'epic', gate('M8'),
    'Rough grey sacking that smells of rosemary and river water. Isolde pulled it over your head on the eight-hundredth step and whispered the truth into the dark beneath it. You kept it. You are not sure why.'),
  A('art_mirror_shard', 'Cracked Mirror Shard', 'epic', gate('M9'),
    'A splinter of the Mirror Wards, cracked corner to corner. Look into it and a kitchen you never stood in looks back, warm and believable. You keep it behind a door in your mind marked: not mine.'),
  A('art_waystation_register', 'The Waystation Register', 'epic', gate('M10'),
    'Twenty years of travellers\' names in an old leather book from the crossroads above Fenwick. One entry is in your own handwriting. Delivered to the Archivist, Veyra. Returned by choice.'),
  A('art_rite_cup', 'The Untouched Cup', 'epic', gate('M11'),
    'The silver cup of the Rite of Echoes, still full of grey. Sevrin Ashgrave looked at it for a long moment and pushed it away. Even the Hush has things he cannot bear to lose.'),
  A('art_ysolde_ember', 'Ember of the Lamp of Ysolde', 'legendary', gate('M12'),
    'A coal that fell from the great Lamp under the Archive dome on the Night of No Moon, when it caught fire for the first time in three hundred years. It is warm in your hand and has not gone out. It may never go out.'),
];

// Calder's ledger pages, quoted from the chapters.
const PAGE_TEXT = [
  ['Under the base of the last lamp on the Quay, wrapped in oilcloth', 'Hold it as a picture or not at all. Words drift. Pictures anchor. Places hold. If you are reading this, you have found the first. There are eleven more. Trust no one who offers you peace.'],
  ['Behind the frame of Annet Gale in the Long Gallery', 'The city is a palace. I built it to be walked. I walked it every night so that I would never be the only one who knew the way. If you are reading this, walk it further than I did. The courier knows the road. Keep the courier safe.'],
  ['Behind the little bronze lamp-hook beside the scratched face', 'Forgive me. It was the only way to hide you.'],
  ['Folded inside the spine of a Counting House ledger', 'Count what they take, and you will know what they want. They do not want money. Money is only what they use. Watch the clocks.'],
  ['Waiting on your pillow in the locked Archive', 'They will try to frighten you, then flatter you, then buy you. When none of that works, they will try to make the city hate you. Do not let it make you hate the city.'],
  ['Sewn into the lining of a Hushed robe, found by Isolde', 'They will tell you I opened the gate. I did. Ask them why, and watch what they say. Then ask the Scriptorium.'],
  ['In Ennick\'s bundle all along', 'Now you know why. Do not forgive me yet. You do not know the price.'],
  ['Pressed into your hand under the hood on the Widow\'s Rest', 'Everyone you trust will be tested. Some will fail. Not all who seem to fail have failed.'],
  ['Taken off the Grand Hush\'s desk by Ennick, without knowing what it was', 'The courier and the heir. One carries the road, the other the way home. Do not let them separate you.'],
  ['Pressed into the back cover of the waystation register', 'You chose this once. You are allowed to choose it again.'],
  ['In Old Tansy\'s basket, under the bundles of rosemary', 'If you are reading this, you have found me, and I no longer know you. I am sorry. It was the only safe place left. Look after my brother. He was the kindest of us.'],
  ['Never written down. Calder gave it to you herself, over two cups of rosemary tea', 'That\'s the last lesson, I think. Not how to keep everything. How to choose.'],
];
const ORD = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth', 'Eleventh', 'Twelfth'];
const PAGES = PAGE_TEXT.map(([where, text], i) => ({
  id: `page_${i + 1}`, name: `${ORD[i]} Ledger Page`, kind: 'page',
  rarity: i === 11 ? 'legendary' : i >= 8 ? 'epic' : 'rare',
  source: gate(`M${i + 1}`),
  lore: `${where}. "${text}"`,
}));

const T = (q, name, rarity, lore) => ({ id: `trinket_${q}`, name, kind: 'trinket', rarity, source: { type: 'side', id: q }, lore });
const TRINKETS = [
  T('m1_ferry', 'Mosk\'s Ferry Token', 'common', 'A worn bronze token stamped with a little boat. Show it at the Quay steps and Mosk ferries you free for a year, and tells you so every single time.'),
  T('m1_tea', 'Tansy\'s Teacup', 'common', 'A chipped cup that always smells faintly of rosemary tea, for the remembering. Tansy poured two of these the night she sang you the Lamplighter\'s Song.'),
  T('m2_walls', 'Fennick\'s Key Tag', 'common', 'A wooden tag on a loop of string, worn smooth by thirty-one years in a caretaker\'s pocket. It came with the spare key to the Gallery, and with Fennick\'s verdict: That\'ll hold for life.'),
  T('m2_back', 'The Backward Map', 'common', 'A scrap of map Wren drew of your route, every arrow pointing the wrong way. Calder used to say that a route you can only walk forwards is a story, not a place.'),
  T('m3_names', 'Brennick Seed Cake', 'common', 'A slice of the cake that arrived every week for a month, from the granddaughter of Aldo Brennick, harbour pilot. It never goes stale. Some kindnesses keep.'),
  T('m3_drifter', 'Kettering Ford Badge', 'rare', 'A tin road-warden\'s badge with a milestone and two crossed staves. Two brothers wore this badge once. Joss Hask told you about the other one, more words in a row than he had said all month.'),
  T('m4_smuggler', 'Isolde\'s Scented Note', 'common', 'Folded thick paper, sealed in green wax and scented with something expensive. Impressive. Tuesday, the Fenwick road, midnight. Bring the large one.'),
  T('m4_books', 'The Salt Guild\'s Second Book', 'rare', 'A small black book from under a Counting House floorboard, its clasp crusted with salt. Every Watch officer the Guild ever paid is in it. Wren carries the list in her head now, not on paper.'),
  T('m5_clock', 'Pellam\'s Winding Key', 'rare', 'The brass key to the oldest clock in the market, the one that coughed, whirred and struck thirteen. Pellam\'s grandfather made it. Pellam had forgotten that until you remembered sixteen digits for him.'),
  T('m5_invite', 'The Rook Card', 'common', 'A playing card from Varre House, a black rook on a green field. Isolde taught you Rook with this deck, and how to lose a hand on purpose when it suits you.'),
  T('m6_riddle', 'The Riddle Stone', 'rare', 'The loose block that slid out of the Tongues Bridge parapet when you read its riddle a week later. What you learn today you own tomorrow; what you keep a week you keep for life.'),
  T('m6_grief', 'Hennoweth Candle', 'rare', 'A stub of candle in a tin dish, left burning in a window. Hennoweth: the ache of a lamp left burning for someone who is not coming home. Mosk said it until he remembered her name. Hennet.'),
  T('m7_forger', 'Brother Hollin\'s Quill', 'rare', 'A grey goose quill with grey ink dried on the nib, taken from the desk of the Grand Hush\'s secretary. Forgers always get small facts wrong. You caught all ten of his.'),
  T('m7_doubt', 'Ennick\'s Notebook', 'common', 'A thin notebook tied with string, where Ennick first learned to look at his own mistakes. He stopped needing it after a week. It doesn\'t hurt as much as forgetting did.'),
  T('m8_stair', 'Bree\'s Red Ribbon', 'common', 'The hair ribbon of the champion of the Tidal Stair, handed over the evening you beat her by two steps. She demanded a rematch every evening for a month. She never stopped trying.'),
  T('m8_masque', 'Masquerade Mask', 'epic', 'A green and gold half-mask on an ebony stick, from the ball at Varre House. Three hundred guests in twenty rooms, and you knew who stood where all night. Isolde may have to keep you.'),
  T('m9_mirror', 'The Two-List Slate', 'epic', 'A child\'s slate with two lists chalked side by side, one bright and one smudged nearly away. Keep the first. Forget the second. The mirror cracked like ice on a pond.'),
  T('m9_face', 'Wren\'s Carving Mallet', 'epic', 'The little wooden mallet Wren used over three nights to carve her own face back into the eastern wall of the Hall, and her name beneath it. Hello, she told it. It\'s been a while.'),
  T('m10_hollow', 'Stillwater Pebbles', 'rare', 'Three painted pebbles from the village square at Stillwater, where you taught the children to set a word in a place. The next morning, three of them still remembered. It is a small thing.'),
  T('m10_road', 'Ammerhold Milestone', 'epic', 'A palm-sized milestone from the top of the pass, carved with the road home. Hask checked you on every item of a month-old list up the mountain, then said, You\'ll do. From a road-warden, that is everything.'),
  T('m11_pace', 'The Rite Coat', 'epic', 'Black wool lined with green silk, sent by Isolde with a note: For the Rite. Lose in this and I will have it back. She did not have it back.'),
  T('m11_song', 'Bundle of Rosemary', 'epic', 'Rosemary from Tansy\'s basket, tied with twine. She sang the last verse at last under the lamp and remembered, for one breath, that she had a brother.'),
  T('m12_kept', 'The Autumn Leaf', 'legendary', 'A leaf from the autumn, when you learned something you still hold three months on. That\'s yours now, Tansy said. Not the river, not the grey, not anybody. Remember that I said so.'),
  T('m12_year', 'The Keeper\'s Oath Medal', 'legendary', 'Struck in bronze with the Lamp of Ysolde, given under the copper dome when Wren swore you in as a Keeper of Veyra. Nobody had walked the routes three hundred days in three centuries.'),
];

const S = (id, name, rarity, lore) => ({ id: `seal_${id}`, name: `Seal of ${name}`, kind: 'seal', rarity, source: { type: 'ach', id }, lore });
const SEALS = [
  S('first_light', 'First Light', 'common', 'Pressed in amber wax over a small flame. Every Keeper\'s ledger begins with one lamp, lit once.'),
  S('cornerstone', 'the Cornerstone', 'common', 'A squared stone in green wax. Ten rooms you know with your eyes shut, and a route through them that is yours.'),
  S('clean_sweep', 'the Clean Sweep', 'common', 'A broom in blue wax. Every item, every one, and nothing left on the floor for the Tide.'),
  S('walking_backward', 'the Backward Walk', 'rare', 'A turning arrow in violet wax. If you can only walk a route forwards, it is a story, not a place.'),
  S('it_stayed', 'It Stayed', 'rare', 'An anchor in river-blue wax. A night\'s sleep, and the picture was still there in the morning, waiting.'),
  S('week_later', 'A Week Later', 'rare', 'A seven in green wax, one for every day it held. What you keep a week, the bridge says, you keep for life.'),
  S('rekindled', 'the Rekindled Lamp', 'common', 'A lamp relit, in red wax. The Quay kept while you were gone. So did Wren.'),
  S('steady_flame', 'the Steady Flame', 'rare', 'A tall still flame in amber wax. Seven days in fourteen. A habit is a lamp you do not have to relight.'),
  S('honest_ledger', 'the Honest Ledger', 'rare', 'An open book in brown wax. You looked at your own mistakes without flinching, three times. Ennick would be proud.'),
  S('sharper', 'the Sharper Edge', 'common', 'A rising star in silver-grey wax. The drills grew harder because you grew faster.'),
  S('quay_restored', 'the Restored Quay', 'epic', 'A lamp-post in gold wax, the first of forty-four. For the first time in three hundred years, the Tide rose and took nothing.'),
  S('face_reader', 'the Face Reader', 'rare', 'A face in rose wax. Eight names fastened to eight faces, so firmly they will never come loose.'),
  S('number_smith', 'the Number Smith', 'epic', 'A hammer on an anvil in iron-black wax. Numbers into pictures, faster than a Guild courier can change his code.'),
  S('safe_keeping', 'Safe Keeping', 'common', 'A little padlock in teal wax. A copy of everything you have built, kept where the river cannot reach.'),
];

// Crypt treasures: ids, names and depths are fixed by the Crypt.
const C = (id, name, depth, rarity, lore) => ({ id, name, kind: 'treasure', rarity, source: { type: 'crypt', depth }, lore });
const TREASURES = [
  C('ct_bone_dice', 'Ferryman\'s Bone Dice', 3, 'common', 'Two yellowed dice with eyes instead of pips. The ferrymen of the Drowned Years cast them for passengers who could not remember where they were going, and took whichever shore the dice chose.'),
  C('ct_silver_mirror', 'Shard of the First Mirror', 5, 'rare', 'Silver, older than the Mirror Wards, and it shows no face at all. Only rooms. The Order\'s first mirrors were cut from this one, and they never learned what it was trying to show them.'),
  C('ct_wardens_compass', 'Warden\'s Compass', 7, 'rare', 'Its needle does not point north. It points toward the nearest thing you have forgotten, and trembles when you are close. The Wardens carried them through the Tide like dogs on a lead.'),
  C('ct_nameless_crown', 'Crown of a Nameless King', 9, 'rare', 'Black gold, set with river-stones, sized for a small head. Somebody ruled the river-folk in the Drowned Years wearing this. Nobody, not even the crown, remembers who.'),
  C('ct_ysolde_wick', 'Ysolde\'s Wick', 11, 'epic', 'A charred wick in a clay saucer, lit nine hundred years ago, and burning still with a flame no wider than a grain of rice. The songs say it was the first lamp of the Compact.'),
  C('ct_tide_pearl', 'Tide Pearl', 13, 'epic', 'A grey pearl, cold and heavy as a held breath. The river-folk believed every memory the Tide took sank to the bottom and was slowly wrapped in pearl. This one is warm on one side.'),
  C('ct_hollow_mask', 'Mask of the Hollow Choir', 15, 'epic', 'A smooth white face with no mouth. The choirs of the Drowned Years wore them to sing the songs no one could remember writing, and sang them perfectly, and forgot them when the masks came off.'),
  C('ct_iron_key', 'The Undercroft Key', 18, 'epic', 'Heavy black iron, its bow worked into twelve little sluice-wheels. It opens a door beneath the Lethe Gate that the Wardens walled up and then, very carefully, forgot.'),
  C('ct_star_chart', 'Chart of the Drowned Stars', 21, 'legendary', 'A sky map drawn on fish-skin, full of stars that are no longer there. The Nameless Kings steered by them through the long fog, toward a shore they could not name.'),
  C('ct_grey_phial', 'First Phial of the Grey', 25, 'legendary', 'Lethewater, drawn from the river the night the Drowned Years began, and stoppered with black wax. It is the first grey. Whoever bottled it wanted, very badly, to forget something.'),
  C('ct_heart_stone', 'Heartstone of the Compact', 30, 'legendary', 'A red stone that beats, slowly, once a minute. The thirteen Wardens laid their hands on it to swear the Compact of Lamps. It still remembers every one of their names.'),
  C('ct_lamp_of_ages', 'The Lamp of Ages', 40, 'legendary', 'The lamp the first river-folk carried out of the Drowned Years, before Ysolde, before the city, before anyone had a name to remember. Its light falls on things as they truly were.'),
];

// v0.6 mid-year rewards: earned only by delayed recall that held, never by time spent.
const M = (id, name, rarity, lore) => ({ id: `seal_${id}`, name, kind: 'seal', rarity, source: { type: 'milestone', id }, lore });
const MILESTONES = [
  M('month_holder', 'Seal of the Month Holder', 'rare', 'Pressed for three delayed recalls passed a full month after learning. Wren says most of the city forgets a thing in a week. You held three of them for thirty days.'),
  M('long_memory', 'Seal of the Long Memory', 'epic', 'Pressed for a gate recalled at 70% or better three months after you passed it. The Tide came up ninety times over those streets, and still they stood.'),
  M('midsummer', 'Midsummer Seal', 'epic', 'Pressed at the turn of your year: six districts restored and twenty delayed recalls passed. Calder kept one like it on her desk, and never once explained it.'),
  // v0.9 late-year rewards, months 7 to 12. Also earned only by delayed recall that held.
  M('whole_city', 'Seal of the Whole City', 'rare', 'Pressed for holding what you learned for a month or more in six different skills. Pictures, routes, faces, numbers, words: the city does not run on one trick, and neither do you.'),
  M('half_year', 'Seal of the Half Year', 'epic', 'Pressed for a gate recalled at 70% or better six months after you passed it. Mosk says nothing on the river lasts half a year. He has been wrong before, though he would not like you to say so.'),
  M('long_road', 'Seal of the Long Road', 'epic', 'Pressed at the far end of the Open Roads: nine districts restored and forty delayed recalls passed. Hask looked at it for a long time and said it was a good, plain seal.'),
  M('keepers_year', "Seal of the Keeper's Year", 'legendary', 'Pressed on the morning after the Night of No Moon: all twelve districts restored and sixty delayed recalls passed. There is a lamp on it, and under the lamp, very small, your own name.'),
];

// v0.9.1 deep treasures share the crypt's data; the rest are new kinds (see traced-items.js).
const DEEP = DEEP_TREASURES.map((t, i) => C(t.id, t.name, t.depth, i < 4 ? 'epic' : 'legendary', t.desc));
export const ITEMS = [...ARTIFACTS, ...PAGES, ...TRINKETS, ...TREASURES, ...DEEP, ...SEALS, ...MILESTONES, ...TRACED_ITEMS];
export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((it) => [it.id, it]));
export const GATE_ARTIFACT = Object.fromEntries(ARTIFACTS.filter((a) => a.source.type === 'gate').map((a) => [a.source.id, a.id]));
