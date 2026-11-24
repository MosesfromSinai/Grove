"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import { untilLabel } from "@/components/student/format";
import { formatDistance, type MapBusiness } from "@/lib/geo/nearby";
import { StatusPill } from "./status-pill";

export function PinDetails({
  business,
  onClose,
}: {
  business: MapBusiness | null;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (business && !dialog.current?.open) dialog.current?.showModal();
    if (!business && dialog.current?.open) dialog.current.close();
  }, [business]);

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-labelledby="pin-details-title"
      className="fixed inset-x-0 bottom-0 top-auto mx-auto mb-0 max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-card border bg-surface p-5 pt-3 shadow-card backdrop:bg-ink/40"
    >
      {business && (
        <>
          <div className="mx-auto mb-3 h-1 w-10 rounded-pill bg-border-strong" aria-hidden="true" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="pin-details-title" className="text-2xl">
                {business.name}
              </h2>
              <p className="mt-1 flex items-center gap-2 text-sm text-ink-muted">
                <StatusPill open={business.openNow} />
                {formatDistance(business.distanceM)} away
              </p>
            </div>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label="Close place details"
              className="flex size-11 shrink-0 items-center justify-center rounded-button border bg-surface focus-visible:outline-2 focus-visible:outline-green"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          {business.deals.length ? (
            <>
              <ul className="mt-4 grid gap-3" aria-label="Live deals">
                {business.deals.map((deal) => (
                  <li key={deal.deal_id} className="flex items-center gap-3 rounded-card bg-peach p-3.5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-button bg-orange text-ink" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="7.5" r="1.5" /></svg>
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold tracking-wider text-brown">TODAY&apos;S DEAL</p>
                      <p className="font-extrabold [overflow-wrap:anywhere]">{deal.title}</p>
                      <p className="text-xs text-brown">{deal.students_only ? "UCR students only · " : ""}{untilLabel(deal.live_until)}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <Link href={`/deals/${business.deals[0].deal_id}`} className="mt-5 flex min-h-13 items-center justify-center gap-2 rounded-button bg-green font-extrabold text-white">
                View deal <span aria-hidden="true">→</span>
              </Link>
            </>
          ) : (
            <p className="mt-5 rounded-card border bg-surface p-5 text-ink-muted">
              No deals right now. Try another nearby spot.
            </p>
          )}
        </>
      )}
    </dialog>
  );
}
