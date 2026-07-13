const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.addInitScript(() => localStorage.setItem('instaplaque-designer-intro-seen', '1'));
  await page.goto('http://127.0.0.1:4179/design', { waitUntil: 'networkidle' });

  await page.locator('.designer-guide-trigger').click();
  const tabs = await page.getByRole('tab').allTextContents();
  if (tabs.join('|') !== 'How it works|Gallery|Guide & FAQs') throw new Error(`Unexpected tabs: ${tabs.join('|')}`);
  await page.getByRole('heading', { name: 'How the designer works' }).waitFor();
  if (await page.getByText('Open step').count() !== 7) throw new Error('Expected seven working-step links.');
  await page.screenshot({ path: '/data/data/com.termux/files/usr/tmp/instaplaque-guide-how-mobile.png' });

  await page.getByRole('tab', { name: 'Gallery' }).click();
  await page.getByRole('button', { name: 'Expand Classic brass bench plaque' }).click();
  await page.getByRole('dialog', { name: 'Classic brass bench plaque' }).waitFor();
  await page.screenshot({ path: '/data/data/com.termux/files/usr/tmp/instaplaque-guide-gallery-mobile.png' });
  await page.getByRole('button', { name: 'Next gallery image' }).click();
  await page.getByText('2 / 6').waitFor();
  await page.getByRole('button', { name: 'Return to gallery' }).click();
  await page.getByRole('button', { name: 'Expand Classic brass bench plaque' }).waitFor();

  await page.getByRole('tab', { name: 'Guide & FAQs' }).click();
  await page.getByRole('heading', { name: 'A quick plaque buying guide' }).waitFor();
  await page.getByText('Frequently asked questions').waitFor();

  await page.getByRole('tab', { name: 'How it works' }).click();
  await page.getByRole('button', { name: 'Open designer step: Enter the wording and create the layout' }).click();
  await page.locator('#inscription-wording-input').waitFor();

  console.log(JSON.stringify({ tabs, viewer: 'passed', combinedGuideFaq: 'passed', stepHandoff: 'passed' }));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
