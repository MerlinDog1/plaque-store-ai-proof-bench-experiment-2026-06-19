begin;
-- Stripe IDs are globally unique; only InstaPlaque events enter this ledger.
alter table public.stripe_events add column if not exists processing_token uuid;
alter table public.stripe_events add column if not exists processing_started_at timestamptz;

create or replace function public.claim_instaplaque_stripe_event(p_id text, p_type text, p_live boolean, p_order_id text, p_token uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare event_row public.stripe_events;
begin
  insert into public.stripe_events(id,type,livemode,payload)
    values(p_id,p_type,p_live,jsonb_build_object('site_id','instaplaque','order_id',p_order_id))
    on conflict (id) do nothing;
  select * into event_row from public.stripe_events where id=p_id for update;
  if event_row.payload->>'site_id' is distinct from 'instaplaque' then raise exception 'Event belongs to another integration'; end if;
  if event_row.processed_at is not null then return 'processed'; end if;
  if event_row.processing_token is not null and event_row.processing_started_at > now()-interval '5 minutes' then return 'busy'; end if;
  update public.stripe_events set processing_token=p_token,processing_started_at=now(),error=null where id=p_id;
  return 'claimed';
end $$;

-- Row locks prevent webhook retries, browser returns and late expiry events
-- from undoing a payment, dispatch, proof attachment or email record.
create or replace function public.apply_instaplaque_checkout_session(p_order_id text, p_session jsonb, p_kind text, p_test boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare current_order public.storefront_orders; shipping jsonb; customer jsonb; next_status text;
begin
  select * into current_order from public.storefront_orders where id=p_order_id for update;
  if not found then raise exception 'Order missing'; end if;
  if current_order.stripe_checkout_session_id is distinct from p_session->>'id'
     or p_session->>'client_reference_id' is distinct from current_order.id
     or p_session->'metadata'->>'order_id' is distinct from current_order.id
     or lower(p_session->>'currency') is distinct from lower(current_order.currency)
     or (p_session->>'amount_total')::integer is distinct from current_order.total_pence then
    raise exception 'Checkout session mismatch';
  end if;
  if current_order.payment_status in ('paid','refunded') then return to_jsonb(current_order); end if;
  if p_kind='paid' then
    if p_session->>'payment_status' is distinct from 'paid' or p_session->>'status' is distinct from 'complete' then
      raise exception 'Checkout is not paid and complete';
    end if;
    shipping:=coalesce(p_session->'collected_information'->'shipping_details',p_session->'shipping_details',p_session->'shipping','{}'::jsonb);
    customer:=coalesce(p_session->'customer_details','{}'::jsonb);
    update public.storefront_orders set
      payment_status='paid',
      status=case when p_test then 'issue' when status in ('checkout_started','cancelled') then 'paid' else status end,
      fulfilment_status=case when p_test then 'issue' else fulfilment_status end,
      customer_email=coalesce(nullif(customer->>'email',''),nullif(p_session->>'customer_email',''),customer_email::text),
      customer_name=coalesce(nullif(customer->>'name',''),nullif(shipping->>'name',''),customer_name),
      stripe_payment_intent_id=coalesce(p_session->'payment_intent'->>'id',p_session->>'payment_intent',stripe_payment_intent_id),
      shipping_address=case when shipping->'address' is not null then shipping->'address'||jsonb_build_object('name',shipping->>'name','phone',customer->>'phone') else shipping_address end,
      stripe_session=p_session,paid_at=coalesce(paid_at,now()),
      metadata=metadata||jsonb_build_object('checkoutRecoveryToken',null,'paymentReceiptPending',not p_test),
      events=jsonb_build_array(jsonb_build_object('type','payment_received','label','Payment received','at',now()))||events
    where id=p_order_id returning * into current_order;
  elsif p_kind in ('expired','failed','pending') then
    if current_order.metadata->>'checkoutLifecycle' = p_kind then return to_jsonb(current_order); end if;
    -- A delayed completion or failure cannot regress a terminal expiry.
    if p_kind='pending' and current_order.metadata->>'checkoutLifecycle' in ('expired','failed') then return to_jsonb(current_order); end if;
    update public.storefront_orders set
      payment_status=case when p_kind='failed' then 'failed' else payment_status end,
      status=case when p_kind='expired' and status='checkout_started' then 'cancelled' else status end,
      stripe_session=p_session,metadata=metadata||jsonb_build_object('checkoutLifecycle',p_kind),
      events=jsonb_build_array(jsonb_build_object('type','checkout_'||p_kind,'label','Checkout '||p_kind,'at',now()))||events
    where id=p_order_id returning * into current_order;
  else raise exception 'Unsupported checkout lifecycle';
  end if;
  return to_jsonb(current_order);
end $$;

create or replace function public.record_instaplaque_order_email(p_order_id text, p_event jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare current_order public.storefront_orders;
begin
  select * into current_order from public.storefront_orders where id=p_order_id for update;
  if not found then raise exception 'Order missing'; end if;
  if exists(select 1 from jsonb_array_elements(current_order.email_events) e where e->>'id'=p_event->>'id') then return to_jsonb(current_order); end if;
  update public.storefront_orders set
    email_events=jsonb_build_array(p_event)||email_events,
    events=jsonb_build_array(jsonb_build_object('type','email','label',(p_event->>'type')||' email '||(p_event->>'status'),'at',p_event->>'at'))||events
    where id=p_order_id returning * into current_order;
  return to_jsonb(current_order);
end $$;

create or replace function public.complete_instaplaque_payment_emails(p_order_id text)
returns void language sql security definer set search_path = '' as $$
  update public.storefront_orders set metadata=metadata||'{"paymentReceiptPending":false}'::jsonb
  where id=p_order_id and payment_status='paid';
$$;

revoke all on function public.claim_instaplaque_stripe_event(text,text,boolean,text,uuid) from public,anon,authenticated;
revoke all on function public.apply_instaplaque_checkout_session(text,jsonb,text,boolean) from public,anon,authenticated;
revoke all on function public.record_instaplaque_order_email(text,jsonb) from public,anon,authenticated;
grant execute on function public.claim_instaplaque_stripe_event(text,text,boolean,text,uuid) to service_role;
grant execute on function public.apply_instaplaque_checkout_session(text,jsonb,text,boolean) to service_role;
grant execute on function public.record_instaplaque_order_email(text,jsonb) to service_role;
revoke all on function public.complete_instaplaque_payment_emails(text) from public,anon,authenticated;
grant execute on function public.complete_instaplaque_payment_emails(text) to service_role;
commit;
