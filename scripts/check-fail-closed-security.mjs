import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Readable } from "node:stream";

const securityEnvKeys = [
  "ADMIN_PASSWORD",
  "ADMIN_ACCESS_TOKEN",
  "ADMIN_AUTH_SECRET",
  "NODE_ENV",
  "VERCEL",
  "STRIPE_WEBHOOK_SECRET",
  "STOREFRONT_INGEST_KEYS",
  "STOREFRONT_API_KEYS",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GEMINI_API_KEY",
  "GOOGLE_API_KEY",
  "API_KEY",
];

const originalEnv = Object.fromEntries(securityEnvKeys.map((key) => [key, process.env[key]]));
let importCounter = 0;

const clearSecurityEnv = () => {
  for (const key of securityEnvKeys) delete process.env[key];
};

const restoreSecurityEnv = () => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
};

const importFresh = (relativePath) => {
  const url = new URL(relativePath, import.meta.url);
  url.searchParams.set("security_check", String(++importCounter));
  return import(url.href);
};

const request = ({
  host = "example.test",
  remoteAddress = "203.0.113.10",
  headers = {},
} = {}) => ({
  headers: { host, ...headers },
  socket: { remoteAddress },
});

const localRequest = () => request({ host: "127.0.0.1:4179", remoteAddress: "127.0.0.1" });

const invokeRoute = async (handleRequest, method, url, body = "") => {
  const req = Readable.from(body ? [body] : []);
  req.method = method;
  req.url = url;
  req.headers = { host: "example.test", "content-type": "application/json" };
  req.socket = { remoteAddress: "203.0.113.10" };

  let statusCode = 0;
  let responseBody = "";
  const res = {
    writeHead(status) {
      statusCode = status;
    },
    end(chunk = "") {
      responseBody += Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
    },
  };

  await handleRequest(req, res);
  return {
    statusCode,
    payload: responseBody ? JSON.parse(responseBody) : null,
  };
};

