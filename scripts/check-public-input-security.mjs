import assert from "node:assert/strict";
import { createServer } from "node:http";
import { Readable } from "node:stream";
import { chromium } from "@playwright/test";
import {
  MAX_PROOF_SVG_CHARS,
  sanitizeOrderSvgFields,
  sanitizeProofSessionRecord,
  sanitizeProofSessionSvgFields,
  sanitizeSvgMarkup,
} from "../services/svgSanitizer.mjs";
import {
  GeminiProxyRequestError,
  createGeminiRateLimiter,
  formatGeminiProxyError,
  getGeminiClientIdentity,
  hasAllowedGeminiBrowserHeaders,
  isGeminiPublicProxyEnabled,
  validateGeminiGenerateContentRequest,
} from "../server/geminiProxy.mjs";
import {
  prepareOrderProofSvgDocument,
  svgDocumentResponseHeaders,
} from "../server/svgResponse.mjs";

const tinyPng = "iVBORw0KGgo=";
const supportedSafetySettings = [
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
];

const structured = validateGeminiGenerateContentRequest({
  model: "gemini-3.5-flash",
  contents: {
    parts: [
      { text: "Transcribe the attached plaque layout." },
      { inlineData: { mimeType: "image/png", data: tinyPng } },
    ],
  },
  config: {
    systemInstruction: "Return the plaque text as structured SVG.",
    responseMimeType: "application/json",
    responseSchema: {
      type: "OBJECT",
      properties: {
        reasoning: { type: "STRING" },
        svgContent: { type: "STRING", description: "Safe plaque SVG content" },
      },
      required: ["reasoning", "svgContent"],
    },
  },
});

assert.equal(structured.operation, "structured-content");
assert.equal(structured.request.model, "gemini-3.5-flash");
assert.equal(structured.request.config.maxOutputTokens, 8_192);
assert.equal(structured.request.config.httpOptions, undefined, "client HTTP options must not reach the upstream SDK");
assert.deepEqual(structured.request.contents.parts[1], {
  inlineData: { mimeType: "image/png", data: tinyPng },
});

const imageGeneration = validateGeminiGenerateContentRequest({
  model: "gemini-3.1-flash-image-preview",
  contents: { parts: [{ text: "Create etchable plaque artwork." }] },
  config: {
    httpOptions: { timeout: 480_000 },
    responseModalities: ["IMAGE", "TEXT"],
    imageConfig: { imageSize: "4K", aspectRatio: "21:9" },
    safetySettings: supportedSafetySettings,
  },
});
assert.equal(imageGeneration.operation, "image-generation");
assert.equal(imageGeneration.cost, 12);
assert.equal(imageGeneration.request.config.httpOptions, undefined);

for (const [model, contents, expectedCost, extraConfig] of [
  ["gemini-3-pro-image-preview", "Create the supported plaque image.", 6, {}],
  ["gemini-3.1-flash-image-preview", { parts: [{ text: "Create the supported plaque image." }] }, 5, {
    httpOptions: { timeout: 480_000 },
  }],
  ["gemini-2.5-flash-image", { parts: [{ text: "Create the supported plaque image." }] }, 4, {
    httpOptions: { timeout: 480_000 },
    safetySettings: supportedSafetySettings,
  }],
]) {
  const validated = validateGeminiGenerateContentRequest({
    model,
    contents,
    config: {
      ...extraConfig,
      responseModalities: ["IMAGE", "TEXT"],
      imageConfig: { imageSize: "1K", aspectRatio: "1:1" },
    },
  });
  assert.equal(validated.operation, "image-generation");
  assert.equal(validated.request.model, model);
  assert.equal(validated.cost, expectedCost);
}

const promptEnhancement = validateGeminiGenerateContentRequest({
  model: "gemini-3-flash-preview",
  contents: "Improve this short plaque-art prompt.",
  config: {
    safetySettings: supportedSafetySettings,
  },
});
assert.equal(promptEnhancement.operation, "prompt-enhancement");
assert.equal(promptEnhancement.request.config.maxOutputTokens, 1_024);

