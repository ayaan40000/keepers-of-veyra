# RPG depth: Character, Gear and Echo battles (v0.10 design)

Binding input: `docs/CHAMPIONS.md` and the hard rules in `CLAUDE.md`. Where an outside idea conflicts with a rule, the rule wins.

## Verdicts on the outside advice

| Idea | Verdict | Why |
| --- | --- | --- |
| Learning as the magic system, stats from subjects | Keep | Attributes are the seven skills. |
| Visible progression, customisation, lore, side quests | Keep | Paper doll, gear, new codex entry and quest. |
| Story over streaks, forgiving streaks, finite day | Keep | Already the design; battles add no quota. |
| Dynamic difficulty | Keep | Battle item weight follows how old the memory is. |
| Visual palace blueprint | Keep (built) | The walkable palace room already exists. |
| Variable-ratio loot, random crits | Refuse | Slot-machine reward schedule. Damage is fixed. |
| Streak FOMO, daily login rewards, limited events, energy timers | Refuse | Pressure, not learning. Battles are always optional and never expire. |
| Leaderboards | Refuse | Shame and no network. |
| Bonus Focus XP for coming back | Refuse | Rewards returning, not learning. Catch-up stays a lighter review. |
| Zeigarnik pull, "nobody leaves a story" | Do not claim | Weak evidence. |
| Guilds and a shared 10,000 HP raid | Defer | No network or accounts. Adapted as the Keepers' Circle, NPC coaches who speak only before and after a battle. |
| 10 to 15 minute cap | Adapt | Mnemos stays about 30 minutes; a battle is 5 to 8 minutes and can be left. |
| Dominic System, season rewrite | Refuse | Mnemos teaches Major and PAO; the 12-module year stays. |
| Weekly bosses (Gala, Supermarket, Archive, Championship) | Adapt | They become battle scenes. Material may be real or invented (owner decision, Nov 2, 2026). |

## RPG structure

1. **Character sheet** (`src/engine/character.js`): seven attributes, one per skill, value = skill level + mastery step (1 to 14). Nothing new is earned: it is only a new view of existing data. The class comes from the strongest attribute (Lamplighter, Weaver, Cartographer, Face-Reader, Cipher-Smith, Tongue-Warden, Archivist; Wayfarer when balanced; Apprentice at the start).
2. **Paper doll** (`src/pixel/keeper.js`): a pixel Keeper drawn in code. Each passed gate adds a stitch of trim on the cloak, and gates 3, 6, 9 and 12 add a clasp, a pin, a lantern halo and a gold lining. Equipped gear shows on the figure.
3. **Inventory and equip slots**: lantern, cloak, charm, tool. Only relics already owned can be worn (`profile.keeper.equip`). Effects are cosmetic or study support, and show nothing before you answer:
   - Lantern of Letters (River Glass Lamp): after a wrong answer in a battle, shows the first letter and allows one more try at half damage.
   - Scroll of Order (Ledger Pouch): shows how many items a list had, never what they were.
   - Palace Map (Tide Map Case): shows which stops are still empty in a Locate turn.
   - Cloaks, charms, other tools: cosmetic.
4. **Echo battles** (`src/engine/battle.js`, `src/ui/Battle.jsx`): below.
5. **Story**: the Forgettings codex entry (opens after the first gate), a first-meeting beat, Keepers' Circle coach lines, and a closing hook for the Year of Keeping.

## Battle rules

- The enemy is a **Forgetting** matching one skill. Its HP is the weight of the items it holds. Your **Resolve** is 5.
- A turn is one recall prompt, free entry, checked by the forgiving matcher. No multiple choice, no timer.
- Formats follow the data: Recall and Reverse (pairs, Major, vocabulary, facts), Order (what came after X), Locate (palace stop to item), and a face-to-name Recall.
- A right answer deals fixed damage (1 for recent, 2 for items 30 days or older). A **Hint** shows the first letter and halves damage. A wrong answer costs 1 Resolve, shows the answer, and the item comes back later (two retries at most; retries cost no Resolve and earn nothing).
- One **Skip** per battle. Leaving is always allowed and costs nothing.
- Items are pulled from `profile.sets` and are at least one day old, preferring sets due at the 1, 7, 30 and 90 day spacing and earlier misses. Several skills are mixed. Never new material.
- Each prompt says why it came: "Learned 41 days ago, last held 12 days ago."
- The Memory Echo is telegraphed on Today with a reason, can be set aside, and is offered only after the first gate, at most once a day, and less often early on.
- Resolve at 0 is a gentle **rest**: answers shown, items queued to appear first next time. No lost progress.
- **Results never touch skill estimates, review sets or results**, like the Crypt.
- **Rewards only for old items that held**: first try, no hint, no lantern retry, item at least 7 days old. Lumen: 2 each (3 at 30 days or more), max 20 a battle, and inside the 50 a day free practice cap. Held counts also unlock story and cosmetic charms.
- Honest line shown to the player: battles practise the methods on practice material and do not make memory better in general.

## Scenes (practice only, no reward)

Networking Gala (names and faces), Packing Bay (a list with a distracting sum midway), Speech Hall (five points on a route), Crossroads (six turns), Night Market (prices). Material may be real (real names, places, prices, dates, checked for accuracy) or invented; the story around it stays invented. A coach asks what the material is made of, and the player picks Link, Palace, Major or Keyword. A good fit gives 25 percent more study time; a poor fit gives a tip and no penalty. Fresh material earns nothing, by rule.

## Mapping onto existing systems

Pool: `profile.sets`, `PROBE_INTERVALS`, `daysBetween`. Matcher: `matches` and `majorDecode`. Lumen: `FREE_XP_CAP` pool. Gear: relics from `collect.js`. Profile: `keeper` and `battles`, with migration and validation in `store.js`. Codex unlock: existing `gate:` rule.

## District Trials and vaults (v0.11)

Same rules as battles: free typing with the forgiving matcher (vault lines: numbers and names exact), no timer on recall, no random rewards, results never touch skill estimates, review sets or results. A trial pays only when a check passes; delayed checks use the 1 and 7 day spacing (30 for the Mirror Vault). The coach who speaks before and after is the district's member of the Keepers' Circle. See `docs/ROADMAP.md` v0.11.

## Deferred

Guilds and any shared HP; ask-again-once-per-guest at the Gala; sound design for battles; full-scene art per district; battles from Crypt items; delayed self-tests on the player's own material.
