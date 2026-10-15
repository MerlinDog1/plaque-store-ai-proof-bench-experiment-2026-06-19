const {chromium}=require('@playwright/test');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/opt/google/chrome/chrome',args:['--no-sandbox']});
 try {
  for(const mode of ['success','bad-date','stale']){
   const page=await browser.newPage({viewport:{width:390,height:1000}});
   let calls=0;let release;const waiting=new Promise(r=>release=r);
   await page.route('**/api/**',async route=>{
    if(!route.request().url().endsWith('/gemini/generate-content'))return route.fulfill({json:{enabled:true,hasKey:true}});
    calls++;const prompt=String(route.request().postDataJSON().contents);
    if(calls===1){
     if(mode==='stale') {release();await page.waitForTimeout(500);}
     return route.fulfill({json:{text:JSON.stringify({refinedText:mode==='bad-date'?'Forever remembered\n2027':'Forever remembered\n2026'})}});
    }
    assert.ok(prompt.includes('Forever remembered'));
    assert.ok(!prompt.includes('forevr remebered'));
    const root=prompt.match(/<svg xmlns="http:\/\/www.w3.org\/2000\/svg" width="[^"]+" height="[^"]+" viewBox="[^"]+">/)[0];
    return route.fulfill({json:{text:JSON.stringify({svgContent:root+'<text x="0" y="-10" text-anchor="middle" font-family="Lato" font-size="14" fill="currentColor">Forever remembered</text><text x="0" y="20" text-anchor="middle" font-family="Lato" font-size="14" fill="currentColor">2026</text></svg>',reasoning:'Synthetic proofread layout'})}});
   });
   await page.goto('http://127.0.0.1:4196/design');
   await page.getByRole('button',{name:/A4 landscape/}).click();
   await page.getByRole('button',{name:'Go to Text',exact:true}).click();
   await page.locator('#inscription-wording-input').fill('forevr remebered\n2026');
   await page.getByRole('button',{name:'Generate layout',exact:true}).click();
   if(mode==='stale'){await waiting;await page.locator('#inscription-wording-input').fill('My new wording');}
   if(mode==='success'){
    await page.getByRole('button',{name:'Go to Text',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('#inscription-wording-input')?.value==='Forever remembered\n2026');
    assert.equal(calls,2);
   } else {
    await page.getByText(mode==='stale'?'The design changed while AI was working. Nothing was replaced; create your layout again.':'We could not safely check the wording. Your text has not been changed. Please try again.',{exact:true}).waitFor();
    assert.equal(calls,1);assert.equal(await page.locator('#inscription-wording-input').inputValue(),mode==='stale'?'My new wording':'forevr remebered\n2026');
   }
   console.log(mode+' passed');await page.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
