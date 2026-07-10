import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";
import {
  GeminiProxyRequestError,
  MAX_GEMINI_REQUEST_BYTES,
  createGeminiRateLimiter,
  formatGeminiProxyError,
  getGeminiClientIdentity,
  hasAllowedGeminiBrowserHeaders,
  isDeployedGeminiEnvironment,
  isGeminiPublicProxyEnabled,
  parseGeminiRequestJson,
  validateGeminiGenerateContentRequest,
} from "./server/geminiProxy.mjs";
import {
  prepareOrderProofSvgDocument,
  svgDocumentResponseHeaders,
} from "./server/svgResponse.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "dist");
const port = Number(process.env.PORT || 4179);
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

const {
  createProofSession,
  getProofSessionByToken,
  getSupabaseConfig,
} = await import("./server/supabase.mjs");
const {
  createMockHubOrder,
  listMockHubOrders,
} = await import("./server/mockHub.mjs");
const {
  createStripeCheckoutSession,
  getStripeConfig,
  parseStripeWebhook,
  retrieveStripeCheckoutSession,
} = await import("./server/stripe.mjs");
const {
  attachStripeSessionToOrder,
  attachVisualProofToOrder,
  createExternalOrder,
  createPendingOrder,
  getOrderById,
  listOrders,
  markOrderPaidFromSession,
  processReviewFollowUps,
  sendAndRecordOrderEmail,
  shouldSendCustomerProofEmail,
  updateOrderStatus,
} = await import("./server/orders.mjs");
const {
  getEmailConfig,
  getInternalProductionEmails,
} = await import("./server/email.mjs");
const {
  createAdminSession,
  getAdminAuthFailure,
  getAdminAuthConfig,
  getAdminSessionCookieName,
  isAdminRequest,
} = await import("./server/adminAuth.mjs");
const { createAdminLoginRateLimiter } = await import("./server/adminRateLimit.mjs");
const { getStorefrontAuth } = await import("./server/storefrontAuth.mjs");

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY || "";
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
const deployedGeminiEnvironment = isDeployedGeminiEnvironment(process.env);
const geminiPublicProxyEnabled = isGeminiPublicProxyEnabled(process.env);
const geminiRateLimiter = createGeminiRateLimiter({
  limit: process.env.GEMINI_RATE_LIMIT_UNITS_PER_MINUTE || 20,
  windowMs: 60 * 1000,
});

const escapeXml = (value = "") => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

const proofMaterialFill = (material = "") => ({
  "brushed-brass": "url(#brushedBrassFallback)",
  "polished-brass": "url(#polishedBrassFallback)",
  "orbital-brass-matt-lacquer": "url(#orbitalBrassFallback)",
  "aged-brass": "url(#agedBrassFallback)",
  "brushed-steel": "url(#brushedSteelFallback)",
  "brushed-stainless": "url(#brushedSteelFallback)",
  "polished-steel": "url(#polishedSteelFallback)",
  "polished-stainless": "url(#polishedSteelFallback)",
})[material] || "url(#brushedBrassFallback)";

const proofTextFill = (state = {}) => ({
  black: "#111111",
  grey: "#555555",
  white: "#ffffff",
  cream: "#fff1c7",
}[state.textColor] || "#111111");

