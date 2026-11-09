// v0.4 import security: 50 corrupted backups must each be refused with a plain message, never throw,
// and a valid v0.3 (schema 1) backup must migrate cleanly.
import { describe, it, expect } from 'vitest';
import { newProfile, SCHEMA } from '../src/engine/core.js';
import { buildExport, parseImport, migrate, MAX_IMPORT_BYTES } from '../src/store.js';
import { ITEMS } from '../src/data/items.js';
import { TREASURES, TABLETS } from '../src/data/crypt.js';
import { SIDE_QUESTS } from '../src/data/quests.js';
import { ACHIEVEMENTS } from '../src/data/story.js';

function rich() {
  const p = newProfile('Tester', 'key');
  p.progress.day = 30; p.progress.baselineDone = true; p.progress.trainingDates = ['2026-10-01', '2026-10-02'];
  p.palaces = [{ id: 'pal1', name: 'Home', loci: ['Door', 'Mat', 'Hook', 'Mirror', 'Sofa'] }];
  p.crypt = { keys: 2, deepest: 6, runs: 3, treasures: { ct_bone_dice: '2026-10-02' }, tablets: { tab_masons_mark: '2026-10-02' }, run: { floor: 4, lamps: 2, seed: 99, attempt: 0, log: [{ floor: 3, attempt: 0, acc: 0.9, pass: true }], found: { treasures: [], tablets: [] }, chests: 0 }, history: [{ cleared: 5, reason: 'tide' }] };
  p.story = { seen: ['ch1'], sideDone: { [SIDE_QUESTS[0].id]: '2026-10-02' } };
  p.achievements = { first_light: '2026-10-01' };
  p.stats.sessions = [{ date: '2026-10-01', type: 'full', minutes: 24 }];
  return p;
}
const exportOf = (p) => JSON.parse(buildExport(p));
const text = (d) => JSON.stringify(d);

const MUTATIONS = {
  'empty file': () => '',
  'only spaces': () => '   ',
  'not json': () => 'hello',
  'truncated json': (d) => text(d).slice(0, 200),
  'json array': () => '[]',
  'json null': () => 'null',
  'json number': () => '42',
  'wrong app': (d) => text({ ...d, app: 'other' }),
  'missing profile': (d) => text({ ...d, profile: undefined }),
  'profile is array': (d) => text({ ...d, profile: [] }),
  'newer schema': (d) => text({ ...d, schema: 99 }),
  'schema is text': (d) => text({ ...d, schema: 'two' }),
  'over the import cap': () => ' '.repeat(MAX_IMPORT_BYTES + 1),
  'no meta': (d) => { delete d.profile.meta; return text(d); },
  'no user': (d) => { delete d.profile.user; return text(d); },
  'alias is number': (d) => { d.profile.user.alias = 7; return text(d); },
  'alias too long': (d) => { d.profile.user.alias = 'x'.repeat(500); return text(d); },
  'day zero': (d) => { d.profile.progress.day = 0; return text(d); },
  'day 400': (d) => { d.profile.progress.day = 400; return text(d); },
  'day fraction': (d) => { d.profile.progress.day = 2.5; return text(d); },
  'negative lumen': (d) => { d.profile.progress.lumen = -5; return text(d); },
  'lumen is text': (d) => { d.profile.progress.lumen = '100'; return text(d); },
  'bad training date': (d) => { d.profile.progress.trainingDates = ['yesterday']; return text(d); },
  'unknown gate': (d) => { d.profile.progress.gates = ['M99']; return text(d); },
  'huge clock offset': (d) => { d.profile.progress.dayOffset = 99999; return text(d); },
  'skills missing': (d) => { delete d.profile.skills; return text(d); },
  'skill level 11': (d) => { d.profile.skills.imagery.level = 11; return text(d); },
  'skill probes not array': (d) => { d.profile.skills.imagery.probes = {}; return text(d); },
  'skill error count text': (d) => { d.profile.skills.imagery.errs.omission = 'many'; return text(d); },
  'result accuracy 2': (d) => { d.profile.results = [{ date: '2026-10-01', acc: 2, t: 'wordlist' }]; return text(d); },
  'sets not array': (d) => { d.profile.sets = 'none'; return text(d); },
  'palace stop too long': (d) => { d.profile.palaces[0].loci[0] = 'x'.repeat(1000); return text(d); },
  'palace with 500 stops': (d) => { d.profile.palaces[0].loci = Array(500).fill('a'); return text(d); },
  'palace name is object': (d) => { d.profile.palaces[0].name = { a: 1 }; return text(d); },
  'theme unknown': (d) => { d.profile.user.prefs.theme = 'neon'; return text(d); },
  'timer 10x': (d) => { d.profile.user.prefs.timerMult = 10; return text(d); },
  'volume 5': (d) => { d.profile.user.prefs.volume = 5; return text(d); },
  'text size 3': (d) => { d.profile.user.prefs.textSize = 3; return text(d); },
  'sound is text': (d) => { d.profile.user.prefs.sound = 'yes'; return text(d); },
  'crypt keys 50': (d) => { d.profile.crypt.keys = 50; return text(d); },
  'crypt unknown treasure': (d) => { d.profile.crypt.treasures.ct_fake = '2026-10-01'; return text(d); },
  'crypt tablet bad date': (d) => { d.profile.crypt.tablets.tab_masons_mark = 'soon'; return text(d); },
  'crypt run floor 0': (d) => { d.profile.crypt.run.floor = 0; return text(d); },
  'crypt run lamps 50': (d) => { d.profile.crypt.run.lamps = 50; return text(d); },
  'crypt run log bad acc': (d) => { d.profile.crypt.run.log = [{ acc: 7 }]; return text(d); },
  'crypt run unknown find': (d) => { d.profile.crypt.run.found.treasures = ['ct_fake']; return text(d); },
  'crypt history not array': (d) => { d.profile.crypt.history = {}; return text(d); },
  'unknown side quest': (d) => { d.profile.story.sideDone.fake_quest = '2026-10-01'; return text(d); },
  'achievement not a date': (d) => { d.profile.achievements.first_light = true; return text(d); },
  'session stats minutes text': (d) => { d.profile.stats.sessions = [{ date: '2026-10-01', minutes: 'ten' }]; return text(d); },
};

