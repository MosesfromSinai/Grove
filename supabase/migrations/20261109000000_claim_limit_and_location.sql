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