const wrapProofSvg = (order, body) => {
  const state = order?.plaqueState || {};
  const width = Number(state.width || 300);
  const height = Number(state.height || 200);
  const woodExtra = state.wood ? 25 : 0;
  const totalW = width + woodExtra;
  const totalH = height + woodExtra;
  const offset = woodExtra / 2;
  const textFill = proofTextFill(state);
  const materialFill = proofMaterialFill(state.material);
  const lines = String(order?.inscription || "Approved plaque proof").split(/\r?\n/).filter(Boolean).slice(0, 8);
  const fontSize = lines.length > 5 ? 8.5 : lines.length > 3 ? 10.5 : 14;
  const content = lines.map((line, index) => {
    const y = (index - (lines.length - 1) / 2) * (fontSize * 1.75);
    const isTitle = index === 1 || (lines.length <= 2 && index === 0);
    return `<text x="0" y="${y.toFixed(2)}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${isTitle ? fontSize * 1.35 : fontSize}" font-weight="${isTitle ? "700" : "500"}" letter-spacing="${isTitle ? ".03em" : ".06em"}">${escapeXml(line)}</text>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" width="${totalW}" height="${totalH}" role="img" aria-label="Approved plaque proof">
    <defs>
      <linearGradient id="brushedSteelFallback" x1="0" y1="0" x2="1" y2=".08"><stop offset="0%" stop-color="#7a858b"/><stop offset="26%" stop-color="#b6c0c5"/><stop offset="52%" stop-color="#e3e8ea"/><stop offset="76%" stop-color="#98a4aa"/><stop offset="100%" stop-color="#67727a"/></linearGradient>
      <linearGradient id="polishedSteelFallback" x1="0" y1="0" x2="1" y2=".18"><stop offset="0%" stop-color="#4e5860"/><stop offset="22%" stop-color="#eef3f4"/><stop offset="42%" stop-color="#8d989f"/><stop offset="70%" stop-color="#ffffff"/><stop offset="100%" stop-color="#68727a"/></linearGradient>
      <linearGradient id="brushedBrassFallback" x1="0" y1="0" x2="1" y2=".08"><stop offset="0%" stop-color="#8f641f"/><stop offset="30%" stop-color="#c99745"/><stop offset="58%" stop-color="#e4c16f"/><stop offset="100%" stop-color="#875c1c"/></linearGradient>
      <linearGradient id="polishedBrassFallback" x1="0" y1="0" x2="1" y2=".18"><stop offset="0%" stop-color="#784808"/><stop offset="20%" stop-color="#f5c84b"/><stop offset="44%" stop-color="#fff2a8"/><stop offset="66%" stop-color="#b66c0c"/><stop offset="100%" stop-color="#efbd37"/></linearGradient>
      <radialGradient id="orbitalBrassFallback" cx="40%" cy="34%" r="82%"><stop offset="0%" stop-color="#ead89b"/><stop offset="36%" stop-color="#c2a463"/><stop offset="64%" stop-color="#8f7641"/><stop offset="100%" stop-color="#d4bd7a"/></radialGradient>
      <linearGradient id="agedBrassFallback" x1="0" y1="0" x2="1" y2=".16"><stop offset="0%" stop-color="#46321c"/><stop offset="32%" stop-color="#907238"/><stop offset="58%" stop-color="#c0a45a"/><stop offset="100%" stop-color="#5f4725"/></linearGradient>
      <linearGradient id="woodFallback" x1="0" y1="0" x2="1" y2=".2"><stop offset="0%" stop-color="#4a2b17"/><stop offset="35%" stop-color="#7b4a28"/><stop offset="70%" stop-color="#3a2112"/><stop offset="100%" stop-color="#8a5934"/></linearGradient>
    </defs>
    ${state.wood ? `<rect width="${totalW}" height="${totalH}" rx="12" fill="url(#woodFallback)"/><rect x="4" y="4" width="${totalW - 8}" height="${totalH - 8}" rx="10" fill="none" stroke="#2b170d" stroke-opacity=".45"/>` : ""}
    <rect x="${offset}" y="${offset}" width="${width}" height="${height}" rx="8" fill="${materialFill}"/>
    <rect x="${offset + 8}" y="${offset + 8}" width="${width - 16}" height="${height - 16}" rx="6" fill="none" stroke="${textFill}" stroke-opacity=".68"/>
    <g transform="translate(${offset + width / 2} ${offset + height / 2})" fill="${textFill}" color="${textFill}">${content}</g>
  </svg>`;
};

const prepareStoredProofSvgForRaster = (order) => {
  const prepared = prepareOrderProofSvgDocument(order, wrapProofSvg) || wrapProofSvg(order, "");
  return prepared.replace(/\s(?:href|xlink:href)=["']\/([^"']+)["']/g, (match, assetPath) => {
    const localPath = path.join(distDir, assetPath);
    if (!fs.existsSync(localPath)) return match;
    const attr = match.trim().startsWith("xlink:href") ? "xlink:href" : "href";
    return ` ${attr}="file://${localPath}"`;
  });
};

const svgToPngBuffer = async (svg) => {
  try {
    const { Resvg } = await import("@resvg/resvg-js");
    return Buffer.from(new Resvg(svg, {
      fitTo: { mode: "width", value: 1200 },
      font: { loadSystemFonts: true },
    }).render().asPng());
  } catch (resvgError) {
    return new Promise((resolve, reject) => {
      const child = spawn("rsvg-convert", ["--format", "png", "--width", "1200"]);
      const chunks = [];
      const errors = [];
      child.stdout.on("data", (chunk) => chunks.push(chunk));
      child.stderr.on("data", (chunk) => errors.push(chunk));
      child.on("error", () => reject(resvgError));
      child.on("close", (code) => {
        if (code === 0) {
          resolve(Buffer.concat(chunks));
          return;
        }
        reject(new Error(Buffer.concat(errors).toString("utf8") || `rsvg-convert exited ${code}`));
      });
      child.stdin.end(svg);
    });
  }
};

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
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

const sendJsonWithHeaders = (res, status, payload, headers = {}) => {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers,
  });
  res.end(JSON.stringify(payload));
};

