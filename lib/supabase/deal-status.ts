import type { Deal, DealStatus, Hours, Weekday } from "./types";

// Same rules as the deal_status SQL function. Times are campus time (campuses.timezone).
export const CAMPUS_TZ = "America/Los_Angeles";

type DealTiming = Pick<Deal, "starts_at" | "ends_at" | "active_days" | "daily_start" | "daily_end">;

// Weekday, date, and "HH:MM" of an instant in campus time.
export function campusClock(at: Date, timeZone: string = CAMPUS_TZ): { weekday: Weekday; date: string; time: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  return {
    weekday: String(parts.weekday).toLowerCase().slice(0, 3) as Weekday,
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

const minutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

// scheduled before starts_at, ended from ends_at on. In between, a one-time deal is live;
// a repeating deal is live only inside its daily window on its active days (scheduled otherwise).
export function dealStatus(deal: DealTiming, now: Date = new Date(), timeZone: string = CAMPUS_TZ): DealStatus {
  const t = now.getTime();
  if (t < new Date(deal.starts_at).getTime()) return "scheduled";
  if (deal.ends_at && t >= new Date(deal.ends_at).getTime()) return "ended";
  if (!deal.active_days) return "live";
  const clock = campusClock(now, timeZone);
  const inWindow =
    deal.daily_start !== null &&
    deal.daily_end !== null &&
    minutes(deal.daily_start) <= minutes(clock.time) &&
    minutes(clock.time) < minutes(deal.daily_end);
  return deal.active_days.includes(clock.weekday) && inWindow ? "live" : "scheduled";
}

// When the current live window ends, for countdowns. Null if the deal isn't live.
export function liveUntil(deal: DealTiming, now: Date = new Date(), timeZone: string = CAMPUS_TZ): string | null {
  if (dealStatus(deal, now, timeZone) !== "live") return null;
  if (!deal.active_days || !deal.daily_end) return deal.ends_at;
  const ends = deal.ends_at ? new Date(deal.ends_at).getTime() : Infinity;
  const left = (minutes(deal.daily_end) - minutes(campusClock(now, timeZone).time)) * 60_000;
  return new Date(Math.min(ends, now.getTime() + left)).toISOString();
}

const WEEK: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

// Open right now by campus time. A close earlier than the open runs past midnight, so
// yesterday's late period can still be open this morning.
export function openNow(hours: Hours, now: Date = new Date(), timeZone: string = CAMPUS_TZ): boolean {
  const { weekday, time } = campusClock(now, timeZone);
  const yesterday = WEEK[(WEEK.indexOf(weekday) + 6) % 7];
  const today = (hours[weekday] ?? []).some(([open, close]) =>
    open < close ? open <= time && time < close : open <= time,
  );
  return today || (hours[yesterday] ?? []).some(([open, close]) => close < open && time < close);
}
