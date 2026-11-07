// Pure browser/layout checks; no external services or writes. See docs/phone-fold-photo-2026-11-07.md.
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const OUT=process.env.OUT||'output/phone-photo';await fs.mkdir(OUT,{recursive:true});
const BASE=process.env.BASE||'http://127.0.0.1:4408';
const sizes=[[360,640],[375,667],[390,664],[412,732],[430,740]];
// Hand-checked outer plaque edges in the unchanged 480px copies of the 1200px studio photos.
// Wood measurement includes the outer board. Widths are approximate; ratios are exact scale comparisons.
const products=[['brushed-stainless-150x65-rect-plaque',32,449],['brushed-brass-210x148-rect-plaque',27,454],['brushed-stainless-210x148-rect-dark-wood-plaque',20,457]];
const dist=process.env.SEO_DIST||'dist';
const sitemap=await fs.readFile(path.join(dist,'sitemap-products.xml'),'utf8');
const titles=await Promise.all([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(async match=>{const slug=new URL(match[1]).pathname.slice(1);const html=await fs.readFile(path.join(dist,slug,'index.html'),'utf8');return {slug,title:html.match(/<h1\b[^>]*>(.*?)<\/h1>/s)[1]};}));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||'/usr/bin/google-chrome',args:['--no-sandbox']});
const measured=[],fits=[];
async function context(width,height,base){const ctx=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',serviceWorkers:'block'});await ctx.route('**/*',r=>new URL(r.request().url()).origin===base&&r.request().method()==='GET'&&!new URL(r.request().url()).pathname.startsWith('/api/')?r.continue():r.fulfill({body:'{}',contentType:'application/json'}));return ctx;}
try{
 for(const [version,base] of [['live',process.env.LIVE_BASE],['v1',process.env.V1_BASE],['v2',BASE]].filter(([,base])=>base)){
  for(const [width,height] of sizes){
   const ctx=await context(width,height,base),page=await ctx.newPage();
   for(const [slug,left,right] of products){
    await page.goto(base+'/'+slug,{waitUntil:'networkidle'});await page.locator('.shop-product-inline-image > img').waitFor();await page.evaluate(()=>document.fonts.ready);
    const data=await page.locator('.shop-product-inline-image > img').evaluate(img=>{const r=img.getBoundingClientRect(),css=getComputedStyle(img);return {boxWidth:r.width,boxHeight:r.height,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,fit:css.objectFit,src:new URL(img.currentSrc).pathname};});
    assert(data.naturalWidth>0,'Photo loaded');if(version==='v2')assert.equal(data.fit,'contain','v2 never crops a plaque');
    const bitmapWidth=(data.fit==='cover'?Math.max:Math.min)(data.boxWidth,data.boxHeight*data.naturalWidth/data.naturalHeight);
    measured.push({version,width,height,slug,...data,bitmapWidth,plaqueWidth:bitmapWidth*(right-left)/480,landmarks480:[left,right]});
    if([360,390].includes(width))await page.screenshot({path:`${OUT}/${version}-${width}-${slug}.jpg`,quality:80,animations:'disabled'});
    if(version==='v2'){
     const layout=await page.evaluate(()=>{const rect=s=>document.querySelector(s).getBoundingClientRect();return {photo:rect('.shop-product-inline-image > img').bottom,caption:rect('.shop-product-inline-image figcaption').top,cta:rect('.shop-product-hero .shop-hero-choices').bottom,request:rect('.shop-product-hero .shop-hero-design-request').bottom,thumbs:rect('.shop-product-phone-thumbs').top};});
     assert(layout.caption>=layout.photo&&layout.caption-layout.photo<=5,'Caption directly below main photo');assert(layout.thumbs>=layout.request&&layout.thumbs>layout.cta,'Thumbnails below both CTAs and free-proof line');
     // Actually change the selected image through the relocated controls, then restore the studio view.
     const photo=page.locator('.shop-product-inline-image > img'),src=await photo.getAttribute('src');
     await page.locator('.shop-product-phone-thumbs button').nth(1).click();assert.notEqual(await photo.getAttribute('src'),src);await page.locator('.shop-product-phone-thumbs button').first().click();assert.equal(await photo.getAttribute('src'),src);
    }
   }
   await ctx.close();
  }
 }
 for(const [width,height] of sizes){
  const ctx=await context(width,height,BASE),page=await ctx.newPage();await page.goto(BASE+'/'+products[2][0],{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
  const cases=await page.evaluate(titles=>titles.map(item=>{
   document.querySelector('h1').innerHTML=item.title;
   const cookie=document.querySelector('.cookie-banner').getBoundingClientRect();
   const targets=['.shop-product-price','.shop-hero-choices a[href^="/design"]','.shop-hero-choice-whatsapp'].map(selector=>{
    const el=document.querySelector('.shop-product-hero '+selector),r=el.getBoundingClientRect();
    const clear=[[r.x+3,r.y+3],[r.right-3,r.y+3],[r.x+3,r.bottom-3],[r.right-3,r.bottom-3],[r.x+r.width/2,r.y+r.height/2]].every(([x,y])=>{const hit=document.elementFromPoint(x,y);return hit&&(hit===el||el.contains(hit));});
    return {selector,top:r.top,bottom:r.bottom,clear,inView:r.top>=0&&r.bottom<=innerHeight,gap:cookie.top-r.bottom};
   });return {...item,targets};
  }),titles);
  fits.push({width,height,cases});assert(cases.every(row=>row.targets.every(t=>t.clear&&t.inView&&t.gap>=0)),`${width}: all 175 titles leave every purchase target clear`);await ctx.close();
 }
}finally{await browser.close();await fs.writeFile(`${OUT}/photo-widths.json`,JSON.stringify(measured,null,2));await fs.writeFile(`${OUT}/all-title-fit.json`,JSON.stringify(fits,null,2));}
console.log(`PASS ${measured.length} photo measurements; ${fits.reduce((n,row)=>n+row.cases.length,0)} product-title/viewport cases; relocated thumbnail controls select the main photo.`);
