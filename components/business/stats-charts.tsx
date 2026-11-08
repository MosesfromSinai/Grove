"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BusinessStats } from "@/lib/supabase/types";
import { hourLabel } from "./stats-format";

const tooltipStyle = { backgroundColor: "var(--color-surface-dashboard)", borderColor: "var(--color-border-strong)", borderRadius: 16, color: "var(--color-ink)", maxWidth: 240, overflowWrap: "anywhere" as const };
const tick = { fill: "var(--color-ink-fine)", fontSize: 12 };

export function StatsCharts({ stats }: { stats: BusinessStats }) {
  const hours = stats.perHour.map(row => ({ ...row, label: hourLabel(row.hour) }));
  const deals = stats.perDeal.map(row => ({ ...row, label: row.title || "Untitled deal" }));
  return <div className="mt-6 grid min-w-0 items-start gap-6 xl:grid-cols-2">
    <section aria-labelledby="stats-deals-heading" className="min-w-0 rounded-card border border-border bg-surface-dashboard p-5 shadow-card sm:p-6">
      <h2 id="stats-deals-heading" className="text-xl">Redemptions per deal</h2><p className="mt-2 text-sm text-ink-muted">Verified visits, highest first. Includes club-night deals.</p>
      <div className="mt-5 w-full min-w-0" style={{ height: Math.max(240, deals.length * 52) }}><ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={deals} layout="vertical" accessibilityLayer aria-label="Redemptions per deal chart" margin={{ top: 8, right: 18, left: 0, bottom: 8 }}>
          <CartesianGrid stroke="var(--color-border-strong)" horizontal={false} strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} tick={tick} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="label" width={112} tick={tick} axisLine={false} tickLine={false} tickFormatter={(title: string) => title.length > 17 ? `${title.slice(0, 16)}…` : title} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-green-tint)" }} />
          <Bar dataKey="count" name="Verified visits" fill="var(--color-green)" radius={[0, 6, 6, 0]} maxBarSize={28} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer></div>
      <details className="mt-4"><summary className="min-h-11 cursor-pointer rounded-button py-3 text-sm font-bold text-green-dark focus-visible:outline-2 focus-visible:outline-green">View deal data table</summary><div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Verified visits per deal for the displayed range</caption><thead><tr className="border-b border-border-strong"><th scope="col" className="py-3 pr-3">Deal</th><th scope="col" className="py-3 text-right">Verified visits</th></tr></thead><tbody>{deals.map(row => <tr key={row.deal_id} className="border-b border-border-soft"><th scope="row" className="max-w-0 py-3 pr-3 font-normal [overflow-wrap:anywhere]">{row.label}</th><td className="py-3 text-right tabular-nums">{row.count.toLocaleString("en-US")}</td></tr>)}</tbody></table></div></details>
    </section>
    <section aria-labelledby="stats-hours-heading" className="min-w-0 rounded-card border border-border bg-surface-dashboard p-5 shadow-card sm:p-6">
      <h2 id="stats-hours-heading" className="text-xl">Busiest hours</h2><p className="mt-2 text-sm text-ink-muted">Visits by hour of day · UC Riverside time.</p>
      <div className="mt-5 h-72 w-full min-w-0"><ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={hours} accessibilityLayer aria-label="Verified visits by campus hour chart" margin={{ top: 8, right: 8, left: -22, bottom: 8 }}>
          <CartesianGrid stroke="var(--color-border-strong)" vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="label" interval={5} tick={tick} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={tick} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-green-tint)" }} />
          <Bar dataKey="count" name="Verified visits" fill="var(--color-green)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer></div>
      <p className="mt-3 text-xs leading-relaxed text-ink-fine">Focus either chart and use the arrow keys, or open its data table.</p>
      <details className="mt-4"><summary className="min-h-11 cursor-pointer rounded-button py-3 text-sm font-bold text-green-dark focus-visible:outline-2 focus-visible:outline-green">View hourly data table</summary><div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Verified visits for each campus hour in the displayed range</caption><thead><tr className="border-b border-border-strong"><th scope="col" className="py-3 pr-3">Hour starting</th><th scope="col" className="py-3 text-right">Verified visits</th></tr></thead><tbody>{hours.map(row => <tr key={row.hour} className="border-b border-border-soft"><th scope="row" className="py-3 pr-3 font-normal">{row.label}</th><td className="py-3 text-right tabular-nums">{row.count.toLocaleString("en-US")}</td></tr>)}</tbody></table></div></details>
    </section>
  </div>;
}
