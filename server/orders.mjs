import fs from "node:fs/promises";
import path from "node:path";
import { getSupabaseServiceClient } from "./supabase.mjs";
import { getInternalProductionEmails, sendEmail } from "./email.mjs";
import {
  sanitizeOrderSvgFields,
  sanitizeProofPackageSvg,
  sanitizeSvgMarkup,
} from "../services/svgSanitizer.mjs";
import {
  CheckoutRequestError,
  buildServerCheckoutOrder,
  createServerOrderId,
} from "./checkout.mjs";

const storeRoot = process.env.VERCEL ? "/tmp" : process.cwd();
const storePath = path.join(storeRoot, "data", "storefront-orders.json");
const proofAttachmentLocks = new Map();

const nowIso = () => new Date().toISOString();

export const isLocalOrderJsonStoreEnabled = (env = process.env) => (
  env.ALLOW_LOCAL_ORDER_JSON_STORE === "true"
  && !env.VERCEL
  && env.NODE_ENV !== "production"
);

export class DurableOrderStorageError extends CheckoutRequestError {
  constructor() {
    super(
      "Durable Supabase order storage is required for checkout.",
      503,
      "durable_order_storage_required",
    );
    this.name = "DurableOrderStorageError";
  }
}

export const assertLocalOrderJsonStoreEnabled = (env = process.env) => {
  if (!isLocalOrderJsonStoreEnabled(env)) throw new DurableOrderStorageError();
};

const readLocalOrders = async () => {
  assertLocalOrderJsonStoreEnabled();
  try {
    const orders = JSON.parse(await fs.readFile(storePath, "utf8"));
    return Array.isArray(orders) ? orders.map((order) => sanitizeOrderSvgFields(order)) : [];
  } catch {
    return [];
  }
};

const writeLocalOrders = async (orders) => {
  assertLocalOrderJsonStoreEnabled();
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(orders.map((order) => sanitizeOrderSvgFields(order)), null, 2));
};

const shouldUseLocalFallback = (error) => {
  const message = `${error?.code || ""} ${error?.message || ""}`.toLowerCase();
  return message.includes("42p01") || message.includes("pgrst205") || message.includes("storefront_orders");
};

const isMissingProofClaimFunction = (error) => ["42883", "PGRST202"].includes(String(error?.code || "").toUpperCase());

const toRow = (input) => {
  const order = sanitizeOrderSvgFields(input);
  return {
    id: order.id,
    stripe_checkout_session_id: order.stripeCheckoutSessionId || null,
    stripe_payment_intent_id: order.stripePaymentIntentId || null,
    customer_email: order.customerEmail || null,
    customer_name: order.customerName || null,
    status: order.status || "checkout_started",
    payment_status: order.paymentStatus || "unpaid",
    fulfilment_status: order.fulfilmentStatus || "not_started",
    total_pence: order.totalPence || 0,
    currency: order.currency || "gbp",
    product_title: order.productTitle || "Custom plaque",
    inscription: order.inscription || "",
    plaque_state: order.plaqueState || {},
    price_breakdown: order.priceBreakdown || {},
    proof_package: order.proofPackage || {},
    shipping_address: order.shippingAddress || {},
    stripe_session: order.stripeSession || {},
    email_events: order.emailEvents || [],
    events: order.events || [],
    metadata: order.metadata || {},
    approved_at: order.approvedAt || null,
    paid_at: order.paidAt || null,
    updated_at: nowIso(),
  };
};

const listOrderColumns = [
  "id",
  "stripe_checkout_session_id",
  "stripe_payment_intent_id",
  "customer_email",
  "customer_name",
  "status",
  "payment_status",
  "fulfilment_status",
  "total_pence",
  "currency",
  "product_title",
  "inscription",
  "plaque_state",
  "price_breakdown",
  "proof_package",
  "shipping_address",
  "email_events",
  "events",
  "approved_at",
  "paid_at",
  "created_at",
  "updated_at",
].join(",");

