"""Mnemos ship pipeline: turns chosen drafts into small pixel-art PNGs the game can load.

  python tools/asset-studio/ship.py            ship everything in SHIP that exists, write src/data/art.js
  python tools/asset-studio/ship.py --sheet    also write out/shipped-sheet.png (contact sheet)

For each picture: remove the plain background (sprites), box-downscale to a small pixel grid, quantise to a
small palette with no dithering, save an optimised palette PNG (WebP lossless if it is clearly smaller) into
src/assets/art/<category>/<id>.<ext>, then regenerate the manifest src/data/art.js.
Budget: the whole art folder stays under BUDGET_KB.

To add art: paint it (gen.py or studio.py), add one row to SHIP below (id, source, category, alt text), run this.
Source paths are relative to tools/asset-studio/out/. Drafts in out/ are never shipped directly; only this script ships.
"""
from __future__ import annotations

import argparse
import io
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
OUT = HERE / "out"
ROOT = HERE.parents[1]
ART_DIR = ROOT / "src" / "assets" / "art"
MANIFEST = ROOT / "src" / "data" / "art.js"
BUDGET_KB = 5120  # owner decision, Nov 2 2026: 5 MB, mostly for image-model faces

# category: (width, height, colours, kind)   kind: scene = opaque picture, sprite = background removed
SPEC = {
    "cutscene": (320, 180, 32, "scene"),
    "backdrop": (320, 180, 32, "scene"),
    "district": (320, 180, 32, "scene"),
    "event": (320, 180, 32, "scene"),
    "trial": (320, 180, 32, "scene"),
    "portrait": (96, 96, 24, "sprite"),
    "enemy": (96, 96, 20, "sprite"),
    "boss": (128, 128, 24, "sprite"),
    "crypt": (64, 64, 24, "sprite"),
    "relic": (48, 48, 24, "sprite"),
    "inventory": (48, 48, 24, "sprite"),
    "lore": (48, 48, 24, "sprite"),
    "quest": (48, 48, 24, "sprite"),
    "furniture": (48, 48, 24, "sprite"),
    "overlay": (64, 64, 24, "sprite"),    # Lethe bramble pieces for the district map (v0.12)
    "voice": (64, 64, 24, "sprite"),      # Cabinet of Voices lamp-spirits (v0.12)
    "pedestal": (48, 64, 24, "sprite"),   # relic pedestals for the walkable palace room
    "card": (128, 96, 24, "scene"),       # 1.2 drills: surprising-fact and joke pictures (testart.py)
    "vignette": (240, 135, 32, "scene"),  # 1.2 drills: one per real-life scene
    "symbol": (48, 48, 16, "sprite"),     # 1.2 drills: the formula symbol alphabet
}


def rows(cat, folder, prefix, items):
    return [(f"{prefix}_{i}", f"{folder}/{i}.png", cat, alt) for i, alt in items]


