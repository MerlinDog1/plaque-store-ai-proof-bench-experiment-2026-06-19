import { randomUUID } from 'node:crypto';
import { getSupabaseServiceClient } from './supabase.mjs';
import { getOrderById, getOrderByStripeSession, markOrderPaidFromSession } from './orders.mjs';
import { isOnePoundTestOrder } from './onePoundTest.mjs';

const supported = new Set(['checkout.session.completed', 'checkout.session.expired',
  'checkout.session.async_payment_succeeded', 'checkout.session.async_payment_failed']);

export function checkoutLifecycle(event) {
  if (!supported.has(event?.type)) return null;
  const session = event.data?.object;
  if (session?.metadata?.source !== 'instaplaque') return null;
  if (event.type === 'checkout.session.expired') return 'expired';
  if (event.type === 'checkout.session.async_payment_failed') return 'failed';
  return session.payment_status === 'paid' ? 'paid' : 'pending';
}

export async function handleStripeEvent(event, dependencies = {}) {
  const kind = checkoutLifecycle(event);
  if (!kind) return { ignored: true };
  if (!/^evt_[A-Za-z0-9_]+$/.test(event.id || '')) throw new Error('Invalid Stripe event identifier.');
  const session = event.data.object;
  const find = dependencies.findOrder || (async () => await getOrderByStripeSession(session.id)
    || await getOrderById(session.client_reference_id));
  const order = await find(session);
  if (!order || order.stripeCheckoutSessionId !== session.id
    || order.id !== session.client_reference_id || order.id !== session.metadata.order_id
    || order.totalPence !== session.amount_total || order.currency.toLowerCase() !== session.currency?.toLowerCase()) {
    throw new Error('Stripe checkout could not be matched to its server order.');
  }
  if (typeof order.stripeSession?.livemode === 'boolean' && order.stripeSession.livemode !== session.livemode) {
    throw new Error('Stripe checkout mode mismatch.');
  }
  const db = dependencies.db || getSupabaseServiceClient();
  if (!db) throw new Error('Durable Stripe event storage is unavailable.');
  const token = randomUUID();
  const { data: claim, error: claimError } = await db.rpc('claim_instaplaque_stripe_event', {
    p_id: event.id, p_type: event.type, p_live: Boolean(event.livemode), p_order_id: order.id, p_token: token,
  });
  if (claimError) throw claimError;
  if (claim === 'processed') return { duplicate: true };
  if (claim !== 'claimed') {
    const error = new Error('Stripe event is being processed; retry shortly.');
    error.statusCode = 503;
    throw error;
  }
  try {
    if (kind === 'paid') {
      await (dependencies.markPaid || markOrderPaidFromSession)(session);
    } else {
      const { error } = await db.rpc('apply_instaplaque_checkout_session', {
        p_order_id: order.id, p_session: session, p_kind: kind, p_test: isOnePoundTestOrder(order),
      });
      if (error) throw error;
    }
    const { error } = await db.from('stripe_events').update({ processed_at: new Date().toISOString(),
      processing_token: null, error: null }).eq('id', event.id).eq('processing_token', token);
    if (error) throw error;
    return { processed: true };
  } catch (error) {
    // No payment/customer payloads or provider responses in the event ledger.
    await db.from('stripe_events').update({ processing_token: null, error: 'processing_failed' })
      .eq('id', event.id).eq('processing_token', token);
    throw error;
  }
}
