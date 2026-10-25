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
    # Brass page: the top photo and its four finish tiles (brushed, polished, orbital, aged).
    dict(id='brass-hero', offer='brushed-brass-210x148-rect-plaque', hero=True, border='scalloped', memorial=True,
         kind='memorial plaque',
         story='Elsie Bond lived in the same stone cottage for sixty years. Her family fixed this plaque to the cottage '
               'wall beside her front garden.',
         surface=dict(kind='stone', seed=41, plaque_at=(20, 1350)),
         guide=dict(size=[1024, 768], lens=70, yaw=8, frac=0.55),
         wall='an old cottage wall of honey-coloured Cotswold stone, laid in rough courses of squared blocks with lime '
              'mortar, weathered and a little uneven, with a few small patches of lichen',
         where='stone wall', texture='stone and mortar', units='stones',
         edges='Only a few leaves of a climbing honeysuckle just enter the frame at the top right corner, well clear of '
               'the plaque; nothing else covers the wall.',
         light='soft, warm afternoon daylight'),
    dict(id='brushed-brass-297x210-rect-dark-wood-plaque', offer='brushed-brass-297x210-rect-dark-wood-plaque',
         border='scalloped', memorial=True, kind='memorial plaque',
         story='Frank and Joan Hollis lived in the same house and tended its garden for fifty years. Their children '
               'fixed this plaque, on its dark walnut board, to the old brick wall at the end of the garden.',
         surface=dict(BRICK, seed=43, plaque_at=(10, 1350)),
         guide=dict(size=[1024, 1024], lens=85, yaw=-8, frac=0.78),
         wall='an old garden wall of soft orange-red bricks in stretcher bond with pale lime mortar, gently weathered',
         where='brick wall', texture='brick and mortar', units='bricks',
         edges='The brick wall fills the rest of the frame; nothing covers it.',
         light='soft, bright daylight under high cloud'),
    dict(id='polished-brass-200x150-rect-plaque', offer='polished-brass-200x150-rect-plaque', kind='house sign',
         story='The owners of Holly House fixed this sign to the front wall of their house, beside the front door.',
         surface=dict(BRICK, seed=47, plaque_at=(0, 1450)),
         guide=dict(size=[1024, 1024], lens=85, yaw=8, frac=0.78),
         wall='the front wall of a Victorian house in bricks painted white, the paint a few years old and slightly '
              'chalky, with every brick and mortar joint clearly visible under the paint',
         where='painted brick wall', texture='painted brick', units='bricks',
         edges='Only the edge of a dark green painted door frame just shows along the far right edge of the frame, well '
               'clear of the plaque.',
         light='soft daylight'),
    dict(id='orbital-brass-matt-lacquer-297x210-rect-plaque', offer='orbital-brass-matt-lacquer-297x210-rect-plaque',
         kind='opening plaque',
         story='A village cricket club built a new timber pavilion. This plaque by its door records its opening by Jean '
               'Harper, the club president.',
         surface=dict(kind='hboards', style='shiplap', pitch=150, seed=53, plaque_at=(0, 1500)),
         guide=dict(size=[1024, 1024], lens=85, yaw=-8, frac=0.78),
         wall='the front wall of a new cricket pavilion clad in horizontal cedar shiplap boards with a clear finish, '
              'still warm honey-brown, with real grain and a few small knots',
         where='pavilion boards', texture='cedar grain', units='boards',
         edges='The cedar boards fill the rest of the frame; nothing covers them.',
         light='bright, soft daylight'),
    dict(id='aged-brass-210x148-rect-plaque', offer='aged-brass-210x148-rect-plaque', memorial=True,
         kind='memorial plaque',
         story='James Ormerod walked past this old wall every morning for forty years. His family fixed this plaque to '
               'it.',
         surface=dict(kind='ashlar', seed=59, plaque_at=(-60, 1180)),
         guide=dict(size=[1024, 1024], lens=85, yaw=0, frac=0.78),
         wall='a wall of large, smooth grey limestone blocks with fine joints, weathered and plain, with a few small '
              'spots of lichen',
         where='limestone wall', texture='limestone', units='stone blocks',
         edges='The limestone fills the rest of the frame; nothing covers it.',
         light='soft overcast daylight'),
    # Stainless page: the top photo and three of its finish tiles (the dark wood tile keeps Margaret Rowley's photo).
    dict(id='stainless-hero', offer='a5-brushed-steel-personalised-plaque', hero=True, border='none', kind='house sign',
         story='A family turned an old farm dairy into their home and fixed this sign beside the front door.',
         surface=dict(kind='hboards', style='gap', pitch=150, gap=10, seed=61, plaque_at=(0, 1500)),
         guide=dict(size=[1024, 768], lens=70, yaw=-8, frac=0.55),
         wall='horizontal timber cladding boards stained a deep matt black, with narrow shadow gaps between them and the '
              'wood grain showing through the stain',
         where='cladding boards', texture='stained timber', units='boards',
         edges='Only the edge of a plain oak door frame just shows along the far left edge of the frame, well clear of '
               'the plaque.',
         light='soft daylight'),
    dict(id='brushed-stainless-250x150-oval-plaque', offer='brushed-stainless-250x150-oval-plaque', memorial=True,
         kind='memorial plaque',
         story="Lilian Boyd's family fixed this plaque to the old brick wall of the garden she loved.",
         surface=dict(kind='brick', bond='garden', seed=67, plaque_at=(30, 1300)),
         guide=dict(size=[1024, 1024], lens=85, yaw=8, frac=0.78),
         wall='an old garden wall of soft red handmade bricks in English garden wall bond (three courses of long bricks, '
              'then one course of short brick ends), with pale lime mortar, gently weathered',
         where='brick wall', texture='brick and mortar', units='bricks',
         edges='Only a few small ivy leaves just enter the frame at one corner, well clear of the plaque.',
         light='soft, bright daylight'),
    dict(id='polished-stainless-297x210-rect-plaque', offer='polished-stainless-297x210-rect-plaque', memorial=True,
         kind='memorial plaque',
         story="Peter and June Walker's family fixed this plaque to the stone wall of the small garden behind their "
               'village hall, where the couple sat on summer evenings.',
         surface=dict(kind='stone', seed=71, plaque_at=(0, 1400)),
         guide=dict(size=[1024, 1024], lens=85, yaw=0, frac=0.78),
         wall='a garden wall of pale grey-buff coursed stone with lime mortar, weathered and a little uneven',
         where='stone wall', texture='stone and mortar', units='stones',
         edges='The stone wall fills the rest of the frame; nothing covers it.',
         light='soft daylight under high cloud'),
    dict(id='polished-stainless-200x150-rect-light-wood-plaque', offer='polished-stainless-200x150-rect-light-wood-plaque',
         memorial=True, kind='pet memorial plaque',
         story='Skye the collie spent every day in the back garden. Her family fixed this plaque, on its light oak board, '
               'to the garden shed beside her favourite spot.',
         surface=dict(kind='hboards', style='shiplap', pitch=120, seed=73, plaque_at=(0, 1480)),
         guide=dict(size=[1024, 1024], lens=85, yaw=8, frac=0.78),
         wall='the side wall of a garden shed: horizontal shiplap boards painted a soft blue-grey, the paint a few years '
              'old, with the wood grain showing through and a little wear',
         where='shed boards', texture='painted timber', units='shed boards',
         edges='The painted boards fill the rest of the frame; nothing covers them.',
         light='soft morning light'),
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
