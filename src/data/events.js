// 1.1 The Event Hall and the Say-Back Games: names, tiers, scales, the rival and her lines, and the saved record's blank shape.
// Story text adapted from docs/drafts/additions/story/03-say-back-games.md (approved by the owner, Nov 2, 2026). No real
// championship is named anywhere. The Games are Veyra's own. Plain, warm language, no em dashes.
// Event ids key saved data (p.events.best): never rename them once released.

export const EVENT_IDS = ['names', 'numbers', 'cards', 'poem', 'words', 'strikes', 'decks', 'dates', 'facts'];
export const SEASON_EVENTS = EVENT_IDS.slice(0, 7); // the seven Say-Back events; dates and facts are Hall practice only
export const HISTORY_CAP = 60;

// Each event: the plain name (what the drill is), the Veyran name, the story reason, the ladder (sizes by level) and the
// key into src/data/add/eventcopy.json (the D draft calls the face event "faces").
export const EVENTS = {
  names: { id: 'names', copy: 'faces', plain: 'Names and Faces', hall: 'The Hall Round', why: 'The Wardens greeted every citizen by name. Faces from the Hall of Faces.', sizes: [12, 16, 20, 24], unit: 'faces', kind: 'names', gate: 'M10' },
  numbers: { id: 'numbers', copy: 'numbers', plain: 'Speed Numbers', hall: 'The Counting Rows', why: 'The Counting House tallies. Rows of digits like rows of lamps.', sizes: [1, 2, 3, 4], unit: 'rows', kind: 'numbers', gate: 'M10' },
  cards: { id: 'cards', copy: 'cards', plain: 'Speed Cards', hall: 'The Rook Run', why: 'Lamplighters played Rook through the Vigil. A deck run in order. Cards are optional and earn nothing.', sizes: [10, 15, 20, 26, 39, 52], unit: 'cards', kind: 'cards', gate: 'M10' },
  poem: { id: 'poem', copy: 'poem', plain: 'Poetry', hall: 'The Vigil Verse', why: 'The songs sung through the night. A poem you have not seen.', sizes: [4, 6, 8, 12, 16], unit: 'lines', kind: 'poem', gate: 'M10' },
  words: { id: 'words', copy: 'words', plain: 'Words to Remember', hall: 'The Bridge Tally', why: 'Reading the numbered clauses of the Compact on the Tongues Bridge. Words asked by number.', sizes: [20, 40, 100], unit: 'words', kind: 'words', gate: 'M10' },
  strikes: { id: 'strikes', copy: 'strikes', plain: "Three Strikes You're Out", hall: 'Three Lamps Out', why: 'Each wrong answer puts out a lamp. Three out ends your round, warmly, with the answers shown.', sizes: [4, 5, 6], unit: 'people', kind: 'strikes', gate: 'M10' },
  decks: { id: 'decks', copy: 'decks', plain: 'Double Deck', hall: 'The Double Rook', why: 'Two decks at once, the hardest Vigil game. One miss ends the round, warmly.', sizes: [20, 26, 39, 52], unit: 'cards', kind: 'decks', gate: 'M10' },
  dates: { id: 'dates', copy: null, plain: 'Year Round', hall: 'Year Round', why: 'A Veyra contest invented for the game: real events, and the year of each.', sizes: [10, 14, 21, 28], unit: 'events', kind: 'dates', gate: 'M10' },
  facts: { id: 'facts', copy: null, plain: 'Fact Round', hall: 'Fact Round', why: 'A Veyra contest invented for the game: checked facts kept with pictures.', sizes: [12, 18, 24, 36], unit: 'facts', kind: 'facts', gate: 'M10' },
};

