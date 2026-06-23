import React, { useEffect, useState } from 'react';
import PlaquePreview from './PlaquePreview';
import { MockOrder, ProductFamily, SiteView, getPriceBreakdown, materialStories, productFamilies } from '../services/commerce';
import { PlaqueState } from '../types';

const formatPrice = (value: number) => {
  const hasPence = Math.round(value * 100) % 100 !== 0;
  return value.toLocaleString('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: hasPence ? 2 : 0,
    maximumFractionDigits: hasPence ? 2 : 0,
  });
};

interface SiteProps {
  view: SiteView;
  selectedProduct: ProductFamily;
  state: PlaqueState;
  inscription: string;
  price: number;
  isProductionReady: boolean;
  orders: MockOrder[];
  onNavigate: (view: SiteView, productSlug?: string) => void;
  onStartDesign: () => void;
  onLaunchProduct: (product: ProductFamily) => void;
  onCreateMockOrder: (name: string, email: string) => MockOrder;
}

type HomeCarouselItem = {
  id: string;
  image: string;
  label: string;
};

type LegalPage = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: Array<{ title: string; copy: string }>;
};

const legalPages: Partial<Record<SiteView, LegalPage>> = {
  contact: {
    eyebrow: 'Contact',
    title: 'Contact InstaPlaque.',
    intro: 'Placeholder contact page for the live business details.',
    sections: [
      { title: 'Trading identity', copy: 'InstaPlaque Ltd. Company number: [company number to be added before launch].' },
      { title: 'Registered office', copy: '[Registered office address to be added before launch].' },
      { title: 'Email', copy: '[Contact email address to be added before launch].' },
      { title: 'Phone', copy: '[Phone number to be added if available].' },
    ],
  },
  terms: {
    eyebrow: 'Terms',
    title: 'Terms and conditions.',
    intro: 'Placeholder terms page for proof approval, payment, production, delivery and customer support terms.',
    sections: [
      { title: 'Orders and proofs', copy: 'Customers create and approve a plaque proof before production. Final terms will explain when the proof becomes binding.' },
      { title: 'Prices', copy: 'Prices are shown in pounds sterling and include UK mainland delivery unless stated otherwise. InstaPlaque Ltd is not VAT registered.' },
      { title: 'Production and delivery', copy: 'Production times and delivery estimates will be shown before checkout. Custom work may need manual confirmation.' },
      { title: 'Faults and support', copy: 'Customers keep their statutory rights if goods are faulty, not as described, or not made with reasonable care.' },
    ],
  },
  privacy: {
    eyebrow: 'Privacy',
    title: 'Privacy policy.',
    intro: 'Placeholder privacy page for how InstaPlaque handles customer and order data.',
    sections: [
      { title: 'Data collected', copy: 'Customer name, contact details, delivery details, plaque wording, proof details and order history may be collected to fulfil orders.' },
      { title: 'Why it is used', copy: 'Data is used to create proofs, process orders, arrange delivery, provide customer support and keep business records.' },
      { title: 'Processors', copy: 'Final policy will list payment, hosting, email, analytics and delivery providers used by the business.' },
      { title: 'Customer rights', copy: 'Customers can ask to access, correct or delete their personal data where the law allows.' },
    ],
  },
  cookies: {
    eyebrow: 'Cookies',
    title: 'Cookie policy.',
    intro: 'Placeholder cookie page for essential and optional cookies used by the site.',
    sections: [
      { title: 'Essential cookies', copy: 'The site may use essential cookies or local storage to keep the proof bench and checkout working.' },
      { title: 'Analytics and marketing', copy: 'Non-essential analytics or advertising cookies will require consent before they are used.' },
      { title: 'Managing cookies', copy: 'Final copy will explain how customers can change cookie settings in the site or browser.' },
    ],
  },
  returns: {
    eyebrow: 'Returns and cancellations',
    title: 'Returns and cancellations.',
    intro: 'Placeholder returns page for personalised and made-to-order plaque rules.',
    sections: [
      { title: 'Personalised plaques', copy: 'Because plaques are made to the customer specification, change-of-mind cancellation may not apply after proof approval and production starts.' },
      { title: 'Before production', copy: 'Final terms will explain when an order can still be changed or cancelled before manufacture.' },
      { title: 'Faulty goods', copy: 'Customers still keep normal rights if a plaque is faulty, not as described, or not made with reasonable care.' },
      { title: 'How to raise an issue', copy: 'Contact details and evidence requirements will be added before launch.' },
    ],
  },
};

