# Hand-over: painted art work (Nov 8, 2026)

Read this first in a new session, together with `CLAUDE.md` and `docs/ART.md` ("Painted scenes that move").
Nothing in this work is committed. Another session works in the same folder on curriculum files
(`src/engine/core.js`, `session.js`, `store.js`, `src/data/curriculum.js`, `lessons.js`, `content.js`, `scenarios.js`,
`src/data/add/`, `src/ui/Drill.jsx`, `SceneDrill.jsx`, `Session.jsx`, `src/engine/abstract.js`, `tests/e2e.mjs`): do not edit those.

## Owner decisions today
- **Undercroft door: approved and shipped.** It is 960x540 (`src/assets/art/scene/crypt_entrance_*.webp`, `src/data/scenes.js`).
- **New art style, approved ("Yes, use this style"):**
  - fine, detailed pixel art, painted from words alone;
  - no chunky 16-bit look;
  - no starting from the blocky code drawings;
  - no hard shrinking to a small grid.
  - The owner called the old blocky results "unusable".
  - The style test is in `tools/asset-studio/out/motion/style_test/sheet.png`.
- **CLAUDE.md is not updated yet.** It still says pictures are "reduced to a small pixel grid". Change that rule to "fine, detailed pixel art" (owner approved the style).
- **Image model:** use only the one already on this PC. It is ComfyUI Desktop, file `qwen_image_2.1_bf16` (13.3 GB); the owner calls it Qwen Image 2.5. Learn its use from the studio project:
  - `D:\Personal Claude Projects\Your Ayurveda Expert\TikTok-Influencer-Project\studio\agent\agent.py` (`PICTURE_SIZES`, `comfy_image`);
  - `agent/comfy_bench.py`.
  - **Sizes:** stay at or under 1.0 MP (about 1 min per picture); 0.45 to 0.6 MP for small pictures (17 to 54 s). 2 MP took 5 to 18 minutes, so never again.
  - **Never download** model files.
- **World map:** the owner wants a better view and finer detail. Three new views are painted (`tools/asset-studio/out/motion/world_map_fine_choices.png`, sources `world_map_lit_s0/1/2.png` = views 1/2/3). **Waiting for the owner to pick one.** I recommended view 1 (clearest districts).

## What the code does now (all uncommitted)
- **`tools/asset-studio/motion.py`**, the painted-scene tool.
  - Stages: `guide`, `paint`, `ship`, `standin`, `gif`, `compare`, `ideas`, `refine`.
  - Options:
    - `ship --width W` picks the shipped width;
    - `paint --lit-only` paints the lit pictures only;
    - `--scene a,b,c` paints several scenes in one run.
  - **Free scenes** (`"free": True`) are painted with `txt_wf` in `LOOK_FINE` and `NEG_FINE` at 1.0 MP: `title`, `world_map`, and `crypt_chamber_<decor>` (bones, shelves, water, thrones, roots, springs).
  - The dark (lost) plate is an edit of the lit one. The map's lost plate is tinted grey-blue (`derive_lost`).
  - `"single": True` (title) ships one picture only.
  - Map `anchors` (per seed, painting pixels) and `sea` are scaled into the manifest.
  - **Bug fixed:** `ImageOps.autocontrast` (it was `ImageChops`).
- **`src/pixel/painted.js`:** `regionMask` (district reveal), `maskBlend`, `lightBlend`. Tested in `tests/painted.test.js`.
- **`src/ui/pixel/WorldMap.jsx`:**
  - If `SCENES.world_map` exists, it draws the lost plate, then the restored plate inside each restored district (`regionMask`). Code overlays (beacon, selection, brambles, burn, restore burst, fog) and life (`src/ui/pixel/mapLife.js`: boats, birds, townsfolk, smoke, lanterns) go on top.
  - District boxes come from the manifest `anchors` (`PAINTED_L`); hit buttons and labels use them too.
  - Without a painted map, the code map is unchanged.
  - `ROUTE` is exported from `world.js`; `mapFog(states, L, riverMist)` takes a district table.
- **`src/ui/pixel/Scenes.jsx`:** `TitleScene` uses the painted `title` (windows flicker, code fog and traveller on top) if one ships; otherwise the code backdrop.
- **`src/ui/Crypt.jsx`:**
  - `usePaintedArt(id)`; `ChamberScene` uses `crypt_chamber_<band.decor>` if it ships (orb, flames, mist on top).
  - `chamberGuideCanvas` is exported for the tools.
  - The scene box grows to 960 px on desktop (`useIntScale` fine mode; smooth shrink when narrower). CSS is in `src/ui/crypt.css`.
