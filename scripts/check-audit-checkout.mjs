import assert from 'node:assert/strict';
import { checkoutLifecycle, handleStripeEvent } from '../server/stripeEvents.mjs';
import { validateProofEmail, emailSavedProof } from '../server/proofEmail.mjs';
import { getProductionEstimate } from '../services/productionTime.mjs';
import { privateRateKey, consumeRequestLimit } from '../server/requestLimits.mjs';

const order = { id: 'PSAI-audit-fixture', stripeCheckoutSessionId: 'cs_fixture', totalPence: 9550, currency: 'gbp', stripeSession: { livemode: true } };
const session = { id: order.stripeCheckoutSessionId, client_reference_id: order.id, amount_total: 9550, currency: 'gbp',
  payment_status: 'paid', status: 'complete', livemode: true, metadata: { source: 'instaplaque', order_id: order.id } };
const event = { id: 'evt_fixture', livemode: true, type: 'checkout.session.completed', data: { object: session } };
assert.equal(checkoutLifecycle(event), 'paid');
assert.equal(checkoutLifecycle({ ...event, data: { object: { ...session, payment_status: 'unpaid' } } }), 'pending');
assert.equal(checkoutLifecycle({ ...event, type: 'checkout.session.async_payment_failed' }), 'failed');
assert.equal(checkoutLifecycle({ ...event, type: 'checkout.session.expired' }), 'expired');
for (const source of ['pim', 'flat-cut', undefined]) {
  assert.deepEqual(await handleStripeEvent({ ...event, data: { object: { ...session, metadata: { ...session.metadata, source } } } }, {
    findOrder: () => { throw new Error('Other brands must not access InstaPlaque orders'); },
  }), { ignored: true });
}
let paid = 0, updates = 0, claim = 'claimed', lifecycle;
const chain = { eq: () => chain, then: resolve => resolve({ error: null }) };
const db = { rpc: async (name, args) => {
  if (name === 'claim_instaplaque_stripe_event') return { data: claim };
  lifecycle = args.p_kind; return { error: null };
}, from: () => ({ update: () => { updates++; return chain; } }) };
const deps = { db, findOrder: async () => order, markPaid: async () => { paid++; } };
assert.deepEqual(await handleStripeEvent(event, deps), { processed: true });
assert.equal(paid, 1); assert.equal(updates, 1);
claim = 'processed'; assert.deepEqual(await handleStripeEvent(event, deps), { duplicate: true }); assert.equal(paid, 1);
claim = 'busy'; await assert.rejects(handleStripeEvent(event,deps), error => error.statusCode === 503);
claim = 'claimed'; await handleStripeEvent({ ...event, type: 'checkout.session.expired' },deps); assert.equal(lifecycle,'expired');
await assert.rejects(handleStripeEvent({ ...event, data: { object: { ...session, amount_total: 1 } } }, deps), /matched/);
await assert.rejects(handleStripeEvent({ ...event, data: { object: { ...session, livemode: false } } }, deps), /mode mismatch/);
await assert.rejects(handleStripeEvent(event, { ...deps, markPaid: async () => { throw new Error('retry'); } }), /retry/);

for (const [state, days] of [
  [{width:210,height:148,shape:'rect',material:'brushed-stainless'},5],
  [{width:210,height:148,shape:'rect',material:'aged-brass'},7],
  [{width:148,height:210,shape:'rect',wood:true},10],
  [{width:200,height:200,shape:'circle'},15],
  [{width:250,height:150,shape:'oval'},15],
  [{width:200,height:100,shape:'rect'},15],
]) { assert.equal(getProductionEstimate(state).days,days); assert.equal(getProductionEstimate(state).deliveryDays,days+1); }

const payload = { requestId:'00000000-0000-4000-8000-000000000123', email:'fixture@example.com',
  plaqueState:{width:210,height:148},wording:'SYNTHETIC PROOF',metadata:{layoutIsCurrent:true} };
assert.throws(() => validateProofEmail({...payload,email:'<script>@x.com'}));
assert.throws(() => validateProofEmail({...payload,website:'bot'}));
assert.equal(validateProofEmail(payload).requestKey,validateProofEmail(payload).requestKey);
assert.notEqual(validateProofEmail(payload).requestKey,validateProofEmail({...payload,wording:'changed'}).requestKey);
let saved=null,sends=0,limits=0,proofs=0;
const fakeDb={from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:saved})})}),
  update: patch=>({eq:async()=>{saved={...saved,...patch};return {error:null};}})})};
const emailDeps={db:fakeDb,env:{RESEND_API_KEY:'fixture',ADMIN_AUTH_SECRET:'fixture'},consumeLimit:async()=>{limits++;},
  createProof:async content=>{proofs++; saved={public_token:'fixture-token',expires_at:new Date(Date.now()+86400000).toISOString(),metadata:content.metadata};return saved;},
  fetchImpl:async(url,request)=>{sends++;const body=JSON.parse(request.body);assert.equal(body.to,payload.email);assert.ok(request.headers['Idempotency-Key']);assert.ok(body.text.includes('/design?proof=fixture-token'));assert.ok(!body.text.includes(payload.wording));return {ok:true,json:async()=>({id:'fixture-email'})};}};
assert.deepEqual(await emailSavedProof(payload,'fixture-ip',emailDeps),{ok:true,status:'accepted'});
assert.deepEqual(await emailSavedProof(payload,'fixture-ip',emailDeps),{ok:true,status:'accepted',duplicate:true});
assert.equal(sends,1);assert.equal(proofs,1);assert.equal(limits,3);
await assert.rejects(emailSavedProof(payload,'ip',{...emailDeps,env:{}}),error=>error.statusCode===503);
saved = { ...saved, metadata: {}, created_at: new Date(Date.now()-25*3600000).toISOString() };
await assert.rejects(emailSavedProof(payload,'ip',emailDeps),error=>error.statusCode===409);
assert.equal(sends,1);
assert.throws(()=>privateRateKey('fixture','ip',{}),error=>error.statusCode===503);
await assert.rejects(consumeRequestLimit('fixture',3,3600,1,{rpc:async()=>({data:false})}),error=>error.statusCode===429);
await assert.rejects(consumeRequestLimit('fixture',3,3600,1,{rpc:async()=>({error:{message:'unavailable'}})}),error=>error.statusCode===503);
console.log('PASS brand isolation, payment/expiry dispatch, duplicate/retry/mode checks, delivery estimates, proof email validation/deduplication/provider acceptance. No external requests.');
