import { CAMPUS_TZ, campusClock } from "./deal-status";
import type { CreateDealErrors, CreateDealInput } from "./types";

export const MAX_DEAL_PHOTO_BYTES = 5 * 1024 * 1024;
export const DEAL_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

function isoTimestamp(value: unknown): number {
  if (typeof value !== "string") return NaN;
  const parts = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(?::(\d{2})(\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!parts) return NaN;
  const wall = `${parts[1]}:${parts[2] ?? "00"}`;
  const calendar = new Date(`${wall}Z`);
  if (!Number.isFinite(calendar.getTime()) || calendar.toISOString().slice(0, 19) !== wall) return NaN;
  return Date.parse(value);
}

function validMockPhoto(value: unknown): boolean {
  if (value === null) return true;
  if (typeof value !== "string") return false;
  const payload = /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value)?.[1];
  if (!payload || payload.length % 4 !== 0) return false;
  const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0;
  return (payload.length / 4) * 3 - padding <= MAX_DEAL_PHOTO_BYTES;
}

export function campusDateTimeInput(at: Date): string {
  const clock = campusClock(at);
  return `${clock.date}T${clock.time}`;
}

// Resolve a campus wall time independently of the browser's timezone. Reject
// nonexistent or ambiguous DST times rather than silently shifting the schedule.
export function campusDateTimeToISO(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const wall = new Date(`${value}:00Z`);
  if (!Number.isFinite(wall.getTime()) || wall.toISOString().slice(0, 16) !== value) return null;
  const offsets = new Set<number>();
  for (const hours of [-24, 0, 24]) {
    const sample = new Date(wall.getTime() + hours * 3_600_000);
    offsets.add(new Date(`${campusDateTimeInput(sample)}:00Z`).getTime() - sample.getTime());
  }
  const matches = [...offsets]
    .map(offset => new Date(wall.getTime() - offset))
    .filter(at => campusDateTimeInput(at) === value);
  return matches.length === 1 ? matches[0].toISOString() : null;
}

export function validateCreateDealInput(input: CreateDealInput, now = Date.now()):
  | { ok: true; value: CreateDealInput }
  | { ok: false; fields: CreateDealErrors } {
  const fields: CreateDealErrors = {};
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const description = typeof input.description === "string" ? input.description.trim() : "";
  if (!title) fields.title = "Give your deal a title.";
  if (!description) fields.description = "Add a description so students know what is included.";

  const needsValue = input.discount_type === "amount_off" || input.discount_type === "percent_off";
  if (!["amount_off", "percent_off", "free_item", "bogo"].includes(input.discount_type)) {
    fields.discount_type = "Choose a discount type.";
  } else if (needsValue) {
    const value = input.discount_value;
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
      fields.discount_value = "Enter a discount greater than zero.";
    } else if (input.discount_type === "percent_off" && value > 100) {
      fields.discount_value = "Percent off must be 100 or less.";
    } else if (Math.abs(value * 100 - Math.round(value * 100)) > 0.000001) {
      fields.discount_value = "Use no more than two decimal places.";
    }
  } else if (input.discount_value !== null) {
    fields.discount_value = "Free item and BOGO deals do not use a numeric discount.";
  }

  const start = isoTimestamp(input.starts_at);
  const end = isoTimestamp(input.ends_at);
  if (!Number.isFinite(start)) fields.starts_at = "Choose a valid start date and time.";
  if (!Number.isFinite(end)) fields.ends_at = "Choose a valid end date and time.";
  else if (Number.isFinite(start) && end <= start) fields.ends_at = "End time must be after start time.";
  else if (end <= now) fields.ends_at = "End time must be in the future.";
  if (typeof input.students_only !== "boolean") fields.students_only = "Choose whether this deal is for UCR students only.";

  const photo = input.photo_url;
  if (!validMockPhoto(photo)) {
    fields.photo_url = "Choose a JPG, PNG, or WebP photo up to 5 MB.";
  }

  if (Object.keys(fields).length) return { ok: false, fields };
  return {
    ok: true,
    value: {
      business_id: input.business_id, title, description,
      discount_type: input.discount_type, discount_value: input.discount_value,
      starts_at: new Date(start).toISOString(), ends_at: new Date(end).toISOString(),
      students_only: input.students_only, photo_url: photo,
    },
  };
}

export const DEAL_TIMEZONE_LABEL = `UC Riverside time (${CAMPUS_TZ})`;
