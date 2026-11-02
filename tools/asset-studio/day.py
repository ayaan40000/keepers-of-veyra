"""Mnemos art director: DAY (and dawn) versions of the finished NIGHT scenes.

Each day picture is made from its night picture so it is clearly the same place (same layout, camera and props); only
light, sky, colour and mist change. Method: the Qwen-Image 2.1 text encoder accepts reference images ("images" input of
TextEncodeQwenImage21), so the night render goes in as a reference with an edit-style prompt (METHOD "edit"). If a model
cannot edit, METHOD "img2img" encodes the night picture with the VAE and denoises it partly (see DENOISE).

  python tools/asset-studio/day.py --test district_M3          try the settings on one scene (writes out/day/<id>_<variant>.png)
  python tools/asset-studio/day.py                             all day scenes with the chosen method and settings
  python tools/asset-studio/day.py --sheet                     only rebuild out/day-night-sheet.png
The source for each day picture is the FULL-SIZE night render in out/new/ (seed in ship.PICK, default 0), not the shipped file.
Settings used are written to art-jobs.json under "day".
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.parse
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import gen  # noqa: E402
import ship  # noqa: E402
import studio  # noqa: E402

DAY = studio.OUT / "day"
METHOD = "edit"       # "edit" (reference image into the encoder) or "img2img" (VAE-encode the night picture)
DENOISE = 0.62        # img2img only
STEPS = 15
MEGAPIXELS = 0.28
REF_RES = 512    # TextEncodeQwenImage21 "resolution": the reference picture is resized to about this many pixels square
REF_W = 720        # >0: shrink the night picture to this width (16:9) before uploading it

DAY_LOOK = ("16-bit pixel art game illustration, crisp square pixels, dark outlines kept, limited palette of daylight colours: sky blue, "
            "warm sun yellow, cream, sandstone, terracotta roof red, moss green, river teal and soft violet shadows.")
COMMON = ("Keep the exact layout, camera angle, buildings and every object exactly where they are; change only the lighting, sky, colours and mist. "
          "Any lamps stay in place but are unlit. No text, no letters, no people.")

# night ship id -> (time, how the same place looks at that hour)
DAYS = {
    "backdrop_gala": ("day", "sunlight streams through the tall windows onto the ballroom floor, bright and airy, the chandelier lamps unlit, pale mist almost gone over the water"),
    "backdrop_packing_bay": ("day", "the quay in bright morning light, blue sky, low sun, warm light on crates and barrels, teal water, a little pale mist at the water's edge"),
    "backdrop_speech_hall": ("day", "daylight pours through the high window into the hall, warm light on the stone benches and lectern, the lantern unlit, water calm and clear"),
    "backdrop_crossroads": ("day", "midday sun, bright blue sky with small clouds, green grass and warm dust road, crisp shadows, the lantern unlit"),
    "backdrop_night_market": ("day", "a busy sunny market square by day, bright striped awnings, sunlit cobbles, stalls full of goods, paper lanterns hung up but unlit, blue sky between the roofs"),
    "backdrop_tide_shore": ("dawn", "dawn on the shore, pale peach and gold sky, soft low mist thinning over calm teal water, the little lamp unlit, gentle and peaceful"),
    "district_M1": ("day", "bright morning on the quay, blue sky, warm sun, terracotta roofs, teal river, the lamp posts unlit, a little mist at the water's edge"),
    "district_M2": ("day", "daylight through high windows lights the gallery, cream and sandstone walls, bright floor, lamps in the alcoves unlit"),
    "district_M3": ("day", "daylight from above lights the hall, cream and sandstone portrait niches, soft violet shadows, the small lamps unlit"),
    "district_M4": ("day", "sunlight from high windows over the counting hall, warm brick and sandstone, brass shining, the green lamps unlit"),
    "district_M5": ("day", "a bright sunny market square, blue sky, the brass clock tower shining, terracotta roofs, cream stone"),
    "district_M6": ("day", "a sunny bridge, bright blue sky, warm sandstone carvings, colourful flags, teal river, pale mist retreating at the water"),
    "district_M7": ("day", "sunlight from the dome windows lights the library, warm wood and sandstone, copper dome shining, candles unlit"),
    "district_M8": ("day", "bright daylight on the wet stone stair, blue sky, teal water, a thin pale mist at the bottom steps, lamps unlit"),
    "district_M9": ("day", "bright sunlit courtyard, mirrors reflecting blue sky, cream tiles, soft violet shadows, the fountain sparkling"),
    "district_M10": ("day", "bright midday, blue sky with clouds, green hills, warm sun, the lantern unlit"),
    "district_M11": ("day", "sunny afternoon at the amphitheatre, blue sky, warm sandstone tiers, lamps unlit, soft violet shadows"),
    "district_M12": ("day", "bright morning at the great gate, blue sky, warm sandstone, the thirteen lamps unlit, a pale mist drifting through the open doors"),
    "event_tide_rising": ("dawn", "dawn: a pale golden and pink sky, the white mist wall glowing softly and thinning, rooftops lit by the first sun, lamps unlit"),
    "event_year_of_keeping": ("day", "a daytime festival: bright blue sky, warm sun, colourful lanterns and bunting hung across streets and windows, rooftops in terracotta, river teal"),
    "event_lethe_gate_vigil": ("dawn", "sunrise at the gate: a gold and pink sky behind the gate, warm light on the stone, the thirteen lamps held up but unlit, the mist pale and thin"),
    "event_undercroft_entrance": ("day", "daylight from above spills down the stair into the Undercroft, warm sunlit steps, the lantern unlit, cool shadow at the bottom"),
}


def prompt_for(sid):
    t, d = DAYS[sid]
    if METHOD == "edit":
        return f"Edit this pixel-art picture into the same scene by {'daytime' if t == 'day' else 'dawn'}: {d}. {COMMON} {DAY_LOOK}"
    return f"{DAY_LOOK} The same scene by {'day' if t == 'day' else 'dawn'}: {d}. {COMMON}"


def night_src(sid):
    job = {s: j for s, j, *_ in ship.NEWROWS}[sid]
    return studio.OUT / "new" / f"{job}_s{ship.PICK.get(job, 0)}.png"


def upload(path: Path) -> str:
    """Upload a picture to ComfyUI's input folder (multipart) and return its name."""
    name = f"mnemos_{path.stem}_{REF_W}.png"
    if REF_W:
        from PIL import Image
        small = DAY / "_ref" / name
        small.parent.mkdir(parents=True, exist_ok=True)
        Image.open(path).convert("RGB").resize((REF_W, round(REF_W * 9 / 16)), Image.BOX).save(small)
        path = small
    b = uuid.uuid4().hex
    body = (f"--{b}\r\nContent-Disposition: form-data; name=\"image\"; filename=\"{name}\"\r\nContent-Type: image/png\r\n\r\n").encode() + path.read_bytes() + (
        f"\r\n--{b}\r\nContent-Disposition: form-data; name=\"overwrite\"\r\n\r\ntrue\r\n--{b}--\r\n").encode()
    req = urllib.request.Request(studio.COMFY + "/upload/image", body, {"content-type": f"multipart/form-data; boundary={b}"})
    return json.loads(urllib.request.urlopen(req, timeout=60).read())["name"]


