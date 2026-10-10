"""Draws the Freq app icon (wordmark + signal dot) at every size the app and the home-screen web app need.
Run: python3 scripts/generate-icons.py"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONT = ROOT / 'node_modules/@expo-google-fonts/archivo/800ExtraBold/Archivo_800ExtraBold.ttf'
BG, INK, SIGNAL = (14, 13, 11), (237, 230, 214), (255, 90, 31)


def icon(size: int, pad: float = 0.0, round_corners: bool = False) -> Image.Image:
    s = 1024
    img = Image.new('RGBA', (s, s), BG + (255,))
    d = ImageDraw.Draw(img)
    inner = s * (1 - 2 * pad)
    font = ImageFont.truetype(str(FONT), int(inner * 0.36))
    text = 'freq'
    l, t, r, b = d.textbbox((0, 0), text, font=font)
    w, h = r - l, b - t
    dot = inner * 0.06
    x = (s - w - dot * 1.2) / 2 - l
    y = (s - h) / 2 - t - inner * 0.02
    d.text((x, y), text, font=font, fill=INK)
    # Signal dot at the top right of the wordmark, like the LED in the app's header.
    dx, dy = x + r + dot * 0.3, y + t + inner * 0.02
    d.ellipse([dx, dy, dx + dot, dy + dot], fill=SIGNAL)
    if round_corners:
        mask = Image.new('L', (s, s), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, s, s], radius=int(s * 0.22), fill=255)
        img.putalpha(mask)
    return img.resize((size, size), Image.LANCZOS)


icon(1024).convert('RGB').save(ROOT / 'assets/icon.png')
icon(1024).convert('RGB').save(ROOT / 'assets/splash-icon.png')
icon(192).convert('RGB').save(ROOT / 'public/icon-192.png')
icon(512).convert('RGB').save(ROOT / 'public/icon-512.png')
icon(512, pad=0.12).convert('RGB').save(ROOT / 'public/icon-maskable-512.png')
icon(180).convert('RGB').save(ROOT / 'public/apple-touch-icon.png')
# Browser-tab favicon: a plain red circle.
fav = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
ImageDraw.Draw(fav).ellipse([16, 16, 496, 496], fill=(229, 32, 32, 255))
fav.resize((48, 48), Image.LANCZOS).save(ROOT / 'assets/favicon.png')
print('icons written')