const fromRow = (row) => row && sanitizeOrderSvgFields({
  id: row.id,
  stripeCheckoutSessionId: row.stripe_checkout_session_id,
  stripePaymentIntentId: row.stripe_payment_intent_id,
  customerEmail: row.customer_email,
  customerName: row.customer_name,
  status: row.status,
  paymentStatus: row.payment_status,
  fulfilmentStatus: row.fulfilment_status,
  totalPence: row.total_pence,
  currency: row.currency,
  productTitle: row.product_title,
  inscription: row.inscription,
  plaqueState: row.plaque_state || {},
  priceBreakdown: row.price_breakdown || {},
  proofPackage: row.proof_package || {},
  shippingAddress: row.shipping_address || {},
  stripeSession: row.stripe_session || {},
  emailEvents: row.email_events || [],
  events: row.events || [],
  metadata: row.metadata || {},
  approvedAt: row.approved_at,
  paidAt: row.paid_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const orderProofSessionToken = (orderId) => `storefront-order-${orderId}`;

const toProofSessionOrderRow = (input) => {
  const order = sanitizeOrderSvgFields(input);
  return {
    public_token: orderProofSessionToken(order.id),
    email: order.customerEmail || null,
    status: "converted",
    plaque_state: order.plaqueState || {},
    wording: order.inscription || "",
    generated_svg: order.proofPackage?.productionSvg || order.proofPackage?.visualProofSvg || null,
    price_estimate_pence: order.totalPence || 0,
    currency: order.currency || "gbp",
    quote_flags: {},
    metadata: {
      kind: "storefront_order",
      order,
    },
    expires_at: null,
  };
};

const fromProofSessionOrderRow = (row) => {
  const order = row?.metadata?.order;
  if (!order) return null;
  return sanitizeOrderSvgFields({
    ...order,
    customerEmail: order.customerEmail || row.email || "",
    inscription: order.inscription || row.wording || "",
    plaqueState: order.plaqueState || row.plaque_state || {},
    totalPence: order.totalPence || row.price_estimate_pence || 0,
    currency: order.currency || row.currency || "gbp",
    updatedAt: order.updatedAt || row.updated_at,
    createdAt: order.createdAt || row.created_at,
  });
};

const lightweightFallbackOrder = (order) => order && ({
  id: order.id,
  stripeCheckoutSessionId: order.stripeCheckoutSessionId || null,
  stripePaymentIntentId: order.stripePaymentIntentId || null,
  customerEmail: order.customerEmail || "",
  customerName: order.customerName || "",
  status: order.status || "paid",
  paymentStatus: order.paymentStatus || "paid",
  fulfilmentStatus: order.fulfilmentStatus || "not_started",
  totalPence: order.totalPence || 0,
  currency: order.currency || "gbp",
  productTitle: order.productTitle || "Custom plaque",
  inscription: order.inscription || "",
  plaqueState: order.plaqueState || {},
  priceBreakdown: order.priceBreakdown || {},
  proofPackage: order.proofPackage?.visualProofPng ? { visualProofPng: "stored" } : {},
  shippingAddress: order.shippingAddress || {},
  stripeSession: {},
  emailEvents: order.emailEvents || [],
  events: order.events || [],
  metadata: {
    source: order.metadata?.source || "",
    turnaroundWorkingDays: order.metadata?.turnaroundWorkingDays || "",
    turnaroundDays: order.metadata?.turnaroundDays || "",
    turnaroundLabel: order.metadata?.turnaroundLabel || "",
    turnaround: order.metadata?.turnaround || "",
  },
  approvedAt: order.approvedAt || null,
  paidAt: order.paidAt || null,
  createdAt: order.createdAt || null,
  updatedAt: order.updatedAt || null,
});

const paymentIntentId = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.id || null;
};

const shippingFromPaymentIntent = (paymentIntent) => {
  const shipping = paymentIntent?.shipping || {};
  if (!shipping.address) return {};
  return {
    name: shipping.name || "",
    phone: shipping.phone || "",
    ...shipping.address,
  };
};

const saveOrderToProofSessions = async (supabase, order) => {
  const { data, error } = await supabase
    .from("proof_sessions")
    .upsert(toProofSessionOrderRow(order), { onConflict: "public_token" })
    .select("email, wording, plaque_state, price_estimate_pence, currency, metadata, created_at, updated_at")
    .single();
  if (error) throw error;
  return fromProofSessionOrderRow(data) || order;
};

const insertOrderToProofSessions = async (supabase, order) => {
  const { data, error } = await supabase
    .from("proof_sessions")
    .insert(toProofSessionOrderRow(order))
    .select("email, wording, plaque_state, price_estimate_pence, currency, metadata, created_at, updated_at")
    .single();
  if (error) throw error;
  return fromProofSessionOrderRow(data) || order;
};

const getProofSessionOrderById = async (supabase, orderId) => {
  const { data, error } = await supabase
    .from("proof_sessions")
    .select("email, wording, plaque_state, price_estimate_pence, currency, metadata, created_at, updated_at")
    .eq("public_token", orderProofSessionToken(orderId))
    .maybeSingle();
  if (error) throw error;
  return fromProofSessionOrderRow(data);
};

const listProofSessionOrders = async (supabase) => {
  const { data, error } = await supabase
    .from("proof_sessions")
    .select([
      "email",
      "wording",
      "plaque_state",
      "price_estimate_pence",
      "currency",
      "created_at",
      "updated_at",
      "order_id:metadata->order->id",
      "stripe_checkout_session_id:metadata->order->stripeCheckoutSessionId",
      "stripe_payment_intent_id:metadata->order->stripePaymentIntentId",
      "shipping_address:metadata->order->shippingAddress",
      "status:metadata->order->status",
      "payment_status:metadata->order->paymentStatus",
      "fulfilment_status:metadata->order->fulfilmentStatus",
      "customer_email:metadata->order->customerEmail",
      "customer_name:metadata->order->customerName",
      "product_title:metadata->order->productTitle",
      "inscription:metadata->order->inscription",
      "total_pence:metadata->order->totalPence",
      "paid_at:metadata->order->paidAt",
      "approved_at:metadata->order->approvedAt",
    ].join(","))
    .eq("metadata->>kind", "storefront_order")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data.map((row) => {
    const shippingAddress = row.shipping_address && Object.keys(row.shipping_address).length
      ? row.shipping_address
      : shippingFromPaymentIntent(row.stripe_payment_intent_id);
    return {
      id: row.order_id || `PSAI-${new Date(row.created_at || Date.now()).getTime().toString().slice(-6)}`,
      stripeCheckoutSessionId: row.stripe_checkout_session_id || null,
      stripePaymentIntentId: paymentIntentId(row.stripe_payment_intent_id),
      customerEmail: row.customer_email || row.email || "",
      customerName: row.customer_name || shippingAddress.name || "",
      status: row.status || "paid",
      paymentStatus: row.payment_status || "paid",
      fulfilmentStatus: row.fulfilment_status || "not_started",
      totalPence: row.total_pence || row.price_estimate_pence || 0,
      currency: row.currency || "gbp",
      productTitle: row.product_title || "Custom plaque",
      inscription: row.inscription || row.wording || "",
      plaqueState: row.plaque_state || {},
      priceBreakdown: {},
      proofPackage: {},
      shippingAddress,
      stripeSession: {},
      emailEvents: [],
      events: [],
      metadata: {},
      approvedAt: row.approved_at || row.created_at,
      paidAt: row.paid_at || row.created_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
};

const normaliseStatus = (status, fallback = "paid") => {
  const value = String(status || fallback).replace(/-/g, "_");
  const aliases = {
    proof_approved: "paid",
    checkout_started: "checkout_started",
    payment_simulated: "paid",
    hub_queued: "paid",
    needs_check: "issue",
    quote_requested: "issue",
    in_production: "in_production",
    dispatched: "dispatched",
    complete: "complete",
    cancelled: "cancelled",
    refunded: "refunded",
    issue: "issue",
    paid: "paid",
  };
  return aliases[value] || fallback;
};

const normalisePaymentStatus = (status, fallback = "paid") => {
  const value = String(status || fallback).replace(/-/g, "_");
  const aliases = {
    test_paid: "paid",
    requires_check: "unpaid",
    unpaid: "unpaid",
    paid: "paid",
    failed: "failed",
    refunded: "refunded",
  };
  return aliases[value] || fallback;
};

const normaliseFulfilmentStatus = (status, fallback = "not_started") => {
  const value = String(status || fallback).replace(/-/g, "_");
  const aliases = {
    not_started: "not_started",
    in_production: "in_production",
    dispatched: "dispatched",
    delivered: "delivered",
    issue: "issue",
  };
  return aliases[value] || fallback;
};

const normaliseExternalOrder = (input) => {
  const order = input?.order || input || {};
  const now = nowIso();
  const source = String(input?.source || order.source || order.metadata?.source || "external-storefront")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "external-storefront";
  const externalId = String(order.id || order.orderId || input?.orderId || "").trim();
  const id = externalId || `${source}-${Date.now().toString(36)}`;

  return {
    id,
    stripeCheckoutSessionId: order.stripeCheckoutSessionId || order.stripe_checkout_session_id || null,
    stripePaymentIntentId: order.stripePaymentIntentId || order.stripe_payment_intent_id || null,
    customerEmail: order.customerEmail || order.customer_email || input?.customerEmail || "",
    customerName: order.customerName || order.customer_name || input?.customerName || "",
    status: normaliseStatus(order.status, "paid"),
    paymentStatus: normalisePaymentStatus(order.paymentStatus || order.payment_status, "paid"),
    fulfilmentStatus: normaliseFulfilmentStatus(order.fulfilmentStatus || order.fulfilment_status, "not_started"),
    totalPence: Math.round(Number(order.totalPence ?? order.total_pence ?? input?.totalPence ?? 0)),
    currency: order.currency || "gbp",
    productTitle: order.productTitle || order.product_title || input?.productTitle || "Custom plaque",
    inscription: order.inscription || order.wording || "",
    plaqueState: order.plaqueState || order.plaque_state || {},
    priceBreakdown: order.priceBreakdown || order.price_breakdown || {},
    proofPackage: order.proofPackage || order.proof_package || {},
    shippingAddress: order.shippingAddress || order.shipping_address || {},
    stripeSession: order.stripeSession || order.stripe_session || {},
    emailEvents: order.emailEvents || order.email_events || [],
    events: [
      {
        type: "storefront_ingested",
        label: `Order received from ${source}`,
        at: order.createdAt || order.created_at || now,
      },
      ...(order.events || []),
    ],
    metadata: {
      ...(order.metadata || {}),
      source,
      sourceOrderId: externalId || order.metadata?.sourceOrderId || "",
      payloadVersion: input?.payloadVersion || order.metadata?.payloadVersion || "2026-06-25",
    },
    approvedAt: order.approvedAt || order.approved_at || null,
    paidAt: order.paidAt || order.paid_at || (order.paymentStatus === "paid" || order.payment_status === "paid" ? now : null),
    createdAt: order.createdAt || order.created_at || now,
    updatedAt: now,
  };
};

const saveOrder = async (order) => {
  const next = sanitizeOrderSvgFields({ ...order, updatedAt: nowIso() });
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("storefront_orders")
      .upsert(toRow(next), { onConflict: "id" })
      .select("*")
      .single();
    if (error && !shouldUseLocalFallback(error)) throw error;
    if (error && shouldUseLocalFallback(error)) {
      try {
        return await saveOrderToProofSessions(supabase, next);
      } catch {
        const orders = await readLocalOrders();
        await writeLocalOrders([next, ...orders.filter((item) => item.id !== next.id)]);
        return next;
      }
    }
    return fromRow(data);
  }

  const orders = await readLocalOrders();
  await writeLocalOrders([next, ...orders.filter((item) => item.id !== next.id)]);
  return next;
};

export class OrderIdCollisionError extends Error {
  constructor(orderId) {
    super(`Order ID ${orderId} is already in use.`);
    this.name = "OrderIdCollisionError";
    this.code = "order_id_collision";
    this.orderId = orderId;
  }
}

const isUniqueViolation = (error) => (
  error instanceof OrderIdCollisionError
  || error?.code === "23505"
  || error?.code === "order_id_collision"
);

const insertNewOrder = async (order) => {
  const next = { ...order, updatedAt: nowIso() };
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("storefront_orders")
      .insert(toRow(next))
      .select("*")
      .single();
    if (error && isUniqueViolation(error)) throw new OrderIdCollisionError(next.id);
    if (error && !shouldUseLocalFallback(error)) throw error;
    if (error && shouldUseLocalFallback(error)) {
      try {
        return await insertOrderToProofSessions(supabase, next);
      } catch (proofSessionError) {
        if (isUniqueViolation(proofSessionError)) throw new OrderIdCollisionError(next.id);
        const orders = await readLocalOrders();
        if (orders.some((item) => item.id === next.id)) throw new OrderIdCollisionError(next.id);
        await writeLocalOrders([next, ...orders]);
        return next;
      }
    }
    return fromRow(data);
  }

  const orders = await readLocalOrders();
  if (orders.some((item) => item.id === next.id)) throw new OrderIdCollisionError(next.id);
  await writeLocalOrders([next, ...orders]);
  return next;
};

export const createPendingOrder = async (payload, dependencies = {}) => {
  const idFactory = dependencies.idFactory || createServerOrderId;
  const insertOrder = dependencies.insertOrder || insertNewOrder;
  const maxAttempts = dependencies.maxAttempts || 5;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const order = buildServerCheckoutOrder(payload, { orderId: idFactory() });
    try {
      return await insertOrder(order);
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }
  }

  throw new CheckoutRequestError(
    "Could not allocate a unique order ID. Please try checkout again.",
    503,
    "order_id_allocation_failed",
  );
};

export const createExternalOrder = async (payload) => {
  return saveOrder(normaliseExternalOrder(payload));
};

export const attachStripeSessionToOrder = async (orderId, session) => {
  const order = await getOrderById(orderId);
  if (!order) throw new Error(`Order ${orderId} was not found.`);
  if (order.stripeCheckoutSessionId && session?.id !== order.stripeCheckoutSessionId) {
    throw new StripePaymentVerificationError("Stripe session ID did not match the stored checkout session.");
  }
  if (session?.client_reference_id && session.client_reference_id !== order.id) {
    throw new StripePaymentVerificationError("Stripe client reference did not match the server order.");
  }
  if (session?.metadata?.order_id && session.metadata.order_id !== order.id) {
    throw new StripePaymentVerificationError("Stripe metadata did not match the server order.");
  }
  return saveOrder({
    ...order,
    stripeCheckoutSessionId: session.id || order.stripeCheckoutSessionId,
    stripePaymentIntentId: session.payment_intent || session.paymentIntentId || order.stripePaymentIntentId,
    stripeSession: session,
  });
};

export const prepareVisualProofAttachment = (order, payload = {}) => {
  const sessionId = String(payload.stripeCheckoutSessionId || "").trim();
  const storedSessionId = String(order?.stripeCheckoutSessionId || "").trim();
  if (!storedSessionId || !sessionId || sessionId !== storedSessionId) {
    throw new Error("Proof image did not match the checkout session.");
  }

  if (String(order.proofPackage?.visualProofPng || "").trim()) {
    return { attached: false, order };
  }

  const visualProofPng = String(payload.visualProofPng || "").trim();
  const visualProofSvg = sanitizeSvgMarkup(String(payload.visualProofSvg || "").trim()) || "";
  const existingProofPackage = sanitizeProofPackageSvg(order.proofPackage || {});
  const productionArtworkPdf = String(payload.productionArtworkPdf || "").trim();
  const visualProofRendererVersion = Number(payload.visualProofRendererVersion || 0);
  if (!visualProofPng.startsWith("data:image/png;base64,") && !/^[a-z0-9+/]+=*$/i.test(visualProofPng)) {
    throw new Error("Proof image must be a PNG data URL or base64 PNG.");
  }
  if (
    productionArtworkPdf &&
    !productionArtworkPdf.startsWith("data:application/pdf;base64,") &&
    !/^[a-z0-9+/]+=*$/i.test(productionArtworkPdf)
  ) {
    throw new Error("Production artwork must be a PDF data URL or base64 PDF.");
  }

  return {
    attached: true,
    order: {
      ...order,
      proofPackage: {
        ...existingProofPackage,
        visualProofSvg: visualProofSvg || existingProofPackage.visualProofSvg || null,
        visualProofPng,
        visualProofRendererVersion: Number.isFinite(visualProofRendererVersion) && visualProofRendererVersion > 0
          ? visualProofRendererVersion
          : existingProofPackage.visualProofRendererVersion || null,
        productionArtworkPdf: productionArtworkPdf || existingProofPackage.productionArtworkPdf || null,
      },
      events: [
        { type: "proof_image_attached", label: "Browser-rendered proof image attached", at: nowIso() },
        ...(order.events || []),
      ],
    },
  };
};

export const shouldSendCustomerProofEmail = (attachment) => Boolean(
  attachment?.attached && String(attachment?.order?.customerEmail || "").trim(),
);

const withProofAttachmentLock = async (orderId, operation) => {
  const previous = proofAttachmentLocks.get(orderId) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => {
    release = resolve;
  });
  proofAttachmentLocks.set(orderId, current);
  await previous;
  try {
    return await operation();
  } finally {
    release();
    if (proofAttachmentLocks.get(orderId) === current) proofAttachmentLocks.delete(orderId);
  }
};

