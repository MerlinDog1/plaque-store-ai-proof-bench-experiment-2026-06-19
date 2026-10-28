/* Event-only, same-origin frame for Meta: one Purchase per paid live order, nothing else (services/metaPurchase.ts). */
(() => {
  'use strict';
  const pixelId = '4216755011787795'; // must match META_PIXEL_ID in services/metaPixel.ts
  const hasConsent = () => {
    try { return localStorage.getItem('instaplaque-meta-consent') === 'yes'; }
    catch { return false; }
  };
  let handled = false;
  window.addEventListener('message', (event) => {
    const data = event.data;
    if (handled || window.parent === window || event.source !== window.parent
      || event.origin !== location.origin || location.protocol !== 'https:'
      || !['instaplaque.co.uk', 'www.instaplaque.co.uk'].includes(location.hostname)
      || location.pathname !== '/meta-purchase.html' || location.search || location.hash
      || data?.type !== 'instaplaque:meta-purchase'
      || !/^ip_[a-f0-9]{64}$/.test(data.eventId || '')
      || typeof data.value !== 'number' || !Number.isFinite(data.value) || data.value <= 0
      || data.currency !== 'GBP') return;
    handled = true;
    const reply = (queued) => window.parent.postMessage({
      type: 'instaplaque:meta-purchase-result', eventId: data.eventId, queued,
    }, location.origin);
    if (!hasConsent()) return reply(false);

    // The standard pixel queue, without the automatic page view: this frame only reports the purchase.
    const q = function () { if (q.callMethod) q.callMethod.apply(q, arguments); else q.queue.push(arguments); };
    q.queue = []; q.loaded = true; q.version = '2.0'; q.push = q;
    window.fbq = q; window._fbq = q;
    q('consent', 'grant');
    q('set', 'autoConfig', false, pixelId);
    q('init', pixelId);
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    script.onerror = () => reply(false);
    script.onload = () => {
      if (!hasConsent()) return reply(false);
      q('trackSingle', pixelId, 'Purchase', { value: data.value, currency: 'GBP', content_type: 'product', num_items: 1 },
        { eventID: data.eventId });
      // Queued for the pixel; the frame stays up briefly so the request can leave. Not proof Meta received it.
      setTimeout(() => reply(true), 1500);
    };
    document.head.appendChild(script);
  });
})();
