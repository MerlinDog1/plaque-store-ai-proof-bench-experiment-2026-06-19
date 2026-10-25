"""The tree page's photos (owner msgs 6270, 6281, 6313): A5 plates on light oak boards, each on one black steel ground
stake at the foot of its tree, in the plain wording. Made the way the memorial page's signed-off tree tile was (a
tight close-up from the plaque's own designer artwork used as a layout guide), plus the rules learnt since: level,
true 1.5 mm plate and 15 mm board, flat caps, real metal, plain everyday settings.
Usage: python3 -I tree.py refs      -> refs/<id>.png (the metal stencils, at most 1024 px; aged brass in cream)
       python3 -I tree.py prompts   -> prompts/<id>-r1.txt and jobs-tree-r1.json
"""
import importlib.util
import json
import sys
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
OFFERS = json.load(open(HERE / 'offers.json'))
WORDING = {w['slug']: w for w in json.load(open(HERE / 'wording.json'))}
spec = importlib.util.spec_from_file_location('garden', HERE / 'garden.py')
garden = importlib.util.module_from_spec(spec)
spec.loader.exec_module(garden)
bench = garden.bench

TREES = [
    dict(id='tree-cherry', hero=True,
         story='Jim Partridge loved his garden. His family planted a flowering cherry where he used to sit with his tea, '
               'and the plaque stands at its foot on its own oak board and stake.',
         setting='It stands in fresh bark mulch at the foot of a young flowering cherry tree in a back garden: the '
                 'slim trunk, about 4 cm thick, with a black rubber tree tie and a wooden support stake, rises just '
                 'behind the board on its right, and a few sprigs of pale pink blossom reach into the top of the frame. '
                 'A plain lawn is softly blurred behind.',
         light='Soft, bright spring morning light.', tree='the cherry trunk is about 4 cm thick'),
    dict(id='tree-apple',
         story="Pauline Hargreaves's family planted an apple tree in her back garden, where she grew her vegetables. "
               'The plaque stands at its foot on its own oak board and stake.',
         setting='It stands in the grass at the foot of a young apple tree in a back garden: the slim trunk, about 5 cm '
                 'thick, with a tree tie and a support stake, rises just behind the board on its left, and a few small '
                 'green apples hang at the top edge of the frame. A plain lawn is softly blurred behind.',
         light='Soft late-summer afternoon light.', tree='the apple trunk is about 5 cm thick'),
    dict(id='tree-oak',
         story='Kathleen Ellis walked across the village green every day. Her family planted a young oak there, and the '
               'plaque stands at its foot on its own oak board and stake.',
         setting='It stands in the grass of a village green at the foot of a young oak tree: the slim trunk, about 6 cm '
                 'thick, inside a simple wooden tree guard, rises just behind the board on its right, and a few oak '
                 'leaves just turning golden reach into the top of the frame. The grass is softly blurred behind.',
         light='Soft autumn daylight.', tree='the oak trunk is about 6 cm thick'),
    dict(id='tree-school',
         story='The children of Ashfield Primary School planted a tree on the edge of their school field in memory of a '
               'much-loved teacher. The plaque stands at its foot on its own oak board and stake.',
         setting='It stands in the grass at the edge of a school field at the foot of a newly planted young tree: a '
                 'slim trunk about 3 cm thick, with a support stake and a tie, rises just behind the board on its left. '
                 'A plain wooden fence is softly blurred far behind.',
         light='Bright, soft daylight.', tree='the young trunk is about 3 cm thick'),
    dict(id='tree-birch',
         story='Moss the collie spent every day in the back garden. Her family planted a silver birch by her favourite '
               'spot, and the plaque stands at its foot on its own oak board and stake.',
         setting='It stands in bark mulch in a back garden at the foot of a young silver birch: its slim white trunk, '
                 'about 5 cm thick, rises just behind the board on its right. A plain lawn is softly blurred behind.',
         light='Soft morning light.', tree='the birch trunk is about 5 cm thick'),
]

BORDERS = {'double': 'a double engraved border line near the edge', 'single': 'a single engraved border line',
           'scalloped': 'one engraved border line with scalloped corners that curve inward around each corner cap',
           'double-scalloped': 'a double engraved border line with scalloped corners that curve inward around each '
                               'corner cap',
           'none': 'no border'}


def border_of(w, o):
    ov = w['overrides']
    if ov.get('border') is False:
        return 'none'
    return ov.get('borderStyle', o['borderStyle'])


