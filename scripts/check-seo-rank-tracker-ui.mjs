import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const appUrl = process.env.APP_URL || 'http://127.0.0.1:4179';
const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'visual-check';
const outputDir = 'output/playwright';
const csv = [
  'Top queries,Clicks,Impressions,CTR,Position',
  'custom plaques uk,4,120,3.33%,12.4',
  'brass plaques uk,9,1200,0.75%,4.6',
  'memorial plaques uk,12,2200,0.55%,8.1',
  'bench plaques uk,7,950,0.74%,6.2',
  'opening plaques uk,2,180,1.11%,14.3',
].join('\n');

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });

try {
  for (const config of [
    { name: 'desktop', viewport: { width: 1440, height: 1000 }, isMobile: false },
    { name: 'mobile', viewport: { width: 390, height: 844 }, isMobile: true },
  ]) {
    const page = await browser.newPage({ viewport: config.viewport, isMobile: config.isMobile });
    await page.goto(`${appUrl}/admin`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.getByLabel('Admin passcode').fill(adminPassword);
    await page.getByRole('button', { name: 'Unlock orders' }).click();
    await page.getByRole('button', { name: 'Search position' }).click();
    await page.getByRole('heading', { name: '25-search position tracker' }).waitFor();

    const searchRows = page.locator('.seo-rank-tracker tbody tr');
    if (await searchRows.count() !== 25) throw new Error(`${config.name}: expected 25 tracked searches.`);

    await page.locator('.seo-rank-tracker input[type="file"][accept*="csv"]').setInputFiles({
      name: 'Queries.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csv),
    });
    await page.getByText(/Saved 5 matching searches/).waitFor();
    await page.getByText('5/25', { exact: true }).waitFor();

    const overflow = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
      tableScrolls: document.querySelector('.seo-rank-tracker__table-wrap')?.scrollWidth
        > document.querySelector('.seo-rank-tracker__table-wrap')?.clientWidth,
    }));
    if (overflow.documentWidth > overflow.viewportWidth + 1) {
      throw new Error(`${config.name}: tracker causes document overflow (${JSON.stringify(overflow)}).`);
    }
    if (config.isMobile && !overflow.tableScrolls) throw new Error('mobile: rank table should scroll inside its container.');

    await page.screenshot({ path: `${outputDir}/seo-rank-tracker-${config.name}.png`, fullPage: true });
    await page.close();
  }
} finally {
  await browser.close();
}

console.log('SEO rank tracker UI passed on desktop and mobile with 25 rows, CSV import, summary update and contained table scrolling.');
