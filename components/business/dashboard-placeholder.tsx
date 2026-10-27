import Link from "next/link";
import { ArrowLeft, Clock3 } from "lucide-react";

export function DashboardPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <>
      <header className="mb-7">
        <h1 className="text-3xl sm:text-4xl">{title}</h1>
        <p className="mt-2 text-ink-muted">{description}</p>
      </header>
      <section aria-labelledby="coming-soon" className="rounded-card border border-border bg-surface-dashboard p-6 shadow-card sm:p-10">
        <Clock3 aria-hidden="true" className="mb-4 size-8 text-green" />
        <h2 id="coming-soon" className="text-2xl">Coming soon</h2>
        <p className="mt-2 max-w-prose text-ink-muted">This section is part of the dashboard preview. It is not available yet.</p>
        <Link href="/dashboard" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-button font-bold text-green-dark underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green">
          <ArrowLeft aria-hidden="true" className="size-4" /> Back to overview
        </Link>
      </section>
    </>
  );
}
