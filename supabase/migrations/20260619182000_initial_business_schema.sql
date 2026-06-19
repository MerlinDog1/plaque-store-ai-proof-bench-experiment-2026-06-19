create extension if not exists citext;
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  email citext unique,
  name text,
  phone text,
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.proof_sessions (
  id uuid primary key default gen_random_uuid(),
  public_token text not null unique default encode(gen_random_bytes(32), 'hex'),
  customer_id uuid references public.customers(id) on delete set null,
  email citext,
  status text not null default 'draft' check (
    status in ('draft', 'proof_ready', 'emailed', 'approved', 'abandoned', 'converted')
  ),
  plaque_state jsonb not null default '{}'::jsonb,
  wording text not null default '',
  generated_svg text,
  ai_reasoning text,
  price_estimate_pence integer not null default 0 check (price_estimate_pence >= 0),
  currency text not null default 'gbp',
  quote_flags jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.proof_artifacts (
  id uuid primary key default gen_random_uuid(),
  proof_session_id uuid not null references public.proof_sessions(id) on delete cascade,
  type text not null check (
    type in ('customer_svg', 'production_svg', 'pdf', 'preview_png', 'realistic_png', 'three_snapshot')
  ),
  storage_bucket text not null default 'proof-artifacts',
  storage_path text not null,
  mime_type text not null,
  width_mm numeric,
  height_mm numeric,
  checksum text,
  created_by text not null default 'local',
  created_at timestamptz not null default now(),
  unique (storage_bucket, storage_path)
);

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  public_token text not null unique default encode(gen_random_bytes(32), 'hex'),
  customer_id uuid references public.customers(id) on delete set null,
  email citext,
  status text not null default 'active' check (
    status in ('active', 'quoted', 'checkout_started', 'paid', 'expired', 'cancelled')
  ),
  subtotal_pence integer not null default 0 check (subtotal_pence >= 0),
  delivery_pence integer not null default 0 check (delivery_pence >= 0),
  total_pence integer not null default 0 check (total_pence >= 0),
  currency text not null default 'gbp',
  quote_required boolean not null default false,
  quote_flags jsonb not null default '{}'::jsonb,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  proof_session_id uuid not null references public.proof_sessions(id) on delete restrict,
  product_type text not null,
  plaque_state jsonb not null default '{}'::jsonb,
  wording text not null default '',
  quantity integer not null default 1 check (quantity > 0),
  unit_price_pence integer not null default 0 check (unit_price_pence >= 0),
  total_price_pence integer not null default 0 check (total_price_pence >= 0),
  quote_flags jsonb not null default '{}'::jsonb,
  production_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  cart_id uuid not null references public.carts(id) on delete restrict,
  customer_id uuid not null references public.customers(id) on delete restrict,
  email citext not null,
  status text not null default 'draft' check (
    status in (
      'draft', 'awaiting_payment', 'payment_failed', 'paid', 'proof_review',
      'production_ready', 'in_production', 'quality_check', 'dispatched',
      'complete', 'cancelled', 'refunded'
    )
  ),
  payment_status text not null default 'unpaid' check (
    payment_status in ('unpaid', 'requires_action', 'paid', 'refunded', 'failed')
  ),
  fulfilment_status text not null default 'not_started' check (
    fulfilment_status in ('not_started', 'in_production', 'dispatched', 'delivered')
  ),
  total_pence integer not null default 0 check (total_pence >= 0),
  currency text not null default 'gbp',
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  shipping_address jsonb not null default '{}'::jsonb,
  billing_address jsonb not null default '{}'::jsonb,
  quote_flags jsonb not null default '{}'::jsonb,
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  proof_session_id uuid not null references public.proof_sessions(id) on delete restrict,
  product_type text not null,
  plaque_state jsonb not null default '{}'::jsonb,
  wording text not null default '',
  quantity integer not null default 1 check (quantity > 0),
  unit_price_pence integer not null default 0 check (unit_price_pence >= 0),
  total_price_pence integer not null default 0 check (total_price_pence >= 0),
  production_artifact_id uuid references public.proof_artifacts(id) on delete set null,
  production_status text not null default 'pending' check (
    production_status in ('pending', 'ready', 'sent_to_supplier', 'made', 'issue')
  ),
  created_at timestamptz not null default now()
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  type text not null check (type in ('shipping', 'billing')),
  name text not null,
  line1 text not null,
  line2 text,
  city text not null,
  county text,
  postcode text not null,
  country text not null default 'GB',
  created_at timestamptz not null default now()
);

create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  proof_session_id uuid references public.proof_sessions(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  event_type text not null,
  recipient citext not null,
  resend_email_id text,
  status text not null default 'queued' check (
    status in ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed')
  ),
  template text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.stripe_events (
  id text primary key,
  type text not null,
  livemode boolean not null default false,
  processed_at timestamptz,
  related_order_id uuid references public.orders(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_notes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  proof_session_id uuid references public.proof_sessions(id) on delete cascade,
  note text not null,
  created_by text not null,
  created_at timestamptz not null default now(),
  check (order_id is not null or proof_session_id is not null)
);

create index if not exists proof_sessions_public_token_idx on public.proof_sessions(public_token);
create index if not exists proof_sessions_customer_id_idx on public.proof_sessions(customer_id);
create index if not exists proof_sessions_status_idx on public.proof_sessions(status);
create index if not exists proof_artifacts_proof_session_id_idx on public.proof_artifacts(proof_session_id);
create index if not exists carts_public_token_idx on public.carts(public_token);
create index if not exists carts_customer_id_idx on public.carts(customer_id);
create index if not exists orders_order_number_idx on public.orders(order_number);
create index if not exists orders_customer_id_idx on public.orders(customer_id);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists stripe_events_processed_at_idx on public.stripe_events(processed_at);

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

drop trigger if exists proof_sessions_set_updated_at on public.proof_sessions;
create trigger proof_sessions_set_updated_at
before update on public.proof_sessions
for each row execute function public.set_updated_at();

drop trigger if exists carts_set_updated_at on public.carts;
create trigger carts_set_updated_at
before update on public.carts
for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

alter table public.customers enable row level security;
alter table public.proof_sessions enable row level security;
alter table public.proof_artifacts enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.addresses enable row level security;
alter table public.email_events enable row level security;
alter table public.stripe_events enable row level security;
alter table public.admin_notes enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('proof-artifacts', 'proof-artifacts', false, 10485760, array['image/svg+xml', 'image/png', 'image/jpeg', 'application/pdf']),
  ('production-artifacts', 'production-artifacts', false, 10485760, array['image/svg+xml', 'application/pdf']),
  ('customer-uploads', 'customer-uploads', false, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'application/pdf']),
  ('material-assets', 'material-assets', true, 10485760, array['image/png', 'image/jpeg', 'image/webp']),
  ('email-assets', 'email-assets', false, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
