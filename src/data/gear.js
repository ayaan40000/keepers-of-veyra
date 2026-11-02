// v0.10 Keeper's gear: what can be worn. Only relics the player already owns can be equipped.
// Effects are cosmetic or study support, and never show an answer before you have recalled it.
export const SLOTS = [
  { id: 'lantern', name: 'Lantern', blurb: 'Carried in your left hand.' },
  { id: 'cloak', name: 'Cloak', blurb: 'Worn over your shoulders.' },
  { id: 'charm', name: 'Charm', blurb: 'Pinned at your chest. Any seal, trinket or keepsake you own.' },
  { id: 'tool', name: 'Tool', blurb: 'Hung at your belt.' },
];

// effect: 'letters' | 'count' | 'stops' | 'cosmetic'. item: the relic that must be owned (null = always owned).
// look: how the paper doll draws it.
export const GEAR = [
  { id: 'brass_lantern', slot: 'lantern', effect: 'cosmetic', flame: '#ffd98a', title: 'Brass Lantern', note: 'Warm amber light. Cosmetic.' },
  { id: 'gear_river_glass_lamp', slot: 'lantern', effect: 'letters', flame: '#9fd8ff', title: 'Lantern of Letters', note: 'In a battle, after a wrong answer it shows the first letter and lets you try once more at half damage.' },
  { id: 'art_ysolde_ember', slot: 'lantern', effect: 'cosmetic', flame: '#ff9a4a', title: 'Ember of Ysolde', note: 'An ember that never goes out. Cosmetic.' },

  { id: 'cloak_dusk', slot: 'cloak', item: null, effect: 'cosmetic', color: '#3e4e6a', title: 'Dusk Cloak', note: 'Your first cloak. Cosmetic.' },
  { id: 'art_side_door_key', slot: 'cloak', effect: 'cosmetic', color: '#2e5a5a', title: 'Gallery Cloak', note: 'Teal, from the Long Gallery. Cosmetic.' },
  { id: 'art_seal_ring', slot: 'cloak', effect: 'cosmetic', color: '#5a3e7a', title: 'Warden Cloak', note: 'Violet, from the Tongues Bridge. Cosmetic.' },
  { id: 'art_mirror_shard', slot: 'cloak', effect: 'cosmetic', color: '#7a3e30', title: 'Mirror Cloak', note: 'Ember red, from the Mirror Wards. Cosmetic.' },
  { id: 'cloak_rite', slot: 'cloak', item: 'art_rite_cup', effect: 'cosmetic', color: '#8a7430', title: 'Rite Cloak', note: 'Gold-brown, from the Rite of Echoes. Cosmetic.' },

  { id: 'wrens_notecard', slot: 'tool', effect: 'cosmetic', look: 'card', title: 'Notecard', note: 'A blank card. Cosmetic.' },
  { id: 'gear_ledger_pouch', slot: 'tool', effect: 'count', look: 'scroll', title: 'Scroll of Order', note: 'In a battle, when a list is asked about, it shows how many items there were. Never what they were.' },
  { id: 'gear_tide_map_case', slot: 'tool', effect: 'stops', look: 'map', title: 'Palace Map', note: 'In a Locate question, it lists the stops that are still empty. Never the items.' },
  { id: 'gear_salt_chalk_sticks', slot: 'tool', effect: 'cosmetic', look: 'chalk', title: 'Salt Chalk', note: 'Chalk for marking stops. Cosmetic.' },
  { id: 'gear_wick_trimmer', slot: 'tool', effect: 'cosmetic', look: 'trimmer', title: 'Wick Trimmer', note: 'Trims a wick. Cosmetic.' },
  { id: 'gear_brine_satchel', slot: 'tool', effect: 'cosmetic', look: 'pouch', title: 'Brine Satchel', note: 'A salt-stained satchel. Cosmetic.' },
];
// Charms are any owned item of these kinds.
export const CHARM_KINDS = ['seal', 'trinket', 'keepsake'];
// The relic behind each option (cloak_dusk has none: always owned).
export const itemOf = (g) => (g.item === undefined ? g.id : g.item);
export const GEAR_BY_ID = Object.fromEntries(GEAR.map((g) => [g.id, g]));
