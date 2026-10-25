"""The brass and stainless pages' photos (owner msgs 6270, 6281: fewer photos, plain wording), made the way the garden
page's were. Originally: the garden page's photos, redone the way the bench page was (owner msg 6132, 25 Oct 2026: the pages the last search
campaign linked to, "with the same level of care and detail"). The garden page was the campaign's third-busiest ad
landing page.

Wording first, as for the benches (msg 6189: "in loving memory, name dates and for like a quarter of them another
line"): proposed at 10:33 and approved (msg 6229, "They all look fine now so go live"). The garden plaques that are not
memorials (the oval for Grandad's garden, the nurses' dedication and the community garden welcome) keep their natural
form. The stone and tree tiles were signed off with the memorial page and stay.

Each photo comes from a coded layout (garden_scene.py): the wall, fence, shed or gate the plaque is fixed to is drawn
from real measurements (bricks 215 x 65 mm with 10 mm joints, stone courses, boards at their real widths), with the
plaque's designer drawing on it at its true size, seen by a camera square to the surface at the plaque's height. So the
plaque sits level in the frame (msg 6214) and its size against the bricks or boards is fixed: the built-in preview drew
plaques 2-3 times too big against bricks (msg 5959). Plain, ordinary surfaces and soft light (msg 6149), close
(msg 6162), a true 1.5 mm plate and real metal.

Usage: python3 -I garden_scene.py [id ...]  -> guides/<id>.png and guides/<id>.json (the coded layouts)
       python3 -I garden.py prompts r1     -> prompts/<id>-r1.txt and jobs-r1.json
"""
import importlib.util
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
OFFERS = json.load(open(HERE / 'offers.json'))
spec = importlib.util.spec_from_file_location('bench', HERE / 'bench.py')
bench = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bench)
WORDING = {w['slug']: w for w in json.load(open(HERE / 'wording.json'))}

FINISH = dict(bench.FINISH, **{
    'polished-stainless': 'a true mirror that softly reflects its surroundings and the pale sky behind the camera, with the '
                          'lettering crisp on top',
    'polished-brass': 'a bright, mirror-like warm gold that softly reflects its surroundings and the sky behind the camera, '
                      'with the lettering crisp on top',
})
PLAIN = ('It should look like an ordinary, honest photo that someone took of the plaque in a real place on an ordinary '
         'day: a plain, everyday surface and soft, natural light, not a postcard, nothing dramatic.')
GUIDE = ('The attached image is a rough 3D layout render of this exact scene, made by us from measurements. It fixes the '
         'composition. Keep exactly: the camera position and viewing angle, the perspective, the {surface} drawn at '
         'exactly the size, spacing and position shown, and the plaque exactly where it is: flat against the {where}, at '
         'exactly that size, position and angle. The plaque\'s wording, border and caps are drawn on it from our design '
         'artwork: keep that layout exactly, with the same line breaks and letter sizes. The render\'s flat beige and grey '
         'shapes and dark outlines are only placeholders: give the {where} the real materials described below. Do not '
         'copy the render\'s flat colours, flat shading or outlines. The plaque in the render is our flat design artwork '
         'laid onto the model: in the photo it is real, solid metal, as described below, never a flat print.')
THIN = ('Thickness must be true to life. The metal plate is a thin 1.5 mm sheet, about as thick as a coin, with square-cut '
        'edges: no bevel, no raised rim and no frame around its outer edge (the engraved border on its face stays). Its '
        'edge shows at most as a hairline of bright metal along one side, never as a visible slab, step or raised panel. '
        'The plate is fixed straight onto the {where} and sits flat and tight against it, with no gap, no frame and no '
        'backing board, casting only a fine, crisp shadow line along one edge. The caps are thin flat discs like small '
        'coins, barely proud of the plate, never domed or button-shaped.')
THIN_WOOD = ('Thickness must be true to life. The metal plate is a thin 1.5 mm sheet, about as thick as a coin, with '
             'square-cut edges: no bevel, no raised rim and no frame around its outer edge (the engraved border on its '
             'face stays). It sits flat and tight on its wood board, its edge showing at most as a hairline of bright '
             'metal. The board is only 15 mm thick, about the thickness of a finger: only a slim sliver of its bevelled '
             'edge shows, never a deep block. The board is fixed flat against the {where}, casting only a fine, crisp '
             'shadow line along one edge. The caps are thin flat discs like small coins, barely proud of the plate, '
             'never domed or button-shaped.')
