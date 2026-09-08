import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { createServer } from "vite";
import {
  PLAQUE_TEXT_MODEL,
  LEGACY_PLAQUE_TEXT_MODEL,
} from "../services/aiModels.mjs";
import { validateGeminiGenerateContentRequest } from "../server/geminiProxy.mjs";

const dom = new JSDOM("", { url: "http://localhost" });
for (const name of ["DOMParser", "XMLSerializer", "Node", "window", "document"])
  globalThis[name] = dom.window[name];
const renderer = await createServer({
  server: { middlewareMode: true, hmr: false },
  optimizeDeps: { noDiscovery: true, include: [] },
  appType: "custom",
});
try {
  const { validateAuthoredTypographySvg, generatePlaqueDesign } =
    await renderer.ssrLoadModule("/services/geminiService.ts");
  const { Shape, DesignStyle, TypographyEngine } =
    await renderer.ssrLoadModule("/types.ts");
  const box = { width: 170, height: 105 };
  const source =
    "In loving memory of\nÉlodie O’Neill\n1938–2026\nAlways in our hearts";
  const text = (wording, y, size, weight = 400) =>
    `<text x="0" y="${y}" text-anchor="middle" font-family="Lora" font-size="${size}" font-weight="${weight}" fill="currentColor">${wording}</text>`;
  const wrap = (body, bounds = box) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${bounds.width}" height="${bounds.height}" viewBox="${-bounds.width / 2} ${-bounds.height / 2} ${bounds.width} ${bounds.height}">${body}</svg>`;
  const good = wrap(
    text("In loving memory of", -27, 8) +
      text("Élodie O’Neill", -4, 17, 600) +
      text("1938–2026", 14, 8) +
      text("Always in our hearts", 34, 9),
  );
  assert.ok(validateAuthoredTypographySvg(good, source, box));
  assert.throws(
    () =>
      validateAuthoredTypographySvg(
        good.replace("Élodie", "Elodie"),
        source,
        box,
      ),
    /wording/,
  );
  assert.throws(
    () =>
      validateAuthoredTypographySvg(
        good.replace("1938–2026", "1938–2025"),
        source,
        box,
      ),
    /wording/,
  );
  assert.throws(
    () =>
      validateAuthoredTypographySvg(
        good.replace('y="14"', 'y="0"'),
        source,
        box,
      ),
    /overlap/,
  );
  assert.throws(
    () =>
      validateAuthoredTypographySvg(
        good.replace('font-size="17"', 'font-size="60"'),
        source,
        box,
      ),
    /overflow/,
  );
  assert.throws(
    () =>
      validateAuthoredTypographySvg(
        good.replace("Lora", "Great Vibes"),
        source,
        box,
      ),
    /Script/,
  );
  assert.throws(
    () =>
      validateAuthoredTypographySvg(
        good.replace("</svg>", "<script>alert(1)</script></svg>"),
        source,
        box,
      ),
    /Unsafe/,
  );
  const benchBox = { width: 126, height: 28 };
  const benchText = "In memory of\nPeter John Wilson\n1948–2023";
  const bench = wrap(
    text("In memory of", -7, 5) +
      text("Peter John Wilson", 2, 7, 600) +
      text("1948–2023", 10, 5),
    benchBox,
  );
  assert.ok(validateAuthoredTypographySvg(bench, benchText, benchBox));

  const config = {
    responseMimeType: "application/json",
    responseSchema: {
      type: "OBJECT",
      properties: { svgContent: { type: "STRING" } },
      required: ["svgContent"],
    },
  };
  for (const model of [PLAQUE_TEXT_MODEL, LEGACY_PLAQUE_TEXT_MODEL]) {
    const request = validateGeminiGenerateContentRequest({
      model,
      contents: "Typeset the supplied wording.",
      config,
    });
    assert.equal(request.request.model, PLAQUE_TEXT_MODEL);
  }
  assert.throws(() =>
    validateGeminiGenerateContentRequest({
      model: "arbitrary-model",
      contents: "test",
      config,
    }),
  );

  // Test the complete request/repair path using deliberately wrong first output.
  // These are test fixtures, not a claim about live Gemini output quality.
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    calls.push(JSON.parse(options.body));
    return new Response(
      JSON.stringify({
        text: JSON.stringify({
          reasoning: "Name-led memorial layout.",
          svgContent:
            calls.length === 1 ? good.replace("Élodie", "Elodie") : good,
        }),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };
  try {
    const result = await generatePlaqueDesign(
      source,
      210,
      148,
      Shape.Rect,
      DesignStyle.ClassicalFormal,
      null,
      undefined,
      box,
      { purpose: "memorial", portraitRelationship: "No artwork" },
      TypographyEngine.GeminiAuthored,
    );
    assert.equal(
      calls.length,
      2,
      "An invalid inscription should trigger one repair",
    );
    assert.equal(calls[0].model, PLAQUE_TEXT_MODEL);
    assert.ok(
      calls[0].contents.includes(source),
      "Original Unicode inscription must reach the prompt unchanged",
    );
    assert.ok(calls[1].contents.includes("failed a layout check"));
    assert.ok(result.svgContent.includes("Élodie O’Neill"));
  } finally {
    globalThis.fetch = originalFetch;
  }

  await mkdir("output", { recursive: true });
  await writeFile(
    "output/typography-fixtures.html",
    `<!doctype html><html lang="en"><meta charset="utf-8"><title>Typography verification fixtures</title><style>body{font:16px Arial;background:#f8f6ef;color:#203b32;margin:40px}section{margin:40px 0;max-width:900px}svg{width:100%;height:auto;background:#d7b970;border:16px solid #c4a254;box-sizing:border-box}h1{font-weight:400}p{max-width:700px;line-height:1.6}</style><h1>Typography verification fixtures</h1><p>Known layouts used to test exact wording, bounds and overlap checks. These are test fixtures, not live Gemini generations.</p><section><h2>A5 memorial · accents, names and dates</h2>${good}</section><section><h2>Compact bench · 150 × 50 mm plaque</h2>${bench}</section></html>`,
  );
  console.log(
    "Typography checks passed: wording, dates, Unicode, overlap, overflow, safe SVG, compact bench, model migration and one repair.",
  );
} finally {
  await renderer.close();
  dom.window.close();
}
