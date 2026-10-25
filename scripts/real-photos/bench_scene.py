"""Rough 3D layout renders for the bench photos (owner msgs 6149, 6152 and 6154, 25 Oct 2026):

    "If you gonna take from an angle you need to make sure plaque lines up with bench and also check positioning on
    bench always" ... "could you even potentially code the angle? And the rough bench outline so image model was less
    likely to make shit up?"

Each guide is a plain clay render of a simple bench model with the plaque's own designer drawing mapped onto the front
of the top rail, centred on it and lined up with it, seen from a fixed camera. Codex gets the guide instead of the flat
drawing, so it keeps the viewpoint, the bench outline and the plaque's place and angle, and only adds real materials and
the setting. The bench faces its view and the camera stands in front of it (owner msg 6152), so the guide shows only
plain ground and sky behind the bench, for the setting to fill.

Units are mm. World axes: X along the bench (left to right seen from the front), Y up, Z from the front of the bench to
the back. The bench faces -Z; the camera stands in front of it.
Usage: python3 -I bench_scene.py [id ...]   -> guides/<id>.png and guides/<id>.json (plaque corners in the frame)
"""
import importlib.util
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('bench', HERE / 'bench.py')
bench_mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bench_mod)

CLAY = np.array([218, 213, 204], float)
METAL_EDGE = {'stainless': (196, 200, 202), 'brass': (190, 160, 90)}
SKY = np.array([247, 247, 247], float)
GROUND = np.array([192, 194, 188], float)
OUTLINE = np.array([70, 70, 70], float)
LIGHT = np.array([-0.45, 0.75, -0.5])
LIGHT = LIGHT / np.linalg.norm(LIGHT)
SS = 2  # supersampling


def box(x0, x1, y0, y1, z0, z1):
    """An axis-aligned box as six quads."""
    p = np.array([[x, y, z] for x in (x0, x1) for y in (y0, y1) for z in (z0, z1)], float)
    faces = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
    return [p[list(f)] for f in faces]


def recline(quads, angle, pivot_y, pivot_z):
    """Tilt upright backrest parts back by `angle` degrees about a horizontal axis along X."""
    a = math.radians(angle)
    out = []
    for q in quads:
        q = q.copy()
        dy, dz = q[:, 1] - pivot_y, q[:, 2] - pivot_z
        q[:, 1] = pivot_y + dy * math.cos(a) - dz * math.sin(a)
        q[:, 2] = pivot_z + dz * math.cos(a) + dy * math.sin(a)
        out.append(q)
    return out


