import assert from "node:assert/strict";
import {
  CheckoutRequestError,
  ManualQuoteRequiredError,
  buildServerCheckoutOrder,
  checkoutRecoveryTokenMatches,
  createServerOrderId,
  resolveCheckoutOrigin,
  stripCheckoutSecretsFromOrder,
} from "../server/checkout.mjs";
import {
  StripePaymentVerificationError,
  OrderIdCollisionError,
  assertLocalOrderJsonStoreEnabled,
  assertStripePaymentMatchesOrder,
  createPendingOrder,
  isLocalOrderJsonStoreEnabled,
  isPaidCompleteStripeSession,
  markOrderPaidFromSession,
} from "../server/orders.mjs";
import {
  buildStripeCheckoutParams,
  buildStripeRequestHeaders,
} from "../server/stripe.mjs";
import { getCheckoutPriceBreakdown } from "../services/checkoutPolicy.mjs";

const firstServerId = "PSAI-00000000-0000-4000-8000-000000000001";
const secondServerId = "PSAI-00000000-0000-4000-8000-000000000002";
const fixedNow = new Date("2026-07-10T12:00:00.000Z");

const baseState = {
  width: 150,
  height: 50,
  shape: "rect",
  material: "brushed-stainless",
  fixing: "screws",
  fixingHoleCount: 2,
  wood: false,
  memorialImageEnabled: false,
};

const baseBreakdown = getCheckoutPriceBreakdown(baseState, "In loving memory");
const baseTotalPence = Math.round(baseBreakdown.total * 100);

const basePayload = () => ({
  orderId: "PSAI-123456",
  totalPence: baseTotalPence,
  currency: "gbp",
  productTitle: "Client-controlled product title",
  origin: "https://instaplaque.co.uk",
  uiMode: "hosted",
  orderSnapshot: {
    id: "PSAI-123456",
    customerName: "Checkout customer",
    customerEmail: "customer@example.com",
    productTitle: "Client-controlled product title",
    total: baseBreakdown.total,
    currency: "gbp",
    inscription: "In loving memory",
    proofApproved: true,
    state: {
      ...baseState,
      generatedSvgContent: '<svg onload="globalThis.compromised=true"></svg>',
      memorialImageSvg: '<svg><script>globalThis.compromised=true</script></svg>',
      memorialImageSourceUrl: "data:image/svg+xml,hostile",
      productionSvg: "hostile-state-production-svg",
      visualProofSvg: "hostile-state-visual-svg",
      visualProofPng: "hostile-state-visual-png",
      productionArtworkPdf: "hostile-state-production-pdf",
    },
    priceBreakdown: { ...baseBreakdown },
    proofPackage: {
      productionSvg: '<svg onload="globalThis.compromised=true"></svg>',
      visualProofSvg: '<svg><script>globalThis.compromised=true</script></svg>',
      visualProofPng: "data:image/png;base64,hostile",
      productionArtworkPdf: "data:application/pdf;base64,hostile",
    },
  },
});

const canonicalOrder = buildServerCheckoutOrder(basePayload(), {
  orderId: firstServerId,
  now: fixedNow,
});
assert.equal(canonicalOrder.id, firstServerId, "The server ID must replace the browser ID.");
assert.notEqual(canonicalOrder.id, basePayload().orderId, "The browser order ID must not be authoritative.");
assert.equal(canonicalOrder.totalPence, baseTotalPence, "The server must derive the expected price.");
assert.equal(canonicalOrder.productTitle, "Brushed stainless / 150 x 50 mm");
assert.equal(canonicalOrder.metadata.pricingAuthority, "server");
assert.equal(canonicalOrder.metadata.productionAuthority, "canonical_plaque_state");
assert.deepEqual(canonicalOrder.metadata.productionSpec, {
  widthMm: 150,
  heightMm: 50,
  shape: "rect",
  material: "brushed-stainless",
  fixing: "screws",
  fixingHoleCount: 2,
  wood: false,
});
assert.equal(canonicalOrder.plaqueState.generatedSvgContent, null);
assert.equal(canonicalOrder.plaqueState.memorialImageSvg, null);
assert.equal(canonicalOrder.plaqueState.productionSvg, undefined);
assert.equal(canonicalOrder.plaqueState.visualProofSvg, undefined);
assert.equal(canonicalOrder.plaqueState.visualProofPng, undefined);
assert.equal(canonicalOrder.plaqueState.productionArtworkPdf, undefined);
assert.equal(canonicalOrder.proofPackage.productionSvg.includes("onload"), false);
assert.equal(canonicalOrder.proofPackage.productionSvg.includes("<script"), false);
assert.equal(canonicalOrder.proofPackage.visualProofSvg.includes("<script"), false);
assert.equal(canonicalOrder.proofPackage.visualProofPng, null);
assert.equal(canonicalOrder.proofPackage.productionArtworkPdf, null);
assert.equal(canonicalOrder.proofPackage.artworkStatus, "stored_sanitized_svg");
assert(checkoutRecoveryTokenMatches(canonicalOrder, canonicalOrder.metadata.checkoutRecoveryToken));
assert(!checkoutRecoveryTokenMatches(canonicalOrder, "not-the-token"));