const footerLinks: Array<{ view: SiteView; label: string }> = [
  { view: 'contact', label: 'Contact' },
  { view: 'terms', label: 'Terms' },
  { view: 'privacy', label: 'Privacy' },
  { view: 'cookies', label: 'Cookies' },
  { view: 'returns', label: 'Returns & cancellations' },
];

type FooterSocial = 'instagram' | 'facebook' | 'pinterest';

const footerSocials: Array<{ id: FooterSocial; label: string }> = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'pinterest', label: 'Pinterest' },
];

const homeCarouselItems: HomeCarouselItem[] = [
  {
    id: 'bench-steel',
    image: '/site-images/home-carousel-bench-steel.webp',
    label: 'Steel bench memorial plaque',
  },
  {
    id: 'garden-brass',
    image: '/site-images/home-carousel-garden-brass.webp',
    label: 'Brass garden dedication plaque',
  },
  {
    id: 'reading-room',
    image: '/site-images/home-carousel-reading-room.webp',
    label: 'Interior commemorative plaque',
  },
];

function ProductMockup({ product }: { product: ProductFamily }) {
  return (
    <div className={`commerce-product-visual commerce-product-visual--${product.materialCue}`} aria-hidden="true">
      {product.image ? (
        <img src={product.image} alt="" loading="lazy" />
      ) : (
        <>
          <div className="commerce-product-shadow" />
          <div className="commerce-product-plaque">
            <span>{product.shortTitle}</span>
          </div>
        </>
      )}
    </div>
  );
}

function SiteHero({ onStartDesign }: Pick<SiteProps, 'onStartDesign'>) {
  return (
    <section className="commerce-hero commerce-hero--premium">
      <div className="commerce-premium-hero__image" aria-hidden="true" />
      <div className="commerce-premium-hero__shade" aria-hidden="true" />
      <div className="commerce-premium-hero__copy">
        <div className="brand-wordmark brand-wordmark--hero-title" aria-label="InstaPlaque"><span>Insta</span><span>Plaque</span></div>
        <div className="commerce-hero-promise" aria-label="Free professional proof in minutes. Finished plaque in five working days.">
          <span><strong>100% free</strong> professional proof in minutes</span>
          <span>Your finished plaque in <strong>5 working days</strong></span>
        </div>
        <p>
          Our unique intelligent plaque design system turns your wording into a production-ready proof in minutes.
          Skip the artwork back-and-forth and receive your finished plaque in 5 working days, engraved with care using the finest materials.
        </p>
        <div className="commerce-actions">
          <button type="button" className="commerce-primary commerce-primary--cream" onClick={onStartDesign}>
            Create your proof
          </button>
          <a className="commerce-secondary commerce-secondary--glass" href="#products">View standard sizes</a>
        </div>
      </div>
    </section>
  );
}

