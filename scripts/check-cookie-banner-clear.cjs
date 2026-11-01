// Local-only phone check (site audit item 1, combined preview 31 Oct 2026): before any cookie choice, the notice must
// not take the taps meant for a page's Design online / Design on WhatsApp buttons, the Design/WhatsApp/Email bar or the
// designer's Continue button. Hit-tests the centre of each control at 390 x 844 with the notice open, then saves the
// first screen. Never calls the live site and never answers the notice.
// BASE=http://127.0.0.1:4390 OUT=/path/to/shots node scripts/check-cookie-banner-clear.cjs
const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const BASE = process.env.BASE || 'http://127.0.0.1:4390';
assert(['127.0.0.1', 'localhost'].includes(new URL(BASE).hostname), 'Use a local build, not the live site');
const OUT = process.env.OUT || 'output/cookie-banner-clear';
fs.mkdirSync(OUT, { recursive: true });
const phone = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' };
const heroButtons = ['.shop-hero-choices a, .shop-hero-choices button'];
// The "products first" template pages (1 Nov 2026) have no hero buttons: their first screen is the chips, the first
// product cards and their finish swatches, with the Design/WhatsApp/Email bar showing from the start.
const templateControls = ['.cat-tpl-chip', '.cat-tpl-card-link', '.cat-tpl-swatch', '.shop-mobile-contact.is-visible a'];
const pages = [
  { path: '/', name: 'home', targets: heroButtons },
  { path: '/memorial-plaques', name: 'memorial', targets: templateControls },
  { path: '/bench-plaques', name: 'bench', targets: templateControls },
  { path: '/house-name-plaques', name: 'house-names', targets: heroButtons },
  { path: '/professional-brass-plaques', name: 'professional', targets: heroButtons },
  { path: '/brushed-stainless-150x65-rect-plaque', name: 'product', targets: ['main a, main button'], text: /Design (online|on WhatsApp)/ },
  { path: '/design', name: 'designer', targets: ['.designer-step-footer .designer-continue'] },
];

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/google/chrome/chrome', args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
  const results = [];
  let failures = 0;
  try {
    for (const spec of pages) {
      const context = await browser.newContext({ ...phone, locale: 'en-GB', timezoneId: 'Europe/London' });
      await context.addInitScript(() => localStorage.setItem('instaplaque-internal-v1', 'yes'));
      await context.route('**/*', route => new URL(route.request().url()).origin === new URL(BASE).origin ? route.continue() : route.abort());
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(`${BASE}${spec.path}`, { waitUntil: 'networkidle', timeout: 60000 });
      await page.locator('.cookie-banner').waitFor({ timeout: 15000 });
      await page.waitForTimeout(800);
      const banner = await page.locator('.cookie-banner').boundingBox();
      const report = await page.evaluate(({ selectors, text }) => {
        const out = [];
        for (const el of document.querySelectorAll(selectors.join(','))) {
          const label = (el.textContent || '').replace(/\s+/g, ' ').trim();
          if (text && !new RegExp(text).test(label)) continue;
          const box = el.getBoundingClientRect();
          if (!box.width || !box.height || getComputedStyle(el).visibility === 'hidden') continue;
          // Inside the screen both ways: chips scrolled off to the right are not on the first screen.
          const onFirstScreen = box.top >= 0 && box.bottom <= innerHeight && box.left >= 0 && box.right <= innerWidth;
          const x = box.left + box.width / 2, y = box.top + box.height / 2;
          const hit = onFirstScreen ? document.elementFromPoint(x, y) : null;
          out.push({ label: label.slice(0, 40), top: Math.round(box.top), bottom: Math.round(box.bottom), onFirstScreen,
            tapReachesIt: onFirstScreen ? (hit === el || el.contains(hit)) : null,
            tapGoesToNotice: onFirstScreen ? !!hit?.closest('.cookie-banner') : null });
        }
        const h1 = document.querySelector('h1')?.getBoundingClientRect();
        return { controls: out, h1: h1 ? { top: Math.round(h1.top), bottom: Math.round(h1.bottom) } : null };
      }, { selectors: spec.targets, text: spec.text ? spec.text.source : null });
      // The notice is what is under test: a control under the Design/WhatsApp/Email bar (which the template pages show
      // from the start) is not the notice's doing. Hero buttons never sit under the bar: it hides while they show.
      const covered = report.controls.filter(c => c.onFirstScreen && !c.tapReachesIt && c.tapGoesToNotice);
      const noticeCoversH1 = report.h1 && banner && report.h1.top < banner.y + banner.height && report.h1.bottom > banner.y;
      if (!report.controls.length) { failures++; console.log(`FAIL ${spec.path}: no target controls found`); }
      if (covered.length) { failures++; console.log(`FAIL ${spec.path}: notice takes the tap for ${covered.map(c => c.label).join(', ')}`); }
      if (errors.length) { failures++; console.log(`FAIL ${spec.path}: page errors ${errors.join(' | ')}`); }
      await page.screenshot({ path: path.join(OUT, `${spec.name}-phone-first-screen.png`) });
      results.push({ path: spec.path, notice: banner && { top: Math.round(banner.y), bottom: Math.round(banner.y + banner.height) }, noticeCoversH1, ...report, errors });
      console.log(`${covered.length || errors.length ? 'FAIL' : 'PASS'} ${spec.path}: notice ${Math.round(banner.y)}-${Math.round(banner.y + banner.height)} px; ` +
        report.controls.map(c => `${c.label} ${c.top}-${c.bottom}${c.onFirstScreen ? (c.tapReachesIt ? ' tappable' : c.tapGoesToNotice ? ' COVERED' : ' under the contact bar') : ' (off the first screen)'}`).join('; ') +
        (noticeCoversH1 ? '; notice overlaps the heading' : ''));
      await context.close();
    }
    // The bar that slides up once the page's own buttons scroll away must stay tappable too.
    const context = await browser.newContext({ ...phone, locale: 'en-GB', timezoneId: 'Europe/London' });
    await context.addInitScript(() => localStorage.setItem('instaplaque-internal-v1', 'yes'));
    await context.route('**/*', route => new URL(route.request().url()).origin === new URL(BASE).origin ? route.continue() : route.abort());
    const page = await context.newPage();
    await page.goto(`${BASE}/memorial-plaques`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.locator('.cookie-banner').waitFor({ timeout: 15000 });
    // This app scrolls <main>, not the window.
    await page.locator('main').evaluate(main => { main.scrollTop = 1800; main.dispatchEvent(new Event('scroll')); });
    await page.waitForTimeout(1200);
    const bar = await page.evaluate(() => [...document.querySelectorAll('.shop-mobile-contact.is-visible a, .shop-mobile-contact.is-visible button')].map(el => {
      const box = el.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      return { label: (el.textContent || '').trim().slice(0, 20), tappable: hit === el || el.contains(hit) };
    }));
    await page.screenshot({ path: path.join(OUT, 'memorial-phone-scrolled-bar.png') });
    if (!bar.length || bar.some(b => !b.tappable)) { failures++; console.log(`FAIL bar after scrolling: ${JSON.stringify(bar)}`); }
    else console.log(`PASS bar after scrolling: ${bar.map(b => b.label).join(', ')} tappable with the notice open`);
    results.push({ path: '/memorial-plaques (scrolled)', bar });
    await context.close();
  } finally {
    await browser.close();
  }
  fs.writeFileSync(path.join(OUT, 'cookie-banner-clear.json'), JSON.stringify(results, null, 2));
  if (failures) { console.log(`${failures} failure(s)`); process.exit(1); }
  console.log('Cookie notice clear of every Design, WhatsApp and Continue control on a 390 x 844 phone.');
})().catch(error => { console.error(error); process.exit(1); });
