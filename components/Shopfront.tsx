import React from "react";
import { GardenAdvice, CollectionLinks, PlaqueWordingExamples, ShopTurnaround, ProductionNote } from './ShopGuides';
import { businessContact, productionTiming } from '../services/shopInformation';
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
      "Yes. Create your layout in the online designer, with no account or payment needed. Check names, dates, line breaks and fixing positions, then download your proof PDF if you need time to decide. The PDF includes a link to return to your design. The proof is for approving wording and layout; screen colours and texture previews are illustrative.",
  },
  {
    question: "What is included in the price?",
    answer:
      "Standard plaque prices include engraving, standard fixings and UK mainland delivery. Wood backing, special finishes and other extras are priced in the designer before checkout.",
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
      "For a custom shape, a longer inscription or unusual mounting, email hello@instaplaque.co.uk with the wording, approximate size and where the plaque will go. We can help you choose a suitable starting point.",
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
          Choose brass or stainless steel in the designer.
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
        engraving, standard fixings and UK mainland delivery. Examples may show
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
              "Choose the size, metal finish and fixings. See the price update as you change your options, including engraving and UK mainland delivery.",
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
        <a className="shop-text-link" href="/contact">
          Talk to us ↗
        </a>
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

export function ShopHome({ onStartDesign, onRequestDesign }: { onStartDesign?: () => void; onRequestDesign?: () => void }) {
  return (
    <div className="shopfront" data-prerendered="true">
      <section className="shop-hero">
        <div className="shop-hero-copy">
          <p className="shop-kicker">Custom brass & stainless steel plaques</p>
          <h1>
            Some words
            <br />
            deserve to <em>stay.</em>
          </h1>
          <p className="shop-intro">
            Design your brass or stainless steel plaque online. See the price
            as you choose, then check the wording and layout before you pay.
          </p>
          <DesignLink onStart={onStartDesign} />
          <p className="shop-hero-note">
            Free online designer & proof · No account needed
          </p>
          <a className="shop-text-link shop-hero-how" href="#how-it-works">See how the designer works</a>
          <div className="shop-hero-price">
            <span>Bench plaques</span>
            <strong>
              {
                productFamilies.find(
                  (product) => product.slug === "bench-plaques",
                )!.startingFrom
              }
            </strong>
            <span>with UK mainland delivery</span>
          </div>
          <ProductionNote />
        </div>
        <figure className="shop-hero-image">
          <img
            src="/site-images/home-gallery-brass-bench.webp"
            width="1200"
            height="1200"
            fetchPriority="high"
            alt="Brass memorial plaque design on a wooden bench in a garden"
          />
          <figcaption>
            <span>A name. A memory. A place to pause.</span>
            <span>Design example</span>
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
          03 <strong>UK mainland delivery included</strong>
        </span>
      </div>
      <ShopProcess />
      <ShopCollections />
      <section className="shop-section shop-design-service" aria-labelledby="design-service-heading">
        <div>
          <p className="shop-kicker">A little help, from real people</p>
          <h2 id="design-service-heading">Want us to take care of the design?</h2>
          <p>Choose your plaque and tell us what you’d like. We’ll design it for you and email your proof within 3 hours, for you to review before you pay.</p>
          <a href="/design-request" className="shop-button" onClick={onRequestDesign ? event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onRequestDesign(); } } : undefined}>Have us design it</a>
          <p className="shop-smallprint">No layout tools to learn. Review your proof, request changes, then approve and pay.</p>
        </div>
        <ol className="design-service-steps">
          <li><span>01</span><div><strong>Tell us your idea</strong><p>Your wording, plaque preferences and any special details.</p></div></li>
          <li><span>02</span><div><strong>We arrange the design</strong><p>Your proof emailed within 3 hours, ready for you to review.</p></div></li>
          <li><span>03</span><div><strong>Approve before you pay</strong><p>Happy with the proof? Follow your payment link.</p></div></li>
        </ol>
      </section>

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
      <ShopFaq />
      <section className="shop-closing">
        <p className="shop-kicker">Start with a few words</p>
        <h2>Make something meaningful.</h2>
        <p>See the layout and price online. Save your free proof when you need more time.</p>
        <DesignLink onStart={onStartDesign} className="shop-button-light" />
      </section>
    </div>
  );
}