const realVisualProof = '<svg xmlns="http://www.w3.org/2000/svg"><text>REAL CUSTOMER WORDING</text></svg>';
const placeholderProductionProof = '<svg xmlns="http://www.w3.org/2000/svg"><text>REVIEW PROOF</text></svg>';
const placeholderProofOrder = buildServerCheckoutOrder({
  ...basePayload(),
  orderSnapshot: {
    ...basePayload().orderSnapshot,
    proofPackage: {
      productionSvg: placeholderProductionProof,
      visualProofSvg: realVisualProof,
    },
  },
}, {
  orderId: secondServerId,
  now: fixedNow,
});
assert.equal(
  placeholderProofOrder.proofPackage.productionSvg.includes("REAL CUSTOMER WORDING"),
  true,
  "Checkout must not store the review placeholder ahead of the real visual proof.",
);
assert.equal(placeholderProofOrder.proofPackage.productionSvg.includes("REVIEW PROOF"), false);

assert.equal(stripCheckoutSecretsFromOrder(canonicalOrder).metadata.checkoutRecoveryToken, undefined);
assert.equal(stripCheckoutSecretsFromOrder({
  ...canonicalOrder,
  stripeSession: { cancel_url: "https://example.test/?proof=secret", id: "cs_test" },
}).stripeSession.cancel_url, undefined);

const noClientPriceHints = basePayload();
delete noClientPriceHints.totalPence;
delete noClientPriceHints.orderSnapshot.total;
delete noClientPriceHints.orderSnapshot.priceBreakdown;
const serverPricedWithoutHints = buildServerCheckoutOrder(noClientPriceHints, {
  orderId: secondServerId,
  now: fixedNow,
});
assert.equal(
  serverPricedWithoutHints.totalPence,
  baseTotalPence,
  "Omitting browser price hints must not change the server-derived charge.",
);

const tamperedTopLevelTotal = basePayload();
tamperedTopLevelTotal.totalPence = 50;
assert.throws(
  () => buildServerCheckoutOrder(tamperedTopLevelTotal, { orderId: firstServerId, now: fixedNow }),
  (error) => error instanceof CheckoutRequestError && error.code === "checkout_price_changed",
  "A tampered top-level total must be rejected.",
);

const tamperedNestedTotal = basePayload();
delete tamperedNestedTotal.totalPence;
tamperedNestedTotal.orderSnapshot.total = 0.5;
assert.throws(
  () => buildServerCheckoutOrder(tamperedNestedTotal, { orderId: firstServerId, now: fixedNow }),
  (error) => error instanceof CheckoutRequestError && error.code === "checkout_price_changed",
  "A tampered nested order total must be rejected.",
);

