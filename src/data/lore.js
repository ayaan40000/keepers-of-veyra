// Mnemos: Keepers of Veyra. Original world, characters and lore.
// Unlocks: 'start' = known from the beginning; 'gate:M3' = after that module's gate; 'side:<id>' = after a side quest.

export const CODEX = [
  {
    id: 'lethe', title: 'The River Lethe', unlock: 'start',
    text: [
      'The Lethe rises far inland, in the high bogs of the Morrowfen, where no birds sing and the water is the colour of old pewter. It runs two hundred miles to the Grey Sea, and for the last nine of those miles it runs past Veyra.',
      'Every evening, as the light goes, a silver mist lifts off the river and climbs the streets of the city. The old folk call it the Tide. It is cool and soft and smells faintly of rain on stone, and it is the most dangerous thing in the world. Whatever a person is not holding firmly in mind when the Tide passes over them, it takes. A name half-remembered. A recipe never quite learned. The face of a friend not seen in years.',
      'Most nights the Tide is thin and takes only small things. Some nights it is thick, and takes a great deal.',
    ],
  },
  {
    id: 'wardens', title: 'The Lamp-Wardens and the Compact', unlock: 'start',
    text: [
      'Nine hundred years ago, in the time the songs call the Drowned Years, the river-folk who lived along the Lethe forgot everything: their names, their gods, the way home. They lived like sleepwalkers, and their kings are remembered only as the Nameless Kings, because no one could recall what they had been called.',
      'Then came Ysolde of the Lamp, the first Warden. She had learned, no one knows from whom, that a mind which sets its memories in places, room by room, stone by stone, can stand in the Tide and lose nothing. She taught the Art to twelve others. Together they swore the Compact of Lamps: to build a city that was itself a memory, and to keep a lamp burning in it for every person who chose to remember.',
      'That city was Veyra. Its twelve districts are twelve great routes, laid out by the Wardens so that anyone who walked them could store their life along the way.',
    ],
  },
  {
    id: 'art', title: 'The Art of Places', unlock: 'start',
    text: [
      'The Wardens called their method the Art of Places. You will know it by other names: the Memory Palace, the Journey, the Method of Loci. It is very old, older than Veyra, and it is not magic, though in Veyra it is treated with the respect usually given to magic.',
      'The idea is simple enough to explain to a child. Choose a place you know well. Walk through it in your mind, stopping at the same spots in the same order. At each stop, leave a picture of the thing you wish to keep, and make the picture do something to the place. Later, walk the route again, and the pictures will be waiting.',
      'In Veyra it is said that a Warden at the height of the Art could walk through a Tide as thick as wool and come out the other side still knowing the name of every person they had ever met.',
    ],
  },
  {
    id: 'quiet', title: 'The Long Quiet', unlock: 'start',
    text: [
      'For six hundred years the Wardens kept the Compact. Then, slowly, they stopped needing to. The Archive filled with ledgers. Paper was cheaper than practice. Why train for years to hold a memory when you could write it down and put it on a shelf?',
      'The lamps went out one at a time, the way the stars go in the morning: not all at once, but so gradually that no one could say which night the sky turned grey. By the time of this story there were no Wardens left, only the Archivist and a handful of clerks, and the city trusted its ledgers completely.',
      'This is the age the songs call the Long Quiet. It ended on the night the Tide rose higher than it had in three hundred years, and every ledger in the Archive came back blank.',
    ],
  },
  {
    id: 'forgettings', title: 'The Forgettings', unlock: 'gate:M1',
    text: [
      'When the Tide loosens a memory, it does not destroy it. The memory drifts down into the streets and settles as a small grey shape, soft at the edges, like dust in a sunbeam. The old folk call these shapes Forgettings. They are not evil, and they have never hurt anyone. A Forgetting is simply what the Tide leaves behind.',
      'Each one holds the lost thing carefully and waits to be remembered, rather like a shy dog that has wandered far from home. A Keeper does not drive a Forgetting away. A Keeper remembers the thing properly, and the grey shape grows light, sighs, and goes home. The Wardens called this an Echo, because the memory answers when it is called.',
      'Forgettings come in kinds that match what was lost. Pictures leave a Smudge, stories a Tangle, places a Hollow, faces a Blank, numbers some Static, words a Murmur, and facts a Dustleaf. The oldest and largest of them, the Great Forgetting, is only the forgotten things of the whole city, gathered in one place and very tired.',
    ],
  },
  {
    id: 'archive', title: 'The Archive and the Ledgers', unlock: 'gate:M1',
    text: [
      'The Archive crowns the highest tier of Veyra: a round hall of pale stone under a dome of green copper, with bronze doors that are never fully closed. Its shelves climb in rings to the roof, and on them stand the Ledgers, one for every year since the founding.',
      'At the centre of the floor stands the Lamp of Ysolde, a great bowl of brass on a pillar of black stone. It has not been lit in living memory. The clerks dust it on the first day of every month out of habit, and nobody knows why.',
      'It was believed that ink could not be touched by the Tide. The night Calder vanished proved otherwise. The Tide did not reach the Ledgers. Something else did.',
    ],
  },
  {
    id: 'grey', title: 'Lethewater, or "the Grey"', unlock: 'gate:M2',
    text: [
      'If you boil the river water in copper and catch the steam in glass, you get a few drops of a clear, faintly silver liquid that smells of nothing. The dock folk call it the grey. A single drop on the tongue will take away one memory, if you hold that memory in mind as you swallow. A spoonful will take a year. A cup will take a life.',
      'For most of the city\'s history the grey was forbidden. In the Long Quiet it became merely discouraged, then tolerated, then sold. Widows bought it to forget their grief. Soldiers bought it to forget the war. The rich bought it to forget their debts, and the poor bought it to forget they were hungry.',
      'The trade is run by the Salt Guild, who distil it in the marsh-houses south of the city. It has made them very rich. It has made Veyra very quiet.',
    ],
  },
  {
    id: 'salt', title: 'The Salt Guild', unlock: 'gate:M4',
    text: [
      'On paper the Salt Guild trades in salt, which it rakes from the pans at the river mouth. In truth salt is a cover for the grey, and has been for forty years.',
      'The Guild\'s masters wear white gloves and never touch the stuff themselves. They keep their books in a number code that changes every season. In Calder\'s ledgers, decoded, you found the same entry repeated every month for nine years: a large payment from the Salt Guild to an account marked only with a closed eye.',
      'The closed eye is the sign of the Quiet Order.',
    ],
  },
  {
    id: 'order', title: 'The Quiet Order', unlock: 'gate:M3',
    text: [
      'They wear hooded robes the colour of river mist, and they speak softly, and they are very kind. They run soup kitchens on the Quay and sit with the dying in the Lower Tiers. They call themselves the Hushed.',
      'Their teaching is gentle, and it is this: that memory is the root of all suffering. That every grief, every grudge, every war began with someone who could not forget. That the Tide is not a curse but a mercy, and the Wardens were wrong to fight it.',
      'Their leader is called the Grand Hush. Few have seen his face. Those who have say that he has the kindest eyes they have ever seen, and that he looks at you as if he already forgives you for something you have not done yet.',
    ],
  },
  {
    id: 'moon', title: 'The Night of No Moon', unlock: 'gate:M5',
    text: [
      'Once in every nineteen years, the dark of the moon falls on the longest night of winter. On that night the Lethe runs at its highest, and the Tide that rises from it is not a mist but a wall.',
      'In the old days the Wardens stood on the Lethe Gate, the great sluice-works at the head of the city, and held the floodgates shut by hand while the whole city stood in the streets with lamps and sang the old songs until dawn. It was called the Long Vigil.',
      'The next Night of No Moon falls this winter. Calder\'s last ledger entry, the unfinished sum, was the date of it.',
    ],
  },
  {
    id: 'ammerhold', title: 'The Ammerhold and the Outer Roads', unlock: 'gate:M9',
    text: [
      'Veyra is built into the seaward face of the Ammerhold, a long ridge of grey granite that runs from the mountains to the coast like the spine of some buried beast. Behind it lie the Outer Roads: a web of old trade-ways linking a hundred small towns, most of which have never seen the Tide.',
      'Road-wardens keep those ways. They are a rough, independent people who walk everywhere, own very little, and owe loyalty to no lord. They are hard to frighten and impossible to bribe, which is why the Salt Guild has always hated them.',
    ],
  },
  {
    id: 'hollow', title: 'The Hollow Villages', unlock: 'gate:M10',
    text: [
      'On the Outer Roads there are towns where the grey arrived before the Tide ever could. Barrowmere. Stillwater. Fenwick Cross. The Salt Guild sold to them first, cheaply, as a cure for sorrow.',
      'Now the people of those towns smile at strangers and have no idea how long they have lived there. Their fields go half-planted because no one remembers what was sown. Their children are not taught to read, because who would remember to teach them? They are not unhappy. That is the most frightening part.',
    ],
  },
  {
    id: 'rite', title: 'The Rite of Echoes', unlock: 'gate:M11',
    text: [
      'By ancient law any citizen may challenge the keeper of an office to the Rite of Echoes: a contest of memory held in the great Amphitheatre before the whole city. Words, numbers, faces, tongues and histories, each in turn, until one contestant falters.',
      'The winner holds the office. The loser drinks a cup of the grey, before everyone, and forgets that they ever held it. The Rite has not been called in two hundred years.',
    ],
  },
  {
    id: 'heartledger', title: 'The Heartledger', unlock: 'gate:M12',
    text: [
      'Every Ledger in the Archive is a copy. The Wardens kept one original record of the city, the Heartledger, which held the true names, the true histories and the true promises of Veyra. Without it, the Compact of Lamps is only a story.',
      'The Heartledger was never written on paper. It was kept the old way, in the mind of each Archivist in turn, walked and re-walked along a palace route that ran through all twelve districts. When an Archivist died, the next one had already learned the route.',
      'On the night of the great Tide, Calder did not have a successor ready. So she chose one. She chose you.',
    ],
  },
  {
    id: 'song', title: 'The Lamplighter\'s Song', unlock: 'side:m1_tea',
    text: [
      'Sung on the Quay at dusk when the lamps are lit. Tansy says it is older than the city.',
      'When grey comes up from Lethe\'s bed / and takes the names from all our dead, / then light the lamp and walk the hall, / and set a picture by each wall. / What you have placed you shall not lose, / though the grey take all it choose. / So walk the road and light the way / and keep your night until it\'s day.',
    ],
  },
  {
    id: 'hask_story', title: 'The Brothers Hask', unlock: 'side:m3_drifter',
    text: [
      'There were two of them, Joss and Tomas Hask, road-wardens out of Kettering Ford. Tomas was the talker. Joss was the one who listened.',
      'Two years ago Tomas followed a Salt Guild wagon into the marsh-houses and did not come out. When Joss found him a month later, in a hollow village on the Outer Roads, Tomas smiled at him politely and asked if he was lost.',
      'Joss Hask has been walking toward Veyra ever since.',
    ],
  },
  {
    id: 'varre', title: 'House Varre', unlock: 'side:m5_invite',
    text: [
      'The Varres have held the office of Harbour Mistress for eleven generations, and in all that time no ship has docked in Veyra without paying them, and no secret has crossed the Grey Sea without being sold to them first.',
      'They are said to keep their own ledgers, in their own heads, by an art older than the Wardens\' and less honest. Isolde Varre is the last of them, and the most dangerous.',
    ],
  },
];

