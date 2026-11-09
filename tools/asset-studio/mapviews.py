"""Veyra map look-dev (owner, Nov 8, 2026): PERMUTATIONS of setting (Earth / not Earth) x architecture, every one OLD, weathered and
carrying the lore in its stones. Text to image only, fine pixel style, <= 1.0 MP. Drafts only: out/mapviews/<id>.png + sheet.
Run: python tools/asset-studio/mapviews.py [--only id,id] [--sheet]   (skips files that exist; waits for the shared ComfyUI)
"""
import argparse, json, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import motion as M  # noqa: E402  (txt_wf, run_wf, studio, LOOK_FINE, NEG_FINE)

OUT = HERE / "out" / "mapviews"

# ---- the view (same for every permutation so only setting and architecture change)
VIEW = ("Three-quarter bird's-eye view of the whole walled city climbing a hillside in terraces from a harbour at the bottom to a great domed "
        "round library hall at the very top, a river tumbling down through the middle in small waterfalls under bridges, a tall spire, "
        "a large old amphitheatre, a long columned hall, a clock tower beside market stalls, a long arched bridge, a zigzag great stair.")

# ---- AGE AND LORE: appended to every picture. The city is nine hundred years old and has been forgetting for three hundred.
AGE = ("EVERYTHING IS VERY OLD AND SHOWS IT, nothing is new or clean: roofs sag and are patched with mismatched tiles, walls lean and are "
       "cracked, stone is stained dark by centuries of rain, thick moss, lichen and ivy swallow the lower walls, stairs and thresholds are "
       "worn into hollows by countless feet, whole houses are shuttered and silent, some towers are half-ruined and propped with timber, "
       "newer repairs in different stone sit beside much older masonry from many ages, so the city looks built in layers over centuries. "
       "THE LORE IS VISIBLE IN THE PICTURE: every building has a small brass lamp in a stone niche at its corner and door, but only a few "
       "of the hundreds of lamps are lit and most stand dark and green with age, as the city is slowly relighting its lamps one by one; "
       "pale horizontal tide-lines are scored across every wall at the height the silver evening mist reaches, and a thin silver mist "
       "lies in the lowest streets; twelve inlaid brass lines run through the cobbles from the harbour to the twelve districts; carved "
       "faces and names on old walls are rubbed smooth and half gone; a faded ring-and-single-hand mark is cut into old iron lamp posts; "
       "the old library at the top has a great round empty lamp-bowl on its roof; a few quiet figures with lanterns walk the stairs.")


def S(place, arch):
    return f"{VIEW} SETTING: {place} ARCHITECTURE: {arch} {AGE}"


# ---- settings: Earth (real-feeling places) and not Earth
EARTH_ATLANTIC = ("This could be a real place on Earth: a cold wet Atlantic coast like Galicia, Brittany or the west of Scotland, heather and gorse "
                  "moors, dark pine woods, granite cliffs, a grey sea under a heavy slate sky at dusk.")
EARTH_ADRIATIC = ("This could be a real place on Earth: a steep limestone bay on the Adriatic and Aegean coast, karst mountains, olive and cypress "
                  "terraces, a still turquoise-dark sea at dusk, cool sea mist rising from the river.")
EARTH_TROPICAL = ("This could be a real place on Earth: a humid tropical coast like Kerala, Sri Lanka or the Malabar coast, palms and banyan trees "
                  "growing out of the walls, monsoon clouds, warm dark sea at dusk, river mist in the heat.")
WORLD_MOONS = ("This is NOT Earth: an invented world, a cold northern coast with two pale moons and a faint ring of light across a deep blue "
               "night sky, grey sea, strange pale heather and tall black pines.")
WORLD_BASALT = ("This is NOT Earth: an invented world where a pewter-silver river glows faintly, black basalt columns and cliffs everywhere, "
                "bone-white shell-stone, a huge ringed planet low in the sky over a dark sea.")
WORLD_RUINS = ("This is NOT Earth: an invented world where the city is built on top of the enormous broken ruins of an older vanished "
               "civilisation, giant fallen carved stones and colossal half-buried steps and arches forming the terraces, small stars and a "
               "huge pale moon over a grey sea.")

