"use client";

// Client component: getDeal() runs in the browser with the student's session, so
// redeemed_today ("Already used today") is right. lib/supabase wrappers are browser-only.
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getDeal, type DealDetail } from "@/lib/supabase";
import { discountLabel } from "@/components/student/format";

export default function DealPage() {
  return (
    <Suspense fallback={<p className="pt-10 text-center text-ink-muted">Loading…</p>}>
      <DealContent />
    </Suspense>
  );
}

function DealContent() {
  const { id } = useParams<{ id: string }>();
  const [deal, setDeal] = useState<DealDetail | null | undefined>(undefined);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getDeal({ id })
      .then((d) => !cancelled && setDeal(d))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (failed) {
    return <p className="pt-10 text-center text-ink-muted">Couldn&apos;t load this deal. Check your connection and try again.</p>;
  }

  if (deal === undefined) return <p className="pt-10 text-center text-ink-muted">Loading…</p>;

  if (!deal) {
    return (
      <div className="pt-10 text-center">
        <h1 className="text-2xl">Deal not found</h1>
        <p className="mt-2 text-ink-muted">This deal may have ended or the link is wrong.</p>
        <Link href="/feed" className="mt-6 inline-flex min-h-11 items-center rounded-button bg-ink px-6 font-semibold text-white">
          Back to deals
        </Link>
      </div>
    );
  }

  const discount = discountLabel(deal.discount_type, deal.discount_value);
  const canRedeem = deal.status === "live" && !deal.redeemed_today;

  return (
    <div>
      <p className="text-sm text-ink-muted">{deal.business.name}</p>
      <h1 className="mt-1 text-3xl">{deal.title}</h1>
      {discount && (
        <span className="mt-3 inline-block rounded-pill bg-orange px-3 py-1 text-sm font-semibold text-ink">{discount}</span>
      )}
      {deal.description && <p className="mt-4 text-ink-muted">{deal.description}</p>}
      <p className="mt-4 text-sm text-ink-fine">{deal.business.address}</p>

      <div className="mt-8">
        {canRedeem ? (
          <Link
            href={`/scan?deal=${deal.id}`}
            className="flex min-h-12 items-center justify-center rounded-button bg-orange px-6 text-lg font-bold text-ink"
          >
            Redeem in store
          </Link>
        ) : (
          <p className="rounded-button bg-peach px-4 py-3 text-center font-semibold text-brown">
            {deal.redeemed_today ? "Already used today" : "Not live right now"}
          </p>
        )}
      </div>
    </div>
  );
}
