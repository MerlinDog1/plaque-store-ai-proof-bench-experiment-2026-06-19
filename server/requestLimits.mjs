import { createHmac } from 'node:crypto';
import { getSupabaseServiceClient } from './supabase.mjs';
export function privateRateKey(scope, identity, env = process.env) {
  const secret = env.ADMIN_AUTH_SECRET || env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw Object.assign(new Error('Request protection is unavailable.'), { statusCode: 503, code: 'request_protection' });
  return `${scope}:${createHmac('sha256', secret).update(String(identity)).digest('hex')}`;
}
export async function consumeRequestLimit(key, limit, seconds, cost = 1, db = getSupabaseServiceClient()) {
  if (!db) throw Object.assign(new Error('Request protection is unavailable.'), { statusCode: 503, code: 'request_protection' });
  const { data, error } = await db.rpc('consume_instaplaque_limit', { p_key: key, p_limit: limit, p_seconds: seconds, p_cost: cost });
  if (error) throw Object.assign(new Error('Request protection is temporarily unavailable.'), { statusCode: 503, code: 'request_protection' });
  if (data !== true) throw Object.assign(new Error('Request limit reached. Please try again later.'), { statusCode: 429, code: 'request_protection' });
}
