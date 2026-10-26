import { Suspense } from "react";
import Link from "next/link";
import { getDeal } from "@/lib/deals";

const errorMessages: Record<string, string> = {
  invalid: "That code isn't valid.",
  expired: "This deal has expired.",
  already_redeemed: "This deal was already redeemed.",
};

type SearchParams = Promise<{ status?: string; deal?: string; reason?: string }>;

export default function RedeemedPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<p className="pt-10 text-center text-black/50">Loading…</p>}>
      <RedeemedResult searchParams={searchParams} />
    </Suspense>
  );
}

async function RedeemedResult({ searchParams }: { searchParams: SearchParams }) {
  const { status, deal: dealId, reason } = await searchParams;
  const deal = dealId ? await getDeal(dealId) : null;

  if (status === "ok" && deal) {
    return (
      <div className="pt-10 text-center">
        <p className="text-4xl">✓</p>
        <h1 className="mt-2 text-xl font-semibold">Redeemed!</h1>
        <p className="mt-4 font-medium">{deal.title}</p>
        <p className="text-black/60">{deal.restaurant}</p>
        <Link href="/feed" className="mt-8 inline-block rounded-lg bg-black px-4 py-2 text-white">
          Back to deals
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-10 text-center">
      <h1 className="text-xl font-semibold">Couldn&apos;t redeem</h1>
      <p className="mt-2 text-black/60">{errorMessages[reason ?? ""] ?? "Something went wrong."}</p>
      <Link href="/scan" className="mt-8 inline-block rounded-lg bg-black px-4 py-2 text-white">
        Try again
      </Link>
    </div>
  );
}