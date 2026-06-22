const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const APP_URL = process.env.APP_URL || "http://127.0.0.1:5176/";
const OUT_DIR = process.env.LAYOUT_EXPERIMENT_OUT || "output/layout-experiment";
const CASE_LIMIT = Number(process.env.CASE_LIMIT || 0);
const GENERATE_TIMEOUT_MS = Number(process.env.GENERATE_TIMEOUT_MS || 180000);
const CHROMIUM_EXECUTABLE = process.env.CHROMIUM_EXECUTABLE || "/data/data/com.termux/files/usr/bin/chromium-browser";
const SEMANTIC_LAYOUT_EXPERIMENT = process.env.SEMANTIC_LAYOUT_EXPERIMENT === "1";

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
    id: "bench-175-slim-name-dates",
    product: "Bench plaques",
    style: "Memorial",
    sizeChoice: "175 x 25 mm",
    text: "Remembering Margaret Anne Price\n1944-2024",
  },
  {
    id: "bench-175-slim-long-risk",
    product: "Bench plaques",
    style: "Modern",
    sizeChoice: "175 x 25 mm",
    text: "For everyone who finds a quiet moment here beside the river",
  },
  {
    id: "bench-200-strip-donation",
    product: "Bench plaques",
    style: "Classical",
    sizeChoice: "200 x 50 mm",
    text: "This bench was donated by\nThe Friends of St Mary's Park\nJune 2026",
  },
  {
    id: "bench-200-strip-service",
    product: "Bench plaques",
    style: "Institutional",
    sizeChoice: "200 x 50 mm",
    text: "Presented in recognition of 25 years of service\nDavid Morgan",
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
  {
    id: "a5-long-memorial-prose",
    product: "A5 plaques",
    style: "Memorial",
    sizeChoice: null,
    text: "In loving memory of\nPatricia Rose Bennett\nA much loved wife, mum, nan and friend\nWhose kindness, laughter and courage will stay with us always\n1948-2025",
  },
  {
    id: "a5-very-short-modern",
    product: "A5 plaques",
    style: "Modern",
    sizeChoice: null,
    text: "The Garden Room\nOpened 2026",
  },
  {
    id: "a5-name-with-short-connectors",
    product: "A5 plaques",
    style: "Classical",
    sizeChoice: null,
    text: "To\nElizabeth\nWith love from\nMum and Dad",
  },
  {
    id: "a5-all-caps-heritage",
    product: "A5 plaques",
    style: "Heritage",
    sizeChoice: null,
    text: "THE OLD MILL\nRESTORED BY THE COMMUNITY\n2026",
  },
  {
    id: "a5-commercial-hours",
    product: "A5 plaques",
    style: "Modern",
    sizeChoice: null,
    text: "Reception\nPlease ring the bell for assistance\nMonday to Friday\n9am-5pm",
  },
  {
    id: "a5-punctuation-heavy",
    product: "A5 plaques",
    style: "Classical",
    sizeChoice: null,
    text: "No. 14\nThe Coach House\nEst. 1896\nRestored 2026",
  },
  {
    id: "a5-mixed-hierarchy-award",
    product: "A5 plaques",
    style: "Institutional",
    sizeChoice: null,
    text: "Lifetime Achievement Award\nPresented to Sarah Ahmed\nFor outstanding contribution to local education\nJune 2026",
  },
  {
    id: "a5-minimal-one-line",
    product: "A5 plaques",
    style: "Modern",
    sizeChoice: null,
    text: "Home is wherever we are together",
  },
  {
    id: "a5-memorial-date-first",
    product: "A5 plaques",
    style: "Memorial",
    sizeChoice: null,
    text: "1942-2023\nGeorge William Carter\nBeloved husband, father and grandad",
  },
  {
    id: "a5-heritage-blue-plaque",
    product: "A5 plaques",
    style: "Heritage",
    sizeChoice: null,
    text: "On this site stood\nThe King's Arms\nA coaching inn from 1782 to 1911",
  },
  {
    id: "a4-dense-dedication",
    product: "A4 plaques",
    style: "Classical",
    sizeChoice: null,
    text: "This hall is dedicated to\nCouncillor Michael Thompson\nIn grateful recognition of his leadership, generosity and lifelong commitment to the people of Northbridge\nUnveiled 22 June 2026",
  },
  {
    id: "a4-official-multi-line",
    product: "A4 plaques",
    style: "Institutional",
    sizeChoice: null,
    text: "Riverside Primary School\nScience and Discovery Wing\nOpened by Dr Helen Fraser\nChair of Governors\n22 June 2026",
  },
  {
    id: "a4-list-like-donors",
    product: "A4 plaques",
    style: "Institutional",
    sizeChoice: null,
    text: "Made possible through the support of\nThe Greenfield Trust\nNorthbank Council\nThe Patel Family Foundation\nCommunity donors and volunteers",
  },
  {
    id: "a4-short-bold",
    product: "A4 plaques",
    style: "Bold",
    sizeChoice: null,
    text: "THE WORKSHOP\nMAKE GOOD THINGS",
  },
  {
    id: "a4-modern-commercial",
    product: "A4 plaques",
    style: "Modern",
    sizeChoice: null,
    text: "Studio 3\nCreative Production Suite\nDesigned for film, audio and digital media",
  },
  {
    id: "a4-heritage-dates",
    product: "A4 plaques",
    style: "Heritage",
    sizeChoice: null,
    text: "Brookfield Library\nFounded 1894\nRestored and reopened for the community\n2026",
  },
  {
    id: "a4-memorial-wide",
    product: "A4 plaques",
    style: "Memorial",
    sizeChoice: null,
    text: "In memory of the members of this club who gave their time, energy and friendship so freely\nTheir spirit remains at the heart of everything we do",
  },
  {
    id: "bench-150-too-much-copy",
    product: "Bench plaques",
    style: "Memorial",
    sizeChoice: "150 x 50 mm",
    text: "In loving memory of our wonderful parents Alan and Joan Matthews whose love, humour and kindness made this park a brighter place for everyone who knew them",
  },
  {
    id: "bench-150-three-line-commemorative",
    product: "Bench plaques",
    style: "Classical",
    sizeChoice: "150 x 50 mm",
    text: "Celebrating 50 years\nof friendship and laughter\nThe Sunday Walking Group",
  },
  {
    id: "bench-225-poem-risk",
    product: "Bench plaques",
    style: "Memorial",
    sizeChoice: "225 x 75 mm",
    text: "Sit awhile and remember\nThe laughter we shared\nThe paths we walked\nThe love that remains",
  },
  {
    id: "bench-225-official",
    product: "Bench plaques",
    style: "Institutional",
    sizeChoice: "225 x 75 mm",
    text: "Installed by Westford Town Council\nTo mark the Coronation Garden restoration\n2026",
  },
  {
    id: "bench-225-modern-short",
    product: "Bench plaques",
    style: "Modern",
    sizeChoice: "225 x 75 mm",
    text: "Pause\nBreathe\nBegin again",
  },
  {
    id: "bench-225-long-name",
    product: "Bench plaques",
    style: "Memorial",
    sizeChoice: "225 x 75 mm",
    text: "In loving memory of\nAlexandra Catherine Elizabeth Montgomery\n1961-2024",
  },
  {
    id: "a5-auto-inferred-memorial",
    product: "A5 plaques",
    style: "Auto",
    sizeChoice: null,
    text: "Forever in our hearts\nLinda May Evans\n1955-2022",
  },
  {
    id: "a4-auto-inferred-opening",
    product: "A4 plaques",
    style: "Auto",
    sizeChoice: null,
    text: "Opened by The Mayor of Eastwick\nCouncillor Priya Shah\non 1 May 2026",
  },
  {
    id: "a5-artisan-cafe",
    product: "A5 plaques",
    style: "Artisan",
    sizeChoice: null,
    text: "The Bakehouse\nHandmade here daily\nSince 2026",
  },
  {
    id: "a4-monumental-club",
    product: "A4 plaques",
    style: "Monumental",
    sizeChoice: null,
    text: "OAKFIELD CRICKET CLUB\nCHAMPIONS\n2026",
  },
  {
    id: "a5-bilingual-risk",
    product: "A5 plaques",
    style: "Classical",
    sizeChoice: null,
    text: "Croeso\nWelcome to Cae Glas\nCommunity Garden\n2026",
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
  const escapedSize = sizeChoice.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  await page.locator("button.size-preset-option", { hasText: new RegExp(escapedSize, "i") }).first().click({ timeout: 10000 });
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
  if (metrics.textCount > 1 && metrics.titleDominance < 1.15 && metrics.inputLength < 180) {
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
    const normalizeForWordingCompare = (value) => normalize(value).toLowerCase();
    const layer = document.querySelector("#ai-text-layer");
    const texts = Array.from(document.querySelectorAll("#ai-text-layer text"));
    const fitW = Number(layer?.getAttribute("data-fit-width") || 0);
    const fitH = Number(layer?.getAttribute("data-fit-height") || 0);
    const layerBox = layer && "getBBox" in layer ? layer.getBBox() : { x: 0, y: 0, width: 0, height: 0 };
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
    const renderedText = normalize(lines.join(" "));
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
      exactTextMatch: normalizeForWordingCompare(renderedText) === normalizeForWordingCompare(inputText),
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
    if (SEMANTIC_LAYOUT_EXPERIMENT) {
      await page.addInitScript(() => {
        window.localStorage.setItem("instaplaque.semanticLayoutExperiment", "1");
      });
    }
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
    semanticLayoutExperiment: SEMANTIC_LAYOUT_EXPERIMENT,
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