# ---- architecture
ARCH_GRANITE = ("Veyra style: massive grey granite terraces and buttressed walls, steep blue-slate roofs, pale limestone Warden halls with columns, "
                "green verdigris copper domes streaked with age, narrow arched windows, a brass lamp niche at every corner.")
ARCH_ADRIATIC = ("Mediterranean style: pale limestone houses with faded terracotta roofs, round arches, loggias, bell towers, shuttered windows, "
                 "stone domes and cloisters, terraced walls with cypress.")
ARCH_TROPICAL = ("Colonial and Kerala style: laterite red stone and whitewashed plaster, deep sloping tiled roofs with wide eaves, teak balconies and "
                 "carved timber pillars, a stone fort and a banyan-rooted temple tower.")
ARCH_TIMBER = ("Northern harbour style: tall narrow stone houses with stepped gables and half-timbered upper floors leaning together, steep slate "
               "roofs, crane-beams and hoists, a stone guildhall, heavy oak doors.")
ARCH_BYZ = ("Round-hall style: a city of domes and drums, tiers of round stone halls with copper and lead domes, ring colonnades, "
            "pale limestone and dark basalt in bands, circular courtyards, curved stairs.")
ARCH_BASALT = ("Basalt style: houses carved from and stacked like black hexagonal columns, shell-white lintels and domes, curved stone walls "
               "with lamp-niches, copper-green roofs.")
ARCH_COLOSSUS = ("Layered style: tiny later houses of grey stone and slate built inside, between and on top of colossal older carved arches, "
                 "giant pillars and stairs, small copper domes perched on ancient blocks.")

PERMS = {
    # Earth
    "e1_atlantic_granite": S(EARTH_ATLANTIC, ARCH_GRANITE),
    "e2_adriatic_limestone": S(EARTH_ADRIATIC, ARCH_ADRIATIC),
    "e3_tropical_kerala": S(EARTH_TROPICAL, ARCH_TROPICAL),
    # not Earth
    "n1_two_moons_granite": S(WORLD_MOONS, ARCH_GRANITE),
    "n2_basalt_ringed_planet": S(WORLD_BASALT, ARCH_BASALT),
    "n3_colossus_ruins": S(WORLD_RUINS, ARCH_COLOSSUS),
    # architecture permutations on the favoured setting (cold northern coast, lore-faithful)
    "a1_northern_timber_harbour": S(EARTH_ATLANTIC, ARCH_TIMBER),
    "a2_round_halls_domes": S(WORLD_MOONS, ARCH_BYZ),
    "a3_two_moons_timber": S(WORLD_MOONS, ARCH_TIMBER),
}
LABEL = {
    "e1_atlantic_granite": "EARTH: Atlantic coast, granite", "e2_adriatic_limestone": "EARTH: Adriatic, limestone",
    "e3_tropical_kerala": "EARTH: tropical Kerala", "n1_two_moons_granite": "NOT EARTH: two moons, granite",
    "n2_basalt_ringed_planet": "NOT EARTH: basalt, ringed planet", "n3_colossus_ruins": "NOT EARTH: built on colossal ruins",
    "a1_northern_timber_harbour": "ARCH: northern timber harbour", "a2_round_halls_domes": "ARCH: round halls and domes",
    "a3_two_moons_timber": "ARCH: two moons, timber",
}

# ---- v2 (Nov 8, 2026, after the owner picked "proceed"): brighter, whole hill in frame, readable tide-lines, twelve landmarks
VIEW2 = ("The WHOLE walled city seen in full from a high three-quarter bird's-eye view, the entire hill and the sea around it inside the frame "
         "with a margin of dark water and sky on every side, nothing cropped. Seven terraces rise from a harbour quay at the bottom to a round "
         "green-copper-domed Archive library at the top. A river tumbles down the middle in small lit waterfalls under stone bridges. "
         "Twelve clearly separate districts, each with its own landmark: harbour quay with a row of lamps and boats; a very long columned gallery; "
         "a round hall whose wall is carved with stone faces; a tall narrow timber counting house; a clock tower beside market stalls; a long white "
         "arched bridge; a tall slender glass spire; a great zigzag stair; a courtyard of mirror pools; a north gate with a milestone and road; "
         "a big old amphitheatre; a great sluice gate with twelve iron wheels. ")
