import React, { useEffect, useRef, useState } from 'react';
import { Fixing, Material, PlaqueState, Shape } from '../types';

const materials: Record<Material, string> = {
  [Material.BrushedBrass]: 'Brushed brass', [Material.OrbitalBrassMattLacquer]: 'Orbital brass',
  [Material.PolishedBrass]: 'Polished brass', [Material.AgedBrass]: 'Aged brass',
  [Material.BrushedSteel]: 'Brushed stainless steel', [Material.PolishedSteel]: 'Polished stainless steel',
};
const fixings: Record<Fixing, string> = { [Fixing.None]: 'No fixings', [Fixing.VHB]: 'Adhesive backing', [Fixing.Screws]: 'Screw holes', [Fixing.Caps]: 'Screws with decorative caps' };
const shapes: Record<Shape, string> = { [Shape.Rect]: 'Rectangle', [Shape.Oval]: 'Oval', [Shape.Circle]: 'Circle', [Shape.Heart]: 'Heart' };

export function DesignRequest({ initialState, initialWording, initialNotes, onBack }: {
  initialState: PlaqueState; initialWording: string; initialNotes: string; onBack: () => void;
}) {
  const [draft, setDraft] = useState(() => ({
    size: `${initialState.width} × ${initialState.height} mm`,
    material: materials[initialState.material], shape: shapes[initialState.shape],
    wood: initialState.wood ? `${initialState.woodTone === 'dark' ? 'Dark' : 'Light'} wood backing` : 'No wood backing',
    fixing: fixings[initialState.fixing], wording: initialWording, notes: initialNotes,
    name: '', email: '', use: '',
  }));
  const [review, setReview] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [fileError, setFileError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const update = (key: keyof typeof draft, value: string) => setDraft(previous => ({ ...previous, [key]: value }));
  useEffect(() => {
    if (!file) { setFileUrl(''); return; }
    const url = URL.createObjectURL(file); setFileUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => { if (review) heading.current?.focus(); }, [review]);
  const choices = (key: 'material' | 'shape' | 'wood' | 'fixing', label: string, values: string[]) => (
    <label>{label}<select aria-label={label} value={draft[key]} onChange={event => update(key, event.target.value)}>
      {values.map(value => <option key={value}>{value}</option>)}<option>Not sure — please advise</option>
    </select></label>
  );
  return (
    <div className="shopfront design-request-page">
      <div className="shop-breadcrumb"><button type="button" onClick={onBack}>Home</button><span>/</span><span>Have us design it</span></div>
      <div className="request-preview-note" role="note"><strong>Preview only.</strong> Try the form and review your request. Nothing is sent, uploaded or ordered. Your draft stays in this tab while navigating; refreshing clears it. If you change products, check the choices in your saved draft.</div>
      <header className="request-heading">
        <p className="shop-kicker">Your words. Our care and attention.</p>
        <h1 ref={heading} tabIndex={-1}>{review ? 'Your design brief, ready to review.' : 'Leave the layout to us.'}</h1>
        <p>{review ? 'Here’s what you would send to our design team. Check the details or go back to make changes.' : 'Tell us about your plaque. We’ll arrange the design and email your proof within 3 hours for you to review, with a payment link when you’re happy to proceed.'}</p>
      </header>
      <div className="request-layout">
        {review ? <section className="request-card request-summary" aria-label="Request summary">
          <h2>Check your details</h2>
          <dl>{[['Size', draft.size], ['Shape', draft.shape], ['Material', draft.material], ['Wood backing', draft.wood], ['Fixings', draft.fixing], ['Where it will go', draft.use || 'Not specified'], ['Name', draft.name], ['Email', draft.email]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
          <h3>Exact plaque wording</h3><p className="request-exact">{draft.wording}</p>
          <h3>Design notes</h3><p className="request-exact">{draft.notes || 'Let the designer suggest a suitable layout.'}</p>
          {file && <><h3>Reference image</h3><p>{file.name} — selected locally, not uploaded</p>{fileUrl && <img className="request-image" src={fileUrl} alt="Your selected reference" />}</>}
          <div className="request-preview-note"><strong>Request not sent.</strong> This preview stops here. In the finished service you would submit the brief, then receive your proof by email. No payment is taken with the request.</div>
          <button type="button" className="shop-button" onClick={() => setReview(false)}>Edit my request</button>
        </section> : <form className="request-card" onSubmit={event => { event.preventDefault(); if (draft.wording.trim() && draft.name.trim()) setReview(true); }}>
          <fieldset><legend>1. Choose your plaque</legend><p>These are your preferences, not a final order. We’ll confirm suitability and the final price with your proof.</p>
            <label>Size<input pattern={'.*\\S.*'} title="Enter a size or ask us to advise" list="request-sizes" value={draft.size} required maxLength={100} onChange={event => update('size', event.target.value)} placeholder="e.g. 150 × 50 mm, or please advise" /></label>
            <datalist id="request-sizes"><option value="150 × 50 mm" /><option value="200 × 75 mm" /><option value="210 × 148 mm (A5)" /><option value="297 × 210 mm (A4)" /><option value="Not sure — please advise" /></datalist>
            <div className="request-fields">{choices('shape', 'Shape', Object.values(shapes))}{choices('material', 'Material', Object.values(materials))}{choices('wood', 'Wood backing', ['No wood backing', 'Light wood backing', 'Dark wood backing'])}{choices('fixing', 'Fixings', Object.values(fixings))}</div>
            <label>Where will it go? <span>(optional)</span><input value={draft.use} maxLength={250} onChange={event => update('use', event.target.value)} placeholder="A garden bench, an indoor wall, a tree…" /></label>
          </fieldset>
          <fieldset><legend>2. Tell us what it should say</legend>
            <label>Exact wording for the plaque<textarea aria-label="Exact wording for the plaque" required value={draft.wording} maxLength={3000} rows={5} onChange={event => { event.currentTarget.setCustomValidity(event.target.value.trim() ? '' : 'Please enter the wording for your plaque.'); update('wording', event.target.value); }} placeholder={'In loving memory of\n…'} /></label>
            <p>Please check names and dates. Put design instructions below, not in the wording.</p>
            <label>What do you have in mind? <span>(optional)</span><textarea aria-label="What do you have in mind? (optional)" value={draft.notes} maxLength={2000} rows={4} onChange={event => update('notes', event.target.value)} placeholder="A traditional bench plaque. Make Dad’s name stand out, with a small rose above the wording." /></label>
            <label>Reference image <span>(optional · JPG, PNG or WebP · up to 5 MB)</span><input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="reference-note" onChange={event => {
              const next = event.target.files?.[0];
              if (!next) return;
              setFileError(''); setFile(null);
              if (!['image/jpeg', 'image/png', 'image/webp'].includes(next.type) || next.size > 5 * 1024 * 1024) { setFileError('Please choose a JPG, PNG or WebP image no larger than 5 MB.'); event.target.value = ''; return; }
              setFile(next);
            }} /></label>
            <p id="reference-note">An example you like, a sketch or artwork you’d like included. It stays on your device in this preview.</p>
            {fileError && <p role="alert">{fileError}</p>}
            {file && <div>{fileUrl && <img className="request-image" src={fileUrl} alt="Your selected reference" />}<p>{file.name}</p><button className="shop-text-link" type="button" onClick={() => { setFile(null); if (fileInput.current) fileInput.current.value = ''; }}>Remove image</button></div>}
          </fieldset>
          <fieldset><legend>3. Where should we send your proof?</legend>
            <label>Your name<input required pattern={'.*\\S.*'} title="Please enter your name" autoComplete="name" value={draft.name} maxLength={120} onChange={event => update('name', event.target.value)} /></label>
            <label>Email address<input required type="email" autoComplete="email" value={draft.email} maxLength={254} onChange={event => update('email', event.target.value)} /></label>
            <p>For your proof and any questions about the design. No account needed.</p>
          </fieldset>
          <button className="shop-button" type="submit">Review request</button><p className="shop-smallprint">Preview only — this does not send a request.</p>
        </form>}
        <aside className="request-aside"><p className="shop-kicker">How it works</p><h2>No designing required.</h2><ol className="design-service-steps">
          <li><span>01</span><div><strong>Send your brief</strong><p>Tell us your wording and preferences. Unsure about something? Ask us to advise.</p></div></li>
          <li><span>02</span><div><strong>Review your emailed proof</strong><p>We prepare the layout. Check it carefully and request changes if needed.</p></div></li>
          <li><span>03</span><div><strong>Approve and pay</strong><p>Confirm the proof and final price, then use the payment link before production.</p></div></li>
        </ol><p className="shop-smallprint">No payment details needed to ask for a design. This preview does not submit your information.</p></aside>
      </div>
    </div>
  );
}
