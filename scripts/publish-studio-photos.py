"""Publish checked studio photos (services/studioPhotos.mjs) for the product pages.

python3 -I scripts/publish-studio-photos.py DATE FILE [FILE ...]

Each FILE is a finished square studio shot named <slug>.studio.jpg (output/studio-shots-20261029/final-*/). Writes
public/site-images/studio-photo/<slug>.webp (1200 px), <slug>-600.webp and thumbs/<slug>.webp (160 px), marks them
with IPTC DigitalSourceType trainedAlgorithmicMedia (metadata only, no visible label; Google requires it for AI images
in Merchant Center), and adds each slug to services/studioPhotos.mjs with DATE (YYYY-MM-DD) unless it is already listed.
Re-publishing a listed slug replaces its files but keeps its date; bump the date by hand if the page should be recrawled.
"""
import json
import os
import re
import subprocess
import sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public/site-images/studio-photo')
LIST = os.path.join(ROOT, 'services/studioPhotos.mjs')
TAG = '-XMP-iptcExt:DigitalSourceType=http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia'

date, files = sys.argv[1], sys.argv[2:]
if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', date) or not files:
    sys.exit(__doc__)
slugs_known = set(json.loads(subprocess.run(
    ['node', '--input-type=module', '-e', "import { merchantOffers } from './services/merchantCatalogue.mjs'; console.log(JSON.stringify(merchantOffers.map(o => o.slug)))"],
    cwd=ROOT, capture_output=True, text=True, check=True).stdout))

os.makedirs(os.path.join(OUT, 'thumbs'), exist_ok=True)
written, slugs = [], []
for src in files:
    name = os.path.basename(src)
    if not name.endswith('.studio.jpg'):
        sys.exit(f'{src}: expected <slug>.studio.jpg')
    slug = name[:-len('.studio.jpg')]
    if slug not in slugs_known:
        sys.exit(f'{slug}: not a catalogue product')
    im = Image.open(src).convert('RGB')
    if im.size[0] != im.size[1] or im.size[0] < 1200:
        sys.exit(f'{src}: expected a square of at least 1200 px, got {im.size}')
    for size, path in ((1200, os.path.join(OUT, slug + '.webp')), (600, os.path.join(OUT, slug + '-600.webp')),
                       (160, os.path.join(OUT, 'thumbs', slug + '.webp'))):
        im.resize((size, size), Image.LANCZOS).save(path, 'WEBP', quality=84 if size > 160 else 80, method=6)
        written.append(path)
    slugs.append(slug)
subprocess.run(['exiftool', '-q', '-overwrite_original', TAG, *written], check=True)
for path in written:
    if b'digitalsourcetype/trainedAlgorithmicMedia' not in open(path, 'rb').read():
        sys.exit(f'{path}: IPTC tag missing after exiftool')

# Add new slugs to the list, keeping it sorted and existing dates unchanged.
text = open(LIST, encoding='utf8').read()
start, end = text.index('new Map([\n') + len('new Map([\n'), text.index(']);')
entries = dict(re.findall(r"\['([a-z0-9-]+)', '(\d{4}-\d{2}-\d{2})'\],", text[start:end]))
added = [slug for slug in slugs if slug not in entries]
entries.update({slug: date for slug in added})
body = ''.join(f"  ['{slug}', '{entries[slug]}'],\n" for slug in sorted(entries))
open(LIST, 'w', encoding='utf8').write(text[:start] + body + text[end:])
total = sum(os.path.getsize(p) for p in written)
print(f'published {len(slugs)} studio photos ({len(added)} new to the list, {len(entries)} listed), {total / 1048576:.1f} MiB')
