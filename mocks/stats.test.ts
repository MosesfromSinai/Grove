import { beforeEach, expect, test, vi } from "vitest";

let api: typeof import("./index");
let fixtures: typeof import("./data");
beforeEach(async () => { vi.resetModules(); api = await import("./index"); fixtures = await import("./data"); });

test("stats filter the selected business and half-open range across every redemption method", async () => {
  const { getBusinessStats } = api; const { redemptions } = fixtures;
  redemptions.splice(0);
  const common = { business_id: "biz-opt", student_id: "student", deal_id: "deal-opt-burrito", method: "sticker" as const };
  redemptions.push(
    { ...common, id: "before", redeemed_at: "2026-11-01T06:59:59Z" },
    { ...common, id: "start", redeemed_at: "2026-11-01T07:00:00Z" },
    { ...common, id: "pin", method: "pin", redeemed_at: "2026-11-01T08:30:00Z" },
    { ...common, id: "staff", method: "staff_scan", deal_id: "deal-opt-chess-night", redeemed_at: "2026-11-01T09:30:00Z" },
    { ...common, id: "end", redeemed_at: "2026-11-02T08:00:00Z" },
    { ...common, id: "other", business_id: "biz-pep", redeemed_at: "2026-11-01T08:30:00Z" },
  );
  const result = await getBusinessStats({ businessId: "biz-opt", from: "2026-11-01T07:00:00Z", to: "2026-11-02T08:00:00Z" });
  expect(result.total).toBe(3); expect(result.perDeal.map(row => row.count)).toEqual([2, 1]);
  expect(result.perHour).toEqual([{ hour: 0, count: 1 }, { hour: 1, count: 2 }]); // DST fold shares its local-hour bucket.
  expect(result.perDeal.some(row => row.title === "Chess Club night")).toBe(true);
});

test("mock stats never invent visits for empty ranges, missing membership or invalid dates", async () => {
  const { getBusinessStats } = api;
  expect(await getBusinessStats({ businessId: "biz-opt", from: "2000-01-01T00:00Z", to: "2000-01-02T00:00Z" })).toEqual({ total: 0, perDeal: [], perHour: [] });
  await expect(getBusinessStats({ businessId: "biz-pep", from: "2000-01-01T00:00Z", to: "2000-01-02T00:00Z" })).rejects.toMatchObject({ code: "NOT_MEMBER" });
  await expect(getBusinessStats({ businessId: "biz-opt", from: "invalid", to: "2000-01-02T00:00Z" })).rejects.toThrow("Invalid reporting period");
});
