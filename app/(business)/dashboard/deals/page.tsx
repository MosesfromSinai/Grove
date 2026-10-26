import type { Metadata } from "next";
import { MyDeals } from "@/components/business/my-deals";

export const metadata: Metadata = { title: "My deals" };

export default function MyDealsPage() {
  return (
    <>
      <header className="mb-7">
        <h1 className="text-3xl sm:text-4xl">My deals</h1>
        <p className="mt-2 text-ink-muted">Manage your active, scheduled, and expired deals.</p>
      </header>
      <MyDeals />
    </>
  );
}
