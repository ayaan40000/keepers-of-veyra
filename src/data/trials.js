// v0.11 District Trials and tablet-gated vaults: story, rules and material.
// Story lines were first drafted by the local Qwen model, then rewritten by hand. No em dashes.
// Real-world material (the Scriptorium timelines, the clock parts) is public and was checked before it shipped
// (owner decision of Nov 2, 2026, see CLAUDE.md). Old-tongue words, names, stalls and tablets are invented.
// Trial ids, vault ids and prize item ids key saved data: never rename them.

export const TRIAL_HONEST = 'Trials practise the methods on fresh material. They never change your skill estimates, and a miss costs nothing.';

// checks: what happens after the study screen. after = days after studying; pass = share of items needed (practice checks only show the result).
// retry = days before fresh material can be tried after a miss. recover = days until the same material is asked again after a short review of what slipped.
export const TRIALS = {
  catacombs: {
    id: 'catacombs', kind: 'trial', title: 'The Catacombs of the Unnamed', gate: 'M3', district: 'Hall of Faces', coach: 'wren', art: 'trial_catacombs', prize: 'tr_ledger_fragment',
    method: 'Names and Faces: pick one feature that will not change, turn the name into a picture, and fix the picture to the feature.',
    setup: 'Under the Hall of Faces runs a crypt of marble statues, ordinary townsfolk carved long ago. The Tide has worn their plaques smooth. A Warden\'s logbook on a stone lectern still lists who they were.',
    intro: 'The stones remember what the city lost. Study the logbook, then an echo will walk you past each statue and ask who it is. Eight names of ten open the iron gate.',
    pass: 'You say each name aloud and the old iron gate swings open. Behind it, on a dry shelf, lies a torn page of the Warden\'s ledger.',
    miss: 'The echo settles back into the stone, unbothered. Tomorrow other statues will wake, and you can try again.',
    material: 'faces', n: 10, study: 120, checks: [{ after: 0, pass: 0.8 }], retry: 1,
  },
  scriptorium: {
    id: 'scriptorium', kind: 'trial', title: 'The Sunken Scriptorium', gate: 'M7', district: 'Scriptorium', coach: 'ennick', art: 'trial_scriptorium', prize: 'tr_dry_scroll',
    method: 'Facts and outlines: turn each date and event into one picture and leave it on its own desk, in order.',
    setup: 'The lower floor of the Scriptorium is filling with grey Lethewater, and the scrolls are softening. Wren can carry only one timeline out. The rest must be carried in your head.',
    intro: 'Seven dates, seven desks. Place a picture of each event on its desk as you read. You will be asked once now, and the real test comes tomorrow, without the scrolls.',
    pass: 'You read the timeline back from memory a whole day later. Ennick pulls the old drain chain, the grey water slides away, and the high chest on the top shelf is dry.',
    miss: 'Some of the timeline drifted. That is what a day does. Read it again another day; tomorrow brings a fresh timeline.',
    material: 'timeline', n: 7, study: 150, checks: [{ after: 0, practice: true }, { after: 1, pass: 6 / 7 }], retry: 1,
  },
  salt_vault: {
    id: 'salt_vault', kind: 'trial', title: 'The Broken Vault of the Salt Guild', gate: 'M4', district: 'Counting House', coach: 'isolde', art: 'trial_salt_vault', prize: 'tr_salt_dial',
    method: 'The Major System: turn each pair of digits into its picture and walk the pictures along a short route.',
    setup: 'In a cellar under the Counting House stands a Salt Guild vault with a grid of brass dials. Brother Ennick\'s leaked ledger gives the code. The dials reset every few minutes, so nobody can copy it down in time.',
    intro: 'Twelve digits, six pictures. Turn each pair into its Major System picture, then put the pictures in order along a route. After a short interruption, set the dials from memory.',
    pass: 'The last dial clicks home and the vault door swings open on oiled hinges. Isolde takes one brass dial off the door as a keepsake for you.',
    miss: 'The dials spin back to zero. No harm done: the Guild changes the code every night, so tomorrow there is a new one to try.',
    material: 'code', n: 12, study: 90, distract: true, checks: [{ after: 0, pass: 1 }], retry: 1,
  },
  bridge: {
    id: 'bridge', kind: 'trial', title: 'The Bridge of Tongues', gate: 'M6', district: 'Tongues Bridge', coach: 'ennick', art: 'trial_bridge', prize: 'tr_tongue_stone',
    method: 'The keyword method: find an English word that sounds like the old word, and make a picture that joins it to the meaning.',
    setup: 'Stone gargoyles guard the old half of the Tongues Bridge. They speak the dead tongue of Veyra and let a traveller pass only if the old words are still alive in them.',
    intro: 'Ten old words. Make a keyword picture for each. The gargoyles ask once now to let you halfway across, and again in seven days. Eight of ten after a week lets you cross the whole bridge.',
    pass: 'A week later the old words are still there. The gargoyles shuffle aside, and the eldest drops a small carved stone into your hand.',
    miss: 'A few words slipped in the week. That is normal for words. Look at just those again, make a stronger picture, and the gargoyles will ask once more in three days.',
    material: 'words', n: 10, study: 150, checks: [{ after: 0, practice: true }, { after: 7, pass: 0.8 }], retry: 1, recover: 3,
  },
  gears: {
    id: 'gears', kind: 'trial', title: 'The Disordered Gears', gate: 'M5', district: 'Clockwork Market', coach: 'mosk', art: 'trial_gears', prize: 'tr_mainspring',
    method: 'The memory palace: the market square is a fresh route of fifteen stalls. Leave one clock part at each stall, then walk the route backwards.',
    setup: 'The great clock of the Clockwork Market has stopped. Someone took its gear train apart and left the pieces on fifteen stalls around the square.',
    intro: 'Walk the stalls in order and leave a picture of each clock part at its stall. Then the square goes dark, and you put the parts back from the last stall to the first.',
    pass: 'The last part slides into place. The clock gives one great tick, the hands move, and the stallholders cheer. Mosk hands you the old mainspring, replaced long ago by a new one.',
    miss: 'The clock stays still for now, and nobody minds much. Tomorrow the parts will be on different stalls, and you can walk it again.',
    material: 'gears', n: 15, study: 180, distract: true, checks: [{ after: 0, pass: 14 / 15 }], retry: 1,
  },
  // Vaults: a short invented tablet, shown once. A quiet check-in after 1 day, then the vault opens on a recall after 7 or 30 days.
  vault_quay: {
    id: 'vault_quay', kind: 'vault', title: 'The Quay Vault', gate: 'M1', district: "Lamplighters' Quay", coach: 'tansy', art: 'trial_vault', prize: 'vt_lamp_hook',
    setup: 'A small round stone door sits low in the Quay wall, just above the water. Beside it is an empty niche and a tablet that the Tide has nearly worn away.',
    intro: 'Read the tablet once and give every line a picture. In a day you can check in quietly. In seven days, say it back at the door and the vault opens.',
    pass: 'You say the tablet back, line by line, and the stone door rolls aside. Inside, on a hook, hangs a small lamp that has not gone out.',
    miss: 'The door stays shut today. Look at the tablet again, make a stronger picture for the lines that slipped, and come back in two days for a fresh tablet.',
    material: 'tablet', study: 120, checks: [{ after: 1, practice: true, quiet: true }, { after: 7, pass: 1 }], retry: 2,
  },
  vault_cellar: {
    id: 'vault_cellar', kind: 'vault', title: 'The Market Cellar Vault', gate: 'M5', district: 'Clockwork Market', coach: 'mosk', art: 'trial_vault', prize: 'vt_clay_tablet',
    setup: 'Under the clock tower, behind the coal store, a cellar door carries the same lamp symbol as the Quay vault. Its tablet is cut in a merchant\'s quick hand.',
    intro: 'One tablet, five lines. A check-in after a day, and the door opens on a recall a week from now.',
    pass: 'The cellar door grinds open. On a shelf, wrapped in sacking, is a clay tablet stamped with a lamp, the vault\'s own key.',
    miss: 'The cellar stays closed. Read the tablet again, mend the lines that slipped, and come back in two days for a fresh one.',
    material: 'tablet', study: 120, checks: [{ after: 1, practice: true, quiet: true }, { after: 7, pass: 1 }], retry: 2,
  },
  vault_mirror: {
    id: 'vault_mirror', kind: 'vault', title: 'The Mirror Vault', gate: 'M9', district: 'Mirror Wards', coach: 'wren', art: 'trial_vault', prize: 'vt_lamp_key',
    setup: 'In the Mirror Wards one mirror does not reflect. Behind it is a vault that only opens to a tablet held for a whole month.',
    intro: 'This is a long one. Read the tablet once, check in after a day, then say it back thirty days from now. Forgetting a little is normal, and a miss costs nothing.',
    pass: 'A month later the words are still yours. The dark mirror clears like breath leaving glass, and a bronze key lies on the other side.',
    miss: 'The mirror stays dark. Read the tablet again, make the slipped lines stronger, and start a fresh tablet in two days.',
    material: 'tablet', study: 120, checks: [{ after: 1, practice: true, quiet: true }, { after: 30, pass: 1 }], retry: 2,
  },
};
export const TRIAL_ORDER = ['catacombs', 'salt_vault', 'gears', 'bridge', 'scriptorium'];
export const VAULT_ORDER = ['vault_quay', 'vault_cellar', 'vault_mirror'];

