begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
-- Match the existing owner-only admin workflow. This is a superset of the
-- previous values; it does not relabel any historical order or fulfilment.
alter table public.storefront_orders
  drop constraint storefront_orders_status_check,
  add constraint storefront_orders_status_check check (status in (
    'checkout_started','paid','proof_check','in_production','ready_to_dispatch',
    'dispatched','complete','issue','cancelled','refunded','archived'
  )),
  drop constraint storefront_orders_fulfilment_status_check,
  add constraint storefront_orders_fulfilment_status_check check (fulfilment_status in (
    'not_started','in_production','ready_to_dispatch','dispatched','delivered','issue','archived'
  ));
commit;
