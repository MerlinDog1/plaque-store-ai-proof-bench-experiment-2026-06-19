import { isInternalBrowser, metaConsent } from './metaPixel';

// Meta purchase measurement for paid live orders (owner msgs 7126/7132, 28 Oct 2026: Facebook ads need to see sales).
// Same shape as services/googlePurchase.ts: the private order page never loads the pixel. A same-origin, event-only frame
// (/meta-purchase.html) sends one Purchase with the value and currency, keyed by a digest of the order ID, so Meta never
// receives the order URL, raw order ID, Stripe session, inscription or customer fields.

type PurchaseOrder = {
  id: string;
  paymentStatus: string;
  totalPence: number;
  currency: string;
  stripeCheckoutSessionId?: string;
  metadata?: Record<string, unknown>;
};

// These are measurement queues, not proof that Meta received a conversion.
const queued = new Set<string>();
const pending = new Map<string, Promise<boolean>>();
const storagePrefix = 'instaplaque-meta-purchase-v1:';

function validCheckoutReturn(order: PurchaseOrder): boolean {
  // Advertising consent only; the owner's own browsers (?internal=on) never report purchases.
  if (typeof window === 'undefined' || metaConsent() !== 'yes' || isInternalBrowser()) return false;
  const url = new URL(window.location.href);
  return ['instaplaque.co.uk', 'www.instaplaque.co.uk'].includes(url.hostname)
    && url.protocol === 'https:'
    && url.pathname === '/order-confirmed'
    && url.searchParams.get('order') === order.id
    && url.searchParams.get('session_id') === order.stripeCheckoutSessionId
    && /^cs_live_[A-Za-z0-9]+$/.test(order.stripeCheckoutSessionId || '')
    && order.paymentStatus === 'paid'
    && !order.metadata?.checkoutTestPolicy
    && !order.metadata?.liveVerificationPolicy
    && !order.metadata?.noFulfilment
    && typeof order.id === 'string' && order.id.length > 0 && order.id.length <= 200
    && Number.isSafeInteger(order.totalPence) && order.totalPence > 0
    && typeof order.currency === 'string' && order.currency.toUpperCase() === 'GBP';
}

async function queuePurchase(order: PurchaseOrder): Promise<boolean> {
  const digest = await window.crypto.subtle.digest('SHA-256',
    new TextEncoder().encode(`instaplaque:meta:purchase:${order.id}`));
  const eventId = 'ip_' + Array.from(new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, '0')).join('');
  const storageKey = storagePrefix + eventId;
  if (queued.has(eventId)) return false;
  try { if (localStorage.getItem(storageKey)) return false; } catch { /* In-memory and Meta event_id dedupe remain. */ }
  if (!validCheckoutReturn(order)) return false;

  const accepted = await new Promise<boolean>((resolve) => {
    const frame = document.createElement('iframe');
    frame.hidden = true;
    frame.title = 'Purchase measurement';
    frame.tabIndex = -1;
    frame.setAttribute('aria-hidden', 'true');
    frame.referrerPolicy = 'no-referrer';
    // No customer data in the frame URL or referrer.
    frame.src = '/meta-purchase.html';
    let finished = false;
    const finish = (ok: boolean) => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timer);
      window.removeEventListener('message', receive);
      frame.remove();
      resolve(ok);
    };
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.contentWindow) return;
      if (event.data?.type !== 'instaplaque:meta-purchase-result' || event.data.eventId !== eventId) return;
      finish(event.data.queued === true);
    };
    const timer = window.setTimeout(() => finish(false), 15000);
    window.addEventListener('message', receive);
    frame.onload = () => {
      if (!validCheckoutReturn(order)) return finish(false);
      frame.contentWindow?.postMessage({
        type: 'instaplaque:meta-purchase', eventId,
        value: order.totalPence / 100, currency: 'GBP',
      }, window.location.origin);
    };
    frame.onerror = () => finish(false);
    document.body.appendChild(frame);
  });

  if (accepted) {
    queued.add(eventId);
    try { localStorage.setItem(storageKey, 'queued'); } catch { /* Storage denial must not break checkout. */ }
  }
  return accepted;
}

export function trackMetaPurchase(order: PurchaseOrder): Promise<boolean> {
  if (!validCheckoutReturn(order)) return Promise.resolve(false);
  const previous = pending.get(order.id);
  if (previous) return previous;
  const task = queuePurchase(order).catch(() => false).finally(() => pending.delete(order.id));
  pending.set(order.id, task);
  return task;
}
