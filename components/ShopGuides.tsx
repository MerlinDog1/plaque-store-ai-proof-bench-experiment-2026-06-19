import React from 'react';
import { businessContact, productionTiming } from '../services/shopInformation';

export function ProductionNote() {
  return (
    <aside className="shop-production-note" aria-label="Production estimate">
      <strong>{productionTiming.summary}</strong>
      <p>{productionTiming.qualification}</p>
      <a href="/how-it-works#production-delivery">Production & delivery details</a>
    </aside>
  );
}

export function ShopTurnaround() {
  return (
    <section className="shop-section shop-buying-guide" id="production-delivery">
      <div>
        <p className="shop-kicker">Plan your order</p>
        <h2>Production & delivery.</h2>
        <p>Allow time to check your proof, make the plaque and deliver it. The production clock starts after both proof approval and payment.</p>
        <a className="shop-text-link" href="/contact">Check a ceremony or event date ↗</a>
      </div>
      <div>
        <dl className="shop-timing-list">
          <div><dt>Standard size and finish</dt><dd>Estimated 5 working days</dd></div>
          <div><dt>Standard size in aged brass</dt><dd>Estimated 7 working days</dd></div>
          <div><dt>A4 or A5 with wood backing</dt><dd>Estimated 10 working days</dd></div>
          <div><dt>Custom sizes and other wood-backed plaques</dt><dd>Estimated 15 working days</dd></div>
        </dl>
        <p>The designer shows the estimate for your selected combination before checkout. These are production estimates; delivery time is additional.</p>
        <article><h3>UK mainland delivery is included</h3><p>Standard plaque prices include engraving, standard fixings and UK mainland delivery. Highlands, islands and non-UK destinations may incur extra charges; contact us with your postcode before ordering.</p></article>
        <article><h3>Ordering for an opening or ceremony?</h3><p>Send your required arrival date, delivery postcode, size and wording before placing the order. Allow time for everyone involved to approve the proof. A production estimate is not a guaranteed event delivery date.</p></article>
      </div>
    </section>
  );
}

export function ShopContact() {
  return (
    <div className="shopfront" data-prerendered="true">
      <section className="shop-section shop-contact">
        <div>
          <p className="shop-kicker">Help with your plaque</p>
          <h1>Contact<br />InstaPlaque.</h1>
          <p className="shop-intro">Need help choosing a size, checking an order or planning for an opening? Contact InstaPlaque with the details below.</p>
          <dl className="shop-contact-details">
            <div><dt>Email</dt><dd><a href={`mailto:${businessContact.email}`}>{businessContact.email}</a></dd></div>
            <div><dt>Phone</dt><dd><a href={businessContact.phoneHref}>{businessContact.phone}</a></dd></div>
            <div><dt>Business address</dt><dd><address>{businessContact.address}</address></dd></div>
          </dl>
        </div>
        <div className="shop-contact-help">
          <article><h2>For a new plaque</h2><p>Send your wording, approximate size, preferred material and where the plaque will be fitted. If you have a fixed event date, include the date you need it to arrive and your delivery postcode.</p></article>
          <article><h2>For an existing order</h2><p>Include your order number and the email address used at checkout. If you need a wording change, contact us as soon as possible so we can check whether production has started.</p></article>
          <article><h2>Ready to try a layout?</h2><p>The online designer is free to use. See the price, check the layout and download your proof PDF before you pay.</p><a className="shop-text-link" href="/design">Open the plaque designer ↗</a></article>
          <p className="shop-smallprint">{businessContact.tradingName} is operated as a {businessContact.legalForm}. Not VAT registered.</p>
        </div>
      </section>
    </div>
  );
}

