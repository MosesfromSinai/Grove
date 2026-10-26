-- Club nights from docs/API_CONTRACT.md (#101). Status (open, claimed, expired) is computed,
-- never stored. Only claim-club-night sets the claim columns. RLS on, no policies yet (Celso).

create table public.club_nights (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  night_date date not null, -- campus date
  start_time time not null, -- campus time
  end_time time not null,
  giveback text not null check (btrim(giveback) <> ''),
  claimed_club_name text check (claimed_club_name = btrim(claimed_club_name) and claimed_club_name <> ''),
  claimed_by uuid references public.profiles (id),
  claimed_at timestamptz,
  deal_id uuid unique references public.deals (id),
  created_at timestamptz not null default now(),
  check (end_time > start_time),
  -- unclaimed, or claimed with every claim column set
  check (
    (claimed_club_name is null and claimed_by is null and claimed_at is null and deal_id is null)
    or (claimed_club_name is not null and claimed_by is not null and claimed_at is not null and deal_id is not null)
  )
);

create index club_nights_business_idx on public.club_nights (business_id, night_date);

alter table public.club_nights enable row level security;
