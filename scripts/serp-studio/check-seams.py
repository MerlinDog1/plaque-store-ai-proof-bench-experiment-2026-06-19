# Read-only: measure the tone step at each padded OG's source-frame boundary.
import json, sys
import numpy as np
from PIL import Image
exp = sys.argv[1]
# These exact circle bottoms intersect the original plate silhouette.
# Reviewed at 100% in Amendment 4; no side/background exception is allowed.
exceptions = {
    ('brushed-brass-200x200-circle-plaque', 'B'),
    ('brushed-stainless-200x200-circle-plaque', 'B'),
    ('polished-brass-200x200-circle-plaque', 'B'),
}
failures = []
man = json.load(open(f'{exp}/manifest.json'))
rows = []
for r in man:
    if r.get('version') != 'og' or r.get('treatment') != 'pad':
        continue
    a = np.asarray(Image.open(f"{exp}/{r['file']}").convert('L'), dtype=np.float32)
    H, W = a.shape
    x, y, w, h = r['sourceFrame']
    res = {}
    # vertical boundaries: compare 3-px strips just outside vs just inside, per row, inside the frame's rows
    def vstep(xo, xi):
        o = a[y:y+h, xo-1:xo+2].mean(axis=1); i = a[y:y+h, xi-1:xi+2].mean(axis=1)
        d = np.abs(o - i)
        return float(np.percentile(d, 75))
    def hstep(yo, yi):
        o = a[yo-1:yo+2, x:x+w].mean(axis=0); i = a[yi-1:yi+2, x:x+w].mean(axis=0)
        return float(np.percentile(np.abs(o - i), 75))
    if x >= 4: res['L'] = vstep(x-3, x+2)
    if x+w <= W-4: res['R'] = vstep(x+w+2, x+w-3)
    if y >= 4: res['T'] = hstep(y-3, y+2)
    if y+h <= H-4: res['B'] = hstep(y+h+2, y+h-3)
    for side, value in res.items():
        if value > 2.0 and (r['slug'], side) not in exceptions:
            failures.append((r['slug'], side, value))
    worst = max(res.values()) if res else 0
    rows.append((worst, r['slug'], {k: round(v, 1) for k, v in res.items()}))
rows.sort(reverse=True)
for worst, slug, res in rows:
    print(f'{worst:5.1f} {slug} {res}')

assert len(rows) == 166, f'Expected all 166 padded OGs, got {len(rows)}'
assert not failures, f'Source-frame seams above 2.0: {failures}'
print('PASS: 166 padded OGs; threshold 2.0; only three reviewed circle-bottom plate crossings excepted')
