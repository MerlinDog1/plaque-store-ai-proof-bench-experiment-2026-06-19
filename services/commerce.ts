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

export type SiteView =
  | 'home'
  | 'product'
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
  | 'plaque'
  | 'vector';

export interface ProductFamily {
  slug: string;
  title: string;
  eyebrow: string;
  shortTitle: string;
  description: string;
  bestFor: string[];
  startingFrom: string;
  materialCue: 'brass' | 'stainless' | 'wood' | 'aged';
  image: string;
  proofPrompt: string;
  preset: Partial<PlaqueState>;
  faqs: Array<{ question: string; answer: string }>;
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
    mode: 'test';
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

export const getPlaqueSummaryTitle = (state: Partial<PlaqueState> = {}, fallback = 'Custom plaque') => {
  const material = state.material ? PLAQUE_SUMMARY_MATERIAL_LABELS[state.material] || String(state.material) : '';
  const width = Number(state.width || 0);
  const height = Number(state.height || 0);
  const size = width > 0 && height > 0 ? `${width} x ${height} mm` : '';
  return [material, size].filter(Boolean).join(' / ') || fallback;
};

export const productFamilies: ProductFamily[] = [
  {
    slug: 'bench-plaques',
    title: 'Bench plaques',
    shortTitle: 'Bench',
    eyebrow: '150 x 50 mm',
    startingFrom: 'from £69',
    materialCue: 'stainless',
    image: '/site-images/home-carousel-bench-steel.webp',
    description: 'The compact format for benches, seats and short outdoor dedications where the wording needs to stay crisp.',
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
    slug: 'a5-plaques',
    title: 'A5 plaques',
    shortTitle: 'A5',
    eyebrow: '210 x 148 mm',
    startingFrom: 'from £129',
    materialCue: 'stainless',
    image: '/site-images/home-carousel-garden-brass.webp',
    description: 'A useful all-round size for wall plaques, garden dedications and memorial wording with room for balance.',
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
    startingFrom: 'from £149',
    materialCue: 'stainless',
    image: '/site-images/home-carousel-reading-room.webp',
    description: 'A larger format for longer inscriptions, presentation pieces and places where the wording needs more presence.',
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
    materialCue: 'stainless',
    image: '/site-images/home-custom-oval-steel.webp',
    description: 'For non-standard dimensions, oval plaques, circular plaques or anything that needs a quick manual check.',
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
  return productFamilies.find((product) => product.slug === slug) ?? productFamilies[0];
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
