// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { ClubNightPosting } from "./club-night-posting";

const api = vi.hoisted(() => ({ read: vi.fn(), cancel: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ createClubNight: vi.fn(), getClubNights: api.read, cancelClubNight: api.cancel, isMockData: true }));
vi.mock("./business-context", () => ({ useBusiness: () => ({ profile: { business: { id: "b1", name: "Kitchen" } }, refresh: vi.fn() }), BusinessLoading: () => null }));

const base = { business_id: "b1", business_name: "Kitchen", night_date: "2026-11-20", start_time: "18:00", end_time: "21:00", claimed_at: null, deal_id: null, visit_count: 0 };
const open = { ...base, id: "open1", giveback: "15% back", status: "open", claimed_club_name: null };
const claimed = { ...base, id: "claimed1", giveback: "$1 per student", status: "claimed", claimed_club_name: "Chess Club", claimed_at: "x", deal_id: "d9", visit_count: 12 };
let root: Root; let container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => { cb(0); return 1; });
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new Event("close")); };
  api.read.mockReset().mockResolvedValue([open, claimed]); api.cancel.mockReset().mockResolvedValue({ ok: true, club_night_id: "open1" });
  container = document.createElement("div"); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
const show = () => act(async () => { root.render(<ClubNightPosting />); await Promise.resolve(); });
const text = () => container.textContent ?? "";
const buttons = (label: string) => [...container.querySelectorAll("button")].filter((b) => b.textContent === label);
const click = (label: string) => act(async () => buttons(label)[0].click());

test("a claimed night shows its club and verified visits, with no Cancel", async () => {
  await show();
  expect(text()).toContain("Chess Club· 12 verified visits");
  expect(buttons("Cancel")).toHaveLength(1); // only the open night
});

test("Cancel asks first, then removes the open night", async () => {
  await show();
  await click("Cancel");
  expect(text()).toContain("Cancel this club night?");
  await click("Cancel night");
  expect(api.cancel).toHaveBeenCalledWith({ business_id: "b1", club_night_id: "open1" });
  expect(text()).not.toContain("15% back");
  expect(text()).toContain("Chess Club");
});

test("a night claimed meanwhile stays and says why", async () => {
  api.cancel.mockResolvedValue({ ok: false, error: "ALREADY_CLAIMED" });
  await show();
  await click("Cancel");
  await click("Cancel night");
  expect(text()).toContain("A club claimed this night before it was cancelled");
  expect(api.read).toHaveBeenCalledTimes(2);
});
