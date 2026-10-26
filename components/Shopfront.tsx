import React from "react";
import { CategoryLandingPage } from './CategoryLanding';
import { categoryLandingFor } from './CategoryPages';
import { GardenAdvice, CollectionLinks, PlaqueWordingExamples, ShopTurnaround, ProductionNote } from './ShopGuides';
import { businessContact, productionTiming } from '../services/shopInformation';
import { ContactLink, MobileContactBar, WhatsAppIcon, plaqueSubject } from './ContactOptions';
import { HomeAiSection, HomePortraitSection, HomeQualitySection, ProofPdfShowcase } from './FeatureSections';
import { TrackedPrice, displayedPriceValue } from './TrackedPrice';
import { PriceTable, a5BoardPrice, groundStakePrice, homePriceSizes, priceTableIncludes } from './PriceTable';
import { MerchantProductDetails, CatalogueSizeLinks, coreOfferFor, coreOfferPrice } from './CatalogueDetails';
import { merchantImageQuery, merchantOffers } from '../services/merchantCatalogue.mjs';
import { optimisedSrcSet } from '../services/imageUrls';
import { WordingLibrary } from './WordingGuide';
import { exampleFor } from '../services/catalogueContent';
import {
  photo600,
  productFamilies,
  ProductFamily,
  materialStories,
  SeoLandingPage,
  seoLandingPages,
  categoryParentFor,
  landingDesignProduct,
} from "../services/commerce";

export const shopFaqs = [
  {
    question: "Can I see my plaque before I pay?",
    answer:
      "Yes. Create your layout in the online designer, with no account or payment needed. Check names, dates, line breaks and fixing positions, then download your proof PDF if you need time to decide. The PDF includes a link to return to your design. If we design it for you, we send you the proof to approve before you pay. The proof is for approving wording and layout; screen colours and texture previews are illustrative.",
  },
  {
    question: "What is included in the price?",
    answer:
      "Standard plaque prices include engraving, standard fixings and UK delivery. Wood backing, special finishes and other extras are priced in the designer before checkout.",
  },
  {
    question: "How long will my plaque take?",
    answer: productionTiming.faq,
  },
  {
    question: "Which material should I choose for outdoors?",
    answer:
      "Brass gives a warm, traditional appearance and develops character over time. Stainless steel has a clean silver finish. Both can be used outdoors with suitable fixings. Choose the finish you prefer and check the fixing options in your proof.",
  },
  {
    question: "How much wording will fit?",
    answer:
      "A 150 × 50 mm bench plaque suits a name, dates and a short dedication. A5 gives a longer message more room; A4 suits formal openings and longer tributes. If the proof feels crowded, choose a larger size instead of squeezing in smaller text.",
  },
  {
    question: "Can you help with an unusual plaque?",
    answer:
      `Yes. For a custom shape, a longer inscription or unusual mounting, send us the wording, approximate size and where the plaque will go, on WhatsApp (${businessContact.whatsapp}) or by email to ${businessContact.email}. A photo of the spot, or a design you made in ChatGPT, helps too. We can suggest a starting point or design it for you.`,
  },
];

// The /faq page answers the questions people search for (owner msg 5736), on top of the shared ones.
export const helpFaqs = [
  ...shopFaqs,
  {
    question: "What should I write on a memorial plaque?",
    answer: "Start with the name as the largest line, then the dates, then a short line about them: for example “In loving memory of / MARGARET ELLIS / 1942 – 2024 / who loved this garden”. Keep it short enough to read at a glance. Stuck for words? Send us what you have on WhatsApp and we’ll suggest a layout.",
  },
  {
    question: "How much does a memorial plaque cost?",
    answer: "Bench plaques start from £58.50 and A5 memorial plaques from £95.50, including engraving, standard fixings and UK delivery. Larger sizes, wood backing and special finishes cost more, and the designer shows the exact price before you pay.",
  },
  {
    question: "Can I fix a plaque to a tree?",
    answer: "We recommend not fixing a plaque to the tree itself: screws and wire damage it and the bark grows over them. Fix it to a short post or stake beside the tree, a sleeper at its foot, or a nearby wall or fence.",
  },
  {
    question: "Can you engrave a photo, portrait or logo?",
    answer: "Yes. Send a favourite photo of a person or pet, or your logo, on WhatsApp. We turn it into engraving artwork and arrange your words around it, then send a free proof with an exact price. Portraits need an A5 (210 × 148 mm) or larger plaque.",
  },
  {
    question: "Can you make a size or shape that isn’t listed?",
    answer: "Yes. Message us on WhatsApp with the size, shape, wording and where it will go, or a photo or sketch of what you have in mind. We’ll design it and send a free proof with the price before you decide.",
  },
  {
    question: "Do you make house signs and name plates?",
    answer: "Yes. House names and numbers, door plates and business signs in brass or stainless steel. A 300 × 200 mm or A4 plaque suits most house names; send us the name and a photo of the wall on WhatsApp and we’ll design it for you.",
  },
  {
    question: "How do I fit a plaque to a memorial bench?",
    answer: "Measure the flat face of the backrest rail first: the plaque needs to sit within it, clear of bolts and joints. Bench plaques come with screws for timber rails. For a metal or composite bench, or a council or park bench, ask us and the site manager before ordering.",
  },
];

const collections = [
  {
    slug: "bench-plaques",
    image: "/site-images/home-gallery-brass-bench.webp",
    note: "A small place for a lasting memory.",
    detail: "Compact brass or steel plaques for benches and seats.",
  },
  {
    slug: "memorial-plaques",
    image: "/site-images/home-gallery-aged-brass-wood.webp",
    note: "Remember them in your own words.",
    detail: "Personal tributes for gardens, walls and quiet corners.",
  },
  {
    slug: "garden-plaques",
    image: "/site-images/home-carousel-garden-brass.webp",
    note: "A dedication for a favourite place.",
    detail: "Dedications for trees, planted spaces and garden walls.",
  },
  {
    slug: "opening-plaques",
    image: "/site-images/home-gallery-brass-community.webp",
    note: "Mark the occasion clearly.",
    detail: "Formal inscriptions for buildings, schools and community spaces.",
  },
];

const materialProductImages: Record<string, string> = {
  'brass-plaques': '/site-images/home-gallery-brass-community.webp',
  'stainless-steel-plaques': '/site-images/home-gallery-oval-steel.webp',
};

