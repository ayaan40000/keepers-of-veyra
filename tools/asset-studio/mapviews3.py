"""Veyra map v3 (owner, Nov 8, 2026: "v2 round s0 looks best" + fixes; "proceed, don't ask, produce what looks best").
Fixes over v2: every building different; a larger, less dense island with fields and a village; the river is seen all the way from its
source through the city and out to the sea; old worn paved roads (cobbles and flagstones), no tarmac; signs of daily life.
Stages:  python mapviews3.py base            night base, 3 seeds  -> out/mapviews/v3/base_night_s{0,1,2}.png
         python mapviews3.py times <seed>    day, dusk, dawn edits of the chosen night picture (same layout)
Drafts only; nothing here ships to the game.
"""
import json, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import motion as M  # noqa: E402

OUT = HERE / "out" / "mapviews" / "v3"
ASPECT = "4:3 (Standard)"

CITY = (
    "A large island city seen from a high three-quarter bird's-eye view, the WHOLE island inside the frame with generous open sea around it. "
    "The island is wide, not crowded: the city climbs a central hill in seven irregular terraces, with open spaces around it, green "
    "terraced fields, orchards, hedged pastures with sheep, a small outlying fishing village, a windmill, a lighthouse on a headland, "
    "and dark pine woods on the far slopes. A round green-copper-domed Archive library crowns the hill, with an empty brass lamp-bowl on its roof. "
    "THE RIVER IS CLEARLY VISIBLE FROM SOURCE TO SEA: it starts as a pewter-silver stream from a high boggy moor at the back, runs through a great "
    "stone sluice gate with twelve iron wheels at the head of the city, tumbles down the middle of the city in small waterfalls under stone "
    "bridges, passes the market, and widens into a calm estuary that flows out into the open sea beside the harbour quay, where boats sail up it. "
    "EVERY BUILDING IS DIFFERENT, no two alike: vary the size, height, shape, footprint, roof (steep slate, flat lead, copper dome, thatch, "
    "stepped gable, tiled), wall material (grey granite, pale limestone, dark basalt, red brick, whitewashed plaster, half-timber) and age. "
    "Twelve distinct landmark districts: a lamp-lit harbour quay with boats; a very long pale columned gallery; a round hall whose wall is carved "
    "with stone faces; a tall narrow brown timber counting house; a bronze-faced clock tower beside crowded market stalls with striped awnings; a long "
    "white arched stone bridge with small shops on it; a tall slender glass spire in a walled ink garden; a great zigzag granite stair; a courtyard "
    "of mirror pools; a north gate with a milestone and the road climbing over the moor; a big old amphitheatre with tiered seats; and the sluice gate. "
    "Between them stand ordinary houses of many shapes, crooked and leaning, in organic medieval streets, some roofs high, some low, some round "
    "towers, some long halls, courtyards, gardens, chimneys, balconies, washing lines. "
)
ROADS = (
    "ROADS ARE OLD: narrow winding streets and roads of worn uneven cobblestones and flagstones with grass and moss growing between the stones, "
    "puddles, ruts, kerbs of rough granite, a few old stone steps, absolutely no asphalt, no tarmac, no painted lines, no modern roads. "
    "Twelve thin inlaid brass lines run through the paving from the harbour to the twelve districts. "
)
LIFE = (
    "THE CITY IS ALIVE: an ox-drawn cart and a horse-drawn carriage on the main road, a donkey carrying baskets, a man leading a mule with sacks, "
    "a flock of sheep on the hill, geese by the river, a dog, cats on walls, crowds of small townsfolk in cloaks around the market stalls, "
    "children running, fishermen unloading baskets of fish on the quay, small sailing boats and rowing boats on the sea and in the river, "
    "a lamplighter with a ladder, people carrying lanterns, laundry on lines between houses, smoke rising from many chimneys, smoke from the "
    "bakery, a barge on the river, birds over the water, a few lit windows. "
)
AGE = (
    "EVERYTHING IS VERY OLD AND SHOWS IT: roofs sag and are patched, walls lean and crack, stone stained dark, thick moss, lichen and ivy, "
    "worn hollows in steps, some houses shuttered, a few half-ruined propped towers, masonry of many ages side by side. "
    "A broad pale band of bleached salt-stained stone runs along the walls at one height: the line the evening Tide mist reaches. "
    "Most brass lamps in their stone niches are dark and green with age, only some are lit, as the city is relighting its lamps one by one. "
    "Carved faces and names on old walls are rubbed smooth; a ring-and-single-hand mark is cut into old iron lamp posts. "
)
WORLD = ("This is NOT Earth: an invented world, a cold northern coast with two pale ringed moons, a grey sea, strange pale heather. ")

