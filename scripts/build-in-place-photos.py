"""Publish the checked in-place photos (owner msg 8341, 31 Oct 2026) into the site and write services/inPlacePhotos.data.ts.

Reads the photo makers' manifests ({page: [{image, hero?, productSlug, title, alt, lines}]}, images 1800 x 1200 with a
900 x 600 "-900" copy, and for an occasion page's first photo a 4:3 "-hero-1600" crop). Copies the 900 px rows to
public/site-images/in-place/<page>/<name>-900.webp, makes 800/1200/1600 px lead crops, tags every published file with
IPTC DigitalSourceType trainedAlgorithmicMedia (metadata only, as the studio photos), and lists them in the data file.
Captions, prices and links are added at runtime from the catalogue (services/inPlacePhotos.ts).

python3 -I scripts/build-in-place-photos.py SOURCE_DIR MANIFEST.json [MANIFEST.json ...]
"""
import json
import os
import shutil
import subprocess
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public/site-images/in-place')
DATA = os.path.join(ROOT, 'services/inPlacePhotos.data.ts')
TAG = '-XMP-iptcExt:DigitalSourceType=http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia'
LEAD_PAGES = {'professional-brass-plaques', 'donor-recognition-plaques', 'church-plaques', 'house-name-plaques'}

source, manifests = sys.argv[1], sys.argv[2:]
if not manifests:
    sys.exit(__doc__)
pages = {}
for manifest in manifests:
    for page, photos in json.load(open(manifest)).items():
        pages.setdefault(page, []).extend(photos)

written, data, leads = [], {}, {}
for page, photos in sorted(pages.items()):
    os.makedirs(os.path.join(OUT, page), exist_ok=True)
    data[page] = []
    for index, photo in enumerate(photos):
        name = os.path.splitext(os.path.basename(photo['image']))[0]
        if name.endswith('-900'):
            name = name[:-4]
        src900 = os.path.join(source, page, f'{name}-900.webp')
        if not os.path.exists(src900):
            sys.exit(f'{page}: missing {src900}')
        with Image.open(src900) as im:
            if im.size != (900, 600):
                sys.exit(f'{src900}: {im.size}, expected 900 x 600')
        dest = os.path.join(OUT, page, f'{name}-900.webp')
        shutil.copyfile(src900, dest)
        written.append(dest)
        entry = {'file': name, 'productSlug': photo['productSlug'], 'title': photo['title'], 'alt': photo['alt'], 'lines': photo.get('lines', [])}
        data[page].append(entry)
        if page in LEAD_PAGES and index == 0:
            hero = photo.get('hero') or f'{name}-hero-1600.webp'
            hero_path = os.path.join(source, page, os.path.basename(hero))
            if not os.path.exists(hero_path):
                sys.exit(f'{page}: lead photo needs its 4:3 crop {hero_path}')
            with Image.open(hero_path) as im:
                im = im.convert('RGB')
                if abs(im.width / im.height - 4 / 3) > 0.01:
                    sys.exit(f'{hero_path}: not 4:3 ({im.size})')
                for width in (1600, 1200, 800):
                    path = os.path.join(OUT, page, f'{name}-hero-{width}.webp')
                    im.resize((width, width * 3 // 4), Image.LANCZOS).save(path, 'WEBP', quality=82, method=6)
                    written.append(path)
            leads[page] = entry

subprocess.run(['exiftool', '-q', '-overwrite_original', TAG, *written], check=True)
for path in written:
    if b'digitalsourcetype/trainedAlgorithmicMedia' not in open(path, 'rb').read():
        sys.exit(f'{path}: IPTC tag missing after exiftool')

with open(DATA, 'w') as f:
    f.write('// Written by scripts/build-in-place-photos.py from the checked photo manifests. Do not edit by hand.\n')
    f.write('export type PhotoEntry = { file: string; productSlug: string; title: string; alt: string; lines: string[] };\n\n')
    f.write(f'export const inPlaceData: Record<string, PhotoEntry[]> = {json.dumps(data, indent=2, ensure_ascii=False)};\n\n')
    f.write(f'export const leadData: Record<string, PhotoEntry> = {json.dumps(leads, indent=2, ensure_ascii=False)};\n')
print(f'{sum(len(v) for v in data.values())} photos on {len(data)} pages, {len(leads)} lead photos, {len(written)} files tagged')
