import assert from 'node:assert/strict';
import { Readable } from 'node:stream';

// Isolated process: synthetic keys only, and ALL outbound fetches are mocked.
process.env.STRIPE_SECRET_KEY = 'sk_live_synthetic';
process.env.VITE_STRIPE_PUBLISHABLE_KEY = 'pk_live_synthetic';
process.env.ADMIN_PASSWORD = 'synthetic-test-passcode';
process.env.ADMIN_AUTH_SECRET = 'synthetic-test-auth-secret';
process.env.VERCEL = '1'; // Import the HTTP handler without starting a listener/sweep.
delete process.env.STRIPE_TEST_SECRET_KEY;
const requests = [];
globalThis.fetch = async () => { throw new Error('Unexpected network access'); };

const { buildServerCheckoutOrder, assertServerCheckoutOrderIsPayable } = await import('../server/checkout.mjs');
const { getCheckoutPriceBreakdown } = await import('../services/checkoutPolicy.mjs');
const { ONE_POUND_TEST_POLICY } = await import('../server/onePoundTest.mjs');
const stripe = await import('../server/stripe.mjs');
const orders = await import('../server/orders.mjs');
const { handleRequest } = await import('../server.mjs');
const { createAdminSession } = await import('../server/adminAuth.mjs');

const state = { width: 123, height: 456, shape: 'rect', material: 'brushed-brass', fixing: 'none', fixingHoleCount: 2, wood: false, memorialImageEnabled: false };
const payload = () => ({ sandboxTest: true, totalPence: 100, currency: 'gbp', uiMode: 'hosted', origin: 'https://instaplaque.co.uk', orderSnapshot: { total: 1, proofApproved: true, state: { ...state }, inscription: 'DO NOT MAKE' } });
const order = buildServerCheckoutOrder(payload(), { sandboxTest: true });
assert.equal(order.totalPence, 100);
assert.equal(order.metadata.checkoutTestPolicy, ONE_POUND_TEST_POLICY);
assert.equal(order.fulfilmentStatus, 'issue');
assert.equal(assertServerCheckoutOrderIsPayable(order).totalPence, 100);
assert.throws(() => buildServerCheckoutOrder(payload()), /manual quote/);
assert.throws(() => buildServerCheckoutOrder({ ...payload(), metadata: order.metadata }), /manual quote/);
assert.ok(getCheckoutPriceBreakdown(state).total > 1);
for (const change of [{ width: 124 }, { height: 455 }, { width: 456, height: 123 }, { wood: true }, { memorialImageEnabled: true }, { shape: 'oval' }]) {
  const changed = payload(); changed.orderSnapshot.state = { ...state, ...change };
  assert.throws(() => buildServerCheckoutOrder(changed, { sandboxTest: true }), /123 × 456/);
}
assert.throws(() => assertServerCheckoutOrderIsPayable({ ...order, totalPence: 1 }), /price did not pass/);
assert.throws(() => buildServerCheckoutOrder({ ...payload(), totalPence: 200 }, { sandboxTest: true }), /price has changed/);
console.log('PASS exact dimensions, server price, nearby/rotated/extra options and public spoof rejection');

const invoke = async (method, url, body = null, authenticated = false) => {
  const req = Readable.from(body ? [JSON.stringify(body)] : []);
  req.method = method; req.url = url;
  req.headers = { host: 'instaplaque.co.uk', ...(authenticated ? { 'x-admin-token': createAdminSession('synthetic-test-passcode').token } : {}) };
  req.socket = { remoteAddress: '127.0.0.1' };
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, writeHead(code, headers) { this.statusCode = code; Object.assign(this.headers, headers); }, end(text) { this.body = JSON.parse(text); } };
  await handleRequest(req, res);
  return res;
};
assert.equal((await invoke('GET', '/api/admin/checkout-test')).statusCode, 401);
assert.equal((await invoke('POST', '/api/stripe/checkout-session', payload())).statusCode, 401);
const missing = await invoke('POST', '/api/stripe/checkout-session', payload(), true);
assert.equal(missing.statusCode, 503);
assert.equal(missing.body.code, 'stripe_test_not_configured');
assert.equal(stripe.getStripeTestConfig().configured, false);
assert.equal((await invoke('GET', '/api/admin/checkout-test', null, true)).body.mode, 'live');
await assert.rejects(stripe.createStripeCheckoutSession(order), /not connected/);
process.env.STRIPE_TEST_SECRET_KEY = 'sk_live_not_allowed';
await assert.rejects(stripe.createStripeCheckoutSession(order), /not connected/);
process.env.STRIPE_TEST_SECRET_KEY = 'sk_test_synthetic';
assert.equal((await invoke('GET', '/api/admin/checkout-test', null, true)).body.configured, true);
console.log('PASS HTTP owner authentication and missing/wrong key fail before order/network writes');

