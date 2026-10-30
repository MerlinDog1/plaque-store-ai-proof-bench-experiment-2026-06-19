import { merchantOffers } from './merchantCatalogue.mjs';
import { catalogueExamples, CatalogueExample } from './catalogueExamples';
import { vettedCataloguePhotos } from './vettedPhotos.mjs';
import { studioPhotos } from './studioPhotos.mjs';

// Product-specific copy for the 175 exact catalogue pages (owner msg 5736, 23 Oct 2026: "Make all
// pages better so they climb Google more"). Every page used to carry the same ~900 words with only
// the size, finish and price swapped; these helpers give each page its own example wording, its
// own size and finish advice and its own questions instead of the shared ones.

type Offer = (typeof merchantOffers)[number];

const offerBySlug = new Map(merchantOffers.map(offer => [offer.slug, offer]));
const offerFor = (slug: string) => offerBySlug.get(slug);
/** "photo" where the page leads with a photo (studio or one the owner has seen), "drawing" where it shows the flat design view. */
export const pictureWord = (slug: string) => (vettedCataloguePhotos.has(slug) || studioPhotos.has(slug) ? 'photo' : 'drawing');

export function exampleFor(slug: string): CatalogueExample | undefined {
  return catalogueExamples[slug];
}

const isBench = (offer: Offer) => offer.format === 'Bench';
const isPortraitSize = (offer: Offer) => Math.min(offer.preset.width, offer.preset.height) >= 148 && Math.max(offer.preset.width, offer.preset.height) >= 210;
const finish = (offer: Offer) => offer.label.toLowerCase();
const backing = (offer: Offer) => (!offer.preset.wood ? '' : offer.preset.woodTone === 'dark' ? ' on dark walnut' : ' on light oak');
const shapeWord = (offer: Offer) => (offer.preset.shape === 'oval' ? 'oval ' : offer.preset.shape === 'circle' ? 'round ' : '');

/** "a" or "an" for the word that follows ("an A5", "an aged brass"). */
const an = (word: string) => (/^[aeiouAEIOU]|^A\d/.test(word) ? 'an' : 'a');

function sizeName(offer: Offer) {
  if (offer.format.startsWith('A')) return `${offer.format.split(' ')[0]} (${offer.size})`;
  return offer.size;
}

/** How much wording the size takes, matched to the example layouts used in the photos. */
export function wordingFit(offer: Offer) {
  const { width, height, shape } = offer.preset;
  if (shape === 'oval') return 'three or four short centred lines, such as a name, dates and a few words; the curved ends need shorter lines than a rectangle';
  if (shape === 'circle') return 'three or four short centred lines, such as a name and dates, or a short dedication';
  if (isBench(offer)) {
    // The bench page's photos carry four or five lines (owner msg 6132), still at least 5.6 mm tall.
    if (width === 150 && height === 50) return 'three or four short lines: "In loving memory of", a name and the dates, with room for one short line more';
    if (width === 200 && height === 50) return 'three or four lines, with room for two names on one line, such as "TOM & BETTY HARRIS"';
    if (width === 200 && height === 100) return 'four or five lines: a name, dates and a short tribute';
    if (height >= 75) return 'four or five short lines: a name, dates and a sentence of tribute';
    return 'three to five lines, including a longer dedication line';
  }
  if (width === 200 && height === 150) return 'five lines: an introduction, a name, dates and two short lines of tribute';
  if (width === 210 && height === 148) return 'five or six lines: an introduction, a name, dates, a short tribute and a credit line';
  if (width === 148 && height === 210) return 'seven to nine short lines, with a long name split over two lines';
  if (width === 297 && height === 210) return 'six or seven lines: room for a formal dedication, a title and a credit line';
  if (width === 210 && height === 297) return 'eight to ten short lines, ideal for formal church, presentation and memorial wording';
  if (width === 300 && height === 200) return 'six or seven lines, including one or two longer sentences';
  if (width === 400 && height === 300) return 'seven to nine lines, or a list of names such as past presidents or club champions';
  return 'several lines of wording';
}

function suits(offer: Offer) {
  const { width, height, shape, wood } = offer.preset;
  if (shape === 'oval') return 'a softer shape for memorials, pets and house names';
  if (shape === 'circle') return 'for short memorials, tree dedications and pets';
  if (isBench(offer)) return width >= 200 ? 'a bench plaque with room for two names or a longer line' : 'a compact plate for a memorial bench rail';
  if (wood) {
    if (width >= 400) return 'a statement board for clubhouses, libraries and church walls';
    return 'a wood-backed plaque for presentations, retirements, church gifts and club honours, indoors or in a sheltered spot';
  }
  if (width === 200 && height === 150) return 'a compact wall or garden plaque for a name and a short tribute';
  if (width === 210 && height === 148) return 'a favourite for garden memorials, tree dedications and house names';
  if (width === 148 && height === 210) return 'a tall plaque for a memorial or a portrait with words beneath';
  if (width === 297 && height === 210) return 'room for a formal dedication, an opening or a family memorial';
  if (width === 210 && height === 297) return 'a tall plaque for church dedications, presentations and longer tributes';
  if (width === 300 && height === 200) return 'a generous wall plaque for house names, dedications and heritage plaques';
  if (width === 400 && height === 300) return 'the largest standard size, for building openings, lists of names and heritage plaques';
  return 'a made-to-order plaque for your own wording';
}

