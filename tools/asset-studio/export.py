"""Copies traced drafts into the game (owner approved all of them on Nov 1, 2026).

Writes src/pixel/traced.js (sprites) and src/data/traced-items.js (item and treasure data).
Usage: python tools/asset-studio/export.py
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent / "out"
OUTLINE = "#140f1a"


def retrace_if_faint(cat, it_id, s):
    # Dark things on the dark background can be cut away with it; trace again with a tighter cut.
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from studio import trace_one
    for cut in (30, 20, 12):
        if sum(len(r.replace(".", "")) for r in s["px"]) - sum(r.count([k for k, v in s["pal"].items() if v == OUTLINE][0]) for r in s["px"]) > 60:
            break
        s = trace_one(OUT / cat / f"{it_id}.png", s["w"], s["h"], False, cut=cut)
    return s


def load(cat):
    items = json.loads((OUT / cat / "plan.json").read_text(encoding="utf-8"))
    res = []
    for it in items:
        f = OUT / cat / f"{it['id']}.traced.json"
        if f.exists():
            s = json.loads(f.read_text())
            if cat != "cutscene":
                s = retrace_if_faint(cat, it["id"], s)
            txt = OUT / cat / f"{it['id']}.txt"
            res.append({**it, "sprite": fix_outline(s), "text": txt.read_text(encoding="utf-8").strip() if txt.exists() else ""})
    return res


def fix_outline(s):
    # The item tests expect the outline colour under key 'o'.
    pal, px = dict(s["pal"]), s["px"]
    out_key = next((k for k, v in pal.items() if v == OUTLINE), None)
    if out_key is None or out_key == "o":
        return s
    swap = {out_key: "o"}
    if "o" in pal:
        swap["o"] = out_key
    pal = {swap.get(k, k): v for k, v in pal.items()}
    px = ["".join(swap.get(c, c) for c in r) for r in px]
    return {**s, "pal": pal, "px": px}


def clean(t: str) -> str:
    return re.sub(r"\s*[–—]\s*", ", ", t).strip()


def main():
    sprites = {}
    items = []
    # Keepsakes: delayed recalls that held (learning only).
    for it, n, r in zip(load("relics"), [2, 4, 6, 8, 10, 14, 18, 24, 30, 40], ["common", "common", "rare", "rare", "rare", "rare", "epic", "epic", "epic", "legendary"]):
        iid = f"ks_{it['id']}"
        sprites[iid] = it["sprite"]
        items.append({"id": iid, "name": clean(it["name"]), "kind": "keepsake", "rarity": r, "source": {"type": "held", "n": n}, "lore": clean(f"{it['story']} {it['look']}")})
    # Old documents: one for each of the first eight gates, with the text you can read.
    for it, g in zip(load("lore_docs"), [f"M{i}" for i in range(1, 9)]):
        iid = f"doc_{it['id']}"
        sprites[iid] = it["sprite"]
        items.append({"id": iid, "name": clean(it["name"]), "kind": "document", "rarity": "rare", "source": {"type": "gate", "id": g}, "lore": clean(it["text"] or it["story"])})
    # Lost and found: relics polished with recall cards.
    for it, n in zip(load("side_quest"), [1, 2, 3, 4, 5, 6, 8, 10, 12, 15]):
        iid = f"lf_{it['id']}"
        sprites[iid] = it["sprite"]
        items.append({"id": iid, "name": clean(it["name"]), "kind": "found", "rarity": "common" if n < 6 else "rare", "source": {"type": "polish", "n": n}, "lore": clean(f"{it['story']} {it['look']}")})
    # Keeper's gear: skill levels gained.
    for it, n in zip(load("inventory"), [1, 3, 5, 8, 11, 14, 18, 22, 26]):
        iid = f"gear_{it['id']}"
        sprites[iid] = it["sprite"]
        items.append({"id": iid, "name": clean(it["name"]), "kind": "gear", "rarity": "common" if n < 8 else "rare" if n < 20 else "epic", "source": {"type": "levels", "n": n}, "lore": clean(f"{it['story']} {it['look']}")})
    # Undercroft: bosses get art; everything else becomes a deep treasure.
    boss_art, treasures = {}, []
    depths = iter([47, 49, 52, 54, 57, 63, 66])
    for it in load("undercroft"):
        if it["id"].startswith("crypt_boss_"):
            name = clean(it["name"])
            boss_art[name] = f"boss_{it['id']}"
            sprites[f"boss_{it['id']}"] = it["sprite"]
        else:
            tid = f"ct_{it['id']}"
            import sys
            sys.path.insert(0, str(Path(__file__).resolve().parent))
            from studio import trace_one  # treasures use the 24x24 icon size
            sprites[tid] = fix_outline(trace_one(OUT / "undercroft" / f"{it['id']}.png", 24, 24, False))
            hue = next(iter(v for v in it["sprite"]["pal"].values() if v != OUTLINE), "#b8c2d6")
            treasures.append({"id": tid, "depth": next(depths), "name": clean(it["name"]), "hue": hue, "desc": clean(it["story"] or it["look"])})
    # Furniture for palace rooms, character sketches and story panels.
    furniture = {}
    for it in load("furniture"):
        furniture[it["id"]] = it["sprite"]
    sketch_of = {"wren": "wren", "old_tansy": "tansy", "sevrin": "sevrin", "joss_hask": "hask", "isolde": "isolde", "mosk": "mosk"}
    sketches = {}
    for it in load("portraits"):
        who = next((v for k, v in sketch_of.items() if it["id"].startswith(k)), None)
        if who:
            sketches.setdefault(who, []).append({"id": it["id"], "name": clean(it["name"]), "sprite": it["sprite"]})
    panels = {it["id"]: it["sprite"] for it in load("cutscene")}

    js = lambda o: json.dumps(o, separators=(",", ":"), ensure_ascii=False)  # noqa: E731
    (ROOT / "src/pixel/traced.js").write_text(
        "// v0.9.1 art traced from pictures made by the local image model (owner decision, Nov 1 2026).\n"
        "// Generated by tools/asset-studio/export.py; edit the drafts and re-run rather than editing by hand.\n"
        f"export const TRACED_ICONS = {js(sprites)};\n"
        f"export const TRACED_FURNITURE = {js(furniture)};\n"
        f"export const SKETCHES = {js(sketches)};\n"
        f"export const PANELS = {js(panels)};\n"
        f"export const BOSS_ART = {js(boss_art)};\n", encoding="utf-8")
    (ROOT / "src/data/traced-items.js").write_text(
        "// v0.9.1 collectibles drafted by local models (Qwen text, traced image-model art). Ids are permanent once released.\n"
        "// Generated by tools/asset-studio/export.py.\n"
        f"export const TRACED_ITEMS = {json.dumps(items, indent=1, ensure_ascii=False)};\n"
        f"export const DEEP_TREASURES = {json.dumps(treasures, indent=1, ensure_ascii=False)};\n", encoding="utf-8")
    print(len(items), "items,", len(treasures), "treasures,", len(furniture), "furniture,", sum(len(v) for v in sketches.values()), "sketches,", len(panels), "panels,", len(boss_art), "bosses")


if __name__ == "__main__":
    main()
