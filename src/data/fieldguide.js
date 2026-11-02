// v0.10 The Keeper's Field Guide: using the year's methods on your own life.
// First drafts by a local model, fact-checked and edited by hand (see docs/CHAMPIONS.md for the review).
// Rules: only methods the game teaches (Major System, never the letter-based Dominic System), no secrets
// (passwords, PINs, bank or medical details), honest limits on every page, no rewards for real-life use.

export const GUIDE_CLAIM = 'The year trains specific skills: turning things into pictures, putting them in places, and checking yourself later. They help most with lists, names, orders and exact wording, when you choose to use them. They will not make everything easier to remember, and they do not build understanding. Mnemos scores describe how you did on Mnemos tasks, nothing more. The surest thing we know is that checking yourself after a gap is what makes a memory last. So choose a few things that matter, keep them well, and come back to them.';

export const GUIDE_SAFETY = [
  'Passwords, PINs, bank and card numbers, door codes: use a password manager or keep them somewhere safe. Never make pictures of them.',
  'Medicine times and safety checklists: use a pill organiser, alarms or the written list. Do not rely on memory.',
  'Anything you need exactly and cannot afford to get wrong: write it down as well. Pictures are your second copy, not your only one.',
];

export const RECIPE = [
  { n: 1, title: 'Choose', text: 'Decide what is worth keeping, and how exact it must be: word for word, or just the gist. If it is an idea rather than a list, understand it first and say it in your own words.' },
  { n: 2, title: 'Cut it into pieces', text: 'Seven to ten pieces at a time, the way the drills were sized. Small and finished beats big and half done.' },
  { n: 3, title: 'Picture it and place it', text: 'Turn each piece into one lively picture (Month 1). Put each picture in a place (Month 2) or link it to the next one.' },
  { n: 4, title: 'Check yourself without looking', text: 'Then fix only the pictures that failed. Make them more personal, more vivid, or touching the place harder.' },
  { n: 5, title: 'Come back later', text: 'Tomorrow, a week later, a month later. This is the step people skip, and it is the one that makes it last.' },
];

// One small real-life task right after each gate. unlock = the gate that opens it. Self-reported: no Lumen, no streaks, no relics.
export const REAL_TRIES = [
  { id: 'try-m1', unlock: 'M1', title: 'Tomorrow\'s errands', minutes: 8, text: 'Link tomorrow\'s seven errands into one silly story. Say it back at lunchtime, then check against a written list.' },
  { id: 'try-m2', unlock: 'M2', title: 'Pack five things', minutes: 8, text: 'Put five things you will pack for a trip in five spots at home. Recall them forwards, then backwards.' },
  { id: 'try-m3', unlock: 'M3', title: 'Three names', minutes: 8, text: 'Learn three names from a work or class page, or the cast of a show. Say each one aloud once, and look at them again tomorrow morning.' },
  { id: 'try-m4', unlock: 'M4', title: 'A number you can share', minutes: 6, text: 'Turn one ordinary number into a picture with the Major System: a house number, a flight number or a year in history. Never a code or a PIN.' },
  { id: 'try-m5', unlock: 'M5', title: 'A friend\'s phone number', minutes: 10, text: 'Learn one friend\'s number as a short picture story. Keep it saved in your contacts too. The picture is your second copy.' },
  { id: 'try-m6', unlock: 'M6', title: 'Five new words', minutes: 10, text: 'Make sound-alike pictures for five words in a language you really want to learn (with the gender, if it has one). Say them aloud, and check yourself tomorrow.' },
  { id: 'try-m7', unlock: 'M7', title: 'Four lines', minutes: 10, text: 'Learn a four-line poem or five facts from today\'s article. Get the gist first, then the exact words.' },
  { id: 'try-m8', unlock: 'M8', title: 'Re-run yesterday', minutes: 6, text: 'Re-run your trip list from memory without looking, then put a day-7 check in your calendar.' },
  { id: 'try-m9', unlock: 'M9', title: 'Tell look-alikes apart', minutes: 8, text: 'Take three pairs of look-alikes (similar words, similar colleagues, similar bus routes). Give each one its own picture.' },
  { id: 'try-m10', unlock: 'M10', title: 'Your everyday palace', minutes: 10, text: 'Build a fixed six-stop palace at home and use it for today\'s to-do list. Wipe it clean tonight, ready for tomorrow.' },
  { id: 'try-m11', unlock: 'M11', title: 'One minute, five points', minutes: 8, text: 'Say a five-point, one-minute talk aloud while you time yourself, with a friend or a mirror watching.' },
  { id: 'try-m12', unlock: 'M12', title: 'Choose what to keep', minutes: 10, text: 'Pick one thing to keep for good: a poem, a word set, a set of birthdays. Put reviews on day 1, 7, 30 and 90 in your calendar.' },
];

