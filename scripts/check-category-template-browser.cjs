// Local browser check of the "products first" category template (components/CategoryTemplate.tsx, 1 Nov 2026).
// Phone 390 × 844 and computer 1440 × 900, on a local build only (external requests blocked, browser marked internal):
// - the first product card starts within 330 px of the top, with the cookie notice showing (and not covering it) and
//   after Accept; the page is at most 6.5 phone screens (main height / (viewport - main top), as in the 31 Oct review);
// - no sideways overflow, no script errors or console errors (other than the blocked external requests);
// - every card: a swatch swaps the photo, price and link, and that link opens the built product page of that finish;
//   the card itself opens its plaque; chips narrow the grid and switch finishes; the questions open and close;
// - with JavaScript off the page still has its heading, cards, links, prices and questions.
// Saves phone first and second screens, full pages and computer first screens to OUT.
// PORT=4395 HOST=127.0.0.1 REVIEW_FOLLOWUP_CHECK_INTERVAL_MS=0 node server.mjs   (separately), then
// BASE=http://127.0.0.1:4395 OUT=/path/to/shots node scripts/check-category-template-browser.cjs
const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const BASE = process.env.BASE || 'http://127.0.0.1:4395';
assert(['127.0.0.1', 'localhost'].includes(new URL(BASE).hostname), 'Use a local build, not the live site');
const OUT = process.env.OUT || 'output/category-template';
fs.mkdirSync(OUT, { recursive: true });
const pages = [
  { slug: 'memorial-plaques', cards: 10, chips: { finish: 'Brass', finishWord: 'brass', narrow: 'On a wood board', narrowCount: 3 } },
  { slug: 'bench-plaques', cards: 6, chips: { finish: 'Aged brass', finishWord: 'aged brass' } },
];
const phone = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' };
const desktop = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };
const results = [];

async function newPage(browser, device, options = {}) {
  const context = await browser.newContext({ ...device, locale: 'en-GB', timezoneId: 'Europe/London', ...options });
  await context.addInitScript(() => localStorage.setItem('instaplaque-internal-v1', 'yes'));
  const blocked = new Set();
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === new URL(BASE).origin && !url.pathname.startsWith('/_vercel/')) return route.continue();
    blocked.add(route.request().url());
    return route.abort();
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const text = message.text();
    const where = message.location()?.url || '';
    // A request this check blocked (analytics, fonts CDN, Vercel's own scripts) logs a load failure: not a page fault.
    if (/Failed to load resource|ERR_FAILED|ERR_BLOCKED/.test(text) && (blocked.has(where) || [...blocked].some(url => text.includes(url)) || where.includes('/_vercel/') || !where.startsWith(BASE))) return;
    errors.push(`console: ${text} ${where}`);
  });
  return { context, page, errors, blocked };
}

const geometry = page => page.evaluate(() => {
  const main = document.querySelector('main');
  const top = main.getBoundingClientRect().top;
  const card = document.querySelector('.cat-tpl-card');
  const banner = [...document.querySelectorAll('.cookie-banner')].find(el => el.getBoundingClientRect().height > 0);
  const rect = el => el && (({ top, bottom, left, right }) => ({ top: Math.round(top), bottom: Math.round(bottom), left: Math.round(left), right: Math.round(right) }))(el.getBoundingClientRect());
  return { mainTop: Math.round(top), pageHeight: main.scrollHeight, viewport: [innerWidth, innerHeight], screens: main.scrollHeight / (innerHeight - top),
    overflow: Math.max(main.scrollWidth - main.clientWidth, document.documentElement.scrollWidth - innerWidth), card: rect(card), banner: rect(banner) };
});
const overlaps = (a, b) => a && b && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

async function settle(page) {
  await page.locator('h1').waitFor();
  await page.waitForFunction(() => document.querySelector('.cat-tpl-toolbar') && !document.querySelector('.cat-tpl-toolbar.is-static'), null, { timeout: 30000 });
  await page.waitForTimeout(500);
}

