import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { MyDeals } from "@/components/business/my-deals";

export const metadata: Metadata = { title: "My deals" };

export default function MyDealsPage() {
  return (
    <>
      <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl">My deals</h1>
          <p className="mt-2 text-ink-muted">Everything you&apos;ve posted, and how many students redeemed each one.</p>
        </div>
        <Link href="/dashboard/deals/new" className={buttonVariants({ size: "lg", className: "rounded-button" })}><Plus aria-hidden="true" className="size-5" />Post a deal</Link>
      </header>
      <MyDeals />
    </>
  );
}
