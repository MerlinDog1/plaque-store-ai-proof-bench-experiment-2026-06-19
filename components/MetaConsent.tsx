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
    {/* The live slim bar, a little bigger (owner msg 9143), with the owner's plainer wording (msg 9503, 3 Nov 2026:
        no "record" in the bar). Accept/Reject use the live functions and static fallback. Session replay is still
        explained in full on /cookies (the Settings link), as are the separate anonymous visit statistics, which can be
        switched off there and never grant optional analytics or advertising consent. */}
    <p><span className="cookie-banner-full"><strong>Cookies:</strong> may we use optional analytics and ad cookies to improve the site and our ads?</span><span className="cookie-banner-short"><strong>Cookies:</strong> OK to use analytics and ad cookies?</span> <a href="/cookies">Settings</a></p>
    <div className="cookie-banner-actions">
      <button type="button" onClick={() => choose(true)}>Accept</button>
      <button type="button" onClick={() => choose(false)}>Reject</button>
    </div>
  </section>;
}