SHIP = []
SHIP += rows("cutscene", "cutscene", "cutscene", [
    ("hask_ammerhold_pass", "A lone road-warden with a lantern walks a high mountain pass above clouds, the lit city far below."),
    ("lamp_of_ysole_relit", "An ancient oil lamp burning with a blue flame in a dark vault, sparks rising."),
    ("long_vigil_street_lamps", "A long street of glowing lamp posts reflected on wet cobbles beside the misty river, the whole city lit."),
    ("sevrin_tansy_last_lamp", "Two small figures stand close together under a single lantern on a rainy night quay."),
    ("tide_stopping_bridge", "Two figures on a stone bridge as the white Tide mist halts at the lamps on either end."),
    ("undercroft_ysole_lamp", "A small red lamp glowing at the bottom of a dark stone stair deep underground."),
    ("wren_archivist_copper_dome", "A young archivist at a desk under a great copper dome, surrounded by green lamps and tall shelves of books."),
    ("wren_quay_one_year_later", "A young woman in a blue coat reads a notecard on the lamplit quay beside the calm river."),
])
SHIP += rows("portrait", "portraits", "portrait", [
    ("isolde_varre_smug_portrait", "Isolde Varre, a smiling smuggler in a long violet coat with gold trim."),
    ("joss_hask_stern_portrait", "Joss Hask, a broad bearded road-warden in dark armour holding two lanterns."),
    ("mosk_grumpy_ferryman", "Mosk, a grumpy old ferryman rowing his boat beside a glowing lantern."),
    ("old_tansy_confused_portrait", "Old Tansy, a herbalist with wild white hair and round glasses, holding a steaming cup of rosemary tea."),
    ("sevrin_grieving_portrait", "Sevrin Ashgrave, a tall man in a long black robe with open, sorrowful hands."),
    ("sevrin_peaceful_portrait", "Sevrin Ashgrave at peace, seated at the water's edge beside a lantern."),
    ("wren_happy_portrait", "Wren, a young archivist with brown hair, smiling and holding a stack of notecards."),
    ("wren_worried_portrait", "Wren, a worried young archivist with long dark hair clutching a torn map."),
])
SHIP += rows("relic", "relics", "relic", [
    ("clockwork_tog", "A bronze cogwheel with a tiny lit city inside."),
    ("drowned_year_shell", "A spiral sea shell in bronze and brown."),
    ("echo_stone_shard", "A pale crystal shard."),
    ("hushed_glass_vial", "A tall glass vial of milky white liquid with a cork."),
    ("lamp_warden_coin", "A round bronze coin stamped with a flame."),
    ("lethe_salt_vial", "A small clay pot full of white salt."),
    ("mirror_ward_lens", "A round dark mirror in a thin silver frame."),
    ("tongues_bridge_pin", "A small stone bridge pin."),
    ("wren_notecard_clip", "A folded paper boat."),
])
SHIP += rows("inventory", "inventory", "inventory", [
    ("anchor_ribbon", "A red woven ribbon tied in a loop."),
    ("brine_satchel", "A dark leather satchel with brass anchors."),
    ("ledger_pouch", "A ring-bound notebook with a leather strap and pen."),
    ("memory_vial_set", "Five small corked vials, two pale and three violet."),
    ("river_glass_lamp", "A small glass lamp holding blue river light."),
    ("rosemary_tea_bag", "A cloth bag of dried rosemary tied with a cord."),
    ("salt_chalk_sticks", "Two sticks of salt chalk tied with a string of beads."),
    ("tide_map_case", "A round map case, open, showing a map of the river and the city."),
    ("wick_trimmer", "Wooden-handled wick trimming shears."),
])
SHIP += rows("lore", "lore_docs", "lore", [
    ("amphitheatre_echo_song_sheet", "A torn sheet of old music."),
    ("hespers_mason_stone_tablet", "A stone tablet carved with a lamp symbol."),
    ("hushed_grey_recipe_scroll", "A worn scroll with a single grey drop on it."),
    ("long_gallery_framed_map", "A framed grid map of the Long Gallery."),
    ("river_folk_salt_ledger", "A thick salt-stained ledger with a leather strap."),
    ("tongues_bridge_toll_receipts", "A bundle of coloured toll receipts tied with string."),
    ("ysoeldes_lamp_charter", "A rolled charter with a black wax seal and a ring of thirteen circles."),
])
SHIP += rows("quest", "side_quest", "quest", [
    ("amber_glass_vial", "A round glass bottle of golden liquid with a cork."),
    ("brass_compass_shard", "A brass compass rose with a glowing centre."),
    ("clay_lamp_shard", "A broken clay lamp carved with a pattern."),
    ("iron_key_skeleton", "A black iron key with a winged top."),
    ("mossy_ferry_token", "An oval stone ferry token covered in moss."),
    ("paper_fan_fragment", "A torn paper fan painted with the river and the city."),
    ("threadbare_glove", "A worn brown glove."),
    ("wax_seal_stump", "A red wax candle stump on a stone."),
    ("wooden_doll_head", "A carved wooden doll head with a calm face and small flowers on top."),
])
SHIP += rows("furniture", "furniture", "furniture", [
    ("amber_glass_vial_rack", "A tall rack of amber glass bottles."),
    ("brass_tide_compass", "A brass armillary globe on a stone stand."),
    ("copper_wire_spool", "A large spool of copper wire."),
    ("inkstone_and_stylus", "A blue inkstone on a dark slab with a bone stylus."),
    ("moth_dust_sifter", "A wooden framed sieve with pale dust."),
    ("pressed_flower_book", "An open book of pressed flowers."),
    ("tide_level_gauge", "A tall glass tide gauge with a lamp on top."),
    ("woven_kelp_scoop", "A woven kelp basket of white salt."),
])
SHIP += rows("crypt", "undercroft", "crypt", [
    ("carved_tablet_compact_fragment", "A carved stone tablet showing a lamp over crossed hammers."),
    ("carved_tablet_tide_count", "A flat carved stone slab."),
    ("chamber_prop_mirror_shard_pile", "A pile of mirror shards on a violet cloth."),
    ("chamber_prop_root_warden_halo", "A ring of amber roots."),
    ("crypt_boss_cistern_choir", "The Cistern Choir, five pale singing faces rising from dark water."),
    ("crypt_boss_crowned_echo", "The Crowned Echo, a tall pale cracked stone giant wearing a black crown."),
    ("crypt_boss_listening_spring", "The Listening Spring, a dark round pool in a stone rim."),
    ("deep_water_warm_silver_pool", "A silver-lit pool of deep water with two lamps."),
    ("sealed_chest_grey_bottle_case", "A wooden crate packed with grey bottles."),
    ("sealed_chest_scriptorium_dust", "A sealed chest with a parchment on its lid."),
])