const claimVisualProofInStorefrontOrders = async (originalOrder, preparedOrder) => {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("claim_storefront_order_proof", {
    p_order_id: originalOrder.id,
    p_stripe_checkout_session_id: originalOrder.stripeCheckoutSessionId,
    p_proof_package: preparedOrder.proofPackage,
    p_event: preparedOrder.events[0],
  });
  if (error) {
    if (isMissingProofClaimFunction(error)) return null;
    throw error;
  }

  const claimedRow = Array.isArray(data) ? data[0] : data;
  if (claimedRow) return { attached: true, order: fromRow(claimedRow) };

  const storedOrder = await getOrderById(originalOrder.id);
  if (
    storedOrder?.stripeCheckoutSessionId === originalOrder.stripeCheckoutSessionId
    && String(storedOrder.proofPackage?.visualProofPng || "").trim()
  ) {
    return { attached: false, order: storedOrder };
  }
  throw new Error("Proof image could not be claimed without replacing an existing artifact.");
};

export const attachVisualProofToOrder = async (orderId, payload = {}) => withProofAttachmentLock(orderId, async () => {
  const order = await getOrderById(orderId);
  if (!order) throw new Error(`Order ${orderId} was not found.`);
  const prepared = prepareVisualProofAttachment(order, payload);
  if (!prepared.attached) return prepared;
  const claimed = await claimVisualProofInStorefrontOrders(order, prepared.order);
  if (claimed) return claimed;
  return { attached: true, order: await saveOrder(prepared.order) };
});

