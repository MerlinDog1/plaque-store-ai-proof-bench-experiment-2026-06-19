import {
  BorderStyle,
  DesignStyle,
  Fixing,
  Material,
  PlaqueState,
  Shape,
  TextColor,
} from '../types';
import { GROUND_STAKE_LENGTH, estimatePlaquePrice } from './pricing';
import { onBoardAndStake } from './groundStake';
import { vettedCataloguePhotos } from './vettedPhotos.mjs';
import {
  getCheckoutPriceBreakdown,
  getCheckoutQuoteReasons,
} from './checkoutPolicy.mjs';
import { merchantOffers } from './merchantCatalogue.mjs';
import { exampleFor, feedDescriptionFor, feedTitleFor, heroNote, productFaqs, productIntro, seoDescriptionFor, seoTitleFor } from './catalogueContent';
import { productionTiming } from './shopInformation';
import { BENCH_SAFE_MARGIN_PERCENT } from './safeMargin';

export const DEFAULT_PRODUCT_SLUG = 'bench-plaques';

export type SiteView =
  | 'design-request'
  | 'home'
  | 'about'
  | 'product'
  | 'landing'
  | 'materials'
  | 'how'
  | 'faq'
  | 'quote'
  | 'checkout'
  | 'order-confirmed'
  | 'admin'
  | 'contact'
  | 'terms'
  | 'privacy'
  | 'cookies'
  | 'returns'
  | 'portraits'
  | 'ai-design'
  | 'video'
  | 'plaque';

export interface ProductFamily {
  slug: string;
  title: string;
  eyebrow: string;
  shortTitle: string;
  description: string;
  seoTitle?: string;
  seoDescription?: string;
  seoIntro?: string;
  seoSections?: Array<{ title: string; copy: string }>;
  relatedSearches?: string[];
  bestFor: string[];
  startingFrom: string;
  schemaStartingPrice?: number;
  merchantOffer?: boolean;
  imageKind?: 'ai' | 'render';
  /** Product page photo (1200 px webp, with a -600 version); the feed and schema keep `image`. */
  photo?: string;
  /** Catalogue pages: a line under the title, and the Google Shopping title and description. */
  heroNote?: string;
  feedTitle?: string;
  feedDescription?: string;
  productionDays?: number;
  merchantMaterial?: string;
  materialCue: 'brass' | 'stainless' | 'wood' | 'aged';
  image: string;
  proofPrompt: string;
  preset: Partial<PlaqueState>;
  faqs: Array<{ question: string; answer: string }>;
}

export interface SeoLandingPage {
  slug: string;
  title: string;
  shortTitle: string;
  eyebrow: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  heroCopy: string;
  image: string;
  mobileImage?: string;
  relatedProductSlug: string;
  proofCta: string;
  sections: Array<{ title: string; copy: string }>;
  buyingGuide?: Array<{ title: string; copy: string }>;
  examples?: Array<{ title: string; copy: string; image: string; alt: string }>;
  faqs: Array<{ question: string; answer: string }>;
  relatedSearches: string[];
  /** The short line under the page title. */
  heroNote?: string;
  /** 'stake': the page sells its plaques on the oak board and ground stake, so "Design online" starts there and the
   * from-price includes both (the tree page, owner msg 6506). */
  mount?: 'stake';
}

export interface PriceBreakdown {
  total: number;
  base: number;
  wood: number;
  // Ground stake add-on; absent on orders made before it existed.
  stake?: number;
  delivery: number;
  quoteRequired: boolean;
  quoteReasons: string[];
}

export interface DeliveryAddress {
  line1: string;
  line2: string;
  town: string;
  postcode: string;
  country: string;
}

export interface MockOrder {
  id: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  deliveryAddress?: DeliveryAddress;
  productTitle: string;
  status:
    | 'proof-approved'
    | 'checkout-started'
    | 'payment-simulated'
    | 'hub-queued'
    | 'needs-check'
    | 'quote-requested'
    | 'in-production'
    | 'dispatched';
  paymentStatus: 'unpaid' | 'paid' | 'failed' | 'refunded' | 'test-paid' | 'requires-check';
  total: number;
  inscription: string;
  proofApproved: boolean;
  state: PlaqueState;
  priceBreakdown: PriceBreakdown;
  stripeSimulation: {
    provider: 'mock' | 'stripe';
    mode: 'test' | 'live';
    checkoutSessionId: string;
    paymentIntentId: string;
    receiptUrl: string;
    checkoutUrl?: string;
    embeddedClientSecret?: string;
    publishableKey?: string;
    uiMode?: 'hosted' | 'embedded';
  };
  proofPackage: {
    productionSvg: string | null;
    visualProofSvg: string | null;
    visualProofPng?: string | null;
    productionFilename: string;
    visualFilename: string;
    lockedAt: string;
  };
  emailEvents: Array<{
    id: string;
    type: 'order_confirmation' | 'proof_received' | 'production_handoff';
    recipient: string;
    template: string;
    status: 'mock-queued';
  }>;
  adminHub: {
    destination: 'central-admin-hub';
    queue: 'orders.production-proof-intake';
    status: 'queued';
    payloadVersion: '2026-06-24';
  };
}

const PLAQUE_SUMMARY_MATERIAL_LABELS: Record<Material, string> = {
  [Material.BrushedBrass]: 'Brushed brass',
  [Material.OrbitalBrassMattLacquer]: 'Orbital brass',
  [Material.PolishedBrass]: 'Polished brass',
  [Material.AgedBrass]: 'Aged brass',
  [Material.BrushedSteel]: 'Brushed stainless',
  [Material.PolishedSteel]: 'Polished stainless',
};

const formatRetailPrice = (price: number) => price.toLocaleString('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: Number.isInteger(price) ? 0 : 2,
  maximumFractionDigits: 2,
});

const startingFromFor = (preset: Pick<PlaqueState, 'width' | 'height' | 'material' | 'shape'>) =>
  `from ${formatRetailPrice(estimatePlaquePrice({
    ...preset,
    wood: false,
  } as PlaqueState))}`;

const schemaPriceFor = (preset: Pick<PlaqueState, 'width' | 'height' | 'material' | 'shape'>) =>
  estimatePlaquePrice({
    ...preset,
    wood: false,
  } as PlaqueState);

export const getPlaqueSummaryTitle = (state: Partial<PlaqueState> = {}, fallback = 'Custom plaque') => {
  const material = state.material ? PLAQUE_SUMMARY_MATERIAL_LABELS[state.material] || String(state.material) : '';
  const width = Number(state.width || 0);
  const height = Number(state.height || 0);
  const size = width > 0 && height > 0 ? `${width} x ${height} mm` : '';
  return [material, size].filter(Boolean).join(' / ') || fallback;
};

