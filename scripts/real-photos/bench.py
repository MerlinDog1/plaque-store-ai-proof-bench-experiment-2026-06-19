"""The bench page's photos, redone the way the memorial page was (owner msg 6132, 25 Oct 2026: "Memorial page is signed
off. How many pages did last search ad campaign directly link too? Those will be the pics to fix the next with the same
level of care and detail"). The bench page was the pilot campaign's second-busiest ad landing page.

Each plaque has a back story and fuller wording that still fits its small plate. The top photo shows the plaque the
page's "from" price is for (brushed stainless 150 x 50). The first pick (brushed stainless 150 x 50, Joan Parry) was
redone for the memorial page and is kept.

Round 1 used each plaque's flat designer drawing as the layout guide. The owner's feedback on it (msgs 6149, 6152, 6154):
- "backgrounds on most is just way too much, too dramatic. Really wants to be more no descript right and throw in some
  newer looking benches."
- "If you gonna take from an angle you need to make sure plaque lines up with bench and also check positioning on bench
  always."
- "if someone say somewhere to watch something etc the bench would be looking out towards that great view so our picture
  would not contain that great view"
- "could you even potentially code the angle? And the rough bench outline so image model was less likely to make shit up?"
So round 2 (every photo with a `guide`) gives Codex a rough 3D render from bench_scene.py instead: a simple bench model
with the plaque's drawing on the front of its top rail, centred and lined up, seen from a fixed camera. The bench faces
its view; the camera stands in front of it, so the background is the plain, ordinary place behind the bench. Half the
benches are newer. Mary Quinn's workshop shot is round 1 and stays.

Usage: python3 -I bench.py designer   -> designer-wording.json (stencils for render.cjs)
       python3 -I bench_scene.py      -> guides/<id>.png (the 3D layout renders)
       python3 -I bench.py prompts r3 -> prompts/<id>-r3.txt and jobs-r3.json for the guided photos
Round 3 (owner msg 6162, on the round-2 samples): "Low key feel like you want to me closer to the plaque and also plaque
is 1.5mm thick, it needs to look like real metal also": the camera is closer and flatter on (the plaque fills 55% of
the top photo and 75-80% of the product photos), the plate has square-cut edges with no rim, the guide no longer
outlines the plate, and every brief describes how its metal finish catches the light.
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
    'aged-brass': ('aged brass: a brand-new plate given a deliberate, even antique finish at the factory, a uniform warm '
                   'brown-gold, smooth, clean and low-glare; it looks new and well made, never weathered, tarnished, blotchy, '
                   'worn or old'),
    'orbital-brass-matt-lacquer': 'orbital-finished brass under a matt lacquer: muted straw-gold with a very fine, dense, non-directional swirl finish like a satin haze, flatter than brushed brass, low glare and never mirror-like',
}
REAL_LOOK = ('Shot on a full-frame camera, natural light, true-to-life colours, a little natural grain, no filters, no HDR, '
             'no retouching.')
PLAIN = ('It should look like an ordinary, honest photo that someone took of the bench on an ordinary day: a plain, '
         'everyday background and soft, natural light, not a postcard, not a sunset, nothing dramatic.')
THIN = ('Thickness must be true to life. The metal plate is a thin 1.5 mm sheet, about as thick as a coin, with square-cut '
        'edges: no bevel, no raised rim and no frame around its outer edge (the engraved border on its face stays). At this '
        'angle its edge shows at most as a '
        'hairline of bright metal along one side, never as a visible slab, step or raised panel. The plate is screwed '
        'straight onto the timber and sits flat and tight against it, with no gap, no frame and no backing board. The '
        'screw heads are small and low, only 2-3 mm proud of the plate.')
LAYOUT = ('The attached image is our flat design artwork of this exact plaque, seen straight on. It is a layout guide, not a '
          'photo and not a picture to paste in. Make the real plaque match it exactly in layout: the same wording with the '
          'same line breaks, the same letter shapes and relative sizes, the same spacing, the same position of the text on '
          'the plate, the same border and the same screw positions. Do not copy the artwork\'s flat colours, outlines, even '
          'lighting or straight-on view: the photo shows the real materials, in real light, from the camera position '
          'described below.')
GUIDE = ('The attached image is a rough 3D layout render of this exact scene, made by us from measurements. It fixes the '
         'composition. Keep exactly: the camera position and viewing angle, the perspective, the bench\'s shape and its '
         'place and size in the frame, and the plaque exactly where it is: in the middle of the top rail of the backrest, '
         'lined up with the rail, flat against it, at exactly that size, position and angle. The plaque\'s wording, '
         'border and screws are drawn on it from our design artwork: keep that layout exactly, with the same line breaks '
         'and letter sizes. The render\'s flat grey surfaces, plain grey ground and empty sky are only placeholders: give '
         'the bench the real materials described below and put the real setting described below behind it. Do not copy '
         'the render\'s flat colours, flat shading or empty background. The plaque in the render is our flat design artwork '
         'laid onto the model: in the photo it is real, solid metal, as described below, never a flat print.')
METAL = ('Real metal: the plate catches the light unevenly, the way real metal does, with a soft bright sheen across part of '
         'it, slightly darker tones elsewhere and the fine texture of its finish visible up close ({finish}). The engraved '
         'letters are cut into the metal, with tiny bright edges. It must never look like a printed sticker, a flat-coloured '
         'graphic or plastic.')
FINISH = {
    'brushed-stainless': 'fine parallel brushed lines that shimmer where the light crosses them',
    'polished-stainless': 'a true mirror that reflects the real sky and surroundings behind the camera, softly distorted, '
                          'with the lettering crisp on top',
    'brushed-brass': 'fine parallel brushed lines that glow warm gold where the light crosses them',
    'polished-brass': 'a bright, mirror-like warm gold that reflects the window and the room, softly distorted, with '
                      'the lettering crisp on top',
    'aged-brass': 'a smooth, even, deliberately applied antique tone with a soft satin sheen, the same all over',
    'orbital-brass-matt-lacquer': 'a fine, dense swirl texture under a satin lacquer that glints softly',
}
FACING = ('The plaque is on the front of the backrest, facing the same way as someone sitting on the bench, so this photo '
          'is taken from in front of the bench, looking back at it. {facing}')
BENCH = ('The bench is real, used timber: real grain, small cracks and checks, a little wear where people sit, and the '
         'plaque\'s own small shadow on the wood where the light falls.')
NEW_BENCH = ('The bench is real timber, fairly new and well kept: real grain, crisp edges, only the faint marks of use, and '
             'the plaque\'s own small shadow on the wood where the light falls.')
ENDING = ('It must look like a real photograph of a real, physical object: real reflections of the surroundings in the '
          'metal, light falling on the plate, the bench and the setting in exactly the same way, real texture in the wood '
          'grain and the setting. Not a 3D render, not an illustration, not a composite, not a pasted-on graphic. Avoid '
          'perfectly even lighting on the plate, plastic-looking metal or wood, oversized screw heads, a plaque that is too '
          'big for the bench or does not line up with the rail, exaggerated thickness, oversaturated colours, readable '
          'brand names, extra or misspelled text, logos, watermarks, people or hands.')
WORKSHOP = ('Behind the plaque our small UK workshop melts into a soft, creamy bokeh: a folded pale grey polishing cloth and '
            'a crumpled white cotton rag just behind one side, a round tin of metal polish far too blurred for any label to '
            'be read, and further back shelving with metal sheets and wooden boards, a bright window and small round '
            'out-of-focus highlights from the workshop lights. Soft daylight from a large window on the left gives the metal '
            'a gentle highlight along one edge and a soft, real shadow on the bench. The white workbench is clean and tidy, '
            'with only the faint marks of daily use.')

SINGLE = {}
DOUBLE = {'border': True, 'borderStyle': 'double'}
SCALLOP = {'border': True, 'borderStyle': 'scalloped'}

# Bench models for bench_scene.py (mm). 'splats': a thick top rail with vertical slats below (garden bench);
# 'slats': wide horizontal back slats, the plaque on the top one (park and seafront benches).
GARDEN = dict(back='splats', L=1500, top=860, rail_h=110, recline=12, arms=True)
PARK = dict(back='slats', L=1800, top=860, slats=[120, 95, 95], recline=12, arms=True, end_w=40, leg=40)
MODERN = dict(back='slats', L=1800, top=820, slats=[95, 85, 85], recline=10, arms=False, end_w=30, leg=30)

PHOTOS = [
    # The hero's three short lines make a wide name that crowds the end screws on a 150 x 50 plate: a slightly smaller
    # inscription leaves clear metal around them (the hero is not a catalogue example, so no product drawing changes).
    dict(id='bench-hero', offer='brushed-stainless-150x50-rect-plaque', overrides={'inscriptionScale': 0.86}, hero=True,
         new=True,
         story='George Holland walked the hills above his village every day of his retirement and always stopped to rest '
               'at the top. His family put a new bench there in his memory, facing the view he loved.',
         lines=[('intro', 'In loving memory of'), ('name', 'GEORGE HOLLAND'), ('date', '1931 – 2021')],
         guide=dict(size=[1024, 683], lens=70, yaw=-10, pitch_rel=0, level=True, frac=0.55, cx=0.5, cy=0.5,
                    bench=dict(GARDEN, L=1800, rail_h=100)),
         bench='a new-looking solid teak garden bench, only a year or two old: smooth honey-brown timber just starting to '
               'silver at the edges, a thick top rail on the backrest with vertical slats below it, and arms',
         facing='The bench faces out over the valley George loved, so that view is behind the camera and is NOT in the '
                'photo: no valley, no fields, no distant village anywhere.',
         behind='an ordinary grassy hilltop with a scruffy hawthorn hedge and a plain, pale sky, softly out of focus',
         light='soft, even daylight under thin high cloud, with gentle shadows',
         scale='The plaque is only 150 x 50 mm, a little longer and much slimmer than a mobile phone; the top rail is '
               'about 100 mm tall, so teak shows above and below it.'),
    dict(id='brushed-brass-225x75-rect-plaque', offer='brushed-brass-225x75-rect-plaque', overrides=SINGLE,
         story='Lily Chambers walked her dog along the river every morning for sixty years and always stopped at this '
               'spot. Her neighbours put a bench there for her.',
         lines=[('intro', 'In loving memory of'), ('name', 'LILY CHAMBERS'), ('date', '1929 – 2019')],
         guide=dict(size=[1024, 1024], lens=85, yaw=10, pitch_rel=0, level=True, frac=0.8, bench=dict(GARDEN)),
         bench='a solid oak bench that has stood by the river for years: weathered to a soft grey-brown, with fine cracks '
               'and a few patches of pale lichen, a thick top rail with vertical slats below it, and arms',
         facing='The bench faces the river, so the river is behind the camera and is NOT in the photo: no water, no weir, '
                'no bridge anywhere.',
         behind='a strip of uncut grass, a plain hawthorn hedge and a couple of willows, softly out of focus',
         light='soft, bright morning daylight; the timber is still slightly damp with dew',
         scale='The plaque is 225 x 75 mm, about the length of a dinner knife; the top rail is about 110 mm tall, so oak '
               'shows above and below it.'),
    dict(id='polished-stainless-200x50-rect-plaque', offer='polished-stainless-200x50-rect-plaque', overrides=SINGLE, new=True,
         story='Tom and Betty Harris retired to the seaside and walked the promenade arm in arm every evening. They always '
               'sat on this bench to watch the fishing boats come home.',
         lines=[('intro', 'In loving memory of'), ('name', 'TOM & BETTY HARRIS'), ('date', 'Tom 1932 – 2016 · Betty 1935 – 2021'),
                ('body', 'Together again')],
         guide=dict(size=[1024, 1024], lens=85, yaw=0, pitch_rel=0, level=True, frac=0.8, bench=dict(MODERN)),
         bench='a newer seafront bench: smooth hardwood slats with a clear oiled finish on a slim black powder-coated '
               'steel frame, with no arms',
         facing='The bench faces the sea, so the sea and the harbour are behind the camera and are NOT in the photo: no '
                'water, no beach, no boats anywhere. The mirror-polished steel only reflects the bright sky.',
         behind='the plain paved promenade, a low painted wall and a grass bank, softly out of focus',
         light='bright, slightly hazy afternoon daylight',
         scale='The plaque is 200 x 50 mm, about the length of a pencil; the top back slat is about 95 mm tall, so '
               'timber shows above and below it.'),
    dict(id='aged-brass-150x75-rect-plaque', offer='aged-brass-150x75-rect-plaque', overrides=SCALLOP, new=True,
         story='Alice Grant bowled for her village bowls club for more than forty years. The club put a bench beside the '
               'green in her memory.',
         lines=[('intro', 'In loving memory of'), ('name', 'ALICE GRANT'), ('date', '1933 – 2021')],
         guide=dict(size=[1024, 1024], lens=85, yaw=8, pitch_rel=0, level=True, frac=0.75, bench=dict(PARK, L=1500)),
         bench='a newly painted dark green wooden bench with three wide back slats and black cast-iron ends with arms',
         facing='The bench faces the bowling green, so the green is behind the camera and is NOT in the photo: no lawn, '
                'no bowls anywhere behind the bench.',
         behind='a neatly clipped privet hedge and the plain white-painted wall of the clubhouse, softly out of focus',
         light='soft summer afternoon light, a little hazy',
         scale='The plaque is 150 x 75 mm, about the size of a mobile phone lying on its side; the top back slat is about '
               '120 mm tall, so painted wood shows above and below it.'),
    dict(id='polished-brass-150x65-rect-plaque', offer='polished-brass-150x65-rect-plaque', overrides=DOUBLE, wip=True,
         story="Mary Quinn's bench plaque on our workshop bench, just polished, before it went to the allotment society "
               "that put a bench on the plots in her memory.",
         lines=[('intro', 'In loving memory of'), ('name', 'MARY QUINN'), ('date', '1938 – 2022')],
         scene='The finished plaque lies completely flat, face up, directly on the clean white workbench (not propped up, '
               'not standing, not leaning on anything), just polished, with the four small brass screws that will fix it to '
               'her bench laid neatly beside it. ' + WORKSHOP,
         camera='a close macro detail shot, 100 mm macro lens at f/4: the camera is about 30 cm from the plaque and low, '
                'about 25 degrees above the bench, looking along it diagonally from its lower-left corner. The whole plaque '
                'and all its wording fill most of the frame; the name is pin-sharp and the far corner falls gently out of '
                'focus. Window light rakes across the polished brass, giving real, uneven reflections.',
         scale='The plate is only 150 x 65 mm, about the size of a mobile phone; each screw is about 25 mm long and the '
               'polish tin is about 7 cm across.'),
    dict(id='orbital-brass-matt-lacquer-150x75-rect-plaque', offer='orbital-brass-matt-lacquer-150x75-rect-plaque',
         overrides=SINGLE,
         story='John Penrose taught half the village to sail at the sailing club on the lake. The members put a bench on the '
               'bank where he used to sit and watch the races.',
         lines=[('intro', 'In loving memory of'), ('name', 'JOHN PENROSE'), ('date', '1946 – 2022'), ('body', 'Fair winds and following seas')],
         guide=dict(size=[1024, 1024], lens=85, yaw=-10, pitch_rel=0, level=True, frac=0.75, bench=dict(GARDEN)),
         bench='an old iroko bench weathered to silver-grey, with a thick top rail on the backrest, vertical slats below it '
               'and arms',
         facing='The bench faces the lake where he watched the races, so the lake is behind the camera and is NOT in the '
                'photo: no water, no boats, no masts anywhere.',
         behind='rough grass, a post-and-rail fence and a few trees, softly out of focus',
         light='bright, breezy daylight with high cloud',
         scale='The plaque is 150 x 75 mm, about the size of a mobile phone lying on its side; the top rail is about 110 mm '
               'tall, so timber shows above and below it.'),
    dict(id='brushed-stainless-150x75-rect-plaque', offer='brushed-stainless-150x75-rect-plaque', overrides=SINGLE, new=True,
         story="Stan Bailey was the keeper of his town's Victorian park for thirty years. The friends of the park put a "
               "bench by the bandstand for him.",
         lines=[('intro', 'In loving memory of'), ('name', 'STAN BAILEY'), ('date', '1939 – 2020')],
         guide=dict(size=[1024, 1024], lens=85, yaw=10, pitch_rel=0, level=True, frac=0.75, bench=dict(PARK)),
         bench='a fairly new park bench: smooth hardwood slats with a clear finish on black-painted cast-iron ends with arms',
         facing='The bench faces the bandstand and its flower beds, so they are behind the camera and are NOT in the photo.',
         behind='a tarmac path, black iron railings and the trunks of old plane trees, softly out of focus',
         light='soft daylight with a little dappled shade from the plane trees',
         scale='The plaque is 150 x 75 mm, about the size of a mobile phone lying on its side; the top back slat is about '
               '120 mm tall, so timber shows above and below it.'),
    dict(id='polished-stainless-225x65-rect-plaque', offer='polished-stainless-225x65-rect-plaque', overrides=DOUBLE,
         story='The Revd John Ashworth was vicar of his village parish for twenty-three years and always had time to stop '
               'and talk. The parish put a bench in the churchyard in his memory.',
         lines=[('intro', 'In loving memory of'), ('name', 'REVD JOHN ASHWORTH'), ('date', '1929 – 2012'),
                ('body', '“Come ye apart and rest a while” Mark 6:31')],
         guide=dict(size=[1024, 1024], lens=85, yaw=0, pitch_rel=0, level=True, frac=0.8, bench=dict(GARDEN, rail_h=100)),
         bench='an old oak bench weathered to silver-grey with a few patches of lichen: a thick top rail on the backrest, '
               'vertical slats below it, and arms',
         facing='The bench looks out across the churchyard, so that view is behind the camera.',
         behind='the plain flint-and-stone churchyard wall and a dark yew hedge, softly out of focus; the mirror-polished '
                'steel reflects the pale sky',
         light='soft, bright overcast light',
         scale='The plaque is 225 x 65 mm, about the length of a dinner knife; the top rail is about 100 mm tall, so oak '
               'shows above and below it.'),
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


WIP_THIN = ('Thickness must be true to life. The metal plate is a thin, flat 1.5 mm sheet, about as thick as a coin. Its '
            'polished face is completely flat and runs right out to the outer edge, which is cut plain and square: there is '
            'NO bevel, NO chamfer, NO raised or stepped rim, NO moulded frame and NO second layer of metal around the edge. '
            'The only lines near the edge are the thin black engraved border lines on the face itself. Lying flat on the '
            'bench, the plate\'s edge shows only as a hairline of bright metal, never as a slab, step or block.')
WIP_ENDING = ('It must look like a real photograph of a real, physical object: real reflections of the workshop in the '
              'metal, the same light falling on the plate and the bench, real texture everywhere. Not a 3D render, not an '
              'illustration, not a composite, not a pasted-on graphic. Avoid perfectly even lighting on the plate, '
              'plastic-looking metal, exaggerated thickness, oversaturated colours, readable brand names, extra or '
              'misspelled text, logos, watermarks, people or hands.')


def wip_prompt(p, o, border):
    """The workshop shot: no bench to model, so the flat designer drawing is the layout guide (round 1's method) with
    round 3's closer, thin-plate and real-metal rules."""
    return '\n\n'.join([
        'Output: one SQUARE 1:1 photograph (equal width and height).',
        'A real, unretouched photograph taken in our small UK plaque workshop, for this plaque\'s product page. '
        + p['story'] + ' ' + REAL_LOOK,
        LAYOUT, 'The plaque: ' + plaque(o, border), METAL.format(finish=FINISH[o['material']]), WIP_THIN,
        'The wording, exactly as in the artwork, and nothing else legible anywhere in the photo:\n' + lines_text(p['lines']),
        'Where it is: ' + p['scene'], 'Camera: ' + p['camera'], 'Scale: ' + p['scale'], WIP_ENDING])


def prompts(round_tag='r4'):
    """Prompts for the photos with a 3D guide (run bench_scene.py first; it records the camera distance), and for the
    workshop shot from its flat drawing. Round 3 (owner msg 6162): closer and flatter on, a plainly 1.5 mm plate with
    square edges, and real metal. Round 4 (owner msgs 6186-6192): simple wording, aged brass deliberately aged."""
    out = HERE / 'prompts'
    out.mkdir(exist_ok=True)
    jobs = []
    for p in PHOTOS:
        o = OFFERS[p['offer']]
        border = p['overrides'].get('borderStyle', o['borderStyle'])
        if p.get('wip'):
            jid = p['id'] + '-' + round_tag
            (out / f'{jid}.txt').write_text(wip_prompt(p, o, border))
            jobs.append({'id': jid, 'ref': str(HERE / 'refs' / f"{p['id']}.png"), 'size': '2048x2048', 'versions': 2})
            continue
        if not p.get('guide'):
            continue
        info = json.loads((HERE / 'guides' / f"{p['id']}.json").read_text())
        g = p['guide']
        head = ('Output: one landscape 3:2 photograph.' if p.get('hero')
                else 'Output: one SQUARE 1:1 photograph (equal width and height).')
        what = ('A real, unretouched photograph of a memorial bench plaque in place, for a UK plaque maker\'s website.'
                if p.get('hero') else 'A real, unretouched photograph of a memorial bench plaque in place, for its product '
                'page on a UK plaque maker\'s website.')
        if g.get('level'):
            # Round 5 (owner msg 6214): the camera is square to the leaning-back backrest, so it looks slightly down,
            # and the plaque sits level in the frame.
            where = ('straight in front of the plaque, square-on to it' if g['yaw'] == 0 else
                     f"a little to the {'left' if g['yaw'] < 0 else 'right'} of the plaque, at a gentle angle of about "
                     f"{abs(g['yaw'])} degrees")
            camera = (f"exactly as in the layout render: close to the bench, {where}, with the camera square to the "
                      f"tilted-back backrest, so it looks slightly down at it; {g['lens']} mm lens, about "
                      f"{round(info['camera_distance_mm'] / 10)} cm from the plaque. The plaque fills about "
                      f"{round(info['plaque_width_frac'] * 100)}% of the width of the photo. The plaque sits perfectly level "
                      f"in the photo: its top and bottom edges run straight across the frame, never tilted or sloping"
                      + ('' if g['yaw'] == 0 else ', and only narrow slightly towards the far end') + '. The whole plaque is '
                      'sharp and every line of the wording is readable; the background is softly out of focus.')
        else:
            side = 'left' if g['yaw'] < 0 else 'right'
            above = ('a little above the rail, looking slightly down at it' if g['pitch'] >= 10
                     else 'at about the height of the rail')
            camera = (f"exactly as in the layout render: close to the bench, a little to its {side}, with the camera {above}, "
                      f"{g['lens']} mm lens, about {round(info['camera_distance_mm'] / 10)} cm from the plaque. The plaque fills "
                      f"about {round(info['plaque_width_frac'] * 100)}% of the width of the photo; the whole plaque is sharp and "
                      f"every line of the wording is readable; the background is softly out of focus.")
        parts = [head, f'{what} {p["story"]} {REAL_LOOK} {PLAIN}', GUIDE,
                 'The bench: ' + p['bench'] + '. ' + (NEW_BENCH if p.get('new') else BENCH),
                 'The plaque: ' + plaque(o, border), METAL.format(finish=FINISH[o['material']]), THIN,
                 'The wording, exactly as in the artwork, and nothing else legible anywhere in the photo:\n'
                 + lines_text(p['lines']),
                 'Which way it faces: ' + FACING.format(facing=p['facing']),
                 'Behind the bench: ' + p['behind'] + '.',
                 'Light: ' + p['light'] + '.',
                 'Camera: ' + camera, 'Scale: ' + p['scale'], ENDING]
        jid = p['id'] + '-' + round_tag
        (out / f'{jid}.txt').write_text('\n\n'.join(parts))
        jobs.append({'id': jid, 'ref': str(HERE / 'guides' / f"{p['id']}.png"),
                     'size': '1536x1024' if p.get('hero') else '2048x2048', 'versions': 2})
    (HERE / f'jobs-{round_tag}.json').write_text(json.dumps(jobs, indent=1))
    print(len(jobs), 'jobs,', sum(j['versions'] for j in jobs), 'images')


if __name__ == '__main__':
    {'designer': designer, 'prompts': prompts}[sys.argv[1]](*sys.argv[2:])
