-- Live-now check (#102), the same rule as dealStatus() in lib/supabase/deal-status.ts:
-- scheduled before starts_at, ended from ends_at on. In between, a one-time deal is live;
-- a repeating deal is live only on its active days inside [daily_start, daily_end), campus time.
-- Security definer so the campus timezone lookup works under any caller's RLS; it returns
-- only a status, so it's safe for anyone to call.
create function public.deal_status(d public.deals, at_time timestamptz default now())
returns text
language sql stable security definer set search_path = ''
as $$
  select case
    when at_time < d.starts_at then 'scheduled'
    when d.ends_at is not null and at_time >= d.ends_at then 'ended'
    when d.active_days is null then 'live'
    when (array['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])[extract(isodow from campus.local)::int] = any (d.active_days)
      and date_trunc('minute', campus.local)::time >= d.daily_start
      and date_trunc('minute', campus.local)::time < d.daily_end then 'live'
    else 'scheduled'
  end
  from (
    select at_time at time zone c.timezone as local
    from public.businesses b
    join public.campuses c on c.id = b.campus_id
    where b.id = d.business_id
  ) campus;
$$;

-- Opens a deal from its link (/deals/<id>), public or link-only. RLS keeps link-only deals out of
-- table reads, so this is the only way to fetch one; the uuid is what keeps it unguessable.
create function public.deal_by_id(deal_id uuid)
returns setof public.deals
language sql stable security definer set search_path = ''
as $$
  select * from public.deals where id = deal_by_id.deal_id;
$$;

revoke execute on function public.deal_by_id(uuid) from public;
grant execute on function public.deal_by_id(uuid) to anon, authenticated, service_role;
