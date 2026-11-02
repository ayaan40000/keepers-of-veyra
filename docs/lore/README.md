# The Lore of Veyra

*A guide to the world of Mnemos: Keepers of Veyra, for players, writers, artists and anyone who wants to help it grow.*

---

For the last nine miles of its long run to the Grey Sea, the river Lethe flows past a city of lamps. Every evening a silver mist called the Tide climbs its streets, and whatever a person is not holding firmly in mind when it passes, it takes. A name half-remembered. A recipe never quite learned. The face of a friend not seen in years.

Veyra was built against that mist. Nine hundred years ago, after the Drowned Years when the river-folk forgot everything, Ysolde of the Lamp and twelve others swore the Compact of Lamps and laid out a city that is itself a memory: twelve districts, twelve great routes, a place for everything a person might want to keep. For six hundred years the Lamp-Wardens kept the Compact. Then paper became cheaper than practice: the Archive filled with ledgers, the lamps went out one at a time, and the last Wardens were gone. That age, the Long Quiet, ended on the night the Tide rose higher than it had in three hundred years and every ledger in the Archive came back blank.

You arrive as a new Keeper with an old brass lamp, a young archivist called Wren, and a city that has forgotten most of itself. One district a month, for a year, you bring it back.

## Why the world matters

Mnemos teaches real memory methods: pictures, routes through places, names on faces, numbers turned into images. But nobody walks into a game for a method. People come for a world they want to spend time in, and some will stay only for the story, the Undercroft and the relics. That is welcome. If the methods come along as a quiet gift, good; the game never pretends to be more than it is (scores measure performance on Mnemos tasks, not memory or intelligence in general).

So the world gets the same care as the training: a river with a history, a city with a shape, people with secrets, and a deep stair under the Archive that is older than any of them.

## How to read this guide

Start with the pages that spoil nothing, then go deeper when you are ready.

| Page | What it holds | Spoilers |
| --- | --- | --- |
| [The world](world.md) | The Lethe, the Tide, the Wardens, the Art of Places; then lore found during the year | First half none, second half marked |
| [Districts](districts.md) | The twelve districts, what each keeps, and its quest | Light |
| [People](people.md) | Wren, Calder, Sevrin, Hask, Isolde, Tansy, Ennick, the Keepers' Circle, the Forgettings | Later paragraphs marked |
| [The story](story.md) | The prologue, twelve chapters and the epilogue, in full | Yes |
| [Tales and quests](tales.md) | Fifty-two weekly tales and twenty-five side quests | Yes |
| [Relics](relics.md) | Every artifact, ledger page, document and keepsake, with its story | Some |
| [The Undercroft](undercroft.md) | The tablets of the deep stair, its guardians and lost treasures | Yes |
| [Trials and Echoes](trials.md) | The District Trials and the sealed vaults | Light |

Every page except this one is generated from the game's own story files (`scripts/lore-doc.mjs` reads `src/data/`), so the guide always matches what the game shows. To change the lore, change the story data and run `npx vite-node scripts/lore-doc.mjs`.

## The canon, in short

- **The Tide** takes what is not held. It is not evil; it is the river being the river. Forgetting in Veyra is normal and forgivable, never a punishment.
- **The Art of Places** (the memory palace) is old, older than Veyra, and it is not magic, though Veyra treats it with the respect usually given to magic.
- **The Wardens** were thirteen, bound by the Compact of Lamps. Their lamps light for whoever truly remembers.
- **Forgettings** are what the Tide leaves behind: soft, shy, a little sad. They are lost things waiting to be remembered, not monsters.
- **The story is invented.** Veyra, its people, places and history belong to this game. Trials, Echo battles and the Undercroft may use real people, places and facts as memory material, but only true, public, checked facts, and never anything that suggests a real person endorses Mnemos.

## Writing for Veyra

If you want to add a tale, a side quest, an Undercroft tablet, a relic or a new corner of the city:

1. **Voice.** Plain, warm, specific. Small concrete details over grand statements (a cup of rosemary tea, a footprint in the river mud, a key worked into twelve sluice-wheels). Gentle humour is welcome; cruelty, gore and horror are not.
2. **No dashes as punctuation.** The house style uses commas, full stops and colons instead of em dashes.
3. **Learning is the magic.** Rewards in the story come from remembering, never from waiting, grinding or paying.
4. **Keep the canon.** Check the world and people pages before you name a place, a date or a family. If you need something new, say so in your proposal.
5. **Original only.** No characters, names, art or long passages from other works.
6. **Ids are forever.** Relics, quests and lore entries are saved in players' games by their id. New ones are fine; renaming old ones breaks saves.

Proposals are welcome as GitHub issues or pull requests (see [CONTRIBUTING.md](../../CONTRIBUTING.md)). Story text is reviewed by hand before it ships, even when a local model drafted it.

## Still being written

The world is not finished. Planned additions include the Long Vigil on the Quay battlements, the Lethe Brambles, Wren's Audit, the Cabinet of Voices, Wren's own story memory, the Great Forgetting, and Calder's closing letter for the Field Guide. See [docs/ROADMAP.md](../ROADMAP.md).
