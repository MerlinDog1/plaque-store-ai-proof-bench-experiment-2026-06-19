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
    <p><span className="cookie-banner-line"><strong>Cookies:</strong> may we use optional analytics cookies, which record how pages and the designer are used (typing hidden), and ad cookies? Separately, we count visits anonymously to improve the site, even if you Reject. Turn statistics off in <a href="/cookies">Details and settings</a>.</span></p>
    <div className="cookie-banner-actions">
      <button type="button" onClick={() => choose(true)}>Accept</button>
      <button type="button" onClick={() => choose(false)}>Reject</button>
    </div>
  </section>;
}
