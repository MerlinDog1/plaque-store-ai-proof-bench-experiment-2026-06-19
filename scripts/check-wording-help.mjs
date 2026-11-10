// Browser regression checks: all AI/API traffic is mocked; no writes or real AI requests.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from '@playwright/test';
const base=process.env.APP_URL||'http://127.0.0.1:4262';
const out=process.env.WORDING_OUT||'output/wording-help'; fs.mkdirSync(out,{recursive:true});
const baseline=process.env.WORDING_BASELINE==='1';
const evidence={baseline,cases:[],passed:false};
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||'/opt/google/chrome/chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
const words='In loving memory of Arthur Bell 1932 – 2023 Forever in our hearts';
const key='instaplaque-wording-explainer-v1';
async function setup(width=390,{reducedMotion='no-preference',touch=true,saveData=false}={}){
 const context=await browser.newContext({viewport:{width,height:width===360?740:width===1440?1000:844},hasTouch:touch,reducedMotion,serviceWorkers:'block'});
 await context.addInitScript(({saveData})=>{
  localStorage.setItem('instaplaque-statistics-v1','no');localStorage.setItem('instaplaque-meta-consent','no');
  if(saveData)Object.defineProperty(navigator,'connection',{value:{saveData:true},configurable:true});
  const vv=new EventTarget();Object.assign(vv,{height:innerHeight,width:innerWidth,offsetTop:0,offsetLeft:0,scale:1,pageTop:0,pageLeft:0});Object.defineProperty(window,'visualViewport',{value:vv,configurable:true});
  window.__keyboard=(height,offsetTop=0)=>{Object.assign(vv,{height,offsetTop});vv.dispatchEvent(new Event('resize'));vv.dispatchEvent(new Event('scroll'));};
 },{saveData});
 let calls=0;const requests=[];
 await context.route('**/*',async r=>{
  const u=new URL(r.request().url());if(u.origin!==new URL(base).origin)return r.fulfill({status:200,body:''});
  if(u.pathname.startsWith('/api/')){
   if(u.pathname==='/api/gemini/generate-content'){
    calls++; await new Promise(resolve=>setTimeout(resolve,200));
    const requestText=JSON.stringify(r.request().postDataJSON()).replaceAll('\\"','"');
    const root=requestText.match(/<svg xmlns="http:\/\/www.w3.org\/2000\/svg" width="[^"]+" height="[^"]+" viewBox="[^"]+">/)?.[0];
    return r.fulfill({json:{text:JSON.stringify(calls%2?{refinedText:words}:{reasoning:'Mocked wording-help check',svgContent:(root||'<svg xmlns="http://www.w3.org/2000/svg" width="147" height="103.6" viewBox="-73.5 -51.8 147 103.6">')+'<text x="0" y="-20" text-anchor="middle" fill="currentColor" font-family="Cinzel" font-size="5">In loving memory of</text><text x="0" y="-5" text-anchor="middle" fill="currentColor" font-family="Cinzel" font-size="8">Arthur Bell</text><text x="0" y="10" text-anchor="middle" fill="currentColor" font-family="Cinzel" font-size="5">1932 – 2023</text><text x="0" y="25" text-anchor="middle" fill="currentColor" font-family="Cinzel" font-size="5">Forever in our hearts</text></svg>'})}});
   }
   return r.fulfill({json:{enabled:true,hasKey:true}});
  }
  return r.continue();
 });
 const page=await context.newPage();page.on('request',r=>{if(/wording-explainer/.test(r.url()))requests.push(r.url());});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 return {context,page,requests,errors,get calls(){return calls;}};
}
async function open(s,path='/design'){await s.page.goto(base+path,{waitUntil:'networkidle'});const reject=s.page.getByRole('button',{name:'Reject',exact:true});if(await reject.isVisible())await reject.click();}
async function wording(s){await s.page.getByRole('button',{name:'Go to Text',exact:true}).click();await s.page.locator('#inscription-wording-input').waitFor();}
async function rect(locator){return locator.evaluate(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom};});}
try{
 if(baseline){
  for(const width of [390,360]){const s=await setup(width);await open(s);await wording(s);const input=s.page.locator('#inscription-wording-input');await input.fill(words);await s.page.evaluate(()=>window.__keyboard(innerHeight-320));await s.page.waitForTimeout(250);const row={width,keyboardTop:width===360?420:524,input:await rect(input),panel:await rect(s.page.getByTestId('design-layout-button')),footer:await rect(s.page.getByTestId('designer-footer-action'))};evidence.cases.push(row);await s.page.screenshot({path:`${out}/baseline-${width}.png`});await s.context.close();}
 }else{
  if(!process.env.WORDING_KEYBOARD_ONLY){
  const s=await setup();await open(s,'/');assert.equal(s.requests.length,0,'Homepage must not request clip or poster');await open(s);
  for(const step of ['Size/Shape','Material','Colour','Fixings and border','Wood']){await s.page.getByRole('button',{name:'Go to '+step,exact:true}).click();await s.page.waitForTimeout(100);assert.equal(s.requests.length,0,step+' must not request media');}
  await wording(s);const demo=s.page.getByTestId('wording-help');await demo.locator('video').waitFor();await s.page.waitForFunction(()=>document.querySelector('[data-testid="wording-help"] video')?.currentTime>0.1);assert.equal(await s.page.evaluate(k=>sessionStorage.getItem(k),key),'yes');
  await demo.waitFor({state:'detached',timeout:12000});
  await s.page.getByRole('button',{name:'Go to Wood',exact:true}).click();await wording(s);assert.equal(await demo.count(),0);
  await s.page.reload({waitUntil:'networkidle'});await wording(s);assert.equal(await demo.count(),0,'Reload same visit must not replay');
  await s.page.getByRole('button',{name:'How it works',exact:true}).click();await demo.locator('video').waitFor();await s.page.locator('#inscription-wording-input').fill('Arthur');await demo.waitFor({state:'detached'});
  await s.page.getByRole('button',{name:'How it works',exact:true}).click();await demo.waitFor();await s.page.getByRole('button',{name:'Skip',exact:true}).click();assert.equal(await demo.count(),0);
  await s.page.getByRole('button',{name:'How it works',exact:true}).click();await s.page.getByRole('button',{name:'Go to Wood',exact:true}).click();assert.equal(await demo.count(),0);
  evidence.cases.push({case:'lazy/once/end/reopen/reload/replay/type/skip/leave',pass:true,requests:s.requests});assert.deepEqual(s.errors,[]);await s.context.close();
  for(const options of [{},{reducedMotion:'reduce'},{saveData:true}]){const t=await setup(390,options);await open(t);await wording(t);const d=t.page.getByTestId('wording-help');if(options.reducedMotion||options.saveData){await d.locator('img').waitFor();assert(!t.requests.some(x=>x.endsWith('.mp4')));await t.page.getByRole('button',{name:'How it works',exact:true}).click();await d.locator('video').waitFor();await t.page.waitForFunction(()=>document.querySelector('[data-testid="wording-help"] video')?.currentTime>0.1);}else await d.locator('video').waitFor();await d.locator('.wording-help-media').click();await d.waitFor({state:'detached'});evidence.cases.push({case:'new visit / preference',options,pass:true});await t.context.close();}
  // A failed media request returns the normal preview, never a broken player.
  const fail=await setup();await fail.page.route('**/*wording-explainer*',r=>r.abort());await open(fail);await wording(fail);await fail.page.waitForTimeout(1000);assert.equal(await fail.page.getByTestId('wording-help').count(),0);await fail.context.close();
  }
  for(const width of [390,360,1440]){
   const t=await setup(width,{touch:width!==1440});await open(t);await wording(t);const input=t.page.locator('#inscription-wording-input');await input.fill(words);const before=await rect(t.page.getByTestId('designer-footer-action'));const height=width===360?740:width===390?844:1000;const keyboardTop=height-320;await t.page.evaluate(h=>window.__keyboard(h),keyboardTop);await t.page.waitForTimeout(300);const bar=t.page.locator('.designer-step-footer');const after=await rect(t.page.getByTestId('designer-footer-action'));const field=await rect(input);
   if(width!==1440){assert.equal(await bar.getAttribute('data-keyboard-open'),'true');assert(after.bottom<=keyboardTop && after.y>=0,JSON.stringify({after,keyboardTop}));assert(field.y>=0 && field.bottom<=after.y,'Textarea is above the lifted action');assert.equal(await t.page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.id,{x:field.x+25,y:field.y+25}),'inscription-wording-input','Caret line is not covered by the preview');await t.page.evaluate(h=>window.__keyboard(h,25),keyboardTop-25);await t.page.waitForTimeout(100);const shifted=await rect(t.page.getByTestId('designer-footer-action'));assert(shifted.bottom<=keyboardTop);await t.page.screenshot({path:`${out}/keyboard-${width}.png`});await t.page.getByTestId('designer-footer-action').click();await t.page.getByRole('button',{name:'Tweak manually',exact:true}).waitFor().catch(async e=>{console.error('Layout diagnostic',t.calls,await t.page.locator('body').innerText(),t.errors);await t.page.screenshot({path:out+'/layout-failure.png'});throw e;});assert.equal(t.calls,2,'Existing lifted button starts mocked layout');await input.blur();await t.page.waitForTimeout(100);assert.equal(await bar.getAttribute('data-keyboard-open'),null);
   }else{assert.equal(await bar.getAttribute('data-keyboard-open'),null);assert.deepEqual(after,before);}
   evidence.cases.push({case:'keyboard',width,keyboardTop,before,after,field,pass:true});await t.context.close();
  }
 }
 evidence.passed=true;console.log(JSON.stringify(evidence,null,2));
}catch(e){evidence.error=String(e.stack||e);console.error(evidence.error);process.exitCode=1;}finally{fs.writeFileSync(`${out}/${baseline?'keyboard-before':'checks'}.json`,JSON.stringify(evidence,null,2));await browser.close();}
