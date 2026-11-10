-- Cross-business tests (#41): one business can't read or change another business's data.
-- Orange Peel Tacos' owner (a…0001, seed) acts against Pepper Tree Pizza Co. (b…0004).
-- Run with: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(12);

-- Pepper Tree: a link-only deal, a public deal, an open and a claimed club night, and a visit.
insert into auth.users (id, email) values ('5e000000-0000-4000-8000-0000000000b1', 'cross-biz@student.example');
insert into deals (id, business_id, title, starts_at, ends_at, visibility) values
  ('de000000-0000-4000-8000-0000000000b1', 'b0000000-0000-4000-8000-000000000004', 'Pepper secret', now() - interval '1 hour', now() + interval '1 hour', 'link_only'),
  ('de000000-0000-4000-8000-0000000000b2', 'b0000000-0000-4000-8000-000000000004', 'Pepper public', now() - interval '1 hour', now() + interval '1 hour', 'public'),
  ('de000000-0000-4000-8000-0000000000b3', 'b0000000-0000-4000-8000-000000000001', 'Orange own', now() - interval '1 hour', now() + interval '1 hour', 'link_only');
insert into club_nights (id, business_id, night_date, start_time, end_time, giveback) values
  ('e0000000-0000-4000-8000-0000000000b1', 'b0000000-0000-4000-8000-000000000004', current_date + 7, '18:00', '21:00', 'open night');
insert into club_nights (id, business_id, night_date, start_time, end_time, giveback, claimed_club_name, claimed_by, claimed_at, deal_id) values
  ('e0000000-0000-4000-8000-0000000000b2', 'b0000000-0000-4000-8000-000000000004', current_date + 7, '18:00', '21:00', 'claimed night',
   'ACM', '5e000000-0000-4000-8000-0000000000b1', now(), 'de000000-0000-4000-8000-0000000000b1');
insert into redemptions (deal_id, business_id, student_id, redeemed_on, method) values
  ('de000000-0000-4000-8000-0000000000b2', 'b0000000-0000-4000-8000-000000000004', '5e000000-0000-4000-8000-0000000000b1', current_date, 'pin');

set local role authenticated;
set local request.jwt.claims = '{"sub": "a0000000-0000-4000-8000-000000000001", "role": "authenticated"}';

select is((select count(*)::int from deals where id = 'de000000-0000-4000-8000-0000000000b1'), 0,
  'another business''s link-only deal is hidden');
select is((select count(*)::int from redemptions where business_id = 'b0000000-0000-4000-8000-000000000004'), 0,
  'another business''s redemptions are hidden');
select is((select count(*)::int from club_nights where id = 'e0000000-0000-4000-8000-0000000000b2'), 0,
  'another business''s claimed club night is hidden');
select throws_ok($$ insert into deals (business_id, title, starts_at, ends_at)
    values ('b0000000-0000-4000-8000-000000000004', 'Planted', now(), now() + interval '1 hour') $$,
  '42501', null, 'can''t post a deal for another business');
select is(update_truck_location('b0000000-0000-4000-8000-000000000004', 33.97, -117.32) ->> 'error', 'NOT_OWNER',
  'can''t move another business''s pin');

-- These touch 0 rows under RLS; the checks below run as the database owner.
update deals set title = 'Hijacked' where business_id = 'b0000000-0000-4000-8000-000000000004';
delete from deals where business_id = 'b0000000-0000-4000-8000-000000000004';
update club_nights set giveback = 'Hijacked' where id = 'e0000000-0000-4000-8000-0000000000b1';
delete from club_nights where id = 'e0000000-0000-4000-8000-0000000000b1';
update deals set title = 'Orange renamed' where id = 'de000000-0000-4000-8000-0000000000b3';
select is((select title from deals where id = 'de000000-0000-4000-8000-0000000000b3'), 'Orange renamed',
  'the owner still reads and edits their own link-only deal');
reset role;

select is((select count(*)::int from deals where business_id = 'b0000000-0000-4000-8000-000000000004' and title = 'Hijacked'), 0,
  'another business''s deals can''t be edited');
select is((select count(*)::int from deals where id in ('de000000-0000-4000-8000-0000000000b1', 'de000000-0000-4000-8000-0000000000b2')), 2,
  'another business''s deals can''t be deleted');
select is((select giveback from club_nights where id = 'e0000000-0000-4000-8000-0000000000b1'), 'open night',
  'another business''s club night can''t be edited');
select is((select count(*)::int from club_nights where id = 'e0000000-0000-4000-8000-0000000000b1'), 1,
  'another business''s club night can''t be deleted');
select is((select count(*)::int from deals where business_id = 'b0000000-0000-4000-8000-000000000004' and title = 'Planted'), 0,
  'no planted deal exists');
select ok((select extensions.st_y(location::extensions.geometry) <> 33.97 from businesses where id = 'b0000000-0000-4000-8000-000000000004'),
  'another business''s pin didn''t move');

select * from finish();
rollback;
