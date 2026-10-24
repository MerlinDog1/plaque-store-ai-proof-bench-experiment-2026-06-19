// For products whose example wording changed: render the flat product drawing (Shopping feed / product gallery image,
// public/site-images/merchant/<slug>.jpg, same CSS and checks as output/catalogue-wording/render-feed-images.cjs) and the
// designer layout used by the sample proof PDFs (output/catalogue-wording/layouts/<slug>.json, same extraction as
// render-wording-stencils.cjs), using the esbuild stencil app instead of a Vite dev server (memory budget).
// Usage (from the repo root, stencil app served on URL): node FEED_LAYOUTS URL WORDING_JSON
const { chromium } = require('/home/coding-agent/workspace/projects/instaplaque-google-analytics/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROLE = {
  name: { size: 27, weight: 600, spacing: 0.6 }, intro: { size: 15, weight: 400, spacing: 0 }, body: { size: 15, weight: 400, spacing: 0 },
  date: { size: 15, weight: 400, spacing: 0.3 }, small: { size: 12.5, weight: 400, spacing: 0 },
};
const esc = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
function buildSvg(lines) {
  let y = 0, prev = null, gap = 0;
  const parts = [];
  for (const [role, text] of lines) {
    if (role === 'gap') { gap += 12; continue; }
    const style = ROLE[role];
    if (!prev) y = style.size * 0.8;
    else y += prev.size * 0.42 + style.size * 0.92 + (prev.role === 'name' || role === 'name' ? 6 : 0) + gap;
    gap = 0;
    parts.push(`<text x="150" y="${y.toFixed(1)}" text-anchor="middle" font-family="EB Garamond" font-size="${style.size}"${style.weight !== 400 ? ` font-weight="${style.weight}"` : ''}${style.spacing ? ` letter-spacing="${style.spacing}"` : ''}>${esc(text)}</text>`);
    prev = { ...style, role };
  }
  return `<g>${parts.join('')}</g>`;
}
const CSS = 'html,body{margin:0!important;background:white!important;width:1500px!important;height:1500px!important;overflow:hidden!important}#merchant-render{width:1500px!important;height:1500px!important;display:flex;align-items:center;justify-content:center}.print-content{width:1360px!important;height:1360px!important;max-height:none!important;border:0!important;background:white!important;padding:0!important;box-shadow:none!important;border-radius:0!important;aspect-ratio:auto!important}.print-content>.pointer-events-none,.designer-preview-tools{display:none!important}.proof-preview-viewport,.proof-preview-scale{width:100%!important;height:100%!important;max-height:none!important;background:transparent!important;overflow:visible!important;transition:none!important}svg{transition:none!important}.proof-canvas::after,.proof-canvas::before{display:none!important}';

(async () => {
  const [url, wordingFile] = process.argv.slice(2);
  const catalogue = path.resolve('output/catalogue-wording');
  const { merchantOffers } = await import(path.resolve('services/merchantCatalogue.mjs'));
  const items = JSON.parse(fs.readFileSync(wordingFile, 'utf8'));
  const browser = await chromium.launch({ executablePath: '/opt/google/chrome/chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--renderer-process-limit=1', '--js-flags=--max-old-space-size=448'] });
  const page = await browser.newPage({ viewport: { width: 1500, height: 1500 }, deviceScaleFactor: 1 });
  page.on('pageerror', error => console.error('pageerror', error.message));
  await page.route('**/api/**', route => route.abort());
  await page.goto(url);
  await page.waitForFunction(() => window.stencilReady === true, null, { timeout: 30000 });
  await page.addStyleTag({ content: CSS });
  const metricsFile = path.join(catalogue, 'metrics.json');
  const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
  for (const item of items) {
    const offer = merchantOffers.find(entry => entry.slug === item.slug);
    const preset = { ...offer.preset, ...(item.overrides || {}) };
    const inscription = item.lines.filter(line => line[0] !== 'gap').map(line => line[1]).join('\n');
    const result = await page.evaluate(([p, s, i]) => window.renderStencil(p, s, i), [preset, buildSvg(item.lines), inscription]);
    if (result.fixings !== preset.fixingHoleCount) throw new Error(`Hardware mismatch ${item.slug}`);
    for (const [role, text] of item.lines) if (role !== 'gap' && !result.words.includes(text)) throw new Error(`Missing line in ${item.slug}: ${text}`);
    const extra = await page.evaluate(() => {
      const el = document.querySelector('.proof-preview-scale>svg');
      const layer = el.querySelector('#ai-text-layer');
      const toRoot = node => el.getScreenCTM().inverse().multiply(node.getScreenCTM());
      const matrix = m => [m.a, m.b, m.c, m.d, m.e, m.f].map(v => Number(v.toFixed(5)));
      const cut = el.querySelector('.cut-line');
      const cutBox = cut.getBBox();
      const cutM = toRoot(cut);
      const corner = (x, y) => new DOMPoint(x, y).matrixTransform(cutM);
      const c0 = corner(cutBox.x, cutBox.y), c1 = corner(cutBox.x + cutBox.width, cutBox.y + cutBox.height);
      const texts = [...layer.querySelectorAll('text')].map(t => {
        const m = toRoot(t);
        const pt = new DOMPoint(Number(t.getAttribute('x') || 0), Number(t.getAttribute('y') || 0)).matrixTransform(m);
        const k = Math.hypot(m.a, m.b);
        return { text: t.textContent, x: pt.x, y: pt.y, size: Number(t.getAttribute('font-size')) * k, weight: Number(t.getAttribute('font-weight') || 400),
          ls: Number(t.getAttribute('letter-spacing') || 0) / Number(t.getAttribute('font-size')), anchor: t.getAttribute('text-anchor') || 'middle' };
      });
      const borders = [...el.querySelectorAll('.engraved-border')].map(b => ({ html: b.outerHTML, matrix: matrix(toRoot(b.parentNode)) }));
      const r = layer.getBoundingClientRect(), f = cut.getBoundingClientRect();
      return { layout: { viewBox: el.getAttribute('viewBox'), plate: { x: c0.x, y: c0.y, w: c1.x - c0.x, h: c1.y - c0.y }, texts, borders, portrait: null },
        inside: !(r.left < f.left || r.right > f.right || r.top < f.top || r.bottom > f.bottom) };
    });
    if (!extra.inside) throw new Error(`Text outside metal ${item.slug}`);
    fs.writeFileSync(path.join(catalogue, 'layouts', `${item.slug}.json`), JSON.stringify(extra.layout));
    metrics[item.slug] = { ...(metrics[item.slug] || {}), lines: item.lines, scale: result.scale, sizes: result.sizes };
    const out = path.join('public', offer.image);
    await page.screenshot({ path: out, type: 'jpeg', quality: 87 });
    execFileSync('exiftool', ['-q', '-overwrite_original', '-XMP-iptcExt:DigitalSourceType=http://cv.iptc.org/newscodes/digitalsourcetype/compositeSynthetic', out], { stdio: 'pipe' });
    console.log('OK', item.slug, 'scale', result.scale.toFixed(3), '->', out);
  }
  fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 1));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
