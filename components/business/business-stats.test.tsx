// @vitest-environment jsdom
import { Activity, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { BusinessStatsPage } from "./business-stats";
import { BusinessAccessError } from "@/lib/supabase/business-errors";
import type { BusinessStats } from "@/lib/supabase/types";

const api = vi.hoisted(() => ({ read: vi.fn(), refresh: vi.fn(), mock: true }));
vi.mock("@/lib/supabase", () => ({ getBusinessStats: api.read, get isMockData() { return api.mock; } }));
vi.mock("./business-context", () => ({ useBusiness: () => ({ profile: { business: { id: "b1" } }, refresh: api.refresh }), BusinessLoading: () => <p>Loading business</p> }));
vi.mock("./stats-charts", () => ({ StatsCharts: ({ stats }: { stats: BusinessStats }) => <div data-testid="charts">{stats.perDeal.map(row => row.title).join(",")} · {stats.total}</div> }));
const stats = { total: 3, perDeal: [{ deal_id: "d1", title: "Club night", count: 3 }], perHour: [{ hour: 13, count: 3 }] };
let root: Root; let container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-11-07T20:00:00Z"));
  api.mock = true; api.read.mockReset().mockResolvedValue(stats); api.refresh.mockReset();
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.useRealTimers(); vi.unstubAllGlobals(); });
async function show() { await act(async () => root.render(<BusinessStatsPage />)); }
function button(label: string) { return [...container.querySelectorAll<HTMLButtonElement>("button")].find(b => b.textContent === label)!; }
async function range(value: string) { await act(async () => { const select = container.querySelector("select")!; select.value = value; select.dispatchEvent(new Event("change", { bubbles: true })); }); }

test("stats call the contract with campus boundaries and show summary/charts for the confirmed range", async () => {
  await show(); expect(api.read).toHaveBeenCalledWith({ businessId: "b1", from: "2026-11-01T07:00:00.000Z", to: "2026-11-07T20:00:00.000Z" });
  expect(container.textContent).toContain("Showing 7 days"); expect(container.textContent).toContain("1 PM"); expect(container.textContent).toContain("Club night");
  api.read.mockResolvedValueOnce({ ...stats, total: 5, perDeal: [{ ...stats.perDeal[0], count: 5 }], perHour: [{ hour: 0, count: 5 }] });
  await range("30"); expect(api.read).toHaveBeenLastCalledWith(expect.objectContaining({ from: "2026-10-09T07:00:00.000Z" })); expect(container.textContent).toContain("Showing 30 days"); expect(container.textContent).toContain("12 AM");
});

test("initial loading/error and genuine zero visits are distinct, with an explicit retry", async () => {
  let reject: (reason: Error) => void = () => {};
  api.read.mockImplementationOnce(() => new Promise((_, fail) => { reject = fail; })); await show();
  expect(container.textContent).toContain("Loading stats"); expect(container.querySelector('[data-testid="charts"]')).toBeNull();
  await act(async () => reject(new Error("offline"))); expect(container.textContent).toContain("Stats unavailable");
  api.read.mockResolvedValueOnce({ total: 0, perDeal: [], perHour: [] }); await act(async () => button("Retry stats").click());
  expect(container.textContent).toContain("No verified visits in this range"); expect(container.querySelector('[role="alert"]')).toBeNull();
});

test("range failures label retained data with its actual period and revoked membership clears it", async () => {
  await show(); api.read.mockRejectedValueOnce(new Error("offline")); await range("30");
  expect(container.textContent).toContain("out of date"); expect(container.textContent).toContain("Showing 7 days"); expect(container.textContent).not.toContain("Showing 30 days");
  api.read.mockRejectedValueOnce(new BusinessAccessError("NOT_MEMBER")); await act(async () => button("Retry stats").click());
  expect(container.textContent).not.toContain("Club night"); expect(container.textContent).not.toContain("Showing 7 days");
  await act(async () => button("Reload business").click()); expect(api.refresh).toHaveBeenCalledTimes(1);
});

test("a slower superseded range cannot overwrite the current range", async () => {
  let resolve: (rows: BusinessStats) => void = () => {};
  api.read.mockImplementationOnce(() => new Promise(done => { resolve = done; })); await show(); await range("30");
  await act(async () => resolve({ total: 0, perDeal: [], perHour: [] }));
  expect(container.textContent).toContain("Showing 30 days"); expect(container.textContent).toContain("Club night");
});

test("invalid aggregates fail and a late hidden response cannot replace a new navigation read", async () => {
  api.read.mockResolvedValueOnce({ ...stats, total: 9 }); await show(); expect(container.textContent).toContain("could not confirm"); expect(container.querySelector('[data-testid="charts"]')).toBeNull();
  let resolve: (rows: BusinessStats) => void = () => {};
  api.read.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  const screen = (mode: "visible" | "hidden") => <Activity mode={mode}><BusinessStatsPage /></Activity>;
  await act(async () => root.render(screen("visible"))); await act(async () => root.render(screen("hidden"))); await act(async () => root.render(screen("visible")));
  await act(async () => resolve({ total: 0, perDeal: [], perHour: [] })); expect(container.textContent).toContain("Club night");
});

test("real mode never calls the incomplete legacy query or presents sample stats", async () => {
  api.mock = false; await show(); expect(api.read).not.toHaveBeenCalled(); expect(container.textContent).toContain("Stats are not available yet"); expect(container.textContent).not.toContain("Demo stats"); expect(container.querySelector("select")).toBeNull();
});
