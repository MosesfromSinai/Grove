"use client";

import Link from "next/link";
import { Activity, CalendarDays, Check, Clock3, Plus, RefreshCw, Tags, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { getBusinessOverview, getMyDeals, isMockData, subscribeToRedemptions, type BusinessOverview, type MyDeal, type RedemptionConnection } from "@/lib/supabase";
import { BusinessAccessError } from "@/lib/supabase/business-errors";
import { CAMPUS_TZ, dealStatus, liveUntil } from "@/lib/supabase/deal-status";
import { TruckLocation } from "@/components/map/truck-location";
import { BusinessLoading, BusinessName, useBusiness } from "./business-context";

const time = new Intl.DateTimeFormat("en-US", { timeZone: CAMPUS_TZ, hour: "numeric", minute: "2-digit" });
const dateTime = new Intl.DateTimeFormat("en-US", { timeZone: CAMPUS_TZ, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const methods = { sticker: "Counter sticker", pin: "Backup PIN", staff_scan: "Staff scan" };
type Snapshot = { overview: BusinessOverview; deals: MyDeal[] };

export function BusinessOverviewPage() {
  const { profile, updateProfile } = useBusiness();
  // #94: food-truck owners move their pin from here; update_truck_location is owner-only.
  const truckOwner = profile?.business.is_truck && profile.membership_role === "owner";
  return <>
    <header className="mb-7 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div className="min-w-0"><p className="mb-1 text-sm font-bold text-green-dark [overflow-wrap:anywhere]"><BusinessName /></p>
        <h1 className="text-3xl sm:text-4xl">Overview</h1><p className="mt-2 text-ink-muted">A little local love. More students through your door.</p></div>
      <Link href="/dashboard/deals/new" className={buttonVariants({ size: "lg", className: "rounded-button" })}><Plus aria-hidden="true" className="size-5" />Post a deal</Link>
    </header>
    {profile && truckOwner && <div className="mb-6"><TruckLocation businessId={profile.business.id}
      onMoved={({ lat, lng }) => updateProfile({ ...profile, business: { ...profile.business, lat, lng } })} /></div>}
    {profile ? <Overview key={profile.business.id} businessId={profile.business.id} /> : <BusinessLoading />}
  </>;
}

function Overview({ businessId }: { businessId: string }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState("");
  const [connection, setConnection] = useState<RedemptionConnection>("connecting");
  const [refreshing, setRefreshing] = useState(true);
  const [now, setNow] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const refresh = useRef<() => void>(() => {});

  useEffect(() => {
    let active = true;
    let loading = false;
    let queued = false;
    async function load() {
      if (!active) return;
      if (loading) { queued = true; return; }
      loading = true;
      setRefreshing(true);
      try {
        const [overview, deals] = await Promise.all([getBusinessOverview({ businessId }), getMyDeals({ businessId })]);
        if (active) { setSnapshot({ overview, deals }); setNow(Date.now()); setError(""); }
      } catch (error) {
        if (active) {
          if (error instanceof BusinessAccessError) { setSnapshot(null); setError("Sign in with a current membership for this business to view its overview."); }
          else setError("We could not refresh the overview. Please try again.");
        }
      } finally {
        loading = false;
        if (active) { setRefreshing(false); if (queued) { queued = false; void load(); } }
      }
    }
    refresh.current = () => { void load(); };
    let unsubscribe = () => {};
    try {
      unsubscribe = subscribeToRedemptions({ businessId }, visit => {
        if (!active || visit.business_id !== businessId) return;
        setAnnouncement("A verified visit arrived. Updating your overview.");
        void load();
      }, state => { if (active) { setConnection(state); if (state === "live") void load(); } });
    } catch { queueMicrotask(() => { if (active) setConnection("reconnecting"); }); }
    void load();
    const poll = window.setInterval(() => { void load(); }, 60_000);
    const clock = window.setInterval(() => setNow(Date.now()), 15_000);
    const visible = () => { if (document.visibilityState === "visible") void load(); };
    const online = () => { void load(); };
    const offline = () => setConnection("reconnecting");
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => { active = false; refresh.current = () => {}; unsubscribe(); window.clearInterval(poll); window.clearInterval(clock);
      document.removeEventListener("visibilitychange", visible); window.removeEventListener("online", online); window.removeEventListener("offline", offline); };
  }, [businessId]);

  const at = new Date(now);
  const live = snapshot?.deals.filter(deal => dealStatus(deal, at) === "live") ?? [];
  const summaries = [
    { label: "Today's redemptions", icon: Users, value: snapshot?.overview.today, detail: "Since midnight" },
    { label: "This week's redemptions", icon: CalendarDays, value: snapshot?.overview.week, detail: "Since Monday" },
    { label: "Active deals", icon: Tags, value: snapshot ? live.length : undefined, detail: "Live right now" },
  ];
  return <>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <p className="text-xs leading-relaxed text-ink-fine">UC Riverside time · Weeks start Monday{snapshot && <> · Updated <time dateTime={snapshot.overview.as_of}>{time.format(new Date(snapshot.overview.as_of))}</time></>}</p>
      <Button variant="ghost" size="sm" onClick={() => refresh.current()} disabled={refreshing}><RefreshCw aria-hidden="true" className="size-4" />{refreshing ? "Refreshing…" : "Refresh overview"}</Button>
    </div>
    {error && <div role="alert" className="mb-5 rounded-button border border-border-strong bg-surface-dashboard p-4"><p className="text-sm text-destructive">{error} {snapshot && "Showing the last successfully loaded values."}</p><Button variant="outline" className="mt-3" onClick={() => refresh.current()} disabled={refreshing}>Retry overview</Button></div>}
    {!snapshot && !error && <p role="status" className="mb-4 text-sm text-ink-muted">Loading your overview…</p>}
    <section aria-label="Business summary" aria-busy={refreshing} className="grid gap-4 sm:grid-cols-3">
      {summaries.map(({ label, icon: Icon, value, detail }) => <article key={label} className="rounded-card border border-border bg-surface-dashboard p-5 shadow-card">
        <div className="flex items-center justify-between gap-3"><h2 className="font-sans text-sm font-bold tracking-normal text-ink-muted">{label}</h2><Icon aria-hidden="true" className="size-5 shrink-0 text-green" /></div>
        <p className="mt-4 font-heading text-5xl font-extrabold">{value === undefined ? <><span aria-hidden="true">—</span><span className="sr-only">Unavailable</span></> : value.toLocaleString("en-US")}</p>
        <p className="mt-2 text-xs text-ink-fine">{detail}{label !== "Active deals" && " · campus time"}</p>
      </article>)}
    </section>
    <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <section aria-labelledby="active-deals" className="order-last min-w-0 rounded-card border border-border bg-surface-dashboard p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-soft pb-4"><h2 id="active-deals" className="text-xl">Live right now</h2><Link href="/dashboard/deals" className="inline-flex min-h-11 items-center rounded-button text-sm font-bold text-green-dark underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green">My deals</Link></div>
        {!snapshot ? <p className="py-8 text-sm text-ink-muted">{error ? "Deals unavailable." : "Loading active deals…"}</p> : live.length ? <ul className="divide-y divide-border-soft">{live.map(deal => {
          const until = liveUntil(deal, at);
          return <li key={deal.id} className="py-5"><div className="flex flex-wrap items-start justify-between gap-3"><h3 className="min-w-0 flex-1 text-lg [overflow-wrap:anywhere]">{deal.title}</h3><span className="inline-flex items-center gap-1.5 rounded-pill bg-green-tint px-2.5 py-1 text-xs font-bold text-green-dark"><span className="size-1.5 rounded-full bg-green" />Live</span></div>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted [overflow-wrap:anywhere]">{deal.description}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-fine"><span className="inline-flex items-center gap-1"><Clock3 aria-hidden="true" className="size-3.5" />{until ? <>Until <time dateTime={until}>{dateTime.format(new Date(until))}</time></> : "Until turned off"}</span><span>{deal.visibility === "link_only" ? "Link only" : "Public"}</span></div>
          </li>;
        })}</ul> : <Empty icon="deals" title="No deals live right now" text="Post a deal to give students a reason to stop by. Scheduled deals appear here when their window opens." />}
      </section>
      <section aria-labelledby="recent-visits" className="order-first min-w-0 rounded-card border border-border bg-surface-dashboard p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-soft pb-4"><h2 id="recent-visits" className="flex min-h-11 items-center text-xl">Live visits</h2><span role="status" className="inline-flex items-center gap-1.5 text-xs font-bold text-green-dark"><span className={`size-1.5 rounded-full ${connection === "live" && !error ? "bg-green" : "bg-ink-muted"}`} />{error ? "Refresh needed" : connection === "live" ? isMockData ? "Demo feed" : "Live" : connection === "connecting" ? "Connecting" : "Reconnecting"}</span></div>
        <p className="mt-3 text-xs leading-relaxed text-ink-fine">Latest 8 verified visits · {isMockData ? "Sample data" : connection === "live" ? "Updates as students redeem" : "Refreshing every minute while the live feed connects"}</p>
        {!snapshot ? <p className="py-8 text-sm text-ink-muted">{error ? "Visits unavailable." : "Loading recent visits…"}</p> : snapshot.overview.recentVisits.length ? <ol className="mt-1 divide-y divide-border-soft">{snapshot.overview.recentVisits.map(visit => <li key={visit.id} className="flex items-start gap-3 py-4">
          <span className="mt-0.5 rounded-full bg-green-tint p-2 text-green"><Check aria-hidden="true" className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-bold">Verified student visit</p><p className="mt-1 text-sm text-ink-muted [overflow-wrap:anywhere]">{visit.deal_title || "Deal"}</p><p className="mt-1 text-xs leading-relaxed text-ink-fine">{methods[visit.method]} · <time dateTime={visit.redeemed_at}>{dateTime.format(new Date(visit.redeemed_at))}</time></p></div>
        </li>)}</ol> : <Empty icon="visits" title="Every visit counts" text="Your first verified student visit will appear here. Sticker, PIN, and staff-scan redemptions all count." />}
      </section>
    </div>
    <p role="status" className="sr-only">{announcement}</p>
  </>;
}

function Empty({ icon, title, text }: { icon: "deals" | "visits"; title: string; text: string }) {
  const Icon = icon === "deals" ? Tags : Activity;
  return <div className="flex min-h-56 flex-col items-center justify-center py-8 text-center"><span className="mb-4 rounded-button bg-green-tint p-3 text-green"><Icon aria-hidden="true" className="size-6" /></span><h3 className="text-lg">{title}</h3><p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-muted">{text}</p></div>;
}
