#!/usr/bin/env python3
"""Build Euclid Consortium United Kingdom logo lockups from official artwork.

The small "consortium" lettering in the supplied logo is not treated as a
normal font here. Its distinctive letterforms are sampled directly from the
official blue logo. Following the existing Euclid Consortium Italia lockup,
the national tag is appended to "consortium" on the same baseline. Its U is
built around the original u bowl and its K uses the same stroke width,
ascender and pointed terminals.
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
LOGO_DIR = ROOT / "images" / "logos"
REFERENCE_SOURCE = LOGO_DIR / "EC_logos_official_Blue_with_text.png"
REFERENCE_SECONDARY = (159, 164, 210)
DESCRIPTOR = "UK"

VARIANTS = (
    {
        "source": REFERENCE_SOURCE,
        "output": LOGO_DIR / "euclid-consortium-united-kingdom-blue.png",
        "secondary": REFERENCE_SECONDARY,
    },
    {
        "source": LOGO_DIR / "EC_logos_official_white_with_text.png",
        "output": LOGO_DIR / "euclid-consortium-united-kingdom-white.png",
        "secondary": (165, 165, 164),
    },
    {
        "source": ROOT / "images" / "EC_logos_official_black_with_text.png",
        "output": LOGO_DIR / "euclid-consortium-united-kingdom-black.png",
        "secondary": (135, 135, 134),
    },
)

# Visible x extents of the letters in the official "consortium" word, measured
# from the left edge of that word's mask. Retaining the complete 205 px line
# canvas also retains its original baseline, x-height and ascender alignment.
SOURCE_GLYPH_X = {
    "c": (0, 115),
    "o": (146, 291),
    "n": (300, 447),
    "s": (474, 621),
    "r": (797, 950),
    "t": (951, 1094),
    "i": (1124, 1168),
    "u": (1197, 1345),
    "m": (1373, 1605),
}


def colour_mask(image: Image.Image, colour: tuple[int, int, int]) -> Image.Image:
    """Return alpha only where an RGBA image uses the requested solid RGB."""
    red, green, blue, alpha = image.split()
    solid = Image.new("L", image.size, 255)
    for channel, value in ((red, colour[0]), (green, colour[1]), (blue, colour[2])):
        equal = channel.point(lambda pixel, target=value: 255 if pixel == target else 0)
        solid = Image.composite(solid, Image.new("L", image.size), equal)
    return Image.composite(alpha, Image.new("L", image.size), solid)


def consortium_bbox(
    image: Image.Image, secondary: tuple[int, int, int]
) -> tuple[int, int, int, int]:
    """Locate the existing secondary-colour "consortium" line."""
    mask = colour_mask(image, secondary)
    search = Image.new("L", image.size)
    region = (image.width * 2 // 5, image.height * 2 // 3, image.width, image.height)
    search.paste(mask.crop(region), region[:2])
    bbox = search.getbbox()
    if bbox is None:
        raise RuntimeError("Could not locate the consortium line in the official artwork.")
    return bbox


def stroke_polygon(
    start: tuple[float, float], end: tuple[float, float], width: float
) -> list[tuple[int, int]]:
    """Return a square-ended polygon for one monoline diagonal stroke."""
    dx = end[0] - start[0]
    dy = end[1] - start[1]
    length = math.hypot(dx, dy)
    perpendicular_x = -dy * width / (2 * length)
    perpendicular_y = dx * width / (2 * length)
    return [
        (round(start[0] + perpendicular_x), round(start[1] + perpendicular_y)),
        (round(end[0] + perpendicular_x), round(end[1] + perpendicular_y)),
        (round(end[0] - perpendicular_x), round(end[1] - perpendicular_y)),
        (round(start[0] - perpendicular_x), round(start[1] - perpendicular_y)),
    ]


def source_glyphs() -> tuple[dict[str, Image.Image], int]:
    """Extract reusable glyph masks from the official consortium word."""
    reference = Image.open(REFERENCE_SOURCE).convert("RGBA")
    word_bbox = consortium_bbox(reference, REFERENCE_SECONDARY)
    word_mask = colour_mask(reference, REFERENCE_SECONDARY).crop(word_bbox)
    glyphs = {
        letter: word_mask.crop((left, 0, right, word_mask.height))
        for letter, (left, right) in SOURCE_GLYPH_X.items()
    }
    return glyphs, word_mask.height


def constructed_glyphs(
    glyphs: dict[str, Image.Image], line_height: int
) -> dict[str, Image.Image]:
    """Construct capital U and K from the official wordmark's geometry."""
    stroke = 23
    x_height_top = 64
    baseline = 198
    join_y = 130

    # U: extend the exact u bowl to the logo's full capital/ascender height.
    u_glyph = glyphs["u"].copy()
    u_draw = ImageDraw.Draw(u_glyph)
    u_draw.rectangle((2, 0, 24, 121), fill=255)
    u_draw.rectangle((123, 0, 145, 121), fill=255)

    # K: a consortium-style stem with two sharp monoline diagonals.
    k_glyph = Image.new("L", (148, line_height))
    k_draw = ImageDraw.Draw(k_glyph)
    k_draw.rectangle((0, 0, stroke - 1, baseline), fill=255)
    k_draw.polygon(
        stroke_polygon((18, join_y), (137, x_height_top), stroke - 2),
        fill=255,
    )
    k_draw.polygon(
        stroke_polygon((18, join_y), (144, line_height - 1), stroke - 2),
        fill=255,
    )

    return {**glyphs, "U": u_glyph, "K": k_glyph}


