-- Cookie-free, first-party designer counts. No customer content or identifiers.
create table public.instaplaque_usage_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  visit_id uuid not null,
  event text not null check (event in ('visit','designer_open','designer_step','layout_result','ai_call','proof_saved','proof_emailed','design_request','checkout_start','paid')),
  order_id text,
  site text not null check (site in ('live','preview','local')),
  deployment text not null,
  device text not null check (device in ('phone','tablet','desktop','unknown')),
  country text not null default '', region text not null default '', town text not null default '',
  internal boolean not null default false, test boolean not null default false, test_reason text,
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object' and octet_length(details::text) <= 2048),
  unique (event,order_id)
);
create index instaplaque_usage_time on public.instaplaque_usage_events(created_at);
create index instaplaque_usage_visit on public.instaplaque_usage_events(visit_id,created_at);
create index instaplaque_usage_order on public.instaplaque_usage_events(order_id) where order_id is not null;
create index instaplaque_usage_event on public.instaplaque_usage_events(event,created_at);
alter table public.instaplaque_usage_events enable row level security;
revoke all on public.instaplaque_usage_events from public, anon, authenticated;
revoke all on sequence public.instaplaque_usage_events_id_seq from public, anon, authenticated;
grant all on public.instaplaque_usage_events to service_role;
grant usage,select on sequence public.instaplaque_usage_events_id_seq to service_role;
