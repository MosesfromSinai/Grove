begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

-- Make discovery deterministic without relying on the time the seed was loaded.
update deals set starts_at = now() - interval '1 day', ends_at = now() - interval '1 hour',
  active_days = null, daily_start = null, daily_end = null;
update deals set ends_at = now() + interval '2 hours'
  where id in ('d0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000003');
update deals set visibility = 'link_only' where id = 'd0000000-0000-4000-8000-000000000003';
update businesses set hours = (select jsonb_object_agg(day, '[["00:00","00:00"]]'::jsonb)
  from unnest(array['mon','tue','wed','thu','fri','sat','sun']) day);
update businesses set hours = '{}' where id = 'b0000000-0000-4000-8000-000000000008';

select ok(business_is_open('{"mon":[["11:00","01:00"]]}', 'America/Los_Angeles', '2026-10-27 00:30 America/Los_Angeles'), 'yesterday overnight hours remain open');
select ok(not business_is_open('{"mon":[["11:00","01:00"]]}', 'America/Los_Angeles', '2026-10-27 01:00 America/Los_Angeles'), 'overnight close is exclusive');
select ok(business_is_open('{"mon":[["11:00","14:00"],["17:00","21:00"]]}', 'America/Los_Angeles', '2026-10-26 18:00 America/Los_Angeles'), 'multiple daily periods work');
select ok(not business_is_open('{"mon":[["11:00","14:00"],["17:00","21:00"]]}', 'America/Los_Angeles', '2026-10-26 15:00 America/Los_Angeles'), 'between periods is closed');
select ok(not business_is_open('{}', 'America/Los_Angeles'), 'missing hours are closed');
select ok(not business_is_open('{"mon":"invalid"}', 'America/Los_Angeles', '2026-10-26 15:00 America/Los_Angeles'), 'malformed hours fail closed');
select ok(not business_is_open('{"mon":[["12:99","19:00"]]}', 'America/Los_Angeles', '2026-10-26 15:00 America/Los_Angeles'), 'invalid minutes fail closed');
select throws_ok($$select * from deals_nearby(91, 0, 3000)$$, '22023', null, 'out-of-range latitude rejected');
select throws_ok($$select * from deals_nearby(0, 0, 0)$$, '22023', null, 'invalid radius rejected');

set local role anon;
select is((select count(distinct business_id) from deals_nearby(33.9737,-117.3281,3000)), 8::bigint, 'anon can list public-safe businesses under column grants');
select is((select count(*) from deals_nearby(33.9737,-117.3281,3000)), 9::bigint, 'two deals at one business produce two rows');
select is((select count(*) from deals_nearby(33.9737,-117.3281,3000,false,true)), 2::bigint, 'has deals drops empty businesses and link-only deals');
select is((select count(*) from deals_nearby(33.9737,-117.3281,3000) where deal_id = 'd0000000-0000-4000-8000-000000000003'), 0::bigint, 'link-only deal never appears');
select ok((select bool_and(not has_deal and title is null and live_until is null) from deals_nearby(33.9737,-117.3281,3000) where business_id = 'b0000000-0000-4000-8000-000000000002'), 'business with only a hidden deal exposes no deal metadata');
select is((select count(*) from deals_nearby(33.9737,-117.3281,3000,true) where not open_now), 0::bigint, 'open-now excludes closed places');
select is((select count(distinct business_id) from deals_nearby(33.9737,-117.3281,800)), 4::bigint, 'walking radius filters by geography in metres');
select is((select count(*) from deals_nearby(0,0,3000)), 0::bigint, 'distant origin returns no businesses');
select ok((select bool_and(live_until = ends_at) from deals_nearby(33.9737,-117.3281,3000,false,true)), 'one-time live windows end at ends_at');
select ok((select bool_and(distance_m >= 0 and distance_m <= 3000) from deals_nearby(33.9737,-117.3281,3000)), 'returned distance is within radius');
reset role;

