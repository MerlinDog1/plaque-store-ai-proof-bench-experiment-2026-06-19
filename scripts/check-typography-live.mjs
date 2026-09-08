import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { GoogleGenAI } from "@google/genai";
import { JSDOM } from "jsdom";
import { createServer } from "vite";
import { validateGeminiGenerateContentRequest } from "../server/geminiProxy.mjs";

if (!process.env.GEMINI_API_KEY && !process.env.API_KEY)
  throw new Error(
    "A local Gemini API key is needed for this live model check.",
  );
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY,
});
const dom = new JSDOM("", { url: "http://localhost" });
for (const name of ["DOMParser", "XMLSerializer", "Node", "window", "document"])
  globalThis[name] = dom.window[name];
const originalFetch = globalThis.fetch;
const renderer = await createServer({
  server: { middlewareMode: true, hmr: false },
  optimizeDeps: { noDiscovery: true, include: [] },
  appType: "custom",
});
try {
  const { generatePlaqueDesign } = await renderer.ssrLoadModule(
    "/services/geminiService.ts",
  );
  const { Shape, DesignStyle, TypographyEngine } =
    await renderer.ssrLoadModule("/types.ts");
  globalThis.fetch = async (url, options) => {
    if (url !== "/api/gemini/generate-content")
      return originalFetch(url, options);
    const { request } = validateGeminiGenerateContentRequest(
      JSON.parse(options.body),
    );
    const response = await ai.models.generateContent(request);
    return new Response(JSON.stringify({ text: response.text }), {
      status: 200,
    });
  };
  const cases = [
    {
      name: "Compact bench dedication",
      w: 150,
      h: 50,
      box: { width: 126, height: 28 },
      text: "In loving memory of\nPeter John Wilson\n1948–2023",
      purpose: "memorial",
    },
    {
      name: "A5 memorial with accents",
      w: 210,
      h: 148,
      box: { width: 170, height: 105 },
      text: "In loving memory of\nÉlodie O’Neill\n1938–2026\nA beloved mother and grandmother\nAlways in our hearts",
      purpose: "memorial",
    },
    {
      name: "Longer building dedication",
      w: 297,
      h: 210,
      box: { width: 250, height: 162 },
      text: "The Willow Garden\nOpened on 8 September 2026\nWith thanks to the volunteers, neighbours and friends whose time and care made this garden possible.\nA place to grow together, share stories and enjoy a quiet moment.\nThe Village Trust",
      purpose: "commemorative",
    },
  ];
  const reports = await Promise.allSettled(
    cases.map(async (item) => {
      const started = Date.now();
      const result = await generatePlaqueDesign(
        item.text,
        item.w,
        item.h,
        Shape.Rect,
        DesignStyle.Auto,
        null,
        undefined,
        item.box,
        { purpose: item.purpose, portraitRelationship: "No artwork." },
        TypographyEngine.GeminiAuthored,
      );
      assert.ok(
        result &&
          !/unavailable|fallback|simple layout was used/i.test(
            result.reasoning,
          ),
        `${item.name}: live AI failed its checks`,
      );
      return {
        ...item,
        ...result,
        seconds: ((Date.now() - started) / 1000).toFixed(1),
      };
    }),
  );
  const escape = (value) =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const results = reports
    .filter((item) => item.status === "fulfilled")
    .map((item) => item.value);
  const fontLinks =
    (await readFile("index.html", "utf8"))
      .match(/<link[^>]*href="https:\/\/fonts.googleapis.com[^>]*>/g)
      ?.join("\n") || "";
  await mkdir("output", { recursive: true });
  await writeFile(
    "output/live-typography-review.html",
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>InstaPlaque — live Gemini 3.8 layouts</title>${fontLinks}<style>body{background:#f8f6ef;color:#203b32;font:15px Arial;margin:40px auto;padding:0 24px;max-width:1100px}h1{font:44px Georgia}section{margin:50px 0}svg{width:100%;height:auto;display:block;color:#1e231c;background:linear-gradient(110deg,#d1b675,#e9d69e,#baa16a);border:14px solid #d1b675;box-sizing:border-box}p{line-height:1.6}pre{white-space:pre-wrap;color:#647062;font:13px Arial}h2{font:24px Georgia}</style><h1>Gemini 3.8 · inscription review</h1><p>Live model outputs using demonstration inscriptions. Each passed exact wording, bounds and overlap checks. Production text remains editable SVG.</p>${results.map((item) => `<section><h2>${escape(item.name)} · ${item.w} × ${item.h} mm</h2><p>${escape(item.reasoning)} (${item.seconds}s)</p><svg xmlns="http://www.w3.org/2000/svg" viewBox="${-item.box.width / 2} ${-item.box.height / 2} ${item.box.width} ${item.box.height}">${item.svgContent}</svg><pre>${escape(item.text)}</pre></section>`).join("")}</html>`,
  );
  for (let index = 0; index < reports.length; index++) {
    const report = reports[index];
    console.log(
      report.status === "fulfilled"
        ? `${cases[index].name}: passed in ${report.value.seconds}s`
        : `${cases[index].name}: FAILED — ${report.reason?.message}`,
    );
  }
  assert.equal(
    results.length,
    cases.length,
    "Some live typography cases failed; inspect output/live-typography-review.html",
  );
} finally {
  globalThis.fetch = originalFetch;
  await renderer.close();
  dom.window.close();
}
