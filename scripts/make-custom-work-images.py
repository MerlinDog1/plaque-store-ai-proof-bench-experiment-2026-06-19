#!/usr/bin/env python3
"""Square crops for the "Tell us what you want" pictures on catalogue pages (owner msg 8088, 31 Oct 2026).

Run from the repository root: python3 scripts/make-custom-work-images.py
Reads existing site photos only (nothing generated); writes public/site-images/custom-work/*.webp.
Millie's card puts her owner's photo beside her finished plaque, both real photographs.
"""
from pathlib import Path
from PIL import Image, ImageDraw

SITE = Path('public/site-images')
OUT = SITE / 'custom-work'

# name: (source, crop box (left, top, right, bottom), output size)
CROPS = {
    'willow-horse': ('portraits/pim-willow-aged-brass-1024.webp', (118, 0, 886, 768), 640),
    'ruby-folded-steel': ('portraits/pim-ruby-folded-steel-1024.webp', (159, 0, 927, 768), 640),
    'ivy-sid-boulder': ('category/route-garden-stone-v4.webp', (9, 0, 459, 450), 450),
    'alice-grave-cross': ('memorial/route-grave-cross-v2.webp', (54, 0, 504, 450), 450),
    'meadows-opening': ('category/opening-hero-v3-1200.webp', (138, 0, 1038, 900), 640),
}


def save(image, name):
    path = OUT / f'{name}.webp'
    image.save(path, 'WEBP', quality=80, method=6)
    print(path, image.size, path.stat().st_size // 1024, 'KB')


def millie():
    # Photo and plaque side by side, each cropped to 1:2, with an arrow between them.
    photo = Image.open(SITE / 'portraits/pim-millie-photo.webp').convert('RGB').crop((100, 0, 500, 800)).resize((318, 640), Image.LANCZOS)
    plaque = Image.open(SITE / 'portraits/pim-millie-plaque.webp').convert('RGB').crop((40, 0, 680, 1280)).resize((318, 640), Image.LANCZOS)
    card = Image.new('RGB', (640, 640), (247, 244, 236))
    card.paste(photo, (0, 0))
    card.paste(plaque, (322, 0))
    draw = ImageDraw.Draw(card)
    cx, cy, r = 320, 320, 30
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(255, 255, 255), outline=(32, 56, 46), width=2)
    draw.line((cx - 13, cy, cx + 11, cy), fill=(32, 56, 46), width=5)
    draw.polygon([(cx + 15, cy), (cx + 3, cy - 10), (cx + 3, cy + 10)], fill=(32, 56, 46))
    save(card, 'millie-photo-to-plaque')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    millie()
    for name, (source, box, size) in CROPS.items():
        image = Image.open(SITE / source).convert('RGB').crop(box)
        if image.size != (size, size):
            image = image.resize((size, size), Image.LANCZOS)
        save(image, name)


if __name__ == '__main__':
    main()
