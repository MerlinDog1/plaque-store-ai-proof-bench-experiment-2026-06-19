// Admin lists must not fetch or hydrate artwork. Full proof/state remains behind
// the existing authenticated single-order route.
const productFields = ["width", "height", "shape", "material", "wood"];
const metadataFields = ["source", "turnaroundWorkingDays", "turnaroundDays", "turnaroundLabel", "turnaround"];
const fields = [
  ["id", "id"], ["customer_email", "customerEmail"], ["customer_name", "customerName"],
  ["status", "status"], ["payment_status", "paymentStatus"], ["fulfilment_status", "fulfilmentStatus"],
  ["total_pence", "totalPence"], ["currency", "currency"], ["product_title", "productTitle"],
  ["inscription", "inscription"], ["email_events", "emailEvents"],
  ["approved_at", "approvedAt"], ["paid_at", "paidAt"],
];

export const orderSummaryColumns = (legacy = false) => [
  ...fields.map(([column, key]) => legacy ? `${column}:metadata->order->${key}` : column),
  "created_at", "updated_at",
  ...(legacy ? ["email", "wording", "price_estimate_pence"] : []),
  ...productFields.map((key) => `plaque_${key}:plaque_state->${key}`),
  ...metadataFields.map((key) => `meta_${key}:${legacy ? "metadata->order->metadata" : "metadata"}->${key}`),
  `address_postal_code:${legacy ? "metadata->order->shippingAddress" : "shipping_address"}->postal_code`,
  `address_postcode:${legacy ? "metadata->order->shippingAddress" : "shipping_address"}->postcode`,
].join(",");

export const fromOrderSummaryRow = (row) => ({
  id: row.id,
  customerEmail: row.customer_email || row.email || "",
  customerName: row.customer_name || "",
  status: row.status || "checkout_started",
  paymentStatus: row.payment_status || "unpaid",
  fulfilmentStatus: row.fulfilment_status || "not_started",
  totalPence: row.total_pence ?? row.price_estimate_pence ?? 0,
  currency: row.currency || "gbp",
  productTitle: row.product_title || "Custom plaque",
  inscription: row.inscription || row.wording || "",
  plaqueState: Object.fromEntries(productFields.map((key) => [key, row[`plaque_${key}`]])),
  metadata: Object.fromEntries(metadataFields.map((key) => [key, row[`meta_${key}`]])),
  shippingAddress: { postal_code: row.address_postal_code || "", postcode: row.address_postcode || "" },
  emailEvents: Array.isArray(row.email_events) ? row.email_events : [],
  priceBreakdown: {}, proofPackage: {}, events: [], stripeSession: {},
  approvedAt: row.approved_at || null,
  paidAt: row.paid_at || null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export async function readOrderSummaries(supabase, legacy = false) {
  let query = supabase.from(legacy ? "proof_sessions" : "storefront_orders")
    .select(orderSummaryColumns(legacy));
  if (legacy) query = query.eq("metadata->>kind", "storefront_order");
  const { data, error } = await query.order("created_at", { ascending: false }).limit(200);
  if (error) throw error;
  return (data || []).map(fromOrderSummaryRow).filter((order) => order.id);
}
