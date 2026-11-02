"""Mnemos art director: paints NEW pictures with ComfyUI (Qwen-Image) for the shipped art set.

Does not touch LM Studio (no unloading). Reuses studio.py's ComfyUI start/free logic.
Usage (from the Mnemos folder):
  python tools/asset-studio/gen.py                 all jobs, SEEDS seeds each
  python tools/asset-studio/gen.py --only echo_    only jobs whose id starts with this
  python tools/asset-studio/gen.py --seeds 2
Pictures land in tools/asset-studio/out/new/<id>_s<seed>.png (skipped when they exist, so a stopped run resumes).
Then pick winners in tools/asset-studio/ship.py (SHIP table) and run `python tools/asset-studio/ship.py`.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.parse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import studio  # noqa: E402

NEW = studio.OUT / "new"

LOOK = ("16-bit pixel art game illustration, crisp square pixels, dark outlines, limited palette of deep navy night, warm amber lamp light, "
        "parchment cream, muted violet stone, river blue and soft white mist. Original fantasy setting: Veyra, a lamp-lit river city with white Tide mist.")
SCENE_TAIL = " Wide cinematic composition, atmospheric depth, no text, no letters, no people in the foreground."
BEAST_TAIL = (" A single creature, centred, full body, facing slightly left, on a completely plain flat very dark navy background, "
              "no ground, no floor, no shadow, no scenery, no text. Gentle, a little sad and curious, not frightening, never gory.")
NEG = ("text, letters, words, watermark, signature, logo, photo, photorealistic, 3d render, blurry, smooth gradients, anti-aliasing, "
       "gore, blood, skull, scary horror face, characters or art from existing games or films")

# (id, kind, description)  kind: scene (16:9), beast (1:1, plain background)
JOBS = []


def add(kind, prefix, rows):
    for i, d in rows:
        JOBS.append((f"{prefix}{i}", kind, d))


add("scene", "echo_", [
    ("gala", "the Networking Gala: a grand lamplit ballroom hall of Veyra with a long chandelier of amber lamps, round tables with parchment cards, tall arched windows onto the misty river, empty of people"),
    ("packing_bay", "the Packing Bay: a stone quay at night with stacked wooden crates, rope, barrels and hanging lanterns, a moored flat river barge, white mist over dark water"),
    ("speech_hall", "the Speech Hall: a hushed round lecture hall with tiered violet stone benches, a lectern with a single amber lamp on a small stage, a great arched window glowing blue"),
    ("crossroads", "the Crossroads: a lonely road junction at dusk with four stone signposts with blank arms, a lantern on a post, tall grass, distant lit city and hills, a moon behind clouds"),
    ("night_market", "the Night Market: a narrow cobbled lane of small stalls with striped awnings, paper lanterns and strings of amber lamps, shelves of jars and trinkets, wet cobbles reflecting light, no people"),
    ("tide_shore", "the Tide shore: a misty pebble shore of the river Lethe at night, low white mist rolling over grey water, a small old lamp on a mossy post, faint far lights of the city, quiet and eerie"),
])

add("beast", "forget_", [
    ("imagery", "a small soft grey mist creature shaped like a round floating blob with two big sleepy eyes and a wispy tail, drifting like a cloud of breath, fading at the edges"),
    ("linking", "a long soft grey mist creature shaped like a chain of three linked puffs, each with a small sleepy eye, the links loosely coming apart"),
    ("palace", "a soft grey mist creature shaped like a small crumbling archway or doorway made of fog, with two sleepy eyes in the keystone and wisps trailing from its pillars"),
    ("faces", "a soft grey mist creature that is a smooth blank oval mask-like head of fog with no features except two faint sad eyes, hovering with wisps of fog for shoulders"),
    ("numbers", "a soft grey mist creature shaped like a tall thin cloud-snake with a ring-like loop for a body, with two sleepy eyes, digits-like swirls only suggested, fading tail"),
    ("vocab", "a soft grey mist creature shaped like a wide, flat, fluffy cloud with small wing-like wisps like a moth, two sleepy eyes, soft and floaty"),
    ("structure", "a soft grey mist creature shaped like a pile of blocky fog cubes stacked unevenly and wobbling, with two sleepy eyes on the top cube, wisps leaking from the corners"),
    ("boss", "the Great Forgetting: a huge gentle ancient grey mist giant shaped like a towering hooded figure of fog with long sleeves trailing into mist, a pale lantern glow where the face would be, two calm sad eyes, majestic and sorrowful, not evil"),
])

D = [
    ("M1", "Lamplighters' Quay: a lamplit stone quay on the river at dusk, tall iron lamp posts being lit one by one, moored boats, a lamplighter's hut with a ladder, warm amber reflections on blue water"),
    ("M2", "the Long Gallery: an endless arched gallery corridor of pale stone with framed paintings and alcoves, a polished floor with a long runner, lamps in each alcove, perspective vanishing into the distance"),
    ("M3", "the Hall of Faces: a vaulted hall whose walls are lined with rows of carved stone portrait niches, each with a tiny lamp, a stone dais in the centre, soft violet light"),
    ("M4", "the Counting House: a high brick counting hall with tall ledger desks, brass abacus frames, ranks of small drawers, green-shaded lamps, a great wall of pigeonholes"),
    ("M5", "the Clockwork Market: a busy market square with a huge brass clock tower, hanging gears and cogs, stalls with clocks and music boxes, copper and amber light, steam"),
    ("M6", "the Tongues Bridge: a wide stone bridge over the river covered in carved inscriptions in many scripts, arches, lanterns, flags of different colours, mist below"),
    ("M7", "the Scriptorium: a tall round library under a copper dome, towers of books and scrolls, reading desks with candles, a spiral stair, dust in lamp light"),
    ("M8", "the Tidal Stair: a great wet stone staircase descending into the river, steps disappearing into rising white mist, lamps on pillars at each landing, waves lapping"),
    ("M9", "the Mirror Wards: a quiet courtyard of tall standing mirrors in carved stone frames reflecting lamps and mist, a tiled floor, a stone fountain, cool violet and silver light"),
    ("M10", "the Open Roads: a long road winding over green hills at dawn toward distant mountains, waystation with a hanging lantern, stone mile markers, wide sky"),
    ("M11", "the Amphitheatre of Echoes: a great curved stone amphitheatre at night with tiers of seats, a central stage lit by lamps, high walls that shimmer with sound like faint rings of light"),
    ("M12", "the Lethe Gate: a colossal ancient stone gate in the river wall with huge doors partly open onto white mist, thirteen lamps in a row above it, black water, dramatic and quiet"),
]
add("scene", "district_", D)

add("scene", "event_", [
    ("undercroft_entrance", "the Undercroft entrance: a heavy iron-bound stone trapdoor and a spiral of worn steps descending into darkness beneath a vaulted archive, a single amber lantern on the first step, cold blue glow from below"),
    ("tide_rising", "the Tide rising: a wide view of white mist as a tall soft wall climbing over the city rooftops at night, small lit windows, a lamp-lit bridge in front, ominous but beautiful"),
    ("lethe_gate_vigil", "the Lethe Gate at the Long Vigil: the great stone gate with a row of thirteen glowing lamps held up in the night, the white Tide pressing but held back by their light"),
    ("year_of_keeping", "the Year of Keeping: the whole city of Veyra seen from a hill at night with a lit lamp in every window and street, golden constellations of light over the river, peaceful and triumphant"),
    ("gate_trial", "a trial chamber before a Gate: a round stone hall with a single lectern holding a glowing open book, thirteen empty lamp niches around the wall, violet stone, solemn"),
    ("archive_lamp", "the Archive at the heart of Veyra: a quiet underground library hall under a copper dome with a great lantern hanging in the centre lighting the stacks of books, warm and safe"),
    ("vigil_dawn", "dawn after the Night of No Moon: the river of Veyra at sunrise, white mist thinning and glowing pink and gold, all the city lamps still lit, a lone boat on calm water, hopeful"),
    ("palace_corridor", "a memory palace corridor: a long dreamy hall with doors on both sides each marked by a different small glowing symbol, a glowing path on the floor, violet and amber, mysterious and welcoming"),
])


def prompt_for(kind, desc):
    if kind == "scene":
        return f"{LOOK} {desc.capitalize() if not desc[0].isupper() else desc}.{SCENE_TAIL}"
    return f"{LOOK} {desc}.{BEAST_TAIL}"


STEPS = 24
MODEL = "qwen_image_2.1_bf16.safetensors"


def settings(kind):
    return {"aspect_ratio": "16:9 (Widescreen)" if kind == "scene" else "1:1 (Square)", "megapixels": 0.6 if kind == "scene" else 0.45, "steps": STEPS}


def write_jobs(seeds=2):
    """Everything needed to re-render the whole new set with another model: tools/asset-studio/art-jobs.json."""
    jobs = []
    for n, (jid, kind, desc) in enumerate(JOBS):
        jobs.append({"id": jid, "kind": kind, "prompt": prompt_for(kind, desc), "negative_prompt": NEG,
                     "seeds": [91000 + s * 1000 + n for s in range(seeds)], **settings(kind)})
    doc = {"note": "Re-render with another model by swapping only the model file names in the ComfyUI workflow "
                   "(comfy_qwen_workflow.json: UNETLoader, CLIPLoader, VAELoader), then run gen.py. Output file for seed index s is out/new/<id>_s<s>.png.",
           "workflow": str(studio.STUDIO / "comfy_qwen_workflow.json"), "model_used": MODEL,
           "model_licence": "Qwen Research License (non-commercial, research or evaluation only). LICENCE HOLD, see docs/ART.md",
           "older_drafts": "The ~70 shipped drafts from studio.py (cutscene, portraits, relics, inventory, lore_docs, side_quest, undercroft, furniture) "
                           "were painted by studio.images(); their prompts, names and looks are in out/<category>/plan.json, seeds are 7000 + index within "
                           "the plan, 24 steps, 0.6 megapixels (aspect 1:1, or 16:9 for cutscene). Re-render with: python tools/asset-studio/studio.py --stages images "
                           "after moving the old .png files away.",
           "jobs": jobs}
    (Path(__file__).resolve().parent / "art-jobs.json").write_text(json.dumps(doc, indent=1, ensure_ascii=False), encoding="utf-8")


def run(only, seeds):
    wf0 = json.loads((studio.STUDIO / "comfy_qwen_workflow.json").read_text(encoding="utf-8"))
    NEW.mkdir(parents=True, exist_ok=True)
    todo = [j for j in JOBS if not only or any(j[0].startswith(o) for o in only.split(","))]
    for s in range(seeds):
        for n, (jid, kind, desc) in enumerate(todo):
            dest = NEW / f"{jid}_s{s}.png"
            if dest.exists():
                continue
            wf = json.loads(json.dumps(wf0))
            seed = 91000 + s * 1000 + n
            for node in wf.values():
                ct, inp = node["class_type"], node["inputs"]
                if ct.startswith("TextEncodeQwenImage"):
                    inp["prompt"], inp["negative_prompt"] = prompt_for(kind, desc), NEG
                elif ct == "KSampler":
                    inp["seed"], inp["steps"] = seed, STEPS
                elif ct == "ResolutionSelector":
                    inp["aspect_ratio"] = "16:9 (Widescreen)" if kind == "scene" else "1:1 (Square)"
                    inp["megapixels"] = 0.6 if kind == "scene" else 0.45
                elif ct.startswith("SaveImage"):
                    inp["filename_prefix"] = "mnemos_art"
            t0 = time.time()
            try:
                pid = studio.comfy("/prompt", {"prompt": wf, "client_id": "mnemos-art"})["prompt_id"]
                hist = {}
                for _ in range(1800):
                    time.sleep(1)
                    hist = studio.comfy(f"/history/{pid}")
                    if pid in hist:
                        break
                got = False
                for out in hist[pid].get("outputs", {}).values():
                    for im in out.get("images", []):
                        q = urllib.parse.urlencode({"filename": im["filename"], "subfolder": im.get("subfolder", ""), "type": im.get("type", "output")})
                        dest.write_bytes(studio.comfy(f"/view?{q}", timeout=120))
                        got = True
                studio.log("art", jid, f"s{s}", "ok" if got else "NO OUTPUT", f"{time.time() - t0:.0f}s")
            except Exception as e:  # noqa: BLE001
                studio.log("art failed", jid, e)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only")
    ap.add_argument("--seeds", type=int, default=2)
    a = ap.parse_args()
    write_jobs(a.seeds)
    if not studio.start_comfy():
        studio.log("ComfyUI did not start")
        return
    try:
        run(a.only, a.seeds)
    finally:
        try:
            studio.comfy("/free", {"unload_models": True, "free_memory": True})
        except Exception:  # noqa: BLE001
            pass
        if studio.STARTED:
            studio.STARTED.terminate()
            studio.log("ComfyUI server stopped")


if __name__ == "__main__":
    main()