# New art painted by gen.py: (ship id, job id in out/new, category, alt). The seed to use is in PICK (default 0).
# Seed (0 or 1) chosen by eye for each painted job; default 0.
PICK = {"voice_vision": 1, "audit_route": 1, "story_ottoline": 1, "story_green_door": 1, 
        "echo_packing_bay": 1, "echo_crossroads": 1, "echo_tide_shore": 1, "echo_speech_hall": 0,
        "forget_linking": 1, "forget_faces": 1, "forget_numbers": 1, "forget_structure": 1, "forget_boss": 1,
        "district_M2": 1, "district_M12": 1, "event_lethe_gate_vigil": 1, "event_gate_trial": 1, "event_archive_lamp": 1}
NEWROWS = [
    ("backdrop_gala", "echo_gala", "backdrop", "A grand lamplit ballroom of Veyra with long chandeliers and misty windows."),
    ("backdrop_packing_bay", "echo_packing_bay", "backdrop", "A stone quay at night with crates, barrels and lanterns beside misty water."),
    ("backdrop_speech_hall", "echo_speech_hall", "backdrop", "A hushed round lecture hall with tiered seats and a lamp on a lectern."),
    ("backdrop_crossroads", "echo_crossroads", "backdrop", "A lonely road junction at dusk with signposts and a lantern."),
    ("backdrop_night_market", "echo_night_market", "backdrop", "A narrow lane of market stalls with paper lanterns and strings of lamps."),
    ("backdrop_tide_shore", "echo_tide_shore", "backdrop", "A misty pebble shore of the river Lethe with a small lamp and white mist."),
    ("enemy_imagery", "forget_imagery", "enemy", "A small round grey mist creature with two sleepy eyes: the Forgetting of Imagery."),
    ("enemy_linking", "forget_linking", "enemy", "A grey mist creature made of three loosely linked puffs: the Forgetting of Linking."),
    ("enemy_palace", "forget_palace", "enemy", "A grey mist creature shaped like a crumbling archway: the Forgetting of Palaces."),
    ("enemy_faces", "forget_faces", "enemy", "A grey mist creature with a smooth blank face and sad eyes: the Forgetting of Faces."),
    ("enemy_numbers", "forget_numbers", "enemy", "A pale coiling mist creature: the Forgetting of Numbers."),
    ("enemy_vocab", "forget_vocab", "enemy", "A wide flat grey mist creature with moth-like wings: the Forgetting of Words."),
    ("enemy_structure", "forget_structure", "enemy", "A grey mist creature of wobbling stacked cubes: the Forgetting of Structure."),
    ("boss_great_forgetting", "forget_boss", "boss", "The Great Forgetting, a towering hooded giant of grey mist with a pale glow for a face."),
] + [(f"district_{m}", f"district_{m}", "district", a) for m, a in [
    ("M1", "Lamplighters' Quay: lamp posts being lit beside the river."),
    ("M2", "The Long Gallery: an endless arched corridor with paintings and lamps."),
    ("M3", "The Hall of Faces: a vaulted hall with rows of carved portrait niches."),
    ("M4", "The Counting House district at night: tall buildings beside the river."),
    ("M5", "The Clockwork Market: a market square beneath a great brass clock tower."),
    ("M6", "The Tongues Bridge: a bridge carved with inscriptions in many scripts."),
    ("M7", "The Scriptorium: a round library under a copper dome."),
    ("M8", "The Tidal Stair: a wet stone staircase descending into rising mist."),
    ("M9", "The Mirror Wards: a courtyard of tall standing mirrors."),
    ("M10", "The Open Roads: a road winding over the hills past stone mile markers."),
    ("M11", "The Amphitheatre of Echoes: a curved stone theatre lit by lamps."),
    ("M12", "The Lethe Gate: a colossal stone gate opening onto white mist under thirteen lamps."),
]] + [(f"event_{e}", f"event_{e}", "event", a) for e, a in [
    ("undercroft_entrance", "A stone stair spiralling down into the dark Undercroft with one lantern on the first step."),
    ("tide_rising", "A wall of white mist rising over the rooftops of Veyra at night."),
    ("lethe_gate_vigil", "Thirteen lamps held up in front of the Lethe Gate while the Tide is held back."),
    ("year_of_keeping", "The whole city of Veyra glowing with lamps seen from a hill at night."),
    ("gate_trial", "A round trial chamber with an open glowing book and empty lamp niches."),
    ("archive_lamp", "The Archive under its copper dome, lit by one great hanging lantern."),
    ("vigil_dawn", "Dawn over the river after the Night of No Moon, the mist glowing gold."),
    ("palace_corridor", "A long memory palace corridor with glowing doors on each side."),
]] + [(f"trial_{e}", f"trial_{e}", "trial", a) for e, a in [
    # v0.11 District Trials and vaults (alt text checked against each picture)
    ("catacombs", "A misty crypt lined with pale marble busts in niches, an open logbook on a stone lectern beside an amber lamp."),
    ("scriptorium", "A library floor flooded with still grey water, desks and scrolls floating, a copper dome above."),
    ("salt_vault", "A round brass vault door covered in small dials in a brick cellar, a green lamp above and salt crystals below."),
    ("bridge", "A long stone bridge over a misty chasm with small stone gargoyles on the railings and lanterns."),
    ("gears", "A market square of small striped stalls with brass gears laid out on them, under a stopped clock tower."),
    ("vault", "A small round stone door with a lamp symbol in the river wall, an empty niche beside it and a lamp on a hook."),
]]
# Nov 2, 2026 additions (painted by gen.py jobs vigil_, bramble_, mirror_, voice_, pedestal_, audit_, wrenmem_, longecho_).
# Alt text is PROVISIONAL: check it against each picture (picreview.py helps) before shipping, and set the seed in PICK.
NEWROWS += [
    ("backdrop_long_vigil", "vigil_battlements", "backdrop", "The Quay battlements at dusk with a row of lit lanterns and soft faceless mist phantoms drifting toward them."),
    ("event_mirror_room", "mirror_room", "event", "A quiet round room of tall old mirrors, each holding a remembered object."),
    ("overlay_bramble_clump", "bramble_clump", "overlay", "A small clump of thorny silver-green bramble vines."),
    ("overlay_bramble_vine", "bramble_vine", "overlay", "A long thorny silver-green bramble vine curling in an S shape."),
    ("overlay_bramble_bud", "bramble_bud", "overlay", "A bramble stem with one thorn and a small glowing pale bud."),
    ("overlay_bramble_burning", "bramble_burning", "overlay", "Bramble vines dissolving into golden light and floating sparks."),
    ("voice_vision", "voice_vision", "voice", "Vision, a small lamp-spirit with an eye-shaped flame."),
    ("voice_thread", "voice_thread", "voice", "Thread, a small lamp-spirit holding a spool of glowing thread."),
    ("voice_place", "voice_place", "voice", "Place, a small lamp-spirit shaped like a tiny house lantern."),
    ("voice_face", "voice_face", "voice", "Face, a small lamp-spirit with a masked mirror flame."),
    ("voice_count", "voice_count", "voice", "Count, a small lamp-spirit shaped like an abacus lantern."),
    ("voice_tongue", "voice_tongue", "voice", "Tongue, a small lamp-spirit trailing a ribbon of rune-like swirls."),
    ("voice_frame", "voice_frame", "voice", "Frame, a small lamp-spirit shaped like a lantern bookcase."),
    ("pedestal_lit", "pedestal_lit", "pedestal", "A lit stone pedestal with a warm glow and an empty top for a relic."),
    ("pedestal_dim", "pedestal_dim", "pedestal", "A dim, faded stone pedestal with an empty top."),
    ("event_wren_audit_route", "audit_route", "event", "A lamplit palace route with glowing stops, each beside a small object, and a notebook in front."),
    ("event_wren_nook", "wrenmem_nook", "event", "Wren's cosy reading nook under a round window onto the river, with notecards and a teacup."),
    ("trial_long_echo_vault", "longecho_vault", "trial", "An old round stone vault door in the river wall, ringed with moss and tiny lamp symbols."),
]
# Owner-approved story and trial additions (jobs story_, trialx_ in gen.py; alt text provisional). The two prize objects (prizex_) are NOT
# shipped here: like prize_*, they are traced into 24x24 code icons by prizes.py.
NEWROWS += [
    ("portrait_ambrose_tallow", "story_ambrose", "portrait", "Ambrose Tallow, the Winder, a thin, faded old Warden in a dark coat with a pocket watch and kind, tired eyes."),
    ("portrait_ottoline_gilt", "story_ottoline", "portrait", "Ottoline Gilt, a smug young woman in cream and gold silk with ribbons in her hair."),
    ("portrait_edrin_halloway", "story_edrin", "portrait", "Edrin Halloway, a quiet old lamplighter in a worn blue coat with a lamplighter's pole."),
    ("event_green_door", "story_green_door", "event", "A newly painted green door on Quay Row beside a lit street lamp."),
    ("event_wren_mother_portrait", "story_mother_portrait", "event", "A softly painted portrait of a smiling woman with a yellow scarf on an easel in the Archive."),
    ("event_lamp_cup", "story_lamp_cup", "event", "The Lamp Cup, a small brass lamp on a stand with a worn blank founder's plate."),
    ("lore_winding_mark", "story_winding_mark", "lore", "A worn iron disc carved with a ring and a single clock hand."),
    ("trial_year_hall", "trialx_year_hall", "trial", "A long stone hall of tall pillars with a glowing timeline in the floor and lit alcoves holding tablets."),
    ("trial_reckoning", "trialx_reckoning", "trial", "A brick counting hall with a long table of brass calculating frames and tally sticks under green lamps."),
]
# 1.2 drill pictures (testart.py paints them from test_art_jobs.json; ids are permanent). Seed chosen by eye, default 0.
TEST_PICK = {}
TEST_JOBS = json.loads((HERE / "test_art_jobs.json").read_text(encoding="utf-8"))["jobs"] if (HERE / "test_art_jobs.json").exists() else []
for j in TEST_JOBS:
    PICK.setdefault(j["id"], TEST_PICK.get(j["id"], 0))
