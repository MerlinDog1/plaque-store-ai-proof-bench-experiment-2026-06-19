import {
  BorderStyle,
  DesignStyle,
  Fixing,
  Material,
  PlaqueState,
  Shape,
  TextColor,
} from '../types';
import { estimatePlaquePrice } from './pricing';
import {
  getCheckoutPriceBreakdown,
  getCheckoutQuoteReasons,
} from './checkoutPolicy.mjs';
import { BENCH_SAFE_MARGIN_PERCENT } from './safeMargin';

export const DEFAULT_PRODUCT_SLUG = 'bench-plaques';

export type SiteView =
  | 'home'
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
}

export interface PriceBreakdown {
  total: number;
  base: number;
  wood: number;
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
    image: '/site-images/plaque-hero-memorial-wall-desktop.jpg',
    description: 'Custom memorial plaques for graves, gardens, benches and remembrance walls, checked in a proof before production.',
    seoTitle: 'Memorial Plaques UK | Brass & Stainless Steel Remembrance Plaques',
    seoDescription: 'Create a custom memorial plaque for a grave, garden, bench or remembrance wall. Choose brass or stainless steel and approve a proof before ordering.',
    seoIntro: 'A memorial plaque needs to be clear, respectful and correct before anything is made. Add the name, dates and tribute wording, choose the material, then review the proof carefully before checkout.',
    seoSections: [
      {
        title: 'Memorial plaques made from your wording',
        copy: 'Use memorial plaques for family gardens, benches, walls, graveside settings, scattering areas and quiet remembrance corners. The proof helps you catch wording, spacing and line breaks before production.',
      },
      {
        title: 'Brass, stainless steel and wood-backed options',
        copy: 'Brass gives a warm traditional memorial look. Stainless steel feels cleaner and more modern. Aged brass works well in gardens and natural settings, while wood backing suits indoor or sheltered presentation plaques.',
      },
    ],
    relatedSearches: ['memorial plaques UK', 'brass memorial plaques', 'custom remembrance plaques', 'garden memorial plaques'],
    bestFor: ['Names, dates and tribute wording', 'Garden and wall memorials', 'Brass or stainless steel finishes', 'Optional wood backing'],
    proofPrompt: 'In loving memory of\nArthur James Williams\nA devoted husband, father and grandfather\n1938 - 2026',
    preset: {
      width: 210,
      height: 148,
      material: Material.BrushedBrass,
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
        question: 'Can I check a memorial plaque before ordering?',
        answer: 'Yes. Enter the wording and review a free online proof before approving the plaque for checkout.',
      },
      {
        question: 'Which material is best for a memorial plaque?',
        answer: 'Brass gives a traditional warm finish, while stainless steel is a clean outdoor option. Wood backing can be added for wall and presentation plaques.',
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
    seoIntro: 'Bench plaques are small, so the wording has to work hard. Start with a compact bench size, keep the inscription readable, and use the proof to check text, border and screw positions before ordering.',
    seoSections: [
      {
        title: 'Outdoor bench plaques for short dedications',
        copy: 'A bench plaque usually suits a name, dates and one short message. If the wording turns into a paragraph, move up a size rather than squeezing the text.',
      },
      {
        title: 'Brass or stainless steel bench plaques',
        copy: 'Brushed stainless steel gives a clean silver finish. Brass gives the traditional bench plaque look. Standard visible screw fixings are shown in the proof so the whole plaque can be checked before payment.',
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
        question: 'Is the small size enough for a memorial?',
        answer: 'Yes, for short wording. If the inscription has several lines, start with the medium plaque instead.',
      },
      {
        question: 'Can this be used outside?',
        answer: 'Yes. Choose stainless steel or brass with standard screw fixings for outdoor use.',
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
    preset: {
      width: 210,
      height: 148,
      material: Material.BrushedBrass,
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
        copy: 'Add your wording, choose the size and fixings, then check the proof before checkout. Standard pricing includes engraving, standard fixings and UK mainland delivery.',
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
    preset: {
      width: 297,
      height: 210,
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
    preset: {
      width: 400,
      height: 300,
      material: Material.BrushedSteel,
      shape: Shape.Rect,
      fixing: Fixing.Caps,
      border: true,
      borderStyle: BorderStyle.Double,
      wood: true,
      woodTone: 'light',
      woodEdge: 'bevel',
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
    seoTitle: 'Garden Plaques UK | Custom Memorial Garden Plaques',
    seoDescription: 'Garden plaques for memorial corners, trees, benches, planted areas, walls and family gardens. Choose brass or stainless steel and check a proof before ordering.',
    heroCopy: 'Garden plaques need to feel personal but stay readable outdoors. They are used for memorial corners, trees, benches, planted areas, walls and family gardens.',
    image: '/site-images/home-carousel-garden-brass.webp',
    relatedProductSlug: 'memorial-plaques',
    proofCta: 'Start a garden plaque proof',
    sections: [
      {
        title: 'Keep the wording simple',
        copy: 'Names, dates and a short dedication usually work best outside. The proof helps stop the inscription becoming too small or crowded.',
      },
      {
        title: 'Choose the finish by setting',
        copy: 'Stainless steel suits clean modern gardens. Brass and aged brass sit well with planting, stone, timber and more traditional spaces.',
      },
    ],
    faqs: [
      { question: 'Can garden plaques be used outside?', answer: 'Yes. Choose brass or stainless steel with suitable fixings. The proof shows the layout, material and fixings before payment.' },
      { question: 'What size is best for a garden plaque?', answer: 'A5 is a good starting point for names, dates and a short message. Bench plaque sizes work better for very short wording.' },
    ],
    relatedSearches: ['garden plaques UK', 'memorial garden plaques', 'tree dedication plaques', 'outdoor memorial plaques'],
  },
  {
    slug: 'opening-plaques',
    title: 'Opening plaques',
    shortTitle: 'Opening',
    eyebrow: 'Formal launch and unveiling plaques',
    description: 'Custom opening plaques for buildings, rooms, community spaces and formal unveilings, with an online proof before payment.',
    seoTitle: 'Opening Plaques UK | Custom Building Opening Plaques',
    seoDescription: 'Order custom opening plaques in the UK with a free online proof. Brass and stainless steel plaques for building openings, unveilings, presentations and formal ceremonies.',
    heroCopy: 'Opening plaques need clear formal hierarchy: the place, the person opening it, the date and the occasion. A4 is usually the strongest starting point.',
    image: '/site-images/home-gallery-brass-community.webp',
    relatedProductSlug: 'a4-plaques',
    proofCta: 'Start an opening plaque proof',
    sections: [
      {
        title: 'For buildings, rooms and ceremonies',
        copy: 'Suitable for schools, offices, community centres, gardens, libraries, halls and funded spaces.',
      },
      {
        title: 'Make the wording easy to follow',
        copy: 'The proof should make the main subject obvious first, then the opening person and date. Brass gives a ceremonial feel; stainless steel suits modern buildings.',
      },
    ],
    faqs: [
      { question: 'Can I include the person opening the building?', answer: 'Yes. Add the person, role, date and venue wording, then check the hierarchy in the proof before checkout.' },
      { question: 'Which size suits an opening plaque?', answer: 'A4 is usually best for formal opening wording. A5 can work for shorter inscriptions or smaller rooms.' },
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
    description: 'Custom engraved plaques in brass and stainless steel with live pricing, free online proofing and UK mainland delivery included.',
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
        copy: 'Standard prices include engraving, standard fixings and UK mainland delivery, with extras shown before checkout.',
      },
    ],
    faqs: [
      { question: 'Can I order one engraved plaque?', answer: 'Yes. InstaPlaque is set up for single custom plaque orders as well as bespoke requests.' },
      { question: 'Do engraved plaques include delivery?', answer: 'UK mainland delivery is included for standard plaques. Unusual sizes or non-mainland delivery may need confirmation before payment.' },
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

export function getProductBySlug(slug: string | null | undefined) {
  return productFamilies.find((product) => product.slug === slug)
    ?? productFamilies.find((product) => product.slug === DEFAULT_PRODUCT_SLUG)
    ?? productFamilies[0];
}

export function getLandingPageBySlug(slug: string | null | undefined) {
  return seoLandingPages.find((page) => page.slug === slug)
    ?? seoLandingPages[0];
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
