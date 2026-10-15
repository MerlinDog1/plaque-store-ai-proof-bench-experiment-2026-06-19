const {chromium}=require('@playwright/test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/opt/google/chrome/chrome',args:['--enable-unsafe-swiftshader']});
 try {for(const width of [390,1440]) {
 const page=await browser.newPage({viewport:{width,height:1000}});let modelCalls=0;
 await page.route('**/api/gemini/generate-content',async r=>{modelCalls++; const content=r.request().postDataJSON().contents;
 const root=content.match(/<svg xmlns="http:\/\/www.w3.org\/2000\/svg" width="[^"]+" height="[^"]+" viewBox="[^"]+">/)[0];
 await r.fulfill({json:{text:JSON.stringify({svgContent:root+'<text x="0" y="-10" text-anchor="middle" font-family="EB Garamond" font-size="6">IN CHERISHED MEMORY OF</text><text x="0" y="2" text-anchor="middle" font-family="EB Garamond" font-size="9" font-weight="700">PETER JOHN WILSON</text><text x="0" y="14" text-anchor="middle" font-family="EB Garamond" font-size="6">1939–2021</text></svg>',reasoning:'Synthetic screenshot regression'})}});});
 await page.goto((process.env.APP_URL||'http://127.0.0.1:4200')+'/design');
 await page.getByRole('button',{name:/150 x 50 mm/}).click();
 await page.getByRole('button',{name:'Go to Text',exact:true}).click();
 await page.locator('#inscription-wording-input').fill('IN CHERISHED MEMORY OF\nPETER JOHN WILSON\n1939–2021');
 await page.getByRole('button',{name:'Generate layout',exact:true}).click();
 await page.getByRole('button',{name:'Tweak manually',exact:true}).waitFor();
 const generationCalls=modelCalls;
 await page.getByRole('button',{name:/^Go to Fix/ }).click();
 async function measure(label) {
 await page.waitForTimeout(950);
 const m=await page.locator('#ai-text-layer').evaluate(el=>{
 const b=el.getBBox(),svg=el.ownerSVGElement, matrix=svg.getCTM().inverse().multiply(el.getCTM());
 const left=new DOMPoint(b.x,b.y).matrixTransform(matrix).x, right=new DOMPoint(b.x+b.width,b.y+b.height).matrixTransform(matrix).x;
 const hw=[...svg.querySelectorAll('.fixing > circle:first-child')].map(c=>({x:+c.getAttribute('cx'),r:+c.getAttribute('r')}));
 return {left,right,hw,box:+el.dataset.fitWidth,text:el.textContent};
 });
 assert.ok(m.left>=14.95 && m.right<=135.05,JSON.stringify({label,...m}));
 for(const h of m.hw){ const gap=h.x<75?m.left-(h.x+h.r):(h.x-h.r)-m.right;assert.ok(gap>=2.95,`${label}: gap ${gap}mm`); }
 assert.ok(m.text.includes('PETER JOHN WILSON'));
 console.log(width,label,JSON.stringify(m)); return m;
 }
 await page.getByRole('button',{name:/^No fixings/}).click(); const initial=await measure('none');
 await page.getByRole('button',{name:/^Domed cross-head screws/}).click();assert.equal((await measure('two screws')).hw.length,2);
 await page.getByRole('button',{name:'4 holes',exact:true}).click();assert.equal((await measure('four screws')).hw.length,4);
 await page.getByRole('button',{name:/^Decorative caps/}).click();
 await page.getByRole('button',{name:'10mm caps',exact:true}).click();const cap10=await measure('10mm caps');
 await page.getByRole('button',{name:'15mm caps',exact:true}).click();const cap15=await measure('15mm caps');
 assert.ok(cap15.box<cap10.box && cap10.box<initial.box);
 fs.mkdirSync('output/bench-clearance',{recursive:true});await page.screenshot({path:`output/bench-clearance/caps-${width}.png`,fullPage:true});
 await page.getByRole('button',{name:/^Hidden adhesive/}).click();const restored=await measure('adhesive');assert.equal(restored.box,initial.box);assert.equal(modelCalls,generationCalls,'Fixing changes must not call AI again');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.close();
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
