import React from 'react';
import { ContactLink, MobileContactBar, WhatsAppIcon } from './ContactOptions';
import { AiConceptPair, HomeQualitySection, ProofPdfShowcase, featureImageVersion, sampleProofPdf } from './FeatureSections';
import { TrackedPrice, displayedPriceValue } from './TrackedPrice';
import { merchantProducts } from '../services/commerce';
import { ShopFaq } from './Shopfront';
import { portraitsInMetalLink } from '../services/shopInformation';

// Portrait plaques and AI-design pages (owner msg 5178).

export const portraitPage = {
  title: 'Portrait Plaques UK | Engraved From Your Photo | InstaPlaque',
  description: 'Turn a favourite photo of a person or pet into an engraved brass or stainless steel portrait plaque. Free portrait sketch and proof before you pay. Made in the UK.',
};

export const aiDesignPage = {
  title: 'Turn Your AI Plaque Design Into a Real Plaque | InstaPlaque',
  description: 'Made a plaque design in ChatGPT or another AI tool? We redraw it for engraving, send a dimensioned proof PDF and make it in brass or stainless steel.',
};

export const portraitFaqs = [
  {
    question: 'Can you make a plaque from a photo of my pet?',
    answer: 'Yes. Dogs, cats, horses, rabbits, birds and other companions all work well. Send a clear photo and we turn it into detailed engraving artwork, then arrange their name and your words around it.',
  },
  {
    question: 'What kind of photo works best?',
    answer: 'Choose a photo where the eyes and face are easy to see, in good light, and send the original file rather than a screenshot. An older or less-than-perfect photo can still work, so send the one you love.',
  },
  {
    question: 'Is the portrait printed or engraved?',
    answer: 'Engraved. The portrait is etched into solid brass or stainless steel and paint-filled by hand, so the fine lines have depth. Nothing is printed on.',
  },
  {
    question: 'Can I add names, dates and a message?',
    answer: 'Yes. Add a name, dates, a short tribute or the details of an award. We arrange the portrait and wording together and show you the complete layout before you decide.',
  },
  {
    question: 'How much does a portrait plaque cost?',
    answer: 'A5 portrait plaques start from £95.50, with UK delivery included. Larger sizes, wood backing and freestanding styles cost more. Your free sketch comes with an exact quote, and you only pay once you approve the design.',
  },
  {
    question: 'How long does a portrait plaque take?',
    answer: 'Once you approve the design and pay, portrait plaques are normally dispatched within 5 to 10 working days.',
  },
];

export const aiDesignFaqs = [
  {
    question: 'Can you make a real plaque from a ChatGPT design?',
    answer: 'Yes. Send us the image and we redraw it as engraving artwork with real fonts and clean lines, sized to fit. You see a proof of exactly what we will make before you pay.',
  },
  {
    question: 'Will it look exactly like my AI picture?',
    answer: 'It keeps your layout, wording and style, but it is redrawn for metal. Glowing light, 3D effects and raised details become crisp engraved lines, and any jumbled or misspelt AI text is corrected. Your proof shows every change.',
  },
  {
    question: 'Which AI tools can I use?',
    answer: 'Any of them: ChatGPT, Gemini, Copilot, Midjourney, Canva or even a sketch on paper. A screenshot is fine, and you do not need a vector file.',
  },
  {
    question: 'What should I send with my design?',
    answer: 'The image, the exact wording typed out (AI images often garble letters), roughly what size you would like and where the plaque will go. A photo of the spot helps us suggest the right size and fixings.',
  },
  {
    question: 'How much does it cost?',
    answer: 'Standard sizes are priced like our other plaques: bench plaques from £58.50, A5 from £95.50 and A4 from £145, including engraving, standard fixings and UK delivery. Larger sizes and some finishes cost more, and we confirm the price with your proof before you pay.',
  },
  {
    question: 'Is the proof free?',
    answer: 'Yes. Your proof is free, with no obligation to order. Ask for changes until it is right, then approve and pay.',
  },
];

