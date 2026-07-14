const { chromium } = require('playwright');

const appUrl = process.env.APP_URL || 'http://127.0.0.1:4178';
const order = {
  id: 'PSAI-ADMIN-PROOF-TEST',
  customerName: 'Admin proof test',
  customerEmail: 'test@example.com',
  status: 'paid',
  paymentStatus: 'paid',
  fulfilmentStatus: 'not_started',
  totalPence: 5850,
  currency: 'gbp',
  productTitle: 'Brushed stainless / 150 x 50 mm',
  inscription: 'VISUAL EXACT CUSTOMER PROOF',
  stripeCheckoutSessionId: 'cs_test_admin_proof',
  createdAt: '2026-07-14T02:00:00.000Z',
  updatedAt: '2026-07-14T02:00:00.000Z',
  plaqueState: {
    width: 150,
    height: 50,
    shape: 'rect',
    material: 'brushed-stainless',
    textColor: 'black',
    fixing: 'screws',
    fixingHoleCount: 2,
    wood: false,
  },
  proofPackage: {
    productionSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 50"><text x="10" y="25">WRONG PLACEHOLDER PRODUCTION</text></svg>',
    visualProofSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 50"><text x="10" y="25">VISUAL EXACT CUSTOMER PROOF</text></svg>',
    productionFilename: 'PSAI-ADMIN-PROOF-TEST-production-proof.svg',
  },
  events: [],
  metadata: { source: 'instaplaque-checkout' },
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.route('**/api/admin/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/admin/auth-config') {
      await route.fulfill({ json: { ok: true, configured: true, operational: true, authRequired: false, status: 'configured' } });
      return;
    }
    if (url.pathname === '/api/admin/orders') {
      await route.fulfill({ json: { ok: true, orders: [order] } });
      return;
    }
    if (url.pathname === `/api/admin/orders/${order.id}`) {
      await route.fulfill({ json: { ok: true, order } });
      return;
    }
    await route.fulfill({ status: 404, json: { error: 'Unexpected mocked admin route' } });
  });

  await page.goto(`${appUrl}/admin`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: order.id }).waitFor({ timeout: 15000 });

  const visibleProof = page.locator('.admin-console__detail--desktop .admin-console__proof-svg');
  await visibleProof.waitFor();
  const visibleText = await visibleProof.textContent();
  if (!visibleText?.includes('VISUAL EXACT CUSTOMER PROOF') || visibleText.includes('WRONG PLACEHOLDER')) {
    throw new Error(`Admin preview did not prioritize the exact customer proof: ${visibleText}`);
  }

  const exportSourceText = await page.locator('.admin-console__export-source').textContent();
  if (!exportSourceText?.includes('VISUAL EXACT CUSTOMER PROOF') || exportSourceText.includes('WRONG PLACEHOLDER')) {
    throw new Error(`Production export source did not prioritize the exact customer proof: ${exportSourceText}`);
  }

  const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
  await page.getByRole('button', { name: /Download production artwork/i }).click();
  const download = await downloadPromise;
  if (!download.suggestedFilename().endsWith('.pdf')) {
    throw new Error(`Production artwork was not exported as PDF: ${download.suggestedFilename()}`);
  }

  const approvedProofDownloadPromise = page.waitForEvent('download', { timeout: 15000 });
  await page.getByRole('button', { name: /Download approved proof/i }).click();
  const approvedProofDownload = await approvedProofDownloadPromise;
  if (!approvedProofDownload.suggestedFilename().endsWith('.png')) {
    throw new Error(`Stored approved proof was not exported as PNG: ${approvedProofDownload.suggestedFilename()}`);
  }

  console.log(JSON.stringify({
    exactCustomerProofPreview: 'passed',
    exactCustomerProofExportSource: 'passed',
    productionPdf: download.suggestedFilename(),
    approvedProofPng: approvedProofDownload.suggestedFilename(),
  }));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
