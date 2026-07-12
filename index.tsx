import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Public routes include a static, crawlable representation in the built HTML.
// The interactive application owns the root as soon as JavaScript is ready.
rootElement.replaceChildren();
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

window.requestAnimationFrame(() => {
  window.requestAnimationFrame(() => {
    const loader = document.getElementById('instaplaque-loader');
    if (!loader) return;
    const loaderWindow = window as Window & { __instaplaqueLoaderStarted?: number };
    const elapsed = Date.now() - (loaderWindow.__instaplaqueLoaderStarted || Date.now());
    window.setTimeout(() => {
      loader.classList.add('is-leaving');
      window.setTimeout(() => loader.remove(), 420);
    }, Math.max(0, 650 - elapsed));
  });
});
