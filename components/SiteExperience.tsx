import React, { useEffect, useState } from 'react';
import PlaquePreview from './PlaquePreview';
import { MockOrder, ProductFamily, SiteView, getPriceBreakdown, materialStories, productFamilies } from '../services/commerce';
import { PlaqueState } from '../types';

const formatPrice = (value: number) => value.toLocaleString('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
});

interface SiteProps {
  view: SiteView;
  selectedProduct: ProductFamily;
  state: PlaqueState;
  inscription: string;
  price: number;
  isProductionReady: boolean;
  orders: MockOrder[];
  onNavigate: (view: SiteView, productSlug?: string) => void;
  onLaunchProduct: (product: ProductFamily) => void;
  onCreateMockOrder: (name: string, email: string) => MockOrder;
}

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

function SiteHero({ onLaunchProduct }: Pick<SiteProps, 'onLaunchProduct'>) {
  const primaryProduct = productFamilies[0];
  return (
    <section className="commerce-hero commerce-hero--premium">
      <div className="commerce-premium-hero__image" aria-hidden="true" />
      <div className="commerce-premium-hero__shade" aria-hidden="true" />
      <div className="commerce-premium-hero__copy">
        <p className="commerce-eyebrow">Instant professional plaque proofing</p>
        <h1><span className="brand-wordmark brand-wordmark--hero"><span>Insta</span><span>Plaque</span></span> custom plaques, proofed before you order.</h1>
        <p>
          Choose a plaque, enter the wording and see a finished proof in minutes with intelligent typography,
          realistic materials and live pricing.
        </p>
        <div className="commerce-actions">
          <button type="button" className="commerce-primary commerce-primary--cream" onClick={() => onLaunchProduct(primaryProduct)}>
            Create your proof
          </button>
          <a className="commerce-secondary commerce-secondary--glass" href="#products">View plaque types</a>
        </div>
      </div>
    </section>
  );
}

function ProductGrid({ onNavigate, onLaunchProduct }: Pick<SiteProps, 'onNavigate' | 'onLaunchProduct'>) {
  return (
    <section className="commerce-section" id="products">
      <div className="commerce-section__head">
        <p className="commerce-eyebrow">Choose a starting point</p>
        <h2>High-end plaque types, each opening with the right instant proof setup.</h2>
      </div>
      <div className="commerce-product-grid">
        {productFamilies.map((product) => (
          <article className="commerce-product-card" key={product.slug}>
            <ProductMockup product={product} />
            <div>
              <p className="commerce-card-eyebrow">{product.eyebrow}</p>
              <h3>{product.title}</h3>
              <p>{product.description}</p>
            </div>
            <div className="commerce-card-foot">
              <span>{product.startingFrom}</span>
              <button type="button" onClick={() => onLaunchProduct(product)}>Design now</button>
              <button type="button" className="commerce-link-button" onClick={() => onNavigate('product', product.slug)}>Details</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function HomePage(props: Pick<SiteProps, 'onNavigate' | 'onLaunchProduct'>) {
  return (
    <div className="commerce-page">
      <SiteHero onLaunchProduct={props.onLaunchProduct} />
      <section className="commerce-section commerce-home-story">
        <article>
          <p className="commerce-eyebrow">Why this is different</p>
          <h2>Your proof first. Then your order.</h2>
          <p>
            Traditional plaque websites ask customers to submit wording and wait for artwork.
            InstaPlaque makes the proof part of the shopping experience: the design is visible,
            editable and approved before checkout.
          </p>
        </article>
        <div className="commerce-home-story__gallery" aria-label="Plaque examples">
          <div style={{ backgroundImage: "url('/site-images/plaque-hero-memorial.jpg')" }}><span>Memorial plaques</span></div>
          <div style={{ backgroundImage: "url('/site-images/plaque-hero-equine.jpg')" }}><span>Pet and equine</span></div>
          <div style={{ backgroundImage: "url('/site-images/plaque-hero-cat.png')" }}><span>Photo sketch</span></div>
          <div style={{ backgroundImage: "url('/site-images/proofbench-materials.png')" }}><span>Instant proof</span></div>
        </div>
      </section>
      <ProductGrid onNavigate={props.onNavigate} onLaunchProduct={props.onLaunchProduct} />
      <section className="commerce-section commerce-process-band">
        <div>
          <p className="commerce-eyebrow">How it works</p>
          <h2>Old plaque sites make you wait. This starts with the finished proof.</h2>
        </div>
        <div className="commerce-process-grid">
          {['Choose a plaque type', 'Enter your wording', 'AI typesets the proof', 'Approve and order'].map((step, index) => (
            <div className="commerce-process-step" key={step}>
              <span>{index + 1}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
      </section>
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
            <span className="commerce-price-note">{selectedProduct.startingFrom} · price inc UK delivery</span>
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
  const bespoke = productFamilies.find((product) => product.slug === 'bespoke-plaques') ?? productFamilies[0];
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

export function SiteExperience(props: SiteProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.querySelector('main')?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [props.view, props.selectedProduct.slug]);

  if (props.view === 'product') {
    return <ProductPage selectedProduct={props.selectedProduct} onLaunchProduct={props.onLaunchProduct} />;
  }
  if (props.view === 'materials') {
    return <MaterialsPage />;
  }
  if (props.view === 'how') {
    return <HowItWorksPage />;
  }
  if (props.view === 'faq') {
    return <FaqPage />;
  }
  if (props.view === 'quote') {
    return <QuotePage onLaunchProduct={props.onLaunchProduct} />;
  }
  if (props.view === 'checkout') {
    return (
      <CheckoutPage
        state={props.state}
        inscription={props.inscription}
        selectedProduct={props.selectedProduct}
        isProductionReady={props.isProductionReady}
        onCreateMockOrder={props.onCreateMockOrder}
        onNavigate={props.onNavigate}
      />
    );
  }
  if (props.view === 'admin') {
    return <AdminPage orders={props.orders} />;
  }
  return <HomePage onNavigate={props.onNavigate} onLaunchProduct={props.onLaunchProduct} />;
}
