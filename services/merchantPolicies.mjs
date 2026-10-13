// Existing owner-approved policies, read back from Merchant Center on
// 13 October 2026. This describes them; it does not change fulfilment or refunds.
const site = 'https://instaplaque.co.uk';
const schema = 'https://schema.org/';

export const merchantReturnPolicy = Object.freeze({
  '@type': 'MerchantReturnPolicy',
  '@id': `${site}/returns-and-cancellations#policy`,
  applicableCountry: 'GB',
  returnPolicyCategory: `${schema}MerchantReturnNotPermitted`,
  merchantReturnLink: `${site}/returns-and-cancellations`,
});

// Publish the standard policy on the page explaining it. Each product also
// carries the full policy so its Offer is independently understandable.
// No physical returns does NOT remove the faulty/damaged-goods remedies on
// the linked page, nor create a new change-of-mind return window.
export const merchantPolicyOrganization = Object.freeze({
  '@type': 'Organization',
  '@id': `${site}/#organization`,
  name: 'InstaPlaque',
  url: `${site}/`,
  hasMerchantReturnPolicy: merchantReturnPolicy,
});

export const deliveryServiceDescription = 'We dispatch Monday to Friday using a next-working-day delivery service. Transit is estimated at one working day after dispatch, in addition to production; arrival dates are not guaranteed.';

/** @param {number | undefined} productionDays The exact advertised variant's production estimate, if known. */
export function productOfferPolicies(productionDays = undefined) {
  if (productionDays !== undefined && (!Number.isInteger(productionDays) || productionDays < 1)) {
    throw new Error('A product production estimate must be a positive whole number of working days');
  }
  const days = (minValue, maxValue) => ({ '@type': 'QuantitativeValue', minValue, maxValue, unitCode: 'DAY' });
  return {
    hasMerchantReturnPolicy: merchantReturnPolicy,
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'GB' },
      shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'GBP' },
      deliveryTime: {
        '@type': 'ShippingDeliveryTime',
        // Family pages cover multiple configurations. Do not advertise every
        // plaque as five-day production; exact variants use the catalogue.
        handlingTime: days(productionDays ?? 5, productionDays ?? 15),
        transitTime: days(1, 1),
        businessDays: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => `${schema}${day}`),
        },
      },
    },
  };
}
