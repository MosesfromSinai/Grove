-- Profiles creation trigger on first sign-in (#32).
-- Owner: Celso. Reviewed by: Moses.
--
-- handle_new_user fires after every new row in auth.users (Google OAuth sign-in).
-- Creates a profiles row, sets role (business if invited, else student), runs the
-- .edu check to set verified_student and campus_id, and links any pending
-- business_members invite.
--
-- The browser can't change role, email, verified_student, or campus_id: the column grant in
-- 20261026220000_rls_policies.sql allows updates to full_name only.

create function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_role text;
  v_verified_student boolean := false;
  v_campus_id uuid := null;
begin
  select case
    when exists (select 1 from public.business_members where email = lower(new.email))
    then 'business'
    else 'student'
  end into v_role;

  -- .edu check: look up the campus whose email_domain matches this address.
  select id into v_campus_id
  from public.campuses
  where email_domain = split_part(lower(new.email), '@', 2)
  limit 1;

  if v_campus_id is not null then
    v_verified_student := true;
  end if;

  insert into public.profiles (id, email, full_name, role, verified_student, campus_id)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    v_role,
    v_verified_student,
    v_campus_id
  )
  on conflict (id) do nothing;

  -- Link the user_id for any pending business_members invite with this email.
  update public.business_members
  set user_id = new.id
  where email = lower(new.email)
    and user_id is null;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
