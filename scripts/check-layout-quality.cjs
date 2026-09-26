const {chromium}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const cases=[
{id:'01-bench-name-caps',width:150,height:50,fixing:'caps',capSize:15,material:'polished-brass',text:'IN CHERISHED MEMORY OF\nPETER JOHN WILSON\n1939–2021'},
{id:'02-bench-long-name',width:150,height:50,fixing:'screws',fixingHoleCount:2,text:'In loving memory of\nElizabeth Alexandra Montgomery\n1942–2025\nAlways in our hearts'},
{id:'03-slim-donation',width:200,height:25,fixing:'screws',fixingHoleCount:2,text:'This bench was donated by\nThe Friends of St Mary’s Park\nJune 2026'},
{id:'04-small-overloaded',width:100,height:25,fixing:'caps',capSize:15,text:'In memory of Margaret and William Thompson\nFor a lifetime of kindness, laughter and love\nForever remembered by all their family and friends'},
{id:'05-deeper-bench-caps',width:150,height:75,fixing:'caps',capSize:15,text:'IN LOVING MEMORY OF\nCHRISTOPHER ANDREW HARRISON\n1951–2024\nA gentle soul, forever loved'},
{id:'06-wide-sentence',width:225,height:75,fixing:'screws',fixingHoleCount:4,text:'For everyone who finds a quiet moment here beside the river, may you leave a little lighter than you came.'},
{id:'07-a5-memorial',width:210,height:148,fixing:'caps',capSize:15,border:true,material:'orbital-brass-matt-lacquer',text:'In loving memory of\nÉlodie O’Neill\n1948–2026\nA much-loved mother, grandmother and friend.\nYour kindness lives on in every life you touched.'},
{id:'08-a4-opening',width:297,height:210,fixing:'screws',fixingHoleCount:4,border:true,designStyle:'institutional',text:'THE WILLOW COMMUNITY CENTRE\nOpened by Councillor Sarah Bennett\n26 September 2026\nBuilt through the generosity of local residents, volunteers and the Friends of Willow Park.\nA place for everyone.'},
{id:'09-heritage-dense',width:210,height:297,fixing:'caps',capSize:15,border:true,material:'aged-brass',designStyle:'heritage-plaque',text:'THE OLD SCHOOL HOUSE\nBuilt in 1876\nFor more than a century this building served the children of the village. Restored in 2026 by the local community, it now welcomes future generations as a place of learning, friendship and discovery.\nRemembering our past. Building our future.'},
{id:'10-business-short',width:200,height:150,fixing:'caps',capSize:15,designStyle:'modern-minimal',text:'WILLOW & STONE\nArchitecture + Interiors'},
{id:'11-oval-garden',width:200,height:120,shape:'oval',fixing:'caps',capSize:15,material:'brushed-brass',text:'THE ROSE GARDEN\nIn memory of our dear friend\nRosemary Anne Clarke\n1936–2024'},
{id:'12-circle-pet',width:150,height:150,shape:'circle',fixing:'screws',fixingHoleCount:2,text:'Our beautiful boy\nMAX\n2011–2025\nSmall paws, enormous love'},
{id:'13-heart-memorial',width:180,height:160,shape:'heart',fixing:'vhb',material:'polished-brass',text:'Forever in our hearts\nAmelia Rose\n2018–2025\nOur brightest little star'},
{id:'14-white-reverse',width:200,height:100,fixing:'screws',fixingHoleCount:4,reverseEtch:true,textColor:'black',designStyle:'modern-minimal',text:'PLEASE CLOSE THE GATE\nChildren and dogs at play\nThank you'},
{id:'15-art-and-text',width:210,height:148,fixing:'caps',capSize:15,memorialImageEnabled:true,memorialImagePlacement:'portrait-left',memorialImageSvg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120"><path d="M50 8 L20 55 H34 L12 90 H43 V112 H57 V90 H88 L66 55 H80 Z" fill="black"/></svg>',text:'In memory of\nDavid James Turner\n1950–2025\nA life rooted in love\nForever part of this place'},
{id:'16-a5-address',width:210,height:148,fixing:'screws',fixingHoleCount:4,designStyle:'classical-formal',text:'THE OLD RECTORY\n17 Church Lane\nPlease leave deliveries by the side door.'}
];
const base=process.env.APP_URL||'http://127.0.0.1:4201';
const upstream=process.env.QA_API_URL||'https://instaplaque.co.uk';
const out=process.env.QA_OUT||'output/layout-quality/before';
if(process.env.LIVE_LAYOUT_QA!=='true' && !process.env.REPLAY_QA)throw Error('Set LIVE_LAYOUT_QA=true for owner-authorised model calls or REPLAY_QA to a prior result directory');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/opt/google/chrome/chrome'});
 try{
 const bootstrap=await browser.newPage();await bootstrap.goto(base+'/design');
 const initial=await bootstrap.evaluate(async()=> (await import('/types.ts')).INITIAL_STATE);await bootstrap.close();
 const results=[];
 for(const c of cases.filter(c=>!process.env.CASE_IDS || process.env.CASE_IDS.split(',').includes(c.id))){
 const page=await browser.newPage({viewport:{width:1100,height:1000}});page.setDefaultTimeout(20000);
 const record={id:c.id,case:c,calls:[],warnings:[],errors:[]};let fixture={...initial,...c};delete fixture.id;delete fixture.text;
 let replay;
 if(process.env.REPLAY_QA){replay=JSON.parse(fs.readFileSync(path.join(process.env.REPLAY_QA,c.id+'.json'),'utf8'));fixture.generatedSvgContent=replay.svg;}
 await page.route('**/api/**',async route=>{
 const u=new URL(route.request().url());
 if(u.pathname.startsWith('/api/proof-sessions/'))return route.fulfill({json:{proofSession:{plaque_state:fixture,wording:c.text,generated_svg:fixture.generatedSvgContent,metadata:{layoutIsCurrent:true}}}});
 if(u.pathname==='/api/gemini/generate-content'){
 if(process.env.LIVE_LAYOUT_QA!=='true')throw Error('Unexpected generation in replay');
 const payload=route.request().postDataJSON();console.log(c.id,'model request',record.calls.length+1);
 const res=await fetch(upstream+u.pathname,{method:'POST',headers:{'Content-Type':'application/json',Origin:upstream,'Sec-Fetch-Site':'same-origin'},body:JSON.stringify(payload),signal:AbortSignal.timeout(90000)});const responseText=await res.text();let responseBody;try{responseBody=JSON.parse(responseText)}catch{responseBody={error:`Model endpoint returned HTTP ${res.status}: ${responseText.slice(0,150)}`}};
 record.calls.push({status:res.status,request:payload,response:responseBody});fs.writeFileSync(path.join(out,c.id+'-responses.json'),JSON.stringify(record.calls,null,2));return route.fulfill({status:res.status,json:responseBody});}
 if(u.pathname==='/api/gemini/health')return route.fulfill({json:{ok:true,enabled:true,hasKey:true}});
 return route.fulfill({status:503,json:{error:'Disabled in layout visual QA'}});
 });
 await page.route(/googletagmanager|google-analytics|googleadservices/,r=>r.abort());
 page.on('console',m=>{if(m.type()==='warning'||m.type()==='error')record.warnings.push(m.text())});page.on('pageerror',e=>record.errors.push(e.message));
 try{
 await page.goto(base+'/design?proof=layout-quality-'+c.id);
 await page.getByRole('button',{name:'Go to Text',exact:true}).click();
 await page.waitForFunction(text=>document.querySelector('#inscription-wording-input')?.value===text,c.text);
 if(!replay){await page.getByRole('button',{name:'Generate layout',exact:true}).click();
 await page.waitForFunction(()=>!document.querySelector('#inscription-wording-input')?.disabled && [...document.querySelectorAll('button')].some(b=>b.textContent==='Regenerate' || b.textContent==='Generate layout'),{}, {timeout:180000});}
 await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1100);
 record.svg=await page.locator('#ai-text-layer').innerHTML();
 record.measurements=await page.locator('#ai-text-layer').evaluate(el=>{
 const svg=el.ownerSVGElement, transform=svg.getCTM().inverse().multiply(el.getCTM()),b=el.getBBox();
 const box=r=>{const p=new DOMPoint(r.x,r.y).matrixTransform(transform),q=new DOMPoint(r.x+r.width,r.y+r.height).matrixTransform(transform);return {x:p.x,y:p.y,w:q.x-p.x,h:q.y-p.y};};
 const face=svg.querySelector('.cut-line');
 const runs=[...el.querySelectorAll('text')].flatMap(t=>t.children.length?[...t.children]:[t]);
 const shapeOutside=runs.flatMap(t=>{const r=box(t.getBBox());return [[r.x,r.y],[r.x+r.w,r.y],[r.x,r.y+r.h],[r.x+r.w,r.y+r.h]].filter(([x,y])=>face && !face.isPointInFill(new DOMPoint(x,y)));});
 return {shapeOutside,faceFill:face?.getAttribute('fill'),bounds:box(b),fit:[+el.dataset.fitWidth,+el.dataset.fitHeight],lines:[...el.querySelectorAll('text')].map(t=>({text:t.textContent,font:t.getAttribute('font-family'),size:+t.getAttribute('font-size'),bounds:box(t.getBBox())})),hardware:[...svg.querySelectorAll('.fixing > circle:first-child')].map(c=>({x:+c.getAttribute('cx'),y:+c.getAttribute('cy'),r:+c.getAttribute('r')}))};
 });
 record.generated=await page.getByRole('button',{name:'Tweak manually',exact:true}).count()>0;
 record.screenText=await page.locator('body').innerText();record.fallback=/simple layout was used|Model-authored typography failed/.test(record.screenText+record.warnings.join(' '));
 await page.locator('.proofbench-svg-preview').screenshot({path:path.join(out,c.id+'.png')});
 await page.setViewportSize({width:390,height:950});await page.waitForTimeout(950);await page.screenshot({path:path.join(out,c.id+'-mobile.png')});
 record.overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
 }catch(e){record.error=e.message;await page.screenshot({path:path.join(out,c.id+'-error.png')}).catch(()=>{});}
 fs.writeFileSync(path.join(out,c.id+'.json'),JSON.stringify(record,null,2));results.push(record);
 console.log(c.id,JSON.stringify({calls:record.calls.length,fallback:record.fallback,error:record.error,lines:record.measurements?.lines.length,warnings:record.warnings.filter(x=>/typography|classification/.test(x))}));await page.close();
 }
 fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(results.map(({calls,svg,screenText,...r})=>({...r,calls:calls.length})),null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
