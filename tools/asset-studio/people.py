"""The cast of the Names-and-Faces drills: a balanced, invented set of people for the image model (owner chose style D, Nov 2 2026).

  python tools/asset-studio/people.py [N]     writes tools/asset-studio/out/faces/people.json (default 300 people)

Every person is built from a recipe, so the set stays as varied as the people anyone meets in real life: heritage, skin tone,
age, build and height are spread evenly (not left to chance), and marks, asymmetries, piercings, tattoos and styles are common.
The structured traits are kept, so the game knows exactly what each look-alike changes. people_llm.py then asks the local Qwen
to write each person's description from these traits (checked in code; the plain recipe text below is the fallback).
All people are invented. Owner rules (Nov 2 2026): diverse like real life; a look-alike NEVER has the same eyes.
"""
from __future__ import annotations

import json
import random
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parent / "out" / "faces" / "people.json"

# heritage -> skin tones that are common for it (tones vary within every group)
HERITAGE = {
    "East Asian": ["fair", "light golden", "light olive", "tan"],
    "South Asian": ["light golden", "tan", "olive brown", "warm brown", "deep brown"],
    "Southeast Asian": ["light golden", "tan", "olive brown", "warm brown"],
    "Black African": ["warm brown", "deep brown", "dark brown", "very dark brown"],
    "Afro-Caribbean": ["warm brown", "deep brown", "dark brown", "olive brown"],
    "Middle Eastern or North African": ["light olive", "tan", "olive brown", "fair"],
    "Latin American": ["light olive", "tan", "olive brown", "warm brown", "fair"],
    "Indigenous American": ["tan", "olive brown", "warm brown", "light golden"],
    "Pacific Islander": ["tan", "olive brown", "warm brown", "deep brown"],
    "European": ["very fair", "fair", "light olive", "rosy fair"],
    "mixed heritage": ["light golden", "tan", "olive brown", "warm brown", "light olive"],
}
# Seven age bands (owner, Nov 2 2026). Children and teenagers are about 1 in 12 each, the adult bands about 1 in 6 each.
AGES = ["child of about eight", "teenager of about fifteen", "young adult in their twenties", "adult in their thirties or forties",
        "middle-aged adult in their fifties", "senior in their late sixties", "very old adult in their late eighties"]
AGE_LABEL = ["child", "teen", "20s", "30s-40s", "50s", "60s-70s", "85+"]
AGE_SEQ = [0, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6]
CHILD, TEEN = 0, 1
BUILD = ["thin", "slim", "average build", "stocky", "heavyset", "muscular", "soft and round"]
HEIGHT = ["very tall", "tall", "average height", "short", "very short"]
FACE = ["oval face", "round face", "square jaw", "long narrow face", "heart-shaped face", "wide face with broad cheekbones", "full soft face", "angular bony face"]
EYES = ["almond-shaped eyes", "round eyes", "hooded eyes", "monolid eyes", "deep-set eyes", "large wide-set eyes", "downturned eyes", "upturned eyes", "small close-set eyes", "heavy-lidded sleepy eyes"]
EYE_COL = ["dark brown", "brown", "light brown", "hazel", "amber", "green", "blue", "grey", "black"]
BROWS = ["thick straight eyebrows", "thin arched eyebrows", "bushy eyebrows", "sharply angled eyebrows", "soft rounded eyebrows", "sparse pale eyebrows", "a unibrow"]
NOSE = ["small button nose", "straight nose", "wide nose", "hooked nose", "long nose", "small upturned nose", "broad flat nose", "strong roman nose", "crooked nose", "pointed nose"]
MOUTH = ["full lips", "thin lips", "wide mouth", "small mouth", "heart-shaped lips", "downturned mouth", "overbite"]
MARKS = ["freckles", "a small scar through one eyebrow", "a scar on the chin", "a thin scar across the cheek", "acne marks on the cheeks", "a birthmark on the cheek",
         "vitiligo patches around the eyes", "rosacea on the cheeks and nose", "a mole on the cheek", "a beauty mark above the lip", "deep dimples",
         "laugh lines", "a chipped front tooth", "dark circles under the eyes", "pockmarked skin", "a port-wine birthmark on the neck"]
ASYM = ["one eyebrow higher than the other", "a lopsided smile", "one eye slightly smaller than the other", "a slightly crooked jaw", "one ear sticking out more"]
PIERCE = ["a small gold nose ring", "a silver nose stud", "a septum ring", "an eyebrow piercing", "a lip ring", "several earrings up one ear", "stretched earlobes with plugs",
          "large hoop earrings", "small pearl earrings", "a single dangling earring"]