ENDING = ('It must look like a real photograph of a real, physical object: real reflections of the surroundings in the '
          'metal, the same light falling on the plate and the {where}, real texture in the {texture}. Not a 3D render, '
          'not an illustration, not a composite, not a pasted-on graphic. Avoid perfectly even lighting on the plate, '
          'plastic-looking metal, domed caps, a plaque that is too big for the {units} around it, a tilted plaque, '
          'exaggerated thickness, oversaturated colours, readable brand names, extra or misspelled text, logos, '
          'watermarks, people or hands.')

# Surfaces for garden_scene.py (mm). 'brick': bricks 215 x 65 with 10 mm joints, stretcher bond or English garden wall
# bond (three stretcher courses, then a course of headers); 'stone': coursed squared stone; 'ashlar': large smooth blocks;
# 'vboards' / 'hboards': vertical or horizontal boards at their visible pitch.
BRICK = dict(kind='brick', bond='stretcher')

PHOTOS = [
    # Opening page: the top photo and three of its picks (the fourth is the brass page's pavilion plaque).
    dict(id='opening-hero', offer='brushed-stainless-297x210-rect-plaque', hero=True, border='none', kind='opening plaque',
         story='The new Meadows Community Hub opened in March. This plaque is fixed to the pale stone cladding beside '
               'its glass entrance doors.',
         surface=dict(kind='ashlar', seed=81, plaque_at=(-40, 1400)),
         guide=dict(size=[1024, 768], lens=70, yaw=-8, frac=0.55),
         wall='new, smooth pale cream limestone cladding in large blocks with fine, neat joints, clean and plain',
         where='stone cladding', texture='limestone', units='stone blocks',
         edges='Only the edge of a dark grey aluminium door frame just shows along the far right edge of the frame, well '
               'clear of the plaque.',
         light='soft, bright daylight'),
    dict(id='brushed-stainless-297x210-rect-light-wood-plaque', offer='brushed-stainless-297x210-rect-light-wood-plaque',
         border='none', kind='room dedication plaque',
         story='A village hall named its new meeting room after Arthur Lee, who looked after the hall for many years. The '
               'plaque, on its light oak board, is fixed to the panelled wall beside the room door.',
         surface=dict(kind='vboards', style='tg', pitch=95, seed=83, plaque_at=(20, 1500)),
         guide=dict(size=[1024, 1024], lens=85, yaw=8, frac=0.78),
         wall='the wall of a village hall clad in vertical tongue-and-groove boards painted a soft sage green, the paint '
              'smooth and a few years old',
         where='panelled wall', texture='painted timber', units='boards',
         edges='The painted boards fill the rest of the frame; nothing covers them.',
         light='soft indoor daylight from a nearby window'),
    dict(id='brushed-brass-300x200-rect-light-wood-plaque', offer='brushed-brass-300x200-rect-light-wood-plaque',
         kind='opening plaque',
         story='A sports club built a new clubhouse. This plaque, on its light oak board, is fixed to the brick wall '
               'under the clubhouse porch, out of the rain.',
         surface=dict(BRICK, seed=85, plaque_at=(0, 1450)),
         guide=dict(size=[1024, 1024], lens=85, yaw=-8, frac=0.78),
         wall='a new wall of warm red-brown bricks in stretcher bond with neat grey mortar joints, clean and sheltered',
         where='brick wall', texture='brick and mortar', units='bricks',
         edges='The brick wall fills the rest of the frame; nothing covers it.',
         light='soft, shaded daylight under the porch roof'),
    dict(id='brushed-stainless-400x300-rect-dark-wood-plaque', offer='brushed-stainless-400x300-rect-dark-wood-plaque',
         kind='opening plaque',
         story='A new doctors\' surgery opened on Mill Lane. This plaque, on its dark walnut board, is fixed to the '
               'brick wall inside the entrance porch.',
         surface=dict(BRICK, seed=87, plaque_at=(-20, 1500)),
         guide=dict(size=[1024, 1024], lens=85, yaw=0, frac=0.78),
         wall='a plain modern wall of pale buff-grey bricks in stretcher bond with neat light grey mortar joints',
         where='brick wall', texture='brick and mortar', units='bricks',
         edges='The brick wall fills the rest of the frame; nothing covers it.',
         light='soft, even daylight in the porch'),
    # Custom page: the top photo and two of its shape tiles (the oval and portrait tiles are already done).
    dict(id='custom-hero', offer='brushed-stainless-250x150-oval-plaque', hero=True, kind='house sign',
         story='The owners of Hawthorn House fixed this oval sign to the brick wall of their cottage, beside the front '
               'door.',
         surface=dict(BRICK, seed=89, plaque_at=(30, 1450)),
         guide=dict(size=[1024, 768], lens=70, yaw=8, frac=0.55),
         wall='the front wall of a cottage in soft, old red bricks in stretcher bond with pale lime mortar, gently '
              'weathered',
         where='brick wall', texture='brick and mortar', units='bricks',
         edges='Only the edge of a sage-green painted door frame just shows along the far left edge of the frame, well '
               'clear of the plaque.',
         light='soft morning daylight'),
    dict(id='brushed-stainless-200x200-circle-plaque', offer='brushed-stainless-200x200-circle-plaque', kind='house sign',
         story='A family converted a Victorian village school into their home and kept its old name. This round sign is '
               'fixed to the stone wall by the old school door.',
         surface=dict(kind='stone', seed=91, plaque_at=(0, 1400)),
         guide=dict(size=[1024, 1024], lens=85, yaw=-8, frac=0.74),
         wall='a Victorian school wall of grey coursed stone with lime mortar, weathered and a little uneven',
         where='stone wall', texture='stone and mortar', units='stones',
         edges='The stone wall fills the rest of the frame; nothing covers it.',
         light='soft overcast daylight'),
    dict(id='orbital-brass-matt-lacquer-400x300-rect-plaque', offer='orbital-brass-matt-lacquer-400x300-rect-plaque',
         border='scalloped', memorial=True, kind='memorial plaque',
         story='George and Mary Fenton made the walled garden behind their farmhouse. Their family fixed this large '
               'plaque to its old stone wall.',
         surface=dict(kind='stone', seed=93, plaque_at=(0, 1500)),
         guide=dict(size=[1024, 1024], lens=85, yaw=8, frac=0.78),
         wall='an old garden wall of honey-coloured coursed stone with lime mortar, weathered, with a few small patches '
              'of lichen',
         where='stone wall', texture='stone and mortar', units='stones',
         edges='Only a few leaves of a climbing rose just enter the frame at one corner, well clear of the plaque.',
         light='soft, warm afternoon daylight'),
]


