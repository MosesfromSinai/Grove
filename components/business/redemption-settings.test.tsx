// @vitest-environment jsdom
import { Activity, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { RedemptionSettings } from "./redemption-settings";
import type { BusinessProfile, SetPinResult } from "@/lib/supabase/types";

const state = vi.hoisted(() => ({ profile: null as BusinessProfile | null, mock: true, mode: vi.fn(), pin: vi.fn(), update: vi.fn(), refresh: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ get isMockData() { return state.mock; }, setRedemptionMode: state.mode, setPin: state.pin }));
vi.mock("./business-context", () => ({ useBusiness: () => ({ profile: state.profile, updateProfile: state.update, refresh: state.refresh }) }));
const demoPin = "0123"; // Test-only value, never a real credential.
let root: Root; let container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new Event("close")); };
  state.mock = true; state.mode.mockReset().mockResolvedValue({ ok: true, redemption_mode: "staff_scan" });
  state.pin.mockReset().mockResolvedValue({ ok: true, pin: demoPin }); state.update.mockReset().mockImplementation(value => { state.profile = value; }); state.refresh.mockReset();
  state.profile = { membership_role: "owner", pin_ready: null, business: { id: "b1", name: "Kitchen", address: "Address", lat: 33.97, lng: -117.32, hours: {}, logo_url: null, is_truck: false, open_now: true, redemption_mode: "sticker" } };
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
async function render() { await act(async () => root.render(<RedemptionSettings />)); }
function button(name: string) { return [...container.querySelectorAll<HTMLButtonElement>("button")].find(b => b.textContent === name)!; }
async function click(name: string) { await act(async () => button(name).click()); }
async function reset() { await click("Reset PIN"); await click("Reset PIN now"); await render(); }
async function selectSticker() { await act(async () => container.querySelector<HTMLInputElement>('input[value="sticker"]')!.click()); }

test("settings never reset on load, and staff scan (stretch) isn't offered", async () => {
  await render(); expect(state.pin).not.toHaveBeenCalled(); expect(state.mode).not.toHaveBeenCalled();
  expect(container.querySelector('input[value="staff_scan"]')).toBeNull();
  expect(container.querySelector<HTMLInputElement>('input[value="sticker"]')!.checked).toBe(true);
  expect(button("Save redemption mode").disabled).toBe(true);
});

test("live staff activation is unavailable while an existing staff mode can return to Sticker", async () => {
  state.mock = false; state.profile!.business.redemption_mode = "staff_scan"; state.mode.mockResolvedValue({ ok: true, redemption_mode: "sticker" }); await render();
  expect(container.querySelector<HTMLInputElement>('input[value="staff_scan"]')!.disabled).toBe(true);
  expect(container.textContent).toContain("Staff scan isn't available yet");
  await act(async () => container.querySelector<HTMLInputElement>('input[value="sticker"]')!.click());
  await click("Save redemption mode"); await click("Confirm mode change"); await render(); expect(state.profile!.business.redemption_mode).toBe("sticker");
});

test("staff and missing memberships never get owner write controls", async () => {
  state.profile!.membership_role = "staff"; await render(); expect(button("Reset PIN")).toBeUndefined(); expect(button("Save redemption mode")).toBeUndefined();
  expect(container.querySelector("fieldset")!.disabled).toBe(true); expect(state.pin).not.toHaveBeenCalled();
  state.profile = null; await render(); expect(container.textContent).toBe("");
});

test("Reset PIN requires confirmation, displays its result once, and never writes storage", async () => {
  const local = vi.spyOn(Storage.prototype, "setItem");
  await render(); await click("Reset PIN"); expect(state.pin).not.toHaveBeenCalled(); await click("Keep current settings"); expect(state.pin).not.toHaveBeenCalled();
  await reset(); expect(state.pin).toHaveBeenCalledTimes(1); expect(state.pin).toHaveBeenCalledWith({ business_id: "b1" });
  expect(container.querySelector("output")?.textContent === demoPin).toBe(true); expect(state.profile!.pin_ready).toBe(true);
  await click("I’ve saved it — hide PIN"); expect(container.querySelector("output")).toBeNull(); await render(); expect(container.querySelector("output")).toBeNull();
  expect(local).not.toHaveBeenCalled();
});

