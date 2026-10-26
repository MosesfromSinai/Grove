"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Plus, Tags } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cancelDeal, endDeal, getMyDeals } from "@/lib/supabase/business";
import { CAMPUS_TZ } from "@/lib/supabase/deal-status";
import type { DealMutationError, DealStatus, MyDeal } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const tabs = [{ status: "live", label: "Active" }, { status: "scheduled", label: "Scheduled" }, { status: "ended", label: "Expired" }] as const;
const dateTime = new Intl.DateTimeFormat("en-US", { timeZone: CAMPUS_TZ, year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const failureMessages: Record<DealMutationError, string> = {
  NOT_OWNER: "You do not have permission to manage deals for this business.",
  DEAL_NOT_FOUND: "This deal is no longer available. The list has been refreshed.",
  DEAL_NOT_LIVE: "This deal can no longer be ended now. Check its updated status.",
  DEAL_NOT_SCHEDULED: "Only scheduled deals can be canceled. Check its updated status.",
  DEAL_HAS_REDEMPTIONS: "This deal has recorded redemptions and cannot be deleted.",
  DEAL_IN_USE: "This deal belongs to a club night and cannot be canceled here.",
};

export function MyDeals() {
  const [deals, setDeals] = useState<MyDeal[] | null>(null);
  const [tab, setTab] = useState<DealStatus>("live");
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [message, setMessage] = useState("");
  const [revision, setRevision] = useState(0);
  const [checkedAt, setCheckedAt] = useState(0);
  const [confirmation, setConfirmation] = useState<{ deal: MyDeal; action: "end" | "cancel" } | null>(null);
  const [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const tabButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const inFlight = useRef(false);
  const generation = useRef(0);

  useEffect(() => {
    let active = true;
    async function load() {
      if (inFlight.current) return;
      const request = ++generation.current;
      try {
        const rows = await getMyDeals({ businessId: "biz-opt" });
        if (active && request === generation.current) { setDeals(rows); setCheckedAt(Date.now()); setLoadError(""); }
      } catch {
        if (active && request === generation.current) setLoadError("We could not load your deals. Please try again.");
      }
    }
    function refreshVisible() { if (document.visibilityState === "visible") void load(); }
    void load();
    const interval = window.setInterval(refreshVisible, 15_000);
    window.addEventListener("focus", refreshVisible);
    document.addEventListener("visibilitychange", refreshVisible);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshVisible);
      document.removeEventListener("visibilitychange", refreshVisible);
    };
  }, [revision]);

  function tabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === "ArrowRight" ? (index + 1) % tabs.length
      : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length
      : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    setTab(tabs[next].status);
    tabButtons.current[next]?.focus();
  }

  function ask(deal: MyDeal, action: "end" | "cancel") {
    setConfirmation({ deal, action });
    requestAnimationFrame(() => { if (!dialog.current?.open) dialog.current?.showModal(); });
  }

  function closeDialog() {
    dialog.current?.close();
    setConfirmation(null);
  }

  async function confirm() {
    if (!confirmation || inFlight.current) return;
    inFlight.current = true;
    ++generation.current;
    setBusy(true);
    setActionError("");
    setMessage("");
    try {
      const input = { business_id: "biz-opt", deal_id: confirmation.deal.id };
      if (confirmation.action === "end") {
        const result = await endDeal(input);
        if (result.ok) {
          setDeals(current => current?.map(deal => deal.id === result.deal.id ? result.deal : deal) ?? null);
          setMessage("Deal ended. Its previous redemptions are kept in Expired.");
        } else setActionError(failureMessages[result.error]);
      } else {
        const result = await cancelDeal(input);
        if (result.ok) {
          setDeals(current => current?.filter(deal => deal.id !== result.deal_id) ?? null);
          setMessage("Scheduled deal canceled.");
        } else setActionError(failureMessages[result.error]);
      }
    } catch {
      setActionError("We could not complete this change. Check the refreshed list before trying again.");
    } finally {
      inFlight.current = false;
      setBusy(false);
      closeDialog();
      setRevision(current => current + 1);
      requestAnimationFrame(() => tabButtons.current[tabs.findIndex(item => item.status === tab)]?.focus());
    }
  }

  const visibleDeals = deals?.filter(deal => deal.status === tab) ?? [];
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">UC Riverside time · Sample deals reset on full page reload.</p>
        <Link href="/dashboard/deals/new" className={buttonVariants({ className: "rounded-button" })}><Plus aria-hidden="true" className="size-4" />Post a deal</Link>
      </div>

      {loadError && <div role="alert" className="mb-4 rounded-button border border-destructive bg-surface-dashboard p-4 text-sm text-destructive"><p>{loadError}</p><Button variant="outline" onClick={() => setRevision(current => current + 1)} className="mt-3">Retry loading deals</Button></div>}
      {actionError && <p role="alert" className="mb-4 rounded-button border border-destructive bg-surface-dashboard p-4 text-sm text-destructive">{actionError}</p>}
      <p role="status" className={cn("text-sm font-bold text-green-dark", message && "mb-4 rounded-button bg-green-tint p-4")}>{message}</p>

      <div role="tablist" aria-label="Deal status" className="mb-5 flex flex-wrap gap-2">
        {tabs.map(({ status, label }, index) => (
          <button key={status} ref={element => { tabButtons.current[index] = element; }} type="button" role="tab" id={`deals-tab-${status}`} aria-selected={tab === status} aria-controls="deals-panel" tabIndex={tab === status ? 0 : -1} onClick={() => setTab(status)} onKeyDown={event => tabKey(event, index)} className={cn("inline-flex min-h-11 items-center gap-2 rounded-pill border border-border-strong px-4 py-2 text-sm font-bold text-ink-nav focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green", tab === status ? "border-green-tint bg-green-tint text-green-dark" : "bg-surface-dashboard hover:bg-green-tint/50")}>
            {label}<span className="rounded-pill bg-bg-dashboard px-2 py-0.5 text-xs tabular-nums">{deals ? deals.filter(deal => deal.status === status).length : "—"}</span>
          </button>
        ))}
      </div>

      <section id="deals-panel" role="tabpanel" aria-labelledby={`deals-tab-${tab}`} tabIndex={0} className="min-w-0 rounded-card border border-border bg-surface-dashboard shadow-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green">
        {deals === null ? (!loadError && <p role="status" className="p-6 text-ink-muted">Loading your deals…</p>) : visibleDeals.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center">
            <Tags aria-hidden="true" className="size-8 text-green" />
            <h2 className="text-xl">No {tabs.find(item => item.status === tab)?.label.toLowerCase()} deals</h2>
            <p className="max-w-sm text-sm text-ink-muted">{tab === "ended" ? "Deals that finish or are ended now will appear here." : tab === "scheduled" ? "Upcoming and repeating deals appear here when they are not live." : "Post a deal to give students a reason to stop by."}</p>
          </div>
        ) : <ul className="divide-y divide-border-soft">
          {visibleDeals.map(deal => {
            const canEnd = deal.status === "live" || (deal.active_days !== null && deal.status === "scheduled" && Date.parse(deal.starts_at) < checkedAt);
            return <li key={deal.id} className="grid min-w-0 gap-5 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_120px_120px] xl:items-center">
              <div className="min-w-0">
                <h2 className="break-words text-xl">{deal.title}</h2>
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                  <span className="rounded-pill bg-green-tint px-2.5 py-1 text-green-dark">{deal.visibility === "link_only" ? "Link only" : "Public"}</span>
                  {deal.students_only && <span className="rounded-pill bg-peach px-2.5 py-1 text-brown">UCR students only</span>}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted"><time dateTime={deal.starts_at}>{dateTime.format(new Date(deal.starts_at))}</time><span> – </span>{deal.ends_at ? <time dateTime={deal.ends_at}>{dateTime.format(new Date(deal.ends_at))}</time> : "Until turned off"}</p>
                {deal.active_days && <p className="mt-1 text-sm text-ink-fine">Repeats {deal.active_days.join(", ")} · {deal.daily_start}–{deal.daily_end} campus time</p>}
              </div>
              <p className="text-sm text-ink-muted"><span className="font-heading text-2xl font-extrabold tabular-nums text-ink">{deal.redemption_count.toLocaleString()}</span><span className="ml-2 xl:ml-0 xl:block">redemptions</span></p>
              <div className="justify-self-start xl:justify-self-end">
                {canEnd ? <Button variant="destructive" disabled={busy} onClick={() => ask(deal, "end")} className="rounded-button">End now</Button>
                  : deal.status === "scheduled" ? (deal.redemption_count === 0 ? <Button variant="outline" disabled={busy} onClick={() => ask(deal, "cancel")} className="rounded-button">Cancel</Button> : <p className="text-xs text-ink-fine">Recorded visits prevent cancellation.</p>)
                    : <span className="text-sm font-bold text-ink-fine">Ended</span>}
              </div>
            </li>;
          })}
        </ul>}
      </section>

      <dialog ref={dialog} aria-labelledby="deal-action-heading" aria-describedby="deal-action-description" aria-busy={busy} onCancel={event => { if (inFlight.current) event.preventDefault(); else setConfirmation(null); }} onClose={() => setConfirmation(null)} className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-card border border-border bg-surface-dashboard p-6 text-ink shadow-card backdrop:bg-ink/40">
        {confirmation && <>
          <h2 id="deal-action-heading" className="text-2xl">{confirmation.action === "end" ? "End this deal now?" : "Cancel this scheduled deal?"}</h2>
          <p className="mt-3 break-words font-bold">{confirmation.deal.title}</p>
          <p id="deal-action-description" className="mt-3 text-sm leading-relaxed text-ink-muted">{confirmation.action === "end" ? "Students will no longer be able to redeem this deal. Its previous redemptions will be kept." : "This removes the scheduled deal. Deals with recorded redemptions cannot be canceled."}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="outline" disabled={busy} onClick={closeDialog} className="rounded-button">Keep deal</Button>
            <Button variant="destructive" disabled={busy} onClick={confirm} className="rounded-button">{busy ? "Saving…" : confirmation.action === "end" ? "End now" : "Cancel deal"}</Button>
          </div>
        </>}
      </dialog>
    </>
  );
}