def plaque(o, border):
    shape = {'oval': 'oval', 'circle': 'round'}.get(o['shape'], 'rectangular')
    fill = ('warm cream paint, as drawn in the layout render (never black)' if o['textColor'] == 'cream'
            else 'black paint')
    caps = (f"two flat round caps {o['capSize']} mm across in the same metal, one at each end on the centre line "
            '(smooth flat discs like small coins: no screw slot, no cross and no screw head showing)'
            if o['fixingHoleCount'] == 2 else
            f"four flat round caps {o['capSize']} mm across in the same metal, one near each corner")
    if o['shape'] == 'circle':
        # Round 1 drew the circle 4-7% narrower than tall (owner check: measure every plate's proportions).
        shape = 'perfectly round (a true circle, exactly as wide as it is tall, never oval)'
    wood = (f" It is mounted on a {'dark walnut' if o['woodTone'] == 'dark' else 'light oak'} backing board "
            f"{o['width'] + 25} x {o['height'] + 25} mm, 12.5 mm larger than the plate on every side, with a small bevel "
            'along its front edge; the board is only 15 mm thick, about the thickness of a finger.') if o['wood'] else ''
    borders = {'double': 'a double engraved border line near the edge', 'single': 'a single engraved border line',
               'scalloped': 'one engraved border line with scalloped corners that curve inward around each corner cap',
               'double-scalloped': 'a double engraved border line with scalloped corners that curve inward around each '
                                   'corner cap',
               'none': 'no border'}
    return (f"a real {shape} plaque of {bench.MATERIAL[o['material']]}, {o['width']} x {o['height']} mm, with "
            f"{borders[border]}, held by {caps}. The lettering and border are engraved and filled with {fill}: crisp, "
            'very slightly recessed, with tiny bright edges where the light catches the cut metal.' + wood)


