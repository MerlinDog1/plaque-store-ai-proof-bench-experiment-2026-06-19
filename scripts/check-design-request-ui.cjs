const { chromium } = require('@playwright/test');
const assert = require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/opt/google/chrome/chrome'});
 try {
  for(const width of [390,1440]) {
   const page=await browser.newPage({viewport:{width,height:1000}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   let pending;const requests=[];
   await page.route('**/api/design-requests',route=>{requests.push(route.request().postDataJSON());pending=route;});
   await page.goto('http://127.0.0.1:4196/design-request');
   await page.getByRole('button',{name:'Review request',exact:true}).click();
   assert.equal(requests.length,0);
   await page.getByRole('textbox',{name:'Exact wording for the plaque',exact:true}).fill('IN MEMORY\nALICE & BOB');
   await page.getByRole('textbox',{name:'Your name',exact:true}).fill('Test Customer');
   await page.getByRole('textbox',{name:'Email address',exact:true}).fill('customer@example.test');
   await page.locator('input[type=file]').setInputFiles({name:'reference.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64')});
   await page.getByRole('button',{name:'Review request',exact:true}).click();
   await page.getByRole('heading',{name:'Check your details',exact:true}).waitFor();
   assert.equal(requests.length,0,'Review does not send');
   await page.getByRole('button',{name:'Send my design request',exact:true}).click();
   await page.waitForFunction(()=>document.querySelector('button:disabled')?.textContent.includes('Sending'));
   while(!pending) await page.waitForTimeout(20);
   assert.equal(requests.length,1);
   assert.equal(requests[0].wording,'IN MEMORY\nALICE & BOB');
   assert.equal(requests[0].attachment.type,'image/png');
   await pending.fulfill({status:502,contentType:'application/json',body:JSON.stringify({error:'We could not confirm receipt. Please retry.'})});
   await page.getByRole('alert').waitFor();
   assert.equal(await page.getByRole('heading',{name:'Your request has been received.',exact:true}).count(),0);
   assert.ok((await page.locator('.request-exact').first().textContent()).includes('ALICE & BOB'));
   pending=null;
   await page.getByRole('button',{name:'Send my design request',exact:true}).click();
   while(!pending) await page.waitForTimeout(20);
   assert.deepEqual(requests[0],requests[1],'Unchanged retry retains idempotent payload');
   await pending.fulfill({status:201,contentType:'application/json',body:JSON.stringify({ok:true,reference:'IP-DESIGN-SYNTHETIC-TEST'})});
   await page.getByRole('heading',{name:'Your request has been received.',exact:true}).waitFor();
   assert.equal(await page.getByRole('button',{name:'Send my design request',exact:true}).count(),0,'No accidental repeat after success');
   assert.ok(await page.getByText('IP-DESIGN-SYNTHETIC-TEST',{exact:true}).count());
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   assert.deepEqual(errors,[]);
   console.log(width,'required fields, review, attachment, pending, failed/retried/successful submission passed');
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
