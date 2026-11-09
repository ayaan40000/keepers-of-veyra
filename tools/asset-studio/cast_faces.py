"""Painted face portraits for the story cast and the six Keeper avatars (owner, Nov 8, 2026: "work on the face for Wren and the others
that come up on the UI, generate them and use them per your liking").
Replaces the code-drawn faces in the dialogue boxes when a painted picture ships (src/pixel/Faces.jsx -> src/data/castFaces.js).

python cast_faces.py neutral            paint every neutral face, 2 seeds for the named cast, 1 for the avatars  -> out/cast/<id>_neutral_s<N>.png
python cast_faces.py sheet              contact sheets of the neutral faces (out/cast/sheet_neutral_*.png)
python cast_faces.py moods              paint the other moods as EDITS of the chosen neutral (same person), picks in out/cast/pick.json
python cast_faces.py ship               192 px webp into src/assets/art/cast/ and write src/data/castFaces.js
Colour: no violet in any prompt (docs/ART.md, "Colour cast"); motion.run_wf also runs colorfix on every picture.
"""
import json, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
sys.path.insert(0, str(HERE))
import motion as M  # noqa: E402
from PIL import Image  # noqa: E402

OUT = HERE / "out" / "cast"
SHIP = ROOT / "src" / "assets" / "art" / "cast"

FRAME = ("Fine detailed pixel art head-and-shoulders portrait of a character from an original fantasy story, face centred and looking slightly "
         "toward the viewer, shoulders and clothes visible, a plain softly lit muted {bg} background, warm lamplight from one side, "
         "expressive realistic face with individual features, natural skin tones, neutral natural colour balance, no purple or violet cast, "
         "clean dark outlines, soft many-step shading, high detail. ")
# id -> (background colour words, description of the person). Mood is added separately.
CAST = {
    "wren": ("warm brown", "Wren, a tall quick-witted 27 year old junior archivist, light skin, a heart-shaped face, hazel upturned eyes, a snub nose, a small mole beside one eye, "
             "dark brown hair cut short with a side parting, ink smudges on her cheek, a long brown coat with a high turned-up collar over a cream shirt, a small notecard tucked in the breast pocket, a hint of a smirk."),
    "sevrin": ("slate blue-grey", "Sevrin Ashgrave, a tall soft-spoken man of about 50, a long gentle face, grey downturned kind eyes, salt-and-pepper hair and beard with silver in it, "
               "wearing a plain pale-grey hood and a grey robe, a calm sorrowful look."),
    "hask": ("dusty olive-brown", "Joss Hask, a huge broad road-warden of about 40, brown skin, square jaw, deep-set grey eyes, bushy dark brows with a scar through one brow, roman nose, "
             "short buzz-cut dark hair, stubble, a worn leather jerkin, a watchful quiet look."),
    "isolde": ("dark green-teal", "Isolde Varre, a sharp-witted harbour mistress of about 38, deep brown skin, dark upturned eyes, long lashes, arched brows, full dark-red lips, "
               "black hair in a neat bun, a gold drop earring, a dark teal velvet high-collared coat with gold trim, a poised confident look."),
    "tansy": ("dusty rose-brown", "Old Tansy, a small sharp elderly herbalist of about 80, pale wrinkled skin, white hair in a bun, hooded grey eyes, a long nose, thin lips, a mole on her right cheek, "
              "a knitted shawl, a sprig of rosemary at her collar, a shrewd kind look."),
    "calder": ("cold blue-grey", "Elsabet Calder, a precise unbending archivist of about 60, pale skin, a heart-shaped face, hooded grey eyes, a long nose, thin lips, a mole on her right cheek, "
               "salt-and-pepper hair pinned back with one grey streak, a high-collared dark archivist robe with a brass key on a chain."),
    "ennick": ("soft blue-grey", "Brother Ennick, a young earnest acolyte of about 20, pale freckled skin, big blue eyes, short red hair, large ears, a small mouth, a plain grey acolyte robe, an anxious gentle look."),
    "mosk": ("deep sea-green", "Mosk, a grumpy old ferryman of about 70, weathered dark brown skin, hooded brown eyes, bushy white brows, a broad nose, large ears, white stubble, "
             "a dark flat cap and an oilskin coat, a gruff look."),
    "fennick": ("warm tan", "Fennick, an old caretaker of about 75, pale skin, white hair only around the sides of his head, wire-rimmed glasses, blue eyes, a long nose, bushy white brows, "
                "a patterned waistcoat over a shirt, a mild thoughtful look."),
}
KEEP = "a traveller's cloak with a small brass lamp pin at the collar, an open friendly face"
AVATARS = {
    "you-lantern": ("warm brown", "a man of about 30, deep brown skin, an oval face, dark brown almond eyes, thick straight brows, a wide nose, curly black hair, light stubble, wearing a slate-blue " + KEEP),
    "you-key": ("soft blue-grey", "a young woman of about 25, fair freckled skin, a heart-shaped face, round green eyes, auburn hair in a ponytail, wearing a moss-green " + KEEP),
    "you-compass": ("dusty olive", "a man of about 35, tan skin, a square face, hazel hooded eyes, angled dark brows, black side-parted hair, stubble, a small mole on the left cheek, wearing a brown " + KEEP),
    "you-quill": ("warm tan", "a woman of about 30, deep brown skin, an oval face, large dark brown eyes, long lashes, a broad nose, long black locs, a gold hoop earring, wearing a muted wine-red " + KEEP),
    "you-tower": ("slate blue-grey", "a person of about 28, light olive skin, a round face, dark monolid eyes, a black chin-length bob, a calm smile, wearing a grey-blue " + KEEP),
    "you-wave": ("sea green-grey", "a man of about 32, brown skin, a long face, amber eyes, soft brows, a long nose, light brown wavy hair, wearing a deep teal " + KEEP),
}
MOODS = {
    "neutral": "",
    "smile": "a warm, genuine smile",
    "worried": "a worried, anxious look with the inner brows raised and a tense mouth",
    "stern": "a stern, serious look with a firm straight mouth and lowered brows",
    "sly": "a sly, knowing half-smile with one eyebrow slightly raised",
}
MOODS_OF = {"wren": ["smile", "worried"], "sevrin": ["smile", "stern"], "hask": ["stern", "smile"], "isolde": ["sly", "stern"], "tansy": ["smile", "stern"],
            "calder": ["stern", "smile"], "ennick": ["worried", "smile"], "mosk": ["smile"], "fennick": ["smile"]}
