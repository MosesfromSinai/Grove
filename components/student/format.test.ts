import { expect, test } from "vitest";
import { countdownLabel, nightDateLabel, redemptionWhenLabel, timeWindowLabel, untilLabel } from "./format";

test("night dates read as written, whatever the phone's timezone", () => {
  expect(nightDateLabel("2026-11-10")).toBe("Tue, Nov 10");
  expect(nightDateLabel("2026-01-01")).toBe("Thu, Jan 1");
});

test.each([
  ["18:00", "21:00", "6–9 PM"],
  ["11:30", "14:00", "11:30 AM–2 PM"],
  ["12:00", "13:15", "12–1:15 PM"],
  ["21:00", "00:00", "9 PM–12 AM"],
])("%s to %s is %s", (start, end, label) => {
  expect(timeWindowLabel(start, end)).toBe(label);
});

test("redemptions today show the campus time, earlier ones the date", () => {
  const now = Date.parse("2026-11-09T22:00:00Z"); // 2 PM Mon, Nov 9 in Riverside
  expect(redemptionWhenLabel("2026-11-09T20:41:00Z", now)).toBe("Today · 12:41 PM");
  expect(redemptionWhenLabel("2026-11-09T17:00:00Z", now)).toBe("Today · 9:00 AM");
  expect(redemptionWhenLabel("2026-11-09T07:30:00Z", now)).toBe("Sun, Nov 8"); // 11:30 PM campus time
  expect(redemptionWhenLabel("2026-10-16T19:00:00Z", now)).toBe("Fri, Oct 16");
});

test("deal cards count down in h:mm:ss and say when the window ends, campus time", () => {
  const now = Date.parse("2026-11-09T20:00:00Z");
  expect(countdownLabel("2026-11-09T22:15:20Z", now)).toBe("2:15:20 left");
  expect(countdownLabel("2026-11-09T20:00:09Z", now)).toBe("0:00:09 left");
  expect(countdownLabel("2026-11-09T19:00:00Z", now)).toBe("Ending now");
  expect(untilLabel("2026-11-09T23:00:00Z")).toBe("Until 3 PM");
  expect(untilLabel("2026-11-09T22:30:00Z")).toBe("Until 2:30 PM");
});
