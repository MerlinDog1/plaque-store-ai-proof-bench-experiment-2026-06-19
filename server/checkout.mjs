import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import {
  CHECKOUT_CURRENCY,
  CHECKOUT_POLICY_VERSION,
  getCheckoutPriceBreakdown,
  getPlaqueSummaryTitle,
  validateCheckoutPlaqueState,
} from "../services/checkoutPolicy.mjs";

const MAX_INSCRIPTION_LENGTH = 4_000;
const MAX_EMAIL_LENGTH = 254;
const MAX_NAME_LENGTH = 120;
const SAFE_CLIENT_ORDER_ID = /^[A-Za-z0-9_-]{1,100}$/;
const SERVER_ORDER_ID = /^PSAI-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CHECKOUT_RECOVERY_TOKEN = /^[A-Za-z0-9_-]{43}$/;
const CANONICAL_SITE_URL = "https://instaplaque.co.uk";

const isRecord = (value) => Boolean(value && typeof value === "object" && !Array.isArray(value));

export class CheckoutRequestError extends Error {
  constructor(message, statusCode = 400, code = "invalid_checkout_request") {
    super(message);
    this.name = "CheckoutRequestError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class ManualQuoteRequiredError extends CheckoutRequestError {
  constructor(reasons = []) {
    const detail = reasons.length ? ` (${reasons.join(", ")})` : "";
    super(
      `This plaque needs a manual quote before payment${detail}.`,
      422,
      "manual_quote_required",
    );
    this.name = "ManualQuoteRequiredError";
    this.quoteReasons = reasons;
  }
}

export const createServerOrderId = () => `PSAI-${randomUUID()}`;
export const createCheckoutRecoveryToken = () => randomBytes(32).toString("base64url");

export const resolveCheckoutOrigin = (requestedOrigin = "", env = process.env) => {
  const configuredOrigin = String(env.PUBLIC_SITE_URL || "").trim();
  const candidate = configuredOrigin || String(requestedOrigin || "").trim() || CANONICAL_SITE_URL;
  let url;
  try {
    url = new URL(candidate);
  } catch {
    throw new CheckoutRequestError("Invalid checkout origin.");
  }

  const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(url.hostname)
    && (url.protocol === "http:" || url.protocol === "https:");
  const isCanonical = url.protocol === "https:" && url.hostname === "instaplaque.co.uk";
  const isVercelPreview = url.protocol === "https:"
    && /^instaplaque(?:-[^.]+)?\.vercel\.app$/i.test(url.hostname);
  const isDeployedRuntime = Boolean(env.VERCEL) || env.NODE_ENV === "production";
  const localCheckoutEnabled = env.ALLOW_LOCAL_CHECKOUT_ORIGIN === "true" && !isDeployedRuntime;
  const isAllowedLocal = isLocal && localCheckoutEnabled;
  const isTrustedConfiguredOrigin = Boolean(configuredOrigin && url.protocol === "https:" && !isLocal);

  if (!isAllowedLocal && !isCanonical && !isVercelPreview && !isTrustedConfiguredOrigin) {
    throw new CheckoutRequestError("Unsupported checkout origin.");
  }
  if (isVercelPreview) return CANONICAL_SITE_URL;
  return url.origin;
};

const getOrderSnapshot = (payload) => {
  if (!isRecord(payload)) throw new CheckoutRequestError("Invalid checkout request.");
  const order = payload.orderSnapshot || payload.order;
  if (!isRecord(order)) {
    throw new CheckoutRequestError("Missing approved order details for checkout.");
  }
  return order;
};

const normaliseCurrency = (value) => {
  if (value === undefined || value === null || value === "") return CHECKOUT_CURRENCY;
  if (typeof value !== "string" || value.trim().toLowerCase() !== CHECKOUT_CURRENCY) {
    throw new CheckoutRequestError("Only GBP checkout is supported.");
  }
  return CHECKOUT_CURRENCY;
};

const normaliseShortText = (value, field, maxLength, { allowEmpty = true } = {}) => {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") throw new CheckoutRequestError(`${field} is invalid.`);
  const result = value.trim();
  if (!allowEmpty && !result) throw new CheckoutRequestError(`${field} is required.`);
  if (result.length > maxLength) throw new CheckoutRequestError(`${field} is too long.`);
  return result;
};

const normaliseEmail = (value) => {
  const email = normaliseShortText(value, "Customer email", MAX_EMAIL_LENGTH).toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new CheckoutRequestError("Customer email is invalid.");
  }
  return email;
};

const normaliseInscription = (value) => {
  if (typeof value !== "string") throw new CheckoutRequestError("Plaque inscription is invalid.");
  if (value.length > MAX_INSCRIPTION_LENGTH) {
    throw new CheckoutRequestError("Plaque inscription is too long.");
  }
  return value;
};

