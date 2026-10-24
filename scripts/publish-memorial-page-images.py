"""Images for the rebuilt memorial plaques page (owner msg 5876, 24 Oct 2026: "make memorial page amazing").

Writes public/site-images/memorial/:
- memorial-hero-garden-wall-{1600,1200,800}.webp: the hero, made with the designer's built-in realistic preview from
  the catalogue stencil of polished-brass-297x210-rect-plaque (Charlotte May Pemberton), caps repainted in metal.
- route-{bench,garden,tree,wall}.webp (600 x 450): the "Where will it go?" tiles. Bench, garden and tree are crops
  of photos already on the site; the wall photo is the built-in preview of brushed-brass-210x148-rect-plaque.
- portrait-{george,joan,bramble,ron-pat}.webp (600 x 600): tree plaques with portraits made by Portraits in Metal's
  own process (owner msg 5816), photographed with the built-in preview, borders outside the caps (msg 5830).
Every file carries IPTC DigitalSourceType trainedAlgorithmicMedia (metadata only; owner msg 5231).

Usage: python3 -I scripts/publish-memorial-page-images.py SOURCES.json
SOURCES.json maps output name -> {"file": absolute path, "crop_x": 0..1 (optional), "crop_y": 0..1 (optional)}.
"""
import json
import os
import subprocess
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public/site-images/memorial')
AI = 'http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia'
SIZES = {
    'memorial-hero-garden-wall': [(1600, 1200), (1200, 900), (800, 600)],
    'route-bench': [(600, 450)], 'route-garden': [(600, 450)], 'route-tree': [(600, 450)], 'route-wall': [(600, 450)],
    'portrait-george': [(600, 600)], 'portrait-joan': [(600, 600)], 'portrait-bramble': [(600, 600)], 'portrait-ron-pat': [(600, 600)],
}


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


def main():
    sources = json.load(open(sys.argv[1]))
    os.makedirs(OUT, exist_ok=True)
    written = []
    for name, sizes in SIZES.items():
        entry = sources[name]
        im = Image.open(entry['file'])
        im.draft('RGB', (sizes[0][0] * 2, sizes[0][1] * 2))
        im = im.convert('RGB')
        crop = crop_to(im, sizes[0][0] / sizes[0][1], entry.get('crop_x', 0.5), entry.get('crop_y', 0.5))
        for width, height in sizes:
            suffix = f'-{width}' if len(sizes) > 1 else ''
            path = os.path.join(OUT, f'{name}{suffix}.webp')
            crop.resize((width, height), Image.LANCZOS).save(path, 'WEBP', quality=80, method=6)
            written.append(path)
    subprocess.run(['exiftool', '-q', '-overwrite_original', f'-XMP-iptcExt:DigitalSourceType={AI}', *written], check=True)
    for path in written:
        print(os.path.relpath(path, ROOT), Image.open(path).size, os.path.getsize(path) // 1024, 'KB')


if __name__ == '__main__':
    main()
