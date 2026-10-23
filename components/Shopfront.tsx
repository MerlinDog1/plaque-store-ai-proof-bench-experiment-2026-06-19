import React from "react";
import { MemorialSizes, MemorialWording, MemorialMaterialLinks } from './MemorialGuide';
import { GardenAdvice, CollectionLinks, PlaqueWordingExamples, ShopTurnaround, ProductionNote } from './ShopGuides';
import { businessContact, productionTiming } from '../services/shopInformation';
import { ContactLink, MobileContactBar, WhatsAppIcon, plaqueSubject } from './ContactOptions';
import { HomeAiSection, HomePortraitSection, ProofPdfShowcase } from './FeatureSections';
import { TrackedPrice, displayedPriceValue } from './TrackedPrice';
import { MerchantProductDetails, CatalogueSizeLinks, coreOfferFor, coreOfferPrice } from './CatalogueDetails';
import { merchantOffers } from '../services/merchantCatalogue.mjs';
import { WordingLibrary } from './WordingGuide';
import {
  productFamilies,
  ProductFamily,
  materialStories,
  SeoLandingPage,
  seoLandingPages,
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

function DesignLink({
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

export function ShopCollections() {
  return (
    <section className="shop-section" id="products">
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
export function ProductPicks({ slugs, kicker, title, intro }: { slugs: string[]; kicker: string; title: string; intro?: string }) {
  const items = slugs.map(slug => productFamilies.find(item => item.slug === slug)).filter((item): item is ProductFamily => Boolean(item));
  if (!items.length) return null;
  return (
    <nav className="shop-section shop-product-picks" aria-label={title}>
      <p className="shop-kicker">{kicker}</p>
      <h2>{title}</h2>
      {intro && <p>{intro}</p>}
      <ul>
        {items.map(item => (
          <li key={item.slug}>
            <a href={`/${item.slug}`}>
              <img src={item.photo ? item.photo.replace(/\.webp$/, '-600.webp') : item.image} alt={`${item.title}, shown with example wording`} width="600" height="600" loading="lazy" />
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
                    <img src={item.photo ? item.photo.replace(/\.webp$/, '-600.webp') : item.image} alt={`${item.title}, shown with example wording`} width="600" height="600" loading="lazy" />
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

// Picks for the garden, tree, memorial and bench pages: real catalogue pages with their photos.
const productPicks: Record<string, { kicker: string; title: string; intro: string; slugs: string[] }> = {
  'garden-plaques': { kicker: 'Garden and tree plaques', title: 'Popular garden plaques.', intro: 'Each plaque is shown with its own example wording. Open one to see its sizes, finishes and a sample proof.',
    slugs: ['brushed-stainless-200x150-rect-plaque', 'polished-brass-210x148-rect-plaque', 'polished-brass-148x210-rect-plaque', 'orbital-brass-matt-lacquer-200x200-circle-plaque', 'brushed-stainless-148x210-rect-plaque', 'aged-brass-250x150-oval-plaque', 'brushed-brass-200x150-rect-plaque', 'polished-stainless-210x148-rect-plaque'] },
  'tree-memorial-plaques': { kicker: 'Tree memorial plaques', title: 'Plaques for a memorial tree.', intro: 'Metal plaques without wood backing are made for outdoors. Each is shown with its own example wording.',
    slugs: ['brushed-stainless-200x150-rect-plaque', 'polished-brass-210x148-rect-plaque', 'polished-brass-148x210-rect-plaque', 'orbital-brass-matt-lacquer-200x200-circle-plaque', 'aged-brass-297x210-rect-plaque', 'orbital-brass-matt-lacquer-210x297-rect-plaque', 'brushed-stainless-148x210-rect-plaque', 'aged-brass-250x150-oval-plaque'] },
  'memorial-plaques': { kicker: 'Memorial plaques', title: 'Memorial plaques, shown with example wording.', intro: 'From a short bench dedication to a family memorial with an engraved portrait. Open any plaque for its sizes, finishes and a sample proof.',
    slugs: ['aged-brass-210x148-rect-plaque', 'polished-brass-250x150-oval-plaque', 'polished-stainless-148x210-rect-plaque', 'polished-brass-297x210-rect-plaque', 'aged-brass-148x210-rect-plaque', 'brushed-stainless-300x200-rect-plaque', 'polished-brass-148x210-rect-light-wood-plaque', 'brushed-stainless-150x50-rect-plaque'] },
  'brass-plaques': { kicker: 'Brass plaques', title: 'Brass plaques, shown in place.', intro: 'Brushed, polished, orbital and aged brass, each shown with its own example wording. Open any plaque for its sizes, backing options and a sample proof.',
    slugs: ['polished-brass-300x200-rect-plaque', 'aged-brass-210x148-rect-plaque', 'brushed-brass-297x210-rect-dark-wood-plaque', 'orbital-brass-matt-lacquer-400x300-rect-plaque', 'polished-brass-210x148-rect-plaque', 'aged-brass-400x300-rect-plaque', 'brushed-brass-210x297-rect-light-wood-plaque', 'polished-brass-250x150-oval-plaque'] },
  'stainless-steel-plaques': { kicker: 'Stainless steel plaques', title: 'Stainless steel plaques, shown in place.', intro: 'Brushed and polished stainless steel, each shown with its own example wording.',
    slugs: ['brushed-stainless-400x300-rect-plaque', 'polished-stainless-210x148-rect-plaque', 'brushed-stainless-297x210-rect-dark-wood-plaque', 'polished-stainless-148x210-rect-light-wood-plaque', 'brushed-stainless-200x150-rect-plaque', 'polished-stainless-250x150-oval-plaque', 'brushed-stainless-300x200-rect-plaque', 'polished-stainless-200x50-rect-plaque'] },
  'custom-plaques': { kicker: 'Shapes and sizes', title: 'Ovals, circles and larger plaques.', intro: 'Standard ovals, circles and large wall plaques with their own example wording. For anything else, send us the size and shape on WhatsApp.',
    slugs: ['aged-brass-250x150-oval-plaque', 'polished-brass-200x200-circle-plaque', 'orbital-brass-matt-lacquer-400x300-rect-plaque', 'brushed-stainless-200x200-circle-plaque', 'polished-stainless-250x150-oval-plaque', 'aged-brass-400x300-rect-dark-wood-plaque', 'orbital-brass-matt-lacquer-200x200-circle-plaque', 'brushed-brass-250x150-oval-plaque'] },
  'bench-plaques': { kicker: 'Bench plaques', title: 'Bench plaques, shown on a bench.', intro: 'Each bench plaque is shown on a real-looking bench rail with its own example dedication.',
    slugs: ['brushed-stainless-150x50-rect-plaque', 'brushed-brass-225x75-rect-plaque', 'polished-stainless-200x50-rect-plaque', 'aged-brass-225x75-rect-plaque', 'polished-brass-150x75-rect-plaque', 'orbital-brass-matt-lacquer-225x65-rect-plaque', 'brushed-brass-150x65-rect-plaque', 'polished-brass-bench-plaque-200x100'] },
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
              <span><strong>{title}</strong><small>{product.startingFrom}</small></span>
            </a>
          );
        })}
      </div>
      <p className="shop-hero-routes-more">
        Something else? <ContactLink channel="whatsapp" placement="hero" subject="a plaque">WhatsApp us your idea</ContactLink>
      </p>
    </nav>
  );
}

export function ShopHome({ onStartDesign, onRequestDesign }: { onStartDesign?: () => void; onRequestDesign?: () => void }) {
  const benchProduct = productFamilies.find(product => product.slug === 'bench-plaques')!;
  return (
    <div className="shopfront" data-prerendered="true">
      <section className="shop-hero">
        <div className="shop-hero-copy">
          {/* Say what we sell first; the slogan becomes the tagline (owner msg 5132). */}
          <p className="shop-kicker">Free proof · UK delivery included</p>
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
      <div className="shop-reassurance">
        <span>
          01 <strong>Made to your wording</strong>
        </span>
        <span>
          02 <strong>Approve before production</strong>
        </span>
        <span>
          03 <strong>UK delivery included</strong>
        </span>
      </div>
      <ShopProcess />
      <ShopCollections />
      <section className="shop-section shop-design-service" aria-labelledby="design-service-heading">
        <div>
          <p className="shop-kicker">A little help, from real people</p>
          <h2 id="design-service-heading">Want us to take care of the design?</h2>
          {/* WhatsApp first, the brief form second, to match the hero (owner msg 5174). */}
          <p>Send us your wording on WhatsApp, or use our design form. We’ll design it for you and send your proof within 3 working hours, for you to review before you pay.</p>
          <div className="shop-design-service-actions">
            <ContactLink channel="whatsapp" placement="page" className="shop-button shop-hero-choice-whatsapp shop-whatsapp-button">
              <WhatsAppIcon /> Design on WhatsApp
            </ContactLink>
            <a href="/design-request" className="shop-text-link" onClick={onRequestDesign ? event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onRequestDesign(); } } : undefined}>Use the design form ↗</a>
          </div>
          <p className="shop-smallprint">No layout tools to learn. Review your proof, request changes, then approve and pay.</p>
        </div>
        <ol className="design-service-steps">
          <li><span>01</span><div><strong>Tell us your idea</strong><p>Your wording, a photo of where it’s going, or a design you made in ChatGPT.</p></div></li>
          <li><span>02</span><div><strong>We design it</strong><p>Your proof within 3 working hours, by WhatsApp or email.</p></div></li>
          <li><span>03</span><div><strong>Approve before you pay</strong><p>Happy with the proof? Follow your payment link.</p></div></li>
        </ol>
      </section>
      {/* What a designer-made proof looks like, then the AI and portrait routes (owner msg 5178). */}
      <ProofPdfShowcase id="home-proof" />
      <HomeAiSection />
      <HomePortraitSection />

      <section className="shop-section shop-materials">
        <div>
          <p className="shop-kicker">Choose your material</p>
          <h2>
            Brass or stainless steel?
          </h2>
          <p>
            Choose the warmth of brass or the clean silver tone of stainless
            steel. Explore brushed, polished and aged finishes, with optional
            wood backing for suitable plaques.
          </p>
          <a className="shop-text-link" href="/materials">
            Compare materials & finishes ↗
          </a>
        </div>
        <div className="shop-material-images">
          <figure>
            <img
              src="/site-images/home-gallery-aged-brass-wood.webp"
              alt="Aged brass plaque design with dark wood backing"
              width="1200"
              height="1200"
              loading="lazy"
            />
            <figcaption>Brass · warm & traditional</figcaption>
          </figure>
          <figure>
            <img
              src="/site-images/home-gallery-oval-steel.webp"
              alt="Oval stainless steel plaque design"
              width="1200"
              height="1200"
              loading="lazy"
            />
            <figcaption>Stainless steel · clean & contemporary</figcaption>
          </figure>
        </div>
      </section>
      <CustomAnything />
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
  const isMemorial = product.slug === 'memorial-plaques';
  const faqs = [...product.faqs, ...shopFaqs]
    .filter(
      (item, index, list) =>
        list.findIndex((other) => other.question === item.question) === index,
    )
    .slice(0, 6);
  const heroImage = product.photo || collection?.image || materialProductImages[product.slug] || product.image;
  const heroAlt = isMemorial ? 'Aged brass memorial plaque with a family inscription on dark wood backing'
    : product.merchantOffer ? `${product.title}, shown with an example inscription` : product.title;
  const photoSmall = product.photo?.replace(/\.webp$/, '-600.webp');
  const heroImages: GalleryImage[] = product.photo
    ? [
        { src: product.photo, srcSet: `${photoSmall} 600w, ${product.photo} 1200w`, thumb: photoSmall, alt: heroAlt, label: 'Shown in place' },
        // The thumbnail keeps the feed image as its src; browsers pick the 160 px copy.
        { src: product.image, thumbSrcSet: `${product.image.replace('/merchant/', '/merchant/thumbs/').replace(/\.jpg$/, '.webp')} 160w, ${product.image} 1500w`, alt: `${product.title}: flat design view`, label: 'Flat design view' },
      ]
    : [{ src: heroImage, alt: heroAlt, label: product.title }];
  // No AI/illustration labels on product images (owner msg 5231). The memorial photo shows a
  // dearer configuration than its from-price, so say what is shown (review 21 Oct).
  const agedA5 = productFamilies.find(item => item.slug === 'aged-brass-210x148-rect-dark-wood-plaque');
  const steelA5 = productFamilies.find(item => item.slug === 'a5-brushed-steel-personalised-plaque');
  const heroCaption = product.merchantOffer
    ? 'Shown with an example inscription. Your wording replaces it.'
    : isMemorial && agedA5 && steelA5
      ? `Shown: aged brass on dark wood, A5 ${agedA5.startingFrom}. Brushed stainless steel from ${steelA5.startingFrom}.`
      : 'Finish and optional backing affect the final price.';
  const category = product.merchantOffer ? productCategoryFor(product) : null;
  return (
    <div className="shopfront" data-prerendered="true">
      <div className="shop-breadcrumb">
        <a href="/">Home</a>
        <span>/</span>
        {category && <><a href={`/${category.slug}`}>{category.title}</a><span>/</span></>}
        <span>{product.title}</span>
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
            {isMemorial && <>Starting price for A5 stainless steel without wood backing. </>}
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
      {isMemorial && <>
        <nav className="shop-section memorial-jump-links" aria-label="Memorial plaque buying guide">
          <a href="#memorial-sizes">Sizes & prices</a>
          <a href="#memorial-materials">Materials & fitting</a>
          <a href="#memorial-wording">Wording examples</a>
          <a href="#memorial-questions">Questions & answers</a>
        </nav>
        <MemorialSizes />
      </>}
      {product.merchantOffer ? <MerchantProductDetails slug={product.slug} /> : product.seoSections?.length === 0 ? null : <section className="shop-section shop-buying-guide" id={isMemorial ? 'memorial-materials' : undefined}>
        <div>
          <p className="shop-kicker">Size, wording and fitting</p>
          <h2>{isMemorial ? 'Choose the metal and the setting.' : 'Choose the size and finish.'}</h2>
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
          {isMemorial && <MemorialMaterialLinks />}
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
      {isMemorial && <MemorialWording />}
      {examples && examples.length > 0 && <LandingExamples examples={examples} kicker="Ideas from real-life settings" title={product.slug === 'tree-memorial-plaques' ? 'Memorial tree plaques in place.' : 'Garden and tree dedications in place.'} />}
      {productPicks[product.slug] && <ProductPicks {...productPicks[product.slug]} />}
      {product.slug === 'plaque-sizes' && <ShopBySize />}
      {product.slug === 'memorial-plaque-wording' && <WordingLibrary />}
      {!product.merchantOffer && !['bench-plaques', 'opening-plaques', 'memorial-plaques', 'tree-memorial-plaques'].includes(product.slug) && <ShopProcess />}
      {['garden-plaques', 'tree-memorial-plaques'].includes(product.slug) && <GardenAdvice />}
      <CustomAnything subject={plaqueSubject(product.shortTitle)} />
      {/* Catalogue pages: wording and fitting help, not the opening-plaque route (review 21 Oct). */}
      <CollectionLinks slug={product.merchantOffer ? 'catalogue' : product.slug} />
      <div id={isMemorial ? 'memorial-questions' : undefined}><ShopFaq faqs={faqs} /></div>
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
  const related =
    productFamilies.find(
      (product) => product.slug === landing.relatedProductSlug,
    ) || productFamilies[0];
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
