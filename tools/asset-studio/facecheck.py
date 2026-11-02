"""Second check of the cast pictures by the local Qwen vision model (LM Studio), after faces.py --cast.

  python tools/asset-studio/facecheck.py 0:300:23            check people, write out/faces/cast/check.json, report failures
  python tools/asset-studio/facecheck.py 0:300:23 --reject   also delete failed pictures so the next faces.py --cast run repaints them
                                                             with a new seed (the attempt count is kept in report.json)
Qwen and ComfyUI do not fit in memory together: run this only while ComfyUI is stopped. It loads and unloads Qwen itself.
"""
from __future__ import annotations

import base64
import io
import json
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
CAST = HERE / "out" / "faces" / "cast"
PEOPLE = HERE / "out" / "faces" / "people.json"
LMS = str(Path.home() / ".lmstudio" / "bin" / "lms.exe")
MODEL = "qwen3.8-27b-uncensored-hauhaucs-aggressive-mtp@iq3_xs"
AGES = ["child", "teenager", "20s", "30s-40s", "50s", "60s-70s", "85+"]  # the seven bands of people.py
SYSTEM = "You check pixel-art character portraits for a game. Look carefully and answer with JSON only, no other text."


def img(path: Path) -> dict:
    from PIL import Image
    b = io.BytesIO()
    Image.open(path).convert("RGB").resize((384, 384), Image.BOX).save(b, "PNG")
    return {"type": "image_url", "image_url": {"url": "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()}}


def ask(text: str, *paths: Path) -> dict:
    body = {"model": MODEL, "temperature": 0, "max_tokens": 200, "reasoning_effort": "none",
            "messages": [{"role": "system", "content": SYSTEM}, {"role": "user", "content": [{"type": "text", "text": text}, *[img(p) for p in paths]]}]}
    req = urllib.request.Request("http://127.0.0.1:1234/v1/chat/completions", json.dumps(body).encode(), {"content-type": "application/json"})
    out = json.loads(urllib.request.urlopen(req, timeout=300).read())["choices"][0]["message"]["content"]
    m = re.search(r"\{.*\}", out, re.S)
    try:
        return json.loads(m.group(0)) if m else {"error": out[:200]}
    except json.JSONDecodeError:
        return {"error": out[:200]}


Q_ORIG = ('One portrait. Reply {"presentation": "woman" or "man" or "girl" or "boy" or "unclear", '
          '"age": "child" or "teenager" or "20s" or "30s-40s" or "50s" or "60s-70s" or "85+", '
          '"face_complete": true if both eyes, the nose and the mouth are clearly drawn, else false}.')
Q_SAME = ('Two portraits. Is the second the SAME person as the first (same face shape, eyes, nose and mouth), with only hair, glasses, '
          'headwear or clothes changed? Reply {"same_person": true or false, "face_complete": true if the second has both eyes, the nose and the mouth clearly drawn}.')
Q_LOOK = ('Two portraits. Ignore hair, clothes and accessories and look only at the faces. Reply {"same_person": true if the two faces are '
          'the same person, false if they are different people, "face_complete": true if the SECOND portrait has both eyes, the nose and the mouth clearly drawn}.')


def check_person(p: dict) -> dict:
    pid = p["id"]
    o, la, rs = CAST / f"{pid}.png", CAST / f"{pid}_lookalike.png", CAST / f"{pid}_restyle.png"
    res = {}
    if o.exists():
        a = ask(Q_ORIG, o)
        res["orig"] = a
        age_i = AGES.index(a["age"]) if a.get("age") in AGES else None
        pres = {"girl": "woman", "boy": "man"}.get(a.get("presentation"), a.get("presentation"))
        res["orig_ok"] = bool(a.get("face_complete")) and (p["pres"] == "person" or pres in (p["pres"], "unclear")) and (age_i is None or abs(age_i - p["age"]) <= 1)
    if o.exists() and rs.exists():
        b = ask(Q_SAME, o, rs)
        res["restyle"] = b
        res["restyle_ok"] = bool(b.get("same_person")) and bool(b.get("face_complete"))
    if o.exists() and la.exists():
        c = ask(Q_LOOK, o, la)
        res["lookalike"] = c
        res["lookalike_ok"] = bool(c.get("face_complete")) and c.get("same_person") is not True
    return res


def main():
    sel = sys.argv[1] if len(sys.argv) > 1 and ":" in sys.argv[1] else "0:300"
    reject = "--reject" in sys.argv
    people_file = Path(next((a.split("=", 1)[1] for a in sys.argv if a.startswith("--people=")), PEOPLE))
    people = json.loads(people_file.read_text(encoding="utf-8"))[slice(*(int(x) for x in sel.split(":")))]
    subprocess.run([LMS, "load", MODEL, "--context-length", "8192", "--gpu", "max", "-y"], capture_output=True)
    rep_path, chk_path = CAST / "report.json", CAST / "check.json"
    report = json.loads(rep_path.read_text(encoding="utf-8")) if rep_path.exists() else {}
    checks = json.loads(chk_path.read_text(encoding="utf-8")) if chk_path.exists() else {}
    bad = []
    try:
        for p in people:
            pid = p["id"]
            if not (CAST / f"{pid}.png").exists():
                continue
            res = check_person(p)
            checks[pid] = res
            fails = [k[:-3] for k in ("orig_ok", "restyle_ok", "lookalike_ok") if res.get(k) is False]
            print(pid, "ok" if not fails else "FAIL " + ", ".join(fails), json.dumps({k: v for k, v in res.items() if not k.endswith("_ok")}), flush=True)
            if fails:
                bad.append((pid, fails))
            if reject and fails:
                r = report.setdefault(pid, {})
                if "orig" in fails:  # a wrong or broken original takes its edits with it
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
            chk_path.write_text(json.dumps(checks, indent=1), encoding="utf-8")
            rep_path.write_text(json.dumps(report, indent=1), encoding="utf-8")
    finally:
        subprocess.run([LMS, "unload", "--all"], capture_output=True)
    print(f"checked {len(people)}, failed {len(bad)}:", bad)


if __name__ == "__main__":
    main()
