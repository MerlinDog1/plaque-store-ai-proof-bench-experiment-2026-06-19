"""Repaint the four black screw dots of a 4-hole designer stencil (bench plaques 150 x 65 and 150 x 75, one hole near
each corner) in the plate's own metal, with a darker rim and a slot, so they read as metal screws rather than black dots
or caps. Same detection as metal_caps.py; same screw look as metal_screws.py.
Usage: python3 -I metal_screws4.py IN.png OUT.png
"""
import sys

from PIL import Image, ImageDraw

src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGBA')
w, h = im.size
px = im.load()


def dark(x, y):
    if not (0 <= x < w and 0 <= y < h):
        return False
    r, g, b, a = px[x, y]
    return a > 200 and r < 70 and g < 70 and b < 70


screws = []
for x0, x1, y0, y1 in ((0, w // 6, 0, h // 3), (w - w // 6, w, 0, h // 3),
                       (0, w // 6, h - h // 3, h), (w - w // 6, w, h - h // 3, h)):
    # A screw hole is a filled disc: keep pixels whose neighbourhood is entirely dark (drops thin border lines).
    core = [(x, y) for x in range(x0 + 4, x1 - 4) for y in range(y0 + 4, y1 - 4)
            if all(dark(x + dx, y + dy) for dx in (-4, 0, 4) for dy in (-4, 0, 4))]
    if not core:
        raise SystemExit(f'No screw hole found in corner {(x0, y0)}')
    cx = sum(p[0] for p in core) / len(core)
    cy = sum(p[1] for p in core) / len(core)
    radius = 0
    for ax, ay in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        r = 0
        while dark(int(cx + ax * (r + 1)), int(cy + ay * (r + 1))):
            r += 1
        radius = max(radius, r)
    ring = []
    for dx in range(-radius - 9, radius + 10, 2):
        for dy in range(-radius - 9, radius + 10, 2):
            d = (dx * dx + dy * dy) ** 0.5
            if radius + 4 < d < radius + 9 and 0 <= int(cx + dx) < w and 0 <= int(cy + dy) < h:
                r, g, b, a = px[int(cx + dx), int(cy + dy)]
                if not (r < 90 and g < 90 and b < 90):
                    ring.append((r, g, b))
    ring.sort(key=sum)
    screws.append((cx, cy, radius, ring[len(ring) // 2]))

draw = ImageDraw.Draw(im)
for cx, cy, radius, plate in screws:
    face = tuple(min(255, int(c * 1.06 + 8)) for c in plate)
    rim = tuple(int(c * 0.6) for c in plate)
    r = radius + 1
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=face + (255,), outline=rim + (255,), width=max(2, radius // 5))
    slot = tuple(int(c * 0.55) for c in plate) + (255,)
    draw.line([cx - r * 0.6, cy, cx + r * 0.6, cy], fill=slot, width=max(2, radius // 4))
im.save(dst)
print(dst, [(round(x), round(y), r, c) for x, y, r, c in screws])
