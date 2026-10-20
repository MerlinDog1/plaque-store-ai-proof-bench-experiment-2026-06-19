import React from 'react';
import { ContactLink, WhatsAppIcon } from './ContactOptions';
import { portraitsInMetalLink } from '../services/shopInformation';

// Homepage sections and shared blocks for portrait plaques, AI designs and the proof PDF
// (owner msg 5178). Kept apart from Shopfront so the full pages can import both.

// Bump ?v= whenever the sample PDF changes, so browsers that opened an older copy fetch the new one.
export const sampleProofPdf = '/samples/instaplaque-sample-proof.pdf?v=3';
// The same for the proof and AI images, which keep their file names when redrawn.
export const featureImageVersion = 'v=3';

const proofPage = (page: number) => ({
  src: `/site-images/proof/sample-proof-page-${page}-760.webp?${featureImageVersion}`,
  srcSet: `/site-images/proof/sample-proof-page-${page}-760.webp?${featureImageVersion} 760w, /site-images/proof/sample-proof-page-${page}-1400.webp?${featureImageVersion} 1400w`,
});

export function ProofPdfShowcase({ id = 'proof-pdf', heading = 'A proof you can check properly.', children }: {
  id?: string;
  heading?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="shop-section shop-proof-pdf" aria-labelledby={`${id}-heading`}>
      <a className="shop-proof-pdf-stack" href={sampleProofPdf} target="_blank" rel="noopener" aria-label="Open the sample proof PDF">
        <img className="is-back" {...proofPage(2)} sizes="(max-width: 720px) 78vw, 440px" width="760" height="537" loading="lazy"
          alt="Sample proof page with the plaque drawn with every dimension, the hole positions and a side view of the screw caps" />
        <img className="is-front" {...proofPage(1)} sizes="(max-width: 720px) 78vw, 440px" width="760" height="536" loading="lazy"
          alt="Sample proof cover showing a brushed brass garden memorial plaque with a rose and vine border" />
      </a>
      <div className="shop-proof-pdf-copy">
        <p className="shop-kicker">Your proof, before you pay</p>
        <h2 id={`${id}-heading`}>{heading}</h2>
        {children || <p>When we design your plaque, you get a clear PDF proof: the plaque at a glance, a drawing with every measurement, and the finish, fixings and fitting steps. Share it with family, hold it up to the spot, then approve.</p>}
        <ul className="shop-proof-pdf-list">
          <li>Exact size, with every dimension marked</li>
          <li>Hole positions, screw caps and the fixings supplied</li>
          <li>Material, finish and lettering sizes</li>
          <li>Simple fitting steps and how to approve</li>
        </ul>
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
        <p className="shop-smallprint">Illustrations of a fictional example: an AI concept and the engraved plaque made from it.</p>
      </div>
    </section>
  );
}

// Millie's photo and finished plaque are real photographs; Alfie and Thomas are illustrative designs.
const homePortraits = [
  { src: '/site-images/portraits/pim-millie-photo.webp', width: 600, height: 800, alt: 'Millie the cat in her owner’s everyday photo', caption: 'Millie’s photo' },
  { src: '/site-images/portraits/pim-millie-plaque.webp', width: 720, height: 1280, alt: 'Millie’s portrait engraved on her finished metal plaque, photographed', caption: 'Her finished plaque', top: true },
  { src: '/site-images/portraits/pim-alfie-polished-brass-480.webp', width: 480, height: 680, alt: 'Illustrative portrait memorial plaque of Alfie the spaniel in polished brass on light oak', caption: 'Alfie · polished brass' },
  { src: '/site-images/portraits/pim-thomas-polished-steel-480.webp', width: 480, height: 679, alt: 'Illustrative family memorial plaque with a portrait of Thomas in polished stainless steel', caption: 'Thomas · polished steel' },
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
        <p className="shop-smallprint">Millie: real photographs. Alfie and Thomas: illustrative designs. <a href={portraitsInMetalLink('/gallery', 'homepage_portrait_section', 'gallery_link')}>More at Portraits in Metal ↗</a></p>
      </div>
    </section>
  );
}
