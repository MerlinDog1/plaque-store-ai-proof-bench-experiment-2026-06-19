"""Review sheets for one round of garden photos: every version with its coded layout drawn on (the plaque's outline in
red, the nearest joints or board edges either side in blue), and a full-size crop of every plaque for reading the
wording and checking the plate edge. Keep a version only if the plaque sits on the red outline and the blue lines run
along real joints or board edges, so its size against the bricks or boards is right.
Usage: python3 -I review.py r1   -> review-r1-overlays.jpg, review-r1-plaques-<n>.jpg
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
tag = sys.argv[1]
jobs = json.loads((HERE / f'jobs-{tag}.json').read_text())
tiles, crops = [], []
for job in jobs:
    gid = job['id'][: -len(tag) - 1]
    info = json.loads((HERE / 'guides' / f'{gid}.json').read_text())
    for v in range(1, job['versions'] + 1):
        out_id = f"{job['id']}.v{v}"
        path = HERE / 'out' / f'{out_id}.jpg'
        if not path.exists():
            continue
        im = Image.open(path).convert('RGB')
        sx, sy = im.width / info['size'][0], im.height / info['size'][1]
        ov = im.copy()
        d = ImageDraw.Draw(ov)
        w = max(2, im.width // 400)
        pts = [(x * sx, y * sy) for x, y in info['plaque_outline']]
        d.line(pts + [pts[0]], fill=(255, 0, 0), width=w)
        for line in info['surface_lines']:
            d.line([(x * sx, y * sy) for x, y in line], fill=(0, 90, 255), width=w)
        ov.thumbnail((480, 480))
        tile = Image.new('RGB', (480, 500), 'white')
        tile.paste(ov, (0, 20))
        ImageDraw.Draw(tile).text((4, 4), out_id, fill='black')
        tiles.append(tile)
        xs, ys = [p[0] for p in pts], [p[1] for p in pts]
        c = im.crop((int(min(xs)) - 14, int(min(ys)) - 14, int(max(xs)) + 14, int(max(ys)) + 14))
        c.thumbnail((900, 640), Image.LANCZOS)
        lab = Image.new('RGB', (c.width, c.height + 18), 'white')
        lab.paste(c, (0, 18))
        ImageDraw.Draw(lab).text((4, 3), out_id, fill='black')
        crops.append(lab)
cols = 4
rows = max(1, (len(tiles) + cols - 1) // cols)
sheet = Image.new('RGB', (480 * cols, 500 * rows), 'white')
for i, t in enumerate(tiles):
    sheet.paste(t, ((i % cols) * 480, (i // cols) * 500))
sheet.save(HERE / f'review-{tag}-overlays.jpg', quality=85)
for n in range(0, len(crops), 2):
    group = crops[n:n + 2]
    s = Image.new('RGB', (sum(c.width + 8 for c in group), max(c.height for c in group)), 'white')
    x = 0
    for c in group:
        s.paste(c, (x, 0))
        x += c.width + 8
    s.save(HERE / f'review-{tag}-plaques-{n // 2 + 1}.jpg', quality=92)
print(len(tiles), 'versions reviewed')
