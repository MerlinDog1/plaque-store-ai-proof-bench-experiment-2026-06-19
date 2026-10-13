import React, { useRef, useState } from 'react';

export function ProofEmailForm({ onSend }: { onSend: (email: string, requestId: string, website: string) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [requestId] = useState(() => crypto.randomUUID());
  const submitting = useRef(false);
  return <form className="proof-email-form" onSubmit={async event => {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true; setBusy(true); setMessage('');
    try {
      await onSend(email, requestId, website);
      setMessage('Your email is on its way. Please check your inbox and spam folder.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not send your proof. Please try again.');
    } finally { submitting.current = false; setBusy(false); }
  }}>
    <label htmlFor="proof-email">Or email yourself a private link</label>
    <div className="proof-email-fields"><input id="proof-email" type="email" autoComplete="email" required maxLength={254}
      value={email} onChange={event => { setEmail(event.target.value); setMessage(''); }} placeholder="Your email address" disabled={busy} />
      <button type="submit" disabled={busy}>{busy ? 'Sending…' : 'Email my proof'}</button></div>
    <label className="proof-email-trap" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={website} onChange={event => setWebsite(event.target.value)} /></label>
    <small>Optional. One email with your saved design; no marketing subscription. The link lasts 30 days.</small>
    {message && <p role="status">{message}</p>}
  </form>;
}
