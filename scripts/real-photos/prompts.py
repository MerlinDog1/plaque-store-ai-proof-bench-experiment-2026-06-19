"""Write one Codex prompt and one reference image per photo in specs.py, plus jobs.json for run_batch.py.
Usage: python3 -I prompts.py
"""
import json
import re
import sys
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from specs import SPECS, PRODUCTS, PORTRAITS  # noqa: E402

sys.path.insert(0, '/home/coding-agent/workspace/projects/instaplaque-contact-followups')
PIM = Path('/home/coding-agent/workspace/output/instaplaque-tree-portraits-pim')

MATERIAL = {
    'brushed-stainless': 'brushed stainless steel: silver-grey with a fine horizontal brushed grain and soft satin reflections, never gold and never a chrome mirror',
    'polished-stainless': 'mirror-polished stainless steel: bright silver, reflecting its surroundings in soft, believable bands, with no brush grain',
    'brushed-brass': 'brushed brass: warm satin gold with a fine horizontal brushed grain and low glare',
    'polished-brass': 'polished brass: bright, mirror-like warm gold that reflects its surroundings',
    'aged-brass': 'mid aged brass: warm brown-gold with an even, intentional factory patina, smooth, clean and low-glare',
}
FIXING = {
    'caps4': 'four flat round caps in the same metal, one in each corner: thin flat discs like small coins, not domed',
    'caps2': 'two flat round caps in the same metal, one at each end on the centre line: thin flat discs like small coins, not domed',
    'screws2': 'two small domed cross-head screws in the same metal, one at each end on the centre line',
}
BORDER = {
    'double': 'a double engraved border line near the edge',
    'single': 'a single engraved border line',
    'scalloped': 'one engraved border line with scalloped corners that curve inward around each corner cap',
}
ENDING = ('It must look like a real photograph of a real object in a real place: not a 3D render, not an illustration, '
          'not a composite. Avoid a flat pasted-on look, perfectly even lighting on the plate, plastic-looking metal or wood, '
          'domed or button-shaped caps, a dead-straight frontal view, perfect symmetry, oversaturated colours, extra or '
          'misspelled text, logos, watermarks, people or hands.')
LAYOUT = ('The attached image is our flat design artwork of this exact plaque, seen straight on. It is a layout guide, not a '
          'photo and not a picture to paste in. Make the real plaque match it exactly in layout: the same wording with the '
          'same line breaks, the same letter shapes and relative sizes, the same spacing, the same position of the text on '
          'the plate, the same border and the same fixing positions{wood}. Do not copy the artwork\'s flat colours, outlines, '
          'even lighting or straight-on view: the photo shows the real materials, in real light, from the camera position '
          'described below.')


def plaque_sentence(material, w, h, shape, board, fixing, border, text):
    shape_word = {'oval': 'oval', 'circle': 'round'}.get(shape, 'rectangular')
    fill = 'warm cream paint' if text == 'cream' else 'black paint'
    s = (f'a real {shape_word} plate of {MATERIAL[material]}, {w} x {h} mm and 2 mm thick, with {BORDER[border]}, held by '
         f'{FIXING[fixing]}. The lettering and border are deeply engraved and filled with {fill}: crisp, very slightly '
         f'recessed, with tiny bright edges where the light catches the cut metal.')
    if board:
        tone = 'dark walnut' if board == 'dark' else 'light oak'
        s += (f' The plate is mounted on a solid {tone} backing board {w + 25} x {h + 25} mm and about 20 mm thick, with a '
              f'neatly bevelled front edge and real wood grain, showing an even margin of wood about 12 mm wide all round the plate.')
    return s


def wording(lines):
    return '\n'.join(f'"{text}"' for role, text in lines if role != 'gap')


def ref(src, dst):
    im = Image.open(src).convert('RGB')
    im.thumbnail((1024, 1024), Image.LANCZOS)
    im.save(dst)
    return str(dst)


