const {chromium}=require('@playwright/test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/opt/google/chrome/chrome'});
 const base=process.env.REVIEW_URL || 'http://127.0.0.1:4196';
 try {
  for(const width of [390,1440]){
   const page=await browser.newPage({viewport:{width,height:1000}});
   const posts=[], errors=[];
   page.on('request',r=>{if(r.method()==='POST') posts.push(r.url())});
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/');
   await page.getByRole('heading',{name:'Want us to take care of the design?'}).waitFor();
   await page.getByRole('link',{name:'Have us design it',exact:true}).click();
   assert.equal(new URL(page.url()).pathname,'/design-request');
   await page.getByRole('heading',{name:'Leave the layout to us.'}).waitFor();
   assert.equal(await page.locator('.designer-steps').count(),0);
   await page.getByRole('button',{name:'Review request',exact:true}).click();
   assert.equal(await page.getByRole('heading',{name:'Your design brief, ready to review.'}).count(),0,'Required fields stop review');
   await page.getByLabel('Size',{exact:true}).fill('150 × 50 mm');
   await page.getByLabel('Material',{exact:true}).selectOption('Aged brass');
   await page.getByLabel('Wood backing',{exact:true}).selectOption('Dark wood backing');
   await page.getByLabel('Exact wording for the plaque',{exact:true}).fill('ALEX & SAM\nTOGETHER ALWAYS');
   await page.getByLabel(/What do you have in mind/).fill('Make a warm traditional bench memorial.');
   await page.getByLabel('Your name',{exact:true}).fill('Preview Tester');
   await page.getByLabel('Email address',{exact:true}).fill('preview@example.invalid');
   await page.getByLabel(/Reference image/).setInputFiles({name:'reference.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aP1sAAAAASUVORK5CYII=','base64')});
   await page.getByRole('button',{name:'Remove image',exact:true}).click();
   assert.equal(await page.locator('.request-image').count(),0);
   await page.getByRole('button',{name:'Review request',exact:true}).click();
   await page.getByRole('heading',{name:'Your design brief, ready to review.'}).waitFor();
   assert.equal(await page.getByRole('button',{name:'Send my design request',exact:true}).count(),1);
   assert.equal(await page.locator('.request-exact').first().innerText(),'ALEX & SAM\nTOGETHER ALWAYS');
   assert.ok((await page.locator('.request-summary').innerText()).includes('Dark wood backing'));
   assert.equal(await page.locator('body').evaluate(e=>e.scrollWidth<=innerWidth+1),true,'No horizontal overflow');
   await fs.mkdir('output/playwright',{recursive:true});
   await page.screenshot({path:`output/playwright/design-request-${width}.png`,fullPage:true});
   await page.getByRole('button',{name:'Edit my request'}).click();
   await page.getByRole('button',{name:'Home',exact:true}).click();
   await page.getByRole('link',{name:'Have us design it',exact:true}).click();
   assert.equal(await page.getByLabel('Email address',{exact:true}).inputValue(),'preview@example.invalid','Draft survives navigation');
   assert.equal(posts.length,0,'Review and navigation must not submit');
   assert.deepEqual(errors,[]);
   await page.reload();
   await page.getByRole('heading',{name:'Leave the layout to us.'}).waitFor();
   assert.equal(await page.getByLabel('Email address',{exact:true}).inputValue(),'','Refresh clears personal draft');
   await page.close();
   console.log(width, 'human form passed: validation, local image, summary, draft navigation, direct route, no submissions/errors/overflow');
  }
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
