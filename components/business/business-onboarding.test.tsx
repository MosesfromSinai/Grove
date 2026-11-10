// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { BusinessProfile } from "@/lib/supabase/types";
import { BusinessOnboarding } from "./business-onboarding";

const state = vi.hoisted(() => ({ profile: null as BusinessProfile | null, save: vi.fn(), pin: vi.fn(), locations: vi.fn(), updateProfile: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ isMockData: false, saveBusiness: state.save, setPin: state.pin, getBusinessLocationOptions: state.locations }));
vi.mock("./business-context", () => ({ useBusiness: () => ({ profile: state.profile, updateProfile: state.updateProfile }), BusinessLoading: () => <p>Loading</p> }));
let root: Root;
let container: HTMLDivElement;
beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  state.save.mockReset(); state.pin.mockReset(); state.locations.mockReset(); state.updateProfile.mockReset();
  state.profile = { membership_role: "owner", pin_ready: null, business: { id: "b1", name: "Test Kitchen", address: "Test address", lat: 33.97, lng: -117.32, hours: {}, logo_url: "https://storage.example/existing.png", is_truck: false, open_now: false, redemption_mode: "sticker" } };
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
  await act(async () => root.render(<BusinessOnboarding />));
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
async function submit() { await act(async () => { container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); }); }

test("real onboarding preserves unknown PIN readiness and existing logo without calling setPin", async () => {
  state.save.mockResolvedValue({ ok: true, profile: state.profile });
  expect(container.querySelector<HTMLInputElement>('#business-logo')!.disabled).toBe(true);
  expect(container.querySelector('#sample-address')).toBeNull();
  expect(state.locations).not.toHaveBeenCalled();
  await submit();
  expect(state.save).toHaveBeenCalledWith(expect.objectContaining({ logo_url: "https://storage.example/existing.png" }));
  expect(state.pin).not.toHaveBeenCalled();
  expect(container.textContent).toContain("Your existing PIN was preserved");
  expect(container.querySelector('[aria-label="First staff PIN"]')).toBeNull();
});

test("a permission failure keeps the real form and never generates a PIN", async () => {
  state.save.mockResolvedValue({ ok: false, error: "NOT_OWNER" });
  await submit();
  expect(state.pin).not.toHaveBeenCalled();
  expect(container.querySelector('[role="alert"]')!.textContent).toContain("permission");
  expect(container.querySelector<HTMLInputElement>('#business-name')!.value).toBe("Test Kitchen");
});

test("staff receive an owner-access state instead of editable onboarding", async () => {
  state.profile!.membership_role = "staff";
  await act(async () => root.render(<BusinessOnboarding />));
  expect(container.textContent).toContain("Owner access required");
  expect(container.querySelector("form")).toBeNull();
});
