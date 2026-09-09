import React from 'react';

export const aboutPage = {
  title: 'About InstaPlaque | The Business Behind Your Plaque',
  description: 'Meet the UK sole-trader business behind InstaPlaque and sister brand Portraits in Metal. Learn how free proofs and our illustrative design examples work.',
};

export function ShopAbout() {
  return (
    <div className="shopfront" data-prerendered="true">
      <section className="shop-section">
        <p className="shop-kicker">The business behind your plaque</p>
        <h1>Personal words,<br />made lasting.</h1>
        <p className="shop-intro">InstaPlaque helps you turn an inscription into a brass or stainless steel plaque, with a free online proof to check before you order.</p>
      </section>
      <section className="shop-section shop-buying-guide">
        <div>
          <h2>Start with the words.</h2>
          <p>A name on a garden bench, a dedication by a tree, or the date a new space opened. The layout should make those details easy to read.</p>
          <a className="shop-text-link" href="/how-it-works">How the free proof works ↗</a>
        </div>
        <div>
          <article><h3>Check the details before production</h3><p>Use the designer to choose a size and finish, add your wording and see the price. Review names, dates, spacing and fixings in the proof before approving your order. For unusual sizes or mounting, <a href="/contact">contact us</a> first.</p></article>
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