NEWROWS += [(j["id"], j["id"], j["category"], j["alt"]) for j in TEST_JOBS]
for sid, job, cat, alt in NEWROWS:
    pass  # resolved in resolve()


DAY_SIZE = (288, 162, 24)  # day and dawn scenes are shipped smaller to keep the folder light
DAWN = {"backdrop_tide_shore", "event_tide_rising", "event_lethe_gate_vigil", "backdrop_long_vigil"}
SCENES = {c for c, v in SPEC.items() if v[3] == "scene"}


def resolve():
    """(id, source, category, alt, time, (w, h, colours)) for every picture. Night versions first, then day versions."""
    out = []
    for sid, rel, cat, alt in SHIP:
        out.append((sid, rel, cat, alt, "night" if cat in SCENES else "any", SPEC[cat][:3]))
    for sid, job, cat, alt in NEWROWS:
        seed = PICK.get(job, 0)
        t = "dawn" if sid == "event_vigil_dawn" else ("night" if cat in SCENES else "any")
        out.append((sid, f"new/{job}_s{seed}.png", cat, alt, t, SPEC[cat][:3]))
    for sid, job, cat, alt in NEWROWS:  # day versions: edits of the night pictures made by day.py
        if (OUT / "day" / f"{sid}-day.png").exists():
            t = "dawn" if sid in DAWN else "day"
            out.append((f"{sid}-day", f"day/{sid}-day.png", cat, DAY_ALT.get(sid) or alt + (" Shown at dawn." if t == "dawn" else " Shown by day."), t, DAY_SIZE))
    return out