const rejectedGeminiRequests = [
  {
    model: "gemini-expensive-future-model",
    contents: "Mine tokens",
    config: {},
  },
  {
    model: "gemini-3-pro-image-preview",
    contents: "Request an unsupported Pro resolution",
    config: {
      responseModalities: ["IMAGE", "TEXT"],
      imageConfig: { imageSize: "4K", aspectRatio: "1:1" },
    },
  },
  {
    model: "gemini-3-pro-image-preview",
    contents: {
      parts: [
        { text: "Send references the Pro app flow never uses" },
        { inlineData: { mimeType: "image/png", data: tinyPng } },
        { inlineData: { mimeType: "image/png", data: tinyPng } },
      ],
    },
    config: {
      responseModalities: ["IMAGE", "TEXT"],
      imageConfig: { imageSize: "1K", aspectRatio: "1:1" },
    },
  },
  {
    model: "gemini-2.5-flash-image",
    contents: { parts: [{ text: "Request a UI-disabled size" }] },
    config: {
      httpOptions: { timeout: 480_000 },
      responseModalities: ["IMAGE", "TEXT"],
      imageConfig: { imageSize: "4K", aspectRatio: "1:1" },
      safetySettings: supportedSafetySettings,
    },
  },
  {
    model: "gemini-3.1-flash-image-preview",
    contents: "Override the upstream destination",
    config: {
      httpOptions: { timeout: 480_000, baseUrl: "https://attacker.invalid" },
      responseModalities: ["IMAGE", "TEXT"],
      imageConfig: { imageSize: "4K", aspectRatio: "1:1" },
    },
  },
  {
    model: "gemini-3.5-flash",
    method: "countTokens",
    contents: "Forward another upstream method",
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: { result: { type: "STRING" } },
        required: ["result"],
      },
    },
  },
  {
    model: "gemini-3.5-flash",
    contents: "Use a tool",
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: { result: { type: "STRING" } },
        required: ["result"],
      },
      tools: [{ codeExecution: {} }],
    },
  },
  {
    model: "gemini-3.5-flash",
    contents: "Override the server output ceiling",
    config: {
      maxOutputTokens: 999_999,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: { result: { type: "STRING" } },
        required: ["result"],
      },
    },
  },
  {
    model: "gemini-3.1-flash-image-preview",
    contents: { parts: [{ text: "Fetch this" }, { fileData: { fileUri: "https://attacker.invalid" } }] },
    config: {
      httpOptions: { timeout: 480_000 },
      responseModalities: ["IMAGE", "TEXT"],
      imageConfig: { imageSize: "4K", aspectRatio: "1:1" },
    },
  },
  {
    model: "gemini-3.1-flash-image-preview",
    contents: { parts: [{ text: "Bad data" }, { inlineData: { mimeType: "text/html", data: tinyPng } }] },
    config: {
      httpOptions: { timeout: 480_000 },
      responseModalities: ["IMAGE", "TEXT"],
      imageConfig: { imageSize: "4K", aspectRatio: "1:1" },
    },
  },
  {
    model: "gemini-3.5-flash",
    contents: "Schema escape",
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: { result: { type: "STRING", $ref: "https://attacker.invalid/schema" } },
        required: ["result"],
      },
    },
  },
];

for (const request of rejectedGeminiRequests) {
  assert.throws(
    () => validateGeminiGenerateContentRequest(request),
    /support|field|contents|requires/i,
    "arbitrary Gemini forwarding must be rejected",
  );
}

assert.equal(isGeminiPublicProxyEnabled({ NODE_ENV: "production" }), false);
assert.equal(isGeminiPublicProxyEnabled({ VERCEL: "1" }), false);
assert.equal(
  isGeminiPublicProxyEnabled({ VERCEL: "1", GEMINI_PUBLIC_PROXY_ENABLED: "true" }),
  true,
);
assert.equal(isGeminiPublicProxyEnabled({}), true, "local development remains enabled by default");

