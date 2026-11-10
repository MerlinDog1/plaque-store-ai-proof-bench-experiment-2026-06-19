"""Colour-segment plate faces near coded positions; save measured-outline overlays for manual verification."""
from pathlib import Path
import json, math
import numpy as np
from scipy import ndimage
from PIL import Image,ImageDraw
OUT=Path('/home/coding-agent/workspace/output/instaplaque-serp-images-20261110');allm={}
for p in sorted((OUT/'work/out').glob('*.jpg')):
 im=Image.open(p).convert('RGB');a=np.array(im).astype(float);h,w=a.shape[:2];job=p.stem.split('.')[0]
 info=json.loads((OUT/'work/guides'/f'{job}.json').read_text());points=info.get('plaque_outline',info.get('plaque_corners_tl_tr_br_bl'));xs,ys=zip(*points)
 box=[int(min(xs)*w/1024)-15,int(min(ys)*h/1024)-15,int(max(xs)*w/1024)+15,int(max(ys)*h/1024)+15]
 r,g,b=a[:,:,0],a[:,:,1],a[:,:,2]
 if job=='G2':mask=(r-b>38)&(g-b>22)&(r>105)
 else:mask=(abs(r-g)<12)&(abs(g-b)<12)&(a.min(2)>95)
 clip=np.zeros((h,w),bool);clip[box[1]:box[3],box[0]:box[2]]=True;mask &= clip
 mask=ndimage.binary_closing(mask,iterations=2);labels,n=ndimage.label(mask);counts=np.bincount(labels.ravel());counts[0]=0
 mask=ndimage.binary_fill_holes(labels==counts.argmax());yy,xx=np.where(mask);bbox=[int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)]
 bw,bh=bbox[2]-bbox[0],bbox[3]-bbox[1];ratio=bw/bh;true={'S':150/65,'G1':210/148,'G2':1}[job]
 bandtop=(h-w*630/1200)/2
 margins=[bbox[0]/w,(w-bbox[2])/w,(bbox[1]-bandtop)/h,(h-bandtop-bbox[3])/h]
 tilt=None
 if job!='G2':
  columns=np.arange(bbox[0]+bw//10,bbox[2]-bw//10)
  tops=np.array([np.where(mask[:,x])[0][0] for x in columns])
  bottoms=np.array([np.where(mask[:,x])[0][-1] for x in columns])
  tilt=round(math.degrees(math.atan((np.polyfit(columns,tops,1)[0]+np.polyfit(columns,bottoms,1)[0])/2)),3)
 data=dict(tilt_degrees=tilt,native=[w,h],bbox=bbox,ratio=round(ratio,5),ratio_error_percent=round(abs(ratio/true-1)*100,3),width_percent=round(bw/w*100,3),og_min_margin_frame_percent=round(min(margins)*100,3),provisional=True)
 allm[p.stem]=data
 d=ImageDraw.Draw(im);d.rectangle(bbox,outline='lime',width=2);im.resize((1000,1000)).save(OUT/'qa'/f'{p.stem}-measured.jpg',quality=92)
print(json.dumps(allm,indent=2));(OUT/'provisional-measurements.json').write_text(json.dumps(allm,indent=2))
