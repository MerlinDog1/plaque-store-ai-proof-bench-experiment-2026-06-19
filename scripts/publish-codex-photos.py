"""Publish the Codex catalogue photos and garden scenes made in output/catalogue-wording (owner msgs
5302 and 5736: each plaque with its own wording; tree-planting scenes with invented people).

python3 scripts/publish-codex-photos.py photos   public/site-images/catalogue-photo/<slug>.webp + -600.webp
python3 scripts/publish-codex-photos.py scenes   public/site-images/scenes/<slug>.webp + -900.webp
python3 scripts/publish-codex-photos.py thumbs   public/site-images/merchant/thumbs/<slug>.webp (flat renders, 160 px)

Only photos accepted in codex-review.json (or listed in scenes-accepted.json) are published; any
other offer keeps its existing photo, and the script lists them. Every published photo carries
IPTC DigitalSourceType trainedAlgorithmicMedia (metadata only, no visible label: owner msg 5231).
"""
import json
import os
import shutil
import subprocess
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.join(ROOT, 'output/catalogue-wording')
# A new folder, not the old merchant-photo one: phones and Google keep same-name copies of redrawn
# images, so the new photos get new URLs (24 Oct 2026).
PHOTOS = os.path.join(ROOT, 'public/site-images/catalogue-photo')
OLD_PHOTOS = os.path.join(ROOT, 'public/site-images/merchant-photo')
SCENES = os.path.join(ROOT, 'public/site-images/scenes')
RENDERS = os.path.join(ROOT, 'public/site-images/merchant')
AI = 'http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia'
# The five Codex samples the owner saw on 21 Oct, made before the queue existed.
SAMPLES = {
    'brushed-brass-225x75-rect-plaque': 'photos/brushed-brass-225x75-rect-plaque.codex1.png',
    'aged-brass-210x297-rect-dark-wood-plaque': 'photos/aged-brass-210x297-rect-dark-wood-plaque.codex1.png',
    'polished-stainless-400x300-rect-dark-wood-plaque': 'photos/polished-stainless-400x300-rect-dark-wood-plaque.codex2.png',
    'orbital-brass-matt-lacquer-148x210-rect-plaque': 'photos/orbital-brass-matt-lacquer-148x210-rect-plaque.codex1.png',
    'brushed-stainless-200x200-circle-plaque': 'photos/brushed-stainless-200x200-circle-plaque.codex1.png',
}


def read(name):
    with open(os.path.join(WORK, name)) as f:
        return json.load(f)


def tag(paths):
    for i in range(0, len(paths), 100):
        subprocess.run(['exiftool', '-q', '-overwrite_original', f'-XMP-iptcExt:DigitalSourceType={AI}', *paths[i:i + 100]], check=True)


def accepted_photos():
    state, review = read('codex-state.json'), read('codex-review.json')
    chosen = {slug: os.path.join(WORK, path) for slug, path in SAMPLES.items()}
    for slug, s in state.items():
        verdict = review.get(slug) or {}
        if s.get('status') == 'done' and verdict.get('verdict') == 'accept' and verdict.get('attempt') == s.get('attempts'):
            chosen[slug] = os.path.join(WORK, s['file'])
    return chosen


def photos():
    os.makedirs(PHOTOS, exist_ok=True)
    chosen = accepted_photos()
    written = []
    for slug, path in sorted(chosen.items()):
        im = Image.open(path).convert('RGB')
        w, h = im.size
        if abs(w - h) > 0.02 * max(w, h):
            raise SystemExit(f'{slug}: not square ({w}x{h})')
        for size, name in ((1200, f'{slug}.webp'), (600, f'{slug}-600.webp')):
            out = os.path.join(PHOTOS, name)
            im.resize((size, size), Image.LANCZOS).save(out, 'WEBP', quality=80, method=6)
            written.append(out)
    tag(written)
    wording = [item['slug'] for item in read('wording.json')]
    missing = [slug for slug in wording if slug not in chosen]
    for slug in missing:  # carry the earlier photo over to the new folder so the page never breaks
        for name in (f'{slug}.webp', f'{slug}-600.webp'):
            shutil.copy2(os.path.join(OLD_PHOTOS, name), os.path.join(PHOTOS, name))
    print(f'published {len(chosen)} photos ({sum(os.path.getsize(p) for p in written) / 1048576:.1f} MiB); keeping the old photo for: {missing}')


def scenes():
    os.makedirs(SCENES, exist_ok=True)
    written = []
    for slug, entry in sorted(read('scenes-accepted.json').items()):
        # entry: {"file": "scenes/<slug>.vN.jpg", "crop_x": 0..1} -- crop_x centres the square hero crop on the plaque.
        im = Image.open(os.path.join(WORK, entry['file'])).convert('RGB')
        for size, name in (((1536, 1024), f'{slug}.webp'), ((900, 600), f'{slug}-900.webp')):
            out = os.path.join(SCENES, name)
            im.resize(size, Image.LANCZOS).save(out, 'WEBP', quality=80, method=6)
            written.append(out)
        w, h = im.size
        left = int(max(0, min(w - h, entry.get('crop_x', 0.5) * w - h / 2)))
        out = os.path.join(SCENES, f'{slug}-sq.webp')
        im.crop((left, 0, left + h, h)).resize((1200, 1200), Image.LANCZOS).save(out, 'WEBP', quality=80, method=6)
        written.append(out)
    tag(written)
    print(f'published {len(written) // 3} scenes')


def thumbs():
    os.makedirs(os.path.join(RENDERS, 'thumbs'), exist_ok=True)
    count = 0
    for item in read('wording.json'):
        src = os.path.join(RENDERS, item['slug'] + '.jpg')
        Image.open(src).convert('RGB').resize((160, 160), Image.LANCZOS).save(
            os.path.join(RENDERS, 'thumbs', item['slug'] + '.webp'), 'WEBP', quality=80, method=6)
        count += 1
    print('thumbs', count)


if __name__ == '__main__':
    {'photos': photos, 'scenes': scenes, 'thumbs': thumbs}[sys.argv[1]]()
