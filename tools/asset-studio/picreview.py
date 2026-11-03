"""Qwen vision review of the shipped pictures (not faces) for the Mnemos art set. Local models only.

  python tools/asset-studio/picreview.py --dry            list what would be checked, no model calls
  python tools/asset-studio/picreview.py --limit 10       check the first 10 only
  python tools/asset-studio/picreview.py                  check every picture in src/assets/art (faces excluded)
  python tools/asset-studio/picreview.py --drafts         check the NEW drafts instead (out/new/ new job prefixes, out/day/ trial and vigil
                                                          dawn pictures) using the provisional alt text in ship.NEWROWS; not shipped yet

For each picture Qwen answers: does it fit the pixel-art style, does the alt text in src/data/art.js match what is shown, is there any
visible text, letters or logos, does it look like a copied character from another game or film, is anything scary or unsuitable.
Writes out/picreview/report.json and report.md (shipped) or drafts.json and drafts.md (--drafts), sorted with the problem pictures first.
Qwen and ComfyUI do not fit in memory together: run this only while ComfyUI is stopped. It loads and unloads Qwen itself
(same pattern as facecheck.py). This script only reads pictures; it never changes them and never ships anything.
"""
from __future__ import annotations

import argparse
import base64
import io
import json
import re
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
ART_DIR = ROOT / "src" / "assets" / "art"
MANIFEST = ROOT / "src" / "data" / "art.js"
OUTDIR = HERE / "out" / "picreview"
LMS = str(Path.home() / ".lmstudio" / "bin" / "lms.exe")
MODEL = "qwen3.8-27b-uncensored-hauhaucs-aggressive-mtp@iq3_xs"
SKIP_DIRS = {"faces", "face", "cast"}  # faces have their own check (facecheck.py)
SYSTEM = "You review pixel-art pictures for a gentle children-safe memory game. Look carefully and answer with JSON only, no other text."
QUESTION = ('This picture is shown in a game with the description: "{alt}". Reply with JSON '
            '{{"style_ok": true if it looks like 16-bit pixel art with a limited palette, else false, '
            '"alt_matches": true if the description fits what is shown, else false, '
            '"visible_text": true if ANY readable letters, words, numbers or a logo can be seen in the picture, else false, '
            '"copied_character": true if it looks like a known character, logo or artwork from an existing game or film, else false, '
            '"scary": true if anything is frightening, gory, a skull or otherwise unsuitable for a calm game, else false, '
            '"notes": one short sentence on the main problem, or "" if none}}.')


def read_manifest() -> list:
    """[(id, file path, category, alt)] from src/data/art.js (import lines map aN to files)."""
    txt = MANIFEST.read_text(encoding="utf-8")
    files = {m.group(1): m.group(2) for m in re.finditer(r"import (a\d+) from '\.\./assets/art/([^']+)'", txt)}
    out = []
    for m in re.finditer(r"'([^']+)': \{ src: (a\d+), .*?category: '([^']+)'.*?alt: (\"(?:[^\"\\]|\\.)*\") \}", txt):
        sid, key, cat, alt = m.group(1), m.group(2), m.group(3), json.loads(m.group(4))
        out.append((sid, ART_DIR / files[key], cat, alt))
    return out


def draft_list() -> list:
    """The new drafts (not shipped yet): [(label, path, category, alt)] using the provisional alt text in ship.NEWROWS."""
    sys.path.insert(0, str(HERE))
    import ship  # noqa: E402
    prefixes = ("vigil_", "bramble_", "mirror_", "voice_", "pedestal_", "audit_", "wrenmem_", "longecho_")
    new, day = HERE / "out" / "new", HERE / "out" / "day"
    out = []
    for sid, job, cat, alt in ship.NEWROWS:
        if job.startswith(prefixes):
            for p in sorted(new.glob(f"{job}_s*.png")):
                out.append((p.stem, p, cat, alt))
        dp = day / f"{sid}-day.png"
        if dp.exists() and (job.startswith("trial_") or job.startswith("vigil_")):
            out.append((dp.stem, dp, cat, alt + " Shown by day or at dawn."))
    return out


