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

export interface MockOrder {
  id: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  productTitle: string;
  status: 'proof-approved' | 'needs-check' | 'quote-requested' | 'in-production' | 'dispatched';
  total: number;
  inscription: string;
  proofApproved: boolean;
  state: PlaqueState;
  priceBreakdown: PriceBreakdown;
}

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
    image: '/site-images/home-carousel-brass-wall.webp',
    description: 'For non-standard dimensions, logos, artwork, batch orders or anything that needs a quick manual check.',
    bestFor: ['Up to 600 mm long', 'Logos and artwork', 'Batch orders', 'Special fixing requirements'],
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
        answer: 'Oversized plaques, special materials, complex artwork, bulk quantities and unusual mounting should be checked before payment.',
      },
    ],
  },
];

export const materialStories = [
  {
    title: 'Brushed brass',
    image: '/materials/brushed-brass-clean.png',
    copy: 'Warm, traditional and legible. The safest premium choice for memorial, dedication and presentation plaques.',
  },
  {
    title: 'Mid aged brass',
    image: '/materials/mid-aged-brass.png',
    copy: 'A warmer aged brass surface with fine wear, soft patina and enough contrast for traditional engraved plaques.',
  },
  {
    title: 'Brushed stainless steel',
    image: '/materials/brushed-stainless-satin.png',
    copy: 'Clean, restrained and highly suitable for outdoor bench plaques, public spaces and contemporary settings.',
  },
  {
    title: 'Mirror stainless',
    image: '/materials/mirror-stainless.png',
    copy: 'Crisp and reflective, best for modern professional plaques where a polished look matters.',
  },
  {
    title: 'Wood backing',
    image: '/materials/wood-dark-mahogany-veneer.webp',
    copy: 'Adds depth and presentation weight for wall plaques, with square or bevelled backing options.',
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
): MockOrder {
  const priceBreakdown = getPriceBreakdown(state, inscription);
  const stamp = Date.now().toString().slice(-6);
  return {
    id: `PSAI-${stamp}`,
    createdAt: new Date().toISOString(),
    customerName,
    customerEmail,
    productTitle,
    status: priceBreakdown.quoteRequired ? 'needs-check' : 'proof-approved',
    total: priceBreakdown.total,
    inscription,
    proofApproved: !priceBreakdown.quoteRequired,
    state,
    priceBreakdown,
  };
}
