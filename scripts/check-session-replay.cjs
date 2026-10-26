// Session recordings (owner msg 6565, 26 Oct 2026): services/sessionReplay.ts with the real posthogAnalytics.ts, in a
// sandbox with a stand-in for posthog-js. Checks that it loads only with recording consent on a public page and never
// for the owner's browser; its privacy settings (inputs masked, ph-no-capture blocked, ph-mask masked, only recording
// data sent, no query strings in network timings, local storage only); that it stops before a private page's URL is
// pushed; and that withdrawal opts out and removes PostHog's storage.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { webcrypto } = require('node:crypto');
const compile = file => ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const TOKEN = 'phc_txLFAUv88ttyLLTKgi3arQ7428Jy5XSQEtGFm6jYrYxJ';

function storage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)), removeItem: key => data.delete(key),
    key: index => [...data.keys()][index] ?? null, get length() { return data.size; }, has: key => data.has(key) };
}

function setup(url, { local = storage(), session = storage() } = {}) {
  const log = [];
  const posthog = { __SV: 1, configs: [],
    init: (token, config) => { log.push('init'); posthog.configs.push({ token, config }); },
    startSessionRecording: () => log.push('start'), stopSessionRecording: () => log.push('stop'),
    opt_out_capturing: () => log.push('opt_out'), opt_in_capturing: () => log.push('opt_in') };
  const win = new EventTarget(); Object.assign(win, { posthog, setTimeout, clearTimeout });
  const sandbox = { exports: {}, URL, Event, AbortController, TextEncoder, crypto: webcrypto, Date, console, setTimeout, clearTimeout,
    window: win, localStorage: local, sessionStorage: session, location: new URL(url),
    document: Object.assign(new EventTarget(), { referrer: '', addEventListener() {} }),
    navigator: { userAgent: 'Mozilla Chrome/130.0 Safari/537', maxTouchPoints: 0 },
    fetch: async () => ({ ok: true }) };
  sandbox.history = {
    pushState(data, unused, next) { log.push(`push:${new URL(next, sandbox.location.href).pathname}`); sandbox.location = new URL(next, sandbox.location.href); },
    replaceState(data, unused, next) { log.push(`replace:${new URL(next, sandbox.location.href).pathname}`); sandbox.location = new URL(next, sandbox.location.href); },
  };
  return { log, posthog, sandbox, local, session };
}

// Both modules read `location` through a getter, so pushState in the stand-in history moves them too.
function start(url, options) {
  const s = setup(url, options);
  const analyticsContext = vm.createContext({ ...s.sandbox, exports: {}, require: name => ({ './commerce': { productFamilies: [{ slug: 'memorial-plaques' }], seoLandingPages: [{ slug: 'tree-memorial-plaques' }] },
    './shopInformation': { businessContact: { whatsappHref: 'https://wa.me/447464843841' } },
    './metaPixel': { OPTIONAL_AD_CONSENT_CHANGED: 'consent', metaConsent: () => s.local.getItem('instaplaque-meta-consent'), isInternalBrowser: () => s.local.getItem('instaplaque-internal-v1') === 'yes' } })[name] });
  Object.defineProperty(analyticsContext, 'location', { get: () => s.sandbox.location });
  vm.runInContext(compile('services/posthogAnalytics.ts'), analyticsContext);
  const analytics = analyticsContext.exports;
  const replayContext = vm.createContext({ ...s.sandbox, exports: {}, require: name => (name === './posthogAnalytics' ? analytics : (() => { throw new Error(name); })()) });
  Object.defineProperty(replayContext, 'location', { get: () => s.sandbox.location });
  vm.runInContext(compile('services/sessionReplay.ts'), replayContext);
  return { ...s, analytics, replay: replayContext.exports };
}

// 1. No consent: nothing loads. Consent on a public page: one init, recording started, with the privacy settings.
const a = start('https://instaplaque.co.uk/memorial-plaques?gclid=CLICK');
a.replay.startSessionReplay();
assert.deepEqual(a.log, [], 'Nothing before consent');
a.analytics.setAnalyticsConsent(true);
assert.deepEqual(a.log, ['init', 'start'], 'Consent starts one recording');
const { token, config } = a.posthog.configs[0];
assert.equal(token, TOKEN);
const visit = a.analytics.replayVisit();
assert.equal(config.api_host, 'https://eu.i.posthog.com', 'EU ingestion');
assert.equal(config.persistence, 'localStorage', 'No cookies');
assert.deepEqual({ ...config.bootstrap }, { distinctID: visit, sessionID: visit }, 'The recording shares the visit ID');
for (const key of ['autocapture', 'capture_pageview', 'capture_pageleave', 'rageclick', 'capture_dead_clicks', 'capture_heatmaps', 'capture_exceptions']) {
  assert.equal(config[key], false, `${key} off`);
}
assert.equal(config.disable_session_recording, true, 'Recording runs only when started');
assert.equal(config.session_recording.maskAllInputs, true, 'Everything typed is masked');
assert.equal(config.session_recording.blockClass, 'ph-no-capture');
assert.equal(config.session_recording.maskTextClass, 'ph-mask');
assert.equal(config.before_send({ event: '$snapshot', properties: {} }).event, '$snapshot', 'Recording data is sent');
for (const event of ['$pageview', '$autocapture', '$rageclick', '$opt_in', '$exception', '$identify', 'anything']) {
  assert.equal(config.before_send({ event, properties: {} }), null, `${event} is not sent`);
}
assert.equal(config.session_recording.maskCapturedNetworkRequestFn({ name: 'https://instaplaque.co.uk/api/orders/1?proof=SECRET#x', duration: 3 }).name,
  'https://instaplaque.co.uk/api/orders/1', 'Network timings keep no query strings');