export const getOrderById = async (orderId) => {
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("storefront_orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();
    if (error && !shouldUseLocalFallback(error)) throw error;
    if (error && shouldUseLocalFallback(error)) {
      try {
        const order = await getProofSessionOrderById(supabase, orderId);
        if (order) return order;
      } catch {
        // Fall through to the local emergency store.
      }
      const orders = await readLocalOrders();
      return orders.find((order) => order.id === orderId) || null;
    }
    if (data) return fromRow(data);
    try {
      const order = await getProofSessionOrderById(supabase, orderId);
      if (order) return order;
    } catch {
      // Fall through to the local emergency store.
    }
    const orders = await readLocalOrders();
    return orders.find((order) => order.id === orderId) || null;
  }

  const orders = await readLocalOrders();
  return orders.find((order) => order.id === orderId) || null;
};

export const getOrderByStripeSession = async (sessionId) => {
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("storefront_orders")
      .select("*")
      .eq("stripe_checkout_session_id", sessionId)
      .maybeSingle();
    if (error && !shouldUseLocalFallback(error)) throw error;
    if (error && shouldUseLocalFallback(error)) {
      try {
        const orders = await listProofSessionOrders(supabase);
        const order = orders.find((order) => order.stripeCheckoutSessionId === sessionId);
        if (order) return order;
      } catch {
        // Fall through to the local emergency store.
      }
      const orders = await readLocalOrders();
      return orders.find((order) => order.stripeCheckoutSessionId === sessionId) || null;
    }
    return fromRow(data);
  }

  const orders = await readLocalOrders();
  return orders.find((order) => order.stripeCheckoutSessionId === sessionId) || null;
};

