import { createHmac, timingSafeEqual } from "node:crypto";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const stripePublishableKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
const canonicalSiteUrl = "https://instaplaque.co.uk";
const stripeWebhookToleranceSeconds = 5 * 60;

const getStripeKeyMode = (key) => {
  if (key.startsWith("sk_test_") || key.startsWith("pk_test_")) return "test";
  if (key.startsWith("sk_live_") || key.startsWith("pk_live_")) return "live";
  return "";
};

export const getStripeConfig = () => ({
  hasSecretKey: Boolean(stripeSecretKey),
  secretKeyMode: getStripeKeyMode(stripeSecretKey),
  hasPublishableKey: Boolean(stripePublishableKey),
  publishableKeyMode: getStripeKeyMode(stripePublishableKey),
  publishableKey: getStripeKeyMode(stripePublishableKey) ? stripePublishableKey : "",
  hasWebhookSecret: Boolean(stripeWebhookSecret),
  configured: Boolean(stripeSecretKey && stripePublishableKey),
});

export const createStripeCheckoutSession = async (payload) => {
  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured on the server.");
  }
  if (!stripePublishableKey) {
    throw new Error("VITE_STRIPE_PUBLISHABLE_KEY is not configured on the server.");
  }

  const secretKeyMode = getStripeKeyMode(stripeSecretKey);
  const publishableKeyMode = getStripeKeyMode(stripePublishableKey);
  if (!secretKeyMode) {
    throw new Error("STRIPE_SECRET_KEY must be a Stripe test or live secret key.");
  }
  if (!publishableKeyMode) {
    throw new Error("VITE_STRIPE_PUBLISHABLE_KEY must be a Stripe test or live publishable key.");
  }
  if (secretKeyMode !== publishableKeyMode) {
    throw new Error("Stripe secret and publishable keys must both be test keys or both be live keys.");
  }

  const orderId = String(payload.orderId || "").trim();
  const productTitle = String(payload.productTitle || "InstaPlaque custom plaque").trim();
  const customerEmail = String(payload.customerEmail || "").trim();
  const totalPence = Math.round(Number(payload.totalPence || 0));
  const requestedOrigin = String(payload.origin || "").replace(/\/$/, "");
  const origin = String(process.env.PUBLIC_SITE_URL || requestedOrigin || "")
    .replace(/\/$/, "")
    .replace(/https:\/\/instaplaque(?:-[^.]+)?\.vercel\.app$/i, canonicalSiteUrl);
  const uiMode = payload.uiMode === "embedded" ? "embedded" : "hosted";

  if (!orderId) throw new Error("Missing order ID for Stripe checkout.");
  if (!origin) throw new Error("Missing origin for Stripe checkout.");
  if (!Number.isFinite(totalPence) || totalPence < 50) {
    throw new Error("Stripe checkout total must be at least 50p.");
  }

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("client_reference_id", orderId);
  if (uiMode === "embedded") {
    params.set("ui_mode", "embedded");
    params.set("return_url", `${origin}/order-confirmed?session_id={CHECKOUT_SESSION_ID}&order=${encodeURIComponent(orderId)}`);
  } else {
    params.set("success_url", `${origin}/order-confirmed?session_id={CHECKOUT_SESSION_ID}&order=${encodeURIComponent(orderId)}`);
    params.set("cancel_url", `${origin}/checkout?stripe=cancelled&order=${encodeURIComponent(orderId)}`);
  }
  params.set("payment_method_types[0]", "card");
  if (customerEmail.includes("@")) {
    params.set("customer_email", customerEmail);
  }
  params.set("phone_number_collection[enabled]", "true");
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "gbp");
  params.set("line_items[0][price_data][unit_amount]", String(totalPence));
  params.set("line_items[0][price_data][product_data][name]", productTitle);
  params.set("line_items[0][price_data][product_data][description]", `Approved proof package ${orderId}`);
  params.set("shipping_address_collection[allowed_countries][0]", "GB");
  params.set("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
  params.set("shipping_options[0][shipping_rate_data][fixed_amount][amount]", "0");
  params.set("shipping_options[0][shipping_rate_data][fixed_amount][currency]", "gbp");
  params.set("shipping_options[0][shipping_rate_data][display_name]", "UK mainland delivery included");
  params.set("shipping_options[0][shipping_rate_data][delivery_estimate][minimum][unit]", "business_day");
  params.set("shipping_options[0][shipping_rate_data][delivery_estimate][minimum][value]", "5");
  params.set("shipping_options[0][shipping_rate_data][delivery_estimate][maximum][unit]", "business_day");
  params.set("shipping_options[0][shipping_rate_data][delivery_estimate][maximum][value]", "5");
  params.set("metadata[order_id]", orderId);
  params.set("metadata[source]", "instaplaque");
  params.set("metadata[payload_version]", "2026-06-24");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let response;
  try {
    response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Stripe checkout took too long to respond. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.message || `Stripe checkout session failed (${response.status}).`;
    throw new Error(message);
  }

  return {
    id: data.id,
    url: data.url,
    clientSecret: data.client_secret,
    publishableKey: stripePublishableKey,
    uiMode,
    mode: data.mode,
    paymentStatus: data.payment_status,
    clientReferenceId: data.client_reference_id,
    paymentIntentId: data.payment_intent,
    livemode: Boolean(data.livemode),
    raw: data,
  };
};

export const retrieveStripeCheckoutSession = async (sessionId) => {
  if (!stripeSecretKey) throw new Error("STRIPE_SECRET_KEY is not configured on the server.");
  const url = new URL(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`);
  url.searchParams.set("expand[]", "payment_intent");
  url.searchParams.append("expand[]", "line_items");
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${stripeSecretKey}` },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || `Could not retrieve Stripe checkout session (${response.status}).`);
  }
  return data;
};

export const parseStripeWebhook = (rawBody, signatureHeader = "") => {
  if (!stripeWebhookSecret) {
    const error = new Error("STRIPE_WEBHOOK_SECRET is not configured; Stripe webhook events are rejected.");
    error.statusCode = 503;
    error.code = "STRIPE_WEBHOOK_NOT_CONFIGURED";
    throw error;
  }

  const parts = String(signatureHeader)
    .split(",")
    .map((part) => {
      const separator = part.indexOf("=");
      return separator === -1
        ? ["", ""]
        : [part.slice(0, separator).trim(), part.slice(separator + 1).trim()];
    })
    .filter(([key, value]) => key && value);
  const timestamp = parts.find(([key]) => key === "t")?.[1];
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!timestamp || !signatures.length || !/^\d+$/.test(timestamp)) {
    throw new Error("Missing Stripe webhook signature.");
  }

  const timestampSeconds = Number(timestamp);
  const currentSeconds = Math.floor(Date.now() / 1000);
  if (!Number.isSafeInteger(timestampSeconds) || Math.abs(currentSeconds - timestampSeconds) > stripeWebhookToleranceSeconds) {
    throw new Error("Stripe webhook timestamp is outside the allowed five-minute tolerance.");
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", stripeWebhookSecret).update(signedPayload).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const hasValidSignature = signatures.some((signature) => {
    if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
    const actual = Buffer.from(signature, "hex");
    return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
  });
  if (!hasValidSignature) {
    throw new Error("Invalid Stripe webhook signature.");
  }

  return JSON.parse(rawBody);
};
