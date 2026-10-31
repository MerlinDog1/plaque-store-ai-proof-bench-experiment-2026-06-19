// Five real UI cases. All tracker traffic is intercepted: no synthetic analytics reaches a provider.
// BASE=http://127.0.0.1:4382 [TEST_ORIGIN=https://instaplaque.co.uk] node scripts/check-site-statistics-browser.cjs
// VERCEL_SCRIPT is a locally saved /_vercel/insights/script.js (tested vendor runtime, never an event).
// VERCEL_BYPASS, when needed, is sent ONLY to the exact BASE origin and is never logged.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = new URL(process.env.BASE || 'http://127.0.0.1:4382').origin;
const origin = new URL(process.env.TEST_ORIGIN || base).origin;
const output = process.env.CHECK_OUTPUT || 'output/cookieless-stats/browser-local';
const vendorScript = fs.readFileSync(process.env.VERCEL_SCRIPT || 'output/cookieless-stats/vercel-insights.js', 'utf8');
const canonical = /https:\/\/(www\.)?instaplaque\.co\.uk$/.test(origin);
const bypass = process.env.VERCEL_BYPASS;
const types = ['ad_storage', 'ad_user_data', 'ad_personalization', 'analytics_storage'];
function tracker(url) {
  if (url.includes('/_vercel/insights/')) return url.endsWith('/script.js') || url.includes('/script.js?') ? 'vercelScript' : 'vercelView';
  if (/posthog/.test(url)) return /\/static\//.test(url) ? 'replayScript' : 'posthog';
  if (/connect\.facebook\.net|facebook\.com\/tr/.test(url)) return 'meta';
  if (/googletagmanager\.com|google-analytics\.com|googleadservices\.com|doubleclick\.net|analytics\.google\.com/.test(url)) return 'google';
  return null;
}
const counts = rows => Object.fromEntries(['vercelScript', 'vercelView', 'posthog', 'replayScript', 'meta', 'google'].map(type => [type, rows.filter(row => row.type === type).length]));
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE || '/opt/google/chrome/chrome', args: ['--no-sandbox', '--disable-dev-shm-usage', '--renderer-process-limit=1'] });
  const results = [];
  try {
    for (const name of ['no-choice', 'reject', 'accept', 'off-before-choice', 'off-after-accept']) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1', locale: 'en-GB', timezoneId: 'Europe/London' });
      await context.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }); });
      const seen = [], errors = []; let phase = 'initial';
      await context.route('**/*', async route => {
        const request = route.request(), url = request.url(), kind = tracker(url);
        if (kind) {
          const payload = request.postDataJSON();
          seen.push({ phase, type: kind, path: new URL(url).pathname, ...(kind === 'vercelView' ? { payload } : {}) });
          if (kind === 'vercelScript') {
            if (base.startsWith('https://') && new URL(url).origin === base) return route.continue({ headers: { ...request.headers(), ...(bypass ? { 'x-vercel-protection-bypass': bypass } : {}) } });
            return route.fulfill({ status: 200, contentType: 'application/javascript', body: vendorScript });
          }
          if (kind === 'vercelView' || kind === 'posthog') return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
          return route.abort();
        }
        if (new URL(url).origin === origin) {
          const headers = { ...request.headers() };
          if (bypass) headers['x-vercel-protection-bypass'] = bypass;
          if (origin !== base) {
            const response = await route.fetch({ url: base + new URL(url).pathname + new URL(url).search, headers });
            return route.fulfill({ response });
          }
          return route.continue({ headers });
        }
        return route.continue();
      });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      const response = await page.goto(origin + '/cookies', { waitUntil: 'load', timeout: 60000 });
      assert.equal(response.status(), 200, 'Cookies page must be accessible');
      const toggle = page.getByRole('switch', { name: 'Statistics', exact: true });
      await toggle.waitFor();
      await page.waitForFunction(() => !document.querySelector('[role="switch"]')?.disabled);
      await page.waitForTimeout(4200);
      assert.equal(await toggle.getAttribute('aria-checked'), 'true');
      assert.ok(seen.some(row => row.type === 'vercelView'), 'Default-on Vercel pageview');
      const initial = counts(seen);
      assert.equal(initial.posthog + initial.replayScript + initial.meta, 0, 'No optional trackers before Accept');
      if (name === 'no-choice') {
        await page.screenshot({ path: path.join(output, 'phone-notice.png') });
        await page.locator('.cookie-banner').screenshot({ path: path.join(output, 'phone-notice-detail.png') });
      }
      phase = 'choice';
      if (name === 'reject') await page.getByRole('button', { name: 'Reject', exact: true }).click();
      if (name === 'accept' || name === 'off-after-accept') await page.getByRole('button', { name: 'Accept', exact: true }).click();
      await page.waitForTimeout(700);
      if (name.startsWith('off-')) {
        phase = 'objected'; await toggle.click();
        assert.equal(await toggle.getAttribute('aria-checked'), 'false');
        await page.waitForTimeout(150);
      }
      phase = 'probe';
      const beforeProbe = seen.length;
      await page.evaluate(() => {
        history.pushState({}, '', '/privacy'); history.pushState({}, '', '/cookies');
        // Also exercise a pending/direct SDK call after an objection, not just the UI state.
        window.va?.('pageview', {});
        window.va?.('event', { name: 'SHOULD_NOT_BE_STATISTICS', data: { profile: 'PRIVATE' } });
        window.va?.('identify', { userId: 'SHOULD_NOT_IDENTIFY' });
      });
      await page.waitForTimeout(450);
      const afterProbe = counts(seen.slice(beforeProbe));
      const off = name.startsWith('off-');
      assert.equal(afterProbe.vercelView > 0, !off, 'Objection stops loaded SDK pageviews immediately');
      const state = await page.evaluate(() => ({ statistics: localStorage.getItem('instaplaque-statistics-v1'),
        analytics: localStorage.getItem('instaplaque-analytics-consent-v1'), meta: localStorage.getItem('instaplaque-meta-consent'),
        replay: localStorage.getItem('instaplaque-replay-consent-v1'), attribution: localStorage.getItem('__va_attribution'),
        consent: [...(window.dataLayer || [])].filter(args => args[0] === 'consent' && args[1] === 'update').map(args => args[2]).at(-1) }));
      const accepted = name === 'accept' || name === 'off-after-accept';
      assert.equal(state.attribution, null, 'No Vercel identity persistence');
      assert.equal(state.analytics, accepted ? 'yes' : name === 'reject' ? 'no' : null);
      for (const type of types) assert.equal(state.consent[type], accepted && canonical ? 'granted' : 'denied');
      const total = counts(seen);
      assert.equal(total.meta > 0, accepted);
      assert.equal(total.posthog > 0, accepted && canonical);
      assert.equal(total.replayScript > 0, accepted && canonical);
      assert.equal(total.google > 0, canonical);
      for (const row of seen.filter(row => row.type === 'vercelView')) {
        assert.equal(row.path, '/_vercel/insights/view', 'No Vercel identity/session/custom-event endpoints');
        assert.equal(new URL(row.payload.o).search, '');
        assert.equal(new URL(row.payload.o).hash, '');
        for (const field of ['userId', 'groupId', 'props', 'en', 'ed', '__cdp']) assert.ok(!(field in row.payload));
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'No phone overflow');
      assert.deepEqual(errors, []);
      if (name === 'reject') await page.screenshot({ path: path.join(output, 'phone-cookies-on.png'), fullPage: true });
      if (name === 'off-after-accept') await page.screenshot({ path: path.join(output, 'phone-cookies-off.png'), fullPage: true });
      results.push({ name, initial, total, afterProbe, state, errors });
      // Extra local reload proof only; hosted run stays at one page load per case.
      if (base.startsWith('http://127.0.0.1') && off) {
        phase = 'reload'; const mark = seen.length;
        await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(4200);
        assert.equal(counts(seen.slice(mark)).vercelScript, 0, 'Saved objection prevents script loading on next page');
        assert.equal(await toggle.getAttribute('aria-checked'), 'false');
        if (name === 'off-before-choice') {
          await page.getByRole('button', { name: 'Accept', exact: true }).click(); await page.waitForTimeout(400);
          assert.equal(counts(seen.slice(mark)).vercelScript, 0, 'Accept cannot restart objected statistics');
        }
      }
      await context.close();
      console.log('PASS ' + name + ': ' + JSON.stringify({ total, afterProbe }));
    }
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ base, origin, canonical, results }, null, 2) + '\n');
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