export const productFamilies: ProductFamily[] = [
  {
    slug: 'memorial-plaques',
    title: 'Memorial plaques',
    shortTitle: 'Memorial',
    eyebrow: 'Custom remembrance plaques',
    startingFrom: startingFromFor({ width: 210, height: 148, material: Material.BrushedSteel, shape: Shape.Rect }),
    materialCue: 'brass',
    image: '/site-images/home-gallery-aged-brass-wood.webp',
    description: 'Custom memorial plaques for graves, gardens, benches and remembrance walls, checked in a proof before production.',
    seoTitle: 'Memorial Plaques UK | Brass & Stainless Steel | InstaPlaque',
    seoDescription: 'Personalised memorial plaques in brass or stainless steel for walls, gardens and graves. Check your wording with a free online proof. UK delivery included.',
    seoIntro: 'Create a personalised memorial plaque with a name, dates and a tribute in your own words. Choose brass or stainless steel for a remembrance wall, garden or graveside setting, then check the layout in a free online proof before you pay.',
    seoSections: [
      {
        title: 'Brass memorial plaques',
        copy: 'Brass has a warm, gold-toned appearance for traditional remembrance settings. Choose brushed, polished, orbital or aged brass in the designer. The finish affects the appearance, price and care, so check the selected option before ordering. Aged brass takes additional finishing time.',
      },
      {
        title: 'Stainless steel memorial plaques',
        copy: 'Stainless steel gives a silver finish, with brushed and polished options. It suits both contemporary wall memorials and outdoor remembrance plaques. Choose the finish for the setting and keep the inscription readable at the distance people will view it. Ask us about particularly exposed or coastal locations before ordering.',
      },
      {
        title: 'Memorial wall plaques and fitting',
        copy: 'Measure the available wall space and decide the fixing position before designing. Check the selected holes or decorative caps in the proof, leaving the inscription clear of them. Optional wood backing suits indoor or sheltered displays and changes the price and production time. If you are replacing an old plaque, send its dimensions and hole positions before ordering.',
      },
      {
        title: 'Garden, grave and cemetery settings',
        copy: 'For a garden, choose a position where planting will not cover the inscription and where it can be read and cleaned. For a cemetery, churchyard, public bench or managed remembrance space, check the permitted material, dimensions, wording and fitting method with the site manager before ordering. Approval of our design proof does not replace permission from the site.',
      },
    ],
    relatedSearches: ['memorial plaques UK', 'brass memorial plaques', 'custom remembrance plaques', 'garden memorial plaques'],
    bestFor: ['Names, dates and tribute wording', 'Garden and wall memorials', 'Brass or stainless steel finishes', 'Optional wood backing'],
    proofPrompt: 'In loving memory of\nArthur James Williams\nA devoted husband, father and grandfather\n1938 - 2026',
    // "Design online" opens on the plaque the from-price is for: A5 brushed stainless steel without wood
    // backing (owner msg 5906, 24 Oct 2026). It opened on brass with dark wood at £165 under "from £95.50".
    // The garden and other pages that borrow this product start there too; the tree page adds the oak board and
    // ground stake to it (landingDesignProduct, owner msg 6506).
    preset: {
      width: 210,
      height: 148,
      material: Material.BrushedSteel,
      shape: Shape.Rect,
      fixing: Fixing.Caps,
      border: true,
      borderStyle: BorderStyle.Double,
      wood: false,
      woodTone: 'light',
      woodEdge: 'square',
      designStyle: DesignStyle.Auto,
      textColor: TextColor.Black,
      cornerRadius: 0,
    },
    faqs: [
      {
        question: 'How much does a memorial plaque cost?',
        answer: `A5 stainless steel memorial plaques without wood backing are available ${startingFromFor({ width: 210, height: 148, material: Material.BrushedSteel, shape: Shape.Rect })}. Engraving, standard fixings and UK delivery are included. Brass, selected finishes, larger sizes and wood backing can change the price; the designer shows the total before checkout. Compact bench plaques are a smaller option for short inscriptions.`,
      },
      {
        question: 'What should I write on a memorial plaque?',
        answer: 'A name, dates and a short personal dedication are a useful starting point. You can include a relationship, nickname or a few words about what made the person special. Use the sample inscriptions on this page as starting points, then review every name, date and line break in your proof.',
      },
      {
        question: 'Can brass and stainless steel memorial plaques go outside?',
        answer: 'Both metals can be used outdoors with suitable fixings. Choose the finish for the setting and follow its care instructions; do not assume every surface should be polished. Ask us about very exposed or coastal locations. Wood backing is better suited to indoor or sheltered displays.',
      },
      {
        question: 'Can I put a memorial plaque on a grave or cemetery wall?',
        answer: 'Check with the cemetery, churchyard or site manager before ordering. Requirements for dimensions, materials, wording and installation vary by location. Once you know what is permitted, choose the plaque options and approve the wording and layout in the proof.',
      },
      {
        question: 'Can my family check the wording before I pay?',
        answer: 'Yes. Create a free online proof with no account needed, then download the proof PDF to share with your family. It includes a link back to the design. Agree one final version and check the spelling, dates, line breaks and fixing positions before approval and payment. The proof confirms wording and layout; finish textures on screen are illustrative.',
      },
      {
        question: 'How long does a memorial plaque take to make?',
        answer: productionTiming.faq,
      },
    ],
  },
  {
    slug: 'bench-plaques',
    title: 'Bench plaques',
    shortTitle: 'Bench',
    eyebrow: '150 x 50 mm',
    startingFrom: startingFromFor({ width: 150, height: 50, material: Material.BrushedSteel, shape: Shape.Rect }),
    materialCue: 'stainless',
    image: '/site-images/home-carousel-bench-steel.webp',
    description: 'Compact plaques for benches, seats and short outdoor dedications where the wording needs to stay crisp.',
    seoTitle: 'Bench Plaques UK | Custom Brass & Stainless Steel Bench Plaques',
    seoDescription: 'Order custom bench plaques in brass or stainless steel. Build a proof online, check the inscription and see live pricing before payment.',
    seoIntro: 'Design a brass or stainless steel plaque for a bench or seat, starting at 150 × 50 mm. Measure the available space, add your dedication and check the layout and price online before you pay.',
    seoSections: [
      {
        title: 'Measure the flat area of the bench',
        copy: 'Measure the usable width and height of the slat or rail, allowing room around its edges and any existing bolts. The compact starting size is 150 × 50 mm. The designer also offers sizes such as 150 × 75 mm and 200 × 50 mm. Compare those dimensions with the actual bench before choosing a size; a deeper plaque will not suit every slat.',
      },
      {
        title: 'Brass or stainless steel bench plaques',
        copy: 'Stainless steel gives a silver finish; brass gives a warmer, traditional appearance. Choose brushed or polished options in the designer and compare the price. Care depends on the finish: ask about your location if the bench is particularly exposed or near the sea, and check care instructions before using polish or abrasive cleaners.',
      },
      {
        title: 'Leave room for the inscription and fixings',
        copy: 'A name, dates and a short dedication are a useful starting point. Long names and several lines need more space, so check the proof at the chosen dimensions. Standard screw fixings are shown in the preview. Keep wording clear of the fixing positions and confirm the mounting arrangement if you are replacing an existing plaque.',
      },
      {
        title: 'Check permission for a public or managed bench',
        copy: 'If the bench belongs to a park, council, cemetery or another organisation, check its plaque rules before ordering. Ask for the permitted dimensions, wording and fitting method. If existing holes must be reused, contact us with their positions and measurements before approving a design.',
      },
    ],
    relatedSearches: ['bench plaques UK', 'memorial bench plaques', 'engraved bench plaques', 'brass bench plaques'],
    bestFor: ['Benches and seats', 'Short memorial wording', 'Outdoor brass or stainless', 'Standard screw fixing'],
    proofPrompt: 'In loving memory of\nMargaret Ellis\n1942 - 2026\nForever in our hearts',
    preset: {
      width: 150,
      height: 50,
      material: Material.BrushedSteel,
      shape: Shape.Rect,
      fixing: Fixing.Screws,
      border: true,
      borderStyle: BorderStyle.Single,
      wood: false,
      designStyle: DesignStyle.Auto,
      safeMargin: BENCH_SAFE_MARGIN_PERCENT,
      textColor: TextColor.Black,
      cornerRadius: 0,
    },
    faqs: [
      {
        question: 'What size plaque will fit my bench?',
        answer: 'Measure the flat part of the bench where it will be fitted. Our compact starting size is 150 × 50 mm, with other bench sizes in the designer. Leave clearance around edges and existing fixings. For a replacement plaque, check the old hole positions as well as the outside dimensions.',
      },
      {
        question: 'How much wording fits on a bench plaque?',
        answer: 'Start with a name, dates and one short dedication. There is no useful fixed word count: long names, the font and fixing positions all affect the space. Check the proof at your selected size, and shorten the wording or choose a larger plaque if it looks crowded.',
      },
      {
        question: 'Can I match the fixing holes of an old plaque?',
        answer: 'Contact us before ordering with the existing plaque dimensions and hole positions. The standard preview does not automatically match holes already in your bench, so the fitting arrangement needs checking before approval.',
      },
    ],
  },
  {
    slug: 'brass-plaques',
    title: 'Brass plaques',
    shortTitle: 'Brass',
    eyebrow: 'Brushed, polished or aged brass',
    startingFrom: startingFromFor({ width: 210, height: 148, material: Material.BrushedBrass, shape: Shape.Rect }),
    materialCue: 'brass',
    image: '/site-images/home-gallery-brass-bench.webp',
    description: 'Custom engraved brass plaques for memorials, benches, openings and presentation pieces.',
    seoTitle: 'Brass Plaques UK | Custom Engraved Brass Plaques',
    seoDescription: 'Custom brass plaques for memorials, benches, openings and presentation use. Choose brushed, polished, orbital or aged brass and approve a proof online.',
    seoIntro: 'Brass is the classic choice for engraved plaques. It suits memorial wording, bench dedications, opening plaques, donor recognition and presentation pieces where a warmer traditional finish is wanted.',
    seoSections: [
      {
        title: 'Pick the brass finish first',
        copy: 'Brushed brass is restrained and satin. Polished brass is brighter. Orbital brass has a more decorative grain. Aged brass gives a softer patinated look for memorial and garden settings.',
      },
      {
        title: 'Proof before production',
        copy: 'The proof shows the wording, border, fixings and material choice before checkout. That matters especially on brass, where spacing and hierarchy make the plaque feel considered rather than crowded.',
      },
    ],
    relatedSearches: ['brass plaques UK', 'engraved brass plaques', 'custom brass plaques', 'brass memorial plaques'],
    bestFor: ['Traditional memorial plaques', 'Presentation and opening plaques', 'Warm gold-toned finish', 'Optional aged brass patina'],
    proofPrompt: 'Presented to\nDavid Morgan\nIn recognition of 25 years of service\n2026',
    // Opens on the plaque the page's from-price is for: A5 brushed brass without wood backing (owner msg 5927).
    preset: {
      width: 210,
      height: 148,
      material: Material.BrushedBrass,
      shape: Shape.Rect,
      fixing: Fixing.Caps,
      border: true,
      borderStyle: BorderStyle.Double,
      wood: false,
      woodTone: 'light',
      woodEdge: 'square',
      designStyle: DesignStyle.Auto,
      textColor: TextColor.Black,
      cornerRadius: 0,
    },
    faqs: [
      {
        question: 'Can I choose the brass finish?',
        answer: 'Yes. The proof bench includes brushed brass, polished brass, orbital brass and aged brass options.',
      },
      {
        question: 'Are brass plaques suitable outside?',
        answer: 'Yes, brass can be used outdoors. Aged brass is hand-patinated and sealed, while brushed and polished brass will naturally change over time.',
      },
    ],
  },
  {
    slug: 'stainless-steel-plaques',
    title: 'Stainless steel plaques',
    shortTitle: 'Stainless',
    eyebrow: 'Brushed or polished stainless',
    startingFrom: startingFromFor({ width: 210, height: 148, material: Material.BrushedSteel, shape: Shape.Rect }),
    materialCue: 'stainless',
    image: '/site-images/home-carousel-steel-wall.webp',
    description: 'Custom stainless steel plaques for outdoor, wall, bench and contemporary memorial use.',
    seoTitle: 'Stainless Steel Plaques UK | Outdoor Metal Plaques Made to Order',
    seoDescription: 'Custom stainless steel plaques for outdoor, wall, bench and memorial use. Choose brushed or polished stainless and approve your proof before payment.',
    seoIntro: 'Stainless steel is a strong choice for clean, modern plaques. It works well for outdoor signs, public spaces, contemporary memorials, benches and wall-mounted plaques.',
    seoSections: [
      {
        title: 'Clean outdoor finish',
        copy: 'Brushed stainless steel gives a satin silver face that is easy to read. Polished stainless is brighter and more reflective, useful when the setting suits a sharper modern look.',
      },
      {
        title: 'Clear proofing and live pricing',
        copy: 'Add your wording, choose the size and fixings, then check the proof before checkout. Standard pricing includes engraving, standard fixings and UK delivery.',
      },
    ],
    relatedSearches: ['stainless steel plaques UK', 'outdoor metal plaques', 'engraved stainless steel plaques', 'custom steel plaques'],
    bestFor: ['Outdoor plaque orders', 'Modern wall plaques', 'Bench and public-space plaques', 'Crisp black-filled engraving'],
    proofPrompt: 'The Riverside Garden\nOpened 2026\nA community space for everyone',
    preset: {
      width: 210,
      height: 148,
      material: Material.BrushedSteel,
      shape: Shape.Rect,
      fixing: Fixing.Caps,
      border: true,
      borderStyle: BorderStyle.Double,
      wood: false,
      designStyle: DesignStyle.Auto,
      textColor: TextColor.Black,
      cornerRadius: 0,
    },
    faqs: [
      {
        question: 'Which stainless steel finishes are available?',
        answer: 'You can start with brushed stainless or polished stainless and review the finish in the online plaque proof.',
      },
      {
        question: 'Are stainless steel plaques good for outdoors?',
        answer: 'Yes. Stainless steel is a strong choice for outdoor plaques, bench plaques and contemporary wall plaques.',
      },
    ],
  },
  {
    slug: 'a5-plaques',
    title: 'A5 plaques',
    shortTitle: 'A5',
    eyebrow: '210 x 148 mm',
    startingFrom: startingFromFor({ width: 210, height: 148, material: Material.BrushedSteel, shape: Shape.Rect }),
    materialCue: 'stainless',
    image: '/site-images/home-carousel-garden-brass.webp',
    description: 'A practical all-round size for memorial, garden, wall and presentation wording.',
    seoTitle: 'A5 Plaques UK | Custom A5 Memorial & Wall Plaques',
    seoDescription: 'Create a custom A5 plaque in brass or stainless steel. A practical size for memorials, gardens, wall plaques and presentation wording.',
    seoIntro: 'A5 is the safest starting size for many plaques. It gives enough room for a name, dates and a short message without becoming too large for gardens, walls or indoor displays.',
    seoSections: [
      {
        title: 'A balanced plaque size for most uses',
        copy: 'Choose A5 for memorial plaques, garden dedications, small opening plaques, wall signs and presentation pieces where the wording needs room to breathe.',
      },
      {
        title: 'Material and backing options',
        copy: 'A5 works well in brass or stainless steel, with wood backing available where suitable. The proof shows the final balance of text, border, fixing and finish before payment.',
      },
    ],
    relatedSearches: ['A5 plaques UK', 'A5 memorial plaques', 'custom wall plaques', 'garden plaques UK'],
    bestFor: ['Most memorial plaques', 'Wall and garden use', 'Names, dates and a short message', 'Optional wood backing'],
    proofPrompt: 'In loving memory of\nArthur James Williams\nA devoted husband, father and grandfather\n1938 - 2026',
    preset: {
      width: 210,
      height: 148,
      material: Material.BrushedSteel,
      shape: Shape.Rect,
      fixing: Fixing.Caps,
      border: true,
      borderStyle: BorderStyle.Double,
      wood: true,
      woodTone: 'dark',
      woodEdge: 'bevel',
      designStyle: DesignStyle.Auto,
      textColor: TextColor.Black,
      cornerRadius: 0,
    },
    faqs: [
      {
        question: 'Is this the best starting size?',
        answer: 'Usually, yes. It gives the proofing system enough room for a clear title, dates and a short message.',
      },
      {
        question: 'Can I add a wooden backing?',
        answer: 'Yes. Wood backing is priced live and shown in the proof before you order.',
      },
    ],
  },
  {
    slug: 'a4-plaques',
    title: 'A4 plaques',
    shortTitle: 'A4',
    eyebrow: '297 x 210 mm',
    startingFrom: startingFromFor({ width: 297, height: 210, material: Material.BrushedSteel, shape: Shape.Rect }),
    materialCue: 'stainless',
    image: '/site-images/home-carousel-reading-room.webp',
    description: 'A larger plaque size for formal wording, openings, donor recognition and memorial displays.',
    seoTitle: 'A4 Plaques UK | Large Custom Memorial & Presentation Plaques',
    seoDescription: 'Large custom A4 plaques in brass or stainless steel for longer wording, openings, donor recognition, memorials and presentation displays.',
    seoIntro: 'A4 plaques are for wording that needs presence. Use this size for formal openings, donor recognition, longer memorial inscriptions and plaques that need to be read clearly from further away.',
    seoSections: [
      {
        title: 'Room for formal wording',
        copy: 'A4 gives space for headings, names, roles, dates and dedication text without forcing the layout. It is usually the better choice for ceremonies and public-facing plaques.',
      },
      {
        title: 'Finish for the setting',
        copy: 'Brass feels traditional and ceremonial. Stainless steel suits modern interiors and outdoor public spaces. Wood backing can add weight for indoor presentation plaques.',
      },
    ],
    relatedSearches: ['A4 plaques UK', 'large memorial plaques', 'presentation plaques', 'opening plaques'],
    bestFor: ['Longer tribute wording', 'Presentation plaques', 'Opening plaques', 'Prominent wall displays'],
    proofPrompt: 'Opened by\nThe Rt Hon. Eleanor Hart MP\non 18 June 2026\nRiverside Community Centre',
    // Opens on the plaque the opening page's from-price is for: A4 brushed stainless steel without wood backing
    // (owner msg 5927).
    preset: {
      width: 297,
      height: 210,
      material: Material.BrushedSteel,
      shape: Shape.Rect,
      fixing: Fixing.Caps,
      border: true,
      borderStyle: BorderStyle.Double,
      wood: false,
      woodTone: 'light',
      woodEdge: 'square',
      designStyle: DesignStyle.Auto,
      textColor: TextColor.Black,
      cornerRadius: 0,
    },
    faqs: [
      {
        question: 'When should I choose large?',
        answer: 'Choose large for longer wording, formal openings, donor recognition or anything that needs to be read from further away.',
      },
      {
        question: 'Will the price still show before ordering?',
        answer: 'Yes. Standard large plaques can be priced before checkout, with extras shown before payment.',
      },
    ],
  },
  {
    slug: 'custom-plaques',
    title: 'Custom plaques',
    shortTitle: 'Custom',
    eyebrow: 'Up to 600 mm long',
    startingFrom: 'quote checked before order',
    schemaStartingPrice: schemaPriceFor({ width: 297, height: 210, material: Material.BrushedSteel, shape: Shape.Rect }),
    materialCue: 'stainless',
    image: '/site-images/home-custom-oval-steel.webp',
    description: 'For non-standard sizes, oval plaques, circular plaques and made-to-measure metal plaques.',
    seoTitle: 'Custom Plaques UK | Bespoke Oval, Circular & Made-to-Measure Plaques',
    seoDescription: 'Start a custom plaque proof for bespoke sizes, oval plaques, circular plaques and made-to-measure brass or stainless steel plaques.',
    seoIntro: 'Use the custom plaque route when a standard size is not quite right. Build the wording and layout first, then anything unusual can be checked before production.',
    seoSections: [
      {
        title: 'Bespoke plaque sizes and shapes',
        copy: 'Custom plaques can cover non-standard dimensions, oval plaques, circular plaques, larger plates and special mounting requirements within production limits.',
      },
      {
        title: 'Proof first, quote check where needed',
        copy: 'The proof gives a clear starting point. Oversized plaques, unusual shapes, supplied artwork and special finishes may need a manual check before payment.',
      },
    ],
    relatedSearches: ['custom plaques UK', 'bespoke plaques', 'oval plaques', 'made to measure plaques'],
    bestFor: ['Up to 600 mm long', 'Oval plaques', 'Circular plaques', 'Special fixing requirements'],
    proofPrompt: 'The Old Mill\nRestored 2026\nIn honour of everyone who brought this place back to life',
    // Opens on the oval the page's from-price is for: 250 x 150 mm brushed stainless steel (owner msg 5927).
    preset: {
      width: 250,
      height: 150,
      material: Material.BrushedSteel,
      shape: Shape.Oval,
      fixing: Fixing.Caps,
      fixingHoleCount: 2,
      border: true,
      borderStyle: BorderStyle.Double,
      wood: false,
      woodTone: 'light',
      woodEdge: 'square',
      designStyle: DesignStyle.Auto,
      textColor: TextColor.Black,
      cornerRadius: 0,
    },
    faqs: [
      {
        question: 'Can bespoke plaques still use instant proofing?',
        answer: 'Yes. The proof helps establish the design quickly, even if the final price needs manual confirmation.',
      },
      {
        question: 'What triggers a quote?',
        answer: 'Oversized plaques, custom shapes, longer-turnaround finishes and unusual mounting should be checked before payment.',
      },
    ],
  },
];