EXTRAS = ["a small tattoo on the neck", "a small tattoo near one eye", "a bindi", "a hearing aid", "round wire glasses", "square dark-rimmed glasses", "thin oval glasses",
          "thick tortoiseshell glasses", "a flat cap", "a knitted beanie", "a wide-brimmed hat", "a bandana", "a turban", "a hijab", "a colourful headwrap", "a beaded necklace",
          "a thin gold chain", "a scarf around the neck"]
HAIR_COL = ["black", "dark brown", "brown", "light brown", "auburn", "red", "blond", "ash blond", "dyed blue", "dyed pink", "bleached platinum", "black with a grey streak"]
OLD_HAIR = ["grey", "white", "salt-and-pepper", "silver", "thinning grey"]
HAIR = ["long straight hair", "a high bun", "a low ponytail", "a short bob", "long curly hair", "box braids", "braids with beads", "short curly hair", "a pixie cut",
        "shoulder-length wavy hair", "locs", "an afro", "a short crop", "a side part", "a shaved head", "a buzz cut", "a receding hairline", "slicked-back hair",
        "a man bun", "shaved sides with a long top", "a mohawk", "cornrows", "a mullet", "messy bed hair", "bald on top with hair at the sides", "twists", "a long single plait"]
BEARD = ["stubble", "a moustache", "a short beard", "a full beard", "a goatee", "a long grey beard", "mutton chops"]
CLOTHES = ["t-shirt", "raincoat", "wool coat", "knitted jumper", "linen shirt", "waistcoat over a shirt", "hooded cloak", "apron over a shirt", "high-collared jacket", "tunic",
           "leather jacket", "work shirt with rolled sleeves", "patterned shawl", "denim jacket", "cardigan", "hoodie", "embroidered blouse", "quilted vest"]
CLOTH_COL = ["navy", "rust", "moss green", "plum", "mustard", "slate grey", "teal", "burgundy", "brown", "cream", "black", "olive", "coral"]
BG = ["slate blue", "sage green", "warm taupe", "dusty violet", "muted teal", "dusty rose"]
HEADWEAR = ("hijab", "turban", "headwrap", "cap", "beanie", "hat", "bandana")

# Look-alikes: eye shape AND eye colour always change (owner rule), plus one more feature from these.
SECOND = {"brows": BROWS, "face": FACE, "mouth": MOUTH, "nose": NOSE}
SECOND_W = {"brows": 3, "face": 3, "mouth": 2, "nose": 2}


def art(w):
    return ("an " if w[0] in "aeiou" else "a ") + w


def hair_words(col, style):
    if style == "a shaved head":
        return "a shaved head"
    if style.startswith("bald"):
        return f"bald on top with {col} hair at the sides"
    if style.startswith(("a ", "an ")):
        rest = style.split(" ", 1)[1]
        return art(f"{col} {rest}") + ("" if "hair" in rest or rest.split()[-1] in ("afro", "bob", "cut", "crop", "part", "bun", "ponytail", "hairline", "mohawk", "mullet", "plait", "top") else " of hair")
    return f"{col} {style}"


def clothes(r):
    return art(f"{r.choice(CLOTH_COL)} {r.choice(CLOTHES)}")


def who(p):
    """woman/man/person for adults; girl/boy/child or teenage girl/boy/teenager for the young."""
    if p["age"] == CHILD:
        return {"woman": "girl", "man": "boy"}.get(p["pres"], "child")
    if p["age"] == TEEN:
        return {"woman": "teenage girl", "man": "teenage boy"}.get(p["pres"], "teenager")
    return p["pres"]


# What each age band may have. Children: no tattoos, facial piercings, beards, dyed hair or adult skin marks. Teenagers: no tattoos or beards.
ADULT_ONLY_MARKS = {"rosacea on the cheeks and nose", "laugh lines", "dark circles under the eyes", "pockmarked skin"}
CHILD_PIERCE = ["small pearl earrings", "small stud earrings"]
TEEN_PIERCE = ["small stud earrings", "a silver nose stud", "several earrings up one ear", "large hoop earrings", "small pearl earrings", "a single dangling earring"]
YOUNG_EXTRAS = ["a hearing aid", "round wire glasses", "square dark-rimmed glasses", "thin oval glasses", "thick tortoiseshell glasses", "a knitted beanie",
                "a flat cap", "a scarf around the neck", "a beaded necklace", "a bindi", "a colourful headwrap", "a hijab"]
