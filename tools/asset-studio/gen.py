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
OBJECT_TAIL = (" A single small object, centred, seen from slightly above, on a completely plain flat very dark navy background, "
               "no table, no shadow, no scenery, no hands, no text, no letters or numbers written on it.")
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


# v0.11 District Trials and vaults: one scene per trial, one object per prize (traced into 24x24 item icons).
add("scene", "trial_", [
    ("catacombs", "the Catacombs of the Unnamed: a low vaulted crypt lined with pale marble statues of ordinary townsfolk in niches, their faces softly worn, smooth blank plaques beneath each, an open logbook on a stone lectern lit by one amber lamp, white mist on the floor"),
    ("scriptorium", "the Sunken Scriptorium: the lower floor of a round library half flooded with still grey water, reading desks and shelves standing in the water, scrolls floating, a copper dome above, warm candles on the high shelves"),
    ("salt_vault", "the Broken Vault of the Salt Guild: a huge round iron vault door set in a brick cellar wall, covered in a grid of small brass dials, salt crystals on the floor, a green-shaded lamp hanging above, an open ledger on a crate"),
    ("bridge", "the Bridge of Tongues: a long stone bridge over a deep misty chasm, gentle stone gargoyles with friendly faces perched on the railings, carved patterns on the stones, lanterns, moonlight"),
    ("gears", "the Clockwork Market at a standstill: a market square under a stopped brass clock tower, brass gears and cogs of many sizes laid out on fifteen small stalls with striped awnings, amber lamps, light steam"),
    ("vault", "a sealed vault in the river wall of Veyra: a small round stone door with a carved lamp symbol and an empty stone niche for a tablet beside it, moss, a lamp on a hook, still dark water below"),
])
add("object", "prize_", [
    ("ledger_fragment", "a torn page of an old leather logbook with a brass corner and a ribbon bookmark"),
    ("dry_scroll", "a rolled parchment scroll tied with a blue ribbon and sealed with a small amber wax drop"),
    ("brass_dial", "a round brass combination dial with a knurled edge and a small pointer"),
    ("tongue_stone", "a small smooth grey river stone carved with a tiny friendly gargoyle face"),
    ("mainspring", "a coiled brass clock mainspring inside an open round brass barrel"),
    ("vault_hook", "an iron lamp hook with a small glowing amber lamp hanging from it"),
    ("vault_tablet", "a small square clay tablet with a carved lamp symbol in the centre"),
    ("vault_key", "an ornate bronze key with a round bow shaped like a lamp"),
])

# Face samples for review (Nov 2, 2026): the same 8 people as scripts/face-samples.mjs, painted by the image model. Not shipped.
FACE_TAIL = (" Head and shoulders portrait of one ordinary adult, facing the viewer, calm neutral expression, centred, "
             "simple plain muted background, clear readable facial features, no text, no frame.")
add("face", "face_", [
    ("101", "a young woman with tan skin wearing a blue headscarf, almond brown eyes, thin brows, a small button nose, full lips, a small mole on her jaw"),
    ("2024", "an older man with very pale skin, bald on top with a ring of blond hair at the sides, monolid dark brown eyes, a broad nose, a blond goatee, deep lines on his face, a gentle smile"),
    ("377", "a middle-aged woman with tan skin wearing a rust-red headscarf, large brown eyes, angled brows, a strong roman nose, thin lips"),
    ("9001", "a middle-aged man with light golden skin, short grey hair, round dark brown eyes, angled brows, a small button nose, freckles"),
    ("4242", "a young person with pale skin, a dark brown ponytail, upturned grey eyes, straight brows, a wide nose, a small mouth, a long face"),
    ("77", "an older man with tan skin, salt-and-pepper hair in a side part, almond brown eyes, a wide nose, a wide mouth, deeply lined face"),
    ("31337", "a young man with warm brown skin, a purple knit cap, round dark brown eyes, a short black beard, a small upturned nose"),
    ("555", "a young woman with fair skin, a light brown ponytail, monolid brown eyes, arched brows, a button nose, thin lips, freckles and a small mole on her temple"),
])


# ---- Added Nov 2, 2026 for v0.12 and v0.13 (The Living World, Cabinet of Voices, Wren). APPEND ONLY: seeds depend on position in JOBS.
# Run only these with: python tools/asset-studio/gen.py --only vigil_,bramble_,mirror_,voice_,pedestal_,audit_,wrenmem_,longecho_
SPIRIT_TAIL = (" A single small friendly lamp-spirit, centred, front view, full body, on a completely plain flat very dark navy background, "
               "no ground, no floor, no shadow, no scenery, no text, no letters, no numbers. Warm, kind and curious, never frightening.")
