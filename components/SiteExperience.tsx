import React, { useEffect, useRef, useState } from 'react';
import PlaquePreview from './PlaquePreview';
import { MockOrder, ProductFamily, SiteView, getPlaqueSummaryTitle, getPriceBreakdown, materialStories, productFamilies } from '../services/commerce';
import { PlaqueState } from '../types';
import { createCorelPdfBlob, downloadCorelPdf, svgToProofPngBase64 } from '../services/exportService';

const formatPrice = (value: number) => {
  const hasPence = Math.round(value * 100) % 100 !== 0;
  return value.toLocaleString('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: hasPence ? 2 : 0,
    maximumFractionDigits: hasPence ? 2 : 0,
  });
};

interface SiteProps {
  view: SiteView;
  selectedProduct: ProductFamily;
  state: PlaqueState;
  inscription: string;
  price: number;
  isProductionReady: boolean;
  orders: MockOrder[];
  onNavigate: (view: SiteView, productSlug?: string) => void;
  onStartDesign: () => void;
  onLaunchProduct: (product: ProductFamily) => void;
  onCreateMockOrder: (name: string, email: string, deliveryAddress?: unknown, proofSvg?: SVGSVGElement | null) => Promise<MockOrder>;
}

type EmbeddedCheckoutInstance = {
  mount: (selectorOrElement: string | HTMLElement) => void;
  destroy?: () => void;
};

type StripeBrowser = {
  initEmbeddedCheckout: (options: { clientSecret: string }) => Promise<EmbeddedCheckoutInstance>;
};