# Own descriptions for the day versions (the night alt text names lamps, dusk or mist that the day picture does not show)
DAY_ALT = {
    "trial_catacombs": "A crypt lined with pale marble busts in niches, lit by daylight, with a logbook on a stone lectern.",
    "trial_scriptorium": "A sunlit library floor flooded with still water, desks and scrolls floating under a copper dome.",
    "trial_salt_vault": "A round brass vault door covered in small dials in a brick wall, with salt crystals below, by day.",
    "trial_bridge": "A long stone bridge over a chasm with small stone gargoyles on the railings, by day.",
    "trial_gears": "A market square of small stalls with brass gears laid out on them, under a clock tower, by day.",
    "trial_vault": "A small round stone door in the river wall with an empty niche beside it, by day.",
    "backdrop_long_vigil": "The Quay battlements at dawn above the river, the night's watch over.",
    "backdrop_gala": "A grand ballroom of Veyra by daylight, with tall windows and polished floors.",
    "backdrop_packing_bay": "A stone quay by day with crates and barrels beside the water.",
    "backdrop_speech_hall": "A round lecture hall with tiered seats and a lectern, lit by daylight.",
    "backdrop_crossroads": "A road junction with signposts on a bright day.",
    "backdrop_night_market": "A narrow lane of market stalls and awnings by day.",
    "backdrop_tide_shore": "A pebble shore of the river Lethe at dawn, with thin mist on the water.",
    "district_M1": "Lamplighters' Quay by day: lamp posts beside the river.",
    "district_M2": "The Long Gallery by day: a sunlit colonnade of arches.",
    "district_M3": "The Hall of Faces by day: a vaulted hall with rows of carved portrait niches.",
    "district_M4": "The Counting House district by day: tall buildings beside the river.",
    "district_M5": "The Clockwork Market by day: a market square beneath a great brass clock tower.",
    "district_M6": "The Tongues Bridge by day: a carved stone bridge over the river.",
    "district_M7": "The Scriptorium by day: a round library under a copper dome.",
    "district_M8": "The Tidal Stair by day: a wet stone staircase going down to the water.",
    "district_M9": "The Mirror Wards by day: a courtyard of tall standing mirrors.",
    "district_M10": "The Open Roads by day: a road winding over the hills past stone mile markers.",
    "district_M11": "The Amphitheatre of Echoes by day: a curved stone theatre.",
    "district_M12": "The Lethe Gate by day: a colossal stone gate above the river.",
    "event_undercroft_entrance": "The city of Veyra seen from above on a bright day, over the way down to the Undercroft.",
    "event_tide_rising": "Thin mist lifting off the rooftops of Veyra at dawn.",
    "event_lethe_gate_vigil": "The Lethe Gate at dawn after the long night's watch.",
    "event_year_of_keeping": "The whole city of Veyra seen from a hill on a bright day.",
}


