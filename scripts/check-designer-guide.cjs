const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.addInitScript(() => localStorage.setItem('instaplaque-designer-intro-seen', '1'));
  await page.goto('http://127.0.0.1:4179/design', { waitUntil: 'networkidle' });

  await page.locator('.designer-guide-trigger').click();
  await page.locator('.designer-guide').evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
  });
  await page.waitForTimeout(250); // The drawer's CSS transition is 220ms.
  const tabs = await page.getByRole('tab').allTextContents();
  if (tabs.join('|') !== 'How it works|Gallery|Guide & FAQs') throw new Error(`Unexpected tabs: ${tabs.join('|')}`);
  await page.getByRole('heading', { name: 'How the designer works' }).waitFor();
  if (await page.getByText('Open step').count() !== 0) throw new Error('The guide should not contain step navigation buttons.');
  await page.getByText('Come back when ready').waitFor();
  await page.screenshot({ path: '/data/data/com.termux/files/usr/tmp/instaplaque-guide-how-mobile.png' });

  await page.getByRole('tab', { name: 'Gallery' }).click();
  if (await page.locator('.designer-guide__category-links').count() !== 0) throw new Error('Gallery should not contain outbound category links.');
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
  await page.getByText('Can I save the proof and come back later?').waitFor();
  await page.getByText('Are aged brass patinas identical?').waitFor();
  if (await page.getByText('Read all plaque FAQs').count() !== 0) throw new Error('FAQ should be complete in the drawer, with no outbound link.');
  await page.screenshot({ path: '/data/data/com.termux/files/usr/tmp/instaplaque-guide-faq-mobile.png' });

  console.log(JSON.stringify({ tabs, viewer: 'passed', fullFaq: 'passed', selfContainedGuide: 'passed' }));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
