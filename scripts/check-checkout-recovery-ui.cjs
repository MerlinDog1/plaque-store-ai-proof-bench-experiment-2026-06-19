const { chromium } = require('playwright');

const appUrl = process.env.APP_URL || 'http://127.0.0.1:4178';
const orderId = process.env.ORDER_ID;
const proofToken = process.env.PROOF_TOKEN;
const expectedProofText = process.env.EXPECTED_PROOF_TEXT || 'TRANSACTION TEST';

if (!orderId || !proofToken) {
  throw new Error('ORDER_ID and PROOF_TOKEN are required.');
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.route(`**/api/orders/${orderId}?proof=*`, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    await route.continue();
  });

  await page.goto(`${appUrl}/checkout?order=${encodeURIComponent(orderId)}&proof=${encodeURIComponent(proofToken)}`, {
    waitUntil: 'domcontentloaded',
  });

  await page.getByText('Loading approved proof...').waitFor();
  if (await page.getByRole('button', { name: 'Continue to secure Stripe checkout' }).count()) {
    throw new Error('Checkout action appeared before the approved order finished restoring.');
  }

  await page.getByRole('button', { name: 'Continue to secure Stripe checkout' }).waitFor({ timeout: 15000 });
  const proofText = (await page.locator('.commerce-checkout-preview svg').allTextContents()).join(' ');
  if (!proofText.includes(expectedProofText)) {
    throw new Error(`Stored approved SVG was not rendered after cross-device recovery: ${proofText}`);
  }
  if (await page.getByText('Finish your proof before checkout.').count()) {
    throw new Error('Recovered checkout was incorrectly treated as an unfinished proof.');
  }
  await page.getByText('£58.50').first().waitFor();

  console.log(JSON.stringify({
    loadingGuard: 'passed',
    storedApprovedSvg: 'passed',
    recoveredCheckoutAction: 'passed',
    canonicalPrice: '£58.50',
  }));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