// ---------- Scriptorium timelines ----------
// Real timelines (checked Nov 2, 2026) and two invented Veyra ones. Each event: year, what to show, the answer and accepted variants.
export const TIMELINES = [
  { title: 'Reaching the Moon', real: true, events: [
    ['1957', 'Sputnik 1, the first artificial satellite, goes into orbit.', 'Sputnik', ['satellite']],
    ['1961', 'Yuri Gagarin becomes the first person in space.', 'Gagarin', ['Yuri Gagarin']],
    ['1963', 'Valentina Tereshkova becomes the first woman in space.', 'Tereshkova', ['Valentina Tereshkova']],
    ['1965', 'Alexei Leonov makes the first spacewalk.', 'Spacewalk', ['Leonov']],
    ['1968', 'Apollo 8 carries the first crew around the Moon.', 'Apollo 8', []],
    ['1969', 'Apollo 11 lands the first people on the Moon.', 'Apollo 11', ['Moon landing']],
    ['1972', 'Apollo 17 is the last crewed Moon landing so far.', 'Apollo 17', []],
  ] },
  { title: 'Learning to fly', real: true, events: [
    ['1783', 'The first crewed flight, in a Montgolfier hot-air balloon over Paris.', 'Balloon', ['Montgolfier', 'hot air balloon']],
    ['1903', 'The Wright brothers make the first powered aeroplane flight.', 'Wright brothers', ['Wright']],
    ['1927', 'Charles Lindbergh flies alone and nonstop across the Atlantic.', 'Lindbergh', ['Charles Lindbergh']],
    ['1932', 'Amelia Earhart becomes the first woman to fly alone across the Atlantic.', 'Earhart', ['Amelia Earhart']],
    ['1947', 'Chuck Yeager flies faster than the speed of sound.', 'Sound barrier', ['Yeager']],
    ['1969', 'Concorde makes its first flight.', 'Concorde', []],
    ['1970', 'The Boeing 747 jumbo jet carries its first passengers.', 'Jumbo jet', ['747', 'Boeing 747', 'jumbo']],
  ] },
  { title: 'Medicine and discovery', real: true, events: [
    ['1796', 'Edward Jenner tests the first smallpox vaccine.', 'Vaccine', ['Jenner', 'smallpox vaccine']],
    ['1895', 'Wilhelm Roentgen discovers X-rays.', 'X-rays', ['xray', 'Roentgen']],
    ['1898', 'Marie and Pierre Curie announce the discovery of radium.', 'Radium', ['Curie']],
    ['1928', 'Alexander Fleming notices penicillin killing bacteria.', 'Penicillin', ['Fleming']],
    ['1953', 'The double helix structure of DNA is published.', 'DNA', ['double helix']],
    ['1955', 'Jonas Salk\'s polio vaccine is declared safe and effective.', 'Polio', ['Salk', 'polio vaccine']],
    ['1980', 'The World Health Organization declares smallpox eradicated.', 'Smallpox', ['smallpox gone']],
  ] },
  { title: 'The Year Without Light (Veyra)', real: false, events: [
    ['104', 'The great lanterns dim as the moon goes missing from the sky.', 'Lanterns', ['lantern']],
    ['105', 'The fishermen sing loud songs to keep the dark away.', 'Songs', ['singing', 'fishermen']],
    ['106', 'Children trade glass beads for safe walks home.', 'Beads', ['glass beads']],
    ['107', 'The bakers bake small cakes shaped like suns.', 'Cakes', ['sun cakes']],
    ['108', 'Glowing moss spreads along the river banks.', 'Moss', ['glowing moss']],
    ['109', 'A painter paints the dark in silver and indigo.', 'Painter', ['painting']],
    ['110', 'The moon comes back, watched by a quiet crowd.', 'Moon', ['moon returns']],
  ] },
  { title: 'Building the Tongues Bridge (Veyra)', real: false, events: [
    ['304', 'Surveyors walk the muddy banks at dawn.', 'Surveyors', ['survey']],
    ['305', 'Stonecutters quarry pale marble from the riverbed.', 'Marble', ['stonecutters']],
    ['312', 'Lanterns are hung on the first stone arch.', 'Arch', ['first arch']],
    ['318', 'Merchants start carrying carts across.', 'Carts', ['merchants']],
    ['329', 'Painters lay gold leaf on every railing.', 'Gold leaf', ['gold']],
    ['333', 'The gargoyles are carved and set on the rails.', 'Gargoyles', ['gargoyle']],
    ['340', 'The bridge opens with music and dancing.', 'Opening', ['music', 'dancing']],
  ] },
];
export const DESKS = ['the door desk', 'the window desk', 'the map table', 'the ink stand', 'the reading lamp', 'the spiral stair', 'the high shelf'];

