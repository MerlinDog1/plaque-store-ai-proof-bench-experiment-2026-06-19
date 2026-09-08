import assert from 'node:assert/strict';
import { readFile, access, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';
import { JSDOM } from 'jsdom';

const base = process.env.APP_URL || 'http://127.0.0.1:4179';
const output = 'tmp/pdfs/deployment-review';
await mkdir(output, { recursive: true });
const sitemap = await readFile('dist/sitemap.xml', 'utf8');
const routes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]).pathname);
const resources = new Set();
for (const route of routes) {
  const html = await readFile(path.join('dist', route, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { url: `https://instaplaque.co.uk${route}` });
  const doc = dom.window.document;
  assert.equal(doc.querySelectorAll('h1').length, 1, `${route}: one visible page heading`);
  assert.equal(doc.querySelector('link[rel="canonical"]')?.href, `https://instaplaque.co.uk${route}`);
  assert(!/noindex/i.test(doc.querySelector('meta[name="robots"]')?.content || ''), `${route}: indexable`);
  for (const node of doc.querySelectorAll('img[src],script[src],link[rel="stylesheet"],a[href]')) {
    const target = node.getAttribute('src') || node.getAttribute('href');
    if (!target?.startsWith('/') || target.startsWith('//')) continue;
    resources.add(new URL(target, base).pathname);
    if (node.tagName === 'IMG') assert(node.getAttribute('alt'), `${route}: image alt text`);
  }
  for (const node of doc.querySelectorAll('script[type="application/ld+json"]')) JSON.parse(node.textContent);
  dom.window.close();
}
for (const resource of resources) {
  const file = path.join('dist', resource);
  await access(path.extname(resource) ? file : path.join(file, 'index.html'));
}
console.log(`${routes.length} rendered pages: headings, canonical URLs, structured data, and ${resources.size} internal links/assets passed.`);

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
  let checkoutPayload;
  let savedProof;
  // Local fixtures exercise the UI without creating orders or external saved proofs.
  await context.route('**/api/stripe/checkout-session', async route => {
    checkoutPayload = route.request().postDataJSON();
    await route.fulfill({ status: 400, json: { error: 'Deployment check: checkout submission intercepted.' } });
  });
  await context.route('**/api/proof-sessions', async route => {
    savedProof = route.request().postDataJSON();
    await route.fulfill({ status: 503, json: { error: 'Exercise the self-contained return link.' } });
  });
  await context.route('**/api/gemini/generate-content', async route => {
    const request = route.request().postDataJSON();
    const inscription = request.contents.match(/---BEGIN INSCRIPTION---\n([\s\S]*?)\n---END INSCRIPTION---/)?.[1];
    const box = request.contents.match(/Available text box: ([\d.]+) × ([\d.]+)/);
    assert(inscription && box, 'The original wording and available dimensions must reach the model.');
    const [w, h] = box.slice(1).map(Number);
    const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    const lines = inscription.split('\n');
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${-w / 2} ${-h / 2} ${w} ${h}">${lines.map((line, index) => `<text x="0" y="${[-8, -1, 6, 12][index]}" text-anchor="middle" font-family="EB Garamond" font-size="${index === 1 ? 7 : 5}" fill="currentColor">${escape(line)}</text>`).join('')}</svg>`;
    await route.fulfill({ json: { text: JSON.stringify({ reasoning: 'Deployment test fixture.', svgContent }) } });
  });
  const page = await context.newPage();
  page.on('dialog', dialog => dialog.accept());
  await page.goto(`${base}/bench-plaques`);
  await page.getByRole('link', { name: 'Design bench plaque', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Words that matter' })).toBeVisible();
  await expect(page.locator('.designer-price strong')).toHaveText('£58.50');
  const wording = 'In loving memory of\nÉlodie O’Neill\n1948–2026\nAlways in our hearts';
  await page.locator('#inscription-wording-input').fill(wording);
  await page.getByRole('button', { name: 'Generate layout', exact: true }).click();
  await expect(page.locator('#ai-text-layer text')).toHaveCount(4);
  await page.getByRole('button', { name: 'Tweak manually', exact: true }).click();
  await page.getByRole('button', { name: 'Toggle bold for Élodie O’Neill', exact: true }).click();
  await expect(page.locator('#ai-text-layer text').nth(1)).toHaveAttribute('font-weight', '700');

  await page.getByRole('button', { name: 'Checkout', exact: true }).click();
  assert.equal(new URL(page.url()).pathname, '/design', 'Header checkout must lead to proof approval.');
  await expect(page.getByRole('heading', { name: 'Your final review' })).toBeVisible();
  const checkout = page.getByRole('button', { name: 'Continue to secure checkout', exact: true });
  await expect(checkout).toBeDisabled();
  await page.getByRole('checkbox', { name: /I have checked the wording/ }).check();
  await expect(checkout).toBeEnabled();
  await checkout.click();
  await expect(page.getByText('Deployment check: checkout submission intercepted.', { exact: true })).toBeVisible();
  assert.equal(checkoutPayload.totalPence, 5850);
  assert.equal(checkoutPayload.orderSnapshot.inscription, wording);

  async function downloadProof(name) {
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download proof PDF', exact: true }).click();
    const download = await downloadPromise;
    const file = path.join(output, `${name}.pdf`);
    await download.saveAs(file);
    const bytes = await readFile(file);
    assert(bytes.toString('ascii', 0, 5) === '%PDF-', 'A real PDF must be downloaded.');
    assert(bytes.includes(Buffer.from('/Subtype /Image')), 'The original textured proof image must be embedded.');
    const url = bytes.toString('latin1').match(/\/URI\s*\((https?:\/\/[^)]+)\)/)?.[1];
    assert(url?.includes('/design#proof='), 'The PDF needs a working self-contained return link.');
    return url;
  }
  const validUrl = await downloadProof('original-desktop');
  assert.equal(savedProof.metadata.layoutIsCurrent, true);
  const resumed = await context.newPage();
  await resumed.goto(validUrl);
  await expect(resumed.locator('#inscription-wording-input')).toHaveValue(wording);
  await expect(resumed.locator('#ai-text-layer text').nth(1)).toHaveAttribute('font-weight', '700');
  await resumed.close();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Go to Text', exact: true }).click();
  await page.locator('#inscription-wording-input').fill(wording.replace('Always', 'Forever'));
  await page.getByRole('button', { name: 'Go to Proof', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Regenerate your inscription layout', exact: true })).toBeVisible();
  await expect(checkout).toBeDisabled();
  const staleUrl = await downloadProof('draft-mobile');
  assert.equal(savedProof.metadata.layoutIsCurrent, false);
  const reopenedDraft = await context.newPage();
  await reopenedDraft.setViewportSize({ width: 390, height: 844 });
  await reopenedDraft.goto(staleUrl);
  await expect(reopenedDraft.locator('#inscription-wording-input')).toHaveValue(wording.replace('Always', 'Forever'));
  await reopenedDraft.getByRole('button', { name: 'Go to Proof', exact: true }).click();
  await expect(reopenedDraft.getByRole('button', { name: 'Regenerate your inscription layout', exact: true })).toBeVisible();
  await expect(reopenedDraft.getByRole('button', { name: 'Continue to secure checkout', exact: true })).toBeDisabled();
  assert(await reopenedDraft.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Mobile designer must not overflow.');
  await reopenedDraft.screenshot({ path: `${output}/mobile-review.png` });
  assert.deepEqual(errors, [], 'No uncaught browser errors.');
  console.log('Product preset, manual bold, approval gate, checkout payload, original PDF download, saved-proof restoration, stale-proof blocking and mobile containment passed. No live orders were created.');
} finally {
  await browser.close();
}
