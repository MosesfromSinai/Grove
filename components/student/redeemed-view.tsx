"use client";

// Redeemed screen (canvas screen 7): live clock and moving stripes, so a screenshot won't pass.
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Redemption } from "@/lib/supabase";

const stripes = { backgroundImage: "repeating-linear-gradient(135deg, rgba(255,255,255,0.07) 0 24px, transparent 24px 48px)" };

export function RedeemedView({ redemption }: { redemption: Redemption }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={stripes} className="-mx-4 -mt-4 flex min-h-[calc(100dvh-6rem)] flex-col bg-green px-5 pt-5 pb-8 text-white">
      <p className="flex items-center gap-2 text-sm font-extrabold">
        <span className="flex size-8 items-center justify-center rounded-full bg-surface text-green" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14" /><path d="M5 19 13 11" /></svg>
        </span>
        grove · verified visit
      </p>
      <div className="relative mx-auto mt-8 flex size-40 items-center justify-center">
        <span className="absolute inset-0 rounded-full border-4 border-dashed border-white/40 motion-safe:animate-spin [animation-duration:12s]" />
        <span className="relative flex size-32 items-center justify-center rounded-full bg-surface text-green">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
        </span>
      </div>
      <h1 className="mt-4 text-center text-5xl text-white">Redeemed!</h1>
      <section className="mt-8 rounded-card bg-surface p-5 text-ink shadow-card">
        <p className="text-sm font-semibold text-ink-muted">{redemption.business_name}</p>
        <p className="font-heading text-2xl font-extrabold">{redemption.deal_title}</p>
        <div className="mt-4 flex items-end justify-between gap-3 border-t border-border pt-4">
          <div>
            <p className="text-xs font-extrabold tracking-widest text-ink-muted">LIVE TIME</p>
            <p className="font-heading text-4xl font-extrabold tabular-nums text-green-dark">{now.toLocaleTimeString()}</p>
            <p className="text-sm text-ink-muted">{now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · redeemed just now</p>
          </div>
          <span className="rounded-pill bg-green-tint px-3 py-1 text-sm font-extrabold text-green-dark">LIVE</span>
        </div>
        <p className="mt-3 flex items-center gap-2 text-sm text-ink-muted">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
          Verified UCR student
        </p>
      </section>
      <p className="mt-8 text-center font-heading text-2xl font-extrabold">Show this to the cashier.</p>
      <Link href="/feed" className="mt-auto flex min-h-13 items-center justify-center rounded-button border-2 border-white/60 font-extrabold text-white">
        Done
      </Link>
    </div>
  );
}
