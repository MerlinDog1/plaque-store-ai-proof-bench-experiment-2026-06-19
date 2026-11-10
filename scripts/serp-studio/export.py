"""Deterministic studio-photo derivatives. Never generates or enlarges artwork.
Usage: python3 scripts/serp-studio/export.py OUTPUT_DIRECTORY
Sources are always the published studio-photo originals. Search files are separate from feed/page images.
"""
from pathlib import Path
import importlib.util,json,subprocess,sys,os
import numpy as np
from PIL import Image,ImageDraw,ImageFont
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('publisher',ROOT/'scripts/publish-codex-photos.py');publisher=importlib.util.module_from_spec(spec);spec.loader.exec_module(publisher)
OUT=Path(sys.argv[1]);OUT.mkdir(parents=True,exist_ok=True)
slugs=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {studioPhotos} from './services/studioPhotos.mjs';import {merchantOffers} from './services/merchantCatalogue.mjs';console.log(JSON.stringify(merchantOffers.filter(o=>studioPhotos.has(o.slug)).map(o=>o.slug)))"],cwd=ROOT,text=True))
ST='brushed-stainless-150x65-rect-plaque';OAK='brushed-brass-210x148-rect-light-wood-plaque';CIRCLE='brushed-brass-200x200-circle-plaque'
records=[];written=[]
def padded(im,size,slug):
 # Entire source fits inside 86% of canvas height and width: >=7% margin even if plate touches source edges.
 w,h=size;s=min(.86*w/im.width,.86*h/im.height,1);nw,nh=round(im.width*s),round(im.height*s)
 src=np.asarray(im.resize((nw,nh),Image.Resampling.LANCZOS)).astype(float);x=(w-nw)//2;y=(h-nh)//2
 # Extend the photographed backdrop; plate pixels are never enlarged or cropped.
 a=np.asarray(im).astype(float);n=24
 corners=np.array([np.median(a[:n,:n],axis=(0,1)),np.median(a[:n,-n:],axis=(0,1)),np.median(a[-n:,:n],axis=(0,1)),np.median(a[-n:,-n:],axis=(0,1))])
 yy,xx=np.mgrid[:h,:w];tx=np.clip((xx-x)/max(1,nw-1),0,1)[...,None];ty=np.clip((yy-y)/max(1,nh-1),0,1)[...,None]
 bg=(corners[0]*(1-tx)+corners[1]*tx)*(1-ty)+(corners[2]*(1-tx)+corners[3]*tx)*ty
 # Extend the actual four studio-background edges, not a differently coloured rectangle.
 # Where a circle touches an edge, interpolate the backdrop behind that tiny foreground segment.
 from scipy.ndimage import gaussian_filter1d
 edges=[src[0,:,:],src[-1,:,:],src[:,0,:],src[:,-1,:]]
 refs=[bg[y,x:x+nw],bg[y+nh-1,x:x+nw],bg[y:y+nh,x],bg[y:y+nh,x+nw-1]]
 for k,(edge,ref) in enumerate(zip(edges,refs)):
  edge=edge.copy();good=np.ones(len(edge),dtype=bool)
  if '-circle-' in slug and (k<2 or np.min(edge[len(edge)//2])<160):
   good &= (np.arange(len(edge))<len(edge)*.42)|(np.arange(len(edge))>len(edge)*.58)
  if good.sum()>2:
   for channel in range(3):edge[:,channel]=np.interp(np.arange(len(edge)),np.where(good)[0],edge[good,channel])
  edges[k]=edge
 sx=np.clip(xx-x,0,nw-1);sy=np.clip(yy-y,0,nh-1)
 dx=np.maximum.reduce([x-xx,xx-(x+nw-1),np.zeros_like(xx)]);dy=np.maximum.reduce([y-yy,yy-(y+nh-1),np.zeros_like(yy)])
 dist=np.maximum(dx,dy);outside=dist>0
 for band in range(0,21):
  select=outside&(np.minimum(20,dist//12)==band)
  if not np.any(select):continue
  smooth=[gaussian_filter1d(e,max(.5,band*.8),axis=0) for e in edges]
  horizontal=np.where((yy[select]<y)[:,None],smooth[0][sx[select]],smooth[1][sx[select]]);vertical=np.where((xx[select]<x)[:,None],smooth[2][sy[select]],smooth[3][sy[select]])
  mix=np.where((dy[select]>=dx[select])[:,None],horizontal,vertical)
  blend=np.clip(dist[select]/240,0,1)[:,None];blend=blend*blend*(3-2*blend)
  bg[select]=mix*(1-blend)+bg[select]*blend
 if slug in {'brushed-brass-200x200-circle-plaque','aged-brass-200x200-circle-plaque','polished-stainless-200x200-circle-plaque'}:
  # These circles are tangent to their square source at top/bottom.
  # Preserve each complete silhouette over one smooth backdrop.
  from scipy.ndimage import binary_fill_holes,binary_dilation,label
  if slug=='brushed-brass-200x200-circle-plaque':
   foreground=(a[:,:,0]-a[:,:,2]>42)|(a.mean(axis=2)<130)
   labels,count=label(foreground);sizes=np.bincount(labels.ravel());sizes[0]=0
   mask=binary_dilation(binary_fill_holes(labels==sizes.argmax()),iterations=5)
  else:
   # These two 1200-square originals have a complete, centred circle tangent
   # to the frame. A geometric silhouette also retains bright silver, unlike
   # the warm/dark colour classifier. Five source pixels of protective bleed
   # preserve the rim, antialiasing and both fixings; never crop or enlarge it.
   my,mx=np.mgrid[:im.height,:im.width]
   mask=((mx-im.width/2)/(im.width/2+5))**2+((my-im.height/2)/(im.height/2+5))**2<=1
  alpha=np.asarray(Image.fromarray((mask*255).astype('uint8')).resize((nw,nh),Image.Resampling.LANCZOS)).astype(float)[...,None]/255
  # Bilinear backdrop is continuous across all four source boundaries.
  bg=(corners[0]*(1-tx)+corners[1]*tx)*(1-ty)+(corners[2]*(1-tx)+corners[3]*tx)*ty
  bg[y:y+nh,x:x+nw]=src*alpha+bg[y:y+nh,x:x+nw]*(1-alpha)
 else:
  bg[y:y+nh,x:x+nw]=src

 return Image.fromarray(np.clip(bg,0,255).astype('uint8')),{'treatment':'pad','scale':s,'sourceFrame':[x,y,nw,nh],'minimumMargin':min(x/w,y/h,(w-x-nw)/w,(h-y-nh)/h)}
for slug in sorted(slugs):
 if os.environ.get('FILTER') and slug not in os.environ['FILTER'].split(','):continue
 source=ROOT/'public/site-images/studio-photo'/f'{slug}.webp';im=Image.open(source).convert('RGB')
 assert publisher.AI.encode() in source.read_bytes(),slug
 versions=[('og',630,'jpg',90)]
 if slug in [ST,OAK,CIRCLE]:versions=[('1x1',1200,'webp',85),('4x3',900,'webp',85),('16x9',675,'webp',85),*versions]
 for version,h,ext,q in versions:
  if slug==ST:
   top=(im.height-h)//2;crop=im.crop((0,top,1200,top+h));geometry={'treatment':'centre crop' if h<1200 else 'original square','scale':1,'plateBounds':[80,385-top,1120,837-top],'minimumMargin':min(80/1200,(385-top)/h,(h-(837-top))/h)}
  else:crop,geometry=padded(im,(1200,h),slug)
  assert geometry['scale']<=1 and geometry['minimumMargin']>=.06,(slug,geometry)
  target=OUT/f'{slug}-{version}-v1.{ext}';crop.save(target,quality=q,**({'subsampling':0} if ext=='jpg' else {'method':6}));written.append(str(target))
  records.append({'slug':slug,'version':version,'file':target.name,'width':1200,'height':h,'format':'JPEG' if ext=='jpg' else 'WEBP',**geometry})
publisher.tag(written)
metadata=json.loads(subprocess.check_output(['exiftool','-json','-DigitalSourceType',*written],text=True));assert all(m['DigitalSourceType']==publisher.AI for m in metadata)
(OUT/('partial-manifest.json' if os.environ.get('FILTER') else 'manifest.json')).write_text(json.dumps(records,indent=2));(OUT/'iptc-verification.json').write_text(json.dumps(metadata,indent=2))
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',13)
for batch in range(0,len(slugs),30):
 sheet=Image.new('RGB',(1500,6*190),'white');d=ImageDraw.Draw(sheet)
 for i,slug in enumerate(sorted(slugs)[batch:batch+30]):
  img=Image.open(OUT/f'{slug}-og-v1.jpg');img.thumbnail((290,153),Image.Resampling.LANCZOS);x=(i%5)*300;y=(i//5)*190;sheet.paste(img,(x,y));d.text((x+2,y+154),slug[:36],font=font,fill='black');d.text((x+2,y+170),slug[36:],font=font,fill='black')
 sheet.save(OUT/f'contact-{batch//30+1}.jpg',quality=90)
print(json.dumps({'studioProducts':len(slugs),'files':len(records),'paddedPhotos':len(slugs)-1,'allDimensionsMarginsAndIPTC':'PASS'}))
