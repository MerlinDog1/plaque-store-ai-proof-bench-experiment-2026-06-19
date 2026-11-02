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
    {/* The live slim bar and wording, a little bigger (owner msg 9143). Accept/Reject use the live functions and
        static fallback. The separate anonymous visit statistics are explained, and can be switched off, on /cookies
        (the Settings link); they never grant optional analytics or advertising consent. */}
    <p><span className="cookie-banner-full"><strong>Cookies:</strong> may we use optional analytics cookies, which record how pages and the designer are used (typing hidden), and ad cookies?</span><span className="cookie-banner-short"><strong>Cookies:</strong> allow analytics that record site use, and ads?</span> <a href="/cookies">Settings</a></p>
    <div className="cookie-banner-actions">
      <button type="button" onClick={() => choose(true)}>Accept</button>
      <button type="button" onClick={() => choose(false)}>Reject</button>
    </div>
  </section>;
}
