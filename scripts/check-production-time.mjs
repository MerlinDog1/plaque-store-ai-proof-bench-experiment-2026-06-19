// Production times and the order emails' Fixings line (owner msg 6947, 28 Oct 2026). No network, no writes.
// - getProductionEstimate follows the owner's rule: any shape within 600 × 400 mm 5 working days, aged brass 7,
//   wood backing 10 up to A4 and 15 above, larger than 600 × 400 mm 15; the longest that applies, never more than 15.
// - Every catalogue offer (product pages and the Merchant Center feed) uses the same rule.
// - Both admin order emails show the fixings, with the same hole count as the proof and production artwork
//   (services/fixingGeometry.ts getFixingPositions).
// Usage: node scripts/check-production-time.mjs
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { getProductionEstimate } from '../services/productionTime.mjs';
import { merchantOffers } from '../services/merchantCatalogue.mjs';
import { buildEmail } from '../server/email.mjs';

const plate = (width, height, extra = {}) => ({ width, height, shape: 'rect', material: 'brushed-brass', wood: false, ...extra });
const cases = [
  [plate(100, 50), 5, 'small custom rectangle'],
  [plate(150, 50), 5, 'standard bench size'],
  [plate(600, 400), 5, 'exactly 600 × 400'],
  [plate(400, 600), 5, '600 × 400 either way round'],
  [plate(601, 400), 15, 'longer than 600 mm'],
  [plate(600, 401), 15, 'deeper than 400 mm'],
  [plate(500, 500), 15, 'square too big for 600 × 400'],
  [plate(200, 200, { shape: 'circle' }), 5, 'circle'],
  [plate(400, 400, { shape: 'circle' }), 5, 'largest circle that fits'],
  [plate(450, 450, { shape: 'circle' }), 15, 'circle too big'],
  [plate(250, 150, { shape: 'oval' }), 5, 'oval'],
  [plate(180, 160, { shape: 'heart', fixing: 'vhb' }), 5, 'heart'],
  [plate(100, 50, { material: 'aged-brass' }), 7, 'aged brass'],
  [plate(600, 500, { material: 'aged-brass' }), 15, 'aged and too big: the longest, not added'],
  [plate(297, 210, { wood: true }), 10, 'A4 on wood'],
  [plate(210, 297, { wood: true }), 10, 'A4 portrait on wood'],
  [plate(210, 148, { wood: true }), 10, 'A5 on wood'],
  [plate(150, 50, { wood: true }), 10, 'below A4 on wood'],
  [plate(300, 200, { wood: true }), 15, '3 mm longer than A4 on wood'],
  [plate(420, 297, { wood: true }), 15, 'A3 on wood'],
  [plate(297, 210, { wood: true, material: 'aged-brass' }), 10, 'aged on A4 wood: 10, not 17'],
  [plate(400, 300, { wood: true, material: 'aged-brass' }), 15, 'aged above A4 on wood'],
  [plate(600, 500, { wood: true, material: 'aged-brass' }), 15, 'everything at once: never more than 15'],
];
for (const [state, days, why] of cases) {
  const estimate = getProductionEstimate(state);
  assert.equal(estimate.days, days, `${why}: expected ${days}, got ${estimate.days}`);
  assert.equal(estimate.deliveryDays, days + 1, `${why}: delivery estimate`);
  assert.match(estimate.label, new RegExp(`^Estimated production: ${days} working days after proof approval and payment`));
}

const byDays = {};
for (const offer of merchantOffers) {
  assert.equal(offer.productionDays, getProductionEstimate(offer.preset).days, `catalogue ${offer.slug}`);
  assert.ok(offer.description.includes(`Estimated production ${offer.productionDays} working days`), `description ${offer.slug}`);
  byDays[offer.productionDays] = (byDays[offer.productionDays] || 0) + 1;
}
assert.equal(merchantOffers.find(offer => offer.slug === 'polished-brass-bench-plaque-200x100').productionDays, 5);

// The proof's hole positions, from the TypeScript source the designer and production artwork use.
const bundled = await build({ entryPoints: ['services/fixingGeometry.ts'], bundle: true, format: 'esm', platform: 'node',
  write: false, logLevel: 'silent' });