const normaliseDeliveryAddress = (input) => {
  if (input === undefined || input === null) return {};
  if (!isRecord(input)) throw new CheckoutRequestError("Delivery address is invalid.");
  const field = (key, maxLength) => normaliseShortText(input[key], `Delivery ${key}`, maxLength);
  const country = field("country", 80);
  if (country && !/^(gb|uk|united kingdom)$/i.test(country)) {
    throw new CheckoutRequestError("Stripe checkout currently supports UK delivery only.");
  }
  return {
    line1: field("line1", 160),
    line2: field("line2", 160),
    town: field("town", 100),
    postcode: field("postcode", 20),
    country: country ? "GB" : "",
  };
};

const canonicalProofPackage = (orderId, lockedAt) => ({
  productionSvg: null,
  visualProofSvg: null,
  visualProofPng: null,
  productionArtworkPdf: null,
  artworkStatus: "pending_sanitized_upload",
  artifactAuthority: "none",
  productionFilename: `${orderId}-production-proof.svg`,
  visualFilename: `${orderId}-visual-proof.svg`,
  lockedAt,
});

const stripClientArtworkFromPlaqueState = (state) => {
  const {
    productionSvg: _productionSvg,
    visualProofSvg: _visualProofSvg,
    visualProofPng: _visualProofPng,
    productionArtworkPdf: _productionArtworkPdf,
    ...canonicalState
  } = state;
  return {
    ...canonicalState,
    generatedSvgContent: null,
    memorialImageSvg: null,
    memorialImageSourceUrl: null,
    memorialImagePreviewUrl: null,
    conceptImageUrl: null,
    etchmasterStyleReferenceUrl: null,
    aiReasoning: null,
  };
};

const canonicalProductionSpec = (state) => ({
  widthMm: state.width,
  heightMm: state.height,
  shape: state.shape,
  material: state.material,
  fixing: state.fixing,
  fixingHoleCount: state.fixingHoleCount,
  wood: state.wood,
});

const assertClientPriceHint = (value, canonicalPence, field, multiplier = 1) => {
  if (value === undefined || value === null || value === "") return;
  if (!Number.isFinite(value)) throw new CheckoutRequestError(`${field} is invalid.`);
  const hintedPence = Math.round(value * multiplier);
  if (hintedPence !== canonicalPence) {
    throw new CheckoutRequestError(
      "The displayed price has changed. Please refresh the proof before checkout.",
      409,
      "checkout_price_changed",
    );
  }
};

const validateClientPriceHints = (payload, order, canonicalPence) => {
  assertClientPriceHint(payload.totalPence, canonicalPence, "Checkout total");
  assertClientPriceHint(order.total, canonicalPence, "Order total", 100);
  if (isRecord(order.priceBreakdown)) {
    assertClientPriceHint(order.priceBreakdown.total, canonicalPence, "Price breakdown total", 100);
  }
};

const safeClientOrderId = (value) => {
  const candidate = typeof value === "string" ? value.trim() : "";
  return SAFE_CLIENT_ORDER_ID.test(candidate) ? candidate : "";
};