export function ShopProduct({
  product,
  onLaunch,
  onRequestDesign,
}: {
  product: ProductFamily;
  onLaunch?: () => void;
  onRequestDesign?: () => void;
}) {
  const collection = collections.find((item) => item.slug === product.slug);
  const faqs = [...product.faqs, ...shopFaqs]
    .filter(
      (item, index, list) =>
        list.findIndex((other) => other.question === item.question) === index,
    )
    .slice(0, 6);
  return (
    <div className="shopfront" data-prerendered="true">
      <div className="shop-breadcrumb">
        <a href="/">Home</a>
        <span>/</span>
        <span>{product.title}</span>
      </div>
      <section className="shop-product-hero">
        <figure>
          <img
            src={collection?.image || materialProductImages[product.slug] || product.image}
            alt={`${product.title} design example`}
            width="1200"
            height="1200"
            fetchPriority="high"
          />
          <figcaption>
            Design example. Finish and optional backing affect the final price.
          </figcaption>
        </figure>
        <div>
          <p className="shop-kicker">Made to order · Your wording</p>
          <h1>{product.title}</h1>
          <p className="shop-product-note">
            {collection?.note || "A plaque made for the words that matter."}
          </p>
          <p>{product.seoIntro || product.description}</p>
          <strong className="shop-product-price">{product.startingFrom}</strong>
          <p className="shop-smallprint">
            Standard engraving, fixings and UK mainland delivery included.
            Extras are shown before checkout.
          </p>
          <DesignLink onStart={onLaunch}>
            Design {product.shortTitle.toLowerCase()} plaque
          </DesignLink>
          <p><a className="shop-text-link" href="/design-request" onClick={onRequestDesign ? event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onRequestDesign(); } } : undefined}>Prefer us to design it? ↗</a></p>
          <p className="shop-hero-note">
            Create your free proof online. No account needed.
          </p>
          <ProductionNote />
          <ul className="shop-product-benefits">
            {product.bestFor.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>
      <section className="shop-section shop-buying-guide">
        <div>
          <p className="shop-kicker">Size, wording and fitting</p>
          <h2>Plan your {product.shortTitle.toLowerCase()} plaque.</h2>
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
      </section>
      {['bench-plaques', 'opening-plaques'].includes(product.slug) && <PlaqueWordingExamples slug={product.slug} />}
      {!['bench-plaques', 'opening-plaques'].includes(product.slug) && <ShopProcess />}
      {product.slug === 'garden-plaques' && <GardenAdvice />}
      <CollectionLinks slug={product.slug} />
      <ShopFaq faqs={faqs} />
      <section className="shop-closing">
        <h2>Put your words in place.</h2>
        <p>Create your layout and see the price before you pay.</p>
        <DesignLink onStart={onLaunch} className="shop-button-light" />
      </section>
    </div>
  );
}

export function ShopLanding({
  landing,
  onLaunch,
}: {
  landing: SeoLandingPage;
  onLaunch?: () => void;
}) {
  const related =
    productFamilies.find(
      (product) => product.slug === landing.relatedProductSlug,
    ) || productFamilies[0];
  return (
    <ShopProduct
      onLaunch={onLaunch}
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
    />
  );
}

export function ShopMaterials() {
  return (
    <div className="shopfront" data-prerendered="true">
      <section className="shop-section">
        <p className="shop-kicker">Find your finish</p>
        <h1>
          Brass, steel
          <br />& a personal touch.
        </h1>
        <p className="shop-intro">
          Compare the colour and character of each finish. Start with brass or
          stainless steel, then choose a surface and optional backing in the
          designer.
        </p>
        <p className="shop-material-uses">
          Choosing for a particular place? See how to plan a{' '}
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
            </article>
          ))}
        </div>
        <nav className="shop-related" aria-label="Plaques by material">
          <a href="/brass-plaques">Brass plaque sizes and options ↗</a>
          <a href="/stainless-steel-plaques">Stainless steel plaque sizes and options ↗</a>
        </nav>
        <p className="shop-smallprint">Texture previews are illustrative. Your proof confirms wording, layout and selected options; colour and grain can look different on screen.</p>
      </section>
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
      {!faq && <ShopTurnaround />}
      <ShopFaq />
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
        <a href={`mailto:${businessContact.email}`}>{businessContact.email}</a>
        <p className="shop-footer-address">
          UK sole trader · {businessContact.address}. Not VAT registered.
        </p>
      </div>
      <nav aria-label="Browse plaques">
        <a href="/memorial-plaques">Memorial plaques</a>
        <a href="/bench-plaques">Bench plaques</a>
        <a href="/brass-plaques">Brass plaques</a>
        <a href="/stainless-steel-plaques">Stainless steel plaques</a>
        <a href="/garden-plaques">Garden plaques</a>
        <a href="/opening-plaques">Opening plaques</a>
        <a href="/custom-plaques">Custom plaques</a>
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
