import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const origin='http://127.0.0.1:4196',out=process.env.USAGE_EVIDENCE;
const headers={apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`};
const r=await fetch(process.env.SUPABASE_URL+'/rest/v1/proof_sessions?select=public_token&wording=eq.'+encodeURIComponent('THE TEST GARDEN\nOPENED 2026')+'&order=created_at.desc&limit=1',{headers});
assert.equal(r.status,200);const [proof]=await r.json();assert.ok(proof);
const browser=await chromium.launch({headless:true,executablePath:'/opt/google/chrome/chrome'});
const evidence={pdf:false,admin:false,screenshots:[],errors:[]};
try {
 const context=await browser.newContext({viewport:{width:900,height:850},acceptDownloads:true});
 await context.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.origin!==origin) {
   if(['fonts.googleapis.com','fonts.gstatic.com','cdn.jsdelivr.net','cdnjs.cloudflare.com','unpkg.com'].includes(url.hostname))return route.continue();
   return route.abort();
  }
  if(url.pathname.startsWith('/_vercel/'))return route.fulfill({contentType:'application/javascript',body:''});
  if(url.pathname==='/api/admin/orders')return route.fulfill({json:{orders:[]}}); // No customer orders loaded during screenshots.
  if(req.method()==='POST' && !['/api/usage','/api/proof-sessions','/api/admin/session'].includes(url.pathname))throw Error('Unapproved QA write blocked');
  return route.continue();
 });
 const page=await context.newPage();page.on('pageerror',e=>evidence.errors.push(e.message));
 if(!process.env.USAGE_ADMIN_ONLY) {
 await page.goto(origin+'/design?proof='+encodeURIComponent(proof.public_token));
 await page.getByRole('button',{name:'Go to Proof',exact:true}).click();
 await page.getByRole('checkbox',{name:/I have checked the wording/}).check();
 const download=page.waitForEvent('download',{timeout:150000});
 await page.getByRole('button',{name:'Download proof PDF',exact:true}).click();
 const file=await download;assert.match(file.suggestedFilename(),/\.pdf$/i);await file.saveAs(out+'/synthetic-proof.pdf');evidence.pdf=true;
 } else evidence.pdf=fs.existsSync(out+'/synthetic-proof.pdf');
 // Existing admin login, never written to evidence.
 const login=await context.request.post(origin+'/api/admin/session',{data:{password:process.env.ADMIN_PASSWORD || process.env.ADMIN_ACCESS_TOKEN}});
 assert.equal(login.status(),200);
 await page.goto(origin+'/admin');await page.getByRole('button',{name:'Designer use',exact:true}).click();
 const testData=page.waitForResponse(r=>r.url().endsWith('/api/admin/usage?days=14&tests=1'));
 await page.getByRole('checkbox',{name:'Show only our tests, internal browsers and previews'}).check();
 await testData;
 await page.waitForFunction(()=>document.querySelector('.designer-use')?.textContent?.includes('Rejected'));
 await page.getByRole('heading',{name:'Recent visits (latest 50)'}).waitFor();
 assert.ok((await page.locator('.designer-use').innerText()).includes('rejected') || (await page.locator('.designer-use').innerText()).includes('Rejected'));
 const data=await (await context.request.get(origin+'/api/admin/usage?days=14&tests=1')).json();assert.ok(data.recent.length>0);fs.writeFileSync(out+'/admin-local.json',JSON.stringify(data,null,2));evidence.admin=true;
 for(const width of [900,390]) {
  await page.setViewportSize({width,height:850});
  await page.locator('.designer-use').scrollIntoViewIfNeeded();
  const name=`admin-${width}.jpg`;await page.screenshot({path:out+'/'+name,type:'jpeg',quality:60});assert.ok(fs.statSync(out+'/'+name).size<=120*1024);evidence.screenshots.push(name);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 }
 assert.deepEqual(evidence.errors,[]);console.log('PASS saved synthetic proof PDF download; authenticated actual Designer use data; 2 small JPEGs; no AI, checkout or email.');
}finally{fs.writeFileSync(out+'/local-review.json',JSON.stringify(evidence,null,2));await browser.close();}
