-- Signed-out browsing (#156): the anon role reads only public data. It can list public deals and
-- businesses and open a deal from its link, but never sees redemptions, student data, link-only
-- deals in discovery, or anything that writes.
-- Run with: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(22);

-- A live public deal and a live link-only deal at Orange Peel Tacos, a student, and a redemption.
insert into deals (id, business_id, title, starts_at, ends_at, visibility) values
  ('de000000-0000-4000-8000-0000000000b1', 'b0000000-0000-4000-8000-000000000001', 'Public test deal',
   now() - interval '1 hour', now() + interval '1 hour', 'public'),
  ('de000000-0000-4000-8000-0000000000b2', 'b0000000-0000-4000-8000-000000000001', 'Link-only test deal',
   now() - interval '1 hour', now() + interval '1 hour', 'link_only');
insert into auth.users (id, email) values ('5e000000-0000-4000-8000-0000000000b1', 'anon.test@ucr.edu');
insert into redemptions (deal_id, business_id, student_id, redeemed_on, method) values
  ('de000000-0000-4000-8000-0000000000b1', 'b0000000-0000-4000-8000-000000000001',
   '5e000000-0000-4000-8000-0000000000b1', current_date, 'pin');

set local role anon;

-- ── Browsing works ────────────────────────────────────────────────────────────

select ok((select count(*) from businesses) > 0, 'anon can list businesses');
select ok(exists (select 1 from deals where id = 'de000000-0000-4000-8000-0000000000b1'), 'anon can read a public deal');
select ok(exists (select 1 from deals_nearby(33.9737, -117.3281, 3000, false, true)
  where deal_id = 'de000000-0000-4000-8000-0000000000b1'), 'the public deal is in deals_nearby for anon');
select is((select title from deal_by_id('de000000-0000-4000-8000-0000000000b2')), 'Link-only test deal',
  'anon can open a link-only deal from its link');

-- ── Link-only deals stay out of discovery ────────────────────────────────────

select is((select count(*) from deals where visibility <> 'public'), 0::bigint, 'anon reads no link-only deals from the table');
select ok(not exists (select 1 from deals_nearby(33.9737, -117.3281, 3000)
  where deal_id = 'de000000-0000-4000-8000-0000000000b2'), 'the link-only deal is not in deals_nearby for anon');

-- ── No student data ──────────────────────────────────────────────────────────

select throws_ok($$ select id from redemptions $$, '42501', null, 'anon cannot read redemptions');
select throws_ok($$ select id from profiles $$, '42501', null, 'anon cannot read profiles');
select is((select count(*) from business_members), 0::bigint, 'anon sees no business members');
select is((select count(*) from club_nights), 0::bigint, 'anon sees no club nights');
select throws_ok($$ select claimed_by from club_nights $$, '42501', null, 'anon cannot read claimed_by');
select throws_ok($$ select id from pin_attempts $$, '42501', null, 'anon cannot read pin_attempts');
select throws_ok($$ select id from redeem_attempts $$, '42501', null, 'anon cannot read redeem_attempts');

-- ── No writes ────────────────────────────────────────────────────────────────

select throws_ok($$ insert into deals (business_id, title, starts_at) values
  ('b0000000-0000-4000-8000-000000000001', 'Anon deal', now()) $$, '42501', null, 'anon cannot post a deal');
update deals set title = 'Defaced' where id = 'de000000-0000-4000-8000-0000000000b1';
delete from deals where id = 'de000000-0000-4000-8000-0000000000b1';
select throws_ok($$ insert into club_nights (business_id, night_date, start_time, end_time, giveback) values
  ('b0000000-0000-4000-8000-000000000001', current_date + 1, '18:00', '21:00', 'x') $$, '42501', null,
  'anon cannot post a club night');
select throws_ok($$ update businesses set name = 'Defaced' $$, '42501', null, 'anon cannot edit a business');

reset role;
select is((select title from deals where id = 'de000000-0000-4000-8000-0000000000b1'), 'Public test deal',
  'anon could not edit or delete the public deal');

-- ── No redeeming or claiming without a session ───────────────────────────────

select ok(not has_function_privilege('anon', 'public.redeem_sticker(uuid, uuid, text, double precision, double precision)', 'EXECUTE'),
  'anon cannot run redeem_sticker');
select ok(not has_function_privilege('anon', 'public.record_redemption(uuid, uuid, text, extensions.geography)', 'EXECUTE'),
  'anon cannot run record_redemption');
select ok(not has_function_privilege('anon', 'public.claim_club_night(uuid, uuid, text)', 'EXECUTE'),
  'anon cannot run claim_club_night');
select ok(not has_function_privilege('anon', 'public.update_truck_location(uuid, double precision, double precision)', 'EXECUTE'),
  'anon cannot move a truck');
select ok(not has_function_privilege('anon', 'public.deal_live_at(uuid, uuid)', 'EXECUTE'),
  'anon cannot run deal_live_at');

select * from finish();
rollback;
