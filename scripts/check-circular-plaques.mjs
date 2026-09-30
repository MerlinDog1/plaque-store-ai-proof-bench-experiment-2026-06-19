import assert from 'node:assert/strict';
import {createServer} from 'vite';
const renderer = await createServer({server:{middlewareMode:true,hmr:false},optimizeDeps:{noDiscovery:true,include:[]},appType:'custom'});
try {
  const {INITIAL_STATE, Shape, Fixing, BorderStyle, DesignStyle} = await renderer.ssrLoadModule('/types.ts');
  const {getFixingPositions, getFixingGeometry} = await renderer.ssrLoadModule('/services/fixingGeometry.ts');
  const {normalizeCurvedFixings} = await renderer.ssrLoadModule('/services/plaqueRules.ts');
  const {getInscriptionLayout} = await renderer.ssrLoadModule('/services/inscriptionLayout.ts');
  const {fitTextToEllipse} = await renderer.ssrLoadModule('/services/circularTextFit.ts');
  const {buildTypographyPrompt} = await renderer.ssrLoadModule('/services/typographyPrompt.ts');
  let cases = 0;
  for (const shape of [Shape.Circle, Shape.Oval]) for (const width of [80,150,210,300])
  for (const fixing of [Fixing.Screws,Fixing.Caps]) for (const borderStyle of Object.values(BorderStyle))
  for (const wood of [false,true]) {
    const state = {...INITIAL_STATE,shape,width,height:shape===Shape.Circle?width:width*0.7,fixing,fixingHoleCount:4,border:true,borderStyle,wood,capSize:15};
    assert.equal(normalizeCurvedFixings(state).fixingHoleCount,2);
    const holes = getFixingPositions(state), hardware = getFixingGeometry(state), offset = wood?12.5:0;
    assert.equal(holes.length,2,'Restored four-hole round proofs must have two side fixings');
    for (const hole of holes) for (let angle=0; angle<Math.PI*2;angle+=Math.PI/32) {
      const x=(hole.x+hardware.fixingRadius*Math.cos(angle)-offset-width/2)/(width/2);
      const y=(hole.y+hardware.fixingRadius*Math.sin(angle)-offset-state.height/2)/(state.height/2);
      assert(x*x+y*y<1,'Entire fixing must sit inside the metal');
    }
    cases++;
  }
  assert.equal(getFixingPositions({...INITIAL_STATE,shape:Shape.Rect,width:210,height:148,fixing:Fixing.Screws,fixingHoleCount:4}).length,4);
  assert.equal(getFixingPositions({...INITIAL_STATE,shape:Shape.Heart,fixing:Fixing.Screws}).length,0);
  const state={...INITIAL_STATE,shape:Shape.Circle,width:210,height:210,safeMargin:10,memorialImageEnabled:false,fixing:Fixing.Screws};
  const layout=getInscriptionLayout(state);
  assert.equal(layout.textEllipse,true);
  assert.equal(layout.textW,168);
  assert.equal(getInscriptionLayout({...state,memorialImageEnabled:true}).textEllipse,undefined,'Artwork layout must keep its existing reserved box');
  const lines=[{x:-35,y:-65,width:70,height:10},{x:-60,y:-43,width:120,height:14},{x:-30,y:-20,width:60,height:8},{x:-70,y:0,width:140,height:10},{x:-65,y:20,width:130,height:10},{x:-45,y:40,width:90,height:10},{x:-20,y:60,width:40,height:8}];
  const bounds={x:-70,y:-65,width:140,height:133};
  const previousScale=Math.min(210*0.68/bounds.width,210*0.68/bounds.height);
  const scale=fitTextToEllipse(lines,bounds,168,168,Math.min(168/bounds.width,168/bounds.height,3));
  assert(scale>previousScale*1.08,'A tapered inscription should gain usable space over the old square');
  for (const offsetX of [-20,0,20]) for (const offsetY of [-20,0,20]) {
    const s=fitTextToEllipse(lines,bounds,168,168,3,offsetX,offsetY);
    for(const b of lines) for(const x of [b.x,b.x+b.width]) for(const y of [b.y,b.y+b.height])
      assert(((x)*s+offsetX)**2/84**2+((y-1.5)*s+offsetY)**2/84**2<=1.00000001,'Every line corner must clear the curved boundary after moving');
  }
  const prompt=buildTypographyPrompt('A sample memorial',210,210,Shape.Circle,DesignStyle.Auto,{width:168,height:168,ellipse:true});
  assert(prompt.includes('CIRCULAR WRAPPING'));
  assert(!buildTypographyPrompt('Sample',210,148,Shape.Rect,DesignStyle.Auto,{width:168,height:108}).includes('CIRCULAR WRAPPING'));
  console.log(`${cases} round hardware cases, legacy fixing correction, rectangle preservation, curved text containment and larger usable layout passed.`);
} finally {await renderer.close();}
