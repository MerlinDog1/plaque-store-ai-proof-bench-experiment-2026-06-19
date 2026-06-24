const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const stripePublishableKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY || "";

export const getStripeConfig = () => ({
  hasSecretKey: Boolean(stripeSecretKey),
  secretKeyIsTest: stripeSecretKey.startsWith("sk_test_"),
  hasPublishableKey: Boolean(stripePublishableKey),
  publishableKeyIsTest: stripePublishableKey.startsWith("pk_test_"),
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

  if (!orderId) throw new Error("Missing order ID for Stripe checkout.");
  if (!origin) throw new Error("Missing origin for Stripe checkout.");
  if (!Number.isFinite(totalPence) || totalPence < 50) {
    throw new Error("Stripe checkout total must be at least 50p.");
  }

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("client_reference_id", orderId);
  params.set("success_url", `${origin}/checkout?stripe=success&session_id={CHECKOUT_SESSION_ID}&order=${encodeURIComponent(orderId)}`);
  params.set("cancel_url", `${origin}/checkout?stripe=cancelled&order=${encodeURIComponent(orderId)}`);
  params.set("payment_method_types[0]", "card");
  if (customerEmail.includes("@")) {
    params.set("customer_email", customerEmail);
  }
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "gbp");
  params.set("line_items[0][price_data][unit_amount]", String(totalPence));
  params.set("line_items[0][price_data][product_data][name]", productTitle);
  params.set("line_items[0][price_data][product_data][description]", `Approved proof package ${orderId}`);
  params.set("metadata[order_id]", orderId);
  params.set("metadata[source]", "instaplaque-local-test");
  params.set("metadata[payload_version]", "2026-06-24");

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.message || `Stripe checkout session failed (${response.status}).`;
    throw new Error(message);
  }

  return {
    id: data.id,
    url: data.url,
    mode: data.mode,
    paymentStatus: data.payment_status,
    clientReferenceId: data.client_reference_id,
  };
};
