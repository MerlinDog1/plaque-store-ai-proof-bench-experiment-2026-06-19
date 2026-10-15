export const META_PIXEL_ID = '2766586460430567';
export const META_CONSENT_KEY = 'instaplaque-meta-consent';
export const OPTIONAL_AD_CONSENT_CHANGED = 'instaplaque:optional-ad-consent-changed';
type Pixel = ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue: unknown[][]; loaded: boolean; version: string; push?: Pixel };
declare global { interface Window { fbq?: Pixel; _fbq?: Pixel } }
let initialized = false;
const tracked = new Set<string>();
export function metaConsent(): string | null {
  try { return localStorage.getItem(META_CONSENT_KEY); } catch { return null; }
}
export function safeMetaPage(): boolean {
  const url = new URL(location.href);
  return !/admin|proof|order|success|payment|receipt/i.test(url.pathname) && !url.hash &&
    [...url.searchParams.keys()].every(key => /^(view|utm_source|utm_medium|utm_campaign|utm_content|utm_term|fbclid|gclid)$/.test(key)) &&
    !/admin|proof|order|success/i.test(url.searchParams.get('view') || '') &&
    (!document.referrer || (() => { try { const r = new URL(document.referrer); return !r.search && !/proof|order|admin|receipt/i.test(r.pathname); } catch { return false; } })());
}
export function enableMeta(): boolean {
  if (metaConsent() !== 'yes' || !safeMetaPage()) return false;
  if (initialized) return true;
  if (!window.fbq) {
    const q = function (...args: unknown[]) { if (q.callMethod) q.callMethod(...args); else q.queue.push(args); } as Pixel;
    q.queue = []; q.loaded = true; q.version = '2.0'; q.push = q;
    window.fbq = q; window._fbq = q;
    const script = document.createElement('script'); script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }
  window.fbq('consent', 'grant');
  window.fbq('set', 'autoConfig', false, META_PIXEL_ID);
  window.fbq('init', META_PIXEL_ID);
  window.fbq('trackSingle', META_PIXEL_ID, 'PageView');
  initialized = true;
  return true;
}
export function setMetaConsent(allow: boolean): void {
  try { localStorage.setItem(META_CONSENT_KEY, allow ? 'yes' : 'no'); } catch { /* Fail closed. */ }
  if (allow) enableMeta(); else { window.fbq?.('consent', 'revoke'); initialized = false; }
  window.dispatchEvent?.(new Event(OPTIONAL_AD_CONSENT_CHANGED));
}
export function trackMetaCheckout(order: { total: number; stripeSimulation: { provider: string; mode: string; checkoutSessionId: string; checkoutUrl?: string; embeddedClientSecret?: string } }): boolean {
  const s = order.stripeSimulation;
  if (s.provider !== 'stripe' || s.mode !== 'live' || !s.checkoutSessionId || !(s.checkoutUrl || s.embeddedClientSecret) || !Number.isFinite(order.total) || order.total <= 0) return false;
  if (tracked.has(s.checkoutSessionId) || !enableMeta()) return false;
  tracked.add(s.checkoutSessionId);
  window.fbq?.('trackSingle', META_PIXEL_ID, 'InitiateCheckout', { currency: 'GBP', value: order.total, num_items: 1 });
  return true;
}
