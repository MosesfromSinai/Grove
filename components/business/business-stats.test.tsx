// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { BusinessStats } from "./business-stats";

const api = vi.hoisted(() => ({ stats: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ getBusinessStats: api.stats }));
vi.mock("./business-context", () => ({ useBusiness: () => ({ profile: { business: { id: "b1" } } }), BusinessLoading: () => null }));

const week = {
  perDeal: [{ deal_id: "d1", title: "$2 off any burrito", count: 86 }, { deal_id: "d2", title: "Free horchata", count: 43 }],
  perHour: [{ hour: 12, count: 38 }, { hour: 16, count: 6 }],
  total: 129,
};
let root: Root; let container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  api.stats.mockReset().mockResolvedValue(week);
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
const show = () => act(async () => root.render(<BusinessStats />));
const text = () => container.textContent ?? "";
const days = (call: number) => {
  const { from, to } = api.stats.mock.calls[call][0];
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
};

test("shows the total, per-deal bars and the peak hour", async () => {
  await show();
  expect(api.stats).toHaveBeenCalledWith(expect.objectContaining({ businessId: "b1" }));
  expect(days(0)).toBe(7);
  expect(text()).toContain("129 verified redemptions in the last 7 days");
  expect(text()).toContain("$2 off any burrito");
  expect(text()).toContain("Peak: 12 PM");
  expect(text()).toContain("Quietest hour with any visits: 4 PM");
  expect(container.querySelector('[role="img"]')!.getAttribute("aria-label")).toContain("Busiest hour: 12 PM");
});

test("the 30-day toggle refetches a 30-day window", async () => {
  await show();
  const thirty = [...container.querySelectorAll("button")].find((b) => b.textContent === "Last 30 days")!;
  await act(async () => thirty.click());
  expect(days(1)).toBe(30);
  expect(thirty.getAttribute("aria-pressed")).toBe("true");
  expect(text()).toContain("in the last 30 days");
});

test("no visits shows the empty state", async () => {
  api.stats.mockResolvedValue({ perDeal: [], perHour: [], total: 0 });
  await show();
  expect(text()).toContain("No verified redemptions in this range yet");
});

test("a failed load says so", async () => {
  api.stats.mockRejectedValue(new Error("offline"));
  await show();
  expect(text()).toContain("Couldn't load your stats");
});