YOUNG_HAIR_SKIP = {"a receding hairline", "bald on top with hair at the sides", "a man bun", "slicked-back hair", "a shaved head", "a mullet"}
CHILD_BUILD = {"heavyset": "sturdy", "muscular": "sporty", "soft and round": "round-cheeked"}
CHILD_HEIGHT = {"very tall": "tall for their age", "tall": "tall for their age", "average height": "average height for their age",
                "short": "small for their age", "very short": "small for their age"}


def allowed(e, pres, heritage, age):
    """Items with cultural or religious meaning go only where they are usual; no hijab on young children."""
    return not ((e == "a bindi" and not (pres == "woman" and heritage in ("South Asian", "mixed heritage")))
                or (e == "a hijab" and (pres != "woman" or age == CHILD)) or (e == "a turban" and pres != "man"))


def person(i: int, r: random.Random):
    heritage = list(HERITAGE)[i % len(HERITAGE)]  # even spread, and tones vary within each group
    skin = HERITAGE[heritage][(i // len(HERITAGE)) % len(HERITAGE[heritage])]
    age = AGE_SEQ[(i // 3) % len(AGE_SEQ)]
    young = age <= TEEN
    pres = ("woman", "man")[(i // 2) % 2] if r.random() > 0.06 else "person"
    build = BUILD[(i // 5) % len(BUILD)]
    height = HEIGHT[(i // 7) % len(HEIGHT)]
    if young:
        build, height = CHILD_BUILD.get(build, build), CHILD_HEIGHT[height]
    if age >= 5 or (age == 4 and r.random() < 0.5):
        hair_col = r.choice(OLD_HAIR)
    elif age == CHILD:
        hair_col = r.choice(HAIR_COL[:8])  # natural colours only
    else:
        hair_col = r.choice(HAIR_COL[:-1] if age == TEEN else HAIR_COL)
    styles = [h for h in HAIR if not (pres == "woman" and h in ("a receding hairline", "bald on top with hair at the sides", "a man bun"))
              and not (young and h in YOUNG_HAIR_SKIP)]
    # headwear hides the hair, one of the strongest memory cues, so it comes up for about 1 person in 7, as in real life
    pool = YOUNG_EXTRAS if young else EXTRAS
    bare = [e for e in pool if not any(w in e for w in HEADWEAR)]
    extras = r.sample(bare, r.choice([0, 1, 1, 2]))
    if sum("glasses" in e for e in extras) > 1:
        extras = extras[:1]  # at most one pair of glasses
    if r.random() < 0.14:
        extras.append(r.choice([e for e in pool if any(w in e for w in HEADWEAR)]))
    extras = [e for e in extras if allowed(e, pres, heritage, age)]
    cover = next((e for e in extras if any(w in e for w in ("hijab", "turban", "headwrap"))), None)  # these hide the hair, so no hairstyle
    dark = skin in ("deep brown", "dark brown", "very dark brown")
    marks = [m for m in MARKS if not (young and m in ADULT_ONLY_MARKS) and not (age == CHILD and m == "acne marks on the cheeks")]
    pierce = CHILD_PIERCE if age == CHILD else TEEN_PIERCE if age == TEEN else PIERCE
    p = {
        "id": f"p{i:03d}", "pres": pres, "age": age, "ageLabel": AGE_LABEL[age], "ageText": AGES[age], "heritage": heritage, "skin": skin,
        "build": build, "height": height,
        "face": r.choice(FACE), "eyes": r.choice(EYES), "eyeColor": r.choice(EYE_COL[:5] if dark and r.random() < 0.9 else EYE_COL),
        "brows": r.choice(BROWS), "nose": r.choice(NOSE), "mouth": r.choice(MOUTH),
        "hair": hair_words(hair_col, r.choice(styles)) if not cover else f"hair covered by {cover[2:]}", "hairColor": hair_col,
        "marks": r.sample(marks, r.choice([0, 1, 1, 2])),
        "asym": r.choice(ASYM) if r.random() < 0.35 else None,
        "piercings": r.sample(pierce, r.choice([0, 0, 1]) if young else r.choice([0, 0, 1, 1, 2])),
        "extras": extras,
        "beard": r.choice(BEARD) if pres == "man" and age >= 2 and r.random() < 0.5 else None,
        "clothes": clothes(r),
        "bg": r.choice(BG),
    }
    # look-alike stranger: a new eye shape and eye colour, always, plus one more feature. Clothes are not a cue in either
    # direction (owner, Nov 2 2026): the look-alike wears the same outfit only about half the time.
    k = r.choices(list(SECOND_W), list(SECOND_W.values()))[0]
    p["lookalike"] = {"eyes": r.choice([e for e in EYES if e != p["eyes"]]), "eyeColor": r.choice([c for c in EYE_COL if c != p["eyeColor"]]),
                      k: r.choice([x for x in SECOND[k] if x != p[k]])}
    if r.random() < 0.5:
        p["lookalike"]["clothes"] = clothes(r)
    # new look: hair (or headwear) changes, plus glasses, piercings or clothes; the face itself stays
    head = next((e for e in extras if any(w in e for w in HEADWEAR)), None)
    if head:
        other = [e for e in pool if any(w in e for w in HEADWEAR) and e != head and allowed(e, pres, heritage, age)]
        rs = {"hair": f"{r.choice(other)} instead of {head}"} if other else {"hair": f"no headwear instead of {head}"}
    else:
        rs = {"hair": r.choice([s for s in styles if s.split()[-1] not in p["hair"]])}
    roll = r.random()
    if roll < 0.35:
        rs["glasses"] = "no glasses" if any("glasses" in e for e in extras) else r.choice([e for e in EXTRAS if "glasses" in e])
    elif roll < 0.55 and p["piercings"]:
        rs["piercings"] = "no piercings"
    elif roll < 0.7:
        rs["piercings"] = r.choice(pierce)
    else:
        rs["clothes"] = clothes(r)
    p["restyle"] = rs
    return p


WEAR = ("glasses", "hat", "cap", "beanie", "turban", "hijab", "headwrap", "bandana", "necklace", "chain", "scarf", "hearing aid")


def describe(p):
    """Plain recipe text: the fallback when the local model's description misses a trait."""
    pron = {"woman": "her", "man": "his"}.get(p["pres"], "their")
    w = who(p)
    age = p["ageText"].replace("child", w).replace("teenager", w) if p["age"] <= TEEN else p["ageText"].replace("adult", w)
    bits = [f"{art(age)} of {p['heritage']} heritage".replace("their", pron), f"{p['height']} and {p['build']}",
            f"{p['skin']} skin", p["face"], f"{p['eyeColor']} {p['eyes']}", p["brows"], art(p["nose"]), p["mouth"], p["hair"]]
    if p.get("beard"):
        bits.append(p["beard"])
    bits += p["marks"] + ([p["asym"]] if p.get("asym") else []) + p["piercings"]
    bits += [f"wearing {e}" if any(w in e for w in WEAR) else e for e in p["extras"]]
    bits.append(f"wearing {p['clothes']}")
    return ", ".join(bits)


NAME = {"face": "face shape", "brows": "eyebrows", "mouth": "mouth", "nose": "nose"}


def edit_text(p, kind):
    if kind == "lookalike":
        la = p["lookalike"]
        other = next(k for k in la if k not in ("eyes", "eyeColor"))
        v = la[other]
        v = art(v) if other in ("nose", "face") or v.endswith(("mouth", "overbite")) else v
        return (f"Make this a different {who(p)} who looks similar: change the eyes to {la['eyeColor']} {la['eyes']}, "
                f"and change the {NAME[other]} to {v}.")
    rs = p["restyle"]
    parts = [f"now wearing {rs['hair']}" if "instead of" in rs["hair"] else f"now with {rs['hair']}, keeping exactly the same hair colour as now"]
    for k in ("glasses", "piercings", "clothes"):
        if k in rs:
            parts.append(rs[k] if rs[k].startswith("no ") else f"now wearing {rs[k]}")
    return f"The same {who(p)} with exactly the same face, eyes, skin and marks, {', '.join(parts)}."


def build(n=300, seed=2026):
    r = random.Random(seed)
    people = [person(i, r) for i in range(n)]
    for p in people:
        p["recipe"] = describe(p)
        p["prompt"] = p["recipe"]  # replaced by the local model's description in people_llm.py
        p["editLookalike"] = edit_text(p, "lookalike")
        p["editRestyle"] = edit_text(p, "restyle")
    return people


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 300
    people = build(n)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(people, indent=1), encoding="utf-8")
    from collections import Counter
    print(OUT, len(people))
    for f in ("heritage", "ageLabel", "pres", "build", "height"):
        print(f, dict(Counter(p[f] for p in people)))
    print("with marks", sum(bool(p["marks"]) for p in people), "asym", sum(bool(p["asym"]) for p in people), "piercings", sum(bool(p["piercings"]) for p in people),
          "extras", sum(bool(p["extras"]) for p in people))
    for p in people[:3]:
        print("-", p["recipe"], "|", p["editLookalike"], "|", p["editRestyle"])
