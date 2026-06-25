import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";

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
  createPendingOrder,
  getOrderById,
  listOrders,
  markOrderPaidFromSession,
  sendAndRecordOrderEmail,
  updateOrderStatus,
} = await import("./server/orders.mjs");
const {
  getEmailConfig,
} = await import("./server/email.mjs");

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY || "";
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

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

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > maxBodyBytes) {
        reject(new Error("Request body is too large."));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
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
  res.writeHead(200, {
    "Content-Type": mimeTypes[ext] || "application/octet-stream",
    "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
  });
  fs.createReadStream(filePath).pipe(res);
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET" && url.pathname === "/api/gemini/health") {
    sendJson(res, 200, { ok: true, hasKey: Boolean(apiKey) });
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

  if (req.method === "POST" && url.pathname === "/api/stripe/checkout-session") {
    try {
      const payload = JSON.parse(await readBody(req));
      const pendingOrder = await createPendingOrder(payload);
      const session = await createStripeCheckoutSession(payload);
      const order = await attachStripeSessionToOrder(pendingOrder.id, session.raw || session);
      sendJson(res, 201, { ok: true, session, order });
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
      sendJson(res, 400, { error: message });
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/admin/orders") {
    try {
      const orders = await listOrders();
      sendJson(res, 200, { ok: true, orders });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not list orders.";
      sendJson(res, 500, { error: message });
    }
    return;
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/orders/")) {
    try {
      const orderId = decodeURIComponent(url.pathname.replace("/api/orders/", ""));
      let order = await getOrderById(orderId);
      const sessionId = url.searchParams.get("session_id");
      if (order && sessionId && order.paymentStatus !== "paid") {
        const stripeSession = await retrieveStripeCheckoutSession(sessionId);
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
      sendJson(res, 200, { ok: true, order });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load order.";
      sendJson(res, 500, { error: message });
    }
    return;
  }

  if (req.method === "PATCH" && url.pathname.startsWith("/api/admin/orders/")) {
    try {
      const orderId = decodeURIComponent(url.pathname.replace("/api/admin/orders/", ""));
      const payload = JSON.parse(await readBody(req));
      let order = await updateOrderStatus(orderId, payload);
      if (payload.emailTemplate) {
        order = await sendAndRecordOrderEmail(order, payload.emailTemplate, order.customerEmail, payload);
      }
      sendJson(res, 200, { ok: true, order });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update order.";
      sendJson(res, 500, { error: message });
    }
    return;
  }

  if (req.method === "POST" && url.pathname.match(/^\/api\/admin\/orders\/[^/]+\/emails$/)) {
    try {
      const orderId = decodeURIComponent(url.pathname.split("/")[4]);
      const payload = JSON.parse(await readBody(req));
      const order = await getOrderById(orderId);
      if (!order) {
        sendJson(res, 404, { error: "Order not found." });
        return;
      }
      const next = await sendAndRecordOrderEmail(order, payload.template || "customer-order-confirmation", payload.recipient || order.customerEmail, payload);
      sendJson(res, 200, { ok: true, order: next });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not send order email.";
      sendJson(res, 500, { error: message });
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/mock-admin-hub/orders") {
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
    if (!ai) {
      sendJson(res, 501, { error: "GEMINI_API_KEY is not configured on the server." });
      return;
    }
    try {
      const payload = JSON.parse(await readBody(req));
      const response = await ai.models.generateContent(payload);
      sendJson(res, 200, addResponseText(response));
    } catch (error) {
      sendJson(res, 500, { error: error instanceof Error ? error.message : "Gemini generateContent failed." });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/gemini/generate-images") {
    if (!ai) {
      sendJson(res, 501, { error: "GEMINI_API_KEY is not configured on the server." });
      return;
    }
    try {
      const payload = JSON.parse(await readBody(req));
      const response = await ai.models.generateImages(payload);
      sendJson(res, 200, response);
    } catch (error) {
      sendJson(res, 500, { error: error instanceof Error ? error.message : "Gemini generateImages failed." });
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
  console.log(`InstaPlaque listening on http://${host}:${port}; Gemini key configured: ${Boolean(apiKey)}`);
});
