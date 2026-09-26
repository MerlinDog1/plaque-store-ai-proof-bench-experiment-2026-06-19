const {chromium}=require('@playwright/test');
const assert=require('node:assert/strict');
const base=process.env.APP_URL||'http://127.0.0.1:4201';
const cases=[
 {id:'deeper-caps',width:150,height:75,shape:'rect',fixing:'caps',capSize:15},
 {id:'deeper-caps-manual',width:150,height:75,shape:'rect',fixing:'caps',capSize:15,inscriptionScale:2.5,inscriptionOffsetX:30,inscriptionOffsetY:30},
 {id:'heart',width:180,height:160,shape:'heart',fixing:'vhb'},
 {id:'heart-manual',width:180,height:160,shape:'heart',fixing:'vhb',inscriptionScale:2.5,inscriptionOffsetX:-30,inscriptionOffsetY:30},
 ...['brushed-stainless','polished-stainless','brushed-brass','polished-brass','orbital-brass-matt-lacquer','aged-brass'].map(material=>({id:'reverse-'+material,width:200,height:100,shape:'rect',fixing:'screws',fixingHoleCount:4,material,reverseEtch:true,textColor:'black'})),
];
const wording='In loving memory of\nCHRISTOPHER ANDREW HARRISON\n1951–2024\nA gentle soul, forever loved';
const generated='<text x="0" y="-24" text-anchor="middle" font-family="EB Garamond" font-size="9" fill="currentColor">In loving memory of</text><text x="0" y="-6" text-anchor="middle" font-family="EB Garamond" font-size="16" font-weight="700" fill="currentColor">CHRISTOPHER ANDREW HARRISON</text><text x="0" y="12" text-anchor="middle" font-family="EB Garamond" font-size="9" fill="currentColor">1951–2024</text><text x="0" y="30" text-anchor="middle" font-family="EB Garamond" font-size="9" fill="currentColor">A gentle soul, forever loved</text>';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||'/opt/google/chrome/chrome',args:['--enable-unsafe-swiftshader']});
 try {for(const width of (process.env.WIDTHS||'390,1440').split(',').map(Number))for(const c of cases.filter(c=>!process.env.CASE_IDS || process.env.CASE_IDS.split(',').includes(c.id))){
 const page=await browser.newPage({viewport:{width,height:1000}});
 await page.route(/googletagmanager|google-analytics|googleadservices/,r=>r.abort());
 await page.route('**/api/**',r=>r.request().url().includes('/proof-sessions/')?r.fulfill({json:{proofSession:{plaque_state:{...c,wood:false,border:false,safeMargin:10},wording,generated_svg:generated,metadata:{layoutIsCurrent:true}}}}):r.fulfill({status:503,json:{error:'Disabled in visual regression'}}));
 await page.goto(base+'/design?proof=visual-regression');
 await page.getByRole('button',{name:'Tweak manually',exact:true}).waitFor();await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(900);
 const metrics=await page.locator('#ai-text-layer').evaluate(el=>{
 const svg=el.ownerSVGElement,m=svg.getCTM().inverse().multiply(el.getCTM()),face=svg.querySelector('.cut-line');
 const runs=[...el.querySelectorAll('text')].flatMap(t=>t.children.length?[...t.children]:[t]);
 const hardware=[...svg.querySelectorAll('.fixing > circle:first-child')].map(h=>({x:+h.getAttribute('cx'),y:+h.getAttribute('cy'),r:+h.getAttribute('r')}));
 const bboxes=runs.map(t=>{const b=t.getBBox(),p=new DOMPoint(b.x,b.y).matrixTransform(m),q=new DOMPoint(b.x+b.width,b.y+b.height).matrixTransform(m);return {x:p.x,y:p.y,right:q.x,bottom:q.y}});
 const outside=bboxes.flatMap(b=>[[b.x,b.y],[b.right,b.y],[b.x,b.bottom],[b.right,b.bottom]].filter(([x,y])=>!face.isPointInFill(new DOMPoint(x,y))));
 const gaps=bboxes.flatMap(b=>hardware.map(h=>Math.hypot(Math.max(b.x-h.x,0,h.x-b.right),Math.max(b.y-h.y,0,h.y-b.bottom))-h.r));
 const overlays=[...svg.querySelectorAll('.visual-effect')].filter(n=>n.tagName==='rect' && n.getAttribute('width')===face.getAttribute('width') && n.getAttribute('height')===face.getAttribute('height'));
 return {outside,gaps,overlays:overlays.length,fill:face.getAttribute('fill'),text:el.textContent,scale:+el.dataset.fitScale};
 });
 assert.equal(metrics.outside.length,0,c.id+' must stay within cut line');
 assert.ok(metrics.gaps.every(g=>g>=2.9),c.id+' must clear hardware: '+metrics.gaps);
 assert.ok(metrics.text.includes('CHRISTOPHER ANDREW HARRISON'));
 if(c.reverseEtch){assert.equal(metrics.overlays,0,'No metal overlay over the reverse-etch face');assert.equal(metrics.fill,'#1a1a1a')}
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 if(process.env.CHECK_3D==='true') {
 await page.getByRole('button',{name:'Expand proof into 3D preview',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.three-plaque-preview')?.dataset.fontsOutlined==='true',{}, {timeout:30000});
 require('node:fs').mkdirSync('output/layout-quality/3d',{recursive:true});
 await page.screenshot({path:`output/layout-quality/3d/${c.id}-${width}.png`});
 }
 console.log(width,c.id,'shape/hardware/contrast checks passed');await page.close();
 }
 if(process.env.CHECK_FAILURE==='true'){
 const page=await browser.newPage({viewport:{width:390,height:1000}});
 const text='In memory of Margaret and William Thompson\nFor a lifetime of kindness, laughter and love\nForever remembered by all their family and friends';
 await page.route('**/api/**',r=>r.request().url().includes('/proof-sessions/')?r.fulfill({json:{proofSession:{plaque_state:{width:100,height:25,shape:'rect',fixing:'caps',capSize:15,wood:false,border:false},wording:text,metadata:{layoutIsCurrent:false}}}}):r.fulfill({status:503,json:{error:'Synthetic unavailable response'}}));
 await page.goto(base+'/design?proof=overloaded-test');
 await page.getByRole('button',{name:'Go to Text',exact:true}).click();
 await page.waitForFunction(text=>document.querySelector('#inscription-wording-input')?.value===text,text);
 await page.getByRole('button',{name:'Generate layout',exact:true}).click();
 await page.getByRole('status').filter({hasText:'We could not fit this wording'}).waitFor();
 assert.equal(await page.locator('#inscription-wording-input').inputValue(),text);
 assert.equal(await page.getByRole('button',{name:'Tweak manually',exact:true}).count(),0);
 console.log('Impossible small-plate inscription preserves wording and shows persistent readable-fit error, not a false proof');await page.close();
 }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