const spoofedForwardingRequest = {
  headers: { "x-forwarded-for": "198.51.100.250" },
  socket: { remoteAddress: "127.0.0.1" },
};
assert.equal(
  getGeminiClientIdentity(spoofedForwardingRequest, { vercel: false }),
  "127.0.0.1",
  "non-Vercel identity must ignore spoofable X-Forwarded-For",
);
assert.equal(
  getGeminiClientIdentity(spoofedForwardingRequest, { vercel: true }),
  null,
  "Vercel identity must not fall back to spoofable X-Forwarded-For",
);
assert.equal(
  getGeminiClientIdentity({
    headers: {
      "x-forwarded-for": "198.51.100.250",
      "x-vercel-forwarded-for": "203.0.113.42",
    },
    socket: { remoteAddress: "10.0.0.4" },
  }, { vercel: true }),
  "203.0.113.42",
);

const deployedBrowserRequest = {
  headers: {
    host: "plaques.example",
    origin: "https://plaques.example",
    "sec-fetch-site": "same-origin",
  },
};
assert.equal(hasAllowedGeminiBrowserHeaders(deployedBrowserRequest, { deployed: true }), true);
assert.equal(
  hasAllowedGeminiBrowserHeaders({ headers: { host: "plaques.example" } }, { deployed: true }),
  false,
  "deployed calls require explicit browser origin headers",
);
assert.equal(
  hasAllowedGeminiBrowserHeaders({
    headers: {
      host: "plaques.example",
      origin: "https://plaques.example",
      "sec-fetch-site": "same-site",
    },
  }, { deployed: true }),
  false,
  "same-site is not accepted as same-origin",
);

const providerFailure = formatGeminiProxyError(
  { statusCode: 400, message: "Provider says the secret API key is invalid" },
  "request-test-123",
);
assert.equal(providerFailure.statusCode, 502);
assert.equal(providerFailure.shouldLog, true);
assert.equal(providerFailure.payload.requestId, "request-test-123");
assert.equal(JSON.stringify(providerFailure.payload).includes("secret API key"), false);
const providerPayloadFailure = formatGeminiProxyError(
  { statusCode: 413, message: "Provider rejected the generated payload" },
  "request-test-413",
);
assert.equal(providerPayloadFailure.statusCode, 502);
assert.equal(providerPayloadFailure.shouldLog, true);
assert.equal(providerPayloadFailure.payload.requestId, "request-test-413");
const validationFailure = formatGeminiProxyError(
  new GeminiProxyRequestError("Exact safe validation message.", 422),
  "unused",
);
assert.deepEqual(validationFailure, {
  statusCode: 422,
  payload: { error: "Exact safe validation message." },
  shouldLog: false,
});

