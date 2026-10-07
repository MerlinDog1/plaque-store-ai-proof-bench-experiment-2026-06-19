const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

(async () => {
  const root = path.resolve('dist');
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const file = path.join(root, pathname === '/admin' ? 'index.html' : pathname);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
    res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml' })[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 950 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => localStorage.setItem('instaplaque-meta-consent', 'no'));
      let listAttempts = 0; let detailAttempts = 0;
      const order = { id: 'SYNTHETIC-1', customerName: 'Synthetic Customer', customerEmail: 'customer@example.test', status: 'paid', paymentStatus: 'paid', fulfilmentStatus: 'not_started', totalPence: 12345, currency: 'gbp', productTitle: 'Synthetic plaque', inscription: 'Exact synthetic proof', createdAt: '2026-10-07T00:00:00Z', plaqueState: { width: 148, height: 210, material: 'brushed-stainless' }, metadata: {}, emailEvents: [] };
      await page.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.origin !== base) return route.abort();
        if (!url.pathname.startsWith('/api/')) return route.continue();
        assert.equal(route.request().method(), 'GET', 'No live actions or writes in the UI test');
        let status = 200; let payload = {};
        if (url.pathname === '/api/admin/auth-config') payload = { authRequired: true, configured: true, operational: true, status: 'configured' };
        else if (url.pathname === '/api/admin/orders') {
          if (++listAttempts === 1) { status = 503; payload = { error: 'The order list took too long to load. Please retry.' }; }
          else payload = { ok: true, orders: [order] };
        } else if (url.pathname === '/api/admin/orders/SYNTHETIC-1') {
          if (++detailAttempts === 1) { status = 500; payload = { error: 'Synthetic detail failure' }; }
          else payload = { ok: true, order: { ...order, proofPackage: { visualProofSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 148 210"><text x="10" y="30">Exact synthetic proof</text></svg>' } } };
        }
        return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(payload) });
      });
      await page.goto(`${base}/admin`, { waitUntil: 'networkidle' });
      await page.getByText('Orders unavailable', { exact: true }).waitFor();
      assert.equal(await page.locator('.admin-console__stats').count(), 0, 'Failure must not display zero sales');
      assert.equal(await page.getByText('0 orders', { exact: true }).count(), 0);
      assert.equal(await page.getByText('No matching orders.', { exact: true }).count(), 0);
      await page.getByRole('button', { name: 'Retry loading orders' }).click();
      await page.getByText('1 orders', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Retry order details' }).waitFor();
      assert.equal(await page.locator('.admin-console__detail').count(), 0, 'A summary must not be offered as approved production artwork');
      assert.equal(await page.locator('.admin-console__stats').count(), 1);
      await page.getByRole('button', { name: 'Retry order details' }).click();
      await page.locator('.admin-console__detail:visible').waitFor();
      assert.match(await page.locator('.admin-console__detail:visible').innerText(), /Exact synthetic proof/);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      assert.deepEqual(errors, []);
      await page.close();
      console.log(`PASS ${width}px: failed list, honest counts, retry, isolated detail failure, exact proof, no overflow or JS errors`);
    }
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