type PaidOrder = {
  id: string;
  customerEmail?: string;
  customerName?: string;
  status: string;
  paymentStatus: string;
  fulfilmentStatus?: string;
  totalPence: number;
  currency: string;
  productTitle: string;
  inscription: string;
  plaqueState: PlaqueState;
  priceBreakdown?: Record<string, unknown>;
  proofPackage?: {
    productionSvg?: string | null;
    visualProofSvg?: string | null;
    visualProofPng?: string | null;
    visualProofRendererVersion?: number;
    productionArtworkPdf?: string | null;
    productionFilename?: string;
    visualFilename?: string;
    lockedAt?: string;
  };
  shippingAddress?: Record<string, string>;
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  emailEvents?: Array<{ id?: string; type: string; recipient: string; status: string; subject?: string; at?: string }>;
  events?: Array<{ type: string; label: string; at: string; note?: string; recipient?: string; trackingReference?: string }>;
  metadata?: Record<string, unknown>;
  approvedAt?: string;
  paidAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

type AdminAuthConfig = {
  authRequired: boolean;
  label?: string;
};

declare global {
  interface Window {
    Stripe?: (publishableKey: string) => StripeBrowser | null;
  }
}

const USE_CUSTOMER_COPY_PASS = true;
const VISUAL_PROOF_RENDERER_VERSION = 2;

const DownloadIcon = () => (
  <svg className="button-icon" aria-hidden="true" viewBox="0 0 20 20" focusable="false">
    <path d="M10 2.5v9m0 0 3.4-3.4M10 11.5 6.6 8.1M4 16.5h12" />
  </svg>
);

let stripeJsPromise: Promise<void> | null = null;

const withClientTimeout = async <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(`${label} timed out. Please try again or use the secure checkout button.`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
};

const loadStripeJs = () => {
  if (typeof window === 'undefined') return Promise.reject(new Error('Stripe.js needs a browser.'));
  if (window.Stripe) return Promise.resolve();
  if (!stripeJsPromise) {
    stripeJsPromise = new Promise<void>((resolve, reject) => {
      let pollId: number | undefined;
      const timeoutId = window.setTimeout(() => {
        if (pollId) window.clearInterval(pollId);
        stripeJsPromise = null;
        reject(new Error('Stripe.js took too long to load.'));
      }, 10000);
      const finish = () => {
        if (pollId) window.clearInterval(pollId);
        window.clearTimeout(timeoutId);
        if (window.Stripe) {
          resolve();
        } else {
          reject(new Error('Stripe.js loaded but did not initialise.'));
        }
      };
      const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://js.stripe.com/v3/"]');
      if (existingScript) {
        if (window.Stripe) {
          finish();
          return;
        }
        pollId = window.setInterval(() => {
          if (!window.Stripe) return;
          finish();
        }, 100);
        existingScript.addEventListener('load', finish, { once: true });
        existingScript.addEventListener('error', () => {
          window.clearInterval(pollId);
          window.clearTimeout(timeoutId);
          stripeJsPromise = null;
          reject(new Error('Stripe.js failed to load.'));
        }, { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      script.onload = finish;
      script.onerror = () => {
        window.clearTimeout(timeoutId);
        stripeJsPromise = null;
        reject(new Error('Stripe.js failed to load.'));
      };
      document.head.appendChild(script);
    });
  }
  return stripeJsPromise;
};

const formatPence = (value: number, currency = 'gbp') => {
  return (Number(value || 0) / 100).toLocaleString('en-GB', {
    style: 'currency',
    currency: currency.toUpperCase(),
  });
};

const formatOrderSource = (order: PaidOrder) => {
  const source = order.metadata?.source || 'instaplaque';
  if (source.includes('instaplaque')) return 'InstaPlaque';
  return source
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const hasRenderablePlaqueState = (state?: Partial<PlaqueState> | null) =>
  Boolean(
    state
    && Number.isFinite(state.width)
    && Number.isFinite(state.height)
    && typeof state.material === 'string'
    && typeof state.shape === 'string'
    && typeof state.textColor === 'string'
    && typeof state.fixing === 'string',
  );

const storedProofSvgForOrder = (order?: PaidOrder | null) => {
  const raw = String(order?.proofPackage?.productionSvg || order?.proofPackage?.visualProofSvg || '').trim();
  return raw || null;
};

type AdminStatusFilter = 'active' | 'all' | 'paid' | 'in_production' | 'ready_to_dispatch' | 'dispatched' | 'issue' | 'archived';
type AdminSortMode = 'newest' | 'oldest' | 'due' | 'status' | 'value';

const statusLabel = (value?: string) => String(value || 'not_started').replace(/_/g, ' ');

const orderDate = (order: PaidOrder) => {
  const raw = order.paidAt || order.createdAt || order.updatedAt || '';
  const time = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
};

const sameLocalDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const sameLocalMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

const addWorkingDays = (date: Date, workingDays: number) => {
  const next = new Date(date);
  let remaining = Math.max(0, Math.round(workingDays));
  while (remaining > 0) {
    next.setDate(next.getDate() + 1);
    const day = next.getDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return next;
};

const turnaroundDaysForOrder = (order: PaidOrder) => {
  const metadataDays = Number(order.metadata?.turnaroundWorkingDays || order.metadata?.turnaroundDays || 0);
  if (Number.isFinite(metadataDays) && metadataDays > 0) return metadataDays;
  const eventText = `${order.metadata?.turnaroundLabel || ''} ${order.metadata?.turnaround || ''}`;
  const parsed = Number(eventText.match(/(\d+)\s*working/i)?.[1] || 0);
  if (parsed > 0) return parsed;
  return 5;
};

const dueDateForOrder = (order: PaidOrder) => {
  const start = new Date(order.paidAt || order.createdAt || order.updatedAt || Date.now());
  return addWorkingDays(start, turnaroundDaysForOrder(order));
};

const formatShortDate = (date: Date) => date.toLocaleDateString('en-GB', {
  day: '2-digit',
  month: 'short',
});

const addressLinesForOrder = (order: PaidOrder) => {
  const address = order.shippingAddress || {};
  return [
    address.name,
    address.line1,
    address.line2,
    address.city || address.town,
    address.state,
    address.postal_code || address.postcode,
    address.country,
    address.phone,
  ].filter(Boolean);
};

const stripeDashboardUrl = (kind: 'payments' | 'checkout/sessions', id?: string) =>
  id ? `https://dashboard.stripe.com/test/${kind}/${encodeURIComponent(id)}` : '';

const formatAdminDate = (value?: string) => value ? new Date(value).toLocaleString('en-GB', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
}) : 'Not set';

const downloadTextFile = (filename: string, content: string, mimeType = 'image/svg+xml') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const ensureSvgDocument = (content: string, state?: Partial<PlaqueState>) => {
  const trimmed = content.trim();
  if (/^(<\?xml[\s\S]*?)?<svg[\s>]/i.test(trimmed)) return trimmed;

  const width = Number(state?.width || 300);
  const height = Number(state?.height || 200);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${height}mm" viewBox="0 0 ${width} ${height}">`,
    trimmed,
    '</svg>',
    '',
  ].join('\n');
};

const downloadSvgFile = (filename: string, content: string, state?: Partial<PlaqueState>) => {
  downloadTextFile(filename, ensureSvgDocument(content, state), 'image/svg+xml');
};

const blobToDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(reader.error || new Error('Could not read generated file.'));
  reader.readAsDataURL(blob);
});

const storedProofSvgDataUrl = (order: PaidOrder) => {
  const svg = storedProofSvgForOrder(order);
  if (!svg) return '';
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(ensureSvgDocument(svg, order.plaqueState))}`;
};

const downloadStoredProductionArtwork = (order: PaidOrder) => {
  const svg = storedProofSvgForOrder(order);
  if (!svg) {
    throw new Error('No stored production artwork is available for this order.');
  }
  const filename = (order.proofPackage?.productionFilename || `${order.id}-production-artwork.svg`).replace(/\.[^.]+$/, '.svg');
  downloadSvgFile(filename, svg, order.plaqueState);
};

const downloadRenderedProofSvg = (filename: string, sourceSvg: SVGSVGElement) => {
  const clone = sourceSvg.cloneNode(true) as SVGSVGElement;
  const box = sourceSvg.viewBox.baseVal;
  const width = box.width || Number(sourceSvg.getAttribute('width')) || 300;
  const height = box.height || Number(sourceSvg.getAttribute('height')) || 200;
  clone.removeAttribute('class');
  clone.removeAttribute('style');
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', `${width}mm`);
  clone.setAttribute('height', `${height}mm`);
  clone.setAttribute('viewBox', `${box.x || 0} ${box.y || 0} ${width} ${height}`);
  clone.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  clone.querySelectorAll('.wood-backing rect').forEach((rect) => {
    rect.removeAttribute('rx');
    rect.removeAttribute('ry');
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
  downloadTextFile(filename, xml, 'image/svg+xml');
};

const downloadOrderProofPng = async (order: PaidOrder) => {
  if (!order.proofPackage?.visualProofPng) {
    throw new Error('Canonical approved proof image is not available.');
  }
  const response = await fetch(`/api/orders/${encodeURIComponent(order.id)}/proof-image.png`);
  if (!response.ok) throw new Error(`Could not download proof image (${response.status}).`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (order.proofPackage?.visualFilename || `${order.id}-approved-proof.svg`).replace(/\.[^.]+$/, '.png');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

type AdminDetailBoundaryProps = {
  resetKey: string;
  children: React.ReactNode;
};

type AdminDetailBoundaryState = {
  hasError: boolean;
};

class AdminDetailBoundary extends React.Component<AdminDetailBoundaryProps, AdminDetailBoundaryState> {
  state: AdminDetailBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Admin order detail render failed.', error);
  }

  componentDidUpdate(previousProps: AdminDetailBoundaryProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="admin-console__detail-error">
          <strong>This order detail could not render.</strong>
          <span>The order list is still usable. Try another order, or refresh after the legacy proof data is repaired.</span>
        </div>
      );
    }
    return this.props.children;
  }
}

const asPdfFilename = (filename: string) => filename.replace(/\.[^.]+$/, '') + '.pdf';

const orderProofImageUrl = (order: Pick<PaidOrder, 'id'>) =>
  `/api/orders/${encodeURIComponent(order.id)}/proof-image.png`;

type HomeCarouselItem = {
  id: string;
  image: string;
  label: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

type SeoMetaConfig = {
  title: string;
  description: string;
  path: string;
  schema?: unknown[];
};

type LegalPage = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: Array<{ title: string; copy: string }>;
};

const businessContact = {
  tradingName: 'InstaPlaque',
  legalForm: 'UK sole trader',
  email: 'hello@instaplaque.co.uk',
  phone: 'Phone number to be added',
  address: '4 Dunkirk Avenue, Kettering, NN14 2PL, United Kingdom',
  updated: '28 June 2026',
};

const legalPages: Partial<Record<SiteView, LegalPage>> = {
  contact: {
    eyebrow: 'Contact',
    title: 'Contact InstaPlaque.',
    intro: `For order questions, proof changes or delivery support, contact ${businessContact.tradingName} using the details below.`,
    sections: [
      { title: 'Trading identity', copy: `${businessContact.tradingName} is operated as a ${businessContact.legalForm}.` },
      { title: 'Business address', copy: businessContact.address },
      { title: 'Email', copy: businessContact.email },
      { title: 'Phone', copy: businessContact.phone },
    ],
  },
  terms: {
    eyebrow: 'Terms',
    title: 'Terms and conditions.',
    intro: `These terms apply to orders placed with ${businessContact.tradingName}. Last updated ${businessContact.updated}.`,
    sections: [
      { title: 'Orders and proofs', copy: 'You create and approve a digital proof before payment. By approving the proof, you confirm that the wording, layout, material, size, fixings and any wood backing are correct for production.' },
      { title: 'Prices and payment', copy: 'Prices are shown in pounds sterling. Payment is taken securely by Stripe. UK mainland delivery is included unless stated otherwise before checkout. We are not VAT registered.' },
      { title: 'Production and delivery', copy: 'Estimated production times are shown before checkout and run from proof approval and payment. Standard orders are usually estimated at 5 working days; aged brass, custom sizes and wood-backed plaques may take longer.' },
      { title: 'Customer details', copy: 'You must provide accurate contact and delivery details at checkout. We may contact you if an order detail needs checking before production or dispatch.' },
      { title: 'Faults and support', copy: 'Your statutory rights are not affected. If goods are faulty, damaged, not as described or not made with reasonable care, contact us as soon as possible so we can put things right.' },
      { title: 'Contact', copy: `${businessContact.email}. ${businessContact.address}.` },
    ],
  },
  privacy: {
    eyebrow: 'Privacy',
    title: 'Privacy policy.',
    intro: `${businessContact.tradingName} uses customer data to create proofs, process orders and provide support. Last updated ${businessContact.updated}.`,
    sections: [
      { title: 'Data collected', copy: 'Customer name, contact details, delivery details, plaque wording, proof details and order history may be collected to fulfil orders.' },
      { title: 'Why it is used', copy: 'Data is used to create and save plaque proofs, take payment, send order emails, prepare production files, arrange delivery, provide customer support and keep accounting and legal records.' },
      { title: 'Service providers', copy: 'We use trusted providers to run the service, including Stripe for payments, Vercel/Supabase for hosting and order storage, Resend for transactional email, and delivery providers where needed.' },
      { title: 'How long data is kept', copy: 'Order information is kept for as long as needed for production, support, accounting and legal record keeping. Proof artwork may be retained so we can remake or support the order.' },
      { title: 'Customer rights', copy: `You can ask to access, correct or delete personal data where the law allows by emailing ${businessContact.email}.` },
    ],
  },
  cookies: {
    eyebrow: 'Cookies',
    title: 'Cookie policy.',
    intro: `${businessContact.tradingName} uses a small number of essential technologies to make the proof and checkout flow work.`,
    sections: [
      { title: 'Essential storage', copy: 'The site may use cookies or local storage to remember proof progress, admin access and checkout state. These are needed for the service to work properly.' },
      { title: 'Payments', copy: 'Stripe may use cookies and similar technologies when processing secure checkout and fraud prevention.' },
      { title: 'Analytics and marketing', copy: 'We will not use non-essential analytics or advertising cookies without adding the appropriate consent controls.' },
      { title: 'Managing cookies', copy: 'You can block or delete cookies in your browser settings, but some proof, checkout or admin features may stop working correctly.' },
    ],
  },
  returns: {
    eyebrow: 'Returns and cancellations',
    title: 'Returns and cancellations.',
    intro: `Most ${businessContact.tradingName} products are personalised or made to order from an approved proof.`,
    sections: [
      { title: 'Personalised plaques', copy: 'Because plaques are made to your specification, change-of-mind cancellation normally cannot be accepted once you have approved the proof and production has started.' },
      { title: 'Before production', copy: `If you need to change or cancel an order, email ${businessContact.email} immediately. We will help where possible if production has not started.` },
      { title: 'Faulty or damaged goods', copy: 'Your statutory rights are not affected. If your plaque arrives damaged, faulty, not as described or not made with reasonable care, contact us promptly with photos and your order number.' },
      { title: 'Returns process', copy: 'Do not return an item without contacting us first. We will confirm the best next step, which may be a remake, repair, refund or return depending on the issue.' },
    ],
  },
};

const footerLinks: Array<{ view: SiteView; label: string }> = [
  { view: 'contact', label: 'Contact' },
  { view: 'terms', label: 'Terms' },
  { view: 'privacy', label: 'Privacy' },
  { view: 'cookies', label: 'Cookies' },
  { view: 'returns', label: 'Returns & cancellations' },
];

type FooterSocial = 'instagram' | 'facebook' | 'pinterest';

const footerSocials: Array<{ id: FooterSocial; label: string }> = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'pinterest', label: 'Pinterest' },
];

const homeCarouselItems: HomeCarouselItem[] = [
  {
    id: 'bench-steel',
    image: '/site-images/home-carousel-bench-steel.webp',
    label: 'Steel bench memorial plaque',
  },
  {
    id: 'garden-brass',
    image: '/site-images/home-carousel-garden-brass.webp',
    label: 'Brass garden dedication plaque',
  },
  {
    id: 'reading-room',
    image: '/site-images/home-carousel-reading-room.webp',
    label: 'Interior commemorative plaque',
  },
];

const siteBaseUrl = 'https://instaplaque.co.uk';
const siteShareImage = `${siteBaseUrl}/site-images/home-realistic-proof-row.jpg`;

const homeFaqs: FaqItem[] = [
  {
    question: 'How much does a custom plaque cost?',
    answer: 'Standard UK plaque prices are shown before checkout, including engraving, standard fixings and UK mainland delivery. Bench plaques start from £69, A5 plaques from £129 and A4 plaques from £149. Custom sizes are available up to our maximum size and may need a longer turnaround.',
  },
  {
    question: 'Can I preview my plaque before ordering?',
    answer: 'Yes. Add your wording, choose the material and size, then review a free proof before you pay. You can keep editing until the layout, wording and finish look right.',
  },
  {
    question: 'What size is a bench plaque?',
    answer: 'The compact bench plaque format starts at 150 x 50 mm for short inscriptions. Larger standard bench plaques are available, and custom sizes, oval plaques and circular plaques can be made up to our maximum size.',
  },
  {
    question: 'Which material is best for an outdoor plaque?',
    answer: 'Brushed stainless steel is clean and restrained for exposed outdoor settings. Brass gives a warmer traditional look, and aged brass is hand-patinated for more character.',
  },
  {
    question: 'Do you make brass and stainless steel plaques?',
    answer: 'Yes. Current options include brushed brass, polished brass, aged brass, orbital brass, brushed stainless steel and mirror stainless steel, with optional wood backing on suitable sizes.',
  },
  {
    question: 'Can I order a memorial plaque with my own wording?',
    answer: 'Yes. You can enter your own wording for memorial plaques, bench plaques, garden dedications, opening plaques and presentation plaques. The proof helps you check spacing and line breaks before ordering.',
  },
  {
    question: 'Is UK delivery included?',
    answer: 'UK mainland delivery is included in standard pricing. For delivery outside UK mainland, create or email the proof first and we will confirm delivery cost before sending a payment link.',
  },
  {
    question: 'Can I save the proof and come back later?',
    answer: 'Yes. You can download the proof PDF and use the link inside it to return to the design or checkout later without creating an account.',
  },
  {
    question: 'What if I need a custom size or shape?',
    answer: 'Start with a custom plaque proof for non-standard sizes, oval plaques or circular plaques. Custom sizes are available up to our maximum size and may need a longer turnaround. We are not currently accepting supplied artwork.',
  },
  {
    question: 'How quickly can my plaque be made?',
    answer: 'Standard orders are usually estimated at 5 working days from approved proof and payment. Aged brass, custom sizes, circles, ovals and wood backing may take longer and will be shown or confirmed before checkout.',
  },
  {
    question: 'Are aged brass patinas identical?',
    answer: 'No. Light, mid and heavy aged brass patinas are applied by hand, so each plaque is unique. The finish is sealed with a matt lacquer to slow further natural ageing.',
  },
  {
    question: 'What fixings are shown in the proof?',
    answer: 'The proof shows the visible fixing choice, including small domed cross-head screw heads where selected. Production artwork marks the drill holes separately so manufacture stays accurate.',
  },
];

const routePathForView = (view: SiteView) => {
  const paths: Partial<Record<SiteView, string>> = {
    home: '/',
    materials: '/materials',
    how: '/how-it-works',
    faq: '/faq',
    quote: '/quote',
    contact: '/contact',
    terms: '/terms',
    privacy: '/privacy',
    cookies: '/cookies',
    returns: '/returns-and-cancellations',
    checkout: '/checkout',
    'order-confirmed': '/order-confirmed',
    plaque: '/design',
    vector: '/etchmaster',
  };
  return paths[view] || '/';
};

const setMetaContent = (selector: string, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    const name = selector.match(/\[name="([^"]+)"\]/)?.[1];
    const property = selector.match(/\[property="([^"]+)"\]/)?.[1];
    if (name) element.setAttribute('name', name);
    if (property) element.setAttribute('property', property);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
};

const setCanonicalHref = (href: string) => {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = href;
};

const faqSchema = (faqs: FaqItem[]) => ({
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
});

const productListSchema = () => ({
  '@type': 'ItemList',
  name: 'Custom plaque formats',
  itemListElement: productFamilies.map((product, index) => {
    const price = product.startingFrom.match(/£(\d+(?:\.\d+)?)/)?.[1];
    return {
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: product.title,
        description: product.description,
        image: product.image ? `${siteBaseUrl}${product.image}` : siteShareImage,
        brand: {
          '@type': 'Brand',
          name: 'InstaPlaque',
        },
        offers: price ? {
          '@type': 'Offer',
          priceCurrency: 'GBP',
          price,
          availability: 'https://schema.org/InStock',
          url: `${siteBaseUrl}/`,
        } : undefined,
      },
    };
  }),
});

const seoConfigForView = (view: SiteView, selectedProduct: ProductFamily): SeoMetaConfig => {
  const routePath = routePathForView(view);
  if (view === 'materials') {
    return {
      title: 'Plaque Materials UK | Brass, Stainless Steel & Wood Backing',
      description: 'Compare brass, aged brass, stainless steel and wood-backed plaque finishes before ordering your UK plaque proof.',
      path: routePath,
      schema: [{
        '@type': 'CollectionPage',
        name: 'Plaque materials',
        description: 'Brass, aged brass, stainless steel and wood backing options for custom UK plaques.',
      }],
    };
  }
  if (view === 'how') {
    return {
      title: 'How Online Plaque Proofing Works | InstaPlaque UK',
      description: 'Create a plaque proof online, approve the design, pay securely and receive your custom plaque after production.',
      path: routePath,
      schema: [{
        '@type': 'HowTo',
        name: 'How to order a custom plaque online',
        step: ['Choose plaque options', 'Add your wording', 'Review the free proof', 'Approve the design', 'Checkout securely'],
      }],
    };
  }
  if (view === 'faq') {
    return {
      title: 'Custom Plaque FAQs UK | InstaPlaque',
      description: 'Answers about custom plaque prices, materials, proofing, UK delivery, fixings, aged brass and bespoke plaque orders.',
      path: routePath,
      schema: [faqSchema(homeFaqs)],
    };
  }
  if (view === 'quote') {
    return {
      title: 'Custom Plaque Quotes UK | InstaPlaque',
      description: 'Start a proof for custom plaque sizes, oval plaques, circular plaques and longer-turnaround plaque orders in the UK.',
      path: routePath,
    };
  }
  if (view === 'product') {
    return {
      title: `${selectedProduct.title} UK | Free Online Plaque Proof`,
      description: `${selectedProduct.description} Create a free proof online before ordering.`,
      path: '/',
      schema: [faqSchema(selectedProduct.faqs)],
    };
  }
  return {
    title: 'Custom Memorial, Bench, Brass & Stainless Steel Plaques UK | InstaPlaque',
    description: 'Create a free custom plaque proof online. UK-made memorial, bench, brass and stainless steel plaques with live pricing, secure checkout and UK mainland delivery included.',
    path: '/',
    schema: [productListSchema(), faqSchema(homeFaqs)],
  };
};

const useSeoMeta = (view: SiteView, selectedProduct: ProductFamily) => {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const config = seoConfigForView(view, selectedProduct);
    const url = `${siteBaseUrl}${config.path}`;
    document.title = config.title;
    setMetaContent('meta[name="description"]', config.description);
    setMetaContent('meta[property="og:title"]', config.title);
    setMetaContent('meta[property="og:description"]', config.description);
    setMetaContent('meta[property="og:url"]', url);
    setMetaContent('meta[property="og:image"]', siteShareImage);
    setMetaContent('meta[name="twitter:title"]', config.title);
    setMetaContent('meta[name="twitter:description"]', config.description);
    setMetaContent('meta[name="twitter:image"]', siteShareImage);
    setCanonicalHref(url);

    const routeSchema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': `${url}#webpage`,
          url,
          name: config.title,
          description: config.description,
          isPartOf: {
            '@id': `${siteBaseUrl}/#website`,
          },
        },
        ...(config.schema || []),
      ],
    };

    let schemaElement = document.getElementById('instaplaque-route-schema') as HTMLScriptElement | null;
    if (!schemaElement) {
      schemaElement = document.createElement('script');
      schemaElement.id = 'instaplaque-route-schema';
      schemaElement.type = 'application/ld+json';
      document.head.appendChild(schemaElement);
    }
    schemaElement.textContent = JSON.stringify(routeSchema);
  }, [view, selectedProduct]);
};