export function DesignLink({
  onStart,
  children = "Design your plaque",
  className = "",
}: {
  onStart?: () => void;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      className={`shop-button ${className}`}
      href="/design"
      onClick={
        onStart
          ? (event) => {
              if (
                event.button === 0 &&
                !event.metaKey &&
                !event.ctrlKey &&
                !event.shiftKey &&
                !event.altKey
              ) {
                event.preventDefault();
                onStart();
              }
            }
          : undefined
      }
    >
      {children}
      <span aria-hidden="true">↗</span>
    </a>
  );
}

// Desktop category grid. Phones show the same four as photo tiles under the home headline
// (HeroRoutes), so this section is hidden there rather than shown twice (owner msg 5860).
export function ShopCollections() {
  return (
    <section className="shop-section shop-home-collections" id="products">
      <div className="shop-section-heading">
        <div>
          <p className="shop-kicker">Choose by occasion</p>
          <h2>Find your plaque.</h2>
        </div>
        <p>
          Start with where your plaque will go. <br />
          Choose brass or stainless steel in the designer, or <a className="shop-text-link" href="/plaque-sizes">see every size and price</a>.
        </p>
      </div>
      <div className="shop-collections">
        {collections.map((collection) => {
          const landing = seoLandingPages.find((item) => item.slug === collection.slug);
          const product = productFamilies.find(
            (item) => item.slug === (landing?.relatedProductSlug || collection.slug),
          )!;
          const title = landing?.title || product.title;
          return (
            <a
              className="shop-collection"
              href={`/${collection.slug}`}
              key={collection.slug}
            >
              <div className="shop-collection-image">
                <img
                  src={collection.image}
                  srcSet={optimisedSrcSet(collection.image, 1200, [320, 480, 640])}
                  sizes={optimisedSrcSet(collection.image, 1200, [320]) ? '(max-width: 720px) 45vw, 282px' : undefined}
                  alt={`${title} design example`}
                  width="1200"
                  height="1200"
                  loading="lazy"
                />
              </div>
              <div className="shop-collection-title">
                <h3>{title}</h3>
                <span aria-hidden="true">↗</span>
              </div>
              <p>{collection.detail}</p>
              <strong>{product.startingFrom}</strong>
            </a>
          );
        })}
      </div>
      <p className="shop-smallprint">
        Starting prices are for stainless steel without wood backing, including
        engraving, standard fixings and UK delivery. Examples may show
        brass, optional finishes or backing. Your selected options are priced in the designer.
      </p>
      <nav className="shop-related" aria-label="Materials and custom options">
        <a href="/brass-plaques">Browse brass plaques ↗</a>
        <a href="/stainless-steel-plaques">Browse stainless steel plaques ↗</a>
        <a href="/custom-plaques">Custom sizes & shapes ↗</a>
      </nav>
    </section>
  );
}

