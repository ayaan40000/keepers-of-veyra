"""Face variations for review (Nov 2, 2026): image-model portraits for the Names-and-Faces drills (owner chose style D).

  python tools/asset-studio/faces.py            paint the people (2 seeds each), then the edits
  python tools/asset-studio/faces.py --edits    only the edits (needs the paintings)
  python tools/asset-studio/faces.py --cast 0:12   paint people 0 to 11 from out/faces/people.json, each with a look-alike and a new look
                                                  (out/faces/cast/; finished pictures are skipped, so a stopped run resumes)
Output: tools/asset-studio/out/faces/<person>_s<seed>.png and <person>_<edit>.png. Not shipped.

Edits use the same method as day.py: the painting goes into the reference-image input of the Qwen-Image 2.1 text encoder
with an edit prompt. "lookalike" = a different person who differs in two features (the drill's lure); "restyle" = the same
person with new hair and glasses (the drill's "same person, different look").
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.parse
import urllib.request
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import gen  # noqa: E402
import studio  # noqa: E402

OUT = studio.OUT / "faces"
# Speed settings, timed Nov 2 2026 on the RX 7900 XTX: an original 21 s at 0.45 MP / 24 steps, 9 s at 0.25 MP / 16 steps; an edit
# 97 s at 0.45 MP / 20 steps, 32 s at 0.18 MP / 10 steps / reference 320. At the 96 px game size the faster ones look the same.
STEPS, EDIT_STEPS = 16, 10
PAINT_MP, EDIT_MP, REF_RES = 0.25, 0.18, 320
LOOK = ("16-bit pixel art game portrait, crisp square pixels, dark outlines, limited warm palette with amber light and muted violet shadows, "
        "in the style of a cosy fantasy RPG character portrait.")
TAIL = (" Head and upper body down to the chest so the build shows, one ordinary adult facing the viewer, centred, clear readable facial features, "
        "on a completely plain flat single-colour muted background, no scenery, no buildings, no text, no frame.")
NEG = gen.NEG + ", city, buildings, scenery, landscape, snow, sky, multiple people"

PEOPLE = {k[5:]: d for k, kind, d in gen.JOBS if kind == "face"}
BG = {"101": "slate blue", "2024": "sage green", "377": "warm taupe", "9001": "sage green", "4242": "dusty violet", "77": "warm taupe", "31337": "dusty violet", "555": "slate blue"}

# person -> (look-alike edit: two features change, restyle edit: same face, new look)
EDITS = {
    "101": ("Make her a different woman who looks similar: change only her nose to a long straight nose and her lips to thin lips.",
            "The same woman with the same face, now wearing round wire glasses and a dark green headscarf instead of the blue one."),
    "9001": ("Make him a different man who looks similar: change only his eyes to narrow almond eyes and add a short grey moustache.",
             "The same man with the same face, now with longer swept-back grey hair and square dark-rimmed glasses."),
    "4242": ("Make them a different person who looks similar: change only the nose to a small button nose and the eyebrows to thick arched brows.",
             "The same person with the same face, now with short cropped hair instead of the ponytail and a high-collared coat."),
    "31337": ("Make him a different man who looks similar: change only his nose to a broad nose and his beard to a thin goatee.",
              "The same man with the same face, now bare-headed with short black curly hair and round glasses, no cap."),
}
KEEP = " Keep everything else exactly the same: skin tone, hair, clothes, background colour, lighting, pose, framing and the pixel-art style. No text."


def wait_save(wf, dest: Path, tag):
    t0 = time.time()
    pid = studio.comfy("/prompt", {"prompt": wf, "client_id": "mnemos-faces"})["prompt_id"]
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
            studio.log("faces", tag, f"{time.time() - t0:.0f}s")
            return True
    studio.log("faces NO OUTPUT", tag)
    return False


def base_wf(prompt, seed, steps, neg=NEG, mp=None):
    wf = json.loads((studio.STUDIO / "comfy_qwen_workflow.json").read_text(encoding="utf-8"))
    for node in wf.values():
        ct, inp = node["class_type"], node["inputs"]
        if ct.startswith("TextEncodeQwenImage"):
            inp["prompt"], inp["negative_prompt"] = prompt, neg
        elif ct == "KSampler":
            inp["seed"], inp["steps"] = seed, steps
        elif ct == "ResolutionSelector":
            inp["aspect_ratio"], inp["megapixels"] = "1:1 (Square)", mp or PAINT_MP
        elif ct.startswith("SaveImage"):
            inp["filename_prefix"] = "mnemos_face"
    return wf


def paint(seeds):
    for s in range(seeds):
        for n, (pid, desc) in enumerate(PEOPLE.items()):
            dest = OUT / f"{pid}_s{s}.png"
            if dest.exists():
                continue
            prompt = f"{LOOK} {desc}. Background: plain {BG[pid]}.{TAIL}"
            wait_save(base_wf(prompt, 61000 + s * 1000 + n, STEPS), dest, dest.name)


def upload(path: Path) -> str:
    from PIL import Image
    small = OUT / "_ref" / f"ref_{path.stem}.png"
    small.parent.mkdir(parents=True, exist_ok=True)
    Image.open(path).convert("RGB").resize((640, 640), Image.BOX).save(small)
    b = uuid.uuid4().hex
    body = (f"--{b}\r\nContent-Disposition: form-data; name=\"image\"; filename=\"{small.name}\"\r\nContent-Type: image/png\r\n\r\n").encode() + small.read_bytes() + (
        f"\r\n--{b}\r\nContent-Disposition: form-data; name=\"overwrite\"\r\n\r\ntrue\r\n--{b}--\r\n").encode()
    req = urllib.request.Request(studio.COMFY + "/upload/image", body, {"content-type": f"multipart/form-data; boundary={b}"})
    return json.loads(urllib.request.urlopen(req, timeout=60).read())["name"]


def edits():
    for pid, pair in EDITS.items():
        src = OUT / f"{pid}_s0.png"
        if not src.exists():
            continue
        name = upload(src)
        for kind, text in zip(("lookalike", "restyle"), pair):
            dest = OUT / f"{pid}_{kind}.png"
            if dest.exists():
                continue
            wf = base_wf(f"Edit this pixel-art portrait. {text}{KEEP}", 5150, EDIT_STEPS, gen.NEG)
            enc = next(k for k, nd in wf.items() if nd["class_type"].startswith("TextEncodeQwenImage"))
            vae = next(k for k, nd in wf.items() if nd["class_type"] == "VAELoader")
            wf["900"] = {"class_type": "LoadImage", "inputs": {"image": name}}
            wf[enc]["inputs"].update({"images.image_1": ["900", 0], "vae": [vae, 0], "resolution": 512})
            wait_save(wf, dest, dest.name)


# ---------- the cast (people.json from people.py) ----------
CAST = OUT / "cast"
MIN_CHANGE = 0.07  # share of face pixels a look-alike must change; calibrated on the first edits (a failed one changed 5%, clear ones 9 to 16%)


def edit_one(src_name, text, seed, dest):
    wf = base_wf(f"Edit this pixel-art portrait. {text}{KEEP}", seed, EDIT_STEPS, gen.NEG, EDIT_MP)
    enc = next(k for k, nd in wf.items() if nd["class_type"].startswith("TextEncodeQwenImage"))
    vae = next(k for k, nd in wf.items() if nd["class_type"] == "VAELoader")
    wf["900"] = {"class_type": "LoadImage", "inputs": {"image": src_name}}
    wf[enc]["inputs"].update({"images.image_1": ["900", 0], "vae": [vae, 0], "resolution": REF_RES})
    return wait_save(wf, dest, dest.name)


def face_change(a: Path, b: Path) -> float:
    from PIL import Image, ImageChops
    crop = lambda p: Image.open(p).convert("RGB").resize((96, 96), Image.BOX).crop((28, 18, 68, 66))  # noqa: E731  eyes, nose and mouth
    d = ImageChops.difference(crop(a), crop(b)).convert("L")
    return sum(1 for v in d.getdata() if v > 40) / (40 * 48)


def opening(p):
    """Age and gender first, in plain words, so a long description cannot bury them (pilot 2: two people came out the wrong age or gender)."""
    g = {"woman": 0, "man": 1}.get(p["pres"], 2)
    pron = ("her", "his", "their")[g]
    return [f"Portrait of a young {('girl', 'boy', 'child')[g]} about eight years old, a child's face",
            f"Portrait of a {('teenage girl', 'teenage boy', 'teenager')[g]} about fifteen years old",
            f"Portrait of a young {('woman', 'man', 'androgynous person')[g]} in {pron} twenties, youthful smooth skin",
            f"Portrait of a {('woman', 'man', 'androgynous person')[g]} in {pron} late thirties",
            f"Portrait of a middle-aged {('woman', 'man', 'androgynous person')[g]} in {pron} fifties, some lines on the face",
            f"Portrait of an elderly {('woman', 'man', 'androgynous person')[g]} in {pron} late sixties, wrinkled face",
            f"Portrait of a very old {('woman', 'man', 'androgynous person')[g]} in {pron} late eighties, deeply wrinkled face, thin aged skin"][p["age"]]


def paint_prompt(p, text):
    return f"{LOOK} {opening(p)}: {text}. Background: plain {p['bg']}.{TAIL}"


def lookalike_text(p):
    """The same recipe with new eyes (shape and colour, always) and one more feature changed: a stranger who shares the
    hair, colouring, build and clothes. Painted fresh with another seed, which gives a genuinely different face."""
    import people as cast_people
    return cast_people.describe({**p, **p["lookalike"]})


def cast(lo, hi, step=1):
    people = json.loads((OUT / "people.json").read_text(encoding="utf-8"))[lo:hi:step]
    CAST.mkdir(parents=True, exist_ok=True)
    rep_path = CAST / "report.json"
    report = json.loads(rep_path.read_text(encoding="utf-8")) if rep_path.exists() else {}
    save = lambda: rep_path.write_text(json.dumps(report, indent=1), encoding="utf-8")  # noqa: E731
    # 1. originals and 2. look-alikes are plain paintings, done together; 3. new looks are edits, done last,
    # so ComfyUI does not switch between the two kinds of job for every person
    for p in people:
        n, r = int(p["id"][1:]), report.setdefault(p["id"], {})
        orig = CAST / f"{p['id']}.png"
        if not orig.exists():
            wait_save(base_wf(paint_prompt(p, p["prompt"]), 71000 + n + 100000 * r.get("attempt", 0), STEPS), orig, orig.name)
        la = CAST / f"{p['id']}_lookalike.png"
        if orig.exists() and not la.exists():
            r.pop("lookalike", None)
            best, ch = None, -1.0
            for k in range(3):  # a fresh painting is almost always different enough; retry with another seed if not
                alt = CAST / f"{p['id']}_lookalike_try.png"
                wait_save(base_wf(paint_prompt(p, lookalike_text(p)), 81000 + n + 1000 * k + 100000 * r.get("lookalike_attempt", 0), STEPS), alt, alt.name)
                if not alt.exists():
                    continue
                c = face_change(orig, alt)
                if c > ch:
                    alt.replace(la); ch = c
                else:
                    alt.unlink()
                if ch >= MIN_CHANGE:
                    break
            if la.exists():
                r["lookalike"], r["weak"] = round(ch, 3), ch < MIN_CHANGE
        save()
    for p in people:
        r = report.setdefault(p["id"], {})
        orig, dest = CAST / f"{p['id']}.png", CAST / f"{p['id']}_restyle.png"
        if orig.exists() and not dest.exists():
            edit_one(upload(orig), p["editRestyle"], 5150 + 10 * r.get("attempt", 0) + 100 * r.get("restyle_attempt", 0), dest)
        save()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--edits", action="store_true")
    ap.add_argument("--seeds", type=int, default=2)
    ap.add_argument("--cast", help="paint people from people.json: start:end or start:end:step, e.g. 0:300:25")
    a = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    if not studio.start_comfy():
        studio.log("ComfyUI did not start")
        return
    try:
        if a.cast:
            cast(*(int(x) for x in a.cast.split(":")))
        else:
            if not a.edits:
                paint(a.seeds)
            edits()
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
