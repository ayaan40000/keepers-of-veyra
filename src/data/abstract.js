// 1.2 Hard material for an untrained memory: formulae, historical dates, surprising facts, jokes and labelled diagrams.
// Real facts only (checked by hand against standard references before shipping); jokes are short folk riddles
// and puns, plus a few written for Veyra. Plain warm text, no em dashes. Ids are permanent once released.

// ---------- formulae ----------
// show: the formula as tokens; blank: which tokens can be asked for; alt: other accepted ways to type a token.
// legend: what each letter means (shown while studying, because a formula you understand is easier to keep).
export const FORMULAS = [
  { id: 'fx-circle-area', name: 'Area of a circle', show: ['A', '=', 'π', 'r²'], blank: [2, 3], legend: 'A area, r radius', alt: { 3: ['r squared'] } },
  { id: 'fx-circumference', name: 'Circumference of a circle', show: ['C', '=', '2', 'π', 'r'], blank: [2, 3], legend: 'C circumference, r radius', alt: { 3: ['pi'] } },
  { id: 'fx-pythagoras', name: "Pythagoras' theorem", show: ['a²', '+', 'b²', '=', 'c²'], blank: [4], legend: 'c is the longest side of a right-angled triangle' },
  { id: 'fx-triangle', name: 'Area of a triangle', show: ['A', '=', '½', 'b', 'h'], blank: [2, 4], legend: 'b base, h height', alt: { 2: ['1/2', '0.5', 'half'] } },
  { id: 'fx-cylinder', name: 'Volume of a cylinder', show: ['V', '=', 'π', 'r²', 'h'], blank: [3, 4], legend: 'r radius, h height' },
  { id: 'fx-sphere', name: 'Volume of a sphere', show: ['V', '=', '4/3', 'π', 'r³'], blank: [2, 4], legend: 'r radius', alt: { 2: ['4 over 3', '1.33', '1.333'], 4: ['r cubed'] } },
  { id: 'fx-speed', name: 'Speed', show: ['v', '=', 'd', '/', 't'], blank: [2, 4], legend: 'v speed, d distance, t time' },
  { id: 'fx-newton2', name: "Newton's second law", show: ['F', '=', 'm', 'a'], blank: [2, 3], legend: 'F force, m mass, a acceleration' },
  { id: 'fx-density', name: 'Density', show: ['ρ', '=', 'm', '/', 'V'], blank: [2, 4], legend: 'ρ (rho) density, m mass, V volume' },
  { id: 'fx-ohm', name: "Ohm's law", show: ['V', '=', 'I', 'R'], blank: [2, 3], legend: 'V voltage, I current, R resistance' },
  { id: 'fx-power', name: 'Electrical power', show: ['P', '=', 'I', 'V'], blank: [2, 3], legend: 'P power, I current, V voltage' },
  { id: 'fx-kinetic', name: 'Kinetic energy', show: ['KE', '=', '½', 'm', 'v²'], blank: [2, 4], legend: 'm mass, v speed', alt: { 2: ['1/2', '0.5', 'half'] } },
  { id: 'fx-potential', name: 'Gravitational potential energy', show: ['PE', '=', 'm', 'g', 'h'], blank: [3, 4], legend: 'm mass, g gravity (about 9.8 m/s² on Earth), h height' },
  { id: 'fx-momentum', name: 'Momentum', show: ['p', '=', 'm', 'v'], blank: [2, 3], legend: 'p momentum, m mass, v velocity' },
  { id: 'fx-work', name: 'Work done', show: ['W', '=', 'F', 'd'], blank: [2, 3], legend: 'W work, F force, d distance moved' },
  { id: 'fx-pressure', name: 'Pressure', show: ['P', '=', 'F', '/', 'A'], blank: [2, 4], legend: 'P pressure, F force, A area' },
  { id: 'fx-wave', name: 'Wave speed', show: ['v', '=', 'f', 'λ'], blank: [2, 3], legend: 'v wave speed, f frequency, λ (lambda) wavelength', alt: { 3: ['lambda'] } },
  { id: 'fx-einstein', name: 'Mass and energy', show: ['E', '=', 'm', 'c²'], blank: [3], legend: 'E energy, m mass, c the speed of light', alt: { 3: ['c squared'] } },
  { id: 'fx-gas', name: 'Ideal gas law', show: ['P', 'V', '=', 'n', 'R', 'T'], blank: [3, 5], legend: 'P pressure, V volume, n amount of gas, R the gas constant, T temperature in kelvin' },
  { id: 'fx-quadratic', name: 'Quadratic formula', show: ['x', '=', '(−b ±', '√(', 'b² − 4ac', ')) /', '2a'], blank: [4, 6], legend: 'solves a x² + b x + c = 0' },
  { id: 'fx-fahrenheit', name: 'Celsius to Fahrenheit', show: ['F', '=', '9/5', 'C', '+', '32'], blank: [2, 5], legend: 'C degrees Celsius, F degrees Fahrenheit', alt: { 2: ['1.8'] } },
  { id: 'fx-polygon', name: 'Interior angles of a polygon', show: ['sum', '=', '(n − 2)', '×', '180°'], blank: [2, 4], legend: 'n number of sides, answer in degrees', alt: { 3: ['x'] } },
  { id: 'fx-interest', name: 'Compound interest (yearly)', show: ['A', '=', 'P', '(1 + r)', '^t'], blank: [3, 4], legend: 'A final amount, P starting amount, r yearly rate as a decimal, t years', alt: { 4: ['t'] } },
  { id: 'fx-photo', name: 'Photosynthesis', show: ['6CO₂', '+', '6H₂O', '→', 'C₆H₁₂O₆', '+', '6O₂'], blank: [4, 6], legend: 'carbon dioxide and water, with light, make glucose and oxygen', alt: { 6: ['O₂', '6 O2'] } },
];
// Whole chemical formulas: name -> formula.
export const CHEM = [
  ['chem-water', 'Water', 'H₂O'], ['chem-co2', 'Carbon dioxide', 'CO₂'], ['chem-salt', 'Table salt (sodium chloride)', 'NaCl'],
  ['chem-glucose', 'Glucose', 'C₆H₁₂O₆'], ['chem-methane', 'Methane', 'CH₄'], ['chem-ammonia', 'Ammonia', 'NH₃'],
  ['chem-sulfuric', 'Sulfuric acid', 'H₂SO₄'], ['chem-ozone', 'Ozone', 'O₃'], ['chem-baking', 'Baking soda (sodium bicarbonate)', 'NaHCO₃'],
  ['chem-chalk', 'Chalk, the rock (calcium carbonate)', 'CaCO₃'], ['chem-peroxide', 'Hydrogen peroxide', 'H₂O₂'], ['chem-ethanol', 'Ethanol', 'C₂H₅OH', ['C2H6O', 'CH3CH2OH']],
];

