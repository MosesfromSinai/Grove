import { expect, test } from "vitest";
import { confirmedStats, hourLabel, statsPeriod } from "./stats-format";

test("stats use campus calendar days through the read instant across DST, year and UTC date boundaries", () => {
  expect(statsPeriod(7, new Date("2026-11-07T20:00:00Z"))).toMatchObject({ firstDate: "2026-11-01", lastDate: "2026-11-07", from: "2026-11-01T07:00:00.000Z", to: "2026-11-07T20:00:00.000Z" });
  expect(statsPeriod(7, new Date("2026-03-10T19:00:00Z"))).toMatchObject({ firstDate: "2026-03-04", from: "2026-03-04T08:00:00.000Z" });
  expect(statsPeriod(30, new Date("2027-01-02T07:59:59Z"))).toMatchObject({ firstDate: "2026-12-03", lastDate: "2027-01-01", from: "2026-12-03T08:00:00.000Z" });
});

test("stats retain all deals, fill true zero hours and use complete hour labels", () => {
  const result = confirmedStats({ total: 3, perDeal: [{ deal_id: "b", title: "Club", count: 1 }, { deal_id: "a", title: "Lunch", count: 2 }], perHour: [{ hour: 13, count: 3 }] });
  expect(result.perDeal.map(row => row.deal_id)).toEqual(["a", "b"]); expect(result.perHour).toHaveLength(24);
  expect(result.perHour[13]).toEqual({ hour: 13, count: 3 }); expect(result.perHour[0].count).toBe(0);
  expect([0, 12, 23].map(hourLabel)).toEqual(["12 AM", "12 PM", "11 PM"]);
  expect(confirmedStats({ total: 0, perDeal: [], perHour: [] }).total).toBe(0);
});

test("invalid, duplicate or inconsistent stats fail instead of displaying misleading charts", () => {
  const valid = { total: 1, perDeal: [{ deal_id: "d1", title: "Lunch", count: 1 }], perHour: [{ hour: 13, count: 1 }] };
  for (const patch of [
    { total: -1 }, { total: NaN }, { total: 1.5 }, { total: 2 },
    { perDeal: [...valid.perDeal, ...valid.perDeal] }, { perDeal: [{ ...valid.perDeal[0], count: -1 }] },
    { perHour: [{ hour: 24, count: 1 }] }, { perHour: [{ hour: 13.5, count: 1 }] }, { perHour: [{ hour: 13, count: NaN }] },
    { perHour: [...valid.perHour, ...valid.perHour] }, { perHour: [] },
  ]) expect(() => confirmedStats({ ...valid, ...patch })).toThrow();
});
