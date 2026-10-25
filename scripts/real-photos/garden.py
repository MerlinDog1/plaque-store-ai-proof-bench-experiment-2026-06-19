"""The garden page's photos, redone the way the bench page was (owner msg 6132, 25 Oct 2026: the pages the last search
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
    'polished-stainless': 'a true mirror that softly reflects the garden and the pale sky behind the camera, with the '
                          'lettering crisp on top',
    'polished-brass': 'a bright, mirror-like warm gold that softly reflects the garden and the sky behind the camera, '
                      'with the lettering crisp on top',
})
PLAIN = ('It should look like an ordinary, honest photo that someone took of the plaque in a real garden on an ordinary '
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
    dict(id='garden-hero', offer='a5-brushed-steel-personalised-plaque', hero=True, border='scalloped',
         memorial=True,
         story='Susan Marsh made the cottage garden behind her house over forty years and grew roses up its old brick '
               'wall. Her family fixed this plaque to that wall, by the bench where she liked to sit.',
         surface=dict(BRICK, seed=3, plaque_at=(40, 1210)),
         guide=dict(size=[1024, 768], lens=70, yaw=-8, frac=0.55),
         wall='an old garden wall of soft red bricks in stretcher bond, gently uneven in colour, with pale lime mortar '
              'joints and a few small spots of lichen; plain and ordinary',
         where='brick wall', texture='brick and mortar', units='bricks',
         edges='Only a few leaves and one stem of her climbing rose just enter the frame at the far left edge, well clear '
               'of the plaque; nothing else covers the wall.',
         light='soft afternoon daylight with gentle shade from the garden\'s trees'),
    dict(id='route-garden-fence', offer='orbital-brass-matt-lacquer-200x150-rect-plaque', tile=True, memorial=True,
         story='Biscuit the cat spent every sunny afternoon asleep on top of the garden fence. Her family fixed this '
               'plaque to the fence just below her favourite spot.',
         surface=dict(kind='vboards', style='featheredge', pitch=80, seed=5, plaque_at=(30, 1300)),
         guide=dict(size=[1024, 768], lens=85, yaw=10, frac=0.62),
         wall='a closeboard garden fence of vertical featheredge boards, each overlapping the next, in pressure-treated '
              'timber weathered to a soft honey-grey, with real grain, a few fine cracks and slightly uneven edges',
         where='fence boards', texture='timber grain', units='fence boards',
         edges='Only the tips of a lavender plant just show along the very bottom edge of the frame, well below the '
               'plaque; nothing else covers the fence.',
         light='warm, soft afternoon sunlight with a little dappled shade'),
    dict(id='brushed-stainless-148x210-rect-plaque', offer='brushed-stainless-148x210-rect-plaque', memorial=True,
         story='Annie Fletcher grew roses in her small walled garden all her life. Her children fixed this plaque to the '
               'old stone wall above her rose bed.',
         surface=dict(kind='stone', seed=11, plaque_at=(0, 1350)),
         guide=dict(size=[1024, 1024], lens=85, yaw=0, frac=0.78),
         wall='a garden wall of honey-coloured Cotswold stone, laid in rough courses of squared blocks with lime mortar, '
              'weathered and a little uneven, with a few small patches of lichen',
         where='stone wall', texture='stone and mortar', units='stones',
         edges='The stone wall fills the rest of the frame; nothing covers it.',
         light='soft, bright overcast daylight'),
    dict(id='aged-brass-250x150-oval-plaque', offer='aged-brass-250x150-oval-plaque',
         story='When their grandad gave up his allotment, his grandchildren helped him make a vegetable patch at home and '
               'gave him this plaque for his garden shed.',
         surface=dict(kind='hboards', style='shiplap', pitch=120, seed=7, plaque_at=(0, 1480)),
         guide=dict(size=[1024, 1024], lens=85, yaw=-10, frac=0.78),
         wall='the side wall of his garden shed: horizontal shiplap boards painted a soft sage green, the paint a few '
              'years old, with the wood grain showing through and a little wear',
         where='shed boards', texture='painted timber', units='shed boards',
         edges='The painted boards fill the rest of the frame; nothing covers them.',
         light='soft morning light'),
    dict(id='orbital-brass-matt-lacquer-210x297-rect-plaque', offer='orbital-brass-matt-lacquer-210x297-rect-plaque',
         memorial=True,
         story='Rosemary Ashcroft painted and gardened at the same cottage for fifty years. Her family fixed this plaque '
               'to the white-painted brick wall by her back door, where her pots of herbs still stand.',
         surface=dict(BRICK, seed=13, plaque_at=(-30, 1290)),
         guide=dict(size=[1024, 1024], lens=85, yaw=8, frac=0.78),
         wall='a cottage wall of old bricks in stretcher bond painted white, the paint slightly chalky and worn at the '
              'brick edges, with every brick and mortar joint clearly visible under the paint',
         where='painted brick wall', texture='painted brick', units='bricks',
         edges='The painted brick fills the rest of the frame; nothing covers it.',
         light='soft, warm late-morning light'),
    dict(id='polished-brass-400x300-rect-plaque', offer='polished-brass-400x300-rect-plaque', border='double-scalloped',
         memorial=True,
         story='Major Hugh Carrington left the walled garden of his house to the village. The parish council fixed this '
               'plaque to the old garden wall beside its gate.',
         surface=dict(kind='brick', bond='garden', seed=17, plaque_at=(60, 1400)),
         guide=dict(size=[1024, 1024], lens=85, yaw=0, frac=0.78),
         wall='a tall old garden wall of soft orange-red handmade bricks in English garden wall bond (three courses of '
              'long bricks, then one course of short brick ends), with pale lime mortar, gently weathered',
         where='brick wall', texture='brick and mortar', units='bricks',
         edges='Only a few small leaves of ivy just enter the frame at one corner, well clear of the plaque.',
         light='soft, bright daylight under high cloud'),
    dict(id='polished-stainless-210x148-rect-plaque', offer='polished-stainless-210x148-rect-plaque', memorial=True,
         story="Elizabeth Ward's garden was her joy. Her husband fixed this plaque to the sandstone wall of the terrace "
               'where she sat every evening.',
         surface=dict(kind='ashlar', seed=19, plaque_at=(-60, 1180)),
         guide=dict(size=[1024, 1024], lens=85, yaw=10, frac=0.78),
         wall='a smooth terrace wall of large, pale buff sandstone blocks with fine joints, clean and plain',
         where='sandstone wall', texture='sandstone', units='stone blocks',
         edges='The sandstone fills the rest of the frame; nothing covers it.',
         light='soft, warm evening light'),
    dict(id='brushed-brass-200x200-circle-plaque', offer='brushed-brass-200x200-circle-plaque', memorial=True,
         story='May Atherton walked through her garden gate every day for sixty years. Her grandchildren fixed this '
               'plaque to it.',
         surface=dict(kind='vboards', style='tg', pitch=95, seed=23, plaque_at=(20, 1150)),
         guide=dict(size=[1024, 1024], lens=85, yaw=8, frac=0.74),
         wall='an old timber garden gate of vertical tongue-and-groove boards, painted a soft blue-grey, the paint a few '
              'years old with a little wear',
         where='gate boards', texture='painted timber', units='gate boards',
         edges='The painted gate boards fill the rest of the frame; nothing covers them.',
         light='soft daylight'),
    dict(id='orbital-brass-matt-lacquer-300x200-rect-plaque', offer='orbital-brass-matt-lacquer-300x200-rect-plaque',
         story="The nurses of Slad Valley Hospital made a small garden for patients and staff. The hospital fixed this "
               "plaque to the garden's wall to thank them.",
         surface=dict(BRICK, seed=29, plaque_at=(-20, 1420)),
         guide=dict(size=[1024, 1024], lens=85, yaw=-8, frac=0.78),
         wall='a plain modern wall of pale buff bricks in stretcher bond with neat grey mortar joints',
         where='brick wall', texture='brick and mortar', units='bricks',
         edges='The brick wall fills the rest of the frame; nothing covers it.',
         light='soft, bright daylight'),
    dict(id='polished-stainless-400x300-rect-plaque', offer='polished-stainless-400x300-rect-plaque',
         story='Volunteers turned a patch of waste ground into Brambledown Community Garden. This plaque welcomes '
               "visitors on the wall of the garden's tool store by the entrance.",
         surface=dict(kind='hboards', style='gap', pitch=150, gap=10, seed=31, plaque_at=(0, 1500)),
         guide=dict(size=[1024, 1024], lens=85, yaw=8, frac=0.78),
         wall='the wall of a newer timber tool store clad in horizontal larch boards with narrow shadow gaps between '
              'them, still honey-coloured, with real grain and a few small knots',
         where='larch boards', texture='timber grain', units='boards',
         edges='The larch boards fill the rest of the frame; nothing covers them.',
         light='bright, soft daylight'),
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
    borders = {'double': 'a double engraved border line near the edge', 'single': 'a single engraved border line',
               'scalloped': 'one engraved border line with scalloped corners that curve inward around each corner cap',
               'double-scalloped': 'a double engraved border line with scalloped corners that curve inward around each '
                                   'corner cap',
               'none': 'no border'}
    return (f"a real {shape} garden plaque of {bench.MATERIAL[o['material']]}, {o['width']} x {o['height']} mm, with "
            f"{borders[border]}, held by {caps}. The lettering and border are engraved and filled with {fill}: crisp, "
            'very slightly recessed, with tiny bright edges where the light catches the cut metal.')


def scale(p, o, info):
    """The plaque's size against the surface's own units, from the coded layout."""
    w, h = o['width'], o['height']
    s = p['surface']
    paper = {(210, 148): ', the size of a sheet of A5 paper', (148, 210): ', the size of a sheet of A5 paper',
             (210, 297): ', the size of a sheet of A4 paper'}.get((w, h), '')
    head = f'The plaque is {w} x {h} mm{paper}. '
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
        return head + ('The sandstone blocks are 450 x 225 mm, so the plaque is about half a block long and two thirds '
                       'of a block tall, exactly as in the layout render.')
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
        kind = 'memorial garden plaque' if p.get('memorial') else 'garden plaque'
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
                 THIN.format(where=p['where']),
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