const { getFixingPositions } = await import('data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64'));

const order = (state) => ({
  id: 'PSAI-CHECK-0001', customerName: 'Check Fixture', totalPence: 5900, currency: 'gbp',
  paidAt: '2026-10-28T09:00:00Z', plaqueState: { capSize: 10, border: false, borderStyle: 'single', safeMargin: 10, ...state },
  metadata: { turnaroundWorkingDays: 5 }, shippingAddress: { country: 'GB' },
});
const fixings = [
  [plate(100, 50, { fixing: 'vhb', fixingHoleCount: 2 }), 'Hidden adhesive (VHB tape), no holes'],
  [plate(150, 50, { fixing: 'none', fixingHoleCount: 2 }), 'No fixings, no holes'],
  [plate(150, 50, { fixing: 'screws', fixingHoleCount: 2 }), 'Domed cross-head screws, 2 holes (one at each end)'],
  [plate(200, 150, { fixing: 'screws', fixingHoleCount: 4 }), 'Domed cross-head screws, 4 holes (one in each corner)'],
  [plate(200, 150, { fixing: 'screws', fixingHoleCount: 2 }), 'Domed cross-head screws, 2 holes (one at each end)'],
  [plate(297, 210, { fixing: 'caps', fixingHoleCount: 4, capSize: 15 }), 'Decorative caps, Ø15 mm, 4 holes (one in each corner)'],
  [plate(225, 75, { fixing: 'caps', fixingHoleCount: 4 }), 'Decorative caps, Ø10 mm, 2 holes (one at each end)'],
  [plate(150, 80, { fixing: 'caps', fixingHoleCount: 2 }), 'Decorative caps, Ø10 mm, 4 holes (one in each corner)'],
  [plate(250, 150, { shape: 'oval', fixing: 'caps', fixingHoleCount: 2 }), 'Decorative caps, Ø10 mm, 2 holes (one at each side)'],
  [plate(200, 200, { shape: 'circle', fixing: 'screws', fixingHoleCount: 2 }), 'Domed cross-head screws, 2 holes (one at each side)'],
  [plate(180, 160, { shape: 'heart', fixing: 'vhb', fixingHoleCount: 2 }), 'Hidden adhesive (VHB tape), no holes'],
  [plate(297, 210, { fixing: 'caps', fixingHoleCount: 4, wood: true }), 'Decorative caps, Ø10 mm, 4 holes (one in each corner)'],
];
for (const [state, expected] of fixings) {
  const full = order(state);
  const holes = getFixingPositions(full.plaqueState).length;
  const stated = Number(expected.match(/(\d) holes/)?.[1] || 0);
  assert.equal(stated, holes, `${expected}: the proof has ${holes} holes`);
  for (const template of ['admin-new-paid-order', 'admin-production-pack']) {
    const email = buildEmail(template, full);
    assert.ok(email.html.includes(`<strong>Fixings:</strong> ${expected}<br>`), `${template} HTML: ${expected}`);
    assert.ok(email.text.split('\n').includes(`Fixings: ${expected}`), `${template} text: ${expected}`);
    assert.ok(email.html.indexOf('<strong>Material:</strong>') < email.html.indexOf('<strong>Fixings:</strong>')
      && email.html.indexOf('<strong>Fixings:</strong>') < email.html.indexOf('<strong>Wood:</strong>'), `${template}: line order`);
  }
}

// An order saved without production days takes them from the same rule.
const noDays = order(plate(100, 50, { fixing: 'vhb', fixingHoleCount: 2 }));
noDays.metadata = {};
assert.ok(buildEmail('admin-new-paid-order', noDays).text.includes('Due: Wed, 04 Nov 2026'), 'fallback due date: 5 working days');

console.log(`Production times: ${cases.length} rule cases pass; catalogue days ${JSON.stringify(byDays)} across ${merchantOffers.length} offers; `
  + `Fixings line in both admin emails matches the proof's holes for ${fixings.length} fixings; fallback due date uses the rule.`);
