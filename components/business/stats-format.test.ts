import { expect, test } from "vitest";
import { hourLabel, hourRange, peakHour, quietestHour } from "./stats-format";

test("hour labels read like the canvas", () => {
  expect(hourLabel(0)).toBe("12 AM");
  expect(hourLabel(12)).toBe("12 PM");
  expect(hourLabel(15)).toBe("3 PM");
  expect(hourLabel(11, true)).toBe("11a");
  expect(hourLabel(12, true)).toBe("12p");
});

test("the hour range covers 11 AM–8 PM, widens for outliers, and fills zeros", () => {
  expect(hourRange([]).map((h) => h.hour)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
  const wide = hourRange([{ hour: 9, count: 2 }, { hour: 22, count: 1 }]);
  expect(wide[0]).toEqual({ hour: 9, count: 2 });
  expect(wide.at(-1)).toEqual({ hour: 22, count: 1 });
  expect(wide.find((h) => h.hour === 12)).toEqual({ hour: 12, count: 0 });
});

test("peak and quietest ignore empty hours", () => {
  const hours = [{ hour: 11, count: 0 }, { hour: 12, count: 38 }, { hour: 16, count: 6 }, { hour: 17, count: 14 }];
  expect(peakHour(hours)).toEqual({ hour: 12, count: 38 });
  expect(quietestHour(hours)).toEqual({ hour: 16, count: 6 });
  expect(peakHour([{ hour: 11, count: 0 }])).toBeNull();
});