a.analytics.setAnalyticsConsent(true);
a.replay.startSessionReplay();
assert.deepEqual(a.log, ['init', 'start'], 'Repeated consent or start-up does not load twice');

// 2. Private pages stop it before their URL is pushed (so before they render); public pages start it again.
a.sandbox.history.pushState({}, '', '/checkout');
assert.deepEqual(a.log.slice(2), ['stop', 'push:/checkout'], 'Stops before the checkout URL is pushed');
a.sandbox.history.pushState({}, '', '/design');
assert.deepEqual(a.log.slice(4), ['push:/design', 'start'], 'Starts again on a public page');
a.sandbox.history.replaceState({}, '', '/design?proof=SECRET');
assert.deepEqual(a.log.slice(6), ['stop', 'replace:/design'], 'Stops before a private proof URL replaces the address');
a.sandbox.history.replaceState({}, '', '/design?backing=stake');
assert.deepEqual(a.log.slice(8), ['replace:/design', 'start']);

// 3. The owner's own browser is never recorded.
a.local.setItem('instaplaque-internal-v1', 'yes');
a.sandbox.history.pushState({}, '', '/tree-memorial-plaques');
assert.deepEqual(a.log.slice(10), ['push:/tree-memorial-plaques', 'stop'], 'Internal browsers stop recording');
a.local.removeItem('instaplaque-internal-v1');

// 4. Withdrawal: stop (already stopped), opt out and remove PostHog's storage; other storage untouched.
a.sandbox.history.pushState({}, '', '/memorial-plaques');
assert.equal(a.log.at(-1), 'start');
a.local.setItem(`ph_${TOKEN}_posthog`, '{}'); a.local.setItem(`__ph_opt_in_out_${TOKEN}`, '1'); a.session.setItem(`ph_${TOKEN}_window_id`, 'w');
a.local.setItem('plaques-ai-mock-orders', '[]');
a.analytics.setAnalyticsConsent(false);
assert.deepEqual(a.log.slice(-2), ['stop', 'opt_out'], 'Withdrawal stops and opts out');
assert.ok(!a.local.has(`ph_${TOKEN}_posthog`) && !a.local.has(`__ph_opt_in_out_${TOKEN}`) && !a.session.has(`ph_${TOKEN}_window_id`), 'PostHog storage removed');
assert.ok(a.local.has('plaques-ai-mock-orders'), 'Other storage untouched');
a.analytics.setAnalyticsConsent(true);
assert.deepEqual(a.log.slice(-2), ['opt_in', 'start'], 'Accepting again resumes without a second load');
assert.equal(a.log.filter(entry => entry === 'init').length, 1);

// 5. A full load of a private page, an earlier consent from before recordings were described, and the owner's browser.
for (const [url, preset, why] of [
  ['https://instaplaque.co.uk/order-confirmed?order=X&session_id=cs_live_Y', { 'instaplaque-analytics-consent-v1': 'yes', 'instaplaque-replay-consent-v1': 'yes' }, 'private page'],
  ['https://instaplaque.co.uk/design?proof=SECRET', { 'instaplaque-analytics-consent-v1': 'yes', 'instaplaque-replay-consent-v1': 'yes' }, 'proof link'],
  ['https://instaplaque.co.uk/', { 'instaplaque-analytics-consent-v1': 'yes' }, 'earlier consent'],
  ['https://instaplaque.co.uk/', { 'instaplaque-analytics-consent-v1': 'yes', 'instaplaque-replay-consent-v1': 'yes', 'instaplaque-internal-v1': 'yes' }, 'owner\'s browser'],
  ['https://instaplaque-abc.vercel.app/', { 'instaplaque-analytics-consent-v1': 'yes', 'instaplaque-replay-consent-v1': 'yes' }, 'preview host'],
]) {
  const s = start(url, { local: storage(preset) });
  s.replay.startSessionReplay();
  assert.equal(s.log.includes('init'), false, `No recording for the ${why}`);
}
const back = start('https://instaplaque.co.uk/tree-memorial-plaques', { local: storage({ 'instaplaque-analytics-consent-v1': 'yes', 'instaplaque-replay-consent-v1': 'yes' }) });
back.replay.startSessionReplay();
assert.deepEqual(back.log, ['init', 'start'], 'A returning visitor who accepted recordings is recorded on load');
console.log('Session replay: consent-only loading, owner/preview/private exclusions, stop before private URLs, masking and send-only-recordings settings, withdrawal clean-up passed.');
