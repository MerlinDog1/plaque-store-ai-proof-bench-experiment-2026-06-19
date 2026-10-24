// Render the hand-coded plaque designs written by coded.py: wait for the fonts, scale the wording block to fit its box
// (never more than 12% up), centre it a touch above the middle, check every line is inside the plate, and save PNGs.
// Usage: node render_coded.cjs BASE_URL DIR   (DIR holds jobs.json and the .html pages)
const { chromium } = require('/home/coding-agent/workspace/projects/instaplaque-google-analytics/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const [base, dir] = process.argv.slice(2);
(async () => {
  const jobs = JSON.parse(fs.readFileSync(path.join(dir, 'jobs.json'), 'utf8'));
  const browser = await chromium.launch({
    executablePath: '/opt/google/chrome/chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--renderer-process-limit=1', '--js-flags=--max-old-space-size=448'],
  });
  let failures = 0;
  for (const job of jobs) {
    const page = await browser.newPage({ viewport: { width: job.width, height: job.height }, deviceScaleFactor: 1 });
    await page.goto(`${base}/${job.id}.html`);
    const report = await page.evaluate(async ([x0, y0, x1, y1]) => {
      await document.fonts.ready;
      const fonts = ['400', '600'].every(w => document.fonts.check(`${w} 10px EBG`));
      const words = document.getElementById('words');
      const b = words.getBBox();
      const scale = Math.min(1.12, (x1 - x0) / b.width, (y1 - y0) / b.height);
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 - (y1 - y0) * 0.02;
      const tx = cx - (b.x + b.width / 2) * scale, ty = cy - (b.y + b.height / 2) * scale;
      words.setAttribute('transform', `translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${scale.toFixed(4)})`);
      const lines = [...words.querySelectorAll('text')].map(t => {
        const r = t.getBBox();
        return { text: t.textContent, mm: +(Number(t.getAttribute('font-size')) * scale).toFixed(2),
                 left: +(tx + r.x * scale).toFixed(1), right: +(tx + (r.x + r.width) * scale).toFixed(1) };
      });
      return { fonts, scale: +scale.toFixed(3), lines, box: [x0, y0, x1, y1] };
    }, job.box);
    const inside = report.lines.every(l => l.left >= report.box[0] - 0.5 && l.right <= report.box[2] + 0.5);
    if (!report.fonts || !inside) failures++;
    console.log((report.fonts && inside ? 'OK  ' : 'FAIL'), job.id, 'scale', report.scale,
      report.lines.map(l => `${l.text.slice(0, 24)}:${l.mm}mm`).join(' | '));
    await page.locator('#plaque').screenshot({ path: path.join(dir, `${job.id}.png`) });
    await page.close();
  }
  await browser.close();
  process.exit(failures ? 1 : 0);
})().catch(error => { console.error(error); process.exit(2); });
