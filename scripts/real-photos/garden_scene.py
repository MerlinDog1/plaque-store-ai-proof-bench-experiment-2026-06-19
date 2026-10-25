"""Coded layouts for the garden page photos, the way bench_scene.py codes the benches (owner msgs 6154 and 6214: "could
you even potentially code the angle? And the rough bench outline so image model was less likely to make shit up?";
"why wonky?").

Each guide draws the wall, fence, shed or gate the plaque is fixed to from real measurements (bricks 215 x 65 mm with
10 mm joints, stone courses, boards at their real widths) and lays the plaque's own designer drawing on it at its true
size. The camera stands square to the surface at the plaque's height (straight on, or 8-10 degrees to one side), so the
plaque sits level in the frame and its size against the bricks or boards is fixed. Codex gets the guide as its
reference image.

Units are mm. The surface is the plane z = 0 facing the camera, which stands at z < 0; x runs left to right, y up.
Usage: python3 -I garden_scene.py [id ...]   -> guides/<id>.png and guides/<id>.json, then guides-sheet.jpg
"""
import importlib.util
import json
import math
import random
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent


def load(name):
    spec = importlib.util.spec_from_file_location(name, HERE / f'{name}.py')
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


scene = load('bench_scene')  # its Camera
garden = load('garden')

PPM = 4   # surface texture pixels per mm
SS = 2    # supersampling
CLAY = (218, 213, 204)
JOINT = (172, 170, 164)
LINE = (80, 80, 80)
SHADOW = (150, 147, 140)
GAP = (112, 110, 106)


def tone(rng, base, spread=8):
    k = rng.uniform(-spread, spread)
    return tuple(int(max(0, min(255, c + k))) for c in base)


class Surface:
    """The surface pattern drawn into an image covering x0..x1 (left to right) and y0..y1 (bottom to top)."""

    def __init__(self, x0, y0, x1, y1, fill=JOINT):
        self.x0, self.y0, self.x1, self.y1 = x0, y0, x1, y1
        self.im = Image.new('RGB', (int((x1 - x0) * PPM) + 2, int((y1 - y0) * PPM) + 2), fill)
        self.d = ImageDraw.Draw(self.im)

    def px(self, x, y):
        return ((x - self.x0) * PPM, (self.y1 - y) * PPM)

    def visible(self, x0, y0, x1, y1):
        return x1 > self.x0 and x0 < self.x1 and y1 > self.y0 and y0 < self.y1

    def rect(self, x0, y0, x1, y1, fill, outline=LINE):
        if self.visible(x0, y0, x1, y1):
            (a, b), (c, e) = self.px(x0, y1), self.px(x1, y0)
            self.d.rectangle([a, b, c, e], fill=fill, outline=outline, width=1 if outline else 0)


def bricks(t, s, rng):
    """Stretcher bond, or English garden wall bond: three stretcher courses, then a course of headers."""
    L, hb, j = 215, 65, 10
    ch = hb + j
    for k in range(-5, 60):
        header = s.get('bond') == 'garden' and k % 4 == 3
        unit = (L - j) / 2 + j if header else L + j
        off = unit / 2 if header else (k % 2) * unit / 2
        yb = k * ch + j / 2
        for i in range(-40, 40):
            xl = off + i * unit + j / 2
            t.rect(xl, yb, xl + unit - j, yb + hb, tone(rng, CLAY, 9))
    return {'h': [k * ch for k in range(-5, 61)]}


def stone(t, s, rng):
    """Coursed squared stone: courses 95-165 mm tall, blocks 190-430 mm long, 12 mm joints."""
    j, y, hs = 12, -400.0, []
    while y < 3500:
        h = rng.uniform(95, 165)
        x = -2000 - rng.uniform(0, 300)
        while x < 2000:
            n = rng.uniform(190, 430)
            t.rect(x + j / 2, y + j / 2, x + n - j / 2, y + h - j / 2, tone(rng, CLAY, 12))
            x += n
        hs.append(y)
        y += h
    return {'h': hs}


def ashlar(t, s, rng):
    """Large smooth sandstone blocks, 450 x 225 mm with 5 mm joints, each course offset by half a block."""
    L, h, j = 450, 225, 5
    for k in range(-3, 18):
        off = (k % 2) * L / 2
        for i in range(-8, 8):
            x = off + i * L
            t.rect(x + j / 2, k * h + j / 2, x + L - j / 2, (k + 1) * h - j / 2, tone(rng, CLAY, 6))
    return {'h': [k * h for k in range(-3, 19)]}


