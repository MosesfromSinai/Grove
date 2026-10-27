-- PIN redemption check (#15): the deal exists, belongs to this business, and is live now.
-- redeem-pin calls it before checking the PIN, so a wrong business or a dead deal is DEAL_NOT_LIVE.
create function public.deal_live_at(p_deal uuid, p_business uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(
    (select public.deal_status(d) = 'live' from public.deals d where d.id = p_deal and d.business_id = p_business),
    false);
$$;

revoke execute on function public.deal_live_at(uuid, uuid) from public, anon, authenticated;
grant execute on function public.deal_live_at(uuid, uuid) to service_role;
