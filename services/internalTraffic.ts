import { INTERNAL_BROWSER_KEY, isInternalBrowser } from './metaPixel';

// The owner's switch for leaving their own browsers out of the statistics (owner msg 6422, 25 Oct 2026: "Is there a
// way to hide my views"). Opening any page with ?internal=on marks this browser until its site data is cleared;
// ?internal=off counts it again. A marked browser loads no Google tags (index.html reads the same key), no Meta pixel
// and no Vercel analytics, reports no purchase to Google, and its PostHog events are marked is_test, which the saved
// dashboard, the daily email and Cody's reports leave out.
const SWITCH_PARAM = 'internal';

/** Runs once, before any analytics starts: stores ?internal=on|off, drops it from the address and confirms it. */
export function applyInternalSwitch(): void {
  let url: URL;
  try { url = new URL(window.location.href); } catch { return; }
  const value = url.searchParams.get(SWITCH_PARAM);
  if (value !== 'on' && value !== 'off') return;
  try {
    if (value === 'on') localStorage.setItem(INTERNAL_BROWSER_KEY, 'yes');
    else localStorage.removeItem(INTERNAL_BROWSER_KEY);
  } catch { /* Storage blocked: the note says so. */ }
  // Keep every other part of the address, so the switch is not bookmarked or shared by accident.
  url.searchParams.delete(SWITCH_PARAM);
  try { window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`); } catch { /* Keep the address. */ }
  showNote(value === 'off'
    ? 'This browser is counted in InstaPlaque’s stats again.'
    : isInternalBrowser()
      ? 'This browser is now left out of InstaPlaque’s stats.'
      : 'This browser blocks site storage, so it can’t be left out of the stats.');
}

function showNote(text: string): void {
  const note = document.createElement('div');
  note.className = 'internal-switch-note';
  note.setAttribute('role', 'status');
  note.textContent = text;
  Object.assign(note.style, {
    position: 'fixed', left: '50%', bottom: '24px', transform: 'translateX(-50%)', zIndex: '2147483647',
    width: 'max-content', maxWidth: 'calc(100% - 32px)', boxSizing: 'border-box', padding: '12px 18px',
    borderRadius: '8px', background: '#203b32', color: '#fff', font: '600 14px/1.4 Arial, Helvetica, sans-serif',
    textAlign: 'center', boxShadow: '0 8px 28px rgba(0, 0, 0, 0.25)',
  });
  document.body.appendChild(note);
  window.setTimeout(() => note.remove(), 8000);
}
