// The designer's custom-size step shows the production time from services/productionTime.mjs (owner msg 6947): any
// size up to 600 × 400 mm shows 5 working days with no "Custom turnaround" note; a larger one shows 15 and the note.
// Model calls are refused; nothing is written. APP_URL is a local `node server.mjs` serving the build in dist/.
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

const base = process.env.APP_URL || 'http://127.0.0.1:4206';
const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--renderer-process-limit=1'] });
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin !== base) return route.abort();
      if (url.pathname.startsWith('/api/')) return route.fulfill({ status: 503, json: { error: 'Disabled in QA' } });
      return route.continue();
    });
    await page.goto(base + '/design');
    await page.getByRole('button', { name: 'Reject', exact: true }).click();
    await page.getByRole('button', { name: 'Custom size', exact: true }).click();
    const inputs = page.locator('input[inputmode="numeric"]');
    const setSize = async (w, h) => {
      await inputs.nth(0).fill(String(w)); await inputs.nth(0).press('Enter');
      await inputs.nth(1).fill(String(h)); await inputs.nth(1).press('Enter');
    };
    const toast = page.locator('.turnaround-toast');

    await setSize(100, 50);
    await page.getByText('Production: 5 working days', { exact: true }).waitFor();
    await page.waitForTimeout(400);
    assert.equal(await toast.count(), 0, '100 × 50: no custom turnaround note');

    await setSize(600, 500);
    await page.getByText('Production: 15 working days', { exact: true }).waitFor();
    await toast.waitFor();
    assert.match(await toast.innerText(), /Estimated production: 15 working days/);

    await setSize(400, 600);
    await page.getByText('Production: 5 working days', { exact: true }).waitFor();
    assert.deepEqual(errors, []);
    console.log(`${width}px: custom 100 × 50 and 400 × 600 show 5 working days with no note; 600 × 500 shows 15 with the note.`);
    await page.close();
  }
} finally { await browser.close(); }
