"""Mnemos painted scenes: image-model pictures that the game animates in code.

A painted scene is two matching pictures of one place, painted with the local image model (Qwen-Image 2.1):
  lit  = every lamp and torch burning,     dark = the same place with the lights out.
The game draws `dark` and reveals `lit` through a flickering, dithered light mask (src/pixel/painted.js), then
draws its code effects (flames, mist, dust) on top. No video is generated: the motion is all code, so files stay
small and nothing wobbles from frame to frame.

The pictures keep the image model's own pixel density: the script measures how big the painted "pixels" are
and shrinks the picture so each one becomes exactly one real pixel. The picture's shape is free (16:9 by default).

This script also READS the finished picture: it finds where the light sources are (what changes between dark
and lit) and where small flames burn, and writes those positions into the manifest so the game animates exactly
those spots, wherever the model put them.

  python tools/asset-studio/motion.py guide  [--scene ID]          capture today's code-drawn scene as the layout guide (no model)
  python tools/asset-studio/motion.py paint  [--scene ID] [--seeds N] [--mp 2.0]   paint lit + dark with the image model
  python tools/asset-studio/motion.py ship   [--scene ID] [--seed S] [--grid K | --width W] [--dark derive]   reduce, analyse, ship, manifest
  python tools/asset-studio/motion.py standin [--scene ID]         stand-in pictures made from the guide (tests the code, no model)
  python tools/asset-studio/motion.py gif    [--scene ID]          review GIF of the scene as the game animates it
  python tools/asset-studio/motion.py ideas  [--mp 1.2]                 eight free map views (no layout guide) -> out/motion/map_ideas/sheet.png
  python tools/asset-studio/motion.py refine --scene ID --seed s0 [--denoise 0.55]   fine-pixel second pass -> <id>_lit_s0f.png
  python tools/asset-studio/motion.py compare [--scene ID] [--old DIR]   same crop of an older ship and the current one, same size on screen

Drafts go to out/motion/ (never shipped directly). Shipped: src/assets/art/scene/<id>_dark|_lit.(webp|png),
manifest src/data/scenes.js. Before running `paint`: unload LM Studio (one model in VRAM at a time).
"""
from __future__ import annotations

import argparse
import json, os
import subprocess
import sys
import time
import urllib.parse
import urllib.request
import uuid
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps, ImageStat

sys.path.insert(0, str(Path(__file__).resolve().parent))
import ship  # noqa: E402
import studio  # noqa: E402

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
DRAFTS = studio.OUT / "motion"
GUIDES = HERE / "guides"
SCENE_ART = ship.ART_DIR / "scene"
MANIFEST = ROOT / "src" / "data" / "scenes.js"
JOBS = HERE / "art-jobs.json"

STEPS = 24
LOOK = ("Detailed 16-bit pixel art game background, crisp square pixels of one even size, dark outlines, soft many-step shading like a "
        "hand-painted pixel-art portrait, deep teal-black shadows, warm amber firelight, grey-brown stone, neutral natural colour balance, original fantasy setting.")
NEG = ("text, letters, words, watermark, signature, logo, photo, photorealistic, 3d render, blurry, anti-aliasing, mixed pixel sizes, "
       "people, characters, gore, blood, characters or art from existing games or films, "
       "purple tint, violet tint, magenta cast, lavender haze, purple colour cast, monochrome purple")

# Code-drawn points are in the code scene's pixels (the guide); the script maps them into the picture.
SCENES = {
    "crypt_entrance": {
        "guide": "crypt_entrance.png",
        "code": "entrance",                 # what scene_capture.mjs grabs
        "aspect": "16:9 (Widescreen)",      # ResolutionSelector preset; the guide sits in the middle, the model fills the sides
        "aspect_wh": (16, 9),
        "megapixels": 2.0,
        "colours": 96,
        "pixel": 2.0,                       # image pixels per art pixel when the painting has no exact grid (owner: 4 looked low res, Nov 6, 2026)
        "lit": ("Repaint this rough layout as a detailed pixel-art scene of the same place: a deep stone undercroft under an old archive. "
                "In the centre a tall arched iron-banded wooden door with rivets and two ring knockers, a carved lamp-in-a-hand mark on the keystone. "
                "Two iron wall torches burn brightly left and right of the door, throwing warm amber light on the old brick walls. "
                "Low stone steps lead up to the door, small dark wall niches either side, moss near the floor, hanging chains, "
                "a thin crack in the ceiling lets in a pale cold beam. Keep the door, torches and steps exactly where they are in the layout; "
                "extend the brick walls to fill the wide frame."),
        "dark": ("Edit this pixel-art picture: the same scene with both torches put out (unlit, no flames, no glow) and the door in deep shadow, "
                 "lit only by the faint cold blue beam from the ceiling crack. Keep every object, outline and pixel position exactly the same; "
                 "change only the light."),
        "alt": "An iron door under the Archive floor, lit by two torches",
        "points": {"door": (88, 80), "shaft": (106, 12, 118, 94), "torches": [(34, 45), (142, 45)],
                   # (x, y, radius, strength, flicker) as in drawEntrance in src/ui/Crypt.jsx; used when no lights can be found
                   "lights": [(34, 42, 60, 1.45, 1), (142, 42, 60, 1.45, 1), (88, 136, 104, 0.55, 0),
                              (109, 34, 16, 0.45, 0), (114, 64, 18, 0.42, 0), (119, 96, 22, 0.5, 0)]},
        "mist": (0.80, 0.20),
    },
    # The title screen backdrop (Nov 8, 2026): only the lit picture is painted; the game flickers its windows and
    # draws the fog and the traveller with the lantern on top (TitleScene in src/ui/pixel/Scenes.jsx).
    "title": {
        "guide": "title.png",
        "capture": "title",
        "free": True,                       # fine style from the words alone (owner chose it, Nov 8, 2026)
        "aspect": "16:9 (Widescreen)",
        "aspect_wh": (16, 9),
        "megapixels": 1.0,
        "colours": 96,
        "paint_dark": False,
        "single": True,                     # only the lit picture ships; the title flickers its windows in code
        "lit": ("A walled city of stacked stone terraces with hundreds of warm lit windows climbing a dark cliff on the right, a "
                "green-domed library at the top, a thin waterfall falling through the city, a calm dark sea on the left reflecting a "
                "crescent moon, far blue mountains, a sky full of stars, a grassy hillside with a pale winding coast road and a lone "
                "windswept tree in the foreground. Leave the upper middle of the sky open and calm. No people."),
        "dark": "",
        "alt": "Veyra at night on its cliff above the Grey Sea, a traveller with a lantern on the coast road",
        "points": {},
        "mist": None,
    },
    # The world map (Part B, Nov 8, 2026). Same pipeline: "lit" = the city restored, "dark" = the city lost to the Tide.
    # WorldMap.jsx shows the restored plate inside each restored district, so the painting must keep the code
    # map's layout (240x320 guide, 3x = 720x960): districts, walls, river and streets where the buttons are.
    "world_map": {
        "guide": "world_map_restored.png",
        "capture": "map",
        "free": True,                       # the owner's chosen view (style test, Nov 8, 2026); buttons follow the painting
        "aspect": "3:4 (Portrait Standard)",
        "aspect_wh": (3, 4),
        "megapixels": 1.0,
        "colours": 128,
        "derive": "lost",                   # the painted lost city is tinted grey-blue like the Tide
        "align_max": 40,
        "lit": "MAP_LIT",
        "dark": ("Edit this picture: the same city lost in a cold grey mist. Every window dark, every lamp out, gardens withered, "
                 "thorny brambles and ivy creeping over the walls and roofs, thin fog in the streets, no boats lit. Keep every building, "
                 "wall, street, the river and every position exactly the same; change only the light, colour and overgrowth."),
        "alt": "Map of Veyra, a walled city on a hillside above the sea",
        "points": {},
        "mist": None,
    },
}


