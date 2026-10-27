-- Plain lat/lng next to the PostGIS location (#16), so API reads get numbers instead of WKB hex.
alter table public.businesses
  add column lat double precision generated always as (extensions.st_y(location::extensions.geometry)) stored,
  add column lng double precision generated always as (extensions.st_x(location::extensions.geometry)) stored;
