import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");
const port = Number(process.env.PORT || 4182);
const host = process.env.HOST || "127.0.0.1";
const maxBodyBytes = 24 * 1024 * 1024;

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [rawKey, ...rawValue] = trimmed.split("=");
    const key = rawKey.trim();
    const value = rawValue.join("=").trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
};

loadEnvFile(path.join(__dirname, ".env.local"));
loadEnvFile(path.join(__dirname, ".env"));
loadEnvFile(path.join(__dirname, "..", ".env.local"));
loadEnvFile(path.join(__dirname, "..", ".env"));

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY || "";
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

const sendJson = (res, status, payload) => {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > maxBodyBytes) {
        reject(new Error("Upload is too large. Try a smaller source image."));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });

const parseDataUrl = (dataUrl) => {
  const match = /^data:([^;,]+);base64,(.+)$/s.exec(dataUrl || "");
  if (!match) throw new Error("Upload must be a base64 image data URL.");
  return { mimeType: match[1], data: match[2] };
};

const getOutputSpec = (aspectRatio) => {
  if (aspectRatio === "1:1") {
    return {
      aspectRatio: "1:1",
      label: "1:1 square",
      dimensions: "4096 x 4096",
    };
  }
  return {
    aspectRatio: "16:9",
    label: "16:9 wide",
    dimensions: "3840 x 2160",
  };
};

const extractImage = (response) => {
  const parts = response?.candidates?.[0]?.content?.parts || [];
  const image = parts.find((part) => part.inlineData?.data);
  if (!image?.inlineData?.data) {
    const text = parts.map((part) => part.text).filter(Boolean).join("\n").trim();
    throw new Error(text || "Gemini did not return an image.");
  }
  return {
    data: image.inlineData.data,
    mimeType: image.inlineData.mimeType || "image/png",
    text: parts.map((part) => part.text).filter(Boolean).join("\n").trim(),
  };
};

const serveStatic = (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const decodedPath = decodeURIComponent(url.pathname);
  const safePath = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, "");
  let filePath = path.join(publicDir, safePath);

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }
  if (!fs.existsSync(filePath)) {
    filePath = path.join(publicDir, "index.html");
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    "Content-Type": mimeTypes[ext] || "application/octet-stream",
    "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
  });
  fs.createReadStream(filePath).pipe(res);
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true, hasKey: Boolean(apiKey) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/expand") {
    if (!ai) {
      sendJson(res, 501, { error: "GEMINI_API_KEY is not configured." });
      return;
    }

    try {
      const payload = JSON.parse(await readBody(req));
      const source = parseDataUrl(payload.imageDataUrl);
      const spec = getOutputSpec(payload.aspectRatio);

      const prompt = [
        `Use the uploaded brass photograph as the source material and expand it into a ${spec.label} premium brass texture at ${spec.dimensions}.`,
        "This is for an ecommerce plaque material swatch: make it photorealistic, crisp, close-up, and usable as a clean material texture.",
        "Preserve the source brass character, colour family, brushing, patina, tarnish, oxidation, scratches, grain, and uneven natural wear.",
        "Extend the material beyond the uploaded crop naturally. Do not add plaque shapes, screws, engraving, text, logos, frames, borders, hands, tools, background objects, or watermarks.",
        "Avoid painterly, plastic, blurry, smeared, synthetic, low-resolution, or obviously AI-generated texture artifacts.",
      ].join(" ");

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { mimeType: source.mimeType, data: source.data } },
          ],
        },
        config: {
          responseModalities: ["IMAGE", "TEXT"],
          imageConfig: { aspectRatio: spec.aspectRatio, imageSize: "4K" },
        },
      });

      const image = extractImage(response);
      sendJson(res, 200, {
        ok: true,
        aspectRatio: spec.aspectRatio,
        dimensions: spec.dimensions,
        imageDataUrl: `data:${image.mimeType};base64,${image.data}`,
        note: image.text,
      });
    } catch (error) {
      sendJson(res, 500, { error: error instanceof Error ? error.message : "Texture expansion failed." });
    }
    return;
  }

  if (req.method === "GET" || req.method === "HEAD") {
    serveStatic(req, res);
    return;
  }

  sendJson(res, 405, { error: "Method not allowed." });
});

server.listen(port, host, () => {
  console.log(`Brass texture expander listening on http://${host}:${port}; Gemini key configured: ${Boolean(apiKey)}`);
});
