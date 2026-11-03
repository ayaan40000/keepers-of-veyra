"""Face review sheets for a Claude reviewer (replaces the Qwen check, owner decision Nov 2, 2026).

  python tools/asset-studio/review_sheets.py 0:50        one sheet per 5 people -> out/faces/review/sheet_<first>.png
  python tools/asset-studio/review_sheets.py --redo      the people in verdicts.json (after a repaint) -> out/faces/review/redo_<first>.png

Each row: original | new look | look-alike, with the recipe (id, gender, age band, heritage) printed above it.
The reviewer writes verdicts to out/faces/review/verdicts.json; apply_review.py turns them into repaints later.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
CAST = HERE / "out" / "faces" / "cast"
PEOPLE = HERE / "out" / "faces" / "people.json"
REVIEW = HERE / "out" / "faces" / "review"
CELL, LABEL, PER = 192, 18, 5


def main():
    everyone = json.loads(PEOPLE.read_text(encoding="utf-8"))
    redo = "--redo" in sys.argv
    if redo:
        ids = set(json.loads((REVIEW / "verdicts.json").read_text(encoding="utf-8")))
        people = [p for p in everyone if p["id"] in ids]
    else:
        lo, hi = (int(x) for x in (sys.argv[1] if len(sys.argv) > 1 else "0:150").split(":"))
        people = everyone[lo:hi]
    REVIEW.mkdir(parents=True, exist_ok=True)
    ready = [p for p in people if all((CAST / f"{p['id']}{s}.png").exists() for s in ("", "_restyle", "_lookalike"))]
    for i in range(0, len(ready), PER):
        rows = ready[i:i + PER]
        sheet = Image.new("RGB", (CELL * 3, (CELL + LABEL) * len(rows)), "white")
        d = ImageDraw.Draw(sheet)
        for r, p in enumerate(rows):
            y = r * (CELL + LABEL)
            d.text((4, y + 3), f"{p['id']}  {p['pres']}, {p['ageLabel']}, {p['heritage']}   | original | new look | look-alike", fill="black")
            for c, s in enumerate(("", "_restyle", "_lookalike")):
                im = Image.open(CAST / f"{p['id']}{s}.png").convert("RGB").resize((CELL, CELL), Image.LANCZOS)
                sheet.paste(im, (c * CELL, y + LABEL))
        out = REVIEW / f"{'redo' if redo else 'sheet'}_{rows[0]['id']}.png"
        sheet.save(out)
        print(out)
    print(f"{len(ready)} of {len(people)} people ready")


if __name__ == "__main__":
    main()
