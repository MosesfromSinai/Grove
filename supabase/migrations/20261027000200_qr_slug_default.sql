-- Every new business gets a permanent sticker slug (#120): from the name, plus a short suffix
-- if it's taken ("Tía Rosa’s Tamales" -> tia-rosas-tamales). Only fills an empty qr_slug.
create extension if not exists unaccent with schema extensions;

create function public.set_qr_slug()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_base text;
  v_slug text;
begin
  if coalesce(new.qr_slug, '') <> '' then
    return new;
  end if;
  v_base := trim(both '-' from regexp_replace(
    regexp_replace(lower(extensions.unaccent(new.name)), '[''’]', '', 'g'),
    '[^a-z0-9]+', '-', 'g'));
  if v_base = '' then
    v_base := 'business';
  end if;
  v_slug := v_base;
  while exists (select 1 from public.businesses where qr_slug = v_slug) loop
    v_slug := v_base || '-' || substr(md5(gen_random_uuid()::text), 1, 4);
  end loop;
  new.qr_slug := v_slug;
  return new;
end;
$$;

create trigger businesses_set_qr_slug
  before insert on public.businesses
  for each row execute function public.set_qr_slug();
