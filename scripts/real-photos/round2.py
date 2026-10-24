"""Round 2 of the memorial page photos (owner msg 6085, 24 Oct 2026, 22:25 UTC):
"Not all the portrait plaques on that page have to be tree stake ones. Also for the tree stake ones make sure the plaque
still looks real and keep real close to them and show less background. Some of these the thickness is very exaggerated
and I don't see any scalloped borders or wip Pics?"

- Thickness: every prompt now states the real 1.5 mm plate and 15 mm board, and forbids slabs and blocks.
- Wall memorial plaques are shown on wood with the scalloped border (owner msg 6001): the page's picks move to
  wood-backed products with scalloped borders.
- WIP pictures: Margaret's plaque (the top photo's product) and Ivor Pugh's on the workshop bench; Bramble's portrait too.
- Portraits: two tight close-ups on stakes, one on a wall, one in the workshop.

Usage: python3 -I round2.py designer   -> designer-wording-r2.json (stencils for the products whose wording/border change)
       python3 -I round2.py prompts    -> prompts/<id>.txt and jobs-r2.json
"""
import json
import sys
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
PIM = Path('/home/coding-agent/workspace/output/instaplaque-tree-portraits-pim')
OFFERS = json.load(open(HERE / 'offers.json'))

MATERIAL = {
    'brushed-stainless': 'brushed stainless steel: silver-grey with a fine horizontal brushed grain and soft satin reflections, never gold and never a chrome mirror',
    'polished-stainless': 'mirror-polished stainless steel: bright silver that reflects its surroundings in soft, believable bands, with no brush grain',
    'brushed-brass': 'brushed brass: warm satin gold with a fine horizontal brushed grain and low glare',
    'polished-brass': 'polished brass: bright, mirror-like warm gold that reflects its surroundings',
    'aged-brass': 'mid aged brass: warm brown-gold with an even, intentional factory patina, smooth, clean and low-glare',
}
REAL_LOOK = ('Shot on a full-frame camera, natural light, true-to-life colours, a little natural grain, no filters, no HDR, '
             'no retouching.')
THIN = ('Thickness must be true to life. The metal plate is a thin 1.5 mm sheet, about as thick as a coin: at this angle '
        'its edge shows only as a fine bright line, never as a visible slab, step or raised panel. {board}The flat round '
        'caps are thin discs only 2-3 mm proud of the plate.')
BOARD = ('The solid {tone} backing board is only 15 mm thick, about the thickness of a finger, with a small bevelled front '
         'edge: at this angle only a slim sliver of its edge shows, never a deep block of wood. ')
LAYOUT = ('The attached image is our flat design artwork of this exact plaque, seen straight on. It is a layout guide, not a '
          'photo and not a picture to paste in. Make the real plaque match it exactly in layout: the same wording with the '
          'same line breaks, the same letter shapes and relative sizes, the same spacing, the same position of the text on '
          'the plate, the same border and the same fixing positions{wood}. Do not copy the artwork\'s flat colours, '
          'outlines, even lighting or straight-on view: the photo shows the real materials, in real light, from the camera '
          'position described below.')
ENDING = ('It must look like a real photograph of a real, physical object: real reflections of the surroundings in the '
          'metal, light falling on the plate, the board and the setting in exactly the same way, real texture in the wood '
          'grain and the setting. Not a 3D render, not an illustration, not a composite, not a pasted-on graphic. Avoid '
          'perfectly even lighting on the plate, plastic-looking metal or wood, domed or button-shaped caps, exaggerated '
          'thickness, oversaturated colours, readable brand names, extra or misspelled text, logos, watermarks, people or hands.')
WORKSHOP = ('Behind the plaque our small UK workshop melts into a soft, creamy bokeh: a folded pale grey polishing cloth and '
            'a crumpled white cotton rag just behind one side, a round tin of metal polish far too blurred for any label to '
            'be read, and further back shelving with metal sheets and wooden boards, a bright window and small round '
            'out-of-focus highlights from the workshop lights. Soft daylight from a large window on the left gives the metal '
            'a gentle highlight along one edge and a soft, real shadow on the bench. The white workbench is clean and tidy, '
            'with only the faint marks of daily use.')


