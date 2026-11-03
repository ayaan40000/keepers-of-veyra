# Mnemos Soundtrack Plan

> **Owner decision, Nov 2, 2026:** the two first drafts (`veyra-dusk`, `gate-passed`) are rejected. The soundtrack is a separate future project, run in its own session. It needs a proper multichannel score (bass, leads, harmony and percussion) built around one core Mnemos theme, with a defined musical style, and modes, keys and tempos that relate back to that theme across every area of the game. Single sounds made up on the spot are not acceptable. The tool in `tools/sound-studio/` is only a renderer for listening to drafts.


Status: plan and pilot, not built into the game. Owner-led: Ayaan listens and decides, Claude writes and adjusts the scores. Date of this plan: Nov 2, 2026.

Target sound: 8-bit chiptune music and sound effects, in the spirit of classic pixel-art games, but entirely original. No melody, sample, track, instrument patch or recognisable motif from any game or film. Compositions are our own.

What this document could not do: Claude had no internet when writing it. Every licence, version and feature in the tool survey below comes from memory and **must be checked on the tool's own page when the owner pilots it.** Nothing here is legal advice.

## 1. Rules that shape everything (from CLAUDE.md)

- No runtime network calls, no trackers, no accounts. Music must work offline.
- Study and recall screens: no animation and no sound except the one soft submit sound. This plan reads that strictly: **no music plays while a player is studying or typing an answer, anywhere** (see section 3).
- Sound is never used to scare or pressure. No ticking clocks, no rising tension, no tempo that speeds up with a timer, no sudden loud sounds, no "wrong answer" sting.
- Rewards come only from demonstrated learning. Music is never a reward for time spent, and a stinger plays only when something was actually earned (a gate passed, a relic found, a trial recalled).
- Honest claims. We do not say music improves memory or focus. Music is atmosphere and a pleasure, nothing more.
- All art original. For music the same: original compositions, tools used only to make them.
- Light on phones.

## 2. What music is needed

Everything is a loop unless it says stinger (plays once, 2 to 8 seconds). Lengths are for one pass of a loop. Priority: A is the pilot and first release, B is next, C is later.

| Piece | Where it plays | Kind and mood | Length | Priority |
| --- | --- | --- | --- | --- |
| Title theme | Onboarding welcome and the title/first-run screen | Warm, curious, a little grand | 30 to 45 s loop | A |
| Veyra, dawn | Map and Today when the world palette is dawn | Light, hopeful, slow build | 30 to 60 s loop | B |
| Veyra, day | Map by day | Gentle, open | 30 to 60 s loop | A |
| Veyra, dusk | Map at dusk (the pilot piece) | Calm, golden, a little wistful | 40 to 50 s loop | A |
| Veyra, night | Map at night | Very sparse, soft, lullaby-like | 30 to 60 s loop | B |
| District themes | Map views and approach scenes of a district | A shared set of 5 moods (below), each with a small change of lead voice per district | 30 to 45 s loops | B |
| Echo battle (scene start and result) | Echo battle intro, between rounds on the result screen, victory screen | Steady and brave, not scary; about 96 BPM | 30 to 45 s loop | B |
| The Great Forgetting (boss) | Boss trial intro and result only | Same family as the battle theme but larger, with a slow, stately lead | 45 s loop | C |
| The Undercroft | Crypt entrance, floor rest and descent screens, run result | Low, cool, hushed, with a gentle pulse; deeper floors only add a quiet layer, never a threat | 45 s loop | B |
| The Long Vigil | Vigil scene intro and result on the Quay battlements | Lantern-lit, patient, soft bells (triangle and soft pulse) | 45 s loop | C |
| District Trials and vaults | Trial intro, "study the tablet" framing screen, result | One shared theme: quiet curiosity | 30 s loop | C |
| Epilogue | The Year of Keeping epilogue and the last gate talk | One longer, tender piece that reuses the title theme in a new key | 2 to 3 min, plays once | B |
| Stingers (about 8) | Gate passed, relic found, rank up, chapter start, trial passed, vault opened, Year complete, new lore entry | Short bright fanfares or soft chimes | 2 to 8 s each | A (gate passed first) |

District mood sets (a suggestion; the owner may regroup them):

| Mood | Districts |
| --- | --- |
| Lamplit and warm | 1 Lamplighters' Quay, 2 The Long Gallery |
| Quiet and reflective | 3 The Hall of Faces, 7 The Scriptorium, 9 The Mirror Wards |
| Brisk and clockwork | 4 The Counting House, 5 The Clockwork Market, 6 The Tongues Bridge |
| Wide and open | 10 The Open Roads, 8 The Tidal Stair |
| Hushed and grand | 11 The Amphitheatre of Echoes, 12 The Lethe Gate |