def main():
    from services_offers import offers  # noqa: E402  (written below: product presets as JSON)
    out = HERE / 'prompts'
    out.mkdir(exist_ok=True)
    refs = HERE / 'refs'
    jobs = []
    for spec in SPECS:
        p = spec['plate']
        body = '\n\n'.join([
            f'A real, unretouched photograph of a memorial plaque in place. {spec["story"]} Shot handheld on a full-frame '
            f'camera, natural light, true-to-life colours, a little natural grain, no filters, no HDR, no retouching. Landscape 3:2.',
            LAYOUT.format(wood=' and the same even margin of wood around the plate' if p['board'] else ''),
            'The plaque: ' + plaque_sentence(p['material'], p['w'], p['h'], 'rect', p['board'], p['fixing'], p['border'], p['text']),
            'The wording, exactly as in the artwork, and nothing else written anywhere in the photo:\n' + wording(spec['lines']),
            'Where it is: ' + spec['scene'],
            'Camera: ' + spec['camera'],
            'Scale: ' + spec['scale'],
            ENDING])
        (out / f'{spec["id"]}.txt').write_text(body)
        jobs.append({'id': spec['id'], 'ref': ref(HERE / 'coded' / f'{spec["id"]}.png', refs / f'{spec["id"]}.png'),
                     'size': '1536x1024', 'versions': spec['versions']})
    for prod in PRODUCTS:
        o = offers[prod['id']]
        board = o['woodTone'] if o.get('wood') else None
        border = prod['overrides'].get('borderStyle', o['borderStyle'])
        fixing = 'screws2' if o['fixing'] == 'screws' else ('caps2' if o['fixingHoleCount'] == 2 else 'caps4')
        camera = re.sub(r'The plaque takes up about [^.]*\.', 'The plaque is the clear subject and takes up about half of the square frame.', prod['camera'])
        body = '\n\n'.join([
            'Output: one SQUARE 1:1 photograph (equal width and height).',
            f'A real, unretouched photograph of a memorial plaque in place, for its product page on a UK plaque maker\'s website. '
            f'{prod["story"]} Shot handheld on a full-frame camera, natural light, true-to-life colours, a little natural grain, '
            f'no filters, no HDR, no retouching.',
            LAYOUT.format(wood=' and the same even margin of wood around the plate' if board else ''),
            'The plaque: ' + plaque_sentence(o['material'], o['width'], o['height'], o['shape'], board, fixing, border, o['textColor']),
            'The wording, exactly as in the artwork, and nothing else written anywhere in the photo:\n' + wording(prod['lines']),
            'Where it is: ' + prod['scene'],
            'Camera: ' + camera,
            'Scale: ' + prod['scale'],
            ENDING])
        (out / f'{prod["id"]}.txt').write_text(body)
        jobs.append({'id': prod['id'], 'ref': ref(HERE / 'refs' / f'{prod["id"]}.png', refs / f'{prod["id"]}.png'),
                     'size': '2048x2048', 'versions': 2})
    for por in PORTRAITS:
        words = json.load(open(PIM / 'photo-wording.json'))
        entry = next(e for e in words if e['slug'] == por['stencil'].split('/')[-1][:-4])
        body = '\n\n'.join([
            'Output: one SQUARE 1:1 photograph (equal width and height).',
            f'A real, unretouched photograph of an engraved portrait memorial plaque in place. {por["story"]} Shot handheld on a '
            f'full-frame camera, natural light, true-to-life colours, a little natural grain, no filters, no HDR, no retouching.',
            ('The attached image is the finished artwork of this exact plaque, seen straight on: ' + por['plate_desc'] + '. '
             'It is the layout and engraving guide, not a picture to paste in. The engraved portrait must match it exactly: the '
             'same face, expression, hair, clothing, background and every engraved line, as a fine black-filled etching in the '
             'metal. The wording, border, caps and margin of oak must match too. Do not copy the artwork\'s flat colours or even '
             'lighting: the photo shows the real metal and oak in real light.'),
            'The wording, exactly as in the artwork (same lettering, italic lines and line breaks), and nothing else written '
            'anywhere in the photo:\n' + wording([tuple(l) for l in entry['lines']]),
            'The plaque: the A5 plate (210 x 148 mm) has four flat round caps in the same metal, one in each corner: thin flat '
            'discs like small coins, not domed. The board is solid light oak, 235 x 173 mm and about 20 mm thick, with a '
            'bevelled edge and real grain. Any ground stake is ONE chunky black powder-coated square steel bar about 30 mm '
            'thick, fixed by a bracket to the middle of the back of the board and pushed straight into the ground.',
            'Where it is: ' + por['scene'],
            'Camera: close, about 60 cm away, at the height of the plaque, looking at it almost straight on with an 85 mm lens. '
            'The plaque is the clear subject and fills about 60% of the square frame; the face in the portrait and every line '
            'of the wording are sharp; the setting behind is softly out of focus.',
            'Scale: the oak board is only 235 x 173 mm, the size of a hardback book. Keep it true to that size.',
            ENDING])
        (out / f'{por["id"]}.txt').write_text(body)
        jobs.append({'id': por['id'], 'ref': ref(PIM / por['stencil'], refs / f'{por["id"]}.png'), 'size': '2048x2048', 'versions': 2})
    (HERE / 'jobs.json').write_text(json.dumps(jobs, indent=1))
    print(len(jobs), 'jobs,', sum(j['versions'] for j in jobs), 'images')


if __name__ == '__main__':
    main()
