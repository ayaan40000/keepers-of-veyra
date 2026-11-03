// 1.1 Your Own Text: plain-language copy. Owner decision (Nov 2, 2026): no scripture or other treasured text ships in the
// game. Only the tool ships, and it holds nothing until the player adds text. No reference to any tradition lives here.
export const OWN = {
  name: 'Your Own Text',
  shelf: 'Your Shelf',
  intro: 'Your Own Text is for anything you want to learn word for word: a verse, a prayer, a poem, a speech, lines in a play. Paste it in, and Mnemos will cut it into small pieces, hide it a little at a time, and remind you when to check yourself again.',
  privacy: 'Your text stays on this device and goes in your backup file. Mnemos never sends it anywhere.',
  accuracy: 'Mnemos cannot check that the text you type is right. Copy it from a printed or trusted edition, and check it with your teacher or a source you trust.',
  aid: 'Mnemos is a practice aid. It does not teach any tradition and takes no view on which text, translation or way of reciting is right. If a teacher or community guides you, their guidance comes first.',
  empty: 'Your shelf is empty. Add a text when you have something you want to keep.',
  noPersonal: 'This is for text you want to learn. Do not put passwords, bank details or private numbers here.',
  addHelp: 'Paste the text. Leave a blank line between sections if you want them cut in a certain place.',
  roleHelp: 'For lines of a play: start each line with the speaker and a colon, like "ROSALIND: Well met." Then choose your role. The other roles are shown to you as cues, and only your own lines are hidden.',
  steps: {
    read: 'Read it, aloud if you like. Pictures are optional here. If you like pictures, give each line one. If you prefer sound and repetition, skip them.',
    letters: 'First letters only. Say the section.',
    starts: 'Only the start of each line. Say the section.',
    blank: 'Nothing shown. Say or type the whole section.',
  },
  stepNames: { read: 'Read', letters: 'First letters', starts: 'Line starts', blank: 'Blank' },
  slipped: 'These lines slipped. They will come back tomorrow.',
  lightDay: 'I am tired today: one section only',
  peek: 'Peeking counts this line as slipped. Show it anyway?',
  deleteOne: 'Delete this text from this device? It will also be left out of your next backup.',
  deleteAll: 'Delete all your texts from this device?',
  reward: 'Checks on your own texts do not earn Lumen for time spent, typing or repeats, and they never change your skills. One small exception: a typed check that holds after 7 days or more earns a little Lumen, once for each check, inside the daily practice limit.',
  backupLine: 'Your backup includes Your Own Text. Keep the file as private as the text.',
  textsOnly: 'Export my texts only',
  textsOnlyHelp: 'A small separate file with just your texts. Importing it adds texts to your shelf and never replaces any.',
  newMaterial: 'Checking what you know before adding more helps it last.',
  gate: 'Opens when you pass the first gate.',
};
export const ownCheckLine = (n, m) => `${n} check${n > 1 ? 's are' : ' is'} ready. About ${m} minute${m > 1 ? 's' : ''}.`;
