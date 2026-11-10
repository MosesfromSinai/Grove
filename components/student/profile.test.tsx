// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { campusClock } from "@/lib/supabase/deal-status";
import { Profile } from "./profile";

const mock = vi.hoisted(() => ({ profile: vi.fn(), redemptions: vi.fn(), signOut: vi.fn() }));
vi.mock("@/lib/supabase", async (original) => ({
  ...(await original<typeof import("@/lib/supabase")>()),
  getMyProfile: mock.profile,
  getMyRedemptions: mock.redemptions,
  signOut: mock.signOut,
}));

const jordan = { full_name: "Jordan Reyes", email: "jordan.r@ucr.edu", campus_name: "UC Riverside", verified_student: true };
const visit = (id: string, at: Date) => ({
  id, deal_id: "d", business_id: "b", student_id: "s", method: "sticker" as const,
  redeemed_at: at.toISOString(), redeemed_on: campusClock(at).date,
  deal_title: "$2 off any burrito", business_name: "Orange Peel Tacos",
});
let root: Root;
let container: HTMLDivElement;
const assign = vi.fn();

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("location", { ...window.location, assign });
  mock.profile.mockReset().mockResolvedValue(jordan);
  mock.redemptions.mockReset().mockResolvedValue([]);
  mock.signOut.mockReset().mockResolvedValue(undefined);
  assign.mockReset();
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
const render = () => act(async () => root.render(<Profile />));
const signOutButton = () => [...container.querySelectorAll("button")].find((b) => b.textContent?.includes("Sign out"))!;

test("shows name, school, email and the verified badge", async () => {
  await render();
  expect(container.querySelector("h1")!.textContent).toBe("Jordan Reyes");
  expect(text()).toContain("UC Riverside · jordan.r@ucr.edu");
  expect(text()).toContain("Verified student");
  expect(text()).toContain("JR");
});

test("lists past redemptions with this month's count", async () => {
  const today = new Date();
  mock.redemptions.mockResolvedValue([visit("r1", today), visit("r2", new Date("2025-03-14T19:00:00Z"))]);
  await render();
  expect(container.querySelectorAll("li")).toHaveLength(2);
  expect(text()).toContain("$2 off any burrito");
  expect(text()).toContain("Fri, Mar 14");
  expect(text()).toContain("1 this month");
});

test("shows an empty state with no redemptions", async () => {
  await render();
  expect(text()).toContain("No redemptions yet");
  expect(text()).not.toContain("this month");
});

test("sign out ends the session and reloads to sign-in", async () => {
  await render();
  await act(async () => signOutButton().click());
  expect(mock.signOut).toHaveBeenCalledOnce();
  expect(assign).toHaveBeenCalledWith("/sign-in");
});

test("a failed sign out says so and stays", async () => {
  mock.signOut.mockRejectedValue(new Error("offline"));
  await render();
  await act(async () => signOutButton().click());
  expect(text()).toContain("Couldn't sign out");
  expect(assign).not.toHaveBeenCalled();
});

test("a load failure shows a message", async () => {
  mock.profile.mockRejectedValue(new Error("offline"));
  await render();
  expect(text()).toContain("Couldn't load your profile");
});
