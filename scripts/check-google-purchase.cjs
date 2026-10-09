const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const ts = require('typescript');

const compile = file => ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mainCode = compile('services/googlePurchase.ts');
const frameCode = fs.readFileSync('public/google-purchase.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const bootstrap = html.match(/<script>\s*(window\.dataLayer[\s\S]*?)<\/script>/)[1];
const origin = 'https://instaplaque.co.uk';
const order = { id: 'synthetic-order-reference', paymentStatus: 'paid',
  totalPence: 9550, currency: 'GBP', stripeCheckoutSessionId: 'cs_live_synthetic123',
  customerName: 'PRIVATE-NAME', customerEmail: 'PRIVATE-EMAIL', inscription: 'PRIVATE-WORDING' };
const returnUrl = origin + '/order-confirmed?order=' + order.id + '&session_id=' + order.stripeCheckoutSessionId;

function mainHarness({ url = returnUrl, consent = 'yes', map = new Map(),
  noReply = false, storageThrows = false, forgeReplies = false, crypto = webcrypto } = {}) {
  const frames = [], messages = [], listeners = new Set();
  const storage = {
    getItem(key) { if (storageThrows) throw Error('storage blocked'); return map.get(key) || null; },
    setItem(key, value) { if (storageThrows) throw Error('storage blocked'); map.set(key, value); },
  };
  const w = { location: new URL(url), crypto, setTimeout: fn => setTimeout(fn, 100),
    clearTimeout, addEventListener: (type, fn) => listeners.add(fn),
    removeEventListener: (type, fn) => listeners.delete(fn) };
  const document = {
    createElement() {
      const frame = { setAttribute(k, v) { this[k] = v; }, remove() { this.removed = true; } };
      frame.contentWindow = { postMessage(data, target) {
        messages.push({ data, target });
        const reply = { type: 'instaplaque:purchase-result', transactionId: data.transactionId, queued: true };
        if (forgeReplies) {
          for (const fn of listeners) fn({ origin: 'https://other.example', source: frame.contentWindow, data: reply });
          for (const fn of listeners) fn({ origin, source: {}, data: reply });
        }
        if (!noReply) for (const fn of [...listeners]) fn({ origin, source: frame.contentWindow, data: reply });
      } };
      return frame;
    },
    body: { appendChild(frame) { frames.push(frame); queueMicrotask(() => frame.onload()); } },
  };
  const context = { exports: {}, require: () => ({ metaConsent: () => consent,
    OPTIONAL_AD_CONSENT_CHANGED: 'instaplaque:optional-ad-consent-changed' }),
    window: w, document, localStorage: storage, URL, TextEncoder, Uint8Array, Map, Set };
  vm.runInNewContext(mainCode, context);
  return { track: context.exports.trackGooglePurchase, frames, messages, map, listeners };
}

function frameHarness({ consent = 'yes', url = origin + '/google-purchase.html', embedded = true } = {}) {
  const scripts = [], replies = [];
  let handler;
  const parent = { postMessage: (data, target) => replies.push({ data, target }) };
  const window = { parent, addEventListener: (_, fn) => { handler = fn; } };
  if (!embedded) window.parent = window;
  const context = { window, location: new URL(url), Date, Number,
    localStorage: { getItem: () => consent },
    document: { createElement: () => ({}), head: { appendChild: s => scripts.push(s) } } };
  vm.runInNewContext(frameCode, context);
  return { send: (data, changes = {}) => handler({ data, origin, source: parent, ...changes }),
    scripts, replies, window, setConsent: value => { consent = value; } };
}
const payload = { type: 'instaplaque:purchase', transactionId: 'ip_' + 'a'.repeat(64),
  value: 95.5, currency: 'GBP', customerEmail: 'PRIVATE-EMAIL', orderUrl: returnUrl };

(async () => {
  for (const url of [returnUrl, origin + '/order-confirmed', origin + '/admin',
    origin + '/proof/private', origin + '/?proof=private', origin + '/?view=checkout']) {
    const scripts = [], window = { location: new URL(url) };
    const context = { window, URL, Date, document: { referrer: '', createElement: () => ({}),
      head: { appendChild: script => scripts.push(script) } } };
    Object.defineProperty(context, 'dataLayer', { get: () => window.dataLayer });
    vm.runInNewContext(bootstrap, context);
    assert.equal(scripts.length, 0, url + ' must not load Google on a private document');
    assert.equal(window.dataLayer.length, 0);
  }
  {
    const scripts = [], window = { location: new URL(origin + '/brass-plaques?utm_source=ad&untrusted=private#secret') };
    const context = { window, URL, Date, document: { referrer: origin + '/?proof=private',
      createElement: () => ({}), head: { appendChild: script => scripts.push(script) } } };
    Object.defineProperty(context, 'dataLayer', { get: () => window.dataLayer });
    vm.runInNewContext(bootstrap, context);
    assert.equal(scripts.length, 1, 'Public pages retain one loader');
    const configs = window.dataLayer.filter(args => args[0] === 'config');
    assert.equal(configs.length, 2);
    const ga = configs.find(args => args[1] === 'G-FKP17EXNBX');
    assert.equal(ga[2].page_location, origin + '/brass-plaques?utm_source=ad');
    assert.equal(ga[2].page_referrer, origin);
  }
  console.log('PASS private Google bootstrap exclusions and unchanged public GA4 URL redaction');
  let h = mainHarness();
  assert.deepEqual(await Promise.all([h.track(order), h.track(order)]), [true, true]);
  assert.equal(h.frames.length, 1, 'Concurrent React calls share one measurement');
  assert.equal(await h.track(order), false, 'Repeated calls are suppressed');
  assert.equal(h.frames[0].src, '/google-purchase.html');
  assert.equal(h.frames[0].referrerPolicy, 'no-referrer');
  assert.equal(h.frames[0].hidden, true);
  assert.equal(h.frames[0].removed, true);
  assert.equal(h.listeners.size, 0);
  assert.match(h.messages[0].data.transactionId, /^ip_[a-f0-9]{64}$/);
  assert.equal(h.messages[0].data.value, 95.5);
  assert.equal(h.messages[0].target, origin);
  for (const privateValue of [order.id, order.stripeCheckoutSessionId, order.customerName,
    order.customerEmail, order.inscription]) {
    assert(!JSON.stringify(h.messages).includes(privateValue), privateValue);
  }
  const reloaded = mainHarness({ map: h.map });
  assert.equal(await reloaded.track(order), false, 'Reload honours durable dedupe');
  console.log('PASS paid GBP amount, concurrent/reload dedupe, digest ID and private-field exclusion');

  for (const edit of [
    { paymentStatus: 'unpaid' }, { paymentStatus: 'refunded' }, { totalPence: 0 },
    { totalPence: -1 }, { totalPence: NaN }, { totalPence: 95.5 }, { currency: 'USD' },
    { currency: null }, { stripeCheckoutSessionId: 'cs_test_synthetic123' },
    { stripeCheckoutSessionId: undefined }, { id: 'different-order' },
    { metadata: { checkoutTestPolicy: '123x456-sandbox-v1' } },
  ]) {
    h = mainHarness();
    assert.equal(await h.track({ ...order, ...edit }), false, JSON.stringify(edit));
    assert.equal(h.frames.length, 0);
  }
  for (const options of [
    { consent: 'no' }, { consent: null }, { url: origin + '/admin' },
    { url: origin + '/order-confirmed?order=' + order.id },
    { url: returnUrl.replace('cs_live_synthetic123', 'cs_live_other') },
    { url: returnUrl.replace(origin, 'https://preview.vercel.app') },
    { url: returnUrl.replace(origin, 'http://instaplaque.co.uk') },
    { crypto: {} },
  ]) {
    h = mainHarness(options);
    assert.equal(await h.track(order), false, JSON.stringify(options));
    assert.equal(h.frames.length, 0);
  }
  console.log('PASS unpaid/refunded/test/malformed orders, rejected/missing consent and non-production/private visits');

  h = mainHarness({ noReply: true, forgeReplies: true });
  assert.equal(await h.track(order), false, 'Forged messages cannot mark a conversion');
  assert.equal(h.map.size, 0);
  assert.equal(h.frames[0].removed, true);
  assert.equal(h.listeners.size, 0);
  h = mainHarness({ storageThrows: true });
  assert.equal(await h.track(order), true, 'Unavailable dedupe storage must not break checkout');
  assert.equal(await h.track(order), false, 'Memory still deduplicates');
  console.log('PASS origin/source validation, bounded cleanup, crypto/storage failures');

  let f = frameHarness();
  f.send(payload);
  assert.equal(f.scripts.length, 1);
  assert.equal(f.scripts[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-FKP17EXNBX');
  f.scripts[0].onload();
  const events = f.window.dataLayer.map(args => Array.from(args));
  const config = events.find(e => e[0] === 'config');
  const purchase = events.find(e => e[0] === 'event');
  assert.equal(config[2].send_page_view, false);
  assert.equal(purchase[1], 'purchase');
  assert.equal(purchase[2].send_to, 'G-FKP17EXNBX');
  assert.equal(purchase[2].transaction_id, payload.transactionId);
  assert.equal(purchase[2].currency, 'GBP');
  assert.equal(purchase[2].value, 95.5);
  assert.equal(purchase[2].page_location, origin + '/order-confirmed');
  assert.equal(purchase[2].page_referrer, '');
  assert.equal(purchase[2].items[0].item_name, 'Custom plaque');
  assert(!JSON.stringify(events).includes('PRIVATE-'));
  assert(!JSON.stringify(events).includes(order.id));
  assert(!JSON.stringify(events).includes(order.stripeCheckoutSessionId));
  purchase[2].event_callback();
  assert.equal(f.replies[0].data.queued, true);
  f.send(payload);
  assert.equal(f.scripts.length, 1);
  console.log('PASS exact GA4 purchase destination/value, safe page fields, no private data or duplicate frame event');

  for (const settings of [{ consent: 'no' }, { consent: null }, { embedded: false },
    { url: origin + '/google-purchase.html?order=private' },
    { url: 'https://preview.vercel.app/google-purchase.html' }]) {
    f = frameHarness(settings); f.send(payload); assert.equal(f.scripts.length, 0);
  }
  for (const change of [{ origin: 'https://other.example' }, { source: {} }]) {
    f = frameHarness(); f.send(payload, change); assert.equal(f.scripts.length, 0);
  }
  for (const change of [{ transactionId: order.id }, { value: NaN }, { value: -1 },
    { currency: 'USD' }, { type: 'anything-else' }]) {
    f = frameHarness(); f.send({ ...payload, ...change }); assert.equal(f.scripts.length, 0);
  }
  f = frameHarness(); f.send(payload); f.setConsent('no'); f.scripts[0].onload();
  assert(!f.window.dataLayer.some(e => e[0] === 'event'));
  assert.equal(f.replies[0].data.queued, false);
  f = frameHarness(); f.send(payload); f.scripts[0].onerror();
  assert.equal(f.replies[0].data.queued, false);
  console.log('PASS frame consent/revocation, standalone/preview refusal, malformed/spoofed messages and blocked tag');
})().catch(error => { console.error(error); process.exitCode = 1; });
