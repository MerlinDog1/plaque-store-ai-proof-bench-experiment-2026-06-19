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

export type SiteView = 'home' | 'product' | 'materials' | 'how' | 'faq' | 'quote' | 'checkout' | 'admin' | 'plaque' | 'vector';

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
    slug: 'memorial-bench-plaques',
    title: 'Memorial bench plaques',
    shortTitle: 'Bench plaques',
    eyebrow: 'Most ordered',
    startingFrom: 'from £79',
    materialCue: 'stainless',
    image: '/site-images/plaque-hero-equine.jpg',
    description: 'Weather-ready engraved plaques for benches, seats and outdoor dedications, with instant AI typography that keeps the wording calm, balanced and legible.',
    bestFor: ['Parks and public benches', 'Memorial gardens', 'Short tributes', 'Outdoor stainless or brass'],
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
      designStyle: DesignStyle.MemorialSolemn,
      textColor: TextColor.Black,
      cornerRadius: 0,
    },
    faqs: [
      {
        question: 'Can I approve the bench plaque online?',
        answer: 'Yes. Generate the proof, adjust the wording and layout, then approve the exact design before ordering.',
      },
      {
        question: 'Are scalloped borders available on bench plaques?',
        answer: 'No. Bench plaques use cleaner border options that suit the shallow format and leave room for readable text.',
      },
    ],
  },
  {
    slug: 'memorial-wall-plaques',
    title: 'Memorial wall plaques',
    shortTitle: 'Wall plaques',
    eyebrow: 'Classic tribute',
    startingFrom: 'from £129',
    materialCue: 'brass',
    image: '/site-images/plaque-hero-memorial.jpg',
    description: 'Formal wall-mounted plaques for homes, gardens, churches and commemorative spaces, designed instantly with a professional hierarchy.',
    bestFor: ['Longer inscriptions', 'Garden walls', 'Church and hall dedications', 'Wood-backed presentation'],
    proofPrompt: 'In loving memory of\nArthur James Williams\nA devoted husband, father and grandfather\n1938 - 2026',
    preset: {
      width: 297,
      height: 210,
      material: Material.BrushedBrass,
      shape: Shape.Rect,
      fixing: Fixing.Caps,
      border: true,
      borderStyle: BorderStyle.Double,
      wood: true,
      woodTone: 'dark',
      woodEdge: 'bevel',
      designStyle: DesignStyle.ClassicalFormal,
      textColor: TextColor.Black,
      cornerRadius: 0,
    },
    faqs: [
      {
        question: 'Can I use a longer inscription?',
        answer: 'Yes. The intelligent typography engine will balance line breaks, hierarchy and spacing before you approve the proof.',
      },
      {
        question: 'Can I add a wooden backing?',
        answer: 'Yes. Wood backing is priced live and shown in the proof before you order.',
      },
    ],
  },
  {
    slug: 'tree-and-stake-plaques',
    title: 'Tree and stake plaques',
    shortTitle: 'Tree plaques',
    eyebrow: 'Garden ready',
    startingFrom: 'from £99',
    materialCue: 'aged',
    image: '/site-images/plaque-hero-cat.png',
    description: 'Outdoor dedication plaques for trees, planting schemes and memorial gardens, with fast proofing and simple fixing choices.',
    bestFor: ['Tree dedications', 'Garden markers', 'Short commemorations', 'Outdoor brass or stainless'],
    proofPrompt: 'Planted in memory of\nGrace Thompson\nA life full of kindness',
    preset: {
      width: 210,
      height: 148,
      material: Material.AgedBrass,
      shape: Shape.Rect,
      fixing: Fixing.Screws,
      border: true,
      borderStyle: BorderStyle.Single,
      wood: false,
      designStyle: DesignStyle.HeritagePlaque,
      textColor: TextColor.Black,
      cornerRadius: 0,
    },
    faqs: [
      {
        question: 'Do tree plaques need a quote?',
        answer: 'Most standard tree plaques can be priced instantly. Bespoke stakes or unusual mounting can be sent as a quote request.',
      },
      {
        question: 'Can I keep the wording simple?',
        answer: 'Yes. The proof engine is especially useful for short inscriptions because it makes simple wording look deliberate.',
      },
    ],
  },
  {
    slug: 'business-plaques',
    title: 'Business and professional plaques',
    shortTitle: 'Business plaques',
    eyebrow: 'Professional finish',
    startingFrom: 'from £149',
    materialCue: 'brass',
    image: '/site-images/proofbench-materials.png',
    description: 'Reception, office, opening and accreditation plaques with instant formal layouts, live pricing and production-ready proof approval.',
    bestFor: ['Reception plaques', 'Opening plaques', 'Donor recognition', 'Official presentations'],
    proofPrompt: 'Opened by\nThe Rt Hon. Eleanor Hart MP\non 18 June 2026\nRiverside Community Centre',
    preset: {
      width: 300,
      height: 200,
      material: Material.PolishedBrass,
      shape: Shape.Rect,
      fixing: Fixing.Caps,
      border: true,
      borderStyle: BorderStyle.Single,
      wood: false,
      designStyle: DesignStyle.Institutional,
      textColor: TextColor.Black,
      cornerRadius: 0,
    },
    faqs: [
      {
        question: 'Can we add a logo?',
        answer: 'Logo upload can be handled as an artwork-check or quote path. Text-only business plaques can usually be approved instantly.',
      },
      {
        question: 'Can the proof be used internally before ordering?',
        answer: 'Yes. The instant proof is designed so teams can check wording and hierarchy before checkout.',
      },
    ],
  },
  {
    slug: 'bespoke-plaques',
    title: 'Bespoke engraved plaques',
    shortTitle: 'Bespoke plaques',
    eyebrow: 'Custom route',
    startingFrom: 'quoted when needed',
    materialCue: 'wood',
    image: '/site-images/plaque-hero-memorial.jpg',
    description: 'Start with a live proof, then route anything unusual through quote review: custom dimensions, complex artwork, batch orders or special mounting.',
    bestFor: ['Unusual sizes', 'Artwork and logos', 'Batch orders', 'Special fixing requirements'],
    proofPrompt: 'The Old Mill\nRestored 2026\nIn honour of everyone who brought this place back to life',
    preset: {
      width: 400,
      height: 300,
      material: Material.BrushedBrass,
      shape: Shape.Rect,
      fixing: Fixing.Caps,
      border: true,
      borderStyle: BorderStyle.Double,
      wood: true,
      woodTone: 'light',
      woodEdge: 'bevel',
      designStyle: DesignStyle.ArtisanCraft,
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
    image: '/materials/brushed-brass-satin.png',
    copy: 'Warm, traditional and legible. The safest premium choice for memorial, dedication and presentation plaques.',
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
