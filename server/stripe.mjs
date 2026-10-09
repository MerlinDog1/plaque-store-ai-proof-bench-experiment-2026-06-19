import { createHmac, timingSafeEqual } from "node:crypto";
import { isOnePoundTestOrder, isOnePoundSandboxOrder, isOnePoundLiveOrder, assertOnePoundTestSession } from "./onePoundTest.mjs";
import {
  assertServerCheckoutOrderIsPayable,
  resolveCheckoutOrigin,
} from "./checkout.mjs";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const stripePublishableKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
const stripeWebhookToleranceSeconds = 5 * 60;

export const getStripeTestConfig = () => ({
  configured: /^sk_test_\S+$/.test(process.env.STRIPE_TEST_SECRET_KEY || ""),
});

export const requireStripeTestKey = () => {
  if (!getStripeTestConfig().configured) {
    const error = new Error("Sandbox checkout is not connected yet. Add STRIPE_TEST_SECRET_KEY in Vercel; leave the live Stripe keys unchanged.");
    error.statusCode = 503;
    error.code = "stripe_test_not_configured";
    throw error;
  }
  return process.env.STRIPE_TEST_SECRET_KEY;
};

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

export const getLiveVerificationConfig = () => ({
  configured: getStripeKeyMode(stripeSecretKey) === "live" && getStripeKeyMode(stripePublishableKey) === "live",
  mode: "live",
});

export const requireLiveVerificationKeys = () => {
  if (!getLiveVerificationConfig().configured) {
    const error = new Error("Live checkout is not configured. No order or payment was created.");
    error.statusCode = 503;
    error.code = "live_checkout_not_configured";
    throw error;
  }
};