export const seoLandingPages: SeoLandingPage[] = [
  {
    slug: 'garden-plaques',
    title: 'Garden plaques',
    shortTitle: 'Garden',
    eyebrow: 'Outdoor dedication plaques',
    description: 'Custom garden plaques for memorial corners, trees, benches, walls and planted spaces.',
    seoTitle: 'Garden Memorial Plaques UK | Free Online Proof | InstaPlaque',
    seoDescription: 'Personalise a brass or stainless steel garden plaque for a tree, bench or memorial corner. Compare sizes and fixings, then check a free proof before you buy.',
    heroCopy: 'Mark a favourite spot, a memorial tree or a garden bench with words of your own. Choose brass or stainless steel, leave the inscription room to breathe, and check a free online proof before you order, or send us your words on WhatsApp and we’ll design it for you.',
    image: '/site-images/home-carousel-garden-brass.webp',
    relatedProductSlug: 'memorial-plaques',
    proofCta: 'Start a garden plaque proof',
    examples: [
      { title: 'An apple tree for Pauline.', copy: 'A5 aged brass with cream lettering, on an oak board and ground stake.', image: '/site-images/tree-plaque-photos/memorial-tree-plaque-apple-v2.webp', alt: 'Aged brass tree plaque reading This apple tree was planted in loving memory of Pauline Hargreaves, 1940 to 2023, on an oak board and ground stake beside a young apple tree' },
      { title: 'An oak on the village green.', copy: 'A5 brushed stainless steel with a scalloped border, on an oak board and ground stake.', image: '/site-images/tree-plaque-photos/memorial-tree-plaque-oak-v2.webp', alt: 'Brushed stainless steel tree plaque reading This oak was planted in memory of Kathleen Ellis, 1942 to 2024, on an oak board and ground stake beside a young oak in a tree guard' },
      { title: 'A school’s tree for a teacher.', copy: 'A5 polished stainless steel on an oak board and ground stake, on the school field.', image: '/site-images/tree-plaque-photos/memorial-tree-plaque-school-v2.webp', alt: 'Polished stainless steel tree plaque reading This tree was planted by the children of Ashfield Primary School in memory of Mrs Long, on an oak board and ground stake' },
      { title: 'A silver birch for Moss.', copy: 'A5 polished brass on an oak board and ground stake, in the bark mulch.', image: '/site-images/tree-plaque-photos/memorial-tree-plaque-birch-v2.webp', alt: 'Polished brass pet memorial plaque reading In loving memory of Moss, 2009 to 2023, forever by our side, on an oak board and ground stake beside a young silver birch' },
    ],
    sections: [
      {
        title: 'Choose a size for the whole inscription',
        copy: 'A 150 × 50 mm bench plaque suits a name, dates and a short dedication. A5 (210 × 148 mm) gives a longer tribute more room. A4 (297 × 210 mm) suits a shared garden dedication or a message with several names. Measure the available mounting surface before choosing.',
      },
      {
        title: 'Choose the finish by setting',
        copy: 'Brass gives a warm contrast against timber and stone. Aged brass is hand-patinated and sealed for a softer appearance. Stainless steel has a silver finish that suits a simple, contemporary garden. Brushed and polished brass naturally change over time; choose with that changing appearance in mind.',
      },
      {
        title: 'Give every line enough space',
        copy: 'Make the name or dedication the clearest part of the layout, then place dates and the personal message beneath it. Keep lettering clear of the border and fixing holes. View the proof at the intended plaque size: if it feels crowded, shorten the message or choose a larger plaque.',
      },
    ],
    faqs: [
      { question: 'Can garden plaques be used outside?', answer: 'Yes. Choose brass or stainless steel with suitable fixings. The proof shows the layout, material and fixings before payment.' },
      { question: 'What size is best for a garden plaque?', answer: 'A5 is a good starting point for names, dates and a short message. Bench plaque sizes work better for very short wording.' },
    ],
    relatedSearches: ['garden plaques UK', 'memorial garden plaques', 'tree dedication plaques', 'outdoor memorial plaques'],
  },
  {
    slug: 'memorial-plaque-wording',
    heroNote: 'The right words, one line at a time.',
    title: 'Memorial plaque wording',
    shortTitle: 'Wording',
    eyebrow: 'Ideas and examples',
    description: 'Memorial plaque wording ideas: over 40 examples for a mum or dad, grandparents, partners, children, friends, benches, trees and pets.',
    seoTitle: 'Memorial Plaque Wording Ideas & Examples | What to Write | InstaPlaque',
    seoDescription: 'What to write on a memorial plaque: over 40 wording examples for mums, dads, grandparents, benches, trees and pets, plus short phrases. We can design it for you.',
    heroCopy: 'Finding the right words is often the hardest part. Here is a simple way to structure the wording, over 40 examples for different people and places, and short phrases to finish with. When you have a few words, design it online or send them to us on WhatsApp and we’ll lay it out for you.',
    image: '/site-images/catalogue-photo/aged-brass-210x148-rect-plaque.webp',
    relatedProductSlug: 'memorial-plaques',
    proofCta: 'Start a memorial plaque proof',
    sections: [],
    faqs: [
      { question: 'What do you write on a memorial plaque?', answer: 'Most memorial plaques have an opening line such as “In loving memory of”, the name, the years, and one short line about the person, such as “who loved this garden”. You can add who it is from on a final, smaller line.' },
      { question: 'How many words fit on a memorial plaque?', answer: 'A 150 × 50 mm bench plaque fits three or four short lines. An A5 plaque fits five or six lines and an A4 plaque seven to ten. If it looks crowded, choose a larger plaque rather than smaller lettering.' },
      { question: 'Should I include the dates?', answer: 'It is up to you. Years are enough for most plaques, such as 1942 – 2024. Full dates suit a church or formal plaque, and some families leave dates out altogether.' },
      { question: 'Can you help me with the wording?', answer: 'Yes. Send us what you have on WhatsApp, even just a name and a few notes, and we’ll suggest wording and send a free proof, usually within 3 working hours.' },
    ],
    relatedSearches: ['memorial plaque wording', 'what to write on a memorial plaque', 'memorial bench plaque wording', 'short memorial phrases'],
  },
  {
    slug: 'plaque-sizes',
    heroNote: 'Every standard size, shown with its own wording.',
    title: 'Plaque sizes and prices',
    shortTitle: 'Sizes',
    eyebrow: 'Every size and finish',
    description: 'Every standard InstaPlaque size and finish, each shown with its own example wording and price, from bench plaques to 400 × 300 mm.',
    seoTitle: 'Plaque Sizes & Prices UK | Brass & Stainless Steel Plaques | InstaPlaque',
    seoDescription: 'Compare every plaque size and finish with photos and prices: bench plaques, A5, A4, 300 × 200 mm, 400 × 300 mm, ovals and circles. UK delivery included.',
    heroCopy: 'Every standard plaque we make, in one place: bench plaques from 150 × 50 mm up to 400 × 300 mm wall plaques, ovals and circles, in six brass and stainless steel finishes, with or without wood backing. Each is shown with its own example wording. Need a size that isn’t here? Message us on WhatsApp and we’ll make it.',
    image: '/site-images/catalogue-photo/polished-brass-297x210-rect-plaque.webp',
    relatedProductSlug: 'bench-plaques',
    proofCta: 'Start a plaque proof',
    sections: [
      { title: 'Measure the space first', copy: 'Measure the flat area where the plaque will go, then choose the size that leaves a margin all round. A5 is half a sheet of A4 paper; holding a sheet of paper in place is a quick way to check.' },
      { title: 'Choose the size for the words', copy: 'Short bench dedications fit 150 × 50 mm; a name, dates and a tribute suit A5; formal dedications, openings and lists of names need A4 or larger. If the proof looks crowded, go up a size rather than making the lettering smaller.' },
      { title: 'Then the finish and backing', copy: 'Brushed or polished stainless steel stays silver; brushed, polished, orbital and aged brass are warm and traditional. Wood backing suits indoors or a sheltered spot; metal on its own is made for outdoors.' },
    ],
    faqs: [
      { question: 'What is the most popular plaque size?', answer: 'For memorials and house names, A5 (210 × 148 mm). For benches, 150 × 50 mm or 225 × 75 mm. For openings and formal dedications, A4 (297 × 210 mm).' },
      { question: 'Do you make other sizes?', answer: 'Yes. Message us on WhatsApp with the size, shape and wording, and we’ll design it and send you a free proof with the price.' },
    ],
    relatedSearches: ['plaque sizes', 'brass plaque sizes', 'memorial plaque sizes', 'A5 brass plaque'],
  },
  {
    slug: 'tree-memorial-plaques',
    heroNote: 'A tree that grows, and their name beside it.',
    title: 'Tree memorial plaques',
    shortTitle: 'Tree',
    eyebrow: 'Memorial tree dedications',
    description: 'Engraved brass and stainless steel plaques for a memorial tree in a garden, churchyard, school or park.',
    seoTitle: 'Memorial Tree Plaques UK | Engraved Tree Dedication Plaques | InstaPlaque',
    seoDescription: 'Personalised memorial tree plaques in brass or stainless steel, on an oak board and black steel ground stake beside the tree. Free proof, or we design it on WhatsApp.',
    heroCopy: 'Planting a tree is a living way to remember someone. Mark it with a plaque in their name, in brass or stainless steel on a solid oak board with a black steel ground stake that stands beside the tree, never fixed to it. See a free online proof, or send us your words on WhatsApp and we’ll design it for you.',
    image: '/site-images/tree-plaque-photos/memorial-tree-plaque-cherry-v2-sq.webp',
    relatedProductSlug: 'memorial-plaques',
    // Every tree plaque is priced on the oak board and ground stake (owner msg 6506: "you kinda need it for this product").
    mount: 'stake',
    proofCta: 'Start a tree plaque proof',
    sections: [
      { title: 'Fix it beside the tree, not to it', copy: `Screws and wire damage a growing tree, and the bark slowly swallows anything fixed to it. Stand the plaque beside it instead: we fix the plate to a solid oak board on a black steel ground stake, ${GROUND_STAKE_LENGTH} long, that pushes straight into the soil at the foot of the tree, as in the photos below. Our tree plaque prices include the board and the stake, and the designer starts with both. A short post, a nearby wall or a fence work too.` },
      { title: 'Choose a size for the words and the setting', copy: 'A 200 × 150 mm plaque suits a name, dates and a line about them. A5 (210 × 148 mm) is the most popular size for a memorial tree, with room for a dedication such as “This cherry tree was planted in loving memory of”. Choose A4 (297 × 210 mm) for a school, a community orchard or several names, or a round plaque for a short dedication.' },
      { title: 'Pick a finish that suits the garden', copy: 'Stainless steel keeps its silver colour outdoors. Brass is warm and traditional and slowly mellows outside; aged brass starts darker and keeps developing gently. An oak backing board suits a sheltered spot in the garden; in an open, exposed position choose a metal plaque without backing.' },
      { title: 'Check first if the tree is in a public place', copy: 'Parks, churchyards, schools and cemeteries usually have rules for memorial trees and plaques. Ask the site manager or council about the permitted size, material, wording and fixing before ordering; many councils run their own tree dedication schemes. Approving our proof does not replace their permission.' },
    ],
    examples: [
      { title: 'A cherry tree for Jim.', copy: 'A5 brushed brass with a scalloped border, on an oak board and black steel ground stake.', image: '/site-images/tree-plaque-photos/memorial-tree-plaque-cherry-v2.webp', alt: 'Brushed brass tree plaque reading This cherry tree was planted in loving memory of Jim Partridge, 1947 to 2025, on an oak board and black steel ground stake beside a young cherry tree in blossom' },
      { title: 'An apple tree for Pauline.', copy: 'A5 aged brass with cream lettering, on an oak board and ground stake.', image: '/site-images/tree-plaque-photos/memorial-tree-plaque-apple-v2.webp', alt: 'Aged brass tree plaque reading This apple tree was planted in loving memory of Pauline Hargreaves, 1940 to 2023, on an oak board and ground stake beside a young apple tree' },
      { title: 'An oak on the village green.', copy: 'A5 brushed stainless steel with a scalloped border, on an oak board and ground stake.', image: '/site-images/tree-plaque-photos/memorial-tree-plaque-oak-v2.webp', alt: 'Brushed stainless steel tree plaque reading This oak was planted in memory of Kathleen Ellis, 1942 to 2024, on an oak board and ground stake beside a young oak in a tree guard' },
      { title: 'A school’s tree for a teacher.', copy: 'A5 polished stainless steel on an oak board and ground stake, on the school field.', image: '/site-images/tree-plaque-photos/memorial-tree-plaque-school-v2.webp', alt: 'Polished stainless steel tree plaque reading This tree was planted by the children of Ashfield Primary School in memory of Mrs Long, on an oak board and ground stake' },
      { title: 'A silver birch for Moss.', copy: 'A5 polished brass on an oak board and ground stake, in the bark mulch.', image: '/site-images/tree-plaque-photos/memorial-tree-plaque-birch-v2.webp', alt: 'Polished brass pet memorial plaque reading In loving memory of Moss, 2009 to 2023, forever by our side, on an oak board and ground stake beside a young silver birch' },
    ],
    faqs: [
      { question: 'Can I fix a plaque to a tree?', answer: 'We recommend not fixing it to the tree itself. Screws and wire damage a growing tree and the bark grows over them. Stand the plaque beside the tree on an oak board and black steel ground stake (both are included in our tree plaque prices), or fix it to a short post, a nearby wall or a fence.' },
      { question: 'What size should a memorial tree plaque be?', answer: 'A5 (210 × 148 mm) suits most memorial trees: a dedication line, a name, dates and a short message. Choose 200 × 150 mm for shorter wording, or A4 for a school, a community planting or several names.' },
      { question: 'What should a tree memorial plaque say?', answer: 'Most start with a dedication such as “This oak was planted in memory of”, then the name, the dates and a short line about them, such as “who loved this garden”. Send us a few words on WhatsApp if you would like help with the wording.' },
      { question: 'Will the plaque last outdoors?', answer: 'Yes. Our brass and stainless steel plaques are 1.5 mm solid metal with etched, paint-filled lettering. Stainless steel keeps its colour and brass mellows slowly outside. For an open, exposed spot choose a metal plaque without wood backing.' },
      { question: 'Can you add a photo or portrait?', answer: 'Yes, on A5 and larger plaques. Send a favourite photo of a person or pet on WhatsApp and we turn it into engraving artwork beside the wording, with a free proof before you pay.' },
      { question: 'Can you design it for me?', answer: 'Yes. Send us the wording, the kind of tree and where the plaque will go on WhatsApp, and we send you a proof drawn to size, usually within 3 working hours.' },
    ],
    relatedSearches: ['memorial tree plaques', 'tree dedication plaques', 'memorial plaque for a tree', 'tree planting memorial plaque'],
  },
  {
    slug: 'opening-plaques',
    title: 'Opening plaques',
    shortTitle: 'Opening',
    eyebrow: 'Formal launch and unveiling plaques',
    description: 'Custom opening plaques for buildings, rooms, community spaces and formal unveilings, with an online proof before payment.',
    seoTitle: 'Opening Plaques UK | Custom Building Opening Plaques',
    seoDescription: 'Order custom opening plaques in the UK with a free online proof. Brass and stainless steel plaques for building openings, unveilings, presentations and formal ceremonies.',
    heroCopy: 'Create an opening plaque for a school, building or community space. Arrange the venue name, opening person and date in a free online proof, with the price shown before payment. Start with A4 for formal wording and check any fixed ceremony deadline with us before ordering.',
    image: '/site-images/home-gallery-brass-community.webp',
    relatedProductSlug: 'a4-plaques',
    proofCta: 'Start an opening plaque proof',
    sections: [
      {
        title: 'Agree the names, titles and date first',
        copy: 'Gather the official venue name, the opening person’s full name and title, the ceremony date and any required acknowledgement. For schools, community centres and funded projects, check contributor names with the people responsible before creating the final proof.',
      },
      {
        title: 'Choose a size for the inscription and location',
        copy: 'A4 (297 × 210 mm) provides space for a heading, name, role and date. A5 (210 × 148 mm) can work for a shorter inscription in a smaller space. Measure the wall or presentation area, consider how close visitors will stand and use the proof to check that every line has enough room.',
      },
      {
        title: 'Plan the finish and mounting',
        copy: 'Brass has a warm, traditional appearance; stainless steel has a silver finish suited to modern settings. Optional wood backing is available for suitable plaques and adds to the price and production time. Check the fixing options against the intended wall or support before approval.',
      },
      {
        title: 'Leave time for approval and the ceremony',
        copy: 'Download the proof PDF to share with colleagues and agree one final version before paying. Production begins after approval and payment, with delivery time additional. If your plaque is needed for an unveiling, contact us with the required arrival date and postcode before placing the order. For logos or supplied artwork, ask us to confirm what is possible before relying on it in your design.',
      },
    ],
    faqs: [
      { question: 'Can colleagues check the opening plaque before we order?', answer: 'Yes. Download the proof PDF and share it for review. It includes a link back to the design. Agree the exact spelling, titles, date and acknowledgement wording before one person approves the final layout and places the order.' },
      { question: 'Can you meet our opening ceremony date?', answer: 'Contact us before ordering with the required arrival date, delivery postcode and plaque options. Production estimates start after proof approval and payment, and delivery takes additional time. Please have the date confirmed before depending on the plaque for an event.' },
      { question: 'Can the plaque include a school crest or organisation logo?', answer: 'The online designer is set up for inscription layouts. For a crest, logo or supplied artwork, contact us before ordering so we can confirm whether your requirements can be accommodated and how they affect the proof, price and timing.' },
    ],
    relatedSearches: ['opening plaques UK', 'building opening plaques', 'unveiling plaques', 'presentation plaques'],
  },
  {
    slug: 'commemorative-plaques',
    title: 'Commemorative plaques',
    shortTitle: 'Commemorative',
    eyebrow: 'Recognition and remembrance plaques',
    description: 'Custom commemorative plaques for people, places, donations, projects and public spaces, proofed online before checkout.',
    seoTitle: 'Commemorative Plaques UK | Custom Recognition Plaques',
    seoDescription: 'Commemorative plaques for people, places, projects, anniversaries and public recognition. Choose the right size and check the proof before ordering.',
    heroCopy: 'Commemorative plaques mark people, places, projects and moments. The copy should be formal enough to last, but simple enough to read quickly.',
    image: '/site-images/home-carousel-reading-room.webp',
    relatedProductSlug: 'a4-plaques',
    proofCta: 'Start a commemorative proof',
    sections: [
      {
        title: 'For recognition and remembrance',
        copy: 'Use them for anniversaries, restorations, public spaces, founders, donors, project openings and dedications.',
      },
      {
        title: 'Choose space over crowding',
        copy: 'A5 suits shorter wording. A4 is better for names, project details and longer dedications.',
      },
    ],
    faqs: [
      { question: 'What can a commemorative plaque be used for?', answer: 'Common uses include anniversaries, donors, openings, restorations, memorials, public spaces and recognition wording.' },
      { question: 'Can I check longer wording before ordering?', answer: 'Yes. The online proof lets you review line breaks, hierarchy and spacing before approving the plaque.' },
    ],
    relatedSearches: ['commemorative plaques UK', 'recognition plaques', 'donor plaques', 'custom dedication plaques'],
  },
  {
    slug: 'engraved-plaques',
    title: 'Engraved plaques',
    shortTitle: 'Engraved',
    eyebrow: 'Custom engraved metal plaques',
    description: 'Custom engraved plaques in brass and stainless steel with live pricing, free online proofing and UK delivery included.',
    seoTitle: 'Engraved Plaques UK | Custom Brass & Stainless Steel Plaques',
    seoDescription: 'Order custom engraved plaques online in the UK. Create a free proof for brass, stainless steel, memorial, bench, wall and presentation plaques before payment.',
    heroCopy: 'If you know you need an engraved plaque but not the exact category, start here. Choose the size, material and wording, then check the proof before ordering.',
    image: '/site-images/home-realistic-proof-row.jpg',
    relatedProductSlug: 'custom-plaques',
    proofCta: 'Start an engraved plaque proof',
    sections: [
      {
        title: 'One-off engraved plaques',
        copy: 'Suitable for memorials, benches, gardens, buildings, awards, openings and recognition wording.',
      },
      {
        title: 'What is included',
        copy: 'Standard prices include engraving, standard fixings and UK delivery, with extras shown before checkout.',
      },
    ],
    faqs: [
      { question: 'Can I order one engraved plaque?', answer: 'Yes. InstaPlaque is set up for single custom plaque orders as well as bespoke requests.' },
      { question: 'Do engraved plaques include delivery?', answer: 'UK delivery is included for standard plaques. Delivery is included throughout the UK, including Northern Ireland, the Highlands and islands. Unusual plaque sizes may need confirmation before payment.' },
    ],
    relatedSearches: ['engraved plaques UK', 'custom engraved plaques', 'engraved brass plaques', 'engraved metal plaques'],
  },
  {
    slug: 'pet-memorial-plaques',
    title: 'Pet memorial plaques',
    shortTitle: 'Pet memorial',
    eyebrow: 'Garden and remembrance plaques',
    description: 'Custom pet memorial plaques for gardens, homes, benches and remembrance corners, proofed online before ordering.',
    seoTitle: 'Pet Memorial Plaques UK | Custom Garden Pet Plaques',
    seoDescription: 'Pet memorial plaques for gardens, homes, stables and remembrance corners. Add a name, dates and short message, then check the proof before payment.',
    heroCopy: 'A pet memorial plaque should feel warm, simple and durable. Add the name, dates and a short message, then check the proof before payment.',
    image: '/site-images/plaque-hero-cat.png',
    relatedProductSlug: 'memorial-plaques',
    proofCta: 'Start a pet memorial proof',
    sections: [
      {
        title: 'For gardens, homes and remembrance corners',
        copy: 'Suitable for dogs, cats, horses and other pets, whether the plaque is going in a garden, stable, planter, wall or indoor display.',
      },
      {
        title: 'Gentle material choices',
        copy: 'Brass gives a traditional memorial feel. Stainless steel is clean and durable. Aged brass works well in planted or natural settings.',
      },
    ],
    faqs: [
      { question: 'Can I make a memorial plaque for a dog or cat?', answer: 'Yes. Add the pet name, dates and message, then approve the proof before checkout.' },
      { question: 'Can a pet memorial plaque go outside?', answer: 'Yes. Brass and stainless steel are suitable for outdoor use with appropriate fixings.' },
    ],
    relatedSearches: ['pet memorial plaques UK', 'dog memorial plaques', 'cat memorial plaques', 'horse memorial plaques'],
  },
  {
    slug: 'tree-plaques',
    title: 'Tree plaques',
    shortTitle: 'Tree',
    eyebrow: 'Tree dedication plaques',
    description: 'Custom tree plaques for memorial trees, donated trees, garden dedications and planted remembrance areas.',
    seoTitle: 'Tree Plaques UK | Custom Memorial Tree Dedication Plaques',
    seoDescription: 'Tree plaques for memorial trees, donated trees, family gardens and community planting projects, made in brass or stainless steel.',
    heroCopy: 'Tree plaques are best when the wording is short and readable. Use them for memorial trees, donated trees, family gardens and community planting projects.',
    image: '/site-images/home-carousel-garden-brass.webp',
    relatedProductSlug: 'memorial-plaques',
    proofCta: 'Start a tree plaque proof',
    sections: [
      {
        title: 'Dedication wording that lasts',
        copy: 'A name, date and short line of dedication usually reads better than a long message outdoors.',
      },
      {
        title: 'Match the setting',
        copy: 'Brass and aged brass suit timber, stone and planting. Stainless steel gives a quieter modern finish.',
      },
    ],
    faqs: [
      { question: 'What should a tree plaque say?', answer: 'Most tree plaques include a name, date and short dedication. The proof helps check that the wording is not too crowded.' },
      { question: 'Which material is best for a tree plaque?', answer: 'Brass and stainless steel are both suitable. Stainless is cleaner and more contemporary; brass is warmer and more traditional.' },
    ],
    relatedSearches: ['tree plaques UK', 'memorial tree plaques', 'tree dedication plaques', 'donated tree plaques'],
  },
  {
    slug: 'donor-plaques',
    title: 'Donor plaques',
    shortTitle: 'Donor',
    eyebrow: 'Recognition and funding plaques',
    description: 'Custom donor plaques for fundraising, community projects, restorations, rooms, gardens and public recognition.',
    seoTitle: 'Donor Plaques UK | Custom Recognition & Fundraising Plaques',
    seoDescription: 'Order custom donor plaques in the UK with a free online proof. Brass and stainless steel plaques for fundraising, restorations, rooms, gardens and public recognition.',
    heroCopy: 'Donor plaques should recognise support clearly without becoming cluttered. Start with the project, donor names and date, then check the layout in the proof.',
    image: '/site-images/home-gallery-brass-community.webp',
    relatedProductSlug: 'a4-plaques',
    proofCta: 'Start a donor plaque proof',
    sections: [
      {
        title: 'For funded projects and public recognition',
        copy: 'Suitable for community spaces, restorations, gardens, rooms, benches, schools and sponsored improvements.',
      },
      {
        title: 'Use the right size for names',
        copy: 'A5 works for a single donor or short message. A4 or custom sizing is better for multiple names or formal project wording.',
      },
    ],
    faqs: [
      { question: 'Can a donor plaque include multiple names?', answer: 'Yes. For longer donor lists, start with A4 or a custom plaque so the text remains readable.' },
      { question: 'Can I proof a fundraising plaque before paying?', answer: 'Yes. Create the proof online and check the layout before approving checkout.' },
    ],
    relatedSearches: ['donor plaques UK', 'recognition plaques', 'fundraising plaques', 'sponsor plaques'],
  },
  {
    slug: 'memorial-bench-plaques',
    title: 'Memorial bench plaques',
    shortTitle: 'Memorial bench',
    eyebrow: 'Outdoor bench dedications',
    description: 'Custom memorial bench plaques for names, dates and short remembrance wording on outdoor benches and seats.',
    seoTitle: 'Memorial Bench Plaques UK | Custom Bench Dedication Plaques',
    seoDescription: 'Memorial bench plaques for names, dates and short dedications. Choose brass, aged brass or stainless steel and check the proof before ordering.',
    heroCopy: 'A memorial bench plaque has limited space, so every line matters. Use the proof to check the name, dates, message, border and screw positions before ordering.',
    image: '/seo/realistic/memorial-bench-plaques/hero-16x9.jpg',
    mobileImage: '/seo/realistic/memorial-bench-plaques/hero-9x16.jpg',
    relatedProductSlug: 'bench-plaques',
    proofCta: 'Start a memorial bench proof',
    sections: [
      {
        title: 'Short inscriptions work best',
        copy: 'A compact bench plaque usually suits three to five short lines. Longer poems or detailed messages need a larger plaque.',
      },
      {
        title: 'Built for outdoor benches',
        copy: 'Choose stainless steel for a clean modern finish, brass for a traditional look, or aged brass for a softer memorial appearance.',
      },
      {
        title: 'Useful for parks, gardens and family benches',
        copy: 'Memorial bench plaques are used on park benches, garden seats, woodland trails, sports club benches, school grounds and private family gardens. If a council, charity or venue has size rules, start with their required dimensions.',
      },
    ],
    buyingGuide: [
      {
        title: 'Keep the inscription short',
        copy: 'A compact bench plaque normally suits 3-5 short lines. For example: name, years, and a short phrase such as “Forever in our hearts”. Longer poems or full messages need a larger plaque.',
      },
      {
        title: 'Choose the finish by setting',
        copy: 'Stainless steel suits modern benches, coastal settings and clean public spaces. Brass feels warmer on timber benches and traditional garden seats. Aged brass gives a softer, less shiny memorial look.',
      },
      {
        title: 'Check fixings before checkout',
        copy: 'Bench plaques are usually fixed with two visible screws. The online proof shows the screw heads and border so you can catch awkward spacing before production.',
      },
    ],
    examples: [
      {
        title: 'Brushed stainless steel',
        copy: 'A clean silver finish for outdoor bench dedications and public-space seating.',
        image: '/seo/realistic/memorial-bench-plaques/example-1.jpg',
        alt: 'Brushed stainless steel memorial bench plaque proof example',
      },
      {
        title: 'Traditional brass',
        copy: 'A warmer classic finish for timber benches, family gardens and remembrance seats.',
        image: '/seo/realistic/memorial-bench-plaques/example-2.jpg',
        alt: 'Traditional brass memorial bench plaque proof example',
      },
      {
        title: 'Aged brass',
        copy: 'A softer patinated look for natural gardens, older benches and quiet memorial spaces.',
        image: '/seo/realistic/memorial-bench-plaques/example-3.jpg',
        alt: 'Aged brass memorial bench plaque proof example',
      },
      {
        title: 'Polished stainless steel',
        copy: 'A brighter silver finish for short inscriptions where a more reflective plaque face suits the setting.',
        image: '/seo/realistic/memorial-bench-plaques/example-4.jpg',
        alt: 'Polished stainless steel memorial bench plaque proof example',
      },
    ],
    faqs: [
      { question: 'What size is a memorial bench plaque?', answer: 'The compact bench plaque starts at 150 x 50 mm and is best for short inscriptions.' },
      { question: 'Can I preview the bench plaque before ordering?', answer: 'Yes. Enter the wording and review the free proof before checkout.' },
      { question: 'What wording fits on a memorial bench plaque?', answer: 'A name, dates and one short dedication usually works best. If the message needs several sentences, choose a larger plaque rather than forcing the text into a bench size.' },
      { question: 'Are screw fixings included?', answer: 'Standard screw fixings are included for standard bench plaques, and the proof shows where the visible fixings sit.' },
    ],
    relatedSearches: ['memorial bench plaques UK', 'bench dedication plaques', 'engraved bench plaques', 'brass bench memorial plaques'],
  },
  {
    slug: 'ashes-scattering-plaques',
    title: 'Ashes scattering plaques',
    shortTitle: 'Ashes',
    eyebrow: 'Quiet remembrance plaques',
    description: 'Custom ashes scattering plaques for gardens, remembrance areas, trees, benches and family memorial spaces.',
    seoTitle: 'Ashes Scattering Plaques UK | Custom Remembrance Plaques',
    seoDescription: 'Ashes scattering plaques for gardens, trees, benches and remembrance areas, with simple respectful wording checked in a proof before ordering.',
    heroCopy: 'Ashes scattering plaques are often quiet, personal markers for gardens, trees, benches and remembrance areas. The wording should be simple, respectful and easy to read.',
    image: '/site-images/plaque-hero-memorial-wall-desktop.jpg',
    relatedProductSlug: 'memorial-plaques',
    proofCta: 'Start an ashes plaque proof',
    sections: [
      {
        title: 'For remembrance spaces',
        copy: 'Suitable for scattering gardens, planted areas, family gardens, tree dedications and small wall plaques.',
      },
      {
        title: 'Keep it clear',
        copy: 'A name, dates and short dedication usually works best. A5 is a good starting size unless the wording is very short.',
      },
    ],
    faqs: [
      { question: 'Can I make a plaque for an ashes scattering area?', answer: 'Yes. Add the name, dates and short message, then review the proof before checkout.' },
      { question: 'Which size should I choose?', answer: 'A5 is a good starting point for a name, dates and short tribute. Bench sizes are better for very short wording.' },
    ],
    relatedSearches: ['ashes scattering plaques UK', 'scattering garden plaques', 'remembrance garden plaques', 'ashes memorial plaques'],
  },
  {
    slug: 'school-opening-plaques',
    title: 'School opening plaques',
    shortTitle: 'School opening',
    eyebrow: 'Education and ceremony plaques',
    description: 'Custom school opening plaques for new buildings, classrooms, libraries, gardens, awards and formal unveilings.',
    seoTitle: 'School Opening Plaques UK | Custom School Building Plaques',
    seoDescription: 'Order custom school opening plaques in the UK with a free online proof. Brass and stainless steel plaques for buildings, classrooms, libraries, gardens and unveilings.',
    heroCopy: 'School opening plaques need to be formal, readable and durable. The wording usually includes the school or building name, opening person, role and date.',
    image: '/site-images/home-carousel-reading-room.webp',
    relatedProductSlug: 'a4-plaques',
    proofCta: 'Start a school opening proof',
    sections: [
      {
        title: 'For classrooms, libraries and new buildings',
        copy: 'Suitable for halls, gardens, funded spaces, awards, restorations and formal unveilings.',
      },
      {
        title: 'A4 is usually right',
        copy: 'A4 gives the school name, ceremony details and date enough space. Brass feels traditional; stainless steel suits modern school interiors.',
      },
    ],
    faqs: [
      { question: 'Can I include a headteacher, mayor or MP name?', answer: 'Yes. Add the name, role and date, then check the formal layout in the proof.' },
      { question: 'Which material suits a school opening plaque?', answer: 'Brass is traditional for ceremonial plaques. Stainless steel is a good choice for modern school interiors and outdoor spaces.' },
    ],
    relatedSearches: ['school opening plaques UK', 'school building plaques', 'classroom opening plaques', 'library opening plaques'],
  },
];