export function ShopProcess() {
  return (
    <section className="shop-process" id="how-it-works">
      <div className="shop-section">
        <div className="shop-section-heading">
          <div>
            <p className="shop-kicker">Design online, at your own pace</p>
            <h2>Your words. Your approval.</h2>
          </div>
          <a className="shop-text-link" href="/how-it-works">
            How it works ↗
          </a>
        </div>
        <div className="shop-steps">
          {[
            [
              "Choose your plaque",
              "Choose the size, metal finish and fixings. See the price update as you change your options, including engraving and UK delivery.",
            ],
            [
              "Create your layout online",
              "Enter your wording and create a layout in the designer. Adjust the text and spacing, and download the proof PDF to review or share before paying.",
            ],
            [
              "Check, then order",
              "Check every name, date and fixing position. Approve the layout, check the production estimate and pay securely. Production starts after approval and payment.",
            ],
          ].map(([title, copy], index) => (
            <article key={title}>
              <span className="shop-step-number">0{index + 1}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ShopFaq({ faqs = shopFaqs }: { faqs?: typeof shopFaqs }) {
  return (
    <section className="shop-section shop-faq">
      <div>
        <p className="shop-kicker">Help before you order</p>
        <h2>Your questions, answered.</h2>
        <p>Have something else in mind?</p>
        <ContactLink channel="whatsapp" placement="page" className="shop-text-link">
          Ask us on WhatsApp ↗
        </ContactLink>
      </div>
      <div>
        {faqs.map((faq) => (
          <details key={faq.question}>
            <summary>
              {faq.question}
              <span aria-hidden="true">+</span>
            </summary>
            <p>{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

// "Make it clear we can make whatever you want via WhatsApp" (owner msg 5736): one band on every
// shop page, so a visitor who can't see their exact plaque knows to just ask.
export function CustomAnything({ subject = 'a custom plaque' }: { subject?: string }) {
  return (
    <section className="shop-section shop-design-service shop-custom-anything" aria-labelledby="custom-anything-heading">
      <div>
        <p className="shop-kicker">Can’t see exactly what you need?</p>
        <h2 id="custom-anything-heading">Tell us what you want. We’ll make it.</h2>
        <p>Almost any size, shape or wording: memorials, tree and garden dedications, house names, awards, logos, and portraits engraved from your own photos. Send us a few words, a sketch or a photo of the spot on WhatsApp, and we’ll design it for you and send a free proof, usually within 3 working hours.</p>
        <div className="shop-design-service-actions">
          <ContactLink channel="whatsapp" placement="page" subject={subject} className="shop-button shop-hero-choice-whatsapp shop-whatsapp-button">
            <WhatsAppIcon /> Message us on WhatsApp
          </ContactLink>
          <a href="/design-request" className="shop-text-link">Or use the design form ↗</a>
        </div>
        <p className="shop-smallprint">No obligation. You only pay once you’re happy with your proof.</p>
      </div>
      <ol className="design-service-steps">
        <li><span>01</span><div><strong>Tell us your idea</strong><p>Wording, size, where it’s going, or a picture of something you like.</p></div></li>
        <li><span>02</span><div><strong>We design it</strong><p>A proof drawn to size, by WhatsApp or email.</p></div></li>
        <li><span>03</span><div><strong>Approve, then pay</strong><p>Ask for changes until it’s right.</p></div></li>
      </ol>
    </section>
  );
}

/** Photo links to exact catalogue plaques, for the category and landing pages. */
export function ProductPicks({ slugs, kicker, title, intro, id, className }: { slugs: string[]; kicker: string; title: string; intro?: string; id?: string; className?: string }) {
  const items = slugs.map(slug => productFamilies.find(item => item.slug === slug)).filter((item): item is ProductFamily => Boolean(item));
  if (!items.length) return null;
  return (
    <nav className={`shop-section shop-product-picks${className ? ` ${className}` : ''}`} id={id} aria-label={title}>
      <p className="shop-kicker">{kicker}</p>
      <h2>{title}</h2>
      {intro && <p>{intro}</p>}
      <ul>
        {items.map(item => (
          <li key={item.slug}>
            <a href={`/${item.slug}`}>
              <img src={item.photo ? photo600(item.photo) : item.merchantOffer ? item.image + merchantImageQuery : item.image} {...cardImageSizes(item)} alt={`${item.title}, shown with example wording`} width="600" height="600" loading="lazy" />
              <span>{item.title}</span>
              <strong>{item.startingFrom}</strong>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}


// Every catalogue plaque by size (owner-approved plan of 21 Oct: a "Shop by size" page with photos).
const sizeGroups: Array<[string, (offer: typeof merchantOffers[number]) => boolean]> = [
  ['Bench plaques', offer => offer.format === 'Bench'],
  ['A5 landscape (210 × 148 mm)', offer => offer.format === 'A5 landscape'],
  ['A5 portrait (148 × 210 mm)', offer => offer.format === 'A5 portrait'],
  ['200 × 150 mm', offer => offer.preset.width === 200 && offer.preset.height === 150],
  ['A4 landscape (297 × 210 mm)', offer => offer.format === 'A4 landscape'],
  ['A4 portrait (210 × 297 mm)', offer => offer.format === 'A4 portrait'],
  ['300 × 200 mm', offer => offer.preset.width === 300 && offer.preset.height === 200],
  ['400 × 300 mm', offer => offer.preset.width === 400 && offer.preset.height === 300],
  ['Oval (250 × 150 mm)', offer => offer.preset.shape === 'oval'],
  ['Circle (200 × 200 mm)', offer => offer.preset.shape === 'circle'],
];

export function ShopBySize() {
  return (
    <section className="shop-section shop-by-size" aria-labelledby="shop-by-size-heading">
      <p className="shop-kicker">Every standard plaque</p>
      <h2 id="shop-by-size-heading">Sizes, finishes and prices.</h2>
      <p>Prices include engraving of your wording, standard fixings and UK delivery. Wood-backed versions are listed under each size.</p>
      {sizeGroups.map(([title, test]) => {
        const offers = merchantOffers.filter(test);
        const metal = offers.filter(offer => !offer.preset.wood);
        const wood = offers.filter(offer => offer.preset.wood);
        return (
          <div className="shop-size-group" key={title}>
            <h3>{title}</h3>
            <ul className="shop-size-cards">
              {metal.map(offer => {
                const item = productFamilies.find(product => product.slug === offer.slug);
                if (!item) return null;
                return (
                  <li key={offer.slug}><a href={`/${offer.slug}`}>
                    <img src={item.photo ? photo600(item.photo) : item.merchantOffer ? item.image + merchantImageQuery : item.image} {...cardImageSizes(item)} alt={`${item.title}, shown with example wording`} width="600" height="600" loading="lazy" />
                    <span>{offer.label}{offer.format === 'Bench' ? ` · ${offer.size}` : ''}</span><strong>{item.startingFrom}</strong>
                  </a></li>
                );
              })}
            </ul>
            {wood.length > 0 && <p className="shop-smallprint">On wood: {wood.map((offer, index) => (
              <React.Fragment key={offer.slug}>{index > 0 && ' · '}<a href={`/${offer.slug}`}>{offer.label} on {offer.preset.woodTone === 'dark' ? 'dark walnut' : 'light oak'}</a></React.Fragment>
            ))}</p>}
          </div>
        );
      })}
    </section>
  );
}

type LandingExample = NonNullable<SeoLandingPage['examples']>[number];

/** Photo examples on a landing page (the tree and garden pages). */
function LandingExamples({ examples, kicker, title }: { examples: LandingExample[]; kicker: string; title: string }) {
  return (
    <section className="shop-section shop-landing-examples" aria-label={title}>
      <p className="shop-kicker">{kicker}</p>
      <h2>{title}</h2>
      <div className="shop-landing-example-grid">
        {examples.map(example => (
          <figure key={example.image}>
            <img src={example.image.replace(/\.webp$/, '-900.webp')} srcSet={`${example.image.replace(/\.webp$/, '-900.webp')} 900w, ${example.image} 1536w`} sizes="(max-width: 720px) 92vw, 46vw" alt={example.alt} width="1536" height="1024" loading="lazy" />
            <figcaption><strong>{example.title}</strong> {example.copy}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

// Picks for the category pages: real catalogue pages with their photos. Each mixes metals, finishes, borders, shapes
// and wood backings, settings that make sense for the wording, and nothing shown twice on a page (owner msg 5927).
// Phones show the first four, so those four are the most varied.
// The brass, stainless and custom pages have no picks: their four tiles are the plaques shown (owner msg 6270).
const productPicks: Record<string, { kicker: string; title: string; intro: string; slugs: string[] }> = {
  // Four picks, each one photographed on the wall, shed or gate it is fixed to, so every photo on the page is one the
  // owner has seen (owner msg 6270: "too many [images] realistically for me to root out the bad ones").
  'garden-plaques': { kicker: 'Garden plaques', title: 'Popular garden plaques.', intro: 'Each plaque is shown where it was fixed, with its own example wording. Open one to see its sizes, finishes and a sample proof.',
    slugs: ['polished-stainless-210x148-rect-plaque', 'aged-brass-250x150-oval-plaque', 'brushed-brass-200x200-circle-plaque', 'orbital-brass-matt-lacquer-300x200-rect-plaque'] },
  'memorial-plaques': { kicker: 'Memorial plaques', title: 'Memorial plaques, shown with example wording.', intro: 'From a short bench dedication to a family memorial on a wood board. Open any plaque for its sizes, finishes and a sample proof.',
    // Four picks with plain wording; the wall memorials on wood with the scalloped border (owner msgs 6001, 6270, 6313).
    slugs: ['brushed-stainless-210x148-rect-dark-wood-plaque', 'aged-brass-400x300-rect-light-wood-plaque', 'polished-stainless-210x297-rect-dark-wood-plaque', 'brushed-stainless-150x50-rect-plaque'] },
  // Each with a fuller dedication on a real bench, newer and older, photographed from in front the way a visitor sees
  // it, with the plaque square on the top rail (owner msgs 6132, 6149, 6152); one on our workshop bench.
  'bench-plaques': { kicker: 'Bench plaques', title: 'Bench plaques, shown on a bench.', intro: 'Each bench plaque is shown on a real bench with its own example dedication: newer benches and old favourites, from a seafront promenade to a churchyard. One is on our workshop bench, just polished.',
    slugs: ['brushed-stainless-150x50-rect-plaque', 'brushed-brass-225x75-rect-plaque', 'polished-stainless-200x50-rect-plaque', 'aged-brass-150x75-rect-plaque', 'polished-brass-150x65-rect-plaque', 'orbital-brass-matt-lacquer-150x75-rect-plaque', 'brushed-stainless-150x75-rect-plaque', 'polished-stainless-225x65-rect-plaque'] },
  // Four openings, each photographed where it is fixed; the pavilion is the brass page's orbital tile (owner msg 6281).
  'opening-plaques': { kicker: 'Opening and dedication plaques', title: 'Openings, shown with example wording.', intro: 'Rooms, clubs, surgeries and pavilions, in brass and stainless steel, with and without wood backing. Open any plaque for its sizes and a sample proof.',
    slugs: ['brushed-stainless-297x210-rect-light-wood-plaque', 'brushed-brass-300x200-rect-light-wood-plaque', 'brushed-stainless-400x300-rect-dark-wood-plaque', 'orbital-brass-matt-lacquer-297x210-rect-plaque'] },
};

// Phones: "what's your plaque for?" routes with photos straight under the headline,
// so a visitor sees at once that they are in the right place and where to tap.
const routeThumbs: Record<string, string> = {
  'memorial-plaques': '/site-images/home-route-memorial-480.webp',
  'bench-plaques': '/site-images/home-route-bench-480.webp',
  'garden-plaques': '/site-images/home-route-garden-480.webp',
  'opening-plaques': '/site-images/home-route-opening-480.webp',
};

function HeroRoutes() {
  return (
    <nav className="shop-hero-routes" aria-label="Choose your plaque">
      <p className="shop-hero-routes-title">What’s your plaque for?</p>
      <div className="shop-hero-routes-grid">
        {collections.map((collection) => {
          const landing = seoLandingPages.find((item) => item.slug === collection.slug);
          const product = productFamilies.find((item) => item.slug === (landing?.relatedProductSlug || collection.slug))!;
          const title = (landing?.title || product.title).replace(/\s+plaques?$/i, '');
          return (
            <a className="shop-hero-route" href={`/${collection.slug}`} key={collection.slug}>
              <img src={routeThumbs[collection.slug] || collection.image} alt="" width="480" height="320" />
              <span><strong>{title}</strong><small><TrackedPrice value={displayedPriceValue(product.startingFrom)} product={product.slug}>{product.startingFrom}</TrackedPrice></small></span>
            </a>
          );
        })}
      </div>
      <p className="shop-hero-routes-more">
        Something else? <ContactLink channel="whatsapp" placement="hero" subject="a plaque">WhatsApp us your idea</ContactLink>, or <a href="/plaque-sizes">see every size and price</a>.
      </p>
    </nav>
  );
}

// How to order, in one place (owner msg 5860, 24 Oct 2026: the homepage repeated itself). It replaces three
// homepage sections that each explained the same thing: designing online ("Your words. Your approval."),
// "Want us to take care of the design?" (msg 5174) and "Tell us what you want. We'll make it." (msg 5736).
// The two routes sit side by side, so WhatsApp is as prominent as the designer (msg 5137).
function HomeWays({ onStartDesign, onRequestDesign }: { onStartDesign?: () => void; onRequestDesign?: () => void }) {
  return (
    <section className="shop-section shop-ways" id="how-it-works" aria-labelledby="ways-heading">
      <div className="shop-section-heading">
        <div>
          <p className="shop-kicker">Two ways to make your plaque</p>
          <h2 id="ways-heading">Your words. Your approval.</h2>
        </div>
        <a className="shop-text-link" href="/how-it-works">How it works ↗</a>
      </div>
      <div className="shop-ways-grid">
        <article className="shop-way">
          <h3>Design it yourself, online</h3>
          <ol>
            <li><strong>Choose your plaque</strong><span>Size, metal and fixings, with the price including engraving and UK delivery as you go.</span></li>
            <li><strong>Add your words</strong><span>Adjust the layout, then download a free proof PDF to check or share.</span></li>
            <li><strong>Check, then order</strong><span>Approve the layout and pay securely. We make it after that.</span></li>
          </ol>
          <div className="shop-design-service-actions">
            <DesignLink onStart={onStartDesign}>Design online</DesignLink>
          </div>
        </article>
        <article className="shop-way shop-way-whatsapp">
          <h3>Want us to take care of the design?</h3>
          <ol>
            <li><strong>Tell us your idea</strong><span>Your wording, a photo of where it’s going, or a picture of something you like.</span></li>
            <li><strong>We design it</strong><span>Your proof within 3 working hours, by WhatsApp or email.</span></li>
            <li><strong>Approve, then pay</strong><span>Ask for changes until it’s right. No obligation.</span></li>
          </ol>
          <div className="shop-design-service-actions">
            <ContactLink channel="whatsapp" placement="page" className="shop-button shop-hero-choice-whatsapp shop-whatsapp-button">
              <WhatsAppIcon /> Design on WhatsApp
            </ContactLink>
            <a href="/design-request" className="shop-text-link" onClick={onRequestDesign ? event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onRequestDesign(); } } : undefined}>Use the design form ↗</a>
          </div>
        </article>
      </div>
      <p className="shop-ways-anything">
        <strong>Can’t see exactly what you need? Tell us what you want. We’ll make it.</strong>{' '}
        Almost any size, shape or wording: memorials, tree and garden dedications, house names, awards, logos, and portraits engraved from your own photos.{' '}
        <ContactLink channel="whatsapp" placement="page" subject="a custom plaque">Message us on WhatsApp ↗</ContactLink>
      </p>
    </section>
  );
}

/** "Prices at a glance": six sizes in stainless steel, brass and aged brass, each price opening that plaque. */
function HomePrices() {
  return (
    <section className="shop-section shop-home-prices" id="prices">
      <div className="shop-section-heading">
        <div>
          <p className="shop-kicker">Sizes and prices</p>
          <h2>Prices at a glance.</h2>
        </div>
        <p>
          Warm brass or clean silver stainless steel, with engraving, fixings and UK delivery in every price. Tap a
          price to see that plaque.
        </p>
      </div>
      <PriceTable sizes={homePriceSizes} caption="Plaque prices by size and metal." compact />
      <p className="shop-smallprint">
        {priceTableIncludes} A wood backing board adds {a5BoardPrice} to an A5 plaque, and a ground stake {groundStakePrice} more.
      </p>
      <div className="shop-home-prices-links">
        <a className="shop-button" href="/plaque-sizes">See every size and price</a>
        <a className="shop-text-link" href="/materials">Compare materials &amp; finishes ↗</a>
      </div>
    </section>
  );
}

export function ShopHome({ onStartDesign, onRequestDesign }: { onStartDesign?: () => void; onRequestDesign?: () => void }) {
  const benchProduct = productFamilies.find(product => product.slug === 'bench-plaques')!;
  return (
    <div className="shopfront" data-prerendered="true">
      <section className="shop-hero">
        <div className="shop-hero-copy">
          {/* Say what we sell first; the slogan becomes the tagline (owner msg 5132). */}
          {/* A price on a phone's first screen (owner msg 6430: "price is kind of hidden a bit"). */}
          <p className="shop-kicker">
            Free proof · UK delivery · <TrackedPrice value={displayedPriceValue(benchProduct.startingFrom)} product={benchProduct.slug}>{benchProduct.startingFrom}</TrackedPrice>
          </p>
          <h1 className="shop-hero-title">Personalised brass &amp; stainless steel plaques</h1>
          <p className="shop-hero-tagline">Some words deserve to <em>stay.</em></p>
          <p className="shop-intro">
            Design online instantly, or talk to one of our designers on WhatsApp.
          </p>
          {/* Two equal first choices; WhatsApp is pushed as hard as the designer (owner msg 5137). */}
          <div className="shop-hero-choices">
            <DesignLink onStart={onStartDesign}>Design online</DesignLink>
            <ContactLink channel="whatsapp" placement="hero" subject="a plaque" className="shop-button shop-hero-choice-whatsapp">
              <WhatsAppIcon /> Design on WhatsApp
            </ContactLink>
          </div>
          {/* Customers increasingly arrive with an AI mock-up (owner msg 5156). */}
          <p className="shop-hero-ai-note">
            Made a design in ChatGPT? <ContactLink channel="whatsapp" placement="hero" subject="a plaque">Send us the picture</ContactLink> and we’ll make it real.
          </p>
          <HeroRoutes />
          <div className="shop-hero-price">
            <span>Bench plaques</span>
            <strong>
              <TrackedPrice value={displayedPriceValue(benchProduct.startingFrom)} product={benchProduct.slug}>{benchProduct.startingFrom}</TrackedPrice>
            </strong>
            <span>with UK delivery</span>
          </div>
          <p className="shop-hero-note">
            Free online designer & proof · No account needed · Or <ContactLink channel="email" placement="hero">email us</ContactLink>
          </p>
          <a className="shop-text-link shop-hero-how" href="#how-it-works">See how the designer works</a>
          <ProductionNote />
        </div>
        <figure className="shop-hero-image">
          {/* Hidden on phones, which show the route tiles: point phones at the bench tile they
              already load, so the 1200 px photo isn't fetched for nothing (review 21 Oct). */}
          <picture>
            <source media="(max-width: 720px)" srcSet="/site-images/home-route-bench-480.webp" />
            <img
              src="/site-images/home-gallery-brass-bench.webp"
              srcSet={optimisedSrcSet('/site-images/home-gallery-brass-bench.webp', 1200, [640, 828, 1080])}
              sizes={optimisedSrcSet('/site-images/home-gallery-brass-bench.webp', 1200, [640]) ? '50vw' : undefined}
              width="1200"
              height="1200"
              fetchPriority="high"
              alt="Brass memorial plaque on a wooden bench in a garden"
            />
          </picture>
          <figcaption>
            <span>A name. A memory. A place to pause.</span>
          </figcaption>
        </figure>
      </section>
      {/* Owner msg 5860 ("This like repeats on the homepage"): each thing once. Prices by size and metal (owner msg
          6430), which also does the old "Brass or stainless steel?" section's job; then categories, the two ways to
          order, and quality. */}
      <HomePrices />
      <ShopCollections />
      <HomeWays onStartDesign={onStartDesign} onRequestDesign={onRequestDesign} />
      <HomeQualitySection />
      {/* What a designer-made proof looks like, then the AI and portrait routes (owner msg 5178). */}
      <ProofPdfShowcase id="home-proof" />
      <HomeAiSection />
      <HomePortraitSection />
      <ShopFaq />
      <section className="shop-closing">
        <p className="shop-kicker">Start with a few words</p>
        <h2>Make something meaningful.</h2>
        <p>See the layout and price online. Save your free proof when you need more time.</p>
        <div className="shop-closing-choices">
          <DesignLink onStart={onStartDesign} className="shop-button-light" />
          <ContactLink channel="whatsapp" placement="page" className="shop-button shop-hero-choice-whatsapp shop-whatsapp-button">
            <WhatsAppIcon /> Design on WhatsApp
          </ContactLink>
        </div>
      </section>
      <MobileContactBar onDesign={onStartDesign} />
    </div>
  );
}

// Search-led H1s for the main landing pages (owner msg 5165); other pages keep their title.
const heroTitles: Record<string, string> = {
  'memorial-plaques': 'Personalised memorial plaques',
  'bench-plaques': 'Personalised bench plaques',
  'brass-plaques': 'Personalised brass plaques',
  'stainless-steel-plaques': 'Personalised stainless steel plaques',
  'garden-plaques': 'Personalised garden plaques',
  'pet-memorial-plaques': 'Personalised pet memorial plaques',
  'memorial-bench-plaques': 'Personalised memorial bench plaques',
  'tree-memorial-plaques': 'Memorial tree plaques',
};

// Exact product pages sit under a category in breadcrumbs (review 21 Oct).
export function productCategoryFor(product: ProductFamily): { slug: string; title: string } {
  const width = product.preset?.width || 0;
  const height = product.preset?.height || 0;
  const short = Math.max(1, Math.min(width, height));
  if (product.preset?.shape && product.preset.shape !== 'rect') return { slug: 'custom-plaques', title: 'Custom plaques' };
  if (short <= 100 && Math.max(width, height) / short >= 2) return { slug: 'bench-plaques', title: 'Bench plaques' };
  return product.materialCue === 'stainless'
    ? { slug: 'stainless-steel-plaques', title: 'Stainless steel plaques' }
    : { slug: 'brass-plaques', title: 'Brass plaques' };
}

// Catalogue cards show at about 175 px on phones and 282 px on desktops; the 320/480 px copies replace the 600 px
// photos and 1500 px feed drawings there (services/imageUrls.ts). Outside Vercel builds the markup is unchanged.
function cardImageSizes(item: { photo?: string; merchantOffer?: unknown; image: string }) {
  const srcSet = item.photo ? optimisedSrcSet(photo600(item.photo), 600, [320, 480])
    : item.merchantOffer ? optimisedSrcSet(item.image + merchantImageQuery, 1500, [320, 480]) : undefined;
  return srcSet ? { srcSet, sizes: '(max-width: 720px) 45vw, 282px' } : {};
}

type GalleryImage = { src: string; srcSet?: string; thumb?: string; thumbSrcSet?: string; alt: string; label: string };

// Catalogue pages show the photo first and the flat design view (the feed image) as a second
// image, so the Merchant Center image is still on the landing page.
function ProductGallery({ images, caption, className, sizes }: { images: GalleryImage[]; caption: string; className?: string; sizes?: string }) {
  const [active, setActive] = React.useState(0);
  const image = images[active] || images[0];
  return (
    <figure className={className}>
      <img src={image.src} srcSet={image.srcSet} sizes={image.srcSet ? sizes : undefined} alt={image.alt} width="1200" height="1200" fetchPriority="high" />
      {images.length > 1 && (
        <div className="shop-product-thumbs" role="group" aria-label="Product images">
          {images.map((item, index) => (
            <button type="button" key={item.src} aria-label={item.label} aria-pressed={index === active} onClick={() => setActive(index)}>
              <img src={item.thumb || item.src} srcSet={item.thumbSrcSet} sizes={item.thumbSrcSet ? '64px' : undefined} alt="" width="120" height="120" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export function ShopProduct({
  product,
  onLaunch,
  onRequestDesign,
  examples,
}: {
  product: ProductFamily;
  onLaunch?: () => void;
  onRequestDesign?: () => void;
  examples?: SeoLandingPage['examples'];
}) {
  const collection = collections.find((item) => item.slug === product.slug);
  // The FAQ schema in scripts/prerender-product-pages.mjs is built from this same list.
  const faqs = [...product.faqs, ...shopFaqs]
    .filter(
      (item, index, list) =>
        list.findIndex((other) => other.question === item.question) === index,
    )
    .slice(0, 6);
  // The category pages use the memorial page's phone-first layout (owner msgs 5876 and 5927, 24 Oct 2026).
  const landingConfig = categoryLandingFor(product, plaqueSubject(product.shortTitle), examples);
  if (landingConfig) {
    return <CategoryLandingPage config={landingConfig} product={product} faqs={faqs} picks={productPicks[product.slug]} onLaunch={onLaunch} onRequestDesign={onRequestDesign} />;
  }
  const heroImage = product.photo || collection?.image || materialProductImages[product.slug] || product.image;
  const example = product.merchantOffer ? exampleFor(product.slug) : undefined;
  const heroAlt = example ? `${product.title}, engraved with the example wording “${example.lines.slice(0, 3).join(' ')}”${example.portrait ? ' and a portrait' : ''}`
    : product.merchantOffer ? `${product.title}, shown with an example inscription` : product.title;
  const photoSmall = product.photo ? photo600(product.photo) : undefined;
  const heroImages: GalleryImage[] = product.photo
    ? [
        { src: product.photo, srcSet: `${photoSmall} 600w, ${product.photo} 1200w`, thumb: photoSmall, alt: heroAlt, label: 'Shown in place' },
        // The thumbnail keeps the feed image as its src; browsers pick the 160 px copy. Both carry the feed's ?v= so a
        // redrawn design (new example wording) is fetched fresh, not shown from an old cached copy.
        { src: product.image + merchantImageQuery, srcSet: optimisedSrcSet(product.image + merchantImageQuery, 1500, [480, 640, 750, 828, 1080]), thumbSrcSet: `${product.image.replace('/merchant/', '/merchant/thumbs/').replace(/\.jpg$/, '.webp')}${merchantImageQuery} 160w, ${product.image}${merchantImageQuery} 1500w`, alt: `${product.title}: flat design view`, label: 'Flat design view' },
      ]
    : product.merchantOffer
      // No photo the owner has seen (services/vettedPhotos.mjs, owner msg 6270): show the exact flat drawing.
      // On Vercel the main image comes in 480-1080 px copies (a phone takes ~750 px instead of the 1500 px drawing).
      ? [{ src: product.image + merchantImageQuery, srcSet: optimisedSrcSet(product.image + merchantImageQuery, 1500, [480, 640, 750, 828, 1080], `${product.image.replace('/merchant/', '/merchant/thumbs/').replace(/\.jpg$/, '.webp')}${merchantImageQuery} 160w, ${product.image}${merchantImageQuery} 1500w`), alt: heroAlt, label: 'Flat design view' }]
      : [{ src: heroImage, alt: heroAlt, label: product.title }];
  // No AI/illustration labels on product images (owner msg 5231).
  const heroCaption = product.merchantOffer
    ? 'Shown with an example inscription. Your wording replaces it.'
    : 'Finish and optional backing affect the final price.';
  const category = product.merchantOffer ? productCategoryFor(product) : null;
  const parentCategory = categoryParentFor(category ? category.slug : product.slug);
  return (
    <div className="shopfront" data-prerendered="true">
      <div className="shop-breadcrumb">
        <a href="/">Home</a>
        <span>/</span>
        {parentCategory && <><a href={`/${parentCategory.slug}`}>{parentCategory.title}</a><span>/</span></>}
        {category && <><a href={`/${category.slug}`}>{category.title}</a><span className="shop-crumb-last-sep">/</span></>}
        {/* Phones drop the plaque's own name here: it is the heading just below, and the trail fits on one line. */}
        <span className={category ? 'shop-crumb-current' : undefined}>{product.title}</span>
      </div>
      <section className="shop-product-hero">
        <ProductGallery images={heroImages} caption={heroCaption} sizes="(max-width: 720px) 92vw, 560px" />
        <div>
          <p className="shop-kicker">Free proof · UK delivery included</p>
          <h1 className={product.merchantOffer ? 'shop-product-title-long' : undefined}>{heroTitles[product.slug] || product.title}</h1>
          <p className="shop-product-note">
            {product.heroNote || collection?.note || "A plaque made for the words that matter."}
          </p>
          {/* Phones: the product photo stays near the top while the copy comes first. */}
          {/* Same sizes as the desktop figure, so React emits one image preload, not two. */}
          <ProductGallery className="shop-product-inline-image" images={heroImages} caption={heroCaption} sizes="(max-width: 720px) 92vw, 560px" />
          {/* Phones: price and the choices straight under the photo (owner msg 5231). */}
          <strong className="shop-product-price">
            <TrackedPrice value={displayedPriceValue(product.startingFrom)} product={product.slug}>{product.startingFrom}</TrackedPrice>
          </strong>
          <div className="shop-hero-choices">
            <DesignLink onStart={onLaunch}>Design online</DesignLink>
            <ContactLink channel="whatsapp" placement="hero" subject={plaqueSubject(product.shortTitle)} className="shop-button shop-hero-choice-whatsapp">
              <WhatsAppIcon /> Design on WhatsApp
            </ContactLink>
          </div>
          <p className="shop-hero-design-request">
            Prefer us to design it? <a href="/design-request" onClick={onRequestDesign ? event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onRequestDesign(); } } : undefined}>Have us design it – free proof</a>
          </p>
          <p className="shop-smallprint">
            Standard engraving, fixings and UK delivery included.
            Extras are shown before checkout.
          </p>
          <p className="shop-hero-note">
            Free online designer & proof · No account needed · Or <ContactLink channel="email" placement="hero">email us</ContactLink>
          </p>
          <p className="shop-product-description">{product.seoIntro || product.description}</p>
          {product.productionDays ? <aside className="shop-production-note"><strong>Estimated production: {product.productionDays} working days</strong><p>After proof approval and payment. Delivery time is additional; UK delivery is included.</p><a href="/how-it-works">Production and delivery details</a></aside> : <ProductionNote />}
          <ul className="shop-product-benefits">
            {product.bestFor.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>
      {product.merchantOffer ? <MerchantProductDetails slug={product.slug} /> : product.seoSections?.length === 0 ? null : <section className="shop-section shop-buying-guide">
        <div>
          <p className="shop-kicker">Size, wording and fitting</p>
          <h2>Choose the size and finish.</h2>
          <a className="shop-text-link" href="/materials">
            Explore the finishes ↗
          </a>
        </div>
        <div>
          {product.seoSections?.map((section) => (
            <article key={section.title}>
              <h3>{section.title}</h3>
              <p>{section.copy}</p>
            </article>
          ))}
        </div>
      </section>}
      {product.slug === 'brass-plaques' && <CatalogueSizeLinks kicker="Sizes and prices" title="Brass plaques by size." materials={['brushed-brass', 'polished-brass', 'orbital-brass-matt-lacquer', 'aged-brass']} />}
      {product.slug === 'stainless-steel-plaques' && <CatalogueSizeLinks kicker="Sizes and prices" title="Stainless steel plaques by size." materials={['brushed-stainless', 'polished-stainless']} />}
      {['bench-plaques', 'opening-plaques'].includes(product.slug) && <PlaqueWordingExamples slug={product.slug} />}
      {product.slug === 'bench-plaques' && <nav className="shop-section" aria-label="Bench plaque sizes and prices">
        <p className="shop-kicker">Compare bench plaques</p>
        <h2>A size and finish for your wording.</h2>
        <div className="shop-related">
          {['brushed-stainless-150x50-rect-plaque', 'brushed-brass-225x75-rect-plaque', 'polished-brass-bench-plaque-200x100'].map(slug => {
            const option = productFamilies.find(item => item.slug === slug);
            return option ? <a key={slug} href={`/${slug}`}>{option.title} · {option.startingFrom}</a> : null;
          })}
        </div>
      </nav>}
      {examples && examples.length > 0 && <LandingExamples examples={examples} kicker="Ideas from real-life settings" title={product.slug === 'tree-memorial-plaques' ? 'Memorial tree plaques in place.' : 'Garden and tree dedications in place.'} />}
      {productPicks[product.slug] && <ProductPicks {...productPicks[product.slug]} />}
      {product.slug === 'plaque-sizes' && <ShopBySize />}
      {product.slug === 'memorial-plaque-wording' && <WordingLibrary />}
      {!product.merchantOffer && !['bench-plaques', 'opening-plaques', 'tree-memorial-plaques'].includes(product.slug) && <ShopProcess />}
      {['garden-plaques', 'tree-memorial-plaques'].includes(product.slug) && <GardenAdvice />}
      <CustomAnything subject={plaqueSubject(product.shortTitle)} />
      {/* Catalogue pages: wording and fitting help, not the opening-plaque route (review 21 Oct). */}
      <CollectionLinks slug={product.merchantOffer ? 'catalogue' : product.slug} />
      <ShopFaq faqs={faqs} />
      <section className="shop-closing">
        <h2>Put your words in place.</h2>
        <p>Create your layout and see the price before you pay.</p>
        <div className="shop-closing-choices">
          <DesignLink onStart={onLaunch} className="shop-button-light" />
          <ContactLink channel="whatsapp" placement="page" subject={plaqueSubject(product.shortTitle)} className="shop-button shop-hero-choice-whatsapp shop-whatsapp-button">
            <WhatsAppIcon /> Design on WhatsApp
          </ContactLink>
        </div>
      </section>
      <MobileContactBar subject={plaqueSubject(product.shortTitle)} onDesign={onLaunch} />
    </div>
  );
}

export function ShopLanding({
  landing,
  onLaunch,
  onRequestDesign,
}: {
  landing: SeoLandingPage;
  onLaunch?: () => void;
  onRequestDesign?: () => void;
}) {
  // The tree page's from-price includes the oak board and ground stake (owner msg 6506).
  const related = landingDesignProduct(landing);
  return (
    <ShopProduct
      onLaunch={onLaunch}
      onRequestDesign={onRequestDesign}
      product={{
        ...related,
        slug: landing.slug,
        title: landing.title,
        shortTitle: landing.shortTitle,
        image: landing.image,
        seoIntro: landing.heroCopy,
        seoSections: landing.sections,
        bestFor: related.bestFor,
        faqs: landing.faqs,
        heroNote: landing.heroNote,
      }}
      examples={landing.examples}
    />
  );
}

// Each finish links to its A5 catalogue page, so the exact product pages are reachable.
const materialOfferKeys: Record<string, string> = {
  'Brushed brass': 'brushed-brass',
  'Polished brass': 'polished-brass',
  'Aged brass': 'aged-brass',
  'Orbital brass': 'orbital-brass-matt-lacquer',
  'Brushed stainless steel': 'brushed-stainless',
  'Mirror stainless': 'polished-stainless',
};

export function ShopMaterials() {
  return (
    <div className="shopfront" data-prerendered="true">
      <section className="shop-section">
        <p className="shop-kicker">Find your finish</p>
        <h1>Plaque materials: brass &amp; stainless steel</h1>
        <p className="shop-intro">
          Compare the colour and character of each finish. Start with brass or
          stainless steel, then choose a surface and optional backing in the
          designer.
        </p>
        <p className="shop-material-uses">
          Choosing for a particular place? See how to plan a{' '}
          <a href="/memorial-plaques">memorial plaque for a wall or grave</a>, plan a{' '}
          <a href="/garden-plaques">garden memorial plaque</a> or arrange a{' '}
          <a href="/opening-plaques">building opening inscription</a>.
        </p>
        <div className="shop-collections">
          {materialStories.map((material) => (
            <article className="shop-collection" key={material.title}>
              <div className="shop-collection-image">
                <img
                  src={material.sliderImage}
                  alt={`${material.title} texture sample`}
                  width="1280"
                  height="1600"
                  loading="lazy"
                />
              </div>
              <div className="shop-collection-title">
                <h3>{material.title}</h3>
              </div>
              <p>{material.copy}</p>
              {materialOfferKeys[material.title] && (() => {
                const offer = coreOfferFor(materialOfferKeys[material.title]);
                return offer ? <a className="shop-text-link" href={`/${offer.slug}`}>A5 {material.title.toLowerCase()} plaque · {coreOfferPrice(offer.slug)} ↗</a> : null;
              })()}
            </article>
          ))}
        </div>
        <nav className="shop-related" aria-label="Plaques by material">
          <a href="/brass-plaques">Brass plaque sizes and options ↗</a>
          <a href="/stainless-steel-plaques">Stainless steel plaque sizes and options ↗</a>
        </nav>
        <p className="shop-smallprint">Texture previews are illustrative. Your proof confirms wording, layout and selected options; colour and grain can look different on screen.</p>
      </section>
      <CustomAnything />
      <ShopFaq />
      <section className="shop-closing">
        <h2>See your words in metal.</h2>
        <p>Compare your options in a free online proof.</p>
        <DesignLink className="shop-button-light" />
      </section>
    </div>
  );
}

export function ShopHelp({ faq = false }: { faq?: boolean }) {
  return (
    <div className="shopfront" data-prerendered="true">
      <section className="shop-section">
        <p className="shop-kicker">
          From your first words to the finished plaque
        </p>
        <h1>
          {faq
            ? "Your questions, answered."
            : "Design, approve, then order."}
        </h1>
        <p className="shop-intro">
          Choose your plaque, add your exact wording and check the design before
          you order. Your online proof is free, with no account needed.
        </p>
        <DesignLink />
      </section>
      {!faq && <ShopProcess />}
      {!faq && <ProofPdfShowcase id="how-proof" heading="Prefer us to design it? You’ll get a proof like this.">
        <p>Send us your wording on WhatsApp or through our <a href="/design-request">design form</a>, and we send you a PDF proof: your plaque drawn to size with every measurement, the fixings and the finish, plus simple fitting steps.</p>
      </ProofPdfShowcase>}
      {!faq && <ShopTurnaround />}
      <CustomAnything />
      <ShopFaq faqs={faq ? helpFaqs : shopFaqs} />
    </div>
  );
}

export function ShopFooter() {
  return (
    <footer className="shop-footer">
      <div>
        <a href="/" className="shop-header-brand">
          Insta<span>Plaque</span>
        </a>
        <p>Personal words, made lasting.</p>
        <ContactLink channel="email" placement="footer">{businessContact.email}</ContactLink>
        <p><ContactLink channel="whatsapp" placement="footer">WhatsApp: {businessContact.whatsapp}</ContactLink></p>
        <p className="shop-footer-address">
          {businessContact.address}
          <br />
          {businessContact.madeIn}
        </p>
      </div>
      <nav aria-label="Browse plaques">
        <a href="/memorial-plaques">Memorial plaques</a>
        <a href="/bench-plaques">Bench plaques</a>
        <a href="/brass-plaques">Brass plaques</a>
        <a href="/stainless-steel-plaques">Stainless steel plaques</a>
        <a href="/garden-plaques">Garden plaques</a>
        <a href="/tree-memorial-plaques">Tree memorial plaques</a>
        <a href="/opening-plaques">Opening plaques</a>
        <a href="/custom-plaques">Custom plaques</a>
        <a href="/plaque-sizes">Every size and price</a>
        <a href="/memorial-plaque-wording">Memorial wording ideas</a>
        <a href="/portrait-plaques">Portrait plaques</a>
        <a href="/ai-plaque-design">AI design to plaque</a>
      </nav>
      <nav aria-label="Help and information">
        <a href="/about">About InstaPlaque</a>
        <a href="/materials">Materials</a>
        <a href="/how-it-works">How it works</a>
        <a href="/faq">Questions & answers</a>
        <a href="/contact">Contact</a>
        <a href="/terms">Terms</a>
        <a href="/privacy">Privacy</a>
        <a href="/cookies">Cookies</a>
        <a href="/returns-and-cancellations">Returns & cancellations</a>
      </nav>
    </footer>
  );
}
