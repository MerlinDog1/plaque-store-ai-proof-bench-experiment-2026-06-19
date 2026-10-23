import React from 'react';
import { merchantOffers } from '../services/merchantCatalogue.mjs';
import { merchantProducts } from '../services/commerce';
import { exampleFor, ideasFor, isPortraitSize } from '../services/catalogueContent';
import { ContactLink, WhatsAppIcon } from './ContactOptions';

// Catalogue product pages (owner msg 5231, review 21 Oct 2026): a real specification where the
// empty "Choose the size and finish." block was, and links between sizes, finishes and backings
// so the 175 exact-offer pages are neither orphaned nor near-duplicates.

type Offer = (typeof merchantOffers)[number];

const priceFor = (slug: string) => merchantProducts.find(item => item.slug === slug)?.startingFrom || '';
const offerFor = (slug: string) => merchantOffers.find(offer => offer.slug === slug);
const sameBacking = (a: Offer, b: Offer) => a.preset.wood === b.preset.wood && (!a.preset.wood || a.preset.woodTone === b.preset.woodTone);
const sameSize = (a: Offer, b: Offer) => a.preset.width === b.preset.width && a.preset.height === b.preset.height && a.preset.shape === b.preset.shape;
const bySize = (a: Offer, b: Offer) => a.preset.width * a.preset.height - b.preset.width * b.preset.height || a.preset.width - b.preset.width;

export function samplePdfFor(slug: string) {
  return `/samples/products/${slug}.pdf`;
}

/** Short size name, e.g. "150 × 50 mm bench", "A5 landscape", "250 × 150 mm oval". */
export function offerSizeLabel(offer: Offer) {
  if (offer.format === 'Bench') return `${offer.size} bench`;
  if (offer.format.startsWith('A')) return `${offer.format} (${offer.size})`;
  if (offer.preset.shape !== 'rect') return `${offer.size} ${offer.preset.shape}`;
  return offer.size;
}

const backingLabel = (offer: Offer) => (!offer.preset.wood ? 'No backing' : offer.preset.woodTone === 'dark' ? 'Dark wood backing' : 'Light wood backing');

const finishNotes: Record<string, string> = {
  'brushed-stainless': 'Brushed stainless steel has a satin silver face with a fine linear grain. It is clean and restrained for outdoor bench plaques, public spaces and contemporary settings.',
  'polished-stainless': 'Polished stainless steel is bright and reflective: crisp for modern plaques where a polished look matters.',
  'brushed-brass': 'Brushed brass has a warm satin grain. It is traditional and legible for memorial, dedication and presentation plaques.',
  'polished-brass': 'Polished brass is the brightest brass, with a formal, refined face for presentation plaques.',
  'orbital-brass-matt-lacquer': 'Orbital brass has a distinctive orbital grain under a matt lacquer, for a more decorative, crafted brass surface.',
  'aged-brass': 'Aged brass has a hand-applied patina, sealed with matt lacquer to slow further natural ageing. The lettering is filled cream so it stands out against the darker metal.',
};

function sizeTip(offer: Offer) {
  const { width, height } = offer.preset;
  if (offer.format === 'Bench') {
    return `Measure the flat face of the backrest rail first. This plaque is ${height} mm tall, so the rail needs a flat face deeper than that, with room around the edges and clear of any existing bolts. To check the length, hold a ${width} × ${height} mm strip of card against the rail.`;
  }
  if (offer.format.startsWith('A5')) return `A5 is half a sheet of A4 paper. Fold an A4 sheet in half and hold it ${height > width ? 'upright' : 'sideways'} where the plaque will go to check the size${offer.preset.wood ? ', remembering the wood board adds 12.5 mm all round' : ''}.`;
  if (offer.format.startsWith('A4')) return `A4 is the size of a standard sheet of printer paper. Hold one ${height > width ? 'upright' : 'sideways'} where the plaque will go to check the size${offer.preset.wood ? ', remembering the wood board adds 12.5 mm all round' : ''}.`;
  return `Cut a piece of card to ${width} × ${height} mm${offer.preset.shape !== 'rect' ? ` (draw the ${offer.preset.shape} inside it)` : ''} and tape it where the plaque will go to check the size${offer.preset.wood ? ', remembering the wood board adds 12.5 mm all round' : ''}.`;
}

