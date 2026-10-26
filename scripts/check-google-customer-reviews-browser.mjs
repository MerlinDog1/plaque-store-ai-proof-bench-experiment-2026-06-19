// Google Customer Reviews in the built site (owner msg 6658, 26 Oct 2026). Serves dist/ as https://instaplaque.co.uk
// with a synthetic order API and a stand-in for Google's platform.js that records the opt-in box's details; every
// other outside request is blocked. Checks a paid order gets one box with the right details and that the private
// session ID reaches no outside address; that unpaid, test, reopened and owner's-browser visits get none; and that the
// privacy and cookie pages describe it. Usage: npm run build, then node scripts/check-google-customer-reviews-browser.mjs
// LIVE=1 loads the live site's own pages and files instead of dist/ (the order API and Google stay stand-ins, and
// Vercel's analytics endpoints are blocked).
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve('dist');
const LIVE = process.env.LIVE === '1';
const origin = 'https://instaplaque.co.uk';
const GCR_SCRIPT = 'https://apis.google.com/js/platform.js?onload=renderOptIn';
const SESSION = 'cs_live_synthetic123';
const baseOrder = {
  id: 'PSAI-00000000-0000-4000-8000-000000000123', paymentStatus: 'paid', status: 'paid', fulfilmentStatus: 'paid',
  totalPence: 9550, currency: 'gbp', stripeCheckoutSessionId: SESSION, customerEmail: 'customer@example.com',
  productTitle: 'A5 plaque', inscription: 'PRIVATE SYNTHETIC INSCRIPTION', shippingAddress: { country: 'GB', city: 'Leeds' },
  plaqueState: { width: 210, height: 148, shape: 'rect', material: 'brushed-steel', fixing: 'none', fixingHoleCount: 2, wood: false, memorialImageEnabled: false },
  proofPackage: { visualProofRendererVersion: 2, visualProofSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 148"><rect width="210" height="148" fill="#ccc"/></svg>' },
  metadata: { turnaroundWorkingDays: 5 },
};

// Independent of the app's code: the UK date of payment plus 8 Monday-to-Friday days (5 production + 1 + 2).
function expectedDate(paidAt, workingDays) {
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date(paidAt)).split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  for (let left = workingDays; left > 0;) {
    date.setUTCDate(date.getUTCDate() + 1);
    if (![0, 6].includes(date.getUTCDay())) left -= 1;
  }
  return date.toISOString().slice(0, 10);
}

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'] });

