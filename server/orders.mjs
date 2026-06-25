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
  return message.includes("42p01") || message.includes("storefront_orders");
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