// Characters reveal more as gates are passed (tiers by gates count).
export const CHARACTERS = [
  {
    id: 'you', name: 'You, the Keeper', role: 'The hero',
    tiers: [
      { min: 0, text: 'A traveller who came up the coast road with a pack, a walking stick and no clear memory of why. You arrived in Veyra the morning after the worst Tide in three hundred years. The lantern in the Archive warmed in your hands when it would warm for no one else, and nobody, least of all you, knows why.' },
      { min: 5, text: 'The Hushed have started watching you. Someone tried to kill you in the Clockwork Market, which suggests that somebody in Veyra knows more about you than you do.' },
      { min: 10, text: 'In a waystation register on the Outer Roads you found your own handwriting, dated a year ago: a courier\'s mark and a single line, "Delivered to the Archivist. Returned by choice." You have been here before. You came back on purpose. You just do not remember deciding to.' },
      { min: 12, text: 'You carry the Heartledger. Calder walked it into your memory on the night of the Tide and then took the memory of the walk away, so that no one could torture it out of you. Every palace you have built this year has been you, slowly, finding your way back to it.' },
    ],
  },
  {
    id: 'wren', name: 'Wren Halloway', role: 'Your companion',
    tiers: [
      { min: 0, text: 'Twenty-seven, junior archivist, daughter of a lamplighter from the Quay. Tall, quick-talking, forever tripping on stairs, with ink on every finger and a long brown coat that has notecards in all eleven of its pockets. She writes everything down because, as a girl, she lost her mother\'s face to a Tide and has never forgiven herself for it. She is funnier than she lets on and braver than she believes.' },
      { min: 2, text: 'She has started leaving the cards at home, one pocket at a time. She will not admit that this frightens her, but she checks her empty pockets when she thinks you are not looking.' },
      { min: 9, text: 'Wren was not a junior clerk. She was Calder\'s true apprentice, the one meant to carry the Heartledger next. On the night of the Tide, Calder made her drink the grey and forget it, so the Hushed would stop hunting her. The face scratched out of every wall in the Hall of Faces was hers. Calder did it to hide her.' },
      { min: 12, text: 'Archivist of Veyra, the first in three hundred years to keep the Heartledger without a single notecard. She still carries one card in her breast pocket. It has your name on it, and she says it is not there because she might forget.' },
    ],
  },
  {
    id: 'sevrin', name: 'Sevrin Ashgrave, the Grand Hush', role: 'The adversary',
    tiers: [
      { min: 3, text: 'Leader of the Quiet Order. A tall, soft-spoken man in a grey hood, with silver in his beard and a voice that makes people want to sit down and rest. He feeds the poor of the Lower Tiers with his own hands. He has never raised his voice in public. Every report of him agrees on one thing: he seems sincerely kind.' },
      { min: 5, text: 'Sevrin once had a wife named Marra and a daughter named Lia. Both died in the Red Fever twelve years ago. Afterwards he drank the grey and forgot them, and found, for the first time in his life, peace. He has spent every day since trying to give that peace to everyone else, whether they want it or not.' },
      { min: 11, text: 'Sevrin Ashgrave was born Sevrin Calder. He is the Archivist\'s younger brother. He means to open the Lethe Gate on the Night of No Moon and let a Tide like a wall roll over Veyra, so that the whole city wakes the next morning with nothing to grieve. He calls it the Great Mercy.' },
      { min: 12, text: 'Calder kept one memory he did not know survived: Lia, aged six, laughing on the Quay steps with a paper boat. When you showed it to him at the Gate, he wept for the first time in twelve years, and then he closed the floodgates with his own hands.' },
    ],
  },
  {
    id: 'calder', name: 'Elsabet Calder, the Archivist', role: 'The vanished mentor',
    tiers: [
      { min: 0, text: 'Archivist of Veyra for thirty-one years. Precise, dry, unbending, famously stingy with praise. She vanished on the night of the great Tide, leaving nothing behind but a cold lantern and a city of blank ledgers.' },
      { min: 6, text: 'She opened the Lethe Gate herself that night, a hand\'s width, on purpose. The question that keeps you awake is why.' },
      { min: 11, text: 'She has been here all along. Old Tansy, the herbalist who makes remembering-tea on the Quay, is Calder: she drank a full cup of the grey on the night of the Tide so the Hushed could never take the city\'s secrets from her mind. She does not know who she was. She only knows, from somewhere deep, that she must keep an eye on you.' },
    ],
  },
  {
    id: 'hask', name: 'Joss Hask', role: 'The drifter',
    tiers: [
      { min: 3, text: 'A road-warden from the Outer Roads, six and a half feet tall and broad as a doorway, who walked into Veyra with a folding knife, a spare shirt and a ferry token in his pocket and nothing else. He says very little. He notices everything. When he decides something is wrong, he fixes it, usually before anyone else has finished deciding whether it is wrong.' },
      { min: 4, text: 'He is hunting the Salt Guild men who sold the grey to his brother. He has a list of their names, which he keeps in his head because, he says, "paper gets found."' },
    ],
  },
  {
    id: 'isolde', name: 'Isolde Varre, the Harbour Mistress', role: 'The intriguer',
    tiers: [
      { min: 5, text: 'Mistress of the Harbour and the richest woman in Veyra. Dark-eyed, sharp-witted, always perfectly dressed, always three moves ahead. She plays cards for high stakes at Varre House and always wins. She saved your life in the Clockwork Market and has not yet told you what she wants for it.' },
      { min: 8, text: 'She handed you to the Hushed on the Tidal Stair. You thought it was betrayal. It was the only way to get you inside the Order\'s hall, and she has been Calder\'s eyes in the Quiet Order for ten years. She still has not told you what she wants. You are beginning to suspect it is simply to win.' },
    ],
  },
  {
    id: 'tansy', name: 'Old Tansy', role: 'The herbalist of the Quay',
    tiers: [
      { min: 0, text: 'A small, sharp old woman with a stall under the last lamp of the Quay, where she sells rosemary tea "for the remembering" and gives advice nobody asked for. Nobody knows how long she has been there. She seems to like you, which surprises everyone, including her.' },
      { min: 11, text: 'Tansy is Elsabet Calder, the lost Archivist, wiped clean by her own hand. Every cup of tea she pressed on you this year was her way of keeping watch over the one person who carried what she had lost.' },
    ],
  },
  {
    id: 'ennick', name: 'Brother Ennick', role: 'The doubter',
    tiers: [
      { min: 6, text: 'A young acolyte of the Quiet Order, freckled, earnest and badly out of place. He joined the Hushed to forget a cruel father. Then he was set to copying the Order\'s records, and he began to notice that the records did not agree with each other.' },
      { min: 7, text: 'He brought you the true account of the night of the Tide, at great risk, and now hides in the Scriptorium cellars. He is trying very hard to remember how to be brave.' },
    ],
  },
];