export const listOrders = async () => {
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("storefront_orders")
      .select(listOrderColumns)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error && !shouldUseLocalFallback(error)) throw error;
    if (error && shouldUseLocalFallback(error)) {
      try {
        return await listProofSessionOrders(supabase);
      } catch {
        return readLocalOrders();
      }
    }
    const storefrontOrders = data.map(fromRow);
    if (storefrontOrders.length) return storefrontOrders;
    try {
      const fallbackOrders = await listProofSessionOrders(supabase);
      if (fallbackOrders.length) return fallbackOrders;
    } catch {
      // Keep the primary storefront result if the legacy fallback cannot be read.
    }
    return storefrontOrders;
  }

  return readLocalOrders();
};

export const addOrderEvent = async (orderId, event) => {
  const order = await getOrderById(orderId);
  if (!order) throw new Error(`Order ${orderId} was not found.`);
  const nextEvent = { ...event, at: event.at || nowIso() };
  return saveOrder({ ...order, events: [nextEvent, ...(order.events || [])] });
};

export class StripePaymentVerificationError extends CheckoutRequestError {
  constructor(message) {
    super(message, 409, "stripe_payment_verification_failed");
    this.name = "StripePaymentVerificationError";
  }
}

export const isPaidCompleteStripeSession = (session) => (
  session?.payment_status === "paid"
  && (session?.status === undefined || session?.status === null || session?.status === "complete")
);

