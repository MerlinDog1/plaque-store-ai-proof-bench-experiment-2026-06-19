import React from "react";
import {
  productFamilies,
  ProductFamily,
  materialStories,
  SeoLandingPage,
} from "../services/commerce";

export const shopFaqs = [
  {
    question: "Can I see my plaque before I pay?",
    answer:
      "Yes. Enter your wording and create a free online proof. Check names, dates, line breaks and fixings, and make changes before you order. You can download your proof and return to it later.",
  },
  {
    question: "What is included in the price?",
    answer:
      "Standard plaque prices include engraving, standard fixings and UK mainland delivery. Wood backing, special finishes and other extras are priced in the designer before checkout.",
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
    slug: "brass-plaques",
    image: "/site-images/home-gallery-brass-community.webp",
    note: "Warm metal. A timeless finish.",
    detail: "Traditional brass for dedications and building openings.",
  },
  {
    slug: "stainless-steel-plaques",
    image: "/site-images/home-gallery-oval-steel.webp",
    note: "Simple, contemporary and personal.",
    detail: "Silver-toned plaques for modern spaces and outdoor use.",
  },
];

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
          <p className="shop-kicker">Made for your words</p>
          <h2>Find your plaque.</h2>
        </div>
        <p>
          A person, a place, a moment. <br />
          Start with what you want to mark.
        </p>
      </div>
      <div className="shop-collections">
        {collections.map((collection) => {
          const product = productFamilies.find(
            (item) => item.slug === collection.slug,
          )!;
          return (
            <a
              className="shop-collection"
              href={`/${product.slug}`}
              key={product.slug}
            >
              <div className="shop-collection-image">
                <img
                  src={collection.image}
                  alt={`${product.title} design example`}
                  width="1200"
                  height="1200"
                  loading="lazy"
                />
              </div>
              <div className="shop-collection-title">
                <h3>{product.title}</h3>
                <span aria-hidden="true">↗</span>
              </div>
              <p>{collection.detail}</p>
              <strong>{product.startingFrom}</strong>
            </a>
          );
        })}
      </div>
      <p className="shop-smallprint">
        Starting prices include engraving, standard fixings and UK mainland
        delivery. Examples may show optional finishes or backing.
      </p>
      <nav className="shop-related" aria-label="More plaque collections">
        <a href="/garden-plaques">Garden plaques ↗</a>
        <a href="/opening-plaques">Opening plaques ↗</a>
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
            <p className="shop-kicker">See it before you order</p>
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
              "Pick a size and a metal finish. The price updates as you choose your options.",
            ],
            [
              "Make it personal",
              "Add your exact wording. Create a layout, then adjust the text and spacing until it feels right.",
            ],
            [
              "Check, then order",
              "Review the spelling, dates, layout and fixings. Approve your proof before your plaque is made.",
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
        <p className="shop-kicker">A little help choosing</p>
        <h2>
          Before you <br />
          make it yours.
        </h2>
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

export function ShopHome({ onStartDesign }: { onStartDesign?: () => void }) {
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
            Remember someone. Celebrate a place. Mark a moment. Create a
            personal engraved plaque, and see your design before you order.
          </p>
          <DesignLink onStart={onStartDesign} />
          <p className="shop-hero-note">
            Free online proof · No account needed
          </p>
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
      <ShopCollections />
      <ShopProcess />
      <section className="shop-section shop-materials">
        <div>
          <p className="shop-kicker">The finishing touch</p>
          <h2>
            Warm brass.
            <br />
            Quietly striking steel.
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
        <p>Your proof is free. Take your time getting it right.</p>
        <DesignLink onStart={onStartDesign} className="shop-button-light" />
      </section>
    </div>
  );
}

export function ShopProduct({
  product,
  onLaunch,
}: {
  product: ProductFamily;
  onLaunch?: () => void;
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
            src={collection?.image || product.image}
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
          <p className="shop-hero-note">
            Free proof. Check every detail before you pay.
          </p>
          <ul className="shop-product-benefits">
            {product.bestFor.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>
      <section className="shop-section shop-buying-guide">
        <div>
          <p className="shop-kicker">A considered choice</p>
          <h2>Getting the details right.</h2>
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
      <ShopProcess />
      <ShopFaq faqs={faqs} />
      <section className="shop-closing">
        <h2>Put your words in place.</h2>
        <p>Build a free proof and see how your plaque could look.</p>
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
            : "Make it personal. Get it right."}
        </h1>
        <p className="shop-intro">
          Choose your plaque, add your exact wording and check the design before
          you order. Your online proof is free, with no account needed.
        </p>
        <DesignLink />
      </section>
      {!faq && <ShopProcess />}
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
        <a href="mailto:hello@instaplaque.co.uk">hello@instaplaque.co.uk</a>
        <p className="shop-footer-address">
          UK sole trader · 4 Dunkirk Avenue, Kettering, NN14 2PL, United
          Kingdom. Not VAT registered.
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
