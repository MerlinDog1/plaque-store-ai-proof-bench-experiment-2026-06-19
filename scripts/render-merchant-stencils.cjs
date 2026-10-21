// Realistic-photo stencils for the catalogue: the exact PNG reference the designer's
// "realistic preview" sends to Gemini (svgToPngBase64), one per merchant offer.
// Needs a Vite dev server: APP_URL (default http://127.0.0.1:4210).
// Output: output/merchant-photos/stencils/<slug>.png, then run generate-merchant-photos.mjs.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const { merchantOffers } = await import('../services/merchantCatalogue.mjs');
  const only = process.env.ONLY ? new Set(process.env.ONLY.split(',')) : null;
  const offers = merchantOffers.filter(offer => !only || only.has(offer.slug));
  const outDir = path.resolve('output/merchant-photos/stencils');
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/opt/google/chrome/chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--renderer-process-limit=1', '--js-flags=--max-old-space-size=448'],
  });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: 1 });
  await page.route('**/api/**', route => route.abort());
  await page.goto(process.env.APP_URL || 'http://127.0.0.1:4210');
  // Vite reloads the page when it optimises newly seen dependencies; set up again after that.
  const setup = () => page.evaluate(async () => {
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const rootModule = await import('/node_modules/.vite/deps/react-dom_client.js');
    const createRoot = rootModule.createRoot || rootModule.default.createRoot;
    const { default: Preview } = await import('/components/PlaquePreview.tsx');
    const { INITIAL_STATE } = await import('/types.ts');
    const { svgToPngBase64 } = await import('/services/exportService.ts');
    document.body.innerHTML = '<div id="merchant-render" style="width:1100px;height:1100px"></div>';
    const root = createRoot(document.getElementById('merchant-render'));
    // Same example inscription as the catalogue renders, set in EB Garamond (in the outliner's
    // font catalogue; Georgia is not, and would be outlined in a sans fallback).
    const svg = '<g><text x="150" y="20" text-anchor="middle" font-family="EB Garamond" font-size="15">In loving memory of</text><text x="150" y="55" text-anchor="middle" font-family="EB Garamond" font-size="27" font-weight="600" letter-spacing="0.6">ALEX MORGAN</text><text x="150" y="86" text-anchor="middle" font-family="EB Garamond" font-size="15">Forever in our hearts</text></g>';
    window.renderStencil = async preset => {
      // The two side fixings of ovals and circles sit on the name line; keep the name clear of them.
      const inscriptionScale = preset.shape === 'circle' ? 0.7 : preset.shape === 'oval' ? 0.8 : 1;
      const state = { ...INITIAL_STATE, ...preset, inscriptionScale, generatedSvgContent: svg };
      root.render(React.createElement(Preview, { key: JSON.stringify(preset), state, activeStep: 6, inscription: 'In loving memory of\nALEX MORGAN\nForever in our hearts' }));
      await new Promise(resolve => setTimeout(resolve, 150));
      await document.fonts.ready;
      const el = document.querySelector('.proof-preview-scale>svg');
      if (!el) throw new Error('No plaque SVG');
      const words = [...el.querySelectorAll('#ai-text-layer text')].map(t => t.textContent).join('|');
      if (!words.includes('ALEX MORGAN')) throw new Error('Missing inscription');
      return { png: await svgToPngBase64(el, state), fixings: el.querySelectorAll('.fixing').length, words };
    };
  });
  const render = async preset => {
    for (let attempt = 1; ; attempt++) {
      try {
        if (!await page.evaluate(() => typeof window.renderStencil === 'function')) await setup();
        return await page.evaluate(value => window.renderStencil(value), preset);
      } catch (error) {
        if (attempt >= 4 || !/context was destroyed|navigation|renderStencil/i.test(String(error))) throw error;
        await page.waitForLoadState('load');
        await page.waitForTimeout(1500);
      }
    }
  };
  const report = [];
  for (const offer of offers) {
    const result = await render(offer.preset);
    if (result.fixings !== offer.preset.fixingHoleCount) throw new Error(`Hardware mismatch ${offer.slug}: ${result.fixings}`);
    fs.writeFileSync(path.join(outDir, `${offer.slug}.png`), Buffer.from(result.png, 'base64'));
    report.push({ slug: offer.slug, fixings: result.fixings, words: result.words });
    if (report.length % 25 === 0) console.log('Stencils', report.length);
  }
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
  console.log('Rendered', report.length, 'stencils');
})().catch(error => { console.error(error); process.exit(1); });
