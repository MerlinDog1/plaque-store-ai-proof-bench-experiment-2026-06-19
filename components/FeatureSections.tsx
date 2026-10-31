import React from 'react';
import { optimisedSrcSet } from '../services/imageUrls';
import { ContactLink, WhatsAppIcon } from './ContactOptions';
import { portraitsInMetalLink } from '../services/shopInformation';

// Homepage sections and shared blocks for portrait plaques, AI designs and the proof PDF
// (owner msg 5178). Kept apart from Shopfront so the full pages can import both.

// Bump ?v= whenever the sample PDF changes, so browsers that opened an older copy fetch the new one.
export const sampleProofPdf = '/samples/instaplaque-sample-proof.pdf?v=4';
// The same for the proof and AI images, which keep their file names when redrawn.
export const featureImageVersion = 'v=4';

const proofPage = (page: number) => ({
  src: `/site-images/proof/sample-proof-page-${page}-760.webp?${featureImageVersion}`,
  srcSet: `/site-images/proof/sample-proof-page-${page}-760.webp?${featureImageVersion} 760w, /site-images/proof/sample-proof-page-${page}-1400.webp?${featureImageVersion} 1400w`,
});

type ProofPageImage = { src: string; srcSet?: string; alt: string; height: number };

/** A proof PDF's first two pages, stacked, opening the PDF. Defaults to the general sample; catalogue pages pass their
 *  own plaque's sample proof (owner msgs 8088 and 8100). */
export function ProofPdfStack({ sizes, href = sampleProofPdf, front, back, label = 'Open the sample proof PDF' }: {
  sizes: string;
  href?: string;
  front?: ProofPageImage;
  back?: ProofPageImage;
  label?: string;
}) {
  const cover = front || { ...proofPage(1), height: 536, alt: 'Sample proof cover showing a brushed brass garden memorial plaque with a rose and vine border' };
  const drawing = back || { ...proofPage(2), height: 537, alt: 'Sample proof page with the plaque drawn with every dimension, the hole positions and a side view of the screw caps' };
  return (
    <a className="shop-proof-pdf-stack" href={href} target="_blank" rel="noopener" aria-label={label}>
      <img className="is-back" src={drawing.src} srcSet={drawing.srcSet} sizes={sizes} width="760" height={drawing.height} loading="lazy" alt={drawing.alt} />
      <img className="is-front" src={cover.src} srcSet={cover.srcSet} sizes={sizes} width="760" height={cover.height} loading="lazy" alt={cover.alt} />
    </a>
  );
}

// compact: no checklist and a smaller picture, for the phone-length category pages (owner msg 5906).
export function ProofPdfShowcase({ id = 'proof-pdf', heading = 'A proof you can check properly.', compact = false, children }: {
  id?: string;
  heading?: string;
  compact?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <section className={`shop-section shop-proof-pdf${compact ? ' is-compact' : ''}`} aria-labelledby={`${id}-heading`}>
      <ProofPdfStack sizes="(max-width: 720px) 78vw, 440px" />
      <div className="shop-proof-pdf-copy">
        <p className="shop-kicker">Your proof, before you pay</p>
        <h2 id={`${id}-heading`}>{heading}</h2>
        {children || <p>When we design your plaque, you get a clear PDF proof: the plaque at a glance, a drawing with every measurement, and the finish, fixings and fitting steps. Share it with family, hold it up to the spot, then approve.</p>}
        {!compact && <ul className="shop-proof-pdf-list">
          <li>Exact size, with every dimension marked</li>
          <li>Hole positions, screw caps and the fixings supplied</li>
          <li>Material, finish and lettering sizes</li>
          <li>Simple fitting steps and how to approve</li>
        </ul>}
        <a className="shop-text-link" href={sampleProofPdf} target="_blank" rel="noopener">See a sample proof (PDF) ↗</a>
      </div>
    </section>
  );
}

export function AiConceptPair({ size = 640 }: { size?: 640 | 1200 }) {
  return (
    <div className="shop-ai-pair">
      <figure>
        <img src={`/site-images/ai/ai-concept-memorial-${size}.webp?${featureImageVersion}`} width={size} height={size} loading="lazy"
          alt="AI-generated concept of a gold memorial plaque with raised roses, reading In loving memory of Margaret Rose" />
        <figcaption><strong>Your AI concept</strong>Raised 3D roses and glowing light</figcaption>
      </figure>
      <span className="shop-ai-arrow" aria-hidden="true">→</span>
      <figure>
        <img src={`/site-images/ai/ai-real-memorial-${size}.webp?${featureImageVersion}`} width={size} height={size} loading="lazy"
          alt="The same design as a flat engraved brushed brass plaque with a rose and vine border, fixed to a brick wall with four screw caps" />
        <figcaption><strong>The plaque we make</strong>Engraved brass, ready to fix</figcaption>
      </figure>
    </div>
  );
}

