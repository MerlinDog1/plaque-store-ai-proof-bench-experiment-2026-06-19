/** Synthetic-only visual evidence. No API can reach a server; all unexpected requests/writes fail. */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const out = process.env.FIXTURE_OUTPUT || 'output/admin-fixtures';
const phase = process.env.FIXTURE_PHASE || 'after';
const root = path.resolve(process.env.FIXTURE_DIST || 'dist');
const now = '2026-11-08T12:00:00Z';
const statuses = ['paid','proof_check','in_production','ready_to_dispatch','dispatched','issue','archived','paid'];
const orders = statuses.map((status,i)=>({id:`IP-26${1048-i}`,customerName:['Alex Morgan','Jamie Taylor','Sam Parker','Robin Ellis','Casey Reed','Drew Brooks','Test Archive','Studio Test'][i],customerEmail:`fixture${i}@example.test`,status,paymentStatus:'paid',fulfilmentStatus:status==='paid'||status==='proof_check'?'not_started':status,totalPence:i===7?100:12900+i*1250,currency:'gbp',productTitle:['Brass memorial plaque','Garden dedication plaque','Stainless steel bench plaque'][i%3],inscription:'THE WILLOW GARDEN\nA place to pause and remember',createdAt:i===5?'2026-10-14T10:00:00Z':`2026-11-0${8-i%5}T10:00:00Z`,paidAt:i===5?'2026-10-14T10:00:00Z':`2026-11-0${8-i%5}T10:00:00Z`,plaqueState:{width:200,height:150,material:'brushed-brass'},metadata:i===7?{checkoutTestPolicy:'one-pound'}:{attribution:{label:'Google search',source:'google_organic'}},shippingAddress:{line1:'12 Example Lane',city:'York',postal_code:'YO1 1AA',country:'GB'},emailEvents:[],events:[{type:'paid',label:'Payment received',at:'2026-11-08T10:00:00Z'},{type:'proof',label:'Approved proof saved',at:'2026-11-08T10:01:00Z'}]}));
const proof='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150" width="200mm" height="150mm"><rect width="200" height="150" fill="white"/><rect x="8" y="8" width="184" height="134" fill="none" stroke="black" stroke-width=".5"/><text x="100" y="65" text-anchor="middle" font-family="Arial" font-size="10">THE WILLOW GARDEN</text><text x="100" y="88" text-anchor="middle" font-family="Arial" font-size="5">A place to pause and remember</text></svg>';
function usage(tests){return {daily:Array.from({length:14},(_,i)=>({day:new Date(Date.UTC(2026,10,8-i)).toISOString().slice(0,10),designer:tests?i%4:18+(i*7)%29,ai:tests?i%3:9+(i*3)%17,layouts_shown:tests?i%2:7+i%9,layouts_failed:i%4===0?2:0,changes_shown:3+i%5,changes_failed:i%5===0?1:0,unfinished:i%3===0?1:0,reasons:i%4===0?{timeout:1,did_not_fit:1}:{},proof_pdf:2+i%3,proof_saved:4+i%4,proof_emailed:i%3,checkouts:i%4,paid:i%3===0?1:0,paid_pence:i%3===0?12900:0,source:i%2?{}:{google_organic:5,google_ads_shopping:4,direct:2},cookie:i%2?{}:{accepted:3,rejected:6,none:2}})),recent:Array.from({length:12},(_,i)=>({time:`2026-11-08T${String(11-Math.floor(i/4)).padStart(2,'0')}:${String(55-i*4).padStart(2,'0')}:00Z`,place:['York, GB','Bristol, GB','London, GB','Edinburgh, GB'][i%4],device:i%3?'mobile':'desktop',source:['google_organic','direct','google_ads_shopping'][i%3],cookie:i%2?'rejected':'accepted',step:['review','wording','backing','material'][i%4],layouts_shown:1+i%3,layouts_failed:i%5===0?1:0,changes_shown:i%2,changes_failed:0,proof:i%3?1:0,checkout_pence:i%4<2?12900:0,paid_pence:i%4===0?12900:0,test_reason:tests?'preview':''}))};}
const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.mp4':'video/mp4'};
(async()=>{
 fs.mkdirSync(`${out}/${phase}`,{recursive:true});
 const server=http.createServer((req,res)=>{let p=decodeURIComponent(new URL(req.url,'http://local').pathname);let file=path.join(root,p);if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');if(!path.extname(p)&&!fs.existsSync(file))file=path.join(root,'index.html');if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({executablePath:'/opt/google/chrome/chrome',args:['--no-sandbox','--disable-dev-shm-usage']});const results=[];
 try{
 const {trackedSearches}=await import('../services/seoRankTracker.mjs');
 for(const width of (process.env.FIXTURE_WIDTHS ? process.env.FIXTURE_WIDTHS.split(',').map(Number) : [1440,390])){
 const page=await browser.newPage({viewport:{width,height:width===390?844:1000},reducedMotion:'reduce'});const unexpected=[];const errors=[];let state='login';let authed=false;
 page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install({time:new Date(now)});
 await page.addInitScript(({trackedSearches})=>{localStorage.setItem('instaplaque-meta-consent','no');localStorage.setItem('instaplaque-statistics-v1','no');localStorage.setItem('instaplaque-seo-rank-snapshots-v1',JSON.stringify([0,1,2,3].map(n=>({date:`2026-11-0${2+n*2}`,importedAt:'2026-11-08',source:'Synthetic',rows:trackedSearches.map((q,i)=>({keywordId:q.id,position:4+i%18-n*.7,clicks:10+i*3,impressions:180+i*70,ctr:4}))}))));HTMLMediaElement.prototype.play=function(){return Promise.resolve();};},{trackedSearches});
 await page.route('**/*',async route=>{const req=route.request(),url=new URL(req.url());
 if(url.origin!==base){ // Deliberate inert mocks for the app's existing analytics/CDN destinations, never forwarded.
 if(/google|facebook|posthog|vercel|jsdelivr|cloudflare|unpkg/.test(url.hostname))return route.fulfill({status:200,contentType:'application/javascript',body:''});
 unexpected.push(req.url());return route.abort();}
 if(req.method()!=='GET'&&!(url.pathname==='/api/admin/session'&&req.method()==='POST')){unexpected.push(req.method()+' '+url.pathname);return route.abort();}
 if(url.pathname.startsWith('/api/')){let body={},status=200;
 if(url.pathname==='/api/admin/auth-config')body={authRequired:true,configured:true,operational:true,status:'configured'};
 else if(url.pathname==='/api/admin/session'){if(req.method()==='POST')authed=true;status=authed?200:401;}
 else if(url.pathname==='/api/admin/orders'){if(state==='loading'){return;}if(state==='error'){status=503;body={error:'The order list took too long to load. Please retry.'};}else body={orders:state==='empty'?[]:orders};}
 else if(url.pathname.startsWith('/api/admin/orders/')){const order=orders.find(o=>o.id===url.pathname.split('/').at(-1));if(!order){unexpected.push(url.pathname);return route.abort();}body={order:{...order,proofPackage:{visualProofSvg:proof,productionFilename:'synthetic-production.pdf'}}};}
 else if(url.pathname==='/api/admin/usage')body=usage(url.searchParams.get('tests')==='1');
 else if(url.pathname==='/api/ai/health')body={ok:true};
 else{unexpected.push(req.method()+' '+url.pathname);return route.abort();}
 return route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});}
 if(url.pathname.startsWith('/_vercel/'))return route.fulfill({status:200,contentType:'application/javascript',body:''});
 return route.continue();});
 const capture=async name=>{await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(300);await page.screenshot({path:`${out}/${phase}/${name}-${width}.png`,fullPage:true,animations:'disabled'});const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);results.push({name,width,overflow});if(phase==='after')assert.equal(overflow,false,name+' overflow');};
 if(!process.env.FIXTURE_PUBLIC_ONLY){
 await page.goto(base+'/admin');await page.getByLabel('Admin passcode').waitFor();await capture('login');if(phase==='after'){await page.getByLabel('Admin passcode').focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');const focus=await page.getByLabel('Admin passcode').evaluate(el=>({id:document.activeElement.id,outline:getComputedStyle(el).outlineWidth}));assert.equal(focus.id,'admin-passcode');assert.equal(focus.outline,'3px');results.push({width,keyboardLogin:focus});}
 await page.getByLabel('Admin passcode').fill('fixture-only');await page.getByRole('button',{name:'Unlock orders'}).click();await page.locator('.admin-console__order-row').first().waitFor();await capture('orders');
 await page.locator('.admin-console__order-row').first().click();await page.locator('.admin-console__detail:visible').waitFor();await capture('detail');
 if(width===1440&&process.env.PDF_LIB_DIR){for(const name of ['opentype','jspdf','svg2pdf'])await page.addScriptTag({path:path.join(process.env.PDF_LIB_DIR,name+'.js')});const [download]=await Promise.all([page.waitForEvent('download',{timeout:60000}),page.getByRole('button',{name:'Download production artwork',exact:true}).filter({visible:true}).click()]);await download.saveAs(`${out}/${phase}/production.pdf`);fs.writeFileSync(`${out}/${phase}/export-renderer.json`,JSON.stringify(await page.locator('.admin-console__export-source').evaluate(el=>({html:el.innerHTML,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})),null,2));}
 if(phase==='after'){const detail=page.locator('.admin-console__detail:visible');if(width<=1100)await detail.getByText('More actions',{exact:true}).click();for(const label of ['Mark proof checked','Mark in production + email','Mark ready to dispatch','Mark dispatched + email','Download production artwork','Download approved proof','Send review follow-up','Resend confirmation','Resend proof email','Put on hold','Archive test/order'])assert(await detail.getByRole('button',{name:label,exact:true}).isVisible(),label);const first=detail.getByRole('button',{name:'Mark proof checked',exact:true});await first.focus();const order=[];for(let i=0;i<7;i++){order.push(await page.evaluate(()=>document.activeElement.textContent.trim()));await page.keyboard.press('Tab');}assert.deepEqual(order,['Mark proof checked','Mark in production + email','Mark ready to dispatch','Mark dispatched + email','Download production artwork','Download approved proof',width<=1100?'More actions':'Resend confirmation']);results.push({width,actionTabOrder:order});}
 await page.getByRole('button',{name:'Search position',exact:true}).click();await page.getByRole('heading',{name:'25-search position tracker'}).waitFor();await capture('search');
 await page.getByRole('button',{name:'Designer use',exact:true}).click();await page.locator('.designer-use table').waitFor();await capture('usage-customers');
 if(await page.getByRole('button',{name:'Our tests',exact:true}).count())await page.getByRole('button',{name:'Our tests',exact:true}).click();else await page.locator('.designer-use input[type=checkbox]').check();await page.locator('.designer-use table').waitFor();await capture('usage-tests');
 for(const next of ['error','empty','loading']){state=next;await page.goto(base+'/admin');if(next==='empty')await page.getByText('No matching orders.',{exact:true}).waitFor();if(next==='error')await page.getByText('Orders unavailable',{exact:true}).waitFor();if(next==='loading')await page.waitForTimeout(400);await capture(next);}
 }
 for(const [name,url]of (process.env.FIXTURE_ADMIN_ONLY ? [] : [['home','/'],['design','/design'],['product','/aged-brass-200x150-rect-plaque']])){state='public';await page.goto(base+url);await page.waitForTimeout(5500);await capture(name);}
 assert.deepEqual(unexpected,[],'Unexpected requests');assert.deepEqual(errors,[],'Browser errors');await page.close();
 }
 fs.writeFileSync(`${out}/${phase}/${process.env.FIXTURE_PUBLIC_ONLY ? 'public-results' : 'results'}.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
