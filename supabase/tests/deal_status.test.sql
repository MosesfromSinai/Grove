begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(9);
-- Verde Bowl's seeded Mon–Wed 2–5 PM deal. 2026-10-26 is a Monday; 2026-10-29 a Thursday.
select is(deal_status(d, '2026-10-26 15:00 America/Los_Angeles'), 'live', 'Mon 3 PM is live') from deals d where id = 'd0000000-0000-4000-8000-000000000015';
select is(deal_status(d, '2026-10-26 18:00 America/Los_Angeles'), 'scheduled', 'Mon 6 PM is scheduled') from deals d where id = 'd0000000-0000-4000-8000-000000000015';
select is(deal_status(d, '2026-10-29 15:00 America/Los_Angeles'), 'scheduled', 'Thu 3 PM is scheduled') from deals d where id = 'd0000000-0000-4000-8000-000000000015';
select is(deal_status(d, '2026-10-26 14:00 America/Los_Angeles'), 'live', 'window start is live') from deals d where id = 'd0000000-0000-4000-8000-000000000015';
select is(deal_status(d, '2026-10-26 17:00 America/Los_Angeles'), 'scheduled', 'window end is not live') from deals d where id = 'd0000000-0000-4000-8000-000000000015';
select is(deal_status(d, '2026-10-26 16:59:59 America/Los_Angeles'), 'live', 'last second of the window is live') from deals d where id = 'd0000000-0000-4000-8000-000000000015';
-- One-time deals: before, during, and from ends_at on.
select is(deal_status(d, d.starts_at - interval '1 second'), 'scheduled', 'before starts_at is scheduled') from deals d where id = 'd0000000-0000-4000-8000-000000000001';
select is(deal_status(d, d.starts_at), 'live', 'one-time deal is live from starts_at') from deals d where id = 'd0000000-0000-4000-8000-000000000001';
select is(deal_status(d, d.ends_at), 'ended', 'ended from ends_at on') from deals d where id = 'd0000000-0000-4000-8000-000000000001';
select * from finish();
rollback;
