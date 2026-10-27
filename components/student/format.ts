import type { DiscountType } from "@/lib/supabase";

export function discountLabel(type: DiscountType | null, value: number | null): string | null {
  switch (type) {
    case "amount_off":
      return `$${value} off`;
    case "percent_off":
      return `${value}% off`;
    case "free_item":
      return "Free item";
    case "bogo":
      return "Buy one, get one";
    default:
      return null; // no student discount (club night deals)
  }
}

export function distanceLabel(meters: number): string {
  const miles = Math.max(0.1, meters / 1609.34);
  return `${miles.toFixed(1)} mi`;
}

export function timeLeftLabel(endIso: string, nowMs: number): string {
  const mins = Math.max(0, Math.floor((new Date(endIso).getTime() - nowMs) / 60000));
  if (mins < 1) return "Ending now";
  if (mins < 60) return `${mins}m left`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m left`;
}