-- Hikaru #88, #94, #117. Read-only discovery respects RLS AND explicitly excludes
-- link-only deals, including when the caller owns or has redeemed one.
create function public.business_is_open(hours jsonb, timezone text, at_time timestamptz default now())
returns boolean language sql stable set search_path = '' as $$
  with clock as (
    select at_time at time zone timezone as local
  ), periods as (
    select day.previous_days, period.value ->> 0 as opens, period.value ->> 1 as closes,
      to_char(clock.local, 'HH24:MI') as hhmm
    from clock cross join (values (0), (1)) day(previous_days)
    cross join lateral jsonb_array_elements(case
      when jsonb_typeof(hours -> lower(to_char(clock.local - day.previous_days * interval '1 day', 'Dy'))) = 'array'
      then hours -> lower(to_char(clock.local - day.previous_days * interval '1 day', 'Dy'))
      else '[]'::jsonb end) period(value)
  )
  select exists (select 1 from periods
    where opens ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' and closes ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      and opens between '00:00' and '23:59' and closes between '00:00' and '23:59'
      and case when previous_days = 0 then
        case when opens < closes then opens <= hhmm and hhmm < closes
          else opens <= hhmm end
        else closes < opens and hhmm < closes end);
$$;

-- A composite return type keeps input argument names (lat/lng/open_now) identical
-- to the RPC contract without conflicting with those names in the returned row.
create type public.nearby_deal_card as (
  business_id uuid, business_name text, logo_url text, is_truck boolean,
  lat float8, lng float8, distance_m int, open_now boolean,
  has_deal boolean, deal_id uuid, title text, discount_type text, discount_value numeric,
  ends_at timestamptz, live_until timestamptz, students_only boolean, photo_url text
);

create function public.deals_nearby(lat float8, lng float8, radius_m int,
  open_now boolean default false, has_deals boolean default false)
returns setof public.nearby_deal_card
language plpgsql stable security invoker set search_path = '' as $$
declare origin extensions.geography;
begin
  if lat is null or not (lat between -90 and 90)
    or lng is null or not (lng between -180 and 180)
    or radius_m is null or radius_m < 1 or radius_m > 50000 then
    raise exception 'Invalid coordinates or radius (1–50000 metres)' using errcode = '22023';
  end if;
  origin := extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326)::extensions.geography;
  return query
  with nearby as (
    select b.id, b.name, b.logo_url, b.is_truck, b.lat, b.lng, c.timezone,
      round(extensions.st_distance(b.location, origin))::int as metres,
      public.business_is_open(b.hours, c.timezone) as is_open
    from public.businesses b join public.campuses c on c.id = b.campus_id
    where extensions.st_dwithin(b.location, origin, radius_m)
  )
  select b.id, b.name, b.logo_url, b.is_truck, b.lat, b.lng, b.metres, b.is_open,
    d.id is not null, d.id, d.title, d.discount_type, d.discount_value, d.ends_at,
    case when d.id is null then null
      when d.active_days is null then d.ends_at
      else least(d.ends_at, ((now() at time zone b.timezone)::date + d.daily_end) at time zone b.timezone) end,
    d.students_only, d.photo_url
  from nearby b left join public.deals d
    on d.business_id = b.id and d.visibility = 'public' and public.deal_status(d) = 'live'
  where (not deals_nearby.open_now or b.is_open) and (not has_deals or d.id is not null)
  order by b.metres, b.id, d.id;
end;
$$;

revoke execute on function public.deals_nearby(float8, float8, int, boolean, boolean) from public;
grant execute on function public.deals_nearby(float8, float8, int, boolean, boolean) to anon, authenticated, service_role;

-- The owner dashboard needs its actual business ID to move a truck. Return only
-- the existing BusinessProfile contract, never owner_id or the staff PIN hash.
create function public.get_my_business()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('business', jsonb_build_object(
    'id', b.id, 'name', b.name, 'address', b.address, 'lat', b.lat, 'lng', b.lng,
    'hours', b.hours, 'logo_url', b.logo_url, 'is_truck', b.is_truck,
    'redemption_mode', b.redemption_mode,
    'open_now', public.business_is_open(b.hours, c.timezone)),
    'pin_ready', b.staff_pin is not null)
  from public.businesses b join public.campuses c on c.id = b.campus_id
  where public.is_business_owner(b.id)
  order by b.id limit 1;
$$;
revoke execute on function public.get_my_business() from public, anon;
grant execute on function public.get_my_business() to authenticated;

create function public.update_truck_location(business_id uuid, lat float8, lng float8)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare truck boolean;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'NOT_SIGNED_IN');
  end if;
  if lat is null or not (lat between -90 and 90) or lng is null or not (lng between -180 and 180) then
    return jsonb_build_object('ok', false, 'error', 'INVALID_LOCATION');
  end if;
  select b.is_truck into truck from public.businesses b
    where b.id = business_id and public.is_business_owner(b.id) for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'NOT_OWNER'); end if;
  if not truck then return jsonb_build_object('ok', false, 'error', 'NOT_A_TRUCK'); end if;
  update public.businesses b
    set location = extensions.st_setsrid(extensions.st_makepoint(update_truck_location.lng, update_truck_location.lat), 4326)::extensions.geography
    where b.id = business_id and public.is_business_owner(b.id);
  if not found then return jsonb_build_object('ok', false, 'error', 'NOT_OWNER'); end if;
  return jsonb_build_object('ok', true, 'location', jsonb_build_object(
    'business_id', business_id, 'lat', lat, 'lng', lng));
end;
$$;
revoke execute on function public.update_truck_location(uuid, float8, float8) from public, anon;
grant execute on function public.update_truck_location(uuid, float8, float8) to authenticated;
