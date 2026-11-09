"""Make a looping animation (GIF + animated WebP) from ONE finished painted map picture, no new painting needed (owner, Nov 8, 2026).
Everything moves in a seamless loop: shimmering sea and river, flickering windows and lamps, waterfalls running, drifting mist,
chimney smoke, townsfolk, carts, boats and birds on little paths, a few star twinkles. Effects work on the picture's own pixels, so
the layout stays exactly as painted.

python animate_map.py <picture.png> <config.json> <out_basename> [--frames 32] [--fps 12] [--width 960]

config.json (all coordinates are in the picture's own pixels; every key optional):
  "water":   [[x0,y0,x1,y1], ...]    boxes where the sea/river is (shimmer is applied to bluish smooth pixels inside)
  "smoke":   [[x,y], ...]            chimney tops
  "walkers": [{"path": [[x,y],...], "n": 3, "kind": "person|cart|carriage|sheep|boat|barge", "speed": 1}]  (path is a loop that is walked back and forth)
  "birds":   [[x,y,r], ...]          a bird circling around (x,y) with radius r
  "mist":    [y0, y1]                a band where silver mist drifts
  "windows": true|false              flicker warm lit pixels (default true)
"""
import argparse, json, math, random, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter


def hash2(a, b, seed=0):
    return ((a * 73856093) ^ (b * 19349663) ^ (seed * 83492791)) & 0xFFFF