Sound effects are already built (`src/audio/sfx.js`: select, confirm, back, soft, blip, success, fail, chest, levelUp, door, page). The pilot adds at most a few new ones (for example a vault opening and a lantern lighting) and keeps the existing rules: `soft` is the only sound on recall screens, and `fail` is a gentle falling triangle, never a buzzer.

### Totals

About 14 loops, 8 stingers and one epilogue. With the scores written as data (section 6) that is roughly 40 to 60 KB of score data before compression. If every piece were a recorded file instead, it would be many megabytes, which is why we do not do that.

## 3. Where music stays silent

Music never plays on:

- Any study screen (lessons, drill study phase).
- Any recall screen or answer screen (drills, delayed probes, Recall cards, Echo battle questions, Undercroft floors, trial and vault recall, gates, the Long Vigil questions).
- Anywhere with a timer running.

Music may play on:

- The map, Today (before and after the session, not during it), the palace room, the Reliquary, Progress and Keeper settings.
- Scene setting screens: Echo battle intro and result, Undercroft entrance and result, trial and vault framing, chapter scenes, the epilogue.

How: the player listens for a "silent zone" flag. Screens that already use `data-quiet` (silencing the delegated button sounds) are the natural place to set it. Entering a silent zone fades the music out over about 1 second (instantly if reduced motion is on); leaving it does not restart music by itself in the middle of a screen but at the next scene change. Music also stops when the tab is hidden, and when the player turns music off.

The one soft submit sound (`sfx.soft`) is unchanged.

## 4. Defaults and settings

- Sound effects (`prefs.sound`) stay **off by default**, as today.
- Music is a **separate** setting, `prefs.music`, **off by default**. A player who turns on sound effects does not get music unless they also turn music on.
- Music volume, `prefs.musicVolume`, default 0.4, its own slider under the existing volume slider. Music sits well below the effects: master gain for music about 0.12 against 0.2 for effects at 100%.
- Nothing plays before a user gesture (browsers forbid it anyway), and nothing plays automatically on first run. A music toggle appears in Keeper settings in the Audio group; the hud sound button stays the effects mute.
- Reduced motion (`prefs.reducedMotion`, and the system preference): no crossfades, no fade-in swells; music simply starts and stops. It does not turn music on or off by itself.
- A quiet-friendly rule for players on shared devices: music is off in every new profile and in imported saves that lack the field.
- Pausing: music pauses when the tab is hidden and resumes only if the player left it on.
- Loudness: all pieces are mixed to the same level in the score data (a `vol` per channel). No piece is louder than the existing `success` effect.
- A tired or stressed player must always have a one-click way out: the sound button and the music setting, both reachable on every screen.
- Saved-data change: two new optional prefs (`music`, `musicVolume`) means a validation line in `src/store.js` (booleans list, a number range) and a migration that defaults them. Item ids and field names are permanent once released, so choose the names once. Not done in this pilot.

## 5. Size budget for phones

Preferred path: **no audio files.** Music is generated at runtime in WebAudio from small score data, exactly as `sfx.js` already does for effects.

| Part | Budget |
| --- | --- |
| Player code (`src/audio/music.js`, minified) | 6 KB or less |
| Score data for all music, minified, before gzip | 60 KB or less (the 16-bar pilot theme is about 2.5 KB, so 14 loops plus stingers fits comfortably) |
| Memory and CPU | A few oscillators at once, scheduling a bar ahead. Must stay smooth on a low-end Android; test on one. |

If audio files ever have to ship (for example a piece that cannot be written as a score), the budget is separate from the 5 MB art budget and **all audio files together must stay under 500 KB**:

- Format: Ogg Opus, mono, 48 kbps or lower, 48 kHz source, loop point checked. (Browser support for Opus, especially on older Safari, must be checked before choosing; an AAC `.m4a` fallback would double the size.)
- Each file 100 KB or less and 45 seconds or less; epilogue up to 250 KB.
- Files go in `src/assets/audio/` with a manifest in `src/data/`, loaded only when needed, cached by the service worker.
- Plain WAV never ships.

## 6. Score format and runtime player