const stripeCheckout = buildStripeCheckoutParams(canonicalOrder, { uiMode: "hosted" });
const stripeParams = stripeCheckout.params;
assert.equal(stripeParams.get("client_reference_id"), firstServerId);
assert.equal(stripeParams.get("line_items[0][price_data][unit_amount]"), String(baseTotalPence));
assert.equal(stripeParams.get("line_items[0][price_data][currency]"), "gbp");
assert.equal(stripeParams.get("line_items[0][price_data][product_data][name]"), canonicalOrder.productTitle);
assert.equal(stripeCheckout.idempotencyKey, firstServerId);
assert.equal(buildStripeRequestHeaders(stripeCheckout.idempotencyKey, "sk_test_example")["Idempotency-Key"], firstServerId);
const cancelUrl = new URL(stripeParams.get("cancel_url"));
assert.equal(cancelUrl.searchParams.get("order"), firstServerId);
assert.equal(cancelUrl.searchParams.get("proof"), canonicalOrder.metadata.checkoutRecoveryToken);

assert.throws(
  () => resolveCheckoutOrigin("http://localhost:4179", {}),
  /Unsupported checkout origin/,
);
assert.equal(
  resolveCheckoutOrigin("http://localhost:4179", { ALLOW_LOCAL_CHECKOUT_ORIGIN: "true" }),
  "http://localhost:4179",
);
assert.throws(
  () => resolveCheckoutOrigin("http://localhost:4179", {
    ALLOW_LOCAL_CHECKOUT_ORIGIN: "true",
    NODE_ENV: "production",
  }),
  /Unsupported checkout origin/,
);

assert.equal(isLocalOrderJsonStoreEnabled({ ALLOW_LOCAL_ORDER_JSON_STORE: "true" }), true);
assert.equal(isLocalOrderJsonStoreEnabled({}), false);
assert.equal(isLocalOrderJsonStoreEnabled({
  ALLOW_LOCAL_ORDER_JSON_STORE: "true",
  NODE_ENV: "production",
}), false);
assert.equal(isLocalOrderJsonStoreEnabled({
  ALLOW_LOCAL_ORDER_JSON_STORE: "true",
  VERCEL: "1",
}), false);
assert.throws(
  () => assertLocalOrderJsonStoreEnabled({ NODE_ENV: "production" }),
  /Durable Supabase order storage is required/,
);
assert.throws(
  () => assertLocalOrderJsonStoreEnabled({
    ALLOW_LOCAL_ORDER_JSON_STORE: "true",
    VERCEL: "1",
  }),
  /Durable Supabase order storage is required/,
);

const manualQuotePayload = basePayload();
manualQuotePayload.orderSnapshot.state.width = 500;
assert.throws(
  () => buildServerCheckoutOrder(manualQuotePayload, { orderId: firstServerId, now: fixedNow }),
  (error) => error instanceof ManualQuoteRequiredError && error.statusCode === 422,
  "Manual-quote plaque inputs must be blocked before an order can reach Stripe.",
);

const alteredManualQuoteOrder = {
  ...canonicalOrder,
  plaqueState: { ...canonicalOrder.plaqueState, width: 500 },
};
assert.throws(
  () => buildStripeCheckoutParams(alteredManualQuoteOrder),
  (error) => error instanceof ManualQuoteRequiredError,
  "Stripe must independently refuse a server order that now requires a quote.",
);

const invalidCurrencyPayload = basePayload();
invalidCurrencyPayload.currency = "usd";
assert.throws(
  () => buildServerCheckoutOrder(invalidCurrencyPayload, { orderId: firstServerId, now: fixedNow }),
  /Only GBP checkout is supported/,
);

const invalidProductPayload = basePayload();
invalidProductPayload.orderSnapshot.state.material = "cardboard";
assert.throws(
  () => buildServerCheckoutOrder(invalidProductPayload, { orderId: firstServerId, now: fixedNow }),
  /Unsupported plaque material/,
);

const storedPaymentOrder = {
  ...canonicalOrder,
  stripeCheckoutSessionId: "cs_test_server_checkout",
  paymentStatus: "unpaid",
  status: "checkout_started",
};
const paidStripeSession = {
  id: storedPaymentOrder.stripeCheckoutSessionId,
  payment_status: "paid",
  status: "complete",
  amount_total: storedPaymentOrder.totalPence,
  currency: storedPaymentOrder.currency,
  client_reference_id: storedPaymentOrder.id,
  metadata: { order_id: storedPaymentOrder.id },
  payment_intent: "pi_test_server_checkout",
  customer_details: { email: "customer@example.com", name: "Checkout customer" },
};

