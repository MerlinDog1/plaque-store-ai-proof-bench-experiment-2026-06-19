import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve('dist');
const origin = 'https://instaplaque.co.uk';
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
let authenticated = false;
let configured = false;
let wrongMode = false;
let checkoutPayload;
let proofWrites = 0;
const blocked = [];
const errors = [];
const purchases = [];
const order = {
  id: 'PSAI-00000000-0000-4000-8000-000000000123',
  paymentStatus: 'paid', status: 'issue', fulfilmentStatus: 'issue', totalPence: 100, currency: 'gbp',
  stripeCheckoutSessionId: 'cs_live_synthetic123',
  plaqueState: { width: 123, height: 456, shape: 'rect', material: 'brushed-brass', fixing: 'none', fixingHoleCount: 2, wood: false, memorialImageEnabled: false },
  metadata: { liveVerificationPolicy: '123x456-live-v1', noFulfilment: true },
};
await context.exposeBinding('recordGooglePurchase', (_source, purchase) => purchases.push(purchase));
await context.route('**/*', async route => {
  const request = route.request();
  const url = new URL(request.url());
  const json = (value, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(value) });
  if (url.origin === 'https://checkout.stripe.com') return route.fulfill({ contentType: 'text/html', body: '<h1>Live checkout fixture only</h1>' });
  if (url.hostname === 'www.googletagmanager.com' && url.pathname === '/gtag/js') {
    // A deliberately mocked tag: inspect the event, acknowledge processing,
    // and never connect to a Google collection endpoint.
    return route.fulfill({ contentType: 'text/javascript', body: `
      window.dataLayer.push = function (args) {
        Array.prototype.push.call(this, args);
        if (args[0] === 'event' && args[1] === 'purchase') {
          const { event_callback, ...purchase } = args[2];
          window.recordGooglePurchase(purchase).then(() => event_callback());
        }
      };` });
  }
  if (url.origin !== origin) { blocked.push(url.hostname + url.pathname); return route.abort(); }
  if (url.pathname === '/api/admin/checkout-test') return authenticated ? json({ configured, mode: 'live' }) : json({ error: 'Admin access required.' }, 401);
  if (url.pathname === '/api/admin/session') { authenticated = true; return json({ ok: true }); }
  if (url.pathname === '/api/stripe/checkout-session') {
    checkoutPayload = request.postDataJSON();
    return json({ session: { id: wrongMode ? 'cs_test_synthetic123' : order.stripeCheckoutSessionId, livemode: !wrongMode, url: 'https://checkout.stripe.com/c/pay/' + order.stripeCheckoutSessionId } }, 201);
  }
  if (url.pathname.endsWith('/proof-image')) { proofWrites++; return json({ error: 'Test must not write proof' }, 500); }
  if (url.pathname.startsWith('/api/orders/')) return json({ order });
  if (url.pathname.startsWith('/api/')) return json({});
  const name = url.pathname === '/order-confirmed' ? 'index.html' : url.pathname.replace(/^\//, '') || 'index.html';
  const file = path.resolve(root, name);
  if (!file.startsWith(root + path.sep)) return route.abort();
  try { await fs.access(file); return route.fulfill({ path: file }); }
  catch { return route.fulfill({ status: 404, body: 'Missing fixture asset' }); }
});
try {
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(origin + '/checkout-test.html');
  await page.locator('#login:not([hidden])').waitFor();
  await page.locator('#password').fill('synthetic-passcode');
  await page.locator('#login button').click();
  await page.getByText('Live checkout is not available.', { exact: false }).waitFor();
  assert.equal(await page.locator('#start').isDisabled(), true);
  await fs.mkdir('output', { recursive: true });
  await page.screenshot({ path: 'output/pound-test-unconfigured-mobile.png', fullPage: true });
  configured = true;
  await page.reload();
  await page.waitForFunction(() => !document.getElementById('start').disabled);
  assert.equal(await page.locator('#measurement').isChecked(), false, 'No automatic consent');
  await page.locator('#measurement').check();
  await page.screenshot({ path: 'output/pound-test-ready-mobile.png', fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.locator('#start').click();
  await page.waitForURL('https://checkout.stripe.com/**');
  assert.equal(checkoutPayload.totalPence, 100);
  assert.equal(checkoutPayload.orderSnapshot.state.width, 123);
  assert.equal(checkoutPayload.orderSnapshot.state.height, 456);
  assert.equal(checkoutPayload.liveTest, true);
  assert.equal(checkoutPayload.confirmLivePayment, true);
  assert.equal(checkoutPayload.sandboxTest, undefined);
  wrongMode = true;
  await page.goto(origin + '/checkout-test.html');
  await page.waitForFunction(() => !document.getElementById('start').disabled);
  assert.equal(await page.locator('#measurement').isChecked(), true, 'Remember the owner choice');
  await page.locator('#measurement').uncheck();
  await page.locator('#start').click();
  await page.getByText('The returned checkout was not a live Stripe session.', { exact: false }).waitFor();
  assert.equal(page.url(), origin + '/checkout-test.html');
  console.log('PASS mobile login, unavailable-live disabled state, explicit consent, exact £1 submission and sandbox-session redirect rejection');
  const confirmedUrl = origin + '/order-confirmed?order=' + order.id + '&session_id=' + order.stripeCheckoutSessionId;
  await page.goto(confirmedUrl);
  await page.getByRole('heading', { name: 'Your £1 payment is confirmed.' }).waitFor();
  await page.waitForTimeout(500);
  assert.equal(purchases.length, 0, 'Rejected consent must not queue a Google purchase');
  assert.equal(await page.locator('iframe[title="Purchase measurement"]').count(), 0);
  wrongMode = false;
  await page.goto(origin + '/checkout-test.html');
  await page.waitForFunction(() => !document.getElementById('start').disabled);
  await page.locator('#measurement').check();
  await page.locator('#start').click();
  await page.waitForURL('https://checkout.stripe.com/**');
  await page.goto(confirmedUrl);
  await page.getByRole('heading', { name: 'Your £1 payment is confirmed.' }).waitFor();
  await page.waitForFunction(() => Object.keys(localStorage).some(key => key.startsWith('instaplaque-ga4-purchase-v1:')));
  assert.equal(purchases.length, 1);
  assert.equal(purchases[0].value, 1);
  assert.equal(purchases[0].currency, 'GBP');
  assert.equal(purchases[0].send_to, 'G-FKP17EXNBX');
  assert.equal(purchases[0].page_location, origin + '/order-confirmed');
  assert.match(purchases[0].transaction_id, /^ip_[a-f0-9]{64}$/);
  assert.equal(JSON.stringify(purchases).includes(order.id), false);
  assert.equal(JSON.stringify(purchases).includes(order.stripeCheckoutSessionId), false);
  await page.screenshot({ path: 'output/pound-test-confirmed-mobile.png', fullPage: true });
  await page.reload();
  await page.getByRole('heading', { name: 'Your £1 payment is confirmed.' }).waitFor();
  await page.waitForTimeout(500);
  assert.equal(proofWrites, 0);
  assert.equal(purchases.length, 1, 'Reload must not duplicate the purchase');
  assert.equal(await page.locator('iframe[title="Purchase measurement"]').count(), 0);
  assert.equal(blocked.some(url => /google-analytics|googletagmanager|googleadservices/.test(url)), false);
  assert.deepEqual(errors, []);
  console.log('PASS built-app live order return, consent rejection/acceptance, GBP1 once, reload dedupe, no private event fields, no production proof or JS errors');
  console.log('Browser/API/Google-tag fixtures only. All external network was intercepted; no real payment or Google event was sent.');
} finally { await browser.close(); }