TIMES = {
    "night": "LIGHTING: a clear moonlit night, bright cool moonlight so everything is easy to read, deep blue-black sky with neutral cool silver moonlight and no purple cast, warm amber windows glowing, silver mist in the lowest streets. ",
    "day": "LIGHTING: a bright cool overcast morning-to-noon DAYLIGHT, soft pale sky with high thin cloud and the two moons faint as ghosts, natural colours, no glowing windows, lamps unlit, no mist except a little over the river, strong readable detail, busy with people. ",
    "dusk": "LIGHTING: golden-hour DUSK just after sunset, a glowing orange and rose sky fading to deep teal-blue at the top, the first lamps and windows being lit warm amber, the silver Tide mist just beginning to lift from the river into the low streets. ",
    "dawn": "LIGHTING: early DAWN before sunrise, a soft pink-peach and pale blue sky, cool blue shadows and a thin silver mist lying over the sea and the river, a few lamps still lit and fading, the city just waking, smoke starting from chimneys. ",
}


def base_prompt(t):
    return f"{CITY}{TIMES[t]}{WORLD}{ROADS}{LIFE}{AGE}"


NEG = M.NEG_FINE + ", pristine, brand new, clean, tidy, modern road, asphalt, tarmac, painted road lines, cars, power lines, identical copies, repeated buildings, empty streets, deserted"


def finish():
    try:
        M.studio.comfy("/free", {"unload_models": True, "free_memory": True})
    except Exception:  # noqa: BLE001
        pass
    if M.studio.STARTED:
        M.studio.STARTED.terminate()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    stage = sys.argv[1]
    M.studio.free_llm()
    if not M.studio.start_comfy():
        print("ComfyUI did not start"); return
    try:
        if stage == "base":
            (OUT / "prompts.json").write_text(json.dumps({t: base_prompt(t) for t in TIMES}, indent=1), encoding="utf-8")
            for s in range(3):
                dest = OUT / f"base_night_s{s}.png"
                if not dest.exists():
                    M.run_wf(M.txt_wf(f"{base_prompt('night')} {M.LOOK_FINE}", NEG, 250000 + s, ASPECT, 1.0), dest, f"v3 night s{s}")
        elif stage == "times":
            seed = sys.argv[2]
            src = OUT / f"base_night_s{seed}.png"
            from PIL import Image
            ref = M.upload(Image.open(src).convert("RGB"), f"mnemos_v3_night_s{seed}.png")
            for t in ("day", "dusk", "dawn"):
                dest = OUT / f"{t}_s{seed}.png"
                if dest.exists():
                    continue
                p = (f"Repaint this exact same city, the same island, the same layout, the same buildings in the same places, the same river and roads, "
                     f"only changing the time of day. {TIMES[t]} Keep the fine detailed pixel art style, the aged weathered stone, the people, carts, boats and animals. {M.LOOK_FINE}")
                M.run_wf(M.edit_wf(p, ref, 260000 + int(seed), ASPECT, 1.0, 1.0), dest, f"v3 {t} s{seed}")
    finally:
        finish()


if __name__ == "__main__":
    main()
