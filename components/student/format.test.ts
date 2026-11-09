import { expect, test } from "vitest";
import { nightDateLabel, timeWindowLabel } from "./format";

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