for _a in AVATARS:
    MOODS_OF[_a] = ["smile", "worried"]
ALL = {**CAST, **AVATARS}
NEG = M.NEG_FINE + ", multiple people, hands covering face, text, frame, border, full body, cropped head"
MP = 0.5


def finish():
    try:
        M.studio.comfy("/free", {"unload_models": True, "free_memory": True})
    except Exception:  # noqa: BLE001
        pass
    if M.studio.STARTED:
        M.studio.STARTED.terminate()


def picks():
    p = OUT / "pick.json"
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}


def start():
    OUT.mkdir(parents=True, exist_ok=True)
    M.studio.free_llm()
    if not M.studio.start_comfy():
        print("ComfyUI did not start"); sys.exit(1)


def neutral():
    start()
    try:
        for n, (cid, (bg, desc)) in enumerate(ALL.items()):
            for s in range(2 if cid in CAST else 1):
                dest = OUT / f"{cid}_neutral_s{s}.png"
                if dest.exists():
                    continue
                prompt = FRAME.format(bg=bg) + desc + " " + M.LOOK_FINE
                M.run_wf(M.txt_wf(prompt, NEG, 310000 + n * 17 + s, "1:1 (Square)", MP), dest, f"face {cid} neutral s{s}")
    finally:
        finish()


def moods():
    start()
    pk = picks()
    try:
        for cid, ms in MOODS_OF.items():
            src = OUT / f"{cid}_neutral_s{pk.get(cid, 0)}.png"
            if not src.exists():
                continue
            ref = M.upload(Image.open(src).convert("RGB"), f"mnemos_cast_{cid}.png")
            for m in ms:
                dest = OUT / f"{cid}_{m}.png"
                if dest.exists():
                    continue
                p = (f"The same person, the same face and features, the same hair, clothes, background, framing and lighting, now with {MOODS[m]}. "
                     f"Only the expression changes. Fine detailed pixel art portrait, no purple or violet cast. {M.LOOK_FINE}")
                M.run_wf(M.edit_wf(p, ref, 320000 + sum(map(ord, cid + m)), "1:1 (Square)", MP, 1.0), dest, f"face {cid} {m}")
    finally:
        finish()


def sheet():
    from PIL import ImageDraw
    ids = list(ALL)
    for part, chunk in enumerate((ids[:9], ids[9:])):
        tw = 320
        s = Image.new("RGB", (tw * 6, (tw + 18) * ((len(chunk) * 2 + 5) // 6)), (14, 14, 20))
        d = ImageDraw.Draw(s)
        k = 0
        for cid in chunk:
            for sd in range(2):
                p = OUT / f"{cid}_neutral_s{sd}.png"
                if not p.exists():
                    continue
                x, y = (k % 6) * tw, (k // 6) * (tw + 18)
                s.paste(Image.open(p).convert("RGB").resize((tw, tw)), (x, y + 18)); d.text((x + 6, y + 4), f"{cid} s{sd}", fill=(240, 220, 160)); k += 1
        s.save(OUT / f"sheet_neutral_{part}.png")
    print("sheets in", OUT)


def ship():
    SHIP.mkdir(parents=True, exist_ok=True)
    pk = picks()
    entries = {}
    for cid in ALL:
        for m in ["neutral"] + MOODS_OF.get(cid, []):
            src = OUT / (f"{cid}_neutral_s{pk.get(cid, 0)}.png" if m == "neutral" else f"{cid}_{m}.png")
            if not src.exists():
                continue
            im = Image.open(src).convert("RGB").resize((192, 192), Image.LANCZOS)
            im.save(SHIP / f"{cid}_{m}.webp", quality=88, method=6)
            entries[f"{cid}|{m}"] = f"{cid}_{m}.webp"
    js = ("// Generated by tools/asset-studio/cast_faces.py. Do not edit by hand (re-run the script).\n"
          "// Painted face portraits (Qwen-Image 2.1, fine pixel style, colour-cast corrected) for the story cast and the six Keeper avatars.\n"
          "// Faces.jsx uses these when present and falls back to the code-drawn face otherwise.\n"
          "const files = import.meta.glob('../assets/art/cast/*.webp', { eager: true, import: 'default' });\n"
          "const byName = {};\nfor (const [p, url] of Object.entries(files)) byName[p.split('/').pop()] = url;\n"
          f"export const CAST_FACES = {json.dumps(entries, indent=1)};\n"
          "export function castFaceUrl(id, mood = 'neutral') {\n"
          "  const f = CAST_FACES[`${id}|${mood}`] || CAST_FACES[`${id}|neutral`];\n  return f ? byName[f] || null : null;\n}\n")
    (ROOT / "src" / "data" / "castFaces.js").write_text(js, encoding="utf-8")
    tot = sum(p.stat().st_size for p in SHIP.glob("*.webp"))
    print("shipped", len(entries), "faces,", tot // 1024, "KB")


if __name__ == "__main__":
    {"neutral": neutral, "sheet": sheet, "moods": moods, "ship": ship}[sys.argv[1]]()
