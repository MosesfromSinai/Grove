begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(9);
-- Verde Bowl's seeded Mon–Wed 2–5 PM deal. The seed starts it 10 days before each reset, so the
-- test uses this week's Monday and Thursday (campus time), which always fall after starts_at.
create temporary table clock as
select date_trunc('week', now() at time zone 'America/Los_Angeles') as monday;
create function pg_temp.at(day_offset int, hhmmss text) returns timestamptz language sql as $$
  select (monday + day_offset * interval '1 day' + hhmmss::interval) at time zone 'America/Los_Angeles' from clock;
$$;
select is(deal_status(d, pg_temp.at(0, '15:00')), 'live', 'Mon 3 PM is live') from deals d where id = 'd0000000-0000-4000-8000-000000000015';
select is(deal_status(d, pg_temp.at(0, '18:00')), 'scheduled', 'Mon 6 PM is scheduled') from deals d where id = 'd0000000-0000-4000-8000-000000000015';
select is(deal_status(d, pg_temp.at(3, '15:00')), 'scheduled', 'Thu 3 PM is scheduled') from deals d where id = 'd0000000-0000-4000-8000-000000000015';
select is(deal_status(d, pg_temp.at(0, '14:00')), 'live', 'window start is live') from deals d where id = 'd0000000-0000-4000-8000-000000000015';
select is(deal_status(d, pg_temp.at(0, '17:00')), 'scheduled', 'window end is not live') from deals d where id = 'd0000000-0000-4000-8000-000000000015';
select is(deal_status(d, pg_temp.at(0, '16:59:59')), 'live', 'last second of the window is live') from deals d where id = 'd0000000-0000-4000-8000-000000000015';
-- One-time deals: before, during, and from ends_at on.
select is(deal_status(d, d.starts_at - interval '1 second'), 'scheduled', 'before starts_at is scheduled') from deals d where id = 'd0000000-0000-4000-8000-000000000001';
select is(deal_status(d, d.starts_at), 'live', 'one-time deal is live from starts_at') from deals d where id = 'd0000000-0000-4000-8000-000000000001';
select is(deal_status(d, d.ends_at), 'ended', 'ended from ends_at on') from deals d where id = 'd0000000-0000-4000-8000-000000000001';
select * from finish();
rollback;
