// 1 Nov 2026: owner requests light/dark solid wood, never a species; assertions follow the customer wording.
// Local browser check of the "products first" category template (components/CategoryTemplate.tsx, 1 Nov 2026): the
// twelve template pages: the live eight plus house, donor, church and practice (stage 3, 4 Nov 2026).
// Phone 390 × 844 and computer 1440 × 900, on a local build only (external requests blocked, browser marked internal):
// - the first product card starts within 330 px of the top, with the cookie notice showing and after Accept; the notice
//   is a compact bar (88 px or less on the phone) covering neither the H1, the first row of products nor the contact bar;
// - at most 7.6 phone screens: owner msg 8603 asks for a separate, full-width video section;
//   report every page's measured length (main height / (viewport - main top));
// - no sideways overflow, no script errors or console errors (other than the blocked external requests);
// - the largest paint on the first screen is a product photo; the film, tap to play in its own section after the proof, loads nothing
//   before the tap, keeps its box when the poster loads and while it plays, and plays when tapped;
// - every card: a swatch swaps the photo, price and link, and that link opens the built product page of that finish
//   (tree: the designer on that plate, on the board and stake); the card itself opens its plaque; chips narrow the grid,
//   switch finishes and update the count; the questions open and close;
// - opening: the date planner names, for a date, the approval day services/occasionPlanner.ts gives for each kind of
//   plaque, refuses a date too close and does not count one past its calendar;
// - with JavaScript off the page still has its heading, cards, links, prices and questions.
// Saves phone first and second screens, full pages and computer first screens to OUT.
// PORT=4395 HOST=127.0.0.1 REVIEW_FOLLOWUP_CHECK_INTERVAL_MS=0 node server.mjs   (separately), then
// BASE=http://127.0.0.1:4395 OUT=/path/to/shots node scripts/check-category-template-browser.cjs
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '@playwright/test');
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
  { slug: 'garden-plaques', cards: 8, chips: { finish: 'Brass', finishWord: 'brass', narrow: 'On a wood board', narrowCount: 1 } },
  { slug: 'tree-memorial-plaques', cards: 6, stake: true, chips: { finish: 'Brass', finishWord: 'brass' } },
  { slug: 'brass-plaques', cards: 8, chips: { finish: 'Polished', finishWord: 'polished brass', narrow: 'On a wood board', narrowCount: 1 } },
  { slug: 'stainless-steel-plaques', cards: 8, chips: { finish: 'Polished', finishWord: 'polished steel', narrow: 'Bench sizes', narrowCount: 2 } },
  { slug: 'opening-plaques', cards: 6, planner: true, chips: { finish: 'Brass', finishWord: 'brass', narrow: 'On a wood board', narrowCount: 3 } },
  { slug: 'custom-plaques', cards: 6, chips: { finish: 'Stainless steel', finishWord: 'steel', narrow: 'Oval and round', narrowCount: 2 } },
  { slug: 'house-name-plaques', cards: 6, chips: { finish: 'Brass', finishWord: 'brass', narrow: 'On a wood board', narrowCount: 1 } },
  { slug: 'donor-recognition-plaques', cards: 6, chips: { finish: 'Brass', finishWord: 'brass', narrow: 'On a wood board', narrowCount: 1 } },
  { slug: 'church-plaques', cards: 6, chips: { finish: 'Stainless steel', finishWord: 'steel', narrow: 'On a wood board', narrowCount: 1 } },
  { slug: 'professional-brass-plaques', cards: 6, chips: { finish: 'Polished', finishWord: 'polished brass', narrow: 'On a wood board', narrowCount: 2 } },
];
const selectedSlugs = process.env.CATEGORY_SLUGS?.split(',').filter(Boolean);
if (selectedSlugs) assert(selectedSlugs.every(slug => pages.some(page => page.slug === slug)), 'Unknown CATEGORY_SLUGS entry');
const selectedPages = selectedSlugs ? pages.filter(page => selectedSlugs.includes(page.slug)) : pages;
const MAX_PHONE_SCREENS = 7.6; // larger, separate film requested in owner msg 8603
const MAX_NOTICE_HEIGHT = 88; // two short lines + equal 44 px buttons (owner msg 9079)
// The planner's date maths, as the page uses it (services/occasionPlanner.ts, transpiled like check-promo-video-tracking).
const ts = require('typescript');
const planner = { exports: {} };
require('node:vm').runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../services/occasionPlanner.ts'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, planner);
const phone = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' };
const desktop = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };
const results = [];
// Release evidence can be small: keep all assertions, save only the eight phone first screens as JPEGs.
const smallScreenshots = process.env.SMALL_SCREENSHOTS === '1';
async function screenshot(page, name, fullPage = false) {
  if (smallScreenshots) {
    if (name.endsWith('.phone.screen1-cookie.png')) await page.screenshot({ path: path.join(OUT, name.replace(/\.png$/, '.jpg')), type: 'jpeg', quality: 70, scale: 'css' });
  } else await page.screenshot({ path: path.join(OUT, name), fullPage });
}


