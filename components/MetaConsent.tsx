import React, { useEffect, useState } from 'react';
import { enableMeta, metaConsent, setMetaConsent } from '../services/metaPixel';
import { analyticsConsent, setAnalyticsConsent } from '../services/posthogAnalytics';
export function MetaConsent() {
  const [open, setOpen] = useState(() => metaConsent() === null || analyticsConsent() === null);
  useEffect(() => { enableMeta(); }, []);
  const choose = (allow: boolean) => { setAnalyticsConsent(allow); setMetaConsent(allow); setOpen(false); };
  if (!open) return window.location.pathname === '/cookies'
    ? <button type="button" onClick={() => setOpen(true)}>Cookie settings</button>
    : null;
  return <section role="dialog" aria-label="Cookie preferences" className="cookie-banner">
    {/* Shorter since 30 Oct 2026 (owner msg 8065 review): on a phone the old three-sentence notice covered a product
        page's price and buttons. One short sentence keeps the purposes, the recordings (so analytics consent given here
        still covers them: REPLAY_CONSENT_KEY in services/posthogAnalytics.ts) and the link to the full details and settings; it is too small to outweigh the page's own heading as the Largest Contentful Paint. */}
    <p><span className="cookie-banner-line"><strong>Cookies:</strong> may we use optional analytics cookies, which record how pages and the designer are used (typing hidden), and ad cookies? <a href="/cookies">Details and settings</a></span></p>
    <div className="cookie-banner-actions">
      <button type="button" onClick={() => choose(true)}>Accept</button>
      <button type="button" onClick={() => choose(false)}>Reject</button>
    </div>
  </section>;
}
