-- RLS policies for every table (#35, #105).
-- Owner: Celso. Reviewed by: Moses.
--
-- Two security-definer helpers avoid infinite recursion when business_members
-- policies query business_members itself.

create function public.is_business_member(bid uuid)
returns boolean
language sql security definer stable set search_path = ''
as $$
  select exists (
    select 1 from public.business_members
    where business_id = bid and user_id = auth.uid()
  );
$$;

create function public.is_business_owner(bid uuid)
returns boolean
language sql security definer stable set search_path = ''
as $$
  select exists (
    select 1 from public.business_members
    where business_id = bid and user_id = auth.uid() and role = 'owner'
  );
$$;

-- Column-level security: staff_pin and owner_id must never leave the database.
-- Revoke the default blanket grant and re-grant with only the safe columns.
-- Columns are listed by name, so any new column (like lat and lng, #131) must be added here.
revoke all on public.businesses from anon, authenticated;
grant select (id, name, campus_id, location, lat, lng, address, hours, logo_url, qr_slug, redemption_mode, is_truck)
  on public.businesses to anon, authenticated;
-- There's no insert or delete policy yet, so RLS blocks both from the browser; these grants
-- only matter once a policy is added. Updates are owner-only (policy below); qr_slug is never edited.
grant insert (owner_id, name, campus_id, location, address, hours, logo_url, qr_slug, redemption_mode, is_truck)
  on public.businesses to authenticated;
grant update (name, campus_id, location, address, hours, logo_url, redemption_mode, is_truck)
  on public.businesses to authenticated;
grant delete on public.businesses to authenticated;

-- Column-level security: claimed_by must never leave the database.
revoke all on public.club_nights from anon, authenticated;
grant select (id, business_id, night_date, start_time, end_time, giveback, claimed_club_name, claimed_at, deal_id, created_at)
  on public.club_nights to anon, authenticated;
grant insert (business_id, night_date, start_time, end_time, giveback)
  on public.club_nights to authenticated;
grant update (night_date, start_time, end_time, giveback)
  on public.club_nights to authenticated;
grant delete on public.club_nights to authenticated;

-- Column-level security: profiles are created by the handle_new_user() trigger, and the browser
-- may change only full_name. role, email, verified_student, and campus_id are set server-side.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;

-- Column-level security: student_location must not reach the browser or Realtime dashboard.
revoke all on public.redemptions from anon, authenticated;
grant select (id, deal_id, business_id, student_id, redeemed_at, redeemed_on, method)
  on public.redemptions to authenticated;

-- campuses: anyone can read; writes only via seed/migrations (service role)
create policy "campuses_read"
  on public.campuses for select
  to anon, authenticated
  using (true);

-- profiles: users read and update their own row (only full_name, per the column grant above).
create policy "profiles_read_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- businesses: anyone reads public-safe columns (staff_pin and owner_id excluded above);
-- only owners can update their business
create policy "businesses_read"
  on public.businesses for select
  to anon, authenticated
  using (true);

create policy "businesses_update_owner"
  on public.businesses for update
  to authenticated
  using (public.is_business_owner(id))
  with check (public.is_business_owner(id));

-- business_members: members of the same business see the member list; owners delete staff rows
create policy "business_members_read"
  on public.business_members for select
  to authenticated
  using (public.is_business_member(business_id));

create policy "business_members_delete_owner"
  on public.business_members for delete
  to authenticated
  using (public.is_business_owner(business_id) and role = 'staff');

-- deals: anyone reads public deals; link-only deals are invisible here and only reachable via
-- deal_by_id() (security definer, Moses #16); members read all their deals and manage them;
-- students can also read deals they have already redeemed (needed for getMyRedemptions to
-- show the title of a link-only club night deal)
create policy "deals_read_public"
  on public.deals for select
  to anon, authenticated
  using (visibility = 'public');

create policy "deals_read_members"
  on public.deals for select
  to authenticated
  using (public.is_business_member(business_id));

create policy "deals_read_redeemed"
  on public.deals for select
  to authenticated
  using (
    exists (
      select 1 from public.redemptions
      where deal_id = deals.id and student_id = auth.uid()
    )
  );

create policy "deals_insert_members"
  on public.deals for insert
  to authenticated
  with check (public.is_business_member(business_id));

create policy "deals_update_members"
  on public.deals for update
  to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "deals_delete_members"
  on public.deals for delete
  to authenticated
  using (public.is_business_member(business_id));

-- redemptions: students see their own; business members see their business's;
-- no browser inserts (only Edge Functions via service role)
create policy "redemptions_read_own"
  on public.redemptions for select
  to authenticated
  using (student_id = auth.uid());

create policy "redemptions_read_business"
  on public.redemptions for select
  to authenticated
  using (public.is_business_member(business_id));

-- club_nights: members manage their own (claim columns excluded from UPDATE grant above,
-- so claim-club-night writes them via service role);
-- verified students see only open (unclaimed) nights at their campus
create policy "club_nights_read_members"
  on public.club_nights for select
  to authenticated
  using (public.is_business_member(business_id));

create policy "club_nights_insert_members"
  on public.club_nights for insert
  to authenticated
  with check (public.is_business_member(business_id));

-- members can only update unclaimed nights; claim columns are set by claim-club-night (service role)
create policy "club_nights_update_members"
  on public.club_nights for update
  to authenticated
  using (public.is_business_member(business_id) and claimed_club_name is null)
  with check (public.is_business_member(business_id) and claimed_club_name is null);

create policy "club_nights_delete_members"
  on public.club_nights for delete
  to authenticated
  using (public.is_business_member(business_id) and claimed_club_name is null);

create policy "club_nights_read_students"
  on public.club_nights for select
  to authenticated
  using (
    claimed_club_name is null
    and exists (
      select 1
      from public.profiles p
      join public.businesses b on b.id = club_nights.business_id
      where p.id = auth.uid()
        and p.verified_student = true
        and p.campus_id = b.campus_id
    )
  );
