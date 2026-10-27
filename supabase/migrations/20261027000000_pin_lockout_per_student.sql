-- PIN lockout per student per business (#15), extending Celso's helpers from #128. Keyed by
-- business only, one person's 5 bad PINs locked the PIN backup for every student there.

delete from public.pin_attempts; -- attempt log only; nothing has used it yet
alter table public.pin_attempts
  add column student_id uuid not null references public.profiles (id) on delete cascade;
drop index public.pin_attempts_business_time_idx;
create index pin_attempts_business_student_time_idx on public.pin_attempts (business_id, student_id, attempted_at);

drop function public.is_pin_rate_limited(uuid);
drop function public.record_pin_attempt(uuid, boolean);

-- True once this student has 5 failed PINs at this business in the last 15 minutes.
create function public.is_pin_rate_limited(bid uuid, sid uuid)
returns boolean
language sql security definer stable set search_path = ''
as $$
  select count(*) >= 5
  from public.pin_attempts
  where business_id = bid
    and student_id = sid
    and success = false
    and attempted_at > now() - interval '15 minutes';
$$;

-- Records one PIN attempt by this student at this business, after the result is known.
create function public.record_pin_attempt(bid uuid, sid uuid, succeeded boolean)
returns void
language sql security definer set search_path = ''
as $$
  insert into public.pin_attempts (business_id, student_id, success) values (bid, sid, succeeded);
$$;

revoke execute on function public.is_pin_rate_limited(uuid, uuid) from public, anon, authenticated;
grant execute on function public.is_pin_rate_limited(uuid, uuid) to service_role;
revoke execute on function public.record_pin_attempt(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.record_pin_attempt(uuid, uuid, boolean) to service_role;