describe('corrupted backups (v0.4)', () => {
  it('has 50 cases', () => expect(Object.keys(MUTATIONS).length).toBe(50));
  for (const [name, mutate] of Object.entries(MUTATIONS)) {
    it(`refuses: ${name}`, () => {
      const r = parseImport(mutate(exportOf(rich())));
      expect(r.ok).toBe(false);
      expect(typeof r.error).toBe('string');
    });
  }
  it('accepts the rich profile it started from', () => {
    const r = parseImport(buildExport(rich()));
    expect(r.error).toBeUndefined();
    expect(r.ok).toBe(true);
  });
});

describe('migration from v0.3 saves', () => {
  it('turns implicit sound off, keeps an explicit choice and adds new records', () => {
    const old = rich(); old.meta.schema = 1; delete old.tips; delete old.relics; delete old.stats;
    old.user.prefs = { theme: 'dark', reducedMotion: false, timerMult: 1 };
    const m = migrate(structuredClone(old));
    expect(m.user.prefs.sound).toBe(false);
    expect(m.user.prefs.blips).toBe(true);
    expect(m.tips.seen).toEqual([]); expect(m.relics.polish).toEqual({}); expect(m.stats.sessions).toEqual([]);
    expect(m.meta.schema).toBe(SCHEMA);
    old.user.prefs.sound = true;
    expect(migrate(structuredClone(old)).user.prefs.sound).toBe(true);
  });
  it('imports a schema 1 backup', () => {
    const old = rich(); old.meta.schema = 1; delete old.tips; delete old.relics; delete old.stats;
    const d = exportOf(old); d.schema = 1;
    const r = parseImport(text(d));
    expect(r.ok).toBe(true);
    expect(r.profile.meta.schema).toBe(SCHEMA);
  });
});

// Saved data keys on these ids. Adding ids is fine; changing or removing one breaks old saves.
const FROZEN_ITEM_IDS = [
  'brass_lantern wrens_notecard art_grey_glove art_side_door_key art_hall_chisel art_cipher_wheel art_silver_bolt',
  'art_seal_ring art_stolen_record art_widows_hood art_mirror_shard art_waystation_register art_rite_cup',
  'art_ysolde_ember page_1 page_2 page_3 page_4 page_5 page_6 page_7 page_8 page_9 page_10 page_11 page_12',
  'trinket_m1_ferry trinket_m1_tea trinket_m2_walls trinket_m2_back trinket_m3_names trinket_m3_drifter',
  'trinket_m4_smuggler trinket_m4_books trinket_m5_clock trinket_m5_invite trinket_m6_riddle trinket_m6_grief',
  'trinket_m7_forger trinket_m7_doubt trinket_m8_stair trinket_m8_masque trinket_m9_mirror trinket_m9_face',
  'trinket_m10_hollow trinket_m10_road trinket_m11_pace trinket_m11_song trinket_m12_kept trinket_m12_year',
  'ct_bone_dice ct_silver_mirror ct_wardens_compass ct_nameless_crown ct_ysolde_wick ct_tide_pearl ct_hollow_mask',
  'ct_iron_key ct_star_chart ct_grey_phial ct_heart_stone ct_lamp_of_ages seal_first_light seal_cornerstone',
  'seal_clean_sweep seal_walking_backward seal_it_stayed seal_week_later seal_rekindled seal_steady_flame',
  'seal_honest_ledger seal_sharper seal_quay_restored seal_face_reader seal_number_smith seal_safe_keeping',
  'ct_bone_dice ct_silver_mirror ct_wardens_compass ct_nameless_crown ct_ysolde_wick ct_tide_pearl ct_hollow_mask',
  'ct_iron_key ct_star_chart ct_grey_phial ct_heart_stone ct_lamp_of_ages tab_masons_mark tab_river_folk',
  'tab_first_tide tab_nameless_kings tab_king_who_carved tab_sleepwalkers tab_girl_with_lamp tab_hesper',
  'tab_hesper_teaching tab_hesper_price tab_thirteenth_oath tab_kings_request tab_river_learned tab_where_it_goes',
  'tab_last_stone m1_ferry m1_tea m2_walls m2_back m3_names m3_drifter m4_smuggler m4_books m5_clock m5_invite',
  'm6_riddle m6_grief m7_forger m7_doubt m8_stair m8_masque m9_mirror m9_face m10_hollow m10_road m11_pace',
  'm11_song m12_kept m12_year first_light cornerstone clean_sweep walking_backward it_stayed week_later rekindled',
  'steady_flame honest_ledger sharper quay_restored face_reader number_smith safe_keeping',
  // v0.6 mid-year seals
  'seal_month_holder seal_long_memory seal_midsummer',
].join(' ');
describe('permanent ids', () => {
  it('no released item, treasure, tablet or quest id has changed', () => {
    const now = new Set([...ITEMS.map((x) => x.id), ...TREASURES.map((x) => x.id), ...TABLETS.map((x) => x.id), ...SIDE_QUESTS.map((x) => x.id), ...ACHIEVEMENTS.map((x) => x.id)]);
    const missing = FROZEN_ITEM_IDS.split(' ').filter((id) => !now.has(id));
    expect(missing).toEqual([]);
  });
});