const session = { id: 'cs_test_synthetic123', livemode: false, payment_status: 'paid', status: 'complete', amount_total: 100, currency: 'gbp', client_reference_id: order.id, metadata: { order_id: order.id }, payment_intent: 'pi_testSynthetic', url: 'https://checkout.stripe.com/c/pay/cs_test_synthetic123' };
globalThis.fetch = async (url, options) => {
  requests.push({ url: String(url), options });
  return { ok: true, json: async () => structuredClone(session) };
};
const created = await stripe.createStripeCheckoutSession(order, { uiMode: 'hosted' });
assert.equal(created.livemode, false);
assert.equal(requests.at(-1).options.headers.Authorization, 'Bearer sk_test_synthetic');
const params = requests.at(-1).options.body;
assert.equal(params.get('line_items[0][price_data][unit_amount]'), '100');
assert.equal(params.get('line_items[0][price_data][currency]'), 'gbp');
assert.match(params.get('success_url'), /\/order-confirmed\?session_id=/);
assert.match(params.get('cancel_url'), /\/checkout-test.html$/);
assert.match(params.get('line_items[0][price_data][product_data][name]'), /TEST ONLY/);
assert.equal([...params.keys()].some(k => k.includes('delivery_estimate')), false);
await stripe.retrieveStripeCheckoutSession(session.id, order);
assert.equal(requests.at(-1).options.headers.Authorization, 'Bearer sk_test_synthetic');
const normalState = { ...state, width: 150, height: 50 };
const normal = buildServerCheckoutOrder({ orderSnapshot: { state: normalState, proofApproved: true } });
await stripe.createStripeCheckoutSession(normal);
assert.equal(requests.at(-1).options.headers.Authorization, 'Bearer sk_live_synthetic');
assert.ok(Number(requests.at(-1).options.body.get('line_items[0][price_data][unit_amount]')) > 100);
const existing = { ...order, stripeCheckoutSessionId: session.id, proofPackage: { productionArtworkPdf: 'synthetic' } };
for (const change of [{ livemode: true }, { livemode: undefined }, { id: 'cs_live_synthetic123' }, { amount_total: 101 }, { currency: 'usd' }, { client_reference_id: 'other' }, { metadata: {} }, { payment_status: 'unpaid' }]) {
  assert.throws(() => orders.assertStripePaymentMatchesOrder(existing, { ...session, ...change }));
}
globalThis.fetch = async () => ({ ok: true, json: async () => ({ ...session, livemode: true }) });
await assert.rejects(stripe.createStripeCheckoutSession(order), /only accepts/);
console.log('PASS sandbox-only key selection, same return flow, live price/key isolation and paid-session verification');

let stored = existing;
let emails = 0;
const deps = { getOrderByStripeSession: async () => stored, getOrderById: async () => stored, saveOrder: async (next) => (stored = next), sendAndRecordOrderEmail: async () => { emails += 1; }, getInternalProductionEmails: () => ['production@example.invalid'] };
await orders.markOrderPaidFromSession(session, deps);
await orders.markOrderPaidFromSession(session, deps);
assert.equal(stored.totalPence, 100);
assert.equal(stored.paymentStatus, 'paid');
assert.equal(stored.fulfilmentStatus, 'issue');
assert.equal(stored.status, 'issue');
assert.equal(emails, 0);
assert.equal(stored.events.filter(event => event.type === 'payment_received').length, 1);
assert.equal(await orders.sendAndRecordOrderEmail(stored, 'customer-order-confirmation', 'test@example.invalid'), stored);
assert.throws(() => orders.prepareVisualProofAttachment(stored), /do not create production/);
console.log('PASS paid/repeated return, zero emails and no production proof generation');

