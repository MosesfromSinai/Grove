-- Live visits on the business dashboard (#17). Realtime applies each subscriber's RLS and column
-- grants, so members get only their business's visits, without student_location.
alter publication supabase_realtime add table public.redemptions;