export const materialStories = [
  {
    title: 'Brushed brass',
    image: '/materials/optimized/brushed-brass-clean.webp',
    thumbnail: '/materials/thumbs/brushed-brass.webp',
    sliderImage: '/materials/slider/brushed-brass.webp',
    family: 'Brass',
    tone: 'Warm satin grain',
    copy: 'Warm, traditional and legible for memorial, dedication and presentation plaques.',
  },
  {
    title: 'Polished brass',
    image: '/materials/optimized/polished-brass-clean.webp',
    thumbnail: '/materials/thumbs/polished-brass.webp',
    sliderImage: '/materials/slider/polished-brass.webp',
    family: 'Brass',
    tone: 'Bright polished face',
    copy: 'A brighter brass for presentation plaques that need a formal, refined face.',
  },
  {
    title: 'Aged brass',
    image: '/materials/optimized/mid-aged-brass.webp',
    thumbnail: '/materials/thumbs/aged-brass.webp',
    sliderImage: '/materials/slider/aged-brass.webp',
    family: 'Brass',
    tone: 'Hand-applied patina',
    copy: 'Light, mid or heavy patina, applied by hand and sealed with matt lacquer to slow further natural ageing.',
  },
  {
    title: 'Orbital brass',
    image: '/materials/optimized/orbital-brass-clean.webp',
    thumbnail: '/materials/thumbs/orbital-brass.webp',
    sliderImage: '/materials/slider/orbital-brass.webp',
    family: 'Brass',
    tone: 'Engine-turned movement',
    copy: 'A distinctive orbital grain for a more decorative, crafted brass surface.',
  },
  {
    title: 'Brushed stainless steel',
    image: '/materials/optimized/brushed-stainless-satin.webp',
    thumbnail: '/materials/thumbs/brushed-stainless.webp',
    sliderImage: '/materials/slider/brushed-stainless.webp',
    family: 'Stainless',
    tone: 'Cool linear satin',
    copy: 'Clean and restrained for outdoor bench plaques, public spaces and contemporary settings.',
  },
  {
    title: 'Mirror stainless',
    image: '/materials/optimized/polished-stainless-clean.webp',
    thumbnail: '/materials/thumbs/polished-stainless.webp',
    sliderImage: '/materials/slider/polished-stainless.webp',
    family: 'Stainless',
    tone: 'Polished silver sheen',
    copy: 'Crisp and reflective for modern plaques where a polished look matters.',
  },
  {
    title: 'Dark wood backing',
    image: '/materials/optimized/wood-dark-mahogany-veneer.webp',
    thumbnail: '/materials/thumbs/dark-wood.webp',
    sliderImage: '/materials/slider/dark-wood.webp',
    family: 'Wood',
    tone: 'Deep timber grain',
    copy: 'Adds depth and presentation weight with square or bevelled backing options.',
  },
  {
    title: 'Light wood backing',
    image: '/materials/optimized/wood-light-oak-veneer.webp',
    thumbnail: '/materials/thumbs/light-wood.webp',
    sliderImage: '/materials/slider/light-wood.webp',
    family: 'Wood',
    tone: 'Pale oak grain',
    copy: 'A lighter backing option for softer contrast behind brass or stainless plates.',
  },
];

