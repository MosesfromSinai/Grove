begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(10);

-- A test student and a deal that's live now at Orange Peel Tacos (33.9762, -117.3254).
insert into auth.users (id, email) values ('5e000000-0000-4000-8000-000000000001', 'redeem-test@student.example');
insert into profiles (id, email, verified_student) values ('5e000000-0000-4000-8000-000000000001', 'redeem-test@student.example', true)
  on conflict (id) do update set verified_student = true;
insert into deals (id, business_id, title, starts_at, ends_at, discount_type, discount_value)
  values ('de000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Test deal', now() - interval '1 hour', now() + interval '1 hour', 'amount_off', 1);
insert into deals (id, business_id, title, starts_at, ends_at, discount_type, discount_value)
  values ('de000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'Later deal', now() + interval '1 day', now() + interval '2 days', 'amount_off', 1);

select is(redeem_sticker('5e000000-0000-4000-8000-000000000001', 'de000000-0000-4000-8000-000000000001', 'verde-bowl', 33.9762, -117.3254)->>'error',
  'WRONG_BUSINESS', 'another business''s sticker is WRONG_BUSINESS');
select is(redeem_sticker('5e000000-0000-4000-8000-000000000001', 'de000000-0000-4000-8000-000000000002', 'orange-peel-tacos', 33.9762, -117.3254)->>'error',
  'DEAL_NOT_LIVE', 'a scheduled deal is DEAL_NOT_LIVE');
select is(redeem_sticker('5e000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000000', 'orange-peel-tacos', 33.9762, -117.3254)->>'error',
  'DEAL_NOT_LIVE', 'an unknown deal is DEAL_NOT_LIVE');
select is(redeem_sticker('5e000000-0000-4000-8000-000000000001', 'de000000-0000-4000-8000-000000000001', 'orange-peel-tacos', null, null)->>'error',
  'LOCATION_REQUIRED', 'no location is LOCATION_REQUIRED');
select is(redeem_sticker('5e000000-0000-4000-8000-000000000001', 'de000000-0000-4000-8000-000000000001', 'orange-peel-tacos', 33.9737, -117.3281)->>'error',
  'TOO_FAR', 'campus center (about 370 m away) is TOO_FAR');
select is(redeem_sticker('5e000000-0000-4000-8000-000000000001', 'de000000-0000-4000-8000-000000000001', 'orange-peel-tacos', 33.9770, -117.3254)->>'ok',
  'true', '90 m away at the counter succeeds');
select is((select count(*) from redemptions where student_id = '5e000000-0000-4000-8000-000000000001')::int, 1, 'success inserts exactly one redemption');
select is(redeem_sticker('5e000000-0000-4000-8000-000000000001', 'de000000-0000-4000-8000-000000000001', 'orange-peel-tacos', 33.9762, -117.3254)->>'error',
  'ALREADY_REDEEMED_TODAY', 'a second try today is ALREADY_REDEEMED_TODAY');
select is((select count(*) from redemptions where student_id = '5e000000-0000-4000-8000-000000000001')::int, 1, 'the second try inserts nothing');

set local role authenticated;
select throws_ok($$ select redeem_sticker('5e000000-0000-4000-8000-000000000001', 'de000000-0000-4000-8000-000000000001', 'orange-peel-tacos', 33.9762, -117.3254) $$,
  '42501', null, 'the browser can''t call it directly');

select * from finish();
rollback;