def descriptor_mask(target_word_height: int) -> Image.Image:
    """Assemble a country line from source-derived glyphs."""
    source, line_height = source_glyphs()
    glyphs = constructed_glyphs(source, line_height)
    scale = target_word_height / line_height
    tracking = round(target_word_height * 0.15)

    scaled: dict[str, Image.Image] = {}
    for letter, glyph in glyphs.items():
        scaled[letter] = glyph.resize(
            (
                max(1, round(glyph.width * scale)),
                max(1, round(glyph.height * scale)),
            ),
            Image.Resampling.LANCZOS,
        )

    tokens = [scaled[character] for character in DESCRIPTOR]
    width = sum(token.width for token in tokens)
    width += tracking * (len(tokens) - 1)
    height = max(token.height for token in tokens)
    canvas = Image.new("L", (width, height))

    x = 0
    for index, token in enumerate(tokens):
        canvas.paste(token, (x, 0))
        x += token.width
        if index < len(tokens) - 1:
            x += tracking

    bbox = canvas.getbbox()
    if bbox is None:
        raise RuntimeError("The source-derived descriptor mask is empty.")
    return canvas.crop(bbox)


def build_variant(
    source_path: Path,
    output_path: Path,
    secondary: tuple[int, int, int],
) -> Image.Image:
    source = Image.open(source_path).convert("RGBA")
    word_bbox = consortium_bbox(source, secondary)
    word_width = word_bbox[2] - word_bbox[0]
    word_height = word_bbox[3] - word_bbox[1]
    mask = descriptor_mask(word_height)

    # Euclid Consortium Italia establishes the national-lockup convention:
    # append the country identifier after "consortium" on the same baseline.
    descriptor_x = word_bbox[2] + round(word_height * 0.55)
    descriptor_y = word_bbox[1]
    source_art_bbox = source.getbbox()
    if source_art_bbox is None:
        raise RuntimeError(f"{source_path} contains no visible artwork.")
    right_margin = source.width - source_art_bbox[2]
    output_width = max(source.width, descriptor_x + mask.width + right_margin)

    output = Image.new("RGBA", (output_width, source.height))
    output.alpha_composite(source)
    descriptor_layer = Image.new("RGBA", mask.size, (*secondary, 0))
    descriptor_layer.putalpha(mask)
    output.alpha_composite(descriptor_layer, (descriptor_x, descriptor_y))
    output.save(output_path, optimize=True)
    return output


def cropped_with_padding(image: Image.Image, padding_ratio: float = 0.07) -> Image.Image:
    bbox = image.getbbox()
    if bbox is None:
        return image
    padding = round(max(bbox[2] - bbox[0], bbox[3] - bbox[1]) * padding_ratio)
    expanded = (
        max(0, bbox[0] - padding),
        max(0, bbox[1] - padding),
        min(image.width, bbox[2] + padding),
        min(image.height, bbox[3] + padding),
    )
    return image.crop(expanded)


def make_preview(blue: Image.Image, white: Image.Image) -> None:
    width = 1800
    panel_height = 900
    preview = Image.new("RGB", (width, panel_height * 2), (247, 247, 245))
    preview.paste(Image.new("RGB", (width, panel_height), (12, 17, 29)), (0, panel_height))

    for logo, panel_top in ((blue, 0), (white, panel_height)):
        cropped = cropped_with_padding(logo)
        cropped.thumbnail((1540, 740), Image.Resampling.LANCZOS)
        x = (width - cropped.width) // 2
        y = panel_top + (panel_height - cropped.height) // 2
        preview.paste(cropped, (x, y), cropped)

    preview.save(
        LOGO_DIR / "euclid-consortium-united-kingdom-preview.png",
        optimize=True,
    )


def main() -> None:
    built: dict[str, Image.Image] = {}
    for variant in VARIANTS:
        image = build_variant(
            variant["source"],
            variant["output"],
            variant["secondary"],
        )
        built[variant["output"].stem.rsplit("-", 1)[-1]] = image
        print(f"Created {variant['output'].relative_to(ROOT)}")
    make_preview(built["blue"], built["white"])
    print("Created images/logos/euclid-consortium-united-kingdom-preview.png")


if __name__ == "__main__":
    main()
