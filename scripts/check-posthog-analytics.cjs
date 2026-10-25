const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { webcrypto } = require('node:crypto');
const source = fs.readFileSync('services/posthogAnalytics.ts', 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
// The real contact details, so tracking is tested against the configured WhatsApp number.
const shopInformation = (() => { const s = { exports: {} }; vm.runInNewContext(ts.transpileModule(fs.readFileSync('services/shopInformation.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, s); return s.exports; })();
const storage = () => { const data = new Map(); return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)), removeItem: key => data.delete(key) }; };
function setup(url = 'https://instaplaque.co.uk/', saved = storage()) {
  const requests = [], google = [];
  let timeOffset = 0;
  const clock = class extends Date { static now() { return Date.now() + timeOffset; } };
  const win = new EventTarget(); Object.assign(win, { setTimeout, clearTimeout, gtag: (...args) => google.push(args) });
  const doc = new EventTarget(); doc.referrer = '';
  const sandbox = { exports: {}, URL, Event, AbortController, TextEncoder, crypto: webcrypto, Date: clock, console,
    location: new URL(url), localStorage: saved, sessionStorage: storage(), window: win, document: doc,
    navigator: { userAgent: 'Mozilla Chrome/130.0 Safari/537', maxTouchPoints: 0 },
    fetch: async (url, options) => { requests.push({ url, options, payload: JSON.parse(options.body) }); return { ok: true }; },
    require: name => name === './commerce' ? { productFamilies: [{slug:'memorial-plaques'}], seoLandingPages: [{slug:'brass-plaques'}] }
      : name === './shopInformation' ? shopInformation
      : { OPTIONAL_AD_CONSENT_CHANGED: 'consent', metaConsent: () => saved.getItem('instaplaque-meta-consent'),
        isInternalBrowser: () => saved.getItem('instaplaque-internal-v1') === 'yes' },
  };
  vm.runInNewContext(code, sandbox);
  return { api: sandbox.exports, requests, google, sandbox, saved, win, advanceTime: ms => { timeOffset += ms; } };
}
function contactLink(href, placement = 'hero', reference = 'IP-A1B2C3D4E5', extra = {}) {
  const attributes = { href, 'data-contact-placement': placement, 'data-contact-reference': reference, ...extra };
  return { getAttribute: name => attributes[name] ?? null, hasAttribute: name => Object.hasOwn(attributes, name) };
}
function clickContact(s, link, { type = 'click', button = 0, detail = 1, cancelled = false } = {}) {
  const event = new Event(type, { cancelable: true });
  Object.defineProperties(event, { target: { value: { closest: () => link } }, button: { value: button }, detail: { value: detail } });
  if (cancelled) event.preventDefault();
  s.sandbox.document.dispatchEvent(event);
}
const flush = () => new Promise(resolve => setImmediate(resolve));
(async () => {
  const s = setup('https://instaplaque.co.uk/?utm_source=leaflet&utm_medium=qr&utm_campaign=autumn&email=private@example.test#secret');
  s.api.startSiteAnalytics(); s.api.trackSiteEvent('designer_started');
  assert.equal(s.requests.length, 0, 'No capture or session before consent');
  assert.equal(s.google.length, 0, 'No custom Google event before consent');
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
  const googleCount = s.google.length;
  for (const url of ['https://instaplaque.co.uk/admin/tracer','https://instaplaque.co.uk/design?proof=SECRET','https://instaplaque.co.uk/order-confirmed?order=SECRET', 'https://preview.vercel.app/design','http://localhost:5173/design']) {
    s.sandbox.location = new URL(url); s.api.trackSitePage(); s.api.trackSiteEvent('layout_generated');
  }
  assert.equal(s.requests.length, count, 'Private, development and preview traffic excluded');
  assert.equal(s.google.length, googleCount, 'Private, development and preview Google funnel traffic excluded');
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
  // The owner's own browsers (?internal=on) are recorded as tests and never reach GA4 (owner msg 6422).
  const own = setup(); own.saved.setItem('instaplaque-internal-v1', 'yes'); own.api.setAnalyticsConsent(true);
  own.api.trackSiteEvent('designer_started');
  own.api.trackSiteEvent('contact_clicked', { channel: 'whatsapp', placement: 'hero' });
  assert.ok(own.requests.length >= 3 && own.requests.every(r => r.payload.properties.is_test === true), 'Internal browsers are recorded as tests');
  assert.equal(own.google.length, 0, 'Internal browsers send no Google funnel events');
  const ordinary = setup('https://instaplaque.co.uk/', own.saved);
  own.saved.removeItem('instaplaque-internal-v1'); ordinary.api.startSiteAnalytics();
  assert.ok(ordinary.requests.length > 0 && ordinary.requests.every(r => r.payload.properties.is_test === false), 'Clearing the mark counts the browser again');
  const google = [], funnel = setup('https://instaplaque.co.uk/design?email=private@example.test');
  funnel.win.gtag = (...args) => google.push(args);
  funnel.api.trackSiteEvent('proof_download_prepared',{format:'pdf'});
  assert.equal(google.length,0);
  funnel.api.setAnalyticsConsent(true);
  funnel.api.trackSiteEvent('proof_download_requested',{format:'pdf'});
  assert.equal(google[0][1],'proof_download_requested','A download click is separately recorded, never as a prepared download');
  funnel.api.trackSiteEvent('proof_download_prepared',{format:'pdf'});
  funnel.api.trackSiteEvent('checkout_started',{value_gbp:95.5},'checkout:PRIVATESESSION');
  funnel.api.trackSiteEvent('checkout_started',{value_gbp:95.5},'checkout:PRIVATESESSION');
  assert.equal(google.length,3);
  assert.equal(google[1][1],'proof_download_prepared');
  assert.equal(google[1][2].file_format,'pdf','Existing prepared-download event contract retained');
  assert.equal(google[2][1],'begin_checkout');
  assert.equal(google[2][2].value,95.5);
  assert.equal(google[2][2].currency,'GBP');
  assert.equal(google[2][2].items[0].price,95.5);
  assert.ok(!JSON.stringify(google).includes('PRIVATESESSION'));
  assert.ok(!JSON.stringify(google).includes('private@example.test'));
  assert.ok(google.every(event => event[2].send_to==='G-FKP17EXNBX'));
  funnel.api.setAnalyticsConsent(false);
  funnel.api.trackSiteEvent('proof_download_prepared',{format:'pdf'});
  qa.win.gtag = (...args) => google.push(args);
  qa.api.trackSiteEvent('proof_download_prepared',{format:'pdf'});
  assert.equal(google.length,3,'Withdrawal and identifiable QA cannot send Google funnel events');
  const observed = setup('https://instaplaque.co.uk/design?wording=PRIVATEWORDING&gclid=PRIVATECLICKID');
  observed.api.setAnalyticsConsent(true);
  const funnelEvents = ['designer_started', 'designer_step_viewed', 'wording_started', 'price_viewed',
    'layout_requested', 'layout_generated', 'layout_failed', 'proof_download_requested', 'proof_download_prepared', 'proof_download_failed',
    'proof_saved', 'proof_email_requested', 'proof_emailed', 'proof_email_failed', 'checkout_requested', 'checkout_failed',
    'enquiry_started', 'enquiry_reviewed', 'enquiry_submission_requested', 'enquiry_submitted', 'enquiry_failed'];
  for (const event of funnelEvents) {
    observed.api.trackSiteEvent(event, { step: 'wording', method: 'manual', product: 'memorial-plaques', value_gbp: 58.5, price_context: 'starting',
      outcome_source: 'design_request_api', email: 'PRIVATEEMAIL@example.test', wording: 'PRIVATEWORDING', url: 'PRIVATEURL', gclid: 'PRIVATECLICKID' }, event);
    observed.api.trackSiteEvent(event, {}, event);
  }
  assert.deepEqual(observed.google.map(event => event[1]), funnelEvents, 'Every funnel observation is bridged once with its original name');
  assert.equal(observed.google.find(event => event[1] === 'price_viewed')[2].value_gbp, 58.5);
  assert.equal(observed.google.find(event => event[1] === 'price_viewed')[2].price_context, 'starting');
  assert.equal(observed.google.find(event => event[1] === 'designer_step_viewed')[2].step, 'wording');
  for (const secret of ['PRIVATEEMAIL', 'PRIVATEWORDING', 'PRIVATEURL', 'PRIVATECLICKID']) {
    assert.ok(!JSON.stringify([observed.google, observed.requests]).includes(secret), `Custom funnel events redact ${secret}`);
  }
  for (const event of funnelEvents) qa.api.trackSiteEvent(event);
  assert.equal(google.length,3,'Every new funnel observation is suppressed in GA4 for QA sessions');
  const contacts = setup('https://instaplaque.co.uk/memorial-plaques?gclid=CONTACTCLICKID');
  contacts.api.startSiteAnalytics(); contacts.api.startSiteAnalytics();
  const whatsapp = contactLink('https://wa.me/447464843841?text=PRIVATEWORDING%20IP-A1B2C3D4E5');
  clickContact(contacts, whatsapp);
  assert.equal(contacts.requests.length,0,'Contact taps before consent do not capture or create sessions');
  assert.equal(contacts.google.length,0);
  contacts.api.setAnalyticsConsent(true);
  clickContact(contacts, whatsapp);
  clickContact(contacts, whatsapp);
  clickContact(contacts, whatsapp, {detail:2});
  clickContact(contacts, whatsapp, {type:'auxclick',button:0});
  assert.equal(contacts.google.length,1,'Repeated initialization, rapid taps and double-clicks cannot duplicate a contact event');
  assert.equal(contacts.google[0][1],'contact_clicked');
  assert.equal(contacts.google[0][2].channel,'whatsapp');
  assert.equal(contacts.google[0][2].placement,'hero');
  assert.equal(contacts.google[0][2].contact_reference,'IP-A1B2C3D4E5');
  assert.equal(contacts.requests.find(r => r.payload.event === 'ip_contact_clicked').payload.properties.source,'google');
  contacts.advanceTime(1500);
  clickContact(contacts, whatsapp, {type:'auxclick',button:1});
  assert.equal(contacts.google.length,2,'A later deliberate middle-click counts once');
  clickContact(contacts, contactLink('mailto:hello@instaplaque.co.uk?subject=PRIVATEWORDING','mobile_bar','IP-0123456789'));
  clickContact(contacts, contactLink('tel:07464843841','contact'));
  clickContact(contacts, contactLink('mailto:hello@instaplaque.co.uk','footer'));
  assert.deepEqual(contacts.google.map(event => event[2].channel), ['whatsapp','whatsapp','email','phone','email']);
  assert.deepEqual(contacts.google.map(event => event[2].placement), ['hero','hero','mobile_bar','contact','footer']);
  const contactCount = contacts.google.length;
  for (const href of ['https://wa.me/447300000000', 'https://wa.me.evil.test/447464843841', 'http://wa.me/447464843841',
    'https://wa.me/447464843841/other', 'https://evil@wa.me/447464843841', '/contact', 'javascript:void(0)']) {
    clickContact(contacts, contactLink(href));
  }
  clickContact(contacts, contactLink('mailto:hello@instaplaque.co.uk'), {type:'auxclick',button:2});
  clickContact(contacts, contactLink('mailto:hello@instaplaque.co.uk'), {button:1});
  clickContact(contacts, contactLink('mailto:hello@instaplaque.co.uk'), {cancelled:true});
  assert.equal(contacts.google.length,contactCount,'Only the intended WhatsApp target and genuine mail/phone actions count');
  // The WhatsApp QR window's own "Open WhatsApp" link: the contact was recorded when the window opened (owner msg 6356).
  clickContact(contacts, contactLink('https://wa.me/447464843841', 'hero', 'IP-A1B2C3D4E5', { 'data-contact-counted': '' }));
  assert.equal(contacts.google.length,contactCount,'A link already counted by the QR window is not counted twice');
  clickContact(contacts, contactLink('mailto:hello@instaplaque.co.uk', 'PRIVATEPLACEMENT', 'PRIVATEREFERENCE'));
  assert.equal(contacts.google.at(-1)[2].placement,undefined);
  assert.equal(contacts.google.at(-1)[2].contact_reference,undefined);
  for (const secret of ['PRIVATEWORDING','PRIVATEPLACEMENT','PRIVATEREFERENCE','CONTACTCLICKID','hello@','07464843841','wa.me']) {
    assert.ok(!JSON.stringify([contacts.google, contacts.requests]).includes(secret), `Contact events redact ${secret}`);
  }
  assert.ok(contacts.google.every(event => event[1] === 'contact_clicked'), 'Opening a contact app never implies a lead, enquiry or purchase');
  const allowedContacts = contacts.google.length;
  for (const url of ['http://localhost:5173/', 'https://preview.vercel.app/', 'https://instaplaque.co.uk/design?proof=PRIVATEPROOF', 'https://instaplaque.co.uk/admin']) {
    contacts.sandbox.location = new URL(url);
    clickContact(contacts, contactLink('https://wa.me/447464843841'));
  }
  contacts.sandbox.location = new URL('https://instaplaque.co.uk/');
  contacts.api.setAnalyticsConsent(false);
  clickContact(contacts, contactLink('mailto:hello@instaplaque.co.uk'));
  assert.equal(contacts.google.length,allowedContacts,'Private/preview/local contact clicks and withdrawn consent are excluded');
  qa.api.startSiteAnalytics();
  clickContact(qa, contactLink('https://wa.me/447464843841'));
  assert.equal(google.length,3,'QA contact clicks never reach GA4');
  for (const key of ['gclid','gbraid','wbraid']) {
    const tagged = setup(`https://instaplaque.co.uk/?${key}=PRIVATE_CLICK_123`);
    tagged.api.setAnalyticsConsent(true);
    assert.equal(tagged.requests[0].payload.properties.source,'google');
    assert.equal(tagged.requests[0].payload.properties.medium,'cpc');
    assert.equal(tagged.requests[0].payload.properties.traffic_type,'tagged campaign');
    assert.ok(!JSON.stringify(tagged.requests).includes('PRIVATE_CLICK_123'));
    assert.ok(!tagged.saved.getItem('instaplaque-analytics-session-v1').includes('PRIVATE_CLICK_123'));
  }
  for (const value of ['', 'tiny', 'private%40example.test', 'https%3A%2F%2Fprivate.test', 'a'.repeat(513)]) {
    const invalid = setup(`https://instaplaque.co.uk/?gclid=${value}`);
    invalid.api.setAnalyticsConsent(true);
    assert.equal(invalid.requests[0].payload.properties.source,'direct/unknown','Malformed/empty click IDs cannot classify traffic as paid');
  }
  const explicit = setup('https://instaplaque.co.uk/?utm_source=newsletter&utm_medium=email&utm_campaign=autumn&gclid=PRIVATE_CLICK_123');
  explicit.api.setAnalyticsConsent(true);
  assert.equal(explicit.requests[0].payload.properties.source,'newsletter','Explicit valid campaign source takes priority over inferred Google attribution');
  assert.equal(explicit.requests[0].payload.properties.medium,'email');
  const googleUtm = setup('https://instaplaque.co.uk/?utm_source=google&utm_campaign=autumn&gbraid=PRIVATE_CLICK_123');
  googleUtm.api.setAnalyticsConsent(true);
  assert.equal(googleUtm.requests[0].payload.properties.medium,'cpc','Partial Google UTMs gain a paid medium from auto-tagging');
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
  console.log('Analytics: consent/withdrawal, private/local exclusions, GA4 funnel contracts, safe contact references/placements, click dedupe, Google auto-tag classification, payload redaction, QA suppression, purchase guards/dedupe and offline safety passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
