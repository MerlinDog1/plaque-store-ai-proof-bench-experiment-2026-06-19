import React, { useRef } from 'react';
import { businessContact } from '../services/shopInformation';

type Channel = 'whatsapp' | 'email';

// "a memorial plaque", "an A5 plaque", "a stainless steel plaque" for the suggested message.
export function plaqueSubject(shortTitle: string): string {
  const noun = shortTitle === 'Stainless' ? 'stainless steel' : /^A\d$/.test(shortTitle) ? shortTitle : shortTitle.toLowerCase();
  return `${/^([aeiou]|A\d)/i.test(noun) ? 'an' : 'a'} ${noun} plaque`;
}
type Placement = 'hero' | 'mobile_bar' | 'contact' | 'footer' | 'page';

function contactHref(channel: Channel, subject: string, reference?: string): string {
  // A short, natural opener for every page (owner msg 5156); the greeting message does the guiding.
  const message = `Hi InstaPlaque, I'm interested in a plaque${reference ? ` (ref ${reference})` : ''}`;
  return channel === 'whatsapp'
    ? `${businessContact.whatsappHref}?text=${encodeURIComponent(message)}`
    : `mailto:${businessContact.email}?subject=${encodeURIComponent(`Plaque enquiry${reference ? ` — ${reference}` : ''}`)}&body=${encodeURIComponent(message)}`;
}

export function ContactLink({ channel, placement, subject = 'a plaque', className, children }: {
  channel: Channel;
  placement: Placement;
  subject?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const lastActivation = useRef<{ at: number; reference?: string }>({ at: 0 });
  const prepareLink = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || (event.button !== 0 && event.button !== 1)) return;
    // A reference is created only when the customer opens a conversation.
    // No cookies, customer wording, private page URLs or advertising IDs.
    const now = Date.now();
    let reference = now - lastActivation.current.at < 1000 ? lastActivation.current.reference : undefined;
    try { reference ||= `IP-${crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`; } catch { /* The basic link still works. */ }
    lastActivation.current = { at: now, reference };
    event.currentTarget.href = contactHref(channel, subject, reference);
    if (reference) event.currentTarget.dataset.contactReference = reference;
    // The existing document-level analytics listener records the safe reference
    // after this handler, only if the visitor has opted in.
  };
  return (
    <a
      href={contactHref(channel, subject)}
      className={className}
      data-contact-placement={placement}
      onClick={prepareLink}
      onAuxClick={prepareLink}
      {...(channel === 'whatsapp' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  );
}

// WhatsApp glyph (Simple Icons, CC0) so the WhatsApp choice is recognisable at a glance.
export function WhatsAppIcon() {
  return (
    <svg className="shop-whatsapp-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

export function ContactOptions({ subject = 'a plaque' }: { subject?: string }) {
  return (
    <div className="shop-contact-options">
      <p><strong>Prefer us to help with the design?</strong></p>
      <p>Send your wording. We’ll send a free proof for you to check.</p>
      <p>Made a design in ChatGPT? Send us the picture and we’ll make it real.</p>
      <div className="shop-contact-actions">
        <ContactLink channel="whatsapp" placement="hero" subject={subject} className="shop-contact-whatsapp">
          WhatsApp us your wording <span aria-hidden="true">↗</span>
        </ContactLink>
        <ContactLink channel="email" placement="hero" subject={subject} className="shop-contact-email">
          Email us <span aria-hidden="true">↗</span>
        </ContactLink>
      </div>
    </div>
  );
}

export function MobileContactBar({ subject = 'a plaque', onDesign }: { subject?: string; onDesign?: () => void }) {
  return (
    <nav className="shop-mobile-contact" aria-label="Design your plaque or ask us for help">
      <a href="/design" className="shop-mobile-design" onClick={event => {
        if (onDesign && event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
          event.preventDefault();
          onDesign();
        }
      }}>Design online</a>
      <ContactLink channel="whatsapp" placement="mobile_bar" subject={subject}><WhatsAppIcon /> WhatsApp</ContactLink>
      <ContactLink channel="email" placement="mobile_bar" subject={subject}>Email us</ContactLink>
    </nav>
  );
}
