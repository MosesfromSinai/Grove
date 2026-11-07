import { campusClock } from "./deal-status";
import { campusDateTimeToISO } from "./deal-input";

// Calendar arithmetic first, then resolve each midnight in campus time. A week
// starts Monday; DST weeks are not always 7 * 24 hours long.
export function overviewPeriod(now: Date) {
  const clock = campusClock(now);
  const date = new Date(`${clock.date}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].indexOf(clock.weekday));
  const todayFrom = campusDateTimeToISO(`${clock.date}T00:00`);
  const weekFrom = campusDateTimeToISO(`${date.toISOString().slice(0, 10)}T00:00`);
  if (!todayFrom || !weekFrom) throw new Error("Could not determine the campus reporting period.");
  return { todayFrom, weekFrom, asOf: now.toISOString() };
}
