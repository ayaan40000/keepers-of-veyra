"""Chain runner for after the face run (Nov 2, 2026). Paints the NEW pictures, reviews them and builds review sheets. Local models only.

  python tools/asset-studio/after_faces.py --dry        print the plan and the current state of the face run; changes nothing
  python tools/asset-studio/after_faces.py              wait for the face run to finish, then run every step below
  python tools/asset-studio/after_faces.py --no-wait    skip the wait (only when you know the face run is not running)
  python tools/asset-studio/after_faces.py --skip gen,day   leave out steps (names: gen, day, picreview, sheets)

Steps, one heavy model at a time (31 GB RAM, same discipline as cast_run.py):
  0. wait: until cast_run.py has written "ALL DONE" to out/faces/cast_run.log after its latest start AND no cast_run.py python process is left.
     If the process has vanished without "ALL DONE" (crash or stopped by hand) the chain stops and says so; it never guesses.
  1. free memory: unload Qwen from LM Studio (lms unload --all) and free ComfyUI's models if a ComfyUI is already up.
  2. gen.py --only <new prefixes> --seeds 2   (vigil_, bramble_, mirror_, voice_, pedestal_, audit_, wrenmem_, longecho_)
  3. day.py --only trial_  and  day.py --only backdrop_long_vigil   (day and dawn versions of the trial pictures and the Long Vigil)
  4. free ComfyUI again, then picreview.py --drafts (the new drafts) and picreview.py (every shipped picture, faces excluded);
     each loads and unloads Qwen itself.
  5. review sheets for the owner in docs/review/: new-art-sheet.png (scenes, both seeds, with day or dawn versions) and
     new-art-sprites-sheet.png (bramble pieces, voices, pedestals).
NOT done on purpose: no faces 150 to 299 (reserved for a later session), and no ship.py (shipping waits for the owner's pick).
Log with timings: tools/asset-studio/out/after_faces.log. Every step skips pictures that already exist, so a stopped chain can be started again.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = HERE / "out"
LOG = OUT / "after_faces.log"
FACE_LOG = OUT / "faces" / "cast_run.log"
REVIEW = ROOT / "docs" / "review"
LMS = str(Path.home() / ".lmstudio" / "bin" / "lms.exe")
PREFIXES = ["vigil_", "bramble_", "mirror_", "voice_", "pedestal_", "audit_", "wrenmem_", "longecho_"]
DAY_RUNS = ["trial_", "backdrop_long_vigil"]
STEPS = ["gen", "day", "picreview", "sheets"]
COMFY = "http://127.0.0.1:8188"


def log(*a):
    line = f"{time.strftime('%H:%M:%S')} " + " ".join(str(x) for x in a)
    print(line, flush=True)
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with LOG.open("a", encoding="utf-8") as f:
        f.write(line + "\n")


def face_run_processes() -> list:
    """Process ids of python processes running cast_run.py (read-only query)."""
    ps = "Get-CimInstance Win32_Process -Filter \"Name like 'python%'\" | Where-Object { $_.CommandLine -like '*cast_run.py*' } | ForEach-Object { $_.ProcessId }"
    r = subprocess.run(["powershell", "-NoProfile", "-Command", ps], capture_output=True, text=True, timeout=60)
    return [int(x) for x in r.stdout.split() if x.strip().isdigit()]


def face_log_state() -> str:
    """'done' when ALL DONE follows the latest cast_run start, 'running' when it does not, 'none' when there is no log."""
    if not FACE_LOG.exists():
        return "none"
    lines = FACE_LOG.read_text(encoding="utf-8", errors="replace").splitlines()
    start = max((i for i, l in enumerate(lines) if l.startswith("== people_llm.py")), default=-1)
    done = max((i for i, l in enumerate(lines) if l.startswith("ALL DONE")), default=-1)
    if start < 0 and done < 0:
        return "none"
    return "done" if done > start else "running"


def wait_for_faces(poll=60) -> bool:
    while True:
        procs, state = face_run_processes(), face_log_state()
        if state == "done" and not procs:
            log("face run finished (ALL DONE in cast_run.log, no cast_run.py process)")
            return True
        if not procs and state != "done":
            log(f"cast_run.py is not running but the log does not say ALL DONE (state: {state}). Stopping; check the face run first.")
            return False
        time.sleep(poll)


def free_models():
    try:
        subprocess.run([LMS, "unload", "--all"], timeout=120, capture_output=True)
        log("LM Studio models unloaded")
    except Exception as e:  # noqa: BLE001
        log("could not unload LM Studio models:", e)
    try:  # only if a ComfyUI is already up (for example Comfy Desktop); gen.py and day.py start and stop their own otherwise
        urllib.request.urlopen(urllib.request.Request(COMFY + "/free", json.dumps({"unload_models": True, "free_memory": True}).encode(),
                                                      {"content-type": "application/json"}), timeout=10).read()
        log("ComfyUI models freed")
    except Exception:  # noqa: BLE001
        pass


def run_step(name, *args) -> bool:
    t0 = time.time()
    log(f"START {name}: {' '.join(args)}")
    r = subprocess.run([sys.executable, str(HERE / args[0]), *args[1:]], cwd=ROOT)
    log(f"END   {name}: exit {r.returncode}, {(time.time() - t0) / 60:.1f} min")
    return r.returncode == 0


def build_sheets(dest: Path) -> list:
    """Review sheets from the drafts in out/new and out/day. Returns the files written."""
    from PIL import Image, ImageDraw
    sys.path.insert(0, str(HERE))
    import gen  # noqa: E402
    dest.mkdir(parents=True, exist_ok=True)
    flags = {}
    for fn in ("drafts.json",):
        p = OUT / "picreview" / fn
        if p.exists():
            flags = {r["id"]: r["problems"] for r in json.loads(p.read_text(encoding="utf-8"))}
    written = []
    new, day = OUT / "new", OUT / "day"

    def label(d, x, y, text, pid):
        bad = flags.get(pid)
        d.text((x + 2, y), text[:38] + (" FLAG: " + ",".join(bad) if bad else ""), fill=(255, 150, 120) if bad else (239, 230, 210))

    # scenes: one row per scene = seed 0 | seed 1 | day or dawn version
    scenes = [j for j, k, _ in gen.JOBS if k == "scene" and j.startswith(tuple(PREFIXES))]
    trials = [j for j, k, _ in gen.JOBS if j.startswith("trial_") and k == "scene"]
    rows = [(j, [new / f"{j}_s0.png", new / f"{j}_s1.png"]) for j in scenes]
    rows += [(j, [new / f"{j}_s0.png", day / f"{j}-day.png"]) for j in trials]
    rows.append(("backdrop_long_vigil dawn", [day / "backdrop_long_vigil-day.png"]))
    rows = [(n, [p for p in ps if p.exists()]) for n, ps in rows]
    rows = [(n, ps) for n, ps in rows if ps]
    if rows:
        W, H, G = 400, 225, 6
        sh = Image.new("RGB", (3 * (W + G), len(rows) * (H + 18)), (15, 20, 32)); d = ImageDraw.Draw(sh)
        for r, (n, ps) in enumerate(rows):
            for c, p in enumerate(ps):
                sh.paste(Image.open(p).convert("RGB").resize((W, H), Image.BOX), (c * (W + G), r * (H + 18)))
                label(d, c * (W + G), r * (H + 18) + H + 2, f"{n} | {p.stem.split('_')[-1] if '-day' not in p.stem else 'day/dawn'}", p.stem)
        f = dest / "new-art-sheet.png"; sh.save(f); written.append(f)
    # sprites: bramble pieces, voices, pedestals, two seeds each
    small = [j for j, k, _ in gen.JOBS if k in ("overlay", "spirit", "prop")]
    items = [(j, s, new / f"{j}_s{s}.png") for j in small for s in (0, 1)]
    items = [i for i in items if i[2].exists()]
    if items:
        T, cols = 200, 6
        rws = (len(items) + cols - 1) // cols
        sh = Image.new("RGB", (cols * T, rws * (T + 16)), (15, 20, 32)); d = ImageDraw.Draw(sh)
        for n, (j, s, p) in enumerate(items):
            x, y = (n % cols) * T, (n // cols) * (T + 16)
            sh.paste(Image.open(p).convert("RGB").resize((T - 4, T - 4), Image.BOX), (x + 2, y))
            label(d, x, y + T - 2, f"{j} s{s}", p.stem)
        f = dest / "new-art-sprites-sheet.png"; sh.save(f); written.append(f)
    return written


def plan(wait: bool, skip: set) -> list:
    sys.path.insert(0, str(HERE))
    import gen  # noqa: E402
    import day  # noqa: E402
    n_scene = sum(1 for j, k, _ in gen.JOBS if k == "scene" and j.startswith(tuple(PREFIXES)))
    n_small = sum(1 for j, k, _ in gen.JOBS if j.startswith(tuple(PREFIXES)) and k != "scene")
    n_day = sum(1 for s in day.DAYS if s.startswith("trial_") or s == "backdrop_long_vigil")
    steps = []
    if wait:
        steps.append(f"0. wait for the face run (log state: {face_log_state()}, cast_run.py processes: {face_run_processes() or 'none'}), polling every 60 s")
    steps.append("1. free models: lms unload --all; ComfyUI /free if one is up")
    if "gen" not in skip:
        steps.append(f"2. gen.py --only {','.join(PREFIXES)} --seeds 2: {n_scene} scenes x 2 seeds (about 75 s each) + {n_small} small pictures x 2 seeds (about 30 s each) "
                     f"= about {(n_scene * 75 + n_small * 30) * 2 / 60:.0f} min")
    if "day" not in skip:
        steps.append(f"3. day.py --only trial_ ; day.py --only backdrop_long_vigil: {n_day} day or dawn pictures (about 70 s each) = about {n_day * 70 / 60:.0f} min")
    if "picreview" not in skip:
        steps.append("4. free models, then picreview.py --drafts (about 40 drafts) and picreview.py (130 shipped, faces excluded), about 4 s each = about 12 min")
    if "sheets" not in skip:
        steps.append(f"5. review sheets: {REVIEW / 'new-art-sheet.png'} and {REVIEW / 'new-art-sprites-sheet.png'}")
    steps.append("Not run: faces 150 to 299, ship.py")
    return steps


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry", action="store_true")
    ap.add_argument("--no-wait", action="store_true")
    ap.add_argument("--skip", default="")
    a = ap.parse_args()
    skip = {s for s in a.skip.split(",") if s}
    bad = skip - set(STEPS)
    if bad:
        sys.exit(f"unknown step(s) to skip: {sorted(bad)}; names are {STEPS}")
    steps = plan(not a.no_wait, skip)
    if a.dry:
        print("after_faces.py plan (dry run, nothing started or changed):")
        for s in steps:
            print(" ", s)
        return
    t0 = time.time()
    log("after_faces chain started")
    for s in steps:
        log("plan:", s)
    if not a.no_wait and not wait_for_faces():
        return
    free_models()
    if "gen" not in skip:
        run_step("gen", "gen.py", "--only", ",".join(PREFIXES), "--seeds", "2")
    if "day" not in skip:
        for only in DAY_RUNS:
            run_step(f"day {only}", "day.py", "--only", only)
    if "picreview" not in skip:
        free_models()
        run_step("picreview drafts", "picreview.py", "--drafts")
        run_step("picreview shipped", "picreview.py")
    if "sheets" not in skip:
        t1 = time.time()
        try:
            for f in build_sheets(REVIEW):
                log("sheet written:", f)
        except Exception as e:  # noqa: BLE001
            log("sheets failed:", e)
        log(f"END   sheets: {time.time() - t1:.0f} s")
    free_models()
    log(f"after_faces chain finished in {(time.time() - t0) / 60:.1f} min. Nothing was shipped and no faces were painted.")


if __name__ == "__main__":
    main()
