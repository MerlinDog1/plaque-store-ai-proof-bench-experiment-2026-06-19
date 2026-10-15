import assert from 'node:assert/strict';
import { redactAnalyticsEvent } from '../services/analyticsPrivacy.mjs';

for (const path of ['/?proof=secret', '/?order=secret', '/?session_id=secret', '/admin', '/order-confirmed?order=secret', '/checkout', '/proof/token']) {
  assert.equal(redactAnalyticsEvent({ type: 'pageview', url: `https://instaplaque.co.uk${path}` }), null);
}
const redactedEvent = redactAnalyticsEvent({ type: 'pageview', url: 'https://instaplaque.co.uk/memorial-plaques?email=private@example.test&utm_campaign=test#secret' });
assert.equal(redactedEvent.url, 'https://instaplaque.co.uk/memorial-plaques');
assert.equal(redactedEvent.type, 'pageview');

assert.equal(
  redactAnalyticsEvent({ type: 'pageview', url: 'not a valid URL' }),
  null,
  'An unparsable URL should be dropped rather than sent without redaction.',
);

console.log('Private routes dropped; every query parameter and fragment removed from Vercel analytics.');
