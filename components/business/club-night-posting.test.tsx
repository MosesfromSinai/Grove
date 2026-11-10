// @vitest-environment jsdom
import { Activity, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { ClubNightPosting } from "./club-night-posting";
import { BusinessAccessError } from "@/lib/supabase/business-errors";
import type { CreateClubNightResult } from "@/lib/supabase/types";

const api = vi.hoisted(() => ({ create: vi.fn(), read: vi.fn(), refresh: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ createClubNight: api.create, getClubNights: api.read, isMockData: true }));
vi.mock("./business-context", () => ({ useBusiness: () => ({ profile: { business: { id: "b1", name: "Kitchen" } }, refresh: api.refresh }), BusinessLoading: () => <p>Loading business</p> }));
const night = { id: "night1", business_id: "b1", business_name: "Kitchen", night_date: "2026-11-07", start_time: "18:00", end_time: "21:00", giveback: "15% back to your club" };
let root: Root; let container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 1; });
  vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-11-06T20:00:00Z"));
  api.create.mockReset().mockResolvedValue({ ok: true, club_night: night }); api.read.mockReset().mockResolvedValue([]); api.refresh.mockReset();
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.useRealTimers(); vi.unstubAllGlobals(); });
async function show() { await act(async () => root.render(<ClubNightPosting />)); }
async function fill(values: Record<string, string> = { night_date: night.night_date, start_time: night.start_time, end_time: night.end_time, giveback: night.giveback }) {
  await act(async () => {
    for (const [name, value] of Object.entries(values)) {
      const element = container.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`)!;
      const prototype = element.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(element, value);
      element.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
}
async function submit() { await act(async () => container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))); }
function button(text: string) { return [...container.querySelectorAll<HTMLButtonElement>("button")].find(b => b.textContent === text)!; }
async function click(text: string) { await act(async () => button(text).click()); }

test("invalid submission focuses an accessible summary and preserves the draft without writes", async () => {
  await show(); await submit(); expect(api.create).not.toHaveBeenCalled();
  expect(document.activeElement).toBe(container.querySelector('[role="alert"]')); expect(container.querySelector('#night-date')!.getAttribute("aria-invalid")).toBe("true");
  await fill(); await fill({ end_time: "17:00" }); await submit(); expect(api.create).not.toHaveBeenCalled();
  expect(container.querySelector<HTMLInputElement>('#night-giveback')!.value).toBe(night.giveback); expect(container.textContent).toContain("End later than the start");
});

test("post confirms the canonical record once, refreshes receipts and requires a new-post action", async () => {
  await show(); await fill(); await submit();
  expect(api.create).toHaveBeenCalledWith({ business_id: "b1", night_date: night.night_date, start_time: "18:00", end_time: "21:00", giveback: night.giveback });
  expect(container.textContent).toContain("Club night saved to the demo"); expect(container.querySelector("form")).toBeNull(); expect(api.read.mock.calls.length).toBeGreaterThan(1);
  await click("Post another night"); expect(container.querySelector<HTMLInputElement>('#night-date')!.value).toBe(""); expect(api.create).toHaveBeenCalledTimes(1);
});

test("an uncertain save locks retries until a fresh posted-night read and explicit new draft", async () => {
  api.create.mockRejectedValueOnce(new Error("connection lost")); await show(); await fill(); await submit();
  expect(container.textContent).toContain("may have been posted"); expect(button("Post open club night").disabled).toBe(true); expect(button("I’ve checked — start a new post").disabled).toBe(true);
  await submit(); expect(api.create).toHaveBeenCalledTimes(1);
  api.read.mockResolvedValueOnce([{ ...night, status: "claimed", claimed_club_name: "Private club", visit_count: 9 }]);
  await click("Refresh posted nights"); expect(button("I’ve checked — start a new post").disabled).toBe(false); expect(container.textContent).toContain("Claimed"); expect(container.textContent).toContain("Private club· 9 verified visits"); // #114 shows club results
  await click("I’ve checked — start a new post"); expect(container.querySelector<HTMLInputElement>('#night-giveback')!.value).toBe(""); expect(button("Post open club night").disabled).toBe(false);
});

test("read outages are retryable, while membership loss clears stale data and locks posting", async () => {
  api.read.mockRejectedValueOnce(new Error("offline")); await show(); expect(container.textContent).toContain("could not refresh");
  await click("Refresh posted nights"); expect(container.textContent).toContain("No posted club nights");
  api.read.mockRejectedValueOnce(new BusinessAccessError("NOT_MEMBER")); await click("Refresh posted nights"); expect(button("Post open club night").disabled).toBe(true);
  await click("Reload business"); expect(api.refresh).toHaveBeenCalledTimes(1); expect(api.create).not.toHaveBeenCalled();
});

test("server field errors remain editable and permission failures cannot be retried as another write", async () => {
  api.create.mockResolvedValueOnce({ ok: false, error: "INVALID_CLUB_NIGHT", fields: { end_time: "The window has ended." } });
  await show(); await fill(); await submit(); expect(container.textContent).toContain("window has ended"); expect(button("Post open club night").disabled).toBe(false);
  api.create.mockResolvedValueOnce({ ok: false, error: "NOT_OWNER" }); await submit(); expect(button("Post open club night").disabled).toBe(true); expect(container.textContent).toContain("access has changed");
});

test("pending posts reject duplicate submission and caching a pending post requires receipt checks", async () => {
  let resolve: (result: CreateClubNightResult) => void = () => {};
  api.create.mockImplementationOnce(() => new Promise<CreateClubNightResult>(done => { resolve = done; }));
  const screen = (mode: "visible" | "hidden") => <Activity mode={mode}><ClubNightPosting /></Activity>;
  await act(async () => root.render(screen("visible"))); await fill();
  await act(async () => { const form = container.querySelector("form")!; form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
  expect(api.create).toHaveBeenCalledTimes(1);
  await act(async () => root.render(screen("hidden"))); await act(async () => resolve({ ok: true, club_night: night }));
  await act(async () => root.render(screen("visible"))); expect(container.textContent).toContain("post was in progress when you left"); expect(container.textContent).not.toContain("Club night saved to the demo"); expect(button("Post open club night").disabled).toBe(true);
});
