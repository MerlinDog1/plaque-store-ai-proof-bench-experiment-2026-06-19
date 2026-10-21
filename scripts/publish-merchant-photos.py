"""Publish reviewed catalogue photos (scripts/generate-merchant-photos.mjs) for the product pages.

python3 scripts/publish-merchant-photos.py            # every offer with a raw photo
python3 scripts/publish-merchant-photos.py --sheets   # contact sheets for review only

Writes public/site-images/merchant-photo/<slug>.webp (1200 px) and <slug>-600.webp, marked
with IPTC DigitalSourceType trainedAlgorithmicMedia (metadata only, no visible label).
"""
import json, os, re, subprocess, sys
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'output/merchant-photos/raw')
QA = os.path.join(ROOT, 'output/merchant-photos/qa')
OUT = os.path.join(ROOT, 'public/site-images/merchant-photo')
SHEETS = os.path.join(ROOT, 'output/merchant-photos/sheets')


def slugs():
    # <slug>.png is the chosen attempt; <slug>.a2.png etc. are kept for review.
    return sorted(f[:-4] for f in os.listdir(RAW) if f.endswith('.png') and not re.search(r'\.a\d+$', f[:-4]))


def sheets():
    os.makedirs(SHEETS, exist_ok=True)
    items = slugs()
    for n in range(0, len(items), 16):
        sheet = Image.new('RGB', (1600, 1660), 'white')
        draw = ImageDraw.Draw(sheet)
        for i, slug in enumerate(items[n:n + 16]):
            im = Image.open(os.path.join(RAW, slug + '.png')).convert('RGB').resize((392, 392), Image.LANCZOS)
            x, y = (i % 4) * 400, (i // 4) * 415
            sheet.paste(im, (x + 4, y + 4))
            qa = json.load(open(os.path.join(QA, slug + '.json'))) if os.path.exists(os.path.join(QA, slug + '.json')) else {}
            draw.text((x + 6, y + 398), ('' if qa.get('pass') else 'CHECK ') + slug[:58], fill='black' if qa.get('pass') else 'red')
        sheet.save(os.path.join(SHEETS, f'sheet-{n // 16 + 1:02d}.jpg'), quality=82)
    print('sheets', (len(items) + 15) // 16)


def publish():
    os.makedirs(OUT, exist_ok=True)
    written = []
    for slug in slugs():
        im = Image.open(os.path.join(RAW, slug + '.png')).convert('RGB')
        for size, name in ((1200, slug + '.webp'), (600, slug + '-600.webp')):
            path = os.path.join(OUT, name)
            im.resize((size, size), Image.LANCZOS).save(path, 'WEBP', quality=80, method=6)
            written.append(path)
    # 160 px thumbnails of the flat design renders for the product page gallery.
    renders = os.path.join(ROOT, 'public/site-images/merchant')
    os.makedirs(os.path.join(renders, 'thumbs'), exist_ok=True)
    for slug in slugs():
        Image.open(os.path.join(renders, slug + '.jpg')).convert('RGB').resize((160, 160), Image.LANCZOS) \
            .save(os.path.join(renders, 'thumbs', slug + '.webp'), 'WEBP', quality=80, method=6)
    for i in range(0, len(written), 100):
        subprocess.run(['exiftool', '-q', '-overwrite_original',
                        '-XMP-iptcExt:DigitalSourceType=http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia',
                        *written[i:i + 100]], check=True)
    total = sum(os.path.getsize(p) for p in written)
    print(f'published {len(written) // 2} photos, {total / 1048576:.1f} MiB')


if __name__ == '__main__':
    sheets() if '--sheets' in sys.argv else publish()
