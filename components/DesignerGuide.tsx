import React, { useEffect, useRef } from 'react';

// Shared by the interactive page and its initial HTML, including metadata.
export const designerPage = {
  title: 'Design Your Own Plaque Online | Free Proof | InstaPlaque',
  description: 'Design your own brass or stainless steel plaque online. Choose size and wording, preview the layout and download a free proof. UK delivery included.',
  heading: 'Design your own plaque online',
  schema: [
    {
      '@type': 'WebApplication',
      '@id': 'https://instaplaque.co.uk/design#designer',
      url: 'https://instaplaque.co.uk/design',
      name: 'InstaPlaque online plaque designer',
      description: 'Design a custom plaque and review a free proof before ordering the finished plaque.',
      applicationCategory: 'DesignApplication',
      operatingSystem: 'Web',
      browserRequirements: 'Requires JavaScript and a modern web browser.',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', name: 'Online plaque design and proof', price: '0', priceCurrency: 'GBP' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://instaplaque.co.uk/' },
        { '@type': 'ListItem', position: 2, name: 'Plaque designer', item: 'https://instaplaque.co.uk/design' },
      ],
    },
  ],
};

const examples = [
  {
    href: '/memorial-plaques',
    title: 'Memorial plaques',
    image: '/site-images/home-gallery-aged-brass-wood.webp',
    alt: 'Aged brass memorial plaque example with a name, dates and dedication on a wooden backing',
    description: 'Give the name room to stand out, followed by dates and a personal dedication.',
  },
  {
    href: '/bench-plaques',
    title: 'Bench plaques',
    image: '/site-images/home-gallery-brass-bench.webp',
    alt: 'Rectangular brass bench plaque example with a short memorial inscription and screw fixings',
    description: 'Keep a compact bench inscription short and leave space around the fixings.',
  },
  {
    href: '/custom-plaques',
    title: 'Custom shapes and sizes',
    image: '/site-images/home-gallery-oval-steel.webp',
    alt: 'Oval stainless steel plaque example with centred lettering and two screw fixings',
    description: 'Try an oval, circle or custom size, checking the available space for your wording.',
  },
];

const questions = [
  {
    question: 'Is the online plaque designer free?',
    answer: 'Yes. You can design and review a proof without an account or a payment. You only pay when you approve a design and order the finished plaque; making a proof does not place an order.',
  },
  {
    question: 'Can I design a memorial or garden plaque?',
    answer: 'Yes. Add the name, dates and dedication, then choose a suitable size and finish. For a bench, keep the wording concise. For a longer tribute, try a larger rectangle so the lettering has room to breathe.',
  },
  {
    question: 'Can I download the proof and come back later?',
    answer: 'Yes. Download the proof PDF to review or share before ordering. The PDF includes a return link to your design. Check the wording with everyone involved before approving the final version.',
  },
  {
    question: 'Can I change the lettering and layout?',
    answer: 'Yes. Enter your own wording, create a layout and review the preview. You can make adjustments before approving it. Always check spelling, dates, line breaks and the space around borders and fixings.',
  },
  {
    question: 'Will I see the price before ordering?',
    answer: 'Standard plaque prices update in the designer, including engraving, standard fixings and UK delivery. Selected extras are priced before checkout. Designs needing a bespoke quote are checked before payment; the free proof is not a promise of a fixed price for every configuration.',
  },
];

