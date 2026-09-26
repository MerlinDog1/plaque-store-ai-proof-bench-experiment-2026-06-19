import { createHash } from 'node:crypto';

export const MAX_REFERENCE_BYTES = 2 * 1024 * 1024;
export const MAX_DESIGN_REQUEST_BYTES = 3 * 1024 * 1024;
const fail = (message, statusCode = 400) => { throw Object.assign(new Error(message), { statusCode }); };
const fields = { size: 100, shape: 80, material: 100, wood: 100, fixing: 100, wording: 3000, notes: 2000, name: 120, email: 254, use: 250 };
const required = new Set(['size', 'shape', 'material', 'wood', 'fixing', 'wording', 'name', 'email']);
export function validateDesignRequest(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) fail('Invalid design request.');
  if (Object.keys(payload).some(key => ![...Object.keys(fields), 'requestId', 'website', 'attachment'].includes(key))) fail('Unexpected request field.');
  if (payload.website) fail('Unable to submit this request.');
  if (typeof payload.requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.requestId)) fail('Invalid request reference. Please refresh and try again.');
  const draft = {};
  for (const [key, limit] of Object.entries(fields)) {
    const value = payload[key] ?? '';
    if (typeof value !== 'string' || value.length > limit || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) fail(`Please check ${key}.`);
    if (required.has(key) && !value.trim()) fail(`Please enter ${key}.`);
    draft[key] = value.trim();
  }
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(draft.email)) fail('Please enter a valid email address.');
  let attachment;
  if (payload.attachment != null) {
    const a = payload.attachment;
    if (typeof a !== 'object' || typeof a.content !== 'string' || a.content.length > Math.ceil(MAX_REFERENCE_BYTES / 3) * 4 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(a.content)) fail('Invalid reference image.');
    const bytes = Buffer.from(a.content, 'base64');
    if (!bytes.length || bytes.length > MAX_REFERENCE_BYTES || bytes.toString('base64') !== a.content) fail('Reference image must be no larger than 2 MB.');
    const format = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'png'
      : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? 'jpg'
      : bytes.subarray(0,4).toString() === 'RIFF' && bytes.subarray(8,12).toString() === 'WEBP' ? 'webp' : null;
    const mime = {png:'image/png',jpg:'image/jpeg',webp:'image/webp'}[format];
    if (!format || a.type !== mime) fail('Please choose a valid JPG, PNG or WebP reference image.');
    attachment = { filename: `reference.${format}`, content: a.content, content_type: mime };
  }
  return { requestId: payload.requestId.toLowerCase(), draft, attachment };
}

export async function submitDesignRequest(payload, { env = process.env, recipients = [], fetchImpl = fetch } = {}) {
  const { requestId, draft, attachment } = validateDesignRequest(payload);
  if (!env.RESEND_API_KEY || !recipients.length) fail('Request sending is temporarily unavailable. Please contact us or try again later.', 503);
  // Stable payload-derived key: retries of an unchanged brief cannot double-send within Resend's 24h window.
  // Changed briefs get distinct keys, avoiding ambiguous updates to an already accepted request.
  const digest = createHash('sha256').update(JSON.stringify({ draft, attachment })).digest('hex');
  const reference = `IP-DESIGN-${requestId}-${digest.slice(0,8)}`;
  const labels = {name:'Customer',email:'Reply email',size:'Size',shape:'Shape',material:'Material',wood:'Wood backing',fixing:'Fixings',use:'Location / use',wording:'EXACT PLAQUE WORDING',notes:'Design instructions'};
  const text = [`New InstaPlaque human-design request: ${reference}`, 'Please prepare and email the proof within 3 hours. No payment or order has been created.', ...Object.entries(labels).map(([key,label])=>`${label}:\n${draft[key] || 'Not specified'}`)].join('\n\n');
  let response;
  try {
    response = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST', signal: AbortSignal.timeout(15_000),
      headers: {Authorization:`Bearer ${env.RESEND_API_KEY}`, 'Content-Type':'application/json', 'Idempotency-Key':`design-request/${requestId}/${digest}`},
      body: JSON.stringify({from:env.ORDER_EMAIL_FROM || 'InstaPlaque <orders@instaplaque.co.uk>',to:recipients,reply_to:draft.email,subject:`InstaPlaque design request · ${reference}`,text,...(attachment ? {attachments:[attachment]} : {})}),
    });
  } catch { fail('We could not confirm receipt. Your brief is still here; please retry without changing it, or contact us.', 502); }
  const data = await response.json().catch(()=>({}));
  if (!response.ok || typeof data.id !== 'string' || !data.id) fail('We could not confirm receipt. Your brief is still here; please retry without changing it, or contact us.', 502);
  return { ok:true, reference };
}
