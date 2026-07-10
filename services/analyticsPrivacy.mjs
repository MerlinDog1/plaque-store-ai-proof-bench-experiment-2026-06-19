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
    for (const key of sensitiveQueryKeys) {
      url.searchParams.delete(key);
    }
    return { ...event, url: url.toString() };
  } catch {
    return null;
  }
};
