// Authorized local-only live-model proof; never submits checkout or email.
import {chromium} from '@playwright/test';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const out=process.env.USAGE_EVIDENCE;
assert.ok(out);const origin='http://127.0.0.1:4196';
const browser=await chromium.launch({headless:true,executablePath:'/opt/google/chrome/chrome'});
const evidence={calls:[],events:[],errors:[],pdf:false};let calls=0,last=0;
try {
 const context=await browser.newContext({viewport:{width:900,height:850},acceptDownloads:true});
 await context.route('**/*',async route=>{
  const req=route.request(),u=new URL(req.url());
  if(u.origin!==origin && !['data:','blob:'].includes(u.protocol)) {
   if(['fonts.googleapis.com','fonts.gstatic.com','cdn.jsdelivr.net','cdnjs.cloudflare.com','unpkg.com'].includes(u.hostname)) return route.continue();
   return route.abort();
  }
  if(u.pathname.startsWith('/_vercel/')) return route.fulfill({contentType:'application/javascript',body:''});
  if(/stripe\/checkout-session|proof-sessions\/email|design-requests/.test(u.pathname))throw Error('Forbidden QA side effect: '+u.pathname);
  if(u.pathname==='/api/gemini/generate-content') {
   if(++calls>Number(process.env.USAGE_AI_REMAINING || 0))throw Error('AI budget exhausted');
   const wait=Math.max(0,21000-(Date.now()-last));if(wait)await new Promise(r=>setTimeout(r,wait));last=Date.now();
   evidence.calls.push({n:calls,step:req.headers()['x-instaplaque-step'],time:new Date(last).toISOString(),visit:req.headers()['x-instaplaque-visit'],operation:req.headers()['x-instaplaque-operation']});
   fs.writeFileSync(out+'/local-e2e.json',JSON.stringify(evidence,null,2));
  }
  if(u.pathname==='/api/usage') evidence.events.push(req.postDataJSON());
  return route.continue();
 });
 const page=await context.newPage();page.on('response',r=>{if(r.url().includes('/api/gemini/generate-content'))console.log('AI response',r.status());});page.on('pageerror',e=>evidence.errors.push(e.message));page.on('dialog',async d=>{evidence.errors.push('Dialog: '+d.message());await d.dismiss();});
 await page.goto(origin+'/design?utm_source=cody-usage&utm_medium=test&utm_campaign=usage-qa');
 await page.getByRole('button',{name:'Reject',exact:true}).click();
 await page.getByRole('button',{name:/A4 landscape/}).click();
 await page.getByRole('button',{name:'Go to Text',exact:true}).click();
 await page.locator('#inscription-wording-input').fill('THE TEST GARDEN\nOPENED 2026');
 await page.getByRole('button',{name:'Design my plaque',exact:true}).first().click();
 await page.getByRole('button',{name:'Tweak manually',exact:true}).waitFor({timeout:180000});
 await page.getByRole('button',{name:'Tweak manually',exact:true}).click();
 await page.locator('#layout-instruction').fill('Make the title a little larger while keeping both lines centred.');
 await page.getByRole('button',{name:'Apply changes',exact:true}).click();
 await page.getByText('Layout updated. Your wording is unchanged. Check the proof or undo this change.').waitFor({timeout:180000});
 console.log('AI change displayed');
 await page.getByRole('button',{name:'Go to Proof',exact:true}).click();
 await page.getByRole('checkbox',{name:/I have checked the wording/}).check();
 const download=page.waitForEvent('download',{timeout:120000});
 await page.getByRole('button',{name:'Download proof PDF',exact:true}).click();
 const file=await download;assert.match(file.suggestedFilename(),/\.pdf$/i);evidence.pdf=true;
 await page.waitForTimeout(2500);
 assert.ok(evidence.events.some(e=>e.event==='layout_result' && e.details.kind==='layout' && e.details.outcome==='shown'));
 assert.ok(evidence.events.some(e=>e.event==='layout_result' && e.details.kind==='change' && e.details.outcome==='shown'));
 assert.ok(calls>=3 && calls<=8);assert.deepEqual(evidence.errors,[]);
 console.log('PASS real local layout + change + PDF;',calls,'AI calls, >=21 seconds apart; no checkout/email.');
} finally {fs.writeFileSync(out+'/local-e2e.json',JSON.stringify(evidence,null,2));await browser.close();}