export function HomeAiSection() {
  return (
    <section className="shop-section shop-ai-home" aria-labelledby="ai-home-heading">
      <AiConceptPair />
      <div className="shop-ai-copy">
        <p className="shop-kicker">From AI design to real plaque</p>
        <h2 id="ai-home-heading">Designed it in ChatGPT? We’ll make it real.</h2>
        <p>Send us the picture you made with ChatGPT, Gemini or any AI tool. We redraw it for engraving, correct the wording, size it properly and send you a proof before you pay.</p>
        <div className="shop-design-service-actions">
          <ContactLink channel="whatsapp" placement="page" className="shop-button shop-hero-choice-whatsapp shop-whatsapp-button">
            <WhatsAppIcon /> Send us your design
          </ContactLink>
          <a className="shop-text-link" href="/ai-plaque-design">How it works ↗</a>
        </div>
      </div>
    </section>
  );
}

// How every plaque is made (owner msg 5843, 24 Oct 2026: "etched in solid high quality metal in UK,
// Infilled by hand, laser cut for precision"). The close-up is a real photograph, not AI: an etched,
// hand-filled plaque from our Portraits in Metal studio (its homepage shows the same picture).
const qualityPoints = [
  ['Solid brass or stainless steel', 'Real, quality metal all the way through, never a metal-effect print.'],
  ['Etched into the metal', 'Your words and artwork are etched into the surface, so they become part of the plaque.'],
  ['Infilled by hand', 'Every etched letter and line is paint-filled by hand, for crisp contrast that’s easy to read.'],
  ['Laser cut for precision', 'Each plate is laser cut to size, for clean edges and accurate corners, ovals and hearts.'],
];

// compact: the four points as short titles without the paragraph, for the phone-length category pages (msg 5906).
export function HomeQualitySection({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`shop-section shop-quality-home${compact ? ' is-compact' : ''}`} aria-labelledby="quality-home-heading">
      <figure className="shop-quality-photo">
        <img
          src="/site-images/quality/real-etched-detail-1200.webp"
          srcSet={optimisedSrcSet('/site-images/quality/real-etched-detail-1200.webp', 1200, [750, 1080],
            '/site-images/quality/real-etched-detail-600.webp 600w, /site-images/quality/real-etched-detail-1200.webp 1200w',
            ['/site-images/quality/real-etched-detail-600.webp 600w'])}
          sizes="(max-width: 720px) 92vw, 600px"
          width="1200"
          height="675"
          loading="lazy"
          decoding="async"
          alt="Close-up photograph of a real etched metal plaque, with fine engraved lines filled with dark paint on brushed metal"
        />
        {/* No visible caption (owner msg 5855); the alt text still describes the photo. */}
      </figure>
      <div className="shop-quality-copy">
        <p className="shop-kicker">Made in the UK · Finished by hand</p>
        <h2 id="quality-home-heading">Solid metal, made to stay.</h2>
        {!compact && <p>Every plaque is made here in the UK from high-quality solid metal, with the care that something this lasting deserves. Look closely and you’ll see the difference.</p>}
        <ol className="shop-quality-points">
          {qualityPoints.map(([title, text], index) => (
            <li key={title}>
              <span aria-hidden="true">0{index + 1}</span>
              <div><strong>{title}</strong>{!compact && <p>{text}</p>}</div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// Millie's photo and finished plaque are real photographs; Alfie and Thomas are Portraits in Metal designs.
const homePortraits = [
  { src: '/site-images/portraits/pim-millie-photo.webp', width: 600, height: 800, alt: 'Millie the cat in her owner’s everyday photo', caption: 'Millie’s photo' },
  { src: '/site-images/portraits/pim-millie-plaque.webp', width: 720, height: 1280, alt: 'Millie’s portrait engraved on her finished metal plaque, photographed', caption: 'Her finished plaque', top: true },
  { src: '/site-images/portraits/pim-alfie-polished-brass-480.webp', width: 480, height: 680, alt: 'Portrait memorial plaque of Alfie the spaniel in polished brass on light oak', caption: 'Alfie · polished brass' },
  { src: '/site-images/portraits/pim-thomas-polished-steel-480.webp', width: 480, height: 679, alt: 'Family memorial plaque with a portrait of Thomas in polished stainless steel', caption: 'Thomas · polished steel' },
];

export function HomePortraitSection() {
  return (
    <section className="shop-section shop-portrait-home" aria-labelledby="portrait-home-heading">
      <div className="shop-portrait-home-copy">
        <p className="shop-kicker">Portrait plaques</p>
        <h2 id="portrait-home-heading">A favourite face, engraved in metal.</h2>
        <p>Send us a photo of a person or pet. Using our Portraits in Metal technology, we turn it into fine engraving artwork, arrange your words around it and show you a free sketch before you decide.</p>
        <div className="shop-design-service-actions">
          <a className="shop-button" href="/portrait-plaques">See portrait plaques <span aria-hidden="true">↗</span></a>
          <ContactLink channel="whatsapp" placement="page" className="shop-text-link">Send us a photo on WhatsApp ↗</ContactLink>
        </div>
      </div>
      <div className="shop-portrait-home-images">
        {homePortraits.map(image => (
          <figure key={image.src}>
            <img src={image.src} width={image.width} height={image.height} alt={image.alt} loading="lazy" className={image.top ? 'is-top' : undefined} />
            <figcaption>{image.caption}</figcaption>
          </figure>
        ))}
        <p className="shop-smallprint">More portrait designs at <a href={portraitsInMetalLink('/gallery', 'homepage_portrait_section', 'gallery_link')}>Portraits in Metal ↗</a></p>
      </div>
    </section>
  );
}
