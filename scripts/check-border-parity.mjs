// Compare the actual React proof's geometry against the real production SVG.
// npm run check:border-parity
// Optional evidence: BORDER_PARITY_BASELINE=86188c9 BORDER_PARITY_OUT=/path/to/output
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium } from '@playwright/test';

const out = path.resolve(process.env.BORDER_PARITY_OUT || 'output/border-parity');
await mkdir(out, { recursive: true });
const baselineRef = process.env.BORDER_PARITY_BASELINE;
const baselinePath = path.resolve('services/__border_parity_baseline__.ts');
const baselineSource = baselineRef
  ? execFileSync('git', ['show', `${baselineRef}:services/exportService.ts`], { encoding: 'utf8' }) : null;
const server = await createServer({
  logLevel: 'error',
  cacheDir: path.resolve('node_modules/.vite-border-parity'),
  server: { host: '127.0.0.1', port: 0 },
  plugins: baselineSource ? [{
    name: 'read-only-border-baseline', enforce: 'pre',
    resolveId(id) { if (id === '/services/__border_parity_baseline__.ts') return baselinePath; },
    load(id) { if (id === baselinePath) return baselineSource; },
  }] : [],
});
let browser;
const results = [];
const evidence = [];
try {
  await server.listen();
  const base = server.resolvedUrls.local[0];
  browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  // This test never sends requests beyond its own loopback Vite server.
  await page.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin
    ? route.continue() : route.abort());
  await page.goto(new URL('scripts/fixtures/border-parity.html', base).href);
  await page.waitForFunction(() => typeof window.renderBorderCase === 'function');
  const { styles, shapes } = await page.evaluate(() => ({ styles: window.borderParityStyles, shapes: window.borderParityShapes }));
  const sizes = [[50, 25], [150, 50], [120, 80], [99, 100], [100, 99], [100, 100], [210, 148], [148, 210], [297, 210], [600, 600]];
  const fixings = [
    { fixing: 'none', wood: false, cornerRadius: 0 },
    { fixing: 'vhb', wood: false, cornerRadius: 8 },
    { fixing: 'screws', fixingHoleCount: 2, wood: false, cornerRadius: 0 },
    { fixing: 'screws', fixingHoleCount: 4, wood: false, cornerRadius: 8 },
    { fixing: 'caps', capSize: 10, wood: false, cornerRadius: 8 },
    { fixing: 'caps', capSize: 10, wood: false, cornerRadius: 0 },
    { fixing: 'caps', capSize: 15, wood: false, cornerRadius: 0 },
    { fixing: 'caps', capSize: 10, wood: true, cornerRadius: 8 },
    { fixing: 'screws', fixingHoleCount: 4, wood: true, cornerRadius: 0 },
  ];
  const baselineUrl = baselineRef ? '/services/__border_parity_baseline__.ts' : undefined;
  for (const shape of shapes) for (const [w, h] of sizes) for (const style of styles)
    for (const fixing of fixings) {
      const { wood, cornerRadius } = fixing;
      const width = w, height = shape === 'circle' ? w : h;
      const state = { width, height, shape, borderStyle: style, ...fixing, wood, cornerRadius };
      const sampleSize = [[120, 80], [210, 148], [297, 210]].some(([sw, sh]) => width === sw && height === sh);
      const saveSample = baselineRef && shape === 'rect' && sampleSize && !wood && cornerRadius === 0 && fixing.fixing === 'caps' && fixing.capSize === 10 && style !== 'inset';
      const result = await page.evaluate(async ({ state, baselineUrl, saveSample }) => {
        const result = await window.renderBorderCase(state, baselineUrl);
        if (!saveSample) for (const key of ['previewSvg', 'customerPreviewSvg', 'productionSvg', 'beforeSvg']) delete result[key];
        return result;
      }, { state, baselineUrl, saveSample });
      const label = `${shape} ${width}x${height} ${style} ${JSON.stringify(fixing)} wood=${wood} corners=${cornerRadius}`;
      assert.deepEqual(result.exported, result.preview, `Border geometry differs: ${label}`);
      assert.ok(result.solidBlack, `Not solid etch black: ${label}`);
      assert.ok(result.sourceUnchanged, `Export mutated the customer proof: ${label}`);
      assert.equal(result.viewBox, result.previewViewBox, `ViewBox drift: ${label}`);
      assert.equal(result.width, `${width + (wood ? 25 : 0)}mm`, label);
      assert.equal(result.height, `${height + (wood ? 25 : 0)}mm`, label);
      if (baselineRef) assert.ok(result.unchangedOtherLayers, `Changed a non-border-width export attribute: ${label}`);
      // Independent documented widths catch accidental changes in the proof,
      // including the 99/100mm threshold and the no-fixings scallop fallback.
      const scale = Math.min(width, height) < 100 ? 0.5 : 1;
      const widths = style === 'double' ? [1, 0.75] : style === 'inset' ? [1.6, 0.55]
        : style === 'double-scalloped' && result.holeCount > 0 ? [0.75, 0.5] : [1];
      // Small plates halve each line, but no line goes below the 0.3 mm etchable minimum.
      const expectedWidths = widths.map(w => Math.max(0.3, w * scale));
      assert.deepEqual(result.preview.map(b => Number(b.attributes['stroke-width'])), expectedWidths, label);
      assert.ok(result.exported.every(b => Number(b.attributes['stroke-width']) >= 0.3), `Workshop line thinner than 0.3 mm: ${label}`);
      // The proof draws every line solid, exactly as it is etched.
      assert.deepEqual(result.previewOpacities.flat().filter(o => Number(o) !== 1), [], `Proof line drawn lighter than the etch: ${label}`);
      // Inner rectangle lines stay parallel to the outer line round the corners.
      const rects = result.preview.filter(b => b.tag === 'rect');
      for (const inner of rects.slice(1)) {
        const outer = rects[0].attributes;
        const expected = Math.max(0, Number(outer.rx) - (Number(inner.attributes.x) - Number(outer.x)));
        assert.ok(Math.abs(Number(inner.attributes.rx) - expected) < 1e-9, `Inner border corner not parallel (rx ${inner.attributes.rx}, expected ${expected}): ${label}`);
      }
      results.push({ label, widths: expectedWidths });
      if (results.length % 200 === 0) console.log(`PASS ${results.length} cases so far`);
      if (saveSample) {
        const name = `${width}x${height}-${style}`;
        for (const [suffix, svg] of [['preview', result.previewSvg], ['customer-preview', result.customerPreviewSvg], ['before', result.beforeSvg], ['after', result.productionSvg]]) {
          await writeFile(path.join(out, `${name}-${suffix}.svg`), svg);
        }
        evidence.push({ name, width, height, style, widths: expectedWidths });
      }
    }
  // Border off must remain border off on all supported shapes.
  for (const shape of shapes) {
    const result = await page.evaluate(({ state, baselineUrl }) => window.renderBorderCase(state, baselineUrl), {
      state: { shape, border: false }, baselineUrl,
    });
    assert.deepEqual(result.preview, []);
    assert.deepEqual(result.exported, []);
    assert.ok(result.sourceUnchanged);
    if (baselineRef) assert.ok(result.unchangedOtherLayers);
    results.push({ label: `${shape} border off`, widths: [] });
  }
  await writeFile(path.join(out, 'results.json'), JSON.stringify({ baselineRef, count: results.length, results }, null, 2));
  if (evidence.length) await writeFile(path.join(out, 'samples.json'), JSON.stringify(evidence, null, 2));
  console.log(`PASS ${results.length} border cases: all styles (including legacy Inset), four shapes, ten sizes, nine fixing/wood/corner configurations, wood, square/rounded corners, border off.`);
  if (baselineRef) console.log(`PASS old/new full SVG comparison: only engraved border widths differ from ${baselineRef}; evidence ${out}`);
} finally {
  await browser?.close();
  await server.close();
}
