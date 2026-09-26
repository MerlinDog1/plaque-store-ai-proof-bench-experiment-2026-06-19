const { chromium } = require('@playwright/test');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({headless:true, executablePath:'/opt/google/chrome/chrome', args:['--enable-unsafe-swiftshader']});
 try {
  for (const width of [390, 1440]) {
   const page = await browser.newPage({viewport:{width,height:1000}});
   const fontFailures=[];
   page.on('console', m=>{if(/3D preview could not outline|FAILED to load font/.test(m.text()))fontFailures.push(m.text());});
   await page.goto(process.env.REVIEW_URL || 'http://127.0.0.1:4196/design');
   await page.getByRole('button',{name:'Expand proof into 3D preview',exact:true}).click();
   await page.waitForFunction(()=>document.querySelector('.three-plaque-preview')?.dataset.fontsOutlined !== undefined,{},{timeout:20000});
   const outlined=await page.locator('.three-plaque-preview').getAttribute('data-fonts-outlined');
   console.log(width,{outlined,fontFailures});
   assert.equal(outlined,'true','3D text must be outlined, never fallback font');
   assert.deepEqual(fontFailures,[]);
   await page.screenshot({path:`output/playwright/font-3d-${width}.png`});
   await page.close();
  }
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