import urllib.request  # noqa: E402


def build(sid, image_name, seed, method, denoise):
    wf = json.loads((studio.STUDIO / "comfy_qwen_workflow.json").read_text(encoding="utf-8"))
    enc = next(k for k, n in wf.items() if n["class_type"].startswith("TextEncodeQwenImage"))
    vae = next(k for k, n in wf.items() if n["class_type"] == "VAELoader")
    ks = next(k for k, n in wf.items() if n["class_type"] == "KSampler")
    res = next(k for k, n in wf.items() if n["class_type"] == "ResolutionSelector")
    wf[res]["inputs"].update({"aspect_ratio": "16:9 (Widescreen)", "megapixels": MEGAPIXELS})
    wf["900"] = {"class_type": "LoadImage", "inputs": {"image": image_name}}
    wf[enc]["inputs"].update({"prompt": prompt_for(sid), "negative_prompt": gen.NEG + ", night, dark sky, moon, glowing lamps, lit lamps", "resolution": REF_RES})
    wf[ks]["inputs"].update({"seed": seed, "steps": STEPS})
    vk = vae.split(":")[0] + ":" + vae.split(":")[1] if ":" in vae else vae
    if method == "edit":
        wf[enc]["inputs"]["images.image_1"] = ["900", 0]
        wf[enc]["inputs"]["vae"] = [vae, 0]
    else:
        scaled = "901"
        wf[scaled] = {"class_type": "ImageScale", "inputs": {"image": ["900", 0], "upscale_method": "area", "width": 1024, "height": 576, "crop": "disabled"}}
        wf["902"] = {"class_type": "VAEEncode", "inputs": {"pixels": [scaled, 0], "vae": [vae, 0]}}
        wf[ks]["inputs"]["latent_image"] = ["902", 0]
        wf[ks]["inputs"]["denoise"] = denoise
    for n in wf.values():
        if n["class_type"].startswith("SaveImage"):
            n["inputs"]["filename_prefix"] = "mnemos_day"
    return wf


