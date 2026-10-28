import React from 'react';
import { merchantProducts, productFamilies, seoLandingPages, type ProductFamily, categoryParentFor, landingDesignProduct } from '../services/commerce';
import { merchantOffers } from '../services/merchantCatalogue.mjs';
import { ContactLink, MobileContactBar, WhatsAppIcon, plaqueSubject } from './ContactOptions';
import { TrackedPrice, displayedPriceValue } from './TrackedPrice';
import { HomeQualitySection, ProofPdfShowcase } from './FeatureSections';
import { offerSizeLabel } from './CatalogueDetails';
import { DesignLink, ProductPicks } from './Shopfront';
import { PriceTable, priceTableIncludes, priceTableIncludesOnStake } from './PriceTable';
import { PromoFilmFigure } from './PromoVideo';

// Category landing sections, phone first. The memorial plaques page was built from them first (owner msg 5876,
// 24 Oct 2026: "make memorial page amazing and then use as yardstick to measure against other pages"), then every
// other category page (msg 5927: "bring every other page up to that standard"); the content of each page is in
// CategoryPages.tsx. 93% of ad visitors were on phones, so the first screens give an in-place photo of the plaque
// the price is for, the price, both ways to order and photo routes; long guidance folds away. Shared blocks
// (quality, sample proof, FAQs) are the homepage's own.

/** The page a route leads to and its from-price: landing pages take their related product's price (the tree page's
 * with the oak board and ground stake, owner msg 6506). */
function startingPrice(slug: string) {
  const landing = seoLandingPages.find(item => item.slug === slug);
  const product = landing ? landingDesignProduct(landing) : productFamilies.find(item => item.slug === slug);
  return product ? { slug: product.slug, label: product.startingFrom } : null;
}

/** "from £95.50" everywhere, or the bare amount where the exact configuration is named (bare). Category
 * products carry "from …" and exact catalogue products a plain price, so normalise both. */
function Price({ slug, bare = false }: { slug: string; bare?: boolean }) {
  const price = startingPrice(slug);
  if (!price) return null;
  const amount = price.label.replace(/^from\s+/i, '');
  return <TrackedPrice value={displayedPriceValue(price.label)} product={price.slug}>{bare ? amount : `from ${amount}`}</TrackedPrice>;
}

type HeroImage = { src: string; srcSet: string; alt: string; caption?: React.ReactNode };

function HeroPhoto({ image, className, below = false }: { image: HeroImage; className: string; below?: boolean }) {
  // Phones show it inline under the headline, desktops beside the copy. Identical src, srcset and sizes,
  // so the browser downloads one file and React emits one preload. Where the promo film has the hero (owner msg
  // 6986), the photo comes straight after it instead (below), loaded as it nears the screen.
  return (
    <figure className={`cat-hero-photo ${className}`}>
      {below
        ? <img src={image.src} srcSet={image.srcSet} sizes="(max-width: 720px) 100vw, 760px" width="1600" height="1200" loading="lazy" decoding="async" alt={image.alt} />
        : <img src={image.src} srcSet={image.srcSet} sizes="(max-width: 720px) 100vw, 620px" width="1600" height="1200" fetchPriority="high" alt={image.alt} />}
      {image.caption && <figcaption>{image.caption}</figcaption>}
    </figure>
  );
}

export function CategoryHero({ product, title, note, image, film = false, price, priceNote, trust, onLaunch, onRequestDesign }: {
  product: ProductFamily;
  title: string;
  note: string;
  image: HeroImage;
  /** The promo film instead of the photo (owner msg 6986): beside the copy on computers, under the buttons on phones. */
  film?: boolean;
  /** A from-price other than the category's own (the custom page has no standard price; it shows its ovals'). */
  price?: { label: string; slug: string };
  priceNote: string;
  trust: string[];
  onLaunch?: () => void;
  onRequestDesign?: () => void;
}) {
  const shown = price || { label: product.startingFrom, slug: product.slug };
  return (
    <section className="cat-hero">
      <div className="cat-hero-copy">
        <p className="shop-kicker">Free proof · UK delivery included</p>
        <h1>{title}</h1>
        <p className="cat-hero-note">{note}</p>
        {/* The price before the photo, so a phone's first screen shows it above the cookie notice (owner msg 6436). */}
        <p className="cat-hero-buy">
          <strong className="shop-product-price">
            <TrackedPrice value={displayedPriceValue(shown.label)} product={shown.slug}>{shown.label}</TrackedPrice>
          </strong>
          <span>{priceNote}</span>
        </p>
        {!film && <HeroPhoto image={image} className="cat-hero-photo-inline" />}
        <div className="shop-hero-choices">
          <DesignLink onStart={onLaunch}>Design online</DesignLink>
          <ContactLink channel="whatsapp" placement="hero" subject={plaqueSubject(product.shortTitle)} className="shop-button shop-hero-choice-whatsapp">
            <WhatsAppIcon /> Design on WhatsApp
          </ContactLink>
        </div>
        {film && <PromoFilmFigure className="cat-hero-film-inline" />}
        <p className="shop-hero-design-request">
          Prefer us to design it? <a href="/design-request" onClick={onRequestDesign ? event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onRequestDesign(); } } : undefined}>Send us your words – free proof</a>
        </p>
        <ul className="shop-product-benefits cat-hero-trust">
          {trust.map(item => <li key={item}>{item}</li>)}
        </ul>
      </div>
      {film ? <PromoFilmFigure className="cat-hero-film-side" /> : <HeroPhoto image={image} className="cat-hero-photo-side" />}
    </section>
  );
}