const previousVercel = process.env.VERCEL;
const previousProxyEnabled = process.env.GEMINI_PUBLIC_PROXY_ENABLED;
const previousGeminiKey = process.env.GEMINI_API_KEY;
process.env.VERCEL = "1";
delete process.env.GEMINI_PUBLIC_PROXY_ENABLED;
process.env.GEMINI_API_KEY = "route-test-key";
try {
  const { handleRequest } = await import(`../server.mjs?disabled-route-test=${Date.now()}`);
  const disabledRequest = new Readable({
    read() {
      this.push(null);
    },
  });
  Object.assign(disabledRequest, {
    method: "POST",
    url: "/api/gemini/generate-content",
    headers: { host: "plaques.example" },
    socket: { remoteAddress: "127.0.0.1" },
  });
  const disabledResponse = await new Promise((resolve) => {
    const result = { statusCode: 0, headers: {}, body: "" };
    handleRequest(disabledRequest, {
      writeHead(statusCode, headers) {
        result.statusCode = statusCode;
        result.headers = headers;
      },
      end(body = "") {
        result.body = String(body);
        resolve(result);
      },
    });
  });
  assert.equal(disabledResponse.statusCode, 503);
  assert.match(disabledResponse.body, /Public Gemini generation is disabled/u);

  process.env.GEMINI_PUBLIC_PROXY_ENABLED = "true";
  const { handleRequest: handleEnabledRequest } = await import(`../server.mjs?spoofed-xff-route-test=${Date.now()}`);
  const spoofedRequest = new Readable({
    read() {
      this.push(null);
    },
  });
  Object.assign(spoofedRequest, {
    method: "POST",
    url: "/api/gemini/generate-content",
    headers: {
      host: "plaques.example",
      origin: "https://plaques.example",
      "sec-fetch-site": "same-origin",
      "x-forwarded-for": "198.51.100.250",
    },
    socket: { remoteAddress: "10.0.0.4" },
  });
  const spoofedResponse = await new Promise((resolve) => {
    const result = { statusCode: 0, body: "" };
    handleEnabledRequest(spoofedRequest, {
      writeHead(statusCode) {
        result.statusCode = statusCode;
      },
      end(body = "") {
        result.body = String(body);
        resolve(result);
      },
    });
  });
  assert.equal(spoofedResponse.statusCode, 403);
  assert.match(spoofedResponse.body, /trusted client identity/u);
} finally {
  if (previousVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = previousVercel;
  if (previousProxyEnabled === undefined) delete process.env.GEMINI_PUBLIC_PROXY_ENABLED;
  else process.env.GEMINI_PUBLIC_PROXY_ENABLED = previousProxyEnabled;
  if (previousGeminiKey === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = previousGeminiKey;
}

let now = 1_000;
const limiter = createGeminiRateLimiter({ limit: 6, windowMs: 60_000, now: () => now });
assert.equal(limiter.consume("203.0.113.10", 5).ok, true);
const blocked = limiter.consume("203.0.113.10", 5);
assert.equal(blocked.ok, false);
assert.equal(blocked.retryAfter, 60);
assert.equal(limiter.consume("203.0.113.11", 5).ok, true, "rate limits must be isolated by client key");
now += 60_000;
assert.equal(limiter.consume("203.0.113.10", 5).ok, true, "expired windows must reset without timers");

const confirmedImageOnerrorPayload = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 30">
    <foreignObject width="100" height="30">
      <img xmlns="http://www.w3.org/1999/xhtml" src="x" onerror="globalThis.__svgXss = true" />
    </foreignObject>
    <image href="x" onerror="globalThis.__svgXss = true" />
    <script>globalThis.__svgXss = true</script>
    <style>@import url(https://attacker.invalid/steal.css);</style>
    <use href="javascript:alert(1)" />
    <use xlink:href="data:image/svg+xml;base64,PHN2Zy8+" />
    <path d="M0 0 L10 10" fill="url(https://attacker.invalid/pixel)" oNlOaD="alert(2)" />
  </svg>
`;
const cleanedAttack = sanitizeSvgMarkup(confirmedImageOnerrorPayload);
assert.ok(cleanedAttack?.startsWith("<svg"));
for (const dangerousToken of [
  "foreignObject",
  "<img",
  "<image",
  "onerror",
  "onload",
  "<script",
  "<style",
  "javascript:",
  "data:image",
  "attacker.invalid",
  "__svgXss",
]) {
  assert.equal(cleanedAttack.toLowerCase().includes(dangerousToken.toLowerCase()), false, `${dangerousToken} must be removed`);
}

const cssEscapePayload = String.raw`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
    <path id="escaped-paint" d="M0 0 L20 20" fill="u\72l(\68 ttps\3a \2f \2f attacker.invalid/x)" />
  </svg>
`;
const cleanedCssEscape = sanitizeSvgMarkup(cssEscapePayload);
assert.equal(cleanedCssEscape.includes("attacker.invalid"), false);
assert.equal(cleanedCssEscape.includes("\\72"), false);
assert.equal(/<path[^>]+fill=/u.test(cleanedCssEscape), false, "escaped URL paint must be removed as a whole");
for (const unsafePaint of [
  "url/**/(#metal)",
  " url(#metal)",
  "url(#metal) #fff",
  "url(#metal)\u0001",
]) {
  const cleaned = sanitizeSvgMarkup(`<svg><path id="strict-paint" fill="${unsafePaint}" d="M0 0L1 1"/></svg>`);
  assert.equal(/<path[^>]+fill=/u.test(cleaned), false, `paint value must be a strict full match: ${JSON.stringify(unsafePaint)}`);
}
for (const unsafeResource of ["url/**/(#safe-area)", " url(#safe-area)", "url(#safe-area) none"]) {
  const cleaned = sanitizeSvgMarkup(`<svg><g id="strict-resource" clip-path="${unsafeResource}"></g></svg>`);
  assert.equal(cleaned.includes("clip-path="), false, `resource reference must be a strict full match: ${unsafeResource}`);
}

const validPlaqueSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="-150 -100 300 200" role="img" aria-label="Plaque proof">
    <defs>
      <linearGradient id="metal" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#8f641f" />
        <stop offset="100%" stop-color="#e4c16f" />
      </linearGradient>
      <clipPath id="safe-area"><rect x="-130" y="-80" width="260" height="160" rx="8" /></clipPath>
      <path id="flourish" d="M-8 0 Q0 -5 8 0" />
    </defs>
    <g clip-path="url(#safe-area)" transform="translate(0 2)" fill="currentColor">
      <rect x="-145" y="-95" width="290" height="190" rx="8" fill="url(#metal)" />
      <text x="0" y="-8" text-anchor="middle" font-family="Georgia" font-size="24" font-weight="700">
        ARTHUR <tspan x="0" dy="28" letter-spacing="0.08em">1938 – 2026</tspan>
      </text>
      <use href="#flourish" transform="translate(0 46)" />
    </g>
  </svg>
`;
const cleanedValid = sanitizeSvgMarkup(validPlaqueSvg);
for (const preservedToken of [
  'viewBox="-150 -100 300 200"',
  "<linearGradient",
  "<clipPath",
  'fill="url(#metal)"',
  "<text",
  "<tspan",
  "ARTHUR",
  'href="#flourish"',
]) {
  assert.ok(cleanedValid?.includes(preservedToken), `valid plaque SVG must preserve ${preservedToken}`);
}

const ingested = sanitizeProofSessionSvgFields({
  generatedSvg: confirmedImageOnerrorPayload,
  plaqueState: {
    generatedSvgContent: confirmedImageOnerrorPayload,
    memorialImageSvg: `<svg viewBox="0 0 10 10"><path d="M0 0 L10 10"/><image href="x" onerror="alert(1)"/></svg>`,
    width: 300,
  },
});
assert.equal(ingested.plaqueState.width, 300);
assert.equal(ingested.generatedSvg.includes("onerror"), false);
assert.equal(ingested.plaqueState.generatedSvgContent.includes("onerror"), false);
assert.equal(ingested.plaqueState.memorialImageSvg.includes("onerror"), false);
assert.ok(ingested.plaqueState.memorialImageSvg.includes("<path"), "valid memorial path must survive ingestion");
const legacyProofSession = sanitizeProofSessionRecord({
  generated_svg: confirmedImageOnerrorPayload,
  plaque_state: { generatedSvgContent: confirmedImageOnerrorPayload },
});
assert.equal(/onerror|<script|foreignObject/iu.test(legacyProofSession.generated_svg), false);
assert.equal(/onerror|<script|foreignObject/iu.test(legacyProofSession.plaque_state.generatedSvgContent), false);
assert.equal(sanitizeSvgMarkup("x".repeat(MAX_PROOF_SVG_CHARS + 1)), "");

const storedOrder = sanitizeOrderSvgFields({
  id: "security-order",
  proofPackage: {
    productionSvg: confirmedImageOnerrorPayload,
    visualProofSvg: `${validPlaqueSvg}<script>globalThis.__orderSvgXss = true</script>`,
  },
  plaqueState: {
    generatedSvgContent: confirmedImageOnerrorPayload,
    memorialImageSvg: confirmedImageOnerrorPayload,
  },
  metadata: {
    mockOrder: {
      proofPackage: { visualProofSvg: confirmedImageOnerrorPayload },
    },
  },
});
for (const svg of [
  storedOrder.proofPackage.productionSvg,
  storedOrder.proofPackage.visualProofSvg,
  storedOrder.plaqueState.generatedSvgContent,
  storedOrder.plaqueState.memorialImageSvg,
  storedOrder.metadata.mockOrder.proofPackage.visualProofSvg,
]) {
  assert.equal(/onerror|<script|foreignObject|javascript:/iu.test(svg), false, "all order SVG storage paths must be sanitized");
}
assert.ok(storedOrder.proofPackage.visualProofSvg.includes("ARTHUR"));
const externalSnakeCaseOrder = sanitizeOrderSvgFields({
  proof_package: {
    production_svg: confirmedImageOnerrorPayload,
    visual_proof_svg: confirmedImageOnerrorPayload,
  },
  plaque_state: { generated_svg_content: confirmedImageOnerrorPayload },
});
assert.equal(/onerror|<script|foreignObject/iu.test(externalSnakeCaseOrder.proof_package.production_svg), false);
assert.equal(/onerror|<script|foreignObject/iu.test(externalSnakeCaseOrder.proof_package.visual_proof_svg), false);
assert.equal(/onerror|<script|foreignObject/iu.test(externalSnakeCaseOrder.plaque_state.generated_svg_content), false);

const legacyRouteSvg = prepareOrderProofSvgDocument({
  id: "legacy-order",
  proofPackage: { visualProofSvg: confirmedImageOnerrorPayload },
});
assert.ok(legacyRouteSvg?.startsWith("<svg"));
assert.equal(/onerror|<script|foreignObject|attacker\.invalid/iu.test(legacyRouteSvg), false);
const svgHeaders = svgDocumentResponseHeaders('proof"\r\nX-Evil: yes.svg');
assert.match(svgHeaders["Content-Security-Policy"], /sandbox; default-src 'none'/u);
assert.equal(svgHeaders["X-Content-Type-Options"], "nosniff");
assert.equal(svgHeaders["Content-Disposition"].includes("\r"), false);
assert.equal(svgHeaders["Content-Disposition"].includes("\n"), false);

let adminApiRequests = 0;
const svgRouteProbeServer = createServer((request, response) => {
  if (request.url === "/api/admin/orders") {
    adminApiRequests += 1;
    response.writeHead(204);
    response.end();
    return;
  }
  response.writeHead(200, svgDocumentResponseHeaders("csp-probe.svg"));
  response.end(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">
      <script>fetch('/api/admin/orders')</script>
      <rect width="10" height="10" fill="#000" />
    </svg>
  `);
});
await new Promise((resolve) => svgRouteProbeServer.listen(0, "127.0.0.1", resolve));
const svgRouteAddress = svgRouteProbeServer.address();
assert.ok(svgRouteAddress && typeof svgRouteAddress === "object");

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const escapedUrlRequests = [];
  page.on("request", (request) => {
    if (request.url().includes("attacker.invalid")) escapedUrlRequests.push(request.url());
  });
  await page.setContent(cleanedCssEscape);
  await page.waitForTimeout(100);
  assert.deepEqual(escapedUrlRequests, [], "escaped CSS URLs must not trigger any browser request");

  await page.setContent(cleanedAttack);
  await page.waitForTimeout(100);
  assert.notEqual(
    await page.evaluate(() => globalThis.__svgXss),
    true,
    "the confirmed image-onerror payload must not execute after browser injection",
  );

  await page.setContent(cleanedValid);
  assert.equal(await page.locator("linearGradient").count(), 1);
  assert.equal(await page.locator("clipPath").count(), 1);
  assert.equal(await page.locator("text").textContent(), "\n        ARTHUR 1938 – 2026\n      ");

  await page.goto(`http://127.0.0.1:${svgRouteAddress.port}/proof.svg`);
  await page.waitForTimeout(100);
  assert.equal(adminApiRequests, 0, "sandboxed SVG documents must not call same-origin admin APIs");
} finally {
  await browser.close();
  await new Promise((resolve, reject) => svgRouteProbeServer.close((error) => error ? reject(error) : resolve()));
}

console.log("Public Gemini input controls and proof SVG sanitization checks passed.");
