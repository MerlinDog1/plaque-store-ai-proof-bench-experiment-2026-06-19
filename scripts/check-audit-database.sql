-- Run only within a transaction and ROLLBACK. No messages, provider calls or R2 writes.
do $$
declare session jsonb; result jsonb; token uuid := '00000000-0000-4000-8000-000000000123';
begin
  insert into public.storefront_orders(id,stripe_checkout_session_id,total_pence,metadata)
    values ('AUDIT-ROLLBACK-ONLY','cs_audit_rollback',9550,'{"checkoutRecoveryToken":"fixture"}');
  session:='{"id":"cs_audit_rollback","client_reference_id":"AUDIT-ROLLBACK-ONLY","metadata":{"order_id":"AUDIT-ROLLBACK-ONLY","source":"instaplaque"},"amount_total":9550,"currency":"gbp","payment_status":"unpaid","status":"complete"}';
  result:=public.apply_instaplaque_checkout_session('AUDIT-ROLLBACK-ONLY',session,'pending',false);
  if result->>'payment_status'<>'unpaid' then raise exception 'Pending marked paid'; end if;
  session:=session||'{"payment_status":"paid"}';
  result:=public.apply_instaplaque_checkout_session('AUDIT-ROLLBACK-ONLY',session,'paid',false);
  if result->>'payment_status'<>'paid' or result->>'status'<>'paid' then raise exception 'Payment missing'; end if;
  update public.storefront_orders set status='dispatched',fulfilment_status='dispatched',proof_package='{"preserved":true}' where id='AUDIT-ROLLBACK-ONLY';
  result:=public.apply_instaplaque_checkout_session('AUDIT-ROLLBACK-ONLY',session,'paid',false);
  if result->>'status'<>'dispatched' or jsonb_array_length(result->'events')<>2 then raise exception 'Duplicate payment regressed order'; end if;
  result:=public.apply_instaplaque_checkout_session('AUDIT-ROLLBACK-ONLY',session||'{"status":"expired","payment_status":"unpaid"}','expired',false);
  if result->>'status'<>'dispatched' or result->>'payment_status'<>'paid' then raise exception 'Late expiry regressed payment'; end if;
  result:=public.record_instaplaque_order_email('AUDIT-ROLLBACK-ONLY','{"id":"fixture","type":"customer-order-confirmation","status":"sent"}');
  result:=public.record_instaplaque_order_email('AUDIT-ROLLBACK-ONLY','{"id":"fixture","type":"customer-order-confirmation","status":"sent"}');
  if jsonb_array_length(result->'email_events')<>1 or result->'proof_package'->>'preserved'<>'true' or result->>'status'<>'dispatched' then raise exception 'Email overwrote order'; end if;
  if public.claim_instaplaque_stripe_event('evt_audit_rollback','checkout.session.completed',false,'AUDIT-ROLLBACK-ONLY',token)<>'claimed' then raise exception 'Event not claimed'; end if;
  if public.claim_instaplaque_stripe_event('evt_audit_rollback','checkout.session.completed',false,'AUDIT-ROLLBACK-ONLY',token)<>'busy' then raise exception 'Concurrent event claimed'; end if;
  update public.stripe_events set processed_at=now() where id='evt_audit_rollback';
  if public.claim_instaplaque_stripe_event('evt_audit_rollback','checkout.session.completed',false,'AUDIT-ROLLBACK-ONLY',token)<>'processed' then raise exception 'Duplicate event claimed'; end if;
  if not public.consume_instaplaque_limit('audit-rollback',2,60,1) or not public.consume_instaplaque_limit('audit-rollback',2,60,1) or public.consume_instaplaque_limit('audit-rollback',2,60,1) then raise exception 'Shared limit failed'; end if;
  update public.storefront_orders set status='proof_check',fulfilment_status='not_started' where id='AUDIT-ROLLBACK-ONLY';
  update public.storefront_orders set status='ready_to_dispatch',fulfilment_status='ready_to_dispatch' where id='AUDIT-ROLLBACK-ONLY';
  update public.storefront_orders set status='archived',fulfilment_status='archived' where id='AUDIT-ROLLBACK-ONLY';
  raise notice 'PASS atomic payment, late expiry, preserved fulfilment/artwork, email dedupe, event lease, durable rate limits and admin workflow statuses';
end $$;
