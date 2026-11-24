"use client";

// Deal card (canvas screen 4): colored tile with a countdown and the students-only badge,
// then business, offer, distance and when the live window ends.
import Link from "next/link";
import { useEffect, useState } from "react";
import type { DealCard as DealCardData } from "@/lib/supabase";
import { countdownLabel, distanceLabel } from "./format";

export type LiveDeal = Extract<DealCardData, { has_deal: true }>;

const tiles = ["bg-peach-deep", "bg-peach", "bg-green-tint"];

export function DealCard({ deal, index = 0 }: { deal: LiveDeal; index?: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <li>
      <Link href={`/deals/${deal.deal_id}`} className="block overflow-hidden rounded-card bg-surface shadow-card">
        <div className={`relative flex h-40 items-center justify-center ${tiles[index % tiles.length]}`}>
          {deal.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={deal.photo_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-brown" aria-hidden="true">
              <path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="7.5" r="1.5" />
            </svg>
          )}
          <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-pill bg-ink px-3 py-1.5 text-sm font-bold text-white" suppressHydrationWarning>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="text-orange-light" aria-hidden="true"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M9 2h6" /></svg>
            {countdownLabel(deal.live_until, now)}
          </span>
          {deal.students_only && (
            <span className="absolute top-3 right-3 flex items-center gap-1 rounded-pill bg-surface px-3 py-1.5 text-sm font-bold text-brown">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
              UCR students only
            </span>
          )}
        </div>
        <div className="p-4">
          <p className="text-sm text-ink-muted">
            {deal.business_name} · {distanceLabel(deal.distance_m)}
          </p>
          <h2 className="mt-1 text-xl">{deal.title}</h2>
        </div>
      </Link>
    </li>
  );
}
