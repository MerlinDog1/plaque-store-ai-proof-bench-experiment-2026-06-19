const { chromium } = require('playwright');

const checkoutUrl = process.env.CHECKOUT_URL;
const orderId = process.env.ORDER_ID;
const sessionId = process.env.SESSION_ID;
const appUrl = process.env.APP_URL || 'http://127.0.0.1:4178';

if (!checkoutUrl || !orderId || !sessionId) {
  throw new Error('CHECKOUT_URL, ORDER_ID and SESSION_ID are required.');
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(checkoutUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

  await page.getByLabel('Full name').fill('InstaPlaque transaction test');
  await page.getByLabel('Address', { exact: true }).fill('1 Test Street');
  await page.getByLabel('Town or city').fill('London');
  await page.getByLabel('Postal code').fill('SW1A 1AA');
  await page.getByRole('textbox', { name: 'Phone number', exact: true }).fill('07400123456');
  await page.getByLabel('Card number').fill('4242424242424242');
  await page.getByLabel('Expiration').fill('1230');
  await page.getByRole('textbox', { name: 'CVC', exact: true }).fill('123');

  await page.getByRole('button', { name: /^Pay/ }).click();
  await page.waitForURL(/\/order-confirmed\?/, { timeout: 60000 });

  await page.goto(`${appUrl}/order-confirmed?session_id=${encodeURIComponent(sessionId)}&order=${encodeURIComponent(orderId)}`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await page.getByRole('heading', { name: 'Your plaque order is confirmed.' }).waitFor({ timeout: 30000 });
  await page.getByText('£58.50').waitFor();
  const approvedProofText = await page.locator('.commerce-order-proof').textContent();
  if (!approvedProofText?.includes('TRANSACTION TEST') || approvedProofText.includes('PLACEHOLDER PRODUCTION')) {
    throw new Error(`Confirmation did not show the exact approved customer proof: ${approvedProofText}`);
  }

  console.log(JSON.stringify({
    stripeTestPayment: 'passed',
    paidConfirmation: 'passed',
    exactApprovedProof: 'passed',
    totalPaid: '£58.50',
  }));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