// ---------- surprising facts ----------
// q and a, plus a short "why" shown while studying. Checked against standard references.
export const WONDERS = [
  { id: 'wd-octopus', q: 'How many hearts does an octopus have?', a: '3', kind: 'number', why: 'Two pump blood through the gills and one sends it round the body.' },
  { id: 'wd-venus', q: 'Which planet takes longer to spin once on its axis than to go round the Sun?', a: 'Venus', why: 'Venus spins once on its axis in about 243 Earth days but goes round the Sun in about 225.' },
  { id: 'wd-banana', q: 'Botanically, which is a true berry: a banana or a strawberry?', a: 'banana', alt: ['a banana', 'bananas'], why: 'A strawberry\'s flesh grows from the base of the flower, and each "seed" on it is really a tiny fruit.' },
  { id: 'wd-sharks', q: 'Which came first on Earth: sharks or trees?', a: 'sharks', alt: ['shark'], why: 'Sharks go back over 400 million years; the first trees about 385 to 390 million.' },
  { id: 'wd-wombat', q: 'Which animal leaves cube-shaped droppings?', a: 'wombat', alt: ['a wombat', 'wombats'], why: 'Scientists think the shape helps them mark their ground without the droppings rolling away.' },
  { id: 'wd-cleopatra', q: 'Which ruler of Egypt lived closer in time to the Moon landing than to the building of the Great Pyramid of Giza?', a: 'Cleopatra', why: 'The Great Pyramid was built around 2560 BCE; Cleopatra died in 30 BCE.' },
  { id: 'wd-oxford', q: 'Which is older: the University of Oxford or the Aztec city of Tenochtitlan?', a: 'Oxford', alt: ['University of Oxford', 'Oxford University'], why: 'Teaching existed at Oxford in some form by 1096; Tenochtitlan was founded around 1325.' },
  { id: 'wd-flamingo', q: 'What is a group of flamingos called?', a: 'a flamboyance', alt: ['flamboyance'], why: 'A fitting name for a crowd of bright pink birds.' },
  { id: 'wd-honey', q: 'Which food can keep for thousands of years if it is sealed?', a: 'honey', why: 'It holds very little water and is acidic, so germs struggle to grow in it.' },
  { id: 'wd-bones', q: 'How many bones are in an adult human skeleton?', a: '206', kind: 'number', why: 'Babies start with more; some join together as we grow.' },
  { id: 'wd-sunlight', q: 'About how many minutes does sunlight take to reach Earth?', a: '8', kind: 'number', why: 'About 8 minutes and 20 seconds, across roughly 150 million kilometres.' },
  { id: 'wd-everest', q: 'How tall is Mount Everest in metres, by the 2020 survey?', a: '8849', alt: ['8848.86', '8,849 m', '8849 m'], why: 'China and Nepal measured it together and agreed on 8,848.86 metres.' },
  { id: 'wd-koala', q: 'Which animal has fingerprints so like ours that they are hard to tell apart?', a: 'koala', why: 'Koalas grip branches, and their prints evolved separately from ours.' },
  { id: 'wd-butterfly', q: 'Butterflies taste with which part of their body?', a: 'feet', alt: ['their feet', 'foot', 'legs'], why: 'Taste sensors on their feet tell them if a leaf is right for their eggs.' },
  { id: 'wd-australia', q: 'Which is wider: Australia or the Moon?', a: 'Australia', why: 'Australia is about 4,000 km across; the Moon is about 3,474 km wide.' },
  { id: 'wd-unicorn', q: 'Which country has the unicorn as its national animal?', a: 'Scotland', why: 'It has stood on Scottish royal arms for centuries.' },
  { id: 'wd-saturn', q: 'Which planet is less dense than water?', a: 'Saturn', why: 'It is mostly hydrogen and helium; in a big enough bath it would float.' },
  { id: 'wd-ocean', q: 'About what percentage of Earth\'s surface is covered by water?', a: '71', kind: 'number', why: 'Most of it is ocean; less than 3 percent of Earth\'s water is fresh.' },
  { id: 'wd-hummingbird', q: 'Which is the only bird that can fly backwards for more than a moment?', a: 'hummingbird', alt: ['hummingbirds', 'a hummingbird'], why: 'Its wings move in a figure of eight, so it can hover and reverse.' },
  { id: 'wd-tittle', q: 'What is the dot over a small letter i or j called?', a: 'a tittle', alt: ['tittle'], why: 'The word is hundreds of years old.' },
  { id: 'wd-lightning', q: 'Which is hotter: a bolt of lightning or the surface of the Sun?', a: 'lightning', why: 'Lightning can reach about 30,000 °C; the Sun\'s surface is about 5,500 °C.' },
  { id: 'wd-ostrich', q: 'Which bird has eyes bigger than its brain?', a: 'ostrich', why: 'Each eye is about 5 cm across, the largest of any land animal.' },
  { id: 'wd-desert', q: 'What is the largest desert on Earth?', a: 'Antarctica', alt: ['the Antarctic', 'Antarctic desert'], why: 'A desert is a place with very little rain or snow, and Antarctica gets very little. The Sahara is the largest hot desert.' },
  { id: 'wd-russia', q: 'How many time zones does Russia have?', a: '11', kind: 'number', why: 'It stretches from the Baltic Sea to the Pacific.' },
  { id: 'wd-trees', q: 'Are there more trees on Earth or stars in the Milky Way?', a: 'trees', why: 'A 2015 study counted about 3 trillion trees; the Milky Way has a few hundred billion stars.' },
  { id: 'wd-eiffel', q: 'About how many centimetres can the Eiffel Tower grow in summer heat?', a: '15', kind: 'number', range: [12, 18], why: 'Iron expands when it warms; estimates run from about 12 to 18 cm.' },
];

