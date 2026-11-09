// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { ClubNights } from "./club-nights";

const mock = vi.hoisted(() => ({ list: vi.fn(), claim: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ getOpenClubNights: mock.list, claimClubNight: mock.claim }));
vi.mock("qrcode", () => ({ toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,qr") }));

const night = {
  id: "night-1",
  business_id: "biz-1",
  business_name: "Orange Peel Tacos",
  night_date: "2026-11-10",
  start_time: "18:00",
  end_time: "21:00",
  giveback: "15% back to your club",
};
let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  mock.list.mockReset().mockResolvedValue([night]);
  mock.claim.mockReset();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

const text = () => container.textContent ?? "";
const button = (label: string) => [...container.querySelectorAll("button")].find((b) => b.textContent === label)!;
async function openAndClaim(club: string) {
  await act(async () => root.render(<ClubNights />));
  await act(async () => button("Claim for my club").click());
  const input = container.querySelector("input")!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, club);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => container.querySelector("form")!.requestSubmit());
}

test("lists open nights with campus date and time", async () => {
  await act(async () => root.render(<ClubNights />));
  expect(text()).toContain("Orange Peel Tacos");
  expect(text()).toContain("Tue, Nov 10 · 6–9 PM");
  expect(text()).toContain("15% back to your club");
});

test("a claim shows the deal link and QR to share", async () => {
  mock.claim.mockResolvedValue({ ok: true, club_night: night, deal_id: "deal-9" });
  await openAndClaim("  Chess Club ");
  expect(mock.claim).toHaveBeenCalledWith({ club_night_id: "night-1", club_name: "Chess Club" });
  expect(text()).toContain("Chess Club night at Orange Peel Tacos");
  expect(text()).toContain(`${window.location.origin}/deals/deal-9`);
  expect(container.querySelector("img")!.getAttribute("src")).toBe("data:image/png;base64,qr");
});

test.each([
  ["ALREADY_CLAIMED", "Another club already claimed this night."],
  ["CLUB_NIGHT_EXPIRED", "This club night has ended."],
])("%s shows a friendly message and reloads the list", async (error, message) => {
  mock.claim.mockResolvedValue({ ok: false, error });
  await openAndClaim("ACM");
  expect(text()).toContain(message);
  expect(mock.list).toHaveBeenCalledTimes(2);
});

test("a network failure keeps the form and says so", async () => {
  mock.claim.mockRejectedValue(new Error("offline"));
  await openAndClaim("ACM");
  expect(text()).toContain("Couldn't claim this night");
  expect(container.querySelector("form")).not.toBeNull();
});