function ProductMockup({ product }: { product: ProductFamily }) {
  return (
    <div className={`commerce-product-visual commerce-product-visual--${product.materialCue}`} aria-hidden="true">
      {product.image ? (
        <img src={product.image} alt="" loading="lazy" />
      ) : (
        <>
          <div className="commerce-product-shadow" />
          <div className="commerce-product-plaque">
            <span>{product.shortTitle}</span>
          </div>
        </>
      )}
    </div>
  );
}

function SiteHero({ onStartDesign }: Pick<SiteProps, 'onStartDesign'>) {
  return (
    <section className="commerce-hero commerce-hero--premium">
      <div className="commerce-premium-hero__image" aria-hidden="true" />
      <div className="commerce-premium-hero__shade" aria-hidden="true" />
      <div className="commerce-premium-hero__copy">
        <div className="brand-wordmark brand-wordmark--hero-title" aria-label="InstaPlaque"><span>Insta</span><span>Plaque</span></div>
        <div className="commerce-hero-promise" aria-label="Free professional proof in minutes. Finished plaque in five working days.">
          <span><strong>100% free</strong> professional proof in minutes</span>
          <span>Your finished plaque in <strong>5 working days</strong></span>
        </div>
        <p>
          {USE_CUSTOMER_COPY_PASS
            ? 'Create a professional plaque proof in minutes from your wording. Skip the design back-and-forth and receive your finished plaque in 5 working days, engraved with care using the finest materials.'
            : 'Our unique intelligent plaque design system turns your wording into a production-ready proof in minutes. Skip the design back-and-forth and receive your finished plaque in 5 working days, engraved with care using the finest materials.'}
        </p>
        <div className="commerce-actions">
          <button type="button" className="commerce-primary commerce-primary--cream" onClick={onStartDesign}>
            Create your proof
          </button>
          <a className="commerce-secondary commerce-secondary--glass" href="#products">View standard sizes</a>
        </div>
      </div>
    </section>
  );
}

