"""Apply the Claude reviewer's face verdicts: delete failed pictures and bump their attempt count, like facecheck.py --reject.

  python tools/asset-studio/apply_review.py          then: python tools/asset-studio/faces.py --cast 0:150 repaints them

Run it only when no faces.py is painting (both write out/faces/cast/report.json).
verdicts.json: {"p012": {"fails": ["lookalike"], "why": "..."}, ...}; fails may hold "orig", "restyle", "lookalike".
Applied ids are recorded in verdicts_applied.json so a second run does not reject them twice.
"""
from __future__ import annotations

import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
CAST = HERE / "out" / "faces" / "cast"
REVIEW = HERE / "out" / "faces" / "review"


def main():
    verdicts = json.loads((REVIEW / "verdicts.json").read_text(encoding="utf-8"))
    done_path = REVIEW / "verdicts_applied.json"
    done = json.loads(done_path.read_text(encoding="utf-8")) if done_path.exists() else {}
    rep_path = CAST / "report.json"
    report = json.loads(rep_path.read_text(encoding="utf-8")) if rep_path.exists() else {}
    n = 0
    for pid, v in verdicts.items():
        fails = v.get("fails") or []
        if not fails or done.get(pid) == fails:
            continue
        r = report.setdefault(pid, {})
        if "orig" in fails:  # a wrong original takes its edits with it
            for f in (f"{pid}.png", f"{pid}_lookalike.png", f"{pid}_restyle.png"):
                (CAST / f).unlink(missing_ok=True)
            r["attempt"] = r.get("attempt", 0) + 1
            r.pop("lookalike", None); r.pop("weak", None)
        else:
            for k in fails:
                (CAST / f"{pid}_{k}.png").unlink(missing_ok=True)
                r[f"{k}_attempt"] = r.get(f"{k}_attempt", 0) + 1
                if k == "lookalike":
                    r.pop("lookalike", None); r.pop("weak", None)
        done[pid] = fails
        n += 1
    rep_path.write_text(json.dumps(report, indent=1), encoding="utf-8")
    done_path.write_text(json.dumps(done, indent=1), encoding="utf-8")
    print(f"rejected pictures for {n} people; repaint with faces.py --cast")


if __name__ == "__main__":
    main()
