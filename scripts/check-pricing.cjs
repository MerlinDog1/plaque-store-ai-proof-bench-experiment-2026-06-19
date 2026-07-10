const { chromium } = require("playwright");

const APP_URL = process.env.APP_URL || "http://127.0.0.1:4179/";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function enterProofBench(page) {
  if (await page.locator(".proofbench-board").count()) return;
  await page.evaluate(() => {
    const button = Array.from(document.querySelectorAll("button")).find((candidate) => {
      const text = (candidate.textContent || "").trim().replace(/\s+/g, " ");
      return text === "Design" || text === "Design now" || text === "Design a plaque";
    });
    if (!button) throw new Error("Design entry button was not found");
    button.click();
  });
  await page.waitForSelector(".proofbench-board", { timeout: 5000 });
}

async function clickJourneyStep(page, compactLabel) {
  await page.evaluate((label) => {
    const normalizedLabel = label.replace(/\s+/g, "");
    const button = Array.from(document.querySelectorAll("button")).find((candidate) =>
      (candidate.textContent || "").trim().replace(/\s+/g, "").includes(normalizedLabel),
    );
    if (!button) throw new Error(`${label} journey button was not found`);
    button.click();
  }, compactLabel);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto(APP_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll("button")).some((candidate) => {
      const text = (candidate.textContent || "").trim().replace(/\s+/g, " ");
      return text === "Design" || text === "Design now" || text === "Design a plaque";
    }),
    null,
    { timeout: 60000 },
  );
  await enterProofBench(page);

  await page.waitForFunction(() => /1\s*Size\/Shape/.test(document.body.innerText) && /2\s*Material/.test(document.body.innerText), null, { timeout: 5000 });
  await clickJourneyStep(page, "1Size");
  await page.waitForFunction(() => /A4 landscape[\s\S]*from £145/.test(document.body.innerText), null, { timeout: 5000 });
  await page.waitForFunction(() => /Bench plaque[\s\S]*from £58\.50/.test(document.body.innerText), null, { timeout: 5000 });

  await clickJourneyStep(page, "2Material");
  await page.getByRole("button", { name: /Brushed stainless/i }).click();
  await clickJourneyStep(page, "1Size");
  await page.waitForFunction(() => /A4 landscape[\s\S]*from £145/.test(document.body.innerText), null, { timeout: 5000 });

  await clickJourneyStep(page, "2Material");
  await page.getByRole("button", { name: /Polished stainless/i }).click();
  await clickJourneyStep(page, "1Size");
  await page.waitForFunction(() => /A4 landscape[\s\S]*from £161\.50/.test(document.body.innerText), null, { timeout: 5000 });

  await clickJourneyStep(page, "2Material");
  await page.getByRole("button", { name: /Aged brass/i }).click();
  await clickJourneyStep(page, "1Size");
  await page.waitForFunction(() => /A4 landscape[\s\S]*from £182\.50/.test(document.body.innerText), null, { timeout: 5000 });

  await clickJourneyStep(page, "5Wood");
  await page.getByRole("button", { name: /^Add £85$/i }).click();
  await clickJourneyStep(page, "7Proof");
  await page.waitForFunction(() => /£267\.50/.test(document.body.innerText), null, { timeout: 5000 });

  const pricingText = await page.evaluate(() => document.body.innerText);
  assert(/£85\b/i.test(pricingText), "Wood summary should show the wood add-on price after selecting wood backing.");

  await clickJourneyStep(page, "1Size");
  await page.getByRole("button", { name: /150 x 50 mm/i }).click();
  await clickJourneyStep(page, "7Proof");
  await page.waitForFunction(() => /£69\.50/.test(document.body.innerText), null, { timeout: 5000 });

  await clickJourneyStep(page, "2Material");
  await page.getByRole("button", { name: /Brushed stainless/i }).click();
  await clickJourneyStep(page, "7Proof");
  await page.waitForFunction(() => /£58\.50/.test(document.body.innerText), null, { timeout: 5000 });

  await clickJourneyStep(page, "2Material");
  await page.getByRole("button", { name: /Polished stainless/i }).click();
  await clickJourneyStep(page, "7Proof");
  await page.waitForFunction(() => /£63\.50/.test(document.body.innerText), null, { timeout: 5000 });

  await clickJourneyStep(page, "1Size");
  await page.getByRole("button", { name: /Custom size/i }).click();
  const dimensionInputs = page.locator('input[inputmode="numeric"]');
  await dimensionInputs.nth(0).fill("400");
  await dimensionInputs.nth(0).press("Enter");
  await dimensionInputs.nth(1).fill("200");
  await dimensionInputs.nth(1).press("Enter");
  await page.waitForFunction(() => /£193/.test(document.body.innerText), null, { timeout: 5000 });

  await page.getByRole("button", { name: /^Oval$/i }).click();
  await page.waitForFunction(() => /£200/.test(document.body.innerText), null, { timeout: 5000 });

  await page.getByRole("button", { name: /^Circle$/i }).click();
  await page.waitForFunction(() => /£349/.test(document.body.innerText), null, { timeout: 5000 });

  await page.getByRole("button", { name: /^Rectangle$/i }).click();
  await dimensionInputs.nth(0).fill("700");
  await dimensionInputs.nth(0).press("Enter");
  await dimensionInputs.nth(1).fill("500");
  await dimensionInputs.nth(1).press("Enter");
  await page.waitForFunction(() => /600 x 500mm/.test(document.body.innerText), null, { timeout: 5000 });
  await page.waitForFunction(() => /£733\.50/.test(document.body.innerText), null, { timeout: 5000 });

  await browser.close();
  console.log("Pricing uses supplier cost inc VAT plus packing/delivery, 40% target margin, upward 50p rounding, custom-size updates, shaped uplift, 600mm max dimensions, and oversized bed uplift.");
})().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