- **`tools/asset-studio/scene_capture.mjs`:** modes `guide`, `frames`, `map`, `mapframes <dir> <n> <0|1|2>`, `title`, `chamber`.
- **Drill pictures for the curriculum session** (66 jobs in `tools/asset-studio/test_art_jobs.json`):
  - `tools/asset-studio/testart.py` paints them, then `--sheet` makes contact sheets.
  - `ship.py` has categories `card` (128x96), `vignette` (240x135) and `symbol` (48x48), and reads the rows from the json. Choose seeds in `TEST_PICK`.
  - I checked that `ship.py` rebuilds all 164 existing `art.js` entries unchanged.
  - The peer asked: best of 2 seeds, contact sheet to the owner, ship, then tell session `local_4bf43053-cfcb-42c3-84ca-6ef2889fe308`.
  - Known: the octopus test showed 2 hearts, but the fact says 3. Check every fact picture matches its fact.
- **Tests:** `npm test` passed (459) after these changes.

## Paint queue running when this was written (19:25)
The log is in the session scratchpad `q.log`. In order:
1. Map views s0 to s2: done.
2. `title` x2 and the six chambers x2: done (drafts are in `tools/asset-studio/out/motion/`).
3. `testart.py` (66 x 2).
4. `testart.py --sheet`, which writes `tools/asset-studio/out/test_art_sheet_{card,vignette,symbol}.png`.

Drafts land in `tools/asset-studio/out/motion/` (scenes) and `tools/asset-studio/out/new/` (drill pictures). If the queue stopped, re-run the same commands. They skip files that already exist:
```
python tools/asset-studio/motion.py paint --scene title,crypt_chamber_bones,crypt_chamber_shelves,crypt_chamber_water,crypt_chamber_thrones,crypt_chamber_roots,crypt_chamber_springs --seeds 2
python tools/asset-studio/testart.py
python tools/asset-studio/testart.py --sheet
```
Old blocky drafts were moved to `tools/asset-studio/out/motion/old_blocky/` (keep them out of the way; they are not to ship).

## Next steps
1. **Map:** when the owner picks a view (say view N = seed `s{N-1}`):
   - paint its lost version: `python tools/asset-studio/motion.py paint --scene world_map --seeds N` (without `--lit-only`; it paints only the missing dark files).
   - Look at the picture with a grid and write `anchors` into `SCENES["world_map"]` in `motion.py`: `{"s0": {"M1": [x, y, w, h], ..., "M12": [...], "archive": [...]}}` in the painting's pixels. Which building is which district: `M1` Quay/harbour, `M2` Long Gallery (columned gallery), `M3` Hall of Faces, `M4` Counting House (tall timber), `M5` Clockwork Market (clock tower and stalls), `M6` Tongues Bridge (long white bridge), `M7` Scriptorium (glass spire), `M8` Tidal Stair (zigzag stair), `M9` Mirror Wards, `M10` Open Roads, `M11` Amphitheatre, `M12` Lethe Gate, `archive` (domed library at the top). Also set `"sea": {"s0": y}`.
   - Ship: `python tools/asset-studio/motion.py ship --scene world_map --seed s0 --width 896`.
   - Record frames (`node tools/asset-studio/scene_capture.mjs mapframes <dir> 30 1`), make a GIF and send them for review.
   - **Owner approval is needed before keeping the ship.** To roll back, delete `src/assets/art/scene/world_map_*` and restore `src/data/scenes.js` and `tools/asset-studio/scenes.json` from `tools/asset-studio/out/motion/backup_shipped/`.
2. **Title and chambers:** pick the better seed of each and ship (`ship --scene title --seed sX --width 960`, the same for each chamber). Send a review sheet first. Chambers' review needs the floor view: start a run in `previews/crypt` or record frames.
3. **Drill pictures:** send the three contact sheets, fill `TEST_PICK`, run `python tools/asset-studio/ship.py`, then message the curriculum session.
4. **Budget:** watch the 5 MB budget (`ship.py` prints the total). Now about 1.4 MB. The map pair at 896 wide is about 1 MB, 7 scenes at 960 wide about 1.6 MB, drill pictures about 0.6 MB. If it goes over, ship the chambers at 800 wide.
5. **Docs:** update CLAUDE.md (art rule) and `docs/ART.md` (fine style, sizes, free scenes, map anchors).
6. **Final checks:** `npm test`, `npm run build:single`, `node tests/e2e.mjs` (must print "errors: none"), then screenshots at 390 px and desktop (Undercroft, map, title). The dev server config is in `.claude/launch.json`, `mnemos-dev`, port 5199.
7. **Not done from the original plan:** the old guide-based world map drafts (`out/motion/draft_map_s0/s1`) were replaced by the fine-style approach. Don't ship them.
