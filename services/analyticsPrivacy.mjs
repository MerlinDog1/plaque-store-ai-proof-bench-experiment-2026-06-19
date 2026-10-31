const sensitiveQueryKeys = ['proof', 'order', 'session_id'];

/**
 * Removes bearer-like identifiers from URLs before Vercel Web Analytics sees them.
 * Invalid URLs are dropped instead of being sent without redaction.
 *
 * @param {import('@vercel/analytics').BeforeSendEvent} event
 * @returns {import('@vercel/analytics').BeforeSendEvent | null}
 */
export const redactAnalyticsEvent = (event) => {
  try {
    const url = new URL(event.url);
    if (/^\/(admin|proof|order|order-confirmed|checkout|checkout-test\.html|google-purchase\.html|meta-purchase\.html)(\/|$)/.test(url.pathname)
      || /^(admin|proof|order|order-confirmed|checkout)$/.test(url.searchParams.get('view') || '')
      || sensitiveQueryKeys.some(key => url.searchParams.has(key))) return null;
    url.search = '';
    url.hash = '';
    return { ...event, url: url.toString() };
  } catch {
    return null;
  }
};
