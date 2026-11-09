"""Veyra shots in the v3 style (owner, Nov 8, 2026: "what about the close ups and the other shots?"):
zoomed-out region, straight-down bird's-eye, and one close-up per district. Same world, same aged look, same signs of daily life.
python mapviews4.py [--time dusk] [--only id,id]  ->  out/mapviews/v4/<time>/<id>.png (+ sheet.png). Drafts only.
"""
import argparse, json, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import motion as M  # noqa: E402
import mapviews3 as V3  # noqa: E402

BASE = Path(HERE / "out" / "mapviews" / "v4")
STYLE = ("Veyra: an old walled city of round copper-domed halls, grey granite, pale limestone, blue-slate roofs and crooked half-timbered houses, "
         "on an invented cold northern coast with two pale ringed moons. ")
SHOTS = {
    "region_far": ("16:9 (Widescreen)", "A painted fantasy ATLAS MAP of a whole region seen from very high above at a steep angle, everything tiny: a pewter-silver river "
                   "rising in high boggy moors at the left, winding across the land through a long grey granite ridge, past tiny farms, hamlets as small clusters "
                   "of roofs with smoke, windmills, pine forests, heather and fields, thin old paved roads with specks of carts, down to a small walled island city "
                   "with a green-domed hill and a harbour on the right where the river meets the Grey Sea, tiny ships at sea, mist along the river. "
                   "The whole city is only a small part of the picture."),
    "city_topdown": ("1:1 (Square)", "STRAIGHT DOWN bird's-eye plan view of the whole island city: seven irregular terraces in rings around a round "
                     "copper-domed Archive, the river running from the top through a sluice gate down the middle to an estuary and the harbour, "
                     "fields and orchards around, rooftops of many different shapes and colours, tiny people, carts and boats."),
    "d01_quay": (None, "Close three-quarter view of Lamplighters' Quay: a stone harbour quay with a long row of twenty-two brass lamps, lamplighters on ladders, "
                 "fishermen unloading baskets, rope, barrels and nets, small sailing boats, gulls, a cat on a bollard, the sea beyond."),
    "d02_gallery": (None, "Close three-quarter view of the Long Gallery: a very long pale limestone columned hall with portraits glowing between the columns, "
                    "a paved walk with visitors, a few scholars, a cart delivering frames, cypress trees, a tea stall."),
    "d03_faces": (None, "Close three-quarter view of the Hall of Faces: a round domed hall whose outer wall is carved with hundreds of calm stone faces, "
                  "rubbed smooth by age, a small plaza with townsfolk, a well, children, pigeons, hung lanterns."),
    "d04_counting": (None, "Close three-quarter view of the Counting House: a tall narrow brown timber-and-granite tower of many windows, clerks on the steps, "
                     "ledgers stacked in a courtyard, brass scales over the door, a mule with sacks, a coin-changer's stall."),
    "d05_market": (None, "Close three-quarter view of the Clockwork Market: a tall bronze-faced clock tower beside crowded covered stalls with striped awnings, "
                   "gears and bells, shoppers, a baker, a fruit cart, hens and a dog, hanging lamps, steam from a pie oven."),
    "d06_bridge": (None, "Close three-quarter view of the Tongues Bridge: a long white arched stone bridge over the river with small shops and houses on it, "
                   "speech-scroll carvings on the parapet, a barge passing under, people crossing, a donkey, laundry on lines."),
    "d07_scriptorium": (None, "Close three-quarter view of the Scriptorium: a large stone writing house with a very tall slender GLASS SPIRE rising right in the middle of the picture, in a walled garden of dark "
                        "flowers, scribes at windows, a canal with a small boat of paper bundles, an old gardener, ink-stained steps."),
    "d08_stair": (None, "Close three-quarter view of the Tidal Stair: a great zigzag granite stair climbing the terraces with landings, lamps, little waterfalls "
                  "beside it, people carrying baskets up and down, a resting traveller, a porter with a handcart on the ramp."),
    "d09_mirror": (None, "Close three-quarter view of the Mirror Wards: a big paved courtyard whose floor is a wide still MIRROR-POOL clearly reflecting the lamps and houses around it, narrow crooked houses, "
                   "silvered glass windows, washing lines, children playing, a cat, a glassmaker's cart."),
    "d10_roads": (None, "Close three-quarter view of the Open Roads: the old north gate of the city with a milestone and signposts, a worn cobbled road "
                  "climbing over a heather ridge, a road-warden's hut, a laden ox-cart, a carriage, travellers with packs, goats."),
    "d11_amphitheatre": (None, "Close three-quarter view of the Amphitheatre of Echoes: a large old round stone amphitheatre with curved tiers, banners, braziers, "
                         "a crowd arriving, a performer on the arena floor, vendors of hot food at the gate, pigeons."),
    "d12_gate": (None, "Close three-quarter view of the Lethe Gate: a great stone sluice-works with twelve iron wheels where the river enters the city, thick "
                 "old towers, gatekeepers turning a wheel, water pouring over the weir, mist, barges waiting, a lamp on every tower."),
}


def sheet(d):
    from PIL import Image, ImageDraw
    ids = [k for k in SHOTS if (d / f"{k}.png").exists()]
    if not ids:
        return
    tw = 560
    ims = [Image.open(d / f"{k}.png").convert("RGB") for k in ids]
    ims = [i.resize((tw, int(i.height * tw / i.width)), Image.LANCZOS) for i in ims]
    cols = 3
    rh = max(i.height for i in ims) + 20
    s = Image.new("RGB", (cols * tw, ((len(ims) + 2) // 3) * rh), (12, 12, 20))
    dr = ImageDraw.Draw(s)
    for n, (k, im) in enumerate(zip(ids, ims)):
        x, y = (n % cols) * tw, (n // cols) * rh
        s.paste(im, (x, y + 20)); dr.text((x + 6, y + 4), k, fill=(240, 220, 160))
    s.save(d / "sheet.png")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--time", default="dusk")
    ap.add_argument("--only", default="")
    a = ap.parse_args()
    out = BASE / a.time
    out.mkdir(parents=True, exist_ok=True)
    only = [s for s in a.only.split(",") if s]
    todo = [k for k in SHOTS if (not only or k in only) and not (out / f"{k}.png").exists()]
    prompts = {k: f"{SHOTS[k][1]} {STYLE}{V3.TIMES[a.time]}{V3.ROADS}{V3.LIFE}{V3.AGE}" for k in SHOTS}
    prompts["region_far"] = f"{SHOTS['region_far'][1]} {STYLE}{V3.TIMES[a.time]}Old paved roads, weathered old stone. A few tiny carts, flocks and boats."
    (out / "prompts.json").write_text(json.dumps(prompts, indent=1), encoding="utf-8")
    if not todo:
        sheet(out); return
    M.studio.free_llm()
    if not M.studio.start_comfy():
        print("ComfyUI did not start"); return
    try:
        for k in todo:
            asp = SHOTS[k][0] or "4:3 (Standard)"
            M.run_wf(M.txt_wf(f"{prompts[k]} {M.LOOK_FINE}", V3.NEG, 270000 + list(SHOTS).index(k) * 13, asp, 1.0), out / f"{k}.png", f"v4 {a.time} {k}")
    finally:
        try:
            M.studio.comfy("/free", {"unload_models": True, "free_memory": True})
        except Exception:  # noqa: BLE001
            pass
        if M.studio.STARTED:
            M.studio.STARTED.terminate()
    sheet(out)


if __name__ == "__main__":
    main()
