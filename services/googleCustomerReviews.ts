import { isInternalBrowser } from './metaPixel';
import { getProductionEstimate } from './productionTime.mjs';

// Google Customer Reviews (owner msg 6658, 26 Oct 2026: "Collect reviews after each delivery, through Google Customer
// Reviews - can you set this up?"). Once an order is paid, the order confirmation page shows Google's opt-in box; a
// customer who says yes gets a short survey from Google after the estimated delivery date. Their answers feed the store
// rating Google shows on ads and Shopping. Google requires the box for every customer after checkout, so it does not
// wait for cookie consent; the privacy and cookie policies describe it.
export const GCR_MERCHANT_ID = 5859684800;
export const GCR_SCRIPT = 'https://apis.google.com/js/platform.js?onload=renderOptIn';

// The plaque's production estimate (the one shown before checkout), then the 1 working day of delivery that checkout
// and Merchant Center promise, then 2 more working days, so the survey doesn't arrive before the plaque when dispatch or
// the post runs a little late. Bank holidays aren't counted; the 2 days cover them.
const DELIVERY_WORKING_DAYS = 1;
const SPARE_WORKING_DAYS = 2;
// The box belongs to the moment of purchase. People reopening this page later from their order email aren't asked again.
const OFFER_HOURS = 48;

type ReviewOrder = {
  id: string;
  paymentStatus: string;
  customerEmail?: string;
  plaqueState?: Parameters<typeof getProductionEstimate>[0] | null;
  shippingAddress?: Record<string, string>;
  metadata?: Record<string, unknown>;
  paidAt?: string;
  createdAt?: string;
};

export type GcrOptIn = {
  merchant_id: number;
  order_id: string;
  email: string;
  delivery_country: string;
  estimated_delivery_date: string;
};

type GcrWindow = Window & {
  gapi?: { load: (name: string, callback: () => void) => void; surveyoptin?: { render: (options: GcrOptIn) => void } };
  renderOptIn?: () => void;
  ___gcfg?: Record<string, unknown>;
};

const londonDate = (time: number) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date(time));

const productionDays = (order: ReviewOrder) => {
  const recorded = Number(order.metadata?.turnaroundWorkingDays || 0);
  if (Number.isFinite(recorded) && recorded > 0) return Math.round(recorded);
  return order.plaqueState ? getProductionEstimate(order.plaqueState).days : 5;
};

/** The day after which Google may send the survey, YYYY-MM-DD in UK time, counting Monday to Friday from the payment day. */
export function gcrEstimatedDeliveryDate(order: ReviewOrder): string {
  const paid = Date.parse(order.paidAt || order.createdAt || '');
  const [year, month, day] = londonDate(Number.isFinite(paid) ? paid : Date.now()).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  let remaining = productionDays(order) + DELIVERY_WORKING_DAYS + SPARE_WORKING_DAYS;
  while (remaining > 0) {
    date.setUTCDate(date.getUTCDate() + 1);
    if (date.getUTCDay() !== 0 && date.getUTCDay() !== 6) remaining -= 1;
  }
  return date.toISOString().slice(0, 10);
}

/** What the box needs for a paid customer order, or null when it shouldn't be shown. */
export function gcrOptInFor(order: ReviewOrder | null | undefined, now = Date.now()): GcrOptIn | null {
  if (!order || order.paymentStatus !== 'paid') return null;
  // The owner's test payments and orders that won't be made never ask for a review.
  if (order.metadata?.checkoutTestPolicy || order.metadata?.liveVerificationPolicy || order.metadata?.noFulfilment) return null;
  const email = String(order.customerEmail || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  const paid = Date.parse(order.paidAt || order.createdAt || '');
  if (!Number.isFinite(paid) || now - paid > OFFER_HOURS * 60 * 60 * 1000) return null;
  const country = String(order.shippingAddress?.country || '').toUpperCase();
  return {
    merchant_id: GCR_MERCHANT_ID,
    order_id: order.id,
    email,
    delivery_country: /^[A-Z]{2}$/.test(country) ? country : 'GB',
    estimated_delivery_date: gcrEstimatedDeliveryDate(order),
  };
}

const offered = new Set<string>();

/** Shows Google's opt-in box once per order and page visit. Returns whether it was asked to show. */
export function offerGoogleCustomerReviews(order: ReviewOrder | null | undefined): boolean {
  // The owner's own browsers (?internal=on) aren't customers, and Google doesn't allow reviews of your own shop.
  if (typeof window === 'undefined' || isInternalBrowser()) return false;
  const optIn = gcrOptInFor(order);
  if (!optIn || offered.has(optIn.order_id)) return false;
  offered.add(optIn.order_id);
  const win = window as GcrWindow;
  win.___gcfg = { ...(win.___gcfg || {}), lang: 'en-GB' };
  const render = () => win.gapi?.load('surveyoptin', () => win.gapi?.surveyoptin?.render(optIn));
  if (win.gapi?.load) {
    render();
    return true;
  }
  win.renderOptIn = render;
  if (!document.querySelector(`script[src="${GCR_SCRIPT}"]`)) {
    const script = document.createElement('script');
    script.src = GCR_SCRIPT;
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }
  return true;
}
