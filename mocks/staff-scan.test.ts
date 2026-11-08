import { afterEach, beforeEach, expect, test, vi } from "vitest";

let api: typeof import("./index"); let fixtures: typeof import("./data");
beforeEach(async () => {
  vi.resetModules(); vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-11-07T20:00:00Z"));
  api = await import("./index"); fixtures = await import("./data");
});
afterEach(() => vi.useRealTimers());

test("a student code records exactly one staff-scan visit and notifies the selected business", async () => {
  const issued = await api.issueCode({ deal_id: "deal-opt-horchata" }); expect(issued.ok).toBe(true); if (!issued.ok) return;
  const heard: unknown[] = []; const stop = api.subscribeToRedemptions({ businessId: "biz-opt" }, row => heard.push(row)); const before = fixtures.redemptions.length;
  const result = await api.staffRedeem({ token: issued.token }); stop();
  expect(result).toMatchObject({ ok: true, deal_title: "Free horchata with any combo", redemption: { business_id: "biz-opt", deal_id: "deal-opt-horchata", method: "staff_scan" } });
  expect(fixtures.redemptions).toHaveLength(before + 1); expect(heard).toHaveLength(1);
  expect(await api.staffRedeem({ token: issued.token })).toEqual({ ok: false, error: "CODE_EXPIRED" }); expect(fixtures.redemptions).toHaveLength(before + 1);
});
test("codes expire at their exact deadline and cannot record a visit", async () => {
  const issued = await api.issueCode({ deal_id: "deal-opt-horchata" }); expect(issued.ok).toBe(true); if (!issued.ok) return;
  const before = fixtures.redemptions.length; vi.setSystemTime(new Date(issued.expires_at));
  expect(await api.staffRedeem({ token: issued.token })).toEqual({ ok: false, error: "CODE_EXPIRED" }); expect(fixtures.redemptions).toHaveLength(before);
});
test("another business's valid code is refused without recording or consuming it", async () => {
  const other = fixtures.deals.find(deal => deal.business_id !== "biz-opt" && !deal.active_days && Date.parse(deal.starts_at) < Date.now() && Date.parse(deal.ends_at!) > Date.now())!;
  const issued = await api.issueCode({ deal_id: other.id }); expect(issued.ok).toBe(true); if (!issued.ok) return;
  const before = fixtures.redemptions.length;
  expect(await api.staffRedeem({ token: issued.token })).toEqual({ ok: false, error: "NOT_STAFF" }); expect(fixtures.redemptions).toHaveLength(before);
});
test("ending a deal after code issuance prevents a staff visit", async () => {
  const issued = await api.issueCode({ deal_id: "deal-opt-horchata" }); expect(issued.ok).toBe(true); if (!issued.ok) return;
  const before = fixtures.redemptions.length; fixtures.deals.find(deal => deal.id === "deal-opt-horchata")!.ends_at = new Date().toISOString();
  expect(await api.staffRedeem({ token: issued.token })).toEqual({ ok: false, error: "DEAL_NOT_LIVE" }); expect(fixtures.redemptions).toHaveLength(before);
});
