"use client";

// Client component: lib/supabase wrappers are browser-only, like the deal page.
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getBusinessBySlug } from "@/lib/supabase";
import { discountLabel } from "@/components/student/format";

type Sticker = Awaited<ReturnType<typeof getBusinessBySlug>>;

export default function StickerPage() {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-md bg-student px-4 py-6 text-ink">
      <Suspense fallback={<p className="pt-10 text-center text-ink-muted">Loading…</p>}>
        <StickerContent />
      </Suspense>
    </div>
  );
}

function StickerContent() {
  const { slug } = useParams<{ slug: string }>();
  const [result, setResult] = useState<Sticker | undefined>(undefined); // undefined = loading
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getBusinessBySlug({ slug })
      .then((r) => !cancelled && setResult(r))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (failed) {
    return <p className="pt-10 text-center text-ink-muted">Couldn&apos;t load this restaurant. Check your connection and try again.</p>;
  }

  if (result === undefined) return <p className="pt-10 text-center text-ink-muted">Loading…</p>;

  if (!result) {
    return (
      <div className="pt-10 text-center">
        <h1 className="text-2xl">We couldn&apos;t find that restaurant</h1>
        <p className="mt-2 text-ink-muted">The sticker may be damaged or out of date.</p>
        <Link href="/feed" className="mt-6 inline-flex min-h-11 items-center rounded-button bg-ink px-6 font-semibold text-white">
          Browse deals
        </Link>
      </div>
    );
  }

  const { business, liveDeals } = result;

  return (
    <div>
      <p className="text-sm font-semibold text-green-dark">Grove</p>
      <h1 className="mt-1 text-3xl">{business.name}</h1>
      <p className="mt-1 text-sm text-ink-muted">{business.address}</p>

      {liveDeals.length === 0 ? (
        <p className="mt-8 rounded-card bg-surface p-6 text-center text-ink-muted shadow-card">No deals right now.</p>
      ) : (
        <>
          <ul className="mt-8 space-y-3">
            {liveDeals.map((deal) => {
              const discount = discountLabel(deal.discount_type, deal.discount_value);
              return (
                <li key={deal.id}>
                  <Link
                    href={`/deals/${deal.id}`}
                    className="block rounded-card border border-border bg-surface p-4 shadow-card"
                  >
                    <h2 className="text-lg">{deal.title}</h2>
                    {discount && (
                      <span className="mt-2 inline-block rounded-pill bg-orange px-3 py-1 text-xs font-semibold text-ink">
                        {discount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="mt-6 text-sm text-ink-fine">
            To redeem, open a deal in Grove, tap Redeem in store, and scan this sticker.
          </p>
        </>
      )}
    </div>
  );
}
