"""Repaint the two black screw dots of a 2-hole designer stencil (bench-style 150 x 50, one hole at each end, half
way up) in the plate's own metal, with a darker rim, like metal_caps.py does for four corner caps.
Bench plaques are screwed on, so they get a screw slot. Ovals and circles are held by two flat caps (their offers say
fixing "caps"), so pass `cap` to leave the slot off.
Usage: python3 -I metal_screws.py IN.png OUT.png [cap]
"""
import sys

from PIL import Image, ImageDraw

src, dst = sys.argv[1], sys.argv[2]
cap = sys.argv[3:4] == ['cap']
im = Image.open(src).convert('RGBA')
w, h = im.size
px = im.load()


def dark(x, y):
    if not (0 <= x < w and 0 <= y < h):
        return False
    r, g, b, a = px[x, y]
    return a > 200 and r < 70 and g < 70 and b < 70


holes = []
for x0, x1 in ((0, w // 8), (w - w // 8, w)):
    y0, y1 = h // 4, h - h // 4
    # A hole is a filled disc: keep pixels whose 9 x 9 neighbourhood is dark (drops thin border lines).
    core = [(x, y) for x in range(x0 + 4, x1 - 4) for y in range(y0, y1)
            if all(dark(x + dx, y + dy) for dx in (-4, 0, 4) for dy in (-4, 0, 4))]
    if not core:
        raise SystemExit(f'No screw hole found between x={x0} and x={x1}')
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
    holes.append((cx, cy, radius, ring[len(ring) // 2]))

draw = ImageDraw.Draw(im)
for cx, cy, radius, plate in holes:
    face = tuple(min(255, int(c * 1.06 + 8)) for c in plate)
    rim = tuple(int(c * 0.6) for c in plate)
    r = radius + 1
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=face + (255,), outline=rim + (255,), width=max(2, radius // 5))
    if not cap:
        # A screw slot, so it reads as a round-head screw rather than a cap.
        slot = tuple(int(c * 0.55) for c in plate) + (255,)
        draw.line([cx - r * 0.6, cy, cx + r * 0.6, cy], fill=slot, width=max(2, radius // 4))
im.save(dst)
print(dst, [(round(x), round(y), r, c) for x, y, r, c in holes])
