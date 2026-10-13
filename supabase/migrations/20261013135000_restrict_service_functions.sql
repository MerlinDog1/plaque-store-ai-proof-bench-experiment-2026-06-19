-- Restore intended service-only access after the shared-backend migration.
-- Keep postgres (the scheduled-worker owner) and service_role access intact.
begin;
revoke all on function public.claim_storefront_order_proof(text, text, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.claim_storefront_order_proof(text, text, jsonb, jsonb) to service_role;
revoke all on function public.pim_invoke_worker() from public, anon, authenticated;
grant execute on function public.pim_invoke_worker() to service_role;
alter function public.set_updated_at() set search_path = '';

do $$
declare target regprocedure;
begin
  foreach target in array array[
    'public.claim_storefront_order_proof(text,text,jsonb,jsonb)'::regprocedure,
    'public.pim_invoke_worker()'::regprocedure
  ] loop
    if has_function_privilege('anon', target, 'execute')
       or has_function_privilege('authenticated', target, 'execute')
       or not has_function_privilege('service_role', target, 'execute')
       or not has_function_privilege('postgres', target, 'execute') then
      raise exception 'Unexpected function permissions for %', target;
    end if;
  end loop;
end $$;
commit;
