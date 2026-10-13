import assert from 'node:assert/strict';
import { merchantOffers } from '../../services/merchantCatalogue.mjs';

const base = 'https://instaplaque.co.uk';
const variants = new Map(merchantOffers.map(offer => [`${base}/${offer.slug}`, offer]));
const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => `https://schema.org/${day}`);

export function* schemaObjects(value) {
  if (Array.isArray(value)) {
    for (const item of value) yield* schemaObjects(item);
  } else if (value && typeof value === 'object') {
    yield value;
    for (const item of Object.values(value)) yield* schemaObjects(item);
  }
}

export function schemasFromHtml(html) {
  return [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map(match => JSON.parse(match[1]));
}

export function checkReturnPolicy(policy, label) {
  assert.equal(policy?.['@type'], 'MerchantReturnPolicy', `${label}: missing return policy`);
  assert.equal(policy.applicableCountry, 'GB', label);
  assert.equal(policy.returnPolicyCategory, 'https://schema.org/MerchantReturnNotPermitted', label);
  assert.equal(policy.merchantReturnLink, `${base}/returns-and-cancellations`, label);
  assert.equal(policy['@id'], `${base}/returns-and-cancellations#policy`, label);
  for (const field of ['merchantReturnDays', 'returnFees', 'returnShippingFeesAmount']) {
    assert.equal(Object.hasOwn(policy, field), false, `${label}: do not invent a return window or charge`);
  }
}

export function checkProductPolicies(graph, label) {
  const products = [...schemaObjects(graph)].filter(item => item['@type'] === 'Product');
  for (const product of products) {
    const offer = product.offers;
    const at = `${label}: ${product.name}`;
    assert.equal(offer?.['@type'], 'Offer', `${at}: physical product must have an Offer`);
    assert.equal(offer.priceCurrency, 'GBP', at);
    assert.ok(Number(offer.price) > 0, `${at}: no free physical plaques`);
    checkReturnPolicy(offer.hasMerchantReturnPolicy, at);
    const shipping = offer.shippingDetails;
    assert.equal(shipping?.['@type'], 'OfferShippingDetails', `${at}: missing shipping details`);
    assert.deepEqual(shipping.shippingDestination, { '@type': 'DefinedRegion', addressCountry: 'GB' }, `${at}: whole UK`);
    assert.deepEqual(shipping.shippingRate, { '@type': 'MonetaryAmount', value: 0, currency: 'GBP' }, `${at}: UK delivery included`);
    const time = shipping.deliveryTime;
    assert.equal(time?.['@type'], 'ShippingDeliveryTime', `${at}: missing delivery time`);
    const variant = variants.get(offer.url);
    if (variant) assert.equal(Number(offer.price), variant.price, `${at}: catalogue price unchanged`);
    assert.deepEqual(time.handlingTime, {
      '@type': 'QuantitativeValue', minValue: variant?.productionDays ?? 5,
      maxValue: variant?.productionDays ?? 15, unitCode: 'DAY',
    }, `${at}: preserve advertised production time; never substitute transit for production`);
    assert.deepEqual(time.transitTime, { '@type': 'QuantitativeValue', minValue: 1, maxValue: 1, unitCode: 'DAY' }, at);
    assert.deepEqual(time.businessDays, { '@type': 'OpeningHoursSpecification', dayOfWeek: weekdays }, `${at}: no weekend dispatch`);
  }
  return products;
}

export function checkDigitalOffer(graph) {
  const app = [...schemaObjects(graph)].find(item => item['@type'] === 'WebApplication');
  assert.ok(app, 'The free designer application remains described');
  assert.equal(Number(app.offers.price), 0);
  assert.equal(Object.hasOwn(app.offers, 'shippingDetails'), false, 'Do not ship the free online designer');
  assert.equal(Object.hasOwn(app.offers, 'hasMerchantReturnPolicy'), false, 'Physical returns do not apply to the free online designer');
}
