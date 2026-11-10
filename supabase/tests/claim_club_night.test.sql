begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(14);

insert into auth.users (id, email) values ('5e000000-0000-4000-8000-000000000002', 'claim-test@student.example');
insert into profiles (id, email, verified_student) values ('5e000000-0000-4000-8000-000000000002', 'claim-test@student.example', true)
  on conflict (id) do update set verified_student = true;
-- An open night two days out, and one that ended yesterday, at Pepper Tree Pizza Co.
insert into club_nights (id, business_id, night_date, start_time, end_time, giveback) values
  ('c1000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000004', (now() at time zone 'America/Los_Angeles')::date + 2, '18:00', '21:00', '15% back to your club'),
  ('c1000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000004', (now() at time zone 'America/Los_Angeles')::date - 1, '18:00', '21:00', '15% back to your club');

select is(claim_club_night('5e000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000002', 'Chess Club')->>'error',
  'CLUB_NIGHT_EXPIRED', 'a night that already ended is CLUB_NIGHT_EXPIRED');
select is(claim_club_night('5e000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000000', 'Chess Club')->>'error',
  'CLUB_NIGHT_EXPIRED', 'an unknown night is CLUB_NIGHT_EXPIRED');
select is(claim_club_night('5e000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000001', 'Chess Club')->>'ok',
  'true', 'an open night can be claimed');
select is((select count(*) from deals where business_id = 'b0000000-0000-4000-8000-000000000004' and visibility = 'link_only')::int,
  1, 'the claim creates exactly one link-only deal');
select is((select title from deals d join club_nights c on c.deal_id = d.id where c.id = 'c1000000-0000-4000-8000-000000000001'),
  'Chess Club night', 'the deal is "<club> night"');
select ok((select d.discount_type is null and d.starts_at = (c.night_date + c.start_time) at time zone 'America/Los_Angeles'
           and d.ends_at = (c.night_date + c.end_time) at time zone 'America/Los_Angeles'
           from deals d join club_nights c on c.deal_id = d.id where c.id = 'c1000000-0000-4000-8000-000000000001'),
  'the deal has no discount and runs for the night''s window');
select is(claim_club_night('5e000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000001', 'Film Club')->>'error',
  'ALREADY_CLAIMED', 'a second claim is ALREADY_CLAIMED');
select is((select count(*) from deals where business_id = 'b0000000-0000-4000-8000-000000000004' and visibility = 'link_only')::int,
  1, 'the second claim creates no deal');

-- #106 cap: 3 claims per student in 7 days. One claim above counts; a 10-day-old claim doesn't.
insert into deals (id, business_id, title, starts_at, ends_at, visibility)
  values ('de000000-0000-4000-8000-000000000010', 'b0000000-0000-4000-8000-000000000004', 'Old Club night', now() - interval '9 days', now() - interval '9 days' + interval '3 hours', 'link_only');
insert into club_nights (id, business_id, night_date, start_time, end_time, giveback, claimed_club_name, claimed_by, claimed_at, deal_id)
  values ('c1000000-0000-4000-8000-000000000010', 'b0000000-0000-4000-8000-000000000004', (now() at time zone 'America/Los_Angeles')::date - 9,
    '18:00', '21:00', 'old', 'Old Club', '5e000000-0000-4000-8000-000000000002', now() - interval '10 days', 'de000000-0000-4000-8000-000000000010');
insert into club_nights (id, business_id, night_date, start_time, end_time, giveback)
  select ('c1000000-0000-4000-8000-00000000002' || n)::uuid, 'b0000000-0000-4000-8000-000000000004',
    (now() at time zone 'America/Los_Angeles')::date + 2 + n, '18:00', '21:00', 'cap test'
  from generate_series(1, 3) n;
select is(claim_club_night('5e000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000021', 'Club 2')->>'ok',
  'true', 'the 2nd claim this week works (the 10-day-old one doesn''t count)');
select is(claim_club_night('5e000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000022', 'Club 3')->>'ok',
  'true', 'the 3rd claim this week works');
select is(claim_club_night('5e000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000023', 'Club 4')->>'error',
  'RATE_LIMITED', 'a 4th claim in 7 days is RATE_LIMITED');
select is((select claimed_club_name from club_nights where id = 'c1000000-0000-4000-8000-000000000023'),
  null, 'the capped claim leaves the night open');
select is((select count(*) from deals where title = 'Club 4 night')::int, 0, 'the capped claim creates no deal');

set local role authenticated;
select throws_ok($$ select claim_club_night('5e000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000001', 'X') $$,
  '42501', null, 'the browser can''t call it directly');

select * from finish();
rollback;
