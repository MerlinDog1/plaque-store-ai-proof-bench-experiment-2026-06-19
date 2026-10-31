import React from 'react';
import { merchantProducts, photo600, type ProductFamily } from '../services/commerce';
import { merchantOffers } from '../services/merchantCatalogue.mjs';
import { occasionLandingPages } from '../services/occasionLandingPages';
import { designHrefFor } from '../services/productLayout';
import type { LandingConfig, SizeStep } from './CategoryLanding';

// MHS has no live domain or existing link in ec24ba1. This verified owner preview is deliberately used only in this
// review branch. Replace with its confirmed live destination before publishing the house page (see the task report).
export const metalHouseSignsPreview = 'https://metal-house-signs-kiuwjaxsa-dullaghan31-3959s-projects.vercel.app';
const products = new Map(merchantProducts.map(product => [product.slug, product]));
const offers = new Map(merchantOffers.map(offer => [offer.slug, offer]));
const productFor = (slug: string) => {
  const product = products.get(slug);
  if (!product) throw new Error(`Landing page product missing: ${slug}`);
  return product;
};
const offerFor = (slug: string) => {
  const offer = offers.get(slug);
  if (!offer) throw new Error(`Landing page offer missing: ${slug}`);
  return offer;
};

export const occasionProductPicks = Object.fromEntries(occasionLandingPages.map(page => [page.slug, {
  kicker: 'Choose your plaque',
  title: page.slug === 'professional-brass-plaques' ? 'Brass plates for your own practice wording.' : 'Catalogue plaques for your own wording.',
  intro: 'These show example inscriptions, not your finished design. Open a plaque for its exact size, finish, fixings and price; your own words replace the example.',
  slugs: page.picks,
}]));

export function occasionCategoryLandingFor(product: ProductFamily): LandingConfig | undefined {
  const page = occasionLandingPages.find(item => item.slug === product.slug);
  if (!page) return undefined;
  const hero = productFor(page.heroSlug);
  const heroOffer = offerFor(page.heroSlug);
  const from = offerFor(page.fromSlug);
  const image = page.slug === 'house-name-plaques' ? hero.photo || page.image : hero.studioPhoto || page.image;
  const sizes: SizeStep[] = page.sizeSlugs.map((slug, index) => {
    const offer = offerFor(slug);
    return { slug, label: `${offer.format.startsWith('A') ? `${offer.format.split(' ')[0]} · ` : ''}${offer.size}`,
      widthMm: offer.preset.width, heightMm: offer.preset.height, fits: page.sizeFits[index],
      ...(offer.preset.shape === 'oval' ? { shape: 'oval' as const } : {}) };
  });
  return {
    prefix: page.slug,
    title: page.title,
    note: page.heroNote || '',
    intro: page.heroCopy,
    // Reuse the category layout and already-vetted product imagery; no new unreviewed setting photos or artwork.
    film: false,
    designHref: designHrefFor(page.relatedProductSlug),
    hero: {
      src: image,
      srcSet: `${photo600(image)} 600w, ${image} 1200w`,
      alt: `${hero.title}, shown with example wording`,
      caption: <>Shown: {heroOffer.size} {heroOffer.label.toLowerCase()}{heroOffer.preset.wood ? ` on ${heroOffer.preset.woodTone === 'dark' ? 'dark wood' : 'light oak'}` : ''}, {hero.startingFrom}. Example wording; yours replaces it. Estimated {heroOffer.productionDays} working days after proof approval and payment, plus delivery. <a href={`/${hero.slug}`}>See this plaque</a>.</>,
    },
    priceNote: `${from.size} ${from.label.toLowerCase()}, including engraving, fixings and UK delivery. Design online starts with the pictured plaque at ${hero.startingFrom}.`,
    sizes: {
      title: 'Choose a size for your words.',
      intro: 'Measure the flat fixing area first. Prices below are for the metal plate without a wood backing; each price opens that exact size and finish.',
      sizes,
      note: <>Wood-backed options are priced on their own product pages. <a href="/plaque-sizes">See every size and price</a>.</>,
    },
    steps: [
      ['Add your wording', 'Design it online, or send us your exact words and where the plaque will go.'],
      ['Share the free proof', 'Download the dimensioned PDF and agree the names, layout, finish and fixings with everyone involved.'],
      ['Approve, then pay', 'Only approve production once the wording and any permissions are settled. UK delivery is included.'],
    ],
    proofCopy: 'Your free PDF proof shows the wording, measurements, finish and fixings. Share it with the people who need to agree the design, and check every detail before paying.',
    wording: {
      title: `${page.slug === 'professional-brass-plaques' ? 'Practice name plate' : page.shortTitle.replace(/ plaques$/, ' plaque')} wording ideas.`,
      intro: page.slug === 'professional-brass-plaques'
        ? 'Layout templates only, not real practices or suggested qualifications. Replace the bracketed names and use professional titles only when entitled to do so.'
        : 'Illustrative starting points, not customer commissions. Replace the names and words with your own; for a church or shared site, agree the wording with the organiser first.',
      inscriptions: page.wording,
      link: { href: '/design-request', label: 'Send us your wording for a free proof' },
    },
    guide: page.sections,
    questionsIntro: 'Check the details before you approve production. The selected options determine the price and production estimate.',
    related: <>
      <p className="memorial-material-links cat-related">Related: {page.related.map((link, index) => <React.Fragment key={link.slug}>{index > 0 && ' · '}<a href={`/${link.slug}`}>{link.label}</a></React.Fragment>)}.</p>
      {page.sourceLinks && <p className="shop-smallprint">Official guidance: {page.sourceLinks.map((link, index) => <React.Fragment key={link.href}>{index > 0 && ' · '}<a href={link.href}>{link.label} ↗</a></React.Fragment>)}. Check the current guidance for your own proposal.</p>}
    </>,
    notice: page.slug === 'house-name-plaques' ? <>
      <h2>Looking for a decorative house sign?</h2>
      <p>These are simple engraved name plates from the InstaPlaque catalogue. For decorative house signs or separate house numbers, explore <a href={`${metalHouseSignsPreview}/?utm_source=instaplaque&utm_medium=referral&utm_campaign=house_name_plaques&utm_content=house_signs_link`}>Metal House Signs ↗</a>.</p>
    </> : page.slug === 'church-plaques' ? <>
      <h2>Ask your parish before ordering.</h2>
      <p>Agree the proposed wording, material, position and fixings first. Changes in a Church of England church generally need permission through its faculty system; ask the parish or its Diocesan Advisory Committee about your proposal. A design proof is not permission to install.</p>
    </> : page.slug === 'professional-brass-plaques' ? <>
      <h2>A name plate, with your approved wording.</h2>
      <p>Regulatory notices and professional titles need their own checks. An engraved plaque does not automatically satisfy a regulator’s display requirements. Use the guidance below and agree the wording with your practice before ordering.</p>
    </> : undefined,
  };
}