const site = 'https://instaplaque.co.uk';
const serviceSchema = (path: string, name: string, serviceType: string, description: string, image: string) => ({
  '@type': 'Service',
  '@id': `${site}${path}#service`,
  name,
  serviceType,
  description,
  url: `${site}${path}`,
  image: `${site}${image}`,
  areaServed: { '@type': 'Country', name: 'United Kingdom' },
  provider: { '@id': `${site}/#organization` },
});
const breadcrumb = (path: string, name: string) => ({
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: site },
    { '@type': 'ListItem', position: 2, name, item: `${site}${path}` },
  ],
});
// FAQPage is added from the visible questions wherever the page is rendered.
export const portraitSchema = [
  serviceSchema('/portrait-plaques', 'Portrait plaques engraved from your photo', 'Engraved portrait plaques', portraitPage.description, '/site-images/portraits/pim-millie-detail-1200.webp'),
  breadcrumb('/portrait-plaques', 'Portrait plaques'),
];
export const aiDesignSchema = [
  serviceSchema('/ai-plaque-design', 'AI plaque design made into a real plaque', 'Plaque design and engraving from AI images', aiDesignPage.description, '/site-images/ai/ai-real-memorial-1200.webp'),
  breadcrumb('/ai-plaque-design', 'AI plaque design'),
];

const pim = (path: string, content: string) => portraitsInMetalLink(path, 'portrait_page', content);

const portraitSteps = [
  { src: '/site-images/portraits/pim-millie-photo.webp', width: 600, height: 800, alt: 'Millie’s original photograph: a long-haired cat sitting on a bed', title: '1. Your photo', copy: 'Any favourite photo where the face is clear.' },
  { src: '/site-images/portraits/pim-millie-artwork.webp', width: 740, height: 1050, alt: 'The line engraving artwork drawn from Millie’s photo, with her name and a short tribute', title: '2. Our artwork', copy: 'Fur, eyes and expression redrawn as fine engraved lines, with your words.' },
  { src: '/site-images/portraits/pim-millie-plaque.webp', width: 720, height: 1280, alt: 'The same portrait engraved on Millie’s finished metal plaque, photographed', title: '3. Your plaque', copy: 'Etched into brass or stainless steel and paint-filled by hand.' },
];

const portraitGallery = [
  { file: 'thomas-polished-steel', width: 480, height: 679, title: 'Family memorial', detail: 'Polished stainless steel', alt: 'Family memorial plaque for Thomas with an engraved portrait, in polished stainless steel on stone' },
  { file: 'alfie-polished-brass', width: 480, height: 680, title: 'Dog memorial', detail: 'Polished brass on light oak', alt: 'Spaniel portrait memorial plaque for Alfie in polished brass on light oak' },
  { file: 'lily-brushed-steel', width: 480, height: 640, title: 'Cat portrait', detail: 'Brushed stainless steel', alt: 'Portrait of Lily the tabby-and-white cat above a family inscription on brushed stainless steel' },
  { file: 'nell-orbital-brass', width: 480, height: 680, title: 'Sleeping cat', detail: 'Orbital brass on mahogany', alt: 'Full sleeping-cat portrait of Nell on orbital brass with a mahogany board' },
  { file: 'anne-mahogany-easel', width: 480, height: 360, title: 'On an easel stand', detail: 'Polished steel, dark mahogany', alt: 'Memorial portrait plaque for Anne in polished stainless steel on a dark mahogany easel stand' },
  { file: 'willow-aged-brass', width: 480, height: 360, title: 'Horse nameplate', detail: 'Aged brass on mahogany', alt: 'Stable nameplate with an engraved horse head for Willowbrook Belle, in aged brass on dark mahogany' },
  { file: 'ruby-folded-steel', width: 480, height: 360, title: 'Freestanding', detail: 'Folded brushed steel', alt: 'Freestanding folded stainless steel portrait plaque of Ruby the Siamese cat on a windowsill' },
];

