const { chromium } = require('@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
(async () => {
 const browser = await chromium.launch({headless:true, executablePath:process.env.CHROMIUM_EXECUTABLE || '/opt/google/chrome/chrome'});
 try {
  for (const width of [390, 1440]) {
   const page = await browser.newPage({viewport:{width,height:1000}});
   const errors=[]; page.on('pageerror', error => errors.push(error.message));
   let calls=0; let pending;
   await page.route('**/api/**', async route => {
    if(route.request().url().endsWith('/gemini/generate-content')) { calls++; pending=route; return; }
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({enabled:true,hasKey:true})});
   });
   await page.goto('http://127.0.0.1:4196/design');
   await page.getByRole('button',{name:/A4 landscape/}).click();
   await page.getByRole('button',{name:'Go to Text',exact:true}).click();
   await page.getByRole('button',{name:'Arrange it myself',exact:false}).click();
   await page.locator('#inscription-wording-input').fill('THE OLD MILL\nRESTORED 2026');
   await page.getByRole('button',{name:'Create editable layout',exact:true}).click();
   await page.locator('#generated-text-line-0').waitFor();
   assert.equal(calls,0,'Manual route must not call model');
   await page.getByRole('button',{name:'Go to Proof',exact:true}).click();
   const approval=page.getByRole('checkbox',{name:/I have checked the wording/});
   await approval.check();
   assert.equal(await approval.isChecked(),true);
   await page.getByRole('button',{name:'Go to Text',exact:true}).click();

   await page.locator('#generated-text-line-0').fill('THE NEW MILL');
   assert.equal(await page.locator('#inscription-wording-input').inputValue(),'THE NEW MILL\nRESTORED 2026');
   await page.getByRole('button',{name:'Go to Proof',exact:true}).click();
   assert.equal(await approval.isChecked(),false,'Manual content change invalidates approval');
   await page.getByRole('button',{name:'Go to Text',exact:true}).click();

   await page.getByRole('button',{name:'Undo last change',exact:true}).click();
   assert.equal(await page.locator('#inscription-wording-input').inputValue(),'THE OLD MILL\nRESTORED 2026');
   // A pending wording draft must not be overwritten by styling old SVG.
   await page.locator('#inscription-wording-input').fill('PENDING WORDING');
   await page.getByRole('button',{name:/Toggle bold for THE OLD MILL/}).click();
   assert.equal(await page.locator('#inscription-wording-input').inputValue(),'PENDING WORDING');
   await page.locator('#inscription-wording-input').fill('THE OLD MILL\nRESTORED 2026');
   const beforeOversize = await page.locator('#ai-text-layer').innerHTML();
   await page.getByRole('textbox',{name:'Font size for THE OLD MILL',exact:true}).fill('120');
   await page.getByText(/Change not applied/).waitFor();
   assert.equal(await page.locator('#ai-text-layer').innerHTML(),beforeOversize,'Unsafe size rejected');
   const svg=await page.locator('#ai-text-layer').innerHTML();
   await page.getByRole('button',{name:'Design it for me',exact:false}).click();
   assert.equal(await page.locator('#ai-text-layer').innerHTML(),svg,'Mode switch retains proof');
   await page.locator('#design-brief').fill('Use a calm traditional style');
   await page.getByRole('button',{name:'Quick design',exact:false}).click();
   await page.getByRole('button',{name:'Design it for me',exact:false}).click();
   assert.equal(await page.locator('#design-brief').inputValue(),'Use a calm traditional style');
   await page.locator('#design-brief').fill('');
   await page.locator('#layout-instruction').fill('Make the name larger');
   await page.getByRole('button',{name:'Apply changes',exact:true}).click();
   await page.waitForTimeout(100);
   assert.equal(calls,1);
   const payload=pending.request().postDataJSON();
   assert.ok(JSON.stringify(payload).includes('THE OLD MILL'));
   assert.ok(JSON.stringify(payload).includes('Make the name larger'));
   // Failure must retain proof and draft instruction.
   await pending.fulfill({status:400,contentType:'application/json',body:JSON.stringify({error:'Synthetic unavailable response'})});
   await page.getByText(/Your previous proof is unchanged/).waitFor();
   assert.equal(await page.locator('#ai-text-layer').innerHTML(),svg);
   assert.equal(await page.locator('#layout-instruction').inputValue(),'Make the name larger');
   pending=null;
   await page.getByRole('button',{name:'Apply changes',exact:true}).click();
   while(!pending) await page.waitForTimeout(20);
   const request=pending.request().postDataJSON();
   const root=String(request.contents).match(/<svg xmlns="http:\/\/www.w3.org\/2000\/svg" width="[^"]+" height="[^"]+" viewBox="[^"]+">/)[0];
   const revised=root+'<text x="0" y="-10" text-anchor="middle" font-family="Lato" font-size="22" fill="currentColor">THE OLD MILL</text><text x="0" y="20" text-anchor="middle" font-family="Lato" font-size="14" fill="currentColor">RESTORED 2026</text></svg>';
   await pending.fulfill({status:200,contentType:'application/json',body:JSON.stringify({text:JSON.stringify({svgContent:revised,reasoning:'Adjusted synthetic proof'})})});
   await page.getByText('Layout updated. Your wording is unchanged. Check the proof or undo this change.').waitFor();
   assert.equal(await page.locator('#inscription-wording-input').inputValue(),'THE OLD MILL\nRESTORED 2026');
   assert.notEqual(await page.locator('#ai-text-layer').innerHTML(),svg);
   await page.getByRole('button',{name:'Undo last change',exact:true}).click();
   assert.equal(await page.locator('#ai-text-layer').innerHTML(),svg);
   // Late AI completion must not replace more recent user input.
   pending=null;
   await page.getByRole('button',{name:'Apply changes',exact:true}).click();
   while(!pending) await page.waitForTimeout(20);
   await page.locator('#inscription-wording-input').fill('NEWER DRAFT');
   await pending.fulfill({status:200,contentType:'application/json',body:JSON.stringify({text:JSON.stringify({svgContent:revised,reasoning:'Late synthetic proof'})})});
   await page.getByText(/The proof changed while AI was working/).waitFor();
   assert.equal(await page.locator('#inscription-wording-input').inputValue(),'NEWER DRAFT');
   assert.equal(await page.locator('#ai-text-layer').innerHTML(),svg);

   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth),false,'No page horizontal overflow');
   assert.deepEqual(errors,[]);
   await fs.mkdir('output/playwright',{recursive:true});
   await page.locator('#inscription-wording-input').fill('THE OLD MILL\nRESTORED 2026');
   await page.locator('.proofbench-control-scroll').evaluate(el=>el.scrollTop=0);
   await page.screenshot({path:`output/playwright/design-routes-${width}.png`,fullPage:true});
   await page.close();
  }
  console.log('Design routes browser checks pass at mobile/desktop: local manual start, synced wording, undo, retained route state, instruction separation, failure preservation and no overflow/errors.');
 } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exit(1)});
