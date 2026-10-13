// Exercise the real built React banner. Every request is fulfilled locally;
// Google/Meta code is stubbed, so no analytics or conversion is delivered.
import assert from 'node:assert/strict';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';

const root = path.resolve('dist');
const origin = 'https://instaplaque.co.uk';
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE || '/usr/bin/google-chrome',
  headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-background-networking'],
});
try {
  for (const saved of [null, 'no', 'yes']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    const google = [], meta = [], errors = [], missingAssets = [];
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.hostname === 'www.googletagmanager.com') {
        google.push(url.href);
        return route.fulfill({ contentType: 'application/javascript', body: '/* locally intercepted Google loader */' });
      }
      if (url.hostname === 'connect.facebook.net') {
        meta.push(url.href);
        return route.fulfill({ contentType: 'application/javascript', body: '/* locally intercepted Meta loader */' });
      }
      if (url.origin !== origin) return route.fulfill({ status: 204, body: '' });
      // Vercel serves this at runtime; it is not a built local asset. Acceptance
      // activates the unchanged Vercel analytics integration as well as Google.
      if (url.pathname === '/_vercel/insights/script.js') {
        return route.fulfill({ contentType: 'application/javascript', body: '/* locally intercepted Vercel analytics */' });
      }
      if (url.pathname.startsWith('/_vercel/insights/')) return route.fulfill({ status: 204, body: '' });
      if (url.pathname.startsWith('/api/') || route.request().method() !== 'GET') {
        return route.fulfill({ contentType: 'application/json', body: '{}' });
      }
      let file = path.resolve(root, `.${url.pathname}`);
      if (file !== root && !file.startsWith(root + path.sep)) return route.abort();
      try {
        if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
        return await route.fulfill({ path: file });
      } catch {
        if (route.request().isNavigationRequest()) return route.fulfill({ path: path.join(root, 'index.html') });
        missingAssets.push(url.pathname);
        return route.fulfill({ status: 404, body: 'Missing fixture asset' });
      }
    });
    await context.addInitScript(value => {
      if (value !== null) {
        localStorage.setItem('instaplaque-analytics-consent-v1', value);
        localStorage.setItem('instaplaque-meta-consent', value);
      }
    }, saved);
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.stack || error.message));
    const consentState = () => page.evaluate(() => {
      const update = Array.from(window.dataLayer || []).filter(args => args[0] === 'consent' && args[1] === 'update').at(-1);
      return update ? Object.values(update[2]) : [];
    });
    const expectState = state => expect.poll(consentState).toEqual([state, state, state, state]);
    await page.goto(origin + '/cookies');
    await expect.poll(() => google.length).toBe(1);
    await expectState(saved === 'yes' ? 'granted' : 'denied');
    const banner = page.getByRole('dialog', { name: 'Cookie preferences' });
    if (saved === null) {
      await expect(banner).toBeVisible();
      assert.equal(meta.length, 0, 'Ignoring the banner must not load Meta');
      await banner.getByRole('button', { name: 'Reject', exact: true }).click();
      await expectState('denied');
      assert.equal(meta.length, 0, 'Reject must not load Meta');
    } else if (saved === 'no') {
      await expect(page.getByRole('button', { name: 'Cookie settings', exact: true })).toBeVisible();
      assert.equal(meta.length, 0, 'Saved rejection must not load Meta');
    }
    await page.getByRole('button', { name: 'Cookie settings', exact: true }).click();
    await banner.getByRole('button', { name: 'Accept', exact: true }).click();
    await expectState('granted');
    await expect.poll(() => meta.length).toBe(1);
    await page.getByRole('button', { name: 'Cookie settings', exact: true }).click();
    await banner.getByRole('button', { name: 'Reject', exact: true }).click();
    await expectState('denied');
    assert.equal(google.length, 1, 'Banner changes must not reload Google');
    assert.equal(await page.evaluate(() => Object.hasOwn(window, 'ga-disable-G-FKP17EXNBX')), false);
    assert.deepEqual(errors, [], 'No React/banner JavaScript errors');
    assert.deepEqual(missingAssets, [], 'Every non-navigation local asset is present or explicitly stubbed');
    console.log(`PASS built React banner: saved=${saved}, Google loads with correct consent, Accept/Reject update it, Meta remains opt-in`);
    await context.close();
  }
} finally { await browser.close(); }
