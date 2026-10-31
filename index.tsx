import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './shopfront.css';
import './designer.css';
import './shopfront-a11y.css';
import { startSiteAnalytics } from './services/posthogAnalytics';
import { startSiteStatistics } from './services/siteStatistics';
import { startSessionReplay } from './services/sessionReplay';
import { applyInternalSwitch } from './services/internalTraffic';

// Before any analytics starts: ?internal=on / ?internal=off marks or clears the owner's own browser.
applyInternalSwitch();

// Anonymous totals use the statistics exception; the separate objection always wins.
startSiteStatistics();
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