const requireAdminRequest = (req, res) => {
  if (isAdminRequest(req)) return true;
  const failure = getAdminAuthFailure();
  sendJson(res, failure.statusCode, {
    ok: false,
    code: failure.code,
    error: failure.error,
  });
  return false;
};

const adminLoginRateLimiter = createAdminLoginRateLimiter();

const isLocalHost = (hostValue = "") => /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(String(hostValue));

const adminSessionCookie = (req, token, expiresAt) => {
  const secure = isLocalHost(req.headers.host) ? "" : "; Secure";
  return `${getAdminSessionCookieName()}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict${secure}; Expires=${new Date(expiresAt).toUTCString()}`;
};

const clearAdminSessionCookie = (req) => {
  const secure = isLocalHost(req.headers.host) ? "" : "; Secure";
  return `${getAdminSessionCookieName()}=; Path=/; HttpOnly; SameSite=Strict${secure}; Max-Age=0`;
};

const orderSessionMatches = (order, sessionId) =>
  Boolean(order?.stripeCheckoutSessionId && sessionId && order.stripeCheckoutSessionId === sessionId);

const stripHeavyProofPayload = (order) => {
  if (!order?.proofPackage?.visualProofPng) return order;
  return {
    ...order,
    proofPackage: {
      ...order.proofPackage,
      visualProofPng: "stored",
    },
  };
};

const stripHeavyProofPayloads = (orders) => orders.map(stripHeavyProofPayload);

const bodyTooLargeError = (limit) => {
  const error = new Error(`Request body exceeds the ${limit}-byte limit.`);
  error.statusCode = 413;
  return error;
};

const readBody = (req, limit = maxBodyBytes) =>
  new Promise((resolve, reject) => {
    let body = "";
    let bodyBytes = 0;
    let tooLarge = false;
    const declaredLength = Number(req.headers["content-length"] || 0);
    if (Number.isFinite(declaredLength) && declaredLength > limit) {
      req.resume?.();
      reject(bodyTooLargeError(limit));
      return;
    }
    req.on("data", (chunk) => {
      if (tooLarge) return;
      bodyBytes += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk);
      if (bodyBytes > limit) {
        tooLarge = true;
        body = "";
        return;
      }
      body += chunk;
    });
    req.on("end", () => {
      if (tooLarge) reject(bodyTooLargeError(limit));
      else resolve(body);
    });
    req.on("error", reject);
  });

const addResponseText = (response) => {
  const text = response?.text || response?.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean).join("\n") || "";
  return { ...response, text };
};

