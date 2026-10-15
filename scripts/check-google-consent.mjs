import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const origin = 'https://instaplaque.co.uk';
const consentKey = 'instaplaque-analytics-consent-v1';
const consentEvent = 'instaplaque:optional-ad-consent-changed';
const types = ['ad_storage', 'ad_user_data', 'ad_personalization', 'analytics_storage'];
const files = process.argv.slice(2);
if (!files.length) files.push('index.html');

for (const file of files) {
  const html = readFileSync(file, 'utf8');
  const scripts = [...html.match(/<head[\s\S]*?<\/head>/i)[0].matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  const bootstrap = scripts[0][1];
  assert.match(bootstrap, /window\.dataLayer/, `${file}: Google consent must be the FIRST head script`);
  assert.equal(scripts.filter(script => script[1].includes('function updateGoogleConsent()')).length, 1);
  assert.doesNotMatch(bootstrap, /ga-disable|googleTagsStarted/);

  function run({ url = origin, consent = null, storageThrows = false, referrer = '' } = {}) {
    const appended = [], listeners = new Map(), map = new Map([[consentKey, consent]]);
    const context = { URL, Date, location: new URL(url), addEventListener(name, listener) { listeners.set(name, listener); },
      localStorage: { getItem(key) { if (storageThrows) throw Error('Storage blocked'); return map.get(key) ?? null; } },
      document: { referrer, createElement: () => ({}), head: { appendChild(script) { appended.push(script); } } } };
    context.window = context;
    vm.runInNewContext(bootstrap, context);
    const queue = () => Array.from(context.dataLayer, args => Array.from(args));
    return { context, appended, queue, map, listeners };
  }
  function checkConsent(entry, action, state) {
    assert.deepEqual(entry.slice(0, 2), ['consent', action]);
    for (const key of types) assert.equal(entry[2][key], state, key);
  }
  for (const consent of [null, 'no', 'yes', 'unexpected']) {
    const h = run({ consent });
    checkConsent(h.queue()[0], 'default', 'denied');
    assert.equal(h.queue()[0][2].wait_for_update, 500);
    assert.deepEqual(h.queue()[1], ['set', 'ads_data_redaction', true]);
    assert.deepEqual(h.queue()[2], ['set', 'url_passthrough', true]);
    checkConsent(h.queue()[3], 'update', consent === 'yes' ? 'granted' : 'denied');
    assert.equal(h.queue()[4][0], 'js');
    assert.deepEqual(h.queue().filter(args => args[0] === 'config').map(args => args[1]), ['AW-18288208905', 'G-FKP17EXNBX']);
    assert.equal(h.appended.length, 1, 'Public loader must not wait for consent');
    assert.equal(h.appended[0].src, 'https://www.googletagmanager.com/gtag/js?id=AW-18288208905');
    assert.equal(h.appended[0].async, true);
    assert.equal(Object.hasOwn(h.context, 'ga-disable-G-FKP17EXNBX'), false);
    h.map.set('instaplaque-meta-consent', 'yes');
    h.map.set(consentKey, 'no');
    h.listeners.get(consentEvent)();
    checkConsent(h.queue().at(-1), 'update', 'denied');
    h.map.set(consentKey, 'yes');
    h.listeners.get(consentEvent)();
    checkConsent(h.queue().at(-1), 'update', 'granted');
    h.map.set(consentKey, 'no');
    h.listeners.get('storage')();
    checkConsent(h.queue().at(-1), 'update', 'denied');
    assert.equal(h.appended.length, 1, 'Consent changes must not duplicate loaders');
    assert.equal(h.queue().filter(args => args[0] === 'config').length, 2);
  }
  const blockedStorage = run({ storageThrows: true });
  assert.equal(blockedStorage.appended.length, 1);
  checkConsent(blockedStorage.queue()[3], 'update', 'denied');
  for (const path of ['/admin', '/admin/orders', '/proof/private', '/order', '/order-confirmed', '/checkout',
    '/?proof=private', '/?order=private', '/?session_id=private', '/?view=admin', '/?view=checkout', '/?view=order']) {
    for (const consent of [null, 'no', 'yes']) {
      const h = run({ url: origin + path, consent });
      assert.equal(h.appended.length, 0, path);
      assert.equal(h.queue().some(args => ['js', 'config', 'event'].includes(args[0])), false, path);
    }
  }
  for (const host of ['localhost', 'instaplaque-preview.vercel.app', 'instaplaque.co.uk.example.test']) {
    const h = run({ url: `https://${host}/`, consent: 'yes' });
    assert.equal(h.appended.length, 0);
    checkConsent(h.queue()[3], 'update', 'denied');
  }
  assert.equal(run({ url: 'https://www.instaplaque.co.uk/' }).appended.length, 1);
  // Campaign tags and Google's ad-click identifiers reach GA4 (or ad clicks read as organic visits); anything else
  // in the address, such as an email, does not.
  const url = origin + '/design?view=design&utm_source=google&utm_medium=cpc&utm_campaign=memorial&utm_content=ad&utm_term=plaque&gclid=synthetic-click&email=private&gad_source=1&gbraid=synthetic-app&wbraid=synthetic-web&fbclid=other#private';
  const h = run({ url, referrer: origin + '/proof/private?order=private' });
  const ga = h.queue().find(args => args[0] === 'config' && args[1] === 'G-FKP17EXNBX')[2];
  assert.equal(ga.page_location, origin + '/design?view=design&utm_source=google&utm_medium=cpc&utm_campaign=memorial&utm_content=ad&utm_term=plaque&gclid=synthetic-click&gad_source=1&gbraid=synthetic-app&wbraid=synthetic-web');
  const adClick = run({ url: origin + '/brass-plaques?gclid=synthetic-click&gad_source=1', referrer: 'https://www.google.com/' });
  const adConfig = adClick.queue().find(args => args[0] === 'config' && args[1] === 'G-FKP17EXNBX')[2];
  assert.equal(adConfig.page_location, origin + '/brass-plaques?gclid=synthetic-click&gad_source=1', 'An ad click must reach GA4 as one');
  assert.equal(adConfig.page_referrer, 'https://www.google.com');
  assert.equal(ga.page_referrer, origin);
  assert.equal(h.context.location.href, url, 'Redacting GA4 must not rewrite the click-bearing browser URL');
  console.log(`PASS ${file}: consent ordering, public loading, saved/late consent, revocation, storage failure, private/preview exclusions, one loader, URL redaction and ad-click IDs kept`);
}
