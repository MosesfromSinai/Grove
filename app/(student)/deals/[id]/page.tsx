import { Suspense } from "react";
import Link from "next/link";
import { getDeal } from "@/lib/supabase";
import { discountLabel } from "@/components/student/format";

export default function DealPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="pt-10 text-center text-ink-muted">Loading…</p>}>
      <DealContent params={params} />
    </Suspense>
  );
}

async function DealContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = await getDeal({ id });

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