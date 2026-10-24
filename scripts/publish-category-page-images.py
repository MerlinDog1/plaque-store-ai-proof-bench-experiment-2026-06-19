"""Images for the category pages rebuilt on the memorial page's layout (owner msg 5927, 24 Oct 2026: "bring every
other page up to that standard. Sense check each Pic and redo if dumb. Remember to use mixture of materials,
borders, woods etc").

Writes:
- public/site-images/category/<page>-hero-{1600,1200,800}.webp (4:3): each page's top photo, showing the plaque its
  "from" price is for, made with the designer's built-in realistic preview from a designer stencil (caps and screws
  repainted in metal). The tree and brass heroes reuse earlier built-in photos.
- public/site-images/category/route-<name>.webp (600 x 450): extra "Where in the garden?" tiles.
- public/site-images/catalogue-photo/<slug>.webp (1200) and <slug>-600.webp: catalogue photos redrawn because they
  made no sense (tree, orchard and hedge plaques with no tree, orchard or hedge; a pet's "Here lies" on a house wall;
  a studio shot). Their pages link them with ?v=N (services/commerce.ts) so phones fetch the new copy.
Every file carries IPTC DigitalSourceType trainedAlgorithmicMedia (metadata only, no visible label: owner msg 5231).

- public/site-images/memorial/<name>.webp at the entry's "size" [w, h]: the memorial page's own tiles (600 x 450) and
  portrait cards (600 x 600), added when the memorial page's photos were redone as real-looking photos (owner msg 6056).

Usage: python3 -I scripts/publish-category-page-images.py SOURCES.json
SOURCES.json: {"heroes": {name: {file, crop_x?, crop_y?}}, "tiles": {...}, "catalogue": {slug: {...}},
               "memorial": {name: {file, size: [w, h], crop_x?, crop_y?}}}
"""
import json
import os
import subprocess
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATEGORY = os.path.join(ROOT, 'public/site-images/category')
CATALOGUE = os.path.join(ROOT, 'public/site-images/catalogue-photo')
MEMORIAL = os.path.join(ROOT, 'public/site-images/memorial')
AI = 'http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia'


def crop_to(im, ratio, cx=0.5, cy=0.5):
    """Largest crop of the given width/height ratio, centred on (cx, cy) where the frame allows."""
    w, h = im.size
    if w / h > ratio:
        cw, ch = round(h * ratio), h
    else:
        cw, ch = w, round(w / ratio)
    left = int(max(0, min(w - cw, cx * w - cw / 2)))
    top = int(max(0, min(h - ch, cy * h - ch / 2)))
    return im.crop((left, top, left + cw, top + ch))


def write(entry, ratio, outputs):
    im = Image.open(entry['file'])
    im.draft('RGB', (outputs[0][1] * 2, outputs[0][2] * 2))
    crop = crop_to(im.convert('RGB'), ratio, entry.get('crop_x', 0.5), entry.get('crop_y', 0.5))
    for path, width, height in outputs:
        crop.resize((width, height), Image.LANCZOS).save(path, 'WEBP', quality=80, method=6)
    return [path for path, _, _ in outputs]


def main():
    sources = json.load(open(sys.argv[1]))
    os.makedirs(CATEGORY, exist_ok=True)
    written = []
    for name, entry in sources.get('heroes', {}).items():
        written += write(entry, 4 / 3, [(os.path.join(CATEGORY, f'{name}-{w}.webp'), w, w * 3 // 4) for w in (1600, 1200, 800)])
    for name, entry in sources.get('tiles', {}).items():
        written += write(entry, 4 / 3, [(os.path.join(CATEGORY, f'{name}.webp'), 600, 450)])
    for slug, entry in sources.get('catalogue', {}).items():
        written += write(entry, 1, [(os.path.join(CATALOGUE, f'{slug}.webp'), 1200, 1200), (os.path.join(CATALOGUE, f'{slug}-600.webp'), 600, 600)])
    for name, entry in sources.get('memorial', {}).items():
        width, height = entry['size']
        written += write(entry, width / height, [(os.path.join(MEMORIAL, f'{name}.webp'), width, height)])
    subprocess.run(['exiftool', '-q', '-overwrite_original', f'-XMP-iptcExt:DigitalSourceType={AI}', *written], check=True)
    for path in written:
        print(os.path.relpath(path, ROOT), Image.open(path).size, os.path.getsize(path) // 1024, 'KB')


if __name__ == '__main__':
    main()
