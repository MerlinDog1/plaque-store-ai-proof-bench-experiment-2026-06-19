// Local-only category visual check. Matches the 31 Oct review: 390x844 phone, main scroll height /
// (viewport height - mainTop), consent notice present for the first screen. Never calls the live site.
// BASE=http://127.0.0.1:4381 OUT=/path/to/shots node scripts/check-category-pages-browser.cjs
const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const BASE = process.env.BASE || 'http://127.0.0.1:4381';
assert(['127.0.0.1', 'localhost'].includes(new URL(BASE).hostname), 'Use a local build, not the live site');
const OUT = process.env.OUT || 'output/category-pages-v2';
fs.mkdirSync(OUT, { recursive: true });
const slugs = ['memorial-plaques', 'bench-plaques', 'garden-plaques', 'tree-memorial-plaques', 'opening-plaques', 'brass-plaques', 'stainless-steel-plaques', 'portrait-plaques', 'custom-plaques'];
const phone = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' };
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/google/chrome/chrome', args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
  const results = [];
  try {
    for (const mode of ['phone', 'desktop']) for (const slug of slugs) {
      const context = await browser.newContext({ ...(mode === 'phone' ? phone : { viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 }), locale: 'en-GB', timezoneId: 'Europe/London' });
      await context.addInitScript(() => localStorage.setItem('instaplaque-internal-v1', 'yes'));
      await context.route('**/*', route => new URL(route.request().url()).origin === new URL(BASE).origin ? route.continue() : route.abort());
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(`${BASE}/${slug}`, { waitUntil: 'networkidle', timeout: 60000 });
      await page.locator('h1').waitFor();
      await page.waitForTimeout(700);
      const height = await page.locator('main').evaluate(m => m.scrollHeight);
      for (let y = 0; y < height; y += 550) {
        await page.locator('main').evaluate((m, y) => { m.scrollTop = y; }, y);
        await page.waitForTimeout(100);
      }
      // Horizontal rows lazy-load too: bring each into view and sweep it before checking every image.
      for (const row of await page.locator('.shop-custom-work, .cat-scroll-row, .cat-picks ul, .shop-portrait-grid').all()) {
        if (!await row.isVisible() || await row.evaluate(el => !!el.closest('details:not([open])'))) continue;
        await row.scrollIntoViewIfNeeded();
        const width = await row.evaluate(el => el.scrollWidth);
        for (let x = 0; x < width; x += 300) {
          await row.evaluate((el, x) => { el.scrollLeft = x; }, x);
          await page.waitForTimeout(80);
        }
        await row.evaluate(el => { el.scrollLeft = 0; });
      }
      await page.waitForTimeout(400);
      await page.locator('main').evaluate(m => { m.scrollTop = 0; });
      const data = await page.evaluate(() => {
        const main = document.querySelector('main');
        const top = Math.round(main.getBoundingClientRect().top);
        const box = document.querySelector('.shopfront');
        const visible = el => !el.closest('details:not([open])') && el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0;
        const hero = document.querySelector('.cat-hero, .shop-feature-hero');
        return {
          title: document.title, metaDescription: document.querySelector('meta[name="description"]').content,
          canonical: document.querySelector('link[rel="canonical"]').href,
          h1: document.querySelector('h1').innerText,
          pageHeight: main.scrollHeight, mainTop: top, viewport: [innerWidth, innerHeight],
          screens: main.scrollHeight / (innerHeight - top), overflow: main.scrollWidth - main.clientWidth,
          heroImages: [...hero.querySelectorAll('img')].filter(visible).map(i => ({ src: i.getAttribute('src'), top: i.getBoundingClientRect().top, bottom: i.getBoundingClientRect().bottom })),
          heroVideos: hero.querySelectorAll('video').length,
          brokenImages: [...box.querySelectorAll('img')].filter(i => visible(i) && (!i.complete || !i.naturalWidth)).map(i => i.src),
          studioCards: [...box.querySelectorAll('.cat-product-card img')].map(i => i.getAttribute('src')),
          bandCount: box.querySelectorAll('.shop-custom-anything-showcase').length,
          bandCards: box.querySelectorAll('.shop-custom-work li').length,
          proofStacks: box.querySelectorAll('.cat-proof .shop-proof-pdf-stack').length,
          proof: box.querySelector('.cat-proof .shop-proof-pdf-stack')?.getAttribute('href'),
          rows: [...box.children].filter(visible).map(el => ({ cls: el.className, top: Math.round(el.getBoundingClientRect().top - top), height: Math.round(el.getBoundingClientRect().height), heading: el.querySelector('h1,h2')?.innerText || '' })),
          schema: [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => JSON.parse(s.textContent)),
        };
      });
      assert.equal(data.overflow, 0, `${slug}/${mode}: sideways page overflow`);
      assert.deepEqual(data.brokenImages, [], `${slug}/${mode}: broken images`);
      assert.deepEqual(errors, [], `${slug}/${mode}: browser errors`);
      assert.equal(data.heroVideos, 0, `${slug}/${mode}: film still in hero`);
      assert.equal(data.bandCount, 1, `${slug}/${mode}: made-to-order band count`);
      assert.equal(data.bandCards, 10, `${slug}/${mode}: made-to-order cards`);
      assert(data.studioCards.every(src => src.includes('/studio-photo/')), `${slug}/${mode}: non-studio product tile`);
      if (slug !== 'portrait-plaques') {
        assert.equal(data.proofStacks, 1, `${slug}/${mode}: own proof once`);
        assert(data.proof?.startsWith('/samples/products/'), `${slug}: generic proof`);
        assert.equal((await context.request.get(`${BASE}${data.proof}`)).status(), 200, `${slug}: sample PDF`);
        assert(data.heroImages.some(i => i.top < 689 && i.bottom > 0), `${slug}/${mode}: plaque photo not on first screen`);
      }
      await page.screenshot({ path: path.join(OUT, `${slug}.${mode}.screen00.png`) });
      await page.addStyleTag({ content: '.cookie-banner{display:none!important}' });
      await page.screenshot({ path: path.join(OUT, `${slug}.${mode}.clean.png`) });
      if (mode === 'phone') {
        for (const selector of ['.shop-custom-work', '.cat-picks ul', '.shop-portrait-grid']) {
          const row = page.locator(selector);
          if (!await row.count()) continue;
          assert(await row.evaluate(el => { el.scrollLeft = el.clientWidth; return el.scrollLeft > 0; }), `${slug}: ${selector} does not swipe`);
          await row.evaluate(el => { el.scrollLeft = 0; });
        }
      }
      for (const fold of await page.locator('.cat-guidance-fold').all()) {
        await fold.locator('summary').first().click();
        assert(await fold.evaluate(el => el.open), `${slug}: guidance does not open`);
        await fold.locator('img').evaluateAll(async images => {
          await Promise.all(images.map(async image => { image.loading = 'eager'; await image.decode(); }));
        });
        await fold.locator('summary').first().click();
      }
      await page.locator('main').evaluate(m => { m.scrollTop = 0; });
      await page.addStyleTag({ content: '.cookie-banner,.shop-mobile-contact{display:none!important} html,body,#root,#root>*,main{height:auto!important;max-height:none!important;overflow:visible!important}' });
      await page.screenshot({ path: path.join(OUT, `${slug}.${mode}.full.png`), fullPage: true });
      fs.writeFileSync(path.join(OUT, `${slug}.${mode}.json`), JSON.stringify(data, null, 2));
      results.push({ slug, mode, pageHeight: data.pageHeight, screens: Number(data.screens.toFixed(2)), pass: true });
      console.log('PASS', slug, mode, data.pageHeight, 'px', data.screens.toFixed(2), 'screens');
      await context.close();
    }
    fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error('FAIL', error); process.exit(1); });