def remove_bg(im: Image.Image, cut=24):
    """Flood the plain dark background from the edges; return an 'L' mask (255 = keep)."""
    W, H = im.size
    px = im.load()
    corners = [px[0, 0], px[W - 1, 0], px[0, H - 1], px[W - 1, H - 1]]
    bg = tuple(sorted(c[i] for c in corners)[1] for i in range(3))
    cut2 = cut * cut
    keep = bytearray(b"\x01" * (W * H))
    stack = [(x, y) for x in range(W) for y in (0, H - 1)] + [(x, y) for y in range(H) for x in (0, W - 1)]
    while stack:
        x, y = stack.pop()
        if 0 <= x < W and 0 <= y < H and keep[y * W + x]:
            c = px[x, y]
            if (c[0] - bg[0]) ** 2 + (c[1] - bg[1]) ** 2 + (c[2] - bg[2]) ** 2 < cut2:
                keep[y * W + x] = 0
                stack += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    m = Image.new("L", (W, H))
    m.putdata([255 if k else 0 for k in keep])
    return m


def process(src: Path, cat: str, dims):
    (w, h, ncol), kind = dims, SPEC[cat][3]
    im = Image.open(src).convert("RGB")
    if kind == "scene":
        im = im.resize((w, h), Image.BOX)
        q = im.quantize(colors=ncol, method=Image.MEDIANCUT, dither=Image.NONE)
        return q, None
    big = im.copy()
    big.thumbnail((384, 384), Image.BOX)
    mask = remove_bg(big)
    box = mask.point(lambda v: 255 if v > 128 else 0).getbbox()
    if not box:
        raise ValueError("nothing left after background removal")
    big, mask = big.crop(box), mask.crop(box)
    sc = min((w - 2) / big.width, (h - 2) / big.height)
    tw, th = max(1, round(big.width * sc)), max(1, round(big.height * sc))
    big, mask = big.resize((tw, th), Image.BOX), mask.resize((tw, th), Image.BOX)
    canvas, alpha = Image.new("RGB", (w, h), (20, 15, 26)), Image.new("L", (w, h), 0)
    ox, oy = (w - tw) // 2, max(1, h - 1 - th) if th < h - 2 else (h - th) // 2
    canvas.paste(big, (ox, oy)); alpha.paste(mask, (ox, oy))
    q = canvas.quantize(colors=ncol, method=Image.MEDIANCUT, dither=Image.NONE)
    pal = q.getpalette()[: ncol * 3] + [0] * 3
    q.putpalette(pal + [0] * (768 - len(pal)))
    a = alpha.load(); qp = q.load()
    for y in range(h):
        for x in range(w):
            if a[x, y] < 128:
                qp[x, y] = ncol  # the reserved transparent index
    return q, ncol


