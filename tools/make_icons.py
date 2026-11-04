"""Generate Afterimage's PWA and touch icons (Pillow is a dev-only dependency)."""

from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFilter
except ModuleNotFoundError as exc:
    import sys

    print("Why: Pillow (dev-only) is not installed.", file=sys.stderr)
    print("Fix: pip install Pillow>=9.1", file=sys.stderr)
    raise SystemExit(2) from exc

SIZE = 1024
OUT = Path(__file__).resolve().parent.parent / "icons"

BG_TOP = (20, 16, 42)
BG_BOTTOM = (8, 11, 18)
VIOLET = (106, 91, 226)
TEAL = (79, 209, 197)


def background():
    image = Image.new("RGB", (SIZE, SIZE), BG_BOTTOM)
    draw = ImageDraw.Draw(image)
    for y in range(SIZE):
        t = y / (SIZE - 1)
        color = tuple(round(BG_TOP[i] * (1 - t) + BG_BOTTOM[i] * t) for i in range(3))
        draw.line([(0, y), (SIZE, y)], fill=color)
    return image.convert("RGBA")


def draw_icon(total, tile, gap):
    image = background()
    start = (SIZE - total) // 2
    radius = round(tile * 0.26)

    glow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    pen = ImageDraw.Draw(glow)
    pen.rounded_rectangle(
        [start - 24, start - 24, start + total + 23, start + total + 23],
        radius=80,
        fill=(*VIOLET, 70),
    )
    glow = glow.filter(ImageFilter.GaussianBlur(80))
    image = Image.alpha_composite(image, glow)

    pen = ImageDraw.Draw(image)
    for row in range(3):
        for col in range(3):
            x = start + col * (tile + gap)
            y = start + row * (tile + gap)
            fill = TEAL if (row, col) == (2, 2) else VIOLET
            # Pillow boxes are inclusive: x1 is the last drawn pixel.
            pen.rounded_rectangle([x, y, x + tile - 1, y + tile - 1], radius=radius, fill=fill)
    return image


def main():
    OUT.mkdir(exist_ok=True)
    regular = draw_icon(740, 220, 40)
    maskable = draw_icon(560, 168, 28)

    regular.resize((512, 512), Image.Resampling.LANCZOS).save(OUT / "icon-512.png")
    regular.resize((192, 192), Image.Resampling.LANCZOS).save(OUT / "icon-192.png")
    regular.resize((180, 180), Image.Resampling.LANCZOS).save(OUT / "apple-touch-icon.png")
    maskable.resize((512, 512), Image.Resampling.LANCZOS).save(OUT / "icon-maskable-512.png")


if __name__ == "__main__":
    main()
