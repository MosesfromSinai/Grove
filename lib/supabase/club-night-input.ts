import { campusClock } from "./deal-status";
import { campusDateTimeToISO } from "./deal-input";
import type { CreateClubNightErrors, CreateClubNightInput } from "./types";

export const MAX_GIVEBACK_LENGTH = 500;

export function validateCreateClubNight(input: CreateClubNightInput, now = new Date()):
  { ok: true; value: CreateClubNightInput } | { ok: false; fields: CreateClubNightErrors } {
  const fields: CreateClubNightErrors = {};
  const date = typeof input.night_date === "string" ? input.night_date : "";
  const start = typeof input.start_time === "string" ? input.start_time : "";
  const end = typeof input.end_time === "string" ? input.end_time : "";
  const giveback = typeof input.giveback === "string" ? input.giveback.trim() : "";
  const calendar = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T12:00:00Z`) : null;
  const validDate = calendar && Number.isFinite(calendar.getTime()) && calendar.toISOString().slice(0, 10) === date;
  if (!validDate) fields.night_date = "Choose a valid date.";
  else if (date < campusClock(now).date) fields.night_date = "Choose today or a future date in UC Riverside time.";
  const validTime = (time: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
  if (!validTime(start)) fields.start_time = "Choose a valid start time.";
  if (!validTime(end)) fields.end_time = "Choose a valid end time.";
  if (validTime(start) && validTime(end) && end <= start) fields.end_time = "End later than the start on the same date; overnight windows are not supported.";
  if (validDate && validTime(start) && !campusDateTimeToISO(`${date}T${start}`)) fields.start_time = "Choose an unambiguous campus time outside the daylight-saving transition hour.";
  const endsAt = validDate && validTime(end) ? campusDateTimeToISO(`${date}T${end}`) : null;
  if (validDate && validTime(end) && !endsAt) fields.end_time = "Choose an unambiguous campus time outside the daylight-saving transition hour.";
  else if (endsAt && Date.parse(endsAt) <= now.getTime()) fields.end_time = "The club night must end in the future.";
  if (!giveback || giveback.length > MAX_GIVEBACK_LENGTH) fields.giveback = `Describe the giveback in 1–${MAX_GIVEBACK_LENGTH} characters.`;
  if (Object.keys(fields).length) return { ok: false, fields };
  // Explicit allowlist: claim columns and deal IDs never enter a browser insert.
  return { ok: true, value: { business_id: input.business_id, night_date: date, start_time: start, end_time: end, giveback } };
}
