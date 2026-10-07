import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { orderSummaryColumns, fromOrderSummaryRow } from "../server/orderSummaries.mjs";

// Synthetic API harness: no external reads, writes, emails, storage or payments.
Object.assign(process.env, {
  VERCEL: "1", NODE_ENV: "production", ADMIN_PASSWORD: "synthetic-admin-list-check",
  SUPABASE_URL: "https://summary-check.invalid", SUPABASE_SERVICE_ROLE_KEY: "synthetic-key",
});
let mode = "summary";
const calls = [];
const row = {
  id: "SYNTHETIC-1", status: "paid", payment_status: "paid", total_pence: 12345,
  customer_name: "Test Customer", customer_email: "customer@example.test", inscription: "Test wording",
  plaque_width: 148, plaque_height: 210, plaque_material: "brushed-stainless", plaque_shape: "rect", plaque_wood: true,
  meta_source: "instaplaque", meta_turnaroundWorkingDays: 7, address_postal_code: "TEST 1AA",
  created_at: "2026-10-01T12:00:00Z", paid_at: "2026-10-01T12:00:00Z",
  email_events: [{ type: "confirmation", status: "sent" }],
  proof_package: { productionSvg: "ARTWORK_SENTINEL" }, metadata: { checkoutRecoveryToken: "SECRET_SENTINEL" },
};
const summary = fromOrderSummaryRow(row);
assert.equal(summary.totalPence, 12345);
assert.equal(summary.metadata.turnaroundWorkingDays, 7);
assert.equal(summary.shippingAddress.postal_code, "TEST 1AA");
assert.equal(summary.emailEvents.length, 1);
assert.equal(JSON.stringify(summary).includes("SENTINEL"), false);
for (const legacy of [false, true]) {
  const columns = orderSummaryColumns(legacy).split(",");
  assert(!columns.some((field) => ["*", "plaque_state", "proof_package", "metadata", "stripe_session"].includes(field)));
  assert(!columns.some((field) => /generatedSvg|productionSvg|visualProof|ArtworkPdf/.test(field)));
}

globalThis.fetch = async (input, init = {}) => {
  const url = new URL(String(input));
  assert.equal(url.origin, "https://summary-check.invalid", "No outside network calls are allowed");
  assert.equal(init.method || "GET", "GET", "No database writes are allowed");
  calls.push(url);
  if (mode === "timeout") return Response.json({ code: "57014", message: "canceling statement due to statement timeout" }, { status: 500 });
  if (mode === "missing-table" && url.pathname.endsWith("storefront_orders")) return Response.json({ code: "PGRST205", message: "Missing primary table" }, { status: 404 });
  if (url.searchParams.get("select") === "*") {
    return Response.json({ ...row, plaque_state: { width: 148, height: 210 }, proof_package: {
      visualProofSvg: '<svg xmlns="http://www.w3.org/2000/svg"><text>Exact synthetic proof</text></svg>',
    } });
  }
  assert.equal(url.searchParams.get("limit"), "200");
  assert.equal(url.searchParams.get("order"), "created_at.desc");
  if (url.pathname.endsWith("proof_sessions")) {
    assert.equal(url.searchParams.get("metadata->>kind"), "eq.storefront_order");
    assert.equal(url.searchParams.get("select"), orderSummaryColumns(true));
    return Response.json([{ ...row, id: "LEGACY-1" }]);
  }
  assert.equal(url.searchParams.get("select"), orderSummaryColumns());
  return Response.json(mode === "legacy" ? [] : [row]);
};

const { handleRequest } = await import("../server.mjs");
const { createAdminSession } = await import("../server/adminAuth.mjs");
const token = createAdminSession("synthetic-admin-list-check").token;
async function invoke(url, authenticated = true) {
  const req = Readable.from([]);
  Object.assign(req, { method: "GET", url, headers: { host: "instaplaque.test", ...(authenticated ? { authorization: `Bearer ${token}` } : {}) }, socket: { remoteAddress: "203.0.113.5" } });
  let status; let body = "";
  await handleRequest(req, { writeHead: (code) => { status = code; }, end: (chunk = "") => { body += String(chunk); } });
  return { status, body: JSON.parse(body) };
}
assert.equal((await invoke("/api/admin/orders", false)).status, 401);
assert.equal(calls.length, 0, "Unauthenticated requests must not reach the database");
const list = await invoke("/api/admin/orders");
assert.equal(list.status, 200);
assert.equal(list.body.orders.length, 1);
assert.equal(list.body.orders[0].totalPence, 12345);
assert.equal(JSON.stringify(list.body).includes("SENTINEL"), false);
assert.equal(calls.length, 1, "Listing must not hydrate any artwork");
for (const fallback of ["legacy", "missing-table"]) {
  mode = fallback;
  const result = await invoke("/api/admin/orders");
  assert.equal(result.status, 200);
  assert.equal(result.body.orders[0].id, "LEGACY-1");
}
mode = "timeout";
const failed = await invoke("/api/admin/orders");
assert.equal(failed.status, 503);
assert.equal(failed.body.code, "order_list_timeout");
assert(!("orders" in failed.body), "A failed query must not masquerade as an empty order list");
mode = "summary";
const detail = await invoke("/api/admin/orders/SYNTHETIC-1");
assert.equal(detail.status, 200);
assert.match(detail.body.order.proofPackage.visualProofSvg, /Exact synthetic proof/);
console.log("Admin order list: auth, lightweight query, metadata, legacy fallback, timeout and exact single-order proof checks passed.");