export const buildServerCheckoutOrder = (
  payload,
  {
    orderId = createServerOrderId(),
    recoveryToken = createCheckoutRecoveryToken(),
    now = new Date(),
  } = {},
) => {
  if (!SERVER_ORDER_ID.test(orderId)) {
    throw new CheckoutRequestError("Invalid server order ID.", 500, "invalid_server_order");
  }
  if (!CHECKOUT_RECOVERY_TOKEN.test(recoveryToken)) {
    throw new CheckoutRequestError("Invalid checkout recovery token.", 500, "invalid_server_order");
  }
  const order = getOrderSnapshot(payload);
  normaliseCurrency(payload.currency);
  normaliseCurrency(order.currency);

  let plaqueState;
  try {
    plaqueState = validateCheckoutPlaqueState(order.state || order.plaqueState || payload.plaqueState);
  } catch (error) {
    throw new CheckoutRequestError(error instanceof Error ? error.message : "Invalid plaque configuration.");
  }

  const inscription = normaliseInscription(order.inscription ?? payload.inscription ?? "");
  const priceBreakdown = getCheckoutPriceBreakdown(plaqueState, inscription);
  if (priceBreakdown.quoteRequired) {
    throw new ManualQuoteRequiredError(priceBreakdown.quoteReasons);
  }

  const totalPence = Math.round(priceBreakdown.total * 100);
  const productTitle = getPlaqueSummaryTitle(plaqueState);
  validateClientPriceHints(payload, order, totalPence);

  if (order.proofApproved !== true) {
    throw new CheckoutRequestError("Approve the proof before payment.", 422, "proof_not_approved");
  }

  const createdAt = now instanceof Date ? now.toISOString() : new Date(now).toISOString();
  const publicOrigin = resolveCheckoutOrigin(payload.origin);
  const customerEmail = normaliseEmail(order.customerEmail ?? payload.customerEmail ?? "");
  const customerName = normaliseShortText(
    order.customerName ?? payload.customerName ?? "",
    "Customer name",
    MAX_NAME_LENGTH,
  );
  plaqueState = stripClientArtworkFromPlaqueState(plaqueState);

  return {
    id: orderId,
    stripeCheckoutSessionId: null,
    stripePaymentIntentId: null,
    customerEmail,
    customerName,
    status: "checkout_started",
    paymentStatus: "unpaid",
    fulfilmentStatus: "not_started",
    totalPence,
    currency: CHECKOUT_CURRENCY,
    productTitle,
    inscription,
    plaqueState,
    priceBreakdown,
    proofPackage: canonicalProofPackage(orderId, createdAt),
    shippingAddress: normaliseDeliveryAddress(order.deliveryAddress || payload.deliveryAddress),
    stripeSession: {},
    emailEvents: [],
    events: [
      {
        type: "checkout_started",
        label: "Checkout started",
        at: createdAt,
      },
    ],
    metadata: {
      source: "instaplaque-checkout",
      pricingAuthority: "server",
      checkoutPolicyVersion: CHECKOUT_POLICY_VERSION,
      clientOrderId: safeClientOrderId(order.id || payload.orderId),
      publicOrigin,
      checkoutRecoveryToken: recoveryToken,
      productionAuthority: "canonical_plaque_state",
      productionSpec: canonicalProductionSpec(plaqueState),
    },
    approvedAt: createdAt,
    paidAt: null,
    createdAt,
    updatedAt: createdAt,
  };
};

export const checkoutRecoveryTokenMatches = (order, suppliedToken) => {
  const storedToken = String(order?.metadata?.checkoutRecoveryToken || "");
  const candidate = String(suppliedToken || "");
  if (!CHECKOUT_RECOVERY_TOKEN.test(storedToken) || !CHECKOUT_RECOVERY_TOKEN.test(candidate)) return false;
  const stored = Buffer.from(storedToken);
  const supplied = Buffer.from(candidate);
  return stored.length === supplied.length && timingSafeEqual(stored, supplied);
};

export const stripCheckoutSecretsFromOrder = (order) => {
  if (!order) return order;
  const { checkoutRecoveryToken: _checkoutRecoveryToken, ...metadata } = order.metadata || {};
  const { cancel_url: _cancelUrl, ...stripeSession } = order.stripeSession || {};
  return { ...order, metadata, stripeSession };
};

export const assertServerCheckoutOrderIsPayable = (order) => {
  if (!isRecord(order) || order.metadata?.pricingAuthority !== "server") {
    throw new CheckoutRequestError("Stripe checkout requires a server-priced order.", 500, "invalid_server_order");
  }
  const currency = normaliseCurrency(order.currency);
  let plaqueState;
  try {
    plaqueState = validateCheckoutPlaqueState(order.plaqueState);
  } catch (error) {
    throw new CheckoutRequestError(
      error instanceof Error ? error.message : "Invalid server order configuration.",
      500,
      "invalid_server_order",
    );
  }
  const priceBreakdown = getCheckoutPriceBreakdown(plaqueState, order.inscription || "");
  if (priceBreakdown.quoteRequired) throw new ManualQuoteRequiredError(priceBreakdown.quoteReasons);
  const totalPence = Math.round(priceBreakdown.total * 100);
  if (!Number.isInteger(order.totalPence) || order.totalPence !== totalPence) {
    throw new CheckoutRequestError("Server order price did not pass verification.", 500, "invalid_server_order");
  }
  const productTitle = getPlaqueSummaryTitle(plaqueState);
  if (order.productTitle !== productTitle || !SERVER_ORDER_ID.test(String(order.id || ""))) {
    throw new CheckoutRequestError("Server order product did not pass verification.", 500, "invalid_server_order");
  }
  const productionSpec = canonicalProductionSpec(plaqueState);
  const storedProductionSpec = order.metadata?.productionSpec;
  if (
    order.metadata?.productionAuthority !== "canonical_plaque_state"
    || !isRecord(storedProductionSpec)
    || Object.entries(productionSpec).some(([key, value]) => storedProductionSpec[key] !== value)
  ) {
    throw new CheckoutRequestError("Server production specification did not pass verification.", 500, "invalid_server_order");
  }
  return { currency, plaqueState, priceBreakdown, productTitle, totalPence };
};
