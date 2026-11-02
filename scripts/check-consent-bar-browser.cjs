// Local built-page checks for the neutral cookie bar. No external request is allowed.
// BASE=http://127.0.0.1:4398 OUT=/path/to/evidence cody-job -- node scripts/check-consent-bar-browser.cjs
const { chromium } = require('@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = new URL(process.env.BASE || 'http://127.0.0.1:4398').origin;
assert(['127.0.0.1', 'localhost'].includes(new URL(base).hostname), 'Local build only');
const out = process.env.OUT || 'output/consent-bar';
fs.mkdirSync(out, { recursive: true });
const product = '/brushed-stainless-150x65-rect-plaque';
const overlap = (a, b) => a && b && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
const devices = { phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true }, desktop: { viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 } };
async function dimensions(page) {
  return page.evaluate(() => {
    const rect = el => el && (({ top, left, right, bottom, width, height }) => ({ top, left, right, bottom, width, height }))(el.getBoundingClientRect());
    const visible = el => el && el.getBoundingClientRect().height > 0 && getComputedStyle(el).visibility !== 'hidden';
    const banner = [...document.querySelectorAll('.cookie-banner')].find(visible);
    const buttons = [...banner.querySelectorAll('button')].map(el => {
      const css = getComputedStyle(el);
      return { rect: rect(el), background: css.backgroundColor, color: css.color, font: css.font, border: css.border, text: el.textContent };
    });
    return { banner: rect(banner), background: getComputedStyle(banner).backgroundColor, animation: getComputedStyle(banner).animationName,
      iterations: getComputedStyle(banner).animationIterationCount, buttons,
      shortLines: [...banner.querySelectorAll('.cookie-banner-short > span')].map(rect),
      headings: [...document.querySelectorAll('h1, .cat-tpl-intro')].filter(visible).map(rect),
      contact: rect([...document.querySelectorAll('.shop-mobile-contact.is-visible')].find(visible)),
      continue: rect([...document.querySelectorAll('.designer-step-footer button')].find(el => /Continue/.test(el.textContent))),
      footer: rect(document.querySelector('.designer-step-footer')),
      overflow: document.documentElement.scrollWidth - innerWidth };
  });
}
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE || '/opt/google/chrome/chrome', args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
  const results = [];
  try {
    for (const [mode, routes] of [['phone', [['home', '/'], ['memorial', '/memorial-plaques'], ['product', product], ['design', '/design'], ['cookies', '/cookies']]], ['desktop', [['home', '/'], ['product', product]]]]) {
      for (const [name, routePath] of routes) {
        const context = await browser.newContext({ ...devices[mode], locale: 'en-GB', timezoneId: 'Europe/London', serviceWorkers: 'block' });
        const blocked = [], errors = [];
        await context.route('**/*', async route => {
          const request = route.request(), url = new URL(request.url());
          if (url.origin === base && !url.pathname.startsWith('/_vercel/') && !url.pathname.startsWith('/api/') && request.method() === 'GET') return route.continue();
          blocked.push(url.origin + url.pathname);
          return route.abort();
        });
        const page = await context.newPage();
        page.on('pageerror', e => errors.push(e.message));
        const response = await page.goto(base + routePath, { waitUntil: 'load', timeout: 60000 });
        assert.equal(response.status(), 200, `${mode}/${name} HTTP`);
        await page.waitForFunction(() => !document.querySelector('#static-cookie-banner') && !!document.querySelector('.cookie-banner'), null, { timeout: 30000 });
        if (name === 'design') await page.locator('.designer-step-footer').waitFor();
        if (name === 'cookies') await page.getByRole('switch', { name: 'Statistics', exact: true }).waitFor();
        await page.waitForTimeout(750);
        const initial = await dimensions(page);
        await page.screenshot({ path: path.join(out, `${mode}-${name}.jpg`), type: 'jpeg', quality: 86, scale: 'css' });
        assert.equal(initial.overflow, 0, `${mode}/${name}: overflow`);
        assert.equal(initial.background, 'rgb(32, 59, 50)', `${mode}/${name}: green notice`);
        assert.equal(initial.buttons.length, 2);
        for (const button of initial.buttons) assert(button.rect.height >= 44, `${mode}/${name}: 44px touch targets`);
        const [accept, reject] = initial.buttons;
        assert.equal(accept.rect.width, reject.rect.width, 'Equal button widths');
        assert.equal(accept.rect.height, reject.rect.height, 'Equal button heights');
        assert.equal(accept.rect.top, reject.rect.top, 'Same row and vertical prominence');
        for (const prop of ['background', 'color', 'font', 'border']) assert.equal(accept[prop], reject[prop], `Equal ${prop}`);
        assert(initial.headings.every(heading => !overlap(heading, initial.banner)), `${mode}/${name}: heading/intro overlap ${JSON.stringify(initial)}`);
        assert(!overlap(initial.contact, initial.banner), `${mode}/${name}: contact bar overlap`);
        if (mode === 'phone') {
          assert(initial.banner.height <= 88.1, `${mode}/${name}: notice height ${initial.banner.height}`);
          assert(initial.shortLines.every(line => line.height <= 15.1), `${mode}/${name}: two short text lines`);
        }
        if (name === 'design') {
          assert(initial.banner.top <= 10, 'Designer notice stays at the top');
          assert(initial.continue && !overlap(initial.continue, initial.banner), 'Continue remains unobstructed');
        }
        assert.equal(initial.iterations, '1', 'No looping animation');
        await page.emulateMedia({ reducedMotion: 'reduce' });
        assert.equal((await dimensions(page)).animation, 'none', 'Reduced motion respected');
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        // Reveal the phone contact strip by scrolling the actual app scroller.
        let scrolled;
        if (mode === 'phone' && ['home', 'product', 'memorial'].includes(name)) {
          await page.locator('main').evaluate(main => { main.scrollTop = 1100; });
          await page.waitForTimeout(600);
          scrolled = await dimensions(page);
          assert(!overlap(scrolled.contact, scrolled.banner), `${name}: scrolled contact bar remains clear`);
        }
        assert.deepEqual(errors, [], `${mode}/${name}: page errors`);
        results.push({ mode, name, path: routePath, initial, scrolled, blocked: [...new Set(blocked)], errors });
        await context.close();
        console.log(`PASS ${mode}/${name}: ${Math.round(initial.banner.height)}px notice, equal 44px+ buttons, no heading/contact overlap`);
      }
    }
    fs.writeFileSync(path.join(out, 'layout-results.json'), JSON.stringify(results, null, 2) + '\n');
  } finally { await browser.close(); }
})().catch(e => { console.error(e.stack); process.exitCode = 1; });