// Catalogue photos redrawn after launch keep their file name but get ?v=N, so phones and Google fetch the new copy
// (owner msg 5927, 24 Oct 2026: tree, orchard and hedge plaques shown with no tree, orchard or hedge, a pet's
// "Here lies" on a house wall). The A5 stainless plaque had only a studio picture; it now has an in-place photo.
// Version 3: redrawn again with the plaque at its true size against bricks, stones and posts (owner msg 5959).
// The middle step in breadcrumbs (owner msg 6264, the architecture review): bench, garden and tree plaques sit under
// memorial plaques, as the memorial page's "Where will it go?" tiles already show.
const memorialParent = { slug: 'memorial-plaques', title: 'Memorial plaques' };
export function categoryParentFor(slug: string): { slug: string; title: string } | undefined {
  return ['bench-plaques', 'garden-plaques', 'tree-memorial-plaques'].includes(slug) ? memorialParent : undefined;
}

const cataloguePhotoVersions: Record<string, number> = {
  'brushed-stainless-200x150-rect-plaque': 3,
  'polished-brass-210x148-rect-plaque': 3,
  'polished-brass-148x210-rect-plaque': 3,
  'polished-stainless-210x297-rect-plaque': 3,
  'aged-brass-297x210-rect-plaque': 3,
  'orbital-brass-matt-lacquer-200x200-circle-plaque': 3,
  'polished-brass-200x200-circle-plaque': 3,
  'a5-brushed-steel-personalised-plaque': 2,
  // Version 2: real-looking photos with new example wording and a setting from each plaque's story (owner msg 6056);
  // version 3: redone at their true thickness (owner msg 6085).
  'aged-brass-210x148-rect-plaque': 4, // version 4: the brass page's aged tile, plain wording, no portrait (msg 6281)
  'polished-brass-250x150-oval-plaque': 3,
  'polished-stainless-148x210-rect-plaque': 3,
  'polished-brass-297x210-rect-plaque': 3,
  'aged-brass-148x210-rect-plaque': 3,
  'brushed-stainless-300x200-rect-plaque': 3,
  'polished-brass-148x210-rect-light-wood-plaque': 3,
  'brushed-stainless-150x50-rect-plaque': 3,
  // Round 2 (owner msg 6085): true thickness, wall memorials on wood with the scalloped border, workshop shots.
  'brushed-stainless-210x148-rect-dark-wood-plaque': 2,
  'aged-brass-400x300-rect-light-wood-plaque': 3,
  'polished-stainless-210x297-rect-dark-wood-plaque': 3,
  'aged-brass-148x210-rect-dark-wood-plaque': 2,
  'polished-brass-200x150-rect-light-wood-plaque': 2,
  // The bench page's picks, redone the same way with fuller dedications (owner msg 6132); version 3 from a coded
  // 3D layout of each bench, plaque square on the top rail, plain settings, newer benches (owner msgs 6149-6154),
  // with the simpler "In loving memory of", name and dates wording (msgs 6189-6192); version 4 with each plaque
  // level in the frame (msg 6214). Mary Quinn's workshop shot has no bench and stays at 3.
  'brushed-brass-225x75-rect-plaque': 4,
  'polished-stainless-200x50-rect-plaque': 4,
  'aged-brass-150x75-rect-plaque': 4,
  'polished-brass-150x65-rect-plaque': 3,
  'orbital-brass-matt-lacquer-150x75-rect-plaque': 4,
  'brushed-stainless-150x75-rect-plaque': 4,
  'polished-stainless-225x65-rect-plaque': 4,
  // The garden page's picks and its fence tile's plaque, from coded layouts of the wall, fence, shed or gate they are
  // fixed to, with the simpler wording (owner msgs 6189, 6229, 6281). The fence plaque's page shows a square crop of
  // the tile.
  'polished-stainless-210x148-rect-plaque': 2,
  'aged-brass-250x150-oval-plaque': 2,
  'brushed-brass-200x200-circle-plaque': 2,
  'orbital-brass-matt-lacquer-300x200-rect-plaque': 2,
  'orbital-brass-matt-lacquer-200x150-rect-plaque': 2,
  // The brass and stainless pages' top photos and finish tiles, made the same way (owner msgs 6270, 6281). The A5
  // brushed brass page shows a square crop of the brass page's top photo.
  'brushed-brass-210x148-rect-plaque': 2,
  'brushed-brass-297x210-rect-dark-wood-plaque': 2,
  'polished-brass-200x150-rect-plaque': 2,
  'orbital-brass-matt-lacquer-297x210-rect-plaque': 2,
  'brushed-stainless-250x150-oval-plaque': 2,
  'polished-stainless-297x210-rect-plaque': 2,
  'polished-stainless-200x150-rect-light-wood-plaque': 2,
  // The opening and custom pages' plaques, made the same way; the A4 brushed stainless page shows a square crop of the
  // opening page's top photo.
  'brushed-stainless-297x210-rect-plaque': 2,
  'brushed-stainless-297x210-rect-light-wood-plaque': 2,
  'brushed-brass-300x200-rect-light-wood-plaque': 2,
  'brushed-stainless-400x300-rect-dark-wood-plaque': 2,
  'brushed-stainless-200x200-circle-plaque': 2,
  'orbital-brass-matt-lacquer-400x300-rect-plaque': 2,
  // The tree page's top photo (the A5 brushed brass on light oak shows a square crop of it), and the memorial page's
  // two story-style picks redone with plain wording (owner msgs 6270, 6281, 6313).
  'brushed-brass-210x148-rect-light-wood-plaque': 2,
};
const cataloguePhotoFor = (slug: string) => `/site-images/catalogue-photo/${slug}.webp${(cataloguePhotoVersions[slug] || 1) > 1 ? `?v=${cataloguePhotoVersions[slug]}` : ''}`;
/** The 600 px copy of a catalogue photo, keeping any ?v= version. */
export const photo600 = (photo: string) => photo.replace(/\.webp(?=\?|$)/, '-600.webp');

