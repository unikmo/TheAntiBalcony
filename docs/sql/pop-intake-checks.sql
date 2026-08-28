-- Run AFTER the staging draft. Everything in this test transaction rolls back.
begin;
do $$
begin
  if has_table_privilege('anon', 'public.anti_balcony_pop_requests', 'SELECT')
    or has_table_privilege('authenticated', 'public.anti_balcony_pop_requests', 'INSERT')
    or has_table_privilege('anon', 'public.anti_balcony_pop_cards', 'SELECT') then
    raise exception 'Unexpected public grants';
  end if;
  if exists(select 1 from pg_class where oid in ('public.anti_balcony_pop_requests'::regclass, 'public.anti_balcony_pop_cards'::regclass) and not relrowsecurity) then
    raise exception 'RLS disabled';
  end if;
end $$;
set local role service_role;
insert into public.anti_balcony_pop_requests
  (id, submission_key, payload_hash, offer, title, email, occasion, celebration, moment_date, total_cards, subtotal_cents, consent_version, consent_at, status)
values ('10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'test', 'keep', 'Staging test', 'sql-test@example.com', 'Company milestone', 'Team cheer', '2026-08-28', 50, 78700, 'test', now(), 'submitted');
do $$
begin
  begin
    update public.anti_balcony_pop_requests set subtotal_cents = 1 where id = '10000000-0000-4000-8000-000000000001';
    raise exception 'Invalid price accepted';
  exception when check_violation then null;
  end;
  begin
    update public.anti_balcony_pop_requests set public_approved = true where id = '10000000-0000-4000-8000-000000000001';
    raise exception 'Private paid request published';
  exception when check_violation then null;
  end;
  begin
    update public.anti_balcony_pop_requests set status = 'ready' where id = '10000000-0000-4000-8000-000000000001';
    raise exception 'Ready without memory accepted';
  exception when check_violation then null;
  end;
end $$;
rollback;
