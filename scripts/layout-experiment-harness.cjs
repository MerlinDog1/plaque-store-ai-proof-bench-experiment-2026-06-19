const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const APP_URL = process.env.APP_URL || "http://127.0.0.1:5176/";
const OUT_DIR = process.env.LAYOUT_EXPERIMENT_OUT || "output/layout-experiment";
const CASE_LIMIT = Number(process.env.CASE_LIMIT || 0);
const GENERATE_TIMEOUT_MS = Number(process.env.GENERATE_TIMEOUT_MS || 180000);
const CHROMIUM_EXECUTABLE = process.env.CHROMIUM_EXECUTABLE || "/data/data/com.termux/files/usr/bin/chromium-browser";

const CASES = [
  {
    id: "bench-150-short-memorial",
    product: "Bench plaques",
    style: "Memorial",
    sizeChoice: null,
    text: "In loving memory of\nHarold Edwin Mercer\n1929-2017\nRemembered with love and gratitude",
  },
  {
    id: "bench-225-medium-memorial",
    product: "Bench plaques",
    style: "Memorial",
    sizeChoice: "225 x 75 mm",
    text: "In loving memory of\nFrederick Charles Langford\n1937-2021\nWho gave many years of devoted service to the village and its community",
  },
  {
    id: "bench-175-slim-strip",
    product: "Bench plaques",
    style: "Classical",
    sizeChoice: "175 x 25 mm",
    text: "Donated by the Walker Family\n2026",
  },
  {
    id: "a5-standard-memorial",
    product: "A5 plaques",
    style: "Memorial",
    sizeChoice: null,
    text: "In loving memory of\nArthur James Williams\nA devoted husband, father and grandfather\n1938-2026",
  },
  {
    id: "a4-official-opening",
    product: "A4 plaques",
    style: "Institutional",
    sizeChoice: null,
    text: "Opened by\nThe Rt Hon. Eleanor Hart MP\non 18 June 2026\nRiverside Community Centre",
  },
  {
    id: "a5-awkward-line-breaks",
    product: "A5 plaques",
    style: "Classical",
    sizeChoice: null,
    text: "Presented to\nJohn\nfor years of service and friendship\nfrom all of us",
  },
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

async function launchBrowser() {
  const launchOptions = {
    headless: true,
    args: ["--no-sandbox"],
  };
  if (fs.existsSync(CHROMIUM_EXECUTABLE)) {
    launchOptions.executablePath = CHROMIUM_EXECUTABLE;
  }
  return chromium.launch(launchOptions);
}

async function clickProduct(page, productTitle) {
  await page.goto(APP_URL, { waitUntil: "networkidle", timeout: 60000 });
  const card = page.locator(`article:has-text("${productTitle}")`).first();
  await card.locator('button:has-text("Start proof")').click({ timeout: 10000 });
  await page.waitForSelector(".proofbench-board", { timeout: 10000 });
}

async function clickStep(page, label) {
  await page.getByRole("button", { name: new RegExp(label, "i") }).click({ timeout: 10000 });
}

async function chooseSizeIfNeeded(page, sizeChoice) {
  if (!sizeChoice) return;
  await clickStep(page, "Size");
  await page.getByRole("button", { name: new RegExp(sizeChoice.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }).click({ timeout: 10000 });
  await page.waitForTimeout(250);
}

async function chooseStyle(page, style) {
  await clickStep(page, "Text");
  await page.getByRole("button", { name: new RegExp(`^${style}$`, "i") }).click({ timeout: 10000 });
}

async function generateLayout(page, text) {
  await page.locator("#inscription-wording-input").fill(text);
  await page.getByRole("button", { name: /Generate AI layout/i }).click({ timeout: 10000 });
  await page.waitForFunction(
    () => document.body.innerText.includes("Tweak manually")
      && document.body.innerText.includes("Regenerate")
      && !document.querySelector("#ai-text-layer")?.textContent?.includes("CHOOSE YOUR"),
    null,
    { timeout: GENERATE_TIMEOUT_MS },
  );
  await page.waitForTimeout(500);
}

function scoreFromMetrics(metrics) {
  let score = 100;
  const issues = [];

  if (!metrics.textCount) {
    score -= 80;
    issues.push("no rendered text elements");
  }
  if (!metrics.exactTextMatch) {
    score -= 35;
    issues.push("rendered text does not match input wording");
  }
  if (metrics.overflowX > 0.5 || metrics.overflowY > 0.5) {
    score -= 30;
    issues.push(`text overflows fit box by ${metrics.overflowX.toFixed(1)} x ${metrics.overflowY.toFixed(1)}`);
  }
  if (metrics.minFontSize && metrics.minFontSize < 5) {
    score -= 20;
    issues.push(`font smaller than 5 (${metrics.minFontSize.toFixed(1)})`);
  }
  if (metrics.shortOrphanLines.length) {
    score -= Math.min(25, metrics.shortOrphanLines.length * 8);
    issues.push(`short orphan lines: ${metrics.shortOrphanLines.join(", ")}`);
  }
  if (metrics.fontFamilies.length > 2) {
    score -= 10;
    issues.push(`too many fonts: ${metrics.fontFamilies.join(", ")}`);
  }
  if (metrics.textCount > 10) {
    score -= 8;
    issues.push(`too many text blocks (${metrics.textCount})`);
  }
  if (metrics.titleDominance < 1.15 && metrics.inputLength < 180) {
    score -= 8;
    issues.push("weak title dominance");
  }
  if (metrics.whitespaceRatio > 0.72 && metrics.inputLength > 80) {
    score -= 8;
    issues.push("too much empty space for the amount of text");
  }

  return {
    score: Math.max(0, Math.round(score)),
    issues,
  };
}

async function collectMetrics(page, inputText) {
  return page.evaluate((rawInputText) => {
    const normalize = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const layer = document.querySelector("#ai-text-layer");
    const texts = Array.from(document.querySelectorAll("#ai-text-layer text"));
    const fitW = Number(layer?.getAttribute("data-fit-width") || 0);
    const fitH = Number(layer?.getAttribute("data-fit-height") || 0);
    const layerBox = layer && "getBBox" in layer ? layer.getBBox() : { x: 0, y: 0, width: 0, height: 0 };
    const renderedText = normalize(texts.map((text) => text.textContent || "").join(" "));
    const inputText = normalize(rawInputText);
    const fontSizes = texts.flatMap((text) => {
      const inherited = Number(text.getAttribute("font-size") || 0);
      const nodes = Array.from(text.querySelectorAll("tspan"));
      if (!nodes.length) return [inherited].filter(Boolean);
      return nodes.map((node) => Number(node.getAttribute("font-size") || inherited)).filter(Boolean);
    });
    const fontFamilies = Array.from(new Set(texts.map((text) => text.getAttribute("font-family")).filter(Boolean)));
    const lines = texts.flatMap((text) => {
      const tspans = Array.from(text.querySelectorAll("tspan"));
      if (!tspans.length) return [normalize(text.textContent || "")].filter(Boolean);
      return tspans.map((line) => normalize(line.textContent || "")).filter(Boolean);
    });
    const sourceSingleWordLines = new Set(String(rawInputText).split(/\n+/).map(normalize).filter((line) => line.split(" ").length === 1));
    const shortOrphanLines = lines.filter((line) => {
      const words = line.split(" ").filter(Boolean);
      return words.length === 1 && line.length <= 4 && !sourceSingleWordLines.has(line);
    });
    const minFontSize = fontSizes.length ? Math.min(...fontSizes) : 0;
    const maxFontSize = fontSizes.length ? Math.max(...fontSizes) : 0;
    const avgOtherFontSize = fontSizes.length > 1
      ? fontSizes.filter((size) => size !== maxFontSize).reduce((sum, size) => sum + size, 0) / Math.max(1, fontSizes.length - 1)
      : maxFontSize;
    const overflowX = Math.max(0, layerBox.width - fitW);
    const overflowY = Math.max(0, layerBox.height - fitH);
    const whitespaceRatio = fitW && fitH ? Math.max(0, 1 - ((layerBox.width * layerBox.height) / (fitW * fitH))) : 1;
    return {
      textCount: texts.length,
      renderedText,
      exactTextMatch: renderedText === inputText,
      inputLength: inputText.length,
      fitW,
      fitH,
      bbox: { x: layerBox.x, y: layerBox.y, width: layerBox.width, height: layerBox.height },
      overflowX,
      overflowY,
      whitespaceRatio,
      minFontSize,
      maxFontSize,
      titleDominance: avgOtherFontSize ? maxFontSize / avgOtherFontSize : 1,
      fontFamilies,
      lines,
      shortOrphanLines,
    };
  }, inputText);
}

(async () => {
  ensureDir(OUT_DIR);
  const cases = CASE_LIMIT > 0 ? CASES.slice(0, CASE_LIMIT) : CASES;
  const browser = await launchBrowser();
  const results = [];

  for (const testCase of cases) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const startedAt = Date.now();
    try {
      await clickProduct(page, testCase.product);
      await chooseSizeIfNeeded(page, testCase.sizeChoice);
      await chooseStyle(page, testCase.style);
      await generateLayout(page, testCase.text);
      const metrics = await collectMetrics(page, testCase.text);
      const scored = scoreFromMetrics(metrics);
      const screenshot = path.join(OUT_DIR, `${testCase.id}.png`);
      await page.screenshot({ path: screenshot, fullPage: true });
      results.push({
        ...testCase,
        ok: true,
        durationMs: Date.now() - startedAt,
        screenshot,
        ...scored,
        metrics,
      });
      console.log(`${testCase.id}: score ${scored.score}${scored.issues.length ? ` (${scored.issues.join("; ")})` : ""}`);
    } catch (error) {
      const screenshot = path.join(OUT_DIR, `${testCase.id}-error.png`);
      await page.screenshot({ path: screenshot, fullPage: true }).catch(() => {});
      results.push({
        ...testCase,
        ok: false,
        durationMs: Date.now() - startedAt,
        screenshot,
        score: 0,
        issues: [String(error?.message || error)],
      });
      console.error(`${testCase.id}: failed:`, error);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  const summary = {
    appUrl: APP_URL,
    generatedAt: new Date().toISOString(),
    caseCount: results.length,
    averageScore: results.length ? Math.round(results.reduce((sum, result) => sum + result.score, 0) / results.length) : 0,
    results,
  };
  fs.writeFileSync(path.join(OUT_DIR, "results.json"), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(`Layout experiment complete: ${summary.caseCount} cases, average score ${summary.averageScore}.`);
  console.log(`Results: ${path.join(OUT_DIR, "results.json")}`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