const serveStatic = (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const decodedPath = decodeURIComponent(url.pathname);
  const safePath = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, "");
  let filePath = path.join(distDir, safePath);

  if (!filePath.startsWith(distDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }
  if (!fs.existsSync(filePath)) {
    filePath = path.join(distDir, "index.html");
  }

  const ext = path.extname(filePath).toLowerCase();
  const isAdminPage = url.pathname === "/admin";
  res.writeHead(200, {
    "Content-Type": mimeTypes[ext] || "application/octet-stream",
    "Cache-Control": ext === ".html" ? (isAdminPage ? "no-store" : "no-cache") : "public, max-age=31536000, immutable",
    ...(ext === ".svg" ? svgDocumentResponseHeaders(path.basename(filePath)) : {}),
    ...(isAdminPage ? { "X-Robots-Tag": "noindex, nofollow" } : {}),
  });
  fs.createReadStream(filePath).pipe(res);
};

export const handleRequest = async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET" && url.pathname === "/api/gemini/health") {
    sendJson(res, 200, { ok: true, enabled: geminiPublicProxyEnabled, hasKey: Boolean(apiKey) });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/supabase/health") {
    const config = getSupabaseConfig();
    sendJson(res, 200, { ok: true, ...config });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/stripe/config") {
    sendJson(res, 200, { ok: true, ...getStripeConfig() });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/email/config") {
    sendJson(res, 200, { ok: true, ...getEmailConfig() });
    return;
  }

  if (req.method === "GET" && url.pathname.match(/^\/api\/orders\/[^/]+\/proof-image\.png$/)) {
    try {
      const orderId = decodeURIComponent(url.pathname.match(/^\/api\/orders\/([^/]+)\/proof-image\.png$/)?.[1] || "");
      const order = await getOrderById(orderId);
      if (!isAdminRequest(req) && !orderSessionMatches(order, url.searchParams.get("session_id"))) {
        res.writeHead(401, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
        res.end("Order access required");
        return;
      }
      const image = String(order?.proofPackage?.visualProofPng || "").replace(/^data:image\/png;base64,/, "");
      if (!order || !image) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
        res.end("Proof image not found");
        return;
      }
      res.writeHead(200, {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      });
      res.end(Buffer.from(image, "base64"));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load proof image.";
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
      res.end(message);
    }
    return;
  }

  if (req.method === "GET" && url.pathname.match(/^\/api\/orders\/[^/]+\/proof-image\.svg$/)) {
    try {
      const orderId = decodeURIComponent(url.pathname.match(/^\/api\/orders\/([^/]+)\/proof-image\.svg$/)?.[1] || "");
      const order = await getOrderById(orderId);
      if (!isAdminRequest(req) && !orderSessionMatches(order, url.searchParams.get("session_id"))) {
        res.writeHead(401, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
        res.end("Order access required");
        return;
      }
      const svg = order ? prepareOrderProofSvgDocument(order, wrapProofSvg) : null;
      if (!order || !svg) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
        res.end("Proof image not found");
        return;
      }
      res.writeHead(200, {
        ...svgDocumentResponseHeaders(`${orderId}-approved-proof.svg`),
        "Cache-Control": "public, max-age=86400",
      });
      res.end(svg);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load proof image.";
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
      res.end(message);
    }
    return;
  }

  if (req.method === "POST" && url.pathname.match(/^\/api\/orders\/[^/]+\/proof-image$/)) {
    try {
      const orderId = decodeURIComponent(url.pathname.match(/^\/api\/orders\/([^/]+)\/proof-image$/)?.[1] || "");
      const payload = JSON.parse(await readBody(req));
      const existingOrder = await getOrderById(orderId);
      if (!orderSessionMatches(existingOrder, payload.stripeCheckoutSessionId)) {
        sendJson(res, 401, { error: "Order access required." });
        return;
      }
      const attachment = await attachVisualProofToOrder(orderId, payload);
      let order = attachment.order;
      if (attachment.attached) {
        const customerProofAlreadySent = (order.emailEvents || []).some(
          (event) => event.type === "customer-proof-copy" && event.recipient === order.customerEmail,
        );
        if (shouldSendCustomerProofEmail(attachment) && !customerProofAlreadySent) {
          order = await sendAndRecordOrderEmail(order, "customer-proof-copy", order.customerEmail);
        }
        if (order.proofPackage?.productionArtworkPdf) {
          for (const internalEmail of getInternalProductionEmails()) {
            const alreadySent = (order.emailEvents || []).some(
              (event) => event.type === "admin-new-paid-order" && event.recipient === internalEmail,
            );
            if (!alreadySent) {
              order = await sendAndRecordOrderEmail(order, "admin-new-paid-order", internalEmail);
            }
          }
        }
      }
      sendJson(res, 200, { ok: true, attached: attachment.attached, order: stripHeavyProofPayload(order) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not attach proof image.";
      sendJson(res, 400, { error: message });
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/admin/auth-config") {
    sendJson(res, 200, { ok: true, ...getAdminAuthConfig() });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/admin/session") {
    const limit = adminLoginRateLimiter.check(req);
    if (!limit.ok) {
      sendJsonWithHeaders(res, 429, { error: "Too many admin login attempts. Try again shortly." }, { "Retry-After": String(limit.retryAfter) });
      return;
    }
    try {
      const payload = JSON.parse(await readBody(req));
      const session = createAdminSession(payload.password || payload.token);
      adminLoginRateLimiter.clear(req);
      sendJsonWithHeaders(res, 200, { ok: true, expiresAt: session.expiresAt }, {
        "Set-Cookie": adminSessionCookie(req, session.token, session.expiresAt),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not create admin session.";
      sendJson(res, error.statusCode || 401, { error: message, ...(error.code ? { code: error.code } : {}) });
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/admin/session") {
    const authenticated = isAdminRequest(req);
    if (authenticated) {
      sendJson(res, 200, { ok: true, authenticated: true });
    } else {
      const failure = getAdminAuthFailure();
      sendJson(res, failure.statusCode, {
        ok: false,
        authenticated: false,
        code: failure.code,
        error: failure.error,
      });
    }
    return;
  }

  if (req.method === "DELETE" && url.pathname === "/api/admin/session") {
    sendJsonWithHeaders(res, 200, { ok: true }, {
      "Set-Cookie": clearAdminSessionCookie(req),
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/stripe/checkout-session") {
    try {
      const payload = JSON.parse(await readBody(req));
      const pendingOrder = await createPendingOrder(payload);
      const session = await createStripeCheckoutSession(payload);
      const order = await attachStripeSessionToOrder(pendingOrder.id, session.raw || session);
      sendJson(res, 201, { ok: true, session, order: stripHeavyProofPayload(order) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not create Stripe checkout session.";
      sendJson(res, 500, { error: message });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/stripe/webhook") {
    try {
      const rawBody = await readBody(req);
      const event = parseStripeWebhook(rawBody, req.headers["stripe-signature"]);
      if (event.type === "checkout.session.completed") {
        await markOrderPaidFromSession(event.data.object);
      }
      sendJson(res, 200, { ok: true, received: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Stripe webhook failed.";
      sendJson(res, error.statusCode || 400, { error: message, ...(error.code ? { code: error.code } : {}) });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/webhooks/stripe") {
    try {
      const rawBody = await readBody(req);
      const event = parseStripeWebhook(rawBody, req.headers["stripe-signature"]);
      if (event.type === "checkout.session.completed") {
        await markOrderPaidFromSession(event.data.object);
      }
      sendJson(res, 200, { ok: true, received: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Stripe webhook failed.";
      sendJson(res, error.statusCode || 400, { error: message, ...(error.code ? { code: error.code } : {}) });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/storefront/orders") {
    const auth = getStorefrontAuth(req);
    if (!auth.ok) {
      sendJson(res, auth.statusCode, { ok: false, code: auth.code, error: auth.error });
      return;
    }
    try {
      const payload = JSON.parse(await readBody(req));
      const order = await createExternalOrder({
        ...payload,
        source: auth.source || payload.source || req.headers["x-storefront-source"],
      });
      sendJson(res, 201, { ok: true, order });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not ingest storefront order.";
      sendJson(res, 500, { error: message });
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/admin/orders") {
    if (!requireAdminRequest(req, res)) return;
    try {
      const orders = await listOrders();
      sendJson(res, 200, { ok: true, orders: stripHeavyProofPayloads(orders) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not list orders.";
      sendJson(res, 500, { error: message });
    }
    return;
  }

  if (req.method === "GET" && url.pathname.match(/^\/api\/admin\/orders\/[^/]+$/)) {
    if (!requireAdminRequest(req, res)) return;
    try {
      const orderId = decodeURIComponent(url.pathname.replace("/api/admin/orders/", ""));
      const order = await getOrderById(orderId);
      if (!order) {
        sendJson(res, 404, { error: "Order not found." });
        return;
      }
      sendJson(res, 200, { ok: true, order: stripHeavyProofPayload(order) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load order.";
      sendJson(res, 500, { error: message });
    }
    return;
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/orders/")) {
    try {
      const orderId = decodeURIComponent(url.pathname.replace("/api/orders/", ""));
      let order = await getOrderById(orderId);
      const sessionId = url.searchParams.get("session_id");
      if (!orderSessionMatches(order, sessionId)) {
        sendJson(res, 401, { error: "Order access required." });
        return;
      }
      const storedSessionId = order?.stripeCheckoutSessionId;
      const needsStripeRefresh = Boolean(
        order
          && (sessionId || storedSessionId)
          && (
            order.paymentStatus !== "paid"
            || !order.shippingAddress
            || !Object.keys(order.shippingAddress).length
            || !order.stripePaymentIntentId
          ),
      );
      if (order && needsStripeRefresh) {
        const stripeSession = await retrieveStripeCheckoutSession(sessionId || storedSessionId);
        if (stripeSession.payment_status === "paid" || stripeSession.status === "complete") {
          order = await markOrderPaidFromSession(stripeSession);
        } else {
          order = await attachStripeSessionToOrder(order.id, stripeSession);
        }
      }
      if (!order) {
        sendJson(res, 404, { error: "Order not found." });
        return;
      }
      sendJson(res, 200, { ok: true, order: stripHeavyProofPayload(order) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load order.";
      sendJson(res, 500, { error: message });
    }
    return;
  }

  if (req.method === "PATCH" && url.pathname.startsWith("/api/admin/orders/")) {
    if (!requireAdminRequest(req, res)) return;
    try {
      const orderId = decodeURIComponent(url.pathname.replace("/api/admin/orders/", ""));
      const payload = JSON.parse(await readBody(req));
      let order = await updateOrderStatus(orderId, payload);
      if (payload.emailTemplate) {
        order = await sendAndRecordOrderEmail(order, payload.emailTemplate, order.customerEmail, payload);
      }
      sendJson(res, 200, { ok: true, order: stripHeavyProofPayload(order) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update order.";
      sendJson(res, 500, { error: message });
    }
    return;
  }

  if (req.method === "POST" && url.pathname.match(/^\/api\/admin\/orders\/[^/]+\/emails$/)) {
    if (!requireAdminRequest(req, res)) return;
    try {
      const orderId = decodeURIComponent(url.pathname.split("/")[4]);
      const payload = JSON.parse(await readBody(req));
      const order = await getOrderById(orderId);
      if (!order) {
        sendJson(res, 404, { error: "Order not found." });
        return;
      }
      const next = await sendAndRecordOrderEmail(order, payload.template || "customer-order-confirmation", payload.recipient || order.customerEmail, payload);
      sendJson(res, 200, { ok: true, order: stripHeavyProofPayload(next) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not send order email.";
      sendJson(res, 500, { error: message });
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/mock-admin-hub/orders") {
    if (!requireAdminRequest(req, res)) return;
    try {
      const orders = await listMockHubOrders();
      sendJson(res, 200, { ok: true, orders });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not list mock admin hub orders.";
      sendJson(res, 500, { error: message });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/mock-admin-hub/orders") {
    if (!requireAdminRequest(req, res)) return;
    try {
      const payload = JSON.parse(await readBody(req));
      const order = await createMockHubOrder(payload);
      sendJson(res, 201, { ok: true, order });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not create mock admin hub order.";
      sendJson(res, 500, { error: message });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/proof-sessions") {
    try {
      const payload = JSON.parse(await readBody(req));
      const proofSession = await createProofSession(payload);
      sendJson(res, 201, { ok: true, proofSession });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not create proof session.";
      sendJson(res, message.includes("not configured") ? 501 : 500, { error: message });
    }
    return;
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/proof-sessions/")) {
    try {
      const publicToken = decodeURIComponent(url.pathname.replace("/api/proof-sessions/", ""));
      if (!publicToken) {
        sendJson(res, 400, { error: "Missing proof session token." });
        return;
      }
      const proofSession = await getProofSessionByToken(publicToken);
      if (!proofSession) {
        sendJson(res, 404, { error: "Proof session not found." });
        return;
      }
      sendJson(res, 200, { ok: true, proofSession });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load proof session.";
      sendJson(res, message.includes("not configured") ? 501 : 500, { error: message });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/gemini/generate-content") {
    if (!geminiPublicProxyEnabled) {
      sendJson(res, 503, { error: "Public Gemini generation is disabled." });
      return;
    }
    if (!ai) {
      sendJson(res, 501, { error: "GEMINI_API_KEY is not configured on the server." });
      return;
    }
    if (!hasAllowedGeminiBrowserHeaders(req, { deployed: deployedGeminiEnvironment })) {
      sendJson(res, 403, { error: "An explicit same-origin browser request is required." });
      return;
    }
    const clientIdentity = getGeminiClientIdentity(req, { vercel: Boolean(process.env.VERCEL) });
    if (!clientIdentity) {
      sendJson(res, 403, { error: "A trusted client identity is required." });
      return;
    }
    const requestId = randomUUID();
    try {
      let rawBody;
      try {
        rawBody = await readBody(req, MAX_GEMINI_REQUEST_BYTES);
      } catch (error) {
        if (Number(error?.statusCode || 0) === 413) {
          throw new GeminiProxyRequestError("Gemini request body is too large.", 413);
        }
        throw error;
      }
      const payload = parseGeminiRequestJson(rawBody);
      const validated = validateGeminiGenerateContentRequest(payload);
      const limit = geminiRateLimiter.consume(clientIdentity, validated.cost);
      const rateHeaders = {
        "X-RateLimit-Limit": String(limit.limit),
        "X-RateLimit-Remaining": String(limit.remaining),
      };
      if (!limit.ok) {
        sendJsonWithHeaders(res, 429, { error: "Gemini request limit reached. Try again shortly." }, {
          ...rateHeaders,
          "Retry-After": String(limit.retryAfter),
        });
        return;
      }
      const response = await ai.models.generateContent(validated.request);
      sendJsonWithHeaders(res, 200, addResponseText(response), rateHeaders);
    } catch (error) {
      const formatted = formatGeminiProxyError(error, requestId);
      if (formatted.shouldLog) console.error(`Gemini generateContent failed [${requestId}].`, error);
      sendJson(res, formatted.statusCode, formatted.payload);
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/gemini/generate-images") {
    sendJson(res, 404, { error: "This Gemini operation is not supported by the application." });
    return;
  }

  if (req.method === "GET" || req.method === "HEAD") {
    serveStatic(req, res);
    return;
  }

  sendJson(res, 405, { error: "Method not allowed." });
};

export default handleRequest;

const reviewFollowUpIntervalMs = Number(process.env.REVIEW_FOLLOWUP_CHECK_INTERVAL_MS || 6 * 60 * 60 * 1000);
const runReviewFollowUpSweep = () => {
  processReviewFollowUps()
    .then((result) => {
      if (result.sent) console.log(`Review follow-up emails sent: ${result.sent}`);
    })
    .catch((error) => console.warn("Review follow-up sweep failed.", error));
};

if (!process.env.VERCEL) {
  const server = http.createServer(handleRequest);
  server.listen(port, host, () => {
    console.log(`InstaPlaque listening on http://${host}:${port}; Gemini key configured: ${Boolean(apiKey)}`);
  });
}

if (!process.env.VERCEL && reviewFollowUpIntervalMs > 0) {
  setTimeout(runReviewFollowUpSweep, 30 * 1000);
  setInterval(runReviewFollowUpSweep, reviewFollowUpIntervalMs);
}
