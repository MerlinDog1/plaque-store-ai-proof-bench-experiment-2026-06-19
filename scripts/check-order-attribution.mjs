import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as attribution from '../services/orderAttribution.mjs';
import { buildServerCheckoutOrder } from '../server/checkout.mjs';
import { buildStripeCheckoutParams } from '../server/stripe.mjs';
import { getCheckoutPriceBreakdown } from '../services/checkoutPolicy.mjs';
import { submitDesignRequest, validateDesignRequest } from '../server/designRequests.mjs';
const { captureArrivalAttribution: capture, sanitizeAttribution: sanitize, contactReference, attributionSourceCode } = attribution;
const origin = 'https://instaplaque.co.uk';
const uuid = 'a1b2c3d4-e5f6-4000-8000-000000000001';
const cases = [
  ['?gclid=synthetic', '', 'google_ads', 'G'],
  ['?gbraid=synthetic', '', 'google_ads', 'G'],
  ['?wbraid=synthetic', '', 'google_ads', 'G'],
  ['?utm_source=google&utm_medium=cpc', '', 'google_ads', 'G'],
  ['?utm_source=google&utm_medium=shopping', '', 'google_shopping', 'G'],
  ['?utm_source=google_shopping&gclid=synthetic', '', 'google_shopping', 'G'],
  ['?fbclid=synthetic', '', 'facebook_instagram_ads', 'F'],
  ['?utm_source=instagram&utm_medium=paid_social', '', 'facebook_instagram_ads', 'F'],
  ['?utm_source=facebook&utm_medium=cpc', '', 'facebook_instagram_ads', 'F'],
  ['', 'https://www.google.co.uk/search?q=private', 'google_organic', 'O'],
  ['', 'https://www.google.com/search?q=private', 'google_organic', 'O'],
  ['?utm_source=google&utm_medium=organic', '', 'google_organic', 'O'],
  ['', 'https://www.bing.com/search?q=private', 'bing', 'O'],
  ['?msclkid=synthetic', '', 'bing', 'B'],
  ['?utm_source=bing&utm_medium=ppc', '', 'bing', 'B'],
  ['', 'https://example.org/private?token=private#secret', 'other_referral:example.org', 'R'],
  ['', 'https://l.facebook.com/redirect', 'other_referral:l.facebook.com', 'R'],
  ['', '', 'direct', 'D'],
  ['', 'https://www.instaplaque.co.uk/design', 'direct', 'D'],
  ['', 'not-a-url', 'direct', 'D'],
  ['', 'https://google.com.evil.test/search', 'other_referral:google.com.evil.test', 'R'],
];
for (const [query, referrer, label, code] of cases) test(`${label} / ${code}: ${query || referrer || 'empty arrival'}`, () => {
  const data = capture(origin + '/memorial-plaques' + query, referrer);
  assert.equal(data.label, label);
  assert.equal(attributionSourceCode(data), code);
  assert.equal(contactReference(uuid, data), `IP-A1B2C3D4E5-${code}`);
  assert.equal(data.landing_path, '/memorial-plaques');
});
test('capture whitelist, hostname only, query/fragment removed', () => {
  const data = capture(origin + '/design?utm_source=google&utm_medium=cpc&utm_campaign=Autumn&utm_content=one&utm_term=plaques&gclid=click&gbraid=braid&wbraid=web&fbclid=meta&msclkid=bing&email=private#secret', 'https://user:pass@example.org/private?secret=yes');
  assert.deepEqual(Object.keys(data).sort(), [...attribution.ATTRIBUTION_QUERY_KEYS, 'referrer_host', 'landing_path', 'label'].sort());
  assert.equal(data.referrer_host, 'example.org');
  assert.equal(data.landing_path, '/design');
  assert.equal(data.utm_campaign, 'Autumn');
  assert.ok(!JSON.stringify(data).includes('private'));
});
test('untrusted payload is flattened, bounded and label recomputed', () => {
  const result = sanitize({utm_source:' <google>\n',utm_campaign:'x'.repeat(1000),utm_content:{secret:'no'},utm_term:['no'],gclid:'x'.repeat(900),gbraid:'bad/bytes',referrer_host:'https://example.org/private',landing_path:'/proof/secret?token=private',label:'forged',email:'private',nested:{secret:'no'}});
  assert.deepEqual(result, {utm_source:'google',utm_campaign:'x'.repeat(200),gclid:'x'.repeat(512),landing_path:'/proof',label:'google_ads'});
  for (const input of [null,undefined,'bad',[],123,{}, {label:'google_ads'}]) assert.equal(sanitize(input),null);
  assert.equal(sanitize({landing_path:'//evil.test/'}), null);
  assert.equal(sanitize({landing_path:'/design?private=1#secret'}).landing_path, '/design');
  assert.equal(sanitize({referrer_host:'EXAMPLE.ORG.'}).label, 'other_referral:example.org');
  assert.equal(contactReference('invalid', null), undefined);
});
const compile = file => ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
test('first arrival held in memory across route changes; no storage access even when blocked', () => {
  const context = {exports:{},require:name=>{assert.equal(name,'./orderAttribution.mjs');return attribution;},window:{location:new URL(origin+'/?utm_campaign=first&gclid=synthetic')},document:{referrer:'https://www.google.com/search?q=secret'}};
  for(const target of [context,context.window]) for(const key of ['localStorage','sessionStorage','indexedDB','caches']) Object.defineProperty(target,key,{get(){throw Error('Device storage accessed');}});
  Object.defineProperty(context.document,'cookie',{get(){throw Error('Cookie read');},set(){throw Error('Cookie write');}});
  vm.runInNewContext(compile('services/arrivalAttribution.ts'),context);
  const first = context.exports.getArrivalAttribution();
  context.window.location = new URL(origin+'/design?utm_campaign=second');
  assert.strictEqual(context.exports.getArrivalAttribution(),first);
  assert.equal(first.utm_campaign,'first');
  assert.equal(first.landing_path,'/');
  assert.ok(Object.isFrozen(first));
});
test('pushState click propagation retains Google linker plus Meta/Bing, never private/external URLs', () => {
  const context={exports:{},URL};vm.runInNewContext(compile('services/googleClickNavigation.ts'),context);
  const navigate=context.exports.publicRouteWithGoogleClick;
  const from=origin+'/?gclid=google&gbraid=braid&wbraid=web&fbclid=meta&msclkid=bing&_gl=linker&gclsrc=aw&dclid=double&utm_campaign=first';
  const url=new URL(navigate('/design',from),origin);
  for(const key of ['gclid','gbraid','wbraid','fbclid','msclkid','_gl','gclsrc','dclid']) assert.ok(url.searchParams.has(key));
  assert.equal(url.searchParams.has('utm_campaign'),false);
  assert.equal(navigate('/design?gclid=target',from).includes('gclid=target'),true);
  for(const route of ['/proof/private','/admin','/checkout','/order-confirmed?order=private','https://example.org']) assert.equal(navigate(route,from),route);
  assert.equal(navigate('/design',origin+'/proof/private?gclid=private'),'/design');
});
test('canonical checkout stores only sanitized attribution; Stripe gets label/campaign, no click IDs', () => {
  const state={width:150,height:50,shape:'rect',material:'brushed-stainless',fixing:'screws',fixingHoleCount:2,wood:false,memorialImageEnabled:false};
  const breakdown=getCheckoutPriceBreakdown(state,'TEST');
  const payload={origin,orderSnapshot:{state,inscription:'TEST',proofApproved:true,total:breakdown.total},attribution:{landing_path:'/',gclid:'synthetic',utm_campaign:'Autumn',label:'forged',customer_email:'private'}};
  const order=buildServerCheckoutOrder(payload);
  assert.deepEqual(order.metadata.attribution,{gclid:'synthetic',utm_campaign:'Autumn',landing_path:'/',label:'google_ads'});
  const {params}=buildStripeCheckoutParams(order);
  assert.equal(params.get('metadata[attribution_label]'),'google_ads');
  assert.equal(params.get('metadata[attribution_campaign]'),'Autumn');
  assert.ok(!params.toString().includes('synthetic'));
  delete payload.attribution;
  assert.equal(buildServerCheckoutOrder(payload).metadata.attribution,undefined,'Old clients stay unknown, not falsely direct');
});
test('free-proof reference suffix and retries are stable; invalid source discarded; no real email', async () => {
  const payload={requestId:uuid,name:'Synthetic',email:'synthetic@example.test',size:'150x50',shape:'Rectangle',material:'Brass',wood:'No',fixing:'Screws',wording:'TEST',sourceCode:'G'};
  const sent=[];
  const options={env:{RESEND_API_KEY:'synthetic'},recipients:['synthetic@example.test'],fetchImpl:async(url,init)=>{sent.push(init);return Response.json({id:'synthetic'});}};
  const a=await submitDesignRequest(payload,options), b=await submitDesignRequest(payload,options);
  assert.equal(a.reference,b.reference);assert.match(a.reference,/-G$/);
  assert.equal(sent[0].headers['Idempotency-Key'],sent[1].headers['Idempotency-Key']);
  assert.ok(JSON.parse(sent[0].body).subject.endsWith(a.reference));
  assert.equal(validateDesignRequest({...payload,sourceCode:'private'}).sourceCode,'');
});
