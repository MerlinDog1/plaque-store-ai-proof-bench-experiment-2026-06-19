import { productFamilies, seoLandingPages } from './commerce';
import { OPTIONAL_AD_CONSENT_CHANGED, isInternalBrowser, metaConsent } from './metaPixel';
import { businessContact } from './shopInformation';

// Public ingestion token, NOT a personal/API management credential.
const projectToken = 'phc_txLFAUv88ttyLLTKgi3arQ7428Jy5XSQEtGFm6jYrYxJ';
export const ANALYTICS_CONSENT_KEY = 'instaplaque-analytics-consent-v1';
// Session recordings (owner msg 6565, 26 Oct 2026): only for visitors who accepted analytics once the cookie notice
// and policies described recordings. An earlier "yes" stays analytics-only until the visitor accepts again.
export const REPLAY_CONSENT_KEY = 'instaplaque-replay-consent-v1';
// Sent whenever analytics consent changes, so the session recorder can start or stop with it.
export const ANALYTICS_STATE_CHANGED = 'instaplaque:analytics-state-changed';
const sessionKey = 'instaplaque-analytics-session-v1';
const purchasesKey = 'instaplaque-analytics-purchases-v1';
const qaKey = 'instaplaque-analytics-qa';
const hosts = new Set(['instaplaque.co.uk', 'www.instaplaque.co.uk']);
const products = new Set(productFamilies.map(product => product.slug));
const publicPaths = new Set(['/', '/design', '/design-request', '/about', '/materials', '/how-it-works', '/faq', '/quote', '/contact', '/terms', '/privacy', '/cookies', '/returns-and-cancellations', '/portrait-plaques', '/ai-plaque-design', '/video',
  ...productFamilies.map(product => `/${product.slug}`), ...seoLandingPages.map(page => `/${page.slug}`)]);
const events = new Set(['visit', 'page_viewed', 'product_viewed', 'designer_started', 'designer_step_viewed', 'wording_started',
  'layout_requested', 'layout_generated', 'layout_failed', 'proof_download_requested', 'proof_download_prepared', 'proof_download_failed',
  'proof_saved', 'proof_email_requested', 'proof_emailed', 'proof_email_failed', 'checkout_requested', 'checkout_started', 'checkout_failed', 'purchase_completed',
  'enquiry_started', 'enquiry_reviewed', 'enquiry_submission_requested', 'enquiry_submitted', 'enquiry_failed', 'contact_clicked', 'price_viewed']);
// These are observations of the funnel, not confirmed leads or purchases.
// Account-side Ads conversion settings must keep contact taps secondary.
const googleFunnelEvents = new Set(['designer_started', 'designer_step_viewed', 'wording_started', 'price_viewed',
  'layout_requested', 'layout_generated', 'layout_failed', 'proof_download_requested', 'proof_download_prepared', 'proof_download_failed',
  'proof_saved', 'proof_email_requested', 'proof_emailed', 'proof_email_failed', 'checkout_requested', 'checkout_started', 'checkout_failed',
  'enquiry_started', 'enquiry_reviewed', 'enquiry_submission_requested', 'enquiry_submitted', 'enquiry_failed', 'contact_clicked']);
type Properties = Record<string, string | number | boolean>;
declare global { interface Window { gtag?: (...args: unknown[]) => void } }
type Session = { id: string; last: number; attribution: Properties; seen: string[]; isTest: boolean };
let session: Session | undefined;
let lastPage = '';
let started = false;
const pending = new Set<AbortController>();
const pendingPurchases = new Set<string>();