def refs():
    (HERE / 'refs').mkdir(exist_ok=True)
    for t in TREES:
        o = OFFERS[WORDING[t['id']]['offer']]
        im = Image.open(HERE / 'metal' / f"{t['id']}.png").convert('RGBA')
        bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
        bg.alpha_composite(im)
        im = bg.convert('RGB')
        if o['textColor'] == 'cream':
            px = im.load()
            for y in range(im.height):
                for x in range(im.width):
                    if max(px[x, y]) < 40:
                        px[x, y] = (236, 224, 192)
        im.thumbnail((1024, 1024), Image.LANCZOS)
        im.save(HERE / 'refs' / f"{t['id']}.png")
        print('ref', t['id'], im.size)


def prompts():
    jobs = []
    for t in TREES:
        w = WORDING[t['id']]
        o = OFFERS[w['offer']]
        wide = '4:3' if t.get('hero') else '3:2'
        frac = 58 if t.get('hero') else 78
        dist = 70 if t.get('hero') else 45
        fill = ('warm cream paint (never black)' if o['textColor'] == 'cream' else 'black paint')
        parts = [
            f'Output: one landscape {wide} photograph.',
            "A real, unretouched photograph of a memorial tree plaque in place, for a UK plaque maker's website. "
            + t['story'] + ' ' + bench.REAL_LOOK + ' It should look like an ordinary, honest photo taken on an '
            'ordinary day: soft natural light, not a postcard, nothing dramatic.',
            'The attached image is our flat design artwork of this exact plaque on its oak board, seen straight on. It '
            'is a layout guide, not a photo and not a picture to paste in. Make the real plaque match it exactly in '
            'layout: the same wording with the same line breaks, the same letter shapes and relative sizes, the same '
            'spacing, the same position of the text on the plate, the same border, the same fixing positions and the '
            "same even margin of wood around the plate. Do not copy the artwork's flat colours, outlines, even "
            'lighting or straight-on view: the photo shows the real materials, in real light, from the camera '
            'position described below.',
            f"The plaque: a real rectangular plate of {bench.MATERIAL[o['material']]}, 210 x 148 mm, with "
            f"{BORDERS[border_of(w, o)]}, held by four flat round caps 10 mm across in the same metal, one in each "
            f'corner: thin flat discs like small coins, not domed. The lettering and border are engraved and filled '
            f'with {fill}: crisp, very slightly recessed, with tiny bright edges where the light catches the cut metal. '
            'The plate is mounted on a solid light oak backing board 235 x 173 mm, with a neatly bevelled front edge '
            'and real wood grain, showing an even margin of wood about 12 mm wide all round the plate.',
            bench.METAL.format(finish=garden.FINISH[o['material']]),
            'The wording, exactly as in the artwork, and nothing else written anywhere in the photo:\n'
            + bench.lines_text(w['lines']),
            'Where it is: the plaque on its light oak board is held upright by ONE chunky black powder-coated steel '
            'ground stake, a solid square bar about 30 mm thick, fixed by a bracket to the middle of the back of the '
            'board and pushed straight down into the ground. Nothing else holds it. ' + t['setting'] + ' ' + t['light'],
            f'Camera: a close-up, about {dist} cm from the plaque at the height of the board, 85 mm lens, almost straight '
            f'on, with the camera level. The board fills about {frac}% of the frame width; only the top of the black '
            'stake shows below it and only a little of the tree shows at the edges, softly blurred. As little '
            'background as possible. The board stands perfectly upright and level: its top and bottom edges run '
            'straight across the photo, never tilted or sloping. Every line of the wording is sharp and readable.',
            'Thickness must be true to life. The metal plate is a thin 1.5 mm sheet, about as thick as a coin: its '
            'edge shows only as a fine bright line, never as a visible slab, step or raised panel. The solid light oak '
            'board is only 15 mm thick, about the thickness of a finger, with a small bevelled front edge: only a slim '
            'sliver of its edge shows, never a deep block of wood. The caps are thin discs only 2-3 mm proud of the '
            'plate.',
            'Scale: the oak board is only 235 x 173 mm, the size of a hardback book; ' + t['tree'] + '. Keep it true '
            'to that size.',
            'It must look like a real photograph of a real object in a real place: not a 3D render, not an '
            'illustration, not a composite, not a pasted-on graphic. Avoid perfectly even lighting on the plate, '
            'plastic-looking metal or wood, domed or button-shaped caps, a tilted board, exaggerated thickness, '
            'oversaturated colours, readable brand names, extra or misspelled text, logos, watermarks, people or hands.',
        ]
        jid = t['id'] + '-r1'
        (HERE / 'prompts' / f'{jid}.txt').write_text('\n\n'.join(parts))
        jobs.append({'id': jid, 'ref': str(HERE / 'refs' / f"{t['id']}.png"),
                     'size': '1536x1152' if t.get('hero') else '1536x1024', 'versions': 2})
    (HERE / 'jobs-tree-r1.json').write_text(json.dumps(jobs, indent=1))
    print(len(jobs), 'jobs')


if __name__ == '__main__':
    {'refs': refs, 'prompts': prompts}[sys.argv[1]]()