// ---------- the old tongue of Veyra (invented words; first drafts by Qwen, edited so none is an English word) ----------
export const OLD_TONGUE = [
  ['vello', 'kettle'], ['brunne', 'owl'], ['tallyn', 'lantern'], ['hessa', 'apple'], ['boonik', 'boot'], ['mirthle', 'mitten'],
  ['brelle', 'wool'], ['morna', 'blanket'], ['quillu', 'feather'], ['velu', 'hare'], ['talo', 'deer'], ['suri', 'goat'],
  ['borel', 'bread'], ['fenna', 'milk'], ['glova', 'cheese'], ['velk', 'hammer'], ['bruko', 'nail'], ['grym', 'chisel'],
  ['veltha', 'glove'], ['tunna', 'belt'], ['yeshka', 'hat'], ['olva', 'coat'], ['pessa', 'purse'], ['pluvo', 'rain'],
  ['velka', 'door'], ['bramthel', 'window'], ['dovrin', 'roof'], ['druma', 'drum'], ['pifa', 'flute'], ['rivon', 'river'],
  ['gurthak', 'cat'], ['ploshik', 'mouse'], ['thrumble', 'tea'], ['vexmull', 'latch'], ['tarnpuck', 'pot'], ['gloomthar', 'mist'],
  ['kestrin', 'ladder'], ['orvel', 'boat'], ['sannik', 'spoon'], ['fennow', 'candle'],
];

