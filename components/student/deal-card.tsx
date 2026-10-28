"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { DealCard as DealCardData } from "@/lib/supabase";
import { discountLabel, distanceLabel, timeLeftLabel } from "./format";

export type LiveDeal = Extract<DealCardData, { has_deal: true }>;

export function DealCard({ deal }: { deal: LiveDeal }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const discount = discountLabel(deal.discount_type, deal.discount_value);

  return (
    <li>
      <Link
        href={`/deals/${deal.deal_id}`}
        className="block overflow-hidden rounded-card border border-border bg-surface shadow-card"
      >
        {deal.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={deal.photo_url} alt="" className="h-36 w-full object-cover" />
        ) : (
          <div className="flex h-36 items-center justify-center bg-peach text-brown">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
              <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
            </svg>
          </div>
        )}
        <div className="p-4">
          <p className="text-sm text-ink-muted">
            {deal.business_name} · {distanceLabel(deal.distance_m)}
          </p>
          <h2 className="mt-1 text-xl">{deal.title}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
            {discount && <span className="rounded-pill bg-orange px-3 py-1 text-ink">{discount}</span>}
            {deal.students_only && <span className="rounded-pill bg-peach px-3 py-1 text-brown">UCR students only</span>}
            <span className="text-ink-fine" suppressHydrationWarning>
              {timeLeftLabel(deal.live_until, now)}
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}