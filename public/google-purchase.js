/* Event-only, same-origin frame. Never load normal analytics on private orders. */
(() => {
  'use strict';
  const measurementId = 'G-FKP17EXNBX';
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
      || location.pathname !== '/google-purchase.html' || location.search || location.hash
      || data?.type !== 'instaplaque:purchase'
      || !/^ip_[a-f0-9]{64}$/.test(data.transactionId || '')
      || typeof data.value !== 'number' || !Number.isFinite(data.value) || data.value <= 0
      || data.currency !== 'GBP') return;
    handled = true;
    const reply = (queued) => window.parent.postMessage({
      type: 'instaplaque:purchase-result', transactionId: data.transactionId, queued,
    }, location.origin);
    if (!hasConsent()) return reply(false);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    // This frame is created only after the optional advertising-cookie choice.
    // No enhanced customer data, Google signals or remarketing are requested.
    gtag('consent', 'default', {
      analytics_storage: 'granted', ad_storage: 'granted',
      ad_user_data: 'granted', ad_personalization: 'denied',
    });
    gtag('js', new Date());
    const safePage = {
      page_location: location.origin + '/order-confirmed',
      page_referrer: '', page_title: 'Order confirmed',
    };
    gtag('config', measurementId, {
      ...safePage, send_page_view: false,
      allow_google_signals: false, allow_ad_personalization_signals: false,
    });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
    script.onerror = () => reply(false);
    script.onload = () => {
      if (!hasConsent()) return reply(false);
      gtag('event', 'purchase', {
        ...safePage, send_to: measurementId,
        transaction_id: data.transactionId, value: data.value, currency: 'GBP',
        items: [{ item_id: 'custom-plaque', item_name: 'Custom plaque', price: data.value, quantity: 1 }],
        // Callback means processed/queued, not verified Google/Ads receipt.
        event_callback: () => reply(true), event_timeout: 4000,
      });
    };
    document.head.appendChild(script);
  });
})();
