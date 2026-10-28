// Live browser check of the Meta purchase frame (owner msg 7132). On a public page it embeds /meta-purchase.html the way
// services/metaPurchase.ts does and posts a synthetic purchase. Chrome's network log (CDP) must show one Purchase for
// the InstaPlaque dataset with the value and event ID only. facebook.com/tr is BLOCKED, so nothing reaches Meta.
// Usage: node scripts/check-meta-purchase-live.mjs [origin]
import { createRequire } from 'node:module';

const require = createRequire('/home/coding-agent/workspace/projects/instaplaque-portrait-section/package.json');
const { chromium } = require('playwright-core');
const origin = process.argv[2] || 'https://instaplaque.co.uk';
const expected = '4216755011787795';
const eventId = 'ip_' + '0'.repeat(64);
const browser = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', args: ['--no-sandbox', '--disable-dev-shm-usage', '--renderer-process-limit=1', '--js-flags=--max-old-space-size=448'] });
// The pixel sends nothing for a 'HeadlessChrome' user agent, so present as ordinary Chrome.
const probe = await browser.newPage();
const ua = (await probe.evaluate(() => navigator.userAgent)).replace('HeadlessChrome', 'Chrome');
await probe.close();
const context = await browser.newContext({ userAgent: ua });
// Consent stays off on the page itself (no page view); only the frame's own consent read matters.
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await cdp.send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true });
await cdp.send('Network.enable');
await cdp.send('Network.setBlockedURLs', { urls: ['*facebook.com/tr*', '*facebook.com/privacy_sandbox*'] });
const sent = [];
const watch = session => session.on('Network.requestWillBeSent', e => { if (/facebook\.com\/tr/.test(e.request.url)) sent.push(e.request.url); });
watch(cdp);
// A private-looking order page as the parent: none of its path or query may reach Meta.
const parentPath = process.argv[3] || '/order-confirmed?order=PRIVATEORDERREF&session_id=cs_live_PRIVATESESSION';
await page.goto(origin + parentPath, { waitUntil: 'load', timeout: 60000 });
const reply = await page.evaluate(({ eventId }) => new Promise(resolve => {
  localStorage.setItem('instaplaque-meta-consent', 'yes');
  const frame = document.createElement('iframe');
  frame.hidden = true; frame.referrerPolicy = 'no-referrer'; frame.src = '/meta-purchase.html';
  window.addEventListener('message', e => { if (e.source === frame.contentWindow) resolve(e.data); });
  frame.onload = () => frame.contentWindow.postMessage({ type: 'instaplaque:meta-purchase', eventId, value: 1, currency: 'GBP' }, location.origin);
  document.body.appendChild(frame);
  setTimeout(() => resolve({ timeout: true }), 15000);
}), { eventId });
await page.evaluate(() => localStorage.removeItem('instaplaque-meta-consent'));
await page.waitForTimeout(1000);
const parsed = sent.map(u => new URL(u));
// Only the frame's own requests (if=true) count: setting consent on this public test page also sends its normal page view.
const fromFrame = parsed.filter(u => u.searchParams.get('if') === 'true');
const purchases = fromFrame.filter(u => u.searchParams.get('ev') === 'Purchase');
console.log(JSON.stringify({ reply, requests: parsed.map(u => [u.searchParams.get('ev'), u.searchParams.get('id'), 'dl=' + u.searchParams.get('dl'), 'rl=' + u.searchParams.get('rl'), 'if=' + u.searchParams.get('if')].join(' ')),
  purchase: purchases[0] && Object.fromEntries(['id', 'ev', 'eid', 'cd[value]', 'cd[currency]', 'dl'].map(k => [k, purchases[0].searchParams.get(k)])) }));
await browser.close();
const p = purchases[0];
// Meta reports only the site's origin as the page (dl), never the parent's path or query (the private order URL).
const ok = reply.queued === true && purchases.length === 1 && fromFrame.length === 1
  && p.searchParams.get('id') === expected && p.searchParams.get('eid') === eventId && p.searchParams.get('cd[value]') === '1'
  && p.searchParams.get('cd[currency]') === 'GBP' && p.searchParams.get('dl') === origin
  && !sent.some(u => /PRIVATE/i.test(decodeURIComponent(u)));
console.log(ok ? 'RESULT PASS: one Purchase to ' + expected + ' with value, GBP and event ID; no order path, query or page view (blocked, nothing reached Meta)' : 'RESULT FAIL');
process.exit(ok ? 0 : 1);