# The Undercroft chambers (Nov 8, 2026): one painting per decor; every band with that decor shares it.
CHAMBER_BASE = ("A vaulted stone chamber deep under an old "
                "archive. Two stone pillars at the left and right edges, each holding a burning iron wall torch with a bright flame. "
                "In the centre a dark arched opening with stone steps going down into blackness, and in front of it a low stone altar "
                "block with a small carved lamp-in-a-hand mark. Worn flagstone floor, a stone vault rib overhead. ")
CHAMBER_DECOR = {
    "bones": ("Either side of the arch, deep wall niches with rows of old skulls stacked neatly and with care, grey stone.", "stone"),
    "shelves": ("Either side of the arch, tall old wooden shelves full of swollen, damp leather ledgers and books, grey stone.", "stone"),
    "water": ("Still black water covers the floor and mirrors the torches, cold blue-grey stone, thin threads of water running down the walls.", "river"),
    "thrones": ("Either side of the arch, a throne of black stone with a small golden crown resting on its seat, dark grey stone.", "violet"),
    "roots": ("Pale, thick, very old tree roots hang down through the vault and push through the walls, mossy green stone.", "moss"),
    "springs": ("Small round pools of silver water well up from the floor and glow faintly, a thin pale mist, cool grey-blue stone.", "tide"),
}
for _d, (_txt, _hue) in CHAMBER_DECOR.items():
    SCENES[f"crypt_chamber_{_d}"] = {
        "guide": f"crypt_chamber_{_d}.png",
        "capture": "chamber",
        "aspect": "16:9 (Widescreen)",
        "aspect_wh": (16, 9),
        "megapixels": 2.2,
        "colours": 96,
        "pixel": 2.1,
        "paint_dark": False,                # the image model brightens instead of putting lamps out; the dark plate is derived
        "lit": CHAMBER_BASE + _txt + " Wide view, the arch in the centre.",
        "free": True,
        "megapixels": 1.0,
        "dark": "",
        "alt": "An Undercroft chamber lit by two torches",
        "points": {"torches": [(18, 47), (158, 47)],
                   "lights": [(18, 44, 62, 1.3, 1), (158, 44, 62, 1.3, 1), (88, 62, 58, 1.05, 0)]},
        "mist": (0.80, 0.20) if _d in ("springs", "water") else None,
    }


# ---------------------------------------------------------------- helpers
def jobs_record(sid, data):
    doc = json.loads(JOBS.read_text(encoding="utf-8")) if JOBS.exists() else {}
    doc.setdefault("motion", {})[sid] = data
    JOBS.write_text(json.dumps(doc, indent=1, ensure_ascii=False), encoding="utf-8")


def guide_path(sid):
    return GUIDES / SCENES[sid]["guide"]


