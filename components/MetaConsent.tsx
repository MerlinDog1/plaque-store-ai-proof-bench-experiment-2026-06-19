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
    {/* Presentation only: Accept/Reject retain the live consent functions and static fallback.
        The separate statistics choice lives on /cookies and never grants optional consent. */}
    <p>
      <span className="cookie-banner-full">
        <span className="cookie-banner-question">May we use optional analytics cookies to record how pages and the designer are used (typing hidden), and ad cookies?</span>
        <span>We count visits anonymously to improve the site, even if you Reject. Turn this off in <a href="/cookies">Settings</a>.</span>
      </span>
      <span className="cookie-banner-short">
        <span className="cookie-banner-question">Allow site-use recording (typing hidden) &amp; ad cookies?</span>
        <span>Visits counted anonymously even if you Reject. Off: <a href="/cookies">Settings</a>.</span>
      </span>
    </p>
    <div className="cookie-banner-actions">
      <button type="button" onClick={() => choose(true)}>Accept</button>
      <button type="button" onClick={() => choose(false)}>Reject</button>
    </div>
  </section>;
}