def vboards(t, s, rng):
    """Vertical boards at their visible pitch: featheredge (each overlaps the next, a shadow along its edge) or
    tongue-and-groove (a narrow V-groove between boards)."""
    p, xs = s['pitch'], []
    for i in range(-30, 30):
        x = s.get('x_off', 0) + i * p
        t.rect(x, -500, x + p, 4000, tone(rng, CLAY, 7))
        if s.get('style') == 'featheredge':
            t.rect(x + 1, -500, x + 7, 4000, SHADOW, outline=None)
        else:
            t.rect(x - 2, -500, x + 2, 4000, GAP, outline=None)
        xs.append(x)
    return {'v': xs}


def hboards(t, s, rng):
    """Horizontal boards: shiplap (a groove and shadow along each board's top) or cladding with open shadow gaps."""
    p, g, ys = s['pitch'], s.get('gap', 0), []
    for k in range(-5, 40):
        y = s.get('y_off', 0) + k * p
        t.rect(-2500, y + g, 2500, y + p, tone(rng, CLAY, 7))
        if s.get('style') == 'shiplap':
            t.rect(-2500, y + p - 8, 2500, y + p, SHADOW, outline=None)
        if g:
            t.rect(-2500, y, 2500, y + g, GAP, outline=None)
        ys.append(y)
    return {'h': ys}


PATTERNS = {'brick': bricks, 'stone': stone, 'ashlar': ashlar, 'vboards': vboards, 'hboards': hboards}


def bilinear(img, u, v, chunk=500_000):
    """Sample an HxWx3 image at float pixel coordinates (clamped), in float32 and in chunks: a cody-job has 1 GiB, and
    float64 temporaries for four million pixels at once overran it."""
    h, w = img.shape[:2]
    out = np.empty((len(u), 3), np.float32)
    for a in range(0, len(u), chunk):
        uu = np.clip(u[a:a + chunk], 0, w - 1.001).astype(np.float32)
        vv = np.clip(v[a:a + chunk], 0, h - 1.001).astype(np.float32)
        ui, vi = uu.astype(np.int32), vv.astype(np.int32)
        fu, fv = (uu - ui.astype(np.float32))[:, None], (vv - vi.astype(np.float32))[:, None]
        out[a:a + chunk] = (img[vi, ui] * ((1 - fu) * (1 - fv)) + img[vi, ui + 1] * (fu * (1 - fv))
                            + img[vi + 1, ui] * ((1 - fu) * fv) + img[vi + 1, ui + 1] * (fu * fv))
    return out


