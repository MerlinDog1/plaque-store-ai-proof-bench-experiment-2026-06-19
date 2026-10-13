// Built-app check with every request intercepted. No server, real analytics,
// customer records, AI generation or payments.
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';
import { merchantOffers } from '../services/merchantCatalogue.mjs';
import { checkProductPolicies, checkReturnPolicy, checkDigitalOffer, schemaObjects, schemasFromHtml } from './lib/product-policy-checks.mjs';

const root = path.resolve('dist');
const origin = 'https://instaplaque.co.uk';
const samples = [5, 7, 10, 15].map(days => merchantOffers.find(item => item.productionDays === days).slug);
// The legacy 200x100 brass offer intentionally retains its 15-day estimate.
samples.push('polished-brass-bench-plaque-200x100');
const routes = ['', 'memorial-plaques', 'bench-plaques', 'brass-plaques', 'stainless-steel-plaques', 'custom-plaques', ...samples];
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE || '/usr/bin/google-chrome', headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-background-networking'] });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  const writes = [], errors = [];
  await context.addInitScript(() => {
    localStorage.setItem('instaplaque-meta-consent', 'no');
    localStorage.setItem('instaplaque-analytics-consent-v1', 'no');
  });
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin !== origin) return route.fulfill({ status: 204, body: '' });
    if (request.method() !== 'GET') { writes.push(url.pathname); return route.abort(); }
    if (url.pathname.startsWith('/api/')) return route.fulfill({ json: {} });
    let file = path.resolve(root, `.${url.pathname}`);
    if (file !== root && !file.startsWith(root + path.sep)) return route.abort();
    try {
      if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
      return await route.fulfill({ path: file });
    } catch { return route.fulfill({ status: 404, body: 'Missing fixture asset' }); }
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  const graph = async () => {
    await expect(page.locator('#instaplaque-route-schema')).toHaveCount(1);
    await expect(page.locator('#instaplaque-prerender-route-schema')).toHaveCount(0);
    return page.locator('script[type="application/ld+json"]').evaluateAll(nodes => nodes.map(node => JSON.parse(node.textContent)));
  };
  for (const slug of routes) {
    await page.goto(`${origin}/${slug}`);
    const live = checkProductPolicies(await graph(), `hydrated /${slug}`);
    assert.ok(live.length > 0, `No product data on /${slug}`);
    const initial = checkProductPolicies(schemasFromHtml(await readFile(path.join(root, slug, 'index.html'), 'utf8')), `initial /${slug}`);
    // The existing home lists differ in breadth, but every shared physical
    // offer must retain the same policy, timing and price after hydration.
    for (const product of initial) {
      const client = live.find(item => item.offers.url === product.offers.url);
      assert.ok(client, `Client lost ${product.offers.url}`);
      for (const key of ['price', 'priceCurrency', 'shippingDetails', 'hasMerchantReturnPolicy']) {
        assert.deepEqual(client.offers[key], product.offers[key], `${slug}: server/client ${key}`);
      }
    }
  }
  await page.goto(`${origin}/returns-and-cancellations`);
  const org = [...schemaObjects(await graph())].find(item => item['@type'] === 'Organization' && item.hasMerchantReturnPolicy);
  assert.ok(org);
  checkReturnPolicy(org.hasMerchantReturnPolicy, 'hydrated returns');
  await expect(page.getByText('Your statutory rights are not affected.', { exact: false }).first()).toBeVisible();
  await page.goto(`${origin}/how-it-works`);
  await graph();
  await expect(page.getByText('We dispatch Monday to Friday using a next-working-day delivery service.', { exact: false })).toBeVisible();
  await page.goto(`${origin}/design`);
  checkDigitalOffer(await graph());
  await expect(page.locator('#designer-guide-dialog')).not.toBeVisible();
  assert.deepEqual(errors, [], 'No browser JavaScript errors');
  assert.deepEqual(writes, [], 'No writes during browser verification');
  console.log(`Product policies: ${routes.length} hydrated catalogue/product routes plus returns, delivery and designer pass; initial/client policies agree; no writes.`);
  await context.close();
} finally { await browser.close(); }
