// 1.1 Wren's family and her Story Memory (v0.13). Eleven small story beats across the year and 29 delayed questions on details
// the player has already met. Story and cosmetic only: no Lumen, no skill changes, nothing locked by a miss.
// Beat and question ids are permanent once released (they key saved data). No em dashes. Plain, warm language.
// A beat is shown as a Wren card on Today once the player's day reaches `day` (the first day of its week). Beat 11 is the
// second epilogue, and is marked seen when that is read.

export const WREN_HONEST = `Wren's questions are a story habit, not a test. They never change your scores, and a miss only means she says it again.`;

export const WF_BEATS = [
  { id: 'wf_b1_three_stirs', n: 1, week: 2, day: 8, where: `The Quay, Tansy's stall`, title: 'Three stirs and a spoon of honey',
    text: [
      `Wren was waiting at Tansy's stall with her coat buttoned wrong and a cup in both hands. She stirred it, once, twice, three times, and nodded as if a lock had clicked. "I always stir three times. Any other number and the afternoon feels off."`,
      `"And she cannot start the morning without honey," Tansy said. Wren agreed that this was true. "I cannot start the morning without a spoonful of wild honey in my oats," she said. "Do not tell the baker."`,
      `Tansy slid a second cup across the stall, and Wren took it. "Tansy gives me Mist and Mint. She says it is not strictly a real blend." Tansy said that a blend is real if somebody drinks it, and went back to her kettle.`,
    ] },
  { id: 'wf_b2_blue_door', n: 2, week: 4, day: 22, where: 'The Quay, the last lamp', title: 'The house with the blue door',
    text: [
      `Wren stopped at the last lamp and pointed along Quay Row with her chin. "That is my house, the one with the blue door. The paint is always flaking." She laughed. "My father, Edrin, lit lamps twenty-three to forty-four. He keeps saying he will repaint it."`,
      `A grey cat on the wall opened one eye. "My cat is grey, with a white patch on her left ear like a tiny moon. Her name is Pip. She will not come when I call her, but she will come for the sound of a tin opening."`,
      `Wren added, apropos of nothing, "I do not like dark attics. I always think the boxes are looking at me." She walked on a little faster past the door, and then slowed down again, to look at it.`,
    ] },
  { id: 'wf_b3_the_tune', n: 3, week: 6, day: 36, where: 'The Gallery, when a face returns', title: 'The tune with no words',
    text: [
      `A face came back out of the fog on the Gallery wall, a name under it, and Wren stood a long time in front of it with her hands in her pockets.`,
      `At last she spoke. "I cannot remember my mother's face. I remember the tune. She called it The Last Lamp." She did not say it, exactly. She hummed it, soft and a little flat, with no words, the way you hum something you were given before you could read. "She hummed it while she lit the lamps along the Quay."`,
      `She stopped, and shook herself, and took out a card, and did not write anything on it. "That is enough of that. Which wall is next?"`,
    ] },
  { id: 'wf_b4_what_i_kept', n: 4, week: 10, day: 64, where: 'The Hall of Faces', title: 'What Wren kept',
    text: [
      `In the Hall of Faces Wren made a list aloud, the way she does when a place is full of what is missing. "What I kept. Granny Orla grew the sweetest white roses by the river. The scent followed me home."`,
      `"My cousin Bram is very tall. He always smells of sawdust. He built me my first shelf, and it was crooked, and I still have it."`,
      `She pulled a small red button from her pocket and turned it in the lamplight. "I keep one red button in my pocket. It came off the first coat my mother made me. She sewed eleven pockets into it, because I lost everything." She put the button away. "Which explains the coat I wear now. My father cut it to the same pattern when I was sixteen."`,
    ] },
  { id: 'wf_b5_thirty_one', n: 5, week: 15, day: 99, where: 'The Counting House', title: 'Thirty-one, Quay Row',
    text: [
      `In the Counting House Wren was practising numbers on a slate when she stopped, and smiled, and wrote one down for you. "Number thirty-one, Quay Row. I could walk it blind."`,
      `"That is the trick with a number you love. It already has a picture. My mother had the first twenty-two lamps. My father had the rest. Thirty-one is the door I came home to."`,
    ] },
  { id: 'wf_b6_good_night', n: 6, week: 26, day: 176, where: 'The bridge, after the thrown stone', title: 'Good night to the last lamp',
    text: [
      `Afterwards, on the bridge, with the thrown stone still ringing somewhere under the water, Wren told you how it happened. She did not look at you while she said it.`,
      `"I was eight. The winter of the long cough. My mother died in the week before the new year, and the Tide came up on the Saturday, an ordinary Tide, thin, nobody's fault, and when I woke on Sunday I could not see her face. I looked and looked. It was only the place where it had been."`,
      `"Every night since, I say good night to the last lamp on the Quay." She almost smiled. "It is a silly thing. It always seems to brighten a little. I have never checked whether that is true."`,
    ] },
  { id: 'wf_b7_green_notebook', n: 7, week: 38, day: 260, where: 'The drain, after the file', title: 'A small green notebook',
    text: [
      `Down in the drain, after the file had been found and read, Wren sat on an upturned bucket and said she had remembered something she had not thought of in years.`,
      `"My first notebook. It was a small green notebook, and I was nine. A woman gave it to me the spring after my mother died. She smelled of rosemary and ink." She looked at the lamp for a while. "I think it was Calder. She made me a mint tea that spring too, for a girl who could not sleep, and I had not thought of it until now. Tansy's Mist and Mint tastes exactly like it. I cannot think why."`,
      `Neither of you said anything about that. After a while she opened her own notebook and wrote one word in it, and closed it again.`,
    ] },
  { id: 'wf_b8_edrin', n: 8, week: 44, day: 302, where: 'The Amphitheatre, before the Rite', title: 'Edrin', art: 'portrait_edrin_halloway',
    text: [
      `An older man in a lamplighter's coat was waiting by the Amphitheatre gate, with one hand on his bad knee. "I am Edrin," he said. "I have come to watch my daughter. I will not say anything. I will just stand here."`,
      `He said something, in the end. He took you aside. "She cannot remember her mother's face. I can. I would like somebody to hold some of it, in case I cannot always. A scar through the left eyebrow, from a lamp glass. She pinned her hair with a brass lamp key. She wore a yellow scarf, winter and summer. And her laugh always started before the joke was done."`,
      `"Keep these," Edrin said. "She would want her face to have someone." Then he went and stood at the back, and did not say a word through the whole of the Rite, and cheered at the end like a man half his age.`,
    ] },
  { id: 'wf_b9_third_verse', n: 9, week: 49, day: 337, where: 'The Quay, the old songs', title: 'The third verse',
    text: [
      `On the Quay at dusk Tansy and Wren were teaching the old songs to anyone who stopped. Tansy gave the third verse, the part people only hum, slowly, so that it could be written down. Trim the wick and turn the key, / Tallow keeps the lamp for me. / By river stones and light, go home: / the last lamp waits, and none walk alone.`,
      `Wren put her pencil down. "That is her tune," she said. "That is the Last Lamp. It had words all along. She was humming the third verse." She sang it through, once, badly, and the whole Quay went quiet, and nobody laughed.`,
      `"Tallow keeps the lamp for me," Wren repeated. "I always thought she was singing about candle fat." The last lamp ticked, very faintly, over her shoulder. Nobody mentioned it.`,
    ] },
  { id: 'wf_b10_green_door', n: 10, week: 53, day: 366, where: 'Quay Row', title: 'The door is green', art: 'event_green_door',
    text: [
      `On the first morning of the Year of Keeping Wren came up the Quay at a near run. "Come and see," she said. "Come and see before I decide it is a dream."`,
      `The door at number thirty-one, Quay Row, had been painted overnight, and all the flaking blue was gone. "It is green now. Blue was only ever a mistake I never fixed," Wren said, in a hushed voice, and then, because it was not quite her sentence: "That is what my father said, from the step, rubbing his knee, looking enormously pleased with himself."`,
      `"Twenty years," Wren said. "Twenty years he has been promising." She touched the door and drew her fingers back. It was still a little tacky. Pip sat on the wall with the look of a cat who had been consulted and had objected.`,
    ] },
  { id: 'wf_b11_portrait', n: 11, week: 54, day: 0, where: 'The Archive, after the Seam', title: 'The portrait', art: 'event_wren_mother_portrait', epilogue: true,
    text: [`Wren paints her mother from five things that were kept for her. It is told in the second epilogue.`] },
];
export const BEAT_BY_ID = Object.fromEntries(WF_BEATS.map((b) => [b.id, b]));