// Portrait plaques photographed in place: tree plaques with portraits drawn by Portraits in Metal's own process
// (owner msgs 5816 and 5830), also shown on the memorial and tree pages.
const portraitsInPlace = [
  { src: '/site-images/memorial/portrait-george.webp', alt: 'Brass memorial plaque with an engraved portrait of George Hartley, on an oak board and stake beside a young tree in autumn', caption: 'George · brass, by a young tree' },
  { src: '/site-images/memorial/portrait-joan.webp', alt: 'Stainless steel memorial plaque with an engraved portrait of Joan Whitfield and a short poem, beside a cherry tree in blossom', caption: 'Joan · stainless steel, with a poem' },
  { src: '/site-images/memorial/portrait-bramble.webp', alt: 'Brass pet memorial plaque with an engraved portrait of Bramble the spaniel, on an oak board beside a silver birch', caption: 'Bramble · for a much-loved dog' },
  { src: '/site-images/memorial/portrait-ron-pat.webp', alt: 'Stainless steel memorial plaque with an engraved portrait of Ron and Pat Coleman, under an apple tree in blossom', caption: 'Ron & Pat · together again' },
];
const portraitFrom = merchantProducts.find(item => item.slug === 'a5-brushed-steel-personalised-plaque')?.startingFrom || '£95.50';

