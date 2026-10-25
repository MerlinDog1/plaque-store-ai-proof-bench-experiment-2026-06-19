"""Check a generated bench photo against its 3D guide (bench_scene.py): draws where the guide put the plaque (red) and
the top rail's edges either side of it (blue). Keep a version only if the plaque sits on the red outline and the blue
lines run along the rail's real top and bottom edges, so the plaque is square on the rail and centred on it.
Usage: python3 -I overlay.py OUT_ID GUIDE_ID   -> check-<OUT_ID>.jpg
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
out_id, guide_id = sys.argv[1], sys.argv[2]
info = json.loads((HERE / 'guides' / f'{guide_id}.json').read_text())
im = Image.open(HERE / 'out' / f'{out_id}.jpg').convert('RGB')
sx, sy = im.width / info['size'][0], im.height / info['size'][1]
d = ImageDraw.Draw(im)
w = max(2, im.width // 400)
pts = [(x * sx, y * sy) for x, y in info['plaque_corners_tl_tr_br_bl']]
d.line(pts + [pts[0]], fill=(255, 0, 0), width=w)
rail = info.get('rail_face_corners_tl_tr_br_bl')
if rail:
    r = [(x * sx, y * sy) for x, y in rail]
    d.line([r[0], r[1]], fill=(0, 90, 255), width=w)
    d.line([r[3], r[2]], fill=(0, 90, 255), width=w)
im.thumbnail((1200, 1200))
im.save(HERE / f'check-{out_id}.jpg', quality=88)
print('check-' + out_id + '.jpg')
