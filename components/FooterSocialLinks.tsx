import React from 'react';
import { socialProfiles } from '../services/socialProfiles.mjs';

export function FooterSocialLinks() {
  return (
    <div className="footer-social-links" role="group" aria-label="Follow InstaPlaque">
      {Object.entries(socialProfiles).map(([name, url]) => (
        <a key={name} href={url} aria-label={`InstaPlaque on ${name}`} title={`InstaPlaque on ${name}`} target="_blank" rel="noopener noreferrer me">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            {name === 'YouTube' ? <><rect x="2" y="5" width="20" height="14" rx="4" /><path d="m10 9 5 3-5 3Z" fill="currentColor" stroke="none" /></>
              : name === 'Instagram' ? <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></>
              : <path d="M14 21v-8h3l.5-4H14V7c0-1.1.4-2 2-2h2V1.5A22 22 0 0 0 15 1c-3 0-5 1.8-5 5v3H7v4h3v8Z" fill="currentColor" stroke="none" />}
          </svg>
        </a>
      ))}
    </div>
  );
}