def build(b, plaque_w, plaque_h):
    """Return (parts, plaque_quad) for a bench spec. parts: list of quads; plaque_quad: 4 corners TL, TR, BR, BL."""
    L, hl = b['L'], b['L'] / 2
    seat, depth, t = b.get('seat_h', 450), b.get('seat_d', 440), 32
    end = b.get('end_w', 55)  # thickness of the legs / end frames along X
    inner = hl - end
    parts = []
    n, gap = b.get('seat_slats', 5), 10
    sd = (depth - gap * (n - 1)) / n
    for i in range(n):
        z0 = i * (sd + gap)
        parts += box(-inner, inner, seat - t, seat, z0, z0 + sd)
    parts += box(-inner, inner, seat - t - 70, seat - t, 10, 35)            # front apron
    parts += box(-inner, inner, seat - t - 70, seat - t, depth - 30, depth - 5)  # back apron
    arm_h = b.get('arm_h', 640) if b.get('arms', True) else seat
    leg = b.get('leg', 55)
    back_parts = []
    for sx in (-1, 1):
        x0, x1 = sorted((sx * inner, sx * hl))
        parts += box(x0, x1, 0, arm_h, 15, 15 + leg)                       # front leg
        parts += box(x0, x1, 0, seat + 30, depth - 10, depth - 10 + leg)    # back leg, lower part
        parts += box(x0, x1, seat - t - 70, seat - t, 15, depth)            # side rail under the seat
        if b.get('arms', True):
            parts += box(x0 - 10, x1 + 10, arm_h, arm_h + 28, 0, depth + 40)  # arm
        back_parts += box(x0, x1, seat + 30, b['top'], depth - 10, depth - 10 + leg)  # back post (reclined below)
    # Backrest, built upright with its front face at z = depth, then reclined about the back of the seat.
    face_z = depth
    if b['back'] == 'splats':
        rail_h, rail_t = b['rail_h'], b.get('rail_t', 40)
        rail_y0 = b['top'] - rail_h
        back_parts += box(-inner, inner, rail_y0, b['top'], face_z, face_z + rail_t)          # top rail
        low_y0 = seat + 45
        back_parts += box(-inner, inner, low_y0, low_y0 + 55, face_z, face_z + rail_t)       # lower back rail
        pitch = b.get('splat_pitch', 105)
        k = int((2 * inner) // pitch)
        for i in range(k):
            xc = -inner + pitch / 2 + i * pitch + ((2 * inner) - k * pitch) / 2
            back_parts += box(xc - 21, xc + 21, low_y0 + 55, rail_y0, face_z + 10, face_z + 30)  # splat
        plaque_yc = rail_y0 + rail_h / 2
        room = rail_h
    else:
        y = b['top']
        slat_t = b.get('slat_t', 30)
        top_slat = None
        for i, h in enumerate(b['slats']):
            back_parts += box(-inner, inner, y - h, y, face_z, face_z + slat_t)
            if i == 0:
                top_slat = (y - h, y)
            y -= h + b.get('slat_gap', 22)
        plaque_yc = (top_slat[0] + top_slat[1]) / 2
        room = top_slat[1] - top_slat[0]
    if plaque_h + 2 * 8 > room:
        raise SystemExit(f'Plaque {plaque_h} mm is too tall for a {room} mm rail')
    # The rail's front face for a stretch either side of the plaque, to check the plaque stays centred on it.
    hr = plaque_w / 2 + 120
    rail_face = np.array([[-hr, plaque_yc + room / 2, face_z], [hr, plaque_yc + room / 2, face_z],
                          [hr, plaque_yc - room / 2, face_z], [-hr, plaque_yc - room / 2, face_z]], float)
    hw, hh = plaque_w / 2, plaque_h / 2
    pz = face_z - 1.5
    plaque_box = box(-hw, hw, plaque_yc - hh, plaque_yc + hh, pz, face_z)
    # The engraved face sits a hair in front of the plate's box so the z-buffer draws it over the plain metal.
    fz = pz - 0.2
    plaque_face = np.array([[-hw, plaque_yc + hh, fz], [hw, plaque_yc + hh, fz],
                            [hw, plaque_yc - hh, fz], [-hw, plaque_yc - hh, fz]], float)
    pivot = (seat, depth)
    back_parts = recline(back_parts, b.get('recline', 12), *pivot)
    plaque_box = recline(plaque_box, b.get('recline', 12), *pivot)
    plaque_face = recline([plaque_face], b.get('recline', 12), *pivot)[0]
    rail_face = recline([rail_face], b.get('recline', 12), *pivot)[0]
    return parts + back_parts, plaque_box, plaque_face, rail_face


def normal(q):
    """Outward normal: box() winds every face counter-clockwise seen from outside, and reclining keeps that."""
    n = np.cross(q[1] - q[0], q[2] - q[0])
    return n / (np.linalg.norm(n) or 1)


class Camera:
    def __init__(self, pos, target, f_px, w, h, cx, cy):
        self.pos, self.f, self.w, self.h, self.cx, self.cy = np.array(pos, float), f_px, w, h, cx, cy
        fwd = np.array(target, float) - self.pos
        self.fwd = fwd / np.linalg.norm(fwd)
        r = np.cross([0, 1, 0], self.fwd)
        self.right = r / np.linalg.norm(r)
        self.up = np.cross(self.fwd, self.right)

    def to_cam(self, p):
        d = np.asarray(p, float) - self.pos
        return np.stack([d @ self.right, d @ self.up, d @ self.fwd], -1)

    def project(self, pc):
        return np.stack([self.cx + self.f * pc[..., 0] / pc[..., 2], self.cy - self.f * pc[..., 1] / pc[..., 2]], -1)


def clip_near(tri, uv, near=20.0):
    """Clip a camera-space triangle against z > near (Sutherland-Hodgman). Returns a list of (tri, uv)."""
    pts = list(zip(tri, uv if uv is not None else [None] * 3))
    out = []
    for i in range(len(pts)):
        (a, ua), (b, ub) = pts[i], pts[(i + 1) % len(pts)]
        ina, inb = a[2] > near, b[2] > near
        if ina:
            out.append((a, ua))
        if ina != inb:
            s = (near - a[2]) / (b[2] - a[2])
            out.append((a + s * (b - a), None if ua is None else ua + s * (ub - ua)))
    if len(out) < 3:
        return []
    res = []
    for i in range(1, len(out) - 1):
        t = np.array([out[0][0], out[i][0], out[i + 1][0]])
        u = None if uv is None else np.array([out[0][1], out[i][1], out[i + 1][1]])
        res.append((t, u))
    return res


def render(cam, quads_with_colour, textured, tex):
    W, H = cam.w, cam.h
    # Background: ground plane (y = 0) below the horizon, plain sky above; the z-buffer holds 1/z. Only the world-up
    # part of each pixel's ray is needed to find where it meets the ground.
    gx, gy = np.meshgrid(np.arange(W, dtype=np.float32) + 0.5, np.arange(H, dtype=np.float32) + 0.5)
    dwy = ((gx - cam.cx) / cam.f * cam.right[1] - (gy - cam.cy) / cam.f * cam.up[1] + cam.fwd[1]).astype(np.float32)
    del gx, gy
    ground = dwy < 0
    zbuf = np.zeros((H, W), np.float32)
    zbuf[ground] = -dwy[ground] / cam.pos[1]
    fade = np.clip(zbuf * 3000, 0, 1)[..., None]
    img = (GROUND * fade + SKY * (1 - fade)).astype(np.float32)
    del dwy, fade
    # Which face each pixel shows, so every edge of the bench can be outlined at the end ("the rough bench outline").
    ids = np.full((H, W), -1, np.int32)
    face_id = [0]

    def raster(tri_c, colour=None, uv=None):
        xy = cam.project(tri_c)
        x0, x1 = max(int(np.floor(xy[:, 0].min())), 0), min(int(np.ceil(xy[:, 0].max())), W - 1)
        y0, y1 = max(int(np.floor(xy[:, 1].min())), 0), min(int(np.ceil(xy[:, 1].max())), H - 1)
        if x0 > x1 or y0 > y1:
            return
        area = (xy[1, 0] - xy[0, 0]) * (xy[2, 1] - xy[0, 1]) - (xy[2, 0] - xy[0, 0]) * (xy[1, 1] - xy[0, 1])
        if abs(area) < 1e-6:
            return
        px, py = np.meshgrid(np.arange(x0, x1 + 1, dtype=np.float32) + 0.5, np.arange(y0, y1 + 1, dtype=np.float32) + 0.5)
        w0 = ((xy[1, 0] - px) * (xy[2, 1] - py) - (xy[2, 0] - px) * (xy[1, 1] - py)) / area
        w1 = ((xy[2, 0] - px) * (xy[0, 1] - py) - (xy[0, 0] - px) * (xy[2, 1] - py)) / area
        w2 = 1 - w0 - w1
        inside = (w0 >= -1e-6) & (w1 >= -1e-6) & (w2 >= -1e-6)
        if not inside.any():
            return
        iz = w0 / tri_c[0, 2] + w1 / tri_c[1, 2] + w2 / tri_c[2, 2]
        sub = zbuf[y0:y1 + 1, x0:x1 + 1]
        hit = inside & (iz > sub)
        if not hit.any():
            return
        sub[hit] = iz[hit]
        ids[y0:y1 + 1, x0:x1 + 1][hit] = face_id[0]
        target = img[y0:y1 + 1, x0:x1 + 1]
        if uv is None:
            target[hit] = colour
            return
        u = (w0 * uv[0, 0] / tri_c[0, 2] + w1 * uv[1, 0] / tri_c[1, 2] + w2 * uv[2, 0] / tri_c[2, 2]) / iz
        v = (w0 * uv[0, 1] / tri_c[0, 2] + w1 * uv[1, 1] / tri_c[1, 2] + w2 * uv[2, 1] / tri_c[2, 2]) / iz
        th, tw = tex.shape[:2]
        uu = np.clip(u[hit] * (tw - 1), 0, tw - 1.001)
        vv = np.clip(v[hit] * (th - 1), 0, th - 1.001)
        ui, vi = uu.astype(int), vv.astype(int)
        fu, fv = (uu - ui)[:, None], (vv - vi)[:, None]
        c = (tex[vi, ui] * (1 - fu) * (1 - fv) + tex[vi, ui + 1] * fu * (1 - fv)
             + tex[vi + 1, ui] * (1 - fu) * fv + tex[vi + 1, ui + 1] * fu * fv)
        target[hit] = c * colour  # colour is a shading factor for the textured face

    quiet = set()  # faces drawn without outlines: the plate, so its edge does not read as a frame (owner msg 6162)
    for quads, colour, outline in quads_with_colour:
        for q in quads:
            face_id[0] += 1
            if not outline:
                quiet.add(face_id[0])
            shade = 0.42 + 0.58 * max(0.0, float(normal(q) @ LIGHT))
            qc = cam.to_cam(q)
            for tri in (qc[[0, 1, 2]], qc[[0, 2, 3]]):
                for t, _ in clip_near(tri, None):
                    raster(t, np.asarray(colour, float) * shade)
    face, uvs, shade = textured
    face_id[0] += 1
    quiet.add(face_id[0])
    qc = cam.to_cam(face)
    for tri, uv in ((qc[[0, 1, 2]], uvs[[0, 1, 2]]), (qc[[0, 2, 3]], uvs[[0, 2, 3]])):
        for t, u in clip_near(tri, uv):
            raster(t, shade, u)
    # Outline every face boundary of the bench (two supersampled pixels wide, about one pixel in the final guide).
    loud = ~np.isin(ids, list(quiet))
    edge = np.zeros((H, W), bool)
    edge[:, 1:] |= (ids[:, 1:] != ids[:, :-1]) & loud[:, 1:] & loud[:, :-1]
    edge[1:, :] |= (ids[1:, :] != ids[:-1, :]) & loud[1:, :] & loud[:-1, :]
    edge[:, :-1] |= edge[:, 1:]
    edge[:-1, :] |= edge[1:, :]
    img[edge] = OUTLINE
    return np.clip(img, 0, 255).astype(np.uint8)


def guide(p, out_dir, json_only=False):
    g = p['guide']
    o = bench_mod.OFFERS[p['offer']]
    pw, ph = o['width'], o['height']
    stencil = Image.open(HERE / 'metal' / f"{p['id']}.png").convert('RGB')
    tex = np.asarray(stencil, np.float32)
    if o['textColor'] == 'cream':
        dark = tex.max(-1) < 40
        tex[dark] = (236, 224, 192)
    b = g['bench']
    quads, plaque_box, plaque_face, rail_face = build(b, pw, ph)
    W, H = g['size']
    W, H = W * SS, H * SS
    # Lens: focal length as on a full-frame camera; square frames use the 24 mm height as their width.
    f_px = g['lens'] / (36 if W > H else 24) * W
    centre = plaque_face.mean(0)
    yaw, pitch = math.radians(g['yaw']), math.radians(g['pitch'])
    d = f_px * pw * math.cos(yaw) / (g['frac'] * W)
    pos = centre + d * np.array([math.sin(yaw) * math.cos(pitch), math.sin(pitch), -math.cos(yaw) * math.cos(pitch)])
    cam = Camera(pos, centre, f_px, W, H, g.get('cx', 0.5) * W, g.get('cy', 0.5) * H)
    out_dir.mkdir(exist_ok=True)
    if not json_only:
        metal = METAL_EDGE['stainless' if 'stainless' in o['material'] else 'brass']
        groups = [(quads, CLAY, True), (plaque_box, metal, False)]
        uvs = np.array([[0, 0], [1, 0], [1, 1], [0, 1]], float)
        shade = 0.9 + 0.1 * max(0.0, float(normal(plaque_face) @ LIGHT))
        img = render(cam, groups, (plaque_face, uvs, shade), tex)
        Image.fromarray(img).resize((W // SS, H // SS), Image.LANCZOS).save(out_dir / f"{p['id']}.png")
    corners = (cam.project(cam.to_cam(plaque_face)) / SS).round(1).tolist()
    rail = (cam.project(cam.to_cam(rail_face)) / SS).round(1).tolist()
    info = {'id': p['id'], 'size': [W // SS, H // SS], 'camera_distance_mm': round(d), 'lens_mm': g['lens'],
            'yaw': g['yaw'], 'pitch': g['pitch'], 'plaque_corners_tl_tr_br_bl': corners,
            'rail_face_corners_tl_tr_br_bl': rail,
            'plaque_width_frac': round((max(c[0] for c in corners) - min(c[0] for c in corners)) / (W // SS), 3)}
    (out_dir / f"{p['id']}.json").write_text(json.dumps(info, indent=1))
    print(p['id'], 'camera', round(d), 'mm away; plaque spans', info['plaque_width_frac'], 'of the width')


if __name__ == '__main__':
    json_only = '--json-only' in sys.argv  # recompute the corner records without redrawing the guides
    only = set(a for a in sys.argv[1:] if not a.startswith('--'))
    for p in bench_mod.PHOTOS:
        if p.get('guide') and (not only or p['id'] in only):
            guide(p, HERE / 'guides', json_only)