export const merchantProducts: ProductFamily[] = merchantOffers.map(item => catalogueCopy(item, {
  slug: item.slug, title: item.title, shortTitle: item.materialCue === 'stainless' ? 'Stainless' : 'Brass',
  eyebrow: 'Made to order', materialCue: item.materialCue as ProductFamily['materialCue'],
  image: item.image, imageKind: item.imageKind as 'ai' | 'render', merchantOffer: true,
  // Realistic photos (owner msg 5231), now only the ones the owner has seen (services/vettedPhotos.mjs, msg 6270); the
  // others show the flat drawing. The two older photo-style offers keep their own image.
  photo: vettedCataloguePhotos.has(item.slug) ? cataloguePhotoFor(item.slug) : undefined,
  merchantMaterial: item.label, productionDays: item.productionDays,
  description: item.description, seoIntro: item.description, seoTitle: `${item.title} UK | InstaPlaque`,
  seoDescription: `${item.size} ${item.label.toLowerCase()} plaque${item.preset.wood ? ` with ${item.preset.woodTone} wood backing` : ''}. Add your wording, check a free proof and order with UK delivery included.`,
  startingFrom: formatRetailPrice(item.price), schemaStartingPrice: item.price,
  bestFor: ['Your own wording', 'Proof approval before payment', 'UK delivery included'],
  proofPrompt: 'In loving memory of\nALEX MORGAN\nForever in our hearts',
  preset: item.preset as Partial<PlaqueState>,
  faqs: [{ question: 'Is this the price for the pictured configuration?',
    answer: 'Yes. The stated price includes the specified size, finish, fixings and personalised wording. Your approved proof confirms the final layout. Changing the configuration can change the price.' }],
}));