async function sweep(page) {
  const height = await page.locator('main').evaluate(main => main.scrollHeight);
  for (let y = 0; y < height; y += 500) {
    await page.locator('main').evaluate((main, y) => { main.scrollTop = y; }, y);
    await page.waitForTimeout(90);
  }
  for (const row of await page.locator('.cat-tpl-finish-row, .cat-tpl-wording-row').all()) {
    await row.scrollIntoViewIfNeeded();
    await row.evaluate(el => { el.scrollLeft = el.scrollWidth; });
    await page.waitForTimeout(150);
    await row.evaluate(el => { el.scrollLeft = 0; });
  }
  await page.locator('main').evaluate(main => { main.scrollTop = 0; });
  await page.waitForTimeout(400);
  const broken = await page.evaluate(() => [...document.querySelectorAll('.cat-tpl img')]
    .filter(img => !img.closest('details:not([open])') && (!img.complete || !img.naturalWidth)).map(img => img.getAttribute('src')));
  assert.deepEqual(broken, [], 'broken images');
}

async function checkCards(page, context, slug) {
  const cards = page.locator('.cat-tpl-card');
  const count = await cards.count();
  for (let index = 0; index < count; index++) {
    const card = cards.nth(index);
    const before = await card.evaluate(el => ({ href: el.querySelector('.cat-tpl-card-link').getAttribute('href'), src: el.querySelector('img').getAttribute('src'), price: el.querySelector('.cat-tpl-amount').textContent }));
    assert(/^from £/.test(before.price), `${slug} card ${index + 1}: from-price before a choice (${before.price})`);
    const swatches = card.locator('.cat-tpl-swatches:not(.is-wood) .cat-tpl-swatch');
    const n = await swatches.count();
    assert(n >= 2, `${slug} card ${index + 1}: finish swatches`);
    // A finish other than the pictured one, then (on wood-backed cards) the other wood.
    for (const pickWood of [false, true]) {
      let target;
      if (!pickWood) {
        for (let i = 0; i < n; i++) if (await swatches.nth(i).getAttribute('aria-pressed') !== 'true') { target = swatches.nth(i); break; }
      } else {
        const wood = card.locator('.cat-tpl-swatches.is-wood .cat-tpl-swatch[aria-pressed="false"]');
        if (!await wood.count()) continue;
        // Pin it by its label: once chosen it no longer matches aria-pressed="false".
        target = card.locator(`.cat-tpl-swatches.is-wood .cat-tpl-swatch[title="${await wood.first().getAttribute('title')}"]`);
      }
      const label = await target.getAttribute('aria-label');
      await target.click();
      await page.waitForTimeout(150);
      const after = await card.evaluate(el => ({ href: el.querySelector('.cat-tpl-card-link').getAttribute('href'), src: el.querySelector('img').getAttribute('src'), price: el.querySelector('.cat-tpl-amount').textContent, finish: el.querySelector('.cat-tpl-finish').textContent }));
      assert.equal(await target.getAttribute('aria-pressed'), 'true', `${slug} card ${index + 1}: swatch ${label} selected`);
      assert.notEqual(after.href, before.href, `${slug} card ${index + 1}: ${label} changes the link`);
      assert(/^£/.test(after.price) && label.endsWith(after.price), `${slug} card ${index + 1}: ${label} shows its own price (${after.price})`);
      assert.notEqual(after.src, before.src, `${slug} card ${index + 1}: ${label} swaps the picture`);
      const response = await context.request.get(`${BASE}${after.href}`);
      assert.equal(response.status(), 200, `${slug} card ${index + 1}: ${after.href} opens`);
      const html = await response.text();
      const heading = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1]?.replace(/<[^>]+>/g, '') || '';
      const finishWord = label.split(',')[0].replace(/^On /, '').toLowerCase().replace(' steel', '');
      assert(html.includes(`<link rel="canonical" href="https://instaplaque.co.uk${after.href}"`), `${slug} card ${index + 1}: ${after.href} is that product's page`);
      if (!pickWood) assert(heading.toLowerCase().includes(finishWord), `${slug} card ${index + 1}: ${after.href} heading "${heading}" names ${finishWord}`);
      else assert(heading.toLowerCase().includes(finishWord.includes('oak') ? 'light wood' : 'dark wood'), `${slug} card ${index + 1}: ${after.href} heading "${heading}" names the wood`);
      before.href = after.href; before.src = after.src;
    }
  }
  return count;
}

