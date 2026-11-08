"use client";

import { BarChart3, Clock3, RefreshCw, Tags, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getBusinessStats, isMockData, type BusinessStats } from "@/lib/supabase";
import { BusinessAccessError } from "@/lib/supabase/business-errors";
import { CAMPUS_TZ } from "@/lib/supabase/deal-status";
import { BusinessLoading, useBusiness } from "./business-context";
import { confirmedStats, hourLabel, statsPeriod, type StatsDays, type StatsPeriod } from "./stats-format";
import { StatsCharts } from "./stats-charts";

const calendar = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" });
const timestamp = new Intl.DateTimeFormat("en-US", { timeZone: CAMPUS_TZ, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
type Snapshot = { stats: BusinessStats; period: StatsPeriod };

export function BusinessStatsPage() {
  const { profile } = useBusiness();
  if (!profile) return <BusinessLoading />;
  // #21 is still open. The legacy real wrapper fetches raw rows without
  // membership/pagination guarantees, so do not present it as complete stats.
  if (!isMockData) return <section aria-labelledby="stats-unavailable" className="rounded-card border border-border bg-surface-dashboard p-6 shadow-card">
    <h2 id="stats-unavailable" className="text-xl">Stats are not available yet</h2>
    <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-muted">Grove is still connecting your reporting. You can continue managing deals and viewing visits on Overview. Check with Grove for availability.</p>
  </section>;
  return <StatsPanel key={profile.business.id} businessId={profile.business.id} />;
}

function StatsPanel({ businessId }: { businessId: string }) {
  const { refresh } = useBusiness();
  const [days, setDays] = useState<StatsDays>(7);
  const [revision, setRevision] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    let active = true;
    async function load() {
      setBusy(true);
      try {
        const period = statsPeriod(days);
        const stats = confirmedStats(await getBusinessStats({ businessId, from: period.from, to: period.to }));
        if (active) { setSnapshot({ stats, period }); setError(""); }
      } catch (error) {
        if (active) {
          if (error instanceof BusinessAccessError) { setSnapshot(null); setBlocked(true); setError("Your business access has changed. Reload your business to continue."); }
          else setError("We could not confirm your stats. Try refreshing. Any previous results may be out of date.");
        }
      } finally { if (active) setBusy(false); }
    }
    queueMicrotask(() => { if (active) void load(); });
    return () => { active = false; };
  }, [businessId, days, revision]);

  const stats = snapshot?.stats;
  const maxHour = stats ? Math.max(...stats.perHour.map(row => row.count)) : 0;
  const peaks = stats?.perHour.filter(row => maxHour > 0 && row.count === maxHour) ?? [];
  const summaries = [
    { label: "Verified visits", icon: Users, value: stats?.total.toLocaleString("en-US"), detail: "Successful redemptions in this range" },
    { label: "Deals with visits", icon: Tags, value: stats?.perDeal.filter(row => row.count > 0).length.toLocaleString("en-US"), detail: "Public and link-only deals" },
    { label: "Busiest hour", icon: Clock3, value: stats ? peaks.length === 1 ? hourLabel(peaks[0].hour) : peaks.length > 1 ? "Multiple hours" : "No visits" : undefined, detail: maxHour ? `${maxHour.toLocaleString("en-US")} ${maxHour === 1 ? "visit" : "visits"} per peak hour · campus time` : "Based on recorded visits" },
  ];
  return <>
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div><label htmlFor="stats-period" className="block text-sm font-bold">Date range</label><select id="stats-period" value={days} disabled={blocked} onChange={event => setDays(event.target.value === "30" ? 30 : 7)} className="mt-2 min-h-12 rounded-button border border-border-strong bg-surface-dashboard px-4 text-base font-bold outline-none focus-visible:ring-2 focus-visible:ring-green"><option value="7">Last 7 days</option><option value="30">Last 30 days</option></select></div>
      <Button variant="outline" disabled={busy || blocked} onClick={() => setRevision(value => value + 1)}><RefreshCw aria-hidden="true" className="size-4" />{busy ? "Refreshing…" : "Refresh stats"}</Button>
    </div>
    <p className="mb-4 text-sm leading-relaxed text-ink-muted">UC Riverside time · Includes today, up to the latest refresh. Sticker, PIN and staff-scan visits all count. Visits are redemptions, not unique customers.</p>
    <p className="mb-5 text-sm font-bold text-brown">Demo stats · Calculated from sample visits. Sample changes reset on reload.</p>
    {error && <div role="alert" className="mb-5 rounded-button border border-border-strong bg-surface-dashboard p-4"><p className="text-sm text-destructive">{error}</p>{blocked ? <Button variant="outline" onClick={refresh} className="mt-3">Reload business</Button> : <Button variant="outline" disabled={busy} onClick={() => setRevision(value => value + 1)} className="mt-3">Retry stats</Button>}</div>}
    <p role="status" className="mb-5 text-xs leading-relaxed text-ink-fine">{busy && (snapshot ? "Loading the selected range. Previous results are shown below. " : "Loading stats… ")}{snapshot ? <>Showing {snapshot.period.days} days: {calendar.format(new Date(`${snapshot.period.firstDate}T12:00Z`))} – {calendar.format(new Date(`${snapshot.period.lastDate}T12:00Z`))} · Refreshed <time dateTime={snapshot.period.to}>{timestamp.format(new Date(snapshot.period.to))}</time> · Campus time.</> : error ? "Stats unavailable." : ""}</p>
    <section aria-label="Stats summary" aria-busy={busy} className="grid gap-4 sm:grid-cols-3">{summaries.map(({ label, icon: Icon, value, detail }) => <article key={label} className="min-w-0 rounded-card border border-border bg-surface-dashboard p-5 shadow-card"><div className="flex items-start justify-between gap-3"><h2 className="font-sans text-sm font-bold tracking-normal text-ink-muted">{label}</h2><Icon aria-hidden="true" className="size-5 shrink-0 text-green" /></div><p className={`mt-4 font-heading font-extrabold [overflow-wrap:anywhere] ${label === "Busiest hour" ? "text-3xl" : "text-5xl"}`}>{value ?? <><span aria-hidden="true">—</span><span className="sr-only">Unavailable</span></>}</p><p className="mt-2 text-xs leading-relaxed text-ink-fine">{detail}</p></article>)}</section>
    {stats && (stats.total === 0 ? <section className="mt-6 flex min-h-64 flex-col items-center justify-center rounded-card border border-border bg-surface-dashboard p-6 text-center shadow-card"><BarChart3 aria-hidden="true" className="size-9 text-green" /><h2 className="mt-4 text-xl">No verified visits in this range</h2><p className="mt-3 max-w-md text-sm text-ink-muted">Try a different date range or refresh after a student redeems a deal.</p></section> : <StatsCharts stats={stats} />)}
  </>;
}
