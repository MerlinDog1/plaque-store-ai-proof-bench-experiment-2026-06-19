const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const compile = file => ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const statisticsCode = compile('services/siteStatistics.ts');
const privacyContext = { exports: {}, URL };
vm.runInNewContext(compile('services/analyticsPrivacy.mjs'), privacyContext);
const key = 'instaplaque-statistics-v1';

function setup({ choice, consent, url = 'https://instaplaque.co.uk/cookies', blocked = false, internal = false } = {}) {
  const map = new Map([[key, choice], ['instaplaque-analytics-consent-v1', consent], ['instaplaque-meta-consent', consent]]);
  const injections = [], views = [];
  const window = new EventTarget();
  window.location = new URL(url);
  const context = { exports: {}, window, URL, Event,
    localStorage: {
      getItem(k) { if (blocked) throw Error('blocked'); return map.get(k) ?? null; },
      setItem(k, v) { if (blocked) throw Error('blocked'); map.set(k, v); },
    },
    require: name => ({
      '@vercel/analytics': { inject: options => injections.push(options), pageview: options => views.push(options) },
      './analyticsPrivacy.mjs': privacyContext.exports,
      './metaPixel': { isInternalBrowser: () => internal },
    })[name],
  };
  vm.runInNewContext(statisticsCode, context);
  const api = context.exports;
  const event = { type: 'pageview', url: url + '?email=PRIVATE&gclid=ADCLICK#PRIVATE' };
  const send = () => injections[0]?.beforeSend(event);
  const storageChange = value => {
    map.set(key, value);
    const change = new Event('storage'); Object.defineProperty(change, 'key', { value: key }); window.dispatchEvent(change);
  };
  return { api, injections, views, map, event, send, storageChange };
}

for (const consent of [undefined, 'no', 'yes']) {
  const h = setup({ consent }); h.api.startSiteStatistics(); h.api.startSiteStatistics();
  assert.equal(h.injections.length, 1, 'Default-on pageview, regardless of optional consent, injected once');
  assert.equal(h.send().url, 'https://instaplaque.co.uk/cookies');
  assert.equal(h.map.get(key), undefined, 'No preference written until the visitor makes a choice');
  assert.equal(h.api.setStatisticsEnabled(false), true);
  assert.equal(h.send(), null, 'Loaded script must stop at beforeSend immediately after objection');
  for (const choice of ['yes', 'no']) {
    h.map.set('instaplaque-analytics-consent-v1', choice); h.map.set('instaplaque-meta-consent', choice);
    assert.equal(h.send(), null, 'Accept and Reject must not override an objection');
  }
  assert.equal(h.map.get('instaplaque-analytics-consent-v1'), 'no');
  h.api.setStatisticsEnabled(true);
  assert.equal(h.views.length, 1, 'Re-enabling counts the current page once');
  assert.equal(h.injections.length, 1, 'Re-enabling does not add another script');
  assert.ok(h.send());
  h.storageChange('no'); assert.equal(h.send(), null, 'Another tab can stop counting');
  h.storageChange('yes'); assert.ok(h.send());
  assert.equal(h.views.length, 2);
}
for (const consent of [undefined, 'no', 'yes']) {
  const h = setup({ choice: 'no', consent }); h.api.startSiteStatistics();
  assert.equal(h.injections.length, 0, 'A saved objection prevents even the script download, before/after Accept');
  assert.equal(h.api.statisticsBeforeSend(h.event), null);
  h.api.setStatisticsEnabled(true); assert.equal(h.injections.length, 1);
  assert.equal(h.map.get('instaplaque-analytics-consent-v1'), consent, 'Statistics does not grant optional consent');
}
const blocked = setup({ blocked: true }); blocked.api.startSiteStatistics();
assert.equal(blocked.injections.length, 0, 'Unreadable choices fail closed');
assert.equal(blocked.api.setStatisticsEnabled(false), false);
assert.equal(blocked.api.statisticsEnabled(), false, 'Objection works in memory even if storage throws');

const h = setup(); h.api.startSiteStatistics();
for (const type of ['event', 'identify', 'group']) assert.equal(h.injections[0].beforeSend({ type, url: h.event.url }), null);
assert.deepEqual(Object.keys(h.injections[0].beforeSend({ ...h.event, payload: { userId: 'PRIVATE' }, __cdp: 'PRIVATE' })).sort(), ['type', 'url']);
for (const path of ['/admin', '/proof/private', '/checkout', '/order-confirmed', '/checkout-test.html', '/google-purchase.html',
  '/meta-purchase.html', '/?view=admin', '/?view=checkout', '/?proof=PRIVATE', '/?order=PRIVATE', '/?session_id=PRIVATE']) {
  assert.equal(h.injections[0].beforeSend({ type: 'pageview', url: 'https://instaplaque.co.uk' + path }), null, path);
}
for (const url of ['https://instaplaque.co.uk', 'https://www.instaplaque.co.uk', 'http://127.0.0.1:4382',
  'http://localhost:4382', 'https://instaplaque-test-dullaghan31-3959s-projects.vercel.app']) {
  const h = setup({ url }); h.api.startSiteStatistics(); assert.equal(h.injections.length, 1, url);
}
for (const options of [{ internal: true }, { url: 'https://instaplaque.co.uk.evil.test' }, { url: 'http://instaplaque.co.uk' }]) {
  const h = setup(options); h.api.startSiteStatistics(); assert.equal(h.injections.length, 0);
}
// A second integration point could accidentally bypass these behavioural checks.
for (const file of ['index.tsx', ...['services', 'components'].flatMap(dir => fs.readdirSync(dir).filter(name => /\.[jt]sx?$/.test(name)).map(name => `${dir}/${name}`))]) {
  if (file === 'services/siteStatistics.ts') continue;
  assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /@vercel\/analytics|_vercel\/insights/, `${file}: Vercel must use siteStatistics only`);
}
assert.match(fs.readFileSync('index.tsx', 'utf8'), /startSiteStatistics\(\)/);
assert.match(fs.readFileSync('components/StatisticsSettings.tsx', 'utf8'), /setStatisticsEnabled\(!enabled\)/);
assert.match(fs.readFileSync('components/SiteExperience.tsx', 'utf8'), /view === 'cookies' && <StatisticsSettings/);
console.log('PASS statistics: default on, independent saved objection, immediate/late/cross-tab blocking, re-enable, storage failures, pageviews only, URL redaction, owner exclusion and one gated integration');