The score format is `mnemos-score/1`, defined and demonstrated in `tools/sound-studio/README.md` and `tools/sound-studio/render.mjs`. It is JSON: tempo, steps per beat, and channels (`pulse1`, `pulse2`, `triangle`, `noise`), each with a voice setting and a text string of notes such as `A4:6 r:2 D5:4 | ...` (pitch and length in steps, bars separated by `|`).

Runtime player, designed but not built or wired:

- One small module in `src/audio/` (for example `music.js`) sharing the `AudioContext` and the unlock rule from `sfx.js`, with its own gain node for the music volume.
- A scheduler looks ahead about one second and queues note events (the standard WebAudio "tale of two clocks" pattern), so timing stays steady even when the page is busy.
- Voices: pulse via `createPeriodicWave` built from the duty cycle (a short Fourier series), triangle via the built-in `triangle` oscillator, noise via a short pre-made buffer through a filter and envelope (the same trick as `noise()` in `sfx.js`).
- API sketch: `playMusic(id)`, `stopMusic()`, `setMusicEnabled(bool)`, `setMusicVolume(v)`, `setSilentZone(bool)`.
- Scores are loaded from a data module (`src/data/music.js` or a JSON import), so adding a piece never changes player code.
- Unit tests: parse every score and check each bar adds up (the same check the studio script already does), so a typing mistake cannot reach players.
- The studio script and the runtime player must sound the same enough that a draft heard from the WAV is a fair preview. Small differences in the rendering are expected and are the owner's call to approve.

Not wired in the pilot. Wiring is a separate piece of work after the pilot is approved (about a day, plus the settings and migration in section 4).

## 7. Licensing

- Every piece of music and every effect added to Mnemos is an **original composition** by Claude with the owner's direction, released under **CC BY 4.0**, like the shipped art. Add a line to the credits (`src/data/licenses.js` and the licence page) when the first piece ships. (That file belongs to another workstream right now; the change is for later.)
- Tools are used only to make the pieces. A tool's licence matters for what we bundle (code in the game) and for what we copy (sample sets, instrument presets). Output made with a tool is ours to licence **only if the tool's licence says so** (most of the ones below do; check).
- Do not copy melodies, bass lines or drum patterns from any game, even from memory or by ear. Classic game tunes are protected. A progression such as "Dm, Bb, F, C" is common property; a recognisable melody is not. The test: if a listener could name the original game, rewrite it.
- No samples. Do not ship recordings, sample packs or soundfonts unless the licence allows redistribution and the owner approves.
- Do not use an AI music generator. Its licence, training data and output rights are uncertain, and the owner's rule is original work.
- Keep a short composer note per piece (what tools, when, what was original) in the score file's `note` field.

## 8. Open-source tools survey

Licences are as remembered by Claude and **may be wrong or out of date. Verify the licence and the current version on the project's own page before using any of them.** "Bundle" means code that would go inside the game. "Make" means a tool the owner runs on their computer to prepare tracks.

| Tool | What it is | Licence as I know it | Use for us |
| --- | --- | --- | --- |
| **Our sound-studio script** (`tools/sound-studio/`) | Score to WAV for drafts | Ours (project licence) | Make. Part of the pilot. |
| **Web Audio API** (built into browsers) | Sound synthesis | A web standard, no licence to manage | Bundle. Already used by `sfx.js`. The recommended runtime. |
| **ZzFX** | Tiny sound-effect synthesiser in JS, about 1 KB | MIT (verify) | Make or bundle. Good for new effects; the `sfx.js` approach already covers most needs. |
| **ZzFXM** | Tiny tracker music player on top of ZzFX | MIT (verify) | Possible runtime player if we want ready-made tracker data; heavier to author for than our JSON. |
| **sfxr / jsfxr** | Random and tweakable retro sound-effect generator; jsfxr is the browser version | sfxr is MIT or similar; jsfxr I believe Apache 2.0 or similar (verify both) | Make. Find an effect you like, then copy its parameters into `sfx.js`. |
| **BeepBox** | Browser chiptune editor; songs live in the link or a JSON export | MIT (verify) | Make. Friendly for the owner to sketch a tune by clicking. Needs a conversion step to our score format. |
| **JummBox** (and other BeepBox forks) | BeepBox with more features | MIT (verify) | Same as BeepBox. |
| **FamiStudio** | NES-style music editor (Windows, free) with piano roll and WAV export | MIT (verify) | Make. The most "real console" sound; exports WAV, and NSF for the console format. |
| **Furnace Tracker** | Multi-chip chiptune tracker supporting many old sound chips | GPL v2 or later (verify) | Make only. Do not bundle its code. Songs you create are yours, but check. |
| **OpenMPT** | Windows tracker for module files (`.it`, `.xm`) | BSD 3-clause (verify) | Make. For authors used to trackers. |
| **chiptune2.js / chiptune3 with libopenmpt** | Plays tracker module files in the browser through WebAssembly | libopenmpt is BSD 3-clause; wrappers vary (verify) | Not recommended. The WebAssembly is large (hundreds of KB) and we would still need the module files. |
| **Tone.js** | Big, friendly WebAudio framework for music | MIT (verify) | Not recommended for the game. Too large (well over 100 KB) for what we need. Fine for experiments. |
| **Sonant / SoundBox and similar demoscene synths** | Very small JS music players | Mixed (zlib, MIT, others; verify) | Possible, but our own player is smaller and fully ours. |
| **Bosca Ceoil** | Very simple music maker | I do not remember the licence (verify) | Make, if the owner likes it. |
| **Audacity** | Audio editor | GPL v2 or later (verify) | Make. Trim and normalise drafts. |
| **ffmpeg** | Converts audio formats | LGPL or GPL depending on build (verify) | Make, only if audio files ever ship. |
| **LMMS** | Full music studio | GPL v2 or later (verify) | Make. More than we need. |

