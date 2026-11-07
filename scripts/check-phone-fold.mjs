// Read-only first-visit browser evidence. Blocks analytics and every API write.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test');
import fs from 'node:fs/promises';
const BASE = process.env.BASE || 'http://127.0.0.1:4407';
const OUT = process.env.OUT || 'output/phone-fold';
const enforce = process.env.ENFORCE === '1';
const widths = (process.env.WIDTHS || '360,375,390,412,430').split(',').map(Number);
const products = ['brushed-stainless-150x65-rect-plaque','brushed-brass-210x148-rect-plaque','brushed-stainless-210x148-rect-dark-wood-plaque'];
await fs.mkdir(OUT, {recursive:true});
const browser = await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE || '/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
const rows=[];
const cache=new Map();
let nextFetch=Promise.resolve();
const hosted=!['localhost','127.0.0.1'].includes(new URL(BASE).hostname);
if(hosted&&!new URL(BASE).hostname.endsWith('.vercel.app'))throw new Error('Hosted checks are preview-only');
const bypass=process.env.PREVIEW_BYPASS_FILE?(await fs.readFile(process.env.PREVIEW_BYPASS_FILE,'utf8')).trim():'';
async function handleRoute(route){
 const req=route.request(),url=new URL(req.url());
 if(url.origin!==new URL(BASE).origin||url.pathname.startsWith('/api/')||req.method()!=='GET')return route.fulfill({status:200,contentType:'application/json',body:'{}'});
 if(!hosted)return route.continue();
 // Hosted static bytes only, once per URL and paced. Avoid repeated image/video requests
 // across fresh contexts, analytics, API writes, and Vercel's burst protection.
 if(/\.mp4$/.test(url.pathname))return route.fulfill({status:204,body:''});
 if(!cache.has(req.url())) {
  const result=nextFetch.then(async()=>{
   await new Promise(resolve=>setTimeout(resolve,550));
   const response=await route.fetch({headers:{...req.headers(),...(bypass?{'x-vercel-protection-bypass':bypass}:{})}});
   return {status:response.status(),headers:response.headers(),body:await response.body()};
  });
  cache.set(req.url(),result);nextFetch=result.then(()=>{},()=>{});
 }
 return route.fulfill(await cache.get(req.url()));
}

const errors=[];
async function measure(page,selectors) {
 return page.evaluate(selectors => Object.fromEntries(Object.entries(selectors).map(([key,selector])=>{
  const el=document.querySelector(selector); if(!el) return [key,null];
  const r=el.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,hit=document.elementFromPoint(x,y);
  const points=[[x,y],[r.x+3,r.y+3],[r.right-3,r.y+3],[r.x+3,r.bottom-3],[r.right-3,r.bottom-3]];
  const allPointsClear=points.every(([x,y])=>{const h=document.elementFromPoint(x,y);return h&&(h===el||el.contains(h));});
  return [key,{text:el.textContent.trim(),x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,inView:r.top>=0&&r.bottom<=innerHeight,tappable:!!hit&&(hit===el||el.contains(hit)),allPointsClear,hit:hit?.tagName+'.'+hit?.className}];
 })),selectors);
}
const productSelectors={price:'.shop-product-hero .shop-product-price',design:'.shop-product-hero .shop-hero-choices a[href^="/design"]',whatsapp:'.shop-product-hero .shop-hero-choice-whatsapp',h1:'.shop-product-hero h1',photo:'.shop-product-inline-image > img',notice:'.cookie-banner',accept:'.cookie-banner-actions button:first-child',reject:'.cookie-banner-actions button:last-child'};
try {
 for(const width of [...widths,...(process.env.NO_DESKTOP?'': [1440,768])]) {
  const height=width>=768?900:width===360?640:width===375?667:width===390?664:width===412?732:740;
  for(const slug of width>=768?[products[0]]:products) {
   const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
   await context.route('**/*',handleRoute);
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.goto(`${BASE}/${slug}`,{waitUntil:'networkidle',timeout:180000});await page.locator('.cookie-banner').waitFor();
   await page.screenshot({path:`${OUT}/${width}-${slug}.jpg`,quality:80,animations:'disabled'});
   const measurements=await measure(page,productSelectors);rows.push({width,height,slug,...measurements});
   await context.close();
  }
  if(width>=768) continue;
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'reduce',serviceWorkers:'block'});
  await context.route('**/*',handleRoute);
  const page=await context.newPage(); page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${BASE}/design`,{waitUntil:'networkidle',timeout:180000});await page.locator('.designer-step-footer').waitFor();
  const selectors={footer:'.designer-step-footer',back:'.designer-back',action:'.designer-continue',notice:'.cookie-banner',accept:'.cookie-banner-actions button:first-child',reject:'.cookie-banner-actions button:last-child'};
  for(const step of ['size','wording']) {
   if(step==='wording'){await page.getByRole('button',{name:'Go to Text',exact:true}).click();await page.locator('#inscription-wording-input').fill('A PLACE TO REMEMBER');}
   await page.screenshot({path:`${OUT}/${width}-design-${step}.jpg`,quality:80,animations:'disabled'});
   rows.push({width,height,slug:`design-${step}`,...await measure(page,selectors)});
  }
  await context.close();
 }
}finally{await browser.close();await fs.writeFile(`${OUT}/partial-hit-tests.json`,JSON.stringify({base:BASE,rows,errors},null,2));}
const failures=rows.flatMap(row=>{
 if(row.width>=768)return [];
 const keys=row.slug.startsWith('design-')?['action','back','accept','reject']:['price','design','whatsapp','accept','reject'];
 const failures=keys.filter(key=>!row[key]?.inView||!row[key]?.allPointsClear).map(key=>`${row.width} ${row.slug}: ${key} not fully visible/tappable`);
 const action=row.design||row.action;
 if(action && row.notice && action.bottom>row.notice.y) failures.push(`${row.width} ${row.slug}: action overlaps cookie notice`);
 return failures;
});
await fs.writeFile(`${OUT}/hit-tests.json`,JSON.stringify({base:BASE,rows,errors,failures},null,2));
console.log(JSON.stringify({rows:rows.length,errors,failures},null,2));
if(enforce&&(errors.length||failures.length))process.exitCode=1;
