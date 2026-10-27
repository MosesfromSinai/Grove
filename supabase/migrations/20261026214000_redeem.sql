-- Redemption core (#14). Edge Functions call these with the service role; the browser can't.
-- Every result is the contract's { ok: true, redemption } or { ok: false, error }.

-- Records one verified visit for today (campus date) and returns it as a contract Redemption.
-- The unique rule on (student_id, deal_id, redeemed_on) makes the daily limit race-free.
-- Shared by redeem, redeem-pin, and staff-redeem once their own checks pass.
create function public.record_redemption(
  p_student uuid,
  p_deal uuid,
  p_method text,
  p_location extensions.geography default null
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  r public.redemptions;
  v_deal_title text;
  v_business_name text;
  v_today date;
begin
  select d.title, b.name, (now() at time zone c.timezone)::date
    into v_deal_title, v_business_name, v_today
  from public.deals d
  join public.businesses b on b.id = d.business_id
  join public.campuses c on c.id = b.campus_id
  where d.id = p_deal;

  insert into public.redemptions (deal_id, business_id, student_id, redeemed_on, method, student_location)
  select d.id, d.business_id, p_student, v_today, p_method, p_location
  from public.deals d where d.id = p_deal
  returning * into r;

  return jsonb_build_object('ok', true, 'redemption', jsonb_build_object(
    'id', r.id, 'deal_id', r.deal_id, 'business_id', r.business_id, 'student_id', r.student_id,
    'redeemed_at', r.redeemed_at, 'redeemed_on', r.redeemed_on, 'method', r.method,
    'deal_title', v_deal_title, 'business_name', v_business_name));
exception when unique_violation then
  return jsonb_build_object('ok', false, 'error', 'ALREADY_REDEEMED_TODAY');
end;
$$;

-- Sticker redemption. Checks in the contract's order: WRONG_BUSINESS, DEAL_NOT_LIVE,
-- LOCATION_REQUIRED, TOO_FAR (over 150 m), ALREADY_REDEEMED_TODAY.
create function public.redeem_sticker(
  p_student uuid,
  p_deal uuid,
  p_qr_slug text,
  p_lat double precision,
  p_lng double precision
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  d public.deals;
  v_slug text;
  v_business extensions.geography;
  v_here extensions.geography;
begin
  select * into d from public.deals where id = p_deal;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'DEAL_NOT_LIVE');
  end if;
  select qr_slug, location into v_slug, v_business from public.businesses where id = d.business_id;
  if v_slug is distinct from p_qr_slug then
    return jsonb_build_object('ok', false, 'error', 'WRONG_BUSINESS');
  end if;
  if public.deal_status(d) <> 'live' then
    return jsonb_build_object('ok', false, 'error', 'DEAL_NOT_LIVE');
  end if;
  if p_lat is null or p_lng is null then
    return jsonb_build_object('ok', false, 'error', 'LOCATION_REQUIRED');
  end if;
  v_here := extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography;
  if not extensions.st_dwithin(v_business, v_here, 150) then
    return jsonb_build_object('ok', false, 'error', 'TOO_FAR');
  end if;
  return public.record_redemption(p_student, p_deal, 'sticker', v_here);
end;
$$;

revoke execute on function public.record_redemption(uuid, uuid, text, extensions.geography) from public, anon, authenticated;
revoke execute on function public.redeem_sticker(uuid, uuid, text, double precision, double precision) from public, anon, authenticated;
grant execute on function public.record_redemption(uuid, uuid, text, extensions.geography) to service_role;
grant execute on function public.redeem_sticker(uuid, uuid, text, double precision, double precision) to service_role;
