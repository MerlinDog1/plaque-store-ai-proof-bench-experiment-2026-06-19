// Completely offline: all browser requests fulfilled from local assets/fixtures or aborted.
// Build first: npx vite build --outDir output/attribution-dist
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { buildServerCheckoutOrder } from '../server/checkout.mjs';
import { buildStripeCheckoutParams } from '../server/stripe.mjs';
const root = path.resolve(process.env.ATTRIBUTION_DIST || 'output/attribution-dist');
await fs.access(path.join(root, 'index.html'));
const origin = 'https://instaplaque.co.uk';
const evidence=[];
const landing='/brushed-stainless-150x65-rect-plaque';
const browser = await chromium.launch({headless:true, executablePath:process.env.CHROMIUM_EXECUTABLE || '/opt/google/chrome/chrome'});
try {
 for (const [width, query, expectedLabel, suffix] of [
  [390, '?utm_source=google&utm_medium=cpc&gclid=TEST', 'google_ads', 'G'],
  [390, '?utm_source=google&utm_medium=shopping&utm_campaign=synthetic-autumn&utm_content=one&utm_term=plaque&gclid=SYNTHETIC_GOOGLE', 'google_shopping', 'G'],
  [1440, '?utm_source=instagram&utm_medium=paid_social&utm_campaign=synthetic-autumn&fbclid=SYNTHETIC_META', 'facebook_instagram_ads', 'F'],
 ]) {
  const context = await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'});
  const errors=[], apiRequests=[];
  let checkoutPayload, canonicalOrder;
  await context.route('**/*', async route => {
   const req=route.request(), url=new URL(req.url());
   const json=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
   // This is a fixture page, NOT a Stripe session or network call.
   if(url.origin==='https://checkout.stripe.com') return route.fulfill({contentType:'text/html',body:'<h1>Offline checkout intercepted</h1>'});
   if(url.origin!==origin) return route.abort();
   if(url.pathname.startsWith('/api/')) {
    apiRequests.push(url.pathname);
    if(url.pathname==='/api/gemini/generate-content') {
     const request=req.postDataJSON();
     if(request.config?.responseSchema?.properties?.refinedText) return json({text:JSON.stringify({refinedText:'SYNTHETIC TEST\nOFFLINE ONLY'})});
     const rootTag=String(request.contents).match(/<svg xmlns="http:\/\/www.w3.org\/2000\/svg" width="[^"]+" height="[^"]+" viewBox="[^"]+">/)[0];
     const svgContent=rootTag+'<text x="0" y="-10" text-anchor="middle" font-family="Lato" font-size="18" fill="currentColor">SYNTHETIC TEST</text><text x="0" y="20" text-anchor="middle" font-family="Lato" font-size="14" fill="currentColor">OFFLINE ONLY</text></svg>';
     return json({text:JSON.stringify({svgContent,reasoning:'Offline test fixture'})});
    }
    if(url.pathname==='/api/stripe/checkout-session') {
     checkoutPayload=req.postDataJSON();
     // Real canonicalization/Stripe parameter functions only: neither performs I/O.
     canonicalOrder=buildServerCheckoutOrder(checkoutPayload);
     const {params}=buildStripeCheckoutParams(canonicalOrder);
     assert.equal(params.get('metadata[attribution_label]'),expectedLabel);
     assert.equal(params.get('metadata[attribution_campaign]'),new URLSearchParams(query).get('utm_campaign'));
     return json({order:canonicalOrder,session:{id:'cs_test_offline_fixture',livemode:false,url:'https://checkout.stripe.com/offline-fixture',uiMode:'hosted'}},201);
    }
    if(url.pathname==='/api/admin/auth-config') return json({authRequired:true,configured:true,operational:true,status:'configured'});
    if(url.pathname==='/api/admin/session' && req.method()==='GET') return json({ok:true});
    if(url.pathname==='/api/admin/orders' && req.method()==='GET') return json({orders:[{...canonicalOrder,metadata:{source:'instaplaque-checkout'}}]});
    if(url.pathname===`/api/admin/orders/${canonicalOrder?.id}` && req.method()==='GET') return json({order:canonicalOrder});
    if(req.method()==='GET') return json({enabled:true,hasKey:true});
    throw Error(`Unexpected API write ${req.method()} ${url.pathname}`);
   }
   if(req.method()!=='GET') throw Error(`Unexpected non-API write ${req.url()}`);
   let file=path.resolve(root,'.'+url.pathname);
   if(!file.startsWith(root+path.sep) && file!==root) return route.abort();
   try {if((await fs.stat(file)).isDirectory()) file=path.join(file,'index.html');await fs.access(file);}
   catch { if(req.isNavigationRequest()) file=path.join(root,'index.html');else return route.fulfill({status:404,body:'Offline asset not found'}); }
   return route.fulfill({path:file});
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+landing+query,{referer:'https://www.google.com/search?q=DO_NOT_RETAIN'});
  await page.getByRole('button',{name:'Reject',exact:true}).click();
  assert.ok(!await page.evaluate(()=>JSON.stringify([Object.entries(localStorage),Object.entries(sessionStorage),document.cookie]).includes('SYNTHETIC_')), 'Arrival click IDs never written to device storage');
  // The existing conversation reference gains only a letter, never the raw click ID.
  const contact=page.locator('a[data-contact-placement][href^="https://wa.me"]').first();
  await page.evaluate(()=>document.addEventListener('click',event=>event.preventDefault(),{once:true}));
  await contact.dispatchEvent('click',{button:0,ctrlKey:true});
  const reference=await contact.getAttribute('data-contact-reference');
  assert.match(reference,new RegExp(`^IP-[A-F0-9]{10}-${suffix}$`));
  const href=await contact.getAttribute('href');
  assert.ok(href.includes(encodeURIComponent(reference)));
  assert.ok(!href.includes('SYNTHETIC_GOOGLE')&&!href.includes('SYNTHETIC_META'));
  await page.getByRole('link',{name:'Design online',exact:true}).first().click();
  await page.waitForURL('**/design**');
  assert.equal(new URL(page.url()).searchParams.get('utm_campaign'),null,'Client navigation removed UTMs');
  assert.ok(new URL(page.url()).searchParams.has(suffix==='G'?'gclid':'fbclid'),'Click ID retained on public pushState route');
  await page.getByRole('button',{name:'Go to Size/Shape',exact:true}).click();
  await page.getByRole('button',{name:/A4 landscape/}).click();
  await page.getByRole('button',{name:'Go to Text',exact:true}).click();
  await page.locator('#inscription-wording-input').fill('SYNTHETIC TEST\nOFFLINE ONLY');
  await page.getByRole('button',{name:'Design my plaque',exact:true}).first().click();
  await page.getByRole('button',{name:'Tweak manually',exact:true}).waitFor();
  await page.getByRole('button',{name:'Go to Proof',exact:true}).click();
  await page.getByRole('checkbox',{name:/I have checked the wording/}).check();
  await page.getByRole('button',{name:'Continue to secure checkout',exact:true}).click();
  await page.getByRole('heading',{name:'Offline checkout intercepted'}).waitFor();
  assert.equal(checkoutPayload.attribution.label,expectedLabel);
  assert.equal(checkoutPayload.attribution.utm_campaign,new URLSearchParams(query).get('utm_campaign') || undefined);
  assert.equal(checkoutPayload.attribution.landing_path,landing);
  evidence.push({width,query,checkoutAttribution:checkoutPayload.attribution,storedAttribution:canonicalOrder.metadata.attribution,reference});
  assert.equal(checkoutPayload.attribution.referrer_host,'www.google.com');
  assert.ok(!JSON.stringify(checkoutPayload.attribution).includes('DO_NOT_RETAIN'));
  assert.deepEqual(canonicalOrder.metadata.attribution,checkoutPayload.attribution);
  assert.deepEqual(errors,[]);
  assert.ok(apiRequests.includes('/api/stripe/checkout-session'));
  assert.ok(!apiRequests.includes('/api/proof-sessions'));
  // Admin list deliberately omits attribution: the display must use authenticated detail data.
  await page.goto(origin+'/admin');
  await page.getByRole('listitem').filter({hasText:canonicalOrder.id}).click();
  await page.locator('.admin-console__detail:visible').getByText(expectedLabel,{exact:true}).waitFor();
  assert.deepEqual(errors,[]);
  console.log(`${width}px: rejected consent, contact suffix ${suffix}, first arrival survived navigation, mocked proof -> intercepted checkout -> canonical metadata/Stripe params + admin detail label PASS`);
  await context.close();
 }
} finally {await browser.close();}
if(process.env.ATTRIBUTION_EVIDENCE) await fs.writeFile(process.env.ATTRIBUTION_EVIDENCE,JSON.stringify(evidence,null,2));
console.log('No actual AI, Stripe, database, proof session, email or external network requests.');
