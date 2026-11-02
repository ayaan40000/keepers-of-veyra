"""Builds the whole face cast unattended, using the local models only (owner, Nov 2 2026).

  python tools/asset-studio/cast_run.py [N=300] [BATCH=50]

1. Qwen (LM Studio) writes every description (people_llm.py; already-described people are skipped).
2. For each batch of people: ComfyUI paints originals, look-alikes and new looks (faces.py --cast), Qwen checks them and deletes
   failures (facecheck.py --reject), ComfyUI repaints the failures, and Qwen checks once more (report only).
Only one model is loaded at a time (31 GB RAM): each step loads and frees its own. Finished pictures are skipped, so the
script can be stopped and started again. Progress: out/faces/cast_run.log; pictures appear in out/faces/cast/ (see live.html).
Speed settings are in faces.py (an original about 11 s, a look-alike about 11 s, a new-look edit about 40 s).
"""
from __future__ import annotations

import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
LOG = HERE / "out" / "faces" / "cast_run.log"


def step(*args):
    t0 = time.time()
    with LOG.open("a", encoding="utf-8") as f:
        f.write(f"\n== {' '.join(args)}  ({time.strftime('%H:%M:%S')})\n")
        f.flush()
        subprocess.run([sys.executable, str(HERE / args[0]), *args[1:]], stdout=f, stderr=subprocess.STDOUT, cwd=HERE.parents[1])
        f.write(f"== done in {(time.time() - t0) / 60:.1f} min\n")


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 300
    batch = int(sys.argv[2]) if len(sys.argv) > 2 else 50
    LOG.parent.mkdir(parents=True, exist_ok=True)
    step("people_llm.py", f"0:{n}")
    for lo in range(0, n, batch):
        sel = f"{lo}:{min(n, lo + batch)}"
        step("faces.py", "--cast", sel)
        step("facecheck.py", sel, "--reject")
        step("faces.py", "--cast", sel)
        step("facecheck.py", sel)
        step("face_sheet.py", "--cast", str(HERE.parents[1] / "docs" / "review" / "face-cast-full.png"))
    with LOG.open("a", encoding="utf-8") as f:
        f.write(f"\nALL DONE {time.strftime('%H:%M:%S')}\n")


if __name__ == "__main__":
    main()