async function newPage(browser, device, options = {}) {
  const context = await browser.newContext({ ...device, locale: 'en-GB', timezoneId: 'Europe/London', ...options });
  await context.addInitScript(() => {
    localStorage.setItem('instaplaque-internal-v1', 'yes');
    // The largest paint and layout shifts, as the browser reports them.
    window.__lcp = [];
    window.__cls = 0;
    try { new PerformanceObserver(list => { window.__lcp.push(...list.getEntries()); }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch (error) { /* not supported */ }
    try { new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__cls += entry.value; }).observe({ type: 'layout-shift', buffered: true }); } catch (error) { /* not supported */ }
  });
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
  const films = [];
  page.on('request', request => { if (request.url().includes('/videos/')) films.push(new URL(request.url()).pathname); });
  return { context, page, errors, blocked, films };
}

const geometry = page => page.evaluate(() => {
  const main = document.querySelector('main');
  const top = main.getBoundingClientRect().top;
  const card = document.querySelector('.cat-tpl-card');
  const cards = [...document.querySelectorAll('.cat-tpl-card')];
  const firstRow = cards.filter(item => Math.abs(item.getBoundingClientRect().top - card.getBoundingClientRect().top) < 4);
  const bar = document.querySelector('.shop-mobile-contact.is-visible');
  const banner = [...document.querySelectorAll('.cookie-banner')].find(el => el.getBoundingClientRect().height > 0);
  const rect = el => el && (({ top, bottom, left, right }) => ({ top: Math.round(top), bottom: Math.round(bottom), left: Math.round(left), right: Math.round(right) }))(el.getBoundingClientRect());
  return { mainTop: Math.round(top), pageHeight: main.scrollHeight, viewport: [innerWidth, innerHeight], screens: main.scrollHeight / (innerHeight - top),
    overflow: Math.max(main.scrollWidth - main.clientWidth, document.documentElement.scrollWidth - innerWidth), card: rect(card), banner: rect(banner),
    h1: rect(document.querySelector('h1')), firstRow: firstRow.map(rect), bar: bar && bar.getBoundingClientRect().height ? rect(bar) : null };
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

async function checkCards(page, context, slug, stake) {
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
      // Tree page: the designer on that plate, on the board and stake; the plate's own page names the finish.
      const opened = new URL(after.href, BASE);
      const productHref = stake ? `/${opened.searchParams.get('plaque')}` : after.href;
      if (stake) {
        assert(opened.pathname === '/design' && opened.searchParams.get('backing') === 'stake', `${slug} card ${index + 1}: ${after.href} opens the designer on the board and stake`);
        assert.equal((await context.request.get(`${BASE}${after.href}`)).status(), 200, `${slug} card ${index + 1}: ${after.href} opens`);
      }
      const response = await context.request.get(`${BASE}${productHref}`);
      assert.equal(response.status(), 200, `${slug} card ${index + 1}: ${productHref} opens`);
      const html = await response.text();
      const heading = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1]?.replace(/<[^>]+>/g, '') || '';
      const finishWord = label.split(',')[0].replace(/^On /, '').toLowerCase().replace(' steel', '');
      assert(html.includes(`<link rel="canonical" href="https://instaplaque.co.uk${productHref}"`), `${slug} card ${index + 1}: ${productHref} is that product's page`);
      if (!pickWood) assert(heading.toLowerCase().includes(finishWord), `${slug} card ${index + 1}: ${productHref} heading "${heading}" names ${finishWord}`);
      else assert(heading.toLowerCase().includes(finishWord.includes('light wood') ? 'light wood' : 'dark wood'), `${slug} card ${index + 1}: ${productHref} heading "${heading}" names the wood`);
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

/** The film in its own section after the proof: nothing loaded before the tap; its box and the block's stay the same when the poster
 * loads and while it plays; one download, after the tap; it plays and pauses. */
async function checkFilm(page, films, where) {
  const boxes = () => page.evaluate(() => {
    const size = el => { const box = el.getBoundingClientRect(); return [Math.round(box.width), Math.round(box.height)]; };
    return { block: size(document.querySelector('.cat-tpl-film-section')), film: size(document.querySelector('.cat-tpl-film .promo-film')), cls: window.__cls };
  });
  await page.locator('.cat-tpl-film').scrollIntoViewIfNeeded();
  const first = await boxes();
  const viewport = page.viewportSize();
  assert(first.film[1] <= viewport.height * 0.75 + 1, `${where}: film capped at 75% viewport height`);
  assert(first.film[0] >= (viewport.width < 721 ? viewport.width - 40 : 450), `${where}: large film at content width`);
  await page.waitForFunction(() => { const img = document.querySelector('.cat-tpl-film .promo-film-poster'); return img && img.complete && img.naturalWidth > 0; }, null, { timeout: 15000 });
  const poster = await boxes();
  assert(!films.some(file => file.endsWith('.mp4')), `${where}: film downloaded before a tap`);
  const toggle = page.locator('.cat-tpl-film .promo-film-toggle');
  await toggle.click();
  await page.waitForFunction(() => { const video = document.querySelector('.cat-tpl-film video'); return video && !video.paused && video.currentTime > 0.3; }, null, { timeout: 15000 });
  const playing = await boxes();
  for (const [label, now] of [['poster', poster], ['playing', playing]]) {
    assert.deepEqual(now.block, first.block, `${where}: proof block size, ${label}`);
    assert.deepEqual(now.film, first.film, `${where}: film size, ${label}`);
  }
  const shift = playing.cls - first.cls;
  assert(shift < 0.01, `${where}: layout shift ${shift.toFixed(4)} while the film loads and plays`);
  assert.equal(films.filter(file => file.endsWith('.mp4')).length, 1, `${where}: one film download, after the tap`);
  assert.equal(await toggle.getAttribute('aria-label'), 'Pause the video', `${where}: pause button while playing`);
  await toggle.click();
  await page.waitForFunction(() => document.querySelector('.cat-tpl-film video').paused, null, { timeout: 5000 });
  await page.locator('main').evaluate(main => { main.scrollTop = 0; });
  return { film: first.film, shift: Number(shift.toFixed(4)) };
}

/** Opening: for a date, each kind of plaque shows the approval day services/occasionPlanner.ts gives; a date too close
 * is refused for every kind; a date past the planner's calendar is not counted. */
async function checkPlanner(page, where) {
  const input = page.locator('.cat-tpl-planner-field input');
  await input.scrollIntoViewIfNeeded();
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date());
  const shift = (day, by) => { const date = new Date(`${day}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + by); return date.toISOString().slice(0, 10); };
  const checked = [];
  for (const [event, expect] of [[shift(today, 45), 'ok'], [shift(today, 2), 'late'], ['2028-03-01', 'unknown']]) {
    await input.fill(event);
    await page.waitForTimeout(150);
    const rows = await page.locator('.cat-tpl-planner-list li').evaluateAll(items => items.map(item => ({
      days: Number(item.dataset.days), by: item.dataset.approveBy || null, late: item.classList.contains('is-late'), text: item.querySelector('strong').textContent })));
    assert.deepEqual(rows.map(row => row.days).sort((a, b) => a - b), [5, 7, 10, 15], `${where}: planner rows for ${event}`);
    for (const row of rows) {
      const want = planner.exports.approveBy(event, row.days, today);
      assert.equal(row.by, want.day || null, `${where}: ${event}, ${row.days} days: approve by ${row.by}, expected ${want.day}`);
      if (expect === 'ok') assert(!row.late && /^Approve and pay by /.test(row.text), `${where}: ${event}, ${row.days} days: "${row.text}"`);
      if (expect === 'late') assert(row.late && /Too close to promise/.test(row.text), `${where}: ${event}, ${row.days} days: "${row.text}"`);
      if (expect === 'unknown') assert(/Too far ahead to count/.test(row.text), `${where}: ${event}, ${row.days} days: "${row.text}"`);
    }
    checked.push(`${event} ${expect}`);
  }
  await input.fill('');
  return checked;
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/google/chrome/chrome', args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
  try {
    for (const spec of selectedPages) {
      for (const [mode, device] of [['phone', phone], ['desktop', desktop]]) {
        const { context, page, errors, films } = await newPage(browser, device);
        await page.goto(`${BASE}/${spec.slug}`, { waitUntil: 'load', timeout: 60000 });
        await settle(page);
        const withNotice = await geometry(page);
        assert(withNotice.banner, `${spec.slug}/${mode}: cookie notice showing for a new visitor`);
        assert(withNotice.card.top <= 330, `${spec.slug}/${mode}: first card at ${withNotice.card.top}px with the notice`);
        assert(!overlaps(withNotice.card, withNotice.banner), `${spec.slug}/${mode}: notice covers the first card`);
        // The noticeable neutral notice: 88 px or less on the phone, clear of the H1, the first row of products and the contact bar.
        const noticeHeight = withNotice.banner.bottom - withNotice.banner.top;
        if (mode === 'phone') assert(noticeHeight <= MAX_NOTICE_HEIGHT, `${spec.slug}/phone: notice ${noticeHeight}px tall`);
        assert(!overlaps(withNotice.banner, withNotice.h1) && !withNotice.firstRow.some(card => overlaps(card, withNotice.banner)) && !overlaps(withNotice.banner, withNotice.bar),
          `${spec.slug}/${mode}: notice clear of the H1, first products and contact bar ${JSON.stringify({ banner: withNotice.banner, h1: withNotice.h1, bar: withNotice.bar })}`);
        // The largest paint is a product photo; the film has loaded nothing and waits for a tap.
        // (The app replaces the prerendered markup when it starts, so the entry's element may be gone: its image URL
        // tells which picture it was.)
        const lcp = await page.evaluate(() => { const entry = window.__lcp[window.__lcp.length - 1]; return entry ? { url: decodeURIComponent(entry.url || ''), size: entry.size,
          element: entry.element ? { tag: entry.element.tagName, card: !!entry.element.closest('.cat-tpl-card') } : null } : null; });
        assert(lcp && /\/site-images\/studio-photo\/[^?&]+\.webp/.test(lcp.url) && (!lcp.element || (lcp.element.tag === 'IMG' && lcp.element.card)),
          `${spec.slug}/${mode}: largest paint ${JSON.stringify(lcp)}`);
        lcp.src = lcp.url.replace(/^.*\/site-images\/studio-photo\//, '').replace(/[?&].*$/, '');
        const film = await page.evaluate(() => { const video = document.querySelector('.cat-tpl-film-section .cat-tpl-film video'); return video && { src: video.getAttribute('src'), preload: video.getAttribute('preload'), autoplay: video.autoplay, paused: video.paused }; });
        assert(film && !film.src && film.preload === 'none' && !film.autoplay && film.paused, `${spec.slug}/${mode}: film waits for a tap ${JSON.stringify(film)}`);
        assert(!films.some(file => file.endsWith('.mp4')), `${spec.slug}/${mode}: film downloaded on load`);
        await screenshot(page, `${spec.slug}.${mode}.screen1-cookie.png`);
        await page.locator('.cookie-banner').getByRole('button', { name: 'Accept' }).click();
        await page.waitForTimeout(400);
        const accepted = await geometry(page);
        assert(!accepted.banner, `${spec.slug}/${mode}: notice gone after Accept`);
        assert(accepted.card.top <= 330, `${spec.slug}/${mode}: first card at ${accepted.card.top}px after Accept`);
        const filmCheck = await checkFilm(page, films, `${spec.slug}/${mode}`);
        await sweep(page);
        const after = await geometry(page);
        assert.equal(after.overflow, 0, `${spec.slug}/${mode}: sideways overflow ${after.overflow}px`);
        if (mode === 'phone') assert(after.screens <= MAX_PHONE_SCREENS, `${spec.slug}: ${after.screens.toFixed(2)} phone screens`);
        await screenshot(page, `${spec.slug}.${mode}.screen1.png`);
        if (mode === 'phone') {
          await page.locator('main').evaluate((main, y) => { main.scrollTop = y; }, after.viewport[1] - after.mainTop);
          await page.waitForTimeout(400);
          await screenshot(page, `${spec.slug}.phone.screen2.png`);
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
        if (mode === 'phone') cardsChecked = await checkCards(page, context, spec.slug, spec.stake);
        const plannerChecked = spec.planner && mode === 'phone' ? await checkPlanner(page, `${spec.slug}/${mode}`) : undefined;
        await page.reload({ waitUntil: 'load' });
        await settle(page);
        await checkChips(page, spec.slug, spec.chips, spec.cards);
        // The card itself opens its plaque: a tap on its photo lands on the card's link.
        const first = page.locator('.cat-tpl-card').first();
        const href = await first.locator('.cat-tpl-card-link').getAttribute('href');
        const photo = await first.locator('.cat-tpl-photo').boundingBox();
        const [x, y] = [photo.x + photo.width / 2, photo.y + photo.height / 3];
        if (mode === 'phone') await page.touchscreen.tap(x, y); else await page.mouse.click(x, y);
        // (Tree: the designer, on that plate on the board and stake.)
        await page.waitForURL(url => url.pathname === new URL(href, BASE).pathname, { timeout: 20000 });
        await page.locator(spec.stake ? '.designer-step-footer' : 'h1').first().waitFor();
        await page.waitForTimeout(300);
        assert.deepEqual(errors, [], `${spec.slug}/${mode}: errors`);
        // Full page, as the 31 Oct captures: notice and contact bar hidden, the app's scroller expanded.
        await page.goto(`${BASE}/${spec.slug}`, { waitUntil: 'load' });
        await settle(page);
        await sweep(page);
        await page.addStyleTag({ content: '.cookie-banner,.shop-mobile-contact{display:none!important} html,body,#root,#root>*,main{height:auto!important;max-height:none!important;overflow:visible!important}' });
        await page.waitForTimeout(300);
        await screenshot(page, `${spec.slug}.${mode}.full.png`, true);
        results.push({ slug: spec.slug, mode, firstCardWithNotice: withNotice.card.top, noticeBottom: withNotice.banner.bottom, firstCardAfterAccept: accepted.card.top,
          noticeHeight, pageHeight: after.pageHeight, mainTop: after.mainTop, screens: Number(after.screens.toFixed(2)), overflow: after.overflow, cardsChecked,
          largestPaint: lcp.src, film: filmCheck, planner: plannerChecked });
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
      await screenshot(page, `${spec.slug}.phone.no-js.png`);
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
