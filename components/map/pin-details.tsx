"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { DealCard } from "@/components/student/deal-card";
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
            <ul className="mt-4 grid gap-3" aria-label="Live deals">
              {business.deals.map((deal) => (
                <DealCard key={deal.deal_id} deal={deal} />
              ))}
            </ul>
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