def lines_text(lines):
    return '\n'.join(f'"{t}"' for r, t in lines if r != 'gap')


def plaque(material, w, h, shape, wood, fixing, border, text):
    shape_word = {'oval': 'oval', 'circle': 'round'}.get(shape, 'rectangular')
    fill = ('warm cream paint (the artwork draws the lettering and border in black only for contrast: on the real '
            'plaque they are warm cream, never black)') if text == 'cream' else 'black paint'
    caps = {'caps4': 'four flat round caps in the same metal, one in each corner',
            'caps2': 'two flat round caps in the same metal, one at each end on the centre line',
            'screws2': 'two small domed cross-head screws in the same metal, one at each end on the centre line'}[fixing]
    borders = {'double': 'a double engraved border line near the edge', 'single': 'a single engraved border line',
               'scalloped': 'one engraved border line with scalloped corners that curve inward around each corner cap'}
    s = (f'a real {shape_word} plate of {MATERIAL[material]}, {w} x {h} mm, with {borders[border]}, held by {caps}. The '
         f'lettering and border are engraved and filled with {fill}: crisp, very slightly recessed, with tiny bright edges '
         f'where the light catches the cut metal.')
    if wood:
        tone = 'dark walnut' if wood == 'dark' else 'light oak'
        s += (f' The plate is mounted on a solid {tone} backing board {w + 25} x {h + 25} mm, with real wood grain, showing '
              f'an even margin of wood about 12 mm wide all round the plate.')
    return s


def thin(wood):
    return THIN.format(board=BOARD.format(tone='dark walnut' if wood == 'dark' else 'light oak') if wood else '')


