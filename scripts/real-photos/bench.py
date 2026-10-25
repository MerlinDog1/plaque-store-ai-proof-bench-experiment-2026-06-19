"""The bench page's photos, redone the way the memorial page was (owner msg 6132, 25 Oct 2026: "Memorial page is signed
off. How many pages did last search ad campaign directly link too? Those will be the pics to fix the next with the same
level of care and detail"). The bench page was the pilot campaign's second-busiest ad landing page.

Each plaque has a back story, fuller wording that still fits its small plate, its own designer drawing as a layout guide,
a real-photo brief, the true 1.5 mm plate thickness and a bench that suits the story. One is on our workshop bench.
The top photo shows the plaque the page's "from" price is for (brushed stainless 150 x 50 mm).
The first pick (brushed stainless 150 x 50, Joan Parry) was redone for the memorial page and is kept.

Usage: python3 -I bench.py designer   -> designer-wording.json (stencils for render.cjs)
       python3 -I bench.py prompts    -> prompts/<id>.txt and jobs.json (refs/ must hold the metal-screw stencils)
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
OFFERS = json.load(open(HERE / 'offers.json'))

MATERIAL = {
    'brushed-stainless': 'brushed stainless steel: silver-grey with a fine horizontal brushed grain and soft satin reflections, never gold and never a chrome mirror',
    'polished-stainless': 'mirror-polished stainless steel: bright silver that reflects its surroundings in soft, believable bands, with no brush grain',
    'brushed-brass': 'brushed brass: warm satin gold with a fine horizontal brushed grain and low glare',
    'polished-brass': 'polished brass: bright, mirror-like warm gold that reflects its surroundings',
    'aged-brass': 'mid aged brass: warm brown-gold with an even, intentional factory patina, smooth, clean and low-glare',
    'orbital-brass-matt-lacquer': 'orbital-finished brass under a matt lacquer: muted straw-gold with a very fine, dense, non-directional swirl finish like a satin haze, flatter than brushed brass, low glare and never mirror-like',
}
REAL_LOOK = ('Shot on a full-frame camera, natural light, true-to-life colours, a little natural grain, no filters, no HDR, '
             'no retouching.')
THIN = ('Thickness must be true to life. The metal plate is a thin 1.5 mm sheet, about as thick as a coin: at this angle '
        'its edge shows only as a fine bright line, never as a visible slab, step or raised panel. The plate is screwed '
        'straight onto the timber and sits flat and tight against it, with no gap, no frame and no backing board. The '
        'screw heads are small and low, only 2-3 mm proud of the plate.')
LAYOUT = ('The attached image is our flat design artwork of this exact plaque, seen straight on. It is a layout guide, not a '
          'photo and not a picture to paste in. Make the real plaque match it exactly in layout: the same wording with the '
          'same line breaks, the same letter shapes and relative sizes, the same spacing, the same position of the text on '
          'the plate, the same border and the same screw positions. Do not copy the artwork\'s flat colours, outlines, even '
          'lighting or straight-on view: the photo shows the real materials, in real light, from the camera position '
          'described below.')
BENCH = ('The bench is real, used timber: real grain, small cracks and checks, a little lichen or wear where people sit, '
         'and the plaque\'s own small shadow on the wood where the light falls.')
ENDING = ('It must look like a real photograph of a real, physical object: real reflections of the surroundings in the '
          'metal, light falling on the plate, the bench and the setting in exactly the same way, real texture in the wood '
          'grain and the setting. Not a 3D render, not an illustration, not a composite, not a pasted-on graphic. Avoid '
          'perfectly even lighting on the plate, plastic-looking metal or wood, oversized screw heads, a plaque that is too '
          'big for the bench, exaggerated thickness, oversaturated colours, readable brand names, extra or misspelled text, '
          'logos, watermarks, people or hands.')
WORKSHOP = ('Behind the plaque our small UK workshop melts into a soft, creamy bokeh: a folded pale grey polishing cloth and '
            'a crumpled white cotton rag just behind one side, a round tin of metal polish far too blurred for any label to '
            'be read, and further back shelving with metal sheets and wooden boards, a bright window and small round '
            'out-of-focus highlights from the workshop lights. Soft daylight from a large window on the left gives the metal '
            'a gentle highlight along one edge and a soft, real shadow on the bench. The white workbench is clean and tidy, '
            'with only the faint marks of daily use.')

SINGLE = {}
DOUBLE = {'border': True, 'borderStyle': 'double'}
SCALLOP = {'border': True, 'borderStyle': 'scalloped'}

# id, offer (the product), border overrides, back story, wording, setting, camera and scale. The hero is 3:2 (published
# as a 4:3 crop); the products are square catalogue photos.
PHOTOS = [
    dict(id='bench-hero', offer='brushed-stainless-150x50-rect-plaque', overrides=SINGLE, hero=True,
         story='George Holland walked the hills above his village every day of his retirement and always stopped to rest '
               'at the top. His family put a bench there in his memory.',
         lines=[('intro', 'In loving memory of'), ('name', 'GEORGE HOLLAND'), ('body', 'who walked these hills'),
                ('body', 'and loved this view')],
         scene='The plaque is screwed to the middle of the top rail of the backrest of a weathered, silver-grey teak bench '
               'that stands on the grass at the top of a hill beside a footpath. Beyond the bench the hillside falls away to '
               'a wide green valley of small fields, hedgerows and a distant village, softly blurred. Low, golden evening '
               'sun from the left warms the teak and catches the fine brushed grain of the steel.',
         camera='standing in front of the bench, a little to the right: about 60 cm from the plaque at the height of the top '
                'rail, 50 mm lens at f/4, looking along the backrest at about 20 degrees. The plaque is pin-sharp, just left '
                'of the centre of the frame, and fills about 40% of the frame width; more of the backrest, a little of the '
                'seat and the far end of the bench fall gently out of focus. Every line of the wording is readable.',
         scale='The plaque is only 150 x 50 mm, a little longer and much slimmer than a mobile phone. The top rail of the '
               'backrest is about 100 mm tall, so the plaque covers only the middle half of the rail\'s height, with teak '
               'showing above and below it, and the bench is about 1.8 m long, twelve times the length of the plaque.'),
    dict(id='brushed-brass-225x75-rect-plaque', offer='brushed-brass-225x75-rect-plaque', overrides=SINGLE,
         story='Lily Chambers walked her dog along the river every morning for sixty years and always stopped at this '
               'spot by the weir. Her neighbours put a bench there for her.',
         lines=[('intro', 'This bench is in memory of'), ('name', 'LILY CHAMBERS'), ('date', '1929 – 2019'),
                ('body', 'who walked by this river every morning'), ('body', 'and always stopped here to say hello')],
         scene='The plaque is screwed to the middle of the top rail of a dark, weathered oak bench on a riverside path in a '
               'small town park. Beyond the bench, softly blurred, a slow river, the white water of a low weir and willows '
               'on the far bank. Early morning: soft, low sunlight with a little mist over the water and dew on the grass.',
         camera='a close, low oblique view: 85 mm lens at f/5.6, about 40 cm from the plaque, at the height of the rail and '
                'about 30 degrees to the left of square-on, looking along the rail, which runs gently across the frame. The '
                'whole plaque is sharp and fills about 70% of the frame width; every line of the wording is readable.',
         scale='The plaque is 225 x 75 mm, about the length of a dinner knife. The top rail is about 110 mm tall, so dark oak '
               'shows above and below the plaque.'),
    dict(id='polished-stainless-200x50-rect-plaque', offer='polished-stainless-200x50-rect-plaque', overrides=SINGLE,
         story='Tom and Betty Harris retired to the seaside and walked the promenade arm in arm every evening. They always '
               'sat on this bench to watch the fishing boats come home.',
         lines=[('intro', 'In loving memory of'), ('name', 'TOM & BETTY HARRIS'), ('body', 'who sat here every evening'),
                ('body', 'to watch the boats come home')],
         scene='The plaque is screwed to the top rail of the backrest of a traditional seafront bench on a Victorian '
               'promenade: weathered hardwood slats held by ornate cast-iron ends painted deep green. Behind the bench, '
               'softly blurred, the promenade railings, the calm sea and a small harbour wall with a few fishing boats. '
               'Warm early-evening light from the side; the mirror-polished steel reflects soft bands of sky and sea.',
         camera='at the height of the rail, about 50 cm from the plaque and slightly to the right, at a gentle angle of '
                'about 15 degrees. The plaque fills about 60% of the frame width; the slats and the edge of one green iron '
                'bench end are in shot.',
         scale='The plaque is 200 x 50 mm, about the length of a pencil. The top rail is about 95 mm tall, so the plaque '
               'covers only the middle half of its height, with timber showing above and below it.'),
    dict(id='aged-brass-150x75-rect-plaque', offer='aged-brass-150x75-rect-plaque', overrides=SCALLOP,
         story='Alice Grant bowled for her village bowls club for more than forty years. The club put a bench beside the '
               'green in her memory.',
         lines=[('intro', 'In loving memory of'), ('name', 'ALICE GRANT'), ('date', '1933 – 2021'),
                ('body', 'who bowled on this green'), ('body', 'for forty happy summers')],
         scene='The plaque is screwed to the middle of the top rail of a honey-coloured teak bench beside a village bowling '
               'green. Behind, softly blurred: the short, striped green with a few woods resting on it, a low hedge and '
               'the white-painted timber clubhouse with its little veranda. Warm, soft summer afternoon sun.',
         camera='standing, looking slightly down at the bench back from about 60 cm, at about 20 degrees to one side. The '
                'plaque fills about 55% of the frame width; the whole plaque is sharp.',
         scale='The plaque is 150 x 75 mm, about the size of a mobile phone lying on its side. The top rail is about 110 mm '
               'tall, so teak shows above and below the plaque.'),
    dict(id='polished-brass-150x65-rect-plaque', offer='polished-brass-150x65-rect-plaque', overrides=DOUBLE, wip=True,
         story="Mary Quinn's bench plaque on our workshop bench, just polished, before it went to the allotment society "
               "that put a bench on the plots in her memory.",
         lines=[('intro', 'Remembering'), ('name', 'MARY QUINN'), ('date', '1938 – 2022'),
                ('body', 'who grew the finest sweet peas'), ('body', 'on these allotments for fifty years')],
         scene='The finished plaque lies flat on the clean white workbench, just polished, with the four small brass screws '
               'that will fix it to her bench laid neatly beside it. ' + WORKSHOP,
         camera='a close macro detail shot, 100 mm macro lens at f/4: the camera is about 30 cm from the plaque and low, '
                'about 25 degrees above the bench, looking along it diagonally from its lower-left corner. The whole plaque '
                'and all its wording fill most of the frame; the name is pin-sharp and the far corner falls gently out of '
                'focus. Window light rakes across the polished brass, giving real, uneven reflections.',
         scale='The plate is only 150 x 65 mm, about the size of a mobile phone; each screw is about 25 mm long and the '
               'polish tin is about 7 cm across.'),
    dict(id='orbital-brass-matt-lacquer-150x75-rect-plaque', offer='orbital-brass-matt-lacquer-150x75-rect-plaque',
         overrides=SINGLE,
         story='John Penrose taught half the village to sail at the sailing club on the lake. The members put a bench on the '
               'bank above the slipway, where he used to sit and watch the races.',
         lines=[('intro', 'In memory of'), ('name', 'JOHN PENROSE'), ('date', '1946 – 2022'),
                ('body', 'who taught half the village to sail'), ('small', 'Gone sailing')],
         scene='The plaque is screwed to the middle of the top rail of a weathered iroko bench on the grassy bank of a small '
               'sailing club beside a lake. Behind, softly blurred: white sailing dinghies drawn up on the slipway, the '
               'bright water and wooded hills beyond. Bright, breezy daylight with high cloud.',
         camera='at the height of the rail, about 45 cm from the plaque, slightly to the left, at a gentle angle of about '
                '15 degrees. The plaque fills about 55% of the frame width; the grain of the weathered iroko is sharp '
                'around it.',
         scale='The plaque is 150 x 75 mm, about the size of a mobile phone lying on its side. The top rail is about 110 mm '
               'tall, so timber shows above and below the plaque.'),
    dict(id='brushed-stainless-150x75-rect-plaque', offer='brushed-stainless-150x75-rect-plaque', overrides=SINGLE,
         story="Stan Bailey was the keeper of his town's Victorian park for thirty years. The friends of the park put a "
               "bench by the bandstand for him.",
         lines=[('intro', 'In memory of'), ('name', 'STAN BAILEY'), ('date', '1939 – 2020'),
                ('body', 'Park keeper here for thirty years,'), ('body', 'who loved every inch of it')],
         scene='The plaque is screwed to the middle of the top rail of a classic park bench with slats painted dark green, '
               'a little worn, and cast-iron ends, in a Victorian town park. Behind, softly blurred: the bandstand, a '
               'bright flower bed and old plane trees. Dappled sunlight through the trees falls across the bench and over '
               'part of the plaque.',
         camera='at the height of the rail, about 45 cm from the plaque, slightly to the right, at a gentle angle of about '
                '15 degrees. The plaque fills about 55% of the frame width.',
         scale='The plaque is 150 x 75 mm, about the size of a mobile phone lying on its side. The top rail is about 110 mm '
               'tall, so painted timber shows above and below the plaque.'),
    dict(id='polished-stainless-225x65-rect-plaque', offer='polished-stainless-225x65-rect-plaque', overrides=DOUBLE,
         story='The Revd John Ashworth was vicar of his village parish for twenty-three years and always had time to stop '
               'and talk. The parish put a bench in the churchyard in his memory.',
         lines=[('intro', 'In memory of'), ('name', 'REVD JOHN ASHWORTH'), ('body', 'Vicar of this parish 1975 – 1998,'),
                ('body', 'who always had time to sit and listen')],
         scene='The plaque is screwed to the middle of the top rail of an oak bench in a quiet village churchyard, under an '
               'old yew. Behind, softly blurred: the stone church porch and lichen-covered headstones in long grass. Soft, '
               'bright overcast light; the mirror-polished steel reflects the pale sky and dark yew in soft bands.',
         camera='standing, about 60 cm away, looking slightly down at the bench back at about 20 degrees to one side. The '
                'plaque fills about 65% of the frame width; every line of the wording is readable.',
         scale='The plaque is 225 x 65 mm, about the length of a dinner knife. The top rail is about 100 mm tall, so oak '
               'shows above and below the plaque.'),
]


def lines_text(lines):
    return '\n'.join(f'"{t}"' for r, t in lines if r != 'gap')


def plaque(o, border):
    material, w, h = o['material'], o['width'], o['height']
    fill = ('warm cream paint (the artwork draws the lettering and border in black only for contrast: on the real '
            'plaque they are warm cream, never black)') if o['textColor'] == 'cream' else 'black paint'
    screws = ('two small domed cross-head screws in the same metal, one at each end on the centre line'
              if o['fixingHoleCount'] == 2 else 'four small domed cross-head screws in the same metal, one near each corner')
    borders = {'double': 'a double engraved border line near the edge', 'single': 'a single engraved border line',
               'scalloped': 'one engraved border line with scalloped corners that curve inward around each corner screw'}
    return (f'a real rectangular bench plaque of {MATERIAL[material]}, {w} x {h} mm, with {borders[border]}, held by '
            f'{screws}. The lettering and border are engraved and filled with {fill}: crisp, very slightly recessed, with '
            f'tiny bright edges where the light catches the cut metal.')


def designer():
    items = [{'slug': p['id'], 'offer': p['offer'], 'overrides': p['overrides'], 'lines': [list(l) for l in p['lines']]}
             for p in PHOTOS]
    (HERE / 'designer-wording.json').write_text(json.dumps(items, ensure_ascii=False, indent=1))
    print(len(items), 'designer stencils to render')


def prompts():
    out = HERE / 'prompts'
    out.mkdir(exist_ok=True)
    jobs = []
    for p in PHOTOS:
        o = OFFERS[p['offer']]
        border = p['overrides'].get('borderStyle', o['borderStyle'])
        if p.get('hero'):
            head = 'Output: one landscape 3:2 photograph.'
            what = 'A real, unretouched photograph of a memorial bench plaque in place, for a UK plaque maker\'s website.'
        elif p.get('wip'):
            head = 'Output: one SQUARE 1:1 photograph (equal width and height).'
            what = 'A real, unretouched photograph taken in our small UK plaque workshop, for this plaque\'s product page.'
        else:
            head = 'Output: one SQUARE 1:1 photograph (equal width and height).'
            what = ('A real, unretouched photograph of a memorial bench plaque in place, for its product page on a UK '
                    'plaque maker\'s website.')
        parts = [head, f'{what} {p["story"]} {REAL_LOOK}', LAYOUT, 'The plaque: ' + plaque(o, border), THIN,
                 'The wording, exactly as in the artwork, and nothing else legible anywhere in the photo:\n'
                 + lines_text(p['lines']),
                 'Where it is: ' + p['scene'] + ('' if p.get('wip') else ' ' + BENCH),
                 'Camera: ' + p['camera'], 'Scale: ' + p['scale'], ENDING]
        (out / f'{p["id"]}.txt').write_text('\n\n'.join(parts))
        jobs.append({'id': p['id'], 'ref': str(HERE / 'refs' / f'{p["id"]}.png'),
                     'size': '1536x1024' if p.get('hero') else '2048x2048', 'versions': 2})
    (HERE / 'jobs.json').write_text(json.dumps(jobs, indent=1))
    print(len(jobs), 'jobs,', sum(j['versions'] for j in jobs), 'images')


if __name__ == '__main__':
    {'designer': designer, 'prompts': prompts}[sys.argv[1]]()