export const assertStripePaymentMatchesOrder = (order, session) => {
  if (!order) throw new StripePaymentVerificationError("Paid Stripe session could not be matched to an order.");
  if (!session?.id || !order.stripeCheckoutSessionId || session.id !== order.stripeCheckoutSessionId) {
    throw new StripePaymentVerificationError("Stripe session ID did not match the stored checkout session.");
  }
  if (session.payment_status !== "paid") {
    throw new StripePaymentVerificationError("Stripe has not marked this checkout as paid.");
  }
  if (session.status !== undefined && session.status !== null && session.status !== "complete") {
    throw new StripePaymentVerificationError("Stripe checkout is not complete.");
  }
  if (!Number.isInteger(session.amount_total) || session.amount_total !== order.totalPence) {
    throw new StripePaymentVerificationError("Stripe payment amount did not match the server order total.");
  }
  if (
    typeof session.currency !== "string"
    || session.currency.toLowerCase() !== String(order.currency || "").toLowerCase()
  ) {
    throw new StripePaymentVerificationError("Stripe payment currency did not match the server order currency.");
  }
  if (session.client_reference_id !== order.id) {
    throw new StripePaymentVerificationError("Stripe client reference did not match the server order.");
  }
  if (session.metadata?.order_id !== order.id) {
    throw new StripePaymentVerificationError("Stripe metadata did not match the server order.");
  }
  return true;
};