async function checkChips(page, slug, chips, total) {
  const chip = name => page.locator('.cat-tpl-chip', { hasText: new RegExp(`^${name}$`) });
  await chip(chips.finish).click();
  await page.waitForTimeout(200);
  const finishes = await page.locator('.cat-tpl-card .cat-tpl-finish').allTextContents();
  assert(finishes.length === total && finishes.every(text => text.toLowerCase().includes(chips.finishWord)), `${slug}: "${chips.finish}" chip shows every card in ${chips.finishWord} (${finishes.join(' | ')})`);
  assert.equal(await chip(chips.finish).getAttribute('aria-pressed'), 'true');
  if (chips.narrow) {
    await chip(chips.narrow).click();
    await page.waitForTimeout(200);
    assert.equal(await page.locator('.cat-tpl-card').count(), chips.narrowCount, `${slug}: "${chips.narrow}" narrows the grid`);
  }
  const counted = await page.locator('.cat-tpl-count').textContent();
  await chip('All').click();
  await page.waitForTimeout(200);
  assert.equal(await page.locator('.cat-tpl-card').count(), total, `${slug}: All shows every card again`);
  assert.notEqual(await page.locator('.cat-tpl-count').textContent(), counted, `${slug}: the count follows the chips`);
  // Sticky: the chip row stays under the header while the grid scrolls (part-way into the grid, which on a computer
  // is only two rows: past its end the row rightly leaves with it).
  await page.evaluate(() => {
    const main = document.querySelector('main');
    const grid = document.querySelector('.cat-tpl-grid');
    main.scrollTop = grid.getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop + 160;
  });
  await page.waitForTimeout(250);
  const stuck = await page.evaluate(() => Math.round(document.querySelector('.cat-tpl-toolbar').getBoundingClientRect().top - document.querySelector('main').getBoundingClientRect().top));
  assert(Math.abs(stuck) <= 1, `${slug}: chip row sticks to the top of the page (${stuck})`);
  await page.locator('main').evaluate(main => { main.scrollTop = 0; });
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/google/chrome/chrome', args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
  try {
    for (const spec of pages) {
      for (const [mode, device] of [['phone', phone], ['desktop', desktop]]) {
        const { context, page, errors } = await newPage(browser, device);
        await page.goto(`${BASE}/${spec.slug}`, { waitUntil: 'load', timeout: 60000 });
        await settle(page);
        const withNotice = await geometry(page);
        assert(withNotice.banner, `${spec.slug}/${mode}: cookie notice showing for a new visitor`);
        assert(withNotice.card.top <= 330, `${spec.slug}/${mode}: first card at ${withNotice.card.top}px with the notice`);
        assert(!overlaps(withNotice.card, withNotice.banner), `${spec.slug}/${mode}: notice covers the first card`);
        await page.screenshot({ path: path.join(OUT, `${spec.slug}.${mode}.screen1-cookie.png`) });
        await page.locator('.cookie-banner').getByRole('button', { name: 'Accept' }).click();
        await page.waitForTimeout(400);
        const accepted = await geometry(page);
        assert(!accepted.banner, `${spec.slug}/${mode}: notice gone after Accept`);
        assert(accepted.card.top <= 330, `${spec.slug}/${mode}: first card at ${accepted.card.top}px after Accept`);
        await sweep(page);
        const after = await geometry(page);
        assert.equal(after.overflow, 0, `${spec.slug}/${mode}: sideways overflow ${after.overflow}px`);
        if (mode === 'phone') assert(after.screens <= 6.5, `${spec.slug}: ${after.screens.toFixed(2)} phone screens`);
        await page.screenshot({ path: path.join(OUT, `${spec.slug}.${mode}.screen1.png`) });
        if (mode === 'phone') {
          await page.locator('main').evaluate((main, y) => { main.scrollTop = y; }, after.viewport[1] - after.mainTop);
          await page.waitForTimeout(400);
          await page.screenshot({ path: path.join(OUT, `${spec.slug}.phone.screen2.png`) });
          await page.locator('main').evaluate(main => { main.scrollTop = 0; });
        }
        // FAQ opens and closes.
        const faq = page.locator('.cat-tpl-faq-list details').first();
        await faq.locator('summary').click();
        assert(await faq.evaluate(el => el.open), `${spec.slug}/${mode}: question opens`);
        await faq.locator('summary').click();
        assert(!(await faq.evaluate(el => el.open)), `${spec.slug}/${mode}: question closes`);
        // Swatches and links (phone only: the same component at both widths), chips at both widths.
        let cardsChecked = 0;
        if (mode === 'phone') cardsChecked = await checkCards(page, context, spec.slug);
        await page.reload({ waitUntil: 'load' });
        await settle(page);
        await checkChips(page, spec.slug, spec.chips, spec.cards);
        // The card itself opens its plaque: a tap on its photo lands on the card's link.
        const first = page.locator('.cat-tpl-card').first();
        const href = await first.locator('.cat-tpl-card-link').getAttribute('href');
        const photo = await first.locator('.cat-tpl-photo').boundingBox();
        const [x, y] = [photo.x + photo.width / 2, photo.y + photo.height / 3];
        if (mode === 'phone') await page.touchscreen.tap(x, y); else await page.mouse.click(x, y);
        await page.waitForURL(`**${href}`, { timeout: 20000 });
        await page.locator('h1').waitFor();
        await page.waitForTimeout(300);
        assert.deepEqual(errors, [], `${spec.slug}/${mode}: errors`);
        // Full page, as the 31 Oct captures: notice and contact bar hidden, the app's scroller expanded.
        await page.goto(`${BASE}/${spec.slug}`, { waitUntil: 'load' });
        await settle(page);
        await sweep(page);
        await page.addStyleTag({ content: '.cookie-banner,.shop-mobile-contact{display:none!important} html,body,#root,#root>*,main{height:auto!important;max-height:none!important;overflow:visible!important}' });
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(OUT, `${spec.slug}.${mode}.full.png`), fullPage: true });
        results.push({ slug: spec.slug, mode, firstCardWithNotice: withNotice.card.top, noticeBottom: withNotice.banner.bottom, firstCardAfterAccept: accepted.card.top,
          pageHeight: after.pageHeight, mainTop: after.mainTop, screens: Number(after.screens.toFixed(2)), overflow: after.overflow, cardsChecked });
        console.log('PASS', spec.slug, mode, JSON.stringify(results[results.length - 1]));
        await context.close();
      }
      // Without JavaScript: the static page alone.
      const { context, page } = await newPage(browser, phone, { javaScriptEnabled: false });
      await page.goto(`${BASE}/${spec.slug}`, { waitUntil: 'load', timeout: 60000 });
      const noJs = await page.evaluate(() => ({
        h1: document.querySelector('h1')?.textContent,
        cards: document.querySelectorAll('.cat-tpl-card').length,
        cardLinks: [...document.querySelectorAll('.cat-tpl-card-link')].filter(a => a.getAttribute('href').startsWith('/')).length,
        swatchLinks: document.querySelectorAll('a.cat-tpl-swatch[href^="/"]').length,
        prices: [...document.querySelectorAll('.cat-tpl-amount')].filter(el => /£\d/.test(el.textContent)).length,
        questions: document.querySelectorAll('.cat-tpl-faq-list details').length,
        table: document.querySelectorAll('.price-table a[href^="/"]').length,
        firstCard: Math.round(document.querySelector('.cat-tpl-card').getBoundingClientRect().top),
      }));
      assert(noJs.h1 && noJs.cards === spec.cards && noJs.cardLinks === spec.cards && noJs.swatchLinks >= spec.cards * 2 && noJs.prices === spec.cards && noJs.questions === 6 && noJs.table >= 12,
        `${spec.slug}: page without JavaScript ${JSON.stringify(noJs)}`);
      await page.screenshot({ path: path.join(OUT, `${spec.slug}.phone.no-js.png`) });
      results.push({ slug: spec.slug, mode: 'phone, JavaScript off', ...noJs });
      console.log('PASS', spec.slug, 'no-js', JSON.stringify(noJs));
      await context.close();
    }
    fs.writeFileSync(path.join(OUT, 'browser-results.json'), JSON.stringify(results, null, 2));
    console.log('Category template browser check: RESULT PASS');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error('FAIL', error); process.exit(1); });