// Each catalogue page gets its own intro, questions, titles and example wording (owner msg 5736);
// the two older photo-style offers keep the shared copy above.
function catalogueCopy(item: (typeof merchantOffers)[number], base: ProductFamily): ProductFamily {
  const example = exampleFor(item.slug);
  if (!example) return base;
  return {
    ...base,
    seoIntro: productIntro(item.slug), heroNote: heroNote(item.slug),
    seoTitle: seoTitleFor(item.slug), seoDescription: seoDescriptionFor(item.slug),
    feedTitle: feedTitleFor(item.slug), feedDescription: feedDescriptionFor(item.slug),
    proofPrompt: example.lines.join('\n'),
    faqs: productFaqs(item.slug),
  };
}
productFamilies.push(...merchantProducts);

export function getProductBySlug(slug: string | null | undefined) {
  return productFamilies.find((product) => product.slug === slug)
    ?? productFamilies.find((product) => product.slug === DEFAULT_PRODUCT_SLUG)
    ?? productFamilies[0];
}

export function getLandingPageBySlug(slug: string | null | undefined) {
  return seoLandingPages.find((page) => page.slug === slug)
    ?? seoLandingPages[0];
}

/** The plaque a landing page's "Design online" opens on, with its from-price: the related product, or on the tree
 * page that product on the oak board and ground stake (owner msg 6506), so the price does not jump (msg 5906). */
