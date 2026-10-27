-- Security tests for RLS, column grants, and the PIN and rate-limit helpers (#35–#37, #105).
-- Each block tries the attack from Moses's review of #128 as the browser would.
-- Run with: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(45);

-- Test accounts. Inserting into auth.users fires handle_new_user(), like a first sign-in.
-- Seed: a…0001 owns Orange Peel Tacos (b…0001), a…0009 is its staff, taylor@ is invited there.
insert into auth.users (id, email) values
  ('5e000000-0000-4000-8000-0000000000a1', 'Test.Student@UCR.edu'),
  ('5e000000-0000-4000-8000-0000000000a2', 'someone@gmail.example'),
  ('5e000000-0000-4000-8000-0000000000a3', 'taylor@orangepeeltacos.example');

-- A link-only deal, an open and a claimed club night, and a redemption, all at Orange Peel Tacos.
insert into deals (id, business_id, title, starts_at, ends_at, visibility) values
  ('de000000-0000-4000-8000-0000000000a1', 'b0000000-0000-4000-8000-000000000001', 'Hidden deal',
   now() - interval '1 hour', now() + interval '1 hour', 'link_only'),
  ('de000000-0000-4000-8000-0000000000a2', 'b0000000-0000-4000-8000-000000000001', 'ACM night',
   now() - interval '1 hour', now() + interval '1 hour', 'link_only');
insert into club_nights (id, business_id, night_date, start_time, end_time, giveback) values
  ('e0000000-0000-4000-8000-0000000000a1', 'b0000000-0000-4000-8000-000000000001', current_date + 7, '18:00', '21:00', '15% back');
insert into club_nights (id, business_id, night_date, start_time, end_time, giveback,
  claimed_club_name, claimed_by, claimed_at, deal_id) values
  ('e0000000-0000-4000-8000-0000000000a2', 'b0000000-0000-4000-8000-000000000001', current_date + 7, '18:00', '21:00', '15% back',
   'ACM', '5e000000-0000-4000-8000-0000000000a1', now(), 'de000000-0000-4000-8000-0000000000a2');

-- ── Sign-in trigger: .edu check and invite linking (fix 2) ─────────────────────

select is((select verified_student from profiles where id = '5e000000-0000-4000-8000-0000000000a1'),
  true, 'a ucr.edu address (any case) is a verified student');
select is((select campus_id from profiles where id = '5e000000-0000-4000-8000-0000000000a1'),
  'c0000000-0000-4000-8000-000000000001'::uuid, 'a ucr.edu address gets the UCR campus');
select is((select verified_student from profiles where id = '5e000000-0000-4000-8000-0000000000a2'),
  false, 'a non-campus address is not a verified student');
select is((select role from profiles where id = '5e000000-0000-4000-8000-0000000000a3'),
  'business', 'an invited staff email signs in as business');
select is((select user_id from business_members where email = 'taylor@orangepeeltacos.example'),
  '5e000000-0000-4000-8000-0000000000a3'::uuid, 'the pending invite is linked on first sign-in');

-- ── PIN and rate-limit functions are service-role only (fix 1) ────────────────

select ok(not has_function_privilege('anon', 'public.hash_pin(text)', 'EXECUTE'), 'anon cannot run hash_pin');
select ok(not has_function_privilege('authenticated', 'public.hash_pin(text)', 'EXECUTE'), 'authenticated cannot run hash_pin');
select ok(not has_function_privilege('anon', 'public.verify_pin(uuid, text)', 'EXECUTE'), 'anon cannot run verify_pin');
select ok(not has_function_privilege('authenticated', 'public.verify_pin(uuid, text)', 'EXECUTE'), 'authenticated cannot run verify_pin');
select ok(not has_function_privilege('anon', 'public.is_pin_rate_limited(uuid)', 'EXECUTE'), 'anon cannot run is_pin_rate_limited');
select ok(not has_function_privilege('authenticated', 'public.is_pin_rate_limited(uuid)', 'EXECUTE'), 'authenticated cannot run is_pin_rate_limited');
select ok(not has_function_privilege('anon', 'public.record_pin_attempt(uuid, boolean)', 'EXECUTE'), 'anon cannot run record_pin_attempt');
select ok(not has_function_privilege('authenticated', 'public.record_pin_attempt(uuid, boolean)', 'EXECUTE'), 'authenticated cannot run record_pin_attempt');
select ok(not has_function_privilege('anon', 'public.is_redeem_rate_limited(uuid)', 'EXECUTE'), 'anon cannot run is_redeem_rate_limited');
select ok(not has_function_privilege('authenticated', 'public.is_redeem_rate_limited(uuid)', 'EXECUTE'), 'authenticated cannot run is_redeem_rate_limited');
select ok(not has_function_privilege('anon', 'public.record_redeem_attempt(uuid)', 'EXECUTE'), 'anon cannot run record_redeem_attempt');
select ok(not has_function_privilege('authenticated', 'public.record_redeem_attempt(uuid)', 'EXECUTE'), 'authenticated cannot run record_redeem_attempt');
select function_privs_are('public', 'verify_pin', array['uuid', 'text'], 'service_role', array['EXECUTE'],
  'service_role can run verify_pin');

set local role anon;
select throws_ok($$ select verify_pin('b0000000-0000-4000-8000-000000000001', '1234') $$,
  '42501', null, 'a logged-out caller cannot guess PINs');
reset role;

-- PIN helpers work for the service role: bcrypt round trip and lockout after 5 failures.
update businesses set staff_pin = hash_pin('4821') where id = 'b0000000-0000-4000-8000-000000000001';
select isnt((select staff_pin from businesses where id = 'b0000000-0000-4000-8000-000000000001'),
  '4821', 'the PIN is stored hashed');
select ok(verify_pin('b0000000-0000-4000-8000-000000000001', '4821'), 'the right PIN verifies');
select ok(not verify_pin('b0000000-0000-4000-8000-000000000001', '0000'), 'a wrong PIN fails');
select record_pin_attempt('b0000000-0000-4000-8000-000000000001', false) from generate_series(1, 4);
select ok(not is_pin_rate_limited('b0000000-0000-4000-8000-000000000001'), '4 failures is not locked out');
select record_pin_attempt('b0000000-0000-4000-8000-000000000001', false);
select ok(is_pin_rate_limited('b0000000-0000-4000-8000-000000000001'), '5 failures in 15 minutes locks the PIN');

-- ── Redeem rate limit counts attempts, not successes (fix 5) ──────────────────

select ok(not is_redeem_rate_limited('5e000000-0000-4000-8000-0000000000a1'), 'no attempts is not limited');
select record_redeem_attempt('5e000000-0000-4000-8000-0000000000a1') from generate_series(1, 10);
select ok(is_redeem_rate_limited('5e000000-0000-4000-8000-0000000000a1'),
  '10 failed attempts in a minute is limited, with no redemptions recorded');

-- ── Browser has no access to the attempts tables ─────────────────────────────

set local role authenticated;
select throws_ok($$ select count(*) from pin_attempts $$, '42501', null, 'the browser cannot read pin_attempts');
select throws_ok($$ insert into redeem_attempts (student_id) values ('5e000000-0000-4000-8000-0000000000a1') $$,
  '42501', null, 'the browser cannot write redeem_attempts');
reset role;

-- ── Profiles: the browser changes only full_name (fix 2) ──────────────────────

set local role authenticated;
set local request.jwt.claims = '{"sub": "5e000000-0000-4000-8000-0000000000a2", "role": "authenticated"}';
select throws_ok($$ update profiles set verified_student = true where id = auth.uid() $$,
  '42501', null, 'a user cannot make themselves a verified student');
select throws_ok($$ update profiles set role = 'business' where id = auth.uid() $$,
  '42501', null, 'a user cannot make themselves a business');
select throws_ok($$ update profiles set campus_id = 'c0000000-0000-4000-8000-000000000001' where id = auth.uid() $$,
  '42501', null, 'a user cannot change their campus');
select lives_ok($$ update profiles set full_name = 'New Name' where id = auth.uid() $$, 'a user can change their name');
select is((select count(*)::int from profiles), 1, 'a user reads only their own profile');
reset role;
select is((select full_name from profiles where id = '5e000000-0000-4000-8000-0000000000a2'),
  'New Name', 'the name change was saved');

-- ── Club nights: students see only open nights; claimed_by stays hidden (fix 3) ─

set local role authenticated;
set local request.jwt.claims = '{"sub": "5e000000-0000-4000-8000-0000000000a1", "role": "authenticated"}';
select is((select count(*)::int from club_nights where id in
    ('e0000000-0000-4000-8000-0000000000a1', 'e0000000-0000-4000-8000-0000000000a2')),
  1, 'a student sees the open night but not the claimed one');
select throws_ok($$ select claimed_by from club_nights $$, '42501', null, 'claimed_by never reaches the browser');

-- ── Deals: link-only hidden, but readable once redeemed ──────────────────────

select is((select count(*)::int from deals where id = 'de000000-0000-4000-8000-0000000000a1'),
  0, 'a link-only deal is hidden from a student who has not redeemed it');
reset role;
insert into redemptions (deal_id, business_id, student_id, redeemed_on, method) values
  ('de000000-0000-4000-8000-0000000000a1', 'b0000000-0000-4000-8000-000000000001',
   '5e000000-0000-4000-8000-0000000000a1', current_date, 'pin');
set local role authenticated;
select is((select count(*)::int from deals where id = 'de000000-0000-4000-8000-0000000000a1'),
  1, 'a student reads a link-only deal they redeemed');
select throws_ok($$ insert into redemptions (deal_id, business_id, student_id, redeemed_on, method) values
    ('de000000-0000-4000-8000-0000000000a1', 'b0000000-0000-4000-8000-000000000001',
     '5e000000-0000-4000-8000-0000000000a1', current_date + 1, 'pin') $$,
  '42501', null, 'the browser cannot insert redemptions');
reset role;

-- ── Businesses: owner_id and staff_pin hidden, lat/lng readable, owner-only updates (fix 4) ─

set local role anon;
select throws_ok($$ select owner_id from businesses $$, '42501', null, 'owner_id is hidden');
select throws_ok($$ select staff_pin from businesses $$, '42501', null, 'staff_pin is hidden');
select lives_ok($$ select lat, lng from businesses $$, 'lat and lng are readable');
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select throws_ok($$ update businesses set qr_slug = 'stolen' where id = 'b0000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'not even the owner can change qr_slug');
update businesses set name = 'Owner rename' where id = 'b0000000-0000-4000-8000-000000000001';
set local request.jwt.claims = '{"sub": "a0000000-0000-4000-8000-000000000009", "role": "authenticated"}';
update businesses set name = 'Staff rename' where id = 'b0000000-0000-4000-8000-000000000001';

-- ── Redemptions: the business sees visits, never student_location ────────────

select throws_ok($$ select student_location from redemptions $$, '42501', null,
  'student_location never reaches the dashboard or Realtime');
reset role;
select is((select name from businesses where id = 'b0000000-0000-4000-8000-000000000001'),
  'Owner rename', 'the owner can update the business; staff cannot');

select * from finish();
rollback;
