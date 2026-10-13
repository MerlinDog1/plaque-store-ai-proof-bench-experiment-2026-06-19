import { createHash } from 'node:crypto';
import { createProofSession, getSupabaseServiceClient } from './supabase.mjs';
import { consumeRequestLimit, privateRateKey } from './requestLimits.mjs';

export function validateProofEmail(payload) {
  if (!payload || typeof payload !== 'object') throw Object.assign(new Error('Invalid proof request.'), { statusCode: 400 });
  const email = String(payload.email || '').trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) throw Object.assign(new Error('Enter a valid email address.'), { statusCode: 400 });
  if (payload.website || !/^[a-f0-9-]{36}$/i.test(payload.requestId || '')
    || !payload.plaqueState || typeof payload.wording !== 'string' || payload.wording.length > 4000) {
    throw Object.assign(new Error('Please check your proof and try again.'), { statusCode: 400 });
  }
  const content = { email, plaqueState: payload.plaqueState, wording: payload.wording,
    generatedSvg: payload.generatedSvg, aiReasoning: payload.aiReasoning,
    priceEstimatePence: payload.priceEstimatePence, currency: 'gbp', status: 'draft',
    metadata: { inscriptionGuidance: String(payload.metadata?.inscriptionGuidance || '').slice(0,4000),
      layoutIsCurrent: payload.metadata?.layoutIsCurrent === true, source: 'email-proof' } };
  const requestKey = createHash('sha256').update(`${payload.requestId}:${JSON.stringify(content)}`).digest('hex');
  return { content, requestKey };
}

export async function emailSavedProof(payload, identity, dependencies = {}) {
  const { content, requestKey } = validateProofEmail(payload);
  const env = dependencies.env || process.env;
  if (!env.RESEND_API_KEY) throw Object.assign(new Error('Proof email is temporarily unavailable. You can still download your PDF.'), { statusCode: 503 });
  const db = dependencies.db || getSupabaseServiceClient();
  const limit = dependencies.consumeLimit || consumeRequestLimit;
  const find = () => db.from('proof_sessions').select('public_token,created_at,expires_at,metadata')
    .eq('metadata->>emailRequestKey', requestKey).maybeSingle();
  const lookup = await find();
  if (lookup.error) throw new Error('Could not check saved proof.');
  let proof = lookup.data;
  if (!proof) {
    await limit(privateRateKey('proof-email-ip', identity, env), 3, 3600);
    await limit(privateRateKey('proof-email-recipient', content.email, env), 3, 86400);
    await limit('proof-email-global', 30, 86400);
    content.metadata.emailRequestKey = requestKey;
    try {
      proof = await (dependencies.createProof || createProofSession)(content);
    } catch (error) {
      if (error?.code !== '23505') throw error;
      const existing = await find();
      if (existing.error || !existing.data) throw error;
      proof = existing.data;
    }
  }
  if (Date.parse(proof.expires_at) <= Date.now()) throw Object.assign(new Error('This saved proof has expired. Please save it again.'), { statusCode: 410 });
  if (proof.metadata?.emailProviderId) return { ok: true, status: 'accepted', duplicate: true };
  // Resend retains idempotency keys for 24 hours. An uncertain send must not
  // be retried past that window: ask for a new deliberate request instead.
  if (Date.parse(proof.created_at) < Date.now() - 23 * 60 * 60 * 1000) {
    throw Object.assign(new Error('This email request is too old to retry safely. Check your inbox, or refresh this page to request a new link.'), { statusCode: 409 });
  }
  const url = `https://instaplaque.co.uk/design?proof=${encodeURIComponent(proof.public_token)}`;
  const response = await (dependencies.fetchImpl || fetch)('https://api.resend.com/emails', {
    method: 'POST', signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `proof/${requestKey}` },
    body: JSON.stringify({ from: env.ORDER_EMAIL_FROM || 'InstaPlaque <orders@instaplaque.co.uk>', to: content.email,
      subject: 'Your saved InstaPlaque design',
      text: `Your plaque design is saved.\n\nOpen your private proof: ${url}\n\nYou can review, edit, download the PDF or continue to checkout. This link lasts 30 days. Anyone you share it with can view the proof.\n\nYou requested this email from InstaPlaque. No order or payment has been created, and you have not been subscribed to marketing.\n\nInstaPlaque\nhttps://instaplaque.co.uk/contact` }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.id) throw Object.assign(new Error('We could not confirm the email. Please retry without changing your design, or download the PDF.'), { statusCode: 502 });
  const { error } = await db.from('proof_sessions').update({ metadata: { ...content.metadata, emailRequestKey: requestKey, emailProviderId: result.id } }).eq('public_token', proof.public_token);
  if (error) throw Object.assign(new Error('Your email was accepted, but we could not save its receipt. Please retry without changing your design.'), { statusCode: 502 });
  return { ok: true, status: 'accepted' };
}