/** The category's own photo, straight after a hero that has the film: the exact plaque, with its price and link. */
export function ShownPhoto({ image }: { image: HeroImage }) {
  return (
    <div className="cat-shown">
      <HeroPhoto image={image} className="cat-shown-photo" below />
    </div>
  );
}

export type PlaceRoute = { href: string; title: string; image: string; alt: string; priceSlug: string };

export function PlaceRoutes({ id, kicker, title, routes, more }: { id?: string; kicker: string; title: string; routes: PlaceRoute[]; more?: React.ReactNode }) {
  return (
    <nav className="shop-section cat-routes" id={id} aria-labelledby="cat-routes-heading">
      <p className="shop-kicker">{kicker}</p>
      <h2 id="cat-routes-heading">{title}</h2>
      <div className="cat-routes-grid">
        {routes.map(route => (
          <a className="cat-route" href={route.href} key={route.title}>
            <img src={route.image} alt={route.alt} width="600" height="450" loading="lazy" decoding="async" />
            <span><strong>{route.title}</strong><small><Price slug={route.priceSlug} /></small></span>
          </a>
        ))}
      </div>
      {more && <p className="cat-routes-more">{more}</p>}
    </nav>
  );
}

export type SizeStep = { slug: string; label: string; widthMm: number; heightMm: number; fits: string; shape?: 'oval' | 'circle' };

/** Four sizes, each in stainless steel, brass and aged brass (owner msg 6436: brass prices were only in the designer),
 * every price linking to that exact plaque; on the tree page, on the oak board and ground stake (owner msg 6506). */
export function SizeLadder({ id, kicker, title, intro, sizes, mount, note, more }: { id?: string; kicker: string; title: string; intro: string; sizes: SizeStep[]; mount?: 'stake'; note?: React.ReactNode; more?: React.ReactNode }) {
  return (
    <section className="shop-section cat-sizes" id={id} aria-labelledby="cat-sizes-heading">
      <p className="shop-kicker">{kicker}</p>
      <h2 id="cat-sizes-heading">{title}</h2>
      <p className="cat-section-intro">{intro}</p>
      <PriceTable sizes={sizes} mount={mount} caption={`${title} Prices by size and metal${mount === 'stake' ? ', on an oak board and ground stake' : ''}.`} />
      <p className="shop-smallprint">{mount === 'stake' ? priceTableIncludesOnStake : priceTableIncludes}{note && <> {note}</>}</p>
      {more}
    </section>
  );
}

type Offer = (typeof merchantOffers)[number];
const productPrice = (slug: string) => merchantProducts.find(item => item.slug === slug)?.startingFrom || '';

/** Every catalogue size for the given offers, grouped by finish and folded away: the category page stays short and
 * still links every exact product page (the brass, stainless and bench categories are their parents). */
