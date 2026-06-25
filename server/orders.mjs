import fs from "node:fs/promises";
import path from "node:path";
import { getSupabaseServiceClient } from "./supabase.mjs";
import { getAdminEmail, sendEmail } from "./email.mjs";

const storePath = path.join(process.cwd(), "data", "storefront-orders.json");

const nowIso = () => new Date().toISOString();

const readLocalOrders = async () => {
  try {
    return JSON.parse(await fs.readFile(storePath, "utf8"));
  } catch {
    return [];
  }
};

const writeLocalOrders = async (orders) => {
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(orders, null, 2));
};

const shouldUseLocalFallback = (error) => {
  const message = `${error?.code || ""} ${error?.message || ""}`.toLowerCase();
  return message.includes("42p01") || message.includes("pgrst205") || message.includes("storefront_orders");
};

const toRow = (order) => ({
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
});

const fromRow = (row) => row && ({
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

const normaliseFromMockOrder = (input) => {
  const order = input?.orderSnapshot || input?.order || input || {};
  const createdAt = order.createdAt || nowIso();
  return {
    id: String(order.id || input.orderId || `PSAI-${Date.now().toString().slice(-6)}`),
    stripeCheckoutSessionId: order.stripeSimulation?.checkoutSessionId || null,
    stripePaymentIntentId: order.stripeSimulation?.paymentIntentId || null,
    customerEmail: order.customerEmail || input.customerEmail || "",
    customerName: order.customerName || input.customerName || "",
    status: "checkout_started",
    paymentStatus: "unpaid",
    fulfilmentStatus: "not_started",
    totalPence: Number.isInteger(input.totalPence)
      ? input.totalPence
      : Math.round(Number(order.total || 0) * 100),
    currency: "gbp",
    productTitle: order.productTitle || input.productTitle || "Custom plaque",
    inscription: order.inscription || "",
    plaqueState: order.state || order.plaqueState || {},
    priceBreakdown: order.priceBreakdown || {},
    proofPackage: order.proofPackage || {},
    shippingAddress: order.deliveryAddress || {},
    stripeSession: {},
    emailEvents: order.emailEvents || [],
    events: [
      {
        type: "checkout_started",
        label: "Checkout started",
        at: createdAt,
      },
    ],
    metadata: {
      source: "instaplaque-checkout",
      mockOrder: order,
    },
    approvedAt: order.proofPackage?.lockedAt || createdAt,
    paidAt: null,
    createdAt,
    updatedAt: createdAt,
  };
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
  const next = { ...order, updatedAt: nowIso() };
  const supabase = getSupabaseServiceClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("storefront_orders")
      .upsert(toRow(next), { onConflict: "id" })
      .select("*")
      .single();
    if (error && !shouldUseLocalFallback(error)) throw error;
    if (error && shouldUseLocalFallback(error)) {
      const orders = await readLocalOrders();
      await writeLocalOrders([next, ...orders.filter((item) => item.id !== next.id)]);
      return next;
    }
    return fromRow(data);
  }

  const orders = await readLocalOrders();
  await writeLocalOrders([next, ...orders.filter((item) => item.id !== next.id)]);
  return next;
};

export const createPendingOrder = async (payload) => {
  return saveOrder(normaliseFromMockOrder(payload));
};

export const createExternalOrder = async (payload) => {
  return saveOrder(normaliseExternalOrder(payload));
};

export const attachStripeSessionToOrder = async (orderId, session) => {
  const order = await getOrderById(orderId);
  if (!order) throw new Error(`Order ${orderId} was not found.`);
  return saveOrder({
    ...order,
    stripeCheckoutSessionId: session.id || order.stripeCheckoutSessionId,
    stripePaymentIntentId: session.payment_intent || session.paymentIntentId || order.stripePaymentIntentId,
    stripeSession: session,
  });
};

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
      const orders = await readLocalOrders();
      return orders.find((order) => order.id === orderId) || null;
    }
    return fromRow(data);
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
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error && !shouldUseLocalFallback(error)) throw error;
    if (error && shouldUseLocalFallback(error)) return readLocalOrders();
    return data.map(fromRow);
  }

  return readLocalOrders();
};

export const addOrderEvent = async (orderId, event) => {
  const order = await getOrderById(orderId);
  if (!order) throw new Error(`Order ${orderId} was not found.`);
  const nextEvent = { ...event, at: event.at || nowIso() };
  return saveOrder({ ...order, events: [nextEvent, ...(order.events || [])] });
};

export const markOrderPaidFromSession = async (session) => {
  const sessionId = session?.id;
  const orderId = session?.client_reference_id || session?.metadata?.order_id;
  const order = orderId ? await getOrderById(orderId) : await getOrderByStripeSession(sessionId);
  if (!order) throw new Error("Paid Stripe session could not be matched to an order.");

  const shipping = session?.shipping_details || session?.shipping || {};
  const customer = session?.customer_details || {};
  const customerEmail = customer.email || session.customer_email || order.customerEmail;
  const customerName = customer.name || shipping.name || order.customerName;
  const paidAt = nowIso();
  const next = await saveOrder({
    ...order,
    customerEmail,
    customerName,
    status: "paid",
    paymentStatus: "paid",
    fulfilmentStatus: order.fulfilmentStatus || "not_started",
    stripeCheckoutSessionId: sessionId || order.stripeCheckoutSessionId,
    stripePaymentIntentId: session.payment_intent || order.stripePaymentIntentId,
    shippingAddress: shipping.address ? { name: shipping.name, ...shipping.address } : order.shippingAddress,
    stripeSession: session,
    paidAt,
    events: [
      { type: "payment_received", label: "Payment received", at: paidAt },
      ...(order.events || []),
    ],
  });

  await sendAndRecordOrderEmail(next, "customer-order-confirmation", customerEmail);

  const adminEmail = getAdminEmail();
  if (adminEmail) {
    await sendAndRecordOrderEmail(next, "admin-new-paid-order", adminEmail).catch(() => null);
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
