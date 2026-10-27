import { validMockImage } from "./image-input";
import type { BusinessInputErrors, Hours, SaveBusinessInput, Weekday } from "./types";

export const BUSINESS_DAYS: { key: Weekday; label: string }[] = [
  { key: "mon", label: "Monday" }, { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" }, { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" }, { key: "sat", label: "Saturday" }, { key: "sun", label: "Sunday" },
];

export function copyHours(hours: Hours): Hours {
  return Object.fromEntries(Object.entries(hours).map(([day, periods]) => [day, periods.map(([open, close]) => [open, close])])) as Hours;
}

export function validateBusinessInput(input: SaveBusinessInput):
  | { ok: true; value: SaveBusinessInput }
  | { ok: false; fields: BusinessInputErrors } {
  const fields: BusinessInputErrors = {};
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const address = typeof input.address === "string" ? input.address.trim() : "";
  if (!name) fields.name = "Enter your business name.";
  if (!address) fields.address = "Enter your business address.";
  if (typeof input.lat !== "number" || !Number.isFinite(input.lat) || input.lat < -90 || input.lat > 90) fields.lat = "Enter a latitude between -90 and 90.";
  if (typeof input.lng !== "number" || !Number.isFinite(input.lng) || input.lng < -180 || input.lng > 180) fields.lng = "Enter a longitude between -180 and 180.";
  if (typeof input.is_truck !== "boolean") fields.is_truck = "Choose whether this is a food truck.";
  if (!validMockImage(input.logo_url)) fields.logo_url = "Choose a JPG, PNG, or WebP logo up to 5 MB.";

  const time = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  if (!input.hours || typeof input.hours !== "object" || Array.isArray(input.hours)) fields.hours = "Enter valid weekly hours.";
  else for (const [day, periods] of Object.entries(input.hours)) {
    if (!BUSINESS_DAYS.some(item => item.key === day) || !Array.isArray(periods) ||
      !periods.every(period => Array.isArray(period) && period.length === 2 &&
        typeof period[0] === "string" && typeof period[1] === "string" && time.test(period[0]) && time.test(period[1]) && period[0] !== period[1])) {
      fields.hours = "Use valid opening and closing times on each open day. Opening and closing times must differ.";
    }
  }
  if (Object.keys(fields).length) return { ok: false, fields };
  return { ok: true, value: {
    business_id: input.business_id, name, address, lat: input.lat, lng: input.lng,
    hours: copyHours(input.hours), logo_url: input.logo_url, is_truck: input.is_truck,
  } };
}
