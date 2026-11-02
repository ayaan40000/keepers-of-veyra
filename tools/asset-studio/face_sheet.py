"""Review sheet for the image-model face variations: python tools/asset-studio/face_sheet.py [out.png]
   Pilot cast sheet:  python tools/asset-studio/face_sheet.py --cast [out.png]

Reads tools/asset-studio/out/faces/ (made by faces.py). Every face is reduced the way shipped art is (box downsize,
palette without dithering) and shown enlarged with whole pixels, so the sheet shows what the game would show.
"""
from __future__ import annotations

import io
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
FACES = HERE / "out" / "faces"
PEOPLE = ["101", "2024", "377", "9001", "4242", "77", "31337", "555"]
EDITED = ["101", "9001", "4242", "31337"]
CELL, PAD, LH = 288, 8, 52
BG, INK, SUB = (20, 16, 26), (240, 220, 170), (170, 160, 150)


def reduce(path: Path, px=96, colours=32):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    m = min(w, h)
    im = im.crop(((w - m) // 2, (h - m) // 2, (w + m) // 2, (h + m) // 2)).resize((px, px), Image.BOX)
    return im.quantize(colors=colours, method=Image.MEDIANCUT, dither=Image.Dither.NONE)


def kb(q) -> float:
    best = None
    for fmt, kw in (("PNG", {"optimize": True}), ("WEBP", {"lossless": True, "method": 6})):
        b = io.BytesIO()
        (q if fmt == "PNG" else q.convert("RGB")).save(b, fmt, **kw)
        best = min(best or 1e9, b.tell())
    return best / 1024


def font(n):
    try:
        return ImageFont.truetype("arial.ttf", n)
    except Exception:  # noqa: BLE001
        return ImageFont.load_default()


def main():
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE.parents[1] / "docs" / "review" / "face-variations.png"
    F, f = font(34), font(24)
    blocks = []  # (title, note, [(image, caption)])
    for s in (0, 1):
        blocks.append((f"{'1' if s == 0 else '2'}. Plain background, painting {s + 1} of each person (96 px, 32 colours)",
                       "Same description, different painting: shows how much one person can vary." if s else "The same 8 people as before, now on a plain background.",
                       [(reduce(FACES / f"{p}_s{s}.png"), f"#{p}") for p in PEOPLE if (FACES / f"{p}_s{s}.png").exists()]))
    sizes = []
    for p in ("101", "77"):
        for px, c in ((64, 24), (96, 32), (128, 48)):
            q = reduce(FACES / f"{p}_s0.png", px, c)
            sizes.append((q, f"{px} px, {c} col, {kb(q):.1f} KB"))
    blocks.append(("3. Size options (file size per face)", "500 faces at 96 px is about 500 x the middle number. Today's art budget for the whole app is 1200 KB.", sizes))
    for p in EDITED:
        row = [(reduce(FACES / f"{p}_s0.png"), "Original")]
        for kind, cap in (("lookalike", "Look-alike stranger"), ("restyle", "Same person, new look")):
            if (FACES / f"{p}_{kind}.png").exists():
                row.append((reduce(FACES / f"{p}_{kind}.png"), cap))
        blocks.append((f"4. Edits of #{p}: what the drills need", "Look-alike: two features changed. New look: hair, glasses or clothes changed, same face.", row))
    W = 8 * (CELL + PAD) + PAD
    H = sum(LH + 34 + CELL + 40 + PAD for _ in blocks)
    sheet = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(sheet)
    y = 0
    for title, note, items in blocks:
        d.text((16, y + 8), title, fill=INK, font=F)
        d.text((16, y + LH), note, fill=SUB, font=f)
        y += LH + 34
        for i, (q, cap) in enumerate(items):
            im = q.convert("RGB")
            sc = CELL // im.width
            big = im.resize((im.width * sc, im.height * sc), Image.NEAREST)
            x = PAD + i * (CELL + PAD)
            sheet.paste(big, (x + (CELL - big.width) // 2, y + (CELL - big.height) // 2))
            d.text((x + 4, y + CELL + 6), cap, fill=SUB, font=f)
        y += CELL + 40 + PAD
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out)
    print(out, sheet.size)


def cast_sheet(out: Path):
    """Pilot sheet for the cast: original, look-alike and new look per person, with what each edit was asked to change."""
    import json
    cdir = FACES / "cast"
    people = {p["id"]: p for p in json.loads((FACES / "people.json").read_text(encoding="utf-8"))}
    report = json.loads((cdir / "report.json").read_text(encoding="utf-8")) if (cdir / "report.json").exists() else {}
    ids = sorted(x.stem for x in cdir.glob("p???.png"))
    C, G, TXT = 240, 6, 112
    PW = 3 * (C + G) + 24  # one person block
    W = 2 * PW + G
    H = 70 + ((len(ids) + 1) // 2) * (C + TXT + 40)
    sheet = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(sheet)
    F, f, fs = font(34), font(22), font(18)
    d.text((16, 14), "Pilot cast: original, look-alike stranger, same person with a new look (96 px, 32 colours)", fill=INK, font=F)
    for i, pid in enumerate(ids):
        p, r = people[pid], report.get(pid, {})
        x0, y0 = (i % 2) * (PW + G) + 8, 70 + (i // 2) * (C + TXT + 40)
        d.text((x0, y0), f"{pid}: {p['pres']}, {p.get('ageLabel', p['age'])}, {p.get('heritage', '')}, {p.get('build', '')}, {p.get('height', '')}"[:70], fill=INK, font=f)
        for j, (suffix, cap) in enumerate((("", "Original"), ("_lookalike", "Look-alike"), ("_restyle", "New look"))):
            fp = cdir / f"{pid}{suffix}.png"
            if not fp.exists():
                continue
            big = reduce(fp).convert("RGB").resize((C, C), Image.NEAREST)
            sheet.paste(big, (x0 + j * (C + G), y0 + 30))
            extra = f" {r['lookalike']:.0%}{' WEAK' if r.get('weak') else ''}" if suffix == "_lookalike" and "lookalike" in r else ""
            d.text((x0 + j * (C + G), y0 + 34 + C), cap + extra, fill=(255, 140, 120) if r.get("weak") and suffix == "_lookalike" else SUB, font=fs)
        la = "; ".join(f"{k}: {v}" for k, v in p["lookalike"].items())
        rs = "; ".join(f"{k}: {v or 'none'}" for k, v in p["restyle"].items())
        d.text((x0, y0 + 58 + C), f"Look-alike asked: {la}"[:95], fill=SUB, font=fs)
        d.text((x0, y0 + 82 + C), f"New look asked: {rs}"[:95], fill=SUB, font=fs)
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out)
    print(out, sheet.size)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--cast":
        cast_sheet(Path(sys.argv[2]) if len(sys.argv) > 2 else HERE.parents[1] / "docs" / "review" / "face-cast-pilot.png")
    else:
        main()
