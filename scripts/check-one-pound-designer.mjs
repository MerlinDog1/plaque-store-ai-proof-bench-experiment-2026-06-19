// Built-app navigation regression: no real API, payment, generation or analytics.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve('dist');
const origin = 'https://instaplaque.co.uk';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-background-networking'] });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
let state = { width: 123, height: 456, shape: 'rect', wood: false, memorialImageEnabled: false };
const writes = [], errors = [];
await context.addInitScript(() => localStorage.setItem('instaplaque-meta-consent', 'no'));
await context.route('**/*', async route => {
  const request = route.request(), url = new URL(request.url());
  if (url.origin !== origin) return route.fulfill({ status: 204, body: '' });
  const json = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
  if (request.method() !== 'GET') { writes.push(url.pathname); return json({error:'Writes disabled in this check'}, 500); }
  if (url.pathname.startsWith('/api/proof-sessions/')) return json({ proofSession: {
    plaque_state: state, wording: 'OWNER CHECKOUT FIXTURE', generated_svg: null, metadata: { layoutIsCurrent: false },
  }});
  if (url.pathname === '/api/admin/checkout-test') return json({error:'Admin access required.'},401);
  if (url.pathname === '/api/gemini/health') return json({ok:true,enabled:true,hasKey:true});
  if (url.pathname.startsWith('/api/')) return json({});
  const name = ['/design','/checkout','/quote'].includes(url.pathname) ? 'index.html' : url.pathname.replace(/^\//,'') || 'index.html';
  const file = path.resolve(root,name);
  if (!file.startsWith(root+path.sep)) return route.abort();
  try { await fs.access(file); return route.fulfill({path:file}); }
  catch { return route.fulfill({status:404,body:'No fixture file'}); }
});
try {
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  const load = async changes => {
    state = { width:123,height:456,shape:'rect',wood:false,memorialImageEnabled:false,...changes };
    await page.goto(origin+'/design?proof=synthetic-owner-test');
    await page.waitForFunction(({width,height}) => document.querySelector('.designer-stage-caption strong')?.textContent === `${width} × ${height} mm`, state);
    await page.getByRole('button',{name:'Go to Proof',exact:true}).click();
  };
  const checkout = () => page.evaluate(() => {
    history.pushState({},'', '/checkout'); window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await load({});
  const card = page.getByRole('region',{name:'Owner £1 checkout test'});
  await card.waitFor();
  assert.equal(await page.locator('.proof-inline-checkout').count(),0);
  assert.match(await card.innerText(),/£1.00 GBP/);
  assert.equal(await page.locator('.proof-checkout-error').count(),0);
  await fs.mkdir('output',{recursive:true});
  await card.screenshot({path:'output/designer-pound-card-mobile.png'});
  await checkout();
  await card.waitFor();
  assert.equal(await page.getByText(/This design needs a manual quote before payment/).count(),0);
  await page.getByRole('link',{name:'Continue to £1 test checkout',exact:true}).click();
  await page.waitForURL(origin+'/checkout-test.html');
  await page.locator('#login:not([hidden])').waitFor();
  assert.equal(await page.locator('#start').isDisabled(),true);
  console.log('PASS 123×456 designer and /checkout route reach private £1 page, no quote/error POST, owner sign-in still required');
  for (const changed of [{width:124},{width:456,height:123},{wood:true},{memorialImageEnabled:true},{width:150,height:50}]) {
    await load(changed);
    assert.equal(await card.count(),0,JSON.stringify(changed));
    await page.locator('.proof-inline-checkout').waitFor();
    await checkout();
    assert.equal(await card.count(),0);
    if (changed.width !== 150) await page.getByText(/This design needs a manual quote before payment/).waitFor();
    else assert.equal(await page.getByText(/This design needs a manual quote before payment/).count(),0);
  }
  assert.deepEqual(writes,[]);
  assert.deepEqual(errors,[]);
  console.log('PASS adjacent/reversed/wood/artwork/normal plaque flows unchanged; no API writes or browser errors');
} finally { await browser.close(); }
