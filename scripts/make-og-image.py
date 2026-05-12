"""Generate the 1200x630 Open-Graph image for Expliq.

Mirrors the live site palette (light theme, teal accent #0d9488).
Run once after editing — output is committed at public/og-image.png
and referenced from src/app/layout.tsx.
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


W, H = 1200, 630
# Palette pulled 1:1 from src/app/globals.css :root tokens.
BG = (245, 245, 247)  # --background  #f5f5f7
FG = (17, 24, 39)  # --foreground  #111827
ACCENT = (13, 148, 136)  # --primary  #0d9488 (teal)
TEXT_SECONDARY = (107, 114, 128)  # --text-secondary  #6b7280
TEXT_TERTIARY = (156, 163, 175)  # --text-tertiary  #9ca3af


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def mono_font(size: int) -> ImageFont.FreeTypeFont:
    for path in [
        "C:/Windows/Fonts/consola.ttf",
        "C:/Windows/Fonts/cour.ttf",
    ]:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def main() -> None:
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)

    pad = 80

    eyebrow = "LIVE MVP"
    title = "Expliq"
    subline = "Automation Intelligence"
    desc = "See what's working, what's broken, and what to build next."
    by = "by Per Paulsen"
    site = "expliq-mvp.vercel.app"

    f_eyebrow = load_font(26, bold=True)
    f_title = load_font(168, bold=True)
    f_sub = load_font(64, bold=True)
    f_desc = load_font(32, bold=False)
    f_footer = load_font(24, bold=False)
    f_mono = mono_font(24)

    y = pad
    spaced = "   ".join(list(eyebrow))
    draw.text((pad, y), spaced, font=f_eyebrow, fill=ACCENT)
    y += 65

    draw.text((pad, y), title, font=f_title, fill=FG)
    y += 195

    draw.text((pad, y), subline, font=f_sub, fill=ACCENT)
    y += 88

    draw.text((pad, y), desc, font=f_desc, fill=TEXT_SECONDARY)

    fy = H - pad - 24
    draw.text((pad, fy), by, font=f_footer, fill=TEXT_TERTIARY)
    site_w = draw.textlength(site, font=f_mono)
    draw.text((W - pad - site_w, fy), site, font=f_mono, fill=TEXT_TERTIARY)

    out = Path(__file__).resolve().parent.parent / "public" / "og-image-v2.png"
    img.save(out, "PNG", optimize=True)
    print(f"Wrote {out} ({out.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