LIGHT = ("LIGHTING: a clear moonlit night, bright cool moonlight washes the whole city so every roof, wall and street is easy to read, a luminous "
         "deep blue sky, pale silver light on the stone, warm amber windows glowing, not dark and not murky. ")
TIDE = ("A broad pale band of bleached, salt-stained stone runs along every wall at one height, the line the silver Tide mist reaches each evening. ")


def S2(place, arch):
    return f"{VIEW2}{LIGHT}SETTING: {place} ARCHITECTURE: {arch} {TIDE}{AGE}"


V2 = {
    "v2_granite_s0": S2(WORLD_MOONS, ARCH_GRANITE), "v2_granite_s1": S2(WORLD_MOONS, ARCH_GRANITE),
    "v2_round_s0": S2(WORLD_MOONS, ARCH_BYZ + " " + ARCH_GRANITE), "v2_round_s1": S2(WORLD_MOONS, ARCH_BYZ + " " + ARCH_GRANITE),
}
for _k in V2:
    LABEL[_k] = "V2 " + _k[3:]


def sheet():
    from PIL import Image, ImageDraw
    ids = [k for k in PERMS if (OUT / f"{k}.png").exists()]
    if not ids:
        return
    tw = 600
    ims = [Image.open(OUT / f"{k}.png").convert("RGB") for k in ids]
    ims = [im.resize((tw, int(im.height * tw / im.width)), Image.LANCZOS) for im in ims]
    cols = 3
    rows = (len(ims) + cols - 1) // cols
    rh = max(im.height for im in ims) + 24
    sh = Image.new("RGB", (cols * tw, rows * rh), (12, 12, 20))
    d = ImageDraw.Draw(sh)
    for i, (k, im) in enumerate(zip(ids, ims)):
        x, y = (i % cols) * tw, (i // cols) * rh
        sh.paste(im, (x, y + 24))
        d.text((x + 8, y + 6), LABEL[k], fill=(240, 220, 160))
    sh.save(OUT / ("sheet_v2.png" if "v2_granite_s0" in PERMS else "sheet.png"))
    print("sheet:", OUT / ("sheet_v2.png" if "v2_granite_s0" in PERMS else "sheet.png"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="")
    ap.add_argument("--mp", type=float, default=0.9)
    ap.add_argument("--sheet", action="store_true")
    ap.add_argument("--set", default="v1")
    a = ap.parse_args()
    P = V2 if a.set == "v2" else PERMS
    globals()["PERMS"] = P
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / ("prompts_v2.json" if a.set == "v2" else "prompts.json")).write_text(json.dumps(P, indent=1), encoding="utf-8")
    if a.sheet:
        sheet(); return
    only = [s for s in a.only.split(",") if s]
    todo = [k for k in PERMS if (not only or k in only) and not (OUT / f"{k}.png").exists()]
    if not todo:
        print("nothing to paint"); sheet(); return
    M.studio.free_llm()
    if not M.studio.start_comfy():
        print("ComfyUI did not start"); return
    try:
        for k in todo:
            seed = 240000 + list(PERMS).index(k) * 7 + (1000 if k.endswith("s1") else 0)
            wf = M.txt_wf(f"{PERMS[k]} {M.LOOK_FINE}", M.NEG_FINE + ", pristine, brand new, clean, tidy, freshly painted", seed, "3:4 (Portrait Standard)", min(a.mp, 1.0))
            M.run_wf(wf, OUT / f"{k}.png", f"mapview {k}")
    finally:
        try:
            M.studio.comfy("/free", {"unload_models": True, "free_memory": True})
        except Exception:  # noqa: BLE001
            pass
        if M.studio.STARTED:
            M.studio.STARTED.terminate()
    sheet()


if __name__ == "__main__":
    main()
