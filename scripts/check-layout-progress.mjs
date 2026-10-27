// The wording step's main button and the AI designer's progress shown on the plaque (owner msg 6884, 27 Oct 2026).
// Every model call is mocked in the browser: no AI requests, no writes. APP_URL is a local `node server.mjs` serving
// the build in dist/. Checks, at phone and desktop widths:
// - the main button says "Design my plaque", is on screen without scrolling and makes the layout;
// - the percentage sits over the plaque preview, follows the real stage (spelling, layout, retry), never goes
//   backwards, stays under 100 until the layout arrives, and restarts for a layout change;
// - waiting longer sends no extra request; reduced motion stops the sheen; failures keep the previous proof;
// - the step title repeats the plaque's guide text, and the quiet WhatsApp offer (owner msg 6902) is on screen on the
//   design steps, carries the designer placement, and is not on the review step.
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';
const base=process.env.APP_URL || 'http://127.0.0.1:4206';
const wording='IN CHERISHED MEMORY OF\nPETER JOHN WILSON\n1939–2021';
const inner='<text x="0" y="-8" text-anchor="middle" font-family="Cinzel" font-size="5.2" fill="currentColor">IN CHERISHED MEMORY OF</text><text x="0" y="2" text-anchor="middle" font-family="Cinzel" font-size="8.2" fill="currentColor">PETER JOHN WILSON</text><text x="0" y="11" text-anchor="middle" font-family="Cinzel" font-size="5.5" fill="currentColor">1939–2021</text>';
const layout={text:JSON.stringify({reasoning:'Synthetic progress test.',svgContent:`<svg xmlns="http://www.w3.org/2000/svg" width="105" height="40" viewBox="-52.5 -20 105 40">${inner}</svg>`})};
const proofread={text:JSON.stringify({refinedText:wording})};
mkdirSync('output/layout-progress',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage','--renderer-process-limit=1']});
try {
 for(const width of [390,1440]) {
  const height=width<768?844:950;
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
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
  await page.getByRole('button',{name:'Reject',exact:true}).click(); // the cookie banner covers the footer until answered
  await page.getByRole('button',{name:'Go to Text',exact:true}).click();
  await page.waitForFunction(t=>document.querySelector('#inscription-wording-input')?.value===t,wording);
  await page.getByRole('heading',{name:'Just type your words',exact:true}).waitFor();
  await page.getByText('No layout needed',{exact:true}).waitFor();
  const wa=page.locator('.designer-whatsapp-line');
  assert.equal((await wa.innerText()).trim(),'Or we can design it all for you on WhatsApp');
  assert.equal(await wa.getAttribute('data-contact-placement'),'designer');
  assert.match(await wa.getAttribute('href'),/^https:\/\/wa\.me\/447464843841\?text=/);
  const waBox=await wa.boundingBox();
  assert.ok(waBox && waBox.y>=0 && waBox.y+waBox.height<=height,'The WhatsApp offer is on screen without scrolling');
  const action=page.getByTestId('designer-footer-action');
  assert.equal((await action.innerText()).trim(),'Design my plaque');
  const actionBox=await action.boundingBox();
  assert.ok(actionBox && actionBox.y>=0 && actionBox.y+actionBox.height<=height,'The main button is on screen without scrolling');
  await action.click();
  const overlay=page.getByTestId('layout-progress');await overlay.waitFor();
  const percent=async()=>Number((await overlay.locator('.layout-progress-percent').innerText()).replace('%',''));
  await page.getByText('Checking your spelling',{exact:true}).waitFor();
  const stage=await page.locator('.proofbench-stage').boundingBox();const box=await overlay.boundingBox();
  assert.ok(box.x>=stage.x-1 && box.x+box.width<=stage.x+stage.width+1 && box.y>=stage.y-1 && box.y+box.height<=stage.y+stage.height+1,'Shown over the plaque preview');
  assert.ok(box.y>=0 && box.y+box.height<=height,'On screen');
  const badge=overlay.locator('.layout-progress-badge');const b=await badge.boundingBox();
  assert.equal(await page.evaluate(([x,y])=>!!document.elementFromPoint(x,y)?.closest('.layout-progress-badge'),[b.x+b.width/2,b.y+b.height/2]),true,'The percentage is on top of the plaque, not hidden behind it');
  await page.clock.fastForward(46000);
  await page.getByText('Still working. Some layouts take a little longer.',{exact:true}).waitFor();
  const spelling=await percent();
  assert.ok(spelling>0 && spelling<=24,`The spelling stage stays at or below 24%: ${spelling}`);
  assert.equal((await action.innerText()).trim(),`Designing… ${spelling}%`);
  assert.equal(await action.isDisabled(),true);
  assert.equal(await overlay.locator('.layout-progress-sheen').evaluate(e=>getComputedStyle(e).display),'none','No sheen with reduced motion');
  assert.equal(calls,1,'No extra request merely because time passed');
  await page.screenshot({path:`output/layout-progress/${width}-spelling.png`});
  await pending.shift()(proofread);
  await page.getByText('Designing your layout',{exact:true}).waitFor();
  await page.clock.fastForward(1000);
  const designing=await percent();
  assert.ok(designing>=spelling && designing<=90,`The layout stage stays at or below 90%: ${designing}`);
  assert.equal(calls,2);
  await page.screenshot({path:`output/layout-progress/${width}-designing.png`});
  await pending.shift()({text:'{}'});
  await page.getByText('Taking another pass at your layout',{exact:true}).waitFor();
  assert.equal(calls,3);
  const retry=await percent();
  assert.ok(retry>=designing && retry<100,`Never goes backwards or finishes early: ${retry}`);
  await pending.shift()(layout);
  await overlay.waitFor({state:'detached'});
  await page.getByRole('button',{name:'Tweak manually',exact:true}).waitFor();
  assert.match(await page.locator('.designer-step-footer .designer-continue').innerText(),/Continue to review/);
  await page.screenshot({path:`output/layout-progress/${width}-done.png`});
  const before=await page.locator('#ai-text-layer').innerHTML();
  await page.locator('#layout-instruction').fill('Make the name slightly larger');
  await page.getByRole('button',{name:'Apply changes',exact:true}).click();
  await page.getByText('Applying your layout changes',{exact:true}).waitFor();
  assert.ok(await percent()<=10,'The estimate restarts for a new operation');
  await pending.shift()({text:'{}'});
  await page.getByText('Taking another pass at your layout',{exact:true}).waitFor();
  await pending.shift()({text:'{}'});
  await overlay.waitFor({state:'detached'});
  await page.getByText(/Your previous proof is unchanged/).waitFor();
  assert.equal(await page.locator('#ai-text-layer').innerHTML(),before);
  await page.getByRole('button',{name:'Go to Size/Shape',exact:true}).click();
  await page.locator('.designer-whatsapp-line').waitFor();
  await page.getByRole('button',{name:'Go to Proof',exact:true}).click();
  await page.getByRole('heading',{name:'Your final review',exact:true}).waitFor();
  assert.equal(await page.locator('.designer-whatsapp-line').count(),0,'No WhatsApp offer on the review step');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);
  console.log(`${width}px: button in view, progress over the plaque by stage (${spelling}% → ${designing}% → ${retry}%), no extra calls, reduced motion, completion, restart for edits, failure preservation and the WhatsApp offer passed`);
  await page.close();
 }
}finally{await browser.close();}