function fixingText(offer: Offer) {
  const { fixing, fixingHoleCount: count, capSize, shape } = offer.preset;
  const where = count === 4 ? 'one in each corner' : shape === 'rect' ? 'one at each end' : 'one at each side';
  return fixing === 'caps'
    ? `${count} screws, ${where}, covered by Ø${capSize} mm decorative caps`
    : `${count} screws, ${where}`;
}

function SizeLinks({ title, offers }: { title: string; offers: Offer[] }) {
  if (!offers.length) return null;
  return (
    <div className="shop-catalogue-links">
      <h3>{title}</h3>
      <ul>
        {offers.map(offer => (
          <li key={offer.slug}><a href={`/${offer.slug}`}>{offerSizeLabel(offer)}</a> <span>{priceFor(offer.slug)}</span></li>
        ))}
      </ul>
    </div>
  );
}

export function MerchantProductDetails({ slug }: { slug: string }) {
  const offer = offerFor(slug);
  if (!offer) return null;
  const p = offer.preset;
  const otherSizes = merchantOffers.filter(item => item.preset.material === p.material && sameBacking(item, offer) && item.slug !== offer.slug).sort(bySize);
  const otherFinishes = merchantOffers.filter(item => sameSize(item, offer) && sameBacking(item, offer) && item.preset.material !== p.material
    && (item.format === 'Bench') === (offer.format === 'Bench'));
  const otherBackings = merchantOffers.filter(item => sameSize(item, offer) && item.preset.material === p.material && !sameBacking(item, offer));
  const shapeText = p.shape === 'rect' ? 'Rectangle, square corners' : p.shape === 'oval' ? 'Oval' : 'Circle';
  const specs: Array<[string, string]> = [
    ['Size', `${offer.size}${p.wood ? `, on a ${p.width + 25} × ${p.height + 25} mm wood board` : ''}`],
    ['Shape', shapeText],
    ['Finish', `${offer.label}, 1.5 mm solid metal`],
    ['Lettering', `Etched and paint-filled ${p.textColor}`],
    ['Border', `Engraved ${p.borderStyle} line, scalloped or none`],
    ['Fixings', `${fixingText(offer)}. Standard fixings included`],
    ['Backing', p.wood ? `${p.woodTone === 'dark' ? 'Dark' : 'Light'} wood, bevelled edge` : 'None: fixed directly to the surface'],
    ['Portrait or logo', isPortraitSize(offer) ? 'Can be engraved from your photo: ask for a free sketch and exact price' : 'Portraits need A5 or larger; a small logo may fit'],
    ['Production', `Estimated ${offer.productionDays} working days after proof approval and payment`],
    ['Delivery', 'UK delivery included'],
    ['Price', `${priceFor(offer.slug)}, including engraving of your wording, fixings and UK delivery`],
  ];
  const example = exampleFor(offer.slug);
  const ideas = ideasFor(offer.slug);
  return (
    <>
      {example && (
        <section className="shop-section shop-wording-examples shop-product-example" aria-labelledby="product-example-heading">
          <p className="shop-kicker">The example in the photo</p>
          <h2 id="product-example-heading">Shown as {example.use}.</h2>
          <p>
            The photo shows this {offerSizeLabel(offer)} plaque with invented example wording{example.portrait ? ' and an engraved portrait' : ''}.
            Your own words replace it, laid out to fit the plate, and you see the proof before you pay.
            {example.portrait ? ' Portraits are drawn from a favourite photo of a person or pet that you send us.' : ''}
          </p>
          <div className="shop-inscription-grid">
            <article>
              <h3>On this plaque</h3>
              <blockquote>{example.lines.map((line, index) => <React.Fragment key={index}>{index > 0 && <br />}{line}</React.Fragment>)}</blockquote>
            </article>
            {ideas.map(idea => (
              <article key={idea.slug}>
                <h3>Another idea: {idea.use.replace(/^an? /, '')}</h3>
                <blockquote>{idea.lines.map((line, index) => <React.Fragment key={index}>{index > 0 && <br />}{line}</React.Fragment>)}</blockquote>
                <p className="shop-smallprint">Shown on <a href={`/${idea.slug}`}>{idea.label}</a></p>
              </article>
            ))}
          </div>
          <p>
            Not sure what to write? <ContactLink channel="whatsapp" placement="page" subject={`a ${offer.size} plaque`}><WhatsAppIcon /> Send us a few words on WhatsApp</ContactLink> and we will suggest a layout, or see our <a href="/memorial-plaques#memorial-wording">memorial wording examples</a>.
          </p>
        </section>
      )}
      <section className="shop-section shop-buying-guide shop-product-spec">
        <div>
          <p className="shop-kicker">Size, finish and fitting</p>
          <h2>What you get.</h2>
          <p>{finishNotes[p.material]}</p>
          <p>{sizeTip(offer)}</p>
          {p.wood && <p>Wood backing suits indoor or sheltered displays.</p>}
          <a className="shop-text-link" href={samplePdfFor(offer.slug)} target="_blank" rel="noopener">
            See a sample proof for this plaque (PDF) ↗
          </a>
        </div>
        <dl className="shop-spec-list">
          {specs.map(([term, value]) => (
            <div key={term}><dt>{term}</dt><dd>{value}</dd></div>
          ))}
        </dl>
      </section>
      <nav className="shop-section shop-catalogue-compare" aria-label="Compare sizes, finishes and backing">
        <p className="shop-kicker">Compare</p>
        <h2>Other sizes and finishes.</h2>
        <div className="shop-catalogue-grid">
          <SizeLinks title={`${offer.label}${p.wood ? `, ${backingLabel(offer).toLowerCase()}` : ''}: other sizes`} offers={otherSizes} />
          {(otherFinishes.length > 0 || otherBackings.length > 0) && <div className="shop-catalogue-links">
            {otherFinishes.length > 0 && <>
              <h3>{offerSizeLabel(offer)}: other finishes</h3>
              <ul>
                {otherFinishes.map(item => (
                  <li key={item.slug}><a href={`/${item.slug}`}>{item.label}</a> <span>{priceFor(item.slug)}</span></li>
                ))}
              </ul>
            </>}
            {otherBackings.length > 0 && <>
              <h3>Backing</h3>
              <ul>
                {otherBackings.map(item => (
                  <li key={item.slug}><a href={`/${item.slug}`}>{backingLabel(item)}</a> <span>{priceFor(item.slug)}</span></li>
                ))}
              </ul>
            </>}
          </div>}
        </div>
      </nav>
    </>
  );
}