# ------------------------------------------------------------------ products on the memorial page (picks)
SCALLOP = {'border': True, 'borderStyle': 'scalloped'}
PRODUCTS = [
    dict(id='brushed-stainless-210x148-rect-dark-wood-plaque', overrides=SCALLOP, new_lines=True, wip=True,
         story="Margaret Rowley's plaque, just finished and polished on our workshop bench before it went to her family.",
         lines=[('intro', 'In loving memory of'), ('name', 'MARGARET ROWLEY'), ('date', '1936 – 2023'), ('gap', ''),
                ('body', 'Mum, Nan and dear friend,'), ('body', 'who loved this garden in every season.'),
                ('small', 'Forever in our hearts')],
         scene='The finished plaque stands on the clean white workbench, propped back at a gentle angle with its top edge '
               'resting against a small offcut of pale timber behind it. ' + WORKSHOP,
         camera='close and low, 100 mm macro lens at f/2.8: the camera is only about 15 degrees above the bench, about 55 cm '
                'from the plaque and square-on to its front, so the front edge of the board runs level along the bottom of '
                'the frame. The plaque fills about 80% of the frame width; every line of the wording is sharp.',
         scale='The walnut board is 235 x 173 mm, the size of a hardback book; the polish tin is only about 7 cm across.'),
    dict(id='aged-brass-400x300-rect-light-wood-plaque', overrides=SCALLOP, new_lines=True,
         story='Bob Cuthbert helped found his village cricket club and built its pavilion with his own hands. The members '
               'fixed his plaque to the pavilion wall beside the door.',
         lines=[('intro', 'In loving memory of'), ('name', 'BOB CUTHBERT'), ('date', '1938 – 2022'), ('gap', ''),
                ('body', 'Founder member of Millbrook Cricket Club,'), ('body', 'who built this pavilion with his own hands'),
                ('body', 'and kept the tea urn going for fifty summers.'), ('small', 'Always one of us')],
         scene='The plaque on its light oak board is fixed with hidden fixings to the white-painted timber weatherboarding '
               'of a village cricket pavilion, beside the open door, at head height. The cricket field, a white sight '
               'screen and trees are softly blurred behind. Warm late-afternoon summer sun from the side.',
         camera='at eye level, about 1 m away, slightly to one side, so the plaque is seen at a gentle angle of about 10-15 '
                'degrees. The plaque is the clear subject and fills about 70% of the square frame.',
         scale='The board is 425 x 325 mm; each painted weatherboard is about 15 cm deep, so the board spans just over two '
               'boards in height.'),
    dict(id='polished-brass-250x150-oval-plaque', overrides={}, new_lines=False,
         story='Irene Baxter arranged the flowers at St Peter\'s church for more than fifty years. The parish fixed an oval '
               'brass plaque in the church porch, beside where her flowers still stand every Sunday.',
         scene='The polished brass oval plaque is fixed flat with its two caps to the pale limestone wall inside an old '
               'village church porch, at head height. Beside it, softly out of focus, a tall pedestal arrangement of white '
               'lilies and greenery; the heavy oak church door stands ajar with daylight beyond. Soft daylight falls into '
               'the porch from the open doorway and gives the brass a warm, gentle reflection.',
         camera='at eye level, about 70 cm away, slightly to the right, gentle angle. The plaque fills about 65% of the '
                'square frame.',
         scale='The oval is 250 x 150 mm, about the width of a dinner plate and a half.'),
    dict(id='polished-stainless-210x297-rect-dark-wood-plaque', overrides=SCALLOP, new_lines=True,
         story='David Okafor built the summerhouse at the end of his garden and spent every evening in it with a book and a '
               'brew. His children fixed his plaque beside its door.',
         lines=[('intro', 'In loving memory of'), ('name', 'DAVID'), ('name', 'OKAFOR'), ('date', '1951 – 2020'), ('gap', ''),
                ('body', 'He built this summerhouse'), ('body', 'and spent every evening here'),
                ('body', 'with a book and a brew.'), ('small', 'Dad, we still save your seat')],
         scene='The plaque on its dark walnut board is fixed with hidden fixings to the sage-green painted timber wall of a '
               'garden summerhouse, beside its glazed door, under the shelter of its small veranda roof. A wicker chair, a '
               'potted lavender and the garden beyond are softly blurred. Soft evening light.',
         camera='at eye level, about 80 cm away, slightly to one side, gentle angle. The plaque is the clear subject and '
                'fills about 65% of the square frame, portrait way up.',
         scale='The walnut board is 235 x 322 mm (portrait), about the size of a large book.'),
    dict(id='aged-brass-148x210-rect-dark-wood-plaque', overrides=SCALLOP, new_lines=True,
         story='Ruth Adeyemi taught at the local school and spent her Saturdays in the town library, where she ran the '
               'reading group for twenty years. The library fixed her plaque in its reading room.',
         lines=[('intro', 'In loving memory of'), ('name', 'RUTH'), ('name', 'ADEYEMI'), ('date', '1952 – 2023'), ('gap', ''),
                ('body', 'Scholar, teacher'), ('body', 'and friend of this library,'), ('small', 'who opened so many doors')],
         scene='The plaque on its dark walnut board is fixed with hidden fixings to a pale grey painted wall in a calm '
               'library reading room, at head height, beside a tall oak bookcase. Reading lamps and shelves of books are '
               'softly blurred. Soft daylight from a tall window.',
         camera='at eye level, about 70 cm away, slightly to one side, gentle angle. The plaque fills about 60% of the '
                'square frame, portrait way up.',
         scale='The walnut board is 173 x 235 mm (portrait), the size of a hardback book.'),
    dict(id='polished-brass-200x150-rect-light-wood-plaque', overrides=SCALLOP, new_lines=True, wip=True,
         story="Ivor Pugh's plaque for his church, on our workshop bench while it is given its final polish.",
         lines=[('intro', 'In loving memory of'), ('name', 'IVOR PUGH'), ('date', '1938 – 2017'), ('gap', ''),
                ('body', 'Lay reader in this church'), ('body', 'for thirty years,'), ('small', 'a good and faithful servant')],
         scene='The finished plaque lies flat on the clean white workbench, just polished. ' + WORKSHOP,
         camera='a close macro detail shot, 100 mm macro lens at f/4: the camera is about 30 cm from the plaque and low, '
                'about 25 degrees above the bench, looking along it diagonally from its lower-left corner. The whole plaque '
                'and all its wording fill most of the frame; the name is pin-sharp and the far corner falls gently out of '
                'focus. Window light rakes across the polished brass, giving real, uneven reflections.',
         scale='The oak board is 225 x 175 mm, about the size of a hardback book; the polish tin is only about 7 cm across.'),
    dict(id='polished-brass-148x210-rect-light-wood-plaque', overrides=SCALLOP, new_lines=False,
         story="Samuel Hargreaves rang the bells at St Mary's for seventy years. The ringers fixed his plaque in the tower's "
               "ringing chamber, where they still meet every Thursday.",
         scene='The plaque on its light oak board is fixed with hidden fixings to the whitewashed stone wall of a church '
               'tower\'s ringing chamber, at head height. Beside it, softly out of focus, the bell ropes hang down with '
               'their red, white and blue striped woollen grips, looped up. Daylight comes in from a small arched window.',
         camera='at eye level, about 70 cm away, slightly to the left, gentle angle. The plaque fills about 60% of the '
                'square frame, portrait way up.',
         scale='The oak board is 173 x 235 mm (portrait), the size of a hardback book.'),
    dict(id='brushed-stainless-150x50-rect-plaque', overrides={}, new_lines=False,
         story='Joan Parry volunteered in her town\'s community garden for twenty years. Her friends there gave a bench in '
               'her name.',
         scene='The small brushed stainless bench plaque is screwed with its two screws to the middle of the top rail of '
               'the backrest of a weathered teak garden bench in a community garden. Raised vegetable beds, a greenhouse '
               'and sunflowers are softly blurred behind. Soft morning sunlight.',
         camera='close: about 45 cm from the bench back, at the height of the rail, slightly to one side. The plaque fills '
                'about 55% of the frame width; the grain of the weathered teak is sharp around it.',
         scale='The plaque is only 150 x 50 mm, a little bigger than a mobile phone lying on its side; it fits on the top '
               'rail with teak showing above and below it.'),
]

