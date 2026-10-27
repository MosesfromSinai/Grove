"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Redemption } from "@/lib/supabase";

export function RedeemedView({ redemption }: { redemption: Redemption }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="-mx-4 -mt-4 flex min-h-[calc(100dvh-6rem)] flex-col items-center justify-center gap-3 bg-green px-6 text-center text-white">
      <div className="relative mb-2 flex h-24 w-24 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-white/30" />
        <span className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white text-green">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
      </div>
      <h1 className="text-4xl">Redeemed</h1>
      <p className="text-lg font-semibold">{redemption.deal_title}</p>
      <p>{redemption.business_name}</p>
      <p className="font-heading text-4xl font-extrabold tabular-nums">{now.toLocaleTimeString()}</p>
      <p className="text-sm text-white/80">Show this screen to the cashier</p>
      <Link href="/feed" className="mt-4 inline-flex min-h-11 items-center rounded-button bg-white px-6 font-semibold text-green-dark">
        Back to deals
      </Link>
    </div>
  );
}