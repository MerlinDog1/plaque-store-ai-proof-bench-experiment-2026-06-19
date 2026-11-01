// Live-only port: portrait is deliberately NOT category v2. Compare its rendered layout against ec24ba1,
// instead of asserting the combined preview's unapproved band/cards. All requests stay on localhost.
// BASE=http://127.0.0.1:4397 REF_DIST=/path/to/ec24ba1/dist OUT=/path node scripts/check-category-pages-browser.cjs
const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const BASE = process.env.BASE || 'http://127.0.0.1:4397';
assert(['127.0.0.1', 'localhost'].includes(new URL(BASE).hostname));
assert(process.env.REF_DIST, 'Set REF_DIST to the untouched live-source build');
const OUT = process.env.OUT || 'output/release-portrait';
fs.mkdirSync(OUT, {recursive:true});
const mime = { '.html': 'text/html', '.js':'text/javascript', '.css':'text/css', '.webp':'image/webp', '.jpg':'image/jpeg', '.png':'image/png', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.mp4':'video/mp4', '.json':'application/json' };
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/google/chrome/chrome',args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 const results=[];
 try {
  for(const width of [390,1440]) {
   const cases=[];
   for(const reference of [true,false]) {
    const context=await browser.newContext({viewport:{width,height:width===390?844:900},locale:'en-GB',timezoneId:'Europe/London',deviceScaleFactor:1});
    await context.addInitScript(()=>localStorage.setItem('instaplaque-internal-v1','yes'));
    await context.route('**/*',async route=>{
     const url=new URL(route.request().url());
     if(url.origin!==new URL(BASE).origin || url.pathname.startsWith('/_vercel/')) return route.abort();
     if(!reference || url.pathname.startsWith('/api/')) return route.continue();
     let file=path.join(process.env.REF_DIST,decodeURIComponent(url.pathname));
     if(fs.existsSync(file)&&fs.statSync(file).isDirectory()) file=path.join(file,'index.html');
     if(!fs.existsSync(file)) return route.abort();
     return route.fulfill({status:200,contentType:mime[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
    });
    const page=await context.newPage(), errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(BASE+'/portrait-plaques',{waitUntil:'networkidle'});
    await page.locator('h1').waitFor();
    await page.locator('.cookie-banner').getByRole('button',{name:'Reject',exact:true}).click();
    const height=await page.locator('main').evaluate(el=>el.scrollHeight);
    for(let top=0;top<height;top+=550) { await page.locator('main').evaluate((el,y)=>{el.scrollTop=y},top); await page.waitForTimeout(80); }
    await page.locator('main').evaluate(el=>{el.scrollTop=0});
    await page.waitForTimeout(500);
    const state=await page.evaluate(()=>{
     const main=document.querySelector('main');
     const rect=el=>{const b=el.getBoundingClientRect();return [Math.round(b.x),Math.round(b.y),Math.round(b.width),Math.round(b.height)]};
     return {title:document.title,h1:document.querySelector('h1').textContent,description:document.querySelector('meta[name="description"]').content,canonical:document.querySelector('link[rel="canonical"]').href,
      height:main.scrollHeight,overflow:main.scrollWidth-main.clientWidth,
      sections:[...document.querySelectorAll('.shopfront > *')].filter(el=>!el.classList.contains('shop-mobile-contact')).map(el=>({class:el.className,box:rect(el)})),
      images:[...document.querySelectorAll('.shopfront img')].filter(el=>el.getBoundingClientRect().width>0&&!el.closest('details:not([open])')).map(el=>({src:el.getAttribute('src'),loaded:el.complete&&el.naturalWidth>0})),
      links:[...main.querySelectorAll('a[href]')].map(el=>el.getAttribute('href'))};
    });
    assert.deepEqual(errors,[]);assert.equal(state.overflow,0);assert(state.images.every(i=>i.loaded),'All visible portrait images loaded');
    cases.push(state);await context.close();
   }
   assert.deepEqual(cases[1],cases[0],`portrait ${width}px: live layout, metadata, images and links unchanged`);
   results.push({width,passed:true,height:cases[1].height,sections:cases[1].sections.length,images:cases[1].images.length});
   console.log(`PASS portrait ${width}px: exact live layout, metadata, images and links; height ${cases[1].height}px`);
  }
 } finally {await browser.close();}
 fs.writeFileSync(path.join(OUT,'portrait-vs-live-browser.json'),JSON.stringify(results,null,2));
})().catch(error=>{console.error(error);process.exit(1)});
