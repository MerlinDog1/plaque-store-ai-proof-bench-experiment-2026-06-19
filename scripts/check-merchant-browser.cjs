const {chromium}=require('playwright');const fs=require('node:fs');
(async()=>{
 const {merchantOffers}=await import('../services/merchantCatalogue.mjs');const {studioPhotos}=await import('../services/studioPhotos.mjs');const {vettedCataloguePhotos}=await import('../services/vettedPhotos.mjs');
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/opt/google/chrome/chrome',args:['--no-sandbox']});
 const base=process.env.APP_URL||'http://127.0.0.1:4210'; const results=[];
 for(const width of [1440,390]){
  const p=await browser.newPage({viewport:{width,height:1000}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.route('https://**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
  await p.route('**/api/**',r=>r.fulfill({status:200,contentType:'application/json',body:'{}'}));
  const only=process.env.ONLY?new Set(process.env.ONLY.split(',')):null;
  const cases=(width===1440?merchantOffers:merchantOffers.filter((o,i)=>i%7===0||o.preset.shape!=='rect')).filter(o=>!only||only.has(o.slug));
  for(const o of cases){
   await p.goto(base+'/'+o.slug,{waitUntil:'domcontentloaded',timeout:60000});await p.locator('.shop-product-price').waitFor();
   await p.waitForFunction(()=>document.querySelector('.shop-product-hero img')?.complete,null,{timeout:20000});
   const actual=Number((await p.locator('.shop-product-price').innerText()).replace(/[^\d.]/g,''));if(actual!==o.price)throw Error('Page price '+o.slug);
   // Studio photo first (owner msg 7966), else the photo the owner has seen, else the flat drawing; the feed image stays
   // on the page as a later gallery image.
   const img=p.locator('.shop-product-hero figure > img').first();const lead=studioPhotos.has(o.slug)?`/site-images/studio-photo/${o.slug}.webp`:o.imageKind==='render'&&vettedCataloguePhotos.has(o.slug)?`/site-images/catalogue-photo/${o.slug}.webp`:o.image;
   // Redrawn photos and drawings carry ?v=N (services/commerce.ts, merchantCatalogue.mjs).
   if((await img.getAttribute('src')).split('?')[0]!==lead)throw Error('Image mismatch '+o.slug);
   if(lead!==o.image&&!await p.locator(`.shop-product-hero .shop-product-thumbs img[src^="${o.image}"]`).count())throw Error('Feed image not on page '+o.slug);
   // With srcset, naturalWidth is scaled by sizes; measure the pixels of the file the browser chose.
   if(!await img.evaluate(async i=>{const f=new Image();f.src=i.currentSrc||i.src;await f.decode();return f.naturalWidth>=500}))throw Error('Small/broken image '+o.slug);
   if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('Page overflow '+o.slug);
   const text=await p.locator('.shop-product-hero').innerText();if(!text.includes(`${o.productionDays} working days`))throw Error('Production '+o.slug);
   await p.locator('.shop-product-hero a.shop-button').first().click();
   await p.locator('.designer-price strong').waitFor();
   const checkoutPrice=Number((await p.locator('.designer-price strong').innerText()).replace(/[^\d.]/g,''));if(checkoutPrice!==o.price)throw Error('Designer price '+o.slug+': '+checkoutPrice);
   const hw=await p.locator('.fixing').count();if(hw!==o.preset.fixingHoleCount)throw Error('Designer fixings '+o.slug+': '+hw);
   const vb=await p.locator('.proof-preview-scale>svg').getAttribute('viewBox');const dims=vb.split(' ').map(Number);const extra=o.preset.wood?25:0;
   if(dims[2]!==o.preset.width+extra||dims[3]!==o.preset.height+extra)throw Error('Dimensions '+o.slug+' '+vb);
   if(errors.length)throw Error(errors.join());
   results.push({slug:o.slug,width,price:actual,hardware:hw,viewBox:vb});if(results.length%25===0)console.log(results.length,'page/designer checks passed');
  }await p.close();
 }
 fs.mkdirSync('output/merchant',{recursive:true});fs.writeFileSync('output/merchant/browser-results.json',JSON.stringify(results,null,2));await browser.close();console.log('PASS',results.length,'desktop/mobile checks, APIs intercepted');
})().catch(e=>{console.error(e);process.exit(1)});