def guide(p, out_dir):
    g, s = p['guide'], p['surface']
    o = garden.OFFERS[p['offer']]
    # A wood-backed plaque's stencil includes its board, 12.5 mm larger than the plate on every side.
    pw, ph = o['width'] + (25 if o['wood'] else 0), o['height'] + (25 if o['wood'] else 0)
    xc, yc = s['plaque_at']
    W, H = g['size'][0] * SS, g['size'][1] * SS
    f_px = g['lens'] / (36 if W > H else 24) * W  # full-frame focal length; square frames use the 24 mm height
    yaw = math.radians(g['yaw'])
    # The distance at which the plaque fills `frac` of the frame: of its width, or of its height if that is tighter.
    d = f_px * max(pw * math.cos(yaw) / W, ph / H) / g['frac']
    centre = np.array([xc, yc, 0.0])
    along, up, out = np.array([1.0, 0, 0]), np.array([0, 1.0, 0]), np.array([0, 0, -1.0])
    pos = centre + d * (math.cos(yaw) * out + math.sin(yaw) * along)
    cam = scene.Camera(pos, centre, f_px, W, H, 0.5 * W, 0.5 * H, up=up)
    cam.level(along)
    # Every pixel's ray meets the surface plane z = 0.
    xs = ((np.arange(W, dtype=np.float32) + 0.5 - cam.cx) / cam.f)[None, :]
    ys = ((np.arange(H, dtype=np.float32) + 0.5 - cam.cy) / cam.f)[:, None]
    dz = cam.fwd[2] + xs * cam.right[2] - ys * cam.up[2]
    t = (-cam.pos[2] / dz).astype(np.float32)
    X = (cam.pos[0] + t * (cam.fwd[0] + xs * cam.right[0] - ys * cam.up[0])).astype(np.float32)
    Y = (cam.pos[1] + t * (cam.fwd[1] + xs * cam.right[1] - ys * cam.up[1])).astype(np.float32)
    del dz, t
    surf = Surface(float(X.min()) - 30, float(Y.min()) - 30, float(X.max()) + 30, float(Y.max()) + 30)
    feats = PATTERNS[s['kind']](surf, s, random.Random(s.get('seed', 1)))
    tex = np.asarray(surf.im)
    img = bilinear(tex, ((X - surf.x0) * PPM).ravel(), ((surf.y1 - Y) * PPM).ravel())
    del tex, surf.im
    # The plaque, flat on the surface at its true size; ovals and circles masked to their shape.
    dx, dy = (X - xc).ravel() / (pw / 2), (Y - yc).ravel() / (ph / 2)
    inside = (np.abs(dx) <= 1) & (np.abs(dy) <= 1)
    if o['shape'] in ('oval', 'circle'):
        inside &= dx * dx + dy * dy <= 1
    sten = Image.open(HERE / 'metal' / f"{p['id']}.png").convert('RGBA')
    plate = Image.new('RGBA', sten.size, (255, 255, 255, 255))
    plate.alpha_composite(sten)
    st = np.asarray(plate.convert('RGB'), np.float32)
    if o['textColor'] == 'cream':
        st[st.max(-1) < 40] = (236, 224, 192)
    sh, sw = st.shape[:2]
    img[inside] = bilinear(st, (dx[inside] + 1) / 2 * (sw - 1), (1 - dy[inside]) / 2 * (sh - 1))
    out_dir.mkdir(exist_ok=True)
    pic = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8).reshape(H, W, 3))
    pic.resize((W // SS, H // SS), Image.LANCZOS).save(out_dir / f"{p['id']}.png")

    def proj(pts):
        pc = cam.to_cam(np.asarray(pts, float))
        return (cam.project(pc) / SS).round(1).tolist()

    if o['shape'] in ('oval', 'circle'):
        a = np.linspace(0, 2 * math.pi, 73)[:-1]
        outline = proj(np.stack([xc + pw / 2 * np.cos(a), yc + ph / 2 * np.sin(a), np.zeros_like(a)], -1))
    else:
        outline = proj([[xc - pw / 2, yc + ph / 2, 0], [xc + pw / 2, yc + ph / 2, 0],
                        [xc + pw / 2, yc - ph / 2, 0], [xc - pw / 2, yc - ph / 2, 0]])
    # The nearest joints or board edges either side of the plaque, to check the surface's scale in the photo.
    lines = []
    if 'h' in feats:
        below = max([y for y in feats['h'] if y < yc - ph / 2], default=None)
        above = min([y for y in feats['h'] if y > yc + ph / 2], default=None)
        lines += [proj([[surf.x0, y, 0], [surf.x1, y, 0]]) for y in (below, above) if y is not None]
    if 'v' in feats:
        left = max([x for x in feats['v'] if x < xc - pw / 2], default=None)
        right = min([x for x in feats['v'] if x > xc + pw / 2], default=None)
        lines += [proj([[x, surf.y0, 0], [x, surf.y1, 0]]) for x in (left, right) if x is not None]
    xs_o = [q[0] for q in outline]
    tl, tr = proj([[xc - pw / 2, yc + ph / 2, 0], [xc + pw / 2, yc + ph / 2, 0]])
    bl, br = proj([[xc - pw / 2, yc - ph / 2, 0], [xc + pw / 2, yc - ph / 2, 0]])
    tilt = math.degrees(math.atan2((tr[1] + br[1]) / 2 - (tl[1] + bl[1]) / 2, (tr[0] + br[0]) / 2 - (tl[0] + bl[0]) / 2))
    info = {'id': p['id'], 'size': [W // SS, H // SS], 'camera_distance_mm': round(d), 'lens_mm': g['lens'],
            'yaw': g['yaw'], 'plaque_tilt_deg': round(tilt, 2), 'plaque_outline': outline, 'surface_lines': lines,
            'plaque_width_frac': round((max(xs_o) - min(xs_o)) / (W // SS), 3)}
    (out_dir / f"{p['id']}.json").write_text(json.dumps(info, indent=1))
    print(p['id'], 'camera', round(d), 'mm away; plaque spans', info['plaque_width_frac'], 'of the width; tilt',
          info['plaque_tilt_deg'], 'deg')


def sheet(out_dir):
    tiles = []
    for p in garden.PHOTOS:
        im = Image.open(out_dir / f"{p['id']}.png").convert('RGB')
        im.thumbnail((420, 420))
        tile = Image.new('RGB', (420, 440), 'white')
        tile.paste(im, ((420 - im.width) // 2, 20))
        ImageDraw.Draw(tile).text((4, 4), p['id'], fill='black')
        tiles.append(tile)
    cols = 4
    rows = (len(tiles) + cols - 1) // cols
    s = Image.new('RGB', (420 * cols, 440 * rows), 'white')
    for i, tile in enumerate(tiles):
        s.paste(tile, ((i % cols) * 420, (i // cols) * 440))
    s.save(HERE / 'guides-sheet.jpg', quality=88)


if __name__ == '__main__':
    only = set(sys.argv[1:])
    for p in garden.PHOTOS:
        if not only or p['id'] in only:
            guide(p, HERE / 'guides')
    sheet(HERE / 'guides')