export function landingDesignProduct(landing: SeoLandingPage): ProductFamily {
  const related = productFamilies.find((product) => product.slug === landing.relatedProductSlug) ?? productFamilies[0];
  if (landing.mount !== 'stake') return related;
  const preset = onBoardAndStake(related.preset);
  return { ...related, preset, startingFrom: `from ${formatRetailPrice(estimatePlaquePrice(preset as PlaqueState))}` };
}

export function getQuoteReasons(state: PlaqueState, inscription: string) {
  return getCheckoutQuoteReasons(state, inscription);
}

export function getPriceBreakdown(state: PlaqueState, inscription: string): PriceBreakdown {
  return getCheckoutPriceBreakdown(state, inscription);
}

export function makeMockOrder(
  state: PlaqueState,
  inscription: string,
  productTitle: string,
  customerName: string,
  customerEmail: string,
  artifacts: { productionSvg?: string | null; visualProofSvg?: string | null; visualProofPng?: string | null } = {},
  deliveryAddress?: DeliveryAddress,
): MockOrder {
  const priceBreakdown = getPriceBreakdown(state, inscription);
  const stamp = Date.now().toString().slice(-6);
  const id = `PSAI-${stamp}`;
  const createdAt = new Date().toISOString();
  const needsCheck = priceBreakdown.quoteRequired;
  return {
    id,
    createdAt,
    customerName,
    customerEmail,
    deliveryAddress,
    productTitle,
    status: needsCheck ? 'needs-check' : 'hub-queued',
    paymentStatus: needsCheck ? 'requires-check' : 'test-paid',
    total: priceBreakdown.total,
    inscription,
    proofApproved: !needsCheck,
    state,
    priceBreakdown,
    stripeSimulation: {
      provider: 'mock',
      mode: 'test',
      checkoutSessionId: `cs_test_mock_${stamp}`,
      paymentIntentId: `pi_test_mock_${stamp}`,
      receiptUrl: `/mock-receipts/${id}`,
    },
    proofPackage: {
      productionSvg: artifacts.productionSvg || state.generatedSvgContent || null,
      visualProofSvg: artifacts.visualProofSvg || artifacts.productionSvg || state.generatedSvgContent || null,
      visualProofPng: artifacts.visualProofPng || null,
      productionFilename: `${id}-production-proof.svg`,
      visualFilename: `${id}-visual-proof.svg`,
      lockedAt: createdAt,
    },
    emailEvents: [
      {
        id: `${id}-email-customer-confirmation`,
        type: 'order_confirmation',
        recipient: customerEmail,
        template: 'customer-order-confirmation',
        status: 'mock-queued',
      },
      {
        id: `${id}-email-customer-proof`,
        type: 'proof_received',
        recipient: customerEmail,
        template: 'customer-approved-proof-copy',
        status: 'mock-queued',
      },
      {
        id: `${id}-email-admin-handoff`,
        type: 'production_handoff',
        recipient: 'central-admin-hub',
        template: 'admin-production-proof-intake',
        status: 'mock-queued',
      },
    ],
    adminHub: {
      destination: 'central-admin-hub',
      queue: 'orders.production-proof-intake',
      status: 'queued',
      payloadVersion: '2026-06-24',
    },
  };
}
