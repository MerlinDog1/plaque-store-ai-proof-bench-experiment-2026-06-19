// Meta purchase measurement (services/metaPurchase.ts + public/meta-purchase.js), modelled on check-google-purchase.cjs.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const ts = require('typescript');

const compile = file => ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mainCode = compile('services/metaPurchase.ts');
const frameCode = fs.readFileSync('public/meta-purchase.js', 'utf8');
const pixelId = fs.readFileSync('services/metaPixel.ts', 'utf8').match(/META_PIXEL_ID = '(\d+)'/)[1];
const origin = 'https://instaplaque.co.uk';
const order = { id: 'synthetic-order-reference', paymentStatus: 'paid',
  totalPence: 9550, currency: 'GBP', stripeCheckoutSessionId: 'cs_live_synthetic123',
  customerName: 'PRIVATE-NAME', customerEmail: 'PRIVATE-EMAIL', inscription: 'PRIVATE-WORDING' };
const returnUrl = origin + '/order-confirmed?order=' + order.id + '&session_id=' + order.stripeCheckoutSessionId;

function mainHarness({ url = returnUrl, consent = 'yes', internal = false, map = new Map(),
  noReply = false, storageThrows = false, forgeReplies = false } = {}) {
  const frames = [], messages = [], listeners = new Set();
  const storage = {
    getItem(key) { if (storageThrows) throw Error('storage blocked'); return map.get(key) || null; },
    setItem(key, value) { if (storageThrows) throw Error('storage blocked'); map.set(key, value); },
  };
  const w = { location: new URL(url), crypto: webcrypto, setTimeout: fn => setTimeout(fn, 100),
    clearTimeout, addEventListener: (type, fn) => listeners.add(fn),
    removeEventListener: (type, fn) => listeners.delete(fn) };
  const document = {
    createElement() {
      const frame = { setAttribute(k, v) { this[k] = v; }, remove() { this.removed = true; } };
      frame.contentWindow = { postMessage(data, target) {
        messages.push({ data, target });
        const reply = { type: 'instaplaque:meta-purchase-result', eventId: data.eventId, queued: true };
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
  const context = { exports: {}, require: () => ({ metaConsent: () => consent, isInternalBrowser: () => internal }),
    window: w, document, localStorage: storage, URL, TextEncoder, Uint8Array, Map, Set };
  vm.runInNewContext(mainCode, context);
  return { track: context.exports.trackMetaPurchase, frames, messages, map, listeners };
}

function frameHarness({ consent = 'yes', url = origin + '/meta-purchase.html', embedded = true } = {}) {
  const scripts = [], replies = [];
  let handler;
  const parent = { postMessage: (data, target) => replies.push({ data, target }) };
  const window = { parent, addEventListener: (_, fn) => { handler = fn; } };
  if (!embedded) window.parent = window;
  const context = { window, location: new URL(url), Number, setTimeout: fn => fn(),
    localStorage: { getItem: () => consent },
    document: { createElement: () => ({}), head: { appendChild: s => scripts.push(s) } } };
  vm.runInNewContext(frameCode, context);
  // JSON copy: the queue lives in the VM's realm, so deepEqual would compare prototypes too.
  const calls = () => (window.fbq ? JSON.parse(JSON.stringify(window.fbq.queue.map(args => Array.from(args)))) : []);
  return { send: (data, changes = {}) => handler({ data, origin, source: parent, ...changes }),
    scripts, replies, window, calls, setConsent: value => { consent = value; } };
}
const payload = { type: 'instaplaque:meta-purchase', eventId: 'ip_' + 'b'.repeat(64),
  value: 95.5, currency: 'GBP', customerEmail: 'PRIVATE-EMAIL', orderUrl: returnUrl };

(async () => {
  // The website and the purchase frame report to the same, new InstaPlaque dataset.
  assert.equal(pixelId, '4216755011787795');
  assert.equal(frameCode.match(/pixelId = '(\d+)'/)[1], pixelId, 'meta-purchase.js and metaPixel.ts must use the same pixel');

  let h = mainHarness();
  assert.deepEqual(await Promise.all([h.track(order), h.track(order)]), [true, true]);
  assert.equal(h.frames.length, 1, 'Concurrent React calls share one measurement');
  assert.equal(await h.track(order), false, 'Repeated calls are suppressed');
  assert.equal(h.frames[0].src, '/meta-purchase.html');
  assert.equal(h.frames[0].referrerPolicy, 'no-referrer');
  assert.equal(h.frames[0].hidden, true);
  assert.equal(h.frames[0].removed, true);
  assert.equal(h.listeners.size, 0);
  assert.match(h.messages[0].data.eventId, /^ip_[a-f0-9]{64}$/);
  assert.equal(h.messages[0].data.value, 95.5);
  assert.equal(h.messages[0].data.currency, 'GBP');
  assert.equal(h.messages[0].target, origin);
  const sent = JSON.stringify(h.messages) + h.frames[0].src;
  for (const privateValue of [order.id, order.stripeCheckoutSessionId, order.customerName, order.customerEmail, order.inscription]) {
    assert.equal(sent.includes(privateValue), false, privateValue + ' must never reach the Meta frame');
  }
  // A second page load with the same browser storage does not report the order twice.
  const again = mainHarness({ map: h.map });
  assert.equal(await again.track(order), false);
  assert.equal(again.frames.length, 0);
  console.log('PASS one Purchase per paid order, private frame URL and referrer, digest event ID, no private fields, dedupe across loads');

  for (const options of [{ consent: null }, { consent: 'no' }, { internal: true }]) {
    h = mainHarness(options);
    assert.equal(await h.track(order), false);
    assert.equal(h.frames.length, 0);
  }
  for (const url of [origin + '/order-confirmed', origin + '/order-confirmed?order=other&session_id=' + order.stripeCheckoutSessionId,
    origin + '/order-confirmed?order=' + order.id + '&session_id=cs_live_other', 'http://instaplaque.co.uk/order-confirmed?order=' + order.id
    + '&session_id=' + order.stripeCheckoutSessionId, 'https://example.com/order-confirmed?order=' + order.id + '&session_id=' + order.stripeCheckoutSessionId,
    origin + '/design']) {
    h = mainHarness({ url });
    assert.equal(await h.track(order), false, url);
    assert.equal(h.frames.length, 0);
  }
  for (const edit of [{ paymentStatus: 'pending' }, { currency: 'EUR' }, { totalPence: 0 }, { totalPence: 95.5 },
    { metadata: { checkoutTestPolicy: true } }, { metadata: { liveVerificationPolicy: 'x' } }, { metadata: { noFulfilment: true } }]) {
    h = mainHarness();
    assert.equal(await h.track({ ...order, ...edit }), false, JSON.stringify(edit));
    assert.equal(h.frames.length, 0);
  }
  {
    const testOrder = { ...order, stripeCheckoutSessionId: 'cs_test_synthetic123' };
    h = mainHarness({ url: origin + '/order-confirmed?order=' + order.id + '&session_id=' + testOrder.stripeCheckoutSessionId });
    assert.equal(await h.track(testOrder), false, 'Stripe test sessions never reach Meta');
  }
  console.log('PASS consent, the owner\'s browsers, wrong pages or sessions, unpaid, non-GBP, zero, test and no-fulfilment orders');

  h = mainHarness({ forgeReplies: true });
  assert.equal(await h.track(order), true, 'Only the frame\'s own same-origin reply counts');
  h = mainHarness({ noReply: true });
  assert.equal(await h.track(order), false, 'No reply times out');
  assert.equal(h.map.size, 0, 'A timed-out measurement is not recorded, so a later load can retry');
  h = mainHarness({ storageThrows: true });
  assert.equal(await h.track(order), true, 'Blocked storage still measures once');
  assert.equal(await h.track(order), false);
  console.log('PASS forged replies ignored, timeout, blocked storage');

  let f = frameHarness();
  f.send(payload);
  assert.equal(f.scripts.length, 1);
  assert.equal(f.scripts[0].src, 'https://connect.facebook.net/en_US/fbevents.js');
  f.scripts[0].onload();
  const calls = f.calls();
  assert.deepEqual(calls.slice(0, 3), [['consent', 'grant'], ['set', 'autoConfig', false, pixelId], ['init', pixelId]]);
  const purchase = calls.find(c => c[0] === 'trackSingle');
  assert.equal(purchase[1], pixelId);
  assert.equal(purchase[2], 'Purchase');
  assert.equal(purchase[3].value, 95.5);
  assert.equal(purchase[3].currency, 'GBP');
  assert.deepEqual(purchase[4], { eventID: payload.eventId });
  assert.equal(calls.some(c => c.includes('PageView')), false, 'The frame never sends a page view');
  assert.equal(JSON.stringify(calls).includes('PRIVATE'), false);
  assert.equal(JSON.stringify(calls).includes('order-confirmed'), false);
  assert.deepEqual(f.replies.map(r => r.data.queued), [true]);
  f.send({ ...payload, eventId: 'ip_' + 'c'.repeat(64) });
  assert.equal(f.scripts.length, 1, 'One purchase per frame');
  for (const bad of [{ type: 'other' }, { eventId: 'raw-order-id' }, { value: -1 }, { value: '95.5' }, { currency: 'USD' }]) {
    f = frameHarness();
    f.send({ ...payload, ...bad });
    assert.equal(f.scripts.length, 0, JSON.stringify(bad));
  }
  for (const changes of [{ origin: 'https://other.example' }, { source: {} }]) {
    f = frameHarness();
    f.send(payload, changes);
    assert.equal(f.scripts.length, 0);
  }
  for (const url of [origin + '/meta-purchase.html?order=1', origin + '/other.html', 'http://instaplaque.co.uk/meta-purchase.html']) {
    f = frameHarness({ url });
    f.send(payload);
    assert.equal(f.scripts.length, 0, url);
  }
  f = frameHarness({ embedded: false });
  f.send(payload);
  assert.equal(f.scripts.length, 0, 'Only works inside the site');
  f = frameHarness({ consent: 'no' });
  f.send(payload);
  assert.equal(f.scripts.length, 0);
  assert.deepEqual(f.replies.map(r => r.data.queued), [false]);
  f = frameHarness();
  f.send(payload);
  f.setConsent('no');
  f.scripts[0].onload();
  assert.equal(f.calls().some(c => c[2] === 'Purchase'), false, 'Consent withdrawn while loading sends nothing');
  console.log('PASS frame: one Purchase with value, currency and event ID only, no page view, strict origin/path/payload, consent');
})().catch(error => { console.error(error); process.exit(1); });