def padded_guide(sid, mp):
    """The code scene scaled up and centred on a canvas of the painting's shape (dark stone fills the sides)."""
    cfg = SCENES[sid]
    aw, ah = cfg["aspect_wh"]
    H = round((mp * 1e6 * ah / aw) ** 0.5 / 8) * 8
    W = round(H * aw / ah / 8) * 8
    g = Image.open(guide_path(sid)).convert("RGB")
    s = min(W / g.width, H / g.height)
    gw, gh = round(g.width * s), round(g.height * s)
    canvas = Image.new("RGB", (W, H), (10, 11, 18))
    canvas.paste(g.resize((gw, gh), Image.NEAREST), ((W - gw) // 2, (H - gh) // 2))
    return canvas, (s, (W - gw) / 2, (H - gh) / 2)


def upload(im: Image.Image, name: str) -> str:
    tmp = DRAFTS / "_ref" / name
    tmp.parent.mkdir(parents=True, exist_ok=True)
    im.save(tmp)
    b = uuid.uuid4().hex
    body = (f"--{b}\r\nContent-Disposition: form-data; name=\"image\"; filename=\"{name}\"\r\nContent-Type: image/png\r\n\r\n").encode() + tmp.read_bytes() + (
        f"\r\n--{b}\r\nContent-Disposition: form-data; name=\"overwrite\"\r\n\r\ntrue\r\n--{b}--\r\n").encode()
    req = urllib.request.Request(studio.COMFY + "/upload/image", body, {"content-type": f"multipart/form-data; boundary={b}"})
    return json.loads(urllib.request.urlopen(req, timeout=60).read())["name"]


def edit_wf(prompt, image_name, seed, aspect, mp, denoise=1.0):
    """Qwen-Image 2.1 edit mode: the reference picture goes into the text encoder (same wiring as day.py / faces.py).
    denoise < 1 also STARTS the painting from the reference picture (image to image), so the layout stays where it
    is: the map's districts and buttons must line up with the code map (owner review, Nov 8, 2026)."""
    wf = json.loads((studio.STUDIO / "comfy_qwen_workflow.json").read_text(encoding="utf-8"))
    enc = next(k for k, n in wf.items() if n["class_type"].startswith("TextEncodeQwenImage"))
    vae = next(k for k, n in wf.items() if n["class_type"] == "VAELoader")
    for node in wf.values():
        ct, inp = node["class_type"], node["inputs"]
        if ct == "KSampler":
            inp["seed"], inp["steps"] = seed, STEPS
        elif ct == "ResolutionSelector":
            inp["aspect_ratio"], inp["megapixels"] = aspect, mp
        elif ct.startswith("SaveImage"):
            inp["filename_prefix"] = "mnemos_motion"
    wf["900"] = {"class_type": "LoadImage", "inputs": {"image": image_name}}
    wf[enc]["inputs"].update({"prompt": prompt, "negative_prompt": NEG, "images.image_1": ["900", 0], "vae": [vae, 0]})
    if denoise < 1:
        ks = next(k for k, n in wf.items() if n["class_type"] == "KSampler")
        rs = next(k for k, n in wf.items() if n["class_type"] == "ResolutionSelector")
        wf["901"] = {"class_type": "ImageScale", "inputs": {"image": ["900", 0], "upscale_method": "lanczos", "width": [rs, 0], "height": [rs, 1], "crop": "center"}}
        wf["902"] = {"class_type": "VAEEncode", "inputs": {"pixels": ["901", 0], "vae": [vae, 0]}}
        wf[ks]["inputs"].update({"latent_image": ["902", 0], "denoise": denoise})
    return wf


LIT_ONLY = False  # paint --lit-only: paint the lit pictures only (pick one, then paint its dark or lost version)


def txt_wf(prompt, neg, seed, aspect, mp):
    """Plain text to image with the studio's saved workflow (as agent.comfy_image in the studio project)."""
    wf = json.loads((studio.STUDIO / "comfy_qwen_workflow.json").read_text(encoding="utf-8"))
    for node in wf.values():
        ct, inp = node["class_type"], node["inputs"]
        if ct.startswith("TextEncodeQwenImage"):
            inp["prompt"], inp["negative_prompt"] = prompt, neg
        elif ct == "KSampler":
            inp["seed"], inp["steps"] = seed, STEPS
        elif ct == "ResolutionSelector":
            inp["aspect_ratio"], inp["megapixels"] = aspect, mp
        elif ct.startswith("SaveImage"):
            inp["filename_prefix"] = "mnemos_motion"
    return wf


def run_wf(wf, dest: Path, tag):
    t0 = time.time()
    pid = studio.comfy("/prompt", {"prompt": wf, "client_id": "mnemos-motion"})["prompt_id"]
    hist = {}
    for _ in range(3600):
        time.sleep(1)
        hist = studio.comfy(f"/history/{pid}")
        if pid in hist:
            break
    for out in hist.get(pid, {}).get("outputs", {}).values():
        for im in out.get("images", []):
            q = urllib.parse.urlencode({"filename": im["filename"], "subfolder": im.get("subfolder", ""), "type": im.get("type", "output")})
            dest.write_bytes(studio.comfy(f"/view?{q}", timeout=120))
            try:  # take out the model's violet colour cast (docs/ART.md, "Colour cast"); set NO_DECAST=1 to keep the raw picture
                import colorfix
                if not os.environ.get("NO_DECAST"):
                    colorfix.decast_file(dest)
            except Exception as e:  # noqa: BLE001
                studio.log("decast skipped", repr(e))
            studio.log("motion", tag, dest.name, f"{time.time() - t0:.0f}s")
            return True
    studio.log("motion NO OUTPUT", tag)
    return False


# ---------------------------------------------------------------- stages
def stage_guide(sid):
    if SCENES[sid].get("capture") == "chamber":
        subprocess.run(["node", str(HERE / "scene_capture.mjs"), "chamber", str(GUIDES)], cwd=ROOT, check=True)
        return
    if SCENES[sid].get("capture") == "title":
        subprocess.run(["node", str(HERE / "scene_capture.mjs"), "title", str(guide_path(sid))], cwd=ROOT, check=True)
        return
    if SCENES[sid].get("capture") == "map":
        subprocess.run(["node", str(HERE / "scene_capture.mjs"), "map", str(GUIDES)], cwd=ROOT, check=True)
        return
    out = guide_path(sid)
    subprocess.run(["node", str(HERE / "scene_capture.mjs"), "guide", str(out)], cwd=ROOT, check=True)


def stage_paint(sid, seeds, mp):
    cfg = SCENES[sid]
    if not guide_path(sid).exists():
        stage_guide(sid)
    DRAFTS.mkdir(parents=True, exist_ok=True)
    studio.free_llm()
    if not studio.start_comfy():
        studio.log("ComfyUI did not start")
        return
    try:
        free = cfg.get("free", False)
        look, neg = (LOOK_FINE, NEG_FINE) if free else (LOOK, NEG)
        base = 160000 if free else 120000
        ref = None if free else upload(padded_guide(sid, mp)[0], f"mnemos_{sid}_guide.png")
        for s in range(seeds):
            seed = base + s
            lit = DRAFTS / f"{sid}_lit_s{s}.png"
            if not lit.exists():
                if free:  # fine style, painted from the words alone (owner chose this look, Nov 8, 2026)
                    run_wf(txt_wf(f"{cfg['lit']} {look}", neg, seed, cfg["aspect"], mp), lit, f"{sid} lit s{s}")
                else:
                    dn = cfg.get("denoise", 1.0)
                    dn = dn[s % len(dn)] if isinstance(dn, (list, tuple)) else dn  # a list tries one strength per seed
                    run_wf(edit_wf(f"{cfg['lit']} {look}", ref, seed, cfg["aspect"], mp, dn), lit, f"{sid} lit s{s} denoise {dn}")
            dark = DRAFTS / f"{sid}_dark_s{s}.png"
            if lit.exists() and not dark.exists() and cfg.get("paint_dark", True) and not LIT_ONLY:
                lref = upload(Image.open(lit).convert("RGB"), f"mnemos_{sid}_lit_s{s}.png")
                run_wf(edit_wf(f"{cfg['dark']} {look}", lref, seed, cfg["aspect"], mp, cfg.get("dark_denoise", 1.0)), dark, f"{sid} dark s{s}")
        jobs_record(sid, {"model": "qwen-image-2.1", "method": "text to image, fine style" if free else "edit (reference image into the encoder)",
                          "denoise": cfg.get("denoise", 1.0), "steps": STEPS, "megapixels": mp,
                          "aspect": cfg["aspect"], "seeds": [base + s for s in range(seeds)], "guide": None if free else f"tools/asset-studio/guides/{cfg['guide']}",
                          "lit_prompt": f"{cfg['lit']} {look}", "dark_prompt": f"{cfg['dark']} {look}", "negative_prompt": neg,
                          "note": "dark (lost) is an edit of the lit picture."})
    finally:
        try:
            studio.comfy("/free", {"unload_models": True, "free_memory": True})
        except Exception:  # noqa: BLE001
            pass
        if studio.STARTED:
            studio.STARTED.terminate()
            studio.log("ComfyUI server stopped")


def stage_standin(sid):
    """Pictures made from the code guide alone (no model): enough to test the game code end to end."""
    if not guide_path(sid).exists():
        stage_guide(sid)
    DRAFTS.mkdir(parents=True, exist_ok=True)
    guide, _ = padded_guide(sid, 0.5)
    guide.save(DRAFTS / f"{sid}_lit_standin.png")
    if SCENES[sid].get("capture") == "map":  # the code map's own lost state
        lost = Image.open(GUIDES / "world_map_lost.png").convert("RGB").resize(guide.size, Image.NEAREST)
        lost.save(DRAFTS / f"{sid}_dark_standin.png")
    else:
        derive_dark(guide).save(DRAFTS / f"{sid}_dark_standin.png")
    print("stand-ins:", DRAFTS / f"{sid}_lit_standin.png", DRAFTS / f"{sid}_dark_standin.png")


# ---------------------------------------------------------------- reading the pictures
def _edge_profile(g: Image.Image, axis):
    """Edge strength per column (axis 0) or per row (axis 1) of a greyscale picture."""
    W, H = g.size
    if axis == 0:
        d = ImageChops.difference(g.crop((1, 0, W, H)), g.crop((0, 0, W - 1, H)))
        d = d.point(lambda v: v if v > 10 else 0).resize((W - 1, 1), Image.BOX)
        return list(d.getdata())
    d = ImageChops.difference(g.crop((0, 1, W, H)), g.crop((0, 0, W, H - 1)))
    d = d.point(lambda v: v if v > 10 else 0).resize((1, H - 1), Image.BOX)
    return list(d.getdata())


def _coherence(w, p):
    """How well edge positions line up on a grid of period p (1 = every edge on a grid line). Also returns the grid phase."""
    import cmath
    import math
    z = sum(v * cmath.exp(2j * math.pi * (i + 1) / p) for i, v in enumerate(w) if v)
    tot = sum(w) or 1
    ph = (cmath.phase(z) / (2 * math.pi)) * p % p
    return abs(z) / tot, ph


def block_size(im: Image.Image, lo=1.5, hi=10.0, default=4.0):
    """Size of one painted 'pixel' in image pixels (may be fractional, e.g. 4.3), plus the grid phase in x and y.
    Edges of real pixel art fall on a regular grid; the largest period on which the edges line up is the pixel size
    (halves and thirds of it line up too, which is why the largest good one wins)."""
    g = im.convert("L")
    wx, wy = _edge_profile(g, 0), _edge_profile(g, 1)
    scores = []
    p = lo
    while p <= hi:
        cx, _ = _coherence(wx, p)
        cy, _ = _coherence(wy, p)
        scores.append((p, (cx + cy) / 2))
        p = round(p + 0.05, 2)
    best = max(sc for _, sc in scores)
    if best < 0.25:
        # Image-model pixels drift and have no exact grid (the painted faces measure the same way). Use the
        # density the faces were judged at: about 4 image pixels per painted pixel (see SCENES "pixel").
        return default, (0.0, 0.0), scores
    k = max(pp for pp, sc in scores if sc >= best * 0.85)
    # refine around k
    k = max(((q, (_coherence(wx, q)[0] + _coherence(wy, q)[0]) / 2) for q in [k + d / 100 for d in range(-6, 7)]), key=lambda t: t[1])[0]
    return k, (_coherence(wx, k)[1], _coherence(wy, k)[1]), scores


def to_grid(im: Image.Image, k, phase):
    """Shrink so each painted pixel becomes one real pixel, aligned to the painted grid."""
    px, py = phase
    W, H = int((im.width - px) / k + 1e-6), int((im.height - py) / k + 1e-6)
    return im.resize((W, H), Image.BOX, box=(px, py, px + W * k, py + H * k))


def shared_palette(images, n, keep=12):
    """One palette for several pictures. Median cut picks most colours by area, which would drop small bright
    things (a lantern flame, a lit window); `keep` extra colours are chosen from the brightest pixels alone."""
    W, H = images[0].size
    both = Image.new("RGB", (W * len(images), H))
    for i, im in enumerate(images):
        both.paste(im, (W * i, 0))
    base = both.quantize(colors=n - keep, method=Image.MEDIANCUT, dither=Image.NONE).getpalette()[: (n - keep) * 3]
    px = list(both.getdata())
    cut = sorted(lum(c) for c in px)[int(len(px) * 0.985)]
    bright = [c for c in px if lum(c) >= cut] or px[:1]
    strip = Image.new("RGB", (len(bright), 1)); strip.putdata(bright)
    hi = strip.quantize(colors=keep, method=Image.MAXCOVERAGE, dither=Image.NONE).getpalette()[: keep * 3]
    pal = Image.new("P", (1, 1)); pal.putpalette(base + hi + [0] * (768 - len(base) - len(hi)))
    return pal


def derive_lost(lit: Image.Image):
    """The map's lost plate when no painted one is used: colour drained and tinted grey-blue, a little darker
    (the same look as tideTint in src/ui/pixel/world.js)."""
    g = lit.convert("L").convert("RGB")
    grey = Image.blend(lit.convert("RGB"), g, 0.8)
    r, gg, b = grey.split()
    return Image.merge("RGB", (r.point(lambda v: int(v * 0.62 + 10)), gg.point(lambda v: int(v * 0.68 + 14)), b.point(lambda v: int(v * 0.78 + 24))))


def derive_dark(lit: Image.Image):
    """A dark plate from the lit one (when no dark painting is used): same pixels, a little over half the light, cooler.
    Kept fairly bright so the rest of the picture still reads; the lights then warm their surroundings."""
    r, g, b = lit.convert("RGB").split()
    r = r.point(lambda v: int(v * 0.58 + 4)); g = g.point(lambda v: int(v * 0.62 + 5)); b = b.point(lambda v: int(v * 0.76 + 10))
    return Image.merge("RGB", (r, g, b))


def aligned(lit: Image.Image, dark: Image.Image):
    """Edges of the two plates should match (the dark one is an edit). Returns the mean edge difference (0 = identical)."""
    e = lambda im: ImageOps.autocontrast(im.convert("L")).filter(ImageFilter.FIND_EDGES)  # noqa: E731
    return ImageStat.Stat(ImageChops.difference(e(lit), e(dark))).mean[0]


def lum(c):
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]


def find_lights(lit: Image.Image, dark: Image.Image, cell=6):
    """Light sources = where lit is much brighter than dark. Coarse grid, local peaks, radius from how far the glow spreads."""
    W, H = lit.size
    gw, gh = W // cell, H // cell
    L, D = lit.convert("RGB").resize((gw, gh), Image.BOX).load(), dark.convert("RGB").resize((gw, gh), Image.BOX).load()
    diff = [[max(0.0, lum(L[x, y]) - lum(D[x, y])) for x in range(gw)] for y in range(gh)]
    top = max(max(r) for r in diff) or 1
    peaks = []
    for y in range(gh):
        for x in range(gw):
            v = diff[y][x]
            if v < top * 0.45:
                continue
            if all(v >= diff[j][i] for j in range(max(0, y - 3), min(gh, y + 4)) for i in range(max(0, x - 3), min(gw, x + 4))):
                peaks.append((v, x, y))
    lights = []
    for v, x, y in sorted(peaks, reverse=True):
        if any(abs(x - l[0]) < 6 and abs(y - l[1]) < 6 for l in lights):
            continue
        reach = 1  # walk outwards until the glow falls below 18% of this peak
        while reach < max(gw, gh) // 2:
            ring = [diff[j][i] for j in (y - reach, y + reach) for i in range(x - reach, x + reach + 1) if 0 <= j < gh and 0 <= i < gw]
            if not ring or max(ring) < v * 0.18:
                break
            reach += 1
        c = L[x, y]
        warm = c[0] > c[2] + 25
        lights.append((x, y, reach, v / top, warm))
        if len(lights) >= 8:
            break
    return [{"x": round((x + 0.5) * cell), "y": round((y + 0.5) * cell), "r": round(reach * cell * 1.15), "i": round(0.9 + 0.7 * s, 2),
             "flicker": 1 if warm else 0} for x, y, reach, s, warm in lights]


def find_flames(lit: Image.Image, scale_k):
    """Small very bright warm blobs (painted flames): their bottom-centre is where the game draws a living flame."""
    W, H = lit.size
    px = lit.convert("RGB").load()
    hot = bytearray(W * H)
    for y in range(H):
        for x in range(W):
            r, g, b = px[x, y]
            if r > 215 and g > 140 and r > b + 60:
                hot[y * W + x] = 1
    seen, blobs = bytearray(W * H), []
    for i in range(W * H):
        if hot[i] and not seen[i]:
            stack, pts = [i], []
            seen[i] = 1
            while stack:
                j = stack.pop(); pts.append(j)
                x, y = j % W, j // W
                for n in (j - 1 if x else -1, j + 1 if x < W - 1 else -1, j - W, j + W):
                    if 0 <= n < W * H and hot[n] and not seen[n]:
                        seen[n] = 1; stack.append(n)
            if 4 <= len(pts) <= W * H * 0.004:
                xs, ys = [j % W for j in pts], [j // W for j in pts]
                blobs.append((len(pts), sum(xs) / len(xs), max(ys), max(ys) - min(ys) + 1))
    blobs.sort(reverse=True)
    # tiny far-off windows are not flames: keep blobs at least a quarter the size of the biggest one
    blobs = [b for b in blobs if b[0] >= blobs[0][0] * 0.25] if blobs else blobs
    keep = []  # one flame per light source: a glow and its reflection close by count once
    for b in blobs:
        if all(abs(b[1] - k[1]) > 16 * scale_k or abs(b[2] - k[2]) > 16 * scale_k for k in keep):
            keep.append(b)
    return [[round(cx), by, round(max(scale_k * 0.6, min(scale_k * 1.4, hgt / 9)), 2)] for _, cx, by, hgt in keep[:6]]


def find_lamps(lit: Image.Image, dark: Image.Image, limit=320):
    """Small warm lights in the restored map (windows, street lamps) that are not lit in the lost one: [x, y] of each
    blob's brightest pixel. WorldMap.jsx flickers them where the district is restored."""
    W, H = lit.size
    L, D = lit.convert("RGB").load(), dark.convert("RGB").load()
    hot = bytearray(W * H)
    for y in range(H):
        for x in range(W):
            r, g, b = L[x, y]
            if r > 200 and g > 130 and r > b + 70 and lum(L[x, y]) > lum(D[x, y]) + 40:
                hot[y * W + x] = 1
    seen, out = bytearray(W * H), []
    for i in range(W * H):
        if hot[i] and not seen[i]:
            stack, pts = [i], []
            seen[i] = 1
            while stack:
                j = stack.pop(); pts.append(j)
                x, y = j % W, j // W
                for n in (j - 1 if x else -1, j + 1 if x < W - 1 else -1, j - W, j + W):
                    if 0 <= n < W * H and hot[n] and not seen[n]:
                        seen[n] = 1; stack.append(n)
            if len(pts) <= 30:
                j = max(pts, key=lambda q: lum(L[q % W, q // W]))
                out.append([j % W, j // W])
    out.sort(key=lambda q: (q[1], q[0]))
    step = max(1, len(out) // limit)
    return out[::step][:limit]


# ---------------------------------------------------------------- ship
def stage_ship(sid, source, grid, dark_mode, width=None):
    cfg = SCENES[sid]
    lit_src = Path(source) if source.endswith(".png") else DRAFTS / f"{sid}_lit_{source}.png"
    dark_src = DRAFTS / f"{sid}_dark_{source}.png"
    if not lit_src.exists():
        print("missing", lit_src, "(run paint, or standin to test)"); return 1
    lit_big = Image.open(lit_src).convert("RGB")
    if grid:
        k, phase = grid, (0.0, 0.0)
    elif width:  # pick the pixel size that gives a picture about `width` art pixels wide (owner: ~960 px, Nov 8, 2026)
        k, phase = lit_big.width / width, (0.0, 0.0)
    else:
        k, phase, _ = block_size(lit_big, default=cfg.get("pixel", 2.0))
    print(f"painted pixel size: {k:.2f} image pixels, grid offset ({phase[0]:.1f}, {phase[1]:.1f})")
    if cfg.get("capture") == "map" and width and not cfg.get("free"):  # the code-guided map must match the code map exactly (240x320 x a whole number)
        aw, ah = cfg["aspect_wh"]
        lit = lit_big.resize((width, width * ah // aw), Image.BOX)
    else:
        lit = to_grid(lit_big, k, phase)
    W, H = lit.size
    derived = True
    if dark_mode == "paint" and dark_src.exists():
        dark = to_grid(Image.open(dark_src).convert("RGB"), k, phase).resize((W, H), Image.NEAREST)
        a = aligned(lit, dark)
        print(f"dark/lit edge difference {a:.1f}")
        if a > cfg.get("align_max", 28):
            print("  dark picture does not line up with the lit one; using a derived dark plate instead (--dark derive)")
        else:
            derived = False
            if cfg.get("derive") == "lost":  # the painted lost city keeps its overgrowth but loses its colour and warmth
                dark = derive_lost(dark)
    if derived:
        dark = derive_lost(lit) if cfg.get("derive") == "lost" else derive_dark(lit)
    # one palette for both plates, so revealing lit over dark never needs a colour the palette lacks
    pal = shared_palette([lit, dark], cfg["colours"])
    ql, qd = lit.quantize(palette=pal, dither=Image.NONE), dark.quantize(palette=pal, dither=Image.NONE)
    files, total = {}, 0
    for name, q in (("lit", ql),) if cfg.get("single") else (("lit", ql), ("dark", qd)):
        dest, size = ship.save_best(q, None, SCENE_ART / f"{sid}_{name}")
        files[name], total = dest.name, total + size
    if cfg.get("single"):  # one picture only: the game draws it as both plates
        files["dark"] = files["lit"]
        for old in SCENE_ART.glob(f"{sid}_dark.*"):
            old.unlink()
    # read the finished pictures: where the light comes from and where flames burn
    litr, darkr = ql.convert("RGB"), qd.convert("RGB")
    lights = [] if derived else find_lights(litr, darkr)  # a darkened copy has no light sources to find
    # map the code scene's points into this picture (the guide sat centred in the painting)
    g = Image.open(guide_path(sid)) if guide_path(sid).exists() else None
    if g:
        aw, ah = cfg["aspect_wh"]
        s = min(W / g.width, H / g.height)
        ox, oy = (W - g.width * s) / 2, (H - g.height * s) / 2
    else:
        s, ox, oy = H / 112, 0, 0
    P = lambda x, y: [round(x * s + ox), round(y * s + oy)]  # noqa: E731
    pts = {} if source.endswith(".png") else cfg.get("points", {})  # another picture's layout does not match the code scene
    flames = find_flames(litr, s) or [P(*t) + [round(s * 0.8, 2)] for t in pts.get("torches", [])]
    if not lights and derived and find_flames(litr, s):  # no dark painting: each flame found in the picture is a flickering light
        lights = [{"x": f[0], "y": f[1] - round(4 * s), "r": round(55 * s), "i": 1.45, "flicker": 1} for f in flames]
    if not lights:  # the code scene's own lights, mapped into the picture
        lights = [{"x": P(*l[:2])[0], "y": P(*l[:2])[1], "r": round(l[2] * s), "i": l[3], "flicker": l[4]} for l in pts.get("lights", [])]
    entry = {"w": W, "h": H, "files": files, "lights": lights, "flames": flames, "mist": None if source.endswith(".png") else cfg.get("mist") and list(cfg["mist"]),
             "alt": cfg["alt"], "source": source, "pixel": round(k, 2)}
    if cfg.get("capture") in ("map", "title"):  # these flicker their lanterns and windows instead; no scene lights or flames
        entry.update(lights=[], flames=[], lamps=find_lamps(litr, darkr) if not cfg.get("single") else find_lamps(litr, derive_dark(litr)))
        print(f"lanterns found: {len(entry['lamps'])}")
    sx, sy = W / lit_big.width, H / lit_big.height
    anchors = cfg.get("anchors", {}).get(source)
    if anchors:  # district boxes on the painting's own buildings (picked by eye from the source picture)
        entry["anchors"] = {d: [round(x * sx), round(y * sy), round(w * sx), round(h * sy)] for d, (x, y, w, h) in anchors.items()}
    if cfg.get("sea", {}).get(source) is not None:
        entry["sea"] = round(cfg["sea"][source] * sy)
    if "door" in pts:
        entry["door"] = P(*pts["door"])
    if "shaft" in pts:
        a, b, c, d = pts["shaft"]; entry["shaft"] = P(a, b) + P(c, d)
    write_manifest({**read_entries(), sid: entry})
    print(f"shipped {sid}: {W}x{H}, {cfg['colours']} colours, {len(lights)} lights, {len(flames)} flames, {total / 1024:.1f} KB")
    budget()
    review_sheet(sid, ql, qd, entry)
    return 0


def read_entries():
    p = HERE / "scenes.json"
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}


def write_manifest(entries):
    SCENE_ART.mkdir(parents=True, exist_ok=True)
    (HERE / "scenes.json").write_text(json.dumps(entries, indent=1), encoding="utf-8")
    lines = ["// Generated by tools/asset-studio/motion.py. Do not edit by hand (re-run the script instead).",
             "// Painted scenes: two matching pictures per scene (dark and lit) from the local image model, animated in code",
             "// by src/pixel/painted.js. Positions (lights, flames, door, shaft) are in the picture's own pixels."]
    body = []
    for n, (sid, e) in enumerate(sorted(entries.items())):
        lines.append(f"import d{n} from '../assets/art/scene/{e['files']['dark']}';")
        lines.append(f"import l{n} from '../assets/art/scene/{e['files']['lit']}';")
        extra = {k: e[k] for k in ("lights", "flames", "mist", "door", "shaft", "lamps", "anchors", "sea") if k in e}
        fields = ", ".join(f"{k}: {json.dumps(v)}" for k, v in extra.items())
        body.append(f" '{sid}': {{ w: {e['w']}, h: {e['h']}, dark: d{n}, lit: l{n}, model: 'qwen-image-2.1', source: '{e['source']}', "
                    f"{fields}, alt: {json.dumps(e['alt'])} }},")
    MANIFEST.write_text("\n".join(lines) + "\n\nexport const SCENES = {\n" + "\n".join(body) + ("\n" if body else "") + "};\n", encoding="utf-8")


def budget():
    total = sum(p.stat().st_size for p in ship.ART_DIR.rglob("*") if p.is_file() and p.suffix in (".png", ".webp"))
    print(f"art folder now {total / 1024:.1f} KB of {ship.BUDGET_KB} KB{'  OVER BUDGET' if total / 1024 > ship.BUDGET_KB else ''}")


def review_sheet(sid, ql, qd, e):
    """Guide | lit | dark | lights and flames found, at 2x, plus a face picture at the same 2x for comparing pixel density."""
    lit, dark = ql.convert("RGB"), qd.convert("RGB")
    W, H = lit.size
    marks = lit.copy(); d = ImageDraw.Draw(marks)
    for l in e["lights"]:
        d.ellipse((l["x"] - l["r"], l["y"] - l["r"], l["x"] + l["r"], l["y"] + l["r"]), outline=(255, 120, 40) if l["flicker"] else (120, 180, 255))
    for f in e["flames"]:
        d.rectangle((f[0] - 2, f[1] - 2, f[0] + 2, f[1] + 2), outline=(255, 255, 255))
    if "door" in e:
        d.rectangle((e["door"][0] - 3, e["door"][1] - 3, e["door"][0] + 3, e["door"][1] + 3), outline=(80, 255, 120))
    tiles = [lit, dark, marks]
    if guide_path(sid).exists() and not SCENES[sid].get("free"):
        g = Image.open(guide_path(sid)).convert("RGB")
        s = min(W / g.width, H / g.height)
        gp = Image.new("RGB", (W, H), (10, 11, 18)); gi = g.resize((round(g.width * s), round(g.height * s)), Image.NEAREST)
        gp.paste(gi, ((W - gi.width) // 2, (H - gi.height) // 2)); tiles.insert(0, gp)
    face = next(iter(sorted((studio.OUT / "faces" / "cast").glob("p0*.png"))), None)
    z = 2 if W <= 600 else 1  # wide (high-detail) scenes are shown at 1x so the sheet stays a sane size
    sheet = Image.new("RGB", (W * z * 2 + 12, (H * z + 18) * ((len(tiles) + 1) // 2) + (300 if face else 0)), (15, 20, 32))
    dr = ImageDraw.Draw(sheet)
    names = (["code guide"] if len(tiles) == 4 else []) + ["lit", "dark", "lights (orange flicker, blue steady), flames, door"]
    for n, (t, nm) in enumerate(zip(tiles, names)):
        x, y = (n % 2) * (W * z + 12), (n // 2) * (H * z + 18)
        sheet.paste(t.resize((W * z, H * z), Image.NEAREST), (x, y)); dr.text((x + 4, y + H * z + 3), nm, fill=(239, 230, 210))
    if face:
        fi = Image.open(face).convert("RGB")
        fk, fph, _ = block_size(fi)
        fs = to_grid(fi, fk, fph)
        fs = fs.resize((fs.width * z, fs.height * z), Image.NEAREST)
        y = sheet.height - 290
        sheet.paste(fs.crop((0, 0, min(fs.width, 280), min(fs.height, 280))), (4, y))
        dr.text((300, y + 4), f"face picture ({face.name}) at the same {z}x: pixel size should look alike", fill=(239, 230, 210))
    out = DRAFTS / f"{sid}_sheet.png"
    DRAFTS.mkdir(parents=True, exist_ok=True)
    sheet.save(out)
    print("review sheet:", out)


def stage_gif(sid, count=36):
    frames_dir = DRAFTS / f"{sid}_frames"
    subprocess.run(["node", str(HERE / "scene_capture.mjs"), "frames", str(frames_dir), str(count)], cwd=ROOT, check=True)
    fr = [Image.open(p).convert("RGB") for p in sorted(frames_dir.glob("f*.png"))]
    fr = [f.resize((f.width * 2, f.height * 2), Image.NEAREST) if f.width <= 600 else f for f in fr]
    out = DRAFTS / f"{sid}.gif"
    fr[0].save(out, save_all=True, append_images=fr[1:], duration=83, loop=0, optimize=True)
    print("review gif:", out)


def stage_compare(sid, old_dir, show=960):
    """Before and after, each shown whole at the same width on screen (`show` px: the new one at 1:1), plus the
    middle of each blown up 3x so the pixel detail can be judged."""
    def plate(folder):
        f = next((q for q in (Path(folder) / f"{sid}_lit.webp", Path(folder) / f"{sid}_lit.png") if q.exists()), None)
        return Image.open(f).convert("RGB") if f else None
    old, new = plate(old_dir), plate(SCENE_ART)
    if not old or not new:
        print("need both", old_dir, "and", SCENE_ART); return 1
    rows = []
    for im, nm in ((old, "before"), (new, "after")):
        h = round(im.height * show / im.width)
        whole = im.resize((show, h), Image.NEAREST)
        cw, ch = round(show / 3 / 3), round(h / 3 / 3)  # a ninth of the width, in screen pixels, blown up 3x
        cx, cy = show // 2, h // 2
        zoom = whole.crop((cx - cw // 2, cy - ch // 2, cx + cw // 2, cy + ch // 2)).resize((cw // 2 * 2 * 3, ch // 2 * 2 * 3), Image.NEAREST)
        rows.append((whole, zoom, f"{nm}: {im.width}x{im.height} picture pixels, shown {show} px wide"))
    W = show + 16 + max(z.width for _, z, _ in rows)
    H = sum(max(w.height, z.height) + 24 for w, z, _ in rows)
    sheet = Image.new("RGB", (W, H), (15, 20, 32)); dr = ImageDraw.Draw(sheet)
    y = 0
    for whole, zoom, nm in rows:
        sheet.paste(whole, (0, y)); sheet.paste(zoom, (show + 16, y))
        dr.text((4, y + max(whole.height, zoom.height) + 6), nm + "   |   right: the middle, 3x", fill=(239, 230, 210))
        y += max(whole.height, zoom.height) + 24
    out = DRAFTS / f"{sid}_compare.png"
    sheet.save(out)
    print("comparison:", out)
    return 0


# Fine-pixel look for the map (owner, Nov 8, 2026: the painted map "still looks too pixelated"): ask for small, dense pixels.
LOOK_FINE = ("Highly detailed high-resolution pixel art illustration with very small fine pixels and dense intricate detail, like a large "
             "hand-made pixel-art poster, not chunky, not low resolution, clean dark outlines, soft many-step shading, deep teal-black night, "
             "warm amber lamplight, grey-brown stone, neutral natural colour balance with true greys and warm browns and no colour cast, original fantasy setting.")

NEG_FINE = NEG + ", chunky pixels, low resolution, blocky, jpeg artifacts"
SCENES["world_map"]["lit"] = ("Seen from a high bird's-eye view at a steep three-quarter angle, the whole city in frame, every district clearly "
                              "separate. ")  # + MAP_CITY below

# Map view ideas (owner, Nov 8, 2026: "the world map needs to be better, its view is not that great"). Free paintings
# with no layout guide, one per viewpoint, for the owner to pick a reference from. Drafts only, never shipped.
MAP_CITY = ("Veyra, an original fantasy city: a walled city of seven stacked stone terraces climbing a hill above a dark sea. A river "
            "runs down through the middle in a chain of small waterfalls under stone bridges. Landmarks: a long columned archive hall "
            "and a green-domed library at the very top, an old amphitheatre, a tall glass spire, a great zigzag stone stair, a slate "
            "chapel, a long white arched bridge, a tall timber counting house, a clock tower beside market stalls, a columned gallery, "
            "a round domed hall, and a harbour quay with small sailing boats at the bottom. Warm lit windows, gardens, street lamps.")
SCENES["world_map"]["lit"] += MAP_CITY
MAP_VIEWS = {
    "birdseye": "Seen from a high bird's-eye view at a steep three-quarter angle, like a classic 16-bit role-playing game town map, the whole city in frame.",
    "island": "The city fills a round terraced island rising from the sea, each terrace ringed by its wall, seen from above at an angle.",
    "isometric": "An isometric diorama of the whole city on its hill, cut away at the edges like a game board, clean readable districts.",
    "topdown": "A straight top-down game map, like a hand-made 16-bit overworld: clear streets, rooftops, walls and the river, every district easy to tell apart.",
    "seaview": "Seen from out at sea at night, the terraces stacked up the cliff like a lit layer cake, the harbour in front, the archive crowning the top.",
    "moonlit": "A night aerial view in moonlight, mist in the low streets, lanterns along every wall, the waterfalls glinting, the whole city in frame.",
    "parchment": "A painted fantasy world map in pixel art: the city in the middle, its districts drawn as small detailed buildings, surrounded by fields, roads, forest and coast.",
    "valley": "The city on a steep valley side seen from across the valley, terraces climbing to the archive, the river spilling down to the harbour.",
}


def stage_ideas(mp=1.6, aspect="3:4 (Portrait Standard)", only=None):
    out_dir = DRAFTS / "map_ideas"
    out_dir.mkdir(parents=True, exist_ok=True)
    wf0 = json.loads((studio.STUDIO / "comfy_qwen_workflow.json").read_text(encoding="utf-8"))
    studio.free_llm()
    if not studio.start_comfy():
        studio.log("ComfyUI did not start"); return
    try:
        for n, (vid, view) in enumerate(MAP_VIEWS.items()):
            if only and vid not in only:
                continue
            dest = out_dir / f"{vid}.png"
            if dest.exists():
                continue
            wf = json.loads(json.dumps(wf0))
            for node in wf.values():
                ct, inp = node["class_type"], node["inputs"]
                if ct.startswith("TextEncodeQwenImage"):
                    inp["prompt"], inp["negative_prompt"] = f"{view} {MAP_CITY} {LOOK_FINE}", NEG + ", chunky pixels, low resolution, blocky"
                elif ct == "KSampler":
                    inp["seed"], inp["steps"] = 130000 + n, STEPS
                elif ct == "ResolutionSelector":
                    inp["aspect_ratio"], inp["megapixels"] = aspect, mp
                elif ct.startswith("SaveImage"):
                    inp["filename_prefix"] = "mnemos_mapidea"
            run_wf(wf, dest, f"map idea {vid}")
        ideas_sheet(out_dir)
    finally:
        try:
            studio.comfy("/free", {"unload_models": True, "free_memory": True})
        except Exception:  # noqa: BLE001
            pass
        if studio.STARTED:
            studio.STARTED.terminate()


def stage_refine(sid, seed_tag, denoise=0.55, mp=None):
    """Second pass: repaint a finished picture in the fine-pixel look (LOOK_FINE), starting from it (image to image),
    so the layout stays and the chunky blocks copied from a code guide turn into fine detail.
    out/motion/<id>_lit_<tag>.png -> <id>_lit_<tag>f.png (ship it with --seed <tag>f)."""
    cfg = SCENES[sid]
    src = DRAFTS / f"{sid}_lit_{seed_tag}.png"
    if not src.exists():
        print("missing", src); return 1
    dest = DRAFTS / f"{sid}_lit_{seed_tag}f.png"
    studio.free_llm()
    if not studio.start_comfy():
        studio.log("ComfyUI did not start"); return 1
    try:
        ref = upload(Image.open(src).convert("RGB"), f"mnemos_{sid}_{seed_tag}_refine.png")
        run_wf(edit_wf(f"{cfg['lit']} {LOOK_FINE}", ref, 150000, cfg["aspect"], mp or cfg["megapixels"], denoise), dest, f"{sid} refine {seed_tag} denoise {denoise}")
    finally:
        try:
            studio.comfy("/free", {"unload_models": True, "free_memory": True})
        except Exception:  # noqa: BLE001
            pass
        if studio.STARTED:
            studio.STARTED.terminate()
    return 0


def ideas_sheet(out_dir):
    ims = [(p.stem, Image.open(p).convert("RGB")) for p in sorted(out_dir.glob("*.png")) if p.stem != "sheet"]
    if not ims:
        return
    tw, th = 480, 640
    sheet = Image.new("RGB", (4 * (tw + 10), ((len(ims) + 3) // 4) * (th + 24)), (15, 20, 32)); dr = ImageDraw.Draw(sheet)
    for i, (nm, im) in enumerate(ims):
        x, y = (i % 4) * (tw + 10), (i // 4) * (th + 24)
        sheet.paste(im.resize((tw, th), Image.LANCZOS), (x, y)); dr.text((x + 4, y + th + 6), nm, fill=(239, 230, 210))
    sheet.save(out_dir / "sheet.png")
    print("ideas sheet:", out_dir / "sheet.png")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("stage", choices=["guide", "paint", "ship", "standin", "gif", "compare", "ideas", "refine"])
    ap.add_argument("--scene", default="crypt_entrance", help="scene id, or a comma list for paint (e.g. crypt_chamber_bones,crypt_chamber_water)")
    ap.add_argument("--seeds", type=int, default=2)
    ap.add_argument("--mp", type=float)
    ap.add_argument("--seed", default="s0", help="which painted pair to ship: s0, s1, ..., 'standin', or a path to any painted .png (dark is then derived)")
    ap.add_argument("--grid", type=float, help="painted pixel size in image pixels (default: measured)")
    ap.add_argument("--width", type=int, help="ship about this many art pixels wide (sets the pixel size from the painting's width; e.g. 960)")
    ap.add_argument("--dark", choices=["paint", "derive"], default="paint")
    ap.add_argument("--lit-only", action="store_true", help="paint: lit pictures only (choose one, then paint its dark version)")
    ap.add_argument("--denoise", type=float, help="refine: how much to repaint (0.4 keeps more, 0.7 changes more)")
    ap.add_argument("--old", default=str(DRAFTS / "backup_528"), help="compare: folder holding the older shipped plates")
    a = ap.parse_args()
    global LIT_ONLY
    LIT_ONLY = a.lit_only
    if a.stage == "guide":
        stage_guide(a.scene)
    elif a.stage == "paint":
        for sid in a.scene.split(","):
            stage_paint(sid, a.seeds, a.mp or SCENES[sid]["megapixels"])
    elif a.stage == "standin":
        stage_standin(a.scene)
    elif a.stage == "ship":
        return stage_ship(a.scene, a.seed, a.grid, a.dark, a.width)
    elif a.stage == "gif":
        stage_gif(a.scene)
    elif a.stage == "refine":
        return stage_refine(a.scene, a.seed, a.denoise or 0.55, a.mp)
    elif a.stage == "ideas":
        stage_ideas(a.mp or 1.6)
    elif a.stage == "compare":
        return stage_compare(a.scene, a.old)
    return 0


if __name__ == "__main__":
    sys.exit(main())
