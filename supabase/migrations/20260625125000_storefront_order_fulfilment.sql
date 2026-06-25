create table if not exists public.storefront_orders (
  id text primary key,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  customer_email citext,
  customer_name text,
  status text not null default 'checkout_started' check (
    status in ('checkout_started', 'paid', 'in_production', 'dispatched', 'complete', 'issue', 'cancelled', 'refunded')
  ),
  payment_status text not null default 'unpaid' check (
    payment_status in ('unpaid', 'paid', 'failed', 'refunded')
  ),
  fulfilment_status text not null default 'not_started' check (
    fulfilment_status in ('not_started', 'in_production', 'dispatched', 'delivered', 'issue')
  ),
  total_pence integer not null default 0 check (total_pence >= 0),
  currency text not null default 'gbp',
  product_title text not null default 'Custom plaque',
  inscription text not null default '',
  plaque_state jsonb not null default '{}'::jsonb,
  price_breakdown jsonb not null default '{}'::jsonb,
  proof_package jsonb not null default '{}'::jsonb,
  shipping_address jsonb not null default '{}'::jsonb,
  stripe_session jsonb not null default '{}'::jsonb,
  email_events jsonb not null default '[]'::jsonb,
  events jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists storefront_orders_status_idx on public.storefront_orders(status);
create index if not exists storefront_orders_payment_status_idx on public.storefront_orders(payment_status);
create index if not exists storefront_orders_customer_email_idx on public.storefront_orders(customer_email);
create index if not exists storefront_orders_created_at_idx on public.storefront_orders(created_at desc);

drop trigger if exists storefront_orders_set_updated_at on public.storefront_orders;
create trigger storefront_orders_set_updated_at
before update on public.storefront_orders
for each row execute function public.set_updated_at();

alter table public.storefront_orders enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('order-proofs', 'order-proofs', false, 10485760, array['image/svg+xml', 'image/png', 'application/pdf']),
  ('order-uploads', 'order-uploads', false, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'application/pdf'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