const livePayload = () => ({ ...payload(), sandboxTest: false, liveTest: true, confirmLivePayment: true });
assert.equal((await invoke('POST', '/api/stripe/checkout-session', livePayload())).statusCode, 401);
assert.equal((await invoke('POST', '/api/stripe/checkout-session', { ...livePayload(), confirmLivePayment: false }, true)).statusCode, 400);
assert.equal((await invoke('POST', '/api/stripe/checkout-session', { ...livePayload(), sandboxTest: true }, true)).statusCode, 400);
const wrongSizeLive = livePayload(); wrongSizeLive.orderSnapshot.state.width = 124;
assert.equal((await invoke('POST', '/api/stripe/checkout-session', wrongSizeLive, true)).statusCode, 422);
const liveOrder = await orders.createPendingOrder(livePayload(), { liveTest: true, insertOrder: async value => value });
assert.equal(liveOrder.totalPence, 100);
assert.equal(assertServerCheckoutOrderIsPayable(liveOrder).totalPence, 100);
assert.equal(liveOrder.metadata.liveVerificationPolicy, '123x456-live-v1');
assert.equal(liveOrder.metadata.checkoutTestPolicy, undefined);
assert.throws(() => buildServerCheckoutOrder(livePayload()), /manual quote/);
assert.throws(() => buildServerCheckoutOrder(livePayload(), { sandboxTest: true, liveTest: true }), /one payment mode/);
const liveSession = { ...session, id: 'cs_live_synthetic123', livemode: true, client_reference_id: liveOrder.id, metadata: { order_id: liveOrder.id }, url: 'https://checkout.stripe.com/c/pay/cs_live_synthetic123' };
delete process.env.STRIPE_TEST_SECRET_KEY;
globalThis.fetch = async (url, options) => { requests.push({ url: String(url), options }); return { ok: true, json: async () => structuredClone(liveSession) }; };
const liveCreated = await stripe.createStripeCheckoutSession(liveOrder, { uiMode: 'hosted' });
assert.equal(liveCreated.livemode, true);
assert.equal(requests.at(-1).options.headers.Authorization, 'Bearer sk_live_synthetic');
assert.equal(requests.at(-1).options.body.get('line_items[0][price_data][unit_amount]'), '100');
assert.match(requests.at(-1).options.body.get('line_items[0][price_data][product_data][description]'), /Real £1 payment/);
assert.equal(requests.at(-1).options.body.get('metadata[live_verification_policy]'), '123x456-live-v1');
assert.equal(requests.at(-1).options.body.has('metadata[checkout_test_policy]'), false);
await stripe.retrieveStripeCheckoutSession(liveSession.id, liveOrder);
assert.equal(requests.at(-1).options.headers.Authorization, 'Bearer sk_live_synthetic');
stored = { ...liveOrder, stripeCheckoutSessionId: liveSession.id };
await orders.markOrderPaidFromSession(liveSession, deps);
await orders.markOrderPaidFromSession(liveSession, deps);
assert.equal(stored.totalPence, 100);
assert.equal(stored.paymentStatus, 'paid');
assert.equal(stored.fulfilmentStatus, 'issue');
assert.equal(emails, 0);
assert.equal(stored.events.filter(event => event.type === 'payment_received').length, 1);
assert.equal(await orders.sendAndRecordOrderEmail(stored, 'customer-order-confirmation', 'test@example.invalid'), stored);
assert.throws(() => orders.prepareVisualProofAttachment(stored), /do not create production/);
for (const change of [{ livemode: false }, { livemode: undefined }, { id: 'cs_test_synthetic123' }, { amount_total: 101 }, { currency: 'usd' }, { client_reference_id: 'other' }, { metadata: {} }, { payment_status: 'unpaid' }]) {
  assert.throws(() => orders.assertStripePaymentMatchesOrder(stored, { ...liveSession, ...change }));
}
console.log('PASS owner-only live £1 checkout, explicit real-payment intent, live-key selection with no test key, repeated return and production/email hold');
console.log('All £1 live/sandbox checks passed; no external request, payment or database write was made.');
