import React from 'react';
import ReactDOM from 'react-dom/client';
import { inject } from '@vercel/analytics';
import App from './App';
import './index.css';
import './shopfront.css';
import './designer.css';
import { redactAnalyticsEvent } from './services/analyticsPrivacy.mjs';
import { analyticsConsent, startSiteAnalytics } from './services/posthogAnalytics';
import { OPTIONAL_AD_CONSENT_CHANGED } from './services/metaPixel';

const analyticsHosts = new Set([
  'instaplaque.co.uk',
  'www.instaplaque.co.uk',
]);

let vercelAnalyticsStarted = false;
const startVercelAnalytics = () => {
  if (vercelAnalyticsStarted || !analyticsHosts.has(window.location.hostname) || analyticsConsent() !== 'yes') return;
  vercelAnalyticsStarted = true;
  inject({ beforeSend: event => analyticsConsent() === 'yes' ? redactAnalyticsEvent(event) : null });
};
startVercelAnalytics();
window.addEventListener(OPTIONAL_AD_CONSENT_CHANGED, startVercelAnalytics);
startSiteAnalytics();

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