# ------------------------------------------------------------------ portraits (PIM artwork, unchanged)
STAKE = ('ONE chunky black powder-coated square steel ground stake about 30 mm thick, fixed by a bracket to the middle of '
         'the back of the board and pushed straight into the ground')
PORTRAITS = [
    dict(id='portrait-george', stencil='stencils-v2/portrait-tree-george.png', pim='portrait-tree-george',
         story='George Hartley planted the trees round the edge of his allotment site forty years ago. The allotment society '
               'stood his portrait plaque under the oak he planted by the gate.',
         desc='an A5 brushed brass plate on a light oak board, with an engraved portrait of George on the left and his name '
              'and words on the right',
         scene=f'The plaque on its light oak board stands on {STAKE} in the grass at the foot of a young oak by an allotment '
               'gate in autumn. Only a little of the setting shows: a sliver of the oak\'s trunk at one edge and golden '
               'leaves on the grass, all softly blurred.',
         camera='a tight close-up: about 45 cm from the plaque at its height, 85 mm lens, almost straight on. The board '
                'fills about 85% of the frame width; only the top of the black stake shows below it. As little background '
                'as possible.', wood='light'),
    dict(id='portrait-ron-pat', stencil='stencils-v2/portrait-tree-ron-pat.png', pim='portrait-tree-ron-pat',
         story='Ron and Pat Coleman were married for sixty-two years and shared a cup of tea under their apple tree every '
               'summer evening. Their children stood the plaque under that tree.',
         desc='an A5 brushed stainless plate on a light oak board, with an engraved portrait of Ron and Pat cheek to cheek on '
              'the left and their names and words on the right',
         scene=f'The plaque on its light oak board stands on {STAKE} in the grass under an old apple tree. Only a little of '
               'the setting shows: a red apple in the grass and the gnarled trunk at one edge, softly blurred. Warm '
               'late-summer evening light.',
         camera='a tight close-up: about 45 cm from the plaque at its height, 85 mm lens, almost straight on. The board '
                'fills about 85% of the frame width; only the top of the black stake shows below it. As little background '
                'as possible.', wood='light'),
    dict(id='portrait-daniel', stencil='stencils/portrait-tree-daniel.png', pim='portrait-tree-daniel',
         story='Daniel Price sailed every Sunday with his mates. They fixed his plaque to the wall of the sailing club '
               'boathouse, where they still meet.',
         desc='an A5 brushed brass plate on a light oak board, with his name and words on the left and an engraved portrait '
              'of Daniel on the right',
         scene='The plaque on its light oak board is fixed flat with hidden fixings to the weathered, pale blue painted '
               'timber boards of a sailing club boathouse wall, at head height. Only a little of the setting shows: a coil '
               'of rope and the bright harbour at one edge, softly blurred. Bright, breezy daylight.',
         camera='a close-up: about 50 cm from the plaque at its height, 85 mm lens, at a gentle angle. The board fills about '
                '80% of the frame width.', wood='light'),
    dict(id='portrait-bramble', stencil='stencils-v2/portrait-tree-bramble.png', pim='portrait-tree-bramble',
         story="Bramble's portrait plaque on our workshop bench, being given its final polish before it went home to his "
               "family.",
         desc='an A5 brushed brass plate on a light oak board, with an engraved portrait of Bramble the springer spaniel on '
              'the left and his name and words on the right',
         scene='The finished plaque lies on the clean white workbench, propped back slightly. ' + WORKSHOP,
         camera='close and low, 100 mm macro lens at f/2.8: about 50 cm from the plaque, about 20 degrees above the bench and '
                'nearly square-on. The plaque fills about 85% of the frame width; the dog\'s portrait and every line of the '
                'wording are sharp.', wood='light'),
]