function ProductGrid({ onLaunchProduct }: Pick<SiteProps, 'onLaunchProduct'>) {
  return (
    <section className="commerce-section" id="products">
      <div className="commerce-section__head">
        <p className="commerce-eyebrow">Standard sizes</p>
        <h2>Choose the format, then start your free proof.</h2>
      </div>
      <div className="commerce-product-grid">
        {productFamilies.map((product) => (
          <article className="commerce-product-card" key={product.slug}>
            <ProductMockup product={product} />
            <div>
              <p className="commerce-card-eyebrow">{product.eyebrow}</p>
              <h3>{product.title}</h3>
              <p>{product.description}</p>
              <div className="commerce-size-meta" aria-label={`${product.title} use cases`}>
                {product.bestFor.slice(0, 3).map((item) => <span key={item}>{item}</span>)}
              </div>
            </div>
            <div className="commerce-card-foot">
              <span>{product.startingFrom}</span>
              <button type="button" onClick={() => onLaunchProduct(product)}>Start proof</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function HomeMaterialPanels() {
  return (
    <section className="commerce-section commerce-material-showcase">
      <div className="commerce-section__head">
        <p className="commerce-eyebrow">Materials</p>
        <h2>Engraved with care, on the finest materials.</h2>
        <p>
          Choose from premium brass, stainless steel, and wood-backed finishes selected for clean engraving,
          lasting detail, and a substantial feel.
        </p>
      </div>
      <div className="commerce-material-grid commerce-material-grid--home">
        {materialStories.map((material) => (
          <article className="commerce-material-card commerce-material-card--tactile" key={material.title}>
            <div style={{ backgroundImage: `url('${material.image}')` }} aria-hidden="true" />
            <h3>{material.title}</h3>
            <p>{material.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function HomeFaq() {
  const faqs = [
    ['Is the proof really free?', 'Yes. Customers can create and review the proof before placing an order.'],
    ['Can I change the wording?', 'Yes. Edit the wording and regenerate the proof until it feels right.'],
    ['What if I need a custom size?', 'Start with Custom plaques. Anything unusual can be checked before payment.'],
    ['Is delivery included?', 'UK mainland delivery is included in standard pricing. Extras are shown before checkout.'],
  ];
  return (
    <section className="commerce-section commerce-home-faq">
      <div className="commerce-section__head">
        <p className="commerce-eyebrow">FAQ</p>
        <h2>Plain answers before starting a proof.</h2>
      </div>
      <div className="commerce-faq-grid">
        {faqs.map(([question, answer]) => (
          <article className="commerce-faq-card" key={question}>
            <h3>{question}</h3>
            <p>{answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function HomePage(props: Pick<SiteProps, 'onNavigate' | 'onStartDesign' | 'onLaunchProduct'>) {
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const moveCarousel = (direction: number) => {
    setActiveCarouselIndex((current) => (current + direction + homeCarouselItems.length) % homeCarouselItems.length);
  };

  return (
    <div className="commerce-page">
      <SiteHero onStartDesign={props.onStartDesign} />
      <section className="commerce-section commerce-home-story">
        <div
          className="commerce-proof-carousel commerce-proof-carousel--coverflow"
          aria-label="Swipe through InstaPlaque proof examples"
          onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
          onTouchEnd={(event) => {
            if (touchStartX === null) return;
            const delta = (event.changedTouches[0]?.clientX ?? touchStartX) - touchStartX;
            if (Math.abs(delta) > 36) moveCarousel(delta < 0 ? 1 : -1);
            setTouchStartX(null);
          }}
        >
          <button type="button" className="commerce-carousel-arrow commerce-carousel-arrow--prev" onClick={() => moveCarousel(-1)} aria-label="Previous plaque example">‹</button>
          <div className="commerce-proof-carousel__deck" aria-live="polite">
            {homeCarouselItems.map((item, index) => {
              let offset = index - activeCarouselIndex;
              if (offset > homeCarouselItems.length / 2) offset -= homeCarouselItems.length;
              if (offset < -homeCarouselItems.length / 2) offset += homeCarouselItems.length;
              return (
                <button
                  type="button"
                  key={item.id}
                  className="commerce-proof-carousel__slide"
                  data-offset={offset}
                  aria-label={item.label}
                  aria-pressed={index === activeCarouselIndex}
                  onClick={() => setActiveCarouselIndex(index)}
                  style={{ '--carousel-offset': offset } as React.CSSProperties}
                >
                  <img src={item.image} alt="" loading={index === 0 ? 'eager' : 'lazy'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
          <button type="button" className="commerce-carousel-arrow commerce-carousel-arrow--next" onClick={() => moveCarousel(1)} aria-label="Next plaque example">›</button>
        </div>
        <article className="commerce-proof-first-copy">
          <p className="commerce-eyebrow">Why this is different</p>
          <h2>You choose the details. We shape the plaque.</h2>
          <p>
            Choose the plaque type, size, material and wording. Our intelligent plaque proofing system
            handles the layout, spacing, line breaks and production details, then shows you a realistic
            proof before you order.
          </p>
          <p>
            No guesswork and no hidden costs: engraving, standard fixings and UK mainland delivery are
            included, with optional extras shown clearly before checkout.
          </p>
          <button type="button" className="commerce-primary" onClick={props.onStartDesign}>
            Start your free proof
          </button>
          <small>Your InstaPlaque proof is 100% free. Need time to decide? Download the PDF proof and use the link inside to continue or checkout later. No account needed.</small>
        </article>
        <div className="commerce-proof-first-steps" aria-label="How the proofing system works">
          {[
            ['Choose your plaque options', 'Pick the size, material, fixings and finish in plain steps.'],
            ['Add the wording', 'Type the inscription once. The system handles the hard layout work.'],
            ['Review the proof and price', 'See a realistic proof and live price before checkout.'],
          ].map(([title, detail], index) => (
            <div className="commerce-proof-first-step" key={title}>
              <span>{index + 1}</span>
              <div>
                <strong>{title}</strong>
                <p>{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <ProductGrid onLaunchProduct={props.onLaunchProduct} />
      <HomeMaterialPanels />
      <HomeFaq />
    </div>
  );
}

function ProductPage({ selectedProduct, onLaunchProduct }: Pick<SiteProps, 'selectedProduct' | 'onLaunchProduct'>) {
  return (
    <div className="commerce-page">
      <section className="commerce-product-detail">
        <div>
          <p className="commerce-eyebrow">{selectedProduct.eyebrow}</p>
          <h1>{selectedProduct.title}</h1>
          <p className="commerce-lede">{selectedProduct.description}</p>
          <div className="commerce-actions">
            <button type="button" className="commerce-primary" onClick={() => onLaunchProduct(selectedProduct)}>
              Design this plaque
            </button>
            <span className="commerce-price-note">{selectedProduct.startingFrom} · UK mainland delivery included</span>
          </div>
          <ul className="commerce-bullet-list">
            {selectedProduct.bestFor.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <ProductMockup product={selectedProduct} />
      </section>
      <section className="commerce-section">
        <div className="commerce-section__head">
          <p className="commerce-eyebrow">Product questions</p>
          <h2>Fast answers before customers enter the proof bench.</h2>
        </div>
        <div className="commerce-faq-grid">
          {selectedProduct.faqs.map((faq) => (
            <article className="commerce-faq-card" key={faq.question}>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function MaterialsPage() {
  return (
    <div className="commerce-page">
      <section className="commerce-section">
        <div className="commerce-section__head">
          <p className="commerce-eyebrow">Material guide</p>
          <h1>Real plaque finishes, shown before the customer orders.</h1>
          <p>Customers should understand the finish before they approve the proof. These stories give the site a product-led layer around the design tool.</p>
        </div>
        <div className="commerce-material-grid">
          {materialStories.map((material) => (
            <article className="commerce-material-card" key={material.title}>
              <div style={{ backgroundImage: `url(${material.image})` }} />
              <h3>{material.title}</h3>
              <p>{material.copy}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function HowItWorksPage() {
  return (
    <div className="commerce-page">
      <section className="commerce-section commerce-deep-copy">
        <p className="commerce-eyebrow">The new model</p>
        <h1>Instant proof approval replaces the slow PDF loop.</h1>
        <p>
          The customer creates a production-style proof before checkout. They can keep editing until the approval step, then the order records a locked design snapshot.
        </p>
        <div className="commerce-flow-panel">
          {['Select product', 'Generate AI proof', 'Review price', 'Approve proof', 'Mock checkout', 'Production queue'].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>
    </div>
  );
}

function FaqPage() {
  const faqs = [
    ['Can I change the design?', 'Yes. Change as much as you like until you approve the proof and place the order.'],
    ['Is the proof instant?', 'The typography engine creates a professional layout immediately after the customer enters wording and generates the proof.'],
    ['What if my order needs a quote?', 'The app can still capture the design, but routes unusual sizes, artwork or complex jobs to quote review.'],
    ['Do I need an account?', 'No. The intended customer flow is guest checkout with magic links for saved designs and order pages later.'],
  ];
  return (
    <div className="commerce-page">
      <section className="commerce-section">
        <div className="commerce-section__head">
          <p className="commerce-eyebrow">FAQ</p>
          <h1>Questions that support confident self-service ordering.</h1>
        </div>
        <div className="commerce-faq-grid">
          {faqs.map(([question, answer]) => (
            <article className="commerce-faq-card" key={question}>
              <h3>{question}</h3>
              <p>{answer}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function QuotePage({ onLaunchProduct }: Pick<SiteProps, 'onLaunchProduct'>) {
  const bespoke = productFamilies.find((product) => product.slug === 'custom-plaques') ?? productFamilies[0];
  return (
    <div className="commerce-page">
      <section className="commerce-product-detail">
        <div>
          <p className="commerce-eyebrow">Bespoke route</p>
          <h1>Start with an instant proof, then route complex work to quote.</h1>
          <p className="commerce-lede">
            Customers should not hit a dead-end when a plaque is unusual. They can still create a proof, then the system flags oversized, artwork-heavy or batch work for manual price confirmation.
          </p>
          <div className="commerce-actions">
            <button type="button" className="commerce-primary" onClick={() => onLaunchProduct(bespoke)}>
              Start bespoke proof
            </button>
          </div>
        </div>
        <div className="commerce-quote-panel">
          <p className="commerce-eyebrow">Quote triggers</p>
          <ul>
            <li>Oversized dimensions outside the standard production bed</li>
            <li>Customer logos, portraits, or supplied artwork</li>
            <li>Bulk/industrial plaques or serialised tags</li>
            <li>Special materials, mounting, installation, or delivery requests</li>
          </ul>
          <div className="commerce-warning">
            Future service hook: this page becomes a Supabase quote request with a Resend confirmation email and staff dashboard task.
          </div>
        </div>
      </section>
    </div>
  );
}

function CheckoutPage({
  state,
  inscription,
  selectedProduct,
  isProductionReady,
  onCreateMockOrder,
  onNavigate,
}: Pick<SiteProps, 'state' | 'inscription' | 'selectedProduct' | 'isProductionReady' | 'onCreateMockOrder' | 'onNavigate'>) {
  const [name, setName] = useState('Demo Customer');
  const [email, setEmail] = useState('customer@example.com');
  const [accepted, setAccepted] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<MockOrder | null>(null);
  const breakdown = getPriceBreakdown(state, inscription);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!accepted) return;
    setCreatedOrder(onCreateMockOrder(name, email));
  };

  return (
    <div className="commerce-page">
      <section className="commerce-checkout">
        <div className="commerce-checkout-proof">
          <p className="commerce-eyebrow">Approved proof snapshot</p>
          <div className="commerce-checkout-preview">
            <PlaquePreview state={state} activeStep={6} inscription={inscription} />
          </div>
        </div>
        <form className="commerce-checkout-panel" onSubmit={submit}>
          <p className="commerce-eyebrow">Approve before ordering</p>
          <h1>Confirm the exact proof for production.</h1>
          <p>This prototype simulates the future Stripe/Supabase order flow. No payment or email is sent.</p>
          {!isProductionReady && (
            <div className="commerce-warning">
              The proof is not production-ready yet. In production this would route back to the proof step or into artwork check.
            </div>
          )}
          {breakdown.quoteRequired && (
            <div className="commerce-warning">
              Quote/check route: {breakdown.quoteReasons.join(', ')}.
            </div>
          )}
          <label>
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
          </label>
          <div className="commerce-summary-lines">
            <span><strong>{selectedProduct.title}</strong></span>
            <span>Base plaque <strong>{formatPrice(breakdown.base)}</strong></span>
            {breakdown.wood > 0 && <span>Wood backing <strong>{formatPrice(breakdown.wood)}</strong></span>}
            <span>UK delivery <strong>Included</strong></span>
            <span className="commerce-summary-total">Total <strong>{formatPrice(breakdown.total)}</strong></span>
          </div>
          <label className="commerce-approval">
            <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
            <span>I approve this proof for production. I understand the plaque will be made using this wording, layout, material and size.</span>
          </label>
          <button className="commerce-primary" type="submit" disabled={!accepted}>
            Create mock order
          </button>
          {createdOrder && (
            <div className="commerce-success">
              <strong>Order package created: {createdOrder.id}</strong>
              <span>Status: {createdOrder.status.replace('-', ' ')}</span>
              <button type="button" onClick={() => onNavigate('admin')}>Open admin view</button>
            </div>
          )}
        </form>
      </section>
    </div>
  );
}

function AdminPage({ orders }: Pick<SiteProps, 'orders'>) {
  const counts = {
    approved: orders.filter((order) => order.status === 'proof-approved').length,
    check: orders.filter((order) => order.status === 'needs-check' || order.status === 'quote-requested').length,
    production: orders.filter((order) => order.status === 'in-production').length,
  };
  return (
    <div className="commerce-page">
      <section className="commerce-section">
        <div className="commerce-section__head">
          <p className="commerce-eyebrow">Internal mock dashboard</p>
          <h1>Production queue shaped around approved proof snapshots.</h1>
        </div>
        <div className="commerce-ops-strip">
          <div><span>Approved proofs</span><strong>{counts.approved}</strong></div>
          <div><span>Needs check/quote</span><strong>{counts.check}</strong></div>
          <div><span>In production</span><strong>{counts.production}</strong></div>
          <div><span>Service mode</span><strong>Mock</strong></div>
        </div>
        <div className="commerce-admin-grid">
          {(orders.length ? orders : []).map((order) => (
            <article className="commerce-admin-card" key={order.id}>
              <div>
                <strong>{order.id}</strong>
                <span>{order.status.replace('-', ' ')}</span>
              </div>
              <p>{order.productTitle}</p>
              <p>{order.customerName} · {order.customerEmail}</p>
              <p>{order.priceBreakdown.quoteRequired ? `Check: ${order.priceBreakdown.quoteReasons.join(', ')}` : 'Production approval captured at checkout.'}</p>
              <p className="commerce-admin-price">{formatPrice(order.total)}</p>
            </article>
          ))}
          {!orders.length && (
            <div className="commerce-empty-state">
              <strong>No mock orders yet.</strong>
              <span>Create one through the checkout prototype and it will appear here.</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function LegalPlaceholderPage({ view }: { view: SiteView }) {
  const page = legalPages[view] ?? legalPages.contact;
  if (!page) return null;

  return (
    <div className="commerce-page">
      <section className="commerce-section commerce-legal-page">
        <div className="commerce-section__head">
          <p className="commerce-eyebrow">{page.eyebrow}</p>
          <h1>{page.title}</h1>
          <p>{page.intro}</p>
        </div>
        <div className="commerce-legal-grid">
          {page.sections.map((section) => (
            <article className="commerce-legal-card" key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.copy}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function SocialLogo({ type }: { type: FooterSocial }) {
  if (type === 'facebook') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14.2 8.1V6.7c0-.7.5-1.1 1.2-1.1h1.7V2.8c-.8-.1-1.7-.2-2.6-.2-2.6 0-4.3 1.5-4.3 4.1v1.4H7.5v3.2h2.7v8.1h3.4v-8.1H16l.5-3.2h-2.3Z" />
      </svg>
    );
  }
  if (type === 'pinterest') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12.1 2.6c-5.1 0-7.7 3.4-7.7 6.6 0 1.9 1 4.2 2.6 4.9.3.1.5 0 .6-.3l.4-1.5c.1-.2 0-.4-.1-.6-.5-.6-.8-1.4-.8-2.3 0-2.8 2.1-5.4 5.7-5.4 3.1 0 5 1.9 5 4.6 0 3.1-1.6 5.8-4 5.8-1.2 0-2.1-1-1.8-2.2.3-1.4 1-2.9 1-3.9 0-.9-.5-1.7-1.5-1.7-1.2 0-2.2 1.3-2.2 3 0 1.1.4 1.8.4 1.8l-1.5 6.2c-.3 1.3 0 3 .1 3.1.1.1.2.1.3 0 .1-.1 1.7-2.2 2-3.5l.7-2.7c.5.9 1.6 1.6 2.9 1.6 3.8 0 6.4-3.4 6.4-7.6 0-3.3-2.8-6.5-7.2-6.5Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.4" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17" cy="7" r="1.1" />
    </svg>
  );
}

function CommerceFooter({ onNavigate }: Pick<SiteProps, 'onNavigate'>) {
  return (
    <footer className="commerce-footer">
      <div className="commerce-footer__brand">
        <strong className="brand-wordmark brand-wordmark--footer">
          <span>Insta</span><span>Plaque</span>
        </strong>
        <p>InstaPlaque Ltd. Company number: [to be added]. Registered office: [to be added]. Not VAT registered.</p>
      </div>
      <div className="commerce-footer__right">
        <div className="commerce-footer-socials" aria-label="Social links">
          {footerSocials.map((social) => (
            <button key={social.id} type="button" aria-label={`${social.label} link placeholder`} title={`${social.label} link placeholder`}>
              <SocialLogo type={social.id} />
            </button>
          ))}
        </div>
        <img
          className="commerce-footer-payment-badge"
          src="/site-images/powered-by-stripe-white.svg"
          alt="Powered by Stripe"
          loading="lazy"
        />
        <nav className="commerce-footer-legal" aria-label="Legal pages">
          {footerLinks.map((link) => (
            <button key={link.view} type="button" onClick={() => onNavigate(link.view)}>
              {link.label}
            </button>
          ))}
        </nav>
      </div>
    </footer>
  );
}

export function SiteExperience(props: SiteProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.querySelector('main')?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [props.view, props.selectedProduct.slug]);

  let page: React.ReactNode;

  if (props.view === 'product') {
    page = <ProductPage selectedProduct={props.selectedProduct} onLaunchProduct={props.onLaunchProduct} />;
  } else if (props.view === 'materials') {
    page = <MaterialsPage />;
  } else if (props.view === 'how') {
    page = <HowItWorksPage />;
  } else if (props.view === 'faq') {
    page = <FaqPage />;
  } else if (props.view === 'quote') {
    page = <QuotePage onLaunchProduct={props.onLaunchProduct} />;
  } else if (props.view === 'checkout') {
    page = (
      <CheckoutPage
        state={props.state}
        inscription={props.inscription}
        selectedProduct={props.selectedProduct}
        isProductionReady={props.isProductionReady}
        onCreateMockOrder={props.onCreateMockOrder}
        onNavigate={props.onNavigate}
      />
    );
  } else if (props.view === 'admin') {
    page = <AdminPage orders={props.orders} />;
  } else if (legalPages[props.view]) {
    page = <LegalPlaceholderPage view={props.view} />;
  } else {
    page = <HomePage onNavigate={props.onNavigate} onStartDesign={props.onStartDesign} onLaunchProduct={props.onLaunchProduct} />;
  }

  return (
    <>
      {page}
      <CommerceFooter onNavigate={props.onNavigate} />
    </>
  );
}