def save_best(q: Image.Image, trans, dest_noext: Path):
    buf = io.BytesIO()
    kw = {"transparency": trans} if trans is not None else {}
    q.save(buf, "PNG", optimize=True, **kw)
    png = buf.getvalue()
    rgba = q.convert("RGBA")
    wb = io.BytesIO()
    rgba.save(wb, "WEBP", lossless=True, quality=100, method=6)
    webp = wb.getvalue()
    if len(webp) < len(png) * 0.85:
        dest, data = dest_noext.with_suffix(".webp"), webp
    else:
        dest, data = dest_noext.with_suffix(".png"), png
    for old in (dest_noext.with_suffix(".png"), dest_noext.with_suffix(".webp")):
        if old.exists():
            old.unlink()
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)
    return dest, len(data)


def write_manifest(entries):
    lines = [
        "// Generated by tools/asset-studio/ship.py. Do not edit by hand (re-run the script instead).",
        "// Every picture is a small pixel-art file in src/assets/art, painted with a local image model and",
        "// downscaled + palette-reduced by the ship script. See docs/ART.md.",
    ]
    imports, objs = [], []
    for n, e in enumerate(entries):
        imports.append(f"import a{n} from '../assets/art/{e['category']}/{e['file']}';")
        objs.append(f" '{e['id']}': {{ src: a{n}, w: {e['w']}, h: {e['h']}, category: '{e['category']}', model: 'qwen-image-2.1', time: '{e['time']}', alt: {json.dumps(e['alt'])} }},")
    body = "\n".join(lines + imports) + "\n\nexport const ART = {\n" + "\n".join(objs) + "\n};\n"
    body += ("\nexport const ART_IDS = Object.keys(ART);\n"
             "export const artByCategory = (category) => ART_IDS.filter((id) => ART[id].category === category);\n"
             "// Returns the entry for an id, or null when the picture is not shipped (callers keep their code-drawn fallback).\n"
             "export const art = (id) => ART[id] || null;\n"
             "// Time of day: 'day' or 'dawn' returns the '<id>-day' picture when one exists, otherwise (and for 'night') the plain id; null if neither is shipped.\n"
             "export const artFor = (id, time) => ((time === 'day' || time === 'dawn') && ART[`${id}-day`]) || ART[id] || null;\n")
    MANIFEST.write_text(body, encoding="utf-8")


