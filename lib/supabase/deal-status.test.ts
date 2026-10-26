import { expect, test } from "vitest";
import { dealStatus } from "./deal-status";
import type { Weekday } from "./types";

// Same examples as supabase/tests/deal_status.test.sql, so both rules stay identical.
// 2026-10-26 is a Monday and 2026-10-29 a Thursday; -07:00 is campus time (PDT).
const repeating = {
  starts_at: "2026-10-16T00:00:00-07:00",
  ends_at: null,
  active_days: ["mon", "tue", "wed"] as Weekday[],
  daily_start: "14:00",
  daily_end: "17:00",
};
const oneTime = {
  starts_at: "2026-10-26T13:00:00-07:00",
  ends_at: "2026-10-26T16:00:00-07:00",
  active_days: null,
  daily_start: null,
  daily_end: null,
};
const at = (iso: string) => new Date(iso);

test.each([
  ["Mon 3 PM is live", "2026-10-26T15:00:00-07:00", "live"],
  ["Mon 6 PM is scheduled", "2026-10-26T18:00:00-07:00", "scheduled"],
  ["Thu 3 PM is scheduled", "2026-10-29T15:00:00-07:00", "scheduled"],
  ["window start is live", "2026-10-26T14:00:00-07:00", "live"],
  ["window end is not live", "2026-10-26T17:00:00-07:00", "scheduled"],
  ["last second of the window is live", "2026-10-26T16:59:59-07:00", "live"],
])("repeating deal: %s", (_, now, expected) => {
  expect(dealStatus(repeating, at(now))).toBe(expected);
});

test.each([
  ["before starts_at is scheduled", "2026-10-26T12:59:59-07:00", "scheduled"],
  ["one-time deal is live from starts_at", "2026-10-26T13:00:00-07:00", "live"],
  ["ended from ends_at on", "2026-10-26T16:00:00-07:00", "ended"],
])("one-time deal: %s", (_, now, expected) => {
  expect(dealStatus(oneTime, at(now))).toBe(expected);
});
