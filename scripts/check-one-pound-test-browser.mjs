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
let liveResponse = false;
let checkoutPayload;
let proofWrites = 0;
const blocked = [];
const errors = [];
const order = {
  id: 'PSAI-00000000-0000-4000-8000-000000000123',
  paymentStatus: 'paid', status: 'issue', fulfilmentStatus: 'issue', totalPence: 100, currency: 'gbp',
  stripeCheckoutSessionId: 'cs_test_synthetic123',
  plaqueState: { width: 123, height: 456, shape: 'rect', material: 'brushed-brass', fixing: 'none', fixingHoleCount: 2, wood: false, memorialImageEnabled: false },
  metadata: { checkoutTestPolicy: '123x456-sandbox-v1', noFulfilment: true },
};
await context.addInitScript(() => localStorage.setItem('instaplaque-meta-consent', 'yes'));
await context.route('**/*', async route => {
  const request = route.request();
  const url = new URL(request.url());
  const json = (value, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(value) });
  if (url.origin === 'https://checkout.stripe.com') return route.fulfill({ contentType: 'text/html', body: '<h1>Sandbox fixture only</h1>' });
  if (url.origin !== origin) { blocked.push(url.hostname + url.pathname); return route.abort(); }
  if (url.pathname === '/api/admin/checkout-test') return authenticated ? json({ configured }) : json({ error: 'Admin access required.' }, 401);
  if (url.pathname === '/api/admin/session') { authenticated = true; return json({ ok: true }); }
  if (url.pathname === '/api/stripe/checkout-session') {
    checkoutPayload = request.postDataJSON();
    return json({ session: { id: liveResponse ? 'cs_live_synthetic123' : order.stripeCheckoutSessionId, livemode: liveResponse, url: 'https://checkout.stripe.com/c/pay/cs_test_synthetic123' } }, 201);
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
  await page.getByText('Prepared, but Stripe sandbox is not connected yet.', { exact: false }).waitFor();
  assert.equal(await page.locator('#start').isDisabled(), true);
  await fs.mkdir('output', { recursive: true });
  await page.screenshot({ path: 'output/pound-test-unconfigured-mobile.png', fullPage: true });
  configured = true;
  await page.reload();
  await page.waitForFunction(() => !document.getElementById('start').disabled);
  await page.screenshot({ path: 'output/pound-test-ready-mobile.png', fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.locator('#start').click();
  await page.waitForURL('https://checkout.stripe.com/**');
  assert.equal(checkoutPayload.totalPence, 100);
  assert.equal(checkoutPayload.orderSnapshot.state.width, 123);
  assert.equal(checkoutPayload.orderSnapshot.state.height, 456);
  assert.equal(checkoutPayload.sandboxTest, true);
  liveResponse = true;
  await page.goto(origin + '/checkout-test.html');
  await page.waitForFunction(() => !document.getElementById('start').disabled);
  await page.locator('#start').click();
  await page.getByText('The returned checkout was not a Stripe sandbox session.', { exact: false }).waitFor();
  assert.equal(page.url(), origin + '/checkout-test.html');
  console.log('PASS mobile login, missing-key disabled state, exact £1 submission and live-session redirect rejection');
  const confirmedUrl = origin + '/order-confirmed?order=' + order.id + '&session_id=' + order.stripeCheckoutSessionId;
  await page.goto(confirmedUrl);
  await page.getByRole('heading', { name: 'Your £1 test payment is confirmed.' }).waitFor();
  await page.screenshot({ path: 'output/pound-test-confirmed-mobile.png', fullPage: true });
  await page.reload();
  await page.getByRole('heading', { name: 'Your £1 test payment is confirmed.' }).waitFor();
  await page.waitForTimeout(500);
  assert.equal(proofWrites, 0);
  assert.equal(await page.locator('iframe[title="Purchase measurement"]').count(), 0);
  assert.equal(blocked.some(url => /google-analytics|googletagmanager|googleadservices/.test(url)), false);
  assert.deepEqual(errors, []);
  console.log('PASS hosted-build order return/reload, no production proof, no Google sale/loader, no JS errors');
  console.log('Browser fixtures only. All external network was intercepted; no real payment or Google event was sent.');
} finally { await browser.close(); }
