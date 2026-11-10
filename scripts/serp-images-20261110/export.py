"""Export only visually accepted masters/crops and a faithful owner-screenshot SERP sheet."""
from pathlib import Path
import json, importlib.util, shutil, subprocess
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[2]
OUT=Path('/home/coding-agent/workspace/output/instaplaque-serp-images-20261110');PHOTOS=OUT/'photos';PHOTOS.mkdir(exist_ok=True)
spec=importlib.util.spec_from_file_location('publisher',ROOT/'scripts/publish-codex-photos.py');publisher=importlib.util.module_from_spec(spec);spec.loader.exec_module(publisher)
reviews=json.loads((OUT/'measurements.json').read_text());kept=[k for k,v in reviews.items() if v['kept']]
written=[]
for k in kept:
 im=Image.open(OUT/'work/out'/f'{k}.jpg').convert('RGB')
 p=PHOTOS/f'{k}-master.jpg';shutil.copy2(OUT/'work/out'/f'{k}.jpg',p);written.append(str(p))
 for name,h in [('1x1',1200),('4x3',900),('16x9',675),('og',630)]:
  height=im.width*h/1200;top=(im.height-height)/2
  crop=im.resize((1200,h),Image.Resampling.LANCZOS,box=(0,top,im.width,top+height))
  for ext,q in [('jpg',90),('webp',85)]:
   p=PHOTOS/f'{k}-{name}.{ext}';crop.save(p,quality=q,**({'subsampling':0} if ext=='jpg' else {'method':6}));written.append(str(p))
publisher.tag(written)
metadata=json.loads(subprocess.check_output(['exiftool','-json','-DigitalSourceType',*written],text=True));assert len(metadata)==len(written)
assert all(x.get('DigitalSourceType')==publisher.AI for x in metadata)
(OUT/'iptc-verification.json').write_text(json.dumps(metadata,indent=2))
# Exact title, URL, snippet and price pixels from the owner's screenshots; only thumbnail is substituted.
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';bold='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
F=lambda n,b=False:ImageFont.truetype(bold if b else font,n)
blocks=[]
def textblock(text,height=68,size=27,b=False):
 im=Image.new('RGB',(800,height),'#f4f6f4');ImageDraw.Draw(im).text((24,16),text,font=F(size,b),fill='#183b30');blocks.append(im)
def card(page,k=None):
 src=OUT/'owner-screens'/('serp-now-stainless-150x65.jpg' if page=='S' else 'serp-now-garden.jpg')
 im=Image.open(src).convert('RGB')
 # Screen is tightly cropped around the result; remove only its outer one-pixel screenshot edge.
 im=im.crop((1,1,799,im.height-1)).resize((800,im.height),Image.Resampling.LANCZOS)
 if k:
  if page=='S':box=(508,234,772,498)
  else:
   white=Image.new('RGB',(800,515),'white');white.paste(im,(0,0));im=white;box=(508,234,772,498)
   ImageDraw.Draw(im).rectangle((0,482,799,514),fill='white')
   ImageDraw.Draw(im).rectangle((505,233,775,502),fill='white')
  thumb=Image.open(PHOTOS/f'{k}-1x1.jpg').resize((264,264),Image.Resampling.LANCZOS)
  mask=Image.new('L',(264,264));ImageDraw.Draw(mask).rounded_rectangle((0,0,263,263),radius=15,fill=255);im.paste(thumb,box[:2],mask)
 blocks.append(im)
def photo(k):
 im=Image.new('RGB',(800,532),'#f4f6f4');im.paste(Image.open(PHOTOS/f'{k}-1x1.jpg').resize((500,500),Image.Resampling.LANCZOS),(150,16));blocks.append(im)
textblock('InstaPlaque · Search image choices',76,31,True)
textblock('Photo choices only · not published',54,23)
for page,title in [('S','1. Stainless bench plaque · 150 × 65 mm'),('G','2. Garden memorial plaques')]:
 textblock(title,80,29,True);textblock('Now · your Google screenshot',58,25,True);card(page)
 for k in kept:
  if (page=='S' and k.startswith('S.')) or (page=='G' and k.startswith('G')):
   textblock(f'{k} · candidate thumbnail',64,28,True);card(page,k);photo(k)
textblock('Same result copy and prices as your screenshots.',52,23)
textblock('Candidate views are mock-ups, not live Google results.',58,22)
sheet=Image.new('RGB',(800,sum(b.height for b in blocks)),'white');y=0
for b in blocks:sheet.paste(b,(0,y));y+=b.height
sheet.save(OUT/'SERP-SHEET.jpg',quality=92,subsampling=0)
sheet.save(PHOTOS/'SERP-SHEET.jpg',quality=92,subsampling=0)
print(json.dumps({'kept':kept,'exports':len(written),'sheet':sheet.size,'IPTC':'verified'},indent=2))
