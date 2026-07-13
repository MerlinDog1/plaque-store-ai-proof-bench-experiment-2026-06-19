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
  examples?: Array<{ title: string; copy: string; image: string; alt: string }>;
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
  paymentStatus: 'unpaid' | 'test-paid' | 'requires-check';
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
    description: 'Memorial plaques in brass or stainless steel. Add the wording, check the proof, then order online.',
    seoTitle: 'Memorial Plaques UK | Brass & Stainless Steel Remembrance Plaques',
    seoDescription: 'Create a custom memorial plaque for a grave, garden, bench or remembrance wall. Choose brass or stainless steel and approve a proof before ordering.',
    seoIntro: 'Add the name, dates and message. Choose brass or stainless steel. Check the proof before you pay.',
    seoSections: [
      {
        title: 'What you can order',
        copy: 'Garden plaques, bench plaques, wall plaques and grave markers. Start with A5 for most memorials, or choose a bench plaque for short wording.',
      },
      {
        title: 'Material choice',
        copy: 'Brass gives the classic gold look. Stainless steel is silver and modern. Add wood backing if the plaque is going on a wall.',
      },
    ],
    examples: [
      { title: 'Brass memorial on timber', copy: 'A traditional warm finish for a bench or garden setting.', image: '/seo/realistic/memorial-plaques/aged-brass-bench-memorial-plaque.webp', alt: 'Aged brass memorial plaque fixed to a wooden garden bench' },
      { title: 'Brass wall memorial', copy: 'Wood backing gives a larger memorial plaque more presence on a wall.', image: '/seo/realistic/memorial-plaques/brass-wood-backed-wall-plaque.webp', alt: 'Engraved brass memorial wall plaque mounted on dark wood' },
      { title: 'Stainless wall memorial', copy: 'A clean silver finish for modern indoor or outdoor memorials.', image: '/seo/realistic/memorial-plaques/stainless-steel-wood-backed-memorial-plaque.webp', alt: 'Brushed stainless steel memorial plaque with wooden backing' },
      { title: 'Short bench dedication', copy: 'A name, dates and one short line fit the compact bench format best.', image: '/seo/realistic/memorial-plaques/stainless-steel-bench-plaque-wood-rail.webp', alt: 'Stainless steel memorial plaque fixed to a wooden bench rail' },
    ],
    relatedSearches: ['memorial plaques UK', 'brass memorial plaques', 'custom remembrance plaques', 'garden memorial plaques'],
    bestFor: ['A5 from £95.50', 'Brass or stainless steel', 'Free proof before payment', 'UK mainland delivery included'],
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
        answer: 'Choose brass for a classic gold plaque. Choose stainless steel for a silver modern plaque. Add wood backing for wall plaques.',
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
    description: 'Small engraved plaques for benches and seats. Best for names, dates and one short line.',
    seoTitle: 'Bench Plaques UK | Custom Brass & Stainless Steel Bench Plaques',
    seoDescription: 'Order custom bench plaques in brass or stainless steel. Build a proof online, check the inscription and see live pricing before payment.',
    seoIntro: 'Bench plaques start at 150 x 50 mm. They work best with a name, dates and one short message.',
    seoSections: [
      {
        title: 'Best for short wording',
        copy: 'Use a bench plaque for a name, dates and one short dedication. Three to five short lines usually read well; poems and longer family messages need A5 or larger.',
      },
      {
        title: 'Fixings shown in the proof',
        copy: 'Bench plaques usually use visible screws. The proof shows the screw positions, border and text before you pay.',
      },
      {
        title: 'Before you order',
        copy: 'If the bench belongs to a council, cemetery, school or club, check their permitted plaque size and fixing rules before approving production.',
      },
      {
        title: 'Material choice',
        copy: 'Stainless steel gives a clean silver look for exposed benches. Brass is warmer and traditional, while aged brass is darker and less reflective.',
      },
    ],
    examples: [
      { title: 'Classic brass bench plaque', copy: 'Warm brass with four visible screws on outdoor timber.', image: '/site-images/home-gallery-brass-bench.webp', alt: 'Engraved brass memorial plaque fitted to a wooden park bench' },
      { title: 'Aged brass on timber', copy: 'A darker, less reflective finish that sits naturally against wood.', image: '/seo/realistic/memorial-plaques/aged-brass-bench-memorial-plaque.webp', alt: 'Aged brass memorial bench plaque on weathered timber' },
      { title: 'Brushed stainless bench plaque', copy: 'A restrained silver finish with strong black-filled lettering.', image: '/seo/realistic/memorial-plaques/stainless-steel-bench-plaque-wood-rail.webp', alt: 'Brushed stainless steel memorial bench plaque on a wooden rail' },
      { title: 'Shared family dedication', copy: 'Two names and one concise family line remain readable at bench size.', image: '/seo/realistic/memorial-plaques/parents-brass-bench-memorial-plaque.webp', alt: 'Brass memorial bench plaque dedicated to beloved parents' },
    ],
    relatedSearches: ['bench plaques UK', 'memorial bench plaques', 'engraved bench plaques', 'brass bench plaques'],
    bestFor: ['150 x 50 mm from £58.50', 'Brass or stainless steel', 'Visible screw fixing', 'Free proof before payment'],
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
        question: 'How many words fit on a 150 x 50 mm bench plaque?',
        answer: 'Around a name, dates and one short line is the safest fit. If the wording starts to feel cramped in the proof, move up to A5 rather than reducing the text too far.',
      },
      {
        question: 'Can this be used outside?',
        answer: 'Yes. Choose stainless steel or brass with standard screw fixings for outdoor use.',
      },
      {
        question: 'Should I check with the bench owner first?',
        answer: 'Yes, if the bench is in a public space, school, cemetery, club or managed garden. They may specify the plaque size, material and fixing method.',
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
    seoIntro: 'Choose brass if you want the classic gold plaque look. Pick a size, add the wording and check the proof before ordering.',
    seoSections: [
      {
        title: 'Choose the brass finish',
        copy: 'Brushed brass is the safest all-round choice: warm, satin and readable. Polished brass is brighter and more reflective. Aged brass is darker, softer and useful when you want a less shiny memorial finish.',
      },
      {
        title: 'Best uses',
        copy: 'Brass works well for memorial plaques, bench plaques, opening plaques, donor plaques and presentation plaques where a traditional gold finish feels right.',
      },
      {
        title: 'Outdoor ageing',
        copy: 'Brass is suitable outdoors, but the surface will naturally change with exposure. Aged brass starts closer to that softer weathered look and is sealed with matt lacquer.',
      },
      {
        title: 'Check the layout first',
        copy: 'The proof shows text, border, fixing holes and finish before checkout, so you can avoid cramped wording or fixings too close to the inscription.',
      },
    ],
    examples: [
      { title: 'Brass bench plaque', copy: 'Brushed brass is warm, legible and traditional outdoors.', image: '/site-images/home-gallery-brass-bench.webp', alt: 'Brushed brass engraved plaque fixed to an outdoor wooden bench' },
      { title: 'Formal community plaque', copy: 'A larger brass plaque gives names and ceremonial wording room to breathe.', image: '/site-images/home-gallery-brass-community.webp', alt: 'Large engraved brass community centre commemorative plaque' },
      { title: 'Aged brass memorial', copy: 'A hand-aged finish offers a softer, darker appearance.', image: '/site-images/home-gallery-aged-brass-wood.webp', alt: 'Aged brass memorial plaque mounted on dark wood' },
      { title: 'Brass wall plaque', copy: 'Wood backing frames the metal and separates it from brick or stone.', image: '/seo/realistic/memorial-plaques/brass-wood-backed-wall-plaque.webp', alt: 'Engraved brass wall plaque mounted on a wooden backing board' },
    ],
    relatedSearches: ['brass plaques UK', 'engraved brass plaques', 'custom brass plaques', 'brass memorial plaques'],
    bestFor: ['A5 from £105.50', 'Bench plaques from £58.50', 'Brushed, polished or aged brass', 'Free proof before payment'],
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
      {
        question: 'Which brass finish should I choose?',
        answer: 'Choose brushed brass for a classic satin plaque, polished brass for a brighter formal look, and aged brass for a darker memorial or garden finish.',
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
    seoIntro: 'Choose stainless steel if you want a silver plaque with a clean modern finish. Add wording, check the proof and order online.',
    seoSections: [
      {
        title: 'Brushed or polished',
        copy: 'Brushed stainless steel is satin, restrained and usually easier to read. Polished stainless steel is brighter and more reflective, so it suits indoor presentation use better than harsh outdoor light.',
      },
      {
        title: 'Best uses',
        copy: 'Stainless steel suits modern memorial plaques, contemporary wall plaques, public spaces, schools, offices and outdoor settings where a clean silver finish is preferred.',
      },
      {
        title: 'Outdoor durability',
        copy: 'Stainless steel is a strong choice for exposed positions. Keep the wording simple and use black-filled engraving for legibility from a distance.',
      },
      {
        title: 'Price before payment',
        copy: 'Choose size, material and fixings. Standard pricing includes engraving, standard fixings and UK mainland delivery, with extras shown before checkout.',
      },
    ],
    examples: [
      { title: 'Oval stainless plaque', copy: 'A custom oval creates a softer memorial or house-plaque shape.', image: '/site-images/home-gallery-oval-steel.webp', alt: 'Oval brushed stainless steel engraved memorial plaque' },
      { title: 'Stainless wall plaque', copy: 'Brushed steel and black lettering stay crisp in a modern setting.', image: '/site-images/home-carousel-steel-wall.webp', alt: 'Brushed stainless steel engraved plaque mounted on an exterior wall' },
      { title: 'Stainless bench plaque', copy: 'A compact silver plaque suited to exposed outdoor timber.', image: '/seo/realistic/memorial-plaques/stainless-steel-bench-plaque-wood-rail.webp', alt: 'Stainless steel memorial plaque fixed to an outdoor wooden bench' },
      { title: 'Steel with wood backing', copy: 'A timber surround adds warmth to a contemporary silver face.', image: '/seo/realistic/memorial-plaques/stainless-steel-wood-backed-memorial-plaque.webp', alt: 'Stainless steel memorial wall plaque mounted on wood' },
    ],
    relatedSearches: ['stainless steel plaques UK', 'outdoor metal plaques', 'engraved stainless steel plaques', 'custom steel plaques'],
    bestFor: ['A5 from £95.50', 'Brushed or polished stainless', 'Outdoor and wall plaques', 'UK mainland delivery included'],
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
      {
        question: 'Is brushed or polished stainless easier to read?',
        answer: 'Brushed stainless is usually easier to read because it is less reflective. Polished stainless can look more formal but catches more glare.',
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
    description: 'A5 metal plaques for memorial, garden, wall and presentation wording.',
    seoTitle: 'A5 Plaques UK | Custom A5 Memorial & Wall Plaques',
    seoDescription: 'Create a custom A5 plaque in brass or stainless steel. A practical size for memorials, gardens, wall plaques and presentation wording.',
    seoIntro: 'A5 is the easy starting point. It fits a name, dates and a short message without making the plaque too large.',
    seoSections: [
      {
        title: 'What fits on A5',
        copy: 'A5 works for a name, dates and a short message, or a small wall sign with a few lines. It is usually the safest first choice when a bench plaque feels too tight.',
      },
      {
        title: 'Common uses',
        copy: 'Use A5 for memorial plaques, garden plaques, tree plaques, pet memorial plaques, small opening plaques and wall plaques where the wording is concise.',
      },
      {
        title: 'Material and backing',
        copy: 'Choose brass for warmth, stainless steel for a silver modern finish, and wood backing where the plaque needs more presence on a wall.',
      },
      {
        title: 'Options before checkout',
        copy: 'Choose finish, caps or screws, border and wood backing where suitable. The proof updates before payment so you can check the layout before ordering.',
      },
    ],
    relatedSearches: ['A5 plaques UK', 'A5 memorial plaques', 'custom wall plaques', 'garden plaques UK'],
    bestFor: ['210 x 148 mm', 'From £95.50', 'Brass or stainless steel', 'Optional wood backing'],
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
      {
        question: 'How much wording fits on A5?',
        answer: 'A5 comfortably fits a name, dates and a short message. For a long quote, donor list or ceremony wording, choose A4.',
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
    seoIntro: 'Choose A4 when the wording is too long for A5. It gives more room for headings, names, dates and a longer message.',
    seoSections: [
      {
        title: 'When to choose A4',
        copy: 'Use A4 for opening plaques, donor plaques, longer memorial wording and wall plaques that need to be read from further away.',
      },
      {
        title: 'Material options',
        copy: 'Choose brass for a formal gold look. Choose stainless steel for a silver modern look. Add wood backing for indoor wall plaques.',
      },
      {
        title: 'Better for hierarchy',
        copy: 'A4 gives room for headings, names, roles, dates and supporting text without forcing everything into the same small type size.',
      },
      {
        title: 'What to avoid',
        copy: 'Do not squeeze donor lists, ceremony wording or long poems into A5 just to save space. If the proof looks busy, A4 will usually convert better and read better.',
      },
    ],
    relatedSearches: ['A4 plaques UK', 'large memorial plaques', 'presentation plaques', 'opening plaques'],
    bestFor: ['297 x 210 mm', 'From £145', 'Longer wording', 'Opening and donor plaques'],
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
      {
        question: 'Is A4 better for opening plaques?',
        answer: 'Usually, yes. A4 gives formal opening wording enough space for the venue, person, role and date to read clearly.',
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
    seoIntro: 'Use custom plaques when the standard sizes are not right. Build the proof first, then we can check anything unusual.',
    seoSections: [
      {
        title: 'Custom sizes and shapes',
        copy: 'Use this for non-standard sizes, oval plaques, circular plaques, larger plates and special mounting requests.',
      },
      {
        title: 'Proof first, quote if needed',
        copy: 'Create the layout first. Oversized plaques, unusual shapes and supplied artwork may need a manual price check.',
      },
    ],
    examples: [
      { title: 'Oval stainless plaque', copy: 'Custom shape, fixing positions and border shown before ordering.', image: '/site-images/home-custom-oval-steel.webp', alt: 'Custom oval stainless steel plaque with engraved lettering' },
      { title: 'Oval wall plaque', copy: 'An oval format works well where a standard rectangle feels too formal.', image: '/site-images/home-carousel-oval-wall.webp', alt: 'Custom oval engraved plaque installed on an exterior wall' },
      { title: 'Dark contemporary plaque', copy: 'Non-standard finishes and mounting requests can be checked from a proof.', image: '/site-images/home-carousel-black-wall.webp', alt: 'Dark custom engraved wall plaque with contrasting lettering' },
      { title: 'Large presentation plaque', copy: 'Longer wording and formal hierarchy need a larger made-to-measure plate.', image: '/site-images/home-carousel-reading-room.webp', alt: 'Large engraved presentation plaque with formal opening wording' },
    ],
    relatedSearches: ['custom plaques UK', 'bespoke plaques', 'oval plaques', 'made to measure plaques'],
    bestFor: ['Up to 600 mm long', 'Oval or circular plaques', 'Made-to-measure sizes', 'Quote check before order'],
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
    heroCopy: 'Order a brass or stainless steel plaque for a garden, tree, bench or wall. Add the wording and check the proof before payment.',
    image: '/site-images/home-carousel-garden-brass.webp',
    relatedProductSlug: 'memorial-plaques',
    proofCta: 'Start a garden plaque proof',
    sections: [
      {
        title: 'Recommended size',
        copy: 'A5 is the safest starting point for garden plaques because it gives room for a name, dates and a short message. Bench plaque sizes work for very short dedications.',
      },
      {
        title: 'Best material outside',
        copy: 'Brass gives a warmer traditional garden look. Stainless steel gives a cleaner silver finish. Aged brass suits planting, timber and memorial corners where a softer finish helps.',
      },
      {
        title: 'Fitting and location',
        copy: 'Think about where the plaque will sit: wall, post, bench, planter or stone. Keep it readable from the normal viewing distance and avoid placing tiny wording low to the ground.',
      },
      {
        title: 'Wording examples',
        copy: 'Common formats include "In loving memory of", a name and dates, or a short garden dedication such as "Planted with love by family and friends".',
      },
    ],
    buyingGuide: [
      { title: 'Avoid overcrowding', copy: 'Outdoor plaques need more breathing room than indoor plaques. Shorter wording stays clearer after weathering and from a distance.' },
      { title: 'Check the proof', copy: 'Use the proof to check line breaks, border, fixing positions and whether the chosen size makes the inscription easy to read.' },
      { title: 'Durability', copy: 'Metal plaques can be used outside, but all outdoor finishes will weather over time. Choose the finish for the look you want as it ages.' },
    ],
    examples: [
      { title: 'Brass garden dedication', copy: 'Warm brass against brick and planting for a traditional outdoor setting.', image: '/site-images/home-carousel-garden-brass.webp', alt: 'Engraved brass memorial plaque displayed in a planted garden' },
      { title: 'Aged brass on wood', copy: 'A darker finish that works naturally beside timber and foliage.', image: '/seo/realistic/memorial-plaques/aged-brass-bench-memorial-plaque.webp', alt: 'Aged brass garden memorial plaque mounted on outdoor timber' },
      { title: 'Brass plaque on a garden rail', copy: 'Short wording remains clear when the plaque is read from a path.', image: '/seo/realistic/memorial-plaques/brass-bench-plaque-garden-rail.webp', alt: 'Brass memorial plaque fitted to a wooden rail in a garden' },
      { title: 'Stainless outdoor memorial', copy: 'A clean silver option for contemporary gardens and walls.', image: '/site-images/home-carousel-steel-wall.webp', alt: 'Brushed stainless steel memorial plaque on an outdoor wall' },
    ],
    faqs: [
      { question: 'Will brass weather outside?', answer: 'Yes. Brass is suitable outside, but it naturally changes over time. Choose aged brass if you prefer a darker, less shiny look from the start.' },
      { question: 'What size is best for a garden plaque?', answer: 'A5 is a good starting point for names, dates and a short message. Bench plaque sizes work better for very short wording.' },
      { question: 'Can a garden plaque go on a wall, planter or post?', answer: 'Yes. Choose fixings that suit the surface, and check the proof so screw or cap positions do not crowd the wording.' },
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
    heroCopy: 'Opening plaques for buildings, rooms, gardens and ceremonies. A4 is usually best for formal wording.',
    image: '/site-images/home-gallery-brass-community.webp',
    relatedProductSlug: 'custom-plaques',
    proofCta: 'Start an opening plaque proof',
    sections: [
      {
        title: 'Recommended size',
        copy: 'A4 is usually best for opening plaques because formal wording needs hierarchy: venue, opened by, role and date. A5 can work for shorter room plaques.',
      },
      {
        title: 'Traditional wording order',
        copy: 'Most opening plaques start with the building, room or project name, then "Opened by", the person and role, followed by the date.',
      },
      {
        title: 'Material choice',
        copy: 'Brass feels traditional and ceremonial. Stainless steel suits modern buildings, schools and public spaces where a cleaner silver finish fits better.',
      },
      {
        title: 'Layout check',
        copy: 'Use the proof to check that names and roles have enough space. Long job titles usually need A4 or a custom size.',
      },
    ],
    buyingGuide: [
      { title: 'Wording example', copy: 'Opened by Jane Smith, Chair of Trustees, on 18 June 2026. Add the project or room name above it.' },
      { title: 'What to avoid', copy: 'Avoid squeezing several organisations, donor lists and long titles into A5. Use A4 or donor plaque layouts for multiple names.' },
      { title: 'Before production', copy: 'Confirm names, titles and dates with the organiser before approving the proof, as formal plaques are difficult to correct later.' },
    ],
    examples: [
      { title: 'Community opening plaque', copy: 'A large brass layout with a clear organisation name, opening wording and date.', image: '/site-images/home-gallery-brass-community.webp', alt: 'Large engraved brass community centre opening plaque' },
      { title: 'Reading room dedication', copy: 'Formal wording arranged with enough space for a room name and ceremony details.', image: '/site-images/home-carousel-reading-room.webp', alt: 'Large formal engraved plaque for a reading room opening' },
      { title: 'Contemporary steel wall plaque', copy: 'Brushed stainless steel suits modern schools, offices and community buildings.', image: '/site-images/home-carousel-steel-wall.webp', alt: 'Brushed stainless steel opening plaque installed on a modern wall' },
      { title: 'Traditional brass wall plaque', copy: 'A warm gold finish for ceremonial openings and heritage interiors.', image: '/site-images/home-carousel-brass-wall.webp', alt: 'Traditional engraved brass opening plaque mounted on a wall' },
    ],
    faqs: [
      { question: 'Can I include the person opening the building?', answer: 'Yes. Add the person, role, date and venue wording, then check the hierarchy in the proof before checkout.' },
      { question: 'Which size suits an opening plaque?', answer: 'A4 is usually best for formal opening wording. A5 can work for shorter inscriptions or smaller rooms.' },
      { question: 'What wording order is traditional?', answer: 'Use the project or room name first, then "Opened by", the person and role, and finally the date.' },
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
    heroCopy: 'Commemorative plaques for people, places, projects and dates. Choose the size, add the wording and approve the proof.',
    image: '/site-images/home-carousel-reading-room.webp',
    relatedProductSlug: 'a4-plaques',
    proofCta: 'Start a commemorative proof',
    sections: [
      {
        title: 'Common uses',
        copy: 'Anniversaries, restorations, public spaces, founders, donors, openings and dedications.',
      },
      {
        title: 'Choose the right size',
        copy: 'A5 suits short wording. A4 is better for project details, multiple names or a longer message.',
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
    heroCopy: 'Start here if you just need an engraved plaque. Pick the size and material, add wording, check the price and proof.',
    image: '/site-images/home-realistic-proof-row.jpg',
    relatedProductSlug: 'custom-plaques',
    proofCta: 'Start an engraved plaque proof',
    sections: [
      {
        title: 'What we make',
        copy: 'Memorial plaques, bench plaques, garden plaques, wall plaques, awards, opening plaques and recognition plaques.',
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
    heroCopy: 'Pet memorial plaques for gardens, homes, stables and remembrance corners. Add the name, dates and message, then check the proof.',
    image: '/site-images/plaque-hero-cat.png',
    relatedProductSlug: 'memorial-plaques',
    proofCta: 'Start a pet memorial proof',
    sections: [
      {
        title: 'Where they go',
        copy: 'Gardens, stables, planters, walls, indoor displays and pet remembrance corners. Choose the size based on viewing distance and wording length.',
      },
      {
        title: 'Material choice',
        copy: 'Choose brass for a gold plaque, stainless steel for a silver plaque, or aged brass for a darker outdoor look.',
      },
      {
        title: 'Wording ideas',
        copy: 'Most pet memorial plaques use the pet name, dates and a short line such as "Forever loved" or "Our faithful friend".',
      },
      {
        title: 'Symbols and layout',
        copy: 'Simple symbols such as hearts or paw prints work best when they do not compete with the name. Check the proof for spacing before payment.',
      },
    ],
    buyingGuide: [
      { title: 'Size choice', copy: 'Use A5 when you want a name, dates and a message. Use a bench plaque format only for very short wording.' },
      { title: 'Outdoor use', copy: 'Brass, aged brass and stainless steel are suitable outside with appropriate fixings, but finishes will naturally weather.' },
      { title: 'Keep it legible', copy: 'A short message often feels more considered than a crowded inscription, especially outdoors.' },
    ],
    faqs: [
      { question: 'Can I make a memorial plaque for a dog or cat?', answer: 'Yes. Add the pet name, dates and message, then approve the proof before checkout.' },
      { question: 'Can a pet memorial plaque go outside?', answer: 'Yes. Brass and stainless steel are suitable for outdoor use with appropriate fixings.' },
      { question: 'Can I add paw prints or symbols?', answer: 'Simple symbols can work well if they leave enough space for the name and message. Check the proof before approving.' },
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
    heroCopy: 'Tree plaques for memorial trees, donated trees and planting projects. Keep the wording short and easy to read.',
    image: '/site-images/home-carousel-garden-brass.webp',
    relatedProductSlug: 'memorial-plaques',
    proofCta: 'Start a tree plaque proof',
    sections: [
      {
        title: 'Recommended wording',
        copy: 'A name, date and one short line usually reads better than a long message outdoors. Tree plaques are often viewed at a distance or from above, so clarity matters.',
      },
      {
        title: 'Choose the material',
        copy: 'Brass works well with timber, planting and warmer garden settings. Stainless steel gives a cleaner silver finish for contemporary spaces.',
      },
      {
        title: 'Mounting and position',
        copy: 'Think about whether the plaque will sit on a post, wall, bench, stone or near planting. Avoid tiny wording where soil, leaves or shadows may cover it.',
      },
      {
        title: 'Size choice',
        copy: 'Use A5 for a clear tree dedication with a name and short message. Use a bench plaque format only when the wording is very short.',
      },
    ],
    buyingGuide: [
      { title: 'Outdoor readability', copy: 'Choose fewer words, strong contrast and enough space around the text.' },
      { title: 'Durability', copy: 'Brass and stainless steel can be used outdoors, but all outdoor finishes will weather naturally.' },
      { title: 'Proof check', copy: 'Check line breaks and fixing positions before payment so the dedication is not crowded.' },
    ],
    faqs: [
      { question: 'What should a tree plaque say?', answer: 'Most tree plaques include a name, date and short dedication. The proof helps check that the wording is not too crowded.' },
      { question: 'Which material is best for a tree plaque?', answer: 'Brass and stainless steel are both suitable. Stainless is cleaner and more contemporary; brass is warmer and more traditional.' },
      { question: 'Can a tree plaque be fixed to a post or wall?', answer: 'Yes. Choose fixings that suit the position, and check the proof so the screw or cap positions do not crowd the text.' },
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
    heroCopy: 'Donor plaques for funded projects, restorations, rooms and gardens. Add the names and check the proof before ordering.',
    image: '/site-images/home-gallery-brass-community.webp',
    relatedProductSlug: 'a4-plaques',
    proofCta: 'Start a donor plaque proof',
    sections: [
      {
        title: 'Common uses',
        copy: 'Community spaces, restorations, gardens, rooms, benches, schools and sponsored improvements. Donor plaques need enough room for names to stay readable.',
      },
      {
        title: 'Use the right size for names',
        copy: 'A5 works for a single donor or short message. A4 or custom sizing is better for multiple names or formal project wording.',
      },
      {
        title: 'Wording structure',
        copy: 'Start with the project or space, then a clear recognition line such as "Made possible by", followed by donor names and the date.',
      },
      {
        title: 'What to avoid',
        copy: 'Avoid squeezing too many donor names into a small plaque. If names become tiny in the proof, choose A4 or request a custom size.',
      },
    ],
    buyingGuide: [
      { title: 'Multiple names', copy: 'A4 or custom sizes are best for donor lists, sponsors or committee names.' },
      { title: 'Material tone', copy: 'Brass feels ceremonial and traditional. Stainless steel suits modern buildings and public spaces.' },
      { title: 'Approval', copy: 'Confirm spellings and organisation names with stakeholders before approving the proof.' },
    ],
    faqs: [
      { question: 'Can a donor plaque include multiple names?', answer: 'Yes. For longer donor lists, start with A4 or a custom plaque so the text remains readable.' },
      { question: 'Can I proof a fundraising plaque before paying?', answer: 'Yes. Create the proof online and check the layout before approving checkout.' },
      { question: 'What should a donor plaque say?', answer: 'Most include the project or room name, a recognition line, donor names and a date. The proof helps check hierarchy and spacing.' },
    ],
    relatedSearches: ['donor plaques UK', 'recognition plaques', 'fundraising plaques', 'sponsor plaques'],
  },
  {
    slug: 'memorial-bench-plaques',
    title: 'Memorial bench plaques',
    shortTitle: 'Memorial bench',
    eyebrow: '150 x 50 mm from £58.50',
    description: 'Bench memorial plaques for short names, dates and dedications. Choose the finish, check the proof and order online.',
    seoTitle: 'Memorial Bench Plaques UK | Custom Bench Dedication Plaques',
    seoDescription: 'Order memorial bench plaques from £58.50. Brass, aged brass or stainless steel, free online proof, standard fixings and UK mainland delivery included.',
    heroCopy: 'Bench memorial plaques from £58.50. Best for a name, dates and one short line. Brass, aged brass or stainless steel.',
    image: '/seo/realistic/memorial-bench-plaques/hero-16x9.jpg',
    mobileImage: '/seo/realistic/memorial-bench-plaques/hero-9x16.jpg',
    relatedProductSlug: 'bench-plaques',
    proofCta: 'Start a memorial bench proof',
    sections: [
      {
        title: 'What fits',
        copy: 'A name, dates and one short line. If you want a poem or several sentences, move up to A5.',
      },
      {
        title: 'Finish',
        copy: 'Brass is the classic gold bench plaque. Aged brass is darker. Stainless steel is silver and cleaner.',
      },
      {
        title: 'Before ordering',
        copy: 'If a council, cemetery, school or club owns the bench, check their required size and fixing rules first.',
      },
    ],
    buyingGuide: [
      {
        title: 'Wording',
        copy: 'Typical format: name, years, and one line such as "Forever in our hearts".',
      },
      {
        title: 'Included',
        copy: 'Engraving, standard screw fixings and UK mainland delivery are included on standard bench plaques.',
      },
      {
        title: 'Proof',
        copy: 'The proof shows line breaks, border and screw positions before checkout.',
      },
    ],
    examples: [
      {
        title: 'Aged brass bench plaque',
        copy: 'Darker brass on timber. Less shiny than polished brass.',
        image: '/seo/realistic/memorial-plaques/aged-brass-bench-memorial-plaque.webp',
        alt: 'Aged brass memorial bench plaque on a wooden garden bench',
      },
      {
        title: 'Parents memorial bench plaque',
        copy: 'Two names, dates and a short family line.',
        image: '/seo/realistic/memorial-plaques/parents-brass-bench-memorial-plaque.webp',
        alt: 'Brass memorial bench plaque for beloved parents on a wooden bench',
      },
      {
        title: 'Polished brass bench plaque',
        copy: 'Bright gold finish for short wording.',
        image: '/seo/realistic/memorial-plaques/polished-brass-bench-memorial-plaque.webp',
        alt: 'Polished brass memorial bench plaque fixed to a wooden bench',
      },
      {
        title: 'Park bench memorial plaque',
        copy: 'Simple brass plaque on a park-style bench.',
        image: '/seo/realistic/memorial-plaques/brass-park-bench-memorial-plaque.webp',
        alt: 'Brass memorial plaque on a weathered park bench',
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
    slug: 'brass-memorial-plaques',
    title: 'Brass memorial plaques',
    shortTitle: 'Brass memorial',
    eyebrow: 'Gold finish memorial plaques',
    description: 'Brass memorial plaques for benches, gardens and walls. Choose the size, add wording, approve the proof.',
    seoTitle: 'Brass Memorial Plaques UK | Custom Engraved Remembrance Plaques',
    seoDescription: 'Order brass memorial plaques for benches, gardens and walls. Bench plaques from £58.50, A5 brass memorial plaques from £105.50, free proof before payment.',
    heroCopy: 'Brass memorial plaques with the classic gold look. Bench plaques from £58.50 and A5 brass plaques from £105.50.',
    image: '/seo/realistic/memorial-plaques/brass-bench-plaque-garden-rail.webp',
    relatedProductSlug: 'memorial-plaques',
    proofCta: 'Start a brass memorial proof',
    sections: [
      {
        title: 'Best use',
        copy: 'Choose brass for the traditional gold memorial look on timber benches, garden walls and wood-backed plaques.',
      },
      {
        title: 'Wording',
        copy: 'Add the name, dates and message. Check line breaks, text size, border and fixings in the proof.',
      },
      {
        title: 'Size',
        copy: 'Use 150 x 50 mm for bench wording. Use A5 or A4 when the message needs more space.',
      },
    ],
    buyingGuide: [
      {
        title: 'Prices',
        copy: 'Bench plaques from £58.50. A5 brass memorial plaques from £105.50. A4 brass plaques from £155.',
      },
      {
        title: 'Wording length',
        copy: 'Bench plaques suit one phrase. A5 suits a short tribute. A4 suits longer family wording or a quote.',
      },
      {
        title: 'Fixings',
        copy: 'The proof shows screws or caps so you can see whether the text is cramped before paying.',
      },
    ],
    examples: [
      {
        title: 'Brass bench memorial',
        copy: 'Brass on timber for short memorial wording and garden bench plaques.',
        image: '/seo/realistic/memorial-plaques/brass-bench-plaque-garden-rail.webp',
        alt: 'Brass memorial plaque on a wooden garden bench',
      },
      {
        title: 'Brass couple bench plaque',
        copy: 'A shared plaque with two names and a short inscription.',
        image: '/seo/realistic/memorial-plaques/parents-brass-bench-memorial-plaque.webp',
        alt: 'Brass parents memorial bench plaque on outdoor timber seating',
      },
      {
        title: 'Brass wood-backed wall plaque',
        copy: 'A larger brass plaque when the wording needs more space.',
        image: '/seo/realistic/memorial-plaques/brass-wood-backed-wall-plaque.webp',
        alt: 'Large brass memorial wall plaque with wood backing',
      },
      {
        title: 'Bronze tone memorial plaque',
        copy: 'A darker metal look for wall-mounted memorial wording.',
        image: '/seo/realistic/memorial-plaques/bronze-wall-memorial-plaque.webp',
        alt: 'Bronze tone wall memorial plaque with engraved lettering',
      },
    ],
    faqs: [
      { question: 'Are brass memorial plaques suitable outside?', answer: 'Yes. Brass can be used outdoors and is a common choice for benches, gardens and walls.' },
      { question: 'Can I check a brass memorial plaque before ordering?', answer: 'Yes. Create the wording online and approve the proof before checkout.' },
      { question: 'What wording fits on a brass memorial plaque?', answer: 'Most memorial plaques include a name, dates and one or two tribute lines. Longer messages usually need A5, A4 or a custom size.' },
    ],
    relatedSearches: ['brass memorial plaques UK', 'engraved brass memorial plaques', 'brass remembrance plaques', 'brass bench memorial plaques'],
  },
  {
    slug: 'wall-memorial-plaques',
    title: 'Wall memorial plaques',
    shortTitle: 'Wall memorial',
    eyebrow: 'A5, A4 and wood-backed plaques',
    description: 'Wall memorial plaques in brass or stainless steel for homes, gardens, halls and clubs.',
    seoTitle: 'Wall Memorial Plaques UK | Custom Brass & Stainless Remembrance Plaques',
    seoDescription: 'Order wall memorial plaques in brass or stainless steel. A5, A4 and wood-backed options with free online proof before payment.',
    heroCopy: 'Wall memorial plaques give you more room than a bench plaque. Start with A5 or A4, then add brass, stainless steel or wood backing.',
    image: '/seo/realistic/memorial-plaques/stainless-steel-wood-backed-memorial-plaque.webp',
    relatedProductSlug: 'memorial-plaques',
    proofCta: 'Start a wall memorial proof',
    sections: [
      {
        title: 'What fits',
        copy: 'A5 fits a name, dates and short tribute. A4 gives room for a quote or longer family message.',
      },
      {
        title: 'Materials',
        copy: 'Brass is gold. Stainless steel is silver. Wood backing makes the plaque stand out on brick, stone or indoor walls.',
      },
      {
        title: 'Common places',
        copy: 'Garden walls, homes, halls, churches, clubs, schools and shared community spaces.',
      },
    ],
    buyingGuide: [
      {
        title: 'Start with A5 or A4',
        copy: 'A5 suits a name, dates and short message. A4 is better for longer wording or quotes.',
      },
      {
        title: 'Make it readable',
        copy: 'Black-filled engraving is usually easiest to read. Check the proof to make sure the main name stands out.',
      },
      {
        title: 'Match fixings to the setting',
        copy: 'Caps look more finished. Screws are simpler for outdoor walls.',
      },
    ],
    examples: [
      {
        title: 'Stainless wall memorial',
        copy: 'Silver plaque with wood backing for longer family wording.',
        image: '/seo/realistic/memorial-plaques/stainless-steel-wood-backed-memorial-plaque.webp',
        alt: 'Stainless steel wall memorial plaque mounted on a wood backing board',
      },
      {
        title: 'Brass wall memorial',
        copy: 'Gold brass plaque for larger memorial wording.',
        image: '/seo/realistic/memorial-plaques/brass-wood-backed-wall-plaque.webp',
        alt: 'Brass wall memorial plaque with wood backing and corner caps',
      },
      {
        title: 'Bronze tone wall plaque',
        copy: 'Darker wall plaque for indoor or sheltered use.',
        image: '/seo/realistic/memorial-plaques/bronze-wall-memorial-plaque.webp',
        alt: 'Bronze tone memorial wall plaque with white engraved lettering',
      },
      {
        title: 'Stainless memorial face',
        copy: 'Silver engraved plaque for homes, halls and garden walls.',
        image: '/seo/realistic/memorial-plaques/stainless-steel-bench-plaque-wood-rail.webp',
        alt: 'Stainless steel memorial plaque with black engraved lettering',
      },
    ],
    faqs: [
      { question: 'Can wall memorial plaques be used outside?', answer: 'Yes. Brass and stainless steel are suitable for outdoor use with appropriate fixings.' },
      { question: 'Which size is best for a wall memorial plaque?', answer: 'A5 works for shorter wording, while A4 or custom sizing is better for longer tribute messages.' },
      { question: 'Can I add a quote or family message?', answer: 'Yes. Add the wording in the designer and check the proof to make sure the quote remains readable.' },
    ],
    relatedSearches: ['wall memorial plaques UK', 'memorial wall plaques', 'brass wall memorial plaques', 'stainless steel memorial wall plaques'],
  },
  {
    slug: 'ashes-scattering-plaques',
    title: 'Ashes scattering plaques',
    shortTitle: 'Ashes',
    eyebrow: 'Quiet remembrance plaques',
    description: 'Custom ashes scattering plaques for gardens, remembrance areas, trees, benches and family memorial spaces.',
    seoTitle: 'Ashes Scattering Plaques UK | Custom Remembrance Plaques',
    seoDescription: 'Ashes scattering plaques for gardens, trees, benches and remembrance areas, with simple respectful wording checked in a proof before ordering.',
    heroCopy: 'Ashes scattering plaques for gardens, trees and benches. Add a name, dates and short message, then check the proof.',
    image: '/site-images/plaque-hero-memorial-wall-desktop.jpg',
    relatedProductSlug: 'memorial-plaques',
    proofCta: 'Start an ashes plaque proof',
    sections: [
      {
        title: 'Where they go',
        copy: 'Scattering gardens, planted areas, family gardens, tree dedications, benches and small wall plaques. Choose the size for the place and viewing distance.',
      },
      {
        title: 'Keep it clear',
        copy: 'A name, dates and short dedication usually works best. A5 is a good starting size unless the wording is very short.',
      },
      {
        title: 'Material choice',
        copy: 'Brass gives a warm traditional feel in gardens. Stainless steel is cleaner and more contemporary. Aged brass is softer and less reflective.',
      },
      {
        title: 'Respectful wording',
        copy: 'Simple wording usually feels best: name, dates and one quiet line such as "Always remembered" or "Resting here in peace".',
      },
    ],
    buyingGuide: [
      { title: 'Recommended size', copy: 'A5 is the easiest starting size for ashes scattering plaques. Bench plaque sizes suit only very short wording.' },
      { title: 'Outdoor setting', copy: 'Keep enough contrast and avoid very small text if the plaque will sit near plants, trees or stone.' },
      { title: 'Proof carefully', copy: 'Check names, dates and punctuation before approval, especially on memorial wording.' },
    ],
    faqs: [
      { question: 'Can I make a plaque for an ashes scattering area?', answer: 'Yes. Add the name, dates and short message, then review the proof before checkout.' },
      { question: 'Which size should I choose?', answer: 'A5 is a good starting point for a name, dates and short tribute. Bench sizes are better for very short wording.' },
      { question: 'What wording is suitable for an ashes scattering plaque?', answer: 'Most use the person’s name, dates and one short remembrance line. The proof helps keep the wording calm and readable.' },
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
        copy: 'Suitable for halls, gardens, funded spaces, awards, restorations and formal unveilings. School plaques often need formal hierarchy and exact names.',
      },
      {
        title: 'A4 is usually right',
        copy: 'A4 gives the school name, ceremony details and date enough space. Brass is gold and formal. Stainless steel is silver and modern.',
      },
      {
        title: 'Wording order',
        copy: 'Use the school or building name first, then "Opened by", the person and role, and the date. Add donor or project wording only if there is enough space.',
      },
      {
        title: 'Before approval',
        copy: 'Confirm job titles, honorifics, school names and dates before approving production. Formal plaques are highly sensitive to small wording errors.',
      },
    ],
    buyingGuide: [
      { title: 'Best size', copy: 'A4 is the safest choice for most school opening plaques. A5 is only suitable for short room wording.' },
      { title: 'Material', copy: 'Brass feels traditional for ceremonial unveilings; stainless steel suits modern interiors and exterior school spaces.' },
      { title: 'Readability', copy: 'Keep the main school or building name prominent and avoid long paragraphs.' },
    ],
    faqs: [
      { question: 'Can I include a headteacher, mayor or MP name?', answer: 'Yes. Add the name, role and date, then check the formal layout in the proof.' },
      { question: 'Which material suits a school opening plaque?', answer: 'Brass is traditional for ceremonial plaques. Stainless steel is a good choice for modern school interiors and outdoor spaces.' },
      { question: 'What wording order should a school opening plaque use?', answer: 'Usually: school or building name, opened by, person and role, then date.' },
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
  const reasons: string[] = [];
  if (state.width > 420 || state.height > 300) {
    reasons.push('oversized plaque dimensions');
  }
  if (state.memorialImageEnabled) {
    reasons.push('image/artwork check required');
  }
  if (inscription.trim().length > 360) {
    reasons.push('long inscription needs readability review');
  }
  if (state.shape === Shape.Heart) {
    reasons.push('special shape production check');
  }
  return reasons;
}

export function getPriceBreakdown(state: PlaqueState, inscription: string): PriceBreakdown {
  const total = estimatePlaquePrice(state);
  const wood = state.wood ? estimatePlaquePrice({ ...state, wood: true }) - estimatePlaquePrice({ ...state, wood: false }) : 0;
  const quoteReasons = getQuoteReasons(state, inscription);
  return {
    total,
    wood,
    delivery: 0,
    base: total - wood,
    quoteRequired: quoteReasons.length > 0,
    quoteReasons,
  };
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