const finishOutdoors: Record<string, string> = {
  'brushed-stainless': 'Yes. Brushed stainless steel suits outdoor walls, gardens and benches and keeps its silver colour.',
  'polished-stainless': 'Yes. Polished stainless steel keeps its bright silver finish outdoors; an occasional wipe keeps the mirror face clear.',
  'brushed-brass': 'Yes. Brass is used outdoors for memorials and house names. Left outside it slowly mellows and darkens unless it is polished from time to time.',
  'polished-brass': 'Yes. Polished brass is used outdoors for house names and memorials. It slowly tones down outside unless it is polished from time to time.',
  'orbital-brass-matt-lacquer': 'Yes. The matt lacquer protects the orbital finish; over many years outdoors the brass beneath begins to tone naturally.',
  'aged-brass': 'Yes. The patina is sealed with matt lacquer to slow further ageing, and outdoors it keeps developing slowly, which suits a traditional setting.',
};

function outdoorAnswer(offer: Offer) {
  if (offer.preset.wood) {
    return 'Wood backing suits indoors or a sheltered outdoor spot, such as a porch or a covered corner of the garden. For an open, exposed position, a grave or a bench, choose the same plate without backing: the metal plate on its own is made for outdoor use.';
  }
  return `${finishOutdoors[offer.preset.material] || 'Yes.'} Near the sea or somewhere very exposed, ask us before ordering.`;
}

function fixingAnswer(offer: Offer) {
  const { fixing, fixingHoleCount: count, capSize, shape } = offer.preset;
  const where = count === 4 ? 'one in each corner' : shape === 'rect' ? 'one at each end' : 'one at each side';
  const fixings = fixing === 'caps'
    ? `${count} screw holes, ${where}, with Ø${capSize} mm decorative caps that hide the screw heads`
    : `${count} screw holes, ${where}, with matching screws`;
  const surface = isBench(offer) ? 'a timber bench rail; for a metal or composite bench, tell us before ordering'
    : offer.preset.wood ? 'an indoor wall; tell us the wall type and we will check the fixings suit it'
    : 'timber, brick or stone; for a tree dedication, fix it to a post, stake or nearby wall rather than to the tree';
  return `It comes with ${fixings}. Standard fixings are included and suit ${surface}.`;
}

function portraitAnswer(offer: Offer) {
  if (isPortraitSize(offer)) {
    return 'Yes. Send a favourite photo of a person or pet, or your logo, on WhatsApp. We turn it into engraving artwork, arrange your words around it and send a free proof with an exact price before you pay.';
  }
  return 'A portrait needs room to read well, so we engrave portraits on A5 (210 × 148 mm) and larger plaques. On this size, a small logo or motif can work: send it to us on WhatsApp and we will tell you honestly.';
}

export interface ProductFaq { question: string; answer: string }

/** Six questions specific to this exact plaque; the shared site questions stay on /faq. */
export function productFaqs(slug: string): ProductFaq[] {
  const offer = offerFor(slug);
  if (!offer) return [];
  const example = exampleFor(slug);
  const size = sizeName(offer);
  const lines = example ? ` The example in the ${pictureWord(slug)} has ${example.lines.length} lines.` : '';
  return [
    { question: `How much wording fits on ${an(size)} ${size} plaque?`, answer: `This size takes ${wordingFit(offer)}.${lines} If your proof looks crowded, choose a larger size rather than smaller lettering.` },
    { question: `Can ${an(finish(offer))} ${finish(offer)} plaque${offer.preset.wood ? ' with wood backing' : ''} go outside?`, answer: outdoorAnswer(offer) },
    { question: 'How is it fixed?', answer: fixingAnswer(offer) },
    { question: 'How long will it take?', answer: `Estimated ${offer.productionDays} working days after you approve your proof and pay, then delivery, which is included in the price. If you have a date to meet, message us on WhatsApp before ordering.` },
    { question: 'Can you add a portrait, photo or logo?', answer: portraitAnswer(offer) },
    { question: 'Is this the price for the pictured configuration?', answer: 'Yes. The stated price includes the specified size, finish, fixings and personalised wording. Your approved proof confirms the final layout. Changing the configuration can change the price.' },
  ];
}

export function productIntro(slug: string) {
  const offer = offerFor(slug);
  if (!offer) return '';
  const example = exampleFor(slug);
  const shown = example ? ` The ${pictureWord(slug)} shows it as ${example.use}${example.portrait ? ' with an engraved portrait' : ''}; your own wording replaces it.` : '';
  const size = sizeName(offer);
  return `${an(size) === 'an' ? 'An' : 'A'} ${size} ${shapeWord(offer)}${finish(offer)} plaque${backing(offer)}: ${suits(offer)}. It takes ${wordingFit(offer)}.${shown} See a free proof before you pay, or send us your words on WhatsApp and we'll design it for you.`;
}

