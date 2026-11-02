"""The local Qwen writes each cast member's portrait description from their recipe traits (owner request, Nov 2 2026).

  python tools/asset-studio/people_llm.py 0:300:23      describe these people; writes "prompt" and "promptBy" into out/faces/people.json

Qwen may add small unique touches (expression, hair detail, clothing texture) but must keep every listed trait and must not
add new accessories, marks or headwear, because the game relies on the recipe being true. A check in code makes sure most
words of every trait appear; if not, Qwen gets one more try, and then the plain recipe text is used.
Run only while ComfyUI is stopped (memory). Loads and unloads Qwen itself.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
PEOPLE = HERE / "out" / "faces" / "people.json"
LMS = str(Path.home() / ".lmstudio" / "bin" / "lms.exe")
MODEL = "qwen3.8-27b-uncensored-hauhaucs-aggressive-mtp@iq3_xs"
SYSTEM = ("You write short visual descriptions of ordinary, invented people for a pixel-art portrait painter. Respectful and specific, "
          "never a stereotype or caricature, never a real or famous person, no names. Plain English, no dashes of any kind. Reply with the description only.")
STOP = {"with", "and", "the", "her", "his", "their", "a", "an", "of", "in", "on", "one", "than", "other", "more", "over", "near", "around", "wearing", "slightly", "small", "several"}


def traits(p):
    t = [f"{p['heritage']} heritage", p["skin"] + " skin", p["build"], p["height"], p["face"], f"{p['eyeColor']} {p['eyes']}", p["brows"], p["nose"], p["mouth"], p["hair"]]
    if p.get("beard"):
        t.append(p["beard"])
    return t + p["marks"] + ([p["asym"]] if p.get("asym") else []) + p["piercings"] + p["extras"] + [p["clothes"]]


def covered(text, trait):
    words = [w for w in re.findall(r"[a-z]+", trait.lower()) if w not in STOP and len(w) > 2]
    low = text.lower()
    hit = sum(1 for w in words if w in low or (w.endswith("s") and w[:-1] in low))
    return not words or hit / len(words) >= 0.6


def ask(p, extra=""):
    import people as cast_people
    w = cast_people.who(p)
    subject = p["ageText"].replace("child", w).replace("teenager", w) if p["age"] <= cast_people.TEEN else p["ageText"].replace("adult", w)
    subject = cast_people.art(subject).replace("their", {"woman": "her", "man": "his"}.get(p["pres"], "their"))
    lines = "\n".join(f"- {t}" for t in traits(p))
    text = (f"Describe {subject}, head and upper body, facing the viewer, in 55 to 85 words, one paragraph. Use EVERY trait below, "
            f"in your own words but keeping the key words. You may add one or two small unique touches (expression, hair texture, fabric), "
            f"but do NOT add any accessory, glasses, piercing, hat, tattoo or mark that is not listed.\n{lines}{extra}")
    body = {"model": MODEL, "temperature": 0.7, "max_tokens": 260, "reasoning_effort": "none", "frequency_penalty": 0.3,
            "messages": [{"role": "system", "content": SYSTEM}, {"role": "user", "content": text}]}
    req = urllib.request.Request("http://127.0.0.1:1234/v1/chat/completions", json.dumps(body).encode(), {"content-type": "application/json"})
    out = json.loads(urllib.request.urlopen(req, timeout=300).read())["choices"][0]["message"]["content"].strip()
    out = re.sub(r"\s*[–—]\s*|\s+-{1,2}\s+", ", ", out)  # long dashes only; hyphens inside words stay
    return out.replace("\n", " ").strip('" ')


# Words for things that must come from the recipe. If the description names one that no trait mentions, Qwen invented it.
GUARDED = ["glasses", "spectacles", "hat", "cap", "beanie", "hijab", "turban", "headwrap", "bandana", "scarf", "hood", "piercing", "stud", "ring", "earring",
           "hoop", "plug", "tattoo", "bindi", "chain", "necklace", "hearing", "scar", "mole", "freckle", "birthmark", "vitiligo", "acne", "rosacea", "beard",
           "moustache", "mustache", "goatee", "stubble", "dimple"]


def invented(text, p):
    allowed = " ".join(traits(p)).lower()
    low = text.lower()
    return [w for w in GUARDED if re.search(rf"\b{w}s?\b", low) and w not in allowed and not (w == "scarf" and "shawl" in allowed)]


def problems(text, p):
    return [t for t in traits(p) if not covered(text, t)] + [f"added {w}" for w in invented(text, p)]


def main():
    sel = sys.argv[1] if len(sys.argv) > 1 else "0:300"
    people = json.loads(PEOPLE.read_text(encoding="utf-8"))
    idx = range(len(people))[slice(*(int(x) for x in sel.split(":")))]
    subprocess.run([LMS, "load", MODEL, "--context-length", "8192", "--gpu", "max", "-y"], capture_output=True)
    try:
        for i in idx:
            p = people[i]
            if p.get("promptBy") and "--redo" not in sys.argv:  # already described: a stopped run resumes
                continue
            text = ask(p)
            miss = problems(text, p)
            if miss:
                left = [m for m in miss if not m.startswith("added ")]
                added = [m[6:] for m in miss if m.startswith("added ")]
                note = (" Your last try left out: " + "; ".join(left) + "." if left else "") + (" Do not mention: " + ", ".join(added) + "." if added else "")
                text = ask(p, "\n" + note.strip())
                miss = problems(text, p)
            if miss or not 35 <= len(text.split()) <= 120:
                p["prompt"], p["promptBy"] = p["recipe"], "recipe"
                print(p["id"], "recipe (missed: " + "; ".join(miss) + ")", flush=True)
            else:
                p["prompt"], p["promptBy"] = text, "qwen"
                print(p["id"], "qwen:", text, flush=True)
            PEOPLE.write_text(json.dumps(people, indent=1), encoding="utf-8")
    finally:
        subprocess.run([LMS, "unload", "--all"], capture_output=True)


if __name__ == "__main__":
    main()
