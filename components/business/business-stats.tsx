"use client";

// Stats (#76): verified redemptions per deal and per campus hour, from getBusinessStats.
// Matches canvas BizStats; bars are plain CSS like the canvas, so no chart library is needed.
import { useEffect, useState } from "react";
import { getBusinessStats, type BusinessStats as Stats } from "@/lib/supabase";
import { BusinessLoading, useBusiness } from "./business-context";

const DAY_MS = 86_400_000;
const card = "min-w-0 rounded-card border border-border bg-surface-dashboard p-6 shadow-card";

function PerDeal({ stats }: { stats: Stats }) {
  const top = stats.perDeal[0]?.count ?? 0;
  return (
    <section aria-labelledby="per-deal-heading" className={`${card} flex-[1_1_420px]`}>
      <h2 id="per-deal-heading" className="text-2xl">Redemptions per deal</h2>
      <p className="mt-1 text-sm text-ink-muted">Verified QR check-ins for each deal</p>
      <ul className="mt-5 flex flex-col gap-4">
        {stats.perDeal.map((deal) => (
          <li key={deal.deal_id}>
            <div className="flex justify-between gap-3 text-sm">
              <span className="font-bold [overflow-wrap:anywhere]">{deal.title || "Deal"}</span>
              <span className="font-extrabold tabular-nums">{deal.count}</span>
            </div>
            <div className="mt-1.5 h-[22px] rounded-[4px] bg-border-soft" aria-hidden="true">
              <div className="h-full rounded-[4px] bg-green" style={{ width: `${top ? Math.round((deal.count / top) * 100) : 0}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function BusinessStats() {
  const { profile } = useBusiness();
  return profile ? <StatsView key={profile.business.id} businessId={profile.business.id} /> : <BusinessLoading />;
}

function StatsView({ businessId }: { businessId: string }) {
  const days = 7;
  const [stats, setStats] = useState<Stats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const to = new Date();
    getBusinessStats({ businessId, from: new Date(to.getTime() - days * DAY_MS).toISOString(), to: to.toISOString() })
      .then((s) => active && (setStats(s), setFailed(false)))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [businessId, days]);

  return (
    <>
      <header className="mb-7">
        <h1 className="text-3xl sm:text-4xl">Stats</h1>
        <p className="mt-2 text-ink-muted">
          {stats ? <><b className="text-ink">{stats.total} verified redemptions</b> in the last {days} days</> : "See how your deals bring students through the door."}
        </p>
      </header>
      {failed ? (
        <p role="alert" className="rounded-card border border-destructive bg-surface-dashboard p-5 text-sm text-destructive">Couldn&apos;t load your stats. Check your connection and try again.</p>
      ) : !stats ? (
        <p role="status" className="text-ink-muted">Loading stats…</p>
      ) : stats.total === 0 ? (
        <p className={`${card} text-ink-muted`}>No verified redemptions in this range yet. Visits show up here as students redeem.</p>
      ) : (
        <div className="flex flex-wrap items-stretch gap-5">
          <PerDeal stats={stats} />
        </div>
      )}
    </>
  );
}
