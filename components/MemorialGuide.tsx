import React from 'react';
import { productFamilies, merchantProducts } from '../services/commerce';

const sizes = [
  {
    productSlug: 'bench-plaques',
    href: '/bench-plaques',
    title: 'A short bench dedication',
    dimensions: '150 × 50 mm',
    copy: 'A compact format for a name, dates and a short line. Measure the flat part of the bench first.',
    link: 'Explore memorial bench plaques',
  },
  {
    productSlug: 'a5-brushed-steel-personalised-plaque',
    href: '/a5-brushed-steel-personalised-plaque',
    title: 'A name and a personal tribute',
    dimensions: 'A5 · 210 × 148 mm',
    copy: 'More space for a name, dates and a few lines of remembrance on a wall or in a garden.',
    link: 'View the A5 stainless steel option',
  },
  {
    productSlug: 'brushed-stainless-297x210-rect-plaque',
    href: '/brushed-stainless-297x210-rect-plaque',
    title: 'A longer family inscription',
    dimensions: 'A4 · 297 × 210 mm',
    copy: 'Room for a longer tribute or several names. Choose space over squeezing the lettering smaller.',
    link: 'View the A4 stainless steel option',
  },
];

export function MemorialSizes() {
  return (
    <section className="shop-section memorial-sizes" id="memorial-sizes" aria-labelledby="memorial-size-heading">
      <div className="shop-section-heading">
        <div><p className="shop-kicker">Start with the space and the words</p><h2 id="memorial-size-heading">Memorial plaque sizes & prices.</h2></div>
        <p>Measure the fixing area first.<br />Then choose room for the whole inscription.</p>
      </div>
      <div className="memorial-size-grid">
        {sizes.map(size => {
          const product = productFamilies.find(item => item.slug === size.productSlug)!;
          return (
            <article key={size.productSlug}>
              <p className="memorial-size-dimensions">{size.dimensions}</p>
              <h3>{size.title}</h3>
              <p>{size.copy}</p>
              <strong>{product.startingFrom}</strong>
              <a className="shop-text-link" href={size.href}>{size.link} ↗</a>
            </article>
          );
        })}
      </div>
      <p className="shop-smallprint">Prices shown are for brushed stainless steel without wood backing, including engraving, standard fixings and UK delivery. Changing the size, finish or backing can change the price.</p>
    </section>
  );
}

const inscriptions = [
  { title: 'A short remembrance', lines: ['In loving memory of', 'Alex Morgan', '1950–2024', 'Always in our hearts'] },
  { title: 'A family tribute', lines: ['Remembering', 'Jamie Taylor', 'A much-loved partner, parent and friend', 'Your kindness stays with us'] },
  { title: 'A favourite place', lines: ['For Sam', 'Who found peace in this garden', 'And joy in sharing it'] },
];

export function MemorialWording() {
  return (
    <section className="shop-section shop-wording-examples" id="memorial-wording" aria-labelledby="memorial-wording-heading">
      <p className="shop-kicker">Your words, at your own pace</p>
      <h2 id="memorial-wording-heading">Memorial plaque wording examples.</h2>
      <p>Start with the name as you want it remembered. Add dates if you wish, then a short dedication. These sample inscriptions are starting points, not customer commissions.</p>
      <div className="shop-inscription-grid">
        {inscriptions.map(example => (
          <article key={example.title}>
            <h3>{example.title}</h3>
            <blockquote>{example.lines.map((line, index) => <React.Fragment key={index}>{index > 0 && <br />}{line}</React.Fragment>)}</blockquote>
          </article>
        ))}
      </div>
      <div className="memorial-proof-help">
        <div><h3>Keep the message personal and readable.</h3><p>A nickname, a shared place or a simple quality can say more than a long paragraph. There is no fixed word count: the name length, font, plaque size and fixings all affect how much fits.</p></div>
        <div><h3>Check the proof with your family.</h3><p>Review names, dates and line breaks, then download the proof PDF to share. You can return to the design using its link. Approve one agreed version before payment and production.</p><a className="shop-text-link" href="/design-request">Prefer us to arrange your wording? ↗</a></div>
      </div>
    </section>
  );
}

export function MemorialMaterialLinks() {
  const brass = merchantProducts.find(item => item.slug === 'brushed-brass-210x148-rect-plaque')!;
  return (
    <p className="memorial-material-links">
      Compare <a href="/brass-plaques">brass plaque finishes</a> and <a href="/stainless-steel-plaques">stainless steel plaque finishes</a>, or view the <a href={`/${brass.slug}`}>A5 brushed brass plaque ({brass.startingFrom})</a>.
    </p>
  );
}
