// Google Customer Reviews (owner msg 6658, 26 Oct 2026): services/googleCustomerReviews.ts with the real production
// estimate, in a sandbox with a stand-in page. Checks the estimated delivery date (UK date, Monday to Friday, production
// estimate + 1 delivery day + 2 spare days), which orders get Google's opt-in box, and that the box's script loads once
// with the order's details and never for the owner's own browser.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const compile = file => ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const SCRIPT = 'https://apis.google.com/js/platform.js?onload=renderOptIn';

function load({ internal = false } = {}) {
  const local = new Map(internal ? [['instaplaque-internal-v1', 'yes']] : []);
  const scripts = [];
  const document = {
    createElement: tag => ({ tag }),
    querySelector: selector => scripts.find(s => selector === `script[src="${s.src}"]`) || null,
    body: { appendChild: node => scripts.push(node) },
  };
  const window = {};
  const production = vm.createContext({ exports: {} });
  vm.runInContext(compile('services/productionTime.mjs'), production);
  const context = vm.createContext({ exports: {}, window, document, Intl, Date, console,
    require: name => ({
      './metaPixel': { isInternalBrowser: () => local.get('instaplaque-internal-v1') === 'yes' },
      './productionTime.mjs': production.exports,
    })[name] });
  vm.runInContext(compile('services/googleCustomerReviews.ts'), context);
  return { gcr: context.exports, window, scripts };
}

const { gcr } = load();
const NOW = Date.parse('2026-10-26T16:30:00Z');
const order = (extra = {}) => ({
  id: 'PSAI-00000000-0000-4000-8000-000000000123', paymentStatus: 'paid', customerEmail: 'customer@example.com',
  paidAt: '2026-10-26T10:00:00Z', shippingAddress: { country: 'GB' }, metadata: { turnaroundWorkingDays: 5 },
  plaqueState: { width: 210, height: 148, shape: 'rect', material: 'brushed-steel', wood: false }, ...extra,
});

// 1. Estimated delivery date: production + 1 delivery + 2 spare working days, from the UK payment date.
assert.equal(gcr.gcrEstimatedDeliveryDate(order()), '2026-11-05', 'Mon 26 Oct + 8 working days');
assert.equal(gcr.gcrEstimatedDeliveryDate(order({ paidAt: '2026-10-31T12:00:00Z' })), '2026-11-11', 'A Saturday payment counts from Monday');
assert.equal(gcr.gcrEstimatedDeliveryDate(order({ paidAt: '2026-06-30T23:30:00Z' })), '2026-07-13',
  '00:30 on 1 July in the UK (summer time) counts from 1 July, not the UTC date 30 June');
const woodA4 = { width: 297, height: 210, shape: 'rect', material: 'brushed-brass', wood: true };
assert.equal(gcr.gcrEstimatedDeliveryDate(order({ metadata: {}, plaqueState: woodA4 })), '2026-11-12',
  'Without a recorded estimate, the plaque decides: wood-backed A4 is 10 working days');
assert.equal(gcr.gcrEstimatedDeliveryDate(order({ metadata: { turnaroundWorkingDays: 15 } })), '2026-11-19', 'Custom 15-day work: 18 working days');

// 2. Which orders are offered the box.
assert.deepEqual({ ...gcr.gcrOptInFor(order(), NOW) }, {
  merchant_id: 5859684800, order_id: 'PSAI-00000000-0000-4000-8000-000000000123', email: 'customer@example.com',
  delivery_country: 'GB', estimated_delivery_date: '2026-11-05',
});
assert.equal(gcr.gcrOptInFor(order({ paymentStatus: 'unpaid' }), NOW), null, 'Unpaid');
for (const flag of ['checkoutTestPolicy', 'liveVerificationPolicy', 'noFulfilment']) {
  assert.equal(gcr.gcrOptInFor(order({ metadata: { [flag]: 'yes' } }), NOW), null, `Owner test order (${flag})`);
}
assert.equal(gcr.gcrOptInFor(order({ customerEmail: '' }), NOW), null, 'No email');
assert.equal(gcr.gcrOptInFor(order({ customerEmail: 'not an email' }), NOW), null, 'Bad email');
assert.equal(gcr.gcrOptInFor(order({ paidAt: '2026-10-24T15:00:00Z' }), NOW), null, 'Reopened more than 48 hours after paying');
assert.equal(gcr.gcrOptInFor(order({ paidAt: undefined, createdAt: undefined }), NOW), null, 'No payment time');
assert.equal(gcr.gcrOptInFor(order({ shippingAddress: { country: 'gb' } }), NOW).delivery_country, 'GB');
assert.equal(gcr.gcrOptInFor(order({ shippingAddress: {} }), NOW).delivery_country, 'GB', 'Missing country: the UK');
assert.equal(gcr.gcrOptInFor(order({ shippingAddress: { country: 'IE' } }), NOW).delivery_country, 'IE');
assert.equal(gcr.gcrOptInFor(null, NOW), null);

// 3. The box: Google's script once, rendered with the order's details, in UK English.
const realNow = Date.now;
Date.now = () => NOW;
try {
  const page = load();
  page.window.___gcfg = { other: true };
  assert.equal(page.gcr.offerGoogleCustomerReviews(order()), true);
  assert.equal(page.scripts.length, 1);
  assert.equal(page.scripts[0].src, SCRIPT);
  assert.equal(page.scripts[0].async, true);
  assert.deepEqual({ ...page.window.___gcfg }, { other: true, lang: 'en-GB' });
  assert.equal(page.gcr.offerGoogleCustomerReviews(order()), false, 'Once per order and visit');
  assert.equal(page.scripts.length, 1);
  const rendered = [];
  page.window.gapi = { load: (name, callback) => { assert.equal(name, 'surveyoptin'); callback(); },
    surveyoptin: { render: options => rendered.push({ ...options }) } };
  page.window.renderOptIn();
  assert.deepEqual(rendered, [{ merchant_id: 5859684800, order_id: order().id, email: 'customer@example.com',
    delivery_country: 'GB', estimated_delivery_date: '2026-11-05' }]);
  // A second order in the same visit uses the loaded script.
  assert.equal(page.gcr.offerGoogleCustomerReviews(order({ id: 'PSAI-SECOND' })), true);
  assert.equal(page.scripts.length, 1);
  assert.equal(rendered.length, 2);
  assert.equal(rendered[1].order_id, 'PSAI-SECOND');

  const owner = load({ internal: true });
  assert.equal(owner.gcr.offerGoogleCustomerReviews(order()), false, "The owner's browser is never asked");
  assert.equal(owner.scripts.length, 0);
  const unpaid = load();
  assert.equal(unpaid.gcr.offerGoogleCustomerReviews(order({ paymentStatus: 'unpaid' })), false);
  assert.equal(unpaid.scripts.length, 0);
} finally {
  Date.now = realNow;
}

console.log('Google Customer Reviews checks passed: delivery dates, eligibility, one script, render details, owner excluded.');
