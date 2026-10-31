// Read-only local browser proof. No enquiries, proof saves, model requests, analytics or payment calls.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { merchantOffers } from '../services/merchantCatalogue.mjs';

const base = process.env.APP_URL || 'http://127.0.0.1:4383';
assert(['127.0.0.1', 'localhost'].includes(new URL(base).hostname), 'This browser check only permits a local preview');
const out = process.env.SHOTS || '/home/coding-agent/workspace/output/instaplaque-seo-pages-20261031/screenshots';
const cases = [
  ['house-name-plaques', 'House name plaques', 'polished-brass-200x150-rect-plaque'],
  ['donor-recognition-plaques', 'Donor and recognition plaques', 'brushed-brass-300x200-rect-light-wood-plaque'],
  ['church-plaques', 'Church pew and dedication plaques', 'polished-brass-210x148-rect-dark-wood-plaque'],
  ['professional-brass-plaques', 'Brass plaques for professional practices', 'brushed-brass-300x200-rect-light-wood-plaque'],
];
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/google/chrome/chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const results = [];
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1000 }, reducedMotion: 'reduce' });
    await context.addInitScript(() => {
      for (const key of ['instaplaque-analytics-consent-v1', 'instaplaque-replay-consent-v1', 'instaplaque-meta-consent']) localStorage.setItem(key, 'no');
      localStorage.setItem('instaplaque-internal-v1', 'yes');
    });
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (route.request().method() !== 'GET' || url.pathname.startsWith('/api/')) return route.abort();
      if (url.origin === base || url.hostname === 'cdn.jsdelivr.net') return route.continue();
      return route.abort();
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const [slug, title, designerSlug] of cases) {
      const response = await page.goto(`${base}/${slug}`, { waitUntil: 'domcontentloaded' });
      assert.equal(response.status(), 200);
      await page.waitForFunction(() => {
        const link = document.querySelector('.cat-hero a.shop-button');
        return link && Object.keys(link).some(key => key.startsWith('__react'));
      }, null, { timeout: 30000 });
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(await page.locator('h1').innerText(), title);
      const meta = await page.evaluate(() => ({ title: document.title, description: document.querySelector('meta[name="description"]').content, canonical: document.querySelector('link[rel="canonical"]').href }));
      assert.equal(meta.canonical, `https://instaplaque.co.uk/${slug}`);
      // Fetch lazy images in their real viewport, then return to the top for the first-screen screenshot.
      await page.evaluate(async () => {
        for (const img of document.querySelectorAll('.cat-page img')) img.loading = 'eager';
        await Promise.all([...document.querySelectorAll('.cat-page img')].map(img => img.decode().catch(() => {})));
        await document.fonts.ready;
      });
      assert(await page.locator('.cat-page img').evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0)), `${slug}: loaded imagery`);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1 && document.querySelector('main').scrollWidth <= document.querySelector('main').clientWidth + 1), `${slug}: no horizontal overflow at ${width}`);
      const price = await page.locator('.cat-hero-buy strong').innerText();
      const href = await page.locator('.cat-hero a.shop-button').first().getAttribute('href');
      assert.equal(href, `/design?plaque=${designerSlug}`);
      const faq = page.locator('.cat-questions details').first();
      await faq.locator('summary').click();
      assert(await faq.getAttribute('open') !== null, `${slug}: FAQ opens`);
      assert(await faq.locator('p').isVisible());
      await faq.locator('summary').click();
      // This app scrolls <main>, not window. Reset the real scroller after testing the FAQ.
      await page.locator('main').evaluate(main => { main.scrollTop = 0; });
      await page.waitForFunction(() => document.querySelector('main').scrollTop === 0);
      const headingBox = await page.locator('h1').boundingBox();
      assert(headingBox.y >= 0 && headingBox.y < 400, `${slug}: first-screen capture contains its heading`);
      await page.screenshot({ path: path.join(out, `${slug}-${width}-top.png`) });
      // A browser fullPage screenshot cannot see inside this fixed-height app shell. Keep the tested width and
      // expand just the capture viewport to include the whole pane; restore the real phone/desktop height after it.
      const fullHeight = await page.locator('main').evaluate(main => main.scrollHeight + innerHeight - main.clientHeight);
      await page.setViewportSize({ width, height: fullHeight });
      await page.locator('main').evaluate(main => { main.scrollTop = 0; });
      assert(await page.locator('main').evaluate(main => main.scrollHeight <= main.clientHeight + 1), `${slug}: full capture includes the whole scroll pane`);
      await page.screenshot({ path: path.join(out, `${slug}-${width}-full.png`) });
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      // Price and dimensions after the actual primary CTA; this never submits wording or creates a proof.
      await page.locator('.cat-hero a.shop-button').first().click();
      await page.locator('.designer-price strong').waitFor({ timeout: 30000 });
      const offer = merchantOffers.find(item => item.slug === designerSlug);
      assert.equal(Number((await page.locator('.designer-price strong').innerText()).replace(/[^0-9.]/g, '')), offer.price, `${slug}: designer price matches the named pictured configuration`);
      const viewBox = (await page.locator('.proof-preview-scale>svg').getAttribute('viewBox')).split(' ').map(Number);
      const extra = offer.preset.wood ? 25 : 0;
      assert.equal(viewBox[2], offer.preset.width + extra);
      assert.equal(viewBox[3], offer.preset.height + extra);
      assert.equal(errors.length, 0, errors.join('\n'));
      results.push({ slug, width, ...meta, from: price, designPrice: offer.price, viewBox, screenshots: [`${slug}-${width}-top.png`, `${slug}-${width}-full.png`] });
      console.log(`PASS ${slug} at ${width}px: hydrated metadata, images, FAQ, no overflow, designer price and dimensions`);
    }
    // A new tab before hydration uses the same explicit product URL.
    const [slug,, designerSlug] = cases[0];
    await page.goto(`${base}/design?plaque=${designerSlug}`, { waitUntil: 'domcontentloaded' });
    await page.locator('.designer-price strong').waitFor({ timeout: 30000 });
    assert.equal(Number((await page.locator('.designer-price strong').innerText()).replace(/[^0-9.]/g, '')), merchantOffers.find(item => item.slug === designerSlug).price);
    await context.close();
  }
  await fs.writeFile(path.join(out, 'browser-results.json'), JSON.stringify(results, null, 2));
  console.log(`PASS ${results.length} phone/desktop cases; 16 screenshots saved to ${out}`);
} finally {
  await browser.close();
}
