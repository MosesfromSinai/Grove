import type { OpenClubNight } from "@/lib/supabase/types";

// These are stored campus calendar/clock fields, not UTC instants. Format the
// literal wall time without resolving DST; existing nights can span its folds.
const dateFormat = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" });
const timeFormat = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", hour: "numeric", minute: "2-digit" });
export function clubNightSchedule(night: Pick<OpenClubNight, "night_date" | "start_time" | "end_time">, fallback = "Date or time unavailable"): string {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(night.night_date) ? new Date(`${night.night_date}T12:00:00Z`) : null;
  const validTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  if (!date || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== night.night_date || !validTime(night.start_time) || !validTime(night.end_time)) return fallback;
  return `${dateFormat.format(date)} · ${timeFormat.format(new Date(`2000-01-01T${night.start_time}:00Z`))}–${timeFormat.format(new Date(`2000-01-01T${night.end_time}:00Z`))}`;
}
