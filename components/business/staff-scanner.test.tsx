// @vitest-environment jsdom
import { Activity, StrictMode, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { StaffScannerPage } from "./staff-scanner";
import type { StaffRedeemResult } from "@/lib/supabase/types";
import { staffScanErrors } from "./staff-scan-format";

const api = vi.hoisted(() => ({ redeem: vi.fn(), camera: vi.fn(), stop: vi.fn(), refresh: vi.fn(), mock: true, mode: "staff_scan", callbacks: null as null | { ready: () => void; decoded: (text: string) => void; failed: () => void } }));
vi.mock("@/lib/supabase", () => ({ staffRedeem: api.redeem, get isMockData() { return api.mock; } }));
vi.mock("./business-context", () => ({ useBusiness: () => ({ profile: { business: { id: "b1", name: "Kitchen", redemption_mode: api.mode }, membership_role: "staff" }, refresh: api.refresh }), BusinessLoading: () => <p>Loading business</p> }));
vi.mock("./staff-camera", () => ({ startStaffCamera: api.camera }));
const success: StaffRedeemResult = { ok: true, deal_title: "Club night", redemption: { id: "r1", deal_id: "d1", business_id: "b1", student_id: "private-student", method: "staff_scan", redeemed_at: "2026-11-07T20:00:00Z", redeemed_on: "2026-11-07", deal_title: "Club night", business_name: "Kitchen" } };
let root: Root; let container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); api.mock = true; api.mode = "staff_scan"; api.callbacks = null;
  api.redeem.mockReset().mockResolvedValue(success); api.stop.mockReset().mockResolvedValue(undefined); api.refresh.mockReset();
  api.camera.mockReset().mockImplementation((_id, callbacks) => { api.callbacks = callbacks; return api.stop; });
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
async function show() { await act(async () => root.render(<StaffScannerPage />)); }
function button(label: string) { return [...container.querySelectorAll<HTMLButtonElement>("button")].find(b => b.textContent === label)!; }
async function click(label: string) { await act(async () => button(label).click()); }
async function scan(token = "opaque-code") { await act(async () => api.callbacks!.decoded(token)); }

test("scanner starts only on request, sends only the token once, stops and shows the canonical visit", async () => {
  await show(); expect(api.camera).not.toHaveBeenCalled(); await click("Start camera");
  await act(async () => { api.callbacks!.ready(); api.callbacks!.decoded("opaque-code"); api.callbacks!.decoded("opaque-code"); });
  expect(api.redeem).toHaveBeenCalledTimes(1); expect(api.redeem).toHaveBeenCalledWith({ token: "opaque-code" }); expect(api.stop).toHaveBeenCalled();
  expect(container.textContent).toContain("Verified"); expect(container.textContent).toContain("Club night"); expect(container.textContent).not.toContain("private-student"); expect(container.textContent).not.toContain("opaque-code");
  expect(document.activeElement).toBe(container.querySelector('[aria-labelledby="scan-verified"]'));
  await click("Scan next"); expect(container.textContent).not.toContain("One verified visit recorded"); expect(api.camera).toHaveBeenCalledTimes(2);
});
test("deal/sticker URLs are rejected without a backend call, then a fresh scan can be requested", async () => {
  await show(); await click("Start camera"); await scan("https://example.com/deals/d1"); expect(api.redeem).not.toHaveBeenCalled(); expect(container.textContent).toContain("Not valid");
  await click("Scan next"); await scan(); expect(container.textContent).toContain("Verified");
});
test.each(Object.entries(staffScanErrors))("contract error %s shows its friendly reason", async (error, reason) => {
  api.redeem.mockResolvedValueOnce({ ok: false, error }); await show(); await click("Start camera"); await scan();
  expect(container.textContent).toContain("Not valid"); expect(container.textContent).toContain(reason); expect(container.textContent).not.toContain("One verified visit recorded");
  if (["NOT_SIGNED_IN", "NOT_STAFF", "NOT_OWNER"].includes(error)) { expect(button("Scan next")).toBeUndefined(); await click("Reload business"); expect(api.refresh).toHaveBeenCalledTimes(1); }
});
test("transport and malformed/cross-business successes stay uncertain and never retry automatically", async () => {
  api.redeem.mockRejectedValueOnce(new Error("lost response")); await show(); await click("Start camera"); await scan(); expect(container.textContent).toContain("Result not confirmed"); expect(api.redeem).toHaveBeenCalledTimes(1);
  await click("I checked — scan next"); api.redeem.mockResolvedValueOnce({ ...success, redemption: { ...success.redemption, business_id: "other" } }); await scan("new-code");
  expect(container.textContent).toContain("Result not confirmed"); expect(container.textContent).not.toContain("One verified visit recorded");
});
test("leaving during a write suppresses late green results and requires explicit uncertainty acknowledgement", async () => {
  let resolve: (value: StaffRedeemResult) => void = () => {};
  api.redeem.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  const screen = (mode: "visible" | "hidden") => <Activity mode={mode}><StaffScannerPage /></Activity>;
  await act(async () => root.render(screen("visible"))); await click("Start camera"); await scan();
  await act(async () => root.render(screen("hidden"))); await act(async () => resolve(success)); await act(async () => root.render(screen("visible")));
  expect(container.textContent).toContain("Result not confirmed"); expect(container.textContent).not.toContain("One verified visit recorded"); expect(api.redeem).toHaveBeenCalledTimes(1);
  await click("I checked — scan next"); expect(api.redeem).toHaveBeenCalledTimes(1);
});
test("hidden tabs stop the camera and late startup callbacks cannot restart it", async () => {
  await show(); await click("Start camera"); const callbacks = api.callbacks!;
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
  await act(async () => document.dispatchEvent(new Event("visibilitychange")));
  await act(async () => { callbacks.ready(); callbacks.decoded("late"); });
  expect(api.stop).toHaveBeenCalled(); expect(api.redeem).not.toHaveBeenCalled(); expect(container.textContent).toContain("Camera paused");
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
});
test("camera denial/retry, stop during startup, and Strict Mode do not create extra sessions", async () => {
  await act(async () => root.render(<StrictMode><StaffScannerPage /></StrictMode>)); expect(api.camera).not.toHaveBeenCalled();
  await click("Start camera"); await act(async () => api.callbacks!.failed()); expect(container.textContent).toContain("Camera unavailable"); await click("Try camera again");
  const callbacks = api.callbacks!; await click("Stop camera"); await act(async () => callbacks.ready()); expect(container.textContent).not.toContain("Camera ready"); expect(api.redeem).not.toHaveBeenCalled();
});
test("real mode and sticker mode never open a camera or call staff-redeem", async () => {
  api.mock = false; await show(); expect(container.textContent).toContain("Staff scanning is not available yet");
  api.mock = true; api.mode = "sticker"; await show(); expect(container.textContent).toContain("This business uses counter stickers"); expect(api.camera).not.toHaveBeenCalled(); expect(api.redeem).not.toHaveBeenCalled();
});
