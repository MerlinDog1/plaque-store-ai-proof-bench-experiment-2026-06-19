import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

const dom = new JSDOM('', { url: 'http://localhost' });
globalThis.DOMParser = dom.window.DOMParser;
globalThis.document = dom.window.document;
const renderer = await createServer({
  server: { middlewareMode: true, hmr: false },
  optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom',
});
try {
  const { createManualTypography, readSvgInscription } =
    await renderer.ssrLoadModule('/services/manualTypography.ts');
  const wording = 'Élodie & James <Always>\n\n1938–2026\n"In our hearts"';
  const result = createManualTypography(wording, { width: 110, height: 55 });
  assert.equal(readSvgInscription(result.svgContent), wording);
  assert.ok(result.svgContent.includes('&amp;') && result.svgContent.includes('&lt;'));
  assert.equal(result.conceptImageUrl, null);
  const parse = svg => new DOMParser().parseFromString(`<svg>${svg}</svg>`, 'image/svg+xml');
  const elements = [...parse(result.svgContent).querySelectorAll('text')];
  assert.equal(elements.length, 4, 'Explicit blank lines are retained');
  for (const text of elements) {
    const y = Number(text.getAttribute('y'));
    const size = Number(text.getAttribute('font-size'));
    assert.ok(size >= 4);
    assert.ok(y - size >= -27.5 && y + size * 0.4 <= 27.5, 'Vertical ink stays inside actual box');
    assert.equal(text.getAttribute('font-family'), 'Lato');
  }
  const narrow = createManualTypography('REMEMBERED\nALWAYS', { width: 42, height: 30 });
  const wide = createManualTypography('REMEMBERED\nALWAYS', { width: 160, height: 90 });
  assert.ok(Number(parse(narrow.svgContent).querySelector('text').getAttribute('font-size'))
    < Number(parse(wide.svgContent).querySelector('text').getAttribute('font-size')),
  'The actual artwork-reserved box determines fit');
  assert.equal(readSvgInscription('<text><tspan>Always</tspan><tspan>remembered</tspan></text><text>2026</text>'),
    'Always\nremembered\n2026');
  assert.equal(readSvgInscription('<text>Dear <tspan>James</tspan></text>'), 'Dear\nJames');
  assert.throws(() => readSvgInscription('<text>Broken'), /valid SVG/);
  assert.throws(() => readSvgInscription('<!DOCTYPE svg><text>No</text>'), /declaration/);
  for (const box of [{ width: NaN, height: 20 }, { width: 20, height: 0 }, { width: Infinity, height: 20 }]) {
    assert.throws(() => createManualTypography('Name', box), /dimensions/);
  }
  assert.throws(() => createManualTypography(' ', { width: 100, height: 100 }), /inscription first/);
  assert.throws(() => createManualTypography('A'.repeat(200), { width: 30, height: 20 }), /will not fit/);
  assert.throws(() => createManualTypography('Name\nDates', { width: 100, height: 5 }), /will not fit/);
  assert.throws(() => createManualTypography('Bad\u0000text', { width: 100, height: 100 }), /control/);
  assert.equal(readSvgInscription(createManualTypography('First\r\nSecond', { width: 100, height: 60 }).svgContent), 'First\nSecond');

  // Loaded-font canvas path: intentionally wide metrics must shrink/reject,
  // rather than fit using the fallback estimate or whole-plaque dimensions.
  let calls = 0;
  globalThis.document = {
    fonts: { check: () => true },
    createElement: () => ({ getContext: () => ({
      font: '', measureText(text) {
        calls++;
        const size = Number(this.font.split(' ')[1].replace('px', ''));
        return { width: text.length * size * 2 };
      },
    }) }),
  };
  assert.throws(() => createManualTypography('1234567890', { width: 40, height: 100 }), /will not fit/);
  assert.ok(calls > 0, 'Loaded-font canvas measurement is used');
  console.log('Manual typography: exact wording, escapes, line breaks, fit rejection, and canvas checks passed.');
} finally {
  await renderer.close();
  dom.window.close();
}
