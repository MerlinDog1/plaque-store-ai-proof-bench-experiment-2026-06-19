// Live browser check of the Meta pixel (owner msg 7132): with advertising consent a public page loads the pixel and
// sends PageView to the InstaPlaque dataset. It watches Chrome's own network log (CDP) and BLOCKS facebook.com/tr there,
// so the test adds nothing to the dataset.
// Usage: node scripts/check-meta-pixel-live.mjs [url]
import { createRequire } from 'node:module';

const require = createRequire('/home/coding-agent/workspace/projects/instaplaque-portrait-section/package.json');
const { chromium } = require('playwright-core');
const url = process.argv[2] || 'https://instaplaque.co.uk/design?utm_source=meta&utm_medium=paid_social&utm_campaign=promo_video';
const expected = '4216755011787795';
const browser = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', args: ['--no-sandbox', '--disable-dev-shm-usage', '--renderer-process-limit=1', '--js-flags=--max-old-space-size=448',
  '--disable-blink-features=AutomationControlled'] });   // the pixel sends nothing for browsers flagged as automated
// The pixel sends nothing for a 'HeadlessChrome' user agent, so present as ordinary Chrome.
const probe = await browser.newPage();
const ua = (await probe.evaluate(() => navigator.userAgent)).replace('HeadlessChrome', 'Chrome');
await probe.close();
const page = await (await browser.newContext({ userAgent: ua, viewport: { width: 1280, height: 800 } })).newPage();
await page.addInitScript(() => {
  try { localStorage.setItem('instaplaque-meta-consent', 'yes'); } catch {}
  Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
});
const cdp = await page.context().newCDPSession(page);
await cdp.send('Network.enable');
await cdp.send('Network.setBlockedURLs', { urls: ['*facebook.com/tr*', '*facebook.com/privacy_sandbox*'] });
const sent = [], blocked = new Set();
const seen = [];
cdp.on('Network.requestWillBeSent', e => {
  if (/facebook/.test(e.request.url)) seen.push(e.type + ' ' + e.request.url.slice(0, 90));
  if (/facebook\.com\/tr/.test(e.request.url)) sent.push({ id: e.requestId, url: e.request.url, type: e.type });
});
cdp.on('Network.loadingFailed', e => { if (e.blockedReason) blocked.add(e.requestId); });
await page.goto(url, { waitUntil: 'load', timeout: 60000 });
for (let i = 0; i < 30 && !sent.length; i++) await page.waitForTimeout(500);
await page.waitForTimeout(1000);
const ids = sent.map(s => new URL(s.url).searchParams.get('id'));
const events = sent.map(s => new URL(s.url).searchParams.get('ev'));
const allBlocked = sent.every(s => blocked.has(s.id));
console.log(JSON.stringify({ seen }));
console.log(JSON.stringify({ url, attempts: sent.length, types: [...new Set(sent.map(s => s.type))], ids: [...new Set(ids)], events: [...new Set(events)], allBlocked }));
await browser.close();
if (!sent.length || ids.some(id => id !== expected) || !events.includes('PageView') || !allBlocked) { console.log('RESULT FAIL'); process.exit(1); }
console.log('RESULT PASS: PageView goes to ' + expected + ' only (blocked in the browser, nothing reached Meta)');