def render(sid, dest: Path, seed=5150, method=METHOD, denoise=DENOISE):
    if dest.exists():
        return True
    wf = build(sid, upload(night_src(sid)), seed, method, denoise)
    t0 = time.time()
    pid = studio.comfy("/prompt", {"prompt": wf, "client_id": "mnemos-day"})["prompt_id"]
    hist = {}
    for _ in range(1800):
        time.sleep(1)
        hist = studio.comfy(f"/history/{pid}")
        if pid in hist:
            break
    for out in hist[pid].get("outputs", {}).values():
        for im in out.get("images", []):
            q = urllib.parse.urlencode({"filename": im["filename"], "subfolder": im.get("subfolder", ""), "type": im.get("type", "output")})
            dest.write_bytes(studio.comfy(f"/view?{q}", timeout=120))
            studio.log("day", dest.name, f"{time.time() - t0:.0f}s")
            return True
    studio.log("day NO OUTPUT", sid, json.dumps(hist.get(pid, {}).get("status", {}))[:300])
    return False


def record():
    p = Path(__file__).resolve().parent / "art-jobs.json"
    doc = json.loads(p.read_text(encoding="utf-8"))
    doc["day"] = {"method": METHOD, "denoise_if_img2img": DENOISE, "steps": STEPS, "megapixels": MEGAPIXELS, "reference_resolution": REF_RES, "reference_width": REF_W, "seed": 5150,
                  "first_five_made_at (gala, packing_bay, speech_hall, crossroads, night_market)": "0.6 MP, 24 steps, reference 1024 (about 190 s each)",
                  "negative_prompt": gen.NEG + ", night, dark sky, moon, glowing lamps, lit lamps",
                  "note": "Day pictures are edits of the full-size night render (source). Output out/day/<day id>.png, shipped as <night id>-day with time 'day' or 'dawn'.",
                  "jobs": [{"id": f"{sid}-day", "source_night_id": sid, "source_file": f"out/new/{night_src(sid).name}", "time": t, "prompt": prompt_for(sid)} for sid, (t, _) in DAYS.items()]}
    p.write_text(json.dumps(doc, indent=1, ensure_ascii=False), encoding="utf-8")


def pairs_sheet():
    from PIL import Image, ImageDraw
    items = [(sid, DAY / f"{sid}-day.png") for sid in DAYS if (DAY / f"{sid}-day.png").exists()]
    W, H = 400, 225
    sh = Image.new("RGB", (W * 2 + 8, len(items) * (H + 16)), (15, 20, 32)); d = ImageDraw.Draw(sh)
    for n, (sid, dp) in enumerate(items):
        for k, p in enumerate((night_src(sid), dp)):
            im = Image.open(p).convert("RGB").resize((W, H), Image.BOX)
            sh.paste(im, (k * (W + 8), n * (H + 16)))
        d.text((4, n * (H + 16) + H + 2), f"{sid}  night | day", fill=(239, 230, 210))
    sh.save(studio.OUT / "day-night-sheet.png")
    print("sheet", studio.OUT / "day-night-sheet.png", len(items))


def main():
    global METHOD, MEGAPIXELS, STEPS, REF_RES, REF_W

    ap = argparse.ArgumentParser()
    ap.add_argument("--test")
    ap.add_argument("--method", default=METHOD)
    ap.add_argument("--denoise", type=float, nargs="*", default=[0.5, 0.6, 0.7])
    ap.add_argument("--sheet", action="store_true")
    ap.add_argument("--only")
    ap.add_argument("--mp", type=float)
    ap.add_argument("--steps", type=int)
    ap.add_argument("--refres", type=int)
    ap.add_argument("--refw", type=int)
    ap.add_argument("--tag", default="")
    a = ap.parse_args()
    MEGAPIXELS, STEPS = a.mp or MEGAPIXELS, a.steps or STEPS
    REF_RES, REF_W = a.refres or REF_RES, a.refw or REF_W
    METHOD = a.method
    DAY.mkdir(parents=True, exist_ok=True)
    if a.sheet:
        return pairs_sheet()
    if not studio.start_comfy():
        studio.log("ComfyUI did not start")
        return
    try:
        if a.test:
            if METHOD == "edit":
                render(a.test, DAY / f"test_{a.test}_edit{a.tag}.png")
            else:
                for dn in a.denoise:
                    render(a.test, DAY / f"test_{a.test}_i2i{int(dn * 100)}.png", method="img2img", denoise=dn)
        else:
            record()
            for sid in DAYS:
                if not a.only or sid.startswith(a.only):
                    render(sid, DAY / f"{sid}-day.png")
            pairs_sheet()
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
