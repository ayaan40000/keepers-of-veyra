"""v0.11: trace the trial and vault prize objects painted by gen.py (out/new/prize_*_s<seed>.png) into 24x24 item icons.

Writes src/pixel/trial-icons.js and a review picture out/prize-icons.png.
Usage (from the Mnemos folder): python tools/asset-studio/prizes.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import studio  # noqa: E402

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
NEW = HERE / "out" / "new"

# item id -> (painted job id, seed index)
PRIZES = {
    "tr_ledger_fragment": ("prize_ledger_fragment", 0),
    "tr_dry_scroll": ("prize_dry_scroll", 0),
    "tr_salt_dial": ("prize_brass_dial", 0),
    "tr_tongue_stone": ("prize_tongue_stone", 0),
    "tr_mainspring": ("prize_mainspring", 0),
    "vt_lamp_hook": ("prize_vault_hook", 0),
    "vt_clay_tablet": ("prize_vault_tablet", 0),
    "vt_lamp_key": ("prize_vault_key", 0),
    "tr_year_tablet": ("prizex_year_tablet", 0),  # 1.1
    "tr_tally_stick": ("prizex_tally_stick", 0),  # 1.1
}


def main():
    from PIL import Image
    icons = {}
    for item, (job, seed) in PRIZES.items():
        spr = studio.trace_one(NEW / f"{job}_s{seed}.png", 24, 24, panel=False, colours=10, cut=40)
        # the game's icons use "o" for the dark outline
        k = [c for c, v in spr["pal"].items() if v == "#140f1a"][-1]
        if k != "o":
            assert "o" not in spr["pal"]
            spr["pal"]["o"] = spr["pal"].pop(k)
            spr["px"] = [r.replace(k, "o") for r in spr["px"]]
        icons[item] = spr
    body = json.dumps(icons, separators=(",", ":"))
    (ROOT / "src" / "pixel" / "trial-icons.js").write_text(
        "// v0.11 prize icons traced from objects painted by the local image model (tools/asset-studio/prizes.py).\n"
        "// Generated; re-run the script rather than editing by hand.\n"
        f"export const TRIAL_ICONS = {body};\n", encoding="utf-8")
    sheet = Image.new("RGBA", (len(icons) * 24 * 6, 24 * 6), (20, 15, 26, 255))
    for i, s in enumerate(icons.values()):
        im = Image.new("RGBA", (24, 24), (0, 0, 0, 0))
        for y, row in enumerate(s["px"]):
            for x, c in enumerate(row):
                if c != ".":
                    v = s["pal"][c]
                    im.putpixel((x, y), (int(v[1:3], 16), int(v[3:5], 16), int(v[5:7], 16), 255))
        sheet.alpha_composite(im.resize((144, 144), Image.NEAREST), (i * 144, 0))
    sheet.save(HERE / "out" / "prize-icons.png")
    print("icons:", ", ".join(icons))


if __name__ == "__main__":
    main()