export function DesignerGuide() {
  return (
    <article id="plaque-design-guide" className="designer-guide no-print" aria-labelledby="designer-guide-heading" tabIndex={-1} data-prerendered="true">
      <nav className="designer-guide-breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a><span aria-hidden="true"> / </span><span aria-current="page">Plaque designer</span>
      </nav>
      <h1 id="designer-guide-heading">{designerPage.heading}</h1>
      <p className="designer-guide-intro">Create a custom brass or stainless steel plaque with your own wording. Choose the size, finish and fixings, then review a free online proof before you order. No account or payment is needed to try a design.</p>

      <section className="designer-guide-faqs" aria-labelledby="designer-faq-heading">
        <h2 id="designer-faq-heading">Plaque designer questions</h2>
        {questions.map(({ question, answer }) => (
          <details key={question}><summary>{question}</summary><p>{answer}</p></details>
        ))}
      </section>

      <details className="designer-guide-more">
        <summary>Design tips and examples</summary>
        <div>

      <section aria-labelledby="designer-how-heading">
        <h2 id="designer-how-heading">From your words to an approved proof</h2>
        <ol className="designer-guide-steps">
          <li><h3>Choose a size and material</h3><p>Measure the space where the plaque will go. A compact bench format suits a short dedication; A5 or A4 gives longer wording more room. Pick a brass or stainless steel finish, then check the shape, border and fixing options.</p></li>
          <li><h3>Add your wording and check the layout</h3><p>Enter names, dates and your message exactly as you want them. Review the lettering in the preview and adjust it until the important words stand out. Check readability as well as whether everything fits.</p></li>
          <li><h3>Review, download and approve</h3><p>Use the proof PDF to check the design or share it with family or colleagues. Confirm every word, size and option before approval. Standard prices and the production estimate are shown before checkout.</p></li>
        </ol>
      </section>

      <section aria-labelledby="designer-examples-heading">
        <h2 id="designer-examples-heading">Ideas for your plaque design</h2>
        <p>These illustrative examples show different layouts and finishes. Your own proof will use the wording and options you choose.</p>
        <div className="designer-guide-examples">
          {examples.map(example => (
            <figure key={example.href}>
              <img src={example.image} alt={example.alt} width="1200" height="1200" loading="lazy" decoding="async" />
              <figcaption><h3><a href={example.href}>{example.title}</a></h3><p>{example.description}</p></figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section aria-labelledby="designer-materials-heading">
        <h2 id="designer-materials-heading">Choose a finish for its setting</h2>
        <p><a href="/brass-plaques">Brass plaques</a> have a warm, traditional appearance; <a href="/stainless-steel-plaques">stainless steel plaques</a> offer a cooler, contemporary finish. Compare the available finishes and optional backing in the <a href="/materials">plaque materials guide</a>. For outdoor use, consider the mounting surface and suitable fixings as well as the metal.</p>
        <p>For more layout ideas, explore <a href="/garden-plaques">garden plaques</a> or <a href="/opening-plaques">building opening plaques</a>. If you would prefer help arranging your wording, you can <a href="/design-request">ask us to design your plaque</a>.</p>
      </section>

        </div>
      </details>
    </article>
  );
}

export function DesignerGuideDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const startedOnBackdrop = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      // Native modal semantics make the workbench inert and restore opener focus.
      dialog.showModal();
      if (contentRef.current) contentRef.current.scrollTop = 0;
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const isBackdrop = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target !== event.currentTarget) return false;
    const rect = event.currentTarget.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right
      || event.clientY < rect.top || event.clientY > rect.bottom;
  };

  return (
    <dialog
      ref={dialogRef}
      id="designer-guide-dialog"
      className="designer-guide-dialog no-print"
      aria-labelledby="designer-guide-dialog-title"
      onClose={onClose}
      onPointerDown={event => { startedOnBackdrop.current = isBackdrop(event); }}
      onClick={event => {
        if (startedOnBackdrop.current && isBackdrop(event)) onClose();
        startedOnBackdrop.current = false;
      }}
    >
      <div className="designer-guide-dialog-header">
        <h2 id="designer-guide-dialog-title">Guide &amp; FAQs</h2>
        <button type="button" autoFocus onClick={onClose} aria-label="Close guide">
          Close <span aria-hidden="true">×</span>
        </button>
      </div>
      <div ref={contentRef} className="designer-guide-dialog-content">
        <DesignerGuide />
      </div>
      <div className="designer-guide-dialog-footer">
        <button type="button" className="designer-guide-return" onClick={onClose}>Back to your design</button>
      </div>
    </dialog>
  );
}
