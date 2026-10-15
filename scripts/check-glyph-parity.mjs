// Checks that the outlined text used for the emailed proof and the production
// PDF matches the live text the customer sees in the designer, for every
// inscription font and weight. Run with: npm run check:glyph-parity
// Needs network access for Google Fonts, jsDelivr font files and opentype.js.
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';

const OUT_DIR = path.resolve('output/glyph-parity');
// A mismatch is an ink pixel with no matching ink within one pixel in the other
// image, so edge anti-aliasing differences between text and paths do not count.
// Screen hinting still nudges thin strokes, which leaves isolated specks; a real
// glyph difference (a misplaced letter, a lump, a wrong face) is a dense cluster.
// So the limit applies to the worst WINDOW x WINDOW pixel square.
const WINDOW = 32;
const MAX_MISMATCH_PIXELS = Number(process.env.GLYPH_PARITY_MAX_MISMATCH || 20);

const source = await readFile(path.resolve('services/inscriptionFontCatalog.ts'), 'utf8');
const variantsBlock = source.match(/const inscriptionFontVariants[^=]*=\s*\{([\s\S]*?)\n\};/);
assert.ok(variantsBlock, 'inscriptionFontVariants was not found in services/inscriptionFontCatalog.ts');
const cases = [];
for (const match of variantsBlock[1].matchAll(/"([^"]+)":\s*\{\s*normal:\s*\[([^\]]*)\](?:,\s*italic:\s*\[([^\]]*)\])?/g)) {
  const [, family, normal, italic] = match;
  for (const weight of normal.split(',').map(Number)) cases.push({ family, weight, style: 'normal' });
  for (const weight of (italic || '').split(',').filter(Boolean).map(Number)) cases.push({ family, weight, style: 'italic' });
}
assert.ok(cases.length > 20, `Expected the full inscription font list, found ${cases.length} cases`);
// Letter-spacing switches ligatures off in browsers; the outline must follow.
cases.push({ family: 'EB Garamond', weight: 400, style: 'normal', letterSpacing: '0.08em' });
// Weights and styles a font lacks must resolve to the face the browser draws,
// without synthetic bold or italic on screen.
cases.push(
  { family: 'Roboto Slab', weight: 400, style: 'normal' },
  { family: 'EB Garamond', weight: 500, style: 'normal' },
  { family: 'Pacifico', weight: 700, style: 'normal' },
  { family: 'Lora', weight: 600, style: 'italic' },
  { family: 'Cinzel', weight: 400, style: 'italic' },
);

const only = process.env.GLYPH_PARITY_ONLY;
const selected = only ? cases.filter((c) => c.family === only) : cases;

const inkMask = ({ width, height, data }) => {
  const mask = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    mask[i] = data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114 < 128 ? 1 : 0;
  }
  return mask;
};

const compare = (livePng, outlinedPng) => {
  assert.equal(livePng.width, outlinedPng.width);
  assert.equal(livePng.height, outlinedPng.height);
  const { width, height } = livePng;
  const a = inkMask(livePng);
  const b = inkMask(outlinedPng);
  const diff = new PNG({ width, height });
  const wrong = new Uint8Array(width * height);
  const hasNear = (mask, x, y, value) => {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < width && ny < height && mask[ny * width + nx] === value) return true;
      }
    }
    return false;
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const missing = a[i] === 1 && !hasNear(b, x, y, 1);
      const extra = b[i] === 1 && !hasNear(a, x, y, 1);
      const shade = a[i] || b[i] ? 200 : 255;
      diff.data.set(missing ? [0, 90, 255, 255] : extra ? [230, 0, 0, 255] : [shade, shade, shade, 255], i * 4);
      if (missing || extra) wrong[i] = 1;
    }
  }
  // Summed-area table, then the densest WINDOW x WINDOW square.
  const sums = new Uint32Array((width + 1) * (height + 1));
  for (let y = 0; y < height; y++) {
    let row = 0;
    for (let x = 0; x < width; x++) {
      row += wrong[y * width + x];
      sums[(y + 1) * (width + 1) + x + 1] = sums[y * (width + 1) + x + 1] + row;
    }
  }
  let mismatches = 0;
  for (let y = WINDOW; y <= height; y++) {
    for (let x = WINDOW; x <= width; x++) {
      const count = sums[y * (width + 1) + x] - sums[(y - WINDOW) * (width + 1) + x]
        - sums[y * (width + 1) + x - WINDOW] + sums[(y - WINDOW) * (width + 1) + x - WINDOW];
      if (count > mismatches) mismatches = count;
    }
  }
  return { mismatches, diff };
};

await mkdir(OUT_DIR, { recursive: true });
const server = await createServer({
  configFile: path.resolve('vite.config.ts'),
  logLevel: 'error',
  server: { host: '127.0.0.1', port: 0, strictPort: false },
});
await server.listen();
const baseUrl = server.resolvedUrls?.local?.[0];
assert.ok(baseUrl, 'Vite did not report a local URL');

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--renderer-process-limit=1', '--js-flags=--max-old-space-size=448'],
});
const results = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  page.on('pageerror', (error) => console.error('page error:', error.message));
  await page.goto(new URL('scripts/fixtures/glyph-parity.html', baseUrl).href);
  await page.waitForFunction(() => typeof window.renderParityCase === 'function');
  for (const parityCase of selected) {
    await page.evaluate((c) => window.renderParityCase(c), parityCase);
    const live = PNG.sync.read(await page.locator('#parity-live').screenshot());
    const outlined = PNG.sync.read(await page.locator('#parity-outlined').screenshot());
    const { mismatches, diff } = compare(live, outlined);
    const label = `${parityCase.family} ${parityCase.weight}${parityCase.style === 'italic' ? ' italic' : ''}${parityCase.letterSpacing ? ` spaced ${parityCase.letterSpacing}` : ''}`;
    results.push({ label, mismatches });
    console.log(`${mismatches > MAX_MISMATCH_PIXELS ? 'FAIL' : 'pass'} ${label}: worst ${WINDOW}px square has ${mismatches} mismatched pixels`);
    if (mismatches > MAX_MISMATCH_PIXELS) {
      await writeFile(path.join(OUT_DIR, `${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-diff.png`), PNG.sync.write(diff));
    }
  }
} finally {
  await browser.close();
  await server.close();
}

const failures = results.filter((r) => r.mismatches > MAX_MISMATCH_PIXELS);
assert.equal(failures.length, 0, `Outlined text differs from the live preview for: ${failures.map((f) => f.label).join(', ')}. Diff images are in ${OUT_DIR}.`);
console.log(`Glyph parity passed for ${results.length} font cases (limit ${MAX_MISMATCH_PIXELS} pixels in any ${WINDOW}px square).`);
