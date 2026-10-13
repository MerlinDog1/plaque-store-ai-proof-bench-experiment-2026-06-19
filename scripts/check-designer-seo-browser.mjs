// Use built files with all network requests intercepted: no live events, AI,
// customer records, proof saves, orders, payments or local server required.
import assert from 'node:assert/strict';
import { readFile, mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';
import { JSDOM } from 'jsdom';

const root = path.resolve('dist');
const origin = 'https://instaplaque.co.uk';
const output = 'output/designer-seo';
await mkdir(output, { recursive: true });
const initial = new JSDOM(await readFile(path.join(root, 'design/index.html'), 'utf8')).window.document;
const normalise = text => text.replace(/\s+/gu, ' ').trim();
const guideText = normalise(initial.querySelector('#plaque-design-guide').textContent);
const initialGraph = JSON.parse(initial.querySelector('#instaplaque-prerender-route-schema').textContent);
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE || '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-background-networking'],
});
const results = [];
const installRoutes = async context => {
  const writes = [];
  await context.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== origin) return route.fulfill({ status: 204, body: '' });
    const json = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
    if (request.method() !== 'GET') {
      writes.push(url.pathname);
      return json({ error: 'Writes disabled in browser check' }, 500);
    }
    if (url.pathname === '/api/gemini/health') return json({ ok: true, enabled: true, hasKey: true });
    if (url.pathname.startsWith('/api/')) return json({});
    let file = path.resolve(root, `.${url.pathname}`);
    if (file !== root && !file.startsWith(root + path.sep)) return route.abort();
    try {
      if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
      return await route.fulfill({ path: file });
    } catch {
      return route.fulfill({ status: 404, body: 'Missing fixture asset' });
    }
  });
  return writes;
};
try {
  for (const [label, width, height] of [['mobile', 390, 844], ['small-phone', 320, 740], ['tablet', 820, 1000], ['desktop', 1440, 1000], ['landscape', 844, 390]]) {
    const context = await browser.newContext({ viewport: { width, height }, serviceWorkers: 'block' });
    const writes = await installRoutes(context);
    await context.addInitScript(() => {
      localStorage.setItem('instaplaque-meta-consent', 'no');
      localStorage.setItem('instaplaque-analytics-consent-v1', 'no');
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const entryUrl = `${origin}/design?utm_source=qa#designer-check`;
    await page.goto(entryUrl);
    await expect(page.locator('#plaque-designer')).toBeVisible();
    await expect(page.locator('.proofbench-customiser-head h2')).toHaveText('Choose your size');
    await expect(page).toHaveTitle(initial.title);
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), `${origin}/design`);
    assert.deepEqual(await page.locator('#instaplaque-route-schema').evaluate(el => JSON.parse(el.textContent)), initialGraph);
    assert.equal(await page.locator('#instaplaque-prerender-route-schema').count(), 0, 'Hydration should replace rather than duplicate route schema');
    const hydratedText = await page.locator('#plaque-design-guide').textContent();
    assert.equal(normalise(hydratedText), guideText, 'Initial and interactive guide content must match');
    const board = await page.locator('#plaque-designer').boundingBox();
    assert.ok(board.y < 100 && board.height > height * .75, 'Keep the workbench first and full-height');
    const overflow = () => page.evaluate(() => [...document.querySelectorAll('html, body, .designer-header, main, #plaque-design-guide')]
      .filter(el => el.scrollWidth > el.clientWidth + 2).map(el => el.tagName + '.' + el.className));
    const fixedWorkbench = () => page.evaluate(() => {
      const main = document.querySelector('.designer-mode > main');
      return {
        pageScroll: window.scrollY,
        mainScroll: main.scrollTop,
        excessHeight: main.scrollHeight - main.clientHeight,
        overflow: getComputedStyle(main).overflowY,
      };
    });
    const fixedState = { pageScroll: 0, mainScroll: 0, excessHeight: 0, overflow: 'hidden' };
    assert.deepEqual(await fixedWorkbench(), fixedState, `${label}: no page-level scrolling`);
    const dialog = page.locator('#designer-guide-dialog');
    await expect(dialog).not.toBeVisible();
    await expect(page.locator('#plaque-design-guide')).not.toBeVisible();
    assert.deepEqual(await overflow(), [], `${label} horizontal overflow`);
    await page.screenshot({ path: `${output}/${label}-designer.png`, animations: 'disabled' });
    // The popup must preserve the active step, wording, URL and viewport.
    await page.getByRole('button', { name: 'Go to Text', exact: true }).click();
    await page.locator('#inscription-wording-input').fill('A PLACE TO REMEMBER');
    const guideLink = width <= 1000 ? '.designer-guide-mobile' : '.designer-header-label';
    await page.locator(guideLink).click();
    await expect(page.getByRole('dialog', { name: 'Guide & FAQs', exact: true })).toBeVisible();
    assert.equal(await dialog.evaluate(el => el.matches(':modal')), true, 'Use the browser modal top layer and background inertness');
    await expect(dialog.getByRole('button', { name: 'Close guide', exact: true })).toBeFocused();
    await expect(page.locator('#designer-guide-heading')).toBeInViewport();
    const dialogBox = await dialog.boundingBox();
    assert.ok(dialogBox.x >= 0 && dialogBox.y >= 0 && dialogBox.x + dialogBox.width <= width && dialogBox.y + dialogBox.height <= height, `${label}: popup fits viewport`);
    await expect(page.locator('.designer-guide-more')).not.toHaveAttribute('open');
    await page.screenshot({ path: `${output}/${label}-guide.png`, animations: 'disabled' });
    const question = page.locator('.designer-guide-faqs details').first();
    await question.locator('summary').click();
    await expect(question.locator('p')).toBeVisible();
    await page.locator('.designer-guide-more > summary').click();
    await expect(page.locator('.designer-guide-more')).toHaveAttribute('open');
    await page.locator('#plaque-design-guide img').last().scrollIntoViewIfNeeded();
    for (const img of await page.locator('#plaque-design-guide img').all()) {
      await img.scrollIntoViewIfNeeded();
      await expect(img).toHaveJSProperty('complete', true);
      assert.ok(await img.evaluate(el => el.naturalWidth > 0));
    }
    assert.deepEqual(await overflow(), [], `${label} guide overflow`);
    assert.deepEqual(await fixedWorkbench(), fixedState, `${label}: reading scrolls only inside the popup`);
    assert.ok(await page.locator('.designer-guide-dialog-content').evaluate(el => el.scrollTop > 0), 'Long guide scrolls inside the popup');
    await expect(dialog.getByRole('button', { name: 'Close guide', exact: true })).toBeInViewport();
    // Native dialog focus must stay inside, even at each keyboard boundary.
    await dialog.getByRole('button', { name: 'Close guide', exact: true }).focus();
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('.designer-guide-return')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', { name: 'Close guide', exact: true })).toBeFocused();
    await page.locator('.designer-guide-return').click();
    await expect(dialog).not.toBeVisible();
    await expect(page.locator(guideLink)).toBeFocused();
    await expect(page.locator('#inscription-wording-input')).toHaveValue('A PLACE TO REMEMBER');
    await expect(page.locator('.proofbench-customiser-head h2')).toBeInViewport();
    // Exercise Escape, backdrop and explicit-close paths without navigation.
    for (const close of ['escape', 'backdrop', 'button']) {
      await page.locator(guideLink).click();
      await expect(dialog).toBeVisible();
      if (close === 'escape') await page.keyboard.press('Escape');
      else if (close === 'backdrop') await page.mouse.click(2, 2);
      else await dialog.getByRole('button', { name: 'Close guide', exact: true }).click();
      await expect(dialog).not.toBeVisible();
      await expect(page.locator(guideLink)).toBeFocused();
      await expect(page.locator('#inscription-wording-input')).toHaveValue('A PLACE TO REMEMBER');
      assert.deepEqual(await fixedWorkbench(), fixedState);
    }
    await page.getByRole('button', { name: 'Go to Material', exact: true }).click();
    await expect(page.locator('.proofbench-customiser-head h2')).toHaveText('Find your finish');
    await expect(page.locator('#designer-guide-heading')).toHaveText(initial.querySelector('h1').textContent);
    // Modal navigation must not replace query parameters or saved-link fragments.
    assert.equal(page.url(), entryUrl, 'Guide navigation must not replace query parameters or saved-link fragments');
    assert.deepEqual(errors, []);
    assert.deepEqual(writes, []);
    results.push({ label, width, height, status: 'passed', errors, writes });
    await context.close();
  }
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  await installRoutes(context);
  const page = await context.newPage();
  await page.goto(`${origin}/design`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const lastQuestion = page.locator('.designer-guide-faqs details').last();
  await lastQuestion.locator('summary').click();
  await expect(lastQuestion.locator('p')).toBeInViewport();
  await page.screenshot({ path: `${output}/mobile-no-javascript.png`, animations: 'disabled' });
  results.push({ label: 'mobile without JavaScript', status: 'passed' });
  await context.close();
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2) + '\n');
  console.log('PASS designer browser: mobile/small-phone/tablet/desktop/landscape, fixed non-scrolling workbench, modal keyboard/focus/dismissal, raw/rendered parity, metadata, images, FAQ/tips disclosures, no-JS and retained inscription/URL; no external traffic or writes');
} finally {
  await browser.close();
}