def to_image(path: Path) -> dict:
    from PIL import Image
    im = Image.open(path).convert("RGBA")
    bg = Image.new("RGBA", im.size, (20, 15, 26, 255))
    bg.alpha_composite(im)
    im = bg.convert("RGB")
    k = max(1, 512 // max(im.size)) if max(im.size) < 512 else 1
    if k > 1:
        im = im.resize((im.width * k, im.height * k), Image.NEAREST)
    elif max(im.size) > 640:
        im.thumbnail((640, 640), Image.BOX)
    b = io.BytesIO()
    im.save(b, "PNG")
    return {"type": "image_url", "image_url": {"url": "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()}}


def ask(alt: str, path: Path) -> dict:
    body = {"model": MODEL, "temperature": 0, "max_tokens": 250, "reasoning_effort": "none",
            "messages": [{"role": "system", "content": SYSTEM},
                         {"role": "user", "content": [{"type": "text", "text": QUESTION.format(alt=alt.replace('"', "'"))}, to_image(path)]}]}
    req = urllib.request.Request("http://127.0.0.1:1234/v1/chat/completions", json.dumps(body).encode(), {"content-type": "application/json"})
    out = json.loads(urllib.request.urlopen(req, timeout=300).read())["choices"][0]["message"]["content"]
    m = re.search(r"\{.*\}", out, re.S)
    try:
        return json.loads(m.group(0)) if m else {"error": out[:200]}
    except json.JSONDecodeError:
        return {"error": out[:200]}


def problems(r: dict) -> list:
    if "error" in r:
        return ["unreadable answer"]
    p = []
    if r.get("style_ok") is False:
        p.append("style")
    if r.get("alt_matches") is False:
        p.append("alt text")
    if r.get("visible_text") is True:
        p.append("visible text")
    if r.get("copied_character") is True:
        p.append("copied character")
    if r.get("scary") is True:
        p.append("scary")
    return p


def write_reports(results: list, stem: str) -> None:
    OUTDIR.mkdir(parents=True, exist_ok=True)
    (OUTDIR / f"{stem}.json").write_text(json.dumps(results, indent=1, ensure_ascii=False), encoding="utf-8")
    ordered = sorted(results, key=lambda r: (-len(r["problems"]), r["id"]))
    bad = [r for r in ordered if r["problems"]]
    lines = [f"# Picture review ({stem})", "", f"Checked {len(results)} pictures by the local Qwen vision model. {len(bad)} have at least one flag. "
             "These are hints for a human look, not verdicts.", "", "| Picture | Flags | Note | Alt text |", "| --- | --- | --- | --- |"]
    for r in bad:
        lines.append(f"| {r['id']} | {', '.join(r['problems'])} | {str(r['answer'].get('notes') or r['answer'].get('error') or '').replace('|', '/')[:140]} | {r['alt'].replace('|', '/')[:100]} |")
    if not bad:
        lines.append("| (none) | | | |")
    lines += ["", "No flags: " + (", ".join(r["id"] for r in ordered if not r["problems"]) or "(none)")]
    (OUTDIR / f"{stem}.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int)
    ap.add_argument("--dry", action="store_true")
    ap.add_argument("--drafts", action="store_true")
    a = ap.parse_args()
    items = draft_list() if a.drafts else [m for m in read_manifest() if m[2] not in SKIP_DIRS and m[1].parent.name not in SKIP_DIRS]
    items = [i for i in items if i[1].exists()]
    if a.limit:
        items = items[: a.limit]
    stem = "drafts" if a.drafts else "report"
    print(f"{len(items)} pictures to check ({'new drafts' if a.drafts else 'shipped, faces excluded'}), output {OUTDIR / (stem + '.json')}")
    if a.dry:
        for sid, p, cat, alt in items:
            print(f"  {sid:42} {cat:10} {p.relative_to(HERE.parents[1]) if str(p).startswith(str(HERE.parents[1])) else p}  | {alt[:60]}")
        print("dry run: no model calls, nothing written")
        return
    subprocess.run([LMS, "load", MODEL, "--context-length", "8192", "--gpu", "max", "-y"], capture_output=True)
    results, t0 = [], time.time()
    try:
        for n, (sid, p, cat, alt) in enumerate(items, 1):
            try:
                ans = ask(alt, p)
            except Exception as e:  # noqa: BLE001
                ans = {"error": str(e)[:200]}
            pr = problems(ans)
            results.append({"id": sid, "category": cat, "file": str(p), "alt": alt, "answer": ans, "problems": pr})
            print(n, len(items), sid, "ok" if not pr else "FLAG " + ", ".join(pr), flush=True)
            if n % 10 == 0:
                write_reports(results, stem)  # keep partial results if stopped
    finally:
        subprocess.run([LMS, "unload", "--all"], capture_output=True)
    write_reports(results, stem)
    print(f"checked {len(results)} in {(time.time() - t0) / 60:.1f} min, flagged {sum(1 for r in results if r['problems'])}; see {OUTDIR / (stem + '.md')}")


if __name__ == "__main__":
    main()
