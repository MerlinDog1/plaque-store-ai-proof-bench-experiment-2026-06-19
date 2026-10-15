import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { buildServerCheckoutOrder } from '../server/checkout.mjs';
const base = process.env.APP_URL || 'http://127.0.0.1:4205';
const lines = ['IN LOVING MEMORY OF', 'ALAN BROOKS', '1946–2022', ...Array(8).fill('Your kindness lives on in every life you touched.')];
const wording = lines.join('\n');
assert.ok(wording.length > 360);
const svg = lines.map((line,i)=>`<text x="0" y="${-65+i*13}" text-anchor="middle" font-family="EB Garamond" font-size="8">${line}</text>`).join('');
const browser = await chromium.launch({headless:true,executablePath:'/opt/google/chrome/chrome'});
try {
 for (const width of [390,1440]) {
  const page = await browser.newPage({viewport:{width,height:1000}});
  let submitted = false;
  await page.route(/googletagmanager|google-analytics|googleadservices/,r=>r.abort());
  await page.route('**/api/**',async route=>{
   const url = new URL(route.request().url());
   if(url.pathname.startsWith('/api/proof-sessions/')) return route.fulfill({json:{proofSession:{plaque_state:{width:297,height:210,shape:'rect',material:'polished-brass',fixing:'caps',capSize:15,wood:true,border:true,memorialImageEnabled:false},wording,generated_svg:svg,metadata:{layoutIsCurrent:true}}}});
   if(url.pathname === '/api/stripe/checkout-session') {
    const payload=route.request().postDataJSON();
    assert.equal(payload.orderSnapshot.inscription,wording);
    // Validate the real UI payload locally. Never contact Stripe or create an order.
    const order=buildServerCheckoutOrder(payload,{orderId:'PSAI-00000000-0000-4000-8000-000000000001'});
    assert.ok(order.totalPence > 0);submitted=true;
    return route.fulfill({status:422,json:{error:'QA checkout intercepted; no order or payment created.'}});
   }
   return route.fulfill({status:503,json:{error:'Disabled during QA'}});
  });
  await page.goto(base+'/design?proof=long-inscription-qa');
  await page.getByRole('button',{name:'Go to Proof',exact:true}).click();
  const approve=page.getByRole('checkbox',{name:/I have checked the wording/});
  await approve.check();
  await page.getByRole('button',{name:'Continue to secure checkout',exact:true}).click();
  await page.getByText('QA checkout intercepted; no order or payment created.',{exact:true}).waitFor();
  assert.ok(submitted);
  assert.ok(!(await page.locator('body').innerText()).includes('long inscription needs readability review'));
  console.log(`${width}px: ${wording.length}-character approved proof reaches checkout; canonical server validation passes; no external writes`);
  await page.close();
 }
} finally { await browser.close(); }