export const markOrderPaidFromSession = async (session, dependencies = {}) => {
  const findByStripeSession = dependencies.getOrderByStripeSession || getOrderByStripeSession;
  const findById = dependencies.getOrderById || getOrderById;
  const persistOrder = dependencies.saveOrder || saveOrder;
  const sendRecordedEmail = dependencies.sendAndRecordOrderEmail || sendAndRecordOrderEmail;
  const internalProductionEmails = dependencies.getInternalProductionEmails || getInternalProductionEmails;
  const sessionId = session?.id;
  if (!sessionId) throw new StripePaymentVerificationError("Stripe session ID is required.");
  const referencedOrderId = session?.client_reference_id;
  const order = await findByStripeSession(sessionId)
    || (referencedOrderId ? await findById(referencedOrderId) : null);
  assertStripePaymentMatchesOrder(order, session);

  const wasAlreadyPaid = order.paymentStatus === "paid";
  const shipping = session?.shipping_details || session?.shipping || {};
  const customer = session?.customer_details || {};
  const customerEmail = customer.email || session.customer_email || order.customerEmail;
  const customerName = customer.name || shipping.name || order.customerName;
  const paidAt = order.paidAt || nowIso();
  const paymentEvent = wasAlreadyPaid
    ? []
    : [{ type: "payment_received", label: "Payment received", at: paidAt }];
  const next = await persistOrder({
    ...order,
    customerEmail,
    customerName,
    status: "paid",
    paymentStatus: "paid",
    fulfilmentStatus: order.fulfilmentStatus || "not_started",
    stripeCheckoutSessionId: sessionId || order.stripeCheckoutSessionId,
    stripePaymentIntentId: paymentIntentId(session.payment_intent) || order.stripePaymentIntentId,
    shippingAddress: shipping.address ? { name: shipping.name, phone: customer.phone || session.phone_number || "", ...shipping.address } : order.shippingAddress,
    stripeSession: session,
    metadata: {
      ...(order.metadata || {}),
      checkoutRecoveryToken: null,
    },
    paidAt,
    events: [
      ...paymentEvent,
      ...(order.events || []),
    ],
  });

  if (!wasAlreadyPaid) {
    await sendRecordedEmail(next, "customer-order-confirmation", customerEmail);

    if (next.proofPackage?.productionArtworkPdf) {
      for (const internalEmail of internalProductionEmails()) {
        await sendRecordedEmail(next, "admin-new-paid-order", internalEmail).catch(() => null);
      }
    }
  }

  return next;
};

