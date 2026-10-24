import React from 'react';
import { productFamilies, seoLandingPages, type ProductFamily } from '../services/commerce';
import { ContactLink, MobileContactBar, WhatsAppIcon, plaqueSubject } from './ContactOptions';
import { TrackedPrice, displayedPriceValue } from './TrackedPrice';
import { HomeQualitySection, ProofPdfShowcase } from './FeatureSections';
import { MemorialMaterialLinks, memorialInscriptions } from './MemorialGuide';
import { DesignLink, ProductPicks, ShopFaq } from './Shopfront';

// Category landing sections, phone first. The memorial plaques page is built from them (owner msg 5876,
// 24 Oct 2026: "make memorial page amazing and then use as yardstick to measure against other pages").
// 93% of ad visitors were on phones, so the first screens give an in-place photo, the price, both ways to
// order and photo routes; long guidance folds away. Shared blocks (quality, sample proof, FAQs) are the
// homepage's own.

/** The page a route leads to and its from-price: landing pages take their related product's price. */
function startingPrice(slug: string) {
  const landing = seoLandingPages.find(item => item.slug === slug);
  const product = productFamilies.find(item => item.slug === (landing?.relatedProductSlug || slug));
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

function HeroPhoto({ image, className }: { image: HeroImage; className: string }) {
  // Phones show it inline under the headline, desktops beside the copy. Identical src, srcset and sizes,
  // so the browser downloads one file and React emits one preload.
  return (
    <figure className={`cat-hero-photo ${className}`}>
      <img src={image.src} srcSet={image.srcSet} sizes="(max-width: 720px) 100vw, 620px" width="1600" height="1200" fetchPriority="high" alt={image.alt} />
      {image.caption && <figcaption>{image.caption}</figcaption>}
    </figure>
  );
}

export function CategoryHero({ product, title, note, image, priceNote, trust, onLaunch, onRequestDesign }: {
  product: ProductFamily;
  title: string;
  note: string;
  image: HeroImage;
  priceNote: string;
  trust: string[];
  onLaunch?: () => void;
  onRequestDesign?: () => void;
}) {
  return (
    <section className="cat-hero">
      <div className="cat-hero-copy">
        <p className="shop-kicker">Free proof · UK delivery included</p>
        <h1>{title}</h1>
        <p className="cat-hero-note">{note}</p>
        <HeroPhoto image={image} className="cat-hero-photo-inline" />
        <p className="cat-hero-buy">
          <strong className="shop-product-price">
            <TrackedPrice value={displayedPriceValue(product.startingFrom)} product={product.slug}>{product.startingFrom}</TrackedPrice>
          </strong>
          <span>{priceNote}</span>
        </p>
        <div className="shop-hero-choices">
          <DesignLink onStart={onLaunch}>Design online</DesignLink>
          <ContactLink channel="whatsapp" placement="hero" subject={plaqueSubject(product.shortTitle)} className="shop-button shop-hero-choice-whatsapp">
            <WhatsAppIcon /> Design on WhatsApp
          </ContactLink>
        </div>
        <p className="shop-hero-design-request">
          Prefer us to design it? <a href="/design-request" onClick={onRequestDesign ? event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onRequestDesign(); } } : undefined}>Send us your words – free proof</a>
        </p>
        <ul className="shop-product-benefits cat-hero-trust">
          {trust.map(item => <li key={item}>{item}</li>)}
        </ul>
        {product.seoIntro && <p className="cat-hero-intro">{product.seoIntro}</p>}
      </div>
      <HeroPhoto image={image} className="cat-hero-photo-side" />
    </section>
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

export type SizeStep = { slug: string; label: string; widthMm: number; heightMm: number; fits: string };

export function SizeLadder({ id, kicker, title, intro, sizes, note }: { id?: string; kicker: string; title: string; intro: string; sizes: SizeStep[]; note: React.ReactNode }) {
  const widest = Math.max(...sizes.map(size => size.widthMm));
  return (
    <section className="shop-section cat-sizes" id={id} aria-labelledby="cat-sizes-heading">
      <p className="shop-kicker">{kicker}</p>
      <h2 id="cat-sizes-heading">{title}</h2>
      <p className="cat-section-intro">{intro}</p>
      <ul className="cat-sizes-list">
        {sizes.map(size => (
          <li key={size.slug}>
            <a href={`/${size.slug}`}>
              {/* Each plate is drawn to scale against the largest size. */}
              <span className="cat-size-stage" aria-hidden="true">
                <span className="cat-size-plate" style={{ width: `${(size.widthMm / widest) * 100}%`, aspectRatio: `${size.widthMm} / ${size.heightMm}` }} />
              </span>
              <span className="cat-size-label">{size.label}</span>
              <span className="cat-size-fits">{size.fits}</span>
              <strong><Price slug={size.slug} bare /></strong>
            </a>
          </li>
        ))}
      </ul>
      <p className="shop-smallprint">{note}</p>
    </section>
  );
}

export function GuideAccordion({ id, kicker, title, sections, children }: { id?: string; kicker: string; title: string; sections: { title: string; copy: string }[]; children?: React.ReactNode }) {
  return (
    <section className="shop-section cat-guide" id={id} aria-labelledby="cat-guide-heading">
      <div>
        <p className="shop-kicker">{kicker}</p>
        <h2 id="cat-guide-heading">{title}</h2>
        {children}
      </div>
      <div>
        {sections.map(section => (
          <details key={section.title}>
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
        Almost any size, shape or wording, and portraits engraved from your own photos. Send us a few words, a sketch or a photo of the spot, and we’ll design it and send a free proof, usually within 3 working hours.{' '}
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

const images = '/site-images/memorial';

export function MemorialLanding({ product, faqs, picks, onLaunch, onRequestDesign }: {
  product: ProductFamily;
  faqs: { question: string; answer: string }[];
  picks?: { kicker: string; title: string; intro: string; slugs: string[] };
  onLaunch?: () => void;
  onRequestDesign?: () => void;
}) {
  const subject = plaqueSubject(product.shortTitle);
  const heroSlug = 'polished-brass-297x210-rect-plaque';
  return (
    <div className="shopfront cat-page" data-prerendered="true">
      <div className="shop-breadcrumb">
        <a href="/">Home</a>
        <span>/</span>
        <span>{product.title}</span>
      </div>
      <CategoryHero
        product={product}
        title="Personalised memorial plaques"
        note={product.heroNote || 'Remember them in your own words.'}
        image={{
          src: `${images}/memorial-hero-garden-wall-1200.webp`,
          srcSet: `${images}/memorial-hero-garden-wall-800.webp 800w, ${images}/memorial-hero-garden-wall-1200.webp 1200w, ${images}/memorial-hero-garden-wall-1600.webp 1600w`,
          alt: 'Polished brass memorial plaque reading In loving memory of Charlotte May Pemberton, 1931 to 2021, on a Cotswold stone garden wall beside pink roses and lavender',
          caption: <>Shown: polished brass, 297 × 210 mm, <Price slug={heroSlug} bare />. <a href={`/${heroSlug}`}>See this plaque</a></>,
        }}
        priceNote="A5 stainless steel, with engraving, fixings and UK delivery"
        trust={['Made in the UK', 'Infilled by hand', 'Free proof before you pay', 'No account needed']}
        onLaunch={onLaunch}
        onRequestDesign={onRequestDesign}
      />
      <PlaceRoutes
        id="memorial-places"
        kicker="Choose by setting"
        title="Where will it go?"
        routes={[
          { href: '/bench-plaques', title: 'On a bench', image: `${images}/route-bench.webp`, alt: 'Polished brass memorial plaque on a wooden bench, reading Peter John Wilson, please sit awhile, enjoy the view', priceSlug: 'bench-plaques' },
          { href: '/garden-plaques', title: 'In the garden', image: `${images}/route-garden.webp`, alt: 'Brass garden dedication plaque on dark wood, fixed to a brick wall', priceSlug: 'garden-plaques' },
          { href: '/tree-memorial-plaques', title: 'By a tree', image: `${images}/route-tree.webp`, alt: 'Brass tree memorial plaque for Jim Partridge on an oak board and ground stake beside a cherry tree in blossom', priceSlug: 'tree-memorial-plaques' },
          { href: '/brushed-brass-210x148-rect-plaque', title: 'On a wall', image: `${images}/route-wall.webp`, alt: 'Brushed brass memorial plaque for Fred and Elsie Bond on a red brick wall with honeysuckle and foxgloves', priceSlug: 'brushed-brass-210x148-rect-plaque' },
        ]}
        more={<>Somewhere else, like a grave, a church or a club? <ContactLink channel="whatsapp" placement="page" subject={subject}>Ask us on WhatsApp</ContactLink> and we’ll suggest a size and fixings.</>}
      />
      {picks && <ProductPicks {...picks} id="memorial-picks" className="cat-picks" />}
      <SizeLadder
        id="memorial-sizes"
        kicker="Sizes and prices"
        title="Choose a size for your words."
        intro="Measure the space first, then give the words room to breathe. Each plate is drawn to scale."
        sizes={[
          { slug: 'bench-plaques', label: '150 × 50 mm', widthMm: 150, heightMm: 50, fits: 'A name and dates, for a bench' },
          { slug: 'a5-brushed-steel-personalised-plaque', label: 'A5 · 210 × 148 mm', widthMm: 210, heightMm: 148, fits: 'A name, dates and a short tribute' },
          { slug: 'brushed-stainless-297x210-rect-plaque', label: 'A4 · 297 × 210 mm', widthMm: 297, heightMm: 210, fits: 'A longer tribute or several names' },
          { slug: 'brushed-stainless-400x300-rect-plaque', label: '400 × 300 mm', widthMm: 400, heightMm: 300, fits: 'A family memorial, a poem or a portrait' },
        ]}
        note={<>Prices are for brushed stainless steel without wood backing, including engraving, fixings and UK delivery. Brass, other finishes and wood backing are priced in the designer. <a href="/plaque-sizes">See every size and price</a>.</>}
      />
      <GuideAccordion id="memorial-materials" kicker="Metal and fitting" title="Choose the metal and the setting." sections={product.seoSections || []}>
        <MemorialMaterialLinks />
      </GuideAccordion>
      <OrderSteps
        id="how-it-works"
        kicker="How it works"
        title="Your words. Your approval."
        subject={subject}
        steps={[
          ['Add your words', 'Design it online, or send us the wording on WhatsApp and we’ll lay it out for you.'],
          ['Check your free proof', 'Download the proof PDF to share with family, and change anything until it’s right.'],
          ['Approve, then pay', 'We etch it into solid metal, infill it by hand and deliver it free in the UK.'],
        ]}
        onLaunch={onLaunch}
        onRequestDesign={onRequestDesign}
      />
      <PortraitStrip
        kicker="Add their portrait"
        title="A favourite face, beside their name."
        intro="Send us a photo of a person or a pet. Our Portraits in Metal studio draws it for engraving and sets it beside your words, and you see a free proof before you decide."
        portraits={[
          { src: `${images}/portrait-george.webp`, alt: 'Brass memorial plaque with an engraved portrait of George Hartley, on an oak board and stake beside a young tree in autumn', caption: 'George · brass' },
          { src: `${images}/portrait-joan.webp`, alt: 'Stainless steel memorial plaque with an engraved portrait of Joan Whitfield and a short poem, beside a cherry tree in blossom', caption: 'Joan · stainless steel, with a poem' },
          { src: `${images}/portrait-bramble.webp`, alt: 'Brass pet memorial plaque with an engraved portrait of Bramble the spaniel, on an oak board beside a silver birch', caption: 'Bramble · for a much-loved dog' },
          { src: `${images}/portrait-ron-pat.webp`, alt: 'Stainless steel memorial plaque with an engraved portrait of Ron and Pat Coleman, under an apple tree in blossom', caption: 'Ron & Pat · together again' },
        ]}
        link={{ href: '/portrait-plaques', label: 'See portrait plaques' }}
      />
      <HomeQualitySection />
      <ProofPdfShowcase id="memorial-proof" heading="Check every word before you pay.">
        <p>Before anything is made, you get a clear PDF proof: the plaque at a glance, a drawing with every measurement, and the finish and fixings. Share it with family and agree it together.</p>
      </ProofPdfShowcase>
      <WordingIdeas
        id="memorial-wording"
        kicker="Finding the words"
        title="Memorial plaque wording ideas."
        intro="Start with the name as you want it remembered, then dates if you wish and a few words of your own. These examples are starting points: change anything you like."
        inscriptions={[...memorialInscriptions, { title: 'For a pet', lines: ['Bramble', '2011–2025', 'Our faithful friend,', 'forever by our side'] }]}
        link={{ href: '/memorial-plaque-wording', label: 'See over 40 more wording ideas' }}
      />
      <div id="memorial-questions"><ShopFaq faqs={faqs} /></div>
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
