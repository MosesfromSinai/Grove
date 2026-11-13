-- Push is opt-in. Endpoints, keys and saved alert areas never have browser table grants.
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  campus_id uuid not null references public.campuses(id),
  endpoint text not null unique check (length(endpoint) <= 4096 and endpoint ~ '^https://(fcm[.]googleapis[.]com|updates[.]push[.]services[.]mozilla[.]com|web[.]push[.]apple[.]com)/[^[:space:]#]+$'),
  keys jsonb not null check (jsonb_typeof(keys) = 'object'
    and coalesce(keys->>'p256dh','') ~ '^B[A-Za-z0-9_-]{86}$'
    and coalesce(keys->>'auth','') ~ '^[A-Za-z0-9_-]{22}$'),
  location extensions.geography(Point,4326) not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days'
);
create index push_subscriptions_user_idx on public.push_subscriptions(user_id);
create index push_subscriptions_location_idx on public.push_subscriptions using gist(location);
create table public.push_deliveries (
  subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  window_start timestamptz not null,
  created_at timestamptz not null default now(),
  outcome text not null default 'claimed' check(outcome in ('claimed','sent','failed')),
  primary key(subscription_id,deal_id,window_start)
);
create index push_deliveries_created_idx on public.push_deliveries(created_at);
alter table public.push_subscriptions enable row level security;
alter table public.push_deliveries enable row level security;
revoke all on public.push_subscriptions, public.push_deliveries from public, anon, authenticated;
grant all on public.push_subscriptions, public.push_deliveries to service_role;

create function public.save_push_subscription(p_endpoint text,p_keys jsonb,p_lat float8,p_lng float8)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare who public.profiles; expiry timestamptz;
begin
  select * into who from public.profiles where id=auth.uid();
  if who.id is null then return jsonb_build_object('ok',false,'error','NOT_SIGNED_IN'); end if;
  if who.role <> 'student' or not who.verified_student or who.campus_id is null then
    return jsonb_build_object('ok',false,'error','NOT_VERIFIED_STUDENT'); end if;
  if p_lat is null or p_lng is null or not(p_lat between -90 and 90 and p_lng between -180 and 180) then
    return jsonb_build_object('ok',false,'error','INVALID_LOCATION'); end if;
  if p_endpoint is null or length(p_endpoint)>4096 or p_endpoint !~ '^https://(fcm[.]googleapis[.]com|updates[.]push[.]services[.]mozilla[.]com|web[.]push[.]apple[.]com)/[^[:space:]#]+$'
     or p_keys is null or jsonb_typeof(p_keys)<>'object'
     or coalesce(p_keys->>'p256dh','') !~ '^B[A-Za-z0-9_-]{86}$' or coalesce(p_keys->>'auth','') !~ '^[A-Za-z0-9_-]{22}$' then
    return jsonb_build_object('ok',false,'error','INVALID_SUBSCRIPTION'); end if;
  -- Serialize per-user device limits and prevent another account taking over an endpoint.
  perform 1 from public.profiles where id=who.id for update;
  delete from public.push_subscriptions where user_id=who.id and expires_at<=now();
  if (select count(*) from public.push_subscriptions where user_id=who.id) >= 5
     and not exists(select 1 from public.push_subscriptions where endpoint=p_endpoint and user_id=who.id) then
    return jsonb_build_object('ok',false,'error','DEVICE_LIMIT'); end if;
  insert into public.push_subscriptions(user_id,campus_id,endpoint,keys,location)
  values(who.id,who.campus_id,p_endpoint,jsonb_build_object('p256dh',p_keys->>'p256dh','auth',p_keys->>'auth'),
    extensions.st_setsrid(extensions.st_makepoint(round(p_lng::numeric,3)::float8,round(p_lat::numeric,3)::float8),4326)::extensions.geography)
  on conflict(endpoint) do update set keys=excluded.keys,location=excluded.location,campus_id=excluded.campus_id,expires_at=now()+interval '7 days'
    where public.push_subscriptions.user_id=who.id
  returning expires_at into expiry;
  if expiry is null then return jsonb_build_object('ok',false,'error','SUBSCRIPTION_IN_USE'); end if;
  return jsonb_build_object('ok',true,'expires_at',expiry);
end; $$;

create function public.get_push_subscription(p_endpoint text)
returns jsonb language sql stable security definer set search_path = '' as $$
 select coalesce((select jsonb_build_object('active',s.expires_at>now(),'expires_at',s.expires_at)
   from public.push_subscriptions s join public.profiles p on p.id=s.user_id
   where s.endpoint=p_endpoint and s.user_id=auth.uid() and p.verified_student and p.role='student'),
   jsonb_build_object('active',false,'expires_at',null));