export function PlaqueWordingExamples({ slug }: { slug: string }) {
  const isBench = slug === 'bench-plaques';
  const examples = isBench ? [
    { title: 'A short remembrance', lines: ['In loving memory of', 'Margaret Ellis', '1942–2024', 'Always in our hearts'] },
    { title: 'A favourite place', lines: ['For David', 'Who loved this view', 'And everyone who shared it'] },
  ] : [
    { title: 'A building opening', lines: ['RIVERSIDE COMMUNITY CENTRE', 'Officially opened by', '[Name and title]', 'on [Day Month Year]'] },
    { title: 'Recognising support', lines: ['THE READING GARDEN', 'Created with the generous support of', '[Supporter or organisation]', 'Opened on [Day Month Year]'] },
  ];
  return (
    <section className="shop-section shop-wording-examples">
      <p className="shop-kicker">A starting point for your inscription</p>
      <h2>{isBench ? 'Bench plaque wording examples.' : 'Opening plaque wording examples.'}</h2>
      <p>These are sample inscriptions. Replace the names and details with your own, then check the line breaks and text size in the designer.</p>
      <div className="shop-inscription-grid shop-inscription-grid-two">
        {examples.map(example => <article key={example.title}><h3>{example.title}</h3><blockquote>{example.lines.map((line, index) => <React.Fragment key={index}>{index > 0 && <br />}{line}</React.Fragment>)}</blockquote></article>)}
      </div>
      <p>{isBench ? 'Measure the bench first. If a name or message needs more space, shorten the wording or choose a larger plaque that fits the available surface.' : 'Before approval, confirm the official venue name, spelling, titles, contributor names and ceremony date with everyone responsible for the inscription.'}</p>
      <a className="shop-text-link" href={isBench ? '/design' : '/contact'}>{isBench ? 'Try your wording in the designer ↗' : 'Discuss a deadline or artwork requirement ↗'}</a>
    </section>
  );
}

export const aboutPage = {
  title: 'About InstaPlaque | The Business Behind Your Plaque',
  description: 'Meet the UK sole-trader business behind InstaPlaque and sister brand Portraits in Metal. Learn how free proofs and our illustrative design examples work.',
};

export function ShopAbout() {
  return (
    <div className="shopfront" data-prerendered="true">
      <section className="shop-section">
        <p className="shop-kicker">The business behind your plaque</p>
        <h1>Your plaque,<br />from words to order.</h1>
        <p className="shop-intro">InstaPlaque is a UK sole-trader business based in Kettering. Design a brass or stainless steel inscription plaque online, with a free proof and a clear price before you pay.</p>
      </section>
      <section className="shop-section shop-buying-guide">
        <div>
          <h2>A clear way to order.</h2>
          <p>Personal wording deserves a careful check. Our online designer lets you work on the inscription at your own pace, without an account or an obligation to buy.</p>
          <a className="shop-text-link" href="/how-it-works">How the free proof works ↗</a>
        </div>
        <div>
          <article><h3>Check the details before production</h3><p>Use the designer to choose a size and finish, add your wording and see the price. Review names, dates, spacing and fixings in the proof before approving your order. For unusual sizes or mounting, <a href="/contact">contact us</a> first.</p></article>
          <article><h3>Know the price and production estimate</h3><p>Standard prices include engraving, standard fixings and UK mainland delivery. Selected finishes and backing are priced before checkout, alongside the production estimate. You can download your proof PDF and use its return link when you are ready.</p></article>
          <article><h3>What the example images show</h3><p>Our images are illustrative design examples, including AI-generated visualisations. They show possible layouts and settings; they are not photographs of completed customer orders. Finishes and optional backing are confirmed through your proof and order.</p></article>
        </div>
      </section>
      <section className="shop-section shop-buying-guide">
        <div><p className="shop-kicker">Two ways to make it personal</p><h2>Our sister brand,<br />Portraits in Metal.</h2></div>
        <div>
          <p>InstaPlaque is for designing your own inscription plaque. <a href="https://portraitsinmetal.com/about">Portraits in Metal</a> focuses on portraits of people and pets, made from a photograph with a carefully arranged inscription.</p>
          <p>Portraits in Metal is currently a preview of the forthcoming service. You can <a href="https://portraitsinmetal.com/gallery">explore its portrait plaque design examples</a> while we prepare it for orders.</p>
          <p>Both brands are operated by the same UK sole-trader business at 4 Dunkirk Avenue, Kettering, NN14 2PL, United Kingdom. We are not VAT registered.</p>
          <a className="shop-text-link" href="/contact">Contact InstaPlaque ↗</a>
        </div>
      </section>
    </div>
  );
}

