const {chromium}=require('@playwright/test');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/opt/google/chrome/chrome'});
try {for(const width of [390,1440]) {for(const path of ['/checkout','/design']) {
const page=await browser.newPage({viewport:{width,height:950}}); const errors=[];page.on('pageerror',e=>errors.push(e.message));
const state={width:297,height:210,shape:'rect',material:'polished-brass',fixing:'screws',fixingHoleCount:4,wood:true,generatedSvgContent:'<text x="0" y="0" text-anchor="middle" font-family="Lato" font-size="18" fill="currentColor">THE OLD MILL</text>'};
await page.addInitScript(state=>localStorage.setItem('plaques-ai-mock-orders',JSON.stringify([{id:'return-qa',state}])),state);
let orderReads=0;let proofReads=0;let writes=0;
await page.route(/googletagmanager|google-analytics|googleadservices/,r=>r.abort());
await page.route('**/api/**',async r=>{const u=new URL(r.request().url());if(r.request().method()!=='GET')writes++;
if(u.pathname==='/api/orders/return-qa'){orderReads++;assert.equal(u.searchParams.get('proof'),'synthetic-token');await new Promise(r=>setTimeout(r,150));return r.fulfill({json:{order:{id:'return-qa',inscription:'THE OLD MILL',plaqueState:{...state,generatedSvgContent:null}}}});}
if(u.pathname.startsWith('/api/proof-sessions/'))proofReads++;
if(u.pathname==='/api/proof-sessions')return r.fulfill({json:{proofSession:{public_token:'synthetic-pdf-link'}}});
return r.fulfill({json:{orders:[]}});});
await page.goto((process.env.APP_URL||'http://127.0.0.1:4208')+path+'?stripe=cancelled&order=return-qa&proof=synthetic-token');
await page.getByRole('heading',{name:'Your final review',exact:true}).waitFor();
assert.equal(new URL(page.url()).pathname,'/design');assert.equal(await page.locator('#ai-text-layer').textContent(),'THE OLD MILL');
await page.getByRole('button',{name:'Download proof PDF',exact:true}).waitFor();assert.equal(proofReads,0);assert.equal(writes,0);
await page.reload();await page.getByRole('heading',{name:'Your final review',exact:true}).waitFor({timeout:60000}).catch(async e=>{console.log(await page.locator('body').innerText());throw e;});assert.ok(orderReads>=2);
page.on('dialog',d=>d.accept());const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download proof PDF',exact:true}).click();assert.match((await download).suggestedFilename(),/\.pdf$/);
assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
console.log(width,path,'restores review, exact lettering, refresh and PDF download pass (all API mocked)');await page.close();
}
const page=await browser.newPage({viewport:{width,height:950}});
await page.route('**/api/**',r=>r.fulfill({status:401,json:{error:'Order access required.'}}));await page.goto((process.env.APP_URL||'http://127.0.0.1:4208')+'/design?stripe=cancelled&order=missing&proof=invalid');await page.getByRole('alert').waitFor();assert.equal(await page.getByRole('button',{name:'Download proof PDF',exact:true}).count(),0);await page.close();
}}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