// who: whose words the source line is. say: the answer as a short sentence. ok: accepted answers (typed, forgiving of case,
// punctuation and one typo). from: the day the beat is told. earliest: the first curriculum day it may be asked (3 or more
// days after the beat). held: the warm line kept in the Chronolog when the player holds it.
export const WF_QUESTIONS = [
  { id: 'wf_stirs', beat: 'wf_b1_three_stirs', from: 8, earliest: 11, q: `How many times does Wren stir her tea?`, ok: ['three', '3', 'thrice'], say: `Three.`, who: 'wren', src: `I always stir three times. Any other number and the afternoon feels off.`, held: `Three. The afternoon is right again.` },
  { id: 'wf_honey', beat: 'wf_b1_three_stirs', from: 8, earliest: 13, q: `What does Wren stir into her morning oats?`, ok: ['wild honey', 'honey'], say: `Wild honey.`, who: 'wren', src: `I cannot start the morning without a spoonful of wild honey in my oats.`, held: `Wild honey. You remembered, and the oats are better for it.` },
  { id: 'wf_blend', beat: 'wf_b1_three_stirs', from: 8, earliest: 18, q: `What is the name of Wren's favourite tea blend?`, ok: ['mist and mint', 'mist & mint', 'mist n mint'], say: `Mist and Mint.`, who: 'wren', src: `Tansy gives me Mist and Mint. She says it is not strictly a real blend.`, held: `Mist and Mint. Not strictly a real blend, and exactly the right one.` },
  { id: 'wf_door', beat: 'wf_b2_blue_door', from: 22, earliest: 25, q: `What colour was the door of the house Wren grew up in?`, ok: ['blue'], say: `Blue.`, who: 'wren', src: `That is my house, the one with the blue door. The paint is always flaking.`, held: `Blue. I can almost see the flaking.` },
  { id: 'wf_pip', beat: 'wf_b2_blue_door', from: 22, earliest: 29, q: `What is the name of Wren's grey cat?`, ok: ['pip'], say: `Pip.`, who: 'wren', src: `My cat is grey, with a white patch on her left ear like a tiny moon. Her name is Pip.`, held: `Pip. She says thank you, in her way, which is to ignore you slightly less.` },
  { id: 'wf_attic', beat: 'wf_b2_blue_door', from: 22, earliest: 34, q: `Which kind of room does Wren not like going into alone?`, ok: ['dark attics', 'dark attic', 'attics', 'attic', 'an attic'], say: `Dark attics.`, who: 'wren', src: `I do not like dark attics. I always think the boxes are looking at me.`, held: `Dark attics. Yes. The boxes do look.` },
  { id: 'wf_father', beat: 'wf_b2_blue_door', from: 22, earliest: 40, q: `What is the name of Wren's father?`, ok: ['edrin', 'edrin halloway'], say: `Edrin.`, who: 'wren', src: `My father, Edrin, lit lamps twenty-three to forty-four.`, held: `Edrin. He would be pleased to be remembered by someone he has not met yet.` },
  { id: 'wf_repaint', beat: 'wf_b2_blue_door', from: 22, earliest: 52, q: `What did Wren's father always say he would do about the door?`, ok: ['repaint it', 'repaint', 'paint it', 'paint it again', 'repaint the door'], say: `Repaint it.`, who: 'wren', src: `He keeps saying he will repaint it.`, held: `Repaint it. He has been saying so for twenty years.` },
  { id: 'wf_tune', beat: 'wf_b3_the_tune', from: 36, earliest: 39, q: `What is the name of the tune Wren's mother hummed?`, ok: ['the last lamp', 'last lamp'], say: `The Last Lamp.`, who: 'wren', src: `I cannot remember my mother's face. I remember the tune. She called it The Last Lamp.`, held: `The Last Lamp. Yes. You kept it for me when I thought it might go.` },
  { id: 'wf_hum', beat: 'wf_b3_the_tune', from: 36, earliest: 46, q: `What was Wren's mother doing while she hummed it?`, ok: ['lighting the quay lamps', 'lighting the lamps', 'lighting lamps', 'she lit the lamps', 'lit the lamps', 'lighting the lamps along the quay', 'lighting the lamps on the quay', 'lamplighting'], say: `Lighting the lamps along the Quay.`, who: 'wren', src: `She hummed it while she lit the lamps along the Quay.`, held: `Lighting the lamps along the Quay. That is how I picture her, from behind, with a long taper.` },
  { id: 'wf_roses', beat: 'wf_b4_what_i_kept', from: 64, earliest: 67, q: `What flowers did Wren's grandmother grow by the river?`, ok: ['white roses', 'roses', 'rose', 'white rose'], say: `White roses.`, who: 'wren', src: `Granny Orla grew the sweetest white roses by the river. The scent followed me home.`, held: `White roses. I can smell them from here.` },
  { id: 'wf_bram', beat: 'wf_b4_what_i_kept', from: 64, earliest: 71, q: `What is the name of Wren's tall cousin?`, ok: ['bram'], say: `Bram.`, who: 'wren', src: `My cousin Bram is very tall.`, held: `Bram. He would have to duck to hear you say it.` },
  { id: 'wf_shelf', beat: 'wf_b4_what_i_kept', from: 64, earliest: 78, q: `What did Bram build for Wren?`, ok: ['her first shelf', 'a shelf', 'shelf', 'first shelf', 'a bookshelf'], say: `Her first shelf.`, who: 'wren', src: `He built me my first shelf.`, held: `Her first shelf. It is crooked, and it is still standing.` },
  { id: 'wf_sawdust', beat: 'wf_b4_what_i_kept', from: 64, earliest: 92, q: `What does Bram always smell of?`, ok: ['sawdust', 'saw dust', 'wood shavings'], say: `Sawdust.`, who: 'wren', src: `He always smells of sawdust.`, held: `Sawdust. Always, even at a wedding.` },
  { id: 'wf_button', beat: 'wf_b4_what_i_kept', from: 64, earliest: 75, q: `What small thing does Wren carry in her pocket for comfort?`, ok: ['a red button', 'red button', 'button', 'a button'], say: `A red button.`, who: 'wren', src: `I keep one red button in my pocket. It came off the first coat my mother made me.`, held: `A red button. It is warm from my hand right now.` },
  { id: 'wf_pockets', beat: 'wf_b4_what_i_kept', from: 64, earliest: 85, q: `Who sewed the eleven pockets of Wren's first coat?`, ok: ['her mother', 'wrens mother', 'mother', 'her mum', 'marit', 'mum', 'mom'], say: `Her mother.`, who: 'wren', src: `She sewed eleven pockets into it, because I lost everything.`, held: `Her mother, for a girl who lost everything. It worked, a little.` },
  { id: 'wf_number', beat: 'wf_b5_thirty_one', from: 99, earliest: 102, q: `What number is the house on Quay Row where Wren grew up?`, ok: ['thirty-one', 'thirty one', '31', 'thirtyone', 'no 31', 'number 31', 'number thirty-one'], say: `Thirty-one.`, who: 'wren', src: `Number thirty-one, Quay Row. I could walk it blind.`, held: `Thirty-one. I could walk it blind, and now so could you.` },
  { id: 'wf_lamps_mother', beat: 'wf_b5_thirty_one', from: 99, earliest: 109, q: `Which lamps on the Quay did Wren's mother light?`, ok: ['one to twenty-two', 'one to twenty two', '1 to 22', '1-22', '1 to twenty-two', 'one to 22', 'the first twenty-two', 'first twenty-two', 'the first 22', 'lamps 1 to 22', 'lamps one to twenty-two', '1 through 22'], say: `One to twenty-two.`, who: 'wren', src: `My mother had the first twenty-two lamps. My father had the rest.`, held: `One to twenty-two. The first of the Quay was hers.` },
  { id: 'wf_age', beat: 'wf_b6_good_night', from: 176, earliest: 179, q: `How old was Wren when she lost her mother's face?`, ok: ['eight', '8', 'eight years old', '8 years old'], say: `Eight.`, who: 'wren', src: `I was eight. The winter of the long cough.`, held: `Eight. You do not have to say it softly. I can hear it.` },
  { id: 'wf_goodnight', beat: 'wf_b6_good_night', from: 176, earliest: 186, q: `Who does Wren say good night to every evening?`, ok: ['the last lamp', 'last lamp', 'the last lamp on the quay', 'the lamp'], say: `The last lamp.`, who: 'wren', src: `Every night since, I say good night to the last lamp on the Quay.`, held: `The last lamp. It brightens. I still have not checked.` },
  { id: 'wf_notebook', beat: 'wf_b7_green_notebook', from: 260, earliest: 263, q: `What colour was Wren's first notebook?`, ok: ['green'], say: `Green.`, who: 'wren', src: `It was a small green notebook, and I was nine.`, held: `Green. Small, and nine years old, like me.` },
  { id: 'wf_rosemary', beat: 'wf_b7_green_notebook', from: 260, earliest: 270, q: `What did the woman who gave Wren the notebook smell of?`, ok: ['rosemary and ink', 'rosemary', 'rosemary & ink', 'ink and rosemary'], say: `Rosemary and ink.`, who: 'wren', src: `She smelled of rosemary and ink.`, held: `Rosemary and ink. I would know it anywhere.` },
  { id: 'wf_scar', beat: 'wf_b8_edrin', from: 302, earliest: 305, q: `Where was the scar on Wren's mother's face?`, ok: ['through her left eyebrow', 'left eyebrow', 'her left eyebrow', 'through the left eyebrow', 'the left eyebrow', 'eyebrow'], say: `Through her left eyebrow.`, who: 'edrin', src: `A scar through the left eyebrow, from a lamp glass.`, held: `Through the left eyebrow. Yes. Thank you for keeping her.` },
  { id: 'wf_pin', beat: 'wf_b8_edrin', from: 302, earliest: 312, q: `What did Wren's mother pin her hair with?`, ok: ['a brass key', 'brass key', 'a brass lamp key', 'brass lamp key', 'a key', 'key', 'a lamp key'], say: `A brass lamp key.`, who: 'edrin', src: `She pinned her hair with a brass lamp key.`, held: `A brass lamp key. You have no idea how much that picture means.` },
  { id: 'wf_laugh', beat: 'wf_b8_edrin', from: 302, earliest: 319, q: `What was unusual about her laugh?`, ok: ['it began before the joke was finished', 'it started before the joke was done', 'started before the joke was done', 'began before the joke was over', 'it started before the joke ended', 'it began before the joke was done', 'before the joke was done', 'before the joke was finished', 'before the joke ended', 'it started before the end of the joke', 'she laughed before the joke was done'], say: `It began before the joke was finished.`, who: 'edrin', src: `Her laugh always started before the joke was done.`, held: `It began before the joke was done. Yes. That is her.` },
  { id: 'wf_scarf', beat: 'wf_b8_edrin', from: 302, earliest: 330, q: `What colour was her scarf?`, ok: ['yellow'], say: `Yellow.`, who: 'edrin', src: `She wore a yellow scarf, winter and summer.`, held: `Yellow, winter and summer. Yes. I can almost see it.` },
  { id: 'wf_tallow', beat: 'wf_b9_third_verse', from: 337, earliest: 340, q: `In the third verse of The Last Lamp, who keeps the lamp?`, ok: ['tallow', 'ambrose tallow', 'ambrose'], say: `Tallow.`, who: 'wren', src: `Trim the wick and turn the key, Tallow keeps the lamp for me.`, held: `Tallow keeps the lamp for me. Yes. Of course it does.` },
  { id: 'wf_stones', beat: 'wf_b9_third_verse', from: 337, earliest: 347, q: `Which words from the song get stuck in Wren's head?`, ok: ['river stones and light', 'by river stones and light', 'by river stones and light go home', 'river stones and light go home', 'stones and light'], say: `By river stones and light, go home.`, who: 'wren', src: `By river stones and light, go home.`, held: `By river stones and light, go home. It is stuck in mine too.` },
  { id: 'wf_newdoor', beat: 'wf_b10_green_door', from: 366, earliest: 372, q: `What colour is the door on Quay Row now?`, ok: ['green'], say: `Green.`, who: 'wren', src: `It is green now. Blue was only ever a mistake I never fixed.`, held: `Green. Not blue, not any more. You kept the old and the new apart.` },
];
export const Q_BY_ID = Object.fromEntries(WF_QUESTIONS.map((q) => [q.id, q]));

// Words Wren says around a question. Never a score, never a penalty.
export const WREN_ASK = {
  lead: [`Wren puts down her pencil.`, `Wren tilts her head and smiles.`, `Wren leans on the lamp-post.`, `Wren turns a card over in her hand.`],
  held: [`"Yes," Wren says. "You kept that."`, `Wren nods slowly, pleased.`, `"There it is," Wren says, and she looks relieved.`],
  miss: [`Wren says it again, warmly, as if for the first time.`, `"It is a lot to keep," Wren says. "Let me say it again."`, `"That one is easy to lose," Wren says. "Here it is."`],
  skip: `"Never mind," Wren says. "I will tell you again."`,
};
export const WREN_SETTING = {
  label: `Wren's story questions`,
  on: `Now and then, after a session, Wren asks about a small detail from her own story. A miss only means she says it again.`,
  off: `Wren will tell her story but will not ask about it.`,
};
