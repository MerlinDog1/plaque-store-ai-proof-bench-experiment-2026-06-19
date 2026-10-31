// Photos of catalogue plaques in place, with example wording that suits each page (owner msg 8341, 31 Oct 2026:
// "for each category page make like 5 other good images"; the practices plate shows a full name and title, the donor
// page a real donor plaque). Made like the studio photos: each plaque's designer-style stencil with its exact wording,
// turned into a photo by the designer's realistic preview and read back word by word before use. All names are
// invented. Files: public/site-images/in-place/<page>/, 900 × 600 for the rows, a 4:3 crop for a page's lead photo.
// The photo lists are written by scripts/build-in-place-photos.py into inPlacePhotos.data.ts; captions, prices and
// links come from the catalogue here, so they follow any price change.
import type { ExampleItem } from '../components/CategoryLanding';
import { formatGbp, onStakePrice } from '../components/PriceTable';
import { merchantProducts } from './commerce';
import { designWithStakeHref } from './groundStake';
import { merchantOffers } from './merchantCatalogue.mjs';
import { inPlaceData, leadData, type PhotoEntry } from './inPlacePhotos.data';

export type InPlaceRow = { kicker: string; title: string; intro?: string; items: ExampleItem[] };
export type LeadPhoto = { productSlug: string; src: string; srcSet: string; alt: string };

const intro = 'Example wording with invented names: your own words replace it. Tap a photo to see that plaque.';
const headings: Record<string, { kicker: string; title: string }> = {
  'memorial-plaques': { kicker: 'Memorial plaques in place', title: 'Where they’re remembered.' },
  'bench-plaques': { kicker: 'Bench plaques in place', title: 'On the benches they loved.' },
  'garden-plaques': { kicker: 'Garden plaques in place', title: 'On walls, posts and fences.' },
  'tree-memorial-plaques': { kicker: 'Memorial tree plaques in place', title: 'Beside the tree, never fixed to it.' },
  'opening-plaques': { kicker: 'Opening plaques in place', title: 'On the wall for years to come.' },
  'brass-plaques': { kicker: 'Brass plaques in place', title: 'Warm brass, wherever it goes.' },
  'stainless-steel-plaques': { kicker: 'Stainless steel plaques in place', title: 'Clean silver steel, indoors and out.' },
  'professional-brass-plaques': { kicker: 'Practice name plates in place', title: 'Your name and title, at the door.' },
  'donor-recognition-plaques': { kicker: 'Donor plaques in place', title: 'Thanking the people who made it happen.' },
  'church-plaques': { kicker: 'Church plaques in place', title: 'On pews and church walls.' },
  'house-name-plaques': { kicker: 'House name plaques in place', title: 'Beside the door, on the gate.' },
};

// The tree page's photos show each plate on the oak board and ground stake, and every price on that page includes both
// (owner msg 6506), so its captions give that price and a tap opens the designer on the plaque on both. It has four new
// photos, before its own four: its lead photo is already Jim Partridge's cherry tree plaque, so a fifth, near-identical
// photo of that plaque was not published.
const onStakePages = new Set(['tree-memorial-plaques']);

const products = new Map(merchantProducts.map(product => [product.slug, product]));
const offers = new Map(merchantOffers.map(offer => [offer.slug, offer]));

/** "A5 brushed brass on dark wood, £95.50." from the catalogue, so the caption always matches the plaque's page. */
export function plaqueCaption(slug: string, onStake = false) {
  const product = products.get(slug);
  const offer = offers.get(slug);
  if (!product || !offer) throw new Error(`In-place photo for a plaque not in the catalogue: ${slug}`);
  if (onStake) return `${offer.size} ${offer.label.toLowerCase()} on an oak board and ground stake, ${formatGbp(onStakePrice(offer))}.`;
  const wood = offer.preset.wood ? ` on ${offer.preset.woodTone === 'dark' ? 'dark wood' : 'light oak'}` : '';
  return `${offer.size} ${offer.label.toLowerCase()}${wood}, ${product.startingFrom}.`;
}

const item = (page: string, photo: PhotoEntry): ExampleItem => {
  const onStake = onStakePages.has(page);
  return {
    title: photo.title,
    copy: plaqueCaption(photo.productSlug, onStake),
    image: `/site-images/in-place/${page}/${photo.file}-900.webp`,
    alt: photo.alt,
    href: onStake ? designWithStakeHref(photo.productSlug) : `/${photo.productSlug}`,
  };
};

export const inPlacePhotos: Record<string, InPlaceRow> = Object.fromEntries(Object.entries(inPlaceData).map(([page, photos]) => [page, {
  ...(headings[page] || { kicker: 'In place', title: 'Plaques in place.' }),
  intro,
  // A page that leads with its first photo shows the rest here.
  items: photos.filter(photo => !(leadData[page] && photo.file === leadData[page].file)).map(photo => item(page, photo)),
}]));

/** The four occasion pages lead with their first photo instead of a catalogue studio shot. */
export const leadPhotos: Record<string, LeadPhoto> = Object.fromEntries(Object.entries(leadData).map(([page, photo]) => {
  const base = `/site-images/in-place/${page}/${photo.file}-hero`;
  return [page, { productSlug: photo.productSlug, alt: photo.alt, src: `${base}-1200.webp`,
    srcSet: `${base}-800.webp 800w, ${base}-1200.webp 1200w, ${base}-1600.webp 1600w` }];
}));
