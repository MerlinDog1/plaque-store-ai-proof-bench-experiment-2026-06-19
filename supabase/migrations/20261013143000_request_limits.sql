begin;
create table if not exists public.instaplaque_request_limits (
  key text primary key, used integer not null, resets_at timestamptz not null
);
alter table public.instaplaque_request_limits enable row level security;
revoke all on public.instaplaque_request_limits from anon, authenticated;
create or replace function public.consume_instaplaque_limit(p_key text, p_limit integer, p_seconds integer, p_cost integer default 1)
returns boolean language plpgsql security definer set search_path = '' as $$
declare used_count integer;
begin
  if length(p_key)>150 or p_limit<1 or p_seconds<1 or p_cost<1 or p_cost>p_limit then return false; end if;
  delete from public.instaplaque_request_limits where resets_at<now()-interval '1 day';
  insert into public.instaplaque_request_limits(key,used,resets_at) values(p_key,p_cost,now()+make_interval(secs=>p_seconds))
  on conflict (key) do update set
    used=case when instaplaque_request_limits.resets_at<=now() then p_cost else instaplaque_request_limits.used+p_cost end,
    resets_at=case when instaplaque_request_limits.resets_at<=now() then now()+make_interval(secs=>p_seconds) else instaplaque_request_limits.resets_at end
  where instaplaque_request_limits.resets_at<=now() or instaplaque_request_limits.used+p_cost<=p_limit
  returning used into used_count;
  return used_count is not null;
end $$;
revoke all on function public.consume_instaplaque_limit(text,integer,integer,integer) from public,anon,authenticated;
grant execute on function public.consume_instaplaque_limit(text,integer,integer,integer) to service_role;
create unique index if not exists proof_email_request_key on public.proof_sessions((metadata->>'emailRequestKey'))
where metadata->>'emailRequestKey' is not null;
commit;
