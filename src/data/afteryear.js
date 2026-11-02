// v0.9 story after the year: the epilogue, short words from friends after each gate, and the Year of Keeping.
// First drafts by a local model, edited by hand. {name} is replaced with the player's alias.

export const EPILOGUE = {
  title: 'Epilogue: The Year of Keeping',
  quest: 'Keep what you chose to keep',
  text: [
    'A year after the Night of No Moon, the city kept the Long Vigil again, and this time nobody had to be asked. On Lamplighters\' Quay people gathered in small circles under the lamps to practise remembering together. They passed names and dates around like warm stones from hand to hand. A girl of seven stood on an upturned crate and walked the whole Quay in her head, all forty-four lamps, without a slip, and the fishermen cheered her as if she had landed a whale.',
    'Wren found you by the old stone railing. The Archivist\'s chain hung crooked round her neck and she had one notecard in her breast pocket, the same one, a little softer at the corners. "Someone changed a date in the eastern ledger," she said. "Three days, on a land sale. I noticed it before I had finished my tea." She looked very pleased with herself and then tried, without much success, to look modest. "I didn\'t need a card for it. I just knew it was wrong."',
    'A letter came from Joss Hask, carried down from the Ammerhold by a carter who smelled of pine resin and cold wind. The handwriting was jagged and the sentences were short. Tomas sorts buttons by colour in the evenings, he wrote. He does not know me yet. He likes my tea, and he asks my name every morning, and every morning I tell him. It is not nothing. Ennick sends his regards and says to tell you he is still writing his mistakes down. Fewer of them. J. H.',
    'Under the last lamp on the Quay sat Sevrin Ashgrave, with no robe and no beard, holding a cup of rosemary tea in both hands while his sister picked dead leaves off a pot of thyme. She hummed something with no name that she seemed to know all the same. They did not say much. They did not need to. Every evening he told her one story about two children on these steps, and every evening she listened as if it were the first time, and laughed in the same places.',
    'Wren walked you home along the river. "The Tide still comes up, you know," she said. "A little, every night. It always will. Calder says that is not a failure. It is just the river." She stopped at your door. "So we keep walking our routes. A little each day. Not to win anything. Just to keep." Behind you, all the way up the hill to the copper dome, the lamps of Veyra were burning, one for every person who had chosen to remember.',
  ],
};

// A friend's words after each gate (shown once, on the map, after the restoration plays).
export const GATE_TALK = {
  M1: ['tansy', '"The pictures are back in their proper places. You have a steady hand for that sort of thing. Come by later, I\'ll put the rosemary on."'],
  M2: ['fennick', '"Walked the whole Gallery without stumbling once, I see. That\'s all a corridor ever asks of anyone. That\'ll hold."'],
  M3: ['wren', '"You matched every face to its name. I only checked my cards twice while you were doing it. Twice! My pockets feel lighter already."'],
  M4: ['isolde', '"Numbers are just shapes wearing different clothes, aren\'t they? I had a little wager on you, {name}. Do try to keep winning."'],
  M5: ['mosk', '"Held all those long strings without dropping one. Hmph. Suppose a man could learn to count his own fares. Off my boat, then. Go on home."'],
  M6: ['wren', '"The old words stuck to you like wet clay this time. You didn\'t need me to translate once. I\'m a tiny bit jealous, actually."'],
  M7: ['ennick', '"You found the wrong line in the text before I could point to it. It hurts less when you look straight at what is broken. I wrote that down."'],
  M8: ['mosk', '"Days go by and things feel smaller, then bigger again. You kept your place through all of it. River\'s the same. We\'re even now, Keeper."'],
  M9: ['ennick', '"You caught the false memory before it took root. That is the hardest part, knowing which pieces of the story were really yours."'],
  M10: ['hask', '"Lists done, errands done, nothing forgotten on the road. Tomas would have liked how you kept it. He was always the tidy one."'],
  M11: ['isolde', '"Ten thousand people watching and you never blinked. I won more on you today than the Guild makes in a month. Don\'t spend it all at once. I shan\'t."'],
};

// The Year of Keeping: after the last gate, each day revisits one week of the year, at the player's current level.
export const KEEPING_LINES = [
  'The Tide came up a little last night, the way it always does. Shall we walk a route?',
  'A little each day. Not to win anything. Just to keep.',
  'Today we go back to an old district and make sure it still holds.',
  'The lamps are burning. Let\'s keep them that way.',
];