// ---------- the Clockwork Market ----------
// Fifteen stalls around the square, in walking order (invented). Real clock parts.
export const STALLS = ['the tea urn', 'the button seller', 'the bell maker', 'the map stall', 'the honey stall', 'the lamp stall', 'the rope stall', 'the glass blower',
  'the toy maker', 'the cheese stall', 'the kite seller', 'the candle stall', 'the fish stall', 'the spice stall', 'the tower steps'];
export const CLOCK_PARTS = ['mainspring', 'barrel', 'ratchet', 'click', 'pendulum', 'crutch', 'escapement', 'pallet', 'anchor', 'hairspring', 'balance wheel',
  'arbor', 'pinion', 'crown', 'winding stem', 'dial', 'bezel', 'jewel', 'pivot', 'fusee', 'chain', 'weight', 'bob', 'regulator', 'bell', 'hammer', 'cam'];

// ---------- vault tablets (invented; first drafts by Qwen, edited by hand) ----------
// Numbers are written as digits and names start with a capital: both must be exact. Everything else is forgiven a little.
export const TABLETS_V = [
  { title: "The Lamp-Maker's Last Order", lines: ['Trim the wick before dawn breaks', 'Place three blue candles in a row', 'Light them with a steady hand', 'Watch the mist pull back from the glass', 'Sleep well, the work is done'] },
  { title: "The Ferryman's Morning Count", lines: ['Row gently past the stone bridge', 'Call the names of the waiting travellers', 'Hold the rope until they step ashore', 'Count 12 coins into the tin', 'Tie the boat to the green post'] },
  { title: "The Baker's Midnight Note", lines: ['Knead the dough with warm hands', 'Add one spoon of wild honey', 'Let the bread rise by the stove', 'Slice it thin for the early ferry', 'Leave a loaf for Tansy'] },
  { title: "The River Keeper's Warning", lines: ['Do not drink from the silver stream', 'Wash your boots by morning light', 'Check the gate lock twice', 'Leave a coin for lost travellers', 'Light the lamp before the Tide'] },
  { title: "A Child's Hidden Game", lines: ['Hide the pebble under the mat', 'Draw three stars on the window', 'Wait until the street is quiet', 'Find the friend who lost their way', 'Sing softly so they hear you'] },
  { title: "The Clock Mender's Log", lines: ['Wind the tower clock at noon', 'Brush the dust out of the gears', 'Oil the spring with one drop', 'Set the hands by the harbour bell', 'Ring 4 times when all is well'] },
  { title: 'The Herb Stall Morning', lines: ['Open the lid of the wooden crate', 'The leaves smell like rain on stone', 'Tie a bundle of mint with twine', 'Take three silver coins from Mosk', 'Wrap the sage in brown paper'] },
  { title: 'The Night Ferry', lines: ['The boat slips into dark water', 'Every passenger holds a small lantern', 'The mist parts for the painted bow', 'An owl calls from the far bank', 'The dock lights shine through the fog'] },
  { title: "The Toll Keeper's Rule", lines: ['Stand at the gate of the bridge', 'Ask each cart for one copper', 'Drop the coins in the oak box', 'Wave the goat herders through for free', 'Close the gate at the 9th bell'] },
  { title: 'The Wet Stone Keeper', lines: ['Rain falls on the high wall', 'Moss softens every sharp edge', 'A puddle holds the grey sky', 'A toad waits on the mossy step', 'The stone drinks deep at summer end'] },
];

