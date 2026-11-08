"use client";

import { useState } from "react";
import { CalendarDays, Clock3, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ClubNight } from "@/lib/supabase";
import { CAMPUS_TZ } from "@/lib/supabase/deal-status";
import { clubNightSchedule } from "./club-night-format";

const readTime = new Intl.DateTimeFormat("en-US", { timeZone: CAMPUS_TZ, month: "short", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit" });
type Props = {
  nights: ClubNight[] | null;
  busy: boolean;
  disabled: boolean;
  error: string;
  updatedAt: string | null;
  onRefresh: () => void;
  onReloadBusiness?: () => void;
};

export function ClubNightResults({ nights, busy, disabled, error, updatedAt, onRefresh, onReloadBusiness }: Props) {
  const [visible, setVisible] = useState(20);
  const shown = nights?.slice(0, visible);
  return <section aria-labelledby="club-night-results-heading" aria-busy={busy} className="mt-6 rounded-card border border-border bg-surface-dashboard p-5 shadow-card sm:p-7">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="club-night-results-heading" className="text-2xl">Posted nights</h2><Button variant="outline" disabled={busy || disabled} onClick={onRefresh}><RefreshCw aria-hidden="true" className="size-4" />{busy ? "Refreshing…" : "Refresh posted nights"}</Button></div>
    <p className="mt-3 text-sm leading-relaxed text-ink-muted">Club names are entered when a student claims a night. Verified visits count successful redemptions of that night’s linked deal.</p>
    <p role="status" className="mt-3 text-xs leading-relaxed text-ink-fine">{nights ? `Showing ${Math.min(visible, nights.length)} of ${nights.length} nights` : "Results not loaded"}{updatedAt && <> · Last refreshed <time dateTime={updatedAt}>{readTime.format(new Date(updatedAt))}</time></>} · UC Riverside time. Refresh for new claims and visits.</p>
    {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}{onReloadBusiness && <Button variant="outline" onClick={onReloadBusiness} className="mt-3">Reload business</Button>}
    {!nights ? <p role="status" className="mt-5 text-sm text-ink-muted">{error ? "Posted nights unavailable." : "Loading posted nights…"}</p> : nights.length === 0 ? <p className="mt-5 text-sm text-ink-muted">No posted club nights from the last refresh.</p> : <>
      <ul className="mt-4 divide-y divide-border-soft">{shown!.map(night => <li key={night.id} className="py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1"><p className="flex items-start gap-2 text-sm font-bold"><CalendarDays aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-green" /><span>{clubNightSchedule(night)}</span></p><p className="mt-2 whitespace-pre-line text-sm text-ink-muted [overflow-wrap:anywhere]">{night.giveback}</p></div>
          <span className={`inline-flex shrink-0 items-center gap-1 rounded-pill px-3 py-1 text-xs font-bold ${night.status === "claimed" ? "bg-green-tint text-green-dark" : night.status === "open" ? "bg-peach text-brown" : "bg-border-soft text-ink-muted"}`}><Clock3 aria-hidden="true" className="size-3.5" />{night.status === "claimed" ? "Claimed" : night.status === "expired" ? "Expired" : "Open"} at last refresh</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0"><p className="text-xs font-bold text-ink-fine">Claimed club</p><p className="mt-1 font-bold [overflow-wrap:anywhere]">{night.claimed_club_name ?? "Not claimed"}</p></div>
          <div className="flex items-center gap-3 rounded-button bg-bg-dashboard px-4 py-3"><Users aria-hidden="true" className="size-5 shrink-0 text-green" /><p className="text-sm"><span className="font-heading text-2xl font-extrabold">{night.visit_count.toLocaleString("en-US")}</span><span className="ml-2 text-ink-muted">{night.visit_count === 1 ? "verified visit" : "verified visits"}</span></p></div>
        </div>
      </li>)}</ul>
      {nights.length > visible && <Button variant="outline" onClick={() => setVisible(value => value + 20)} className="mt-4">Show more nights</Button>}
    </>}
  </section>;
}
