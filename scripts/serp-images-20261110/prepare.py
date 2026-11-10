"""Prepare six subscription-only thumbnail candidates; no public files or site changes."""
from pathlib import Path
import shutil, importlib.util, json, copy
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
OUT=Path('/home/coding-agent/workspace/output/instaplaque-serp-images-20261110')
WORK=OUT/'work'
OLD=Path('/home/coding-agent/workspace/output/instaplaque-garden-real-20261025')
for d in ['', 'metal','guides','prompts','out']: (WORK/d).mkdir(parents=True, exist_ok=True)
for name in ['run_batch.py','bench.py','bench_scene.py','garden.py','garden_scene.py']:
 shutil.copy2(ROOT/'scripts/real-photos'/name,WORK/name)
for name in ['offers.json','wording.json']: shutil.copy2(OLD/name,WORK/name)
def load(name):
 spec=importlib.util.spec_from_file_location(name,WORK/f'{name}.py'); mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);return mod
bench=load('bench');garden=load('garden');bs=load('bench_scene');gs=load('garden_scene')
# Crop only the surrounding whitespace from the product's own current designer drawing.
# These are its original four cross-head screws, border, line breaks and letterforms.
src=OUT/'live/brushed-stainless-150x65-rect-plaque.jpg'
Image.open(src).crop((70,455,1430,1045)).save(WORK/'metal/S.png')
shutil.copy2(OLD/'metal/garden-hero.png',WORK/'metal/G1.png')
# This is the saved round-2 redraw with smooth flat caps, not the round-1 slotted screws.
shutil.copy2(OLD/'metal/brushed-brass-200x200-circle-plaque.png',WORK/'metal/G2.png')
S=dict(id='S',offer='brushed-stainless-150x65-rect-plaque',guide=dict(size=[1024,1024],lens=70,yaw=0,pitch_rel=0,level=True,frac=.60,bench=dict(bench.GARDEN,rail_h=110)))
G1=copy.deepcopy(next(p for p in garden.PHOTOS if p['id']=='garden-hero'));G1.update(id='G1');G1['guide']=dict(size=[1024,1024],lens=70,yaw=0,frac=.50)
G2=copy.deepcopy(next(p for p in garden.PHOTOS if p['id']=='brushed-brass-200x200-circle-plaque'));G2.update(id='G2');G2['guide']=dict(size=[1024,1024],lens=70,yaw=0,frac=.40)
bs.guide(S,WORK/'guides');gs.guide(G1,WORK/'guides');gs.guide(G2,WORK/'guides')
common='Output one SQUARE 1:1 photograph, 2048 x 2048. Bright natural soft daylight, high-contrast BLACK paint-filled engraved lettering. No people, hands, other text, logos or watermark. Follow the supplied measured coded layout EXACTLY. The plaque must be centred horizontally and vertically. Camera square-on to its face, no perspective narrowing, no tilt. Preserve the precise width/height ratio and plate outline in the guide. Keep all plate edges and fixings inside the centred 1.91:1 band AND centred 16:9 band with at least 6% of the whole square frame as clear margin on all sides. Do not zoom in or out; do not enlarge the plaque. This is for a small Google thumbnail, so make the metal luminous and legible against the background. Real photographic texture and subtle natural reflections, not a render or a pasted graphic. Every date separator is the EN DASH “–”, not a hyphen or a long em dash.'
sp='\n\n'.join([common,bench.GUIDE,bench.THIN,bench.NEW_BENCH,bench.METAL.format(finish=bench.FINISH['brushed-stainless']), 'A real brushed stainless steel rectangular plate, precisely 150 x 65 mm, width/height 2.307692. It fills exactly 60% of the frame width and 26% of its height. A single thin BLACK engraved rectangular border and FOUR small low cross-head stainless screws exactly as the reference, one near each corner. This is NOT the two-hole 150x50 product. Preserve the exact relative line sizes, spacing and font from the reference. Exact text (four lines):\nIn loving memory of\nNORMA BRADSHAW\n1922 – 2009\nSit and rest awhile', 'On the centre of the top rail of a well-kept honey-coloured wooden garden bench. Rail 110 mm tall, plate 65 mm tall; keep its position and perfectly level alignment with the rail. The upper rail edge must be visible. Behind the bench: real softly out-of-focus green garden foliage and pink/white flowers, visibly natural soft daylight, gently blurred background, no view or scenery drama. The bench is cared for, clean and lightly used.'])
for p,border,word,around in [(G1,'scalloped','In loving memory of\nSUSAN MARSH\n1951 – 2022','Old soft red brick garden wall with pale lime mortar, UK bricks 215x65 mm +10mm joints. A climbing rose is IN FLOWER, with natural soft pink roses and green leaves near both sides of the plaque. Put clearly visible blooms near x=12% and x=85%, y=42–58% of the square so they remain visible in both the square and central 1.91:1 crops. Do not cover any metal or lettering. Plaque exactly 50% frame width and 35.24% frame height.'),(G2,'double','In loving memory of\nMAY\nATHERTON\n1924 – 2019','A cared-for blue-grey painted timber garden gate with vertical 95 mm tongue-and-groove boards and real wood grain. Flowering pink and white climbing roses with fresh green leaves frame it naturally at the sides, with blooms beside the plaque within the central horizontal band. No flowers obscure the plaque. The brass circle is a mathematically TRUE CIRCLE, exactly as wide as tall, diameter exactly 40% of the square frame. No oval shape, no perspective distortion. Two SMALL FLAT SMOOTH brass disc caps at left and right, absolutely no slots, no cross-heads, no domes. Keep its double thin engraved circular border.')]:
 o=garden.OFFERS[p['offer']]
 prompt='\n\n'.join([common,garden.GUIDE.format(surface=p['units'],where=p['where']),garden.plaque(o,border),garden.THIN.format(where=p['where']),bench.METAL.format(finish=bench.FINISH[o['material']]), 'Preserve every letter and the exact font, line sizes and spacing of the supplied artwork. Exact text:\n'+word,around])
 (WORK/'prompts'/f"{p['id']}.txt").write_text(prompt)
(WORK/'prompts/S.txt').write_text(sp)
jobs=[dict(id=j,ref=str(WORK/'guides'/f'{j}.png'),size='2048x2048',versions=2) for j in ['S','G1','G2']]
(WORK/'jobs.json').write_text(json.dumps(jobs,indent=2))
(OUT/'job-specs.json').write_text(json.dumps([S,G1,G2],indent=2))
print('Prepared six generations, unchanged subscription runner, no site/public changes.')
