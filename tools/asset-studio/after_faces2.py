"""Second chain (Nov 2, 2026): paints the owner-approved story and trial additions once after_faces.py has finished.

  python tools/asset-studio/after_faces2.py --dry        print the plan and the state of after_faces.py; changes nothing
  python tools/asset-studio/after_faces2.py              wait for after_faces.py, then run the steps below
  python tools/asset-studio/after_faces2.py --no-wait    skip the wait

1. wait until out/after_faces.log says "after_faces chain finished" after its latest "after_faces chain started" and no after_faces.py
   python process is left (if it vanished without finishing, this chain stops and says so).
2. free models (LM Studio unload, ComfyUI /free if one is up), then
   gen.py --only story_,trialx_,prizex_ --seeds 2     (3 portraits, 3 story scenes, the winding mark, 2 trial scenes, 2 prize objects)
3. rebuild the review sheets in docs/review/: new-art-sheet.png and new-art-sprites-sheet.png (from after_faces.build_sheets) and
   new-art-sheet2.png (story portraits, scenes, mark, trial scenes and prizes, both seeds).
Not done on purpose: no faces, no ship.py, no day versions, no picreview of these drafts (run picreview.py by hand if wanted).
The two prize objects (prizex_) are for prizes.py to trace into 24x24 icons; they are not shipped as files.
Log with timings: tools/asset-studio/out/after_faces2.log.
"""
from __future__ import annotations

import argparse
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import after_faces as af  # noqa: E402  (only its helpers; importing starts nothing)

LOG = af.OUT / "after_faces2.log"
FIRST_LOG = af.LOG
PREFIXES = ["story_", "trialx_", "prizex_"]


def log(*a):
    line = f"{time.strftime('%H:%M:%S')} " + " ".join(str(x) for x in a)
    print(line, flush=True)
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with LOG.open("a", encoding="utf-8") as f:
        f.write(line + "\n")


def first_chain_processes() -> list:
    ps = "Get-CimInstance Win32_Process -Filter \"Name like 'python%'\" | Where-Object { $_.CommandLine -like '*after_faces.py*' } | ForEach-Object { $_.ProcessId }"
    r = subprocess.run(["powershell", "-NoProfile", "-Command", ps], capture_output=True, text=True, timeout=60)
    return [int(x) for x in r.stdout.split() if x.strip().isdigit()]


def first_chain_state() -> str:
    """'done' when "chain finished" follows the latest "chain started" in after_faces.log, 'running' if not, 'none' without a log."""
    if not FIRST_LOG.exists():
        return "none"
    lines = FIRST_LOG.read_text(encoding="utf-8", errors="replace").splitlines()
    start = max((i for i, l in enumerate(lines) if "after_faces chain started" in l), default=-1)
    done = max((i for i, l in enumerate(lines) if "after_faces chain finished" in l), default=-1)
    if start < 0 and done < 0:
        return "none"
    return "done" if done > start else "running"


def wait_for_first(poll=60) -> bool:
    while True:
        procs, state = first_chain_processes(), first_chain_state()
        if state == "done" and not procs:
            log("after_faces.py finished")
            return True
        if not procs and state != "done":
            log(f"after_faces.py is not running and its log does not say finished (state: {state}). Stopping; check it first.")
            return False
        time.sleep(poll)


def build_sheet2(dest: Path):
    from PIL import Image, ImageDraw
    import gen
    dest.mkdir(parents=True, exist_ok=True)
    new = af.OUT / "new"
    jobs = [j for j, k, _ in gen.JOBS if j.startswith(tuple(PREFIXES))]
    items = [(j, s, new / f"{j}_s{s}.png") for j in jobs for s in (0, 1)]
    items = [i for i in items if i[2].exists()]
    if not items:
        return None
    T, cols = 320, 4
    rows = (len(items) + cols - 1) // cols
    sh = Image.new("RGB", (cols * T, rows * (T * 9 // 16 + 18)), (15, 20, 32)); d = ImageDraw.Draw(sh)
    for n, (j, s, p) in enumerate(items):
        x, y = (n % cols) * T, (n // cols) * (T * 9 // 16 + 18)
        im = Image.open(p).convert("RGB")
        im.thumbnail((T - 4, T * 9 // 16), Image.BOX)
        sh.paste(im, (x + 2, y))
        d.text((x + 2, y + T * 9 // 16 + 2), f"{j} s{s}", fill=(239, 230, 210))
    f = dest / "new-art-sheet2.png"
    sh.save(f)
    return f


def plan(wait: bool) -> list:
    import gen
    jobs = [(j, k) for j, k, _ in gen.JOBS if j.startswith(tuple(PREFIXES))]
    n_scene = sum(1 for _, k in jobs if k == "scene")
    n_small = len(jobs) - n_scene
    steps = []
    if wait:
        steps.append(f"1. wait for after_faces.py (log state: {first_chain_state()}, processes: {first_chain_processes() or 'none'}), polling every 60 s")
    steps.append("2. free models (lms unload --all; ComfyUI /free if one is up)")
    steps.append(f"3. gen.py --only {','.join(PREFIXES)} --seeds 2: {len(jobs)} jobs ({n_scene} scenes, {n_small} portraits and objects) x 2 seeds = "
                 f"about {(n_scene * 75 + n_small * 30) * 2 / 60:.0f} min: " + ", ".join(j for j, _ in jobs))
    steps.append(f"4. rebuild sheets in {af.REVIEW}: new-art-sheet.png, new-art-sprites-sheet.png, new-art-sheet2.png")
    steps.append("Not run: faces, ship.py, day versions, picreview")
    return steps


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true")
    ap.add_argument("--no-wait", action="store_true")
    a = ap.parse_args()
    steps = plan(not a.no_wait)
    if a.dry:
        print("after_faces2.py plan (dry run, nothing started or changed):")
        for s in steps:
            print(" ", s)
        return
    t0 = time.time()
    log("after_faces2 chain started")
    for s in steps:
        log("plan:", s)
    if not a.no_wait and not wait_for_first():
        return
    af.LOG = LOG  # af.free_models and run_step log through af.log, which writes to af.LOG
    af.free_models()
    t1 = time.time()
    log("START gen")
    r = subprocess.run([sys.executable, str(HERE / "gen.py"), "--only", ",".join(PREFIXES), "--seeds", "2"], cwd=af.ROOT)
    log(f"END   gen: exit {r.returncode}, {(time.time() - t1) / 60:.1f} min")
    try:
        for f in af.build_sheets(af.REVIEW):
            log("sheet written:", f)
        f2 = build_sheet2(af.REVIEW)
        if f2:
            log("sheet written:", f2)
    except Exception as e:  # noqa: BLE001
        log("sheets failed:", e)
    af.free_models()
    log(f"after_faces2 chain finished in {(time.time() - t0) / 60:.1f} min. Nothing was shipped.")


if __name__ == "__main__":
    main()