export function GardenAdvice() {
  const inscriptions = [
    { title: 'A short bench dedication', size: 'Start with a bench size', lines: ['In memory of Margaret Ellis', '1942–2024', 'Always happiest in the garden'] },
    { title: 'A longer family tribute', size: 'Start with A5', lines: ['In loving memory of', 'David Thompson', '1951–2023', 'A much-loved husband, dad and grandad.', 'We remember you here,', 'in the garden you loved.'] },
    { title: 'A community tree dedication', size: 'Consider A5 or A4', lines: ['This oak was planted', 'to celebrate fifty years', 'of our community garden.', 'With thanks to everyone', 'who has helped it grow.', '1976–2026'] },
  ];
  return (
    <>
      <section className="shop-section shop-buying-guide">
        <div><p className="shop-kicker">A place for the plaque</p><h2>Plan the mounting<br />before the wording.</h2><p>The setting decides how much room you have and how close someone can get to read it.</p></div>
        <div>
          <article><h3>On a bench, wall or timber support</h3><p>Measure the flat fixing area, including any narrow bench slats. Keep holes away from joints and edges. Standard fixings are included; tell us what you are mounting to so the fixing arrangement can be checked. A wall or a separate timber support can give a tree dedication a clear place without fastening the plaque to the living tree.</p></article>
          <article><h3>At a shared garden or public bench</h3><p>Ask whoever manages the site for their permitted dimensions and mounting position before designing. Put the plaque where planting will not cover the inscription, and leave access for cleaning. If you have an existing bracket or support, send its dimensions with your enquiry.</p></article>
          <article><h3>Looking after the finish</h3><p>Care depends on the selected finish. Check the care instructions before using polish or abrasive cleaners, especially on a sealed, aged or coated surface. Ask us about the intended location before ordering if it is particularly exposed or near the sea.</p><a className="shop-text-link" href="/materials">Compare brass, steel and backing options ↗</a></article>
        </div>
      </section>
      <section className="shop-section shop-wording-examples">
        <p className="shop-kicker">Words to make your own</p>
        <h2>Garden plaque wording examples.</h2>
        <p>These are sample inscriptions, not customer commissions. Change the names and wording, then use the proof to check the fit.</p>
        <div className="shop-inscription-grid">
          {inscriptions.map(example => <article key={example.title}><h3>{example.title}</h3><p className="shop-smallprint">{example.size}</p><blockquote>{example.lines.map((line, index) => <React.Fragment key={index}>{index > 0 && <br />}{line}</React.Fragment>)}</blockquote></article>)}
        </div>
        <p>Marking the opening of a garden, school space or community project? Our <a href="/opening-plaques">opening plaque guide</a> covers formal names, roles and ceremony dates.</p>
      </section>
    </>
  );
}

export function CollectionLinks({ slug }: { slug: string }) {
  return (
    <section className="shop-section shop-collection-advice">
      <h2>A little help choosing.</h2>
      <p>Compare the <a href="/materials">brass and stainless steel finishes</a> before choosing a material. {slug === 'opening-plaques' ? <>Once the inscription is agreed, <a href="/how-it-works">check how the free proof and approval process works</a> before arranging your ceremony.</> : <>For a ceremony, building dedication or a list of contributors, see <a href="/opening-plaques">opening plaques and formal inscriptions</a>.</>}</p>
      {['memorial-plaques', 'garden-plaques'].includes(slug) && <p>Looking for a portrait made from a favourite photograph? <a href="https://portraitsinmetal.com/gallery">Explore the portrait plaque examples at Portraits in Metal</a>, our sister brand. Its portrait service is currently in preview.</p>}
    </section>
  );
}
