import Link from "next/link";
import { Leaf } from "lucide-react";
import { DashboardNav, DashboardTip } from "@/components/business/dashboard-nav";
import { BusinessIdentity, BusinessDataNotice } from "@/components/business/business-context";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex-1 bg-bg-dashboard lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <a
        href="#dashboard-content"
        className="sr-only z-50 rounded-button bg-green-dark px-4 py-3 font-bold text-surface focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <aside className="border-b border-border-strong bg-surface-dashboard p-4 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:overflow-y-auto lg:border-r lg:border-b-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/dashboard" aria-label="Grove business dashboard" className="inline-flex min-h-11 items-center gap-2 rounded-button text-green-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green">
            <span className="flex size-9 items-center justify-center rounded-pill bg-green text-surface"><Leaf aria-hidden="true" className="size-5" strokeWidth={2} /></span>
            <span className="font-heading text-2xl font-extrabold tracking-tight">grove</span>
          </Link>
          <span className="rounded-button bg-peach px-2 py-1 text-xs font-extrabold tracking-wider text-brown">BUSINESS</span>
        </div>

        <BusinessIdentity />

        <DashboardNav />

        <DashboardTip />
      </aside>

      <div className="min-w-0">
        <BusinessDataNotice />
        <main id="dashboard-content" tabIndex={-1} className="mx-auto w-full max-w-7xl p-4 py-6 focus:outline-none sm:p-8 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
