"""Pictures for the 1.2 drills (facts, jokes, real-life scenes, formula symbols), painted with the local image model.

The job list is test_art_jobs.json (written by the curriculum work): id, category (card, vignette, symbol), prompt, alt.
  python tools/asset-studio/testart.py               paint every job, 2 seeds each -> out/new/<id>_s<n>.png (resumes)
  python tools/asset-studio/testart.py --sheet       contact sheet of both seeds -> out/test_art_sheet*.png
Pick the better seed per id in TEST_PICK (ship.py), then run ship.py. Before painting: one model in VRAM at a time.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.parse
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
import studio  # noqa: E402
from gen import OBJECT_TAIL, STEPS  # noqa: E402
from motion import LOOK_FINE as LOOK, NEG_FINE as NEG  # noqa: E402  fine detailed style (owner, Nov 8, 2026)

HERE = Path(__file__).resolve().parent
NEW = studio.OUT / "new"
JOBS = json.loads((HERE / "test_art_jobs.json").read_text(encoding="utf-8"))
NEG2 = NEG + ", real people, celebrity, numbers, digits, readable signs"

TAILS = {
    "card": (" One clear, slightly funny subject, centred and large, simple uncluttered background, bright readable shapes, "
             "no text, no letters, no numbers, no logos."),
    "vignette": (" A wide, warm everyday scene with small simple figures, cosy and a little funny, clear composition, "
                 "no text, no letters, no numbers, no logos, no readable signs."),
    "symbol": OBJECT_TAIL,
}
# Sizes and steps as the studio measured them on this PC (agent.py PICTURE_SIZES: sticker 0.45/20, photo 0.6/24)
SHAPE = {"card": ("4:3 (Standard)", 0.45), "vignette": ("16:9 (Widescreen)", 0.6), "symbol": ("1:1 (Square)", 0.45)}
STEPS_FOR = {"card": 20, "vignette": 24, "symbol": 20}


def prompt(j):
    return f"{LOOK} {j['prompt'][0].upper() + j['prompt'][1:]}.{TAILS[j['category']]}"


def paint(seeds):
    NEW.mkdir(parents=True, exist_ok=True)
    wf0 = json.loads((studio.STUDIO / "comfy_qwen_workflow.json").read_text(encoding="utf-8"))
    studio.free_llm()
    if not studio.start_comfy():
        studio.log("ComfyUI did not start"); return
    try:
        for s in range(seeds):
            for n, j in enumerate(JOBS["jobs"]):
                dest = NEW / f"{j['id']}_s{s}.png"
                if dest.exists():
                    continue
                aspect, mp = SHAPE[j["category"]]
                wf = json.loads(json.dumps(wf0))
                for node in wf.values():
                    ct, inp = node["class_type"], node["inputs"]
                    if ct.startswith("TextEncodeQwenImage"):
                        inp["prompt"], inp["negative_prompt"] = prompt(j), NEG2
                    elif ct == "KSampler":
                        inp["seed"], inp["steps"] = 140000 + s * 1000 + n, STEPS_FOR[j["category"]]
                    elif ct == "ResolutionSelector":
                        inp["aspect_ratio"], inp["megapixels"] = aspect, mp
                    elif ct.startswith("SaveImage"):
                        inp["filename_prefix"] = "mnemos_testart"
                t0 = time.time()
                pid = studio.comfy("/prompt", {"prompt": wf, "client_id": "mnemos-testart"})["prompt_id"]
                hist = {}
                for _ in range(1800):
                    time.sleep(1)
                    hist = studio.comfy(f"/history/{pid}")
                    if pid in hist:
                        break
                got = False
                for out in hist.get(pid, {}).get("outputs", {}).values():
                    for im in out.get("images", []):
                        q = urllib.parse.urlencode({"filename": im["filename"], "subfolder": im.get("subfolder", ""), "type": im.get("type", "output")})
                        dest.write_bytes(studio.comfy(f"/view?{q}", timeout=120)); got = True
                studio.log("testart", j["id"], f"s{s}", "ok" if got else "NO OUTPUT", f"{time.time() - t0:.0f}s")
        record(seeds)
    finally:
        try:
            studio.comfy("/free", {"unload_models": True, "free_memory": True})
        except Exception:  # noqa: BLE001
            pass
        if studio.STARTED:
            studio.STARTED.terminate()


def record(seeds):
    p = HERE / "art-jobs.json"
    doc = json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}
    doc["test_art"] = [{"id": j["id"], "category": j["category"], "prompt": prompt(j), "negative_prompt": NEG2,
                        "seeds": [140000 + s * 1000 + n for s in range(seeds)], "aspect": SHAPE[j["category"]][0],
                        "megapixels": SHAPE[j["category"]][1], "steps": STEPS_FOR[j["category"]], "model": "qwen-image-2.1"} for n, j in enumerate(JOBS["jobs"])]
    p.write_text(json.dumps(doc, indent=1, ensure_ascii=False), encoding="utf-8")


def sheet():
    """Both seeds side by side, at the size they ship (scaled up 2x), one sheet per category."""
    import ship
    for cat in ("card", "vignette", "symbol"):
        jobs = [j for j in JOBS["jobs"] if j["category"] == cat]
        w, h = ship.SPEC[cat][:2]
        z = 2 if w < 200 else 1
        cw, ch = w * z, h * z
        cols = 3
        rows = (len(jobs) + cols - 1) // cols
        sh = Image.new("RGB", (cols * (2 * cw + 30), rows * (ch + 18)), (15, 20, 32)); d = ImageDraw.Draw(sh)
        for i, j in enumerate(jobs):
            x0, y0 = (i % cols) * (2 * cw + 30), (i // cols) * (ch + 18)
            for s in range(2):
                src = NEW / f"{j['id']}_s{s}.png"
                if not src.exists():
                    continue
                q, trans = ship.process(src, cat, ship.SPEC[cat][:3])
                im = q.convert("RGBA").resize((cw, ch), Image.NEAREST)
                sh.paste(im, (x0 + s * (cw + 4), y0), im)
            d.text((x0 + 2, y0 + ch + 3), f"{j['id']}  (left s0, right s1)", fill=(239, 230, 210))
        out = studio.OUT / f"test_art_sheet_{cat}.png"
        sh.save(out); print("sheet:", out)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--seeds", type=int, default=2)
    ap.add_argument("--sheet", action="store_true")
    a = ap.parse_args()
    sheet() if a.sheet else paint(a.seeds)
