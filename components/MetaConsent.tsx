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
    {/* Combined preview (31 Oct 2026, owner go msg 8314): as short as the notice before visit counting, still naming
        the recordings (analytics consent covers them: REPLAY_CONSENT_KEY in services/posthogAnalytics.ts), the ad
        cookies, the anonymous count after Reject and the settings page where statistics can be turned off.
        Slim bar (review fix, 1 Nov 2026, owner msg 8437): one row with Accept and Reject side by side, at most 64 px
        tall on a phone, clear of the page's H1, its first products and the Design/WhatsApp/Email bar (shopfront.css).
        Phones show the short line; the Settings page (/cookies) explains the anonymous count in full. Consent is
        unchanged: Accept and Reject stay the first and second buttons (scripts/finalise-public-html.mjs). */}
    <p><span className="cookie-banner-full"><strong>Cookies:</strong> may we use analytics cookies, which record how the site is used (typing hidden), and ad cookies? We count visits anonymously even if you Reject.</span><span className="cookie-banner-short"><strong>Cookies:</strong> allow analytics that record site use, and ads?</span> <a href="/cookies">Settings</a></p>
    <div className="cookie-banner-actions">
      <button type="button" onClick={() => choose(true)}>Accept</button>
      <button type="button" onClick={() => choose(false)}>Reject</button>
    </div>
  </section>;
}