try {
  clearSecurityEnv();
  process.env.NODE_ENV = "production";
  const missingAdmin = await importFresh("../server/adminAuth.mjs");
  const missingConfig = missingAdmin.getAdminAuthConfig(request());
  assert.equal(missingConfig.configured, false);
  assert.equal(missingConfig.operational, false);
  assert.equal(missingConfig.authRequired, true);
  assert.equal(missingConfig.status, "misconfigured");
  assert.match(missingConfig.message, /ADMIN_PASSWORD or ADMIN_ACCESS_TOKEN/);
  assert.equal(missingAdmin.isAdminRequest(request()), false);
  assert.equal(missingAdmin.isAdminRequest(localRequest()), false);
  assert.equal(missingAdmin.verifyAdminSessionToken("local-preview-admin"), false);
  assert.throws(
    () => missingAdmin.createAdminSession(""),
    (error) => error?.statusCode === 503 && error?.code === "ADMIN_AUTH_NOT_CONFIGURED",
  );

  clearSecurityEnv();
  process.env.NODE_ENV = "development";
  const localMissingAdmin = await importFresh("../server/adminAuth.mjs");
  assert.equal(localMissingAdmin.getAdminAuthConfig().status, "misconfigured");
  assert.equal(localMissingAdmin.isAdminRequest(localRequest()), false);
  assert.throws(
    () => localMissingAdmin.createAdminSession(""),
    (error) => error?.statusCode === 503 && error?.code === "ADMIN_AUTH_NOT_CONFIGURED",
  );

  clearSecurityEnv();
  process.env.NODE_ENV = "production";
  process.env.ADMIN_PASSWORD = "security-check-password";
  process.env.ADMIN_AUTH_SECRET = "security-check-session-secret";
  const configuredAdmin = await importFresh("../server/adminAuth.mjs");
  const configuredConfig = configuredAdmin.getAdminAuthConfig(request());
  assert.equal(configuredConfig.configured, true);
  assert.equal(configuredConfig.operational, true);
  assert.equal(configuredConfig.authRequired, true);
  assert.equal(configuredAdmin.isAdminRequest(request()), false);
  const session = configuredAdmin.createAdminSession("security-check-password");
  assert.equal(configuredAdmin.verifyAdminSessionToken(session.token), true);
  assert.equal(configuredAdmin.isAdminRequest(request({
    headers: { cookie: `instaplaque_admin_session=${encodeURIComponent(session.token)}` },
  })), true);
  const publicConfigJson = JSON.stringify(configuredConfig);
  assert.equal(publicConfigJson.includes("security-check-password"), false);
  assert.equal(publicConfigJson.includes("security-check-session-secret"), false);

  const {
    createAdminLoginRateLimiter,
    getAdminClientIp,
    normalizeIpAddress,
  } = await importFresh("../server/adminRateLimit.mjs");
  assert.equal(normalizeIpAddress("[2001:db8::1]:443"), "2001:0db8:0000:0000:0000:0000:0000:0001");
  assert.equal(normalizeIpAddress("::ffff:192.0.2.10"), "192.0.2.10");
  assert.equal(normalizeIpAddress("::ffff:c000:020a"), "192.0.2.10");
  const spoofedRequest = (spoofedAddress) => request({
    remoteAddress: "203.0.113.44",
    headers: { "x-forwarded-for": spoofedAddress },
  });
  assert.equal(getAdminClientIp(spoofedRequest("198.51.100.1"), {}), "203.0.113.44");
  assert.equal(getAdminClientIp(spoofedRequest("198.51.100.1"), { VERCEL: "0" }), "203.0.113.44");
  const socketLimiter = createAdminLoginRateLimiter({ maxAttempts: 2, env: {}, now: () => 1000 });
  assert.equal(socketLimiter.check(spoofedRequest("198.51.100.1")).ok, true);
  assert.equal(socketLimiter.check(spoofedRequest("198.51.100.2")).ok, true);
  assert.equal(socketLimiter.check(spoofedRequest("198.51.100.3")).ok, false);

  const vercelRequest = (spoofedAddress) => request({
    remoteAddress: "10.0.0.5",
    headers: { "x-forwarded-for": `${spoofedAddress}, 192.0.2.90` },
  });
  assert.equal(getAdminClientIp(vercelRequest("198.51.100.1"), { VERCEL: "1" }), "192.0.2.90");
  const vercelLimiter = createAdminLoginRateLimiter({ maxAttempts: 2, env: { VERCEL: "1" }, now: () => 1000 });
  assert.equal(vercelLimiter.check(vercelRequest("198.51.100.1")).ok, true);
  assert.equal(vercelLimiter.check(vercelRequest("198.51.100.2")).ok, true);
  assert.equal(vercelLimiter.check(vercelRequest("198.51.100.3")).ok, false);

  clearSecurityEnv();
  const unsignedStripe = await importFresh("../server/stripe.mjs");
  const stripeEvent = { id: "evt_security_check", type: "checkout.session.completed", data: { object: {} } };
  const rawStripeEvent = JSON.stringify(stripeEvent);
  assert.throws(
    () => unsignedStripe.parseStripeWebhook(rawStripeEvent, ""),
    /STRIPE_WEBHOOK_SECRET is not configured/,
  );

  process.env.STRIPE_WEBHOOK_SECRET = "whsec_security_check";
  const signedStripe = await importFresh("../server/stripe.mjs");
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHmac("sha256", process.env.STRIPE_WEBHOOK_SECRET)
    .update(`${timestamp}.${rawStripeEvent}`)
    .digest("hex");
  assert.deepEqual(
    signedStripe.parseStripeWebhook(rawStripeEvent, `t=${timestamp},v1=${signature}`),
    stripeEvent,
  );
  assert.deepEqual(
    signedStripe.parseStripeWebhook(rawStripeEvent, `t=${timestamp},v1=${"0".repeat(64)},v1=${signature}`),
    stripeEvent,
  );
  assert.throws(
    () => signedStripe.parseStripeWebhook(rawStripeEvent, ""),
    /Missing Stripe webhook signature/,
  );
  assert.throws(
    () => signedStripe.parseStripeWebhook(rawStripeEvent, `t=${timestamp},v1=${"0".repeat(64)}`),
    /Invalid Stripe webhook signature/,
  );
  const staleTimestamp = String(Math.floor(Date.now() / 1000) - 301);
  const staleSignature = createHmac("sha256", process.env.STRIPE_WEBHOOK_SECRET)
    .update(`${staleTimestamp}.${rawStripeEvent}`)
    .digest("hex");
  assert.throws(
    () => signedStripe.parseStripeWebhook(rawStripeEvent, `t=${staleTimestamp},v1=${staleSignature}`),
    /outside the allowed five-minute tolerance/,
  );

  const {
    prepareVisualProofAttachment,
    shouldSendCustomerProofEmail,
  } = await importFresh("../server/orders.mjs");
  const proofOrder = {
    id: "security-check-order",
    stripeCheckoutSessionId: "cs_security_check",
    customerEmail: "customer@example.test",
    proofPackage: {},
    events: [],
  };
  const firstAttachment = prepareVisualProofAttachment(proofOrder, {
    stripeCheckoutSessionId: "cs_security_check",
    visualProofPng: "QUFB",
    visualProofSvg: "<svg><text>first</text></svg>",
    productionArtworkPdf: "UERG",
    visualProofRendererVersion: 2,
    sendCustomerEmail: false,
  });
  assert.equal(firstAttachment.attached, true);
  assert.equal(firstAttachment.order.proofPackage.visualProofPng, "QUFB");
  assert.equal(shouldSendCustomerProofEmail(firstAttachment), true);
  const repeatedAttachment = prepareVisualProofAttachment(firstAttachment.order, {
    stripeCheckoutSessionId: "cs_security_check",
    visualProofPng: "QkJC",
    visualProofSvg: "<svg><text>replacement</text></svg>",
    productionArtworkPdf: "TkVX",
    sendCustomerEmail: true,
  });
  assert.equal(repeatedAttachment.attached, false);
  assert.equal(repeatedAttachment.order, firstAttachment.order);
  assert.equal(repeatedAttachment.order.proofPackage.visualProofPng, "QUFB");
  assert.equal(repeatedAttachment.order.proofPackage.visualProofSvg, "<svg><text>first</text></svg>");
  assert.equal(repeatedAttachment.order.proofPackage.productionArtworkPdf, "UERG");
  assert.equal(repeatedAttachment.order.events.length, 1);
  assert.equal(shouldSendCustomerProofEmail(repeatedAttachment), false);
  assert.throws(
    () => prepareVisualProofAttachment(firstAttachment.order, { stripeCheckoutSessionId: "cs_wrong" }),
    /did not match the checkout session/,
  );
  assert.throws(
    () => prepareVisualProofAttachment({ ...proofOrder, stripeCheckoutSessionId: "" }, {}),
    /did not match the checkout session/,
  );
  const proofClaimMigration = await readFile(
    new URL("../supabase/migrations/20260710113000_claim_storefront_order_proof.sql", import.meta.url),
    "utf8",
  );
  assert.match(proofClaimMigration, /stripe_checkout_session_id = p_stripe_checkout_session_id/);
  assert.match(proofClaimMigration, /nullif\(proof_package ->> 'visualProofPng', ''\) is null/);
  assert.match(proofClaimMigration, /grant execute[\s\S]+to service_role/);

  const { getStorefrontAuth } = await importFresh("../server/storefrontAuth.mjs");
  const missingStorefront = getStorefrontAuth(request(), {});
  assert.equal(missingStorefront.ok, false);
  assert.equal(missingStorefront.statusCode, 503);
  assert.equal(missingStorefront.code, "STOREFRONT_AUTH_NOT_CONFIGURED");
  const invalidStorefront = getStorefrontAuth(
    request({ headers: { "x-storefront-api-key": "wrong" } }),
    { STOREFRONT_INGEST_KEYS: "partner:correct" },
  );
  assert.equal(invalidStorefront.ok, false);
  assert.equal(invalidStorefront.statusCode, 401);
  const validStorefront = getStorefrontAuth(
    request({ headers: { authorization: "Bearer correct", "x-storefront-source": "partner" } }),
    { STOREFRONT_INGEST_KEYS: "partner:correct" },
  );
  assert.equal(validStorefront.ok, true);
  assert.equal(validStorefront.source, "partner");

  clearSecurityEnv();
  for (const key of securityEnvKeys) process.env[key] = "";
  process.env.NODE_ENV = "production";
  process.env.VERCEL = "1";
  const { handleRequest } = await importFresh("../server.mjs");

  for (const [method, url] of [
    ["GET", "/api/admin/orders"],
    ["GET", "/api/mock-admin-hub/orders"],
    ["POST", "/api/mock-admin-hub/orders"],
  ]) {
    const response = await invokeRoute(handleRequest, method, url, method === "POST" ? "{}" : "");
    assert.equal(response.statusCode, 503, `${method} ${url} must fail closed`);
    assert.equal(response.payload.code, "ADMIN_AUTH_NOT_CONFIGURED");
  }

  const adminConfigResponse = await invokeRoute(handleRequest, "GET", "/api/admin/auth-config");
  assert.equal(adminConfigResponse.statusCode, 200);
  assert.equal(adminConfigResponse.payload.status, "misconfigured");
  assert.equal(adminConfigResponse.payload.operational, false);
  assert.match(adminConfigResponse.payload.message, /ADMIN_PASSWORD or ADMIN_ACCESS_TOKEN/);

  const storefrontResponse = await invokeRoute(handleRequest, "POST", "/api/storefront/orders", "{}");
  assert.equal(storefrontResponse.statusCode, 503);
  assert.equal(storefrontResponse.payload.code, "STOREFRONT_AUTH_NOT_CONFIGURED");

  const proofMutationResponse = await invokeRoute(
    handleRequest,
    "POST",
    "/api/orders/security-check-missing-order/proof-image",
    JSON.stringify({ stripeCheckoutSessionId: "cs_security_check", visualProofPng: "AA==" }),
  );
  assert.equal(proofMutationResponse.statusCode, 503);
  assert.equal(proofMutationResponse.payload.code, "durable_order_storage_required");

  for (const url of ["/api/stripe/webhook", "/api/webhooks/stripe"]) {
    const response = await invokeRoute(handleRequest, "POST", url, rawStripeEvent);
    assert.equal(response.statusCode, 503);
    assert.equal(response.payload.code, "STRIPE_WEBHOOK_NOT_CONFIGURED");
    assert.match(response.payload.error, /STRIPE_WEBHOOK_SECRET is not configured/);
  }

  console.log("Fail-closed security checks passed.");
} finally {
  restoreSecurityEnv();
}
