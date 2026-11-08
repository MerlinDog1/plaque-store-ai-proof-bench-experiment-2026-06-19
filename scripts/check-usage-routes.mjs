// Real HTTP routes, fake upstreams. No Stripe, AI, email or customer database I/O.
import {registerHooks} from 'node:module';
import {createServer} from 'node:http';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
process.env.VERCEL='1'; process.env.GEMINI_PUBLIC_PROXY_ENABLED='true';process.env.GEMINI_API_KEY='fixture';
process.env.SUPABASE_URL='https://usage-fixture.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='fixture';process.env.ADMIN_PASSWORD='fixture-only';
const stub = exports => Object.entries(exports).map(([name,code])=>`export const ${name} = ${code};`).join('\n');
const order=`({id:'PSAI-fixture',totalPence:2500,plaqueState:{material:'brushed-brass',width:150,height:50}})`;
registerHooks({load(url,context,next){
 let source;
 if(url.endsWith('/server/orders.mjs')) source=stub(Object.fromEntries(['attachStripeSessionToOrder','attachVisualProofToOrder','createExternalOrder','createPendingOrder','getOrderById','isLocalOrderJsonStoreEnabled','isPaidCompleteStripeSession','listOrderSummaries','markOrderPaidFromSession','processReviewFollowUps','sendAndRecordOrderEmail','shouldSendCustomerProofEmail','updateOrderStatus'].map(n=>[n,`async()=>${order}`])));
 if(url.endsWith('/server/supabase.mjs'))source=stub({createProofSession:'async()=>({id:1,public_token:"private-not-recorded"})',getProofSessionByToken:'async()=>null',getSupabaseConfig:'()=>({configured:true})',getSupabaseServiceClient:'()=>null'});
 if(url.endsWith('/server/stripe.mjs'))source=stub({createStripeCheckoutSession:'async()=>({id:"cs_fixture",raw:{id:"cs_fixture"}})',getStripeConfig:'()=>({configured:true})',getLiveVerificationConfig:'()=>({})',requireLiveVerificationKeys:'()=>{}',requireStripeTestKey:'()=>{}',parseStripeWebhook:'s=>JSON.parse(s)',retrieveStripeCheckoutSession:'async()=>({})'});
 if(url.endsWith('/server/stripeEvents.mjs'))source='export const handleStripeEvent=async()=>({processed:true});';
 if(url.endsWith('/server/proofEmail.mjs'))source='export const emailSavedProof=async()=>({ok:true});';
 if(url.endsWith('/server/designRequests.mjs'))source='export const MAX_DESIGN_REQUEST_BYTES=2048;export const submitDesignRequest=async()=>({ok:true});';
 if(url.endsWith('/server/requestLimits.mjs'))source='export const consumeRequestLimit=async()=>{};export const privateRateKey=()=>"fixture";';
 if(url.includes('/@google/genai/'))source='export class GoogleGenAI {models={generateContent:async()=>({text:"fixture"})}}';
 return source===undefined?next(url,context):{format:'module',source,shortCircuit:true};
}});
const {handleRequest}=await import('../server.mjs');
const server=createServer(handleRequest);await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;
const realFetch=globalThis.fetch;let mode='throw',started=0;const inserts=[];
globalThis.fetch=(url,options)=>{
 if(String(url).startsWith(process.env.SUPABASE_URL)) {
  started++;
  if(mode==='throw') return Promise.reject(new Error('fixture storage failure'));
  if(mode==='hang') return new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(options.signal.reason)));
  if(options?.method==='POST')inserts.push(JSON.parse(options.body));
  return Promise.resolve(new Response(options?.method==='POST'?'':JSON.stringify([]),{status:200}));
 }
 return realFetch(url,options);
};
const headers={'content-type':'application/json',origin:base.replace('http:','https:'),'sec-fetch-site':'same-origin','x-vercel-forwarded-for':'192.0.2.1','x-instaplaque-visit':randomUUID(),'x-instaplaque-step':'layout'};
const fixtures=[['/api/gemini/generate-content',{model:'gemini-3.8-flash',contents:'Test',config:{responseMimeType:'application/json',responseSchema:{type:'OBJECT',properties:{text:{type:'STRING'}},required:['text']}}},200],['/api/proof-sessions',{metadata:{source:'pdf-resume-link-trial'}},201],['/api/proof-sessions/email',{},200],['/api/design-requests',{},201],['/api/stripe/checkout-session',{},201],['/api/stripe/webhook',{type:'checkout.session.completed',data:{object:{payment_status:'paid',metadata:{order_id:'PSAI-fixture'}}}},200]];
const timing={};
try {
 // Warm up HTTP/import paths before measuring failure overhead.
 await realFetch(base+'/api/gemini/health');
 for(mode of ['throw','hang'])for(const [path,body,expected] of fixtures){
  const start=performance.now();const r=await realFetch(base+path,{method:'POST',headers,body:JSON.stringify(body)});const response=await r.json();
  assert.equal(r.status,expected,JSON.stringify(response));const elapsed=performance.now()-start;
  assert.ok(elapsed<50,`${path} ${mode}: ${elapsed}ms`);timing[`${mode} ${path}`]=+elapsed.toFixed(3);
 }
 assert.ok(started>=12);console.log('PASS actual AI/proof/email/request/checkout/webhook HTTP responses survive failing and hanging usage DB:',JSON.stringify(timing));
 const unauth=await realFetch(base+'/api/admin/usage');assert.equal(unauth.status,401);assert.equal(unauth.headers.get('cache-control'),'no-store');
 const bad=await realFetch(base+'/api/usage',{method:'POST',headers:{...headers,'sec-fetch-site':'cross-site'},body:'{}'});assert.equal(bad.status,403);
 const invalid=await realFetch(base+'/api/usage',{method:'POST',headers,body:JSON.stringify({event:'paid'})});assert.equal(invalid.status,400);
 const tooBig=await realFetch(base+'/api/usage',{method:'POST',headers,body:JSON.stringify({data:'x'.repeat(2100)})});assert.equal(tooBig.status,413);
 mode='ok';const before=started;const off={...headers};delete off['x-instaplaque-visit'];
 for(const [path,body] of fixtures.slice(0,5))await realFetch(base+path,{method:'POST',headers:off,body:JSON.stringify(body)});
 assert.equal(started,before,'Statistics-off responses make zero usage DB calls');
 console.log('PASS unauthenticated admin refused, origin/size/allowlists enforced, Statistics-off = zero DB calls.');
} finally {await new Promise(r=>setTimeout(r,2100));server.closeAllConnections();await new Promise(r=>server.close(r));globalThis.fetch=realFetch;}
