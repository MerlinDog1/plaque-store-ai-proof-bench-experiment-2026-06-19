import assert from 'node:assert/strict';
import { redactAnalyticsEvent } from '../services/analyticsPrivacy.mjs';

const redactedEvent = redactAnalyticsEvent({
  type: 'pageview',
  url: 'https://instaplaque.co.uk/?proof=proof-secret&order=order-secret&session_id=stripe-secret&view=home',
});

assert(redactedEvent, 'A valid analytics event should be retained.');
const redactedUrl = new URL(redactedEvent.url);
assert.equal(redactedUrl.searchParams.has('proof'), false);
assert.equal(redactedUrl.searchParams.has('order'), false);
assert.equal(redactedUrl.searchParams.has('session_id'), false);
assert.equal(redactedUrl.searchParams.get('view'), 'home');
assert.equal(redactedEvent.type, 'pageview');

assert.equal(
  redactAnalyticsEvent({ type: 'pageview', url: 'not a valid URL' }),
  null,
  'An unparsable URL should be dropped rather than sent without redaction.',
);

console.log('Analytics URLs remove proof, order and Stripe session identifiers before sending.');
