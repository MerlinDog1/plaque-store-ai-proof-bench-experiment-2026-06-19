#!/usr/bin/env python3
"""Finish swatches and finish-row pictures for the category template (1 Nov 2026).

Crops the existing close-up photographs of each finish (public/materials/thumbs/*.webp, the same pictures the
materials page and the product pages' "The finish, close up" use) into:
  public/site-images/finish/swatch-<finish>.webp  96 x 96, the round swatches on the category cards
  public/site-images/finish/<finish>-480.webp     480 x 270, the "finishes, side by side" row
No new imagery is generated: every pixel comes from those photographs. Rerun after replacing a close-up.

Usage: python3 scripts/make-finish-swatches.py
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'public' / 'materials' / 'thumbs'
OUT = ROOT / 'public' / 'site-images' / 'finish'
FINISHES = ['polished-brass', 'brushed-brass', 'orbital-brass', 'aged-brass', 'polished-stainless', 'brushed-stainless',
            'light-wood', 'dark-wood']


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name in FINISHES:
        image = Image.open(SOURCE / f'{name}.webp').convert('RGB')
        width, height = image.size
        side = min(width, height) * 3 // 4
        left, top = (width - side) // 2, (height - side) // 2
        image.crop((left, top, left + side, top + side)).resize((96, 96), Image.LANCZOS) \
            .save(OUT / f'swatch-{name}.webp', 'WEBP', quality=82, method=6)
        image.resize((480, 480 * height // width), Image.LANCZOS) \
            .save(OUT / f'{name}-480.webp', 'WEBP', quality=78, method=6)
        print(name, (OUT / f'swatch-{name}.webp').stat().st_size, (OUT / f'{name}-480.webp').stat().st_size)


if __name__ == '__main__':
    main()
