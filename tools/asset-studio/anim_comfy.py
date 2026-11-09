"""Animation frames painted by ComfyUI (owner, Nov 8, 2026: "create frames using comfy ui and then convert them in a gif").
Each frame is the finished map picture repainted with the Qwen-Image image-to-image workflow at a LOW denoise, a new seed per frame and a
prompt that asks for the small motions of a living city. Low denoise keeps the layout; the seed changes the small details (people, smoke,
water, lamps), which gives a hand-drawn "boiling" life. Only the model already on this PC is used.

python anim_comfy.py frames <picture.png> <outdir> <n> <denoise> [seed0]
python anim_comfy.py gif <outdir> <out.gif> [fps] [width]       (ping-pong loop, so it is seamless)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import motion as M  # noqa: E402
from PIL import Image  # noqa: E402

MOTION = ("The same city, the same layout, the same buildings in exactly the same places. Only tiny natural motion between frames: the townsfolk "
          "and animals are a half-step further along, smoke curls a little differently, water ripples, lamp and window light flickers, flags and "
          "washing sway, boats drift a little, birds in a new position. Keep the fine detailed pixel art style, the old weathered stone and the "
          "same colours and lighting. ")


def frames(pic, outdir, n, denoise, seed0):
    outdir.mkdir(parents=True, exist_ok=True)
    im = Image.open(pic).convert("RGB")
    M.studio.free_llm()
    if not M.studio.start_comfy():
        print("ComfyUI did not start"); return
    try:
        ref = M.upload(im, "mnemos_anim_ref.png")
        for i in range(n):
            dest = outdir / f"f{i:02d}.png"
            if dest.exists():
                continue
            M.run_wf(M.edit_wf(MOTION + M.LOOK_FINE, ref, seed0 + i * 11, "4:3 (Standard)", 1.0, denoise), dest, f"anim frame {i} denoise {denoise}")
    finally:
        try:
            M.studio.comfy("/free", {"unload_models": True, "free_memory": True})
        except Exception:  # noqa: BLE001
            pass
        if M.studio.STARTED:
            M.studio.STARTED.terminate()


def gif(outdir, out, fps=6, width=900):
    fs = [Image.open(p).convert("RGB") for p in sorted(outdir.glob("f*.png"))]
    fs = [f.resize((width, round(f.height * width / f.width)), Image.LANCZOS) for f in fs]
    seq = fs + fs[-2:0:-1]  # ping-pong
    samp = Image.new("RGB", (fs[0].width, fs[0].height * min(3, len(fs))))
    for k in range(min(3, len(fs))):
        samp.paste(fs[k * len(fs) // 3], (0, k * fs[0].height))
    pal = samp.quantize(colors=255, method=Image.MEDIANCUT)
    g = [f.quantize(palette=pal, dither=Image.FLOYDSTEINBERG) for f in seq]
    g[0].save(out, save_all=True, append_images=g[1:], duration=round(1000 / fps), loop=0, disposal=1)
    seq[0].save(str(Path(out).with_suffix(".webp")), save_all=True, append_images=seq[1:], duration=round(1000 / fps), loop=0, quality=85, method=4)
    print("wrote", out, Path(out).stat().st_size // 1024, "KB")


if __name__ == "__main__":
    if sys.argv[1] == "frames":
        frames(Path(sys.argv[2]), Path(sys.argv[3]), int(sys.argv[4]), float(sys.argv[5]), int(sys.argv[6]) if len(sys.argv) > 6 else 300000)
    else:
        gif(Path(sys.argv[2]), sys.argv[3], int(sys.argv[4]) if len(sys.argv) > 4 else 6, int(sys.argv[5]) if len(sys.argv) > 5 else 900)
