// Local-only phone check of the cookie notice (site audit item 1, combined preview 31 Oct 2026; slim bar, review fix
// 1 Nov 2026, owner msg 8437). Before any cookie choice, on a 390 x 844 phone:
// - the notice is one slim row, at most 64 px tall, with Accept and Reject equally prominent (same size, colours and
//   weight) and a Settings link to /cookies;
// - it covers neither the page's H1, nor the first row of products on the "products first" template pages, nor the
//   Design/WhatsApp/Email bar at the bottom;
// - it does not take the taps meant for a page's Design online / Design on WhatsApp buttons, the bar or the
//   designer's Continue button (hit-tests the centre of each control);
// - consent is unchanged: Accept stores yes and Reject stores no for analytics, recordings and ads, and the notice goes;
//   Settings opens the cookies page.
// Saves the first screens. Never calls the live site.
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
const MAX_NOTICE_HEIGHT = 64;
const heroButtons = ['.shop-hero-choices a, .shop-hero-choices button'];
// The "products first" template pages (1 Nov 2026) have no hero buttons: their first screen is the chips, the first
// product cards and their finish swatches, with the Design/WhatsApp/Email bar showing from the start.
const templateControls = ['.cat-tpl-chip', '.cat-tpl-card-link', '.cat-tpl-swatch', '.shop-mobile-contact.is-visible a'];
const pages = [
  { path: '/', name: 'home', targets: heroButtons },
  { path: '/memorial-plaques', name: 'memorial', targets: templateControls },
  { path: '/bench-plaques', name: 'bench', targets: templateControls },
  { path: '/opening-plaques', name: 'opening', targets: templateControls },
  { path: '/house-name-plaques', name: 'house-names', targets: heroButtons },
  { path: '/professional-brass-plaques', name: 'professional', targets: heroButtons },
  { path: '/brushed-stainless-150x65-rect-plaque', name: 'product', targets: ['main a, main button'], text: /Design (online|on WhatsApp)/ },
  { path: '/design', name: 'designer', targets: ['.designer-step-footer .designer-continue'] },
];
const CONSENT_KEYS = ['instaplaque-analytics-consent-v1', 'instaplaque-replay-consent-v1', 'instaplaque-meta-consent'];

