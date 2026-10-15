import assert from 'node:assert/strict';
import {createServer} from 'vite';
const vite=await createServer({server:{middlewareMode:true,hmr:false},optimizeDeps:{noDiscovery:true,include:[]},appType:'custom'});
try{
 const {getInscriptionLayout}=await vite.ssrLoadModule('/services/inscriptionLayout.ts');
 const {getFixingGeometry}=await vite.ssrLoadModule('/services/fixingGeometry.ts');
 const {Shape,Fixing,BorderStyle,MemorialImagePlacement}=await vite.ssrLoadModule('/types.ts');
 let n=0;
 for(const [width,height] of [[150,50],[200,50],[200,25],[100,25],[50,150]])
 for(const fixing of [Fixing.None,Fixing.VHB,Fixing.Screws,Fixing.Caps])
 for(const capSize of [10,15])
 for(const borderStyle of Object.values(BorderStyle))
 for(const image of [false,true]){
 const s={width,height,shape:Shape.Rect,fixing,capSize,border:true,borderStyle,safeMargin:10,wood:false,memorialImageEnabled:image,memorialImagePlacement:MemorialImagePlacement.PortraitRight,memorialImageScale:1};
 const box=getInscriptionLayout(s,'PETER JOHN WILSON');
 const left=box.textCx-box.textW/2,right=box.textCx+box.textW/2;
 if(fixing===Fixing.Screws||fixing===Fixing.Caps){const h=getFixingGeometry(s);if(height>width && fixing===Fixing.Caps){assert.ok(box.textCy-box.textH/2>=h.holeInset+h.fixingRadius+3-1e-8);assert.ok(box.textCy+box.textH/2<=height-h.holeInset-h.fixingRadius-3+1e-8);n++;continue;}assert.ok(left>=h.holeInset+h.fixingRadius+3-1e-8,JSON.stringify({s,box,h}));assert.ok(right<=width-h.holeInset-h.fixingRadius-3+1e-8);}
 assert.ok(box.textW>0&&box.textH>0);n++;
 }
 const base={width:297,height:210,shape:Shape.Rect,fixing:Fixing.None,capSize:10,border:false,safeMargin:10,wood:false,memorialImageEnabled:false};
 assert.equal(getInscriptionLayout(base).textW,255,'Non-bench margin remains unchanged');
 console.log(n,'bench shape/hardware/border/artwork clearance combinations passed; A4 unchanged');
}finally{await vite.close()}