-- A repeating public deal is visible only within its current campus-day window.
update deals set ends_at = null, active_days = array[lower(to_char(now() at time zone 'America/Los_Angeles','Dy'))],
  daily_start = '00:00', daily_end = '23:59:59.999999'
  where id = 'd0000000-0000-4000-8000-000000000015';
select is((select count(*) from deals_nearby(33.9737,-117.3281,3000) where deal_id = 'd0000000-0000-4000-8000-000000000015'), 1::bigint, 'repeating deal appears in its active window');
select is((select live_until from deals_nearby(33.9737,-117.3281,3000) where deal_id = 'd0000000-0000-4000-8000-000000000015'),
  ((now() at time zone 'America/Los_Angeles')::date + time '23:59:59.999999') at time zone 'America/Los_Angeles', 'repeating live-until is the exact campus window end');
update deals set active_days = array[lower(to_char((now() at time zone 'America/Los_Angeles') + interval '1 day','Dy'))]
  where id = 'd0000000-0000-4000-8000-000000000015';
select is((select count(*) from deals_nearby(33.9737,-117.3281,3000) where deal_id = 'd0000000-0000-4000-8000-000000000015'), 0::bigint, 'repeating deal is absent on an inactive day');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000002', true);
select is((select count(*) from deals where id = 'd0000000-0000-4000-8000-000000000003'), 1::bigint, 'owner can read own link-only deal directly');
select is((select count(*) from deals_nearby(33.9737,-117.3281,3000) where deal_id = 'd0000000-0000-4000-8000-000000000003'), 0::bigint, 'discovery hides link-only deals even from their owner');
select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000001', true);
select is(get_my_business() -> 'business' ->> 'id', 'b0000000-0000-4000-8000-000000000001', 'dashboard returns the signed-in owner’s actual business');
select ok(not (get_my_business() -> 'business' ? 'staff_pin'), 'dashboard never returns the staff PIN hash');
select is(update_truck_location('b0000000-0000-4000-8000-000000000002',33.97,-117.32) ->> 'error', 'NOT_OWNER', 'owner cannot move another owner’s truck');
select is(update_truck_location('b0000000-0000-4000-8000-000000000001',91,-117.32) ->> 'error', 'INVALID_LOCATION', 'invalid coordinates leave pin alone');
select is(update_truck_location('b0000000-0000-4000-8000-000000000001',33.99,-117.35) ->> 'ok', 'true', 'owner can move own truck');
select is((select lat from businesses where id = 'b0000000-0000-4000-8000-000000000001'), 33.99::float8, 'generated latitude follows the saved PostGIS location');
select is((select lng from businesses where id = 'b0000000-0000-4000-8000-000000000001'), (-117.35)::float8, 'generated longitude follows the saved PostGIS location');
select is((select lat from deals_nearby(33.99,-117.35,1) limit 1),33.99::float8,'discovery sees the moved pin');
select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000009', true);
select is(update_truck_location('b0000000-0000-4000-8000-000000000001',33.97,-117.32) ->> 'error', 'NOT_OWNER', 'staff cannot move the truck');
reset role;
insert into redemptions (deal_id, business_id, student_id, redeemed_on, method)
values ('d0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000002',
  'a0000000-0000-4000-8000-000000000009', current_date, 'pin');
set local role authenticated;
select is((select count(*) from deals where id = 'd0000000-0000-4000-8000-000000000003'), 1::bigint, 'past redeemer can read the link-only deal directly');
select is((select count(*) from deals_nearby(33.9737,-117.3281,3000) where deal_id = 'd0000000-0000-4000-8000-000000000003'), 0::bigint, 'discovery hides link-only deals from past redeemers');
select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000003', true);
select is(update_truck_location('b0000000-0000-4000-8000-000000000003',33.97,-117.32) ->> 'error', 'NOT_A_TRUCK', 'restaurant location is not moved by truck action');
select set_config('request.jwt.claim.sub', '', true);
select is(update_truck_location('b0000000-0000-4000-8000-000000000001',33.97,-117.32) ->> 'error', 'NOT_SIGNED_IN', 'missing identity cannot move a truck');
reset role;
select * from finish();
rollback;
