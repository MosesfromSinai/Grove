// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { BusinessOverviewPage } from "./business-overview";

// #94: the "I'm here now" pin button shows on the overview for food-truck owners only.
const ctx = vi.hoisted(() => ({ profile: null as unknown }));
vi.mock("@/lib/supabase", () => ({ getBusinessOverview: () => new Promise(() => {}), getMyDeals: () => new Promise(() => {}), subscribeToRedemptions: () => () => {}, isMockData: true }));
vi.mock("./business-context", () => ({ useBusiness: () => ({ profile: ctx.profile, updateProfile: vi.fn() }), BusinessName: () => "Kitchen", BusinessLoading: () => null }));
vi.mock("@/components/map/truck-location", () => ({ TruckLocation: ({ businessId }: { businessId: string }) => <p>truck pin for {businessId}</p> }));

let root: Root; let container: HTMLDivElement;
beforeEach(() => { vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
const show = (is_truck: boolean, membership_role: "owner" | "staff") => {
  ctx.profile = { membership_role, pin_ready: null, business: { id: "b1", is_truck } };
  return act(async () => root.render(<BusinessOverviewPage />));
};

test("a food-truck owner gets the pin button", async () => {
  await show(true, "owner");
  expect(container.textContent).toContain("truck pin for b1");
});

test.each([[false, "owner"], [true, "staff"]] as const)("is_truck=%s, %s: no pin button", async (truck, role) => {
  await show(truck, role);
  expect(container.textContent).not.toContain("truck pin");
});
