import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';
const base=process.env.APP_URL || 'http://127.0.0.1:4206';
const wording='IN CHERISHED MEMORY OF\nPETER JOHN WILSON\n1939–2021';
const inner='<text x="0" y="-8" text-anchor="middle" font-family="Cinzel" font-size="5.2" fill="currentColor">IN CHERISHED MEMORY OF</text><text x="0" y="2" text-anchor="middle" font-family="Cinzel" font-size="8.2" fill="currentColor">PETER JOHN WILSON</text><text x="0" y="11" text-anchor="middle" font-family="Cinzel" font-size="5.5" fill="currentColor">1939–2021</text>';
const response={text:JSON.stringify({reasoning:'Synthetic progress test.',svgContent:`<svg xmlns="http://www.w3.org/2000/svg" width="105" height="40" viewBox="-52.5 -20 105 40">${inner}</svg>`})};
mkdirSync('output/layout-progress',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/opt/google/chrome/chrome'});
try {
 for(const width of [390,1440]) {
  const page=await browser.newPage({viewport:{width,height:950},reducedMotion:'reduce'});
  const pending=[];let calls=0;const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install();
  await page.route(/googletagmanager|google-analytics|googleadservices/,r=>r.abort());
  await page.route('**/api/**',async route=>{
   const path=new URL(route.request().url()).pathname;
   if(path.startsWith('/api/proof-sessions/'))return route.fulfill({json:{proofSession:{plaque_state:{width:150,height:50,shape:'rect',fixing:'caps',capSize:15,material:'polished-brass',safeMargin:10,wood:false},wording,generated_svg:null}}});
   if(path==='/api/gemini/generate-content') {calls++;return new Promise(resolve=>pending.push(async json=>{await route.fulfill({json});resolve();}));}
   if(path==='/api/gemini/health')return route.fulfill({json:{enabled:true,hasKey:true}});
   return route.fulfill({status:503,json:{error:'Disabled in QA'}});
  });
  await page.goto(base+'/design?proof=progress-qa');
  await page.getByRole('button',{name:'Go to Text',exact:true}).click();
  await page.waitForFunction(t=>document.querySelector('#inscription-wording-input')?.value===t,wording);
  await page.getByRole('button',{name:'Generate layout',exact:true}).click();
  const card=page.getByTestId('layout-progress');await card.waitFor();
  await page.getByText('Creating your lettering layout',{exact:true}).waitFor();
  await page.clock.fastForward(31000);
  await page.getByText(/Still working\. Some layouts take longer/).waitFor();
  assert.ok((await card.innerText()).includes('31s elapsed'));
  const bounds=await card.boundingBox();assert.ok(bounds.x>=0 && bounds.x+bounds.width<=width && bounds.y>=0 && bounds.y+bounds.height<=950);
  assert.equal(await card.locator('.layout-progress-spinner').evaluate(e=>getComputedStyle(e).animationName),'none');
  await page.screenshot({path:`output/layout-progress/${width}-slow.png`});
  assert.equal(calls,1,'No extra request merely because time passed');
  await pending.shift()({text:'{}'});
  await page.getByText('Taking another pass at your layout',{exact:true}).waitFor();
  await page.screenshot({path:`output/layout-progress/${width}-retry.png`});
  assert.equal(calls,2);
  await pending.shift()(response);
  await card.waitFor({state:'detached'});
  await page.getByRole('button',{name:'Tweak manually',exact:true}).waitFor();
  const before=await page.locator('#ai-text-layer').innerHTML();
  await page.locator('#layout-instruction').fill('Make the name slightly larger');
  await page.getByRole('button',{name:'Apply changes',exact:true}).click();
  await page.getByText('Applying your layout changes',{exact:true}).waitFor();
  assert.ok((await card.innerText()).includes('0s elapsed'),'Elapsed timer resets for a new operation');
  await pending.shift()({text:'{}'});
  await page.getByText('Taking another pass at your layout',{exact:true}).waitFor();
  await pending.shift()({text:'{}'});
  await card.waitFor({state:'detached'});
  await page.getByText(/Your previous proof is unchanged/).waitFor();
  assert.equal(await page.locator('#ai-text-layer').innerHTML(),before);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);
  console.log(`${width}px: visible slow status, truthful retry, reduced motion, no duplicate call, completion cleanup, edit timer reset and failure preservation passed`);
  await page.close();
 }
}finally{await browser.close();}
