// Real public Google JS, built application, fresh isolated browser contexts.
// Only public script/static GETs leave this test. ALL collection/API/payment
// requests are intercepted; a synthetic sale must never reach a live account.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';

const origin = 'https://instaplaque.co.uk';
const root = path.resolve('dist');
const tags = new Map();
const publicAssets = new Map();
const report = { collectionDelivered: false, liveAdsReceiptVerified: false, checks: [], tagSnapshots: [] };
const failures = [];
async function publicGet(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  assert(response.ok, `Public GET failed: ${response.status} ${url}`);
  return { body: Buffer.from(await response.arrayBuffer()), contentType: response.headers.get('content-type') || '' };
}
async function googleScript(url) {
  const id = url.searchParams.get('id');
  if (url.hostname !== 'www.googletagmanager.com'
    || !['/gtag/js', '/gtag/destination'].includes(url.pathname)
    || !['AW-18288208905', 'G-FKP17EXNBX'].includes(id)) return null;
  // Never forward request data/click IDs/referrers from the test to Google.
  const clean = `https://www.googletagmanager.com${url.pathname}?id=${id}&l=dataLayer&cx=c`;
  if (!tags.has(clean)) {
    const asset = await publicGet(clean);
    assert(asset.contentType.includes('javascript'), 'Google must return JavaScript');
    tags.set(clean, asset);
    report.tagSnapshots.push({ url: clean, sha256: createHash('sha256').update(asset.body).digest('hex') });
  }
  return tags.get(clean);
}
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE || '/usr/bin/google-chrome', headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-background-networking'],
});