PROP_TAIL = (" A single stone pedestal, centred, seen straight from the front, whole object in view, on a completely plain flat very dark navy background, "
             "no floor, no shadow, no scenery, no text, no letters or carvings of words. The top is empty and flat.")
OVERLAY_TAIL = (" A single plant piece, centred, on a completely plain flat very dark navy background, no ground, no scenery, no creatures, "
                "no text. Thorny but gentle and a little sad, never frightening, never gory.")
add("scene", "vigil_", [
    ("battlements", "the Long Vigil on the Quay battlements at dusk: a wide stone battlement wall above the river of Veyra with a long row of lit amber lanterns set along the parapet, "
                    "and soft faceless mist phantoms, pale grey shapes of fog like hooded figures with no faces, drifting gently toward the lanterns and fading in their light, "
                    "violet and blue dusk sky, white mist over the water, gentle and sad, not scary"),
])
add("overlay", "bramble_", [
    ("clump", "a small clump of thorny silver-green Lethe bramble vines with pale grey-blue leaves and sharp little thorns, tangled but tidy"),
    ("vine", "one long thorny silver-green Lethe bramble vine curling across the whole picture in a wide S shape, with small pale leaves and sharp little thorns"),
    ("bud", "a single curved silver-green bramble stem with one big sharp thorn and a small pale glowing bud at its tip, soft white glow"),
    ("burning", "silver-green thorny bramble vines dissolving into warm golden light, the thorns turning into floating glowing sparks and petals, fading upward"),
])
add("scene", "mirror_", [
    ("room", "the Phantom Limb mirror room: a quiet round stone room with seven tall old mirrors in carved dark wooden frames standing in a ring, each mirror holding one remembered object "
             "in its glass (a brass key, a teacup, a small clock, a folded paper boat, a candle, a feather, a pair of spectacles), cool violet and silver light, dust in the air, still and calm, empty of people"),
])
add("spirit", "voice_", [
    ("vision", "Vision, a lamp-spirit whose flame is shaped like an open eye, with a small round glass lamp body and gentle blue-gold light, tiny feet"),
    ("thread", "Thread, a lamp-spirit holding a spool of glowing golden thread with a loose strand floating up and linking in a loop, a warm amber glow, tiny feet"),
    ("place", "Place, a lamp-spirit shaped like a tiny house lantern with a pitched roof, a little door and glowing windows, warm green and amber light, tiny feet"),
    ("face", "Face, a lamp-spirit with a masked mirror flame: a smooth blank oval mirror mask in front of its flame, soft violet and silver light, tiny feet"),
    ("count", "Count, a lamp-spirit shaped like an abacus lantern with rows of glowing round beads on rods inside a brass frame, warm copper and orange light, tiny feet"),
    ("tongue", "Tongue, a lamp-spirit trailing a flowing ribbon of invented rune-like swirls and curls that are not real letters, teal and soft white light, tiny feet"),
    ("frame", "Frame, a lamp-spirit whose body is a small lantern shaped like a bookcase with three glowing shelves of blank books, deep red and gold light, tiny feet"),
])
add("prop", "pedestal_", [
    ("lit", "a lit round stone pedestal of grey and violet stone with a warm amber glow around its flat empty top where a relic would rest, small glowing lamp rings on its sides, warm and welcoming"),
    ("dim", "a dim faded round stone pedestal of cool grey-blue stone with a flat empty top, its lamp rings dark and dusty, a faint cold pale glow, quiet and forgotten but not scary"),
])
# Planned pictures found by scanning docs/ROADMAP.md, RPG_DEPTH.md and CHAMPIONS.md that were not yet made:
add("scene", "audit_", [
    ("route", "Wren's Audit: a long memory palace route seen as a lamplit hall of Veyra with small round glowing stops on the floor, each stop beside a different small object on a plinth, "
              "a tidy notebook and a pencil on a stone ledge in the foreground, violet and amber light, calm, empty of people"),
])
add("scene", "wrenmem_", [
    ("nook", "Wren's reading nook: a cosy small room at the top of the Archive with a round window onto the lamplit river of Veyra, a worn armchair, stacks of notecards, a steaming teacup and a hanging lamp, "
             "a corkboard with blank cards pinned to it, warm amber light, quiet and safe, empty of people"),
])
add("scene", "longecho_", [
    ("vault", "a deep old long-echo vault in the river wall of Veyra: a tall round stone door worn smooth by many years, ringed with moss and tiny lamp symbols, a single pale lantern, "
              "a stone niche for an old tablet, dark still water and soft silver mist below"),
])


