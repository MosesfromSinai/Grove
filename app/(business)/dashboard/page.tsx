import Link from "next/link";
import { Activity, CalendarDays, Plus, Tags, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { BusinessName } from "@/components/business/business-context";

const summaries = [
  { label: "Today's visits", icon: Users },
  { label: "This week's visits", icon: CalendarDays },
  { label: "Active deals", icon: Tags },
];

export default function DashboardPage() {
  return (
    <>
      <header className="mb-7 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <p className="mb-1 text-sm font-bold text-green-dark [overflow-wrap:anywhere]"><BusinessName /></p>
          <h1 className="text-3xl sm:text-4xl">Overview</h1>
          <p className="mt-2 text-ink-muted">A little local love. More students through your door.</p>
        </div>
        <Link href="/dashboard/deals/new" className={buttonVariants({ size: "lg", className: "rounded-button" })}>
          <Plus aria-hidden="true" className="size-5" /> Post a deal
        </Link>
      </header>

      <section aria-label="Business summary" className="grid gap-4 sm:grid-cols-3">
        {summaries.map(({ label, icon: Icon }) => (
          <article key={label} className="rounded-card border border-border bg-surface-dashboard p-5 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-sans text-sm font-bold tracking-normal text-ink-muted">{label}</h2>
              <Icon aria-hidden="true" className="size-5 shrink-0 text-green" />
            </div>
            <p className="mt-4 font-heading text-4xl font-extrabold"><span aria-hidden="true">—</span><span className="sr-only">Not available yet</span></p>
            <p className="mt-2 text-xs text-ink-fine">Available when overview is ready</p>
          </article>
        ))}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section aria-labelledby="active-deals" className="rounded-card border border-border bg-surface-dashboard p-5 shadow-card sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-soft pb-4">
            <h2 id="active-deals" className="text-xl">Active deals</h2>
            <Link href="/dashboard/deals" className="inline-flex min-h-11 items-center rounded-button text-sm font-bold text-green-dark underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green">My deals</Link>
          </div>
          <div className="flex min-h-56 flex-col items-center justify-center py-8 text-center">
            <span className="mb-4 rounded-button bg-green-tint p-3 text-green"><Tags aria-hidden="true" className="size-6" /></span>
            <h3 className="text-lg">Your deals, at a glance</h3>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-muted">Your active deals will appear here when the overview is ready.</p>
          </div>
        </section>

        <section aria-labelledby="recent-visits" className="rounded-card border border-border bg-surface-dashboard p-5 shadow-card sm:p-6">
          <div className="border-b border-border-soft pb-4">
            <h2 id="recent-visits" className="flex min-h-11 items-center text-xl">Recent visits</h2>
          </div>
          <div className="flex min-h-56 flex-col items-center justify-center py-8 text-center">
            <span className="mb-4 rounded-button bg-peach p-3 text-brown"><Activity aria-hidden="true" className="size-6" /></span>
            <h3 className="text-lg">Every visit counts</h3>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-muted">Verified student visits will appear here when the visit feed is ready.</p>
          </div>
        </section>
      </div>
    </>
  );
}