// Text for the two events that have no entry in the D copy (Year Round and Fact Round come from the E drafts).
export const EXTRA_COPY = {
  dates: {
    name: 'Year Round', trains: 'Dates and timelines (Month 4 on).',
    how: 'You see real events, each with its year, for a set study time. Then the same events return in a new order and you give the year of each.',
    ours: '10 to 28 real events from the game\'s checked list of public history. Years are exact: every digit must be right, and a year before the common era needs BCE.',
    rules: ['Study time is about 12 seconds an event and is shown before you begin.', 'Recall shows the events in a new order. Type the year.', 'One point for each year with every digit right. A year one off is wrong. A blank costs nothing.', 'Nothing here changes your skill estimates or earns Lumen. Only your best result is kept.'],
    study: 'Make a picture for the year (the Major System works well) and a picture for the event, and put both on the same stop.',
    recall: 'Walk your stops and type the year for each event.',
    scoring: 'One point for each year with every digit right, out of the number of events.',
    advice: ['Learn the year in two pairs of digits and give each pair a picture.', 'Say the event and the year together as you study.'],
    honest: 'Years are practised here as a sport skill. Do not read the score as a measure of how much history you know. Year Round is a Veyra contest, not a real championship format.',
  },
  facts: {
    name: 'Fact Round', trains: 'Facts and outlines (Month 7 on).',
    how: 'Questions and their answers are shown for the study time. After that they come back as questions in a new order, and you type each answer.',
    ours: '12 to 36 checked facts from science, geography, history, art and language. Numbers must be exact; words are forgiven small typos.',
    rules: ['Study time is about 15 seconds a fact and is shown before you begin.', 'Recall asks the questions in a new order. Type the answer.', 'One point for each right answer. A blank costs nothing.', 'Nothing here changes your skill estimates or earns Lumen. Only your best result is kept.'],
    study: 'Give each answer a picture that joins it to the question, and place the pictures on stops in order.',
    recall: 'Read the question, go to its stop, and type what the picture tells you.',
    scoring: 'One point for each right answer, out of the number of facts.',
    advice: ['A fact with a number needs a number picture as well as a word picture.', 'Answer what you know first and come back for the rest.'],
    honest: 'This practises keeping facts with pictures. It is not a general knowledge test and does not measure how much you know. Fact Round is a Veyra contest, not a real championship format.',
  },
};

// ---------- the Say-Back Games ----------
export const GAMES_TITLE = 'The Say-Back Games';
export const GAMES_STORY = [
  'The Say-Back began in the Long Vigil. In the first years after the Compact, the whole city stayed awake on the Night of No Moon with lamps in their hands, holding the Gate. It was a very long night and people kept nodding off. So neighbours began to test each other in the dark: "Tell me the names on my street." "Say back the verse we sang an hour ago." Whoever could say it back kept the others awake and the lamps lit. Saying a thing back to someone is a promise that you will remember them.',
  'The Wardens made it a ladder. The best Say-Back players could carry a route through a thin Tide, so the Wardens turned the game into a way to find new Wardens: any citizen could enter, and the best climbed through the districts until the last round, held in the Amphitheatre before the Warden\'s own lamp.',
  'The Rite of Echoes is the hard old cousin, where an office is at stake. The Games are the kind form: the only thing you can lose is a ribbon. When paper grew cheaper than practice, the Games became a hobby of the rich, kept going by one family who kept them for themselves. That is the family of Ottoline Gilt, who has polished the blank plate on the Lamp Cup all her life without ever reading it.',
];
export const GAMES_RULES = [
  'The Season has five tiers. Each tier raises the scale of the events and adds a new one. The next tier opens when you have posted a result in enough events. A result only has to be played, not passed.',
  'Ottoline never races you and never watches a clock. When a tier opens, the game notes your best result in each event. Her mark is that best, times a factor, with a few stumbles of her own. You see her marks only after you have posted yours.',
  'The Final is a night, not a grind. Your best result in each of the seven events is set beside hers. Light four of the seven lamps and the Lamp Cup is yours. Ties go to you. Lose it and nothing locks: replay any event and light the lamps again whenever you like.',
  'Events here never change your skill estimates and earn no Lumen. The only thing kept is your own best. Scores measure performance on Mnemos tasks.',
];

// The tiers. at = { event: level } is the scale played in that tier. need = how many events must be posted.
export const TIERS = [
  { n: 1, name: 'The Quay Heat', where: "Lamplighters' Quay, at lamp-lighting", need: 3, factor: 1.10, at: { names: 1, poem: 1, cards: 1 }, blurb: 'Open to everyone. Twelve faces, a short verse and a short deck run.' },
  { n: 2, name: 'The Gallery Heat', where: 'The Long Gallery', need: 3, factor: 1.07, at: { names: 2, poem: 2, cards: 2, numbers: 1, words: 1 }, blurb: 'Two more events join. Play any three of the five.' },
  { n: 3, name: 'The City Cup', where: 'The Harbour, on the quay steps', need: 4, factor: 1.04, at: { names: 3, poem: 3, cards: 3, numbers: 2, words: 2, strikes: 1 }, blurb: 'Three Lamps Out joins. Play any four of the six.', stumble: { strikes: 0.85 } },
  { n: 4, name: 'The Compact Round', where: 'The round hall under the copper dome', need: 5, factor: 1.01, at: { names: 4, poem: 4, cards: 4, numbers: 3, words: 2, strikes: 2, decks: 1 }, blurb: 'The Double Rook joins. Play any five of the seven.' },
];
export const FINAL = {
  n: 5, name: 'The Lamp Final', where: 'The Amphitheatre of Echoes', need: 4,
  at: { names: 4, poem: 4, cards: 4, numbers: 3, words: 2, strikes: 2, decks: 1 },
  // Four events she should win, three she should lose.
  factors: { names: 1.04, numbers: 1.04, cards: 1.04, poem: 1.04, words: 0.97, strikes: 0.97, decks: 0.97 },
};
export const RIVAL = { name: 'Ottoline Gilt', nick: 'Lantern', art: 'portrait_ottoline_gilt', cap: 0.96, defaultRatio: 0.5, close: 0.03 };

