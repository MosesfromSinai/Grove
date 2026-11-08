// @vitest-environment jsdom
import { Activity, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { MyDeals } from "./my-deals";
import { BusinessAccessError } from "@/lib/supabase/business-errors";

const api = vi.hoisted(() => ({ read: vi.fn(), end: vi.fn(), cancel: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ getMyDeals: api.read, endDeal: api.end, cancelDeal: api.cancel, isMockData: true }));
vi.mock("./business-context", () => ({ useBusiness: () => ({ profile: { business: { id: "b1" } } }), BusinessLoading: () => <p>Loading</p> }));
vi.mock("./deal-share-dialog", () => ({ DealShareDialog: ({ deal }: { deal: { title: string } }) => <div role="dialog">Sharing {deal.title}</div> }));
const rows = ["live", "scheduled", "ended"].map((status, i) => ({ id: `d${i}`, business_id: "b1", title: `Deal ${status}`, visibility: i === 1 ? "link_only" : "public", status, starts_at: "2026-11-07T20:00:00Z", ends_at: "2026-11-08T00:00:00Z", active_days: null, redemption_count: 0, students_only: true }));
let root: Root; let container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); api.read.mockReset().mockResolvedValue(rows); api.end.mockReset(); api.cancel.mockReset();
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });

test("all status tabs offer sharing including link-only and expired deals without mutations", async () => {
  await act(async () => root.render(<MyDeals />));
  for (const [index, status] of ["live", "scheduled", "ended"].entries()) {
    await act(async () => container.querySelectorAll<HTMLButtonElement>('[role="tab"]')[index].click());
    await act(async () => container.querySelector<HTMLButtonElement>(`[aria-label="Share deal: Deal ${status}"]`)!.click());
    expect(container.querySelector('[role="dialog"]')!.textContent).toContain(`Sharing Deal ${status}`);
  }
  expect(api.end).not.toHaveBeenCalled(); expect(api.cancel).not.toHaveBeenCalled();
});

test("revoked membership removes sharing and navigation cache cannot reopen a previous selection", async () => {
  const screen = (mode: "visible" | "hidden") => <Activity mode={mode}><MyDeals /></Activity>;
  await act(async () => root.render(screen("visible")));
  await act(async () => container.querySelector<HTMLButtonElement>('[aria-label="Share deal: Deal live"]')!.click());
  api.read.mockRejectedValueOnce(new BusinessAccessError("NOT_MEMBER")); await act(async () => window.dispatchEvent(new Event("focus")));
  expect(container.querySelector('[role="dialog"]')).toBeNull();
  await act(async () => root.render(screen("hidden"))); await act(async () => root.render(screen("visible")));
  expect(container.querySelector('[role="dialog"]')).toBeNull();
});