export const buildStripeCheckoutParams = (order, options = {}) => {
  const { currency, productTitle, totalPence } = assertServerCheckoutOrderIsPayable(order);
  const orderId = order.id;
  const customerEmail = order.customerEmail || "";
  const recoveryToken = String(order.metadata?.checkoutRecoveryToken || "");
  if (!recoveryToken) throw new Error("Checkout recovery token is missing from the server order.");
  const origin = resolveCheckoutOrigin(order.metadata?.publicOrigin || options.origin);
  const uiMode = options.uiMode === "embedded" ? "embedded" : "hosted";
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("client_reference_id", orderId);
  if (uiMode === "embedded") {
    params.set("ui_mode", "embedded");
    params.set("return_url", `${origin}/order-confirmed?session_id={CHECKOUT_SESSION_ID}&order=${encodeURIComponent(orderId)}`);
  } else {
    params.set("success_url", `${origin}/order-confirmed?session_id={CHECKOUT_SESSION_ID}&order=${encodeURIComponent(orderId)}`);
    params.set("cancel_url", `${origin}/design?stripe=cancelled&order=${encodeURIComponent(orderId)}&proof=${encodeURIComponent(recoveryToken)}`);
  }
  params.set("payment_method_types[0]", "card");
  if (customerEmail.includes("@")) {
    params.set("customer_email", customerEmail);
  }
  params.set("phone_number_collection[enabled]", "true");
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", currency);
  params.set("line_items[0][price_data][unit_amount]", String(totalPence));
  params.set("line_items[0][price_data][product_data][name]", productTitle);
  params.set("line_items[0][price_data][product_data][description]", `Approved proof package ${orderId}`);
  params.set("shipping_address_collection[allowed_countries][0]", "GB");
  params.set("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
  params.set("shipping_options[0][shipping_rate_data][fixed_amount][amount]", "0");
  params.set("shipping_options[0][shipping_rate_data][fixed_amount][currency]", currency);
  params.set("shipping_options[0][shipping_rate_data][display_name]", "UK delivery included");
  params.set("shipping_options[0][shipping_rate_data][delivery_estimate][minimum][unit]", "business_day");
  params.set("shipping_options[0][shipping_rate_data][delivery_estimate][minimum][value]", "5");
  params.set("shipping_options[0][shipping_rate_data][delivery_estimate][maximum][unit]", "business_day");
  params.set("shipping_options[0][shipping_rate_data][delivery_estimate][maximum][value]", "5");
  params.set("metadata[order_id]", orderId);
  params.set("metadata[source]", "instaplaque");
  params.set("metadata[payload_version]", order.metadata.checkoutPolicyVersion);

  if (isOnePoundTestOrder(order)) {
    const live = isOnePoundLiveOrder(order);
    if (uiMode !== "hosted") throw new Error("The verification payment uses hosted checkout.");
    params.set("cancel_url", `${origin}/checkout-test.html`);
    params.set("line_items[0][price_data][product_data][name]", `${live ? "£1 live verification" : "TEST ONLY"} — ${productTitle}`);
    params.set("line_items[0][price_data][product_data][description]", live
      ? "Real £1 payment authorised by the owner to verify checkout. No manufacture or delivery."
      : "£1 sandbox rehearsal. No real payment, manufacture or delivery.");
    params.set("shipping_options[0][shipping_rate_data][display_name]", "Test only — no delivery");
    for (const key of [...params.keys()]) {
      if (key.includes("delivery_estimate")) params.delete(key);
    }
    params.set(live ? "metadata[live_verification_policy]" : "metadata[checkout_test_policy]",
      live ? order.metadata.liveVerificationPolicy : order.metadata.checkoutTestPolicy);
  }

  return { idempotencyKey: orderId, params, uiMode };
};

export const buildStripeRequestHeaders = (idempotencyKey, secretKey = stripeSecretKey) => ({
  Authorization: `Bearer ${secretKey}`,
  "Content-Type": "application/x-www-form-urlencoded",
  "Idempotency-Key": idempotencyKey,
});

export const createStripeCheckoutSession = async (order, options = {}) => {
  const sandboxTest = isOnePoundSandboxOrder(order);
  if (isOnePoundLiveOrder(order)) requireLiveVerificationKeys();
  // Never fall back to the live key when the private sandbox is unconfigured.
  const selectedSecretKey = sandboxTest ? requireStripeTestKey() : stripeSecretKey;
  const selectedPublishableKey = sandboxTest ? "" : stripePublishableKey;
  if (!selectedSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured on the server.");
  }
  if (!sandboxTest && !selectedPublishableKey) {
    throw new Error("VITE_STRIPE_PUBLISHABLE_KEY is not configured on the server.");
  }

  const secretKeyMode = getStripeKeyMode(selectedSecretKey);
  const publishableKeyMode = getStripeKeyMode(selectedPublishableKey);
  if (!secretKeyMode) {
    throw new Error("STRIPE_SECRET_KEY must be a Stripe test or live secret key.");
  }
  if (!sandboxTest && !publishableKeyMode) {
    throw new Error("VITE_STRIPE_PUBLISHABLE_KEY must be a Stripe test or live publishable key.");
  }
  if (!sandboxTest && secretKeyMode !== publishableKeyMode) {
    throw new Error("Stripe secret and publishable keys must both be test keys or both be live keys.");
  }

  const { idempotencyKey, params, uiMode } = buildStripeCheckoutParams(order, options);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let response;
  try {
    response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: buildStripeRequestHeaders(idempotencyKey, selectedSecretKey),
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
  assertOnePoundTestSession(order, data);

  return {
    id: data.id,
    url: data.url,
    clientSecret: data.client_secret,
    publishableKey: selectedPublishableKey,
    uiMode,
    mode: data.mode,
    paymentStatus: data.payment_status,
    clientReferenceId: data.client_reference_id,
    paymentIntentId: data.payment_intent,
    livemode: Boolean(data.livemode),
    raw: data,
  };
};

export const retrieveStripeCheckoutSession = async (sessionId, order = null) => {
  const selectedSecretKey = isOnePoundSandboxOrder(order) ? requireStripeTestKey() : stripeSecretKey;
  if (!selectedSecretKey) throw new Error("STRIPE_SECRET_KEY is not configured on the server.");
  const url = new URL(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`);
  url.searchParams.set("expand[]", "payment_intent");
  url.searchParams.append("expand[]", "line_items");
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${selectedSecretKey}` },
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || `Could not retrieve Stripe checkout session (${response.status}).`);
  }
  assertOnePoundTestSession(order, data);
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
