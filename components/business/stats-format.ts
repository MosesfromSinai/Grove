import { campusClock } from "@/lib/supabase/deal-status";
import { campusDateTimeToISO } from "@/lib/supabase/deal-input";
import type { BusinessStats } from "@/lib/supabase/types";

export type StatsDays = 7 | 30;

// Include today plus the preceding calendar days, up to this read's instant.
// Resolve each campus midnight independently instead of subtracting 24h days.
export function statsPeriod(days: StatsDays, now = new Date()) {
  const lastDate = campusClock(now).date;
  const first = new Date(`${lastDate}T12:00:00Z`);
  first.setUTCDate(first.getUTCDate() - days + 1);
  const firstDate = first.toISOString().slice(0, 10);
  const from = campusDateTimeToISO(`${firstDate}T00:00`);
  if (!from) throw new Error("Could not determine the reporting period.");
  return { days, firstDate, lastDate, from, to: now.toISOString() };
}
export type StatsPeriod = ReturnType<typeof statsPeriod>;

export const hourLabel = (hour: number) => `${hour % 12 || 12} ${hour < 12 ? "AM" : "PM"}`;

export function confirmedStats(stats: BusinessStats): BusinessStats {
  const count = (value: number) => Number.isSafeInteger(value) && value >= 0;
  if (!count(stats.total)) throw new Error("Stats totals could not be confirmed.");
  const deals = new Set<string>();
  for (const row of stats.perDeal) {
    if (!row.deal_id || deals.has(row.deal_id) || !count(row.count)) throw new Error("Stats deals could not be confirmed.");
    deals.add(row.deal_id);
  }
  const hours = new Map<number, number>();
  for (const row of stats.perHour) {
    if (!Number.isInteger(row.hour) || row.hour < 0 || row.hour > 23 || hours.has(row.hour) || !count(row.count)) throw new Error("Stats hours could not be confirmed.");
    hours.set(row.hour, row.count);
  }
  const dealTotal = stats.perDeal.reduce((sum, row) => sum + row.count, 0);
  const hourTotal = stats.perHour.reduce((sum, row) => sum + row.count, 0);
  if (dealTotal !== stats.total || hourTotal !== stats.total) throw new Error("Stats breakdowns do not match the total.");
  return {
    total: stats.total,
    perDeal: [...stats.perDeal].sort((a, b) => b.count - a.count || a.title.localeCompare(b.title) || a.deal_id.localeCompare(b.deal_id)),
    perHour: Array.from({ length: 24 }, (_, hour) => ({ hour, count: hours.get(hour) ?? 0 })),
  };
}