export function analyticsConsent(): string | null {
  try { return localStorage.getItem(ANALYTICS_CONSENT_KEY) || (metaConsent() === 'no' ? 'no' : null); }
  catch { return null; }
}
export function setAnalyticsConsent(allow: boolean): void {
  try {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, allow ? 'yes' : 'no');
    localStorage.setItem(REPLAY_CONSENT_KEY, allow ? 'yes' : 'no');
  } catch { /* Fail closed. */ }
  consentChanged();
}
function replayConsent(): boolean {
  try { return localStorage.getItem(REPLAY_CONSENT_KEY) === 'yes'; } catch { return false; }
}
function allowed(): boolean {
  return hosts.has(location.hostname) && location.protocol === 'https:' && analyticsConsent() === 'yes';
}
/** The public page a URL shows, or null for private links (proof, order, checkout, admin) and unknown paths. */
export function publicPagePath(url: URL): string | null {
  const path = url.pathname.replace(/\/$/, '') || '/';
  // Private links never become pageviews, even if their path is normally public.
  const params = url.searchParams;
  if (['proof', 'order', 'session_id'].some(key => params.has(key))) return null;
  if (/admin|checkout|order|proof/i.test(params.get('view') || '')) return null;
  return publicPaths.has(path) ? path : null;
}
function pagePath(): string | null {
  return publicPagePath(new URL(location.href));
}
// Visit IDs are UUIDv7 (they start with their creation time), so the session recorder can use the same ID: PostHog
// accepts a recording session ID only in that form. Our ip_* events then link to the visit's recording.
function uuidv7(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const ms = Date.now();
  for (let i = 0; i < 6; i += 1) bytes[i] = Math.floor(ms / 2 ** (8 * (5 - i))) % 256;
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
function campaignLabel(value: string | null): string {
  // Campaign labels only, never click IDs, search terms, URLs or free-form text.
  return value && /^[a-z][a-z0-9_-]{0,63}$/i.test(value) ? value.toLowerCase() : '';
}
function attribution(): Properties {
  const url = new URL(location.href);
  const source = campaignLabel(url.searchParams.get('utm_source'));
  const medium = campaignLabel(url.searchParams.get('utm_medium'));
  const campaign = campaignLabel(url.searchParams.get('utm_campaign'));
  // Google auto-tagging often arrives without UTMs. Classify the presence of
  // a plausible ID, but never copy the ID into our session or event payload.
  const googleClick = ['gclid', 'gbraid', 'wbraid'].some(key => /^[A-Za-z0-9_-]{6,512}$/.test(url.searchParams.get(key) || ''));
  let referringDomain = '';
  try {
    const ref = new URL(document.referrer);
    if (['http:', 'https:'].includes(ref.protocol) && !hosts.has(ref.hostname)) referringDomain = ref.hostname;
  } catch { /* No usable referrer. */ }
  const qr = medium === 'qr' || source === 'qr';
  const inferGoogleAds = googleClick && !qr && (!source || source === 'google');
  return { source: qr ? 'tagged QR' : source || (inferGoogleAds ? 'google' : referringDomain || 'direct/unknown'),
    medium: qr ? 'qr' : medium || (inferGoogleAds ? 'cpc' : referringDomain ? 'referral' : 'direct/unknown'),
    campaign: campaign || '(none)', traffic_type: qr ? 'tagged QR' : source || medium || campaign || inferGoogleAds ? 'tagged campaign' : referringDomain ? 'referral' : 'direct/unknown' };
}
function persistSession(): void {
  try { localStorage.setItem(sessionKey, JSON.stringify(session)); } catch { /* Memory only if storage is unavailable. */ }
}
function getSession(): Session {
  const now = Date.now();
  let isTest = false;
  try { isTest = sessionStorage.getItem(qaKey) === 'yes'; } catch { /* Default to ordinary traffic. */ }
  // The owner's own browsers (?internal=on) are recorded as tests, which every saved report leaves out.
  isTest = isTest || isInternalBrowser();
  if (!session) {
    try {
      const saved = JSON.parse(localStorage.getItem(sessionKey) || 'null');
      if (saved && /^[a-f0-9-]{36}$/.test(saved.id) && Array.isArray(saved.seen) && typeof saved.last === 'number'
        && saved.attribution && typeof saved.attribution === 'object') session = saved;
    } catch { /* Ignore corrupt/old storage. */ }
  }
  if (!session || now - session.last > 30 * 60_000 || session.isTest !== isTest) {
    session = { id: uuidv7(), last: now, attribution: attribution(), seen: [], isTest };
    lastPage = '';
  }
  session.last = now;
  persistSession();
  return session;
}
function safeProperties(input: Properties): Properties {
  const result: Properties = {};
  const enums: Record<string, string[]> = {
    step: ['size', 'material', 'colour', 'fixings', 'backing', 'wording', 'review'],
    format: ['pdf', 'svg'], method: ['ai', 'manual'], channel: ['email', 'phone', 'whatsapp'],
    placement: ['hero', 'mobile_bar', 'contact', 'footer', 'page', 'designer'],
    price_context: ['starting', 'configured'],
    shape: ['rect', 'oval', 'circle', 'heart'],
    material: ['brushed-brass', 'orbital-brass-matt-lacquer', 'polished-brass', 'aged-brass', 'brushed-stainless', 'polished-stainless'],
    outcome_source: ['design_request_api', 'stripe_session_api', 'paid_order_api', 'browser_download', 'email_provider_acceptance'],
    reason: ['save_http', 'network', 'no_token'],
  };
  for (const [key, choices] of Object.entries(enums)) {
    if (typeof input[key] === 'string' && choices.includes(input[key] as string)) result[key] = input[key];
  }
  if (typeof input.product === 'string' && products.has(input.product)) result.product = input.product;
  if (typeof input.contact_reference === 'string' && /^IP-[A-F0-9]{10}$/.test(input.contact_reference)) result.contact_reference = input.contact_reference;
  for (const key of ['width_mm', 'height_mm']) {
    if (typeof input[key] === 'number' && Number.isFinite(input[key]) && input[key] > 0 && input[key] <= 3000) result[key] = input[key];
  }
  if (typeof input.value_gbp === 'number' && Number.isFinite(input.value_gbp) && input.value_gbp > 0 && input.value_gbp < 100_000) {
    result.value_gbp = Math.round(input.value_gbp * 100) / 100; result.currency = 'GBP';
  }
  return result;
}
function device(): Properties {
  const ua = navigator.userAgent;
  const tablet = /iPad|Tablet/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  return { device_type: tablet ? 'Tablet' : /Mobi|Android/i.test(ua) ? 'Mobile' : 'Desktop',
    browser: /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Other' };
}
async function capture(event: string, properties: Properties, current: Session, uuid = crypto.randomUUID()): Promise<boolean> {
  if (!allowed()) return false;
  const controller = new AbortController(); pending.add(controller);
  const timer = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch('https://eu.i.posthog.com/i/v0/e/', {
      method: 'POST', mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer', keepalive: true,
      headers: { 'Content-Type': 'text/plain' }, signal: controller.signal,
      body: JSON.stringify({ api_key: projectToken, uuid, event: `ip_${event}`, distinct_id: current.id,
        timestamp: new Date().toISOString(), properties: {
          ...current.attribution, ...device(), ...properties, site_id: 'instaplaque', environment: 'production',
          is_test: current.isTest, schema_version: 1, consent: true, event_id: uuid,
          $session_id: current.id, $process_person_profile: false,
        } }),
    });
    return response.ok;
  } catch { return false; } // Measurement must never interrupt shopping; no retry/request storm.
  finally { window.clearTimeout(timer); pending.delete(controller); }
}
function ensureVisit(current: Session, page = pagePath() || '/order-confirmed'): void {
  if (current.seen.includes('visit')) return;
  current.seen.push('visit'); persistSession();
  void capture('visit', { page }, current);
}
export function trackSiteEvent(event: string, properties: Properties = {}, onceKey?: string): void {
  // Checkout outcomes may originate on a private recovery URL. Only the fixed
  // route label is emitted, never its parameters, order or payment references.
  const page = pagePath() || (location.pathname === '/checkout' && ['checkout_requested', 'checkout_started', 'checkout_failed'].includes(event) ? '/checkout' : null);
  if (!events.has(event) || !allowed() || !page) return;
  const current = getSession(); ensureVisit(current, page);
  if (onceKey && current.seen.includes(onceKey)) return;
  if (onceKey) { current.seen = [...current.seen, onceKey].slice(-200); persistSession(); }
  const safe = safeProperties(properties);
  void capture(event, { ...safe, page }, current);
  // These are GA4 funnel observations, not primary Ads conversions. Import
  // them as secondary actions in Ads after verifying the account linkage.
  if (!current.isTest && googleFunnelEvents.has(event)) {
    const checkout = event === 'checkout_started';
    try {
      window.gtag?.('event', checkout ? 'begin_checkout' : event, {
        send_to: 'G-FKP17EXNBX', site_id: 'instaplaque',
        page_location: `https://instaplaque.co.uk${page}`, page_referrer: '',
        ...safe,
        ...(checkout && typeof safe.value_gbp === 'number' ? { currency: 'GBP', value: safe.value_gbp,
          items: [{ item_id: 'custom_plaque', item_name: 'Personalised plaque', quantity: 1, price: safe.value_gbp }] } : {}),
        ...(event === 'proof_download_prepared' ? { file_format: safe.format } : {}),
      });
    } catch { /* Analytics must never interrupt shopping or opening a contact app. */ }
  }
}
export function trackSitePage(): void {
  const page = pagePath();
  if (!allowed() || !page) return;
  const current = getSession(); ensureVisit(current);
  if (lastPage === page) return;
  lastPage = page;
  void capture('page_viewed', { page }, current);
  const product = page.slice(1);
  if (products.has(product)) void capture('product_viewed', { page, product }, current);
}
/** The visit to record, or null: recordings need the recording-era consent, a public page, and not the owner's own
 * browser. QA sessions are recorded (to test it); their ip_* events are marked is_test as usual. */
export function replayVisit(): string | null {
  if (!allowed() || !replayConsent() || !pagePath() || isInternalBrowser()) return null;
  return getSession().id;
}
function consentChanged(): void {
  if (analyticsConsent() === 'yes') trackSitePage();
  else {
    pending.forEach(controller => controller.abort()); pending.clear();
    session = undefined; lastPage = '';
    try { localStorage.removeItem(sessionKey); localStorage.removeItem(purchasesKey); } catch { /* No storage access. */ }
  }
  try { window.dispatchEvent(new Event(ANALYTICS_STATE_CHANGED)); } catch { /* Recording is optional. */ }
}
export function startSiteAnalytics(): void {
  if (started) return;
  started = true;
  window.addEventListener(OPTIONAL_AD_CONSENT_CHANGED, consentChanged);
  window.addEventListener('storage', event => {
    if ([ANALYTICS_CONSENT_KEY, 'instaplaque-meta-consent', null].includes(event.key)) consentChanged();
  });
  const lastContactClick = new WeakMap<Element, number>();
  const contactClick = (event: MouseEvent): void => {
    // A middle-click is auxclick only. Other mouse buttons, cancelled navigation
    // and the second click of a double-click must not inflate contact intent.
    if ((event.type === 'click' && event.button !== 0) || (event.type === 'auxclick' && event.button !== 1)
      || event.defaultPrevented || event.detail > 1 || !allowed() || !pagePath()) return;
    const link = (event.target as Element)?.closest?.('a[href]');
    const href = link?.getAttribute('href') || '';
    // The WhatsApp QR window's own link: the contact was recorded when the window opened.
    if (!link || link.hasAttribute('data-contact-counted')) return;
    let channel = /^mailto:/i.test(href) ? 'email' : /^tel:/i.test(href) ? 'phone' : '';
    if (!channel) {
      try {
        const target = new URL(href, location.href);
        const whatsapp = new URL(businessContact.whatsappHref);
        if (target.origin === whatsapp.origin && target.pathname === whatsapp.pathname && !target.username && !target.password) channel = 'whatsapp';
      } catch { /* Not a contact link. */ }
    }
    if (!channel) return;
    const now = Date.now();
    const previous = lastContactClick.get(link);
    if (previous !== undefined && now - previous < 1000) return;
    lastContactClick.set(link, now);
    trackSiteEvent('contact_clicked', {
      channel,
      placement: link.getAttribute('data-contact-placement') || '',
      contact_reference: link.getAttribute('data-contact-reference') || '',
    });
  };
  document.addEventListener('click', contactClick);
  document.addEventListener('auxclick', contactClick);
  trackSitePage();
}

type PaidOrder = { id: string; paymentStatus: string; totalPence: number; currency: string; stripeCheckoutSessionId?: string; metadata?: Record<string, unknown> };
export async function trackPostHogPurchase(order: PaidOrder): Promise<boolean> {
  const url = new URL(location.href);
  if (!allowed() || url.pathname !== '/order-confirmed' || url.searchParams.get('order') !== order.id
    || url.searchParams.get('session_id') !== order.stripeCheckoutSessionId || !/^cs_live_[A-Za-z0-9]+$/.test(order.stripeCheckoutSessionId || '')
    || order.paymentStatus !== 'paid' || order.metadata?.checkoutTestPolicy || order.metadata?.liveVerificationPolicy
    || !Number.isSafeInteger(order.totalPence) || order.totalPence <= 0 || order.currency?.toUpperCase() !== 'GBP') return false;
  if (pendingPurchases.has(order.id)) return false;
  pendingPurchases.add(order.id);
  try {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`instaplaque:posthog:purchase:${order.id}`));
    const key = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    let paid: Record<string, number> = {};
    try { paid = JSON.parse(localStorage.getItem(purchasesKey) || '{}') || {}; } catch { /* Ignore damaged storage. */ }
    if (paid[key] || !allowed()) return false;
    const current = getSession(); ensureVisit(current);
    const accepted = await capture('purchase_completed', { page: '/order-confirmed', value_gbp: order.totalPence / 100, currency: 'GBP', outcome_source: 'paid_order_api', transaction_key: key }, current);
    if (accepted && allowed()) {
      paid[key] = Date.now();
      try { localStorage.setItem(purchasesKey, JSON.stringify(Object.fromEntries(Object.entries(paid).filter(([, at]) => Date.now() - at < 90 * 86400_000).slice(-100)))); } catch { /* In-memory guard below. */ }
    }
    if (!accepted) pendingPurchases.delete(order.id);
    return accepted;
  } catch { pendingPurchases.delete(order.id); return false; }
}