async function open(browser, url) {
  const context = await browser.newContext({ ...phone, locale: 'en-GB', timezoneId: 'Europe/London' });
  await context.addInitScript(() => localStorage.setItem('instaplaque-internal-v1', 'yes'));
  await context.route('**/*', route => (new URL(route.request().url()).origin === new URL(BASE).origin ? route.continue() : route.abort()));
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.locator('.cookie-banner').waitFor({ timeout: 15000 });
  await page.waitForTimeout(800);
  return { context, page, errors };
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/google/chrome/chrome', args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
  const results = [];
  let failures = 0;
  const fail = message => { failures++; console.log(`FAIL ${message}`); };
  try {
    for (const spec of pages) {
      const { context, page, errors } = await open(browser, `${BASE}${spec.path}`);
      const report = await page.evaluate(({ selectors, text }) => {
        const box = el => { const b = el.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), left: Math.round(b.left), right: Math.round(b.right), height: Math.round(b.height) }; };
        const notice = [...document.querySelectorAll('.cookie-banner')].find(el => el.getBoundingClientRect().height > 0);
        const out = [];
        const cards = [...document.querySelectorAll('.cat-tpl-card')];
        const rowTop = cards.length ? cards[0].getBoundingClientRect().top : null;
        for (const el of document.querySelectorAll(selectors.join(','))) {
          const label = (el.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
          // A slim notice above the contact bar may sit over a later row of products: only the first row must stay clear.
          const card = el.closest('.cat-tpl-card');
          if (card && Math.abs(card.getBoundingClientRect().top - rowTop) >= 4) continue;
          if (text && !new RegExp(text).test(label)) continue;
          const b = el.getBoundingClientRect();
          if (!b.width || !b.height || getComputedStyle(el).visibility === 'hidden') continue;
          // Inside the screen both ways: chips scrolled off to the right are not on the first screen.
          const onFirstScreen = b.top >= 0 && b.bottom <= innerHeight && b.left >= 0 && b.right <= innerWidth;
          const hit = onFirstScreen ? document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2) : null;
          out.push({ label: label.slice(0, 40), top: Math.round(b.top), bottom: Math.round(b.bottom), onFirstScreen,
            tapReachesIt: onFirstScreen ? (hit === el || el.contains(hit)) : null,
            tapGoesToNotice: onFirstScreen ? !!hit?.closest('.cookie-banner') : null });
        }
        const buttons = notice ? [...notice.querySelectorAll('.cookie-banner-actions button')].map(el => {
          const s = getComputedStyle(el);
          return { label: el.textContent.trim(), width: Math.round(el.getBoundingClientRect().width), height: Math.round(el.getBoundingClientRect().height),
            look: [s.backgroundColor, s.color, s.fontWeight, s.fontSize, s.borderTopColor, s.borderTopWidth].join(' ') };
        }) : [];
        const h1 = document.querySelector('h1');
        const firstRow = cards.filter(card => Math.abs(card.getBoundingClientRect().top - cards[0].getBoundingClientRect().top) < 4).map(box);
        const bar = document.querySelector('.shop-mobile-contact.is-visible');
        return { controls: out, notice: notice && box(notice), buttons, settings: !!notice?.querySelector('a[href="/cookies"]'),
          h1: h1 && h1.getBoundingClientRect().height ? box(h1) : null, firstRow, bar: bar && box(bar) };
      }, { selectors: spec.targets, text: spec.text ? spec.text.source : null });
      const overlaps = (a, b) => a && b && a.top < b.bottom && a.bottom > b.top && a.left < b.right && a.right > b.left;
      const n = report.notice;
      const covered = report.controls.filter(c => c.onFirstScreen && !c.tapReachesIt && c.tapGoesToNotice);
      const problems = [];
      if (!n) problems.push('no notice showing');
      else {
        if (n.height > MAX_NOTICE_HEIGHT) problems.push(`notice ${n.height} px tall (max ${MAX_NOTICE_HEIGHT})`);
        if (overlaps(n, report.h1)) problems.push('notice covers the H1');
        if (report.firstRow.some(card => overlaps(n, card))) problems.push('notice covers the first row of products');
        if (overlaps(n, report.bar)) problems.push('notice covers the Design/WhatsApp/Email bar');
      }
      const [accept, reject] = report.buttons;
      if (!accept || !reject || accept.label !== 'Accept' || reject.label !== 'Reject') problems.push(`buttons ${JSON.stringify(report.buttons.map(b => b.label))}`);
      else if (accept.look !== reject.look || accept.height !== reject.height || Math.abs(accept.width - reject.width) > 8) problems.push(`Accept and Reject differ: ${JSON.stringify(report.buttons)}`);
      if (!report.settings) problems.push('no Settings link');
      if (!report.controls.length) problems.push('no target controls found');
      if (covered.length) problems.push(`notice takes the tap for ${covered.map(c => c.label).join(', ')}`);
      if (errors.length) problems.push(`page errors ${errors.join(' | ')}`);
      if (problems.length) fail(`${spec.path}: ${problems.join('; ')}`);
      await page.screenshot({ path: path.join(OUT, `${spec.name}-phone-first-screen.png`) });
      results.push({ path: spec.path, ...report, errors, problems });
      if (!problems.length) {
        console.log(`PASS ${spec.path}: notice ${n.top}-${n.bottom} px (${n.height} px)` +
          `${report.h1 ? `, H1 ${report.h1.top}-${report.h1.bottom}` : ''}${report.firstRow.length ? `, first products ${report.firstRow[0].top}-${Math.max(...report.firstRow.map(c => c.bottom))}` : ''}` +
          `${report.bar ? `, bar from ${report.bar.top}` : ''}; ` +
          report.controls.map(c => `${c.label} ${c.top}-${c.bottom}${c.onFirstScreen ? (c.tapReachesIt ? ' tappable' : ' under the contact bar') : ' (off the first screen)'}`).slice(0, 6).join('; '));
      }
      await context.close();
    }
    // The bar that slides up once the page's own buttons scroll away must stay tappable too.
    {
      const { context, page } = await open(browser, `${BASE}/memorial-plaques`);
      // This app scrolls <main>, not the window.
      await page.locator('main').evaluate(main => { main.scrollTop = 1800; main.dispatchEvent(new Event('scroll')); });
      await page.waitForTimeout(1200);
      const bar = await page.evaluate(() => [...document.querySelectorAll('.shop-mobile-contact.is-visible a, .shop-mobile-contact.is-visible button')].map(el => {
        const box = el.getBoundingClientRect();
        const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
        return { label: (el.textContent || '').trim().slice(0, 20), tappable: hit === el || el.contains(hit) };
      }));
      await page.screenshot({ path: path.join(OUT, 'memorial-phone-scrolled-bar.png') });
      if (!bar.length || bar.some(b => !b.tappable)) fail(`bar after scrolling: ${JSON.stringify(bar)}`);
      else console.log(`PASS bar after scrolling: ${bar.map(b => b.label).join(', ')} tappable with the notice open`);
      results.push({ path: '/memorial-plaques (scrolled)', bar });
      await context.close();
    }
    // Consent is unchanged: each answer stores the same choice for analytics, recordings and ads, and closes the notice.
    for (const [label, value] of [['Accept', 'yes'], ['Reject', 'no']]) {
      const { context, page } = await open(browser, `${BASE}/garden-plaques`);
      await page.locator('.cookie-banner button', { hasText: label }).first().click();
      await page.waitForTimeout(500);
      const stored = await page.evaluate(keys => keys.map(key => localStorage.getItem(key)), CONSENT_KEYS);
      const stillOpen = await page.locator('.cookie-banner').count();
      if (stored.some(item => item !== value) || stillOpen) fail(`${label}: stored ${JSON.stringify(stored)}, notice ${stillOpen ? 'still open' : 'closed'}`);
      else console.log(`PASS ${label}: analytics, recordings and ads all "${value}", notice closed`);
      results.push({ answer: label, stored, noticeOpen: stillOpen });
      await context.close();
    }
    // Settings opens the cookies page, where the choice can be changed.
    {
      const { context, page } = await open(browser, `${BASE}/garden-plaques`);
      await page.locator('.cookie-banner a', { hasText: 'Settings' }).click();
      await page.waitForURL(url => url.pathname === '/cookies', { timeout: 20000 });
      const heading = ((await page.locator('h1').first().textContent()) || '').trim();
      if (!/cookie/i.test(heading)) fail(`Settings: /cookies heading "${heading}"`);
      else console.log(`PASS Settings: opens /cookies ("${heading}")`);
      results.push({ settings: heading });
      await context.close();
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(path.join(OUT, 'cookie-banner-clear.json'), JSON.stringify(results, null, 2));
  if (failures) { console.log(`${failures} failure(s)`); process.exit(1); }
  console.log(`Cookie notice: one slim row of at most ${MAX_NOTICE_HEIGHT} px, clear of every H1, first product row, Design, WhatsApp and Continue control and the contact bar on a 390 x 844 phone; consent unchanged.`);
})().catch(error => { console.error(error); process.exit(1); });
