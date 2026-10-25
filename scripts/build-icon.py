"""Draws the site's icon: "55" in Zodiak, the hero's display face, in the page's cream on its olive ink.

The browser icon is an SVG with the two figures as paths taken from the font file, so it needs no font to
show; the Apple touch icon is the same drawing as a PNG. Writes src/app/icon.svg and src/app/apple-icon.png.

    python -I scripts/build-icon.py   (needs fontTools, brotli and Pillow)
"""

import io
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONT = ROOT / "src" / "fonts" / "zodiak-400.woff2"
INK, PAPER = "#2a3020", "#eee6d6"
SIZE = 32
# the two figures fill this share of the square's width, and sit this close, as the hero sets the name
FILL, TRACK = 0.74, -0.045

font = TTFont(FONT)
glyphs = font.getGlyphSet()
five = font.getBestCmap()[ord("5")]
advance = font["hmtx"][five][0]
upm = font["head"].unitsPerEm

# the outline of "55" in font units, y up, the second figure one advance (less the tracking) along
step = advance + TRACK * upm
bounds = BoundsPen(glyphs)
for i in range(2):
    glyphs[five].draw(TransformPen(bounds, (1, 0, 0, 1, i * step, 0)))
x0, y0, x1, y1 = bounds.bounds
scale = SIZE * FILL / (x1 - x0)
# centred on the square, by its ink rather than its advance; y flips to the SVG's downward axis
dx = SIZE / 2 - (x0 + x1) / 2 * scale
dy = SIZE / 2 + (y0 + y1) / 2 * scale

pen = SVGPathPen(glyphs, ntos=lambda n: f"{n:.2f}".rstrip("0").rstrip("."))
for i in range(2):
    glyphs[five].draw(TransformPen(pen, (scale, 0, 0, -scale, dx + i * step * scale, dy)))
svg = (
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}">\n'
    f'  <rect width="{SIZE}" height="{SIZE}" rx="7" fill="{INK}"/>\n'
    f'  <path d="{pen.getCommands()}" fill="{PAPER}"/>\n'
    "</svg>\n"
)
(ROOT / "src" / "app" / "icon.svg").write_text(svg, encoding="utf-8")

# the touch icon: iOS rounds the corners itself, so the square is full; drawn large and scaled down
BIG, OUT = 720, 180
ttf = io.BytesIO()
font.flavor = None
font.save(ttf)
ttf.seek(0)
size = round(upm * scale * BIG / SIZE)
face = ImageFont.truetype(ttf, size)
im = Image.new("RGB", (BIG, BIG), INK)
draw = ImageDraw.Draw(im)
k = BIG / SIZE
ox, oy = dx * k, dy * k - face.getmetrics()[0]
for i in range(2):
    draw.text((ox + i * step * scale * k, oy), "5", font=face, fill=PAPER)
im.resize((OUT, OUT), Image.LANCZOS).save(ROOT / "src" / "app" / "apple-icon.png", optimize=True)
print("icon.svg", len(svg), "bytes; apple-icon.png", OUT, "px")
