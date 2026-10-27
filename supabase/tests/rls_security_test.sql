-- Security tests for RLS policies and column-level security (#41).
-- Run with: supabase test db
-- Each test proves a specific threat from the threat model is blocked.

begin;
select plan(18);

-- ── Column-level security ─────────────────────────────────────────────────────

-- staff_pin must not appear in the column list for authenticated users.
select hasnt_column_privilege(
  'authenticated', 'public.businesses', 'staff_pin', 'SELECT',
  'authenticated cannot SELECT staff_pin'
);

-- owner_id must not appear in the column list for authenticated users.
select hasnt_column_privilege(
  'authenticated', 'public.businesses', 'owner_id', 'SELECT',
  'authenticated cannot SELECT owner_id'
);

-- claimed_by must not appear in the column list for authenticated users.
select hasnt_column_privilege(
  'authenticated', 'public.club_nights', 'claimed_by', 'SELECT',
  'authenticated cannot SELECT claimed_by'
);

-- student_location must not appear in the column list for authenticated users.
select hasnt_column_privilege(
  'authenticated', 'public.redemptions', 'student_location', 'SELECT',
  'authenticated cannot SELECT student_location'
);

-- ── Function execute privileges ───────────────────────────────────────────────

select hasnt_function_privilege(
  'anon', 'public.hash_pin(text)', 'EXECUTE',
  'anon cannot EXECUTE hash_pin'
);

select hasnt_function_privilege(
  'authenticated', 'public.hash_pin(text)', 'EXECUTE',
  'authenticated cannot EXECUTE hash_pin'
);

select hasnt_function_privilege(
  'anon', 'public.verify_pin(uuid, text)', 'EXECUTE',
  'anon cannot EXECUTE verify_pin'
);

select hasnt_function_privilege(
  'authenticated', 'public.verify_pin(uuid, text)', 'EXECUTE',
  'authenticated cannot EXECUTE verify_pin'
);

select hasnt_function_privilege(
  'anon', 'public.is_pin_rate_limited(uuid)', 'EXECUTE',
  'anon cannot EXECUTE is_pin_rate_limited'
);

select hasnt_function_privilege(
  'authenticated', 'public.is_pin_rate_limited(uuid)', 'EXECUTE',
  'authenticated cannot EXECUTE is_pin_rate_limited'
);

select hasnt_function_privilege(
  'authenticated', 'public.is_redeem_rate_limited(uuid)', 'EXECUTE',
  'authenticated cannot EXECUTE is_redeem_rate_limited'
);

select hasnt_function_privilege(
  'authenticated', 'public.record_redeem_attempt(uuid)', 'EXECUTE',
  'authenticated cannot EXECUTE record_redeem_attempt'
);

-- ── RLS policy checks ─────────────────────────────────────────────────────────

-- campuses: anon can read
select policies_are(
  'public', 'campuses',
  array['campuses_read'],
  'campuses has exactly the expected policies'
);

-- pin_attempts: no policies at all means service role only
select table_privs_are(
  'public', 'pin_attempts', 'authenticated',
  array[]::text[],
  'authenticated has no privileges on pin_attempts'
);

select table_privs_are(
  'public', 'pin_attempts', 'anon',
  array[]::text[],
  'anon has no privileges on pin_attempts'
);

-- redeem_attempts: service role only
select table_privs_are(
  'public', 'redeem_attempts', 'authenticated',
  array[]::text[],
  'authenticated has no privileges on redeem_attempts'
);

select table_privs_are(
  'public', 'redeem_attempts', 'anon',
  array[]::text[],
  'anon has no privileges on redeem_attempts'
);

-- redemptions: no insert/update/delete for authenticated (only Edge Functions via service role)
select hasnt_table_privilege(
  'authenticated', 'public.redemptions', 'INSERT',
  'authenticated cannot INSERT into redemptions'
);

select * from finish();
rollback;
