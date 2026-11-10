// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { BusinessOverviewPage } from "./business-overview";
import { BusinessAccessError } from "@/lib/supabase/business-errors";
import type { BusinessOverview, Redemption, RedemptionConnection } from "@/lib/supabase/types";

const api = vi.hoisted(() => ({ overview: vi.fn(), deals: vi.fn(), subscribe: vi.fn(), stop: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ getBusinessOverview: api.overview, getMyDeals: api.deals, subscribeToRedemptions: api.subscribe, isMockData: true }));
vi.mock("./business-context", () => ({ useBusiness: () => ({ profile: { business: { id: "b1" } } }), BusinessName: () => "Kitchen", BusinessLoading: () => <p>Business access needed</p> }));
const instant = "2026-11-06T20:00:00Z";
const visit: Redemption = { id: "r1", business_id: "b1", deal_id: "d1", student_id: "private-student", redeemed_at: instant, redeemed_on: "2026-11-06", method: "pin", deal_title: "Lunch", business_name: "Kitchen" };
const summary: BusinessOverview = { today: 2, week: 7, recentVisits: [visit], as_of: instant };
let root: Root; let container: HTMLDivElement;
let event: (visit: Redemption) => void; let status: (state: RedemptionConnection) => void;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); vi.useFakeTimers(); vi.setSystemTime(new Date(instant));
  api.overview.mockReset().mockResolvedValue(summary); api.deals.mockReset().mockResolvedValue([]); api.stop.mockReset();
  api.subscribe.mockReset().mockImplementation((_input, onVisit, onStatus) => { event = onVisit; status = onStatus; return api.stop; });
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.useRealTimers(); vi.unstubAllGlobals(); });
async function show() { await act(async () => root.render(<BusinessOverviewPage />)); }
function button(name: string) { return [...container.querySelectorAll<HTMLButtonElement>("button")].find(b => b.textContent === name)!; }
function value(label: string) { return [...container.querySelectorAll("article")].find(a => a.querySelector("h2")?.textContent === label)!.querySelector("p")!.textContent; }

test("overview shows exact summaries, anonymous feed, active windows and empty states", async () => {
  const timing = { business_id: "b1", description: "Special", starts_at: "2026-11-01T08:00Z", ends_at: null, active_days: ["fri"], daily_start: "12:00", daily_end: "13:00", visibility: "link_only" };
  api.deals.mockResolvedValue([{ ...timing, id: "d1", title: "Live lunch", status: "ended" }, { ...timing, id: "d2", title: "Later", daily_start: "14:00", daily_end: "15:00", status: "live" }]);
  await show();
  expect(value("Today's redemptions")).toBe("2"); expect(value("This week's redemptions")).toBe("7"); expect(value("Active deals")).toBe("1");
  expect(container.querySelector("#active-deals")!.parentElement!.parentElement!.textContent).toContain("Live lunch");
  expect(container.querySelector("#active-deals")!.parentElement!.parentElement!.textContent).not.toContain("Later");
  expect(container.textContent).toContain("Backup PIN"); expect(container.textContent).not.toContain("private-student");
  await act(async () => { vi.advanceTimersByTime(3_600_000); });
  expect(value("Active deals")).toBe("0"); expect(container.textContent).toContain("No deals live right now");
});

test("events refresh canonical data and duplicate deliveries cannot inflate counts or feed", async () => {
  await show();
  let resolve: (value: BusinessOverview) => void = () => {};
  api.overview.mockImplementationOnce(() => new Promise<BusinessOverview>(done => { resolve = done; })).mockResolvedValue({ ...summary, today: 3, week: 8 });
  await act(async () => { event(visit); event(visit); event(visit); });
  await act(async () => resolve({ ...summary, today: 3, week: 8 }));
  expect(value("Today's redemptions")).toBe("3"); expect(value("This week's redemptions")).toBe("8");
  expect(container.querySelectorAll("ol li")).toHaveLength(1); expect(api.overview).toHaveBeenCalledTimes(3);
  const count = api.overview.mock.calls.length;
  await act(async () => event({ ...visit, business_id: "foreign" })); expect(api.overview).toHaveBeenCalledTimes(count);
});

test("reconnection and minute refresh recover gaps; failures retain clearly stale data", async () => {
  await show();
  await act(async () => status("reconnecting")); expect(container.textContent).toContain("Reconnecting");
  api.overview.mockResolvedValueOnce({ ...summary, today: 5 });
  await act(async () => status("live")); expect(value("Today's redemptions")).toBe("5");
  api.overview.mockRejectedValueOnce(new Error("offline"));
  await act(async () => { vi.advanceTimersByTime(60_000); });
  expect(container.querySelector('[role="alert"]')!.textContent).toContain("last successfully loaded values");
  expect(value("Today's redemptions")).toBe("5"); expect(container.textContent).toContain("Refresh needed");
  await act(async () => button("Retry overview").click()); expect(container.querySelector('[role="alert"]')).toBeNull();
});

test("access revocation clears old business values and retry recovers without invented zeros", async () => {
  api.overview.mockRejectedValueOnce(new Error("offline")); await show();
  expect(value("Today's redemptions")).toBe("—Unavailable"); expect(container.textContent).not.toContain("No deals live right now");
  await act(async () => button("Retry overview").click()); expect(value("Today's redemptions")).toBe("2");
  api.overview.mockRejectedValueOnce(new BusinessAccessError("NOT_MEMBER"));
  await act(async () => button("Refresh overview").click());
  expect(value("Today's redemptions")).toBe("—Unavailable"); expect(container.textContent).toContain("current membership");
});

test("unmount cleans subscriptions, timers and ignores late responses", async () => {
  let resolve: (value: BusinessOverview) => void = () => {};
  api.overview.mockImplementation(() => new Promise<BusinessOverview>(done => { resolve = done; })); await show();
  await act(async () => root.unmount()); expect(api.stop).toHaveBeenCalledTimes(1); expect(vi.getTimerCount()).toBe(0);
  await act(async () => { resolve(summary); event(visit); status("live"); }); expect(container.textContent).toBe(""); expect(api.overview).toHaveBeenCalledTimes(1);
  root = createRoot(container);
});
