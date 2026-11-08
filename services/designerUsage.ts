// A visit is one open document. Never persist this number or derive it from a device.
import { statisticsEnabled } from './siteStatistics';
import { isInternalBrowser, metaConsent } from './metaPixel';
import { getArrivalAttribution } from './arrivalAttribution';
let visitId: string | undefined;
let sent = 0;
let operationId: string | undefined;
export function beginLayoutUsage() {
  try { operationId = statisticsEnabled() ? crypto.randomUUID() : undefined; } catch { operationId = undefined; }
  return performance.now();
}
const once = new Set<string>();
function context() {
  const arrival = getArrivalAttribution();
  const label = arrival?.label || 'direct';
  return { source: ['google_ads', 'google_shopping', 'facebook_instagram_ads', 'google_organic', 'direct'].includes(label) ? label : 'other',
    campaign: /^[a-zA-Z0-9 _.-]{1,80}$/.test(arrival?.utm_campaign || '') ? arrival!.utm_campaign : '',
    cookie: metaConsent() === 'yes' ? 'accepted' : metaConsent() === 'no' ? 'rejected' : 'none',
    internal: isInternalBrowser(), taggedTest: arrival?.utm_medium?.toLowerCase() === 'test' || !!arrival?.utm_source?.toLowerCase().startsWith('cody') };
}
function send(event: string, details: object) {
  if (!statisticsEnabled() || sent >= 40) return;
  sent++;
  try { void fetch('/api/usage', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitId, event, ...context(), details }), keepalive: true }).catch(() => {}); } catch { /* Counting never interrupts a customer. */ }
}
export function usageHeaders(step?: 'proofread' | 'layout' | 'change' | 'other'): Record<string, string> {
  if (typeof window === 'undefined' || !statisticsEnabled()) return {};
  try {
    if (!visitId) { visitId = crypto.randomUUID(); send('visit', {}); }
    const c = context();
    return { 'X-InstaPlaque-Visit': visitId, 'X-InstaPlaque-Internal': c.internal ? '1' : '0',
      'X-InstaPlaque-Test': c.taggedTest ? '1' : '0', ...(step ? { 'X-InstaPlaque-Step': step } : {}), ...(operationId ? { 'X-InstaPlaque-Operation': operationId } : {}) };
  } catch { return {}; }
}
export function designerUsage(event: 'designer_open' | 'designer_step' | 'layout_result', details: object = {}, key?: string) {
  if (!statisticsEnabled() || (key && once.has(key))) return;
  if (!usageHeaders()['X-InstaPlaque-Visit']) return;
  if (key) once.add(key);
  send(event, details);
}
export function layoutUsage(kind: 'layout' | 'change', started: number, outcome: 'shown' | 'failed', error?: unknown) {
  const e = error as { code?: string; status?: number; message?: string };
  const reason = typeof error === 'string' ? error : e?.status === 429 ? 'rate_limited' : e?.code === 'generation_timeout' ? 'timeout'
    : /fit|bounds|overflow|small/i.test(e?.message || '') ? 'did_not_fit' : /json|svg|invalid|reply/i.test(e?.message || '') ? 'invalid_reply' : 'ai_error';
  designerUsage('layout_result', { kind, outcome, ...(operationId ? { operation: operationId } : {}), ...(outcome === 'failed' ? { reason } : {}), seconds: Math.min(600, Math.round((performance.now() - started) / 1000)) });
}