function ProductGrid({ onLaunchProduct }: Pick<SiteProps, 'onLaunchProduct'>) {
  return (
    <section className="commerce-section" id="products">
      <div className="commerce-section__head">
        <p className="commerce-eyebrow">Standard sizes</p>
        <h2>Choose the format, then start your free proof.</h2>
        <p>
          Order UK bench plaques, memorial plaques, brass plaques and stainless steel plaques in standard sizes.
          Custom sizes, oval plaques and circular plaques are available up to our maximum size, with turnaround confirmed before payment where needed.
        </p>
      </div>
      <div className="commerce-product-grid">
        {productFamilies.map((product) => (
          <article className="commerce-product-card" key={product.slug}>
            <ProductMockup product={product} />
            <div>
              <p className="commerce-card-eyebrow">{product.eyebrow}</p>
              <h3>{product.title}</h3>
              <p>{product.description}</p>
              <div className="commerce-size-meta" aria-label={`${product.title} use cases`}>
                {product.bestFor.slice(0, 3).map((item) => <span key={item}>{item}</span>)}
              </div>
            </div>
            <div className="commerce-card-foot">
              <span>{product.startingFrom}</span>
              <button type="button" onClick={() => onLaunchProduct(product)}>Start proof</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ExpandableFaqList({ faqs, defaultOpenIndex = null }: { faqs: FaqItem[]; defaultOpenIndex?: number | null }) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpenIndex);

  return (
    <div className="commerce-faq-grid">
      {faqs.map((faq, index) => (
        <article className="commerce-faq-card" key={faq.question}>
          <details open={openIndex === index}>
            <summary
              onClick={(event) => {
                event.preventDefault();
                setOpenIndex((current) => current === index ? null : index);
              }}
            >
              {faq.question}
            </summary>
            <p>{faq.answer}</p>
          </details>
        </article>
      ))}
    </div>
  );
}

function HomeMaterialPanels() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const activeMaterial = materialStories[activeIndex] ?? materialStories[0];
  const materialCount = materialStories.length;
  const moveMaterial = (direction: number) => {
    setActiveIndex((current) => (current + direction + materialCount) % materialCount);
  };
  const handleMaterialTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) return;
    const delta = (event.changedTouches[0]?.clientX ?? touchStartX) - touchStartX;
    if (Math.abs(delta) > 36) moveMaterial(delta < 0 ? 1 : -1);
    setTouchStartX(null);
  };
  const getSliderSlot = (index: number) => {
    const rawOffset = index - activeIndex;
    const wrappedOffset = ((rawOffset + materialCount / 2) % materialCount) - materialCount / 2;
    return Math.round(wrappedOffset);
  };

  return (
    <section className="commerce-section commerce-material-showcase">
      <div className="commerce-material-slider">
        <div className="commerce-material-atelier__copy">
          <p className="commerce-eyebrow">Materials</p>
          <h2>Spin through the finishes.</h2>
          <p>
            {USE_CUSTOMER_COPY_PASS
              ? 'Compare brass, stainless steel and wood finishes before you choose. Each material is shown clearly so you can feel confident about the look of your plaque.'
              : 'Real brass, stainless steel and wood scans, staged as lightweight WebP previews so the finish feels tangible without making the homepage carry production-sized textures.'}
          </p>
          <div className="commerce-material-atelier__meta" aria-label="Selected material details">
            <span>{activeMaterial.family} finish</span>
            <strong>{activeMaterial.title}</strong>
            <em>{activeMaterial.tone}</em>
            <p>{activeMaterial.copy}</p>
          </div>
        </div>

        <div className="commerce-material-carousel-wrap">
          <div
            className="commerce-material-carousel"
            aria-live="polite"
            aria-label="3D plaque material slider"
            onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
            onTouchEnd={handleMaterialTouchEnd}
          >
            {materialStories.map((material, index) => {
              const slot = getSliderSlot(index);
              const isActive = index === activeIndex;
              const isVisible = Math.abs(slot) <= 3;

              return (
                <button
                  type="button"
                  className="commerce-material-slide"
                  data-active={isActive}
                  data-visible={isVisible}
                  key={material.title}
                  onClick={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                  aria-pressed={isActive}
                  style={{ '--slot': slot } as React.CSSProperties}
                >
                  <span className="commerce-material-slide__surface">
                    <img
                      src={material.sliderImage}
                      alt={`${material.title} texture sample`}
                      loading={isActive ? 'eager' : 'lazy'}
                      decoding="async"
                      width="1280"
                      height="1600"
                    />
                  </span>
                  <span className="commerce-material-slide__edge" aria-hidden="true" />
                </button>
              );
            })}
            <div className="commerce-material-carousel__shadow" aria-hidden="true" />
          </div>

          <div className="commerce-material-controls">
            <button type="button" onClick={() => moveMaterial(-1)} aria-label="Previous material">‹</button>
            <button type="button" onClick={() => moveMaterial(1)} aria-label="Next material">›</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeFaq() {
  return (
    <section className="commerce-section commerce-home-faq">
      <div className="commerce-section__head">
        <p className="commerce-eyebrow">Questions</p>
        <h2>FAQ</h2>
      </div>
      <ExpandableFaqList faqs={homeFaqs} />
    </section>
  );
}

function HomePage(props: Pick<SiteProps, 'onNavigate' | 'onStartDesign' | 'onLaunchProduct'>) {
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const moveCarousel = (direction: number) => {
    setActiveCarouselIndex((current) => (current + direction + homeCarouselItems.length) % homeCarouselItems.length);
  };

  return (
    <div className="commerce-page">
      <SiteHero onStartDesign={props.onStartDesign} />
      <section className="commerce-section commerce-home-story">
        <div
          className="commerce-proof-carousel commerce-proof-carousel--coverflow"
          aria-label="Swipe through InstaPlaque proof examples"
          onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
          onTouchEnd={(event) => {
            if (touchStartX === null) return;
            const delta = (event.changedTouches[0]?.clientX ?? touchStartX) - touchStartX;
            if (Math.abs(delta) > 36) moveCarousel(delta < 0 ? 1 : -1);
            setTouchStartX(null);
          }}
        >
          <button type="button" className="commerce-carousel-arrow commerce-carousel-arrow--prev" onClick={() => moveCarousel(-1)} aria-label="Previous plaque example">‹</button>
          <div className="commerce-proof-carousel__deck" aria-live="polite">
            {homeCarouselItems.map((item, index) => {
              let offset = index - activeCarouselIndex;
              if (offset > homeCarouselItems.length / 2) offset -= homeCarouselItems.length;
              if (offset < -homeCarouselItems.length / 2) offset += homeCarouselItems.length;
              return (
                <button
                  type="button"
                  key={item.id}
                  className="commerce-proof-carousel__slide"
                  data-offset={offset}
                  aria-label={item.label}
                  aria-pressed={index === activeCarouselIndex}
                  onClick={() => setActiveCarouselIndex(index)}
                  style={{ '--carousel-offset': offset } as React.CSSProperties}
                >
                  <img src={item.image} alt="" loading={index === 0 ? 'eager' : 'lazy'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
          <button type="button" className="commerce-carousel-arrow commerce-carousel-arrow--next" onClick={() => moveCarousel(1)} aria-label="Next plaque example">›</button>
        </div>
        <article className="commerce-proof-first-copy">
          <p className="commerce-eyebrow">Why this is different</p>
          <h2>You choose the details. We shape the plaque.</h2>
          <p>
            {USE_CUSTOMER_COPY_PASS
              ? 'Choose the plaque type, size, material and wording. We handle the layout, spacing and line breaks, then show you a realistic proof before you order.'
              : 'Choose the plaque type, size, material and wording. Our intelligent plaque proofing system handles the layout, spacing, line breaks and production details, then shows you a realistic proof before you order.'}
          </p>
          <p>
            No guesswork and no hidden costs: engraving, standard fixings and UK mainland delivery are
            included, with optional extras shown clearly before checkout.
          </p>
          <button type="button" className="commerce-primary" onClick={props.onStartDesign}>
            Start your free proof
          </button>
          <small>Your InstaPlaque proof is 100% free. Need time to decide? Download the PDF proof and use the link inside to continue or checkout later. No account needed.</small>
        </article>
        <div className="commerce-proof-first-steps" aria-label={USE_CUSTOMER_COPY_PASS ? 'How your proof works' : 'How the proofing system works'}>
          {[
            ['Choose your plaque options', 'Pick the size, material, fixings and finish in plain steps.'],
            ['Add the wording', USE_CUSTOMER_COPY_PASS ? 'Type the inscription once. We shape it into a clear plaque layout.' : 'Type the inscription once. The system handles the hard layout work.'],
            ['Review the proof and price', 'See a realistic proof and live price before checkout.'],
          ].map(([title, detail], index) => (
            <div className="commerce-proof-first-step" key={title}>
              <span>{index + 1}</span>
              <div>
                <strong>{title}</strong>
                <p>{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <ProductGrid onLaunchProduct={props.onLaunchProduct} />
      <HomeMaterialPanels />
      <HomeFaq />
    </div>
  );
}

function ProductPage({ selectedProduct, onLaunchProduct }: Pick<SiteProps, 'selectedProduct' | 'onLaunchProduct'>) {
  return (
    <div className="commerce-page">
      <section className="commerce-product-detail">
        <div>
          <p className="commerce-eyebrow">{selectedProduct.eyebrow}</p>
          <h1>{selectedProduct.title}</h1>
          <p className="commerce-lede">{selectedProduct.description}</p>
          <div className="commerce-actions">
            <button type="button" className="commerce-primary" onClick={() => onLaunchProduct(selectedProduct)}>
              Design this plaque
            </button>
            <span className="commerce-price-note">{selectedProduct.startingFrom} · UK mainland delivery included</span>
          </div>
          <ul className="commerce-bullet-list">
            {selectedProduct.bestFor.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <ProductMockup product={selectedProduct} />
      </section>
      <section className="commerce-section">
        <div className="commerce-section__head">
          <p className="commerce-eyebrow">Product questions</p>
          <h2>{USE_CUSTOMER_COPY_PASS ? 'Fast answers before you start your proof.' : 'Fast answers before customers enter the proof bench.'}</h2>
        </div>
        <ExpandableFaqList faqs={selectedProduct.faqs} />
      </section>
    </div>
  );
}

function MaterialsPage() {
  return (
    <div className="commerce-page">
      <section className="commerce-section">
        <div className="commerce-section__head">
          <p className="commerce-eyebrow">Material guide</p>
          <h1>{USE_CUSTOMER_COPY_PASS ? 'Real plaque finishes, shown before you order.' : 'Real plaque finishes, shown before the customer orders.'}</h1>
          <p>
            {USE_CUSTOMER_COPY_PASS
              ? 'See the character of each finish before you approve your proof, from brushed metals to warm wood veneers.'
              : 'Customers should understand the finish before they approve the proof. These stories give the site a product-led layer around the design tool.'}
          </p>
        </div>
        <div className="commerce-material-grid">
          {materialStories.map((material) => (
            <article className="commerce-material-card" key={material.title}>
              <div style={{ backgroundImage: `url(${material.thumbnail})` }} />
              <h3>{material.title}</h3>
              <p>{material.copy}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function HowItWorksPage() {
  return (
    <div className="commerce-page">
      <section className="commerce-section commerce-deep-copy">
        <p className="commerce-eyebrow">{USE_CUSTOMER_COPY_PASS ? 'How it works' : 'The new model'}</p>
        <h1>{USE_CUSTOMER_COPY_PASS ? 'Create, check and approve your plaque proof online.' : 'Instant proof approval replaces the slow PDF loop.'}</h1>
        <p>
          {USE_CUSTOMER_COPY_PASS
            ? 'Choose your plaque, add your wording and review the proof before you place the order. You can keep editing until everything looks right.'
            : 'The customer creates a production-style proof before checkout. They can keep editing until the approval step, then the order records a locked design snapshot.'}
        </p>
        <div className="commerce-flow-panel">
          {(USE_CUSTOMER_COPY_PASS
            ? ['Choose plaque', 'Add wording', 'Review proof', 'Approve design', 'Secure checkout', 'Preparing your plaque']
            : ['Select product', 'Generate AI proof', 'Review price', 'Approve proof', 'Secure checkout', 'Production queue']
          ).map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>
    </div>
  );
}

function FaqPage() {
  return (
    <div className="commerce-page">
      <section className="commerce-section">
        <div className="commerce-section__head">
          <p className="commerce-eyebrow">FAQ</p>
          <h1>FAQ</h1>
        </div>
        <ExpandableFaqList faqs={homeFaqs} />
      </section>
    </div>
  );
}

function QuotePage({ onLaunchProduct }: Pick<SiteProps, 'onLaunchProduct'>) {
  const bespoke = productFamilies.find((product) => product.slug === 'custom-plaques') ?? productFamilies[0];
  return (
    <div className="commerce-page">
      <section className="commerce-product-detail">
        <div>
          <p className="commerce-eyebrow">{USE_CUSTOMER_COPY_PASS ? 'Bespoke plaques' : 'Bespoke route'}</p>
          <h1>{USE_CUSTOMER_COPY_PASS ? 'Need something made to measure?' : 'Start with an instant proof, then route complex work to quote.'}</h1>
          <p className="commerce-lede">
            {USE_CUSTOMER_COPY_PASS
              ? 'Start with a proof and tell us what you need. We will confirm anything unusual, including custom sizes, oval plaques, circular plaques and longer-turnaround work, before payment.'
              : 'Customers should not hit a dead-end when a plaque is unusual. They can still create a proof, then the system flags custom sizes, ovals, circles or longer-turnaround work for manual confirmation.'}
          </p>
          <div className="commerce-actions">
            <button type="button" className="commerce-primary" onClick={() => onLaunchProduct(bespoke)}>
              Start bespoke proof
            </button>
          </div>
        </div>
        <div className="commerce-quote-panel">
          <p className="commerce-eyebrow">{USE_CUSTOMER_COPY_PASS ? 'We can quote for' : 'Quote triggers'}</p>
          <ul>
            <li>Oversized dimensions outside the standard production bed</li>
            <li>Oval plaques and circular plaques</li>
            <li>Custom sizes up to our maximum production size</li>
            <li>Longer-turnaround finishes or wood-backed plaques</li>
            <li>Delivery outside UK mainland</li>
          </ul>
          <div className="commerce-warning">
            Send the proof through and we will confirm anything unusual before payment.
          </div>
        </div>
      </section>
    </div>
  );
}

function CheckoutPage({
  state,
  inscription,
  selectedProduct,
  isProductionReady,
  onCreateMockOrder,
  onNavigate,
}: Pick<SiteProps, 'state' | 'inscription' | 'selectedProduct' | 'isProductionReady' | 'onCreateMockOrder' | 'onNavigate'>) {
  const [createdOrder, setCreatedOrder] = useState<MockOrder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [embeddedStatus, setEmbeddedStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [embeddedError, setEmbeddedError] = useState<string | null>(null);
  const embeddedMountRef = useRef<HTMLDivElement | null>(null);
  const checkoutProofSvgRef = useRef<SVGSVGElement | null>(null);
  const breakdown = getPriceBreakdown(state, inscription);
  const embeddedClientSecret = createdOrder?.stripeSimulation.embeddedClientSecret;
  const stripePublishableKey = createdOrder?.stripeSimulation.publishableKey;

  const prepareCheckout = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setOrderError(null);
    setEmbeddedStatus('idle');
    setEmbeddedError(null);
    try {
      const order = await onCreateMockOrder('Stripe checkout customer', '', undefined, checkoutProofSvgRef.current);
      setCreatedOrder(order);
      if (order.stripeSimulation.checkoutUrl && order.stripeSimulation.uiMode !== 'embedded') {
        window.location.assign(order.stripeSimulation.checkoutUrl);
      }
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : 'Secure checkout could not be prepared.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!createdOrder || !embeddedClientSecret || !stripePublishableKey || !embeddedMountRef.current) {
      return;
    }

    let mounted = true;
    let embeddedCheckout: EmbeddedCheckoutInstance | null = null;
    setEmbeddedStatus('loading');
    setEmbeddedError(null);

    loadStripeJs()
      .then(async () => {
        const stripe = window.Stripe?.(stripePublishableKey);
        if (!stripe) throw new Error('Stripe.js did not initialise.');
        const checkout = await withClientTimeout(
          stripe.initEmbeddedCheckout({ clientSecret: embeddedClientSecret }),
          12000,
          'Stripe checkout',
        );
        if (!mounted) {
          checkout.destroy?.();
          return;
        }
        embeddedCheckout = checkout;
        checkout.mount(embeddedMountRef.current!);
        setEmbeddedStatus('ready');
      })
      .catch((error) => {
        if (!mounted) return;
        setEmbeddedStatus('error');
        setEmbeddedError(error instanceof Error ? error.message : 'Embedded Stripe checkout could not be loaded.');
      });

    return () => {
      mounted = false;
      embeddedCheckout?.destroy?.();
      if (embeddedMountRef.current) embeddedMountRef.current.replaceChildren();
    };
  }, [createdOrder, embeddedClientSecret, stripePublishableKey]);

  return (
    <div className="commerce-page">
      <section className="commerce-checkout">
        <div className="commerce-checkout-proof">
          <p className="commerce-eyebrow">Approved proof</p>
          <div className="commerce-checkout-preview">
            <PlaquePreview ref={checkoutProofSvgRef} state={state} activeStep={6} inscription={inscription} />
          </div>
          <div className="commerce-summary-lines">
            <span><strong>{getPlaqueSummaryTitle(state, selectedProduct.title)}</strong></span>
            <span>Base plaque <strong>{formatPrice(breakdown.base)}</strong></span>
            {breakdown.wood > 0 && <span>Wood backing <strong>{formatPrice(breakdown.wood)}</strong></span>}
            <span>UK mainland delivery <strong>Included</strong></span>
            <span className="commerce-summary-total">Total <strong>{formatPrice(breakdown.total)}</strong></span>
          </div>
          <button type="button" className="commerce-secondary" onClick={() => onNavigate('plaque')}>
            Edit proof
          </button>
        </div>
        <div className="commerce-checkout-panel">
          <div className="commerce-checkout-form">
            <p className="commerce-eyebrow">Secure checkout</p>
            <h1>Complete your order.</h1>
            <p>
              Continue to Stripe's secure checkout page to enter contact, delivery and payment details.
            </p>
            {!isProductionReady && (
              <div className="commerce-warning">
                Finish your proof before checkout.
                <button type="button" onClick={() => onNavigate('plaque')}>Return to proof</button>
              </div>
            )}
            {breakdown.quoteRequired && (
              <div className="commerce-warning">
                This order may need a delivery or production check before payment.
              </div>
            )}
            {isSubmitting && <div className="commerce-success">Preparing secure checkout...</div>}
            {orderError && (
              <div className="commerce-warning">
                {orderError}
                <button type="button" onClick={prepareCheckout}>Try again</button>
              </div>
            )}
            {createdOrder ? (
              <>
              {createdOrder.stripeSimulation.embeddedClientSecret && createdOrder.stripeSimulation.publishableKey && (
                <div className="commerce-embedded-checkout" aria-live="polite">
                  <div className="commerce-embedded-checkout__head">
                    <strong>Secure Stripe checkout</strong>
                    <span>Protected payment, address and delivery details.</span>
                  </div>
                  {embeddedStatus === 'loading' && <span>Loading secure payment form...</span>}
                  {embeddedStatus === 'error' && (
                    <span className="commerce-embedded-checkout__error">
                      {embeddedError}
                      <button type="button" className="commerce-secondary" onClick={prepareCheckout}>Retry secure checkout</button>
                    </span>
                  )}
                  <div ref={embeddedMountRef} className="commerce-embedded-checkout__mount" />
                </div>
              )}
              </>
            ) : null}
            {isProductionReady && (
              <button
                type="button"
                className="commerce-primary"
                disabled={isSubmitting}
                onClick={() => {
                  if (createdOrder?.stripeSimulation.checkoutUrl) {
                    window.location.assign(createdOrder.stripeSimulation.checkoutUrl);
                    return;
                  }
                  prepareCheckout();
                }}
              >
                {isSubmitting ? 'Preparing secure checkout...' : 'Continue to secure Stripe checkout'}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function OrderConfirmedPage({ onNavigate }: Pick<SiteProps, 'onNavigate'>) {
  const [order, setOrder] = useState<PaidOrder | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [proofReady, setProofReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const proofRenderSvgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('order') || '';
    const sessionId = params.get('session_id') || '';
    if (!orderId) {
      setStatus('error');
      setError('Order reference missing.');
      return;
    }

    let cancelled = false;
    const loadOrder = async () => {
      try {
        const url = `/api/orders/${encodeURIComponent(orderId)}${sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ''}`;
        const response = await fetch(url);
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || `Could not load order (${response.status}).`);
        if (cancelled) return;
        setOrder(payload.order);
        setStatus('ready');
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : 'Could not load order.');
        setStatus('error');
      }
    };
    loadOrder();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!order) return;
    let cancelled = false;
    let attempt = 0;

    const checkProof = async () => {
      if (!order.proofPackage?.visualProofPng) return;
      attempt += 1;
      try {
        const response = await fetch(orderProofImageUrl(order), { cache: 'no-store' });
        if (!cancelled && response.ok && response.headers.get('content-type')?.includes('image/png')) {
          setProofReady(true);
          return;
        }
      } catch {
        // The proof image may still be attaching immediately after checkout.
      }
      if (!cancelled && attempt < 8) {
        window.setTimeout(checkProof, 1000);
      }
    };

    setProofReady(false);
    checkProof();
    return () => {
      cancelled = true;
    };
  }, [order?.id]);

  useEffect(() => {
    if (!order || order.proofPackage?.visualProofRendererVersion === VISUAL_PROOF_RENDERER_VERSION || !proofRenderSvgRef.current) return;

    let cancelled = false;
    const attachRenderedProof = async () => {
      try {
        await document.fonts?.ready;
        await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
        const sourceSvg = proofRenderSvgRef.current;
        if (!sourceSvg || cancelled) return;
        const proofImageBase64 = await svgToProofPngBase64(sourceSvg);
        let productionArtworkPdf = '';
        try {
          productionArtworkPdf = await blobToDataUrl(await createCorelPdfBlob(sourceSvg, order.plaqueState));
        } catch (pdfError) {
          console.warn('Production PDF could not be generated for the internal pack.', pdfError);
        }
        if (cancelled) return;
        const response = await fetch(`/api/orders/${encodeURIComponent(order.id)}/proof-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stripeCheckoutSessionId: order.stripeCheckoutSessionId,
            visualProofSvg: sourceSvg.outerHTML,
            visualProofPng: proofImageBase64,
            visualProofRendererVersion: VISUAL_PROOF_RENDERER_VERSION,
            productionArtworkPdf,
            sendCustomerEmail: !order.proofPackage?.visualProofPng,
          }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || `Could not attach proof image (${response.status}).`);
        if (!cancelled) {
          setOrder(payload.order);
          setProofReady(true);
        }
      } catch (attachError) {
        console.warn('Approved proof image could not be attached after checkout.', attachError);
      }
    };

    attachRenderedProof();
    return () => {
      cancelled = true;
    };
  }, [order?.id, order?.proofPackage?.visualProofPng, order?.proofPackage?.visualProofRendererVersion]);

  if (status === 'loading') {
    return (
      <div className="commerce-page">
        <section className="commerce-section">
          <div className="commerce-success">Confirming your order...</div>
        </section>
      </div>
    );
  }

  if (status === 'error' || !order) {
    return (
      <div className="commerce-page">
        <section className="commerce-section">
          <div className="commerce-warning">
            {error || 'Could not load this order.'}
            <button type="button" onClick={() => onNavigate('contact')}>Contact us</button>
          </div>
        </section>
      </div>
    );
  }

  const paid = order.paymentStatus === 'paid';
  const address = order.shippingAddress || {};
  const fulfilmentStage = order.fulfilmentStatus || order.status;
  const currentStepIndex = fulfilmentStage === 'dispatched' || fulfilmentStage === 'ready_to_dispatch'
    ? 3
    : paid
      ? 2
      : 1;
  const orderSteps = [
    'Proof approved',
    'Payment confirmed',
    USE_CUSTOMER_COPY_PASS ? 'Preparing your plaque' : 'Production preparation',
    'Dispatch email follows',
  ];
  const proofExportWidth = 1200;
  const proofExportHeight = order.plaqueState
    ? Math.max(320, Math.round(proofExportWidth * ((order.plaqueState.height + (order.plaqueState.wood ? 25 : 0)) / Math.max(1, order.plaqueState.width + (order.plaqueState.wood ? 25 : 0)))))
    : 720;

  return (
    <div className="commerce-page">
      <section className="commerce-order-confirmed">
        <div className="commerce-order-confirmed__main">
          {order.plaqueState && (
            <div
              aria-hidden="true"
              className="commerce-order-export-renderer"
              style={{ width: proofExportWidth, height: proofExportHeight }}
            >
              <PlaquePreview ref={proofRenderSvgRef} state={order.plaqueState} activeStep={6} inscription={order.inscription} />
            </div>
          )}
          <p className="commerce-eyebrow">{paid ? 'Order confirmed' : 'Order received'}</p>
          <h1>{paid ? 'Your plaque order is confirmed.' : 'We are confirming your payment.'}</h1>
          <p className="commerce-lede">
            {paid
              ? 'Your approved proof has been locked for production. We will prepare it and email you when it is dispatched.'
              : USE_CUSTOMER_COPY_PASS
                ? 'We are waiting for payment confirmation. This usually takes a few seconds.'
                : 'Your order has been created. If payment has completed, this page will update once Stripe confirms it.'}
          </p>
          <div className="commerce-order-proof">
            {order.proofPackage?.visualProofPng && proofReady ? (
              <img
                src={`${orderProofImageUrl(order)}?v=${encodeURIComponent(order.updatedAt || order.id)}`}
                alt="Approved plaque proof"
                className="commerce-order-proof__image"
              />
            ) : order.plaqueState ? (
              <div className="commerce-order-proof__live-preview">
                <PlaquePreview state={order.plaqueState} activeStep={6} inscription={order.inscription} />
              </div>
            ) : (
              <div className="commerce-order-proof__pending">Loading approved proof...</div>
            )}
          </div>
        </div>
        <aside className="commerce-order-card">
          <div>
            <span>Order number</span>
            <strong>{order.id}</strong>
          </div>
          <div>
            <span>Total paid</span>
            <strong>{formatPence(order.totalPence, order.currency)}</strong>
          </div>
          <div>
            <span>Plaque</span>
            <strong>{getPlaqueSummaryTitle(order.plaqueState, order.productTitle)}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{statusLabel(order.status)}</strong>
          </div>
          <div className="commerce-order-address">
            <span>Delivery address</span>
            <p>
              {[address.name, address.line1, address.line2, address.city, address.postal_code || address.postcode, address.country]
                .filter(Boolean)
                .join(', ') || 'Held by Stripe checkout'}
            </p>
          </div>
          <div className="commerce-checkout-flow" aria-label="Order progress">
            {orderSteps.map((step, index) => (
              <span
                key={step}
                className={[
                  index < currentStepIndex ? 'is-complete' : '',
                  index === currentStepIndex ? 'is-current' : '',
                ].filter(Boolean).join(' ')}
              >
                {step}
              </span>
            ))}
          </div>
          <button
            type="button"
            className="commerce-secondary"
            onClick={() => downloadOrderProofPng(order).catch((downloadError) => {
              console.error('Proof PNG download failed.', downloadError);
              window.alert('The approved proof image is still being prepared. Please try again in a few seconds.');
            })}
          >
            <DownloadIcon />
            Download approved proof
          </button>
          <button type="button" className="commerce-secondary" onClick={() => window.print()}>
            Print confirmation
          </button>
        </aside>
      </section>
    </div>
  );
}

function AdminPage() {
  const [orders, setOrders] = useState<PaidOrder[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<PaidOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [authConfig, setAuthConfig] = useState<AdminAuthConfig | null>(null);
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('instaplaque-admin-token') || '');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<AdminStatusFilter>('active');
  const [sortMode, setSortMode] = useState<AdminSortMode>('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const adminProofSvgRef = useRef<SVGSVGElement | null>(null);
  const selectedSummaryOrder = orders.find((order) => order.id === selectedId) || orders[0] || null;
  const selectedOrder = selectedOrderDetail?.id === selectedSummaryOrder?.id ? selectedOrderDetail : selectedSummaryOrder;
  const canRenderSelectedProof = hasRenderablePlaqueState(selectedOrder?.plaqueState);
  const selectedStoredProofSvg = storedProofSvgForOrder(selectedOrder);
  const canDownloadSelectedProductionArtwork = Boolean(canRenderSelectedProof || selectedStoredProofSvg);
  const adminHeaders = adminToken ? { 'x-admin-token': adminToken } : {};

  const downloadProductionArtwork = async (order: PaidOrder) => {
    if (hasRenderablePlaqueState(order.plaqueState)) {
      if (!adminProofSvgRef.current) {
        window.alert('Production PDF is still preparing from the approved preview. Please try again in a moment.');
        return;
      }
      if ('fonts' in document) {
        await document.fonts.ready;
      }
      await new Promise((resolve) => requestAnimationFrame(resolve));
      downloadCorelPdf(
        adminProofSvgRef.current,
        order.plaqueState,
        asPdfFilename(order.proofPackage?.productionFilename || `${order.id}-production-artwork.pdf`),
      );
      return;
    }
    downloadStoredProductionArtwork(order);
  };

  const loadOrders = async () => {
    if (authConfig?.authRequired && !adminToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setAdminError(null);
    try {
      const response = await fetch('/api/admin/orders', { headers: adminHeaders });
      const payload = await response.json();
      if (response.status === 401) {
        localStorage.removeItem('instaplaque-admin-token');
        setAdminToken('');
        throw new Error('Admin access required.');
      }
      if (!response.ok) throw new Error(payload.error || `Could not load orders (${response.status}).`);
      const nextOrders = payload.orders || [];
      setOrders(nextOrders);
      setSelectedId((current) => nextOrders.some((order: PaidOrder) => order.id === current)
        ? current
        : nextOrders[0]?.id || null);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Could not load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadAuthConfig = async () => {
      try {
        const response = await fetch('/api/admin/auth-config');
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Could not check admin access.');
        setAuthConfig({ authRequired: Boolean(payload.authRequired), label: payload.label });
      } catch (error) {
        setAdminError(error instanceof Error ? error.message : 'Could not check admin access.');
        setLoading(false);
      }
    };
    loadAuthConfig();
  }, []);

  useEffect(() => {
    if (!authConfig) return;
    loadOrders();
  }, [authConfig, adminToken]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedOrderDetail(null);
      return;
    }
    let cancelled = false;
    setSelectedOrderDetail(null);
    const loadSelectedOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(selectedId)}`);
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || `Could not load order detail (${response.status}).`);
        if (!cancelled) setSelectedOrderDetail(payload.order);
      } catch (error) {
        console.warn('Admin order detail could not be loaded.', error);
      }
    };
    loadSelectedOrder();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const loginAdmin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthLoading(true);
    setAdminError(null);
    try {
      const response = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Admin passcode was not accepted.');
      localStorage.setItem('instaplaque-admin-token', payload.token);
      setAdminToken(payload.token);
      setPassword('');
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Admin passcode was not accepted.');
    } finally {
      setAuthLoading(false);
    }
  };

  const logoutAdmin = () => {
    localStorage.removeItem('instaplaque-admin-token');
    setAdminToken('');
    setOrders([]);
    setSelectedId(null);
    setSelectedOrderDetail(null);
  };

  const updateOrder = async (orderId: string, payload: Record<string, string>) => {
    const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...adminHeaders },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Could not update order (${response.status}).`);
    setOrders((current) => current.map((order) => order.id === orderId ? data.order : order));
    setSelectedOrderDetail(data.order);
  };

  const now = new Date();
  const filteredOrders = orders
    .filter((order) => {
      const status = order.fulfilmentStatus || order.status;
      if (statusFilter === 'active') return !['dispatched', 'archived', 'cancelled', 'refunded'].includes(status);
      if (statusFilter === 'all') return true;
      return order.status === statusFilter || order.fulfilmentStatus === statusFilter;
    })
    .filter((order) => {
      const query = searchTerm.trim().toLowerCase();
      if (!query) return true;
      return [
        order.id,
        order.customerName,
        order.customerEmail,
        getPlaqueSummaryTitle(order.plaqueState, order.productTitle),
        order.inscription,
        order.shippingAddress?.postal_code,
        order.shippingAddress?.postcode,
      ].filter(Boolean).join(' ').toLowerCase().includes(query);
    })
    .sort((a, b) => {
      if (sortMode === 'oldest') return orderDate(a) - orderDate(b);
      if (sortMode === 'due') return dueDateForOrder(a).getTime() - dueDateForOrder(b).getTime();
      if (sortMode === 'status') return statusLabel(a.fulfilmentStatus || a.status).localeCompare(statusLabel(b.fulfilmentStatus || b.status));
      if (sortMode === 'value') return (b.totalPence || 0) - (a.totalPence || 0);
      return orderDate(b) - orderDate(a);
    });

  const paidOrders = orders.filter((order) => order.paymentStatus === 'paid');
  const todayOrders = paidOrders.filter((order) => sameLocalDay(new Date(orderDate(order)), now));
  const monthOrders = paidOrders.filter((order) => sameLocalMonth(new Date(orderDate(order)), now));
  const overdueOrders = orders.filter((order) => {
    const status = order.fulfilmentStatus || order.status;
    return !['dispatched', 'archived', 'cancelled', 'refunded'].includes(status) && dueDateForOrder(order).getTime() < now.getTime();
  });
  const counts = {
    paid: orders.filter((order) => order.paymentStatus === 'paid').length,
    production: orders.filter((order) => order.status === 'in_production').length,
    dispatched: orders.filter((order) => order.fulfilmentStatus === 'dispatched').length,
    emails: orders.reduce((total, order) => total + (order.emailEvents?.length || 0), 0),
    todayRevenue: todayOrders.reduce((total, order) => total + (order.totalPence || 0), 0),
    monthRevenue: monthOrders.reduce((total, order) => total + (order.totalPence || 0), 0),
    overdue: overdueOrders.length,
  };

  return (
    <div className="admin-console">
      <section className="admin-console__shell">
        <div className="admin-console__head">
          <div>
            <p>Operations</p>
            <h1>Orders</h1>
          </div>
          <div className="admin-console__head-actions">
            <span>{orders.length} orders</span>
            {authConfig?.authRequired && adminToken && (
              <button type="button" className="admin-console__ghost-button" onClick={logoutAdmin}>
                Lock
              </button>
            )}
          </div>
        </div>
        {authConfig?.authRequired && !adminToken && (
          <form className="admin-console__login" onSubmit={loginAdmin}>
            <label htmlFor="admin-passcode">{authConfig.label || 'Admin passcode'}</label>
            <div>
              <input
                id="admin-passcode"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter admin passcode"
                autoComplete="current-password"
              />
              <button type="submit" disabled={authLoading || !password.trim()}>
                {authLoading ? 'Checking...' : 'Unlock orders'}
              </button>
            </div>
          </form>
        )}
        {adminError && <div className="commerce-warning">{adminError}</div>}
        {loading && <div className="commerce-success">Loading orders...</div>}
        {authConfig?.authRequired && !adminToken ? null : (
          <>
        <div className="admin-console__stats">
          <div><span>Sold today</span><strong>{todayOrders.length}</strong><small>{formatPence(counts.todayRevenue)}</small></div>
          <div><span>This month</span><strong>{monthOrders.length}</strong><small>{formatPence(counts.monthRevenue)}</small></div>
          <div><span>In production</span><strong>{counts.production}</strong><small>{counts.dispatched} dispatched</small></div>
          <div><span>Overdue</span><strong>{counts.overdue}</strong><small>{counts.emails} email events</small></div>
        </div>
        <div className="admin-console__filters">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search order, customer, email, postcode or wording"
          />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AdminStatusFilter)}>
            <option value="active">Active orders</option>
            <option value="all">All orders</option>
            <option value="paid">Paid/new</option>
            <option value="in_production">In production</option>
            <option value="ready_to_dispatch">Ready to dispatch</option>
            <option value="dispatched">Dispatched</option>
            <option value="issue">Issue/on hold</option>
            <option value="archived">Archived</option>
          </select>
          <select value={sortMode} onChange={(event) => setSortMode(event.target.value as AdminSortMode)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="due">Due date</option>
            <option value="status">Status</option>
            <option value="value">Order value</option>
          </select>
        </div>
        <div className="admin-console__layout">
          <div className="admin-console__orders" role="list" aria-label="Orders">
            <div className="admin-console__orders-head" aria-hidden="true">
              <span>Order</span>
              <span>Source</span>
              <span>Customer</span>
              <span>Status</span>
              <span>Total</span>
            </div>
            {filteredOrders.map((order) => (
              <React.Fragment key={order.id}>
                <button className={`admin-console__order-row ${selectedOrder?.id === order.id ? 'is-active' : ''}`} onClick={() => setSelectedId(order.id)} role="listitem">
                  <span>
                    <strong>{order.id}</strong>
                    <small>{getPlaqueSummaryTitle(order.plaqueState, order.productTitle)}</small>
                  </span>
                  <span>{formatOrderSource(order)}</span>
                  <span>
                    <strong>{order.customerName || 'Customer'}</strong>
                    <small>{order.customerEmail || 'Email held by Stripe'}</small>
                  </span>
                  <span>
                    <mark>{statusLabel(order.fulfilmentStatus || order.status)}</mark>
                    <small>Due {formatShortDate(dueDateForOrder(order))}</small>
                  </span>
                  <span>{formatPence(order.totalPence, order.currency)}</span>
                </button>
                {selectedOrder?.id === order.id && (
                  <AdminDetailBoundary resetKey={`mobile-${selectedOrder.id}-${selectedOrder.updatedAt || ''}`}>
                  <article className="admin-console__detail admin-console__detail--mobile">
                    <div className="admin-console__detail-head">
                      <div>
                        <p>{formatOrderSource(selectedOrder)}</p>
                        <h2>{selectedOrder.id}</h2>
                      </div>
                      <strong>{formatPence(selectedOrder.totalPence, selectedOrder.currency)}</strong>
                    </div>
                    <div className="admin-console__proof">
                      {selectedOrder.proofPackage?.visualProofPng ? (
                        <img
                          src={`${orderProofImageUrl(selectedOrder)}?v=${encodeURIComponent(selectedOrder.updatedAt || selectedOrder.id)}`}
                          alt="Approved plaque proof"
                          className="admin-console__proof-image"
                        />
                      ) : canRenderSelectedProof ? (
                        <div className="admin-console__proof-live-preview">
                          <PlaquePreview state={selectedOrder.plaqueState} activeStep={6} inscription={selectedOrder.inscription} />
                        </div>
                      ) : storedProofSvgForOrder(selectedOrder) ? (
                        <img
                          src={storedProofSvgDataUrl(selectedOrder)}
                          alt="Stored plaque artwork"
                          className="admin-console__proof-image"
                        />
                      ) : (
                        <div className="commerce-order-proof__pending">Approved proof preview unavailable</div>
                      )}
                    </div>
                    <div className="admin-console__data-grid">
                      <div><span>Product</span><strong>{getPlaqueSummaryTitle(selectedOrder.plaqueState, selectedOrder.productTitle)}</strong></div>
                      <div><span>Customer</span><strong>{selectedOrder.customerName || 'Customer'}</strong></div>
                      <div><span>Email</span><strong>{selectedOrder.customerEmail || 'Held by Stripe'}</strong></div>
                      <div><span>Payment</span><strong>{selectedOrder.paymentStatus}</strong></div>
                      <div><span>Order status</span><strong>{statusLabel(selectedOrder.status)}</strong></div>
                      <div><span>Fulfilment</span><strong>{statusLabel(selectedOrder.fulfilmentStatus)}</strong></div>
                      <div><span>Paid</span><strong>{formatAdminDate(selectedOrder.paidAt || selectedOrder.createdAt)}</strong></div>
                      <div><span>Due</span><strong>{formatShortDate(dueDateForOrder(selectedOrder))}</strong></div>
                    </div>
                    <div className="admin-console__info-panels">
                      <section>
                        <div className="admin-console__section-head">
                          <span>Shipping address</span>
                          <button
                            type="button"
                            disabled={!addressLinesForOrder(selectedOrder).length}
                            onClick={() => navigator.clipboard?.writeText(addressLinesForOrder(selectedOrder).join('\n'))}
                          >
                            Copy
                          </button>
                        </div>
                        {addressLinesForOrder(selectedOrder).length ? (
                          <address>
                            {addressLinesForOrder(selectedOrder).map((line) => <span key={line}>{line}</span>)}
                          </address>
                        ) : (
                          <p>No shipping address stored yet.</p>
                        )}
                      </section>
                      <section>
                        <div className="admin-console__section-head">
                          <span>Stripe</span>
                        </div>
                        <p><strong>Session</strong> {selectedOrder.stripeCheckoutSessionId || 'Not linked'}</p>
                        <p><strong>Payment</strong> {selectedOrder.stripePaymentIntentId || 'Not linked'}</p>
                        <div className="admin-console__link-row">
                          {selectedOrder.stripeCheckoutSessionId && (
                            <a href={stripeDashboardUrl('checkout/sessions', selectedOrder.stripeCheckoutSessionId)} target="_blank" rel="noreferrer">Open session</a>
                          )}
                          {selectedOrder.stripePaymentIntentId && (
                            <a href={stripeDashboardUrl('payments', selectedOrder.stripePaymentIntentId)} target="_blank" rel="noreferrer">Open payment</a>
                          )}
                        </div>
                      </section>
                    </div>
                    <div className="admin-console__actions">
                      <button type="button" onClick={() => updateOrder(selectedOrder.id, { status: 'proof_check', fulfilmentStatus: 'not_started' })}>
                        Mark proof checked
                      </button>
                      <button
                        type="button"
                        disabled={!selectedOrder || !canDownloadSelectedProductionArtwork}
                        onClick={() => downloadProductionArtwork(selectedOrder)}
                      >
                        <DownloadIcon />
                        Download production artwork
                      </button>
                      <button
                        type="button"
                        disabled={!selectedOrder}
                        onClick={() => downloadOrderProofPng(selectedOrder).catch((downloadError) => {
                          console.error('Approved proof PNG download failed.', downloadError);
                          window.alert('The approved proof image is not available yet. Please try again in a few seconds.');
                        })}
                      >
                        <DownloadIcon />
                        Download approved proof
                      </button>
                      <button type="button" onClick={() => updateOrder(selectedOrder.id, { status: 'in_production', fulfilmentStatus: 'in_production', emailTemplate: 'customer-in-production' })}>
                        Mark in production + email
                      </button>
                      <button type="button" onClick={() => updateOrder(selectedOrder.id, { status: 'ready_to_dispatch', fulfilmentStatus: 'ready_to_dispatch' })}>
                        Mark ready to dispatch
                      </button>
                      <button type="button" onClick={() => updateOrder(selectedOrder.id, { status: 'dispatched', fulfilmentStatus: 'dispatched', emailTemplate: 'customer-dispatched' })}>
                        Mark dispatched + email
                      </button>
                      <button type="button" onClick={() => updateOrder(selectedOrder.id, { status: 'issue', fulfilmentStatus: 'issue' })}>
                        Put on hold
                      </button>
                    </div>
                  </article>
                  </AdminDetailBoundary>
                )}
              </React.Fragment>
            ))}
            {!filteredOrders.length && !loading && (
              <div className="admin-console__empty">
                <strong>No matching orders.</strong>
                <span>Adjust search, status or sort controls.</span>
              </div>
            )}
          </div>
          {selectedOrder && (
            <AdminDetailBoundary resetKey={`desktop-${selectedOrder.id}-${selectedOrder.updatedAt || ''}`}>
            <article className="admin-console__detail admin-console__detail--desktop">
              <div className="admin-console__detail-head">
                <div>
                  <p>{formatOrderSource(selectedOrder)}</p>
                  <h2>{selectedOrder.id}</h2>
                </div>
                <strong>{formatPence(selectedOrder.totalPence, selectedOrder.currency)}</strong>
              </div>
              <div className="admin-console__proof">
                {selectedOrder.proofPackage?.visualProofPng ? (
                  <img
                    src={`${orderProofImageUrl(selectedOrder)}?v=${encodeURIComponent(selectedOrder.updatedAt || selectedOrder.id)}`}
                    alt="Approved plaque proof"
                    className="admin-console__proof-image"
                  />
                ) : canRenderSelectedProof ? (
                  <div className="admin-console__proof-live-preview">
                    <PlaquePreview state={selectedOrder.plaqueState} activeStep={6} inscription={selectedOrder.inscription} />
                  </div>
                ) : storedProofSvgForOrder(selectedOrder) ? (
                  <img
                    src={storedProofSvgDataUrl(selectedOrder)}
                    alt="Stored plaque artwork"
                    className="admin-console__proof-image"
                  />
                ) : (
                  <div className="commerce-order-proof__pending">Approved proof preview unavailable</div>
                )}
              </div>
              <div className="admin-console__data-grid">
                <div><span>Product</span><strong>{getPlaqueSummaryTitle(selectedOrder.plaqueState, selectedOrder.productTitle)}</strong></div>
                <div><span>Customer</span><strong>{selectedOrder.customerName || 'Customer'}</strong></div>
                <div><span>Email</span><strong>{selectedOrder.customerEmail || 'Held by Stripe'}</strong></div>
                <div><span>Payment</span><strong>{selectedOrder.paymentStatus}</strong></div>
                <div><span>Order status</span><strong>{statusLabel(selectedOrder.status)}</strong></div>
                <div><span>Fulfilment</span><strong>{statusLabel(selectedOrder.fulfilmentStatus)}</strong></div>
                <div><span>Paid</span><strong>{formatAdminDate(selectedOrder.paidAt || selectedOrder.createdAt)}</strong></div>
                <div><span>Due</span><strong>{formatShortDate(dueDateForOrder(selectedOrder))}</strong></div>
              </div>
              <div className="admin-console__info-panels">
                <section>
                  <div className="admin-console__section-head">
                    <span>Shipping address</span>
                    <button
                      type="button"
                      disabled={!addressLinesForOrder(selectedOrder).length}
                      onClick={() => navigator.clipboard?.writeText(addressLinesForOrder(selectedOrder).join('\n'))}
                    >
                      Copy
                    </button>
                  </div>
                  {addressLinesForOrder(selectedOrder).length ? (
                    <address>
                      {addressLinesForOrder(selectedOrder).map((line) => <span key={line}>{line}</span>)}
                    </address>
                  ) : (
                    <p>No shipping address stored yet.</p>
                  )}
                </section>
                <section>
                  <div className="admin-console__section-head">
                    <span>Stripe</span>
                  </div>
                  <p><strong>Session</strong> {selectedOrder.stripeCheckoutSessionId || 'Not linked'}</p>
                  <p><strong>Payment</strong> {selectedOrder.stripePaymentIntentId || 'Not linked'}</p>
                  <div className="admin-console__link-row">
                    {selectedOrder.stripeCheckoutSessionId && (
                      <a href={stripeDashboardUrl('checkout/sessions', selectedOrder.stripeCheckoutSessionId)} target="_blank" rel="noreferrer">Open session</a>
                    )}
                    {selectedOrder.stripePaymentIntentId && (
                      <a href={stripeDashboardUrl('payments', selectedOrder.stripePaymentIntentId)} target="_blank" rel="noreferrer">Open payment</a>
                    )}
                  </div>
                </section>
              </div>
              <div className="admin-console__actions">
                <button type="button" onClick={() => updateOrder(selectedOrder.id, { status: 'proof_check', fulfilmentStatus: 'not_started' })}>
                  Mark proof checked
                </button>
                <button
                  type="button"
                  disabled={!selectedOrder || !canDownloadSelectedProductionArtwork}
                  onClick={() => downloadProductionArtwork(selectedOrder)}
                >
                  <DownloadIcon />
                  Download production artwork
                </button>
                <button
                  type="button"
                  disabled={!selectedOrder}
                  onClick={() => downloadOrderProofPng(selectedOrder).catch((downloadError) => {
                    console.error('Approved proof PNG download failed.', downloadError);
                    window.alert('The approved proof image is not available yet. Please try again in a few seconds.');
                  })}
                >
                  <DownloadIcon />
                  Download approved proof
                </button>
                <button type="button" onClick={() => updateOrder(selectedOrder.id, { status: 'in_production', fulfilmentStatus: 'in_production', emailTemplate: 'customer-in-production' })}>
                  Mark in production + email
                </button>
                <button type="button" onClick={() => updateOrder(selectedOrder.id, { status: 'ready_to_dispatch', fulfilmentStatus: 'ready_to_dispatch' })}>
                  Mark ready to dispatch
                </button>
                <button type="button" onClick={() => updateOrder(selectedOrder.id, { status: 'dispatched', fulfilmentStatus: 'dispatched', emailTemplate: 'customer-dispatched' })}>
                  Mark dispatched + email
                </button>
                <button type="button" onClick={() => updateOrder(selectedOrder.id, { status: 'issue', fulfilmentStatus: 'issue' })}>
                  Put on hold
                </button>
                <button type="button" onClick={() => updateOrder(selectedOrder.id, { status: 'archived', fulfilmentStatus: 'archived' })}>
                  Archive test/order
                </button>
                <button type="button" onClick={() => fetch(`/api/admin/orders/${encodeURIComponent(selectedOrder.id)}/emails`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...adminHeaders },
                  body: JSON.stringify({ template: 'customer-review-request' }),
                }).then(loadOrders)}>
                  Send review follow-up
                </button>
                <button type="button" onClick={() => fetch(`/api/admin/orders/${encodeURIComponent(selectedOrder.id)}/emails`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...adminHeaders },
                  body: JSON.stringify({ template: 'customer-order-confirmation' }),
                }).then(loadOrders)}>
                  Resend confirmation
                </button>
              </div>
              <div className="admin-console__timeline">
                {(selectedOrder.events || []).map((event, index) => (
                  <div key={`${event.type}-${event.at}-${index}`}>
                    <strong>{event.label}</strong>
                    <span>{event.at ? new Date(event.at).toLocaleString('en-GB') : ''}</span>
                  </div>
                ))}
              </div>
            </article>
            </AdminDetailBoundary>
          )}
        </div>
        {selectedOrder && canRenderSelectedProof && (
          <div className="admin-console__export-source" aria-hidden="true">
            <PlaquePreview ref={adminProofSvgRef} state={selectedOrder.plaqueState} activeStep={6} inscription={selectedOrder.inscription} />
          </div>
        )}
          </>
        )}
      </section>
    </div>
  );
}

function LegalPlaceholderPage({ view }: { view: SiteView }) {
  const page = legalPages[view] ?? legalPages.contact;
  if (!page) return null;

  return (
    <div className="commerce-page">
      <section className="commerce-section commerce-legal-page">
        <div className="commerce-section__head">
          <p className="commerce-eyebrow">{page.eyebrow}</p>
          <h1>{page.title}</h1>
          <p>{page.intro}</p>
        </div>
        <div className="commerce-legal-grid">
          {page.sections.map((section) => (
            <article className="commerce-legal-card" key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.copy}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function SocialLogo({ type }: { type: FooterSocial }) {
  if (type === 'facebook') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14.2 8.1V6.7c0-.7.5-1.1 1.2-1.1h1.7V2.8c-.8-.1-1.7-.2-2.6-.2-2.6 0-4.3 1.5-4.3 4.1v1.4H7.5v3.2h2.7v8.1h3.4v-8.1H16l.5-3.2h-2.3Z" />
      </svg>
    );
  }
  if (type === 'pinterest') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12.1 2.6c-5.1 0-7.7 3.4-7.7 6.6 0 1.9 1 4.2 2.6 4.9.3.1.5 0 .6-.3l.4-1.5c.1-.2 0-.4-.1-.6-.5-.6-.8-1.4-.8-2.3 0-2.8 2.1-5.4 5.7-5.4 3.1 0 5 1.9 5 4.6 0 3.1-1.6 5.8-4 5.8-1.2 0-2.1-1-1.8-2.2.3-1.4 1-2.9 1-3.9 0-.9-.5-1.7-1.5-1.7-1.2 0-2.2 1.3-2.2 3 0 1.1.4 1.8.4 1.8l-1.5 6.2c-.3 1.3 0 3 .1 3.1.1.1.2.1.3 0 .1-.1 1.7-2.2 2-3.5l.7-2.7c.5.9 1.6 1.6 2.9 1.6 3.8 0 6.4-3.4 6.4-7.6 0-3.3-2.8-6.5-7.2-6.5Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.4" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17" cy="7" r="1.1" />
    </svg>
  );
}

function CommerceFooter({ onNavigate }: Pick<SiteProps, 'onNavigate'>) {
  return (
    <footer className="commerce-footer">
      <div className="commerce-footer__brand">
        <strong className="brand-wordmark brand-wordmark--footer">
          <span>Insta</span><span>Plaque</span>
        </strong>
        <p>{businessContact.tradingName} is operated as a UK sole trader. Business address: {businessContact.address}. Email: {businessContact.email}. Not VAT registered.</p>
      </div>
      <div className="commerce-footer__right">
        <div className="commerce-footer-socials" aria-label="Social links">
          {footerSocials.map((social) => (
            <button key={social.id} type="button" aria-label={`${social.label} link placeholder`} title={`${social.label} link placeholder`}>
              <SocialLogo type={social.id} />
            </button>
          ))}
        </div>
        <img
          className="commerce-footer-payment-badge"
          src="/site-images/powered-by-stripe-white.svg"
          alt="Powered by Stripe"
          loading="lazy"
        />
        <nav className="commerce-footer-legal" aria-label="Legal pages">
          {footerLinks.map((link) => (
            <button key={link.view} type="button" onClick={() => onNavigate(link.view)}>
              {link.label}
            </button>
          ))}
        </nav>
      </div>
    </footer>
  );
}

export function SiteExperience(props: SiteProps) {
  useSeoMeta(props.view, props.selectedProduct);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.querySelector('main')?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [props.view, props.selectedProduct.slug]);

  let page: React.ReactNode;

  if (props.view === 'product') {
    page = <ProductPage selectedProduct={props.selectedProduct} onLaunchProduct={props.onLaunchProduct} />;
  } else if (props.view === 'materials') {
    page = <MaterialsPage />;
  } else if (props.view === 'how') {
    page = <HowItWorksPage />;
  } else if (props.view === 'faq') {
    page = <FaqPage />;
  } else if (props.view === 'quote') {
    page = <QuotePage onLaunchProduct={props.onLaunchProduct} />;
  } else if (props.view === 'checkout') {
    page = (
      <CheckoutPage
        state={props.state}
        inscription={props.inscription}
        selectedProduct={props.selectedProduct}
        isProductionReady={props.isProductionReady}
        onCreateMockOrder={props.onCreateMockOrder}
        onNavigate={props.onNavigate}
      />
    );
  } else if (props.view === 'order-confirmed') {
    page = <OrderConfirmedPage onNavigate={props.onNavigate} />;
  } else if (props.view === 'admin') {
    page = <AdminPage />;
  } else if (legalPages[props.view]) {
    page = <LegalPlaceholderPage view={props.view} />;
  } else {
    page = <HomePage onNavigate={props.onNavigate} onStartDesign={props.onStartDesign} onLaunchProduct={props.onLaunchProduct} />;
  }

  if (props.view === 'admin') {
    return <>{page}</>;
  }

  return (
    <>
      {page}
      <CommerceFooter onNavigate={props.onNavigate} />
    </>
  );
}
