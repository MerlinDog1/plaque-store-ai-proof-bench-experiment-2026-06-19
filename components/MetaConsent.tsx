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
    <strong>Cookies</strong>
    {/* One span per sentence: on phones each is its own line (shopfront-a11y.css), so no single text block outweighs the
        page's own heading as the Largest Contentful Paint. The wording is unchanged. */}
    <p><span className="cookie-banner-line">We use optional analytics and advertising cookies and storage to understand visits, use of the designer and how our ads perform.</span>{' '}
      <span className="cookie-banner-line">With analytics, we also record how pages and the designer are used, with anything you type hidden.</span>{' '}
      <span className="cookie-banner-line">You can accept or reject them, and change your choice later in Cookie settings. <a href="/cookies">Cookie details</a>.</span></p>
    <div className="cookie-banner-actions">
      <button type="button" onClick={() => choose(true)}>Accept</button>
      <button type="button" onClick={() => choose(false)}>Reject</button>
    </div>
  </section>;
}
