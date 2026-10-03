import React, { useEffect, useState } from 'react';
import { enableMeta, metaConsent, setMetaConsent } from '../services/metaPixel';
export function MetaConsent() {
  const [open, setOpen] = useState(() => metaConsent() === null);
  useEffect(() => { enableMeta(); }, []);
  const choose = (allow: boolean) => { setMetaConsent(allow); setOpen(false); };
  return <section aria-label="Facebook advertising cookies" style={{ padding: '16px 24px', background: '#f6f4ed', color: '#203b32', borderTop: '1px solid #ccc' }}>
    {open ? <><p style={{ margin: '0 0 12px' }}>Allow Facebook advertising cookies? These help us measure visits and checkout starts from our ads. Optional—your design and checkout work without them. <a href="/cookies">Cookie details</a>.</p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}><button type="button" onClick={() => choose(true)}>Allow Facebook cookies</button><button type="button" onClick={() => choose(false)}>No thanks</button></div></>
      : <button type="button" onClick={() => setOpen(true)}>Facebook cookie preferences</button>}
  </section>;
}