def scale(p, o, info):
    """The plaque's size against the surface's own units, from the coded layout."""
    w, h = o['width'] + (25 if o['wood'] else 0), o['height'] + (25 if o['wood'] else 0)
    s = p['surface']
    paper = {(210, 148): ', the size of a sheet of A5 paper', (148, 210): ', the size of a sheet of A5 paper',
             (210, 297): ', the size of a sheet of A4 paper'}.get((w, h), '')
    head = (f"The plate is {o['width']} x {o['height']} mm on a board {w} x {h} mm. " if o['wood']
            else f'The plaque is {w} x {h} mm{paper}. ')
    if s['kind'] == 'brick':
        return (head + f"The bricks are ordinary UK bricks, 215 x 65 mm with 10 mm joints, so the plaque is about "
                f"{w / 225:.1f} bricks long and {h / 75:.1f} courses tall, exactly as in the layout render. Never make "
                'the bricks bigger or smaller than that against the plaque.')
    if s['kind'] == 'vboards':
        return head + (f"Each board shows {s['pitch']} mm wide, so the plaque spans about {w / s['pitch']:.1f} boards, "
                       'exactly as in the layout render.')
    if s['kind'] == 'hboards':
        return head + (f"Each board is {s['pitch']} mm tall, so the plaque spans about {h / s['pitch']:.1f} boards, "
                       'exactly as in the layout render.')
    if s['kind'] == 'ashlar':
        return head + (f'The stone blocks are 450 x 225 mm, so the plaque is about {w / 450:.1f} of a block long and '
                       f'{h / 225:.1f} of a block tall, exactly as in the layout render.')
    return head + ('The stones are 190-430 mm long in courses 95-165 mm tall, so the plaque covers only a few stones, '
                   'exactly as in the layout render.')


def prompts(round_tag='r1'):
    out = HERE / 'prompts'
    out.mkdir(exist_ok=True)
    jobs = []
    for p in PHOTOS:
        o = OFFERS[p['offer']]
        border = p.get('border') or ('none' if not WORDING[p['id']]['overrides'].get('border', True)
                                     else WORDING[p['id']]['overrides'].get('borderStyle', o['borderStyle']))
        info = json.loads((HERE / 'guides' / f"{p['id']}.json").read_text())
        g = p['guide']
        wide = g['size'][0] > g['size'][1]
        head = ('Output: one landscape 4:3 photograph.' if wide
                else 'Output: one SQUARE 1:1 photograph (equal width and height).')
        kind = p.get('kind') or ('memorial garden plaque' if p.get('memorial') else 'garden plaque')
        what = (f"A real, unretouched photograph of a {kind} in place, for "
                + ("a UK plaque maker's website." if wide else "its product page on a UK plaque maker's website."))
        where = ('straight in front of the plaque, square-on to it' if g['yaw'] == 0 else
                 f"a little to the {'left' if g['yaw'] < 0 else 'right'} of the plaque, at a gentle angle of about "
                 f"{abs(g['yaw'])} degrees")
        camera = (f"exactly as in the layout render: close to the {p['where']}, {where}, with the camera level and at "
                  f"the same height as the plaque; {g['lens']} mm lens, about {round(info['camera_distance_mm'] / 10)} cm "
                  f"from the plaque. The plaque fills about {round(info['plaque_width_frac'] * 100)}% of the width of "
                  'the photo. The plaque sits perfectly level in the photo: its top and bottom edges run straight '
                  'across the frame, never tilted or sloping' + ('' if g['yaw'] == 0 else
                                                                 ', and only narrow slightly towards the far end')
                  + f". The whole plaque is sharp and every line of the wording is readable; the {p['where']} around "
                  'it is in focus too, softening only slightly towards the edges of the frame.')
        parts = [head, f"{what} {p['story']} {bench.REAL_LOOK} {PLAIN}",
                 GUIDE.format(surface=p['units'], where=p['where']),
                 'The surface: ' + p['wall'] + '.',
                 'The plaque: ' + plaque(o, border), bench.METAL.format(finish=FINISH[o['material']]),
                 (THIN_WOOD if o['wood'] else THIN).format(where=p['where']),
                 'The wording, exactly as in the artwork, and nothing else legible anywhere in the photo:\n'
                 + bench.lines_text(WORDING[p['id']]['lines']),
                 'Around it: ' + p['edges'],
                 'Light: ' + p['light'] + '.',
                 'Camera: ' + camera, 'Scale: ' + scale(p, o, info),
                 ENDING.format(where=p['where'], texture=p['texture'], units=p['units'])]
        jid = p['id'] + '-' + round_tag
        (out / f'{jid}.txt').write_text('\n\n'.join(parts))
        jobs.append({'id': jid, 'ref': str(HERE / 'guides' / f"{p['id']}.png"),
                     'size': '1536x1152' if wide else '2048x2048', 'versions': 2})
    (HERE / f'jobs-{round_tag}.json').write_text(json.dumps(jobs, indent=1))
    print(len(jobs), 'jobs,', sum(j['versions'] for j in jobs), 'images')


if __name__ == '__main__':
    {'prompts': prompts}[sys.argv[1]](*sys.argv[2:])