export function SizeLinksFold({ title, offers }: { title: string; offers: Offer[] }) {
  const groups = new Map<string, Offer[]>();
  for (const offer of [...offers].sort((a, b) => a.price - b.price)) {
    const label = `${offer.label}${offer.preset.wood ? ` on ${offer.preset.woodTone === 'dark' ? 'dark wood' : 'light oak'}` : ''}`;
    groups.set(label, [...(groups.get(label) || []), offer]);
  }
  return (
    <details className="cat-size-links">
      <summary>{title}<span aria-hidden="true">+</span></summary>
      <div>
        {[...groups].map(([label, items]) => (
          <div key={label}>
            <h3>{label}</h3>
            <ul>
              {items.map(offer => <li key={offer.slug}><a href={`/${offer.slug}`}>{offerSizeLabel(offer)}</a> <span>{productPrice(offer.slug)}</span></li>)}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}

export type ExampleItem = { title: string; copy: string; image: string; alt: string };

/** Photos of a plaque type in place, four or five across on computers and a sideways row on phones. */
export function ExamplesRow({ id, kicker, title, intro, items }: { id?: string; kicker: string; title: string; intro?: React.ReactNode; items: ExampleItem[] }) {
  return (
    <section className="shop-section cat-examples" id={id} aria-labelledby="cat-examples-heading">
      <p className="shop-kicker">{kicker}</p>
      <h2 id="cat-examples-heading">{title}</h2>
      {intro && <p className="cat-section-intro">{intro}</p>}
      <div className="cat-scroll-row cat-examples-row">
        {items.map(item => (
          <figure key={item.image}>
            <img src={item.image} alt={item.alt} width="900" height="600" loading="lazy" decoding="async" />
            <figcaption><strong>{item.title}</strong> {item.copy}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/** The FAQs and the longer buying guide, folded into one list (owner msg 5906: a shorter page). The FAQs come
 * first and are the same list the prerendered FAQPage schema is built from; the guide topics follow. */
export function QuestionsAndGuide({ id, guideId, intro, faqs, guide, subject, children }: {
  id?: string;
  guideId?: string;
  intro?: string;
  faqs: { question: string; answer: string }[];
  guide: { title: string; copy: string }[];
  subject: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="shop-section shop-faq cat-questions" id={id} aria-labelledby="cat-questions-heading">
      <div>
        <p className="shop-kicker">Help before you order</p>
        <h2 id="cat-questions-heading">Your questions, answered.</h2>
        {intro && <p className="cat-questions-intro">{intro}</p>}
        {children}
        <ContactLink channel="whatsapp" placement="page" subject={subject} className="shop-text-link">
          Ask us on WhatsApp ↗
        </ContactLink>
      </div>
      <div>
        {faqs.map(faq => (
          <details key={faq.question}>
            <summary>{faq.question}<span aria-hidden="true">+</span></summary>
            <p>{faq.answer}</p>
          </details>
        ))}
        {guide.map((section, index) => (
          <details key={section.title} id={index === 0 ? guideId : undefined}>
            <summary>{section.title}<span aria-hidden="true">+</span></summary>
            <p>{section.copy}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/** How to order in three steps, with both ways to start: a phone-length version of the homepage's two cards. */
export function OrderSteps({ id, kicker, title, steps, subject, onLaunch, onRequestDesign }: {
  id?: string;
  kicker: string;
  title: string;
  steps: [string, string][];
  subject: string;
  onLaunch?: () => void;
  onRequestDesign?: () => void;
}) {
  return (
    <section className="shop-section cat-steps" id={id} aria-labelledby="cat-steps-heading">
      <p className="shop-kicker">{kicker}</p>
      <h2 id="cat-steps-heading">{title}</h2>
      <ol className="cat-steps-list">
        {steps.map(([heading, copy]) => <li key={heading}><strong>{heading}</strong><span>{copy}</span></li>)}
      </ol>
      <div className="shop-hero-choices">
        <DesignLink onStart={onLaunch}>Design online</DesignLink>
        <ContactLink channel="whatsapp" placement="page" subject={subject} className="shop-button shop-hero-choice-whatsapp">
          <WhatsAppIcon /> Design on WhatsApp
        </ContactLink>
      </div>
      {/* "Make it clear we can make whatever you want" (owner msg 5736), once on the page. */}
      <p className="cat-steps-more">
        <strong>Can’t see exactly what you need? Tell us what you want. We’ll make it.</strong>{' '}
        Any size, shape or wording, with a free proof, usually within 3 working hours.{' '}
        <a href="/design-request" onClick={onRequestDesign ? event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onRequestDesign(); } } : undefined}>Use the design form ↗</a>
      </p>
    </section>
  );
}

export type PortraitExample = { src: string; alt: string; caption: string };

export function PortraitStrip({ kicker, title, intro, portraits, link }: { kicker: string; title: string; intro: string; portraits: PortraitExample[]; link: { href: string; label: string } }) {
  return (
    <section className="shop-section cat-portraits" aria-labelledby="cat-portraits-heading">
      <p className="shop-kicker">{kicker}</p>
      <h2 id="cat-portraits-heading">{title}</h2>
      <p className="cat-section-intro">{intro}</p>
      <div className="cat-scroll-row cat-portraits-row">
        {portraits.map(card => (
          <figure key={card.src}>
            <img src={card.src} alt={card.alt} width="600" height="600" loading="lazy" decoding="async" />
            <figcaption>{card.caption}</figcaption>
          </figure>
        ))}
      </div>
      <a className="shop-text-link" href={link.href}>{link.label} ↗</a>
    </section>
  );
}

export type Inscription = { title: string; lines: string[] };

export function WordingIdeas({ id, kicker, title, intro, inscriptions, link }: { id?: string; kicker: string; title: string; intro: string; inscriptions: Inscription[]; link: { href: string; label: string } }) {
  return (
    <section className="shop-section cat-wording" id={id} aria-labelledby="cat-wording-heading">
      <p className="shop-kicker">{kicker}</p>
      <h2 id="cat-wording-heading">{title}</h2>
      <p className="cat-section-intro">{intro}</p>
      <div className="cat-scroll-row cat-wording-row">
        {inscriptions.map(example => (
          <article key={example.title}>
            <h3>{example.title}</h3>
            <blockquote>{example.lines.map((line, index) => <React.Fragment key={index}>{index > 0 && <br />}{line}</React.Fragment>)}</blockquote>
          </article>
        ))}
      </div>
      <a className="shop-text-link" href={link.href}>{link.label} ↗</a>
    </section>
  );
}

export type LandingConfig = {
  /** Anchor prefix: `${prefix}-places`, -picks, -sizes, -materials, -wording, -questions, -proof (other pages link to
   * some of them, e.g. /memorial-plaques#memorial-wording). */
  prefix: string;
  title: string;
  note: string;
  /** Photo files `${base}-{800,1200,1600}.webp`, 4:3. */
  hero: { base: string; alt: string; caption: React.ReactNode };
  price?: { label: string; slug: string };
  priceNote: string;
  trust?: string[];
  routes?: { kicker: string; title: string; routes: PlaceRoute[]; more?: React.ReactNode };
  examples?: { kicker: string; title: string; intro?: React.ReactNode; items: ExampleItem[] };
  /** mount 'stake': every price and drawing includes the oak board and ground stake (the tree page). */
  sizes: { kicker?: string; title: string; intro: string; sizes: SizeStep[]; mount?: 'stake'; note?: React.ReactNode; more?: React.ReactNode };
  steps?: [string, string][];
  portraits?: boolean;
  proofCopy?: string;
  wording: { kicker?: string; title: string; intro: string; inscriptions: Inscription[]; link?: { href: string; label: string } };
  guide?: { title: string; copy: string }[];
  questionsIntro?: string;
  related?: React.ReactNode;
};

const defaultTrust = ['Made in the UK', 'Infilled by hand', 'Free proof before you pay', 'No account needed'];
const defaultSteps: [string, string][] = [
  ['Add your words', 'Design it online, or send us the wording on WhatsApp and we’ll lay it out for you.'],
  ['Check your free proof', 'Download the proof PDF to share with family, and change anything until it’s right.'],
  ['Approve, then pay', 'We etch it into solid metal, infill it by hand and deliver it free in the UK.'],
];
const memorialImages = '/site-images/memorial';
// Four portrait plaques with portraits drawn by Portraits in Metal's own process (owner msgs 5816, 5830), photographed in
// a setting that fits each one's story (owner msgs 5992, 6056): two close-ups on ground stakes, one on a wall and one on
// our workshop bench, not all on stakes (owner msg 6085).
const portraitCards: PortraitExample[] = [
  { src: `${memorialImages}/portrait-george-v3.webp`, alt: 'Close-up of a brass memorial plaque with an engraved portrait of George Hartley, on an oak board and ground stake under a young oak by an allotment gate', caption: 'George · brass, under the oak he planted' },
  { src: `${memorialImages}/portrait-bramble-v3.webp`, alt: 'Brass pet memorial plaque with an engraved portrait of Bramble the springer spaniel on an oak board, on our workshop bench after its final polish', caption: 'Bramble · on our workshop bench' },
  { src: `${memorialImages}/portrait-daniel-v2.webp`, alt: 'Brass memorial plaque with an engraved portrait of Daniel Price on an oak board, fixed to the painted timber wall of a sailing club boathouse', caption: 'Daniel · on the boathouse wall' },
  { src: `${memorialImages}/portrait-ron-pat-v3.webp`, alt: 'Close-up of a stainless steel memorial plaque with an engraved portrait of Ron and Pat Coleman, on an oak board and ground stake under their apple tree', caption: 'Ron & Pat · under their apple tree' },
];

/** One category page: hero, optional photo routes and examples, picks, sizes, how it works, optional portraits,
 * quality, sample proof, wording ideas, questions with the folded guide, and the closing buttons. */
export function CategoryLandingPage({ config, product, faqs, picks, onLaunch, onRequestDesign }: {
  config: LandingConfig;
  product: ProductFamily;
  faqs: { question: string; answer: string }[];
  picks?: { kicker: string; title: string; intro: string; slugs: string[] };
  onLaunch?: () => void;
  onRequestDesign?: () => void;
}) {
  const subject = plaqueSubject(product.shortTitle);
  const parent = categoryParentFor(product.slug);
  const id = (name: string) => `${config.prefix}-${name}`;
  const { hero, routes, examples, sizes, wording } = config;
  // The film says "Made in 5 working days*", so it leads every category page except the tree page, where every plaque
  // is on an oak board and stake (10–15 working days); that page keeps its photo at the top.
  const film = sizes.mount !== 'stake';
  const heroImage: HeroImage = {
    src: `${hero.base}-1200.webp`,
    srcSet: `${hero.base}-800.webp 800w, ${hero.base}-1200.webp 1200w, ${hero.base}-1600.webp 1600w`,
    alt: hero.alt,
    caption: hero.caption,
  };
  return (
    <div className="shopfront cat-page" data-prerendered="true">
      <div className="shop-breadcrumb">
        <a href="/">Home</a>
        <span>/</span>
        {parent && <><a href={`/${parent.slug}`}>{parent.title}</a><span>/</span></>}
        <span>{product.title}</span>
      </div>
      <CategoryHero
        product={product}
        title={config.title}
        note={config.note}
        image={heroImage}
        film={film}
        price={config.price}
        priceNote={config.priceNote}
        trust={config.trust || defaultTrust}
        onLaunch={onLaunch}
        onRequestDesign={onRequestDesign}
      />
      {film && <ShownPhoto image={heroImage} />}
      {routes && <PlaceRoutes id={id('places')} kicker={routes.kicker} title={routes.title} routes={routes.routes} more={routes.more} />}
      {examples && <ExamplesRow id={id('examples')} kicker={examples.kicker} title={examples.title} intro={examples.intro} items={examples.items} />}
      {picks && <ProductPicks {...picks} id={id('picks')} className="cat-picks" />}
      <SizeLadder id={id('sizes')} kicker={sizes.kicker || 'Sizes and prices'} title={sizes.title} intro={sizes.intro} sizes={sizes.sizes} mount={sizes.mount} note={sizes.note} more={sizes.more} />
      <OrderSteps
        id="how-it-works"
        kicker="How it works"
        title="Your words. Your approval."
        subject={subject}
        steps={config.steps || defaultSteps}
        onLaunch={onLaunch}
        onRequestDesign={onRequestDesign}
      />
      {config.portraits && <PortraitStrip
        kicker="Add their portrait"
        title="A favourite face, beside their name."
        intro="Send us a photo of a person or a pet. Our Portraits in Metal studio draws it for engraving, with a free proof first."
        portraits={portraitCards}
        link={{ href: '/portrait-plaques', label: 'See portrait plaques' }}
      />}
      <HomeQualitySection compact />
      <ProofPdfShowcase id={id('proof')} heading="Check every word before you pay." compact>
        <p>{config.proofCopy || 'Before anything is made, you get a PDF proof with every measurement, the finish and the fixings. Share it with family and agree it together.'}</p>
      </ProofPdfShowcase>
      <WordingIdeas
        id={id('wording')}
        kicker={wording.kicker || 'Finding the words'}
        title={wording.title}
        intro={wording.intro}
        inscriptions={wording.inscriptions}
        link={wording.link || { href: '/memorial-plaque-wording', label: 'See over 40 more wording ideas' }}
      />
      <QuestionsAndGuide id={id('questions')} guideId={id('materials')} intro={config.questionsIntro ?? product.seoIntro} faqs={faqs} guide={config.guide || product.seoSections || []} subject={subject}>
        {config.related}
      </QuestionsAndGuide>
      <section className="shop-closing">
        <h2>Put your words in place.</h2>
        <p>Create your layout and see the price before you pay, or send us your words and we’ll design it for you.</p>
        <div className="shop-closing-choices">
          <DesignLink onStart={onLaunch} className="shop-button-light" />
          <ContactLink channel="whatsapp" placement="page" subject={subject} className="shop-button shop-hero-choice-whatsapp shop-whatsapp-button">
            <WhatsAppIcon /> Design on WhatsApp
          </ContactLink>
        </div>
      </section>
      <MobileContactBar subject={subject} onDesign={onLaunch} />
    </div>
  );
}
