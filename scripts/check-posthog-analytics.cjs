const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { webcrypto } = require('node:crypto');
const source = fs.readFileSync('services/posthogAnalytics.ts', 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const storage = () => { const data = new Map(); return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)), removeItem: key => data.delete(key) }; };
function setup(url = 'https://instaplaque.co.uk/', saved = storage()) {
  const requests = [];
  const win = new EventTarget(); Object.assign(win, { setTimeout, clearTimeout });
  const doc = new EventTarget(); doc.referrer = '';
  const sandbox = { exports: {}, URL, Event, AbortController, TextEncoder, crypto: webcrypto, Date, console,
    location: new URL(url), localStorage: saved, sessionStorage: storage(), window: win, document: doc,
    navigator: { userAgent: 'Mozilla Chrome/130.0 Safari/537', maxTouchPoints: 0 },
    fetch: async (url, options) => { requests.push({ url, options, payload: JSON.parse(options.body) }); return { ok: true }; },
    require: name => name === './commerce' ? { productFamilies: [{slug:'memorial-plaques'}], seoLandingPages: [{slug:'brass-plaques'}] }
      : { OPTIONAL_AD_CONSENT_CHANGED: 'consent', metaConsent: () => saved.getItem('instaplaque-meta-consent') },
  };
  vm.runInNewContext(code, sandbox);
  return { api: sandbox.exports, requests, sandbox, saved, win };
}
const flush = () => new Promise(resolve => setImmediate(resolve));
(async () => {
  const s = setup('https://instaplaque.co.uk/?utm_source=leaflet&utm_medium=qr&utm_campaign=autumn&email=private@example.test#secret');
  s.api.startSiteAnalytics(); s.api.trackSiteEvent('designer_started');
  assert.equal(s.requests.length, 0, 'No capture or session before consent');
  assert.equal(s.saved.getItem('instaplaque-analytics-session-v1'), null);
  s.saved.setItem('instaplaque-meta-consent', 'yes');
  assert.equal(s.api.analyticsConsent(), null, 'Legacy advertising yes does not grant analytics');
  s.api.setAnalyticsConsent(true); s.api.trackSitePage(); s.api.startSiteAnalytics();
  assert.equal(s.requests.length, 2, 'One visit and pageview despite repeated initialization');
  assert.equal(s.requests[0].payload.properties.source, 'tagged QR');
  assert.equal(s.requests[0].payload.properties.campaign, 'autumn');
  s.sandbox.location = new URL('https://instaplaque.co.uk/design?email=private@example.test');
  s.api.trackSitePage(); s.api.trackSiteEvent('designer_step_viewed', {step:'wording',email:'private@example.test',wording:'SECRET WORDING',url:'secret'}, 'step:wording');
  s.api.trackSiteEvent('designer_step_viewed', {step:'wording'}, 'step:wording');
  assert.equal(s.requests.filter(r => r.payload.event === 'ip_designer_step_viewed').length, 1);
  assert.ok(!JSON.stringify(s.requests).includes('private@example.test'));
  assert.ok(!JSON.stringify(s.requests).includes('SECRET WORDING'));
  assert.ok(s.requests.every(r => r.options.referrerPolicy === 'no-referrer' && r.options.credentials === 'omit'));
  assert.ok(s.requests.every(r => r.payload.properties.$process_person_profile === false));
  const count = s.requests.length;
  for (const url of ['https://instaplaque.co.uk/admin/tracer','https://instaplaque.co.uk/design?proof=SECRET','https://instaplaque.co.uk/order-confirmed?order=SECRET', 'https://preview.vercel.app/design','http://localhost:5173/design']) {
    s.sandbox.location = new URL(url); s.api.trackSitePage(); s.api.trackSiteEvent('layout_generated');
  }
  assert.equal(s.requests.length, count, 'Private, development and preview traffic excluded');
  s.sandbox.location = new URL('https://instaplaque.co.uk/cookies');
  s.api.setAnalyticsConsent(false); s.api.trackSitePage();
  assert.equal(s.requests.length, count, 'Withdrawal stops events');
  assert.equal(s.saved.getItem('instaplaque-analytics-session-v1'), null);
  const direct = setup(); direct.api.setAnalyticsConsent(true);
  assert.equal(direct.requests[0].payload.properties.source, 'direct/unknown');
  const reload = setup('https://instaplaque.co.uk/', direct.saved); reload.api.startSiteAnalytics();
  assert.equal(reload.requests.length, 1, 'Reload pageview without duplicate visit');
  const qa = setup(); qa.sandbox.sessionStorage.setItem('instaplaque-analytics-qa', 'yes'); qa.api.setAnalyticsConsent(true);
  assert.ok(qa.requests.every(r => r.payload.properties.is_test === true));
  const badCampaign = setup('https://instaplaque.co.uk/?utm_campaign=private%40example.test&gclid=secret'); badCampaign.api.setAnalyticsConsent(true);
  assert.equal(badCampaign.requests[0].payload.properties.campaign, '(none)');
  const paid = setup('https://instaplaque.co.uk/order-confirmed?order=PRIVATEORDER&session_id=cs_live_abc');
  paid.api.setAnalyticsConsent(true);
  const order = {id:'PRIVATEORDER',stripeCheckoutSessionId:'cs_live_abc',paymentStatus:'paid',totalPence:14500,currency:'gbp'};
  for (const mutation of [{paymentStatus:'unpaid'}, {metadata:{checkoutTestPolicy:'test'}}, {metadata:{liveVerificationPolicy:'test'}}, {totalPence:0}, {currency:'usd'}, {stripeCheckoutSessionId:'cs_test_abc'}]) {
    assert.equal(await paid.api.trackPostHogPurchase({...order,...mutation}), false);
  }
  assert.equal(paid.requests.length, 0);
  await Promise.all([paid.api.trackPostHogPurchase(order),paid.api.trackPostHogPurchase(order)]);
  assert.equal(paid.requests.filter(r => r.payload.event === 'ip_purchase_completed').length, 1);
  const purchase = paid.requests.find(r => r.payload.event === 'ip_purchase_completed').payload;
  assert.equal(purchase.properties.value_gbp,145);
  assert.ok(!JSON.stringify(paid.requests).includes('PRIVATEORDER'));
  assert.ok(!JSON.stringify(paid.requests).includes('cs_live_abc'));
  const paidReload = setup(paid.sandbox.location.href, paid.saved);
  assert.equal(await paidReload.api.trackPostHogPurchase(order), false, 'Purchase de-duplicated after refresh');
  const failed = setup(); failed.api.setAnalyticsConsent(true); await flush();
  failed.sandbox.fetch = async () => { throw new Error('offline'); };
  failed.api.trackSiteEvent('enquiry_failed'); await flush();
  console.log('PostHog: consent, legacy choices, withdrawal, strict-mode dedupe, session reload, private URLs, attribution, QA/development exclusion, payload privacy, confirmed purchase guards/dedupe and offline safety passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
