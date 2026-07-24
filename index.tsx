import React from 'react';
import ReactDOM from 'react-dom/client';
import { inject } from '@vercel/analytics';
import App from './App';
import './index.css';
import { redactAnalyticsEvent } from './services/analyticsPrivacy.mjs';

const analyticsHosts = new Set([
  'instaplaque.co.uk',
  'www.instaplaque.co.uk',
]);

if (analyticsHosts.has(window.location.hostname) || window.location.hostname.endsWith('.vercel.app')) {
  inject({
    beforeSend: redactAnalyticsEvent,
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
