-- Core tables from docs/API_CONTRACT.md (#7), including campus timezone, repeat days, and
-- visibility on deals. RLS is on for every table with no policies yet: only the service role
-- (Edge Functions, seed) can read or write until Celso adds policies.

create extension if not exists postgis with schema extensions;

create table public.campuses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email_domain text not null unique,
  timezone text not null default 'America/Los_Angeles',
  center extensions.geography(Point, 4326) not null
);

-- One row per signed-in user, created on first sign-in (Celso's trigger).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'student' check (role in ('student', 'business')),
  full_name text,
  email text not null,
  campus_id uuid references public.campuses (id),
  verified_student boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id),
  name text not null,
  campus_id uuid not null references public.campuses (id),
  location extensions.geography(Point, 4326) not null,
  address text not null,
  hours jsonb not null default '{}'::jsonb,
  logo_url text,
  qr_slug text not null unique, -- database default on insert comes with set-pin (#120)
  staff_pin text, -- hashed; set only by set-pin, never returned by any query
  redemption_mode text not null default 'sticker' check (redemption_mode in ('sticker', 'staff_scan')),
  is_truck boolean not null default false
);

create index businesses_location_idx on public.businesses using gist (location);
create index businesses_campus_idx on public.businesses (campus_id);

-- Owner and staff accounts. user_id is null while invited, filled on that email's first sign-in.
create table public.business_members (
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  email text not null check (email = lower(email)),
  role text not null check (role in ('owner', 'staff')),
  primary key (business_id, email),
  unique (business_id, user_id)
);

create index business_members_user_idx on public.business_members (user_id);

-- Status (scheduled, live, ended) is computed by deal_status() (#102), never stored.
create table public.deals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  title text not null,
  description text not null default '',
  photo_url text,
  starts_at timestamptz not null,
  ends_at timestamptz, -- null only for a repeating deal that runs until turned off
  active_days text[] check (
    cardinality(active_days) > 0
    and active_days <@ array['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  ),
  daily_start time,
  daily_end time,
  visibility text not null default 'public' check (visibility in ('public', 'link_only')),
  discount_type text check (discount_type in ('amount_off', 'percent_off', 'free_item', 'bogo')),
  discount_value numeric,
  students_only boolean not null default true,
  created_at timestamptz not null default now(),
  unique (id, business_id), -- lets redemptions check the deal belongs to the business
  check (ends_at > starts_at),
  check (ends_at is not null or active_days is not null),
  check (
    (active_days is null and daily_start is null and daily_end is null)
    or (active_days is not null and daily_start is not null and daily_end is not null)
  ),
  check (daily_end > daily_start),
  -- dollars for amount_off, percent for percent_off, null otherwise (and with no discount)
  check (
    case when discount_type in ('amount_off', 'percent_off')
      then discount_value is not null and discount_value > 0
      else discount_value is null
    end
  ),
  check (discount_type <> 'percent_off' or discount_value <= 100)
);

create index deals_business_idx on public.deals (business_id);

-- The billing record: one row per verified visit. Only Edge Functions insert here.
create table public.redemptions (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null,
  business_id uuid not null references public.businesses (id),
  student_id uuid not null references public.profiles (id),
  redeemed_at timestamptz not null default now(),
  redeemed_on date not null, -- campus date, set by the function
  method text not null check (method in ('sticker', 'pin', 'staff_scan')),
  student_location extensions.geography(Point, 4326),
  foreign key (deal_id, business_id) references public.deals (id, business_id),
  unique (student_id, deal_id, redeemed_on),
  check ((method = 'sticker') = (student_location is not null))
);

create index redemptions_business_idx on public.redemptions (business_id, redeemed_at);
create index redemptions_deal_idx on public.redemptions (deal_id);

alter table public.campuses enable row level security;
alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.deals enable row level security;
alter table public.redemptions enable row level security;