// ---------- lore found by passing trials (codex entries; unlock 'trial:<id>') ----------
export const TRIAL_LORE = [
  { id: 'lore_catacombs', title: 'The Unnamed', unlock: 'trial:catacombs', text: [
    'The statues under the Hall of Faces were carved in the Drowned Years by a mason who could no longer remember her own children\'s names. She carved their faces so she could at least keep those.',
    'The Wardens later added a plaque to every statue and a logbook beside the lectern. The plaques wore away. The logbook did not, because somebody always came down to read it.',
  ] },
  { id: 'lore_scriptorium', title: 'The Drain Chain', unlock: 'trial:scriptorium', text: [
    'The Scriptorium floods every few years. The scribes of old fitted a great iron drain under the lower floor and hid its chain behind the map table, so that only someone who knew the room by heart could find it in grey water.',
  ] },
  { id: 'lore_salt_vault', title: 'The Salt Guild Code', unlock: 'trial:salt_vault', text: [
    'The Salt Guild changed its vault code every night and wrote it in a single ledger. Its clerks were not allowed to copy it. They had to carry it home in their heads, as pictures along the walk from the cellar to their door.',
  ] },
  { id: 'lore_bridge', title: 'The Gargoyles of the Bridge', unlock: 'trial:bridge', text: [
    'The gargoyles of the Tongues Bridge were carved in the year 333 to keep the old tongue alive. They do not care how quickly a traveller learns. They only ask whether the words are still there a week later.',
  ] },
  { id: 'lore_gears', title: 'The Market Clock', unlock: 'trial:gears', text: [
    'The great clock of the Clockwork Market has stopped four times in its history. Each time, the stallholders put it back together from memory, walking the square from the tower steps back to the tea urn.',
  ] },
  { id: 'lore_vaults', title: 'The Sealed Vaults', unlock: 'trial:vault_quay', text: [
    'The Wardens hid small vaults all over Veyra, each with a tablet beside its door. A vault opens only for someone who can say its tablet back after a long wait. The Wardens thought this was fair: anyone may read a tablet, but only someone who keeps it may open the door.',
  ] },
];
