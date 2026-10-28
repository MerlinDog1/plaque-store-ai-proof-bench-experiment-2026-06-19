export const businessContact = {
  tradingName: 'InstaPlaque',
  // Owner msg 5231: show the address, always without the house number; the owner's own name
  // appears only on the legal pages (terms and privacy), never on ordinary pages.
  traderName: 'Liam Dullaghan',
  address: 'Dunkirk Avenue, Desborough, Northamptonshire NN14 2PL',
  postalAddress: { streetAddress: 'Dunkirk Avenue', addressLocality: 'Desborough', addressRegion: 'Northamptonshire', postalCode: 'NN14 2PL', addressCountry: 'GB' },
  email: 'hello@instaplaque.co.uk',
  phone: '07464 843841',
  phoneHref: 'tel:+447464843841',
  whatsapp: '07464 843841',
  whatsappHref: 'https://wa.me/447464843841',
  madeIn: 'Made in the UK',
  updated: '28 October 2026',
  privacyUpdated: '26 October 2026',
};

// Portraits in Metal, our portrait studio. Links carry UTM tags so its analytics can show
// which InstaPlaque page sent the visitor.
export function portraitsInMetalLink(path: string, campaign: string, content: string) {
  const query = new URLSearchParams({
    utm_source: 'instaplaque',
    utm_medium: 'referral',
    utm_campaign: campaign,
    utm_content: content,
  });
  return `https://portraitsinmetal.com${path}?${query}`;
}

export const productionTiming = {
  summary: 'Standard production: estimated 5 working days',
  qualification: 'From proof approval and payment. Aged brass, wood backing and plaques larger than 600 × 400 mm take longer.',
  faq: 'Most plaques are estimated at 5 working days from proof approval and payment, in any shape up to 600 × 400 mm. Aged brass is estimated at 7 working days; wood backing at 10 working days up to A4 (297 × 210 mm) and 15 above that; plaques larger than 600 × 400 mm at 15. The times don’t add together: the longest that applies is your estimate. Your selected options determine the estimate shown before checkout. These are production estimates, with delivery time additional. Contact us before ordering for a fixed event date.',
};