assert.equal(isPaidCompleteStripeSession(paidStripeSession), true);
assert.equal(isPaidCompleteStripeSession({ ...paidStripeSession, status: undefined }), true);
assert.equal(isPaidCompleteStripeSession({ ...paidStripeSession, payment_status: "unpaid" }), false);
assert.equal(isPaidCompleteStripeSession({ ...paidStripeSession, status: "open" }), false);
assert.equal(assertStripePaymentMatchesOrder(storedPaymentOrder, paidStripeSession), true);
assert.equal(assertStripePaymentMatchesOrder(storedPaymentOrder, {
  ...paidStripeSession,
  status: undefined,
}), true);

const paymentMismatchCases = [
  ["stored session ID", { ...paidStripeSession, id: "cs_test_wrong" }],
  ["payment status", { ...paidStripeSession, payment_status: "unpaid" }],
  ["checkout status", { ...paidStripeSession, status: "open" }],
  ["amount", { ...paidStripeSession, amount_total: storedPaymentOrder.totalPence - 50 }],
  ["currency", { ...paidStripeSession, currency: "usd" }],
  ["client reference", { ...paidStripeSession, client_reference_id: secondServerId }],
  ["missing client reference", { ...paidStripeSession, client_reference_id: null }],
  ["metadata order ID", { ...paidStripeSession, metadata: { order_id: secondServerId } }],
  ["missing metadata order ID", { ...paidStripeSession, metadata: {} }],
];

for (const [label, session] of paymentMismatchCases) {
  let saveCalled = false;
  await assert.rejects(
    markOrderPaidFromSession(session, {
      getOrderByStripeSession: async () => storedPaymentOrder,
      getOrderById: async () => storedPaymentOrder,
      saveOrder: async (order) => {
        saveCalled = true;
        return order;
      },
      sendAndRecordOrderEmail: async (order) => order,
      getInternalProductionEmails: () => [],
    }),
    (error) => error instanceof StripePaymentVerificationError,
    `${label} mismatch must reject payment finalization.`,
  );
  assert.equal(saveCalled, false, `${label} mismatch must not persist a paid order.`);
}

let savedPaidOrder = null;
const finalizedOrder = await markOrderPaidFromSession(paidStripeSession, {
  getOrderByStripeSession: async () => storedPaymentOrder,
  getOrderById: async () => null,
  saveOrder: async (order) => {
    savedPaidOrder = order;
    return order;
  },
  sendAndRecordOrderEmail: async (order) => order,
  getInternalProductionEmails: () => [],
});
assert.equal(finalizedOrder.paymentStatus, "paid");
assert.equal(finalizedOrder.status, "paid");
assert.equal(savedPaidOrder.stripeCheckoutSessionId, paidStripeSession.id);
assert.equal(savedPaidOrder.stripePaymentIntentId, paidStripeSession.payment_intent);
assert.equal(savedPaidOrder.metadata.checkoutRecoveryToken, null);

const generatedIds = [createServerOrderId(), createServerOrderId()];
for (const id of generatedIds) {
  assert.match(id, /^PSAI-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
}
assert.notEqual(generatedIds[0], generatedIds[1], "Secure order IDs should not repeat.");

const allocatedIds = [firstServerId, secondServerId];
const insertAttempts = [];
const collisionSafeOrder = await createPendingOrder(basePayload(), {
  idFactory: () => allocatedIds.shift(),
  insertOrder: async (order) => {
    insertAttempts.push(order.id);
    if (order.id === firstServerId) throw new OrderIdCollisionError(order.id);
    return order;
  },
});
assert.deepEqual(insertAttempts, [firstServerId, secondServerId]);
assert.equal(collisionSafeOrder.id, secondServerId, "A collision must allocate a new ID, not overwrite an order.");

console.log("Server checkout enforces canonical pricing/artifacts, durable storage gates, protected recovery, idempotency, and strict Stripe payment finalization.");
