// First-arrival hints, not verified ad conversions. Shared by browser and server.
// No cookies, storage, network requests, fingerprinting or full referrer URLs.
export const ATTRIBUTION_QUERY_KEYS = Object.freeze([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'gclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid',
]);
const clickKeys = new Set(['gclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid']);
const ownHosts = new Set(['instaplaque.co.uk', 'www.instaplaque.co.uk']);
const cleanText = (value, limit) => typeof value === 'string'
  ? value.replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, limit) : '';
const cleanHost = value => {
  if (typeof value !== 'string' || value.length > 253) return '';
  const host = value.toLowerCase().replace(/\.$/, '');
  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(host) ? host : '';
};
const isGoogle = host => /^(?:www\.)?google\.(?:[a-z]{2,3}|com\.[a-z]{2}|co\.[a-z]{2})$/.test(host);
const isBing = host => /^(?:www\.)?bing\.com$/.test(host);
const isPaid = medium => /^(cpc|ppc|paid|paid[_ -]?(search|social)|display|shopping|pla)$/.test(medium);

export function deriveAttributionLabel(data) {
  const source = (data.utm_source || '').toLowerCase();
  const medium = (data.utm_medium || '').toLowerCase();
  const host = data.referrer_host || '';
  const google = /^(google|google[_ -]shopping|adwords|googleads)$/.test(source);
  if (data.gclid || data.gbraid || data.wbraid || (google && isPaid(medium))) {
    return /^(shopping|pla)$/.test(medium) || /^google[_ -]shopping$/.test(source) ? 'google_shopping' : 'google_ads';
  }
  // fbclid is a Meta click hint, not proof that the click was paid.
  if (data.fbclid || (/^(facebook|instagram|meta|fb|ig)$/.test(source) && isPaid(medium))) return 'facebook_instagram_ads';
  if (data.msclkid || /^(bing|microsoft|microsoft_ads)$/.test(source) || isBing(host)) return 'bing';
  if (google || isGoogle(host)) return 'google_organic';
  return host && !ownHosts.has(host) ? `other_referral:${host}` : 'direct';
}

export function sanitizeAttribution(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const result = {};
  for (const key of ATTRIBUTION_QUERY_KEYS) {
    if (!Object.hasOwn(input, key)) continue;
    const value = cleanText(input[key], clickKeys.has(key) ? 512 : 200);
    if (value && (!clickKeys.has(key) || /^[A-Za-z0-9._~-]+$/.test(value))) result[key] = value;
  }
  const host = cleanHost(input.referrer_host);
  if (host && !ownHosts.has(host)) result.referrer_host = host;
  if (typeof input.landing_path === 'string' && /^\/(?!\/)/.test(input.landing_path)) {
    let path = cleanText(input.landing_path.split(/[?#]/, 1)[0], 300);
    // Never retain private proof/order identifiers embedded in a landing URL.
    path = path.replace(/^(\/(?:admin|proof|order|order-confirmed|checkout))(?:\/.*)?$/i, '$1');
    if (path && !path.includes('\\')) result.landing_path = path;
  }
  if (!Object.keys(result).length) return null;
  result.label = deriveAttributionLabel(result); // Never trust a client-supplied label.
  return result;
}

export function captureArrivalAttribution(href, referrer = '') {
  try {
    const url = new URL(href);
    const input = { landing_path: url.pathname };
    for (const key of ATTRIBUTION_QUERY_KEYS) {
      const value = url.searchParams.get(key);
      if (value) input[key] = value;
    }
    try {
      const from = new URL(referrer);
      if (/^https?:$/.test(from.protocol) && from.hostname !== url.hostname) input.referrer_host = from.hostname;
    } catch { /* Missing/blocked referrers are normal. */ }
    return sanitizeAttribution(input);
  } catch { return null; }
}

export function attributionSourceCode(attribution) {
  switch (attribution?.label) {
    case 'google_ads': case 'google_shopping': return 'G';
    case 'facebook_instagram_ads': return 'F';
    case 'google_organic': return 'O';
    case 'bing': return attribution.msclkid || isPaid((attribution.utm_medium || '').toLowerCase()) ? 'B' : 'O';
    case 'direct': return 'D';
    default: return attribution?.label?.startsWith('other_referral:') ? 'R' : 'D';
  }
}

export function contactReference(uuid, attribution) {
  const id = String(uuid).replace(/-/g, '').slice(0, 10).toUpperCase();
  return /^[A-F0-9]{10}$/.test(id) ? `IP-${id}-${attributionSourceCode(attribution)}` : undefined;
}
