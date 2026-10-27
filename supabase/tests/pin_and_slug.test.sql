begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(8);

insert into deals (id, business_id, title, starts_at, ends_at) values
  ('de000000-0000-4000-8000-0000000000a1', 'b0000000-0000-4000-8000-000000000001', 'Live now', now() - interval '1 hour', now() + interval '1 hour'),
  ('de000000-0000-4000-8000-0000000000a2', 'b0000000-0000-4000-8000-000000000001', 'Tomorrow', now() + interval '1 day', now() + interval '2 days');

select ok(deal_live_at('de000000-0000-4000-8000-0000000000a1', 'b0000000-0000-4000-8000-000000000001'), 'a live deal at its business is live');
select ok(not deal_live_at('de000000-0000-4000-8000-0000000000a1', 'b0000000-0000-4000-8000-000000000004'), 'the same deal at another business is not');
select ok(not deal_live_at('de000000-0000-4000-8000-0000000000a2', 'b0000000-0000-4000-8000-000000000001'), 'a scheduled deal is not');
select ok(not deal_live_at('00000000-0000-4000-8000-000000000000', 'b0000000-0000-4000-8000-000000000001'), 'an unknown deal is not');

-- New businesses get a slug from the name; a taken slug gets a suffix; a given slug is kept.
insert into businesses (id, owner_id, name, campus_id, location, address) values
  ('b1000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Tía Rosa’s Tamales', 'c0000000-0000-4000-8000-000000000001', 'SRID=4326;POINT(-117.33 33.97)', 'x'),
  ('b1000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Café  Ñandú!!', 'c0000000-0000-4000-8000-000000000001', 'SRID=4326;POINT(-117.33 33.97)', 'x');
insert into businesses (id, owner_id, name, campus_id, location, address, qr_slug) values
  ('b1000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'Anything', 'c0000000-0000-4000-8000-000000000001', 'SRID=4326;POINT(-117.33 33.97)', 'x', 'kept-slug');

select matches((select qr_slug from businesses where id = 'b1000000-0000-4000-8000-000000000001'), '^tia-rosas-tamales-[0-9a-f]{4}$',
  'a taken name gets a short suffix (the seed already has tia-rosas-tamales)');
select is((select qr_slug from businesses where id = 'b1000000-0000-4000-8000-000000000002'), 'cafe-nandu', 'accents and punctuation become a clean slug');
select is((select qr_slug from businesses where id = 'b1000000-0000-4000-8000-000000000003'), 'kept-slug', 'a given slug is kept');
select is((select count(distinct qr_slug)::int from businesses), (select count(*)::int from businesses), 'every slug is unique');

select * from finish();
rollback;
