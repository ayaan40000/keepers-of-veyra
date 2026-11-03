# Sound studio (draft listening tool)

Turns a small JSON score into a WAV file so you can hear a draft with no app and no internet. It imitates the three kinds of voice an old 8-bit console had: two square-wave "pulse" voices, one "triangle" voice for bass, and one "noise" voice for drums. It needs only Node (already installed for the project) and has no dependencies.

This is a development tool. It is not part of the game and nothing here ships to players. The plan is in `docs/SOUNDTRACK.md`.

## Commands

Run these from the project folder (`D:\Personal Claude Projects\Mnemos`).

```
node tools/sound-studio/render.mjs
```
Renders every score in `tools/sound-studio/scores/` into `tools/sound-studio/out/` (for example `veyra-dusk.wav` and `gate-passed.wav`). Double-click a WAV in File Explorer to listen.

```
node tools/sound-studio/render.mjs tools/sound-studio/scores/veyra-dusk.json
node tools/sound-studio/render.mjs tools/sound-studio/scores/veyra-dusk.json C:\Temp\listen.wav
node tools/sound-studio/render.mjs tools/sound-studio/scores/veyra-dusk.json --loops 2
node tools/sound-studio/render.mjs tools/sound-studio/scores/veyra-dusk.json --rate 22050
```
One score; the second form picks the output file; `--loops 2` repeats a looping score so you can judge the seam; `--rate 22050` makes a smaller, duller file.

The script prints the length and size of each file, and warns if any bar has the wrong number of steps (the usual typing mistake).

The `out/` folder is ignored by git, so drafts never end up in the repository.

## Score format ("mnemos-score/1")

```json
{
  "format": "mnemos-score/1",
  "title": "Veyra at dusk",
  "bpm": 76,
  "stepsPerBeat": 4,
  "stepsPerBar": 16,
  "loop": true,
  "channels": {
    "pulse1":   { "wave": "pulse", "duty": 0.25, "vol": 0.55, "gate": 0.92,
                  "env": { "a": 0.01, "d": 0.25, "s": 0.7, "r": 0.12 },
                  "vibrato": { "rate": 5, "cents": 12, "delay": 0.25 },
                  "notes": "A4:6 G4:2 F4:4 A4:4 | D5:8 C5:4 Bb4:4" },
    "triangle": { "wave": "triangle", "vol": 0.7, "notes": "D2:6 A2:2 D2:4 A2:4 | Bb1:6 F2:2 Bb1:4 F2:4" },
    "noise":    { "wave": "noise", "vol": 0.22, "notes": "k:4 r:4 h:2 r:2 h:2 r:2 | r:16" }
  }
}
```

Time: one "step" is a sixteenth note (`stepsPerBeat` 4). A 4/4 bar is 16 steps.

Notes: written as pitch and length in steps, `A4:6`. Pitch is a letter, an optional `#` or `b`, and an octave number (`C#5`, `Bb3`). Middle C is `C4`. A length left out means 1 step. `r:4` is a rest of 4 steps. A `|` marks a bar line and is only for reading; the script checks that each bar adds up.

Drums (noise channel): `k` is a kick, `s` a snare, `h` a hi-hat. You can retune them per channel with a `drums` object (clock rate, sweep, decay, short mode); see `DRUMS` in `render.mjs`.

Voice options: `duty` (pulse width: 0.125, 0.25 and 0.5 are the classic sounds), `vol` (0 to 1), `gate` (how much of each note is held before it releases, default 0.9), `env` (attack, decay, sustain level, release; times in seconds), `vibrato`, and for the triangle `steps` (how coarse it is, default 16, like the real chip). `loop` says whether the music repeats.

## Using the same score in the game later

The score is plain data on purpose. The notes and times are exactly what a small WebAudio player needs: for each event it knows the start step, the length, the pitch and the voice. A player in `src/audio/` could schedule them on the same `AudioContext` that `sfx.js` already creates: oscillators for the triangle, a pulse wave built with `createPeriodicWave` for the pulse voices, and a short pre-made noise buffer for drums, read ahead a few bars at a time. `parseScore` and `parseNotes` in `render.mjs` use no Node features, so that logic can be copied almost as is. Nothing is wired into the game yet. See "Score format and runtime player" in `docs/SOUNDTRACK.md`.

## Honest limits

- The sound is an imitation of the old console voices, not a bit-exact emulation.
- Claude cannot hear the result. The owner's ears are the test. Expect to ask for changes.
- Both example scores are original compositions made for this project (CC BY 4.0, like the rest of the art). They are drafts.
