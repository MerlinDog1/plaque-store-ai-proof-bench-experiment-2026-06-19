// Offline delivery test: even the real Google tag runs behind an intercepting
// context. Every collection request is fulfilled locally; no synthetic sale
// reaches Google, Stripe, the live website, or the business database.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { chromium } = require('@playwright/test');
const snapshotPath = process.argv[2];
if (!snapshotPath) throw Error('Supply a saved public GA4 tag JS snapshot as the sole argument.');
const tagCode = fs.readFileSync(snapshotPath, 'utf8');
const source = file => fs.readFileSync(file, 'utf8');
const compile = file => ts.transpileModule(source(file), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const modules = {
  '/services/googlePurchase.js': compile('services/googlePurchase.ts').replaceAll("'./metaPixel'", "'/services/metaPixel.js'"),
  '/services/metaPixel.js': compile('services/metaPixel.ts'),
};
const bootstrap = source('index.html').match(/<script>\s*(window\.dataLayer[\s\S]*?)<\/script>/)[1];
const fixture = '<!doctype html><title>Private fixture</title><script>' + bootstrap + '</script>' +
  '<script type="module">import { trackGooglePurchase, OPTIONAL_AD_CONSENT_CHANGED } from "/services/googlePurchase.js";' +
  'import {setMetaConsent} from "/services/metaPixel.js";' +
  'window.runPurchase=order=>trackGooglePurchase(order);window.setConsent=setMetaConsent;' +
  'window.addEventListener(OPTIONAL_AD_CONSENT_CHANGED,()=>{window.autoTask=trackGooglePurchase(window.testOrder)});' +
  '</script><body>Private fixture with no actual order data</body>';
const origin = 'https://instaplaque.co.uk';
const order = { id: 'private-synthetic-order', paymentStatus: 'paid', totalPence: 7640,
  currency: 'GBP', stripeCheckoutSessionId: 'cs_live_synthetic123',
  customerEmail: 'private@example.invalid', inscription: 'PRIVATE INSCRIPTION' };
const routeFor = o => origin + '/order-confirmed?order=' + o.id + '&session_id=' + o.stripeCheckoutSessionId;

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE || '/usr/bin/google-chrome',
    headless: true, args: ['--disable-dev-shm-usage', '--disable-background-networking'] });
  const results = [];
  try {
    for (const scenario of ['paid', 'unpaid', 'test', 'rejected', 'late-consent']) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
      try {
        const external = [], hits = [], errors = [], requests = [];
        if (scenario === 'paid') {
          await context.addCookies([{ name: '_ga', value: 'GA1.1.1111111111.2222222222',
            domain: '.instaplaque.co.uk', path: '/', secure: true, sameSite: 'Lax' }]);
        }
        let consent = ['rejected', 'late-consent'].includes(scenario) ? 'no' : 'yes';
        await context.addInitScript(value => {
          if (localStorage.getItem('instaplaque-meta-consent') === null)
            localStorage.setItem('instaplaque-meta-consent', value);
        }, consent);
        await context.route('**/*', async route => {
          const req = route.request(), url = new URL(req.url());
          requests.push(req.url());
          if (url.origin === origin) {
            const body = modules[url.pathname]
              || (url.pathname === '/google-purchase.html' ? source('public/google-purchase.html') : null)
              || (url.pathname === '/google-purchase.js' ? source('public/google-purchase.js') : null)
              || (url.pathname === '/order-confirmed' ? fixture : null);
            assert(body, 'Unexpected site/API request: ' + url.pathname);
            return route.fulfill({ status: 200, contentType: url.pathname.endsWith('.js') ? 'text/javascript' : 'text/html', body });
          }
          external.push({ url: req.url(), body: req.postData() || '', headers: req.headers() });
          if (url.hostname === 'www.googletagmanager.com' && url.pathname === '/gtag/js'
            && url.searchParams.get('id') === 'G-FKP17EXNBX') {
            return route.fulfill({ status: 200, contentType: 'text/javascript', body: tagCode });
          }
          if (url.pathname.endsWith('/collect')) {
            const params = new URLSearchParams(url.search);
            for (const [key, value] of new URLSearchParams(req.postData() || '')) params.set(key, value);
            if (params.get('en') === 'purchase') hits.push(Object.fromEntries(params));
          }
          // No fallback to network: all non-fixture and all measurement traffic
          // is blocked/answered here, including any unexpected third party.
          return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*' }, body: '' });
        });
        const page = await context.newPage();
        page.on('pageerror', error => errors.push(error.message));
        const sample = { ...order };
        if (scenario === 'unpaid') sample.paymentStatus = 'unpaid';
        if (scenario === 'test') sample.stripeCheckoutSessionId = 'cs_test_synthetic123';
        await page.goto(routeFor(sample), { referer: origin + '/checkout?proof=private-proof-reference' });
        await page.waitForFunction(() => typeof window.runPurchase === 'function');
        const first = await page.evaluate(o => window.runPurchase(o), sample);
        const shouldTrack = scenario === 'paid';
        assert.equal(first, shouldTrack, scenario + ' result');
        if (scenario === 'late-consent') {
          await page.evaluate(o => { window.testOrder = o; window.setConsent(true); }, sample);
          assert.equal(await page.evaluate(() => window.autoTask), true);
        }
        const expected = shouldTrack || scenario === 'late-consent' ? 1 : 0;
        assert.equal(hits.length, expected, scenario + ' intercepted purchase count');
        if (expected) {
          assert.equal(hits[0].tid, 'G-FKP17EXNBX');
          if (scenario === 'paid') assert.equal(hits[0].cid, '1111111111.2222222222', 'Retain the existing GA client across checkout');
          assert.equal(hits[0].dl, origin + '/order-confirmed');
          assert(!hits[0].dr);
          assert.equal(hits[0]['ep.transaction_id'], 'ip_' +
            crypto.createHash('sha256').update('instaplaque:ga4:purchase:' + sample.id).digest('hex'));
          assert.equal(hits[0]['epn.value'], '76.4');
          assert.equal(hits[0].cu, 'GBP');
          assert.equal(await page.evaluate(o => window.runPurchase(o), sample), false);
          await page.reload();
          await page.waitForFunction(() => typeof window.runPurchase === 'function');
          assert.equal(await page.evaluate(o => window.runPurchase(o), sample), false);
          assert.equal(hits.length, 1, 'Reload must not emit another sale');
        } else assert.equal(external.length, 0, 'No Google requests without a valid consented live purchase');
        const traffic = JSON.stringify(external);
        for (const secret of [order.id, order.stripeCheckoutSessionId, order.customerEmail,
          'private-proof-reference', 'PRIVATE INSCRIPTION']) {
          assert(!traffic.includes(secret), 'Private value in outbound request: ' + secret);
        }
        assert.deepEqual(errors, [], scenario + ' page errors');
        results.push({ scenario, purchaseRequestsIntercepted: hits.length, googleDelivery: 'blocked', passed: true });
      } finally { await context.close(); }
    }
    fs.mkdirSync('output/purchase-tracking', { recursive: true });
    fs.writeFileSync('output/purchase-tracking/browser-results.json', JSON.stringify({
      tagSha256: crypto.createHash('sha256').update(tagCode).digest('hex'),
      realGoogleTagWithLocallyInterceptedCollection: true, liveAccountReceiptVerified: false, results,
    }, null, 2) + '\n');
    for (const result of results) console.log('PASS', result.scenario, 'intercepted purchases:', result.purchaseRequestsIntercepted);
    console.log('No live collection, order, payment, email or database request was sent.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
