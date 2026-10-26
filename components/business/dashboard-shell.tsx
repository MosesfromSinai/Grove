import Link from "next/link";
import { Leaf } from "lucide-react";
import { DashboardNav } from "@/components/business/dashboard-nav";
import { BusinessIdentity } from "@/components/business/business-context";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex-1 bg-bg-dashboard lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <a
        href="#dashboard-content"
        className="sr-only z-50 rounded-button bg-green-dark px-4 py-3 font-bold text-surface focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <aside className="border-b border-border-strong bg-surface-dashboard p-4 sm:p-6 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:overflow-y-auto lg:border-r lg:border-b-0">
        <div className="flex flex-wrap items-center justify-between gap-3 lg:block">
          <Link href="/dashboard" aria-label="Grove business dashboard" className="inline-flex min-h-11 items-center gap-2 rounded-button text-green-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green">
            <Leaf aria-hidden="true" className="size-8" strokeWidth={2} />
            <span className="font-heading text-3xl font-extrabold tracking-tight">Grove</span>
          </Link>
          <span className="rounded-pill bg-peach px-3 py-1 text-xs font-extrabold tracking-wider text-brown lg:mt-2 lg:inline-block">BUSINESS</span>
        </div>

        <BusinessIdentity />

        <DashboardNav />

        <p className="mt-5 text-xs leading-relaxed text-ink-fine lg:mt-auto lg:pt-8">Where food finds its campus.</p>
      </aside>

      <div className="min-w-0">
        <div className="border-b border-border-strong px-4 py-3 text-sm text-ink-muted sm:px-8 lg:px-10">
          <span className="font-bold text-green-dark">Dashboard preview</span>
          <span> · Sample business. Features are being added in stages.</span>
        </div>
        <main id="dashboard-content" tabIndex={-1} className="mx-auto w-full max-w-7xl p-4 py-6 focus:outline-none sm:p-8 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