// ---------- jokes ----------
// setup, punchline, and the key word that carries the joke (the part a listener must remember).
export const JOKES = [
  { id: 'jk-piano', q: 'What has keys but cannot open a single door?', a: 'A piano', key: ['piano'] },
  { id: 'jk-clock', q: 'What has hands but cannot clap?', a: 'A clock', key: ['clock', 'watch'] },
  { id: 'jk-towel', q: 'What gets wetter the more it dries?', a: 'A towel', key: ['towel'] },
  { id: 'jk-bottle', q: 'What has a neck but no head?', a: 'A bottle', key: ['bottle'] },
  { id: 'jk-cold', q: 'What can you catch but never throw?', a: 'A cold', key: ['cold'] },
  { id: 'jk-comb', q: 'What has lots of teeth but cannot bite?', a: 'A comb', key: ['comb'] },
  { id: 'jk-scarecrow', q: 'Why did the scarecrow win a prize?', a: 'He was outstanding in his field', key: ['outstanding'] },
  { id: 'jk-bicycle', q: 'Why can a bicycle not stand up on its own?', a: 'It is two tired', key: ['tired'] },
  { id: 'jk-legend', q: 'Why did the mapmaker get lost at the party?', a: 'Nobody gave her the legend', key: ['legend'] },
  { id: 'jk-curtains', q: 'Why did the Keeper bring a pencil to the palace?', a: 'To draw the curtains', key: ['curtains', 'draw'] },
  { id: 'jk-maths', q: 'Why did the maths book look so sad?', a: 'It had too many problems', key: ['problems'] },
  { id: 'jk-dino', q: 'What do you call a sleeping dinosaur?', a: 'A dino-snore', key: ['snore', 'dinosnore'] },
  { id: 'jk-ghost', q: 'Why are ghosts bad at telling lies?', a: 'You can see right through them', key: ['through'] },
  { id: 'jk-ocean', q: 'What did the sea say to the beach?', a: 'Nothing, it just waved', key: ['waved', 'wave'] },
  { id: 'jk-gummy', q: 'What do you call a bear with no teeth?', a: 'A gummy bear', key: ['gummy'] },
  { id: 'jk-lamp', q: 'Why did the lamp go back to school?', a: 'It wanted to be a little brighter', key: ['brighter', 'bright'] },
  { id: 'jk-wall', q: 'What did one wall say to the other wall?', a: 'Meet you at the corner', key: ['corner'] },
  { id: 'jk-cookie', q: 'Why did the biscuit go to the doctor?', a: 'It was feeling crummy', key: ['crummy'] },
  { id: 'jk-ring', q: 'What has a ring but no finger?', a: 'A telephone', key: ['telephone', 'phone'] },
  { id: 'jk-stairs', q: 'Why did Wren never trust the Archive stairs?', a: 'They were always up to something', key: ['up to something'] },
  { id: 'jk-broom', q: 'Why was the broom late for work?', a: 'It overswept', key: ['overswept', 'over swept'] },
];

