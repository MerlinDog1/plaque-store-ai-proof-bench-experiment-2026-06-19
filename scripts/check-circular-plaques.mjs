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
  let ovalHardwareCases=0;
  for (const [width,height] of [[50,600],[600,50],[100,300],[300,100],[148,210],[210,148],[200,300],[300,200]])
  for (const fixing of [Fixing.Screws,Fixing.Caps]) for (const capSize of [10,15])
  for (const border of [false,true]) for (const borderStyle of Object.values(BorderStyle))
  for (const wood of [false,true]) {
    const oval={...INITIAL_STATE,shape:Shape.Oval,width,height,fixing,capSize,border,borderStyle,wood,fixingHoleCount:4};
    const hardware=getFixingGeometry(oval), holes=getFixingPositions(oval), offset=wood?12.5:0;
    assert.equal(normalizeCurvedFixings(oval).fixingHoleCount,2);
    assert.equal(holes.length,2,'Every oval, including a restored four-hole proof, has two fixings');
    assert.equal(holes[0].y,offset+height/2);
    assert.equal(holes[1].y,offset+height/2);
    assert(Math.abs(holes[0].x+holes[1].x-width-offset*2)<0.000001,'Oval fixings stay symmetric');
    for (const hole of holes) for(let degrees=0;degrees<360;degrees++) {
      const angle=degrees*Math.PI/180;
      const x=(hole.x+(hardware.fixingRadius+2)*Math.cos(angle)-offset-width/2)/(width/2);
      const y=(hole.y+(hardware.fixingRadius+2)*Math.sin(angle)-offset-height/2)/(height/2);
      assert(x*x+y*y<=1.00000001,'The entire oval fixing plus 2mm clearance must remain on the metal');
    }
    ovalHardwareCases++;
  }
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
  let ovalCases = 0;
  for (const [width,height] of [[300,200],[200,300],[300,100],[100,300]])
  for (const wood of [false,true]) for (const fixing of [Fixing.None,Fixing.Screws,Fixing.Caps]) {
    const oval = {...state,shape:Shape.Oval,width,height,wood,fixing};
    const area = getInscriptionLayout(oval);
    const inset = Math.min(width,height)*0.1;
    assert.equal(area.textEllipse,true,'Text-only ovals must fit against an ellipse');
    assert.equal(area.textCx,width/2+(wood?12.5:0));
    assert.equal(area.textCy,height/2+(wood?12.5:0));
    assert.equal(area.textH,height-2*inset);
    const hardware=getFixingGeometry(oval);
    const hardwareInset=fixing===Fixing.None?0:hardware.holeInset+hardware.fixingRadius+3;
    const oldWidth=width-2*Math.max(Math.min(width,height)*0.16,hardwareInset);
    assert(area.textW>=oldWidth,'Oval text retains any width needed for hardware clearance');
    assert(area.textH>height-2*Math.min(width,height)*0.16,'Oval text gains height over the old reserved box');
    assert.equal(getInscriptionLayout({...oval,memorialImageEnabled:true}).textEllipse,undefined,'Oval artwork keeps its reserved layout');
    const ovalPrompt=buildTypographyPrompt('Sample',width,height,Shape.Oval,DesignStyle.Auto,{width:area.textW,height:area.textH,ellipse:true});
    assert(ovalPrompt.includes('OVAL WRAPPING'));
    assert(ovalPrompt.includes(width>height?'landscape oval':'upright oval'));
    assert(!ovalPrompt.includes('centre of the circle'));
    for (const [offsetX,offsetY] of [[0,0],[area.textW*0.1,area.textH*0.1],[-area.textW*0.1,-area.textH*0.1]]) {
      const s=fitTextToEllipse(lines,bounds,area.textW,area.textH,3,offsetX,offsetY);
      assert(s>0,'Wide and upright oval text must remain visible');
      for(const b of lines) for(const x of [b.x,b.x+b.width]) for(const y of [b.y,b.y+b.height]) {
        const px=x*s+offsetX, py=(y-1.5)*s+offsetY;
        assert(px**2/(area.textW/2)**2+py**2/(area.textH/2)**2<=1.00000001,'Every oval line corner clears the inner ellipse');
        assert(px**2/(width/2)**2+py**2/(height/2)**2<1,'Every oval line corner stays on the metal');
        for (const hole of getFixingPositions(oval)) {
          const distance=Math.hypot(px+area.textCx-hole.x,py+area.textCy-hole.y);
          assert(distance>=getFixingGeometry(oval).fixingRadius+3-0.00001,'Oval text clears the side hardware');
        }
      }
    }
    ovalCases++;
  }
  assert.equal(getInscriptionLayout({...state,shape:Shape.Rect}).textEllipse,false);
  console.log(`${cases} round hardware cases, ${ovalHardwareCases} oval fixing/clearance cases and ${ovalCases} wide/upright oval layouts passed.`);
} finally {await renderer.close();}
