create or replace function public.claim_storefront_order_proof(
  p_order_id text,
  p_stripe_checkout_session_id text,
  p_proof_package jsonb,
  p_event jsonb
)
returns setof public.storefront_orders
language sql
security definer
set search_path = public
as $$
  update public.storefront_orders
  set
    proof_package = p_proof_package,
    events = jsonb_build_array(p_event) || coalesce(events, '[]'::jsonb),
    updated_at = now()
  where id = p_order_id
    and stripe_checkout_session_id = p_stripe_checkout_session_id
    and nullif(proof_package ->> 'visualProofPng', '') is null
  returning *;
$$;

revoke all on function public.claim_storefront_order_proof(text, text, jsonb, jsonb) from public;
revoke all on function public.claim_storefront_order_proof(text, text, jsonb, jsonb) from anon;
revoke all on function public.claim_storefront_order_proof(text, text, jsonb, jsonb) from authenticated;
grant execute on function public.claim_storefront_order_proof(text, text, jsonb, jsonb) to service_role;