export const sendAndRecordOrderEmail = async (order, template, recipient, extra = {}) => {
  const result = await sendEmail({ to: recipient, template, order, extra });
  const event = {
    id: `${order.id}-${template}-${Date.now()}`,
    type: template,
    recipient,
    status: result.status,
    provider: result.provider || "local",
    providerId: result.id || null,
    subject: result.message?.subject || "",
    at: nowIso(),
  };
  return saveOrder({
    ...order,
    emailEvents: [event, ...(order.emailEvents || [])],
    events: [
      { type: "email", label: `${template} email ${result.status}`, at: event.at, recipient },
      ...(order.events || []),
    ],
  });
};

export const updateOrderStatus = async (orderId, payload) => {
  const order = await getOrderById(orderId);
  if (!order) throw new Error(`Order ${orderId} was not found.`);
  const status = payload.status || order.status;
  const fulfilmentStatus = payload.fulfilmentStatus || order.fulfilmentStatus;
  const event = {
    type: "status_changed",
    label: `Status changed to ${status}`,
    at: nowIso(),
    note: payload.note || "",
    trackingReference: payload.trackingReference || "",
  };
  return saveOrder({
    ...order,
    status,
    fulfilmentStatus,
    events: [event, ...(order.events || [])],
    metadata: {
      ...(order.metadata || {}),
      trackingReference: payload.trackingReference || order.metadata?.trackingReference || "",
    },
  });
};

const reviewFollowUpDelayMs = () => {
  const days = Number(process.env.REVIEW_FOLLOWUP_DAYS || 3);
  return Number.isFinite(days) && days > 0 ? days * 24 * 60 * 60 * 1000 : 0;
};

const dispatchedAtForOrder = (order) => {
  const events = order.events || [];
  const dispatchedEvent = events.find((event) =>
    event.trackingReference ||
    String(event.label || "").toLowerCase().includes("dispatched") ||
    String(event.note || "").toLowerCase().includes("dispatched")
  );
  return dispatchedEvent?.at || order.metadata?.dispatchedAt || order.updatedAt;
};

export const processReviewFollowUps = async () => {
  const delayMs = reviewFollowUpDelayMs();
  if (!delayMs) return { checked: 0, sent: 0, skipped: "disabled" };

  const orders = await listOrders();
  let sent = 0;
  const now = Date.now();

  for (const order of orders) {
    if (order.fulfilmentStatus !== "dispatched" && order.status !== "dispatched") continue;
    if (!order.customerEmail) continue;
    if ((order.emailEvents || []).some((event) => event.type === "customer-review-request")) continue;

    const dispatchedAt = Date.parse(dispatchedAtForOrder(order) || "");
    if (!Number.isFinite(dispatchedAt) || now - dispatchedAt < delayMs) continue;

    await sendAndRecordOrderEmail(order, "customer-review-request", order.customerEmail);
    sent += 1;
  }

  return { checked: orders.length, sent };
};
