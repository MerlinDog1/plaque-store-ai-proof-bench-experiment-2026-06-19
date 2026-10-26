import React from 'react';
import ReactDOM from 'react-dom/client';
import { inject } from '@vercel/analytics';
import App from './App';
import './index.css';
import './shopfront.css';
import './designer.css';
import './shopfront-a11y.css';
import { redactAnalyticsEvent } from './services/analyticsPrivacy.mjs';
import { analyticsConsent, startSiteAnalytics } from './services/posthogAnalytics';
import { startSessionReplay } from './services/sessionReplay';
import { OPTIONAL_AD_CONSENT_CHANGED, isInternalBrowser } from './services/metaPixel';
import { applyInternalSwitch } from './services/internalTraffic';

// Before any analytics starts: ?internal=on / ?internal=off marks or clears the owner's own browser.
applyInternalSwitch();

const analyticsHosts = new Set([
  'instaplaque.co.uk',
  'www.instaplaque.co.uk',
]);

let vercelAnalyticsStarted = false;
const startVercelAnalytics = () => {
  if (vercelAnalyticsStarted || !analyticsHosts.has(window.location.hostname) || analyticsConsent() !== 'yes'
    || isInternalBrowser()) return;
  vercelAnalyticsStarted = true;
  inject({ beforeSend: event => analyticsConsent() === 'yes' && !isInternalBrowser() ? redactAnalyticsEvent(event) : null });
};
startVercelAnalytics();
window.addEventListener(OPTIONAL_AD_CONSENT_CHANGED, startVercelAnalytics);
startSiteAnalytics();
// Session recordings, only with analytics consent given once the policies described them (owner msg 6565).
startSessionReplay();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Built public routes contain a crawlable HTML representation. The interactive
// application takes ownership of the root as soon as JavaScript is ready.
rootElement.replaceChildren();
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <React.Suspense fallback={<div role="status" style={{padding:32,color:"#243e34"}}>Loading your plaque designer…</div>}><App /></React.Suspense>
  </React.StrictMode>
);
