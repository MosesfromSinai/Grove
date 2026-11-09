-- #106 claim limit and #38 location range check. Both functions are the definitions from the
-- database (pg_get_functiondef after a reset), with only the new checks added. Same signatures,
-- so the existing grants and revokes still apply.

CREATE OR REPLACE FUNCTION public.claim_club_night(p_student uuid, p_night uuid, p_club text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  c public.club_nights;
  v_business text;
  v_tz text;
  v_starts timestamptz;
  v_ends timestamptz;
  v_deal uuid := gen_random_uuid();
  v_cap constant int := 3;             -- claims per student
  v_window constant interval := '7 days';
begin
  -- #106: one student can't hoard club nights. The lock serializes this student's claims, so two
  -- sent at once can't both slip under the cap. Only successful claims count.
  perform pg_advisory_xact_lock(hashtext('claim_club_night:' || p_student::text));
  if (select count(*) from public.club_nights
      where claimed_by = p_student and claimed_at > now() - v_window) >= v_cap then
    return jsonb_build_object('ok', false, 'error', 'RATE_LIMITED');
  end if;
  select * into c from public.club_nights where id = p_night;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'CLUB_NIGHT_EXPIRED');
  end if;
  select b.name, k.timezone into v_business, v_tz
  from public.businesses b join public.campuses k on k.id = b.campus_id
  where b.id = c.business_id;
  if c.claimed_club_name is not null then
    return jsonb_build_object('ok', false, 'error', 'ALREADY_CLAIMED');
  end if;
  v_starts := (c.night_date + c.start_time) at time zone v_tz;
  v_ends := (c.night_date + c.end_time) at time zone v_tz;
  if now() >= v_ends then
    return jsonb_build_object('ok', false, 'error', 'CLUB_NIGHT_EXPIRED');
  end if;

  -- The link-only deal members redeem the normal way: no student discount, giveback in the text.
  insert into public.deals (id, business_id, title, description, starts_at, ends_at, visibility, students_only)
  values (v_deal, c.business_id, p_club || ' night', c.giveback || ' (to ' || p_club || ').', v_starts, v_ends, 'link_only', true);

  update public.club_nights
  set claimed_club_name = p_club, claimed_by = p_student, claimed_at = now(), deal_id = v_deal
  where id = p_night and claimed_club_name is null
  returning * into c;
  if not found then
    delete from public.deals where id = v_deal;
    return jsonb_build_object('ok', false, 'error', 'ALREADY_CLAIMED');
  end if;

  return jsonb_build_object('ok', true, 'deal_id', v_deal, 'club_night', jsonb_build_object(
    'id', c.id, 'business_id', c.business_id, 'business_name', v_business,
    'night_date', c.night_date, 'start_time', to_char(c.start_time, 'HH24:MI'), 'end_time', to_char(c.end_time, 'HH24:MI'),
    'giveback', c.giveback, 'status', 'claimed', 'claimed_club_name', c.claimed_club_name,
    'claimed_at', c.claimed_at, 'deal_id', c.deal_id, 'visit_count', 0));
end;
$function$;

CREATE OR REPLACE FUNCTION public.redeem_sticker(p_student uuid, p_deal uuid, p_qr_slug text, p_lat double precision, p_lng double precision)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  -- #38: coordinates no phone can report get a clean error instead of a geography exception.
  if p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    return jsonb_build_object('ok', false, 'error', 'INVALID_LOCATION');
  end if;
  v_here := extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography;
  if not extensions.st_dwithin(v_business, v_here, 150) then
    return jsonb_build_object('ok', false, 'error', 'TOO_FAR');
  end if;
  return public.record_redemption(p_student, p_deal, 'sticker', v_here);
end;
$function$;