// Playbooks. unlock = the gate that opens the page. Each is a short, honest how-to.
export const PLAYBOOKS = [
  {
    id: 'everyday', unlock: 'M1', title: 'Lists, errands and keys', months: 'Months 1 and 2',
    intro: 'Short lists and small jobs are where pictures earn their keep, especially when your hands are full and you cannot write.',
    example: 'For a short list, run a story: milk pours down your hair, eggs crack on your shoulders, spinach is stuffed in your pockets. For errands, walk your commute: a leaking battery at the coffee shop reminds you to buy batteries. For keys, notice on purpose: when you set them down, pause half a second and see the counter bursting into flames. That one is not a system, it is just paying attention at the moment it counts.',
    steps: ['Pick a short route you know by heart, such as five spots at home or on your commute.', 'Turn each item into one lively picture and put it at its spot.', 'Walk the route once, then check it against your note.'],
    review: 'Check again an hour later, then clear the route for next time.',
    caveat: 'For a short list, a written note is often just as good. Use pictures when you cannot write, and as a second copy.',
  },
  {
    id: 'talk', unlock: 'M2', title: 'A talk without notes', months: 'Months 2 and 7',
    intro: 'A palace gives your main points a fixed order, so you can speak naturally while you walk through them in your head.',
    example: 'Your first point is financial growth and your first stop is the front door: a gold tree bursts through the doorway. Your second point waits at the kitchen sink. You do not memorise the sentences. The pictures remind you what comes next, and your own words do the rest.',
    steps: ['Choose one stop for each main point, in a place you know well.', 'Make one strong picture for each point, not the words.', 'Walk the route aloud twice. Learn only your opening and closing lines word for word.'],
    review: 'Rehearse the walk the day before, and once more an hour before you speak.',
    caveat: 'This keeps your points in order. It does not make the content good, and it works best on points you understand. Keep a card in your pocket as a backup.',
  },
  {
    id: 'names', unlock: 'M3', title: 'Names and faces', months: 'Month 3',
    intro: 'Names are hard because a name has nothing to hold on to. A picture and a face feature give it something.',
    example: 'You meet Baker, who has thick eyebrows: picture loaves of bread baking on his eyebrows. You meet Sarah, who wears bright glasses: she tears (tear-ah) the glasses in half. Then use the name once aloud in conversation.',
    steps: ['Look for the most noticeable feature, and ask for the name again if you missed it.', 'Turn the name into a picture and join it to the feature in one scene.', 'Use the name once in conversation. That evening write the list down.'],
    review: 'Look at the list the next morning, then again a week later.',
    caveat: 'Pictures only help if you were paying attention when you met. The gains in real life are modest, and the next-day review matters most.',
  },
  {
    id: 'numbers', unlock: 'M4', title: 'Numbers you can share', months: 'Months 4 and 5',
    intro: 'The Major System turns numbers into sounds, and sounds into words you can picture.',
    example: 'The number 2680 splits into 26 and 80. 26 sounds like n and ch, so "niche". 80 sounds like f and s, so "face". Picture a face peering out of a niche in a wall. Dates in history work the same way: a year becomes a little scene at a place.',
    steps: ['Split the number into pairs.', 'Turn each pair into a word with the sound code, then into a picture.', 'Put the pictures in a place, or link them in order.'],
    review: 'Check after ten minutes, the next morning and a week later. For a friend\'s phone number, keep it saved in your contacts too.',
    caveat: 'Use it for numbers you need exactly and can share, like dates, house numbers and friends\' numbers. Never for PINs, passwords or bank details.',
  },
  {
    id: 'language', unlock: 'M6', title: 'Words in a new language', months: 'Months 6 and 8',
    intro: 'The keyword method turns a new sound into a picture of a sound-alike word you already know, joined with the meaning.',
    example: 'The French word champignon means mushroom (le champignon). Picture a mushroom wearing a champion\'s swimsuit. Put words from the same theme in the same room of a palace.',
    steps: ['Pick ten new words from one theme.', 'Make a sound-alike picture for each, joined with its meaning (and its gender).', 'Say each word aloud as you place it in its room.'],
    review: 'Check yourself on day 1, day 7 and day 30. Mix in real use: listen, read and speak.',
    caveat: 'Pictures get a word started. Alone they are weak for the long run, and they do not teach grammar or pronunciation.',
  },
  {
    id: 'study', unlock: 'M7', title: 'Study and exams', months: 'Months 7, 8 and 9',
    intro: 'Understand first. Then use pictures for the parts you must know exactly: terms, orders and lists.',
    example: 'A palace for each topic: one picture per key term on a piece of furniture. When you review, close the book and walk the room, saying what each picture stands for, instead of rereading.',
    steps: ['Read until you can explain the idea in plain words.', 'Make one picture for each term or list item you must know exactly.', 'Walk the palace once, then test yourself without looking.'],
    review: 'Test yourself again after a gap, and again a few days before the exam.',
    caveat: 'Pictures store labels, not understanding, and nothing here promises an exam result.',
  },
  {
    id: 'poem', unlock: 'M7', title: 'A poem, lyrics or lines', months: 'Months 1, 2 and 7',
    intro: 'Give each stanza its own room and each line one picture, so the order is safe.',
    example: 'Verse one waits at the front door, verse two in the hall. Learn the feeling and the gist first, then the exact words. Use the first letter of each word to check yourself.',
    steps: ['Read the whole piece once for its meaning.', 'Give each stanza a room and each line a picture.', 'Check by first letters, stanza by stanza, then the whole piece.'],
    review: 'Review over several days rather than in one sitting.',
    caveat: 'Exact wording needs many spaced checks. The pictures hold the order; repetition holds the words.',
  },
  {
    id: 'books', unlock: 'M7', title: 'Keeping what you read', months: 'Months 7 and 10',
    intro: 'Read to Remember: pick one key idea a chapter, picture it, and give it a place.',
    example: 'When a chapter ends, close the book for thirty seconds and turn its key idea into one picture. Put the picture on something in the room, the window for chapter one, the lamp for chapter two. Next day, glance at those spots and recall yesterday\'s ideas before you read on. For a book you love, give it a room of its own.',
    steps: ['Mark one key idea in each chapter while you read.', 'Say the idea in your own words, then turn it into a picture.', 'Place it in the room and review it before you read on tomorrow.'],
    review: 'Next morning, then a week later, then when you finish the book.',
    caveat: 'A picture stores a label, not the argument. Understand and say the idea in your own words first. Then the picture is a cue for the few ideas you really want to keep.',
  },
  {
    id: 'speedmath', unlock: 'M8', title: 'Numbers and mental maths', months: 'Months 4, 5 and 8',
    intro: 'This one needs the most honesty. Pictures do not make most mental arithmetic faster.',
    example: 'To multiply 43 by 67 in your head, work left to right and say the partial results aloud: forty times sixty-seven is two thousand six hundred and eighty, three times sixty-seven is two hundred and one, so 2881. For a tip, the 10 percent trick is the real shortcut. Pictures are for things you want to keep exactly: a constant like pi to a few places, or a formula as a little story.',
    steps: ['Pick one constant or formula you want to recall exactly.', 'Turn each part into one picture, using the Major System for digits.', 'For sums, practise saying the partial results aloud, left to right.'],
    review: 'Check the constant or formula tomorrow and a week later.',
    caveat: 'Fast mental calculators mostly rely on calculation methods and number facts they know by heart. Turning a half-finished sum into a picture usually costs more time than it saves.',
  },
  {
    id: 'newskill', unlock: 'M10', title: 'A new skill or hobby', months: 'Months 2 and 10',
    intro: 'Pictures help with the fixed lists inside a skill. The skill itself comes from doing it.',
    example: 'Pick the few things you will really use: the order of sharps in music, the steps of a framework, the five moves of a drill. Give each one a picture and a place in a palace used only for that skill. Walk it before you practise, as a checklist.',
    steps: ['Choose the few rules, terms or steps you will really use.', 'Give each one a picture and a place.', 'Walk the route before you practise, then go and practise.'],
    review: 'Walk it before each session at first, then once a week.',
    caveat: 'Code is learned by writing code, music by ear and fingers, movement by practice and a coach. A mental walk-through never replaces them.',
  },
  {
    id: 'cards', unlock: 'M5', title: 'Cards and memory sport', months: 'Months 5 and 11',
    intro: 'For fun: a picture for each card, a long route, and a clock.',
    example: 'Give each of ten cards its own fixed picture, lay them along a route from the front door to the kitchen table, then time yourself recalling them. When you can do ten cleanly, add more.',
    steps: ['Give your first ten cards a fixed picture each.', 'Lay them along a route and recall them against the clock.', 'Beat your own best time with the same accuracy.'],
    review: 'A few short rounds a week is plenty.',
    caveat: 'This is a sport you can enjoy. It does not make daily life easier, and it is fine to skip it.',
  },
  {
    id: 'recipes', unlock: 'M2', title: 'Recipes', months: 'Months 1 and 2',
    intro: 'For a recipe, keep the order of the steps and the key ratios. You do not need every word.',
    example: 'Walk a short kitchen route: counter, hob, oven, table. Put one picture for each step at each stop. For bread, step one is flour pouring down the fridge door, step two is warm water filling the sink, and so on.',
    steps: ['Pick four to six stops in your kitchen.', 'Give each step of the recipe one picture at its stop.', 'Walk the route once, then cook from it.'],
    review: 'Cook it, then check what you forgot and fix that picture.',
    caveat: 'For exact amounts, write the recipe down. The pictures hold the order, not the numbers.',
  },
  {
    id: 'directions', unlock: 'M2', title: 'Directions told to you once', months: 'Months 1 and 2',
    intro: 'Five to seven turns are easy to hold when each turn is one picture with a landmark.',
    example: 'Turn left at the mill: a giant mill wheel scoops you off to the left. Straight on past the bakery: a loaf of bread waves you along. Make a small hand movement for each left and right as you say it, so your body helps.',
    steps: ['Pick one landmark for every turn.', 'Join the pictures in one short walking story.', 'Say the route back to yourself once before you set off.'],
    review: 'Say it again after the first turn, then once when you arrive.',
    caveat: 'For anything long or unfamiliar, keep a map on your phone as a backup.',
  },
  {
    id: 'people', unlock: 'M3', title: 'Details about people', months: 'Month 3',
    intro: 'Remembering what matters to someone, like their children\'s names or what they enjoy, is a small act of care.',
    example: 'You meet Priya at the park and learn she climbs. Picture her name tag stuck on a huge boulder as she reaches the top. That evening write two words in your phone: "Priya, climbing". Next time you can ask how it is going.',
    steps: ['Notice one small detail while you talk.', 'Join it to the picture of their name in one scene.', 'Write the two key words down that evening.'],
    review: 'Read the note before you see them again.',
    caveat: 'Keep it light and kind. This is for being thoughtful, not for collecting private details about anyone.',
  },
  {
    id: 'travel', unlock: 'M2', title: 'Packing and travel', months: 'Month 2',
    intro: 'A walk through your home makes a good packing checklist.',
    example: 'Put each thing you must pack at one spot: your passport on the front door handle, your charger on the sofa cushion, sunglasses on the kitchen lamp. Then walk the same route in the other direction and collect them.',
    steps: ['Choose a route from one end of the home to the door.', 'Put each must-pack item at a spot along it.', 'Walk it back and gather everything.'],
    review: 'Check your bag once more as soon as you sit down to travel.',
    caveat: 'A written checklist is still the safest copy. Use pictures when you are away from your list.',
  },
  {
    id: 'toast', unlock: 'M7', title: 'A toast or wedding speech', months: 'Months 2 and 7',
    intro: 'A toast has a few points and two lines you must say well: the first and the last.',
    example: 'Three to five points, one stop each. The first point, how you met, waits at the front door: two people bump into each other in the doorway. Learn the opening and closing lines word for word.',
    steps: ['Choose three to five points and give each a stop.', 'Make one picture for each point.', 'Say the whole thing aloud, walking the route, until it feels natural.'],
    review: 'Run it the day before and once more an hour before.',
    caveat: 'Say it aloud many times, and keep a small card as a backup. The pictures hold the order, and your voice does the rest.',
  },
  {
    id: 'meetings', unlock: 'M10', title: 'Meeting action items', months: 'Month 10',
    intro: 'In a meeting, a task given to you can slip away in seconds.',
    example: 'Keep a fixed four-stop route for meetings: chair, table, door, window. When a task lands on you, give it one picture at the next stop. "Send the report" becomes a rolled-up report flying out of the window.',
    steps: ['Fix the four stops once.', 'Put each new task in its next stop as you are given it.', 'Write every task down straight after the meeting.'],
    review: 'Check the list the same day, and again before the next meeting.',
    caveat: 'Write every commitment down as well. The pictures only help you in the moment.',
  },
  {
    id: 'lines', unlock: 'M7', title: 'Lines for actors and singers', months: 'Months 2 and 7',
    intro: 'Understand the scene first. Then give each beat of it one picture.',
    example: 'Along a stage route, the entrance beat is a door swinging open and the argument beat is a table shaking. The pictures hold the order and the feeling. The exact words then come from run-throughs, checked by the first letter of each word.',
    steps: ['Read the scene once for what happens and how it feels.', 'Give each beat one picture on the route.', 'Check the words by first letters, beat by beat.'],
    review: 'Run it over several days, ideally with a partner to feed you cues.',
    caveat: 'Exact words need many spaced run-throughs. Pictures help with the order and the meaning, and repetition does the rest.',
  },
];

export const CALDER_LETTER = [
  'You have walked these halls for a year now, and I am glad of your steady hand.',
  'A few things kept well beat many things kept badly. So choose with care.',
  'The river will take some things, and that is all right. It is not a failure. It is just the river.',
  'What makes a memory last is not cleverness. It is checking yourself after a gap, and then again.',
  'So pick what you love, keep it well, and come back to it. The lamps will be lit.',
];