def designer():
    items = [{'slug': p['id'], 'offer': p['id'], 'overrides': p['overrides'], 'lines': [list(l) for l in p['lines']]}
             for p in PRODUCTS if p['new_lines']]
    (HERE / 'designer-wording-r2.json').write_text(json.dumps(items, ensure_ascii=False, indent=1))
    print(len(items), 'designer stencils to render')


def ref(src, dst):
    im = Image.open(src).convert('RGB')
    im.thumbnail((1024, 1024), Image.LANCZOS)
    im.save(dst)
    return str(dst)


def prompts():
    out = HERE / 'prompts'
    refs = HERE / 'refs-r2'
    refs.mkdir(exist_ok=True)
    jobs = []
    # The top photo and the two tiles: the round-1 prompts with the thickness rule and, for the tree tile, a tight crop.
    for old, new, extra in [
        ('hero-b', 'hero-r2', ''),
        ('tile-stone-b', 'tile-stone-r2', ''),
        ('tile-tree', 'tile-tree-r2', 'tight'),
    ]:
        t = (out / f'{old}.txt').read_text()
        wood = 'dark' if old.startswith('hero') else ('light' if 'tree' in old else None)
        t = t.replace(' and about 20 mm thick', '').replace(' and 2 mm thick', '')
        t = t.replace('Scale: ', thin(wood) + '\n\nScale: ', 1)
        if extra == 'tight':
            start = t.index('Camera:')
            end = t.index('\n\n', start)
            t = t[:start] + ('Camera: a tight close-up: about 45 cm from the plaque at the height of the board, 85 mm lens, '
                             'almost straight on. The board fills about 85% of the frame width; only the top of the black '
                             'stake shows below it and only a sliver of the cherry trunk and blossom shows at the edges, '
                             'softly blurred. As little background as possible.') + t[end:]
        (out / f'{new}.txt').write_text(t)
        base = {'hero-b': 'hero', 'tile-stone-b': 'tile-stone', 'tile-tree': 'tile-tree'}[old]
        jobs.append({'id': new, 'ref': str(HERE / 'refs' / f'{base}.png'), 'size': '1536x1024', 'versions': 2})
    for p in PRODUCTS:
        o = OFFERS[p['id']]
        wood = o['woodTone'] if o.get('wood') else None
        border = p['overrides'].get('borderStyle', o['borderStyle'])
        fixing = 'screws2' if o['fixing'] == 'screws' else ('caps2' if o['fixingHoleCount'] == 2 else 'caps4')
        lines = p['lines'] if p['new_lines'] else None
        if lines is None:
            w = {x['slug']: x['lines'] for x in json.load(open(HERE / 'designer-wording.json'))}
            lines = [tuple(l) for l in w[p['id']]]
        what = ('A real, unretouched photograph taken in our small UK plaque workshop, for this plaque\'s product page.'
                if p.get('wip') else 'A real, unretouched photograph of a memorial plaque in place, for its product page on '
                'a UK plaque maker\'s website.')
        body = '\n\n'.join([
            'Output: one SQUARE 1:1 photograph (equal width and height).',
            f'{what} {p["story"]} {REAL_LOOK}',
            LAYOUT.format(wood=' and the same even margin of wood around the plate' if wood else ''),
            'The plaque: ' + plaque(o['material'], o['width'], o['height'], o['shape'], wood, fixing, border, o['textColor']),
            thin(wood),
            'The wording, exactly as in the artwork, and nothing else legible anywhere in the photo:\n' + lines_text(lines),
            'Where it is: ' + p['scene'],
            'Camera: ' + p['camera'],
            'Scale: ' + p['scale'],
            ENDING])
        jid = p['id'] + '-r2'
        (out / f'{jid}.txt').write_text(body)
        src = HERE / ('refs-r2' if p['new_lines'] else 'refs') / f'{p["id"]}.png'
        jobs.append({'id': jid, 'ref': str(src), 'size': '2048x2048', 'versions': 2})
    words = {e['slug']: e for e in json.load(open(PIM / 'photo-wording.json'))}
    for por in PORTRAITS:
        entry = words[por['pim']]
        body = '\n\n'.join([
            'Output: one SQUARE 1:1 photograph (equal width and height).',
            f'A real, unretouched photograph of an engraved portrait memorial plaque. {por["story"]} {REAL_LOOK}',
            ('The attached image is the finished artwork of this exact plaque, seen straight on: ' + por['desc'] + '. It is '
             'the layout and engraving guide, not a picture to paste in. The engraved portrait must match it exactly: the same '
             'face, expression, hair, clothing, background and every engraved line, as a fine black-filled etching in the '
             'metal. The wording, border, caps and margin of oak must match too. Do not copy the artwork\'s flat colours or '
             'even lighting: the photo shows the real metal and oak in real light.'),
            'The wording, exactly as in the artwork (same lettering, italic lines and line breaks), and nothing else legible '
            'anywhere in the photo:\n' + lines_text([tuple(l) for l in entry['lines']]),
            'The plaque: the A5 plate (210 x 148 mm) has four flat round caps in the same metal, one in each corner. The '
            'board is solid light oak, 235 x 173 mm, with real grain.',
            thin(por['wood']),
            'Where it is: ' + por['scene'],
            'Camera: ' + por['camera'],
            'Scale: the oak board is only 235 x 173 mm, the size of a hardback book. Keep it true to that size.',
            ENDING])
        jid = por['id'] + '-r2'
        (out / f'{jid}.txt').write_text(body)
        jobs.append({'id': jid, 'ref': ref(PIM / por['stencil'], refs / f'{por["id"]}.png'), 'size': '2048x2048', 'versions': 2})
    # Most visible first: the four phone-visible picks, the portraits, the tiles, the top photo, then the rest.
    order = ['brushed-stainless-210x148-rect-dark-wood-plaque-r2', 'aged-brass-400x300-rect-light-wood-plaque-r2',
             'polished-brass-250x150-oval-plaque-r2', 'polished-stainless-210x297-rect-dark-wood-plaque-r2',
             'portrait-george-r2', 'portrait-ron-pat-r2', 'portrait-daniel-r2', 'portrait-bramble-r2', 'tile-tree-r2',
             'hero-r2', 'tile-stone-r2', 'aged-brass-148x210-rect-dark-wood-plaque-r2',
             'polished-brass-200x150-rect-light-wood-plaque-r2', 'polished-brass-148x210-rect-light-wood-plaque-r2',
             'brushed-stainless-150x50-rect-plaque-r2']
    jobs.sort(key=lambda j: order.index(j['id']))
    (HERE / 'jobs-r2.json').write_text(json.dumps(jobs, indent=1))
    print(len(jobs), 'jobs,', sum(j['versions'] for j in jobs), 'images')


if __name__ == '__main__':
    {'designer': designer, 'prompts': prompts}[sys.argv[1]]()