$$;
create function public.remove_push_subscription(p_endpoint text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is null then return jsonb_build_object('ok',false,'error','NOT_SIGNED_IN'); end if;
 delete from public.push_subscriptions where endpoint=p_endpoint and user_id=auth.uid();
 return jsonb_build_object('ok',true);
end; $$;
revoke all on function public.save_push_subscription(text,jsonb,float8,float8), public.get_push_subscription(text),public.remove_push_subscription(text) from public,anon;
grant execute on function public.save_push_subscription(text,jsonb,float8,float8), public.get_push_subscription(text),public.remove_push_subscription(text) to authenticated;

-- Service-only dispatcher. One attempt per public live deal/window/device, capped at
-- three attempts per subscription per rolling 24h. Revocation deletes its history;
-- re-enabling creates a new setup and allowance. This prioritizes deleting preferences
-- over tracking a device after opt-out. Claims happen BEFORE network sends; uncertain sends
-- are not retried, so a crashed worker can miss an alert but cannot spam retries.
create function public.claim_push_deliveries(p_deal_id uuid default null,p_limit int default 50)
returns table(subscription_id uuid,deal_id uuid,window_start timestamptz,endpoint text,keys jsonb,business_name text,title text,live_until timestamptz)
language plpgsql security definer set search_path = '' as $$
begin
 if p_limit is null or p_limit<1 or p_limit>100 then raise exception 'Invalid batch size'; end if;
 perform pg_advisory_xact_lock(17512026);
 delete from public.push_subscriptions where expires_at<=now();
 delete from public.push_deliveries where created_at<now()-interval '30 days';
 return query
 with live as (
  select d.id,b.campus_id,b.location,b.name,d.title,
    case when d.active_days is null then d.starts_at else greatest(d.starts_at,
      (((now() at time zone c.timezone)::date+d.daily_start) at time zone c.timezone)) end as ws,
    case when d.active_days is null then d.ends_at else least(d.ends_at,
      (((now() at time zone c.timezone)::date+d.daily_end) at time zone c.timezone)) end as until
  from public.deals d join public.businesses b on b.id=d.business_id join public.campuses c on c.id=b.campus_id
  where (p_deal_id is null or d.id=p_deal_id) and d.visibility='public' and public.deal_status(d)='live'
 ), candidates as (
  select s.id as sid,l.*,row_number() over(partition by s.id order by l.ws,l.id) as n,
    (select count(*) from public.push_deliveries old where old.subscription_id=s.id and old.created_at>now()-interval '24 hours') as used
  from public.push_subscriptions s join public.profiles p on p.id=s.user_id
  join live l on l.campus_id=s.campus_id and extensions.st_dwithin(l.location,s.location,3000)
  where s.expires_at>now() and p.verified_student and p.role='student' and p.campus_id=s.campus_id
   and not exists(select 1 from public.push_deliveries done where done.subscription_id=s.id and done.deal_id=l.id and done.window_start=l.ws)
 ), claimed as (
  insert into public.push_deliveries(subscription_id,deal_id,window_start)
  select sid,id,ws from candidates where n<=greatest(0,3-used) order by ws,id,sid limit p_limit
  on conflict do nothing returning *
 )
 select s.id,l.id,l.ws,s.endpoint,s.keys,l.name,l.title,l.until
 from claimed q join public.push_subscriptions s on s.id=q.subscription_id join live l on l.id=q.deal_id and l.ws=q.window_start;
end; $$;
revoke all on function public.claim_push_deliveries(uuid,int) from public,anon,authenticated;
grant execute on function public.claim_push_deliveries(uuid,int) to service_role;


-- Re-check consent, visibility and current saved area immediately before each send.
create function public.push_delivery_eligible(p_subscription_id uuid,p_deal_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.push_subscriptions s
 join public.profiles p on p.id=s.user_id
 join public.deals d on d.id=p_deal_id
 join public.businesses b on b.id=d.business_id
 where s.id=p_subscription_id and s.expires_at>now() and p.role='student' and p.verified_student
 and p.campus_id=s.campus_id and b.campus_id=s.campus_id and d.visibility='public'
 and public.deal_status(d)='live' and extensions.st_dwithin(b.location,s.location,3000));
$$;
revoke all on function public.push_delivery_eligible(uuid,uuid) from public,anon,authenticated;
grant execute on function public.push_delivery_eligible(uuid,uuid) to service_role;