export function ShopPortraitPlaques() {
  return (
    <div className="shopfront" data-prerendered="true">
      <div className="shop-breadcrumb">
        <a href="/">Home</a>
        <span>/</span>
        <span>Portrait plaques</span>
      </div>
      <section className="shop-feature-hero">
        <div className="shop-feature-hero-copy">
          <p className="shop-kicker">Free portrait sketch · Made in the UK</p>
          <h1>Personalised portrait plaques</h1>
          <p className="shop-hero-tagline">A favourite face, <em>engraved in metal.</em></p>
          <p className="shop-intro">
            Send us a favourite photo of a person or pet. Using our Portraits in Metal technology, we turn it into
            fine engraving artwork, arrange your words around it and send you a free sketch and proof before you pay.
          </p>
          {/* The price on the first screen, like the other category pages (owner msg 5927). */}
          <p className="cat-hero-buy">
            <strong className="shop-product-price">
              <TrackedPrice value={displayedPriceValue(portraitFrom)} product="portrait-plaques">from {portraitFrom}</TrackedPrice>
            </strong>
            <span>A5 portrait plaque, with your free sketch, engraving and UK delivery</span>
          </p>
          <div className="shop-hero-choices">
            <ContactLink channel="whatsapp" placement="hero" className="shop-button shop-hero-choice-whatsapp">
              <WhatsAppIcon /> WhatsApp your photo
            </ContactLink>
            <ContactLink channel="email" placement="hero" className="shop-button">Email your photo</ContactLink>
          </div>
          <p className="shop-hero-note">
            Brass or stainless steel · A5, A4 and A3 · Prefer to upload it? <a href={pim('/free-proof', 'hero_free_sketch')}>Request a free sketch online</a>
          </p>
        </div>
        <figure className="shop-feature-hero-image">
          <img src="/site-images/portraits/pim-millie-detail-1200.webp" width="1200" height="675" fetchPriority="high"
            alt="Close-up photograph of Millie the cat’s portrait engraved in brushed metal, showing fine fur lines and whiskers" />
          <figcaption>Millie · a real engraving, photographed up close</figcaption>
        </figure>
      </section>

      <section className="shop-section shop-portrait-process" aria-labelledby="portrait-process-heading">
        <p className="shop-kicker">From photo to plaque</p>
        <h2 id="portrait-process-heading">Your photo, our artwork, real metal.</h2>
        <p className="shop-section-lead">This is Millie: her owner’s everyday photo, the engraving artwork drawn from it, and the finished plaque. Real photographs, not mock-ups.</p>
        <ol className="shop-portrait-steps">
          {portraitSteps.map(step => (
            <li key={step.src}>
              <img src={step.src} width={step.width} height={step.height} alt={step.alt} loading="lazy" />
              <strong>{step.title}</strong>
              <span>{step.copy}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="shop-section shop-portrait-gallery" aria-labelledby="portrait-gallery-heading">
        <p className="shop-kicker">People and pets</p>
        <h2 id="portrait-gallery-heading">Portraits for every kind of tribute.</h2>
        <p className="shop-section-lead">Memorials for loved ones, pets and horses, award plaques and keepsakes, on the wall or freestanding.</p>
        <div className="shop-portrait-grid">
          {portraitGallery.map(example => (
            <figure key={example.file}>
              <img
                src={`/site-images/portraits/pim-${example.file}-480.webp`}
                srcSet={`/site-images/portraits/pim-${example.file}-480.webp 480w, /site-images/portraits/pim-${example.file}-1024.webp 1024w`}
                sizes="(max-width: 720px) 46vw, 300px"
                width={example.width}
                height={example.height}
                alt={example.alt}
                loading="lazy"
              />
              <figcaption><strong>{example.title}</strong>{example.detail}</figcaption>
            </figure>
          ))}
        </div>
        <p className="shop-smallprint">
          Your plaque is drawn from your own photo. <a href={pim('/gallery', 'gallery_link')}>See more portrait designs ↗</a>
        </p>
      </section>

      <section className="shop-section cat-portraits" aria-labelledby="portrait-place-heading">
        <p className="shop-kicker">In place</p>
        <h2 id="portrait-place-heading">Portrait plaques beside a memorial tree.</h2>
        <p className="cat-section-intro">On an oak board and ground stake, a portrait plaque stands beside a tree planted for them. <a href="/tree-memorial-plaques">See memorial tree plaques</a>.</p>
        <div className="cat-scroll-row cat-portraits-row">
          {portraitsInPlace.map(card => (
            <figure key={card.src}>
              <img src={card.src} alt={card.alt} width="600" height="600" loading="lazy" decoding="async" />
              <figcaption>{card.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <HomeQualitySection compact />

      <section className="shop-section shop-buying-guide" aria-labelledby="portrait-options-heading">
        <div>
          <p className="shop-kicker">Sizes, finishes and display</p>
          <h2 id="portrait-options-heading">Made for the place you’ll see it.</h2>
          <a className="shop-text-link" href="/materials">Compare the finishes ↗</a>
        </div>
        <div>
          <article><h3>Three sizes</h3><p>A5 (210 × 148 mm), A4 (297 × 210 mm) or A3 (420 × 297 mm), in portrait or landscape. A full-length portrait or longer wording needs more room, and your sketch shows how it fits.</p></article>
          <article><h3>Six metal finishes</h3><p>Brushed, polished, aged or orbital brass, or brushed or polished stainless steel, all in 1.5 mm solid metal.</p></article>
          <article><h3>On the wall or freestanding</h3><p>Fix it to a wall with matching screw caps, mount it on oak or mahogany backing, or choose a freestanding folded plaque or a rear easel stand for a shelf or windowsill.</p></article>
          <article><h3>Price</h3><p>A5 portrait plaques start from £95.50, with UK delivery included. Your free sketch comes with an exact quote, and you only pay once you approve.</p></article>
        </div>
      </section>

      <section className="shop-section shop-photo-tips" aria-labelledby="portrait-photo-heading">
        <p className="shop-kicker">Choosing a photo</p>
        <h2 id="portrait-photo-heading">The photo that feels most like them.</h2>
        <div className="shop-tips">
          <article><h3>A clear face</h3><p>Look for a photo where the eyes and face are easy to see. Their expression matters more than a perfect pose.</p></article>
          <article><h3>Good light</h3><p>Daylight with few deep shadows or bright reflections gives us the most detail to work with.</p></article>
          <article><h3>The original file</h3><p>Send the full-size photo rather than a screenshot or social media copy. There is no need to crop it or make it black and white.</p></article>
        </div>
        <p className="shop-section-lead">Only have one treasured photo, even an old or blurry one? Send it anyway. You can see your free sketch, ask for changes and take your time deciding.</p>
      </section>

      <ShopFaq faqs={portraitFaqs} />

      <section className="shop-closing">
        <p className="shop-kicker">Start with a favourite photo</p>
        <h2>Keep them close.</h2>
        <p>Send us a photo today. Your sketch is free, with no obligation to order.</p>
        <div className="shop-closing-choices">
          <ContactLink channel="whatsapp" placement="page" className="shop-button shop-hero-choice-whatsapp shop-whatsapp-button">
            <WhatsAppIcon /> Send your photo
          </ContactLink>
        </div>
        <p className="shop-closing-alt">More portrait designs at <a href={pim('/', 'closing_link')}>portraitsinmetal.com ↗</a></p>
      </section>
      <MobileContactBar showDesign={false} />
    </div>
  );
}

const aiSteps = [
  { title: 'Send us your design', copy: 'The AI picture, your exact wording typed out, and roughly what size and where it’s going.' },
  { title: 'We redraw it for metal', copy: 'Real fonts, clean engraved lines and correct spelling, keeping the look you chose.' },
  { title: 'You check a proof PDF', copy: 'Every measurement, the fixings and the finish, on a proof you can share and approve.' },
  { title: 'We make it and deliver it', copy: 'Engraved in brass or stainless steel and delivered, with UK delivery included.' },
];

const aiChanges = [
  ['3D roses, raised lettering and embossing', 'Crisp engraved line detail, filled black'],
  ['Glows, shadows and gradients', 'Clean metal with sharp engraved lines'],
  ['Garbled or invented AI lettering', 'Your exact wording, spelt correctly in a real font'],
  ['No real size', 'A real size, with room for the fixings'],
];

export function ShopAiDesign() {
  return (
    <div className="shopfront" data-prerendered="true">
      <div className="shop-breadcrumb">
        <a href="/">Home</a>
        <span>/</span>
        <span>AI plaque design</span>
      </div>
      <section className="shop-feature-hero">
        <div className="shop-feature-hero-copy">
          <p className="shop-kicker">ChatGPT · Gemini · Midjourney · any AI tool</p>
          <h1>Turn your AI design into a real plaque</h1>
          <p className="shop-hero-tagline">Your concept, <em>engraved in metal.</em></p>
          <p className="shop-intro">
            Made a plaque design with ChatGPT or another AI tool? Send us the picture. We redraw it as clean engraving
            artwork, fix anything metal can’t do and send you a proof PDF with every measurement to approve before you pay.
          </p>
          <div className="shop-hero-choices">
            <ContactLink channel="whatsapp" placement="hero" className="shop-button shop-hero-choice-whatsapp">
              <WhatsAppIcon /> WhatsApp your design
            </ContactLink>
            <a className="shop-button" href="/design-request">Upload it with our form</a>
          </div>
          <p className="shop-hero-note">
            Free proof · No obligation · Or <ContactLink channel="email" placement="hero">email us your design</ContactLink>
          </p>
        </div>
        <div className="shop-feature-hero-pair">
          <AiConceptPair size={1200} />
        </div>
      </section>

      <section className="shop-process" aria-labelledby="ai-steps-heading">
        <div className="shop-section">
          <div className="shop-section-heading">
            <div>
              <p className="shop-kicker">How it works</p>
              <h2 id="ai-steps-heading">From concept to plaque in four steps.</h2>
            </div>
          </div>
          <div className="shop-steps shop-steps-four">
            {aiSteps.map((step, index) => (
              <article key={step.title}>
                <span className="shop-step-number">0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="shop-section shop-ai-changes" aria-labelledby="ai-changes-heading">
        <div>
          <p className="shop-kicker">What changes, and why</p>
          <h2 id="ai-changes-heading">AI images aren’t production files. We make them real.</h2>
          <p>An AI picture shows the idea, not something a workshop can engrave. We keep your layout, wording and style, then rebuild the details that metal can’t reproduce. Your proof shows every change before anything is made.</p>
        </div>
        <table className="shop-ai-table">
          <thead><tr><th scope="col">In your AI picture</th><th scope="col">On your plaque</th></tr></thead>
          <tbody>
            {aiChanges.map(([before, after]) => <tr key={before}><td>{before}</td><td>{after}</td></tr>)}
          </tbody>
        </table>
      </section>

      <ProofPdfShowcase id="ai-proof" heading="Your proof: every measurement, before we make it.">
        <p>This is the proof for the Margaret Rose plaque above. The AI concept became a drawing with real fonts and an engraveable rose border, at a real size, with every hole position and fixing marked. <a href={sampleProofPdf} target="_blank" rel="noopener">Open the sample proof</a> to see all three pages.</p>
      </ProofPdfShowcase>

      <section className="shop-section shop-ai-more" aria-labelledby="ai-more-heading">
        <div>
          <p className="shop-kicker">Another example</p>
          <h2 id="ai-more-heading">From a glossy concept to a house sign.</h2>
          <p>The same approach works for house signs, bench plaques, memorials and openings. The willow tree keeps its shape as fine engraved lines, and the enamel colours become brushed stainless steel and black infill.</p>
          <a className="shop-text-link" href="/custom-plaques">Custom sizes and shapes ↗</a>
        </div>
        <div className="shop-ai-pair">
          <figure>
            <img src={`/site-images/ai/ai-concept-house-640.webp?${featureImageVersion}`} width="640" height="640" loading="lazy"
              alt="AI-generated concept of a cream enamel oval house sign reading Willow Cottage 12 with a raised green willow tree" />
            <figcaption><strong>AI concept</strong>Enamel colours and embossing</figcaption>
          </figure>
          <span className="shop-ai-arrow" aria-hidden="true">→</span>
          <figure>
            <img src={`/site-images/ai/ai-real-house-640.webp?${featureImageVersion}`} width="640" height="640" loading="lazy"
              alt="The same Willow Cottage design as an engraved brushed stainless steel oval sign, fixed flat to a white-painted brick wall beside a front door" />
            <figcaption><strong>Made in metal</strong>Brushed steel, engraved and filled black</figcaption>
          </figure>
        </div>
      </section>

      <section className="shop-section shop-photo-tips" aria-labelledby="ai-tips-heading">
        <p className="shop-kicker">Before you send it</p>
        <h2 id="ai-tips-heading">Three things that help.</h2>
        <div className="shop-tips">
          <article><h3>Type out the wording</h3><p>AI images often jumble letters and dates. Send the exact words, line by line, so we get every name right.</p></article>
          <article><h3>Tell us the size or the spot</h3><p>A rough size, or a photo of the bench, wall or door, helps us choose a size and fixings that suit it.</p></article>
          <article><h3>Say what you love about it</h3><p>The border, the lettering, the overall feel: tell us what matters most and we’ll keep it.</p></article>
        </div>
        <p className="shop-section-lead">Prefer to design it yourself? <a href="/design">Try our free online designer</a> and see the price as you go.</p>
      </section>

      <ShopFaq faqs={aiDesignFaqs} />

      <section className="shop-closing">
        <p className="shop-kicker">Made it in ChatGPT?</p>
        <h2>Let’s make it real.</h2>
        <p>Send us your design today. Your proof is free, with no obligation to order.</p>
        <div className="shop-closing-choices">
          <ContactLink channel="whatsapp" placement="page" className="shop-button shop-hero-choice-whatsapp shop-whatsapp-button">
            <WhatsAppIcon /> Send your design
          </ContactLink>
          <a className="shop-button shop-button-light" href="/design-request">Use the design form <span aria-hidden="true">↗</span></a>
        </div>
      </section>
      <MobileContactBar />
    </div>
  );
}