export function heroNote(slug: string) {
  const offer = offerFor(slug);
  if (!offer) return '';
  const first = suits(offer);
  return first.charAt(0).toUpperCase() + first.slice(1) + '.';
}

const title = (text: string) => text.replace(/(^|\s)([a-z])/g, (_, space, letter) => space + letter.toUpperCase()).replace(/ On /g, ' on ');

/** Page <title>: finish, format and size first, as people search for them. */
export function seoTitleFor(slug: string) {
  const offer = offerFor(slug);
  if (!offer) return '';
  const name = title(finish(offer));
  if (isBench(offer)) return `${name} Memorial Bench Plaque ${offer.size} | InstaPlaque`;
  if (offer.preset.shape !== 'rect') return `${name} ${offer.preset.shape === 'oval' ? 'Oval' : 'Round'} Plaque ${offer.size} | Engraved | InstaPlaque`;
  const fmt = offer.format.startsWith('A') ? `${offer.format.split(' ')[0]} Plaque (${offer.size})` : `Plaque ${offer.size}`;
  return `${name} ${fmt}${offer.preset.wood ? title(backing(offer)) : ''} | Engraved | InstaPlaque`;
}

// Short uses for the meta description, so it fits in Google's snippet (about 155 characters).
function shortUse(offer: Offer) {
  const { width, height, shape, wood } = offer.preset;
  if (shape === 'oval') return 'memorials, pets and house names';
  if (shape === 'circle') return 'short memorials, trees and pets';
  if (isBench(offer)) return 'a memorial bench';
  if (wood) return 'presentations, church gifts and club honours';
  if (width === 200 && height === 150) return 'a name and a short tribute';
  if (width === 210 && height === 148) return 'garden memorials, trees and house names';
  if (width === 148 && height === 210) return 'memorials and portraits';
  if (width === 297 && height === 210) return 'dedications, openings and memorials';
  if (width === 210 && height === 297) return 'church, presentation and memorial wording';
  if (width === 300 && height === 200) return 'house names, dedications and heritage';
  return 'openings, lists of names and heritage';
}

export function seoDescriptionFor(slug: string) {
  const offer = offerFor(slug);
  if (!offer) return '';
  return `${offer.size} ${finish(offer)} plaque${backing(offer)} for ${shortUse(offer)}. Free proof, or we design it for you on WhatsApp. UK delivery included.`;
}

/** Google Shopping title: what people search for first, then the exact size. */
export function feedTitleFor(slug: string) {
  const offer = offerFor(slug);
  if (!offer) return '';
  const name = title(finish(offer));
  if (isBench(offer)) return `Personalised ${name} Memorial Bench Plaque ${offer.size} – Engraved, UK Delivery`;
  if (offer.preset.shape !== 'rect') return `Personalised ${name} ${offer.preset.shape === 'oval' ? 'Oval' : 'Round'} Plaque ${offer.size} – Engraved Memorial or House Plaque`;
  if (offer.preset.wood) return `Personalised ${name} Plaque${title(backing(offer))} ${offer.size} – Engraved Presentation or Memorial Plaque`;
  return `Personalised ${name} Plaque ${offer.size} – Engraved Memorial, Garden or House Plaque`;
}

export function feedDescriptionFor(slug: string) {
  const offer = offerFor(slug);
  if (!offer) return '';
  return `${productIntro(slug)} ${offer.preset.fixingHoleCount} ${offer.preset.fixing === 'caps' ? 'decorative fixing caps' : 'screw fixings'}, ${offer.preset.textColor} paint-filled etched lettering, 1.5 mm solid metal. Estimated production ${offer.productionDays} working days after proof approval and payment. UK delivery included.`;
}

export interface Idea { slug: string; label: string; lines: string[]; use: string }

/** Other example inscriptions on the same size, for "more ideas" on each product page. */
export function ideasFor(slug: string, count = 3): Idea[] {
  const offer = offerFor(slug);
  if (!offer) return [];
  const own = exampleFor(slug);
  const same = merchantOffers.filter(item => item.slug !== slug && item.preset.width === offer.preset.width
    && item.preset.height === offer.preset.height && item.preset.shape === offer.preset.shape && catalogueExamples[item.slug]);
  // Prefer different kinds of plaque, and rotate the start so neighbouring pages differ.
  const start = [...slug].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7) % Math.max(same.length, 1);
  const rotated = [...same.slice(start), ...same.slice(0, start)];
  const picked: Idea[] = [];
  const uses = new Set(own ? [own.use] : []);
  for (const pass of [0, 1]) {
    for (const item of rotated) {
      if (picked.length >= count) break;
      const example = catalogueExamples[item.slug];
      if (picked.some(p => p.slug === item.slug) || (pass === 0 && uses.has(example.use))) continue;
      uses.add(example.use);
      picked.push({ slug: item.slug, label: `${item.label}${backing(item)}`, lines: example.lines, use: example.use });
    }
  }
  return picked;
}

export { isPortraitSize };
