-- Invented sample data matching the design canvas and mocks/data.ts (#8). No real businesses.
-- Deal times are relative to now(), so re-run this file to refresh grove-dev; it clears its own
-- rows first. No students or redemptions: those come from real sign-ins.

-- Clear previous seed rows (fixed ids below); deals, members, and club nights cascade.
delete from public.businesses where id::text like 'b0000000-0000-4000-8000-%';
delete from public.profiles where id::text like 'a0000000-0000-4000-8000-%';
delete from auth.users where id::text like 'a0000000-0000-4000-8000-%';
delete from public.campuses where id = 'c0000000-0000-4000-8000-000000000001';

insert into public.campuses (id, name, email_domain, timezone, center) values
  ('c0000000-0000-4000-8000-000000000001', 'UC Riverside', 'ucr.edu', 'America/Los_Angeles', 'SRID=4326;POINT(-117.3281 33.9737)');

-- Businesses: id suffix, name, address, lat, lng, open, close (every day), truck, mode, slug.
create temporary table seed_businesses as
select ('b0000000-0000-4000-8000-00000000000' || n)::uuid as id,
       ('a0000000-0000-4000-8000-00000000000' || n)::uuid as owner_id,
       name, address, lat, lng, is_truck, redemption_mode, qr_slug,
       (select jsonb_object_agg(day, jsonb_build_array(jsonb_build_array(open, close)))
        from unnest(array['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']) day) as hours
from (values
  (1, 'Orange Peel Tacos', 'Iowa Ave & University Ave', 33.9762, -117.3254, '11:00', '21:00', true, 'sticker', 'orange-peel-tacos'),
  (2, 'Saffron Street Halal', 'Canyon Crest Dr & Blaine St', 33.9768, -117.3318, '11:00', '20:00', true, 'sticker', 'saffron-street-halal'),
  (3, 'Night Owl Noodles', 'University Ave & Chicago Ave', 33.9770, -117.3210, '11:00', '01:00', false, 'staff_scan', 'night-owl-noodles'),
  (4, 'Pepper Tree Pizza Co.', 'University Ave & Park Ave', 33.9810, -117.3360, '11:00', '23:00', false, 'sticker', 'pepper-tree-pizza'),
  (5, 'Boba Bungalow', 'Canyon Crest Dr & Central Ave', 33.9640, -117.3380, '11:00', '22:00', false, 'sticker', 'boba-bungalow'),
  (6, 'Verde Bowl', 'Blaine St & Iowa Ave', 33.9680, -117.3220, '10:00', '20:00', false, 'sticker', 'verde-bowl'),
  (7, 'Tía Rosa’s Tamales', 'Linden St & Canyon Crest Dr', 33.9775, -117.3300, '08:00', '19:00', true, 'sticker', 'tia-rosas-tamales'),
  (8, 'Big Bun Burgers', 'Iowa Ave & Martin Luther King Blvd', 33.9700, -117.3360, '17:00', '23:00', false, 'sticker', 'big-bun-burgers')
) v(n, name, address, lat, lng, open, close, is_truck, redemption_mode, qr_slug);

-- Owner accounts (no password; they can't sign in) and one active staff member at Orange Peel Tacos.
create temporary table seed_accounts as
select owner_id as id, 'owner@' || replace(qr_slug, '-', '') || '.example' as email, name || ' owner' as full_name
from seed_businesses
union all
select 'a0000000-0000-4000-8000-000000000009', 'marisol@orangepeeltacos.example', 'Marisol';

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change, created_at, updated_at)
select id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', email,
  '{"provider": "email", "providers": ["email"]}', jsonb_build_object('full_name', full_name),
  '', '', '', '', now(), now()
from seed_accounts;

-- on conflict: Celso's sign-in trigger may already have created the profile.
insert into public.profiles (id, role, full_name, email)
select id, 'business', full_name, email from seed_accounts
on conflict (id) do update set role = excluded.role, full_name = excluded.full_name, email = excluded.email;

insert into public.businesses (id, owner_id, name, campus_id, location, address, hours, qr_slug, redemption_mode, is_truck)
select id, owner_id, name, 'c0000000-0000-4000-8000-000000000001',
  extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography,
  address, hours, qr_slug, redemption_mode, is_truck
from seed_businesses;

insert into public.business_members (business_id, user_id, email, role)
select b.id, b.owner_id, a.email, 'owner' from seed_businesses b join seed_accounts a on a.id = b.owner_id
union all
select 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000009', 'marisol@orangepeeltacos.example', 'staff'
union all
select 'b0000000-0000-4000-8000-000000000001', null, 'taylor@orangepeeltacos.example', 'staff'; -- invited

-- Deals: business suffix, title, description, discount, students only, start and end offsets.
insert into public.deals (id, business_id, title, description, discount_type, discount_value, students_only, starts_at, ends_at, created_at)
select ('d0000000-0000-4000-8000-0000000000' || lpad(n::text, 2, '0'))::uuid,
  ('b0000000-0000-4000-8000-00000000000' || b)::uuid,
  title, description, discount_type, discount_value, students_only,
  now() + starts, now() + ends, now() + starts - interval '1 day'
from (values
  -- Live now
  (1, 1, '$2 off any burrito', 'Any burrito on the menu, $2 off. One per student per day.', 'amount_off', 2, true, interval '-2 hours', interval '139 minutes'),
  (2, 1, 'Free horchata with any combo', 'Any combo plate comes with a free horchata, Monday to Thursday.', 'free_item', null, false, interval '-6 days', interval '9 days'),
  (3, 2, 'Free drink with any platter', 'Pick any canned drink with a platter.', 'free_item', null, true, interval '-2 hours', interval '139 minutes'),
  (4, 3, 'Half-off gyoza with any ramen', 'Order any ramen and get a side of gyoza at half price.', 'percent_off', 50, false, interval '-3 hours', interval '80 minutes'),
  (5, 4, '$5 slice + drink', 'Any slice plus a fountain drink for $5.', 'amount_off', 3, false, interval '-1 hour', interval '200 minutes'),
  (6, 5, 'Buy one milk tea, 2nd half off', 'Second milk tea of equal or lesser price is half off.', 'percent_off', 50, true, interval '-1 hour', interval '260 minutes'),
  -- Scheduled
  (7, 1, 'Late-night BOGO tacos', 'Buy one taco, get one free, 8 to 11 PM.', 'bogo', null, true, interval '3 days', interval '3 days 3 hours'),
  -- Ended
  (8, 1, 'BOGO al pastor tacos', 'Buy one al pastor taco, get one free.', 'bogo', null, true, interval '-4 days -3 hours', interval '-4 days'),
  (9, 1, '$1 off quesadillas', '$1 off any quesadilla.', 'amount_off', 1, false, interval '-8 days', interval '-6 days'),
  (10, 1, 'Free chips and salsa', 'Free chips and salsa with any order.', 'free_item', null, false, interval '-14 days -4 hours', interval '-14 days'),
  (11, 3, 'Half-off gyoza with ramen', 'Half-off gyoza with any ramen.', 'percent_off', 50, false, interval '-4 days -4 hours', interval '-4 days'),
  (12, 5, 'Milk tea, 2nd half off', 'Second milk tea half off.', 'percent_off', 50, true, interval '-6 days -4 hours', interval '-6 days'),
  (13, 2, 'Free drink with platter', 'Free canned drink with any platter.', 'free_item', null, true, interval '-11 days -4 hours', interval '-11 days'),
  (14, 4, '$5 slice + drink', 'Any slice plus a fountain drink for $5.', 'amount_off', 3, false, interval '-14 days -4 hours', interval '-14 days')
) v(n, b, title, description, discount_type, discount_value, students_only, starts, ends);

-- Repeats Mon–Wed, 2–5 PM campus time, until the owner turns it off.
insert into public.deals (id, business_id, title, description, discount_type, discount_value, students_only,
  starts_at, ends_at, active_days, daily_start, daily_end, created_at)
values ('d0000000-0000-4000-8000-000000000015', 'b0000000-0000-4000-8000-000000000006', '$3 off any bowl',
  'Mon to Wed, 2 to 5 PM.', 'amount_off', 3, true, now() - interval '10 days', null,
  array['mon', 'tue', 'wed'], '14:00', '17:00', now() - interval '11 days');

-- One open club night at Pepper Tree Pizza Co., three days from today (campus date).
insert into public.club_nights (id, business_id, night_date, start_time, end_time, giveback)
values ('e0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000004',
  (now() at time zone 'America/Los_Angeles')::date + 3, '18:00', '21:00', '15% back to your club');

drop table seed_businesses, seed_accounts;