def make_noise(w, h, scale, seed):
    rng = np.random.default_rng(seed)
    small = rng.random((h // scale + 2, w // scale + 2)).astype(np.float32)
    im = Image.fromarray((small * 255).astype(np.uint8)).resize((w + scale * 2, h + scale * 2), Image.BICUBIC)
    return np.asarray(im, dtype=np.float32)[:h, :w] / 255.0


def seg_pos(path, u):
    """Point at fraction u (0..1) along a polyline."""
    d = [math.dist(path[i], path[i + 1]) for i in range(len(path) - 1)]
    tot = sum(d) or 1
    t = u * tot
    for i, L in enumerate(d):
        if t <= L or i == len(d) - 1:
            f = 0 if L == 0 else min(1, t / L)
            return (path[i][0] + (path[i + 1][0] - path[i][0]) * f, path[i][1] + (path[i + 1][1] - path[i][1]) * f, path[i + 1][0] - path[i][0])
        t -= L


def draw_actor(dr, kind, x, y, dx, tick, s):
    flip = 1 if dx >= 0 else -1
    if kind == "person":
        c = random.Random(int(x * 7 + y)).choice([(196, 90, 70), (210, 170, 90), (90, 120, 170), (140, 100, 150), (170, 170, 160)])
        dr.rectangle([x - 1 * s, y - 4 * s, x + 1 * s, y], fill=c)
        dr.rectangle([x - 1 * s, y - 6 * s, x + 1 * s, y - 4 * s], fill=(230, 195, 160))
        step = 1 if tick % 2 == 0 else -1
        dr.point([(x - step * s, y + 1 * s), (x + step * s, y + 1 * s)], fill=(40, 34, 40))
    elif kind == "sheep":
        dr.ellipse([x - 3 * s, y - 3 * s, x + 3 * s, y], fill=(228, 224, 214))
        dr.rectangle([x + flip * 3 * s - s, y - 3 * s, x + flip * 3 * s + s, y - s], fill=(60, 54, 58))
    elif kind in ("cart", "carriage"):
        body = (110, 76, 50) if kind == "cart" else (60, 50, 80)
        dr.rectangle([x - 6 * s, y - 5 * s, x + 4 * s, y - 1 * s], fill=body)
        dr.rectangle([x - 5 * s, y - 7 * s, x + 3 * s, y - 5 * s], fill=(200, 180, 120) if kind == "cart" else (90, 70, 110))
        for wx in (x - 4 * s, x + 2 * s):
            dr.ellipse([wx - 1.5 * s, y - 2 * s, wx + 1.5 * s, y + 1 * s], fill=(30, 26, 30))
        hx = x + flip * 8 * s  # the ox or horse pulling it
        dr.rectangle([hx - 3 * s, y - 5 * s, hx + 3 * s, y - 1 * s], fill=(120, 84, 60) if kind == "cart" else (48, 40, 40))
        dr.rectangle([hx + flip * 3 * s - s, y - 7 * s, hx + flip * 3 * s + s, y - 4 * s], fill=(120, 84, 60) if kind == "cart" else (48, 40, 40))
    elif kind in ("boat", "barge"):
        w = 7 if kind == "boat" else 9
        dr.polygon([(x - w * s, y - 1 * s), (x + w * s, y - 1 * s), (x + (w - 2) * s, y + 2 * s), (x - (w - 2) * s, y + 2 * s)], fill=(70, 48, 36))
        if kind == "boat":
            dr.line([(x, y - 1 * s), (x, y - 12 * s)], fill=(50, 40, 40), width=max(1, s))
            dr.polygon([(x + 1 * s, y - 11 * s), (x + 1 * s, y - 2 * s), (x + 7 * s * flip, y - 3 * s)], fill=(222, 214, 196))
        else:
            dr.rectangle([x - 3 * s, y - 4 * s, x + 3 * s, y - 1 * s], fill=(150, 110, 70))
        dr.line([(x - w * s - 2 * s, y + 3 * s), (x + w * s + 2 * s, y + 3 * s)], fill=(180, 200, 230), width=1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("picture"); ap.add_argument("config"); ap.add_argument("out")
    ap.add_argument("--frames", type=int, default=32)
    ap.add_argument("--fps", type=int, default=12)
    ap.add_argument("--width", type=int, default=960)
    a = ap.parse_args()
    img = Image.open(a.picture).convert("RGB")
    W, H = img.size
    cfg = json.loads(Path(a.config).read_text(encoding="utf-8"))
    base = np.asarray(img, dtype=np.float32)
    r, g, b = base[..., 0], base[..., 1], base[..., 2]
    lum = (r + g + b) / 3
    sc = max(1, round(W / 900))  # actor size scale

    # masks
    water = np.zeros((H, W), bool)
    for x0, y0, x1, y1 in cfg.get("water", []):
        blu = (b > r + 8) & (b >= g)
        water[y0:y1, x0:x1] |= blu[y0:y1, x0:x1]
    glints = np.asarray(Image.fromarray(water.astype(np.uint8) * 255).filter(ImageFilter.MinFilter(3))) > 0
    warm = (r > 170) & (g > 110) & (b < 150) & (r > b + 50) & (lum > 130)
    blur = np.asarray(Image.fromarray(lum.astype(np.uint8)).filter(ImageFilter.BoxBlur(9)), dtype=np.float32)
    warm &= (lum - blur) > 22  # only small bright spots (windows, lamps), never a glowing sky or sea
    fall = (b > 170) & (b > r + 30) & (lum > 150)  # pale blue-white water (waterfalls, foam)
    n1 = make_noise(W, H, 6, 1)
    n_mist = make_noise(W * 2, H, 90, 2)
    n_mist2 = make_noise(W * 2, H, 40, 3)
    cellid = (np.arange(H)[:, None] // 5) * 997 + (np.arange(W)[None, :] // 5)
    cellphase = ((cellid * 2654435761) & 0xFFFF) / 65535.0
    N = a.frames
    frames = []
    for f in range(N):
        t = f / N
        ph = 2 * math.pi * t
        arr = base.copy()
        # sea and river: shift each row sideways with a travelling wave, plus drifting sparkle
        if water.any():
            sh = np.round(np.sin(np.arange(H) * 0.35 + ph) * 1.6 + np.sin(np.arange(H) * 0.11 - ph * 2) * 1.0).astype(int)
            shifted = np.empty_like(arr)
            smask = np.empty_like(water)
            for y in range(H):
                shifted[y] = np.roll(arr[y], sh[y], axis=0)
                smask[y] = np.roll(water[y], sh[y], axis=0)
            use = water & smask  # only move water into water, so shores and the horizon never tear
            arr[use] = shifted[use]
            spark = np.sin(n1 * 60 + ph) > 0.93
            sm = water & spark
            arr[sm] = arr[sm] * 0.6 + np.array([150, 170, 215]) * 0.4
        # waterfalls and foam: bright bands running down
        if fall.any():
            band = 0.5 + 0.5 * np.sin(np.arange(H)[:, None] * 0.7 - ph * 3 + n1 * 6)  # (H, W) via the noise
            k = 0.84 + 0.32 * band
            arr[fall] = np.clip(arr[fall] * k[fall][:, None], 0, 255)
        # windows and lamps: each little cell flickers on its own slow cycle
        if cfg.get("windows", True):
            fl = 0.86 + 0.2 * np.sin(ph * (1 + (cellid % 2)) + cellphase * 6.28) + 0.05 * np.sin(ph * 3 + cellphase * 20)
            arr[warm] = np.clip(arr[warm] * fl[warm][:, None], 0, 255)
        # mist: two drifting noise layers, silver, between y0 and y1
        if "mist" in cfg:
            y0, y1 = cfg["mist"]
            off = int(t * W)  # one full width per loop (noise is 2W wide and seamless via roll)
            m = (np.roll(n_mist, -off, axis=1)[:, :W] * 0.6 + np.roll(n_mist2, off, axis=1)[:, :W] * 0.4)
            band = np.zeros(H, np.float32); band[y0:y1] = np.sin(np.linspace(0, math.pi, max(1, y1 - y0))) ** 1.5
            al = np.clip((m - 0.45) * 2.2, 0, 1) * band[:, None] * 0.32
            arr = arr * (1 - al[..., None]) + np.array([170, 190, 225], np.float32) * al[..., None]
        fr = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).convert("RGBA")
        # actors and particles on a transparent layer
        lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        dr = ImageDraw.Draw(lay)
        for sx, sy in cfg.get("smoke", []):
            for k in range(5):
                u = (t + k / 5) % 1
                px = sx + math.sin(u * 6 + sx) * 3 * sc + u * 14 * sc
                py = sy - u * 34 * sc
                rad = (1.5 + u * 4) * sc
                al = int(120 * (1 - u))
                dr.ellipse([px - rad, py - rad, px + rad, py + rad], fill=(190, 190, 205, al))
        for wk in cfg.get("walkers", []):
            kind, n, spd = wk.get("kind", "person"), wk.get("n", 1), wk.get("speed", 1)
            for i in range(n):
                u0 = (i / n + wk.get("offset", 0)) % 1
                u = (u0 + t * spd) % 1
                uu = 2 * u if u < 0.5 else 2 - 2 * u  # walk there and back so the loop is seamless
                x, y, dx = seg_pos(wk["path"], uu)
                if u >= 0.5:
                    dx = -dx
                draw_actor(dr, kind, x, y, dx, f + i, sc)
        for bx, by, br in cfg.get("birds", []):
            for i in range(3):
                ang = ph + i * 2.1
                px, py = bx + math.cos(ang) * br * (1 + 0.3 * i), by + math.sin(ang * 2) * br * 0.3 - i * 6
                flap = 2 if (f // 2 + i) % 2 == 0 else 0
                dr.line([(px - 3 * sc, py - flap * sc), (px, py), (px + 3 * sc, py - flap * sc)], fill=(30, 26, 40, 230), width=max(1, sc))
        fr.alpha_composite(lay)
        frames.append(fr.convert("RGB"))
    if a.width and a.width != W:
        frames = [im.resize((a.width, round(H * a.width / W)), Image.LANCZOS) for im in frames]
    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    dur = round(1000 / a.fps)
    samp = Image.new("RGB", (frames[0].width, frames[0].height * 3))
    for k, i in enumerate((0, N // 3, 2 * N // 3)):
        samp.paste(frames[i], (0, k * frames[0].height))
    pal = samp.quantize(colors=255, method=Image.MEDIANCUT)
    gifs = [im.quantize(palette=pal, dither=Image.NONE) for im in frames]
    gifs[0].save(str(out) + ".gif", save_all=True, append_images=gifs[1:], duration=dur, loop=0, optimize=False, disposal=1)
    frames[0].save(str(out) + ".webp", save_all=True, append_images=frames[1:], duration=dur, loop=0, quality=82, method=4)
    print("wrote", str(out) + ".gif", (Path(str(out) + ".gif").stat().st_size // 1024), "KB;", str(out) + ".webp", (Path(str(out) + ".webp").stat().st_size // 1024), "KB")


if __name__ == "__main__":
    main()
