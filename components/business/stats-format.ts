// Helpers for the Stats page (#76). Hours are campus-local 0–23 from getBusinessStats.
import type { BusinessStats } from "@/lib/supabase";

type Hour = BusinessStats["perHour"][number];

export function hourLabel(hour: number, short = false): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const half = hour < 12 ? "AM" : "PM";
  return short ? `${h}${half[0].toLowerCase()}` : `${h} ${half}`;
}

// 11 AM–8 PM like the canvas, widened to include any hour with visits; missing hours are 0.
export function hourRange(perHour: Hour[]): Hour[] {
  const hours = perHour.map((h) => h.hour);
  const first = Math.min(11, ...hours);
  const last = Math.max(20, ...hours);
  const counts = new Map(perHour.map((h) => [h.hour, h.count]));
  return Array.from({ length: last - first + 1 }, (_, i) => ({ hour: first + i, count: counts.get(first + i) ?? 0 }));
}

export function peakHour(perHour: Hour[]): Hour | null {
  return perHour.reduce<Hour | null>((best, h) => (h.count > 0 && (!best || h.count > best.count) ? h : best), null);
}

// The quietest hour that still had visits, so it never points at hours the business is closed.
export function quietestHour(perHour: Hour[]): Hour | null {
  return perHour.reduce<Hour | null>((low, h) => (h.count > 0 && (!low || h.count < low.count) ? h : low), null);
}
