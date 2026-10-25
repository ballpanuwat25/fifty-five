"""Turns the generated class photos into the files the site serves.

The sources are Gemini pictures, upscaled 4x with Upscayl, kept out of git in design/photos-src (see
design/gemini-prompts.md for how they were made). For each class there is a wide 16:9 picture (the
carriage and wide screens) and a tall 9:16 one (phones). Gemini lit the room from the left; most of the
set is mirrored so the morning light falls from the right in every picture and the subject sits where
the carriage shows it. Foundations is shot from above and keeps its own orientation.

The four teacher portraits are generated the same way (design/photos-src/teacher-<name>.jpg) and are
served as they were made, only resized.

    python -I scripts/export-photos.py
"""

from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "design" / "photos-src"
OUT = ROOT / "public" / "photos"

# class slug -> (source name prefix, mirror)
CLASSES = {
    "flow": ("Reformer", True),
    "foundations": ("Foundations", False),
    "jumpboard": ("Jumpboard", True),
    "mat": ("Mat", True),
}
# served widths: a wide picture fills a 2x desktop screen, a tall one a 3x phone
WIDTH = {"wide": 2400, "tall": 1290}
TEACHERS = ["prae", "khao", "oat", "mint"]
# a portrait card is at most about 400 px wide, so twice that
TEACHER_WIDTH = 800


def source(prefix: str, kind: str) -> Path:
    tag = f"{prefix}-mobile_" if kind == "tall" else f"{prefix}_"
    found = sorted(SRC.glob(f"{tag}*.png"))
    if len(found) != 1:
        raise SystemExit(f"expected one {kind} picture for {prefix} in {SRC}, found {len(found)}")
    return found[0]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for slug, (prefix, mirror) in CLASSES.items():
        for kind, width in WIDTH.items():
            im = Image.open(source(prefix, kind)).convert("RGB")
            if mirror:
                im = ImageOps.mirror(im)
            im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
            path = OUT / f"{slug}-{kind}.webp"
            im.save(path, "WEBP", quality=80, method=6)
            print(f"{path.relative_to(ROOT)}  {im.size[0]}x{im.size[1]}  {path.stat().st_size // 1024} KB")
    for name in TEACHERS:
        im = Image.open(SRC / f"teacher-{name}.jpg").convert("RGB")
        im = im.resize((TEACHER_WIDTH, round(im.height * TEACHER_WIDTH / im.width)), Image.LANCZOS)
        path = OUT / f"teacher-{name}.webp"
        im.save(path, "WEBP", quality=80, method=6)
        print(f"{path.relative_to(ROOT)}  {im.size[0]}x{im.size[1]}  {path.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
