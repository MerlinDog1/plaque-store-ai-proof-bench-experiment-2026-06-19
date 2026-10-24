"""Write hand-coded plaque designs (SVG in millimetres, in an HTML page) for the 'coded' entries in specs.py.
render_coded.cjs then fits the wording inside the border and saves each design as a PNG.
Usage: python3 -I coded.py OUT_DIR
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from specs import SPECS  # noqa: E402

PX_PER_MM = 8
BOARD_MARGIN = 12.5
BEVEL = 6

PLATE = {  # (light, mid, dark) for a soft gradient; brushing lines on brushed finishes
    'brushed-stainless': ('#e3e6e8', '#cdd1d4', '#d9dcdf', True),
    'polished-stainless': ('#f2f4f5', '#c4c9cd', '#e4e7e9', False),
    'brushed-brass': ('#dcbb67', '#c49a3e', '#d3ae58', True),
    'polished-brass': ('#f0d67e', '#c99f40', '#e6c565', False),
    'aged-brass': ('#a3845a', '#7f6141', '#94754f', True),
}
CAP = {
    'brushed-stainless': ('#f4f6f7', '#cbd0d3', '#a9afb3', '#8a9095'),
    'polished-stainless': ('#ffffff', '#d5d9dc', '#a7adb1', '#8a9095'),
    'brushed-brass': ('#f3dc98', '#cfa64a', '#a8812e', '#8d6b25'),
    'polished-brass': ('#fff0b8', '#dcb455', '#a8812e', '#8d6b25'),
    'aged-brass': ('#c1a376', '#8f7049', '#6c5133', '#5a4329'),
}
BOARD = {  # bevel top, left, right, bottom, face, outer
    'dark': ('#7a5034', '#6a452c', '#3f2818', '#33200f', '#5a3922', '#3b2516'),
    'light': ('#dcb784', '#cfa874', '#a77f4c', '#9a7444', '#c79c64', '#a98250'),
}
TEXT = {'black': '#141414', 'cream': '#efe4c6'}
ROLE = {  # size in mm for an A5-width plate, weight, letter-spacing in em
    'intro': (5.2, 400, 0.18), 'name': (14.5, 600, 0.04), 'date': (7.6, 400, 0.05),
    'body': (6.8, 400, 0.0), 'small': (6.2, 400, 0.03),
}


def esc(text):
    return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def design(spec):
    p = spec['plate']
    w, h = p['w'], p['h']
    m = BOARD_MARGIN if p['board'] else 0
    W, H = w + 2 * m, h + 2 * m
    light, mid, dark, brushed = PLATE[p['material']]
    parts = [f'''<defs>
  <linearGradient id="plate" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{light}"/><stop offset="0.45" stop-color="{mid}"/><stop offset="1" stop-color="{dark}"/></linearGradient>
  <pattern id="brush" width="{W}" height="0.6" patternUnits="userSpaceOnUse"><rect width="{W}" height="0.25" fill="#ffffff" opacity="0.16"/></pattern>
  <radialGradient id="cap" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="{CAP[p['material']][0]}"/><stop offset="0.7" stop-color="{CAP[p['material']][1]}"/><stop offset="1" stop-color="{CAP[p['material']][2]}"/></radialGradient>
</defs>''']
    if p['board']:
        top, left, right, bottom, face, outer = BOARD[p['board']]
        b = BEVEL
        parts.append(f'<rect x="0" y="0" width="{W}" height="{H}" fill="{outer}"/>'
                     f'<polygon points="0,0 {W},0 {W-b},{b} {b},{b}" fill="{top}"/>'
                     f'<polygon points="0,0 {b},{b} {b},{H-b} 0,{H}" fill="{left}"/>'
                     f'<polygon points="{W},0 {W},{H} {W-b},{H-b} {W-b},{b}" fill="{right}"/>'
                     f'<polygon points="0,{H} {b},{H-b} {W-b},{H-b} {W},{H}" fill="{bottom}"/>'
                     f'<rect x="{b}" y="{b}" width="{W-2*b}" height="{H-2*b}" fill="{face}"/>'
                     f'<rect x="{m+0.6}" y="{m+0.6}" width="{w}" height="{h}" fill="#1e1209" opacity="0.35"/>')
    parts.append(f'<rect x="{m}" y="{m}" width="{w}" height="{h}" fill="url(#plate)" stroke="#8f969b" stroke-width="0.3"/>')
    if brushed:
        parts.append(f'<rect x="{m}" y="{m}" width="{w}" height="{h}" fill="url(#brush)"/>')
    ink = TEXT[p['text']]
    border = p['border']
    holes = []
    if p['fixing'] == 'caps4':
        inset = 11 if border == 'double' else 10  # a double border runs near the edge, outside the caps
        holes = [(m + inset, m + inset), (m + w - inset, m + inset), (m + inset, m + h - inset), (m + w - inset, m + h - inset)]
    elif p['fixing'] == 'screws2':
        holes = [(m + 9, m + h / 2), (m + w - 9, m + h / 2)]
    if border == 'scalloped':
        i, r = 10, p['cap'] / 2 + 2.5
        x0, y0, x1, y1 = m + i, m + i, m + w - i, m + h - i
        parts.append(f'<path fill="none" stroke="{ink}" stroke-width="0.7" stroke-linejoin="round" d="M {x0+r} {y0} L {x1-r} {y0} '
                     f'A {r} {r} 0 0 0 {x1} {y0+r} L {x1} {y1-r} A {r} {r} 0 0 0 {x1-r} {y1} L {x0+r} {y1} '
                     f'A {r} {r} 0 0 0 {x0} {y1-r} L {x0} {y0+r} A {r} {r} 0 0 0 {x0+r} {y0} Z"/>')
        box = (x0 + 4, y0 + 5, x1 - 4, y1 - 5)
    elif border == 'double':
        for inset, sw in ((2.5, 0.7), (4.0, 0.4)):
            parts.append(f'<rect x="{m+inset}" y="{m+inset}" width="{w-2*inset}" height="{h-2*inset}" fill="none" stroke="{ink}" stroke-width="{sw}"/>')
        box = (m + 18, m + 12, m + w - 18, m + h - 12)
    elif border == 'single':
        inset = 3 if h < 80 else 5
        parts.append(f'<rect x="{m+inset}" y="{m+inset}" width="{w-2*inset}" height="{h-2*inset}" fill="none" stroke="{ink}" stroke-width="0.5"/>')
        box = (m + 15, m + 6, m + w - 15, m + h - 6) if h < 80 else (m + 16, m + 12, m + w - 16, m + h - 12)
    else:
        box = (m + 14, m + 12, m + w - 14, m + h - 12)
    if p['fixing'] == 'caps4':
        r = p['cap'] / 2
        parts.append('<g stroke="%s" stroke-width="0.35" fill="url(#cap)">%s</g>' % (
            CAP[p['material']][3], ''.join(f'<circle cx="{x}" cy="{y}" r="{r}"/>' for x, y in holes)))
    elif p['fixing'] == 'screws2':
        for x, y in holes:
            parts.append(f'<circle cx="{x}" cy="{y}" r="2.6" fill="url(#cap)" stroke="{CAP[p["material"]][3]}" stroke-width="0.3"/>'
                         f'<path d="M {x-1.5} {y} L {x+1.5} {y} M {x} {y-1.5} L {x} {y+1.5}" stroke="{CAP[p["material"]][3]}" stroke-width="0.45"/>')
    # Wording: sizes relative to an A5-wide plate; render_coded.cjs scales the block to fit `box` and centres it.
    k = min(w / 210, 1.25) if h >= 80 else 0.62
    words, y, prev, gap = [], 0.0, None, 0.0
    cx = m + w / 2
    for role, text in spec['lines']:
        if role == 'gap':
            gap += 3.5 * k
            continue
        size, weight, spacing = ROLE[role]
        size *= k
        if prev is None:
            y = size * 0.8
        else:
            y += prev[0] * 0.42 + size * 0.95 + (2.2 * k if 'name' in (prev[1], role) and prev[1] != role else 0) + gap
        gap = 0.0
        words.append(f'<text x="{cx}" y="{y:.2f}" font-size="{size:.2f}" font-weight="{weight}" letter-spacing="{spacing*size:.2f}">{esc(text)}</text>')
        prev = (size, role)
    parts.append(f'<g id="words" fill="{ink}">{"".join(words)}</g>')
    svg = f'<svg id="plaque" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W*PX_PER_MM:.0f}" height="{H*PX_PER_MM:.0f}">{"".join(parts)}</svg>'
    html = f'''<!doctype html><html><head><meta charset="utf-8"><style>
@font-face {{ font-family: 'EBG'; font-weight: 400; src: url(fonts/eb-garamond-latin-400-normal.woff2) format('woff2'); }}
@font-face {{ font-family: 'EBG'; font-weight: 600; src: url(fonts/eb-garamond-latin-600-normal.woff2) format('woff2'); }}
html, body {{ margin: 0; background: #fff; }} svg {{ display: block; }}
text {{ font-family: 'EBG'; text-anchor: middle; }}
</style></head><body>{svg}</body></html>'''
    return html, {'id': spec['id'], 'box': box, 'width': round(W * PX_PER_MM), 'height': round(H * PX_PER_MM)}


def main():
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    jobs = []
    for spec in SPECS:
        if spec['design'] != 'coded':
            continue
        html, job = design(spec)
        (out / f"{spec['id']}.html").write_text(html)
        jobs.append(job)
    (out / 'jobs.json').write_text(json.dumps(jobs, indent=1))
    print(len(jobs), 'designs written')


if __name__ == '__main__':
    main()