# ---- Added Nov 2, 2026 (owner-approved story and trial additions, docs/drafts/additions). APPEND ONLY.
# Run with: python tools/asset-studio/gen.py --only story_,trialx_,prizex_   (after_faces2.py does this after after_faces.py finishes)
CHARACTER_TAIL = (" Head and shoulders portrait of one character, facing slightly toward the viewer, centred, on a completely plain flat very dark navy background, "
                  "no scenery, no frame, no text, no letters. Expressive and readable at small size.")
add("character", "story_", [
    ("ambrose", "Ambrose Tallow, called the Winder, the last Warden of the Hours: a thin, tidy, very old man in an old dark Warden's coat with a worn-smooth brass badge, a pocket watch on a long chain, "
                "kind tired lonely eyes, faintly faded and pale like a figure held in one evening for three hundred years, gentle and sad, not scary, not evil"),
    ("ottoline", "Ottoline Gilt, nicknamed Lantern, a nineteen-year-old rich young woman: tall and immaculate, chin lifted with a smug little half-smile, finely dressed in cream and deep gold silk with a high collar, "
                 "a row of small coloured ribbons in her neatly pinned hair, a tiny gold lamp brooch"),
    ("edrin", "Edrin Halloway, an older widowed lamplighter: a quiet, weathered, kind man with grey stubble and gentle tired eyes, a worn blue coat with brass buttons and a knitted scarf, "
              "the tip of a lamplighter's long pole and a small flame visible by his shoulder"),
])
add("scene", "story_", [
    ("green_door", "Quay Row at dusk: a narrow old stone terrace house beside the misty river with a freshly painted bright green wooden door with a brass lamp-shaped knocker, a few flecks of old flaking blue paint on the step, "
                   "a lit iron street lamp beside it, cobbles and a low river wall, warm window light, hopeful and quiet, no readable numbers or writing"),
    ("mother_portrait", "inside the Archive: a simple painted portrait on a wooden easel filling the centre of the picture, a woman with a small scar through her left eyebrow, a brass key pinned in her hair, "
                        "a yellow scarf and a warm laughing smile, painted softly and a little roughly by an amateur hand, brushes and small paint pots on a stool beside it, one amber lamp, warm and tender"),
    ("lamp_cup", "the Lamp Cup: a small old brass lamp on a stand on a velvet cushion on a stone plinth in a lamplit hall, a worn brass founder's plate on the stand polished completely smooth and blank with no writing, "
                 "tall arched windows, a few small ribbons draped nearby, warm and proud and slightly sad"),
])
add("object", "story_", [
    ("winding_mark", "a worn round iron disc with a ring carved into it and a single clock-like hand inside the ring pointing up, like a maker's mark worn into the base of an old lamp, rust and a little moss"),
])
add("scene", "trialx_", [
    ("year_hall", "the Hall of Years: a very long vaulted stone hall of Veyra with rows of tall pillars each carved with a different small picture symbol, a glowing line of light inlaid along the floor like a timeline "
                  "with small lamps set at seven spots along it, seven lit alcoves each holding a stone tablet, a great round window of blue glass at the far end, calm and solemn, no numbers, no writing"),
    ("reckoning", "the Counting House Reckoning: a high brick counting hall at night with a long polished table of brass calculating frames and abacuses, bundles of wooden tally sticks in boxes, "
                  "a wall of small drawers, green-shaded lamps in a row, a stone floor in a neat grid pattern, clean and quick and calm, no numbers, no writing"),
])
add("object", "prizex_", [
    ("year_tablet", "a small square stone tablet carved with a row of seven small round dots along the top and a simple sun symbol below, edges worn smooth"),
    ("tally_stick", "a wooden tally stick with a row of small notches along its edge, split lengthwise, tied with a blue ribbon"),
])


def prompt_for(kind, desc):
    if kind == "scene":
        return f"{LOOK} {desc.capitalize() if not desc[0].isupper() else desc}.{SCENE_TAIL}"
    if kind == "face":
        return f"{LOOK} {desc}.{FACE_TAIL}"
    if kind == "object":
        return f"{LOOK} {desc}.{OBJECT_TAIL}"
    if kind == "character":
        return f"{LOOK} {desc}.{CHARACTER_TAIL}"
    if kind == "spirit":
        return f"{LOOK} {desc}.{SPIRIT_TAIL}"
    if kind == "prop":
        return f"{LOOK} {desc}.{PROP_TAIL}"
    if kind == "overlay":
        return f"{LOOK} {desc}.{OVERLAY_TAIL}"
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
        for jid, kind, desc in todo:
            n = next(i for i, j in enumerate(JOBS) if j[0] == jid)  # same seed as recorded in art-jobs.json
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
