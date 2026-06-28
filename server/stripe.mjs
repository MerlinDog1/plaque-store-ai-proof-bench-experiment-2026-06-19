import { createHmac, timingSafeEqual } from "node:crypto";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const stripePublishableKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export const getStripeConfig = () => ({
  hasSecretKey: Boolean(stripeSecretKey),
  secretKeyIsTest: stripeSecretKey.startsWith("sk_test_"),
  hasPublishableKey: Boolean(stripePublishableKey),
  publishableKeyIsTest: stripePublishableKey.startsWith("pk_test_"),
  publishableKey: stripePublishableKey.startsWith("pk_test_") ? stripePublishableKey : "",
  hasWebhookSecret: Boolean(stripeWebhookSecret),
  configured: Boolean(stripeSecretKey && stripePublishableKey),
});

export const createStripeCheckoutSession = async (payload) => {
  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured on the server.");
  }
  if (!stripeSecretKey.startsWith("sk_test_")) {
    throw new Error("Refusing to create checkout with a non-test Stripe secret key.");
  }

  const orderId = String(payload.orderId || "").trim();
  const productTitle = String(payload.productTitle || "InstaPlaque custom plaque").trim();
  const customerEmail = String(payload.customerEmail || "").trim();
  const totalPence = Math.round(Number(payload.totalPence || 0));
  const origin = String(payload.origin || "").replace(/\/$/, "");
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
  params.set("metadata[source]", "instaplaque-local-test");
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
    return JSON.parse(rawBody);
  }

  const parts = Object.fromEntries(
    String(signatureHeader)
      .split(",")
      .map((part) => part.split("="))
      .filter(([key, value]) => key && value),
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) throw new Error("Missing Stripe webhook signature.");

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", stripeWebhookSecret).update(signedPayload).digest("hex");
  const actual = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (actual.length !== expectedBuffer.length || !timingSafeEqual(actual, expectedBuffer)) {
    throw new Error("Invalid Stripe webhook signature.");
  }

  return JSON.parse(rawBody);
};
