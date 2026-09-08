const { chromium } = require("playwright");
const { enterProofBench, clickJourney } = require("./designer-test-helpers.cjs");

const APP_URL = process.env.APP_URL || "http://127.0.0.1:4179/";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}


async function setCustomSize(page, width, height) {
  await clickJourney(page, "Size\\/Shape");
  await page.getByRole("button", { name: /Custom size/i }).click();
  await page.locator('input[inputmode="numeric"]').nth(0).fill(String(width));
  await page.locator('input[inputmode="numeric"]').nth(0).press("Enter");
  await page.locator('input[inputmode="numeric"]').nth(1).fill(String(height));
  await page.locator('input[inputmode="numeric"]').nth(1).press("Enter");
}

async function readOuterBorderStroke(page) {
  await page.waitForFunction(() => (document.querySelector("#border-layer")?.children.length || 0) > 0, null, { timeout: 5000 });
  return page.evaluate(() => {
    const borderElement = document.querySelector("#border-layer .engraved-border");
    if (!borderElement) throw new Error("Border element was not found");
    return Number(borderElement.getAttribute("stroke-width") || borderElement.getAttribute("strokeWidth") || "0");
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto(APP_URL, { waitUntil: "networkidle", timeout: 60000 });

  await clickJourney(page, "Fixings and border");
  await page.getByRole("button", { name: /^Border$/i }).click();
  await page.getByRole("button", { name: /^Single\s/i }).click();

  await setCustomSize(page, 150, 50);
  const smallStroke = await readOuterBorderStroke(page);

  await setCustomSize(page, 150, 100);
  const normalStroke = await readOuterBorderStroke(page);

  assert(smallStroke === 0.5, `Expected under-100mm border stroke to be 0.5, got ${smallStroke}`);
  assert(normalStroke === 1, `Expected normal border stroke to be 1, got ${normalStroke}`);

  await browser.close();
  console.log("Borders render at half stroke when either plaque dimension is under 100mm.");
})().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
