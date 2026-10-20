import React, { useRef } from 'react';
import { businessContact } from '../services/shopInformation';

type Channel = 'whatsapp' | 'email';

// "a memorial plaque", "an A5 plaque", "a stainless steel plaque" for the suggested message.
export function plaqueSubject(shortTitle: string): string {
  const noun = shortTitle === 'Stainless' ? 'stainless steel' : /^A\d$/.test(shortTitle) ? shortTitle : shortTitle.toLowerCase();
  return `${/^([aeiou]|A\d)/i.test(noun) ? 'an' : 'a'} ${noun} plaque`;
}
type Placement = 'hero' | 'mobile_bar' | 'contact' | 'footer';

function contactHref(channel: Channel, subject: string, reference?: string): string {
  const message = `Hello InstaPlaque, I'd like help with ${subject}. Please send me a free proof.\n\nMy wording:\nApproximate size (if known):${reference ? `\n\nReference: ${reference}` : ''}`;
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

export function ContactOptions({ subject = 'a plaque' }: { subject?: string }) {
  return (
    <div className="shop-contact-options">
      <p><strong>Prefer us to help with the design?</strong></p>
      <p>Send your wording. We’ll send a free proof for you to check.</p>
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
      <ContactLink channel="whatsapp" placement="mobile_bar" subject={subject}>WhatsApp</ContactLink>
      <ContactLink channel="email" placement="mobile_bar" subject={subject}>Email us</ContactLink>
    </nav>
  );
}
