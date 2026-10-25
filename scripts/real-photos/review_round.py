"""Review sheets for one round of guided bench photos: every version with its guide outline drawn on (overlay.py) and a
full-size crop of every plaque for reading the wording and checking the plate edge.
Usage: python3 -I review_round.py r3   -> review-r3-overlays.jpg, review-r3-plaques-<n>.jpg
"""
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
tag = sys.argv[1]
jobs = json.loads((HERE / f'jobs-{tag}.json').read_text())
tiles, crops = [], []
for job in jobs:
    gid = job['id'][: -len(tag) - 1]
    guide = HERE / 'guides' / f'{gid}.json'
    info = json.loads(guide.read_text()) if guide.exists() else None  # the workshop shot has no 3D guide
    for v in range(1, job['versions'] + 1):
        out_id = f"{job['id']}.v{v}"
        if not (HERE / 'out' / f'{out_id}.jpg').exists():
            continue
        if info:
            subprocess.run(['python3', '-I', str(HERE / 'overlay.py'), out_id, gid], check=True, capture_output=True)
        t = Image.open(HERE / (f'check-{out_id}.jpg' if info else f'out/{out_id}.jpg')).convert('RGB')
        t.thumbnail((480, 480))
        tile = Image.new('RGB', (480, 500), 'white')
        tile.paste(t, (0, 20))
        ImageDraw.Draw(tile).text((4, 4), out_id, fill='black')
        tiles.append(tile)
        im = Image.open(HERE / 'out' / f'{out_id}.jpg').convert('RGB')
        if info:
            sx, sy = im.width / info['size'][0], im.height / info['size'][1]
            xs = [x * sx for x, _ in info['plaque_corners_tl_tr_br_bl']]
            ys = [y * sy for _, y in info['plaque_corners_tl_tr_br_bl']]
            c = im.crop((int(min(xs)) - 14, int(min(ys)) - 14, int(max(xs)) + 14, int(max(ys)) + 14))
        else:
            c = im.crop((0, im.height // 4, im.width, im.height * 3 // 4))
        c.thumbnail((760, 360), Image.LANCZOS)
        lab = Image.new('RGB', (c.width, c.height + 18), 'white')
        lab.paste(c, (0, 18))
        ImageDraw.Draw(lab).text((4, 3), out_id, fill='black')
        crops.append(lab)
cols = 4
rows = (len(tiles) + cols - 1) // cols
sheet = Image.new('RGB', (480 * cols, 500 * rows), 'white')
for i, t in enumerate(tiles):
    sheet.paste(t, ((i % cols) * 480, (i // cols) * 500))
sheet.save(HERE / f'review-{tag}-overlays.jpg', quality=85)
for n in range(0, len(crops), 4):
    group = crops[n:n + 4]
    s = Image.new('RGB', (max(c.width for c in group), sum(c.height + 8 for c in group)), 'white')
    y = 0
    for c in group:
        s.paste(c, (0, y))
        y += c.height + 8
    s.save(HERE / f'review-{tag}-plaques-{n // 4 + 1}.jpg', quality=92)
print(len(tiles), 'versions reviewed')
