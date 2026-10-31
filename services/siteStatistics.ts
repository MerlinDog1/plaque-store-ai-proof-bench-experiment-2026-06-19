import { inject, pageview, type BeforeSendEvent } from '@vercel/analytics';
import { redactAnalyticsEvent } from './analyticsPrivacy.mjs';
import { isInternalBrowser } from './metaPixel';

// This objection is independent of optional analytics/advertising consent.
export const STATISTICS_KEY = 'instaplaque-statistics-v1';
export const STATISTICS_CHANGED = 'instaplaque:statistics-changed';
let unsavedChoice: boolean | undefined;

export function statisticsEnabled(): boolean {
  if (unsavedChoice !== undefined) return unsavedChoice;
  if (typeof window === 'undefined') return true; // Static settings markup.
  try { return localStorage.getItem(STATISTICS_KEY) !== 'no'; }
  catch { return false; } // Do not count if a saved objection cannot be read.
}

// Returns whether the choice could be saved. Even blocked storage cannot prevent
// an objection taking effect immediately in this document.
export function setStatisticsEnabled(enabled: boolean): boolean {
  unsavedChoice = enabled;
  let saved = false;
  try {
    localStorage.setItem(STATISTICS_KEY, enabled ? 'yes' : 'no');
    unsavedChoice = undefined;
    saved = true;
  } catch { /* Keep the choice in memory and tell the visitor it was not saved. */ }
  window.dispatchEvent(new Event(STATISTICS_CHANGED));
  return saved;
}

function statisticsHost(): boolean {
  const { hostname, protocol } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
  return protocol === 'https:' && (hostname === 'instaplaque.co.uk' || hostname === 'www.instaplaque.co.uk'
    || /^instaplaque-[a-z0-9-]+-dullaghan31-3959s-projects\.vercel\.app$/.test(hostname));
}

export function statisticsBeforeSend(event: BeforeSendEvent): BeforeSendEvent | null {
  if (!statisticsEnabled() || !statisticsHost() || isInternalBrowser() || event.type !== 'pageview') return null;
  // Page totals only: no custom events, identity, traits, flags or ad-click IDs.
  return redactAnalyticsEvent({ type: 'pageview', url: event.url });
}

let listening = false;
let injected = false;
let wasEnabled = false;
export function startSiteStatistics(): void {
  if (typeof window === 'undefined' || listening) return;
  listening = true;
  const update = () => {
    const enabled = statisticsEnabled() && statisticsHost() && !isInternalBrowser();
    if (enabled && !injected) {
      injected = true;
      inject({ beforeSend: statisticsBeforeSend });
    } else if (enabled && !wasEnabled) {
      pageview({}); // Turning counting back on counts this page, not earlier pages.
    }
    wasEnabled = enabled;
  };
  window.addEventListener(STATISTICS_CHANGED, update);
  window.addEventListener('storage', event => {
    if (event.key === STATISTICS_KEY || event.key === null) update();
  });
  update();
  // beforeSend reads the choice again for EVERY event, including after script
  // loading, SPA navigation and objections from another tab. Removing a script
  // element alone would not stop the listeners it has already installed.
}
