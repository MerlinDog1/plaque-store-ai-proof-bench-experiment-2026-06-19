import React, { useEffect, useState } from 'react';
import { enableMeta, metaConsent, setMetaConsent } from '../services/metaPixel';
export function MetaConsent() {
  const [open, setOpen] = useState(() => metaConsent() === null);
  useEffect(() => { enableMeta(); }, []);
  const choose = (allow: boolean) => { setMetaConsent(allow); setOpen(false); };
  if (!open) return window.location.pathname === '/cookies'
    ? <button type="button" onClick={() => setOpen(true)}>Cookie settings</button>
    : null;
  return <section role="dialog" aria-label="Cookie preferences" style={{ position: 'fixed', bottom: 16, left: 16, right: 16, maxWidth: 520, margin: '0 auto', zIndex: 1000, padding: '20px 24px', borderRadius: 12, boxShadow: '0 4px 28px #0003', background: '#f6f4ed', color: '#203b32', border: '1px solid #ccc' }}>
    <strong>Cookies</strong>
    <p style={{ margin: '8px 0 16px' }}>We use optional advertising cookies to measure how our ads perform. You can accept or reject them. <a href="/cookies" style={{ textDecoration: 'underline' }}>Cookie details</a>.</p>
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <button type="button" onClick={() => choose(true)} style={{ padding: '10px 18px', border: '1px solid #203b32', borderRadius: 4 }}>Accept</button>
      <button type="button" onClick={() => choose(false)} style={{ padding: '10px 18px', border: '1px solid #203b32', borderRadius: 4 }}>Reject</button>
    </div>
  </section>;
}