def sheet(entries):
    cols, T = 8, 168
    rows_ = (len(entries) + cols - 1) // cols
    sh = Image.new("RGB", (cols * T, rows_ * (T + 14)), (15, 20, 32)); d = ImageDraw.Draw(sh)
    for n, e in enumerate(entries):
        im = Image.open(ART_DIR / e["category"] / e["file"]).convert("RGBA")
        sc = max(1, min((T - 4) // im.width, (T - 4) // im.height)) if im.width < 100 else (T - 4) / im.width
        im = im.resize((round(im.width * sc), round(im.height * sc)), Image.NEAREST)
        x, y = (n % cols) * T, (n // cols) * (T + 14)
        sh.paste(im, (x + (T - im.width) // 2, y + (T - im.height) // 2), im)
        d.text((x + 2, y + T), e["id"][:30], fill=(239, 230, 210))
    sh.save(OUT / "shipped-sheet.png")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sheet", action="store_true")
    a = ap.parse_args()
    entries, total, skipped = [], 0, []
    for sid, rel, cat, alt, tm, dims in resolve():
        src = OUT / rel
        if not src.exists():
            skipped.append(sid)
            continue
        try:
            q, trans = process(src, cat, dims)
        except Exception as e:  # noqa: BLE001
            print("FAILED", sid, e); skipped.append(sid); continue
        dest, size = save_best(q, trans, ART_DIR / cat / sid)
        total += size
        w, h = dims[:2]
        entries.append({"id": sid, "category": cat, "file": dest.name, "w": w, "h": h, "alt": alt, "time": tm, "bytes": size})
    write_manifest(entries)
    by = {}
    for e in entries:
        c = by.setdefault(e["category"], [0, 0]); c[0] += 1; c[1] += e["bytes"]
    for c, (n, b) in by.items():
        print(f"{c:10} {n:3} files {b / 1024:7.1f} KB")
    scenes = sum(f.stat().st_size for f in (ART_DIR / "scene").glob("*") if f.suffix in (".png", ".webp")) if (ART_DIR / "scene").exists() else 0
    if scenes:  # painted scenes are shipped by motion.py but share the budget
        print(f"{'scene':10}     {scenes / 1024:7.1f} KB (painted scenes, motion.py)")
        total += scenes
    print(f"TOTAL {len(entries)} files {total / 1024:.1f} KB (budget {BUDGET_KB} KB){'  OVER BUDGET' if total / 1024 > BUDGET_KB else ''}")
    if skipped:
        print("not shipped (missing or failed):", ", ".join(skipped))
    if a.sheet and entries:
        sheet(entries); print("sheet:", OUT / "shipped-sheet.png")


if __name__ == "__main__":
    sys.exit(main())