async function harness({ live = false, choice = null, order = null } = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  const hits = [], loads = [], errors = [], outbound = [];
  if (choice !== null) await context.addInitScript(value => {
    if (localStorage.getItem('instaplaque-analytics-consent-v1') === null) {
      localStorage.setItem('instaplaque-analytics-consent-v1', value);
      localStorage.setItem('instaplaque-meta-consent', value);
    }
  }, choice);
  await context.route('**/*', async route => {
    try {
      const req = route.request(), url = new URL(req.url());
      if (url.origin !== origin) {
        outbound.push(req.url() + '\n' + (req.postData() || ''));
        const asset = await googleScript(url);
        if (asset) {
          loads.push({ id: url.searchParams.get('id'), frame: req.frame().url() });
          return route.fulfill(asset);
        }
        const common = new URLSearchParams(url.search);
        for (const line of (req.postData() || '').split('\n')) {
          const params = new URLSearchParams(common);
          for (const [key, value] of new URLSearchParams(line)) params.set(key, value);
          if (params.has('gcs') || params.has('en')) hits.push({ host: url.hostname, path: url.pathname, ...Object.fromEntries(params) });
        }
        return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*' }, body: '' });
      }
      if (url.pathname.startsWith('/api/')) {
        assert.equal(req.method(), 'GET', 'No checkout/order/proof write should be attempted');
        const payload = order && url.pathname === '/api/orders/' + encodeURIComponent(order.id) ? { order } : {};
        return route.fulfill({ contentType: 'application/json', body: JSON.stringify(payload) });
      }
      if (url.pathname === '/_vercel/insights/script.js') return route.fulfill({ contentType: 'text/javascript', body: '' });
      if (url.pathname.startsWith('/_vercel/')) return route.fulfill({ status: 204, body: '' });
      assert.equal(req.method(), 'GET');
      if (live) {
        assert(url.pathname === '/memorial-plaques' || /^\/(assets|site-images|fonts)\//.test(url.pathname)
          || /^\/[^/]+\.(png|ico|svg|woff2?)$/.test(url.pathname), 'Unexpected live static GET: ' + url.pathname);
        const clean = origin + url.pathname;
        if (!publicAssets.has(clean)) publicAssets.set(clean, await publicGet(clean));
        return route.fulfill(publicAssets.get(clean));
      }
      let file = path.resolve(root, `.${url.pathname}`);
      assert(file === root || file.startsWith(root + path.sep));
      try {
        if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
        return await route.fulfill({ path: file });
      } catch {
        assert(req.isNavigationRequest(), 'Missing local asset: ' + url.pathname);
        return route.fulfill({ path: path.join(root, 'index.html') });
      }
    } catch (error) {
      errors.push(error.message);
      await route.fulfill({ status: 503, body: 'Fixture error' });
    }
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  return { context, page, hits, loads, errors, outbound };
}
const googleCookies = async context => (await context.cookies(origin)).filter(c => /^_(ga|gcl)/.test(c.name));
const hitSummary = hits => hits.map(h => ({ host: h.host, event: h.en || null, gcs: h.gcs || null, gcd: h.gcd || null }));
async function check(name, run) {
  try {
    const detail = await run();
    report.checks.push({ name, passed: true, ...detail });
  } catch (error) {
    failures.push(name);
    report.checks.push({ name, passed: false, error: error.stack });
  }
  console.log('CONSENT_NETWORK_CHECK ' + JSON.stringify(report.checks.at(-1)));
}

try {
  await check('current-live-baseline', async () => {
    const h = await harness({ live: true });
    try {
      await h.page.goto(origin + '/memorial-plaques?gclid=TEST123');
      await expect(h.page.getByRole('dialog', { name: 'Cookie preferences' })).toBeVisible();
      await h.page.waitForTimeout(1800);
      assert.deepEqual(h.errors, []);
      return { googleLoadsBeforeConsent: h.loads.length, cookies: (await googleCookies(h.context)).map(c => c.name), hits: hitSummary(h.hits), productionWasNotModified: true };
    } finally { await h.context.close(); }
  });
  await check('prepared-native-link-and-late-consent', async () => {
    const h = await harness();
    try {
      await h.page.goto(origin + '/memorial-plaques?gclid=TEST123');
      await expect.poll(() => h.hits.some(hit => hit.gcs === 'G100'), { timeout: 15000 }).toBe(true);
      assert.deepEqual(await googleCookies(h.context), [], 'No Google cookies before consent');
      const denied = hitSummary(h.hits);
      await h.page.getByRole('link', { name: 'Cookies', exact: true }).last().click();
      await expect(h.page).toHaveURL(/\/cookies\?/);
      const carriedUrl = h.page.url();
      assert(new URL(carriedUrl).searchParams.get('gclid') === 'TEST123' || new URL(carriedUrl).searchParams.has('_gl'), 'Link must carry ad click information');
      assert.deepEqual(await googleCookies(h.context), []);
      await h.page.getByRole('dialog', { name: 'Cookie preferences' }).getByRole('button', { name: 'Accept', exact: true }).click();
      await expect.poll(() => h.hits.some(hit => hit.gcs === 'G111'), { timeout: 15000 }).toBe(true);
      await expect.poll(async () => (await googleCookies(h.context)).some(c => c.name === '_gcl_aw' && c.value.endsWith('.TEST123'))).toBe(true);
      await expect.poll(async () => (await googleCookies(h.context)).some(c => c.name === '_ga')).toBe(true);
      const acceptedCookies = (await googleCookies(h.context)).map(c => c.name);
      await expect(h.page.getByText('Before you accept, or if you reject optional cookies', { exact: false })).toBeVisible();
      const offset = h.hits.length;
      await h.page.getByRole('button', { name: 'Cookie settings', exact: true }).click();
      await h.page.getByRole('dialog', { name: 'Cookie preferences' }).getByRole('button', { name: 'Reject', exact: true }).click();
      // Explicit test event only: collection is intercepted, not delivered.
      await h.page.evaluate(() => window.gtag('event', 'consent_check', { send_to: 'G-FKP17EXNBX' }));
      await expect.poll(() => h.hits.slice(offset).some(hit => hit.gcs === 'G100'), { timeout: 15000 }).toBe(true);
      await h.page.goto(origin + '/privacy');
      await expect(h.page.getByText('Before you accept, or if you reject optional cookies', { exact: false })).toBeVisible();
      assert.deepEqual(h.errors, []);
      return { denied, carriedUrl, acceptedCookies, gcsAfterAcceptance: 'G111', gcsAfterWithdrawal: 'G100' };
    } finally { await h.context.close(); }
  });
  await check('prepared-react-navigation', async () => {
    const h = await harness();
    try {
      await h.page.goto(origin + '/memorial-plaques?gclid=TEST123');
      await expect.poll(() => h.hits.some(hit => hit.gcs === 'G100'), { timeout: 15000 }).toBe(true);
      await h.page.locator('a.shop-button[href="/design"]').first().click();
      await expect(h.page).toHaveURL(/\/design/);
      const afterClick = h.page.url();
      assert.equal(new URL(afterClick).searchParams.get('gclid'), 'TEST123', 'Designer button must preserve the landing click ID');
      assert.deepEqual(await googleCookies(h.context), []);
      // Refresh is important: a click ID only held by an old in-memory tag is not URL passthrough.
      await h.page.reload();
      await h.page.getByRole('dialog', { name: 'Cookie preferences' }).getByRole('button', { name: 'Accept', exact: true }).click();
      await expect.poll(async () => (await googleCookies(h.context)).some(c => c.name === '_gcl_aw' && c.value.endsWith('.TEST123'))).toBe(true);
      assert.deepEqual(h.errors, []);
      return { afterClick, cookieRecoversClickAfterRefresh: true };
    } finally { await h.context.close(); }
  });
  await check('prepared-private-document-exclusions', async () => {
    const h = await harness({ choice: 'yes' });
    try {
      for (const route of ['/proof', '/order', '/checkout', '/order-confirmed']) {
        await h.page.goto(origin + route);
        await h.page.waitForTimeout(600);
        assert.equal(h.loads.length, 0, route + ': normal Google loader must stay excluded');
      }
      assert.deepEqual(h.errors, []);
      return { routes: ['/proof', '/order', '/checkout', '/order-confirmed'], normalGoogleLoads: 0 };
    } finally { await h.context.close(); }
  });
  await check('prepared-paid-purchase-cookie-continuity', async () => {
    const order = {
      id: 'PSAI-00000000-0000-4000-8000-000000000123', paymentStatus: 'paid', status: 'issue', fulfilmentStatus: 'issue',
      totalPence: 7640, currency: 'gbp', stripeCheckoutSessionId: 'cs_live_synthetic123',
      plaqueState: { width: 123, height: 456, shape: 'rect', material: 'brushed-brass', fixing: 'none', fixingHoleCount: 2, wood: false, memorialImageEnabled: false },
      metadata: { liveVerificationPolicy: '123x456-live-v1', noFulfilment: true },
    };
    const h = await harness({ order });
    try {
      await h.page.goto(origin + '/memorial-plaques?gclid=TEST123');
      await expect.poll(() => h.hits.some(hit => hit.gcs === 'G100'), { timeout: 15000 }).toBe(true);
      await h.page.getByRole('dialog', { name: 'Cookie preferences' }).getByRole('button', { name: 'Accept', exact: true }).click();
      await expect.poll(async () => (await googleCookies(h.context)).some(c => c.name === '_gcl_aw')).toBe(true);
      const before = await googleCookies(h.context);
      const gaCookie = before.find(c => c.name === '_ga');
      assert(gaCookie);
      const offset = h.loads.length, hitOffset = h.hits.length, outOffset = h.outbound.length;
      await h.page.goto(origin + '/order-confirmed?order=' + order.id + '&session_id=' + order.stripeCheckoutSessionId);
      await expect.poll(() => h.hits.filter(hit => hit.en === 'purchase').length, { timeout: 15000 }).toBe(1);
      const purchase = h.hits.find(hit => hit.en === 'purchase');
      assert.equal(purchase.tid, 'G-FKP17EXNBX');
      assert.equal(purchase.cid, gaCookie.value.split('.').slice(2).join('.'));
      assert.equal(purchase['epn.value'], '76.4');
      assert.equal(purchase.cu, 'GBP');
      assert.equal(purchase['ep.transaction_id'], 'ip_' + createHash('sha256').update('instaplaque:ga4:purchase:' + order.id).digest('hex'));
      assert.equal(purchase.dl, origin + '/order-confirmed');
      assert(!purchase.dr);
      const frameLoads = h.loads.slice(offset);
      assert(frameLoads.every(load => load.frame === origin + '/google-purchase.html'));
      const after = await googleCookies(h.context);
      assert.equal(after.find(c => c.name === '_gcl_aw')?.value, before.find(c => c.name === '_gcl_aw')?.value);
      const traffic = h.outbound.slice(outOffset).join('\n');
      assert(!traffic.includes(order.id) && !traffic.includes(order.stripeCheckoutSessionId));
      assert(!h.hits.slice(hitOffset).some(hit => hit.en === 'page_view'), 'No private page_view');
      await expect.poll(() => h.page.locator('iframe[title="Purchase measurement"]').count()).toBe(0);
      await h.page.reload();
      await h.page.waitForTimeout(1200);
      assert.equal(h.hits.filter(hit => hit.en === 'purchase').length, 1, 'Reload deduplication');
      assert.deepEqual(h.errors, []);
      return { send_to: purchase.tid, value: purchase['epn.value'], currency: purchase.cu,
        transaction_id: purchase['ep.transaction_id'], sameGaClient: true, sameGclAwCookie: true,
        purchaseRequestContainsTestClick: JSON.stringify(purchase).includes('TEST123'),
        purchaseGcs: purchase.gcs, purchaseGcd: purchase.gcd, directAdsConversionSent: false };
    } finally { await h.context.close(); }
  });
} finally {
  await browser.close();
  await mkdir('output/consent-network', { recursive: true });
  await writeFile('output/consent-network/results.json', JSON.stringify(report, null, 2) + '\n');
  console.log('CONSENT_NETWORK_RESULT ' + JSON.stringify(report));
}
assert.deepEqual(failures, [], 'Consent network checks failed');
