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
// Club night dates and times are campus-local strings ("2026-11-10", "18:00"), so format them
// as written, without converting through the phone's timezone.
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function nightDateLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${DAYS[weekday]}, ${MONTHS[m - 1]} ${d}`;
}

function clock(time: string): { label: string; half: "AM" | "PM" } {
  const [h, min] = time.split(":").map(Number);
  const hour = h % 12 === 0 ? 12 : h % 12;
  return { label: min ? `${hour}:${String(min).padStart(2, "0")}` : `${hour}`, half: h < 12 ? "AM" : "PM" };
}

export function timeWindowLabel(start: string, end: string): string {
  const a = clock(start);
  const b = clock(end);
  return a.half === b.half ? `${a.label}–${b.label} ${b.half}` : `${a.label} ${a.half}–${b.label} ${b.half}`;
}
