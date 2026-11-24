// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { MyDeals } from "./my-deals";

// Share (deal link and QR) shows on live and scheduled deals only, not ended ones.
const api = vi.hoisted(() => ({ deals: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ getMyDeals: api.deals, endDeal: vi.fn(), cancelDeal: vi.fn(), isMockData: true }));
vi.mock("@/components/business/business-context", () => ({ useBusiness: () => ({ profile: { business: { id: "b1" } } }), BusinessLoading: () => null }));
vi.mock("./deal-share", () => ({ DealShare: ({ deal }: { deal: { title: string } }) => <span>share {deal.title}</span> }));

const base = { business_id: "b1", description: "", photo_url: null, ends_at: null, active_days: null, daily_start: null, daily_end: null,
  visibility: "public", students_only: true, created_at: "2026-11-01T00:00:00Z", discount_type: "amount_off", discount_value: 2, redemption_count: 0 };
let root: Root; let container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  api.deals.mockReset().mockResolvedValue([
    { ...base, id: "d1", title: "Live one", status: "live", starts_at: "2026-11-01T00:00:00Z" },
    { ...base, id: "d2", title: "Later one", status: "scheduled", starts_at: "2027-01-01T00:00:00Z" },
    { ...base, id: "d3", title: "Old one", status: "ended", starts_at: "2026-10-01T00:00:00Z", ends_at: "2026-10-02T00:00:00Z" },
  ]);
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
const tab = (label: string) => act(async () => [...container.querySelectorAll('[role="tab"]')].find((t) => t.textContent?.startsWith(label))!.dispatchEvent(new MouseEvent("click", { bubbles: true })));

test("live and scheduled deals can be shared; ended deals can't", async () => {
  await act(async () => root.render(<MyDeals />));
  expect(container.textContent).toContain("share Live one");
  await tab("Scheduled");
  expect(container.textContent).toContain("share Later one");
  await tab("Expired");
  expect(container.textContent).toContain("Old one");
  expect(container.textContent).not.toContain("share Old one");
});
