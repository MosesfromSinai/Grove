-- Profiles creation trigger on first sign-in (#32).
-- Owner: Celso. Reviewed by: Moses.
--
-- Fires after every new row in auth.users (Google OAuth sign-in).
-- Creates a profiles row and links any pending business_members invite.
-- Role is 'business' if the email is already in business_members, else 'student'.

create function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_role text;
begin
  select case
    when exists (select 1 from public.business_members where email = new.email)
    then 'business'
    else 'student'
  end into v_role;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    v_role
  )
  on conflict (id) do nothing;

  -- Link the user_id for any pending business_members invite with this email.
  update public.business_members
  set user_id = new.id
  where email = new.email
    and user_id is null;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
