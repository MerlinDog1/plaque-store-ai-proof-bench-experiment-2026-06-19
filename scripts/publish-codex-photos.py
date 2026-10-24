"""Publish the Codex catalogue photos and garden scenes made in output/catalogue-wording (owner msgs
5302 and 5736: each plaque with its own wording; tree-planting scenes with invented people).

python3 scripts/publish-codex-photos.py photos   public/site-images/catalogue-photo/<slug>.webp + -600.webp
python3 scripts/publish-codex-photos.py scenes   public/site-images/scenes/<slug>.webp + -900.webp
python3 scripts/publish-codex-photos.py thumbs   public/site-images/merchant/thumbs/<slug>.webp (flat renders, 160 px)
python3 scripts/publish-codex-photos.py tree ACCEPTED.json [FOLDER]
                                                 public/site-images/<FOLDER, default tree-plaques>/<slug>.webp + -900.webp + -sq.webp

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
OLD_PHOTOS = os.path.join(ROOT, 'public/site-images/merchant-photo')  # removed 24 Oct once all 173 were new
SCENES = os.path.join(ROOT, 'public/site-images/scenes')  # removed 24 Oct once the tree scenes replaced them
# Tree photos on the Gemini key with the Nicola-order mount (owner msg 5762, 24 Oct 2026), then as close-ups with no
# people (msg 5778), then through the designer's built-in realistic preview (msg 5796, scripts/generate-tree-closeups.mjs).
# Each redo gets a new folder so phones and Google fetch it fresh: tree-scenes/, then tree-plaques/, then
# tree-plaque-photos/.
TREE_FOLDER = 'tree-plaque-photos'
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
            old, new = os.path.join(OLD_PHOTOS, name), os.path.join(PHOTOS, name)
            if not os.path.exists(new) and os.path.exists(old):
                shutil.copy2(old, new)
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


def tree(accepted_path, folder=TREE_FOLDER):
    """Publish the chosen tree photos. ACCEPTED.json maps slug -> {"file": absolute path, "crop_x": 0..1}; crop_x
    centres the square crop (the tree page hero and share image)."""
    TREE_SCENES = os.path.join(ROOT, 'public/site-images', folder)
    os.makedirs(TREE_SCENES, exist_ok=True)
    with open(accepted_path) as f:
        accepted = json.load(f)
    written = []
    for slug, entry in sorted(accepted.items()):
        im = Image.open(entry['file']).convert('RGB')
        w, h = im.size
        if abs(w / h - 1.5) > 0.002:  # trim to exactly 3:2 so the page's 1536 x 1024 size attributes hold
            ch = round(w / 1.5)
            if ch <= h:
                im = im.crop((0, (h - ch) // 2, w, (h - ch) // 2 + ch))
            else:
                cw = round(h * 1.5)
                im = im.crop(((w - cw) // 2, 0, (w - cw) // 2 + cw, h))
            w, h = im.size
        for size, name in (((1536, 1024), f'{slug}.webp'), ((900, 600), f'{slug}-900.webp')):
            out = os.path.join(TREE_SCENES, name)
            im.resize(size, Image.LANCZOS).save(out, 'WEBP', quality=82, method=6)
            written.append(out)
        left = int(max(0, min(w - h, entry.get('crop_x', 0.5) * w - h / 2)))
        out = os.path.join(TREE_SCENES, f'{slug}-sq.webp')
        im.crop((left, 0, left + h, h)).resize((1200, 1200), Image.LANCZOS).save(out, 'WEBP', quality=82, method=6)
        written.append(out)
    tag(written)
    print(f'published {len(written) // 3} tree photos to {TREE_SCENES}')


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
    if sys.argv[1] == 'tree':
        tree(*sys.argv[2:4])
    else:
        {'photos': photos, 'scenes': scenes, 'thumbs': thumbs}[sys.argv[1]]()
