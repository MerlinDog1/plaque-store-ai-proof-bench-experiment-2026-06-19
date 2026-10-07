import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { GENERATION_TIMEOUT_MESSAGE, TEXT_PROXY_TIMEOUT_MS } from '../services/geminiTiming.mjs';

const base = process.env.APP_URL || 'http://127.0.0.1:4227';
const wording = 'TEST PLAQUE\n2026';
mkdirSync('output/generation-timeout', { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-dev-shm-usage', '--renderer-process-limit=1'] });
try {
  for (const width of [390, 1440]) {
    for (const mode of ['slow-success', 'server-deadline', 'platform-timeout', 'browser-deadline']) {
      const page = await browser.newPage({ viewport: { width, height: 950 }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.clock.install();
      let calls = 0;
      let pending;
      await page.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.origin !== base) return route.abort();
        if (!url.pathname.startsWith('/api/')) return route.continue();
        if (url.pathname === '/api/gemini/health') return route.fulfill({ json: { enabled: true, hasKey: true } });
        if (url.pathname !== '/api/gemini/generate-content') return route.fulfill({ status: 503, json: { error: 'Disabled in QA' } });
        calls++;
        if (mode === 'server-deadline') return route.fulfill({ status: 504, json: { error: GENERATION_TIMEOUT_MESSAGE, code: 'generation_timeout', retryable: false } });
        if (mode === 'platform-timeout') return route.fulfill({ status: 504, contentType: 'text/plain', body: 'FUNCTION_INVOCATION_TIMEOUT' });
        if (mode === 'browser-deadline') { pending = route; return; }
        if (calls === 1) return route.fulfill({ json: { text: JSON.stringify({ refinedText: wording }) } });
        pending = route;
      });
      try {
        await page.goto(base + '/design');
        await page.getByRole('button', { name: 'Reject', exact: true }).click();
        await page.getByRole('button', { name: /A4 landscape/ }).click();
        await page.getByRole('button', { name: 'Go to Text', exact: true }).click();
        await page.locator('#inscription-wording-input').fill(wording);
        await page.getByRole('button', { name: 'Generate layout', exact: true }).click();
        const card = page.getByTestId('layout-progress');
        if (mode === 'slow-success' || mode === 'browser-deadline') {
          await card.waitFor();
          await expectPending();
          await page.clock.fastForward(mode === 'browser-deadline' ? TEXT_PROXY_TIMEOUT_MS + 1000 : 35_000);
        }
        if (mode === 'slow-success') {
          assert.equal(calls, 2, 'One proofread + one layout, no duplicate while waiting');
          await page.getByText(/Still working\. Some layouts take longer/).waitFor();
          const prompt = pending.request().postDataJSON().contents;
          const root = prompt.match(/<svg xmlns="http:\/\/www.w3.org\/2000\/svg" width="[^"]+" height="[^"]+" viewBox="[^"]+">/)[0];
          await pending.fulfill({ json: { text: JSON.stringify({
            svgContent: root + '<text x="0" y="-10" text-anchor="middle" font-family="Lato" font-size="14" fill="currentColor">TEST PLAQUE</text><text x="0" y="20" text-anchor="middle" font-family="Lato" font-size="14" fill="currentColor">2026</text></svg>',
            reasoning: 'Synthetic slow layout check',
          }) } });
          await card.waitFor({ state: 'detached' });
          await page.getByRole('button', { name: 'Tweak manually', exact: true }).waitFor();
          assert.equal(calls, 2);
          assert.match(await page.locator('#ai-text-layer').textContent(), /TEST PLAQUE/);
        } else {
          await page.getByText(GENERATION_TIMEOUT_MESSAGE, { exact: true }).waitFor();
          await card.waitFor({ state: 'detached' });
          await page.clock.fastForward(60_000);
          assert.equal(calls, 1, 'No automatic repeat after a timeout');
          assert.equal(await page.locator('#inscription-wording-input').inputValue(), wording);
          assert.equal(await page.getByRole('button', { name: 'Generate layout', exact: true }).isEnabled(), true, 'Manual retry remains available');
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        assert.deepEqual(errors, []);
        if (mode === 'slow-success' || mode === 'server-deadline') await page.screenshot({ path: `output/generation-timeout/${width}-${mode}.png` });
        console.log(`${width}px ${mode}: passed; ${calls} model-proxy requests, no external calls or writes.`);
      } finally { await page.close(); }

      async function expectPending() {
        // Poll outside the frozen page clock; no model or background job involved.
        for (let n = 0; n < 100 && !pending; n++) await new Promise(resolve => setTimeout(resolve, 50));
        assert.ok(pending, 'Expected the mocked request to be pending');
      }
    }
  }
} finally { await browser.close(); }
