-- PIN hashing (bcrypt via pgcrypto) and PIN rate limiting for redeem-pin (#36, #37).
-- Owner: Celso. Reviewed by: Moses.
--
-- Usage from Edge Functions:
--   is_pin_rate_limited(business_id)  -> check before attempting
--   verify_pin(business_id, pin)      -> compare input against stored hash
--   record_pin_attempt(business_id, succeeded) -> record after result is known
--   hash_pin(pin)                     -> called by set-pin to store a hashed PIN
--
-- PIN lockout: 5 failures in a 15-minute window triggers RATE_LIMITED.
-- See _shared/pin.ts for typed TypeScript wrappers.

create extension if not exists pgcrypto with schema extensions;

-- Hashes a 4-digit PIN using bcrypt (10 rounds). Called by set-pin.
create function public.hash_pin(pin text)
returns text
language sql security definer volatile set search_path = ''
as $$
  select extensions.crypt(pin, extensions.gen_salt('bf', 10));
$$;

-- Verifies a PIN against the stored bcrypt hash for a business.
-- Reads staff_pin internally; never returns it. Returns false if no PIN is set.
create function public.verify_pin(bid uuid, input_pin text)
returns boolean
language plpgsql security definer stable set search_path = ''
as $$
declare
  stored text;
begin
  select staff_pin into stored from public.businesses where id = bid;
  if stored is null then
    return false;
  end if;
  return extensions.crypt(input_pin, stored) = stored;
end;
$$;

-- Tracks PIN attempts per business for rate limiting.
-- Only readable and writable by service role (Edge Functions).
create table public.pin_attempts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  attempted_at timestamptz not null default now(),
  success boolean not null
);

create index pin_attempts_business_time_idx on public.pin_attempts (business_id, attempted_at);

alter table public.pin_attempts enable row level security;

-- Returns true if the business is locked out (>=5 failures in the last 15 minutes).
create function public.is_pin_rate_limited(bid uuid)
returns boolean
language sql security definer stable set search_path = ''
as $$
  select count(*) >= 5
  from public.pin_attempts
  where business_id = bid
    and success = false
    and attempted_at > now() - interval '15 minutes';
$$;

-- Records a PIN attempt. Called after the verify result is known.
create function public.record_pin_attempt(bid uuid, succeeded boolean)
returns void
language sql security definer set search_path = ''
as $$
  insert into public.pin_attempts (business_id, success) values (bid, succeeded);
$$;

-- Rate limits general redeem attempts per student (flood protection).
-- The unique constraint on (student_id, deal_id, redeemed_on) handles the daily limit;
-- this catches rapid repeated calls before they hit the unique check.
create function public.is_redeem_rate_limited(sid uuid)
returns boolean
language sql security definer stable set search_path = ''
as $$
  select count(*) >= 10
  from public.redemptions
  where student_id = sid
    and redeemed_at > now() - interval '1 minute';
$$;