async function visit(order, { internal = false, route = '/order-confirmed', query = `?order=${baseOrder.id}&session_id=${SESSION}` } = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const seen = { scripts: [], renders: [], outbound: [], errors: [] };
  await context.exposeBinding('recordGcrRender', (_source, options) => seen.renders.push(options));
  // A chosen cookie answer keeps the cookie box out of the way; the owner's switch is the internal-traffic key.
  await context.addInitScript(owner => {
    localStorage.setItem('instaplaque-meta-consent', 'no');
    localStorage.setItem('instaplaque-analytics-consent-v1', 'no');
    if (owner) localStorage.setItem('instaplaque-internal-v1', 'yes');
  }, internal);
  await context.route('**/*', async request => {
    const url = new URL(request.request().url());
    const json = (value, status = 200) => request.fulfill({ status, contentType: 'application/json', body: JSON.stringify(value) });
    if (url.origin !== origin) {
      seen.outbound.push(url.href + ' ' + (request.request().headers().referer || ''));
      if (url.href === GCR_SCRIPT) {
        seen.scripts.push(url.href);
        return request.fulfill({ contentType: 'text/javascript', body: `
          window.gapi = { load(name, callback) { if (name === 'surveyoptin') callback(); },
            surveyoptin: { render(options) { window.recordGcrRender(options); } } };
          setTimeout(() => window.renderOptIn && window.renderOptIn(), 0);` });
      }
      return request.abort();
    }
    if (url.pathname.endsWith('/proof-image')) return json({ error: 'Test must not write proof' }, 500);
    if (url.pathname.startsWith('/api/orders/')) return json({ ok: true, order });
    if (url.pathname.startsWith('/api/')) return json({});
    if (LIVE) return url.pathname.startsWith('/_vercel/insights') || url.pathname.startsWith('/_vercel/speed-insights')
      ? request.abort() : request.continue();
    const name = ['/order-confirmed', '/privacy', '/cookies'].includes(url.pathname) && !(await exists(url.pathname))
      ? 'index.html' : (url.pathname.replace(/^\//, '').replace(/\/$/, '/index.html') || 'index.html');
    let file = path.resolve(root, name);
    if (!file.startsWith(root)) return request.abort();
    if (await isDir(file)) file = path.join(file, 'index.html');
    try { await fs.access(file); return request.fulfill({ path: file }); }
    catch { return request.fulfill({ status: 404, body: 'Missing fixture asset' }); }
  });
  const page = await context.newPage();
  page.on('pageerror', error => seen.errors.push(error.message));
  await page.goto(origin + route + query);
  return { context, page, seen };
}
async function exists(pathname) {
  try { await fs.access(path.join(root, pathname.replace(/^\//, ''), 'index.html')); return true; } catch { return false; }
}
async function isDir(file) {
  try { return (await fs.stat(file)).isDirectory(); } catch { return false; }
}

const results = {};
try {
  // 1. A paid order: one box, with the order's details.
  const paidAt = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const paid = await visit({ ...baseOrder, paidAt });
  await paid.page.getByRole('heading', { name: 'Your plaque order is confirmed.' }).waitFor();
  await paid.page.waitForFunction(() => true);
  for (let i = 0; i < 40 && !paid.seen.renders.length; i += 1) await paid.page.waitForTimeout(250);
  await paid.page.waitForTimeout(800);
  assert.deepEqual(paid.seen.scripts, [GCR_SCRIPT], "Google's script loads once");
  assert.equal(paid.seen.renders.length, 1, 'One box');
  assert.deepEqual(paid.seen.renders[0], { merchant_id: 5859684800, order_id: baseOrder.id, email: 'customer@example.com',
    delivery_country: 'GB', estimated_delivery_date: expectedDate(paidAt, 8) });
  assert.equal(await paid.page.evaluate(() => window.___gcfg && window.___gcfg.lang), 'en-GB');
  const outbound = paid.seen.outbound.join('\n');
  assert(!outbound.includes(SESSION), 'The private session ID reaches no outside address or referrer');
  assert(!outbound.includes(baseOrder.inscription));
  assert.deepEqual(paid.seen.errors, []);
  await fs.mkdir('output', { recursive: true });
  await paid.page.screenshot({ path: 'output/gcr-order-confirmed-phone.png', fullPage: false });
  results.paid = paid.seen.renders[0];
  await paid.context.close();

  // 2. No box: unpaid, owner's test payment, reopened days later, and the owner's own browser.
  const none = {
    unpaid: [{ ...baseOrder, paymentStatus: 'unpaid', status: 'checkout_started', paidAt: undefined, createdAt: paidAt }],
    ownerTest: [{ ...baseOrder, paidAt, metadata: { liveVerificationPolicy: '123x456-live-v1', noFulfilment: true } }],
    reopened: [{ ...baseOrder, paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }],
    ownerBrowser: [{ ...baseOrder, paidAt }, { internal: true }],
  };
  for (const [name, [order, options]] of Object.entries(none)) {
    const v = await visit(order, options);
    await v.page.locator('h1').first().waitFor();
    await v.page.waitForTimeout(1500);
    assert.deepEqual(v.seen.scripts, [], `${name}: no box`);
    assert.deepEqual(v.seen.renders, [], `${name}: no box`);
    assert.deepEqual(v.seen.errors, [], `${name}: no page errors`);
    results[name] = 'no box';
    await v.context.close();
  }

  // 3. The privacy and cookie pages describe it.
  for (const [route, phrase] of [['/privacy', 'gives Google your order number, email address, delivery country and expected delivery date'],
    ['/cookies', 'We do not set any cookies or storage for it']]) {
    const v = await visit(baseOrder, { route, query: '' });
    await v.page.getByText('Google Customer Reviews', { exact: true }).first().waitFor({ timeout: 15000 });
    assert(await v.page.getByText(phrase, { exact: false }).count() > 0, `${route} explains it`);
    assert.deepEqual(v.seen.scripts, [], `${route}: no box`);
    results[route] = 'described';
    await v.context.close();
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify(results, null, 1));
console.log('Google Customer Reviews browser checks passed.');
