"""Removes the violet / magenta colour cast that the image model adds to its pictures (owner, Nov 8, 2026: "almost all of the ComfyUI
images have a violet tint").  Prompts now avoid it (see docs/ART.md, "Colour cast"), and every picture that motion.run_wf saves goes through
decast() as a safety net, so the tint cannot come back unnoticed.

How: only violet and magenta pixels are touched (hue 232 to 345 degrees, in HSV, with a soft edge). Their hue is turned toward a neutral
blue-teal (about 212 degrees) and their saturation is lowered a little, so purple haze, purple stone and a purple sky become blue-grey. Oranges,
peaches, ambers, greens and true blues are left exactly as painted, so lamp glow and sunsets keep their colour.  A first version that lifted
green over the whole picture made skies yellow-green, so do not use a global green gain.

python colorfix.py <picture.png> [more.png ...] [--write]     (prints how much violet there was before and after; --write saves over the picture)
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image

H0, H1, SOFT = 232 / 360, 345 / 360, 22 / 360   # violet to magenta band, soft edge width
TARGET = 212 / 360                              # blue-teal the violet is turned toward
TURN, DESAT = 0.9, 0.30                        # how far toward TARGET, how much saturation is removed


def _weight(h, s, v):
    w = np.clip((h - (H0 - SOFT)) / SOFT, 0, 1) * np.clip(((H1 + SOFT) - h) / SOFT, 0, 1)
    return w * np.clip((s - 0.06) / 0.2, 0, 1) * np.clip((v - 0.06) / 0.15, 0, 1)


def violet_share(im):
    hsv = np.asarray(im.convert("RGB").convert("HSV"), dtype=np.float32) / 255.0
    return float(_weight(hsv[..., 0], hsv[..., 1], hsv[..., 2]).mean())


def decast(im):
    rgb = im.convert("RGB")
    hsv = np.asarray(rgb.convert("HSV"), dtype=np.float32) / 255.0
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    w = _weight(h, s, v)
    before = float(w.mean())
    if before < 0.01:
        return rgb, before, before
    h2 = h + (TARGET - h) * TURN * w
    s2 = s * (1 - DESAT * w)
    out = np.stack([h2, s2, v], axis=-1)
    res = Image.fromarray((out * 255).clip(0, 255).astype(np.uint8), "HSV").convert("RGB")
    return res, before, violet_share(res)


def decast_file(path):
    im = Image.open(path)
    res, before, after = decast(im)
    if after != before:
        res.save(path)
    return before, after


if __name__ == "__main__":
    write = "--write" in sys.argv
    for p in [x for x in sys.argv[1:] if not x.startswith("--")]:
        im = Image.open(p)
        res, before, after = decast(im)
        print(f"{Path(p).name}: violet {before * 100:.1f}% -> {after * 100:.1f}%")
        if write and after != before:
            res.save(p)