## 9. Recommended path for the pilot

**Own score JSON plus our own tiny WebAudio player, prepared with the Node studio script.**

Why: it keeps the game offline, adds a few KB instead of megabytes, keeps every note in plain text that Claude can write and edit on request, makes the music easy to test and to credit as original, and needs no third-party code in the game. The owner needs only a WAV player to judge drafts.

Optional extras, in this order, only if the owner wants them:
1. **FamiStudio** (or BeepBox in the browser) for the owner to hum or click out tunes, with Claude then transcribing them into scores. These tools are for making, nothing from them ships except the notes.
2. **jsfxr** to find the shape of a new sound effect.
3. **ZzFXM** only if the owner prefers tracker-style authoring and the size is checked.

## 10. Pilot plan for the owner

One theme and three effects, then decide. No game code changes until step 6.

1. **Listen to the first draft (10 minutes).** Open `tools/sound-studio/out/veyra-dusk.wav` and `gate-passed.wav` (they exist already; if not, run `node tools/sound-studio/render.mjs`). Say what you hear in plain words: too fast, too sad, too busy, bass too loud, the drums annoy you, it sounds like another game. Claude: none, wait for notes.
2. **Revise (same day).** Claude edits the notes, speed, voices and mix in `tools/sound-studio/scores/*.json` from your words and renders a new WAV. Repeat until you like it, usually three to five rounds. Claude also checks that no melody resembles a known tune.
3. **Judge it with four questions.** (a) Would I be happy hearing it on the map for ten minutes? (b) Does it fit Veyra at dusk? (c) Is it quiet enough that I could study with it off to the side? (d) Does it sound original? If any answer is no, go back to step 2. Also try it twice in a row (`--loops 2`) to hear the loop seam.
4. **Three sound effects.** Ask Claude for three new sounds (suggestions: a vault opening, a lantern lighting, a chime for a new lore entry). Claude writes them as small scores or as `sfx.js` functions and renders WAVs so you can audition them. The check: none is sharp or loud, none sounds like a warning.
5. **Optional second voice.** If you want to sketch your own idea, try BeepBox or FamiStudio, check its licence page first, and share the notes (a screenshot or exported file). Claude turns them into a score.
6. **Decide.** If the pilot is approved, Claude builds the small player, the Music setting and the migration (section 4), adds the unit test for scores, and plays the dusk theme on the map only, behind the off-by-default setting. Test on a real phone, including a low-end Android, for smoothness and volume. Then write the next themes in the order of section 2.
7. **Release.** As with everything: nothing is pushed or published without your explicit approval.

## 11. Decisions for the owner

1. **Strict silence.** Is it right that music never plays under any recall or answer screen, including Echo battle questions and Undercroft floors (music only on intro, result and map screens)? This plan says yes.
2. **Music default.** Off by default, as sound effects are. This plan says yes.
3. **District grouping.** Is five shared moods for twelve districts fine, or should every district get its own piece later?
4. **Tool path.** Own scores and player (recommended), or also try FamiStudio or BeepBox for your own sketches?
5. **Credit line.** Who is named as composer in the credits (for example "Ayaan, with Claude")?
6. **Epilogue.** Should it reuse the title theme (cheaper, emotionally tied) or be wholly new?