// ---------- labelled diagrams ----------
// Drawn in code as simple SVG shapes. marks: numbered spots, in the order you walk them.
export const DIAGRAMS = [
  {
    id: 'dg-earth', title: 'Layers of the Earth', w: 200, h: 200,
    shapes: [['circle', { cx: 100, cy: 100, r: 92, fill: '#7a5a3a' }], ['circle', { cx: 100, cy: 100, r: 86, fill: '#c0662e' }], ['circle', { cx: 100, cy: 100, r: 52, fill: '#e8a33c' }], ['circle', { cx: 100, cy: 100, r: 24, fill: '#ffe08a' }]],
    marks: [{ x: 100, y: 11, label: 'crust' }, { x: 100, y: 34, label: 'mantle' }, { x: 100, y: 62, label: 'outer core' }, { x: 100, y: 100, label: 'inner core' }],
  },
  {
    id: 'dg-planets', title: 'The planets, out from the Sun', w: 320, h: 120,
    shapes: [['circle', { cx: -30, cy: 60, r: 50, fill: '#ffcf4a' }], ['circle', { cx: 34, cy: 60, r: 4, fill: '#a8a29a' }], ['circle', { cx: 52, cy: 60, r: 7, fill: '#e8c27a' }], ['circle', { cx: 74, cy: 60, r: 7, fill: '#4a8fd8' }],
      ['circle', { cx: 94, cy: 60, r: 5, fill: '#c8583a' }], ['circle', { cx: 136, cy: 60, r: 26, fill: '#d8a878' }], ['ellipse', { cx: 204, cy: 60, rx: 36, ry: 6, fill: 'none', stroke: '#cdb68a', 'stroke-width': 3 }],
      ['circle', { cx: 204, cy: 60, r: 21, fill: '#e3cf98' }], ['circle', { cx: 256, cy: 60, r: 12, fill: '#9fe0e8' }], ['circle', { cx: 294, cy: 60, r: 12, fill: '#4a6ae8' }]],
    marks: [{ x: 34, y: 40, label: 'Mercury' }, { x: 52, y: 40, label: 'Venus' }, { x: 74, y: 40, label: 'Earth' }, { x: 94, y: 40, label: 'Mars' }, { x: 136, y: 22, label: 'Jupiter' },
      { x: 204, y: 26, label: 'Saturn' }, { x: 256, y: 36, label: 'Uranus' }, { x: 294, y: 36, label: 'Neptune' }],
  },
  {
    id: 'dg-water', title: 'The water cycle', w: 260, h: 180,
    shapes: [['rect', { x: 0, y: 140, width: 260, height: 40, fill: '#2f6fb0' }], ['path', { d: 'M150 140 L190 70 L230 140 Z', fill: '#5c7a4a' }], ['circle', { cx: 30, cy: 28, r: 16, fill: '#ffcf4a' }],
      ['ellipse', { cx: 130, cy: 32, rx: 40, ry: 14, fill: '#e8eef4' }], ['path', { d: 'M60 132 L60 70', stroke: '#9fc8f0', 'stroke-width': 3, 'stroke-dasharray': '4 3', fill: 'none' }],
      ['path', { d: 'M140 48 L140 100 M152 48 L152 100 M164 48 L164 100', stroke: '#9fc8f0', 'stroke-width': 2, fill: 'none' }], ['path', { d: 'M205 120 Q180 136 150 140', stroke: '#9fc8f0', 'stroke-width': 3, fill: 'none' }]],
    marks: [{ x: 60, y: 100, label: 'evaporation', accepts: ['evaporate'] }, { x: 130, y: 32, label: 'condensation', accepts: ['condense', 'clouds form'] },
      { x: 152, y: 76, label: 'precipitation', accepts: ['rain', 'rainfall'] }, { x: 180, y: 130, label: 'collection', accepts: ['runoff', 'run-off', 'run off'] }],
  },
  {
    id: 'dg-heart', title: 'The four chambers of the heart (as you face someone)', w: 200, h: 200,
    note: 'Seen from the front, the heart\'s right side is on your left.',
    shapes: [['path', { d: 'M100 186 L22 96 Q10 40 60 28 Q90 24 100 50 Q110 24 140 28 Q190 40 178 96 Z', fill: '#b8434e' }], ['path', { d: 'M100 50 L100 186 M30 100 L170 100', stroke: '#5a1a22', 'stroke-width': 4, fill: 'none' }]],
    marks: [{ x: 62, y: 66, label: 'right atrium' }, { x: 138, y: 66, label: 'left atrium' }, { x: 66, y: 134, label: 'right ventricle' }, { x: 134, y: 134, label: 'left ventricle' }],
  },
  {
    id: 'dg-flower', title: 'Parts of a flower', w: 220, h: 240,
    shapes: [['path', { d: 'M110 236 L110 130', stroke: '#4a8a3a', 'stroke-width': 6, fill: 'none' }], ['ellipse', { cx: 140, cy: 196, rx: 30, ry: 11, fill: '#5ca04a' }],
      ['ellipse', { cx: 60, cy: 92, rx: 40, ry: 22, fill: '#e87aa8' }], ['ellipse', { cx: 160, cy: 92, rx: 40, ry: 22, fill: '#e87aa8' }],
      ['path', { d: 'M84 118 L110 142 L136 118 L124 130 L110 126 L96 130 Z', fill: '#4a8a3a' }], ['ellipse', { cx: 110, cy: 118, rx: 16, ry: 14, fill: '#9ad06a' }],
      ['path', { d: 'M110 104 L110 52', stroke: '#c8d86a', 'stroke-width': 5, fill: 'none' }], ['circle', { cx: 110, cy: 48, r: 7, fill: '#f0e05a' }],
      ['path', { d: 'M96 110 L80 62 M124 110 L140 62', stroke: '#e8d8a8', 'stroke-width': 2, fill: 'none' }], ['circle', { cx: 80, cy: 60, r: 5, fill: '#f0a83a' }], ['circle', { cx: 140, cy: 60, r: 5, fill: '#f0a83a' }]],
    marks: [{ x: 110, y: 46, label: 'stigma' }, { x: 110, y: 80, label: 'style' }, { x: 110, y: 118, label: 'ovary' }, { x: 140, y: 60, label: 'stamen', accepts: ['anther'] },
      { x: 46, y: 92, label: 'petal' }, { x: 90, y: 124, label: 'sepal' }, { x: 110, y: 170, label: 'stem' }, { x: 152, y: 196, label: 'leaf' }],
  },
  {
    id: 'dg-compass', title: 'Points of the compass', w: 200, h: 200,
    shapes: [['circle', { cx: 100, cy: 100, r: 70, fill: 'none', stroke: '#cdb68a', 'stroke-width': 3 }], ['path', { d: 'M100 24 L110 100 L100 176 L90 100 Z', fill: '#e8d8a8' }], ['path', { d: 'M24 100 L100 90 L176 100 L100 110 Z', fill: '#cdb68a' }]],
    marks: [{ x: 100, y: 16, label: 'north', accepts: ['n'] }, { x: 160, y: 40, label: 'north-east', accepts: ['northeast', 'ne'] }, { x: 184, y: 100, label: 'east', accepts: ['e'] },
      { x: 160, y: 160, label: 'south-east', accepts: ['southeast', 'se'] }, { x: 100, y: 184, label: 'south', accepts: ['s'] }, { x: 40, y: 160, label: 'south-west', accepts: ['southwest', 'sw'] },
      { x: 16, y: 100, label: 'west', accepts: ['w'] }, { x: 40, y: 40, label: 'north-west', accepts: ['northwest', 'nw'] }],
  },
];
export const DIAGRAM_BY_ID = Object.fromEntries(DIAGRAMS.map((d) => [d.id, d]));

export const ABSTRACT_HONEST = {
  formulas: 'Pictures help you keep a formula. Knowing when and why to use it is a separate skill, best learned from a teacher or a good textbook.',
  dates: 'These are real dates, checked before they shipped. Keeping a date is not the same as understanding why it mattered.',
  wonders: 'These are real facts, checked against standard references. Some numbers are rounded.',
  jokes: 'Short folk riddles and puns, plus a few from Veyra. Keep the key word as a picture and the rest comes back.',
  diagram: 'The drawings are simplified so the labels are easy to place. Real anatomy and science diagrams show far more.',
};
