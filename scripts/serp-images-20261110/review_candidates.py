"""Make inspection evidence, using the repository review.py/overlay.py geometry method."""
from pathlib import Path
import json
from PIL import Image,ImageDraw,ImageFont
OUT=Path('/home/coding-agent/workspace/output/instaplaque-serp-images-20261110');WORK=OUT/'work';QA=OUT/'qa';QA.mkdir(exist_ok=True)
f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',24)
for job in ['S','G1','G2']:
 info=json.loads((WORK/'guides'/f'{job}.json').read_text());pts=info.get('plaque_outline',info.get('plaque_corners_tl_tr_br_bl'))
 for path in sorted((WORK/'out').glob(f'{job}.v*.jpg')):
  im=Image.open(path);sx,sy=im.width/info['size'][0],im.height/info['size'][1]
  p=[(x*sx,y*sy) for x,y in pts];xs,ys=zip(*p)
  crop=im.crop((min(xs)-30,min(ys)-30,max(xs)+30,max(ys)+30));crop.save(QA/f'{path.stem}-plaque.jpg',quality=95)
  im.resize((1000,1000)).save(QA/f'{path.stem}-scene.jpg',quality=93)
  ov=im.copy();d=ImageDraw.Draw(ov);d.line(p+[p[0]],fill='red',width=3)
  rail=info.get('rail_face_corners_tl_tr_br_bl')
  if rail:
   for a,b in [(0,1),(3,2)]:d.line([(rail[a][0]*sx,rail[a][1]*sy),(rail[b][0]*sx,rail[b][1]*sy)],fill='blue',width=3)
  ov.resize((1000,1000)).save(QA/f'{path.stem}-overlay.jpg',quality=90)
  bands=im.copy();d=ImageDraw.Draw(bands)
  for ratio,color in [(1200/630,'cyan'),(16/9,'magenta')]:
   y=(im.height-im.width/ratio)/2;d.rectangle((1,y,im.width-2,im.height-y),outline=color,width=3)
  bands.resize((1000,1000)).save(QA/f'{path.stem}-bands.jpg',quality=90)
print('Inspection evidence refreshed')
