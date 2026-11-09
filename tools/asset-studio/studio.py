"""Mnemos asset studio (dev only, nothing here ships in the app).

Local models draft new assets for review:
  1. Qwen (LM Studio, http://127.0.0.1:1234) plans assets per category, writes lore texts and draws each one
     as a string sprite in the app's own format ({w, h, pal, px}). Rows and palettes are normalised in code.
  2. The image model (ComfyUI, http://127.0.0.1:8188, Qwen-Image workflow from the studio project) paints a
     pixel-art reference picture per asset. Owner rule: these pictures are reference only, never shipped.
  3. A review page, out/review.html, shows reference, sprite and text side by side.

Usage (from the Mnemos folder):
  python tools/asset-studio/studio.py                 all stages, all categories
  python tools/asset-studio/studio.py --only relics   one category
  python tools/asset-studio/studio.py --stages plan,sprites,review --limit 2
Stages: plan, lore, sprites, images, review. Only one model is in VRAM at a time: all Qwen stages run first,
then Qwen is unloaded from LM Studio, then ComfyUI runs, then ComfyUI is freed. Finished work is skipped, so a stopped run can simply be restarted.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent / "out"
STUDIO = Path(r"D:\Personal Claude Projects\Your Ayurveda Expert\TikTok-Influencer-Project\studio\agent")
LLM = "http://127.0.0.1:1234/v1/chat/completions"
COMFY = "http://127.0.0.1:8188"
STARTED = None  # the ComfyUI server this run started, stopped again at the end

WORLD = (
    "Mnemos: Keepers of Veyra is a gentle pixel-art memory-training game. Veyra is an original lamp-lit river city "
    "whose memories are threatened by the Tide, a white mist from the river Lethe that erases memory. The player is a "
    "Keeper who restores 12 districts (Lamplighters' Quay, the Long Gallery, the Hall of Faces, the Counting House, the "
    "Clockwork Market, the Tongues Bridge, the Scriptorium, the Tidal Stair, the Mirror Wards, the Open Roads, the "
    "Amphitheatre of Echoes, the Lethe Gate). Characters: Wren (young nervous archivist with notecards), Old Tansy "
    "(herbalist, rosemary tea; secretly Calder the lost archivist), Sevrin Ashgrave (Grand Hush of the Hushed, who drink "
    "'the grey' to forget pain), Joss Hask (gruff road-warden), Isolde Varre (rich amused smuggler), Brother Ennick "
    "(former Hushed monk), Fennick (old gallery caretaker), Mosk (grumpy ferryman). Deep history: the river-folk, the "
    "Drowned Years, the Nameless Kings, Hesper the mason, Ysolde of the Lamp who founded the thirteen Lamp-Wardens and "
    "the Compact of Lamps. Below the Archive lies the Undercroft. Tone: warm, plain, a little eerie, never gory."
)
STYLE = (
    "Palette: deep navy night #0F1420, warm amber lamp light #E8B04B and #FFD98A, parchment #EFE6D2, dark grey-brown "
    "stone #3A3633, river blue #3A5A78, moss green #5A7A4A, rust #C46A2A. Every shape has a dark outline #140F1A."
)

# id, sprite width, height, how many, aspect for the reference picture, brief
CATEGORIES = {
    "relics": (24, 24, 10, "1:1", "collectible relics: small precious objects tied to Veyra's districts and history, each with a tiny story"),
    "lore_docs": (24, 24, 8, "1:1", "lore documents about Veyra's past history: letters, maps, ledgers, charters, songs, wanted posters, each an object the player can read"),
    "side_quest": (24, 24, 10, "1:1", "side-quest items: everyday things the townsfolk ask the Keeper to find, deliver or remember (a lost glove, a ferry token, a recipe card)"),
    "inventory": (24, 24, 10, "1:1", "the Keeper's own inventory gear: travel things a memory keeper carries (lamp oil, satchel, chalk, notebook, lantern wick, map case)"),
    "furniture": (16, 16, 10, "1:1", "furniture for memory-palace rooms seen from a slight top-down view (things NOT already made: bath, sofa, bed, table, chair, lamp, mirror, window, shelf, plant, fridge, stove, sink, desk, tv, rug, clock, stairs, door, chest)"),
    "undercroft": (32, 32, 10, "1:1", "Undercroft art: crypt bosses (The Crowned Echo, The Cistern Choir, The Root Warden, The Listening Spring, Ysolde's Shadow), chamber props, carved tablets, sealed chests, deep warm silver water"),
    "portraits": (32, 32, 8, "1:1", "head-and-shoulders portraits of the named characters showing a mood (Wren happy, Wren worried, Tansy confused, Sevrin grieving, Sevrin at peace, Hask stern, Isolde smug, Mosk grumpy)"),
    "cutscene": (48, 27, 8, "16:9", "wide story panels: the epilogue on the Quay one year later, the Long Vigil with lamps in every street, Sevrin and Tansy under the last lamp, Wren as Archivist under the copper dome, the Tide stopping on the bridge, Hask walking the Ammerhold pass, the Lamp of Ysolde relit, Ysolde's lamp burning at the bottom of the Undercroft"),
}


def log(*a):
    OUT.mkdir(parents=True, exist_ok=True)
    line = time.strftime("%H:%M:%S ") + " ".join(str(x) for x in a)
    print(line, flush=True)
    with open(OUT / "log.txt", "a", encoding="utf-8") as f:
        f.write(line + "\n")


def no_dashes(s: str) -> str:
    return re.sub(r"\s*[\u2013\u2014]\s*", ", ", s)


# ---------- Qwen ----------
_MODEL = None


def llm_model() -> str:
    # The text model is loaded on demand (an earlier image stage may have unloaded it).
    global _MODEL
    if _MODEL:
        return _MODEL
    ids = [m["id"] for m in json.loads(urllib.request.urlopen("http://127.0.0.1:1234/v1/models", timeout=10).read())["data"]]
    _MODEL = next((i for i in ids if "qwen" in i.lower() and not i.endswith("@?")), ids[0])
    lms = Path.home() / ".lmstudio" / "bin" / "lms.exe"
    loaded = subprocess.run([str(lms), "ps"], capture_output=True, text=True, timeout=60).stdout if lms.exists() else ""
    if _MODEL not in loaded and lms.exists():
        log("loading", _MODEL)
        subprocess.run([str(lms), "load", _MODEL, "-y"], capture_output=True, timeout=900)
    return _MODEL


def qwen(prompt: str, max_tokens=2500, temp=0.5, fp=0.3, pp=0.2, system="Output only what is asked. No commentary, no markdown fences.") -> str:
    body = {"model": llm_model(), "reasoning_effort": "none", "temperature": temp, "frequency_penalty": fp,
            "presence_penalty": pp, "max_tokens": max_tokens,
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": prompt}]}
    req = urllib.request.Request(LLM, json.dumps(body).encode(), {"content-type": "application/json"})
    j = json.loads(urllib.request.urlopen(req, timeout=900).read())
    return re.sub(r"^```[a-z]*\n|\n```\s*$", "", j["choices"][0]["message"]["content"].strip())


def plan(cat: str, limit: int | None):
    f = OUT / cat / "plan.json"
    if f.exists():
        return json.loads(f.read_text(encoding="utf-8"))
    w, h, n, _, brief = CATEGORIES[cat]
    n = min(n, limit or n)
    txt = qwen(f"{WORLD}\n\nInvent {n} new, original {brief}. Keep them distinct from each other and specific to Veyra. "
               f"Plain English, never use em dashes.\nOutput exactly {n} lines, nothing else, in this format:\n"
               f"Example line: tansy_strainer|Tansy's Tea Strainer|A round tin strainer with a bent green handle.|Old Tansy steeped rosemary through it every night.\n"
               f"id_in_snake_case (at most 4 words)|Display Name|one sentence describing exactly what it looks like (colours, shape)|one sentence of story",
               max_tokens=1500, temp=0.7)
    (OUT / cat).mkdir(parents=True, exist_ok=True)
    (OUT / cat / "plan.raw.txt").write_text(txt, encoding="utf-8")
    items, seen = [], set()
    for line in txt.splitlines():
        line = re.sub(r"^\s*(\d+[.)]\s*|[-*]\s*)", "", line).strip("` ")
        parts = [p.strip() for p in line.split("|")]
        if len(parts) < 3:
            continue
        aid = re.sub(r"[^a-z0-9_]", "", parts[0].lower().replace(" ", "_"))[:40]
        if not aid or aid in seen:
            continue
        seen.add(aid)
        items.append({"id": aid, "name": no_dashes(parts[1]), "look": no_dashes(parts[2]), "story": no_dashes(parts[3]) if len(parts) > 3 else ""})
    items = items[:n]
    (OUT / cat).mkdir(parents=True, exist_ok=True)
    f.write_text(json.dumps(items, indent=1, ensure_ascii=False), encoding="utf-8")
    log(cat, "planned", len(items))
    review()
    return items


def lore(cat: str, items):
    if cat != "lore_docs":
        return
    for it in items:
        f = OUT / cat / f"{it['id']}.txt"
        if f.exists():
            continue
        t = qwen(f"{WORLD}\n\nWrite the text of this in-world document, as the player reads it: {it['name']}. "
                 f"It looks like this: {it['look']} Background: {it['story']}\nWrite 80 to 120 words in the document's own "
                 f"voice. Plain, concrete English. Never use em dashes or en dashes. Output only the text.", max_tokens=600, temp=0.6)
        f.write_text(no_dashes(t), encoding="utf-8")
        review()
        log(cat, "lore", it["id"], len(t.split()), "words")


def norm_sprite(txt: str, w: int, h: int):
    m = re.search(r"\{[\s\S]*\}", txt)
    j = json.loads(m.group(0))
    pal = {k: v.lower() for k, v in (j.get("pal") or {}).items() if re.fullmatch(r"[a-zA-Z]", k) and re.fullmatch(r"#[0-9a-fA-F]{6}", str(v))}
    rows = ["".join(c if c == "." or c in pal else "." for c in re.sub(r"[^a-zA-Z.]", ".", str(r))) for r in (j.get("px") or [])]
    rows = [(r + "." * w)[:w] for r in rows[:h]]
    while len(rows) < h:
        rows.insert(0, "." * w)
    filled = sum(len(r.replace(".", "")) for r in rows)
    if filled < w * h * 0.15:
        raise ValueError("too empty")
    return {"w": w, "h": h, "pal": pal, "px": rows}


def sprites(cat: str, items):
    w, h, *_ = CATEGORIES[cat]
    for it in items:
        f = OUT / cat / f"{it['id']}.sprite.json"
        if f.exists():
            continue
        prompt = (f"Draw original pixel art of: {it['name']}. It looks like this: {it['look']}\n{STYLE}\n"
                  f"Return JSON only: {{\"pal\": {{\"a\": \"#140f1a\", \"b\": \"#rrggbb\", ...}}, \"px\": [ {h} strings ]}}. "
                  f"Each px string is exactly {w} characters; '.' is transparent and each letter is a palette key. "
                  f"Use 5 to 9 colours, a dark outline, shading from a light at the top left, the object centred and filling most of the {w}x{h} grid.")
        for attempt in range(3):
            try:
                s = norm_sprite(qwen(prompt, max_tokens=3000, temp=0.4 + 0.15 * attempt, fp=0, pp=0), w, h)
                f.write_text(json.dumps(s), encoding="utf-8")
                log(cat, "sprite", it["id"])
                review()
                break
            except Exception as e:  # noqa: BLE001
                log(cat, "sprite retry", it["id"], e)


# ---------- image model (reference only) ----------
def comfy(path: str, body=None, timeout=30):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(COMFY + path, data, {"content-type": "application/json"} if data else {})
    r = urllib.request.urlopen(req, timeout=timeout).read()
    return r if path.startswith("/view") else json.loads(r or b"{}")


def comfy_up() -> bool:
    try:
        comfy("/system_stats", timeout=3)
        return True
    except Exception:  # noqa: BLE001
        return False


def free_llm():
    # VRAM holds one model at a time: unload Qwen from LM Studio before the image model starts.
    lms = Path.home() / ".lmstudio" / "bin" / "lms.exe"
    try:
        subprocess.run([str(lms) if lms.exists() else "lms", "unload", "--all"], timeout=120, capture_output=True)
        log("LM Studio models unloaded")
    except Exception as e:  # noqa: BLE001
        log("could not unload LM Studio models:", e)


def comfy_server_cmd():
    # Same command Comfy Desktop uses (copied from the studio's agent/pcguard.py, which needs psutil).
    import os
    local, roaming = Path(os.environ.get("LOCALAPPDATA", "")), Path(os.environ.get("APPDATA", ""))
    inst = local / "Comfy-Desktop" / "ComfyUI-Installs" / "ComfyUI"
    py = inst / "ComfyUI" / ".venv" / "Scripts" / "python.exe"
    if not (py.exists() and (inst / "ComfyUI" / "main.py").exists()):
        return None
    cmd = [str(py), "-s", "ComfyUI\main.py", "--listen", "127.0.0.1", "--port", "8188"]
    yamls = sorted((roaming / "Comfy Desktop" / "instance-model-paths").glob("*.yaml"), key=lambda q: q.stat().st_mtime)
    if yamls:
        cmd += ["--extra-model-paths-config", str(yamls[-1])]
    if Path("C:/ComfyUI").exists():
        cmd += ["--input-directory", "C:\ComfyUI\input", "--output-directory", "C:\ComfyUI\output"]
    return cmd, str(inst)


def start_comfy():
    if comfy_up():
        return True
    cmd = comfy_server_cmd()
    if not cmd:
        log("ComfyUI install not found; open Comfy Desktop and run again with --stages images,review")
        return False
    global STARTED
    STARTED = subprocess.Popen(cmd[0], cwd=cmd[1], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(180):
        if comfy_up():
            return True
        time.sleep(2)
    return False


def images(cat: str, items):
    *_, aspect, _brief = CATEGORIES[cat]
    wf0 = json.loads((STUDIO / "comfy_qwen_workflow.json").read_text(encoding="utf-8"))
    for i, it in enumerate(items):
        dest = OUT / cat / f"{it['id']}.png"
        if dest.exists():
            continue
        wf = json.loads(json.dumps(wf0))
        prompt = (f"16-bit pixel art game asset, {it['name']}: {it['look']} Original fantasy setting, a lamp-lit river city at night. "
                  f"Limited palette of deep navy, warm amber lamp light, parchment cream, grey-brown stone, neutral colour balance with no purple cast. Crisp square pixels, "
                  f"dark outlines, {'single object centred on a plain dark navy background' if aspect == '1:1' else 'wide story panel, cinematic composition'}.")
        neg = "purple tint, violet tint, magenta cast, text, letters, watermark, signature, logo, photo, 3d render, blurry, smooth gradients, anti-aliasing, characters or art from existing games"
        for node in wf.values():
            ct, inp = node["class_type"], node["inputs"]
            if ct.startswith("TextEncodeQwenImage"):
                inp["prompt"], inp["negative_prompt"] = prompt, neg
            elif ct == "KSampler":
                inp["seed"], inp["steps"] = 7000 + i, 24
            elif ct == "ResolutionSelector":
                inp["aspect_ratio"] = "1:1 (Square)" if aspect == "1:1" else "16:9 (Widescreen)"
                inp["megapixels"] = 0.6
            elif ct.startswith("SaveImage"):
                inp["filename_prefix"] = f"mnemos_{cat}"
        try:
            pid = comfy("/prompt", {"prompt": wf, "client_id": "mnemos-studio"})["prompt_id"]
            for _ in range(900):
                time.sleep(1)
                hist = comfy(f"/history/{pid}")
                if pid in hist:
                    break
            for out in hist[pid].get("outputs", {}).values():
                for im in out.get("images", []):
                    q = urllib.parse.urlencode({"filename": im["filename"], "subfolder": im.get("subfolder", ""), "type": im.get("type", "output")})
                    dest.write_bytes(comfy(f"/view?{q}", timeout=120))
            log(cat, "image", it["id"])
            review()
        except Exception as e:  # noqa: BLE001
            log(cat, "image failed", it["id"], e)


# ---------- trace (owner decision, Nov 1 2026: sprites may be traced from our own generated pictures) ----------
TRACE_SIZE = {"cutscene": (96, 54)}  # story panels get more pixels than Qwen's drafts
LETTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"


def trace_one(src: Path, w: int, h: int, panel: bool, colours: int = 12, cut: int = 46):
    from PIL import Image
    im = Image.open(src).convert("RGB")
    im.thumbnail((256, 256), Image.BOX)
    W, H = im.size
    px = im.load()
    mask = [[True] * W for _ in range(H)]  # True = keep
    if not panel:
        # the background is a plain dark field: flood it from the edges so dark detail inside the object stays
        corners = [px[0, 0], px[W - 1, 0], px[0, H - 1], px[W - 1, H - 1]]
        bg = tuple(sorted(c[i] for c in corners)[1] for i in range(3))
        near = lambda c: sum((c[i] - bg[i]) ** 2 for i in range(3)) < cut ** 2  # noqa: E731
        stack = [(x, y) for x in range(W) for y in (0, H - 1)] + [(x, y) for y in range(H) for x in (0, W - 1)]
        while stack:
            x, y = stack.pop()
            if 0 <= x < W and 0 <= y < H and mask[y][x] and near(px[x, y]):
                mask[y][x] = False
                stack += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
        ys = [y for y in range(H) if any(mask[y])]
        xs = [x for x in range(W) if any(mask[y][x] for y in range(H))]
        if not xs:
            raise ValueError("nothing left after removing the background")
        box = (min(xs), min(ys), max(xs) + 1, max(ys) + 1)
        a = Image.new("L", (W, H), 0)
        a.putdata([255 if mask[y][x] else 0 for y in range(H) for x in range(W)])
        im, a = im.crop(box), a.crop(box)
        iw, ih = w - 2, h - 2  # leave room for the outline
        sc = min(iw / im.width, ih / im.height)
        tw, th = max(1, round(im.width * sc)), max(1, round(im.height * sc))
        im, a = im.resize((tw, th), Image.BOX), a.resize((tw, th), Image.BOX)
        canvas, alpha = Image.new("RGB", (w, h)), Image.new("L", (w, h), 0)
        ox, oy = (w - tw) // 2, h - 1 - th if h - 1 - th >= 1 else (h - th) // 2
        canvas.paste(im, (ox, oy)); alpha.paste(a, (ox, oy))
    else:
        canvas = im.resize((w, h), Image.BOX)
        alpha = Image.new("L", (w, h), 255)
    q = canvas.quantize(colors=colours, method=Image.MEDIANCUT)
    pal_raw = q.getpalette()[: colours * 3]
    qp, ap = q.load(), alpha.load()
    used, rows = {}, []
    for y in range(h):
        r = ""
        for x in range(w):
            if ap[x, y] < 128:
                r += "."
                continue
            i = qp[x, y]
            if i not in used:
                used[i] = LETTERS[len(used)]
            r += used[i]
        rows.append(r)
    pal = {k: "#%02x%02x%02x" % tuple(pal_raw[i * 3: i * 3 + 3]) for i, k in used.items()}
    if not panel:
        pal["z" if "z" not in pal.values() else "Z"] = "#140f1a"
        o = [k for k, v in pal.items() if v == "#140f1a"][-1]
        g = [list(r) for r in rows]
        for y in range(h):
            for x in range(w):
                if rows[y][x] == "." and any(0 <= x + dx < w and 0 <= y + dy < h and rows[y + dy][x + dx] != "." for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                    g[y][x] = o
        rows = ["".join(r) for r in g]
    return {"w": w, "h": h, "pal": pal, "px": rows}


def sprite_png(spr, dest: Path):
    # A plain picture of the code sprite for the review page (exactly the pixels the game would draw).
    from PIL import Image
    im = Image.new("RGBA", (spr["w"], spr["h"]), (0, 0, 0, 0))
    for y, r in enumerate(spr["px"]):
        for x, c in enumerate(r):
            if c != ".":
                v = spr["pal"][c]
                im.putpixel((x, y), (int(v[1:3], 16), int(v[3:5], 16), int(v[5:7], 16), 255))
    im.save(dest)


def trace(cat: str, items):
    w, h, *_ = CATEGORIES[cat]
    w, h = TRACE_SIZE.get(cat, (w, h))
    for it in items:
        src, dest = OUT / cat / f"{it['id']}.png", OUT / cat / f"{it['id']}.traced.json"
        if dest.exists() or not src.exists():
            continue
        try:
            spr = trace_one(src, w, h, cat == "cutscene")
            dest.write_text(json.dumps(spr), encoding="utf-8")
            sprite_png(spr, OUT / cat / f"{it['id']}.traced.png")
            log(cat, "traced", it["id"])
        except Exception as e:  # noqa: BLE001
            log(cat, "trace failed", it["id"], e)


# ---------- review page ----------
def sprite_html(s, scale):
    cells = "".join(f'<i style="background:{"transparent" if c == "." else s["pal"][c]}"></i>' for r in s["px"] for c in r)
    return f'<div class="g" style="grid-template-columns:repeat({s["w"]},{scale}px);grid-auto-rows:{scale}px">{cells}</div>'


def review():
    parts = []
    for cat, (w, *_rest) in CATEGORIES.items():
        f = OUT / cat / "plan.json"
        if not f.exists():
            continue
        cards = []
        for it in json.loads(f.read_text(encoding="utf-8")):
            sp = OUT / cat / f"{it['id']}.sprite.json"
            img = OUT / cat / f"{it['id']}.png"
            txt = OUT / cat / f"{it['id']}.txt"
            spr = sprite_html(json.loads(sp.read_text()), max(3, 96 // w)) if sp.exists() else '<div class="miss">no sprite</div>'
            tr = OUT / cat / f"{it['id']}.traced.json"
            if tr.exists():
                t = json.loads(tr.read_text())
                spr = f'<img class="tr" src="{cat}/{it["id"]}.traced.png" alt="" style="width:{max(2, 150 // t["w"]) * t["w"]}px"><small>traced</small>'
            ref = f'<img src="{cat}/{img.name}" alt="">' if img.exists() else '<div class="miss">no reference</div>'
            body = f"<p>{txt.read_text(encoding='utf-8')}</p>" if txt.exists() else ""
            cards.append(f'<figure><div class="pair">{ref}{spr}</div><figcaption><b>{it["name"]}</b> <code>{it["id"]}</code>'
                         f'<br>{it["look"]}<br><em>{it["story"]}</em>{body}</figcaption></figure>')
        parts.append(f"<h2>{cat} ({len(cards)})</h2><div class='grid'>{''.join(cards)}</div>")
    html = ("<!doctype html><meta charset=utf-8><meta http-equiv=refresh content=10><title>Mnemos asset drafts</title><style>body{background:#0f1420;color:#efe6d2;"
            "font:14px system-ui;margin:20px}h2{color:#e8b04b}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:14px}"
            "figure{margin:0;background:#1a2030;padding:10px;border:1px solid #3a3048}.pair{display:flex;gap:10px;align-items:center}"
            "img{width:150px;height:auto;image-rendering:pixelated}.g{display:grid}.g i{display:block}.miss{width:96px;color:#888}"
            "code{color:#8a93a8}em{color:#b8c2d6}</style><h1>Mnemos asset drafts (local models, for review; nothing here is in the game)</h1>"
            "<p>Left: image model reference (never shipped). Right: the code sprite in the app's own format (traced from the picture where marked, else Qwen's drawing). This page refreshes every 10 seconds.</p>"
            + "<pre style='background:#07060c;padding:8px;max-height:9em;overflow:auto'>" + "\n".join(((OUT / "log.txt").read_text(encoding="utf-8").splitlines() if (OUT / "log.txt").exists() else [])[-8:][::-1]) + "</pre>"
            + "".join(parts))
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "review.html").write_text(html, encoding="utf-8")
    log("review page:", OUT / "review.html")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="comma list of categories")
    ap.add_argument("--stages", default="plan,lore,sprites,images,trace,review")
    ap.add_argument("--limit", type=int, help="at most this many assets per category")
    a = ap.parse_args()
    cats = a.only.split(",") if a.only else list(CATEGORIES)
    stages = a.stages.split(",")
    plans = {}
    if any(s in stages for s in ("plan", "lore", "sprites", "images")):
        for c in cats:
            plans[c] = plan(c, a.limit) if "plan" in stages or (OUT / c / "plan.json").exists() else []
            if a.limit:
                plans[c] = plans[c][: a.limit]
    for c in cats:
        if "lore" in stages:
            lore(c, plans[c])
        if "sprites" in stages:
            sprites(c, plans[c])
    if "images" in stages:
        free_llm()  # text stages are finished; only the image model may hold VRAM from here
        if start_comfy():
            for c in cats:
                images(c, plans[c])
            try:
                comfy("/free", {"unload_models": True, "free_memory": True})
            except Exception:  # noqa: BLE001
                pass
            if STARTED:
                STARTED.terminate()
                log("ComfyUI server stopped")
    if "trace" in stages:
        for c in cats:
            trace(c, json.loads((OUT / c / "plan.json").read_text(encoding="utf-8")) if (OUT / c / "plan.json").exists() else [])
    if "review" in stages:
        review()


if __name__ == "__main__":
    main()