test("PIN clears on timeout, tab hiding and route removal; it is never restored", async () => {
  vi.useFakeTimers(); await render(); await reset();
  await act(async () => { vi.advanceTimersByTime(60_000); }); expect(container.querySelector("output")).toBeNull();
  await reset();
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden"); await act(async () => document.dispatchEvent(new Event("visibilitychange"))); expect(container.querySelector("output")).toBeNull();
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible"); await render(); expect(container.querySelector("output")).toBeNull();
  await reset(); await act(async () => root.render(null)); await render(); expect(container.querySelector("output")).toBeNull();
  await act(async () => { vi.advanceTimersByTime(60_000); }); expect(container.querySelector("output")).toBeNull();
});

test("double submission is blocked and late/hidden responses never reveal a PIN", async () => {
  let resolve: (result: SetPinResult) => void = () => {};
  state.pin.mockImplementationOnce(() => new Promise<SetPinResult>(done => { resolve = done; })); await render(); await click("Reset PIN");
  await act(async () => { const confirm = button("Reset PIN now"); confirm.click(); confirm.click(); }); expect(state.pin).toHaveBeenCalledTimes(1);
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden"); await act(async () => document.dispatchEvent(new Event("visibilitychange")));
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible"); await act(async () => resolve({ ok: true, pin: demoPin })); expect(container.querySelector("output")).toBeNull(); expect(container.textContent).toContain("reset while this page was hidden");
  state.pin.mockImplementationOnce(() => new Promise<SetPinResult>(done => { resolve = done; })); await click("Reset PIN"); await click("Reset PIN now");
  await act(async () => root.render(null)); state.update.mockClear(); await act(async () => resolve({ ok: true, pin: demoPin })); expect(state.update).not.toHaveBeenCalled();
});

test("Activity page caching discards the PIN before hiding and preserves no revealed value", async () => {
  const screen = (mode: "visible" | "hidden") => <Activity mode={mode}><RedemptionSettings /></Activity>;
  await act(async () => root.render(screen("visible"))); await click("Reset PIN"); await click("Reset PIN now");
  expect(container.querySelector("output")?.textContent === demoPin).toBe(true);
  await act(async () => root.render(screen("hidden"))); expect(container.querySelector("output")).toBeNull();
  await act(async () => root.render(screen("visible"))); expect(container.querySelector("output")).toBeNull(); expect(state.pin).toHaveBeenCalledTimes(1);
});

test("ambiguous network failures never claim success or automatically repeat a reset", async () => {
  state.pin.mockRejectedValueOnce(new Error("offline")); await render(); await reset();
  expect(container.textContent).toContain("reset may have completed"); expect(container.querySelector("output")).toBeNull(); expect(state.pin).toHaveBeenCalledTimes(1);
  state.profile!.business.redemption_mode = "staff_scan"; await render();
  state.mode.mockRejectedValueOnce(new Error("offline")); await selectSticker(); await click("Save redemption mode"); await click("Confirm mode change");
  expect(container.textContent).toContain("change may have saved"); expect(state.profile!.business.redemption_mode).toBe("staff_scan"); expect(button("Save redemption mode").disabled).toBe(true);
  await click("Reload business"); expect(state.refresh).toHaveBeenCalledTimes(1);
});

test("permission errors lock further actions; malformed success responses never reveal secrets", async () => {
  state.pin.mockResolvedValueOnce({ ok: true, pin: "malformed" }); await render(); await reset();
  expect(container.querySelector("output")).toBeNull(); expect(state.profile!.pin_ready).toBeNull(); expect(container.textContent).toContain("reset may have completed");
  state.pin.mockResolvedValueOnce({ ok: false, error: "NOT_OWNER" }); await reset();
  expect(button("Reset PIN").disabled).toBe(true); expect(container.textContent).toContain("Your access has changed"); expect(container.querySelector("output")).toBeNull();
});