export const RIVAL_INTRO = 'Nineteen, only daughter of Gilt & Daughters, lamp-oil and wicks, the richest supplier in Veyra. Tall, immaculate, a ribbon in her hair for each tier she has won. She has seven tutors, one for each event, and a very small man whose only job is to carry the first tutor\'s umbrella. She is fast on a prepared picture and brittle on a new one, and believes these are the same as skill.';

// What she says. before: when the tier opens. beat: your marks were better. hers: hers were better. close: nearly level.
export const RIVAL_LINES = {
  1: { before: 'Oh, it is the Lantern. How brave of you to enter. I am told it is good for the character.', beat: 'Beginner\'s luck. Do not get used to it.', hers: 'Well. That was less of a contest than I had been promised.', close: 'A tie, nearly. The judges are very generous this evening.' },
  2: { before: 'Pell has prepared the portraits for me. All twelve. In order. You are doing your own? How rustic.', beat: 'Fine. You are quick. I am not worried. I am simply noting it.', hers: 'My pictures are better than yours, you know. They cost more.', close: 'Hm. A hair. You must have a very good lamp.' },
  3: { before: 'I have been practising three lamps out. Lamps are a Gilt speciality, after all.', beat: 'Do not look at me like that. A lamp was loose. A lamp is always loose.', hers: 'Three lamps, and not one out for me. Tutors, you see.', close: 'Mine went out early. It was a bad lamp. It was a very bad lamp.' },
  4: { before: 'I have sent them home. All seven. And the umbrella man. This is entirely my choice, you understand.', beat: 'Right. Right. I shall do my own pictures. It is all right. I have a notebook.', hers: 'I did that one with my own pictures. Mine. Did you see?', close: 'A breath. A single breath. I rather liked it.' },
  5: { before: 'No tutors. No lists. No umbrella. Just the stairs of the nursery, and me.', beat: 'Well done, {name}. Do not let it go to your head. It has plenty of room.', hers: 'I won, did I? Hm. You were better than the numbers say. Practise again. I should hate to win on a bad day.', close: 'Four lamps. You have no idea how loud my heart is.' },
};
// Short scenes between tiers, shown once the tier is closed (story beats from the draft).
export const RIVAL_SCENES = {
  3: 'Later, behind the last lamp on the Quay, you see her alone, wiping her eyes. "Tell anyone and I shall have you fined," she says, and walks off very straight.',
  4: 'She turns up with a plain notebook and asks, without looking at you, how to choose what a thing should look like. "Do not read anything into it," she adds.',
  5: 'She walked her own route, the stairs of the nursery in Gilt House, the only place she has ever been alone. Win or lose, she shakes your hand, and asks if you might practise together.',
};
export const RIVAL_CLOSING = ['"Again next year. Without Pell. I shall let you pick the verse."', 'She hangs her own notebook on the Cup stand. In its first pages, in her own hand, is a picture of the Quay steps that she made herself.'];

// Chronolog entries (lore.js shape). unlock 'events:N' = at least N tiers closed, 'events:cup' = the Lamp Cup won.
export const EVENT_LORE = [
  { id: 'lore_say_back', title: 'The Say-Back', unlock: 'events:1', text: [
    'In the first years of the Long Vigil, neighbours kept each other awake by saying things back: names, verses, the order of a market row. The Wardens turned it into a ladder, and the ladder became the Say-Back Games.',
    'Winners\' names are read aloud at the Vigil every year. To be said back by the whole city, once, is the highest honour in Veyra.',
  ] },
  { id: 'lore_lamp_cup', title: 'The Lamp Cup', unlock: 'events:cup', text: [
    'The Lamp Cup is a small brass lamp on a stand. Its founder\'s plate is worn blank, and the Gilt family have polished it for generations without reading it. Nobody remembers who first set the Say-Back in order.',
    'The winner of the Final hangs a notebook beside it, by custom, so that the next player can see how it was done.',
  ] },
];

export const HALL_HONEST = 'These contests are made-up formats on Mnemos material. A result shows how you did on that task on that day. Scores measure performance on Mnemos tasks. They are not an IQ or clinical test.';

// The saved record. Added in 1.1 (SCHEMA stays 2): store.js migrate() creates it when missing.
// best[id] = { [level]: { score, max, date } } or null. season.marks[tier][id] = [yours, hers] as shares of the maximum.
export const blankEvents = () => ({
  v: 1,
  best: Object.fromEntries(EVENT_IDS.map((id) => [id, null])),
  history: [],
  pace: false,
  season: { tier: 0, snap: {}, posted: {}, marks: {}, started: null, won: null, lamps: null },
});