/** Size list for a finish, used on the brass and stainless category pages. */
export function CatalogueSizeLinks({ materials, title, kicker }: { materials: string[]; title: string; kicker: string }) {
  return (
    <nav className="shop-section shop-catalogue-compare" aria-label={title}>
      <p className="shop-kicker">{kicker}</p>
      <h2>{title}</h2>
      <div className="shop-catalogue-finishes">
        {materials.map((material, index) => {
          const offers = merchantOffers.filter(offer => offer.preset.material === material && !offer.preset.wood).sort(bySize);
          const from = merchantProducts.filter(item => offers.some(offer => offer.slug === item.slug))
            .sort((a, b) => (a.schemaStartingPrice || 0) - (b.schemaStartingPrice || 0))[0]?.startingFrom;
          return (
            <details key={material} open={index === 0}>
              <summary>{offers[0]?.label || material} <span>from {from}</span></summary>
              <ul>
                {offers.map(offer => (
                  <li key={offer.slug}><a href={`/${offer.slug}`}>{offerSizeLabel(offer)}</a> <span>{priceFor(offer.slug)}</span></li>
                ))}
              </ul>
            </details>
          );
        })}
      </div>
      <p className="shop-smallprint">Without wood backing. Each plaque page shows the backing options.</p>
    </nav>
  );
}

/** A5 landscape product page for a finish, used by the materials page. */
export function coreOfferFor(material: string) {
  return merchantOffers.find(offer => offer.preset.material === material && offer.preset.width === 210 && offer.preset.height === 148 && !offer.preset.wood);
}
export const coreOfferPrice = priceFor;
